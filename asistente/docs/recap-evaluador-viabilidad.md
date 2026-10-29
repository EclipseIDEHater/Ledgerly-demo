# Evaluador de viabilidad de proyectos

## Propósito

El Evaluador de Viabilidad amplía Coach PMC para analizar un proyecto desde varias fuentes: contexto del producto, documentos del equipo y estructura de un repositorio público de GitHub.

El sistema no pretende declarar de forma absoluta que un producto es viable o inviable. Entrega un diagnóstico inicial, sustentado en señales observables, índices heurísticos, riesgos y próximos experimentos de validación.

## Cómo se usa

1. Ejecutar la aplicación desde `Asistente-páginas/`:

   ```bash
   npm start
   ```

2. Abrir `http://localhost:3001/analisis`.
3. Ingresar el producto, el mercado, la audiencia, el problema y la propuesta de valor.
4. Opcionalmente, agregar una URL pública de GitHub.
5. Opcionalmente, adjuntar documentos de texto del proyecto.
6. Seleccionar **Analizar viabilidad**.

En este MVP se aceptan documentos `.md`, `.txt`, `.json` y `.csv`. Los archivos se limitan por tamaño y cantidad. Los archivos PDF se identifican, pero no se procesan todavía.

## Flujo técnico

```text
Contexto del producto
        +
Repositorio público de GitHub
        +
Documentos del proyecto
        ↓
API /api/analyze
        ↓
Extracción de señales y evidencia
        ↓
Comparación exploratoria en GitHub
        ↓
Índices heurísticos y grafo de relaciones
        ↓
Diagnóstico, riesgos y próximos experimentos
```

El flujo detallado está en `docs/flujo-evaluacion-viabilidad.mmd`.

## Componentes implementados

### Interfaz

- `analysis.html`: formulario y visualización del diagnóstico.
- `analyzer.js`: lectura controlada de documentos, envío del análisis y renderizado de resultados.
- `styles.css`: estilos compartidos y componentes visuales del evaluador.
- Ruta disponible: `/analisis`.

### Backend

- `server.js`: agrega el endpoint `POST /api/analyze`.
- Valida que la URL pertenezca a `github.com`.
- Consulta los metadatos y el árbol de archivos del repositorio mediante la API pública de GitHub.
- No ejecuta el código recibido.
- Busca repositorios similares usando producto y mercado como consulta.
- Mantiene las credenciales de OpenAI en el servidor, si se incorporan análisis con IA posteriormente.

## Índices actuales

Cada índice se calcula entre 0 y 100:

- **Problema:** existencia de un problema explícito, documentos y señales de entrevistas o usuarios.
- **Solución:** definición del producto, funcionamiento y propuesta de valor.
- **Técnica:** cantidad de archivos, manifiestos, frontend o backend, pruebas y CI.
- **Validación:** CTA, flujo posterior, métricas y evidencia de pruebas con usuarios.
- **Mercado:** señal exploratoria basada en resultados de repositorios similares en GitHub.
- **Seguridad:** penaliza la presencia aparente de archivos `.env` rastreados y la ausencia de licencia.

El resultado general combina los índices con mayor peso para el problema, la solución, la madurez técnica y la validación.

## Salida del diagnóstico

El reporte muestra:

- Estado general: `Señales favorables`, `Requiere validación` o `Riesgo alto`.
- Puntaje general sobre 100.
- Puntaje individual por índice.
- Evidencia encontrada.
- Riesgos y vacíos.
- Repositorio conectado y señales técnicas detectadas.
- Proyectos comparables encontrados en GitHub.
- Grafo Mermaid que relaciona las señales con el resultado.
- Advertencia sobre el carácter heurístico del diagnóstico.

## Límites actuales

- Solo se analizan repositorios públicos de GitHub.
- GitHub se usa como proxy exploratorio, no como representación completa del mercado.
- No se consultan todavía fuentes comerciales, buscadores, bases de datos de startups o información de precios.
- El código no se ejecuta ni se somete todavía a análisis profundo de dependencias, seguridad o calidad.
- Los documentos PDF no se extraen.
- Los índices son reglas heurísticas y no un modelo estadístico validado.
- El resultado no reemplaza entrevistas, pruebas con usuarios, análisis financiero ni revisión experta.

## Próximas mejoras

1. Agregar autenticación OAuth de GitHub para analizar repositorios privados con consentimiento explícito.
2. Ejecutar análisis estático en un sandbox aislado y efímero.
3. Incorporar extracción de PDF y más formatos documentales.
4. Validar la respuesta de analizadores y almacenar la trazabilidad de cada evidencia.
5. Integrar fuentes de mercado configurables y mostrar la fecha de consulta.
6. Usar OpenAI para resumir evidencia y formular hipótesis, sin permitir que invente datos.
7. Guardar evaluaciones para comparar iteraciones del proyecto.
8. Añadir exportación del diagnóstico a Markdown, PDF o presentación.
9. Validar los índices contra proyectos reales del curso y ajustar sus pesos.

## Criterio de interpretación

Un puntaje alto no demuestra que el producto tendrá éxito. Indica que, con las fuentes entregadas, existen señales relativamente consistentes en varias dimensiones.

Un puntaje bajo tampoco demuestra que la idea deba descartarse. Señala qué supuestos son débiles y qué evidencia debería conseguir el equipo antes de invertir más en desarrollo.
