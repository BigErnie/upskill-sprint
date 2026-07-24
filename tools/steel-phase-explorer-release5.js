/*
 * Steel Phase & Transformation Explorer - Release 5
 * Render and interaction layer for the two reference diagrams.
 *
 * All geometry comes from the two geometry modules. This file draws and
 * binds; it does not define boundaries. That separation is what keeps the
 * painted region and the reported region in agreement.
 */
(function () {
  'use strict';

  var RG = window.SPXRapidGeometry;
  var PG = window.SPXPosterGeometry;
  if (!RG || !PG) return;

  var NS = 'http://www.w3.org/2000/svg';
  var POSTER_SVG = '/assets/steel-phase/poster/poster.svg';
  var POSTER_PDF = '/assets/steel-phase/poster/FN00454-R4_Iron-CarbonPoster_FINAL_Web.pdf';

  var COLORS = {
    austenite: '#f2d98c',
    austenitising: '#e08a4a',
    ferritePearlite: '#d8542f',
    cementitePearlite: '#c0431f',
    pearlite: '#f2efe9',
    upperBainite: '#d8d4cc',
    lowerBainite: '#b9b4ab',
    martensiteAustenite: '#7b6fd0',
    martensite: '#e0572f',
    liquid: '#fbd9a0',
    deltaFerrite: '#cfe3f7',
    deltaLiquid: '#bcd6f0',
    deltaAustenite: '#aecbe8',
    austeniteLiquid: '#e9cf8f',
    liquidCementite: '#d9c48a',
    ferriteAustenite: '#bfe0cd',
    austeniteCementite: '#cbbfe6',
    ferrite: '#a9d8bd',
    ferriteCementite: '#d5cbe8',
    cementite: '#b7a8d8',
    outside: '#e8e6e1'
  };

  var COPY = {
    austenite: {
      b: 'Steel is fully austenitic here. It is soft, non-magnetic, and holds far more carbon in solution than ferrite can.',
      e: 'Face-centred cubic. This is the field you austenitise into before any quench. Hold long enough to dissolve carbides but not so long that grain growth coarsens the prior austenite grain size.',
      a: 'Carbon solubility peaks at 2.14 wt% at 1148 degC. Homogenisation is diffusion controlled, so time at temperature and section size govern how complete it actually is.'
    },
    austenitising: {
      b: 'The temperature band you would heat into before quenching.',
      e: 'Typically A3 or Acm plus 25 to 75 degC. Too low leaves undissolved carbide or free ferrite; too high coarsens grain and raises distortion and cracking risk.',
      a: 'Shown as a fixed offset band for teaching. Real practice sets it from the grade, section size and furnace, and hypereutectoid steels are usually austenitised above A1 rather than above Acm to keep grain size down.'
    },
    ferritePearlite: {
      b: 'A mixture of soft ferrite and layered pearlite. This is what most plain carbon steel looks like after slow cooling.',
      e: 'Proeutectoid ferrite forms first, then the remaining austenite goes to pearlite at the eutectoid. Strength rises with pearlite fraction, ductility falls.',
      a: 'Ferrite fraction follows the lever rule on the A3 and A1 lines. Interlamellar spacing sets strength through a Hall-Petch style relation and depends on transformation temperature.'
    },
    cementitePearlite: {
      b: 'Pearlite with a network of hard, brittle cementite around the grains.',
      e: 'Hypereutectoid. Proeutectoid cementite forms on prior austenite boundaries and embrittles the steel. Spheroidising breaks the network up.',
      a: 'A continuous grain-boundary carbide film is the main toughness risk. Cementite fraction follows the lever rule between Acm and the eutectoid.'
    },
    pearlite: {
      b: 'A fine layered mixture of ferrite and cementite. Strong, reasonably tough, easy to produce.',
      e: 'Diffusional transformation. Lower transformation temperature gives finer lamellae and higher strength. This is the basis of patenting for wire.',
      a: 'Growth is ledge-controlled and spacing scales inversely with undercooling. Fine pearlite and upper bainite overlap in hardness but differ in toughness.'
    },
    upperBainite: {
      b: 'Feathery sheaves of ferrite with carbide between them. Harder than pearlite, but not the toughest structure.',
      e: 'Forms above roughly 350 degC. Carbide films lie between ferrite laths, which is why upper bainite is generally less tough than lower bainite at equal hardness.',
      a: 'Displacive ferrite growth with carbon partitioning to residual austenite, then interlath cementite. Sheaf coarseness scales with transformation temperature.'
    },
    lowerBainite: {
      b: 'A fine, tough structure. Often the best balance of strength and toughness available without quench and temper.',
      e: 'Forms between roughly 350 degC and Ms. Carbides precipitate inside the ferrite plates rather than between them, which is why toughness is better than upper bainite.',
      a: 'Below 0.42 wt% C, Ms sits above the bainite divide and this field does not exist. Austempering targets it directly and avoids the distortion of a martensitic quench.'
    },
    martensiteAustenite: {
      b: 'Very hard martensite with some austenite that did not transform. Hard but brittle until tempered.',
      e: 'Between Ms and Mf. Retained austenite rises with carbon and can transform later in service or during grinding, causing dimensional change.',
      a: 'Athermal transformation: fraction depends on undercooling below Ms, not on time. Sub-zero treatment drives it further. Temper promptly; untempered martensite is crack sensitive.'
    },
    martensite: {
      b: 'Essentially fully martensitic. The hardest state this steel reaches, and the most brittle.',
      e: 'Below Mf. Hardness is set almost entirely by carbon content. Temper before service to recover toughness at some cost in hardness.',
      a: 'Body-centred tetragonal, supersaturated in carbon. Mf as drawn is an approximation; the finish is asymptotic and some austenite is retained in practice at higher carbon.'
    },
    liquid: { b: 'Molten iron and carbon.', e: 'Above the liquidus. Composition sets the freezing range and segregation tendency.', a: 'Solidification path follows the liquidus; microsegregation depends on cooling rate and partition coefficient.' },
    deltaFerrite: { b: 'The high temperature form of iron, just below melting.', e: 'Body-centred cubic delta ferrite. Only stable in a narrow window at low carbon.', a: 'Peritectic at 1495 degC: delta at 0.09 plus liquid at 0.53 gives austenite at 0.17 wt%.' },
    deltaLiquid: { b: 'Partly frozen: delta ferrite crystals in liquid.', e: 'Two-phase field above the peritectic.', a: 'Delta and liquid compositions are fixed by the phase boundaries at each temperature.' },
    deltaAustenite: { b: 'Delta ferrite and austenite together.', e: 'Narrow field just below the peritectic at low carbon.', a: 'Transient; delta consumes as austenite grows.' },
    austeniteLiquid: { b: 'Austenite crystals growing in remaining liquid.', e: 'Between liquidus and solidus. This is where dendrites form and segregation is set.', a: 'Lever rule between liquidus and solidus composition. Centreline segregation originates here.' },
    liquidCementite: { b: 'Liquid with primary cementite forming.', e: 'Hypereutectic cast iron territory, above 4.3 wt%.', a: 'Primary cementite forms above the eutectic; the metastable path competes with graphite.' },
    ferriteAustenite: { b: 'Ferrite starting to form out of austenite on cooling.', e: 'Between A3 and A1 for hypoeutectoid steel. Intercritical annealing works in this field.', a: 'Ferrite fraction by lever rule; residual austenite enriches in carbon towards the eutectoid.' },
    austeniteCementite: { b: 'Austenite with cementite present.', e: 'Between Acm and A1 for hypereutectoid steel, and the field for cast irons below the eutectic.', a: 'Carbon in austenite follows Acm; excess precipitates as cementite.' },
    ferrite: { b: 'Nearly pure iron. Soft, ductile, magnetic below 770 degC.', e: 'Single-phase field. Carbon solubility is tiny, 0.022 wt% maximum at 727 degC.', a: 'Body-centred cubic. Solubility falls steeply on cooling, rejecting carbon as tertiary cementite.' },
    ferriteCementite: { b: 'Ferrite plus cementite. The room-temperature state of ordinary carbon steel.', e: 'Below the eutectoid. Morphology depends on thermal history, from coarse pearlite to spheroidised carbide.', a: 'Equilibrium fractions by lever rule between 0.022 and 6.67 wt%. Morphology, not fraction, drives properties.' },
    cementite: { b: 'Iron carbide. Very hard, very brittle.', e: 'Fe3C at 6.67 wt% carbon.', a: 'Orthorhombic. Metastable relative to graphite but effectively permanent in steels.' },
    outside: { b: 'Outside the range of this chart.', e: 'Move the point back inside the plotted field.', a: 'No data is defined here.' }
  };

  var CAUTION = 'Educational reference. Boundaries depend on chemistry, grain size, section size, homogeneity and holding time. Validate against grade-specific data before any process decision.';

  var $ = function (id) { return document.getElementById(id); };

  var s5 = {
    map: 'rapid',
    level: 'engineer',
    points: [],
    activeId: 1,
    nextId: 1,
    zoom: 1,
    showCritical: true,
    showLabels: true,
    showCrosshair: true,
    showLegend: true,
    highlight: null
  };

  var highlightCache = null;   /* { key, map, shapes, centroid } */
  var posterMarkup = null;
  var posterState = 'idle';        /* idle | loading | ready | error */
  var posterPromise = null;
  var builtMap = null;             /* which diagram the reference layer holds */
  var hover = null, dragId = null;

  /* ---------- helpers ---------- */

  function el(parent, name, attrs, text) {
    var node = document.createElementNS(NS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function isMetric() { return !window.state || window.state.unit !== 'imperial'; }

  function toDisplay(t) {
    return isMetric() ? t : (typeof window.CtoF === 'function' ? window.CtoF(t) : t * 9 / 5 + 32);
  }
  function fromDisplay(v) {
    return isMetric() ? v : (typeof window.FtoC === 'function' ? window.FtoC(v) : (v - 32) * 5 / 9);
  }
  function fmtT(t) { return Math.round(toDisplay(t)) + (isMetric() ? ' \u00B0C' : ' \u00B0F'); }
  function unitLabel() { return isMetric() ? '\u00B0C' : '\u00B0F'; }

  function geo() { return s5.map === 'rapid' ? RG : PG; }

  function bounds() {
    return s5.map === 'rapid'
      ? { cMin: RG.RANGE.cMin, cMax: RG.RANGE.cMax, tMin: RG.RANGE.tMin, tMax: RG.RANGE.tMax }
      : { cMin: 0, cMax: PG.POINTS.cementiteC, tMin: 0, tMax: 1600 };
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function activePoint() {
    var found = s5.points.filter(function (p) { return p.id === s5.activeId; })[0];
    if (!found && s5.points.length) { found = s5.points[0]; s5.activeId = found.id; }
    return found;
  }

  function defaults() {
    return s5.map === 'rapid'
      ? [{ id: 1, c: 0.2, t: 880 }, { id: 2, c: 0.45, t: 620 }, { id: 3, c: 0.8, t: 300 }]
      : [{ id: 1, c: 0.2, t: 900 }, { id: 2, c: 0.77, t: 727 }, { id: 3, c: 4.3, t: 1148 }];
  }

  function resetPoints() {
    s5.points = defaults();
    s5.activeId = 1;
    s5.nextId = s5.points.length + 1;
  }

  /* ---------- rapid diagram ---------- */

  var RAPID_FIELDS = ['austenitising', 'ferritePearlite', 'cementitePearlite', 'pearlite',
    'upperBainite', 'lowerBainite', 'martensiteAustenite', 'martensite'];

  function drawRapid(root) {
    var P = RG.PLOT, V = RG.VIEW;

    el(root, 'rect', { x: 0, y: 0, width: V.w, height: V.h, fill: '#fbfaf7' });
    el(root, 'text', { x: V.w / 2, y: 46, 'text-anchor': 'middle', class: 'spx-r5-heading' },
      'Microconstituents formed on rapid quenching of austenite');
    el(root, 'text', { x: V.w / 2, y: 72, 'text-anchor': 'middle', class: 'spx-r5-subheading' },
      'into isothermal baths held at the temperature shown');

    el(root, 'rect', {
      x: P.x0, y: P.yTop, width: P.x1 - P.x0, height: P.yBottom - P.yTop, fill: '#ffffff'
    });

    /* Austenite fills everything above the austenitising band. */
    var austTop = [], i, c;
    for (i = 0; i <= 64; i++) {
      c = RG.FIELD_C_MIN + (RG.RANGE.cMax - RG.FIELD_C_MIN) * i / 64;
      austTop.push([RG.xOf(c), RG.yOf(RG.austenitisingHigh(c))]);
    }
    var austPoly = [[RG.xOf(RG.FIELD_C_MIN), P.yTop], [RG.xOf(RG.RANGE.cMax), P.yTop]]
      .concat(austTop.reverse());
    el(root, 'path', { d: RG.polygonPath(austPoly), fill: COLORS.austenite, 'data-r5-region': 'austenite' });

    RAPID_FIELDS.forEach(function (key) {
      var poly = RG.regionPolygon(key, 96);
      if (!poly) return;
      el(root, 'path', {
        d: RG.polygonPath(poly), fill: COLORS[key],
        class: 'spx-r5-region', 'data-r5-region': key,
        tabindex: '0', role: 'button',
        'aria-label': RG.LABELS[key]
      });
    });

    /* grid */
    var grid = el(root, 'g', { class: 'spx-r5-grid' });
    for (c = 0; c <= RG.RANGE.cMax + 1e-9; c += 0.1) {
      var major = Math.abs((c * 10) % 2) < 0.01;
      el(grid, 'line', {
        x1: RG.xOf(c), x2: RG.xOf(c), y1: P.yTop, y2: P.yBottom,
        class: major ? 'spx-r5-grid-major' : 'spx-r5-grid-minor'
      });
      if (major) el(grid, 'text', {
        x: RG.xOf(c), y: P.yBottom + 30, 'text-anchor': 'middle', class: 'spx-r5-tick'
      }, c.toFixed(c === 0 ? 0 : 1));
    }
    for (var t = RG.RANGE.tMin; t <= RG.RANGE.tMax + 1e-9; t += 50) {
      var maj = t % 100 === 0;
      el(grid, 'line', {
        x1: P.x0, x2: P.x1, y1: RG.yOf(t), y2: RG.yOf(t),
        class: maj ? 'spx-r5-grid-major' : 'spx-r5-grid-minor'
      });
      if (maj) {
        el(grid, 'text', { x: P.x0 - 14, y: RG.yOf(t) + 6, 'text-anchor': 'end', class: 'spx-r5-tick' },
          String(t));
        el(grid, 'text', { x: P.x1 + 14, y: RG.yOf(t) + 6, class: 'spx-r5-tick' },
          String(Math.round(t * 9 / 5 + 32)));
      }
    }

    el(root, 'rect', {
      x: P.x0, y: P.yTop, width: P.x1 - P.x0, height: P.yBottom - P.yTop,
      fill: 'none', class: 'spx-r5-frame'
    });
    el(root, 'text', { x: (P.x0 + P.x1) / 2, y: P.yBottom + 62, 'text-anchor': 'middle', class: 'spx-r5-axis' },
      'Carbon content, weight percent');
    el(root, 'text', { x: P.x0 - 14, y: P.yTop - 18, 'text-anchor': 'end', class: 'spx-r5-axis' }, '\u00B0C');
    el(root, 'text', { x: P.x1 + 14, y: P.yTop - 18, class: 'spx-r5-axis' }, '\u00B0F');

    if (s5.showLabels) drawRapidLabels(root);
  }

  function drawRapidLabels(root) {
    var g = el(root, 'g', { class: 'spx-r5-fieldlabels' });
    function place(key, c, t, text) {
      var poly = RG.regionPolygon(key, 32);
      if (!poly) return;
      el(g, 'text', {
        x: RG.xOf(c), y: RG.yOf(t), 'text-anchor': 'middle', class: 'spx-r5-fieldlabel'
      }, text);
    }
    place('ferritePearlite', 0.45, 690, 'Ferrite + pearlite');
    place('cementitePearlite', 1.0, 700, 'Cementite + pearlite');
    place('pearlite', 0.6, 620, 'Pearlite');
    place('upperBainite', 0.55, 470, 'Upper bainite');
    place('lowerBainite', 0.95, 250, 'Lower bainite');
    place('martensiteAustenite', 0.75, 60, 'Martensite + retained austenite');
    el(g, 'text', { x: RG.xOf(0.7), y: RG.yOf(RG.austenitisingHigh(0.7)) - 14,
      'text-anchor': 'middle', class: 'spx-r5-fieldlabel' }, 'Austenitising range');
  }

  function drawRapidCritical(g) {
    var lines = [
      { fn: function () { return RG.a1(); }, c0: 0, c1: 1.2, label: 'A1', cls: 'quant' },
      { fn: RG.a3, c0: 0, c1: 0.77, label: 'A3', cls: 'quant' },
      { fn: RG.acm, c0: 0.77, c1: 1.2, label: 'Acm', cls: 'quant' },
      { fn: RG.ms, c0: 0.2, c1: 1.2, label: 'Ms', cls: 'quant' },
      { fn: RG.mf, c0: 0.2, c1: 1.2, label: 'Mf', cls: 'quant dashed' }
    ];
    lines.forEach(function (line) {
      var pts = RG.boundaryPolyline(line.fn, line.c0, line.c1, 64);
      if (pts.length < 2) return;
      el(g, 'path', {
        d: pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' '),
        fill: 'none', class: 'spx-r5-critical ' + line.cls
      });
      if (s5.showLabels) {
        var last = pts[pts.length - 1];
        el(g, 'text', { x: last[0] - 8, y: last[1] - 10, 'text-anchor': 'end', class: 'spx-r5-critlabel' },
          line.label);
      }
    });
  }

  /* ---------- poster diagram ---------- */

  function setLoading(message) {
    var node = $('spx-r5-loading');
    if (!node) return;
    if (message == null) { node.hidden = true; return; }
    node.textContent = message;
    node.hidden = false;
  }

  function posterFailed(reason) {
    setLoading(null);
    var status = $('spx-r5-status');
    if (status) {
      status.textContent = 'The poster artwork could not be loaded: ' + reason +
        '. It is served from this site, so this is usually a transient problem.';
    }
    var wrap = $('spx-r5-svg-wrap');
    if (wrap && !$('spx-r5-retry')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'spx-r5-retry';
      btn.className = 'spx-btn';
      btn.textContent = 'Retry loading the poster';
      btn.addEventListener('click', function () {
        btn.remove();
        posterState = 'idle';
        render();
      });
      wrap.parentNode.insertBefore(btn, wrap.nextSibling);
    }
    if (window.console && window.console.error) {
      window.console.error('[SPX r5] poster load failed:', reason);
    }
  }

  /*
   * One in-flight request, shared by every caller. A timeout is essential:
   * without it a stalled response leaves the indicator up with nothing to
   * diagnose from.
   */
  function loadPoster() {
    if (posterState === 'ready') return Promise.resolve(posterMarkup);
    if (posterPromise) return posterPromise;

    posterState = 'loading';
    setLoading('Loading poster artwork\u2026');

    var controller = (typeof AbortController === 'function') ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 30000);

    posterPromise = fetch(POSTER_SVG, controller ? { signal: controller.signal } : undefined)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (r.statusText || ''));
        return r.text();
      })
      .then(function (text) {
        if (text.indexOf('<svg') === -1) throw new Error('the response was not SVG');
        posterMarkup = text;
        posterState = 'ready';
        setLoading(null);
        return text;
      })
      .catch(function (err) {
        posterState = 'error';
        posterMarkup = null;
        posterFailed(err && err.name === 'AbortError'
          ? 'timed out after 30 seconds'
          : ((err && err.message) || String(err)));
        return null;
      })
      .then(function (value) {
        clearTimeout(timer);
        posterPromise = null;
        return value;
      });

    return posterPromise;
  }

  /*
   * Builds the poster layer. Only ever called when the reference layer is
   * being rebuilt, never on an overlay refresh -- parsing 2.2 MB of SVG on
   * every pointer event would block the main thread indefinitely.
   */
  function drawPoster(root) {
    if (posterState !== 'ready') {
      if (posterState !== 'error') {
        loadPoster().then(function (ok) { if (ok) render(); })
          .catch(function (err) { posterFailed((err && err.message) || String(err)); });
      }
      return;
    }
    try {
      var doc = new DOMParser().parseFromString(posterMarkup, 'image/svg+xml');
      var src = doc.documentElement;
      if (!src || src.nodeName === 'parsererror' || src.querySelector('parsererror')) {
        throw new Error('the artwork could not be parsed');
      }
      var host = el(root, 'g', { class: 'spx-r5-poster' });
      /* adoptNode moves rather than deep-clones; the parsed document is
         discarded immediately afterwards. */
      var frag = document.createDocumentFragment();
      while (src.firstChild) frag.appendChild(document.adoptNode(src.firstChild));
      host.appendChild(frag);
    } catch (err) {
      posterState = 'error';
      posterFailed((err && err.message) || String(err));
    }
  }

  function drawPosterCritical(g) {
    var P = PG.POINTS;
    function hLine(t, c0, c1, label) {
      el(g, 'line', {
        x1: PG.xOf(c0), x2: PG.xOf(c1), y1: PG.yOf(t), y2: PG.yOf(t), class: 'spx-r5-critical quant'
      });
      if (s5.showLabels) el(g, 'text', {
        x: PG.xOf(c1) + 10, y: PG.yOf(t) + 6, class: 'spx-r5-critlabel'
      }, label);
    }
    hLine(P.eutectoidT, 0, 2.2, 'A1 / eutectoid');
    hLine(P.eutecticT, 1.9, P.cementiteC, 'Eutectic');
    hLine(P.peritecticT, 0, 0.6, 'Peritectic');

    [['a3', PG.a3, 0, P.eutectoidC], ['acm', PG.acm, P.eutectoidC, P.gammaMaxC],
     ['liquidus', PG.liquidus, 0, P.cementiteC], ['solidus', PG.solidusGamma, 0, P.gammaMaxC]]
      .forEach(function (item) {
        var pts = [], i, c, t;
        for (i = 0; i <= 80; i++) {
          c = item[2] + (item[3] - item[2]) * i / 80;
          t = item[1](c);
          if (t < 0 || t > 1600) continue;
          pts.push(PG.xOf(c).toFixed(1) + ' ' + PG.yOf(t).toFixed(1));
        }
        if (pts.length > 1) el(g, 'path', {
          d: 'M' + pts.join(' L'), fill: 'none', class: 'spx-r5-critical quant'
        });
      });
  }

  /* ---------- overlay ---------- */

  /*
   * Highlight shapes are derived by sampling regionAt() across the field and
   * merging each scan row into horizontal runs. Deriving them from the
   * classifier rather than from a second set of coordinates means the
   * highlight always covers exactly what the readout reports, and it works
   * on the poster tab where the artwork is imported and there are no region
   * paths of our own to colour in.
   *
   * The sampling costs tens of thousands of classifier calls, so the result
   * is cached; drawOverlay runs on every pointer move.
   */
  function highlightShapes() {
    if (!s5.highlight) return null;
    if (highlightCache && highlightCache.key === s5.highlight && highlightCache.map === s5.map) {
      return highlightCache;
    }

    var G = geo(), b = bounds();
    var rows = 170, cols = 210;
    var dt = (b.tMax - b.tMin) / rows;
    var dc = (b.cMax - b.cMin) / cols;
    var shapes = [];
    var sumX = 0, sumY = 0, n = 0;
    var i, j, t, c, inRun, runStart, x0, x1, y0, y1;

    for (i = 0; i < rows; i++) {
      t = b.tMin + (i + 0.5) * dt;
      runStart = -1;
      for (j = 0; j <= cols; j++) {
        c = b.cMin + (j + 0.5) * dc;
        inRun = j < cols && G.regionAt(c, t) === s5.highlight;
        if (inRun && runStart < 0) runStart = j;
        if (!inRun && runStart >= 0) {
          x0 = G.xOf(b.cMin + runStart * dc);
          x1 = G.xOf(b.cMin + j * dc);
          y0 = G.yOf(t + dt / 2);
          y1 = G.yOf(t - dt / 2);
          shapes.push([
            Math.min(x0, x1), Math.min(y0, y1),
            Math.abs(x1 - x0), Math.abs(y1 - y0)
          ]);
          sumX += (x0 + x1) / 2; sumY += (y0 + y1) / 2; n += 1;
          runStart = -1;
        }
      }
    }

    highlightCache = {
      key: s5.highlight, map: s5.map, shapes: shapes,
      centroid: n ? [sumX / n, sumY / n] : null
    };
    return highlightCache;
  }

  function invalidateHighlight() { highlightCache = null; }

  function drawHighlight(layer) {
    var data = highlightShapes();
    if (!data || !data.shapes.length) return;
    var colour = COLORS[data.key] || '#0e7490';
    var g = el(layer, 'g', { class: 'spx-r5-highlight', 'pointer-events': 'none' });

    data.shapes.forEach(function (r) {
      el(g, 'rect', {
        x: r[0].toFixed(2), y: r[1].toFixed(2),
        width: Math.max(0.5, r[2]).toFixed(2), height: Math.max(0.5, r[3]).toFixed(2),
        fill: colour, opacity: '0.45'
      });
    });

    if (data.centroid) {
      var label = geo().LABELS[data.key] || data.key;
      var scale = s5.map === 'rapid' ? 1 : 1.7;
      var w = label.length * 8.6 * scale + 22 * scale;
      var h = 30 * scale;
      var cx = Math.max(w / 2 + 4, data.centroid[0]);
      var cy = data.centroid[1];
      el(g, 'rect', {
        x: (cx - w / 2).toFixed(1), y: (cy - h / 2).toFixed(1),
        width: w.toFixed(1), height: h.toFixed(1), rx: 5 * scale,
        fill: '#14110d', opacity: '0.9'
      });
      el(g, 'text', {
        x: cx.toFixed(1), y: (cy + 5.5 * scale).toFixed(1), 'text-anchor': 'middle',
        'font-size': (15 * scale).toFixed(0), 'font-weight': '700', fill: '#ffffff'
      }, label);
    }
  }

  function drawOverlay() {
    var o = $('spx-r5-overlay'), pl = $('spx-r5-point-layer');
    clear(o); clear(pl);
    drawHighlight(o);
    var G = geo(), b = bounds();
    var box = s5.map === 'rapid'
      ? { x0: RG.PLOT.x0, x1: RG.PLOT.x1, yTop: RG.PLOT.yTop, yBottom: RG.PLOT.yBottom }
      : { x0: PG.xOf(0), x1: PG.xOf(b.cMax), yTop: PG.yOf(b.tMax), yBottom: PG.yOf(b.tMin) };

    if (s5.showCrosshair && hover) {
      var hx = G.xOf(hover.c), hy = G.yOf(hover.t);
      el(o, 'line', { x1: hx, x2: hx, y1: box.yTop, y2: box.yBottom, class: 'spx-r5-crosshair' });
      el(o, 'line', { x1: box.x0, x2: box.x1, y1: hy, y2: hy, class: 'spx-r5-crosshair' });

      var other = isMetric()
        ? Math.round(hover.t * 9 / 5 + 32) + ' \u00B0F'
        : Math.round(hover.t) + ' \u00B0C';
      var text = hover.c.toFixed(s5.map === 'rapid' ? 2 : 3) + ' wt% C \u00B7 ' +
        fmtT(hover.t) + ' (' + other + ') \u00B7 ' + G.LABELS[G.regionAt(hover.c, hover.t)];
      var w = Math.max(300, text.length * 9.4);
      var tx = Math.min(box.x1 - w, hx + 16), ty = Math.max(box.yTop + 8, hy - 46);
      el(o, 'rect', { x: tx, y: ty, width: w, height: 34, rx: 5, class: 'spx-r5-readout-bg' });
      el(o, 'text', { x: tx + 12, y: ty + 23, class: 'spx-r5-readout' }, text);
    }

    var palette = ['#0e7490', '#b45309', '#7c3aed', '#15803d', '#be123c', '#0369a1'];
    s5.points.forEach(function (p, i) {
      if (p.c < b.cMin || p.c > b.cMax || p.t < b.tMin || p.t > b.tMax) return;
      var x = G.xOf(p.c), y = G.yOf(p.t), on = p.id === s5.activeId;
      var r = s5.map === 'rapid' ? (on ? 11 : 8) : (on ? 18 : 13);
      el(pl, 'circle', {
        cx: x, cy: y, r: r, fill: palette[i % palette.length],
        class: 'spx-r5-marker' + (on ? ' active' : ''), 'data-r5-point': p.id
      });
      el(pl, 'text', {
        x: x + r + 5, y: y - r - 2, class: 'spx-r5-pointlabel'
      }, 'P' + p.id);
    });
  }

  /* ---------- panels ---------- */

  function levelKey() { return s5.level === 'beginner' ? 'b' : (s5.level === 'advanced' ? 'a' : 'e'); }

  function renderHelp(key) {
    var G = geo();
    key = key || s5.highlight || (activePoint() ? G.regionAt(activePoint().c, activePoint().t) : null);
    if (!key) return;
    var copy = COPY[key] || COPY.outside;
    var quant = s5.map === 'rapid' && RG.APPROXIMATE.indexOf(key) === -1;
    $('spx-r5-help').innerHTML =
      '<div class="spx-r5-help-head">' +
        '<span class="spx-r5-swatch" style="background:' + (COLORS[key] || '#ccc') + '"></span>' +
        '<h3>' + G.LABELS[key] + '</h3>' +
      '</div>' +
      '<p>' + copy[levelKey()] + '</p>' +
      (s5.level === 'advanced' ? '<p class="spx-note">' + CAUTION + '</p>' : '');
  }

  function renderLegend() {
    var card = $('spx-r5-legend-card');
    card.hidden = !s5.showLegend;
    if (card.hidden) return;
    var G = geo();
    var keys = s5.map === 'rapid'
      ? ['austenite'].concat(RAPID_FIELDS)
      : ['liquid', 'deltaFerrite', 'austenite', 'austeniteLiquid', 'liquidCementite',
         'ferriteAustenite', 'austeniteCementite', 'ferrite', 'ferriteCementite'];
    $('spx-r5-legend').innerHTML = keys.map(function (k) {
      return '<button type="button" data-r5-legend="' + k + '" aria-pressed="' +
        (s5.highlight === k) + '"><i style="background:' + (COLORS[k] || '#ccc') + '"></i>' +
        '<span>' + G.LABELS[k] + '</span></button>';
    }).join('');
  }

  function renderPoints() {
    var G = geo(), b = bounds();
    $('spx-r5-points-list').innerHTML = s5.points.map(function (p) {
      var inside = p.c >= b.cMin && p.c <= b.cMax && p.t >= b.tMin && p.t <= b.tMax;
      var key = G.regionAt(clamp(p.c, b.cMin, b.cMax), clamp(p.t, b.tMin, b.tMax));
      return '<div class="spx-r5-point-row' + (p.id === s5.activeId ? ' active' : '') + '">' +
        '<button type="button" class="spx-r5-point-select" data-r5-select="' + p.id + '" aria-pressed="' +
          (p.id === s5.activeId) + '">P' + p.id + '</button>' +
        '<label>Carbon <span>(wt%)</span>' +
          '<input type="number" data-r5-c="' + p.id + '" min="' + b.cMin + '" max="' + b.cMax +
          '" step="0.01" value="' + p.c.toFixed(3) + '"></label>' +
        '<label>Temperature <span>(' + unitLabel() + ')</span>' +
          '<input type="number" data-r5-t="' + p.id + '" step="1" value="' +
          Math.round(toDisplay(p.t)) + '"></label>' +
        '<div class="spx-r5-point-result"><strong>' + G.LABELS[key] + '</strong>' +
        '<span>' + (inside ? 'On this diagram' : 'Outside this diagram') + '</span></div>' +
        '</div>';
    }).join('');
  }

  function renderAnalysis() {
    var p = activePoint();
    if (!p) return;
    var G = geo(), b = bounds();
    var key = G.regionAt(clamp(p.c, b.cMin, b.cMax), clamp(p.t, b.tMin, b.tMax));
    $('spx-r5-active-summary').textContent =
      'P' + p.id + ' \u00B7 ' + p.c.toFixed(3) + ' wt% C \u00B7 ' + fmtT(p.t);
    $('spx-r5-analysis').innerHTML =
      '<div class="spx-metrics">' +
        '<div class="spx-metric"><b>' + G.LABELS[key] + '</b><span>Region</span></div>' +
        '<div class="spx-metric"><b>' + p.c.toFixed(3) + '</b><span>wt% C</span></div>' +
        '<div class="spx-metric"><b>' + fmtT(p.t) + '</b><span>Temperature</span></div>' +
      '</div>';
    $('spx-r5-model-note').textContent = s5.map === 'rapid'
      ? 'A1, A3, Acm, Ms and Mf are quantitative. The pearlite, bainite and austenitising divisions are educational approximations and carry no implied precision.'
      : 'Equilibrium Fe-Fe3C boundaries. Kinetic products such as bainite and martensite do not appear on an equilibrium diagram.';
  }

  function renderSource() {
    $('spx-r5-source-note').innerHTML = s5.map === 'rapid'
      ? 'Original vector reconstruction. Region boundaries are generated from the published relationships listed in the module, not traced.'
      : 'Iron-Carbon/Cementite Phase Diagram, Buehler (an ITW company). Copyright &copy; 2006 ASM International. All rights reserved. Reproduced under permission held by UpSkill Sprint Consulting. ' +
        '<a href="' + POSTER_PDF + '" target="_blank" rel="noopener">Open the official poster PDF</a>.';
  }

  /* ---------- main render ---------- */

  function applyCanvas() {
    var svg = $('spx-r5-svg');
    if (s5.map === 'rapid') {
      svg.setAttribute('viewBox', '0 0 ' + RG.VIEW.w + ' ' + RG.VIEW.h);
      svg.setAttribute('aria-label', 'Interactive rapid-quench microconstituent map');
    } else {
      svg.setAttribute('viewBox', '0 0 ' + PG.PAGE.w + ' ' + PG.PAGE.h);
      svg.setAttribute('aria-label', 'Interactive iron-carbon cementite phase diagram poster');
    }
    svg.style.width = (s5.zoom * 100) + '%';
    $('spx-r5-zoom-label').textContent = Math.round(s5.zoom * 100) + '%';
  }

  /* Anything that changes the reference layer's content belongs in this key. */
  function referenceKey() {
    return [s5.map, s5.showLabels, posterState].join('|');
  }

  function invalidateReference() { builtMap = null; }

  function render() {
    if (!s5.points.length) resetPoints();
    applyCanvas();

    document.querySelectorAll('#spx-r5-subnav [data-r5-map]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.r5Map === s5.map));
    });
    document.querySelectorAll('#spx-r5-level [data-r5-level]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.r5Level === s5.level));
    });
    document.querySelectorAll('#spx-r5-unit [data-r5-unit]').forEach(function (b) {
      b.setAttribute('aria-pressed', String((b.dataset.r5Unit === 'metric') === isMetric()));
    });

    $('spx-r5-title').textContent = s5.map === 'rapid'
      ? 'Rapid-quench microconstituent map'
      : 'Iron-carbon / cementite phase diagram';
    $('spx-r5-subtitle').textContent = s5.map === 'rapid'
      ? 'Carbon versus isothermal bath temperature. This is not a TTT or CCT diagram; there is no time axis.'
      : 'Equilibrium Fe-Fe3C diagram, reproduced from the Buehler poster with a calibrated interaction layer.';

    var ref = $('spx-r5-reference'), emph = $('spx-r5-emphasis');
    /* The reference layer is expensive to build and never depends on point
       or hover state, so it is rebuilt only when the diagram itself changes. */
    var needsReference = builtMap !== referenceKey() || !ref.firstChild;
    if (needsReference) {
      clear(ref);
      if (s5.map === 'rapid') drawRapid(ref); else drawPoster(ref);
      builtMap = referenceKey();
    }
    clear(emph);
    if (s5.showCritical) {
      if (s5.map === 'rapid') drawRapidCritical(emph); else drawPosterCritical(emph);
    }

    drawOverlay();
    renderPoints();
    renderLegend();
    renderAnalysis();
    renderHelp();
    renderSource();
  }

  /* ---------- interaction ---------- */

  function svgData(e) {
    var svg = $('spx-r5-svg'), pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    var G = geo(), b = bounds();
    return {
      c: clamp(G.cOf(loc.x), b.cMin, b.cMax),
      t: clamp(G.tOf(loc.y), b.tMin, b.tMax),
      inside: G.cOf(loc.x) >= b.cMin && G.cOf(loc.x) <= b.cMax &&
              G.tOf(loc.y) >= b.tMin && G.tOf(loc.y) <= b.tMax
    };
  }

  function setPoint(id, c, t) {
    var p = s5.points.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var b = bounds();
    p.c = clamp(c, b.cMin, b.cMax);
    p.t = clamp(t, b.tMin, b.tMax);
    s5.activeId = id;
  }

  function bind() {
    $('spx-r5-subnav').addEventListener('click', function (e) {
      var b = e.target.closest('[data-r5-map]');
      if (!b) return;
      s5.map = b.dataset.r5Map;
      s5.zoom = 1; hover = null; s5.highlight = null;
      invalidateHighlight();
      invalidateReference();
      resetPoints();
      render();
    });

    $('spx-r5-level').addEventListener('click', function (e) {
      var b = e.target.closest('[data-r5-level]');
      if (!b) return;
      s5.level = b.dataset.r5Level;
      render();
    });

    $('spx-r5-unit').addEventListener('click', function (e) {
      var b = e.target.closest('[data-r5-unit]');
      if (!b) return;
      if (typeof window.setUnit === 'function') window.setUnit(b.dataset.r5Unit);
      else if (window.state) window.state.unit = b.dataset.r5Unit;
      render();
    });

    [['spx-r5-critical', 'showCritical'], ['spx-r5-labels', 'showLabels'],
     ['spx-r5-crosshair-toggle', 'showCrosshair'], ['spx-r5-legend-toggle', 'showLegend']]
      .forEach(function (pair) {
        $(pair[0]).addEventListener('change', function () {
          s5[pair[1]] = this.checked;
          if (pair[1] === 'showLabels') invalidateReference();
          render();
        });
      });

    $('spx-r5-add').addEventListener('click', function () {
      var a = activePoint(), id = ++s5.nextId;
      s5.points.push({ id: id, c: a ? a.c : 0.4, t: a ? a.t : 500 });
      s5.activeId = id;
      render();
    });

    $('spx-r5-remove').addEventListener('click', function () {
      if (s5.points.length <= 1) {
        $('spx-r5-status').textContent = 'At least one point is required.';
        return;
      }
      s5.points = s5.points.filter(function (p) { return p.id !== s5.activeId; });
      s5.activeId = s5.points[0].id;
      render();
    });

    $('spx-r5-example').addEventListener('click', function () { resetPoints(); render(); });

    $('spx-r5-points-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-r5-select]');
      if (!b) return;
      s5.activeId = Number(b.dataset.r5Select);
      s5.highlight = null;
      invalidateHighlight();
      render();
    });

    $('spx-r5-points-list').addEventListener('change', function (e) {
      var idC = e.target.dataset.r5C, idT = e.target.dataset.r5T;
      var id = Number(idC || idT);
      if (!id) return;
      var p = s5.points.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      if (idC) setPoint(id, Number(e.target.value), p.t);
      else setPoint(id, p.c, fromDisplay(Number(e.target.value)));
      render();
    });

    $('spx-r5-legend').addEventListener('click', function (e) {
      var b = e.target.closest('[data-r5-legend]');
      if (!b) return;
      s5.highlight = s5.highlight === b.dataset.r5Legend ? null : b.dataset.r5Legend;
      invalidateHighlight();
      renderLegend();
      renderHelp(s5.highlight);
      drawOverlay();
      $('spx-r5-status').textContent = s5.highlight
        ? geo().LABELS[s5.highlight] + ' highlighted on the diagram.'
        : 'Highlight cleared.';
    });

    $('spx-r5-zoom-in').addEventListener('click', function () { s5.zoom = clamp(s5.zoom + 0.25, 1, 6); applyCanvas(); });
    $('spx-r5-zoom-out').addEventListener('click', function () { s5.zoom = clamp(s5.zoom - 0.25, 1, 6); applyCanvas(); });
    $('spx-r5-zoom-reset').addEventListener('click', function () {
      s5.zoom = 1; applyCanvas();
      $('spx-r5-svg-wrap').scrollTo({ top: 0, left: 0 });
    });

    $('spx-r5-fullscreen').addEventListener('click', function () {
      var w = $('spx-r5-svg-wrap');
      if (!document.fullscreenElement && w.requestFullscreen) w.requestFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen();
    });

    $('spx-r5-svg-wrap').addEventListener('wheel', function (e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      s5.zoom = clamp(s5.zoom + (e.deltaY < 0 ? 0.25 : -0.25), 1, 6);
      applyCanvas();
    }, { passive: false });

    var svg = $('spx-r5-svg');

    svg.addEventListener('pointerdown', function (e) {
      var marker = e.target.closest('[data-r5-point]');
      var d = svgData(e);
      if (marker) {
        dragId = Number(marker.dataset.r5Point);
        s5.activeId = dragId;
      } else if (d.inside) {
        setPoint(s5.activeId, d.c, d.t);
        dragId = s5.activeId;
        var picked = geo().regionAt(d.c, d.t);
        if (picked && picked !== 'outside' && picked !== s5.highlight) {
          s5.highlight = picked;
          invalidateHighlight();
        }
      } else return;
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
      render();
    });

    svg.addEventListener('pointermove', function (e) {
      var d = svgData(e);
      if (dragId) { setPoint(dragId, d.c, d.t); drawOverlay(); renderPoints(); renderAnalysis(); return; }
      if (!d.inside) { hover = null; drawOverlay(); return; }
      hover = d;
      var key = geo().regionAt(d.c, d.t);
      drawOverlay();
      renderHelp(key);
      $('spx-r5-status').textContent =
        geo().LABELS[key] + ' at ' + d.c.toFixed(2) + ' wt% C, ' + fmtT(d.t) + '.';
    });

    svg.addEventListener('pointerup', function (e) {
      dragId = null;
      try { svg.releasePointerCapture(e.pointerId); } catch (err) { /* not captured */ }
      render();
    });
    svg.addEventListener('pointercancel', function () { dragId = null; render(); });
    svg.addEventListener('pointerleave', function () { hover = null; drawOverlay(); });

    svg.addEventListener('keydown', function (e) {
      var region = e.target.closest && e.target.closest('[data-r5-region]');
      if (region && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        s5.highlight = region.dataset.r5Region;
        invalidateHighlight();
        renderHelp(s5.highlight);
        renderLegend();
        drawOverlay();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !s5.highlight) return;
      var panel = $('spx-tab-reference-diagrams');
      if (!panel || panel.hidden) return;
      s5.highlight = null;
      invalidateHighlight();
      renderLegend();
      drawOverlay();
      $('spx-r5-status').textContent = 'Highlight cleared.';
    });

    $('spx-r5-export').addEventListener('click', exportPng);
  }

  /* ---------- PNG export ----------
   * An SVG loaded through an <img> is a restricted document: external
   * references inside it are never fetched. The poster's rasters are
   * therefore inlined as data URIs on a clone before serialising, which
   * also keeps the canvas clean because everything is same-origin.
   */
  function inlineImages(svgNode) {
    var images = Array.prototype.slice.call(svgNode.querySelectorAll('image'));
    return Promise.all(images.map(function (img) {
      var href = img.getAttribute('href') ||
        img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (!href || href.indexOf('data:') === 0) return Promise.resolve();
      return fetch(href)
        .then(function (r) { return r.blob(); })
        .then(function (blob) {
          return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onloadend = function () {
              img.setAttribute('href', reader.result);
              img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', reader.result);
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        })
        .catch(function () { /* leave the reference; export still succeeds */ });
    }));
  }

  function exportPng() {
    var svg = $('spx-r5-svg');
    var status = $('spx-r5-status');
    status.textContent = 'Preparing PNG\u2026';

    var clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', NS);
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.style.width = '';

    var w = s5.map === 'rapid' ? RG.VIEW.w : PG.PAGE.w;
    var h = s5.map === 'rapid' ? RG.VIEW.h : PG.PAGE.h;
    var scale = s5.map === 'rapid' ? 2.5 : 1.5;

    inlineImages(clone).then(function () {
      var markup = new XMLSerializer().serializeToString(clone);
      var url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          if (!blob) { status.textContent = 'PNG export failed.'; return; }
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = s5.map === 'rapid'
            ? 'rapid-quench-microconstituent-map.png'
            : 'iron-carbon-cementite-phase-diagram.png';
          document.body.appendChild(a);
          a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
          status.textContent = 'PNG exported.';
        }, 'image/png');
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        status.textContent = 'PNG export failed while rasterising the diagram.';
      };
      img.src = url;
    });
  }

  /* ---------- persistence + init ---------- */

  /*
   * Restored state arrives from a saved file or a share link, so it is
   * untrusted input. Assigning it wholesale let a stale or hand-edited
   * payload drop the points array entirely, which throws on the next render.
   */
  function sanitise(raw) {
    var safe = {
      map: raw && raw.map === 'poster' ? 'poster' : 'rapid',
      level: ['beginner', 'engineer', 'advanced'].indexOf(raw && raw.level) >= 0
        ? raw.level : 'engineer',
      zoom: Math.min(6, Math.max(1, Number(raw && raw.zoom) || 1)),
      showCritical: raw ? raw.showCritical !== false : true,
      showLabels: raw ? raw.showLabels !== false : true,
      showCrosshair: raw ? raw.showCrosshair !== false : true,
      showLegend: raw ? raw.showLegend !== false : true,
      highlight: null,
      points: [],
      activeId: 1,
      nextId: 1
    };

    var prev = s5.map;
    s5.map = safe.map;
    var b = bounds();
    s5.map = prev;

    var seen = {};
    if (raw && Object.prototype.toString.call(raw.points) === '[object Array]') {
      raw.points.forEach(function (p) {
        if (!p) return;
        var c = Number(p.c), t = Number(p.t), id = Math.floor(Number(p.id));
        if (!isFinite(c) || !isFinite(t)) return;
        if (!isFinite(id) || id < 1 || seen[id]) id = safe.points.length + 1;
        seen[id] = true;
        safe.points.push({ id: id, c: clamp(c, b.cMin, b.cMax), t: clamp(t, b.tMin, b.tMax) });
      });
    }
    if (!safe.points.length) {
      var prevMap = s5.map;
      s5.map = safe.map;
      safe.points = defaults();
      s5.map = prevMap;
    }

    safe.nextId = safe.points.reduce(function (m, p) { return Math.max(m, p.id); }, 0);
    var wanted = Math.floor(Number(raw && raw.activeId));
    safe.activeId = safe.points.some(function (p) { return p.id === wanted; })
      ? wanted : safe.points[0].id;

    if (raw && raw.highlight && LABELS_FOR(safe.map)[raw.highlight]) {
      safe.highlight = raw.highlight;
    }
    return safe;
  }

  function LABELS_FOR(map) { return map === 'rapid' ? RG.LABELS : PG.LABELS; }

  function persist() {
    if (typeof window.serializable === 'function' && !window.serializable.__r5) {
      var base = window.serializable;
      window.serializable = function () {
        var out = base();
        out.release5 = JSON.parse(JSON.stringify(s5));
        return out;
      };
      window.serializable.__r5 = true;
    }
    if (typeof window.restore === 'function' && !window.restore.__r5) {
      var baseRestore = window.restore;
      window.restore = function (obj) {
        var ok = baseRestore(obj);
        if (ok && obj && obj.release5) {
          s5 = sanitise(obj.release5);
          invalidateReference();
          invalidateHighlight();
          render();
        }
        return ok;
      };
      window.restore.__r5 = true;
    }
  }

  function wrapGlobal(name) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__r5) return;
    var wrapped = function () {
      var out = fn.apply(this, arguments);
      render();
      return out;
    };
    wrapped.__r5 = true;
    window[name] = wrapped;
  }

  var initAttempts = 0;

  function init() {
    /* The loader inserts the panel before appending this script, so the
       nodes are normally present already. Retry defensively in case the
       script is served from cache ahead of the injection. */
    if (!$('spx-r5-svg')) {
      if (initAttempts++ < 120) setTimeout(init, 50);
      return;
    }

    resetPoints();
    bind();
    persist();
    wrapGlobal('setUnit');
    wrapGlobal('switchTab');
    render();

    window.__SPX = window.__SPX || {};
    window.__SPX.release5 = {
      render: render,
      state: function () { return JSON.parse(JSON.stringify(s5)); },
      setMap: function (m) { s5.map = m; invalidateReference(); resetPoints(); render(); },
      setLevel: function (l) { s5.level = l; render(); },
      regionAt: function (c, t) { return geo().regionAt(c, t); },
      addPoint: function (c, t) {
        var b = bounds(), id = ++s5.nextId;
        s5.points.push({ id: id, c: clamp(Number(c) || 0, b.cMin, b.cMax),
                         t: clamp(Number(t) || 0, b.tMin, b.tMax) });
        s5.activeId = id;
        render();
        return id;
      },
      removeActive: function () {
        if (s5.points.length <= 1) return false;
        s5.points = s5.points.filter(function (p) { return p.id !== s5.activeId; });
        s5.activeId = s5.points[0].id;
        render();
        return true;
      },
      posterLoaded: function () { return posterState === 'ready'; },
      posterState: function () { return posterState; },
      setHighlight: function (key) {
        s5.highlight = key;
        invalidateHighlight();
        renderLegend();
        renderHelp(key);
        drawOverlay();
      },
      highlight: function () { return s5.highlight; },
      highlightShapeCount: function () {
        var data = highlightShapes();
        return data ? data.shapes.length : 0;
      }
    };
  }

  init();
})();
