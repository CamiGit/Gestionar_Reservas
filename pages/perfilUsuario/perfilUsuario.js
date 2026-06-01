/* =========================================================
 *  perfilUsuario.js
 *
 *  Flujo:
 *    1. Leer token JWT del storage (guardado por el login)
 *    2. Extraer correo del claim `sub` del JWT
 *    3. GET /usuarios  → filtrar por correo → obtener perfil completo
 *    4. Reservas       → leer de localStorage["reservas"], filtrar por nombre
 * ========================================================= */

/* ---------------------------------------------------------
 * 1. TOKEN
 * --------------------------------------------------------- */

/*
 * Obtiene únicamente el token JWT del almacenamiento de sesión.
 * No se usa ningún dato de perfil guardado en localStorage/sessionStorage.
 */
function getToken() {
    const raw = localStorage.getItem('usuarioLogueado')
             || sessionStorage.getItem('usuarioLogueado');
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed?.token ?? null;
    } catch {
        return typeof raw === 'string' && raw.includes('.') ? raw : null;
    }
}

function getStoredUsuarioLogueado() {
    const raw = localStorage.getItem('usuarioLogueado')
             || sessionStorage.getItem('usuarioLogueado');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Decodifica el payload del JWT sin verificar firma.
 * Usado únicamente para extraer el correo del claim `sub`.
 */
function parseJwtPayload(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}

function getCorreoDesdeJWT(token) {
    const payload = parseJwtPayload(token);
    if (!payload) return null;

    const sub = payload.sub;
    if (typeof sub === 'string' && sub.includes('@')) {
        return sub;
    }
    if (typeof sub === 'object' && sub !== null) {
        return sub.email ?? sub.correo ?? null;
    }

    return payload.email ?? payload.correo ?? payload.user?.email ?? payload.usuario?.correo ?? null;
}

/* ---------------------------------------------------------
 * 2. LLAMADAS A LA API
 * --------------------------------------------------------- */

function authHeaders(token) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

/**
 * GET /usuarios → encuentra el usuario cuyo correo coincide con el del JWT.
 * Devuelve el objeto completo (con id, telefono, rol, etc.) o null.
 */
async function fetchUsuarioPorCorreo(correo, token) {
    const res = await fetch(`${BASE_URL}/usuarios`, {
        headers: authHeaders(token),
    });
    if (!res.ok) {
        const bodyText = await res.text().catch(() => null);
        console.warn(`GET /usuarios → ${res.status}`, bodyText);
        return null;
    }
    const data = await res.json();
    const lista = Array.isArray(data)
        ? data
        : data.usuarios ?? data.users ?? data.data?.usuarios ?? data.data?.users ?? [];

    return lista.find(u =>
        (u.correo || u.email || '').toLowerCase() === correo.toLowerCase()
    ) ?? null;
}

async function fetchReservasDeAPI(nombreUsuario, token) {
    const res = await fetch(`${BASE_URL}/reservas`, {
        headers: authHeaders(token),
    });
    if (!res.ok) {
        console.warn(`GET /reservas → ${res.status}`);
        return null;
    }
    const data = await res.json();
    const lista = Array.isArray(data) ? data : data.reservas ?? data.data ?? [];
    if (!nombreUsuario) return lista;
    return lista.filter(r =>
        (r.nombreUsuario || '').toLowerCase() === nombreUsuario.toLowerCase()
    );
}

async function fetchPerfilMe(token) {
    const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: authHeaders(token),
    });
    if (!res.ok) {
        const bodyText = await res.text().catch(() => null);
        console.warn(`GET /auth/me → ${res.status}`, bodyText);
        return null;
    }
    const data = await res.json();
    return data.usuario || data.user || data.data?.usuario || data.data?.user || data || null;
}

function obtenerIdUsuario(usuario) {
    const u = normalizeUsuario(usuario);
    return u?.id ?? u?._id ?? u?.usuarioId ?? u?.clienteId ?? null;
}

