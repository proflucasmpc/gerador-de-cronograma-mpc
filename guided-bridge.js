(()=>{
  'use strict';
  const KEY='geradorCronogramaMpcData';
  const params=new URLSearchParams(location.search);
  if(params.get('admin')==='1') return;
  if(location.pathname!=='/' && !/\/index\.html$/.test(location.pathname)) return;

  let moved=false;
  function hasAccess(){
    try{return Boolean(JSON.parse(localStorage.getItem(KEY)||'{}').registered)}
    catch{return false}
  }
  function redirectIfAuthorized(){
    if(moved) return true;
    if(hasAccess()){
      moved=true;
      location.replace('/area-usuario.html');
      return true;
    }
    return false;
  }

  // Quando este script é carregado de forma bloqueante no <head>,
  // esta verificação ocorre antes de a página antiga ser desenhada.
  if(redirectIfAuthorized()) return;

  // Mantém o comportamento necessário para novos usuários: depois que o
  // código de acesso for validado na tela inicial, o navegador entra
  // automaticamente na nova área guiada.
  const timer=setInterval(()=>{
    if(moved){clearInterval(timer);return}
    if(document.body?.classList.contains('admin-view')) return;
    redirectIfAuthorized();
  },350);
})();
