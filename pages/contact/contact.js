/**
 * Actualiza la interfaz del navbar según el estado de sesión del usuario
 * Muestra el nombre del usuario logueado y oculta el botón de acceder
 */
function actualizarNavbar() {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    const userInfo = document.getElementById('user-info');
    const accesoBotones = document.getElementById('acceso-botones');
    const userNameSpan = document.getElementById('userName');
    const adminLink = document.getElementById('admin-link');
    
    if (usuarioLogueado) {
        const usuario = JSON.parse(usuarioLogueado);
        if (userNameSpan) userNameSpan.textContent = `Hola, ${usuario.nombre}`;
        if (userInfo) userInfo.style.display = 'block';
        if (accesoBotones) accesoBotones.style.display = 'none';
        
        if (adminLink) {
            adminLink.style.display = usuario.rol === 'admin' ? 'block' : 'none';
        }
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (accesoBotones) accesoBotones.style.display = 'block';
        if (adminLink) adminLink.style.display = 'none';
    }
}

/**
 * Cierra la sesión del usuario eliminando solo los datos de sesión actual
 * Los usuarios registrados permanecen en localStorage para futuros inicios de sesión
 * Redirige a la página de inicio
 */
function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    actualizarNavbar();
    window.location.href = '/index.html';
}

/**
 * Carga el componente del navbar y configura la sesión del usuario
 * Inicializa el botón de cierre de sesión si el usuario está logueado
 */
fetch('../../components/navbar/navbar.html')
    .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar el navbar');
        return res.text();
    })
    .then(function (html) {
        document.getElementById('header').innerHTML = html;
        actualizarNavbar();
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
    .catch(function (err) { console.error('Error cargando el navbar:', err); });

/**
 * Carga el componente del mapa de Google Maps
 * Inyecta dinámicamente el CSS correspondiente e inicializa el mapa
 */
fetch('../../components/maps/maps.html')
    .then(res => res.text())
    .then(html => {
    document.getElementById('map-placeholder').innerHTML = html;

    // Carga el CSS del mapa dinámicamente
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../../components/maps/maps.css';
    document.head.appendChild(link);

    // Inicializa el mapa después de insertar el HTML
    setTimeout(() => {
        inicializacionMap();
    }, 100);
});

/**
 * Carga el formulario de contacto dentro del contenedor correspondiente
 */
fetch('../../components/forms/contacto/formContacto.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('form-contacto').innerHTML = html;
        if (typeof initFormContacto === 'function') {
            initFormContacto();
        }
    })
    .catch(err => console.error('Error cargando el formulario de contacto:', err));

/**
 * Carga el componente del footer en todas las páginas
 */
fetch('../../components/footer/footer.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('footer-placeholder').innerHTML = html;
    })
    .catch(err => console.error('Error cargando el footer:', err));