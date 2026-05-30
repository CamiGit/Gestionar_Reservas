var API_RESERVAS =
    typeof BASE_URL !== 'undefined'
        ? BASE_URL
        : 'https://backend-style-factory.onrender.com';

function obtenerSesionActiva() {
    try {
        return JSON.parse(localStorage.getItem('usuarioLogueado') || 'null');
    } catch (e) {
        return null;
    }
}

function obtenerTokenSesion() {
    var sesion = obtenerSesionActiva();
    return sesion && sesion.token ? sesion.token : '';
}

function actualizarNavbar() {
    var usuarioLogueado = localStorage.getItem('usuarioLogueado');
    var userInfo = document.getElementById('user-info');
    var accesoBotones = document.getElementById('acceso-botones');
    var userNameSpan = document.getElementById('userName');
    var adminLink = document.getElementById('admin-link');
    var misReservasLink = document.getElementById('mis-reservas-link');

    if (usuarioLogueado) {
        var usuario = JSON.parse(usuarioLogueado);
        if (userNameSpan) userNameSpan.textContent = 'Hola, ' + usuario.nombre;
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

function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    actualizarNavbar();
    window.location.href = '/index.html';
}

function requiereSesion() {
    var sesion = obtenerSesionActiva();
    if (!sesion || !sesion.token) {
        window.location.href = '/pages/login/login.html';
        return false;
    }
    return true;
}

function formatearFecha(fechaIso) {
    if (!fechaIso) return '—';
    var partes = fechaIso.split('-');
    if (partes.length !== 3) return fechaIso;
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function formatearHora(hora) {
    if (!hora) return '—';
    return hora.substring(0, 5);
}

function claseEstadoReserva(estado) {
    var valor = (estado || 'PENDIENTE').toLowerCase();
    if (valor.indexOf('cancel') !== -1) return 'cancelada';
    if (valor.indexOf('confirm') !== -1) return 'confirmada';
    return 'pendiente';
}

function etiquetaEstado(estado) {
    var valor = (estado || 'PENDIENTE').toUpperCase();
    if (valor.indexOf('CANCEL') !== -1) return 'Cancelada';
    if (valor.indexOf('CONFIRM') !== -1) return 'Confirmada';
    return 'Pendiente';
}

function mostrarEstado(id, visible) {
    var el = document.getElementById(id);
    if (el) el.style.display = visible ? 'block' : 'none';
}

async function cargarMisReservas() {
    if (!requiereSesion()) return;

    var sesion = obtenerSesionActiva();
    var subtitulo = document.getElementById('mis-reservas-subtitulo');
    if (subtitulo && sesion && sesion.nombre) {
        subtitulo.textContent =
            'Hola, ' +
            sesion.nombre.split(/\s+/)[0] +
            '. Aquí puedes consultar tus citas agendadas.';
    }

    mostrarEstado('mis-reservas-carga', true);
    mostrarEstado('mis-reservas-error', false);
    mostrarEstado('mis-reservas-vacio', false);
    mostrarEstado('mis-reservas-contenedor', false);

    try {
        var respuesta = await fetch(API_RESERVAS + '/reservas/mis-reservas', {
            headers: {
                Authorization: 'Bearer ' + obtenerTokenSesion(),
                Accept: 'application/json'
            }
        });

        if (respuesta.status === 401) {
            localStorage.removeItem('usuarioLogueado');
            requiereSesion();
            return;
        }

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar tus reservas.');
        }

        var reservas = await respuesta.json();
        mostrarEstado('mis-reservas-carga', false);

        if (!Array.isArray(reservas) || reservas.length === 0) {
            mostrarEstado('mis-reservas-vacio', true);
            return;
        }

        var tbody = document.getElementById('mis-reservas-tbody');
        tbody.innerHTML = reservas
            .map(function (r) {
                var clase = claseEstadoReserva(r.estado);
                return (
                    '<tr>' +
                    '<td>' + (r.nombreServicio || '—') + '</td>' +
                    '<td>' + (r.nombreEmpleado || '—') + '</td>' +
                    '<td>' + formatearFecha(r.fecha) + '</td>' +
                    '<td>' + formatearHora(r.hora) + '</td>' +
                    '<td><span class="badge-estado-reserva ' + clase + '">' +
                    etiquetaEstado(r.estado) + '</span></td>' +
                    '</tr>'
                );
            })
            .join('');

        mostrarEstado('mis-reservas-contenedor', true);
    } catch (error) {
        mostrarEstado('mis-reservas-carga', false);
        var errorEl = document.getElementById('mis-reservas-error');
        if (errorEl) {
            errorEl.textContent = error.message || 'Error al cargar reservas.';
            errorEl.style.display = 'block';
        }
    }
}

fetch('../../components/navbar/navbar.html')
    .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar el navbar');
        return res.text();
    })
    .then(function (html) {
        document.getElementById('header').innerHTML = html;
        actualizarNavbar();
        var btnCerrar = document.getElementById('btnCerrarSesion');
        if (btnCerrar) {
            btnCerrar.addEventListener('click', cerrarSesion);
        }
    })
    .catch(function (err) {
        console.error('Error cargando el navbar:', err);
    });

fetch('../../components/footer/footer.html')
    .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar el footer');
        return res.text();
    })
    .then(function (html) {
        document.getElementById('footer-placeholder').innerHTML = html;
    })
    .catch(function (err) {
        console.error('Error cargando el footer:', err);
    });

document.addEventListener('DOMContentLoaded', cargarMisReservas);
