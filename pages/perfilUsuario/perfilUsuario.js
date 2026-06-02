/* =========================================================
 *  perfilUsuario.js
 *
 *  Flujo:
 *    1. Token       → localStorage via sfSession.getToken()
 *    2. Perfil base → Cache API via sfSession.getProfile()
 *    3. GET /usuarios → obtener perfil completo y actualizar caché
 *    4. Reservas    → GET /reservas filtradas por id de usuario
 * ========================================================= */

const BASE_URL = "https://backend-style-factory.onrender.com";

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
    const lista = Array.isArray(data) ? data : (data.reservas ?? data.data ?? data.content ?? []);

    if (!lista.length) return lista;

    return lista.filter(r =>
        (r.nombreUsuario ?? '').toLowerCase() === (nombreUsuario ?? '').toLowerCase()
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
        pendiente:  { label: 'Confirmado', color: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: 'fa-circle-check' },
        confirmada: { label: 'Confirmado', color: '#059669', bg: 'rgba(5,150,105,0.1)',  icon: 'fa-circle-check' },
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
    // El backend devuelve: nombreServicio, nombreEmpleado, nombreUsuario, fecha, hora, estado
    const nombreServicio = r.nombreServicio || r.servicio?.nombre || 'Servicio';

    const precio = r.servicio?.precio != null
        ? '$' + Number(r.servicio.precio).toLocaleString('es-CO')
        : r.precio != null
        ? '$' + Number(r.precio).toLocaleString('es-CO')
        : '';

    const profesional = r.nombreEmpleado || r.empleado?.nombre || r.profesional?.nombre || '';

    // fechaHora puede venir como "2026-06-01T09:00:00" (LocalDateTime del backend)
    const fechaHoraRaw = r.fechaHora || r.fecha || r.fechaReserva || '';
    let fecha = 'Fecha no definida';
    let horaAPI = r.hora || r.horaReserva || '';

    if (fechaHoraRaw) {
        // Si contiene T, es LocalDateTime: extraer fecha y hora
        if (String(fechaHoraRaw).includes('T')) {
            const [fechaParte, horaParte] = String(fechaHoraRaw).split('T');
            horaAPI = horaAPI || horaParte?.substring(0, 5);
            const dateObj = new Date(fechaHoraRaw);
            fecha = isNaN(dateObj)
                ? fechaParte
                : dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
        } else {
            const partes = String(fechaHoraRaw).split('/');
            const dateObj = partes.length === 3
                ? new Date(`${partes[2]}-${partes[1]}-${partes[0]}`)
                : new Date(fechaHoraRaw);
            fecha = isNaN(dateObj)
                ? String(fechaHoraRaw)
                : dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
        }
    }

    const hora   = horaAPI || r.hora || r.horaReserva || '';
    const estado = getEstadoMeta(r.estado || r.status || r.estadoReserva || r.estadoReserva);

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

    // Grupo derecho: estado + botón cancelar alineados
    const acciones = document.createElement('div');
    acciones.className = 'reserva-acciones';
    acciones.appendChild(spanEstado);


    item.appendChild(acciones);
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
        new Date(b.fechaHora || b.fecha || b.fechaReserva || 0) -
        new Date(a.fechaHora || a.fecha || a.fechaReserva || 0)
    );

    const frag = document.createDocumentFragment();
    ordenadas.forEach((r, idx) => frag.appendChild(crearElementoReserva(r, idx)));
    lista.appendChild(frag);
}

/* ---------------------------------------------------------
 * 6. STATS
 * --------------------------------------------------------- */

function renderStats(totalReservas, reservas = []) {
    const reservasCount = document.getElementById('reservasCount');

    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animarContador(reservasCount, totalReservas);
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });
        observer.observe(statsGrid);
    } else {
        if (reservasCount) reservasCount.textContent = totalReservas;
    }

    // Calcular profesional favorito
    const profEl = document.getElementById('profesionalFavorito');
    if (profEl) {
        const conteo = {};
        reservas.forEach(r => {
            const nombre = r.nombreEmpleado || '';
            if (nombre) conteo[nombre] = (conteo[nombre] || 0) + 1;
        });
        const favorito = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
        profEl.textContent = favorito ? favorito[0] : '—';
    }

    // Calcular próxima cita
    const fechaEl = document.getElementById('proximaCitaFecha');
    const horaEl  = document.getElementById('proximaCitaHora');
    if (!fechaEl) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const proxima = reservas
        .map(r => {
            const raw = r.fechaHora || r.fecha || '';
            const fechaStr = raw.includes('T') ? raw.split('T')[0] : raw;
            const hora = (r.hora || '00:00:00').substring(0, 5);
            return { fechaStr, hora };
        })
        .filter(r => r.fechaStr >= todayStr)
        .sort((a, b) => a.fechaStr.localeCompare(b.fechaStr) || a.hora.localeCompare(b.hora))[0];

    if (proxima) {
        // Usar new Date(fechaStr) igual que crearElementoReserva → parsing UTC → misma fecha visible
        const dateObj = new Date(proxima.fechaStr);
        fechaEl.textContent = dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
        if (horaEl) horaEl.textContent = proxima.hora;
    } else {
        fechaEl.textContent = 'Sin citas';
        if (horaEl) horaEl.textContent = '';
    }
}

