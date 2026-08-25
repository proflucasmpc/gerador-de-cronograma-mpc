(()=>{
  'use strict';
  const PERSONAL_URL='https://hotm.io/falarcomproflucasmpc';
  const id=location.pathname.match(/\/plano\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()||'';
  const THEMES={
    masculino:{navy:'#0D1B33',navy2:'#18365E',navy3:'#071225',gold:'#D7AE50',cyan:'#24C8FF',purple:'#8A5CFF',blue:'#4C7DFF',green:'#31B77A',teal:'#2DB7B3',orange:'#F0A23B',coral:'#E86C7C',bg:'#F5F7FB',paper:'#FFFFFF',text:'#172033',muted:'#657086',line:'#E4E8F0',track:'#E9EDF4'},
    feminino:{navy:'#3B1636',navy2:'#642B57',navy3:'#271024',gold:'#D4A574',cyan:'#D887A9',purple:'#9B6BC6',blue:'#7A76C8',green:'#4FAF8A',teal:'#55A8A1',orange:'#D89558',coral:'#D9657B',bg:'#FBF7FA',paper:'#FFFFFF',text:'#2E2230',muted:'#776A76',line:'#EADFE7',track:'#F1E9EF'},
    aulacerta:{navy:'#071329',navy2:'#10234A',navy3:'#07111F',gold:'#10B981',cyan:'#315EFB',purple:'#6E8AFF',blue:'#315EFB',green:'#10B981',teal:'#2CB7A0',orange:'#F59E0B',coral:'#EF6A7A',bg:'#F6F8FC',paper:'#FFFFFF',text:'#0D1B2A',muted:'#667085',line:'#E7EBF2',track:'#E8EDF4'}
  };
  const cleanTheme=value=>THEMES[value]?value:'masculino';
  function addStyles(){
    if(document.getElementById('mpcPublicExperienceStyles'))return;
    const style=document.createElement('style');style.id='mpcPublicExperienceStyles';style.textContent=`
      .mpc-personal-fixed{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:120;width:min(920px,calc(100% - 28px));display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:18px;padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,var(--navy3),var(--navy2));color:#fff;border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 48px rgba(7,18,37,.28)}
      .mpc-personal-fixed strong{display:block;font-size:15px;line-height:1.2}.mpc-personal-fixed span{display:block;margin-top:3px;font-size:12px;opacity:.9}.mpc-personal-fixed a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 16px;border-radius:10px;background:var(--gold);color:var(--navy3);font-size:12px;font-weight:950;text-align:center;white-space:nowrap}.mpc-free-explainer{font-weight:900}
      body[data-public-theme="aulacerta"] .mpc-personal-fixed{background:linear-gradient(145deg,#10234A,#315EFB)}
      .final-banner{display:none!important}
      body{padding-bottom:92px!important}
      @media(max-width:880px){.whatsapp-float{display:none!important}.mpc-personal-fixed{bottom:10px;width:calc(100% - 18px);grid-template-columns:1fr;padding:11px 12px;gap:8px}.mpc-personal-fixed span{display:none}.mpc-personal-fixed a{width:100%;min-height:44px;white-space:normal}.shell{padding-bottom:120px!important}.mobile-nav{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;margin:26px 0 12px!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;border-radius:15px!important;box-shadow:0 10px 28px rgba(7,18,37,.16)!important}}
      @media(max-width:520px){.mpc-personal-fixed strong{font-size:13px}.mpc-personal-fixed a{font-size:11px}}
    `;document.head.appendChild(style);
  }
  function applyTheme(theme){const name=cleanTheme(theme),vars=THEMES[name];document.body.dataset.publicTheme=name;Object.entries(vars).forEach(([key,value])=>document.documentElement.style.setProperty(`--${key}`,value))}
  function clarifyGeneratorCtas(){
    const header=document.querySelector('.header-generator-cta');if(header){header.textContent='USAR GERADOR AUTOMÁTICO GRÁTIS';header.title='Ferramenta automática gratuita para você montar seu próprio cronograma'}
    document.querySelectorAll('.hero-actions .btn-free').forEach(btn=>{btn.textContent='✦ TESTAR GERADOR AUTOMÁTICO GRÁTIS';btn.title='Você mesmo monta seu cronograma usando a ferramenta gratuita'});
    const box=document.querySelector('.generator-cta');if(box){const eyebrow=box.querySelector('.eyebrow'),h=box.querySelector('h3'),p=box.querySelector('p'),btn=box.querySelector('.btn-free');if(eyebrow)eyebrow.textContent='Ferramenta automática gratuita';if(h)h.textContent='Quer montar seu próprio cronograma sozinho?';if(p)p.innerHTML='<span class="mpc-free-explainer">O Gerador é uma ferramenta gratuita de autoatendimento.</span> Você informa seus dados e monta o cronograma por conta própria.';if(btn)btn.textContent='USAR O GERADOR AUTOMÁTICO GRÁTIS →'}
  }
  function removeFloatingWhatsapp(){document.querySelectorAll('.whatsapp-float').forEach(el=>el.remove())}
  function removeFinalBanner(){document.querySelectorAll('.final-banner').forEach(el=>el.remove())}
  function fixedCta(){
    let cta=document.getElementById('mpcPersonalScheduleFixed');if(cta)return cta;
    cta=document.createElement('div');cta.id='mpcPersonalScheduleFixed';cta.className='mpc-personal-fixed';
    cta.innerHTML=`<div><strong>Quer um cronograma feito especificamente para você?</strong><span>Serviço personalizado: o Prof. Lucas analisa sua rotina, objetivo e conteúdo da prova.</span></div><a href="${PERSONAL_URL}" target="_blank" rel="noopener">SOLICITAR MEU CRONOGRAMA PERSONALIZADO</a>`;
    document.body.appendChild(cta);return cta;
  }
  function normalizeMobileMenu(){const nav=document.querySelector('.mobile-nav'),shell=document.querySelector('main.shell');if(!nav||!shell)return;if(nav.parentElement!==shell)shell.appendChild(nav)}
  function apply(plan={}){addStyles();applyTheme(plan.publicTheme||'masculino');removeFloatingWhatsapp();removeFinalBanner();clarifyGeneratorCtas();normalizeMobileMenu();fixedCta()}
  window.mpcApplyPublicExperience=apply;
  async function planData(){if(!id)return{};try{const r=await fetch(`/api/plans?id=${encodeURIComponent(id)}&_=${Date.now()}`,{cache:'no-store'});return r.ok?await r.json():{}}catch{return{}}}
  async function init(){addStyles();const planPromise=planData();let tries=0;const timer=setInterval(async()=>{if(document.querySelector('.hero')){clearInterval(timer);apply(await planPromise)}else if(++tries>100)clearInterval(timer)},80)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();