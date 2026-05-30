/**
 * Validaciones reutilizables para formularios del frontend.
 */
const FormValidaciones = (function () {
    const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'.-]+$/;

    function validarEmail(valor, requerido) {
        if (requerido === undefined) requerido = true;
        const email = (valor || '').trim();
        if (email === '') {
            return requerido
                ? { valido: false, mensaje: 'El correo electrónico es obligatorio' }
                : { valido: true };
        }
        if (!REGEX_EMAIL.test(email)) {
            return { valido: false, mensaje: 'Ingrese un correo electrónico válido' };
        }
        return { valido: true };
    }

    function validarNombre(valor, opciones) {
        opciones = opciones || {};
        const minLength = opciones.minLength !== undefined ? opciones.minLength : 3;
        const requerido = opciones.requerido !== undefined ? opciones.requerido : true;
        const nombre = (valor || '').trim();

        if (nombre === '') {
            return requerido
                ? { valido: false, mensaje: 'El nombre es obligatorio' }
                : { valido: true };
        }
        if (/\d/.test(nombre)) {
            return { valido: false, mensaje: 'El nombre no puede contener números' };
        }
        if (nombre.length < minLength) {
            return {
                valido: false,
                mensaje: 'El nombre debe tener al menos ' + minLength + ' caracteres'
            };
        }
        if (!REGEX_NOMBRE.test(nombre)) {
            return {
                valido: false,
                mensaje: 'El nombre solo puede contener letras, espacios y apóstrofes'
            };
        }
        return { valido: true };
    }

    function validarTelefono(valor, opciones) {
        opciones = opciones || {};
        const requerido = opciones.requerido !== undefined ? opciones.requerido : false;
        const minDigitos = opciones.minDigitos !== undefined ? opciones.minDigitos : 7;
        const maxDigitos = opciones.maxDigitos !== undefined ? opciones.maxDigitos : 15;
        const telefono = (valor || '').trim();

        if (telefono === '') {
            return requerido
                ? { valido: false, mensaje: 'El teléfono es obligatorio' }
                : { valido: true };
        }

        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(telefono)) {
            return {
                valido: false,
                mensaje: 'Formato no válido: el teléfono solo admite números'
            };
        }

        const digitos = telefono.replace(/\D/g, '');
        if (digitos.length < minDigitos || digitos.length > maxDigitos) {
            return {
                valido: false,
                mensaje: 'Ingrese un teléfono válido (' + minDigitos + ' a ' + maxDigitos + ' dígitos)'
            };
        }
        return { valido: true };
    }

    function validarTextoObligatorio(valor, etiqueta, minLength) {
        minLength = minLength || 1;
        const texto = (valor || '').trim();
        if (texto === '') {
            return { valido: false, mensaje: 'El ' + etiqueta + ' es obligatorio' };
        }
        if (texto.length < minLength) {
            return {
                valido: false,
                mensaje: 'El ' + etiqueta + ' debe tener al menos ' + minLength + ' caracteres'
            };
        }
        return { valido: true };
    }

    function esCorreoDuplicado(respuesta, cuerpoError) {
        if (respuesta && respuesta.status === 409) return true;
        const mensaje = (cuerpoError && (cuerpoError.error || cuerpoError.mensaje)) || '';
        const texto = mensaje.toLowerCase();
        return texto.includes('ya está registrado') || texto.includes('ya existe');
    }

    function configurarValidacionNombreEnTiempoReal(input, errorId) {
        if (!input || input.dataset.nombreTiempoReal === 'true') return;
        input.dataset.nombreTiempoReal = 'true';

        function mostrarErrorTiempoReal(mensaje) {
            const span = document.getElementById(errorId);
            if (!span) return;
            span.textContent = mensaje;
            span.style.display = 'block';
        }

        function limpiarErrorTiempoReal() {
            const span = document.getElementById(errorId);
            if (!span) return;
            span.textContent = '';
            span.style.display = 'none';
        }

        function procesarEntrada() {
            const valor = input.value;
            let limpio = '';
            let habiaNumero = false;
            let habiaOtroInvalido = false;

            for (let i = 0; i < valor.length; i++) {
                const caracter = valor.charAt(i);
                if (/\d/.test(caracter)) {
                    habiaNumero = true;
                } else if (!REGEX_NOMBRE.test(caracter)) {
                    habiaOtroInvalido = true;
                } else {
                    limpio += caracter;
                }
            }

            if (habiaNumero || habiaOtroInvalido) {
                input.value = limpio;
                if (habiaNumero) {
                    mostrarErrorTiempoReal(
                        'Carácter no válido: el nombre no puede contener números'
                    );
                } else {
                    mostrarErrorTiempoReal(
                        'Carácter no válido: solo se permiten letras'
                    );
                }
                return;
            }

            limpiarErrorTiempoReal();
        }

        input.addEventListener('input', procesarEntrada);
    }

    function configurarValidacionTelefonoEnTiempoReal(input, errorId) {
        if (!input || input.dataset.telefonoTiempoReal === 'true') return;
        input.dataset.telefonoTiempoReal = 'true';

        function mostrarErrorTiempoReal(mensaje) {
            const span = document.getElementById(errorId);
            if (!span) return;
            span.textContent = mensaje;
            span.style.display = 'block';
        }

        function limpiarErrorTiempoReal() {
            const span = document.getElementById(errorId);
            if (!span) return;
            span.textContent = '';
            span.style.display = 'none';
        }

        function esCaracterTelefonoPermitido(caracter) {
            return /\d/.test(caracter) || /[\s\-+()]/.test(caracter);
        }

        function procesarEntrada() {
            const valor = input.value;
            let limpio = '';
            let habiaLetra = false;
            let habiaSimboloInvalido = false;

            for (let i = 0; i < valor.length; i++) {
                const caracter = valor.charAt(i);
                if (/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(caracter)) {
                    habiaLetra = true;
                } else if (!esCaracterTelefonoPermitido(caracter)) {
                    habiaSimboloInvalido = true;
                } else {
                    limpio += caracter;
                }
            }

            if (habiaLetra || habiaSimboloInvalido) {
                input.value = limpio;
                if (habiaLetra) {
                    mostrarErrorTiempoReal(
                        'Formato no válido: el teléfono solo admite números'
                    );
                } else {
                    mostrarErrorTiempoReal(
                        'Formato no válido: use solo dígitos y separadores (+, -, espacios o paréntesis)'
                    );
                }
                return;
            }

            limpiarErrorTiempoReal();
        }

        input.addEventListener('input', procesarEntrada);
    }

    return {
        validarEmail: validarEmail,
        validarNombre: validarNombre,
        validarTelefono: validarTelefono,
        validarTextoObligatorio: validarTextoObligatorio,
        esCorreoDuplicado: esCorreoDuplicado,
        configurarValidacionNombreEnTiempoReal: configurarValidacionNombreEnTiempoReal,
        configurarValidacionTelefonoEnTiempoReal: configurarValidacionTelefonoEnTiempoReal
    };
})();
