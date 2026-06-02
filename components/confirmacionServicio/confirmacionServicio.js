let reservaActual = {
  servicio: { nombre: "CORTE BÁSICO", precio: 50000 },
  profesional: { nombre: "ANDREA RIVERA", id: null },
  fecha: "ABR 25",
  fechaISO: null,
  hora: "2:00 PM",
};

const BASE_URL = "https://backend-style-factory.onrender.com"

let elementos = {};
document.addEventListener("DOMContentLoaded", () => {
  elementos = {
    confServicio: document.getElementById("confServicio"),
    confProfesional: document.getElementById("confProfesional"),
    confFechaHora: document.getElementById("confFechaHora"),
    confTotal: document.getElementById("confTotal"),
    btnConfirmar: document.getElementById("btnConfirmarReserva"),
  };

  renderizar();

  if (elementos.btnConfirmar) {
    elementos.btnConfirmar.addEventListener("click", () => {
      confirmarReserva();
    });
  }
});

function calcularTotal() {
  return reservaActual.servicio.precio;
}

function renderizar() {
  if (!elementos.confServicio) return;
  elementos.confServicio.textContent = reservaActual.servicio.nombre;
  elementos.confProfesional.textContent = reservaActual.profesional.nombre;
  elementos.confFechaHora.textContent = `${reservaActual.fecha} / ${reservaActual.hora}`;
  elementos.confTotal.textContent = formatearPrecio(calcularTotal());
}

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}

function actualizarServicio(nombre, precio) {
  reservaActual.servicio = { nombre: nombre.toUpperCase(), precio };
  renderizar();
}

function actualizarProfesional(nombre, id = null) {
  reservaActual.profesional = { nombre: nombre.toUpperCase(), id };
  renderizar();
}

function actualizarFechaHora(fechaLegible, hora, fechaISO = null) {
  reservaActual.fecha = fechaLegible;
  reservaActual.fechaISO = fechaISO;
  reservaActual.hora = hora;
  renderizar();
}

async function confirmarReserva() {
  const token = sfSession.getToken();

  // Sin token = sin sesión → redirigir al login
  if (!token) {
    await sfAlert('Debes iniciar sesión para reservar un servicio.', 'warning');
    window.top.location.href = '/pages/login/login.html';
    return;
  }

  // Obtener perfil desde Cache API
  let perfil = await sfSession.getProfile();

  if (!perfil) {
    await sfAlert('No se pudo obtener tu información de sesión. Por favor inicia sesión de nuevo.', 'error');
    window.top.location.href = '/pages/login/login.html';
    return;
  }

  // Si el perfil no tiene id, buscarlo en GET /usuarios filtrando por correo
  if (!perfil.id) {
    try {
      const res = await fetch(`${BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const lista = await res.json();
        const correo = perfil.correo ?? perfil.email ?? '';
        const encontrado = (Array.isArray(lista) ? lista : [])
          .find(u => (u.correo ?? u.email ?? '').toLowerCase() === correo.toLowerCase());
        if (encontrado?.id) {
          perfil = { ...perfil, id: encontrado.id };
          await sfSession.setProfile(perfil);
        }
      }
    } catch (err) {
      console.warn('No se pudo obtener el id del usuario desde /usuarios:', err.message);
    }
  }

  const servicio = JSON.parse(localStorage.getItem('servicioSeleccionado'));

  const nombreServicio = servicio?.nombre?.toUpperCase() || reservaActual.servicio.nombre;
  const precioServicio = servicio?.precio              || reservaActual.servicio.precio;

  const usuarioId  = perfil.id ?? null;
  const empleadoId = reservaActual.profesional.id ?? null;
  const servicioId = servicio?.id ?? null;

  let fechaISO = reservaActual.fechaISO;
  if (!fechaISO && reservaActual.fecha) {
    const partes = reservaActual.fecha.split('/');
    if (partes.length === 3) fechaISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  // Guardar en la API
  if (!empleadoId || !servicioId || !fechaISO) {
    await sfAlert('Faltan datos para crear la reserva (empleado, servicio o fecha).', 'warning');
    return;
  }

  let reservaGuardada = null;
  try {
    const fechaHora = `${fechaISO}T${reservaActual.hora}:00`;
    const bodyReserva = {
      fecha: fechaISO,
      hora: reservaActual.hora,
      fechaHora,
      estado: 'PENDIENTE',
      usuarioId,
      empleadoId,
      servicioId,
    };
    const res = await fetch(`${BASE_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bodyReserva),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => `HTTP ${res.status}`);
      console.error(`POST /reservas → ${res.status}`, errText);
      await sfAlert(`No se pudo crear la reserva en el servidor (${res.status}). Intenta de nuevo.`, 'error');
      return;
    }

    reservaGuardada = await res.json().catch(() => null);
  } catch (err) {
    console.error('Error de red al crear la reserva:', err);
    await sfAlert('Error de conexión. Verifica tu internet e intenta de nuevo.', 'error');
    return;
  }

  // Respaldo en localStorage para que el panel admin pueda leerla mientras migra
  const nuevaReserva = {
    id:          reservaGuardada?.id ?? Date.now(),
    cliente:     perfil.nombre,
    servicio:    { nombre: nombreServicio, precio: precioServicio },
    profesional: reservaActual.profesional,
    fecha:       reservaActual.fecha,
    hora:        reservaActual.hora,
  };
  const reservas = JSON.parse(localStorage.getItem("reservas")) || [];
  reservas.push(nuevaReserva);
  localStorage.setItem("reservas", JSON.stringify(reservas));
  localStorage.removeItem('servicioSeleccionado');

  // Mostrar modal de confirmación
  document.getElementById("mensajeConfirmacion").innerHTML = `
    <strong style="color:#28a745;">RESERVA CONFIRMADA</strong><br><br>
    ${nombreServicio}<br>
    ${reservaActual.profesional.nombre}<br>
    ${reservaActual.fecha} / ${reservaActual.hora}<br>
    ${formatearPrecio(precioServicio)}
  `;

  const modalEl = document.getElementById("modalConfirmacionReserva");
  new bootstrap.Modal(modalEl).show();
  modalEl.addEventListener("hidden.bs.modal", () => {
    window.top.location.href = '/pages/perfilUsuario/perfilUsuario.html';
  }, { once: true });

  return nuevaReserva;
}

window.ConfirmacionServicio = {
  actualizarServicio,
  actualizarProfesional,
  actualizarFechaHora,
  confirmarReserva,
};