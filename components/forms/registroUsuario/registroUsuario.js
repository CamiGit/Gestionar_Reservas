/**
 * Valida los requisitos de la contraseña en tiempo real
 * Verifica longitud, mayúsculas, minúsculas, números y caracteres especiales
 * Actualiza la interfaz visual de requisitos a medida que el usuario escribe
 */
const BASE_URL = "https://backend-style-factory.onrender.com"
function validarRequisitosPassword() {
  const password = document.getElementById("password").value;

  const reqLongitud = document.getElementById("req-longitud");
  const reqMayuscula = document.getElementById("req-mayuscula");
  const reqMinuscula = document.getElementById("req-minuscula");
  const reqNumero = document.getElementById("req-numero");
  const reqEspecial = document.getElementById("req-especial");

  const longitudValida = password.length >= 8;
  const mayusculaValida = /[A-Z]/.test(password);
  const minusculaValida = /[a-z]/.test(password);
  const numeroValida = /[0-9]/.test(password);
  const especialValida = /[@#$%*!?\-_]/.test(password);

  if (reqLongitud) {
    reqLongitud.innerHTML =
      (longitudValida ? "✓" : "✗") + " Mínimo 8 caracteres";
    reqLongitud.className =
      "requisito " + (longitudValida ? "valid" : "invalid");
  }
  if (reqMayuscula) {
    reqMayuscula.innerHTML =
      (mayusculaValida ? "✓" : "✗") + " Al menos una letra mayúscula";
    reqMayuscula.className =
      "requisito " + (mayusculaValida ? "valid" : "invalid");
  }
  if (reqMinuscula) {
    reqMinuscula.innerHTML =
      (minusculaValida ? "✓" : "✗") + " Al menos una letra minúscula";
    reqMinuscula.className =
      "requisito " + (minusculaValida ? "valid" : "invalid");
  }
  if (reqNumero) {
    reqNumero.innerHTML = (numeroValida ? "✓" : "✗") + " Al menos un número";
    reqNumero.className = "requisito " + (numeroValida ? "valid" : "invalid");
  }
  if (reqEspecial) {
    reqEspecial.innerHTML =
      (especialValida ? "✓" : "✗") +
      " Al menos un carácter especial (@, #, $, %, *, !, ?, -, _)";
    reqEspecial.className =
      "requisito " + (especialValida ? "valid" : "invalid");
  }

  return (
    longitudValida &&
    mayusculaValida &&
    minusculaValida &&
    numeroValida &&
    especialValida
  );
}

/**
 * Inicializa el formulario de registro y configura los eventos
 */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("formRegistro");
  if (!form) return;

  function notificarAltura() {
    window.parent.postMessage({ iframeHeight: document.body.scrollHeight }, "*");
  }
  new ResizeObserver(notificarAltura).observe(document.body);
  notificarAltura();

  const passwordInput = document.getElementById("password");

  if (passwordInput) {
    passwordInput.addEventListener("input", validarRequisitosPassword);
  }

  document.querySelectorAll(".toggle-password").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const input = document.getElementById(btn.dataset.target);
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.querySelector(".icon-eye").style.display = isPassword ? "none" : "";
      btn.querySelector(".icon-eye-off").style.display = isPassword ? "" : "none";
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    limpiarErrores();

    const nombre = document.getElementById("nombreCompleto").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    let isValid = true;

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

        if (password === '') {
            mostrarError('errorPassword', 'La contraseña es obligatoria');
            isValid = false;
        } else if (!validarRequisitosPassword()) {
            mostrarError('errorPassword', 'La contraseña no cumple los requisitos');
            isValid = false;
        }

        if (confirmPassword === '') {
            mostrarError('errorConfirmPassword', 'Debe confirmar la contraseña');
            isValid = false;
        } else if (password !== confirmPassword) {
            mostrarError('errorConfirmPassword', 'Las contraseñas no coinciden');
            isValid = false;
        }

        return isValid;
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

    function initRegistroForm() {
        var form = document.getElementById('formRegistro');
        if (!form || form.dataset.registroInicializado === 'true') return;
        form.dataset.registroInicializado = 'true';

        function notificarAltura() {
            window.parent.postMessage({ iframeHeight: document.body.scrollHeight }, '*');
        }
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(notificarAltura).observe(document.body);
        }
        notificarAltura();

        var passwordInput = document.getElementById('password');
        var nombreInput = document.getElementById('nombreCompleto');
        var telefonoInput = document.getElementById('telefono');

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

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            limpiarErrores();
            ocultarMensajeExito();

            if (!validarFormularioRegistro()) return;

            var boton = form.querySelector('.btn-registro');
            var textoBoton = boton ? boton.textContent : 'Registrarse';
            var registroExitoso = false;
            if (boton) {
                boton.disabled = true;
                boton.textContent = 'Registrando...';
            }

            var requestBody = {
                nombre: document.getElementById('nombreCompleto').value.trim(),
                correo: document.getElementById('email').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                contrasena: document.getElementById('password').value,
                rol: 'CLIENTE'
            };

            fetch(API_REGISTRO + '/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })
                .then(function (response) {
                    if (!response.ok) {
                        return response.json().catch(function () {
                            return null;
                        }).then(function (errorData) {
                            var mensaje =
                                (errorData && (errorData.error || errorData.mensaje || errorData.message)) ||
                                'No se pudo completar el registro';

                            if (
                                typeof FormValidaciones !== 'undefined' &&
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
                    mostrarErrorGeneral(
                        'No se pudo conectar con el servidor. Intente más tarde.'
                    );
                })
                .finally(function () {
                    if (boton && !registroExitoso) {
                        boton.disabled = false;
                        boton.textContent = textoBoton;
                    }
                });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRegistroForm);
    } else {
        initRegistroForm();
    }
})();
