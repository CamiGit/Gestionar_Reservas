import { productos } from '../../assets/js/productosCatalogo.js';

let filtroTipoActivo = 'todos';

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

function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    actualizarNavbar();
    window.location.href = '/index.html';
}

function enriquecerProducto(producto) {
    const base = productos.find(function (p) { return p.id === producto.id; }) || {};
    return Object.assign({}, base, producto, {
        tipo: producto.tipo || base.tipo || '',
        duracionMinutos: producto.duracionMinutos ?? base.duracionMinutos ?? 60
    });
}

function obtenerProductosActivos() {
    const lista = JSON.parse(localStorage.getItem('Lista de Servicios')) || productos;
    return lista
        .filter(producto => producto.status === true || producto.status === 'true')
        .map(enriquecerProducto);
}

function slugTipo(tipo) {
    return (tipo || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-');
}

function obtenerTiposUnicos(productosActivos) {
    const tipos = new Set();
    productosActivos.forEach(function (p) {
        const tipo = (p.tipo || '').trim();
        if (tipo) tipos.add(tipo);
    });
    return Array.from(tipos).sort(function (a, b) {
        return a.localeCompare(b, 'es');
    });
}

function renderizarFiltros(productosActivos) {
    const contenedor = document.getElementById('catalogo-filtros');
    if (!contenedor) return;

    const tipos = obtenerTiposUnicos(productosActivos);
    const chips = [
        { valor: 'todos', etiqueta: 'Todos', cantidad: productosActivos.length }
    ].concat(
        tipos.map(function (tipo) {
            return {
                valor: tipo,
                etiqueta: tipo,
                cantidad: productosActivos.filter(function (p) { return p.tipo === tipo; }).length
            };
        })
    );

    contenedor.innerHTML = chips.map(function (chip) {
        const activo = filtroTipoActivo === chip.valor;
        const slug = chip.valor === 'todos' ? 'todos' : slugTipo(chip.valor);
        return (
            '<button type="button" class="filtro-chip' + (activo ? ' activo' : '') + '" ' +
            'data-tipo="' + chip.valor + '" role="tab" aria-selected="' + activo + '">' +
            '<span class="filtro-chip-texto">' + chip.etiqueta + '</span>' +
            '<span class="filtro-chip-count">' + chip.cantidad + '</span>' +
            '</button>'
        );
    }).join('');

    contenedor.querySelectorAll('.filtro-chip').forEach(function (boton) {
        boton.addEventListener('click', function () {
            filtroTipoActivo = this.getAttribute('data-tipo');
            renderizarCatalogo();
        });
    });
}

function renderizarCatalogo() {
    const container = document.getElementById('cards-container');
    const vacio = document.getElementById('catalogo-vacio');
    if (!container) {
        console.error("No se encontró el contenedor 'cards-container'");
        return;
    }

    const productosActivos = obtenerProductosActivos();
    renderizarFiltros(productosActivos);

    const filtrados = filtroTipoActivo === 'todos'
        ? productosActivos
        : productosActivos.filter(function (p) { return p.tipo === filtroTipoActivo; });

    if (filtrados.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        if (vacio) vacio.style.display = 'flex';
        return;
    }

    container.style.display = 'grid';
    if (vacio) vacio.style.display = 'none';

    container.innerHTML = filtrados.map(function (producto) {
        const precioFormateado = Number(producto.precio).toLocaleString('es-CO');
        const duracion = producto.duracionMinutos ?? 60;
        const tipo = (producto.tipo || '').trim();
        const tipoClase = slugTipo(tipo);
        const badgeTipo = tipo
            ? '<span class="card-tipo badge-tipo badge-tipo--' + tipoClase + '">' + tipo + '</span>'
            : '';

        return (
            '<article class="card-servicio">' +
            '<div class="card-imagen-wrap">' +
            '<img src="' + producto.imagen + '" alt="' + producto.nombre + '" class="card-imagen" loading="lazy">' +
            badgeTipo +
            '</div>' +
            '<div class="card-contenido">' +
            '<h3 class="card-titulo">' + producto.nombre + '</h3>' +
            '<p class="card-descripcion">' + producto.descripcion + '</p>' +
            '<div class="card-meta">' +
            '<span class="card-duracion"><i class="fa-regular fa-clock"></i> ' + duracion + ' min</span>' +
            '</div>' +
            '<div class="card-footer">' +
            '<div class="card-precio">$' + precioFormateado + '</div>' +
            '<button class="btn-reservar" data-id="' + producto.id + '">Reservar</button>' +
            '</div>' +
            '</div>' +
            '</article>'
        );
    }).join('');

    container.querySelectorAll('.btn-reservar').forEach(function (boton) {
        boton.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'), 10);
            const listaActual = JSON.parse(localStorage.getItem('Lista de Servicios')) || productos;
            const productoSeleccionado = enriquecerProducto(
                listaActual.find(function (p) { return p.id === id; }) ||
                productos.find(function (p) { return p.id === id; })
            );

            localStorage.setItem('servicioSeleccionado', JSON.stringify(productoSeleccionado));
            window.location.href = '/pages/reservations/reservations.html';
        });
    });
}

