const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  });
}

const root = __dirname;
const port = Number(process.env.PORT || 3001);

const headers = {
  'Access-Control-Allow-Origin': `http://localhost:${port}`,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

function sendJson(response, status, body) {
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) reject(new Error('La solicitud es demasiado grande.'));
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function splitGithubUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
  } catch (error) {
    return null;
  }
}

async function githubJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'coach-pmc-analyzer' } });
  if (!response.ok) throw new Error(`GitHub respondió con ${response.status}.`);
  return response.json();
}

async function inspectGithubRepository(repoUrl) {
  const parts = splitGithubUrl(repoUrl);
  if (!parts) throw new Error('Usa una URL pública válida de github.com/organización/repositorio.');

  const base = `https://api.github.com/repos/${encodeURIComponent(parts.owner)}/${encodeURIComponent(parts.repo)}`;
  const [repository, tree] = await Promise.all([
    githubJson(base),
    githubJson(`${base}/git/trees/HEAD?recursive=1`)
  ]);
  const files = (tree.tree || []).filter((item) => item.type === 'blob').map((item) => item.path);
  const lower = files.map((file) => file.toLowerCase());
  const extensions = files.reduce((counts, file) => {
    const match = file.match(/\.([a-z0-9]+)$/i);
    if (match) counts[match[1].toLowerCase()] = (counts[match[1].toLowerCase()] || 0) + 1;
    return counts;
  }, {});

  return {
    name: repository.full_name,
    description: repository.description || '',
    url: repository.html_url,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    issues: repository.open_issues_count,
    updatedAt: repository.updated_at,
    private: repository.private,
    fileCount: files.length,
    files: files.slice(0, 200),
    extensions,
    signals: {
      readme: lower.some((file) => file === 'readme.md' || file.endsWith('/readme.md')),
      packageManifest: lower.some((file) => ['package.json', 'pyproject.toml', 'requirements.txt', 'go.mod', 'pom.xml'].includes(file.split('/').pop())),
      tests: lower.some((file) => /(^|\/)(test|tests|spec|__tests__)(\/|$)|\.(test|spec)\./.test(file)),
      ci: lower.some((file) => file.startsWith('.github/workflows/')),
      license: lower.some((file) => file === 'license' || file.startsWith('license.')),
      envTracked: lower.some((file) => file === '.env' || file.endsWith('/.env')),
      frontend: lower.some((file) => /\.(html|jsx|tsx|vue|svelte)$/.test(file)),
      backend: lower.some((file) => /(^|\/)(server|api|backend)(\/|$)|\.(go|py|java|rb)$/.test(file))
    }
  };
}

