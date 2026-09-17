# Lucas MPC

Site principal da marca **Lucas MPC**, publicado em `https://lucasmpc.com.br`.

## Estrutura

- `index.html`: portal público da marca Lucas MPC.
- páginas SEO: cronogramas, guias de estudo e conteúdos para concursos.
- `admin.html`: área interna usada pelo Prof. Lucas MPC para criação dos cronogramas.
- `sitemap.xml`: sitemap do domínio `lucasmpc.com.br`.
- `robots.txt`: regras de rastreamento e referência ao sitemap oficial.

## Publicação

Projeto estático hospedado no Netlify.

- Build command: deixar vazio
- Publish directory: `.`

## Domínio

Domínio principal: `https://lucasmpc.com.br`

O antigo subdomínio `gerador-de-cronograma-mpc.netlify.app` é tratado como endereço legado e deve redirecionar para o domínio principal preservando o caminho.

## Área administrativa

A ferramenta de criação não faz parte do fluxo público do cliente. O cliente recebe o cronograma pronto; a área administrativa permanece com `noindex`.
