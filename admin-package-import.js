(()=>{
  'use strict';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const BLACKOUT_KEY='mpcAdminBlackoutRangesV1';
  const EDITING_KEY='mpcAdminEditingPublishedPlanV1';
  const INTENT_KEY='mpcAdminDuplicateIntentV1';
  const BUTTONS_KEY='mpcAdminPublicPageButtonsV1';
  const MESSAGE_KEY='mpcPackageImportedMessageV1';
  const FORMAT='mpc-schedule-package';
  const VERSION=1;
  const $=(s,r=document)=>r.querySelector(s);
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const remove=k=>{try{localStorage.removeItem(k)}catch{}};
  const cleanDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'';
  const clamp=(n,min,max,fallback)=>{n=Number(n);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};
  const uniqNumbers=arr=>[...new Set((Array.isArray(arr)?arr:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort((a,b)=>a-b);
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function normalizeSubject(subject,index){
    if(!subject||typeof subject!=='object')return null;
    const name=String(subject.name||'').trim();if(!name)return null;
    const difficulty=['basico','intermediario','dificil'].includes(subject.difficulty)?subject.difficulty:'intermediario';
    let topicsText=String(subject.topicsText||'').trim();
    if(!topicsText&&Array.isArray(subject.topics))topicsText=subject.topics.map(item=>typeof item==='string'?item:String(item?.text||item?.label||'')).filter(Boolean).join('\n');
    if(!topicsText)return null;
    return{id:String(subject.id||`pkg-subject-${Date.now()}-${index}`),name,difficulty,sessionMinutes:clamp(subject.sessionMinutes,5,240,60),topicsText};
  }

  function normalizeBlackouts(source){
    return (Array.isArray(source)?source:[]).map((item,index)=>{
      let start=cleanDate(item?.start||item?.date),end=cleanDate(item?.end||item?.start||item?.date);
      if(!start||!end)return null;if(start>end){const tmp=start;start=end;end=tmp}
      return{id:String(item?.id||`pkg-blackout-${Date.now()}-${index}`),start,end,reason:String(item?.reason||item?.label||'Indisponibilidade').trim().slice(0,120)||'Indisponibilidade'};
    }).filter(Boolean).sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));
  }

  function normalizePackage(raw){
    if(!raw||typeof raw!=='object')throw new Error('O arquivo não contém um pacote válido.');
    const format=String(raw.format||raw.schema||'');
    if(format&&format!==FORMAT)throw new Error('Este JSON não é um pacote do Gerador de Cronogramas MPC.');
    const version=Number(raw.version||1);if(version>VERSION)throw new Error(`Este pacote usa a versão ${version}, mas o importador atual aceita até a versão ${VERSION}.`);
    const student=raw.student&&typeof raw.student==='object'?raw.student:raw;
    const options=raw.options&&typeof raw.options==='object'?raw.options:{};
    const simulations=raw.simulations&&typeof raw.simulations==='object'?raw.simulations:{};
    const subjects=(Array.isArray(raw.subjects)?raw.subjects:Array.isArray(student.subjects)?student.subjects:[]).map(normalizeSubject).filter(Boolean);
    if(!subjects.length)throw new Error('O pacote precisa conter pelo menos uma matéria com tópicos.');
    const studentName=String(student.studentName||student.name||'').trim();if(!studentName)throw new Error('O pacote não informa o nome do aluno.');
    const startDate=cleanDate(student.startDate);if(!startDate)throw new Error('O pacote não informa uma data inicial válida.');
    const examDate=cleanDate(student.examDate);
    const availableDays=uniqNumbers(student.availableDays?.length?student.availableDays:[0,1,2,3,4]);
    const draft={
      studentName,
      goal:String(student.goal||'').trim(),
      scheduleStyle:['weekly','monthly','cycle','checklist'].includes(student.scheduleStyle||options.scheduleStyle)?(student.scheduleStyle||options.scheduleStyle):'weekly',
      planDays:Math.round(clamp(student.planDays,1,730,40)),
      startDate,examDate,
      hoursPerDay:clamp(student.hoursPerDay,.25,24,2),
      sessionMinutes:Math.round(clamp(student.sessionMinutes,5,240,60)),
      preferredStart:String(student.preferredStart||'19:00').slice(0,5),
      availableDays,
      workSchedule:String(student.workSchedule||'').trim(),
      studyMaterial:String(student.studyMaterial||'').trim(),
      examLevel:String(student.examLevel||'').trim(),
      competitionLevel:String(student.competitionLevel||'').trim(),
      salary:String(student.salary||'').trim(),
      boardStyle:String(student.boardStyle||'').trim(),
      generalGuidance:String(student.generalGuidance||'').trim(),
      includeTheory:options.includeTheory!==false,
      includeExercises:options.includeExercises!==false,
      includeReviews:options.includeReviews!==false,
      replaceSchedule:options.replaceSchedule!==false,
      simulationEnabled:Boolean(simulations.enabled),
      simulationMode:['interval_days','weekday_occurrence'].includes(simulations.mode)?simulations.mode:'interval_days',
      simulationInterval:Math.round(clamp(simulations.interval,1,365,15)),
      simulationWeekdays:uniqNumbers(simulations.weekdays||[]),
      simulationWeekday:uniqNumbers(simulations.weekdays||[])[0]??6,
      simulationType:simulations.type==='subject'?'subject':'full',
      simulationMinutes:Math.round(clamp(simulations.minutes,10,480,240)),
      simulationStart:String(simulations.start||'08:00').slice(0,5),
      subjects,
      pdfTheme:String(raw.presentation?.pdfTheme||'premium_masculino'),
      pdfButtonEnabled:false,
      pdfButtonText:'Acesse aqui',
      pdfButtonUrl:'',
      pdfButtonPosition:'footer-right'
    };
    const blackoutRanges=normalizeBlackouts(raw.blackoutRanges||student.blackoutRanges||[]);
    const routineRaw=raw.routine&&typeof raw.routine==='object'?raw.routine:{};
    const routine={...routineRaw,mode:['continuous','fragmented','12x36','custom'].includes(routineRaw.mode)?routineRaw.mode:'continuous',blackoutRanges};
    return{draft,blackoutRanges,routine,meta:{name:String(raw.packageName||studentName),source:String(raw.source||''),version}};
  }

  function clearCurrentEditor(){
    [DRAFT_KEY,STATE_KEY,ROUTINE_KEY,BLACKOUT_KEY,EDITING_KEY,INTENT_KEY,BUTTONS_KEY].forEach(remove);
    try{Object.keys(sessionStorage).forEach(k=>{if(/^mpc(?:CapacityFill|FinalConsolidation|Generation|FinalInput|AdminLoadedPublishedPlan)/.test(k))sessionStorage.removeItem(k)})}catch{}
  }

  function applyPackage(pkg){
    const normalized=normalizePackage(pkg);clearCurrentEditor();
    write(DRAFT_KEY,normalized.draft);
    write(BLACKOUT_KEY,normalized.blackoutRanges);
    write(ROUTINE_KEY,normalized.routine);
    write(STATE_KEY,{studentName:normalized.draft.studentName,goal:normalized.draft.goal,startDate:normalized.draft.startDate,examDate:normalized.draft.examDate,hoursPerDay:normalized.draft.hoursPerDay,sessionMinutes:normalized.draft.sessionMinutes,preferredStart:normalized.draft.preferredStart,availableDays:normalized.draft.availableDays,subjects:normalized.draft.subjects.map(s=>({name:s.name,priority:0,level:s.difficulty})),tasks:[],studyRoutine:normalized.routine,adminGenerated:false,adminPlanDays:normalized.draft.planDays,adminPersonalization:{studentName:normalized.draft.studentName,startDate:normalized.draft.startDate,blackoutRanges:normalized.blackoutRanges,packageImportVersion:VERSION}});
    try{sessionStorage.setItem(MESSAGE_KEY,JSON.stringify({studentName:normalized.draft.studentName,subjects:normalized.draft.subjects.length,blackouts:normalized.blackoutRanges.length,packageName:normalized.meta.name}))}catch{}
    location.href='/admin.html?pacote=importado';
  }

  function closeModal(){const modal=$('#mpcPackageImportModal');if(modal)modal.remove()}
  function showModal(){
    closeModal();
    const modal=document.createElement('div');modal.id='mpcPackageImportModal';
    modal.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(7,15,30,.62);display:grid;place-items:center;padding:20px';
    modal.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="mpcPackageImportTitle" style="width:min(620px,96vw);background:#fff;border-radius:18px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.28)"><div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start"><div><h3 id="mpcPackageImportTitle" style="margin:0 0 6px;font-size:1.2rem;color:#0D1B33">Importar pacote de cronograma</h3><p style="margin:0;color:#64748b;line-height:1.5;font-size:.9rem">Selecione o arquivo JSON preparado para o aluno. O pacote pode preencher dados, matérias, tópicos, rotina, simulados e indisponibilidades de uma só vez.</p></div><button type="button" id="mpcPackageClose" aria-label="Fechar" style="border:0;background:transparent;font-size:1.5rem;cursor:pointer;color:#64748b">×</button></div><label id="mpcPackageDrop" style="margin-top:20px;display:grid;place-items:center;text-align:center;min-height:150px;border:2px dashed #9fb0c8;border-radius:14px;background:#f8fafc;padding:22px;cursor:pointer"><strong style="color:#0D1B33">Clique para escolher o pacote JSON</strong><span style="display:block;margin-top:6px;color:#64748b;font-size:.85rem">ou arraste o arquivo para esta área</span><input id="mpcPackageFile" type="file" accept="application/json,.json" hidden></label><div id="mpcPackageStatus" style="min-height:20px;margin-top:12px;font-size:.86rem;font-weight:750"></div><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px"><button type="button" id="mpcPackageCancel" style="border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer">Cancelar</button></div></div>`;
    document.body.appendChild(modal);
    $('#mpcPackageClose')?.addEventListener('click',closeModal);$('#mpcPackageCancel')?.addEventListener('click',closeModal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
    const input=$('#mpcPackageFile'),drop=$('#mpcPackageDrop'),status=$('#mpcPackageStatus');
    async function loadFile(file){
      if(!file)return;status.style.color='#334155';status.textContent='Lendo e validando o pacote...';
      try{const text=await file.text();const json=JSON.parse(text);const normalized=normalizePackage(json);status.style.color='#166534';status.textContent=`Pacote válido: ${normalized.draft.studentName} · ${normalized.draft.subjects.length} matérias · ${normalized.blackoutRanges.length} indisponibilidade(s). Importando...`;setTimeout(()=>applyPackage(json),180)}
      catch(error){status.style.color='#b91c1c';status.textContent=error?.message||'Não foi possível importar este arquivo.'}
    }
    input?.addEventListener('change',()=>loadFile(input.files?.[0]));
    ['dragenter','dragover'].forEach(type=>drop?.addEventListener(type,e=>{e.preventDefault();drop.style.borderColor='#0D1B33';drop.style.background='#eef4fb'}));
    ['dragleave','drop'].forEach(type=>drop?.addEventListener(type,e=>{e.preventDefault();drop.style.borderColor='#9fb0c8';drop.style.background='#f8fafc'}));
    drop?.addEventListener('drop',e=>loadFile(e.dataTransfer?.files?.[0]));
  }

  function mountButton(){
    if($('#mpcImportPackageTop'))return;
    const bar=$('#mpcCreateNewPlanTop');if(!bar)return;
    const btn=document.createElement('button');btn.id='mpcImportPackageTop';btn.type='button';btn.textContent='IMPORTAR pacote';
    btn.style.cssText='border:1px solid #0D1B33;border-radius:12px;padding:13px 18px;background:#fff;color:#0D1B33;font-weight:900;letter-spacing:.01em;cursor:pointer;box-shadow:0 6px 18px #0d1b3312';
    btn.addEventListener('click',showModal);bar.prepend(btn);
  }
  function showImportedMessage(){
    let data=null;try{data=JSON.parse(sessionStorage.getItem(MESSAGE_KEY)||'null')}catch{}if(!data)return;sessionStorage.removeItem(MESSAGE_KEY);
    setTimeout(()=>alert(`Pacote importado com sucesso. ${data.studentName}: ${data.subjects} matéria(s) carregada(s)${data.blackouts?` e ${data.blackouts} indisponibilidade(s) cadastrada(s)`:''}. Revise o Resumo Inteligente e gere o cronograma.`),450);
  }
  function init(){mountButton();setTimeout(mountButton,250);setTimeout(mountButton,900);showImportedMessage()}
  window.mpcImportSchedulePackage=applyPackage;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();