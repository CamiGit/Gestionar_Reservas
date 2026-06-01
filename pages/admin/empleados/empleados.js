const BASE_URL = "https://backend-style-factory.onrender.com";
const HORAS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

function getToken() {
  return sfSession.getToken() ?? "";
}

// ─── Estado global del modal ──────────────────────────────────────────────────
let estado = {
  modo: "crear",          // "crear" | "editar" | "horarios"
  paso: 1,
  empleadoId: null,
  imagenURL: "",
  horariosPendientes: {}, // solo se usa en modo "crear": { "YYYY-MM-DD": ["HH:MM",...] }
};

let empleadosActuales = [];
let _eliminando       = { empleadoId: null, usuarioId: null };
const CACHE_KEY          = "admin_empleados_cache";
const DELETED_IDS_KEY    = "admin_empleados_eliminados";

// ─── PUNTO DE ENTRADA ─────────────────────────────────────────────────────────

export async function initEmpleados() {
  generarCheckboxesHoras();
  initFechaMinima();
  try {
    await cargarEmpleados();
  } catch (err) {
    console.error("Error cargando empleados:", err);
    const tbody = document.getElementById("tabla-empleados");
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-danger">Error al cargar empleados. Recarga la página.</td></tr>`;
  }
  initBtnNuevoEmpleado();
  initImagenUpload();
  initModalReset();
  initModalEliminar();
}

// ─── TABLA ────────────────────────────────────────────────────────────────────

// ─── Caché local (GET /empleados tiene bug de SQL en el backend) ──────────────
function getCacheEmpleados() {
  return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
}
function setCacheEmpleados(lista) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(lista));
}
function upsertCacheEmpleado(emp) {
  const lista = getCacheEmpleados();
  const idx   = lista.findIndex(e => String(e.id) === String(emp.id));
  if (idx >= 0) lista[idx] = emp; else lista.push(emp);
  setCacheEmpleados(lista);
}
function deleteCacheEmpleado(id) {
  setCacheEmpleados(getCacheEmpleados().filter(e => String(e.id) !== String(id)));
}

function getDeletedIds() {
  return JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || "[]");
}
function addDeletedId(id) {
  const ids = getDeletedIds();
  if (!ids.includes(String(id))) {
    ids.push(String(id));
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(ids));
  }
}
function filtrarEliminados(lista) {
  const eliminados = getDeletedIds();
  return lista.filter(e => !eliminados.includes(String(e.id)));
}

