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

## 📓 Postmortem — Wapu vs Lightning + Nostr

> Esta sección es **honesta y técnica**. Documenta lo que aprendimos integrando Wapu vs Lightning + Nostr durante el hackaton. Es lo que más nos enseñó del proyecto y por eso queremos compartirlo con el jurado.

El propósito original del proyecto era **integrar Wapu como pasarela de pagos nativa**. Después de muchas horas tratando de hacer funcionar el flujo end-to-end con Wapu, terminamos invirtiendo más tiempo en pelear con su API que en construir features. Mientras tanto, el flujo paralelo de **Lightning + NIP-57 + login Nostr (NIP-07)** funcionó casi sin fricción, en menos de un día, y verifica pagos en **milisegundos**. Ese contraste fue la enseñanza más grande del hackaton.

### Lo que tomó tiempo integrando Wapu

| Bloqueo | Detalle técnico |
|---------|------------------|
| **No hay endpoint público de registro** | El spec OpenAPI no incluye `POST /users/register`. La cuenta hay que crearla manualmente desde `staging.wapu.app`, y verificar email manualmente. Sin onboarding programático, no hay forma de armar una demo "one-click" del flujo Wapu. |
| **El login passwordless del frontend confunde** | `staging.wapu.app/login` parece pedir email + password, pero al inspeccionar el bundle vimos que solo envía `{email}` y dispara un magic link. El password real nunca se setea desde la UI — el usuario cree que lo tiene cuando en realidad estaba usando email-only login. Eso generó horas de debug "Invalid password" hasta entender el modelo de auth. |
| **JWT con TTL de 15 minutos** | Los access tokens devueltos por `/users/login` traen un claim `exp` a +15 min sin endpoint claro de refresh accesible. Cualquier pausa mediana entre login y "Confirmar y pagar" rompe el flujo con "Invalid JWT token". Tuvimos que implementar pre-flight de expiry y bounce automático a login. |
| **Cuenta "pending" + `is_payer: false`** | Aún con cuenta creada, `state: "pending"`, `email_verified: false`, `is_payer: false` y `kyc_status: "Incomplete"`. No queda claro qué combinación habilita realmente al usuario a pagar. La API responde 400 "Sender does not have enough balance" sin diferenciar entre "saldo cero" y "cuenta no habilitada". |
| **No hay faucet de staging** | El entorno de staging existe pero no hay forma documentada de cargar saldo de prueba. Las direcciones de depósito en `/users/home` son blockchain reales (TRC20, Solana, etc.) — para probar el flow end-to-end había que mandar USDT real a staging. |
| **Mínimo de transferencia ≥ 0.01 USDT con conversión sats→USDT** | Vender un sticker a 5 sats (≈ $0.005 USDT) requiere redondear hacia arriba a 0.01 USDT, lo cual rompe el principio de "lo que pagás es lo que dice el QR". |
| **Errores genéricos** | Wapu devuelve 400 con mensajes como `"Invalid password"` para *cualquier* fallo de auth (sirva esa contraseña o el usuario no exista). Hace casi imposible para el cliente distinguir "credenciales mal" vs "usuario no registrado" sin canales adicionales. |
| **`inner_transfer` requiere multipart/form-data** | Para una API REST moderna, recibir el body como `multipart/form-data` en vez de JSON forzó FormData server-side y rompe la simetría con el resto de los endpoints que sí usan JSON. |
| **Restricción de KYC en montos chicos** | `spending_limit.available: 50` con `kyc_tier: 0` significa que aun con saldo, un usuario sin KYC no puede mandar más de 50 USDT por transacción. Para una tienda real con tickets de $20-100 USD, eso es ya un techo. |

**Conteo aproximado**: ~80% del tiempo de integración de pagos en este hackaton se fue en pelear con Wapu staging. Y el flow nunca llegó a confirmar un pago end-to-end durante el sprint.

### Lo que funcionó solo con Lightning + Nostr

En paralelo construimos un flow alternativo basado en **estándares abiertos**, y la diferencia fue dramática:

