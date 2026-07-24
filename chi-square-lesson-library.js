(function () {
  'use strict';

  const LESSONS = [
    {
      marker: 'data-chi-square-goodness-of-fit',
      sectionId: 'statistics',
      path: '/lessons/statistics/chi-square-goodness-of-fit-test',
      topic: 'statistics',
      level: 'intermediate',
      interactive: 'true',
      search: 'chi square goodness of fit test observed expected counts probabilities degrees of freedom p value calculator distribution graph worked example quiz statistics',
      meta: '<span>Intermediate</span><span>Interactive</span>',
      title: 'Chi-Square Goodness-of-Fit Test',
      description: 'Test whether observed category counts fit an expected distribution using a live calculator, graph, worked example, and quiz.'
    },
    {
      marker: 'data-normal-distribution',
      sectionId: 'statistics',
      path: '/lessons/statistics/the-normal-distribution-meet-the-bell-curve',
      topic: 'statistics',
      level: 'beginner',
      interactive: 'true',
      search: 'normal distribution bell curve gaussian empirical rule 68 95 99.7 z score standard deviation probability percentile statistics basics beginner interactive calculator',
      meta: '<span>Beginner</span><span>Interactive</span><span>15 min</span>',
      title: 'The Normal Distribution: Meet the Bell Curve',
      description: 'Master the bell curve, the 68-95-99.7 rule, and z-scores with interactive graphs, a live calculator, worked examples, and a quiz.'
    },
    {
      marker: 'data-beyond-the-bell',
      sectionId: 'statistics',
      path: '/lessons/statistics/beyond-the-bell-the-normal-distribution-and-its-relatives',
      topic: 'statistics',
      level: 'intermediate',
      interactive: 'true',
      search: 'beyond the bell normal related distributions central limit theorem clt weibull lognormal student t binomial poisson exponential chi square standard error sampling distribution reliability density pdf cdf intermediate interactive simulator',
      meta: '<span>Intermediate</span><span>Interactive</span><span>20 min</span>',
      title: 'Beyond the Bell: The Normal Distribution and Its Relatives',
      description: 'See how the normal connects to the Weibull, lognormal, t, binomial and more — with a live Central Limit Theorem simulator.'
    },
    {
      marker: 'data-minitab-best-predictive-regression-model',
      sectionId: 'statistics',
      path: '/lessons/minitab-best-predictive-regression-model',
      topic: 'statistics',
      level: 'advanced',
      interactive: 'true',
      search: 'minitab best predictive regression model model selection polynomial regression interactions squares cubic hierarchy forward selection cross validation grouped folds validation r squared rmse mad vif residuals MARS discover best model automated machine learning statistics advanced interactive',
      meta: '<span>Advanced</span><span>Interactive</span><span>30–40 min</span><span>Minitab</span>',
      title: 'Finding the Best Predictive Regression Model in Minitab',
      description: 'Build, validate, challenge, and select an interpretable predictive model using polynomial regression, grouped cross-validation, MARS, and automated model comparison.'
    },
    {
      marker: 'data-process-capability',
      sectionId: 'lean-six-sigma',
      path: '/lessons/lean-six-sigma/process-capability-cp-and-cpk',
      topic: 'lean-six-sigma',
      level: 'beginner',
      interactive: 'true',
      search: 'process capability cp cpk capability index specification limits usl lsl voice of customer voice of process six sigma capability analysis 1.33 ppk pp minitab excel lean six sigma beginner interactive',
      meta: '<span>Beginner</span><span>Interactive</span><span>15 min</span>',
      title: 'Process Capability: Will Your Process Meet the Spec?',
      description: 'Learn Cp and Cpk with a live capability explorer: specs, spread, centering, the 1.33 benchmark, and Excel & Minitab how-tos.'
    },
    {
      marker: 'data-overall-equipment-effectiveness',
      sectionId: 'lean-six-sigma',
      path: '/lessons/overall-equipment-effectiveness-oee',
      topic: 'lean-six-sigma',
      level: 'intermediate',
      interactive: 'true',
      search: 'oee overall equipment effectiveness availability performance quality eight losses six big losses tpm total productive maintenance small stops minor stoppages setup adjustment reduced speed ideal cycle time run time planned production time teep downtime threshold logged lost excel minitab pareto lean six sigma asq cssbb cqe interactive',
      meta: '<span>Intermediate</span><span>Interactive</span><span>28 min</span>',
      title: 'Overall Equipment Effectiveness (OEE) and the Eight Losses',
      description: 'Six live interactives: calculate OEE three ways, map all eight TPM losses, and settle why small stops are a performance loss while setup is an availability loss.'
    },
    {
      marker: 'data-introduction-doe',
      sectionId: 'lean-six-sigma',
      path: '/lessons/introduction-to-design-of-experiment-doe',
      topic: 'lean-six-sigma',
      level: 'intermediate',
      interactive: 'true',
      search: 'doe design of experiment design of experiments factorial design two factor two level three factor two level 2x2 2 cubed main effects interaction effects cube minitab excel lean six sigma interactive',
      meta: '<span>Intermediate</span><span>Interactive</span><span>30 min</span>',
      title: 'Introduction to Design of Experiment (DOE)',
      description: 'DOE, Design of Experiment'
    },
    {
      marker: 'data-understanding-dot-notation',
      sectionId: 'statistics',
      path: '/lessons/statistics/understanding-dot-notation',
      topic: 'statistics',
      level: 'beginner',
      interactive: 'true',
      search: 'dot notation anova doe row total column total grand total summation sum then square square then sum squared total sum of squared observations correction factor raw sum of squares excel sumsq minitab beginner general interactive',
      meta: '<span>Beginner</span><span>General</span><span>10 min</span>',
      title: 'Understanding Dot Notation',
      description: 'Dot notation'
    },
    {
      marker: 'data-essential-quality-tools',
      sectionId: 'quality-engineering',
      path: '/lessons/7-essential-quality-tools',
      topic: 'quality-engineering',
      level: 'beginner',
      interactive: 'true',
      search: '7 essential quality tools seven basic qc tools flowchart process map check sheet stratification pareto fishbone histogram scatter plot control chart quality engineering ASQ CSSBB CQE interactive',
      meta: '<span>Beginner</span><span>Interactive</span><span>30 min</span>',
      title: 'The 7 Essential Quality Tools',
      description: 'Learn when and why to use each QC tool through live simulators, a tool-selection wizard, and a steel tensile-failure investigation.'
    },
    {
      marker: 'data-management-planning-tools',
      sectionId: 'quality-engineering',
      path: '/lessons/7-management-planning-tools',
      topic: 'quality-engineering',
      level: 'intermediate',
      interactive: 'true',
      search: '7 management planning tools affinity diagram interrelationship digraph tree diagram prioritization matrix matrix diagram PDPC activity network quality engineering ASQ CQE CSSBB interactive',
      meta: '<span>Intermediate</span><span>Interactive</span><span>35 min</span>',
      title: 'The 7 Management &amp; Planning Tools',
      description: 'Turn a confirmed cause into an executable plan with affinity grouping, weighted prioritization, RACI ownership, PDPC, and critical-path logic.'
    },
    {
      marker: 'data-complete-quality-toolbox',
      sectionId: 'quality-engineering',
      path: '/lessons/complete-14-quality-tools-project',
      topic: 'quality-engineering',
      level: 'advanced',
      interactive: 'true',
      search: 'complete 14 quality tools project integrated quality engineering root cause corrective action capstone QC tools management planning tools ASQ CSSBB CQE advanced interactive',
      meta: '<span>Advanced</span><span>Interactive</span><span>45 min</span>',
      title: 'The Complete Quality Toolbox: All 14 Tools',
      description: 'Run an end-to-end quality investigation from process mapping and root-cause evidence through corrective-action planning and sustainment.'
    }
  ];

  function isLessonsPage() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    return path === '/lessons' || path.endsWith('/lessons.html');
  }

  function normalise(value) {
    return String(value || '').toLowerCase().trim();
  }

  function updateCounts() {
    document.querySelectorAll('[data-category-section]').forEach(function (section) {
      const total = section.querySelectorAll('[data-lesson-item]').length;
      const categoryCount = section.querySelector('.category-count');
      if (categoryCount) categoryCount.textContent = total + (total === 1 ? ' lesson' : ' lessons');
    });

    const visibleCount = Array.from(document.querySelectorAll('[data-lesson-item]')).filter(function (lesson) {
      return !lesson.hidden;
    }).length;
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) resultsCount.textContent = visibleCount + (visibleCount === 1 ? ' lesson' : ' lessons');
  }

  function createLessonRow(definition) {
    const row = document.createElement('a');
    row.className = 'lesson-row';
    row.href = definition.path;
    row.setAttribute('data-lesson-item', '');
    row.setAttribute('data-topic', definition.topic);
    row.setAttribute('data-level', definition.level);
    row.setAttribute('data-interactive', definition.interactive);
    row.setAttribute(definition.marker, 'true');
    row.setAttribute('data-search', definition.search);
    row.innerHTML = `
      <div>
        <div class="lesson-meta">${definition.meta}</div>
        <h3>${definition.title}</h3>
        <p>${definition.description}</p>
      </div>
      <span class="lesson-action">Start lesson</span>`;
    return row;
  }

  function installLessons() {
    if (!isLessonsPage()) return;

    const managedRows = [];
    const affectedSections = new Set();

    LESSONS.forEach(function (definition) {
      const section = document.getElementById(definition.sectionId);
      const list = section && section.querySelector('.lesson-list');
      if (!section || !list) return;

      affectedSections.add(section);
      let row = list.querySelector('[' + definition.marker + ']');
      if (!row) {
        row = createLessonRow(definition);
        list.appendChild(row);
      }
      managedRows.push(row);
    });

    if (!managedRows.length) return;

    const searchInput = document.getElementById('lesson-search');
    const topicFilter = document.getElementById('topic-filter');
    const levelFilter = document.getElementById('level-filter');
    const interactiveFilter = document.getElementById('interactive-filter');
    const clearButton = document.getElementById('clear-filters');
    const noResults = document.getElementById('no-results');

    function syncLessons() {
      const query = normalise(searchInput && searchInput.value);
      const topic = topicFilter ? topicFilter.value : '';
      const level = levelFilter ? levelFilter.value : '';
      const interactiveOnly = Boolean(interactiveFilter && interactiveFilter.checked);

      managedRows.forEach(function (row) {
        const matches = (
          (!query || normalise(row.dataset.search).includes(query)) &&
          (!topic || row.dataset.topic === topic) &&
          (!level || row.dataset.level === level) &&
          (!interactiveOnly || row.dataset.interactive === 'true')
        );
        row.hidden = !matches;
      });

      affectedSections.forEach(function (section) {
        const hasVisibleLesson = Array.from(section.querySelectorAll('[data-lesson-item]')).some(function (lesson) {
          return !lesson.hidden;
        });
        section.hidden = !hasVisibleLesson;
      });

      updateCounts();

      if (noResults) {
        const visibleLessons = Array.from(document.querySelectorAll('[data-lesson-item]')).some(function (lesson) {
          return !lesson.hidden;
        });
        const visibleEmptySection = Array.from(document.querySelectorAll('[data-empty-category]')).some(function (emptySection) {
          return !emptySection.hidden;
        });
        noResults.hidden = visibleLessons || visibleEmptySection;
      }
    }

    [searchInput, topicFilter, levelFilter, interactiveFilter].forEach(function (control) {
      if (!control || control.dataset.dynamicLessonListener === 'true') return;
      control.dataset.dynamicLessonListener = 'true';
      control.addEventListener(control.type === 'search' ? 'input' : 'change', syncLessons);
    });

    if (clearButton && clearButton.dataset.dynamicLessonListener !== 'true') {
      clearButton.dataset.dynamicLessonListener = 'true';
      clearButton.addEventListener('click', function () {
        window.setTimeout(syncLessons, 0);
      });
    }

    syncLessons();
    window.setTimeout(function () {
      syncLessons();
      updateCounts();
    }, 0);
    window.requestAnimationFrame(updateCounts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installLessons, { once: true });
  } else {
    installLessons();
  }
}());
