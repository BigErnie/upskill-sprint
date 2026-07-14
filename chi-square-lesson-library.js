(function () {
  'use strict';

  const LESSONS = [
    {
      marker: 'data-chi-square-goodness-of-fit',
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
      path: '/lessons/statistics/beyond-the-bell-the-normal-distribution-and-its-relatives',
      topic: 'statistics',
      level: 'intermediate',
      interactive: 'true',
      search: 'beyond the bell normal related distributions central limit theorem clt weibull lognormal student t binomial poisson exponential chi square standard error sampling distribution reliability density pdf cdf intermediate interactive simulator',
      meta: '<span>Intermediate</span><span>Interactive</span><span>20 min</span>',
      title: 'Beyond the Bell: The Normal Distribution and Its Relatives',
      description: 'See how the normal connects to the Weibull, lognormal, t, binomial and more — with a live Central Limit Theorem simulator.'
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
    const statistics = document.getElementById('statistics');
    if (statistics) {
      const total = statistics.querySelectorAll('[data-lesson-item]').length;
      const categoryCount = statistics.querySelector('.category-count');
      if (categoryCount) categoryCount.textContent = total + (total === 1 ? ' lesson' : ' lessons');
    }

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

    const section = document.getElementById('statistics');
    const list = section && section.querySelector('.lesson-list');
    if (!section || !list) return;

    const managedRows = LESSONS.map(function (definition) {
      let row = list.querySelector('[' + definition.marker + ']');
      if (!row) {
        row = createLessonRow(definition);
        list.appendChild(row);
      }
      return row;
    });

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

      const hasVisibleLesson = Array.from(section.querySelectorAll('[data-lesson-item]')).some(function (lesson) {
        return !lesson.hidden;
      });
      section.hidden = !hasVisibleLesson;

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
