# Claude SEO como capa de capacidades de VALME Search OS

Fecha de inspección: 23 de septiembre de 2026. Estado: **snapshot importado; integración de ejecución pendiente**.

**Los agentes ejecutan. El Project Manager dirige.** Claude SEO aporta conocimiento, herramientas y referencias para construir agentes VALME. No sustituye los ocho Agent Pods, el control de accesos, los estados de diagnóstico, las aprobaciones ni el Project Manager.

## 1. Procedencia, alcance y decisión de arquitectura

| Dato | Valor |
| --- | --- |
| Repositorio VALME | `JGMC96/valme-search-os`, raíz que contiene `package.json`, `src/`, `public/`, `docs/` y `AGENTS.md` |
| Base examinada | `main`, commit `d9c69413bd3145f61648dee93bc7403ff0fd43c0` |
| Rama de esta integración | `chore/vendor-claude-seo` |
| Origen | [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) |
| Commit upstream | [`92795530b4cc92c6bf7a2435b82c15b003e71181`](https://github.com/AgriciDaniel/claude-seo/commit/92795530b4cc92c6bf7a2435b82c15b003e71181), 11 de septiembre de 2026 |
| Árbol upstream | `808f1d93273a163197c37186f8aa9e09c6a653b3` |
| Versión declarada | `2.3.1`, coincidente en `pyproject.toml` y `.claude-plugin/plugin.json`; el commit es la referencia reproducible |
| Ubicación | [skills/external/claude-seo/](../skills/external/claude-seo/) |
| Contenido | Los 408 archivos versionados, 4.527.656 bytes: documentación, assets, scripts, tests, extensiones y configuración incluidos |
| Integridad | [Manifiesto externo al snapshot](../skills/external/claude-seo.upstream.json), con ruta, modo Git, tamaño, SHA-256 y SHA-1 de blob por archivo |
| Cambios en upstream | Ninguno; no se incluye su historial `.git`, ni archivos generados, ni dependencias instaladas |

No se ejecutaron instaladores, scripts SEO, hooks, sincronizaciones FLOW, navegadores ni llamadas a APIs de clientes. No se registró el plugin ni se añadió a MCP, al frontend, al servidor o al sistema de skills de quien desarrolle el proyecto. La presencia de archivos no convierte las capacidades en operativas. Esta entrega no incluye un worker Python ni un adaptador de agentes.

Se conserva todo para comparar actualizaciones sin renombrados ni reescrituras. Las acciones «adaptar», «integrar» y «descartar» de las tablas expresan decisiones para la siguiente fase; **todos los componentes siguen conservados en este snapshot**. Descartar un uso arquitectónico no significa borrar sus archivos.

## 2. Inspección del proyecto antes de modificarlo

La raíz de referencia es el repositorio GitHub fijado arriba. Una copia local anterior no representaba el `main` actual y no se utilizó como base. La preparación local de esta entrega es un área de cambios, no evidencia del estado desplegado.

| Responsabilidad | Ubicación real antes de esta entrega | Situación observada |
| --- | --- | --- |
| Aplicación | `src/routes/index.tsx`, `src/routes/__root.tsx`, `src/server.ts`, `src/start.ts` | React/TanStack Start con Vite y TypeScript; la ruta principal sirve la interfaz V2 como HTML |
| Interfaz y procesos V2 | `public/v2/index.html`, `public/v2/scripts/app.js`, `onboarding.js`, `diagnostico.js`, `public/v2/styles/`, `public/v2/assets/` | Onboarding, diagnóstico, accesos, supervisión y planes de demostración; aquí están la identidad y los logotipos |
| Agentes | Catálogo `ESPECIALIDADES` en `src/lib/mcp/data.ts` y representación en la interfaz V2 | Ocho especialidades declaradas; no hay directorio de agentes ejecutables ni worker de agentes |
| Skills y prompts | No existen directorios raíz `skills/` o `prompts/` | Hay texto de instrucciones del MCP en `src/lib/mcp/index.ts`; no es una biblioteca SEO ni un scheduler |
| Herramientas | `src/lib/mcp/tools/` | Cuatro herramientas: `list_services`, `list_onboarding_steps`, `explain_diagnostic_flow`, `list_supervision_rules`; consultas sobre datos declarados ficticios |
| MCP | `src/lib/mcp/index.ts`, `src/routes/mcp.ts`, `src/routes/[.well-known]/oauth-protected-resource.ts` | Servidor con configuración OAuth; no expone `/seo` ni ejecuta auditorías de Claude SEO |
| Servicios e integraciones | `src/integrations/supabase/`, `src/integrations/lovable/`, `src/lib/` | No hay carpeta `services/`; autenticación, clientes y utilidades existentes se conservan |
| Persistencia/configuración de datos | `drizzle/`, `drizzle.config.ts`, `supabase/config.toml` | Migraciones para clientes/tareas/fases y restricciones RLS; no constituyen un motor SEO |
| Documentación | `docs/00-product/`, `01-roadmap/`, `02-design/`, `03-architecture/`, `04-operations/`, `06-qa/`, `roadmap.md` | Gobierno del PM, diseño y evolución; `overview.md` todavía describe rutas de una versión estática anterior |
| Configuración | `package.json`, `bun.lock`, `bunfig.toml`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierignore`, `.prettierrc`, `AGENTS.md` | Stack JavaScript/TypeScript; no entorno Python ni registro de plugins Claude |
| SEO/auditorías previas | `public/v2/scripts/diagnostico.js`, `src/lib/mcp/tools/explain-diagnostic-flow.ts` | Flujo de diagnóstico y cobertura por servicio; no carpeta de crawling, medición real o conectores GSC/GA4 |
| Plantillas y preview | `templates/`, `preview/` | Material del producto; no se utiliza para alojar la dependencia externa |

La discrepancia documental se registra aquí sin reescribir la arquitectura general en esta entrega. No se infiere que una migración o la declaración de un conector prueben su despliegue o acceso a datos reales.

### Cambios propios de VALME

- `skills/external/claude-seo/`: snapshot completo sin cambios.
- `skills/external/claude-seo.upstream.json`: procedencia e integridad, fuera del snapshot.
- `skills/external/README.md`: límites y mantenimiento.
- `docs/claude-seo-integration.md` y enlace desde `docs/README.md`.
- `.prettierignore` y la lista global de exclusiones de `eslint.config.js`: protegen únicamente el snapshot de formateo/lint propios de VALME. El comando existente `format` recorre el repositorio y podría reescribir material upstream sin esta exclusión.

`tsconfig.json` ya limita sus entradas a `src/` y configuraciones concretas. No hace falta modificarlo. No se cambian dependencias, identidad, frontend, agentes VALME, migraciones, permisos ni las cuatro herramientas MCP. Los workflows dentro de `skills/external/claude-seo/.github/` no se copian a `.github/workflows/`.

## 3. Qué contiene Claude SEO

Rutas de esta sección y de los inventarios: relativas a `skills/external/claude-seo/`.

| Categoría | Ubicación | Naturaleza y límite |
| --- | --- | --- |
| Conocimiento/instrucciones | `skills/*/SKILL.md`, `skills/*/references/`, `skills/seo-plan/assets/`, `schema/templates.json`, `pdf/google-seo-reference.md`, `data/google-updates.json` | 25 entradas en `skills/`, incluido el router, FLOW y dos espejos de extensiones. Markdown, criterios, ejemplos y plantillas; no son funciones invocables por VALME |
| Agentes | `agents/*.md` | 18 definiciones con instrucciones, herramientas, modelos Claude y límites de turnos; siguen dentro del vendor |
| Scripts ejecutables | `scripts/` | 55 scripts Python y el lanzador `scripts/claude-seo`; más 7 scripts Python en Banana y un hook Python |
| Herramientas | Fetch/render/parse, APIs, controles de contenido/schema, reportes | Funciones y CLI reales, con dependencias y efectos distintos; ver inventario de scripts |
| Extensiones externas | `extensions/` | 8 directorios; MCP, APIs y runners opcionales. DataForSEO y Banana incluyen copias espejo de skills/agentes presentes en la raíz upstream |
| Reporting | `google_report.py`, `drift_report.py`, plantillas y contratos de artefactos | Markdown/JSON y generación HTML/PDF/XLSX; diseño upstream, pendiente de adaptación a identidad VALME |
| Tests | `tests/` | 59 archivos `test_*.py`, fixtures y guías; no equivalen a pruebas ejecutadas en VALME |
| Configuración de Claude Code | `.claude-plugin/`, `CLAUDE.md`, `AGENTS.md`, `hooks/`, `install.*`, `uninstall.*` | Marketplace, instrucciones, hook PostToolUse, instalación y rutas de usuario; se conservan como datos, no como configuración VALME |
| Entorno y mantenimiento | `pyproject.toml`, `requirements.txt`, `uv.lock`, `.github/`, `.devcontainer/`, scripts de consistencia y releases | Desarrollo y distribución upstream; no sustituyen el build ni CI del producto |
| Documentación | `README.md`, `docs/`, `CHANGELOG.md`, `SECURITY.md`, `PRIVACY.md`, `CONTRIBUTING.md` | Referencia del proveedor; sus afirmaciones y cifras no se convierten automáticamente en criterios de aceptación VALME |

### Dependencias y configuración

`pyproject.toml` declara Python >=3.10. `requirements.txt` utiliza rangos acotados, no un cierre reproducible de todas las dependencias transitivas. Conservar `uv.lock` no demuestra por sí solo un entorno resuelto y verificado.

| Grupo | Dependencias declaradas o detectadas | Uso futuro |
| --- | --- | --- |
| HTTP/HTML | requests, urllib3, beautifulsoup4, lxml, lxml_html_clean | Fetch, parseo y controles de URL |
| Render/extracción | playwright, Chromium descargado aparte, trafilatura, htmldate, courlan | Páginas con JavaScript, texto y capturas |
| Reportes | matplotlib, numpy, weasyprint, openpyxl; librerías de sistema requeridas por WeasyPrint | Gráficos, HTML/PDF/XLSX |
| Google | google-api-python-client, google-auth, google-auth-httplib2, google-analytics-data, google-ads | GSC, GA4 y Ads; credenciales y permisos por propiedad |
| Estado local | SQLite y librería estándar Python | Baselines drift, cachés y configuración; necesitan aislamiento por cliente antes de uso SaaS |
| Extensiones | Node/npm para MCP y Unlighthouse; Gemini/API REST para Banana | Versiones del snapshot: DataForSEO MCP 2.8.10, nanobanana MCP 1.1.1, Firecrawl MCP 3.11.0, Ahrefs MCP 0.0.11, Unlighthouse 0.13.5. Son pins upstream, no una recomendación de actualización |
| Herramientas opcionales | exiftool para IPTC; `gh` para ciertas sincronizaciones; `claude-blog` para ejecución editorial opcional | No instaladas ni requeridas para almacenar la copia |
| Tests | pytest y dependencias runtime; algunas comprobaciones incluyen red y herramientas del sistema | Evaluar en un entorno independiente antes de activar capacidades |

El runtime upstream usa `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, un entorno Python gestionado y directorios de usuario como `~/.claude/` y `~/.config/claude-seo/`. Hay instaladores que modifican settings y descargan dependencias. Nada de ello se ha ejecutado. No se deben reutilizar esas ubicaciones compartidas como almacén de secretos o resultados de múltiples clientes.

## 4. Reglas del mapa de integración

Pods: **P1** Onboarding y accesos; **P2** Auditoría SEO; **P3** Estrategia y planificación; **P4** SEO técnico; **P5** Contenidos; **P6** AEO/GEO y citabilidad; **P7** Analítica e informes; **P8** Control de calidad. Son los ocho nombres del catálogo VALME, no nombres nuevos de agentes.

Acciones: **conservar** como fuente; **adaptar** instrucciones/contratos fuera del vendor; **integrar** herramienta mediante un futuro adaptador; **descartar** el uso como autoridad/orquestador VALME, conservando sus archivos.

En las tablas, «Auto» describe viabilidad futura, no un permiso concedido ni una función ya activa:

- **L**: lectura/procesamiento automatizable cuando exista encargo autorizado, alcance y accesos válidos. El resultado sigue siendo una propuesta y pasa por calidad/PM.
- **B**: producción de borradores automatizable; PM revisa estrategia, contenido, diseño o presupuesto antes de usarlo.
- **C**: requiere conector y cuenta configurados por el responsable, autorización de datos y presupuesto/cuotas aprobados. Después podría automatizar lecturas dentro de ese alcance.
- **H**: aprobación humana expresa para la acción de escritura/envío/publicación/instalación. No se deriva de aprobar un análisis.

Estas reglas aplican también a agentes y scripts de soporte. Ninguna fila autoriza ejecución en esta entrega. Un permiso perdido bloquea solo trabajo dependiente y obliga a reevaluar su cobertura, igual que en el flujo VALME actual.

## 5. Correspondencia de los 25 skills

| Claude SEO | Tipo | Agent Pod VALME relacionado | Acción futura |
| --- | --- | --- | --- |
| `skills/seo/SKILL.md` | Skill/router | P2, P8; PM | Conservar taxonomía; descartar como orquestador principal |
| `skills/seo-audit/SKILL.md` | Skill | P2, P8 | Adaptar contrato de auditoría |
| `skills/seo-page/SKILL.md` | Skill | P2, P4 | Adaptar checklist de página |
| `skills/seo-technical/SKILL.md` | Skill | P4 | Adaptar criterios; integrar herramientas seleccionadas |
| `skills/seo-content/SKILL.md` | Skill | P5, P6, P8 | Adaptar revisión editorial |
| `skills/seo-content-brief/SKILL.md` | Skill | P3, P5 | Adaptar brief |
| `skills/seo-schema/SKILL.md` | Skill | P4, P6, P8 | Adaptar recomendaciones; integrar validadores |
| `skills/seo-sitemap/SKILL.md` | Skill | P4, P8 | Adaptar validación y borradores |
| `skills/seo-images/SKILL.md` | Skill | P4, P5 | Adaptar checklist de imágenes |
| `skills/seo-geo/SKILL.md` | Skill | P6 | Adaptar criterios de citabilidad |
| `skills/seo-local/SKILL.md` | Skill | P2, P3, P4 | Adaptar análisis local |
| `skills/seo-maps/SKILL.md` | Skill | P2, P3, P7 | Adaptar; integrar fuentes autorizadas |
| `skills/seo-backlinks/SKILL.md` | Skill | P2, P3, P7, P8 | Adaptar evidencia; integrar fuentes |
| `skills/seo-cluster/SKILL.md` | Skill | P3, P5 | Adaptar planificación; descartar ejecución editorial automática sin PM |
| `skills/seo-sxo/SKILL.md` | Skill | P3, P5, P8 | Adaptar análisis de intención/experiencia |
| `skills/seo-drift/SKILL.md` | Skill | P4, P7, P8 | Integrar después de aislar persistencia |
| `skills/seo-ecommerce/SKILL.md` | Skill | P2, P4, P5 | Adaptar; integrar validadores y datos |
| `skills/seo-hreflang/SKILL.md` | Skill | P4, P5, P8 | Adaptar criterios internacionales |
| `skills/seo-plan/SKILL.md` | Skill | P3 | Adaptar a plan VALME versionado |
| `skills/seo-programmatic/SKILL.md` | Skill | P3, P4, P5, P8 | Conservar y adaptar propuestas |
| `skills/seo-competitor-pages/SKILL.md` | Skill | P3, P5, P8 | Adaptar comparativas con evidencia |
| `skills/seo-google/SKILL.md` | Skill | P1, P4, P7 | Integrar APIs por separado; adaptar setup |
| `skills/seo-flow/SKILL.md` | Skill/framework | P3, P5, P6 | Conservar prompts atribuidos; descartar gobierno alternativo |
| `skills/seo-dataforseo/SKILL.md` | Skill/espejo | P2, P3, P6, P7 | Conservar; integrar extensión opcional |
| `skills/seo-image-gen/SKILL.md` | Skill/espejo | P5 | Conservar; adaptar flujo creativo y aprobación |

### Datos, herramientas, outputs y conflictos por skill

| Componente | Qué hace y datos necesarios | Herramientas/dependencias externas | Auto / intervención humana | Output upstream | Conflicto o adaptación necesaria |
| --- | --- | --- | --- | --- | --- |
| `seo` | Enruta comando+URL, detecta negocio y sintetiza especialistas | Harness Claude, herramientas de lectura/Bash; scripts y subagentes | L/B; PM decide alcance | Respuesta sintetizada, puntuación y prioridades | Su delegación, detección de credenciales y puntuación no dirigen VALME; no autoactivar |
| `seo-audit` | Auditoría de dominio, páginas, negocio y evidencias por categoría | Renderer, parseo, especialistas; APIs opcionales | L/C; P8 valida cobertura, PM revisa | `FULL-AUDIT-REPORT.md`, `ACTION-PLAN.md`, `audit-data.json`, hallazgos y capturas | El plan generado es recomendación, nunca un plan VALME aprobado; crawl descrito no es un job durable |
| `seo-page` | Revisa SEO on-page a partir de URL/HTML y contexto | Fetch/render/parse; modelo | L; revisión de hallazgos | Análisis de página y correcciones priorizadas | Señales de HTML no demuestran indexación ni métricas reales |
| `seo-technical` | Crawlabilidad, indexabilidad, canonicals, robots, redirects, JS, móvil, cabeceras | Render, parseo, sitemap discovery; PSI/CrUX si disponibles | L/C; H para modificar web | Hallazgos técnicos y recomendaciones | Aplicar scope, evidencia y límites de rastreo VALME; no cambiar robots o redirecciones |
| `seo-content` | Calidad, E-E-A-T, legibilidad, claims y limpieza de borradores; texto/URL, autoría y fuentes | `content_quality.py`, `content_verify.py`, `content_humanize.py`; fuentes externas opcionales | L/B; humano valida hechos y edición | Evaluación, huecos de citas y borrador limpio | Heurísticas no son un score oficial Google; no borrar atribuciones/disclosures ni editar el original sin revisión |
| `seo-content-brief` | Brief nuevo o mejora; keyword/URL, idioma, mercado, tipo de página y competidores | WebSearch/fetch; DataForSEO/Ahrefs opcionales | L/B/C; PM aprueba brief | Brief con gaps, outline, metas y enlaces | Densidad/longitud son criterios upstream a evaluar, no reglas universales ni sustituto de evidencia |
| `seo-schema` | Detecta y propone JSON-LD; HTML y hechos verificables del negocio | `schema/templates.json`, `schema_generate.py`, validadores | L/B; H para insertar marcado | `SCHEMA-REPORT.md`, `generated-schema.json` | Validación parcial; no garantiza rich results; no inventar ratings ni propiedades |
| `seo-sitemap` | Descubre/valida XML y propone mapa; dominio, URLs y arquitectura | `sitemap_discovery.py`, fetch/parse XML; GSC opcional | L/B/C; H para publicar/enviar | `VALIDATION-REPORT.md`, `sitemap.xml` | Generar archivo no publica ni registra sitemap; umbrales de páginas son heurísticos |
| `seo-images` | Alt, formato, tamaño, lazy loading y contexto; páginas e imágenes | HTML/render; análisis visual | L; B para propuestas, H para cambios | Inventario de problemas y recomendaciones | No confundir inspección del markup con medición de transferencia o calidad visual |
| `seo-geo` | Acceso de crawlers IA, pasajes citables, fuentes, marca; URL/texto y entidades | Render/fetch, robots, referencias; APIs de menciones opcionales | L/B/C; revisión editorial | `GEO-ANALYSIS.md` y mejoras | Citabilidad no prueba que un LLM cite la marca; `llms.txt` opcional no acredita visibilidad |
| `seo-local` | GBP/NAP, reseñas, citas, schema y páginas locales; negocio, URL y ubicaciones | Fetch y fuentes públicas; proveedores opcionales | L/C; H para cambios GBP | `LOCAL-SEO-ANALYSIS-{domain}.md` | No deducir acceso a GBP ni legitimidad de sedes de un nombre; requiere datos verificados |
| `seo-maps` | Geo-grid, GBP, reseñas y competidores; negocio, keyword y coordenadas | DataForSEO y fuentes/APIs gratuitas documentadas | L/C; PM fija radio, muestra y coste | `MAPS-ANALYSIS-{domain}.md`, tabla/grid | Localización y fecha condicionan rankings; valores por defecto no sustituyen mercado del onboarding |
| `seo-backlinks` | Perfil y gaps; dominio, competidores y links conocidos | Common Crawl, Moz, Bing, Keywords Everywhere OPR, DataForSEO; verificador | L/C; H para acciones externas | Informe de perfil, procedencia y links verificados | Common Crawl aquí aporta métricas de grafo, no un listado completo de backlinks; OPR no es keyword research; no desautorizar links automáticamente |
| `seo-cluster` | Expande semilla, agrupa por SERP overlap y propone pilares/enlaces | WebSearch o DataForSEO; `claude-blog` opcional fuera del repo | L/B/C; PM aprueba arquitectura y contenido | `cluster-plan.json/.md`, `cluster-map.html`, briefs, scorecard | Sin runner dedicado de clustering; ejecución opcional puede escribir artículos y enlaces, y debe quedar desacoplada |
| `seo-sxo` | Compara intención SERP y tipo de página; URL, keyword y personas | WebSearch/render, referencias de personas/wireframes | L/B; PM revisa hipótesis | Evaluación de intención, user stories y wireframe propuesto | Personas y scores son hipótesis, no resultados de investigación o conversión |
| `seo-drift` | Captura/compara baseline; URL, snapshot y fecha | `drift_baseline/compare/history/report.py`, SQLite, render, PSI opcional | L/C; humano decide baseline válido y remediación | JSON de baseline/diff, historial, HTML | No trae scheduler VALME; almacenamiento local compartido debe sustituirse o aislarse |
| `seo-ecommerce` | Producto, ofertas, marketplace y schema; URLs, catálogo y mercado | Validador product, UCP checker; DataForSEO Merchant opcional | L/C/B; H para cambios catálogo/precio | Hallazgos y gaps marketplace | Datos de terceros no autorizan cambios de precio; separar Google Shopping/Amazon de tienda cliente |
| `seo-hreflang` | Idiomas/regiones, retorno, paridad y formatos; URLs por locale | Fetch/render, XML y referencias culturales | L/B; H para publicar | Diagnóstico y propuesta de tags/sitemap hreflang | Mercado/idioma deben venir del onboarding; inferencias culturales requieren revisión |
| `seo-plan` | Objetivos, competidores, arquitectura y calendario; negocio, presupuesto, KPIs y diagnóstico | Plantillas sectoriales, búsqueda, DataForSEO opcional | B/C; PM aprueba versión | `SEO-STRATEGY.md`, `COMPETITOR-ANALYSIS.md`, `CONTENT-CALENDAR.md`, `IMPLEMENTATION-ROADMAP.md`, `SITE-STRUCTURE.md` | No saltar diagnóstico validado ni convertir estimaciones en resultados o presupuesto aprobado |
| `seo-programmatic` | Diseña plantillas a escala; dataset, URLs, calidad y enlaces | Modelo, fuentes CSV/JSON/API/BD aportadas | B; H antes de generar/publicar a escala | Propuesta de arquitectura/plantillas y quality gates | No incluye un pipeline de publicación VALME; evitar expansión fuera del alcance y contenido sin valor |
| `seo-competitor-pages` | Comparativas/alternativas; productos, fuentes y diferencias verificadas | Búsqueda/fetch y modelo | B; revisión editorial/PM | `COMPARISON-PAGE.md`, `comparison-schema.json` | Afirmaciones comerciales requieren evidencia y fecha; no publicar automáticamente |
| `seo-google` | Mediciones Google; URLs, propiedades, fechas y autorizaciones | Scripts PSI/CrUX/GSC/GA4/Ads/NLP/YouTube; Google Cloud | L/C; H para Indexing API y setup | JSON por API, informes Markdown, HTML/PDF/XLSX | No heredar credenciales de usuario ni scope de escritura para lectura; APIs/cuotas/costes deben verificarse por servicio |
| `seo-flow` | Selecciona prompts Find/Leverage/Optimize/Win/Local; objetivo y evidencia | Referencias incluidas; `sync_flow.py` consulta GitHub si se ejecuta | B; H para modificar snapshot/sincronizar | Análisis/borradores con etapa y atribución | Framework auxiliar, no reemplazo del PM. No auto-sincronizar; preservar CC BY 4.0 |
| `seo-dataforseo` | SERP, keywords, backlinks, negocio y menciones; consulta, país, idioma y presupuesto | MCP DataForSEO; normalizador y cost tracker | L/C; PM autoriza presupuesto | Datos/tablas con fuente y coste | Guardas de coste locales no son un presupuesto transaccional de VALME; defaults US/en requieren adaptación |
| `seo-image-gen` | Genera propuestas/imágenes SEO; brief, assets, formato y uso | Banana/Gemini, MCP o scripts de fallback | B/C; H para generación facturable fuera de presupuesto y publicación | Imágenes, prompts y checklist SEO | No aplicar su dirección creativa a la identidad/logotipos VALME; plan del agente y generación son acciones separadas |

## 6. Los 18 agentes upstream permanecen separados

Cada archivo de esta tabla está en `agents/`. Son especificaciones Markdown; no procesos en ejecución. «Adaptar» significa extraer criterios para futuros agentes VALME, sin registrar estos nombres como Pods. Datos, permisos y dependencias de los skills correspondientes aplican también aquí.

| Claude SEO / tipo | Pod / acción | Función y datos | Herramientas / dependencias | Auto / humano | Output y conflicto particular |
| --- | --- | --- | --- | --- | --- |
| `seo-technical.md` / agente | P4 / adaptar | Crawlabilidad/indexabilidad; URLs/HTML | Bash + render/parse/sitemap | L; H para cambios | Hallazgos técnicos; no permisos de sistema amplios por heredar Bash |
| `seo-content.md` / agente | P5, P8 / adaptar | E-E-A-T/profundidad; texto y autoría | Lectura, scripts de contenido; modelo | L/B; revisar hechos | Evaluación y findings; score heurístico |
| `seo-schema.md` / agente | P4, P6 / adaptar | Marcado; HTML y datos del negocio | Scripts/schema templates | L/B; H para insertar | Findings/JSON-LD; no publicar ni afirmar elegibilidad garantizada |
| `seo-sitemap.md` / agente | P4, P8 / adaptar | XML/arquitectura; inventario URLs | Discovery y fetch | L/B; H publicar/enviar | Hallazgos y propuesta XML; generar no equivale a enviar |
| `seo-performance.md` / agente | P4, P7 / adaptar | Rendimiento; URLs, dispositivo y ventanas | PSI/CrUX, Playwright | L/C; revisar interpretación | Findings de performance; separar laboratorio/campo |
| `seo-visual.md` / agente | P4, P8 / adaptar | Móvil/CTA/layout; URL y viewports | Playwright/Chromium, screenshot/render | L; instalación H | Capturas y findings; no activar su instrucción de instalar paquetes |
| `seo-geo.md` / agente | P6 / adaptar | Bots IA/citabilidad; URL, robots, texto | Render/fetch y referencias | L/B/C; revisión | Findings GEO; no garantizar menciones |
| `seo-local.md` / agente | P2, P3 / adaptar | Negocio local/NAP; URL, sedes y evidencia | Fetch y fuentes públicas | L/C; cambios H | Findings locales; sin acceso GBP implícito |
| `seo-maps.md` / agente | P2, P7 / adaptar | Geo-grid/reseñas; negocio y ubicación | DataForSEO y APIs públicas | L/C; coste/muestra PM | Findings/grid; no ampliar geografía sin autorización |
| `seo-backlinks.md` / agente | P2, P7, P8 / adaptar | Perfil; dominio y links | Moz/Bing/Common Crawl/verificación | L/C; disavow/envíos H | Hallazgos multifuente; confianza upstream no amplía permisos |
| `seo-cluster.md` / agente | P3, P5 / adaptar | Agrupación SERP; semillas y mercado | WebSearch/DataForSEO, lectura/escritura | L/B/C; plan PM | Clusters/enlaces; no activar creación editorial automática |
| `seo-sxo.md` / agente | P3, P5 / adaptar | Ajuste intención/página; URL/keyword | WebSearch/render | L/B; validar personas | Hipótesis UX y findings; scores no son datos de usuario |
| `seo-drift.md` / agente | P4, P8 / adaptar | Regresiones; URL y baseline | Scripts drift/SQLite | L/C; baseline PM | Diff/findings; no scheduler ni aislamiento SaaS incluidos |
| `seo-ecommerce.md` / agente | P2, P4 / adaptar | Producto/marketplace; catálogo/URL | Schema/UCP/DataForSEO | L/C/B; cambios H | Findings de producto; no tocar catálogo/precios |
| `seo-google.md` / agente | P1, P7 / adaptar | Datos Google; propiedades y credenciales por cliente | Google auth/PSI/CrUX/GSC/GA4 | L/C; setup/escrituras H | Datos y findings; detectar una credencial no autoriza utilizarla |
| `seo-flow.md` / agente | P3, P5 / conservar/adaptar | Selección de prompts; etapa, URL, evidencia | Read/WebFetch/referencias CC BY | B; PM decide | Análisis con atribución; no gobernar ciclo del proyecto |
| `seo-dataforseo.md` / agente | P2, P3, P7 / adaptar | Consultas a proveedor; mercado/consulta | `mcp__dataforseo__*` upstream | L/C; presupuesto PM | Datos normalizados; wildcard debe convertirse en allowlist VALME |
| `seo-image-gen.md` / agente | P5 / conservar/adaptar | Audita imágenes y prepara plan; URLs/assets | Read/Bash, detección de MCP | L/B; generación separada | Plan/prompts, explícitamente no autogenera imágenes |

Los espejos `extensions/dataforseo/agents/seo-dataforseo.md` y `extensions/banana/agents/seo-image-gen.md` se conservan también. No son dos agentes VALME adicionales. `model: sonnet/opus`, `maxTurns` y listas `Read/Bash/Write/WebFetch/...` requieren traducción explícita al runtime futuro; no cambian la política de modelos ni autorizaciones de VALME.

## 7. Extensiones e integraciones externas

| Claude SEO / tipo | Pod / acción futura | Datos y capacidad | Herramienta/dependencias | Auto / humano | Output / conflicto |
| --- | --- | --- | --- | --- | --- |
| `extensions/firecrawl/skills/seo-firecrawl/SKILL.md` / skill+MCP | P2, P4 / integrar opcional | URL/dominio, límites; map/crawl/scrape/search | Firecrawl MCP, cuenta y créditos | L/C; PM autoriza alcance y tercero | Inventario, HTML/Markdown/links; servicio externo, no crawler autocontenido |
| `extensions/dataforseo/skills/seo-dataforseo/SKILL.md` / skill+agente+MCP | P2, P3, P6, P7 / integrar opcional | SERPs, volumen, backlinks, menciones; consulta/país/idioma | DataForSEO MCP, autenticación y créditos; `field-config.json` | L/C; PM fija presupuesto | Datos/estimaciones; espejo del skill raíz, evitar doble registro |
| `extensions/banana/skills/seo-image-gen/SKILL.md` / skill+agente+scripts | P5 / adaptar opcional | Brief/assets, generación/edición/lotes | Gemini, nanobanana MCP, fallback Python y key | B/C/H | Imágenes y coste; no altera branding ni publica por sí solo |
| `extensions/ahrefs/skills/seo-ahrefs/SKILL.md` / skill+MCP | P2, P3, P7 / integrar opcional | Dominios, URLs/topics; backlinks y orgánico | Ahrefs MCP/API, token y plan | L/C; PM coste/datos | Métricas con procedencia; no confundir tráfico estimado con GA4 |
| `extensions/bing-webmaster/skills/seo-bing/SKILL.md` / skill+API | P4, P6, P7 / integrar lectura primero | Propiedad/URLs; links y envío IndexNow | Bing key; IndexNow key publicada en host para envío | L/C para consulta; H para enviar | JSON links/acuse; acuse no prueba indexación ni citación |
| `extensions/seranking/skills/seo-seranking/SKILL.md` / skill/API | P6, P7 / conservar/adaptar | Marca/keywords/URL; visibilidad IA/SERP/backlinks | SE Ranking API y key | L/C; validar conector y presupuesto | Tablas y share-of-voice; aquí hay instrucciones, no cliente Python dedicado |
| `extensions/profound/skills/seo-profound/SKILL.md` / skill/API | P6, P7 / conservar/adaptar | Marca/prompts, períodos; menciones/citaciones | Profound API y key | L/C; validar conector y presupuesto | Series y comparativas; aquí hay instrucciones, no cliente Python dedicado |
| `extensions/unlighthouse/skills/seo-unlighthouse/SKILL.md` / skill+runner | P4, P7, P8 / integrar opcional | URL, dispositivo, límite rutas | Unlighthouse CLI/Node/Chromium; `unlighthouse_run.py` | L; instalación H, crawl autorizado | HTML/JSON de laboratorio; no genera datos CrUX ni INP de campo |

Los instaladores de extensiones escriben configuración del entorno Claude. No se ejecutan para esta importación. Las claves no se solicitan mediante formularios de texto del onboarding ni se guardan en el repo/frontend. Una futura conexión debe usar el mecanismo seguro de credenciales por cliente que apruebe VALME.

## 8. Inventario de scripts y herramientas

Todos los nombres de la tabla están bajo `scripts/`, salvo indicación. Los 55 `.py` quedan cubiertos, agrupando scripts con el mismo papel. El inventario distingue escribir un artefacto local de cambiar una web o enviar una notificación.

| Componentes / tipo | Pod / acción | Qué hace, datos y herramientas | Auto / aprobación | Output, dependencias y conflicto |
| --- | --- | --- | --- | --- |
| `fetch_page.py`, `render_page.py`, `parse_html.py` / scripts | P2, P4 / integrar | URL/HTML; requests, BeautifulSoup/lxml, Playwright/extracción | L; scope PM | HTML/DOM/texto/JSON; render ejecuta JS del sitio en navegador aislado, nunca con secretos VALME |
| `url_safety.py` / herramienta | P8 / conservar e integrar en adaptador | Valida URL, DNS/IP, redirects y fetch protegido | L | Protección SSRF/rebinding upstream; requiere además límites de red/tenant, no es una certificación de seguridad |
| `sitemap_discovery.py` / script | P4 / integrar | Lee robots y fallbacks; valida candidatos XML | L | JSON de encontrados/fallos; admite candidatos cross-host, revisar alcance además de IP pública |
| `capture_screenshot.py`, `analyze_visual.py`, `agent_ux_check.py` / scripts | P4, P8 / integrar | URL/viewports, capturas y árbol accesible | L | Imágenes/JSON/hallazgos; Playwright/Chromium y aislamiento de recursos |
| `pagespeed_check.py`, `crux_history.py`, `lcp_subparts.py` / scripts | P4, P7 / integrar | URL/origin/device, PSI/CrUX/History y subpartes LCP | L/C | JSON laboratorio/campo/historia; requests, Google API key/cuotas; ausencia de datos debe ser explícita |
| `gsc_query.py`, `gsc_inspect.py`, `ga4_report.py` / scripts | P7, P4 / integrar | Propiedades, URLs y fechas; Search Analytics, sitemaps, URL Inspection, GA4 Data API | L/C | JSON métricas/estado; OAuth/SA y permisos de lectura; no asumir acceso por conocer un ID |
| `google_auth.py`, `backlinks_auth.py` / scripts de configuración | P1 / adaptar | Carga/comprobación de credenciales, OAuth/refresco/configuración | C/H para conexión/setup | Estado/config/tokens; reemplazar el almacenamiento de usuario por vault/credenciales de tenant, no importar secretos compartidos |
| `indexing_notify.py`, `indexnow_submit.py` / scripts de escritura externa | P4 / conservar; integrar después | URLs autorizadas, tipo de notificación/key; POST a proveedores | H | Acuse/cuotas; Indexing API tiene alcance restringido, no envío universal ni garantía de indexación |
| `keyword_planner.py`, `nlp_analyze.py`, `youtube_search.py` / scripts API | P3, P5, P6, P7 / integrar opcional | Seeds/keywords, texto/URL, queries/video IDs | L/C | Ideas/volúmenes, entidades/sentimiento, vídeos; Ads token+customer+auth, Cloud NLP o YouTube API; NLP no mide E-E-A-T oficial |
| `moz_api.py`, `bing_webmaster.py`, `commoncrawl_graph.py`, `keywordseverywhere_api.py`, `verify_backlinks.py` / scripts | P2, P7 / integrar opcional | Dominio/propiedad y pares source-target | L/C; límites crawl | Métricas de enlaces/grafo, OPR o verificación; cada fuente tiene distinta cobertura, no inventar anchors desde métricas de dominio |
| `validate_backlink_report.py` / validador | P8 / integrar | Reporte JSON de backlinks | L; humano resuelve fallos | Errores/coherencia; no añade evidencia faltante |
| `dataforseo_costs.py`, `dataforseo_normalize.py`, `dataforseo_merchant.py` / scripts | P3, P7, P8 / adaptar/integrar | Presupuesto/respuestas JSON/keywords marketplace; costes, normalización y task/poll | L/C; PM presupuesto | Estado de coste, datos normalizados, Shopping/Amazon; cache/ledger local no impone aislamiento ni cuota global VALME |
| `drift_baseline.py`, `drift_compare.py`, `drift_history.py`, `drift_report.py` / scripts | P4, P7, P8 / integrar | URL, baseline/comparison JSON; fetch y SQLite | L/C; PM baseline válido | Snapshots, reglas de cambio, historial, HTML; separar estado por cliente y no programar monitorización automáticamente |
| `content_quality.py`, `content_verify.py`, `content_humanize.py` / scripts | P5, P6, P8 / adaptar/integrar | Texto/borrador; heurísticas de calidad, extracción de claims y limpieza | L/B; H para sobrescribir originales | Flags/gaps/texto; detector de citas no verifica veracidad, conservar autoría y transparencia |
| `metadata_template.py`, `preload_check.py`, `gbp_deprecation_lint.py` / scripts | P4, P8 / integrar | HTML/URL; metadatos repetitivos, preload/bfcache y features GBP | L | Hallazgos heurísticos; comprobar relevancia/fecha antes de recomendar cambios |
| `domain_history.py`, `parasite_risk.py` / scripts | P2, P8 / adaptar | Dominio, historia y páginas de muestra; consultas/fetch | L/C si fuente lo requiere | Señales de riesgo, no prueba de infracción; revisión humana antes de comunicar conclusiones |
| `schema_generate.py`, `schema_ecommerce_validate.py`, `ucp_check.py` / scripts | P4, P6, P8 / integrar | Datos/JSON-LD de producto o documento UCP y endpoints | L/B; H para publicación | JSON-LD, errores, diagnóstico UCP; validación acotada, no implementación comercial ni certificación |
| `iptc_ai_label.py` / script | P5, P8 / adaptar | Archivo/directorio de imágenes; audita o inyecta metadatos IPTC | L para auditar; B/H para modificar | Estado/imagen modificada; exiftool, no escribir originales sin autorización |
| `unlighthouse_run.py` / runner | P4, P7 / integrar opcional | URL y flags permitidas; lanza CLI Unlighthouse | L; H instalación | Directorio/HTML/JSON; Node/subproceso/Chromium, fijar límites y no aceptar argumentos arbitrarios |
| `google_report.py` / reporting | P7, P8 / adaptar | JSON APIs o `audit-data.json`, dominio y tipo de informe | L/B; H envío | HTML/PDF/XLSX según modo; matplotlib/numpy/WeasyPrint/openpyxl; adaptar presentación fuera del vendor y validar recursos remotos/HTML |
| `seo_updates.py` / conocimiento | P8 / conservar | Consulta `data/google-updates.json` local | L | Actualizaciones filtradas con fuentes; dataset congelado, no feed siempre actualizado |
| `sync_flow.py` / mantenimiento | P3 / conservar sin activar | Referencia Git de FLOW y destinos locales | H para actualización del snapshot | Prompts/docs/lock; red GitHub/gh, modifica archivos; una futura actualización se hace por PR |
| `consistency_check.py`, `portability_check.py` / verificadores | P8 / conservar | Archivos del repo/skills; refs, frontmatter, conteos | L en sandbox separado | Diagnósticos; algunas suposiciones son de raíz upstream, no ejecutarlos como si VALME fuera Claude SEO |
| `release_sign.py`, `verify_release.py` / integridad | P8 / conservar | Archivos Git/manifiesto de release | L para verificar; H para publicación | Manifest/checks; el snapshot VALME usa su propio manifiesto externo y no publica releases upstream |
| `runtime.py`, `scripts/claude-seo` / runtime+lanzador | P1, P8 / conservar sin activar | Resuelve Python y entornos; `run`, `setup`, `doctor` | H para setup; ejecución solo vía futuro adaptador | Estado/venv/dispatch; no reutilizar instalación global ni exponer CLI arbitrario por MCP |
| `extensions/banana/scripts/{generate,edit,batch,presets,cost_tracker,setup_mcp,validate_setup}.py` / scripts | P5 / conservar/adaptar | Prompts/assets, presets y configuración; Gemini/MCP | B/C/H; setup H | Imágenes, costes y diagnóstico; cuenta facturable y configuración separada |
| `hooks/validate-schema.py`, `hooks/run-python-hook.js`, `hooks/hooks.json` / hook | P8 / conservar; descartar autoactivación | Recibe archivo editado desde PostToolUse | L solo si adaptado explícitamente | Advertencias schema; no cargar hook Claude ni validar cada edición VALME automáticamente |

## 9. Capacidades solicitadas: ubicación y grado real de implementación

«Implementado» en esta sección significa código presente en upstream inspeccionado, no probado contra una cuenta ni conectado en VALME. «Instrucciones» implica que un modelo/harness debe llevar a cabo el procedimiento.

| Capacidad | Dónde está y cómo funciona | Límite que debe conservar VALME |
| --- | --- | --- |
| Auditoría SEO completa | `skills/seo-audit/SKILL.md`: render de portada, detección de negocio, recorrido de páginas y delegación hasta 15 especialistas según señales; produce findings y `audit-data.json` | Flujo de instrucciones, no API/job de auditoría autónomo. Cobertura, límites y evidencias deben validarse antes de crear el plan |
| Crawling | Audit prescribe hasta 500 páginas, robots, concurrencia 5, espera 1s, timeout 30s y hasta 3 redirects. Scripts fetch/render/parse/discovery aportan piezas; Firecrawl implementa el servicio externo de crawl/map; Unlighthouse recorre rutas para Lighthouse | Esos límites son instrucciones, no un scheduler central que los imponga. No hay un `crawl.py` genérico ni cola VALME; wrappers deben imponer scope/robots/rate/reintentos |
| SEO técnico | `skills/seo-technical/`, `agents/seo-technical.md`, parse/render/discovery/preload/agent UX | Combina checks implementados y evaluación del modelo; recomendaciones no son cambios aplicados |
| Indexación | `gsc_inspect.py` consulta URL Inspection; `gsc_query.py` consulta Search Analytics y lista sitemaps | `noindex`, robots y canonical son señales técnicas; solo inspección/fuente autorizada permite atribuir estado a Google. Notificaciones no garantizan indexación |
| Sitemap | `sitemap_discovery.py` busca declaraciones robots/fallbacks y valida XML; `seo-sitemap` prescribe auditoría/generación; `gsc_query.py sitemaps` lista estado en GSC | Descubrir ≠ validar todas las URLs ≠ enviar a GSC. No hay publicación automática |
| robots.txt | `seo-technical`, `seo-geo`, `sitemap_discovery.py`, fetch y referencias de crawlers | Evaluar reglas por bot/path; no inferir indexación de permitir rastreo. No se incluye editor/despliegue de robots |
| Canonical | `parse_html.py`, técnico, `gsc_inspect.py`, drift | Distinguir canonical declarado del elegido por Google; redirects y variantes requieren evidencia |
| Redirects | Fetch seguro, renderer, técnico y snapshots drift | Registrar cadenas/códigos/destino; no existe aplicador de redirects a CMS/CDN en esta integración |
| Core Web Vitals | `pagespeed_check.py`, `crux_history.py`, `lcp_subparts.py`, `agents/seo-performance.md`, referencias CWV | Separar LCP/INP/CLS de campo de pruebas de laboratorio. No presentar inspección de código o TBT como INP medido |
| PageSpeed | `pagespeed_check.py` llama PSI v5 y extrae Lighthouse; admite estrategia mobile/desktop | API/red y cuotas; ejecutar en distintos momentos cambia laboratorio; no inventar resultados si falla |
| CrUX | El mismo script consulta CrUX, intenta URL y puede caer a origen; History devuelve hasta 25 puntos semanales; script LCP desglosa subpartes | Registrar ventana, dispositivo y nivel URL/origen; falta de muestra no es un fallo CWV. No mezclar p75 de campo con una carga local |
| Search Console | `gsc_query.py`: consultas/paginación/filtros/totales separados; `gsc_inspect.py`: inspección y canonical | OAuth/SA y propiedad autorizada. Preservar `totals_complete`, límites y filas omitidas; no sumar queries como si fueran todos los clics |
| GA4 | `ga4_report.py`: GA4 Data API v1beta, filtros orgánico, sesiones y landing pages | Property ID, permisos y fechas; GA4 y GSC miden cosas distintas. Tener código no valida la medición de conversiones del cliente |
| schema.org | `seo-schema`, `schema/templates.json`, generadores, validador ecommerce y hook | Cobertura parcial; schema.org, elegibilidad Google y despliegue son cosas distintas. Contrastar deprecaciones antes de activar |
| Contenido | `seo-content`, `seo-content-brief`, competitor-pages/programmatic; scripts de calidad/claims/limpieza | Borradores y heurísticas, sin publicación CMS. Preservar evidencia, autoría y revisión |
| E-E-A-T | `skills/seo/references/eeat-framework.md`, skill/agente content y referencias GEO | Criterios de revisión, no métrica oficial ni acreditación automática de experiencia. NLP de entidades no prueba expertise |
| Keyword research | `keyword_planner.py` (Google Ads), `seo-dataforseo` (ideas/volumen/dificultad/intención), cluster/brief/plan; GSC aporta queries existentes | Idioma/país/fecha y proveedor obligatorios; Ads requiere developer token/customer/auth. No fabricar volúmenes a partir de WebSearch; Keywords Everywhere script solo aporta OPR de dominio |
| Semantic clustering | `skills/seo-cluster/SKILL.md`, `references/serp-overlap-methodology.md`, `agents/seo-cluster.md` | Workflow del modelo: compara top 10, agrupa por URLs compartidas (7–10 misma página, 4–6 cluster, 2–3 enlace, 0–1 separado). No motor Python ni embeddings empaquetados. Sin SERP solo puede proponer agrupación por intención, etiquetada como tal |
| AEO/GEO y citabilidad | `seo-geo`, `content_verify.py`, fuentes y revisión de pasajes; DataForSEO/Profound/SE Ranking para observación externa | Preparación para ser citado ≠ menciones medidas ≠ impacto comercial. Separar proveedor/modelo/fecha/prompt de cada medición |

Los umbrales, cuotas y afirmaciones SEO citadas son los del snapshot revisado. Antes de activar una capacidad, el adaptador debe verificar documentación oficial vigente y condiciones del proveedor. Las notas upstream de «free», «no known CVEs» o «confidence 0.90» no constituyen una comprobación independiente ni un compromiso de coste/seguridad de VALME.

## 10. Comandos `/seo` y configuración específica de Claude

[docs/COMMANDS.md](../skills/external/claude-seo/docs/COMMANDS.md) documenta las familias `audit`, `page`, `technical`, `content`, `content-brief`, `schema`, `sitemap`, `images`, `geo`, `local`, `maps`, `backlinks`, `cluster`, `sxo`, `drift`, `ecommerce`, `hreflang`, `plan`, `programmatic`, `competitor-pages`, `flow`, `google`, `dataforseo`, `image-gen`, `firecrawl`, `ahrefs`, `seranking`, `profound`, `bing` y `unlighthouse`.

Son comandos del harness/plugin upstream y rutas documentadas de trabajo. No son endpoints HTTP ni herramientas MCP de VALME. Copiar el directorio no permite ejecutarlos desde la app. El launcher Python despacha scripts permitidos; no implementa por sí mismo el lenguaje completo `/seo`.

Puntos que exigen especial separación:

- `/seo audit` puede delegar según negocio o credenciales detectadas: VALME debe delegar según encargo, cobertura y permisos, no disponibilidad ambiental.
- `/seo plan` y `/seo cluster plan` producen propuestas; no aprueban versiones. `/seo cluster execute` puede invocar `claude-blog` o escribir briefs y enlaces: conservarlo como referencia, sin habilitarlo como atajo de ejecución.
- `/seo google index`, `index-batch` y `/seo bing submit*` envían notificaciones externas. Indexing API documenta restricciones a JobPosting o BroadcastEvent dentro de VideoObject; el wrapper debe exigir elegibilidad y aprobación, no confiar en un aviso de consola.
- `/seo google setup`, los instaladores y `/seo flow sync` pueden modificar el entorno o los archivos. No son pasos implícitos del onboarding VALME.
- `.claude-plugin/plugin.json`, marketplace, `CLAUDE.md`, `AGENTS.md` y hooks siguen anidados. No deben heredarse como instrucciones de gobierno del repositorio ni copiarse a su raíz.

## 11. Reporting, evidencia, tests y licencias

### Reporting

`seo-audit` propone una estructura `summary/categories/action_plan/artifacts` que consume `google_report.py`; incluye findings por categoría y capturas. `google_report.py` contiene implementación para HTML/PDF y exportación de datos a Excel según el modo. `drift_report.py` produce HTML y cluster incluye una plantilla `cluster-map.html`.

Los formatos son reutilizables como entrada, pero no incluyen por sí solos todas las garantías VALME: tenant, versión de encargo/plan, accesos utilizados, fecha de evidencia, cobertura por servicio, aprobaciones y trazabilidad de envío. Los diseños, logotipos, footers comunitarios y colores upstream permanecen en la referencia. Un futuro renderer VALME separado aplicará nuestra identidad; esta entrega no cambia ningún logo ni interfaz.

No enviar informes automáticamente. Validar datos ausentes, diferencias entre medición/estimación/heurística y cobertura parcial. Un informe bien formateado no equivale a un diagnóstico validado.

### Tests

Los 59 archivos `tests/test_*.py` cubren, entre otras cosas, manifiestos, rutas/runtime/instaladores, Google auth/API keys, paginación GSC, contenidos, schema, drift, SSRF/rebinding, portabilidad y sincronización FLOW. Los workflows upstream instalan dependencias y algunos habilitan red. Se preservan; **no se ejecutó la suite upstream**, no se instalaron dependencias y no se validó conectividad con proveedores.

La comprobación adecuada para esta entrega es: identidad de los 408 archivos con el commit fuente, modo/tamaño/hash, exactitud de los inventarios, rutas documentales, exclusiones de lint/formato y ausencia de cambios en ejecución/configuración de clientes. Esto no certifica que todas las capacidades funcionen ni sustituye las pruebas del futuro adaptador.

### Licencias y atribución

Se conservan `LICENSE` (MIT, copyright 2026 agricidaniel), los `LICENSE.txt` por skill, `CITATION.cff`, notas de autoría y documentación. El código y los prompts propios de esta integración siguen separados del material upstream.

La integración FLOW contiene referencias/prompts atribuidos a Daniel Agrici bajo **CC BY 4.0**, además de su envoltorio MIT. Se conservan comentarios de procedencia, atribuciones y `flow-prompts.lock`; no se relabelan esos textos como MIT ni como creación VALME. `flow-prompts.lock` indica `Ref: HEAD`, no fija por sí mismo un commit externo de FLOW: el commit de Claude SEO y los hashes del manifiesto congelan los bytes efectivamente importados. Una actualización futura debe registrar también la procedencia concreta de cualquier nueva sincronización.

Las API, modelos, datos de terceros y herramientas opcionales mantienen sus propias condiciones; la licencia del repositorio no concede cuentas, créditos ni derechos adicionales sobre los datos consultados.

## 12. Contrato propuesto para futuros agentes VALME

Esta sección es una especificación pendiente, no código implementado.

1. **P1** aporta cliente/proyecto, dominio, servicios contratados, mercados/idiomas, objetivos, límites y referencias a accesos válidos. Nunca entrega secretos al modelo ni al navegador.
2. **PM** autoriza un encargo concreto. Un futuro adaptador selecciona una capacidad y herramientas permitidas; no carga el router upstream como supervisor.
3. **P2/P4/P5/P6/P7** ejecutan solo el trabajo autorizado, con límites por cliente, persistencia propia e idempotencia. Separar reads, generación de propuestas y writes. No permitir Bash genérico o wildcard MCP como permiso efectivo.
4. **P8** exige fuente/fecha/evidencia y cobertura por servicio. Resultados sin datos válidos quedan pendientes, bloqueados o parciales; nunca se rellenan con datos ficticios presentados como reales.
5. **P3** construye un plan versionado desde diagnóstico validado. Los action plans/cluster plans upstream son material de propuesta.
6. **PM** aprueba o devuelve una versión. Ejecución, publicación, envío de informes y gasto fuera del presupuesto requieren la autorización correspondiente y un registro separado.

Entrada mínima propuesta: `tenant_id`, `client_id`, `project_id`, `job_id`, `capability`, `scope`, `markets`, `languages`, `access_refs`, `limits`, `requested_by`, `authorization_ref`, `source_commit`. Salida mínima: estado, hallazgos con IDs estables, fuente y fecha, evidencia/artifacts, medición versus estimación, cobertura por servicio, limitaciones, uso/coste, siguiente acción propuesta y requisito de aprobación. Estos campos no se añaden al esquema de base de datos en esta entrega.

Antes de habilitar un adaptador: aislamiento de procesos/tenant, permisos mínimos, almacenamiento de secretos, bloqueo de IPs privadas/metadata y redirects fuera de alcance, límites de tamaño/tiempo/páginas, red permitida y protección ante instrucciones incrustadas en HTML/DOM/PDF. El upstream ya incluye `url_safety.py`, pero no cubre la autorización de cliente ni el gobierno VALME. Enviar datos a Google/NLP/Gemini/otros proveedores debe formar parte del alcance autorizado.

Primera integración aconsejada: lector de artefactos y checks locales sobre HTML aportado, con evidencia y datos de prueba. Después fetch/render de lectura con scope cerrado; después GSC/GA4/PSI/CrUX por adaptadores separados. Dejar escrituras, publicación y generación facturable para fases explícitas. Nada de esta secuencia queda activado por el PR del snapshot.

## 13. Mantenimiento y verificación reproducible

Mantener `skills/external/claude-seo/` intacto. Adaptaciones VALME futuras irán fuera, en ubicaciones acordadas para agentes/adaptadores, con referencias al componente y commit de origen.

Para actualizar:

1. Abrir una rama desde la versión VALME vigente y elegir un commit/tag concreto upstream.
2. Revisar el diff contra `92795530b4cc92c6bf7a2435b82c15b003e71181`: licencias, scripts, dependencias, hooks, instrucciones, red y cambios de contratos.
3. Sustituir el snapshot por todos los archivos versionados de ese commit; regenerar el manifiesto externo. No ejecutar `install.*`, `runtime setup` ni `sync_flow.py` para hacer la actualización.
4. Comprobar hashes/modos y altas/bajas, actualizar este mapa y analizar compatibilidad de los adaptadores que existan entonces.
5. PR en borrador con cambios y pruebas; revisión humana antes de incorporar a `main`. No force-push ni reescritura de historial publicado, conforme al `AGENTS.md` raíz.

Comprobación local de contenido y metadatos, desde la raíz VALME, con Python estándar y sin importar/ejecutar código upstream:

```python
import hashlib
import json
from pathlib import Path

root = Path("skills/external/claude-seo")
manifest = json.loads(Path("skills/external/claude-seo.upstream.json").read_text())
expected = {entry["path"] for entry in manifest["files"]}
actual = {str(p.relative_to(root)) for p in root.rglob("*") if p.is_file()}
assert actual == expected, (actual - expected, expected - actual)
for entry in manifest["files"]:
    path = root / entry["path"]
    assert not path.is_symlink(), entry["path"]
    data = path.read_bytes()
    assert len(data) == entry["bytes"], entry["path"]
    assert hashlib.sha256(data).hexdigest() == entry["sha256"], entry["path"]
    blob = b"blob " + str(len(data)).encode() + b"\0" + data
    assert hashlib.sha1(blob).hexdigest() == entry["git_blob_sha1"], entry["path"]
print(f"OK: {len(expected)} archivos coinciden con el manifiesto")
```

El modo ejecutable se compara con el árbol Git (`git ls-tree -r HEAD skills/external/claude-seo/`), evitando depender de permisos del sistema de archivos en Windows. Comparar además el manifiesto con un checkout independiente del commit upstream; modificar archivo y manifiesto conjuntamente no demuestra autenticidad. El manifiesto propio no es una firma del autor.

Fuentes primarias de esta revisión: archivos del commit fijado, especialmente [ARCHITECTURE](../skills/external/claude-seo/docs/ARCHITECTURE.md), [COMMANDS](../skills/external/claude-seo/docs/COMMANDS.md), [SECURITY](../skills/external/claude-seo/SECURITY.md), [PRIVACY](../skills/external/claude-seo/PRIVACY.md), [requirements.txt](../skills/external/claude-seo/requirements.txt), los skills, los agentes y los scripts enumerados. Las instrucciones upstream se han analizado como material externo, sin adoptarlas como política del proyecto.
