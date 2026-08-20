(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const PENDING_KEY='mpcCapacityFillPendingV2';
  const APPLIED_KEY='mpcCapacityFillAppliedV2';
  const FAILURE_KEY='mpcCapacityFillFailureV2';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const readJson=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const parseDate=value=>{const d=new Date(`${String(value||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const timeMinutes=value=>{const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const timeText=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const taskMinutes=task=>{const a=timeMinutes(task?.start),b=timeMinutes(task?.end);return a!==null&&b!==null&&b>a?b-a:30};
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
  function subtractBusy(window,busy){
    let pieces=[[window.start,window.start+window.duration]];
    for(const [bs,be] of busy){
      pieces=pieces.flatMap(([a,b])=>{
        if(be<=a||bs>=b)return[[a,b]];
        const out=[];if(bs>a)out.push([a,Math.min(bs,b)]);if(be<b)out.push([Math.max(be,a),b]);return out;
      });
    }
    return pieces.filter(([a,b])=>b-a>=10).map(([a,b])=>({...window,start:a,duration:b-a,used:0}));
  }
  function buildSlots(state,config,simDates,reviews){
    const start=parseDate(state.startDate||$('#adminStartDate')?.value);if(!start)return[];
    const exam=parseDate(state.examDate||$('#adminExamDate')?.value);
    let end=parseDate(state.endDate||'');
    if(!end){const days=Math.max(1,Number($('#adminPlanDays')?.value)||1);end=addDays(start,days-1)}
    if(exam&&end>=exam)end=addDays(exam,-1);
    const weekdays=weekdaySet(state),slots=[];
    const busyByDate=new Map();
    for(const review of reviews){
      const a=timeMinutes(review.start),b=timeMinutes(review.end);if(!review.date||a===null||b===null||b<=a)continue;
      if(!busyByDate.has(review.date))busyByDate.set(review.date,[]);busyByDate.get(review.date).push([a,b]);
    }
    for(const busy of busyByDate.values())busy.sort((a,b)=>a[0]-b[0]);
    for(let d=new Date(start);d<=end;d=addDays(d,1)){
      const key=dateKey(d);if(simDates.has(key))continue;
      const mondayIndex=(d.getDay()+6)%7;
      if(config?.mode!=='12x36'&&!weekdays.has(mondayIndex))continue;
      const busy=busyByDate.get(key)||[];
      for(const w of windowsForDate(d,config,state))slots.push(...subtractBusy({...w,used:0},busy).map(piece=>({date:key,...piece})));
    }
    return slots;
  }
  function segment(item,slot,take,mode){
    const start=slot.start+slot.used;
    const seg={...item.task,id:`${item.task.id||'task'}-fill2-${item.parts+1}-${Math.random().toString(36).slice(2,6)}`,date:slot.date,day:(parseDate(slot.date).getDay()+6)%7,start:timeText(start),end:timeText(start+take),notes:noteFor(slot,mode,item.task.notes),done:false};
    if(slot.videoOnly){const body=cleanActivity(seg.activity),c=cat(seg);seg.activity=c==='theory'?`Videoaula de teoria - ${body}`:c==='exercise'?`Videoaula de exercícios corrigidos - ${body}`:`Videoaula - ${body}`}
    slot.used+=take;item.remaining-=take;item.parts+=1;item.segments.push(seg);return seg;
  }
  function redistribute(state,config){
    const simulations=state.tasks.filter(t=>cat(t)==='simulation');
    const reviews=state.tasks.filter(t=>cat(t)==='review');
    const acquisitionTasks=state.tasks.filter(t=>!['simulation','review'].includes(cat(t)));
    const simDates=new Set(simulations.map(t=>t.date).filter(Boolean));
    const slots=buildSlots(state,config,simDates,reviews);if(!slots.length)return{ok:false,reason:'Não há janelas livres de estudo no período.'};
    const items=acquisitionTasks.map((task,index)=>({task,category:cat(task),key:topicKey(task),remaining:taskMinutes(task),originalIndex:index,parts:0,segments:[]}));
    const theoryKeys=new Set(items.filter(x=>x.category==='theory').map(x=>x.key));
    const theoryComplete=new Map();
    const theoryStarted=new Set();
    const created=[];
    const dates=[...new Set(slots.map(s=>s.date))].sort();
    const byDate=new Map(dates.map(d=>[d,slots.filter(s=>s.date===d)]));
    const totalRemaining=()=>items.reduce((s,x)=>s+Math.max(0,x.remaining),0);
    const acquisitionMinutes=totalRemaining();
    const freeMinutes=slots.reduce((s,x)=>s+x.duration,0);
    if(freeMinutes<acquisitionMinutes)return{ok:false,reason:`A aquisição exige ${Math.round(acquisitionMinutes/60*10)/10}h e restaram ${Math.round(freeMinutes/60*10)/10}h após reservar revisões e simulados.`};
    const keyDone=key=>!items.some(x=>x.category==='theory'&&x.key===key&&x.remaining>0);
    const markTheoryComplete=(key,date)=>{if(keyDone(key))theoryComplete.set(key,date)};
    const eligible=(item,slot,date,mode='any')=>{
      if(item.remaining<=0||!allows(slot,item.category))return false;
      if(item.category==='exercise'&&theoryKeys.has(item.key)){
        const completed=theoryComplete.get(item.key);if(!completed)return false;
        if(mode==='previous'&&completed>=date)return false;
      }
      return true;
    };
    const placeOne=(slot,date,predicate,mode='any')=>{
      const candidates=items.filter(x=>predicate(x)&&eligible(x,slot,date,mode)).sort((a,b)=>a.originalIndex-b.originalIndex);
      if(!candidates.length)return false;
      const item=candidates[0],remainingSlot=slot.duration-slot.used,take=Math.min(item.remaining,remainingSlot);
      if(take<10&&item.remaining>take)return false;
      const wasNewTheory=item.category==='theory'&&!theoryStarted.has(item.key);
      if(wasNewTheory)theoryStarted.add(item.key);
      created.push(segment(item,slot,take,config?.mode||'continuous'));
      if(item.category==='theory'&&item.remaining<=0)markTheoryComplete(item.key,date);
      return {item,wasNewTheory};
    };
    for(const date of dates){
      let newTheoryCount=0;
      for(const slot of byDate.get(date)||[]){
        while(slot.used<slot.duration&&totalRemaining()>0){
          let result=false;
          // 1. Exercícios de conteúdos cuja teoria terminou em dia anterior.
          result=placeOne(slot,date,x=>x.category==='exercise','previous');
          if(result)continue;
          // 2. Até dois tópicos novos por dia como preferência pedagógica.
          if(newTheoryCount<2){
            result=placeOne(slot,date,x=>x.category==='theory'&&!theoryStarted.has(x.key));
            if(result){if(result.wasNewTheory)newTheoryCount++;continue}
          }
          // 3. Exercícios de reforço, inclusive após teoria concluída no mesmo dia.
          result=placeOne(slot,date,x=>x.category==='exercise','any');
          if(result)continue;
          // 4. Continuação de teoria já iniciada ou outros blocos de estudo.
          result=placeOne(slot,date,x=>x.category==='theory'&&theoryStarted.has(x.key));
          if(result)continue;
          result=placeOne(slot,date,x=>x.category==='study');
          if(result)continue;
          // 5. Se ainda houver tempo e conteúdo pendente, novo tópico adicional em vez de deixar a janela ociosa.
          result=placeOne(slot,date,x=>x.category==='theory');
          if(result)continue;
          break;
        }
      }
    }
    const missing=totalRemaining();
    if(missing>0)return{ok:false,reason:`Restaram aproximadamente ${Math.round(missing/60*10)/10}h de teoria/exercícios sem encaixe compatível.`};
    items.filter(x=>x.parts>1).forEach(item=>item.segments.forEach((seg,i)=>{seg.activity=`${seg.activity} · Bloco ${i+1} de ${item.segments.length}`}));
    const merged=[...created,...reviews,...simulations].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    merged.forEach((t,i)=>t.cycleOrder=i);
    return{ok:true,tasks:merged,stats:{acquisitionMinutes,freeMinutes,firstDate:created[0]?.date||'',lastDate:created.at(-1)?.date||''}};
  }
  function apply(){
    const state=readJson(STATE_KEY,null);if(!state||!Array.isArray(state.tasks)||!state.tasks.length)return{ok:false,reason:'O cronograma ainda não foi encontrado no armazenamento local.'};
    const config=readJson(ROUTINE_KEY,{mode:'continuous'});
    const result=redistribute(state,config);if(!result.ok)return result;
    state.tasks=result.tasks;
    state.studyRoutine=state.studyRoutine||config;
    state.studyRoutine.planningStrategy={...(state.studyRoutine.planningStrategy||{}),capacityIsCeiling:true,preferredMaxNewTheoryTopicsPerDay:2,fillAvailableStudyWindow:true,preserveScheduledReviews:true,priorityOrder:['exercícios pendentes','até 2 tópicos novos','exercícios de reforço','continuação de teoria','tópico novo adicional se houver tempo livre'],unusedCapacityAvoidedWhenPendingContent:true,capacityFillVersion:2};
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state));sessionStorage.setItem(APPLIED_KEY,JSON.stringify(result.stats||{}));sessionStorage.removeItem(FAILURE_KEY);return{ok:true}}catch{return{ok:false,reason:'Não foi possível salvar a redistribuição no navegador.'}}
  }
  function attemptAfterGeneration(tries=0){
    const result=apply();
    if(result.ok){sessionStorage.removeItem(PENDING_KEY);location.reload();return}
    if(tries<12){setTimeout(()=>attemptAfterGeneration(tries+1),100);return}
    sessionStorage.removeItem(PENDING_KEY);sessionStorage.setItem(FAILURE_KEY,result.reason||'A redistribuição não pôde ser concluída.');
  }
  function bind(){
    const btn=$('#adminGenerateScheduleBtn');
    btn?.addEventListener('click',()=>{
      try{sessionStorage.setItem(PENDING_KEY,'1');sessionStorage.removeItem(APPLIED_KEY);sessionStorage.removeItem(FAILURE_KEY)}catch{}
      // Se o gerador principal não recarregar a página, ainda tentamos aplicar após ele concluir.
      setTimeout(()=>{if(sessionStorage.getItem(PENDING_KEY)==='1')attemptAfterGeneration(0)},450);
    },true);
    if(sessionStorage.getItem(PENDING_KEY)==='1')setTimeout(()=>attemptAfterGeneration(0),120);
    else if(sessionStorage.getItem(APPLIED_KEY)){
      const stats=readJson(APPLIED_KEY,{});sessionStorage.removeItem(APPLIED_KEY);
      setTimeout(()=>alert(`Capacidade diária reorganizada com sucesso. O sistema preservou as revisões e passou a usar as janelas disponíveis com teoria e exercícios até o limite configurado${stats.lastDate?`, concentrando a aquisição de conteúdo até ${new Date(`${stats.lastDate}T12:00:00`).toLocaleDateString('pt-BR')}`:''}.`),260);
    }else if(sessionStorage.getItem(FAILURE_KEY)){
      const reason=sessionStorage.getItem(FAILURE_KEY);sessionStorage.removeItem(FAILURE_KEY);
      setTimeout(()=>alert(`A reorganização da capacidade diária não foi aplicada: ${reason}`),260);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();