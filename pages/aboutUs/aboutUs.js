/**
 * Actualiza la interfaz del navbar según el estado de sesión del usuario
 * Muestra el nombre del usuario logueado y oculta el botón de acceder
 */
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
    window.location.href = '/index.html';
}

fetch('/components/navbar/navbar.html')
    .then(res => res.text())
    .then(async html => {
        document.getElementById('header').innerHTML = html;
        await actualizarNavbar();
        const btnCerrarSesion = document.getElementById('btnCerrarSesion');
        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', cerrarSesion);
        }
        
        // Funcionalidad para resaltar el enlace activo en el navbar
        const enlaces = document.querySelectorAll('.nav-link');
        // 1. Obtenemos el nombre del archivo actual (ej: "servicios.html")
        // Si estamos en la raíz, window.location.pathname devolverá "/" o "index.html"
        let rutaActual = window.location.pathname.split("/").pop();
        if (rutaActual === "" || rutaActual === "/") {
            rutaActual = "index.html";
        }
        enlaces.forEach(enlace => {
            // 2. Obtenemos el nombre del archivo del href del enlace
            let rutaEnlace = enlace.getAttribute('href').split("/").pop();
            
            if(rutaEnlace == rutaActual){
                enlace.classList.add('active');
                
             }else {
                 enlace.classList.remove('active');
             }

        });
    })
    .catch(err => console.error('Error cargando el navbar:', err));

fetch('/components/footer/footer.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer-placeholder').innerHTML = html;
    })
    .catch(err => console.error('Error cargando el footer:', err));