# Reservas — Sistema de reservas para complejos deportivos

Sistema **multi-tenant** de reservas de canchas (vóley y pádel) con panel de administración y app de cliente. Pensado para revenderse a otros negocios (ej. barberías) reutilizando el mismo modelo de datos y capas de código.

## Stack

| Capa      | Tecnología |
|-----------|------------|
| Backend   | Node.js + Express 5 |
| ORM / DB  | Prisma 6.19.3 + PostgreSQL |
| Auth      | JWT (`jsonwebtoken`) + `bcryptjs` |
| Frontend  | React 19 + Vite + React Router 7 |
| Estilos   | CSS con variables de diseño (sin framework), fuentes Bebas Neue + Inter |

## Estructura del repositorio

```
ProyectoReservas/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de datos
│   │   ├── migrations/         # Incluye el EXCLUDE constraint anti-solapamiento
│   │   └── seed.js             # Crea tenant, admin y horarios iniciales
│   └── src/
│       ├── config/             # Prisma client, timezone (UTC-5 Colombia)
│       ├── routes/             # Definición de endpoints
│       ├── controllers/        # Parseo de request / respuesta HTTP
│       ├── services/           # Lógica de negocio (una capa reutilizable)
│       ├── middlewares/        # Auth admin/cliente, manejo de errores
│       └── utils/               # Validaciones compartidas
└── frontend/
    └── src/
        ├── api/                 # Clientes HTTP hacia el backend
        ├── context/             # AuthContext admin y cliente (JWT en localStorage)
        ├── components/          # Componentes reutilizables (ilustraciones, banners)
        ├── pages/admin/         # Panel de administración
        └── pages/cliente/       # App de reservas del cliente
```

## Multi-tenancy

Todas las tablas de negocio (`Cancha`, `TipoCancha`, `Producto`, `Reserva`, `Cliente`, `UsuarioAdmin`, `HorarioOperacion`) tienen `tenant_id`. Actualmente el sistema opera con un único tenant sembrado por el seed, pero el modelo ya está preparado para múltiples negocios sobre la misma base de datos.

## No solapamiento de reservas (a nivel de base de datos)

Para evitar condiciones de carrera, la exclusividad de horarios por cancha **no se valida solo en la aplicación**: existe una restricción `EXCLUDE USING gist` (extensión `btree_gist`) sobre el rango `[inicio, fin)` de `Reserva`, agregada como SQL crudo en una migración de Prisma (`no_reservas_cruzadas`). Si dos requests concurrentes intentan reservar el mismo horario, PostgreSQL rechaza la segunda transacción y el backend la traduce a un `409`.

## Autenticación

- **Admin:** email + password (JWT de 8h). Sin auto-registro: los admins se crean por seed o manualmente. No hay ningún link ni botón en la interfaz de cliente que lleve al login de admin — se accede solo entrando directo a `/admin/login`, para mantener la interfaz pública 100% orientada al cliente.
- **Cliente:** login por OTP enviado a WhatsApp (JWT de 30 días). El teléfono debe tener **exactamente 10 dígitos**. Ver la sección de WhatsApp más abajo sobre el estado del envío real.

## WhatsApp (OTP, confirmación y recordatorios)

El flujo de cliente usa WhatsApp en tres momentos: envío del código OTP, confirmación al crear una reserva, y un recordatorio automático **20 minutos antes** de la hora reservada (además del aviso in-app a los 30 minutos, que sigue existiendo con su opción de cancelación gratuita).

Todo el envío pasa por un único punto: `backend/src/services/whatsappService.js`. Ese servicio intenta usar **Twilio WhatsApp Sandbox** (la única opción realmente gratuita para no depender de un negocio ya facturando) si encuentra las variables `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_WHATSAPP_FROM` en el `.env`.

**Estado actual: mockeado a consola.** Activar Twilio de verdad requiere crear una cuenta, y además su sandbox exige que cada número que vaya a recibir mensajes le mande primero un `join <palabra>` al número de Twilio para autorizarlo (y ese permiso vence cada 72h) — demasiada fricción para esta etapa del proyecto, que todavía no se vende ni se usa de forma recurrente. Por eso, mientras no haya credenciales configuradas, cada mensaje simplemente se imprime en la consola del backend con el prefijo `[WHATSAPP MOCK]` o `[OTP MOCK]`, y el resto del flujo (crear cliente, generar reserva, marcar el recordatorio como enviado) funciona exactamente igual que si el mensaje hubiera salido de verdad.

Cuando el proyecto se venda y valga la pena pagar un número de WhatsApp Business real (de Twilio o de otro proveedor), solo hace falta completar esas variables de entorno — no hay que tocar código en ningún otro lado.

El recordatorio de 20 minutos corre como un cron (`node-cron`, cada minuto) en `backend/src/jobs/recordatorioWhatsappJob.js`, y usa un campo `recordatorioEnviado` en `Reserva` para no enviar el mismo aviso dos veces.

## Funcionalidades principales

**Cliente**
- Registro/login unificado por teléfono + OTP (por WhatsApp).
- Grilla de disponibilidad por cancha, selección de una o varias horas consecutivas (drag-select).
- Agregar bebidas a la misma reserva, con descuento de inventario atómico.
- WhatsApp de confirmación al reservar, con cancha, horario y total.
- Recordatorio in-app 30 minutos antes (con cancelación gratuita) + recordatorio por WhatsApp 20 minutos antes.
- Listado de reservas propias, con cancelación (libera inventario y el horario).

**Administrador**
- Acceso separado de la interfaz de cliente: sin links visibles, solo por URL directa (`/admin/login`).
- CRUD de tipos de cancha, canchas y productos (bebidas), con imagen por URL.
- Panel de reservas con filtros por fecha, estado y rango de horas.
- Marcar reservas como pagadas/pendientes (bloqueado si la reserva está cancelada).
- Resumen del día: cantidad de reservas, pagadas y total cobrado.

## Requisitos previos

- Node.js 18+
- PostgreSQL con la extensión `btree_gist` disponible

## Puesta en marcha — Backend

```bash
cd backend
npm install
cp .env.example .env   # completar DATABASE_URL, JWT_SECRET, credenciales del admin
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Variables de entorno (`backend/.env`):

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `PORT` | Puerto del servidor (por defecto 3000) |
| `JWT_SECRET` | Secreto para firmar los JWT |
| `TENANT_NOMBRE` | Nombre del negocio sembrado por el seed |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del admin inicial |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | Opcionales. Sin configurar, el envío de WhatsApp queda mockeado a consola (ver sección WhatsApp) |

## Puesta en marcha — Frontend

```bash
cd frontend
npm install
cp .env.example .env   # o crear .env con VITE_API_URL
npm run dev
```

Variable de entorno (`frontend/.env`):

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base del backend (ej. `http://localhost:3000/api`) |

## Notas de diseño

- El manejo de zona horaria (Colombia, UTC-5, sin horario de verano) está resuelto en `backend/src/config/timezone.js` como una constante global temporal; si el sistema se revende a un negocio en otra zona horaria, debería pasar a ser un campo por `Tenant`.
- Identidad visual "Bloque de Cancha": verde `#39DC48` como color primario/CTA y lima `#D6FF00` como color de highlight/dato secundario, aplicada de forma consistente en Home, logins, app de cliente y panel de administración.
