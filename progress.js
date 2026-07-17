/* Lesson progress controller for UpSkill Sprint Consulting (Stage 2).
   Loaded site-wide by site-sections.js after /auth.js. Uses the shared
   Supabase client exposed by window.UpskillAuth.

   Behavior:
   - Lesson pages (/lessons/...): injects a progress card before the footer.
     Signed out -> invitation to sign in. Signed in -> automatic "in progress"
     tracking, best quiz score, and a Mark-complete button.
   - Quiz capture is non-invasive: lessons may dispatch
       document.dispatchEvent(new CustomEvent('upskill-quiz-result',
         { detail: { score: 4, total: 5 } }))
     and for existing lessons a MutationObserver watches quiz score/status
     elements and parses "4 out of 5" style text. The best score is kept.
   - Lessons index (/lessons): adds Completed / In progress badges to
     lesson rows, including rows injected dynamically after load.

   All data lives in public.lesson_progress, protected by Row Level
   Security (each user can only touch their own rows). */
(function () {
  'use strict';

  var TABLE = 'lesson_progress';

  /* ---------- Path helpers ---------- */

  function normalizeSlug(path) {
    var slug = String(path || '').replace(/\/+$/, '').replace(/\.html$/, '');
    return slug === '' ? '/' : slug;
  }

  var PAGE_SLUG = normalizeSlug(window.location.pathname);

  function isLessonPage() {
    return PAGE_SLUG.indexOf('/lessons/') === 0;
  }

  function isLessonsIndex() {
    return PAGE_SLUG === '/lessons';
  }

  /* ---------- Auth / database access ---------- */

  function getAuth() {
    return window.UpskillAuth || null;
  }

  function getClient() {
    var auth = getAuth();
    return auth && typeof auth.getClient === 'function' ? auth.getClient() : null;
  }

  function getUser() {
    var auth = getAuth();
    return auth ? auth.getUser() : null;
  }

  function fetchProgress(slug) {
    var client = getClient();
    if (!client) return Promise.resolve(null);
    return client.from(TABLE).select('*').eq('lesson_slug', slug).maybeSingle()
      .then(function (result) { return result && !result.error ? result.data : null; });
  }

  function fetchAllProgress() {
    var client = getClient();
    if (!client) return Promise.resolve([]);
    return client.from(TABLE).select('lesson_slug,status,quiz_score,quiz_total')
      .then(function (result) { return result && !result.error && result.data ? result.data : []; });
  }

  function upsertProgress(fields) {
    var client = getClient();
    var user = getUser();
    if (!client || !user) return Promise.resolve(null);
    var row = Object.assign({ user_id: user.id, lesson_slug: PAGE_SLUG }, fields);
    return client.from(TABLE).upsert(row, { onConflict: 'user_id,lesson_slug' })
      .then(function (result) { return result && !result.error ? row : null; });
  }

  /* ---------- Lesson page: progress widget ---------- */

  var currentRow = null;

  function injectWidgetStyles() {
    if (document.getElementById('lesson-progress-styles')) return;
    var style = document.createElement('style');
    style.id = 'lesson-progress-styles';
    style.textContent = [
      '#lesson-progress-widget { max-width: 720px; margin: 40px auto; padding: 0 20px; }',
      '#lesson-progress-widget .lp-card { background: var(--card, #ffffff);',
      '  border: 1px solid var(--line, #e3e7ee); border-radius: var(--radius, 6px);',
      '  padding: 22px 24px; font-family: "Work Sans", Arial, sans-serif; }',
      '#lesson-progress-widget .lp-label { font-size: 12px; font-weight: 700;',
      '  letter-spacing: .08em; text-transform: uppercase; color: var(--teal, #0e7490); margin: 0 0 8px; }',
      '#lesson-progress-widget p { margin: 0 0 6px; font-size: 14.5px; color: var(--ink, #101828); }',
      '#lesson-progress-widget .lp-muted { color: var(--muted, #667085); }',
      '#lesson-progress-widget .lp-actions { margin-top: 14px; }',
      '#lesson-progress-complete { padding: 11px 20px; border-radius: var(--radius, 6px);',
      '  border: none; background: var(--teal, #0e7490); color: #fff; font-family: inherit;',
      '  font-size: 14px; font-weight: 600; cursor: pointer; }',
      '#lesson-progress-complete:hover { background: var(--teal-dark, #0a5a70); }',
      '#lesson-progress-complete[disabled] { cursor: default; opacity: .85; }',
      '#lesson-progress-widget a { color: var(--teal, #0e7490); font-weight: 600; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureWidgetContainer() {
    var existing = document.getElementById('lesson-progress-widget');
    if (existing) return existing;
    injectWidgetStyles();
    var container = document.createElement('div');
    container.id = 'lesson-progress-widget';
    var footer = document.querySelector('footer');
    if (footer && footer.parentNode) footer.parentNode.insertBefore(container, footer);
    else document.body.appendChild(container);
    return container;
  }

  function renderWidget() {
    if (!isLessonPage()) return;
    var auth = getAuth();
    if (!auth || !auth.isConfigured()) return;

    var container = ensureWidgetContainer();
    var user = getUser();
    container.textContent = '';

    var card = document.createElement('div');
    card.className = 'lp-card';

    var label = document.createElement('p');
    label.className = 'lp-label';
    label.textContent = 'Your progress';
    card.appendChild(label);

    if (!user) {
      var invite = document.createElement('p');
      invite.innerHTML = 'Want to save your progress and quiz scores for this lesson? ' +
        '<a href="/sign-in.html">Sign in</a> or <a href="/signup.html">create a free account</a>.';
      card.appendChild(invite);
      container.appendChild(card);
      return;
    }

    var statusLine = document.createElement('p');
    statusLine.id = 'lesson-progress-status';
    if (currentRow && currentRow.status === 'completed') {
      statusLine.textContent = 'Lesson completed. Nice work.';
    } else {
      statusLine.textContent = 'In progress \u2014 saves to your account automatically.';
    }
    card.appendChild(statusLine);

    var quizLine = document.createElement('p');
    quizLine.id = 'lesson-progress-quiz';
    quizLine.className = 'lp-muted';
    if (currentRow && currentRow.quiz_score != null && currentRow.quiz_total != null) {
      quizLine.textContent = 'Best quiz score: ' + currentRow.quiz_score + ' of ' + currentRow.quiz_total + '.';
    } else {
      quizLine.textContent = 'Take the quiz and your best score will be saved here.';
    }
    card.appendChild(quizLine);

    var actions = document.createElement('div');
    actions.className = 'lp-actions';
    var completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.id = 'lesson-progress-complete';
    if (currentRow && currentRow.status === 'completed') {
      completeBtn.textContent = 'Completed';
      completeBtn.disabled = true;
    } else {
      completeBtn.textContent = 'Mark lesson complete';
      completeBtn.addEventListener('click', function () {
        completeBtn.disabled = true;
        upsertProgress({
          status: 'completed',
          quiz_score: currentRow ? currentRow.quiz_score : null,
          quiz_total: currentRow ? currentRow.quiz_total : null,
          updated_at: new Date().toISOString()
        }).then(function (row) {
          if (row) { currentRow = row; renderWidget(); }
          else { completeBtn.disabled = false; }
        });
      });
    }
    actions.appendChild(completeBtn);
    card.appendChild(actions);

    container.appendChild(card);
  }

  function startLessonTracking(user) {
    if (!user) { currentRow = null; renderWidget(); return; }
    fetchProgress(PAGE_SLUG).then(function (row) {
      if (row) {
        currentRow = row;
        renderWidget();
      } else {
        upsertProgress({ status: 'in_progress', updated_at: new Date().toISOString() }).then(function (created) {
          currentRow = created || { status: 'in_progress', quiz_score: null, quiz_total: null };
          renderWidget();
        });
      }
    });
  }

  /* ---------- Quiz capture ---------- */

  var lastSaved = '';

  function saveQuizResult(score, total) {
    score = parseInt(score, 10);
    total = parseInt(total, 10);
    if (!isLessonPage() || !getUser()) return;
    if (isNaN(score) || isNaN(total) || total <= 0 || score < 0 || score > total) return;

    var key = score + '/' + total;
    if (key === lastSaved) return;

    var bestScore = score;
    var bestTotal = total;
    if (currentRow && currentRow.quiz_score != null && currentRow.quiz_total === total &&
        currentRow.quiz_score > score) {
      bestScore = currentRow.quiz_score;
      bestTotal = currentRow.quiz_total;
    }
    lastSaved = key;

    upsertProgress({
      status: currentRow && currentRow.status === 'completed' ? 'completed' : 'in_progress',
      quiz_score: bestScore,
      quiz_total: bestTotal,
      updated_at: new Date().toISOString()
    }).then(function (row) {
      if (row) { currentRow = row; renderWidget(); }
    });
  }

  var SCORE_PATTERN = /(\d+)\s*(?:out of|of|\/)\s*(\d+)/i;
  var SCORE_TARGET_SELECTOR = '#quiz-score, [id$="quiz-score"], [data-quiz-score], .quiz-score';

  function parseScoreElement(element) {
    if (!element || !element.textContent) return;
    var match = element.textContent.match(SCORE_PATTERN);
    if (match) saveQuizResult(match[1], match[2]);
  }

  function watchQuizElements() {
    if (!isLessonPage()) return;

    document.addEventListener('upskill-quiz-result', function (event) {
      var detail = event && event.detail ? event.detail : {};
      saveQuizResult(detail.score, detail.total);
    });

    if (typeof MutationObserver !== 'function') return;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var node = mutation.target;
        if (node && node.nodeType === 3) node = node.parentElement; /* text node */
        if (!node || typeof node.closest !== 'function') return;
        var scoreElement = node.closest(SCORE_TARGET_SELECTOR);
        if (scoreElement) parseScoreElement(scoreElement);
      });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  /* ---------- Lessons index: badges ---------- */

  function injectBadgeStyles() {
    if (document.getElementById('lesson-progress-badge-styles')) return;
    var style = document.createElement('style');
    style.id = 'lesson-progress-badge-styles';
    style.textContent = [
      '.lesson-progress-badge { display: inline-block; padding: 2px 9px; border-radius: 999px;',
      '  font-size: 11.5px; font-weight: 700; letter-spacing: .03em; }',
      '.lesson-progress-badge.lp-completed { background: var(--teal, #0e7490); color: #fff; }',
      '.lesson-progress-badge.lp-in-progress { background: var(--tint, #f5f7fa);',
      '  color: var(--teal, #0e7490); border: 1px solid var(--line, #e3e7ee); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  var progressBySlug = null;

  function badgeForRow(link) {
    if (!progressBySlug || link.querySelector('.lesson-progress-badge')) return;
    var slug;
    try { slug = normalizeSlug(new URL(link.href, window.location.origin).pathname); }
    catch (error) { return; }
    var row = progressBySlug[slug];
    if (!row) return;

    var badge = document.createElement('span');
    badge.className = 'lesson-progress-badge ' +
      (row.status === 'completed' ? 'lp-completed' : 'lp-in-progress');
    badge.textContent = row.status === 'completed' ? 'Completed' : 'In progress';

    var meta = link.querySelector('.lesson-meta');
    if (meta) meta.appendChild(badge);
    else link.appendChild(badge);
  }

  function applyBadges() {
    if (!progressBySlug) return;
    injectBadgeStyles();
    Array.prototype.forEach.call(document.querySelectorAll('a[data-lesson-item]'), badgeForRow);
  }

  function clearBadges() {
    Array.prototype.forEach.call(document.querySelectorAll('.lesson-progress-badge'), function (badge) {
      badge.parentNode.removeChild(badge);
    });
  }

  function startIndexBadges(user) {
    if (!user) { progressBySlug = null; clearBadges(); return; }
    fetchAllProgress().then(function (rows) {
      progressBySlug = {};
      rows.forEach(function (row) { progressBySlug[normalizeSlug(row.lesson_slug)] = row; });
      applyBadges();
    });

    if (typeof MutationObserver === 'function' && !startIndexBadges.observing) {
      startIndexBadges.observing = true;
      new MutationObserver(function () { applyBadges(); })
        .observe(document.body, { subtree: true, childList: true });
    }
  }

  /* ---------- Wiring ---------- */

  function start() {
    var auth = getAuth();
    if (!auth) return;

    if (isLessonPage()) {
      watchQuizElements();
      auth.onChange(function (user) {
        lastSaved = '';
        startLessonTracking(user);
      });
      renderWidget();
    } else if (isLessonsIndex()) {
      auth.onChange(function (user) { startIndexBadges(user); });
    }

    window.UpskillProgress = {
      saveQuiz: saveQuizResult,
      markComplete: function () {
        return upsertProgress({ status: 'completed', updated_at: new Date().toISOString() });
      },
      getCurrent: function () { return currentRow; }
    };
  }

  function initialize() {
    if (window.UpskillAuth) start();
    else document.addEventListener('upskill-auth-ready', start, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}());
