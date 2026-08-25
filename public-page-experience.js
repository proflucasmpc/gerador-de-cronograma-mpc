(()=>{
  'use strict';
  const PERSONAL_URL='https://hotm.io/falarcomproflucasmpc';
  const THEMES={
    masculino:{
      navy:'#0D1B33',navy2:'#18365E',navy3:'#071225',gold:'#D7AE50',cyan:'#24C8FF',purple:'#8A5CFF',blue:'#4C7DFF',green:'#31B77A',teal:'#2DB7B3',orange:'#F0A23B',coral:'#E86C7C',bg:'#F5F7FB',paper:'#FFFFFF',text:'#172033',muted:'#657086',line:'#E4E8F0',track:'#E9EDF4'
    },
    feminino:{
      navy:'#3B1636',navy2:'#642B57',navy3:'#271024',gold:'#D4A574',cyan:'#D887A9',purple:'#9B6BC6',blue:'#7A76C8',green:'#4FAF8A',teal:'#55A8A1',orange:'#D89558',coral:'#D9657B',bg:'#FBF7FA',paper:'#FFFFFF',text:'#2E2230',muted:'#776A76',line:'#EADFE7',track:'#F1E9EF'
    },
    aulacerta:{
      navy:'#071329',navy2:'#10234A',navy3:'#07111F',gold:'#10B981',cyan:'#315EFB',purple:'#6E8AFF',blue:'#315EFB',green:'#10B981',teal:'#2CB7A0',orange:'#F59E0B',coral:'#EF6A7A',bg:'#F6F8FC',paper:'#FFFFFF',text:'#0D1B2A',muted:'#667085',line:'#E7EBF2',track:'#E8EDF4'
    }
  };
  const cleanTheme=value=>THEMES[value]?value:'masculino';
  function addStyles(){
    if(document.getElementById('mpcPublicExperienceStyles'))return;
    const style=document.createElement('style');style.id='mpcPublicExperienceStyles';style.textContent=`
      .mpc-personal-cta{margin:30px 0 4px;padding:30px 32px;border-radius:18px;background:linear-gradient(135deg,var(--navy3),var(--navy2));color:#fff;border-bottom:5px solid var(--gold);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center;box-shadow:0 18px 42px rgba(7,18,37,.13)}
      .mpc-personal-cta .mpc-personal-kicker{display:block;color:var(--gold);font-size:11px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px}
      .mpc-personal-cta h2{font-family:Georgia,"Times New Roman",serif;font-size:30px;line-height:1.08;margin:0 0 8px;color:#fff}
      .mpc-personal-cta p{margin:0;max-width:720px;color:#fff;font-size:14px;opacity:.94}
      .mpc-personal-cta a{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:13px 18px;border-radius:10px;background:var(--gold);color:var(--navy3);font-weight:950;text-align:center;white-space:nowrap;box-shadow:0 9px 22px rgba(0,0,0,.14)}
      .mpc-free-explainer{font-weight:900}
      body[data-public-theme="feminino"] .hero,body[data-public-theme="feminino"] .final-banner,body[data-public-theme="feminino"] .mpc-personal-cta{background:linear-gradient(135deg,var(--navy3),var(--navy2))}
      body[data-public-theme="aulacerta"] .hero,body[data-public-theme="aulacerta"] .final-banner,body[data-public-theme="aulacerta"] .mpc-personal-cta{background:linear-gradient(145deg,#10234A,#315EFB)}
      body[data-public-theme="aulacerta"] .header-generator-cta,body[data-public-theme="aulacerta"] .btn-free{background:linear-gradient(135deg,#315EFB,#173BC0);border-color:#6E8AFF}
      body[data-public-theme="aulacerta"] .mentoria-fixed{background:#10B981;border-bottom-color:#07865E}
      body[data-public-theme="aulacerta"] .mentoria-kicker{color:#10B981}
      @media(max-width:880px){
        body{padding-bottom:0!important}
        .shell{padding-bottom:28px!important}
        .whatsapp-float{display:none!important}
        .mobile-nav{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;margin:26px 0 12px!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;border-radius:15px!important;box-shadow:0 10px 28px rgba(7,18,37,.16)!important}
        .mpc-personal-cta{grid-template-columns:1fr;padding:22px 18px;margin-top:12px}
        .mpc-personal-cta h2{font-size:26px}.mpc-personal-cta a{width:100%;white-space:normal}
      }
    `;document.head.appendChild(style);
  }
  function applyTheme(theme){
    const name=cleanTheme(theme),vars=THEMES[name];
    document.body.dataset.publicTheme=name;
    const root=document.documentElement;
    Object.entries(vars).forEach(([key,value])=>root.style.setProperty(`--${key}`,value));
  }
  function clarifyGeneratorCtas(){
    const header=document.querySelector('.header-generator-cta');
    if(header){header.textContent='USAR GERADOR AUTOMÁTICO GRÁTIS';header.title='Ferramenta automática gratuita para montar seu próprio cronograma'}
    document.querySelectorAll('.hero-actions .btn-free').forEach(btn=>{btn.textContent='✦ TESTAR GERADOR AUTOMÁTICO GRÁTIS';btn.title='Você mesmo monta seu cronograma usando a ferramenta gratuita'});
    const box=document.querySelector('.generator-cta');
    if(box){
      const eyebrow=box.querySelector('.eyebrow'),h=box.querySelector('h3'),p=box.querySelector('p'),btn=box.querySelector('.btn-free');
      if(eyebrow)eyebrow.textContent='Ferramenta automática gratuita';
      if(h)h.textContent='Quer montar seu próprio cronograma sozinho?';
      if(p)p.innerHTML='<span class="mpc-free-explainer">O Gerador é uma ferramenta gratuita.</span> Você informa seus dados e monta o cronograma por conta própria.';
      if(btn)btn.textContent='USAR O GERADOR AUTOMÁTICO GRÁTIS →';
    }
  }
  function removeFloatingWhatsapp(){document.querySelectorAll('.whatsapp-float').forEach(el=>el.remove())}
  function personalCta(){
    let cta=document.getElementById('mpcPersonalScheduleCta');if(cta)return cta;
    const shell=document.querySelector('main.shell');if(!shell)return null;
    cta=document.createElement('section');cta.id='mpcPersonalScheduleCta';cta.className='mpc-personal-cta';
    cta.innerHTML=`<div><span class="mpc-personal-kicker">Serviço personalizado</span><h2>Quer um cronograma feito especificamente para você?</h2><p>Nesse serviço, o Prof. Lucas analisa seu objetivo, sua rotina, sua disponibilidade e o conteúdo da prova para preparar o seu planejamento personalizado.</p></div><a href="${PERSONAL_URL}" target="_blank" rel="noopener">SOLICITAR MEU CRONOGRAMA PERSONALIZADO</a>`;
    shell.appendChild(cta);return cta;
  }
  function moveMobileMenuAboveCta(){
    const nav=document.querySelector('.mobile-nav'),cta=personalCta(),shell=document.querySelector('main.shell');if(!nav||!cta||!shell)return;
    shell.insertBefore(nav,cta);
  }
  function apply(plan={}){
    addStyles();applyTheme(plan.publicTheme||plan.pageTheme||'masculino');removeFloatingWhatsapp();clarifyGeneratorCtas();personalCta();moveMobileMenuAboveCta();
  }
  window.mpcApplyPublicExperience=apply;
  function init(){addStyles();let tries=0;const timer=setInterval(()=>{if(document.querySelector('.hero')){clearInterval(timer);apply({})}else if(++tries>80)clearInterval(timer)},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();