# 💡 Plan Detallado: Wapify Hackaton #3

## El Problema

- **Shopify**: Caro ($29-299/mes), lento de setup, enfocado en mundo anglosajón
- **Mercado Libre/Tiendanube**: Generan comisiones altas
- **Huapi**: Excelente para pagos P2P pero sin tienda integrada
- **Niche**: Vendedores argentinos/LATAM necesitan: setup rápido + pagos baratos + local

## La Solución: Wapify

**"Shopify para LATAM con pagos Huapi"**

Plataforma eCommerce minimalista que:
1. Se setea en 5 minutos (conexión OAuth Huapi)
2. Cero comisiones de plataforma (solo pagas Huapi)
3. Pago integrado directo en la tienda
4. Dashboard intuitivo para vendedor
5. Optimizado para mobile (mayoría de compras en LATAM)

---

## 🎯 MVP Hackaton: 3 Flujos Core

### 1️⃣ FLUJO VENDEDOR

```
Vendedor Nuevo
    ↓
Crea Cuenta (email + contraseña)
    ↓
Autentica con Huapi (OAuth)
    ↓
Configura tienda (nombre, logo, colores)
    ↓
Agrega productos
    ↓
Tienda lista en: wapify.io/@sutienda
    ↓
Recibe notificación de compra
    ↓
Dashboard: Ver órdenes + reportes
```

**Impacto del hackaton**: Crear account + Huapi auth + Setup tienda

### 2️⃣ FLUJO CLIENTE

```
Cliente encuentra tienda
    ↓
Explora productos (fotos, descripción, precio)
    ↓
Agrega al carrito
    ↓
Checkout: nombre, email, cantidad
    ↓
Selecciona "Pagar con Huapi"
    ↓
Redirige a Huapi (confirma pago)
    ↓
Vuelve a Wapify (confirmación)
    ↓
Email de compra
```

**Impacto del hackaton**: Producto → Carrito → Checkout Huapi

### 3️⃣ FLUJO WEBHOOK

```
Huapi: Pago procesado
    ↓
Envía webhook a Wapify
    ↓
Wapify actualiza:
   - Marca orden como pagada
   - Resta stock
   - Envia email vendedor
   - Envia email cliente
    ↓
Vendedor ve en dashboard
```

**Impacto del hackaton**: Recibir y procesar confirmación de pago

---

## 🏗️ Arquitectura Técnica

### Backend API

```
POST   /api/auth/register          → Crear cuenta
POST   /api/auth/huapi-login       → OAuth Huapi
GET    /api/auth/me                → User actual

POST   /api/stores                 → Crear tienda
GET    /api/stores/:id             → Detalles tienda
PUT    /api/stores/:id             → Actualizar tienda

POST   /api/products               → Crear producto
GET    /api/products               → Listar productos
PUT    /api/products/:id           → Editar
DELETE /api/products/:id           → Eliminar

POST   /api/orders                 → Crear orden
GET    /api/orders                 → Mis órdenes
POST   /api/orders/:id/pay         → Iniciar pago Huapi
GET    /api/orders/:id             → Detalle orden

POST   /webhooks/huapi             → Webhook pago (público)
```

### Frontend Pages

```
/                    → Landing (info Wapify)
/login               → Login
/register            → Registro
/dashboard           → Panel vendedor
/dashboard/products  → Gestión productos
/dashboard/orders    → Órdenes
/dashboard/settings  → Config tienda

/@vendedor           → Tienda pública
/@vendedor/checkout  → Checkout (público)
```

### Database (Supabase)

```sql
-- Users
users (id, email, password_hash, created_at)

-- Stores
stores (id, user_id, name, slug, logo_url, colors, huapi_account_id)

-- Products
products (id, store_id, name, price, image_url, stock, created_at)

-- Orders
orders (id, store_id, customer_email, customer_name, total, status, huapi_transaction_id, created_at)

-- Order Items
order_items (id, order_id, product_id, quantity, price)
```

---

## 🚀 Roadmap Hackaton

### Hora 0-1: Setup
- [ ] Crear repos (backend + frontend)
- [ ] Configurar Supabase
- [ ] Credenciales Huapi
- [ ] CI/CD básico

### Hora 1-4: Backend API
- [ ] Auth (register, login, session)
- [ ] Crud de Products
- [ ] Crud de Orders
- [ ] Integración Huapi (iniciar pago)
- [ ] Webhook de confirmación

