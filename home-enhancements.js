(()=>{
  const slides=[...document.querySelectorAll('.hero-slide')],dots=[...document.querySelectorAll('.hero-dots button:not(.hero-toggle)')];
  if(slides.length){
    let active=0,timer,manualPaused=false;
    const show=index=>{active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===active);slide.setAttribute('aria-hidden',i===active?'false':'true');slide.tabIndex=i===active?0:-1});dots.forEach((dot,i)=>{dot.classList.toggle('is-active',i===active);dot.setAttribute('aria-current',i===active?'true':'false')})};
    const play=()=>{clearInterval(timer);if(!manualPaused&&!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(active+1),6500)};
    const restart=()=>{clearInterval(timer);play()};
    document.querySelector('.hero-prev')?.addEventListener('click',()=>{show(active-1);restart()});document.querySelector('.hero-next')?.addEventListener('click',()=>{show(active+1);restart()});dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);restart()}));
    const toggle=document.querySelector('.hero-toggle');toggle?.addEventListener('click',()=>{manualPaused=!manualPaused;toggle.textContent=manualPaused?'▶':'Ⅱ';toggle.setAttribute('aria-label',manualPaused?'Reproduzir destaques':'Pausar destaques');play()});
    const carousel=document.querySelector('.hero-carousel');carousel?.addEventListener('mouseenter',()=>clearInterval(timer));carousel?.addEventListener('mouseleave',play);carousel?.addEventListener('focusin',()=>clearInterval(timer));carousel?.addEventListener('focusout',play);show(0);play();
  }
  const productInfo={
    '80-simulados':{tag:'Mais vendido',cat:'matematica',text:'Treine Matemática com simulados organizados para aumentar ritmo e segurança.'},
    'academia-da-matematica':{tag:'Recomendado',cat:'matematica',text:'Formação completa de Matemática com aulas, questões e correções em vídeo.'},
    'como-passar':{tag:'Estratégia',cat:'estrategia',text:'Organize sua preparação e entenda os fundamentos de uma jornada até a prova.'},
    'metodo-ia':{tag:'Tecnologia',cat:'estrategia',text:'Use inteligência artificial para estudar, revisar e planejar com mais eficiência.'},
    'interpretacao':{tag:'Curso',cat:'matematica',text:'Aprenda a transformar enunciados em caminhos claros de resolução.'},
    'manual-do-chute':{tag:'Técnica de prova',cat:'estrategia',text:'Estratégias para decidir melhor quando não souber resolver completamente.'},
    'portugues-para-concursos':{tag:'Curso completo',cat:'portugues',text:'Preparação em Língua Portuguesa para provas e concursos.'},
    'combo-matematica':{tag:'Combo',cat:'matematica',text:'Simulados, questões e interpretação reunidos em uma preparação prática.'},
    'combo-estrategia':{tag:'Combo',cat:'estrategia',text:'Métodos de estudo, IA e técnicas de prova em uma única oferta.'},
    'guias-de-estudo':{tag:'Gratuito',cat:'gratuito',text:'Orientações para edital, rotina, divisão de matérias e cronograma.'}
  };
  const identify=href=>Object.keys(productInfo).find(key=>href.includes(key));
  document.querySelectorAll('.tile').forEach((tile,index)=>{
    const info=productInfo[identify(tile.getAttribute('href')||'')]||{tag:'Conteúdo MPC',cat:'estrategia',text:'Conheça os detalhes e veja como este conteúdo pode ajudar na sua preparação.'};
    const overlay=document.createElement('span');overlay.className='tile-overlay';overlay.innerHTML=`<span>${info.tag}</span><p>${info.text}</p><b>VER DETALHES →</b>`;tile.append(overlay);
    if(index<2||info.tag==='Gratuito'){const badge=document.createElement('span');badge.className='cover-badge';badge.textContent=info.tag;tile.querySelector('.cover')?.append(badge)}
    tile.dataset.analytics='produto';tile.dataset.category=info.cat;tile.dataset.product=tile.querySelector('h3')?.textContent?.trim()||'produto';
  });
  document.querySelectorAll('.rail').forEach((rail,index)=>{
    const shell=document.createElement('div');shell.className='rail-shell';rail.parentNode.insertBefore(shell,rail);shell.append(rail);
    const hint=document.createElement('p');hint.className='rail-hint';hint.textContent='Deslize para ver mais →';shell.parentNode.insertBefore(hint,shell);
    const make=(dir,label)=>{const btn=document.createElement('button');btn.type='button';btn.className=`rail-control ${dir}`;btn.setAttribute('aria-label',label);btn.textContent=dir==='prev'?'‹':'›';btn.addEventListener('click',()=>rail.scrollBy({left:(dir==='next'?1:-1)*Math.max(260,rail.clientWidth*.72),behavior:'smooth'}));return btn};
    const prev=make('prev','Ver itens anteriores'),next=make('next','Ver mais itens');shell.append(prev,next);
    const update=()=>{prev.disabled=rail.scrollLeft<8;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-8};rail.addEventListener('scroll',update,{passive:true});addEventListener('resize',update,{passive:true});requestAnimationFrame(update);
  });
  const search=document.getElementById('catalogSearch'),filters=[...document.querySelectorAll('[data-filter]')],filterStatus=document.getElementById('filterStatus');let selected='todos';
  const applyFilter=()=>{const term=(search?.value||'').toLocaleLowerCase('pt-BR').trim();let count=0;document.querySelectorAll('.tile').forEach(tile=>{const matchesCategory=selected==='todos'||tile.dataset.category===selected;const matchesText=!term||(tile.dataset.product||'').toLocaleLowerCase('pt-BR').includes(term);const show=matchesCategory&&matchesText;tile.classList.toggle('is-filtered',!show);if(show)count++});document.querySelectorAll('.rail').forEach(rail=>rail.closest('.section')?.toggleAttribute('data-no-results',![...rail.querySelectorAll('.tile')].some(tile=>!tile.classList.contains('is-filtered'))));if(filterStatus)filterStatus.textContent=term||selected!=='todos'?`${count} resultado${count===1?'':'s'} na vitrine.`:''};
  filters.forEach(btn=>btn.addEventListener('click',()=>{selected=btn.dataset.filter;filters.forEach(b=>b.classList.toggle('is-active',b===btn));applyFilter()}));search?.addEventListener('input',applyFilter);
  const modal=document.getElementById('videoModal'),frame=document.getElementById('videoFrame');document.querySelectorAll('[data-video]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.video;frame.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1" title="Depoimento em vídeo" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;modal.showModal();track('testimonial_play',{video:id})}));const closeModal=()=>{if(modal?.open)modal.close();if(frame)frame.innerHTML=''};document.querySelector('.modal-close')?.addEventListener('click',closeModal);modal?.addEventListener('click',event=>{if(event.target===modal)closeModal()});modal?.addEventListener('close',()=>{if(frame)frame.innerHTML=''});
  const track=(name,data={})=>{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,...data});window.dispatchEvent(new CustomEvent('mpc:analytics',{detail:{event:name,...data}}))};
  document.addEventListener('click',event=>{const link=event.target.closest('a');if(!link)return;const kind=link.dataset.analytics||(link.href.includes('wa.me')?'whatsapp':'navegacao');track('home_click',{tipo:kind,rotulo:link.dataset.product||link.textContent.trim().slice(0,80),destino:link.href})});
  const cookie=document.getElementById('cookieLite');if(cookie){const key='mpc_privacy_notice';if(localStorage.getItem(key)==='ok')cookie.classList.add('hidden');cookie.querySelector('button')?.addEventListener('click',()=>{localStorage.setItem(key,'ok');cookie.classList.add('hidden')})}
  document.querySelectorAll('.mobile-menu a').forEach(link=>link.addEventListener('click',()=>link.closest('details')?.removeAttribute('open')));
  document.querySelectorAll('a[href]').forEach(link=>{
    const href=link.getAttribute('href')?.trim();
    if(!href||href.startsWith('#')||href.startsWith('javascript:'))return;
    link.target='_blank';
    link.rel='noopener noreferrer';
  });
})();
