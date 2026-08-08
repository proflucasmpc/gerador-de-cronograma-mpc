from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: bloco não encontrado')
    s=s.replace(old,new,1)

def sub(pattern,new,label,flags=re.S):
    global s
    rx=re.compile(pattern,flags)
    s2,n=rx.subn(lambda m:new,s,count=1)
    if n!=1:
        raise SystemExit(f'{label}: esperado 1 bloco, encontrado {n}')
    s=s2

# 1) Nunca permitir simulado ou estudo no dia da prova.
rep(
"      const all=adminDatesInWindow(window);\n",
"      const all=adminDatesInWindow(window).filter(date=>!window.exam||localDateKey(date)!==localDateKey(window.exam));\n",
'filtrar prova dos simulados'
)
rep(
"        return draft.availableDays.includes(day)&&!simKeys.has(localDateKey(date));\n",
"        const key=localDateKey(date);\n        return draft.availableDays.includes(day)&&!simKeys.has(key)&&(!window.exam||key!==localDateKey(window.exam));\n",
'filtrar prova dos estudos'
)
rep(
"      preview.simDates.forEach((date,simulationIndex)=>{\n        const start=timeToMinutes(draft.simulationStart);\n",
"      preview.simDates.forEach((date,simulationIndex)=>{\n        if(draft.examDate&&localDateKey(date)===draft.examDate) return;\n        const start=timeToMinutes(draft.simulationStart);\n",
'guarda defensiva simulados'
)

# Corrige a variável draft ausente na prévia de capacidade.
rep(
"      const preview=adminSchedulePreview();\n      if(preview.error){\n",
"      const draft=adminDraftObject();\n      const preview=adminSchedulePreview(draft);\n      if(preview.error){\n",
'draft da capacidade'
)

# Guarda a data da prova na personalização do PDF.
rep(
"        planDays:preview.window.days,\n        startDate:localDateKey(preview.window.start),\n",
"        planDays:preview.window.days,\n        examDate:draft.examDate||'',\n        startDate:localDateKey(preview.window.start),\n",
'examDate na personalização'
)

# Exibe a data da prova na capa quando conhecida.
rep(
"        `Período planejado: ${periodStart} a ${periodEnd}`,\n        `Disponibilidade: ${state.hoursPerDay||0} hora(s) por dia`,\n",
"        `Período planejado: ${periodStart} a ${periodEnd}`,\n        ...(data.examDate?[`Data da prova: ${new Date(`${data.examDate}T12:00:00`).toLocaleDateString('pt-BR')}`]:[]),\n        `Disponibilidade: ${state.hoursPerDay||0} hora(s) por dia`,\n",
'data da prova na capa'
)

# 2) Variável opcional para o texto de orientações não ficar preso a Checklist.
rep(
"              <span class=\"helper\">Este texto é exclusivo da área administrativa e será inserido no PDF logo após a página de apresentação.</span>",
"              <span class=\"helper\">Este texto é exclusivo da área administrativa e será inserido no PDF logo após a página de apresentação. Use {tipo_cronograma} se quiser que o nome do formato (Checklist, Por Ciclos, Semanal ou Por Dias) seja preenchido automaticamente.</span>",
'ajuda da variável de estilo'
)
sub(
 r'''    function pdfAdminGuidanceText\(\)\{.*?\n    \}''',
'''    function pdfAdminGuidanceText(){
      const data=state.adminPersonalization||{};
      const styleLabels={checklist:'Checklist',cycle:'Por Ciclos',weekly:'Semanal',monthly:'Por Dias'};
      const styleLabel=styleLabels[state.scheduleStyle]||'Cronograma';
      return String(data.generalGuidance||data.extraCriteria||'')
        .replace(/\{tipo_cronograma\}/gi,styleLabel)
        .trim();
    }''',
'variável tipo cronograma'
)

