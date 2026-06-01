function initFormContacto() {
    const formulario = document.getElementById('formContacto');
    if (!formulario || formulario.dataset.inicializado === 'true') return;
    formulario.dataset.inicializado = 'true';

    if (typeof FormValidaciones === 'undefined') {
        console.error('formValidaciones.js no está cargado');
        return;
    }

    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        FormValidaciones.configurarValidacionNombreEnTiempoReal(nombreInput, 'errorNombre');
    }
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        FormValidaciones.configurarValidacionTelefonoEnTiempoReal(telefonoInput, 'errorTelefono');
    }

    const mensajeExito = document.getElementById('mensajeEnvio');
    const mensajeEnviando = document.getElementById('mensajeEnviando');

    formulario.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!validarFormularioContacto()) {
            return;
        }

        mensajeEnviando.style.display = 'block';
        if (mensajeExito) mensajeExito.style.display = 'none';

        const boton = formulario.querySelector('.btn-enviar');
        const textoOriginal = boton.textContent;
        boton.textContent = 'Enviando...';
        boton.disabled = true;

        const formData = new FormData(formulario);

        try {
            const respuesta = await fetch(formulario.action, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' }
            });

            setTimeout(function () {
                mensajeEnviando.style.display = 'none';

                if (respuesta.ok) {
                    formulario.reset();
                    formulario.querySelectorAll('input, textarea').forEach(function (input) {
                        input.dispatchEvent(new Event('input'));
                    });
                    limpiarErroresContacto();
                    if (mensajeExito) mensajeExito.style.display = 'block';
                    setTimeout(function () {
                        if (mensajeExito) mensajeExito.style.display = 'none';
                    }, 5000);
                } else {
                    mostrarErrorContacto('errorGeneral', 'Hubo un error al enviar. Intente nuevamente.');
                }

                boton.textContent = textoOriginal;
                boton.disabled = false;
            }, 2000);
        } catch (error) {
            mensajeEnviando.style.display = 'none';
            mostrarErrorContacto('errorGeneral', 'Error de conexión. Revise su internet e intente de nuevo.');
            boton.textContent = textoOriginal;
            boton.disabled = false;
        }
    });
}

function validarFormularioContacto() {
    if (typeof FormValidaciones === 'undefined') {
        mostrarErrorContacto('errorGeneral', 'No se cargaron las validaciones. Recargue la página.');
        return false;
    }

    let esValido = true;

    const nombre = document.getElementById('nombre').value;
    const resultadoNombre = FormValidaciones.validarNombre(nombre, { minLength: 2 });
    if (!resultadoNombre.valido) {
        mostrarErrorContacto('errorNombre', resultadoNombre.mensaje);
        esValido = false;
    } else {
        limpiarErrorContacto('errorNombre');
    }

    const correo = document.getElementById('correo').value;
    const resultadoCorreo = FormValidaciones.validarEmail(correo);
    if (!resultadoCorreo.valido) {
        mostrarErrorContacto('errorCorreo', resultadoCorreo.mensaje);
        esValido = false;
    } else {
        limpiarErrorContacto('errorCorreo');
    }

    const telefono = document.getElementById('telefono').value;
    const resultadoTelefono = FormValidaciones.validarTelefono(telefono, {
        requerido: false,
        minDigitos: 9,
        maxDigitos: 15
    });
    if (!resultadoTelefono.valido) {
        mostrarErrorContacto('errorTelefono', resultadoTelefono.mensaje);
        esValido = false;
    } else {
        limpiarErrorContacto('errorTelefono');
    }

    const mensaje = document.getElementById('mensaje').value;
    const resultadoMensaje = FormValidaciones.validarTextoObligatorio(mensaje, 'mensaje', 10);
    if (!resultadoMensaje.valido) {
        mostrarErrorContacto('errorMensaje', resultadoMensaje.mensaje);
        esValido = false;
    } else {
        limpiarErrorContacto('errorMensaje');
    }

    return esValido;
}

function limpiarErrorContacto(errorId) {
    const errorSpan = document.getElementById(errorId);
    if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.style.display = 'none';
    }
}

function limpiarErroresContacto() {
    ['errorNombre', 'errorCorreo', 'errorTelefono', 'errorMensaje', 'errorGeneral'].forEach(
        limpiarErrorContacto
    );
}

function mostrarErrorContacto(errorId, mensaje) {
    const errorSpan = document.getElementById(errorId);
    if (errorSpan) {
        errorSpan.textContent = mensaje;
        errorSpan.style.display = 'block';
    }
}
