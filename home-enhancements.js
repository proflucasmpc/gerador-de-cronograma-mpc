(()=>{
  const normalize=(v='')=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const search=document.getElementById('catalogSearch');
  const filters=[...document.querySelectorAll('[data-filter]')];
  const products=[...document.querySelectorAll('.product')];
  const status=document.getElementById('filterStatus');
  const catalogShell=document.querySelector('.catalog-shell');
  const catalogGroups={
    matematica:{title:'Matemática para concursos',note:'Cursos, simulados e prática orientada'},
    estrategia:{title:'Estratégia e métodos de estudo',note:'Organização, tecnologia e decisões de prova'},
    portugues:{title:'Português para concursos',note:'Conteúdos complementares para sua preparação'}
  };
  const badges={
    '/academia-da-matematica':'Recomendado',
    '/80-simulados':'Mais vendido',
    '/combo-matematica':'Combo',
    '/como-passar-em-concursos':'Gratuito',
    '/portugues-para-concursos':'Curso completo'
  };
  if(catalogShell&&products.length){
    const rows=document.createElement('div');rows.className='catalog-rows';
    Object.entries(catalogGroups).forEach(([key,group])=>{
      const items=products.filter(product=>product.dataset.category===key);if(!items.length)return;
      const row=document.createElement('section');row.className='catalog-row';row.dataset.category=key;
      const heading=document.createElement('div');heading.className='catalog-row-title';heading.innerHTML=`<h3>${group.title}</h3><span>${group.note}</span>`;
      const railShell=document.createElement('div');railShell.className='catalog-rail-shell';
      const prev=document.createElement('button');prev.className='catalog-control prev';prev.type='button';prev.setAttribute('aria-label',`Ver itens anteriores em ${group.title}`);prev.textContent='‹';
      const rail=document.createElement('div');rail.className='catalog-grid';
      const next=document.createElement('button');next.className='catalog-control next';next.type='button';next.setAttribute('aria-label',`Ver mais itens em ${group.title}`);next.textContent='›';
      items.forEach(product=>{const path=new URL(product.href,location.href).pathname;const badge=badges[path];if(badge)product.dataset.badge=badge;if(['/80-simulados','/como-passar-em-concursos','/portugues-para-concursos'].includes(path)||product.querySelector('img[src*="combo-portugues"]'))product.dataset.entry='Comece por aqui';rail.append(product);});
      railShell.append(prev,rail,next);row.append(heading,railShell);rows.append(row);
    });
    catalogShell.replaceChildren(rows);
  }
  let category='todos';
  const applyFilter=()=>{
    const term=normalize(search?.value||'').trim();let count=0;
    products.forEach(product=>{const byCat=category==='todos'||product.dataset.category===category;const byText=!term||normalize(product.textContent).includes(term);const show=byCat&&byText;product.classList.toggle('is-hidden',!show);if(show)count++;});
    document.querySelectorAll('.catalog-row').forEach(row=>{row.hidden=![...row.querySelectorAll('.product')].some(product=>!product.classList.contains('is-hidden'));});
    if(status)status.textContent=`${count} material${count===1?'':'is'} encontrado${count===1?'':'s'}.`;
    requestAnimationFrame(()=>document.querySelectorAll('.catalog-grid').forEach(rail=>rail.dispatchEvent(new Event('scroll'))));
  };
  filters.forEach(btn=>btn.addEventListener('click',()=>{category=btn.dataset.filter;filters.forEach(b=>b.classList.toggle('is-active',b===btn));applyFilter();}));
  search?.addEventListener('input',applyFilter);
  document.querySelectorAll('.catalog-row').forEach(row=>{
    const rail=row.querySelector('.catalog-grid'),prev=row.querySelector('.catalog-control.prev'),next=row.querySelector('.catalog-control.next');if(!rail||!prev||!next)return;
    const update=()=>{const max=Math.max(0,rail.scrollWidth-rail.clientWidth);prev.disabled=rail.scrollLeft<8;next.disabled=max<=8||rail.scrollLeft>=max-8;row.classList.toggle('is-at-end',next.disabled);};
    const move=dir=>rail.scrollBy({left:dir*Math.max(260,rail.clientWidth*.78),behavior:'smooth'});
    prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));rail.addEventListener('scroll',update,{passive:true});addEventListener('resize',update,{passive:true});requestAnimationFrame(update);
  });
  applyFilter();
  const modal=document.getElementById('videoModal'),frame=document.getElementById('videoFrame');
  document.querySelectorAll('[data-video]').forEach(btn=>btn.addEventListener('click',()=>{frame.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${btn.dataset.video}?autoplay=1" title="Depoimento em vídeo" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;modal.showModal();}));
  const close=()=>{if(modal?.open)modal.close();if(frame)frame.innerHTML='';};
  document.querySelector('.modal-close')?.addEventListener('click',close);modal?.addEventListener('click',e=>{if(e.target===modal)close();});modal?.addEventListener('close',()=>{if(frame)frame.innerHTML='';});
  const cookie=document.getElementById('cookieLite');if(cookie){const key='mpc_privacy_notice';if(localStorage.getItem(key)==='ok')cookie.classList.add('hidden');cookie.querySelector('button')?.addEventListener('click',()=>{localStorage.setItem(key,'ok');cookie.classList.add('hidden');});}
  document.querySelectorAll('.mobile-menu a').forEach(link=>link.addEventListener('click',()=>link.closest('details')?.removeAttribute('open')));
  document.querySelectorAll('a[href]').forEach(link=>{const href=link.getAttribute('href')?.trim();if(!href)return;try{const url=new URL(href,location.href);if(url.origin!==location.origin){link.target='_blank';link.rel='noopener noreferrer';}else{link.removeAttribute('target');}}catch{}});
  const contestGrid=document.getElementById('openContestsGrid');
  if(contestGrid){
    const today=new Date();today.setHours(0,0,0,0);
    contestGrid.querySelectorAll('[data-deadline]').forEach(card=>{const deadline=new Date(`${card.dataset.deadline}T23:59:59-03:00`);if(today>deadline)card.remove();});
    if(!contestGrid.children.length){contestGrid.hidden=true;document.getElementById('openContestsEmpty')?.removeAttribute('hidden');}
  }

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
