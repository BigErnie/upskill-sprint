'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const G = require('../tools/steel-phase-explorer-poster-geometry.js');

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: expected ${b} +/- ${tol}, got ${a}`);

/* ---------- calibration anchors ---------- */

test('page size matches the converted poster artwork', () => {
  assert.equal(G.PAGE.w, 1800);
  assert.equal(G.PAGE.h, 2736);
});

test('carbon axis anchors land on the detected frame edges', () => {
  near(G.xOf(0), 236.0, 0.01, 'x at 0 wt%');
  near(G.xOf(6.68), 1554.0, 0.01, 'x at 6.68 wt%');
});

test('temperature axis anchors land on the drawn invariants', () => {
  near(G.yOf(727), 1220.0, 0.01, 'y at eutectoid');
  near(G.yOf(1148), 765.5, 0.01, 'y at eutectic');
});

test('scale factors are the expected magnitude', () => {
  near(G.pxPerWt, 197.3, 0.5, 'px per wt%');
  near(G.pxPerDeg, 1.0796, 0.001, 'px per degC');
});

test('carbon transform round-trips', () => {
  [0, 0.022, 0.77, 2.14, 4.3, 6.67].forEach(c =>
    near(G.cOf(G.xOf(c)), c, 1e-9, `round-trip C=${c}`));
});

test('temperature transform round-trips', () => {
  [0, 727, 912, 1148, 1495, 1538].forEach(t =>
    near(G.tOf(G.yOf(t)), t, 1e-9, `round-trip T=${t}`));
});

test('y decreases as temperature rises', () => {
  assert.ok(G.yOf(1148) < G.yOf(727));
  assert.ok(G.yOf(727) < G.yOf(0));
});

test('x increases with carbon', () => {
  assert.ok(G.xOf(0) < G.xOf(0.77));
  assert.ok(G.xOf(0.77) < G.xOf(6.67));
});

test('the eutectoid stays inside the page box', () => {
  const x = G.xOf(0.77), y = G.yOf(727);
  assert.ok(x > 0 && x < G.PAGE.w, 'x on page');
  assert.ok(y > 0 && y < G.PAGE.h, 'y on page');
});

test('preview verification constant names the eutectoid', () => {
  assert.equal(G.VERIFY_ON_PREVIEW.c, 0.77);
  assert.equal(G.VERIFY_ON_PREVIEW.t, 727);
});

/* ---------- boundary curves at known points ---------- */

test('liquidus starts at the melting point of iron', () => {
  near(G.liquidus(0), 1538, 0.5, 'liquidus at 0 wt%');
});

test('liquidus passes through the eutectic', () => {
  near(G.liquidus(4.3), 1148, 0.5, 'liquidus at eutectic');
});

test('liquidus falls then rises about the eutectic', () => {
  assert.ok(G.liquidus(3.0) > G.liquidus(4.3), 'falling to eutectic');
  assert.ok(G.liquidus(5.5) > G.liquidus(4.3), 'rising past eutectic');
});

test('austenite solidus reaches 2.14 wt% at the eutectic', () => {
  near(G.solidusGamma(2.14), 1148, 0.5, 'solidus at gamma max');
});

test('A3 starts at 912 degC', () => {
  near(G.a3(0), 912, 0.5, 'A3 at pure iron');
});

test('A3 meets the eutectoid', () => {
  near(G.a3(0.77), 727, 0.5, 'A3 at eutectoid');
});

test('A3 decreases monotonically', () => {
  let prev = Infinity;
  for (let c = 0; c <= 0.77; c += 0.05) {
    assert.ok(G.a3(c) <= prev + 1e-9, `A3 monotonic at ${c}`);
    prev = G.a3(c);
  }
});

test('Acm rises from the eutectoid to the eutectic', () => {
  near(G.acm(0.77), 727, 0.5, 'Acm at eutectoid');
  near(G.acm(2.14), 1148, 0.5, 'Acm at gamma max');
});

test('Acm increases monotonically', () => {
  let prev = -Infinity;
  for (let c = 0.77; c <= 2.14; c += 0.05) {
    assert.ok(G.acm(c) >= prev - 1e-9, `Acm monotonic at ${c}`);
    prev = G.acm(c);
  }
});

test('alpha solvus peaks at the eutectoid', () => {
  near(G.alphaSolvus(727), 0.022, 1e-6, 'max ferrite carbon');
  assert.ok(G.alphaSolvus(400) < 0.022, 'less soluble when cooler');
  assert.ok(G.alphaSolvus(20) < G.alphaSolvus(400), 'monotonic');
});

test('delta ferrite exists only in its temperature window', () => {
  assert.equal(G.deltaMaxC(1300), 0, 'none below 1394');
  assert.ok(G.deltaMaxC(1450) > 0, 'present in window');
  near(G.deltaMaxC(1495), 0.09, 1e-6, 'peritectic delta composition');
});

/* ---------- region classification ---------- */

const at = (c, t) => G.regionAt(c, t);

test('well above the liquidus is liquid', () => {
  assert.equal(at(2.0, 1580), 'liquid');
  assert.equal(at(5.0, 1400), 'liquid');
});

test('low carbon just under 1538 is delta ferrite', () => {
  assert.equal(at(0.02, 1450), 'deltaFerrite');
});

test('mid austenite field', () => {
  assert.equal(at(0.8, 1000), 'austenite');
  assert.equal(at(1.5, 1100), 'austenite');
});

test('hypoeutectoid below A3 is ferrite plus austenite', () => {
  assert.equal(at(0.3, 780), 'ferriteAustenite');
});

test('hypereutectoid below Acm is austenite plus cementite', () => {
  assert.equal(at(1.2, 800), 'austeniteCementite');
});

test('below the eutectoid a plain carbon steel is ferrite plus cementite', () => {
  assert.equal(at(0.4, 600), 'ferriteCementite');
  assert.equal(at(0.77, 500), 'ferriteCementite');
});

test('very low carbon below the eutectoid is single phase ferrite', () => {
  assert.equal(at(0.005, 600), 'ferrite');
});

test('hypereutectic between liquidus and eutectic is liquid plus cementite', () => {
  /* At 5.0 wt% C the liquidus is near 1178 degC, so the primary-cementite
     band is only about 30 degC deep before the eutectic at 1148. */
  assert.ok(G.liquidus(5.0) > 1148, 'liquidus sits above the eutectic');
  assert.equal(at(5.0, 1160), 'liquidCementite');
  assert.equal(at(5.0, 1200), 'liquid');
});

test('cast iron below the eutectic is austenite plus cementite', () => {
  assert.equal(at(3.5, 1000), 'austeniteCementite');
});

test('points off the diagram are reported as outside', () => {
  assert.equal(at(-0.5, 500), 'outside');
  assert.equal(at(8.0, 500), 'outside');
  assert.equal(at(1.0, -50), 'outside');
  assert.equal(at(1.0, 2000), 'outside');
});

test('every region key has a label', () => {
  const keys = new Set();
  for (let c = 0; c <= 6.67; c += 0.05)
    for (let t = 0; t <= 1600; t += 25) keys.add(at(c, t));
  keys.forEach(k => assert.ok(G.LABELS[k], `missing label for ${k}`));
});

test('classification is stable across the whole field', () => {
  for (let c = 0; c <= 6.67; c += 0.13)
    for (let t = 0; t <= 1600; t += 37) {
      const k = at(c, t);
      assert.equal(typeof k, 'string');
      assert.ok(k.length > 0, `empty key at ${c},${t}`);
    }
});

test('crossing the eutectoid changes the region', () => {
  assert.notEqual(at(0.4, 740), at(0.4, 710));
});

test('crossing the eutectic changes the region', () => {
  assert.notEqual(at(4.5, 1160), at(4.5, 1130));
});

test('drawn geometry and readout agree at the anchors', () => {
  near(G.tOf(1220.0), 727, 0.01, 'eutectoid readout from pixel');
  near(G.tOf(765.5), 1148, 0.01, 'eutectic readout from pixel');
  near(G.cOf(236.0), 0, 0.001, 'zero carbon from pixel');
  near(G.cOf(1554.0), 6.68, 0.001, 'cementite edge from pixel');
});
