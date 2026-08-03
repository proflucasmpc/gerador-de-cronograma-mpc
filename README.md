# Gerador de Cronograma MPC

Aplicação estática para criação de cronogramas de estudos para concursos.

## Publicação

O arquivo principal é `index.html`.  
O projeto não exige instalação, compilação ou dependências.

## Armazenamento

Os cronogramas são salvos no navegador de cada usuário por meio de `localStorage`.

**Importante:** não alterar a constante `STORAGE_KEY = 'geradorCronogramaMpcData'` em atualizações futuras, pois ela identifica os dados salvos dos alunos.

## Netlify

Conecte este repositório à Netlify e use:

- Build command: deixar vazio
- Publish directory: `.`
