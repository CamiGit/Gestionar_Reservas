# 💈 Style Factory – Frontend

Interfaz web de **Style Factory**, salón de belleza y bienestar. El cliente conoce los servicios, se registra, inicia sesión, agenda citas y —con el rol adecuado— accede al panel de administración.

Proyecto de **TimelyApp – Style Factory M**. Sitio construido con **HTML, CSS y JavaScript** puro: los componentes reutilizables (navbar, footer, formularios) se cargan con `fetch` y la autenticación se delega al API REST del backend.

## 🚀 Tecnologías

- **HTML5** + **CSS3**
- **Bootstrap 5.3.8** (layout responsive)
- **JavaScript** (ES6+, módulos ES en catálogo y panel admin)
- **Google Fonts** — Montserrat, Playfair Display
- **Font Awesome 6** (iconos)
- **Google Maps** (página de contacto)
- **Formspree** (formulario de contacto)
- **JWT** — sesión vía API (`Backend_Style_Factory`)

## 🌐 Enlaces del proyecto

| Recurso | URL |
|---------|-----|
| **Repositorio frontend** | https://github.com/marcelaW40k/Gestionar_Reservas |
| **API (Render)** | https://backend-style-factory.onrender.com |
| **Swagger (backend)** | https://backend-style-factory.onrender.com/swagger-ui/index.html |

## 📁 Estructura del proyecto

```
Gestionar_Reservas/
├── index.html                      # Página de inicio
├── assets/
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── config.js               # BASE_URL del backend
│       ├── formValidaciones.js     # Validaciones compartidas
│       ├── productosCatalogo.js    # Catálogo por defecto (10 servicios)
│       └── main.js                 # Home: navbar, sesión, secciones dinámicas
├── components/
│   ├── navbar/                     # Barra de navegación
│   ├── footer/
│   ├── navbarAdmin/                # Sidebar del panel admin
│   ├── bannerInicio/
│   ├── infoIndex/
│   ├── ServiciosDestacados/
│   ├── review/
│   ├── maps/                       # Mapa de sedes (contacto)
│   ├── confirmacionServicio/       # Resumen y confirmación de cita
│   ├── metricas/                   # Vista del panel admin
│   └── forms/
│       ├── loginUsuario/           # Login (iframe en pages/login)
│       ├── registroUsuario/        # Registro (iframe en pages/registro)
│       ├── contacto/
│       ├── reserva/
│       ├── creacionServicios/      # Alta de servicios (admin)
│       ├── passwordToggle.js       # Mostrar/ocultar contraseña
│       └── passwordToggle.css
└── pages/
    ├── login/
    ├── registro/
    ├── contact/
    ├── catalogoServicios/
    ├── aboutUs/
    ├── reservations/               # Flujo de reserva con calendario
    ├── misReservas/                # Espacio personal del cliente
    ├── services/                   # Página auxiliar (legado)
    └── admin/
        ├── panelDeControl/         # Panel principal
        ├── listaServicios/
        ├── listaReservas/
        └── reservarServicios/
```

## 🗺️ Mapa del sitio

| Sección | Ruta | Descripción |
|---------|------|-------------|
| Inicio | `/index.html` | Banner, información, servicios destacados y reseñas |
| Servicios | `/pages/catalogoServicios/` | Catálogo completo con badges de tipo y duración |
| Nosotros | `/pages/aboutUs/` | Historia y propuesta del salón |
| Contacto | `/pages/contact/` | Formulario + mapa de ubicaciones |
| Login | `/pages/login/` | Inicio de sesión |
| Registro | `/pages/registro/` | Alta de clientes |
| Reservas | `/pages/reservations/` | Selección de estilista, fecha, hora y confirmación |
| Mis reservas | `/pages/misReservas/` | Citas del cliente autenticado |
| Admin | `/pages/admin/panelDeControl/` | Panel de control (métricas, servicios, reservas) |

## 🔐 Sesión y autenticación

### Almacenamiento de sesión

Tras un login exitoso se guarda un único objeto en `localStorage`:

```javascript
// clave: usuarioLogueado
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": null,
  "correo": "cliente@correo.com",
  "nombre": "María López",
  "rol": "cliente",
  "fechaLogin": "2026-05-30T12:00:00.000Z"
}
```

El token JWT viaja dentro de `usuarioLogueado.token` en las peticiones que lo requieran (`Authorization: Bearer ...`).

### Flujo de login

