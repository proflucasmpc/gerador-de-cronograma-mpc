(()=>{
  const normalize=(v='')=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const search=document.getElementById('catalogSearch');
  const filters=[...document.querySelectorAll('[data-filter]')];
  const products=[...document.querySelectorAll('.product')];
  const status=document.getElementById('filterStatus');
  let category='todos';
  const applyFilter=()=>{
    const term=normalize(search?.value||'').trim();let count=0;
    products.forEach(product=>{const byCat=category==='todos'||product.dataset.category===category;const byText=!term||normalize(product.textContent).includes(term);const show=byCat&&byText;product.classList.toggle('is-hidden',!show);if(show)count++;});
    if(status)status.textContent=`${count} resultado${count===1?'':'s'} no catálogo.`;
  };
  filters.forEach(btn=>btn.addEventListener('click',()=>{category=btn.dataset.filter;filters.forEach(b=>b.classList.toggle('is-active',b===btn));applyFilter();}));
  search?.addEventListener('input',applyFilter);
  const catalogRail=document.querySelector('.catalog-grid'),catalogPrev=document.querySelector('.catalog-control.prev'),catalogNext=document.querySelector('.catalog-control.next');
  if(catalogRail&&catalogPrev&&catalogNext){
    const updateCatalogControls=()=>{const max=catalogRail.scrollWidth-catalogRail.clientWidth;catalogPrev.disabled=catalogRail.scrollLeft<8;catalogNext.disabled=max<=8||catalogRail.scrollLeft>=max-8;};
    const moveCatalog=dir=>catalogRail.scrollBy({left:dir*Math.max(260,catalogRail.clientWidth*.78),behavior:'smooth'});
    catalogPrev.addEventListener('click',()=>moveCatalog(-1));catalogNext.addEventListener('click',()=>moveCatalog(1));catalogRail.addEventListener('scroll',updateCatalogControls,{passive:true});addEventListener('resize',updateCatalogControls,{passive:true});requestAnimationFrame(updateCatalogControls);
  }
  const modal=document.getElementById('videoModal'),frame=document.getElementById('videoFrame');
  document.querySelectorAll('[data-video]').forEach(btn=>btn.addEventListener('click',()=>{frame.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${btn.dataset.video}?autoplay=1" title="Depoimento em vídeo" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;modal.showModal();}));
  const close=()=>{if(modal?.open)modal.close();if(frame)frame.innerHTML='';};
  document.querySelector('.modal-close')?.addEventListener('click',close);modal?.addEventListener('click',e=>{if(e.target===modal)close();});modal?.addEventListener('close',()=>{if(frame)frame.innerHTML='';});
  const cookie=document.getElementById('cookieLite');if(cookie){const key='mpc_privacy_notice';if(localStorage.getItem(key)==='ok')cookie.classList.add('hidden');cookie.querySelector('button')?.addEventListener('click',()=>{localStorage.setItem(key,'ok');cookie.classList.add('hidden');});}
  document.querySelectorAll('.mobile-menu a').forEach(link=>link.addEventListener('click',()=>link.closest('details')?.removeAttribute('open')));
  document.querySelectorAll('a[href]').forEach(link=>{const href=link.getAttribute('href')?.trim();if(!href)return;try{const url=new URL(href,location.href);if(url.origin!==location.origin){link.target='_blank';link.rel='noopener noreferrer';}else{link.removeAttribute('target');}}catch{}});

  // Hotfix 2026-09-23: impede qualquer distorção da foto da seção Sobre.
  const hotfixStyle=document.createElement('style');
  hotfixStyle.textContent=`
    .about>img,
    .about img[src*="prof-lucas-mpc-clean"]{
      display:block!important;
      width:280px!important;
      max-width:100%!important;
      height:auto!important;
      max-height:360px!important;
      aspect-ratio:auto!important;
      object-fit:contain!important;
      object-position:center center!important;
      align-self:center!important;
      justify-self:center!important;
    }
    @media(max-width:900px){
      .about>img,
      .about img[src*="prof-lucas-mpc-clean"]{
        width:min(280px,100%)!important;
        height:auto!important;
        max-height:340px!important;
      }
    }
  `;
  document.head.appendChild(hotfixStyle);
})();
