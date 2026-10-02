(()=>{
  'use strict';
  function applyGenericCopy(){
    if(!/^\/plano\//i.test(location.pathname)&&!/^\/exemplo(?:\/|$)/i.test(location.pathname))return;
    const step=document.getElementById('captureRequestStep');
    if(!step)return;
    const rewrite=()=>{
      const title=step.querySelector('h2');
      const message=step.querySelector('.capture-message');
      if(title&&/cronograma feito para você|continue visualizando/i.test(title.textContent||''))title.textContent='Quer um cronograma feito para você?';
      if(message&&(/gabriel/i.test(message.textContent||'')||/solicitar um planejamento personalizado/i.test(message.textContent||''))){
        message.textContent='Você conheceu um exemplo de Plano de Estudos MPC. Agora pode solicitar um planejamento personalizado para o seu edital, sua rotina e seu tempo disponível.';
      }
    };
    rewrite();
    new MutationObserver(rewrite).observe(step,{childList:true,subtree:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(applyGenericCopy,80),{once:true});
  else setTimeout(applyGenericCopy,80);
})();
