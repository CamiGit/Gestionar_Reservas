// Verifica que el nombre no esté vacío
const BASE_URL = "https://backend-style-factory.onrender.com"
function validarNombre(nombre) {
    return nombre.trim() !== '';
}

// Verifica que el correo tenga un formato válido
function validarCorreo(correo) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
}

// Verifica que se haya seleccionado un código de país
function validarCodigoPais(codigo) {
    return codigo !== '';
}

// Verifica que el teléfono tenga entre 7 y 15 dígitos (solo números)
function validarTelefono(telefono) {
    if (telefono.trim() === '') return false;
    const soloNumeros = /^\d+$/.test(telefono.replace(/[\s\-\(\)\+]/g, ''));
    const cantidadDigitos = telefono.replace(/[\s\-\(\)\+]/g, '').length;
    const longitudValida = cantidadDigitos >= 7 && cantidadDigitos <= 15;
    return soloNumeros && longitudValida;
}

// Verifica que se haya seleccionado un servicio
function validarServicio(servicio) {
    return servicio !== '';
}

// La fecha no puede ser anterior al día de hoy
function validarFecha(fecha) {
    if (!fecha) return false;
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaSeleccionada >= hoy;
}

// Verifica que se haya seleccionado una hora
function validarHora(hora) {
    return hora !== '';
}

// Valida que la hora esté dentro del horario laboral
// Horarios disponibles: 9am a 12pm y 2pm a 6pm
function validarHorarioLaboral(hora) {
    const horasPermitidas = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    return horasPermitidas.includes(hora);
}

// Limpia el mensaje de error de un campo específico
function limpiarError(errorId) {
    const errorSpan = document.getElementById(errorId);
    if (errorSpan) errorSpan.textContent = '';
}

// Muestra un mensaje de error en el campo correspondiente
function mostrarError(errorId, mensaje) {
    const errorSpan = document.getElementById(errorId);
    if (errorSpan) errorSpan.textContent = mensaje;
}

// Valida todos los campos del formulario antes de enviar
function validarFormulario() {
    let esValido = true;

    // Nombre
    const nombre = document.getElementById('nombre').value;
    if (!validarNombre(nombre)) {
        mostrarError('errorNombre', 'El nombre es obligatorio');
        esValido = false;
    } else {
        limpiarError('errorNombre');
    }

    // Correo electrónico
    const correo = document.getElementById('correo').value;
    if (!validarCorreo(correo)) {
        mostrarError('errorCorreo', 'Ingrese un correo válido');
        esValido = false;
    } else {
        limpiarError('errorCorreo');
    }

    // Código de país
    const codigoPais = document.getElementById('codigoPais').value;
    if (!validarCodigoPais(codigoPais)) {
        mostrarError('errorTelefono', 'Seleccione el código de país');
        esValido = false;
    } else {
        // Si el código está bien, limpiamos el error de código si existe
        if (document.getElementById('errorTelefono').textContent === 'Seleccione el código de país') {
            limpiarError('errorTelefono');
        }
    }

    // Número de teléfono
    const telefono = document.getElementById('telefono').value;
    if (!validarTelefono(telefono)) {
        const errorActual = document.getElementById('errorTelefono').textContent;
        // No sobrescribir el error del código de país
        if (errorActual !== 'Seleccione el código de país') {
            mostrarError('errorTelefono', 'Ingrese al menos 7 números (máximo 15)');
        }
        esValido = false;
    } else {
        // Limpiamos solo si no hay error del código
        if (document.getElementById('errorTelefono').textContent !== 'Seleccione el código de país') {
            limpiarError('errorTelefono');
        }
    }

    // Servicio
    const servicio = document.getElementById('servicio').value;
    if (!validarServicio(servicio)) {
        mostrarError('errorServicio', 'Seleccione un servicio');
        esValido = false;
    } else {
        limpiarError('errorServicio');
    }

    // Fecha
    const fecha = document.getElementById('fecha').value;
    if (!validarFecha(fecha)) {
        mostrarError('errorFecha', 'Seleccione una fecha válida (hoy o futuro)');
        esValido = false;
    } else {
        limpiarError('errorFecha');
    }

    // Hora y horario laboral
    const hora = document.getElementById('hora').value;
    if (!validarHora(hora)) {
        mostrarError('errorHora', 'Seleccione una hora');
        esValido = false;
    } else if (!validarHorarioLaboral(hora)) {
        mostrarError('errorHora', 'Horario laboral: 9am a 12pm / 2pm a 6pm');
        esValido = false;
    } else {
        limpiarError('errorHora');
    }

    return esValido;
}

// ========== CONFIGURACIÓN DEL ENVÍO ==========

const formulario = document.getElementById('formReserva');
const mensajeExito = document.getElementById('mensajeExito');
const mensajeEnviando = document.getElementById('mensajeEnviando');

// Evento que se ejecuta al enviar el formulario
formulario.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Si la validación falla, no se envía nada
    if (!validarFormulario()) return;

    // Mostrar mensaje de "enviando"
    mensajeEnviando.style.display = 'block';
    mensajeExito.style.display = 'none';

    // Deshabilitar el botón mientras se procesa el envío
    const boton = formulario.querySelector('.btn-enviar');
    const textoOriginal = boton.textContent;
    boton.textContent = 'Enviando...';
    boton.disabled = true;

    // Recolectar los datos del formulario
    const formData = new FormData(formulario);

    try {
        // Enviar los datos a Formspree
        const respuesta = await fetch(formulario.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        // Pequeña pausa para que se vea el mensaje de "enviando"
        setTimeout(async () => {
            mensajeEnviando.style.display = 'none';

            if (respuesta.ok) {
                // Limpiar el formulario si todo salió bien
                formulario.reset();
                const inputs = formulario.querySelectorAll('input, select');
                inputs.forEach(input => input.dispatchEvent(new Event('input')));

                // Mostrar mensaje de éxito
                mensajeExito.style.display = 'block';

                // Limpiar todos los errores
                const errores = ['errorNombre', 'errorCorreo', 'errorTelefono', 'errorServicio', 'errorFecha', 'errorHora'];
                errores.forEach(limpiarError);

                // Ocultar el mensaje de éxito después de 5 segundos
                setTimeout(() => {
                    mensajeExito.style.display = 'none';
                }, 5000);
            } else {
                alert('Hubo un error. Intenta nuevamente.');
            }

            // Restaurar el botón
            boton.textContent = textoOriginal;
            boton.disabled = false;
        }, 2000);

    } catch (error) {
        // Error de conexión
        mensajeEnviando.style.display = 'none';
        alert('Error de conexión. Revisa tu internet.');
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
});