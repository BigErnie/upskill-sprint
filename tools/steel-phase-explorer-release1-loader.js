(function(){
'use strict';
var tool=document.getElementById('spx-tool');if(!tool)return;
if(!document.querySelector('link[href="/tools/steel-phase-explorer-release1.css"]')){var link=document.createElement('link');link.rel='stylesheet';link.href='/tools/steel-phase-explorer-release1.css';document.head.appendChild(link)}
var subtitle=tool.querySelector('.spx-subtitle');if(subtitle)subtitle.textContent='Start with a practical question, then follow chemistry through processing, microstructure, properties, and performance. Explore equilibrium phases, rapid-cooling behaviour, heat-treatment paths, critical-temperature terminology, chemistry effects, trade-offs, learning challenges, and exports.';
var disclaimer=tool.querySelector('.spx-disclaimer');if(disclaimer)disclaimer.innerHTML='<strong>Engineering caution:</strong> equilibrium phase fractions are calculated from simplified Fe–Fe<sub>3</sub>C boundary models. TTT/CCT curves, transformation kinetics, critical-temperature shifts, trade-off scores, and mechanical-property values are educational estimates and must not replace grade-specific diagrams, validated metallurgical models, laboratory testing, or governing specifications.';
var tabs=tool.querySelector('.spx-tabs');
if(tabs&&!document.getElementById('spx-experience-selector')){var shell=document.createElement('div');shell.innerHTML=`<section class="spx-release-toolbar" aria-label="Guided explorer settings">
  <div class="spx-release-control">
    <span class="spx-control-label">Experience level</span>
    <div class="spx-segmented" id="spx-experience-selector" role="group" aria-label="Experience level">
      <button type="button" data-experience="beginner" aria-pressed="true">Beginner</button>
      <button type="button" data-experience="engineer" aria-pressed="false">Engineer</button>
      <button type="button" data-experience="advanced" aria-pressed="false">Advanced</button>
    </div>
  </div>
  <div class="spx-release-control">
    <span class="spx-control-label">Interpretation basis</span>
    <div class="spx-segmented" id="spx-basis-selector" role="group" aria-label="Transformation interpretation basis">
      <button type="button" data-basis="equilibrium" aria-pressed="true">Equilibrium</button>
      <button type="button" data-basis="rapid" aria-pressed="false">Rapid cooling</button>
    </div>
  </div>
</section>
<div class="spx-mode-summary" id="spx-mode-summary" aria-live="polite"></div>`;while(shell.firstChild)tabs.parentNode.insertBefore(shell.firstChild,tabs)}
if(tabs&&!tabs.querySelector('[data-tab="navigator"]')){var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected','true');b.setAttribute('aria-controls','spx-tab-navigator');b.dataset.tab='navigator';b.textContent='Guided start';tabs.insertBefore(b,tabs.firstChild);var old=tabs.querySelector('[data-tab="equilibrium"]');if(old)old.setAttribute('aria-selected','false')}
var equilibrium=document.getElementById('spx-tab-equilibrium');
if(equilibrium&&!document.getElementById('spx-tab-navigator')){var shell2=document.createElement('div');shell2.innerHTML=`<section id="spx-tab-navigator" class="spx-panel" role="tabpanel" data-panel="navigator">
  <div class="spx-guide-hero spx-card">
    <div class="spx-card-pad">
      <p class="spx-eyebrow">Release 1 · Guided metallurgy navigator</p>
      <div class="spx-card-title">
        <div>
          <h2>What are you trying to understand?</h2>
          <p>Choose a practical question. The explorer will open the most relevant module and explain the result at your selected experience level.</p>
        </div>
        <button class="spx-btn primary" type="button" id="spx-resume-work">Open the phase diagram</button>
      </div>
      <div class="spx-question-grid" id="spx-question-grid">
        <button type="button" class="spx-question-card" data-guide-route="phase"><strong>What phases are present?</strong><span>Plot carbon and temperature, identify the equilibrium field, and calculate phase fractions.</span></button>
        <button type="button" class="spx-question-card" data-guide-route="path"><strong>What happens while I heat or cool?</strong><span>Build a thermal cycle and watch transformation events along the path.</span></button>
        <button type="button" class="spx-question-card" data-guide-route="rapid"><strong>What may form after rapid cooling?</strong><span>Compare ferrite, pearlite, bainite, and martensite tendencies using the generalized CCT view.</span></button>
        <button type="button" class="spx-question-card" data-guide-route="chemistry"><strong>How does chemistry change behaviour?</strong><span>Explore CE, Pcm, critical temperatures, hardenability, weldability, and directional properties.</span></button>
        <button type="button" class="spx-question-card" data-guide-route="critical"><strong>What do Ae, Ac, Ar, Ms, and Mf mean?</strong><span>Use the critical-temperature coach to separate equilibrium, heating, cooling, and martensitic terminology.</span></button>
        <button type="button" class="spx-question-card" data-guide-route="tradeoffs"><strong>What trade-offs does a process change create?</strong><span>Move carbon, cooling, austenitizing, and tempering controls and see the competing effects.</span></button>
      </div>
      <div class="spx-guide-recommendation" id="spx-guide-recommendation" aria-live="polite">Select a question to receive a recommended workflow.</div>
    </div>
  </div>

  <section class="spx-card spx-card-pad spx-release-section" id="spx-causal-card">
    <div class="spx-card-title">
      <div><h2>Chemistry → process → microstructure → properties → performance</h2><p>A live causal chain for the active point and selected interpretation basis.</p></div>
      <button class="spx-btn" type="button" id="spx-refresh-causal">Refresh chain</button>
    </div>
    <div class="spx-causal-summary" id="spx-causal-summary"></div>
    <div class="spx-causal-chain" id="spx-causal-chain"></div>
    <div class="spx-note" id="spx-causal-caution"></div>
  </section>

  <section class="spx-card spx-card-pad spx-release-section" id="spx-nomenclature-card">
    <div class="spx-card-title">
      <div><h2>Critical-temperature nomenclature coach</h2><p>See why an equilibrium boundary is not always the transformation temperature observed during heating or cooling.</p></div>
      <button class="spx-btn" type="button" id="spx-reset-critical">Reset rates</button>
    </div>
    <div class="spx-fields spx-critical-controls">
      <div class="spx-field"><label for="spx-heating-rate">Heating rate <span class="spx-hint">(°C/min)</span></label><input id="spx-heating-rate" type="range" min="1" max="200" value="40"><div class="spx-slider-row"><span>Slow</span><span></span><strong id="spx-heating-rate-label">40 °C/min</strong></div></div>
      <div class="spx-field"><label for="spx-cooling-rate-coach">Cooling rate <span class="spx-hint">(°C/min)</span></label><input id="spx-cooling-rate-coach" type="range" min="1" max="300" value="120"><div class="spx-slider-row"><span>Slow</span><span></span><strong id="spx-cooling-rate-coach-label">120 °C/min</strong></div></div>
      <div class="spx-field"><label>Selected chemistry</label><div class="spx-static-field" id="spx-critical-chemistry">—</div></div>
    </div>
    <div class="spx-critical-plot" id="spx-critical-plot" aria-label="Estimated equilibrium, heating, cooling, and martensite temperatures"></div>
    <div class="spx-nomenclature-grid" id="spx-nomenclature-grid">
      <button type="button" data-critical-term="Ae"><strong>Ae</strong><span>Equilibrium boundary</span></button>
      <button type="button" data-critical-term="Ac"><strong>Ac</strong><span>Observed on heating</span></button>
      <button type="button" data-critical-term="Ar"><strong>Ar</strong><span>Observed on cooling</span></button>
      <button type="button" data-critical-term="Ms"><strong>Ms</strong><span>Martensite starts</span></button>
      <button type="button" data-critical-term="Mf"><strong>Mf</strong><span>Martensite finishes</span></button>
    </div>
    <div class="spx-note" id="spx-nomenclature-explanation"></div>
    <div class="spx-formula spx-advanced-only" id="spx-critical-model-note"></div>
  </section>

  <section class="spx-card spx-card-pad spx-release-section" id="spx-tradeoff-card">
    <div class="spx-card-title">
      <div><h2>Interactive metallurgy trade-off dashboard</h2><p>Metallurgy is an optimization problem. Improving one outcome can create risk somewhere else.</p></div>
      <button class="spx-btn primary" type="button" id="spx-apply-tradeoff">Apply to active scenario</button>
    </div>
    <div class="spx-trade-controls">
      <div class="spx-field"><label for="spx-trade-carbon">Carbon <span class="spx-hint">(wt%)</span></label><input id="spx-trade-carbon" type="range" min="0.05" max="1.00" step="0.01" value="0.20"><div class="spx-slider-row"><span>Low</span><span></span><strong id="spx-trade-carbon-label">0.20%</strong></div></div>
      <div class="spx-field"><label for="spx-trade-cooling">Cooling intensity</label><input id="spx-trade-cooling" type="range" min="0" max="100" value="50"><div class="spx-slider-row"><span>Slow</span><span></span><strong id="spx-trade-cooling-label">10 °C/s</strong></div></div>
      <div class="spx-field"><label for="spx-trade-superheat">Austenitizing superheat <span class="spx-hint">(°C above Ac₃)</span></label><input id="spx-trade-superheat" type="range" min="0" max="180" value="40"><div class="spx-slider-row"><span>Low</span><span></span><strong id="spx-trade-superheat-label">40 °C</strong></div></div>
      <div class="spx-field"><label for="spx-trade-temper">Tempering temperature <span class="spx-hint">(°C)</span></label><input id="spx-trade-temper" type="range" min="20" max="700" value="200"><div class="spx-slider-row"><span>As-quenched</span><span></span><strong id="spx-trade-temper-label">200 °C</strong></div></div>
    </div>
    <div class="spx-trade-results" id="spx-trade-results"></div>
    <div class="spx-trade-narrative" id="spx-trade-narrative"></div>
    <div class="spx-formula spx-advanced-only" id="spx-trade-model-note">Qualitative teaching model: normalized chemistry, cooling intensity, superheat, and tempering effects are combined into directional 0–100 scores. These scores are not material specifications or validated design values.</div>
    <div class="spx-note" id="spx-trade-status">The dashboard is independent until you apply the carbon and cooling settings to the active scenario.</div>
  </section>
</section>`;equilibrium.parentNode.insertBefore(shell2.firstElementChild,equilibrium);equilibrium.hidden=true}
var detailChecks=equilibrium&&equilibrium.querySelector('.spx-checks');if(detailChecks)detailChecks.classList.add('spx-engineer-only');
var formulas=document.getElementById('spx-chem-formulas');if(formulas)formulas.classList.add('spx-advanced-only');
var compareBody=document.getElementById('spx-compare-body');if(compareBody){var card=compareBody.closest('.spx-card');if(card){card.id='spx-comparison-card';card.classList.add('spx-engineer-only')}}
var bottom=document.querySelector('.spx-bottom-nav');if(bottom&&!bottom.querySelector('.spx-bottom-guide')){var guide=document.createElement('a');guide.className='spx-bottom-guide';guide.href='/tools/steel-phase-explorer/how-to-use';guide.textContent='How to Use This Tool';bottom.appendChild(guide)}
if(!document.querySelector('script[src="/tools/steel-phase-explorer-release1.js"]')){var script=document.createElement('script');script.src='/tools/steel-phase-explorer-release1.js';script.defer=false;document.body.appendChild(script)}
})();
