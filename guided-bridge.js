(()=>{
  'use strict';
  const KEY='geradorCronogramaMpcData';
  const params=new URLSearchParams(location.search);
  if(params.get('admin')==='1') return;
  if(location.pathname!=='/' && !/\/index\.html$/.test(location.pathname)) return;
  let moved=false;
  function hasAccess(){try{return Boolean(JSON.parse(localStorage.getItem(KEY)||'{}').registered)}catch{return false}}
  function check(){
    if(moved||document.body?.classList.contains('admin-view')) return;
    if(hasAccess()){moved=true;location.replace('/area-usuario.html')}
  }
  setTimeout(check,80);
  const timer=setInterval(()=>{if(moved){clearInterval(timer);return}check()},350);
})();
