'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const THEME = '<script src="/theme.js"></script>';
const SECTIONS = '<script src="/site-sections.js"></script>';

function htmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const GUIDE = path.join(ROOT, 'tools', 'steel-phase-explorer', 'how-to-use', 'index.html');
const guide = fs.readFileSync(GUIDE, 'utf8');

/*
 * The Apply Shared Site Controllers workflow matches these tag strings
 * exactly. A non-compliant page makes the bot attempt a push to protected
 * main, which fails CI on every subsequent merge.
 */
test('every HTML page carries the exact shared controller tags', () => {
  const offenders = [];
  for (const file of htmlFiles(ROOT)) {
    const body = fs.readFileSync(file, 'utf8');
    if (!body.includes(THEME) || !body.includes(SECTIONS)) {
      offenders.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(offenders, [], 'pages missing the exact tags');
});

test('the shared controller tags appear exactly once on the guide', () => {
  assert.equal(guide.split(THEME).length - 1, 1, 'theme.js once');
  assert.equal(guide.split(SECTIONS).length - 1, 1, 'site-sections.js once');
});

test('the guide documents the reference diagrams section', () => {
  assert.match(guide, /id="reference-diagrams"/);
  assert.match(guide, /<a href="#reference-diagrams">/);
});

test('the guide states the rapid map is not a TTT or CCT diagram', () => {
  assert.match(guide, /Not a TTT or CCT diagram/i);
  assert.match(guide, /no time axis/i);
});

test('the guide separates equilibrium fields from kinetic products', () => {
  assert.match(guide, /[Bb]ainite and martensite are not equilibrium phases/);
});

test('the guide covers each required topic', () => {
  [/Plotting and moving points/, /Reading a region/, /Experience levels/,
   /Critical lines and legend/, /Units/, /Zoom, pan and full screen/,
   /PNG export/, /On a phone/, /Engineering limitations/, /Source and copyright/]
    .forEach(re => assert.match(guide, re, `missing section: ${re}`));
});

test('the guide credits Buehler and ASM and records the permission', () => {
  assert.match(guide, /Buehler/);
  assert.match(guide, /ASM International/);
  assert.match(guide, /permission held by UpSkill Sprint Consulting/);
  assert.match(guide, /reproduced unaltered/i);
});

test('the guide declares which boundaries are approximate', () => {
  assert.match(guide, /educational approximations/i);
  assert.match(guide, /no implied precision/i);
});

test('the guide records the lower bainite onset carbon', () => {
  assert.match(guide, /0\.42/, 'onset carbon stated');
});

test('the guide notes that units do not move points', () => {
  assert.match(guide, /does not move when you switch units/i);
});

test('troubleshooting mentions the Release 5 tab', () => {
  assert.match(guide, /Release 2\u20135 tab is missing/);
});

test('the table of contents is sequentially numbered', () => {
  const nums = [...guide.matchAll(/<a href="#[a-z-]+">(\d+)\./g)].map(m => Number(m[1]));
  assert.ok(nums.length >= 20, `expected a full contents list, got ${nums.length}`);
  nums.forEach((n, i) => assert.equal(n, i + 1, `contents entry ${i + 1} out of order`));
});

/* ---------- hidden-attribute cascade guard ----------
 * This site has no global [hidden]{display:none} rule. An author-level
 * display declaration therefore beats the UA stylesheet and the element
 * stays on screen even with the hidden attribute set. Every release ships
 * its own guard. Omitting it left the Release 5 loading overlay covering
 * the diagram permanently, which read as a poster that never loaded.
 */

const TOOLS = path.join(ROOT, 'tools');
const r5css = fs.readFileSync(path.join(TOOLS, 'steel-phase-explorer-release5.css'), 'utf8');
const r5js = fs.readFileSync(path.join(TOOLS, 'steel-phase-explorer-release5.js'), 'utf8');
const r5loader = fs.readFileSync(path.join(TOOLS, 'steel-phase-explorer-release5-loader.js'), 'utf8');

test('the site really has no global hidden rule, so per-release guards are required', () => {
  const globals = fs.readFileSync(path.join(TOOLS, 'steel-phase-explorer.css'), 'utf8');
  assert.ok(!/(^|[^-\w])\[hidden\]\s*\{/.test(globals),
    'if a global rule is ever added, this guard requirement can be relaxed');
});

test('the loading overlay is guarded against the hidden cascade', () => {
  assert.match(r5css, /\.spx-r5-loading\[hidden\]\s*\{[^}]*display\s*:\s*none/,
    'without this the overlay never disappears');
});

test('every Release 5 element toggled via hidden has a display guard', () => {
  const displayed = new Set();
  for (const m of r5css.matchAll(/([.#][A-Za-z0-9_-]+)(?:\[[^\]]*\])?\s*\{([^}]*)\}/g)) {
    if (/(^|;)\s*display\s*:/.test(m[2]) && !m[0].includes('[hidden]')) displayed.add(m[1]);
  }
  const guarded = new Set([...r5css.matchAll(/([.#][A-Za-z0-9_-]+)\[hidden\]/g)].map(m => m[1]));

  const toggled = new Set([
    ...[...r5js.matchAll(/\$\('([a-z0-9-]+)'\)\.hidden/g)].map(m => m[1]),
    ...[...r5loader.matchAll(/id="([a-z0-9-]+)"[^>]*hidden/g)].map(m => m[1])
  ]);

  /* An element may be styled by id or by a class of the same name, so both
     forms have to be considered before declaring it safe. */
  const offenders = [...toggled].filter(id => {
    const forms = ['#' + id, '.' + id];
    const styled = forms.some(f => displayed.has(f));
    const isGuarded = forms.some(f => guarded.has(f));
    return styled && !isGuarded;
  });
  assert.deepEqual(offenders, [], 'these elements would stay visible when hidden is set');
});

test('the release 5 stylesheet follows the guard convention of its siblings', () => {
  for (const sibling of ['release2', 'release3', 'release4']) {
    const file = path.join(TOOLS, `steel-phase-explorer-${sibling}.css`);
    if (!fs.existsSync(file)) continue;
    assert.match(fs.readFileSync(file, 'utf8'), /\[hidden\]\s*\{[^}]*display\s*:\s*none/,
      `${sibling} sets the precedent`);
  }
  assert.match(r5css, /\[hidden\]\s*\{[^}]*display\s*:\s*none/, 'release5 follows it');
});
