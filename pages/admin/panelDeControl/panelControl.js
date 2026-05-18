import { initListaServicios } from "../listaServicios/listaServicios.js";
import { initListaReservas } from "../listaReservas/listaReservas.js";

fetch('/components/navbarAdmin/navbar_Admin.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('navbarAdmin-placeholder').innerHTML = html;
        initSidebar();
    })
    .catch(err => console.error('Error cargando el navbar admin:', err));

function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggleBtn");
  const links = document.querySelectorAll(".nav-link");
  const content = document.getElementById("content");
  const logoutBtn = document.querySelector(".logout");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  loadPage("/components/metricas/metricas.html");

  links.forEach(link => {
    link.addEventListener("click", function () {
      if (this.classList.contains("logout")) return;
      links.forEach(l => l.classList.remove("active"));
      this.classList.add("active");
      const page = this.getAttribute("data-page");
      loadPage(page);
    });
  });


if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    const modalSalir = new bootstrap.Modal(document.getElementById("modalSalir"));
    modalSalir.show();

    const btnSalirConfirmado = document.getElementById("btnSalirConfirmado");
    btnSalirConfirmado.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  });
}

  function loadPage(page) {
    fetch(page)
      .then(res => res.text())
      .then(html => {
        content.innerHTML = html;

        if (page.includes("metricas")) {
          initMetricas();
        }

        if (page.includes("listaServicios")) {
          initListaServicios();
        }

        // ✅ Inicializa la lista de reservas
        if (page.includes("listaReservas")) {
          initListaReservas();
        }
      });
  }
}