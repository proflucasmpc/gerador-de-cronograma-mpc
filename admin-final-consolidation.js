(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const PENDING_KEY='mpcFinalConsolidationPendingV1';
  const APPLIED_KEY='mpcFinalConsolidationAppliedV1';
  const VERSION=1;
  const MIN_BLOCK=15;
  const DEFAULT_BLOCK=60;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const parseDate=value=>{const d=new Date(`${String(value||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const toMin=value=>{const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const toTime=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const dayIndex=d=>(d.getDay()+6)%7;
  const isSimulation=t=>/simulado/i.test(`${t?.type||''} ${t?.activity||''}`);
  const isConsolidation=t=>String(t?.id||'').includes('-consolidation-')||Boolean(t?.finalConsolidation);
  const isAcquisition=t=>/teoria|exerc|quest|estudo/i.test(`${t?.type||''} ${t?.activity||''}`)&&!/revis|simulado/i.test(`${t?.type||''} ${t?.activity||''}`);

  function plannerReady(state){
    const strategy=state?.studyRoutine?.planningStrategy||{};
    return Boolean(strategy.singleFinalPlanner)&&Number(strategy.plannerVersion)===4;
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

  function occupiedIntervals(tasks,date){
    return tasks.filter(t=>t.date===date).map(t=>[toMin(t.start),toMin(t.end)]).filter(([a,b])=>a!==null&&b!==null&&b>a).sort((a,b)=>a[0]-b[0]);
  }

  function freePieces(window,busy){
    let pieces=[[window.start,window.start+window.duration]];
    for(const [bs,be] of busy){
      pieces=pieces.flatMap(([a,b])=>{
        if(be<=a||bs>=b)return[[a,b]];
        const out=[];if(bs>a)out.push([a,Math.min(bs,b)]);if(be<b)out.push([Math.max(be,a),b]);return out;
      });
    }
    return pieces.filter(([a,b])=>b-a>=MIN_BLOCK);
  }

  function sourcePool(tasks){
    const seen=new Set(),pool=[];
    for(const task of tasks){
      if(isSimulation(task)||isConsolidation(task))continue;
      const subject=String(task.subject||'').trim();
      const activity=String(task.activity||'').replace(/\s*·\s*(?:Bloco|Parte)\s+\d+\s+de\s+\d+\s*$/i,'').trim();
      if(!subject||!activity)continue;
      const key=`${subject}|${activity}`.toLocaleLowerCase('pt-BR');
      if(seen.has(key))continue;
      seen.add(key);pool.push({subject,activity});
    }
    return pool;
  }

  function apply(){
    const state=read(STATE_KEY,null);if(!state?.tasks?.length||!plannerReady(state))return{ok:false,reason:'Planejador Final ainda não concluído.'};
    const routine=read(ROUTINE_KEY,state.studyRoutine||{mode:'continuous'})||{mode:'continuous'};
    const baseTasks=state.tasks.filter(t=>!isConsolidation(t));
    const simulations=new Set(baseTasks.filter(isSimulation).map(t=>String(t.date||'')).filter(Boolean));
    const acquisition=baseTasks.filter(isAcquisition).map(t=>String(t.date||'')).filter(Boolean).sort();
    const phaseStart=acquisition.length?parseDate(acquisition.at(-1)):null;
    if(!phaseStart)return{ok:false,reason:'Não foi possível localizar o fim do conteúdo principal.'};
    const start=addDays(phaseStart,1);
    const exam=parseDate(state.examDate||$('#adminExamDate')?.value);
    let end=parseDate(state.endDate||state.adminPersonalization?.endDate||'');
    if(!end){const planStart=parseDate(state.startDate||$('#adminStartDate')?.value);const days=Math.max(1,Number($('#adminPlanDays')?.value)||1);if(planStart)end=addDays(planStart,days-1)}
    if(exam&&(!end||end>=exam))end=addDays(exam,-1);
    if(!end||start>end)return{ok:true,added:0};

    const weekdays=availableWeekdays(state),pool=sourcePool(baseTasks);if(!pool.length)return{ok:false,reason:'Não há assuntos-base para criar a fase de consolidação.'};
    const created=[];let cursor=0,totalMinutes=0;
    for(let d=new Date(start);d<=end;d=addDays(d,1)){
      const k=dateKey(d);if(simulations.has(k))continue;
      if(routine.mode!=='12x36'&&!weekdays.has(dayIndex(d)))continue;
      const busy=occupiedIntervals(baseTasks,k);
      for(const w of windowsForDate(d,routine,state)){
        for(const [a,b] of freePieces(w,busy)){
          let pos=a;
          while(b-pos>=MIN_BLOCK){
            const source=pool[cursor%pool.length];cursor++;
            const take=Math.min(DEFAULT_BLOCK,b-pos);
            if(take<MIN_BLOCK)break;
            const mode=cursor%3===0?'Revisão ativa':'Questões de consolidação';
            const type=mode==='Revisão ativa'?'Revisão':'Exercícios';
            const activity=mode==='Revisão ativa'
              ?`Revisão ativa - ${source.activity}`
              :`Questões de consolidação - ${source.activity}`;
            created.push({
              id:`final-consolidation-${k}-${pos}-${cursor}`,
              date:k,day:dayIndex(d),cycleOrder:0,start:toTime(pos),end:toTime(pos+take),
              subject:source.subject,type,activity,
              notes:mode==='Revisão ativa'?'Releia pontos-chave, recorde sem consultar o material e confira lacunas.':'Resolva questões do assunto, registre erros e revise os pontos que causaram dificuldade.',
              done:false,finalConsolidation:true
            });
            totalMinutes+=take;pos+=take;
          }
        }
      }
    }
    const merged=[...baseTasks,...created].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    merged.forEach((task,index)=>task.cycleOrder=index);
    state.tasks=merged;
    state.studyRoutine={...state.studyRoutine,planningStrategy:{...(state.studyRoutine?.planningStrategy||{}),finalConsolidation:true,finalConsolidationVersion:VERSION,finalConsolidationStart:dateKey(start),finalConsolidationAddedMinutes:totalMinutes}};
    if(!write(STATE_KEY,state))return{ok:false,reason:'Não foi possível salvar a fase final de consolidação.'};
    return{ok:true,added:created.length,minutes:totalMinutes,start:dateKey(start)};
  }

  function attempt(tries=0){
    const state=read(STATE_KEY,{});
    if(!plannerReady(state)){if(tries<20)return setTimeout(()=>attempt(tries+1),150);return}
    const result=apply();
    if(result.ok){
      try{sessionStorage.removeItem(PENDING_KEY);sessionStorage.setItem(APPLIED_KEY,JSON.stringify(result))}catch{}
      location.reload();
    }
  }

  function bind(){
    $('#adminGenerateScheduleBtn')?.addEventListener('click',()=>{try{sessionStorage.setItem(PENDING_KEY,'1');sessionStorage.removeItem(APPLIED_KEY)}catch{}},true);
    if(sessionStorage.getItem(PENDING_KEY)==='1')setTimeout(()=>attempt(0),220);
    else if(sessionStorage.getItem(APPLIED_KEY)){
      let data={};try{data=JSON.parse(sessionStorage.getItem(APPLIED_KEY)||'{}')}catch{}sessionStorage.removeItem(APPLIED_KEY);
      setTimeout(()=>alert(`Fase final de consolidação criada. ${data.added||0} blocos adicionais preencheram aproximadamente ${Math.round((data.minutes||0)/60*10)/10}h com revisões ativas e questões, mantendo os dias de simulado exclusivos.`),260);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();