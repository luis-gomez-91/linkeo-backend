# Linkeo Backend

API backend para un SaaS tipo Linktree: páginas de enlaces, planes (Free, Emprendedor, Negocio, Pro), pagos con Stripe, usuarios y analítica de clics.

## Stack

- **NestJS** – API REST
- **Prisma** – ORM
- **PostgreSQL** – Base de datos
- **Stripe** – Pagos y suscripciones
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
- Cuenta Stripe (para pagos)

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con DATABASE_URL, JWT_SECRET y claves Stripe
```

## Base de datos

```bash
npx prisma migrate dev    # Crear tablas
npx prisma db seed        # Planes y temas por defecto
npx prisma studio         # UI para ver/editar datos
```

## Stripe

1. Crea productos y precios en [Stripe Dashboard](https://dashboard.stripe.com/products):
   - Plan Emprendedor: precio mensual y anual
   - Plan Negocio: precio mensual y anual
   - Plan Pro: precio mensual y anual

2. Copia los **Price ID** (ej. `price_xxx`) y actualízalos en la tabla `plans`:
   - `stripe_price_id_monthly`
   - `stripe_price_id_yearly`

3. Webhook para eventos de suscripción:
   - URL: `https://tu-dominio.com/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copia el **Signing secret** a `STRIPE_WEBHOOK_SECRET` en `.env`

## Ejecutar

```bash
npm run start:dev   # Desarrollo
npm run build && npm run start:prod   # Producción
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api/docs  

## Endpoints principales

- `POST /auth/register` – Registro
- `POST /auth/login` – Login (devuelve JWT)
- `GET /users/me` – Perfil (Bearer token)
- `GET /plans` – Listar planes
- `POST /stripe/create-checkout-session` – Crear sesión de pago (body: `planId`, `successUrl`, `cancelUrl`, `yearly?`)
- `POST /stripe/customer-portal` – URL para gestionar/cancelar suscripción
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
├── subscriptions/  # Suscripción del usuario + webhook Stripe
├── stripe/         # Checkout y portal de pago
├── pages/          # Páginas de links
├── links/          # Enlaces por página
├── themes/         # Temas de diseño
├── analytics/      # Clics y estadísticas
└── prisma/         # PrismaService
```

## Licencia

Privado / uso interno.
