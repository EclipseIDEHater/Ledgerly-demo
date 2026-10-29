# Landing Coach

Parte 2 de los tutoriales de Claude Code: un laboratorio para convertir una idea en una landing page más clara, creíble y medible. Incluye un primer MVP de evaluación de viabilidad de proyectos.

## Ejecutar localmente

Requiere Node.js 18 o superior.

```bash
cd Asistente-páginas
OPENAI_API_KEY=tu_api_key node server.js
```

Abre `http://localhost:3001`. Si no configuras `OPENAI_API_KEY`, la aplicación funciona en modo local con recomendaciones basadas en plantillas.

Para probar el evaluador abre `http://localhost:3001/analisis`. Puedes ingresar contexto del producto, una URL pública de GitHub y documentos de texto. El backend inspecciona metadatos y estructura sin ejecutar el código, calcula índices heurísticos y busca comparables en GitHub.

Para no escribir la key en la terminal cada vez, copia `.env.example` como `.env` y carga las variables con tu herramienta de entorno. Nunca subas `.env` a Git.

## Qué enseña

- La fórmula de landing pages: título, subtítulo, visual, prueba social, CTA, objeciones, FAQ, segundo CTA y nota del fundador.
- Cómo enviar insights de entrevistas a OpenAI sin exponer la API key en el frontend.
- Por qué una API key debe permanecer en el servidor y no en el frontend.
- Cómo definir una propuesta de valor, CTA, flujo de compra y métricas de tracción.
- Cómo relacionar evidencia de producto, madurez técnica y señales exploratorias de mercado en un diagnóstico de viabilidad.

## Estructura

- `index.html`, `styles.css`, `app.js`: interfaz del asistente.
- `server.js`: servidor estático y proxy seguro hacia OpenAI.
- `docs/integraciones.md`: guía para Analytics, Meta Pixel y A/B testing.
- `docs/flujo-evaluacion-viabilidad.mmd`: flujo del evaluador de proyectos.
