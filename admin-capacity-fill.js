(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const PENDING_KEY='mpcCapacityFillPendingV1';
  const APPLIED_KEY='mpcCapacityFillAppliedV1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  const readJson=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const parseDate=value=>{const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const timeMinutes=value=>{const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const timeText=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const taskMinutes=task=>{const a=timeMinutes(task.start),b=timeMinutes(task.end);return a!==null&&b!==null&&b>a?b-a:30};
  const cat=task=>{const text=`${task?.type||''} ${task?.activity||''}`.toLocaleLowerCase('pt-BR');if(/simulado/.test(text))return'simulation';if(/revis|resumo|flashcard|lei seca/.test(text))return'review';if(/exerc|quest/.test(text))return'exercise';if(/teoria|videoaula/.test(text))return'theory';return'study'};
  function cleanActivity(activity=''){
    return String(activity||'')
      .replace(/^\s*Videoaula\s+de\s+(?:teoria|exercícios?\s+corrigidos|revisão\s+ou\s+resumo)\s*-\s*/i,'')
      .replace(/^\s*(?:Teoria|Exercícios?|Revisão)\s*[-:–—]?\s*/i,'')
      .replace(/\s*·\s*(?:Bloco|Parte)\s+\d+\s+de\s+\d+\s*$/i,'')
      .trim();
  }
  function topicKey(task){
    const subject=String(task?.subject||'').trim().toLocaleLowerCase('pt-BR');
    const raw=cleanActivity(task?.activity||'');
    const match=raw.match(/^Tópico:\s*(.*?)\s*\|\s*Subtópico:/i);
    const topic=(match?.[1]||raw.split(/\s+[—–]\s+|\s+-\s+/)[0]||raw).trim().toLocaleLowerCase('pt-BR');
    return `${subject}|${topic}`;
  }
  function weekdaySet(state){
    const checked=$$('#adminAvailableDays input:checked').map(i=>Number(i.value)).filter(n=>n>=0&&n<=6);
    if(checked.length)return new Set(checked);
    const saved=(state.availableDays||[]).map(Number).filter(n=>n>=0&&n<=6);
    return new Set(saved.length?saved:[0,1,2,3,4]);
  }
  function windowsForDate(date,config,state){
    const preferred=timeMinutes($('#adminPreferredStart')?.value||state.preferredStart||'07:00')??420;
    const hours=Math.max(.25,Number($('#adminHoursPerDay')?.value||state.hoursPerDay||1));
    if(!config||config.mode==='continuous')return[{start:preferred,duration:Math.round(hours*60),moment:'Sessão contínua',environment:'',types:[],videoOnly:false}];
    let windows=[];
    if(config.mode==='12x36'){
      const ref=parseDate(config.referenceDate||state.startDate);if(!ref)return[];
      const diff=Math.abs(Math.round((date-ref)/86400000));
      const same=diff%2===0;
      const profile=same?(config.referenceStatus||'work'):((config.referenceStatus||'work')==='work'?'off':'work');
      windows=profile==='work'?(config.workWindows||[]):(config.offWindows||[]);
    }else windows=config.windows||[];
    return [...windows].sort((a,b)=>(timeMinutes(a.time)??9999)-(timeMinutes(b.time)??9999)).map(w=>({
      start:timeMinutes(w.time)??preferred,
      duration:Math.max(5,Number(w.duration)||30),
      moment:w.moment||'Janela de estudo',environment:w.environment||'',types:Array.isArray(w.types)?w.types:[],videoOnly:Boolean(w.videoOnly)
    }));
  }
  function allows(slot,category){
    if(!slot.types?.length)return true;
    const types=slot.types.map(x=>String(x).toLocaleLowerCase('pt-BR'));
    if(category==='theory')return types.some(x=>/teoria/.test(x));
    if(category==='exercise')return types.some(x=>/exerc/.test(x));
    if(category==='review')return types.some(x=>/revis|resumo|lei seca|flash/.test(x));
    return true;
  }
  function noteFor(slot,mode,original=''){
    if(mode==='continuous')return String(original||'');
    return [mode==='custom'?'Rotina personalizada':mode==='fragmented'?'Estudo fracionado':mode==='12x36'?'Escala 12x36':'Rotina personalizada',slot.moment,slot.environment].filter(Boolean).join(' · ');
  }
  function buildSlots(state,config,simDates){
    const start=parseDate(state.startDate||$('#adminStartDate')?.value);if(!start)return[];
    const exam=parseDate(state.examDate||$('#adminExamDate')?.value);
    let end=parseDate(state.endDate||'');
    if(!end){const days=Math.max(1,Number($('#adminPlanDays')?.value)||1);end=addDays(start,days-1)}
    if(exam&&end>=exam)end=addDays(exam,-1);
    const weekdays=weekdaySet(state),slots=[];
    for(let d=new Date(start);d<=end;d=addDays(d,1)){
      const key=dateKey(d);if(simDates.has(key))continue;
      const mondayIndex=(d.getDay()+6)%7;
      if(config?.mode!=='12x36'&&!weekdays.has(mondayIndex))continue;
      for(const w of windowsForDate(d,config,state))slots.push({date:key,start:w.start,duration:w.duration,used:0,...w});
    }
    return slots;
  }
  function segment(item,slot,take,mode){
    const start=slot.start+slot.used;
    const seg={...item.task,id:`${item.task.id||'task'}-fill-${item.parts+1}-${Math.random().toString(36).slice(2,6)}`,date:slot.date,day:(parseDate(slot.date).getDay()+6)%7,start:timeText(start),end:timeText(start+take),notes:noteFor(slot,mode,item.task.notes),done:false};
    if(slot.videoOnly){const body=cleanActivity(seg.activity),c=cat(seg);seg.activity=c==='theory'?`Videoaula de teoria - ${body}`:c==='exercise'?`Videoaula de exercícios corrigidos - ${body}`:c==='review'?`Videoaula de revisão ou resumo - ${body}`:`Videoaula - ${body}`}
    slot.used+=take;item.remaining-=take;item.parts+=1;item.segments.push(seg);return seg;
  }
  function distribute(state,config){
    const simulations=state.tasks.filter(t=>cat(t)==='simulation');
    const simDates=new Set(simulations.map(t=>t.date).filter(Boolean));
    const slots=buildSlots(state,config,simDates);if(!slots.length)return null;
    const items=state.tasks.filter(t=>cat(t)!=='simulation').map((task,index)=>({task,category:cat(task),key:topicKey(task),remaining:taskMinutes(task),originalIndex:index,due:String(task.date||''),parts:0,segments:[]}));
    const theoryKeys=new Set(items.filter(x=>x.category==='theory').map(x=>x.key));
    const theoryComplete=new Map();
    const created=[];
    const dates=[...new Set(slots.map(s=>s.date))].sort();
    const byDate=new Map(dates.map(d=>[d,slots.filter(s=>s.date===d)]));
    const totalRemaining=()=>items.reduce((s,x)=>s+Math.max(0,x.remaining),0);
    const eligible=(item,slot,date,allowSameDayExercise=false)=>{
      if(item.remaining<=0||!allows(slot,item.category))return false;
      if(item.category==='review'&&item.due&&date<item.due)return false;
      if(item.category==='exercise'&&theoryKeys.has(item.key)){
        const completed=theoryComplete.get(item.key);if(!completed)return false;
        if(!allowSameDayExercise&&completed===date)return false;
      }
      return true;
    };
    const placeFrom=(slot,date,predicate,allowSameDayExercise=false)=>{
      let progressed=false;
      while(slot.used<slot.duration){
        const candidates=items.filter(x=>predicate(x)&&eligible(x,slot,date,allowSameDayExercise)).sort((a,b)=>a.originalIndex-b.originalIndex);
        if(!candidates.length)break;
        const item=candidates[0],take=Math.min(item.remaining,slot.duration-slot.used);
        if(take<10&&item.remaining>take)break;
        created.push(segment(item,slot,take,config?.mode||'continuous'));progressed=true;
        if(item.remaining<=0&&item.category==='theory')theoryComplete.set(item.key,date);
      }
      return progressed;
    };
    for(const date of dates){
      let newTheoryCount=0;
      const daySlots=byDate.get(date)||[];
      for(const slot of daySlots){
        // 1) Use the beginning of the day for exercises whose theory was completed earlier.
        placeFrom(slot,date,x=>x.category==='exercise',false);
        // 2) Then do reviews that are already due.
        placeFrom(slot,date,x=>x.category==='review',false);
        // 3) Introduce up to two new theory topics as the preferred daily limit.
        while(slot.used<slot.duration&&newTheoryCount<2){
          const before=created.length;
          const candidates=items.filter(x=>x.category==='theory'&&x.remaining>0&&!theoryComplete.has(x.key)&&allows(slot,'theory')).sort((a,b)=>a.originalIndex-b.originalIndex);
          if(!candidates.length)break;
          const item=candidates[0],wasNew=item.parts===0,take=Math.min(item.remaining,slot.duration-slot.used);
          if(take<10&&item.remaining>take)break;
          created.push(segment(item,slot,take,config?.mode||'continuous'));
          if(wasNew)newTheoryCount++;
          if(item.remaining<=0)theoryComplete.set(item.key,date);
          if(created.length===before)break;
        }
        // 4) Fill remaining time with exercises, including same-day reinforcement when appropriate.
        placeFrom(slot,date,x=>x.category==='exercise',true);
        // 5) Use any due reviews/other study blocks before adding more new content.
        placeFrom(slot,date,x=>x.category==='review'||x.category==='study',true);
        // 6) If there is still unused capacity and substantial pending content, allow extra theory instead of wasting the study window.
        if(slot.used<slot.duration&&totalRemaining()>0)placeFrom(slot,date,x=>x.category==='theory',true);
      }
    }
    if(totalRemaining()>0)return null;
    const usedSources=items.filter(x=>x.parts>1);usedSources.forEach(item=>item.segments.forEach((seg,i)=>{seg.activity=`${seg.activity} · Bloco ${i+1} de ${item.segments.length}`}));
    const merged=[...created,...simulations].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    merged.forEach((t,i)=>t.cycleOrder=i);
    return merged;
  }
  function apply(){
    const state=readJson(STATE_KEY,null);if(!state||!Array.isArray(state.tasks)||!state.tasks.length)return false;
    const config=readJson(ROUTINE_KEY,{mode:'continuous'});
    const redistributed=distribute(state,config);if(!redistributed)return false;
    state.tasks=redistributed;
    state.studyRoutine=state.studyRoutine||config;
    state.studyRoutine.planningStrategy={...(state.studyRoutine.planningStrategy||{}),capacityIsCeiling:true,preferredMaxNewTheoryTopicsPerDay:2,fillAvailableStudyWindow:true,priorityOrder:['exercícios pendentes','revisões vencidas','até 2 tópicos novos','exercícios de reforço','tópico novo adicional se houver tempo livre'],unusedCapacityAvoidedWhenPendingContent:true};
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state));sessionStorage.setItem(APPLIED_KEY,'1');return true}catch{return false}
  }
  function bind(){
    $('#adminGenerateScheduleBtn')?.addEventListener('click',()=>{try{sessionStorage.setItem(PENDING_KEY,'1');sessionStorage.removeItem(APPLIED_KEY)}catch{}},true);
    if(sessionStorage.getItem(PENDING_KEY)==='1'){
      sessionStorage.removeItem(PENDING_KEY);
      setTimeout(()=>{if(apply()){location.reload()}},220);
    }else if(sessionStorage.getItem(APPLIED_KEY)==='1'){
      sessionStorage.removeItem(APPLIED_KEY);
      setTimeout(()=>alert('Capacidade diária reorganizada: o sistema mantém até 2 novos tópicos como preferência, mas usa o restante da janela com exercícios, revisões e, quando necessário, conteúdo adicional.'),260);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();