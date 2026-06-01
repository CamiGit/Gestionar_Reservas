/**
 * Inicializa el usuario administrador por defecto en el sistema
 * Verifica si ya existe un administrador en localStorage, si no existe lo crea
 * Credenciales: admin@stylefactory.com / admin123/Admin123!
 */
function inicializarAdmin() {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const adminExiste = usuarios.some(usuario => usuario.email === "admin@stylefactory.com");
    
    if (!adminExiste) {
        usuarios.push({
            id: Date.now(),
            nombreCompleto: "Administrador",
            email: "admin@stylefactory.com",
            telefono: "0000000000",
            password: "admin123",
            rol: "admin",
            fechaRegistro: new Date().toISOString()
        });
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
      
    }
}

// Inicializar usuario administrador
inicializarAdmin();

// Función para actualizar el navbar según el estado de sesión del usuario
function actualizarNavbar() {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    const userInfo = document.getElementById('user-info');
    const accesoBotones = document.getElementById('acceso-botones');
    const userNameSpan = document.getElementById('userName');
    const adminLink = document.getElementById('admin-link');
    
    if (usuarioLogueado) {
        const usuario = JSON.parse(usuarioLogueado);
        if (userNameSpan) {
            userNameSpan.textContent = `Hola, ${usuario.nombre}`;
        }
        if (userInfo) userInfo.style.display = 'block';
        if (accesoBotones) accesoBotones.style.display = 'none';
        
        // Mostrar enlace de administrador solo si el rol es admin
        if (adminLink) {
            adminLink.style.display = usuario.rol === 'admin' ? 'block' : 'none';
        }
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (accesoBotones) accesoBotones.style.display = 'block';
        if (adminLink) adminLink.style.display = 'none';
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

