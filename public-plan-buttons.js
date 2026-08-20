(()=>{
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const id=location.pathname.match(/\/plano\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()||'';
  const STAGE_LABELS={
    estudo_vagas:'Estudo de vagas',
    previsao_orcamentaria:'Previsão orçamentária',
    autorizacao:'Autorização',
    comissao_organizadora:'Comissão organizadora',
    escolha_banca:'Escolha da banca',
    publicacao_edital:'Publicação do edital'
  };
  function addStyles(){
    if(document.getElementById('mpcPublicLayoutStyles'))return;
    const style=document.createElement('style');style.id='mpcPublicLayoutStyles';style.textContent=`
      @media(min-width:1180px){
        .shell{max-width:1320px!important;padding-left:28px!important;padding-right:28px!important}
        .topbar-inner,.mentoria-inner{max-width:1320px!important}
        .hero-grid{grid-template-columns:minmax(0,1.55fr) minmax(310px,.65fr)!important;gap:44px!important;padding:48px 50px!important}
        .hero-sub{max-width:820px!important}
        .today-layout,.raiox-grid{grid-template-columns:minmax(0,1.35fr) minmax(340px,.65fr)!important;gap:20px!important}
        .schedule-wrap{grid-template-columns:220px minmax(0,1fr)!important;gap:20px!important}
        .contents-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
      }
      @media(min-width:1450px){
        .shell,.topbar-inner,.mentoria-inner{max-width:1400px!important}
        .hero-grid{padding-left:56px!important;padding-right:56px!important}
      }
      .mpc-custom-links-section{margin:18px 0 28px}
      .mpc-custom-links-panel{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;display:flex;align-items:center;gap:18px;justify-content:space-between;box-shadow:0 8px 24px rgba(7,18,37,.05)}
      .mpc-custom-links-copy{min-width:170px}.mpc-custom-links-copy strong{display:block;font-family:Georgia,"Times New Roman",serif;color:var(--navy3);font-size:19px}.mpc-custom-links-copy span{display:block;color:var(--muted);font-size:12px;margin-top:3px}
      .mpc-custom-links-actions{display:flex;flex:1;justify-content:flex-end;gap:9px;flex-wrap:wrap}
      .mpc-custom-link{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:10px 15px;border-radius:9px;font-size:12px;font-weight:900;text-decoration:none!important;transition:transform .15s ease,filter .15s ease,box-shadow .15s ease}
      .mpc-custom-link:hover{transform:translateY(-1px);filter:brightness(.98)}
      .mpc-custom-link.primary{background:var(--cyan);color:var(--navy3);box-shadow:0 7px 16px rgba(36,200,255,.16)}
      .mpc-custom-link.navy{background:var(--navy);color:#fff}
      .mpc-custom-link.gold{background:var(--gold);color:var(--navy3)}
      .mpc-custom-link.green{background:var(--green);color:#fff}
      .mpc-custom-link.outline{background:#fff;color:var(--navy);border:1px solid var(--blue)}
      .mpc-pre-edital-badge{font-family:Georgia,"Times New Roman",serif;font-size:31px!important;line-height:1.08!important;margin:14px 0 8px!important;color:#fff}
      @media(max-width:760px){
        .mpc-custom-links-panel{display:block;padding:16px}.mpc-custom-links-copy{margin-bottom:12px}.mpc-custom-links-actions{display:grid;grid-template-columns:1fr;gap:8px}.mpc-custom-link{width:100%;min-height:46px}
        .hero-grid{padding:34px 22px!important}.hero h1{font-size:40px!important}.shell{padding-left:14px!important;padding-right:14px!important}
      }
    `;document.head.appendChild(style);
  }
  function normalize(items){return (Array.isArray(items)?items:[]).filter(x=>x&&x.enabled!==false&&String(x.text||'').trim()&&String(x.url||'').trim()).slice(0,8).map(x=>({text:String(x.text).trim(),url:String(x.url).trim(),style:['primary','navy','gold','green','outline'].includes(x.style)?x.style:'primary'}))}
  function render(items){
    const links=normalize(items);document.getElementById('mpcCustomLinksSection')?.remove();if(!links.length)return;
    const hero=document.getElementById('plano')||document.querySelector('.hero');if(!hero)return;
    const section=document.createElement('section');section.id='mpcCustomLinksSection';section.className='mpc-custom-links-section';
    section.innerHTML=`<div class="mpc-custom-links-panel"><div class="mpc-custom-links-copy"><strong>Acessos rápidos</strong><span>Links selecionados pelo professor para este planejamento.</span></div><div class="mpc-custom-links-actions">${links.map(x=>`<a class="mpc-custom-link ${esc(x.style)}" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.text)}</a>`).join('')}</div></div>`;
    hero.insertAdjacentElement('afterend',section);
  }
  function ptDate(value){if(!value)return'—';const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')}
  function applyPreEdital(plan){
    if(!plan?.examDateUnknown)return;
    const stage=STAGE_LABELS[plan.contestStage]||'Etapa ainda não informada';
    const start=plan.startDate||'';
    const end=plan.endDate||'';

    const pills=[...document.querySelectorAll('.student-meta .meta-pill')];
    if(pills[1])pills[1].textContent=`Período planejado: ${ptDate(start)} → ${ptDate(end)}`;

    const countdown=document.querySelector('.countdown-card');
    if(countdown)countdown.innerHTML=`<small>CONCURSO EM FASE PRÉ-EDITAL</small><div class="mpc-pre-edital-badge">Prova sem data definida</div><p>O cronograma segue pelo horizonte de planejamento configurado.</p><div class="exam-strip"><span>Etapa atual</span><strong>${esc(stage)}</strong></div>`;

    const metrics=[...document.querySelectorAll('.metric-grid .metric-card')];
    const last=metrics.at(-1);
    if(last){const strong=last.querySelector('strong'),label=last.querySelector('span');if(strong)strong.textContent=stage;if(label)label.textContent='etapa atual do concurso'}

    const headings=[...document.querySelectorAll('.section-heading h2')];
    const journey=headings.find(h=>/prepara[cç][aã]o até a prova/i.test(h.textContent||''));
    if(journey){journey.textContent='Sua preparação no pré-edital';const p=journey.closest('.section-heading')?.querySelector('p');if(p)p.textContent='Visualize o caminho do início do plano até o horizonte atual de preparação.'}

    const milestones=[...document.querySelectorAll('.timeline .milestone')];
    const names=['Início','Base','Consolidação','Revisão','Horizonte atual'];
    milestones.forEach((m,i)=>{const strong=m.querySelector('strong');if(strong&&names[i])strong.textContent=names[i]});

    const generator=document.querySelector('.generator-cta p');
    if(generator)generator.textContent='Use o Gerador de Cronograma MPC gratuitamente e organize sua preparação mesmo antes da definição da data da prova.';
    const final=document.querySelector('.final-banner p');
    if(final)final.textContent='Acompanhe seu planejamento por aqui, avance bloco a bloco e mantenha a constância enquanto o concurso evolui para as próximas etapas.';
  }
  async function init(){
    addStyles();if(!id)return;
    try{const r=await fetch(`/api/plans?id=${encodeURIComponent(id)}`,{cache:'no-store'});if(!r.ok)return;const plan=await r.json();render(plan.publicPageButtons);applyPreEdital(plan)}catch{}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();