from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def sub(pattern,new,label,flags=re.S):
    global s
    rx=re.compile(pattern,flags)
    s2,n=rx.subn(lambda m:new,s,count=1)
    if n!=1:
        raise SystemExit(f'{label}: esperado 1 bloco, encontrado {n}')
    s=s2

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: bloco não encontrado')
    s=s.replace(old,new,1)

helpers=r'''    function pdfTemplateFamily(){
      const key=pdfSelectedThemeKey();
      if(key==='policial_feminino') return 'policial_feminino';
      if(key==='policial_masculino') return 'policial_masculino';
      if(key==='vestibular_feminino') return 'vestibular_feminino';
      if(key==='vestibular_masculino') return 'vestibular_masculino';
      if(['elegante_feminino','minimalista_feminino','premium_feminino'].includes(key)) return 'vestibular_feminino';
      return 'premium_minimalista';
    }

    function pdfTemplatePalette(){
      const family=pdfTemplateFamily();
      const palettes={
        policial_feminino:{
          family,dark:[0.035,0.075,0.16],dark2:[0.055,0.11,0.23],accent:[0.93,0.55,0.65],accent2:[0.79,0.61,0.25],soft:[1,0.95,0.97],soft2:[0.97,0.91,0.94],text:[0.055,0.08,0.14],muted:[0.34,0.38,0.46],line:[0.86,0.78,0.82],white:[1,1,1],bodyDark:false
        },
        policial_masculino:{
          family,dark:[0.018,0.05,0.10],dark2:[0.025,0.095,0.17],accent:[0.86,0.65,0.18],accent2:[0.98,0.78,0.31],soft:[0.09,0.10,0.11],soft2:[0.12,0.14,0.16],text:[0.94,0.95,0.96],muted:[0.70,0.73,0.76],line:[0.30,0.34,0.37],white:[1,1,1],bodyDark:true
        },
        vestibular_feminino:{
          family,dark:[0.08,0.14,0.31],dark2:[0.32,0.23,0.48],accent:[0.56,0.43,0.75],accent2:[0.93,0.50,0.61],soft:[0.96,0.93,0.99],soft2:[1,0.94,0.96],text:[0.07,0.12,0.26],muted:[0.37,0.34,0.46],line:[0.84,0.78,0.90],white:[1,1,1],bodyDark:false
        },
        vestibular_masculino:{
          family,dark:[0.02,0.08,0.23],dark2:[0.02,0.20,0.43],accent:[0.00,0.62,0.90],accent2:[0.96,0.43,0.05],soft:[0.94,0.98,1],soft2:[0.90,0.96,1],text:[0.03,0.09,0.22],muted:[0.30,0.38,0.48],line:[0.75,0.84,0.92],white:[1,1,1],bodyDark:false
        },
        premium_minimalista:{
          family,dark:[0.08,0.10,0.11],dark2:[0.16,0.17,0.18],accent:[0.71,0.50,0.13],accent2:[0.82,0.65,0.28],soft:[0.985,0.98,0.965],soft2:[0.96,0.94,0.89],text:[0.08,0.09,0.10],muted:[0.36,0.36,0.35],line:[0.84,0.80,0.70],white:[1,1,1],bodyDark:false
        }
      };
      return palettes[family]||palettes.premium_minimalista;
    }

    function pdfDrawCalendarGlyph(commands,x,y,size,color){
      pdfRect(commands,x,y,size,size*.82,null,color,1);
      pdfLine(commands,x+size*.22,y+size*.82,x+size*.22,y+size*.98,color,1.4);
      pdfLine(commands,x+size*.78,y+size*.82,x+size*.78,y+size*.98,color,1.4);
      pdfLine(commands,x,y+size*.61,x+size,y+size*.61,color,.8);
      for(let row=0;row<2;row++) for(let col=0;col<3;col++){
        pdfRect(commands,x+size*(.17+col*.27),y+size*(.16+row*.22),size*.09,size*.08,color,null,0);
      }
    }

    function pdfDrawClockGlyph(commands,x,y,size,color){
      pdfRect(commands,x,y,size,size,null,color,1);
      pdfLine(commands,x+size*.5,y+size*.5,x+size*.5,y+size*.82,color,1.1);
      pdfLine(commands,x+size*.5,y+size*.5,x+size*.75,y+size*.34,color,1.1);
    }

    function pdfDrawBookGlyph(commands,x,y,size,color){
      const half=size*.46;
      pdfRect(commands,x,y,half,size*.78,null,color,.9);
      pdfRect(commands,x+half+1,y,half,size*.78,null,color,.9);
      pdfLine(commands,x+half+.5,y,x+half+.5,y+size*.78,color,.8);
      pdfLine(commands,x+3,y+size*.61,x+half-3,y+size*.61,color,.6);
      pdfLine(commands,x+half+4,y+size*.61,x+size-3,y+size*.61,color,.6);
    }

    function pdfDrawDocGlyph(commands,x,y,size,color){
      pdfRect(commands,x,y,size*.78,size,null,color,.9);
      pdfLine(commands,x+size*.15,y+size*.72,x+size*.62,y+size*.72,color,.7);
      pdfLine(commands,x+size*.15,y+size*.50,x+size*.62,y+size*.50,color,.7);
      pdfLine(commands,x+size*.15,y+size*.28,x+size*.52,y+size*.28,color,.7);
    }

    function pdfDrawDiamondGlyph(commands,x,y,size,color){
      pdfLine(commands,x,y+size*.5,x+size*.5,y+size,color,1);
      pdfLine(commands,x+size*.5,y+size,x+size,y+size*.5,color,1);
      pdfLine(commands,x+size,y+size*.5,x+size*.5,y,color,1);
      pdfLine(commands,x+size*.5,y,x,y+size*.5,color,1);
    }

    function pdfDrawLeafSprig(commands,x,y,scale,color){
      pdfLine(commands,x,y,x+scale*28,y+scale*34,color,.9);
      for(let i=0;i<4;i++){
        const px=x+scale*(6+i*6), py=y+scale*(8+i*7);
        pdfLine(commands,px,py,px-scale*5,py+scale*6,color,.8);
        pdfLine(commands,px+scale*4,py+scale*3,px+scale*9,py+scale*8,color,.8);
      }
    }

    function pdfDrawTemplateHeader(commands,sectionTitle,pageIndex,pageCount){
      const {width,height,margin}=PDF_PAGE;
      const p=pdfTemplatePalette();
      const family=p.family;
      pdfRect(commands,0,0,width,height,p.white);

      if(family==='premium_minimalista'){
        pdfLine(commands,margin+28,height-35,width-margin-28,height-35,p.accent,1);
        pdfDrawDiamondGlyph(commands,width/2-5,height-40,10,p.accent);
        pdfText(commands,margin,height-82,'CRONOGRAMA DE ESTUDOS',24,true,p.dark,'center',width-margin*2);
        pdfText(commands,margin,height-109,sectionTitle,10.2,true,p.accent,'center',width-margin*2);
        pdfLine(commands,margin+28,height-121,width/2-18,height-121,p.accent,.7);
        pdfLine(commands,width/2+18,height-121,width-margin-28,height-121,p.accent,.7);
      }else if(family==='vestibular_feminino'){
        pdfRect(commands,0,height-126,width,126,p.white);
        pdfRect(commands,0,height-126,120,126,p.soft,null,0);
        pdfRect(commands,width-105,height-126,105,126,p.soft2,null,0);
        pdfDrawLeafSprig(commands,20,height-109,1.05,p.accent);
        pdfDrawLeafSprig(commands,width-68,height-119,.88,p.accent2);
        pdfText(commands,margin,height-63,'CRONOGRAMA DE ESTUDOS',23,true,p.dark,'center',width-margin*2);
        pdfText(commands,margin,height-93,sectionTitle,10.3,true,p.accent,'center',width-margin*2);
        pdfLine(commands,width/2-82,height-108,width/2-13,height-108,p.accent2,.8);
        pdfLine(commands,width/2+13,height-108,width/2+82,height-108,p.accent2,.8);
        pdfDrawDiamondGlyph(commands,width/2-4,height-112,8,p.accent2);
      }else{
        pdfRect(commands,0,height-126,width,126,p.dark);
        if(family==='vestibular_masculino'){
          for(let i=0;i<4;i++) pdfLine(commands,width-128+i*15,height-126,width-66+i*15,height,p.accent,4);
          pdfLine(commands,0,height-126,width,height-126,p.accent2,2);
          pdfText(commands,margin,height-56,'CRONOGRAMA',24,true,p.white);
          pdfText(commands,margin,height-84,'DE ESTUDOS',24,true,p.accent);
          pdfText(commands,margin,height-106,sectionTitle,9.8,true,p.white);
        }else{
          if(!pdfHasLogo()) pdfDrawPoliceShield(commands,margin+38,height-104,58);
          const titleX=pdfHasLogo()?margin:margin+84;
          pdfText(commands,titleX,height-58,'CRONOGRAMA DE ESTUDOS',22,true,p.white);
          pdfText(commands,titleX,height-88,sectionTitle,9.9,true,family==='policial_feminino'?p.accent:p.accent2);
          pdfLine(commands,titleX,height-102,width-margin,height-102,family==='policial_feminino'?p.accent:p.accent,1.2);
          if(family==='policial_feminino'){
            pdfLine(commands,0,height-126,width,height-126,p.accent,3);
            pdfLine(commands,0,height-130,width,height-130,p.accent2,1);
          }else{
            pdfLine(commands,0,height-126,width,height-126,p.accent,2);
          }
        }
      }

      if(pdfHasLogo()) pdfDrawOptionalLogo(commands);
      const metaY=height-148;
      const objective=pdfWrapText(`Objetivo: ${state.goal||'Não informado'}`,width*.58,9.4,1,true)[0];
      pdfText(commands,margin,metaY,objective,9.4,true,p.text);
      if(state.studentName){
        const student=pdfWrapText(`Aluno: ${state.studentName}`,width*.34,9.1,1,true)[0];
        pdfText(commands,width-margin-width*.34,metaY,student,9.1,true,p.muted,'right',width*.34);
      }

      pdfLine(commands,margin,78,width-margin,78,p.accent,1);
      pdfText(commands,margin,63,`Gerado pelo Gerador de Cronograma MPC · ${PDF_THEME_PRESETS[pdfSelectedThemeKey()]?.label||'Modelo personalizado'}`,7.7,true,p.dark);
      pdfText(commands,width-margin-92,63,`Página ${pageIndex+1} de ${pageCount}`,8,false,p.muted,'right',92);
      const button=pdfDrawConfiguredButton(commands);
      return {bodyTop:height-169,bodyBottom:92,button,palette:p};
    }

    function pdfTemplateDayLabel(day){
      if(day.date){
        const d=day.date instanceof Date?day.date:dateFromKey(day.date);
        if(d){
          const name=DAYS[(d.getDay()+6)%7]||'Dia';
          return `${name.toUpperCase()} · ${d.toLocaleDateString('pt-BR')}`;
        }
      }
      if(Number.isFinite(day.day)) return String(DAYS[day.day]||'Dia de estudo').toUpperCase();
      const first=day.tasks?.[0];
      return first?String(DAYS[first.day]||'Dia de estudo').toUpperCase():'DIA DE ESTUDO';
    }

    function pdfDrawTemplateDayPanel(commands,day,panelTop,panelHeight,options={}){
      const {width,margin}=PDF_PAGE;
      const p=options.palette||pdfTemplatePalette();
      const panelWidth=width-margin*2;
      const panelBottom=panelTop-panelHeight;
      const family=p.family;
      const simulation=(day.tasks||[]).some(task=>String(task.type||'').toLowerCase().includes('simulado'));
      const bodyFill=p.bodyDark?p.soft:p.white;
      const bodyText=p.bodyDark?p.text:p.text;
      const titleFill=family==='premium_minimalista'?p.white:(simulation?p.accent2:p.dark);
      const titleText=family==='premium_minimalista'?p.dark:(simulation&&family!=='policial_masculino'?p.dark:p.white);
      const border=family==='premium_minimalista'?p.accent:(simulation?p.accent2:p.accent);

      pdfRect(commands,margin,panelBottom,panelWidth,panelHeight,bodyFill,border,.9);
      pdfRect(commands,margin,panelTop-38,panelWidth,38,titleFill,border,.8);
      pdfDrawCalendarGlyph(commands,margin+12,panelTop-28,16,family==='premium_minimalista'?p.accent:(simulation&&family!=='policial_masculino'?p.dark:p.accent2));
      pdfText(commands,margin+38,panelTop-24,pdfTemplateDayLabel(day),12.1,true,titleText);

      let rightLabel='';
      if(options.weekIndex!=null) rightLabel=`SEMANA ${options.weekIndex+1}`;
      else if(day.planIndex!=null) rightLabel=`DIA ${day.planIndex+1} DE ${options.totalDays||''}`;
      if(rightLabel) pdfText(commands,width-margin-12-112,panelTop-24,rightLabel,9.4,true,titleText,'right',112);

      const columnsTop=panelTop-38;
      const columnsHeight=25;
      const columnsFill=family==='policial_masculino'?p.dark2:(family==='vestibular_masculino'?p.dark2:p.soft);
      const columnsText=family==='policial_masculino'||family==='vestibular_masculino'?p.white:(family==='premium_minimalista'?p.accent:p.dark);
      pdfRect(commands,margin,columnsTop-columnsHeight,panelWidth,columnsHeight,columnsFill,p.line,.45);

      const timeW=92;
      const subjectW=188;
      const contentW=panelWidth-timeW-subjectW;
      const x1=margin+timeW;
      const x2=x1+subjectW;
      pdfLine(commands,x1,panelBottom,x1,columnsTop,p.line,.45);
      pdfLine(commands,x2,panelBottom,x2,columnsTop,p.line,.45);
      pdfDrawClockGlyph(commands,margin+12,columnsTop-19,10,columnsText);
      pdfText(commands,margin+28,columnsTop-17,'HORÁRIO',8.1,true,columnsText);
      pdfDrawBookGlyph(commands,x1+12,columnsTop-19,11,columnsText);
      pdfText(commands,x1+29,columnsTop-17,'MATÉRIA + TIPO',8.1,true,columnsText);
      pdfDrawDocGlyph(commands,x2+12,columnsTop-19,10,columnsText);
      pdfText(commands,x2+28,columnsTop-17,'CONTEÚDO / TEMA',8.1,true,columnsText);

      const tasks=day.tasks||[];
      const contentTop=columnsTop-columnsHeight-10;
      if(!tasks.length){
        pdfText(commands,margin+18,contentTop-8,'SEM ESTUDO PROGRAMADO',12,true,p.muted);
        pdfText(commands,margin+18,contentTop-30,'Descanso / dia livre',9.6,false,p.muted);
        return;
      }
      if(simulation){
        const task=tasks[0];
        pdfText(commands,margin+18,contentTop-2,'SIMULADO',13,true,p.accent2);
        pdfDrawWrapped(commands,task.activity||task.subject,margin+18,contentTop-27,panelWidth-36,11,true,bodyText,2,14);
        pdfText(commands,margin+18,contentTop-62,`${task.start||''}${task.end?`–${task.end}`:''}`,10,true,p.muted);
        return;
      }

      const available=contentTop-(panelBottom+8);
      const rowH=Math.max(10.4,Math.min(20,available/Math.max(1,tasks.length)));
      const font=rowH<11.5?7.25:(rowH<14?8.0:(rowH<17?8.8:9.5));
      let y=contentTop;
      tasks.forEach((task,index)=>{
        if(y<panelBottom+7) return;
        const time=`${task.start||''}${task.end?`–${task.end}`:''}`;
        const subject=`${task.subject||'Estudo'} · ${task.type||'Estudo'}`;
        const activity=pdfCalendarActivityText(task);
        pdfText(commands,margin+10,y,pdfWrapText(time,timeW-18,font,1,true)[0],font,true,p.bodyDark?p.white:p.muted);
        pdfText(commands,x1+10,y,pdfWrapText(subject,subjectW-18,font,1,true)[0],font,true,p.bodyDark?p.white:p.dark);
        pdfText(commands,x2+10,y,pdfWrapText(activity,contentW-18,font,1,false)[0],font,false,p.bodyDark?p.white:bodyText);
        if(index<tasks.length-1) pdfLine(commands,margin+8,y-rowH+3,width-margin-8,y-rowH+3,p.line,.32);
        y-=rowH;
      });
    }

'''

