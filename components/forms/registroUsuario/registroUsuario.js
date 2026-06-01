const BASE_URL = "https://backend-style-factory.onrender.com";

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function mostrarError(elementId, mensaje) {
    var errorSpan = document.getElementById(elementId);
    if (errorSpan) {
        errorSpan.textContent = mensaje;
        errorSpan.style.display = 'block';
    }
}

function mostrarErrorGeneral(mensaje) {
    var mensajeError = document.getElementById('mensajeError');
    if (mensajeError) {
        mensajeError.textContent = mensaje;
        mensajeError.style.display = 'block';
        mensajeError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
    }
    mostrarError('errorGeneral', mensaje);
}

function limpiarErrores() {
    document.querySelectorAll('.error').forEach(function (e) {
        e.textContent = '';
        e.style.display = 'none';
    });
    var mensajeError = document.getElementById('mensajeError');
    if (mensajeError) {
        mensajeError.textContent = '';
        mensajeError.style.display = 'none';
    }
}

function ocultarMensajeExito() {
    var exito = document.getElementById('mensajeExito');
    if (exito) exito.style.display = 'none';
}

function mostrarExitoRegistro() {
    var exito = document.getElementById('mensajeExito');
    if (exito) {
        exito.innerHTML =
            '<span class="mensaje-exito-icon" aria-hidden="true"></span>' +
            '<span class="mensaje-exito-texto">¡Cuenta registrada con <strong>éxito</strong>! Redirigiendo al inicio de sesión...</span>';
        exito.style.display = 'flex';
        exito.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function redirigirAlLogin() {
    var url = '/pages/login/login.html?registro=exito';
    if (window.parent && window.parent !== window) {
        window.parent.location.href = url;
    } else {
        window.location.href = url;
    }
}

// ── Validación de contraseña en tiempo real ───────────────────────────────────

function validarRequisitosPassword() {
    var passwordInput = document.getElementById('password');
    if (!passwordInput) return false;

    var password = passwordInput.value;
    var requisitos = [
        { id: 'req-longitud',   valido: password.length >= 8 },
        { id: 'req-mayuscula',  valido: /[A-Z]/.test(password) },
        { id: 'req-minuscula',  valido: /[a-z]/.test(password) },
        { id: 'req-numero',     valido: /[0-9]/.test(password) },
        { id: 'req-especial',   valido: /[@#$%*!?\-_]/.test(password) }
    ];

    var todosCumplidos = true;
    requisitos.forEach(function (req) {
        var elem = document.getElementById(req.id);
        if (elem) {
            var textoBase = elem.textContent.replace(/^[✓✗]\s*/, '');
            elem.innerHTML   = (req.valido ? '✓' : '✗') + ' ' + textoBase;
            elem.className   = 'requisito ' + (req.valido ? 'valid' : 'invalid');
        }
        if (!req.valido) todosCumplidos = false;
    });

    return todosCumplidos;
}

// ── Validación del formulario completo ────────────────────────────────────────

function validarFormularioRegistro() {
    var nombre          = document.getElementById('nombreCompleto').value;
    var email           = document.getElementById('email').value;
    var telefono        = document.getElementById('telefono').value;
    var password        = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    var isValid         = true;

    if (typeof FormValidaciones === 'undefined') {
        mostrarErrorGeneral('No se cargaron las validaciones. Recargue la página.');
        return false;
    }

    var resultadoNombre = FormValidaciones.validarNombre(nombre, { minLength: 3 });
    if (!resultadoNombre.valido) {
        mostrarError('errorNombre', resultadoNombre.mensaje);
        isValid = false;
    }

    var resultadoEmail = FormValidaciones.validarEmail(email);
    if (!resultadoEmail.valido) {
        mostrarError('errorEmail', resultadoEmail.mensaje);
        isValid = false;
    }

    var resultadoTelefono = FormValidaciones.validarTelefono(telefono, {
        requerido: true,
        minDigitos: 7,
        maxDigitos: 15
    });
    if (!resultadoTelefono.valido) {
        mostrarError('errorTelefono', resultadoTelefono.mensaje);
        isValid = false;
    }

    if (!password) {
        mostrarError('errorPassword', 'La contraseña es obligatoria');
        isValid = false;
    } else if (!validarRequisitosPassword()) {
        mostrarError('errorPassword', 'La contraseña no cumple los requisitos');
        isValid = false;
    }

    if (!confirmPassword) {
        mostrarError('errorConfirmPassword', 'Debe confirmar la contraseña');
        isValid = false;
    } else if (password !== confirmPassword) {
        mostrarError('errorConfirmPassword', 'Las contraseñas no coinciden');
        isValid = false;
    }

    return isValid;
}

// ── Inicialización del formulario ─────────────────────────────────────────────

function initRegistroForm() {
    var form = document.getElementById('formRegistro');
    if (!form || form.dataset.registroInicializado === 'true') return;
    form.dataset.registroInicializado = 'true';

    // Notificar altura al padre (iframe)
    function notificarAltura() {
        if (window.parent !== window) {
            window.parent.postMessage({ iframeHeight: document.body.scrollHeight }, '*');
        }
    }
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(notificarAltura).observe(document.body);
    }
    notificarAltura();

    // Validaciones en tiempo real
    var passwordInput  = document.getElementById('password');
    var nombreInput    = document.getElementById('nombreCompleto');
    var telefonoInput  = document.getElementById('telefono');

    if (typeof FormValidaciones !== 'undefined') {
        if (nombreInput) {
            FormValidaciones.configurarValidacionNombreEnTiempoReal(nombreInput, 'errorNombre');
        }
        if (telefonoInput) {
            FormValidaciones.configurarValidacionTelefonoEnTiempoReal(telefonoInput, 'errorTelefono');
        }
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', validarRequisitosPassword);
    }

    // Envío del formulario
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        limpiarErrores();
        ocultarMensajeExito();

        if (!validarFormularioRegistro()) return;

        var boton          = form.querySelector('.btn-registro');
        var textoBoton     = boton ? boton.textContent : 'Registrarse';
        var registroExitoso = false;

        if (boton) {
            boton.disabled    = true;
            boton.textContent = 'Registrando...';
        }

        var requestBody = {
            nombre:     document.getElementById('nombreCompleto').value.trim(),
            correo:     document.getElementById('email').value.trim(),
            telefono:   document.getElementById('telefono').value.trim(),
            contrasena: document.getElementById('password').value,
            rol:        'CLIENTE'
        };

        fetch(BASE_URL + '/auth/register', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(requestBody)
        })
            .then(function (response) {
                if (!response.ok) {
                    return response.json().catch(function () { return null; })
                        .then(function (errorData) {
                            var mensaje =
                                (errorData && (errorData.error || errorData.mensaje || errorData.message)) ||
                                'No se pudo completar el registro';

                            if (
                                typeof FormValidaciones !== 'undefined' &&
                                FormValidaciones.esCorreoDuplicado &&
                                FormValidaciones.esCorreoDuplicado(response, errorData)
                            ) {
                                mostrarError('errorEmail', mensaje);
                            } else {
                                mostrarErrorGeneral(mensaje);
                            }
                            throw new Error('registro_fallido');
                        });
                }
                return response.json();
            })
            .then(function () {
                registroExitoso = true;
                mostrarExitoRegistro();
                setTimeout(redirigirAlLogin, 2500);
            })
            .catch(function (error) {
                if (error && error.message === 'registro_fallido') return;
                console.error('Error en registro:', error);
                mostrarErrorGeneral('No se pudo conectar con el servidor. Intente más tarde.');
            })
            .finally(function () {
                if (boton && !registroExitoso) {
                    boton.disabled    = false;
                    boton.textContent = textoBoton;
                }
            });
    });
}

// ── Arranque ──────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRegistroForm);
} else {
    initRegistroForm();
}
