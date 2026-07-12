# 🚀 Cómo poner Campus Connect EN LÍNEA en 15 minutos

> Esta guía te lleva paso a paso desde tu computadora hasta tener la página funcionando en internet con una URL pública que cualquiera puede visitar. **Todo gratis, sin tarjeta de crédito.**

---

## ✅ Lo que vas a lograr

Al final tendrás una URL como `https://campus-connect-equipo.vercel.app` que puedes:
- 📱 Mostrar en tu celular
- 💻 Compartir con compañeros y profesor
- 🎤 Demostrar en vivo en la exposición
- 🌍 Acceder desde cualquier lugar del mundo

---

## 📋 Lo que necesitas antes de empezar

- [ ] Una cuenta de **correo electrónico** (Gmail funciona perfecto)
- [ ] El archivo `CampusConnect_Web.zip` descargado y descomprimido
- [ ] **15 minutos** de tu tiempo
- [ ] Una computadora con internet

No necesitas saber programar. Es todo arrastrar, hacer clic y copiar/pegar.

---

# 🎯 PARTE 1: Crear cuenta en GitHub (3 minutos)

GitHub es como Google Drive pero para código de programación. Aquí vivirá su proyecto.

### Paso 1.1 — Registrarse

1. Ve a **https://github.com/signup**
2. Escribe tu correo electrónico → **Continue**
3. Crea una contraseña segura → **Continue**
4. Elige un nombre de usuario (puede ser `campus-connect-team` o tu nombre) → **Continue**
5. Responde el captcha (es solo verificación humana)
6. Verifica tu correo (te llega un código de 8 dígitos)

✅ **Listo, ya tienes cuenta en GitHub.**

> 💡 **Tip:** elige el plan **Free**, no necesitas el Pro.

---

# 🎯 PARTE 2: Subir el proyecto a GitHub (5 minutos)

Hay dos opciones — elige la que prefieras:

## 🟢 OPCIÓN A: Subir desde el navegador (más fácil, recomendada)

### Paso 2.1 — Crear el repositorio

1. Una vez dentro de GitHub, haz clic en el **botón verde "New"** (arriba a la izquierda) o ve directo a **https://github.com/new**
2. Completa el formulario:
   - **Repository name:** `campus-connect`
   - **Description:** `Marketplace universitario - Proyecto Prospectiva de Negocios`
   - Selecciona **Public** (gratis y necesario para Vercel)
   - **NO marques** las casillas de README, .gitignore o license (ya las tenemos en el ZIP)
3. Haz clic en el botón verde **"Create repository"**

### Paso 2.2 — Subir los archivos

1. En la página que aparece, busca el enlace **"uploading an existing file"** (está a la mitad de la página, en letra azul)
2. **Abre la carpeta `campus-connect`** que descargaste del ZIP
3. **Selecciona TODOS los archivos** de adentro (Ctrl+A en Windows / Cmd+A en Mac)
4. **Arrástralos a la zona** del navegador donde dice "Drag files here to add them"
5. Espera a que se suban todos (verás una barra de progreso por cada archivo)
6. Hasta abajo, en **"Commit changes"**, escribe: `Versión inicial de Campus Connect`
7. Haz clic en el botón verde **"Commit changes"**

✅ **¡Tu código ya está en GitHub!** Verás todos los archivos listados.

---

## 🔵 OPCIÓN B: Con GitHub Desktop (si prefieres una app)

1. Descarga **GitHub Desktop** desde https://desktop.github.com
2. Instala e inicia sesión con tu cuenta
3. File → **New repository** → nombre `campus-connect`
4. Copia los archivos del ZIP a la carpeta del repositorio
5. Escribe un mensaje: "Versión inicial"
6. Clic en **Commit to main**
7. Clic en **Publish repository**

---

# 🎯 PARTE 3: Poner el sitio EN LÍNEA con Vercel (5 minutos)

Vercel es como un servidor que muestra tu página al mundo. **Es gratis** para proyectos como el suyo.

### Paso 3.1 — Crear cuenta en Vercel

1. Ve a **https://vercel.com/signup**
2. Haz clic en **"Continue with GitHub"** (esto los conecta automáticamente)
3. Autoriza el acceso (es seguro, solo lee tus repositorios públicos)
4. Cuando pregunte el plan, elige **Hobby (Free)**

### Paso 3.2 — Importar el proyecto

1. En el dashboard de Vercel haz clic en **"Add New..."** → **"Project"**
2. Verás una lista de tus repositorios de GitHub
3. Busca **`campus-connect`** → haz clic en **"Import"**
4. **NO toques nada de la configuración** (Vercel detecta solo que es HTML)
5. Solo haz clic en el botón negro grande **"Deploy"**
6. Espera 30 segundos a que termine el despliegue

### Paso 3.3 — ¡Tu página está en línea! 🎉

Verás una pantalla con confeti y tu URL pública:

```
https://campus-connect-xxxxx.vercel.app
```

