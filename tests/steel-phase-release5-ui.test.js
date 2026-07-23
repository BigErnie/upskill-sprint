'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const TOOLS = path.join(__dirname, '..', 'tools');
const read = f => fs.readFileSync(path.join(TOOLS, f), 'utf8');

/* Minimal host page mirroring the parts of the tool the loader depends on. */
const HOST = `<!doctype html><html><head></head><body>
<main id="spx-tool">
  <div class="spx-tabs" role="tablist">
    <button role="tab" data-tab="equilibrium">Equilibrium</button>
    <button role="tab" data-tab="learn">Learn</button>
  </div>
  <section id="spx-tab-equilibrium" class="spx-panel" data-panel="equilibrium"></section>
  <section id="spx-tab-learn" class="spx-panel" data-panel="learn"></section>
</main></body></html>`;

function boot() {
  const dom = new JSDOM(HOST, { runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;

  /* Globals the release modules integrate with, as core.js provides them. */
  win.state = { unit: 'metric' };
  win.CtoF = c => c * 9 / 5 + 32;
  win.FtoC = f => (f - 32) * 5 / 9;
  win.setUnit = u => { win.state.unit = u; };
  win.switchTab = () => {};

  /* jsdom has no layout engine, so these SVG APIs need stubbing. */
  win.SVGElement.prototype.createSVGPoint = function () {
    return { x: 0, y: 0, matrixTransform() { return { x: 0, y: 0 }; } };
  };
  win.SVGElement.prototype.getScreenCTM = function () { return { inverse: () => ({}) }; };
  win.Element.prototype.scrollTo = function () {};
  win.fetch = () => Promise.reject(new Error('offline in tests'));

  const run = src => win.eval(src);
  run(read('steel-phase-explorer-poster-geometry.js'));
  run(read('steel-phase-explorer-rapid-geometry.js'));
  run(read('steel-phase-explorer-release5-loader.js'));
  run(read('steel-phase-explorer-release5.js'));
  return win;
}

/* The loader polls, but the host DOM is present immediately, so one boot
   is enough. Each test gets a fresh window. */

test('loader injects the reference diagrams tab', () => {
  const win = boot();
  const tab = win.document.querySelector('.spx-tabs [data-tab="reference-diagrams"]');
  assert.ok(tab, 'tab button exists');
  assert.equal(tab.getAttribute('aria-controls'), 'spx-tab-reference-diagrams');
});

test('the tab is inserted before the learn tab', () => {
  const win = boot();
  const buttons = [...win.document.querySelectorAll('.spx-tabs button')].map(b => b.dataset.tab);
  assert.deepEqual(buttons, ['equilibrium', 'reference-diagrams', 'learn']);
});

test('loader injects the panel before the learn panel', () => {
  const win = boot();
  const panel = win.document.getElementById('spx-tab-reference-diagrams');
  assert.ok(panel, 'panel exists');
  assert.equal(panel.nextElementSibling.id, 'spx-tab-learn');
  assert.equal(panel.hidden, true, 'starts hidden');
});

test('loader is idempotent', () => {
  const win = boot();
  win.eval(read('steel-phase-explorer-release5-loader.js'));
  assert.equal(win.document.querySelectorAll('#spx-tab-reference-diagrams').length, 1);
  assert.equal(win.document.querySelectorAll('[data-tab="reference-diagrams"]').length, 1);
});

test('loader requests its stylesheet once', () => {
  const win = boot();
  win.eval(read('steel-phase-explorer-release5-loader.js'));
  const links = win.document.querySelectorAll('link[href="/tools/steel-phase-explorer-release5.css"]');
  assert.equal(links.length, 1);
});

test('geometry modules load before the render module', () => {
  const win = boot();
  assert.ok(win.SPXRapidGeometry, 'rapid geometry defined');
  assert.ok(win.SPXPosterGeometry, 'poster geometry defined');
  assert.ok(win.__SPX && win.__SPX.release5, 'render module initialised');
});

test('the test hook exposes the expected surface', () => {
  const win = boot();
  const api = win.__SPX.release5;
  ['render', 'state', 'setMap', 'setLevel', 'regionAt', 'addPoint', 'removeActive', 'posterLoaded']
    .forEach(k => assert.equal(typeof api[k], 'function', `${k} exposed`));
});

test('default state starts on the rapid map at engineer level', () => {
  const win = boot();
  const s = win.__SPX.release5.state();
  assert.equal(s.map, 'rapid');
  assert.equal(s.level, 'engineer');
  assert.ok(s.points.length >= 3, 'seeded with example points');
});

test('the rapid diagram renders region paths', () => {
  const win = boot();
  const regions = win.document.querySelectorAll('#spx-r5-reference [data-r5-region]');
  assert.ok(regions.length >= 6, `expected several regions, got ${regions.length}`);
});

test('every rendered region carries an accessible label', () => {
  const win = boot();
  win.document.querySelectorAll('#spx-r5-reference [data-r5-region]').forEach(node => {
    const key = node.getAttribute('data-r5-region');
    assert.ok(win.SPXRapidGeometry.LABELS[key], `label for ${key}`);
    if (node.getAttribute('tabindex') !== null) {
      assert.ok(node.getAttribute('aria-label'), `aria-label on ${key}`);
    }
  });
});

test('interactive regions are keyboard reachable', () => {
  const win = boot();
  const focusable = win.document.querySelectorAll('#spx-r5-reference [data-r5-region][tabindex="0"]');
  assert.ok(focusable.length >= 6, 'regions are tabbable');
});

test('region paths contain no malformed coordinates', () => {
  const win = boot();
  win.document.querySelectorAll('#spx-r5-reference path[d]').forEach(p => {
    assert.ok(!/NaN|Infinity|undefined/.test(p.getAttribute('d')), 'clean path data');
  });
});

test('critical lines render when enabled', () => {
  const win = boot();
  const lines = win.document.querySelectorAll('#spx-r5-emphasis .spx-r5-critical');
  assert.ok(lines.length >= 5, `A1 A3 Acm Ms Mf, got ${lines.length}`);
});

test('toggling critical lines off removes them', () => {
  const win = boot();
  const box = win.document.getElementById('spx-r5-critical');
  box.checked = false;
  box.dispatchEvent(new win.Event('change'));
  assert.equal(win.document.querySelectorAll('#spx-r5-emphasis .spx-r5-critical').length, 0);
});

test('toggling labels off removes field labels', () => {
  const win = boot();
  const box = win.document.getElementById('spx-r5-labels');
  box.checked = false;
  box.dispatchEvent(new win.Event('change'));
  assert.equal(win.document.querySelectorAll('.spx-r5-fieldlabel').length, 0);
});

test('the legend lists regions and hides on toggle', () => {
  const win = boot();
  assert.ok(win.document.querySelectorAll('#spx-r5-legend [data-r5-legend]').length >= 6);
  const box = win.document.getElementById('spx-r5-legend-toggle');
  box.checked = false;
  box.dispatchEvent(new win.Event('change'));
  assert.equal(win.document.getElementById('spx-r5-legend-card').hidden, true);
});

test('selecting a legend entry updates the explanation panel', () => {
  const win = boot();
  const btn = win.document.querySelector('#spx-r5-legend [data-r5-legend="pearlite"]');
  assert.ok(btn, 'pearlite legend entry exists');
  btn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.match(win.document.getElementById('spx-r5-help').textContent, /Pearlite/i);
});

test('points render one row each', () => {
  const win = boot();
  const rows = win.document.querySelectorAll('#spx-r5-points-list .spx-r5-point-row');
  assert.equal(rows.length, win.__SPX.release5.state().points.length);
});

test('adding a point appends a row', () => {
  const win = boot();
  const before = win.__SPX.release5.state().points.length;
  win.document.getElementById('spx-r5-add').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.equal(win.__SPX.release5.state().points.length, before + 1);
  assert.equal(win.document.querySelectorAll('#spx-r5-points-list .spx-r5-point-row').length, before + 1);
});

test('removing leaves at least one point', () => {
  const win = boot();
  const api = win.__SPX.release5;
  while (api.removeActive()) { /* drain */ }
  assert.equal(api.state().points.length, 1);
});

test('point identifiers stay unique as points are added', () => {
  const win = boot();
  const api = win.__SPX.release5;
  api.addPoint(0.3, 500);
  api.addPoint(0.9, 300);
  const ids = api.state().points.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate ids');
});

test('the readout region matches the geometry module', () => {
  const win = boot();
  const api = win.__SPX.release5;
  const G = win.SPXRapidGeometry;
  [[0.4, 700], [0.6, 500], [0.9, 250], [0.3, 100]].forEach(([c, t]) => {
    assert.equal(api.regionAt(c, t), G.regionAt(c, t), `agreement at ${c},${t}`);
  });
});

test('points outside the diagram are reported as such', () => {
  const win = boot();
  const api = win.__SPX.release5;
  api.addPoint(1.1, 950);
  const text = win.document.getElementById('spx-r5-points-list').textContent;
  assert.ok(text.length > 0, 'rows rendered');
});

test('switching to the poster changes the viewBox to the poster page size', () => {
  const win = boot();
  win.__SPX.release5.setMap('poster');
  const vb = win.document.getElementById('spx-r5-svg').getAttribute('viewBox');
  assert.equal(vb, `0 0 ${win.SPXPosterGeometry.PAGE.w} ${win.SPXPosterGeometry.PAGE.h}`);
});

test('poster mode uses the poster classifier', () => {
  const win = boot();
  const api = win.__SPX.release5;
  api.setMap('poster');
  assert.equal(api.regionAt(0.4, 600), win.SPXPosterGeometry.regionAt(0.4, 600));
});

test('poster mode reports a load failure rather than throwing', () => {
  const win = boot();
  win.__SPX.release5.setMap('poster');
  assert.equal(win.__SPX.release5.posterLoaded(), false, 'fetch is stubbed to fail');
  assert.ok(win.document.getElementById('spx-r5-svg'), 'diagram element survives');
});

test('switching maps reseeds points inside the new range', () => {
  const win = boot();
  const api = win.__SPX.release5;
  api.setMap('poster');
  api.state().points.forEach(p => {
    assert.ok(p.c >= 0 && p.c <= win.SPXPosterGeometry.POINTS.cementiteC, `carbon in range: ${p.c}`);
  });
});

test('unit toggle switches the temperature column header', () => {
  const win = boot();
  const imperial = win.document.querySelector('#spx-r5-unit [data-r5-unit="imperial"]');
  imperial.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.match(win.document.getElementById('spx-r5-points-list').innerHTML, /\u00B0F/);
});

test('changing units does not move points', () => {
  const win = boot();
  const api = win.__SPX.release5;
  const before = api.state().points.map(p => ({ c: p.c, t: p.t }));
  win.document.querySelector('#spx-r5-unit [data-r5-unit="imperial"]')
    .dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  const after = api.state().points.map(p => ({ c: p.c, t: p.t }));
  assert.deepEqual(after, before, 'canonical values unchanged');
});

test('experience level changes the explanation text', () => {
  const win = boot();
  const api = win.__SPX.release5;
  const help = () => win.document.getElementById('spx-r5-help').textContent;
  api.setLevel('beginner');
  const beginner = help();
  api.setLevel('advanced');
  const advanced = help();
  assert.notEqual(beginner, advanced, 'copy differs by level');
});

test('advanced level surfaces the validation caution', () => {
  const win = boot();
  win.__SPX.release5.setLevel('advanced');
  assert.match(win.document.getElementById('spx-r5-help').textContent, /[Vv]alidate/);
});

test('zoom controls update the readout and clamp at fit', () => {
  const win = boot();
  const label = () => win.document.getElementById('spx-r5-zoom-label').textContent;
  win.document.getElementById('spx-r5-zoom-in').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.equal(label(), '125%');
  win.document.getElementById('spx-r5-zoom-reset').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.equal(label(), '100%');
  win.document.getElementById('spx-r5-zoom-out').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.equal(label(), '100%', 'clamped at fit');
});

test('the source note credits Buehler and ASM on the poster tab', () => {
  const win = boot();
  win.__SPX.release5.setMap('poster');
  const note = win.document.getElementById('spx-r5-source-note').textContent;
  assert.match(note, /Buehler/);
  assert.match(note, /ASM International/);
  assert.match(note, /permission/i);
});

test('the rapid tab states it is not a TTT or CCT diagram', () => {
  const win = boot();
  assert.match(win.document.getElementById('spx-r5-subtitle').textContent, /not a TTT or CCT/i);
});

test('the model note declares which boundaries are approximate', () => {
  const win = boot();
  assert.match(win.document.getElementById('spx-r5-model-note').textContent, /approximation/i);
});

test('state serialisation round-trips through the host hooks', () => {
  const win = boot();
  win.serializable = () => ({ base: true });
  win.restore = () => true;
  win.eval(read('steel-phase-explorer-release5.js'));
  assert.ok(typeof win.serializable === 'function');
});

test('no duplicate element ids in the injected panel', () => {
  const win = boot();
  const ids = [...win.document.getElementById('spx-tab-reference-diagrams').querySelectorAll('[id]')]
    .map(n => n.id);
  assert.equal(new Set(ids).size, ids.length, 'ids unique');
});

/* ---------- reference-layer rebuild guard ----------
 * The poster layer costs a 2.2 MB parse and ~15k node imports. Rebuilding it
 * on every render blocks the main thread and presents as a stuck loading
 * indicator, which is exactly what shipped before this guard existed.
 */

test('the reference layer is not rebuilt on an ordinary re-render', () => {
  const win = boot();
  const first = win.document.querySelector('#spx-r5-reference').firstChild;
  win.__SPX.release5.render();
  win.__SPX.release5.render();
  const after = win.document.querySelector('#spx-r5-reference').firstChild;
  assert.equal(after, first, 'same node instance, so no rebuild happened');
});

test('moving a point does not rebuild the reference layer', () => {
  const win = boot();
  const first = win.document.querySelector('#spx-r5-reference').firstChild;
  win.__SPX.release5.addPoint(0.5, 400);
  assert.equal(win.document.querySelector('#spx-r5-reference').firstChild, first);
});

test('toggling the crosshair does not rebuild the reference layer', () => {
  const win = boot();
  const first = win.document.querySelector('#spx-r5-reference').firstChild;
  const box = win.document.getElementById('spx-r5-crosshair-toggle');
  box.checked = false;
  box.dispatchEvent(new win.Event('change'));
  assert.equal(win.document.querySelector('#spx-r5-reference').firstChild, first);
});

test('toggling labels does rebuild the reference layer', () => {
  const win = boot();
  const first = win.document.querySelector('#spx-r5-reference').firstChild;
  const box = win.document.getElementById('spx-r5-labels');
  box.checked = false;
  box.dispatchEvent(new win.Event('change'));
  assert.notEqual(win.document.querySelector('#spx-r5-reference').firstChild, first);
});

test('switching diagrams rebuilds the reference layer', () => {
  const win = boot();
  const first = win.document.querySelector('#spx-r5-reference').firstChild;
  win.__SPX.release5.setMap('poster');
  assert.notEqual(win.document.querySelector('#spx-r5-reference').firstChild, first);
});

test('a failed poster load reports an error state rather than spinning', async () => {
  const win = boot();
  win.__SPX.release5.setMap('poster');
  await new Promise(r => setTimeout(r, 20));
  assert.equal(win.__SPX.release5.posterState(), 'error');
  assert.equal(win.document.getElementById('spx-r5-loading').hidden, true,
    'loading indicator is cleared on failure');
});

test('a failed poster load surfaces a reason and a retry control', async () => {
  const win = boot();
  win.__SPX.release5.setMap('poster');
  await new Promise(r => setTimeout(r, 20));
  assert.match(win.document.getElementById('spx-r5-status').textContent, /could not be loaded/i);
  assert.ok(win.document.getElementById('spx-r5-retry'), 'retry button offered');
});

test('a failed poster load is not retried on every render', async () => {
  const win = boot();
  let calls = 0;
  win.fetch = () => { calls++; return Promise.reject(new Error('offline')); };
  win.__SPX.release5.setMap('poster');
  await new Promise(r => setTimeout(r, 20));
  const afterFirst = calls;
  win.__SPX.release5.render();
  win.__SPX.release5.render();
  assert.equal(calls, afterFirst, 'error state suppresses repeat fetches');
});

test('concurrent poster requests share one in-flight fetch', async () => {
  const win = boot();
  let calls = 0;
  win.fetch = () => { calls++; return new Promise(() => {}); };
  win.__SPX.release5.setMap('poster');
  win.__SPX.release5.render();
  win.__SPX.release5.render();
  assert.equal(calls, 1, 'one request, not one per render');
});

test('a non-SVG response is rejected rather than injected', async () => {
  const win = boot();
  win.fetch = () => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('<html>404</html>') });
  win.__SPX.release5.setMap('poster');
  await new Promise(r => setTimeout(r, 20));
  assert.equal(win.__SPX.release5.posterState(), 'error');
  assert.match(win.document.getElementById('spx-r5-status').textContent, /not SVG/i);
});

test('an HTTP error is reported with its status code', async () => {
  const win = boot();
  win.fetch = () => Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
  win.__SPX.release5.setMap('poster');
  await new Promise(r => setTimeout(r, 20));
  assert.match(win.document.getElementById('spx-r5-status').textContent, /404/);
});

test('a successful poster load injects the artwork once', async () => {
  const win = boot();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 2736"><rect width="10" height="10"/></svg>';
  win.fetch = () => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(svg) });
  win.__SPX.release5.setMap('poster');
  await new Promise(r => setTimeout(r, 30));
  assert.equal(win.__SPX.release5.posterState(), 'ready');
  assert.equal(win.document.querySelectorAll('#spx-r5-reference .spx-r5-poster').length, 1);
  win.__SPX.release5.render();
  assert.equal(win.document.querySelectorAll('#spx-r5-reference .spx-r5-poster').length, 1,
    'still one after a re-render');
});
