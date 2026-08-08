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

# Helpers de distribuição temporal e reta final.
anchor='''    function adminSubjectQueues(draft){'''
helpers=r'''    function adminReservedReviewDays(draft,window){
      // Para cronogramas com data de prova conhecida, preserva a última semana útil
      // para revisão/questões/simulados. O dia da prova não recebe estudo regular.
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
      const currentStage=adminStageOrder(unit.type);
      const previousStage=adminStageOrder(previous.type);
      // O mesmo tópico nunca recebe dois contatos no mesmo dia.
      const gap=adminDaysBetweenKeys(previous.date,localDateKey(date));
      if(gap<1) return false;
      // Para teoria -> exercícios e exercícios -> revisão, exige ao menos outro dia.
      if(currentStage>previousStage && gap<1) return false;
      return true;
    }

    function adminIsRevisionUnit(unit){
      return String(unit?.type||'').toLowerCase().includes('revis');
    }

'''
rep(anchor,helpers+anchor,'helpers de datas')

# Ordena as unidades de cada tópico mantendo teoria, exercícios e revisão separados pelo agendador.
# A fila original continua intercalando matérias; apenas adicionamos metadados de estágio.
old_unit="""          if(draft.includeTheory) units.push({subject:name,topic,type:'Teoria',activity:`Teoria - ${topic}`,duration});
          if(draft.includeExercises) units.push({subject:name,topic,type:'Exercícios',activity:`Exercícios - ${topic}`,duration});
"""
new_unit="""          if(draft.includeTheory) units.push({subject:name,topic,type:'Teoria',stage:0,activity:`Teoria - ${topic}`,duration});
          if(draft.includeExercises) units.push({subject:name,topic,type:'Exercícios',stage:1,activity:`Exercícios - ${topic}`,duration});
"""
rep(old_unit,new_unit,'metadados teoria/exercícios')
rep("""              type:'Revisão',
              activity:`Revisão - ${reviewBuffer.join(', ')}`,
""","""              type:'Revisão',
              stage:2,
              activity:`Revisão - ${reviewBuffer.join(', ')}`,
""",'metadado revisão')

# Substitui o agendador: distribui o conteúdo ao longo do período em vez de preencher os primeiros dias.
new_builder=r'''    function adminBuildStudyTasks(draft,preview){
      const tasks=[];
      const allUnits=[...preview.units];
      const dailyLimit=Math.round(draft.hoursPerDay*60);
      const startMinute=timeToMinutes(draft.preferredStart);
      const allStudyDates=[...preview.studyDates];
      if(!allStudyDates.length) return {error:'Não há dias de estudo disponíveis no período selecionado.'};

      // Quando há data de prova, reserva os últimos dias válidos para revisão/questões.
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

      const distribute=(units,dates,preferSpread=true)=>{
        if(!units.length) return null;
        if(!dates.length) return {error:'Não há datas disponíveis para distribuir todas as atividades.'};
        const span=Math.max(1,dates.length-1);
        const denom=Math.max(1,units.length-1);
        for(let i=0;i<units.length;i++){
          const unit=units[i];
          let preferredIndex=preferSpread?Math.round((i/denom)*span):0;
          let placed=false;
          // Procura primeiro a partir da posição proporcional; depois percorre o período inteiro.
          for(let pass=0;pass<2&&!placed;pass++){
            const start=pass===0?preferredIndex:0;
            for(let offset=0;offset<dates.length&&!placed;offset++){
              const idx=(start+offset)%dates.length;
              if(place(unit,dates[idx])) placed=true;
            }
          }
          if(!placed) return {error:`Não foi possível encaixar ${unit.type.toLowerCase()} de ${unit.subject} dentro do período sem ultrapassar o limite diário e o espaçamento pedagógico.`};
        }
        return null;
      };

      const regularError=distribute(regularUnits,contentDates,true);
      if(regularError) return regularError;

      // Revisões usam preferencialmente a reta final; se não couberem, aproveitam o fim do período regular.
      const revisionDates=finalDates.length?finalDates:contentDates.slice(Math.max(0,contentDates.length-Math.min(7,contentDates.length)));
      const reviewError=distribute(reviewUnits,revisionDates,true);
      if(reviewError){
        const fallback=[...contentDates,...finalDates].filter((date,index,array)=>array.findIndex(d=>localDateKey(d)===localDateKey(date))===index);
        const retry=distribute(reviewUnits.filter(unit=>!tasks.some(task=>task.subject===unit.subject&&task.activity===unit.activity)),fallback,true);
        if(retry) return retry;
      }

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
sub(r'    function adminBuildStudyTasks\(draft,preview\)\{.*?\n    \}\n\n    function adminBuildSimulationTasks',new_builder+'\n\n    function adminBuildSimulationTasks','novo agendador')

# Capacidade agora considera que as horas diárias são limite máximo, não meta de preenchimento.
# Adiciona aviso explícito sobre uso do período e reta final.
old_label="""      label.textContent=`Período: ${preview.window.days} dias corridos, ${preview.studyDates.length} dias de estudo e ${preview.simDates.length} dias exclusivos de simulado. Capacidade aproximada: ${formatHours(preview.availableMinutes)}; atividades previstas: ${preview.units.length}, com cerca de ${formatHours(preview.requiredMinutes)}.${fits?' O plano cabe no período.':' O plano não cabe no período com as configurações atuais.'}`;
"""
new_label="""      const reserved=adminReservedReviewDays(draft,preview.window);
      label.textContent=`Período: ${preview.window.days} dias corridos, ${preview.studyDates.length} dias de estudo e ${preview.simDates.length} dias exclusivos de simulado. Capacidade aproximada: ${formatHours(preview.availableMinutes)}; atividades previstas: ${preview.units.length}, com cerca de ${formatHours(preview.requiredMinutes)}.${reserved?` Os últimos ${reserved} dia(s) do período serão priorizados para revisões, questões e simulados.`:''}${fits?' O plano cabe no período e será distribuído ao longo das datas disponíveis.':' O plano não cabe no período com as configurações atuais.'}`;
"""
rep(old_label,new_label,'mensagem de capacidade')

# Simulado recorrente em dias escolhidos: não permitir que estudo regular seja colocado na mesma data.
# A preview já exclui simKeys; adicionamos uma validação defensiva na geração.
old_sim='''      const simTasks=adminBuildSimulationTasks(draft,preview);
      const planned={tasks:[...study.tasks,...simTasks]};'''
new_sim='''      const simTasks=adminBuildSimulationTasks(draft,preview);
      const simDateKeys=new Set(simTasks.map(task=>task.date));
      const conflicting=study.tasks.find(task=>simDateKeys.has(task.date));
      if(conflicting){
        status.className='admin-generation-status error';
        status.textContent='Erro interno: uma data exclusiva de simulado recebeu atividade regular. Gere novamente após revisar os dias escolhidos.';
        return;
      }
      const planned={tasks:[...study.tasks,...simTasks]};'''
rep(old_sim,new_sim,'validação de simulados')

p.write_text(s,encoding='utf-8')
print('PATCH_ALGORITMO_DATAS_V13_OK')
