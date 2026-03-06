# Linkeo Backend

API backend para un SaaS tipo Linktree: páginas de enlaces, planes (Free, Emprendedor, Negocio, Pro), pagos con Nuvei/Paymentez (Ecuador), usuarios y analítica de clics.

## Stack

- **NestJS** – API REST
- **Prisma** – ORM
- **PostgreSQL** – Base de datos
- **Nuvei / Paymentez** – Pagos (init_reference → checkout hospedado)
- **JWT** – Autenticación
- **Swagger** – Documentación en `/api/docs`

## Planes

| Plan          | Precio  | Incluye |
|---------------|---------|---------|
| **Gratis**    | $0      | 1 página, 5 enlaces, 3 temas, QR, estadísticas básicas |
| **Emprendedor** | $4/mes ($36/año) | Enlaces ilimitados, 20 temas, WhatsApp, estadísticas completas, programar enlaces |
| **Negocio**  | $9/mes ($99/año) | Dominio propio, integraciones redes, botón de pago, leads, pixels, analítica avanzada |
| **Pro**       | $19/mes ($199/año) | 10 páginas, clientes, A/B testing, múltiples admins, soporte prioritario |

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Cuenta Nuvei/Paymentez (credenciales servidor para Ecuador)

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con DATABASE_URL, JWT_SECRET y PAYMENTEZ_SERVER_* 
```

## Base de datos

```bash
npx prisma migrate dev    # Crear/actualizar tablas (incluye pending_payments para pagos)
npx prisma db seed        # Planes y temas por defecto
npx prisma studio         # UI para ver/editar datos
```

## Nuvei / Paymentez

1. Configura en `.env`:
   - `PAYMENTEZ_SERVER_APPLICATION_CODE` – código de aplicación servidor (ej. TESTECUADORSTG-EC-SERVER en staging)
   - `PAYMENTEZ_SERVER_APP_KEY` – clave servidor (nunca en el front)
   - `PAYMENTEZ_ENV` – `stg` o `prod`

2. Flujo de pago:
   - El front llama `POST /payments/init-reference` con `planId` y opcionalmente `yearly`.
   - La API devuelve `checkout_url`, `reference` y `dev_reference`. Redirige al usuario a `checkout_url` para pagar.
   - **Webhook**: configura en Paymentez la URL `https://tu-dominio.com/payments/webhook`. Al confirmar el pago, Paymentez envía un POST y el backend activa el plan automáticamente.
   - **Confirm (opcional)**: cuando el usuario vuelve a tu app, el front puede llamar `POST /payments/confirm` con body `{ "dev_reference": "..." }` para obtener el estado (pending | completed | failed).

## Ejecutar

```bash
npm run start:dev   # Desarrollo
npm run build && npm run start:prod   # Producción
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api/docs  

## Autenticación (Auth.js + JWT propio)

- **Auth.js** (recomendado): en el front (p. ej. Next.js), inicia sesión con Auth.js (correo, Google, Apple, Facebook, etc.) y obtén el JWT con `getToken()`. Envía `POST /auth/session` con body `{ "access_token": "<jwt>" }`. El backend decodifica el JWT con el mismo `AUTH_SECRET`, crea o actualiza el usuario y devuelve un **JWT propio** para la API.
- `POST /auth/register` – Registro con email y contraseña (legacy).
- `POST /auth/login` – Login con email y contraseña (legacy).

Configura `AUTH_SECRET` en `.env` con el **mismo valor** que en tu app Auth.js (mín. 32 caracteres).

## Endpoints principales

- `POST /auth/session` – Sesión con Auth.js (body: `access_token` = JWT de Auth.js; respuesta: `user` + `access_token` para la API)
- `POST /auth/register` – Registro con contraseña
- `POST /auth/login` – Login con contraseña
- `GET /users/me` – Perfil (Bearer token)
- `GET /plans` – Listar planes
- `POST /payments/init-reference` – Iniciar pago (body: `planId`, `yearly?`). Devuelve `checkout_url`, `reference`, `dev_reference`.
- `POST /payments/confirm` – Estado del pago (body: `dev_reference`). Requiere JWT. Devuelve `status`: pending | completed | failed.
- `POST /payments/webhook` – Webhook de Paymentez (sin JWT). Activa el plan cuando el pago es exitoso.
- `GET /subscriptions/me` – Mi suscripción
- `GET /pages`, `POST /pages` – CRUD páginas de links
- `GET /pages/public/:slug` – Página pública por slug
- `GET/POST/PUT/DELETE /pages/:pageId/links` – CRUD enlaces
- `POST /analytics/links/:linkId/click` – Registrar clic
- `GET /analytics/pages/:pageId/stats` – Estadísticas de una página
- `GET /themes` – Temas disponibles

## Estructura

```
src/
├── auth/           # Registro, login, JWT
├── users/          # Perfil
├── plans/          # Planes públicos
├── subscriptions/  # Suscripción del usuario
├── paymentez/      # Pagos Nuvei/Paymentez (init_reference)
├── pages/          # Páginas de links
├── links/          # Enlaces por página
├── themes/         # Temas de diseño
├── analytics/      # Clics y estadísticas
└── prisma/         # PrismaService
```

## Licencia

Privado / uso interno.
