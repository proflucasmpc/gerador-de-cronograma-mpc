(()=>{
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const id=location.pathname.match(/\/plano\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()||'';
  const STAGE_LABELS={estudo_vagas:'Estudo de vagas',previsao_orcamentaria:'Previsão orçamentária',autorizacao:'Autorização',comissao_organizadora:'Comissão organizadora',escolha_banca:'Escolha da banca',publicacao_edital:'Publicação do edital'};
  function loadMobileStyles(){if(document.querySelector('link[href*="public-mobile-responsive.css"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='/public-mobile-responsive.css?v=20260820-2';document.head.appendChild(link)}
  function loadPublicButtons(){if(document.querySelector('script[data-mpc-public-buttons]')||document.querySelector('script[src*="public-plan-buttons.js"]'))return;const script=document.createElement('script');script.src='/public-plan-buttons.js?v=20260820-4';script.dataset.mpcPublicButtons='1';document.head.appendChild(script)}
  function styles(){if(document.getElementById('mpcPublicLinksStyles'))return;const s=document.createElement('style');s.id='mpcPublicLinksStyles';s.textContent=`.mpc-pre-edital-title{font-family:Georgia,"Times New Roman",serif;font-size:30px;line-height:1.08;margin:14px 0 8px;color:#fff}`;document.head.appendChild(s)}
  function ptDate(value){if(!value)return'—';const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')}
  function applyPreEdital(plan){
    if(!plan?.examDateUnknown)return;
    const stage=STAGE_LABELS[plan.contestStage]||'Etapa ainda não informada';
    const pills=[...document.querySelectorAll('.student-meta .meta-pill')];
    if(pills[1])pills[1].textContent=`Período planejado: ${ptDate(plan.startDate)} → ${ptDate(plan.endDate)}`;
    const countdown=document.querySelector('.countdown-card');
    if(countdown)countdown.innerHTML=`<small>CONCURSO EM FASE PRÉ-EDITAL</small><div class="mpc-pre-edital-title">Prova sem data definida</div><p>O planejamento segue pela quantidade de dias configurada.</p><div class="exam-strip"><span>Etapa atual</span><strong>${esc(stage)}</strong></div>`;
    const metrics=[...document.querySelectorAll('.metric-grid .metric-card')];const last=metrics.at(-1);if(last){const strong=last.querySelector('strong'),label=last.querySelector('span');if(strong)strong.textContent=stage;if(label)label.textContent='etapa atual do concurso'}
    const heading=[...document.querySelectorAll('.section-heading h2')].find(h=>/prepara[cç][aã]o até a prova/i.test(h.textContent||''));
    if(heading){heading.textContent='Sua preparação no pré-edital';const p=heading.closest('.section-heading')?.querySelector('p');if(p)p.textContent='Acompanhe a evolução do plano enquanto o concurso avança para as próximas etapas.'}
    const milestones=[...document.querySelectorAll('.timeline .milestone')];const names=['Início','Base','Consolidação','Revisão','Horizonte atual'];milestones.forEach((m,i)=>{const strong=m.querySelector('strong');if(strong&&names[i])strong.textContent=names[i]});
    const generator=document.querySelector('.generator-cta p');if(generator)generator.textContent='Use o Gerador de Cronograma MPC gratuitamente e organize sua preparação mesmo antes da definição da data da prova.';
    const final=document.querySelector('.final-banner p');if(final)final.textContent='Acompanhe seu planejamento, avance bloco a bloco e mantenha a constância enquanto o concurso evolui para as próximas etapas.';
  }
  async function init(){
    loadMobileStyles();loadPublicButtons();styles();if(!id)return;
    try{const planResponse=await fetch(`/api/plans?id=${encodeURIComponent(id)}`,{cache:'no-store'});if(planResponse.ok){const plan=await planResponse.json();applyPreEdital(plan)}}catch{}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();