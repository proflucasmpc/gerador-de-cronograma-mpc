(()=>{
  'use strict';
  const RECENT_KEY='mpcAdminRecentPublishedPlansV1';
  const EDITING_KEY='mpcAdminEditingPublishedPlanV1';
  const STATE_KEY='geradorCronogramaMpcData';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const BUTTONS_KEY='mpcAdminPublicPageButtonsV1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const val=id=>String($(id)?.value||'').trim();
  const planId=path=>String(path||'').match(/\/plano\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()||'';
  const parseDate=v=>{const d=new Date(`${String(v||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const toMin=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const toTime=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  const minutes=t=>{const a=toMin(t?.start),b=toMin(t?.end);return a!==null&&b!==null&&b>a?b-a:30};
  const category=t=>{const s=`${t?.type||''} ${t?.activity||''}`.toLocaleLowerCase('pt-BR');if(/simulado/.test(s))return'simulation';if(/revis|resumo|flashcard|lei seca/.test(s))return'review';if(/exerc|quest/.test(s))return'exercise';if(/teoria|videoaula/.test(s))return'theory';return'study'};
  const cleanButtons=items=>(Array.isArray(items)?items:[]).slice(0,8).map(item=>({text:String(item?.text||'').trim(),url:String(item?.url||'').trim(),style:['primary','navy','gold','green','outline'].includes(item?.style)?item.style:'primary',enabled:item?.enabled!==false})).filter(item=>item.text&&item.url);
  function cleanActivity(activity=''){return String(activity||'').replace(/^\s*Videoaula\s+de\s+(?:teoria|exercícios?\s+corrigidos|revisão\s+ou\s+resumo)\s*-\s*/i,'').replace(/^\s*(?:Teoria|Exercícios?|Revisão)\s*[-:–—]?\s*/i,'').replace(/\s*·\s*(?:Bloco|Parte)\s+\d+\s+de\s+\d+\s*$/i,'').trim()}
  function topicKey(task){const subject=String(task?.subject||'').trim().toLocaleLowerCase('pt-BR');const raw=cleanActivity(task?.activity||'');const match=raw.match(/^Tópico:\s*(.*?)\s*\|\s*Subtópico:/i);const topic=(match?.[1]||raw.split(/\s+[—–]\s+|\s+-\s+/)[0]||raw).trim().toLocaleLowerCase('pt-BR');return `${subject}|${topic}`}
  function recentItem(path){return (read(RECENT_KEY,[])||[]).find(item=>item.path===path)||null}
  function editing(){return read(EDITING_KEY,null)}
  function currentButtons(){const state=read(STATE_KEY,{})||{},draft=read(DRAFT_KEY,{})||{};return cleanButtons(read(BUTTONS_KEY,[])||draft.publicPageButtons||state.publicPageButtons||[])}
  function availableWeekdays(state){const checked=$$('#adminAvailableDays input:checked').map(i=>Number(i.value)).filter(n=>n>=0&&n<=6);if(checked.length)return new Set(checked);const saved=(state.availableDays||[]).map(Number).filter(n=>n>=0&&n<=6);return new Set(saved.length?saved:[0,1,2,3,4])}
  function routineWindowsForDate(date,routine,state){
    const preferred=toMin(val('#adminPreferredStart')||state.preferredStart||'07:00')??420;
    const hours=Math.max(.25,Number(val('#adminHoursPerDay')||state.hoursPerDay||1));
    if(!routine||routine.mode==='continuous')return[{start:preferred,duration:Math.round(hours*60),moment:'Sessão contínua',environment:'',types:[]}];
    let source=[];
    if(routine.mode==='12x36'){
      const ref=parseDate(routine.referenceDate||state.startDate);if(!ref)return[];
      const diff=Math.abs(Math.round((date-ref)/86400000)),same=diff%2===0;
      const profile=same?(routine.referenceStatus||'work'):((routine.referenceStatus||'work')==='work'?'off':'work');
      source=profile==='work'?(routine.workWindows||[]):(routine.offWindows||[]);
    }else source=routine.windows||[];
    return source.map(w=>({start:toMin(w.time)??preferred,duration:Math.max(5,Number(w.duration)||30),moment:w.moment||'Janela de estudo',environment:w.environment||'',types:Array.isArray(w.types)?w.types:[]})).sort((a,b)=>a.start-b.start);
  }
  function subtractBusy(window,busy){let parts=[[window.start,window.start+window.duration]];for(const [bs,be] of busy){parts=parts.flatMap(([a,b])=>{if(be<=a||bs>=b)return[[a,b]];const out=[];if(bs>a)out.push([a,Math.min(bs,b)]);if(be<b)out.push([Math.max(be,a),b]);return out})}return parts.filter(([a,b])=>b-a>=10).map(([a,b])=>({...window,start:a,duration:b-a,used:0}))}
  function allows(slot,cat){if(!slot.types?.length)return true;const types=slot.types.map(x=>String(x).toLocaleLowerCase('pt-BR'));if(cat==='theory')return types.some(x=>/teoria/.test(x));if(cat==='exercise')return types.some(x=>/exerc/.test(x));return true}
  function rebalanceForDailyCapacity(){
    const state=read(STATE_KEY,null);if(!state||!Array.isArray(state.tasks)||!state.tasks.length)return{ok:false,reason:'Não há cronograma gerado no editor.'};
    const routine=read(ROUTINE_KEY,state.studyRoutine||{mode:'continuous'})||{mode:'continuous'};
    const fixed=state.tasks.filter(t=>['review','simulation'].includes(category(t)));
    const acquisition=state.tasks.filter(t=>!['review','simulation'].includes(category(t)));
    const simDates=new Set(fixed.filter(t=>category(t)==='simulation').map(t=>t.date).filter(Boolean));
    const busyByDate=new Map();for(const t of fixed.filter(t=>category(t)==='review')){const a=toMin(t.start),b=toMin(t.end);if(!t.date||a===null||b===null||b<=a)continue;if(!busyByDate.has(t.date))busyByDate.set(t.date,[]);busyByDate.get(t.date).push([a,b])}
    const start=parseDate(state.startDate||val('#adminStartDate'));if(!start)return{ok:false,reason:'Data inicial inválida.'};
    let end=parseDate(state.endDate||'');if(!end){const days=Math.max(1,Number(val('#adminPlanDays'))||1);end=addDays(start,days-1)}
    const exam=parseDate(state.examDate||val('#adminExamDate'));if(exam&&end>=exam)end=addDays(exam,-1);
    const weekdays=availableWeekdays(state),slots=[];
    for(let d=new Date(start);d<=end;d=addDays(d,1)){
      const key=dateKey(d);if(simDates.has(key))continue;
      const mondayIndex=(d.getDay()+6)%7;if(routine.mode!=='12x36'&&!weekdays.has(mondayIndex))continue;
      const busy=busyByDate.get(key)||[];for(const w of routineWindowsForDate(d,routine,state))slots.push(...subtractBusy(w,busy).map(p=>({date:key,...p})))
    }
    const items=acquisition.map((task,index)=>({task,cat:category(task),key:topicKey(task),remaining:minutes(task),index}));
    const needed=items.reduce((s,x)=>s+x.remaining,0),capacity=slots.reduce((s,x)=>s+x.duration,0);
    if(capacity<needed)return{ok:false,reason:`Há ${Math.round(capacity/60*10)/10}h livres, mas teoria e exercícios exigem ${Math.round(needed/60*10)/10}h.`};
    const theoryKeys=new Set(items.filter(x=>x.cat==='theory').map(x=>x.key)),theoryComplete=new Map(),started=new Set(),created=[];
    const dates=[...new Set(slots.map(s=>s.date))].sort(),byDate=new Map(dates.map(d=>[d,slots.filter(s=>s.date===d)]));
    const remaining=()=>items.reduce((s,x)=>s+Math.max(0,x.remaining),0),keyTheoryRemaining=k=>items.some(x=>x.cat==='theory'&&x.key===k&&x.remaining>0);
    const place=(slot,date,predicate,previousDayOnly=false)=>{
      const cand=items.filter(x=>x.remaining>0&&predicate(x)&&allows(slot,x.cat)&&(!(x.cat==='exercise'&&theoryKeys.has(x.key))||(theoryComplete.has(x.key)&&(!previousDayOnly||theoryComplete.get(x.key)<date)))).sort((a,b)=>a.index-b.index)[0];
      if(!cand)return false;const free=slot.duration-slot.used,take=Math.min(cand.remaining,free);if(take<10&&cand.remaining>take)return false;
      const startMin=slot.start+slot.used,seg={...cand.task,id:`${cand.task.id||'task'}-sync-${Math.random().toString(36).slice(2,7)}`,date:slot.date,day:(parseDate(slot.date).getDay()+6)%7,start:toTime(startMin),end:toTime(startMin+take),done:false};
      slot.used+=take;cand.remaining-=take;created.push(seg);started.add(cand.key);if(cand.cat==='theory'&&!keyTheoryRemaining(cand.key))theoryComplete.set(cand.key,date);return true;
    };
    for(const date of dates){let newTheory=0;for(const slot of byDate.get(date)||[]){while(slot.used<slot.duration&&remaining()>0){if(place(slot,date,x=>x.cat==='exercise',true))continue;if(newTheory<2){const before=started.size;if(place(slot,date,x=>x.cat==='theory'&&!started.has(x.key))){if(started.size>before)newTheory++;continue}}if(place(slot,date,x=>x.cat==='exercise'))continue;if(place(slot,date,x=>x.cat==='theory'&&started.has(x.key)))continue;if(place(slot,date,x=>x.cat==='study'))continue;if(place(slot,date,x=>x.cat==='theory'))continue;break}}}
    if(remaining()>0)return{ok:false,reason:`Ainda restaram ${Math.round(remaining()/60*10)/10}h sem encaixe compatível.`};
    const merged=[...created,...fixed].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||'')));merged.forEach((t,i)=>t.cycleOrder=i);
    state.tasks=merged;state.studyRoutine=state.studyRoutine||routine;state.studyRoutine.planningStrategy={...(state.studyRoutine.planningStrategy||{}),fillAvailableStudyWindow:true,capacityFillVersion:3,directUpdateSync:true};write(STATE_KEY,state);
    return{ok:true,tasks:merged};
  }
  function buildPayload(){
    const state=read(STATE_KEY,{})||{},draft=read(DRAFT_KEY,{})||{},routine=read(ROUTINE_KEY,state.studyRoutine||null),personalization=state.adminPersonalization||{};
    const unknown=Boolean($('#adminExamDateUnknown')?.checked??draft.examDateUnknown??state.examDateUnknown),stage=unknown?String($('#adminContestStage')?.value||draft.contestStage||state.contestStage||'estudo_vagas'):'';
    const payload={...state,studentName:val('#adminStudentName')||state.studentName||draft.studentName||'',goal:val('#adminGoal')||state.goal||draft.goal||'',examDate:unknown?'':(val('#adminExamDate')||state.examDate||draft.examDate||''),examDateUnknown:unknown,contestStage:stage,startDate:val('#adminStartDate')||state.startDate||draft.startDate||personalization.startDate||'',endDate:state.endDate||personalization.endDate||'',hoursPerDay:Number(val('#adminHoursPerDay')||state.hoursPerDay||draft.hoursPerDay||0),scheduleStyle:state.scheduleStyle||draft.scheduleStyle||'weekly',generalGuidance:val('#adminGeneralGuidance')||state.generalGuidance||draft.generalGuidance||'',studyRoutine:routine,subjects:Array.isArray(state.subjects)?state.subjects:[],tasks:Array.isArray(state.tasks)?state.tasks:[]};
    if(!payload.tasks.length)throw new Error('O cronograma atual não possui atividades. Gere o cronograma antes de atualizar.');return payload;
  }
  function taskSignature(tasks){const list=(Array.isArray(tasks)?tasks:[]).map(t=>[t.date,t.start,t.end,t.subject,t.type,t.activity]);let hash=2166136261,text=JSON.stringify(list);for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return`${list.length}:${(hash>>>0).toString(16)}`}
  function markLocalUpdated(path,serverPlan){const items=read(RECENT_KEY,[])||[],item=items.find(x=>x.path===path),now=serverPlan?.updatedAt||new Date().toISOString();if(item){item.updatedAt=now;item.name=serverPlan?.studentName||val('#adminStudentName')||item.name;item.goal=serverPlan?.goal||val('#adminGoal')||item.goal;item.draftSnapshot=read(DRAFT_KEY,item.draftSnapshot||null);item.routineSnapshot=read(ROUTINE_KEY,item.routineSnapshot||null);write(RECENT_KEY,items);write(EDITING_KEY,{path,name:item.name,goal:item.goal,manageKey:item.manageKey||'',loadedAt:new Date().toISOString()})}}
  async function syncButtons(id,key,buttons){const response=await fetch(`/api/plan-buttons?id=${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Plan-Key':key},body:JSON.stringify({buttons})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Não foi possível salvar os botões.');const verify=await fetch(`/api/plan-buttons?id=${encodeURIComponent(id)}&_=${Date.now()}`,{cache:'no-store'});const verified=await verify.json().catch(()=>({}));if(!verify.ok)throw new Error(verified.error||'Não foi possível verificar os botões.');const saved=cleanButtons(verified.buttons);if(saved.length!==buttons.length)throw new Error(`Foram enviados ${buttons.length} botões, mas o servidor confirmou ${saved.length}.`);return saved}
  async function directUpdate(path){
    const item=recentItem(path);if(!item?.manageKey)throw new Error('Esta página não possui chave de gerenciamento local.');if(editing()?.path!==path)throw new Error('Carregue este aluno no editor antes de atualizar a página.');
    const balance=rebalanceForDailyCapacity();if(!balance.ok)throw new Error(`A distribuição das horas não foi atualizada: ${balance.reason}`);
    const payload=buildPayload(),buttons=currentButtons(),id=planId(path);if(!id)throw new Error('Link de cronograma inválido.');const beforeSignature=taskSignature(payload.tasks);
    const response=await fetch(`/api/plans?id=${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Plan-Key':item.manageKey},body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Não foi possível atualizar a página.');
    const savedButtons=await syncButtons(id,item.manageKey,buttons);
    const verifyResponse=await fetch(`/api/plans?id=${encodeURIComponent(id)}&_=${Date.now()}`,{cache:'no-store'});const serverPlan=await verifyResponse.json().catch(()=>({}));if(!verifyResponse.ok)throw new Error(serverPlan.error||'A página foi enviada, mas não foi possível verificar o resultado.');if(beforeSignature!==taskSignature(serverPlan.tasks))throw new Error('O cronograma salvo no servidor não corresponde ao cronograma atual do editor.');markLocalUpdated(path,{...serverPlan,updatedAt:result.updatedAt});return{serverPlan,buttons:savedButtons};
  }
  async function handleUpdateClick(event,button){const path=button.dataset.updatePlan||editing()?.path||'';if(!path)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const item=recentItem(path);if(!item)return alert('Cronograma não encontrado na lista local.');if(editing()?.path!==path)return alert(`Antes de atualizar ${item.name||'esta página'}, clique em “Carregar no editor”.`);if(!confirm(`Atualizar agora a página de ${item.name||'este aluno'} usando exatamente o cronograma, a rotina e os botões que estão no editor?`))return;const original=button.textContent;button.disabled=true;button.textContent='Atualizando e verificando...';try{const result=await directUpdate(path);alert(`Página atualizada e verificada. ${result.serverPlan.tasks?.length||0} atividades e ${result.buttons.length} botão(ões) confirmados no mesmo link.`)}catch(error){alert(error.message||'Erro ao atualizar a página.')}finally{button.disabled=false;button.textContent=original}}
  function bind(){document.addEventListener('click',event=>{const button=event.target.closest?.('[data-update-plan],[data-update-current]');if(button)handleUpdateClick(event,button)},true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();