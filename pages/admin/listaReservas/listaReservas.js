const BASE_URL = "https://backend-style-factory.onrender.com";
let reservasCache = [];
let idAEliminar = null;
let listaReservasInicializado = false;

function renderizarTablaReservas(reservas) {
    const tbody = document.getElementById("tabla-reservas");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!reservas || reservas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">No hay reservas registradas</td></tr>`;
        return;
    }

    reservas.forEach((reserva, index) => {
        const cliente    = reserva.nombreUsuario ?? "—";
        const profesional = reserva.nombreEmpleado ?? "—";
        const servicio   = reserva.nombreServicio ?? "—";
        const fecha      = reserva.fecha ?? "—";
        const hora       = reserva.hora ? String(reserva.hora).substring(0, 5) : "—";
        const estadoBadge = (reserva.estado ?? "pendiente").toLowerCase();

        tbody.innerHTML += `
            <tr>
                <td>#ID-${String(reserva.id ?? index + 1).padStart(2, '0')}</td>
                <td>${cliente.toUpperCase()}</td>
                <td>${profesional}</td>
                <td>${servicio}</td>
                <td>${fecha}</td>
                <td>${hora}</td>
                <td><span class="badge-estado ${estadoBadge}">${(reserva.estado ?? "PENDIENTE").toUpperCase()}</span></td>
                <td class="celda-acciones">
                    <button class="btn-accion btn-eliminar-reserva" data-id="${reserva.id ?? ''}" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
}

async function cargarReservasDesdeAPI() {
    const token = sfSession.getToken();
    try {
        const res = await fetch(`${BASE_URL}/reservas`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            reservasCache = await res.json();
            renderizarTablaReservas(reservasCache);
            return;
        }
        console.warn(`GET /reservas → ${res.status}`);
    } catch (err) {
        console.warn("Error cargando reservas desde API:", err.message);
    }
    renderizarTablaReservas([]);
}

export function initListaReservas() {
    cargarReservasDesdeAPI();

    // Evitar registrar los listeners globales más de una vez
    if (listaReservasInicializado) return;
    listaReservasInicializado = true;

    // Abrir modal al hacer clic en eliminar
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".btn-eliminar-reserva");
        if (!btn) return;
        idAEliminar = btn.dataset.id;
        new bootstrap.Modal(document.getElementById("modalEliminarReserva")).show();
    });

    // Confirmar eliminación
    document.getElementById("btn-confirmar-eliminar-reserva")
        ?.addEventListener("click", async function () {
            bootstrap.Modal.getInstance(document.getElementById("modalEliminarReserva"))?.hide();

            if (idAEliminar) {
                try {
                    const token = sfSession.getToken();
                    const res = await fetch(`${BASE_URL}/reservas/${idAEliminar}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) console.warn(`DELETE /reservas/${idAEliminar} → ${res.status}`);
                } catch (err) {
                    console.warn("Error eliminando reserva:", err.message);
                }
            }

            idAEliminar = null;
            await cargarReservasDesdeAPI();
        });
}