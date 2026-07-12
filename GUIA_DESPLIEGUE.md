# Campus Connect — Guía Técnica de Despliegue

> Esta guía explica paso a paso cómo poner Campus Connect en producción: dominio, hosting, base de datos, autenticación y pasarela de pagos. Estructura pensada para estudiantes en Ecuador, con costos reales y alternativas gratuitas donde sea posible.

---

## Tabla de contenido
1. [Arquitectura general](#1-arquitectura-general)
2. [Stack tecnológico recomendado](#2-stack-tecnológico-recomendado)
3. [Despliegue del frontend](#3-despliegue-del-frontend-vercel--gratis)
4. [Compra del dominio](#4-compra-del-dominio)
5. [Base de datos con Supabase](#5-base-de-datos-con-supabase-gratis-hasta-500-mb)
6. [Conectar el frontend a la base de datos](#6-conectar-el-frontend-a-la-base-de-datos)
7. [Autenticación de usuarios](#7-autenticación-de-usuarios-supabase-auth)
8. [Pasarela de pagos](#8-pasarela-de-pagos)
9. [Costos estimados](#9-costos-estimados-mensuales)
10. [Roadmap operativo](#10-roadmap-operativo-para-estar-100-operativo)

---

## 1. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                   USUARIOS (estudiantes)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (HTML/CSS/JS)                                     │
│  Hosting: Vercel · Dominio: campusconnect.ec                │
└──────┬────────────────────────────────────┬─────────────────┘
       │                                    │
       │ API calls                          │ Payment
       ▼                                    ▼
┌──────────────────────┐         ┌──────────────────────────┐
│  SUPABASE            │         │  PASARELA DE PAGOS       │
│  · PostgreSQL DB     │         │  · PayPhone (Ecuador)    │
│  · Auth (login)      │         │  · PayPal (global)       │
│  · Storage (imgs)    │         │  · Stripe (alternativa)  │
└──────────────────────┘         └──────────────────────────┘
```

**Resumen del flujo:** el frontend (las páginas HTML que ya tienes) se aloja en **Vercel**, se conecta a **Supabase** para guardar productos, usuarios y mensajes, y cuando un comprador paga se redirige a **PayPhone** o **PayPal** para procesar la transacción.

---

## 2. Stack tecnológico recomendado

| Capa | Herramienta | ¿Por qué? | Costo |
|------|-------------|-----------|-------|
| Frontend | HTML + CSS + JS (entregado) | Sin build, despliega en minutos | $0 |
| Hosting | **Vercel** o **Netlify** | Gratis, HTTPS automático, despliegue desde GitHub | $0 |
| Base de datos | **Supabase** (PostgreSQL) | Gratis hasta 500 MB, API automática, fácil de usar | $0 hasta crecer |
| Autenticación | **Supabase Auth** | Login con email + Google + verificación institucional | $0 |
| Almacenamiento de imágenes | **Supabase Storage** o **Cloudinary** | Hasta 1 GB gratis | $0 |
| Pasarela de pagos | **PayPhone** (Ecuador) + **PayPal** | PayPhone funciona local en USD; PayPal para extranjeros | Comisión 3.5–5% por venta |
| Dominio | **Namecheap** o **GoDaddy** | `.com` desde $10/año, `.ec` desde $35/año | $10–35/año |
| Email transaccional | **Resend** o **Brevo** | Envío de confirmaciones de compra | $0 hasta 100/día |

---

## 3. Despliegue del frontend (Vercel — gratis)

### Opción A: Despliegue con GitHub (recomendado)

1. Crea una cuenta en [github.com](https://github.com) si no la tienes.
2. Sube la carpeta `campus-connect/` a un repositorio nuevo llamado `campus-connect`.
3. Ve a [vercel.com](https://vercel.com) y regístrate **con GitHub**.
4. Clic en **"Add New Project"** → selecciona `campus-connect` → **Deploy**.
5. En menos de 30 segundos tendrás una URL pública: `campus-connect.vercel.app`.

### Opción B: Despliegue directo (arrastra y suelta)

1. Comprime la carpeta `campus-connect/` en un `.zip`.
2. Ve a [vercel.com/new](https://vercel.com/new) → arrastra el `.zip` → **Deploy**.
3. Listo.

> Cualquier cambio en GitHub se redespliega automáticamente. Vercel también incluye HTTPS (SSL) gratis y CDN mundial.

---

## 4. Compra del dominio

### Paso 1 — Elige y verifica disponibilidad
- **Para uso global:** `campusconnect.com` o `campusconnect.app` (~$10–15 USD/año)
- **Para Ecuador:** `campusconnect.ec` (~$35 USD/año) o `campusconnect.com.ec` (~$25 USD/año)

Verifica disponibilidad en:
- [namecheap.com](https://www.namecheap.com) (recomendado, soporte 24/7)
- [godaddy.com](https://www.godaddy.com)
- [nic.ec](https://www.nic.ec) (solo dominios .ec)

### Paso 2 — Compra el dominio
1. Crea una cuenta en Namecheap.
2. Busca tu dominio → añade al carrito → completa el pago (acepta tarjeta y PayPal).
3. **Activa la protección WhoisGuard gratuita** (oculta tus datos personales del registro público).

### Paso 3 — Conecta el dominio con Vercel
1. En Vercel: `Settings → Domains → Add Domain` → escribe `campusconnect.ec`.
2. Vercel te dará dos registros DNS (tipo `A` y `CNAME`).
3. En Namecheap: `Domain List → Manage → Advanced DNS` → añade esos dos registros.
4. Espera 10 minutos a 1 hora. El SSL (HTTPS) se activa automáticamente.

---

## 5. Base de datos con Supabase (gratis hasta 500 MB)

### Paso 1 — Crear cuenta y proyecto
1. Ve a [supabase.com](https://supabase.com) → **Start your project** → regístrate con GitHub.
2. Crea un nuevo proyecto:
   - **Nombre:** `campus-connect`
   - **Región:** `South America (São Paulo)` — la más cercana a Ecuador
   - **Contraseña:** guárdala en lugar seguro
3. Espera 2 minutos a que se aprovisione la base de datos.

### Paso 2 — Crear las tablas

Ve a **SQL Editor** en el dashboard de Supabase y ejecuta:

```sql
-- Tabla de usuarios (extiende auth.users de Supabase)
create table profiles (
  id uuid references auth.users primary key,
  full_name text not null,
  university text not null,
  avatar_url text,
  bio text,
  rating numeric default 5.0,
  total_sales int default 0,
  created_at timestamptz default now()
);

-- Tabla de productos
create table products (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('Libros','Apuntes','Tutorías','Servicios','Empleos')),
  price numeric(10,2) not null check (price >= 0),
  condition text,
  university text,
  delivery_type text,
  image_urls text[] default '{}',
  status text default 'active' check (status in ('active','sold','paused')),
  views int default 0,
  created_at timestamptz default now()
);

-- Tabla de transacciones
create table orders (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references profiles(id),
  product_id uuid references products(id),
  amount numeric(10,2) not null,
  payment_method text,
  payment_status text default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  payment_reference text,
  created_at timestamptz default now()
);

-- Tabla de mensajes entre usuarios
create table messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id),
  receiver_id uuid references profiles(id),
  product_id uuid references products(id),
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Tabla de reseñas
create table reviews (
  id uuid default gen_random_uuid() primary key,
  reviewer_id uuid references profiles(id),
  reviewed_id uuid references profiles(id),
  order_id uuid references orders(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Habilita Row Level Security (seguridad por usuario)
alter table profiles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;

-- Políticas básicas (todos pueden leer productos, solo el dueño edita)
create policy "productos_visibles_para_todos" on products for select using (true);
create policy "vendedor_edita_su_producto" on products for all using (auth.uid() = seller_id);
create policy "perfiles_visibles_para_todos" on profiles for select using (true);
create policy "usuario_edita_su_perfil" on profiles for update using (auth.uid() = id);
```

### Paso 3 — Obtener las llaves de API
En Supabase, ve a **Project Settings → API** y copia:
- `Project URL` → ejemplo: `https://abcdefgh.supabase.co`
- `anon public key` → empieza con `eyJ...`

**Estas dos cadenas son las que conectan tu frontend con la base de datos.**

---

## 6. Conectar el frontend a la base de datos

### Paso 1 — Añadir Supabase a tu HTML

En **cada página** (`index.html`, `explorar.html`, etc.) añade antes de `<script src="app.js">`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Paso 2 — Modificar `app.js`

Al inicio del archivo, antes de la constante `PRODUCTS`, añade:

```javascript
// Configuración Supabase
const SUPABASE_URL = 'https://abcdefgh.supabase.co';      // ← tu URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIs...';            // ← tu anon key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Función para obtener productos reales desde la base de datos
async function fetchProducts(filters = {}) {
  let query = supabase
    .from('products')
    .select('*, profiles(full_name, university, rating)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice);

  const { data, error } = await query;
  if (error) console.error(error);
  return data || [];
}

// Función para publicar un nuevo producto
async function createProduct(productData) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('products')
    .insert({ ...productData, seller_id: user.id })
    .select()
    .single();
  return { data, error };
}

// Función para crear una orden de compra
async function createOrder(productId, amount, paymentMethod) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      product_id: productId,
      amount,
      payment_method: paymentMethod,
      payment_status: 'pending'
    })
    .select()
    .single();
  return { data, error };
}
```

### Paso 3 — Reemplazar el array `PRODUCTS` por la consulta real

En `index.html`, cambia esto:

```javascript
// ANTES
document.getElementById('featured-grid').innerHTML =
  PRODUCTS.slice(0, 8).map(renderProductCard).join('');

// DESPUÉS
fetchProducts().then(products => {
  document.getElementById('featured-grid').innerHTML =
    products.slice(0, 8).map(renderProductCard).join('');
});
```

---

## 7. Autenticación de usuarios (Supabase Auth)

### Configurar autenticación con correo institucional

1. En Supabase: **Authentication → Providers → Email** → activado por defecto.
2. **Authentication → Settings → Email Templates**: personaliza los correos de confirmación con tu marca.
3. **Authentication → URL Configuration → Site URL**: pon `https://campusconnect.ec`.

### Modificar `cuenta.html` para usar Supabase Auth

```javascript
// Registro
async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('input[type="email"]').value;
  const password = form.querySelector('input[type="password"]').value;

  // Validar correo institucional
  if (!email.match(/@(puce|uce|espe|udla|usfq|epn|edu)\.(edu|ec)/i)) {
    showToast('Solo se aceptan correos universitarios (.edu o .edu.ec)');
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: {
        full_name: `${form[0].value} ${form[1].value}`,
        university: form[3].value
      }
    }
  });

  if (error) return showToast(error.message);
  showToast('¡Revisa tu correo para confirmar la cuenta!');
}

// Login
async function handleLogin(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showToast(error.message);

  showToast('¡Sesión iniciada!');
  setTimeout(() => location.reload(), 800);
}

// Verificar sesión activa
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  // Mostrar dashboard
}

// Cerrar sesión
async function logout() {
  await supabase.auth.signOut();
  location.reload();
}
```

---

## 8. Pasarela de pagos

### 🇪🇨 Opción 1 — PayPhone (recomendada para Ecuador)

**Ventajas:** soporte nativo en USD, billetera digital popular en Ecuador, comisión 4.5%.

#### Paso 1 — Crear cuenta empresarial
1. Ve a [payphone.app/portal](https://payphone.app/portal) → registrate como **empresa**.
2. Sube los documentos: RUC, cédula del representante, certificado bancario.
3. Aprobación en 24–72 horas.

#### Paso 2 — Obtener credenciales API
En tu panel de PayPhone:
- `Store ID` (ID de tienda)
- `Token` (de larga duración, no expira)

#### Paso 3 — Integrar el botón de pago

En `carrito.html`, reemplaza la función `checkout()`:

```javascript
async function checkout() {
  const cart = getCart();
  const subtotal = cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const total = (subtotal * 1.05).toFixed(2);

  // 1. Crear orden en tu base de datos
  const { data: order } = await createOrder(cart[0].id, total, 'payphone');

  // 2. Crear transacción en PayPhone
  const response = await fetch('https://pay.payphonetodoesposible.com/api/button/Prepare', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer TU_TOKEN_PAYPHONE',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: Math.round(total * 100),  // en centavos
      amountWithoutTax: Math.round(total * 100),
      currency: 'USD',
      clientTransactionId: order.id,
      storeId: 'TU_STORE_ID',
      reference: `Pedido Campus Connect #${order.id.slice(0,8)}`,
      responseUrl: 'https://campusconnect.ec/pago-exitoso.html',
      cancellationUrl: 'https://campusconnect.ec/carrito.html'
    })
  });

  const { paymentId, payWithCard } = await response.json();
  window.location.href = payWithCard;   // redirige al checkout de PayPhone
}
```

Documentación oficial: [docs.payphonetodoesposible.com](https://docs.payphonetodoesposible.com)

---

### 🌎 Opción 2 — PayPal (global)

**Ventajas:** funciona en cualquier país, ideal para estudiantes extranjeros. **Comisión:** 5.4% + $0.30.

#### Paso 1 — Crear cuenta business
1. [paypal.com/ec/business](https://www.paypal.com/ec/business) → **Crear cuenta business**.
2. Verifica tu identidad y tu cuenta bancaria.

#### Paso 2 — Obtener credenciales
1. Ve a [developer.paypal.com](https://developer.paypal.com) → **Apps & Credentials**.
2. Crea una **App** → copia `Client ID` y `Secret`.

#### Paso 3 — Integrar el botón

```html
<!-- Añade en carrito.html antes de cerrar </body> -->
<script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID&currency=USD"></script>

<div id="paypal-button-container"></div>

<script>
paypal.Buttons({
  createOrder: (data, actions) => {
    const total = document.querySelector('.summary-line.total .amount').textContent.replace('$','');
    return actions.order.create({
      purchase_units: [{ amount: { value: total } }]
    });
  },
  onApprove: async (data, actions) => {
    const order = await actions.order.capture();
    // Guardar la orden en Supabase
    await supabase.from('orders').update({
      payment_status: 'paid',
      payment_reference: order.id
    }).eq('id', currentOrderId);

    showToast('¡Pago aprobado!');
    localStorage.removeItem('cc_cart_v1');
    window.location.href = 'pago-exitoso.html';
  }
}).render('#paypal-button-container');
</script>
```

---

### 💳 Opción 3 — Stripe (la más usada globalmente)

Stripe **no opera oficialmente en Ecuador**, pero puede usarse con una empresa en EE.UU. (mediante [Stripe Atlas](https://stripe.com/atlas), ~$500 USD una vez). Recomendado solo si planean operar a escala regional.

---

## 9. Costos estimados mensuales

| Servicio | Tier gratis | Cuándo pagar |
|----------|-------------|--------------|
| Vercel | ✓ Gratis para hobby | $20/mes al pasar 100 GB de tráfico |
| Supabase | ✓ Gratis hasta 500 MB y 50.000 usuarios | $25/mes al crecer |
| Dominio `.com` | ❌ | ~$10–15 USD/año |
| Dominio `.ec` | ❌ | ~$35 USD/año |
| PayPhone | ✓ Gratis registro | 4.5% por transacción |
| PayPal | ✓ Gratis registro | 5.4% + $0.30 por venta |
| **Total mínimo año 1** | | **~$10–35 USD/año + comisiones** |

> Estudiantes pueden empezar con **$10 USD/año** (solo dominio) y todo lo demás gratis, hasta tener tráfico real.

---

## 10. Roadmap operativo (para estar 100% operativo)

### Semana 1 — Frontend en línea
- [x] Tener los archivos HTML/CSS/JS (ya entregados)
- [ ] Crear repositorio en GitHub
- [ ] Desplegar en Vercel
- [ ] Comprar dominio y conectarlo

### Semana 2 — Base de datos
- [ ] Crear proyecto en Supabase
- [ ] Ejecutar los scripts SQL del paso 5
- [ ] Conectar `app.js` con Supabase
- [ ] Migrar el array `PRODUCTS` a la base de datos real

### Semana 3 — Autenticación
- [ ] Activar Supabase Auth
- [ ] Modificar `cuenta.html` para login/signup reales
- [ ] Validar correos institucionales
- [ ] Proteger las rutas (solo logueados pueden publicar)

### Semana 4 — Pagos
- [ ] Crear cuenta en PayPhone (o PayPal mientras se aprueba)
- [ ] Integrar el botón de pago en `carrito.html`
- [ ] Probar transacciones en modo sandbox
- [ ] Pasar a modo producción

### Semana 5 — Storage de imágenes
- [ ] Activar Supabase Storage o Cloudinary
- [ ] Modificar `vender.html` para subir fotos reales

### Semana 6 — Lanzamiento beta
- [ ] Invitar a 50 estudiantes piloto
- [ ] Monitorear errores y métricas
- [ ] Iterar según feedback
- [ ] Lanzamiento oficial

---

## Comandos rápidos

```bash
# Servir el sitio localmente (Python instalado)
cd campus-connect
python3 -m http.server 8000
# Abre http://localhost:8000 en tu navegador

# O con Node.js
npx serve

# Subir a GitHub
git init
git add .
git commit -m "Campus Connect - primera versión"
git branch -M main
git remote add origin https://github.com/tu-usuario/campus-connect.git
git push -u origin main
```

---

## Recursos útiles

- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **PayPhone Docs:** [docs.payphonetodoesposible.com](https://docs.payphonetodoesposible.com)
- **PayPal Developer:** [developer.paypal.com](https://developer.paypal.com)
- **Namecheap:** [namecheap.com](https://www.namecheap.com)
- **JavaScript moderno:** [javascript.info](https://javascript.info)

---

**Hecho por el equipo de Campus Connect:** Henry Prado · Erick Tapia · [Tercer Integrante]
*Quito, Ecuador · 2026*
