export function initNavbarAdmin() {
  const btnToggle = document.querySelector("#toggleBtn");
  const sidebar = document.querySelector("#sidebar");

  if (btnToggle && sidebar) {
    btnToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });
  }

  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    link.addEventListener("click", function () {
      links.forEach(l => l.classList.remove("active"));
      this.classList.add("active");
    });
  });
}