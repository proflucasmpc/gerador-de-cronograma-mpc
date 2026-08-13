from pathlib import Path

p=Path('admin-enhancements.js')
s=p.read_text()

start=s.index('  function inferSubjects(plan){')
end=s.index('  function inferSimulation(plan,startDate){', start)
replacement=r'''  function inferSubjects(plan){
    const tasks=Array.isArray(plan.tasks)?plan.tasks:[];
    const listed=Array.isArray(plan.subjects)?plan.subjects:[];
    const nonSim=tasks.filter(t=>!/simulado/i.test(`${t.type||''} ${t.activity||''}`));
    const taskNames=[...new Set(nonSim.map(t=>String(t.subject||'').trim()).filter(Boolean))];
    const listedNames=[...new Set(listed.map(x=>String(x?.name||'').trim()).filter(Boolean))];
    const names=taskNames.length?taskNames:listedNames;
    const result=[];
    names.forEach((name,index)=>{
      const related=nonSim.filter(t=>String(t.subject||'').trim()===name);
      const theory=related.filter(t=>/teoria/i.test(String(t.type||''))||/^\s*(?:Videoaula\s+de\s+teoria|Teoria)/i.test(String(t.activity||'')));
      const exercises=related.filter(t=>/exerc|quest/i.test(`${t.type||''} ${t.activity||''}`));
      const nonReview=related.filter(t=>!/revis/i.test(`${t.type||''} ${t.activity||''}`));
      const source=theory.length?theory:exercises.length?exercises:nonReview.length?nonReview:related;
      const seen=new Set(),topics=[];
      source.forEach(t=>{
        const topic=cleanPublishedTopic(t.activity);
        const key=topic.toLocaleLowerCase('pt-BR');
        if(topic.length>1&&!/^(simulado|revis[aã]o\s+geral)$/i.test(topic)&&!seen.has(key)){seen.add(key);topics.push(topic)}
      });
      if(!topics.length)return;
      const meta=listed.find(x=>String(x?.name||'').trim()===name)||{};
      const level=String(meta.level||'intermediario');
      const difficulty=level==='iniciante'?'dificil':level==='avancado'?'facil':'intermediario';
      result.push({id:`loaded-${Date.now()}-${index}`,name,difficulty,sessionMinutes:median(source.map(taskMinutes),60),topicsText:topics.join('\n')});
    });
    return result;
  }
'''
s=s[:start]+replacement+s[end:]

# cache-bust the enhanced admin script in admin.html
admin=Path('admin.html')
a=admin.read_text()
a=a.replace('/admin-enhancements.js?v=20260812-6','/admin-enhancements.js?v=20260813-1')
admin.write_text(a)

p.write_text(s)
