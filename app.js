/* ============================================
   CAMPUS CONNECT — Shared Application Logic
   ============================================ */

// ─── Normaliza un producto de Supabase (con relaciones embebidas) a un shape simple ───
function normalizeProduct(p) {
  return {
    id: p.id,
    title: p.title,
    price: Number(p.price),
    condition: p.condition,
    description: p.description,
    icon: p.categories?.icon || '📦',
    category: p.categories?.name || '',
    university: p.universities?.short_name || '',
    seller: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : '',
    sellerRating: p.profiles?.rating ?? 5.0,
    sellerId: p.seller_id,
    categoryId: p.category_id,
    universityId: p.university_id,
    imageUrls: p.image_urls || [],
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

function updateCartQty(productId, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, qty);
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

// ─── Toast ───
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<div class="toast-icon">✓</div><div class="toast-msg"></div>`;
    document.body.appendChild(toast);
  }
  toast.querySelector('.toast-msg').textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ─── Product card renderer (recibe un producto normalizado) ───
function renderProductCard(p) {
  return `
    <article class="product-card" onclick="window.location.href='producto.html?id=${p.id}'">
      <div class="product-img">
        ${p.imageUrls?.[0]
          ? `<img src="${p.imageUrls[0]}" style="width:100%; height:100%; object-fit:cover;">`
          : `<span style="font-size: 4rem;">${p.icon}</span>`}
        <span class="product-badge">${p.condition || ''}</span>
      </div>
      <div class="product-body">
        <div class="product-category">${p.category} · ${p.university}</div>
        <h3 class="product-title">${p.title}</h3>
        <div class="product-meta">
          <span class="product-price">${fmt(p.price)}</span>
          <span class="product-seller">${p.seller}</span>
        </div>
      </div>
    </article>
  `;
}

// ─── Format currency ───
function fmt(n) { return `$${Number(n).toFixed(2)}`; }

// ─── Refleja el estado de sesión en el botón de la nav ───
async function updateAuthNav() {
  const link = document.getElementById('nav-auth-link');
  if (!link || typeof getCurrentUser !== 'function') return;
  const user = await getCurrentUser();
  if (user) link.textContent = 'Mi cuenta';
}

// ─── Init on page load ───
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateAuthNav();
});
