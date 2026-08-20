(()=>{
  'use strict';

  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let restoring=false;
  let pendingGeneration=null;

  function splitMicrotopics(value=''){
    return String(value)
      .replace(/\r/g,'\n')
      .replace(/[•▪◦]/g,'\n')
      .replace(/\s*;\s*/g,'\n')
      .split(/\n+/)
      .map(line=>line.trim())
      .filter(line=>line.length>=2);
  }

  function pairTopics(topics){
    const groups=[];
    for(let i=0;i<topics.length;i+=2)groups.push(topics.slice(i,i+2));
    return groups;
  }

  function dispatchInput(field){field.dispatchEvent(new Event('input',{bubbles:true}))}
  function dispatchChange(field){field.dispatchEvent(new Event('change',{bubbles:true}))}
  function readJson(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
  function saveDraftSnapshot(){try{return localStorage.getItem(DRAFT_KEY)}catch{return null}}
  function restoreDraftSnapshot(snapshot){if(snapshot===null)return;try{localStorage.setItem(DRAFT_KEY,snapshot)}catch{}}
  function parseDate(value){const d=value?new Date(`${value}T12:00:00`):null;return d&&!Number.isNaN(d.getTime())?d:null}
  function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}
  function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function mondayIndex(d){return (d.getDay()+6)%7}
  function diffDays(a,b){return Math.round((b-a)/86400000)}
  function formatMinutes(m){m=Math.max(0,Math.round(m));const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h${String(r).padStart(2,'0')}`:`${h}h`):`${r} min`}
  function timeToMinutes(v){const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):0}
  function minutesToTime(n){n=((Math.round(n)%1440)+1440)%1440;return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}

  function effectiveWindow(){
    const start=parseDate($('#adminStartDate')?.value);
    if(!start)return null;
    const planDays=Math.max(1,Number($('#adminPlanDays')?.value)||1);
    let end=addDays(start,planDays-1);
    const exam=parseDate($('#adminExamDate')?.value);
    let capped=false;
    if(exam&&exam>start){const eve=addDays(exam,-1);if(end>eve){end=eve;capped=true}}
    return {start,end,exam,capped,days:diffDays(start,end)+1};
  }

  function simulationDateKeys(window){
    const keys=new Set();
    if(!$('#adminSimulationEnabled')?.checked||!window)return keys;
    const mode=$('#adminSimulationMode')?.value||'interval_days';
    const interval=Math.max(1,Number($('#adminSimulationInterval')?.value)||15);
    const selected=$$('#adminSimulationWeekdays input[data-weekday]:checked').map(x=>Number(x.value));
    const all=[];
    for(let d=new Date(window.start);d<=window.end;d=addDays(d,1))all.push(new Date(d));
    if(mode==='weekday_occurrence'){
      const chosen=new Set(selected.length?selected:[6]);
      const firstMonday=new Date(window.start);firstMonday.setDate(firstMonday.getDate()-((firstMonday.getDay()+6)%7));
      all.forEach(d=>{
        if(!chosen.has(mondayIndex(d)))return;
        const weekIndex=Math.floor(diffDays(firstMonday,d)/7);
        if(weekIndex%interval===0)keys.add(dateKey(d));
      });
    }else{
      all.forEach((d,index)=>{if((index+1)%interval===0)keys.add(dateKey(d))});
    }
    if(window.exam&&($('#adminSimulationType')?.value||'full')!=='subject')keys.delete(dateKey(addDays(window.exam,-1)));
    return keys;
  }

  function routineConfig(){return readJson(ROUTINE_KEY,{mode:'continuous'})||{mode:'continuous'}}
  function capacityForDate(date,config){
    if(config.mode==='12x36'){
      const ref=parseDate(config.referenceDate||$('#adminStartDate')?.value);
      if(!ref)return 0;
      const same=Math.abs(diffDays(ref,date))%2===0;
      const profile=same?(config.referenceStatus||'work'):((config.referenceStatus||'work')==='work'?'off':'work');
      const arr=profile==='work'?(config.workWindows||[]):(config.offWindows||[]);
      return arr.reduce((s,w)=>s+(Number(w.duration)||0),0);
    }
    if(config.mode==='fragmented'||config.mode==='custom')return (config.windows||[]).reduce((s,w)=>s+(Number(w.duration)||0),0);
    return Math.max(15,Math.round((Number($('#adminHoursPerDay')?.value)||1)*60));
  }

  function strategicCapacity(){
    const window=effectiveWindow();if(!window)return {minutes:0,contentDates:[],window:null,simKeys:new Set()};
    const simKeys=simulationDateKeys(window);
    const routine=routineConfig();
    const availableWeekdays=new Set($$('#adminAvailableDays input:checked').map(x=>Number(x.value)));
    const study=[];
    for(let d=new Date(window.start);d<=window.end;d=addDays(d,1)){
      const key=dateKey(d);if(simKeys.has(key))continue;
      if(routine.mode!=='12x36'&&!availableWeekdays.has(mondayIndex(d)))continue;
      study.push(new Date(d));
    }
    const reserved=window.exam?Math.min(7,Math.max(0,window.days-1)):0;
    const regular=reserved?study.filter(d=>(diffDays(d,window.end)+1)>reserved):study;
    const contentDates=regular.length?regular:study;
    const minutes=contentDates.reduce((sum,d)=>sum+capacityForDate(d,routine),0);
    return {minutes,contentDates,studyDates:study,window,simKeys,reserved,routine};
  }

  function subjectInfos(){
    return $$('#adminSubjectsList .admin-subject-card').map((card,index)=>{
      const field=card.querySelector('.admin-subject-topics');
      const topics=splitMicrotopics(field?.value||'');
      const groups=pairTopics(topics);
      const duration=Math.max(5,Number(card.querySelector('.admin-subject-minutes')?.value)||Number($('#adminSessionMinutes')?.value)||60);
      const difficulty=card.querySelector('.admin-subject-difficulty')?.value||'intermediario';
      const weight=({muito_dificil:1.35,dificil:1.2,intermediario:1,facil:.9,muito_facil:.8})[difficulty]||1;
      return {index,card,field,name:(card.querySelector('.admin-subject-name')?.value||`Matéria ${index+1}`).trim(),topics,groups,duration,weight};
    }).filter(x=>x.field&&x.groups.length);
  }

  function extraExerciseMinutes(duration){return Math.min(30,Math.max(15,Math.round(duration*.5/5)*5))}
  function reviewMinutes(){return 15}
  function requiredForAllocation(infos,alloc,includeExercises,includeReviews,contentDays){
    let minutes=0,units=0;
    infos.forEach((info,i)=>{
      const groups=alloc[i]||0;if(!groups)return;
      minutes+=groups*info.duration;units+=groups;
      if(includeExercises){minutes+=groups*extraExerciseMinutes(info.duration);units+=groups}
      if(includeReviews){const reviews=Math.ceil(groups/3);minutes+=reviews*reviewMinutes();units+=reviews}
    });
    minutes+=Math.max(0,units-Math.max(1,contentDays))*10;
    return {minutes,units};
  }

  function buildStrategicPlan(){
    const infos=subjectInfos();
    const cap=strategicCapacity();
    if(!infos.length||!cap.contentDates.length)return null;
    const includeExercises=Boolean($('#adminIncludeExercises')?.checked);
    const includeReviews=Boolean($('#adminIncludeReviews')?.checked);
    const includeTheory=Boolean($('#adminIncludeTheory')?.checked);
    if(!includeTheory)return null;
    const totalGroups=infos.reduce((s,x)=>s+x.groups.length,0);
    const budget=Math.floor(cap.minutes*.84);
    const alloc=infos.map(()=>0);

    // Primeiro tenta representar todas as matérias com ao menos um bloco de até 2 microtópicos.
    for(let i=0;i<infos.length;i++){
      alloc[i]=1;
      if(requiredForAllocation(infos,alloc,includeExercises,includeReviews,cap.contentDates.length).minutes>budget){alloc[i]=0}
    }

    // Se alguma matéria ficou sem espaço, tenta priorizar sua teoria e mantém o restante proporcional.
    // Em cenários extremos, a cobertura informa explicitamente quais matérias não couberam.
    while(true){
      let candidate=-1,bestScore=Infinity;
      infos.forEach((info,i)=>{
        if(alloc[i]>=info.groups.length)return;
        const progress=alloc[i]/Math.max(1,info.groups.length*info.weight);
        if(progress<bestScore){bestScore=progress;candidate=i}
      });
      if(candidate<0)break;
      alloc[candidate]++;
      const need=requiredForAllocation(infos,alloc,includeExercises,includeReviews,cap.contentDates.length).minutes;
      if(need>budget){alloc[candidate]--;break}
    }

    const selectedGroups=alloc.reduce((s,n)=>s+n,0);
    if(!selectedGroups)return null;
    const selectedMicrotopics=infos.reduce((sum,info,i)=>sum+info.groups.slice(0,alloc[i]).reduce((s,g)=>s+g.length,0),0);
    const totalMicrotopics=infos.reduce((sum,info)=>sum+info.topics.length,0);
    const coveredSubjects=alloc.filter(Boolean).length;
    const need=requiredForAllocation(infos,alloc,includeExercises,includeReviews,cap.contentDates.length);
    return {infos,alloc,cap,includeExercises,includeReviews,totalGroups,selectedGroups,selectedMicrotopics,totalMicrotopics,coveredSubjects,need,budget};
  }

  function coverageText(plan){
    const pct=plan.totalMicrotopics?Math.round(plan.selectedMicrotopics*100/plan.totalMicrotopics):0;
    const allSubjects=plan.coveredSubjects===plan.infos.length;
    return `Cobertura estratégica: ${plan.selectedMicrotopics} de ${plan.totalMicrotopics} microtópicos (${pct}%), em ${plan.coveredSubjects} de ${plan.infos.length} matérias${allSubjects?' — todas as matérias representadas':''}. Carga planejada aproximada: ${formatMinutes(plan.need.minutes)} dentro de ${formatMinutes(plan.cap.minutes)} disponíveis para conteúdo antes da reta final.`;
  }

  function applyPlan(plan){
    const originals=plan.infos.map(info=>info.field.value);
    const draftSnapshot=saveDraftSnapshot();
    const exercises=$('#adminIncludeExercises');
    const reviews=$('#adminIncludeReviews');
    const originalExercises=exercises?.checked;
    const originalReviews=reviews?.checked;
    plan.infos.forEach((info,i)=>{
      const selected=info.groups.slice(0,plan.alloc[i]).map(group=>group.join(' · '));
      info.field.value=selected.join('\n');dispatchInput(info.field);
    });
    // O motor-base cria a espinha dorsal de teoria. Exercícios e revisões compactas
    // são recolocados logo depois, antes da adaptação às janelas reais do aluno.
    if(exercises&&plan.includeExercises){exercises.checked=false;dispatchChange(exercises)}
    if(reviews&&plan.includeReviews){reviews.checked=false;dispatchChange(reviews)}
    return {plan,originals,draftSnapshot,exercises,reviews,originalExercises,originalReviews};
  }

  function restore(ctx){
    if(!ctx)return;restoring=true;
    try{
      ctx.plan.infos.forEach((info,i)=>{info.field.value=ctx.originals[i];dispatchInput(info.field)});
      if(ctx.exercises){ctx.exercises.checked=Boolean(ctx.originalExercises);dispatchChange(ctx.exercises)}
      if(ctx.reviews){ctx.reviews.checked=Boolean(ctx.originalReviews);dispatchChange(ctx.reviews)}
      restoreDraftSnapshot(ctx.draftSnapshot);
      annotate(ctx.plan);
    }finally{restoring=false}
  }

  function annotate(plan){
    const note=$('#adminCapacityPreview');
    if(note){
      const text=coverageText(plan);
      const current=(note.textContent||'').replace(/^Cobertura estratégica:.*?\.\s*/,'');
      note.textContent=`${text} ${current}`;
      note.classList.remove('admin-capacity-error');
      note.classList.add('admin-capacity-ok');
    }
    const distribution=$('#adminDistributionPreview');
    if(distribution&&plan.coveredSubjects<plan.infos.length){
      const missing=plan.infos.filter((_,i)=>!plan.alloc[i]).map(x=>x.name).join(', ');
      distribution.className='admin-distribution-preview warning';
      distribution.innerHTML=`<strong>Cobertura estratégica ativa.</strong> O tempo real não permite representar todas as matérias com teoria, exercícios e revisões. Sem espaço nesta versão: ${missing}.`;
    }
  }

  function nextDateKey(value,days){const d=parseDate(value);return d?dateKey(addDays(d,days)):value}
  function appendStrategicTasks(ctx){
    const plan=ctx.plan;
    const state=readJson(STATE_KEY,null);
    const status=$('#adminGenerationStatus');
    if(!state||!Array.isArray(state.tasks)||!status?.classList.contains('success'))return;
    const base=[...state.tasks];
    const theoryBySubject=new Map();
    base.filter(t=>/teoria/i.test(String(t.type||''))).forEach(t=>{
      const arr=theoryBySubject.get(t.subject)||[];arr.push(t);theoryBySubject.set(t.subject,arr);
    });
    const additions=[];
    plan.infos.forEach((info,i)=>{
      const count=plan.alloc[i]||0;if(!count)return;
      const theories=(theoryBySubject.get(info.name)||[]).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      const groups=info.groups.slice(0,count);
      groups.forEach((group,gIndex)=>{
        const topic=group.join(' · ');
        const theory=theories.find(t=>String(t.activity||'').includes(topic))||theories[gIndex];
        const theoryDate=theory?.date||dateKey(plan.cap.contentDates[Math.min(gIndex,plan.cap.contentDates.length-1)]);
        if(plan.includeExercises){
          const mins=extraExerciseMinutes(info.duration);const start=timeToMinutes(theory?.start||$('#adminPreferredStart')?.value||'19:00');
          additions.push({id:`id-str-ex-${Date.now()}-${i}-${gIndex}`,day:mondayIndex(parseDate(nextDateKey(theoryDate,1))||new Date()),date:nextDateKey(theoryDate,1),cycleOrder:99999,start:minutesToTime(start),end:minutesToTime(start+mins),subject:info.name,activity:`Exercícios - ${topic}`,type:'Exercícios',notes:'Cobertura estratégica: bloco compacto de questões após a teoria.',done:false});
        }
      });
      if(plan.includeReviews){
        for(let r=0;r<groups.length;r+=3){
          const batch=groups.slice(r,r+3).flat();
          const anchor=theories[Math.min(r+2,theories.length-1)]||theories.at(-1);
          const reviewDate=nextDateKey(anchor?.date||dateKey(plan.cap.contentDates.at(-1)),2);
          const start=timeToMinutes(anchor?.start||$('#adminPreferredStart')?.value||'19:00');
          additions.push({id:`id-str-rv-${Date.now()}-${i}-${r}`,day:mondayIndex(parseDate(reviewDate)||new Date()),date:reviewDate,cycleOrder:99999,start:minutesToTime(start),end:minutesToTime(start+reviewMinutes()),subject:info.name,activity:`Revisão - ${batch.join(', ')}`,type:'Revisão',notes:'Cobertura estratégica: revisão curta e distribuída do bloco estudado.',done:false});
        }
      }
    });
    state.tasks=[...base,...additions].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    state.tasks.forEach((t,i)=>t.cycleOrder=i);
    state.strategicCoverage={
      active:true,
      totalMicrotopics:plan.totalMicrotopics,
      selectedMicrotopics:plan.selectedMicrotopics,
      coveragePercent:plan.totalMicrotopics?Math.round(plan.selectedMicrotopics*100/plan.totalMicrotopics):0,
      totalSubjects:plan.infos.length,
      coveredSubjects:plan.coveredSubjects,
      omittedSubjects:plan.infos.filter((_,i)=>!plan.alloc[i]).map(x=>x.name),
      estimatedMinutes:plan.need.minutes,
      availableMinutes:plan.cap.minutes
    };
    state.adminPersonalization={...(state.adminPersonalization||{}),strategicCoverage:state.strategicCoverage};
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state))}catch{return}
    status.textContent=`Cronograma estratégico criado. ${coverageText(plan)} Exercícios compactos e revisões distribuídas foram incluídos sem aumentar a carga diária.`;
  }

  function shouldUseStrategic(plan){
    if(!plan)return false;
    const fullAlloc=plan.infos.map(info=>info.groups.length);
    const full=requiredForAllocation(plan.infos,fullAlloc,plan.includeExercises,plan.includeReviews,plan.cap.contentDates.length);
    return full.minutes>plan.cap.minutes;
  }

  function prepare(event){
    if(restoring)return;
    const button=event.target.closest?.('#adminRefreshInsightsBtn,#adminGenerateScheduleBtn');
    if(!button)return;
    const plan=buildStrategicPlan();
    if(!shouldUseStrategic(plan))return;
    const ctx=applyPlan(plan);
    if(button.id==='adminGenerateScheduleBtn')pendingGeneration=ctx;
    setTimeout(()=>{
      if(button.id==='adminGenerateScheduleBtn')appendStrategicTasks(ctx);
      restore(ctx);
      if(pendingGeneration===ctx)pendingGeneration=null;
    },0);
  }

  function addInfo(){
    const card=$('#adminInsightsCard');if(!card||$('#mpcLargeEdictInfo'))return;
    const info=document.createElement('div');info.id='mpcLargeEdictInfo';info.className='admin-rule-box';info.style.marginTop='12px';
    info.innerHTML='<strong>Compatibilidade com editais extensos</strong><span>Quando o edital inteiro não cabe antes da prova, o sistema entra em cobertura estratégica: mantém a carga diária como teto, representa as matérias proporcionalmente, trabalha com até 2 microtópicos por bloco, coloca teoria antes de exercícios e usa revisões curtas distribuídas. O edital original continua salvo integralmente.</span>';
    card.appendChild(info);
  }

  function init(){if(!$('#adminPanel'))return;document.addEventListener('click',prepare,true);addInfo()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();