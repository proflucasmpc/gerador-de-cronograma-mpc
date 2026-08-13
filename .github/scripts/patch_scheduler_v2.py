from pathlib import Path

p = Path('admin-study-routine.js')
s = p.read_text()

s = s.replace("${modeButton('continuous','Estudo contínuo','Mantém o modelo atual de horas seguidas por dia.')}", "${modeButton('continuous','Estudo contínuo','Mantém uma sessão diária contínua com distribuição pedagógica inteligente.')}")
s = s.replace("box.innerHTML='<p class=\"helper\">O sistema continuará usando “horas disponíveis por dia”, “horário inicial” e “dias disponíveis” exatamente como já funciona hoje.</p>';", "box.innerHTML='<p class=\"helper\">O sistema usa as horas disponíveis como teto diário, preserva uma sessão contínua e distribui teoria, exercícios e revisões ao longo do período sem exigir o preenchimento de toda a capacidade.</p>';" )

old = """    if(config.mode==='continuous'){\n      box.innerHTML='<strong>Capacidade:</strong> controlada pelos campos atuais da área administrativa.';\n      return;\n    }"""
new = """    if(config.mode==='continuous'){\n      const minutes=Math.max(15,Math.round((Number($('#adminHoursPerDay')?.value)||0)*60));\n      box.innerHTML=`<strong>Capacidade diária máxima:</strong> ${formatMinutes(minutes)}. No estudo contínuo, esse tempo funciona como teto: o cronograma pode planejar menos quando houver espaço suficiente até a prova.`;\n      return;\n    }"""
if old not in s:
    raise SystemExit('continuous capacity block not found')
s = s.replace(old,new)

start = s.index('  function buildSlots(')
end = s.index('  function syncBaseCapacityBeforeGenerate(', start)
s = s[:start] + r'''  function buildSlots(simDateKeys){
    const range=planRange();if(!range)return [];
    const weekdays=studyWeekdays();
    const slots=[];
    const continuousMinutes=Math.max(15,Math.round((Number($('#adminHoursPerDay')?.value)||1)*60));
    const continuousStart=timeMinutes($('#adminPreferredStart')?.value||'19:00')??1140;
    for(let d=new Date(range.start);d<=range.end;d=addDays(d,1)){
      const key=dateKey(d);
      if(simDateKeys.has(key))continue;
      if(config.mode!=='12x36'){
        const mondayIndex=(d.getDay()+6)%7;
        if(!weekdays.has(mondayIndex))continue;
      }
      if(config.mode==='continuous'){
        slots.push({date:key,start:continuousStart,duration:continuousMinutes,used:0,moment:'Sessão contínua',environment:'',types:[],videoOnly:false});
        continue;
      }
      const windows=effectiveWindowsForDate(d);
      let fallback=timeMinutes($('#adminPreferredStart')?.value||'19:00')??1140;
      [...windows].sort((a,b)=>(timeMinutes(a.time)??9999)-(timeMinutes(b.time)??9999)).forEach(w=>{
        const start=timeMinutes(w.time)??fallback;
        const duration=Math.max(5,Number(w.duration)||30);
        slots.push({date:key,start,duration,used:0,moment:w.moment||'Janela de estudo',environment:w.environment||'',types:Array.isArray(w.types)?w.types:[],videoOnly:Boolean(w.videoOnly)});
        fallback=start+duration;
      });
    }
    return slots;
  }

''' + s[end:]

start = s.index('  function itemEligible(')
end = s.index('  function createSegment(', start)
s = s[:start] + r'''  function itemEligible(item,slot,date,ctx){
    if(item.remaining<=0)return false;
    const category=taskCategory(item.task);
    if(!allowed(slot,category))return false;
    const key=topicKey(item.task);
    const originalDate=String(item.task?.date||'');
    const earliest=category==='theory'?(ctx.topicEarliest.get(key)||originalDate):originalDate;
    if(earliest&&date<earliest)return false;
    if(category==='exercise'&&ctx.theoryTopics.has(key)){
      const completed=ctx.theoryCompleted.get(key);
      if(!completed)return false;
      const gap=Number(ctx.exerciseGapDays)||0;
      if(dayDiff(completed,date)<gap)return false;
    }
    if(category==='theory'&&!ctx.theoryStarted.has(key)&&ctx.newTheoryTopicsToday>=ctx.maxNewTopicsPerDay)return false;
    return true;
  }
''' + s[end:]

