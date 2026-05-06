# 🤝 Guía de Contribución - Wapify Hackaton

¡Bienvenido al Wapify Hackaton #3! Esta guía te ayudará a configurar el desarrollo y contribuir rápidamente.

## ⚡ Quick Start

### Requisitos
- Node.js 18+
- Git
- Credenciales de Wapu (pídelas en #hackaton)

### Setup Local

```bash
# 1. Clone repo
git clone <repo-url>
cd 04_Wapify

# 2. Frontend Setup
cd frontend
npm install
cp .env.example .env.local
# Edita .env.local con credenciales

npm run dev
# Frontend en: http://localhost:3000

# 3. Backend Setup (otra terminal)
cd backend
npm install
cp .env.example .env.local
# Edita .env.local con credenciales

npm run dev
# Backend en: http://localhost:3001
```

## 📋 Tareas por Hacer (Hackaton)

### Backend (`/backend`)

- [ ] Setup Express + Supabase
- [ ] Auth endpoints (register, login, logout)
- [ ] Wapu OAuth flow
- [ ] CRUD Products
- [ ] CRUD Orders
- [ ] Pago con Wapu API
- [ ] Webhook de confirmación
- [ ] Email notifications

### Frontend (`/frontend`)

- [ ] Setup Next.js + Tailwind
- [ ] Landing page
- [ ] Auth pages (login/register)
- [ ] Dashboard layout
- [ ] Products CRUD UI
- [ ] Store public view
- [ ] Shopping cart
- [ ] Checkout form
- [ ] Order confirmation page

### Database (`/backend/db`)

- [ ] Schema SQL (users, stores, products, orders)
- [ ] Migrations Supabase
- [ ] Indexes para performance

## 🎯 Flujo de Contribución

### 1. Elige una Tarea
- Mira las tareas arriba
- Comenta en la tarea que la vas a tomar
- O crea una issue si ves algo faltante

### 2. Crea Branch
```bash
git checkout -b feature/tu-feature-nombre
```

### 3. Código
- Sigue el style guide abajo
- Haz commits pequeños y descriptivos
```bash
git add .
git commit -m "feat: descripción clara"
```

### 4. Push & PR
```bash
git push origin feature/tu-feature-nombre
```
- Abre un Pull Request
- Describe qué hiciste
- Pide review

### 5. Merge
- Espera feedback
- Haz cambios si se pide
- Admin mergea cuando está ok

## 📝 Estilo de Código

### Commits
```
feat:     Nueva feature
fix:      Bug fix
docs:     Documentación
style:    Formatting
refactor: Refactor sin cambio de funcionalidad
test:     Tests
chore:    Setup, deps, etc

Ejemplos:
- feat: agregar carrito de compras
- fix: validación de email en checkout
- docs: actualizar README con setup
```

### JavaScript/TypeScript
- Usa ESLint (npm run lint)
- Prettier para format (npm run format)
- Nombres descriptivos
- Comentarios para lógica compleja

```javascript
// ❌ Malo
const x = async () => {
  const d = await fetch('/api/p');
  return d.json();
};

// ✅ Bueno
const fetchProducts = async () => {
  const response = await fetch('/api/products');
  return response.json();
};
```

### React Components
- Functional components + Hooks
- Props bien tipadas (TypeScript)
- Nombres en PascalCase
- Componentes reutilizables

```javascript
// ✅ Bueno
interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
}) => {
  return (
    <div className="p-4 border rounded">
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p>${price}</p>
    </div>
  );
};
```

### API Endpoints
- REST principles
- Status codes correctos
- Error messages claros

```javascript
// ❌ Malo
app.get('/get-products', (req, res) => {
  try {
    // ...
  } catch (e) {
    res.send('error');
  }
});

// ✅ Bueno
app.get('/api/products', (req, res) => {
  try {
    // ...
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message,
    });
  }
});
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

Bonus: Escribe tests para nuevas features!

## 🔍 Before You Submit

- [ ] npm run lint (sin errores)
- [ ] npm run build (compila sin warnings)
- [ ] npm run test (tests pasan)
- [ ] Probaste locally
- [ ] Commit message es claro
- [ ] PR description explica cambios

## 🚀 Deploy

Al hacer merge a `main`:
- Frontend auto-deploy a Vercel
- Backend auto-deploy a Railway
- DB auto-migra con Supabase

## 📞 Help?

- Pregunta en el Discord de La Cripta
- Comenta en la issue
- DM a los admins

## 🏆 Leaderboard Commits

El primero en hacer PR vale extra puntos en el hackaton! 🎉

---

**Happy Coding! 💻**

Hacé que Wapify sea increíble! 🚀
