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
        const estadoBadge = "confirmada";

        tbody.innerHTML += `
            <tr>
                <td>#ID-${String(reserva.id ?? index + 1).padStart(2, '0')}</td>
                <td>${cliente.toUpperCase()}</td>
                <td>${profesional}</td>
                <td>${servicio}</td>
                <td>${fecha}</td>
                <td>${hora}</td>
                <td><span class="badge-estado confirmada">CONFIRMADO</span></td>
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
    const tbody = document.getElementById("tabla-reservas");
    const spinner = (msg) => `<tr><td colspan="8"><div style="display:flex;flex-direction:column;align-items:center;padding:2rem;gap:.75rem;"><div style="width:40px;height:40px;border:3px solid #f0e6ff;border-top-color:#522676;border-radius:50%;animation:sf-spin 0.8s linear infinite;"></div><span style="color:#888;font-size:.85rem;">${msg}</span></div><style>@keyframes sf-spin{to{transform:rotate(360deg);}}</style></td></tr>`;

    const intentosMax = 3;
    for (let intento = 1; intento <= intentosMax; intento++) {
        if (tbody) tbody.innerHTML = spinner(intento === 1 ? "Cargando reservas..." : `Reintentando conexión (${intento}/${intentosMax})...`);
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
            console.warn(`Intento ${intento} fallido:`, err.message);
        }
        if (intento < intentosMax) await new Promise(r => setTimeout(r, 3000));
    }

    // Tras todos los intentos fallidos
    if (tbody) tbody.innerHTML = `
        <tr><td colspan="8">
          <div style="display:flex;flex-direction:column;align-items:center;padding:2rem;gap:1rem;">
            <i class="fa-solid fa-circle-exclamation fa-2x" style="color:#d97706;"></i>
            <p style="color:#555;font-size:.9rem;margin:0;text-align:center;">No se pudieron cargar las reservas.<br>El servidor puede estar iniciando.</p>
            <button id="btn-reintentar-reservas" style="background:#522676;color:#fff;border:none;border-radius:8px;padding:.5rem 1.4rem;font-size:.88rem;font-weight:500;cursor:pointer;">
              <i class="fa-solid fa-rotate-right"></i> Reintentar
            </button>
          </div>
        </td></tr>`;
    document.getElementById("btn-reintentar-reservas")
        ?.addEventListener("click", () => cargarReservasDesdeAPI());
}

export function initListaReservas() {
    cargarReservasDesdeAPI();

    // Evitar registrar los listeners globales más de una vez
    if (listaReservasInicializado) return;
    listaReservasInicializado = true;

    // Confirmar reserva pendiente
    document.addEventListener("click", async function (e) {
        const btn = e.target.closest(".btn-confirmar-reserva");
        if (!btn) return;
        const token = sfSession.getToken();
        try {
            const res = await fetch(`${BASE_URL}/reservas/${btn.dataset.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ estado: "CONFIRMADA" }),
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            await sfAlert("Reserva confirmada correctamente.", "success");
            cargarReservasDesdeAPI();
        } catch (err) {
            await sfAlert("No se pudo confirmar la reserva.", "error");
        }
    });

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