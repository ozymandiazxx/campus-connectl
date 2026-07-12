/* ============================================
   CAMPUS CONNECT — Cookie Consent Banner
   ============================================ */

// Inject styles
(function() {
  const css = `
  .cookie-banner {
    position: fixed;
    bottom: 1.5rem;
    left: 1.5rem;
    right: 1.5rem;
    max-width: 920px;
    margin: 0 auto;
    background: var(--bg-card);
    border: 1px solid var(--cyan);
    border-radius: 16px;
    padding: 1.5rem 1.75rem;
    z-index: 9999;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    display: flex;
    gap: 1.5rem;
    align-items: center;
    backdrop-filter: blur(20px);
    animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes slideUp {
    from { transform: translateY(120%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .cookie-banner-icon {
    font-size: 2.25rem;
    flex-shrink: 0;
  }
  .cookie-banner-content {
    flex: 1;
  }
  .cookie-banner-title {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  .cookie-banner-text {
    color: var(--text-mute);
    font-size: 0.88rem;
    line-height: 1.5;
  }
  .cookie-banner-text a {
    color: var(--cyan);
    border-bottom: 1px solid rgba(45,212,255,0.3);
  }
  .cookie-banner-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .cookie-banner-actions .btn {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  .cookie-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(8px);
    z-index: 10000;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .cookie-modal {
    background: var(--bg-card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 2rem;
    max-width: 540px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }
  .cookie-modal h3 {
    font-family: var(--font-display);
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .cookie-modal p {
    color: var(--text-mute);
    margin-bottom: 1.5rem;
    font-size: 0.92rem;
  }
  .cookie-toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--line-soft);
  }
  .cookie-toggle-row:last-of-type { border-bottom: none; }
  .cookie-toggle-info { flex: 1; }
  .cookie-toggle-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  .cookie-toggle-desc {
    font-size: 0.85rem;
    color: var(--text-mute);
    line-height: 1.5;
  }
  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--bg-deep);
    border: 1px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--text-mute);
    border-radius: 50%;
    transition: all 0.2s;
  }
  .toggle-switch.active {
    background: var(--cyan);
    border-color: var(--cyan);
  }
  .toggle-switch.active::after {
    left: 22px;
    background: var(--bg-deep);
  }
  .toggle-switch.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .cookie-modal-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
  }
  .cookie-modal-actions .btn { flex: 1; min-width: 140px; }

  @media (max-width: 768px) {
    .cookie-banner {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
      padding: 1.25rem;
      bottom: 0.75rem;
      left: 0.75rem;
      right: 0.75rem;
    }
    .cookie-banner-actions {
      justify-content: center;
      flex-wrap: wrap;
    }
    .cookie-banner-actions .btn { flex: 1; min-width: 120px; }
  }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();

// Cookie consent logic
window.cookieConsent = {
  get() {
    try { return JSON.parse(localStorage.getItem('cc_consent') || 'null'); }
    catch { return null; }
  },
  set(prefs) {
    localStorage.setItem('cc_consent', JSON.stringify({
      ...prefs,
      essential: true,
      date: new Date().toISOString(),
      version: '1.0'
    }));
  },
  acceptAll() {
    this.set({ essential: true, preferences: true, analytics: true });
    this.hide();
    if (typeof showToast === 'function') showToast('Preferencias guardadas');
  },
  rejectOptional() {
    this.set({ essential: true, preferences: false, analytics: false });
    this.hide();
    if (typeof showToast === 'function') showToast('Solo cookies necesarias activas');
  },
  hide() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.remove();
    const modal = document.getElementById('cookie-modal-overlay');
    if (modal) modal.remove();
  },
  showBanner() {
    if (document.getElementById('cookie-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-banner-icon">🍪</div>
      <div class="cookie-banner-content">
        <div class="cookie-banner-title">Usamos cookies para mejorar tu experiencia</div>
        <div class="cookie-banner-text">
          Las cookies esenciales hacen que la plataforma funcione. Las opcionales nos ayudan a mejorarla. Puedes consultar nuestra <a href="cookies.html">Política de Cookies</a> y <a href="privacidad.html">Política de Privacidad</a>.
        </div>
      </div>
      <div class="cookie-banner-actions">
        <button class="btn btn-ghost" onclick="cookieConsent.showCustomize()">Personalizar</button>
        <button class="btn btn-ghost" onclick="cookieConsent.rejectOptional()">Solo necesarias</button>
        <button class="btn btn-primary" onclick="cookieConsent.acceptAll()">Aceptar todas</button>
      </div>
    `;
    document.body.appendChild(banner);
  },
  showCustomize() {
    const overlay = document.createElement('div');
    overlay.id = 'cookie-modal-overlay';
    overlay.className = 'cookie-modal-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    const current = this.get() || {};

    overlay.innerHTML = `
      <div class="cookie-modal" onclick="event.stopPropagation()">
        <h3>Personaliza tus cookies</h3>
        <p>Elige qué tipos de cookies quieres permitir. Puedes cambiar esta configuración en cualquier momento.</p>

        <div class="cookie-toggle-row">
          <div class="cookie-toggle-info">
            <div class="cookie-toggle-name">🟢 Esenciales (obligatorias)</div>
            <div class="cookie-toggle-desc">Necesarias para iniciar sesión, mantener el carrito y procesar pagos. La plataforma no funciona sin ellas.</div>
          </div>
          <div class="toggle-switch active disabled"></div>
        </div>

        <div class="cookie-toggle-row">
          <div class="cookie-toggle-info">
            <div class="cookie-toggle-name">🟡 Preferencias</div>
            <div class="cookie-toggle-desc">Recuerdan tus filtros, tema visual e idioma para personalizar tu experiencia.</div>
          </div>
          <div class="toggle-switch ${current.preferences !== false ? 'active' : ''}" id="t-prefs" onclick="this.classList.toggle('active')"></div>
        </div>

        <div class="cookie-toggle-row">
          <div class="cookie-toggle-info">
            <div class="cookie-toggle-name">🔵 Analíticas</div>
            <div class="cookie-toggle-desc">Nos ayudan a entender de forma anónima cómo se usa la plataforma para mejorarla.</div>
          </div>
          <div class="toggle-switch ${current.analytics !== false ? 'active' : ''}" id="t-analytics" onclick="this.classList.toggle('active')"></div>
        </div>

        <div class="cookie-modal-actions">
          <button class="btn btn-ghost" onclick="document.getElementById('cookie-modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="cookieConsent.saveCustom()">Guardar preferencias</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },
  saveCustom() {
    this.set({
      essential: true,
      preferences: document.getElementById('t-prefs').classList.contains('active'),
      analytics: document.getElementById('t-analytics').classList.contains('active'),
    });
    this.hide();
    if (typeof showToast === 'function') showToast('Preferencias guardadas');
  }
};

// Auto-show banner if no consent yet
document.addEventListener('DOMContentLoaded', () => {
  if (!window.cookieConsent.get()) {
    setTimeout(() => window.cookieConsent.showBanner(), 800);
  }
});
