const PLAN_ID = 'RGNLDFTP26';

const TOPICS = {
  'Língua Portuguesa': [
    'Leitura e interpretação de textos literários',
    'Leitura e interpretação de textos não literários',
    'Sinônimos',
    'Antônimos',
    'Pontuação',
    'Substantivo',
    'Adjetivo',
    'Numeral',
    'Pronome',
    'Verbo',
    'Advérbio',
    'Preposição',
    'Conjunção',
    'Concordância verbal',
    'Concordância nominal',
    'Regência verbal',
    'Regência nominal',
    'Colocação pronominal',
    'Crase'
  ],
  'Noções de Direito': [
    'Constituição Federal — artigos 1º a 4º',
    'Constituição Federal — artigo 5º',
    'Constituição Federal — artigos 6º a 11',
    'Constituição Federal — artigos 12 a 16',
    'Constituição Federal — artigo 37',
    'Constituição Federal — artigo 41',
    'Constituição Federal — artigo 144',
    'Direitos Humanos — conceito',
    'Direitos Humanos — evolução histórica',
    'Direitos Humanos — cidadania',
    'Estado Democrático de Direito',
    'Direito Penal — crime e contravenção',
    'Direito Penal — crime doloso e crime culposo',
    'Direito Penal — crime consumado e crime tentado',
    'Direito Penal — excludentes de ilicitude',
    'Crimes praticados por funcionário público contra a Administração em Geral — artigos 312 a 317',
    'Crimes praticados por funcionário público contra a Administração em Geral — artigos 319 a 327',
    'CPP — exame do corpo de delito e perícias em geral — artigos 158 a 170',
    'CPP — exame do corpo de delito e perícias em geral — artigos 171 a 184',
    'Lei Orgânica da Polícia do Estado de São Paulo — LC nº 207/1979',
    'Lei Orgânica da Polícia do Estado de São Paulo — LC nº 922/2002',
    'Lei Orgânica da Polícia do Estado de São Paulo — LC nº 1.151/2011',
    'Lei Federal nº 12.527/2011 — Lei de Acesso à Informação',
    'Decreto Estadual nº 58.052/2012'
  ],
  'Noções de Criminologia': [
    'Criminologia — conceito',
    'Criminologia — método',
    'Criminologia — objeto',
    'Criminologia — finalidades',
    'Fatores condicionantes da criminalidade',
    'Fatores desencadeantes da criminalidade',
    'Vitimologia',
    'Prevenção do delito'
  ],
  'Noções de Lógica': [
    'Razão e proporção',
    'Grandezas proporcionais',
    'Porcentagem',
    'Regra de três simples',
    'Teoria dos conjuntos',
    'Problemas com raciocínio lógico compatíveis com o nível médio'
  ],
  'Noções de Informática': [
    'Windows 7 — instalação e configuração',
    'Windows 7 — pastas, arquivos e atalhos',
    'Windows 7 — área de trabalho',
    'Windows 7 — manipulação de arquivos e pastas',
    'Windows 7 — menus, programas e aplicativos',
    'Windows 7 — interação com o conjunto de aplicativos',
    'Word 2010 — estrutura básica dos documentos',
    'Word 2010 — edição e formatação de textos',
    'Word 2010 — cabeçalhos, parágrafos e fontes',
    'Word 2010 — marcadores simbólicos e numéricos',
    'Word 2010 — impressão, quebras e numeração de páginas',
    'Word 2010 — inserção de objetos',
    'Excel 2010 — definição e barra de ferramentas',
    'Excel 2010 — células, linhas, colunas e pastas',
    'Excel 2010 — elaboração de tabelas',
    'Excel 2010 — fórmulas',
    'Excel 2010 — inserção de objetos e classificação de dados',
    'Correio eletrônico — uso, preparo e envio de mensagens',
    'Correio eletrônico — anexação de arquivos',
    'Internet — conceito e provedores',
    'Internet — navegação, links e sites',
    'Internet — buscas e vírus'
  ],
  'Técnicas Audiovisuais': [
    'Equipamentos fotográficos convencionais de uso universal',
    'Dispositivos da câmera fotográfica convencional',
    'Iluminação — características da fonte',
    'Iluminação — luz artificial permanente',
    'Iluminação — flash',
    'Iluminação — valores e qualidade da fonte',
    'Iluminação — temperatura de cor',
    'Iluminação — medição e acessórios',
    'Iluminação — valores qualitativos do fluxo e correção de luz',
    'Luz natural — características da fonte e variações',
    'Luz natural — correção e medição dos valores qualitativos do fluxo',
    'Objetivas — tipos e características segundo o ângulo',
    'Objetivas — distância focal',
    'Objetivas — abertura máxima e mínima relativa',
    'Objetivas — aberrações',
    'Objetivas — poder de resolução e camada de cobertura',
    'Materiais sensíveis — negativo e positivo, preto e branco e colorido',
    'Materiais sensíveis — sensibilidade cromática e sistema de medição',
    'Materiais sensíveis — contraste final, correções e indicações de uso',
    'Registro fotográfico físico e químico — camada sensível e imagem latente',
    'Registro fotográfico físico e químico — redução de prata metálica',
    'Registro de cores nas camadas do material sensível colorido',
    'Processamento químico da revelação — negativo e positivo',
    'Processamento químico da revelação — preto e branco e colorido',
    'Processamento químico — agitação, concentração e temperatura',
    'Processamento químico — fases dos processos e produção de corantes',
    'Macrofotografia — correções de exposição',
    'Macrofotografia — objetivas, equipamentos e acessórios',
    'Macrofotografia — iluminação e escalas',
    'Ampliação fotográfica — equipamentos específicos',
    'Filtros ópticos de efeito e de correção',
    'Equipamentos fotográficos digitais',
    'Correlação entre equipamento digital e convencional',
    'Dispositivos das câmeras fotográficas digitais',
    'Nomenclaturas do equipamento fotográfico digital',
    'Captura digital — sensores e formação da imagem',
    'Captura digital — resolução',
    'Captura digital — temperatura de cor e sensibilidade',
    'Captura digital — processamento',
    'Ajustes da câmera digital — modo automático',
    'Ajustes da câmera digital — pré-programas (scene)',
    'Ajustes da câmera digital — modo manual',
    'Arquivos digitais — extensões e formatos',
    'Arquivos digitais — resolução e edição',
    'Arquivos digitais — transferência e redimensionamento',
    'Autenticidade de imagens digitais — formatos não editáveis',
    'Autenticidade de imagens digitais — soma de verificação (HASH)',
    'Armazenamento, transferência e visualização do arquivo fotográfico digital',
    'Deficiências e sistemas de segurança do equipamento e material fotográfico digital',
    'Filmadora digital em HD',
    'Captura de quadros (frames) de filmes',
    'Edição, visualização e impressão de frames'
  ]
};