# Helpers do dia da prova para os PDFs.
anchor='''    function pdfPrepareChecklistStyle(){'''
helpers='''    function pdfExamDate(){
      const key=state.adminPersonalization?.examDate||state.examDate||'';
      return dateFromKey(key);
    }

    function pdfExamDateLabel(){
      const exam=pdfExamDate();
      if(!exam) return '';
      const name=DAYS[(exam.getDay()+6)%7]||'Dia';
      return `${exam.toLocaleDateString('pt-BR')} · ${name}`;
    }

    function pdfDrawExamCallout(commands,y){
      const exam=pdfExamDate();
      if(!exam) return y;
      const {width,margin}=PDF_PAGE;
      const boxHeight=58;
      pdfRect(commands,margin,y-boxHeight,width-margin*2,boxHeight,PDF_COLORS.pendingSoft,PDF_COLORS.gold,1);
      pdfText(commands,margin+14,y-20,'DIA DA PROVA',12.5,true,PDF_COLORS.goldDark);
      pdfText(commands,margin+14,y-39,`${pdfExamDateLabel()} · Não há estudo ou simulado programado nesta data.`,9.4,true,PDF_COLORS.navy);
      return y-boxHeight-10;
    }

'''
rep(anchor,helpers+anchor,'helpers dia da prova')

# 3) Checklist: mais espaço, texto completo e chamada do dia da prova.
sub(
 r'''    function pdfPrepareChecklistStyle\(\)\{.*?\n    \}\n\n    function pdfBuildChecklistStylePage\(tasks,pageIndex,pageCount\)\{.*?\n    \}\n\n    function pdfPrepareCycleStyle''',
'''    function pdfPrepareChecklistStyle(){
      return pdfChunk(pdfSortedTasks(),6);
    }

    function pdfBuildChecklistStylePage(tasks,pageIndex,pageCount){
      const commands=[];
      const chrome=pdfDrawStyleChrome(commands,pageIndex,pageCount,'CHECKLIST DE ESTUDOS');
      let y=chrome.bodyTop;
      tasks.forEach(task=>{
        const done=Boolean(task.done);
        pdfRect(commands,PDF_PAGE.margin,y-13,13,13,done?PDF_COLORS.successSoft:PDF_COLORS.white,done?PDF_COLORS.success:PDF_COLORS.line,1);
        if(done) pdfText(commands,PDF_PAGE.margin+2.7,y-10,'X',9,true,PDF_COLORS.success);
        const subjectLines=pdfWrapText(task.subject||'Disciplina',350,12.0,2,true);
        const activityLines=pdfWrapText(task.activity||'Atividade de estudo',350,10.3,4,false);
        subjectLines.forEach((line,index)=>pdfText(commands,PDF_PAGE.margin+24,y-2-index*13.8,line,12.0,true,PDF_COLORS.navy));
        const activityY=y-19-(subjectLines.length-1)*13.8;
        activityLines.forEach((line,index)=>pdfText(commands,PDF_PAGE.margin+24,activityY-index*12.2,line,10.3,false,PDF_COLORS.text));
        const meta=task.date?pdfDateLabel(task):`${task.type||'Estudo'} · ${task.start||''}${task.end?`–${task.end}`:''}`;
        const metaLines=pdfWrapText(meta,124,8.6,2,false);
        metaLines.forEach((line,index)=>pdfText(commands,PDF_PAGE.width-PDF_PAGE.margin-124,y-9-index*11,line,8.6,false,PDF_COLORS.muted,'right',124));
        const contentLines=Math.max(subjectLines.length,1)+Math.max(activityLines.length,1);
        const rowHeight=Math.max(72,44+(contentLines-2)*12.2);
        pdfLine(commands,PDF_PAGE.margin,y-rowHeight+12,PDF_PAGE.width-PDF_PAGE.margin,y-rowHeight+12,PDF_COLORS.line,.55);
        y-=rowHeight;
      });
      if(!tasks.length) pdfText(commands,PDF_PAGE.margin,chrome.bodyTop-30,'Nenhum item cadastrado.',12,true,PDF_COLORS.muted);
      if(pageIndex===pageCount-1&&pdfExamDate()) pdfDrawExamCallout(commands,Math.max(chrome.bodyBottom+72,y-4));
      return {content:commands.join('\\n'),button:chrome.button};
    }

    function pdfPrepareCycleStyle''',
'checklist completo'
)

