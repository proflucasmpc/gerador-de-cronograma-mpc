#!/usr/bin/env python3
"""Generate static, crawlable product pages for lucasmpc.com.br."""

from html import escape
from pathlib import Path
import json
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
WHATSAPP = "https://wa.me/5511960189699?text="

PRODUCTS = {
    "80-simulados": {
        "title": "80 Simulados de Matemática para Concursos",
        "category": "Simulados",
        "cover": "/assets/club/80-simulados.webp",
        "description": "Treine Matemática para concursos com 80 simulados, aumente seu ritmo de resolução e identifique os assuntos que precisam de mais atenção.",
        "benefits": ["Simulados para prática recorrente", "Contato com diferentes assuntos", "Treino de tempo e estratégia", "Acompanhamento da evolução"],
        "audience": "Para candidatos que já estudam Matemática e precisam transformar teoria em prática constante por meio de simulados.",
        "official": "https://80-simulados-matematica.netlify.app/",
    },
    "metodo-ia": {
        "title": "Método IA para Concursos",
        "category": "Tecnologia e estratégia",
        "cover": "/assets/club/metodo-ia.webp",
        "description": "Aprenda a usar inteligência artificial para estudar, revisar, criar questões e organizar sua preparação para concursos com objetivos claros.",
        "benefits": ["Resumos mais direcionados", "Questões para praticar", "Planejamento com IA", "Revisão e análise de desempenho"],
        "audience": "Para candidatos que desejam utilizar inteligência artificial com método, objetivos claros e responsabilidade.",
        "official": "https://metodo-ia-para-concursos.netlify.app/",
    },
    "como-passar-em-concursos": {
        "title": "Como Passar em Concursos Públicos",
        "category": "Estratégia",
        "cover": "/assets/club/como-passar.webp",
        "description": "Organize sua preparação para concursos com orientações sobre planejamento, prioridades, revisão, execução e decisões ao longo dos estudos.",
        "benefits": ["Organização da jornada", "Definição de prioridades", "Estratégia de estudo", "Foco na execução"],
        "audience": "Para quem está começando ou precisa reorganizar a preparação com um caminho mais claro.",
        "official": "https://como-passar-em-concursos-publicos.netlify.app/",
    },
    "interpretacao-matematica": {
        "title": "O Segredo da Interpretação de Questões de Matemática",
        "category": "Matemática",
        "cover": "/assets/club/interpretacao.webp",
        "description": "Aprenda a interpretar questões de Matemática, extrair as informações do enunciado e construir um caminho objetivo para a resolução.",
        "benefits": ["Leitura estratégica", "Tradução do enunciado", "Modelagem do problema", "Resolução passo a passo"],
        "audience": "Para quem conhece fórmulas, mas encontra dificuldade para entender o que a questão está pedindo.",
        "official": "https://segredo-da-interpretacao-matematica.netlify.app/",
    },
    "manual-do-chute": {
        "title": "Manual do Chute Certo para Concursos",
        "category": "Técnica de prova",
        "cover": "/assets/club/manual-chute.webp",
        "description": "Conheça técnicas de eliminação, comparação e decisão para lidar melhor com questões difíceis em provas de concursos.",
        "benefits": ["Eliminação de alternativas", "Análise de padrões", "Decisão com estratégia", "Uso responsável na prova"],
        "audience": "Para candidatos que desejam melhorar decisões em questões difíceis sem depender de escolhas aleatórias.",
        "official": "https://manual-do-chute-certo.netlify.app/",
    },
    "portugues-para-concursos": {
        "title": "Português Completo para Concursos e Vestibulares",
        "category": "Língua Portuguesa",
        "cover": "/assets/club/portugues.webp",
        "description": "Estude Português para concursos e vestibulares com gramática, interpretação de textos, sintaxe, ortografia e resolução de questões.",
        "benefits": ["Gramática aplicada", "Interpretação de textos", "Sintaxe e ortografia", "Questões comentadas"],
        "audience": "Para estudantes e candidatos que precisam fortalecer Língua Portuguesa para provas.",
        "official": "https://portugues-completo-mazziotti.netlify.app/",
    },
    "combo-matematica": {
        "title": "Combo Matemática — Treine Até Passar",
        "category": "Combo 3 em 1",
        "cover": "/assets/club/combo-matematica.webp",
        "description": "Reúna simulados, questões por assunto e interpretação matemática em uma preparação prática para concursos.",
        "benefits": ["Treinamento integrado", "Simulados e questões", "Interpretação matemática", "Preparação prática"],
        "audience": "Para candidatos que querem reunir diferentes formas de treino em uma única jornada.",
        "official": "https://combo-matematica-treine-ate-passar.netlify.app/",
    },
    "combo-estrategia": {
        "title": "Combo Estratégia da Aprovação",
        "category": "Combo estratégico",
        "cover": "/assets/club/combo-estrategia.webp",
        "description": "Fortaleça sua preparação com métodos de estudo, inteligência artificial aplicada e técnicas para tomar melhores decisões em provas.",
        "benefits": ["Planejamento e método", "IA aplicada aos estudos", "Técnicas de prova", "Execução organizada"],
        "audience": "Para candidatos que desejam fortalecer a estratégia, e não apenas acumular conteúdo.",
        "official": "https://combo-estrategia-da-aprovacao.netlify.app/",
    },
}


