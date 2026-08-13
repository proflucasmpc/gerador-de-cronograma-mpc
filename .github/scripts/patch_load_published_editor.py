from pathlib import Path

p=Path('admin-enhancements.js')
s=p.read_text()

s=s.replace("  const BYPASS_KEY='mpc-admin-capture-bypass-v1';\n", "  const BYPASS_KEY='mpc-admin-capture-bypass-v1';\n  const EDITING_KEY='mpcAdminEditingPublishedPlanV1';\n  const ADMIN_DRAFT_KEY='geradorCronogramaMpcAdminDraft';\n  const STATE_KEY='geradorCronogramaMpcData';\n  const ROUTINE_KEY='mpcAdminStudyRoutineV1';\n")

old="""  function rememberPublished(path,manageKey=''){\n    if(!path||!/^\\/plano\\/[A-Z0-9]+/i.test(path))return;\n    const previous=findRecent(path);\n    const items=loadRecent().filter(x=>x.path!==path);\n    items.unshift({path,manageKey:manageKey||previous?.manageKey||'',name:val('#adminStudentName')||previous?.name||'Aluno não informado',goal:val('#adminGoal')||previous?.goal||'Objetivo não informado',createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:previous?.updatedAt||''});\n    saveRecent(items);renderRecent();showPublishedActions(path);\n  }\n  function markUpdated(path){const items=loadRecent();const item=items.find(x=>x.path===path);if(item){item.name=val('#adminStudentName')||item.name;item.goal=val('#adminGoal')||item.goal;item.updatedAt=new Date().toISOString();saveRecent(items)}renderRecent();showPublishedActions(path)}\n  function removeRecent(path){saveRecent(loadRecent().filter(x=>x.path!==path));renderRecent();const box=$('#mpcPublishedActions');if(box)box.innerHTML=''}\n"""
new=r"""  function readJsonStorage(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
  function loadEditing(){return readJsonStorage(EDITING_KEY,null)}
  function setEditing(data){try{localStorage.setItem(EDITING_KEY,JSON.stringify(data))}catch{}renderEditingBanner();renderRecent()}
  function clearEditing(path=''){const current=loadEditing();if(!path||current?.path===path){try{localStorage.removeItem(EDITING_KEY)}catch{}renderEditingBanner();renderRecent()}}
  function currentSnapshots(){return {draftSnapshot:readJsonStorage(ADMIN_DRAFT_KEY,null),routineSnapshot:readJsonStorage(ROUTINE_KEY,null)}}

  function rememberPublished(path,manageKey=''){
    if(!path||!/^\/plano\/[A-Z0-9]+/i.test(path))return;
    const previous=findRecent(path),snap=currentSnapshots();
    const name=val('#adminStudentName')||previous?.name||'Aluno não informado';
    const goal=val('#adminGoal')||previous?.goal||'Objetivo não informado';
    const items=loadRecent().filter(x=>x.path!==path);
    items.unshift({path,manageKey:manageKey||previous?.manageKey||'',name,goal,createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:previous?.updatedAt||'',draftSnapshot:snap.draftSnapshot||previous?.draftSnapshot||null,routineSnapshot:snap.routineSnapshot||previous?.routineSnapshot||null});
    saveRecent(items);setEditing({path,name,goal,manageKey:manageKey||previous?.manageKey||'',loadedAt:new Date().toISOString()});renderRecent();showPublishedActions(path);
  }
  function markUpdated(path){const items=loadRecent();const item=items.find(x=>x.path===path);if(item){const snap=currentSnapshots();item.name=val('#adminStudentName')||item.name;item.goal=val('#adminGoal')||item.goal;item.updatedAt=new Date().toISOString();item.draftSnapshot=snap.draftSnapshot||item.draftSnapshot||null;item.routineSnapshot=snap.routineSnapshot||item.routineSnapshot||null;saveRecent(items);setEditing({path,name:item.name,goal:item.goal,manageKey:item.manageKey||'',loadedAt:new Date().toISOString()})}renderRecent();showPublishedActions(path)}
  function removeRecent(path){saveRecent(loadRecent().filter(x=>x.path!==path));clearEditing(path);renderRecent();const box=$('#mpcPublishedActions');if(box)box.innerHTML=''}
"""
if old not in s: raise SystemExit('remember block not found')
s=s.replace(old,new)

