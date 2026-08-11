(()=>{
  'use strict';
  const GROUP_URL='https://chat.whatsapp.com/DgypQxmPYQvGBNTmQoa6uK';
  const RECENT_KEY='mpcAdminRecentPublishedPlansV1';
  const SAVE_KEY='mpcAdminUiLastSavedAtV1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const val=id=>($(id)?.value||'').trim();
  const ptDate=iso=>{try{return new Date(iso).toLocaleString('pt-BR')}catch{return iso||'—'}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function loadRecent(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch{return[]}}
  function saveRecent(items){try{localStorage.setItem(RECENT_KEY,JSON.stringify(items.slice(0,50)))}catch{}}
  function rememberPublished(path){
    if(!path||!/^\/plano\/[A-Z0-9]+/i.test(path))return;
    const items=loadRecent().filter(x=>x.path!==path);
    items.unshift({path,name:val('#adminStudentName')||'Aluno não informado',goal:val('#adminGoal')||'Objetivo não informado',createdAt:new Date().toISOString()});
    saveRecent(items);renderRecent();showPublishedActions(path);
  }

  function installFetchObserver(){
    const original=window.fetch;
    if(!original||original.__mpcAdminWrapped)return;
    async function wrapped(...args){
      const response=await original.apply(this,args);
      try{
        const input=args[0],opts=args[1]||{};
        const url=typeof input==='string'?input:(input?.url||'');
        const method=(opts.method||input?.method||'GET').toUpperCase();
        if(method==='POST'&&/\/api\/plans(?:\?|$)/.test(url)){
          response.clone().json().then(data=>{if(data?.path)rememberPublished(data.path)}).catch(()=>{});
        }
      }catch{}
      return response;
    }
    wrapped.__mpcAdminWrapped=true;window.fetch=wrapped;
  }

  function makeDashboard(){
    const wrap=document.createElement('div');
    wrap.className='mpc-admin-dashboard';
    wrap.innerHTML=`
      <div class="mpc-admin-metric"><strong id="mpcMetricStudent">—</strong><span>Aluno</span></div>
      <div class="mpc-admin-metric"><strong id="mpcMetricGoal">—</strong><span>Objetivo</span></div>
      <div class="mpc-admin-metric"><strong id="mpcMetricSubjects">0</strong><span>Matérias</span></div>
      <div class="mpc-admin-metric"><strong id="mpcMetricPeriod">—</strong><span>Período</span></div>`;
    return wrap;
  }

  function makeStatusBar(){
    const bar=document.createElement('div');bar.className='mpc-admin-statusbar';
    bar.innerHTML=`<div><div class="mpc-admin-ready" id="mpcAdminReady"><i></i><span>Preencha os dados essenciais</span></div><div class="mpc-admin-save-state" id="mpcAdminSaveState">Rascunho ainda não salvo nesta sessão.</div></div><div class="mpc-admin-actions"><button type="button" id="mpcQuickPreview">Visualizar como aluno</button><button type="button" id="mpcQuickGenerate" class="primary">Ir para gerar</button><a href="${GROUP_URL}" target="_blank" rel="noopener">Grupo gratuito do gerador</a></div>`;
    return bar;
  }

  const sectionDefs=[
    ['Visão geral','adminPanelTitle'],['Aluno e prova','mpc-sec-aluno'],['Critérios','mpc-sec-criterios'],['Atividades','mpc-sec-atividades'],['Simulados','mpc-sec-simulados'],['Matérias','mpc-sec-materias'],['Resumo','adminInsightsCard'],['PDF','mpc-sec-pdf'],['Gerar','mpc-sec-gerar'],['Cronogramas','mpcRecentSection']
  ];

  function assignSectionIds(panel){
    const cards=$$('.admin-card',panel);
    cards.forEach(card=>{
      const t=$('h3',card)?.textContent||'';
      if(t.startsWith('1.'))card.id='mpc-sec-aluno';
      else if(t.startsWith('2.'))card.id='mpc-sec-criterios';
      else if(t.startsWith('3.'))card.id='mpc-sec-atividades';
      else if(t.startsWith('4.'))card.id='mpc-sec-simulados';
      else if(t.startsWith('5.'))card.id='mpc-sec-materias';
      else if(t.startsWith('7.'))card.id='mpc-sec-pdf';
      else if(t.startsWith('8.'))card.id='mpc-sec-gerar';
      if(card.id)card.classList.add('mpc-admin-section-anchor');
    });
    $('#adminInsightsCard')?.classList.add('mpc-admin-section-anchor');
  }

  function buildShell(panel){
    assignSectionIds(panel);
    const parent=panel.parentElement;
    const shell=document.createElement('div');shell.className='mpc-admin-shell';
    const sidebar=document.createElement('aside');sidebar.className='mpc-admin-sidebar';sidebar.innerHTML=`<div class="mpc-admin-title">Painel Administrativo</div><div class="mpc-admin-sub">Gerador de Cronograma MPC</div><nav class="mpc-admin-nav" aria-label="Navegação administrativa">${sectionDefs.map(([label,id])=>`<button type="button" data-admin-target="${id}">${label}</button>`).join('')}</nav>`;
    const content=document.createElement('div');content.className='mpc-admin-content';
    parent.insertBefore(shell,panel);shell.append(sidebar,content);content.append(panel);
    const head=$('.admin-panel-head',panel);if(head){head.insertAdjacentElement('afterend',makeDashboard());head.nextElementSibling.insertAdjacentElement('afterend',makeStatusBar())}
    $$('.mpc-admin-nav button',sidebar).forEach(btn=>btn.addEventListener('click',()=>{const target=document.getElementById(btn.dataset.adminTarget);target?.scrollIntoView({behavior:'smooth',block:'start'})}));
    $('#mpcQuickPreview')?.addEventListener('click',()=>$('#adminPreviewStudentBtn')?.click());
    $('#mpcQuickGenerate')?.addEventListener('click',()=>document.getElementById('mpc-sec-gerar')?.scrollIntoView({behavior:'smooth',block:'center'}));
  }

  function updateSummary(){
    const student=val('#adminStudentName'),goal=val('#adminGoal'),days=val('#adminPlanDays');
    const subjectCount=$$('#adminSubjectsList .admin-subject-card').length;
    const a=$('#mpcMetricStudent'),b=$('#mpcMetricGoal'),c=$('#mpcMetricSubjects'),d=$('#mpcMetricPeriod');
    if(a)a.textContent=student||'—';if(b)b.textContent=goal||'—';if(c)c.textContent=String(subjectCount);if(d)d.textContent=days?`${days} dias`:'—';
    const essential=student.length>=2&&goal.length>=2&&Number(days)>0&&subjectCount>0;
    const ready=$('#mpcAdminReady');if(ready){ready.classList.toggle('ready',essential);$('span',ready).textContent=essential?'Pronto para gerar':'Preencha os dados essenciais'}
  }

  function updateSaveState(ts){
    const el=$('#mpcAdminSaveState');if(!el)return;
    const saved=ts||localStorage.getItem(SAVE_KEY);el.textContent=saved?`Último rascunho salvo: ${ptDate(saved)}`:'Rascunho ainda não salvo nesta sessão.';
  }

  function installSaveFeedback(){
    const btn=$('#adminSaveDraftBtn');
    btn?.addEventListener('click',()=>{const ts=new Date().toISOString();try{localStorage.setItem(SAVE_KEY,ts)}catch{};setTimeout(()=>updateSaveState(ts),120)});
    updateSaveState();
  }

  function installDestructiveGuards(){
    document.addEventListener('click',e=>{
      const btn=e.target.closest('button');if(!btn)return;
      const text=(btn.textContent||'').trim().toLowerCase();
      const id=btn.id||'';
      const destructive=id==='clearBtn'||/^(remover|excluir|limpar)/.test(text);
      if(!destructive||btn.dataset.mpcConfirmed==='1')return;
      if(!confirm('Confirma esta ação? Ela pode remover informações preenchidas.')){e.preventDefault();e.stopImmediatePropagation();return}
      btn.dataset.mpcConfirmed='1';setTimeout(()=>delete btn.dataset.mpcConfirmed,50);
    },true);
  }

  function makeRecentSection(){
    const sec=document.createElement('section');sec.className='mpc-admin-recent mpc-admin-section-anchor';sec.id='mpcRecentSection';
    sec.innerHTML=`<div class="section-title"><div><h3>Cronogramas publicados recentemente</h3><p class="helper">Histórico local dos links publicados neste navegador a partir desta versão.</p></div><div class="field" style="min-width:min(320px,100%)"><input id="mpcRecentSearch" type="search" placeholder="Buscar por aluno ou concurso"></div></div><div class="mpc-admin-recent-list" id="mpcRecentList"></div><div id="mpcPublishedActions"></div>`;
    const panel=$('#adminPanel');const generate=document.getElementById('mpc-sec-gerar');(generate?.parentElement||panel)?.appendChild(sec);
    $('#mpcRecentSearch')?.addEventListener('input',renderRecent);renderRecent();
  }

  function renderRecent(){
    const list=$('#mpcRecentList');if(!list)return;
    const q=($('#mpcRecentSearch')?.value||'').toLowerCase().trim();
    const items=loadRecent().filter(x=>!q||`${x.name} ${x.goal}`.toLowerCase().includes(q));
    if(!items.length){list.innerHTML='<div class="mpc-admin-empty">Nenhum cronograma publicado registrado neste navegador.</div>';return}
    list.innerHTML=items.slice(0,20).map(x=>`<div class="mpc-admin-recent-item"><div><strong>${esc(x.name)}</strong><small>${esc(x.goal)} · ${esc(ptDate(x.createdAt))}</small></div><a href="${esc(x.path)}" target="_blank" rel="noopener">Abrir cronograma</a></div>`).join('');
  }

  function showPublishedActions(path){
    const box=$('#mpcPublishedActions');if(!box)return;
    const full=new URL(path,location.origin).href;
    box.innerHTML=`<div class="mpc-admin-statusbar" style="margin-top:12px"><div><div class="mpc-admin-ready ready"><i></i><span>Página criada com sucesso</span></div><div class="mpc-admin-save-state">${esc(full)}</div></div><div class="mpc-admin-actions"><button type="button" data-copy-link>Copiar link</button><a href="${esc(full)}" target="_blank" rel="noopener">Abrir cronograma</a><a href="https://wa.me/?text=${encodeURIComponent(full)}" target="_blank" rel="noopener">Compartilhar no WhatsApp</a></div></div>`;
    $('[data-copy-link]',box)?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(full);alert('Link copiado.')}catch{prompt('Copie o link:',full)}});
    box.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function installLiveUpdates(){
    document.addEventListener('input',e=>{if(e.target.closest('#adminPanel'))updateSummary()});
    document.addEventListener('change',e=>{if(e.target.closest('#adminPanel'))updateSummary()});
    const list=$('#adminSubjectsList');if(list)new MutationObserver(updateSummary).observe(list,{childList:true,subtree:true});
    updateSummary();
  }

  function init(){
    const panel=$('#adminPanel');if(!panel)return;
    installFetchObserver();
    buildShell(panel);
    makeRecentSection();
    installLiveUpdates();
    installSaveFeedback();
    installDestructiveGuards();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
