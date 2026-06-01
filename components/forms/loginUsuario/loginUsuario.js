const BASE_URL = "https://backend-style-factory.onrender.com"
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formLogin');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        limpiarErrores();
        ocultarMensajes();

        const correo = document.getElementById('email').value.trim();
        const contrasena = document.getElementById('password').value;

        let isValid = true;

        if (correo === '') {
            mostrarError('errorEmail', 'El correo electrónico es obligatorio');
            isValid = false;
        } else if (!validarEmail(correo)) {
            mostrarError('errorEmail', 'Ingrese un correo electrónico válido');
            isValid = false;
        }

        if (contrasena === '') {
            mostrarError('errorPassword', 'La contraseña es obligatoria');
            isValid = false;
        }

        if (!isValid) return;
       
        

        try {
            const respuesta = await fetch(BASE_URL + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena })
            });

            if (!respuesta.ok) {
                const error = await respuesta.json().catch(() => ({}));
                const mensajeError = document.getElementById('mensajeError');
                mensajeError.textContent = error.message || 'Correo electrónico o contraseña incorrectos';
                mensajeError.style.display = 'block';
                return;
            }

            const datos = await respuesta.json();

            const usuarioLogueado = {
                token: datos.token ?? datos.accessToken ?? '',
                correo: datos.correo ?? datos.email ?? datos.usuario?.correo ?? datos.usuario?.email ?? '',
                nombre: datos.nombre ?? datos.fullName ?? datos.usuario?.nombre ?? '',
                rol: (datos.rol ?? datos.role ?? 'cliente').toLowerCase(),
                fechaLogin: new Date().toISOString()
            };

            localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioLogueado));

            const rol = usuarioLogueado.rol;

            const mensajeBienvenida = document.getElementById('mensajeBienvenida');
            mensajeBienvenida.textContent = `¡Bienvenido/a, ${usuarioLogueado.nombre || 'usuario'}!`;
            mensajeBienvenida.style.display = 'block';

            setTimeout(() => {
                if (rol === 'admin') {
                    window.parent.location.href = '/pages/admin/panelDeControl/panelControl.html';
                } else {
                    window.parent.location.href = '/index.html';
                }
            }, 2000);

        } catch (e) {
            const mensajeError = document.getElementById('mensajeError');
            mensajeError.textContent = 'Error de conexión. Intente nuevamente.';
            mensajeError.style.display = 'block';
        }
    });

    function validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function mostrarError(elementId, mensaje) {
        const span = document.getElementById(elementId);
        span.textContent = mensaje;
        span.style.display = 'block';
    }

    function limpiarErrores() {
        document.querySelectorAll('.error').forEach(e => {
            e.textContent = '';
            e.style.display = 'none';
        });
    }

    function ocultarMensajes() {
        const bienvenida = document.getElementById('mensajeBienvenida');
        const error = document.getElementById('mensajeError');
        if (bienvenida) bienvenida.style.display = 'none';
        if (error) error.style.display = 'none';
    }
});