anchor="  function injectGuidanceIntoBody(opts){"
idx=s.index(anchor)
helpers=r'''  function dateDiffDays(a,b){const x=new Date(`${a}T12:00:00`),y=new Date(`${b}T12:00:00`);return Number.isNaN(x.getTime())||Number.isNaN(y.getTime())?0:Math.round((y-x)/86400000)}
  function taskMinutes(task){const toMin=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};const a=toMin(task?.start),b=toMin(task?.end);return a!==null&&b!==null&&b>a?b-a:30}
  function median(values,fallback=60){const a=values.map(Number).filter(v=>Number.isFinite(v)&&v>0).sort((x,y)=>x-y);if(!a.length)return fallback;return a[Math.floor(a.length/2)]}
  function cleanPublishedTopic(activity=''){
    return String(activity||'')
      .replace(/^\s*Videoaula\s+de\s+(?:teoria|exercícios?\s+corrigidos|revisão\s+ou\s+resumo)\s*-\s*/i,'')
      .replace(/^\s*(?:Teoria|Exercícios?|Revisão)\s*[-:–—]\s*/i,'')
      .replace(/\s*·\s*(?:Bloco|Parte)\s+\d+\s+de\s+\d+\s*$/i,'')
      .trim();
  }
  function inferSubjects(plan){
    const tasks=Array.isArray(plan.tasks)?plan.tasks:[];
    const listed=Array.isArray(plan.subjects)?plan.subjects:[];
    const names=[...new Set([...listed.map(x=>x?.name),...tasks.map(x=>x?.subject)].map(x=>String(x||'').trim()).filter(Boolean))];
    return names.map((name,index)=>{
      const related=tasks.filter(t=>String(t.subject||'').trim()===name&&!/simulado/i.test(String(t.type||''))&&!/revis/i.test(String(t.type||'')));
      const theory=related.filter(t=>/teoria/i.test(String(t.type||''))||/^\s*(?:Videoaula\s+de\s+teoria|Teoria)/i.test(String(t.activity||'')));
      const source=theory.length?theory:related;
      const seen=new Set(),topics=[];
      source.forEach(t=>{const topic=cleanPublishedTopic(t.activity);const key=topic.toLocaleLowerCase('pt-BR');if(topic.length>1&&!seen.has(key)){seen.add(key);topics.push(topic)}});
      const meta=listed.find(x=>String(x?.name||'').trim()===name)||{};
      const level=String(meta.level||'intermediario');
      const difficulty=level==='iniciante'?'dificil':level==='avancado'?'facil':'intermediario';
      return {id:`loaded-${Date.now()}-${index}`,name,difficulty,sessionMinutes:median(source.map(taskMinutes),60),topicsText:topics.join('\n')};
    });
  }
  function inferSimulation(plan,startDate){
    const sims=(Array.isArray(plan.tasks)?plan.tasks:[]).filter(t=>/simulado/i.test(`${t.type||''} ${t.activity||''}`)).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    if(!sims.length)return {simulationEnabled:false,simulationMode:'interval_days',simulationInterval:15,simulationWeekdays:[6],simulationWeekday:6,simulationType:'full',simulationMinutes:240,simulationStart:'08:00'};
    const weekdays=[...new Set(sims.map(t=>Number(t.day)).filter(n=>n>=0&&n<=6))];
    const diffs=sims.slice(1).map((t,i)=>dateDiffDays(sims[i].date,t.date)).filter(n=>n>0);
    const sameWeekday=weekdays.length===1&&diffs.length&&diffs.every(n=>n%7===0);
    const interval=sameWeekday?Math.max(1,Math.round(median(diffs,14)/7)):Math.max(1,median(diffs,Math.max(1,dateDiffDays(startDate,sims[0]?.date)||15)));
    return {simulationEnabled:true,simulationMode:sameWeekday?'weekday_occurrence':'interval_days',simulationInterval:interval,simulationWeekdays:weekdays.length?weekdays:[Number(sims[0]?.day??6)],simulationWeekday:weekdays[0]??Number(sims[0]?.day??6),simulationType:/parcial/i.test(String(sims[0]?.activity||''))?'partial':'full',simulationMinutes:median(sims.map(taskMinutes),240),simulationStart:String(sims[0]?.start||'08:00')};
  }
  function draftFromPublished(plan){
    const tasks=Array.isArray(plan.tasks)?plan.tasks:[];
    const startDate=String(plan.startDate||tasks[0]?.date||'');
    const examDate=String(plan.examDate||'');
    const endDate=String(plan.endDate||tasks.at(-1)?.date||'');
    const planDays=examDate&&startDate?Math.max(1,dateDiffDays(startDate,examDate)):Math.max(1,dateDiffDays(startDate,endDate)+1);
    const studyTasks=tasks.filter(t=>!/simulado/i.test(`${t.type||''} ${t.activity||''}`));
    const availableDays=[...new Set(studyTasks.map(t=>Number(t.day)).filter(n=>n>=0&&n<=6))].sort((a,b)=>a-b);
    const sim=inferSimulation(plan,startDate);
    return {
      studentName:String(plan.studentName||''),goal:String(plan.goal||''),scheduleStyle:String(plan.scheduleStyle||'weekly'),planDays,startDate,examDate,
      hoursPerDay:Math.max(.25,Number(plan.hoursPerDay)||2),sessionMinutes:median(studyTasks.map(taskMinutes),60),preferredStart:String(studyTasks[0]?.start||'19:00'),
      availableDays:availableDays.length?availableDays:[0,1,2,3,4],workSchedule:'',studyMaterial:'',examLevel:'',competitionLevel:'',salary:'',boardStyle:'',generalGuidance:String(plan.generalGuidance||''),
      includeTheory:tasks.some(t=>/teoria/i.test(`${t.type||''} ${t.activity||''}`)),includeExercises:tasks.some(t=>/exerc|quest/i.test(`${t.type||''} ${t.activity||''}`)),includeReviews:tasks.some(t=>/revis/i.test(`${t.type||''} ${t.activity||''}`)),replaceSchedule:true,
      ...sim,pdfTheme:'premium_masculino',pdfLogoEnabled:false,pdfLogoName:'',pdfButtonEnabled:false,pdfButtonText:'Acesse aqui',pdfButtonUrl:'',pdfButtonPosition:'footer-right',subjects:inferSubjects(plan)
    };
  }
  function renderEditingBanner(){
    const box=$('#mpcEditingPlanBanner');if(!box)return;const editing=loadEditing();
    if(!editing?.path){box.hidden=true;box.innerHTML='';return}
    box.hidden=false;box.innerHTML=`<strong>Editando página publicada: ${esc(editing.name||'Aluno')}</strong><span>${esc(editing.goal||'')} · ${esc(editing.path)}</span>`;
  }
  async function loadPublishedIntoEditor(path){
    const item=findRecent(path);if(!item)return alert('Este cronograma não foi encontrado na lista deste navegador.');
    const current=val('#adminStudentName')||'o cronograma aberto';
    if(!confirm(`Carregar ${item.name||'este aluno'} no editor? O rascunho atualmente aberto (${current}) será substituído.`))return;
    const id=planId(path);if(!id)return alert('Link de cronograma inválido.');
    try{
      const response=await fetch(`/api/plans?id=${encodeURIComponent(id)}`,{cache:'no-store'});const plan=await response.json().catch(()=>({}));if(!response.ok)throw new Error(plan.error||'Não foi possível carregar o cronograma publicado.');
      const exact=Boolean(item.draftSnapshot);const draft=exact?JSON.parse(JSON.stringify(item.draftSnapshot)):draftFromPublished(plan);
      localStorage.setItem(ADMIN_DRAFT_KEY,JSON.stringify(draft));
      if(item.routineSnapshot||plan.studyRoutine)localStorage.setItem(ROUTINE_KEY,JSON.stringify(item.routineSnapshot||plan.studyRoutine));
      const old=readJsonStorage(STATE_KEY,{})||{};
      const state={...old,studentName:plan.studentName||draft.studentName||'',goal:plan.goal||draft.goal||'',examDate:plan.examDate||draft.examDate||'',hoursPerDay:Number(plan.hoursPerDay)||draft.hoursPerDay||2,sessionMinutes:draft.sessionMinutes||60,preferredStart:draft.preferredStart||'19:00',availableDays:draft.availableDays||[0,1,2,3,4],scheduleStyle:plan.scheduleStyle||draft.scheduleStyle||'weekly',startDate:plan.startDate||draft.startDate||'',endDate:plan.endDate||'',subjects:Array.isArray(plan.subjects)?plan.subjects:[],tasks:Array.isArray(plan.tasks)?plan.tasks:[],adminGenerated:true,adminPersonalization:{...(old.adminPersonalization||{}),studentName:plan.studentName||draft.studentName||'',goal:plan.goal||draft.goal||'',examDate:plan.examDate||draft.examDate||'',startDate:plan.startDate||draft.startDate||'',endDate:plan.endDate||''}};
      localStorage.setItem(STATE_KEY,JSON.stringify(state));
      setEditing({path,name:plan.studentName||item.name||'Aluno',goal:plan.goal||item.goal||'',manageKey:item.manageKey||'',loadedAt:new Date().toISOString(),reconstructed:!exact});
      sessionStorage.setItem('mpcAdminLoadedPublishedPlanMessage',exact?`${plan.studentName||item.name} foi carregado no editor com o rascunho administrativo salvo.`:`${plan.studentName||item.name} foi carregado no editor. Como esta publicação é anterior ao recurso de restauração, alguns campos administrativos foram reconstruídos a partir do cronograma publicado. Revise o Resumo Inteligente antes de gerar.`);
      location.reload();
    }catch(error){alert(error.message||'Erro ao carregar o cronograma publicado.')}
  }

'''
s=s[:idx]+helpers+s[idx:]

