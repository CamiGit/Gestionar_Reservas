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
        })
        .catch(function (err) { console.error('Error cargando el navbar:', err); });

    fetch('../../components/footer/footer.html')
        .then(function (res) { return res.text(); })
        .then(function (html) {
            document.getElementById('footer-placeholder').innerHTML = html;
        })
        .catch(function (err) { console.error('Error cargando el footer:', err); });

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
