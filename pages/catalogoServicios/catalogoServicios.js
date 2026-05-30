import { productos } from '../../assets/js/productosCatalogo.js';

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

/**
 * Cierra la sesión del usuario eliminando solo los datos de sesión actual
 * Redirige a la página de inicio
 */
function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    actualizarNavbar();
    window.location.href = '/index.html';
}

/**
 * Combina datos del catálogo por defecto con los de localStorage (tipo, duración, etc.).
 */
function enriquecerProducto(producto) {
    const base = productos.find(function (p) { return p.id === producto.id; }) || {};
    return Object.assign({}, base, producto, {
        tipo: producto.tipo || base.tipo || '',
        duracionMinutos: producto.duracionMinutos ?? base.duracionMinutos ?? 60
    });
}

if (document.getElementById('cards-container')) {
    fetch('../../components/navbar/navbar.html')
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

    fetch('../../components/footer/footer.html')
        .then(res => res.text())
        .then(html => { document.getElementById('footer-placeholder').innerHTML = html; })
        .catch(err => console.error('Error cargando el footer:', err));

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderizarCatalogo);
    } else {
        renderizarCatalogo();
    }
}

let btnReservar;

/**
 * Renderiza el catálogo de servicios en el contenedor con id 'cards-container'.
 */
function renderizarCatalogo() {
    const container = document.getElementById('cards-container');
    if (!container) {
        console.error("No se encontró el contenedor 'cards-container'");
        return;
    }

    const lista = JSON.parse(localStorage.getItem("Lista de Servicios")) || productos;
    const productosActivos = lista
        .filter(producto => producto.status === true || producto.status === "true")
        .map(enriquecerProducto);

    const html = productosActivos.map(producto => {
        const precioFormateado = Number(producto.precio).toLocaleString('es-CO');
        const duracion = producto.duracionMinutos ?? 60;
        const tipo = (producto.tipo || '').trim();
        const tipoClase = tipo
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, '-');
        const badgeTipo = tipo
            ? `<span class="card-tipo badge-tipo badge-tipo--${tipoClase}">${tipo}</span>`
            : '';

        return `
            <article class="card-servicio">
                <div class="card-imagen-wrap">
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="card-imagen" loading="lazy">
                    ${badgeTipo}
                </div>
                <div class="card-contenido">
                    <h3 class="card-titulo">${producto.nombre}</h3>
                    <p class="card-descripcion">${producto.descripcion}</p>
                    <div class="card-meta">
                        <span class="card-duracion"><i class="fa-regular fa-clock"></i> ${duracion} min</span>
                    </div>
                    <div class="card-footer">
                        <div class="card-precio">$${precioFormateado}</div>
                        <button class="btn-reservar" data-id="${producto.id}">Reservar</button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    container.innerHTML = html;

    document.querySelectorAll('.btn-reservar').forEach(boton => {
        boton.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const listaActual = JSON.parse(localStorage.getItem("Lista de Servicios")) || productos;
            const productoSeleccionado = enriquecerProducto(
                listaActual.find(p => p.id === id) || productos.find(p => p.id === id)
            );

            localStorage.setItem('servicioSeleccionado', JSON.stringify(productoSeleccionado));
            window.location.href = '/pages/reservations/reservations.html';
        });
    });
}

export { productos, btnReservar };
