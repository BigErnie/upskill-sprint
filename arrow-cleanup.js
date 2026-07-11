(function () {
  'use strict';

  const ACTION_SELECTOR = 'a, button, [role="button"], input[type="button"], input[type="submit"]';
  const LEADING_ARROW = /^(?:[\s\u00a0]*(?:←|⟵|↩|↶|⬅|⇐|⟸|<-+)[\s\u00a0]*)+/u;
  const TRAILING_ARROW = /(?:[\s\u00a0]*(?:→|⟶|➜|➝|➞|➡|⟹|-+>)[\s\u00a0]*)+$/u;
  const ARROW_ONLY = /^(?:[\s\u00a0]*(?:←|⟵|↩|↶|⬅|⇐|⟸|→|⟶|➜|➝|➞|➡|⟹|<-+|-+>)[\s\u00a0]*)+$/u;
  const AFTER_CLASS = 'upskill-remove-after-arrow';
  const BEFORE_CLASS = 'upskill-remove-before-arrow';
  const HTML_EXTENSION = /\.html$/i;
  const MATERIAL_CHECKER_ROUTE = '/tools/material-specification-compliance-checker';
  let scanScheduled = false;

  function ensureStyles() {
    if (document.getElementById('upskill-arrow-cleanup-styles')) return;

    const style = document.createElement('style');
    style.id = 'upskill-arrow-cleanup-styles';
    style.textContent = `
      .${AFTER_CLASS}::after { content: none !important; display: none !important; }
      .${BEFORE_CLASS}::before { content: none !important; display: none !important; }

      .upskill-checker-brand-link {
        display: inline-flex !important;
        align-items: center !important;
        color: inherit !important;
        font-weight: 700 !important;
        text-decoration: none !important;
        text-underline-offset: 0 !important;
      }
      .upskill-checker-brand-link:hover,
      .upskill-checker-brand-link:focus,
      .upskill-checker-brand-link:visited {
        color: inherit !important;
        text-decoration: none !important;
      }
      .upskill-checker-logo-slot {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 38px !important;
        height: 38px !important;
        min-width: 38px !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        overflow: visible !important;
      }
      .upskill-checker-logo-slot img {
        display: block !important;
        width: 38px !important;
        height: 38px !important;
        object-fit: contain !important;
      }
      .upskill-checker-brand-row {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 12px !important;
        width: min(100%, 1200px) !important;
        margin: 0 auto !important;
      }
      .upskill-checker-header {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        width: 100% !important;
        min-height: 76px !important;
        padding: 17px clamp(18px, 4vw, 40px) !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
  }

  function normalizePseudoContent(content) {
    if (!content || content === 'none' || content === 'normal') return '';
    return content.replace(/^['"]|['"]$/g, '').trim();
  }

  function cleanInputValue(element) {
    const cleanedValue = element.value
      .replace(LEADING_ARROW, '')
      .replace(TRAILING_ARROW, '')
      .trim();

    if (cleanedValue !== element.value) element.value = cleanedValue;
  }

  function removeLeadingTextArrow(textNodes) {
    for (let index = 0; index < textNodes.length; index += 1) {
      const textNode = textNodes[index];
      if (!textNode.nodeValue || !textNode.nodeValue.trim()) continue;

      const cleaned = textNode.nodeValue.replace(LEADING_ARROW, '').trimStart();
      if (cleaned !== textNode.nodeValue) textNode.nodeValue = cleaned;
      break;
    }
  }

  function removeTrailingTextArrow(textNodes) {
    for (let index = textNodes.length - 1; index >= 0; index -= 1) {
      const textNode = textNodes[index];
      if (!textNode.nodeValue || !textNode.nodeValue.trim()) continue;

      const cleaned = textNode.nodeValue.replace(TRAILING_ARROW, '').trimEnd();
      if (cleaned !== textNode.nodeValue) textNode.nodeValue = cleaned;
      break;
    }
  }

  function removeTextArrows(element) {
    if (element instanceof HTMLInputElement) {
      cleanInputValue(element);
      return;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;

    while ((node = walker.nextNode())) textNodes.push(node);

    removeLeadingTextArrow(textNodes);
    removeTrailingTextArrow(textNodes);
  }

  function removePseudoElementArrow(element) {
    try {
      const afterContent = normalizePseudoContent(getComputedStyle(element, '::after').content);
      const beforeContent = normalizePseudoContent(getComputedStyle(element, '::before').content);

      element.classList.toggle(AFTER_CLASS, ARROW_ONLY.test(afterContent));
      element.classList.toggle(BEFORE_CLASS, ARROW_ONLY.test(beforeContent));
    } catch (error) {
      // Visible text and URL cleanup still work when pseudo-element styles are unavailable.
    }
  }

  function cleanPathname(pathname) {
    if (/\/index\.html$/i.test(pathname)) {
      return pathname.replace(/index\.html$/i, '');
    }
    return pathname.replace(HTML_EXTENSION, '');
  }

  function normalizedCurrentPath() {
    return cleanPathname(window.location.pathname).replace(/\/$/, '') || '/';
  }

  function cleanInternalLink(anchor) {
    if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download')) return;

    const rawHref = anchor.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || /^(?:mailto:|tel:|javascript:|data:)/i.test(rawHref)) return;

    try {
      const url = new URL(rawHref, window.location.href);
      if (url.origin !== window.location.origin || !HTML_EXTENSION.test(url.pathname)) return;

      url.pathname = cleanPathname(url.pathname);
      anchor.setAttribute('href', url.pathname + url.search + url.hash);
    } catch (error) {
      // Leave invalid or intentionally non-standard links unchanged.
    }
  }

  function cleanCanonicalAndSocialUrls() {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      try {
        const url = new URL(canonical.href, window.location.href);
        if (url.origin === window.location.origin && HTML_EXTENSION.test(url.pathname)) {
          url.pathname = cleanPathname(url.pathname);
          canonical.href = url.href;
        }
      } catch (error) {}
    }

    document.querySelectorAll('meta[property="og:url"]').forEach(function (meta) {
      try {
        const url = new URL(meta.content, window.location.href);
        if (url.origin === window.location.origin && HTML_EXTENSION.test(url.pathname)) {
          url.pathname = cleanPathname(url.pathname);
          meta.content = url.href;
        }
      } catch (error) {}
    });
  }

  function cleanBrowserAddress() {
    if (!HTML_EXTENSION.test(window.location.pathname)) return;

    const cleanUrl = cleanPathname(window.location.pathname) + window.location.search + window.location.hash;
    try {
      window.history.replaceState(window.history.state, document.title, cleanUrl);
    } catch (error) {
      // Netlify Pretty URLs still handle clean paths even if History API access is restricted.
    }
  }

  function cleanAction(element) {
    if (!(element instanceof Element)) return;
    removeTextArrows(element);
    removePseudoElementArrow(element);
    if (element instanceof HTMLAnchorElement) cleanInternalLink(element);
  }

  function scan(rootNode) {
    if (!rootNode) return;

    if (rootNode instanceof Element && rootNode.matches(ACTION_SELECTOR)) {
      cleanAction(rootNode);
    }

    if (rootNode.querySelectorAll) {
      rootNode.querySelectorAll(ACTION_SELECTOR).forEach(cleanAction);
    }
  }

  function findCheckerBrandLink() {
    return Array.from(document.querySelectorAll('header a, nav a, [class*="header"] a, [class*="brand"] a')).find(function (link) {
      return /UpSkill\s+Sprint\s+Consulting/i.test(link.textContent || '');
    }) || null;
  }

  function findCheckerInitialsBadge(brandLink, header) {
    const searchRoot = header || brandLink.parentElement || document.body;
    const elements = Array.from(searchRoot.querySelectorAll('span, div, strong, b, a'));

    return elements.find(function (element) {
      if (!element || element === brandLink || brandLink.contains(element)) return false;
      if (element.children.length > 0 || (element.textContent || '').trim().toUpperCase() !== 'US') return false;

      const rect = element.getBoundingClientRect();
      return rect.top < 190 && rect.width <= 90 && rect.height <= 90;
    }) || null;
  }

  function alignMaterialCheckerHeader() {
    if (normalizedCurrentPath() !== MATERIAL_CHECKER_ROUTE) return;

    const brandLink = findCheckerBrandLink();
    if (!brandLink) return;

    brandLink.classList.add('upskill-checker-brand-link');
    brandLink.setAttribute('href', '/');
    brandLink.style.textDecoration = 'none';

    const header = brandLink.closest('header') || brandLink.closest('[class*="header"]');
    if (header) header.classList.add('upskill-checker-header');

    const brandRow = brandLink.parentElement;
    if (brandRow) brandRow.classList.add('upskill-checker-brand-row');

    let badge = findCheckerInitialsBadge(brandLink, header);
    if (!badge && brandRow) {
      badge = Array.from(brandRow.children).find(function (element) {
        return element !== brandLink && (element.textContent || '').trim().toUpperCase() === 'US';
      }) || null;
    }

    if (!badge) return;

    const logo = document.createElement('img');
    logo.src = '/assets/logo-icon.png';
    logo.alt = 'UpSkill Sprint Consulting logo';
    logo.width = 38;
    logo.height = 38;

    badge.replaceChildren(logo);
    badge.classList.add('upskill-checker-logo-slot');
    badge.setAttribute('aria-label', 'UpSkill Sprint Consulting logo');
  }

  function repairEngineeringToolsCleanRoute() {
    const pathname = normalizedCurrentPath();
    if (pathname !== '/engineering-tools') return;

    const tools = [
      {
        id: 'materials-quality',
        path: '/tools/material-specification-compliance-checker',
        action: 'Open checker',
        label: 'Open Material Specification Compliance Checker'
      },
      {
        id: 'engineering-calculators',
        path: '/tools/engineering-statistics-calculator',
        action: 'Open calculator',
        label: 'Open Engineering and Statistics Calculator',
        title: 'Engineering &amp; Statistics Calculator',
        description: 'Scientific calculations, descriptive statistics and regression, 16 probability distributions, reliability metrics, and nine hypothesis-test workflows.'
      },
      {
        id: 'converters',
        path: '/tools/unit-converter',
        action: 'Open converter',
        label: 'Open Engineering Unit Converter'
      }
    ];

    tools.forEach(function (tool) {
      const card = document.getElementById(tool.id);
      if (!card) return;

      card.setAttribute('href', tool.path);
      card.classList.remove('is-planned');
      card.setAttribute('aria-label', tool.label);

      const status = card.querySelector('.tool-status');
      if (status) {
        status.textContent = 'Available';
        status.classList.add('available');
      }

      const action = card.querySelector('.tool-link');
      if (action) {
        action.textContent = tool.action;
        action.classList.remove('secondary');
        action.classList.add('primary');
      }

      const heading = card.querySelector('.tool-content h2');
      if (heading && tool.title) heading.innerHTML = tool.title;

      const description = card.querySelector('.tool-content p');
      if (description && tool.description) description.textContent = tool.description;
    });

    document.querySelectorAll('a[href$="engineering-tools.html"], a[href="/engineering-tools"]').forEach(function (link) {
      link.setAttribute('href', '/engineering-tools');
      if (link.textContent.trim() === 'Engineering Tools') link.setAttribute('aria-current', 'page');
    });
  }

  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;

    requestAnimationFrame(function () {
      scanScheduled = false;
      scan(document);
      cleanCanonicalAndSocialUrls();
      alignMaterialCheckerHeader();
      repairEngineeringToolsCleanRoute();
    });
  }

  function initialize() {
    ensureStyles();
    cleanBrowserAddress();
    cleanCanonicalAndSocialUrls();
    scan(document);
    alignMaterialCheckerHeader();
    repairEngineeringToolsCleanRoute();

    const observer = new MutationObserver(function (mutations) {
      const relevantMutation = mutations.find(function (mutation) {
        return mutation.type === 'characterData' || mutation.addedNodes.length > 0;
      });
      if (relevantMutation) scheduleScan();
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}());
