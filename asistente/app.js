const form = document.getElementById('brief-form');
const steps = [...document.querySelectorAll('.step')];
const nextButton = document.getElementById('next-button');
const backButton = document.getElementById('back-button');
const generateButton = document.getElementById('generate-button');
const resultSection = document.getElementById('result-section');
const wireframeSection = document.getElementById('wireframe-section');
let currentStep = 0;
let titlesLoaded = false;

function updateStep() {
  steps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
  document.getElementById('step-label').textContent = `Paso ${currentStep + 1} de ${steps.length}`;
  const percent = Math.round(((currentStep + 1) / steps.length) * 100);
  document.getElementById('progress-percent').textContent = `${percent}%`;
  document.getElementById('progress-bar').style.width = `${percent}%`;
  backButton.hidden = currentStep === 0;
  nextButton.hidden = currentStep === steps.length - 1;
  generateButton.hidden = currentStep !== steps.length - 1;
  if (currentStep === steps.length - 1 && !titlesLoaded) proposeTitles();
}

function currentFieldsValid() {
  return [...steps[currentStep].querySelectorAll('input[required], textarea[required]')].every((field) => field.reportValidity());
}

nextButton.addEventListener('click', () => { if (currentFieldsValid()) { currentStep += 1; updateStep(); } });
backButton.addEventListener('click', () => { currentStep -= 1; titlesLoaded = false; updateStep(); });
async function proposeTitles() {
  const input = values();
  const fallback = {
    a: `${input.product}: una forma clara de avanzar`,
    b: `Deja de perder tiempo con ${input.problem.toLowerCase()}`
  };
  const status = document.getElementById('title-status');
  status.textContent = 'La IA está proponiendo titulares...';
  try {
    const response = await fetch('/api/titles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    if (!response.ok) throw new Error('titles unavailable');
    const data = await response.json();
    fallback.a = data.titles.a;
    fallback.b = data.titles.b;
    status.textContent = 'Titulares propuestos por OpenAI.';
  } catch (error) {
    status.textContent = 'Titulares sugeridos localmente. Se revisarán al generar la landing.';
  }
  document.getElementById('title-preview-a').textContent = fallback.a;
  document.getElementById('title-preview-b').textContent = fallback.b;
  titlesLoaded = true;
}

function buildInterviewSummary(raw) {
  const total = Number(raw.interviewTotal) || 0;
  const insights = [
    { text: raw.insight1Text, count: Number(raw.insight1Count) || 0 },
    { text: raw.insight2Text, count: Number(raw.insight2Count) || 0 }
  ].filter((item) => item.text && item.text.trim());
  const lines = insights.map((item) => {
    const percent = total ? Math.round((item.count / total) * 100) : 0;
    return `${item.count} de ${total} (${percent}%) mencionaron: "${item.text.trim()}"`;
  });
  return `${total} personas entrevistadas. ${lines.join('. ')}.`;
}

function values() {
  const raw = Object.fromEntries(new FormData(form).entries());
  return { ...raw, interviewInsights: buildInterviewSummary(raw) };
}

function localResult(input) {
  return {
    interviewSummary: input.interviewInsights,
    title: input.variant === 'b' ? `Deja de perder tiempo con ${input.problem.toLowerCase()}` : `${input.product}: una forma clara de avanzar`,
    subtitle: `${input.howItWorks}. Diseñado para ${input.audience.toLowerCase()}.`,
    problem: input.problem,
    causes: [`Todavía no existe una forma confiable de resolver: ${input.problem.toLowerCase()}.`, 'El proceso actual exige demasiado esfuerzo o tiempo.', 'La necesidad se atiende tarde o de forma improvisada.'],
    implications: ['Se pierde tiempo buscando alternativas.', 'Aumenta la frustración y la incertidumbre.', 'El problema puede seguir afectando decisiones importantes.'],
    valueProposition: input.valueProposition,
    visual: 'Muestra el producto en acción: una captura, demo o recorrido de tres pasos.',
    socialProof: input.socialProof,
    cta: input.cta,
    ctaRationale: 'El CTA propone el siguiente paso expresado en términos del valor que busca la persona.',
    features: ['Explica el primer resultado que obtiene el usuario.', 'Muestra cómo reduces el esfuerzo o el riesgo.', 'Conecta la funcionalidad con una objeción real.'],
    objections: [input.objection, '¿Qué pasa si lo pruebo y no es para mí?', '¿Por qué debería confiar en esta solución ahora?'],
    risksOfInaction: input.risks.split(/[,.]/).filter(Boolean),
    benefitsOfAction: input.benefits.split(/[,.]/).filter(Boolean),
    purchaseFlow: input.purchaseFlow.split(/[,.]/).filter(Boolean),
    faq: [{ question: '¿Para quién es?', answer: input.audience }, { question: '¿Cómo funciona?', answer: input.howItWorks }, { question: '¿Qué debo hacer primero?', answer: input.cta }],
    trustMetrics: [
      { name: 'Tasa de conversión', why: 'Clics en el CTA sobre visitas totales: valida si el mensaje mueve a la acción que confirmaron las entrevistas.', target: 'Comparar variante A vs B y por fuente de tráfico.' },
      { name: 'Duración en la página', why: 'Cuánto tiempo se quedan antes de decidir; indica si el copy engancha o si falta claridad.', target: 'Definir línea base y buscar consistencia con el tiempo que toma entender la propuesta.' },
      { name: 'Tasa de rebote', why: 'Visitas que se van sin interactuar con el CTA ni el resto del contenido.', target: 'Detectar qué bloque (título, prueba social, CTA) genera más abandono.' }
    ],
    tractionPlan: ['Medir visitas, clics en CTA y conversiones finales.', 'Registrar variante, fuente y dispositivo en cada evento.', 'Revisar duración y rebote para ubicar fricciones.', 'Cambiar una sola hipótesis por experimento y comparar.'],
    foundersNote: `Construimos esto porque entendemos de cerca el problema: ${input.problem}.`,
    nextSteps: ['Habla con cinco personas de la audiencia y copia sus palabras.', 'Publica la variante A y B con un solo cambio.', 'Mide el clic en el CTA y la conversión final.']
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function render(result) {
  const list = (items) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  const faq = result.faq.map((item) => `<p><b>${escapeHtml(item.question)}</b><br>${escapeHtml(item.answer)}</p>`).join('');
  const metrics = result.trustMetrics.map((item) => `<p><b>${escapeHtml(item.name)}</b><br>${escapeHtml(item.why)}<br><small>Objetivo: ${escapeHtml(item.target)}</small></p>`).join('');
  const heading = (number, title, step) => `<h3>${number} · ${title}${step === undefined ? '' : `<button type="button" class="edit-link" data-step="${step}">Editar</button>`}</h3>`;
  document.getElementById('result').innerHTML = `
    <article class="result-card wide">${heading('01', 'Insights de entrevistas', 1)}<p>${escapeHtml(result.interviewSummary)}</p></article>
    <article class="result-card wide">${heading('02', 'Título y subtítulo')}<p><strong>${escapeHtml(result.title)}</strong></p><p>${escapeHtml(result.subtitle)}</p></article>
    <article class="result-card wide">${heading('03', 'Problema, causas e implicaciones', 2)}<p>${escapeHtml(result.problem)}</p><b>Causas</b>${list(result.causes)}<b>Implicaciones</b>${list(result.implications)}</article>
    <article class="result-card wide">${heading('04', 'Propuesta de valor', 3)}<p><strong>${escapeHtml(result.valueProposition)}</strong></p></article>
    <article class="result-card">${heading('05', 'CTA propuesto', 5)}<p><strong>${escapeHtml(result.cta)}</strong></p><p>${escapeHtml(result.ctaRationale)}</p></article>
    <article class="result-card wide">${heading('06', 'Riesgo de no actuar y beneficio de actuar', 4)}<b>Riesgo</b>${list(result.risksOfInaction)}<b>Beneficio</b>${list(result.benefitsOfAction)}</article>
    <article class="result-card wide">${heading('07', 'Flujo para comprar', 6)}${list(result.purchaseFlow)}</article>
    <article class="result-card">${heading('08', 'Visual sugerido')}<p>${escapeHtml(result.visual)}</p></article>
    <article class="result-card">${heading('09', 'Prueba social')}<p>${escapeHtml(result.socialProof)}</p></article>
    <article class="result-card wide">${heading('10', 'Features y objeciones')}${list(result.features)}${list(result.objections)}</article>
    <article class="result-card wide">${heading('11', 'FAQ')}${faq}</article>
    <article class="result-card wide">${heading('12', 'Métricas de confianza y plan de tracción')}${metrics}<h3>Plan de tracción</h3>${list(result.tractionPlan)}</article>
    <article class="result-card wide">${heading('13', 'Nota del creador y próximos pasos')}<p>${escapeHtml(result.foundersNote)}</p><h3>Próximos pasos</h3>${list(result.nextSteps)}</article>`;
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: 'smooth' });
}

function goToStep(index) {
  currentStep = index;
  titlesLoaded = false;
  updateStep();
  document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('result').addEventListener('click', (event) => {
  const link = event.target.closest('.edit-link');
  if (link) goToStep(Number(link.dataset.step));
});

function renderWireframe(result) {
  const feature = (text) => `<div class="wf-feature"><div class="wf-box wf-icon">ICONO</div><div class="wf-line" data-text="${escapeHtml(text)}"></div></div>`;
  const faqItem = (item) => `<div class="wf-faq-item"><div class="wf-line wf-line-title" data-text="${escapeHtml(item.question)}"></div><div class="wf-line wf-short"></div></div>`;

  document.getElementById('wireframe').innerHTML = `
    <div class="wf-page">
      <div class="wf-nav"><span class="wf-tag">LOGO</span><span class="wf-nav-links"><i></i><i></i><i></i></span><span class="wf-btn wf-btn-ghost">${escapeHtml(result.cta)}</span></div>

      <div class="wf-hero">
        <span class="wf-tag wf-tag-accent">EYEBROW</span>
        <div class="wf-headline" data-text="${escapeHtml(result.title)}"></div>
        <div class="wf-sub" data-text="${escapeHtml(result.subtitle)}"></div>
        <span class="wf-btn">${escapeHtml(result.cta)}</span>
        <div class="wf-box wf-hero-visual" data-text="${escapeHtml(result.visual)}"></div>
      </div>

      <div class="wf-strip"><span class="wf-tag">PRUEBA SOCIAL</span><div class="wf-line" data-text="${escapeHtml(result.socialProof)}"></div></div>

      <div class="wf-features">${result.features.map(feature).join('')}</div>

      <div class="wf-cta-band">
        <div class="wf-line wf-line-title" data-text="¿Listo para empezar?"></div>
        <span class="wf-btn wf-btn-invert">${escapeHtml(result.cta)}</span>
      </div>

      <div class="wf-faq"><span class="wf-tag">PREGUNTAS FRECUENTES</span>${result.faq.map(faqItem).join('')}</div>

      <div class="wf-footer"><i></i><i></i><i></i></div>
    </div>`;

  document.querySelectorAll('#wireframe [data-text]').forEach((element) => {
    element.textContent = element.dataset.text;
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = values();
  generateButton.disabled = true;
  generateButton.textContent = 'Generando...';
  let result = localResult(input);
  let mode = 'Modo local';
  try {
    const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    if (response.ok) { result = (await response.json()).result; mode = 'OpenAI · GPT'; }
  } catch (error) { /* El modo local permite continuar sin API. */ }
  result.interviewSummary = input.interviewInsights;
  document.getElementById('mode-badge').textContent = mode;
  document.getElementById('active-variant').textContent = input.variant.toUpperCase();
  render(result);
  renderWireframe(result);
  wireframeSection.hidden = false;
  generateButton.disabled = false;
  generateButton.textContent = 'Generar mi landing';
});

document.getElementById('copy-button').addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById('result').innerText);
  document.getElementById('copy-button').textContent = 'Brief copiado';
});

document.querySelectorAll('.copy-code').forEach((button) => button.addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).innerText);
  button.textContent = 'Copiado';
  setTimeout(() => { button.textContent = 'Copiar'; }, 1800);
}));

updateStep();
