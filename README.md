# portfolio

Site de portfólio pessoal de Gustavo Lucena — HTML/CSS/JS estático, publicado no GitHub Pages.

## Estrutura

```
index.html            Work (home)
about/index.html      About
contact/index.html    Contact
termoli/index.html    Case: Rebranding Termoli
assets/
  css/style.css       Tokens, tipografia e breakpoints
  js/main.js          Interações (smooth scroll, filtro, vídeos lazy, cursor)
  js/vendor/          Bibliotecas de terceiros copiadas do npm (Lenis)
  icons/sprite.svg    Ícones Phosphor (gerado)
  img/                Imagens otimizadas (WebP, várias larguras — gerado)
  video/              Vídeos otimizados (H.264 + poster — gerado)
  logos/              Logos SVG (colaborações e ferramentas)
assets-src/           Originais em alta (NÃO vão para o git)
scripts/              Pipeline de otimização
```

## Breakpoints

| Nome   | Largura       |
| ------ | ------------- |
| Mobile | < 810px       |
| Tablet | 810 – 1199px  |
| Web    | ≥ 1200px      |

CSS é mobile-first: estilos base = mobile, depois `@media (min-width: 810px)` e `@media (min-width: 1200px)`.

## Fontes e ícones

- **Instrument Sans** (400, 500) e **Sometype Mono** (400, 700) via Google Fonts.
- **Phosphor Icons** (peso regular) num sprite SVG local. Para adicionar um ícone, inclua o nome
  (veja em [phosphoricons.com](https://phosphoricons.com)) em `scripts/icons.mjs` e rode `npm run icons`:

  ```html
  <svg class="icon" aria-hidden="true"><use href="assets/icons/sprite.svg#arrow-up-right"></use></svg>
  ```

## Smooth scroll

Usa o [Lenis](https://github.com/darkroomengineering/lenis) — a mesma lib do componente "Smooth Scroll"
do Framer — com as mesmas configurações (intensidade 10 → `duration: 1`, easing exponencial).
Nas páginas internas suaviza a rolagem vertical; na Home (Web) controla a faixa horizontal de cards.
Fica desligado para quem ativa "reduzir movimento" no sistema e não altera o scroll por toque.
O arquivo é servido localmente (`assets/js/vendor/lenis.min.js`); para atualizar:
`npm update lenis && npm run vendor`.

## Fluxo de trabalho

```bash
npm install          # uma vez: sharp, ffmpeg-static, phosphor
npm run serve        # preview em http://localhost:8080
```

### Adicionando imagens e vídeos

1. Coloque o original em alta em `assets-src/<pasta>/`.
2. Registre em `scripts/assets.config.mjs` (larguras desejadas para imagens, largura máxima para vídeos).
3. Rode `npm run optimize` — gera WebP responsivos em `assets/img/` e MP4 (H.264, sem áudio, faststart)
   + poster em `assets/video/`. Imagens com cores chapadas saem em WebP lossless automaticamente.
4. Use no HTML com `srcset`/`sizes` (imagens) ou `data-autoplay` (vídeos que tocam só quando visíveis).
5. Rode `npm run size` para conferir o tamanho total publicado.

### Limites do GitHub

- Arquivo > 100 MB é bloqueado; > 50 MB gera aviso.
- GitHub Pages: site publicado até 1 GB e ~100 GB/mês de banda (limite flexível).
- Orçamento deste projeto: nenhum arquivo acima de ~5 MB e site total bem abaixo de 150 MB.

## Publicação

O GitHub Pages serve a branch `main` a partir da raiz (`Settings → Pages → Deploy from a branch → main / root`).
Como é um site de projeto, a URL fica em `https://lucenagus.github.io/portfolio/` — por isso todos os
links e caminhos de assets são **relativos**.
