# 🔧 Wapufy Backend

Node.js + Express + Supabase + Wapu API

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Backend corre en `http://localhost:3001`

## Estructura

```
backend/
├── src/
│   ├── routes/         # API endpoints
│   ├── controllers/     # Lógica de negocio
│   ├── models/         # DB models/queries
│   ├── middleware/      # Auth, error handling
│   ├── utils/          # Helpers, validators
│   └── app.ts          # Express app config
├── db/                 # SQL migrations
└── index.ts            # Entry point
```

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/wapu-callback
GET  /api/auth/me
```

### Products
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

### Orders
```
GET  /api/orders
POST /api/orders
GET  /api/orders/:id
POST /api/orders/:id/pay
```

### Webhooks (Público)
```
POST /webhooks/wapu
```

## Scripts

- `npm run dev` - Dev server
- `npm run build` - Compile TypeScript
- `npm run start` - Run production
- `npm run test` - Tests
- `npm run lint` - ESLint
- `npm run format` - Prettier
- `npm run db:migrate` - Supabase migrations

## Environment

Ver `.env.example`:
- DATABASE_URL
- WAPU_CLIENT_ID
- WAPU_API_KEY
- WAPU_WEBHOOK_SECRET
- NEXTAUTH_SECRET

## TODO (Hackaton)

- [ ] Express setup + Supabase
- [ ] Auth endpoints
- [ ] Wapu OAuth integration
- [ ] Products CRUD
- [ ] Orders CRUD
- [ ] Payment flow with Wapu
- [ ] Webhook handler
- [ ] Email notifications

## Wapu Integration

- OAuth callback: `/api/auth/wapu-callback`
- Start payment: POST `/api/orders/:id/pay`
- Webhook: POST `/webhooks/wapu` (público)

Credenciales necesarias:
```
WAPU_CLIENT_ID=xxx
WAPU_CLIENT_SECRET=xxx
WAPU_API_KEY=xxx
WAPU_WEBHOOK_SECRET=xxx
```

---

**Hecho con ❤️ en La Cripta Hackaton**
