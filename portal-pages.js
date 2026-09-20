(()=>{
  const body=document.body;
  if(!body)return;
  body.classList.add('portal-page');
  const path=location.pathname.replace(/\/$/,'')||'/';
  if(path==='/cronograma-de-estudos-para-concurso')body.classList.add('portal-commercial');
  const pageTitle=(document.querySelector('h1')?.textContent||document.title).trim();
  const wa='https://wa.me/5511960189699?text='+encodeURIComponent('Olá Professor Lucas, quero um cronograma de estudos personalizado.');
  const links=[
    ['Início','/'],['Matemática','/academia-da-matematica'],['Cursos','/#cursos'],['Materiais','/#materiais'],
    ['Radar de Concursos','https://radar.lucasmpc.com.br/'],['Cronograma','/cronograma-de-estudos-para-concurso'],['Guias','/guias-de-estudo-para-concursos']
  ];
  const header=document.querySelector('header.top');
  if(header){
    header.outerHTML=`<header class="portal-header"><div class="portal-container portal-header__inner"><a class="portal-brand" href="/" aria-label="Prof. Lucas MPC — início"><img src="/assets/brand/mpc-mark.svg" alt="" width="42" height="42"><span>PROF. LUCAS<strong>MPC Educação</strong></span></a><button class="portal-menu" type="button" aria-expanded="false" aria-controls="portal-nav" aria-label="Abrir menu">☰</button><nav class="portal-nav" id="portal-nav" aria-label="Navegação principal">${links.map(([label,url])=>`<a href="${url}"${path===url?' aria-current="page"':''}>${label}</a>`).join('')}<a class="portal-nav__cta" href="${wa}">WHATSAPP</a></nav></div></header>`;
  }
  const hero=document.querySelector('.hero');
  if(hero){
    hero.insertAdjacentHTML('beforebegin',`<nav class="portal-breadcrumb" aria-label="Navegação estrutural"><div class="portal-container portal-breadcrumb__inner"><a href="/">Início</a><span aria-hidden="true">›</span><a href="/guias-de-estudo-para-concursos">Guias</a><span aria-hidden="true">›</span><strong>${pageTitle}</strong></div></nav>`);
  }
  const oldFooter=document.querySelector('footer');
  if(oldFooter){
    oldFooter.outerHTML=`<footer class="portal-footer"><div class="portal-container"><div class="portal-footer__grid"><div><div class="portal-footer__brand">Prof. Lucas MPC</div><p>Matemática, estratégia e mentoria de estudos para concursos públicos.</p></div><div><h2>Estude</h2><nav><a href="/academia-da-matematica">Academia da Matemática</a><a href="/cronograma-de-estudos-para-concurso">Cronograma personalizado</a><a href="/guias-de-estudo-para-concursos">Guias de estudo</a></nav></div><div><h2>Explore</h2><nav><a href="https://radar.lucasmpc.com.br/">Radar de Concursos</a><a href="/#materiais">Materiais</a><a href="/#gratuitos">Conteúdo gratuito</a></nav></div><div><h2>Institucional</h2><nav><a href="/">Portal Lucas MPC</a><a href="/politica-de-privacidade">Política de Privacidade</a><a href="/termos-de-uso">Termos de Uso</a></nav></div></div><div class="portal-footer__bottom">© Prof. Lucas MPC · Conteúdo educacional para concursos públicos.</div></div></footer>`;
  }
  const menu=document.querySelector('.portal-menu');
  const nav=document.querySelector('.portal-nav');
  menu?.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰';});
  nav?.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');if(menu)menu.textContent='☰';}});
  document.querySelectorAll('a[href]').forEach(link=>{
    const href=link.getAttribute('href')?.trim();
    if(!href||href.startsWith('#')||href.startsWith('javascript:'))return;
    link.target='_blank';
    link.rel='noopener noreferrer';
  });
})();
