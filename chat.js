/* ============================================
   CAMPUS CONNECT — Chat Module
   Mensajería en tiempo real con Supabase
   ============================================ */

// ─── Abrir o crear conversación ───
async function openOrCreateConversation(sellerId, productId) {
  const user = await getCurrentUser();
  if (!user) {
    showToast('Debes iniciar sesión para enviar mensajes.');
    setTimeout(() => window.location.href = 'cuenta.html', 1200);
    return null;
  }

  if (user.id === sellerId) {
    showToast('No puedes enviarte un mensaje a ti mismo.');
    return null;
  }

  // Buscar conversación existente
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('seller_id', sellerId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) return existing.id;

  // Crear nueva conversación
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      buyer_id: user.id,
      seller_id: sellerId,
      product_id: productId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    showToast('Error al crear la conversación.');
    return null;
  }

  return data.id;
}

// ─── Cargar conversaciones del usuario ───
async function loadConversations() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, last_message_at, product_id,
      buyer_id, seller_id,
      products ( title ),
      buyer:profiles!conversations_buyer_id_fkey ( first_name, last_name, avatar_url ),
      seller:profiles!conversations_seller_id_fkey ( first_name, last_name, avatar_url )
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error loading conversations:', error);
    return [];
  }

  // Agregar info de la contraparte y count de no leídos
  const enriched = await Promise.all(data.map(async (conv) => {
    const isMyBuy = conv.buyer_id === user.id;
    const other = isMyBuy ? conv.seller : conv.buyer;
    const otherName = other ? `${other.first_name} ${other.last_name}` : 'Usuario';
    const otherInitial = other ? (other.first_name || '?').charAt(0).toUpperCase() : '?';

    // Último mensaje
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('content, created_at, sender_id, is_read')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Contar no leídos
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    return {
      ...conv,
      otherName,
      otherInitial,
      productTitle: conv.products?.title || 'Producto',
      lastMessage: lastMsg?.content || '',
      lastMessageAt: lastMsg?.created_at || conv.last_message_at,
      lastSenderId: lastMsg?.sender_id,
      unreadCount: count || 0,
    };
  }));

  return enriched;
}

// ─── Cargar mensajes de una conversación ───
async function loadMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, content, sender_id, is_read, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading messages:', error);
    return [];
  }
  return data;
}

// ─── Enviar mensaje ───
async function sendMessage(conversationId, content) {
  const user = await getCurrentUser();
  if (!user || !content.trim()) return null;

  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id, product_id')
    .eq('id', conversationId)
    .single();

  if (convError || !conv) {
    console.error('Error loading conversation:', convError);
    showToast('Error al enviar el mensaje.');
    return null;
  }

  const receiverId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      product_id: conv.product_id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    showToast('Error al enviar el mensaje.');
    return null;
  }

  // Actualizar last_message_at en la conversación
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

// ─── Marcar mensajes como leídos ───
async function markMessagesAsRead(conversationId) {
  const user = await getCurrentUser();
  if (!user) return;

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', user.id);
}

// ─── Suscripción realtime a nuevos mensajes ───
let _messageSubscription = null;

function subscribeToMessages(conversationId, callback) {
  // Limpiar suscripción anterior
  if (_messageSubscription) {
    supabase.removeChannel(_messageSubscription);
  }

  _messageSubscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return _messageSubscription;
}

function unsubscribeMessages() {
  if (_messageSubscription) {
    supabase.removeChannel(_messageSubscription);
    _messageSubscription = null;
  }
}

// ─── Contar mensajes no leídos (global) ───
async function getUnreadCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  // Obtener IDs de mis conversaciones
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (!convs || convs.length === 0) return 0;

  const convIds = convs.map(c => c.id);

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convIds)
    .eq('is_read', false)
    .neq('sender_id', user.id);

  return count || 0;
}

// ─── Actualizar badge de mensajes no leídos en la nav ───
async function updateMessageBadge() {
  const count = await getUnreadCount();
  const badges = document.querySelectorAll('.msg-count');
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'grid' : 'none';
  });
}

// ─── Formatear hora del chat ───
function formatChatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

function formatMessageTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