start = s.index('  function createSegment(')
end = s.index('  function remainingMinutes(', start)
s = s[:start] + r'''  function createSegment(item,slot,take){
    const start=slot.start+slot.used;
    const segment={
      ...item.task,
      id:`${item.task.id||'task'}-${config.mode==='continuous'?'ct':'fr'}-${item.segments.length+1}-${Math.random().toString(36).slice(2,6)}`,
      date:slot.date,
      day:(parseDate(slot.date).getDay()+6)%7,
      start:timeText(start),
      end:timeText(start+take),
      activity:activityFor(item.task,slot),
      notes:config.mode==='continuous'?String(item.task.notes||''):noteFor(slot,config.mode),
      done:false,
      _source:item
    };
    slot.used+=take;
    item.remaining-=take;
    item.segments.push(segment);
    return segment;
  }
''' + s[end:]

start = s.index('  function appendPartLabels(')
end = s.index('  function scheduleAcquisition(', start)
s = s[:start] + r'''  function appendPartLabels(items){
    items.forEach(item=>{
      const n=item.segments.length;
      if(n>1)item.segments.forEach((seg,i)=>{seg.activity=`${seg.activity} · Bloco ${i+1} de ${n}`});
    });
  }

''' + s[end:]

start = s.index('  function scheduleAcquisition(')
end = s.index('  function scheduleReviews(', start)
s = s[:start] + r'''  function scheduleAcquisition(items,slots,protectedDays,options={}){
    const allDates=[...new Set(slots.map(s=>s.date))].sort();
    if(!allDates.length)return {ok:false,created:[],lastDate:'',remaining:remainingMinutes(items)};
    const range=planRange();
    const protectedStart=range?.exam?dateKey(addDays(range.exam,-protectedDays)):'';
    const usableDates=protectedStart?allDates.filter(d=>d<protectedStart):allDates;
    const usableSlots=slots.filter(s=>usableDates.includes(s.date));
    const need=remainingMinutes(items);
    const theoreticalCapacity=capacityFor(usableSlots,['theory','exercise','study']);
    if(theoreticalCapacity<need)return {ok:false,created:[],lastDate:'',capacity:theoreticalCapacity,need,remaining:need-theoreticalCapacity,reason:'capacity'};

    const byDate=groupSlotsByDate(usableSlots);
    const theoryTopics=new Set(items.filter(x=>taskCategory(x.task)==='theory').map(x=>topicKey(x.task)));
    const topicEarliest=new Map();
    items.forEach(item=>{
      const key=topicKey(item.task),date=String(item.task?.date||'');
      if(date&&(!topicEarliest.has(key)||date<topicEarliest.get(key)))topicEarliest.set(key,date);
    });
    const ctx={theoryTopics,topicEarliest,theoryCompleted:new Map(),theoryStarted:new Set(),newTheoryTopicsToday:0,maxNewTopicsPerDay:Number.isFinite(options.maxNewTopicsPerDay)?options.maxNewTopicsPerDay:2,exerciseGapDays:Number(options.exerciseGapDays)||0};
    const created=[];
    let lastDate='';
    const minDaily=config.mode==='continuous'?30:15;
    const minSegment=config.mode==='continuous'?15:10;
    for(let di=0;di<usableDates.length&&remainingMinutes(items)>0;di++){
      const date=usableDates[di];
      const daySlots=byDate.get(date)||[];
      ctx.newTheoryTopicsToday=0;
      const remainingNeed=remainingMinutes(items);
      const remainingSlots=usableDates.slice(di).flatMap(d=>byDate.get(d)||[]);
      const remainingCapacity=Math.max(1,capacityFor(remainingSlots,['theory','exercise','study']));
      const dayCapacity=capacityFor(daySlots,['theory','exercise','study']);
      const proportional=Math.max(minDaily,Math.ceil(remainingNeed*dayCapacity/remainingCapacity));
      let dayBudget=options.fillMode==='capacity'?dayCapacity:Math.min(dayCapacity,proportional);
      let placedToday=0;
      for(const slot of daySlots){
        while(slotRemaining(slot)>0&&placedToday<dayBudget&&remainingMinutes(items)>0){
          const eligible=items.map((item,index)=>({item,index,category:taskCategory(item.task)})).filter(x=>itemEligible(x.item,slot,date,ctx));
          if(!eligible.length)break;
          eligible.sort((a,b)=>{const rank=c=>c==='exercise'?0:c==='theory'?1:2;const ra=rank(a.category),rb=rank(b.category);if(ra!==rb)return ra-rb;return a.item.originalIndex-b.item.originalIndex;});
          const index=eligible[0].index;
          const item=items[index];
          const category=taskCategory(item.task);
          const key=topicKey(item.task);
          if(category==='theory'&&!ctx.theoryStarted.has(key)){ctx.theoryStarted.add(key);ctx.newTheoryTopicsToday++;}
          const take=Math.min(item.remaining,slotRemaining(slot),dayBudget-placedToday);
          if(take<minSegment&&item.remaining>take)break;
          if(take<=0)break;
          created.push(createSegment(item,slot,take));
          placedToday+=take;
          lastDate=date;
          if(item.remaining<=0){if(category==='theory')ctx.theoryCompleted.set(key,date);items.splice(index,1);}
        }
      }
    }
    return {ok:remainingMinutes(items)===0,created,lastDate,remaining:remainingMinutes(items),capacity:theoreticalCapacity,need};
  }

''' + s[end:]