function normalizeUsuario(usuario) {
    if (!usuario || typeof usuario !== 'object') return usuario;
    if (usuario.usuario && typeof usuario.usuario === 'object') return normalizeUsuario(usuario.usuario);
    if (usuario.user && typeof usuario.user === 'object') return normalizeUsuario(usuario.user);
    if (usuario.data && typeof usuario.data === 'object') {
        if (usuario.data.usuario && typeof usuario.data.usuario === 'object') return normalizeUsuario(usuario.data.usuario);
        if (usuario.data.user && typeof usuario.data.user === 'object') return normalizeUsuario(usuario.data.user);
    }
    return usuario;
}

function getReservasLocales(nombreUsuario) {
    const todas = JSON.parse(localStorage.getItem('reservas')) || [];
    if (!nombreUsuario) return todas;
    return todas.filter(r =>
        (r.cliente || '').toLowerCase() === nombreUsuario.toLowerCase()
    );
}

/* ---------------------------------------------------------
 * 3. HELPERS DE UI
 * --------------------------------------------------------- */

function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function mostrarPantallaNoSesion() {
    const container = document.querySelector('.profile-page .container-custom');
    if (!container) return;
    container.innerHTML = `
        <div class="text-center py-5" style="animation: fadeUp 0.6s ease both;">
            <div style="width:100px;height:100px;border-radius:50%;background:var(--color-primary-soft);
                        display:flex;align-items:center;justify-content:center;
                        margin:0 auto 1.5rem;border:2px solid var(--border);">
                <i class="fa-regular fa-circle-user fa-3x" style="color:var(--color-primary);opacity:0.6;"></i>
            </div>
            <h2 class="mb-3" style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:var(--color-primary);">
                Sesión no iniciada
            </h2>
            <p style="color:var(--muted);max-width:400px;margin:0 auto 2rem;line-height:1.7;">
                Para ver tu perfil y administrar tus reservas, ingresa con tu cuenta.
            </p>
            <a href="/pages/login/login.html" class="btn btn-primary">
                <i class="fa-solid fa-right-to-bracket"></i>
                Iniciar sesión
            </a>
        </div>`;
}

function mostrarErrorPerfil(mensaje = 'Hubo un problema al comunicarse con el servidor.') {
    const container = document.querySelector('.profile-page .container-custom');
    if (!container) return;
    container.innerHTML = `
        <div class="text-center py-5" style="animation: fadeUp 0.6s ease both;">
            <div style="width:100px;height:100px;border-radius:50%;background:var(--color-primary-soft);
                        display:flex;align-items:center;justify-content:center;
                        margin:0 auto 1.5rem;border:2px solid var(--border);">
                <i class="fa-solid fa-triangle-exclamation fa-2x" style="color:var(--color-secondary);"></i>
            </div>
            <h2 class="mb-3" style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:var(--color-primary);">
                No se pudo cargar el perfil
            </h2>
            <p style="color:var(--muted);max-width:400px;margin:0 auto 2rem;line-height:1.7;">
                ${mensaje} Intenta de nuevo más tarde.
            </p>
            <a href="/pages/login/login.html" class="btn btn-outline-secondary">Volver al inicio</a>
        </div>`;
}