/* ---------------------------------------------------------
 * 7. PUNTO DE ENTRADA
 * --------------------------------------------------------- */

async function renderPerfilUsuario() {
    const token          = sfSession.getToken();
    const perfilCacheado = await sfSession.getProfile();

    if (perfilCacheado) {
        pintarPerfil(perfilCacheado);
        renderStats(0);
        // Mostrar spinner en reservas mientras carga
        const lista = document.getElementById('reservasList');
        if (lista) lista.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;padding:2.5rem 1rem;gap:1rem;">
              <div style="width:40px;height:40px;border:3px solid #f0e6ff;border-top-color:#522676;border-radius:50%;animation:sf-spin 0.8s linear infinite;"></div>
              <p style="color:#888;font-size:.9rem;margin:0;">Cargando reservas...</p>
            </div>
            <style>@keyframes sf-spin{to{transform:rotate(360deg);}}</style>`;
    }

    if (!token) {
        if (!perfilCacheado) mostrarPantallaNoSesion();
        return;
    }

    const correo = perfilCacheado?.correo || perfilCacheado?.email || null;

    try {
        let usuario = null;
        if (correo) {
            usuario = await fetchUsuarioPorCorreo(correo, token);
        }
        if (!usuario) {
            usuario = await fetchPerfilMe(token);
        }
        if (!usuario && perfilCacheado) {
            usuario = perfilCacheado;
        }
        if (!usuario) {
            mostrarErrorPerfil('Usuario no encontrado en el sistema.');
            return;
        }

        _usuarioIdActual = obtenerIdUsuario(usuario) ?? perfilCacheado?.id ?? null;

        const usuarioNorm   = normalizeUsuario(usuario);
        const telefonoAPI   = usuarioNorm?.telefono || usuarioNorm?.celular || usuarioNorm?.mobile || usuarioNorm?.telefonoContacto || '';
        const telefonoFinal = telefonoAPI || perfilCacheado?.telefono || '';
        const usuarioParaMostrar = { ...usuarioNorm, telefono: telefonoFinal };

        // Sincronizar caché — normalizar rol a minúsculas para que el navbar lo compare correctamente
        const rolNorm = (usuarioNorm?.rol ?? perfilCacheado?.rol ?? 'cliente').toLowerCase();
        await sfSession.setProfile({ ...perfilCacheado, ...usuarioNorm, telefono: telefonoFinal, rol: rolNorm });

        const nombreUsuario = usuarioNorm?.nombre || usuarioNorm?.nombreCompleto
                           || usuarioNorm?.fullName || perfilCacheado?.nombre || null;

        let reservas = [];
        try {
            const reservasAPI = await fetchReservasDeAPI(nombreUsuario, token);
            reservas = reservasAPI ?? [];
        } catch {
            reservas = [];
        }

        _reservasActuales = reservas;
        pintarPerfil(usuarioParaMostrar);
        renderStats(reservas.length, reservas);
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
let _reservasActuales = [];

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

    modalEl.addEventListener('show.bs.modal', async () => {
        const usuario = await sfSession.getProfile() || {};
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

        const perfilActual = await sfSession.getProfile() || {};
        const actualizado  = { ...perfilActual, nombre, correo, telefono };

        const token = sfSession.getToken();
        const idParaActualizar = _usuarioIdActual ?? perfilActual?.id ?? null;
        const rolParaAPI = (perfilActual.rol ?? 'CLIENTE').toUpperCase();

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

        await sfSession.setProfile(actualizado);

        pintarPerfil(actualizado);
        renderReservas(_reservasActuales);
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