# 4) Ciclos: datas sugeridas em todas as etapas, texto completo e dia da prova no final.
sub(
 r'''    function pdfPrepareCycleStyle\(\)\{.*?\n    \}\n\n    function pdfBuildCycleStylePage\(tasks,pageIndex,pageCount,pageOffset=0\)\{.*?\n    \}\n\n    function pdfWeekKey''',
'''    function pdfPrepareCycleStyle(){
      const ordered=[...state.tasks].sort((a,b)=>(a.cycleOrder??9999)-(b.cycleOrder??9999)||a.day-b.day||(a.start||'').localeCompare(b.start||''));
      return pdfChunk(ordered,5);
    }

    function pdfBuildCycleStylePage(tasks,pageIndex,pageCount,pageOffset=0){
      const commands=[];
      const chrome=pdfDrawStyleChrome(commands,pageIndex,pageCount,'CRONOGRAMA POR CICLOS');
      let y=chrome.bodyTop;
      tasks.forEach((task,index)=>{
        const number=pageOffset+index+1;
        pdfRect(commands,PDF_PAGE.margin,y-39,40,40,PDF_COLORS.navy,null,0);
        pdfText(commands,PDF_PAGE.margin,y-25,String(number),14,true,PDF_COLORS.white,'center',40);
        const x=PDF_PAGE.margin+54;
        const subjectLines=pdfWrapText(task.subject||'Disciplina',390,13.0,2,true);
        const activityLines=pdfWrapText(task.activity||'Atividade',390,10.4,4,false);
        subjectLines.forEach((line,lineIndex)=>pdfText(commands,x,y-5-lineIndex*14,line,13.0,true,PDF_COLORS.navy));
        let textY=y-25-(subjectLines.length-1)*14;
        activityLines.forEach((line,lineIndex)=>pdfText(commands,x,textY-lineIndex*12.1,line,10.4,false,PDF_COLORS.text));
        textY-=activityLines.length*12.1+5;
        pdfText(commands,x,textY,`${task.type||'Estudo'} · ${formatHours(taskDuration(task))}${task.done?' · Concluída':''}`,9.1,true,task.done?PDF_COLORS.success:PDF_COLORS.muted);
        if(task.date){
          pdfText(commands,x,textY-15,`Data sugerida: ${pdfDateLabel(task)}`,8.9,true,PDF_COLORS.goldDark);
        }
        const rowHeight=Math.max(96,78+(activityLines.length-1)*12.1+(subjectLines.length-1)*14);
        pdfLine(commands,PDF_PAGE.margin,y-rowHeight+10,PDF_PAGE.width-PDF_PAGE.margin,y-rowHeight+10,PDF_COLORS.line,.6);
        y-=rowHeight;
      });
      if(!tasks.length) pdfText(commands,PDF_PAGE.margin,chrome.bodyTop-30,'Nenhuma etapa cadastrada.',12,true,PDF_COLORS.muted);
      if(pageIndex===pageCount-1&&pdfExamDate()) pdfDrawExamCallout(commands,Math.max(chrome.bodyBottom+72,y-4));
      return {content:commands.join('\\n'),button:chrome.button};
    }

    function pdfWeekKey''',
'ciclos com datas'
)