old_update="  async function updatePublished(path){const item=findRecent(path);if(!item?.manageKey){alert('Esta página foi publicada antes da função de gerenciamento. Publique uma nova página uma vez para habilitar futuras atualizações no mesmo link.');return}if(!confirm('Atualizar esta página com o cronograma que está aberto agora? O link continuará o mesmo.'))return;pendingUpdate={path,manageKey:item.manageKey};const button=$('#publicPageBtn');if(!button){pendingUpdate=null;alert('Não foi possível localizar o botão de publicação.');return}button.click()}"
new_update="  async function updatePublished(path){const item=findRecent(path);if(!item?.manageKey){alert('Esta página foi publicada antes da função de gerenciamento. Publique uma nova página uma vez para habilitar futuras atualizações no mesmo link.');return}const editing=loadEditing();if(editing?.path!==path){alert(`Proteção contra troca de aluno: antes de atualizar ${item.name||'esta página'}, clique em “Carregar no editor” neste cronograma. Assim o sistema confirma que você está editando o aluno correto.`);document.getElementById('mpcRecentSection')?.scrollIntoView({behavior:'smooth',block:'start'});return}if(!confirm(`Atualizar a página de ${item.name||'este aluno'} com o cronograma que está aberto agora? O link continuará o mesmo.`))return;pendingUpdate={path,manageKey:item.manageKey};const button=$('#publicPageBtn');if(!button){pendingUpdate=null;alert('Não foi possível localizar o botão de publicação.');return}button.click()}"
if old_update not in s: raise SystemExit('updatePublished not found')
s=s.replace(old_update,new_update)

