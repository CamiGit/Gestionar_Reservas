import { renderizarServicios } from '/pages/catalogoServicios/catalogoServicios.js';

fetch('/components/navbar/navbar.html')
    .then(res => res.text())
    .then(html => { document.getElementById('header').innerHTML = html; })
    .catch(err => console.error('Error cargando el navbar:', err));

fetch('/components/footer/footer.html')
    .then(res => res.text())
    .then(html => { document.getElementById('footer-placeholder').innerHTML = html; })
    .catch(err => console.error('Error cargando el footer:', err));

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderizarServicios);
} else {
    renderizarServicios();
}