# 5) Calendário/semana: texto quebra em múltiplas linhas sem reticências e painel especial para a prova.
sub(
 r'''    function pdfDrawTemplateDayPanel\(commands,day,panelTop,panelHeight,options=\{\}\)\{.*?\n    \}\n\n    function pdfPrepareWeeklyStyle''',
'''    function pdfDrawTemplateDayPanel(commands,day,panelTop,panelHeight,options={}){
      const {width,margin}=PDF_PAGE;
      const p=options.palette||pdfTemplatePalette();
      const panelWidth=width-margin*2;
      const panelBottom=panelTop-panelHeight;
      const family=p.family;
      const examDay=Boolean(day.isExamDay);
      const simulation=!examDay&&(day.tasks||[]).some(task=>String(task.type||'').toLowerCase().includes('simulado'));
      const bodyFill=p.bodyDark?p.soft:p.white;
      const bodyText=p.text;
      const titleFill=examDay?p.accent2:(family==='premium_minimalista'?p.white:(simulation?p.accent2:p.dark));
      const titleText=examDay?p.dark:(family==='premium_minimalista'?p.dark:(simulation&&family!=='policial_masculino'?p.dark:p.white));
      const border=examDay?p.accent2:(family==='premium_minimalista'?p.accent:(simulation?p.accent2:p.accent));

      pdfRect(commands,margin,panelBottom,panelWidth,panelHeight,bodyFill,border,.9);
      pdfRect(commands,margin,panelTop-38,panelWidth,38,titleFill,border,.8);
      pdfDrawCalendarGlyph(commands,margin+12,panelTop-28,16,examDay?p.dark:(family==='premium_minimalista'?p.accent:(simulation&&family!=='policial_masculino'?p.dark:p.accent2)));
      pdfText(commands,margin+38,panelTop-24,pdfTemplateDayLabel(day),12.1,true,titleText);

      let rightLabel='';
      if(examDay) rightLabel='DIA DA PROVA';
      else if(options.weekIndex!=null) rightLabel=`SEMANA ${options.weekIndex+1}`;
      else if(day.planIndex!=null) rightLabel=`DIA ${day.planIndex+1} DE ${options.totalDays||''}`;
      if(rightLabel) pdfText(commands,width-margin-12-112,panelTop-24,rightLabel,9.4,true,titleText,'right',112);

      if(examDay){
        pdfText(commands,margin+18,panelTop-82,'DIA DA PROVA',15,true,p.accent2);
        pdfDrawWrapped(commands,'Não há estudo ou simulado programado nesta data. Priorize descanso, alimentação, documentos e deslocamento para a prova.',margin+18,panelTop-110,panelWidth-36,10.5,false,p.bodyDark?p.white:p.text,5,14);
        return;
      }

      const columnsTop=panelTop-38;
      const columnsHeight=25;
      const columnsFill=family==='policial_masculino'?p.dark2:(family==='vestibular_masculino'?p.dark2:p.soft);
      const columnsText=family==='policial_masculino'||family==='vestibular_masculino'?p.white:(family==='premium_minimalista'?p.accent:p.dark);
      pdfRect(commands,margin,columnsTop-columnsHeight,panelWidth,columnsHeight,columnsFill,p.line,.45);

      const timeW=80;
      const subjectW=170;
      const contentW=panelWidth-timeW-subjectW;
      const x1=margin+timeW;
      const x2=x1+subjectW;
      pdfLine(commands,x1,panelBottom,x1,columnsTop,p.line,.45);
      pdfLine(commands,x2,panelBottom,x2,columnsTop,p.line,.45);
      pdfDrawClockGlyph(commands,margin+10,columnsTop-19,10,columnsText);
      pdfText(commands,margin+26,columnsTop-17,'HORÁRIO',8.0,true,columnsText);
      pdfDrawBookGlyph(commands,x1+10,columnsTop-19,11,columnsText);
      pdfText(commands,x1+27,columnsTop-17,'MATÉRIA + TIPO',8.0,true,columnsText);
      pdfDrawDocGlyph(commands,x2+10,columnsTop-19,10,columnsText);
      pdfText(commands,x2+26,columnsTop-17,'CONTEÚDO / TEMA',8.0,true,columnsText);

      const tasks=day.tasks||[];
      const contentTop=columnsTop-columnsHeight-9;
      if(!tasks.length){
        pdfText(commands,margin+18,contentTop-8,'SEM ESTUDO PROGRAMADO',12,true,p.muted);
        pdfText(commands,margin+18,contentTop-30,'Descanso / dia livre',9.6,false,p.muted);
        return;
      }
      if(simulation){
        const task=tasks[0];
        pdfText(commands,margin+18,contentTop-2,'SIMULADO',13,true,p.accent2);
        pdfDrawWrapped(commands,task.activity||task.subject,margin+18,contentTop-27,panelWidth-36,11,true,bodyText,4,14);
        pdfText(commands,margin+18,contentTop-82,`${task.start||''}${task.end?`–${task.end}`:''}`,10,true,p.muted);
        return;
      }

      const available=contentTop-(panelBottom+8);
      let font=9.0;
      let rows=[];
      for(let attempt=0;attempt<7;attempt++){
        const lineHeight=font+1.7;
        rows=tasks.map(task=>{
          const time=`${task.start||''}${task.end?`–${task.end}`:''}`;
          const subject=`${task.subject||'Estudo'} · ${task.type||'Estudo'}`;
          const activity=pdfCalendarActivityText(task);
          const subjectLines=pdfWrapText(subject,subjectW-18,font,6,true);
          const activityLines=pdfWrapText(activity,contentW-18,font,8,false);
          const lines=Math.max(1,subjectLines.length,activityLines.length);
          return {time,subjectLines,activityLines,height:Math.max(18,lines*lineHeight+5)};
        });
        const needed=rows.reduce((sum,row)=>sum+row.height,0);
        if(needed<=available||font<=6.6) break;
        font-=0.4;
      }
      const lineHeight=font+1.7;
      let y=contentTop;
      rows.forEach((row,index)=>{
        if(y<panelBottom+7) return;
        pdfText(commands,margin+9,y,row.time,font,true,p.bodyDark?p.white:p.muted);
        row.subjectLines.forEach((line,lineIndex)=>pdfText(commands,x1+9,y-lineIndex*lineHeight,line,font,true,p.bodyDark?p.white:p.dark));
        row.activityLines.forEach((line,lineIndex)=>pdfText(commands,x2+9,y-lineIndex*lineHeight,line,font,false,p.bodyDark?p.white:bodyText));
        if(index<rows.length-1) pdfLine(commands,margin+8,y-row.height+3,width-margin-8,y-row.height+3,p.line,.32);
        y-=row.height;
      });
    }

    function pdfPrepareWeeklyStyle''',
'painel de dias completo'
)