insert_anchor='    function pdfPrepareWeeklyStyle(){\n'
if insert_anchor not in s:
    raise SystemExit('âncora helpers não encontrada')
s=s.replace(insert_anchor,helpers+insert_anchor,1)

weekly_prepare=r'''    function pdfPrepareWeeklyStyle(){
      const groups=[];
      const map=new Map();
      pdfSortedTasks().forEach(task=>{
        const key=pdfWeekKey(task);
        if(!map.has(key)){
          const group={key,tasks:[]};
          map.set(key,group);
          groups.push(group);
        }
        map.get(key).tasks.push(task);
      });
      const planDates=state.adminGenerated?pdfAdminCalendarDates():[];
      const planIndex=new Map(planDates.map((date,index)=>[localDateKey(date),index]));
      const pages=[];
      groups.forEach((group,weekIndex)=>{
        const dayMap=new Map();
        group.tasks.forEach(task=>{
          const key=task.date||`day-${task.day}`;
          if(!dayMap.has(key)){
            const date=task.date?dateFromKey(task.date):null;
            dayMap.set(key,{key,date,day:task.day,planIndex:task.date&&planIndex.has(task.date)?planIndex.get(task.date):null,tasks:[]});
          }
          dayMap.get(key).tasks.push(task);
        });
        const days=[...dayMap.values()].sort((a,b)=>{
          if(a.date&&b.date) return a.date-b.date;
          return (a.day??99)-(b.day??99);
        });
        for(let i=0;i<days.length;i+=2) pages.push({weekIndex,items:days.slice(i,i+2)});
      });
      return pages.length?pages:[{weekIndex:0,items:[]}];
    }
'''
sub(r'    function pdfPrepareWeeklyStyle\(\)\{.*?\n    \}\n\n    function pdfBuildWeeklyStylePage',weekly_prepare+'\n    function pdfBuildWeeklyStylePage','weekly prepare')

