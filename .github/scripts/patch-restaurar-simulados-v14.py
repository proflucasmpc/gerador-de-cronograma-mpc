from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""      const reviewError=distribute(reviewUnits,revisionDates);\n      if(reviewError) return reviewError;\n\n      tasks.sort((a,b)=>{\n"""
new="""      const reviewError=distribute(reviewUnits,revisionDates);\n      if(reviewError) return reviewError;\n\n      preview.simDates.forEach((date,simulationIndex)=>{\n        const start=timeToMinutes(draft.simulationStart);\n        const day=(date.getDay()+6)%7;\n        const bySubject=draft.simulationType==='subject';\n        const simulationSubject=bySubject&&draft.subjects.length\n          ? String(draft.subjects[simulationIndex%draft.subjects.length].name||'Matéria').trim()\n          : '';\n        tasks.push({\n          id:cryptoId(),\n          day,\n          date:localDateKey(date),\n          cycleOrder:tasks.length,\n          start:minutesToTime(start),\n          end:minutesToTime(start+draft.simulationMinutes),\n          subject:bySubject?`Simulado - ${simulationSubject}`:'Simulado completo',\n          activity:bySubject?`Simulado por matéria - ${simulationSubject}`:`Simulado completo - ${draft.goal}`,\n          type:bySubject?'Simulado por matéria':'Simulado completo',\n          notes:bySubject\n            ? `Dia reservado exclusivamente para simulado da matéria ${simulationSubject}.`\n            : 'Dia reservado exclusivamente para a realização do simulado completo.',\n          done:false\n        });\n      });\n\n      tasks.sort((a,b)=>{\n"""
if old not in s: raise SystemExit('ponto de inserção dos simulados não encontrado')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('PATCH_SIMULADOS_V14_OK')
