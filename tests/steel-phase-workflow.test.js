'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { bootTool, ready, ROOT } = require('./helpers/steel-phase-harness.js');

/* Serve the real poster asset so the poster tab can be exercised end to end. */
function posterFetch() {
  return url => {
    const rel = String(url).replace(/^https?:\/\/[^/]+\//, '').replace(/^\//, '');
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
    }
    const body = fs.readFileSync(file);
    return Promise.resolve({
      ok: true, status: 200,
      text: () => Promise.resolve(body.toString('utf8')),
      blob: () => Promise.resolve({ size: body.length })
    });
  };
}

async function tool(opts) {
  const ctx = bootTool(opts);
  await ready(ctx.win);
  return ctx;
}

const r5 = win => win.__SPX.release5;

/* ---------- load and chain ---------- */

test('the page loads with no console or runtime errors', async t => {
  const { win, record } = await tool();
  t.after(() => win.close());
  assert.deepEqual(record.errors, [], 'console must be clean');
});

test('every script in the loader chain resolves', async t => {
  const { win, record } = await tool();
  t.after(() => win.close());
  const missing = record.missing.filter(m => !m.startsWith('css2'));
  assert.deepEqual(missing, [], 'no 404s on local assets');
  ['core', 'app', 'release1-loader', 'release2-loader', 'release3-loader',
   'release4-loader', 'release5-loader', 'release5.js',
   'poster-geometry', 'rapid-geometry'].forEach(part => {
    assert.ok(record.loaded.some(f => f.includes(part)), `did not load: ${part}`);
  });
});

test('all five releases register their test hooks', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  ['release1', 'release2', 'release3', 'release4', 'release5']
    .forEach(k => assert.ok(win.__SPX[k], `missing hook: ${k}`));
});

test('the reference diagrams tab appears with the rest', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  const tabs = [...doc.querySelectorAll('.spx-tabs [data-tab]')].map(b => b.dataset.tab);
  assert.ok(tabs.includes('reference-diagrams'), 'release 5 tab present');
  assert.ok(tabs.length >= 10, `expected the full tab set, got ${tabs.length}`);
});

test('geometry modules load before the render module that needs them', async t => {
  const { win, record } = await tool();
  t.after(() => win.close());
  const idx = name => record.loaded.findIndex(f => f.includes(name));
  assert.ok(idx('poster-geometry') < idx('release5.js'), 'poster geometry first');
  assert.ok(idx('rapid-geometry') < idx('release5.js'), 'rapid geometry first');
});

test('every tab button has a matching panel', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  [...doc.querySelectorAll('.spx-tabs [data-tab]')].forEach(btn => {
    const panel = doc.querySelector(`[data-panel="${btn.dataset.tab}"]`);
    assert.ok(panel, `no panel for tab: ${btn.dataset.tab}`);
  });
});

test('element ids are unique across the whole assembled tool', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  const ids = [...doc.querySelectorAll('[id]')].map(n => n.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual([...new Set(dupes)], [], 'duplicate ids break getElementById');
});

/* ---------- tab switching ---------- */

test('switching tabs shows one panel at a time', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  win.switchTab('reference-diagrams');
  const panel = doc.getElementById('spx-tab-reference-diagrams');
  assert.equal(panel.hidden, false, 'target panel visible');
  const visible = [...doc.querySelectorAll('[data-panel]')].filter(p => !p.hidden);
  assert.equal(visible.length, 1, `exactly one panel visible, saw ${visible.length}`);
});

test('switching away and back leaves the diagram intact', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  win.switchTab('reference-diagrams');
  const before = doc.querySelectorAll('#spx-r5-reference [data-r5-region]').length;
  win.switchTab('equilibrium');
  win.switchTab('reference-diagrams');
  assert.equal(doc.querySelectorAll('#spx-r5-reference [data-r5-region]').length, before);
});

/* ---------- rapid diagram ---------- */

