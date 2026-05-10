if (document.getElementById('cards-container')) {
    fetch('/components/navbar/navbar.html')
        .then(res => res.text())
        .then(html => { document.getElementById('header').innerHTML = html; })
        .catch(err => console.error('Error cargando el navbar:', err));

    fetch('/components/footer/footer.html')
        .then(res => res.text())
        .then(html => { document.getElementById('footer-placeholder').innerHTML = html; })
        .catch(err => console.error('Error cargando el footer:', err));

    document.addEventListener('DOMContentLoaded', renderizarCatalogo);
}

let btnReservar;

const productos = [
    { id: 1, nombre: "Corte de Cabello Premium", descripcion: "Corte moderno con técnicas personalizadas según tu tipo de cabello.", precio: 45000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957776/cortePremium_engl79.png", status: true },
    { id: 2, nombre: "Tinte y Coloración", descripcion: "Coloración de alta calidad con marcas premium. Resultados duraderos.", precio: 120000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957782/tinteColoracion_xlsf5v.png", status: true },
    { id: 3, nombre: "Tratamiento de Keratina", descripcion: "Alisado profundo que elimina el frizz y deja el cabello sedoso.", precio: 180000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957777/keratina_bjqvof.png", status: true },
    { id: 4, nombre: "Barba y Afeitado", descripcion: "Servicio completo de perfilado de barba y afeitado clásico.", precio: 35000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957775/barbaAfeitado_fcacso.png", status: true },
    { id: 5, nombre: "Peinado para Eventos", descripcion: "Peinados profesionales para bodas, graduaciones y eventos especiales.", precio: 80000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957782/peinadoEventos_bk9cyr.png", status: true },
    { id: 6, nombre: "Mechas y Reflejos", descripcion: "Técnicas de mechas californianas, babylights y reflejos.", precio: 150000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957780/mechasReflejos_p5hod7.png", status: true },
    { id: 7, nombre: "Tratamiento Capilar", descripcion: "Hidratación y nutrición profunda para cabello maltratado.", precio: 65000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957783/tratamientoCapilar_mqkb13.png", status: true },
    { id: 8, nombre: "Cepillado Brasileño", descripcion: "Alisado progresivo que reduce el volumen y da brillo.", precio: 160000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957775/cepilladoBrasile%C3%B1o_ela99r.png", status: true },
    { id: 9, nombre: "Maquillaje Profesional", descripcion: "Maquillaje para ocasiones especiales con productos de alta calidad.", precio: 90000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957779/maquillajeProfesional_h9vo1k.png", status: true },
    { id: 10, nombre: "Limpieza Facial", descripcion: "Tratamiento facial profundo para eliminar impurezas y revitalizar.", precio: 70000, imagen: "https://res.cloudinary.com/diq2bkb49/image/upload/v1776957778/limpiezaFacial_fmvrnn.png", status: true }
];

function renderizarCatalogo() {
    const container = document.getElementById('cards-container');
    if (!container) {
        console.error("No se encontró el contenedor 'cards-container'");
        return;
    }

    const lista = JSON.parse(localStorage.getItem("Lista de Servicios")) || productos;
    const productosActivos = lista.filter(producto => producto.status === true || producto.status === "true");

    const html = productosActivos.map(producto => {
        const precioFormateado = Number(producto.precio).toLocaleString('es-CO');
        return `
            <div class="card-servicio">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="card-imagen">
                <div class="card-contenido">
                    <h3 class="card-titulo">${producto.nombre}</h3>
                    <p class="card-descripcion">${producto.descripcion}</p>
                    <div class="card-precio">$${precioFormateado}</div>
                    <button class="btn-reservar" data-id="${producto.id}">RESERVAR</button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    document.querySelectorAll('.btn-reservar').forEach(boton => {
        boton.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            const listaActual = JSON.parse(localStorage.getItem("Lista de Servicios")) || productos;
            const productoSeleccionado = listaActual.find(p => p.id === id);

            // ✅ Guarda solo el servicio seleccionado en key separada
            localStorage.setItem('servicioSeleccionado', JSON.stringify(productoSeleccionado));

            window.location.href = '/pages/reservations/reservations.html';
        });
    });
}

document.addEventListener('DOMContentLoaded', renderizarCatalogo);

export { productos, btnReservar };