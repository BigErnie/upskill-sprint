(function () {
  'use strict';

  function q(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  const lessonProfiles = {
    '/lessons/7-essential-quality-tools': {
      level: 'beginner',
      minutes: 30,
      title: 'The 7 Essential Quality Tools',
      objectives: [
        'Select the quality tool that matches the question being investigated.',
        'Explain the input, output, limitation, and usual successor of each tool.',
        'Interpret common patterns in process maps, Pareto charts, histograms, scatter plots, and control charts.',
        'Apply the tools in sequence to a realistic manufacturing investigation.'
      ],
      summary: [
        'Start with the question, not with a favourite chart.',
        'Map the process before deciding where to collect evidence.',
        'Stratify mixed populations before interpreting pooled results.',
        'Pareto prioritizes; it does not prove cause.',
        'Fishbone branches are hypotheses until they are tested.',
        'Control charts distinguish common-cause and special-cause variation.'
      ],
      next: '/lessons/7-management-planning-tools'
    },
    '/lessons/7-management-planning-tools': {
      level: 'intermediate',
      minutes: 35,
      title: 'The 7 Management & Planning Tools',
      objectives: [
        'Choose the planning tool that matches the team’s immediate implementation need.',
        'Organize ideas, expose drivers, decompose goals, and prioritize alternatives.',
        'Assign ownership and identify implementation risks and dependencies.',
        'Build an executable corrective-action sequence from a validated cause.'
      ],
      summary: [
        'Use planning tools after evidence has established a credible problem and cause.',
        'Affinity organizes ideas but does not rank them.',
        'Interrelationship diagrams expose influence, not statistical causation.',
        'Tree diagrams continue until the leaves are assignable actions.',
        'Agree on criteria and weights before scoring alternatives.',
        'PDPC stress-tests the plan; activity networks expose schedule risk.'
      ],
      next: '/lessons/complete-14-quality-tools-project'
    },
    '/lessons/complete-14-quality-tools-project': {
      level: 'advanced',
      minutes: 45,
      title: 'The Complete Quality Toolbox',
      objectives: [
        'Diagnose the earliest unresolved question in an investigation.',
        'Sequence basic, planning, statistical, and control tools using dependency logic.',
        'Distinguish descriptive evidence, inferential evidence, experimental evidence, and sustainment evidence.',
        'Build a defensible end-to-end quality investigation and corrective-action pathway.'
      ],
      summary: [
        'Advanced methods cannot rescue poor scope, traceability, or measurement.',
        'Use descriptive tools to expose patterns before testing explanations.',
        'Treat brainstormed causes as hypotheses rather than conclusions.',
        'Match the statistical method to the objective, response type, and design.',
        'Use DOE only when deliberate factor changes are safe and feasible.',
        'Close the project only after ownership, reaction plans, and time-ordered stability are established.'
      ],
      next: '/lessons.html#quality-engineering'
    }
  };

  function normalizedPath() {
    return location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  }

  function getProfile() {
    return lessonProfiles[normalizedPath()] || null;
  }

  function installCourseChrome() {
    if (!q('.skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#lesson-content';
      skip.textContent = 'Skip to lesson content';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    if (!q('header.site')) {
      const fragment = document.createDocumentFragment();
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'mnav-check';
      checkbox.className = 'mnav-check';
      checkbox.setAttribute('aria-hidden', 'true');

      const header = document.createElement('header');
      header.className = 'site lesson-sitebar';
      header.innerHTML = `
        <a href="/" class="brand">
          <img src="/assets/logo-icon.png" alt="UpSkill Sprint Consulting logo">
          <span>UpSkill Sprint Consulting</span>
        </a>
        <nav class="desktop-nav" aria-label="Primary navigation">
          <a href="/start-here.html">Start Here</a>
          <a href="/lessons.html" aria-current="page">Lessons</a>
          <a href="/services.html">Services</a>
          <a href="/request-topic.html">Request a Topic</a>
          <a href="/about.html">About</a>
          <a href="/faq.html">FAQ</a>
          <a href="/contact.html">Contact</a>
        </nav>
        <a class="lesson-back-link" href="/lessons.html#quality-engineering">Back to Quality Engineering</a>
        <button class="theme-toggle" type="button" data-theme-toggle="true" role="switch" aria-checked="false" aria-label="Toggle light and dark mode">Theme</button>
        <label for="mnav-check" class="mobile-menu-btn" aria-label="Open menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </label>`;

      const mobile = document.createElement('nav');
      mobile.className = 'mobile-nav';
      mobile.setAttribute('aria-label', 'Mobile navigation');
      mobile.innerHTML = `
        <a href="/start-here.html">Start Here</a>
        <a href="/lessons.html">Lessons</a>
        <a href="/services.html">Services</a>
        <a href="/request-topic.html">Request a Topic</a>
        <a href="/about.html">About</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>`;

      fragment.appendChild(checkbox);
      fragment.appendChild(header);
      fragment.appendChild(mobile);
      document.body.insertBefore(fragment, q('main') || document.body.firstChild);
    } else {
      q('header.site').classList.add('lesson-sitebar');
    }

    if (!q('footer.site')) {
      const footer = document.createElement('footer');
      footer.className = 'site lesson-footer';
      footer.innerHTML = `
        <div class="wrap">
          <div class="footer-grid">
            <div><div class="brand"><img src="/assets/logo-icon.png" alt="UpSkill Sprint Consulting logo"><span>UpSkill Sprint Consulting</span></div><p>Practical learning for quality, data, process improvement, and business problem-solving.</p></div>
            <div><h4>Quick Links</h4><a href="/">Home</a><a href="/start-here.html">Start Here</a><a href="/lessons.html">Lessons</a><a href="/request-topic.html">Request a Topic</a></div>
            <div><h4>Topics</h4><a href="/lessons.html#quality-engineering">Quality Engineering</a><a href="/lessons.html#lean-six-sigma">Lean Six Sigma</a><a href="/lessons.html#statistics">Statistics</a></div>
            <div><h4>Contact</h4><a href="mailto:skillsprintconsulting@gmail.com">skillsprintconsulting@gmail.com</a><p>Saskatchewan, Canada</p></div>
          </div>
        </div>`;
      document.body.appendChild(footer);
    } else {
      q('footer.site').classList.add('lesson-footer');
    }
  }

  function installThemeToggle() {
    const button = q('[data-theme-toggle="true"]');
    if (!button) return;
    function sync() {
      const dark = document.documentElement.dataset.theme === 'dark';
      button.setAttribute('aria-checked', String(dark));
      button.textContent = dark ? 'Light mode' : 'Dark mode';
    }
    button.addEventListener('click', function () {
      const dark = document.documentElement.dataset.theme === 'dark';
      document.documentElement.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('theme', dark ? 'light' : 'dark'); } catch (error) { /* storage optional */ }
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: document.documentElement.dataset.theme } }));
      sync();
    });
    sync();
  }

  function findSectionByHeading(pattern) {
    return qa('main section').find(function (section) {
      const heading = q('h2, h1, h3', section);
      return heading && pattern.test(heading.textContent);
    });
  }

  function createObjectives(profile) {
    const section = document.createElement('section');
    section.id = 'learning-objectives';
    section.className = 'lesson-requirement-section';
    section.innerHTML = '<h2>Learning objectives</h2><p>By the end of this lesson, you will be able to:</p><ol>' + profile.objectives.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ol><h3>Prerequisites</h3><p>No specialist software is required. Familiarity with basic quality terminology is helpful, but the lesson explains the required concepts before using them.</p>';
    return section;
  }

  function createToc() {
    const nav = document.createElement('nav');
    nav.className = 'lesson-toc';
    nav.setAttribute('aria-label', 'Lesson contents');
    nav.innerHTML = `
      <h2>In this lesson</h2>
      <ol>
        <li><a href="#learning-objectives">Learning objectives</a></li>
        <li><a href="#key-concepts">Key concepts</a></li>
        <li><a href="#worked-example">Worked example</a></li>
        <li><a href="#practice">Practice activity</a></li>
        <li><a href="#quiz">Mini quiz</a></li>
        <li><a href="#summary">Summary</a></li>
      </ol>`;
    return nav;
  }

  function createPractice(profile) {
    const section = document.createElement('section');
    section.id = 'practice';
    section.className = 'lesson-requirement-section';
    const isPlanning = profile.level === 'intermediate';
    const isAdvanced = profile.level === 'advanced';
    const question = isPlanning
      ? 'A team has 18 corrective-action ideas, no agreed categories, and no evidence that one idea is more important than another. What should the team do first?'
      : isAdvanced
        ? 'A regression links finish temperature to yield strength, but original/retest linkage and extensometer agreement remain uncertain. Should the team proceed directly to DOE?'
        : 'A pooled tensile-failure rate looks moderate, but operators suspect one shift is carrying most failures. Which tool should be used before building the Pareto chart?';
    const answer = isPlanning
      ? '<strong>Use an Affinity Diagram first.</strong> Organize the raw ideas into natural themes before applying influence, decomposition, or prioritization logic. Do not score a disorganized list.'
      : isAdvanced
        ? '<strong>No.</strong> Resolve linkage and measurement-system uncertainty first. Regression cannot distinguish process variation from incorrect pairing or measurement variation, and DOE should not optimize a system whose response is not yet trustworthy.'
        : '<strong>Use stratification first.</strong> Split the data by shift and other plausible subgroups. Then build the Pareto inside the subgroup carrying the signal so the dominant failure mode is not diluted by pooled data.';
    section.innerHTML = '<h2>Practice activity</h2><div class="practice-card"><p><strong>Scenario:</strong> ' + question + '</p><p><strong>Instruction:</strong> Select the most defensible next step and explain why it must occur before later tools.</p><button type="button" class="lesson-action-button" data-reveal-answer aria-expanded="false">Reveal answer</button><div class="practice-answer" hidden aria-live="polite"><p>' + answer + '</p></div></div>';
    return section;
  }

  function quizQuestions(profile) {
    if (profile.level === 'beginner') {
      return [
        ['Which tool should be used to expose mixed populations?', ['Pareto chart', 'Stratification', 'Fishbone diagram'], 1, 'Stratification separates data by meaningful subgroups before pooled conclusions are made.'],
        ['What does a Pareto chart establish?', ['The root cause', 'The highest-priority categories', 'Process stability'], 1, 'Pareto ranks categories; it does not establish cause or stability.'],
        ['A fishbone branch should be treated as:', ['A confirmed root cause', 'A testable hypothesis', 'A control limit'], 1, 'Fishbone diagrams organize possibilities that still require evidence.'],
        ['Which chart preserves time order?', ['Histogram', 'Control chart', 'Pareto chart'], 1, 'A control chart plots results over time and applies probability-based limits.'],
        ['What should normally follow a process map?', ['A traceable data-collection plan', 'Immediate DOE', 'Project closure'], 0, 'The map identifies where evidence should be collected and what traceability is required.']
      ];
    }
    if (profile.level === 'intermediate') {
      return [
        ['Which tool organizes many raw ideas into themes?', ['Affinity diagram', 'Activity network', 'PDPC'], 0, 'Affinity grouping creates structure before ranking or scheduling.'],
        ['What is the main output of a Tree Diagram?', ['Statistical significance', 'Assignable tasks', 'Control limits'], 1, 'A tree decomposes a goal until the leaves are specific actions.'],
        ['When should prioritization weights be agreed?', ['Before scoring', 'After seeing the ranking', 'Only if scores tie'], 0, 'Weights set after scoring invite reverse engineering and bias.'],
        ['Which tool stress-tests a proposed implementation plan?', ['Matrix diagram', 'PDPC', 'Histogram'], 1, 'PDPC anticipates failure and develops countermeasures.'],
        ['Which tool identifies the critical path?', ['Activity Network Diagram', 'Affinity Diagram', 'Pareto Chart'], 0, 'The activity network uses task durations and dependencies to expose the critical path.']
      ];
    }
    return [
      ['What must be established before capability analysis?', ['A stable process and adequate MSA', 'A fishbone only', 'A large sample only'], 0, 'Capability is meaningful only when measurement is adequate and the process is stable.'],
      ['Correlation from observational data proves:', ['Causation', 'Association only', 'Successful control'], 1, 'Observational association may be confounded and does not prove causal direction.'],
      ['When is DOE most defensible?', ['Before defining the response', 'After credible factors, safe ranges, and MSA are established', 'Whenever regression is significant'], 1, 'DOE requires a trustworthy response, controlled execution, and technically credible factors.'],
      ['What closes the improvement loop?', ['One favourable result', 'SPC, reaction plan, ownership, and handoff', 'A completed fishbone'], 1, 'Sustainment requires time-ordered monitoring and explicit operational response.'],
      ['A brainstormed cause should advance to implementation when:', ['The team votes for it', 'It has adequate validation and implementation risk is controlled', 'It appears first on a fishbone'], 1, 'Implementation should follow validation, not preference or brainstorming position.']
    ];
  }

  function createQuiz(profile) {
    const section = document.createElement('section');
    section.id = 'quiz';
    section.className = 'lesson-requirement-section lesson-guide-quiz';
    const questions = quizQuestions(profile);
    section.innerHTML = '<h2>Mini quiz</h2><p>Answer all five questions, then submit your responses.</p><form novalidate>' + questions.map(function (item, index) {
      return '<fieldset data-quiz-question data-correct="' + item[2] + '"><legend>' + (index + 1) + '. ' + item[0] + '</legend>' + item[1].map(function (option, optionIndex) {
        return '<label><input type="radio" name="guide-q' + index + '" value="' + optionIndex + '"> <span>' + option + '</span></label>';
      }).join('') + '<p class="quiz-explanation" hidden>' + item[3] + '</p></fieldset>';
    }).join('') + '<div class="quiz-actions"><button type="submit" class="lesson-action-button">Submit quiz</button><button type="reset" class="lesson-action-button secondary">Reset quiz</button></div><p class="quiz-score" aria-live="polite"></p></form>';
    return section;
  }

  function createSummary(profile) {
    const section = document.createElement('section');
    section.id = 'summary';
    section.className = 'lesson-requirement-section';
    section.innerHTML = '<h2>Summary</h2><ul>' + profile.summary.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul><div class="remember-box"><strong>Decision rule:</strong> use the least-complex tool that answers the current unresolved question with defensible evidence.<br><strong>Remember this:</strong> sequence follows evidence, not habit.</div><p><strong>Suggested next lesson:</strong> <a href="' + profile.next + '">Continue the quality-tools learning path</a>.</p>';
    return section;
  }

  function installLessonContract() {
    const profile = getProfile();
    const main = q('main');
    if (!profile || !main) return;

    document.body.dataset.lessonPage = 'true';
    document.body.dataset.category = 'quality-engineering';
    document.body.dataset.level = profile.level;
    document.body.dataset.interactive = 'true';
    main.id = 'lesson-content';
    main.setAttribute('tabindex', '-1');

    let wrapper = q('.lesson-wrapper', main);
    if (!wrapper) {
      wrapper = document.createElement('article');
      wrapper.className = 'lesson-wrapper';
      while (main.firstChild) wrapper.appendChild(main.firstChild);
      main.appendChild(wrapper);
    }

    const hero = q('section', wrapper);
    if (!q('.lesson-toc', wrapper)) wrapper.insertBefore(createToc(), hero ? hero.nextSibling : wrapper.firstChild);
    if (!q('#learning-objectives', wrapper)) {
      const toc = q('.lesson-toc', wrapper);
      wrapper.insertBefore(createObjectives(profile), toc ? toc.nextSibling : wrapper.firstChild);
    }

    let keyConcepts = q('#key-concepts', wrapper);
    if (!keyConcepts) {
      keyConcepts = findSectionByHeading(/sequence|strategic|problem solver|explore every tool/i);
      if (keyConcepts) keyConcepts.id = 'key-concepts';
    }

    let worked = q('#worked-example', wrapper);
    if (!worked) {
      worked = findSectionByHeading(/investigation challenge|steel manufacturing investigation|prioritization matrix|worked example/i);
      if (worked) worked.id = 'worked-example';
    }

    const insertionPoint = q('.lesson-footer') || wrapper.lastElementChild;
    if (!q('#practice', wrapper)) wrapper.insertBefore(createPractice(profile), insertionPoint && insertionPoint.parentNode === wrapper ? insertionPoint : null);
    if (!q('#quiz', wrapper)) wrapper.insertBefore(createQuiz(profile), insertionPoint && insertionPoint.parentNode === wrapper ? insertionPoint : null);
    if (!q('#summary', wrapper)) wrapper.insertBefore(createSummary(profile), insertionPoint && insertionPoint.parentNode === wrapper ? insertionPoint : null);
  }

  function installRevealPanels() {
    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-reveal-answer]');
      if (!button) return;
      const answer = q('.practice-answer', button.parentElement);
      const show = answer.hidden;
      answer.hidden = !show;
      button.setAttribute('aria-expanded', String(show));
      button.textContent = show ? 'Hide answer' : 'Reveal answer';
    });
  }

  function installGuideQuiz() {
    const quiz = q('.lesson-guide-quiz form');
    if (!quiz) return;
    quiz.addEventListener('submit', function (event) {
      event.preventDefault();
      const fields = qa('[data-quiz-question]', quiz);
      let score = 0;
      let missing = 0;
      fields.forEach(function (field) {
        const selected = q('input:checked', field);
        qa('label', field).forEach(function (label) { label.classList.remove('correct-answer', 'incorrect-answer'); });
        const explanation = q('.quiz-explanation', field);
        explanation.hidden = false;
        if (!selected) {
          missing += 1;
          field.classList.add('needs-answer');
          return;
        }
        field.classList.remove('needs-answer');
        const correct = Number(field.dataset.correct);
        if (Number(selected.value) === correct) {
          score += 1;
          selected.closest('label').classList.add('correct-answer');
        } else {
          selected.closest('label').classList.add('incorrect-answer');
          const correctInput = q('input[value="' + correct + '"]', field);
          if (correctInput) correctInput.closest('label').classList.add('correct-answer');
        }
      });
      q('.quiz-score', quiz).textContent = missing ? 'Please answer all five questions. Current score: ' + score + ' of 5.' : 'Score: ' + score + ' of 5.';
    });
    quiz.addEventListener('reset', function () {
      window.setTimeout(function () {
        qa('[data-quiz-question]', quiz).forEach(function (field) {
          field.classList.remove('needs-answer');
          qa('label', field).forEach(function (label) { label.classList.remove('correct-answer', 'incorrect-answer'); });
          q('.quiz-explanation', field).hidden = true;
        });
        q('.quiz-score', quiz).textContent = '';
      }, 0);
    });
  }

  function installProgress() {
    const progress = q('[data-progress]');
    if (!progress) return;
    const key = 'qt-progress-' + location.pathname;
    let done = Number(localStorage.getItem(key) || 0);
    progress.style.width = done + '%';
    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-complete]');
      if (!button) return;
      done = 100;
      localStorage.setItem(key, done);
      progress.style.width = '100%';
      button.textContent = 'Completed ✓';
    });
  }

  function installAdvancedStatSelector() {
    const run = q('#stat-run');
    if (!run) return;
    run.onclick = function () {
      const objective = q('#stat-objective').value;
      const response = q('#stat-response').value;
      const factors = q('#stat-factors').value;
      const controlled = q('#stat-control').value;
      let method = '';
      let explanation = '';
      if (objective === 'optimize') {
        if (controlled === 'yes') {
          method = factors === '3' ? 'Screening factorial DOE, followed by response-surface optimization when needed' : 'Full factorial DOE with confirmation runs';
          explanation = 'Experimentation can estimate factor effects and interactions under controlled changes.';
        } else {
          method = 'Observational screening, stratification, and regression before DOE';
          explanation = 'Uncontrolled observations can identify plausible factors but cannot establish a defensible optimum. Address confounding and determine whether a controlled experiment can be run.';
        }
      } else if (objective === 'compare') {
        if (response === 'continuous') {
          if (factors === '1') method = 'One-sample t-test against a target or paired t-test for matched observations';
          else if (factors === '2') method = 'Two-sample t-test, paired t-test, or two-factor model depending on the design';
          else method = 'One-way or factorial ANOVA / general linear model';
        } else {
          method = response === 'binary' ? 'Proportions test, chi-square test, or logistic regression' : 'Poisson test, rate comparison, or count regression';
        }
        explanation = 'The method must match the number of groups, whether observations are paired, and the response distribution.';
      } else if (objective === 'relationship') {
        method = response === 'continuous' ? 'Scatter plot and correlation, followed by regression' : response === 'binary' ? 'Logistic regression' : 'Poisson or negative-binomial regression';
        explanation = 'Relationship methods quantify association; causal claims still require design, mechanism, and confounding control.';
      } else if (objective === 'predict') {
        method = response === 'continuous' ? 'Regression with holdout or grouped validation' : response === 'binary' ? 'Logistic regression or a validated classification model' : 'Validated count-regression model';
        explanation = 'Prediction requires out-of-sample validation and a decision threshold, not only in-sample fit.';
      } else if (objective === 'stability') {
        method = response === 'continuous' ? 'I-MR or X̄-R/S control chart selected by subgroup structure' : 'p, np, c, or u chart selected by denominator and defect definition';
        explanation = 'The chart must reflect the data type and rational subgrouping.';
      } else {
        method = response === 'continuous' ? 'Capability analysis after MSA and stability checks' : 'Binomial or Poisson capability analysis';
        explanation = 'Capability indices are interpretable only after measurement adequacy and process stability are established.';
      }
      q('#stat-output').innerHTML = '<h3>' + method + '</h3><p><strong>Prerequisites:</strong> operational definitions, adequate MSA, representative data, correct independence or subgroup assumptions, and a clear decision threshold.</p><div class="qw-callout"><strong>Why:</strong> ' + explanation + '</div>';
    };
  }

  function installAdvancedSimulator() {
    const simulator = q('#simulator');
    if (!simulator || simulator.dataset.guideEnhanced === 'true') return;
    simulator.dataset.guideEnhanced = 'true';
    const stages = [
      { q: 'Failures are detected at final tensile testing. What should the team do first?', correct: 'map', opts: { map: 'Map the full process and mark origin and detection points', fish: 'Build a fishbone immediately', doe: 'Run a DOE on furnace and cooling settings' }, why: 'The team must first understand the process and where the property can be created, changed, or measured.' },
      { q: 'The map is complete, but records contain only PASS/FAIL and coil ID. What next?', correct: 'check', opts: { check: 'Design a traceable check sheet and data-linkage plan', pareto: 'Make a Pareto from PASS/FAIL', reg: 'Fit a regression immediately' }, why: 'The current data cannot support subgrouping, MSA, or causal analysis.' },
      { q: 'Some retests use the opposite coil end and one extensometer appears unusual. What next?', correct: 'msa', opts: { msa: 'Separate linkage populations and assess the measurement system', fish: 'Vote on the most likely root cause', pdpc: 'Create a PDPC' }, why: 'Measurement and linkage uncertainty must be controlled before process conclusions are trusted.' },
      { q: 'Reliable linked data now show failures concentrated on one grade, shift, and same-end retest pattern. What next?', correct: 'focus', opts: { focus: 'Use stratification, Pareto, and focused hypothesis generation', all: 'Pool all products to increase sample size', doe: 'Skip directly to optimization' }, why: 'The effect must be precisely scoped before testing candidate causes.' },
      { q: 'A candidate thermal-history factor is associated with YS while UTS remains stable. What next?', correct: 'validate', opts: { validate: 'Test the relationship using mechanism, regression or hypothesis testing, then confirm', declare: 'Declare root cause from correlation alone', network: 'Build the project schedule' }, why: 'Association is evidence, but causal credibility requires validation and consideration of confounding.' },
      { q: 'The corrective action is technically validated. What next?', correct: 'plan', opts: { plan: 'Use affinity, tree, prioritization, RACI, PDPC, and activity network as needed', close: 'Close the project immediately', fish: 'Repeat the fishbone' }, why: 'A technically sound fix still needs ownership, risk controls, sequencing, and governance.' },
      { q: 'The fix is implemented. What completes the project?', correct: 'control', opts: { control: 'Establish SPC, reaction plan, control plan, and handoff', cap: 'Report one post-fix capability index only', email: 'Send a completion email' }, why: 'Sustainment requires time-ordered evidence, defined reactions, ownership, and operational handoff.' }
    ];
    let stage = 0;
    function render() {
      if (stage >= stages.length) {
        simulator.innerHTML = '<h3>Investigation complete</h3><p>You moved from scope and evidence through validation, implementation planning, and sustained control.</p><button class="qw-btn primary" data-complete>Mark capstone complete</button>';
        return;
      }
      const current = stages[stage];
      simulator.innerHTML = '<p class="qw-small">Stage ' + (stage + 1) + ' of ' + stages.length + '</p><h3>' + current.q + '</h3>' + Object.entries(current.opts).map(function (entry) { return '<button class="qw-option" data-advanced-sim="' + entry[0] + '">' + entry[1] + '</button>'; }).join('') + '<div class="qw-feedback" aria-live="polite"></div>';
      qa('[data-advanced-sim]', simulator).forEach(function (button) {
        button.addEventListener('click', function () {
          if (button.dataset.advancedSim !== current.correct) {
            q('.qw-feedback', simulator).innerHTML = '<span class="feedback-error"><strong>Not yet.</strong> ' + current.why + '</span>';
            return;
          }
          qa('[data-advanced-sim]', simulator).forEach(function (item) { item.disabled = true; });
          q('.qw-feedback', simulator).innerHTML = '<span class="feedback-success"><strong>Correct.</strong> ' + current.why + '</span><div class="qw-tabs"><button class="qw-btn primary" id="advanced-sim-continue">Continue to next stage</button></div>';
          q('#advanced-sim-continue').addEventListener('click', function () { stage += 1; render(); });
        });
      });
    }
    render();
  }

  installCourseChrome();
  installThemeToggle();
  installLessonContract();
  installRevealPanels();
  installGuideQuiz();
  installProgress();
  installAdvancedStatSelector();
  installAdvancedSimulator();
}());
