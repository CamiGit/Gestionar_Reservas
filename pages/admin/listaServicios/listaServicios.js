
import { initFormulario } from "../../../components/forms/creacionServicios/formCreacionServicios.js";

let indexAEliminar = null;
let serviciosEnMemoria = []; // fuente de verdad en memoria, siempre desde la API
const BASE_URL = "https://backend-style-factory.onrender.com";

export async function renderizarTabla() {
  const tbody = document.getElementById("tabla-servicios");
  if (!tbody) return;

  const spinner = (msg) => `<tr><td colspan="6"><div style="display:flex;flex-direction:column;align-items:center;padding:2rem;gap:.75rem;"><div style="width:40px;height:40px;border:3px solid #f0e6ff;border-top-color:#522676;border-radius:50%;animation:sf-spin 0.8s linear infinite;"></div><span style="color:#888;font-size:.85rem;">${msg}</span></div><style>@keyframes sf-spin{to{transform:rotate(360deg);}}</style></td></tr>`;

  const intentosMax = 3;
  for (let intento = 1; intento <= intentosMax; intento++) {
    tbody.innerHTML = spinner(intento === 1 ? "Cargando servicios..." : `Reintentando conexión (${intento}/${intentosMax})...`);
    try {
      const respuesta = await fetch(BASE_URL + "/servicios");
      if (!respuesta.ok) throw new Error(`GET /servicios → ${respuesta.status}`);
      serviciosEnMemoria = await respuesta.json();
      localStorage.setItem("Lista de Servicios", JSON.stringify(serviciosEnMemoria));
      break;
    } catch (error) {
      console.warn(`Intento ${intento} fallido:`, error.message);
      serviciosEnMemoria = [];
      if (intento < intentosMax) await new Promise(r => setTimeout(r, 3000));
    }
  }

  tbody.innerHTML = "";

  if (!serviciosEnMemoria.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div style="display:flex;flex-direction:column;align-items:center;padding:2rem;gap:1rem;">
          <i class="fa-solid fa-circle-exclamation fa-2x" style="color:#d97706;"></i>
          <p style="color:#555;font-size:.9rem;margin:0;text-align:center;">No se pudieron cargar los servicios.<br>El servidor puede estar iniciando.</p>
          <button id="btn-reintentar-servicios" style="background:#522676;color:#fff;border:none;border-radius:8px;padding:.5rem 1.4rem;font-size:.88rem;font-weight:500;cursor:pointer;">
            <i class="fa-solid fa-rotate-right"></i> Reintentar
          </button>
        </div>
      </td></tr>`;
    document.getElementById("btn-reintentar-servicios")
      ?.addEventListener("click", () => renderizarTabla());
    return;
  }

  serviciosEnMemoria.forEach((servicio, index) => {
    const estadoClase = servicio.estado === true || servicio.estado === "true" ? "confirmada" : "cancelada";
    const estadoTexto = servicio.estado === true || servicio.estado === "true" ? "Activo" : "Inactivo";
    const fila = `
      <tr>
        <td>#ID-${servicio.id ?? index + 1}</td>
        <td>${servicio.nombre}</td>
        <td><div class="text-truncate">${servicio.descripcion}</div></td>
        <td>${servicio.tipoServicio ?? "—"}</td>
        <td><span class="badge-estado ${estadoClase}">${estadoTexto}</span></td>
        <td class="celda-acciones">
          <button class="btn-accion btn-editar" data-index="${index}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          ${servicio.estado === false || servicio.estado === "false"
            ? `<button class="btn-accion btn-activar" data-index="${index}" title="Activar"><i class="fa-solid fa-circle-check"></i></button>`
            : `<button class="btn-accion btn-eliminar" data-index="${index}" data-id="${servicio.id}" title="Desactivar"><i class="fa-solid fa-trash"></i></button>`
          }
        </td>
      </tr>
    `;
    tbody.innerHTML += fila;
  });
}

export function initListaServicios() {
  fetch("/components/forms/creacionServicios/formCreacionServicios.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("form-services").innerHTML = html;
      initFormulario(renderizarTabla);
    })
    .catch((err) => console.error("Error cargando el formulario:", err));

  renderizarTabla();

  const modalElement = document.getElementById("modalEliminar");
  if (modalElement) {
    modalElement.addEventListener("hidden.bs.modal", () => {
      if (document.activeElement) document.activeElement.blur();
      document.body.focus();
    });
  }

  document.addEventListener("click", async function (e) {
    const btnEliminar = e.target.closest(".btn-eliminar");
    if (btnEliminar) {
      indexAEliminar = Number(btnEliminar.dataset.index);
      new bootstrap.Modal(document.getElementById("modalEliminar")).show();
      return;
    }

    const btnActivar = e.target.closest(".btn-activar");
    if (btnActivar) {
      const index = Number(btnActivar.dataset.index);
      const servicio = serviciosEnMemoria[index];
      if (!servicio) return;
      const token = sfSession.getToken() || "";
      try {
        const respuesta = await fetch(`${BASE_URL}/servicios/${servicio.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ ...servicio, estado: true }),
        });
        if (!respuesta.ok) {
          const errorData = await respuesta.json().catch(() => ({}));
          throw new Error(errorData.message || "No se pudo activar el servicio.");
        }
        await sfAlert("Servicio activado correctamente.", "success");
        renderizarTabla();
      } catch (error) {
        console.error("Error al activar el servicio:", error);
        await sfAlert(error.message || "Error al activar el servicio.", "error");
      }
      return;
    }

    const btnEditar = e.target.closest(".btn-editar");
    if (btnEditar) {
      try {
        const index = Number(btnEditar.dataset.index);
        const servicioAEditar = serviciosEnMemoria[index];
        if (!servicioAEditar) return;

        document.getElementById("nombre").value = servicioAEditar.nombre;
        document.getElementById("descripcion").value = servicioAEditar.descripcion;
        document.getElementById("precio").value = servicioAEditar.precio;
        document.getElementById("tipoServicio").value = servicioAEditar.tipoServicio || "";
        document.getElementById("preview").src = servicioAEditar.urlImagen || "";
        document.getElementById("preview").style.display = servicioAEditar.urlImagen ? "block" : "none";
        document.getElementById("editIndex").value = index;
        new bootstrap.Modal(document.getElementById("exampleModal")).show();
      } catch (error) {
        console.error("Error al intentar editar el servicio:", error);
      }
    }
  });

  const btnConfirmar = document.getElementById("btn-confirmar-eliminar");
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async function () {
      const servicio = serviciosEnMemoria[indexAEliminar];
      if (!servicio) return;
      const token = sfSession.getToken() || "";
      try {
        const respuesta = await fetch(`${BASE_URL}/servicios/${servicio.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ ...servicio, estado: false }),
        });
        if (!respuesta.ok) {
          const errorData = await respuesta.json().catch(() => ({}));
          throw new Error(errorData.message || "No se pudo desactivar el servicio.");
        }
        bootstrap.Modal.getInstance(document.getElementById("modalEliminar")).hide();
        await sfAlert("Servicio desactivado correctamente.", "success");
        renderizarTabla();
      } catch (error) {
        console.error("Error al desactivar el servicio:", error);
        await sfAlert(error.message || "Error al desactivar el servicio.", "error");
      }
    });
  }
}