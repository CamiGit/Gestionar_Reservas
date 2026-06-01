/**
 * Actualiza la interfaz del navbar según el estado de sesión del usuario
 * Muestra el nombre del usuario logueado y oculta el botón de acceder
 */
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

/**
 * Cierra la sesión del usuario eliminando solo los datos de sesión actual
 * Los usuarios registrados permanecen en localStorage para futuros inicios de sesión
 * Redirige a la página de inicio
 */
function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    actualizarNavbar();
    window.location.href = '/index.html';
}

/**
 * Carga los componentes comunes del navbar y footer
 * Inicializa la sesión del usuario y configura el botón de cierre de sesión
 */
fetch("/components/navbar/navbar.html")
  .then((res) => res.text())
  .then((html) => { 
      document.getElementById("header").innerHTML = html;
      actualizarNavbar();
      const btnCerrarSesion = document.getElementById('btnCerrarSesion');
      if (btnCerrarSesion) {
          btnCerrarSesion.addEventListener('click', cerrarSesion);
      }
  })
  .catch((err) => console.error("Error cargando el navbar:", err));

fetch("../../components/footer/footer.html")
  .then((res) => res.text())
  .then((html) => { document.getElementById("footer-placeholder").innerHTML = html; })
  .catch((err) => console.error("Error cargando el footer:", err));

/**
 * Renderiza la información del servicio seleccionado en la página de reserva
 * Obtiene los datos del servicio desde localStorage
 */