old_status="  function makeStatusBar(){const bar=document.createElement('div');bar.className='mpc-admin-statusbar';bar.innerHTML=`<div><div class=\"mpc-admin-ready\" id=\"mpcAdminReady\"><i></i><span>Preencha os dados essenciais</span></div><div class=\"mpc-admin-save-state\" id=\"mpcAdminSaveState\">Rascunho ainda não salvo nesta sessão.</div></div><div class=\"mpc-admin-actions\"><button type=\"button\" id=\"mpcQuickPreview\">Visualizar como aluno</button><button type=\"button\" id=\"mpcCaptureBypassBtn\">${bypassButtonLabel()}</button><button type=\"button\" id=\"mpcQuickGenerate\" class=\"primary\">Ir para gerar</button><a href=\"${GROUP_URL}\" target=\"_blank\" rel=\"noopener\">Grupo gratuito do gerador</a></div>`;return bar}\n"
new_status="  function makeStatusBar(){const bar=document.createElement('div');bar.className='mpc-admin-statusbar';bar.innerHTML=`<div><div class=\"mpc-admin-ready\" id=\"mpcAdminReady\"><i></i><span>Preencha os dados essenciais</span></div><div class=\"mpc-admin-save-state\" id=\"mpcAdminSaveState\">Rascunho ainda não salvo nesta sessão.</div></div><div class=\"mpc-admin-actions\"><button type=\"button\" id=\"mpcQuickPreview\">Visualizar como aluno</button><button type=\"button\" id=\"mpcCaptureBypassBtn\">${bypassButtonLabel()}</button><button type=\"button\" id=\"mpcQuickGenerate\" class=\"primary\">Ir para gerar</button><a href=\"${GROUP_URL}\" target=\"_blank\" rel=\"noopener\">Grupo gratuito do gerador</a></div>`;return bar}\n  function makeEditingBanner(){const box=document.createElement('div');box.id='mpcEditingPlanBanner';box.hidden=true;box.style.cssText='margin:10px 0 16px;padding:12px 16px;border:1px solid #8A5CFF;border-left:5px solid #8A5CFF;border-radius:10px;background:color-mix(in srgb,#8A5CFF 7%,var(--surface));display:flex;gap:8px 16px;align-items:center;flex-wrap:wrap';return box}\n"
if old_status not in s: raise SystemExit('status block not found')
s=s.replace(old_status,new_status)