async function cargarEmpleados() {
  const tbody = document.getElementById("tabla-empleados");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Cargando...</td></tr>`;

  const headers = { Authorization: `Bearer ${getToken()}` };

  for (const url of [
    `${BASE_URL}/empleados?estado=true`,
    `${BASE_URL}/empleados`,
  ]) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) { console.warn(`GET ${url} → ${res.status}`); continue; }
      const data = await res.json();
      const raw  = Array.isArray(data) ? data : (data.content ?? data.data ?? []);
      if (!raw.length) continue;

      const mapeados = raw
        .filter(e => e.estado !== false)   // excluir borrados lógicos
        .map(e => ({
          id:           e.id,
          usuarioId:    e.usuarioId ?? e.usuario_id ?? e.usuario?.id ?? null,
          nombre:       e.nombreUsuario ?? e.nombre ?? e.usuario?.nombre ?? "",
          especialidad: e.especialidad  ?? "",
          urlImagen:    e.url           ?? e.urlImagen ?? "",
        }));

      empleadosActuales = mapeados;
      setCacheEmpleados(empleadosActuales);
      renderTablaEmpleados(empleadosActuales);
      return;
    } catch (err) { console.warn(url, err.message); }
  }

  // Fallback: caché local ya filtrada
  empleadosActuales = filtrarEliminados(getCacheEmpleados());
  renderTablaEmpleados(empleadosActuales);
}

function renderTablaEmpleados(empleados) {
  const tbody = document.getElementById("tabla-empleados");
  if (!tbody) return;

  if (!empleados.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No hay empleados registrados.</td></tr>`;
    return;
  }

  // Log del primer empleado para diagnosticar campos del backend
  if (empleados.length > 0) {
    console.log('[Empleados] Campos disponibles:', Object.keys(empleados[0]));
    console.log('[Empleados] Primer registro:', JSON.stringify(empleados[0], null, 2));
  }

  tbody.innerHTML = empleados.map((emp, i) => {
    const nombre =
      emp.nombre            ??
      emp.nombreEmpleado    ??
      emp.usuario?.nombre   ??
      emp.usuario?.nombreCompleto ??
      emp.name              ??
      emp.fullName          ??
      emp.nombre_completo   ??
      "";

    // Capturar la URL resuelta antes de usarla en el HTML
    const urlFoto = emp.urlImagen ?? emp.url ?? emp.imagen ?? emp.foto ?? emp.usuario?.urlImagen ?? "";
    const foto = urlFoto
      ? `<img src="${urlFoto}" class="emp-avatar" alt="${nombre}">`
      : `<div class="emp-avatar-placeholder"><i class="fa-regular fa-circle-user"></i></div>`;

    return `
      <tr>
        <td>#ID-${emp.id ?? i + 1}</td>
        <td>${nombre || '<span class="text-muted small">Sin nombre</span>'}</td>
        <td>${emp.especialidad ?? "—"}</td>
        <td>${foto}</td>
        <td class="celda-acciones">
          <button class="btn-accion btn-editar-emp"  data-index="${i}"    title="Editar datos"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-accion btn-ver-horario" data-id="${emp.id}" data-nombre="${nombre}" title="Gestionar horarios"><i class="fa-regular fa-calendar"></i></button>
          <button class="btn-accion btn-eliminar-emp" data-id="${emp.id}" data-index="${i}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll(".btn-editar-emp").forEach(btn =>
    btn.addEventListener("click", () => abrirModoEditar(empleadosActuales[+btn.dataset.index]))
  );
  tbody.querySelectorAll(".btn-ver-horario").forEach(btn =>
    btn.addEventListener("click", () => abrirModoHorarios(btn.dataset.id, btn.dataset.nombre))
  );
  tbody.querySelectorAll(".btn-eliminar-emp").forEach(btn =>
    btn.addEventListener("click", () => {
      const modal = document.getElementById("modalEliminarEmp");
      if (!modal) {
        console.error("Modal de eliminación no encontrado en el DOM.");
        return;
      }
      const emp = empleadosActuales[+btn.dataset.index];
      _eliminando = {
        empleadoId: emp?.id   ?? btn.dataset.id ?? null,
        usuarioId:  emp?.usuarioId ?? null,
      };
      bootstrap.Modal.getOrCreateInstance(modal).show();
    })
  );
}

// ─── APERTURA DEL MODAL ───────────────────────────────────────────────────────

function initBtnNuevoEmpleado() {
  document.getElementById("btnNuevoEmpleado")?.addEventListener("click", abrirModoCrear);
}

async function abrirModoCrear() {
  resetEstado();
  resetFormularioDatos();
  mostrarCampoUsuario(true);
  await cargarSelectUsuarios();
  mostrarPaso(1);
  new bootstrap.Modal(document.getElementById("modalEmpleado")).show();
}

// ─── USUARIOS: cargar select ──────────────────────────────────────────────────

function mostrarCampoUsuario(visible) {
  const campo = document.getElementById("campoUsuarioId");
  if (campo) campo.style.display = visible ? "block" : "none";
}

async function cargarSelectUsuarios() {
  const select = document.getElementById("empUsuarioId");
  if (!select) return;
  select.innerHTML = `<option value="">Cargando usuarios...</option>`;

  try {
    const res  = await fetch(`${BASE_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const body = await res.text();

    if (!res.ok) throw new Error(`GET /usuarios → ${res.status}: ${body}`);

    const data     = JSON.parse(body);
    const usuarios = Array.isArray(data)
      ? data
      : (data.data ?? data.usuarios ?? data.users ?? data.content ?? []);

    if (!usuarios.length) {
      select.innerHTML = `<option value="">No hay usuarios registrados</option>`;
      return;
    }

    select.innerHTML =
      `<option value="">— Selecciona un usuario —</option>` +
      usuarios.map(u => {
        const nombre = u.nombre ?? u.nombreCompleto ?? u.fullName ?? u.name ?? u.username ?? "";
        const correo = u.correo ?? u.email ?? "";
        return `<option value="${u.id}">${nombre} — ${correo}</option>`;
      }).join("");

  } catch (err) {
    console.error("Error cargando usuarios:", err);
    select.innerHTML = `<option value="">Error: ${err.message}</option>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function abrirModoEditar(emp) {
  resetEstado();
  estado.modo       = "editar";
  estado.empleadoId = emp.id;
  estado.imagenURL  = emp.urlImagen ?? "";

  document.getElementById("empEditId").value           = emp.id;
  document.getElementById("empNombre").value           = emp.nombre ?? emp.nombreEmpleado ?? "";
  document.getElementById("empEspecialidad").value     = emp.especialidad ?? "";
  mostrarCampoUsuario(false);
  document.getElementById("tituloModalEmp").textContent = "Editar Empleado";
  document.getElementById("lblFoto").textContent       = "Cambiar archivo";

  if (emp.urlImagen) {
    document.getElementById("empImagenURL").value        = emp.urlImagen;
    document.getElementById("empPreview").src            = emp.urlImagen;
    document.getElementById("empPreview").style.display  = "block";
    document.getElementById("empAvatarIcon").style.display = "none";
  }

  mostrarPaso(1);
  new bootstrap.Modal(document.getElementById("modalEmpleado")).show();
}

async function abrirModoHorarios(empleadoId, nombre) {
  resetEstado();
  estado.modo       = "horarios";
  estado.empleadoId = empleadoId;

  document.getElementById("tituloModalEmp").textContent = "Horarios de " + nombre;

  const emp = empleadosActuales.find(e => String(e.id) === String(empleadoId));
  actualizarCabeceraPaso2(
    emp?.nombre ?? emp?.nombreEmpleado ?? nombre,
    emp?.especialidad ?? "",
    emp?.urlImagen ?? ""
  );

  mostrarPaso(2);
  await cargarHorariosExistentes(empleadoId);
  new bootstrap.Modal(document.getElementById("modalEmpleado")).show();
}

// ─── GESTIÓN DE PASOS ─────────────────────────────────────────────────────────

function mostrarPaso(num) {
  estado.paso = num;

  document.getElementById("paso1").style.display = num === 1 ? "block" : "none";
  document.getElementById("paso2").style.display = num === 2 ? "block" : "none";

  document.getElementById("indPaso1").classList.toggle("activo", num === 1);
  document.getElementById("indPaso2").classList.toggle("activo", num === 2);

  renderFooter();

  if (num === 2) {
    rebindBtnAnadir();
    if (estado.modo === "crear") renderHorariosPendientes();
  }
}

function renderFooter() {
  const footer = document.getElementById("empModalFooter");
  if (!footer) return;

  if (estado.paso === 1) {
    if (estado.modo === "editar") {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-outline-emp" id="btnVerHorarios">
          Ver horarios <i class="fa-solid fa-arrow-right ms-1"></i>
        </button>
        <button type="button" class="btn btn-emp-primary" id="btnGuardarDatos">
          <i class="fa-solid fa-floppy-disk me-1"></i> Guardar datos
        </button>`;
      document.getElementById("btnGuardarDatos").addEventListener("click", guardarDatosEmpleado);
      document.getElementById("btnVerHorarios").addEventListener("click", irAPaso2Editar);
    } else {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-emp-primary" id="btnSiguiente">
          Siguiente: Horarios <i class="fa-solid fa-arrow-right ms-1"></i>
        </button>`;
      document.getElementById("btnSiguiente").addEventListener("click", validarYSeguir);
    }
  } else {
    if (estado.modo === "crear") {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" id="btnAtras">
          <i class="fa-solid fa-arrow-left me-1"></i> Atrás
        </button>
        <button type="button" class="btn btn-emp-primary" id="btnCrearEmpleado">
          <i class="fa-solid fa-user-plus me-1"></i> Crear empleado
        </button>`;
      document.getElementById("btnAtras").addEventListener("click", () => mostrarPaso(1));
      document.getElementById("btnCrearEmpleado").addEventListener("click", crearEmpleadoConHorarios);
    } else {
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>`;
    }
  }
}

// ─── PASO 1: DATOS ────────────────────────────────────────────────────────────

function aplicarImagenPreview(url) {
  if (!url) return;
  estado.imagenURL = url;
  document.getElementById("empPreview").src             = url;
  document.getElementById("empPreview").style.display   = "block";
  document.getElementById("empAvatarIcon").style.display = "none";
  document.getElementById("lblFoto").textContent        = "Cambiar archivo";
}

function initImagenUpload() {
  // Opción A: subir archivo → Cloudinary
  document.getElementById("empInputImagen")?.addEventListener("change", async function () {
    const archivo = this.files[0];
    if (!archivo) return;
    const formData = new FormData();
    formData.append("file", archivo);
    formData.append("upload_preset", "servicios_app");
    try {
      const res  = await fetch("https://api.cloudinary.com/v1_1/dxp3axcje/image/upload", { method: "POST", body: formData });
      const data = await res.json();
      document.getElementById("empImagenURL").value = data.secure_url;
      aplicarImagenPreview(data.secure_url);
    } catch (e) {
      console.error("Error subiendo imagen:", e);
      sfAlert("No se pudo subir la imagen. Prueba pegando la URL directamente.", "error");
    }
  });

  // Opción B: pegar URL directamente
  document.getElementById("empImagenURL")?.addEventListener("input", function () {
    const url = this.value.trim();
    if (url) aplicarImagenPreview(url);
  });
}

function initModalReset() {
  document.getElementById("modalEmpleado")?.addEventListener("hidden.bs.modal", () => {
    resetEstado();
    resetFormularioDatos();
  });
}

function validarFormularioDatos() {
  const nombre       = document.getElementById("empNombre").value.trim();
  const especialidad = document.getElementById("empEspecialidad").value.trim();
  const usuarioId    = document.getElementById("empUsuarioId")?.value ?? "skip";

  document.getElementById("errEmpNombre").textContent       = nombre       ? "" : "El nombre es obligatorio.";
  document.getElementById("errEmpEspecialidad").textContent  = especialidad ? "" : "La especialidad es obligatoria.";

  // Solo valida usuario en modo crear
  if (estado.modo === "crear") {
    const errU = document.getElementById("errEmpUsuarioId");
    if (errU) errU.textContent = usuarioId ? "" : "Selecciona un usuario del sistema.";
    if (!usuarioId) return false;
  }

  return !!(nombre && especialidad);
}

function validarYSeguir() {
  if (!validarFormularioDatos()) return;
  actualizarCabeceraPaso2(
    document.getElementById("empNombre").value.trim(),
    document.getElementById("empEspecialidad").value.trim(),
    estado.imagenURL
  );
  mostrarPaso(2);
}

async function irAPaso2Editar() {
  if (!validarFormularioDatos()) return;
  actualizarCabeceraPaso2(
    document.getElementById("empNombre").value.trim(),
    document.getElementById("empEspecialidad").value.trim(),
    estado.imagenURL
  );
  mostrarPaso(2);
  await cargarHorariosExistentes(estado.empleadoId);
}

async function guardarDatosEmpleado() {
  if (!validarFormularioDatos()) return;
  const payload = {
    nombre:       document.getElementById("empNombre").value.trim(),
    especialidad: document.getElementById("empEspecialidad").value.trim(),
    ...(estado.imagenURL ? { url: estado.imagenURL } : {}),
  };
  const btn = document.getElementById("btnGuardarDatos");
  btn.disabled = true; btn.textContent = "Guardando...";
  try {
    const res = await fetch(`${BASE_URL}/empleados/${estado.empleadoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
    upsertCacheEmpleado({
      id:          estado.empleadoId,
      nombre:      payload.nombre,
      especialidad: payload.especialidad,
      urlImagen:   estado.imagenURL || "",
    });
    bootstrap.Modal.getInstance(document.getElementById("modalEmpleado")).hide();
    cargarEmpleados();
    sfAlert("Empleado actualizado correctamente.", "success");
  } catch (err) {
    console.error(err); sfAlert(err.message || "Error al guardar.", "error");
  } finally {
    btn.disabled = false; btn.textContent = "Guardar datos";
  }
}

// ─── PASO 2: HORARIOS ─────────────────────────────────────────────────────────

function generarCheckboxesHoras() {
  const contenedor = document.getElementById("horasCheckboxes");
  if (!contenedor) return;
  contenedor.innerHTML = HORAS.map(h => `
    <label class="hora-checkbox">
      <input type="checkbox" class="hora-input" value="${h}"> ${h}
    </label>`).join("");
}

function initFechaMinima() {
  const input = document.getElementById("horarioFecha");
  if (input) input.min = new Date().toISOString().split("T")[0];
}

function actualizarCabeceraPaso2(nombre, especialidad, urlImagen) {
  document.getElementById("paso2Nombre").textContent       = nombre;
  document.getElementById("paso2Especialidad").textContent = especialidad;
  const avatar = document.getElementById("paso2Avatar");
  const ph     = document.getElementById("paso2AvatarPh");
  if (urlImagen) { avatar.src = urlImagen; avatar.style.display = "inline-block"; ph.style.display = "none"; }
  else           { avatar.style.display = "none"; ph.style.display = "flex"; }
}

// Reconecta el botón "Añadir al horario" según el modo actual
function rebindBtnAnadir() {
  const btn = document.getElementById("btnAnadirFecha");
  if (!btn) return;
  const nuevo = btn.cloneNode(true);
  btn.replaceWith(nuevo);
  nuevo.addEventListener("click", estado.modo === "crear" ? anadirFechaPendiente : anadirFechaAPI);
}

// ── Modo CREAR: gestión local de horarios pendientes ─────────────────────────

function anadirFechaPendiente() {
  const fecha = document.getElementById("horarioFecha").value;
  const horas = [...document.querySelectorAll(".hora-input:checked")].map(cb => cb.value);
  if (!fecha)        { sfAlert("Selecciona una fecha.", "warning"); return; }
  if (!horas.length) { sfAlert("Selecciona al menos una hora.", "warning"); return; }

  const prev  = estado.horariosPendientes[fecha] ?? [];
  estado.horariosPendientes[fecha] = [...new Set([...prev, ...horas])].sort();

  document.getElementById("horarioFecha").value = "";
  document.querySelectorAll(".hora-input").forEach(cb => (cb.checked = false));
  renderHorariosPendientes();
}

function renderHorariosPendientes() {
  const lista    = document.getElementById("listaHorarios");
  const entradas = Object.entries(estado.horariosPendientes).sort(([a], [b]) => a.localeCompare(b));

  if (!entradas.length) {
    lista.innerHTML = `
      <div class="horarios-vacio">
        <i class="fa-regular fa-calendar-xmark fa-2x mb-2"></i>
        <p class="mb-0 small">Aún no has agregado horarios.</p>
      </div>`;
    return;
  }

  lista.innerHTML = entradas.map(([fecha, horas]) => {
    const [a, m, d] = fecha.split("-");
    const slots = horas.map(h => `
      <span class="hora-badge">
        ${h}
        <button class="btn-quitar-hora" data-fecha="${fecha}" data-hora="${h}" title="Quitar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </span>`).join("");
    return `
      <div class="horario-fecha-grupo">
        <span class="fecha-label"><i class="fa-regular fa-calendar-day fa-xs me-1"></i>${d}/${m}/${a}</span>
        <div class="slots-wrap">${slots}</div>
      </div>`;
  }).join("");

  lista.querySelectorAll(".btn-quitar-hora").forEach(btn => {
    btn.addEventListener("click", () => {
      const { fecha, hora } = btn.dataset;
      estado.horariosPendientes[fecha] = estado.horariosPendientes[fecha].filter(h => h !== hora);
      if (!estado.horariosPendientes[fecha].length) delete estado.horariosPendientes[fecha];
      renderHorariosPendientes();
    });
  });
}

// ── Modo EDITAR / HORARIOS: llama directamente a la API ─────────────────────

async function cargarHorariosExistentes(empleadoId) {
  const lista = document.getElementById("listaHorarios");
  if (!lista) return;
  lista.innerHTML = `<p class="text-muted small">Cargando...</p>`;
  try {
    const res     = await fetch(`${BASE_URL}/horarios/agrupados`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error(`${res.status}`);
    const data    = await res.json();
    const arr     = Array.isArray(data) ? data : (data.data ?? []);
    const empData = arr.find(e => String(e.idEmpleado) === String(empleadoId));
    renderHorariosExistentes(empData?.fechas ?? {});
  } catch (err) {
    console.error(err);
    lista.innerHTML = `<p class="text-danger small">No se pudieron cargar los horarios.</p>`;
  }
}

function renderHorariosExistentes(fechas) {
  const lista    = document.getElementById("listaHorarios");
  const entradas = Object.entries(fechas).sort(([a], [b]) => a.localeCompare(b));

  if (!entradas.length) {
    lista.innerHTML = `
      <div class="horarios-vacio">
        <i class="fa-regular fa-calendar-xmark fa-2x mb-2"></i>
        <p class="mb-0 small">Sin horarios asignados aún.</p>
      </div>`;
    return;
  }

  lista.innerHTML = entradas.map(([fecha, horas]) => {
    const [a, m, d] = fecha.split("-");
    const slots = horas.map(h => `
      <span class="hora-badge">
        ${h}
        <button class="btn-quitar-hora" data-fecha="${fecha}" data-hora="${h}" title="Eliminar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </span>`).join("");
    return `
      <div class="horario-fecha-grupo">
        <span class="fecha-label"><i class="fa-regular fa-calendar-day fa-xs me-1"></i>${d}/${m}/${a}</span>
        <div class="slots-wrap">${slots}</div>
      </div>`;
  }).join("");

  lista.querySelectorAll(".btn-quitar-hora").forEach(btn => {
    btn.addEventListener("click", () => eliminarHorarioAPI(estado.empleadoId, btn.dataset.fecha, btn.dataset.hora));
  });
}

async function anadirFechaAPI() {
  const fecha = document.getElementById("horarioFecha").value;
  const horas = [...document.querySelectorAll(".hora-input:checked")].map(cb => cb.value);
  if (!fecha)        { sfAlert("Selecciona una fecha.", "warning"); return; }
  if (!horas.length) { sfAlert("Selecciona al menos una hora.", "warning"); return; }

  const btn = document.getElementById("btnAnadirFecha");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i>Guardando...`;

  let errores = 0;
  let primerError = "";
  for (const hora of horas) {
    try {
      const payload = { empleadoId: Number(estado.empleadoId), fechaHora: `${fecha}T${hora}:00` };
      const res = await fetch(`${BASE_URL}/horarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error(`POST /horarios ${hora} → ${res.status}`, payload, txt);
        if (!primerError) primerError = `${res.status}: ${txt}`;
        errores++;
      }
    } catch (err) { errores++; console.error(err); }
  }
  if (errores) {
    sfAlert(`${errores} hora(s) no pudieron guardarse. Error del servidor: ${primerError}`, "warning");
  }

  document.getElementById("horarioFecha").value = "";
  document.querySelectorAll(".hora-input").forEach(cb => (cb.checked = false));
  await cargarHorariosExistentes(estado.empleadoId);
  btn.disabled = false;
  btn.innerHTML = `<i class="fa-solid fa-plus me-1"></i>Añadir al horario`;
}