async function findSimilarRepositories(product, market) {
  const query = [product, market].filter(Boolean).join(' ').trim();
  if (!query) return { query: '', total: 0, repositories: [] };
  const data = await githubJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`);
  return {
    query,
    total: data.total_count || 0,
    repositories: (data.items || []).map((item) => ({ name: item.full_name, description: item.description || '', stars: item.stargazers_count, url: item.html_url }))
  };
}

function hasEvidence(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function buildAnalysis(input, repository, marketData) {
  const documents = Array.isArray(input.documents) ? input.documents : [];
  const documentText = documents.map((document) => `${document.name || ''}\n${document.content || ''}`).join('\n').slice(0, 80_000);
  const context = `${input.product} ${input.audience} ${input.problem} ${input.valueProposition} ${documentText}`;
  const repo = repository || { fileCount: 0, files: [], extensions: {}, signals: {} };
  const signals = repo.signals;
  const problem = clamp((input.problem ? 45 : 0) + (hasEvidence(context, [/entrevist|interview/i, /usuario|cliente|user|customer/i, /evidencia|evidence/i, /validaci|validation/i]) ? 35 : 0) + (documents.length ? 20 : 0));
  const solution = clamp((input.valueProposition ? 35 : 0) + (input.product ? 25 : 0) + (input.howItWorks ? 25 : 0) + (signals.frontend ? 15 : 0));
  const technical = clamp((repo.fileCount ? 20 : 0) + (signals.packageManifest ? 15 : 0) + (signals.tests ? 20 : 0) + (signals.ci ? 15 : 0) + (signals.license ? 10 : 0) + (signals.frontend || signals.backend ? 20 : 0));
  const validation = clamp((input.cta ? 20 : 0) + (input.purchaseFlow ? 20 : 0) + (hasEvidence(context, [/métrica|metric|conversi|conversion|tracción|traction/i]) ? 30 : 0) + (hasEvidence(context, [/entrevist|interview|prueba con usuarios|user test/i]) ? 30 : 0));
  const market = clamp(Math.min(60, (marketData.total ? 20 : 0) + Math.min(40, marketData.repositories.reduce((sum, item) => sum + Math.log10(item.stars + 1) * 8, 0))));
  const security = clamp(100 - (signals.envTracked ? 55 : 0) - (repo.fileCount && !signals.license ? 10 : 0));
  const overall = clamp(problem * 0.25 + solution * 0.2 + technical * 0.2 + validation * 0.2 + market * 0.1 + security * 0.05);
  const risks = [];
  if (!problem || !hasEvidence(context, [/entrevist|interview|usuario|cliente/i])) risks.push('El problema está declarado, pero falta evidencia suficiente de usuarios.');
  if (!validation) risks.push('No se identifican métricas o un evento de conversión para validar la propuesta.');
  if (!signals.tests) risks.push('El repositorio no muestra una estructura clara de pruebas automatizadas.');
  if (signals.envTracked) risks.push('El repositorio parece contener un archivo .env; revise y rote cualquier secreto.');
  if (!marketData.total) risks.push('No se encontraron señales comparables en GitHub; la comparación de mercado es incompleta.');

  const status = overall >= 70 ? 'Señales favorables' : overall >= 45 ? 'Requiere validación' : 'Riesgo alto';
  const evidence = [
    input.problem ? 'El equipo proporcionó un problema explícito.' : 'No se proporcionó un problema explícito.',
    `${documents.length} documento(s) fueron recibidos para el análisis.`,
    repository ? `GitHub reportó ${repo.fileCount} archivo(s), ${repo.stars} estrella(s) y ${repo.forks} fork(s).` : 'No se conectó un repositorio de GitHub.',
    `${marketData.total} repositorio(s) aparecieron como señal de similitud para “${marketData.query || 'la búsqueda'}”.`
  ];
  const graph = `flowchart TD\n    P[Problema declarado] --> E[${problem}/100 · Evidencia del problema]\n    E --> S[${solution}/100 · Ajuste problema-solución]\n    S --> T[${technical}/100 · Madurez técnica]\n    E --> V[${validation}/100 · Capacidad de validación]\n    T --> R[${security}/100 · Higiene básica del repositorio]\n    M[${market}/100 · Señal exploratoria de mercado] --> O[${overall}/100 · ${status}]\n    V --> O\n    R --> O\n    T --> O\n    O --> N[Próximos experimentos y decisiones]`;
  return { status, overall, indices: { problem, solution, technical, validation, market, security }, evidence, risks, repository, market: marketData, graph, disclaimer: 'Los índices son heurísticos y la señal de mercado usa GitHub como proxy. No sustituyen entrevistas, pruebas con usuarios ni análisis comercial.' };
}

async function analyzeProject(input) {
  const repository = input.repoUrl ? await inspectGithubRepository(input.repoUrl) : null;
  let marketData = { query: '', total: 0, repositories: [] };
  try {
    marketData = await findSimilarRepositories(input.product, input.market);
  } catch (error) {
    marketData.error = error.message;
  }
  return buildAnalysis(input, repository, marketData);
}

async function generateWithOpenAI(input) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Falta OPENAI_API_KEY. Puedes usar el modo local mientras configuras OpenAI.');
  }

  const prompt = `Actúa como estratega senior de producto, copywriting y validación. Usa solo la información entregada: no inventes testimonios, clientes, cifras ni resultados. Si falta evidencia, marca la recomendación como hipótesis. Responde exactamente con JSON válido, sin markdown, y estas claves: title, subtitle, problem, causes (arreglo de 3 strings), implications (arreglo de 3 strings), valueProposition, visual, socialProof, cta, ctaRationale, features (arreglo de 3 strings), objections (arreglo de 3 strings), risksOfInaction (arreglo de 3 strings), benefitsOfAction (arreglo de 3 strings), purchaseFlow (arreglo de 4 strings), faq (arreglo de 3 objetos con question y answer), trustMetrics (arreglo de 3 objetos con name, why y target — deben cubrir tasa de conversión, duración en la página y tasa de rebote, conectadas con los insights de entrevistas cuando aplique), tractionPlan (arreglo de 4 strings), foundersNote, nextSteps (arreglo de 3 strings).

Producto: ${input.product}
Audiencia: ${input.audience}
Insights de entrevistas: ${input.interviewInsights}
Problema: ${input.problem}
Cómo funciona: ${input.howItWorks}
Propuesta de valor actual: ${input.valueProposition}
Objeción principal: ${input.objection}
Prueba social disponible: ${input.socialProof}
Riesgos de no tomar acción: ${input.risks}
Beneficios de tomar acción: ${input.benefits}
CTA deseado: ${input.cta}
Flujo actual o deseado para comprar: ${input.purchaseFlow}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Eres un experto en copywriting y conversión. Sé específico, claro y honesto.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI respondió con ${response.status}.`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function generateTitles(input) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Falta OPENAI_API_KEY.');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Eres un experto en titulares de landing pages. Sé claro, específico y honesto. No inventes resultados.' },
        { role: 'user', content: `Propón dos titulares en español para este producto. A debe priorizar claridad y propuesta de valor. B debe enfatizar el dolor o riesgo de no actuar. Devuelve únicamente JSON válido con las claves a y b, ambas strings de máximo 12 palabras. Producto: ${input.product}. Audiencia: ${input.audience}. Problema: ${input.problem}. Propuesta de valor: ${input.valueProposition}.` }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI respondió con ${response.status}.`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function serveStatic(request, response) {
  const route = request.url.split('?')[0];
  const routes = { '/': '/index.html', '/integraciones': '/integraciones.html', '/ab': '/ab.html', '/analisis': '/analysis.html', '/demo-contable': '/demo-contable.html' };
  const requested = routes[route] || route;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mmd': 'text/plain; charset=utf-8' };
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'text/plain; charset=utf-8' });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, headers);
    response.end();
    return;
  }

  if (request.method === 'POST' && request.url === '/api/generate') {
    try {
      const input = JSON.parse(await readBody(request));
      const result = await generateWithOpenAI(input);
      sendJson(response, 200, { result });
    } catch (error) {
      sendJson(response, 503, { error: error.message });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/titles') {
    try {
      const input = JSON.parse(await readBody(request));
      const titles = await generateTitles(input);
      sendJson(response, 200, { titles });
    } catch (error) {
      sendJson(response, 503, { error: error.message });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/analyze') {
    try {
      const input = JSON.parse(await readBody(request));
      const result = await analyzeProject(input);
      sendJson(response, 200, { result });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  if (request.method === 'GET') serveStatic(request, response);
  else sendJson(response, 405, { error: 'Método no permitido.' });
});

server.listen(port, () => {
  console.log(`Asistente de páginas: http://localhost:${port}`);
});
