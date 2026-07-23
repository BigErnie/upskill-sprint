(function(){
'use strict';
var attempts=0;
function start(){
  var tool=document.getElementById('spx-tool'),tabs=tool&&tool.querySelector('.spx-tabs');
  if(!tool||!tabs){if(attempts++<120)setTimeout(start,50);return}
  if(document.getElementById('spx-tab-reference-diagrams'))return;

  if(!document.querySelector('link[href="/tools/steel-phase-explorer-release5.css"]')){
    var css=document.createElement('link');css.rel='stylesheet';
    css.href='/tools/steel-phase-explorer-release5.css';document.head.appendChild(css);
  }

  var before=tabs.querySelector('[data-tab="learn"]'),tb=document.createElement('button');
  tb.type='button';tb.setAttribute('role','tab');tb.setAttribute('aria-selected','false');
  tb.setAttribute('aria-controls','spx-tab-reference-diagrams');
  tb.dataset.tab='reference-diagrams';tb.textContent='Reference diagrams';
  tabs.insertBefore(tb,before||null);

  var shell=document.createElement('div');
  shell.innerHTML=[
'<section id="spx-tab-reference-diagrams" class="spx-panel" role="tabpanel" data-panel="reference-diagrams" hidden>',
  '<div class="spx-r5-subnav" id="spx-r5-subnav" role="group" aria-label="Reference diagram">',
    '<button type="button" data-r5-map="rapid" aria-pressed="true">Rapid-quench microconstituents</button>',
    '<button type="button" data-r5-map="poster" aria-pressed="false">Iron-carbon / cementite poster</button>',
  '</div>',

  '<div class="spx-card spx-card-pad">',
    '<div class="spx-card-title">',
      '<div><h2 id="spx-r5-title">Rapid-quench microconstituent map</h2>',
      '<p id="spx-r5-subtitle">Carbon versus isothermal bath temperature. Not a TTT or CCT diagram.</p></div>',
      '<div class="spx-toolbar">',
        '<div class="spx-segmented" role="group" aria-label="Temperature units" id="spx-r5-unit">',
          '<button type="button" data-r5-unit="metric" aria-pressed="true">&deg;C</button>',
          '<button type="button" data-r5-unit="imperial" aria-pressed="false">&deg;F</button>',
        '</div>',
        '<button class="spx-btn primary" id="spx-r5-add" type="button">+ Add point</button>',
        '<button class="spx-btn" id="spx-r5-remove" type="button">Remove</button>',
        '<button class="spx-btn" id="spx-r5-example" type="button">Reset examples</button>',
      '</div>',
    '</div>',

    '<div class="spx-r5-controlbar">',
      '<div class="spx-segmented" role="group" aria-label="Experience level" id="spx-r5-level">',
        '<button type="button" data-r5-level="beginner" aria-pressed="false">Beginner</button>',
        '<button type="button" data-r5-level="engineer" aria-pressed="true">Engineer</button>',
        '<button type="button" data-r5-level="advanced" aria-pressed="false">Advanced</button>',
      '</div>',
      '<div class="spx-r5-zoom" role="group" aria-label="Zoom">',
        '<button class="spx-btn" id="spx-r5-zoom-out" type="button" aria-label="Zoom out">&minus;</button>',
        '<span id="spx-r5-zoom-label">100%</span>',
        '<button class="spx-btn" id="spx-r5-zoom-in" type="button" aria-label="Zoom in">+</button>',
        '<button class="spx-btn" id="spx-r5-zoom-reset" type="button">Fit</button>',
        '<button class="spx-btn" id="spx-r5-fullscreen" type="button">Full screen</button>',
        '<button class="spx-btn" id="spx-r5-export" type="button">Export PNG</button>',
      '</div>',
    '</div>',

    '<div class="spx-checks">',
      '<label><input id="spx-r5-critical" type="checkbox" checked> Critical lines</label>',
      '<label><input id="spx-r5-labels" type="checkbox" checked> Labels</label>',
      '<label><input id="spx-r5-crosshair-toggle" type="checkbox" checked> Crosshair</label>',
      '<label><input id="spx-r5-legend-toggle" type="checkbox" checked> Legend</label>',
    '</div>',

    '<div class="spx-svg-wrap spx-r5-wrap" id="spx-r5-svg-wrap">',
      '<svg id="spx-r5-svg" viewBox="0 0 1000 1120" role="img" ',
        'aria-label="Interactive rapid-quench microconstituent map">',
        '<defs></defs>',
        '<g id="spx-r5-reference"></g>',
        '<g id="spx-r5-emphasis"></g>',
        '<g id="spx-r5-overlay"></g>',
        '<g id="spx-r5-point-layer"></g>',
      '</svg>',
      '<div class="spx-tooltip" id="spx-r5-tooltip" hidden></div>',
      '<div class="spx-r5-loading" id="spx-r5-loading" hidden>Loading poster&hellip;</div>',
    '</div>',
    '<p class="spx-note" id="spx-r5-status" aria-live="polite"></p>',
    '<p class="spx-note spx-r5-source" id="spx-r5-source-note"></p>',
  '</div>',

  '<div class="spx-r5-stack">',
    '<div class="spx-card spx-card-pad">',
      '<div class="spx-card-title"><div><h2>Plotted points</h2>',
      '<p>Drag a marker, tap the diagram, or edit the values.</p></div></div>',
      '<div class="spx-points" id="spx-r5-points-list" aria-live="polite"></div>',
    '</div>',
    '<div class="spx-card spx-card-pad" id="spx-r5-legend-card">',
      '<div class="spx-card-title"><div><h2>Legend</h2>',
      '<p>Select an entry to highlight it on the diagram.</p></div></div>',
      '<div class="spx-r5-legend" id="spx-r5-legend"></div>',
    '</div>',
  '</div>',

  '<div class="spx-card spx-card-pad">',
    '<div class="spx-card-title"><div><h2>What does this region mean?</h2>',
    '<p id="spx-r5-help-sub">Hover, tap, or select a legend entry.</p></div></div>',
    '<div id="spx-r5-help"></div>',
  '</div>',

  '<div class="spx-card spx-card-pad">',
    '<div class="spx-card-title"><div><h2>Active point analysis</h2>',
    '<p id="spx-r5-active-summary"></p></div></div>',
    '<div id="spx-r5-analysis"></div>',
    '<p class="spx-note" id="spx-r5-model-note"></p>',
  '</div>',
'</section>'].join('');

  var learn=document.getElementById('spx-tab-learn');
  learn.parentNode.insertBefore(shell.firstElementChild,learn);

  /* async=false preserves execution order: geometry must define its globals
     before the render module runs. */
  ['/tools/steel-phase-explorer-poster-geometry.js',
   '/tools/steel-phase-explorer-rapid-geometry.js',
   '/tools/steel-phase-explorer-release5.js'].forEach(function(src){
    if(document.querySelector('script[src="'+src+'"]'))return;
    var s=document.createElement('script');s.src=src;s.async=false;document.body.appendChild(s);
  });
}
start();
})();
