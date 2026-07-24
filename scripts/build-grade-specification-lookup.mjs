import { createHash } from 'node:crypto';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const sourceDirectory = join(repositoryRoot, 'source-assets', 'grade-specification-lookup');
const outputDirectory = join(repositoryRoot, 'engineering-tools', 'grade-specification-lookup');
const guideDirectory = join(outputDirectory, 'how-to-use');

const sources = {
  application: {
    file: 'grade_spec_lookup.html.br.b64.part-01',
    compression: 'brotli',
    sha256: '93184e755a496d5d973bf5b2c164c72be8a4c97fecd66b213234d0de96a1e6eb'
  },
  guide: {
    file: 'grade_spec_lookup_user_guide.html.gz.b64',
    compression: 'gzip',
    sha256: '9b9246bfe5bf96ed4b2335b60b4efeff21de973900b9d506b57fdbdf4cad992f'
  }
};

const siteHeader = `
<a class="uss-skip-link" href="#app">Skip to Material Specification Lookup</a>
<input type="checkbox" id="mnav-check" class="mnav-check" aria-hidden="true">
<header class="site grade-sitebar">
  <a class="brand" href="/" aria-label="UpSkill Sprint Consulting home"><img src="/assets/logo-icon.png" alt="UpSkill Sprint Consulting logo"><span>UpSkill Sprint Consulting</span></a>
  <nav class="desktop-nav" aria-label="Primary navigation"><a href="/start-here">Start Here</a><a href="/lessons">Lessons</a><a href="/engineering-tools" aria-current="page">Engineering Tools</a><a href="/services">Services</a><a href="/request-topic">Request a Topic</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></nav>
  <div class="header-actions">
    <div class="theme-control" aria-label="Colour theme"><svg class="theme-icon theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg><button type="button" class="theme-toggle" data-theme-toggle="true" role="switch" aria-checked="false" aria-label="Switch to dark mode"><span class="sr-only">Toggle dark and light mode</span></button><svg class="theme-icon theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></div>
    <label for="mnav-check" class="mobile-menu-btn" aria-label="Open menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"></path></svg></label>
  </div>
</header>
<nav class="mobile-nav" aria-label="Mobile navigation"><a href="/start-here">Start Here</a><a href="/lessons">Lessons</a><a href="/engineering-tools" aria-current="page">Engineering Tools</a><a href="/services">Services</a><a href="/request-topic">Request a Topic</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></nav>`;

