(()=>{
  'use strict';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const BLACKOUT_KEY='mpcAdminBlackoutRangesV1';
  const VERSION=1;
  const MIN_SESSION=20;
  const TARGET_FILL=.86;
  const GAP_MINUTES=10;
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const parse=v=>{const d=new Date(`${String(v||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dayIndex=d=>(d.getDay()+6)%7;
  const floor5=n=>Math.max(MIN_SESSION,Math.floor(n/5)*5);

  function topicCount(subject){return String(subject?.topicsText||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).length}
  function unitCount(subject,draft){
    const topics=topicCount(subject);if(!topics)return 0;
    let units=0;
    if(draft.includeTheory!==false)units+=topics;
    if(draft.includeExercises!==false)units+=topics;
    if(draft.includeReviews!==false)units+=Math.ceil(topics/3);
    return units;
  }
  function blackoutSet(){
    const set=new Set(),ranges=read(BLACKOUT_KEY,[])||[];
    for(const r of ranges){const a=parse(r?.start||r?.date),b=parse(r?.end||r?.start||r?.date);if(!a||!b)continue;const lo=a<=b?a:b,hi=a<=b?b:a;for(let d=new Date(lo);d<=hi;d=addDays(d,1))set.add(dateKey(d))}
    return set;
  }
  function studyDates(draft){
    const start=parse(draft.startDate);if(!start)return[];
    const exam=parse(draft.examDate);
    let end=addDays(start,Math.max(1,Number(draft.planDays)||1)-1);
    if(exam&&end>=exam)end=addDays(exam,-1);
    const allowed=new Set((draft.availableDays||[]).map(Number));
    const blocked=blackoutSet(),dates=[];
    for(let d=new Date(start);d<=end;d=addDays(d,1)){
      const k=dateKey(d);if(blocked.has(k))continue;if(allowed.size&&!allowed.has(dayIndex(d)))continue;dates.push(k)
    }
    return dates;
  }
  function estimate(draft){
    const dates=studyDates(draft),capacity=dates.length*Math.round((Number(draft.hoursPerDay)||0)*60);
    const units=(draft.subjects||[]).reduce((sum,s)=>sum+unitCount(s,draft),0);
    const activityMinutes=(draft.subjects||[]).reduce((sum,s)=>sum+unitCount(s,draft)*(Number(s.sessionMinutes)||Number(draft.sessionMinutes)||60),0);
    const estimatedGaps=Math.max(0,units-dates.length)*GAP_MINUTES;
    return{dates:dates.length,capacity,units,activityMinutes,estimatedGaps,total:activityMinutes+estimatedGaps};
  }
  function apply(){
    const state=read(STATE_KEY,{})||{};
    if(!state?.adminPersonalization?.packageImportVersion)return false;
    if(Number(state?.adminPersonalization?.packageAutoFitVersion)>=VERSION)return false;
    const draft=read(DRAFT_KEY,null);if(!draft?.subjects?.length)return false;
    const before=estimate(draft);if(!before.capacity||!before.units)return false;
    const target=Math.floor(before.capacity*TARGET_FILL);
    let chosen=null;
    if(before.total>target){
      const availableForActivities=Math.max(MIN_SESSION*before.units,target-before.estimatedGaps);
      chosen=floor5(availableForActivities/before.units);
      chosen=Math.min(60,chosen);
      draft.sessionMinutes=chosen;
      draft.subjects=draft.subjects.map(subject=>({...subject,sessionMinutes:chosen}));
      write(DRAFT_KEY,draft);
    }
    state.sessionMinutes=chosen||state.sessionMinutes||draft.sessionMinutes;
    state.adminPersonalization={...(state.adminPersonalization||{}),packageAutoFitVersion:VERSION,packageAutoFitApplied:Boolean(chosen),packageAutoFitSessionMinutes:chosen||null,packageAutoFitCapacityMinutes:before.capacity,packageAutoFitEstimatedMinutesBefore:before.total,packageAutoFitEffectiveStudyDays:before.dates};
    write(STATE_KEY,state);
    if(chosen){
      try{sessionStorage.setItem('mpcPackageAutoFitMessageV1',JSON.stringify({minutes:chosen,days:before.dates,capacity:before.capacity,total:before.total}))}catch{}
      location.reload();return true;
    }
    return false;
  }
  function showMessage(){
    let data=null;try{data=JSON.parse(sessionStorage.getItem('mpcPackageAutoFitMessageV1')||'null')}catch{}if(!data)return;sessionStorage.removeItem('mpcPackageAutoFitMessageV1');
    setTimeout(()=>alert(`Pacote ajustado automaticamente à capacidade real do aluno. As sessões foram redimensionadas para ${data.minutes} minutos, considerando ${data.days} dias efetivos de estudo, indisponibilidades e a carga diária informada. O Planejador Final continuará usando o tempo livre para revisões e consolidação.`),420);
  }
  function init(){showMessage();setTimeout(()=>apply(),120)}
  window.mpcAutoFitImportedPackage=apply;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();