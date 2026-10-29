const form = document.getElementById('analysis-form');
const button = document.getElementById('analyze-button');
const status = document.getElementById('analysis-status');

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function readDocuments() {
  return Promise.all([...document.getElementById('documents').files].slice(0, 8).map((file) => new Promise((resolve) => {
    if (file.size > 500_000 || file.type === 'application/pdf') return resolve({ name: file.name, content: '[Archivo omitido: formato binario o tamaño superior a 500 KB]' });
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, content: String(reader.result).slice(0, 30_000) });
    reader.onerror = () => resolve({ name: file.name, content: '[No se pudo leer el archivo]' });
    reader.readAsText(file);
  })));
}

function renderList(id, items, empty) {
  document.getElementById(id).innerHTML = items.length ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join('') : `<li>${empty}</li>`;
}

function render(result) {
  document.getElementById('analysis-title').textContent = result.status;
  document.getElementById('analysis-score').textContent = `${result.overall}/100`;
  document.getElementById('analysis-disclaimer').textContent = result.disclaimer;
  const labels = { problem: 'Problema', solution: 'Solución', technical: 'Técnica', validation: 'Validación', market: 'Mercado', security: 'Seguridad' };
  document.getElementById('index-grid').innerHTML = Object.entries(result.indices).map(([key, value]) => `<div class="index-card"><span>${labels[key]}</span><strong>${value}</strong><div class="index-bar"><i style="width:${value}%"></i></div></div>`).join('');
  renderList('evidence-list', result.evidence, 'No se encontró evidencia suficiente.');
  renderList('risk-list', result.risks, 'No se detectaron vacíos con las fuentes recibidas.');
  document.getElementById('analysis-graph').textContent = result.graph;
  const repo = result.repository;
  document.getElementById('repository-summary').innerHTML = repo ? `<p><a href="${escapeHtml(repo.url)}" target="_blank" rel="noreferrer">${escapeHtml(repo.name)}</a></p><p>${repo.fileCount} archivos · ${repo.stars} estrellas · ${repo.forks} forks</p><p>Señales: README ${repo.signals.readme ? 'sí' : 'no'}, pruebas ${repo.signals.tests ? 'sí' : 'no'}, CI ${repo.signals.ci ? 'sí' : 'no'}, licencia ${repo.signals.license ? 'sí' : 'no'}.</p>` : '<p>No se conectó un repositorio. Agrega una URL pública de GitHub para evaluar su madurez técnica.</p>';
  const market = result.market;
  document.getElementById('market-summary').innerHTML = `<p>Consulta: <b>${escapeHtml(market.query || 'sin consulta')}</b></p><p>${market.total || 0} resultados en GitHub.</p>${market.repositories.length ? `<ul>${market.repositories.map((item) => `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a> · ${item.stars} estrellas</li>`).join('')}</ul>` : '<p>No hubo comparables disponibles.</p>'}`;
  document.getElementById('analysis-results').hidden = false;
  document.getElementById('analysis-results').scrollIntoView({ behavior: 'smooth' });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  button.disabled = true;
  status.textContent = 'Inspeccionando fuentes y calculando índices...';
  try {
    const data = Object.fromEntries(new FormData(form).entries());
    data.documents = await readDocuments();
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'No se pudo analizar el proyecto.');
    render(payload.result);
    status.textContent = 'Análisis terminado.';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
