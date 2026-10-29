# Integraciones de medición

La aplicación genera el mensaje y la estructura de la landing. Estas integraciones se agregan después en la landing publicada.

## Google Analytics 4

Reemplaza `G-XXXXXXXXXX` por tu Measurement ID y coloca el snippet dentro de `<head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Mide el CTA con un evento:

```js
gtag('event', 'cta_click', { variant: new URLSearchParams(location.search).get('variant') || 'a' });
```

## Meta Pixel

Reemplaza `PIXEL_ID` por el ID real. El Pixel requiere configurar también los dominios y la política de privacidad en Meta.

```html
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

Al completar un formulario, registra `fbq('track', 'Lead')`. Pide consentimiento antes de cargar trackers cuando la legislación aplicable lo exija.

## A/B testing básico

La demo selecciona una variante desde la URL:

```js
const variant = new URLSearchParams(location.search).get('variant') === 'b' ? 'b' : 'a';
```

Ejemplos:

- `https://tu-dominio.com/?variant=a`
- `https://tu-dominio.com/?variant=b`

En la variante B cambia solamente el título o el CTA. Envía la variante como parámetro en Analytics para comparar conversiones. La demo no calcula significancia estadística: primero necesitas tráfico y un evento de conversión confiable.