function animarContador(el, target, duration = 1200) {
    if (!el || target === 0) return;
    const start = performance.now();
    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.round((1 - Math.pow(1 - progress, 3)) * target);
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

/* ---------------------------------------------------------
 * 4. RENDER DEL PERFIL
 * --------------------------------------------------------- */

function pintarPerfil(u) {
    const usuario = normalizeUsuario(u) ?? {};
    const nombre   = usuario.nombre || usuario.nombreCompleto || usuario.fullName || 'Usuario';
    const correo   = usuario.correo || usuario.email || 'No definido';
    const telefono = ((usuario.telefono ?? usuario.celular ?? usuario.mobile ?? usuario.telefonoContacto ?? '') + '').trim()
                     || 'Sin teléfono registrado';
    const rol      = (usuario.rol ?? usuario.role ?? usuario.tipo ?? 'CLIENTE').toString().toUpperCase() === 'ADMIN'
                     ? 'Administrador' : 'Cliente';

    const fechaMiembro = (u.fechaRegistro || u.createdAt || u.created_at)
        ? new Date(u.fechaRegistro ?? u.createdAt ?? u.created_at).toLocaleDateString('es-CO', {
              year: 'numeric', month: 'long', day: 'numeric',
          })
        : '-';

    const fechaLogin = (u.fechaLogin || u.lastLogin || u.last_login)
        ? new Date(u.fechaLogin ?? u.lastLogin ?? u.last_login).toLocaleDateString('es-CO')
        : 'Hoy';

    const avatarUrl = u.avatar || u.imagen
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=522676&color=ffffff&size=256`;

    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.src = avatarUrl;

    setTexto('profileName',       nombre);
    setTexto('profileNameDetail', nombre);
    setTexto('profileEmail',      correo);
    setTexto('profilePhone',      telefono);
    setTexto('profileRoleDetail', rol);
    setTexto('profileJoined',     fechaMiembro);
    setTexto('profileLastLogin',  fechaLogin);

    const roleEl = document.getElementById('profileRole');
    if (roleEl) roleEl.innerHTML = `<i class="fa-solid fa-circle-check fa-xs"></i> ${rol}`;
}

/* ---------------------------------------------------------
 * 5. RENDER DE RESERVAS (DOM seguro — sin innerHTML con datos externos)
 * --------------------------------------------------------- */

function getEstadoMeta(estado) {
    const map = {
        pendiente:  { label: 'Pendiente',  color: '#d97706', bg: 'rgba(217,119,6,0.1)',  icon: 'fa-clock' },
        confirmada: { label: 'Confirmada', color: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: 'fa-circle-check' },
        completada: { label: 'Completada', color: '#522676', bg: 'rgba(82,34,118,0.1)',  icon: 'fa-circle-check' },
        cancelada:  { label: 'Cancelada',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  icon: 'fa-circle-xmark' },
    };
    const key = (estado || '').toString().toLowerCase();
    return map[key] || { label: estado || 'Sin estado', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: 'fa-circle-question' };
}

function crearMetaSpan(iconClass, texto) {
    const s = document.createElement('span');
    const i = document.createElement('i');
    i.className = iconClass;
    s.appendChild(i);
    s.appendChild(document.createTextNode(' ' + texto));
    return s;
}

function crearElementoReserva(r, idx) {
    const nombreServicio = r.servicio?.nombre || r.nombreServicio || 'Servicio';
    const precio = r.servicio?.precio != null
        ? '$' + Number(r.servicio.precio).toLocaleString('es-CO')
        : r.precio != null
        ? '$' + Number(r.precio).toLocaleString('es-CO')
        : '';
    const profesional = r.empleado?.nombre || r.profesional?.nombre || r.nombreEmpleado || r.empleado || r.profesional || '';

    let fecha = 'Fecha no definida';
    const fechaRaw = r.fecha || r.fechaReserva;
    if (fechaRaw) {
        const partes = String(fechaRaw).split('/');
        const dateObj = partes.length === 3
            ? new Date(`${partes[2]}-${partes[1]}-${partes[0]}`)
            : new Date(fechaRaw);
        fecha = isNaN(dateObj)
            ? String(fechaRaw)
            : dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const hora   = r.hora || r.horaReserva || '';
    const estado = getEstadoMeta(r.estado || r.status || r.estadoReserva);

    const item = document.createElement('div');
    item.className = 'reserva-item';
    item.style.animationDelay = `${idx * 0.06}s`;

    const icono = document.createElement('div');
    icono.className = 'reserva-icono';
    const iconoI = document.createElement('i');
    iconoI.className = 'fa-solid fa-cut';
    icono.appendChild(iconoI);

    const body  = document.createElement('div');
    body.className = 'reserva-body';

    const top = document.createElement('div');
    top.className = 'reserva-top';

    const spanServicio = document.createElement('span');
    spanServicio.className = 'reserva-servicio';
    spanServicio.textContent = nombreServicio;

    const spanEstado = document.createElement('span');
    spanEstado.className = 'reserva-estado';
    spanEstado.style.color      = estado.color;
    spanEstado.style.background = estado.bg;
    const estadoI = document.createElement('i');
    estadoI.className = `fa-solid ${estado.icon} fa-xs`;
    spanEstado.appendChild(estadoI);
    spanEstado.appendChild(document.createTextNode(' ' + estado.label));

    top.appendChild(spanServicio);
    top.appendChild(spanEstado);

    const meta = document.createElement('div');
    meta.className = 'reserva-meta';
    meta.appendChild(crearMetaSpan('fa-solid fa-calendar fa-xs', fecha));
    if (hora)        meta.appendChild(crearMetaSpan('fa-solid fa-clock fa-xs',    hora));
    if (profesional) meta.appendChild(crearMetaSpan('fa-solid fa-user fa-xs',     profesional));
    if (precio)      meta.appendChild(crearMetaSpan('fa-solid fa-tag fa-xs',      precio));

    body.appendChild(top);
    body.appendChild(meta);
    item.appendChild(icono);
    item.appendChild(body);
    return item;
}

function renderReservas(reservas) {
    const lista = document.getElementById('reservasList');
    const badge = document.getElementById('reservasBadge');
    if (!lista) return;

    if (badge) badge.textContent = reservas.length;
    lista.replaceChildren();

    if (!reservas.length) {
        lista.innerHTML = `
            <div class="reservas-empty">
                <div class="reservas-empty-icon">
                    <i class="fa-solid fa-calendar-xmark"></i>
                </div>
                <p class="reservas-empty-title">Sin reservas aún</p>
                <p class="reservas-empty-sub">Cuando agendes una cita aparecerá aquí.</p>
                <a href="/pages/catalogoServicios/catalogoServicios.html" class="btn btn-primary" style="margin-top:1rem;">
                    <i class="fa-solid fa-cut"></i> Ver catálogo
                </a>
            </div>`;
        return;
    }

    const ordenadas = [...reservas].sort((a, b) =>
        new Date(b.fecha || b.fechaReserva || 0) - new Date(a.fecha || a.fechaReserva || 0)
    );

    const frag = document.createDocumentFragment();
    ordenadas.forEach((r, idx) => frag.appendChild(crearElementoReserva(r, idx)));
    lista.appendChild(frag);
}

/* ---------------------------------------------------------
 * 6. STATS
 * --------------------------------------------------------- */

function renderStats(totalReservas) {
    const reservasCount  = document.getElementById('reservasCount');
    const favoritosCount = document.getElementById('favoritosCount');
    const puntosCount    = document.getElementById('puntosCount');

    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animarContador(reservasCount, totalReservas);
                    if (favoritosCount) favoritosCount.textContent = 0;
                    if (puntosCount)    puntosCount.textContent    = 0;
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });
        observer.observe(statsGrid);
    } else {
        if (reservasCount)  reservasCount.textContent  = totalReservas;
        if (favoritosCount) favoritosCount.textContent = 0;
        if (puntosCount)    puntosCount.textContent    = 0;
    }
}

/* ---------------------------------------------------------
 * 7. PUNTO DE ENTRADA
 * --------------------------------------------------------- */

async function renderPerfilUsuario() {
    const usuarioGuardado = getStoredUsuarioLogueado();
    const token = getToken();

    if (usuarioGuardado) {
        console.debug('perfilUsuario: renderizando usuario guardado mientras se valida la API.');
        pintarPerfil(usuarioGuardado);
        renderStats(0);
        renderReservas([]);
    }

    if (!token) {
        if (!usuarioGuardado) {
            mostrarPantallaNoSesion();
        }
        return;
    }

    const correo = getCorreoDesdeJWT(token);
    console.debug('perfilUsuario: token encontrado?', !!token, 'correo extraído:', correo);

    try {
        let usuario = null;
        if (correo) {
            usuario = await fetchUsuarioPorCorreo(correo, token);
            console.debug('perfilUsuario: usuario por correo obtenido:', usuario);
        }

        if (!usuario) {
            usuario = await fetchPerfilMe(token);
            console.debug('perfilUsuario: usuario desde auth/me obtenido:', usuario);
        }

        if (!usuario && usuarioGuardado) {
            usuario = usuarioGuardado;
            console.warn('perfilUsuario: usando usuario guardado en storage como fallback después de fallo de API.', usuario);
        }

        if (!usuario) {
            mostrarErrorPerfil('Usuario no encontrado en el sistema.');
            return;
        }

        _usuarioIdActual = obtenerIdUsuario(usuario) ?? usuarioGuardado?.id ?? null;

        const nombreUsuario = normalizeUsuario(usuario)?.nombre
                           || normalizeUsuario(usuario)?.nombreCompleto
                           || normalizeUsuario(usuario)?.fullName
                           || usuarioGuardado?.nombre
                           || null;

        let reservas = [];
        try {
            const reservasAPI = await fetchReservasDeAPI(nombreUsuario, token);
            reservas = reservasAPI ?? getReservasLocales(nombreUsuario);
        } catch {
            reservas = getReservasLocales(nombreUsuario);
        }

        const usuarioNorm = normalizeUsuario(usuario);
        const telefonoAPI = usuarioNorm?.telefono || usuarioNorm?.celular || usuarioNorm?.mobile || usuarioNorm?.telefonoContacto || '';
        const telefonoFinal = telefonoAPI || usuarioGuardado?.telefono || '';
        const usuarioParaMostrar = { ...usuarioNorm, telefono: telefonoFinal };

        // Sincronizar el localStorage con el teléfono obtenido de la API
        if (telefonoFinal && usuarioGuardado && !usuarioGuardado.telefono) {
            const storageUpdated = { ...usuarioGuardado, telefono: telefonoFinal };
            if (localStorage.getItem('usuarioLogueado')) {
                localStorage.setItem('usuarioLogueado', JSON.stringify(storageUpdated));
            } else {
                sessionStorage.setItem('usuarioLogueado', JSON.stringify(storageUpdated));
            }
        }

        pintarPerfil(usuarioParaMostrar);
        renderStats(reservas.length);
        renderReservas(reservas);

    } catch (err) {
        console.error('Error cargando perfil:', err);
        mostrarErrorPerfil();
    }
}

/* ---------------------------------------------------------
 * 8. MODAL EDITAR PERFIL
 * --------------------------------------------------------- */

let _usuarioIdActual = null;

async function actualizarUsuarioEnAPI(id, datos, token) {
    const res = await fetch(`${BASE_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(datos),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => null);
        throw new Error(`PUT /usuarios/${id} → ${res.status} ${body}`);
    }
    return res.json().catch(() => null);
}

