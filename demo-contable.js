const variantSelect = document.querySelector('#variant');
const eventCount = document.querySelector('#eventCount');

let eventsCaptured = 0;

const copy = {
  a: {
    headline: 'Tu contabilidad, <em>en piloto automático.</em>',
    sub: 'Ledgerly captura, clasifica y reconcilia tus movimientos para que cierres el mes en horas, no en días.'
  },
  b: {
    headline: 'Deja de perder horas <em>persiguiendo números.</em>',
    sub: 'El agente financiero de Ledgerly encuentra errores, facturas pendientes y respuestas antes de que se conviertan en problemas.'
  }
};

function track(eventName, parameters = {}) {
  eventsCaptured += 1;
  eventCount.textContent = eventsCaptured;

  console.log('[GA4 demo]', eventName, parameters);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...parameters
  });

  if (typeof gtag === 'function') {
    gtag('event', eventName, {
      ...parameters,
      debug_mode: true
    });
  }
}

function applyVariant(value) {
  const selectedCopy = copy[value];

  document.querySelector('#headline').innerHTML = selectedCopy.headline;
  document.querySelector('#subheadline').textContent = selectedCopy.sub;
  document.querySelector('#assignment').textContent =
    `Asignado: variante ${value.toUpperCase()}`;

  track('experiment_assignment', {
    experiment_id: 'hero_headline_v1',
    variant: value
  });
}

function setupVariantSelector() {
  variantSelect.addEventListener('change', (event) => {
    applyVariant(event.target.value);
  });
}

function setupCtaTracking() {
  document.querySelectorAll('[data-cta]').forEach((button) => {
    button.addEventListener('click', () => {
      track('click_cta', {
        cta_location: button.dataset.cta,
        variant: variantSelect.value
      });

      alert('Demo: aquí abriríamos el registro de Ledgerly. Evento click_cta enviado.');
    });
  });
}

function setupDemoTracking() {
  const demoButton = document.querySelector('[data-demo]');

  demoButton.addEventListener('click', () => {
    track('view_demo', {
      variant: variantSelect.value
    });
  });
}

function setupFeatureTracking() {
  document.querySelectorAll('[data-learn]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      track('click_feature', {
        feature: link.dataset.learn,
        variant: variantSelect.value
      });
    });
  });
}

function setupScrollNavigation() {
  let lastScrollPosition = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollPosition = window.scrollY;
    const navigation = document.querySelector('#site-nav');
    const demoBar = document.querySelector('#demo-bar');

    if (currentScrollPosition < 80) {
      navigation.classList.remove('nav-hidden');
      demoBar.classList.remove('nav-hidden');
    } else if (currentScrollPosition > lastScrollPosition + 4) {
      navigation.classList.add('nav-hidden');
      demoBar.classList.add('nav-hidden');
    } else if (currentScrollPosition < lastScrollPosition - 4) {
      navigation.classList.remove('nav-hidden');
      demoBar.classList.remove('nav-hidden');
    }

    lastScrollPosition = currentScrollPosition;
  });
}

function initializeAnalytics() {
  track('page_view', {
    page_title: 'Ledgerly landing demo',
    variant: variantSelect.value
  });
}

function initializePage() {
  setupVariantSelector();
  setupCtaTracking();
  setupDemoTracking();
  setupFeatureTracking();
  setupScrollNavigation();
  initializeAnalytics();
}

initializePage();