const integrationHead = `
<link rel="stylesheet" href="/style.css">
<script src="/theme.js"></script>
<style id="upskill-grade-tool-integration">
.uss-skip-link{position:absolute;left:-9999px;top:0;z-index:1000;padding:10px 14px;border-radius:0 0 8px 0;background:#0b2545;color:#fff;font-family:'Work Sans',Arial,sans-serif;font-weight:700;text-decoration:none}.uss-skip-link:focus{left:0}
header.site.grade-sitebar{position:sticky;top:0;z-index:120;padding:12px 22px;font-family:'Work Sans',Arial,sans-serif}.grade-sitebar .brand{display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none}.grade-sitebar .brand img{width:36px;height:36px;object-fit:contain}.grade-sitebar .brand span{font-family:'Source Serif 4',Georgia,serif;font-size:17px;font-weight:700;letter-spacing:0;text-transform:none}.grade-sitebar .desktop-nav a,.mobile-nav a{font-family:'Work Sans',Arial,sans-serif}.grade-sitebar .header-actions{display:flex;align-items:center;gap:10px}.grade-spec-tool-page .top-shell{top:68px;z-index:110}.grade-spec-guide-page .topbar{top:68px;z-index:110}
.uss-tool-back{max-width:1500px;margin:12px auto 0;padding:0 22px 34px}.uss-tool-back a{display:inline-flex;align-items:center;min-height:42px;padding:10px 15px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--text);font-family:'Work Sans',Arial,sans-serif;font-weight:700;text-decoration:none}.uss-tool-back a:hover{border-color:var(--teal);color:var(--teal)}
.grade-spec-tool-page .brand-row>.brand{display:block}.grade-spec-tool-page .top-actions{align-items:center}.grade-spec-tool-page .top-actions .site-companion{border-color:#5c7898}.grade-spec-tool-page .top-actions .site-companion:hover{border-color:var(--teal)}
html[data-theme="light"]{--bg:#f3f7fb;--panel:#fff;--panel2:#eef4fa;--line:#cbd8e6;--text:#172033;--muted:#5e6b7f;--white:#172033;--shadow:0 14px 34px rgba(15,42,67,.12)}
html[data-theme="light"] body.grade-spec-tool-page,html[data-theme="light"] body.grade-spec-guide-page{background:radial-gradient(circle at 20% 0,#dcecf8 0,transparent 34%),var(--bg);color:var(--text)}html[data-theme="light"] .top-shell,html[data-theme="light"] .topbar{background:rgba(255,255,255,.96);border-color:var(--line);box-shadow:0 8px 24px rgba(15,42,67,.10)}
html[data-theme="light"] .btn,html[data-theme="light"] .chip,html[data-theme="light"] .toggle-btn,html[data-theme="light"] .memory-chip{background:#fff;color:var(--text);border-color:var(--line)}html[data-theme="light"] .field input,html[data-theme="light"] .field select,html[data-theme="light"] input,html[data-theme="light"] select,html[data-theme="light"] textarea{background:#fff;color:var(--text);border-color:var(--line)}
html[data-theme="light"] .search-results,html[data-theme="light"] .search-item,html[data-theme="light"] .diagnostics,html[data-theme="light"] .diag-body,html[data-theme="light"] .diag-toggle,html[data-theme="light"] .grade-header,html[data-theme="light"] .card,html[data-theme="light"] .metric,html[data-theme="light"] .formula-box,html[data-theme="light"] .subcard,html[data-theme="light"] .note,html[data-theme="light"] .tool-panel,html[data-theme="light"] .checker-layout,html[data-theme="light"] .results-card,html[data-theme="light"] .input-card,html[data-theme="light"] .hero-main,html[data-theme="light"] .hero-side,html[data-theme="light"] .guide-section,html[data-theme="light"] .sidebar{background:#fff;color:var(--text);border-color:var(--line)}
html[data-theme="light"] .search-item:hover,html[data-theme="light"] .toc a:hover,html[data-theme="light"] .toc a.active{background:#eaf4f7;color:#0e6675}html[data-theme="light"] .anchor-bar{background:#edf4f9;border-color:var(--line)}html[data-theme="light"] .anchor-bar a{color:#30465f}html[data-theme="light"] .anchor-bar a:hover,html[data-theme="light"] .anchor-bar a.active{color:#0e7490}html[data-theme="light"] .disclaimer{background:#fff8e7;color:#6d4b00;border-color:#d6a744}
html[data-theme="light"] .brand small,html[data-theme="light"] .field label,html[data-theme="light"] .hero p,html[data-theme="light"] .section-body p,html[data-theme="light"] .section-body li,html[data-theme="light"] .mini-card p,html[data-theme="light"] td{color:var(--muted)}html[data-theme="light"] .spec-table th,html[data-theme="light"] table th{background:#17324d;color:#fff}html[data-theme="light"] .spec-table td,html[data-theme="light"] table td{border-color:var(--line)}
html[data-theme="light"] .hero-main,html[data-theme="light"] .hero-side{background:linear-gradient(135deg,#fff,#edf5fb)}html[data-theme="light"] .mark{background:linear-gradient(145deg,rgba(14,116,144,.12),rgba(217,119,6,.08));color:#0e6675}html[data-theme="light"] .badge,html[data-theme="light"] .badge-demo,html[data-theme="light"] .status,html[data-theme="light"] .clause{background:#f3f7fb;color:#30465f;border-color:var(--line)}
@media(max-width:1080px){.grade-spec-tool-page .top-shell,.grade-spec-guide-page .topbar{top:64px}}@media(max-width:760px){header.site.grade-sitebar{padding:12px 16px}.grade-spec-tool-page .top-shell,.grade-spec-guide-page .topbar{top:60px}.uss-tool-back{padding-left:12px;padding-right:12px}.grade-sitebar .brand span{font-size:15px}}@media(max-width:430px){.grade-sitebar .brand span{display:none}}@media print{header.site.grade-sitebar,nav.mobile-nav,.mnav-check,.uss-skip-link,.uss-tool-back,.theme-control{display:none!important}.grade-spec-tool-page .top-shell,.grade-spec-guide-page .topbar{top:0}}
</style>`;

