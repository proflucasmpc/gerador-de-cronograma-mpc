(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const PENDING_KEY='mpcAuthoritativeFinalPassPendingV1';
  const DONE_KEY='mpcAuthoritativeFinalPassDoneV1';
  const FAIL_KEY='mpcAuthoritativeFinalPassFailV1';
  const VERSION=1;
  const LEGACY_PENDING=['mpcCapacityFillPendingV4','mpcFinalConsolidationPendingV4','mpcFinalCapacityGuaranteePendingV1'];
  const LEGACY_MESSAGES=['mpcCapacityFillAppliedV4','mpcCapacityFillFailureV4','mpcFinalConsolidationAppliedV4','mpcFinalCapacityGuaranteeDoneV1'];
  const $=(s,r=document)=>r.querySelector(s);
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const parse=v=>{const d=new Date(`${String(v||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const diffDays=(a,b)=>Math.round((b-a)/86400000);
  const toMin=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const fmt=m=>{m=Math.max(0,Math.round(Number(m)||0));const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h${String(r).padStart(2,'0')}`:`${h}h`):`${r} min`};
  const plannerReady=s=>Boolean(s?.studyRoutine?.planningStrategy?.singleFinalPlanner)&&Number(s?.studyRoutine?.planningStrategy?.plannerVersion)===4;

  function request(){
    const data={requestedAt:Date.now(),student:String($('#adminStudentName')?.value||'').trim()};
    try{sessionStorage.setItem(PENDING_KEY,JSON.stringify(data));sessionStorage.removeItem(DONE_KEY);sessionStorage.removeItem(FAIL_KEY)}catch{}
  }
  function pendingInfo(){try{return JSON.parse(sessionStorage.getItem(PENDING_KEY)||'null')}catch{return null}}
  function legacyBusy(){return LEGACY_PENDING.some(k=>sessionStorage.getItem(k)==='1')}
  function clearLegacy(){try{[...LEGACY_PENDING,...LEGACY_MESSAGES].forEach(k=>sessionStorage.removeItem(k))}catch{}}

  function forceExamWindow(){
    const state=read(STATE_KEY,null);if(!state?.tasks?.length)return{ok:false,reason:'O cronograma gerado ainda não está disponível.'};
    const start=parse($('#adminStartDate')?.value||state.startDate||state.adminPersonalization?.startDate);
    const exam=parse($('#adminExamDate')?.value||state.examDate||state.adminPersonalization?.examDate);
    const hours=Number($('#adminHoursPerDay')?.value||state.hoursPerDay||0);
    if(!start)return{ok:false,reason:'Data inicial inválida.'};
    state.startDate=dateKey(start);
    if(hours>0)state.hoursPerDay=hours;
    if(exam){
      if(exam<=start)return{ok:false,reason:'A data da prova precisa ser posterior ao início do cronograma.'};
      const end=addDays(exam,-1),days=diffDays(start,end)+1;
      state.examDate=dateKey(exam);state.endDate=dateKey(end);state.adminPlanDays=days;
      state.adminPersonalization={...(state.adminPersonalization||{}),startDate:dateKey(start),examDate:dateKey(exam),endDate:dateKey(end),planDays:days,examDateDefinesPlanEnd:true};
    }
    write(STATE_KEY,state);return{ok:true,state};
  }

  function independentAudit(state){
    const strategy=state?.studyRoutine?.planningStrategy||{};
    const tasks=(state?.tasks||[]).filter(t=>t?.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.start||'').localeCompare(String(b.start||'')));
    const last=tasks.at(-1)?.date||'';
    const exam=parse(state.examDate||state.adminPersonalization?.examDate||'');
    const expectedEnd=exam?dateKey(addDays(exam,-1)):(state.endDate||state.adminPersonalization?.endDate||'');
    const hours=Number($('#adminHoursPerDay')?.value||state.hoursPerDay||0);
    return{plannerV4:plannerReady(state),fullCapacityValidated:Boolean(strategy.fullCapacityValidated)&&Number(strategy.fullCapacityValidationVersion)>=4,lastTaskDate:last,expectedEnd,hoursPerDay:hours,taskCount:tasks.length};
  }

  function finalize(){
    clearLegacy();
    const forced=forceExamWindow();if(!forced.ok)return forced;
    if(typeof window.mpcNormalizeFinalPlannerInput==='function')window.mpcNormalizeFinalPlannerInput();
    // O normalizador recria simulados e libera datas consultivas. Reforçamos novamente
    // a janela até a véspera, pois esta é a regra final do cronograma com prova marcada.
    const forcedAgain=forceExamWindow();if(!forcedAgain.ok)return forcedAgain;
    if(typeof window.mpcPrepareReviewPrerequisites==='function')window.mpcPrepareReviewPrerequisites();
    if(typeof window.mpcApplyCapacityFill!=='function')return{ok:false,reason:'O Planejador Final V4 ainda não carregou.'};
    const planned=window.mpcApplyCapacityFill({silent:true});if(!planned?.ok)return{ok:false,reason:planned?.reason||'O Planejador Final não concluiu a distribuição.'};
    // V4 trabalha com as atividades-base. A consolidação é obrigatória para transformar
    // a carga diária de teto em capacidade efetivamente usada até a véspera da prova.
    if(typeof window.mpcApplyFinalConsolidation!=='function')return{ok:false,reason:'A consolidação final ainda não carregou.'};
    const consolidated=window.mpcApplyFinalConsolidation();if(!consolidated?.ok)return{ok:false,reason:consolidated?.reason||'A consolidação final não conseguiu preencher todas as janelas.'};
    const validation=typeof window.mpcValidateFinalCapacity==='function'?window.mpcValidateFinalCapacity():{ok:true,gaps:[]};
    if(!validation?.ok)return{ok:false,reason:`A auditoria final encontrou ${validation?.gaps?.length||1} janela(s) ainda livres.`};
    const state=read(STATE_KEY,null);if(!state)return{ok:false,reason:'Estado final não encontrado após a consolidação.'};
    const audit=independentAudit(state);
    if(!audit.plannerV4||!audit.fullCapacityValidated)return{ok:false,reason:'As marcas de validação final não foram gravadas corretamente.'};
    const exam=parse(state.examDate||state.adminPersonalization?.examDate||'');
    if(exam&&state.endDate!==dateKey(addDays(exam,-1)))return{ok:false,reason:`O fim do plano ficou em ${state.endDate||'data indefinida'}, mas deveria ser ${dateKey(addDays(exam,-1))}.`};
    state.studyRoutine={...(state.studyRoutine||{}),planningStrategy:{...(state.studyRoutine?.planningStrategy||{}),authoritativeFinalPassVersion:VERSION,authoritativeFinalPass:true,authoritativeEndDate:audit.expectedEnd,authoritativeHoursPerDay:audit.hoursPerDay}};
    state.adminPersonalization={...(state.adminPersonalization||{}),authoritativeFinalPassVersion:VERSION,authoritativeFinalPass:true,authoritativeLastTaskDate:audit.lastTaskDate,authoritativeExpectedEnd:audit.expectedEnd};
    write(STATE_KEY,state);
    return{ok:true,planned,consolidated,audit,validation};
  }

  function run(attempt=0){
    const pending=pendingInfo();if(!pending)return;
    const age=Date.now()-Number(pending.requestedAt||Date.now());
    const funcsReady=typeof window.mpcApplyCapacityFill==='function'&&typeof window.mpcApplyFinalConsolidation==='function';
    // Deixamos os fluxos antigos terminarem/recarregarem. Depois de 5 s, este passe
    // assume autoridade, limpa flags antigas e executa a única saída final válida.
    if((legacyBusy()||!funcsReady)&&age<5000&&attempt<30){setTimeout(()=>run(attempt+1),220);return}
    const result=finalize();
    if(!result.ok){
      if((/carregou|disponível|encontrado/i.test(result.reason||''))&&attempt<40){setTimeout(()=>run(attempt+1),250);return}
      try{sessionStorage.removeItem(PENDING_KEY);sessionStorage.setItem(FAIL_KEY,result.reason||'Falha na auditoria final.')}catch{}
      setTimeout(()=>alert(`A finalização autoritativa foi interrompida: ${result.reason||'erro não identificado'}`),80);return;
    }
    try{sessionStorage.removeItem(PENDING_KEY);sessionStorage.setItem(DONE_KEY,JSON.stringify({audit:result.audit,consolidated:result.consolidated}))}catch{}
    location.reload();
  }

  function statusBox(data){
    const host=$('#adminGenerationStatus')?.parentElement||$('#mpc-sec-gerar');if(!host||$('#mpcAuthoritativeStatus'))return;
    const box=document.createElement('div');box.id='mpcAuthoritativeStatus';box.style.cssText='margin-top:12px;padding:12px 14px;border:1px solid #86cfa7;background:#effbf4;border-radius:10px;color:#175a35;font-weight:800;font-size:.82rem';
    box.textContent=`Auditoria final aprovada: ${data.audit.hoursPerDay||0}h/dia · fim do plano ${String(data.audit.expectedEnd||'').split('-').reverse().join('/')} · último bloco ${String(data.audit.lastTaskDate||'').split('-').reverse().join('/')} · ${data.audit.taskCount||0} blocos.`;host.appendChild(box);
  }
  function showResult(){
    let done=null;try{done=JSON.parse(sessionStorage.getItem(DONE_KEY)||'null')}catch{}if(done){sessionStorage.removeItem(DONE_KEY);statusBox(done);setTimeout(()=>alert(`Cronograma auditado e finalizado. A capacidade diária foi preenchida e o período foi validado até ${String(done.audit?.expectedEnd||'').split('-').reverse().join('/')}. Foram adicionados ${done.consolidated?.added||0} bloco(s) de consolidação para aproveitar as janelas livres.`),260)}
    const fail=sessionStorage.getItem(FAIL_KEY);if(fail){sessionStorage.removeItem(FAIL_KEY);setTimeout(()=>alert(`Falha na auditoria final: ${fail}`),260)}
  }
  function bind(){
    document.addEventListener('click',event=>{if(event.target?.closest?.('#adminGenerateScheduleBtn'))request()},true);
    if(pendingInfo())setTimeout(()=>run(0),900);
    showResult();
  }
  window.mpcRunAuthoritativeFinalPass=()=>{request();run(0)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();