const PLAN_ID = 'JORGECGU26';

const TOPICS = {
  'Estado, Democracia, Direitos e Ciência Política': [
    'Estado e legitimidade',
    'Estado, governo e administração; autoridade, legitimidade e poder; interesse público, pluralismo e conflitos distributivos',
    'Democracia e representação',
    'Representação e participação; responsabilização democrática; relações entre Executivo, Legislativo e Judiciário; governabilidade e controles recíprocos',
    'Federalismo e capacidades estatais',
    'Autonomia, coordenação e cooperação federativa; capacidades administrativas e políticas; burocracia, discricionariedade e implementação de direitos',
    'Ordem constitucional e direitos',
    'Fundamentos e objetivos da República; direitos fundamentais, sociais e políticos; igualdade, devido processo e limites ao exercício do poder; princípios da administração pública',
    'Valor público e controle',
    'Resultados socialmente relevantes; legitimidade, confiança e direitos; controle interno, externo e social; tensões entre eficiência, equidade e garantias',
    'Corrupção como fenômeno político e social',
    'Abuso do poder confiado e apropriação de decisões públicas em benefício particular; dimensões política, administrativa e público-privada',
    'Distinções entre corrupção, falha de gestão, conflito de interesses e ilícitos específicos; clientelismo, patronagem, nepotismo e captura',
    'Mecanismos de reprodução e captura',
    'Assimetrias de poder e informação, incentivos e oportunidades; relações principal-agente e problemas de ação coletiva; normas sociais, tolerância organizacional e redes de favorecimento',
    'Captura de políticas e influência indevida; representação legítima de interesses e favorecimento',
    'Consequências e respostas à corrupção',
    'Efeitos sobre direitos, desigualdades, competição, alocação de recursos, qualidade dos serviços e confiança institucional',
    'Prevenção, detecção, responsabilização e reparação; controles democráticos, participação e capacidades estatais',
    'Avaliação crítica das respostas à corrupção e de seus efeitos não pretendidos, preservados o devido processo e a continuidade de serviços essenciais',
    'Estado e modelos de desenvolvimento econômico',
    'Arranjos de desenvolvimento com mercado, planejamento, regulação, provisão pública e atuação empresarial do Estado; industrialização, inovação e transformação produtiva',
    'Papel das empresas estatais no investimento de longo prazo, infraestrutura, financiamento e prestação de serviços públicos',
    'Relações entre finalidade pública, concorrência, universalização, sustentabilidade fiscal e socioambiental; capacidades estatais, riscos de captura e efeitos distributivos',
    'Fundamentos constitucionais da atuação econômica do Estado e comparação de alternativas institucionais à luz de objetivos, evidências e resultados'
  ],
  'Sociedade Brasileira, Desigualdade, Diversidade e Desenvolvimento': [
    'Fundamentos sociológicos',
    'Instituições, socialização e ação coletiva; estratificação e mobilidade social; redes, poder, discriminação e reprodução das desigualdades',
    'Formação social e cidadania no Brasil',
    'Heranças da escravidão, hierarquias sociais e construção da cidadania; transformações nas relações entre Estado e sociedade; mecanismos de inclusão e exclusão institucional',
    'População, território e trabalho',
    'Transição demográfica, envelhecimento e cuidado; desigualdades regionais, urbanas e rurais; estrutura produtiva, informalidade e mudanças tecnológicas no trabalho',
    'Diversidade e acesso a direitos',
    'Relações étnico-raciais, gênero e sexualidade; pessoas com deficiência; idade; povos indígenas e comunidades tradicionais',
    'Interseccionalidade, acessibilidade e barreiras administrativas e digitais',
    'Desenvolvimento e realidade brasileira',
    'Pobreza, renda e proteção social; educação, saúde, saneamento e habitação como problemas públicos; sustentabilidade e vulnerabilidade climática; leitura contextual de indicadores e desigualdades'
  ],
  'Ética Pública e Responsabilidade Profissional': [
    'Fundamentos da ética pública',
    'Interesse público, dignidade, justiça e responsabilidade; relações entre deveres, consequências e virtudes profissionais; conflitos entre valores em decisões públicas',
    'Deveres profissionais',
    'Imparcialidade, probidade, diligência e respeito; autonomia técnica e responsabilidade; limites da obediência hierárquica; uso adequado de informação e recursos públicos',
    'Aplicação dos valores e deveres de conduta ética da CGU a situações de trabalho',
    'Conflitos de interesses e imparcialidade',
    'Identificação de interesses privados em conflito com a função pública e medidas de prevenção, consulta e encaminhamento, nos termos dos arts. 3º a 5º, 8º e 10 da Lei nº 12.813/2013',
    'Impedimento e suspeição no processo administrativo federal, nos termos dos arts. 18 a 21 da Lei nº 9.784/1999; comunicação e abstenção quando exigidas',
    'Relações de trabalho e atendimento',
    'Dignidade, diversidade e relações de poder; reconhecimento e prevenção de assédio e discriminação; respeito, escuta e não retaliação',
    'Distinção entre acolher uma pessoa, verificar fatos e atribuir responsabilidade',
    'Integridade como responsabilidade institucional',
    'Coerência entre regras e práticas; ambiente organizacional e incentivos; canais de orientação e relato; papel do exemplo, da confiança e da prestação de contas'
  ],
  'Administração Pública e Fundamentos de Políticas Públicas': [
    'Organização administrativa',
    'Administração direta e indireta; descentralização e desconcentração; agentes públicos',
    'Funções da administração pública: formulação, execução, regulação e controle de políticas e ações públicas; arranjos de cooperação com entes federativos e entidades não estatais',
    'Modelos de administração',
    'Burocracia e profissionalização; gestão orientada a resultados; participação e governança; limites e contribuições de diferentes modelos na realidade brasileira',
    'Políticas públicas',
    'Problema público, agenda e formulação; instrumentos de ação estatal; implementação, monitoramento e avaliação; intersetorialidade e atores governamentais e sociais',
    'Planejamento e recursos',
    'Funções do planejamento e do orçamento; relação entre PPA, LDO e LOA; receita e despesa em nível conceitual; restrições fiscais, escolhas alocativas e sustentabilidade das ações',
    'Serviços e transformação digital',
    'Orientação ao usuário; simplificação e acessibilidade; coordenação de serviços; oportunidades e riscos da automação e da inteligência artificial na administração'
  ],
  'Fundamentos de Governança, Riscos e Integridade Pública e Privada': [
    'Governança e responsabilidades',
    'Distinção entre direção, gestão, controle e prestação de contas; papéis, supervisão, transparência e responsabilização',
    'Relação entre decisões organizacionais, finalidade pública e direitos',
    'Riscos e controles essenciais',
    'Risco, causa, consequência e controle; prevenção e detecção; proporcionalidade dos controles, segregação de funções e risco residual',
    'Identificação de vulnerabilidades e de controles compatíveis com situações e usos, a partir dos dados fornecidos',
    'Integridade pública',
    'Finalidades dos programas e medidas de integridade; compromisso da liderança, orientação ética, identificação de riscos, canais de relato e acompanhamento de ações',
    'Prevenção de favorecimento, assédio e discriminação; ambiente seguro e não retaliatório',
    'Integridade privada',
    'Finalidades dos programas de integridade e sua relação com o poder público; compromisso da direção, registros confiáveis, controles, diligência proporcional sobre terceiros, canais de relato e remediação',
    'Diferença entre existência documental, implementação e efetividade dos mecanismos',
    'Prevenção e melhoria institucional',
    'Cultura, incentivos e confiança; diferenças de capacidade entre organizações; orientação e medidas proporcionais',
    'Denúncias e resultados de controle como insumos de melhoria',
    'Distinção entre baixa ocorrência e baixa detecção de problemas; leitura de evidências simples sobre funcionamento e resultados das medidas'
  ],
  'Fundamentos de Transparência, Ouvidoria e Participação Social': [
    'Acesso à informação',
    'Transparência ativa e passiva; finalidade de pedidos e recursos; publicidade como regra e motivação das restrições',
    'Distinção conceitual entre informação classificada, sigilos previstos em lei, informação pessoal e documento preparatório; acesso parcial e comunicação clara da decisão',
    'Transparência e proteção de dados',
    'Compatibilização entre acesso à informação e proteção de dados pessoais; finalidade, necessidade e salvaguardas',
    'Diferença entre dados pessoais e dados pessoais sensíveis; noções de tarjamento, anonimização e risco de reidentificação',
    'Ouvidoria e proteção das pessoas',
    'Finalidades das manifestações; acolhimento, encaminhamento e resposta ao usuário; acessibilidade e linguagem cidadã',
    'Proteção da identidade e prevenção de retaliação',
    'Distinção entre receber um relato, apurar fatos e decidir sobre responsabilidade',
    'Participação e melhoria de serviços',
    'Participação e controle social; conselhos, consultas e escuta de usuários; representatividade e barreiras à participação',
    'Recorrências em manifestações como sinais de problemas; subnotificação',
    'Transparência ativa, dados abertos e Portal da Transparência como meios de acesso e controle; qualidade, atualização, cobertura e limites da informação',
    'Papel da CGU na orientação e no monitoramento da transparência e do acesso à informação',
    'Integridade da informação e comunicação',
    'Confiabilidade e contexto das fontes; distinção entre fato, alegação e interpretação',
    'Desinformação e efeitos sobre políticas públicas; comunicação de incertezas e correção de erros',
    'Liberdade de expressão e pluralismo; distinção entre crítica legítima e desinformação'
  ],
  'Fundamentos de Direito Público Aplicado, Controle e Responsabilização': [
    'Decisão administrativa',
    'Competência, finalidade, motivação, proporcionalidade e segurança jurídica; consideração das consequências e das condições de atuação',
    'Dever de fundamentação e limites ao exercício do poder e à revisão de decisões',
    'Processo e garantias',
    'Devido processo, contraditório, defesa e imparcialidade; finalidade da instrução e da prova',
    'Distinção entre procedimento investigativo e processo sancionador; proteção de direitos e necessidade de fundamentar conclusões',
    'Funções de controle e melhoria da gestão',
    'Finalidades do controle interno, externo e social; inserção institucional da CGU no Poder Executivo federal',
    'Avaliação da ação governamental e apoio ao aprimoramento da gestão, governança, controles e resultados das políticas públicas; prevenção, detecção e correção de irregularidades',
    'Autonomia técnica e responsabilidades dos gestores; diferenças de competências e complementaridade com o controle externo exercido pelo Congresso Nacional com o auxílio do TCU',
    'Distinção entre avaliar a gestão, apurar fatos e aplicar sanções; cooperação e compartilhamento lícito de informações',
    'Responsabilização em nível introdutório',
    'Distinção entre indício, falha de gestão, irregularidade e responsabilidade',
    'Finalidades e diferenças entre responsabilização de agentes públicos e de pessoas jurídicas; noções de admissibilidade, processo disciplinar, processo administrativo de responsabilização e acordo de leniência',
    'Proteção e encaminhamento',
    'Distinção entre acolhimento, medidas de proteção, apuração de fatos e conclusão sancionadora, especialmente diante de assédio e discriminação; finalidades e garantias de cada atuação'
  ],
  'Fundamentos de Evidências, Dados e Inteligência Artificial': [
    'Perguntas e fontes',
    'Relação entre problema, pergunta e informação necessária; fontes documentais, administrativas, estatísticas e de participação social',
    'Distinção entre dado, evidência, interpretação e juízo de valor; verificação de origem e confronto de fontes',
    'Leitura de dados e indicadores',
    'Interpretação de tabelas, gráficos, proporções, taxas e medidas descritivas; denominadores, qualidade e comparabilidade',
    'Distinção entre indicadores de percepção, experiência, denúncias, detecção e sanções na análise da corrupção; subnotificação e limites de inferência sobre sua ocorrência',
    'Inferências e erros de raciocínio',
    'Associação e causalidade; seleção e representatividade; explicações alternativas e incerteza',
    'Generalizações indevidas, falácia ecológica e viés de confirmação; falsos positivos e falsos negativos',
    'Integridade da evidência e proteção',
    'Rastreabilidade e verificação de informações; comunicação proporcional dos resultados e limites',
    'Escuta sem indução, confidencialidade e risco de identificação indireta',
    'Distinção entre as condições e os regimes de proteção de entrevistados em auditoria, participantes de pesquisa e denunciantes',
    'Uso responsável de inteligência artificial',
    'Possibilidades de classificação, busca, síntese e apoio à análise; escolha entre IA, solução simples e revisão humana',
    'Erros, conteúdo não sustentado, vieses e efeitos sobre grupos; proteção de informações, supervisão, rastreabilidade e contestação',
    'Verificação de fontes e limites da automação de decisões que afetam direitos'
  ],
  'Fundamentos de Auditoria Governamental e Atuação Integrada da CGU': [
    'Propósito, serviços e papéis',
    'Contribuição da auditoria para a governança, os riscos, os controles e os resultados',
    'Avaliação e consultoria como serviços de auditoria interna governamental; apuração de atos e fatos com indícios de ilegalidade ou irregularidade na utilização de recursos públicos federais como competência do sistema de controle interno',
    'Finalidades e diferenças entre as três formas de atuação da SFC; relação com a gestão, correção e avaliação de políticas',
    'Independência, objetividade, diligência e ceticismo; papéis de gestão, supervisão e auditoria no modelo das três linhas',
    'Ciclo do trabalho',
    'Planejamento, execução, comunicação e monitoramento; finalidade de objetivos, escopo, critérios e perguntas',
    'Priorização por risco, materialidade e relevância social em nível conceitual; adequação do trabalho às finalidades de avaliação, consultoria ou apuração',
    'Apoio à melhoria da gestão com preservação da autonomia técnica e das responsabilidades de decisão e execução dos gestores',
    'Evidência e conclusão',
    'Suficiência, adequação e confiabilidade; noção de achado e de limitações',
    'Distinção entre sinal de risco, evidência e conclusão; necessidade de aprofundamento e proporcionalidade da afirmação',
    'Comunicação e acompanhamento',
    'Clareza, contexto e utilidade dos resultados; publicidade e proteção de pessoas e informações',
    'Recomendações relacionadas a causas e riscos; distinção entre plano de ação, implementação, resultado e benefício',
    'Integração entre funções da CGU',
    'Denúncias e informações de ouvidoria e transparência como insumos de risco; achados como subsídios para admissibilidade correcional e responsabilização de entes privados',
    'Resultados do controle como insumos de integridade e melhoria de serviços; compartilhamento lícito, devolutivas e proteção'
  ],
  'Auditoria Governamental: Avaliação, Consultoria e Apuração': [
    'Avaliação, consultoria e apuração',
    'Seleção da forma de atuação conforme o problema, objetivos e riscos',
    'Avaliação: critérios de desempenho e de conformidade, exame de evidências e conclusões independentes sobre governança, controles e resultados',
    'Consultoria: análise da demanda, pactuação de objetivos, escopo e produtos; assessoramento, aconselhamento e facilitação; salvaguardas de objetividade e limites à assunção de responsabilidades gerenciais',
    'Apuração: delimitação dos fatos e hipóteses, planejamento de diligências, reunião e preservação de elementos probatórios, análise de possíveis prejuízos e comunicação às instâncias competentes',
    'Distinção entre apuração no controle interno, investigação correcional e processo sancionador; acompanhamento de providências e aprendizado institucional',
    'Planejamento técnico do trabalho',
    'Universo, seleção e priorização; risco de auditoria; objetivos, escopo, critérios e questões; matriz de planejamento, programa de trabalho e desenho de evidências',
    'Relação entre perguntas de auditoria e de avaliação de políticas, respeitadas suas finalidades e seus desenhos',
    'Coordenação de equipes e mudanças de escopo sem comprometer a inferência conjunta; seleção aleatória e por risco e seus propósitos',
    'Testes e amostragem',
    'Testes de controles e substantivos; inspeção, confirmação, observação, procedimentos analíticos e recálculo',
    'Amostragem estatística e por julgamento; tamanho, seleção, limitações e desenho de procedimentos para riscos identificados',
    'Achados, documentação e revisão',
    'Critério, condição, causas e efeitos; suficiência e adequação da evidência; papéis de trabalho, trilha de revisão e supervisão',
    'Contradita técnica e exame de evidências divergentes; indícios de fraude e aprofundamento compatível com o mandato',
    'Auditoria de dados e IA',
    'Testes sobre qualidade de dados, controles e rastreabilidade; desenho de validações independentes; riscos de viés, erro e mudança de desempenho; supervisão e governança de sistemas automatizados; limites do uso de IA como evidência',
    'Comunicação, monitoramento e qualidade',
    'Construção de relatórios e recomendações sustentados por evidências; avaliação de soluções alternativas; testes de implementação e resultado; benefícios e monitoramento',
    'Asseguração e melhoria da qualidade dos trabalhos; avaliação de capacidade da atividade de auditoria a partir de evidências e planos de melhoria'
  ],
  'Finanças Públicas, Orçamento e Contabilidade Pública': [
    'Economia e finanças do setor público',
    'Funções alocativa, distributiva e estabilizadora; bens públicos, externalidades e monopólios naturais; financiamento de políticas e federalismo fiscal',
    'Progressividade, regressividade e neutralidade da tributação; resultados primário e nominal, déficit e necessidades de financiamento; restrições, riscos e sustentabilidade fiscal em análise aplicada',
    'Orçamento e planejamento',
    'PPA, LDO e LOA em aplicação; elaboração, emendas, discussão e aprovação do orçamento; classificações relevantes, créditos e alterações, vinculações e metas',
    'Programação orçamentária e financeira; limites de empenho e pagamento, contingenciamento e bloqueio no escopo do programa',
    'Execução e responsabilidade fiscal',
    'Etapas da receita e da despesa; empenho, liquidação e pagamento; restos a pagar; Conta Única do Tesouro Nacional e gestão de disponibilidades',
    'Limites, metas e transparência fiscal; dívida e riscos fiscais no escopo do programa',
    'Informação contábil aplicada ao controle',
    'Relações entre execução orçamentária, financeira e patrimônio; reconhecimento e mensuração de operações usuais com receitas, despesas, ativos e passivos',
    'Leitura dos balanços orçamentário, financeiro e patrimonial e da demonstração das variações patrimoniais, com notas explicativas pertinentes; conciliação e identificação de inconsistências relevantes para o controle',
    'Custos e análise da execução',
    'Comprovação da despesa e conexão físico-financeira; comparação entre recursos, custos e entregas',
    'Interpretação de informações de custos e indicadores de execução e eficiência, observadas comparabilidade, bases de cálculo e limitações',
    'MCASP 11ª edição e Manual de Informações do Sistema de Custos (MIC)',
    'Informação societária de empresas estatais',
    'Distinção entre informação societária e contabilidade aplicada ao setor público',
    'Leitura de balanço patrimonial, demonstração do resultado e notas explicativas; relações entre posição patrimonial, desempenho e caixa',
    'Reconhecimento de efeitos e incertezas de depreciação, redução ao valor recuperável, provisões, contingências e transações com partes relacionadas',
    'Governança e finalidade pública de empresas estatais',
    'Papéis e responsabilidades do Estado como proprietário das empresas estatais e gestor de seus administradores, dos conselhos de administração e fiscal e das instâncias de auditoria e fiscalização',
    'Finalidade pública, sustentabilidade econômico-financeira e prestação de contas; conflitos de interesses e controles',
    'Relação entre mandatos de política pública, estratégias empresariais, recursos empregados e resultados sociais e econômicos; custos, riscos e transparência dos compromissos assumidos',
    'Coerência entre objetivos, recursos e resultados divulgados; compromissos de políticas públicas e informações da carta anual'
  ],
  'Políticas Públicas e Métodos de Investigação e Avaliação': [
    'Problema, desenho e avaliabilidade',
    'Causas e manifestações do problema público; população elegível e público atendido; instrumentos, incentivos, teoria da mudança e modelo lógico',
    'Relação entre problema, pressupostos, hipóteses e evidências; explicações alternativas e efeitos não pretendidos',
    'Avaliabilidade e compatibilidade entre pergunta e informação disponível',
    'Implementação, gestão e coordenação',
    'Arranjos federativos e interorganizacionais; parcerias; capacidades, recursos e diferenças territoriais; discricionariedade na linha de frente e barreiras administrativas',
    'Processos e projetos como instrumentos de entrega; responsabilidades, riscos e marcos de execução',
    'Assessoramento, cooperação e adaptação de soluções com preservação de direitos e controles',
    'Monitoramento e desenhos de avaliação',
    'Insumos, atividades, produtos, resultados e impactos; eficiência, eficácia, efetividade e equidade',
    'Indicadores, fontes e periodicidade',
    'Avaliações ex ante e ex post, de desenho, implementação, resultados, impacto e eficiência',
    'Pré-teste e estudo-piloto; critérios de julgamento e seleção do desenho adequado à pergunta',
    'Estratégias qualitativas e mistas',
    'Estudos de caso, entrevistas, grupos focais e observação; seleção de casos e participantes, perguntas e controle de indução',
    'Análise de processos e hipóteses de mecanismo; triangulação e integração de evidências quantitativas e qualitativas; limites de generalização',
    'Identificação causal e análise econômica',
    'Contrafactual, seleção e confundimento; experimentos e quase experimentos; grupos de comparação e medidas anteriores à intervenção',
    'Diferenças em diferenças, regressão descontínua e pareamento em interpretação aplicada, com hipóteses e ameaças à validade',
    'Custo-efetividade e custo-benefício, custo de oportunidade e sensibilidade; heterogeneidade de efeitos, equidade e impactos territoriais',
    'Conclusões, recomendações e uso dos resultados',
    'Validade interna e externa, incerteza e resultados nulos; comparação de alternativas e recomendações proporcionais e exequíveis',
    'Priorização, escuta, adaptação e condições de implementação; acompanhamento de benefícios e efeitos distributivos',
    'Distinção entre plano, implementação e resultados, com evidências adequadas a cada etapa',
    'Ética da investigação',
    'Dignidade, privacidade e segurança das pessoas; riscos de coerção, exposição e reidentificação; informação e consentimento quando cabível',
    'Integridade dos registros, autoria e prevenção de plágio, fabricação ou seleção indevida de evidências',
    'Distinção entre auditoria e pesquisa científica envolvendo seres humanos; finalidades, proteção dos participantes e requisitos de apreciação ética'
  ],
  'Auditoria de Contratações, Transferências e Execução de Recursos': [
    'Planejamento e seleção',
    'Necessidade da contratação, estudos e especificações; pesquisa de preços; competição e critérios de seleção; riscos de direcionamento e de restrição indevida',
    'Execução contratual',
    'Medição, entrega e aceitação; fiscalização, pagamento, alterações e reequilíbrio; evidências sobre quantidade, qualidade e preço; continuidade de serviços e resposta a falhas',
    'Transferências e parcerias',
    'Objetivos, instrumentos, planos de trabalho e obrigações; seleção e execução; acompanhamento e prestação de contas; capacidades locais e responsabilidades dos participantes',
    'Testes e sinais de irregularidade',
    'Concentração e vínculos entre fornecedores; fracionamento e padrões atípicos; comprovação física e documental; cruzamentos de dados; limites de amostras dirigidas por risco',
    'Encaminhamentos e resultados',
    'Dano e critérios para sua demonstração; correção de processos, proteção de usuários e recuperação de recursos; interfaces com responsabilização e integridade; recomendações proporcionais'
  ],
  'Integridade, Transparência e Responsabilização Aplicadas ao Controle Público': [
    'Direito público aplicado às respostas de controle',
    'Análise de vulnerabilidades, incentivos, conflitos e capacidades institucionais; articulação entre governança, riscos e controles',
    'Integração de manifestações de ouvidoria, dados de transparência, achados de auditoria e informações correcionais',
    'Definição de prioridades e combinação de respostas preventivas, corretivas e de responsabilização; competências, motivação, proporcionalidade, consequências práticas e condições de atuação',
    'Informação, participação e qualidade dos serviços',
    'Análise de pedidos e recursos de acesso à informação; aplicação articulada da LAI e da LGPD',
    'Informação classificada, sigilos legais, informação pessoal e documentos preparatórios; acesso parcial, motivação e revisão de restrições',
    'Transparência ativa e dados abertos; qualidade, cobertura, atualização e risco de reidentificação',
    'Análise de reclamações, solicitações, sugestões e outras manifestações; escuta de usuários e não usuários, participação, representatividade, barreiras de acesso e subnotificação',
    'Utilização dos resultados para aperfeiçoar serviços e orientar o controle',
    'Proteção do denunciante e tratamento seguro dos relatos',
    'Salvaguardas da identidade do denunciante desde o recebimento do relato; pseudonimização, acesso por necessidade de conhecer, rastreabilidade e condições legais de compartilhamento ou revelação',
    'Identificação de riscos e práticas de retaliação; medidas preventivas, protetivas e reparadoras e competências para sua adoção',
    'Acolhimento e prevenção de revitimização em situações de assédio e discriminação',
    'Articulação entre proteção, preservação de evidências, apuração e direitos de defesa',
    'Avaliação e aperfeiçoamento da integridade pública e privada',
    'Diagnóstico de riscos e avaliação da existência, implementação e efetividade de programas de integridade',
    'Compromisso da liderança, cultura, incentivos, registros, controles, diligência sobre terceiros, canais de relato e remediação',
    'Avaliação de maturidade e planos de melhoria proporcionais ao contexto e à capacidade institucional',
    'Análise de conflitos de interesses, impedimentos, favorecimento e exercício de atividade privada; medidas de prevenção, orientação e tratamento',
    'Prevenção de assédio e discriminação como dimensão da integridade organizacional',
    'Admissibilidade, prova e requisitos da responsabilização',
    'Qualificação de notícias de irregularidade e juízo de admissibilidade; arquivamento fundamentado, investigação e instauração de processo',
    'Regimes de agentes públicos e de pessoas jurídicas; materialidade, autoria quando exigível, nexo, enquadramento e elemento subjetivo conforme o regime aplicável',
    'Responsabilidade objetiva da pessoa jurídica e requisitos de ato lesivo e interesse ou benefício',
    'Licitude, suficiência e valoração da prova; compartilhamento entre instâncias, contraditório, defesa e motivação',
    'Distinção entre achado de controle e imputação de responsabilidade',
    'Instrumentos de responsabilização e soluções consensuais',
    'Processo administrativo disciplinar e processo administrativo de responsabilização de pessoas jurídicas: cabimento, instrução, garantias e decisão',
    'Aplicação dos marcos prescricionais e dos critérios de dosimetria; fundamentação da sanção e da reparação do dano em casos concretos',
    'Acordo de leniência: requisitos, colaboração, efeitos, obrigações de integridade e limites',
    'Termo de ajustamento de conduta: requisitos, proporcionalidade e acompanhamento',
    'Coordenação entre instâncias, distinção entre sanção e reparação e consideração das sanções relativas ao mesmo fato nos termos legais',
    'Resultados, comunicação e aprendizagem institucional',
    'Conversão de manifestações, avaliações e apurações em medidas de melhoria da gestão, da integridade e dos serviços',
    'Planos de ação, responsabilidades, indicadores e acompanhamento de compromissos',
    'Avaliação da implementação e dos efeitos das medidas sobre recorrência, acesso a direitos e confiança',
    'Distinção entre redução de ocorrências e redução da detecção',
    'Comunicação pública de resultados, contextualização de informações, proteção de pessoas e prestação de contas'
  ]
};

