# 🛍️ Wapufy

**Wapufy** = Shopify + Wapu (Procesador de Pagos P2P Argentina)

Una plataforma eCommerce simplificada diseñada para el tercer hackaton de La Cripta, enfocada en integración sin fricciones con **Wapu** como procesador de pagos entre personas.

## 📋 Hackaton Info
- **Evento**: La Cripta Hackaton #3
- **Tema**: eCommerce
- **Patrocinador**: [Wapu](https://wapu.com.ar/) - Procesador de pagos P2P Argentina
- **Objetivo**: Crear una plataforma de ventas rápida y con integración nativa de Wapu

## 🎯 Propuesta

Un clon de los servicios y modelo operativo de Shopify, pero **rediseñado para integración total con Wapu** y autenticación nativa con Nostr:
- ✅ Integración end-to-end con Wapu (pagos P2P sin middleman)
- ✅ **Login con Nostr (NIP-07)**: tu identidad es tu npub, sin emails ni contraseñas
- ✅ Para vendedores latinoamericanos (especialmente Argentina)
- ✅ Setup en minutos, no en horas
- ✅ Comisiones competitivas (solo lo que cobra Wapu)
- ✅ Dashboard intuitivo para gestión de productos y pagos
- ✅ Stack Shopify-style (catálogo, carrito, checkout, órdenes, webhooks) pero soberano

## 🏗️ Estructura del Proyecto

```
04_Wapufy/
├── README.md              # Este archivo
├── IDEA.md               # Plan detallado del hackaton
├── backend/              # API (Node.js/Express)
├── frontend/             # Web (React/Next.js)
├── docs/                 # Documentación
└── .env.example          # Variables de entorno
```

## 🚀 MVP Features (Hackaton)

### Fase 0: Auth Nostr (NIP-07)
- [ ] Login con extensión NIP-07 (`window.nostr.getPublicKey()`)
- [ ] Sesión basada en npub + firma de challenge (NIP-42 style)
- [ ] Perfil del vendedor desde su kind:0 en relays públicos

### Fase 1: Productos & Checkout (Shopify-clone)
- [ ] Crear/editar productos (nombre, precio, imagen, stock)
- [ ] Carrito de compras
- [ ] Checkout integrado con Wapu

### Fase 2: Ordenes & Pagos
- [ ] Página de órdenes recientes
- [ ] Confirmación de pagos via Wapu webhook
- [ ] Dashboard básico del vendedor

### Fase 3: Branding
- [ ] Personalización de tienda (colores, logo)
- [ ] URLs custom de tienda

## 🔧 Stack Técnico (Propuesta)

### Backend
- Node.js + Express
- PostgreSQL / Supabase
- Integración Wapu API

### Frontend
- Next.js 14+ (App Router)
- Tailwind CSS
- Vercel deployment

### Infraestructura
- GitHub para versionado
- Vercel para frontend
- Supabase para database (free tier)

## 🤝 Wapu Integration

```
[Cliente] → [Wapufy Checkout] → [Wapu API] → [Banco]
                ↓
        [Webhook Confirmación]
                ↓
        [Actualizar BD + Email]
```

Flujo:
1. Cliente selecciona productos
2. Va a checkout
3. Inicia pago con Wapu (sin salir de Wapufy)
4. Wapu procesa el pago P2P
5. Webhook confirma al vendedor

## 📅 Timeline (Hackaton)

| Fase | Tiempo | Objetivo |
|------|--------|----------|
| Setup & Auth | 1h | Repos, DB, credenciales Wapu |
| MVP Backend | 3h | API productos, órdenes, Wapu |
| MVP Frontend | 3h | Store, carrito, checkout |
| Integraciones | 2h | Webhooks, emails, UI |
| Testing & Deploy | 1h | Demo listo |

**Total**: ~10 horas de desarrollo intenso

## 🎮 Cómo Participar

```bash
# 1. Fork/Clone
git clone <repo>
cd 04_Wapufy

# 2. Setup local
npm install
cp .env.example .env
# Agregar credenciales de Wapu

# 3. Desarrollo
npm run dev

# 4. Commit & PR
git add .
git commit -m "feat: descripción"
git push origin feature/tu-feature
```

## 🏆 Diferenciadores vs Shopify

| Feature | Shopify | Wapufy |
|---------|---------|--------|
| Setup | 20+ min | < 5 min |
| Comisión | 2.2% + $0.30 | Transparente Wapu |
| Para LA | Global | 🎯 LATAM |
| Pagos P2P | No | ✅ Wapu nativo |
| Costo | $29/mes | Free + pagos |

## 📝 Notas para el Hackaton

- **Prioridad**: Pago con Wapu funcional (core)
- **Stretch**: Personalización de tienda
- **Nice-to-have**: Analytics básicos

## 🔗 Links Útiles

- [La Cripta Dev](https://lacrypta.dev/)
- [Documentación Wapu](https://docs.wapu.com.ar/)

---

**Creado**: Mayo 2026
**Status**: 🟢 En Development (Hackaton)
