(()=>{
  'use strict';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const VERSION=1;
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};

  function apply(){
    const state=read(STATE_KEY,null),draft=read(DRAFT_KEY,null);
    if(!state||!draft||!state?.adminPersonalization?.packageImportVersion)return false;
    if(Number(state?.adminPersonalization?.packageStyleCompatVersion)>=VERSION)return false;

    // Os pacotes v1 foram criados como auxiliares do editor administrativo.
    // Eles não devem trocar o formato visual já aprovado do produto para Semanal.
    // Checklist é o formato seguro/padrão para os cronogramas personalizados importados.
    const importedWeekly=draft.scheduleStyle==='weekly'&&(state.scheduleStyle==='weekly'||!state.scheduleStyle);
    if(importedWeekly){
      draft.scheduleStyle='checklist';
      state.scheduleStyle='checklist';
    }
    state.adminPersonalization={...(state.adminPersonalization||{}),packageStyleCompatVersion:VERSION,packageStylePreservedAsChecklist:Boolean(importedWeekly)};
    write(DRAFT_KEY,draft);write(STATE_KEY,state);
    if(importedWeekly){
      try{sessionStorage.setItem('mpcPackageStyleCompatMessageV1','1')}catch{}
      location.reload();
      return true;
    }
    return false;
  }

  function message(){
    try{
      if(sessionStorage.getItem('mpcPackageStyleCompatMessageV1')!=='1')return;
      sessionStorage.removeItem('mpcPackageStyleCompatMessageV1');
      setTimeout(()=>alert('Formato preservado: o pacote importado foi mantido como Checklist de estudos. Nenhuma regra do Planejador Final foi alterada.'),320);
    }catch{}
  }

  function init(){message();setTimeout(apply,80)}
  window.mpcApplyPackageStyleCompatibility=apply;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();