async function eliminarHorarioAPI(empleadoId, fecha, hora) {
  // El backend no tiene endpoint DELETE /horarios aún.
  sfAlert("El backend no soporta eliminar horarios individuales todavía.", "warning");
  return;
}

// ─── CREAR EMPLEADO + HORARIOS (modo crear, botón final en paso 2) ────────────

async function crearEmpleadoConHorarios() {
  const nombre       = document.getElementById("empNombre").value.trim();
  const especialidad = document.getElementById("empEspecialidad").value.trim();
  const btn = document.getElementById("btnCrearEmpleado");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i>Creando...`;

  try {
    // 1. Crear empleado en la API
    // "nombre" no es columna de empleados, viene del usuario vinculado
    const selectEl  = document.getElementById("empUsuarioId");
    const usuarioId = Number(selectEl?.value);
    const nombreParaCache = selectEl?.selectedOptions[0]?.text?.split("(")[0]?.trim() || nombre;

    const resEmp = await fetch(`${BASE_URL}/empleados`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        especialidad,
        estado: true,
        usuario_id: usuarioId,
        ...(estado.imagenURL ? { url: estado.imagenURL } : {}),
      }),
    });
    if (!resEmp.ok) {
      const e = await resEmp.json().catch(() => ({}));
      throw new Error(e.message || `Error al crear empleado (${resEmp.status})`);
    }
    const empCreado = await resEmp.json();
    const nuevoId   = empCreado.id ?? empCreado.data?.id ?? null;

    // 2. Guardar horarios pendientes
    if (nuevoId && Object.keys(estado.horariosPendientes).length) {
      for (const [fecha, horas] of Object.entries(estado.horariosPendientes)) {
        for (const hora of horas) {
          const r = await fetch(`${BASE_URL}/horarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ empleadoId: Number(nuevoId), fechaHora: `${fecha}T${hora}:00` }),
          });
          if (!r.ok) console.warn(`POST /horarios ${fecha} ${hora} → ${r.status}`);
        }
      }
    }

    upsertCacheEmpleado({
      id:           nuevoId,
      nombre:       nombreParaCache,
      especialidad,
      urlImagen:    estado.imagenURL || "",
    });

    bootstrap.Modal.getInstance(document.getElementById("modalEmpleado")).hide();
    cargarEmpleados();
    sfAlert("Empleado creado correctamente.", "success");
  } catch (err) {
    console.error(err); sfAlert(err.message || "Error al crear el empleado.", "error");
  } finally {
    btn.disabled  = false;
    btn.innerHTML = `<i class="fa-solid fa-user-plus me-1"></i>Crear empleado`;
  }
}