### Hora 4-7: Frontend
- [ ] Landing page
- [ ] Dashboard vendedor (products)
- [ ] Store pública (ver productos)
- [ ] Carrito simple
- [ ] Checkout & pago Huapi

### Hora 7-9: Polish
- [ ] Emails de confirmación
- [ ] Error handling
- [ ] Validaciones
- [ ] Mobile responsive

### Hora 9-10: Deploy
- [ ] Backend → Vercel/Railway
- [ ] Frontend → Vercel
- [ ] BD → Supabase
- [ ] Demo lista

---

## 🔗 Integración Huapi (Detalles)

### 1. OAuth Login

```javascript
// Frontend redirige a Huapi
window.location.href = `https://huapi.com.ar/oauth/authorize?
  client_id=${HUAPI_CLIENT_ID}
  &redirect_uri=${REDIRECT_URI}
  &scope=payments`;

// Backend recibe callback en /auth/huapi-callback
// Intercambia code por access_token
// Guarda en BD + crea sesión
```

### 2. Iniciar Pago

```javascript
// Cliente hace POST /api/orders/:id/pay
const response = await fetch('https://api.huapi.com.ar/v1/transactions/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${vendedor.huapi_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: order.total,
    description: `Orden #${order.id}`,
    customer_email: order.customer_email,
    metadata: { order_id: order.id }
  })
});

// Huapi devuelve { transaction_id, redirect_url }
// Redirige cliente a redirect_url (Huapi pago)
```

### 3. Webhook Confirmación

```javascript
// POST a https://wapify.io/webhooks/huapi
// Huapi envía:
{
  "event": "transaction.completed",
  "transaction_id": "txn_123",
  "status": "confirmed",
  "amount": 1500,
  "metadata": { "order_id": 456 }
}

// Backend:
1. Valida firma de Huapi
2. Busca orden por order_id
3. Marca como pagada
4. Actualiza stock
5. Envía emails
```

---

## 🎨 Diferenciadores de Diseño

### Para Vendedor
- **Onboarding**: 3 pasos (signup, Huapi, primer producto)
- **Dashboard**: Cards grandes, números destacados (ventas hoy, órdenes pendientes)
- **Productos**: Upload foto, precio, stock. Simple.
- **Órdenes**: Timeline visual de estados, botón "marcar enviado"

### Para Cliente
- **Tienda**: Grid limpio de productos, busca por nombre
- **Producto**: Foto grande, descripción, rating simple
- **Carrito**: Cantidades, total clara, botón "Pagar"
- **Checkout**: Form simple + botón "Pagar con Huapi"
- **Confirmación**: "Tu pago está procesándose, te enviaremos email"

---

## 📊 Success Metrics (para después del hackaton)

- [ ] 10+ tiendas creadas en hackaton
- [ ] 5+ transacciones completadas
- [ ] Tiempo de setup < 5 minutos
- [ ] Tasa de error en pagos < 2%
- [ ] NPS > 8/10

---

## 🔒 Security Checklist

- [ ] HTTPS en todo
- [ ] Validación de webhook Huapi (signature)
- [ ] Rate limiting en checkout
- [ ] Sanitización de inputs
- [ ] No guardar datos sensibles (tarjetas)
- [ ] CORS configurado
- [ ] Env variables (nunca hardcodear credenciales)

---

## 🎓 Aprendizajes Esperados

**Técnico:**
- Integración OAuth con API externa
- Webhooks y eventos
- Manejo de pagos (sin PCI compliance porque Huapi lo maneja)
- Full-stack rápido (backend + frontend)

**Negocio:**
- Problema LATAM real (eCommerce barato)
- Mercado de nicho (vendedores, Huapi integration)
- MVP viable en 10 horas

---

## 📝 Notas Finales

**Por qué Wapify puede ser el ganador:**

1. **Timing**: Huapi es nuevo, no hay integrados todavía → oportunidad
2. **Mercado**: Vendedores LATAM necesitan alternativa a Shopify
3. **Diferenciador**: Pago integrado directo (sin middleman)
4. **Scope**: Manejable para hackaton (no es Shopify full)
5. **Potencial**: Idea que podría monetizarse post-hackaton

**Next Steps Post-Hackaton:**
- Mejorar UI/UX
- Agregar analytics
- Soporte Mercado Libre API
- Móvil app nativa
- Marketplace (vender tiendas ajenas)

---

**Creado**: Hackaton #3 La Cripta
**Versión**: MVP
**Status**: 🟢 Ready to Build
