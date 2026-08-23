(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const PENDING_KEY='mpcCapacityFillPendingV4';
  const APPLIED_KEY='mpcCapacityFillAppliedV4';
  const FAILURE_KEY='mpcCapacityFillFailureV4';
  const MIN_BLOCK=15;
  const PREFERRED_NEW_TOPICS=2;
  const PROTECTED_FINAL_DAYS=7;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const parseDate=value=>{const d=new Date(`${String(value||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const toMin=value=>{const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const toTime=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const minutes=task=>{const a=toMin(task?.start),b=toMin(task?.end);return a!==null&&b!==null&&b>a?b-a:30};
  const category=task=>{const text=`${task?.type||''} ${task?.activity||''}`.toLocaleLowerCase('pt-BR');if(/simulado/.test(text))return'simulation';if(/revis|resumo|flashcard|lei seca/.test(text))return'review';if(/exerc|quest/.test(text))return'exercise';if(/teoria|videoaula/.test(text))return'theory';return'study'};
  function stripPartLabels(value=''){
    let text=String(value||'').trim(),previous='';
    while(text!==previous){previous=text;text=text.replace(/\s*·\s*(?:Bloco|Parte)\s+\d+\s+de\s+\d+\s*$/i,'').trim()}
    return text;
  }
  function cleanForKey(value=''){
    return stripPartLabels(value)
      .replace(/^\s*Videoaula\s+de\s+(?:teoria|exercícios?\s+corrigidos|revisão\s+ou\s+resumo)\s*-\s*/i,'')
      .replace(/^\s*(?:Teoria|Exercícios?|Revisão)\s*[-:–—]?\s*/i,'')
      .trim();
  }
  function topicKey(task){
    const subject=String(task?.subject||'').trim().toLocaleLowerCase('pt-BR');
    const raw=cleanForKey(task?.activity||'');
    const match=raw.match(/^Tópico:\s*(.*?)\s*\|\s*Subtópico:/i);
    const topic=(match?.[1]||raw.split(/\s+[—–]\s+|\s+-\s+/)[0]||raw).trim().toLocaleLowerCase('pt-BR');
    return `${subject}|${topic}`;
  }
  function baseTaskId(id=''){
    let value=String(id||''),previous='';
    while(value&&value!==previous){
      previous=value;
      value=value
        .replace(/-(?:ct|fr)-\d+-[a-z0-9]+$/i,'')
        .replace(/-fill2?-\d+-[a-z0-9]+$/i,'')
        .replace(/-sync-[a-z0-9]+$/i,'')
        .replace(/-final-\d+-[a-z0-9]+$/i,'');
    }
    return value;
  }
  function collapseFragments(tasks){
    const groups=new Map(),simulations=[];
    (Array.isArray(tasks)?tasks:[]).forEach((task,index)=>{
      if(category(task)==='simulation'){
        simulations.push({...task,activity:stripPartLabels(task.activity)});
        return;
      }
      const base=baseTaskId(task.id);
      const key=base?`id:${base}`:`fallback:${index}:${category(task)}:${task.subject||''}:${cleanForKey(task.activity)}`;
      if(!groups.has(key))groups.set(key,{representative:{...task,activity:stripPartLabels(task.activity),id:base||task.id},minutes:0,dates:[],index,parts:0});
      const group=groups.get(key);
      group.minutes+=Math.max(1,minutes(task));
      if(task.date)group.dates.push(String(task.date));
      group.parts++;
    });
    const items=[...groups.values()].sort((a,b)=>a.index-b.index).map(group=>({
      task:group.representative,
      category:category(group.representative),
      key:topicKey(group.representative),
      remaining:Math.max(MIN_BLOCK,group.minutes),
      originalMinutes:Math.max(MIN_BLOCK,group.minutes),
      due:group.dates.sort()[0]||'',
      originalIndex:group.index,
      segments:[],
      collapsedParts:group.parts
    }));
    return {items,simulations};
  }
  function availableWeekdays(state){
    const checked=$$('#adminAvailableDays input:checked').map(i=>Number(i.value)).filter(n=>n>=0&&n<=6);
    if(checked.length)return new Set(checked);
    const saved=(state.availableDays||[]).map(Number).filter(n=>n>=0&&n<=6);
    return new Set(saved.length?saved:[0,1,2,3,4]);
  }
  function windowsForDate(date,routine,state){
    const preferred=toMin($('#adminPreferredStart')?.value||state.preferredStart||'07:00')??420;
    const hours=Math.max(.25,Number($('#adminHoursPerDay')?.value||state.hoursPerDay||1));
    if(!routine||routine.mode==='continuous')return[{start:preferred,duration:Math.round(hours*60),moment:'Sessão contínua',environment:'',types:[],videoOnly:false}];
    let source=[];
    if(routine.mode==='12x36'){
      const ref=parseDate(routine.referenceDate||state.startDate);if(!ref)return[];
      const diff=Math.abs(Math.round((date-ref)/86400000)),same=diff%2===0;
      const profile=same?(routine.referenceStatus||'work'):((routine.referenceStatus||'work')==='work'?'off':'work');
      source=profile==='work'?(routine.workWindows||[]):(routine.offWindows||[]);
    }else source=routine.windows||[];
    return [...source].sort((a,b)=>(toMin(a.time)??9999)-(toMin(b.time)??9999)).map(w=>({
      start:toMin(w.time)??preferred,
      duration:Math.max(MIN_BLOCK,Number(w.duration)||30),
      moment:w.moment||'Janela de estudo',
      environment:w.environment||'',
      types:Array.isArray(w.types)?w.types:[],
      videoOnly:Boolean(w.videoOnly)
    }));
  }
  function allows(slot,cat){
    if(!slot.types?.length)return true;
    const types=slot.types.map(x=>String(x).toLocaleLowerCase('pt-BR'));
    if(cat==='theory')return types.some(x=>/teoria/.test(x));
    if(cat==='exercise')return types.some(x=>/exerc/.test(x));
    if(cat==='review')return types.some(x=>/revis|resumo|lei seca|flash/.test(x));
    return true;
  }
  function noteFor(slot,mode,original=''){
    if(mode==='continuous')return String(original||'');
    return [mode==='custom'?'Rotina personalizada':mode==='fragmented'?'Estudo fracionado':mode==='12x36'?'Escala 12x36':'Rotina personalizada',slot.moment,slot.environment].filter(Boolean).join(' · ');
  }
  function buildSlots(state,routine,simulations){
    const start=parseDate(state.startDate||$('#adminStartDate')?.value);if(!start)return[];
    const exam=parseDate(state.examDate||$('#adminExamDate')?.value);
    let end=parseDate(state.endDate||'');
    if(!end){const days=Math.max(1,Number($('#adminPlanDays')?.value)||1);end=addDays(start,days-1)}
    if(exam&&end>=exam)end=addDays(exam,-1);
    const weekdays=availableWeekdays(state),slots=[];
    const simulationDates=new Set((simulations||[]).map(sim=>String(sim?.date||'')).filter(Boolean));
    for(let d=new Date(start);d<=end;d=addDays(d,1)){
      const key=dateKey(d);
      const mondayIndex=(d.getDay()+6)%7;
      if(routine?.mode!=='12x36'&&!weekdays.has(mondayIndex))continue;
      // Regra pedagógica: data com simulado é exclusiva do simulado.
      if(simulationDates.has(key))continue;
      for(const w of windowsForDate(d,routine,state))slots.push({date:key,used:0,...w});
    }
    return slots;
  }
  function segmentSize(item,free){
    if(free<MIN_BLOCK)return 0;
    if(item.remaining<=free)return item.remaining;
    let take=free,rest=item.remaining-take;
    if(rest>0&&rest<MIN_BLOCK)take-=MIN_BLOCK-rest;
    return take>=MIN_BLOCK?take:0;
  }
  function makeSegment(item,slot,take,routine){
    const start=slot.start+slot.used;
    let activity=stripPartLabels(item.task.activity);
    if(slot.videoOnly){
      const body=cleanForKey(activity);
      activity=item.category==='theory'?`Videoaula de teoria - ${body}`:item.category==='exercise'?`Videoaula de exercícios corrigidos - ${body}`:item.category==='review'?`Videoaula de revisão ou resumo - ${body}`:`Videoaula - ${body}`;
    }
    const seg={...item.task,id:`${baseTaskId(item.task.id)||'task'}-final-${item.segments.length+1}-${Math.random().toString(36).slice(2,6)}`,date:slot.date,day:(parseDate(slot.date).getDay()+6)%7,start:toTime(start),end:toTime(start+take),activity,notes:noteFor(slot,routine?.mode||'continuous',item.task.notes),done:false};
    slot.used+=take;item.remaining-=take;item.segments.push(seg);return seg;
  }
  function redistribute(state,routine){
    const collapsed=collapseFragments(state.tasks),items=collapsed.items,simulations=collapsed.simulations;
    const slots=buildSlots(state,routine,simulations);if(!slots.length)return{ok:false,reason:'Não há janelas de estudo disponíveis no período fora dos dias reservados para simulados.'};
    const exam=parseDate(state.examDate||$('#adminExamDate')?.value);
    const protectedStart=exam?dateKey(addDays(exam,-PROTECTED_FINAL_DAYS)):'';
    const theoryKeys=new Set(items.filter(x=>x.category==='theory').map(x=>x.key));
    const theoryComplete=new Map(),startedTheory=new Set(),created=[];
    const dates=[...new Set(slots.map(s=>s.date))].sort(),byDate=new Map(dates.map(d=>[d,slots.filter(s=>s.date===d)]));
    const remaining=()=>items.reduce((sum,item)=>sum+Math.max(0,item.remaining),0);
    const keyTheoryRemaining=key=>items.some(x=>x.category==='theory'&&x.key===key&&x.remaining>0);
    const eligible=(item,slot,date,mode='any')=>{
      if(item.remaining<=0||!allows(slot,item.category))return false;
      if(item.category==='review'&&item.due&&date<item.due)return false;
      if(['theory','study'].includes(item.category)&&protectedStart&&date>=protectedStart)return false;
      if(item.category==='exercise'&&theoryKeys.has(item.key)){
        const completed=theoryComplete.get(item.key);if(!completed)return false;
        if(mode==='previous'&&completed>=date)return false;
      }
      return true;
    };
    const choose=(slot,date,predicate,mode='any')=>{
      const free=slot.duration-slot.used;
      const candidates=items.filter(x=>predicate(x)&&eligible(x,slot,date,mode)).sort((a,b)=>a.originalIndex-b.originalIndex);
      if(!candidates.length)return null;
      const full=candidates.find(x=>x.remaining<=free&&x.remaining>=MIN_BLOCK);
      if(full)return full;
      return candidates.find(x=>segmentSize(x,free)>=MIN_BLOCK)||null;
    };
    const place=(slot,date,predicate,mode='any')=>{
      const item=choose(slot,date,predicate,mode);if(!item)return false;
      const take=segmentSize(item,slot.duration-slot.used);if(take<MIN_BLOCK)return false;
      const wasNew=item.category==='theory'&&!startedTheory.has(item.key);
      if(wasNew)startedTheory.add(item.key);
      created.push(makeSegment(item,slot,take,routine));
      if(item.category==='theory'&&item.remaining<=0&&!keyTheoryRemaining(item.key))theoryComplete.set(item.key,date);
      return {item,wasNew};
    };
    for(const date of dates){
      let newTheoryToday=0;
      for(const slot of byDate.get(date)||[]){
        while(slot.duration-slot.used>=MIN_BLOCK&&remaining()>0){
          let result=false;
          result=place(slot,date,x=>x.category==='review');if(result)continue;
          result=place(slot,date,x=>x.category==='exercise','previous');if(result)continue;
          if(newTheoryToday<PREFERRED_NEW_TOPICS){
            result=place(slot,date,x=>x.category==='theory'&&!startedTheory.has(x.key));
            if(result){if(result.wasNew)newTheoryToday++;continue}
          }
          result=place(slot,date,x=>x.category==='exercise','any');if(result)continue;
          result=place(slot,date,x=>x.category==='theory'&&startedTheory.has(x.key));if(result)continue;
          result=place(slot,date,x=>x.category==='study');if(result)continue;
          result=place(slot,date,x=>x.category==='theory');if(result)continue;
          break;
        }
      }
    }
    const missing=remaining();
    if(missing>0)return{ok:false,reason:`Restaram aproximadamente ${Math.round(missing/60*10)/10}h sem encaixe compatível nos dias de estudo disponíveis. Os dias de simulado são reservados exclusivamente para simulados.`};
    for(const item of items){
      const count=item.segments.length;
      if(count>1)item.segments.forEach((seg,index)=>{seg.activity=`${stripPartLabels(seg.activity)} · Bloco ${index+1} de ${count}`});
    }
    const merged=[...created,...simulations].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    merged.forEach((task,index)=>task.cycleOrder=index);
    const tiny=merged.filter(t=>category(t)!=='simulation'&&minutes(t)<MIN_BLOCK);
    if(tiny.length)return{ok:false,reason:`A validação encontrou ${tiny.length} bloco(s) com menos de ${MIN_BLOCK} minutos; o cronograma anterior foi preservado.`};
    return{ok:true,tasks:merged,stats:{activities:merged.length,collapsedFragments:items.reduce((sum,x)=>sum+Math.max(0,x.collapsedParts-1),0),simulationDays:simulations.length,firstDate:created[0]?.date||'',lastDate:created.at(-1)?.date||'',minBlock:MIN_BLOCK}};
  }
  function apply(options={}){
    const state=read(STATE_KEY,null);if(!state||!Array.isArray(state.tasks)||!state.tasks.length)return{ok:false,reason:'O cronograma ainda não foi encontrado no armazenamento local.'};
    const routine=read(ROUTINE_KEY,state.studyRoutine||{mode:'continuous'})||{mode:'continuous'};
    const result=redistribute(state,routine);if(!result.ok)return result;
    state.tasks=result.tasks;
    state.studyRoutine={...routine,planningStrategy:{...(state.studyRoutine?.planningStrategy||routine.planningStrategy||{}),singleFinalPlanner:true,plannerVersion:4,capacityIsCeiling:true,fillAvailableStudyWindow:true,preferredMaxNewTheoryTopicsPerDay:PREFERRED_NEW_TOPICS,minStudyBlockMinutes:MIN_BLOCK,protectedFinalDays:PROTECTED_FINAL_DAYS,fragmentationNormalized:true,simulationDaysExclusive:true,simulationUsesOnlyItsOwnTime:false,finalReviewAllowsExercises:true}};
    if(!write(STATE_KEY,state))return{ok:false,reason:'Não foi possível salvar o cronograma reorganizado no navegador.'};
    if(!options.silent){try{sessionStorage.setItem(APPLIED_KEY,JSON.stringify(result.stats||{}));sessionStorage.removeItem(FAILURE_KEY)}catch{}}
    return result;
  }
  window.mpcApplyCapacityFill=apply;
  function attemptAfterGeneration(tries=0){
    const result=apply({silent:true});
    if(result.ok){
      try{sessionStorage.removeItem(PENDING_KEY);sessionStorage.setItem(APPLIED_KEY,JSON.stringify(result.stats||{}));sessionStorage.removeItem(FAILURE_KEY)}catch{}
      location.reload();return;
    }
    if(tries<12){setTimeout(()=>attemptAfterGeneration(tries+1),120);return}
    try{sessionStorage.removeItem(PENDING_KEY);sessionStorage.setItem(FAILURE_KEY,result.reason||'A reorganização final não pôde ser concluída.')}catch{}
  }
  function bind(){
    $('#adminGenerateScheduleBtn')?.addEventListener('click',()=>{
      try{sessionStorage.setItem(PENDING_KEY,'1');sessionStorage.removeItem(APPLIED_KEY);sessionStorage.removeItem(FAILURE_KEY)}catch{}
      setTimeout(()=>{if(sessionStorage.getItem(PENDING_KEY)==='1')attemptAfterGeneration(0)},500);
    },true);
    if(sessionStorage.getItem(PENDING_KEY)==='1')setTimeout(()=>attemptAfterGeneration(0),160);
    else if(sessionStorage.getItem(APPLIED_KEY)){
      const stats=read(APPLIED_KEY,{});sessionStorage.removeItem(APPLIED_KEY);
      setTimeout(()=>alert(`Cronograma reorganizado com o planejador final. ${stats.activities||0} atividades foram distribuídas; ${stats.simulationDays||0} dia(s) ficaram reservados exclusivamente para simulados; blocos inferiores a ${stats.minBlock||MIN_BLOCK} minutos foram eliminados${stats.collapsedFragments?` e ${stats.collapsedFragments} fragmento(s) duplicado(s) foram consolidados`:''}.`),260);
    }else if(sessionStorage.getItem(FAILURE_KEY)){
      const reason=sessionStorage.getItem(FAILURE_KEY);sessionStorage.removeItem(FAILURE_KEY);
      setTimeout(()=>alert(`A reorganização final não foi aplicada: ${reason}`),260);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();