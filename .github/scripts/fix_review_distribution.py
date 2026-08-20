from pathlib import Path

# 1) Corrige o planejador-base usado pelo Resumo Inteligente e pela geração inicial.
admin_path = Path('admin.html')
admin = admin_path.read_text()

old_units = """      const regularUnits=allUnits.filter(unit=>!adminIsRevisionUnit(unit));
      const reviewUnits=allUnits.filter(adminIsRevisionUnit);
      const lastByTopic=new Map();"""
new_units = """      // Mantém teoria, exercícios e revisões na sequência pedagógica original.
      // As revisões comuns acompanham o avanço do conteúdo em vez de serem acumuladas na reta final.
      const sequencedUnits=[...allUnits];
      const lastByTopic=new Map();"""

if old_units in admin:
    admin = admin.replace(old_units, new_units, 1)
elif 'const sequencedUnits=[...allUnits];' not in admin:
    raise SystemExit('Bloco de unidades do planejador-base não encontrado')

old_distribution = """      const regularError=distribute(regularUnits,contentDates);
      if(regularError) return regularError;

      const revisionDates=finalDates.length?finalDates:contentDates.slice(Math.max(0,contentDates.length-Math.min(7,contentDates.length)));
      const reviewError=distribute(reviewUnits,revisionDates);
      if(reviewError) return reviewError;"""
new_distribution = """      // Distribui o ciclo completo antes da reta final: teoria -> exercícios -> revisões intermediárias.
      // Os últimos dias continuam protegidos e não viram um depósito de todas as revisões do cronograma.
      const sequenceError=distribute(sequencedUnits,contentDates);
      if(sequenceError) return sequenceError;"""

if old_distribution in admin:
    admin = admin.replace(old_distribution, new_distribution, 1)
elif 'const sequenceError=distribute(sequencedUnits,contentDates);' not in admin:
    raise SystemExit('Bloco antigo de distribuição de revisões não encontrado')

old_preview = "Os últimos ${reserved} dia(s) do período serão priorizados para revisões, questões e simulados."
new_preview = "As revisões normais serão distribuídas ao longo do ciclo; os últimos ${reserved} dia(s) serão protegidos para reta final, questões e simulados."
if old_preview in admin:
    admin = admin.replace(old_preview, new_preview, 1)

admin_path.write_text(admin)

# 2) Corrige a segunda camada do agendador (estudo contínuo, fracionado, 12x36 e personalizado).
routine_path = Path('admin-study-routine.js')
routine = routine_path.read_text()

old_routine_reviews = """    const reviewStart=range?.exam&&chosen.protectedDays>0?dateKey(addDays(range.exam,-chosen.protectedDays)):'';
    const actualReviewItems=reviews.map((task,index)=>({task,remaining:durationOf(task),originalIndex:index,segments:[]}));
    const reviewScheduled=scheduleReviews(actualReviewItems,actualSlots,reviewStart);
    if(!reviewScheduled.ok){alert(`A teoria e os exercícios couberam, mas faltam aproximadamente ${formatMinutes(reviewScheduled.remaining||0)} para as revisões. O cronograma original foi mantido.`);return false}"""
new_routine_reviews = """    // As datas-base das revisões já acompanham o avanço dos conteúdos.
    // Aqui apenas adaptamos essas revisões às janelas reais do aluno, sem concentrá-las nos últimos dias.
    const actualReviewItems=reviews.map((task,index)=>({task,remaining:durationOf(task),originalIndex:index,segments:[]}));
    const reviewScheduled=scheduleReviews(actualReviewItems,actualSlots,'');
    if(!reviewScheduled.ok){alert(`A teoria e os exercícios couberam, mas faltam aproximadamente ${formatMinutes(reviewScheduled.remaining||0)} para as revisões distribuídas. O cronograma original foi mantido.`);return false}"""

if old_routine_reviews in routine:
    routine = routine.replace(old_routine_reviews, new_routine_reviews, 1)
elif "scheduleReviews(actualReviewItems,actualSlots,'')" not in routine:
    raise SystemExit('Bloco de revisões do agendador de rotina não encontrado')

old_strategy = """      repairTheoryBeforeExerciseByTopic:true,
      protectedFinalReviewDays:chosen.protectedDays,"""
new_strategy = """      repairTheoryBeforeExerciseByTopic:true,
      routineReviewsDistributed:true,
      protectedFinalReviewDays:chosen.protectedDays,"""
if old_strategy in routine:
    routine = routine.replace(old_strategy, new_strategy, 1)
elif 'routineReviewsDistributed:true' not in routine:
    raise SystemExit('Bloco de metadados da estratégia não encontrado')

routine_path.write_text(routine)

# 3) Bump de cache do módulo para o navegador não reutilizar a versão anterior.
enh_path = Path('admin-enhancements.js')
enh = enh_path.read_text()
for old_version in [
    '/admin-study-routine.js?v=20260812-5',
    '/admin-study-routine.js?v=20260812-4',
]:
    enh = enh.replace(old_version, '/admin-study-routine.js?v=20260820-1')
if '/admin-study-routine.js?v=20260820-1' not in enh:
    raise SystemExit('Loader do admin-study-routine.js não encontrado')
enh_path.write_text(enh)
