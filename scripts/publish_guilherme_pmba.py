import json, urllib.request
from datetime import date, timedelta

START=date(2026,10,10)
END=date(2027,2,14)
BT=[("16:00","16:55"),("17:00","17:55"),("18:00","18:55"),("19:00","19:55")]

U={
"Língua Portuguesa":"Compreensão e interpretação de textos|Tipologia textual|Gêneros textuais|Ortografia oficial|Acentuação gráfica|Classes de palavras|Uso do sinal indicativo de crase|Sintaxe da oração|Sintaxe do período|Pontuação|Concordância nominal|Concordância verbal|Regência nominal|Regência verbal|Significação das palavras".split("|"),
"História do Brasil":"Descobrimento do Brasil (1500)|Brasil Colônia — Capitanias Hereditárias|Brasil Colônia — Economia|Brasil Colônia — Extrativismo Vegetal e Mineral|Brasil Colônia — Pecuária e Escravidão|Brasil Colônia — Organização Político-Administrativa e Expansão Territorial|Independência do Brasil — Nomeação de D. Pedro I e Dia do Fico|Independência do Brasil — Reconhecimento da Independência|Primeiro Reinado (1822-1831)|Segundo Reinado (1831-1840)|Primeira República — Primeiro Governo Provisório e Assembleia Constituinte|Primeira República — Presidência de Deodoro da Fonseca|Primeira República — Política dos Governadores e Coronelismo|Primeira República — Movimentos Tenentistas, Coluna Prestes e Revolta da Armada|Revolução de 1930|Era Vargas (1930-1945)|Presidentes do Brasil de 1964 à atualidade|História da Bahia|Independência da Bahia|Revolta de Canudos|Revolta dos Malês e Conjuração Baiana|Sabinada".split("|"),
"Geografia do Brasil":"Relevo brasileiro|Urbanização — crescimento urbano|Urbanização — problemas estruturais e contingente populacional|Matriz energética — eólica e hidráulica|Matriz energética — biomassa, solar e marés|Problemas Ambientais|Clima — pressão atmosférica, umidade e temperatura|Clima — fatores que determinam o clima|Mudanças climáticas e suas consequências|Geografia da Bahia — aspectos políticos e físicos|Geografia da Bahia — aspectos econômicos e sociais|Geografia da Bahia — aspectos culturais".split("|"),
"Matemática":"Conjuntos numéricos — Naturais e Inteiros|Conjuntos numéricos — Racionais e Reais|Números Complexos — forma algébrica e trigonométrica|Conjuntos numéricos — operações, propriedades e aplicações|Sequências numéricas|Progressão aritmética|Progressão geométrica|Expressões algébricas|Polinômios — operações e propriedades|Equações polinomiais|Inequações relacionadas|Funções — generalidades e função do 1º grau|Função do 2º grau|Função modular|Funções exponencial e logarítmica|Gráficos e propriedades das funções|Sistemas lineares|Matrizes e Determinantes — propriedades e aplicações|Análise Combinatória — arranjos, permutações e combinações simples|Binômio de Newton e Probabilidade|Geometria plana — figuras, congruência, semelhança, perímetro e área|Geometria espacial e analítica — sólidos, retas, circunferência e distâncias|Trigonometria — razões, funções, transformações, equações e triângulos".split("|"),
"Atualidades":"Globalização — conceitos|Globalização — efeitos e implicações sociais e econômicas|Globalização — efeitos e implicações políticas e culturais|Multiculturalidade, Pluralidade e Diversidade Cultural|Tecnologias de Informação e Comunicação — conceitos|Tecnologias de Informação e Comunicação — efeitos e implicações sociais, econômicas, políticas e culturais".split("|"),
"Informática":"Word e Writer — edição de textos|Excel e Calc — planilhas|PowerPoint e Impress — apresentações|Microsoft Office 2007 e superiores|LibreOffice 5.0 e superiores|Windows 7, Windows 10 e Linux|Organização e gerenciamento de informações, arquivos, pastas e programas|Atalhos de teclado, ícones, área de trabalho e lixeira|Internet e intranet — conceitos, ferramentas, aplicativos e procedimentos|Correio eletrônico|Computação em nuvem".split("|"),
"Direito Constitucional":"Constituição Federal — princípios fundamentais|Constituição Federal — direitos e garantias fundamentais|Constituição Federal — organização do Estado|Constituição Federal — Administração Pública|Constituição Federal — militares dos Estados, do Distrito Federal e dos Territórios|Constituição Federal — Segurança Pública|Constituição do Estado da Bahia — princípios fundamentais|Constituição do Estado da Bahia — direitos e garantias fundamentais|Constituição do Estado da Bahia — Servidores Públicos Militares|Constituição do Estado da Bahia — Segurança Pública".split("|"),
"Direitos Humanos":"Declaração Universal dos Direitos Humanos/1948|Convenção Americana sobre Direitos Humanos/1969 — artigos 1º ao 32|Pacto Internacional dos Direitos Econômicos, Sociais e Culturais — artigos 1º ao 15|Declaração de Pequim — Ação para Igualdade, Desenvolvimento e Paz".split("|"),
"Direito Administrativo":"Administração Pública|Princípios fundamentais da administração pública|Poderes e deveres — uso e abuso do poder|Poder vinculado e discricionário|Poder hierárquico e disciplinar|Poder regulamentar e poder de polícia|Deveres dos administradores públicos|Servidores públicos — cargo, emprego e função públicos|Estatuto dos Policiais Militares da Bahia — Lei nº 7.990/2001 — artigos 1º ao 30|Estatuto dos Policiais Militares da Bahia — Lei nº 7.990/2001 — artigos 31 ao 59".split("|"),
"Direito Penal":"Do crime — elementos|Consumação e tentativa|Desistência voluntária e arrependimento eficaz|Arrependimento posterior e crime impossível|Causas de exclusão de ilicitude e culpabilidade|Contravenção|Crimes contra a vida — homicídio, lesão corporal e rixa|Crimes contra a liberdade pessoal — constrangimento ilegal e ameaça|Crimes contra a liberdade pessoal — perseguição, sequestro e cárcere privado|Crimes contra o patrimônio — furto e roubo|Crimes contra o patrimônio — extorsão, apropriação indébita e receptação|Crimes contra a dignidade sexual — estupro, importunação sexual e assédio sexual|Corrupção ativa|Corrupção passiva|Lei nº 9.455/1997 — Crimes de tortura".split("|"),
"Igualdade Racial e de Gênero":"Constituição Federal — artigos 1º, 3º, 4º e 5º|Constituição do Estado da Bahia — Capítulo XXIII — Do Negro|Lei nº 12.288/2010 — Estatuto da Igualdade Racial|Lei nº 7.716/1989 e Lei nº 9.459/1997 — crimes resultantes de preconceito de raça ou de cor|Decreto nº 65.810/1969 — eliminação de todas as formas de discriminação racial|Decreto nº 4.377/2002 — eliminação de todas as formas de discriminação contra a mulher|Lei nº 11.340/2006 — Lei Maria da Penha|Código Penal — artigo 140|Lei nº 9.455/1997 — Crime de Tortura|Lei nº 7.437/1985 — Lei Caó|Lei Estadual nº 10.549/2006 — Secretaria de Promoção da Igualdade Racial|Lei nº 10.678/2003 — Secretaria de Políticas de Promoção da Igualdade Racial da Presidência da República".split("|"),
"Direito Penal Militar":"Crimes contra a autoridade ou disciplina militar — motim, revolta, conspiração e aliciação|Violência contra superior ou militar de serviço|Desrespeito a superior|Recusa de obediência|Reunião ilícita|Publicação ou crítica indevida|Resistência mediante ameaça ou violência|Crimes contra o serviço militar e o dever militar — deserção e abandono de posto|Crimes contra o serviço militar e o dever militar — descumprimento de missão, embriaguez e dormir em serviço|Crimes contra a Administração Militar — desacato, desobediência, peculato, peculato-furto e concussão|Crimes contra o dever funcional — prevaricação".split("|")
}