if (document.getElementById('cards-container')) {
    fetch('../../components/navbar/navbar.html')
        .then(function (res) { return res.text(); })
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

    fetch('../../components/footer/footer.html')
        .then(function (res) { return res.text(); })
        .then(function (html) {
            document.getElementById('footer-placeholder').innerHTML = html;
        })
        .catch(function (err) { console.error('Error cargando el footer:', err); });

<<<<<<< HEAD
    document.addEventListener('DOMContentLoaded', renderizarCatalogo);
}

let btnReservar;

/**const productos = [
    { id: 1, nombre: "Corte de Cabello Premium", descripcion: "Corte moderno con técnicas personalizadas según tu tipo de cabello.", precio: 45000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957776/cortePremium_engl79.png", status: true },
    { id: 2, nombre: "Tinte y Coloración", descripcion: "Coloración de alta calidad con marcas premium. Resultados duraderos.", precio: 120000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957782/tinteColoracion_xlsf5v.png", status: true },
    { id: 3, nombre: "Tratamiento de Keratina", descripcion: "Alisado profundo que elimina el frizz y deja el cabello sedoso.", precio: 180000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957777/keratina_bjqvof.png", status: true },
    { id: 4, nombre: "Barba y Afeitado", descripcion: "Servicio completo de perfilado de barba y afeitado clásico.", precio: 35000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957775/barbaAfeitado_fcacso.png", status: true },
    { id: 5, nombre: "Peinado para Eventos", descripcion: "Peinados profesionales para bodas, graduaciones y eventos especiales.", precio: 80000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957782/peinadoEventos_bk9cyr.png", status: true },
    { id: 6, nombre: "Mechas y Reflejos", descripcion: "Técnicas de mechas californianas, babylights y reflejos.", precio: 150000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957780/mechasReflejos_p5hod7.png", status: true },
    { id: 7, nombre: "Tratamiento Capilar", descripcion: "Hidratación y nutrición profunda para cabello maltratado.", precio: 65000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957783/tratamientoCapilar_mqkb13.png", status: true },
    { id: 8, nombre: "Cepillado Brasileño", descripcion: "Alisado progresivo que reduce el volumen y da brillo.", precio: 160000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957775/cepilladoBrasile%C3%B1o_ela99r.png", status: true },
    { id: 9, nombre: "Maquillaje Profesional", descripcion: "Maquillaje para ocasiones especiales con productos de alta calidad.", precio: 90000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957779/maquillajeProfesional_h9vo1k.png", status: true },
    { id: 10, nombre: "Limpieza Facial", descripcion: "Tratamiento facial profundo para eliminar impurezas y revitalizar.", precio: 70000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957778/limpiezaFacial_fmvrnn.png", status: true }
]; */

/**
 * Renderiza el catálogo de servicios en el contenedor correspondiente
 * Filtra solo los servicios activos y genera las tarjetas dinámicamente
 */
function renderizarCatalogo() {
    const container = document.getElementById('cards-container');
    if (!container) {
        console.error("No se encontró el contenedor 'cards-container'");
        return;
    }
 //console para traer el array de servicios desde localStorage
    console.log("Servicios obtenidos de localStorage:", JSON.parse(localStorage.getItem("Lista de Servicios")));
    const lista = JSON.parse(localStorage.getItem("Lista de Servicios")) || [];
    const productosActivos = lista.filter(producto => producto.estado === true || producto.estado === "true");
     
    console.log("Productos activos filtrados:", productosActivos);
    const html = productosActivos.map(producto => {
        console.log("Producto activo:", producto);
        const precioFormateado = Number(producto.precio).toLocaleString('es-CO');
        return `
            <div class="card-servicio">
                <img src="${producto.urlImagen}" alt="${producto.nombre}" class="card-imagen">
                <div class="card-contenido">
                    <h3 class="card-titulo">${producto.nombre}</h3>
                    <p class="card-descripcion">${producto.descripcion}</p>
                    <div class="card-precio">$${precioFormateado}</div>
                    <button class="btn-reservar" data-id="${producto.id}">RESERVAR</button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    document.querySelectorAll('.btn-reservar').forEach(boton => {
        boton.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const listaActual = JSON.parse(localStorage.getItem("Lista de Servicios")) || [];
            const productoSeleccionado = listaActual.find(p => p.id === id);

            // Guarda el servicio seleccionado para la reserva
            localStorage.setItem('servicioSeleccionado', JSON.stringify(productoSeleccionado));

            window.location.href = '/pages/reservations/reservations.html';
        });
    });
}

document.addEventListener('DOMContentLoaded', renderizarCatalogo);

export { btnReservar };
=======
    const btnVerTodos = document.getElementById('btn-ver-todos');
    if (btnVerTodos) {
        btnVerTodos.addEventListener('click', function () {
            filtroTipoActivo = 'todos';
            renderizarCatalogo();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderizarCatalogo);
    } else {
        renderizarCatalogo();
    }
}

export { productos };
>>>>>>> Dev
