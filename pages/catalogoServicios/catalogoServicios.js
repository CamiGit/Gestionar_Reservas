const BASE_URL = "https://backend-style-factory.onrender.com";

let filtroTipoActivo = 'todos';
let _serviciosActivos = []; // cache en memoria para los filtros y el botón Reservar

// ── Navbar ────────────────────────────────────────────────────────────────────

async function actualizarNavbar() {
    const token = sfSession.getToken();
    const userInfo      = document.getElementById('user-info');
    const accesoBotones = document.getElementById('acceso-botones');
    const userNameSpan  = document.getElementById('userName');
    const adminLink     = document.getElementById('admin-link');

    if (token) {
        const usuario = await sfSession.getProfile();
        if (userNameSpan)  userNameSpan.textContent = `Hola, ${usuario?.nombre ?? ''}`;
        if (userInfo)       userInfo.style.display      = 'block';
        if (accesoBotones)  accesoBotones.style.display  = 'none';
        if (adminLink)      adminLink.style.display       = (usuario?.rol ?? '') === 'admin' ? 'block' : 'none';
    } else {
        if (userInfo)       userInfo.style.display      = 'none';
        if (accesoBotones)  accesoBotones.style.display  = 'block';
        if (adminLink)      adminLink.style.display       = 'none';
    }
}

async function cerrarSesion() {
    await sfSession.clear();
    window.location.href = '/index.html';
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchServicios() {
    const res = await fetch(`${BASE_URL}/servicios`);
    if (!res.ok) throw new Error(`GET /servicios → ${res.status}`);
    const data = await res.json();
    const lista = Array.isArray(data) ? data : (data.data ?? data.servicios ?? []);
    return lista
        .filter(s => s.estado === true || s.estado === 'true')
        .map(s => ({
            id:              s.id,
            nombre:          s.nombre          ?? '',
            descripcion:     s.descripcion     ?? '',
            precio:          s.precio          ?? 0,
            urlImagen:       s.urlImagen       ?? s.imagen ?? '',
            tipo:            s.tipoServicio    ?? s.tipo   ?? '',
            duracionMinutos: s.duracionMinutos ?? s.duracion ?? 60,
        }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugTipo(tipo) {
    return (tipo || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-');
}

function obtenerTiposUnicos(lista) {
    const tipos = new Set();
    lista.forEach(p => { const t = (p.tipo || '').trim(); if (t) tipos.add(t); });
    return Array.from(tipos).sort((a, b) => a.localeCompare(b, 'es'));
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderizarFiltros() {
    const contenedor = document.getElementById('catalogo-filtros');
    if (!contenedor) return;

    const tipos = obtenerTiposUnicos(_serviciosActivos);
    const chips = [
        { valor: 'todos', etiqueta: 'Todos', cantidad: _serviciosActivos.length },
        ...tipos.map(tipo => ({
            valor:    tipo,
            etiqueta: tipo,
            cantidad: _serviciosActivos.filter(p => p.tipo === tipo).length,
        })),
    ];

    contenedor.innerHTML = chips.map(chip => {
        const activo = filtroTipoActivo === chip.valor;
        return (
            `<button type="button" class="filtro-chip${activo ? ' activo' : ''}" ` +
            `data-tipo="${chip.valor}" role="tab" aria-selected="${activo}">` +
            `<span class="filtro-chip-texto">${chip.etiqueta}</span>` +
            `<span class="filtro-chip-count">${chip.cantidad}</span>` +
            `</button>`
        );
    }).join('');

    contenedor.querySelectorAll('.filtro-chip').forEach(btn => {
        btn.addEventListener('click', function () {
            filtroTipoActivo = this.getAttribute('data-tipo');
            renderizarFiltros();
            renderizarTarjetas();
        });
    });
}

function renderizarTarjetas() {
    const container = document.getElementById('cards-container');
    const vacio     = document.getElementById('catalogo-vacio');
    if (!container) return;

    const filtrados = filtroTipoActivo === 'todos'
        ? _serviciosActivos
        : _serviciosActivos.filter(p => p.tipo === filtroTipoActivo);

    if (!filtrados.length) {
        container.innerHTML  = '';
        container.style.display = 'none';
        if (vacio) vacio.style.display = 'flex';
        return;
    }

    container.style.display = 'grid';
    if (vacio) vacio.style.display = 'none';

    container.innerHTML = filtrados.map(producto => {
        const precio    = Number(producto.precio).toLocaleString('es-CO');
        const tipo      = (producto.tipo || '').trim();
        const badgeTipo = tipo
            ? `<span class="card-tipo badge-tipo badge-tipo--${slugTipo(tipo)}">${tipo}</span>`
            : '';
        return (
            `<article class="card-servicio">` +
            `<div class="card-imagen-wrap">` +
            `<img src="${producto.urlImagen}" alt="${producto.nombre}" class="card-imagen" loading="lazy">` +
            badgeTipo +
            `</div>` +
            `<div class="card-contenido">` +
            `<h3 class="card-titulo">${producto.nombre}</h3>` +
            `<p class="card-descripcion">${producto.descripcion}</p>` +
            `<div class="card-meta">` +
            `<span class="card-duracion"><i class="fa-regular fa-clock"></i> ${producto.duracionMinutos} min</span>` +
            `</div>` +
            `<div class="card-footer">` +
            `<div class="card-precio">$${precio}</div>` +
            `<button class="btn-reservar" data-id="${producto.id}">Reservar</button>` +
            `</div></div></article>`
        );
    }).join('');

    container.querySelectorAll('.btn-reservar').forEach(btn => {
        btn.addEventListener('click', function () {
            const id       = parseInt(this.getAttribute('data-id'), 10);
            const servicio = _serviciosActivos.find(p => p.id === id);
            if (servicio) {
                localStorage.setItem('servicioSeleccionado', JSON.stringify(servicio));
                window.location.href = '/pages/reservations/reservations.html';
            }
        });
    });
}

async function renderizarCatalogo() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    container.style.display = 'block';
    sfLoader.show('cards-container', 'Cargando servicios...');

    try {
        _serviciosActivos = await fetchServicios();
    } catch (err) {
        console.error('Error al cargar servicios:', err);
        container.innerHTML = '<p class="text-center text-muted py-5">No se pudieron cargar los servicios. Intenta de nuevo más tarde.</p>';
        return;
    }

    renderizarFiltros();
    renderizarTarjetas();
}

// ── Init ──────────────────────────────────────────────────────────────────────

if (document.getElementById('cards-container')) {
    fetch('../../components/navbar/navbar.html')
        .then(res => res.text())
        .then(async html => {
            document.getElementById('header').innerHTML = html;
            await actualizarNavbar();
            const btnCerrarSesion = document.getElementById('btnCerrarSesion');
            if (btnCerrarSesion) btnCerrarSesion.addEventListener('click', cerrarSesion);

            const enlaces    = document.querySelectorAll('.nav-link');
            let rutaActual   = window.location.pathname.split('/').pop();
            if (!rutaActual || rutaActual === '/') rutaActual = 'index.html';
            enlaces.forEach(enlace => {
                const rutaEnlace = enlace.getAttribute('href').split('/').pop();
                enlace.classList.toggle('active', rutaEnlace === rutaActual);
            });
        })
        .catch(err => console.error('Error cargando navbar:', err));

    fetch('../../components/footer/footer.html')
        .then(res => res.text())
        .then(html => { document.getElementById('footer-placeholder').innerHTML = html; })
        .catch(err => console.error('Error cargando footer:', err));

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderizarCatalogo);
    } else {
        renderizarCatalogo();
    }
}
