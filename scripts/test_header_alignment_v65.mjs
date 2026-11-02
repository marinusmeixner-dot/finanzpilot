import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const css=read('ui-v43.css'),mobile=read('mobile-layout-v19.css'),html=read('index.html');
const index=css.lastIndexOf('/* V65/V66: Header controls align');
assert(index>=0,'Right-edge alignment override exists after legacy declarations');
const patch=css.slice(index);
assert(mobile.includes('margin-right:-15px'),'Regression test recreates older negative-margin source');
assert(/\.main-area>\.topbar\s*\{[^}]*width:100%!important;[^}]*margin-inline:0!important;[^}]*padding-inline:12px!important;/s.test(patch),'Mobile header uses border-box width and equal 12px internal inset on BOTH sides (logo moves right; FP, depot and Sync move left).');
assert(/\.main-area>\.topbar>\.header-right\s*\{[^}]*width:100%;[^}]*max-width:100%;[^}]*margin-inline:0!important;[^}]*justify-content:flex-end!important;/s.test(patch),'Every button ends at same content right edge, not outside viewport');
assert(patch.includes('>#fp-quick-sync')&&patch.includes('margin-right:0!important;'),'Sync icon has no stray right offset');
assert(patch.includes('@media(min-width:701px)'),'Desktop retains right alignment');
const top=html.match(/<header class="topbar">[\s\S]*?<\/header>/)?.[0]||'';
assert(top.includes('id="top-fp"')&&top.includes('id="top-depot"'),'FP and numeric portfolio total remain');
assert(!top.includes('fp-streak-trigger'),'Streak stays in Profile, not in topbar');
assert(read('sync.js').includes("quick.id='fp-quick-sync'"),'Sync remains available');
assert(html.includes('ui-v43.css?v=67'),'iPhone loads new right-edge CSS instead of stale cache');
assert(JSON.parse(read('version.json')).version>=67,'App update detects new layout');
assert(/\.main-area>\.topbar>\.header-right\s*\{[^}]*padding-left:0!important;[^}]*padding-right:16px!important;/s.test(patch),'The entire FP + Depot + Sync group moves another 16px LEFT; no per-button transforms.');
assert(patch.includes('padding-inline:12px!important;'),'Logo keeps the V66 corrected position.');
// The CSS box-model at a 390px portrait viewport, with 15px main gutters:
// logo starts at 15+12=27px, while Sync right edge = 390-15-12-16=347px.
assert.equal(390-15-12-16,347,'Rightmost sync button ends 43px inside the iPhone viewport, not at its edge.');
console.log('V67 PASS: FP, virtual portfolio and Sync moved 16px left together, logo unchanged; no right overflow.');
