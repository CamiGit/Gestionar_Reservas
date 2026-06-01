async function actualizarNavbar() {
    const token = sfSession.getToken();
    const userInfo = document.getElementById('user-info');
    const accesoBotones = document.getElementById('acceso-botones');
    const userNameSpan = document.getElementById('userName');
    const adminLink = document.getElementById('admin-link');

    if (token) {
        const usuario = await sfSession.getProfile();
        if (userNameSpan) userNameSpan.textContent = `Hola, ${usuario?.nombre ?? ''}`;
        if (userInfo) userInfo.style.display = 'block';
        if (accesoBotones) accesoBotones.style.display = 'none';
        if (adminLink) adminLink.style.display = (usuario?.rol ?? '') === 'admin' ? 'block' : 'none';
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (accesoBotones) accesoBotones.style.display = 'block';
        if (adminLink) adminLink.style.display = 'none';
    }
}

async function cerrarSesion() {
    await sfSession.clear();
    window.location.href = '/index.html';
}

fetch('../../components/navbar/navbar.html')
    .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar el navbar');
        return res.text();
    })
    .then(async function (html) {
        document.getElementById('header').innerHTML = html;
        await actualizarNavbar();
        const btnCerrarSesion = document.getElementById('btnCerrarSesion');
        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', cerrarSesion);
        }
    })
    .catch(function (err) { console.error('Error cargando el navbar:', err); });

window.addEventListener('message', function (e) {
    if (e.data && e.data.iframeHeight) {
        const iframe = document.querySelector('.form-iframe');
        if (iframe) iframe.style.height = e.data.iframeHeight + 'px';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const iframe = document.querySelector('.form-iframe');
    if (!iframe) return;
    iframe.addEventListener('load', function () {
        try {
            const body = iframe.contentDocument.body;
            const ajustar = function () {
                iframe.style.height = body.scrollHeight + 'px';
            };
            ajustar();
            new ResizeObserver(ajustar).observe(body);
        } catch (e) {}
    });
});

// Cargar footer
fetch('../../components/footer/footer.html')
    .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar el footer');
        return res.text();
    })
    .then(function (html) {
        document.getElementById('footer-placeholder').innerHTML = html;
    })
    .catch(function (err) { console.error('Error cargando el footer:', err); });