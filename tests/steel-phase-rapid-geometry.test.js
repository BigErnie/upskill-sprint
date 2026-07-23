'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const R = require('../tools/steel-phase-explorer-rapid-geometry.js');
const P = require('../tools/steel-phase-explorer-poster-geometry.js');

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: expected ${b} +/- ${tol}, got ${a}`);

/* ---------- transforms ---------- */

test('carbon transform round-trips', () => {
  [0, 0.2, 0.77, 1.0, 1.2].forEach(c =>
    near(R.cOf(R.xOf(c)), c, 1e-9, `C=${c}`));
});

test('temperature transform round-trips', () => {
  [-100, 0, 300, 727, 1000].forEach(t =>
    near(R.tOf(R.yOf(t)), t, 1e-9, `T=${t}`));
});

test('plot rectangle corners map to the range extremes', () => {
  near(R.xOf(0), R.PLOT.x0, 1e-9, 'left edge');
  near(R.xOf(1.2), R.PLOT.x1, 1e-9, 'right edge');
  near(R.yOf(1000), R.PLOT.yTop, 1e-9, 'top edge');
  near(R.yOf(-100), R.PLOT.yBottom, 1e-9, 'bottom edge');
});

test('y decreases as temperature rises', () => {
  assert.ok(R.yOf(900) < R.yOf(100));
});

/* ---------- quantitative boundaries ---------- */

test('A1 is the eutectoid temperature', () => {
  assert.equal(R.a1(), 727);
});

test('A3 starts at 912 and meets the eutectoid', () => {
  near(R.a3(0), 912, 0.5, 'A3 at pure iron');
  near(R.a3(0.77), 727, 0.5, 'A3 at eutectoid');
});

test('Acm is flat below the eutectoid and rises above it', () => {
  near(R.acm(0.5), 727, 1e-9, 'Acm clamped below eutectoid');
  assert.ok(R.acm(1.0) > 727, 'Acm rises');
  assert.ok(R.acm(1.2) > R.acm(1.0), 'Acm monotonic');
});

test('Ms follows Andrews for plain carbon', () => {
  near(R.ms(0), 539, 1e-9, 'Ms at pure iron');
  near(R.ms(0.2), 454.4, 1e-9, 'Ms at 0.2 wt%');
  near(R.ms(0.77), 213.29, 0.01, 'Ms at eutectoid');
  near(R.ms(1.2), 31.4, 1e-9, 'Ms at 1.2 wt%');
});

test('Ms is 66 degC below the value the superseded implementation used', () => {
  /* The old fit gave 266 degC at 0.8 wt%; Andrews gives 200.6. */
  near(R.ms(0.8), 200.6, 0.01, 'Andrews at 0.8 wt%');
});

test('Mf sits a fixed offset below Ms', () => {
  [0.2, 0.6, 1.0].forEach(c => near(R.mf(c), R.ms(c) - 215, 1e-9, `Mf at ${c}`));
});

test('Ms decreases monotonically with carbon', () => {
  let prev = Infinity;
  for (let c = 0; c <= 1.2; c += 0.05) {
    assert.ok(R.ms(c) < prev, `monotonic at ${c}`);
    prev = R.ms(c);
  }
});

test('Mf leaves the bottom of the chart at high carbon', () => {
  assert.ok(R.mf(1.2) < R.RANGE.tMin, 'Mf below chart at 1.2 wt%');
  assert.ok(R.mf(0.2) > R.RANGE.tMin, 'Mf on chart at 0.2 wt%');
});

/* ---------- agreement with the poster module ---------- */

test('A3 agrees with the poster module across the hypoeutectoid range', () => {
  for (let c = 0; c <= 0.77; c += 0.05)
    near(R.a3(c), P.a3(c), 0.5, `A3 at ${c.toFixed(2)}`);
});

test('Acm agrees with the poster module above the eutectoid', () => {
  for (let c = 0.8; c <= 1.2; c += 0.05)
    near(R.acm(c), P.acm(c), 0.5, `Acm at ${c.toFixed(2)}`);
});

test('both modules place the eutectoid identically', () => {
  assert.equal(R.EUTECTOID_T, P.POINTS.eutectoidT);
  assert.equal(R.EUTECTOID_C, P.POINTS.eutectoidC);
});

/* ---------- field division ordering ---------- */

test('field divisions descend in the correct order', () => {
  for (let c = 0.25; c <= 1.15; c += 0.05) {
    assert.ok(R.proeutectoidFloor(c) < 727, `proeutectoid below A1 at ${c.toFixed(2)}`);
    assert.ok(R.pearliteFloor(c) < R.proeutectoidFloor(c), `pearlite floor at ${c.toFixed(2)}`);
    assert.ok(R.upperBainiteFloor(c) < R.pearliteFloor(c), `bainite floor at ${c.toFixed(2)}`);
    assert.ok(R.ms(c) <= R.upperBainiteFloor(c) + 1e-9, `Ms not above bainite floor at ${c.toFixed(2)}`);
    assert.ok(R.mf(c) < R.ms(c), `Mf below Ms at ${c.toFixed(2)}`);
  }
});

test('the proeutectoid floor meets the eutectoid point from both sides', () => {
  near(R.proeutectoidFloor(0.77), 727, 0.5, 'at the eutectoid');
  assert.ok(R.proeutectoidFloor(0.7) < 727, 'below on the left');
  assert.ok(R.proeutectoidFloor(0.9) < 727, 'below on the right');
});

test('the austenitising band sits above the austenite floor', () => {
  for (let c = 0.2; c <= 1.2; c += 0.1) {
    assert.ok(R.austenitisingLow(c) > R.austeniteFloor(c), `band above floor at ${c.toFixed(1)}`);
    assert.ok(R.austenitisingHigh(c) > R.austenitisingLow(c), `band has depth at ${c.toFixed(1)}`);
  }
});

/* ---------- classification ---------- */

test('high temperature is austenite', () => {
  assert.equal(R.regionAt(0.5, 990), 'austenite');
});

test('the austenitising band classifies', () => {
  const c = 0.4, t = (R.austenitisingLow(c) + R.austenitisingHigh(c)) / 2;
  assert.equal(R.regionAt(c, t), 'austenitising');
});

test('hypoeutectoid just below A1 is ferrite plus pearlite', () => {
  assert.equal(R.regionAt(0.4, 700), 'ferritePearlite');
});

test('hypereutectoid just below A1 is cementite plus pearlite', () => {
  assert.equal(R.regionAt(1.0, 700), 'cementitePearlite');
});

test('lower bainite has no field below its onset carbon', () => {
  const onset = R.lowerBainiteOnsetC();
  assert.ok(onset > 0.3 && onset < 0.6, `onset near 0.42, got ${onset.toFixed(3)}`);
  assert.ok(R.ms(onset - 0.1) > R.bainiteDivide(onset - 0.1), 'Ms above divide below onset');
  assert.ok(R.ms(onset + 0.1) < R.bainiteDivide(onset + 0.1), 'Ms below divide above onset');
});

test('low carbon quenches straight from upper bainite to martensite', () => {
  const c = 0.25;
  assert.equal(R.regionAt(c, R.ms(c) + 10), 'upperBainite');
  assert.equal(R.regionAt(c, R.ms(c) - 10), 'martensiteAustenite');
});

test('mid range is pearlite then bainite as temperature falls', () => {
  const c = 0.9;
  assert.equal(R.regionAt(c, R.pearliteFloor(c) + 20), 'pearlite');
  assert.equal(R.regionAt(c, R.upperBainiteFloor(c) + 20), 'upperBainite');
  assert.equal(R.regionAt(c, R.ms(c) + 20), 'lowerBainite');
});

test('below Ms is martensite plus retained austenite', () => {
  const c = 0.6;
  assert.equal(R.regionAt(c, R.ms(c) - 20), 'martensiteAustenite');
});

test('below Mf is martensite', () => {
  const c = 0.3;
  assert.equal(R.regionAt(c, R.mf(c) - 20), 'martensite');
});

test('points off the chart report outside', () => {
  assert.equal(R.regionAt(-0.1, 500), 'outside');
  assert.equal(R.regionAt(1.5, 500), 'outside');
  assert.equal(R.regionAt(0.5, -200), 'outside');
  assert.equal(R.regionAt(0.5, 1200), 'outside');
});

test('every reachable key has a label', () => {
  const keys = new Set();
  for (let c = 0; c <= 1.2; c += 0.02)
    for (let t = -100; t <= 1000; t += 10) keys.add(R.regionAt(c, t));
  keys.forEach(k => assert.ok(R.LABELS[k], `missing label for ${k}`));
});

/* ---------- the anti-drift guarantee ---------- */

function pointInPolygon(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > pt[1]) !== (yj > pt[1])) &&
        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

test('every generated region polygon is non-degenerate', () => {
  ['austenitising', 'ferritePearlite', 'cementitePearlite', 'pearlite',
   'upperBainite', 'lowerBainite', 'martensiteAustenite', 'martensite']
    .forEach(k => {
      const poly = R.regionPolygon(k);
      assert.ok(poly && poly.length >= 4, `${k} produced a usable polygon`);
    });
});

test('polygon path serialises to valid SVG path data', () => {
  const d = R.polygonPath(R.regionPolygon('pearlite'));
  assert.match(d, /^M[\d.\- ]+(L[\d.\- ]+)+Z$/, 'path shape');
  assert.ok(!/NaN|Infinity|undefined/.test(d), 'no bad numbers');
});

test('DRIFT GUARD: the painted region and the classified region always agree', () => {
  const keys = ['ferritePearlite', 'cementitePearlite', 'pearlite',
                'upperBainite', 'lowerBainite', 'martensiteAustenite'];
  let checked = 0;
  keys.forEach(key => {
    const poly = R.regionPolygon(key, 96);
    /* Sample the interior on a grid and confirm the classifier agrees with
       whichever polygon actually contains the point. */
    for (let c = R.FIELD_C_MIN + 0.02; c <= 1.18; c += 0.04) {
      for (let t = -95; t <= 720; t += 12) {
        const pt = [R.xOf(c), R.yOf(t)];
        if (!pointInPolygon(pt, poly)) continue;
        checked++;
        assert.equal(R.regionAt(c, t), key,
          `painted ${key} but classified ${R.regionAt(c, t)} at ${c.toFixed(2)} wt%, ${t} degC`);
      }
    }
  });
  assert.ok(checked > 400, `expected a dense sample, only checked ${checked}`);
});

test('DRIFT GUARD: boundary polylines follow their own functions', () => {
  const line = R.boundaryPolyline(R.ms, 0.2, 1.2, 32);
  line.forEach(([x, y]) => {
    const c = R.cOf(x), t = R.tOf(y);
    near(t, R.ms(c), 1e-6, `Ms polyline at ${c.toFixed(3)} wt%`);
  });
});

test('boundary polylines clip to the chart range', () => {
  const line = R.boundaryPolyline(R.mf, 0, 1.2, 64);
  line.forEach(([, y]) => {
    const t = R.tOf(y);
    assert.ok(t >= R.RANGE.tMin - 1e-6 && t <= R.RANGE.tMax + 1e-6, `clipped: ${t}`);
  });
});

test('quantitative and approximate boundaries are declared separately', () => {
  assert.ok(R.QUANTITATIVE.includes('ms'), 'Ms declared quantitative');
  assert.ok(R.APPROXIMATE.includes('pearliteFloor'), 'pearlite floor declared approximate');
  assert.ok(R.APPROXIMATE.includes('bainiteDivide'), 'bainite divide declared approximate');
  R.QUANTITATIVE.forEach(k => assert.ok(!R.APPROXIMATE.includes(k), `${k} declared once`));
});
