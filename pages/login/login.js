async function actualizarNavbar() {
    const token = sfSession.getToken();
    const userInfo = document.getElementById('user-info');
    const accesoBotones = document.getElementById('acceso-botones');
    const userNameSpan = document.getElementById('userName');
    const adminLink = document.getElementById('admin-link');

    if (token) {
        const usuario = await sfSession.getProfile();
        if (userNameSpan) userNameSpan.textContent = `Hola, ${usuario?.nombre ?? ''}`;
        if (userInfo) userInfo.style.display = 'block';
        if (accesoBotones) accesoBotones.style.display = 'none';
        if (adminLink) adminLink.style.display = (usuario?.rol ?? '') === 'admin' ? 'block' : 'none';
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (accesoBotones) accesoBotones.style.display = 'block';
        if (adminLink) adminLink.style.display = 'none';
    }
}

async function cerrarSesion() {
    await sfSession.clear();
    window.location.href = '../../index.html';
}

fetch('../../components/navbar/navbar.html')
    .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar el navbar');
        return res.text();
    })
    .then(async function (html) {
        document.getElementById('header').innerHTML = html;
        await actualizarNavbar();
        const btnCerrarSesion = document.getElementById('btnCerrarSesion');
        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', cerrarSesion);
        }
    })
    .catch(function (err) { console.error('Error cargando el navbar:', err); });

// Cargar footer
fetch('../../components/footer/footer.html')
    .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar el footer');
        return res.text();
    })
    .then(function (html) {
        document.getElementById('footer-placeholder').innerHTML = html;
    })
    .catch(function (err) { console.error('Error cargando el footer:', err); });

(function mostrarAvisoRegistroExitoso() {
    var params = new URLSearchParams(window.location.search);
    var columnaFormulario = document.querySelector('.content-body .col-md-6:last-child');
    if (!columnaFormulario) return;

    if (params.get('registro') !== 'exito') return;
    if (document.getElementById('aviso-registro-exito')) return;

    var aviso = document.createElement('div');
    aviso.id = 'aviso-registro-exito';
    aviso.className = 'aviso-registro-exito';
    aviso.setAttribute('role', 'status');
    aviso.innerHTML =
        '<span class="aviso-registro-exito-icon" aria-hidden="true"></span>' +
        '<span class="aviso-registro-exito-texto">¡Cuenta <strong>registrada</strong>! Ya puede iniciar sesión con su correo y contraseña.</span>';
    columnaFormulario.insertBefore(aviso, columnaFormulario.firstChild);
})();