weekly_build=r'''    function pdfBuildWeeklyStylePage(page,pageIndex,pageCount){
      const labels=page.items.map(day=>pdfTemplateDayLabel(day));
      const suffix=labels.length===2?' · 2 DIAS':(labels.length===1?' · 1 DIA':'');
      const chrome=pdfDrawTemplateHeader(commands=[],`PLANEJAMENTO SEMANAL · SEMANA ${page.weekIndex+1}${suffix}`,pageIndex,pageCount);
      const {bodyTop,bodyBottom,palette}=chrome;
      const gap=12;
      const top=bodyTop;
      const height=(top-bodyBottom-gap)/2;
      page.items.forEach((day,index)=>{
        const panelTop=top-index*(height+gap);
        pdfDrawTemplateDayPanel(commands,day,panelTop,height,{palette,weekIndex:page.weekIndex});
      });
      if(page.items.length===1){
        const emptyTop=top-(height+gap);
        pdfRect(commands,PDF_PAGE.margin,emptyTop-height,PDF_PAGE.width-PDF_PAGE.margin*2,height,palette.soft,palette.line,.6);
        pdfText(commands,PDF_PAGE.margin+16,emptyTop-34,'FIM DOS DIAS PROGRAMADOS DESTA SEMANA',10.5,true,palette.muted);
      }
      if(!page.items.length) pdfText(commands,PDF_PAGE.margin,bodyTop-28,'Nenhuma atividade semanal cadastrada.',12,true,palette.muted);
      return {content:commands.join('\n'),button:chrome.button};
    }
'''
sub(r'    function pdfBuildWeeklyStylePage\(page,pageIndex,pageCount\)\{.*?\n    \}\n\n    function pdfAdminCalendarDates',weekly_build+'\n    function pdfAdminCalendarDates','weekly build')

