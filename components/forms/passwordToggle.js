(function () {
    function initTogglePassword(root) {
        var scope = root || document;
        scope.querySelectorAll('.btn-toggle-password').forEach(function (btn) {
            if (btn.dataset.toggleBound === 'true') return;
            btn.dataset.toggleBound = 'true';

            btn.addEventListener('click', function () {
                var field = btn.closest('.password-field');
                var input = field && field.querySelector('input[type="password"], input[type="text"]');
                if (!input) return;

                var mostrar = input.type === 'password';
                input.type = mostrar ? 'text' : 'password';
                btn.classList.toggle('is-visible', mostrar);
                btn.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
                btn.setAttribute('aria-pressed', String(mostrar));
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initTogglePassword();
        });
    } else {
        initTogglePassword();
    }

    window.initTogglePassword = initTogglePassword;
})();
