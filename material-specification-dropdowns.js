(function () {
  'use strict';

  const CHECKER_PATH = '/tools/material-specification-compliance-checker';
  const UNIT_STORAGE_KEY = 'materialCheckerUnitSystem';

  const SPECIFICATIONS = {
    CSA: [
      {
        code: 'CSA G40.21',
        title: 'Structural quality steel',
        grades: [
          'Grade 260W', 'Grade 260WT', 'Grade 300W', 'Grade 300WT',
          'Grade 350W', 'Grade 350WT', 'Grade 350A', 'Grade 350AT',
          'Grade 380W', 'Grade 380WT', 'Grade 400W', 'Grade 400WT',
          'Grade 480W', 'Grade 480WT',
          'Grade 38W', 'Grade 38WT', 'Grade 44W', 'Grade 44WT',
          'Grade 50W', 'Grade 50WT', 'Grade 50A', 'Grade 50AT',
          'Grade 55W', 'Grade 55WT', 'Grade 60W', 'Grade 60WT',
          'Grade 70W', 'Grade 70WT'
        ],
        legacyGrades: new Set([
          'Grade 38W', 'Grade 38WT', 'Grade 44W', 'Grade 44WT',
          'Grade 50W', 'Grade 50WT', 'Grade 50A', 'Grade 50AT',
          'Grade 55W', 'Grade 55WT', 'Grade 60W', 'Grade 60WT',
          'Grade 70W', 'Grade 70WT'
        ])
      },
      {
        code: 'CSA Z245.1',
        title: 'Steel pipe',
        grades: [
          'Grade 241 Category I', 'Grade 241 Category II',
          'Grade 290 Category I', 'Grade 290 Category II',
          'Grade 317 Category I', 'Grade 317 Category II',
          'Grade 359 Category I', 'Grade 359 Category II',
          'Grade 386 Category I', 'Grade 386 Category II',
          'Grade 414 Category I', 'Grade 414 Category II',
          'Grade 448 Category I', 'Grade 448 Category II',
          'Grade 483 Category I', 'Grade 483 Category II',
          'Grade 550 Category I', 'Grade 550 Category II',
          'Grade 620 Category I', 'Grade 620 Category II',
          'Grade 690 Category I', 'Grade 690 Category II'
        ]
      }
    ],
    ASTM: [
      {
        code: 'ASTM A36/A36M',
        title: 'Carbon structural steel',
        grades: ['Grade 36']
      },
      {
        code: 'ASTM A283/A283M',
        title: 'Low and intermediate tensile strength carbon steel plate',
        grades: ['Grade A', 'Grade B', 'Grade C', 'Grade D']
      },
      {
        code: 'ASTM A514/A514M',
        title: 'High-yield-strength quenched and tempered alloy steel plate',
        grades: [
          'Grade A', 'Grade B', 'Grade C', 'Grade E', 'Grade F', 'Grade H',
          'Grade J', 'Grade K', 'Grade M', 'Grade P', 'Grade Q', 'Grade S', 'Grade T'
        ]
      },
      {
        code: 'ASTM A516/A516M',
        title: 'Pressure vessel carbon steel plate',
        grades: ['Grade 55', 'Grade 60', 'Grade 65', 'Grade 70']
      },
      {
        code: 'ASTM A537/A537M',
        title: 'Heat-treated pressure vessel carbon-manganese-silicon steel plate',
        grades: ['Class 1', 'Class 2', 'Class 3']
      },
      {
        code: 'ASTM A572/A572M',
        title: 'High-strength low-alloy columbium-vanadium structural steel',
        grades: ['Grade 42', 'Grade 50', 'Grade 55', 'Grade 60', 'Grade 65']
      },
      {
        code: 'ASTM A588/A588M',
        title: 'High-strength low-alloy structural steel with atmospheric corrosion resistance',
        grades: ['Grade A', 'Grade B', 'Grade C', 'Grade K']
      },
      {
        code: 'ASTM A709/A709M',
        title: 'Structural steel for bridges',
        grades: [
          'Grade 36', 'Grade 50', 'Grade 50S', 'Grade 50W',
          'Grade HPS 50W', 'Grade HPS 70W', 'Grade 100', 'Grade 100W'
        ]
      },
      {
        code: 'ASTM A1011/A1011M',
        title: 'Hot-rolled carbon, structural, HSLA, and improved-formability steel sheet and strip',
        grades: [
          'Commercial Steel Type A', 'Commercial Steel Type B', 'Commercial Steel Type C',
          'Drawing Steel Type A', 'Drawing Steel Type B',
          'Structural Steel Grade 30', 'Structural Steel Grade 33', 'Structural Steel Grade 36',
          'Structural Steel Grade 40', 'Structural Steel Grade 45', 'Structural Steel Grade 50',
          'Structural Steel Grade 55', 'Structural Steel Grade 60', 'Structural Steel Grade 65',
          'Structural Steel Grade 70', 'Structural Steel Grade 80',
          'HSLAS Grade 45', 'HSLAS Grade 50', 'HSLAS Grade 55', 'HSLAS Grade 60',
          'HSLAS Grade 65', 'HSLAS Grade 70', 'HSLAS Grade 80'
        ]
      },
      {
        code: 'ASTM A1018/A1018M',
        title: 'Hot-rolled heavy-thickness sheet and strip',
        grades: [
          'Commercial Steel', 'Drawing Steel',
          'Structural Steel Grade 30', 'Structural Steel Grade 33', 'Structural Steel Grade 36',
          'Structural Steel Grade 40', 'Structural Steel Grade 45', 'Structural Steel Grade 50',
          'Structural Steel Grade 55', 'Structural Steel Grade 60', 'Structural Steel Grade 65',
          'Structural Steel Grade 70', 'Structural Steel Grade 80',
          'HSLAS Grade 45', 'HSLAS Grade 50', 'HSLAS Grade 55', 'HSLAS Grade 60',
          'HSLAS Grade 65', 'HSLAS Grade 70', 'HSLAS Grade 80'
        ]
      }
    ]
  };

  const FIELD_LABELS = new Set([
    'original certified specification',
    'target specification / grade'
  ]);

  const UNIT_SYSTEMS = {
    metric: {
      label: 'Metric',
      thickness: 'mm',
      width: 'mm',
      strength: 'MPa',
      energy: 'J',
      temperature: '°C'
    },
    imperial: {
      label: 'Imperial',
      thickness: 'in',
      width: 'in',
      strength: 'ksi',
      energy: 'ft·lbf',
      temperature: '°F'
    }
  };

  let currentUnitSystem = 'metric';
  let unitSelect = null;
  let widthInput = null;
  let widthLabel = null;
  let thicknessLabel = null;
  let unitMessage = null;

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isCheckerPage() {
    const path = window.location.pathname.replace(/\.html$/i, '').replace(/\/+$/, '');
    return path.endsWith(CHECKER_PATH);
  }

  function addStyles() {
    if (document.getElementById('upskill-specification-dropdown-styles')) return;

    const style = document.createElement('style');
    style.id = 'upskill-specification-dropdown-styles';
    style.textContent = `
      .upskill-spec-selector{display:grid;gap:9px;width:100%}
      .upskill-spec-selector-grid{display:grid;grid-template-columns:minmax(118px,.72fr) minmax(210px,1.3fr) minmax(190px,1fr);gap:9px;width:100%}
      .upskill-spec-selector select,.upskill-spec-selector input[type="text"]{width:100%!important;min-width:0!important;min-height:46px!important;margin:0!important;padding:10px 38px 10px 13px!important;border:1px solid var(--line,#cfd8e5)!important;border-radius:9px!important;background-color:var(--surface,var(--card,#fff))!important;color:var(--ink,#172033)!important;font:inherit!important;line-height:1.25!important}
      .upskill-spec-selector input[type="text"]{padding-right:13px!important}
      .upskill-spec-selector select:focus,.upskill-spec-selector input[type="text"]:focus{border-color:var(--teal,#0e7490)!important;box-shadow:0 0 0 3px rgba(14,116,144,.16)!important;outline:none!important}
      .upskill-spec-selector select:disabled{cursor:not-allowed!important;opacity:.62!important}
      .upskill-spec-custom[hidden]{display:none!important}
      .upskill-spec-summary{display:flex;align-items:flex-start;gap:8px;min-height:22px;color:var(--muted,#5e6b7f);font-size:12px;line-height:1.45}
      .upskill-spec-summary strong{color:var(--ink-soft,var(--ink,#172033));font-weight:700}
      .upskill-spec-warning{display:none;margin-top:2px;padding:8px 10px;border:1px solid #efd28b;border-radius:8px;background:var(--amber-bg,#fff6dd);color:var(--ink,#172033);font-size:12px;line-height:1.45}
      .upskill-spec-warning.is-visible{display:block}
      .upskill-spec-hidden-source{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;border:0!important;white-space:nowrap!important}
      .upskill-unit-panel{grid-column:1/-1;display:grid;grid-template-columns:minmax(220px,.7fr) minmax(320px,1.3fr);gap:14px;align-items:end;margin:0 0 2px;padding:14px;border:1px solid var(--line,#dce4ee);border-radius:12px;background:var(--tint,#f5f8fc)}
      .upskill-unit-panel label{margin:0 0 6px}
      .upskill-unit-panel select{width:100%;min-height:44px}
      .upskill-unit-copy strong{display:block;margin-bottom:3px;color:var(--ink,#172033)}
      .upskill-unit-copy span{display:block;color:var(--muted,#5e6b7f);font-size:12px;line-height:1.45}
      .upskill-width-field{grid-column:span 3}
      .upskill-case-button{white-space:nowrap}
      .upskill-case-note{grid-column:1/-1;margin:0;padding:11px 13px;border:1px solid #cfe2f6;border-radius:10px;background:#eef6ff;color:var(--ink,#172033);font-size:12px;line-height:1.5}
      html[data-theme="dark"] .upskill-spec-selector select,html[data-theme="dark"] .upskill-spec-selector input[type="text"],html[data-theme="dark"] .upskill-unit-panel select,html[data-theme="dark"] #upskillWidth{background-color:var(--surface,var(--card,#111c2d))!important;color:var(--ink,#f4f7fb)!important}
      html[data-theme="dark"] .upskill-spec-selector option,html[data-theme="dark"] .upskill-unit-panel option{background:#111c2d!important;color:#f4f7fb!important}
      html[data-theme="dark"] .upskill-spec-warning{background:var(--warning-bg,#2a2312);border-color:var(--line,#2b3b50);color:var(--ink,#f4f7fb)}
      html[data-theme="dark"] .upskill-case-note{background:var(--info-bg,#10233a);border-color:var(--line,#2b3b50);color:var(--ink,#f4f7fb)}
      @media(max-width:920px){.upskill-spec-selector-grid{grid-template-columns:1fr}.upskill-unit-panel{grid-template-columns:1fr}.upskill-width-field{grid-column:span 12}}
      @media print{.upskill-unit-panel,.upskill-case-button,.upskill-case-note{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function findSourceInput(label) {
    const forId = label.getAttribute('for');
    if (forId) {
      const linked = document.getElementById(forId);
      if (linked instanceof HTMLInputElement) return linked;
    }

    const nested = label.querySelector('input');
    if (nested instanceof HTMLInputElement) return nested;

    let container = label.parentElement;
    for (let depth = 0; container && depth < 4; depth += 1, container = container.parentElement) {
      const input = container.querySelector('input[type="text"],input:not([type])');
      if (input instanceof HTMLInputElement) return input;
    }
    return null;
  }

  function option(value, text, disabled) {
    const item = document.createElement('option');
    item.value = value;
    item.textContent = text;
    item.disabled = Boolean(disabled);
    return item;
  }

  function populate(select, placeholder, values, formatter) {
    select.replaceChildren();
    const blank = option('', placeholder, true);
    blank.selected = true;
    select.appendChild(blank);
    values.forEach(function (value) {
      const itemValue = typeof value === 'string' ? value : value.code;
      select.appendChild(option(itemValue, formatter ? formatter(value) : itemValue, false));
    });
    select.appendChild(option('__other__', 'Other / not listed', false));
  }

  function definitionFor(organization, standardCode) {
    return (SPECIFICATIONS[organization] || []).find(function (definition) {
      return definition.code === standardCode;
    }) || null;
  }

  function parseSpecification(value) {
    const clean = String(value || '').trim();
    if (!clean) return null;

    for (const organization of Object.keys(SPECIFICATIONS)) {
      for (const definition of SPECIFICATIONS[organization]) {
        if (clean === definition.code) {
          return { organization: organization, standard: definition.code, grade: '' };
        }
        if (clean.startsWith(definition.code + ' ')) {
          const grade = clean.slice(definition.code.length + 1).trim();
          if (definition.grades.includes(grade)) {
            return { organization: organization, standard: definition.code, grade: grade };
          }
        }
      }
    }

    return { organization: '__other__', custom: clean };
  }

  function isLegacyG40Grade(organization, standardCode, gradeName) {
    const definition = definitionFor(organization, standardCode);
    return Boolean(definition && definition.legacyGrades && definition.legacyGrades.has(gradeName));
  }

  function enhanceField(label, index) {
    if (label.dataset.upskillSpecificationEnhanced === 'true') return;
    const source = findSourceInput(label);
    if (!source) return;

    label.dataset.upskillSpecificationEnhanced = 'true';
    source.classList.add('upskill-spec-hidden-source');
    source.setAttribute('aria-hidden', 'true');
    source.tabIndex = -1;

    const fieldName = label.textContent.trim();
    const wrapper = document.createElement('div');
    wrapper.className = 'upskill-spec-selector';
    wrapper.dataset.specificationSelector = String(index);

    const grid = document.createElement('div');
    grid.className = 'upskill-spec-selector-grid';

    const organization = document.createElement('select');
    organization.setAttribute('aria-label', fieldName + ': standards organization');
    organization.append(
      option('', 'Select CSA or ASTM', true),
      option('CSA', 'CSA', false),
      option('ASTM', 'ASTM', false),
      option('__other__', 'Other / not listed', false)
    );

    const standard = document.createElement('select');
    standard.setAttribute('aria-label', fieldName + ': standard');
    standard.disabled = true;
    populate(standard, 'Select standard', [], null);

    const grade = document.createElement('select');
    grade.setAttribute('aria-label', fieldName + ': grade');
    grade.disabled = true;
    populate(grade, 'Select grade', [], null);

    const custom = document.createElement('input');
    custom.type = 'text';
    custom.className = 'upskill-spec-custom';
    custom.placeholder = 'Enter the complete specification and grade';
    custom.setAttribute('aria-label', fieldName + ': other specification');
    custom.hidden = true;

    const summary = document.createElement('div');
    summary.className = 'upskill-spec-summary';
    summary.setAttribute('aria-live', 'polite');

    const warning = document.createElement('div');
    warning.className = 'upskill-spec-warning';
    warning.textContent = 'Legacy imperial CSA grade designation selected. Confirm the grade name and controlled edition shown on the MTR, purchase order, and customer documents before making a compliance claim.';

    grid.append(organization, standard, grade);
    wrapper.append(grid, custom, summary, warning);
    source.insertAdjacentElement('afterend', wrapper);

    let writingSource = false;
    let lastSourceValue = source.value;

    function showSummary(value) {
      summary.replaceChildren();
      const heading = document.createElement('strong');
      heading.textContent = value ? 'Selected:' : 'Selection required:';
      const text = document.createElement('span');
      text.textContent = value || 'Choose an organization, standard, and grade.';
      summary.append(heading, text);
      warning.classList.toggle('is-visible', isLegacyG40Grade(organization.value, standard.value, grade.value));
    }

    function writeSource(value) {
      const clean = String(value || '').trim();
      if (source.value !== clean) {
        writingSource = true;
        source.value = clean;
        lastSourceValue = clean;
        source.dispatchEvent(new Event('input', { bubbles: true }));
        source.dispatchEvent(new Event('change', { bubbles: true }));
        writingSource = false;
      }
      showSummary(clean);
    }

    function renderStandards(selectedOrganization) {
      if (!SPECIFICATIONS[selectedOrganization]) {
        standard.disabled = true;
        populate(standard, 'Select standard', [], null);
        return;
      }
      standard.disabled = false;
      populate(standard, 'Select standard', SPECIFICATIONS[selectedOrganization], function (item) {
        return item.code + ' — ' + item.title;
      });
    }

    function renderGrades(selectedOrganization, standardCode) {
      const definition = definitionFor(selectedOrganization, standardCode);
      if (!definition) {
        grade.disabled = true;
        populate(grade, 'Select grade', [], null);
        return;
      }
      grade.disabled = false;
      populate(grade, 'Select grade', definition.grades, null);
    }

    function useCustomMode(value) {
      standard.disabled = true;
      grade.disabled = true;
      custom.hidden = false;
      custom.value = value || '';
      warning.classList.remove('is-visible');
      showSummary(value || '');
    }

    function syncFromSource() {
      const originalValue = source.value;
      const parsed = parseSpecification(originalValue);

      if (!parsed) {
        organization.value = '';
        renderStandards('');
        renderGrades('', '');
        custom.hidden = true;
        custom.value = '';
        warning.classList.remove('is-visible');
        showSummary('');
        return;
      }

      if (parsed.organization === '__other__') {
        organization.value = '__other__';
        useCustomMode(parsed.custom);
        return;
      }

      organization.value = parsed.organization;
      custom.hidden = true;
      custom.value = '';
      renderStandards(parsed.organization);
      standard.value = parsed.standard;
      renderGrades(parsed.organization, parsed.standard);
      grade.value = parsed.grade || '';
      showSummary(originalValue);
    }

    organization.addEventListener('change', function () {
      custom.hidden = true;
      custom.value = '';
      renderGrades('', '');
      warning.classList.remove('is-visible');

      if (organization.value === '__other__') {
        useCustomMode('');
        custom.focus();
        writeSource('');
        return;
      }

      renderStandards(organization.value);
      writeSource('');
    });

    standard.addEventListener('change', function () {
      custom.hidden = true;
      custom.value = '';
      warning.classList.remove('is-visible');

      if (standard.value === '__other__') {
        grade.disabled = true;
        custom.hidden = false;
        custom.focus();
        writeSource('');
        return;
      }

      renderGrades(organization.value, standard.value);
      writeSource('');
    });

    grade.addEventListener('change', function () {
      if (grade.value === '__other__') {
        custom.hidden = false;
        custom.focus();
        warning.classList.remove('is-visible');
        writeSource('');
        return;
      }
      custom.hidden = true;
      custom.value = '';
      writeSource(standard.value && grade.value ? standard.value + ' ' + grade.value : standard.value);
    });

    custom.addEventListener('input', function () {
      writeSource(custom.value);
    });

    source.addEventListener('input', function () {
      if (!writingSource) {
        lastSourceValue = source.value;
        syncFromSource();
      }
    });
    source.addEventListener('change', function () {
      if (!writingSource) {
        lastSourceValue = source.value;
        syncFromSource();
      }
    });

    const form = source.closest('form');
    if (form) {
      form.addEventListener('reset', function () {
        window.setTimeout(function () {
          lastSourceValue = source.value;
          syncFromSource();
        }, 0);
      });
    }

    window.setInterval(function () {
      if (!writingSource && source.value !== lastSourceValue) {
        lastSourceValue = source.value;
        syncFromSource();
      }
    }, 750);

    syncFromSource();
  }

  function readSavedUnitSystem() {
    try {
      const saved = localStorage.getItem(UNIT_STORAGE_KEY);
      return saved === 'imperial' ? 'imperial' : 'metric';
    } catch (error) {
      return 'metric';
    }
  }

  function readStoredAssessmentUnitSystem() {
    try {
      const stored = JSON.parse(localStorage.getItem('materialComplianceAssessment') || 'null');
      const saved = stored && stored.meta && stored.meta.unitSystem;
      return saved === 'imperial' || saved === 'metric' ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function saveUnitSystem(value) {
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, value);
    } catch (error) {
      // The current page still retains the selected system.
    }
  }

  function cleanNumeric(value) {
    const clean = String(value || '').trim();
    if (!clean || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(clean)) return null;
    const number = Number(clean);
    return Number.isFinite(number) ? number : null;
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return '';
    return value.toFixed(digits).replace(/\.?0+$/, '');
  }

  function canonicalUnit(value) {
    const unit = normalize(value).replace(/\s+/g, '');
    if (['mm', 'millimetre', 'millimetres', 'millimeter', 'millimeters'].includes(unit)) return 'mm';
    if (['in', 'inch', 'inches', '"'].includes(unit)) return 'in';
    if (['mpa'].includes(unit)) return 'MPa';
    if (['ksi'].includes(unit)) return 'ksi';
    if (['j', 'joule', 'joules'].includes(unit)) return 'J';
    if (['ft·lbf', 'ft-lbf', 'ftlb', 'ftlbs', 'foot-pound', 'foot-pounds'].includes(unit)) return 'ft·lbf';
    if (['°c', 'c', 'degc', 'celsius'].includes(unit)) return '°C';
    if (['°f', 'f', 'degf', 'fahrenheit'].includes(unit)) return '°F';
    return null;
  }

  function convertValue(value, unit, targetSystem) {
    const number = cleanNumeric(value);
    if (number === null) return null;

    if (targetSystem === 'imperial') {
      if (unit === 'mm') return { value: formatNumber(number / 25.4, 4), unit: 'in' };
      if (unit === 'MPa') return { value: formatNumber(number / 6.894757293, 3), unit: 'ksi' };
      if (unit === 'J') return { value: formatNumber(number * 0.7375621493, 3), unit: 'ft·lbf' };
      if (unit === '°C') return { value: formatNumber(number * 9 / 5 + 32, 1), unit: '°F' };
    } else {
      if (unit === 'in') return { value: formatNumber(number * 25.4, 3), unit: 'mm' };
      if (unit === 'ksi') return { value: formatNumber(number * 6.894757293, 3), unit: 'MPa' };
      if (unit === 'ft·lbf') return { value: formatNumber(number / 0.7375621493, 3), unit: 'J' };
      if (unit === '°F') return { value: formatNumber((number - 32) * 5 / 9, 1), unit: '°C' };
    }
    return null;
  }

  function updateDimensionPresentation() {
    const units = UNIT_SYSTEMS[currentUnitSystem];
    if (thicknessLabel) thicknessLabel.textContent = 'Thickness (' + units.thickness + ')';
    if (widthLabel) widthLabel.textContent = 'Width (' + units.width + ')';

    const thickness = document.getElementById('thickness');
    if (thickness) {
      thickness.step = currentUnitSystem === 'metric' ? '0.01' : '0.001';
      thickness.placeholder = currentUnitSystem === 'metric' ? 'e.g., 38.1' : 'e.g., 1.500';
    }
    if (widthInput) {
      widthInput.step = currentUnitSystem === 'metric' ? '0.1' : '0.01';
      widthInput.placeholder = currentUnitSystem === 'metric' ? 'e.g., 1828.8' : 'e.g., 72';
    }

    if (unitMessage) {
      unitMessage.textContent = currentUnitSystem === 'metric'
        ? 'Dimensions use mm; strength uses MPa; impact energy uses J; temperature uses °C.'
        : 'Dimensions use inches; strength uses ksi; impact energy uses ft·lbf; temperature uses °F.';
    }
  }

  function convertDimensionInput(input, fromUnit, targetSystem) {
    if (!input) return;
    const converted = convertValue(input.value, fromUnit, targetSystem);
    if (converted) input.value = converted.value;
  }

  function targetUnitFor(sourceUnit, targetSystem) {
    const mapping = targetSystem === 'imperial'
      ? { mm: 'in', MPa: 'ksi', J: 'ft·lbf', '°C': '°F' }
      : { in: 'mm', ksi: 'MPa', 'ft·lbf': 'J', '°F': '°C' };
    return mapping[sourceUnit] || null;
  }

  function convertRequirementRows(targetSystem) {
    document.querySelectorAll('#chemTable tbody tr, #mechTable tbody tr, #charpyTable tbody tr, #dimTable tbody tr, #formalTable tbody tr').forEach(function (row) {
      const unitInput = row.querySelector('.unit');
      if (!unitInput) return;
      const sourceUnit = canonicalUnit(unitInput.value);
      if (!sourceUnit) return;

      const expectedSourceUnits = targetSystem === 'imperial'
        ? new Set(['mm', 'MPa', 'J', '°C'])
        : new Set(['in', 'ksi', 'ft·lbf', '°F']);
      if (!expectedSourceUnits.has(sourceUnit)) return;

      const destinationUnit = targetUnitFor(sourceUnit, targetSystem);
      ['.actual', '.min', '.max'].forEach(function (selector) {
        const input = row.querySelector(selector);
        if (!input) return;
        const converted = convertValue(input.value, sourceUnit, targetSystem);
        if (converted) input.value = converted.value;
      });

      if (destinationUnit) unitInput.value = destinationUnit;
    });
  }

  function setUnitSystem(targetSystem, convertExisting, savePreference) {
    const resolved = targetSystem === 'imperial' ? 'imperial' : 'metric';
    if (resolved === currentUnitSystem) {
      if (unitSelect) unitSelect.value = resolved;
      updateDimensionPresentation();
      if (savePreference) saveUnitSystem(resolved);
      return;
    }

    if (convertExisting) {
      const thickness = document.getElementById('thickness');
      const fromDimensionUnit = currentUnitSystem === 'metric' ? 'mm' : 'in';
      convertDimensionInput(thickness, fromDimensionUnit, resolved);
      convertDimensionInput(widthInput, fromDimensionUnit, resolved);
      convertRequirementRows(resolved);
    }

    currentUnitSystem = resolved;
    if (unitSelect) unitSelect.value = resolved;
    updateDimensionPresentation();
    if (savePreference) saveUnitSystem(resolved);

    if (convertExisting && typeof window.evaluateAll === 'function') {
      window.evaluateAll();
    }
  }

  function findLabelForInput(input) {
    if (!input) return null;
    const direct = input.closest('div') && input.closest('div').querySelector('label');
    if (direct) return direct;
    return document.querySelector('label[for="' + input.id + '"]');
  }

  function createUnitControls() {
    const thickness = document.getElementById('thickness');
    const scopeGrid = thickness && thickness.closest('.grid');
    if (!thickness || !scopeGrid || document.getElementById('upskillUnitSystem')) return;

    thicknessLabel = findLabelForInput(thickness);

    const panel = document.createElement('div');
    panel.className = 'upskill-unit-panel no-print';
    panel.innerHTML = `
      <div>
        <label for="upskillUnitSystem">Working unit system</label>
        <select id="upskillUnitSystem">
          <option value="metric">Metric — mm, MPa, J, °C</option>
          <option value="imperial">Imperial — in, ksi, ft·lbf, °F</option>
        </select>
      </div>
      <div class="upskill-unit-copy">
        <strong>Automatic conversion</strong>
        <span id="upskillUnitMessage" aria-live="polite"></span>
      </div>`;
    scopeGrid.insertBefore(panel, scopeGrid.firstChild);

    const widthField = document.createElement('div');
    widthField.className = 'col-3 upskill-width-field';
    widthField.innerHTML = '<label for="upskillWidth">Width (mm)</label><input id="upskillWidth" type="number" step="0.1" placeholder="e.g., 1828.8">';
    thickness.closest('div').insertAdjacentElement('afterend', widthField);

    unitSelect = document.getElementById('upskillUnitSystem');
    unitMessage = document.getElementById('upskillUnitMessage');
    widthInput = document.getElementById('upskillWidth');
    widthLabel = widthField.querySelector('label');

    const assessmentSystem = readStoredAssessmentUnitSystem();
    currentUnitSystem = assessmentSystem || 'metric';
    unitSelect.value = currentUnitSystem;
    updateDimensionPresentation();

    if (!assessmentSystem && readSavedUnitSystem() === 'imperial') {
      setUnitSystem('imperial', true, false);
    }

    unitSelect.addEventListener('change', function () {
      setUnitSystem(unitSelect.value, true, true);
    });
  }

  function addCasePreset() {
    const firstPanel = document.querySelector('main .panel');
    const actions = firstPanel && firstPanel.querySelector('.panel-head .actions');
    const scopeGrid = firstPanel && firstPanel.querySelector('.panel-body .grid');
    if (!actions || !scopeGrid || document.getElementById('upskill50WCase')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'upskill50WCase';
    button.className = 'btn btn-secondary upskill-case-button';
    button.textContent = 'Load 1.5 × 72 plate check';
    button.addEventListener('click', load50WPlateCase);
    actions.insertBefore(button, actions.firstChild);

    const note = document.createElement('div');
    note.className = 'upskill-case-note';
    note.innerHTML = '<strong>50W / A572-50 workflow:</strong> the preset identifies the product, dimensions, and requested designations. Enter the actual MTR chemistry, tensile results, dimensions, and process/certification evidence, then verify all limits against the controlled editions and purchase documents.';
    scopeGrid.appendChild(note);
  }

  function dispatchFieldChange(element) {
    if (!element) return;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function load50WPlateCase() {
    setUnitSystem('imperial', true, true);

    const productForm = document.getElementById('productForm');
    const thickness = document.getElementById('thickness');
    const sourceSpec = document.getElementById('sourceSpec');
    const targetSpec = document.getElementById('targetSpec');
    const scopeNotes = document.getElementById('scopeNotes');

    if (productForm) productForm.value = 'Plate';
    if (thickness) thickness.value = '1.5';
    if (widthInput) widthInput.value = '72';
    if (sourceSpec) sourceSpec.value = 'CSA G40.21 Grade 50W';
    if (targetSpec) targetSpec.value = 'ASTM A572/A572M Grade 50';
    if (scopeNotes) {
      const caseText = 'Plate application screening: 1.5 in × 72 in. Verify the controlled CSA G40.21 and ASTM A572/A572M editions, product-form and thickness applicability, purchase-order/customer requirements, MTR chemistry and mechanical results, manufacturing practice, and certification evidence before disposition.';
      if (!scopeNotes.value.trim()) scopeNotes.value = caseText;
      else if (!scopeNotes.value.includes('1.5 in × 72 in')) scopeNotes.value = scopeNotes.value.trim() + '\n' + caseText;
    }

    [productForm, thickness, widthInput, sourceSpec, targetSpec, scopeNotes].forEach(dispatchFieldChange);
    if (typeof window.evaluateAll === 'function') window.evaluateAll();
  }

  function wrapAssessmentPersistence() {
    if (window.__upskillMaterialUnitsWrapped) return;
    window.__upskillMaterialUnitsWrapped = true;

    const originalGetData = typeof window.getData === 'function' ? window.getData : null;
    if (originalGetData) {
      window.getData = function () {
        const data = originalGetData.apply(this, arguments);
        data.meta = data.meta || {};
        data.meta.unitSystem = currentUnitSystem;
        data.meta.width = widthInput ? widthInput.value : '';
        return data;
      };
    }

    const originalApplyData = typeof window.applyData === 'function' ? window.applyData : null;
    if (originalApplyData) {
      window.applyData = function (data) {
        const incomingSystem = data && data.meta && data.meta.unitSystem === 'imperial' ? 'imperial' : 'metric';
        currentUnitSystem = incomingSystem;
        if (unitSelect) unitSelect.value = incomingSystem;
        updateDimensionPresentation();

        originalApplyData.apply(this, arguments);

        if (widthInput) widthInput.value = data && data.meta ? (data.meta.width || '') : '';
        currentUnitSystem = incomingSystem;
        if (unitSelect) unitSelect.value = incomingSystem;
        updateDimensionPresentation();
        saveUnitSystem(incomingSystem);
        if (typeof window.saveLocal === 'function') window.saveLocal();
      };
    }

    const originalClearAll = typeof window.clearAll === 'function' ? window.clearAll : null;
    if (originalClearAll) {
      window.clearAll = function () {
        const result = originalClearAll.apply(this, arguments);
        currentUnitSystem = unitSelect && unitSelect.value === 'imperial' ? 'imperial' : 'metric';
        updateDimensionPresentation();
        return result;
      };
    }

    const originalLoadDemo = typeof window.loadDemo === 'function' ? window.loadDemo : null;
    if (originalLoadDemo) {
      window.loadDemo = function () {
        const preferred = currentUnitSystem;
        currentUnitSystem = 'metric';
        if (unitSelect) unitSelect.value = 'metric';
        updateDimensionPresentation();

        const result = originalLoadDemo.apply(this, arguments);
        if (widthInput) widthInput.value = '';
        if (preferred === 'imperial') setUnitSystem('imperial', true, false);
        return result;
      };
    }
  }

  function initialize() {
    if (!isCheckerPage()) return;
    addStyles();

    Array.from(document.querySelectorAll('label'))
      .filter(function (label) { return FIELD_LABELS.has(normalize(label.textContent)); })
      .forEach(enhanceField);

    createUnitControls();
    addCasePreset();
    wrapAssessmentPersistence();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}());