function initModalEditarPerfil() {
    const modalEl = document.getElementById('modalEditarPerfil');
    if (!modalEl) return;

    modalEl.addEventListener('show.bs.modal', () => {
        const usuario = getStoredUsuarioLogueado() || {};
        document.getElementById('editNombre').value   = usuario.nombre   || '';
        document.getElementById('editCorreo').value   = usuario.correo   || '';
        document.getElementById('editTelefono').value = usuario.telefono || '';
        document.getElementById('editMensajeExito').classList.add('d-none');
        document.getElementById('formEditarPerfil').classList.remove('was-validated');
        const inputCorreo = document.getElementById('editCorreo');
        inputCorreo.classList.remove('is-invalid');
        inputCorreo.nextElementSibling?.classList?.contains('invalid-feedback') && inputCorreo.nextElementSibling.remove();
    });

    document.getElementById('btnGuardarPerfil').addEventListener('click', async () => {
        const form = document.getElementById('formEditarPerfil');
        form.classList.add('was-validated');
        if (!form.checkValidity()) return;

        const nombre   = document.getElementById('editNombre').value.trim();
        const correo   = document.getElementById('editCorreo').value.trim();
        const telefono = document.getElementById('editTelefono').value.trim();

        const btn = document.getElementById('btnGuardarPerfil');
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        const storageKey = localStorage.getItem('usuarioLogueado') ? 'localStorage' : 'sessionStorage';
        const raw = localStorage.getItem('usuarioLogueado') || sessionStorage.getItem('usuarioLogueado');
        let usuarioLocal = {};
        try { usuarioLocal = JSON.parse(raw) || {}; } catch { /* noop */ }

        const actualizado = { ...usuarioLocal, nombre, correo, telefono };

        const token = getToken();
        const idParaActualizar = _usuarioIdActual ?? usuarioLocal?.id ?? null;
        const rolParaAPI = (usuarioLocal.rol ?? 'CLIENTE').toUpperCase();

        let apiExitosa = false;
        let errorCorreoDuplicado = false;
        if (token && idParaActualizar) {
            try {
                await actualizarUsuarioEnAPI(idParaActualizar, { nombre, correo, telefono, rol: rolParaAPI }, token);
                apiExitosa = true;
            } catch (err) {
                if (err.message.toLowerCase().includes('correo')) {
                    errorCorreoDuplicado = true;
                }
                console.error('PUT /usuarios error:', err.message);
            }
        }

        // Si el correo está duplicado, mostrar error y no guardar localmente
        if (errorCorreoDuplicado) {
            const inputCorreo = document.getElementById('editCorreo');
            inputCorreo.classList.add('is-invalid');
            inputCorreo.nextElementSibling?.remove();
            const feedbackEl = document.createElement('div');
            feedbackEl.className = 'invalid-feedback d-block';
            feedbackEl.textContent = 'Este correo ya está en uso por otro usuario.';
            inputCorreo.insertAdjacentElement('afterend', feedbackEl);
            btn.disabled = false;
            btn.textContent = 'Guardar cambios';
            return;
        }

        // Limpiar validación de correo si estaba marcado
        const inputCorreo = document.getElementById('editCorreo');
        inputCorreo.classList.remove('is-invalid');
        inputCorreo.nextElementSibling?.classList?.contains('invalid-feedback') && inputCorreo.nextElementSibling.remove();

        if (storageKey === 'localStorage') {
            localStorage.setItem('usuarioLogueado', JSON.stringify(actualizado));
        } else {
            sessionStorage.setItem('usuarioLogueado', JSON.stringify(actualizado));
        }

        pintarPerfil(actualizado);
        btn.disabled = false;
        btn.textContent = 'Guardar cambios';

        const msgEl = document.getElementById('editMensajeExito');
        if (apiExitosa) {
            msgEl.className = 'alert alert-success py-2';
            msgEl.textContent = 'Datos actualizados correctamente.';
        } else {
            msgEl.className = 'alert alert-warning py-2';
            msgEl.textContent = 'Guardado localmente. No se pudo sincronizar con el servidor (revisa la consola).';
        }
        msgEl.classList.remove('d-none');
        setTimeout(() => {
            bootstrap.Modal.getInstance(modalEl).hide();
        }, 2500);
    });
}

/* ---------------------------------------------------------
 * 9. ARRANQUE
 * --------------------------------------------------------- */
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        renderPerfilUsuario();
        initModalEditarPerfil();
    });
} else {
    renderPerfilUsuario();
    initModalEditarPerfil();
}