P={k:(2,4) for k in U}
P["Igualdade Racial e de Gênero"]=(4,8)
P["Direito Penal Militar"]=(3,6)

class S:
    def __init__(self,n):
        self.n=n; self.u=U[n]; self.g,self.r=P[n]; self.i=0; self.pending=[]; self.studied=[]; self.since=0; self.rd=False; self.alt=0
    def next(self):
        if self.rd and self.studied:
            x=self.studied[-self.r:]; self.rd=False; self.since=0
            return "Revisão","Revisão — "+" + ".join(x),"Revisão ativa: recorde antes de consultar, depois feche pelos erros e pontos esquecidos."
        if len(self.pending)>=self.g:
            x=self.pending[:self.g]; self.pending=self.pending[self.g:]
            return "Exercícios","Exercícios — "+" + ".join(x),"Resolva questões no estilo FCC, corrija todas as alternativas e registre os erros."
        if self.i<len(self.u):
            x=self.u[self.i]; self.i+=1; self.studied.append(x); self.pending.append(x); self.since+=1
            if self.since>=self.r: self.rd=True
            note="Estude a teoria com foco no edital e faça anotações curtas."
            if self.n.startswith("Direito") or self.n in ("Direitos Humanos","Igualdade Racial e de Gênero"):
                note="Estude a teoria e a literalidade indicada no edital. Destaque conceitos, requisitos, exceções e termos cobrados pela FCC."
            return "Teoria","Teoria — "+x,note
        if self.pending:
            x=self.pending[:self.g]; self.pending=self.pending[self.g:]
            return "Exercícios","Exercícios — "+" + ".join(x),"Resolva questões e transforme cada erro em ponto de revisão."
        self.alt+=1
        x=self.studied[-(6 if self.alt%2 else 8):]
        if self.alt%2:
            return "Exercícios","Questões mistas — "+" + ".join(x),"Faça bateria mista, controle o tempo e atualize o caderno de erros."
        return "Revisão","Revisão cumulativa — "+" + ".join(x),"Revisão ativa, com prioridade para os erros recorrentes."

