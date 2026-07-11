(function () {
  'use strict';

  const TOOLS_PATH = '/engineering-tools.html';

  function isEngineeringToolsPage() {
    return window.location.pathname.endsWith('/engineering-tools.html');
  }

  function createToolsLink(currentPage) {
    const link = document.createElement('a');
    link.href = TOOLS_PATH;
    link.textContent = 'Engineering Tools';
    if (currentPage) link.setAttribute('aria-current', 'page');
    return link;
  }

  function insertAfter(reference, node) {
    if (reference.parentNode) reference.parentNode.insertBefore(node, reference.nextSibling);
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
    const quickLinksHeading = Array.from(document.querySelectorAll('footer h4')).find(function (heading) {
      return heading.textContent.trim().toLowerCase() === 'quick links';
    });
    if (!quickLinksHeading) return;

    const column = quickLinksHeading.parentElement;
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
        <p style="font-size:15.5px;line-height:1.7;color:var(--muted);margin:0 0 32px;max-width:760px;">A growing tools area for materials, quality, engineering calculations, statistics, and unit conversion.</p>
        <div class="grid-3">
          <a href="/engineering-tools.html#materials-quality" class="card" style="color:var(--ink);">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--teal);margin-bottom:18px;"></div>
            <p style="font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;">In development</p>
            <h3 style="font-size:17px;margin:0 0 10px;">Material Specification Compliance Checker</h3>
            <p style="font-size:14px;color:var(--muted);margin:0 0 16px;">Compare chemistry and mechanical test results against selected CSA or ASTM requirements.</p>
            <span style="font-size:13.5px;font-weight:600;">View tool roadmap &rarr;</span>
          </a>
          <a href="/engineering-tools.html#engineering-calculators" class="card" style="color:var(--ink);">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--navy);margin-bottom:18px;"></div>
            <p style="font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;">Planned</p>
            <h3 style="font-size:17px;margin:0 0 10px;">Engineering Calculator</h3>
            <p style="font-size:14px;color:var(--muted);margin:0 0 16px;">Quick calculations for geometry, mass, pressure, flow, and process work.</p>
            <span style="font-size:13.5px;font-weight:600;">Explore calculators &rarr;</span>
          </a>
          <a href="/engineering-tools.html#converters" class="card" style="color:var(--ink);">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--teal);margin-bottom:18px;"></div>
            <p style="font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;">Planned</p>
            <h3 style="font-size:17px;margin:0 0 10px;">Unit Converter</h3>
            <p style="font-size:14px;color:var(--muted);margin:0 0 16px;">Convert SI, Imperial, and common industry units used in technical work.</p>
            <span style="font-size:13.5px;font-weight:600;">Explore converters &rarr;</span>
          </a>
        </div>
        <div style="margin-top:26px;">
          <a href="/engineering-tools.html" class="btn btn-outline">Browse all Engineering Tools</a>
        </div>
      </div>`;
    return section;
  }

  function ensureHomeContent() {
    const path = window.location.pathname;
    if (!(path === '/' || path.endsWith('/index.html'))) return;

    const chooseGrid = document.querySelector('.section.tint .grid-2');
    if (chooseGrid && !chooseGrid.querySelector('a[href*="engineering-tools.html"]')) {
      const card = document.createElement('a');
      card.href = TOOLS_PATH;
      card.className = 'card';
      card.style.cssText = 'color:var(--ink);grid-column:1/-1;';
      card.innerHTML = '<h3 style="font-size:17px;margin:0 0 8px;">I need an engineering tool</h3><p style="font-size:14.5px;color:var(--muted);margin:0;">Explore material checkers, engineering calculators, and unit converters.</p>';
      chooseGrid.appendChild(card);
    }

    const popularHeading = Array.from(document.querySelectorAll('h2')).find(function (heading) {
      return heading.textContent.trim() === 'Browse by category.';
    });
    if (popularHeading) {
      const popularSection = popularHeading.closest('section');
      const chipHolder = popularSection && popularSection.querySelector('div[style*="flex-wrap"]');
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
    if (!window.location.pathname.endsWith('/lessons.html')) return;
    const jumpArea = document.querySelector('section .wrap div[style*="flex-wrap"]');
    if (!jumpArea || jumpArea.querySelector('a[href*="engineering-tools.html"]')) return;
    const link = document.createElement('a');
    link.href = TOOLS_PATH;
    link.className = 'chip';
    link.textContent = 'Engineering Tools';
    jumpArea.appendChild(link);
  }

  function initializeSiteSections() {
    ensureNavigation();
    ensureHomeContent();
    ensureLessonsLibraryLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSiteSections, { once: true });
  } else {
    initializeSiteSections();
  }
}());