start = s.index('  function transformGeneratedSchedule(')
end = s.index('  function wrapPublishing(', start)
s = s[:start] + r'''  function transformGeneratedSchedule(){
    const status=$('#adminGenerationStatus');
    if(!status||!status.classList.contains('success'))return false;
    let state;
    try{state=JSON.parse(localStorage.getItem(STATE_KEY)||'null')}catch{return false}
    if(!state||!Array.isArray(state.tasks)||!state.tasks.length)return false;

    const simulations=state.tasks.filter(t=>String(t.type||'').toLowerCase().includes('simulado'));
    const reviews=state.tasks.filter(t=>taskCategory(t)==='review');
    const acquisition=state.tasks.filter(t=>!String(t.type||'').toLowerCase().includes('simulado')&&taskCategory(t)!=='review').sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    const simDates=new Set(simulations.map(t=>t.date).filter(Boolean));
    const slots=buildSlots(simDates);
    if(!slots.length){alert('Não há períodos de estudo disponíveis dentro do intervalo configurado. O cronograma original foi mantido.');return false}

    const range=planRange();
    const strategies=[
      {maxNewTopicsPerDay:2,exerciseGapDays:1,fillMode:'proportional',label:'preferencial'},
      {maxNewTopicsPerDay:2,exerciseGapDays:0,fillMode:'proportional',label:'2 tópicos/dia'},
      {maxNewTopicsPerDay:3,exerciseGapDays:0,fillMode:'proportional',label:'3 tópicos/dia'},
      {maxNewTopicsPerDay:999,exerciseGapDays:0,fillMode:'capacity',label:'capacidade máxima'}
    ];
    let chosen=null;
    let bestFailure=null;
    for(let protectedDays=range?.exam?7:0;protectedDays>=0;protectedDays=protectedDays>3?protectedDays-1:(protectedDays===3?0:-1)){
      for(const strategy of strategies){
        const trialSlots=slots.map(s=>({...s,used:0}));
        const trialItems=acquisition.map((task,index)=>({task,remaining:durationOf(task),originalIndex:index,segments:[]}));
        const trial=scheduleAcquisition(trialItems,trialSlots,protectedDays,strategy);
        if(!bestFailure||trial.remaining<bestFailure.trial.remaining)bestFailure={trial,protectedDays,strategy};
        if(trial.ok){chosen={protectedDays,strategy};break}
      }
      if(chosen)break;
    }
    if(!chosen){
      const missing=Math.max(0,bestFailure?.trial?.remaining||0);
      const suffix=missing?` Faltam aproximadamente ${formatMinutes(missing)} de capacidade compatível.`:'';
      alert(`Mesmo usando toda a capacidade disponível, não foi possível encaixar teoria e exercícios até a prova sem quebrar a ordem pedagógica. O cronograma original foi mantido.${suffix}`);
      return false;
    }

    const actualItems=acquisition.map((task,index)=>({task,remaining:durationOf(task),originalIndex:index,segments:[]}));
    const actualSlots=slots.map(s=>({...s,used:0}));
    const acquisitionScheduled=scheduleAcquisition(actualItems,actualSlots,chosen.protectedDays,chosen.strategy);
    if(!acquisitionScheduled.ok){alert(`Não foi possível concluir a distribuição. Faltam aproximadamente ${formatMinutes(acquisitionScheduled.remaining||0)}. O cronograma original foi mantido.`);return false}

    const reviewStart=range?.exam&&chosen.protectedDays>0?dateKey(addDays(range.exam,-chosen.protectedDays)):'';
    const actualReviewItems=reviews.map((task,index)=>({task,remaining:durationOf(task),originalIndex:index,segments:[]}));
    const reviewScheduled=scheduleReviews(actualReviewItems,actualSlots,reviewStart);
    if(!reviewScheduled.ok){alert(`A teoria e os exercícios couberam, mas faltam aproximadamente ${formatMinutes(reviewScheduled.remaining||0)} para as revisões. O cronograma original foi mantido.`);return false}

    const created=[...acquisitionScheduled.created,...reviewScheduled.created];
    const usedSources=[...new Set(created.map(x=>x._source).filter(Boolean))];
    appendPartLabels(usedSources);
    created.forEach(x=>delete x._source);
    const merged=[...created,...simulations].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    merged.forEach((t,i)=>t.cycleOrder=i);
    state.tasks=merged;
    state.studyRoutine=clone(config);
    state.studyRoutine.planningStrategy={
      capacityIsCeiling:true,
      preferredMaxNewTheoryTopicsPerDay:2,
      appliedMaxNewTheoryTopicsPerDay:chosen.strategy.maxNewTopicsPerDay,
      theoryBeforeExercises:true,
      exerciseNextDayPreferred:chosen.strategy.exerciseGapDays===1,
      preserveTopicEarliestDate:true,
      repairTheoryBeforeExerciseByTopic:true,
      protectedFinalReviewDays:chosen.protectedDays,
      distributionMode:chosen.strategy.label,
      continuousSessionPreserved:config.mode==='continuous'
    };
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state))}catch{return false}
    return true;
  }

''' + s[end:]

