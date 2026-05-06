# 🏗️ Wapufy - Architecture Decision Record (ADR)

## Tech Stack Decisions

### Frontend: Next.js 14+ App Router

**Why?**
- SSR + Static generation (mejor SEO)
- API routes integradas
- Vercel deployment nativo
- Mejor performance (Image Optimization)
- Fast development con hot reload

**Alternatives considered:**
- React + Vite ❌ (sin SSR)
- Vue + Nuxt (✅ posible pero team conoce React)

### Backend: Node.js + Express

**Why?**
- Código compartido con frontend (TypeScript)
- Bajo learning curve
- Wapu API es REST (natural con Express)
- Fácil webhooks

**Alternatives considered:**
- Python + FastAPI ❌ (overkill para MVP)
- Go (✅ pero lenguaje nuevo para team)

### Database: Supabase (PostgreSQL)

**Why?**
- Free tier generoso
- PostgreSQL poder
- Real-time subscriptions
- Auth integrado (pero usamos NextAuth)
- Webhooks para Wapu sync
- SQL migrations fáciles

**Alternatives considered:**
- MongoDB ❌ (SQL mejor para e-commerce)
- Firebase 🚀 (lock-in, caro con transacciones)

### Auth: NextAuth.js

**Why?**
- OAuth con Wapu
- Session management
- JWT + database sessions
- Next.js first-class support

**Alternatives considered:**
- Auth0 (costo)
- Firebase Auth (lock-in)

### Payment: Wapu API + Webhooks

**Why?**
- Sponsor del hackaton
- Integración P2P nativa
- No PCI compliance (Wapu maneja)
- Webhook confirmación

**Flow:**
```
Frontend → Backend /orders/:id/pay → Wapu API
                                        ↓
                                   Redirige cliente
                                        ↓
                                   Cliente paga
                                        ↓
                                   Webhook confirmación
                                        ↓
                                   Backend marca orden
```

### Deployment

**Frontend**: Vercel (auto-deploy main)
**Backend**: Railway/Heroku (auto-deploy main)
**Database**: Supabase cloud (free tier)
**Webhooks**: Stable URL para Wapu

---

## Database Schema

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Stores
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  logo_url VARCHAR,
  colors JSONB DEFAULT '{"primary": "#000"}',
  wapu_account_id VARCHAR, -- De OAuth Wapu
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_email VARCHAR NOT NULL,
  customer_name VARCHAR NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, processing, completed, failed
  wapu_transaction_id VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Order Items
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL, -- Precio en momento compra
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes (Performance)
```sql
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_stores_user_id ON stores(user_id);
```

---

## API Architecture

### REST Conventions

```
GET    /api/resources      → List
POST   /api/resources      → Create
GET    /api/resources/:id  → Read
PUT    /api/resources/:id  → Update
DELETE /api/resources/:id  → Delete
```

### Error Handling

```typescript
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND",
  "status": 404
}
```

### Request/Response

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  status: number;
}
```

---

## Wapu Integration

### OAuth Flow (Auth)

```
1. Frontend: GET /api/auth/login → redirige a Wapu OAuth
2. Wapu: User autentica
3. Wapu: Redirige a /api/auth/wapu-callback?code=xxx
4. Backend: Intercambia code por access_token
5. Backend: Guarda token en user.wapu_token
6. Backend: Crea sesión
7. Frontend: Redirige a /dashboard
```

### Payment Flow (Orders)

```
1. Frontend: POST /api/orders/:id/pay
2. Backend: Llama Wapu API con amount
3. Wapu: Devuelve { transaction_id, redirect_url }
4. Frontend: Redirige cliente a redirect_url
5. Cliente: Paga en Wapu
6. Wapu: Redirige a /orders/:id/confirmation
7. Backend: Webhook POST /webhooks/wapu
8. Backend: Marca order como pagada
9. Frontend: Muestra confirmación
```

### Webhook Signature Verification

```typescript
// Wapu envía X-Signature header
// Backend valida:
const signature = req.headers['x-signature'];
const payload = req.body;
const hash = hmac_sha256(payload + WAPU_WEBHOOK_SECRET);
// Comparar hash === signature
```

---

## Frontend Structure

### Pages (App Router)

```
/                  → Landing (public)
/auth/login        → Login form
/auth/register     → Signup form
/dashboard         → Seller dashboard (auth required)
/dashboard/products → CRUD products
/dashboard/orders  → Ver órdenes
/@vendedor         → Tienda pública
/@vendedor/checkout → Checkout form
/@vendedor/orders/:id → Confirmación
```

### Components

```
/components
  /auth              → Auth forms
  /dashboard         → Dashboard widgets
  /store             → Store display
  /cart              → Shopping cart
  /checkout          → Checkout flow
  /common            → Shared (Header, Footer, etc)
```

### State Management

- **Server State**: SWR o React Query (fetch de API)
- **Client State**: useState (local forms)
- **Auth State**: NextAuth.js sessions

No Redux/Zustand (MVP simple)

---

## Timing & Milestones

| Hora | Tarea | Owner |
|------|-------|-------|
| 0-1 | Setup repos, DB, env | DevOps |
| 1-3 | Auth API + Wapu OAuth | Backend |
| 3-5 | Products + Orders API | Backend |
| 5-7 | Frontend pages + Forms | Frontend |
| 7-8 | Integración Wapu payment | Full-stack |
| 8-9 | Testing + Polishing | QA |
| 9-10 | Deploy + Demo | DevOps |

---

## Known Limitations (MVP)

- ❌ No multi-seller marketplace (solo 1 tienda per user)
- ❌ No analytics/reporting
- ❌ No email en hackaton (manual testing)
- ❌ No admin panel
- ❌ No product variations (size, color)
- ❌ No coupon codes
- ❌ No inventory management (básico stock counter)

**Post-hackaton ideas:**
- [ ] Marketplace (vender tiendas ajenas)
- [ ] Shipping integration
- [ ] Mercado Libre API
- [ ] Mobile app
- [ ] Reorder automático

---

## Security Considerations

### Autenticación
- ✅ NextAuth.js con credenciales hashadas (bcrypt)
- ✅ JWT + database sessions
- ✅ HTTPS en prod

### Autorización
- ✅ Middleware checkea user_id === store owner
- ✅ No acceso a órdenes de otro vendedor
- ✅ Webhook validación de Wapu

### Data Protection
- ✅ No guardar tarjetas (Wapu maneja)
- ✅ CORS configurado correctamente
- ✅ Rate limiting en endpoints sensibles
- ✅ SQL injection prevention (Supabase parameterized queries)

### Secrets
- ✅ Wapu API keys en .env (nunca expose)
- ✅ NextAuth secret fuerte
- ✅ HTTPS only cookies

---

## Monitoring & Logging

### Dev
- Console.log para debugging
- Network tab en browser DevTools
- Supabase dashboard para DB queries

### Prod (Post-hackaton)
- Sentry para error tracking
- Vercel analytics
- Database query monitoring
- Webhook failure logging

---

**Last Updated**: May 2026
**Version**: 0.1.0 (MVP)
**Status**: 🏗️ In Progress