old_shell="if(head){head.insertAdjacentElement('afterend',makeDashboard());head.nextElementSibling.insertAdjacentElement('afterend',makeStatusBar())}"
new_shell="if(head){head.insertAdjacentElement('afterend',makeDashboard());head.nextElementSibling.insertAdjacentElement('afterend',makeStatusBar());head.nextElementSibling.nextElementSibling.insertAdjacentElement('afterend',makeEditingBanner())}"
if old_shell not in s: raise SystemExit('shell insertion not found')
s=s.replace(old_shell,new_shell)

old_recent="""  function makeRecentSection(){const sec=document.createElement('section');sec.className='mpc-admin-recent mpc-admin-section-anchor';sec.id='mpcRecentSection';sec.innerHTML=`<div class=\"section-title\"><div><h3>Cronogramas publicados recentemente</h3><p class=\"helper\">Os links novos podem ser atualizados sem mudar de endereço ou excluídos diretamente deste navegador.</p></div><div class=\"field\" style=\"min-width:min(320px,100%)\"><input id=\"mpcRecentSearch\" type=\"search\" placeholder=\"Buscar por aluno ou concurso\"></div></div><div class=\"mpc-admin-recent-list\" id=\"mpcRecentList\"></div><div id=\"mpcPublishedActions\"></div>`;const panel=$('#adminPanel');const generate=document.getElementById('mpc-sec-gerar');(generate?.parentElement||panel)?.appendChild(sec);$('#mpcRecentSearch')?.addEventListener('input',renderRecent);renderRecent()}\n  function renderRecent(){const list=$('#mpcRecentList');if(!list)return;const q=($('#mpcRecentSearch')?.value||'').toLowerCase().trim();const items=loadRecent().filter(x=>!q||`${x.name} ${x.goal}`.toLowerCase().includes(q));if(!items.length){list.innerHTML='<div class=\"mpc-admin-empty\">Nenhum cronograma publicado registrado neste navegador.</div>';return}list.innerHTML=items.slice(0,20).map(x=>{const managed=Boolean(x.manageKey);const status=managed?(x.updatedAt?` · atualizado ${esc(ptDate(x.updatedAt))}`:' · gerenciamento ativo'):' · publicação antiga';return `<div class=\"mpc-admin-recent-item\"><div><strong>${esc(x.name)}</strong><small>${esc(x.goal)} · ${esc(ptDate(x.createdAt))}${status}</small></div><div class=\"mpc-admin-actions\"><a href=\"${esc(x.path)}\" target=\"_blank\" rel=\"noopener\">Abrir</a>${managed?`<button type=\"button\" data-update-plan=\"${esc(x.path)}\">Atualizar página</button><button type=\"button\" data-delete-plan=\"${esc(x.path)}\" data-mpc-confirmed=\"1\">Excluir página</button>`:''}</div></div>`}).join('');$$('[data-update-plan]',list).forEach(btn=>btn.addEventListener('click',()=>updatePublished(btn.dataset.updatePlan)));$$('[data-delete-plan]',list).forEach(btn=>btn.addEventListener('click',()=>deletePublished(btn.dataset.deletePlan)))}\n"""
new_recent=r"""  function makeRecentSection(){const sec=document.createElement('section');sec.className='mpc-admin-recent mpc-admin-section-anchor';sec.id='mpcRecentSection';sec.innerHTML=`<div class="section-title"><div><h3>Cronogramas publicados recentemente</h3><p class="helper">Use “Carregar no editor” antes de alterar um aluno. A atualização do link fica bloqueada se outro cronograma estiver aberto.</p></div><div class="field" style="min-width:min(320px,100%)"><input id="mpcRecentSearch" type="search" placeholder="Buscar por aluno ou concurso"></div></div><div class="mpc-admin-recent-list" id="mpcRecentList"></div><div id="mpcPublishedActions"></div>`;const panel=$('#adminPanel');const generate=document.getElementById('mpc-sec-gerar');(generate?.parentElement||panel)?.appendChild(sec);$('#mpcRecentSearch')?.addEventListener('input',renderRecent);renderRecent()}
  function renderRecent(){const list=$('#mpcRecentList');if(!list)return;const editing=loadEditing();const q=($('#mpcRecentSearch')?.value||'').toLowerCase().trim();const items=loadRecent().filter(x=>!q||`${x.name} ${x.goal}`.toLowerCase().includes(q));if(!items.length){list.innerHTML='<div class="mpc-admin-empty">Nenhum cronograma publicado registrado neste navegador.</div>';return}list.innerHTML=items.slice(0,20).map(x=>{const managed=Boolean(x.manageKey),active=editing?.path===x.path;const status=managed?(x.updatedAt?` · atualizado ${esc(ptDate(x.updatedAt))}`:' · gerenciamento ativo'):' · publicação antiga';return `<div class="mpc-admin-recent-item" ${active?'style="box-shadow:inset 4px 0 0 #8A5CFF"':''}><div><strong>${esc(x.name)}${active?' · EDITANDO':''}</strong><small>${esc(x.goal)} · ${esc(ptDate(x.createdAt))}${status}</small></div><div class="mpc-admin-actions"><a href="${esc(x.path)}" target="_blank" rel="noopener">Abrir</a><button type="button" data-load-plan="${esc(x.path)}" class="primary">Carregar no editor</button>${managed?`<button type="button" data-update-plan="${esc(x.path)}">Atualizar página</button><button type="button" data-delete-plan="${esc(x.path)}" data-mpc-confirmed="1">Excluir página</button>`:''}</div></div>`}).join('');$$('[data-load-plan]',list).forEach(btn=>btn.addEventListener('click',()=>loadPublishedIntoEditor(btn.dataset.loadPlan)));$$('[data-update-plan]',list).forEach(btn=>btn.addEventListener('click',()=>updatePublished(btn.dataset.updatePlan)));$$('[data-delete-plan]',list).forEach(btn=>btn.addEventListener('click',()=>deletePublished(btn.dataset.deletePlan)))}
"""
if old_recent not in s: raise SystemExit('recent block not found')
s=s.replace(old_recent,new_recent)

old_init="  function init(){const panel=$('#adminPanel');if(!panel)return;installFetchObserver();buildShell(panel);makeRecentSection();installLiveUpdates();installSaveFeedback();installDestructiveGuards();loadStudyRoutineModule()}"
new_init="  function init(){const panel=$('#adminPanel');if(!panel)return;installFetchObserver();buildShell(panel);makeRecentSection();renderEditingBanner();installLiveUpdates();installSaveFeedback();installDestructiveGuards();loadStudyRoutineModule();try{const msg=sessionStorage.getItem('mpcAdminLoadedPublishedPlanMessage');if(msg){sessionStorage.removeItem('mpcAdminLoadedPublishedPlanMessage');setTimeout(()=>alert(msg),300)}}catch{}}"
if old_init not in s: raise SystemExit('init not found')
s=s.replace(old_init,new_init)

p.write_text(s)

admin=Path('admin.html')
a=admin.read_text()
a=a.replace('<script src="/admin-enhancements.js"></script>','<script src="/admin-enhancements.js?v=20260812-6"></script>')
admin.write_text(a)
