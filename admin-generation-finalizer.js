(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const MESSAGE_KEY='mpcGenerationFinalizedV1';
  const $=(s,r=document)=>r.querySelector(s);
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};

  function plannerReady(){
    const state=read(STATE_KEY,{})||{};
    const strategy=state?.studyRoutine?.planningStrategy||{};
    return Boolean(strategy.singleFinalPlanner)&&Number(strategy.plannerVersion)===4;
  }

  function finalizeGenerated(){
    const status=$('#adminGenerationStatus');
    if(!status?.classList.contains('success'))return false;

    // A geração-base acabou de recriar as tarefas. Portanto, o normalizador precisa
    // rodar AGORA (pós-geração), antes do Planejador Final, para retirar datas
    // indisponíveis recém-recriadas e reconstruir simulados/revisões corretamente.
    if(typeof window.mpcNormalizeFinalPlannerInput==='function'){
      window.mpcNormalizeFinalPlannerInput();
    }

    if(plannerReady())return true;
    if(typeof window.mpcApplyCapacityFill!=='function')return false;
    const result=window.mpcApplyCapacityFill({silent:true});
    if(!result?.ok){
      try{sessionStorage.setItem('mpcCapacityFillFailureV4',result?.reason||'O Planejador Final não conseguiu concluir a distribuição.')}catch{}
      return false;
    }
    try{
      sessionStorage.removeItem('mpcCapacityFillPendingV4');
      sessionStorage.setItem(MESSAGE_KEY,JSON.stringify(result.stats||{}));
    }catch{}
    location.reload();
    return true;
  }

  function bindGenerate(){
    const btn=$('#adminGenerateScheduleBtn');
    if(!btn||btn.dataset.mpcFinalizerBound==='1')return;
    btn.dataset.mpcFinalizerBound='1';
    btn.addEventListener('click',()=>{
      // O gerador-base é síncrono. Rodamos no próximo ciclo, antes do antigo
      // transformador de rotina (80 ms), para que o V4 seja a única saída final.
      setTimeout(()=>{
        finalizeGenerated();
      },0);
    });
  }

  function showMessage(){
    let data=null;
    try{data=JSON.parse(sessionStorage.getItem(MESSAGE_KEY)||'null');sessionStorage.removeItem(MESSAGE_KEY)}catch{}
    if(!data)return;
    setTimeout(()=>alert(`Cronograma finalizado com o Planejador Final V4. ${data.activities||0} atividades foram distribuídas com aproveitamento da disponibilidade e bloco mínimo de ${data.minBlock||15} minutos.`),220);
  }

  function init(){
    bindGenerate();
    setTimeout(bindGenerate,250);
    setTimeout(bindGenerate,800);
    showMessage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();