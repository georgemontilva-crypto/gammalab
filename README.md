# Gamma Lab

Sitio del estudio: hero con el logo hecho de partículas, un túnel 3D para recorrer
los proyectos, una terminal que funciona y contacto. React + Vite + TypeScript,
sin base de datos.

## Comandos

```bash
npm install     # dependencias
npm run dev     # desarrollo en http://localhost:5173
npm run build   # comprueba tipos y genera /dist
npm start       # sirve /dist (lo que usa Railway)
```

## Dónde se edita cada cosa

| Qué | Archivo |
| --- | --- |
| Proyectos (nombre, enlace, textos, etiquetas) | `src/data/projects.json` |
| Correo, WhatsApp, GitHub, Instagram y stack | `src/data/site.ts` |
| Textos de la web en español e inglés | `src/data/copy.ts` |
| Colores y tipografías | primeras líneas de `src/styles.css` |

### Añadir un proyecto

Copia un bloque de `src/data/projects.json` y cambia sus datos. El `slug` debe ser
único, en minúsculas y con guiones: también es el nombre de sus capturas.

## Capturas de las webs

Cada proyecto muestra una captura real de su web. Mientras no exista, la página
dibuja una portada generada con el nombre del proyecto.

**Desde GitHub (sin instalar nada):** pestaña *Actions* → *Capturas de proyectos* →
*Run workflow*. Al terminar hace commit de las imágenes en `src/shots` y Railway
vuelve a desplegar.

**Desde tu PC:**

```bash
npm install --no-save playwright sharp
npx playwright install chromium
npm run shots                 # todos
npm run shots -- potted faded # solo esos slugs
```

Si una web abre con una ventana de edad o de cookies que el script no cierra,
añade al proyecto `"shotClicks": ["text=Yes"]` con el selector del botón.

## Despliegue en Railway

Proyecto nuevo → *Deploy from GitHub repo* → este repositorio. `railway.json` ya
define el build (`npm run build`) y el arranque (`npm run start`). No necesita
variables de entorno ni base de datos.
