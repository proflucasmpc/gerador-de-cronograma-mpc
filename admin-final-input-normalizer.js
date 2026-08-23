(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const parseDate=value=>{const d=new Date(`${String(value||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const dayIndex=d=>(d.getDay()+6)%7;
  const diffDays=(a,b)=>Math.round((b-a)/86400000);
  const toMin=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):480};
  const toTime=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const isSimulation=t=>/simulado/i.test(`${t?.type||''} ${t?.activity||''}`);
  const isReview=t=>/revis|resumo|flashcard|lei seca/i.test(`${t?.type||''} ${t?.activity||''}`);

  function simulationDates(state){
    if(!$('#adminSimulationEnabled')?.checked)return[];
    const start=parseDate($('#adminStartDate')?.value||state.startDate);if(!start)return[];
    const exam=parseDate($('#adminExamDate')?.value||state.examDate);
    let end=parseDate(state.endDate||state.adminPersonalization?.endDate||'');
    if(!end)end=addDays(start,Math.max(1,Number($('#adminPlanDays')?.value)||1)-1);
    if(exam&&end>=exam)end=addDays(exam,-1);
    const mode=$('#adminSimulationMode')?.value||'interval_days';
    const interval=Math.max(1,Number($('#adminSimulationInterval')?.value)||15);
    const type=$('#adminSimulationType')?.value||'full';
    const chosen=new Set($$('#adminSimulationWeekdays input[data-weekday]:checked').map(i=>Number(i.value)));
    const eve=exam?dateKey(addDays(exam,-1)):'';
    const all=[];
    for(let d=new Date(start);d<=end;d=addDays(d,1)){
      if(type!=='subject'&&dateKey(d)===eve)continue;
      all.push(new Date(d));
    }
    if(mode==='weekday_occurrence'){
      const monday=new Date(start);monday.setDate(monday.getDate()-dayIndex(monday));
      return all.filter(d=>chosen.has(dayIndex(d))&&Math.floor(diffDays(monday,d)/7)%interval===0);
    }
    return all.filter((_,index)=>(index+1)%interval===0);
  }

  function currentSimulations(state){
    const dates=simulationDates(state);
    const start=toMin($('#adminSimulationStart')?.value||'08:00');
    const duration=Math.max(10,Number($('#adminSimulationMinutes')?.value)||240);
    const bySubject=($('#adminSimulationType')?.value||'full')==='subject';
    const subjects=Array.isArray(state.subjects)?state.subjects:[];
    return dates.map((d,index)=>{
      const source=subjects[index%Math.max(1,subjects.length)];
      const name=bySubject&&subjects.length?String(source?.name||source||'Matéria'):'Simulado completo';
      return{id:`sim-v6-${dateKey(d)}-${index}`,day:dayIndex(d),date:dateKey(d),cycleOrder:0,start:toTime(start),end:toTime(start+duration),subject:bySubject?`Simulado - ${name}`:'Simulado completo',activity:bySubject?`Simulado por matéria - ${name}`:`Simulado completo - ${state.goal||''}`,type:bySubject?'Simulado por matéria':'Simulado completo',notes:'O simulado ocupa somente este horário; o restante do dia continua disponível para estudo.',done:false};
    });
  }

  function normalize(){
    const state=read(STATE_KEY,null);if(!state?.tasks?.length)return false;
    const tasks=[];
    let reviewsReleased=0,oldSimulationsRemoved=0;
    state.tasks.forEach(task=>{
      if(isSimulation(task)){oldSimulationsRemoved++;return}
      if(isReview(task)){
        reviewsReleased++;
        tasks.push({...task,date:''});
      }else tasks.push(task);
    });
    const sims=currentSimulations(state);
    state.tasks=[...tasks,...sims];
    state.adminPersonalization={...(state.adminPersonalization||{}),simulationCount:sims.length,simulationScheduleRebuilt:true,reviewDatesReleased:true};
    state.studyRoutine={...(state.studyRoutine||{}),planningStrategy:{...(state.studyRoutine?.planningStrategy||{}),reviewDatesAreAdvisory:true,simulationScheduleRebuilt:true,finalInputNormalizerVersion:6}};
    save(STATE_KEY,state);
    try{sessionStorage.setItem('mpcFinalInputNormalizerStatsV6',JSON.stringify({reviewsReleased,oldSimulationsRemoved,simulationsCreated:sims.length}))}catch{}
    return true;
  }

  window.mpcNormalizeFinalPlannerInput=normalize;

  function bind(){
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#adminGenerateScheduleBtn,#publicPageBtn,#exportPublicPageBtn'))normalize();
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();