(function(){
'use strict';
var attempts=0;
function loadRelease4(){if(document.querySelector('script[src="/tools/steel-phase-explorer-release4-loader.js"]'))return;var s=document.createElement('script');s.src='/tools/steel-phase-explorer-release4-loader.js';s.async=false;document.body.appendChild(s)}
function start(){
  var tool=document.getElementById('spx-tool'),tabs=tool&&tool.querySelector('.spx-tabs'),nav=document.getElementById('spx-tab-navigator');
  if(!tool||!tabs||!nav){if(attempts++<100)setTimeout(start,50);return}
  if(document.getElementById('spx-tab-process-data')){loadRelease4();return}
  if(!document.querySelector('link[href="/tools/steel-phase-explorer-release3.css"]')){var css=document.createElement('link');css.rel='stylesheet';css.href='/tools/steel-phase-explorer-release3.css';document.head.appendChild(css)}
  var before=tabs.querySelector('[data-tab="learn"]');var tb=document.createElement('button');tb.type='button';tb.setAttribute('role','tab');tb.setAttribute('aria-selected','false');tb.setAttribute('aria-controls','spx-tab-process-data');tb.dataset.tab='process-data';tb.textContent='Process Data';tabs.insertBefore(tb,before||null);
  var q=document.getElementById('spx-question-grid');if(q)q.insertAdjacentHTML('beforeend','<button type="button" class="spx-question-card" data-release3-route="process-data"><strong>What happened in my actual thermal data?</strong><span>Upload time-temperature data, calculate cooling rates, identify candidate arrests, and compare the record with a simulated cycle.</span></button><button type="button" class="spx-question-card" data-release3-route="measurement"><strong>Could temperature measurement error explain the result?</strong><span>Check thermocouple lag, attachment quality, pyrometer emissivity, spot size, and likely bias.</span></button>');
  var eyebrow=nav.querySelector('.spx-eyebrow');if(eyebrow)eyebrow.textContent='Releases 1–3 · Guided metallurgy, heat treatment, and process data';
  var shell=document.createElement('div');shell.innerHTML=`
<section id="spx-tab-process-data" class="spx-panel" role="tabpanel" data-panel="process-data" hidden>
  <div class="spx-r3-hero spx-card spx-card-pad"><p class="spx-eyebrow">Release 3 · Process-data connection</p><div class="spx-card-title"><div><h2>Thermal data, transformation-arrest, and measurement assistant</h2><p>Bring a furnace, thermocouple, pyrometer, or cooling-test record into the explorer and compare it with the current simulated heat-treatment cycle.</p></div><span class="spx-r3-badge">Client-side analysis</span></div><div class="spx-note"><strong>Analysis caution:</strong> detected arrests are candidates, not confirmed transformations. Sensor lag, furnace control, section gradients, scale, radiation, and data filtering can create similar signatures.</div></div>
  <div class="spx-r3-grid">
    <div class="spx-r3-stack">
      <section class="spx-card">
        <div class="spx-card-pad"><div class="spx-card-title"><div><h2>1. Load a time-temperature record</h2><p>CSV, TSV, or semicolon-delimited text with a header row.</p></div><button class="spx-btn" id="spx-r3-sample" type="button">Load sample cooling data</button></div>
          <div class="spx-r3-upload"><label class="spx-r3-drop" id="spx-r3-drop"><strong>Drop a file here or choose a file</strong><span class="spx-hint">Data stays in this browser session.</span><input id="spx-r3-file" type="file" accept=".csv,.txt,.tsv,text/csv,text/plain"></label><button class="spx-btn danger" id="spx-r3-clear" type="button">Clear data</button></div>
          <div class="spx-fields" style="margin-top:10px">
            <div class="spx-field"><label for="spx-r3-time-col">Time column</label><select id="spx-r3-time-col"></select></div>
            <div class="spx-field"><label for="spx-r3-temp-col">Temperature column</label><select id="spx-r3-temp-col"></select></div>
            <div class="spx-field"><label for="spx-r3-time-unit">Time unit</label><select id="spx-r3-time-unit"><option value="s">Seconds</option><option value="min">Minutes</option><option value="h">Hours</option></select></div>
            <div class="spx-field"><label for="spx-r3-temp-unit">Temperature unit</label><select id="spx-r3-temp-unit"><option value="C">°C</option><option value="F">°F</option></select></div>
            <div class="spx-field"><label for="spx-r3-smooth">Smoothing window <span class="spx-hint">(points)</span></label><input id="spx-r3-smooth" type="number" min="1" max="51" step="2" value="5"></div>
            <div class="spx-field"><label for="spx-r3-sensitivity">Arrest sensitivity</label><input id="spx-r3-sensitivity" type="range" min="20" max="80" value="48"><div class="spx-slider-row"><span>Low</span><span></span><strong id="spx-r3-sensitivity-label">48%</strong></div></div>
          </div>
          <div id="spx-r3-file-status" class="spx-note" style="margin-top:9px">No thermal record loaded.</div>
        </div>
      </section>
      <section class="spx-card">
        <div class="spx-card-pad"><div class="spx-card-title"><div><h2>2. Temperature history and simulated-path comparison</h2><p>The dashed path comes from the current Heating & Cooling Path module.</p></div><button class="spx-btn" id="spx-r3-refresh-cycle" type="button">Refresh simulated path</button></div></div>
        <div class="spx-svg-wrap"><svg id="spx-r3-temp-svg" class="spx-r3-chart" viewBox="0 0 820 430" role="img" aria-label="Measured and simulated temperature versus time"></svg></div><div class="spx-r3-legend"><span><i></i>Measured temperature</span><span class="sim"><i></i>Simulated path</span><span class="arrest"><i></i>Candidate arrest</span></div>
      </section>
      <section class="spx-card"><div class="spx-card-pad"><div class="spx-card-title"><div><h2>3. Cooling-rate profile</h2><p>Calculated as −dT/dt after the selected smoothing window.</p></div></div></div><div class="spx-svg-wrap"><svg id="spx-r3-rate-svg" class="spx-r3-chart" viewBox="0 0 820 390" role="img" aria-label="Cooling rate versus time"></svg></div></section>
    </div>
    <aside class="spx-r3-stack">
      <section class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Record summary</h2><p id="spx-r3-record-name">No file</p></div></div><div id="spx-r3-metrics" class="spx-r3-kpis"></div><div id="spx-r3-comparison" class="spx-note" style="margin-top:9px"></div></section>
      <section class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Candidate transformation arrests</h2><p>Grouped low-cooling-rate regions and critical-temperature proximity.</p></div></div><div id="spx-r3-events"></div></section>
      <section class="spx-card spx-card-pad" id="spx-r3-measure-card"><div class="spx-card-title"><div><h2>Temperature-measurement assistant</h2><p>Evaluate likely lag, emissivity, field-of-view, and installation effects.</p></div></div>
        <div class="spx-segmented spx-r3-method-switch" id="spx-r3-method" role="group"><button type="button" data-method="tc" aria-pressed="true">Thermocouple</button><button type="button" data-method="ir" aria-pressed="false">Infrared pyrometer</button></div>
        <div id="spx-r3-tc-panel" class="spx-r3-method-panel" style="margin-top:10px"><div class="spx-r3-measure-grid">
          <div class="spx-field"><label for="spx-r3-tc-type">Thermocouple type</label><select id="spx-r3-tc-type"><option>K</option><option>N</option><option>J</option><option>R</option><option>S</option></select></div>
          <div class="spx-field"><label for="spx-r3-tc-diameter">Wire / sheath diameter <span class="spx-hint">(mm)</span></label><input id="spx-r3-tc-diameter" type="number" min="0.1" max="12" step="0.1" value="1.5"></div>
          <div class="spx-field"><label for="spx-r3-tc-attach">Attachment</label><select id="spx-r3-tc-attach"><option value="welded">Welded to workpiece</option><option value="clamped">Clamped / strapped</option><option value="contact">Touch contact</option><option value="furnace">Furnace atmosphere only</option></select></div>
          <div class="spx-field"><label for="spx-r3-tc-shield">Shielding / mass</label><select id="spx-r3-tc-shield"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div>
        </div></div>
        <div id="spx-r3-ir-panel" class="spx-r3-method-panel" hidden style="margin-top:10px"><div class="spx-r3-measure-grid">
          <div class="spx-field"><label for="spx-r3-ir-indicated">Indicated temperature <span class="spx-hint spx-r3-temp-label">(°C)</span></label><input id="spx-r3-ir-indicated" type="number" value="900"></div>
          <div class="spx-field"><label for="spx-r3-ir-e-set">Emissivity setting</label><input id="spx-r3-ir-e-set" type="number" min="0.05" max="1" step="0.01" value="0.85"></div>
          <div class="spx-field"><label for="spx-r3-ir-e-actual">Estimated actual emissivity</label><input id="spx-r3-ir-e-actual" type="number" min="0.05" max="1" step="0.01" value="0.75"></div>
          <div class="spx-field"><label for="spx-r3-ir-reflected">Reflected temperature <span class="spx-hint spx-r3-temp-label">(°C)</span></label><input id="spx-r3-ir-reflected" type="number" value="100"></div>
          <div class="spx-field"><label for="spx-r3-ir-target">Target width <span class="spx-hint">(mm)</span></label><input id="spx-r3-ir-target" type="number" min="1" value="100"></div>
          <div class="spx-field"><label for="spx-r3-ir-spot">Instrument spot diameter <span class="spx-hint">(mm)</span></label><input id="spx-r3-ir-spot" type="number" min="1" value="25"></div>
          <div class="spx-field"><label for="spx-r3-ir-surface">Surface condition</label><select id="spx-r3-ir-surface"><option value="scale">Oxidized / scaled</option><option value="clean">Clean steel</option><option value="polished">Bright / polished</option><option value="unknown">Unknown / changing</option></select></div>
        </div></div>
        <div id="spx-r3-measure-result" class="spx-note" style="margin-top:10px"></div>
      </section>
      <section class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Engineering report and exports</h2><p>Create a portable record of the current analysis.</p></div></div><div class="spx-r3-report-actions"><button class="spx-btn" id="spx-r3-export-data" type="button">Export derived CSV</button><button class="spx-btn primary" id="spx-r3-report" type="button">Download HTML report</button><button class="spx-btn" id="spx-r3-print-report" type="button">Print / PDF report</button></div><div id="spx-r3-report-status" class="spx-note" style="margin-top:9px">No report generated.</div></section>
    </aside>
  </div>
</section>`;
  var learn=document.getElementById('spx-tab-learn');learn.parentNode.insertBefore(shell.firstElementChild,learn);
  var js=document.createElement('script');js.src='/tools/steel-phase-explorer-release3.js';js.async=false;js.onload=loadRelease4;document.body.appendChild(js);
}
start();
})();
