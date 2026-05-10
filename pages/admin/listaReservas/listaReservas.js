const KEY = "reservas";
let indexAEliminar = null;

export function renderizarTablaReservas() {
    const reservas = JSON.parse(localStorage.getItem(KEY)) || [];
    const tbody = document.getElementById("tabla-reservas");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (reservas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay reservas registradas</td></tr>`;
        return;
    }

    reservas.forEach((reserva, index) => {
        const fila = `
            <tr>
                <td>#ID-${String(reserva.id).padStart(2, '0')}</td>
                <td>${reserva.profesional?.nombre ?? "—"}</td>
                <td>${reserva.servicio?.nombre ?? "—"}</td>
                <td>${reserva.fecha ?? "—"}</td>
                <td>${reserva.hora ?? "—"}</td>
                <td><span class="badge-estado confirmada">Confirmada</span></td>
                <td class="celda-acciones">
                    <button class="btn-accion btn-eliminar-reserva" data-index="${index}" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

export function initListaReservas() {
    renderizarTablaReservas();

    document.addEventListener("click", function (e) {
        const btnEliminar = e.target.closest(".btn-eliminar-reserva");
        if (!btnEliminar) return;
        indexAEliminar = btnEliminar.dataset.index;
        const modal = new bootstrap.Modal(document.getElementById("modalEliminarReserva"));
        modal.show();
    });

    const btnConfirmar = document.getElementById("btn-confirmar-eliminar-reserva");
    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", function () {
            const lista = JSON.parse(localStorage.getItem(KEY)) || [];
            lista.splice(Number(indexAEliminar), 1);
            localStorage.setItem(KEY, JSON.stringify(lista));
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalEliminarReserva"));
            modal.hide();
            renderizarTablaReservas();
        });
    }
}