function renderizarReservas() {
  const container = document.getElementById('reservas_container');
  if (!container) return;

  const servicio = JSON.parse(localStorage.getItem('servicioSeleccionado'));

  if (!servicio) {
    container.innerHTML = "<p class='text-muted text-center'>No hay ningún servicio seleccionado aún.</p>";
    return;
  }

  const precioFormateado = Number(servicio.precio).toLocaleString('es-CO');

  container.innerHTML = `
    <div class="contenido_reserva">
      <div class="texto col">
        <div class="texto-header">
          <h1>${servicio.nombre}</h1>
          <a href="/pages/catalogoServicios/catalogoServicios.html" class="btn-cambiar-servicio">
            ← Cambiar servicio
          </a>
        </div>
        <p>${servicio.descripcion}</p>
      </div>
      <div class="contenedor_imagen">
        <img src="${servicio.imagen}" alt="${servicio.nombre}">
      </div>
    </div>
    <div class="contenedor_precio">
      <h1 class="col">${servicio.nombre}</h1>
      <h1 class="precio col">$${precioFormateado}</h1>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', renderizarReservas);

/**
 * Lista de estilistas con sus especialidades, fotos y disponibilidad por fecha
 */
const estilistas = [
  { id: 1, nombre: "Ana García", especialidad: "Colorimetría", foto: "https://res.cloudinary.com/diq2bkb49/image/upload/v1777336588/Sty1_wj2bmn.png", disponibilidad: { "2026-04-28": ["09:00", "10:00", "14:00", "15:00"], "2026-04-29": ["09:00", "11:00", "16:00"], "2026-04-30": ["10:00", "13:00", "17:00"], "2026-05-02": ["09:00", "10:00", "11:00"], "2026-05-03": ["14:00", "15:00", "16:00"] } },
  { id: 2, nombre: "Laura Martínez", especialidad: "Cortes y peinados", foto: "https://res.cloudinary.com/diq2bkb49/image/upload/v1777336622/Sty2_z1upkm.png", disponibilidad: { "2026-04-28": ["08:00", "09:00", "11:00"], "2026-04-29": ["10:00", "12:00", "15:00"], "2026-04-30": ["09:00", "11:00", "14:00"], "2026-05-02": ["13:00", "15:00", "17:00"], "2026-05-03": ["09:00", "10:00", "12:00"] } },
  { id: 3, nombre: "Camila Rodríguez", especialidad: "Tratamientos capilares", foto: "https://res.cloudinary.com/diq2bkb49/image/upload/v1777336764/Sty3_hk8sdy.png", disponibilidad: { "2026-04-28": ["10:00", "12:00", "16:00"], "2026-04-29": ["09:00", "13:00", "15:00"], "2026-04-30": ["11:00", "14:00", "18:00"], "2026-05-02": ["08:00", "09:00", "10:00"], "2026-05-03": ["13:00", "14:00", "15:00"] } },
  { id: 4, nombre: "Valentina López", especialidad: "Alisados y keratina", foto: "https://res.cloudinary.com/diq2bkb49/image/upload/v1777336831/Sty4_yhgjef.png", disponibilidad: { "2026-04-28": ["09:00", "11:00", "13:00"], "2026-04-29": ["10:00", "12:00", "16:00"], "2026-04-30": ["08:00", "10:00", "12:00"], "2026-05-02": ["14:00", "16:00", "18:00"], "2026-05-03": ["09:00", "11:00", "13:00"] } },
  { id: 5, nombre: "Daniel Herrera", especialidad: "Corte caballero y barba", foto: "https://res.cloudinary.com/diq2bkb49/image/upload/v1777336977/Sty5_wnafrw.png", disponibilidad: { "2026-04-28": ["09:00", "10:00", "11:00", "15:00"], "2026-04-29": ["10:00", "12:00", "14:00"], "2026-04-30": ["09:00", "11:00", "13:00"], "2026-05-02": ["08:00", "09:00", "10:00"], "2026-05-03": ["16:00", "17:00", "18:00"] } },
  { id: 6, nombre: "Santiago Ruiz", especialidad: "Barbería clásica y perfilado de barba", foto: "https://res.cloudinary.com/diq2bkb49/image/upload/v1777337017/Sty6_vgztvb.png", disponibilidad: { "2026-04-28": ["08:00", "09:00", "12:00"], "2026-04-29": ["11:00", "13:00", "15:00"], "2026-04-30": ["10:00", "12:00", "14:00"], "2026-05-02": ["09:00", "11:00", "13:00"], "2026-05-03": ["14:00", "16:00", "18:00"] } },
];

/**
 * Renderiza el carrusel de estilistas
 * Agrupa los estilistas en grupos de 4 para cada slide del carrusel
 */
const carouselInner = document.getElementById("carouselInner");
const cantCards = 4;

for (let i = 0; i < estilistas.length; i += cantCards) {
  const grupo = estilistas.slice(i, i + cantCards);
  const item = document.createElement("div");
  item.className = "carousel-item " + (i === 0 ? "active" : "");

  let row = '<div class="row">';
  grupo.forEach((est) => {
    row += `
      <div class="col-md-3">
        <div class="card card-estilista" id="card-estilista-${est.id}" onclick="seleccionarEstilista(${est.id})">
          <img src="${est.foto}" class="card-img-top" alt="${est.nombre}">
          <div class="card-body text-center">
            <h5>${est.nombre}</h5>
            <p class="text-purple">${est.especialidad}</p>
          </div>
        </div>
      </div>
    `;
  });
  row += "</div>";
  item.innerHTML = row;
  carouselInner.appendChild(item);
}

/**
 * Estado global de la selección de reserva
 */
const estado = {
  estilista: null,
  fecha: null,
  hora: null,
  anio: 2026,
  mes: 3,
};

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_SEM = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * Maneja la selección de un estilista
 * Muestra la sección de calendario y carga sus fechas disponibles
 * @param {number} id - Identificador del estilista seleccionado
 */
function seleccionarEstilista(id) {
  const estilista = estilistas.find((e) => e.id === id);
  if (!estilista) return;
  document.getElementById("seccionCalendario").style.display = "block";
  document.getElementById("seccionCalendario").scrollIntoView({ behavior: "smooth" });
  initFechaHora(estilista);
}

/**
 * Inicializa el estado de fecha y hora para el estilista seleccionado
 * @param {Object} estilista - Objeto del estilista seleccionado
 */
function initFechaHora(estilista) {
  estado.estilista = estilista;
  estado.fecha = null;
  estado.hora = null;

  const confirmWrapper = document.getElementById("confirmacionServicioWrapper");
  if (confirmWrapper) confirmWrapper.style.display = "none";

  document.getElementById("horasFechaLabel").textContent = "Selecciona un día disponible";
  document.getElementById("horasGrid").innerHTML = `<p class="text-muted" style="font-size:13px;">Los horarios aparecerán al elegir una fecha.</p>`;

  renderCalendario();
}

/**
 * Renderiza el calendario con los días disponibles del estilista
 */
function renderCalendario() {
  document.getElementById("calMonthLabel").textContent = `${MESES[estado.mes]} ${estado.anio}`;

  const diasDisponibles = estado.estilista ? new Set(Object.keys(estado.estilista.disponibilidad)) : new Set();
  const primerDia = new Date(estado.anio, estado.mes, 1).getDay();
  const diasDelMes = new Date(estado.anio, estado.mes + 1, 0).getDate();

  let html = DIAS_SEM.map((d) => `<div class="cal-nombre-dia">${d}</div>`).join("");

  for (let i = 0; i < primerDia; i++) html += `<div class="cal-dia"></div>`;

  for (let d = 1; d <= diasDelMes; d++) {
    const mm = String(estado.mes + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const fechaStr = `${estado.anio}-${mm}-${dd}`;
    const estaDisponible = diasDisponibles.has(fechaStr);
    const estaSeleccionado = estado.fecha === fechaStr;

    let clases = "cal-dia";
    if (estaDisponible) clases += " disponible";
    if (estaSeleccionado) clases += " seleccionado";

    const click = estaDisponible ? `onclick="seleccionarFecha('${fechaStr}')"` : "";
    html += `<div class="${clases}" ${click}>${d}</div>`;
  }

  document.getElementById("calGrid").innerHTML = html;
}

/**
 * Maneja la selección de una fecha en el calendario
 * @param {string} fechaStr - Fecha seleccionada en formato YYYY-MM-DD
 */
function seleccionarFecha(fechaStr) {
  estado.fecha = fechaStr;
  estado.hora = null;
  renderCalendario();

  const [anio, mes, dia] = fechaStr.split("-");
  document.getElementById("horasFechaLabel").textContent = `${parseInt(dia)} de ${MESES[parseInt(mes) - 1]} de ${anio}`;
  renderHoras(fechaStr);
}

/**
 * Renderiza los horarios disponibles para la fecha seleccionada
 * @param {string} fechaStr - Fecha seleccionada
 */
function renderHoras(fechaStr) {
  const contenedor = document.getElementById("horasGrid");
  const horas = estado.estilista.disponibilidad[fechaStr] ?? [];

  if (horas.length === 0) {
    contenedor.innerHTML = `<p class="text-muted" style="font-size:13px;">No hay horarios disponibles.</p>`;
    return;
  }

  contenedor.innerHTML = horas.map((hora) => `
    <button class="btn-hora${estado.hora === hora ? " seleccionado" : ""}" onclick="seleccionarHora('${hora}')">
      ${hora}
    </button>`
  ).join("");
}

/**
 * Maneja la selección de un horario
 * Actualiza el componente de confirmación de servicio
 * @param {string} hora - Horario seleccionado
 */
function seleccionarHora(hora) {
  estado.hora = hora;
  renderHoras(estado.fecha);

  if (window.ConfirmacionServicio) {
    const servicio = JSON.parse(localStorage.getItem('servicioSeleccionado'));
    const nombreServicio = servicio?.nombre ?? "Servicio";
    const precioServicio = servicio?.precio ?? 0;

    window.ConfirmacionServicio.actualizarServicio(nombreServicio, precioServicio);
    window.ConfirmacionServicio.actualizarProfesional(estado.estilista.nombre, estado.estilista.id);

    const [anio, mes, dia] = estado.fecha.split("-");
    const fechaLegible = `${dia}/${mes}/${anio}`;
    window.ConfirmacionServicio.actualizarFechaHora(fechaLegible, estado.hora, estado.fecha);
  }

  const confirmWrapper = document.getElementById("confirmacionServicioWrapper");
  if (confirmWrapper) confirmWrapper.style.display = "block";

  document.dispatchEvent(new CustomEvent("fechaHoraSeleccionada", {
    detail: { estilista: estado.estilista, fecha: estado.fecha, hora: estado.hora }
  }));
}

/**
 * Navegación del calendario: mes anterior
 */
document.getElementById("prevMonth").addEventListener("click", () => {
  estado.mes--;
  if (estado.mes < 0) { estado.mes = 11; estado.anio--; }
  estado.fecha = null;
  estado.hora = null;
  renderCalendario();
  document.getElementById("horasFechaLabel").textContent = "Selecciona un día disponible";
  document.getElementById("horasGrid").innerHTML = `<p class="text-muted" style="font-size:13px;">Los horarios aparecerán al elegir una fecha.</p>`;
});

/**
 * Navegación del calendario: mes siguiente
 */
document.getElementById("nextMonth").addEventListener("click", () => {
  estado.mes++;
  if (estado.mes > 11) { estado.mes = 0; estado.anio++; }
  estado.fecha = null;
  estado.hora = null;
  renderCalendario();
  document.getElementById("horasFechaLabel").textContent = "Selecciona un día disponible";
  document.getElementById("horasGrid").innerHTML = `<p class="text-muted" style="font-size:13px;">Los horarios aparecerán al elegir una fecha.</p>`;
});