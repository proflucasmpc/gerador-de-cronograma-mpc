(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const FLAG='mpcFinalPipelineAuthorityV1';
  if(window[FLAG])return;window[FLAG]=true;

  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};

  function isLegacyRoutineTimer(fn,delay){
    if(Number(delay)!==80||typeof fn!=='function')return false;
    const source=Function.prototype.toString.call(fn);
    return /transformGeneratedSchedule\s*\(/.test(source)&&/mpcRoutineJustApplied/.test(source);
  }

  function protectGenerationClick(event){
    if(!event.target?.closest?.('#adminGenerateScheduleBtn'))return;
    const original=window.setTimeout;
    if(original.__mpcAuthorityWrapped)return;

    function guarded(fn,delay,...args){
      // admin-study-routine.js ainda contém o antigo redistribuidor que roda 80 ms
      // depois da geração. Ele substitui state.tasks depois do Planejador Final V4 e
      // remove a consolidação que preenche as janelas até a prova. Bloqueamos somente
      // esse timer legado; todos os outros timers e o construtor de rotina continuam.
      if(isLegacyRoutineTimer(fn,delay))return -1;
      return original.call(window,fn,delay,...args);
    }
    guarded.__mpcAuthorityWrapped=true;
    window.setTimeout=guarded;

    // Restaura imediatamente após todos os listeners do clique terem registrado seus
    // timers. O timer legado já terá sido descartado, sem interferir no restante da UI.
    original.call(window,()=>{if(window.setTimeout===guarded)window.setTimeout=original},0);
  }

  function auditState(){
    const state=read(STATE_KEY,null);if(!state?.tasks?.length)return;
    const strategy=state?.studyRoutine?.planningStrategy||{};
    // Se o antigo transformador já rodou, ele deixa planningStrategy sem a marca V4.
    // Não alteramos tarefas aqui; apenas expomos o diagnóstico para os guards atuais.
    window.mpcFinalPipelineAudit={
      plannerV4:Boolean(strategy.singleFinalPlanner)&&Number(strategy.plannerVersion)===4,
      fullCapacityValidated:Boolean(strategy.fullCapacityValidated),
      finalConsolidation:Boolean(strategy.finalConsolidation),
      taskCount:state.tasks.length,
      endDate:state.endDate||state.adminPersonalization?.endDate||''
    };
  }

  function bind(){
    document.addEventListener('click',protectGenerationClick,true);
    auditState();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)auditState()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();