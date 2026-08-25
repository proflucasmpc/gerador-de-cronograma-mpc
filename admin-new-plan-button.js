(()=>{
  'use strict';
  const KEYS=[
    'geradorCronogramaMpcData','geradorCronogramaMpcAdminDraft','mpcAdminStudyRoutineV1',
    'mpcAdminEditingPublishedPlanV1','mpcAdminDuplicateIntentV1','mpcAdminPublicPageButtonsV1',
    'mpcAdminBlackoutRangesV1'
  ];
  const SESSION_PREFIXES=['mpcCapacityFill','mpcFinalConsolidation','mpcGeneration','mpcAdminLoadedPublishedPlanMessage'];
  function clearCurrentPlan(){
    KEYS.forEach(k=>{try{localStorage.removeItem(k)}catch{}});
    try{Object.keys(sessionStorage).forEach(k=>{if(SESSION_PREFIXES.some(p=>k.startsWith(p)))sessionStorage.removeItem(k)})}catch{}
  }
  function mount(){
    if(document.getElementById('mpcCreateNewPlanTop'))return;
    const panel=document.getElementById('adminPanel');if(!panel)return;
    const bar=document.createElement('div');bar.id='mpcCreateNewPlanTop';
    bar.style.cssText='position:sticky;top:0;z-index:120;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:12px 0 14px;background:linear-gradient(180deg,rgba(245,247,251,.98),rgba(245,247,251,.92));backdrop-filter:blur(8px)';
    const btn=document.createElement('button');btn.type='button';btn.textContent='CRIAR novo cronograma';
    btn.style.cssText='border:0;border-radius:12px;padding:13px 18px;background:#0D1B33;color:#fff;font-weight:900;letter-spacing:.01em;cursor:pointer;box-shadow:0 6px 18px #0d1b3322';
    btn.addEventListener('click',()=>{if(!confirm('Criar um novo cronograma do zero? O cronograma que está aberto no editor será fechado, mas as páginas já publicadas continuarão salvas.'))return;clearCurrentPlan();location.href='/admin.html?novo=1'});
    bar.appendChild(btn);panel.prepend(bar);
  }
  function init(){mount();setTimeout(mount,250);setTimeout(mount,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();