// ─── Renderizar chat flotante (para producto.html) ───
function renderChatModal(conversationId, productTitle, otherName) {
  // Eliminar modal existente
  const existing = document.getElementById('chat-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'chat-modal';
  modal.className = 'chat-modal';
  modal.innerHTML = `
    <div class="chat-modal-backdrop" onclick="closeChatModal()"></div>
    <div class="chat-modal-container">
      <div class="chat-modal-header">
        <div>
          <div class="chat-modal-title">${otherName}</div>
          <div class="chat-modal-subtitle">${productTitle}</div>
        </div>
        <button class="chat-modal-close" onclick="closeChatModal()">✕</button>
      </div>
      <div class="chat-messages" id="chat-modal-messages">
        <div class="chat-loading">Cargando mensajes…</div>
      </div>
      <form class="chat-input-bar" onsubmit="handleChatSend(event, '${conversationId}')">
        <input type="text" id="chat-modal-input" placeholder="Escribe un mensaje…" autocomplete="off" required>
        <button type="submit" class="chat-send-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('open'));

  // Cargar mensajes existentes y suscribirse
  loadAndRenderMessages(conversationId, 'chat-modal-messages');
  markMessagesAsRead(conversationId);

  subscribeToMessages(conversationId, (newMsg) => {
    appendMessage(newMsg, 'chat-modal-messages');
    markMessagesAsRead(conversationId);
  });
}

function closeChatModal() {
  const modal = document.getElementById('chat-modal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  }
  unsubscribeMessages();
}

// ─── Enviar mensaje desde chat ───
async function handleChatSend(e, conversationId) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const content = input.value.trim();
  if (!content) return;

  input.value = '';
  input.focus();
  await sendMessage(conversationId, content);
}

// ─── Cargar y renderizar mensajes ───
async function loadAndRenderMessages(conversationId, containerId) {
  const messages = await loadMessages(conversationId);
  const user = await getCurrentUser();
  const container = document.getElementById(containerId);

  if (messages.length === 0) {
    container.innerHTML = `
      <div class="chat-empty">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">💬</div>
        <p>¡Inicia la conversación!</p>
      </div>`;
    return;
  }

  container.innerHTML = messages.map(msg => renderBubble(msg, user.id)).join('');
  container.scrollTop = container.scrollHeight;
}

// ─── Agregar un mensaje al chat ───
async function appendMessage(msg, containerId) {
  const user = await getCurrentUser();
  const container = document.getElementById(containerId);

  // Quitar empty state si existe
  const empty = container.querySelector('.chat-empty');
  if (empty) empty.remove();
  const loading = container.querySelector('.chat-loading');
  if (loading) loading.remove();

  // Evitar duplicados
  if (container.querySelector(`[data-msg-id="${msg.id}"]`)) return;

  container.insertAdjacentHTML('beforeend', renderBubble(msg, user.id));
  container.scrollTop = container.scrollHeight;
}

// ─── Renderizar burbuja de mensaje ───
function renderBubble(msg, currentUserId) {
  const isMine = msg.sender_id === currentUserId;
  return `
    <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}" data-msg-id="${msg.id}">
      <div class="chat-bubble-content">${escapeHtml(msg.content)}</div>
      <div class="chat-bubble-time">${formatMessageTime(msg.created_at)}</div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Notificación global en vivo (toast) mientras la pestaña está abierta ───
let _globalMessageChannel = null;

async function initGlobalMessageNotifications() {
  const user = await getCurrentUser();
  if (!user) return;

  if (_globalMessageChannel) supabase.removeChannel(_globalMessageChannel);

  _globalMessageChannel = supabase
    .channel(`global-messages:${user.id}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
      async (payload) => {
        updateMessageBadge();
        const { data: sender } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', payload.new.sender_id)
          .maybeSingle();
        showToast(`💬 Nuevo mensaje de ${sender?.first_name || 'alguien'}`);
      }
    )
    .subscribe();
}

// Actualizar badge y activar notificaciones en cada carga de página
document.addEventListener('DOMContentLoaded', () => {
  updateMessageBadge();
  initGlobalMessageNotifications();
});
