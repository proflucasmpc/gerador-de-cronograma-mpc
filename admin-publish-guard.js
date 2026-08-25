(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const $=(s,r=document)=>r.querySelector(s);
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  let declaredHours='';
  function rememberDeclaredHours(){const input=$('#adminHoursPerDay');if(input&&String(input.value||'').trim())declaredHours=String(input.value).trim()}
  function restoreDeclaredHoursBeforeGeneration(){if(!declaredHours)return;const input=$('#adminHoursPerDay');if(!input)return;const current=String(input.value||'').trim();if(current===declaredHours)return;input.value=declaredHours;input.dispatchEvent(new Event('change',{bubbles:true}))}
  function plannerReady(){const state=read(STATE_KEY,{})||{},strategy=state?.studyRoutine?.planningStrategy||{};return Boolean(strategy.singleFinalPlanner)&&Number(strategy.plannerVersion)===4}
  function fullCapacityReady(){const state=read(STATE_KEY,{})||{},strategy=state?.studyRoutine?.planningStrategy||{};return Boolean(strategy.fullCapacityValidated)&&Number(strategy.fullCapacityValidationVersion)>=4}
  function hasGeneratedTasks(){const state=read(STATE_KEY,{})||{};return Array.isArray(state.tasks)&&state.tasks.length>0}
  function isCreatePageButton(target){return target?.closest?.('#publicPageBtn,#exportPublicPageBtn')}
  function finalizeExistingSchedule(){
    if(!hasGeneratedTasks())return{ok:false,reason:'O cronograma ainda não possui atividades geradas.'};
    if(!plannerReady()){
      if(typeof window.mpcApplyCapacityFill!=='function')return{ok:false,reason:'O Planejador Final ainda está carregando. Aguarde um instante e tente novamente.'};
      const planned=window.mpcApplyCapacityFill({silent:true})||{ok:false,reason:'Não foi possível finalizar o cronograma.'};if(!planned.ok)return planned;
    }
    if(typeof window.mpcApplyFinalConsolidation!=='function')return{ok:false,reason:'A validação de capacidade ainda está carregando. Aguarde um instante e tente novamente.'};
    const final=window.mpcApplyFinalConsolidation();if(!final?.ok)return final||{ok:false,reason:'Não foi possível preencher toda a capacidade disponível.'};
    return{ok:true,final};
  }
  function guardNewPublication(event){
    const button=isCreatePageButton(event.target);if(!button)return;
    if(plannerReady()&&fullCapacityReady())return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const result=finalizeExistingSchedule();
    if(result.ok){alert('O cronograma foi recalculado e toda a capacidade disponível até a véspera da prova foi validada. A página será recarregada; depois clique em “Criar página” novamente.');location.reload();return}
    alert(result.reason||'Não foi possível concluir a validação final do cronograma.');
  }
  function capacityHint(){
    const routine=read(ROUTINE_KEY,null),input=$('#adminHoursPerDay');if(!routine||!input||routine.mode==='continuous')return;
    const windows=routine.mode==='12x36'?[...(routine.workWindows||[]),...(routine.offWindows||[])]:routine.windows||[];
    const sum=list=>(list||[]).reduce((total,w)=>total+(Number(w.duration)||0),0),configured=routine.mode==='12x36'?Math.max(sum(routine.workWindows),sum(routine.offWindows)):sum(windows),declared=Math.round((Number(input.value)||0)*60);
    if(declared>0&&configured>0&&declared!==configured){const note=document.querySelector('#mpcRoutineCapacity');if(note&&!note.querySelector('.mpc-capacity-source-warning')){const div=document.createElement('div');div.className='mpc-capacity-source-warning';div.style.cssText='margin-top:8px;font-weight:800;color:#9a5a00';div.textContent=`Atenção: a carga diária informada é ${Math.round(declared/6)/10}h, enquanto as janelas somam ${Math.round(configured/6)/10}h. O gerador respeitará as janelas reais sem alterar silenciosamente a carga informada.`;note.appendChild(div)}}
  }
  function bind(){document.addEventListener('pointerdown',event=>{if(event.target?.closest?.('#adminGenerateScheduleBtn'))rememberDeclaredHours()},true);document.addEventListener('mousedown',event=>{if(event.target?.closest?.('#adminGenerateScheduleBtn'))rememberDeclaredHours()},true);document.addEventListener('click',event=>{if(event.target?.closest?.('#adminGenerateScheduleBtn'))restoreDeclaredHoursBeforeGeneration();guardNewPublication(event)},true);setTimeout(capacityHint,300);document.addEventListener('change',event=>{if(event.target?.closest?.('#adminHoursPerDay,#mpcRoutineBuilder'))setTimeout(capacityHint,50)},true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();