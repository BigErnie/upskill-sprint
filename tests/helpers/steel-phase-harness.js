'use strict';
/*
 * Boots tools/steel-phase-explorer.html with the real loader chain.
 *
 * Scripts are served from disk through a ResourceLoader and executed by jsdom
 * as genuine classic scripts. Evaluating them with win.eval() instead is wrong:
 * these files open with 'use strict', so eval keeps their declarations out of
 * global scope and the shared helpers never appear. That is a harness artifact
 * a browser would never produce.
 */
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, requestInterceptor } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const TOOL = path.join(ROOT, 'tools', 'steel-phase-explorer.html');

const TYPES = {
  '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.html': 'text/html'
};

/* Serve every request out of the working tree instead of the network. */
function localFiles(record) {
  return requestInterceptor(request => {
    const rel = decodeURIComponent(
      request.url.replace(/^https?:\/\/[^/]+\//, '').split('?')[0].split('#')[0]);
    const file = path.join(ROOT, rel);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      record.loaded.push(rel);
      return new Response(fs.readFileSync(file), {
        headers: { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }
      });
    }
    record.missing.push(rel);
    return new Response('', { status: 404 });
  });
}

function bootTool(options) {
  const opts = options || {};
  const record = { loaded: [], missing: [], errors: [] };

  const dom = new JSDOM(fs.readFileSync(TOOL, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: { interceptors: [localFiles(record)] },
    url: 'https://upskillsprint.com/tools/steel-phase-explorer'
  });
  const win = dom.window;

  win.SVGElement.prototype.createSVGPoint = function () {
    return { x: 0, y: 0, matrixTransform() { return { x: 0, y: 0 }; } };
  };
  win.SVGElement.prototype.getScreenCTM = function () { return { inverse: () => ({}) }; };
  win.SVGElement.prototype.getBBox = function () { return { x: 0, y: 0, width: 100, height: 100 }; };
  win.Element.prototype.scrollTo = function () {};
  win.Element.prototype.setPointerCapture = function () {};
  win.Element.prototype.releasePointerCapture = function () {};
  win.Element.prototype.requestFullscreen = function () { return Promise.resolve(); };
  /* jsdom ships no 2D context. A permissive stub keeps drawing code running
     so the rest of the workflow can be exercised; nothing here asserts on
     pixels. */
  win.HTMLCanvasElement.prototype.getContext = function () {
    const store = {};
    return new Proxy(store, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (prop === 'canvas') return undefined;
        if (prop === 'measureText') return () => ({ width: 10 });
        if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
          return () => ({ addColorStop() {} });
        }
        return () => undefined;
      },
      set(target, prop, value) { target[prop] = value; return true; }
    });
  };
  win.HTMLCanvasElement.prototype.toBlob = function (cb) { cb(null); };
  win.URL.createObjectURL = () => 'blob:stub';
  win.URL.revokeObjectURL = () => {};
  win.fetch = opts.fetch || (() => Promise.reject(new Error('network disabled in tests')));

  win.addEventListener('error', e => record.errors.push(String(e.message || e)));
  const realError = win.console.error;
  win.console.error = function () {
    record.errors.push(Array.prototype.join.call(arguments, ' '));
    if (opts.verbose) realError.apply(win.console, arguments);
  };

  return { win, doc: win.document, record, dom };
}

/* The loaders poll for the tool DOM, so readiness is asynchronous. */
function waitFor(win, predicate, timeoutMs) {
  const limit = timeoutMs || 4000;
  const started = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      let ok = false;
      try { ok = predicate(win); } catch (err) { /* not ready */ }
      if (ok) return resolve(true);
      if (Date.now() - started > limit) return reject(new Error('timed out waiting for the tool'));
      setTimeout(poll, 25);
    })();
  });
}

const ready = win => waitFor(win, w =>
  w.__SPX && w.__SPX.release5 && w.document.getElementById('spx-r5-svg'));

module.exports = { bootTool, waitFor, ready, ROOT };
