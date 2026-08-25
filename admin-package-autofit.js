(()=>{
  'use strict';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const BLACKOUT_KEY='mpcAdminBlackoutRangesV1';
  const VERSION=2;
  const MIN_SESSION=20;
  const MAX_SESSION=60;
  const GAP_MINUTES=10;
  const PROTECTED_FINAL_DAYS=7;
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const parse=v=>{const d=new Date(`${String(v||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dayIndex=d=>(d.getDay()+6)%7;

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
  function windowInfo(draft){
    const start=parse(draft.startDate);if(!start)return null;
    const exam=parse(draft.examDate);
    let end=addDays(start,Math.max(1,Number(draft.planDays)||1)-1);
    if(exam&&end>=exam)end=addDays(exam,-1);
    return{start,end,exam};
  }
  function studyDates(draft){
    const window=windowInfo(draft);if(!window)return[];
    const allowed=new Set((draft.availableDays||[]).map(Number)),blocked=blackoutSet(),dates=[];
    for(let d=new Date(window.start);d<=window.end;d=addDays(d,1)){
      const k=dateKey(d);if(blocked.has(k))continue;if(allowed.size&&!allowed.has(dayIndex(d)))continue;dates.push(new Date(d))
    }
    return dates;
  }
  function contentDates(draft){
    const dates=studyDates(draft),window=windowInfo(draft);if(!window||!draft.examDate)return dates;
    const protectedStart=addDays(window.end,-(PROTECTED_FINAL_DAYS-1));
    const regular=dates.filter(d=>d<protectedStart);
    return regular.length?regular:dates;
  }
  function chooseSession(draft,units){
    const dates=contentDates(draft);if(!dates.length||!units)return null;
    const dailyLimit=Math.round((Number(draft.hoursPerDay)||0)*60);if(dailyLimit<MIN_SESSION)return null;
    for(let session=MAX_SESSION;session>=MIN_SESSION;session-=5){
      const perDay=Math.max(0,Math.floor((dailyLimit+GAP_MINUTES)/(session+GAP_MINUTES)));
      if(perDay&&perDay*dates.length>=units)return{session,dates:dates.length,perDay,dailyLimit};
    }
    return{session:MIN_SESSION,dates:dates.length,perDay:Math.max(1,Math.floor((dailyLimit+GAP_MINUTES)/(MIN_SESSION+GAP_MINUTES))),dailyLimit};
  }
  function apply(){
    const state=read(STATE_KEY,{})||{};
    if(!state?.adminPersonalization?.packageImportVersion)return false;
    if(Number(state?.adminPersonalization?.packageAutoFitVersion)>=VERSION)return false;
    const draft=read(DRAFT_KEY,null);if(!draft?.subjects?.length)return false;
    const units=(draft.subjects||[]).reduce((sum,s)=>sum+unitCount(s,draft),0);if(!units)return false;
    const fit=chooseSession(draft,units);if(!fit)return false;
    const current=Math.max(...draft.subjects.map(s=>Number(s.sessionMinutes)||Number(draft.sessionMinutes)||60),Number(draft.sessionMinutes)||60);
    const chosen=Math.min(current,fit.session);
    if(chosen<current){
      draft.sessionMinutes=chosen;
      draft.subjects=draft.subjects.map(subject=>({...subject,sessionMinutes:chosen}));
      write(DRAFT_KEY,draft);
    }
    state.sessionMinutes=chosen;
    state.adminPersonalization={...(state.adminPersonalization||{}),packageAutoFitVersion:VERSION,packageAutoFitApplied:chosen<current,packageAutoFitSessionMinutes:chosen,packageAutoFitEffectiveStudyDays:fit.dates,packageAutoFitSlotsPerDay:fit.perDay,packageAutoFitUnits:units,packageAutoFitProtectedFinalDays:PROTECTED_FINAL_DAYS};
    write(STATE_KEY,state);
    if(chosen<current){
      try{sessionStorage.setItem('mpcPackageAutoFitMessageV2',JSON.stringify({minutes:chosen,days:fit.dates,perDay:fit.perDay,units}))}catch{}
      location.reload();return true;
    }
    return false;
  }
  function showMessage(){
    let data=null;try{data=JSON.parse(sessionStorage.getItem('mpcPackageAutoFitMessageV2')||'null')}catch{}if(!data)return;sessionStorage.removeItem('mpcPackageAutoFitMessageV2');
    setTimeout(()=>alert(`Capacidade conferida para o pacote importado. As sessões foram ajustadas para ${data.minutes} minutos para que ${data.units} atividades caibam nos ${data.days} dias úteis da fase de conteúdo, sem usar a reta final protegida. O Planejador Final continua responsável pela distribuição definitiva.`),420);
  }
  function init(){showMessage();setTimeout(()=>apply(),160)}
  window.mpcAutoFitImportedPackage=apply;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();