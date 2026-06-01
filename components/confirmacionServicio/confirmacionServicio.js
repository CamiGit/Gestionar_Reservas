let reservaActual = {
  servicio: { nombre: "CORTE BÁSICO", precio: 50000 },
  profesional: { nombre: "ANDREA RIVERA" },
  fecha: "ABR 25",
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

function actualizarProfesional(nombre) {
  reservaActual.profesional = { nombre: nombre.toUpperCase() };
  renderizar();
}

function actualizarFechaHora(fecha, hora) {
  reservaActual.fecha = fecha;
  reservaActual.hora = hora;
  renderizar();
}

async function confirmarReserva() {
  const servicio = JSON.parse(localStorage.getItem('servicioSeleccionado'));
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
  const objReserva = JSON.parse(localStorage.getItem('resumenReserva'));
  const nuevaReserva = {
    cliente: usuarioLogueado?.nombre ?? 'Invitado',
    servicio: {
      nombre: servicio?.nombre?.toUpperCase() || reservaActual.servicio.nombre,
      precio: servicio?.precio || reservaActual.servicio.precio
    },
    profesional: reservaActual.profesional,
    fecha: reservaActual.fecha,
    hora: reservaActual.hora
  };

  const token = usuarioLogueado.token;
    try {
       const resumenReserva = {
        fecha: objReserva.fecha ,
        hora: objReserva.hora,
        estado: true,
        usuarioId: objReserva.estilista.idUsuario,
        empleadoId: objReserva.estilista.idEmpleado,
        servicioId: objReserva.idServicio
      }

      const response = await fetch(`${BASE_URL}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resumenReserva)
      });
      if (!response.ok) {
        throw new Error('Error al crear la reserva');
      }
      const data = await response.json();
      console.log('Reserva creada:', data);

    } catch (error) {
      console.error('Error:', error);
    }

  const reservas = JSON.parse(localStorage.getItem("reservas")) || [];

  // Genera id automático
  const maxId = reservas.length > 0 ? Math.max(...reservas.map(r => r.id || 0)) : 0;
  nuevaReserva.id = maxId + 1;

  reservas.push(nuevaReserva);
  localStorage.setItem("reservas", JSON.stringify(reservas));

  // Limpia el servicio seleccionado
  localStorage.removeItem('servicioSeleccionado');

   // Mostrar modal con los mismos datos que la alerta original
const mensaje = `
  <strong style="color:#28a745;">RESERVA CONFIRMADA</strong><br><br>
  ${nuevaReserva.servicio.nombre}<br>
  ${nuevaReserva.profesional.nombre}<br>
  ${nuevaReserva.fecha} / ${nuevaReserva.hora}<br>
  ${formatearPrecio(nuevaReserva.servicio.precio)}
`;

document.getElementById("mensajeConfirmacion").innerHTML = mensaje;

// Mostrar el modal confirmado
const modalConfirmacion = new bootstrap.Modal(document.getElementById("modalConfirmacionReserva"));
modalConfirmacion.show();

// Cuando se cierre el modal, redirige a Acerca de Nosotros
/**
 * document.getElementById("modalConfirmacionReserva")
  .addEventListener("hidden.bs.modal", () => {
    window.location.href = '/index.html';
  });
 */

  return nuevaReserva;
}

window.ConfirmacionServicio = {
  actualizarServicio,
  actualizarProfesional,
  actualizarFechaHora,
  confirmarReserva,
};