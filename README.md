# 🛍️ Wapufy

**Wapufy** = Shopify + Wapu (Procesador de Pagos P2P)

Una plataforma eCommerce simplificada diseñada para el tercer hackaton de La Cripta, enfocada en integración sin fricciones con **Huapi** como procesador de pagos entre personas.

## 📋 Hackaton Info
- **Evento**: La Cripta Hackaton #3
- **Tema**: eCommerce
- **Patrocinador**: [Wapi](https://my.wapu.app/) - Procesador de pagos P2P Argentina
- **Objetivo**: Crear una plataforma de ventas rápida y con integración nativa de Wapu

## 🎯 Propuesta

Una alternativa **simple, rápida y moderna** a Shopify, pero especializada en:
- ✅ Integración directa con Wapu (sin middleman)
- ✅ Para vendedores latinoamericanos (especialmente Argentina)
- ✅ Setup en minutos, no en horas
- ✅ Comisiones competitivas
- ✅ Dashboard intuitivo para gestión de productos y pagos

## 🏗️ Estructura del Proyecto

```
04_Wapify/
├── README.md              # Este archivo
├── IDEA.md               # Plan detallado del hackaton
├── backend/              # API (Node.js/Express)
├── frontend/             # Web (React/Next.js)
├── docs/                 # Documentación
└── .env.example          # Variables de entorno
```

## 🚀 MVP Features (Hackaton)

### Fase 1: Productos & Checkout
- [ ] Crear/editar productos (nombre, precio, imagen, stock)
- [ ] Carrito de compras
- [ ] Checkout integrado con Huapi

### Fase 2: Ordenes & Pagos
- [ ] Página de órdenes recientes
- [ ] Confirmación de pagos via Huapi webhook
- [ ] Dashboard básico del vendedor

### Fase 3: Branding
- [ ] Personalización de tienda (colores, logo)
- [ ] URLs custom de tienda

## 🔧 Stack Técnico (Propuesta)

### Backend
- Node.js + Express
- PostgreSQL / Supabase
- Integración Huapi API

### Frontend
- Next.js 14+ (App Router)
- Tailwind CSS
- Vercel deployment

### Infraestructura
- GitHub para versionado
- Vercel para frontend
- Supabase para database (free tier)

## 🤝 Huapi Integration

```
[Cliente] → [Wapify Checkout] → [Huapi API] → [Banco]
                ↓
        [Webhook Confirmación]
                ↓
        [Actualizar BD + Email]
```

Flujo:
1. Cliente selecciona productos
2. Va a checkout
3. Inicia pago con Huapi (sin salir de Wapify)
4. Huapi procesa el pago P2P
5. Webhook confirma al vendedor

## 📅 Timeline (Hackaton)

| Fase | Tiempo | Objetivo |
|------|--------|----------|
| Setup & Auth | 1h | Repos, DB, credenciales Huapi |
| MVP Backend | 3h | API productos, órdenes, Huapi |
| MVP Frontend | 3h | Store, carrito, checkout |
| Integraciones | 2h | Webhooks, emails, UI |
| Testing & Deploy | 1h | Demo listo |

**Total**: ~10 horas de desarrollo intenso

## 🎮 Cómo Participar

```bash
# 1. Fork/Clone
git clone <repo>
cd 04_Wapify

# 2. Setup local
npm install
cp .env.example .env
# Agregar credenciales de Huapi

# 3. Desarrollo
npm run dev

# 4. Commit & PR
git add .
git commit -m "feat: descripción"
git push origin feature/tu-feature
```

## 🏆 Diferenciadores vs Shopify

| Feature | Shopify | Wapify |
|---------|---------|--------|
| Setup | 20+ min | < 5 min |
| Comisión | 2.2% + $0.30 | Transparente Huapi |
| Para LA | Global | 🎯 LATAM |
| Pagos P2P | No | ✅ Huapi nativo |
| Costo | $29/mes | Free + pagos |

## 📝 Notas para el Hackaton

- **Prioridad**: Pago con Huapi funcional (core)
- **Stretch**: Personalización de tienda
- **Nice-to-have**: Analytics básicos

## 🔗 Links Útiles

- [La Cripta Dev](https://lacrypta.dev/)
- [Documentación Huapi](https://docs.huapi.com.ar/)

---

**Creado**: Mayo 2026
**Status**: 🟢 En Development (Hackaton)