const SIMULADOS = new Set([
  '2026-10-30','2026-11-13','2026-11-27','2026-12-11','2026-12-23',
  '2027-01-08','2027-01-22','2027-02-05','2027-02-19','2027-03-05',
  '2027-03-19','2027-04-02','2027-04-16'
]);

const PADRAO = {
  1: ['Auditoria Governamental: Avaliação, Consultoria e Apuração','Finanças Públicas, Orçamento e Contabilidade Pública','Fundamentos de Governança, Riscos e Integridade Pública e Privada','Estado, Democracia, Direitos e Ciência Política'],
  2: ['Integridade, Transparência e Responsabilização Aplicadas ao Controle Público','Fundamentos de Direito Público Aplicado, Controle e Responsabilização','Administração Pública e Fundamentos de Políticas Públicas','Fundamentos de Transparência, Ouvidoria e Participação Social'],
  3: ['Políticas Públicas e Métodos de Investigação e Avaliação','Auditoria de Contratações, Transferências e Execução de Recursos','Fundamentos de Evidências, Dados e Inteligência Artificial','Sociedade Brasileira, Desigualdade, Diversidade e Desenvolvimento'],
  4: ['Auditoria Governamental: Avaliação, Consultoria e Apuração','Finanças Públicas, Orçamento e Contabilidade Pública','Fundamentos de Auditoria Governamental e Atuação Integrada da CGU','Ética Pública e Responsabilidade Profissional'],
  5: ['Integridade, Transparência e Responsabilização Aplicadas ao Controle Público','Políticas Públicas e Métodos de Investigação e Avaliação','Auditoria de Contratações, Transferências e Execução de Recursos','Fundamentos de Governança, Riscos e Integridade Pública e Privada']
};

