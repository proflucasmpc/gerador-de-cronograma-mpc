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

anchor='''    function adminSubjectQueues(draft){'''
helpers=r'''    function adminReservedReviewDays(draft,window){
      if(!draft.examDate) return 0;
      return Math.min(7,Math.max(0,window.days-1));
    }

    function adminTopicKey(unit){
      return `${String(unit.subject||'').trim().toLowerCase()}|||${String(unit.topic||'').trim().toLowerCase()}`;
    }

    function adminStageOrder(type){
      const value=String(type||'').toLowerCase();
      if(value.includes('teoria')) return 0;
      if(value.includes('exerc')) return 1;
      if(value.includes('revis')) return 2;
      return 3;
    }

    function adminDaysBetweenKeys(a,b){
      if(!a||!b) return Infinity;
      const da=dateFromKey(a), db=dateFromKey(b);
      if(!da||!db) return Infinity;
      return Math.abs(calendarDaysBetween(da,db)-1);
    }

    function adminCanPlaceUnitOnDate(unit,date,lastByTopic){
      const key=adminTopicKey(unit);
      const previous=lastByTopic.get(key);
      if(!previous) return true;
      const gap=adminDaysBetweenKeys(previous.date,localDateKey(date));
      return gap>=1;
    }

    function adminIsRevisionUnit(unit){
      return String(unit?.type||'').toLowerCase().includes('revis');
    }

'''
rep(anchor,helpers+anchor,'helpers de datas')

rep("""          if(draft.includeTheory) units.push({subject:name,topic,type:'Teoria',activity:`Teoria - ${topic}`,duration});
          if(draft.includeExercises) units.push({subject:name,topic,type:'Exercícios',activity:`Exercícios - ${topic}`,duration});
""","""          if(draft.includeTheory) units.push({subject:name,topic,type:'Teoria',stage:0,activity:`Teoria - ${topic}`,duration});
          if(draft.includeExercises) units.push({subject:name,topic,type:'Exercícios',stage:1,activity:`Exercícios - ${topic}`,duration});
""",'metadados teoria/exercícios')
rep("""              type:'Revisão',
              activity:`Revisão - ${reviewBuffer.join(', ')}`,
""","""              type:'Revisão',
              stage:2,
              activity:`Revisão - ${reviewBuffer.join(', ')}`,
""",'metadado revisão')

new_builder=r'''    function adminBuildStudyTasks(draft,preview){
      const tasks=[];
      const allUnits=[...preview.units];
      const dailyLimit=Math.round(draft.hoursPerDay*60);
      const startMinute=timeToMinutes(draft.preferredStart);
      const allStudyDates=[...preview.studyDates];
      if(!allStudyDates.length) return {error:'Não há dias de estudo disponíveis no período selecionado.'};

      const reservedCount=adminReservedReviewDays(draft,preview.window);
      const regularDates=reservedCount
        ? allStudyDates.filter(date=>calendarDaysBetween(date,preview.window.end)>reservedCount)
        : [...allStudyDates];
      const finalDates=reservedCount
        ? allStudyDates.filter(date=>calendarDaysBetween(date,preview.window.end)<=reservedCount)
        : [];
      const contentDates=regularDates.length?regularDates:allStudyDates;

      const regularUnits=allUnits.filter(unit=>!adminIsRevisionUnit(unit));
      const reviewUnits=allUnits.filter(adminIsRevisionUnit);
      const lastByTopic=new Map();
      const usedByDate=new Map();
      const countByDate=new Map();

      const place=(unit,date)=>{
        const dateKey=localDateKey(date);
        const used=usedByDate.get(dateKey)||0;
        const count=countByDate.get(dateKey)||0;
        const gap=count?10:0;
        if(unit.duration>dailyLimit) return false;
        if(used+gap+unit.duration>dailyLimit) return false;
        if(!adminCanPlaceUnitOnDate(unit,date,lastByTopic)) return false;
        const start=startMinute+used+gap;
        const day=(date.getDay()+6)%7;
        tasks.push({
          id:cryptoId(), day, date:dateKey, cycleOrder:tasks.length,
          start:minutesToTime(start), end:minutesToTime(start+unit.duration),
          subject:unit.subject, activity:unit.activity, type:unit.type,
          notes:'', done:false
        });
        usedByDate.set(dateKey,used+gap+unit.duration);
        countByDate.set(dateKey,count+1);
        lastByTopic.set(adminTopicKey(unit),{date:dateKey,type:unit.type});
        return true;
      };

      const distribute=(units,dates)=>{
        if(!units.length) return null;
        if(!dates.length) return {error:'Não há datas disponíveis para distribuir todas as atividades.'};
        const span=Math.max(1,dates.length-1);
        const denom=Math.max(1,units.length-1);
        for(let i=0;i<units.length;i++){
          const unit=units[i];
          const preferredIndex=Math.round((i/denom)*span);
          let placed=false;
          for(let offset=0;offset<dates.length&&!placed;offset++){
            const idx=(preferredIndex+offset)%dates.length;
            if(place(unit,dates[idx])) placed=true;
          }
          if(!placed) return {error:`Não foi possível encaixar ${String(unit.type||'atividade').toLowerCase()} de ${unit.subject} dentro do período sem ultrapassar o limite diário e o espaçamento pedagógico.`};
        }
        return null;
      };

      const regularError=distribute(regularUnits,contentDates);
      if(regularError) return regularError;

      const revisionDates=finalDates.length?finalDates:contentDates.slice(Math.max(0,contentDates.length-Math.min(7,contentDates.length)));
      const reviewError=distribute(reviewUnits,revisionDates);
      if(reviewError) return reviewError;

      tasks.sort((a,b)=>{
        const da=dateFromKey(a.date), db=dateFromKey(b.date);
        const diff=(da&&db)?da-db:0;
        if(diff) return diff;
        return timeToMinutes(a.start)-timeToMinutes(b.start);
      });
      tasks.forEach((task,index)=>task.cycleOrder=index);
      return {tasks};
    }
'''
sub(r'    function adminBuildStudyTasks\(draft,preview\)\{.*?\n    \}\n\n    function adminPersonalizationData',new_builder+'\n\n    function adminPersonalizationData','novo agendador')

old_label="""      label.textContent=`Período: ${preview.window.days} dias corridos, ${preview.studyDates.length} dias de estudo e ${preview.simDates.length} dias exclusivos de simulado. Capacidade aproximada: ${formatHours(preview.availableMinutes)}; atividades previstas: ${preview.units.length}, com cerca de ${formatHours(preview.requiredMinutes)}.${fits?' O plano cabe no período.':' O plano não cabe no período com as configurações atuais.'}`;
"""
new_label="""      const reserved=adminReservedReviewDays(draft,preview.window);
      label.textContent=`Período: ${preview.window.days} dias corridos, ${preview.studyDates.length} dias de estudo e ${preview.simDates.length} dias exclusivos de simulado. Capacidade aproximada: ${formatHours(preview.availableMinutes)}; atividades previstas: ${preview.units.length}, com cerca de ${formatHours(preview.requiredMinutes)}.${reserved?` Os últimos ${reserved} dia(s) do período serão priorizados para revisões, questões e simulados.`:''}${fits?' O plano cabe no período e será distribuído ao longo das datas disponíveis.':' O plano não cabe no período com as configurações atuais.'}`;
"""
rep(old_label,new_label,'mensagem de capacidade')

p.write_text(s,encoding='utf-8')
print('PATCH_ALGORITMO_DATAS_V13_OK')
