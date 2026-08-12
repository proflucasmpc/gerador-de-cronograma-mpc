(()=> {
  'use strict';

  const ADMIN_BYPASS_KEY='mpc-admin-capture-bypass-v1';
  const ADMIN_BYPASS_PLANS_KEY='mpc-admin-bypass-plan-ids-v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const typeText=t=>String(t?.type||'').toLowerCase();
  const typeClass=v=>{const s=String(v||'').toLowerCase();if(s.includes('simulado'))return'simulado';if(s.includes('exerc')||s.includes('quest'))return'exercicios';if(s.includes('revis'))return'revisao';if(s.includes('teoria'))return'teoria';return'estudo'};
  const cleanActivity=v=>String(v||'').replace(/^\s*(teoria|questões|questoes|exercícios|exercicios|revisão|revisao|simulado)\s*[:–—-]?\s*/i,'').trim();

  function bypassActive(){try{return localStorage.getItem(ADMIN_BYPASS_KEY)==='1'}catch{return false}}
  function bypassPlanIds(){try{return new Set(JSON.parse(localStorage.getItem(ADMIN_BYPASS_PLANS_KEY)||'[]'))}catch{return new Set()}}
  function saveBypassPlanIds(ids){try{localStorage.setItem(ADMIN_BYPASS_PLANS_KEY,JSON.stringify([...ids]))}catch{}}

  function applyAdminBypass(id){
    const gateKey=`mpc-public-plan-unlocked:${id}`;
    const ids=bypassPlanIds();
    try{
      if(bypassActive()){
        const wasAlreadyUnlocked=localStorage.getItem(gateKey)==='1';
        if(!wasAlreadyUnlocked){localStorage.setItem(gateKey,'1');ids.add(id);saveBypassPlanIds(ids)}
        document.documentElement.dataset.mpcAdminBypass='1';
        return true;
      }
      if(ids.has(id)){
        localStorage.removeItem(gateKey);
        ids.delete(id);
        saveBypassPlanIds(ids);
      }
      delete document.documentElement.dataset.mpcAdminBypass;
    }catch{}
    return false;
  }

  function settleAdminBypass(){
    if(!bypassActive())return;
    const lock=document.getElementById('captureLock');
    if(lock){lock.classList.remove('visible');lock.setAttribute('aria-hidden','true')}
    document.body.classList.remove('capture-open');
  }

  function strengthenWhatsappReturn(id){
    if(bypassActive())return;
    const persistKey=`mpc-public-plan-whatsapp-pending-persist:${id}`;
    const sessionKey=`mpc-public-plan-whatsapp-pending:${id}`;
    const unlockKey=`mpc-public-plan-unlocked:${id}`;
    const wa=document.getElementById('captureWhatsappBtn');
    const unlock=document.getElementById('captureUnlock');
    wa?.addEventListener('click',()=>{try{localStorage.setItem(persistKey,'1')}catch{}},true);
    unlock?.addEventListener('click',()=>{setTimeout(()=>{try{if(localStorage.getItem(unlockKey)==='1')localStorage.removeItem(persistKey)}catch{}},80)});
    const showCodeStep=()=>{
      if(bypassActive())return;
      let pending=false,unlocked=false;
      try{pending=localStorage.getItem(persistKey)==='1';unlocked=localStorage.getItem(unlockKey)==='1';if(pending&&!unlocked)sessionStorage.setItem(sessionKey,'1')}catch{}
      if(!pending||unlocked)return;
      const lock=document.getElementById('captureLock');
      const request=document.getElementById('captureRequestStep');
      const code=document.getElementById('captureCodeStep');
      if(lock&&request&&code){request.hidden=true;code.hidden=false;lock.classList.add('visible');lock.setAttribute('aria-hidden','false');document.body.classList.add('capture-open');setTimeout(()=>document.getElementById('captureCode')?.focus(),100)}
    };
    window.addEventListener('pageshow',showCodeStep);
    window.addEventListener('focus',showCodeStep);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')showCodeStep()});
    setTimeout(showCodeStep,120);
  }

  function stripVideoPrefix(value){
    let raw=String(value||'').trim();
    let modality='';
    const m=raw.match(/^Videoaula(?:\s+de)?\s+(teoria|exercícios corrigidos|exercicios corrigidos|revisão ou resumo|revisao ou resumo|revisão|revisao)?\s*[-:–—]\s*(.*)$/i);
    if(m){modality=m[1]?`Videoaula de ${m[1]}`:'Videoaula';raw=m[2].trim()}
    return {raw,modality};
  }

  function parseTaskContent(task){
    const base=stripVideoPrefix(cleanActivity(task?.activity));
    const raw=base.raw.replace(/\s*·\s*(?:Parte|Bloco)\s+\d+\s+de\s+\d+\s*$/i,'').trim();
    const match=raw.match(/^Tópico:\s*(.*?)\s*\|\s*Subtópico:\s*(.*)$/i);
    if(match)return {topic:match[1].trim(),subtopic:match[2].trim(),raw,modality:base.modality};
    return {topic:raw||'Atividade de estudo',subtopic:'',raw,modality:base.modality};
  }

  function displayActivity(task,plan){
    let text=cleanActivity(task?.activity||'Atividade de estudo');
    if(plan?.studyRoutine&&plan.studyRoutine.mode!=='continuous')text=text.replace(/\s*·\s*Parte\s+(\d+)\s+de\s+(\d+)\s*$/i,' · Bloco $1 de $2');
    return text;
  }

  function parseProgrammaticContent(plan){
    const map=new Map();
    (plan.tasks||[]).forEach(task=>{
      const type=typeText(task);
      if(type.includes('revis')||type.includes('simulado'))return;
      const stripped=stripVideoPrefix(cleanActivity(task.activity)).raw;
      if(!/^Tópico:/i.test(stripped))return;
      const parsed=parseTaskContent(task);
      const subject=String(task.subject||'Disciplina').trim();
      if(!parsed.topic)return;
      if(!map.has(subject))map.set(subject,new Map());
      const topics=map.get(subject);
      if(!topics.has(parsed.topic))topics.set(parsed.topic,new Set());
      if(parsed.subtopic)topics.get(parsed.topic).add(parsed.subtopic);
    });
    return map;
  }

  function fixContentsMap(plan){
    const grid=document.querySelector('#conteudos .contents-grid');
    if(!grid)return;
    const map=parseProgrammaticContent(plan);
    if(!map.size)return;
    grid.innerHTML=[...map.entries()].map(([subject,topics],i)=>`<details class="content-accordion"><summary><div><span class="content-number">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(subject)}</strong><small>${topics.size} tópicos</small></span></div><span>＋</span></summary><div class="content-list">${[...topics.entries()].map(([topic,subs])=>`<div class="content-item"><span>•</span><span><strong>${esc(topic)}</strong>${subs.size?`<br><small>${[...subs].map(esc).join(' · ')}</small>`:''}</span></div>`).join('')}</div></details>`).join('');
  }

  function updateContentMetrics(plan){
    const map=parseProgrammaticContent(plan);
    if(!map.size)return;
    let topics=0,subtopics=0;
    map.forEach(topicMap=>{topics+=topicMap.size;topicMap.forEach(subs=>subtopics+=subs.size)});
    document.querySelectorAll('.metric-card').forEach(card=>{
      const label=(card.querySelector('span')?.textContent||'').trim().toLowerCase();
      const strong=card.querySelector('strong');
      if(!strong)return;
      if(label==='tópicos')strong.textContent=String(topics);
      if(label==='subtópicos')strong.textContent=String(subtopics);
      if(plan?.studyRoutine?.mode&&plan.studyRoutine.mode!=='continuous'&&label==='atividades')card.querySelector('span').textContent='blocos de estudo';
    });
    document.querySelectorAll('.stat-line').forEach(row=>{const label=(row.querySelector('span')?.textContent||'').trim().toLowerCase();if(label.includes('tópicos identificados'))row.querySelector('strong').textContent=String(topics)});
  }

  function guidanceGroups(text){
    const blocks=String(text||'').replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
    const intro=[];const groups=[];let current=null;
    blocks.forEach(block=>{
      const oneLine=!block.includes('\n');
      const upper=oneLine&&block===block.toUpperCase()&&/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(block)&&block.length<=100;
      if(upper){current={title:block,paragraphs:[]};groups.push(current)}else if(current){current.paragraphs.push(block)}else intro.push(block);
    });
    return {intro,groups};
  }

  function addGuidance(plan){
    const text=String(plan.generalGuidance||'').trim();
    if(!text||document.getElementById('orientacoes'))return;
    const target=document.getElementById('conteudos')||document.getElementById('cronograma');
    if(!target)return;
    const {intro,groups}=guidanceGroups(text);
    const section=document.createElement('section');
    section.className='section guidance-section';section.id='orientacoes';
    section.innerHTML=`<div class="section-heading"><div><span class="kicker">Estratégia de uso</span><h2>Orientações Gerais</h2></div><p>Leia antes de executar o plano e consulte sempre que precisar ajustar o ritmo.</p></div><div class="panel guidance-panel">${intro.map(p=>`<p class="guidance-intro">${esc(p).replace(/\n/g,'<br>')}</p>`).join('')}<div class="guidance-groups">${groups.map((g,i)=>`<details class="guidance-group" ${i===0?'open':''}><summary><span>${esc(g.title)}</span><b>＋</b></summary><div>${g.paragraphs.map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('')}</div></details>`).join('')}</div></div>`;
    target.parentElement.insertBefore(section,target);
    const style=document.createElement('style');
    style.textContent=`.guidance-panel{padding:24px 28px}.guidance-intro{margin:0 0 18px;color:var(--text);font-size:15px;line-height:1.72}.guidance-groups{display:grid;gap:9px}.guidance-group{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}.guidance-group summary{list-style:none;cursor:pointer;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--navy3);font-size:13px;font-weight:900}.guidance-group summary::-webkit-details-marker{display:none}.guidance-group summary b{color:var(--purple);font-size:18px;transition:.2s}.guidance-group[open] summary b{transform:rotate(45deg)}.guidance-group>div{padding:0 16px 15px}.guidance-group p{margin:0 0 12px;color:var(--text);font-size:14px;line-height:1.7}.guidance-group p:last-child{margin-bottom:0}@media(max-width:700px){.guidance-panel{padding:18px 14px}.guidance-intro,.guidance-group p{font-size:14px}}`;
    document.head.appendChild(style);
    const nav=document.querySelector('.desktop-nav');
    if(nav&&!nav.querySelector('a[href="#orientacoes"]')){const a=document.createElement('a');a.href='#orientacoes';a.textContent='Orientações';const contents=nav.querySelector('a[href="#conteudos"]');nav.insertBefore(a,contents||null)}
  }

  function routineLabel(mode){return {fragmented:'Estudo fracionado','12x36':'Escala 12x36',custom:'Rotina personalizada'}[mode]||'Rotina personalizada'}
  function sumMinutes(arr){return (arr||[]).reduce((sum,w)=>sum+(Number(w?.duration)||0),0)}
  function formatMinutes(total){const m=Math.max(0,Number(total)||0);const h=Math.floor(m/60),r=m%60;return h?(r?`${h}h${String(r).padStart(2,'0')}`:`${h}h`):`${r} min`}

  function updateHeroRoutine(plan){
    const routine=plan?.studyRoutine;
    if(!routine||routine.mode==='continuous')return;
    const hero=document.querySelector('.student-meta');if(!hero)return;
    const pills=[...hero.querySelectorAll('.meta-pill')];
    const hoursPill=pills.find(p=>/disponíveis por dia/i.test(p.textContent||''));
    if(routine.mode==='12x36'){
      const work=formatMinutes(sumMinutes(routine.workWindows));const off=formatMinutes(sumMinutes(routine.offWindows));if(hoursPill)hoursPill.textContent=`Trabalho ${work} · Folga ${off}`;
    }else{const capacity=formatMinutes(sumMinutes(routine.windows));if(hoursPill)hoursPill.textContent=`${capacity} de capacidade diária`}
    if(!hero.querySelector('[data-routine-chip]')){const chip=document.createElement('span');chip.className='meta-pill';chip.dataset.routineChip='1';chip.textContent=routineLabel(routine.mode);hero.appendChild(chip)}
    document.querySelectorAll('.metric-card').forEach(card=>{
      const span=card.querySelector('span');const strong=card.querySelector('strong');const label=(span?.textContent||'').trim().toLowerCase();
      if(!span||!strong||label!=='por dia')return;
      if(routine.mode==='12x36'){strong.textContent=`${formatMinutes(sumMinutes(routine.workWindows))} / ${formatMinutes(sumMinutes(routine.offWindows))}`;span.textContent='trabalho / folga'}else{strong.textContent=formatMinutes(sumMinutes(routine.windows));span.textContent='capacidade/dia'}
    });
  }

  function routineWindowCard(w){
    const types=(w?.types||[]).slice(0,4).join(' · ');
    return `<div class="routine-window-card"><div class="routine-window-time">${esc(w?.time||'Horário livre')}</div><div><strong>${esc(w?.moment||'Janela de estudo')}</strong><span>${esc(formatMinutes(w?.duration||0))} · ${esc(w?.environment||'Local livre')}</span>${types?`<small>${esc(types)}</small>`:''}${w?.videoOnly?'<em>▶ Somente videoaula</em>':''}</div></div>`;
  }

  function addRoutineSection(plan){
    const routine=plan?.studyRoutine;
    if(!routine||routine.mode==='continuous'||document.getElementById('rotina-estudos'))return;
    updateHeroRoutine(plan);
    const hero=document.getElementById('plano');if(!hero)return;
    const section=document.createElement('section');section.className='section routine-section';section.id='rotina-estudos';
    let content='';
    if(routine.mode==='12x36')content=`<div class="routine-profile-grid"><div class="routine-profile"><h3>Dia de trabalho <span>${esc(formatMinutes(sumMinutes(routine.workWindows)))}</span></h3>${(routine.workWindows||[]).map(routineWindowCard).join('')}</div><div class="routine-profile"><h3>Dia de folga <span>${esc(formatMinutes(sumMinutes(routine.offWindows)))}</span></h3>${(routine.offWindows||[]).map(routineWindowCard).join('')}</div></div>`;
    else content=`<div class="routine-window-grid">${(routine.windows||[]).map(routineWindowCard).join('')}</div>`;
    section.innerHTML=`<div class="section-heading"><div><span class="kicker">Rotina personalizada</span><h2>Sua rotina de estudos</h2></div><p>${esc(routineLabel(routine.mode))}: o plano considera quando, onde e como cada bloco pode ser executado.</p></div><div class="panel routine-panel">${content}<div class="routine-rule"><strong>Como interpretar:</strong> blocos marcados como “Somente videoaula” devem ser cumpridos em vídeo, inclusive teoria, exercícios corrigidos ou revisão/resumo.</div></div>`;
    hero.insertAdjacentElement('afterend',section);
    const style=document.createElement('style');
    style.textContent=`.routine-panel{padding:22px}.routine-window-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.routine-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.routine-profile{border:1px solid var(--line);border-radius:13px;padding:14px}.routine-profile h3{margin:0 0 10px;color:var(--navy3);font-size:16px}.routine-profile h3 span{float:right;color:var(--purple);font-size:12px}.routine-window-card{display:grid;grid-template-columns:auto 1fr;gap:11px;align-items:start;border:1px solid var(--line);border-radius:11px;padding:11px;background:#F8FAFD;margin-bottom:8px}.routine-window-grid .routine-window-card{margin:0}.routine-window-time{background:var(--navy);color:#fff;border-radius:8px;padding:7px 8px;font-size:11px;font-weight:900;white-space:nowrap}.routine-window-card strong,.routine-window-card span,.routine-window-card small,.routine-window-card em{display:block}.routine-window-card strong{font-size:13px;color:var(--navy3)}.routine-window-card span{font-size:11px;color:var(--muted);margin-top:2px}.routine-window-card small{font-size:10px;color:var(--muted);margin-top:5px}.routine-window-card em{font-size:10px;color:var(--purple);font-style:normal;font-weight:900;margin-top:5px}.routine-rule{margin-top:13px;padding:11px 13px;border-left:4px solid var(--purple);background:#faf9ff;border-radius:8px;font-size:12px;color:var(--muted)}@media(max-width:900px){.routine-window-grid{grid-template-columns:1fr 1fr}.routine-profile-grid{grid-template-columns:1fr}}@media(max-width:560px){.routine-window-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  function buildTaskLookup(plan){const byId=new Map();(plan.tasks||[]).forEach(task=>{if(task?.id)byId.set(String(task.id),task)});return byId}

  function decorateScheduleTasks(plan){
    const byId=buildTaskLookup(plan);
    document.querySelectorAll('#cronograma .schedule-task').forEach(row=>{
      const button=row.querySelector('[data-complete]');const id=button?.dataset.complete||'';const task=byId.get(id);if(!task)return;
      row.dataset.taskId=id;
      const copy=row.querySelector('.schedule-task-copy');if(!copy)return;
      const activity=[...copy.children].find(el=>el.tagName==='SPAN'&&!el.classList.contains('mini-badge')&&!el.classList.contains('routine-note')&&!el.classList.contains('routine-modality'));
      if(activity)activity.textContent=displayActivity(task,plan);
      const parsed=parseTaskContent(task);
      if(parsed.modality&&!copy.querySelector('.routine-modality')){const modality=document.createElement('span');modality.className='routine-modality';modality.textContent=`▶ ${parsed.modality}`;copy.insertBefore(modality,copy.querySelector('strong'))}
      if(task.notes&&!copy.querySelector('.routine-note')){const note=document.createElement('span');note.className='routine-note';note.innerHTML=String(task.notes).split('·').map(x=>x.trim()).filter(Boolean).map(x=>`<i>${esc(x)}</i>`).join('');copy.appendChild(note)}
    });
    const style=document.createElement('style');style.textContent=`.schedule-task-copy .routine-modality{align-self:flex-start;margin-top:6px;background:#f1edff;color:#6b47d1;border:1px solid #ddd3ff;border-radius:999px;padding:4px 7px;font-size:10px!important;font-weight:900}.schedule-task-copy .routine-note{display:flex!important;flex-wrap:wrap;gap:5px;margin-top:7px}.schedule-task-copy .routine-note i{font-style:normal;background:#f6f7fb;color:#5c6678;border:1px solid #e4e8f0;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:800}.today-routine{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}.today-routine i{font-style:normal;background:#f6f7fb;color:#5c6678;border:1px solid #e4e8f0;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:800}.today-video{display:inline-flex;margin:0 0 8px;background:#f1edff;color:#6b47d1;border:1px solid #ddd3ff;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:900}`;document.head.appendChild(style);
  }

  function localTodayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function dateObj(v){if(!v)return null;const d=new Date(`${String(v).slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d}
  function ptDate(v){const d=dateObj(v);return d?d.toLocaleDateString('pt-BR'):'—'}
  function longDate(v){const d=dateObj(v);return d?d.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}):'Data não informada'}
  function weekday(v){const d=dateObj(v);return d?d.toLocaleDateString('pt-BR',{weekday:'long'}):'Sem data'}
  function progressSet(id){try{return new Set(JSON.parse(localStorage.getItem(`mpc-public-plan-progress:${id}`)||'[]'))}catch{return new Set()}}
  function writeProgress(id,set){try{localStorage.setItem(`mpc-public-plan-progress:${id}`,JSON.stringify([...set]))}catch{}}

  function updateProgressVisual(plan,id){
    const done=progressSet(id);const tasks=plan.tasks||[];const completed=tasks.reduce((n,t)=>n+(t?.id&&done.has(String(t.id))?1:0),0);const percent=tasks.length?Math.min(100,Math.round(completed/tasks.length*100)):0;
    const ring=document.getElementById('progressRing');const label=document.getElementById('progressPercent');if(ring)ring.style.setProperty('--p',String(percent));if(label)label.textContent=`${percent}%`;
  }

  function chooseTodayGroup(plan,id){
    const tasks=[...(plan.tasks||[])].filter(t=>t.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.start||'').localeCompare(String(b.start||'')));
    const done=progressSet(id);const today=localTodayKey();const groups=new Map();tasks.forEach(t=>{if(!groups.has(t.date))groups.set(t.date,[]);groups.get(t.date).push(t)});
    if(groups.has(today))return {date:today,tasks:groups.get(today),isToday:true};
    const future=[...groups.entries()].find(([date,items])=>date>today&&items.some(t=>!done.has(String(t.id||''))));if(future)return {date:future[0],tasks:future[1],isToday:false};
    const pending=[...groups.entries()].find(([,items])=>items.some(t=>!done.has(String(t.id||''))));if(pending)return {date:pending[0],tasks:pending[1],isToday:pending[0]===today};
    return {date:'',tasks:[],isToday:false,complete:true};
  }

  function renderToday(plan,id){
    const main=document.querySelector('#hoje .today-main');const heading=document.querySelector('#hoje .section-heading h2');const helper=document.querySelector('#hoje .section-heading p');if(!main||!heading)return;
    const group=chooseTodayGroup(plan,id);const done=progressSet(id);
    if(group.complete){heading.textContent='Plano concluído';if(helper)helper.textContent='Todas as atividades deste plano foram marcadas como concluídas neste navegador.';main.innerHTML='<div class="today-date"><strong>Parabéns pelo avanço</strong><span>0 blocos pendentes</span></div><p>Use as revisões, seus erros anteriores e os simulados para consolidar a preparação até a prova.</p>';updateProgressVisual(plan,id);return}
    heading.textContent=`${group.isToday?'Hoje':'Próximo estudo'} · ${weekday(group.date)}`;
    if(helper)helper.textContent=group.isToday?'Execute os blocos previstos para hoje e avance no checklist.':'Não há bloco programado para hoje. A página mostra a próxima data com atividade pendente.';
    main.innerHTML=`<div class="today-date"><strong>${esc(longDate(group.date))}</strong><span>${group.tasks.length} blocos programados</span></div>${group.tasks.map(task=>{const parsed=parseTaskContent(task);const tid=String(task.id||'');const completed=tid&&done.has(tid);const routine=task.notes?`<div class="today-routine">${String(task.notes).split('·').map(x=>x.trim()).filter(Boolean).map(x=>`<i>${esc(x)}</i>`).join('')}</div>`:'';const modality=parsed.modality?`<span class="today-video">▶ ${esc(parsed.modality)}</span>`:'';return `<article class="study-card ${completed?'completed':''}" data-card-id="${esc(tid)}"><div class="study-card-top"><span class="activity-badge ${typeClass(task.type)}">${esc(task.type||'Estudo')}</span><button class="complete-btn mpc-today-complete" data-complete="${esc(tid)}"><span>✓</span> <span class="complete-label">${completed?'Concluído':'Marcar concluído'}</span></button></div><h3>${esc(task.subject||'Disciplina')}${task.start?` · ${esc(task.start)}${task.end?`–${esc(task.end)}`:''}`:''}</h3>${modality}<p class="topic-title">${esc(parsed.topic)}</p>${parsed.subtopic?`<p class="subtopic">${esc(parsed.subtopic)}</p>`:''}${routine}</article>`}).join('')}`;
    if(!main.dataset.mpcTodayBound){main.dataset.mpcTodayBound='1';main.addEventListener('click',event=>{const btn=event.target.closest('.mpc-today-complete');if(!btn)return;event.preventDefault();const tid=btn.dataset.complete||'';const scheduleBtn=[...document.querySelectorAll('#cronograma .round-check[data-complete]')].find(b=>b.dataset.complete===tid);if(scheduleBtn){scheduleBtn.click();setTimeout(()=>renderToday(plan,id),40);return}const set=progressSet(id);set.has(tid)?set.delete(tid):set.add(tid);writeProgress(id,set);updateProgressVisual(plan,id);renderToday(plan,id)})}
    updateProgressVisual(plan,id);
  }

  function improveTimeline(plan){
    const heading=[...document.querySelectorAll('.section-heading h2')].find(h=>/Sua preparação até a prova/i.test(h.textContent||''));const track=heading?.closest('.section')?.querySelector('.timeline-track');if(!track)return;
    const tasks=[...(plan.tasks||[])].filter(t=>t.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.start||'').localeCompare(String(b.start||'')));if(!tasks.length)return;
    const regular=tasks.filter(t=>!typeText(t).includes('simulado'));const dates=regular.map(t=>t.date);const quantile=q=>dates[Math.min(dates.length-1,Math.max(0,Math.floor((dates.length-1)*q)))]||plan.startDate;
    const start=plan.startDate||dates[0];const base=quantile(.28);const firstReview=regular.find(t=>typeText(t).includes('revis'))?.date;const consolidation=firstReview||quantile(.58);const finalDate=quantile(.82);const exam=plan.examDate||plan.endDate||tasks.at(-1)?.date;
    const points=[['Início',start],['Base',base],['Consolidação',consolidation],['Reta final',finalDate],['Prova',exam]];
    track.innerHTML=points.map(([name,date],i)=>`<div class="milestone"><i>${i+1}</i><strong>${name}</strong><span>${esc(ptDate(date))}</span></div>`).join('');
    const helper=heading.closest('.section-heading')?.querySelector('p');if(helper)helper.textContent='Marcos calculados a partir das atividades realmente distribuídas no cronograma.';
  }

  function improveNavigation(){
    const mobile=document.querySelector('.mobile-nav');
    if(mobile)mobile.innerHTML=`<a href="#hoje"><span>◉</span><span>Hoje</span></a><a href="#plano"><span>▦</span><span>Plano</span></a><a href="#orientacoes"><span>◎</span><span>Orientações</span></a><a href="#conteudos"><span>≡</span><span>Conteúdos</span></a><a href="#cronograma"><span>✓</span><span>Cronograma</span></a>`;
    const style=document.createElement('style');style.textContent=`#plano,#hoje,#rotina-estudos,#orientacoes,#conteudos,#cronograma,#progresso{scroll-margin-top:145px}@media(max-width:880px){.mobile-nav{grid-template-columns:repeat(5,1fr)!important}.mobile-nav a{font-size:9px!important;padding:6px 2px!important}#plano,#hoje,#rotina-estudos,#orientacoes,#conteudos,#cronograma,#progresso{scroll-margin-top:128px}}`;document.head.appendChild(style);
  }

  function addCreatorBanner(plan){
    if(!plan?.createdByUser)return;
    const hero=document.querySelector('.hero');if(!hero||document.querySelector('.creator-share-banner'))return;
    const wrap=document.createElement('section');wrap.className='creator-share-banner';
    const style=document.createElement('style');style.textContent=`.creator-share-banner{max-width:1180px;margin:0 auto 26px;padding:0 24px}.creator-share-card{background:#fff;border:1px solid #E4E8F0;border-left:6px solid #8A5CFF;border-radius:14px;padding:20px 22px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}.creator-share-card strong{display:block;color:#071225;font-family:Georgia,serif;font-size:21px;line-height:1.2}.creator-share-card p{margin:7px 0 0;color:#657086;font-size:14px}.creator-share-btn{background:#8A5CFF;color:#fff!important;border-radius:10px;padding:12px 15px;font-size:12px;font-weight:900;white-space:nowrap;text-decoration:none}@media(max-width:700px){.creator-share-banner{padding:0 14px}.creator-share-card{grid-template-columns:1fr}.creator-share-btn{text-align:center}}`;document.head.appendChild(style);
    const card=document.createElement('div');card.className='creator-share-card';const copy=document.createElement('div');const strong=document.createElement('strong');strong.textContent=`Eu, ${plan.creatorName||plan.studentName||'estudante'}, gerei este cronograma de estudos gratuitamente com o Gerador de Cronograma MPC.`;const p=document.createElement('p');p.textContent='Quer organizar seus estudos assim também? Gere gratuitamente seu próprio cronograma com matérias, tópicos, subtópicos e uma página pronta para acompanhar no celular.';copy.append(strong,p);const a=document.createElement('a');a.className='creator-share-btn';a.href='/';a.textContent='CRIAR MEU CRONOGRAMA GRATUITAMENTE';card.append(copy,a);wrap.appendChild(card);hero.insertAdjacentElement('afterend',wrap);
  }

  async function waitForBaseRender(){for(let i=0;i<50;i++){if(document.getElementById('plano')&&document.getElementById('cronograma'))return true;await new Promise(r=>setTimeout(r,80))}return false}

  async function run(){
    const parts=location.pathname.split('/').filter(Boolean);const id=(parts.at(-1)||'').toUpperCase();if(!/^[A-Z0-9]{10}$/.test(id))return;
    const adminMode=applyAdminBypass(id);
    let plan;try{const r=await fetch(`/api/plans?id=${encodeURIComponent(id)}`,{cache:'no-store'});if(!r.ok)return;plan=await r.json()}catch{return}
    await waitForBaseRender();
    if(adminMode)settleAdminBypass();
    strengthenWhatsappReturn(id);
    fixContentsMap(plan);
    updateContentMetrics(plan);
    addGuidance(plan);
    addRoutineSection(plan);
    decorateScheduleTasks(plan);
    renderToday(plan,id);
    improveTimeline(plan);
    improveNavigation();
    addCreatorBanner(plan);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
