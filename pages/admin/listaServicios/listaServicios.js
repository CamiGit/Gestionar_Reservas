import { productos } from "../../catalogoServicios/catalogoServicios.js";
import { initFormulario } from "../../../components/forms/creacionServicios/formCreacionServicios.js";

const KEY = "Lista de Servicios";
let indexAEliminar = null;

export function renderizarTabla() {
  const servicios = JSON.parse(localStorage.getItem(KEY)) || [];
  const tbody = document.getElementById("tabla-servicios");
  if (!tbody) return;
  tbody.innerHTML = "";

  servicios.forEach((servicio, index) => {
    const estadoClase = servicio.status === true || servicio.status === "true" ? "confirmada" : "cancelada";
    const estadoTexto = servicio.status === true || servicio.status === "true" ? "Activo" : "Inactivo";
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
    productos.forEach((elemento) => servicios.push(elemento));
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

  document.addEventListener("click", function (e) {
    // Botón eliminar
    const btnEliminar = e.target.closest(".btn-eliminar");
    if (btnEliminar) {
      indexAEliminar = btnEliminar.dataset.index;
      const modal = new bootstrap.Modal(document.getElementById("modalEliminar"));
      modal.show();
      return;
    }

    // Botón editar
    const btnEditar = e.target.closest(".btn-editar");
    if (btnEditar) {
      const index = btnEditar.dataset.index;
      const lista = JSON.parse(localStorage.getItem(KEY)) || [];
      const servicio = lista[index];

      document.getElementById("nombre").value = servicio.nombre;
      document.getElementById("descripcion").value = servicio.descripcion;
      document.getElementById("precio").value = servicio.precio;
      document.getElementById("editIndex").value = index;
      document.querySelector(".btn-enviar").textContent = "Guardar Cambios";

      const modal = new bootstrap.Modal(document.getElementById("exampleModal"));
      modal.show();
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