(function () {
    var API_LOGIN =
        typeof BASE_URL !== 'undefined'
            ? BASE_URL
            : 'https://backend-style-factory.onrender.com';

    function validarEmailLogin(email) {
        if (typeof FormValidaciones !== 'undefined') {
            return FormValidaciones.validarEmail(email);
        }
        var valor = (email || '').trim();
        if (valor === '') {
            return { valido: false, mensaje: 'El correo electrónico es obligatorio' };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
            return { valido: false, mensaje: 'Ingrese un correo electrónico válido' };
        }
        return { valido: true };
    }

    function mostrarError(elementId, mensaje) {
        var errorSpan = document.getElementById(elementId);
        if (errorSpan) {
            errorSpan.textContent = mensaje;
            errorSpan.style.display = 'block';
        }
    }

    function limpiarErrores() {
        document.querySelectorAll('.error').forEach(function (e) {
            e.textContent = '';
            e.style.display = 'none';
        });
    }

    function ocultarMensajes() {
        var mb = document.getElementById('mensajeBienvenida');
        var me = document.getElementById('mensajeError');
        if (mb) mb.style.display = 'none';
        if (me) me.style.display = 'none';
    }

    function initLoginForm() {
        var form = document.getElementById('formLogin');
        if (!form || form.dataset.loginInicializado === 'true') return;
        form.dataset.loginInicializado = 'true';

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            limpiarErrores();
            ocultarMensajes();

            var correo = document.getElementById('email').value.trim();
            var contrasena = document.getElementById('password').value;
            var boton = form.querySelector('.btn-login');
            var textoBoton = boton ? boton.textContent : '';
            var isValid = true;

            var resultadoEmail = validarEmailLogin(correo);
            if (!resultadoEmail.valido) {
                mostrarError('errorEmail', resultadoEmail.mensaje);
                isValid = false;
            }

            if (contrasena === '') {
                mostrarError('errorPassword', 'La contraseña es obligatoria');
                isValid = false;
            }

            if (!isValid) return;

            if (boton) {
                boton.disabled = true;
                boton.textContent = 'Iniciando sesión...';
            }

            fetch(API_LOGIN + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: correo, contrasena: contrasena })
            })
                .then(function (respuesta) {
                    if (!respuesta.ok) {
                        return respuesta.json().catch(function () {
                            return {};
                        }).then(function (error) {
                            throw new Error(
                                error.mensaje ||
                                    error.message ||
                                    error.error ||
                                    'Correo electrónico o contraseña incorrectos'
                            );
                        });
                    }
                    return respuesta.json();
                })
                .then(function (datos) {
                    var usuarioLogueado = {
                        token: datos.token ?? datos.accessToken ?? '',
                        id: datos.id ?? datos.usuario?.id ?? null,
                        correo:
                            datos.correo ??
                            datos.email ??
                            datos.usuario?.correo ??
                            datos.usuario?.email ??
                            correo,
                        nombre:
                            datos.nombre ??
                            datos.fullName ??
                            datos.usuario?.nombre ??
                            '',
                        rol: (datos.rol ?? datos.role ?? 'cliente').toLowerCase(),
                        fechaLogin: new Date().toISOString()
                    };

                    localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioLogueado));

                    var mensajeBienvenida = document.getElementById('mensajeBienvenida');
                    if (mensajeBienvenida) {
                        var nombreCorto =
                            (usuarioLogueado.nombre || '').trim().split(/\s+/)[0] ||
                            usuarioLogueado.nombre ||
                            'usuario';
                        mensajeBienvenida.textContent = '¡Bienvenido/a, ' + nombreCorto + '!';
                        mensajeBienvenida.style.display = 'block';
                    }

                    setTimeout(function () {
                        var destino =
                            usuarioLogueado.rol === 'admin'
                                ? '/pages/admin/panelDeControl/panelControl.html'
                                : '/pages/misReservas/misReservas.html';
                        if (window.parent && window.parent !== window) {
                            window.parent.location.href = destino;
                        } else {
                            window.location.href = destino;
                        }
                    }, 1500);
                })
                .catch(function (error) {
                    console.error('Error en login:', error);
                    var mensajeError = document.getElementById('mensajeError');
                    if (mensajeError) {
                        var texto = error.message || 'Error de conexión. Intente nuevamente.';
                        if (
                            error.name === 'TypeError' &&
                            (texto.indexOf('fetch') !== -1 || texto.indexOf('Network') !== -1)
                        ) {
                            texto =
                                'No se pudo conectar con el servidor. Verifique su conexión o intente más tarde.';
                        }
                        mensajeError.textContent = texto;
                        mensajeError.style.display = 'block';
                    }
                })
                .finally(function () {
                    if (boton) {
                        boton.disabled = false;
                        boton.textContent = textoBoton;
                    }
                });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginForm);
    } else {
        initLoginForm();
    }
})();
