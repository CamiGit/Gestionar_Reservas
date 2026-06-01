
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

// Cargar navbar y configurar eventos de sesión
fetch('/components/navbar/navbar.html')
    .then(res => res.text())
    .then(async html => {
        document.getElementById('header').innerHTML = html;
        await actualizarNavbar();
        const btnCerrarSesion = document.getElementById('btnCerrarSesion');
        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', cerrarSesion);
        }
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

function cargarComponenteHtml(ruta, placeholderId, errorMensaje, callback) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return Promise.resolve();

    return fetch(ruta)
        .then(res => res.text())
        .then(html => {
            placeholder.innerHTML = html;
            if (typeof callback === 'function') callback(html);
        })
        .catch(err => console.error(errorMensaje, err));
}

// Cargar banner de inicio
cargarComponenteHtml('/components/bannerInicio/bannerInicio.html', 'bannerInicio-placeholder', 'Error cargando el banner en index:');

// Cargar sección de información del index
cargarComponenteHtml('/components/infoIndex/infoIndex.html', 'infoIndex-placeholder', 'Error cargando el información index:');

// Cargar sección de servicios destacados
cargarComponenteHtml('/components/ServiciosDestacados/ServiciosDestacados.html', 'serviceDes-placeholder', 'Error cargando servicios destacados:');

// Cargar sección de reseñas
cargarComponenteHtml('/components/review/review.html', 'review-placeholder', 'Error cargando los comentarios:', () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/components/review/review.css';
    document.head.appendChild(link);

    setTimeout(() => {
        if (typeof initialReview === 'function') {
            initialReview();
        }
    }, 100);
});

// Cargar footer
cargarComponenteHtml('/components/footer/footer.html', 'footer-placeholder', 'Error cargando el footer:');