# 6) Por Dias: inclui a data da prova como painel especial, sem contá-la como dia de estudo.
sub(
 r'''    function pdfPrepareDaysStyle\(\)\{.*?\n    \}\n\n    function pdfCalendarActivityText''',
'''    function pdfPrepareDaysStyle(){
      const tasksByDate=new Map();
      pdfSortedTasks().forEach(task=>{
        if(!task.date) return;
        if(!tasksByDate.has(task.date)) tasksByDate.set(task.date,[]);
        tasksByDate.get(task.date).push(task);
      });
      let dates=state.adminGenerated?pdfAdminCalendarDates():[];
      if(!dates.length) dates=[...tasksByDate.keys()].sort().map(dateFromKey).filter(Boolean);
      const exam=pdfExamDate();
      const examKey=exam?localDateKey(exam):'';
      if(exam&&!dates.some(date=>localDateKey(date)===examKey)) dates.push(new Date(exam));
      dates.sort((a,b)=>a-b);
      let studyIndex=0;
      const days=dates.map(date=>{
        const key=localDateKey(date);
        const isExamDay=Boolean(examKey&&key===examKey);
        return {
          key,
          date,
          isExamDay,
          planIndex:isExamDay?null:studyIndex++,
          tasks:isExamDay?[]:(tasksByDate.get(key)||[])
        };
      });
      const pages=[];
      for(let i=0;i<days.length;i+=2) pages.push({items:days.slice(i,i+2)});
      return pages.length?pages:[{items:[]}];
    }

    function pdfCalendarActivityText''',
'calendário inclui prova'
)

# Título da última página sem numeração errada para o dia da prova.
rep(
"      const labels=page.items.map(day=>day.planIndex+1);\n      const suffix=labels.length===2?`DIAS ${labels[0]} E ${labels[1]}`:(labels.length?`DIA ${labels[0]}`:'CALENDÁRIO');\n",
"      const numbered=page.items.filter(day=>!day.isExamDay&&day.planIndex!=null).map(day=>day.planIndex+1);\n      const hasExam=page.items.some(day=>day.isExamDay);\n      const suffix=hasExam&&!numbered.length?'DIA DA PROVA':(hasExam?`DIA ${numbered[0]} + PROVA`:(numbered.length===2?`DIAS ${numbered[0]} E ${numbered[1]}`:(numbered.length?`DIA ${numbered[0]}`:'CALENDÁRIO')));\n",
'título do calendário final'
)

p.write_text(s,encoding='utf-8')
print('PATCH_FINAL_PDFS_V14_OK')