const SIMULADOS = new Set([
  '2026-10-30','2026-11-13','2026-11-27','2026-12-11','2026-12-23',
  '2027-01-08','2027-01-22','2027-02-05','2027-02-19','2027-03-05',
  '2027-03-19','2027-04-02','2027-04-16'
]);

const PADRAO = {
  1: ['Técnicas Audiovisuais','Língua Portuguesa','Noções de Criminologia'],
  2: ['Técnicas Audiovisuais','Noções de Direito','Noções de Lógica'],
  3: ['Técnicas Audiovisuais','Noções de Informática','Língua Portuguesa'],
  4: ['Técnicas Audiovisuais','Noções de Criminologia','Noções de Direito'],
  5: ['Técnicas Audiovisuais','Noções de Lógica','Noções de Informática']
};

const iso = d => d.toISOString().slice(0, 10);
const addDays = (date, amount) => {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + amount);
  return d;
};

function buildPlan() {
  const state = Object.fromEntries(Object.keys(TOPICS).map(name => [name, { index: 0, count: 0, studied: [] }]));
  const tasks = [];
  const corrections = new Set();
  for (const sim of SIMULADOS) {
    let d = addDays(new Date(sim + 'T12:00:00Z'), 1);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = addDays(d, 1);
    corrections.add(iso(d));
  }

  const nextTask = subject => {
    const st = state[subject];
    st.count += 1;
    if (st.studied.length && st.count % 3 === 0) {
      const recent = st.studied.slice(-3);
      const exercises = Math.floor(st.count / 3) % 2 === 1;
      return {
        type: exercises ? 'Exercícios' : 'Revisão',
        subject,
        activity: (exercises ? 'Questões — ' : 'Revisão — ') + recent.join(' + '),
        notes: 'Priorize questões da VUNESP quando disponíveis e registre os erros.'
      };
    }
    if (st.index < TOPICS[subject].length) {
      const topic = TOPICS[subject][st.index++];
      st.studied.push(topic);
      return {
        type: 'Teoria',
        subject,
        activity: topic,
        notes: subject === 'Noções de Direito'
          ? 'Estude a literalidade e os conceitos indicados no edital-base.'
          : 'Estude o conteúdo e marque como concluído quando compreender os pontos centrais.'
      };
    }
    const recent = st.studied.slice(-6);
    const review = st.count % 2 === 1;
    return {
      type: review ? 'Revisão' : 'Exercícios',
      subject,
      activity: (review ? 'Revisão cumulativa — ' : 'Questões mistas — ') + recent.join(' + '),
      notes: 'Retome os erros e os assuntos de maior dificuldade.'
    };
  };

  let simNumber = 0;
  const start = new Date('2026-10-19T12:00:00Z');
  const lastStudyDay = new Date('2027-04-16T12:00:00Z');

  for (let d = new Date(start); d <= lastStudyDay; d = addDays(d, 1)) {
    const day = d.getUTCDay();
    const date = iso(d);
    if (day === 0 || day === 6) continue;

    if (SIMULADOS.has(date)) {
      simNumber += 1;
      tasks.push({
        id: 'reginaldo-sim-' + simNumber,
        date,
        day,
        start: '',
        end: '',
        subject: 'Simulado completo',
        activity: 'Simulado quinzenal ' + simNumber + ' — 100 questões',
        type: 'Simulado',
        notes: 'Referência do edital-base: 32 Técnicas Audiovisuais, 16 Português, 16 Criminologia, 12 Direito, 12 Lógica e 12 Informática. Tempo de referência: 4h30.'
      });
      continue;
    }

    if (corrections.has(date)) {
      tasks.push({
        id: 'reginaldo-correcao-' + date,
        date,
        day,
        start: '',
        end: '',
        subject: 'Correção do simulado',
        activity: 'Correção completa + caderno de erros',
        type: 'Revisão',
        notes: 'Corrija todas as questões, classifique os erros e marque os assuntos que precisam voltar ao checklist.'
      });
    }

    for (const subject of PADRAO[day] || []) {
      const task = nextTask(subject);
      tasks.push({
        id: 'reginaldo-' + date + '-' + tasks.length,
        date,
        day,
        start: '',
        end: '',
        ...task,
        done: false
      });
    }
  }

  const priorities = {
    'Técnicas Audiovisuais': 5,
    'Língua Portuguesa': 4,
    'Noções de Criminologia': 4,
    'Noções de Direito': 3,
    'Noções de Lógica': 3,
    'Noções de Informática': 3
  };

  return {
    version: 8,
    studentName: 'Reginaldo',
    createdByUser: false,
    creatorName: 'Professor Lucas MPC',
    goal: 'Fotógrafo Técnico-Pericial — Polícia Civil de São Paulo | possível banca: VUNESP',
    examDate: '',
    examDateUnknown: true,
    contestStage: 'estudo_vagas',
    startDate: '2026-10-19',
    endDate: '2027-04-18',
    hoursPerDay: 0,
    scheduleStyle: 'checklist',
    publicTheme: 'masculino',
    generalGuidance: `COMO UTILIZAR ESTE CRONOGRAMA

Reginaldo, este plano foi estruturado em formato de checklist. Você não precisa cumprir horários fixos: em cada dia útil, abra o cronograma, estude os temas indicados e marque cada atividade concluída.

ROTINA
O plano funciona de segunda a sexta-feira. Sábados e domingos ficam livres. A ausência de horário não significa estudar sem método: a prioridade é concluir os itens do dia com qualidade e manter constância ao longo dos seis meses.

PRIORIDADES
Técnicas Audiovisuais recebe a maior frequência porque, no edital-base FTP 1/2013, representava 32 das 100 questões. Língua Portuguesa e Noções de Criminologia tinham 16 questões cada. Direito, Lógica e Informática tinham 12 questões cada.

TEORIA, QUESTÕES E REVISÕES
Os conteúdos novos são intercalados com questões e revisões. Ao resolver questões, dê preferência à VUNESP quando houver material compatível, lembrando que a VUNESP é tratada aqui como possível banca, não como confirmação oficial da próxima prova.

SIMULADOS
A cada quinze dias há um simulado completo. O modelo de referência reproduz a prova do edital-base: 100 questões, com 32 de Técnicas Audiovisuais, 16 de Português, 16 de Criminologia, 12 de Direito, 12 de Lógica e 12 de Informática. O tempo de referência é de 4h30. No primeiro dia útil após cada simulado, faça a correção completa e atualize seu caderno de erros.

IMPORTANTE
Este planejamento usa como base o edital FTP 1/2013 fornecido para a preparação. Como não há uma nova data de prova confirmada neste plano, os seis meses devem ser tratados como um ciclo completo de preparação. Se um novo edital for publicado, o cronograma deve ser revisado e ajustado.`,
    studyRoutine: null,
    subjects: Object.keys(TOPICS).map(name => ({ name, priority: priorities[name], level: 'intermediario' })),
    syllabus: Object.entries(TOPICS).map(([name, topics]) => ({
      name,
      countInMetrics: true,
      topics: topics.map(title => ({ title, subtopics: [] }))
    })),
    tasks,
    createdAt: '2026-10-15T20:30:00.000Z',
    brand: 'Professor Lucas MPC'
  };
}

const BOOTSTRAP = { [PLAN_ID]: buildPlan() };

export function getBootstrapPlan(id) {
  const plan = BOOTSTRAP[String(id || '').toUpperCase()];
  return plan ? structuredClone(plan) : null;
}

export function isBootstrapPlan(id) {
  return Boolean(BOOTSTRAP[String(id || '').toUpperCase()]);
}
