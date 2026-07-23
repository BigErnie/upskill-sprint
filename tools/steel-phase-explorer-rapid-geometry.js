/*
 * Steel Phase & Transformation Explorer
 * Rapid-quench microconstituent map: geometry, classifier, generated regions.
 *
 * WHAT THIS DIAGRAM IS
 * --------------------
 * A carbon-versus-temperature map of the microconstituents formed when plain
 * carbon steel is austenitised and quenched into an isothermal bath held at
 * the temperature shown. It is NOT a TTT or CCT diagram: there is no time
 * axis, and nothing here can be read as a cooling rate.
 *
 * CONFIDENCE OF EACH BOUNDARY
 * ---------------------------
 * Quantitative, from published relationships:
 *   A1   727 degC, the eutectoid.
 *   A3   912 degC at pure iron, falling to the eutectoid at 0.77 wt%.
 *   Acm  rising from the eutectoid.
 *   Ms   Andrews:  Ms(degC) = 539 - 423*C   (plain carbon, no alloying)
 *   Mf   approximated as Ms - 215 degC. Widely used, but the finish is
 *        asymptotic in practice and retained austenite persists below it.
 *
 * Educational approximations, drawn to convey field topology only:
 *   ferrite+pearlite / pearlite division
 *   cementite+pearlite / pearlite division
 *   pearlite / upper bainite division
 *   upper bainite / lower bainite division
 *   the austenitising band
 * These carry no implied precision. Real boundaries depend on chemistry,
 * grain size, section size, homogeneity and holding time, and must be taken
 * from validated grade-specific data before any process decision.
 *
 * ANTI-DRIFT GUARANTEE
 * --------------------
 * regionPolygon() generates the drawn fields by sampling the same boundary
 * functions that regionAt() classifies with. The painted colour and the
 * reported region therefore cannot disagree; there is no second model.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SPXRapidGeometry = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VIEW = { w: 1000, h: 1120 };
  var PLOT = { x0: 150, x1: 940, yTop: 110, yBottom: 980 };
  var RANGE = { cMin: 0, cMax: 1.2, tMin: -100, tMax: 1000 };

  /* The source chart draws its colour fields from 0.2 wt% rightwards; below
     that the quench products are not usefully separable at this scale. */
  var FIELD_C_MIN = 0.2;

  var EUTECTOID_T = 727;
  var EUTECTOID_C = 0.77;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function xOf(c) {
    return PLOT.x0 + (c - RANGE.cMin) / (RANGE.cMax - RANGE.cMin) * (PLOT.x1 - PLOT.x0);
  }
  function yOf(t) {
    return PLOT.yBottom - (t - RANGE.tMin) / (RANGE.tMax - RANGE.tMin) * (PLOT.yBottom - PLOT.yTop);
  }
  function cOf(x) {
    return RANGE.cMin + (x - PLOT.x0) / (PLOT.x1 - PLOT.x0) * (RANGE.cMax - RANGE.cMin);
  }
  function tOf(y) {
    return RANGE.tMin + (PLOT.yBottom - y) / (PLOT.yBottom - PLOT.yTop) * (RANGE.tMax - RANGE.tMin);
  }

  /* ---- quantitative boundaries ---- */

  function a1() { return EUTECTOID_T; }

  function a3(c) {
    var f = clamp(c / EUTECTOID_C, 0, 1);
    return 912 - (912 - EUTECTOID_T) * Math.pow(f, 0.62);
  }

  function acm(c) {
    if (c <= EUTECTOID_C) return EUTECTOID_T;
    var f = clamp((c - EUTECTOID_C) / (2.14 - EUTECTOID_C), 0, 1);
    return EUTECTOID_T + (1148 - EUTECTOID_T) * Math.pow(f, 0.85);
  }

  /* Lower edge of the austenite field: A3 below the eutectoid, Acm above. */
  function austeniteFloor(c) { return c <= EUTECTOID_C ? a3(c) : acm(c); }

  /* Andrews, plain carbon. Alloying depresses Ms and is not modelled. */
  function ms(c) { return 539 - 423 * c; }

  /* Approximation. The true finish is asymptotic. */
  function mf(c) { return ms(c) - 215; }

  /* ---- educational field divisions ---- */

  function austenitisingLow(c) { return austeniteFloor(c) + 25; }
  function austenitisingHigh(c) { return austeniteFloor(c) + 75; }

  /* Meets the eutectoid point exactly from both sides. */
  function proeutectoidFloor(c) {
    if (c <= EUTECTOID_C) {
      var f = clamp((EUTECTOID_C - c) / (EUTECTOID_C - FIELD_C_MIN), 0, 1);
      return EUTECTOID_T - 90 * Math.pow(f, 0.75);
    }
    var g = clamp((c - EUTECTOID_C) / (RANGE.cMax - EUTECTOID_C), 0, 1);
    return EUTECTOID_T - 70 * Math.pow(g, 0.8);
  }

  function pearliteFloor(c) { return 560 - 15 * c; }

  /*
   * Upper/lower bainite divide, near 350 degC and only weakly carbon
   * dependent. Ms crosses it near 0.42 wt%: below that carbon Ms sits above
   * the divide, so there is no lower bainite field at all and a quench past
   * Ms forms martensite directly. This is why the lower bainite region
   * widens towards higher carbon.
   */
  function bainiteDivide(c) { return 380 - 40 * c; }

  /* Floor of the upper bainite field: whichever of the divide or Ms is met
     first on cooling. Never below Ms. */
  function upperBainiteFloor(c) { return Math.max(bainiteDivide(c), ms(c)); }

  /* Carbon above which a lower bainite field exists at all. */
  function lowerBainiteOnsetC() {
    var lo = 0, hi = RANGE.cMax, mid, i;
    for (i = 0; i < 60; i++) {
      mid = (lo + hi) / 2;
      if (ms(mid) > bainiteDivide(mid)) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  var LABELS = {
    austenite: 'Austenite',
    austenitising: 'Austenitising range',
    ferritePearlite: 'Ferrite + pearlite',
    cementitePearlite: 'Cementite + pearlite',
    pearlite: 'Pearlite',
    upperBainite: 'Upper bainite',
    lowerBainite: 'Lower bainite',
    martensiteAustenite: 'Martensite + retained austenite',
    martensite: 'Martensite',
    outside: 'Outside the chart'
  };

  var QUANTITATIVE = ['a1', 'a3', 'acm', 'ms', 'mf'];
  var APPROXIMATE = ['austenitising', 'proeutectoidFloor', 'pearliteFloor', 'bainiteDivide'];

  function regionAt(c, t) {
    if (c < RANGE.cMin || c > RANGE.cMax || t < RANGE.tMin || t > RANGE.tMax) return 'outside';

    if (t >= austenitisingHigh(c)) return 'austenite';
    if (t >= austenitisingLow(c)) return 'austenitising';
    if (t >= austeniteFloor(c)) return 'austenite';
    if (t >= EUTECTOID_T) return 'austenite';

    if (t >= proeutectoidFloor(c)) {
      return c < EUTECTOID_C ? 'ferritePearlite' : 'cementitePearlite';
    }
    if (t >= pearliteFloor(c)) return 'pearlite';
    if (t >= upperBainiteFloor(c)) return 'upperBainite';
    if (t >= ms(c)) return 'lowerBainite';
    if (t >= mf(c)) return 'martensiteAustenite';
    return 'martensite';
  }

  /*
   * Region fills, generated by sampling the boundary functions above.
   * Returns an array of [x, y] view-space points forming a closed polygon,
   * or null where the region is empty at this composition range.
   */
  function regionPolygon(key, samples) {
    var n = samples || 64;
    var cLo = FIELD_C_MIN, cHi = RANGE.cMax;

    var upper, lower;
    switch (key) {
      case 'austenitising': upper = austenitisingHigh; lower = austenitisingLow; break;
      case 'ferritePearlite':
        cHi = EUTECTOID_C;
        upper = function () { return EUTECTOID_T; }; lower = proeutectoidFloor; break;
      case 'cementitePearlite':
        cLo = EUTECTOID_C;
        upper = function () { return EUTECTOID_T; }; lower = proeutectoidFloor; break;
      case 'pearlite': upper = proeutectoidFloor; lower = pearliteFloor; break;
      case 'upperBainite': upper = pearliteFloor; lower = upperBainiteFloor; break;
      case 'lowerBainite': upper = bainiteDivide; lower = ms; break;
      case 'martensiteAustenite': upper = ms; lower = mf; break;
      case 'martensite':
        upper = mf; lower = function () { return RANGE.tMin; }; break;
      default: return null;
    }

    var top = [], bottom = [], i, c, tU, tL;
    for (i = 0; i <= n; i++) {
      c = cLo + (cHi - cLo) * i / n;
      tU = clamp(upper(c), RANGE.tMin, RANGE.tMax);
      tL = clamp(lower(c), RANGE.tMin, RANGE.tMax);
      if (tU <= tL) continue;
      top.push([xOf(c), yOf(tU)]);
      bottom.push([xOf(c), yOf(tL)]);
    }
    if (top.length < 2) return null;
    return top.concat(bottom.reverse());
  }

  function polygonPath(points) {
    if (!points || !points.length) return '';
    return points.map(function (p, i) {
      return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2);
    }).join(' ') + ' Z';
  }

  function boundaryPolyline(fn, cLo, cHi, samples) {
    var n = samples || 64, out = [], i, c, t;
    for (i = 0; i <= n; i++) {
      c = cLo + (cHi - cLo) * i / n;
      t = fn(c);
      if (t < RANGE.tMin || t > RANGE.tMax) continue;
      out.push([xOf(c), yOf(t)]);
    }
    return out;
  }

  return {
    VIEW: VIEW, PLOT: PLOT, RANGE: RANGE,
    FIELD_C_MIN: FIELD_C_MIN,
    EUTECTOID_T: EUTECTOID_T, EUTECTOID_C: EUTECTOID_C,
    LABELS: LABELS,
    QUANTITATIVE: QUANTITATIVE, APPROXIMATE: APPROXIMATE,
    xOf: xOf, yOf: yOf, cOf: cOf, tOf: tOf,
    a1: a1, a3: a3, acm: acm, austeniteFloor: austeniteFloor,
    ms: ms, mf: mf,
    austenitisingLow: austenitisingLow, austenitisingHigh: austenitisingHigh,
    proeutectoidFloor: proeutectoidFloor,
    pearliteFloor: pearliteFloor,
    bainiteDivide: bainiteDivide,
    upperBainiteFloor: upperBainiteFloor,
    lowerBainiteOnsetC: lowerBainiteOnsetC,
    regionAt: regionAt,
    regionPolygon: regionPolygon,
    polygonPath: polygonPath,
    boundaryPolyline: boundaryPolyline
  };
});