start = s.index('  function bindGeneration(')
end = s.index('  function init()', start)
s = s[:start] + r'''  function bindGeneration(){
    const btn=$('#adminGenerateScheduleBtn');if(!btn)return;
    btn.addEventListener('click',()=>syncBaseCapacityBeforeGenerate(),true);
    btn.addEventListener('click',()=>{
      setTimeout(()=>{
        if(transformGeneratedSchedule()){
          try{sessionStorage.setItem('mpcRoutineJustApplied',config.mode)}catch{}
          location.reload();
        }
      },80);
    });
    try{
      const applied=sessionStorage.getItem('mpcRoutineJustApplied');
      if(applied){
        sessionStorage.removeItem('mpcRoutineJustApplied');
        const message=applied==='continuous'
          ?'Distribuição pedagógica inteligente aplicada ao estudo contínuo. A carga diária foi tratada como teto e o conteúdo foi reorganizado ao longo do período.'
          :'Rotina de estudo aplicada ao cronograma. Os horários foram reorganizados conforme as janelas configuradas.';
        setTimeout(()=>alert(message),250);
      }
    }catch{}
  }

''' + s[end:]

p.write_text(s)

p2 = Path('admin-enhancements.js')
a = p2.read_text()
a = a.replace('/admin-study-routine.js?v=20260812-4','/admin-study-routine.js?v=20260812-5')
p2.write_text(a)
