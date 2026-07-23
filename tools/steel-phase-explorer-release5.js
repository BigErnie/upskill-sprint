(function(){
'use strict';
var urls=Array.from({length:6},function(_,i){return '/assets/steel-phase/release5-code/part-'+String(i+1).padStart(2,'0')+'.txt?v=20260723-exact-source-v2'});
Promise.all(urls.map(function(url){return fetch(url,{cache:'no-cache'}).then(function(response){if(!response.ok)throw new Error('Release 5 code asset '+response.status);return response.text()})})).then(function(parts){Function(parts.join(''))()}).catch(function(error){var status=document.getElementById('spx-r5-status');if(status)status.textContent='Interactive diagram module failed to load: '+error.message;console.error(error)});
})();
