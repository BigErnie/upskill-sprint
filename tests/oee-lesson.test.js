'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const LESSON = path.join(ROOT, 'lessons', 'overall-equipment-effectiveness-oee.html');
const html = fs.readFileSync(LESSON, 'utf8');

function lessonWindow() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  return dom.window;
}

/* ---------- page contract ---------- */

test('the lesson carries the exact shared controller tags', () => {
  assert.equal(html.split('<script src="/theme.js"></script>').length - 1, 1);
  assert.equal(html.split('<script src="/site-sections.js"></script>').length - 1, 1);
});

test('the lesson meta block is valid JSON with the required keys', () => {
  const block = /UPSKILLSPRINT_LESSON_META\s*(\{[\s\S]*?\})\s*-->/.exec(html);
  assert.ok(block, 'meta block present');
  const meta = JSON.parse(block[1]);
  ['title', 'slug', 'category', 'category_slug', 'level', 'estimated_minutes',
   'interactive', 'card_title', 'card_description', 'search_keywords',
   'suggested_github_path'].forEach(k => assert.ok(k in meta, `meta.${k}`));
  assert.equal(meta.slug, 'overall-equipment-effectiveness-oee');
});

test('every referenced site asset exists', () => {
  ['/style.css', '/lessons-theme.css', '/theme.js', '/site-sections.js'].forEach(p => {
    assert.ok(fs.existsSync(path.join(ROOT, p)), `${p} exists at the site root`);
  });
});

test('the canonical lesson sections are all present', () => {
  const ids = new Set([...html.matchAll(/<section id="([a-z-]+)"/g)].map(m => m[1]));
  ['learning-objectives', 'prerequisites', 'key-concepts', 'terminology', 'procedure',
   'worked-example', 'mistakes', 'software', 'practice', 'quiz', 'summary', 'references']
    .forEach(id => assert.ok(ids.has(id), `missing canonical section: ${id}`));
});

test('every table of contents link resolves to a section', () => {
  const ids = new Set([...html.matchAll(/<section id="([a-z-]+)"/g)].map(m => m[1]));
  const toc = [...html.matchAll(/<li><a href="#([a-z-]+)"/g)].map(m => m[1]);
  toc.forEach(t => assert.ok(ids.has(t), `broken contents link: #${t}`));
  assert.ok(toc.length >= 20, 'contents list is complete');
});

/* ---------- runtime ---------- */

test('the page runs with no scripting errors and paints every interactive', () => {
  const win = lessonWindow();
  const d = win.document;
  assert.match(d.getElementById('c-a').textContent, /%/, 'calculator ran');
  assert.ok(d.querySelectorAll('#c-waterfall rect').length >= 4, 'waterfall drawn');
  assert.equal(d.querySelectorAll('#loss-grid .loss-btn').length, 8, 'eight loss buttons');
  assert.ok(d.querySelectorAll('#p-chart rect').length >= 7, 'pareto drawn');
  assert.ok(d.querySelectorAll('#t-chart rect').length >= 1, 'threshold chart drawn');
  assert.ok(d.querySelectorAll('#i-chart rect').length >= 3, 'priority chart drawn');
  assert.ok(d.getElementById('d-scenario').textContent.length > 40, 'drill seeded');
});

test('the worked example and the calculator agree', () => {
  const d = lessonWindow().document;
  assert.equal(d.getElementById('c-a').textContent.trim(), '82.2 %');
  assert.equal(d.getElementById('c-p').textContent.trim(), '86.5 %');
  assert.equal(d.getElementById('c-q').textContent.trim(), '96.3 %');
  assert.equal(d.getElementById('c-oee').textContent.trim(), '68.4 %');
  assert.match(html, /68\.44 %/, 'the prose quotes the same OEE');
});

test('the calculator reconciles its own checks by default', () => {
  const d = lessonWindow().document;
  const verdict = d.getElementById('c-verdict');
  assert.match(verdict.textContent, /checks passed/i);
  assert.ok(!verdict.classList.contains('bad'), 'no failure state on the defaults');
});

test('the calculator flags an impossible performance figure', () => {
  const win = lessonWindow();
  const d = win.document;
  const total = d.getElementById('c-total');
  total.value = '900';
  total.dispatchEvent(new win.Event('input'));
  const verdict = d.getElementById('c-verdict');
  assert.ok(verdict.classList.contains('bad'), 'verdict enters the failure state');
  assert.match(verdict.textContent, /above 100 %/);
});

test('OEE is invariant across the whole logging threshold range', () => {
  const win = lessonWindow();
  const d = win.document;
  const slider = d.getElementById('t-threshold');
  const seen = new Set();
  for (let t = 0; t <= 5.0001; t += 0.1) {
    slider.value = t.toFixed(1);
    slider.dispatchEvent(new win.Event('input'));
    seen.add(d.getElementById('t-oee').textContent.trim());
  }
  assert.deepEqual([...seen], ['68.4 %'],
    `OEE must not move as the threshold changes, saw ${[...seen].join(', ')}`);
});

test('availability and performance do move as the threshold changes', () => {
  const win = lessonWindow();
  const d = win.document;
  const slider = d.getElementById('t-threshold');
  const read = t => {
    slider.value = String(t);
    slider.dispatchEvent(new win.Event('input'));
    return [d.getElementById('t-a').textContent.trim(), d.getElementById('t-p').textContent.trim()];
  };
  const [a0, p0] = read(0);
  const [a5, p5] = read(5);
  assert.equal(a0, '75.6 %');
  assert.equal(a5, '82.2 %');
  assert.notEqual(p0, p5, 'performance moves in the opposite direction');
});

