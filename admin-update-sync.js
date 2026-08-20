(()=>{
  'use strict';
  const RECENT_KEY='mpcAdminRecentPublishedPlansV1';
  const EDITING_KEY='mpcAdminEditingPublishedPlanV1';
  const STATE_KEY='geradorCronogramaMpcData';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const BUTTONS_KEY='mpcAdminPublicPageButtonsV1';
  const $=(s,r=document)=>r.querySelector(s);
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const val=id=>String($(id)?.value||'').trim();
  const planId=path=>String(path||'').match(/\/plano\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()||'';
  const cleanButtons=items=>(Array.isArray(items)?items:[]).slice(0,8).map(item=>({text:String(item?.text||'').trim(),url:String(item?.url||'').trim(),style:['primary','navy','gold','green','outline'].includes(item?.style)?item.style:'primary',enabled:item?.enabled!==false})).filter(item=>item.text&&item.url);
  function recentItem(path){return (read(RECENT_KEY,[])||[]).find(item=>item.path===path)||null}
  function editing(){return read(EDITING_KEY,null)}
  function currentButtons(){const state=read(STATE_KEY,{})||{},draft=read(DRAFT_KEY,{})||{};return cleanButtons(read(BUTTONS_KEY,[])||draft.publicPageButtons||state.publicPageButtons||[])}
  function buildPayload(){
    const state=read(STATE_KEY,{})||{},draft=read(DRAFT_KEY,{})||{},routine=read(ROUTINE_KEY,state.studyRoutine||null),personalization=state.adminPersonalization||{};
    const unknown=Boolean($('#adminExamDateUnknown')?.checked??draft.examDateUnknown??state.examDateUnknown);
    const stage=unknown?String($('#adminContestStage')?.value||draft.contestStage||state.contestStage||'estudo_vagas'):'';
    const payload={...state,studentName:val('#adminStudentName')||state.studentName||draft.studentName||'',goal:val('#adminGoal')||state.goal||draft.goal||'',examDate:unknown?'':(val('#adminExamDate')||state.examDate||draft.examDate||''),examDateUnknown:unknown,contestStage:stage,startDate:val('#adminStartDate')||state.startDate||draft.startDate||personalization.startDate||'',endDate:state.endDate||personalization.endDate||'',hoursPerDay:Number(val('#adminHoursPerDay')||state.hoursPerDay||draft.hoursPerDay||0),scheduleStyle:state.scheduleStyle||draft.scheduleStyle||'weekly',generalGuidance:val('#adminGeneralGuidance')||state.generalGuidance||draft.generalGuidance||'',studyRoutine:routine,subjects:Array.isArray(state.subjects)?state.subjects:[],tasks:Array.isArray(state.tasks)?state.tasks:[]};
    if(!payload.tasks.length)throw new Error('O cronograma atual não possui atividades. Gere o cronograma antes de atualizar.');
    return payload;
  }
  function taskSignature(tasks){const list=(Array.isArray(tasks)?tasks:[]).map(t=>[t.date,t.start,t.end,t.subject,t.type,t.activity]);let hash=2166136261,text=JSON.stringify(list);for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return`${list.length}:${(hash>>>0).toString(16)}`}
  function markLocalUpdated(path,serverPlan){const items=read(RECENT_KEY,[])||[],item=items.find(x=>x.path===path),now=serverPlan?.updatedAt||new Date().toISOString();if(item){item.updatedAt=now;item.name=serverPlan?.studentName||val('#adminStudentName')||item.name;item.goal=serverPlan?.goal||val('#adminGoal')||item.goal;item.draftSnapshot=read(DRAFT_KEY,item.draftSnapshot||null);item.routineSnapshot=read(ROUTINE_KEY,item.routineSnapshot||null);write(RECENT_KEY,items);write(EDITING_KEY,{path,name:item.name,goal:item.goal,manageKey:item.manageKey||'',loadedAt:new Date().toISOString()})}}
  async function syncButtons(id,key,buttons){const response=await fetch(`/api/plan-buttons?id=${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Plan-Key':key},body:JSON.stringify({buttons})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Não foi possível salvar os botões.');const verify=await fetch(`/api/plan-buttons?id=${encodeURIComponent(id)}&_=${Date.now()}`,{cache:'no-store'});const verified=await verify.json().catch(()=>({}));if(!verify.ok)throw new Error(verified.error||'Não foi possível verificar os botões.');const saved=cleanButtons(verified.buttons);if(saved.length!==buttons.length)throw new Error(`Foram enviados ${buttons.length} botões, mas o servidor confirmou ${saved.length}.`);return saved}
  async function directUpdate(path){
    const item=recentItem(path);if(!item?.manageKey)throw new Error('Esta página não possui chave de gerenciamento local.');if(editing()?.path!==path)throw new Error('Carregue este aluno no editor antes de atualizar a página.');
    const state=read(STATE_KEY,{});const strategy=state?.studyRoutine?.planningStrategy||{};
    if(!strategy.singleFinalPlanner||Number(strategy.plannerVersion)!==4)throw new Error('Este cronograma ainda não passou pelo planejador final. Gere o cronograma novamente antes de atualizar a página.');
    const payload=buildPayload(),buttons=currentButtons(),id=planId(path);if(!id)throw new Error('Link de cronograma inválido.');const beforeSignature=taskSignature(payload.tasks);
    const response=await fetch(`/api/plans?id=${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Plan-Key':item.manageKey},body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Não foi possível atualizar a página.');
    const savedButtons=await syncButtons(id,item.manageKey,buttons);
    const verifyResponse=await fetch(`/api/plans?id=${encodeURIComponent(id)}&_=${Date.now()}`,{cache:'no-store'});const serverPlan=await verifyResponse.json().catch(()=>({}));if(!verifyResponse.ok)throw new Error(serverPlan.error||'A página foi enviada, mas não foi possível verificar o resultado.');if(beforeSignature!==taskSignature(serverPlan.tasks))throw new Error('O cronograma salvo no servidor não corresponde ao cronograma atual do editor.');markLocalUpdated(path,{...serverPlan,updatedAt:result.updatedAt});return{serverPlan,buttons:savedButtons};
  }
  async function handleUpdateClick(event,button){const path=button.dataset.updatePlan||editing()?.path||'';if(!path)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const item=recentItem(path);if(!item)return alert('Cronograma não encontrado na lista local.');if(editing()?.path!==path)return alert(`Antes de atualizar ${item.name||'esta página'}, clique em “Carregar no editor”.`);if(!confirm(`Atualizar agora a página de ${item.name||'este aluno'} usando exatamente o cronograma já gerado e os botões do editor?`))return;const original=button.textContent;button.disabled=true;button.textContent='Atualizando e verificando...';try{const result=await directUpdate(path);alert(`Página atualizada e verificada. ${result.serverPlan.tasks?.length||0} atividades e ${result.buttons.length} botão(ões) confirmados no mesmo link.`)}catch(error){alert(error.message||'Erro ao atualizar a página.')}finally{button.disabled=false;button.textContent=original}}
  function bind(){document.addEventListener('click',event=>{const button=event.target.closest?.('[data-update-plan],[data-update-current]');if(button)handleUpdateClick(event,button)},true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();