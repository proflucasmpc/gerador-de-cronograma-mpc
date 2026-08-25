(()=>{
  'use strict';
  const RECENT_KEY='mpcAdminRecentPublishedPlansV1';
  const EDITING_KEY='mpcAdminEditingPublishedPlanV1';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const INTENT_KEY='mpcAdminDuplicateIntentV1';
  const BLACKOUT_KEY='mpcAdminBlackoutRangesV1';
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  function loadUiUpgrades(){
    if(!document.querySelector('link[href*="admin-layout-links.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/admin-layout-links.css?v=20260813-1';document.head.appendChild(link)}
    if(!document.querySelector('script[src*="admin-public-buttons.js"]')){const script=document.createElement('script');script.src='/admin-public-buttons.js?v=20260823-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-blackout-dates.js"]')){const script=document.createElement('script');script.src='/admin-blackout-dates.js?v=20260825-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-capacity-fill.js"]')){const script=document.createElement('script');script.src='/admin-capacity-fill.js?v=20260823-3';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-final-input-normalizer.js"]')){const script=document.createElement('script');script.src='/admin-final-input-normalizer.js?v=20260825-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-generation-finalizer.js"]')){const script=document.createElement('script');script.src='/admin-generation-finalizer.js?v=20260823-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-final-consolidation.js"]')){const script=document.createElement('script');script.src='/admin-final-consolidation.js?v=20260825-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-new-plan-button.js"]')){const script=document.createElement('script');script.src='/admin-new-plan-button.js?v=20260823-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-package-import.js"]')){const script=document.createElement('script');script.src='/admin-package-import.js?v=20260825-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-package-compat.js"]')){const script=document.createElement('script');script.src='/admin-package-compat.js?v=20260825-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-package-autofit.js"]')){const script=document.createElement('script');script.src='/admin-package-autofit.js?v=20260825-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-simulation-capacity.js"]')){const script=document.createElement('script');script.src='/admin-simulation-capacity.js?v=20260825-3';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-simulation-selection-guard.js"]')){const script=document.createElement('script');script.src='/admin-simulation-selection-guard.js?v=20260823-1';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-update-sync.js"]')){const script=document.createElement('script');script.src='/admin-update-sync.js?v=20260820-2';script.defer=true;document.head.appendChild(script)}
    if(!document.querySelector('script[src*="admin-publish-guard.js"]')){const script=document.createElement('script');script.src='/admin-publish-guard.js?v=20260823-2';script.defer=true;document.head.appendChild(script)}
  }
  function resetPersonalDraft(draft){if(!draft||typeof draft!=='object')return{};return {...draft,studentName:'',startDate:'',hoursPerDay:0,sessionMinutes:60,preferredStart:'',availableDays:[],workSchedule:'',studyMaterial:'',generalGuidance:'',replaceSchedule:true}}
  function convertLoadedCopy(){
    const intent=read(INTENT_KEY,null),editing=read(EDITING_KEY,null);if(!intent?.path||editing?.path!==intent.path)return false;
    const draft=resetPersonalDraft(read(DRAFT_KEY,{})||{});write(DRAFT_KEY,draft);
    const state=read(STATE_KEY,{})||{};state.studentName='';state.tasks=[];state.hoursPerDay=0;state.sessionMinutes=60;state.preferredStart='';state.availableDays=[];state.startDate='';delete state.studyRoutine;state.adminGenerated=false;state.adminPersonalization={...(state.adminPersonalization||{}),studentName:'',startDate:'',endDate:'',blackoutRanges:[]};write(STATE_KEY,state);
    try{localStorage.removeItem(ROUTINE_KEY);localStorage.removeItem(BLACKOUT_KEY)}catch{}
    write(EDITING_KEY,{mode:'duplicate',sourcePath:intent.path,sourceName:intent.name||'Cronograma',loadedAt:new Date().toISOString(),studentIsolationVersion:3});localStorage.removeItem(INTENT_KEY);
    sessionStorage.setItem('mpcAdminLoadedPublishedPlanMessage',`Nova ficha criada a partir de ${intent.name||'cronograma'}. Conteúdos do concurso foram mantidos, mas rotina, horários, carga diária, indisponibilidades, progresso e atividades do aluno anterior foram zerados. Preencha os dados do novo aluno, gere o cronograma e só então crie a nova página.`);location.reload();return true;
  }
  function showBanner(){const editing=read(EDITING_KEY,null);if(editing?.mode!=='duplicate')return;const box=document.getElementById('mpcEditingPlanBanner');if(!box)return;box.hidden=false;box.style.display='flex';box.innerHTML=`<strong>Nova cópia independente — ainda não publicada</strong><span>Modelo: ${editing.sourceName||'cronograma publicado'} · rotina e disponibilidade devem ser preenchidas para o novo aluno · a próxima publicação criará um novo link.</span>`}
  function addButtons(){document.querySelectorAll('#mpcRecentList .mpc-admin-recent-item').forEach(row=>{if(row.querySelector('[data-duplicate-plan]'))return;const load=row.querySelector('[data-load-plan]');if(!load)return;const path=load.dataset.loadPlan||'';const item=(read(RECENT_KEY,[])||[]).find(entry=>entry.path===path);const button=document.createElement('button');button.type='button';button.dataset.duplicatePlan=path;button.textContent='Duplicar para novo aluno';button.addEventListener('click',()=>{write(INTENT_KEY,{path,name:item?.name||'cronograma'});load.click()});load.insertAdjacentElement('afterend',button)})}
  function init(){loadUiUpgrades();if(convertLoadedCopy())return;showBanner();addButtons();const list=document.getElementById('mpcRecentList');if(list)new MutationObserver(addButtons).observe(list,{childList:true,subtree:true});setTimeout(showBanner,250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();