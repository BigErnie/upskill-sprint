(function () {
  'use strict';

  const ACTION_SELECTOR = 'a, button, [role="button"], input[type="button"], input[type="submit"]';
  const LEADING_ARROW = /^(?:[\s\u00a0]*(?:←|⟵|↩|↶|⬅|⇐|⟸|<-+)[\s\u00a0]*)+/u;
  const TRAILING_ARROW = /(?:[\s\u00a0]*(?:→|⟶|➜|➝|➞|➡|⟹|-+>)[\s\u00a0]*)+$/u;
  const ARROW_ONLY = /^(?:[\s\u00a0]*(?:←|⟵|↩|↶|⬅|⇐|⟸|→|⟶|➜|➝|➞|➡|⟹|<-+|-+>)[\s\u00a0]*)+$/u;
  const AFTER_CLASS = 'upskill-remove-after-arrow';
  const BEFORE_CLASS = 'upskill-remove-before-arrow';
  let scanScheduled = false;

  function ensureStyles() {
    if (document.getElementById('upskill-arrow-cleanup-styles')) return;

    const style = document.createElement('style');
    style.id = 'upskill-arrow-cleanup-styles';
    style.textContent = `
      .${AFTER_CLASS}::after { content: none !important; display: none !important; }
      .${BEFORE_CLASS}::before { content: none !important; display: none !important; }
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
      // The visible text cleanup still works when pseudo-element styles are unavailable.
    }
  }

  function cleanAction(element) {
    if (!(element instanceof Element)) return;
    removeTextArrows(element);
    removePseudoElementArrow(element);
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

  function scheduleScan(rootNode) {
    if (scanScheduled) return;
    scanScheduled = true;

    requestAnimationFrame(function () {
      scanScheduled = false;
      scan(rootNode || document);
    });
  }

  function initialize() {
    ensureStyles();
    scan(document);

    const observer = new MutationObserver(function (mutations) {
      const relevantMutation = mutations.find(function (mutation) {
        return mutation.type === 'characterData' || mutation.addedNodes.length > 0;
      });
      if (relevantMutation) scheduleScan(document);
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
