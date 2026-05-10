let reservaActual = {
  servicio: { nombre: "CORTE BÁSICO", precio: 50000 },
  profesional: { nombre: "ANDREA RIVERA" },
  fecha: "ABR 25",
  hora: "2:00 PM",
};

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

function confirmarReserva() {
  const servicio = JSON.parse(localStorage.getItem('servicioSeleccionado'));

  const nuevaReserva = {
    servicio: {
      nombre: servicio?.nombre?.toUpperCase() || reservaActual.servicio.nombre,
      precio: servicio?.precio || reservaActual.servicio.precio
    },
    profesional: reservaActual.profesional,
    fecha: reservaActual.fecha,
    hora: reservaActual.hora
  };

  const reservas = JSON.parse(localStorage.getItem("reservas")) || [];

  // Genera id automático
  const maxId = reservas.length > 0 ? Math.max(...reservas.map(r => r.id || 0)) : 0;
  nuevaReserva.id = maxId + 1;

  reservas.push(nuevaReserva);
  localStorage.setItem("reservas", JSON.stringify(reservas));

  // Limpia el servicio seleccionado
  localStorage.removeItem('servicioSeleccionado');

  alert(
    `RESERVA CONFIRMADA\n\n` +
    `${nuevaReserva.servicio.nombre}\n` +
    `${nuevaReserva.profesional.nombre}\n` +
    `${nuevaReserva.fecha} / ${nuevaReserva.hora}\n` +
    `${formatearPrecio(nuevaReserva.servicio.precio)}`
  );

  return nuevaReserva;
}

window.ConfirmacionServicio = {
  actualizarServicio,
  actualizarProfesional,
  actualizarFechaHora,
  confirmarReserva,
};