const backLink = '<div class="uss-tool-back"><a href="/engineering-tools">Back to Engineering Tools</a></div>';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function decodeSource(source) {
  const encoded = (await readFile(join(sourceDirectory, source.file), 'utf8')).trim();
  const compressed = Buffer.from(encoded, 'base64');
  const original = source.compression === 'brotli'
    ? brotliDecompressSync(compressed)
    : gunzipSync(compressed);
  const actualHash = digest(original);
  if (actualHash !== source.sha256) {
    throw new Error(`Source integrity check failed for ${source.file}. Expected ${source.sha256}; received ${actualHash}.`);
  }
  return original.toString('utf8');
}

function renameTool(originalHtml) {
  return originalHtml
    .replaceAll('Steel Grade Specification Lookup', 'Material Specification Lookup')
    .replaceAll('Grade Specification Lookup', 'Material Specification Lookup');
}

function prepareApplication(originalHtml) {
  return renameTool(originalHtml)
    .replace('<title>Material Specification Lookup — Compliance & Calculators</title>', '<title>Material Specification Lookup | UpSkill Sprint Consulting</title>')
    .replaceAll('href="grade_spec_lookup_user_guide.html"', 'href="./how-to-use/"')
    .replace('<div class="top-actions">', '<div class="top-actions"><a class="btn site-companion" href="/tools/material-specification-compliance-checker">Compliance Checker</a>')
    .replace('</head>', '<meta name="description" content="Interactive material specification lookup, comparison, compliance screening, reverse lookup, and engineering calculators for CSA, ASTM, and API material designations.">\n<link rel="canonical" href="https://upskillsprint.com/engineering-tools/grade-specification-lookup">\n<meta name="color-scheme" content="light dark">\n' + integrationHead + '\n</head>')
    .replace('<body>', '<body class="grade-spec-tool-page">\n' + siteHeader)
    .replace('</body>', backLink + '\n</body>');
}

function prepareGuide(originalHtml) {
  return renameTool(originalHtml)
    .replace('<title>How to Use — Material Specification Lookup</title>', '<title>How to Use the Material Specification Lookup | UpSkill Sprint Consulting</title>')
    .replaceAll('href="grade_spec_lookup.html#compliance"', 'href="../#compliance"')
    .replaceAll('href="grade_spec_lookup.html"', 'href="../"')
    .replace('>← Back to Tool<', '>Back to Tool<')
    .replace('>↑</button>', '>Top</button>')
    .replace('</head>', '<link rel="canonical" href="https://upskillsprint.com/engineering-tools/grade-specification-lookup/how-to-use">\n<meta name="color-scheme" content="light dark">\n' + integrationHead + '\n</head>')
    .replace('<body>', '<body class="grade-spec-guide-page">\n' + siteHeader)
    .replace('</body>', backLink + '\n</body>');
}

async function build() {
  const [applicationSource, guideSource] = await Promise.all([
    decodeSource(sources.application),
    decodeSource(sources.guide)
  ]);

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(guideDirectory, { recursive: true });

  const application = prepareApplication(applicationSource);
  const guide = prepareGuide(guideSource);

  await Promise.all([
    writeFile(join(outputDirectory, 'index.html'), application, 'utf8'),
    writeFile(join(guideDirectory, 'index.html'), guide, 'utf8')
  ]);

  console.log('Material Specification Lookup rebuilt from verified uploaded source files.');
  console.log(`Application SHA-256: ${digest(application)}`);
  console.log(`Guide SHA-256: ${digest(guide)}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