Haz clic en la URL y verás **Campus Connect funcionando en internet**, accesible desde cualquier dispositivo del mundo.

---

# 🎯 PARTE 4: Personalizar el dominio (opcional, 2 minutos)

Si la URL `campus-connect-xxxxx.vercel.app` no les gusta:

### Paso 4.1 — Cambiar el subdominio gratis

1. En Vercel, entra a tu proyecto → **Settings** → **Domains**
2. Verás tu dominio actual. Clic en el botón **"Edit"** al lado
3. Cambia a algo como **`campusconnect-ec`** → **Save**
4. Ahora tu URL será **`https://campusconnect-ec.vercel.app`** ✨

### Paso 4.2 — Comprar un dominio propio (opcional)

Si quieren `campusconnect.ec` o `campusconnect.com`:

1. Cómpralo en **Namecheap** (~$10–35 USD/año)
2. En Vercel: **Settings** → **Domains** → **Add Domain**
3. Escribe tu dominio → Vercel te dará 2 registros DNS
4. Pega esos registros en Namecheap (en "Advanced DNS")
5. Espera entre 10 minutos y 1 hora a que se active
6. ✅ Vercel automáticamente activa el HTTPS (candadito verde)

> 💡 **Para la exposición:** la URL gratis `campusconnect-ec.vercel.app` es más que suficiente. El dominio propio lo pueden comprar después.

---

# 🎯 PARTE 5: Hacer cambios después

Si más adelante quieren actualizar la página:

### Opción Fácil (desde GitHub web)
1. Ve a tu repositorio en GitHub
2. Haz clic sobre el archivo que quieres editar (ej. `index.html`)
3. Haz clic en el ícono de **lápiz ✏️** (arriba a la derecha)
4. Edita el código directo en el navegador
5. Hasta abajo: **"Commit changes"**
6. **Vercel detecta el cambio automáticamente** y redespliega en 30 segundos 🚀

### Opción Profesional (con Git en la PC)
```bash
git clone https://github.com/tu-usuario/campus-connect.git
cd campus-connect
# Editas los archivos
git add .
git commit -m "Mejoras de diseño"
git push
# Vercel redespliega solo
```

---

# 🆘 Problemas comunes y soluciones

### ❌ "El despliegue falla en Vercel"
**Solución:** asegúrate de haber subido el archivo `index.html` a la raíz del repositorio (no dentro de otra carpeta).

### ❌ "Mi página se ve sin estilos"
**Solución:** verifica que también subiste `styles.css`, `legal.css`, `app.js`, `cookies.js` y la carpeta `assets/`.

### ❌ "No me deja crear repositorio Public"
**Solución:** debes verificar tu correo electrónico primero. Revisa la bandeja de entrada.

### ❌ "Vercel me pide una tarjeta de crédito"
**Solución:** asegúrate de elegir el plan **Hobby (Free)**, no el Pro. No necesitas tarjeta.

### ❌ "Los enlaces internos no funcionan en Vercel"
**Solución:** ya está resuelto con el archivo `vercel.json` que incluí. Solo asegúrate de haberlo subido.

---

# 🎤 Para la exposición: el truco maestro

Cuando expongan mañana, abran la URL de Vercel en su celular o computadora **antes de comenzar**. Pueden:

1. **Mostrar el QR code:** vayan a https://qr.io y peguen su URL → muéstrenlo al jurado para que entren al sitio desde sus teléfonos en tiempo real
2. **Navegar en vivo:** abran la página, hagan scroll, agreguen al carrito, muestren el responsive cambiando el tamaño de la ventana
3. **Compartir el link:** "Pueden visitar nuestra plataforma ahora mismo en campusconnect-ec.vercel.app"

Esto deja una impresión 10× más fuerte que cualquier slide.

---

# 📋 Checklist final

Marca cada paso conforme lo completes:

- [ ] Tengo cuenta en GitHub
- [ ] Creé el repositorio `campus-connect` (público)
- [ ] Subí todos los archivos del proyecto
- [ ] Tengo cuenta en Vercel conectada con GitHub
- [ ] Importé el proyecto y lo desplegué
- [ ] Probé la URL pública y todo funciona
- [ ] (Opcional) Cambié el subdominio a uno más bonito
- [ ] Compartí el link con mi equipo

---

# 🎓 ¿Qué decir en la exposición sobre esto?

> *"Para poner Campus Connect en producción usamos GitHub como repositorio del código, lo que nos permite trabajar en equipo y llevar un historial de cambios. La página está desplegada en Vercel, una plataforma de hosting que nos da HTTPS automático, despliegue continuo y red de distribución mundial — todo gratis en su plan inicial. Cualquier cambio que hagamos en GitHub se actualiza automáticamente en la página en menos de un minuto."*

---

**¿Listo? Empieza por la PARTE 1. En 15 minutos tendrás Campus Connect en línea. 🚀**

*Si te trabas en algún paso, revisa la sección de "Problemas comunes" o pregúntame.*