test('the rapid diagram renders its regions and critical lines', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  assert.ok(doc.querySelectorAll('#spx-r5-reference [data-r5-region]').length >= 6);
  assert.ok(doc.querySelectorAll('#spx-r5-emphasis .spx-r5-critical').length >= 5);
});

test('no rendered path contains a malformed coordinate', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  doc.querySelectorAll('#spx-tab-reference-diagrams path[d]').forEach(p => {
    assert.ok(!/NaN|Infinity|undefined/.test(p.getAttribute('d')));
  });
});

/* ---------- poster diagram, served from disk ---------- */

test('the poster loads and injects its artwork', async t => {
  const { win, doc } = await tool({ fetch: posterFetch() });
  t.after(() => win.close());
  r5(win).setMap('poster');
  await new Promise(r => setTimeout(r, 900));
  assert.equal(r5(win).posterState(), 'ready', 'poster fetched from disk');
  assert.equal(doc.querySelectorAll('#spx-r5-reference .spx-r5-poster').length, 1);
  assert.ok(doc.querySelectorAll('#spx-r5-reference .spx-r5-poster path').length > 1000,
    'the vector artwork is present, not a placeholder');
});

test('the poster viewBox matches the artwork page size', async t => {
  const { win, doc } = await tool({ fetch: posterFetch() });
  t.after(() => win.close());
  r5(win).setMap('poster');
  await new Promise(r => setTimeout(r, 900));
  assert.equal(doc.getElementById('spx-r5-svg').getAttribute('viewBox'), '0 0 1800 2736');
});

test('poster raster references resolve to files that exist', async t => {
  const { win, doc } = await tool({ fetch: posterFetch() });
  t.after(() => win.close());
  r5(win).setMap('poster');
  await new Promise(r => setTimeout(r, 900));
  const imgs = [...doc.querySelectorAll('#spx-r5-reference image')];
  assert.ok(imgs.length >= 20, `expected the poster rasters, got ${imgs.length}`);
  imgs.forEach(img => {
    const href = img.getAttribute('href') ||
      img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    assert.ok(href, 'image has a reference');
    assert.ok(fs.existsSync(path.join(ROOT, href.replace(/^\//, ''))), `missing raster: ${href}`);
  });
});

test('the poster is only fetched once no matter how often it renders', async t => {
  let calls = 0;
  const base = posterFetch();
  const { win } = await tool({ fetch: (...a) => { calls++; return base(...a); } });
  t.after(() => win.close());
  r5(win).setMap('poster');
  await new Promise(r => setTimeout(r, 900));
  const after = calls;
  r5(win).render(); r5(win).render(); r5(win).render();
  assert.equal(calls, after, 'renders reuse the cached artwork');
});

/* ---------- points ---------- */

test('points can be added, edited and removed', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  const start = r5(win).state().points.length;
  const id = r5(win).addPoint(0.55, 420);
  assert.equal(r5(win).state().points.length, start + 1);

  const input = doc.querySelector(`[data-r5-c="${id}"]`);
  assert.ok(input, 'the new point has an editable row');
  input.value = '0.9';
  input.dispatchEvent(new win.Event('change', { bubbles: true }));
  const moved = r5(win).state().points.find(p => p.id === id);
  assert.ok(Math.abs(moved.c - 0.9) < 1e-9, 'edit applied');

  assert.equal(r5(win).removeActive(), true);
  assert.equal(r5(win).state().points.length, start);
});

test('at least one point always survives', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  while (r5(win).removeActive()) { /* drain */ }
  assert.equal(r5(win).state().points.length, 1);
});

test('points are clamped inside the plotted range', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  r5(win).addPoint(99, 99999);
  const p = r5(win).state().points.slice(-1)[0];
  const R = win.SPXRapidGeometry;
  assert.ok(p.c <= R.RANGE.cMax && p.c >= R.RANGE.cMin, `carbon clamped: ${p.c}`);
  assert.ok(p.t <= R.RANGE.tMax && p.t >= R.RANGE.tMin, `temperature clamped: ${p.t}`);
});

/* ---------- units ---------- */

test('changing units updates the display without moving any point', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  const before = r5(win).state().points.map(p => ({ c: p.c, t: p.t }));
  doc.querySelector('#spx-r5-unit [data-r5-unit="imperial"]')
    .dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.match(doc.getElementById('spx-r5-points-list').innerHTML, /\u00B0F/);
  assert.deepEqual(r5(win).state().points.map(p => ({ c: p.c, t: p.t })), before);
});

