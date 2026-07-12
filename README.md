# Campus Connect 🎓

> Marketplace universitario · *Aprende, crea y vende*

Plataforma web para que estudiantes universitarios compren, vendan e intercambien libros, apuntes, tutorías y servicios dentro de su campus.

---

## 📁 Estructura del proyecto

```
campus-connect/
├── index.html              ← Home
├── explorar.html           ← Catálogo con filtros
├── producto.html           ← Detalle de producto
├── vender.html             ← Publicar producto
├── carrito.html            ← Carrito y checkout
├── cuenta.html             ← Login, registro y dashboard
│
├── legal.html              ← Centro Legal (índice)
├── privacidad.html         ← Política de Privacidad (LOPDP)
├── terminos.html           ← Términos y Condiciones
├── cookies.html            ← Política de Cookies
│
├── styles.css              ← Sistema de diseño principal
├── legal.css               ← Estilos de páginas legales
├── app.js                  ← Lógica del marketplace
├── cookies.js              ← Banner de consentimiento de cookies
├── assets/logo.png         ← Logo de la marca
│
├── GUIA_DESPLIEGUE.md      ← Guía técnica completa
└── README.md               ← Este archivo
```

---

## 🚀 Cómo probarlo localmente

```bash
cd campus-connect
python3 -m http.server 8000
# Abre http://localhost:8000 en tu navegador
```

---

## ✨ Funcionalidades

### Marketplace
- Home con hero, categorías y productos destacados
- Catálogo con filtros (categoría, universidad, precio, búsqueda)
- Detalle de producto con vendedor verificado
- Formulario de publicación
- Carrito con 4 métodos de pago
- Login, registro y dashboard de usuario

### Cumplimiento legal y protección de datos
- **Política de Privacidad** completa según LOPDP (Ecuador) y GDPR (UE)
- **Términos y Condiciones** del marketplace
- **Política de Cookies** detallada
- **Banner de consentimiento de cookies** funcional con 3 opciones (aceptar todas, solo necesarias, personalizar)
- **Derechos ARCO** explicados (Acceso, Rectificación, Cancelación, Oposición, Limitación, Portabilidad)
- **Tabla de contenidos** lateral sticky en páginas legales
- Enlaces a privacidad y términos desde los formularios de registro y publicación

### Técnico
- 100% responsive (móvil, tablet, escritorio)
- Carrito persistente con localStorage
- Notificaciones toast
- Tipografía profesional (Fraunces + Manrope + JetBrains Mono)
- Tema dark con acentos cyan

---

## 🔐 Manejo de datos del usuario

Campus Connect implementa las siguientes prácticas:

| Aspecto | Cómo lo manejamos |
|---------|-------------------|
| Recopilación | Solo datos estrictamente necesarios |
| Cifrado | HTTPS en tránsito, bcrypt para contraseñas |
| Pagos | Nunca guardamos tarjetas (lo hace PayPhone/PayPal) |
| Consentimiento | Banner explícito + opción de personalización |
| Derechos del usuario | 6 derechos ARCO implementados |
| Tiempo de retención | Cuentas inactivas se eliminan a los 24 meses |
| Notificación de brechas | En máximo 72 horas según LOPDP |
| Menores | Plataforma exclusiva para mayores de 18 años |

Ver detalles completos en `privacidad.html`.

---

## 🌐 Para producción

Sigue paso a paso la **[GUIA_DESPLIEGUE.md](GUIA_DESPLIEGUE.md)**:

1. Despliegue en Vercel (gratis)
2. Compra del dominio (.com o .ec)
3. Base de datos con Supabase + scripts SQL
4. Autenticación con correo institucional
5. Integración de PayPhone, PayPal y Stripe

---

## 👥 Equipo

- **Henry Prado**
- **Erick Tapia**
- **[Tercer Integrante]**

📍 Quito · Ecuador · 2026  
🎓 Materia: Prospectiva de Negocios
