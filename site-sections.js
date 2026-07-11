(function () {
  'use strict';

  const TOOLS_PATH = '/engineering-tools.html';
  const MATERIAL_CHECKER_PATH = '/tools/material-specification-compliance-checker.html';
  const CALCULATOR_PATH = '/tools/engineering-statistics-calculator.html';
  const UNIT_CONVERTER_PATH = '/tools/unit-converter.html';
  const ARROW_CLEANUP_PATH = '/arrow-cleanup.js';

  function loadArrowCleanup() {
    if (document.querySelector('script[src="' + ARROW_CLEANUP_PATH + '"]')) return;
    const script = document.createElement('script');
    script.src = ARROW_CLEANUP_PATH;
    script.defer = true;
    document.head.appendChild(script);
  }

  function installArrowCleanupWriteHook() {
    if (Document.prototype.__upskillArrowCleanupWriteHookInstalled) return;

    const nativeWrite = Document.prototype.write;
    Document.prototype.write = function () {
      const chunks = Array.prototype.slice.call(arguments);

      if (
        chunks.length === 1 &&
        typeof chunks[0] === 'string' &&
        chunks[0].includes('</body>') &&
        !chunks[0].includes(ARROW_CLEANUP_PATH)
      ) {
        chunks[0] = chunks[0].replace(
          '</body>',
          '<script src="' + ARROW_CLEANUP_PATH + '"><\/script></body>'
        );
      }

      return nativeWrite.apply(this, chunks);
    };

    Document.prototype.__upskillArrowCleanupWriteHookInstalled = true;
  }

  function pathEndsWith(path) {
    return window.location.pathname === path || window.location.pathname.endsWith(path);
  }

  function isEngineeringToolsPage() {
    return pathEndsWith(TOOLS_PATH);
  }

  function isHomePage() {
    const path = window.location.pathname;
    return path === '/' || path.endsWith('/index.html');
  }

  function createToolsLink(currentPage) {
    const link = document.createElement('a');
    link.href = TOOLS_PATH;
    link.textContent = 'Engineering Tools';
    if (currentPage) link.setAttribute('aria-current', 'page');
    return link;
  }

  function insertAfter(reference, node) {
    if (reference && reference.parentNode) {
      reference.parentNode.insertBefore(node, reference.nextSibling);
    }
  }

  function addToolsLinkToNav(nav) {
    if (!nav || nav.querySelector('a[href*="engineering-tools.html"]')) return;
    const lessonLink = Array.from(nav.querySelectorAll('a')).find(function (link) {
      return link.textContent.trim() === 'Lessons';
    });
    const toolsLink = createToolsLink(isEngineeringToolsPage());
    if (lessonLink) insertAfter(lessonLink, toolsLink);
    else nav.appendChild(toolsLink);
  }

  function addToolsLinkToFooter() {
    const heading = Array.from(document.querySelectorAll('footer h4')).find(function (item) {
      return item.textContent.trim().toLowerCase() === 'quick links';
    });
    if (!heading) return;

    const column = heading.parentElement;
    if (!column || column.querySelector('a[href*="engineering-tools.html"]')) return;
    const lessonLink = Array.from(column.querySelectorAll('a')).find(function (link) {
      return link.textContent.trim() === 'Lessons';
    });
    const toolsLink = createToolsLink(false);
    if (lessonLink) insertAfter(lessonLink, toolsLink);
    else column.appendChild(toolsLink);
  }

  function ensureNavigation() {
    document.querySelectorAll('nav.desktop-nav, nav.mobile-nav').forEach(addToolsLinkToNav);
    addToolsLinkToFooter();
  }

  function buildHomeToolsSection() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'engineering-tools-preview';
    section.innerHTML = `
      <div class="wrap">
        <p class="eyebrow">Engineering tools</p>
        <h2 style="font-size:28px;margin:0 0 12px;max-width:700px;">Calculators, converters, and technical checkers.</h2>
        <p style="font-size:15.5px;line-height:1.7;color:var(--muted);margin:0 0 32px;max-width:760px;">Practical tools for materials, quality, engineering calculations, statistics, and unit conversion.</p>
        <div class="grid-3">
          <a href="${MATERIAL_CHECKER_PATH}" class="card" style="color:var(--ink);">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--teal);margin-bottom:18px;"></div>
            <p style="font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;">Available</p>
            <h3 style="font-size:17px;margin:0 0 10px;">Material Specification Compliance Checker</h3>
            <p style="font-size:14px;color:var(--muted);margin:0 0 16px;">Compare chemistry and mechanical test results against selected CSA or ASTM requirements.</p>
            <span style="font-size:13.5px;font-weight:600;">Open checker &rarr;</span>
          </a>
          <a href="${CALCULATOR_PATH}" class="card" style="color:var(--ink);">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--navy);margin-bottom:18px;"></div>
            <p style="font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;">Available</p>
            <h3 style="font-size:17px;margin:0 0 10px;">Engineering &amp; Statistics Calculator</h3>
            <p style="font-size:14px;color:var(--muted);margin:0 0 16px;">Use a scientific calculator, descriptive statistics, probability distributions, reliability metrics, and hypothesis tests.</p>
            <span style="font-size:13.5px;font-weight:600;">Open calculator &rarr;</span>
          </a>
          <a href="${UNIT_CONVERTER_PATH}" class="card" style="color:var(--ink);">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--teal);margin-bottom:18px;"></div>
            <p style="font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;">Available</p>
            <h3 style="font-size:17px;margin:0 0 10px;">Unit Converter</h3>
            <p style="font-size:14px;color:var(--muted);margin:0 0 16px;">Convert SI, Imperial, and common industry units used in technical work.</p>
            <span style="font-size:13.5px;font-weight:600;">Open converter &rarr;</span>
          </a>
        </div>
        <div style="margin-top:26px;">
          <a href="${TOOLS_PATH}" class="btn btn-outline">Browse all Engineering Tools</a>
        </div>
      </div>`;
    return section;
  }

  function ensureHomeContent() {
    if (!isHomePage()) return;

    const chooseGrid = document.querySelector('.section.tint .grid-2');
    if (chooseGrid && !chooseGrid.querySelector('a[href*="engineering-tools.html"]')) {
      const card = document.createElement('a');
      card.href = TOOLS_PATH;
      card.className = 'card';
      card.style.cssText = 'color:var(--ink);grid-column:1/-1;';
      card.innerHTML = '<h3 style="font-size:17px;margin:0 0 8px;">I need an engineering or statistics tool</h3><p style="font-size:14.5px;color:var(--muted);margin:0;">Explore material checkers, scientific and statistical calculations, and unit converters.</p>';
      chooseGrid.appendChild(card);
    }

    const popularHeading = Array.from(document.querySelectorAll('h2')).find(function (heading) {
      return heading.textContent.trim() === 'Browse by category.';
    });
    if (popularHeading) {
      const section = popularHeading.closest('section');
      const chipHolder = section && section.querySelector('div[style*="flex-wrap"]');
      if (chipHolder && !chipHolder.querySelector('a[href*="engineering-tools.html"]')) {
        const chip = document.createElement('a');
        chip.href = TOOLS_PATH;
        chip.className = 'chip';
        chip.textContent = 'Engineering Tools';
        chipHolder.appendChild(chip);
      }
    }

    if (!document.getElementById('engineering-tools-preview')) {
      const servicesEyebrow = Array.from(document.querySelectorAll('p.eyebrow')).find(function (item) {
        return item.textContent.trim().toLowerCase() === 'services';
      });
      const servicesSection = servicesEyebrow && servicesEyebrow.closest('section');
      if (servicesSection && servicesSection.parentNode) {
        servicesSection.parentNode.insertBefore(buildHomeToolsSection(), servicesSection);
      }
    }
  }

  function ensureLessonsLibraryLink() {
    if (!pathEndsWith('/lessons.html')) return;
    const jumpArea = document.querySelector('section .wrap div[style*="flex-wrap"]');
    if (!jumpArea || jumpArea.querySelector('a[href*="engineering-tools.html"]')) return;
    const link = document.createElement('a');
    link.href = TOOLS_PATH;
    link.className = 'chip';
    link.textContent = 'Engineering Tools';
    jumpArea.appendChild(link);
  }

  function activateToolCard(options) {
    if (!isEngineeringToolsPage()) return;
    const card = document.getElementById(options.cardId);
    if (!card) return;

    card.href = options.path;
    card.classList.remove('is-planned');
    const status = card.querySelector('.tool-status');
    const action = card.querySelector('.tool-link');
    const heading = card.querySelector('.tool-content h2');
    const description = card.querySelector('.tool-content p');

    if (heading && options.title) heading.innerHTML = options.title;
    if (description && options.description) description.textContent = options.description;
    if (status) {
      status.textContent = 'Available';
      status.classList.add('available');
    }
    if (action) {
      action.innerHTML = options.actionText;
      action.classList.remove('secondary');
      action.classList.add('primary');
    }
    card.setAttribute('aria-label', options.ariaLabel);
  }

  function activateAvailableTools() {
    activateToolCard({
      cardId: 'materials-quality',
      path: MATERIAL_CHECKER_PATH,
      actionText: 'Open checker &rarr;',
      ariaLabel: 'Open Material Specification Compliance Checker'
    });
    activateToolCard({
      cardId: 'engineering-calculators',
      path: CALCULATOR_PATH,
      title: 'Engineering &amp; Statistics Calculator',
      description: 'Scientific calculations, descriptive statistics and regression, 16 probability distributions, reliability metrics, and nine hypothesis-test workflows.',
      actionText: 'Open calculator &rarr;',
      ariaLabel: 'Open Engineering and Statistics Calculator'
    });
    activateToolCard({
      cardId: 'converters',
      path: UNIT_CONVERTER_PATH,
      actionText: 'Open converter &rarr;',
      ariaLabel: 'Open Engineering Unit Converter'
    });

    if (isEngineeringToolsPage()) {
      const note = document.querySelector('.directory-note');
      if (note) note.textContent = 'Select any available tool to open it. Each tool explains its assumptions and keeps the calculation method visible.';
    }
  }

  function enhanceLeadMagnetCapture() {
    if (!isHomePage()) return;

    const form = document.querySelector('form[name="lead-magnet"]');
    const input = form && form.querySelector('.lead-email');
    const button = form && form.querySelector('button[type="submit"]');
    if (!form || !input || !button || form.dataset.enhanced === 'true') return;

    form.dataset.enhanced = 'true';
    form.className = 'lead-capture';
    form.removeAttribute('style');

    input.removeAttribute('style');
    input.type = 'text';
    input.inputMode = 'email';
    input.id = 'starter-kit-email';
    input.autocomplete = 'off';
    input.autocapitalize = 'none';
    input.spellcheck = false;
    input.placeholder = 'you@example.com';
    input.setAttribute('pattern', '^[^ @]+@[^ @]+[.][^ @]+$');
    input.setAttribute('title', 'Enter a valid email address, such as name@example.com');
    input.setAttribute('data-1p-ignore', 'true');
    input.setAttribute('data-bwignore', 'true');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-form-type', 'other');

    button.classList.add('lead-capture-submit');

    const row = document.createElement('div');
    row.className = 'lead-capture-row';
    const field = document.createElement('label');
    field.className = 'lead-capture-field';
    field.htmlFor = input.id;
    const labelText = document.createElement('span');
    labelText.textContent = 'Email address';

    input.parentNode.insertBefore(row, input);
    field.appendChild(labelText);
    field.appendChild(input);
    row.appendChild(field);
    row.appendChild(button);

    const note = document.createElement('p');
    note.className = 'lead-capture-note';
    note.textContent = 'Free download. No spam. Unsubscribe at any time.';
    form.appendChild(note);

    if (!document.getElementById('lead-capture-styles')) {
      const style = document.createElement('style');
      style.id = 'lead-capture-styles';
      style.textContent = `
        .lead-capture{width:min(100%,680px);margin:0 auto;padding:18px;border:1px solid var(--line);border-radius:10px;background:var(--card);box-shadow:0 10px 28px rgba(15,42,67,.08);text-align:left}
        .lead-capture-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end}
        .lead-capture-field{display:flex;min-width:0;flex-direction:column;gap:7px;color:var(--ink);font-size:13px;font-weight:600}
        .lead-capture .lead-email{display:block;width:100%;min-width:0;height:50px;margin:0;padding:0 15px;appearance:none;border:1px solid #cfd4dc;border-radius:var(--radius);background:var(--paper)!important;color:var(--ink);font:400 15px/1 'Work Sans',Arial,sans-serif;box-shadow:inset 0 1px 2px rgba(16,24,40,.04)}
        .lead-capture .lead-email::placeholder{color:#8792a2}.lead-capture .lead-email:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(14,116,144,.14);outline:none}
        .lead-capture-submit{min-width:168px;height:50px;padding-top:0;padding-bottom:0}.lead-capture-note{margin:10px 0 0;color:var(--muted);font-size:12px;line-height:1.45;text-align:center}
        html[data-theme="dark"] .lead-capture{box-shadow:0 12px 30px rgba(0,0,0,.24)}html[data-theme="dark"] .lead-capture .lead-email{border-color:var(--line)!important}
        @media(max-width:600px){.lead-capture{padding:16px}.lead-capture-row{grid-template-columns:1fr}.lead-capture-submit{width:100%;min-width:0}}
      `;
      document.head.appendChild(style);
    }
  }

  function initializeSiteSections() {
    loadArrowCleanup();
    ensureNavigation();
    ensureHomeContent();
    ensureLessonsLibraryLink();
    activateAvailableTools();
    enhanceLeadMagnetCapture();
  }

  installArrowCleanupWriteHook();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSiteSections, { once: true });
  } else {
    initializeSiteSections();
  }
}());
