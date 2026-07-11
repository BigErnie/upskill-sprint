(function () {
  'use strict';

  const LESSON_PATH = '/lessons/statistics/chi-square-goodness-of-fit-test';

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

  function installLesson() {
    if (!isLessonsPage()) return;

    const section = document.getElementById('statistics');
    const list = section && section.querySelector('.lesson-list');
    if (!section || !list) return;

    let row = list.querySelector('[data-chi-square-goodness-of-fit]');
    if (!row) {
      row = document.createElement('a');
      row.className = 'lesson-row';
      row.href = LESSON_PATH;
      row.setAttribute('data-lesson-item', '');
      row.setAttribute('data-topic', 'statistics');
      row.setAttribute('data-level', 'intermediate');
      row.setAttribute('data-interactive', 'true');
      row.setAttribute('data-chi-square-goodness-of-fit', 'true');
      row.setAttribute(
        'data-search',
        'chi square goodness of fit test observed expected counts probabilities degrees of freedom p value calculator distribution graph worked example quiz statistics'
      );
      row.innerHTML = `
        <div>
          <div class="lesson-meta"><span>Intermediate</span><span>Interactive</span></div>
          <h3>Chi-Square Goodness-of-Fit Test</h3>
          <p>Test whether observed category counts fit an expected distribution using a live calculator, graph, worked example, and quiz.</p>
        </div>
        <span class="lesson-action">Start lesson</span>`;
      list.appendChild(row);
    }

    const searchInput = document.getElementById('lesson-search');
    const topicFilter = document.getElementById('topic-filter');
    const levelFilter = document.getElementById('level-filter');
    const interactiveFilter = document.getElementById('interactive-filter');
    const clearButton = document.getElementById('clear-filters');
    const noResults = document.getElementById('no-results');

    function syncLesson() {
      const query = normalise(searchInput && searchInput.value);
      const topic = topicFilter ? topicFilter.value : '';
      const level = levelFilter ? levelFilter.value : '';
      const interactiveOnly = Boolean(interactiveFilter && interactiveFilter.checked);
      const matches = (
        (!query || normalise(row.dataset.search).includes(query)) &&
        (!topic || row.dataset.topic === topic) &&
        (!level || row.dataset.level === level) &&
        (!interactiveOnly || row.dataset.interactive === 'true')
      );

      row.hidden = !matches;

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
      if (!control || control.dataset.chiSquareListener === 'true') return;
      control.dataset.chiSquareListener = 'true';
      control.addEventListener(control.type === 'search' ? 'input' : 'change', syncLesson);
    });
    if (clearButton && clearButton.dataset.chiSquareListener !== 'true') {
      clearButton.dataset.chiSquareListener = 'true';
      clearButton.addEventListener('click', function () {
        window.setTimeout(syncLesson, 0);
      });
    }

    syncLesson();
    window.setTimeout(function () {
      syncLesson();
      updateCounts();
    }, 0);
    window.requestAnimationFrame(updateCounts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installLesson, { once: true });
  } else {
    installLesson();
  }
}());
