(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const $=(s,r=document)=>r.querySelector(s);
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  let declaredHours='';

  function rememberDeclaredHours(){
    const input=$('#adminHoursPerDay');
    if(input&&String(input.value||'').trim())declaredHours=String(input.value).trim();
  }

  function restoreDeclaredHoursBeforeGeneration(){
    if(!declaredHours)return;
    const input=$('#adminHoursPerDay');
    if(!input)return;
    const current=String(input.value||'').trim();
    if(current===declaredHours)return;
    input.value=declaredHours;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function plannerReady(){
    const state=read(STATE_KEY,{})||{};
    const strategy=state?.studyRoutine?.planningStrategy||{};
    return Boolean(strategy.singleFinalPlanner)&&Number(strategy.plannerVersion)===4;
  }

  function isCreatePageButton(target){
    return target?.closest?.('#publicPageBtn,#exportPublicPageBtn');
  }

  function guardNewPublication(event){
    const button=isCreatePageButton(event.target);
    if(!button)return;
    if(plannerReady())return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    alert('Antes de criar a página do aluno, gere o cronograma novamente e aguarde a confirmação do Planejador Final V4. Isso garante que a página use toda a disponibilidade configurada e não publique uma distribuição intermediária.');
  }

  function capacityHint(){
    const routine=read(ROUTINE_KEY,null),input=$('#adminHoursPerDay');
    if(!routine||!input||routine.mode==='continuous')return;
    const windows=routine.mode==='12x36'?[...(routine.workWindows||[]),...(routine.offWindows||[])]:routine.windows||[];
    const sum=list=>(list||[]).reduce((total,w)=>total+(Number(w.duration)||0),0);
    const configured=routine.mode==='12x36'?Math.max(sum(routine.workWindows),sum(routine.offWindows)):sum(windows);
    const declared=Math.round((Number(input.value)||0)*60);
    if(declared>0&&configured>0&&declared!==configured){
      const note=document.querySelector('#mpcRoutineCapacity');
      if(note&&!note.querySelector('.mpc-capacity-source-warning')){
        const div=document.createElement('div');
        div.className='mpc-capacity-source-warning';
        div.style.cssText='margin-top:8px;font-weight:800;color:#9a5a00';
        div.textContent=`Atenção: a carga diária informada é ${Math.round(declared/6)/10}h, enquanto as janelas somam ${Math.round(configured/6)/10}h. O gerador respeitará as janelas reais sem alterar silenciosamente a carga informada.`;
        note.appendChild(div);
      }
    }
  }

  function bind(){
    document.addEventListener('pointerdown',event=>{if(event.target?.closest?.('#adminGenerateScheduleBtn'))rememberDeclaredHours()},true);
    document.addEventListener('mousedown',event=>{if(event.target?.closest?.('#adminGenerateScheduleBtn'))rememberDeclaredHours()},true);
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#adminGenerateScheduleBtn'))restoreDeclaredHoursBeforeGeneration();
      guardNewPublication(event);
    },true);
    setTimeout(capacityHint,300);
    document.addEventListener('change',event=>{if(event.target?.closest?.('#adminHoursPerDay,#mpcRoutineBuilder'))setTimeout(capacityHint,50)},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();