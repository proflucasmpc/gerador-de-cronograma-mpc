(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const PENDING_KEY='mpcFinalConsolidationPendingV3';
  const APPLIED_KEY='mpcFinalConsolidationAppliedV3';
  const VERSION=3,MIN_BLOCK=15,DEFAULT_BLOCK=60;
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const parseDate=v=>{const d=new Date(`${String(v||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const toMin=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const toTime=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const dayIndex=d=>(d.getDay()+6)%7;
  const isSimulation=t=>/simulado/i.test(`${t?.type||''} ${t?.activity||''}`);
  const isConsolidation=t=>String(t?.id||'').includes('-consolidation-')||Boolean(t?.finalConsolidation);
  const plannerReady=state=>Boolean(state?.studyRoutine?.planningStrategy?.singleFinalPlanner)&&Number(state?.studyRoutine?.planningStrategy?.plannerVersion)===4;
  const isBlackout=value=>typeof window.mpcIsBlackoutDate==='function'&&window.mpcIsBlackoutDate(value);
  function currentPlanWindow(state){
    const start=parseDate($('#adminStartDate')?.value||state.startDate);if(!start)return null;
    const days=Math.max(1,Math.round(Number($('#adminPlanDays')?.value)||1));
    let end=addDays(start,days-1);const exam=parseDate($('#adminExamDate')?.value||state.examDate);if(exam&&end>=exam)end=addDays(exam,-1);return{start,end,days};
  }
  function availableWeekdays(state){
    const checked=$$('#adminAvailableDays input:checked').map(i=>Number(i.value)).filter(n=>n>=0&&n<=6);if(checked.length)return new Set(checked);
    const saved=(state.availableDays||[]).map(Number).filter(n=>n>=0&&n<=6);return new Set(saved.length?saved:[0,1,2,3,4]);
  }
  function windowsForDate(date,routine,state){
    const preferred=toMin($('#adminPreferredStart')?.value||state.preferredStart||'07:00')??420;
    const hours=Math.max(.25,Number($('#adminHoursPerDay')?.value||state.hoursPerDay||1));
    if(!routine||routine.mode==='continuous')return[{start:preferred,duration:Math.round(hours*60)}];
    let source=[];
    if(routine.mode==='12x36'){
      const ref=parseDate(routine.referenceDate||state.startDate);if(!ref)return[];
      const diff=Math.abs(Math.round((date-ref)/86400000)),same=diff%2===0;
      const profile=same?(routine.referenceStatus||'work'):((routine.referenceStatus||'work')==='work'?'off':'work');
      source=profile==='work'?(routine.workWindows||[]):(routine.offWindows||[]);
    }else source=routine.windows||[];
    return [...source].sort((a,b)=>(toMin(a.time)??9999)-(toMin(b.time)??9999)).map(w=>({start:toMin(w.time)??preferred,duration:Math.max(MIN_BLOCK,Number(w.duration)||30)}));
  }
  function occupiedIntervals(tasks,date){return tasks.filter(t=>t.date===date).map(t=>[toMin(t.start),toMin(t.end)]).filter(([a,b])=>a!==null&&b!==null&&b>a).sort((a,b)=>a[0]-b[0])}
  function freePieces(window,busy){let pieces=[[window.start,window.start+window.duration]];for(const[bs,be]of busy)pieces=pieces.flatMap(([a,b])=>{if(be<=a||bs>=b)return[[a,b]];const out=[];if(bs>a)out.push([a,Math.min(bs,b)]);if(be<b)out.push([Math.max(be,a),b]);return out});return pieces.filter(([a,b])=>b-a>=MIN_BLOCK)}
  function sourcePool(tasks){
    const map=new Map();for(const task of tasks){if(isSimulation(task)||isConsolidation(task)||!task.date)continue;const subject=String(task.subject||'').trim();const activity=String(task.activity||'').replace(/\s*·\s*(?:Bloco|Parte)\s+\d+\s+de\s+\d+\s*$/i,'').trim();if(!subject||!activity)continue;const k=`${subject}|${activity}`.toLocaleLowerCase('pt-BR');const existing=map.get(k);if(!existing||String(task.date)<existing.availableFrom)map.set(k,{subject,activity,availableFrom:String(task.date)})}return[...map.values()].sort((a,b)=>a.availableFrom.localeCompare(b.availableFrom));
  }
  function apply(){
    if(typeof window.mpcSyncBlackoutRanges==='function')window.mpcSyncBlackoutRanges();
    const state=read(STATE_KEY,null);if(!state?.tasks?.length||!plannerReady(state))return{ok:false,reason:'Planejador Final ainda não concluído.'};
    const window=currentPlanWindow(state);if(!window)return{ok:false,reason:'Período atual do cronograma inválido.'};
    const routine=read(ROUTINE_KEY,state.studyRoutine||{mode:'continuous'})||{mode:'continuous'};
    const baseTasks=state.tasks.filter(t=>!isConsolidation(t));
    const simulationDates=new Set(baseTasks.filter(isSimulation).map(t=>String(t.date||'')).filter(Boolean));
    const weekdays=availableWeekdays(state),pool=sourcePool(baseTasks);if(!pool.length)return{ok:false,reason:'Não há assuntos-base para criar a consolidação.'};
    const created=[];let cursor=0,totalMinutes=0,filledDays=0,blackoutDays=0;
    for(let d=new Date(window.start);d<=window.end;d=addDays(d,1)){
      const k=dateKey(d);if(isBlackout(k)){blackoutDays++;continue}if(simulationDates.has(k))continue;
      if(routine.mode!=='12x36'&&!weekdays.has(dayIndex(d)))continue;
      const availableSources=pool.filter(s=>s.availableFrom<=k);if(!availableSources.length)continue;
      const busy=occupiedIntervals(baseTasks,k);let dayAdded=0;
      for(const w of windowsForDate(d,routine,state))for(const[a,b]of freePieces(w,busy)){let pos=a;while(b-pos>=MIN_BLOCK){const source=availableSources[cursor%availableSources.length];cursor++;const take=Math.min(DEFAULT_BLOCK,b-pos);if(take<MIN_BLOCK)break;const review=cursor%3===0;created.push({id:`final-consolidation-${k}-${pos}-${cursor}`,date:k,day:dayIndex(d),cycleOrder:0,start:toTime(pos),end:toTime(pos+take),subject:source.subject,type:review?'Revisão':'Exercícios',activity:review?`Revisão ativa - ${source.activity}`:`Questões de consolidação - ${source.activity}`,notes:review?'Releia pontos-chave, tente recordar sem consultar o material e confira as lacunas.':'Resolva questões do assunto, registre erros e revise os pontos que causaram dificuldade.',done:false,finalConsolidation:true});totalMinutes+=take;dayAdded+=take;pos+=take}}
      if(dayAdded>0)filledDays++;
    }
    const merged=[...baseTasks,...created].filter(t=>!t.date||t.date<=dateKey(window.end)).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));merged.forEach((task,index)=>task.cycleOrder=index);
    state.tasks=merged;state.endDate=dateKey(window.end);state.adminPersonalization={...(state.adminPersonalization||{}),endDate:dateKey(window.end),planDays:window.days,blackoutDatesExclusive:true};
    state.studyRoutine={...state.studyRoutine,planningStrategy:{...(state.studyRoutine?.planningStrategy||{}),finalConsolidation:true,finalConsolidationVersion:VERSION,finalConsolidationWholePlanFill:true,finalConsolidationAddedMinutes:totalMinutes,currentPlanDays:window.days,currentPlanEnd:dateKey(window.end),blackoutDatesExclusive:true}};
    if(!write(STATE_KEY,state))return{ok:false,reason:'Não foi possível salvar a consolidação final.'};return{ok:true,added:created.length,minutes:totalMinutes,filledDays,blackoutDays,end:dateKey(window.end)};
  }
  function attempt(tries=0){const state=read(STATE_KEY,{});if(!plannerReady(state)){if(tries<20)return setTimeout(()=>attempt(tries+1),150);return}const result=apply();if(result.ok){try{sessionStorage.removeItem(PENDING_KEY);sessionStorage.setItem(APPLIED_KEY,JSON.stringify(result))}catch{}location.reload()}}
  function bind(){
    $('#adminGenerateScheduleBtn')?.addEventListener('click',()=>{try{sessionStorage.setItem(PENDING_KEY,'1');sessionStorage.removeItem(APPLIED_KEY)}catch{}},true);
    if(sessionStorage.getItem(PENDING_KEY)==='1')setTimeout(()=>attempt(0),220);else if(sessionStorage.getItem(APPLIED_KEY)){let data={};try{data=JSON.parse(sessionStorage.getItem(APPLIED_KEY)||'{}')}catch{}sessionStorage.removeItem(APPLIED_KEY);setTimeout(()=>alert(`Consolidação final aplicada. ${data.added||0} blocos preencheram aproximadamente ${Math.round((data.minutes||0)/60*10)/10}h livres em ${data.filledDays||0} dia(s). ${data.blackoutDays||0} dia(s) de indisponibilidade foram mantidos sem estudo e os dias de simulado continuam exclusivos.`),260)}
  }
  window.mpcApplyFinalConsolidation=apply;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();