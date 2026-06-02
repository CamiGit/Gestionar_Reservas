

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

function validarFormulario(nombre, descripcion, precio, tipoServicio) {
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

  if (!validar(tipoServicio)) {
    mostrarError("errorTipoServicio", "El tipo de servicio es obligatorio");
    esValido = false;
  } else limpiarError("errorTipoServicio");

  return esValido;
}

export function initFormulario(onServicioGuardado) {
  let imagenURL = "";
const BASE_URL = "https://backend-style-factory.onrender.com";
 // const BASE_URL = (
   // window.BASE_URL || "https://backend-style-factory.onrender.com"
 // ).replace(/\/$/, "");
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
    const tipoServicio = document.querySelector("#tipoServicio").value.trim();
    const statusEl = document.querySelector('input[name="status"]:checked');
    const status = statusEl ? statusEl.value : "true";
    const editIndex = document.getElementById("editIndex").value;
    const esEdicion = editIndex !== "";

    const esValido = validarFormulario(nombre, descripcion, precio, tipoServicio);

    if (esValido) {
      const listaActual =
        JSON.parse(localStorage.getItem("Lista de Servicios")) || [];
      if (esEdicion) {
        const servicioBase = listaActual[editIndex] || {};
        const servicioActualizado = {
          nombre,
          descripcion,
          precio: Number(precio),
          urlImagen: imagenURL || servicioBase.urlImagen || "",
          tipoServicio,
          estado: status === "true",
        };

        try {
          const servicioId = servicioBase.id;
          if (!servicioId) throw new Error("No se encontró el ID del servicio a editar.");
          const token = sfSession.getToken() || "";
          const respuesta = await fetch(`${BASE_URL}/servicios/${servicioId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(servicioActualizado),
          });
          if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || "No se pudo actualizar el servicio.");
          }
        } catch (error) {
          console.error("Error actualizando servicio:", error);
          await sfAlert(error.message || "Error al actualizar el servicio", "error");
          return;
        }
        await sfAlert("Servicio actualizado correctamente.", "success");

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
            nombre,
            descripcion,
            urlImagen: imagenURL || "",
            precio: Number(precio),
            tipoServicio,
            estado: true
          };


          try {
            const token = sfSession.getToken() || "";
            const respuesta = await fetch(`${BASE_URL}/servicios`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify(servicio),
            });

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
            await sfAlert("Servicio agregado correctamente.", "success");

            const modal = bootstrap.Modal.getInstance(
              document.getElementById("exampleModal"),
            );
            if (modal) modal.hide();
            if (onServicioGuardado) onServicioGuardado();
          } catch (error) {
            console.error("Error creando servicio:", error);
            await sfAlert(error.message || "Error al crear el servicio", "error");
          }
        } else {
          await sfAlert("Este servicio ya existe.", "warning");
        }  
      }

      document.getElementById("editIndex").value = "";
      document.querySelector(".btn-enviar").textContent = "Crear Servicio";
      document.getElementById("formCreacionServicios").reset();
      preview.style.display = "none";
      imagenURL = "";
    } else {
      await sfAlert("Por favor completa correctamente todos los campos del formulario.", "warning");
    }
  });
}