const iso = d => d.toISOString().slice(0,10);
const addDays = (date,amount) => { const d=new Date(date.getTime()); d.setUTCDate(d.getUTCDate()+amount); return d; };

function buildJorgePlan(){
  const state=Object.fromEntries(Object.keys(TOPICS).map(name=>[name,{index:0,count:0,studied:[]}]));
  const tasks=[];
  const corrections=new Set();
  for(const sim of SIMULADOS){
    let d=addDays(new Date(sim+'T12:00:00Z'),1);
    while(d.getUTCDay()===0||d.getUTCDay()===6)d=addDays(d,1);
    corrections.add(iso(d));
  }

  const nextTask=subject=>{
    const st=state[subject];
    st.count+=1;
    if(st.studied.length&&st.count%5===0){
      const recent=st.studied.slice(-4);
      const exercises=Math.floor(st.count/5)%2===1;
      return {
        type:exercises?'Exercícios':'Revisão',
        subject,
        activity:(exercises?'Questões — ':'Revisão — ')+recent.join(' + '),
        notes:exercises?'Resolva questões compatíveis com o conteúdo estudado e registre os erros.':'Retome conceitos, relações entre institutos e pontos registrados no caderno de erros.'
      };
    }
    if(st.index<TOPICS[subject].length){
      const topic=TOPICS[subject][st.index++];
      st.studied.push(topic);
      return {
        type:'Teoria',
        subject,
        activity:topic,
        notes:'Estude o objeto de avaliação conforme a terminologia do edital e marque como concluído após compreender os pontos centrais.'
      };
    }
    const recent=st.studied.slice(-6);
    const review=st.count%2===1;
    return {
      type:review?'Revisão':'Exercícios',
      subject,
      activity:(review?'Revisão cumulativa — ':'Questões mistas — ')+recent.join(' + '),
      notes:'Priorize lacunas identificadas nos simulados e no caderno de erros.'
    };
  };

  let simNumber=0;
  const start=new Date('2026-10-19T12:00:00Z');
  const lastStudyDay=new Date('2027-04-16T12:00:00Z');
  for(let d=new Date(start);d<=lastStudyDay;d=addDays(d,1)){
    const day=d.getUTCDay(),date=iso(d);
    if(day===0||day===6)continue;
    if(SIMULADOS.has(date)){
      simNumber+=1;
      tasks.push({
        id:'jorge-sim-'+simNumber,date,day,start:'',end:'',
        subject:'Simulado completo',
        activity:'Simulado quinzenal '+simNumber+' — Cargo 1 · Auditoria',
        type:'Simulado',
        notes:'Faça um simulado integrado abrangendo os blocos básicos, complementares e específicos. O recorte fornecido não informa quantidade de questões ou pesos por disciplina; não use distribuição inventada.'
      });
      continue;
    }
    if(corrections.has(date)){
      tasks.push({
        id:'jorge-correcao-'+date,date,day,start:'',end:'',
        subject:'Correção do simulado',
        activity:'Correção completa + caderno de erros + revisão direcionada',
        type:'Revisão',
        notes:'Classifique os erros por matéria e causa: conteúdo, interpretação, distração ou aplicação. Reforce os temas com maior recorrência.'
      });
    }
    for(const subject of PADRAO[day]||[]){
      const task=nextTask(subject);
      tasks.push({id:'jorge-'+date+'-'+tasks.length,date,day,start:'',end:'',...task,done:false});
    }
  }

  const priorities={
    'Auditoria Governamental: Avaliação, Consultoria e Apuração':5,
    'Finanças Públicas, Orçamento e Contabilidade Pública':5,
    'Políticas Públicas e Métodos de Investigação e Avaliação':5,
    'Auditoria de Contratações, Transferências e Execução de Recursos':5,
    'Integridade, Transparência e Responsabilização Aplicadas ao Controle Público':5,
    'Fundamentos de Governança, Riscos e Integridade Pública e Privada':4,
    'Fundamentos de Direito Público Aplicado, Controle e Responsabilização':4,
    'Fundamentos de Evidências, Dados e Inteligência Artificial':4,
    'Fundamentos de Auditoria Governamental e Atuação Integrada da CGU':4,
    'Fundamentos de Transparência, Ouvidoria e Participação Social':3,
    'Administração Pública e Fundamentos de Políticas Públicas':3,
    'Estado, Democracia, Direitos e Ciência Política':3,
    'Ética Pública e Responsabilidade Profissional':3,
    'Sociedade Brasileira, Desigualdade, Diversidade e Desenvolvimento':3
  };

  return {
    version:8,
    studentName:'Jorge',
    createdByUser:false,
    creatorName:'Professor Lucas MPC',
    goal:'Auditor Federal de Finanças e Controle (AFFC) — Especialidade: Auditoria',
    examDate:'',
    examDateUnknown:true,
    contestStage:'publicacao_edital',
    startDate:'2026-10-19',
    endDate:'2027-04-18',
    hoursPerDay:0,
    scheduleStyle:'checklist',
    publicTheme:'masculino',
    generalGuidance:`COMO UTILIZAR ESTE CRONOGRAMA

Jorge, este plano foi estruturado em formato de checklist. Não há horário fixo por dia: abra o cronograma em cada dia útil, cumpra as metas indicadas e marque cada atividade concluída.

ROTINA
O ciclo funciona de segunda a sexta-feira, durante seis meses. Sábados e domingos ficam livres. As metas diárias foram organizadas para alternar os conhecimentos básicos, complementares e específicos do Cargo 1 — Auditoria.

DISTRIBUIÇÃO DAS MATÉRIAS
O recorte do edital fornecido apresenta os objetos de avaliação, mas não informa quantidade de questões nem pesos por disciplina. Por isso, este cronograma não atribui pesos oficiais inexistentes. A maior frequência foi dada aos blocos específicos de Auditoria e aos conteúdos complementares diretamente ligados a governança, controle, riscos, responsabilização, evidências e atuação da CGU, considerando a extensão e a centralidade desses conteúdos no programa.

TEORIA, QUESTÕES E REVISÕES
Os objetos de avaliação são estudados progressivamente e intercalados com questões e revisões. O edital informa que os itens podem avaliar compreensão, aplicação, análise, síntese e avaliação, e que um item pode contemplar mais de um objeto de avaliação. Por isso, nas revisões, procure relacionar os temas em vez de apenas memorizar definições isoladas.

SIMULADOS
A cada quinze dias há um simulado completo integrado do Cargo 1 — Auditoria. Como o recorte fornecido não informa distribuição de questões ou pesos, os simulados devem abranger os conhecimentos básicos, complementares e específicos sem fingir uma proporção oficial. No primeiro dia útil após cada simulado, faça a correção completa, atualize o caderno de erros e identifique os temas que precisam voltar ao ciclo.

LEGISLAÇÃO E JURISPRUDÊNCIA
O edital informa que alterações legislativas com entrada em vigor até a data de publicação do edital podem ser objeto de avaliação, e que jurisprudência dos tribunais superiores publicada até 30 dias antes da data das provas pode ser considerada. Reserve atenção especial à atualização desses pontos na reta final.

IMPORTANTE
Este cronograma foi construído exclusivamente a partir do recorte do edital enviado, correspondente ao Cargo 1 — Auditor Federal de Finanças e Controle, Especialidade Auditoria. O arquivo não traz, neste recorte, a estrutura quantitativa das provas nem a data da prova. Por isso, 18/04/2027 representa apenas o fim deste ciclo de seis meses, não uma data oficial de prova.`,
    studyRoutine:null,
    subjects:Object.keys(TOPICS).map(name=>({name,priority:priorities[name]||3,level:'intermediario'})),
    syllabus:Object.entries(TOPICS).map(([name,topics])=>({
      name,countInMetrics:true,topics:topics.map(title=>({title,subtopics:[]}))
    })),
    tasks,
    createdAt:'2026-10-15T21:30:00.000Z',
    brand:'Professor Lucas MPC'
  };
}

export const JORGE_PLAN_ID=PLAN_ID;
export function getJorgePlan(){ return buildJorgePlan(); }
