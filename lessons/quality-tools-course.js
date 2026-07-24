(function () {
  'use strict';

  function q(selector, root) { return (root || document).querySelector(selector); }
  function qa(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }

  const profiles = {
    '/lessons/7-essential-quality-tools': {
      level: 'beginner',
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
      objectives: [
        'Diagnose the earliest unresolved question in an investigation.',
        'Sequence basic, planning, statistical, and control tools using dependency logic.',
        'Distinguish descriptive, inferential, experimental, and sustainment evidence.',
        'Build a defensible end-to-end quality investigation and corrective-action pathway.'
      ],
      summary: [
        'Advanced methods cannot rescue poor scope, traceability, or measurement.',
        'Use descriptive tools to expose patterns before testing explanations.',
        'Treat brainstormed causes as hypotheses rather than conclusions.',
        'Match the statistical method to the objective, response type, and design.',
        'Use DOE only when deliberate factor changes are safe and feasible.',
        'Close only after ownership, reaction plans, and time-ordered stability are established.'
      ],
      next: '/lessons.html#quality-engineering'
    }
  };

  function pathKey() { return location.pathname.replace(/\.html$/, '').replace(/\/$/, ''); }
  function profile() { return profiles[pathKey()] || null; }

  function ensureSharedStyles() {
    if (q('link[href="/lessons/quality-tools-course.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/lessons/quality-tools-course.css';
    document.head.appendChild(link);
  }

  function installChrome() {
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
        <a href="/" class="brand"><img src="/assets/logo-icon.png" alt="UpSkill Sprint Consulting logo"><span>UpSkill Sprint Consulting</span></a>
        <nav class="desktop-nav" aria-label="Primary navigation">
          <a href="/start-here.html">Start Here</a><a href="/lessons.html" aria-current="page">Lessons</a><a href="/services.html">Services</a><a href="/request-topic.html">Request a Topic</a><a href="/about.html">About</a><a href="/faq.html">FAQ</a><a href="/contact.html">Contact</a>
        </nav>
        <a class="lesson-back-link" href="/lessons.html#quality-engineering">Back to Quality Engineering</a>
        <button type="button" class="theme-toggle" data-theme-toggle="true" role="switch" aria-checked="false"><span class="sr-only">Toggle dark and light mode</span></button>
        <label for="mnav-check" class="mobile-menu-btn" aria-label="Open menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></label>`;

      const mobile = document.createElement('nav');
      mobile.className = 'mobile-nav';
      mobile.setAttribute('aria-label', 'Mobile navigation');
      mobile.innerHTML = '<a href="/start-here.html">Start Here</a><a href="/lessons.html">Lessons</a><a href="/services.html">Services</a><a href="/request-topic.html">Request a Topic</a><a href="/about.html">About</a><a href="/faq.html">FAQ</a><a href="/contact.html">Contact</a>';

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
      footer.innerHTML = '<div class="wrap"><div class="footer-grid"><div><div class="brand"><img src="/assets/logo-icon.png" alt="UpSkill Sprint Consulting logo"><span>UpSkill Sprint Consulting</span></div><p>Practical learning for quality, data, process improvement, and business problem-solving.</p></div><div><h4>Quick Links</h4><a href="/">Home</a><a href="/start-here.html">Start Here</a><a href="/lessons.html">Lessons</a><a href="/request-topic.html">Request a Topic</a></div><div><h4>Topics</h4><a href="/lessons.html#quality-engineering">Quality Engineering</a><a href="/lessons.html#lean-six-sigma">Lean Six Sigma</a><a href="/lessons.html#statistics">Statistics</a></div><div><h4>Contact</h4><a href="mailto:skillsprintconsulting@gmail.com">skillsprintconsulting@gmail.com</a><p>Saskatchewan, Canada</p></div></div></div>';
      document.body.appendChild(footer);
    } else {
      q('footer.site').classList.add('lesson-footer');
    }
  }

  function sectionByHeading(pattern) {
    return qa('main section').find(function (section) {
      const heading = q('h1,h2,h3', section);
      return heading && pattern.test(heading.textContent);
    });
  }

  function makeToc() {
    const nav = document.createElement('nav');
    nav.className = 'lesson-toc';
    nav.setAttribute('aria-label', 'Lesson contents');
    nav.innerHTML = '<h2>In this lesson</h2><ol><li><a href="#learning-objectives">Learning objectives</a></li><li><a href="#key-concepts">Key concepts</a></li><li><a href="#worked-example">Worked example</a></li><li><a href="#practice">Practice activity</a></li><li><a href="#quiz">Mini quiz</a></li><li><a href="#summary">Summary</a></li></ol>';
    return nav;
  }

  function makeObjectives(p) {
    const section = document.createElement('section');
    section.id = 'learning-objectives';
    section.className = 'lesson-requirement-section';
    section.innerHTML = '<h2>Learning objectives</h2><p>By the end of this lesson, you will be able to:</p><ol>' + p.objectives.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ol><h3>Prerequisites</h3><p>No specialist software is required. Familiarity with basic quality terminology is helpful, but the required concepts are explained before use.</p>';
    return section;
  }

  function practiceContent(level) {
    if (level === 'intermediate') return ['A team has 18 corrective-action ideas, no agreed categories, and no evidence that one idea is more important than another. What should the team do first?', '<strong>Use an Affinity Diagram first.</strong> Organize the raw ideas into natural themes before applying influence, decomposition, or prioritization logic.'];
    if (level === 'advanced') return ['A regression links finish temperature to yield strength, but original/retest linkage and extensometer agreement remain uncertain. Should the team proceed directly to DOE?', '<strong>No.</strong> Resolve linkage and measurement-system uncertainty first. DOE should not optimize a response that is not yet trustworthy.'];
    return ['A pooled tensile-failure rate looks moderate, but operators suspect one shift is carrying most failures. Which tool should be used before building the Pareto chart?', '<strong>Use stratification first.</strong> Split the data by shift and other plausible subgroups, then build the Pareto inside the subgroup carrying the signal.'];
  }

  function makePractice(p) {
    const content = practiceContent(p.level);
    const section = document.createElement('section');
    section.id = 'practice';
    section.className = 'lesson-requirement-section';
    section.innerHTML = '<h2>Practice activity</h2><div class="practice-card"><p><strong>Scenario:</strong> ' + content[0] + '</p><p><strong>Instruction:</strong> Select the most defensible next step and explain why it must occur before later tools.</p><button type="button" class="lesson-action-button" data-reveal-answer aria-expanded="false">Reveal answer</button><div class="practice-answer" hidden aria-live="polite"><p>' + content[1] + '</p></div></div>';
    return section;
  }

  function questionBank(level) {
    if (level === 'beginner') return [
      ['Which tool exposes mixed populations?', ['Pareto chart', 'Stratification', 'Fishbone diagram'], 1, 'Stratification separates data by meaningful subgroups.'],
      ['What does a Pareto chart establish?', ['Root cause', 'Highest-priority categories', 'Process stability'], 1, 'Pareto ranks categories; it does not establish cause.'],
      ['A fishbone branch is:', ['A confirmed cause', 'A testable hypothesis', 'A control limit'], 1, 'Fishbone branches require validation.'],
      ['Which chart preserves time order?', ['Histogram', 'Control chart', 'Pareto chart'], 1, 'Control charts display results over time.'],
      ['What should normally follow a process map?', ['A traceable data plan', 'Immediate DOE', 'Project closure'], 0, 'The map identifies where evidence should be collected.']
    ];
    if (level === 'intermediate') return [
      ['Which tool organizes raw ideas into themes?', ['Affinity diagram', 'Activity network', 'PDPC'], 0, 'Affinity grouping creates structure.'],
      ['What is the main output of a Tree Diagram?', ['Significance', 'Assignable tasks', 'Control limits'], 1, 'A tree decomposes a goal into actions.'],
      ['When should weights be agreed?', ['Before scoring', 'After seeing the ranking', 'Only for ties'], 0, 'Pre-agreed weights reduce bias.'],
      ['Which tool stress-tests an implementation plan?', ['Matrix diagram', 'PDPC', 'Histogram'], 1, 'PDPC anticipates failure and countermeasures.'],
      ['Which tool identifies the critical path?', ['Activity Network Diagram', 'Affinity Diagram', 'Pareto Chart'], 0, 'The network uses duration and dependency logic.']
    ];
    return [
      ['What must precede capability analysis?', ['Stable process and adequate MSA', 'Fishbone only', 'Large sample only'], 0, 'Capability needs trustworthy measurement and stability.'],
      ['Observational correlation proves:', ['Causation', 'Association only', 'Control'], 1, 'Association may be confounded.'],
      ['When is DOE defensible?', ['Before defining the response', 'After credible factors, safe ranges, and MSA', 'Whenever regression is significant'], 1, 'DOE requires a trustworthy response and controlled execution.'],
      ['What closes the improvement loop?', ['One favourable result', 'SPC, reaction plan, ownership, and handoff', 'A fishbone'], 1, 'Sustainment needs monitoring and ownership.'],
      ['When should a cause advance to implementation?', ['After a vote', 'After validation and risk control', 'When first on the fishbone'], 1, 'Implementation follows validation.']
    ];
  }

  function makeQuiz(p) {
    const section = document.createElement('section');
    section.id = 'quiz';
    section.className = 'lesson-requirement-section lesson-guide-quiz';
    const questions = questionBank(p.level);
    section.innerHTML = '<h2>Mini quiz</h2><p>Answer all five questions, then submit.</p><form novalidate>' + questions.map(function (item, index) {
      return '<fieldset data-quiz-question data-correct="' + item[2] + '"><legend>' + (index + 1) + '. ' + item[0] + '</legend>' + item[1].map(function (option, optionIndex) { return '<label><input type="radio" name="guide-q' + index + '" value="' + optionIndex + '"> <span>' + option + '</span></label>'; }).join('') + '<p class="quiz-explanation" hidden>' + item[3] + '</p></fieldset>';
    }).join('') + '<div class="quiz-actions"><button type="submit" class="lesson-action-button">Submit quiz</button><button type="reset" class="lesson-action-button secondary">Reset quiz</button></div><p class="quiz-score" aria-live="polite"></p></form>';
    return section;
  }

  function makeSummary(p) {
    const section = document.createElement('section');
    section.id = 'summary';
    section.className = 'lesson-requirement-section';
    section.innerHTML = '<h2>Summary</h2><ul>' + p.summary.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul><div class="remember-box"><strong>Decision rule:</strong> use the least-complex tool that answers the current unresolved question with defensible evidence.<br><strong>Remember this:</strong> sequence follows evidence, not habit.</div><p><strong>Suggested next lesson:</strong> <a href="' + p.next + '">Continue the quality-tools learning path</a>.</p>';
    return section;
  }

  function installContract() {
    const p = profile();
    const main = q('main');
    if (!p || !main) return;
    document.body.dataset.lessonPage = 'true';
    document.body.dataset.category = 'quality-engineering';
    document.body.dataset.level = p.level;
    document.body.dataset.interactive = 'true';
    main.id = 'lesson-content';
    main.tabIndex = -1;

    let wrapper = q('.lesson-wrapper', main);
    if (!wrapper) {
      wrapper = document.createElement('article');
      wrapper.className = 'lesson-wrapper';
      while (main.firstChild) wrapper.appendChild(main.firstChild);
      main.appendChild(wrapper);
    }

    const hero = q('section', wrapper);
    if (!q('.lesson-toc', wrapper)) wrapper.insertBefore(makeToc(), hero ? hero.nextSibling : wrapper.firstChild);
    if (!q('#learning-objectives', wrapper)) {
      const toc = q('.lesson-toc', wrapper);
      wrapper.insertBefore(makeObjectives(p), toc.nextSibling);
    }
    const key = q('#key-concepts', wrapper) || sectionByHeading(/sequence|strategic|problem solver|explore every tool/i);
    if (key) key.id = 'key-concepts';
    const worked = q('#worked-example', wrapper) || sectionByHeading(/investigation challenge|steel manufacturing investigation|prioritization matrix|worked example/i);
    if (worked) worked.id = 'worked-example';
    if (!q('#practice', wrapper)) wrapper.appendChild(makePractice(p));
    if (!q('#quiz', wrapper)) wrapper.appendChild(makeQuiz(p));
    if (!q('#summary', wrapper)) wrapper.appendChild(makeSummary(p));
  }

  function installInteractions() {
    document.addEventListener('click', function (event) {
      const reveal = event.target.closest('[data-reveal-answer]');
      if (reveal) {
        const answer = q('.practice-answer', reveal.parentElement);
        const show = answer.hidden;
        answer.hidden = !show;
        reveal.setAttribute('aria-expanded', String(show));
        reveal.textContent = show ? 'Hide answer' : 'Reveal answer';
      }
      const complete = event.target.closest('[data-complete]');
      if (complete) {
        const progress = q('[data-progress]');
        localStorage.setItem('qt-progress-' + location.pathname, '100');
        if (progress) progress.style.width = '100%';
        complete.textContent = 'Completed ✓';
      }
    });

    const quiz = q('.lesson-guide-quiz form');
    if (quiz) {
      quiz.addEventListener('submit', function (event) {
        event.preventDefault();
        let score = 0;
        let missing = 0;
        qa('[data-quiz-question]', quiz).forEach(function (field) {
          const selected = q('input:checked', field);
          qa('label', field).forEach(function (label) { label.classList.remove('correct-answer', 'incorrect-answer'); });
          q('.quiz-explanation', field).hidden = false;
          if (!selected) { missing += 1; field.classList.add('needs-answer'); return; }
          field.classList.remove('needs-answer');
          const correct = Number(field.dataset.correct);
          if (Number(selected.value) === correct) { score += 1; selected.closest('label').classList.add('correct-answer'); }
          else {
            selected.closest('label').classList.add('incorrect-answer');
            const correctInput = q('input[value="' + correct + '"]', field);
            if (correctInput) correctInput.closest('label').classList.add('correct-answer');
          }
        });
        q('.quiz-score', quiz).textContent = missing ? 'Please answer all five questions. Current score: ' + score + ' of 5.' : 'Score: ' + score + ' of 5.';
      });
      quiz.addEventListener('reset', function () {
        setTimeout(function () {
          qa('[data-quiz-question]', quiz).forEach(function (field) {
            field.classList.remove('needs-answer');
            qa('label', field).forEach(function (label) { label.classList.remove('correct-answer', 'incorrect-answer'); });
            q('.quiz-explanation', field).hidden = true;
          });
          q('.quiz-score', quiz).textContent = '';
        }, 0);
      });
    }

    const progress = q('[data-progress]');
    if (progress) progress.style.width = Number(localStorage.getItem('qt-progress-' + location.pathname) || 0) + '%';
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
      let why = '';
      if (objective === 'optimize') {
        if (controlled === 'yes') { method = factors === '3' ? 'Screening factorial DOE, then response-surface optimization if needed' : 'Full factorial DOE with confirmation runs'; why = 'Controlled experimentation can estimate effects and interactions.'; }
        else { method = 'Observational screening, stratification, and regression before DOE'; why = 'Uncontrolled observations can screen factors but cannot establish a defensible optimum.'; }
      } else if (objective === 'compare') {
        if (response === 'continuous') method = factors === '1' ? 'One-sample t-test or paired t-test' : factors === '2' ? 'Two-sample t-test, paired t-test, or two-factor model' : 'One-way or factorial ANOVA / general linear model';
        else method = response === 'binary' ? 'Proportions test, chi-square test, or logistic regression' : 'Poisson test, rate comparison, or count regression';
        why = 'The method must match the number of groups, pairing, and response distribution.';
      } else if (objective === 'relationship') { method = response === 'continuous' ? 'Scatter plot and correlation, followed by regression' : response === 'binary' ? 'Logistic regression' : 'Poisson or negative-binomial regression'; why = 'Relationship methods quantify association, not automatic causation.'; }
      else if (objective === 'predict') { method = response === 'continuous' ? 'Regression with holdout or grouped validation' : response === 'binary' ? 'Logistic regression or validated classification' : 'Validated count-regression model'; why = 'Prediction requires out-of-sample validation.'; }
      else if (objective === 'stability') { method = response === 'continuous' ? 'I-MR or X̄-R/S chart selected by subgroup structure' : 'p, np, c, or u chart selected by denominator and defect definition'; why = 'Chart selection follows data type and rational subgrouping.'; }
      else { method = response === 'continuous' ? 'Capability analysis after MSA and stability checks' : 'Binomial or Poisson capability analysis'; why = 'Capability is interpretable only after measurement adequacy and stability.'; }
      q('#stat-output').innerHTML = '<h3>' + method + '</h3><p><strong>Prerequisites:</strong> operational definitions, adequate MSA, representative data, correct independence or subgroup assumptions, and a clear decision threshold.</p><div class="qw-callout"><strong>Why:</strong> ' + why + '</div>';
    };
  }

  function installAdvancedSimulator() {
    const simulator = q('#simulator');
    if (!simulator || simulator.dataset.enhanced === 'true') return;
    simulator.dataset.enhanced = 'true';
    const stages = [
      ['Failures are detected at final tensile testing. What should the team do first?', 'map', { map: 'Map the full process and mark origin and detection points', fish: 'Build a fishbone immediately', doe: 'Run a DOE on furnace and cooling settings' }, 'First understand where the property can be created, changed, or measured.'],
      ['The map is complete, but records contain only PASS/FAIL and coil ID. What next?', 'check', { check: 'Design a traceable check sheet and data-linkage plan', pareto: 'Make a Pareto from PASS/FAIL', reg: 'Fit a regression immediately' }, 'The current data cannot support subgrouping, MSA, or causal analysis.'],
      ['Some retests use the opposite coil end and one extensometer appears unusual. What next?', 'msa', { msa: 'Separate linkage populations and assess the measurement system', fish: 'Vote on the most likely root cause', pdpc: 'Create a PDPC' }, 'Measurement and linkage uncertainty must be controlled first.'],
      ['Reliable linked data show concentration in one grade, shift, and same-end pattern. What next?', 'focus', { focus: 'Use stratification, Pareto, and focused hypothesis generation', all: 'Pool all products', doe: 'Skip directly to optimization' }, 'Precisely scope the effect before testing causes.'],
      ['A thermal-history factor is associated with YS while UTS remains stable. What next?', 'validate', { validate: 'Test the relationship using mechanism, regression or hypothesis testing, then confirm', declare: 'Declare root cause from correlation', network: 'Build the schedule' }, 'Association requires validation and confounding review.'],
      ['The corrective action is technically validated. What next?', 'plan', { plan: 'Use affinity, tree, prioritization, RACI, PDPC, and activity network as needed', close: 'Close immediately', fish: 'Repeat the fishbone' }, 'A valid fix still needs ownership, risk controls, and sequencing.'],
      ['The fix is implemented. What completes the project?', 'control', { control: 'Establish SPC, reaction plan, control plan, and handoff', cap: 'Report one capability index', email: 'Send a completion email' }, 'Sustainment requires time-ordered evidence and operational handoff.']
    ];
    let stage = 0;
    function render() {
      if (stage >= stages.length) { simulator.innerHTML = '<h3>Investigation complete</h3><p>You moved from scope and evidence through validation, implementation planning, and sustained control.</p><button class="qw-btn primary" data-complete>Mark capstone complete</button>'; return; }
      const current = stages[stage];
      simulator.innerHTML = '<p class="qw-small">Stage ' + (stage + 1) + ' of ' + stages.length + '</p><h3>' + current[0] + '</h3>' + Object.entries(current[2]).map(function (entry) { return '<button class="qw-option" data-advanced-sim="' + entry[0] + '">' + entry[1] + '</button>'; }).join('') + '<div class="qw-feedback" aria-live="polite"></div>';
      qa('[data-advanced-sim]', simulator).forEach(function (button) {
        button.addEventListener('click', function () {
          if (button.dataset.advancedSim !== current[1]) { q('.qw-feedback', simulator).innerHTML = '<span class="feedback-error"><strong>Not yet.</strong> ' + current[3] + '</span>'; return; }
          qa('[data-advanced-sim]', simulator).forEach(function (item) { item.disabled = true; });
          q('.qw-feedback', simulator).innerHTML = '<span class="feedback-success"><strong>Correct.</strong> ' + current[3] + '</span><div class="qw-tabs"><button class="qw-btn primary" id="advanced-sim-continue">Continue to next stage</button></div>';
          q('#advanced-sim-continue').addEventListener('click', function () { stage += 1; render(); });
        });
      });
    }
    render();
  }

  ensureSharedStyles();
  installChrome();
  installContract();
  installInteractions();
  installAdvancedStatSelector();
  installAdvancedSimulator();
}());