// ─── ELIMINAR EMPLEADO ────────────────────────────────────────────────────────

function initModalEliminar() {
  const btnConfirmar = document.getElementById("btnConfirmarEliminarEmp");
  if (!btnConfirmar) return;

  btnConfirmar.addEventListener("click", async () => {
    const { empleadoId, usuarioId } = _eliminando;

    if (!empleadoId) {
      sfAlert("No se pudo identificar el empleado a eliminar.", "error");
      return;
    }

    const token = getToken();
    if (!token) {
      sfAlert("Tu sesión ha expirado. Por favor inicia sesión de nuevo.", "warning");
      return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Eliminando...";

    try {
      // 1. Eliminar empleado
      const resEmp = await fetch(`${BASE_URL}/empleados/${empleadoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resEmp.ok) {
        const cuerpo = await resEmp.text().catch(() => "");
        throw new Error(`Error ${resEmp.status} al eliminar empleado${cuerpo ? ": " + cuerpo : ""}`);
      }

      // 2. Eliminar usuario asociado
      if (usuarioId) {
        const resUser = await fetch(`${BASE_URL}/usuarios/${usuarioId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resUser.ok) {
          const cuerpo = await resUser.text().catch(() => "");
          console.warn(`No se pudo eliminar el usuario ${usuarioId} (${resUser.status})${cuerpo ? ": " + cuerpo : ""}`);
        }
      }

      // 3. Persistir eliminación y actualizar UI
      addDeletedId(empleadoId);
      deleteCacheEmpleado(empleadoId);
      empleadosActuales = empleadosActuales.filter(e => String(e.id) !== String(empleadoId));
      bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEliminarEmp")).hide();
      renderTablaEmpleados(empleadosActuales);
      _eliminando = { empleadoId: null, usuarioId: null };

    } catch (err) {
      console.error("Error al eliminar:", err);
      sfAlert(err.message, "error");
    } finally {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "Eliminar";
    }
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function resetEstado() {
  estado = { modo: "crear", paso: 1, empleadoId: null, imagenURL: "", horariosPendientes: {} };
}

function resetFormularioDatos() {
  ["empEditId","empNombre","empEspecialidad","empInputImagen","empImagenURL","empUsuarioId"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  mostrarCampoUsuario(true);
  document.getElementById("empPreview").style.display    = "none";
  document.getElementById("empAvatarIcon").style.display = "";
  document.getElementById("lblFoto").textContent         = "Subir archivo";
  document.getElementById("tituloModalEmp").textContent  = "Nuevo Empleado";
  document.getElementById("errEmpNombre").textContent    = "";
  document.getElementById("errEmpEspecialidad").textContent = "";
}