/* ---------- legend, highlight, region readout ---------- */

test('the readout always agrees with the geometry module', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  const G = win.SPXRapidGeometry;
  for (let c = 0.25; c <= 1.15; c += 0.1) {
    for (let temp = 0; temp <= 900; temp += 90) {
      assert.equal(r5(win).regionAt(c, temp), G.regionAt(c, temp), `at ${c},${temp}`);
    }
  }
});

test('legend selection highlights on both diagrams', async t => {
  const { win, doc } = await tool({ fetch: posterFetch() });
  t.after(() => win.close());
  const rects = () => doc.querySelectorAll('#spx-r5-overlay .spx-r5-highlight rect').length;

  r5(win).setHighlight('pearlite');
  assert.ok(rects() > 0, 'rapid highlight drawn');

  r5(win).setMap('poster');
  await new Promise(r => setTimeout(r, 900));
  r5(win).setHighlight('austenite');
  assert.ok(rects() > 0, 'poster highlight drawn');
});

/* ---------- controls ---------- */

test('critical line and label toggles take effect', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  const crit = doc.getElementById('spx-r5-critical');
  crit.checked = false;
  crit.dispatchEvent(new win.Event('change'));
  assert.equal(doc.querySelectorAll('#spx-r5-emphasis .spx-r5-critical').length, 0);

  const labels = doc.getElementById('spx-r5-labels');
  labels.checked = false;
  labels.dispatchEvent(new win.Event('change'));
  assert.equal(doc.querySelectorAll('.spx-r5-fieldlabel').length, 0);
});

test('experience levels change the explanation', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  const help = () => doc.getElementById('spx-r5-help').textContent;
  r5(win).setLevel('beginner');
  const beginner = help();
  r5(win).setLevel('advanced');
  assert.notEqual(help(), beginner);
  assert.match(help(), /[Vv]alidate/, 'advanced surfaces the caution');
});

test('zoom steps and clamps at fit', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  const label = () => doc.getElementById('spx-r5-zoom-label').textContent;
  const click = id => doc.getElementById(id).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  click('spx-r5-zoom-in');
  assert.equal(label(), '125%');
  click('spx-r5-zoom-reset');
  assert.equal(label(), '100%');
  click('spx-r5-zoom-out');
  assert.equal(label(), '100%', 'cannot zoom below fit');
});

test('full screen is wired without throwing', async t => {
  const { win, doc } = await tool();
  t.after(() => win.close());
  assert.doesNotThrow(() => {
    doc.getElementById('spx-r5-fullscreen')
      .dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
});

/* ---------- export ---------- */

test('PNG export runs without a cross-origin fetch', async t => {
  const requested = [];
  const base = posterFetch();
  const { win, doc } = await tool({ fetch: (u, ...rest) => { requested.push(String(u)); return base(u, ...rest); } });
  t.after(() => win.close());

  doc.getElementById('spx-r5-export').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 300));

  requested.forEach(u => {
    assert.ok(!/^https?:\/\/(?!upskillsprint\.com)/.test(u),
      `export must not reach a third-party origin: ${u}`);
  });
  assert.match(doc.getElementById('spx-r5-status').textContent, /PNG|export/i);
});

/* ---------- persistence ---------- */

test('release 5 state survives a serialize and restore round trip', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  r5(win).setLevel('advanced');
  r5(win).addPoint(0.66, 333);
  const snapshot = JSON.parse(JSON.stringify(win.serializable()));
  assert.ok(snapshot.release5, 'release 5 state is serialised');

  r5(win).setLevel('beginner');
  win.restore(snapshot);
  assert.equal(r5(win).state().level, 'advanced', 'level restored');
  assert.ok(r5(win).state().points.some(p => Math.abs(p.c - 0.66) < 1e-9), 'points restored');
});

