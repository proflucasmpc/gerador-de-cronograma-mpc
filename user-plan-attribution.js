(()=>{
  'use strict';
  const ADMIN_BYPASS_KEY='mpc-admin-capture-bypass-v1';

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const typeText=t=>String(t?.type||'').toLowerCase();
  const cleanActivity=v=>String(v||'')
    .replace(/^\s*(teoria|questões|questoes|exercícios|exercicios|revisão|revisao|simulado)\s*[:–—-]?\s*/i,'')
    .trim();

  function bypassActive(){
    try{return localStorage.getItem(ADMIN_BYPASS_KEY)==='1'}catch{return false}
  }

  function disableCaptureForAdmin(){
    if(!bypassActive())return;
    const force=()=>{
      const lock=document.getElementById('captureLock');
      if(lock){lock.classList.remove('visible');lock.setAttribute('aria-hidden','true')}
      document.body.classList.remove('capture-open');
    };
    force();
    const observer=new MutationObserver(force);
    observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','aria-hidden']});
    window.addEventListener('focus',force);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')force()});
  }

  function strengthenWhatsappReturn(id){
    const persistKey=`mpc-public-plan-whatsapp-pending-persist:${id}`;
    const sessionKey=`mpc-public-plan-whatsapp-pending:${id}`;
    const unlockKey=`mpc-public-plan-unlocked:${id}`;
    const wa=document.getElementById('captureWhatsappBtn');
    const unlock=document.getElementById('captureUnlock');

    wa?.addEventListener('click',()=>{
      try{localStorage.setItem(persistKey,'1')}catch{}
    },true);

    unlock?.addEventListener('click',()=>{
      setTimeout(()=>{
        try{if(localStorage.getItem(unlockKey)==='1')localStorage.removeItem(persistKey)}catch{}
      },80);
    });

    const showCodeStep=()=>{
      if(bypassActive())return;
      let pending=false,unlocked=false;
      try{
        pending=localStorage.getItem(persistKey)==='1';
        unlocked=localStorage.getItem(unlockKey)==='1';
        if(pending&&!unlocked)sessionStorage.setItem(sessionKey,'1');
      }catch{}
      if(!pending||unlocked)return;
      const lock=document.getElementById('captureLock');
      const request=document.getElementById('captureRequestStep');
      const code=document.getElementById('captureCodeStep');
      if(lock&&request&&code){
        request.hidden=true;
        code.hidden=false;
        lock.classList.add('visible');
        lock.setAttribute('aria-hidden','false');
        document.body.classList.add('capture-open');
        setTimeout(()=>document.getElementById('captureCode')?.focus(),100);
      }
    };

    window.addEventListener('pageshow',showCodeStep);
    window.addEventListener('focus',showCodeStep);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')showCodeStep()});
    setTimeout(showCodeStep,120);
  }

  function parseProgrammaticContent(plan){
    const map=new Map();
    (plan.tasks||[]).forEach(task=>{
      const type=typeText(task);
      if(type.includes('revis')||type.includes('simulado'))return;
      const raw=cleanActivity(task.activity);
      const match=raw.match(/(?:^|\s)Tópico:\s*(.*?)\s*\|\s*Subtópico:\s*(.*)$/i);
      if(!match)return;
      const subject=String(task.subject||'Disciplina').trim();
      const topic=match[1].trim();
      const subtopic=match[2].trim();
      if(!topic)return;
      if(!map.has(subject))map.set(subject,new Map());
      const topics=map.get(subject);
      if(!topics.has(topic))topics.set(topic,new Set());
      if(subtopic)topics.get(topic).add(subtopic);
    });
    return map;
  }

  function fixContentsMap(plan){
    const grid=document.querySelector('#conteudos .contents-grid');
    if(!grid)return;
    const map=parseProgrammaticContent(plan);
    if(!map.size)return;
    grid.innerHTML=[...map.entries()].map(([subject,topics],i)=>`
      <details class="content-accordion">
        <summary><div><span class="content-number">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(subject)}</strong><small>${topics.size} tópicos</small></span></div><span>＋</span></summary>
        <div class="content-list">${[...topics.entries()].map(([topic,subs])=>`<div class="content-item"><span>•</span><span><strong>${esc(topic)}</strong>${subs.size?`<br><small>${[...subs].map(esc).join(' · ')}</small>`:''}</span></div>`).join('')}</div>
      </details>`).join('');
  }

  function guidanceHtml(text){
    const blocks=String(text||'').replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
    return blocks.map(block=>{
      const oneLine=!block.includes('\n');
      const upper=block===block.toUpperCase()&&/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(block)&&block.length<=90;
      if(oneLine&&upper)return `<h3>${esc(block)}</h3>`;
      return `<p>${esc(block).replace(/\n/g,'<br>')}</p>`;
    }).join('');
  }

  function addGuidance(plan){
    const text=String(plan.generalGuidance||'').trim();
    if(!text||document.getElementById('orientacoes'))return;
    const target=document.getElementById('conteudos')||document.getElementById('cronograma');
    if(!target)return;
    const section=document.createElement('section');
    section.className='section guidance-section';
    section.id='orientacoes';
    section.innerHTML=`<div class="section-heading"><div><span class="kicker">Estratégia de uso</span><h2>Orientações Gerais</h2></div><p>Leia antes de executar o plano e consulte sempre que precisar ajustar o ritmo.</p></div><div class="panel guidance-panel">${guidanceHtml(text)}</div>`;
    target.parentElement.insertBefore(section,target);

    const style=document.createElement('style');
    style.textContent=`.guidance-panel{padding:26px 30px}.guidance-panel h3{margin:24px 0 8px;color:var(--navy3);font-size:16px;letter-spacing:.04em}.guidance-panel h3:first-child{margin-top:0}.guidance-panel p{margin:0 0 14px;color:var(--text);font-size:15px;line-height:1.72}.guidance-panel p:last-child{margin-bottom:0}@media(max-width:700px){.guidance-panel{padding:20px 18px}.guidance-panel p{font-size:14px}}`;
    document.head.appendChild(style);

    const nav=document.querySelector('.desktop-nav');
    if(nav&&!nav.querySelector('a[href="#orientacoes"]')){
      const a=document.createElement('a');a.href='#orientacoes';a.textContent='Orientações';
      const contents=nav.querySelector('a[href="#conteudos"]');
      nav.insertBefore(a,contents||null);
    }
  }

  function addCreatorBanner(plan){
    if(!plan?.createdByUser)return;
    const hero=document.querySelector('.hero');if(!hero||document.querySelector('.creator-share-banner'))return;
    const wrap=document.createElement('section');wrap.className='creator-share-banner';
    const style=document.createElement('style');style.textContent=`.creator-share-banner{max-width:1180px;margin:0 auto 26px;padding:0 24px}.creator-share-card{background:#fff;border:1px solid #E4E8F0;border-left:6px solid #8A5CFF;border-radius:14px;padding:20px 22px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}.creator-share-card strong{display:block;color:#071225;font-family:Georgia,serif;font-size:21px;line-height:1.2}.creator-share-card p{margin:7px 0 0;color:#657086;font-size:14px}.creator-share-btn{background:#8A5CFF;color:#fff!important;border-radius:10px;padding:12px 15px;font-size:12px;font-weight:900;white-space:nowrap;text-decoration:none}@media(max-width:700px){.creator-share-banner{padding:0 14px}.creator-share-card{grid-template-columns:1fr}.creator-share-btn{text-align:center}}`;document.head.appendChild(style);
    const card=document.createElement('div');card.className='creator-share-card';
    const copy=document.createElement('div');const strong=document.createElement('strong');strong.textContent=`Eu, ${plan.creatorName||plan.studentName||'estudante'}, gerei este cronograma de estudos gratuitamente com o Gerador de Cronograma MPC.`;const p=document.createElement('p');p.textContent='Quer organizar seus estudos assim também? Gere gratuitamente seu próprio cronograma com matérias, tópicos, subtópicos e uma página pronta para acompanhar no celular.';copy.append(strong,p);
    const a=document.createElement('a');a.className='creator-share-btn';a.href='/';a.textContent='CRIAR MEU CRONOGRAMA GRATUITAMENTE';card.append(copy,a);wrap.appendChild(card);hero.insertAdjacentElement('afterend',wrap);
  }

  async function run(){
    const parts=location.pathname.split('/').filter(Boolean);
    const id=(parts.at(-1)||'').toUpperCase();
    if(!/^[A-Z0-9]{10}$/.test(id)) return;
    let plan;try{const r=await fetch(`/api/plans?id=${encodeURIComponent(id)}`,{cache:'no-store'});if(!r.ok)return;plan=await r.json()}catch{return}
    disableCaptureForAdmin();
    strengthenWhatsappReturn(id);
    fixContentsMap(plan);
    addGuidance(plan);
    addCreatorBanner(plan);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
