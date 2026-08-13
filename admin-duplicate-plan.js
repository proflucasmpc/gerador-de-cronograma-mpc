(()=>{
  'use strict';
  const RECENT_KEY='mpcAdminRecentPublishedPlansV1';
  const EDITING_KEY='mpcAdminEditingPublishedPlanV1';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const INTENT_KEY='mpcAdminDuplicateIntentV1';
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};

  function loadUiUpgrades(){
    if(!document.querySelector('link[href*="admin-layout-links.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/admin-layout-links.css?v=20260813-1';document.head.appendChild(link)}
    if(!document.querySelector('script[src*="admin-public-buttons.js"]')){const script=document.createElement('script');script.src='/admin-public-buttons.js?v=20260813-1';script.defer=true;document.head.appendChild(script)}
  }

  function convertLoadedCopy(){
    const intent=read(INTENT_KEY,null),editing=read(EDITING_KEY,null);
    if(!intent?.path||editing?.path!==intent.path)return false;
    const draft=read(DRAFT_KEY,{})||{};
    draft.studentName='';
    write(DRAFT_KEY,draft);
    const state=read(STATE_KEY,{})||{};
    state.studentName='';
    state.tasks=Array.isArray(state.tasks)?state.tasks.map(task=>({...task,done:false})):[];
    state.adminPersonalization={...(state.adminPersonalization||{}),studentName:''};
    write(STATE_KEY,state);
    write(EDITING_KEY,{mode:'duplicate',sourcePath:intent.path,sourceName:intent.name||'Cronograma',loadedAt:new Date().toISOString()});
    localStorage.removeItem(INTENT_KEY);
    sessionStorage.setItem('mpcAdminLoadedPublishedPlanMessage',`Cópia independente de ${intent.name||'cronograma'} criada. Informe o nome do novo aluno, ajuste os dados, gere o cronograma e use “Criar página” para gerar um novo link.`);
    location.reload();
    return true;
  }

  function showBanner(){
    const editing=read(EDITING_KEY,null);
    if(editing?.mode!=='duplicate')return;
    const box=document.getElementById('mpcEditingPlanBanner');
    if(!box)return;
    box.hidden=false;
    box.style.display='flex';
    box.innerHTML=`<strong>Nova cópia independente — ainda não publicada</strong><span>Modelo: ${editing.sourceName||'cronograma publicado'} · a próxima publicação criará um novo link.</span>`;
  }

  function addButtons(){
    document.querySelectorAll('#mpcRecentList .mpc-admin-recent-item').forEach(row=>{
      if(row.querySelector('[data-duplicate-plan]'))return;
      const load=row.querySelector('[data-load-plan]');
      if(!load)return;
      const path=load.dataset.loadPlan||'';
      const item=(read(RECENT_KEY,[])||[]).find(entry=>entry.path===path);
      const button=document.createElement('button');
      button.type='button';
      button.dataset.duplicatePlan=path;
      button.textContent='Duplicar para novo aluno';
      button.addEventListener('click',()=>{
        write(INTENT_KEY,{path,name:item?.name||'cronograma'});
        load.click();
      });
      load.insertAdjacentElement('afterend',button);
    });
  }

  function init(){
    loadUiUpgrades();
    if(convertLoadedCopy())return;
    showBanner();
    addButtons();
    const list=document.getElementById('mpcRecentList');
    if(list)new MutationObserver(addButtons).observe(list,{childList:true,subtree:true});
    setTimeout(showBanner,250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
