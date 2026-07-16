window.MaterialCheckerConfig = {
  DEF: {
    chemistry: {
      title: 'Chemistry',
      desc: 'Compare elemental composition and calculated chemistry values.',
      type: 'q',
      units: ['%', 'ppm'],
      names: ['C', 'Mn', 'P', 'S', 'Si', 'Al', 'Nb', 'V', 'Ti', 'Cr', 'Ni', 'Mo', 'Cu', 'B', 'N', 'CEIIW', 'Pcm']
    },
    mechanical: {
      title: 'Mechanical properties',
      desc: 'Evaluate strength, elongation, ratios, and hardness.',
      type: 'q',
      units: ['MPa', 'ksi', '%', 'ratio', 'HV', 'HB', 'HRC'],
      names: ['Yield strength', 'Tensile strength', 'Elongation', 'Yield-to-tensile ratio', 'Hardness']
    },
    charpy: {
      title: 'Charpy / toughness',
      desc: 'Evaluate test temperature, average energy, and minimum individual energy.',
      type: 'c'
    },
    dimensions: {
      title: 'Dimensions',
      desc: 'Compare measured dimensions with entered tolerances.',
      type: 'q',
      units: ['mm', 'in'],
      names: ['Thickness', 'Width', 'Outside diameter', 'Inside diameter', 'Length']
    },
    process: {
      title: 'Process / certification',
      desc: 'Record required manufacturing or documentary evidence.',
      type: 'p'
    }
  },
  LIB: {
    CSA: {
      'CSA G40.21': ['Grade 260W', 'Grade 300W', 'Grade 350W', 'Grade 350WT', 'Grade 400W', 'Grade 480W', 'Other / not listed'],
      'CSA Z245.1': ['Grade 241', 'Grade 290', 'Grade 359', 'Grade 386', 'Grade 414', 'Grade 448', 'Grade 483', 'Grade 550', 'Grade 620', 'Grade 690', 'Other / not listed'],
      'Other / not listed': ['Custom designation']
    },
    ASTM: {
      'ASTM A36/A36M': ['Grade A36', 'Other / not listed'],
      'ASTM A572/A572M': ['Grade 42', 'Grade 50', 'Grade 55', 'Grade 60', 'Grade 65', 'Other / not listed'],
      'ASTM A516/A516M': ['Grade 55', 'Grade 60', 'Grade 65', 'Grade 70', 'Other / not listed'],
      'ASTM A709/A709M': ['Grade 36', 'Grade 50', 'Grade 50W', 'HPS Grade 50W', 'HPS Grade 70W', 'Other / not listed'],
      'ASTM A53/A53M': ['Grade A', 'Grade B', 'Other / not listed'],
      'ASTM A106/A106M': ['Grade A', 'Grade B', 'Grade C', 'Other / not listed'],
      'ASTM A333/A333M': ['Grade 1', 'Grade 3', 'Grade 4', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Other / not listed'],
      'ASTM A500/A500M': ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Other / not listed'],
      'Other / not listed': ['Custom designation']
    },
    API: {
      'API Specification 5L': ['Grade A25', 'Grade A', 'Grade B', 'Grade X42', 'Grade X46', 'Grade X52', 'Grade X56', 'Grade X60', 'Grade X65', 'Grade X70', 'Grade X80', 'Other / not listed'],
      'Other / not listed': ['Custom designation']
    },
    Customer: {'Customer specification': ['Custom designation']},
    Internal: {'Internal specification': ['Custom designation']},
    Other: {'Other / not listed': ['Custom designation']}
  },
  PROPERTIES: {
    chemistry: [
      {code: 'chem_carbon', label: 'Carbon (C)', aliases: ['C', 'Carbon'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_manganese', label: 'Manganese (Mn)', aliases: ['Mn', 'Manganese'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_phosphorus', label: 'Phosphorus (P)', aliases: ['P', 'Phosphorus'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_sulfur', label: 'Sulfur (S)', aliases: ['S', 'Sulfur', 'Sulphur'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_silicon', label: 'Silicon (Si)', aliases: ['Si', 'Silicon'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_aluminum', label: 'Aluminum (Al)', aliases: ['Al', 'Aluminum', 'Aluminium'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_niobium', label: 'Niobium (Nb)', aliases: ['Nb', 'Niobium', 'Columbium'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_vanadium', label: 'Vanadium (V)', aliases: ['V', 'Vanadium'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_titanium', label: 'Titanium (Ti)', aliases: ['Ti', 'Titanium'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_chromium', label: 'Chromium (Cr)', aliases: ['Cr', 'Chromium'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_nickel', label: 'Nickel (Ni)', aliases: ['Ni', 'Nickel'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_molybdenum', label: 'Molybdenum (Mo)', aliases: ['Mo', 'Molybdenum'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_copper', label: 'Copper (Cu)', aliases: ['Cu', 'Copper'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_boron', label: 'Boron (B)', aliases: ['B', 'Boron'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_nitrogen', label: 'Nitrogen (N)', aliases: ['N', 'Nitrogen'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_calcium', label: 'Calcium (Ca)', aliases: ['Ca', 'Calcium'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_oxygen', label: 'Oxygen (O)', aliases: ['O', 'Oxygen'], units: ['%', 'ppm'], defaultUnit: 'ppm'},
      {code: 'chem_hydrogen', label: 'Hydrogen (H)', aliases: ['H', 'Hydrogen'], units: ['%', 'ppm'], defaultUnit: 'ppm'},
      {code: 'chem_tin', label: 'Tin (Sn)', aliases: ['Sn', 'Tin'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_arsenic', label: 'Arsenic (As)', aliases: ['As', 'Arsenic'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_antimony', label: 'Antimony (Sb)', aliases: ['Sb', 'Antimony'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_lead', label: 'Lead (Pb)', aliases: ['Pb', 'Lead'], units: ['%', 'ppm'], defaultUnit: '%'},
      {code: 'chem_ceiiw', label: 'Carbon equivalent (CEIIW)', aliases: ['CEIIW', 'CE IIW', 'Carbon equivalent IIW'], units: ['%'], defaultUnit: '%'},
      {code: 'chem_pcm', label: 'Carbon equivalent (Pcm)', aliases: ['Pcm', 'PCM', 'Carbon equivalent Pcm'], units: ['%'], defaultUnit: '%'}
    ],
    mechanical: [
      {code: 'mech_yield_strength', label: 'Yield strength', aliases: ['Yield strength', 'YS', 'SMYS'], units: ['MPa', 'ksi'], defaultUnit: 'MPa'},
      {code: 'mech_tensile_strength', label: 'Tensile strength', aliases: ['Tensile strength', 'Ultimate tensile strength', 'UTS', 'TS', 'SMTS'], units: ['MPa', 'ksi'], defaultUnit: 'MPa'},
      {code: 'mech_elongation', label: 'Elongation', aliases: ['Elongation', 'Elongation percent'], units: ['%'], defaultUnit: '%'},
      {code: 'mech_yt_ratio', label: 'Yield-to-tensile ratio', aliases: ['Yield-to-tensile ratio', 'Y/T ratio', 'YT ratio'], units: ['ratio'], defaultUnit: 'ratio'},
      {code: 'mech_reduction_area', label: 'Reduction of area', aliases: ['Reduction of area', 'RA'], units: ['%'], defaultUnit: '%'},
      {code: 'mech_hardness_hv', label: 'Vickers hardness (HV)', aliases: ['Hardness HV', 'HV', 'Vickers hardness'], units: ['HV'], defaultUnit: 'HV'},
      {code: 'mech_hardness_hbw', label: 'Brinell hardness (HBW)', aliases: ['Hardness HB', 'HB', 'HBW', 'Brinell hardness'], units: ['HB'], defaultUnit: 'HB'},
      {code: 'mech_hardness_hrc', label: 'Rockwell C hardness (HRC)', aliases: ['HRC', 'Rockwell C hardness'], units: ['HRC'], defaultUnit: 'HRC'}
    ],
    charpy: [
      {code: 'charpy_body_tl', label: 'Pipe body — T-L orientation', aliases: ['Pipe body T-L', 'Body T-L', 'T-L']},
      {code: 'charpy_body_lt', label: 'Pipe body — L-T orientation', aliases: ['Pipe body L-T', 'Body L-T', 'L-T']},
      {code: 'charpy_body_tpa', label: 'Pipe body — TPA orientation', aliases: ['Pipe body TPA', 'TPA']},
      {code: 'charpy_body_lpa', label: 'Pipe body — LPA orientation', aliases: ['Pipe body LPA', 'LPA']},
      {code: 'charpy_wmz', label: 'Weld metal zone (WMZ)', aliases: ['WMZ', 'Weld metal', 'Weld metal zone']},
      {code: 'charpy_haz', label: 'Heat-affected zone (HAZ)', aliases: ['HAZ', 'Heat affected zone', 'Heat-affected zone']},
      {code: 'charpy_fusion_line', label: 'Fusion line', aliases: ['Fusion line']},
      {code: 'charpy_base_metal', label: 'Base metal / plate body', aliases: ['Base metal', 'Plate body', 'Body']}
    ],
    dimensions: [
      {code: 'dim_wall_thickness', label: 'Wall thickness', aliases: ['Wall thickness', 'Thickness'], units: ['mm', 'in'], defaultUnit: 'mm'},
      {code: 'dim_plate_thickness', label: 'Plate thickness', aliases: ['Plate thickness'], units: ['mm', 'in'], defaultUnit: 'mm'},
      {code: 'dim_width', label: 'Width', aliases: ['Width', 'Coil width', 'Plate width'], units: ['mm', 'in'], defaultUnit: 'mm'},
      {code: 'dim_outside_diameter', label: 'Outside diameter', aliases: ['Outside diameter', 'OD'], units: ['mm', 'in'], defaultUnit: 'mm'},
      {code: 'dim_inside_diameter', label: 'Inside diameter', aliases: ['Inside diameter', 'ID'], units: ['mm', 'in'], defaultUnit: 'mm'},
      {code: 'dim_length', label: 'Length', aliases: ['Length'], units: ['mm', 'in'], defaultUnit: 'mm'},
      {code: 'dim_out_of_roundness', label: 'Out-of-roundness', aliases: ['Out of roundness', 'Out-of-roundness', 'Ovality'], units: ['mm', 'in'], defaultUnit: 'mm'},
      {code: 'dim_straightness', label: 'Straightness deviation', aliases: ['Straightness', 'Straightness deviation'], units: ['mm', 'in'], defaultUnit: 'mm'}
    ],
    process: [
      {code: 'proc_mtr_available', label: 'Controlled MTR is available and traceable', aliases: ['Controlled MTR is available and traceable', 'MTR available', 'MTR traceability']},
      {code: 'proc_spec_reviewed', label: 'Controlled target specification edition was reviewed', aliases: ['Controlled target specification edition was reviewed', 'Specification reviewed']},
      {code: 'proc_route_permitted', label: 'Manufacturing route is permitted', aliases: ['Manufacturing route is permitted', 'Manufacturing route permitted']},
      {code: 'proc_heat_treatment', label: 'Required heat treatment is confirmed', aliases: ['Heat treatment confirmed', 'Required heat treatment is confirmed']},
      {code: 'proc_hydrostatic', label: 'Required hydrostatic test is complete', aliases: ['Hydrostatic test completed', 'Required hydrostatic test is complete']},
      {code: 'proc_ndt', label: 'Required nondestructive testing is complete', aliases: ['NDT completed', 'Required nondestructive testing is complete']},
      {code: 'proc_charpy_complete', label: 'Required Charpy testing is complete', aliases: ['Charpy testing completed', 'Required Charpy testing is complete']},
      {code: 'proc_supplementary', label: 'Required supplementary tests are complete', aliases: ['Supplementary tests completed', 'Required supplementary tests are complete']},
      {code: 'proc_cert_signed', label: 'Certification is signed and authorized', aliases: ['Certification signed', 'Certification is signed and authorized']},
      {code: 'proc_customer_approval', label: 'Required customer approval is documented', aliases: ['Customer approval documented', 'Required customer approval is documented']}
    ]
  }
};

(function installMaterialCheckerGuardrails() {
  'use strict';

  const PAGE_SELECTOR = '[data-tool-page="material-specification-compliance-checker"]';
  const PANEL_SELECTOR = '#panels';
  const CATALOG = window.MaterialCheckerConfig.PROPERTIES;
  let scanQueued = false;

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function propertyLookup(section) {
    const lookup = new Map();
    (CATALOG[section] || []).forEach(function (item) {
      [item.code, item.label].concat(item.aliases || []).forEach(function (alias) {
        lookup.set(normalize(alias), item);
      });
    });
    return lookup;
  }

  function message(panel, text, isError) {
    if (!panel) return;
    let box = panel.querySelector('.guardrail-message');
    if (!box) {
      box = document.createElement('p');
      box.className = 'guardrail-message';
      box.setAttribute('role', 'status');
      const head = panel.querySelector('.panel-head');
      if (head) head.insertAdjacentElement('afterend', box);
      else panel.prepend(box);
    }
    box.textContent = text;
    box.classList.toggle('is-error', Boolean(isError));
    box.hidden = !text;
  }

  function dispatchChange(control) {
    control.dispatchEvent(new Event('change', {bubbles: true}));
  }

  function setHiddenName(row, label) {
    let hidden = row.querySelector('input[type="hidden"][data-f="name"]');
    const created = !hidden;
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.dataset.f = 'name';
      row.appendChild(hidden);
    }
    if (created || hidden.value !== label) {
      hidden.value = label;
      dispatchChange(hidden);
    }
  }

  function applyAllowedUnits(row, item) {
    if (!item || !item.units || !item.units.length) return;
    ['aUnit', 'rUnit'].forEach(function (fieldName) {
      const select = row.querySelector('select[data-f="' + fieldName + '"]');
      if (!select) return;
      const previous = select.value;
      select.innerHTML = item.units.map(function (unit) {
        return '<option value="' + unit + '">' + unit + '</option>';
      }).join('');
      const next = item.units.includes(previous) ? previous : item.defaultUnit || item.units[0];
      select.value = next;
      if (previous !== next) dispatchChange(select);
    });
  }

  function usedCodes(panel, exceptSelect) {
    return new Set(Array.from(panel.querySelectorAll('select[data-property-select]'))
      .filter(function (select) { return select !== exceptSelect && select.value; })
      .map(function (select) { return select.value; }));
  }

  function refreshDisabledOptions(panel) {
    const selects = Array.from(panel.querySelectorAll('select[data-property-select]'));
    selects.forEach(function (select) {
      const used = usedCodes(panel, select);
      Array.from(select.options).forEach(function (option) {
        option.disabled = Boolean(option.value && used.has(option.value));
      });
    });
  }

  function canonicalizeSelect(select, notify) {
    const row = select.closest('[data-id]');
    const panel = select.closest('.panel');
    if (!row || !panel) return;
    const section = row.dataset.sec;
    const item = (CATALOG[section] || []).find(function (entry) { return entry.code === select.value; });

    if (!item) {
      setHiddenName(row, '');
      refreshDisabledOptions(panel);
      return;
    }

    const duplicate = Array.from(panel.querySelectorAll('select[data-property-select]')).some(function (other) {
      return other !== select && other.value === item.code;
    });

    if (duplicate) {
      select.value = '';
      dispatchChange(select);
      setHiddenName(row, '');
      refreshDisabledOptions(panel);
      message(panel, item.label + ' is already included. Each requirement can be added only once in this section.', true);
      return;
    }

    setHiddenName(row, item.label);
    applyAllowedUnits(row, item);
    refreshDisabledOptions(panel);
    if (notify) message(panel, item.label + ' selected. Compatible units were applied automatically.', false);
  }

  function fieldLabel(section) {
    if (section === 'process') return 'Required evidence';
    if (section === 'charpy') return 'Test location / orientation';
    return 'Requirement / property';
  }

  function placeholder(section) {
    if (section === 'process') return 'Select required evidence';
    if (section === 'charpy') return 'Select test location / orientation';
    return 'Select a ' + section + ' requirement';
  }

  function enhanceNameInput(input) {
    if (!(input instanceof HTMLInputElement) || input.type === 'hidden') return;
    const row = input.closest('[data-id]');
    const panel = input.closest('.panel');
    if (!row || !panel) return;
    const section = row.dataset.sec;
    const items = CATALOG[section] || [];
    if (!items.length) return;

    const lookup = propertyLookup(section);
    const existing = String(input.value || '').trim();
    const recognized = lookup.get(normalize(existing));
    const label = input.closest('label');
    const select = document.createElement('select');
    select.dataset.f = 'propertyCode';
    select.dataset.propertySelect = section;
    select.setAttribute('aria-label', fieldLabel(section));
    select.innerHTML = '<option value="">' + placeholder(section) + '</option>' + items.map(function (item) {
      return '<option value="' + item.code + '">' + item.label + '</option>';
    }).join('');

    if (label && label.firstChild && label.firstChild.nodeType === Node.TEXT_NODE) {
      label.firstChild.nodeValue = fieldLabel(section);
    }

    input.replaceWith(select);
    setHiddenName(row, recognized ? recognized.label : '');

    if (recognized) {
      select.value = recognized.code;
      dispatchChange(select);
      applyAllowedUnits(row, recognized);
    } else if (existing) {
      message(panel, 'An unrecognized or misspelled legacy value was removed. Select an approved ' + section + ' requirement from the list.', true);
    }
  }

  function scan() {
    scanQueued = false;
    const page = document.querySelector(PAGE_SELECTOR);
    const panels = document.querySelector(PANEL_SELECTOR);
    if (!page || !panels) return;

    panels.querySelectorAll('[data-id] input[data-f="name"]:not([type="hidden"])').forEach(enhanceNameInput);
    panels.querySelectorAll('.panel').forEach(function (panel) {
      const seen = new Set();
      panel.querySelectorAll('select[data-property-select]').forEach(function (select) {
        if (select.value && seen.has(select.value)) {
          select.value = '';
          dispatchChange(select);
          setHiddenName(select.closest('[data-id]'), '');
          message(panel, 'A duplicate requirement was removed. Select a different property for that row.', true);
        } else if (select.value) {
          seen.add(select.value);
        }
      });
      refreshDisabledOptions(panel);
    });
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(scan);
  }

  function init() {
    if (!document.querySelector(PAGE_SELECTOR)) return;

    if (!document.querySelector('link[href="/tools/material-specification-compliance-checker-guardrails.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/tools/material-specification-compliance-checker-guardrails.css';
      document.head.appendChild(link);
    }

    const panels = document.querySelector(PANEL_SELECTOR);
    if (!panels) return;

    panels.addEventListener('change', function (event) {
      const select = event.target.closest('select[data-property-select]');
      if (select) canonicalizeSelect(select, true);
    });

    new MutationObserver(queueScan).observe(panels, {childList: true, subtree: true});
    queueScan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
}());
