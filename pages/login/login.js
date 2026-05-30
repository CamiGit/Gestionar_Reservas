// Función para actualizar el navbar según el estado de sesión del usuario
function actualizarNavbar() {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    const userInfo = document.getElementById('user-info');
    const accesoBotones = document.getElementById('acceso-botones');
    const userNameSpan = document.getElementById('userName');
    const adminLink = document.getElementById('admin-link');
    const misReservasLink = document.getElementById('mis-reservas-link');
    
    if (usuarioLogueado) {
        const usuario = JSON.parse(usuarioLogueado);
        if (userNameSpan) userNameSpan.textContent = `Hola, ${usuario.nombre}`;
        if (userInfo) userInfo.style.display = 'block';
        if (accesoBotones) accesoBotones.style.display = 'none';
        if (misReservasLink) misReservasLink.style.display = 'block';
        
        if (adminLink) {
            adminLink.style.display = usuario.rol === 'admin' ? 'block' : 'none';
        }
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (accesoBotones) accesoBotones.style.display = 'block';
        if (adminLink) adminLink.style.display = 'none';
        if (misReservasLink) misReservasLink.style.display = 'none';
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    actualizarNavbar();
    window.location.href = '/index.html';
}

// Cargar navbar y configurar eventos de sesión
fetch('/components/navbar/navbar.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('header').innerHTML = html;
        actualizarNavbar();
        const btnCerrarSesion = document.getElementById('btnCerrarSesion');
        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', cerrarSesion);
        }
    })
    .catch(err => console.error('Error cargando el navbar:', err));

// Cargar footer
fetch('/components/footer/footer.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer-placeholder').innerHTML = html;
    })
    .catch(err => console.error('Error cargando el footer:', err));

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
    aviso.textContent =
        '¡Cuenta registrada! Ya puede iniciar sesión con su correo y contraseña.';
    columnaFormulario.insertBefore(aviso, columnaFormulario.firstChild);
})();