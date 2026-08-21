/* ============================================
   CAMPUS CONNECT — Shared Application Logic
   ============================================ */

// ─── Escapa texto de usuario antes de insertarlo en innerHTML (previene XSS
// almacenado). div.innerHTML solo escapa & < > (así serializa el DOM el
// contenido de un nodo de texto) — NO comillas, porque una comilla no es
// especial dentro de texto, solo dentro del valor de un atributo. Como en
// este código escapeHtml() también se usa para rellenar atributos entre
// comillas dobles (data-*, alt, title…), un nombre o título con un `"`
// literal podía romper el atributo e inyectar HTML/JS. Se agregan las dos
// entidades a mano; los navegadores decodifican &quot;/&#39; igual en
// contenido de texto, así que esto no cambia nada visualmente ahí. ───
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Etiqueta legible para el código de condición guardado en la base
// (ver el <select> de vender.html) — antes se mostraba el código crudo
// ("como_nuevo") directo en la tarjeta de producto. ───
const CONDITION_LABELS = { nuevo: 'Nuevo', como_nuevo: 'Como nuevo', usado_bueno: 'Buen estado' };
function conditionLabel(code) { return CONDITION_LABELS[code] || code; }

// ─── Ícono SVG por categoría (reemplaza los emojis que vienen de la base de datos) ───
function categoryIcon(name) {
  const n = (name || '').toLowerCase();
  const icons = {
    libro: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    apunte: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    tutor: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    asesor: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    servicio: '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>',
    empleo: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    pasant: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    comida: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  };
  const path = Object.keys(icons).find(k => n.includes(k));
  const body = path ? icons[path]
    : '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>';
  return `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// ─── Normaliza un producto de Supabase (con relaciones embebidas) a un shape simple ───
// Empleos y pasantías son ofertas, no algo que se compre — no tienen
// precio ni pasan por carrito/checkout, se contacta directo al vendedor.
function isJobCategory(slug) { return slug === 'empleos'; }

function normalizeProduct(p) {
  return {
    id: p.id,
    title: p.title,
    price: p.price != null ? Number(p.price) : null,
    condition: p.condition,
    description: p.description,
    icon: categoryIcon(p.categories?.name),
    category: p.categories?.name || '',
    categorySlug: p.categories?.slug || '',
    university: p.universities?.short_name || '',
    seller: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : '',
    sellerRating: p.profiles?.rating ?? 5.0,
    sellerAvatar: p.profiles?.avatar_url || '',
    sellerId: p.seller_id,
    categoryId: p.category_id,
    universityId: p.university_id,
    imageUrls: p.image_urls || [],
    views: p.views ?? 0,
  };
}

// ─── Cart state (persisted in localStorage) ───
const CART_KEY = 'cc_cart_v2';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...product, qty });
  }
  saveCart(cart);
  showToast(`${product.title} añadido al carrito`);
}

function removeFromCart(productId) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
  if (typeof renderCart === 'function') renderCart();
}

// Bajar la cantidad a 0 con "−" elimina el producto — antes se quedaba
// clavado en 1 para siempre, sin ninguna forma de sacarlo desde el
// contador (solo existía el link "Eliminar" aparte).
function updateCartQty(productId, qty) {
  if (qty <= 0) { removeFromCart(productId); return; }
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = qty;
  saveCart(cart);
  if (typeof renderCart === 'function') renderCart();
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
  const badge = document.querySelector('.cart-count');
  if (badge) {
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'grid' : 'none';
  }
}

// ─── Favoritos (persistidos en localStorage, mismo patrón que el carrito) ───
const FAVORITES_KEY = 'cc_favorites_v1';

function getFavoriteIds() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
  catch { return []; }
}

function isFavorite(productId) { return getFavoriteIds().includes(productId); }

function toggleFavorite(productId) {
  const ids = getFavoriteIds();
  const i = ids.indexOf(productId);
  if (i === -1) ids.push(productId); else ids.splice(i, 1);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  return ids.includes(productId);
}

// Handler inline para el botón de corazón en las tarjetas: evita que el
// clic también dispare la navegación de la tarjeta (tienen onclick propio).
function toggleFavoriteBtn(btn, productId, event) {
  event.stopPropagation();
  const nowFav = toggleFavorite(productId);
  btn.classList.toggle('is-fav', nowFav);
}

// ─── Toast ───
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<div class="toast-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><div class="toast-msg"></div>`;
    document.body.appendChild(toast);
  }
  toast.querySelector('.toast-msg').textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ─── Modal de confirmación (reemplaza a alert(), que se ve como un
// diálogo genérico del navegador y rompe con el diseño del sitio) ───
function showSuccessModal(title, text, onClose) {
  let modal = document.querySelector('.success-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.innerHTML = `
      <div class="success-modal-backdrop"></div>
      <div class="success-modal-box">
        <div class="success-modal-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h3 class="success-modal-title"></h3>
        <p class="success-modal-text"></p>
        <button class="btn btn-primary btn-block success-modal-btn">Entendido</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.querySelector('.success-modal-title').textContent = title;
  modal.querySelector('.success-modal-text').textContent = text;
  modal.classList.add('open');

  const btn = modal.querySelector('.success-modal-btn');
  const close = () => {
    modal.classList.remove('open');
    btn.removeEventListener('click', close);
    if (onClose) onClose();
  };
  btn.addEventListener('click', close);
}

// ─── Modal de reporte (producto y/o vendedor). targetLabel es lo que se
// muestra arriba del formulario para confirmar qué se está reportando. ───
function openReportModal({ productId, userId, targetLabel }) {
  let modal = document.querySelector('.report-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.innerHTML = `
      <div class="report-modal-backdrop"></div>
      <div class="report-modal-box">
        <h3>Reportar</h3>
        <p class="report-modal-target"></p>
        <label>Motivo</label>
        <select class="report-modal-reason">
          <option value="fraude">Fraude</option>
          <option value="producto_falso">Producto falso</option>
          <option value="contenido_inapropiado">Contenido inapropiado</option>
          <option value="acoso">Acoso</option>
          <option value="spam">Spam</option>
          <option value="otro">Otro</option>
        </select>
        <label>Detalles (opcional)</label>
        <textarea class="report-modal-desc" placeholder="Cuéntanos qué pasó…" maxlength="500"></textarea>
        <div class="report-modal-actions">
          <button class="btn btn-ghost report-modal-cancel">Cancelar</button>
          <button class="btn btn-primary report-modal-submit">Enviar reporte</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const closeModal = () => modal.classList.remove('open');
    modal.querySelector('.report-modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.report-modal-cancel').addEventListener('click', closeModal);
  }

  modal.querySelector('.report-modal-target').textContent = targetLabel || '';
  modal.querySelector('.report-modal-desc').value = '';
  modal.querySelector('.report-modal-reason').value = 'fraude';
  modal.classList.add('open');

  // onclick (no addEventListener) a propósito: cada llamada a openReportModal
  // reescribe el handler entero con el productId/userId de esta llamada, así
  // que no se acumulan listeners de aperturas anteriores.
  modal.querySelector('.report-modal-submit').onclick = async () => {
    const user = await getCurrentUser();
    if (!user) { showToast('Inicia sesión para reportar.'); return; }

    const submitBtn = modal.querySelector('.report-modal-submit');
    submitBtn.disabled = true;
    const { error } = await createReport({
      reportedProductId: productId || null,
      reportedUserId: userId || null,
      reason: modal.querySelector('.report-modal-reason').value,
      description: modal.querySelector('.report-modal-desc').value.trim(),
    });
    submitBtn.disabled = false;

    if (error) { showToast('Error: ' + error.message); return; }
    modal.classList.remove('open');
    showToast('Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.');
  };
}

// ─── Product card renderer (recibe un producto normalizado) ───
// featuredIds: Set opcional de IDs con más vistas — pinta el badge
// "Destacado" cuando el producto está adentro (ver fetchFeaturedProductIds).
function renderProductCard(p, featuredIds) {
  const featured = featuredIds ? featuredIds.has(p.id) : false;
  const fav = isFavorite(p.id);
  return `
    <article class="product-card" onclick="window.location.href='producto.html?id=${p.id}'">
      <div class="product-img">
        ${p.imageUrls?.[0]
          ? `<img src="${p.imageUrls[0]}" style="width:100%; height:100%; object-fit:cover;">`
          : `<span style="font-size: 4rem;">${p.icon}</span>`}
        <div class="product-badges">
          <span class="product-badge">${escapeHtml(conditionLabel(p.condition))}</span>
          ${featured ? `<span class="product-badge product-badge-featured">★ Destacado</span>` : ''}
        </div>
        <button class="product-fav-btn${fav ? ' is-fav' : ''}" title="Guardar en favoritos" onclick="toggleFavoriteBtn(this, '${p.id}', event)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>
      </div>
      <div class="product-body">
        <div class="product-category">${escapeHtml(p.category)} · ${escapeHtml(p.university)}</div>
        <h3 class="product-title">${escapeHtml(p.title)}</h3>
        <div class="product-meta">
          <span class="product-price">${isJobCategory(p.categorySlug) ? 'Oferta de empleo' : fmt(p.price)}</span>
          <span class="product-seller">${escapeHtml(p.seller)}</span>
        </div>
      </div>
    </article>
  `;
}

// ─── Fuerza de contraseña: debe coincidir con "Password requirements" en
// Supabase → Authentication → Providers → Email (minúscula+mayúscula+dígito+
// símbolo), para que el error se vea al instante y no tras un round-trip
// al servidor que de todos modos la va a rechazar. El servidor sigue
// siendo la validación real; esto es solo para que la UX no sea confusa.
const WEAK_PASSWORDS = [
  '12345678', '123456789', '1234567890', 'password', 'password1',
  'contraseña', 'contrasena', 'qwerty123', 'qwertyui', 'iloveyou',
  '11111111', 'abcdefgh', 'campusconnect', 'estudiante',
];

function passwordStrengthError(pw) {
  if (!pw || pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (WEAK_PASSWORDS.includes(pw.toLowerCase())) return 'Esa contraseña es muy común y fácil de adivinar. Elige otra.';
  if (!/[a-z]/.test(pw)) return 'La contraseña debe incluir al menos una minúscula.';
  if (!/[A-Z]/.test(pw)) return 'La contraseña debe incluir al menos una mayúscula.';
  if (!/[0-9]/.test(pw)) return 'La contraseña debe incluir al menos un número.';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw)) return 'La contraseña debe incluir al menos un símbolo (ej. ! @ # $ %).';
  return null;
}

// ─── Contenido de un círculo de avatar: foto si existe, si no vacío ───
// (el círculo en sí -tamaño, fondo, radio- lo da la clase CSS del contenedor,
// p.ej. .dash-avatar o .seller-avatar)
function avatarInner(avatarUrl) {
  return avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
    : '';
}

// ─── Format currency ───
function fmt(n) { return `$${Number(n).toFixed(2)}`; }

// ─── Menú mobile: abre/cierra el panel de links de la nav ───
function toggleMobileNav() {
  document.getElementById('mobile-nav-panel')?.classList.toggle('open');
}

// ─── Refleja el estado de sesión en el botón de la nav ───
async function updateAuthNav() {
  const link = document.getElementById('nav-auth-link');
  if (!link || typeof getCurrentUser !== 'function') return;
  const user = await getCurrentUser();
  if (user) link.textContent = 'Mi cuenta';
}

// ─── Animación de aparición al hacer scroll ───
// Se aplica por selector, no por marcado en el HTML de cada página, para
// que también alcance a las tarjetas que se cargan async después (grids
// de productos en explorar.html, perfil.html, etc.) vía un MutationObserver.
const REVEAL_SELECTOR = '.cat-card, .product-card, .how-step, .section-header, .hero-feature';
let _revealObserver = null;
let _revealDelay = 0;

function _armReveal(el) {
  if (!el.classList || el.classList.contains('reveal')) return;
  el.classList.add('reveal');
  el.style.transitionDelay = `${(_revealDelay++ % 6) * 60}ms`;
  _revealObserver.observe(el);
}

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  _revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        _revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(REVEAL_SELECTOR).forEach(_armReveal);

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.(REVEAL_SELECTOR)) _armReveal(node);
        node.querySelectorAll?.(REVEAL_SELECTOR).forEach(_armReveal);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}

// ─── Init on page load ───
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateAuthNav();
  initScrollReveal();
});
