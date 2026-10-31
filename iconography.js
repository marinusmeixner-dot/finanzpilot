window.FinanzPilotIcons=(function iconPack(){
 'use strict';
 const paths={
  'kion-nachfrage':'<path d="m21 39 0-17 10-7 10 7v17M25 39V27h12v12M16 42h32M20 21l11-8 11 8"/><path d="M30 12V7h8v5" opacity=".65"/>',
  'aixtron-auftraege':'<circle cx="30" cy="27" r="13"/><circle cx="30" cy="27" r="6"/><path d="m40 38 9 10M13 19l5-5M46 16l4-4"/><path d="m28 17 4 10-7 6" opacity=".65"/>',
  'alphabet-cloud':'<circle cx="32" cy="30" r="18"/><path d="m32 10 0 7m0 26v7M12 30h7m26 0h7M27 35l-2-8 11-9-2 11z"/><circle cx="32" cy="30" r="3"/>',
  'industry-core':'<path d="m32 13 17 17-17 22-17-22zM32 13v39M15 30h34M21 21l22 18M43 21 21 39"/>',
  'silicon-lens':'<circle cx="32" cy="31" r="19"/><circle cx="32" cy="31" r="11"/><circle cx="32" cy="31" r="3"/><path d="m14 13 6 6m24 24 6 6"/>',
  'cloud-compass':'<circle cx="32" cy="32" r="19"/><path d="m32 12 6 15-6 5-6-5zM32 52l-6-15 6-5 6 5z"/><circle cx="32" cy="32" r="3"/>',
  'scenario-crystal':'<path d="m32 9 17 18-8 21-9 8-9-8-8-21zM15 27h34M32 9v47M23 48l9-21 9 21"/>',
  rank:'<path d="m12 39 3-24 17 13 17-13 3 24-20 11zM15 39h34M32 28V9"/><circle cx="32" cy="8" r="3"/>'
 };
 const palette={'kion-nachfrage':['#e7d3a1','#b38f57'],'aixtron-auftraege':['#9ddbe2','#579da3'],'alphabet-cloud':['#abcbec','#6589bb'],'industry-core':['#f6d49b','#c08b3f'],'silicon-lens':['#9ce5e5','#568a9b'],'cloud-compass':['#bfd0f5','#7e8cb7'],'scenario-crystal':['#c3aaf0','#8a73bd'],'rank':['#f2d49c','#ad8d51']};
 function emblem(id,level=0){
  const p=palette[id]||palette.rank,path=paths[id]||paths.rank;
  const grad='fp-g-'+String(id).replace(/[^a-z0-9]/g,'')+(level||'');
  const glyph='<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><linearGradient id="'+grad+'" x1="4" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse"><stop stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></linearGradient></defs><circle cx="32" cy="32" r="28" stroke="url(#'+grad+')" stroke-width="1.8" opacity=".55"/><circle cx="32" cy="32" r="24" fill="url(#'+grad+')" opacity=".065"/><g stroke="url(#'+grad+')" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+path+'</g><circle cx="32" cy="3.5" r="2" fill="'+p[0]+'"/></svg>';
  return '<span class="fp-ornament-art" data-art="'+id+'" title="Forschungsabzeichen">'+glyph+'</span>';
 }
 return {emblem};
})();
