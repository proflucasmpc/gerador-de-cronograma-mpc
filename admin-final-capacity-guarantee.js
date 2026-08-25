(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const PENDING_KEY='mpcFinalCapacityGuaranteePendingV1';
  const DONE_KEY='mpcFinalCapacityGuaranteeDoneV1';
  const MAX_TRIES=30;
  const $=(s,r=document)=>r.querySelector(s);
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const plannerReady=state=>Boolean(state?.studyRoutine?.planningStrategy?.singleFinalPlanner)&&Number(state?.studyRoutine?.planningStrategy?.plannerVersion)===4;

  function request(){
    try{sessionStorage.setItem(PENDING_KEY,'1');sessionStorage.removeItem(DONE_KEY)}catch{}
  }

  function run(tries=0){
    if(sessionStorage.getItem(PENDING_KEY)!=='1')return;
    const state=read(STATE_KEY,null);
    if(!plannerReady(state)||typeof window.mpcApplyFinalConsolidation!=='function'){
      if(tries<MAX_TRIES){setTimeout(()=>run(tries+1),180);return}
      return;
    }
    const result=window.mpcApplyFinalConsolidation();
    if(!result?.ok){
      if(tries<MAX_TRIES){setTimeout(()=>run(tries+1),180);return}
      try{sessionStorage.removeItem(PENDING_KEY)}catch{}
      return;
    }
    try{
      sessionStorage.removeItem(PENDING_KEY);
      sessionStorage.setItem(DONE_KEY,JSON.stringify(result));
    }catch{}
    location.reload();
  }

  function showDone(){
    let data=null;try{data=JSON.parse(sessionStorage.getItem(DONE_KEY)||'null')}catch{}
    if(!data)return;
    try{sessionStorage.removeItem(DONE_KEY)}catch{}
    setTimeout(()=>alert(`Preenchimento final conferido. ${data.added||0} bloco(s) de consolidação foram adicionados para aproveitar as janelas livres até ${String(data.end||'').split('-').reverse().join('/')}.`),260);
  }

  function bind(){
    $('#adminGenerateScheduleBtn')?.addEventListener('click',request,true);
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#adminGenerateScheduleBtn'))request();
    },true);
    if(sessionStorage.getItem(PENDING_KEY)==='1')setTimeout(()=>run(0),260);
    showDone();
  }

  window.mpcRequestFinalCapacityGuarantee=request;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();