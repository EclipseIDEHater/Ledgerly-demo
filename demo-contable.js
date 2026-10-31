const variantSelect = document.querySelector('#variant');
const eventCount = document.querySelector('#eventCount');

const experimentId = 'hero_headline_v1';
const storageKey = `ab_${experimentId}`;
const urlParameters = new URLSearchParams(window.location.search);
const debugMode = urlParameters.has('debug');

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

function isVariant(value) {
  return Object.keys(copy).includes(value);
}

function readStoredVariant() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function storeVariant(value) {
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // Sin almacenamiento la variante solo dura esta visita.
  }
}

// ?variant=a|b es para pruebas: no guarda nada y se reporta como qa_a o qa_b.
function resolveVariant() {
  const forcedVariant = urlParameters.get('variant');

  if (isVariant(forcedVariant)) {
    return { value: forcedVariant, reported: `qa_${forcedVariant}` };
  }

  let value = readStoredVariant();

  if (!isVariant(value)) {
    value = Math.random() < 0.5 ? 'a' : 'b';
    storeVariant(value);
  }

  return { value, reported: value };
}

const { value: activeVariant, reported: reportedVariant } = resolveVariant();

function track(eventName, parameters = {}) {
  eventsCaptured += 1;
  eventCount.textContent = eventsCaptured;

  console.log('[GA4 demo]', eventName, parameters);

  if (typeof gtag === 'function') {
    gtag('event', eventName, {
      ...parameters,
      ...(debugMode && { debug_mode: true })
    });
  }
}

function applyVariant() {
  const selectedCopy = copy[activeVariant];

  document.querySelector('#headline').innerHTML = selectedCopy.headline;
  document.querySelector('#subheadline').textContent = selectedCopy.sub;
  document.querySelector('#assignment').textContent =
    `Asignado: variante ${activeVariant.toUpperCase()}${reportedVariant === activeVariant ? '' : ' (QA)'}`;
  variantSelect.value = activeVariant;

  if (typeof gtag === 'function') {
    gtag('set', 'user_properties', { hero_variant: reportedVariant });
  }

  track('experiment_assignment', {
    experiment_id: experimentId,
    variant: reportedVariant
  });
}

function setupVariantSelector() {
  variantSelect.addEventListener('change', (event) => {
    const url = new URL(window.location.href);

    url.searchParams.set('variant', event.target.value);
    window.location.assign(url);
  });
}

function setupCtaTracking() {
  document.querySelectorAll('[data-cta]').forEach((button) => {
    button.addEventListener('click', () => {
      track('click_cta', {
        cta_location: button.dataset.cta,
        variant: reportedVariant
      });

      alert('Demo: aquí abriríamos el registro de Ledgerly. Evento click_cta enviado.');
    });
  });
}

function setupDemoTracking() {
  const demoButton = document.querySelector('[data-demo]');

  demoButton.addEventListener('click', () => {
    track('view_demo', {
      variant: reportedVariant
    });
  });
}

function setupFeatureTracking() {
  document.querySelectorAll('[data-learn]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      track('click_feature', {
        feature: link.dataset.learn,
        variant: reportedVariant
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
    variant: reportedVariant
  });
}

function initializePage() {
  setupVariantSelector();
  setupCtaTracking();
  setupDemoTracking();
  setupFeatureTracking();
  setupScrollNavigation();
  applyVariant();
  initializeAnalytics();
}

initializePage();
