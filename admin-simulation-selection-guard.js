(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const DAY_NAMES=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

  function selected(){return $$('#adminSimulationWeekdays input[data-weekday]:checked')}
  function fullSimulation(){return ($('#adminSimulationType')?.value||'full')!=='subject'}
  function occurrenceMode(){return $('#adminSimulationMode')?.value==='weekday_occurrence'}
  function dispatch(input){input?.dispatchEvent(new Event('change',{bubbles:true}))}

  function singleFullDay(preferSunday=true){
    if(!occurrenceMode()||!fullSimulation())return false;
    const checked=selected();
    if(checked.length<=1)return false;
    const keep=(preferSunday&&checked.find(input=>Number(input.value)===6))||checked[0];
    $$('#adminSimulationWeekdays input[data-weekday]').forEach(input=>{input.checked=input===keep});
    const all=$('#adminSimulationAllWeekdays');if(all)all.checked=false;
    dispatch(keep);
    return true;
  }

  function updateAllDaysControl(){
    const all=$('#adminSimulationAllWeekdays');
    const label=all?.closest('label');
    if(!all||!label)return;
    const hide=occurrenceMode()&&fullSimulation();
    label.hidden=hide;
    if(hide)all.checked=false;
  }

  function addPreset(){
    if($('#mpcSundayFortnightPreset'))return;
    const field=$('#adminSimulationWeekdayField');if(!field)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='mpcSundayFortnightPreset';
    btn.className='btn btn-secondary btn-small';
    btn.style.marginTop='10px';
    btn.textContent='Usar domingo quinzenal';
    btn.addEventListener('click',()=>{
      const enabled=$('#adminSimulationEnabled');if(enabled&&!enabled.checked){enabled.checked=true;dispatch(enabled)}
      const mode=$('#adminSimulationMode');if(mode){mode.value='weekday_occurrence';dispatch(mode)}
      const interval=$('#adminSimulationInterval');if(interval){interval.value='2';dispatch(interval)}
      const type=$('#adminSimulationType');if(type&&type.value!=='subject'){type.value='full';dispatch(type)}
      $$('#adminSimulationWeekdays input[data-weekday]').forEach(input=>{input.checked=Number(input.value)===6});
      const sunday=$('#adminSimulationWeekdays input[data-weekday][value="6"]');dispatch(sunday);
      const all=$('#adminSimulationAllWeekdays');if(all)all.checked=false;
      updateAllDaysControl();
      alert('Configuração aplicada: simulado completo somente aos domingos, a cada 2 semanas.');
    });
    field.appendChild(btn);
  }

  function normalizeExisting(){
    updateAllDaysControl();
    if(singleFullDay(true)){
      const warning=document.createElement('div');
      warning.style.cssText='margin-top:8px;padding:9px 11px;border-radius:9px;background:#fff3cd;color:#664d03;font-weight:750;font-size:.8rem;';
      warning.textContent='A configuração anterior tinha vários dias marcados para simulado completo. Para evitar vários simulados na mesma semana, o sistema manteve apenas um dia (priorizando Domingo quando estava marcado).';
      ($('#adminSimulationWeekdayField')||$('#adminSimulationFields'))?.appendChild(warning);
    }
  }

  function bind(){
    addPreset();
    normalizeExisting();
    document.addEventListener('change',event=>{
      const target=event.target;
      if(target?.matches?.('#adminSimulationMode,#adminSimulationType')){
        updateAllDaysControl();
        setTimeout(()=>singleFullDay(true),0);
      }
      if(target?.matches?.('#adminSimulationWeekdays input[data-weekday]')&&occurrenceMode()&&fullSimulation()&&target.checked){
        $$('#adminSimulationWeekdays input[data-weekday]').forEach(input=>{if(input!==target)input.checked=false});
        const all=$('#adminSimulationAllWeekdays');if(all)all.checked=false;
      }
      if(target?.matches?.('#adminSimulationAllWeekdays')&&occurrenceMode()&&fullSimulation()&&target.checked){
        target.checked=false;
        alert('Para simulado completo, escolha apenas um dia da semana. Use “Domingo quinzenal” se esse for o objetivo.');
      }
    },true);

    document.addEventListener('click',event=>{
      if(!event.target?.closest?.('#adminGenerateScheduleBtn'))return;
      if(!occurrenceMode()||!fullSimulation())return;
      const checked=selected();
      if(checked.length===1)return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      if(!checked.length)alert('Escolha um dia da semana para o simulado completo.');
      else alert(`Há ${checked.length} dias marcados para simulado completo (${checked.map(input=>DAY_NAMES[Number(input.value)]).join(', ')}). Para evitar dezenas de simulados indevidos, escolha apenas um dia.`);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();