/* ---------- how-to guide ---------- */

test('the how-to guide exists and its internal links resolve', () => {
  const guide = path.join(ROOT, 'tools', 'steel-phase-explorer', 'how-to-use', 'index.html');
  assert.ok(fs.existsSync(guide), 'guide present');
  const html = fs.readFileSync(guide, 'utf8');
  const ids = new Set([...html.matchAll(/id="([a-z0-9-]+)"/g)].map(m => m[1]));
  [...html.matchAll(/href="#([a-z0-9-]+)"/g)].forEach(m => {
    assert.ok(ids.has(m[1]), `broken anchor in the guide: #${m[1]}`);
  });
});

test('links between the tool and the guide point at real files', () => {
  const pages = [
    path.join(ROOT, 'tools', 'steel-phase-explorer.html'),
    path.join(ROOT, 'tools', 'steel-phase-explorer', 'how-to-use', 'index.html')
  ];
  pages.forEach(page => {
    const html = fs.readFileSync(page, 'utf8');
    [...html.matchAll(/href="(\/[^"#?]+)"/g)].map(m => m[1]).forEach(href => {
      if (href.startsWith('/assets/') || href.endsWith('.css')) return;
      const direct = path.join(ROOT, href.replace(/^\//, ''));
      const asHtml = direct + '.html';
      const asIndex = path.join(direct, 'index.html');
      assert.ok(
        fs.existsSync(direct) || fs.existsSync(asHtml) || fs.existsSync(asIndex),
        `dead link in ${path.basename(page)}: ${href}`
      );
    });
  });
});

/* ---------- untrusted restored state ----------
 * Restored payloads come from a saved file or a share link, so they are
 * untrusted. The state object used to be assigned wholesale.
 */

test('a restore payload with no points falls back to the examples', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  assert.doesNotThrow(() => win.restore({ release5: { map: 'rapid', level: 'engineer' } }));
  assert.ok(r5(win).state().points.length >= 1, 'seeded rather than left empty');
});

test('a restore payload with junk points is repaired, not trusted', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  win.restore({ release5: {
    map: 'rapid', level: 'engineer',
    points: [{ id: 1, c: 999, t: -9999 }, { id: 'x', c: 'abc', t: null }, null]
  } });
  const R = win.SPXRapidGeometry;
  const pts = r5(win).state().points;
  assert.ok(pts.length >= 1, 'something usable survived');
  pts.forEach(p => {
    assert.ok(isFinite(p.c) && isFinite(p.t), 'numeric');
    assert.ok(p.c >= R.RANGE.cMin && p.c <= R.RANGE.cMax, `carbon in range: ${p.c}`);
    assert.ok(p.t >= R.RANGE.tMin && p.t <= R.RANGE.tMax, `temperature in range: ${p.t}`);
  });
});

test('a restore payload with an unknown diagram falls back to rapid', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  win.restore({ release5: { map: 'not-a-diagram', level: 'nonsense', zoom: 9999 } });
  const st = r5(win).state();
  assert.equal(st.map, 'rapid');
  assert.equal(st.level, 'engineer');
  assert.ok(st.zoom <= 6, 'zoom clamped');
});

test('restored point ids stay unique', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  win.restore({ release5: { map: 'rapid', points: [
    { id: 2, c: 0.3, t: 400 }, { id: 2, c: 0.5, t: 300 }, { id: 2, c: 0.7, t: 200 }
  ] } });
  const ids = r5(win).state().points.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids would break selection');
});

test('a restored highlight for the wrong diagram is dropped', async t => {
  const { win } = await tool();
  t.after(() => win.close());
  win.restore({ release5: { map: 'rapid', highlight: 'liquidCementite' } });
  assert.equal(r5(win).highlight(), null, 'poster-only region not carried onto the rapid tab');
});
