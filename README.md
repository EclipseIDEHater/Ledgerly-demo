# Ledgerly demo

Landing page educativa para demostrar una propuesta de valor, una variante A/B y eventos de analítica.

## Ejecutar localmente

Abre `index.html` en un navegador o ejecuta un servidor estático:

```bash
npx serve .
```

## Desplegar en Vercel

Importa este repositorio en Vercel. No requiere build command ni output directory.

## Variantes

- Selector superior: cambia entre A y B.
- A: `Tu contabilidad, en piloto automático.`
- B: `Deja de perder horas persiguiendo números.`

Los eventos están preparados en `demo-contable.js` mediante `dataLayer`. Para activar GA4, añade el snippet de medición en el `<head>` de `index.html` y llama a `gtag` desde la función `track`.
