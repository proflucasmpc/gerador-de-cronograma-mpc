(()=> {
  'use strict';

  const CONFIG_KEY='mpcAdminStudyRoutineV1';
  const STATE_KEY='geradorCronogramaMpcData';
  const MODE_LABELS={
    continuous:'Estudo contínuo',
    fragmented:'Estudo fracionado',
    '12x36':'Escala 12x36',
    custom:'Rotina personalizada'
  };
  const DEFAULTS={
    fragmented:[
      {moment:'Ao acordar',time:'06:30',duration:15,environment:'Casa',types:['Revisão','Resumo'],videoOnly:false},
      {moment:'Ônibus para o trabalho',time:'07:10',duration:35,environment:'Transporte',types:['Teoria','Exercícios corrigidos','Revisão'],videoOnly:true},
      {moment:'Horário de almoço',time:'12:30',duration:25,environment:'Trabalho',types:['Teoria','Exercícios','Revisão'],videoOnly:false},
      {moment:'Ônibus de volta',time:'18:10',duration:35,environment:'Transporte',types:['Teoria','Exercícios corrigidos','Revisão'],videoOnly:true},
      {moment:'Antes de dormir',time:'22:45',duration:15,environment:'Casa',types:['Revisão','Resumo'],videoOnly:false}
    ],
    work:[
      {moment:'Ônibus ida',time:'06:40',duration:30,environment:'Transporte',types:['Teoria','Exercícios corrigidos','Revisão'],videoOnly:true},
      {moment:'Almoço',time:'12:20',duration:20,environment:'Trabalho',types:['Revisão','Lei seca'],videoOnly:false},
      {moment:'Ônibus volta',time:'19:20',duration:30,environment:'Transporte',types:['Teoria','Exercícios corrigidos','Revisão'],videoOnly:true},
      {moment:'Antes de dormir',time:'22:30',duration:15,environment:'Casa',types:['Revisão','Resumo'],videoOnly:false}
    ],
    off:[
      {moment:'Manhã',time:'09:00',duration:90,environment:'Casa',types:['Teoria','Exercícios'],videoOnly:false},
      {moment:'Tarde',time:'14:30',duration:60,environment:'Casa',types:['Exercícios','Revisão'],videoOnly:false},
      {moment:'Noite',time:'20:00',duration:45,environment:'Casa',types:['Teoria','Revisão'],videoOnly:false}
    ]
  };
  const TYPE_OPTIONS=['Teoria','Exercícios','Exercícios corrigidos','Revisão','Resumo','Lei seca','Flashcards','Simulado parcial'];
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clone=v=>JSON.parse(JSON.stringify(v));

  function defaultConfig(){
    return {
      mode:'continuous',
      windows:clone(DEFAULTS.fragmented),
      referenceDate:'',
      referenceStatus:'work',
      workWindows:clone(DEFAULTS.work),
      offWindows:clone(DEFAULTS.off)
    };
  }
  function loadConfig(){
    try{
      const saved=JSON.parse(localStorage.getItem(CONFIG_KEY)||'null');
      if(!saved)return defaultConfig();
      return {...defaultConfig(),...saved,
        windows:Array.isArray(saved.windows)?saved.windows:clone(DEFAULTS.fragmented),
        workWindows:Array.isArray(saved.workWindows)?saved.workWindows:clone(DEFAULTS.work),
        offWindows:Array.isArray(saved.offWindows)?saved.offWindows:clone(DEFAULTS.off)
      };
    }catch{return defaultConfig()}
  }
  let config=loadConfig();
  let activeScaleProfile='work';

  function saveConfig(){
    try{localStorage.setItem(CONFIG_KEY,JSON.stringify(config))}catch{}
    updateCapacity();
  }

  function injectStyles(){
    const style=document.createElement('style');
    style.textContent=`
      .mpc-routine-card{grid-column:1/-1}
      .mpc-routine-mode-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
      .mpc-routine-mode{border:2px solid var(--border);background:var(--surface);border-radius:13px;padding:14px;text-align:left;cursor:pointer;color:var(--text)}
      .mpc-routine-mode strong{display:block;font-size:.92rem}.mpc-routine-mode small{display:block;margin-top:5px;color:var(--muted);line-height:1.35}
      .mpc-routine-mode.active{border-color:#8A5CFF;box-shadow:0 0 0 3px rgba(138,92,255,.12);background:color-mix(in srgb,#8A5CFF 5%,var(--surface))}
      .mpc-routine-builder{margin-top:16px}.mpc-routine-window{border:1px solid var(--border);border-radius:13px;padding:14px;margin-top:10px;background:var(--surface)}
      .mpc-routine-window-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.mpc-routine-window-head strong{font-size:.9rem}
      .mpc-routine-window-grid{display:grid;grid-template-columns:1.25fr .75fr .7fr 1fr;gap:10px;margin-top:11px}
      .mpc-routine-checks{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
      .mpc-routine-check{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid var(--border);border-radius:999px;background:var(--surface-2);font-size:.76rem}
      .mpc-routine-check input{width:auto;height:auto}
      .mpc-routine-video{margin-top:11px;padding:10px 12px;border-radius:10px;border:1px solid color-mix(in srgb,var(--cyan) 45%,var(--border));background:color-mix(in srgb,var(--cyan) 8%,var(--surface))}
      .mpc-routine-video label{display:flex;gap:8px;align-items:center;font-size:.8rem;font-weight:850}.mpc-routine-video input{width:auto}
      .mpc-routine-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .mpc-routine-capacity{margin-top:13px;padding:11px 13px;border-radius:11px;background:color-mix(in srgb,var(--gold) 8%,var(--surface));border:1px solid color-mix(in srgb,var(--gold) 35%,var(--border));font-size:.82rem;color:var(--muted)}
      .mpc-routine-capacity strong{color:var(--text)}
      .mpc-routine-scale-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
      .mpc-routine-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.mpc-routine-tab{border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:999px;padding:8px 11px;font-weight:850;cursor:pointer}.mpc-routine-tab.active{background:var(--navy);color:#fff}
      .mpc-routine-rule{margin-top:12px;padding:11px 13px;border-radius:11px;background:var(--surface);border-left:4px solid var(--cyan);font-size:.8rem;color:var(--muted);line-height:1.5}
      @media(max-width:900px){.mpc-routine-mode-grid{grid-template-columns:1fr 1fr}.mpc-routine-window-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:560px){.mpc-routine-mode-grid,.mpc-routine-window-grid,.mpc-routine-scale-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function modeButton(mode,title,copy){
    return `<button type="button" class="mpc-routine-mode ${config.mode===mode?'active':''}" data-routine-mode="${mode}"><strong>${title}</strong><small>${copy}</small></button>`;
  }

  function makeCard(){
    const card=document.createElement('section');
    card.className='admin-card mpc-routine-card admin-section-anchor';
    card.id='mpc-sec-rotina';
    card.innerHTML=`
      <div class="section-title"><div><h3>2B. Rotina e janelas de estudo</h3><p class="helper">Use quando o aluno estuda em horários diferentes, no transporte, em pequenos blocos ou em escala 12x36.</p></div></div>
      <div class="mpc-routine-mode-grid">
        ${modeButton('continuous','Estudo contínuo','Mantém uma sessão diária contínua com distribuição pedagógica inteligente.')}
        ${modeButton('fragmented','Estudo fracionado','Distribui o estudo em vários blocos ao longo do dia.')}
        ${modeButton('12x36','Escala 12x36','Alterna automaticamente dias de trabalho e folga.')}
        ${modeButton('custom','Rotina personalizada','Permite montar janelas livres para uma rotina específica.')}
      </div>
      <div id="mpcRoutineBuilder" class="mpc-routine-builder"></div>
      <div id="mpcRoutineCapacity" class="mpc-routine-capacity"></div>
      <div class="mpc-routine-rule"><strong>Regra de transporte:</strong> ao marcar “Somente videoaula”, o gerador poderá usar videoaula de teoria, videoaula de exercícios corrigidos ou videoaula de revisão/resumo. Essa janela nunca receberá leitura ou resolução ativa.</div>
    `;
    const criteria=document.getElementById('mpc-sec-criterios');
    if(criteria)criteria.insertAdjacentElement('afterend',card);
    else document.getElementById('adminPanel')?.prepend(card);

    const nav=$('.mpc-admin-nav');
    if(nav&&!nav.querySelector('[data-admin-target="mpc-sec-rotina"]')){
      const btn=document.createElement('button');
      btn.type='button';btn.dataset.adminTarget='mpc-sec-rotina';btn.textContent='Rotina';
      btn.addEventListener('click',()=>card.scrollIntoView({behavior:'smooth',block:'start'}));
      const activities=nav.querySelector('[data-admin-target="mpc-sec-atividades"]');
      nav.insertBefore(btn,activities||null);
    }
  }

  function windowHtml(w,index){
    return `<div class="mpc-routine-window" data-window-index="${index}">
      <div class="mpc-routine-window-head"><strong>Janela ${index+1}</strong><button type="button" class="btn btn-danger btn-small" data-remove-window="${index}">Remover</button></div>
      <div class="mpc-routine-window-grid">
        <div class="field"><label>Momento</label><input data-field="moment" value="${escapeAttr(w.moment||'')}"></div>
        <div class="field"><label>Horário</label><input data-field="time" type="time" value="${escapeAttr(w.time||'')}"></div>
        <div class="field"><label>Duração</label><select data-field="duration">${[15,20,25,30,35,45,60,90,120].map(v=>`<option value="${v}" ${Number(w.duration)===v?'selected':''}>${v} min</option>`).join('')}</select></div>
        <div class="field"><label>Ambiente</label><select data-field="environment">${['Casa','Trabalho','Transporte','Biblioteca','Outro'].map(v=>`<option ${w.environment===v?'selected':''}>${v}</option>`).join('')}</select></div>
      </div>
      <div class="mpc-routine-checks">${TYPE_OPTIONS.map(t=>`<label class="mpc-routine-check"><input type="checkbox" data-type="${escapeAttr(t)}" ${(w.types||[]).includes(t)?'checked':''}>${t}</label>`).join('')}</div>
      <div class="mpc-routine-video"><label><input type="checkbox" data-field="videoOnly" ${w.videoOnly?'checked':''}> Somente videoaula nesta janela</label></div>
    </div>`;
  }

  function currentWindows(){
    if(config.mode==='12x36')return activeScaleProfile==='work'?config.workWindows:config.offWindows;
    return config.windows;
  }

  function renderBuilder(){
    const box=$('#mpcRoutineBuilder');if(!box)return;
    $$('.mpc-routine-mode').forEach(b=>b.classList.toggle('active',b.dataset.routineMode===config.mode));
    if(config.mode==='continuous'){
      box.innerHTML='<p class="helper">O sistema usa as horas disponíveis como teto diário, preserva uma sessão contínua e distribui teoria, exercícios e revisões ao longo do período sem exigir o preenchimento de toda a capacidade.</p>';
      updateCapacity();return;
    }
    if(config.mode==='12x36'){
      box.innerHTML=`
        <div class="mpc-routine-scale-grid">
          <div class="field"><label>Data de referência da escala</label><input id="mpcRoutineReferenceDate" type="date" value="${escapeAttr(config.referenceDate||$('#adminStartDate')?.value||'')}"></div>
          <div class="field"><label>Nessa data o aluno estará</label><select id="mpcRoutineReferenceStatus"><option value="work" ${config.referenceStatus==='work'?'selected':''}>Trabalhando</option><option value="off" ${config.referenceStatus==='off'?'selected':''}>De folga</option></select></div>
        </div>
        <div class="mpc-routine-tabs"><button type="button" class="mpc-routine-tab ${activeScaleProfile==='work'?'active':''}" data-scale-profile="work">Dia de trabalho</button><button type="button" class="mpc-routine-tab ${activeScaleProfile==='off'?'active':''}" data-scale-profile="off">Dia de folga</button></div>
        <div id="mpcRoutineWindows">${currentWindows().map(windowHtml).join('')}</div>
        <div class="mpc-routine-actions"><button type="button" class="btn btn-primary btn-small" id="mpcAddRoutineWindow">+ Adicionar janela neste perfil</button><button type="button" class="btn btn-secondary btn-small" id="mpcResetRoutine">Restaurar exemplo 12x36</button></div>`;
    }else{
      box.innerHTML=`
        <div id="mpcRoutineWindows">${currentWindows().map(windowHtml).join('')}</div>
        <div class="mpc-routine-actions"><button type="button" class="btn btn-primary btn-small" id="mpcAddRoutineWindow">+ Adicionar janela de estudo</button><button type="button" class="btn btn-secondary btn-small" id="mpcResetRoutine">Carregar exemplo completo</button></div>`;
    }
    bindBuilder();
    updateCapacity();
  }

  function bindBuilder(){
    $('#mpcRoutineReferenceDate')?.addEventListener('change',e=>{config.referenceDate=e.target.value;saveConfig()});
    $('#mpcRoutineReferenceStatus')?.addEventListener('change',e=>{config.referenceStatus=e.target.value;saveConfig()});
    $$('[data-scale-profile]').forEach(btn=>btn.addEventListener('click',()=>{activeScaleProfile=btn.dataset.scaleProfile;renderBuilder()}));
    $('#mpcAddRoutineWindow')?.addEventListener('click',()=>{
      currentWindows().push({moment:'Nova janela',time:'',duration:30,environment:'Casa',types:['Teoria','Exercícios','Revisão'],videoOnly:false});
      saveConfig();renderBuilder();
    });
    $('#mpcResetRoutine')?.addEventListener('click',()=>{
      if(config.mode==='12x36'){
        config.workWindows=clone(DEFAULTS.work);config.offWindows=clone(DEFAULTS.off);
      }else config.windows=clone(DEFAULTS.fragmented);
      saveConfig();renderBuilder();
    });
    $$('[data-remove-window]').forEach(btn=>btn.addEventListener('click',()=>{
      const arr=currentWindows();arr.splice(Number(btn.dataset.removeWindow),1);saveConfig();renderBuilder();
    }));
    $$('.mpc-routine-window').forEach((box,index)=>{
      const arr=currentWindows(),w=arr[index];
      box.querySelector('[data-field="moment"]')?.addEventListener('input',e=>{w.moment=e.target.value;saveConfig()});
      box.querySelector('[data-field="time"]')?.addEventListener('change',e=>{w.time=e.target.value;saveConfig()});
      box.querySelector('[data-field="duration"]')?.addEventListener('change',e=>{w.duration=Number(e.target.value)||30;saveConfig()});
      box.querySelector('[data-field="environment"]')?.addEventListener('change',e=>{w.environment=e.target.value;saveConfig()});
      box.querySelector('[data-field="videoOnly"]')?.addEventListener('change',e=>{w.videoOnly=e.target.checked;saveConfig()});
      box.querySelectorAll('[data-type]').forEach(c=>c.addEventListener('change',()=>{
        w.types=[...box.querySelectorAll('[data-type]:checked')].map(x=>x.dataset.type);saveConfig();
      }));
    });
  }

  function updateCapacity(){
    const box=$('#mpcRoutineCapacity');if(!box)return;
    if(config.mode==='continuous'){
      const minutes=Math.max(15,Math.round((Number($('#adminHoursPerDay')?.value)||0)*60));
      box.innerHTML=`<strong>Capacidade diária máxima:</strong> ${formatMinutes(minutes)}. No estudo contínuo, esse tempo funciona como teto: o cronograma pode planejar menos quando houver espaço suficiente até a prova.`;
      return;
    }
    const sum=arr=>arr.reduce((s,w)=>s+(Number(w.duration)||0),0);
    if(config.mode==='12x36'){
      box.innerHTML=`<strong>Capacidade configurada:</strong> dia de trabalho ${formatMinutes(sum(config.workWindows))} · dia de folga ${formatMinutes(sum(config.offWindows))}. O gerador alternará os dois perfis automaticamente a partir da data de referência.`;
    }else{
      box.innerHTML=`<strong>Capacidade diária configurada:</strong> ${formatMinutes(sum(config.windows))} distribuídos em ${config.windows.length} janela(s). As janelas serão repetidas nos dias de estudo selecionados.`;
    }
  }

  function formatMinutes(m){
    const h=Math.floor(m/60),r=m%60;
    return h?(r?`${h}h${String(r).padStart(2,'0')}`:`${h}h`):`${r} min`;
  }
  function escapeAttr(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function modeChanged(mode){
    config.mode=mode;saveConfig();renderBuilder();
  }

  function timeMinutes(v){
    if(!/^\d{2}:\d{2}$/.test(String(v||'')))return null;
    const [h,m]=v.split(':').map(Number);return h*60+m;
  }
  function timeText(total){
    total=((total%1440)+1440)%1440;
    return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
  }
  function parseDate(v){const d=new Date(`${v}T12:00:00`);return Number.isNaN(d.getTime())?null:d}
  function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function dayDiff(a,b){return Math.round((parseDate(b)-parseDate(a))/86400000)}
  function taskCategory(task){
    const s=String(task.type||'').toLowerCase();
    if(s.includes('revis'))return'review';
    if(s.includes('exerc')||s.includes('quest'))return'exercise';
    if(s.includes('teoria'))return'theory';
    return'study';
  }
  function allowed(slot,category){
    const types=Array.isArray(slot.types)?slot.types:[];
    if(!types.length)return true;
    if(category==='theory')return types.includes('Teoria');
    if(category==='exercise')return types.includes('Exercícios')||types.includes('Exercícios corrigidos');
    if(category==='review')return types.some(t=>['Revisão','Resumo','Lei seca','Flashcards'].includes(t));
    return true;
  }
  function durationOf(task){
    const a=timeMinutes(task.start),b=timeMinutes(task.end);
    return a!==null&&b!==null&&b>a?b-a:30;
  }
  function stripBasePrefix(activity){
    return String(activity||'').replace(/^\s*(Teoria|Exercícios|Exercicios|Revisão|Revisao)\s*[-:–—]?\s*/i,'').trim();
  }
  function topicKey(task){
    const subject=String(task.subject||'Disciplina').trim().toLowerCase();
    const raw=stripBasePrefix(task.activity).replace(/\s*·\s*Parte\s+\d+\s+de\s+\d+\s*$/i,'').trim();
    const match=raw.match(/^Tópico:\s*(.*?)\s*\|\s*Subtópico:/i);
    const topic=(match?.[1]||raw.split(/\s+[—–]\s+|\s+-\s+/)[0]||raw).trim().toLowerCase();
    return `${subject}|${topic}`;
  }
  function activityFor(task,slot){
    const body=stripBasePrefix(task.activity);
    if(!slot.videoOnly)return task.activity;
    const cat=taskCategory(task);
    if(cat==='theory')return `Videoaula de teoria - ${body}`;
    if(cat==='exercise')return `Videoaula de exercícios corrigidos - ${body}`;
    if(cat==='review')return `Videoaula de revisão ou resumo - ${body}`;
    return `Videoaula - ${body}`;
  }
  function noteFor(slot,mode){
    const parts=[MODE_LABELS[mode]||'Rotina personalizada',slot.moment||'Janela de estudo',slot.environment||''];
    if(slot.videoOnly)parts.push('Somente videoaula');
    return parts.filter(Boolean).join(' · ');
  }

  function planRange(){
    const start=$('#adminStartDate')?.value;
    const exam=$('#adminExamDate')?.value;
    const planDays=Math.max(1,Number($('#adminPlanDays')?.value)||1);
    const s=parseDate(start);if(!s)return null;
    let end=addDays(s,planDays-1);
    if(exam){
      const e=parseDate(exam);
      if(e&&e>s&&end>=e)end=addDays(e,-1);
    }
    return {start:s,end,exam:exam?parseDate(exam):null};
  }

  function studyWeekdays(){
    return new Set($$('#adminAvailableDays input:checked').map(i=>Number(i.value)));
  }

  function effectiveWindowsForDate(date){
    if(config.mode==='12x36'){
      const ref=config.referenceDate||$('#adminStartDate')?.value;
      if(!ref)return [];
      const diff=Math.abs(dayDiff(ref,dateKey(date)));
      const same=diff%2===0;
      const profile=same?config.referenceStatus:(config.referenceStatus==='work'?'off':'work');
      return profile==='work'?config.workWindows:config.offWindows;
    }
    return config.windows;
  }

  function buildSlots(simDateKeys){
    const range=planRange();if(!range)return [];
    const weekdays=studyWeekdays();
    const slots=[];
    const continuousMinutes=Math.max(15,Math.round((Number($('#adminHoursPerDay')?.value)||1)*60));
    const continuousStart=timeMinutes($('#adminPreferredStart')?.value||'19:00')??1140;
    for(let d=new Date(range.start);d<=range.end;d=addDays(d,1)){
      const key=dateKey(d);
      if(simDateKeys.has(key))continue;
      if(config.mode!=='12x36'){
        const mondayIndex=(d.getDay()+6)%7;
        if(!weekdays.has(mondayIndex))continue;
      }
      if(config.mode==='continuous'){
        slots.push({date:key,start:continuousStart,duration:continuousMinutes,used:0,moment:'Sessão contínua',environment:'',types:[],videoOnly:false});
        continue;
      }
      const windows=effectiveWindowsForDate(d);
      let fallback=timeMinutes($('#adminPreferredStart')?.value||'19:00')??1140;
      [...windows].sort((a,b)=>(timeMinutes(a.time)??9999)-(timeMinutes(b.time)??9999)).forEach(w=>{
        const start=timeMinutes(w.time)??fallback;
        const duration=Math.max(5,Number(w.duration)||30);
        slots.push({date:key,start,duration,used:0,moment:w.moment||'Janela de estudo',environment:w.environment||'',types:Array.isArray(w.types)?w.types:[],videoOnly:Boolean(w.videoOnly)});
        fallback=start+duration;
      });
    }
    return slots;
  }

  function syncBaseCapacityBeforeGenerate(){
    if(config.mode==='continuous')return;
    const sum=arr=>arr.reduce((s,w)=>s+(Number(w.duration)||0),0);
    let maxMinutes=config.mode==='12x36'?Math.max(sum(config.workWindows),sum(config.offWindows)):sum(config.windows);
    maxMinutes=Math.max(15,maxMinutes);
    const hours=$('#adminHoursPerDay');
    if(hours){hours.value=(maxMinutes/60).toFixed(2);hours.dispatchEvent(new Event('change',{bubbles:true}))}
    if(config.mode==='12x36'){
      $$('#adminAvailableDays input').forEach(i=>{i.checked=true;i.dispatchEvent(new Event('change',{bubbles:true}))});
      if(!config.referenceDate){config.referenceDate=$('#adminStartDate')?.value||'';saveConfig()}
    }
    const first=(config.mode==='12x36'?[...config.workWindows,...config.offWindows]:config.windows)
      .map(w=>w.time).filter(Boolean).sort()[0];
    if(first&&$('#adminPreferredStart')){$('#adminPreferredStart').value=first;$('#adminPreferredStart').dispatchEvent(new Event('change',{bubbles:true}))}
  }

  function groupSlotsByDate(slots){
    const map=new Map();
    slots.forEach(slot=>{if(!map.has(slot.date))map.set(slot.date,[]);map.get(slot.date).push(slot)});
    return map;
  }
  function slotRemaining(slot){return Math.max(0,slot.duration-slot.used)}
  function capacityFor(slots,categories){
    return slots.reduce((sum,slot)=>sum+(categories.some(cat=>allowed(slot,cat))?slotRemaining(slot):0),0);
  }
  function itemEligible(item,slot,date,ctx){
    if(item.remaining<=0)return false;
    const category=taskCategory(item.task);
    if(!allowed(slot,category))return false;
    const key=topicKey(item.task);
    const originalDate=String(item.task?.date||'');
    const earliest=category==='theory'?(ctx.topicEarliest.get(key)||originalDate):originalDate;
    if(earliest&&date<earliest)return false;
    if(category==='exercise'&&ctx.theoryTopics.has(key)){
      const completed=ctx.theoryCompleted.get(key);
      if(!completed)return false;
      const gap=Number(ctx.exerciseGapDays)||0;
      if(dayDiff(completed,date)<gap)return false;
    }
    if(category==='theory'&&!ctx.theoryStarted.has(key)&&ctx.newTheoryTopicsToday>=ctx.maxNewTopicsPerDay)return false;
    return true;
  }
  function createSegment(item,slot,take){
    const start=slot.start+slot.used;
    const segment={
      ...item.task,
      id:`${item.task.id||'task'}-${config.mode==='continuous'?'ct':'fr'}-${item.segments.length+1}-${Math.random().toString(36).slice(2,6)}`,
      date:slot.date,
      day:(parseDate(slot.date).getDay()+6)%7,
      start:timeText(start),
      end:timeText(start+take),
      activity:activityFor(item.task,slot),
      notes:config.mode==='continuous'?String(item.task.notes||''):noteFor(slot,config.mode),
      done:false,
      _source:item
    };
    slot.used+=take;
    item.remaining-=take;
    item.segments.push(segment);
    return segment;
  }
  function remainingMinutes(items){return items.reduce((sum,item)=>sum+Math.max(0,item.remaining),0)}
  function appendPartLabels(items){
    items.forEach(item=>{
      const n=item.segments.length;
      if(n>1)item.segments.forEach((seg,i)=>{seg.activity=`${seg.activity} · Bloco ${i+1} de ${n}`});
    });
  }

  function scheduleAcquisition(items,slots,protectedDays,options={}){
    const allDates=[...new Set(slots.map(s=>s.date))].sort();
    if(!allDates.length)return {ok:false,created:[],lastDate:'',remaining:remainingMinutes(items)};
    const range=planRange();
    const protectedStart=range?.exam?dateKey(addDays(range.exam,-protectedDays)):'';
    const usableDates=protectedStart?allDates.filter(d=>d<protectedStart):allDates;
    const usableSlots=slots.filter(s=>usableDates.includes(s.date));
    const need=remainingMinutes(items);
    const theoreticalCapacity=capacityFor(usableSlots,['theory','exercise','study']);
    if(theoreticalCapacity<need)return {ok:false,created:[],lastDate:'',capacity:theoreticalCapacity,need,remaining:need-theoreticalCapacity,reason:'capacity'};

    const byDate=groupSlotsByDate(usableSlots);
    const theoryTopics=new Set(items.filter(x=>taskCategory(x.task)==='theory').map(x=>topicKey(x.task)));
    const topicEarliest=new Map();
    items.forEach(item=>{
      const key=topicKey(item.task),date=String(item.task?.date||'');
      if(date&&(!topicEarliest.has(key)||date<topicEarliest.get(key)))topicEarliest.set(key,date);
    });
    const ctx={theoryTopics,topicEarliest,theoryCompleted:new Map(),theoryStarted:new Set(),newTheoryTopicsToday:0,maxNewTopicsPerDay:Number.isFinite(options.maxNewTopicsPerDay)?options.maxNewTopicsPerDay:2,exerciseGapDays:Number(options.exerciseGapDays)||0};
    const created=[];
    let lastDate='';
    const minDaily=config.mode==='continuous'?30:15;
    const minSegment=config.mode==='continuous'?15:10;
    for(let di=0;di<usableDates.length&&remainingMinutes(items)>0;di++){
      const date=usableDates[di];
      const daySlots=byDate.get(date)||[];
      ctx.newTheoryTopicsToday=0;
      const remainingNeed=remainingMinutes(items);
      const remainingSlots=usableDates.slice(di).flatMap(d=>byDate.get(d)||[]);
      const remainingCapacity=Math.max(1,capacityFor(remainingSlots,['theory','exercise','study']));
      const dayCapacity=capacityFor(daySlots,['theory','exercise','study']);
      const proportional=Math.max(minDaily,Math.ceil(remainingNeed*dayCapacity/remainingCapacity));
      let dayBudget=options.fillMode==='capacity'?dayCapacity:Math.min(dayCapacity,proportional);
      let placedToday=0;
      for(const slot of daySlots){
        while(slotRemaining(slot)>0&&placedToday<dayBudget&&remainingMinutes(items)>0){
          const eligible=items.map((item,index)=>({item,index,category:taskCategory(item.task)})).filter(x=>itemEligible(x.item,slot,date,ctx));
          if(!eligible.length)break;
          eligible.sort((a,b)=>{const rank=c=>c==='exercise'?0:c==='theory'?1:2;const ra=rank(a.category),rb=rank(b.category);if(ra!==rb)return ra-rb;return a.item.originalIndex-b.item.originalIndex;});
          const index=eligible[0].index;
          const item=items[index];
          const category=taskCategory(item.task);
          const key=topicKey(item.task);
          if(category==='theory'&&!ctx.theoryStarted.has(key)){ctx.theoryStarted.add(key);ctx.newTheoryTopicsToday++;}
          const take=Math.min(item.remaining,slotRemaining(slot),dayBudget-placedToday);
          if(take<minSegment&&item.remaining>take)break;
          if(take<=0)break;
          created.push(createSegment(item,slot,take));
          placedToday+=take;
          lastDate=date;
          if(item.remaining<=0){if(category==='theory')ctx.theoryCompleted.set(key,date);items.splice(index,1);}
        }
      }
    }
    return {ok:remainingMinutes(items)===0,created,lastDate,remaining:remainingMinutes(items),capacity:theoreticalCapacity,need};
  }

  function scheduleReviews(items,slots,preferredStart){
    const created=[];
    if(!items.length)return {ok:true,created,lastDate:''};
    const available=slots.filter(s=>slotRemaining(s)>0);
    const validForItem=(item,slot)=>allowed(slot,'review')&&item.remaining>0&&(!item.task?.date||slot.date>=String(item.task.date));
    const preferred=available.filter(s=>!preferredStart||s.date>=preferredStart);
    const scheduleInto=pool=>{
      for(const slot of pool){
        while(slotRemaining(slot)>0&&items.length){
          const index=items.findIndex(item=>validForItem(item,slot));
          if(index<0)break;
          const item=items[index];
          const take=Math.min(item.remaining,slotRemaining(slot));
          if(take<10&&item.remaining>take)break;
          if(take<=0)break;
          created.push(createSegment(item,slot,take));
          if(item.remaining<=0)items.splice(index,1);
        }
      }
    };
    scheduleInto(preferred);
    if(items.length)scheduleInto(available.filter(s=>!preferred.includes(s)));
    const lastDate=created.length?created[created.length-1].date:'';
    return {ok:items.length===0,created,lastDate,remaining:remainingMinutes(items)};
  }

  function transformGeneratedSchedule(){
    const status=$('#adminGenerationStatus');
    if(!status||!status.classList.contains('success'))return false;
    let state;
    try{state=JSON.parse(localStorage.getItem(STATE_KEY)||'null')}catch{return false}
    if(!state||!Array.isArray(state.tasks)||!state.tasks.length)return false;

    const simulations=state.tasks.filter(t=>String(t.type||'').toLowerCase().includes('simulado'));
    const reviews=state.tasks.filter(t=>taskCategory(t)==='review');
    const acquisition=state.tasks.filter(t=>!String(t.type||'').toLowerCase().includes('simulado')&&taskCategory(t)!=='review').sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    const simDates=new Set(simulations.map(t=>t.date).filter(Boolean));
    const slots=buildSlots(simDates);
    if(!slots.length){alert('Não há períodos de estudo disponíveis dentro do intervalo configurado. O cronograma original foi mantido.');return false}

    const range=planRange();
    const strategies=[
      {maxNewTopicsPerDay:2,exerciseGapDays:1,fillMode:'proportional',label:'preferencial'},
      {maxNewTopicsPerDay:2,exerciseGapDays:0,fillMode:'proportional',label:'2 tópicos/dia'},
      {maxNewTopicsPerDay:3,exerciseGapDays:0,fillMode:'proportional',label:'3 tópicos/dia'},
      {maxNewTopicsPerDay:999,exerciseGapDays:0,fillMode:'capacity',label:'capacidade máxima'}
    ];
    let chosen=null;
    let bestFailure=null;
    for(let protectedDays=range?.exam?7:0;protectedDays>=0;protectedDays=protectedDays>3?protectedDays-1:(protectedDays===3?0:-1)){
      for(const strategy of strategies){
        const trialSlots=slots.map(s=>({...s,used:0}));
        const trialItems=acquisition.map((task,index)=>({task,remaining:durationOf(task),originalIndex:index,segments:[]}));
        const trial=scheduleAcquisition(trialItems,trialSlots,protectedDays,strategy);
        if(!bestFailure||trial.remaining<bestFailure.trial.remaining)bestFailure={trial,protectedDays,strategy};
        if(trial.ok){chosen={protectedDays,strategy};break}
      }
      if(chosen)break;
    }
    if(!chosen){
      const missing=Math.max(0,bestFailure?.trial?.remaining||0);
      const suffix=missing?` Faltam aproximadamente ${formatMinutes(missing)} de capacidade compatível.`:'';
      alert(`Mesmo usando toda a capacidade disponível, não foi possível encaixar teoria e exercícios até a prova sem quebrar a ordem pedagógica. O cronograma original foi mantido.${suffix}`);
      return false;
    }

    const actualItems=acquisition.map((task,index)=>({task,remaining:durationOf(task),originalIndex:index,segments:[]}));
    const actualSlots=slots.map(s=>({...s,used:0}));
    const acquisitionScheduled=scheduleAcquisition(actualItems,actualSlots,chosen.protectedDays,chosen.strategy);
    if(!acquisitionScheduled.ok){alert(`Não foi possível concluir a distribuição. Faltam aproximadamente ${formatMinutes(acquisitionScheduled.remaining||0)}. O cronograma original foi mantido.`);return false}

    const reviewStart=range?.exam&&chosen.protectedDays>0?dateKey(addDays(range.exam,-chosen.protectedDays)):'';
    const actualReviewItems=reviews.map((task,index)=>({task,remaining:durationOf(task),originalIndex:index,segments:[]}));
    const reviewScheduled=scheduleReviews(actualReviewItems,actualSlots,reviewStart);
    if(!reviewScheduled.ok){alert(`A teoria e os exercícios couberam, mas faltam aproximadamente ${formatMinutes(reviewScheduled.remaining||0)} para as revisões. O cronograma original foi mantido.`);return false}

    const created=[...acquisitionScheduled.created,...reviewScheduled.created];
    const usedSources=[...new Set(created.map(x=>x._source).filter(Boolean))];
    appendPartLabels(usedSources);
    created.forEach(x=>delete x._source);
    const merged=[...created,...simulations].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));
    merged.forEach((t,i)=>t.cycleOrder=i);
    state.tasks=merged;
    state.studyRoutine=clone(config);
    state.studyRoutine.planningStrategy={
      capacityIsCeiling:true,
      preferredMaxNewTheoryTopicsPerDay:2,
      appliedMaxNewTheoryTopicsPerDay:chosen.strategy.maxNewTopicsPerDay,
      theoryBeforeExercises:true,
      exerciseNextDayPreferred:chosen.strategy.exerciseGapDays===1,
      preserveTopicEarliestDate:true,
      repairTheoryBeforeExerciseByTopic:true,
      protectedFinalReviewDays:chosen.protectedDays,
      distributionMode:chosen.strategy.label,
      continuousSessionPreserved:config.mode==='continuous'
    };
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state))}catch{return false}
    return true;
  }

  function wrapPublishing(){
    const previous=window.fetch;
    if(!previous||previous.__mpcRoutineWrapped)return;
    async function wrapped(input,opts={}){
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        const method=(opts.method||input?.method||'GET').toUpperCase();
        if(method==='POST'&&/\/api\/plans(?:\?|$)/.test(url)&&typeof opts.body==='string'){
          const body=JSON.parse(opts.body);
          body.studyRoutine=clone(config);
          opts={...opts,body:JSON.stringify(body)};
        }
      }catch{}
      return previous.call(this,input,opts);
    }
    wrapped.__mpcRoutineWrapped=true;
    window.fetch=wrapped;
  }

  function bindGeneration(){
    const btn=$('#adminGenerateScheduleBtn');if(!btn)return;
    btn.addEventListener('click',()=>syncBaseCapacityBeforeGenerate(),true);
    btn.addEventListener('click',()=>{
      setTimeout(()=>{
        if(transformGeneratedSchedule()){
          try{sessionStorage.setItem('mpcRoutineJustApplied',config.mode)}catch{}
          location.reload();
        }
      },80);
    });
    try{
      const applied=sessionStorage.getItem('mpcRoutineJustApplied');
      if(applied){
        sessionStorage.removeItem('mpcRoutineJustApplied');
        const message=applied==='continuous'
          ?'Distribuição pedagógica inteligente aplicada ao estudo contínuo. A carga diária foi tratada como teto e o conteúdo foi reorganizado ao longo do período.'
          :'Rotina de estudo aplicada ao cronograma. Os horários foram reorganizados conforme as janelas configuradas.';
        setTimeout(()=>alert(message),250);
      }
    }catch{}
  }

  function init(){
    if(!document.getElementById('adminPanel'))return;
    injectStyles();makeCard();
    $$('.mpc-routine-mode').forEach(btn=>btn.addEventListener('click',()=>modeChanged(btn.dataset.routineMode)));
    renderBuilder();bindGeneration();wrapPublishing();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();