SC={k:S(k) for k in U}
T={
0:["Correção do Simulado","Matemática","História do Brasil","Direito Constitucional"],
1:["Língua Portuguesa","Geografia do Brasil","Matemática","Direito Penal"],
2:["História do Brasil","Informática","Geografia do Brasil","Direito Administrativo"],
3:["Língua Portuguesa","Matemática","Atualidades","Direito Penal Militar"],
4:["História do Brasil","Informática","Direito Constitucional","Direitos Humanos"],
5:["Língua Portuguesa","Direito Administrativo","Direito Penal","Igualdade Racial e de Gênero"],
}

tasks=[]; N=1
def add(d,a,b,s,act,typ,note=""):
    global N
    tasks.append({"id":f"guilherme-pmba-{N:04d}","date":d.isoformat(),"day":(d.weekday()+1)%7,"start":a,"end":b,"subject":s,"activity":act,"type":typ,"notes":note,"done":False})
    N+=1

d=START
D=[
("Língua Portuguesa","Diagnóstico — interpretação, gramática e linguagem"),
("Matemática","Diagnóstico — fundamentos, álgebra, funções e geometria"),
("Conhecimentos Gerais","Diagnóstico — História, Geografia, Atualidades e Informática"),
("Conhecimentos Específicos","Diagnóstico — Constitucional, Direitos Humanos, Administrativo, Penal, Igualdade Racial e Penal Militar")]
for (a,b),(s,x) in zip(BT,D):
    add(d,a,b,s,x,"Exercícios","Faça um bloco diagnóstico sem consulta. Registre erros e assuntos frágeis.")
add(date(2026,10,11),"16:00","20:00","Simulado PMBA","Simulado diagnóstico — 80 questões objetivas do modelo PMBA + produção de uma redação","Simulado","Use o resultado como linha de base. O edital-base prevê 50 questões de Conhecimentos Gerais, 30 de Conhecimentos Específicos e redação.")

