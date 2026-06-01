
import { initFormulario } from "../../../components/forms/creacionServicios/formCreacionServicios.js";

const KEY = "Lista de Servicios";
let indexAEliminar = null;
const BASE_URL = "https://backend-style-factory.onrender.com"
export async function renderizarTabla() {

  try {
    const respuesta = await fetch(BASE_URL + "/servicios");
    if (!respuesta.ok) {
      throw new Error("Error al obtener los servicios");
    }
    const servicios = await respuesta.json();
    localStorage.setItem(KEY, JSON.stringify(servicios));
  } catch (error) {
    console.error("Error al cargar los servicios desde el backend:", error);
  }   
  
  const servicios = JSON.parse(localStorage.getItem(KEY)) || [];
  const tbody = document.getElementById("tabla-servicios");
  if (!tbody) return;
  tbody.innerHTML = "";

  servicios.forEach((servicio, index) => {
    const estadoClase = servicio.estado === true || servicio.estado === "true" ? "confirmada" : "cancelada";  
    const estadoTexto = servicio.estado === true || servicio.estado === "true" ? "Activo" : "Inactivo";
    const id = servicio.id ?? index + 1;

    const fila = `
      <tr>
        <td>#ID-${id}</td>
        <td>${servicio.nombre}</td>
        <td>
          <div class="text-truncate">${servicio.descripcion}</div>
        </td>
        <td>
          <span class="badge-estado ${estadoClase}">${estadoTexto}</span>
        </td>
        <td class="celda-acciones">
          <button class="btn-accion btn-editar" data-index="${index}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-accion btn-eliminar" data-index="${index}" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += fila;
  });
}

export function initListaServicios() {
  const servicios = JSON.parse(localStorage.getItem(KEY)) || [];
  if (servicios.length === 0) {
  
    localStorage.setItem(KEY, JSON.stringify(servicios));
  }

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

  //consumir el serviciopar eliminar 
  document.addEventListener("click",  async function (e) {
    // Botón eliminar
   
    const btnEliminar = e.target.closest(".btn-eliminar");
  
    if (btnEliminar) {
      indexAEliminar = btnEliminar.dataset.index;
        const servicio = JSON.parse(localStorage.getItem(KEY)) || [];
        const servicioAEliminar = servicio[indexAEliminar];
        const token = JSON.parse(localStorage.getItem("usuarioLogueado"))?.token || "";
        try {
          const respuesta = await fetch(BASE_URL + "/servicios/" + servicioAEliminar.id, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });

          if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(
              errorData.message || "No se pudo eliminar el servicio."
            );
          }
        } catch (error) {
          console.error("Error al intentar eliminar el servicio:", error);
          alert(error.message || "Error al eliminar el servicio");
          return;
        }
      const modal = new bootstrap.Modal(document.getElementById("modalEliminar"));
      modal.show();
      return;
    }

    // Botón editar  

    try {
         const btnEditar = e.target.closest(".btn-editar");
        
      if (btnEditar) {
        const index = btnEditar.dataset.index;
        const servicio = JSON.parse(localStorage.getItem(KEY)) || [];
        const servicioAEditar = servicios[index];

        document.getElementById("nombre").value = servicioAEditar.nombre;
        document.getElementById("descripcion").value = servicioAEditar.descripcion;
        document.getElementById("precio").value = servicioAEditar.precio;
        document.getElementById("preview").src = servicioAEditar.urlImagen;
        document.getElementById("preview").style.display = "block";
        document.getElementById("editIndex").value = index;
        const modal = new bootstrap.Modal(document.getElementById("exampleModal"));
        modal.show();
      }
    } catch (error) {
      console.error("Error al intentar editar el servicio:", error);
    }

  });

  const btnConfirmar = document.getElementById("btn-confirmar-eliminar");
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", function () {
      const lista = JSON.parse(localStorage.getItem(KEY)) || [];
      lista.splice(Number(indexAEliminar), 1);
      localStorage.setItem(KEY, JSON.stringify(lista));
      const modal = bootstrap.Modal.getInstance(document.getElementById("modalEliminar"));
      modal.hide();
      renderizarTabla();
    });
  }
}