from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: bloco não encontrado')
    s=s.replace(old,new,1)

# Adiciona o mesmo Resumo inteligente da visão do aluno à área administrativa.
anchor='''      <section class="admin-card admin-pdf-card">\n        <div>\n          <h3>6. Personalização do PDF</h3>'''
insert='''      <section class="admin-card tool-destination" id="adminInsightsCard">\n        <div class="section-title">\n          <div>\n            <h3>6. Resumo inteligente</h3>\n            <p class="helper">Mostra, com a mesma lógica da visão do aluno, a matéria com maior carga, o equilíbrio do planejamento e a disciplina com menor presença.</p>\n          </div>\n          <button class="btn btn-secondary btn-small" id="adminRefreshInsightsBtn" type="button">Atualizar</button>\n        </div>\n        <div class="insights" id="adminInsights"></div>\n      </section>\n\n      <section class="admin-card admin-pdf-card">\n        <div>\n          <h3>7. Personalização do PDF</h3>'''
rep(anchor,insert,'seção administrativa')
rep('''          <h3>7. Gere o cronograma personalizado</h3>''','''          <h3>8. Gere o cronograma personalizado</h3>''','numeração gerar')

old='''    function renderInsights(){\n      const box=el('insights'); const totalMinutes=state.tasks.reduce((s,t)=>s+taskDuration(t),0);\n      const bySubject={}; state.tasks.forEach(t=>bySubject[t.subject]=(bySubject[t.subject]||0)+taskDuration(t));\n      const entries=Object.entries(bySubject).sort((a,b)=>b[1]-a[1]);\n      const most=entries[0]?.[0]||'Nenhuma'; const least=entries.length>1?entries.at(-1)[0]:'Ainda não calculado';\n      const activeDays=new Set(state.tasks.map(t=>t.day)).size;\n      box.innerHTML=`\n        <div class="insight"><strong>Distribuição principal</strong><p>${most} concentra mais tempo no cronograma atual.</p></div>\n        <div class="insight"><strong>Equilíbrio semanal</strong><p>${activeDays} dia(s) possuem atividades e o total planejado é ${formatHours(totalMinutes)}.</p></div>\n        <div class="insight"><strong>Ponto de atenção</strong><p>${least} possui menor presença. Reavalie se a disciplina também é importante para seu objetivo.</p></div>`;\n    }'''
new='''    function buildInsightsMarkup(tasks=state.tasks){\n      const totalMinutes=tasks.reduce((s,t)=>s+taskDuration(t),0);\n      const bySubject={};\n      tasks.forEach(t=>bySubject[t.subject]=(bySubject[t.subject]||0)+taskDuration(t));\n      const entries=Object.entries(bySubject).sort((a,b)=>b[1]-a[1]);\n      const most=entries[0]?.[0]||'Nenhuma';\n      const least=entries.length>1?entries.at(-1)[0]:'Ainda não calculado';\n      const activeDays=new Set(tasks.map(t=>t.day)).size;\n      return `\n        <div class="insight"><strong>Distribuição principal</strong><p>${most} concentra mais tempo no cronograma atual.</p></div>\n        <div class="insight"><strong>Equilíbrio semanal</strong><p>${activeDays} dia(s) possuem atividades e o total planejado é ${formatHours(totalMinutes)}.</p></div>\n        <div class="insight"><strong>Ponto de atenção</strong><p>${least} possui menor presença. Reavalie se a disciplina também é importante para seu objetivo.</p></div>`;\n    }\n\n    function renderInsights(){\n      const markup=buildInsightsMarkup(state.tasks);\n      const studentBox=el('insights');\n      const adminBox=el('adminInsights');\n      if(studentBox) studentBox.innerHTML=markup;\n      if(adminBox) adminBox.innerHTML=markup;\n    }'''
rep(old,new,'função insights compartilhada')

old_event="""      el('refreshInsightsBtn').onclick=renderInsights; el('expandStatsBtn').onclick=updateStats;\n"""
new_event="""      el('refreshInsightsBtn').onclick=renderInsights;\n      if(el('adminRefreshInsightsBtn')) el('adminRefreshInsightsBtn').onclick=renderInsights;\n      el('expandStatsBtn').onclick=updateStats;\n"""
rep(old_event,new_event,'evento atualizar admin')

# Atualiza o resumo administrativo assim que um cronograma administrativo é gerado.
old_gen='''      hydrateSettings();\n      renderSchedule();\n'''
new_gen='''      hydrateSettings();\n      renderSchedule();\n      renderInsights();\n'''
rep(old_gen,new_gen,'atualização após gerar')

p.write_text(s,encoding='utf-8')
print('PATCH_ADMIN_INSIGHTS_OK')
