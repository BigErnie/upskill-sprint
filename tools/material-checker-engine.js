(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MaterialCheckerEngine = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = '4.0.0';
  const EPSILON = 1e-9;

  function normalize(value) {
    return String(value == null ? '' : value).toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function toNumber(value) {
    if (value === '' || value == null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function round(value, digits) {
    if (!Number.isFinite(value)) return null;
    const places = Number.isInteger(digits) ? digits : 5;
    const factor = Math.pow(10, places);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  const CONVERSIONS = {
    '%>ppm': value => value * 10000,
    'ppm>%': value => value / 10000,
    'MPa>ksi': value => value / 6.894757293168361,
    'ksi>MPa': value => value * 6.894757293168361,
    'mm>in': value => value / 25.4,
    'in>mm': value => value * 25.4,
    'J>ft-lb': value => value / 1.3558179483314,
    'ft-lb>J': value => value * 1.3558179483314,
    '°C>°F': value => value * 9 / 5 + 32,
    '°F>°C': value => (value - 32) * 5 / 9,
    'kg/m>lb/ft': value => value / 1.48816394357,
    'lb/ft>kg/m': value => value * 1.48816394357
  };

  function convert(value, fromUnit, toUnit) {
    const number = toNumber(value);
    if (number == null) return null;
    const from = String(fromUnit || '').trim();
    const to = String(toUnit || '').trim();
    if (!from || !to || from === to) return number;
    const converter = CONVERSIONS[from + '>' + to];
    return converter ? converter(number) : null;
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return '—';
    const absolute = Math.abs(value);
    const places = Number.isInteger(digits) ? digits : (absolute < 1 ? 5 : 3);
    return Number(value.toFixed(places)).toString();
  }

  function propertyEntry(actuals, code) {
    if (!actuals) return null;
    if (actuals instanceof Map) return actuals.get(code) || null;
    return actuals[code] || null;
  }

  function scopeApplies(rulePackage, scope) {
    const applicability = rulePackage && rulePackage.applicability ? rulePackage.applicability : {};
    const reasons = [];
    let applicable = true;

    const forms = Array.isArray(applicability.productForms) ? applicability.productForms.filter(Boolean) : [];
    if (forms.length && scope && scope.productForm && !forms.includes(scope.productForm)) {
      applicable = false;
      reasons.push('Product form is outside the package applicability.');
    }

    const thickness = scope ? toNumber(scope.thickness) : null;
    const packageUnit = applicability.thicknessUnit || (scope && scope.thicknessUnit) || 'mm';
    const scopeUnit = scope && scope.thicknessUnit ? scope.thicknessUnit : packageUnit;
    const convertedThickness = thickness == null ? null : convert(thickness, scopeUnit, packageUnit);
    const minThickness = toNumber(applicability.thicknessMin);
    const maxThickness = toNumber(applicability.thicknessMax);

    if ((minThickness != null || maxThickness != null) && convertedThickness == null) {
      applicable = false;
      reasons.push('Thickness is required to determine package applicability.');
    } else if (convertedThickness != null) {
      if (minThickness != null && convertedThickness < minThickness - EPSILON) {
        applicable = false;
        reasons.push('Thickness is below the package range.');
      }
      if (maxThickness != null && convertedThickness > maxThickness + EPSILON) {
        applicable = false;
        reasons.push('Thickness is above the package range.');
      }
    }

    const routes = Array.isArray(applicability.manufacturingRoutes) ? applicability.manufacturingRoutes.filter(Boolean) : [];
    if (routes.length && scope && scope.manufacturingRoute && !routes.includes(scope.manufacturingRoute)) {
      applicable = false;
      reasons.push('Manufacturing route is outside the package applicability.');
    }

    const psl = Array.isArray(applicability.psl) ? applicability.psl.filter(Boolean) : [];
    if (psl.length && scope && scope.psl && !psl.includes(scope.psl)) {
      applicable = false;
      reasons.push('Selected PSL is outside the package applicability.');
    }

    return {applicable, reasons, convertedThickness, thicknessUnit: packageUnit};
  }

  function evaluateRule(rule, actuals, evidence) {
    const result = {
      id: rule.id || '',
      category: rule.category || 'other',
      propertyCode: rule.propertyCode || '',
      label: rule.label || rule.propertyCode || 'Unnamed requirement',
      status: 'review',
      actual: '—',
      acceptance: '—',
      basis: rule.clause || rule.source || 'User-entered controlled requirement',
      detail: '',
      convertedActual: null,
      margin: null,
      relativeMarginPercent: null,
      nearLimit: false,
      mandatory: rule.mandatory !== false
    };

    if (rule.type === 'evidence') {
      const evidenceValue = evidence && (evidence[rule.propertyCode] || evidence[rule.id]);
      result.actual = evidenceValue || 'Unknown';
      result.acceptance = rule.expected || 'yes';
      if (evidenceValue === 'yes' || evidenceValue === true) result.status = 'pass';
      else if (evidenceValue === 'no' || evidenceValue === false) result.status = 'fail';
      else result.status = result.mandatory ? 'missing' : 'review';
      result.detail = result.status === 'pass' ? 'Required evidence is present.' :
        result.status === 'fail' ? 'Required evidence is explicitly absent.' : 'Evidence has not been confirmed.';
      return result;
    }

    const actualEntry = propertyEntry(actuals, rule.propertyCode);
    const actualValue = actualEntry && typeof actualEntry === 'object' ? toNumber(actualEntry.value) : toNumber(actualEntry);
    const actualUnit = actualEntry && typeof actualEntry === 'object' ? (actualEntry.unit || rule.unit) : rule.unit;
    const targetUnit = rule.unit || actualUnit || '';
    const min = toNumber(rule.min);
    const max = toNumber(rule.max);

    result.acceptance = [
      min != null ? '≥ ' + formatNumber(min) + (targetUnit ? ' ' + targetUnit : '') : '',
      max != null ? '≤ ' + formatNumber(max) + (targetUnit ? ' ' + targetUnit : '') : ''
    ].filter(Boolean).join(' and ') || 'No numerical limit configured';

    if (min == null && max == null) {
      result.status = 'review';
      result.detail = 'The package rule has no numerical acceptance limit.';
      return result;
    }

    if (actualValue == null) {
      result.status = result.mandatory ? 'missing' : 'review';
      result.actual = 'Missing';
      result.detail = 'Actual evidence is not available.';
      return result;
    }

    const converted = convert(actualValue, actualUnit, targetUnit);
    if (converted == null) {
      result.status = 'review';
      result.actual = formatNumber(actualValue) + (actualUnit ? ' ' + actualUnit : '');
      result.detail = 'No defined conversion exists between the actual and requirement units.';
      return result;
    }

    result.convertedActual = converted;
    result.actual = formatNumber(actualValue) + (actualUnit ? ' ' + actualUnit : '') +
      (actualUnit && targetUnit && actualUnit !== targetUnit ? ' (' + formatNumber(converted) + ' ' + targetUnit + ')' : '');

    const below = min != null && converted < min - EPSILON;
    const above = max != null && converted > max + EPSILON;
    result.status = below || above ? 'fail' : 'pass';

    const margins = [];
    if (min != null) margins.push({value: converted - min, boundary: min, side: 'lower'});
    if (max != null) margins.push({value: max - converted, boundary: max, side: 'upper'});
    if (margins.length) {
      margins.sort((left, right) => left.value - right.value);
      const nearest = margins[0];
      result.margin = nearest.value;
      result.relativeMarginPercent = Math.abs(nearest.boundary) > EPSILON ? nearest.value / Math.abs(nearest.boundary) * 100 : null;
      result.nearLimit = result.status === 'pass' && result.relativeMarginPercent != null && result.relativeMarginPercent <= (toNumber(rule.nearLimitPercent) || 5);
    }

    if (result.status === 'fail') result.detail = below ? 'Actual result is below the entered minimum.' : 'Actual result is above the entered maximum.';
    else if (result.nearLimit) result.detail = 'Requirement is satisfied, but the result is close to the nearest limit.';
    else result.detail = 'Actual result satisfies the entered limit.';

    return result;
  }

  function summarizeResults(rows) {
    const counts = {pass: 0, fail: 0, missing: 0, review: 0, 'not-applicable': 0};
    rows.forEach(row => {
      if (!Object.prototype.hasOwnProperty.call(counts, row.status)) counts.review += 1;
      else counts[row.status] += 1;
    });

    const applicable = rows.length - counts['not-applicable'];
    const assessed = counts.pass + counts.fail;
    const coverage = applicable ? Math.round(assessed / applicable * 100) : 0;
    let status = 'not-assessed';
    let message = 'No applicable rules were evaluated.';
    if (applicable) {
      if (counts.fail) {
        status = 'fail';
        message = 'At least one requirement is not satisfied.';
      } else if (counts.missing || counts.review) {
        status = 'conditional';
        message = 'No failure was found, but required evidence or engineering review remains unresolved.';
      } else {
        status = 'pass';
        message = 'All applicable configured requirements are satisfied.';
      }
    }
    return {counts, applicable, assessed, coverage, status, message};
  }

  function evaluatePackage(rulePackage, actuals, evidence, scope) {
    const applicability = scopeApplies(rulePackage || {}, scope || {});
    if (!applicability.applicable) {
      return {
        packageId: rulePackage && rulePackage.id,
        packageName: rulePackage && rulePackage.name,
        applicability,
        rows: [],
        counts: {pass: 0, fail: 0, missing: 0, review: 0, 'not-applicable': 1},
        applicable: 0,
        assessed: 0,
        coverage: 0,
        status: 'not-applicable',
        message: applicability.reasons.join(' ')
      };
    }
    const rules = Array.isArray(rulePackage && rulePackage.rules) ? rulePackage.rules : [];
    const rows = rules.map(rule => evaluateRule(rule, actuals || {}, evidence || {}));
    return Object.assign({
      packageId: rulePackage && rulePackage.id,
      packageName: rulePackage && rulePackage.name,
      applicability,
      rows
    }, summarizeResults(rows));
  }

  function getActual(actuals, code, targetUnit) {
    const entry = propertyEntry(actuals, code);
    if (!entry) return null;
    const value = typeof entry === 'object' ? toNumber(entry.value) : toNumber(entry);
    const unit = typeof entry === 'object' ? entry.unit : targetUnit;
    return targetUnit ? convert(value, unit || targetUnit, targetUnit) : value;
  }

  function calculateDerived(actuals, scope) {
    const values = {
      C: getActual(actuals, 'chem_carbon', '%'),
      Mn: getActual(actuals, 'chem_manganese', '%'),
      Si: getActual(actuals, 'chem_silicon', '%'),
      Cr: getActual(actuals, 'chem_chromium', '%'),
      Mo: getActual(actuals, 'chem_molybdenum', '%'),
      V: getActual(actuals, 'chem_vanadium', '%'),
      Ni: getActual(actuals, 'chem_nickel', '%'),
      Cu: getActual(actuals, 'chem_copper', '%'),
      B: getActual(actuals, 'chem_boron', '%'),
      YS: getActual(actuals, 'mech_yield_strength', 'MPa'),
      UTS: getActual(actuals, 'mech_tensile_strength', 'MPa')
    };

    const ceInputs = ['C', 'Mn', 'Cr', 'Mo', 'V', 'Ni', 'Cu'];
    const pcmInputs = ['C', 'Si', 'Mn', 'Cu', 'Cr', 'Ni', 'Mo', 'V', 'B'];
    const ceReady = ceInputs.every(key => values[key] != null);
    const pcmReady = pcmInputs.every(key => values[key] != null);
    const ce = ceReady ? values.C + values.Mn / 6 + (values.Cr + values.Mo + values.V) / 5 + (values.Ni + values.Cu) / 15 : null;
    const pcm = pcmReady ? values.C + values.Si / 30 + (values.Mn + values.Cu + values.Cr) / 20 + values.Ni / 60 + values.Mo / 15 + values.V / 10 + 5 * values.B : null;
    const yt = values.YS != null && values.UTS != null && Math.abs(values.UTS) > EPSILON ? values.YS / values.UTS : null;

    const thickness = scope ? toNumber(scope.thickness) : null;
    const width = scope ? toNumber(scope.width) : null;
    const tUnit = scope && scope.thicknessUnit ? scope.thicknessUnit : 'mm';
    const wUnit = scope && scope.widthUnit ? scope.widthUnit : tUnit;
    const widthInThicknessUnits = width == null ? null : convert(width, wUnit, tUnit);
    const dt = thickness != null && widthInThicknessUnits != null && Math.abs(thickness) > EPSILON ? widthInThicknessUnits / thickness : null;

    return {
      ceiiw: {value: ce, unit: '%', ready: ceReady, missing: ceInputs.filter(key => values[key] == null), formula: 'C + Mn/6 + (Cr + Mo + V)/5 + (Ni + Cu)/15'},
      pcm: {value: pcm, unit: '%', ready: pcmReady, missing: pcmInputs.filter(key => values[key] == null), formula: 'C + Si/30 + (Mn + Cu + Cr)/20 + Ni/60 + Mo/15 + V/10 + 5B'},
      ytRatio: {value: yt, unit: 'ratio', ready: yt != null, missing: [values.YS == null ? 'Yield strength' : '', values.UTS == null ? 'Tensile strength' : ''].filter(Boolean), formula: 'Yield strength / tensile strength'},
      diameterThicknessRatio: {value: dt, unit: 'ratio', ready: dt != null, missing: [width == null ? 'Width or OD' : '', thickness == null ? 'Thickness' : ''].filter(Boolean), formula: 'Width or OD / thickness'}
    };
  }

  function mean(values) {
    const clean = values.map(toNumber).filter(value => value != null);
    return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
  }

  function sampleStandardDeviation(values) {
    const clean = values.map(toNumber).filter(value => value != null);
    if (clean.length < 2) return null;
    const average = mean(clean);
    const sumSquares = clean.reduce((sum, value) => sum + Math.pow(value - average, 2), 0);
    return Math.sqrt(sumSquares / (clean.length - 1));
  }

  function quantile(values, probability) {
    const clean = values.map(toNumber).filter(value => value != null).sort((a, b) => a - b);
    if (!clean.length) return null;
    if (clean.length === 1) return clean[0];
    const position = (clean.length - 1) * probability;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return clean[lower];
    return clean[lower] + (clean[upper] - clean[lower]) * (position - lower);
  }

  function capability(values, lsl, usl) {
    const clean = values.map(toNumber).filter(value => value != null);
    const average = mean(clean);
    const sd = sampleStandardDeviation(clean);
    const lower = toNumber(lsl);
    const upper = toNumber(usl);
    let cpl = null;
    let cpu = null;
    let cpk = null;
    let pp = null;
    if (sd != null && sd > EPSILON) {
      if (lower != null) cpl = (average - lower) / (3 * sd);
      if (upper != null) cpu = (upper - average) / (3 * sd);
      cpk = cpl != null && cpu != null ? Math.min(cpl, cpu) : (cpl != null ? cpl : cpu);
      if (lower != null && upper != null) pp = (upper - lower) / (6 * sd);
    }
    return {
      n: clean.length,
      mean: average,
      standardDeviation: sd,
      min: clean.length ? Math.min.apply(null, clean) : null,
      max: clean.length ? Math.max.apply(null, clean) : null,
      median: quantile(clean, 0.5),
      p10: quantile(clean, 0.1),
      p90: quantile(clean, 0.9),
      cpl, cpu, cpk, ppk: cpk, pp,
      caution: clean.length < 30 ? 'Capability estimates are unstable with fewer than 30 independent observations.' : ''
    };
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    const source = String(text || '').replace(/^\uFEFF/, '');
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (character === '"') quoted = false;
        else field += character;
      } else if (character === '"') quoted = true;
      else if (character === ',') {
        row.push(field.trim());
        field = '';
      } else if (character === '\n') {
        row.push(field.trim());
        if (row.some(value => value !== '')) rows.push(row);
        row = [];
        field = '';
      } else if (character !== '\r') field += character;
    }
    row.push(field.trim());
    if (row.some(value => value !== '')) rows.push(row);
    if (!rows.length) return [];
    const headers = rows[0].map((header, index) => header || 'Column ' + (index + 1));
    return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] == null ? '' : values[index]])));
  }

  function flattenPropertyCatalog(config) {
    const entries = [];
    const properties = config && config.PROPERTIES ? config.PROPERTIES : {};
    Object.keys(properties).forEach(category => {
      (properties[category] || []).forEach(item => {
        entries.push(Object.assign({category}, item));
      });
    });
    return entries;
  }

  function mapHeader(header, config, customAliases) {
    const key = normalize(header);
    const aliases = customAliases || {};
    if (aliases[key]) return {code: aliases[key], confidence: 1, source: 'custom alias'};

    const fixed = {
      materialid: 'materialId', coilid: 'materialId', plateid: 'materialId', pipeid: 'materialId', specimenid: 'materialId',
      heat: 'heatNumber', heatnumber: 'heatNumber', heatno: 'heatNumber',
      sourcegrade: 'sourceGrade', targetgrade: 'targetGrade', thickness: 'thickness', wallthickness: 'dim_wall_thickness',
      od: 'dim_outside_diameter', outsidediameter: 'dim_outside_diameter', width: 'dim_width'
    };
    if (fixed[key]) return {code: fixed[key], confidence: 1, source: 'system alias'};

    const catalogue = flattenPropertyCatalog(config);
    let best = null;
    catalogue.forEach(item => {
      const candidates = [item.code, item.label].concat(item.aliases || []);
      candidates.forEach(candidate => {
        const normalizedCandidate = normalize(candidate);
        let score = 0;
        if (normalizedCandidate === key) score = 1;
        else if (normalizedCandidate && (normalizedCandidate.includes(key) || key.includes(normalizedCandidate))) score = 0.8;
        if (!best || score > best.confidence) best = {code: item.code, label: item.label, category: item.category, confidence: score, source: 'catalogue'};
      });
    });
    return best && best.confidence >= 0.6 ? best : {code: '', confidence: 0, source: 'unmapped'};
  }

  function summarizeBatch(results) {
    const counts = {pass: 0, fail: 0, conditional: 0, 'not-applicable': 0, 'not-assessed': 0};
    const pareto = {};
    (results || []).forEach(record => {
      const status = record.result && record.result.status ? record.result.status : 'not-assessed';
      counts[status] = (counts[status] || 0) + 1;
      if (record.result && Array.isArray(record.result.rows)) {
        record.result.rows.filter(row => row.status === 'fail' || row.status === 'missing' || row.status === 'review').forEach(row => {
          pareto[row.label] = (pareto[row.label] || 0) + 1;
        });
      }
    });
    const total = (results || []).length;
    return {
      total,
      counts,
      passRate: total ? counts.pass / total * 100 : 0,
      pareto: Object.entries(pareto).sort((left, right) => right[1] - left[1]).map(entry => ({label: entry[0], count: entry[1]}))
    };
  }

  function slug(value) {
    return String(value || 'item').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
  }

  function runSelfTests() {
    const tests = [];
    function test(name, check) {
      try {
        const passed = Boolean(check());
        tests.push({name, passed, message: passed ? '' : 'Assertion returned false.'});
      } catch (error) {
        tests.push({name, passed: false, message: error.message});
      }
    }
    test('MPa to ksi conversion', () => Math.abs(convert(485, 'MPa', 'ksi') - 70.344) < 0.01);
    test('ksi to MPa conversion', () => Math.abs(convert(72, 'ksi', 'MPa') - 496.423) < 0.01);
    test('Boundary value passes', () => evaluateRule({propertyCode: 'x', min: 10, max: 20, unit: 'MPa'}, {x: {value: 10, unit: 'MPa'}}).status === 'pass');
    test('Out-of-range value fails', () => evaluateRule({propertyCode: 'x', min: 10, max: 20, unit: 'MPa'}, {x: {value: 21, unit: 'MPa'}}).status === 'fail');
    test('Missing mandatory evidence is missing', () => evaluateRule({propertyCode: 'x', min: 10, unit: 'MPa', mandatory: true}, {}).status === 'missing');
    test('CEIIW calculation', () => {
      const derived = calculateDerived({
        chem_carbon: {value: 0.1, unit: '%'}, chem_manganese: {value: 1.2, unit: '%'},
        chem_chromium: {value: 0.1, unit: '%'}, chem_molybdenum: {value: 0.05, unit: '%'},
        chem_vanadium: {value: 0.02, unit: '%'}, chem_nickel: {value: 0.1, unit: '%'},
        chem_copper: {value: 0.1, unit: '%'}
      }, {});
      return derived.ceiiw.ready && derived.ceiiw.value > 0.3;
    });
    test('Capability sample size', () => capability([1, 2, 3, 4], 0, 5).n === 4);
    return {version: VERSION, passed: tests.every(item => item.passed), tests};
  }

  return {
    VERSION,
    normalize,
    toNumber,
    round,
    convert,
    formatNumber,
    scopeApplies,
    evaluateRule,
    evaluatePackage,
    summarizeResults,
    calculateDerived,
    mean,
    sampleStandardDeviation,
    quantile,
    capability,
    parseCSV,
    flattenPropertyCatalog,
    mapHeader,
    summarizeBatch,
    slug,
    runSelfTests
  };
}));
