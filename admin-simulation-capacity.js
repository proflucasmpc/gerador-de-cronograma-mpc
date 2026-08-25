(()=>{
  'use strict';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const DAY_NAMES=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  let rewriting=false;

  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const num=(selector,fallback=0)=>{const n=Number($(selector)?.value);return Number.isFinite(n)?n:fallback};
  const date=value=>{const d=new Date(`${String(value||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dayIndex=d=>(d.getDay()+6)%7;
  const diffDays=(a,b)=>Math.round((b-a)/86400000);
  const toMin=value=>{const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const formatMinutes=minutes=>{const total=Math.max(0,Math.round(minutes||0)),h=Math.floor(total/60),m=total%60;return m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`};
  const blackoutSet=()=>typeof window.mpcGetBlackoutDateSet==='function'?window.mpcGetBlackoutDateSet():new Set();

  function planWindow(){
    const start=date($('#adminStartDate')?.value);if(!start)return null;
    const exam=date($('#adminExamDate')?.value);
    const days=Math.max(1,Math.round(num('#adminPlanDays',1)));
    let end=addDays(start,days-1);
    if(exam){const eve=addDays(exam,-1);if(end>eve)end=eve}
    return{start,end,exam};
  }
  function selectedStudyDays(){return new Set($$('#adminAvailableDays input:checked').map(input=>Number(input.value)).filter(n=>n>=0&&n<=6))}
  function selectedSimulationDays(){return $$('#adminSimulationWeekdays input[data-weekday]:checked').map(input=>Number(input.value)).filter(n=>n>=0&&n<=6)}
  function routineWindows(dateValue){
    const routine=read(ROUTINE_KEY,null);
    const preferred=toMin($('#adminPreferredStart')?.value)||0;
    const hours=Math.max(.25,num('#adminHoursPerDay',1));
    if(!routine||routine.mode==='continuous')return[{start:preferred,duration:Math.round(hours*60)}];
    let source=[];
    if(routine.mode==='12x36'){
      const ref=date(routine.referenceDate||$('#adminStartDate')?.value);if(!ref)return[];
      const same=Math.abs(diffDays(ref,dateValue))%2===0;
      const status=same?(routine.referenceStatus||'work'):((routine.referenceStatus||'work')==='work'?'off':'work');
      source=status==='work'?(routine.workWindows||[]):(routine.offWindows||[]);
    }else source=routine.windows||[];
    let fallback=preferred;
    return [...source].sort((a,b)=>(toMin(a.time)??9999)-(toMin(b.time)??9999)).map(w=>{const start=toMin(w.time)??fallback,duration=Math.max(0,Number(w.duration)||30);fallback=start+duration;return{start,duration}}).filter(w=>w.duration>0);
  }
  function simulationDates(window){
    if(!$('#adminSimulationEnabled')?.checked)return[];
    const mode=$('#adminSimulationMode')?.value||'interval_days';
    const interval=Math.max(1,Math.round(num('#adminSimulationInterval',15)));
    const chosen=new Set(selectedSimulationDays());
    const type=$('#adminSimulationType')?.value||'full';
    const examKey=window.exam?key(window.exam):'';
    const examEveKey=window.exam?key(addDays(window.exam,-1)):'';
    const blocked=blackoutSet();
    const all=[];
    for(let d=new Date(window.start);d<=window.end;d=addDays(d,1)){
      const k=key(d);if(k===examKey||blocked.has(k))continue;
      if(type!=='subject'&&k===examEveKey)continue;
      all.push(new Date(d));
    }
    if(mode==='weekday_occurrence'){
      if(!chosen.size)return[];
      const firstMonday=new Date(window.start);firstMonday.setDate(firstMonday.getDate()-dayIndex(firstMonday));
      return all.filter(d=>chosen.has(dayIndex(d))&&Math.floor(diffDays(firstMonday,d)/7)%interval===0);
    }
    return all.filter((_,index)=>(index+1)%interval===0);
  }
  function calculate(){
    const window=planWindow();if(!window)return null;
    const routine=read(ROUTINE_KEY,null),studyDays=selectedStudyDays(),sims=simulationDates(window),simKeys=new Set(sims.map(key)),blocked=blackoutSet();
    let configuredDates=0,studyDates=0,baseMinutes=0,studyMinutes=0,reservedMinutes=0,blackoutDates=0,blackoutMinutes=0;
    for(let d=new Date(window.start);d<=window.end;d=addDays(d,1)){
      if(window.exam&&key(d)===key(window.exam))continue;
      if(routine?.mode!=='12x36'&&!studyDays.has(dayIndex(d)))continue;
      const windows=routineWindows(d);if(!windows.length)continue;
      configuredDates++;
      const dayMinutes=windows.reduce((sum,w)=>sum+w.duration,0);baseMinutes+=dayMinutes;
      if(blocked.has(key(d))){blackoutDates++;blackoutMinutes+=dayMinutes;continue}
      if(simKeys.has(key(d))){reservedMinutes+=dayMinutes;continue}
      studyDates++;studyMinutes+=dayMinutes;
    }
    return{window,sims,configuredDates,studyDates,baseMinutes,studyMinutes,reservedMinutes,blackoutDates,blackoutMinutes};
  }
  function extractDemand(text=''){
    const count=String(text).match(/atividades previstas:\s*(\d+)/i)?.[1]||'';
    const hours=String(text).match(/com cerca de\s*(\d+)h(?:(\d{1,2}))?/i);
    return{count,minutes:hours?Number(hours[1])*60+Number(hours[2]||0):null};
  }
  function renderWeekdayWarning(calc){
    let box=$('#mpcSimulationSelectionWarning');const host=$('#adminSimulationWeekdayField')||$('#adminSimulationFields');if(!host)return;
    if(!box){box=document.createElement('div');box.id='mpcSimulationSelectionWarning';box.style.cssText='margin-top:10px;padding:10px 12px;border-radius:10px;font-size:.82rem;line-height:1.45;font-weight:750;';host.appendChild(box)}
    const enabled=$('#adminSimulationEnabled')?.checked,mode=$('#adminSimulationMode')?.value;
    if(!enabled||mode!=='weekday_occurrence'){box.hidden=true;return}
    const selected=selectedSimulationDays(),interval=Math.max(1,Math.round(num('#adminSimulationInterval',1)));box.hidden=false;
    if(!selected.length){box.style.background='#fff3cd';box.style.color='#664d03';box.textContent='Selecione pelo menos um dia da semana para os simulados.';return}
    const names=selected.map(n=>DAY_NAMES[n]).join(', ');
    if(selected.length>1){box.style.background='#fff3cd';box.style.color='#664d03';box.textContent=`Atenção: ${selected.length} dias estão marcados (${names}). A cada ${interval} semana${interval===1?'':'s'}, haverá simulado em TODOS esses dias.`}
    else{box.style.background='#e8f5e9';box.style.color='#1b5e20';box.textContent=`Configuração: simulado em ${names}, a cada ${interval} semana${interval===1?'':'s'}. Cada data de simulado fica reservada exclusivamente para o simulado, sem estudo regular.`}
    if(calc?.sims?.length)box.textContent+=` Total previsto no período: ${calc.sims.length} simulado${calc.sims.length===1?'':'s'}.`;
  }
  function rewritePreview(){
    if(rewriting)return;const label=$('#adminCapacityPreview');if(!label)return;const current=String(label.textContent||'');if(!/Período:/i.test(current))return;
    const calc=calculate();if(!calc)return;const demand=extractDemand(current),fits=demand.minutes==null?true:demand.minutes<=calc.studyMinutes;rewriting=true;
    label.className=`helper ${fits?'admin-capacity-ok':'admin-capacity-error'}`;
    const activityText=demand.count?` Atividades previstas: ${demand.count}${demand.minutes!=null?`, com cerca de ${formatMinutes(demand.minutes)}`:''}.`:'';
    const simText=calc.sims.length?` Há ${calc.sims.length} data${calc.sims.length===1?'':'s'} reservada${calc.sims.length===1?'':'s'} exclusivamente para simulados, retirando ${formatMinutes(calc.reservedMinutes)} da capacidade regular.`:' Não há simulados programados.';
    const blackoutText=calc.blackoutDates?` Há também ${calc.blackoutDates} dia${calc.blackoutDates===1?'':'s'} de indisponibilidade, retirando ${formatMinutes(calc.blackoutMinutes)} da capacidade de estudo.`:'';
    label.textContent=`Período: ${Math.max(1,diffDays(calc.window.start,calc.window.end)+1)} dias corridos, ${calc.studyDates} dias efetivos de estudo, ${calc.sims.length} dias exclusivos de simulado e ${calc.blackoutDates} dias sem estudo. Capacidade de estudo regular: ${formatMinutes(calc.studyMinutes)}.${activityText}${simText}${blackoutText}${fits?' O plano cabe na capacidade calculada.':' O plano não cabe na capacidade calculada com as configurações atuais.'}`;
    rewriting=false;renderWeekdayWarning(calc);
  }
  function rewriteGenerationStatus(){
    const status=$('#adminGenerationStatus');if(!status)return;const text=String(status.textContent||'');if(!/Cronograma criado para/i.test(text))return;const calc=calculate();if(!calc)return;
    let next=text.replace(/\d+\s+dias de estudo,\s*\d+\s+dias exclusivos para simulados/i,`${calc.studyDates} dias de estudo, ${calc.sims.length} dias exclusivos para simulados e ${calc.blackoutDates} dias sem estudo`);
    next=next.replace(/\d+\s+dias com disponibilidade de estudo,\s*\d+\s+datas com simulado/i,`${calc.studyDates} dias de estudo, ${calc.sims.length} dias exclusivos para simulados e ${calc.blackoutDates} dias sem estudo`);
    if(next!==text){rewriting=true;status.textContent=next;rewriting=false}
  }
  function refresh(){setTimeout(()=>{rewritePreview();rewriteGenerationStatus()},25)}
  function bind(){
    refresh();setTimeout(refresh,350);setTimeout(refresh,1000);
    document.addEventListener('input',event=>{if(event.target?.closest?.('#adminPanel'))refresh()},true);
    document.addEventListener('change',event=>{if(event.target?.closest?.('#adminPanel'))refresh()},true);
    document.addEventListener('mpc:blackout-changed',refresh);
    const preview=$('#adminCapacityPreview'),status=$('#adminGenerationStatus');
    if(preview)new MutationObserver(()=>{if(!rewriting)refresh()}).observe(preview,{childList:true,subtree:true,characterData:true});
    if(status)new MutationObserver(()=>{if(!rewriting)rewriteGenerationStatus()}).observe(status,{childList:true,subtree:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();