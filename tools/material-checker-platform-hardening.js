(function () {
  'use strict';

  const ROOT = '#mcPlatform';
  const EXTRA = {
    charpy_test_temperature: {units: ['°C', '°F'], defaultUnit: '°C'},
    charpy_average_energy: {units: ['J', 'ft-lb'], defaultUnit: 'J'},
    charpy_minimum_individual_energy: {units: ['J', 'ft-lb'], defaultUnit: 'J'},
    charpy_shear_area: {units: ['%'], defaultUnit: '%'},
    charpy_lateral_expansion: {units: ['mm', 'in'], defaultUnit: 'mm'},
    dim_weight_per_length: {units: ['kg/m', 'lb/ft'], defaultUnit: 'kg/m'}
  };
  let queued = false;

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function property(code) {
    if (EXTRA[code]) return EXTRA[code];
    const properties = window.MaterialCheckerConfig && window.MaterialCheckerConfig.PROPERTIES || {};
    for (const category of Object.keys(properties)) {
      const found = (properties[category] || []).find(item => item.code === code);
      if (found) return found;
    }
    return null;
  }

  function fixDuplicateIds(root) {
    const overview = root.querySelector('[data-platform-panel="overview"] #mcApplicabilitySummary');
    const detail = root.querySelector('[data-platform-panel="applicability"] #mcApplicabilitySummary');
    if (overview) overview.id = 'mcOverviewApplicabilitySummary';
    if (detail) {
      detail.id = 'mcApplicabilitySummaryDetail';
      if (!detail.textContent.trim()) detail.textContent = overview && overview.textContent.trim() || 'Complete the wizard to generate an evidence recommendation.';
    }
  }

  function labelTableControls(root) {
    root.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(header => header.textContent.trim());
      table.querySelectorAll('tbody tr').forEach(row => {
        const cells = Array.from(row.children);
        cells.forEach((cell, index) => {
          cell.querySelectorAll('input:not([type="hidden"]),select,textarea').forEach(control => {
            if (!control.getAttribute('aria-label') && !control.closest('label')) {
              const rowName = cells[0] && cells[0].textContent.trim();
              control.setAttribute('aria-label', [headers[index] || 'Field', rowName].filter(Boolean).join(' — '));
            }
          });
        });
      });
    });
    root.querySelectorAll('input:not([type="hidden"]),select,textarea').forEach(control => {
      if (!control.getAttribute('aria-label') && !control.closest('label')) {
        control.setAttribute('aria-label', control.id ? control.id.replace(/^mc/, '').replace(/([A-Z])/g, ' $1').trim() : 'Material checker field');
      }
    });
  }

  function restrictRuleUnits(row, reset) {
    const category = row.querySelector('[data-rule-field="category"]');
    const propertySelect = row.querySelector('[data-rule-field="propertyCode"]');
    const min = row.querySelector('[data-rule-field="min"]');
    const max = row.querySelector('[data-rule-field="max"]');
    const unit = row.querySelector('[data-rule-field="unit"]');
    if (!category || !propertySelect || !unit) return;

    const saveButton = document.querySelector('[data-mc-action="savePackage"]');
    const editable = saveButton && !saveButton.disabled;
    const evidence = category.value === 'process';
    if (min) min.disabled = !editable || evidence;
    if (max) max.disabled = !editable || evidence;
    unit.disabled = !editable || evidence;

    if (evidence) {
      unit.innerHTML = '<option>evidence</option>';
      if (min) min.value = '';
      if (max) max.value = '';
      return;
    }

    const definition = property(propertySelect.value);
    if (!definition || !Array.isArray(definition.units) || !definition.units.length) return;
    const current = unit.value;
    unit.innerHTML = definition.units.map(value => '<option' + (value === current ? ' selected' : '') + '>' + value + '</option>').join('');
    if (reset || !definition.units.includes(current)) unit.value = definition.defaultUnit || definition.units[0];
  }

  function hardenRuleEditor(root) {
    root.querySelectorAll('#mcRuleRows tr[data-rule-id]').forEach(row => restrictRuleUnits(row, false));
  }

  function improveMappings(root) {
    const mappings = {
      charpyaverage: ['charpy_average_energy', 'J'],
      averagecharpyenergy: ['charpy_average_energy', 'J'],
      cvnaverage: ['charpy_average_energy', 'J'],
      charpyminimum: ['charpy_minimum_individual_energy', 'J'],
      minimumindividualcharpy: ['charpy_minimum_individual_energy', 'J'],
      charpytesttemperature: ['charpy_test_temperature', '°C'],
      testtemperature: ['charpy_test_temperature', '°C'],
      sheararea: ['charpy_shear_area', '%'],
      lateralexpansion: ['charpy_lateral_expansion', 'mm']
    };
    root.querySelectorAll('#mcMappingRows tr').forEach(row => {
      const source = normalize(row.cells && row.cells[0] && row.cells[0].textContent);
      const match = mappings[source];
      if (!match) return;
      const codeSelect = row.querySelector('[data-map-field="code"]');
      const unitSelect = row.querySelector('[data-map-field="unit"]');
      if (codeSelect && !codeSelect.value && Array.from(codeSelect.options).some(option => option.value === match[0])) {
        codeSelect.value = match[0];
        codeSelect.dispatchEvent(new Event('change', {bubbles: true}));
      }
      if (unitSelect && Array.from(unitSelect.options).some(option => option.value === match[1])) unitSelect.value = match[1];
    });
  }

  function syncApplicabilitySummary(root) {
    const overview = root.querySelector('#mcOverviewApplicabilitySummary');
    const detail = root.querySelector('#mcApplicabilitySummaryDetail');
    if (detail && overview && overview.textContent.trim()) detail.textContent = overview.textContent;
  }

  function scan() {
    queued = false;
    const root = document.querySelector(ROOT);
    if (!root) return;
    fixDuplicateIds(root);
    labelTableControls(root);
    hardenRuleEditor(root);
    improveMappings(root);
    syncApplicabilitySummary(root);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  }

  function init() {
    const root = document.querySelector(ROOT);
    if (!root) return setTimeout(init, 50);
    root.addEventListener('change', event => {
      const row = event.target.closest('#mcRuleRows tr[data-rule-id]');
      if (row && event.target.matches('[data-rule-field="propertyCode"],[data-rule-field="category"]')) restrictRuleUnits(row, true);
      if (event.target.matches('[data-app]')) setTimeout(queue, 0);
    });
    new MutationObserver(queue).observe(root, {childList: true, subtree: true});
    queue();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
}());