m=date(2026,10,12)
for w in range(18):
    for wd in range(6):
        d=m+timedelta(days=w*7+wd)
        for (a,b),s in zip(BT,T[wd]):
            if s=="Correção do Simulado":
                add(d,a,b,"Simulado PMBA","Correção do simulado de domingo — classificação dos erros e definição dos pontos fracos","Revisão","Corrija todas as questões e classifique cada erro em conteúdo, interpretação, distração ou gestão do tempo.")
            else:
                typ,act,note=SC[s].next(); add(d,a,b,s,act,typ,note)
    d=m+timedelta(days=w*7+6); k=w+1
    if k==1:
        act="Simulado progressivo — 50 questões de Conhecimentos Gerais em ritmo de prova"; note="Priorize Português, Matemática, História, Geografia, Atualidades e Informática."
    elif k==2:
        act="Simulado progressivo — 30 questões de Conhecimentos Específicos + 1 redação"; note="Treine os conhecimentos específicos e produza uma redação dissertativo-argumentativa."
    elif k<=8:
        act="Simulado completo — 80 questões objetivas"+(" + 1 redação" if k%2==0 else ""); note="Reproduza o modelo do edital-base e deixe a correção detalhada para segunda-feira."
    else:
        act="Simulado completo — 80 questões objetivas + 1 redação"; note="Faça a prova completa dentro das 4h disponíveis. O edital-base previa 4h30, criando margem de segurança."
    add(d,"16:00","20:00","Simulado PMBA",act,"Simulado",note)

priority={"Língua Portuguesa":3,"História do Brasil":3,"Geografia do Brasil":2,"Matemática":3,"Atualidades":1,"Informática":2,"Direito Constitucional":2,"Direitos Humanos":1,"Direito Administrativo":2,"Direito Penal":2,"Igualdade Racial e de Gênero":1,"Direito Penal Militar":1}
subjects=[{"name":x,"priority":priority[x],"level":"intermediario"} for x in U]

guidance="""COMO UTILIZAR ESTE CRONOGRAMA

Guilherme, este plano foi criado com base no Edital SAEB/05/2022 da Polícia Militar da Bahia e na sua disponibilidade de 4 horas por dia, começando às 16h. Como o edital fornecido é de 2022 e não traz uma nova data futura de prova, este planejamento funciona como um ciclo completo de preparação.

ROTINA
De segunda a sábado, use a janela das 16h às 20h. O plano trabalha com quatro blocos principais, com pequenas pausas entre eles. As 4 horas são um teto: priorize qualidade e constância.

TEORIA, QUESTÕES E REVISÕES
A teoria aparece antes da prática correspondente. Nos exercícios, resolva antes de consultar a resposta e corrija todas as alternativas. As revisões são distribuídas ao longo do ciclo e devem priorizar erros, conceitos esquecidos e pontos de maior dificuldade.

SIMULADOS
Domingo é dia de simulado às 16h. As primeiras semanas usam simulados progressivos e depois o treino passa ao modelo completo. A segunda-feira começa pela correção e atualização do caderno de erros. A redação entra nos simulados e não ocupa uma matéria separada durante a semana.

MENSAGEM FINAL
O Gerador de Cronogramas transforma um edital grande em uma sequência executável. Seu trabalho é abrir o plano, cumprir o próximo bloco e avançar. Constância, correção dos erros e repetição inteligente valem mais do que tentar estudar tudo de uma vez."""

plan={
"studentName":"Guilherme","createdByUser":False,"creatorName":"Professor Lucas MPC",
"goal":"Soldado da Polícia Militar da Bahia (PMBA) — preparação com base no Edital SAEB/05/2022",
"examDate":"","examDateUnknown":True,"contestStage":"estudo_vagas","startDate":START.isoformat(),"endDate":END.isoformat(),
"hoursPerDay":4,"scheduleStyle":"weekly","publicTheme":"masculino","generalGuidance":guidance,
"studyRoutine":{"mode":"continuous","referenceDate":START.isoformat(),"referenceStatus":"off","windows":[{"moment":"Tarde/noite","time":"16:00","duration":240,"environment":"Casa","types":["Teoria","Exercícios","Revisão","Resumo","Lei seca","Simulado parcial"],"videoOnly":False}],"workWindows":[],"offWindows":[],"blackoutRanges":[]},
"subjects":subjects,"tasks":tasks
}
req=urllib.request.Request("https://gerador-de-cronograma-mpc.netlify.app/api/plans",data=json.dumps(plan,ensure_ascii=False).encode(),headers={"Content-Type":"application/json","User-Agent":"github-actions"},method="POST")
with urllib.request.urlopen(req,timeout=60) as r:
    print(r.read().decode())
