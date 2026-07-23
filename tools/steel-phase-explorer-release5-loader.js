(function(){
'use strict';
var attempts=0,VERSION='20260723-exact-source';
function addCss(href){if(document.querySelector('link[data-spx-r5-css]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=href+'?v='+VERSION;l.dataset.spxR5Css='1';document.head.appendChild(l)}
function addScript(src){if(document.querySelector('script[data-spx-r5-script]'))return;var s=document.createElement('script');s.src=src+'?v='+VERSION;s.async=false;s.dataset.spxR5Script='1';document.body.appendChild(s)}
function start(){
  var tool=document.getElementById('spx-tool'),tabs=tool&&tool.querySelector('.spx-tabs'),nav=document.getElementById('spx-tab-navigator');
  if(!tool||!tabs||!nav||!document.getElementById('spx-tab-metallurgy-lab')){if(attempts++<240)setTimeout(start,50);return}
  if(document.getElementById('spx-tab-reference-diagrams'))return;
  addCss('/tools/steel-phase-explorer-release5.css');
  var before=tabs.querySelector('[data-tab="learn"]'),button=document.createElement('button');
  button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-selected','false');button.setAttribute('aria-controls','spx-tab-reference-diagrams');button.dataset.tab='reference-diagrams';button.textContent='Interactive diagrams';tabs.insertBefore(button,before||null);
  var q=document.getElementById('spx-question-grid');
  if(q)q.insertAdjacentHTML('beforeend','<button type="button" class="spx-question-card" data-release5-route="rapid"><strong>What microconstituent region does rapid quenching enter?</strong><span>Inspect the exact supplied rapid-quench reference with calibrated interactive coordinates and explanations.</span></button><button type="button" class="spx-question-card" data-release5-route="full"><strong>Where is this composition on the complete iron-carbon poster?</strong><span>Explore the official Buehler iron-carbon/cementite poster with coordinates, comparison points, and learning hotspots.</span></button>');
  var eyebrow=nav.querySelector('.spx-eyebrow');if(eyebrow)eyebrow.textContent='Releases 1–5 · Complete guided steel-metallurgy platform';
  var shell=document.createElement('div');shell.innerHTML=`
<section id="spx-tab-reference-diagrams" class="spx-panel" role="tabpanel" data-panel="reference-diagrams" hidden>
  <div class="spx-r5-hero spx-card spx-card-pad">
    <p class="spx-eyebrow">Release 5 · Exact-source interactive references</p>
    <div class="spx-card-title"><div><h2>Original reference visuals with a calibrated interactive layer</h2><p>The rapid-quench module uses the exact supplied image as its visual base, retaining its proportions, grid, curves, labels, axes, colors, and visual texture. The complete Buehler iron-carbon poster is shown from its official source. Interaction is added above both references without redesigning them.</p></div><span class="spx-r3-badge">Exact visual + interaction</span></div>
    <div class="spx-note"><strong>Publication and engineering caution:</strong> source artwork remains the property of its respective owner. Confirm public-display and redistribution rights before production release. Interactive classifications are educational aids and do not replace grade-specific TTT/CCT, thermodynamic data, or laboratory validation.</div>
  </div>
  <nav class="spx-r5-subnav" id="spx-r5-subnav" aria-label="Interactive reference diagrams"><button type="button" data-r5-map="rapid" aria-pressed="true">Rapid-quench exact reference</button><button type="button" data-r5-map="full" aria-pressed="false">Buehler iron-carbon poster</button></nav>
  <div class="spx-r5-layout">
    <section class="spx-card spx-r5-main-card">
      <div class="spx-card-pad">
        <div class="spx-card-title"><div><h2 id="spx-r5-title">Rapid-quench microconstituent diagram — exact supplied visual</h2><p id="spx-r5-subtitle">The source image remains visually intact; interaction is added through a calibrated transparent SVG layer.</p></div><div class="spx-toolbar"><button class="spx-btn primary" id="spx-r5-export" type="button">Export high-resolution PNG</button><button class="spx-btn" id="spx-r5-example" type="button">Load examples</button></div></div>
        <div class="spx-r5-controls">
          <div class="spx-release-control"><span class="spx-control-label">Interactive readout</span><div class="spx-segmented" id="spx-r5-unit" role="group" aria-label="Interactive temperature readout"><button type="button" data-r5-unit="metric" aria-pressed="true">Metric (°C)</button><button type="button" data-r5-unit="imperial" aria-pressed="false">Imperial (°F)</button></div></div>
          <div class="spx-checks spx-r5-checks"><label><input id="spx-r5-critical" type="checkbox" checked> Critical-line emphasis</label><label><input id="spx-r5-labels" type="checkbox" checked> Interactive labels</label><label><input id="spx-r5-crosshair-toggle" type="checkbox" checked> Crosshair</label><label><input id="spx-r5-legend-toggle" type="checkbox" checked> Legend</label><label id="spx-r5-graphite-label"><input id="spx-r5-graphite" type="checkbox" checked> Graphite-field emphasis</label></div>
        </div>
        <div class="spx-r5-viewbar"><div class="spx-toolbar"><button class="spx-btn" id="spx-r5-zoom-out" type="button" aria-label="Zoom out">−</button><button class="spx-btn" id="spx-r5-zoom-reset" type="button">Fit</button><button class="spx-btn" id="spx-r5-zoom-in" type="button" aria-label="Zoom in">+</button><button class="spx-btn" id="spx-r5-fullscreen" type="button">Full screen</button></div><span id="spx-r5-zoom-label">100%</span></div>
        <div class="spx-r5-points-head"><div><h3>Comparison points</h3><p>Click or drag inside the calibrated graph rectangle to move the active point. Shift-drag, middle-drag, or touch-drag while zoomed to pan.</p></div><div class="spx-toolbar"><button class="spx-btn primary" id="spx-r5-add" type="button">+ Add point</button><button class="spx-btn" id="spx-r5-remove" type="button">Remove active</button></div></div>
        <div id="spx-r5-points-list" class="spx-r5-points" aria-live="polite"></div>
      </div>
      <div class="spx-r5-svg-wrap" id="spx-r5-svg-wrap">
        <svg id="spx-r5-svg" viewBox="0 0 850 890" role="img" aria-label="Interactive exact-source steel metallurgy reference diagram" tabindex="0">
          <defs><filter id="spx-r5-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".35"/></filter></defs>
          <g id="spx-r5-reference"></g><g id="spx-r5-hotspots"></g><g id="spx-r5-emphasis"></g><g id="spx-r5-overlay"></g><g id="spx-r5-point-layer"></g>
        </svg>
        <div class="spx-tooltip spx-r5-tooltip" id="spx-r5-tooltip" hidden></div>
      </div>
      <div class="spx-card-pad"><div class="spx-r5-source-note" id="spx-r5-source-note"></div><div class="spx-r5-status" id="spx-r5-status" aria-live="polite">Loading the exact rapid-quench reference…</div></div>
    </section>
    <aside class="spx-r5-side">
      <section class="spx-card spx-card-pad" id="spx-r5-legend-card"><div class="spx-card-title"><div><h2>Legend</h2><p>Region colors and interactive reference boundaries.</p></div></div><div id="spx-r5-legend" class="spx-r5-legend"></div></section>
      <section class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Selected point analysis</h2><p id="spx-r5-active-summary">—</p></div></div><div id="spx-r5-analysis"></div></section>
      <section class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>What does this region mean?</h2><p>Select a point, region, legend item, or poster hotspot.</p></div></div><div id="spx-r5-help"></div></section>
      <section class="spx-card spx-card-pad spx-advanced-only"><h2>Source and calibration method</h2><div id="spx-r5-model-note" class="spx-formula"></div></section>
    </aside>
  </div>
</section>`;
  var learn=document.getElementById('spx-tab-learn');learn.parentNode.insertBefore(shell.firstElementChild,learn);
  addScript('/tools/steel-phase-explorer-release5.js');
}
start();
})();
