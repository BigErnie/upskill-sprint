(function(){
'use strict';
var attempts=0;
function start(){
  var tool=document.getElementById('spx-tool'),tabs=tool&&tool.querySelector('.spx-tabs'),navigator=document.getElementById('spx-tab-navigator');
  if(!tool||!tabs||!navigator){if(attempts++<80)setTimeout(start,50);return}
  if(document.getElementById('spx-tab-hardenability'))return;
  if(!document.querySelector('link[href="/tools/steel-phase-explorer-release2.css"]')){var link=document.createElement('link');link.rel='stylesheet';link.href='/tools/steel-phase-explorer-release2.css';document.head.appendChild(link)}
  var learn=tabs.querySelector('[data-tab="learn"]');
  [['hardenability','Hardenability'],['austenitization','Austenitization'],['quenching','Quenching']].forEach(function(x){var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected','false');b.setAttribute('aria-controls','spx-tab-'+x[0]);b.dataset.tab=x[0];b.textContent=x[1];tabs.insertBefore(b,learn||null)});
  var q=document.getElementById('spx-question-grid');
  if(q){q.insertAdjacentHTML('beforeend',
    '<button type="button" class="spx-question-card spx-release2-question" data-release2-route="hardenability"><strong>Will the centre of my part harden?</strong><span>Relate chemistry, Jominy response, section size, geometry, and quench severity to hardness through the section.</span></button>'+ 
    '<button type="button" class="spx-question-card spx-release2-question" data-release2-route="austenitization"><strong>Is my austenitizing cycle adequate?</strong><span>Balance heat-through, carbide dissolution, homogenization, and prior-austenite grain growth.</span></button>'+ 
    '<button type="button" class="spx-question-card spx-release2-question" data-release2-route="quenching"><strong>Which quench medium should I compare?</strong><span>Compare cooling curves, surface-to-centre transformation, hardness, distortion, and cracking risk.</span></button>');}
  var eyebrow=navigator.querySelector('.spx-eyebrow');if(eyebrow)eyebrow.textContent='Releases 1 & 2 · Guided metallurgy and applied heat treatment';
  var shell=document.createElement('div');shell.innerHTML=`
<section id="spx-tab-hardenability" class="spx-panel" role="tabpanel" data-panel="hardenability" hidden>
  <div class="spx-r2-hero spx-card spx-card-pad"><p class="spx-eyebrow">Release 2 · Hardenability</p><div class="spx-card-title"><div><h2>Jominy and section-size hardenability simulator</h2><p>Separate maximum hardness from the ability to form martensite below the surface.</p></div><button class="spx-btn" type="button" data-r2-help="hardenability">How to interpret</button></div><div class="spx-note"><strong>Model caution:</strong> this is a chemistry-calibrated teaching model, not an ASTM A255 calculation or a substitute for measured Jominy data.</div></div>
  <div class="spx-grid-2 spx-r2-grid">
    <div class="spx-card">
      <div class="spx-card-pad"><div class="spx-card-title"><div><h2>Section and quench inputs</h2><p>Use verified chemistry in the Chemistry tab before interpreting the result.</p></div><button class="spx-btn primary" id="spx-hard-sync" type="button">Use selected quench setup</button></div>
        <div class="spx-fields spx-r2-fields">
          <div class="spx-field"><label for="spx-hard-geometry">Geometry</label><select id="spx-hard-geometry"><option value="round">Round bar / pipe wall analogue</option><option value="plate">Plate / flat section</option></select></div>
          <div class="spx-field"><label for="spx-hard-size">Diameter or thickness <span class="spx-hint">(mm)</span></label><input id="spx-hard-size" type="number" min="2" max="500" step="1" value="50"></div>
          <div class="spx-field"><label for="spx-hard-medium">Quench medium</label><select id="spx-hard-medium"></select></div>
          <div class="spx-field"><label for="spx-hard-agitation">Agitation</label><select id="spx-hard-agitation"><option value="still">Still</option><option value="moderate" selected>Moderate</option><option value="vigorous">Vigorous</option></select></div>
          <div class="spx-field"><label for="spx-hard-grain">Prior-austenite ASTM grain number</label><input id="spx-hard-grain" type="number" min="1" max="14" step="0.5" value="8"></div>
          <div class="spx-field"><label for="spx-hard-target">Target hardness <span class="spx-hint">(HV)</span></label><input id="spx-hard-target" type="number" min="120" max="900" step="10" value="450"></div>
        </div>
      </div>
      <div class="spx-svg-wrap"><svg id="spx-jominy-svg" viewBox="0 0 760 410" role="img" aria-label="Estimated Jominy hardness and martensite profile"></svg></div>
    </div>
    <div class="spx-side-stack">
      <div class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Hardenability summary</h2><p>Estimated response for the active chemistry.</p></div></div><div id="spx-hard-metrics" class="spx-metrics"></div><div id="spx-hard-status" class="spx-note" style="margin-top:9px"></div></div>
      <div class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Hardness through the section</h2><p>Surface, quarter-depth, and centre estimates.</p></div></div><canvas id="spx-section-canvas" width="520" height="250" aria-label="Section hardness gradient"></canvas><div class="spx-table-wrap"><table class="spx-table"><thead><tr><th>Location</th><th>Equivalent Jominy</th><th>Martensite</th><th>Hardness</th></tr></thead><tbody id="spx-hard-depth-body"></tbody></table></div></div>
      <div class="spx-card spx-card-pad"><h2>Hardness versus hardenability</h2><p class="spx-r2-copy"><strong>Hardness</strong> is resistance to indentation at one location. <strong>Hardenability</strong> is the depth through which a steel can develop martensite under a specified quench. Carbon strongly affects martensite hardness; Mn, Cr, Mo, Ni, B, grain size, section size, and quench severity strongly affect depth.</p></div>
    </div>
  </div>
</section>

<section id="spx-tab-austenitization" class="spx-panel" role="tabpanel" data-panel="austenitization" hidden>
  <div class="spx-r2-hero spx-card spx-card-pad"><p class="spx-eyebrow">Release 2 · Austenitization</p><div class="spx-card-title"><div><h2>Austenitization and grain-growth window</h2><p>Balance heat-through, dissolution, homogenization, and prior-austenite grain coarsening.</p></div><button class="spx-btn" type="button" data-r2-help="austenitization">How to interpret</button></div><div class="spx-note"><strong>Model caution:</strong> dissolution and grain growth depend on actual carbide populations, segregation, furnace uniformity, and experimentally determined kinetics.</div></div>
  <div class="spx-grid-2 spx-r2-grid">
    <div class="spx-card">
      <div class="spx-card-pad"><div class="spx-card-title"><div><h2>Cycle definition</h2><p>Temperature is compared with the chemistry-based Ac₃ estimate.</p></div><button class="spx-btn primary" id="spx-aust-set-ac3" type="button">Set to Ac₃ + 40°</button></div>
        <div class="spx-fields spx-r2-fields">
          <div class="spx-field"><label for="spx-aust-temp">Austenitizing temperature <span class="spx-hint spx-r2-temp-unit">(°C)</span></label><input id="spx-aust-temp" type="number" step="5" value="870"></div>
          <div class="spx-field"><label for="spx-aust-hold">Hold time <span class="spx-hint">(min)</span></label><input id="spx-aust-hold" type="number" min="1" max="720" step="5" value="45"></div>
          <div class="spx-field"><label for="spx-aust-size">Controlling section <span class="spx-hint">(mm)</span></label><input id="spx-aust-size" type="number" min="2" max="500" step="1" value="25"></div>
          <div class="spx-field"><label for="spx-aust-grain">Initial ASTM grain number</label><input id="spx-aust-grain" type="number" min="1" max="14" step="0.5" value="8"></div>
          <div class="spx-field"><label for="spx-aust-start">Starting microstructure</label><select id="spx-aust-start"><option value="normalized">Normalized / fine pearlite</option><option value="annealed">Annealed / coarse pearlite</option><option value="spheroidized">Spheroidized carbides</option><option value="asrolled">As-rolled / deformed</option></select></div>
          <div class="spx-field"><label for="spx-aust-carbide">Carbide burden</label><select id="spx-aust-carbide"><option value="plain">Plain-carbon cementite</option><option value="lowalloy" selected>Low-alloy carbides</option><option value="strong">Strong Cr/Mo/V carbides</option><option value="microalloy">Nb/V/Ti microalloyed</option></select></div>
          <div class="spx-field"><label for="spx-aust-pinning">Grain-boundary pinning</label><select id="spx-aust-pinning"><option value="none">Weak / none</option><option value="moderate" selected>Moderate</option><option value="strong">Strong</option></select></div>
          <div class="spx-field"><label for="spx-aust-rate">Heating rate <span class="spx-hint">(°C/min)</span></label><input id="spx-aust-rate" type="number" min="1" max="500" step="5" value="20"></div>
        </div>
      </div>
      <div class="spx-r2-canvas-wrap"><canvas id="spx-aust-window-canvas" width="760" height="390" aria-label="Austenitization operating window heatmap"></canvas></div>
    </div>
    <div class="spx-side-stack">
      <div class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Cycle assessment</h2><p id="spx-aust-condition">—</p></div></div><div id="spx-aust-metrics" class="spx-metrics"></div><div id="spx-aust-status" class="spx-note" style="margin-top:9px"></div></div>
      <div class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Prior-austenite grain estimate</h2><p>Schematic comparison, not a metallograph.</p></div></div><canvas id="spx-grain-canvas" width="520" height="240" aria-label="Initial and estimated final grain structure"></canvas><div id="spx-grain-summary" class="spx-note" style="margin-top:9px"></div></div>
      <div class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Recommended operating window</h2><p>Calculated for the current section, starting condition, carbide burden, and pinning selection.</p></div></div><div id="spx-aust-recommendation"></div></div>
    </div>
  </div>
</section>

<section id="spx-tab-quenching" class="spx-panel" role="tabpanel" data-panel="quenching" hidden>
  <div class="spx-r2-hero spx-card spx-card-pad"><p class="spx-eyebrow">Release 2 · Quenching</p><div class="spx-card-title"><div><h2>Quench-medium and cracking-risk comparison</h2><p>Compare cooling history, transformation through the section, hardness, distortion, and cracking tendency.</p></div><button class="spx-btn" type="button" data-r2-help="quenching">How to interpret</button></div><div class="spx-note spx-r2-safety"><strong>Safety:</strong> this educational module does not provide operating instructions for hot oils, brines, polymers, molten salts, or high-temperature handling. Follow approved industrial procedures, SDS requirements, and engineered safeguards.</div></div>
  <div class="spx-grid-2 spx-r2-grid">
    <div class="spx-card">
      <div class="spx-card-pad"><div class="spx-card-title"><div><h2>Quench setup</h2><p>Surface and centre cooling are estimated separately.</p></div><button class="spx-btn primary" id="spx-quench-apply-hard" type="button">Apply to hardenability tab</button></div>
        <div class="spx-fields spx-r2-fields">
          <div class="spx-field"><label for="spx-quench-medium">Quench medium</label><select id="spx-quench-medium"></select></div>
          <div class="spx-field"><label for="spx-quench-bath">Bath temperature <span class="spx-hint spx-r2-temp-unit">(°C)</span></label><input id="spx-quench-bath" type="number" step="5" value="60"></div>
          <div class="spx-field"><label for="spx-quench-agitation">Agitation</label><select id="spx-quench-agitation"><option value="still">Still</option><option value="moderate" selected>Moderate</option><option value="vigorous">Vigorous</option></select></div>
          <div class="spx-field"><label for="spx-quench-geometry">Geometry</label><select id="spx-quench-geometry"><option value="round">Round section</option><option value="plate">Plate / flat section</option></select></div>
          <div class="spx-field"><label for="spx-quench-size">Diameter or thickness <span class="spx-hint">(mm)</span></label><input id="spx-quench-size" type="number" min="2" max="500" step="1" value="50"></div>
          <div class="spx-field"><label for="spx-quench-delay">Transfer delay <span class="spx-hint">(s)</span></label><input id="spx-quench-delay" type="number" min="0" max="300" step="1" value="8"></div>
          <div class="spx-field"><label for="spx-quench-corner">Geometry concentration</label><select id="spx-quench-corner"><option value="rounded">Generous radii</option><option value="normal" selected>Typical geometry</option><option value="sharp">Sharp corners / abrupt changes</option></select></div>
          <div class="spx-field"><label for="spx-quench-final">Final temperature <span class="spx-hint spx-r2-temp-unit">(°C)</span></label><input id="spx-quench-final" type="number" step="5" value="25"></div>
        </div>
      </div>
      <div class="spx-svg-wrap"><svg id="spx-quench-svg" viewBox="0 0 760 430" role="img" aria-label="Estimated surface quarter-depth and centre cooling curves"></svg></div>
    </div>
    <div class="spx-side-stack">
      <div class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Selected-quench result</h2><p id="spx-quench-selected-label">—</p></div></div><div id="spx-quench-metrics" class="spx-metrics"></div><div id="spx-quench-risks" class="spx-r2-risk-grid"></div><div id="spx-quench-status" class="spx-note" style="margin-top:9px"></div></div>
      <div class="spx-card spx-card-pad"><div class="spx-card-title"><div><h2>Surface-to-centre outcome</h2><p>Estimated martensite and hardness gradient.</p></div></div><canvas id="spx-quench-section-canvas" width="520" height="240" aria-label="Quenched section transformation gradient"></canvas><div class="spx-table-wrap"><table class="spx-table"><thead><tr><th>Location</th><th>800→500 rate</th><th>Martensite</th><th>Hardness</th></tr></thead><tbody id="spx-quench-depth-body"></tbody></table></div></div>
    </div>
  </div>
  <div class="spx-card spx-card-pad spx-release-section"><div class="spx-card-title"><div><h2>Quench-medium comparison</h2><p>All media are evaluated with the same chemistry, geometry, size, bath temperature, and final temperature.</p></div></div><div class="spx-table-wrap"><table class="spx-table"><thead><tr><th>Medium</th><th>Surface rate</th><th>Centre martensite</th><th>Centre hardness</th><th>Cracking risk</th><th>Distortion risk</th><th>Use note</th></tr></thead><tbody id="spx-quench-compare-body"></tbody></table></div></div>
</section>`;
  var learnPanel=document.getElementById('spx-tab-learn');while(shell.firstElementChild)learnPanel.parentNode.insertBefore(shell.firstElementChild,learnPanel);
  if(!document.querySelector('script[src="/tools/steel-phase-explorer-release2.js"]')){var script=document.createElement('script');script.src='/tools/steel-phase-explorer-release2.js';script.async=false;document.body.appendChild(script)}
}
start();
})();
