# 🎨 Wapify Frontend

Next.js + React + Tailwind CSS

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Frontend corre en `http://localhost:3000`

## Estructura

```
frontend/
├── app/                # Next.js App Router
│   ├── page.tsx        # Landing
│   ├── auth/           # Login/Register
│   ├── dashboard/      # Vendedor
│   └── store/          # Tienda pública
├── components/         # React components
├── lib/                # Utils, types, API client
└── styles/             # CSS globals
```

## Scripts

- `npm run dev` - Dev server
- `npm run build` - Production build
- `npm run start` - Run production
- `npm run lint` - ESLint
- `npm run format` - Prettier

## Environment

Ver `.env.example` para variables requeridas:
- NEXT_PUBLIC_API_URL
- WAPU_CLIENT_ID
- NEXTAUTH_URL (auth config)

## TODO (Hackaton)

- [ ] Landing page
- [ ] Auth (login/register)
- [ ] Dashboard layout
- [ ] Products CRUD
- [ ] Shopping cart
- [ ] Checkout with Wapu
- [ ] Order confirmation

---

**Hecho con ❤️ en La Cripta Hackaton**
