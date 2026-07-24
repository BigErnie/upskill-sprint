'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const LESSONS_HTML = fs.readFileSync(path.join(ROOT, 'lessons.html'), 'utf8');
const LIBRARY_JS = fs.readFileSync(path.join(ROOT, 'chi-square-lesson-library.js'), 'utf8');

const LEVELS = ['beginner', 'intermediate', 'advanced'];

/* ---------- filter markup contract ---------- */

test('the level filter offers All levels plus every supported level in order', () => {
  const select = /<select id="level-filter">([\s\S]*?)<\/select>/.exec(LESSONS_HTML);
  assert.ok(select, 'the level-filter select is present');

  const options = Array.from(select[1].matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g))
    .map(match => ({ value: match[1], label: match[2] }));

  assert.deepEqual(options, [
    { value: '', label: 'All levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]);
});

test('every option value except All levels is a supported level slug', () => {
  const select = /<select id="level-filter">([\s\S]*?)<\/select>/.exec(LESSONS_HTML);
  Array.from(select[1].matchAll(/<option value="([^"]+)"/g)).forEach(match => {
    assert.ok(LEVELS.includes(match[1]), `${match[1]} is a supported level`);
  });
});

test('lessons.html carries the exact shared controller tags', () => {
  assert.equal(LESSONS_HTML.split('<script src="/theme.js"></script>').length - 1, 1);
  assert.equal(LESSONS_HTML.split('<script src="/site-sections.js"></script>').length - 1, 1);
});

/* ---------- data-level integrity ---------- */

test('every static lesson row declares a supported level', () => {
  const rows = Array.from(LESSONS_HTML.matchAll(/data-level="([^"]*)"/g)).map(m => m[1]);
  assert.ok(rows.length > 0, 'static lesson rows are present');
  rows.forEach(level => {
    assert.ok(LEVELS.includes(level), `data-level="${level}" is a supported level`);
  });
});

test('every supported level has a matching filter option', () => {
  LEVELS.forEach(level => {
    assert.ok(
      LESSONS_HTML.includes(`<option value="${level}">`),
      `${level} has a filter option`
    );
  });
});

/* ---------- lesson library definitions ---------- */

function libraryDefinitions() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.test/',
    runScripts: 'outside-only'
  });
  const instrumented = LIBRARY_JS.replace(
    'function isLessonsPage() {',
    'window.__LESSON_DEFS = LESSONS;\n\n  function isLessonsPage() {'
  );
  assert.notEqual(instrumented, LIBRARY_JS, 'the definitions hook was applied');
  dom.window.eval(instrumented);
  const captured = dom.window.__LESSON_DEFS;
  assert.ok(Array.isArray(captured) && captured.length, 'lesson definitions captured');
  return captured;
}

test('every library lesson definition declares a supported level', () => {
  libraryDefinitions().forEach(definition => {
    assert.ok(
      LEVELS.includes(definition.level),
      `${definition.title} has level "${definition.level}"`
    );
  });
});

test('the displayed level badge matches the level used for filtering', () => {
  libraryDefinitions().forEach(definition => {
    const badge = /<span>([^<]+)<\/span>/.exec(definition.meta);
    assert.ok(badge, `${definition.title} shows a leading badge`);
    assert.equal(
      badge[1].toLowerCase(),
      definition.level,
      `${definition.title} badge "${badge[1]}" matches level "${definition.level}"`
    );
  });
});

test('at least one lesson is registered at the advanced level', () => {
  const advanced = libraryDefinitions().filter(definition => definition.level === 'advanced');
  assert.ok(advanced.length >= 1, 'an advanced lesson exists');
});

test('advanced lesson search text includes the advanced keyword', () => {
  libraryDefinitions()
    .filter(definition => definition.level === 'advanced')
    .forEach(definition => {
      assert.match(definition.search, /\badvanced\b/i, `${definition.title} is searchable by level`);
    });
});

/* ---------- live filtering behaviour ---------- */

function lessonsPage() {
  // site-sections.js injects the library at runtime; inline it so jsdom runs it
  // in document order without needing network access.
  const merged = LESSONS_HTML.replace('</body>', `<script>${LIBRARY_JS}</script>\n</body>`);
  const dom = new JSDOM(merged, {
    url: 'https://example.test/lessons.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  return new Promise(resolve => {
    dom.window.addEventListener('load', () => resolve(dom.window));
  });
}

function visibleRows(window) {
  return Array.from(window.document.querySelectorAll('[data-lesson-item]'))
    .filter(row => !row.hidden);
}

// The library re-syncs injected rows from a setTimeout after Clear is pressed,
// so tests that clear filters must let the macrotask queue drain first.
function flush(window) {
  return new Promise(resolve => window.setTimeout(resolve, 0));
}

