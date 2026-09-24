from pathlib import Path

path = Path('correcao-pmsp-2026/index.html')
text = path.read_text(encoding='utf-8')

replacements = {
    '<title>Gabarito PM-SP 2026 Soldado + Correção Comentada | Lucas MPC</title>':
        '<title>Gabarito PM-SP 2026 + Prova PDF + Correção | Lucas MPC</title>',
    '<meta name="description" content="Confira o gabarito preliminar da Vunesp para Soldado PM-SP 2026 nas versões 1, 2, 3 e 4, com os códigos dos cadernos e 60 questões comentadas.">':
        '<meta name="description" content="Confira o gabarito PM-SP 2026 da Vunesp, baixe a prova de Soldado em PDF, veja as 60 questões comentadas e o tema da redação com modelo.">',
    '<meta property="og:title" content="Gabarito PM-SP 2026 Soldado + Correção Comentada">':
        '<meta property="og:title" content="Gabarito PM-SP 2026 + Prova PDF + Correção Comentada">',
    '<meta property="og:description" content="Gabarito preliminar da Vunesp nas quatro versões da prova. Nossa correção da Versão 1 coincidiu nas 60 questões.">':
        '<meta property="og:description" content="Gabarito PM-SP 2026, prova de Soldado em PDF, 60 questões comentadas e tema da redação com modelo autoral.">',
    '<meta property="article:modified_time" content="2026-09-22">':
        '<meta property="article:modified_time" content="2026-09-24">',
    '"headline":"Gabarito PM-SP 2026 Soldado + Correção Comentada"':
        '"headline":"Gabarito PM-SP 2026 + Prova PDF + Correção Comentada"',
    '"description":"Gabarito preliminar da Vunesp para Soldado PM-SP 2026 com as versões 1, 2, 3 e 4, códigos dos cadernos, 60 questões comentadas, redação e análise de possível recurso."':
        '"description":"Gabarito PM-SP 2026 da Vunesp com as quatro versões, prova de Soldado em PDF, 60 questões comentadas, tema da redação, modelo autoral e análise de possível recurso."',
    '"dateModified":"2026-09-22"':
        '"dateModified":"2026-09-24"',
    '<h1>Correção Completa da Prova PM-SP 2026 <span>60 Questões Comentadas + Gabarito</span></h1>':
        '<h1>Gabarito PM-SP 2026 + Prova em PDF <span>60 Questões Comentadas + Tema da Redação</span></h1>',
    '<p class="lead">Acompanhe a correção da prova da Polícia Militar de São Paulo questão por questão. Esta página será atualizada conforme as respostas forem conferidas, com atenção especial às questões de Matemática e aos pontos que possam exigir análise de recurso.</p>':
        '<p class="lead">Confira o gabarito da prova de Soldado PM-SP 2026 da Vunesp nas quatro versões, baixe a prova completa em PDF e veja as 60 questões comentadas. A página também reúne o tema da redação, um modelo autoral e a análise responsável de possíveis recursos.</p>',
    '<h2>Modelo de redação sobre o tema da prova</h2>':
        '<h2>Tema da redação PM-SP 2026 + modelo comentado</h2>',
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Trecho esperado não encontrado: {old[:120]}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('SEO PM-SP atualizado com', len(replacements), 'substituicoes.')
