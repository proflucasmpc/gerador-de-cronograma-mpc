(()=>{
'use strict';
const ACCESS_STORAGE_KEY='geradorCronogramaMpcData';
const WIZARD_STORAGE_KEY='mpcGuidedUserFlowV1';
const WHATSAPP='5511960189699';
const OFFER_MS=15*60*1000;
const SESSION_MINUTES=50;
const DAY_LABELS=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const steps=[
 {title:'Objetivo',kicker:'Etapa 1',desc:'Defina exatamente para qual prova ou processo seletivo você está se preparando.'},
 {title:'Datas',kicker:'Etapa 2',desc:'Informe o período real disponível para estudo.'},
 {title:'Disponibilidade',kicker:'Etapa 3',desc:'Organize os dias e a carga horária que podem ser usados.'},
 {title:'Matérias',kicker:'Etapa 4',desc:'Cadastre todas as matérias que precisam entrar no cronograma.'},
 {title:'Tópicos',kicker:'Etapa 5',desc:'Separe os tópicos principais de cada matéria.'},
 {title:'Subtópicos',kicker:'Etapa 6',desc:'Detalhe os conteúdos para melhorar a distribuição.'},
 {title:'Estratégia',kicker:'Etapa 7',desc:'Defina revisões, simulados e prioridades.'},
 {title:'Conferência',kicker:'Etapa 8',desc:'Confira se a estrutura está completa antes de gerar.'},
 {title:'Gerar link',kicker:'Etapa 9',desc:'Crie sua página compartilhável do cronograma.'}
];
const initialState=()=>({
 step:0,started:false,startAt:null,offerShown:false,servicePending:false,serviceOpenedAt:0,
 name:'',goal:'',goalDetail:'',startDate:'',examDate:'',blockedDates:'',hours:'2',routine:'Regular',preferredStart:'18:00',
 availableDays:[1,2,3,4,5,6],subjects:['Português','Matemática'],topics:{'Português':[],'Matemática':[]},subs:{},
 priority:'Equilibrada',reviews:true,sims:true,finalWeek:false,rules:'',publicUrl:'',lastPlanId:''
});
function readAccess(){try{return JSON.parse(localStorage.getItem(ACCESS_STORAGE_KEY)||'{}')}catch{return {}}}
if(!readAccess().registered){location.replace('/');return;}
function loadState(){try{return {...initialState(),...JSON.parse(localStorage.getItem(WIZARD_STORAGE_KEY)||'{}')}}catch{return initialState()}}
let state=loadState();
const el=id=>document.getElementById(id), intro=el('introScreen'), wizard=el('wizardScreen'), footer=el('wizardFooter'), timerBox=el('timerBox'), clock=el('timerClock'), offer=el('offerModal');
function persist(){localStorage.setItem(WIZARD_STORAGE_KEY,JSON.stringify(state))}
function toast(msg){const t=el('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function isoDate(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function parseDate(v){if(!v)return null;const d=new Date(`${v}T12:00:00`);return Number.isNaN(d.getTime())?null:d}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function minutesToClock(total){total=((total%(24*60))+(24*60))%(24*60);return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`}
function clockToMinutes(v){const [h,m]=String(v||'18:00').split(':').map(Number);return (Number.isFinite(h)?h:18)*60+(Number.isFinite(m)?m:0)}
function saveCurrent(){
 document.querySelectorAll('[data-bind]').forEach(inp=>{const k=inp.dataset.bind;state[k]=inp.type==='checkbox'?inp.checked:inp.value});
 const days=[...document.querySelectorAll('[data-day]:checked')].map(x=>Number(x.dataset.day));if(document.querySelectorAll('[data-day]').length)state.availableDays=days;
 persist();
}
function renderNav(){el('stepNav').innerHTML=steps.map((s,i)=>`<button type="button" class="${i===state.step?'active':''}" data-go="${i}">${i+1}. ${s.title}</button>`).join('');document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{saveCurrent();state.step=Number(b.dataset.go);renderStep()});}
function textField(label,key,placeholder,type='text',extra=''){return `<div class="field"><label>${label}</label><input type="${type}" data-bind="${key}" value="${esc(state[key]||'')}" placeholder="${placeholder}" ${extra}></div>`}
function renderSubjects(){return `<div class="subject-builder">${state.subjects.map((s,i)=>`<div class="subject-row"><div class="subject-row-head"><div><strong>${esc(s)}</strong><br><small>Matéria ${i+1}</small></div><button class="btn btn-muted" type="button" data-remove-subject="${i}">Remover</button></div></div>`).join('')}<div class="field"><label>Adicionar matéria</label><div style="display:flex;gap:8px"><input id="newSubject" placeholder="Ex.: Direito Constitucional"><button class="add-btn" type="button" id="addSubject">+ ADICIONAR</button></div></div></div>`}
function renderTopics(){return `<div class="topic-editor">${state.subjects.map(s=>`<div class="topic-block"><h4>${esc(s)}</h4><textarea data-topic="${esc(s)}" placeholder="Digite um tópico por linha">${esc((state.topics[s]||[]).join('\n'))}</textarea><span class="hint">Um tópico por linha. Use os tópicos do conteúdo programático do seu edital.</span></div>`).join('')}</div>`}
function renderSubs(){return `<div class="topic-editor">${state.subjects.map(s=>`<div class="topic-block"><h4>${esc(s)}</h4>${(state.topics[s]||[]).map(t=>`<div class="field" style="margin-top:8px"><label>${esc(t)}</label><textarea data-subject="${esc(s)}" data-topicname="${esc(t)}" placeholder="Digite os subtópicos, um por linha">${esc(((state.subs[s]||{})[t]||[]).join('\n'))}</textarea></div>`).join('')||'<span class="hint">Cadastre os tópicos na etapa anterior.</span>'}</div>`).join('')}</div>`}
function summaryCounts(){let topics=0,subs=0;state.subjects.forEach(s=>{topics+=(state.topics[s]||[]).length;(state.topics[s]||[]).forEach(t=>subs+=((state.subs[s]||{})[t]||[]).length)});return{topics,subs}}
function renderStep(){
 renderNav();const s=steps[state.step];el('stepCounter').textContent=`PASSO ${state.step+1} DE ${steps.length}`;el('backBtn').disabled=state.step===0;el('nextBtn').textContent=state.step===steps.length-1?(state.publicUrl?'GERAR NOVO LINK →':'GERAR LINK →'):'PRÓXIMO →';let body='';
 if(state.step===0) body=`<div class="form-grid">${textField('Seu nome','name','Digite seu nome')} ${textField('Concurso, vestibular ou objetivo','goal','Ex.: Soldado PM-SP')}<div class="field full"><label>O que você quer alcançar?</label><textarea data-bind="goalDetail" placeholder="Descreva brevemente seu objetivo, cargo, instituição ou resultado esperado.">${esc(state.goalDetail||'')}</textarea></div></div><div class="difficulty-note">Quanto mais específico for o objetivo, melhor será a organização das próximas etapas.</div>`;
 if(state.step===1) body=`<div class="form-grid">${textField('Data de início','startDate','', 'date')}${textField('Data da prova','examDate','', 'date')}<div class="field full"><label>Existe alguma data em que você não poderá estudar?</label><textarea data-bind="blockedDates" placeholder="Ex.: 12/09 - viagem; feriados específicos">${esc(state.blockedDates||'')}</textarea><span class="hint">Este campo fica registrado como orientação. Os dias semanais disponíveis são definidos na próxima etapa.</span></div></div>`;
 if(state.step===2) body=`<div class="form-grid">${textField('Horas disponíveis por dia','hours','Ex.: 2','number','min="1" max="12" step="0.5"')}${textField('Horário preferido de início','preferredStart','18:00','time')}<div class="field full"><label>Estilo de rotina</label><select data-bind="routine"><option ${state.routine==='Regular'?'selected':''}>Regular</option><option ${state.routine==='Variável'?'selected':''}>Variável</option><option ${state.routine==='Somente dias úteis'?'selected':''}>Somente dias úteis</option><option ${state.routine==='Inclui fins de semana'?'selected':''}>Inclui fins de semana</option></select></div><div class="field full"><label>Dias disponíveis</label><div class="chips">${[1,2,3,4,5,6,0].map(d=>`<label class="choice"><input type="checkbox" data-day="${d}" ${state.availableDays.includes(d)?'checked':''}> ${DAY_LABELS[d]}</label>`).join('')}</div></div></div><div class="difficulty-note">Confira sua disponibilidade real. Ela define quantos blocos caberão até a prova.</div>`;
 if(state.step===3) body=renderSubjects();
 if(state.step===4) body=renderTopics();
 if(state.step===5) body=renderSubs();
 if(state.step===6) body=`<div class="form-grid"><div class="field full"><label>Como deseja distribuir as matérias?</label><select data-bind="priority"><option ${state.priority==='Equilibrada'?'selected':''}>Equilibrada</option><option ${state.priority==='Dar mais tempo às matérias difíceis'?'selected':''}>Dar mais tempo às matérias difíceis</option><option ${state.priority==='Dar mais tempo às matérias com maior peso'?'selected':''}>Dar mais tempo às matérias com maior peso</option></select></div><div class="field full"><label>Revisões e simulados</label><div class="chips"><label class="choice"><input type="checkbox" data-bind="reviews" ${state.reviews?'checked':''}> Incluir revisões</label><label class="choice"><input type="checkbox" data-bind="sims" ${state.sims?'checked':''}> Incluir simulados</label><label class="choice"><input type="checkbox" data-bind="finalWeek" ${state.finalWeek?'checked':''}> Reservar reta final</label></div></div><div class="field full"><label>Observações importantes</label><textarea data-bind="rules" placeholder="Ex.: Matemática precisa aparecer 3 vezes por semana; não estudar domingo à noite...">${esc(state.rules||'')}</textarea></div></div>`;
 if(state.step===7){const c=summaryCounts();body=`<div class="review-card"><h4>Objetivo</h4><p>${esc(state.name||'Nome não informado')} · ${esc(state.goal||'Objetivo não informado')}</p></div><div class="review-card"><h4>Período</h4><p>${esc(state.startDate||'—')} até ${esc(state.examDate||'—')} · ${esc(state.hours||'—')}h/dia</p></div><div class="review-card"><h4>Matérias</h4><p>${state.subjects.map(esc).join(' · ')||'Nenhuma matéria cadastrada'}</p></div><div class="review-card"><h4>Conteúdo</h4><p>${c.topics} tópicos e ${c.subs} subtópicos cadastrados.</p></div><div class="difficulty-note">Na próxima etapa o sistema valida a capacidade do período e monta os blocos automaticamente.</div>`}
 if(state.step===8) body=`<div class="link-result"><div class="eyebrow">Página pronta para compartilhar</div><h3>Seu cronograma poderá virar um link</h3><p>Na área do usuário não há exportação em PDF. A entrega final é a página compartilhável no padrão visual MPC.</p><div class="viral-banner"><strong>“Eu, ${esc(state.name||'você')}, gerei este cronograma de estudos gratuitamente com o Gerador de Cronograma MPC.”</strong><p>Essa identificação aparecerá somente nos links criados pela área gratuita do usuário. Os links criados pela área administrativa permanecem sem essa faixa.</p></div><div class="fake-link" id="fakeLink">${state.publicUrl?`<a href="${esc(state.publicUrl)}" target="_blank" rel="noopener">${esc(state.publicUrl)}</a>`:'O link será criado quando você clicar em “GERAR LINK”.'}</div>${state.publicUrl?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><a class="btn btn-primary" href="${esc(state.publicUrl)}" target="_blank" rel="noopener">ABRIR PÁGINA</a><button class="btn btn-purple" type="button" id="copyLink">COPIAR LINK</button></div>`:''}</div>`;
 el('stepCard').innerHTML=`<div class="step-kicker">${s.kicker}</div><h2>${s.title}</h2><p>${s.desc}</p>${body}`;bindDynamic();persist();
}
function bindDynamic(){
 document.querySelectorAll('[data-remove-subject]').forEach(b=>b.onclick=()=>{const old=state.subjects[Number(b.dataset.removeSubject)];state.subjects.splice(Number(b.dataset.removeSubject),1);delete state.topics[old];delete state.subs[old];persist();renderStep()});
 const add=el('addSubject');if(add)add.onclick=()=>{const i=el('newSubject');const v=i.value.trim();if(v&&!state.subjects.some(x=>x.toLowerCase()===v.toLowerCase())){state.subjects.push(v);state.topics[v]=[];persist();renderStep()}};
 document.querySelectorAll('[data-topic]').forEach(t=>t.oninput=()=>{state.topics[t.dataset.topic]=t.value.split('\n').map(x=>x.trim()).filter(Boolean);persist()});
 document.querySelectorAll('[data-subject]').forEach(t=>t.oninput=()=>{const s=t.dataset.subject,topic=t.dataset.topicname;state.subs[s] ||= {};state.subs[s][topic]=t.value.split('\n').map(x=>x.trim()).filter(Boolean);persist()});
 const cp=el('copyLink');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(state.publicUrl);toast('Link copiado.')}catch{prompt('Copie o link:',state.publicUrl)}};
}
function validateStep(){saveCurrent();
 if(state.step===0&&(!state.name.trim()||!state.goal.trim()))return 'Informe seu nome e o objetivo do cronograma.';
 if(state.step===1){const a=parseDate(state.startDate),b=parseDate(state.examDate);if(!a||!b)return 'Informe a data de início e a data da prova.';if(a>=b)return 'A data da prova precisa ser posterior à data de início.'}
 if(state.step===2){if(!(Number(state.hours)>0))return 'Informe uma carga horária diária válida.';if(!state.availableDays.length)return 'Selecione pelo menos um dia disponível.'}
 if(state.step===3&&!state.subjects.length)return 'Cadastre pelo menos uma matéria.';
 if(state.step===4&&state.subjects.some(s=>!(state.topics[s]||[]).length))return 'Cadastre pelo menos um tópico para cada matéria.';
 return '';
}
function buildContentUnits(){const units=[];state.subjects.forEach(subject=>{const topics=state.topics[subject]||[];topics.forEach(topic=>{const subs=((state.subs[subject]||{})[topic]||[]);if(subs.length)subs.forEach(subtopic=>units.push({subject,topic,subtopic}));else units.push({subject,topic,subtopic:''})})});return units}
function buildTasks(){
 const start=parseDate(state.startDate),exam=parseDate(state.examDate);if(!start||!exam)throw new Error('Datas inválidas.');
 const end=addDays(exam,-1),days=[];for(let d=new Date(start);d<=end;d=addDays(d,1)){if(state.availableDays.includes(d.getDay()))days.push(new Date(d))}
 if(!days.length)throw new Error('Não há dias disponíveis no período informado.');
 const units=buildContentUnits();if(!units.length)throw new Error('Cadastre tópicos para gerar o cronograma.');
 const perDay=Math.max(1,Math.floor(Number(state.hours||2)*60/SESSION_MINUTES));const capacity=days.length*perDay;
 let queue=[];units.forEach(u=>{queue.push({...u,type:'Teoria'});queue.push({...u,type:'Exercícios'})});
 if(state.reviews){const seen=new Set();units.forEach(u=>{const k=`${u.subject}|${u.topic}`;if(!seen.has(k)){seen.add(k);queue.push({...u,subtopic:'',type:'Revisão'})}})}
 if(state.sims){const weeks=Math.max(1,Math.floor(days.length/7));for(let i=0;i<Math.max(1,Math.floor(weeks/2));i++)queue.push({subject:'Simulado geral',topic:'Questões das matérias já estudadas',subtopic:'',type:'Simulado'})}
 if(queue.length>capacity)throw new Error(`O período comporta cerca de ${capacity} blocos, mas seu conteúdo exige aproximadamente ${queue.length}. Aumente as horas/dias disponíveis ou antecipe a data de início.`);
 const tasks=[];let q=0;const startMin=clockToMinutes(state.preferredStart);
 for(const date of days){for(let slot=0;slot<perDay&&q<queue.length;slot++,q++){const item=queue[q],begin=startMin+slot*SESSION_MINUTES,endm=begin+SESSION_MINUTES;const activity=item.subtopic?`${item.topic} — ${item.subtopic}`:item.topic;tasks.push({id:`USR-${tasks.length+1}-${isoDate(date)}`,date:isoDate(date),day:tasks.length+1,start:minutesToClock(begin),end:minutesToClock(endm),subject:item.subject,activity,type:item.type,done:false})}if(q>=queue.length)break}
 return tasks;
}
async function publishPlan(){
 const error=validateStep();if(error){toast(error);return}
 let tasks;try{tasks=buildTasks()}catch(err){toast(err.message||'Não foi possível gerar o cronograma.');return}
 const payload={studentName:state.name.trim(),creatorName:state.name.trim(),createdByUser:true,goal:state.goal.trim(),examDate:state.examDate,startDate:state.startDate,endDate:state.examDate,hoursPerDay:Number(state.hours)||0,scheduleStyle:'guided',subjects:state.subjects.map(name=>({name,priority:3,level:'Intermediário'})),tasks};
 el('nextBtn').disabled=true;el('nextBtn').textContent='GERANDO LINK…';
 try{const r=await fetch('/api/plans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Não foi possível publicar o cronograma.');state.lastPlanId=data.id||'';state.publicUrl=new URL(data.path||`/plano/${data.id}`,location.origin).href;persist();renderStep();try{await navigator.clipboard.writeText(state.publicUrl);toast('Página criada e link copiado.')}catch{toast('Página criada com sucesso.')}}catch(err){toast(err.message||'Erro ao criar a página.')}finally{el('nextBtn').disabled=false;el('nextBtn').textContent='GERAR NOVO LINK →'}
}
function start(){state.started=true;state.startAt=Date.now();state.offerShown=false;state.servicePending=false;persist();intro.classList.add('hidden');wizard.classList.add('active');footer.classList.remove('hidden');timerBox.classList.add('active');renderStep();tick();window.scrollTo({top:0,behavior:'smooth'})}
let ticking=false;function tick(){if(ticking||!state.started)return;ticking=true;const run=()=>{if(!state.started){ticking=false;return}const elapsed=Math.max(0,Date.now()-Number(state.startAt||Date.now()));const sec=Math.floor(elapsed/1000),m=Math.floor(sec/60),s=sec%60;clock.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');if(elapsed>=OFFER_MS&&!state.offerShown&&!state.servicePending){state.offerShown=true;persist();offer.classList.add('visible')}setTimeout(run,500)};run()}
function resetCreation(){const keepAccess=readAccess().registered;state=initialState();localStorage.setItem(WIZARD_STORAGE_KEY,JSON.stringify(state));if(keepAccess){try{const access=readAccess();access.registered=true;localStorage.setItem(ACCESS_STORAGE_KEY,JSON.stringify(access))}catch{}}wizard.classList.remove('active');footer.classList.add('hidden');timerBox.classList.remove('active');offer.classList.remove('visible');intro.classList.remove('hidden');clock.textContent='00:00';window.scrollTo({top:0,behavior:'smooth'});toast('Criação reiniciada. Seu acesso continua liberado.')}
el('startBtn').onclick=start;
el('backBtn').onclick=()=>{saveCurrent();if(state.step>0){state.step--;renderStep()}};
el('nextBtn').onclick=async()=>{const err=validateStep();if(err){toast(err);return}if(state.step<steps.length-1){state.step++;renderStep();window.scrollTo({top:90,behavior:'smooth'})}else await publishPlan()};
el('offerNo').onclick=()=>{state.offerShown=true;persist();offer.classList.remove('visible');toast('Você continuará exatamente da etapa atual.')};
el('offerYes').onclick=()=>{saveCurrent();state.servicePending=true;state.serviceOpenedAt=Date.now();persist();const msg=`Olá, professor Lucas! Meu nome é ${state.name||'não informado'} e estou utilizando o Gerador de Cronograma MPC. Gostaria que você criasse meu cronograma de estudos personalizado.\n\nObjetivo: ${state.goal||'não informado'}\nEtapa atual: ${state.step+1} de ${steps.length}`;offer.classList.remove('visible');window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank');toast('WhatsApp aberto. Ao retornar, a criação será reiniciada.')};
let becameHidden=false;document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.servicePending)becameHidden=true;if(!document.hidden&&state.servicePending&&becameHidden)setTimeout(resetCreation,300)});window.addEventListener('focus',()=>{if(state.servicePending&&Date.now()-Number(state.serviceOpenedAt||0)>1200)setTimeout(resetCreation,300)});window.addEventListener('pageshow',()=>{if(state.servicePending&&Date.now()-Number(state.serviceOpenedAt||0)>1200)setTimeout(resetCreation,300)});
window.scrollToPreview=()=>el('previewFinal').scrollIntoView({behavior:'smooth',block:'start'});
// Restore an interrupted guided creation without showing the access capture again.
if(state.started){intro.classList.add('hidden');wizard.classList.add('active');footer.classList.remove('hidden');timerBox.classList.add('active');renderStep();tick()}else{intro.classList.remove('hidden')}
})();