function selectLevel(window, level) {
  const select = window.document.getElementById('level-filter');
  select.value = level;
  select.dispatchEvent(new window.Event('change'));
  return select;
}

test('the library injects rows for every definition', async () => {
  const window = await lessonsPage();
  const rendered = window.document.querySelectorAll('[data-lesson-item]').length;
  assert.ok(rendered > 14, `library rows were injected (${rendered} total)`);
});

test('selecting Advanced shows only advanced lessons', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');

  const shown = visibleRows(window);
  assert.ok(shown.length >= 1, 'at least one advanced lesson is visible');
  shown.forEach(row => {
    assert.equal(row.dataset.level, 'advanced', `${row.getAttribute('href')} is advanced`);
  });
});

test('selecting Advanced hides beginner and intermediate lessons', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');

  Array.from(window.document.querySelectorAll('[data-lesson-item]'))
    .filter(row => row.dataset.level !== 'advanced')
    .forEach(row => assert.equal(row.hidden, true, `${row.getAttribute('href')} is hidden`));
});

test('each level filters to a non-empty set and the three sets partition the library', async () => {
  const window = await lessonsPage();
  const total = window.document.querySelectorAll('[data-lesson-item]').length;
  const seen = new Set();

  for (const level of LEVELS) {
    selectLevel(window, level);
    const shown = visibleRows(window);
    assert.ok(shown.length >= 1, `${level} matches at least one lesson`);
    shown.forEach(row => {
      assert.equal(row.dataset.level, level);
      assert.ok(!seen.has(row), 'each row appears under exactly one level');
      seen.add(row);
    });
  }

  assert.equal(seen.size, total, 'every lesson is reachable through some level');
});

test('the results count reflects the advanced selection', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');

  const expected = visibleRows(window).length;
  const label = window.document.getElementById('results-count').textContent;
  assert.equal(label, expected + (expected === 1 ? ' lesson' : ' lessons'));
});

test('the no-results panel stays hidden while advanced lessons exist', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');
  assert.equal(window.document.getElementById('no-results').hidden, true);
});

test('the featured section is hidden once a level filter is applied', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');
  assert.equal(window.document.getElementById('featured-section').hidden, true);
});

test('clearing filters restores every lesson after an advanced selection', async () => {
  const window = await lessonsPage();
  const total = window.document.querySelectorAll('[data-lesson-item]').length;

  const select = selectLevel(window, 'advanced');
  assert.ok(visibleRows(window).length < total, 'the filter narrowed the list');

  window.document.getElementById('clear-filters').click();
  await flush(window);
  assert.equal(select.value, '');
  assert.equal(visibleRows(window).length, total, 'all lessons are visible again');
});

test('advanced combines correctly with the interactive-only toggle', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');

  const toggle = window.document.getElementById('interactive-filter');
  toggle.checked = true;
  toggle.dispatchEvent(new window.Event('change'));

  visibleRows(window).forEach(row => {
    assert.equal(row.dataset.level, 'advanced');
    assert.equal(row.dataset.interactive, 'true');
  });
});

test('advanced combines correctly with a topic selection', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');

  const topic = window.document.getElementById('topic-filter');
  topic.value = 'quality-engineering';
  topic.dispatchEvent(new window.Event('change'));

  const shown = visibleRows(window);
  assert.ok(shown.length >= 1, 'quality engineering has an advanced lesson');
  shown.forEach(row => {
    assert.equal(row.dataset.level, 'advanced');
    assert.equal(row.dataset.topic, 'quality-engineering');
  });
});

test('a topic with no advanced lesson yields an empty, honest result', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');

  const topic = window.document.getElementById('topic-filter');
  topic.value = 'project-management';
  topic.dispatchEvent(new window.Event('change'));

  assert.equal(visibleRows(window).length, 0, 'no lessons are shown');
  assert.equal(window.document.getElementById('results-count').textContent, '0 lessons');
});

test('sections with no advanced lesson are hidden rather than left empty', async () => {
  const window = await lessonsPage();
  selectLevel(window, 'advanced');

  Array.from(window.document.querySelectorAll('[data-category-section]')).forEach(section => {
    const hasVisible = Array.from(section.querySelectorAll('[data-lesson-item]'))
      .some(row => !row.hidden);
    assert.equal(section.hidden, !hasVisible, `${section.id} visibility tracks its contents`);
  });
});

test('switching from advanced back to All levels restores the full library', async () => {
  const window = await lessonsPage();
  const total = window.document.querySelectorAll('[data-lesson-item]').length;

  selectLevel(window, 'advanced');
  selectLevel(window, '');

  assert.equal(visibleRows(window).length, total);
  assert.equal(window.document.getElementById('featured-section').hidden, false);
});
