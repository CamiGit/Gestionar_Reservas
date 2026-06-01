
import { initFormulario } from "../../../components/forms/creacionServicios/formCreacionServicios.js";

let indexAEliminar = null;
let serviciosEnMemoria = []; // fuente de verdad en memoria, siempre desde la API
const BASE_URL = "https://backend-style-factory.onrender.com";

export async function renderizarTabla() {
  try {
    const respuesta = await fetch(BASE_URL + "/servicios");
    if (!respuesta.ok) throw new Error(`GET /servicios → ${respuesta.status}`);
    serviciosEnMemoria = await respuesta.json();
    // Sincronizar localStorage para que formCreacionServicios pueda leer el id al editar
    localStorage.setItem("Lista de Servicios", JSON.stringify(serviciosEnMemoria));
  } catch (error) {
    console.error("Error al cargar los servicios desde el backend:", error);
    serviciosEnMemoria = [];
  }

  const tbody = document.getElementById("tabla-servicios");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!serviciosEnMemoria.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay servicios registrados</td></tr>`;
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
        <td><span class="badge-estado ${estadoClase}">${estadoTexto}</span></td>
        <td class="celda-acciones">
          <button class="btn-accion btn-editar" data-index="${index}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-accion btn-eliminar" data-index="${index}" data-id="${servicio.id}" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
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
      const servicioId = btnEliminar.dataset.id ?? serviciosEnMemoria[indexAEliminar]?.id;
      const token = sfSession.getToken() || "";
      try {
        const respuesta = await fetch(`${BASE_URL}/servicios/${servicioId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!respuesta.ok) {
          const errorData = await respuesta.json().catch(() => ({}));
          throw new Error(errorData.message || "No se pudo eliminar el servicio.");
        }
      } catch (error) {
        console.error("Error al intentar eliminar el servicio:", error);
        await sfAlert(error.message || "Error al eliminar el servicio.", "error");
        return;
      }
      new bootstrap.Modal(document.getElementById("modalEliminar")).show();
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
    btnConfirmar.addEventListener("click", function () {
      bootstrap.Modal.getInstance(document.getElementById("modalEliminar")).hide();
      renderizarTabla();
    });
  }
}