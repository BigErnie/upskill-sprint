(function () {
  'use strict';

  const Engine = window.MaterialCheckerEngine;
  const Config = window.MaterialCheckerConfig;
  if (!Engine || !Config || !document.querySelector('[data-tool-page="material-specification-compliance-checker"]')) return;

  const STORAGE_KEY = 'upskill-material-compliance-platform-v4';
  const MAX_AUDIT = 750;
  const STATUS_OPTIONS = ['Draft', 'Evidence incomplete', 'Ready for technical review', 'Approved', 'Rejected', 'Superseded'];
  const DISPOSITION_ACTIONS = [
    'Verify data-entry error', 'Confirm units', 'Review specification edition', 'Request missing MTR evidence',
    'Retest', 'Test additional specimens', 'Engineering review', 'Customer concession',
    'Regrade to another specification', 'Reject or scrap'
  ];
  const ROLES = ['Viewer', 'Analyst', 'Engineer', 'Approver', 'Standards administrator', 'System administrator'];
  const ROLE_RANK = {'viewer': 0, 'analyst': 1, 'engineer': 2, 'approver': 3, 'standards-administrator': 4, 'system-administrator': 5};
  const EXTRA_PROPERTIES = {
    charpy: [
      {code: 'charpy_test_temperature', label: 'Charpy test temperature', units: ['°C', '°F'], defaultUnit: '°C'},
      {code: 'charpy_average_energy', label: 'Average Charpy energy', units: ['J', 'ft-lb'], defaultUnit: 'J'},
      {code: 'charpy_minimum_individual_energy', label: 'Minimum individual Charpy energy', units: ['J', 'ft-lb'], defaultUnit: 'J'},
      {code: 'charpy_shear_area', label: 'Average shear area', units: ['%'], defaultUnit: '%'},
      {code: 'charpy_lateral_expansion', label: 'Average lateral expansion', units: ['mm', 'in'], defaultUnit: 'mm'}
    ],
    dimensions: [
      {code: 'dim_weight_per_length', label: 'Weight per unit length', units: ['kg/m', 'lb/ft'], defaultUnit: 'kg/m'}
    ]
  };

  let state = loadState();
  let activeTab = 'overview';
  let inputAuditTimer = null;

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[character]);
  }

  function defaultState() {
    return {
      version: 4,
      applicability: {
        productForm: '', manufacturingRoute: '', psl: '', sourService: 'No', heatTreatment: '',
        serviceTemperature: '', temperatureUnit: '°C', supplementaryCharpy: false, hydrostatic: false,
        ndt: false, notes: ''
      },
      packages: [],
      selectedPackageId: '',
      templates: [],
      batch: {sourceName: '', records: [], mapping: [], results: [], selectedPackageId: ''},
      comparisonPackageIds: [],
      workflow: {
        status: 'Draft', reviewer: '', approver: '', disposition: '', comments: '', actions: [],
        overrides: [], locked: false, approvedAt: '', approvedBy: ''
      },
      aliases: {},
      storageMode: 'local',
      localRole: 'Engineer',
      audit: []
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return Object.assign(defaultState(), saved || {}, {
        applicability: Object.assign(defaultState().applicability, saved && saved.applicability),
        batch: Object.assign(defaultState().batch, saved && saved.batch),
        workflow: Object.assign(defaultState().workflow, saved && saved.workflow)
      });
    } catch (error) {
      return defaultState();
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function currentIdentityUser() {
    try {
      return window.netlifyIdentity && window.netlifyIdentity.currentUser ? window.netlifyIdentity.currentUser() : null;
    } catch (error) {
      return null;
    }
  }

  function currentActor() {
    const user = currentIdentityUser();
    if (user) return user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name) || user.email || user.id;
    const reviewer = document.querySelector('[data-scope="reviewer"]');
    return reviewer && reviewer.value.trim() ? reviewer.value.trim() : 'Local user';
  }

  function currentRole() {
    const user = currentIdentityUser();
    const roles = user && user.app_metadata && Array.isArray(user.app_metadata.roles) ? user.app_metadata.roles : [];
    if (roles.length) {
      const normalized = roles.map(role => Engine.slug(role));
      return normalized.sort((left, right) => (ROLE_RANK[right] || 0) - (ROLE_RANK[left] || 0))[0];
    }
    return Engine.slug(state.localRole || 'Engineer');
  }

  function hasRole(minimumRole) {
    return (ROLE_RANK[currentRole()] || 0) >= (ROLE_RANK[Engine.slug(minimumRole)] || 0);
  }

  function logAudit(action, details) {
    state.audit.unshift({id: uid('audit'), at: new Date().toISOString(), actor: currentActor(), action, details: details || ''});
    state.audit = state.audit.slice(0, MAX_AUDIT);
    persist();
    if (document.getElementById('mcAuditList')) renderAudit();
  }

  function setStatus(message, type) {
    const element = document.getElementById('mcPlatformStatus');
    if (!element) return;
    element.textContent = message || '';
    element.className = 'mc-status' + (type ? ' is-' + type : '');
  }

  function nextFrame(delay) {
    return new Promise(resolve => setTimeout(resolve, delay == null ? 40 : delay));
  }

  function propertyCatalog(category) {
    return (Config.PROPERTIES && Config.PROPERTIES[category] ? Config.PROPERTIES[category] : [])
      .concat(EXTRA_PROPERTIES[category] || []);
  }

  function allProperties() {
    const categories = ['chemistry', 'mechanical', 'charpy', 'dimensions', 'process'];
    return categories.flatMap(category => propertyCatalog(category).map(item => Object.assign({category}, item)));
  }

  function propertyByCode(code) {
    return allProperties().find(item => item.code === code) || null;
  }

  function readScope() {
    const scope = {};
    document.querySelectorAll('[data-scope]').forEach(input => { scope[input.dataset.scope] = input.value; });
    return Object.assign(scope, {
      manufacturingRoute: state.applicability.manufacturingRoute,
      psl: state.applicability.psl,
      sourService: state.applicability.sourService,
      heatTreatment: state.applicability.heatTreatment
    });
  }

  function getRowPropertyCode(row) {
    const controlled = row.querySelector('select[data-property-select]');
    if (controlled && controlled.value) return controlled.value;
    const stored = row.querySelector('[data-f="propertyCode"]');
    if (stored && stored.value) return stored.value;
    const hiddenName = row.querySelector('input[data-f="name"]');
    const name = hiddenName ? hiddenName.value : '';
    const normalized = Engine.normalize(name);
    return allProperties().find(item => [item.code, item.label].concat(item.aliases || []).some(alias => Engine.normalize(alias) === normalized))?.code || '';
  }

  function readCurrentEvidence() {
    const actuals = {};
    const evidence = {};
    document.querySelectorAll('#panels [data-id]').forEach(row => {
      const section = row.dataset.sec;
      const propertyCode = getRowPropertyCode(row);
      if (!propertyCode) return;
      if (section === 'process') {
        const field = row.querySelector('[data-f="evidence"]');
        evidence[propertyCode] = field ? field.value : 'unknown';
        return;
      }
      if (section === 'charpy') {
        const values = {
          charpy_test_temperature: [row.querySelector('[data-f="testTemp"]'), row.querySelector('[data-f="tempUnit"]')],
          charpy_average_energy: [row.querySelector('[data-f="avg"]'), row.querySelector('[data-f="eUnit"]')],
          charpy_minimum_individual_energy: [row.querySelector('[data-f="individual"]'), row.querySelector('[data-f="eUnit"]')]
        };
        Object.entries(values).forEach(([code, fields]) => {
          if (fields[0] && fields[0].value !== '') {
            actuals[code] = {value: fields[0].value, unit: fields[1] ? fields[1].value : ''};
            actuals[propertyCode + ':' + code] = actuals[code];
          }
        });
        return;
      }
      const actual = row.querySelector('[data-f="actual"]');
      const unit = row.querySelector('[data-f="aUnit"]');
      if (actual && actual.value !== '') actuals[propertyCode] = {value: actual.value, unit: unit ? unit.value : ''};
    });
    return {actuals, evidence};
  }

  function captureCoreRows() {
    const rows = {};
    ['chemistry', 'mechanical', 'charpy', 'dimensions', 'process'].forEach(section => {
      rows[section] = Array.from(document.querySelectorAll('#panels [data-sec="' + section + '"]')).map(row => {
        const fields = {};
        row.querySelectorAll('[data-f]').forEach(field => {
          fields[field.dataset.f] = field.type === 'checkbox' ? field.checked : field.value;
        });
        fields.propertyCode = getRowPropertyCode(row);
        return fields;
      });
    });
    return rows;
  }

  function currentManualPackage(name) {
    const scope = readScope();
    const rules = [];
    document.querySelectorAll('#panels [data-id]').forEach(row => {
      const section = row.dataset.sec;
      const code = getRowPropertyCode(row);
      if (!code) return;
      const source = row.querySelector('[data-f="source"]');
      const mandatory = row.querySelector('[data-f="mandatory"]');
      if (section === 'process') {
        const prop = propertyByCode(code);
        rules.push({id: uid('rule'), type: 'evidence', category: section, propertyCode: code, label: prop?.label || code, mandatory: mandatory ? mandatory.checked : true, clause: source?.value || ''});
      } else if (section === 'charpy') {
        const label = propertyByCode(code)?.label || code;
        const requirementUnit = row.querySelector('[data-f="reqUnit"]')?.value || 'J';
        const temperatureUnit = row.querySelector('[data-f="tempUnit"]')?.value || '°C';
        const definitions = [
          ['charpy_test_temperature', '', row.querySelector('[data-f="reqTemp"]')?.value, temperatureUnit, 'Maximum test temperature'],
          ['charpy_average_energy', row.querySelector('[data-f="reqAvg"]')?.value, '', requirementUnit, 'Average energy'],
          ['charpy_minimum_individual_energy', row.querySelector('[data-f="reqIndividual"]')?.value, '', requirementUnit, 'Minimum individual energy']
        ];
        definitions.forEach(definition => {
          if (definition[1] !== '' || definition[2] !== '') rules.push({
            id: uid('rule'), category: section, propertyCode: code + ':' + definition[0], label: label + ' — ' + definition[4],
            min: definition[1], max: definition[2], unit: definition[3], mandatory: mandatory ? mandatory.checked : true,
            clause: source?.value || '', locationCode: code
          });
        });
      } else {
        const prop = propertyByCode(code);
        rules.push({
          id: uid('rule'), category: section, propertyCode: code, label: prop?.label || code,
          min: row.querySelector('[data-f="min"]')?.value || '', max: row.querySelector('[data-f="max"]')?.value || '',
          unit: row.querySelector('[data-f="rUnit"]')?.value || prop?.defaultUnit || '',
          mandatory: mandatory ? mandatory.checked : true, clause: source?.value || '', nearLimitPercent: 5
        });
      }
    });
    return {
      id: uid('package'), name: name || [scope.targetStandard, scope.targetGrade, scope.targetEdition].filter(Boolean).join(' | ') || 'Current manual requirements',
      organization: scope.targetOrg || '', standard: scope.targetStandard || '', grade: scope.targetGrade || '', edition: scope.targetEdition || '',
      status: 'Draft', owner: currentActor(), lastVerified: '', applicability: {productForms: scope.productForm ? [scope.productForm] : [], thicknessUnit: scope.thicknessUnit || 'mm'}, rules
    };
  }

  function coreEvaluation() {
    const current = readCurrentEvidence();
    return Engine.evaluatePackage(currentManualPackage('Current manual requirements'), current.actuals, current.evidence, readScope());
  }

  function initWorkspace() {
    const management = document.querySelector('.management-card');
    if (!management || document.getElementById('mcPlatform')) return;
    const workspace = document.createElement('section');
    workspace.className = 'card mc-platform';
    workspace.id = 'mcPlatform';
    workspace.innerHTML = workspaceHTML();
    management.before(workspace);
    bindWorkspace();
    renderAll();
    applyLockState();
    initializeIdentity();
    observeCoreTool();
    logAudit('Advanced platform initialized', 'Material Compliance Platform v' + Engine.VERSION);
  }

  function workspaceHTML() {
    return `
      <div class="heading"><span class="step">5</span><div><p class="kicker">Advanced engineering workspace</p><h2>Material compliance decision platform</h2><p>Manage applicability, approved rule packages, imports, batch screening, multi-specification comparisons, capability analysis, dispositions, audit history, and reports.</p></div></div>
      <p class="mc-lock-banner">This assessment is locked after approval. An approver or administrator must unlock it before changes are made.</p>
      <div class="mc-platform-tabs" role="tablist" aria-label="Advanced material compliance tools">
        ${[['overview','Overview'],['applicability','Applicability'],['packages','Rule packages'],['import','Import & batch'],['compare','Compare'],['statistics','Statistics'],['review','Review & audit'],['admin','Admin & storage']].map(item => `<button class="mc-platform-tab" type="button" role="tab" data-platform-tab="${item[0]}" aria-selected="${item[0] === activeTab}">${item[1]}</button>`).join('')}
      </div>
      <div class="mc-platform-panel" data-platform-panel="overview"></div>
      <div class="mc-platform-panel" data-platform-panel="applicability" hidden></div>
      <div class="mc-platform-panel" data-platform-panel="packages" hidden></div>
      <div class="mc-platform-panel" data-platform-panel="import" hidden></div>
      <div class="mc-platform-panel" data-platform-panel="compare" hidden></div>
      <div class="mc-platform-panel" data-platform-panel="statistics" hidden></div>
      <div class="mc-platform-panel" data-platform-panel="review" hidden></div>
      <div class="mc-platform-panel" data-platform-panel="admin" hidden></div>
      <p id="mcPlatformStatus" class="mc-status" role="status" aria-live="polite"></p>`;
  }

  function bindWorkspace() {
    const workspace = document.getElementById('mcPlatform');
    workspace.addEventListener('click', handleClick);
    workspace.addEventListener('change', handleChange);
    workspace.addEventListener('input', handleInput);
    workspace.querySelectorAll('[role="tab"]').forEach(tab => tab.addEventListener('keydown', handleTabKeys));
  }

  function handleTabKeys(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(document.querySelectorAll('.mc-platform-tab'));
    let index = tabs.indexOf(event.currentTarget);
    if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
    if (event.key === 'Home') index = 0;
    if (event.key === 'End') index = tabs.length - 1;
    tabs[index].focus();
    activateTab(tabs[index].dataset.platformTab);
    event.preventDefault();
  }

  function activateTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('.mc-platform-tab').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.platformTab === tabName)));
    document.querySelectorAll('.mc-platform-panel').forEach(panel => { panel.hidden = panel.dataset.platformPanel !== tabName; });
    renderTab(tabName);
  }

  function handleClick(event) {
    const tab = event.target.closest('[data-platform-tab]');
    if (tab) return activateTab(tab.dataset.platformTab);
    const action = event.target.closest('[data-mc-action]');
    if (!action) return;
    const name = action.dataset.mcAction;
    const actions = {
      refreshOverview: renderOverview,
      applyApplicability,
      newPackage,
      capturePackage: captureCurrentAsPackage,
      duplicatePackage,
      deletePackage,
      addRule,
      savePackage: savePackageEditor,
      exportPackage,
      importPackageClick: () => document.getElementById('mcPackageImport').click(),
      captureTemplate,
      applyTemplate,
      deleteTemplate,
      runBatch,
      runComparison,
      computeStatistics,
      addOverride,
      saveWorkflow,
      approveAssessment,
      unlockAssessment,
      printReport: () => openReport('report'),
      printCertificate: () => openReport('certificate'),
      addAlias,
      runTests,
      identityLogin,
      identityLogout,
      saveRemote,
      loadRemote,
      clearAudit
    };
    if (actions[name]) actions[name]();
  }

  function handleChange(event) {
    const tab = event.target.dataset.platformTab;
    if (tab) return activateTab(tab);
    if (event.target.matches('[data-app]')) {
      const key = event.target.dataset.app;
      state.applicability[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      persist();
      renderApplicabilityRationale();
      return;
    }
    if (event.target.id === 'mcPackageSelect') {
      state.selectedPackageId = event.target.value;
      persist();
      renderPackages();
      return;
    }
    if (event.target.matches('[data-package-field]')) return;
    if (event.target.matches('[data-rule-field]')) {
      const categorySelect = event.target.dataset.ruleField === 'category';
      if (categorySelect) updateRulePropertyOptions(event.target.closest('tr'));
      return;
    }
    if (event.target.id === 'mcTemplateSelect' || event.target.id === 'mcBatchPackageSelect' || event.target.id === 'mcStatsProperty') return;
    if (event.target.matches('[data-map-index]')) {
      updateMappingFromUI();
      return;
    }
    if (event.target.matches('[data-compare-package]')) {
      state.comparisonPackageIds = Array.from(document.querySelectorAll('[data-compare-package]:checked')).map(input => input.value);
      persist();
      return;
    }
    if (event.target.matches('[data-workflow-field]')) {
      const key = event.target.dataset.workflowField;
      state.workflow[key] = event.target.value;
      persist();
      return;
    }
    if (event.target.matches('[data-disposition-action]')) {
      state.workflow.actions = Array.from(document.querySelectorAll('[data-disposition-action]:checked')).map(input => input.value);
      persist();
      return;
    }
    if (event.target.id === 'mcLocalRole') {
      state.localRole = event.target.value;
      persist();
      logAudit('Local role changed', state.localRole);
      renderAdmin();
      renderPackages();
      return;
    }
    if (event.target.matches('[name="mcStorageMode"]')) {
      state.storageMode = event.target.value;
      persist();
      renderAdmin();
      return;
    }
  }

  function handleInput(event) {
    if (event.target.matches('[data-package-field], [data-rule-field]')) return;
    if (event.target.matches('[data-workflow-field]')) {
      state.workflow[event.target.dataset.workflowField] = event.target.value;
      persist();
    }
  }

  function renderAll() {
    renderOverview();
    renderApplicability();
    renderPackages();
    renderImport();
    renderCompare();
    renderStatistics();
    renderReview();
    renderAdmin();
    activateTab(activeTab);
  }

  function renderTab(tabName) {
    const renderers = {overview: renderOverview, applicability: renderApplicability, packages: renderPackages, import: renderImport, compare: renderCompare, statistics: renderStatistics, review: renderReview, admin: renderAdmin};
    if (renderers[tabName]) renderers[tabName]();
  }

  function renderOverview() {
    const panel = document.querySelector('[data-platform-panel="overview"]');
    if (!panel) return;
    const current = readCurrentEvidence();
    const derived = Engine.calculateDerived(current.actuals, readScope());
    const evaluation = coreEvaluation();
    const gaps = evaluation.rows.filter(row => ['fail', 'missing', 'review'].includes(row.status) || row.nearLimit);
    panel.innerHTML = `
      <div class="mc-overview-grid">
        <section class="mc-subcard"><h3>Current evidence snapshot</h3><p>Refresh after changing the main checker inputs.</p><div class="mc-kpi-grid" id="mcOverviewKpis"></div><div class="mc-actions"><button class="btn outline" type="button" data-mc-action="refreshOverview">Refresh analysis</button><button class="btn outline" type="button" data-mc-action="capturePackage">Capture current rules</button><button class="btn outline" type="button" data-mc-action="printReport">Engineering report</button></div></section>
        <section class="mc-subcard"><h3>Applicability status</h3><p id="mcApplicabilitySummary"></p><ul class="mc-rationale-list" id="mcOverviewRationale"></ul></section>
      </div>
      <div class="mc-overview-grid">
        <section class="mc-subcard"><h3>Automatic derived calculations</h3><p>Calculated from the current controlled property inputs. Missing inputs are shown explicitly.</p><ul class="mc-derived-list" id="mcDerived"></ul></section>
        <section class="mc-subcard"><h3>Requirement gaps and near-limit results</h3><p>Prioritized exceptions from the current manually entered requirements.</p><ul class="mc-gap-list" id="mcGaps"></ul></section>
      </div>`;
    document.getElementById('mcOverviewKpis').innerHTML = [
      ['Overall', evaluation.status, evaluation.message],
      ['Coverage', evaluation.coverage + '%', evaluation.assessed + ' of ' + evaluation.applicable],
      ['Rule packages', state.packages.length, state.packages.filter(item => item.status === 'Approved').length + ' approved'],
      ['Batch records', state.batch.records.length, state.batch.sourceName || 'No import']
    ].map(item => `<div class="mc-kpi"><span>${esc(item[0])}</span><strong>${esc(item[1])}</strong><small>${esc(item[2])}</small></div>`).join('');
    renderDerived(derived);
    renderGaps(gaps);
    renderOverviewApplicability();
  }

  function renderDerived(derived) {
    const target = document.getElementById('mcDerived');
    if (!target) return;
    const rows = [
      ['Carbon equivalent — CEIIW', derived.ceiiw], ['Carbon equivalent — Pcm', derived.pcm],
      ['Yield-to-tensile ratio', derived.ytRatio], ['Diameter/thickness ratio', derived.diameterThicknessRatio]
    ];
    target.innerHTML = rows.map(([label, item]) => `<li class="mc-derived-item ${item.ready ? 'is-ready' : 'is-missing'}"><strong>${esc(label)}</strong><span>${item.ready ? Engine.formatNumber(item.value) + ' ' + item.unit + '<br><small>' + esc(item.formula) + '</small>' : 'Missing: ' + esc(item.missing.join(', ') || 'required inputs')}</span></li>`).join('');
  }

  function renderGaps(gaps) {
    const target = document.getElementById('mcGaps');
    if (!target) return;
    if (!gaps.length) {
      target.innerHTML = '<li class="mc-gap-item"><strong>No unresolved gaps</strong><span>All configured current requirements are satisfied with no near-limit warning.</span></li>';
      return;
    }
    const priority = {fail: 0, missing: 1, review: 2, pass: 3};
    target.innerHTML = gaps.sort((left, right) => (priority[left.status] || 9) - (priority[right.status] || 9)).map(row => {
      const type = row.nearLimit && row.status === 'pass' ? 'near' : row.status;
      const margin = row.margin == null ? '' : ' Margin: ' + Engine.formatNumber(row.margin) + (row.relativeMarginPercent == null ? '' : ' (' + Engine.formatNumber(row.relativeMarginPercent, 1) + '%).');
      return `<li class="mc-gap-item is-${type}"><strong>${esc(row.label)} <span class="mc-badge ${esc(row.status)}">${esc(row.status)}</span></strong><span>${esc(row.detail + margin)}</span></li>`;
    }).join('');
  }

  function suggestedSections() {
    const app = state.applicability;
    const sections = new Set(['chemistry', 'mechanical', 'dimensions', 'process']);
    const reasons = [
      ['Chemistry', 'Material chemistry supports grade and weldability screening.'],
      ['Mechanical properties', 'Strength and ductility evidence are fundamental to material screening.'],
      ['Dimensions', 'Product dimensions determine applicability and tolerance compliance.'],
      ['Process / certification', 'Traceability and manufacturing evidence remain mandatory.']
    ];
    const temperature = Engine.toNumber(app.serviceTemperature);
    const temperatureC = temperature == null ? null : Engine.convert(temperature, app.temperatureUnit, '°C');
    if (app.productForm === 'Line pipe' || app.psl === 'PSL 2' || app.supplementaryCharpy || (temperatureC != null && temperatureC < 0)) {
      sections.add('charpy');
      reasons.push(['Charpy / toughness', 'Selected product/service conditions indicate toughness evidence should be reviewed.']);
    }
    if (app.sourService === 'Yes') reasons.push(['Sour service', 'Confirm hardness, chemistry, manufacturing route, and any customer or NACE/ISO requirements in the controlled package.']);
    if (app.hydrostatic) reasons.push(['Hydrostatic test', 'Hydrostatic evidence was selected as applicable.']);
    if (app.ndt) reasons.push(['Nondestructive testing', 'NDT evidence was selected as applicable.']);
    return {sections: Array.from(sections), reasons};
  }

  function renderApplicability() {
    const panel = document.querySelector('[data-platform-panel="applicability"]');
    if (!panel) return;
    const app = state.applicability;
    panel.innerHTML = `
      <section class="mc-subcard" data-lockable="true"><h3>Applicability wizard</h3><p>Use product and service conditions to activate the relevant evidence sections. This wizard does not create acceptance limits.</p>
        <div class="mc-grid">
          <label class="mc-field mc-span-3">Product form<select data-app="productForm"><option value="">Select</option>${['Coil','Plate','Line pipe','Tube','Structural shape','Bar','Forging','Other'].map(value => `<option${app.productForm === value ? ' selected' : ''}>${value}</option>`).join('')}</select></label>
          <label class="mc-field mc-span-3">Manufacturing route<select data-app="manufacturingRoute"><option value="">Select</option>${['Seamless','ERW/HFW','SAW','Spiral SAW','Hot formed','Cold formed','Rolled plate','Rolled coil','Forged','Other'].map(value => `<option${app.manufacturingRoute === value ? ' selected' : ''}>${value}</option>`).join('')}</select></label>
          <label class="mc-field mc-span-2">PSL / service level<select data-app="psl"><option value="">Not specified</option>${['PSL 1','PSL 2','Category I','Category II','Category III'].map(value => `<option${app.psl === value ? ' selected' : ''}>${value}</option>`).join('')}</select></label>
          <label class="mc-field mc-span-2">Sour service<select data-app="sourService">${['No','Yes','Unknown'].map(value => `<option${app.sourService === value ? ' selected' : ''}>${value}</option>`).join('')}</select></label>
          <label class="mc-field mc-span-2">Heat treatment<input data-app="heatTreatment" value="${esc(app.heatTreatment)}" placeholder="Normalized, Q&T, TMCP"></label>
          <label class="mc-field mc-span-3">Minimum service temperature<input type="number" step="any" data-app="serviceTemperature" value="${esc(app.serviceTemperature)}"></label>
          <label class="mc-field mc-span-2">Temperature unit<select data-app="temperatureUnit"><option${app.temperatureUnit === '°C' ? ' selected' : ''}>°C</option><option${app.temperatureUnit === '°F' ? ' selected' : ''}>°F</option></select></label>
          <label class="mc-check mc-span-2"><input type="checkbox" data-app="supplementaryCharpy"${app.supplementaryCharpy ? ' checked' : ''}><span>Supplementary Charpy requirement</span></label>
          <label class="mc-check mc-span-2"><input type="checkbox" data-app="hydrostatic"${app.hydrostatic ? ' checked' : ''}><span>Hydrostatic test applicable</span></label>
          <label class="mc-check mc-span-2"><input type="checkbox" data-app="ndt"${app.ndt ? ' checked' : ''}><span>NDT applicable</span></label>
          <label class="mc-field mc-span-12">Applicability notes<textarea rows="3" data-app="notes">${esc(app.notes)}</textarea></label>
        </div>
        <div class="mc-actions"><button class="btn primary" type="button" data-mc-action="applyApplicability">Apply suggested evidence scope</button></div>
      </section>
      <section class="mc-subcard"><h3>Suggested evidence and rationale</h3><p id="mcApplicabilitySummary"></p><ul class="mc-rationale-list" id="mcApplicabilityRationale"></ul></section>`;
    renderApplicabilityRationale();
  }

  function renderApplicabilityRationale() {
    const suggestion = suggestedSections();
    const summary = document.getElementById('mcApplicabilitySummary');
    const list = document.getElementById('mcApplicabilityRationale');
    if (summary) summary.textContent = suggestion.sections.length + ' evidence sections are recommended for the selected conditions.';
    if (list) list.innerHTML = suggestion.reasons.map(reason => `<li class="mc-rationale-item"><strong>${esc(reason[0])}</strong><span>${esc(reason[1])}</span></li>`).join('');
  }

  function renderOverviewApplicability() {
    const suggestion = suggestedSections();
    const summary = document.getElementById('mcApplicabilitySummary');
    const list = document.getElementById('mcOverviewRationale');
    if (summary) summary.textContent = suggestion.sections.join(', ') + '.';
    if (list) list.innerHTML = suggestion.reasons.slice(0, 5).map(reason => `<li class="mc-rationale-item"><strong>${esc(reason[0])}</strong><span>${esc(reason[1])}</span></li>`).join('');
  }

  function applyApplicability() {
    const suggestion = suggestedSections();
    const productForm = document.querySelector('[data-scope="productForm"]');
    if (productForm && state.applicability.productForm) {
      productForm.value = state.applicability.productForm;
      productForm.dispatchEvent(new Event('change', {bubbles: true}));
    }
    document.querySelectorAll('#selectors input[type="checkbox"]').forEach(input => {
      const shouldCheck = suggestion.sections.includes(input.value);
      if (input.checked !== shouldCheck) {
        input.checked = shouldCheck;
        input.dispatchEvent(new Event('change', {bubbles: true}));
      }
    });
    logAudit('Applicability scope applied', suggestion.sections.join(', '));
    setStatus('Suggested evidence sections were applied to the main workbench.', 'success');
    renderOverview();
  }

  function blankPackage() {
    return {
      id: uid('package'), name: 'New rule package', organization: '', standard: '', grade: '', edition: '',
      status: 'Draft', owner: currentActor(), lastVerified: '', notes: '',
      applicability: {productForms: [], manufacturingRoutes: [], psl: [], thicknessMin: '', thicknessMax: '', thicknessUnit: 'mm'},
      rules: []
    };
  }

  function selectedPackage() {
    return state.packages.find(item => item.id === state.selectedPackageId) || null;
  }

  function renderPackages() {
    const panel = document.querySelector('[data-platform-panel="packages"]');
    if (!panel) return;
    if (!state.selectedPackageId && state.packages.length) state.selectedPackageId = state.packages[0].id;
    const pkg = selectedPackage();
    const editable = hasRole('Standards administrator');
    panel.innerHTML = `
      <section class="mc-subcard mc-rule-editor" data-lockable="true"><h3>Versioned rule packages</h3><p>Packages store user-verified requirements, applicability, edition, and clause traceability. Only approved packages should support final release decisions.</p>
        <div class="mc-rule-toolbar"><label class="mc-field">Rule package<select id="mcPackageSelect"><option value="">No package selected</option>${state.packages.map(item => `<option value="${item.id}"${item.id === state.selectedPackageId ? ' selected' : ''}>${esc(item.name)} — ${esc(item.status)}</option>`).join('')}</select></label><div class="mc-actions"><button class="btn outline" type="button" data-mc-action="newPackage">New blank</button><button class="btn outline" type="button" data-mc-action="capturePackage">Capture current rules</button><button class="btn outline" type="button" data-mc-action="duplicatePackage"${pkg ? '' : ' disabled'}>Duplicate</button><button class="btn danger" type="button" data-mc-action="deletePackage"${pkg ? '' : ' disabled'}>Delete</button></div></div>
        ${editable ? '' : '<p class="mc-package-warning">Package editing requires the Standards administrator role. You can still inspect and use approved packages.</p>'}
        <div id="mcPackageEditor">${pkg ? packageEditorHTML(pkg, editable) : '<div class="empty">Create or capture a package to begin.</div>'}</div>
        <input id="mcPackageImport" type="file" accept="application/json,.json" hidden>
      </section>
      <section class="mc-subcard"><h3>Reusable assessment templates</h3><p>Templates save the scope, selected evidence sections, and requirement-row structure without storing actual results.</p><div class="mc-rule-toolbar"><label class="mc-field">Template<select id="mcTemplateSelect"><option value="">Select a template</option>${state.templates.map(item => `<option value="${item.id}">${esc(item.name)}</option>`).join('')}</select></label><div class="mc-actions"><button class="btn outline" type="button" data-mc-action="captureTemplate">Save current as template</button><button class="btn outline" type="button" data-mc-action="applyTemplate">Apply selected</button><button class="btn danger" type="button" data-mc-action="deleteTemplate">Delete selected</button></div></div></section>`;
    bindPackageImport();
  }

  function packageEditorHTML(pkg, editable) {
    const app = pkg.applicability || {};
    return `<div class="mc-package-card">
      <div class="mc-package-meta">
        ${packageField('Name','name',pkg.name,editable)}${packageField('Organization','organization',pkg.organization,editable)}${packageField('Standard','standard',pkg.standard,editable)}${packageField('Grade / class','grade',pkg.grade,editable)}
        ${packageField('Edition / revision','edition',pkg.edition,editable)}${packageSelectField('Status','status',STATUS_OPTIONS,pkg.status,editable)}${packageField('Package owner','owner',pkg.owner,editable)}${packageField('Last verified','lastVerified',pkg.lastVerified,editable,'date')}
        ${packageField('Product forms, comma separated','productForms',(app.productForms || []).join(', '),editable)}${packageField('Manufacturing routes','manufacturingRoutes',(app.manufacturingRoutes || []).join(', '),editable)}${packageField('PSL / categories','psl',(app.psl || []).join(', '),editable)}${packageSelectField('Thickness unit','thicknessUnit',['mm','in'],app.thicknessUnit || 'mm',editable)}
        ${packageField('Minimum thickness','thicknessMin',app.thicknessMin || '',editable,'number')}${packageField('Maximum thickness','thicknessMax',app.thicknessMax || '',editable,'number')}
        <label class="mc-field mc-span-6">Package notes<textarea data-package-field="notes" rows="3"${editable ? '' : ' disabled'}>${esc(pkg.notes || '')}</textarea></label>
      </div>
      <div class="mc-table-wrap"><table class="mc-table mc-rule-table"><thead><tr><th>Category</th><th>Property / evidence</th><th>Minimum</th><th>Maximum</th><th>Unit</th><th>Mandatory</th><th>Clause</th><th>Table</th><th>Footnote / condition</th><th>Actions</th></tr></thead><tbody id="mcRuleRows">${(pkg.rules || []).map(rule => ruleRowHTML(rule, editable)).join('') || '<tr><td colspan="10" class="empty">No rules configured.</td></tr>'}</tbody></table></div>
      <div class="mc-actions"><button class="btn outline" type="button" data-mc-action="addRule"${editable ? '' : ' disabled'}>Add rule</button><button class="btn primary" type="button" data-mc-action="savePackage"${editable ? '' : ' disabled'}>Save package</button><button class="btn outline" type="button" data-mc-action="exportPackage"${pkg ? '' : ' disabled'}>Export package</button><button class="btn outline" type="button" data-mc-action="importPackageClick"${editable ? '' : ' disabled'}>Import package</button></div>
    </div>`;
  }

  function packageField(label, key, value, editable, type) {
    return `<label class="mc-field">${esc(label)}<input type="${type || 'text'}" step="any" data-package-field="${key}" value="${esc(value)}"${editable ? '' : ' disabled'}></label>`;
  }

  function packageSelectField(label, key, values, selected, editable) {
    return `<label class="mc-field">${esc(label)}<select data-package-field="${key}"${editable ? '' : ' disabled'}>${values.map(value => `<option${value === selected ? ' selected' : ''}>${esc(value)}</option>`).join('')}</select></label>`;
  }

  function ruleRowHTML(rule, editable) {
    const category = rule.category || 'chemistry';
    const properties = propertyCatalog(category);
    const property = properties.find(item => item.code === rule.propertyCode) || propertyByCode(rule.propertyCode);
    const units = property?.units || (rule.type === 'evidence' ? ['evidence'] : ['%', 'MPa', 'ksi', 'J', 'ft-lb', 'mm', 'in', 'ratio']);
    return `<tr data-rule-id="${esc(rule.id || uid('rule'))}">
      <td><select data-rule-field="category"${editable ? '' : ' disabled'}>${['chemistry','mechanical','charpy','dimensions','process'].map(value => `<option value="${value}"${value === category ? ' selected' : ''}>${esc(value)}</option>`).join('')}</select></td>
      <td><select data-rule-field="propertyCode"${editable ? '' : ' disabled'}><option value="">Select property</option>${properties.map(item => `<option value="${item.code}"${item.code === rule.propertyCode ? ' selected' : ''}>${esc(item.label)}</option>`).join('')}</select></td>
      <td><input type="number" step="any" data-rule-field="min" value="${esc(rule.min || '')}"${editable || rule.type !== 'evidence' ? '' : ' disabled'}${category === 'process' ? ' disabled' : ''}></td>
      <td><input type="number" step="any" data-rule-field="max" value="${esc(rule.max || '')}"${category === 'process' ? ' disabled' : ''}${editable ? '' : ' disabled'}></td>
      <td><select data-rule-field="unit"${category === 'process' ? ' disabled' : ''}${editable ? '' : ' disabled'}>${units.map(unit => `<option${unit === rule.unit ? ' selected' : ''}>${esc(unit)}</option>`).join('')}</select></td>
      <td><input type="checkbox" data-rule-field="mandatory"${rule.mandatory !== false ? ' checked' : ''}${editable ? '' : ' disabled'}></td>
      <td><input data-rule-field="clause" value="${esc(rule.clause || '')}"${editable ? '' : ' disabled'}></td>
      <td><input data-rule-field="table" value="${esc(rule.table || '')}"${editable ? '' : ' disabled'}></td>
      <td><input data-rule-field="footnote" value="${esc(rule.footnote || '')}"${editable ? '' : ' disabled'}></td>
      <td class="mc-row-actions"><button class="btn danger" type="button" data-remove-rule${editable ? '' : ' disabled'}>Remove</button></td>
    </tr>`;
  }

  function updateRulePropertyOptions(row) {
    if (!row) return;
    const category = row.querySelector('[data-rule-field="category"]').value;
    const select = row.querySelector('[data-rule-field="propertyCode"]');
    select.innerHTML = '<option value="">Select property</option>' + propertyCatalog(category).map(item => `<option value="${item.code}">${esc(item.label)}</option>`).join('');
    const min = row.querySelector('[data-rule-field="min"]');
    const max = row.querySelector('[data-rule-field="max"]');
    const unit = row.querySelector('[data-rule-field="unit"]');
    const isEvidence = category === 'process';
    min.disabled = max.disabled = unit.disabled = isEvidence;
    if (isEvidence) { min.value = ''; max.value = ''; unit.innerHTML = '<option>evidence</option>'; }
  }

  function newPackage() {
    if (!hasRole('Standards administrator')) return setStatus('Standards administrator permission is required.', 'error');
    const pkg = blankPackage();
    state.packages.push(pkg);
    state.selectedPackageId = pkg.id;
    persist();
    logAudit('Rule package created', pkg.name);
    renderPackages(); renderCompare(); renderImport();
  }

  function captureCurrentAsPackage() {
    if (!hasRole('Standards administrator')) return setStatus('Standards administrator permission is required to create packages.', 'error');
    const name = prompt('Name the captured package:', currentManualPackage().name);
    if (!name) return;
    const pkg = currentManualPackage(name.trim());
    state.packages.push(pkg);
    state.selectedPackageId = pkg.id;
    persist();
    logAudit('Current rules captured as package', pkg.name);
    setStatus('Current requirements were captured as a draft package.', 'success');
    renderPackages(); renderCompare(); renderImport();
  }

  function duplicatePackage() {
    if (!hasRole('Standards administrator')) return setStatus('Standards administrator permission is required.', 'error');
    const pkg = selectedPackage();
    if (!pkg) return;
    const copy = JSON.parse(JSON.stringify(pkg));
    copy.id = uid('package'); copy.name += ' — Copy'; copy.status = 'Draft';
    copy.rules.forEach(rule => { rule.id = uid('rule'); });
    state.packages.push(copy); state.selectedPackageId = copy.id; persist();
    logAudit('Rule package duplicated', copy.name); renderPackages(); renderCompare(); renderImport();
  }

  function deletePackage() {
    if (!hasRole('Standards administrator')) return setStatus('Standards administrator permission is required.', 'error');
    const pkg = selectedPackage();
    if (!pkg || !confirm('Delete “' + pkg.name + '”?')) return;
    state.packages = state.packages.filter(item => item.id !== pkg.id);
    state.selectedPackageId = state.packages[0]?.id || '';
    persist(); logAudit('Rule package deleted', pkg.name); renderPackages(); renderCompare(); renderImport();
  }

  function addRule() {
    if (!hasRole('Standards administrator')) return;
    const tbody = document.getElementById('mcRuleRows');
    if (!tbody) return;
    if (tbody.querySelector('.empty')) tbody.innerHTML = '';
    tbody.insertAdjacentHTML('beforeend', ruleRowHTML({id: uid('rule'), category: 'chemistry', propertyCode: '', min: '', max: '', unit: '%', mandatory: true}, true));
  }

  function savePackageEditor() {
    if (!hasRole('Standards administrator')) return setStatus('Standards administrator permission is required.', 'error');
    const pkg = selectedPackage();
    if (!pkg) return;
    document.querySelectorAll('[data-package-field]').forEach(field => {
      const key = field.dataset.packageField;
      if (['productForms','manufacturingRoutes','psl','thicknessMin','thicknessMax','thicknessUnit'].includes(key)) {
        pkg.applicability = pkg.applicability || {};
        pkg.applicability[key] = ['productForms','manufacturingRoutes','psl'].includes(key) ? field.value.split(',').map(item => item.trim()).filter(Boolean) : field.value;
      } else pkg[key] = field.value;
    });
    pkg.rules = Array.from(document.querySelectorAll('#mcRuleRows tr[data-rule-id]')).map(row => {
      const values = {};
      row.querySelectorAll('[data-rule-field]').forEach(field => { values[field.dataset.ruleField] = field.type === 'checkbox' ? field.checked : field.value; });
      const property = propertyByCode(values.propertyCode);
      return {
        id: row.dataset.ruleId, type: values.category === 'process' ? 'evidence' : 'quantitative', category: values.category,
        propertyCode: values.propertyCode, label: property?.label || values.propertyCode, min: values.min, max: values.max,
        unit: values.category === 'process' ? 'evidence' : values.unit, mandatory: values.mandatory,
        clause: values.clause, table: values.table, footnote: values.footnote, nearLimitPercent: 5
      };
    }).filter(rule => rule.propertyCode);
    if (!pkg.name.trim() || !pkg.standard.trim() || !pkg.edition.trim()) return setStatus('Package name, standard, and edition are required.', 'error');
    if (pkg.status === 'Approved' && (!pkg.lastVerified || !pkg.rules.length)) return setStatus('Approved packages require a verification date and at least one rule.', 'error');
    persist(); logAudit('Rule package saved', pkg.name + ' (' + pkg.status + ')');
    setStatus('Rule package saved.', 'success'); renderPackages(); renderCompare(); renderImport();
  }

  function exportPackage() {
    const pkg = selectedPackage();
    if (!pkg) return;
    downloadJSON(pkg, Engine.slug(pkg.name) + '-rule-package.json');
    logAudit('Rule package exported', pkg.name);
  }

  function bindPackageImport() {
    const input = document.getElementById('mcPackageImport');
    if (!input) return;
    input.onchange = async event => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const pkg = JSON.parse(await file.text());
        if (!pkg || !pkg.name || !Array.isArray(pkg.rules)) throw new Error('Invalid rule-package structure.');
        pkg.id = uid('package'); pkg.status = 'Draft'; pkg.rules.forEach(rule => { rule.id = uid('rule'); });
        state.packages.push(pkg); state.selectedPackageId = pkg.id; persist();
        logAudit('Rule package imported', pkg.name); setStatus('Package imported as Draft.', 'success');
        renderPackages(); renderCompare(); renderImport();
      } catch (error) { setStatus('Unable to import package: ' + error.message, 'error'); }
      event.target.value = '';
    };
  }

  function captureTemplate() {
    const name = prompt('Template name:', [readScope().targetStandard, readScope().targetGrade].filter(Boolean).join(' ') || 'Material assessment template');
    if (!name) return;
    const template = {
      id: uid('template'), name: name.trim(), createdAt: new Date().toISOString(),
      scope: readScope(), selectedSections: Array.from(document.querySelectorAll('#selectors input:checked')).map(input => input.value), rows: captureCoreRows()
    };
    state.templates.push(template); persist(); logAudit('Assessment template saved', template.name); renderPackages();
    setStatus('Template saved without actual results.', 'success');
  }

  async function applyTemplate() {
    const id = document.getElementById('mcTemplateSelect')?.value;
    const template = state.templates.find(item => item.id === id);
    if (!template) return setStatus('Select a template first.', 'error');
    if (state.workflow.locked) return setStatus('Unlock the approved assessment before applying a template.', 'error');
    Object.entries(template.scope || {}).forEach(([key, value]) => {
      const input = document.querySelector('[data-scope="' + key + '"]');
      if (input) { input.value = value == null ? '' : value; input.dispatchEvent(new Event('change', {bubbles: true})); }
    });
    document.querySelectorAll('#selectors input').forEach(input => {
      const checked = template.selectedSections.includes(input.value);
      if (input.checked !== checked) { input.checked = checked; input.dispatchEvent(new Event('change', {bubbles: true})); }
    });
    await nextFrame(120);
    for (const section of ['chemistry','mechanical','charpy','dimensions','process']) await applyTemplateSection(section, template.rows[section] || []);
    logAudit('Assessment template applied', template.name); setStatus('Template applied. Actual results were not populated.', 'success');
    renderOverview();
  }

  async function applyTemplateSection(section, rows) {
    let guard = 0;
    while (document.querySelector('#panels [data-sec="' + section + '"] [data-remove]') && guard < 100) {
      document.querySelector('#panels [data-sec="' + section + '"] [data-remove]').click();
      guard += 1; await nextFrame();
    }
    for (const raw of rows) {
      const add = document.querySelector('#panels [data-add="' + section + '"]');
      if (!add) continue;
      add.click(); await nextFrame(90);
      const sectionRows = document.querySelectorAll('#panels [data-sec="' + section + '"]');
      const row = sectionRows[sectionRows.length - 1];
      if (!row) continue;
      await nextFrame(70);
      const propertySelect = row.querySelector('select[data-property-select]');
      if (propertySelect && raw.propertyCode) { propertySelect.value = raw.propertyCode; propertySelect.dispatchEvent(new Event('change', {bubbles: true})); await nextFrame(); }
      Object.entries(raw).forEach(([key, value]) => {
        if (key === 'propertyCode') return;
        const field = row.querySelector('[data-f="' + key + '"]');
        if (!field) return;
        if (field.type === 'checkbox') field.checked = Boolean(value); else field.value = value == null ? '' : value;
        field.dispatchEvent(new Event('change', {bubbles: true}));
      });
    }
  }

  function deleteTemplate() {
    const id = document.getElementById('mcTemplateSelect')?.value;
    const template = state.templates.find(item => item.id === id);
    if (!template || !confirm('Delete “' + template.name + '”?')) return;
    state.templates = state.templates.filter(item => item.id !== id); persist(); logAudit('Assessment template deleted', template.name); renderPackages();
  }

  function renderImport() {
    const panel = document.querySelector('[data-platform-panel="import"]');
    if (!panel) return;
    panel.innerHTML = `
      <section class="mc-subcard" data-lockable="true"><h3>MTR, laboratory, and production-data import</h3><p>Import CSV, Excel, JSON, or text-based PDF files. Every detected field remains in a confirmation table before assessment.</p>
        <div class="mc-dropzone" id="mcDropzone"><div><strong>Drop a file here or select one</strong><p class="mc-muted">CSV, XLSX, XLS, JSON, or PDF. OCR/image-only PDFs require manual verification.</p><input id="mcDataFile" type="file" accept=".csv,.xlsx,.xls,.json,.pdf,application/json,text/csv,application/pdf"></div></div>
        <p class="mc-status" id="mcImportStatus">${state.batch.sourceName ? 'Loaded: ' + esc(state.batch.sourceName) + ' — ' + state.batch.records.length + ' record(s).' : ''}</p>
      </section>
      <section class="mc-subcard"><h3>Field-mapping confirmation</h3><p>Review every mapping and unit before running the batch. Low-confidence mappings are never silently accepted.</p><div class="mc-table-wrap"><table class="mc-table"><thead><tr><th>Source field</th><th>Sample</th><th>Canonical field</th><th>Unit</th><th>Confidence</th></tr></thead><tbody id="mcMappingRows"></tbody></table></div></section>
      <section class="mc-subcard"><h3>Batch assessment</h3><div class="mc-rule-toolbar"><label class="mc-field">Target rule package<select id="mcBatchPackageSelect"><option value="">Select package</option>${state.packages.map(item => `<option value="${item.id}"${item.id === state.batch.selectedPackageId ? ' selected' : ''}>${esc(item.name)} — ${esc(item.status)}</option>`).join('')}</select></label><div class="mc-actions"><button class="btn primary" type="button" data-mc-action="runBatch">Run batch assessment</button></div></div><div id="mcBatchSummary"></div><div id="mcBatchResults"></div></section>`;
    bindDataImport(); renderMapping(); renderBatchResults();
  }

  function bindDataImport() {
    const input = document.getElementById('mcDataFile');
    const dropzone = document.getElementById('mcDropzone');
    if (!input || !dropzone) return;
    input.onchange = event => { if (event.target.files[0]) importDataFile(event.target.files[0]); };
    ['dragenter','dragover'].forEach(name => dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.add('is-dragover'); }));
    ['dragleave','drop'].forEach(name => dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.remove('is-dragover'); }));
    dropzone.addEventListener('drop', event => { if (event.dataTransfer.files[0]) importDataFile(event.dataTransfer.files[0]); });
  }

  async function importDataFile(file) {
    try {
      setStatus('Reading ' + file.name + '…');
      const extension = file.name.split('.').pop().toLowerCase();
      let records = [];
      if (extension === 'csv') records = Engine.parseCSV(await file.text());
      else if (extension === 'json') {
        const parsed = JSON.parse(await file.text());
        records = Array.isArray(parsed) ? parsed : Array.isArray(parsed.records) ? parsed.records : [parsed];
      } else if (extension === 'xlsx' || extension === 'xls') {
        if (!window.XLSX) throw new Error('Excel parser is unavailable. Reload the page and try again.');
        const workbook = window.XLSX.read(await file.arrayBuffer(), {type: 'array'});
        records = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {defval: ''});
      } else if (extension === 'pdf') records = [await extractPDFRecord(file)];
      else throw new Error('Unsupported file type.');
      if (!records.length) throw new Error('No records were detected.');
      state.batch.sourceName = file.name;
      state.batch.records = records;
      state.batch.mapping = buildMapping(records);
      state.batch.results = [];
      persist(); logAudit('Data imported', file.name + ' — ' + records.length + ' record(s)');
      renderImport(); setStatus('File imported. Confirm all mappings before assessment.', 'success');
    } catch (error) { setStatus('Import failed: ' + error.message, 'error'); }
  }

  async function extractPDFRecord(file) {
    if (!window.pdfjsLib) throw new Error('PDF text extraction is unavailable. Image-only PDFs must be entered manually.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({data: await file.arrayBuffer()}).promise;
    let text = '';
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      text += '\n' + content.items.map(item => item.str).join(' ');
    }
    const record = {'PDF Source': file.name};
    const patterns = [
      ['Heat Number', /\b(?:heat(?:\s*(?:number|no\.?))?)\s*[:#-]?\s*([A-Z0-9-]{4,})/i],
      ['Material ID', /\b(?:coil|plate|pipe|material)(?:\s*(?:id|number|no\.?))?\s*[:#-]?\s*([A-Z0-9-]{4,})/i],
      ['Carbon', /\b(?:C|Carbon)\s*[:=]?\s*(0?\.\d{2,5})\b/i],
      ['Manganese', /\b(?:Mn|Manganese)\s*[:=]?\s*(\d?\.\d{2,4})\b/i],
      ['Phosphorus', /\b(?:P|Phosphorus)\s*[:=]?\s*(0?\.\d{2,5})\b/i],
      ['Sulfur', /\b(?:S|Sulphur|Sulfur)\s*[:=]?\s*(0?\.\d{2,5})\b/i],
      ['Yield Strength', /\b(?:YS|Yield\s*Strength)\s*[:=]?\s*(\d{2,4}(?:\.\d+)?)/i],
      ['Tensile Strength', /\b(?:UTS|TS|Tensile\s*Strength)\s*[:=]?\s*(\d{2,4}(?:\.\d+)?)/i],
      ['Elongation', /\b(?:Elongation|Elong)\s*[:=]?\s*(\d{1,3}(?:\.\d+)?)/i],
      ['Charpy Average', /\b(?:CVN|Charpy)(?:\s*Average|\s*Avg)?\s*[:=]?\s*(\d{1,4}(?:\.\d+)?)/i]
    ];
    patterns.forEach(([header, regex]) => { const match = text.match(regex); if (match) record[header] = match[1]; });
    record['PDF Extracted Text'] = text.slice(0, 12000);
    return record;
  }

  function buildMapping(records) {
    const headers = Array.from(new Set(records.flatMap(record => Object.keys(record))));
    return headers.map(header => {
      const mapped = Engine.mapHeader(header, Config, state.aliases);
      const property = propertyByCode(mapped.code);
      return {header, code: mapped.code, unit: property?.defaultUnit || property?.units?.[0] || '', confidence: mapped.confidence, source: mapped.source};
    });
  }

  function mappingOptions(selected) {
    const fixed = [['','Ignore'],['materialId','Material ID'],['heatNumber','Heat number'],['productForm','Product form'],['thickness','Nominal thickness'],['width','Width / OD']];
    const groups = fixed.map(item => `<option value="${item[0]}"${item[0] === selected ? ' selected' : ''}>${item[1]}</option>`).join('');
    return groups + ['chemistry','mechanical','charpy','dimensions','process'].map(category => `<optgroup label="${esc(category)}">${propertyCatalog(category).map(item => `<option value="${item.code}"${item.code === selected ? ' selected' : ''}>${esc(item.label)}</option>`).join('')}</optgroup>`).join('');
  }

  function renderMapping() {
    const tbody = document.getElementById('mcMappingRows');
    if (!tbody) return;
    if (!state.batch.mapping.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Import a file to create the mapping review.</td></tr>'; return; }
    const sample = state.batch.records[0] || {};
    tbody.innerHTML = state.batch.mapping.map((mapping, index) => {
      const level = mapping.confidence >= .9 ? 'high' : mapping.confidence >= .6 ? 'medium' : 'low';
      const property = propertyByCode(mapping.code);
      const units = property?.units || ['', '%','ppm','MPa','ksi','J','ft-lb','mm','in','ratio'];
      return `<tr><td>${esc(mapping.header)}</td><td>${esc(String(sample[mapping.header] ?? '').slice(0, 80))}</td><td><select data-map-index="${index}" data-map-field="code">${mappingOptions(mapping.code)}</select></td><td><select data-map-index="${index}" data-map-field="unit">${Array.from(new Set([''].concat(units))).map(unit => `<option${unit === mapping.unit ? ' selected' : ''}>${esc(unit || 'Not applicable')}</option>`).join('')}</select></td><td><span class="mc-confidence ${level}">${Math.round(mapping.confidence * 100)}%</span><br><small>${esc(mapping.source)}</small></td></tr>`;
    }).join('');
  }

  function updateMappingFromUI() {
    document.querySelectorAll('[data-map-index]').forEach(field => {
      const mapping = state.batch.mapping[Number(field.dataset.mapIndex)];
      if (mapping) mapping[field.dataset.mapField] = field.value === 'Not applicable' ? '' : field.value;
    });
    persist();
  }

  function mapImportedRecord(record) {
    const scope = {};
    const actuals = {};
    const evidence = {};
    state.batch.mapping.forEach(mapping => {
      if (!mapping.code) return;
      const value = record[mapping.header];
      if (['materialId','heatNumber','productForm','thickness','width'].includes(mapping.code)) scope[mapping.code] = value;
      else if (mapping.code.startsWith('proc_')) evidence[mapping.code] = String(value).toLowerCase() === 'yes' || value === true ? 'yes' : String(value).toLowerCase() === 'no' || value === false ? 'no' : 'unknown';
      else actuals[mapping.code] = {value, unit: mapping.unit};
    });
    scope.thicknessUnit = 'mm'; scope.widthUnit = 'mm';
    return {id: scope.materialId || scope.heatNumber || uid('record'), scope, actuals, evidence, raw: record};
  }

  function runBatch() {
    updateMappingFromUI();
    const packageId = document.getElementById('mcBatchPackageSelect')?.value;
    const pkg = state.packages.find(item => item.id === packageId);
    if (!pkg) return setStatus('Select a target rule package.', 'error');
    if (!state.batch.records.length) return setStatus('Import at least one record.', 'error');
    const lowConfidence = state.batch.mapping.filter(item => item.code && item.confidence < .6);
    if (lowConfidence.length && !confirm(lowConfidence.length + ' low-confidence mapping(s) remain. Continue only after manual verification?')) return;
    state.batch.selectedPackageId = packageId;
    state.batch.results = state.batch.records.map(record => {
      const mapped = mapImportedRecord(record);
      return {id: mapped.id, raw: record, mapped, result: Engine.evaluatePackage(pkg, mapped.actuals, mapped.evidence, mapped.scope)};
    });
    persist(); logAudit('Batch assessment completed', pkg.name + ' — ' + state.batch.results.length + ' records');
    renderBatchResults(); renderOverview(); renderStatistics();
    setStatus('Batch assessment completed.', 'success');
  }

  function renderBatchResults() {
    const summaryTarget = document.getElementById('mcBatchSummary');
    const resultTarget = document.getElementById('mcBatchResults');
    if (!summaryTarget || !resultTarget) return;
    if (!state.batch.results.length) { summaryTarget.innerHTML = ''; resultTarget.innerHTML = '<div class="empty">No batch results.</div>'; return; }
    const summary = Engine.summarizeBatch(state.batch.results);
    summaryTarget.innerHTML = `<div class="mc-kpi-grid" style="margin:16px 0"><div class="mc-kpi"><span>Records</span><strong>${summary.total}</strong></div><div class="mc-kpi"><span>Pass rate</span><strong>${Engine.formatNumber(summary.passRate,1)}%</strong></div><div class="mc-kpi"><span>Failed</span><strong>${summary.counts.fail || 0}</strong></div><div class="mc-kpi"><span>Conditional</span><strong>${summary.counts.conditional || 0}</strong></div></div><h4>Exception Pareto</h4><div class="mc-pareto">${summary.pareto.slice(0, 10).map(item => `<div class="mc-pareto-row"><span>${esc(item.label)}</span><div class="mc-pareto-track"><span style="width:${summary.pareto[0] ? item.count / summary.pareto[0].count * 100 : 0}%"></span></div><strong>${item.count}</strong></div>`).join('') || '<p class="mc-muted">No exceptions.</p>'}</div>`;
    resultTarget.innerHTML = `<div class="mc-table-wrap" style="margin-top:16px"><table class="mc-table"><thead><tr><th>Record</th><th>Result</th><th>Coverage</th><th>Failed</th><th>Missing/review</th><th>Key exception</th></tr></thead><tbody>${state.batch.results.map(record => `<tr><td>${esc(record.id)}</td><td><span class="mc-badge ${esc(record.result.status)}">${esc(record.result.status)}</span></td><td>${record.result.coverage}%</td><td>${record.result.counts.fail || 0}</td><td>${(record.result.counts.missing || 0) + (record.result.counts.review || 0)}</td><td>${esc(record.result.rows.find(row => row.status === 'fail' || row.status === 'missing' || row.status === 'review')?.label || 'None')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderCompare() {
    const panel = document.querySelector('[data-platform-panel="compare"]');
    if (!panel) return;
    panel.innerHTML = `<section class="mc-subcard"><h3>Multi-specification compatibility screening</h3><p>Compare the current material evidence against multiple user-verified packages. This is compatibility screening, not certification or automatic equivalency.</p><div class="mc-check-grid">${state.packages.map(pkg => `<label class="mc-check"><input type="checkbox" data-compare-package value="${pkg.id}"${state.comparisonPackageIds.includes(pkg.id) ? ' checked' : ''}><span><strong>${esc(pkg.name)}</strong><br><small>${esc(pkg.status)} — ${esc(pkg.edition || 'edition not recorded')}</small></span></label>`).join('') || '<div class="empty mc-span-12">Create or capture rule packages first.</div>'}</div><div class="mc-actions" style="margin-top:14px"><button class="btn primary" type="button" data-mc-action="runComparison">Run comparison</button></div><div id="mcComparisonResults"></div></section>`;
  }

  function runComparison() {
    const ids = Array.from(document.querySelectorAll('[data-compare-package]:checked')).map(input => input.value);
    if (!ids.length) return setStatus('Select at least one package.', 'error');
    state.comparisonPackageIds = ids; persist();
    const current = readCurrentEvidence();
    const scope = readScope();
    const comparisons = ids.map(id => {
      const pkg = state.packages.find(item => item.id === id);
      return {pkg, result: Engine.evaluatePackage(pkg, current.actuals, current.evidence, scope)};
    }).filter(item => item.pkg);
    const union = [];
    comparisons.forEach(item => item.result.rows.forEach(row => { if (!union.includes(row.label)) union.push(row.label); }));
    const target = document.getElementById('mcComparisonResults');
    target.innerHTML = `<div class="mc-table-wrap" style="margin-top:16px"><table class="mc-table mc-matrix"><thead><tr><th>Requirement</th>${comparisons.map(item => `<th>${esc(item.pkg.name)}</th>`).join('')}</tr></thead><tbody><tr><td><strong>Final screening result</strong></td>${comparisons.map(item => `<td><span class="mc-badge ${esc(item.result.status)}">${esc(item.result.status)}</span><br><small>${item.result.coverage}% coverage</small></td>`).join('')}</tr>${union.map(label => `<tr><td>${esc(label)}</td>${comparisons.map(item => { const row = item.result.rows.find(candidate => candidate.label === label); return `<td>${row ? `<span class="mc-badge ${esc(row.status)}">${esc(row.status)}</span><br><small>${esc(row.actual)}</small>` : '<span class="mc-badge not-applicable">N/A</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
    logAudit('Multi-specification comparison completed', comparisons.map(item => item.pkg.name).join('; '));
    setStatus('Comparison matrix generated.', 'success');
  }

  function renderStatistics() {
    const panel = document.querySelector('[data-platform-panel="statistics"]');
    if (!panel) return;
    const mappedCodes = Array.from(new Set(state.batch.mapping.map(item => item.code).filter(code => code && propertyByCode(code) && code !== 'materialId')));
    panel.innerHTML = `<section class="mc-subcard"><h3>Batch statistics and capability</h3><p>Capability is calculated only from numeric imported records. Confirm that rows represent independent experimental or production units; repeated tests can overweight a heat or coil.</p><div class="mc-grid"><label class="mc-field mc-span-4">Property<select id="mcStatsProperty"><option value="">Select property</option>${mappedCodes.map(code => `<option value="${code}">${esc(propertyByCode(code)?.label || code)}</option>`).join('')}</select></label><label class="mc-field mc-span-2">LSL<input id="mcStatsLSL" type="number" step="any"></label><label class="mc-field mc-span-2">USL<input id="mcStatsUSL" type="number" step="any"></label><div class="mc-actions mc-span-4"><button class="btn primary" type="button" data-mc-action="computeStatistics">Calculate statistics</button></div></div><div id="mcStatsSummary"></div><div class="mc-chart-grid" style="margin-top:16px"><canvas class="mc-chart" id="mcHistogram" width="700" height="270" aria-label="Histogram of selected batch property"></canvas><canvas class="mc-chart" id="mcIndividuals" width="700" height="270" aria-label="Individuals chart of selected batch property"></canvas></div></section>`;
  }

  function computeStatistics() {
    const code = document.getElementById('mcStatsProperty')?.value;
    if (!code) return setStatus('Select a numeric batch property.', 'error');
    const values = state.batch.records.map(record => mapImportedRecord(record).actuals[code]?.value).map(Engine.toNumber).filter(value => value != null);
    if (!values.length) return setStatus('No numeric values were found for the selected property.', 'error');
    const result = Engine.capability(values, document.getElementById('mcStatsLSL').value, document.getElementById('mcStatsUSL').value);
    document.getElementById('mcStatsSummary').innerHTML = `<div class="mc-kpi-grid" style="margin-top:16px">${[
      ['N',result.n],['Mean',Engine.formatNumber(result.mean)],['Std. dev.',Engine.formatNumber(result.standardDeviation)],['Median',Engine.formatNumber(result.median)],
      ['Minimum',Engine.formatNumber(result.min)],['Maximum',Engine.formatNumber(result.max)],['Cpk/Ppk',Engine.formatNumber(result.cpk)],['Pp',Engine.formatNumber(result.pp)]
    ].map(item => `<div class="mc-kpi"><span>${item[0]}</span><strong>${item[1]}</strong></div>`).join('')}</div>${result.caution ? `<p class="mc-package-warning" style="margin-top:12px">${esc(result.caution)} Also verify whether counts are at specimen, test, coil, or heat level.</p>` : ''}`;
    drawHistogram(document.getElementById('mcHistogram'), values);
    drawIndividuals(document.getElementById('mcIndividuals'), values, result.mean, result.standardDeviation);
    logAudit('Statistical capability calculated', (propertyByCode(code)?.label || code) + ' — n=' + result.n);
  }

  function canvasSetup(canvas) {
    const ctx = canvas.getContext('2d');
    const style = getComputedStyle(document.documentElement);
    return {ctx, ink: style.getPropertyValue('--ink').trim() || '#152238', line: style.getPropertyValue('--line').trim() || '#cbd5e1', teal: style.getPropertyValue('--teal').trim() || '#0e7490', fail: style.getPropertyValue('--mc-fail').trim() || '#b42318', card: style.getPropertyValue('--card').trim() || '#fff'};
  }

  function drawHistogram(canvas, values) {
    if (!canvas) return;
    const {ctx, ink, line, teal, card} = canvasSetup(canvas); const width = canvas.width; const height = canvas.height;
    ctx.clearRect(0,0,width,height); ctx.fillStyle = card; ctx.fillRect(0,0,width,height);
    const min = Math.min(...values), max = Math.max(...values), bins = Math.max(5, Math.min(12, Math.ceil(Math.sqrt(values.length))));
    const range = max - min || 1; const counts = Array(bins).fill(0);
    values.forEach(value => { const index = Math.min(bins - 1, Math.floor((value - min) / range * bins)); counts[index] += 1; });
    const left = 55, top = 24, bottom = 40, right = 18, chartW = width-left-right, chartH = height-top-bottom, maxCount = Math.max(...counts,1);
    ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(left,top); ctx.lineTo(left,height-bottom); ctx.lineTo(width-right,height-bottom); ctx.stroke();
    const barW = chartW / bins;
    counts.forEach((count,index) => { const barH = count/maxCount*chartH; ctx.fillStyle = teal; ctx.fillRect(left+index*barW+2,height-bottom-barH,Math.max(2,barW-4),barH); });
    ctx.fillStyle = ink; ctx.font = '12px Work Sans, sans-serif'; ctx.fillText('Histogram', left, 16); ctx.fillText(Engine.formatNumber(min), left, height-15); ctx.fillText(Engine.formatNumber(max), width-right-35, height-15); ctx.save(); ctx.translate(16,height/2+15); ctx.rotate(-Math.PI/2); ctx.fillText('Count',0,0); ctx.restore();
  }

  function drawIndividuals(canvas, values, average, sd) {
    if (!canvas) return;
    const {ctx, ink, line, teal, fail, card} = canvasSetup(canvas); const width=canvas.width,height=canvas.height;
    ctx.clearRect(0,0,width,height); ctx.fillStyle=card; ctx.fillRect(0,0,width,height);
    const ucl = sd == null ? null : average + 3*sd, lcl = sd == null ? null : average - 3*sd;
    const all = values.concat([ucl,lcl]).filter(Number.isFinite), min=Math.min(...all), max=Math.max(...all), range=max-min||1;
    const left=55,top=24,bottom=40,right=18,chartW=width-left-right,chartH=height-top-bottom;
    const y=value=>top+(max-value)/range*chartH, x=index=>left+(values.length===1?chartW/2:index/(values.length-1)*chartW);
    ctx.strokeStyle=line; ctx.beginPath(); ctx.moveTo(left,top); ctx.lineTo(left,height-bottom); ctx.lineTo(width-right,height-bottom); ctx.stroke();
    [[average,teal,'Mean'],[ucl,fail,'UCL'],[lcl,fail,'LCL']].forEach(item=>{if(!Number.isFinite(item[0]))return;ctx.strokeStyle=item[1];ctx.setLineDash(item[2]==='Mean'?[]:[5,4]);ctx.beginPath();ctx.moveTo(left,y(item[0]));ctx.lineTo(width-right,y(item[0]));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=item[1];ctx.fillText(item[2],width-right-28,y(item[0])-3);});
    ctx.strokeStyle=teal;ctx.beginPath();values.forEach((value,index)=>{if(index===0)ctx.moveTo(x(index),y(value));else ctx.lineTo(x(index),y(value));});ctx.stroke();
    values.forEach((value,index)=>{ctx.fillStyle=(Number.isFinite(ucl)&&value>ucl)||(Number.isFinite(lcl)&&value<lcl)?fail:teal;ctx.beginPath();ctx.arc(x(index),y(value),3,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle=ink;ctx.font='12px Work Sans, sans-serif';ctx.fillText('Individuals chart',left,16);ctx.fillText('1',left,height-15);ctx.fillText(String(values.length),width-right-18,height-15);
  }

  function renderReview() {
    const panel = document.querySelector('[data-platform-panel="review"]');
    if (!panel) return;
    const workflow = state.workflow;
    panel.innerHTML = `<div class="mc-workflow-grid">
      <section class="mc-subcard" data-lockable="true"><h3>Review, approval, and disposition</h3><div class="mc-grid">
        <label class="mc-field mc-span-4">Workflow status<select data-workflow-field="status">${STATUS_OPTIONS.map(value => `<option${value === workflow.status ? ' selected' : ''}>${esc(value)}</option>`).join('')}</select></label>
        <label class="mc-field mc-span-4">Technical reviewer<input data-workflow-field="reviewer" value="${esc(workflow.reviewer)}"></label>
        <label class="mc-field mc-span-4">Approver<input data-workflow-field="approver" value="${esc(workflow.approver)}"></label>
        <label class="mc-field mc-span-12">Final disposition<input data-workflow-field="disposition" value="${esc(workflow.disposition)}" placeholder="Accepted, rejected, regraded, concession, retest"></label>
        <label class="mc-field mc-span-12">Review comments<textarea rows="4" data-workflow-field="comments">${esc(workflow.comments)}</textarea></label>
      </div><h4 style="margin-top:14px">Controlled next actions</h4><div class="mc-check-grid">${DISPOSITION_ACTIONS.map(action => `<label class="mc-check"><input type="checkbox" data-disposition-action value="${esc(action)}"${workflow.actions.includes(action) ? ' checked' : ''}><span>${esc(action)}</span></label>`).join('')}</div><div class="mc-actions" style="margin-top:14px"><button class="btn outline" type="button" data-mc-action="saveWorkflow">Save review</button><button class="btn primary" type="button" data-mc-action="approveAssessment">Approve and lock</button><button class="btn outline" type="button" data-mc-action="unlockAssessment">Unlock</button><button class="btn outline" type="button" data-mc-action="printReport">Full report</button><button class="btn outline" type="button" data-mc-action="printCertificate">Screening certificate</button></div></section>
      <section class="mc-subcard"><h3>Engineering override / concession</h3><p>The calculated result remains visible. An override records a separate disposition and authorization.</p><div class="mc-grid"><label class="mc-field mc-span-6">Requirement<select id="mcOverrideRequirement">${coreEvaluation().rows.map(row => `<option value="${esc(row.label)}" data-original="${esc(row.status)}">${esc(row.label)} — ${esc(row.status)}</option>`).join('')}</select></label><label class="mc-field mc-span-6">Disposition<select id="mcOverrideDisposition"><option>Accepted by engineering concession</option><option>Retest authorized</option><option>Regraded</option><option>Rejected</option><option>Other</option></select></label><label class="mc-field mc-span-6">Authorization reference<input id="mcOverrideAuthorization" placeholder="ECN, NCR, concession, customer approval"></label><label class="mc-field mc-span-6">Reason<textarea id="mcOverrideReason" rows="3"></textarea></label></div><div class="mc-actions"><button class="btn outline" type="button" data-mc-action="addOverride">Record override</button></div><div id="mcOverrideList"></div></section>
    </div><section class="mc-subcard"><h3>Immutable audit history</h3><p>Local audit events are append-only in the interface and included in exports and reports. Organization mode stores the same history in authenticated Netlify storage.</p><div class="mc-audit" id="mcAuditList"></div><div class="mc-actions" style="margin-top:12px"><button class="btn danger mc-admin-only" type="button" data-mc-action="clearAudit">Clear local audit history</button></div></section>`;
    renderOverrides(); renderAudit();
  }

  function saveWorkflow() {
    document.querySelectorAll('[data-workflow-field]').forEach(field => { state.workflow[field.dataset.workflowField] = field.value; });
    state.workflow.actions = Array.from(document.querySelectorAll('[data-disposition-action]:checked')).map(input => input.value);
    persist(); logAudit('Review workflow saved', state.workflow.status + (state.workflow.disposition ? ' — ' + state.workflow.disposition : ''));
    setStatus('Review workflow saved.', 'success');
  }

  function approveAssessment() {
    if (!hasRole('Approver')) return setStatus('Approver permission is required.', 'error');
    saveWorkflow();
    const evaluation = coreEvaluation();
    if (!state.workflow.reviewer.trim() || !state.workflow.approver.trim()) return setStatus('Reviewer and approver names are required.', 'error');
    if (evaluation.status === 'fail' && !state.workflow.overrides.length) return setStatus('A failed calculated result requires a documented override or rejection disposition.', 'error');
    state.workflow.status = 'Approved'; state.workflow.locked = true; state.workflow.approvedAt = new Date().toISOString(); state.workflow.approvedBy = currentActor();
    persist(); applyLockState(); logAudit('Assessment approved and locked', state.workflow.disposition || evaluation.status); renderReview();
    setStatus('Assessment approved and locked.', 'success');
  }

  function unlockAssessment() {
    if (!hasRole('Approver')) return setStatus('Approver permission is required to unlock.', 'error');
    if (!state.workflow.locked) return;
    const reason = prompt('Reason for unlocking the approved assessment:');
    if (!reason) return;
    state.workflow.locked = false; state.workflow.status = 'Draft'; persist(); applyLockState(); logAudit('Approved assessment unlocked', reason); renderReview();
  }

  function applyLockState() {
    const platform = document.getElementById('mcPlatform');
    if (platform) platform.classList.toggle('is-locked', Boolean(state.workflow.locked));
    document.querySelectorAll('#tool .card:not(#mcPlatform) input, #tool .card:not(#mcPlatform) select, #tool .card:not(#mcPlatform) textarea, #tool .card:not(#mcPlatform) button').forEach(control => {
      if (state.workflow.locked) {
        if (!control.disabled) { control.dataset.mcLockedDisabled = 'true'; control.disabled = true; }
      } else if (control.dataset.mcLockedDisabled === 'true') { control.disabled = false; delete control.dataset.mcLockedDisabled; }
    });
  }

  function addOverride() {
    if (!hasRole('Engineer')) return setStatus('Engineer permission is required.', 'error');
    const select = document.getElementById('mcOverrideRequirement');
    const reason = document.getElementById('mcOverrideReason').value.trim();
    const authorization = document.getElementById('mcOverrideAuthorization').value.trim();
    if (!select?.value || !reason || !authorization) return setStatus('Requirement, reason, and authorization are required.', 'error');
    const original = select.selectedOptions[0]?.dataset.original || 'unknown';
    const override = {id: uid('override'), requirement: select.value, originalResult: original, disposition: document.getElementById('mcOverrideDisposition').value, reason, authorization, actor: currentActor(), at: new Date().toISOString()};
    state.workflow.overrides.push(override); persist(); logAudit('Engineering override recorded', override.requirement + ' — ' + override.authorization); renderOverrides();
    setStatus('Override recorded without changing the calculated result.', 'success');
  }

  function renderOverrides() {
    const target = document.getElementById('mcOverrideList');
    if (!target) return;
    target.innerHTML = state.workflow.overrides.length ? `<div class="mc-table-wrap" style="margin-top:14px"><table class="mc-table"><thead><tr><th>Requirement</th><th>Calculated</th><th>Disposition</th><th>Authorization</th><th>Reason</th><th>Recorded by</th></tr></thead><tbody>${state.workflow.overrides.map(item => `<tr><td>${esc(item.requirement)}</td><td><span class="mc-badge ${esc(item.originalResult)}">${esc(item.originalResult)}</span></td><td>${esc(item.disposition)}</td><td>${esc(item.authorization)}</td><td>${esc(item.reason)}</td><td>${esc(item.actor)}<br><small>${new Date(item.at).toLocaleString()}</small></td></tr>`).join('')}</tbody></table></div>` : '<p class="mc-muted" style="margin-top:12px">No overrides recorded.</p>';
  }

  function renderAudit() {
    const target = document.getElementById('mcAuditList');
    if (!target) return;
    target.innerHTML = state.audit.length ? state.audit.map(item => `<div class="mc-audit-row"><time>${new Date(item.at).toLocaleString()}</time><strong>${esc(item.action)}</strong><span>${esc(item.actor)} — ${esc(item.details)}</span></div>`).join('') : '<div class="empty">No audit events recorded.</div>';
  }

  function clearAudit() {
    if (!hasRole('System administrator')) return setStatus('System administrator permission is required.', 'error');
    if (!confirm('Clear the local audit history? This does not affect organization-mode records.')) return;
    state.audit = []; persist(); renderAudit(); setStatus('Local audit history cleared.', 'success');
  }

  function openReport(type) {
    const scope = readScope(); const evaluation = coreEvaluation(); const derived = Engine.calculateDerived(readCurrentEvidence().actuals, scope);
    const title = type === 'certificate' ? 'Material Compatibility Screening Certificate' : 'Material Specification Compliance Assessment';
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return setStatus('The report window was blocked by the browser.', 'error');
    const resultRows = evaluation.rows.map(row => `<tr><td>${esc(row.category)}</td><td>${esc(row.label)}</td><td>${esc(row.actual)}</td><td>${esc(row.acceptance)}</td><td>${esc(row.status)}</td><td>${esc(row.basis)}</td></tr>`).join('');
    const body = type === 'certificate' ? `
      <section class="certificate"><h2>${esc(scope.materialId || scope.heatNumber || 'Material')}</h2><dl><dt>Produced / source specification</dt><dd>${esc([scope.sourceStandard,scope.sourceGrade,scope.sourceEdition].filter(Boolean).join(' | '))}</dd><dt>Screened against</dt><dd>${esc([scope.targetStandard,scope.targetGrade,scope.targetEdition].filter(Boolean).join(' | '))}</dd><dt>Calculated result</dt><dd class="result">${esc(evaluation.status.toUpperCase())}</dd><dt>Disposition</dt><dd>${esc(state.workflow.disposition || 'Not approved')}</dd><dt>Evidence coverage</dt><dd>${evaluation.coverage}%</dd></dl><p class="notice">This document records a compatibility screening and does not certify the material to the target standard.</p></section>` : `
      <section><h2>Scope</h2><table><tr><th>Material ID</th><td>${esc(scope.materialId)}</td><th>Heat</th><td>${esc(scope.heatNumber)}</td></tr><tr><th>Source</th><td>${esc([scope.sourceStandard,scope.sourceGrade,scope.sourceEdition].filter(Boolean).join(' | '))}</td><th>Target</th><td>${esc([scope.targetStandard,scope.targetGrade,scope.targetEdition].filter(Boolean).join(' | '))}</td></tr></table></section>
      <section><h2>Decision</h2><p class="result">${esc(evaluation.status.toUpperCase())} — ${esc(evaluation.message)}</p><p>Coverage: ${evaluation.coverage}% (${evaluation.assessed} of ${evaluation.applicable})</p></section>
      <section><h2>Requirement results</h2><table><thead><tr><th>Section</th><th>Requirement</th><th>Actual</th><th>Rule</th><th>Result</th><th>Basis</th></tr></thead><tbody>${resultRows}</tbody></table></section>
      <section><h2>Derived calculations</h2><ul><li>CEIIW: ${derived.ceiiw.ready ? Engine.formatNumber(derived.ceiiw.value) : 'Missing inputs'}</li><li>Pcm: ${derived.pcm.ready ? Engine.formatNumber(derived.pcm.value) : 'Missing inputs'}</li><li>Y/T: ${derived.ytRatio.ready ? Engine.formatNumber(derived.ytRatio.value) : 'Missing inputs'}</li><li>D/t: ${derived.diameterThicknessRatio.ready ? Engine.formatNumber(derived.diameterThicknessRatio.value) : 'Missing inputs'}</li></ul></section>
      <section><h2>Review and disposition</h2><p>Status: ${esc(state.workflow.status)}<br>Reviewer: ${esc(state.workflow.reviewer)}<br>Approver: ${esc(state.workflow.approver)}<br>Disposition: ${esc(state.workflow.disposition)}<br>Comments: ${esc(state.workflow.comments)}</p></section>`;
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:32px;line-height:1.45}header{display:flex;align-items:center;gap:14px;border-bottom:3px solid #0e7490;padding-bottom:16px}header img{width:54px}h1,h2{font-family:Georgia,serif;color:#0f2a43}h1{margin:0}section{margin:24px 0}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccd5df;padding:8px;text-align:left;vertical-align:top}th{background:#edf4f8}.result{font-size:1.4rem;font-weight:bold}.notice{padding:14px;border:1px solid #c88a00;background:#fff8e7}.certificate{max-width:760px;margin:50px auto;border:2px solid #0f2a43;padding:36px}.certificate dl{display:grid;grid-template-columns:220px 1fr;gap:10px}.certificate dt{font-weight:bold}@media print{button{display:none}body{margin:12mm}}</style></head><body><header><img src="${location.origin}/assets/logo-icon.png" alt=""><div><h1>${esc(title)}</h1><p>UpSkill Sprint Consulting</p></div></header>${body}<footer><p><strong>Engineering-use caution:</strong> Verify the controlled standard edition, product form, thickness range, purchase requirements, supplementary requirements, and responsible technical approval.</p><p>Generated ${new Date().toLocaleString()}</p></footer><button onclick="print()">Print / Save PDF</button></body></html>`);
    popup.document.close(); logAudit(type === 'certificate' ? 'Screening certificate generated' : 'Engineering report generated', scope.materialId || scope.heatNumber || 'Current assessment');
  }

  function renderAdmin() {
    const panel = document.querySelector('[data-platform-panel="admin"]');
    if (!panel) return;
    const user = currentIdentityUser();
    const tests = Engine.runSelfTests();
    const catalogue = allProperties();
    panel.innerHTML = `<div class="mc-overview-grid">
      <section class="mc-subcard"><h3>Roles and permissions</h3><p>Local mode simulates roles for a single browser. Organization mode uses Netlify Identity roles supplied by the authenticated account.</p><label class="mc-field">Local role<select id="mcLocalRole"${user ? ' disabled' : ''}>${ROLES.map(role => `<option${role === state.localRole ? ' selected' : ''}>${esc(role)}</option>`).join('')}</select></label><p class="mc-muted" style="margin-top:10px">Effective role: <strong>${esc(currentRole())}</strong>${user ? ' — ' + esc(user.email || user.id) : ''}</p></section>
      <section class="mc-subcard"><h3>Catalogue administration</h3><div class="mc-kpi-grid"><div class="mc-kpi"><span>Properties</span><strong>${catalogue.length}</strong></div><div class="mc-kpi"><span>Standards</span><strong>${Object.values(Config.LIB || {}).reduce((sum, org) => sum + Object.keys(org).length, 0)}</strong></div><div class="mc-kpi"><span>Rule packages</span><strong>${state.packages.length}</strong></div><div class="mc-kpi"><span>Aliases</span><strong>${Object.keys(state.aliases).length}</strong></div></div><div class="mc-grid" style="margin-top:14px"><label class="mc-field mc-span-4">Source alias<input id="mcAliasSource" placeholder="Example: YIELDSTRENGTHMPA"></label><label class="mc-field mc-span-4">Canonical property<select id="mcAliasTarget">${allProperties().map(item => `<option value="${item.code}">${esc(item.label)}</option>`).join('')}</select></label><div class="mc-actions mc-span-4"><button class="btn outline" type="button" data-mc-action="addAlias">Add alias</button></div></div><div id="mcAliasList" class="mc-muted" style="margin-top:10px">${Object.entries(state.aliases).map(entry => esc(entry[0] + ' → ' + entry[1])).join('<br>') || 'No custom aliases.'}</div></section>
    </div>
    <section class="mc-subcard"><h3>Storage and authentication</h3><div class="mc-storage-mode"><label class="mc-storage-card"><input type="radio" name="mcStorageMode" value="local"${state.storageMode === 'local' ? ' checked' : ''}><h4>Local browser mode</h4><p>Works immediately and stores data only in this browser. Do not use for confidential production records on a shared device.</p></label><label class="mc-storage-card"><input type="radio" name="mcStorageMode" value="organization"${state.storageMode === 'organization' ? ' checked' : ''}><h4>Authenticated organization mode</h4><p>Uses Netlify Identity and server-side Netlify Blobs storage. Identity must be enabled for the site.</p></label></div><div class="mc-actions" style="margin-top:14px"><button class="btn outline" type="button" data-mc-action="identityLogin">Sign in</button><button class="btn outline" type="button" data-mc-action="identityLogout">Sign out</button><button class="btn primary" type="button" data-mc-action="saveRemote">Sync to organization storage</button><button class="btn outline" type="button" data-mc-action="loadRemote">Load organization workspace</button></div><p class="mc-status" id="mcStorageStatus">${user ? 'Signed in as ' + esc(user.email || user.id) : 'Not signed in.'}</p></section>
    <section class="mc-subcard"><h3>Automated validation suite</h3><p>Runs unit conversion, boundary, missing-evidence, derived-calculation, capability, DOM-ID, accessibility-label, and load-order checks.</p><div class="mc-actions"><button class="btn outline" type="button" data-mc-action="runTests">Run validation suite</button></div><ul class="mc-test-list" id="mcTestList">${tests.tests.map(test => `<li><span>${esc(test.name)}</span><strong class="${test.passed ? 'pass' : 'fail'}">${test.passed ? 'Pass' : 'Fail'}</strong></li>`).join('')}</ul></section>`;
  }

  function addAlias() {
    if (!hasRole('Standards administrator')) return setStatus('Standards administrator permission is required.', 'error');
    const source = Engine.normalize(document.getElementById('mcAliasSource').value);
    const target = document.getElementById('mcAliasTarget').value;
    if (!source || !target) return setStatus('Enter an alias and select a canonical property.', 'error');
    state.aliases[source] = target; persist(); logAudit('Import alias added', source + ' → ' + target); renderAdmin();
  }

  function runTests() {
    const engineTests = Engine.runSelfTests().tests;
    const ids = Array.from(document.querySelectorAll('[id]')).map(element => element.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const unlabeled = Array.from(document.querySelectorAll('#mcPlatform input:not([type="hidden"]), #mcPlatform select, #mcPlatform textarea')).filter(control => !control.closest('label') && !control.getAttribute('aria-label'));
    const tests = engineTests.concat([
      {name: 'No duplicate DOM IDs', passed: duplicateIds.length === 0, message: duplicateIds.join(', ')},
      {name: 'Advanced controls have labels', passed: unlabeled.length === 0, message: unlabeled.length + ' unlabeled controls'},
      {name: 'Grade library loaded before application', passed: Boolean(window.MaterialCheckerGradeLibraryMeta), message: ''},
      {name: 'Shared theme toggle available', passed: Boolean(document.querySelector('[data-theme-toggle]')), message: ''}
    ]);
    document.getElementById('mcTestList').innerHTML = tests.map(test => `<li><span>${esc(test.name)}${test.message && !test.passed ? '<br><small>' + esc(test.message) + '</small>' : ''}</span><strong class="${test.passed ? 'pass' : 'fail'}">${test.passed ? 'Pass' : 'Fail'}</strong></li>`).join('');
    const failed = tests.filter(test => !test.passed).length;
    logAudit('Validation suite executed', failed ? failed + ' failure(s)' : 'All checks passed');
    setStatus(failed ? failed + ' validation check(s) failed.' : 'All validation checks passed.', failed ? 'error' : 'success');
  }

  function initializeIdentity() {
    if (!window.netlifyIdentity) return;
    window.netlifyIdentity.on('login', user => { logAudit('Organization sign-in', user.email || user.id); window.netlifyIdentity.close(); renderAdmin(); });
    window.netlifyIdentity.on('logout', () => { logAudit('Organization sign-out', 'Identity session ended'); renderAdmin(); });
    window.netlifyIdentity.init();
  }

  function identityLogin() {
    if (!window.netlifyIdentity) return setStatus('Netlify Identity widget is unavailable.', 'error');
    window.netlifyIdentity.open('login');
  }

  function identityLogout() {
    if (window.netlifyIdentity && currentIdentityUser()) window.netlifyIdentity.logout();
  }

  async function identityToken() {
    const user = currentIdentityUser();
    if (!user) throw new Error('Sign in to organization mode first.');
    return user.jwt();
  }

  async function saveRemote() {
    try {
      const token = await identityToken();
      const response = await fetch('/.netlify/functions/material-checker', {method: 'PUT', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + token}, body: JSON.stringify({workspace: state})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Organization sync failed.');
      logAudit('Organization workspace synchronized', data.updatedAt || 'Saved'); renderAdmin(); setStatus('Organization workspace synchronized.', 'success');
    } catch (error) { setStatus(error.message, 'error'); }
  }

  async function loadRemote() {
    try {
      const token = await identityToken();
      const response = await fetch('/.netlify/functions/material-checker', {headers: {Authorization: 'Bearer ' + token}});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load organization workspace.');
      if (data.workspace) state = Object.assign(defaultState(), data.workspace);
      persist(); logAudit('Organization workspace loaded', data.updatedAt || 'Loaded'); renderAll(); applyLockState(); setStatus('Organization workspace loaded.', 'success');
    } catch (error) { setStatus(error.message, 'error'); }
  }

  function observeCoreTool() {
    const tool = document.getElementById('tool');
    if (!tool) return;
    tool.addEventListener('input', event => queueCoreAudit(event));
    tool.addEventListener('change', event => queueCoreAudit(event));
    document.getElementById('run')?.addEventListener('click', () => setTimeout(() => { logAudit('Core compliance check run', document.getElementById('overall')?.textContent || ''); renderOverview(); }, 80));
  }

  function queueCoreAudit(event) {
    if (event.target.closest('#mcPlatform') || event.target.type === 'file') return;
    clearTimeout(inputAuditTimer);
    const target = event.target;
    inputAuditTimer = setTimeout(() => {
      const label = target.closest('label')?.childNodes[0]?.nodeValue?.trim() || target.dataset.scope || target.dataset.f || target.id || target.name || 'Field';
      const value = target.type === 'checkbox' ? String(target.checked) : String(target.value || '').slice(0, 160);
      logAudit('Assessment input changed', label + ': ' + value);
      renderOverview();
    }, 650);
  }

  function downloadJSON(value, filename) {
    const blob = new Blob([JSON.stringify(value, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
  }

  document.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-rule]');
    if (remove && hasRole('Standards administrator')) remove.closest('tr').remove();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWorkspace, {once: true});
  else initWorkspace();
}());