1. El usuario completa el formulario en `components/forms/loginUsuario/` (embebido en un **iframe** dentro de `pages/login/`).
2. El frontend envía `POST {BASE_URL}/auth/login` con `correo` y `contrasena`.
3. Si el API responde correctamente, se persiste `usuarioLogueado` en `localStorage`.
4. Redirección según rol:
   - **Cliente** → `/pages/misReservas/misReservas.html`
   - **Admin** → `/pages/admin/panelDeControl/panelControl.html`
5. El navbar ejecuta `actualizarNavbar()` y muestra **«Hola, {nombre}»**, el enlace **Mis reservas** y **Cerrar sesión**.

### Flujo de registro

Validación en cliente → `POST /auth/register` con rol `CLIENTE` → mensaje de éxito → redirección a `/pages/login/login.html?registro=exito`.

### Navbar según sesión

| Estado | Elementos visibles |
|--------|-------------------|
| Sin sesión | Botón **Iniciar sesión** |
| Cliente logueado | Saludo, **Mis reservas**, **Cerrar sesión** |
| Admin logueado | Saludo, **Mis reservas**, **Administrador**, **Cerrar sesión** |

### Diagrama (login)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Formulario login
    participant API as API Render
    participant LS as localStorage
    participant P as Mis reservas

    U->>F: Correo + contraseña
    F->>F: Validación (email, campos)
    F->>API: POST /auth/login
    API-->>F: token, nombre, rol
    F->>LS: Guardar usuarioLogueado
    F->>P: Redirigir (cliente) o panel admin
    P->>P: actualizarNavbar() → Hola, nombre + Mis reservas
```

## ✅ Validaciones de formularios

Centralizadas en `assets/js/formValidaciones.js`:

| Campo | Regla |
|-------|--------|
| Nombre | Solo letras; aviso en tiempo real si hay números |
| Correo | Obligatorio + formato válido |
| Teléfono | Solo dígitos y separadores (`+`, `-`, espacios, paréntesis); sin letras |
| Contraseña | Mín. 8 caracteres, mayúscula, minúscula, número y símbolo |
| Confirmación | Debe coincidir con la contraseña |

Login, registro y contacto usan **`novalidate`** para mostrar errores en español (evita tooltips nativos ocultos dentro del iframe).

**Contraseña visible:** `passwordToggle.js` + icono de ojo en login y registro.

**Correo duplicado:** el registro detecta la respuesta `400` del backend y muestra el error junto al campo de correo.

## ⚙️ Configuración (`assets/js/config.js`)

```javascript
const BASE_URL = "https://backend-style-factory.onrender.com";
```

Para desarrollo contra API local, cambia `BASE_URL` (por ejemplo `http://localhost:8080`) y verifica que el backend tenga CORS habilitado.

## 🛠️ Desarrollo local

### Requisitos

- Navegador reciente (Chrome, Firefox, Edge)
- Servidor estático (**Live Server**, `npx serve .`, etc.)

> **Importante:** no abras los `.html` con doble clic (`file://`). Las peticiones al API y la carga de componentes con `fetch` fallan o se bloquean por CORS.

### Pasos

```bash
git clone https://github.com/marcelaW40k/Gestionar_Reservas.git
cd Gestionar_Reservas
```

Abre la carpeta **`Gestionar_Reservas`** como raíz del servidor. URL típica con Live Server:

`http://127.0.0.1:5500/index.html`

### Rutas de componentes

El proyecto mezcla rutas **absolutas** (`/components/...`) y **relativas** (`../../components/...`) según la página. La raíz del servidor debe ser la carpeta del repositorio (donde está `index.html`) para que ambas convivan correctamente.

Páginas con rutas relativas ya corregidas: **login**, **registro**, **contacto**, **catálogo** y **mis reservas**.

## 🔗 Integración con el backend

| Acción | Endpoint | Estado en frontend |
|--------|----------|-------------------|
| Registro | `POST /auth/register` | Conectado |
| Login | `POST /auth/login` | Conectado |
| Mis reservas | `GET /reservas/mis-reservas` | Frontend listo; **pendiente en backend** |
| Crear servicio (admin) | `POST /servicios` | Parcial (`formCreacionServicios.js`) |
| Catálogo público | `GET /servicios` | Disponible en API; catálogo usa `localStorage` + `productosCatalogo.js` |
| Crear reserva | `POST /reservas` | Flujo visual completo; confirmación guarda en `localStorage` |

### Peticiones autenticadas

