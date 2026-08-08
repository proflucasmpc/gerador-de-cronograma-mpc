from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: bloco não encontrado')
    s=s.replace(old,new,1)

old="""    function adminSimulationDates(draft,window){
      const dates=[];
      if(!draft.simulationEnabled) return dates;
      const all=adminDatesInWindow(window).filter(date=>!window.exam||localDateKey(date)!==localDateKey(window.exam));
      const interval=Math.max(1,draft.simulationInterval);
      if(draft.simulationMode==='weekday_occurrence'){
        const chosen=new Set((Array.isArray(draft.simulationWeekdays)&&draft.simulationWeekdays.length
          ? draft.simulationWeekdays
          : [draft.simulationWeekday??6]).map(Number));
        const firstMonday=new Date(window.start);
        firstMonday.setDate(firstMonday.getDate()-((firstMonday.getDay()+6)%7));
        all.forEach(date=>{
          const day=(date.getDay()+6)%7;
          if(!chosen.has(day)) return;
          const weekIndex=Math.floor((calendarDaysBetween(firstMonday,date)-1)/7);
          if(weekIndex%interval===0) dates.push(new Date(date));
        });
      }else{
        all.forEach((date,index)=>{
          if((index+1)%interval===0) dates.push(new Date(date));
        });
      }
      return dates;
    }
"""
new="""    function adminSimulationDates(draft,window,options={}){
      const dates=[];
      if(!draft.simulationEnabled) return dates;
      const protectExamEve=options.protectExamEve!==false;
      const all=adminDatesInWindow(window).filter(date=>!window.exam||localDateKey(date)!==localDateKey(window.exam));
      const interval=Math.max(1,draft.simulationInterval);
      if(draft.simulationMode==='weekday_occurrence'){
        const chosen=new Set((Array.isArray(draft.simulationWeekdays)&&draft.simulationWeekdays.length
          ? draft.simulationWeekdays
          : [draft.simulationWeekday??6]).map(Number));
        const firstMonday=new Date(window.start);
        firstMonday.setDate(firstMonday.getDate()-((firstMonday.getDay()+6)%7));
        all.forEach(date=>{
          const day=(date.getDay()+6)%7;
          if(!chosen.has(day)) return;
          const weekIndex=Math.floor((calendarDaysBetween(firstMonday,date)-1)/7);
          if(weekIndex%interval===0) dates.push(new Date(date));
        });
      }else{
        all.forEach((date,index)=>{
          if((index+1)%interval===0) dates.push(new Date(date));
        });
      }
      if(protectExamEve&&window.exam&&draft.simulationType!=='subject'){
        const eveKey=localDateKey(addCalendarDays(window.exam,-1));
        return dates.filter(date=>localDateKey(date)!==eveKey);
      }
      return dates;
    }
"""
rep(old,new,'adminSimulationDates')

old="""      const units=interleaveAdminUnits(queues);
      const simDates=adminSimulationDates(draft,window);
      const simKeys=new Set(simDates.map(localDateKey));
"""
new="""      const units=interleaveAdminUnits(queues);
      const rawSimDates=adminSimulationDates(draft,window,{protectExamEve:false});
      const simDates=adminSimulationDates(draft,window);
      const examEveKey=window.exam?localDateKey(addCalendarDays(window.exam,-1)):'';
      const examEveProtected=Boolean(
        examEveKey&&draft.simulationType!=='subject'&&rawSimDates.some(date=>localDateKey(date)===examEveKey)
      );
      const simKeys=new Set(simDates.map(localDateKey));
"""
rep(old,new,'preview simDates')

old="""      return {window,queues,units,simDates,simKeys,studyDates,availableMinutes,requiredMinutes,diagnostics};
"""
new="""      return {window,queues,units,simDates,simKeys,studyDates,availableMinutes,requiredMinutes,diagnostics,examEveProtected,examEveKey};
"""
rep(old,new,'preview return')

