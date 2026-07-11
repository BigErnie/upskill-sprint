(function () {
  'use strict';

  const TEXT_SELECTOR = [
    'h1','h2','h3','h4','h5','h6','p','span','small','strong','b','em','i',
    'label','li','dt','dd','td','th','a','button','input','select','textarea',
    '[role="button"]','[role="status"]','[role="alert"]','[aria-label]'
  ].join(',');

  const LIGHT_CLASS = 'upskill-contrast-on-light';
  const DARK_CLASS = 'upskill-contrast-on-dark';
  const SKIP_SELECTOR = 'script,style,noscript,template,svg,canvas,[data-contrast-ignore]';
  let scanQueued = false;

  function ensureStyles() {
    if (document.getElementById('upskill-contrast-fix-styles')) return;

    const style = document.createElement('style');
    style.id = 'upskill-contrast-fix-styles';
    style.textContent = `
      .${LIGHT_CLASS} {
        color: #172033 !important;
        text-shadow: none !important;
      }
      .${DARK_CLASS} {
        color: #f4f7fb !important;
      }
      input.${LIGHT_CLASS}::placeholder,
      textarea.${LIGHT_CLASS}::placeholder {
        color: #5e6b7f !important;
        opacity: 1 !important;
      }
      input.${DARK_CLASS}::placeholder,
      textarea.${DARK_CLASS}::placeholder {
        color: #b9c5d6 !important;
        opacity: 1 !important;
      }
      select.${LIGHT_CLASS} option {
        color: #172033 !important;
        background: #ffffff !important;
      }
      select.${DARK_CLASS} option {
        color: #f4f7fb !important;
        background: #111c2d !important;
      }
    `;
    document.head.appendChild(style);
  }

  function parseColour(value) {
    if (!value || value === 'transparent') return null;
    const match = value.match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;

    const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(function (part, index) {
      return index < 3 && Number.isNaN(part);
    })) return null;

    return {
      r: Math.max(0, Math.min(255, parts[0])),
      g: Math.max(0, Math.min(255, parts[1])),
      b: Math.max(0, Math.min(255, parts[2])),
      a: parts.length > 3 && !Number.isNaN(parts[3]) ? Math.max(0, Math.min(1, parts[3])) : 1
    };
  }

  function blend(foreground, background) {
    const alpha = foreground.a + background.a * (1 - foreground.a);
    if (alpha <= 0) return { r: 255, g: 255, b: 255, a: 1 };

    return {
      r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
      g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
      b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
      a: alpha
    };
  }

  function effectiveBackground(element) {
    const layers = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const colour = parseColour(getComputedStyle(current).backgroundColor);
      if (colour && colour.a > 0) layers.push(colour);
      current = current.parentElement;
    }

    let result = { r: 255, g: 255, b: 255, a: 1 };
    for (let index = layers.length - 1; index >= 0; index -= 1) {
      result = blend(layers[index], result);
    }
    return result;
  }

  function linearChannel(channel) {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  }

  function luminance(colour) {
    return 0.2126 * linearChannel(colour.r) +
      0.7152 * linearChannel(colour.g) +
      0.0722 * linearChannel(colour.b);
  }

  function contrastRatio(first, second) {
    const firstLum = luminance(first);
    const secondLum = luminance(second);
    const lighter = Math.max(firstLum, secondLum);
    const darker = Math.min(firstLum, secondLum);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function hasVisibleText(element) {
    if (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement) return true;

    return Array.from(element.childNodes).some(function (node) {
      return node.nodeType === Node.TEXT_NODE && Boolean(node.nodeValue && node.nodeValue.trim());
    });
  }

  function minimumContrast(styles) {
    const fontSize = parseFloat(styles.fontSize) || 16;
    const weight = parseInt(styles.fontWeight, 10) || 400;
    const largeText = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
    return largeText ? 3 : 4.5;
  }

  function setRepairClass(element, desiredClass) {
    const hasLight = element.classList.contains(LIGHT_CLASS);
    const hasDark = element.classList.contains(DARK_CLASS);

    if (desiredClass === LIGHT_CLASS) {
      if (!hasLight) element.classList.add(LIGHT_CLASS);
      if (hasDark) element.classList.remove(DARK_CLASS);
      return;
    }

    if (desiredClass === DARK_CLASS) {
      if (!hasDark) element.classList.add(DARK_CLASS);
      if (hasLight) element.classList.remove(LIGHT_CLASS);
      return;
    }

    if (hasLight) element.classList.remove(LIGHT_CLASS);
    if (hasDark) element.classList.remove(DARK_CLASS);
  }

  function repairElement(element) {
    if (!(element instanceof Element) || element.matches(SKIP_SELECTOR) || element.closest(SKIP_SELECTOR)) return;
    if (!hasVisibleText(element)) return;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const styles = getComputedStyle(element);
    if (styles.visibility === 'hidden' || styles.display === 'none' || Number(styles.opacity) === 0) return;

    const background = effectiveBackground(element);
    const backgroundIsLight = luminance(background) >= 0.5;
    const existingRepair = element.classList.contains(LIGHT_CLASS) || element.classList.contains(DARK_CLASS);

    // Once an element has been repaired, keep the appropriate class unless its
    // background switches between light and dark. This prevents observer loops.
    if (existingRepair) {
      setRepairClass(element, backgroundIsLight ? LIGHT_CLASS : DARK_CLASS);
      return;
    }

    const textColour = parseColour(styles.color);
    if (!textColour) return;

    const ratio = contrastRatio(textColour, background);
    if (ratio >= minimumContrast(styles)) return;

    setRepairClass(element, backgroundIsLight ? LIGHT_CLASS : DARK_CLASS);
  }

  function scan(root) {
    ensureStyles();
    const scope = root && root.querySelectorAll ? root : document;

    if (root instanceof Element && root.matches(TEXT_SELECTOR)) repairElement(root);
    scope.querySelectorAll(TEXT_SELECTOR).forEach(repairElement);
  }

  function queueScan(root) {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(function () {
      scanQueued = false;
      scan(root || document);
    });
  }

  function initialize() {
    scan(document);

    const observer = new MutationObserver(function (mutations) {
      const changed = mutations.some(function (mutation) {
        return mutation.type === 'characterData' || mutation.type === 'attributes' || mutation.addedNodes.length > 0;
      });
      if (changed) queueScan(document);
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'disabled', 'data-theme']
    });

    window.addEventListener('upskill:themechange', function () { queueScan(document); });
    window.addEventListener('resize', function () { queueScan(document); }, { passive: true });
    window.addEventListener('load', function () { queueScan(document); }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}());
