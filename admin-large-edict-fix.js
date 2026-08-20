(()=>{
  'use strict';

  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let restoring=false;

  function splitMicrotopics(value=''){
    return String(value)
      .replace(/\r/g,'\n')
      .replace(/[•▪◦]/g,'\n')
      .replace(/\s*;\s*/g,'\n')
      .split(/\n+/)
      .map(line=>line.trim())
      .filter(line=>line.length>=2);
  }

  function packMicrotopics(value=''){
    const topics=splitMicrotopics(value);
    if(topics.length<2)return String(value||'');
    const packed=[];
    for(let i=0;i<topics.length;i+=2)packed.push(topics.slice(i,i+2).join(' · '));
    return packed.join('\n');
  }

  function dispatchInput(field){
    field.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function saveDraftSnapshot(){
    try{return localStorage.getItem(DRAFT_KEY)}catch{return null}
  }

  function restoreDraftSnapshot(snapshot){
    if(snapshot===null)return;
    try{localStorage.setItem(DRAFT_KEY,snapshot)}catch{}
  }

  function withPackedMicrotopics(){
    if(restoring)return null;
    const fields=$$('#adminSubjectsList .admin-subject-topics');
    if(!fields.length)return null;
    const originals=fields.map(field=>field.value);
    const draftSnapshot=saveDraftSnapshot();
    let changed=false;

    fields.forEach(field=>{
      const packed=packMicrotopics(field.value);
      if(packed!==field.value){
        field.value=packed;
        dispatchInput(field);
        changed=true;
      }
    });

    if(!changed)return null;
    return {fields,originals,draftSnapshot};
  }

  function restoreMicrotopics(ctx){
    if(!ctx)return;
    restoring=true;
    try{
      ctx.fields.forEach((field,index)=>{
        field.value=ctx.originals[index];
        dispatchInput(field);
      });
      restoreDraftSnapshot(ctx.draftSnapshot);
      const note=$('#adminCapacityPreview');
      if(note){
        const current=note.textContent||'';
        const prefix='Edital extenso: o cálculo do Resumo e da geração agrupa até 2 microtópicos por sessão, mantendo o texto original abaixo. ';
        if(!current.startsWith(prefix))note.textContent=prefix+current;
      }
    }finally{
      restoring=false;
    }
  }

  function prepareForCalculation(event){
    const button=event.target.closest?.('#adminRefreshInsightsBtn,#adminGenerateScheduleBtn');
    if(!button)return;
    const ctx=withPackedMicrotopics();
    if(!ctx)return;
    // O cálculo-base é síncrono. Restauramos o edital original no próximo ciclo,
    // antes da redistribuição de rotina (que ocorre depois da geração).
    setTimeout(()=>restoreMicrotopics(ctx),0);
  }

  function addInfo(){
    const card=$('#adminInsightsCard');
    if(!card||$('#mpcLargeEdictInfo'))return;
    const info=document.createElement('div');
    info.id='mpcLargeEdictInfo';
    info.className='admin-rule-box';
    info.style.marginTop='12px';
    info.innerHTML='<strong>Compatibilidade com editais extensos</strong><span>Microtópicos continuam salvos individualmente. Para calcular e gerar, o sistema pode combinar até 2 microtópicos consecutivos em uma mesma sessão, evitando que cada linha do edital vire uma sessão inteira.</span>';
    card.appendChild(info);
  }

  function init(){
    if(!$('#adminPanel'))return;
    document.addEventListener('click',prepareForCalculation,true);
    addInfo();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();