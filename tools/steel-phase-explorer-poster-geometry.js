/*
 * Steel Phase & Transformation Explorer
 * Poster geometry: coordinate calibration + Fe-Fe3C equilibrium classifier.
 *
 * This module is the single source of truth for the iron-carbon poster tab.
 * Both the drawn overlay and the region readout derive from the functions
 * here, so the two cannot drift apart -- the defect that made the previous
 * implementation report a region different from the colour under the cursor.
 *
 * CALIBRATION
 * -----------
 * The poster SVG (assets/steel-phase/poster/poster.svg) is the converted
 * vector artwork at its native page size, 1800 x 2736 user units.
 *
 * Carbon axis, from the graph frame edges detected in the artwork:
 *     x = 236.0  ->  0.00 wt% C
 *     x = 1554.0 ->  6.68 wt% C
 *
 * Temperature axis, anchored on the two invariant horizontals actually drawn
 * on the poster (measured at stroke centre, not from label text):
 *     y = 1220.0 ->  727 degC  (eutectoid)
 *     y =  765.5 -> 1148 degC  (eutectic)
 *
 * Cross-check: the poster's own Celsius label column yields 109.2 px per
 * 100 degC against the 107.96 used here, a 1.2% disagreement. Label centres
 * are biased by glyph metrics, so the drawn invariants are preferred. The
 * residual is under ~15 px (~14 degC) at the extreme ends of the scale and
 * zero at the eutectoid and eutectic. VERIFY_ON_PREVIEW below records the
 * check that settles it in a browser.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SPXPosterGeometry = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PAGE = { w: 1800, h: 2736 };

  var CAL = {
    x0: 236.0, c0: 0.0,
    x1: 1554.0, c1: 6.68,
    ya: 1220.0, ta: 727,
    yb: 765.5, tb: 1148
  };

  var PX_PER_WT = (CAL.x1 - CAL.x0) / (CAL.c1 - CAL.c0);
  var PX_PER_DEG = (CAL.ya - CAL.yb) / (CAL.tb - CAL.ta);
  var Y_AT_ZERO = CAL.ya + CAL.ta * PX_PER_DEG;

  /*
   * Plot 0.77 wt% C / 727 degC on the preview and confirm the marker lands on
   * the poster's own eutectoid point. If it sits high or low, adjust
   * CAL.ya / CAL.yb only -- nothing else in this file encodes the transform.
   */
  var VERIFY_ON_PREVIEW = { c: 0.77, t: 727, expect: 'poster eutectoid point' };

  function xOf(c) { return CAL.x0 + (c - CAL.c0) * PX_PER_WT; }
  function yOf(t) { return Y_AT_ZERO - t * PX_PER_DEG; }
  function cOf(x) { return CAL.c0 + (x - CAL.x0) / PX_PER_WT; }
  function tOf(y) { return (Y_AT_ZERO - y) / PX_PER_DEG; }

  /* ---- Fe-Fe3C invariant points (metastable cementite system) ---- */
  var PT = {
    feMelt: 1538,
    peritecticT: 1495, peritecticDelta: 0.09, peritecticGamma: 0.17, peritecticL: 0.53,
    eutecticT: 1148, eutecticC: 4.30,
    eutectoidT: 727, eutectoidC: 0.77,
    gammaMaxC: 2.14,
    alphaMaxC: 0.022,
    cementiteC: 6.67,
    curieT: 770,
    a3Zero: 912
  };

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(x, x0, y0, x1, y1) { return y0 + (x - x0) * (y1 - y0) / (x1 - x0); }

  /* Liquidus: 1538 at 0 -> eutectic 1148 at 4.30 -> ~1250 at cementite. */
  function liquidus(c) {
    if (c <= PT.peritecticL) return lerp(c, 0, PT.feMelt, PT.peritecticL, 1495);
    if (c <= PT.eutecticC) return lerp(c, PT.peritecticL, 1495, PT.eutecticC, PT.eutecticT);
    return lerp(c, PT.eutecticC, PT.eutecticT, PT.cementiteC, 1250);
  }

  /* Austenite solidus: peritectic 0.17 at 1495 -> 2.14 at the eutectic. */
  function solidusGamma(c) {
    if (c <= PT.peritecticGamma) return lerp(c, 0, PT.feMelt, PT.peritecticGamma, PT.peritecticT);
    return lerp(c, PT.peritecticGamma, PT.peritecticT, PT.gammaMaxC, PT.eutecticT);
  }

  /* A3: 912 degC at pure iron falling to the eutectoid. */
  function a3(c) {
    var f = clamp(c / PT.eutectoidC, 0, 1);
    return PT.a3Zero - (PT.a3Zero - PT.eutectoidT) * Math.pow(f, 0.62);
  }

  /* Acm: eutectoid rising to 2.14 wt% at the eutectic temperature. */
  function acm(c) {
    var f = clamp((c - PT.eutectoidC) / (PT.gammaMaxC - PT.eutectoidC), 0, 1);
    return PT.eutectoidT + (PT.eutecticT - PT.eutectoidT) * Math.pow(f, 0.85);
  }

  /* Alpha solvus: max 0.022 wt% at 727 degC, falling towards zero. */
  function alphaSolvus(t) {
    if (t >= PT.eutectoidT) return PT.alphaMaxC;
    return PT.alphaMaxC * Math.pow(clamp(t / PT.eutectoidT, 0, 1), 2.6);
  }

  /* Delta ferrite field, narrow, between 1394 and 1538 degC. */
  function deltaMaxC(t) {
    if (t > PT.feMelt || t < 1394) return 0;
    return PT.peritecticDelta * clamp((t - 1394) / (PT.peritecticT - 1394), 0, 1);
  }

  var LABELS = {
    liquid: 'Liquid',
    deltaFerrite: 'Delta ferrite',
    deltaLiquid: 'Delta ferrite + liquid',
    deltaAustenite: 'Delta ferrite + austenite',
    austenite: 'Austenite',
    austeniteLiquid: 'Austenite + liquid',
    liquidCementite: 'Liquid + cementite',
    ferriteAustenite: 'Ferrite + austenite',
    austeniteCementite: 'Austenite + cementite',
    ferrite: 'Ferrite',
    ferriteCementite: 'Ferrite + cementite',
    cementite: 'Cementite',
    outside: 'Outside the diagram'
  };

  /*
   * Classify an equilibrium point. Returns a key into LABELS.
   * Order matters: liquid first, then the high-temperature delta region,
   * then the austenite field, then the sub-eutectoid solid state.
   */
  function regionAt(c, t) {
    if (c < 0 || c > PT.cementiteC || t < 0 || t > 1600) return 'outside';

    if (t >= liquidus(c)) return 'liquid';

    if (t >= 1394) {
      var dMax = deltaMaxC(t);
      if (c <= dMax) return 'deltaFerrite';
      if (t >= PT.peritecticT) return 'deltaLiquid';
      if (c < PT.peritecticGamma) return 'deltaAustenite';
    }

    if (t >= PT.eutecticT) {
      if (c >= PT.eutecticC) return 'liquidCementite';
      if (t >= solidusGamma(c)) return 'austeniteLiquid';
      return 'austenite';
    }

    if (c > PT.gammaMaxC) return 'austeniteCementite';

    if (t >= PT.eutectoidT) {
      if (c <= PT.eutectoidC) return t >= a3(c) ? 'austenite' : 'ferriteAustenite';
      return t >= acm(c) ? 'austenite' : 'austeniteCementite';
    }

    if (c <= alphaSolvus(t)) return 'ferrite';
    return 'ferriteCementite';
  }

  return {
    PAGE: PAGE,
    CAL: CAL,
    POINTS: PT,
    LABELS: LABELS,
    VERIFY_ON_PREVIEW: VERIFY_ON_PREVIEW,
    pxPerWt: PX_PER_WT,
    pxPerDeg: PX_PER_DEG,
    xOf: xOf, yOf: yOf, cOf: cOf, tOf: tOf,
    liquidus: liquidus,
    solidusGamma: solidusGamma,
    a3: a3,
    acm: acm,
    alphaSolvus: alphaSolvus,
    deltaMaxC: deltaMaxC,
    regionAt: regionAt
  };
});