def render(slug: str, product: dict) -> str:
    canonical = f"https://lucasmpc.com.br/{slug}"
    image = f"https://lucasmpc.com.br{product['cover']}"
    whatsapp = WHATSAPP + quote(f"Olá, professor Lucas. Quero saber mais sobre {product['title']}.")
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Product",
                "name": product["title"],
                "image": image,
                "description": product["description"],
                "brand": {"@type": "Brand", "name": "Professor Lucas MPC"},
                "url": canonical,
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Início", "item": "https://lucasmpc.com.br/"},
                    {"@type": "ListItem", "position": 2, "name": product["title"], "item": canonical},
                ],
            },
        ],
    }
    benefits = "".join(f"<li>{escape(item)}</li>" for item in product["benefits"])
    return f'''<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(product['title'])} | Prof. Lucas MPC</title>
<meta name="description" content="{escape(product['description'])}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="{canonical}"><link rel="icon" href="/assets/brand/mpc-mark.svg">
<meta property="og:type" content="product"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Professor Lucas MPC">
<meta property="og:title" content="{escape(product['title'])}"><meta property="og:description" content="{escape(product['description'])}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(product['title'])}"><meta name="twitter:description" content="{escape(product['description'])}"><meta name="twitter:image" content="{image}">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')}</script>
<link rel="stylesheet" href="/produto.css?v=20260920-1">
</head><body>
<header><div class="wrap top"><a href="/" class="brand"><img src="/assets/brand/professor-lucas-mpc-logo.svg" alt="Professor Lucas MPC" width="420" height="104"></a><a href="/">← Voltar à vitrine</a></div></header>
<main><section class="hero"><div class="wrap grid"><img class="cover" src="{product['cover']}" alt="Capa de {escape(product['title'])}" width="720" height="960"><div><span class="eyebrow">{escape(product['category'])}</span><h1>{escape(product['title'])}</h1><p class="lead">{escape(product['description'])}</p><ul>{benefits}</ul><div class="actions"><a class="btn" data-analytics="produto_oficial" href="{product['official']}">CONHECER PRODUTO</a><a class="btn ghost" data-analytics="whatsapp_produto" href="{whatsapp}">TIRAR DÚVIDA NO WHATSAPP</a></div><p class="small">Você será encaminhado para a página oficial do produto. Consulte nela as condições atuais de acesso, pagamento e garantia.</p></div></div></section>
<section class="section"><div class="wrap narrow"><h2>Para quem é</h2><p>{escape(product['audience'])}</p><div class="facts"><div><b>Conteúdo educacional</b><span>Desenvolvido para apoiar sua preparação.</span></div><div><b>Acesso oficial</b><span>O botão leva ao ambiente oficial do produto.</span></div><div><b>Atendimento</b><span>Dúvidas podem ser enviadas diretamente pelo WhatsApp.</span></div></div></div></section>
<section class="section alt"><div class="wrap narrow"><h2>Perguntas frequentes</h2><details><summary>Como vejo o preço e a forma de pagamento?</summary><p>As condições atualizadas aparecem na página oficial acessada pelo botão principal.</p></details><details><summary>Este produto garante aprovação?</summary><p>Não. Trata-se de conteúdo educacional. Resultados dependem de dedicação, edital, preparação e desempenho individual.</p></details><details><summary>Posso tirar uma dúvida antes de acessar?</summary><p>Sim. Use o botão do WhatsApp para falar sobre este produto específico.</p></details></div></section></main>
<footer><div class="wrap"><span>© 2026 Professor Lucas MPC</span><span><a href="/politica-de-privacidade">Privacidade</a> · <a href="/termos-de-uso">Termos</a></span></div></footer>
<script>document.addEventListener('click',function(e){{const a=e.target.closest('a[data-analytics]');if(!a)return;window.dataLayer=window.dataLayer||[];window.dataLayer.push({{event:'product_click',type:a.dataset.analytics,product:{json.dumps(product['title'], ensure_ascii=False)},destination:a.href}})}});</script>
</body></html>'''


for slug, product in PRODUCTS.items():
    (ROOT / f"{slug}.html").write_text(render(slug, product), encoding="utf-8")

print(f"Generated {len(PRODUCTS)} static product pages.")
