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
  const isBlackout=value=>typeof window.mpcIsBlackoutDate==='function'&&window.mpcIsBlackoutDate(value);

  function weekdayFromText(value=''){
    const text=String(value||'').trim().toLocaleLowerCase('pt-BR');
    if(!text)return null;
    if(/^(seg|segunda|segunda-feira|mon|monday)$/.test(text))return 0;
    if(/^(ter|terça|terca|terça-feira|terca-feira|tue|tuesday)$/.test(text))return 1;
    if(/^(qua|quarta|quarta-feira|wed|wednesday)$/.test(text))return 2;
    if(/^(qui|quinta|quinta-feira|thu|thursday)$/.test(text))return 3;
    if(/^(sex|sexta|sexta-feira|fri|friday)$/.test(text))return 4;
    if(/^(sáb|sab|sábado|sabado|sat|saturday)$/.test(text))return 5;
    if(/^(dom|domingo|sun|sunday)$/.test(text))return 6;
    return null;
  }

  function normalizeAvailableDays(){
    const root=$('#adminAvailableDays');if(!root)return[];
    const inputs=$$('input',root);
    const normalized=[];
    inputs.forEach((input,index)=>{
      let n=Number(input.value);
      if(!Number.isInteger(n)||n<0||n>6){
        const label=input.closest('label');
        const fromData=weekdayFromText(input.dataset?.weekday||input.dataset?.day||label?.dataset?.weekday||label?.dataset?.day||'');
        const fromText=weekdayFromText(label?.textContent||input.getAttribute('aria-label')||'');
        n=fromData??fromText??index;
        if(Number.isInteger(n)&&n>=0&&n<=6)input.value=String(n);
      }
      if(input.checked&&Number.isInteger(n)&&n>=0&&n<=6)normalized.push(n);
    });
    if(normalized.length){
      const state=read(STATE_KEY,{});
      state.availableDays=[...new Set(normalized)].sort((a,b)=>a-b);
      save(STATE_KEY,state);
    }
    return normalized;
  }

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
      const k=dateKey(d);if(type!=='subject'&&k===eve)continue;if(isBlackout(k))continue;all.push(new Date(d));
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
      return{id:`sim-v9-${dateKey(d)}-${index}`,day:dayIndex(d),date:dateKey(d),cycleOrder:0,start:toTime(start),end:toTime(start+duration),subject:bySubject?`Simulado - ${name}`:'Simulado completo',activity:bySubject?`Simulado por matéria - ${name}`:`Simulado completo - ${state.goal||''}`,type:bySubject?'Simulado por matéria':'Simulado completo',notes:'Dia reservado exclusivamente para a realização do simulado. Não há estudo regular programado nesta data.',done:false};
    });
  }

  function normalize(){
    normalizeAvailableDays();
    if(typeof window.mpcSyncBlackoutRanges==='function')window.mpcSyncBlackoutRanges();
    const state=read(STATE_KEY,null);if(!state?.tasks?.length)return false;
    const tasks=[];let reviewsReleased=0,oldSimulationsRemoved=0,blackoutTasksReleased=0;
    state.tasks.forEach(task=>{
      if(isSimulation(task)){oldSimulationsRemoved++;return}
      const blocked=task?.date&&isBlackout(task.date);
      if(blocked){blackoutTasksReleased++;tasks.push({...task,date:''});return}
      if(isReview(task)){reviewsReleased++;tasks.push({...task,date:''});return}
      tasks.push(task);
    });
    const sims=currentSimulations(state);state.tasks=[...tasks,...sims];
    state.adminPersonalization={...(state.adminPersonalization||{}),simulationCount:sims.length,simulationScheduleRebuilt:true,simulationDaysExclusive:true,reviewDatesReleased:true,blackoutDatesExclusive:true,blackoutTasksReleased};
    const previousStrategy=state.studyRoutine?.planningStrategy||{};
    state.studyRoutine={...(state.studyRoutine||{}),planningStrategy:{...previousStrategy,singleFinalPlanner:false,plannerVersion:0,reviewDatesAreAdvisory:true,simulationScheduleRebuilt:true,simulationDaysExclusive:true,blackoutDatesExclusive:true,blackoutTasksReleased,finalInputNormalizerVersion:10}};
    save(STATE_KEY,state);return true;
  }
  window.mpcNormalizeFinalPlannerInput=normalize;
  function bind(){
    normalizeAvailableDays();
    document.addEventListener('change',event=>{if(event.target?.closest?.('#adminAvailableDays'))normalizeAvailableDays()},true);
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#adminAvailableDays'))setTimeout(normalizeAvailableDays,0);
      if(event.target?.closest?.('#adminRefreshInsightsBtn,#adminGenerateScheduleBtn,#publicPageBtn,#exportPublicPageBtn')){
        normalizeAvailableDays();
        normalize();
      }
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();