| Pieza | Estándar | Tiempo de integración | Resultado |
|-------|----------|------------------------|-----------|
| **Login del admin** | NIP-07 (`window.nostr`) | ~30 min | Login con tu npub, sin password, sin email, sin servidor de cuentas. Tu identidad es tu llave. |
| **Recibir pagos** | Lightning Address (LUD-16) | ~1 hora | El admin pone `tu@primal.net` en Settings, listo. Los sats van directo a su wallet. |
| **Resolver invoice** | LNURL-pay (LUD-06 + LUD-16) | ya estaba estándar | Cualquier wallet del mundo paga el QR. |
| **Verificar pago en ms** | NIP-57 (zap receipts) | ~2 horas | El servidor firma un kind:9734 efímero, lo manda en el callback de LNURL, la wallet del seller publica un kind:9735 en relays públicos, el browser lo escucha por WebSocket con filtro `#p:<seller>`. **Confirmación instantánea, sin polling, sin webhooks, sin cuenta en ningún servicio.** |
| **Identificar compradores sin KYC** | npub opcional + nombre opcional | ~1 hora | El comprador entra su nombre, o su npub, o ambos — el admin lo contacta por Nostr DM (NIP-04) para coordinar el retiro. |
| **Sin custodia, sin webhooks** | LUD-21 verify + NIP-57 | gratis | Wapufy nunca toca el dinero. Nunca tiene una base de usuarios. No hay nada que el admin tenga que confiarnos. |

**Tiempo total Lightning + Nostr**: ~6 horas de trabajo, funciona en producción ahora, verifica en <500ms.

### La lección — para nosotros y para el ecosistema

> **Open standards beat closed APIs in the hackathon timescale**, y probablemente en cualquier timescale.

- **Wapu** es una pasarela centralizada con valor real (rampa fiat ARS, P2P, BCRA), pero **no está diseñada como SDK** para que un tercero arme una tienda en horas. Es una app, no una primitiva.
- **Lightning + Nostr** son protocolos abiertos sin permiso. No hay onboarding. No hay JWTs que expiran. No hay KYC tier. No hay faucet que pedir. Un servidor habla con otro servidor y un browser escucha en un relay. Y todo se compone — la LN address y el NIP-57 y el NIP-07 fueron diseñados por personas distintas en años distintos y aún así encastran perfecto.

Para vendedores LATAM, **la combinación ideal no es "Wapu como pasarela" sino "Lightning para pagar + Wapu como off-ramp opcional cuando ya tengo sats y quiero ARS"**. Esa narrativa sí podría funcionar — pero requiere que Wapu publique un SDK pensado para integradores, no solo su app.

Mientras tanto, **Wapufy queda como un eCommerce nativo Lightning + Nostr**, con la integración Wapu como **camino "best-effort"** (login, transferencia interna USDT, polling, JWT refresh, conversión de monedas en vivo) que arranca cuando Wapu mejore su DX. El código está acá: `app/components/WapuPaymentPanel.tsx` y `app/api/wapu/*` — listo para activarse cuando deposites saldo, verifiques email y `is_payer` pase a `true`.

### TL;DR para el jurado

Probamos hacer lo que pedía el hackaton (integración nativa con Wapu) y aprendimos en el proceso que **el camino verdaderamente soberano y sin fricción para eCommerce LATAM ya existe y se llama Lightning + Nostr**. El proyecto entrega:

- ✅ Un eCommerce funcional end-to-end con login Nostr, pagos Lightning verificados por NIP-57 en milisegundos, y soporte para retiro sin KYC identificándose con npub.
- ✅ Una integración Wapu programada y lista (login + inner_transfer + polling + JWT refresh + ARS converter en vivo), bloqueada solo por la falta de fondos y `is_payer: false` en staging.
- ✅ Documentación honesta de la fricción real que un integrador encuentra hoy con Wapu, como input directo al sponsor para mejorar su DX.

---

**Creado**: Mayo 2026
**Status**: 🟢 Live en [wapify-seven.vercel.app](https://wapify-seven.vercel.app) · Lightning + Nostr funcionando · Wapu en standby por bloqueo de staging
