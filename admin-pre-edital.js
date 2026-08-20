(()=>{
  'use strict';

  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const STAGES=[
    ['estudo_vagas','Estudo de vagas'],
    ['previsao_orcamentaria','Previsão orçamentária'],
    ['autorizacao','Autorização'],
    ['comissao_organizadora','Comissão organizadora'],
    ['escolha_banca','Escolha da banca'],
    ['publicacao_edital','Publicação do edital']
  ];
  const $=(s,r=document)=>r.querySelector(s);
  const readJson=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const writeJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};

  function injectUi(){
    const exam=$('#adminExamDate');
    if(!exam||$('#adminExamDateUnknown'))return;
    const field=exam.closest('.field');
    if(!field)return;

    const option=document.createElement('label');
    option.className='helper';
    option.style.cssText='display:flex;align-items:center;gap:8px;margin-top:8px;font-weight:700;cursor:pointer';
    option.innerHTML='<input id="adminExamDateUnknown" type="checkbox" style="width:auto"> Prova ainda sem data definida';
    field.appendChild(option);

    const stage=document.createElement('div');
    stage.id='adminContestStageField';
    stage.className='field';
    stage.style.marginTop='10px';
    stage.hidden=true;
    stage.innerHTML=`<label for="adminContestStage">Etapa atual do concurso</label><select id="adminContestStage">${STAGES.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select><span class="helper">Use esta informação enquanto o concurso ainda não possui data de prova definida.</span>`;
    field.appendChild(stage);
  }

  function stageLabel(value){return STAGES.find(([id])=>id===value)?.[1]||''}

  function mergeCustomState(){
    const unknown=Boolean($('#adminExamDateUnknown')?.checked);
    const stage=unknown?($('#adminContestStage')?.value||'estudo_vagas'):'';
    const exam=$('#adminExamDate');
    if(unknown&&exam?.value)exam.value='';

    const draft=readJson(DRAFT_KEY,{})||{};
    draft.examDateUnknown=unknown;
    draft.contestStage=stage;
    if(unknown)draft.examDate='';
    writeJson(DRAFT_KEY,draft);

    const state=readJson(STATE_KEY,{})||{};
    state.examDateUnknown=unknown;
    state.contestStage=stage;
    if(unknown)state.examDate='';
    state.adminPersonalization={...(state.adminPersonalization||{}),examDateUnknown:unknown,contestStage:stage};
    if(unknown)state.adminPersonalization.examDate='';
    writeJson(STATE_KEY,state);
  }

  function updateHelper(){
    const unknown=Boolean($('#adminExamDateUnknown')?.checked);
    const exam=$('#adminExamDate');
    const stageField=$('#adminContestStageField');
    const calc=$('#adminCalculateDaysBtn');
    if(exam)exam.disabled=unknown;
    if(stageField)stageField.hidden=!unknown;
    if(calc){calc.disabled=unknown;calc.title=unknown?'Sem data de prova, a quantidade de dias define o horizonte do planejamento.':''}

    if(unknown){
      const helper=$('#adminDaysAvailable');
      const days=Math.max(1,Number($('#adminPlanDays')?.value)||1);
      const label=stageLabel($('#adminContestStage')?.value||'estudo_vagas');
      if(helper){
        helper.className='helper';
        helper.textContent=`Prova sem data definida. O planejamento usará ${days} dia(s) a partir da data inicial. Etapa atual: ${label}.`;
      }
    }
  }

  function applySaved(){
    const draft=readJson(DRAFT_KEY,{})||{};
    const unknown=Boolean(draft.examDateUnknown);
    const check=$('#adminExamDateUnknown');
    const stage=$('#adminContestStage');
    if(check)check.checked=unknown;
    if(stage)stage.value=STAGES.some(([id])=>id===draft.contestStage)?draft.contestStage:'estudo_vagas';
    if(unknown&&$('#adminExamDate'))$('#adminExamDate').value='';
    updateHelper();
    mergeCustomState();
  }

  function bind(){
    const check=$('#adminExamDateUnknown');
    const stage=$('#adminContestStage');
    const exam=$('#adminExamDate');
    if(!check||!stage||!exam)return;

    check.addEventListener('change',()=>{
      if(check.checked)exam.value='';
      updateHelper();mergeCustomState();
      exam.dispatchEvent(new Event('change',{bubbles:true}));
    });
    stage.addEventListener('change',()=>{updateHelper();mergeCustomState()});
    $('#adminPlanDays')?.addEventListener('input',()=>{if(check.checked)setTimeout(()=>{updateHelper();mergeCustomState()},0)});
    exam.addEventListener('change',()=>{if(exam.value&&check.checked){check.checked=false;updateHelper();mergeCustomState()}});

    // A tela-base regrava o rascunho ao editar outros campos. Reaplica os campos extras depois dela.
    document.addEventListener('input',event=>{
      if(event.target.closest?.('#adminPanel'))setTimeout(()=>{mergeCustomState();if(check.checked)updateHelper()},0);
    },true);
    document.addEventListener('change',event=>{
      if(event.target.closest?.('#adminPanel'))setTimeout(()=>{mergeCustomState();if(check.checked)updateHelper()},0);
    },true);
  }

  function enrichPlanRequest(){
    const previous=window.fetch;
    if(!previous||previous.__mpcPreEditalWrapped)return;
    async function wrapped(input,opts={}){
      try{
        const url=typeof input==='string'?input:(input?.url||'');
        const method=(opts.method||input?.method||'GET').toUpperCase();
        if((method==='POST'||method==='PUT')&&/\/api\/plans(?:\?|$)/.test(url)&&typeof opts.body==='string'){
          const data=JSON.parse(opts.body);
          const draft=readJson(DRAFT_KEY,{})||{};
          const unknown=Boolean($('#adminExamDateUnknown')?.checked??draft.examDateUnknown);
          const stage=unknown?($('#adminContestStage')?.value||draft.contestStage||'estudo_vagas'):'';
          data.examDateUnknown=unknown;
          data.contestStage=stage;
          if(unknown)data.examDate='';
          opts={...opts,body:JSON.stringify(data)};
        }
      }catch{}
      return previous.call(this,input,opts);
    }
    wrapped.__mpcPreEditalWrapped=true;
    window.fetch=wrapped;
  }

  function init(){
    if(!$('#adminPanel'))return;
    injectUi();applySaved();bind();enrichPlanRequest();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();