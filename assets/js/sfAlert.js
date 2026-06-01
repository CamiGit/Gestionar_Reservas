/**
 * sfLoader — muestra/oculta un spinner de carga en un contenedor
 *
 * Uso:
 *   sfLoader.show('mi-contenedor-id')          // muestra spinner
 *   sfLoader.hide('mi-contenedor-id', html)     // oculta spinner y pone contenido
 */
window.sfLoader = {
  show(containerId, mensaje = 'Cargando...') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="sf-loader-wrap" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1rem;gap:1rem;">
        <div style="width:48px;height:48px;border:3px solid #f0e6ff;border-top-color:#522676;border-radius:50%;animation:sf-spin 0.8s linear infinite;"></div>
        <p style="color:#888;font-size:.9rem;margin:0;">${mensaje}</p>
      </div>
      <style>
        @keyframes sf-spin { to { transform: rotate(360deg); } }
      </style>`;
  },
  hide(containerId, html = '') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = html;
  },
};

/**
 * sfAlert — reemplaza alert() nativo con un modal estilizado de Bootstrap
 *
 * Uso:
 *   sfAlert('Mensaje aquí')                         // informativo (morado)
 *   sfAlert('Éxito', 'success')                     // verde
 *   sfAlert('Error al guardar', 'error')             // rojo
 *   sfAlert('Atención', 'warning')                   // amarillo
 *   await sfAlert('Mensaje')                         // espera a que el usuario cierre
 */
window.sfAlert = function (mensaje, tipo = 'info') {
  return new Promise((resolve) => {
    // Eliminar instancia previa si existe
    const previo = document.getElementById('sf-alert-modal');
    if (previo) previo.remove();

    const config = {
      success: { icon: 'fa-circle-check',      color: '#059669', bg: 'rgba(5,150,105,0.1)',   titulo: 'Éxito' },
      error:   { icon: 'fa-circle-xmark',      color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   titulo: 'Error' },
      warning: { icon: 'fa-triangle-exclamation', color: '#d97706', bg: 'rgba(217,119,6,0.1)', titulo: 'Atención' },
      info:    { icon: 'fa-circle-info',        color: '#522676', bg: 'rgba(82,38,118,0.1)',   titulo: 'Aviso' },
    };

    const { icon, color, bg, titulo } = config[tipo] ?? config.info;

    const modal = document.createElement('div');
    modal.id = 'sf-alert-modal';
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered" style="max-width:420px;">
        <div class="modal-content" style="border-radius:16px;border:none;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;">
          <div class="modal-body text-center" style="padding:2.5rem 2rem 1.5rem;">
            <div style="width:64px;height:64px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;margin:0 auto 1.2rem;">
              <i class="fa-solid ${icon} fa-xl" style="color:${color};"></i>
            </div>
            <h5 style="font-family:'Cormorant Garamond',serif;color:#1a1a2e;font-size:1.3rem;margin-bottom:.6rem;">${titulo}</h5>
            <p style="color:#555;font-size:.95rem;line-height:1.6;margin-bottom:1.8rem;">${mensaje}</p>
            <button type="button" class="btn sf-alert-btn" data-bs-dismiss="modal"
              style="background:#522676;color:#fff;border:none;border-radius:8px;padding:.55rem 2.2rem;font-size:.95rem;font-weight:500;letter-spacing:.3px;transition:background .2s;">
              Aceptar
            </button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);

    const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });

    modal.addEventListener('hidden.bs.modal', () => {
      bsModal.dispose();
      modal.remove();
      resolve();
    });

    // Hover en el botón
    const btn = modal.querySelector('.sf-alert-btn');
    btn.addEventListener('mouseenter', () => btn.style.background = '#3d1a5c');
    btn.addEventListener('mouseleave', () => btn.style.background = '#522676');

    bsModal.show();
  });
};
