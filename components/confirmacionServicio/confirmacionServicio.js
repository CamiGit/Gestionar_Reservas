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
  const servicio = JSON.parse(localStorage.getItem('servicioSeleccionado'));
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));

  const nombreServicio = servicio?.nombre?.toUpperCase() || reservaActual.servicio.nombre;
  const precioServicio  = servicio?.precio || reservaActual.servicio.precio;

  const usuarioId   = usuarioLogueado?.id ?? null;
  const empleadoId  = reservaActual.profesional.id ?? null;
  const servicioId  = servicio?.id ?? null;
  const token       = usuarioLogueado?.token ?? null;

  let fechaISO = reservaActual.fechaISO;
  if (!fechaISO && reservaActual.fecha) {
    const partes = reservaActual.fecha.split('/');
    if (partes.length === 3) fechaISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  if (token && usuarioId && empleadoId && servicioId && fechaISO) {
    try {
      const res = await fetch(`${BASE_URL}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fecha: fechaISO,
          hora: reservaActual.hora,
          estado: 'PENDIENTE',
          usuarioId,
          empleadoId,
          servicioId,
        }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => null);
        console.warn(`POST /reservas → ${res.status}`, err);
      }
    } catch (err) {
      console.warn('No se pudo guardar la reserva en la API, se guardará solo localmente.', err);
    }
  }

  // Guardar siempre en localStorage como respaldo
  const nuevaReserva = {
    cliente: usuarioLogueado?.nombre ?? 'Invitado',
    servicio: { nombre: nombreServicio, precio: precioServicio },
    profesional: reservaActual.profesional,
    fecha: reservaActual.fecha,
    hora: reservaActual.hora,
  };
  const reservas = JSON.parse(localStorage.getItem("reservas")) || [];
  const maxId = reservas.length > 0 ? Math.max(...reservas.map(r => r.id || 0)) : 0;
  nuevaReserva.id = maxId + 1;
  reservas.push(nuevaReserva);
  localStorage.setItem("reservas", JSON.stringify(reservas));
  localStorage.removeItem('servicioSeleccionado');

  const mensaje = `
    <strong style="color:#28a745;">RESERVA CONFIRMADA</strong><br><br>
    ${nombreServicio}<br>
    ${reservaActual.profesional.nombre}<br>
    ${reservaActual.fecha} / ${reservaActual.hora}<br>
    ${formatearPrecio(precioServicio)}
  `;
  document.getElementById("mensajeConfirmacion").innerHTML = mensaje;

  const modalConfirmacion = new bootstrap.Modal(document.getElementById("modalConfirmacionReserva"));
  modalConfirmacion.show();

  document.getElementById("modalConfirmacionReserva")
    .addEventListener("hidden.bs.modal", () => {
      window.location.href = '/pages/aboutUs/aboutUs.html';
    });

  return nuevaReserva;
}

window.ConfirmacionServicio = {
  actualizarServicio,
  actualizarProfesional,
  actualizarFechaHora,
  confirmarReserva,
};