old="""      label.textContent=`Período: ${preview.window.days} dias corridos, ${preview.studyDates.length} dias de estudo e ${preview.simDates.length} dias exclusivos de simulado. Capacidade aproximada: ${formatHours(preview.availableMinutes)}; atividades previstas: ${preview.units.length}, com cerca de ${formatHours(preview.requiredMinutes)}.${reserved?` Os últimos ${reserved} dia(s) do período serão priorizados para revisões, questões e simulados.`:''}${fits?' O plano cabe no período e será distribuído ao longo das datas disponíveis.':' O plano não cabe no período com as configurações atuais.'}`;
"""
new="""      label.textContent=`Período: ${preview.window.days} dias corridos, ${preview.studyDates.length} dias de estudo e ${preview.simDates.length} dias exclusivos de simulado. Capacidade aproximada: ${formatHours(preview.availableMinutes)}; atividades previstas: ${preview.units.length}, com cerca de ${formatHours(preview.requiredMinutes)}.${reserved?` Os últimos ${reserved} dia(s) do período serão priorizados para revisões, questões e simulados.`:''}${preview.examEveProtected?' O simulado completo que cairia na véspera da prova será substituído automaticamente por preparação leve.':''}${fits?' O plano cabe no período e será distribuído ao longo das datas disponíveis.':' O plano não cabe no período com as configurações atuais.'}`;
"""
rep(old,new,'mensagem capacidade')

old="""      preview.simDates.forEach((date,simulationIndex)=>{
        if(draft.examDate&&localDateKey(date)===draft.examDate) return;
        const start=timeToMinutes(draft.simulationStart);
        const day=(date.getDay()+6)%7;
        const bySubject=draft.simulationType==='subject';
        const simulationSubject=bySubject&&draft.subjects.length
          ? String(draft.subjects[simulationIndex%draft.subjects.length].name||'Matéria').trim()
          : '';
        tasks.push({
          id:cryptoId(),
          day,
          date:localDateKey(date),
          cycleOrder:tasks.length,
          start:minutesToTime(start),
          end:minutesToTime(start+draft.simulationMinutes),
          subject:bySubject?`Simulado - ${simulationSubject}`:'Simulado completo',
          activity:bySubject?`Simulado por matéria - ${simulationSubject}`:`Simulado completo - ${draft.goal}`,
          type:bySubject?'Simulado por matéria':'Simulado completo',
          notes:bySubject
            ? `Dia reservado exclusivamente para simulado da matéria ${simulationSubject}.`
            : 'Dia reservado exclusivamente para a realização do simulado completo.',
          done:false
        });
      });

      tasks.sort((a,b)=>{
"""
new="""      preview.simDates.forEach((date,simulationIndex)=>{
        if(draft.examDate&&localDateKey(date)===draft.examDate) return;
        const start=timeToMinutes(draft.simulationStart);
        const day=(date.getDay()+6)%7;
        const bySubject=draft.simulationType==='subject';
        const simulationSubject=bySubject&&draft.subjects.length
          ? String(draft.subjects[simulationIndex%draft.subjects.length].name||'Matéria').trim()
          : '';
        tasks.push({
          id:cryptoId(),
          day,
          date:localDateKey(date),
          cycleOrder:tasks.length,
          start:minutesToTime(start),
          end:minutesToTime(start+draft.simulationMinutes),
          subject:bySubject?`Simulado - ${simulationSubject}`:'Simulado completo',
          activity:bySubject?`Simulado por matéria - ${simulationSubject}`:`Simulado completo - ${draft.goal}`,
          type:bySubject?'Simulado por matéria':'Simulado completo',
          notes:bySubject
            ? `Dia reservado exclusivamente para simulado da matéria ${simulationSubject}.`
            : 'Dia reservado exclusivamente para a realização do simulado completo.',
          done:false
        });
      });

      if(preview.examEveProtected&&preview.examEveKey){
        const eve=dateFromKey(preview.examEveKey);
        const day=eve?(eve.getDay()+6)%7:5;
        tasks.push({
          id:cryptoId(),
          day,
          date:preview.examEveKey,
          cycleOrder:tasks.length,
          start:'18:00',
          end:'18:30',
          subject:'Véspera da prova',
          activity:'Revisão leve e preparação para a prova',
          type:'Preparação',
          notes:'Não faça simulado completo. Revise apenas pontos-chave, separe documentos, organize o deslocamento, alimentação e priorize descanso e sono.',
          done:false
        });
      }

      tasks.sort((a,b)=>{
"""
rep(old,new,'tarefa de véspera')

p.write_text(s,encoding='utf-8')
print('PATCH_VESPERA_PROVA_V15_OK')