test('the priority panel always favours the weakest factor', () => {
  const win = lessonWindow();
  const d = win.document;
  const set = (a, p, q) => {
    d.getElementById('i-a').value = String(a);
    d.getElementById('i-p').value = String(p);
    d.getElementById('i-q').value = String(q);
    d.getElementById('i-q').dispatchEvent(new win.Event('input'));
    return d.getElementById('i-verdict').textContent;
  };
  assert.match(set(70, 95, 99), /Best return: Availability/);
  assert.match(set(99, 70, 95), /Best return: Performance/);
  assert.match(set(95, 99, 70), /Best return: Quality/);
});

test('the loss explorer covers all eight losses and assigns each a factor', () => {
  const d = lessonWindow().document;
  const buttons = [...d.querySelectorAll('#loss-grid .loss-btn')];
  assert.equal(buttons.length, 8);
  const buckets = buttons.map(b => b.dataset.bucket);
  assert.equal(buckets.filter(b => b === 'availability').length, 4);
  assert.equal(buckets.filter(b => b === 'performance').length, 2);
  assert.equal(buckets.filter(b => b === 'quality').length, 2);
});

test('the two commonly confused losses are classified correctly', () => {
  const win = lessonWindow();
  const d = win.document;
  const byName = name => [...d.querySelectorAll('#loss-grid .loss-btn')]
    .find(b => b.textContent.toLowerCase().includes(name));
  assert.equal(byName('setup').dataset.bucket, 'availability');
  assert.equal(byName('minor stoppages').dataset.bucket, 'performance');
});

test('the drill scores a correct answer and advances', () => {
  const win = lessonWindow();
  const d = win.document;
  const click = sel => d.querySelector(sel).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  const before = d.getElementById('d-scenario').textContent;
  ['[data-drill="availability"]', '[data-drill="performance"]', '[data-drill="quality"]']
    .forEach(sel => click(sel));
  assert.equal(d.getElementById('d-feedback').hidden, false, 'feedback shown');
  click('#d-next');
  assert.notEqual(d.getElementById('d-scenario').textContent, before, 'advanced to a new scenario');
});

/* ---------- quiz ---------- */

test('the quiz has answerable questions with both feedback strings', () => {
  const d = lessonWindow().document;
  const qs = [...d.querySelectorAll('.quiz-q')];
  assert.ok(qs.length >= 6, 'enough questions');
  qs.forEach(q => {
    assert.ok(q.dataset.answer, 'answer key present');
    const fb = q.querySelector('.quiz-feedback');
    assert.ok(fb.dataset.correct && fb.dataset.incorrect, 'both feedback strings present');
    const values = [...q.querySelectorAll("input[type='radio']")].map(i => i.value);
    assert.ok(values.includes(q.dataset.answer), 'the answer key matches an option');
  });
});

test('an unanswered question shows a visible prompt', () => {
  /* lessons-theme.css hides .quiz-feedback unless correct/incorrect is set,
     so the prompt needs its own visibility class or it renders invisible. */
  const win = lessonWindow();
  const d = win.document;
  d.getElementById('quiz-submit').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  const fb = d.querySelector('.quiz-q .quiz-feedback');
  assert.match(fb.textContent, /Choose an answer/);
  assert.ok(fb.classList.contains('notice'), 'carries a class that makes it visible');
});

test('completing the quiz dispatches upskill-quiz-result', () => {
  const win = lessonWindow();
  const d = win.document;
  let detail = null;
  d.addEventListener('upskill-quiz-result', e => { detail = e.detail; });

  [...d.querySelectorAll('.quiz-q')].forEach(q => {
    q.querySelector(`input[value="${q.dataset.answer}"]`).checked = true;
  });
  d.getElementById('quiz-submit').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

  assert.ok(detail, 'event fired');
  assert.equal(detail.score, detail.total, 'all answers correct');
  assert.equal(detail.total, d.querySelectorAll('.quiz-q').length);
});

/* ---------- library registration ---------- */

test('the lesson is registered in the lesson library', () => {
  const lib = fs.readFileSync(path.join(ROOT, 'chi-square-lesson-library.js'), 'utf8');
  assert.match(lib, /data-overall-equipment-effectiveness/);
  assert.match(lib, /\/lessons\/overall-equipment-effectiveness-oee/);
});

test('the library injects the card into the Lean Six Sigma section', async () => {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'lessons.html'), 'utf8'), {
    runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'https://upskillsprint.com/lessons.html'
  });
  const win = dom.window;
  win.eval(fs.readFileSync(path.join(ROOT, 'chi-square-lesson-library.js'), 'utf8'));
  /* installLessons defers through DOMContentLoaded and a zero timeout. */
  await new Promise(r => setTimeout(r, 80));
  const row = win.document.querySelector('[data-overall-equipment-effectiveness]');
  assert.ok(row, 'card injected');
  assert.equal(row.getAttribute('href'), '/lessons/overall-equipment-effectiveness-oee');
  assert.equal(row.closest('section').id, 'lean-six-sigma');
  assert.ok(row.hasAttribute('data-lesson-item'), 'filterable by the library controls');
});

test('the library path matches the file on disk', () => {
  const lib = fs.readFileSync(path.join(ROOT, 'chi-square-lesson-library.js'), 'utf8');
  const m = /path: '(\/lessons\/overall-equipment-effectiveness-oee)'/.exec(lib);
  assert.ok(m, 'path present');
  assert.ok(fs.existsSync(path.join(ROOT, m[1] + '.html')),
    'the pretty URL resolves to a real file');
});