```http
GET /reservas/mis-reservas HTTP/1.1
Host: backend-style-factory.onrender.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

### Cuerpos JSON usados

**Registro:**

```json
{
  "nombre": "María López",
  "correo": "maria@correo.com",
  "telefono": "3001234567",
  "contrasena": "MiClave123",
  "rol": "CLIENTE"
}
```

**Login:**

```json
{
  "correo": "maria@correo.com",
  "contrasena": "MiClave123"
}
```

En Render (plan gratuito) la primera petición tras inactividad puede tardar ~1 minuto.

### Si aparece error de conexión

- Sirve el sitio con `http://localhost`, no con `file://`
- Comprueba que el servicio en Render esté activo
- Verifica que `BASE_URL` en `config.js` apunte al entorno correcto

## 💾 Datos en `localStorage`

| Clave | Uso |
|-------|-----|
| `usuarioLogueado` | Sesión activa (token, nombre, rol) |
| `Lista de Servicios` | Catálogo y panel admin (mezcla con datos por defecto) |
| `servicioSeleccionado` | Servicio elegido antes de reservar |
| `reservas` | Reservas confirmadas en el flujo de citas (cliente) |
| `usuarios` | Semilla local de admin en `main.js` (legado de desarrollo) |

## 📄 Páginas principales

### Inicio (`index.html`)

Carga dinámica de banner, información, servicios destacados, reseñas, navbar y footer mediante `assets/js/main.js`.

### Catálogo (`pages/catalogoServicios/`)

Grid de servicios con imagen, precio, tipo y duración. Los datos provienen de `productosCatalogo.js` enriquecidos con `localStorage`. Al pulsar **Reservar**, guarda `servicioSeleccionado` y navega al flujo de reservas.

### Reservas (`pages/reservations/`)

Calendario interactivo, selección de estilista y horario, componente de confirmación. Al confirmar, la reserva se almacena en `localStorage` (`reservas`) — **aún no llama a `POST /reservas`**.

### Mis reservas (`pages/misReservas/`)

Espacio personal del cliente tras el login. Requiere sesión activa; consulta `GET /reservas/mis-reservas` con el token JWT. Muestra tabla con servicio, estilista, fecha, hora y estado.

### Contacto (`pages/contact/`)

Formulario validado enviado a **Formspree** (no pasa por el API de Style Factory). Incluye mapa de sedes cargado desde `components/maps/`.

### Panel admin (`pages/admin/`)

- **Métricas:** vista de resumen
- **Lista de servicios:** tabla desde `localStorage`; formulario de creación puede enviar `POST /servicios` al backend
- **Lista de reservas:** lectura desde `localStorage` (`reservas`)

## 📌 Notas importantes

- Los formularios de **login** y **registro** viven en **iframes** dentro de sus páginas contenedoras.
- El **contacto** usa Formspree; no depende del backend Java.
- Parte del **catálogo**, el **flujo de reservas** y el **admin** aún operan con `localStorage` mientras avanza la integración total con el API.
- La sesión (`usuarioLogueado`) sí depende del backend para login y registro.
- El backend devuelve roles en mayúsculas (`CLIENTE`, `ADMIN`); el frontend los normaliza a minúsculas para comparaciones internas.

## ✅ Estado del frontend

| Funcionalidad | Estado |
|---------------|--------|
| Home, nosotros, contacto | Operativo |
| Catálogo renovado con tipo y duración | Operativo |
| Login y registro conectados al API | Operativo |
| Validaciones en tiempo real | Operativo |
| Toggle mostrar/ocultar contraseña | Operativo |
| Navbar con sesión, Mis reservas y admin | Operativo |
| Redirección post-login a Mis reservas (cliente) | Operativo |
| Página Mis reservas (UI + llamada API) | Operativo en UI; depende del endpoint backend |
| Flujo de reserva con calendario | Operativo (datos locales) |
| Panel admin (servicios y reservas) | Operativo (datos locales + POST servicios parcial) |
| Integración completa reservas → API | Pendiente |
| Catálogo consumiendo `GET /servicios` | Pendiente |

### Próximos pasos de integración

1. Implementar en backend `GET /reservas/mis-reservas` para la página del cliente.
2. Conectar la confirmación de reserva con `POST /reservas`.
3. Sincronizar catálogo y panel admin con `GET /servicios` y el resto de endpoints CRUD.
4. Unificar rutas absolutas/relativas si el equipo despliega en un subdirectorio.

---

*Style Factory — Cortes que inspiran.*  
Proyecto **Generation Colombia · TimelyApp**. Frontend en [Gestionar_Reservas](https://github.com/marcelaW40k/Gestionar_Reservas); API en **Backend_Style_Factory**.
