(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const PATCH_FLAG='mpcPedagogyGuardV3';
  const $=(s,r=document)=>r.querySelector(s);
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const parseDate=value=>{const d=new Date(`${String(value||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const isSimulation=task=>/simulado/i.test(`${task?.type||''} ${task?.activity||''}`);
  const isReview=task=>/revis|resumo|flashcard|lei seca/i.test(`${task?.type||''} ${task?.activity||''}`);
  const isTheory=task=>!isReview(task)&&/teoria|videoaula/i.test(`${task?.type||''} ${task?.activity||''}`);

  function prepareReviewPrerequisites(){
    const state=read(STATE_KEY,null);if(!state?.tasks?.length)return{changed:0};
    const firstTheoryBySubject=new Map();
    for(const task of state.tasks){
      if(isSimulation(task)||!isTheory(task)||!task.date)continue;
      const subject=String(task.subject||'').trim().toLocaleLowerCase('pt-BR');if(!subject)continue;
      const date=String(task.date).slice(0,10),current=firstTheoryBySubject.get(subject)||'';
      if(!current||date<current)firstTheoryBySubject.set(subject,date);
    }
    const exam=parseDate(state.examDate||'');
    let changed=0;
    state.tasks=state.tasks.map(task=>{
      if(!isReview(task)||isSimulation(task))return task;
      const subject=String(task.subject||'').trim().toLocaleLowerCase('pt-BR');
      const first=firstTheoryBySubject.get(subject);if(!first)return task;
      const theoryDate=parseDate(first);if(!theoryDate)return task;
      let notBefore=addDays(theoryDate,1);
      if(exam&&notBefore>=exam)notBefore=addDays(exam,-1);
      const next=dateKey(notBefore);
      if(String(task.date||'')===next&&task.reviewPrerequisite==='subject-theory-started')return task;
      changed++;
      return{...task,date:next,reviewPrerequisite:'subject-theory-started',reviewNotBefore:next,reviewFlexible:true};
    });
    if(changed)write(STATE_KEY,state);
    return{changed};
  }

  function isImportedPackage(){
    const state=read(STATE_KEY,{})||{};
    return Boolean(state?.adminPersonalization?.packageImportVersion);
  }

  function withFlexiblePackageReviews(event){
    const button=event.target?.closest?.('#adminRefreshInsightsBtn,#adminGenerateScheduleBtn');
    if(!button||!isImportedPackage())return;
    const checkbox=$('#adminIncludeReviews');
    if(!checkbox?.checked)return;

    // O planejador-base trata cada revisão como compromisso rígido e pode bloquear
    // pacotes extensos mesmo quando a carga total cabe. Para pacotes importados,
    // deixamos a geração-base montar teoria + exercícios e transferimos as revisões
    // para o Planejador Final, que usa a capacidade remanescente de forma flexível.
    checkbox.checked=false;
    checkbox.dataset.mpcFlexibleReviewTemporary='1';

    setTimeout(()=>{
      if(checkbox.dataset.mpcFlexibleReviewTemporary==='1'){
        checkbox.checked=true;
        delete checkbox.dataset.mpcFlexibleReviewTemporary;
      }
    },0);
  }

  function markStrategy(result,consolidation){
    const state=read(STATE_KEY,null);if(!state)return;
    state.studyRoutine={...(state.studyRoutine||{}),planningStrategy:{...(state.studyRoutine?.planningStrategy||{}),reviewRequiresPriorTheory:true,reviewPrerequisiteMode:'subject-theory-started-flexible',reviewDatesAreAdvisory:true,packageReviewsDelegatedToFinalPlanner:isImportedPackage(),finalCapacityFillRequired:true,finalCapacityFillApplied:Boolean(consolidation?.ok),pedagogyGuardVersion:3}};
    state.adminPersonalization={...(state.adminPersonalization||{}),pedagogyGuardVersion:3,reviewOrderValidated:true,reviewDatesFlexible:true,packageReviewsDelegatedToFinalPlanner:isImportedPackage(),finalCapacityFillApplied:Boolean(consolidation?.ok)};
    write(STATE_KEY,state);
  }

  function patch(){
    if(window[PATCH_FLAG])return true;
    const original=window.mpcApplyCapacityFill;
    if(typeof original!=='function')return false;
    window.mpcApplyCapacityFill=function(options={}){
      prepareReviewPrerequisites();
      const result=original(options);
      if(!result?.ok){markStrategy(result,null);return result}
      let consolidation=null;
      if(typeof window.mpcApplyFinalConsolidation==='function')consolidation=window.mpcApplyFinalConsolidation();
      markStrategy(result,consolidation);
      return consolidation?.ok?{...result,stats:{...(result.stats||{}),finalConsolidationAdded:consolidation.added||0,finalConsolidationMinutes:consolidation.minutes||0,finalConsolidationEnd:consolidation.end||''}}:result;
    };
    window[PATCH_FLAG]=true;
    window.mpcPrepareReviewPrerequisites=prepareReviewPrerequisites;
    return true;
  }

  function init(){
    document.addEventListener('click',withFlexiblePackageReviews,true);
    let tries=0;const timer=setInterval(()=>{if(patch()||++tries>80)clearInterval(timer)},50)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();