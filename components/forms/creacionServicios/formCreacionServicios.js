import { productos } from "/pages/catalogoServicios/catalogoServicios.js";

let listaDeServicios =
  JSON.parse(localStorage.getItem("Lista de Servicios")) || [];

if (listaDeServicios.length == 0) {
  productos.forEach(function (elemento) {
    listaDeServicios.push(elemento);
  });
  localStorage.setItem("Lista de Servicios", JSON.stringify(listaDeServicios));
}

function validar(valor) {
  return valor.trim() !== "";
}

function mostrarError(errorId, mensaje) {
  const errorSpan = document.getElementById(errorId);
  if (errorSpan) errorSpan.textContent = mensaje;
}

function limpiarError(errorId) {
  const errorSpan = document.getElementById(errorId);
  if (errorSpan) errorSpan.textContent = "";
}

function validarFormulario(nombre, descripcion, precio) {
  let esValido = true;

  if (!validar(nombre)) {
    mostrarError("errorNombre", "El nombre es obligatorio");
    esValido = false;
  } else limpiarError("errorNombre");

  if (!validar(descripcion)) {
    mostrarError("errorDescripcion", "La descripcion es obligatoria");
    esValido = false;
  } else limpiarError("errorDescripcion");

  if (isNaN(Number(precio)) || Number(precio) <= 0) {
    mostrarError("errorPrecio", "¡Introduzca un precio Valido!");
    esValido = false;
  } else limpiarError("errorPrecio");

  return esValido;
}

export function initFormulario(onServicioGuardado) {
  let imagenURL = "";

  const BASE_URL = (
    window.BASE_URL || "https://backend-style-factory.onrender.com"
  ).replace(/\/$/, "");
  const botonEnviar = document.querySelector(".btn-enviar");
  const inputImagen = document.getElementById("inputImagen");
  const preview = document.getElementById("preview");

  inputImagen.addEventListener("change", async function () {
    const archivo = this.files[0];
    if (!archivo) return;

    const formData = new FormData();
    formData.append("file", archivo);
    formData.append("upload_preset", "servicios_app");

    try {
      const respuesta = await fetch(
        "https://api.cloudinary.com/v1_1/dxp3axcje/image/upload",
        { method: "POST", body: formData },
      );
      const data = await respuesta.json();
      imagenURL = data.secure_url;
      preview.src = imagenURL;
      preview.style.display = "block";
    } catch (error) {
      console.error("Error subiendo imagen:", error);
    }
  });

  botonEnviar.addEventListener("click", async function (event) {
    event.preventDefault();

    const nombre = document.querySelector("#nombre").value.trim();
    const descripcion = document.querySelector("#descripcion").value.trim();
    const precio = document.querySelector("#precio").value.trim();
    const statusEl = document.querySelector('input[name="status"]:checked');
    const status = statusEl ? statusEl.value : "true";
    const editIndex = document.getElementById("editIndex").value;
    const esEdicion = editIndex !== "";

    const esValido = validarFormulario(nombre, descripcion, precio);

    if (esValido) {
      const listaActual =
        JSON.parse(localStorage.getItem("Lista de Servicios")) || [];

      if (esEdicion) {
        listaActual[editIndex] = {
          ...listaActual[editIndex],
          nombre,
          descripcion,
          precio,
          status,
          imagen: imagenURL || listaActual[editIndex].imagen,
        };
        localStorage.setItem("Lista de Servicios", JSON.stringify(listaActual));
        alert("Servicio Actualizado");

        const modal = bootstrap.Modal.getInstance(
          document.getElementById("exampleModal"),
        );
        if (modal) modal.hide();
        if (onServicioGuardado) onServicioGuardado();
      } else {
        const existe = listaActual.some(
          (e) => e.nombre.toLowerCase() === nombre.toLowerCase(),
        );

        if (!existe) {
          const servicio = {
            nombre: nombre,
            descripcion: descripcion,
            urlImagen: imagenURL || "",
            precio: Number(precio),
            tipoServicio: "Personalizado"
          };

          console.log("Payload que se envía al crear servicio:", servicio);

          try {
            const usuarioLogueado = JSON.parse(
              localStorage.getItem("usuarioLogueado") || "{}",
            );
            console.log("Usuariologuedo", usuarioLogueado)
            const token = usuarioLogueado.token || "";
            console.log("Token", token)
            const respuesta = await fetch(`${BASE_URL}/servicios`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(servicio),
            });

            console.log("Servicio: ", respuesta.body);
            if (!respuesta.ok) {
              const errorData = await respuesta.json().catch(() => ({}));
              throw new Error(
                errorData.message || "No se pudo crear el servicio.",
              );
            }

            const servicioCreado = await respuesta.json();
            const maxId =
              listaActual.length > 0
                ? Math.max(...listaActual.map((s) => Number(s.id) || 0))
                : 0;

            listaActual.push({
              id: servicioCreado.id ?? maxId + 1,
              ...servicio,
              ...servicioCreado,
            });
            localStorage.setItem(
              "Lista de Servicios",
              JSON.stringify(listaActual),
            );
            alert("Servicio Agregado");

            const modal = bootstrap.Modal.getInstance(
              document.getElementById("exampleModal"),
            );
            if (modal) modal.hide();
            if (onServicioGuardado) onServicioGuardado();
          } catch (error) {
            console.error("Error creando servicio:", error);
            alert(error.message || "Error al crear el servicio");
          }
        } else {
          alert("El Servicio ya Existe");
        }
      }

      document.getElementById("editIndex").value = "";
      document.querySelector(".btn-enviar").textContent = "Crear Servicio";
      document.getElementById("formCreacionServicios").reset();
      preview.style.display = "none";
      imagenURL = "";
    } else {
      alert("El formulario esta Incorrecto");
    }
  });
}