days_build=r'''    function pdfBuildDaysStylePage(page,pageIndex,pageCount){
      const labels=page.items.map(day=>day.planIndex+1);
      const suffix=labels.length===2?`DIAS ${labels[0]} E ${labels[1]}`:(labels.length?`DIA ${labels[0]}`:'CALENDÁRIO');
      const commands=[];
      const chrome=pdfDrawTemplateHeader(commands,`CALENDÁRIO POR QUANTIDADE DE DIAS · ${suffix}`,pageIndex,pageCount);
      const {bodyTop,bodyBottom,palette}=chrome;
      const gap=12;
      const panelHeight=(bodyTop-bodyBottom-gap)/2;
      const totalDays=state.adminPlanDays||state.adminPersonalization?.planDays||page.items.length;
      page.items.forEach((day,index)=>{
        const panelTop=bodyTop-index*(panelHeight+gap);
        pdfDrawTemplateDayPanel(commands,day,panelTop,panelHeight,{palette,totalDays});
      });
      if(page.items.length===1){
        const emptyTop=bodyTop-(panelHeight+gap);
        pdfRect(commands,PDF_PAGE.margin,emptyTop-panelHeight,PDF_PAGE.width-PDF_PAGE.margin*2,panelHeight,palette.soft,palette.line,.6);
        pdfText(commands,PDF_PAGE.margin+16,emptyTop-34,'FIM DO PERÍODO PLANEJADO',11,true,palette.muted);
      }
      return {content:commands.join('\n'),button:chrome.button};
    }
'''
sub(r'    function pdfBuildDaysStylePage\(page,pageIndex,pageCount\)\{.*?\n    \}\n\n    function pdfPrepareByStyle',days_build+'\n    function pdfPrepareByStyle','days build')

# Pequeno ajuste no texto explicativo da área administrativa, deixando claro o padrão premium para semanal e dias.
rep(
"O modelo visual é independente do tipo de cronograma. Assim, checklist, ciclo, semanal e quantidade de dias podem usar qualquer um dos 10 modelos.",
"O modelo visual é independente do tipo de cronograma. Nos formatos Semanal e Por Dias, o PDF usa o novo padrão premium com 2 dias grandes por página, inspirado nos templates aprovados.",
'nota admin pdf'
)

p.write_text(s,encoding='utf-8')
print('PATCH_V6_OK')
