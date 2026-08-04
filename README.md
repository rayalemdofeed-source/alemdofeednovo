# Jornada Além do Feed

Landing page da **Jornada Além do Feed** — consultoria de branding pessoal e posicionamento
digital de Rayane Guimarães. Site estático em **Astro**, zero JS por padrão, construído para
nota máxima de Lighthouse.

## Stack

- **Astro** (saída estática)
- CSS puro, sem framework — tokens de design em `src/styles/global.css`
- Fontes self-hosted (`@fontsource-variable/fraunces`, `@fontsource/ibm-plex-mono`)
- Animações via CSS Scroll-driven Animations (`animation-timeline: view()`/`scroll()`), com
  fallback estático em navegadores sem suporte
- Uma única ilha JS (`Hero.astro`) para o brilho de fundo reagir ao mouse

## Comandos

| Comando            | Ação                                  |
| ------------------- | -------------------------------------- |
| `npm install`       | Instala as dependências                |
| `npm run dev`        | Servidor de desenvolvimento (`:4321`)  |
| `npm run build`      | Build estático em `./dist/`            |
| `npm run preview`    | Pré-visualiza o build local            |

## Estrutura

```
src/
├── assets/          # imagens/fotos processadas via astro:assets
├── components/       # uma seção da página por componente
├── layouts/Layout.astro
├── lib/consts.ts      # WhatsApp, e-mail, Instagram
├── pages/index.astro   # a landing page
└── styles/global.css   # tokens, reset, utilitários (.reveal, .btn-glass)
public/
└── video/            # vídeos servidos como estático (fora do pipeline de imagem)
intelligence/          # inteligência de criação de landing pages (não entra no build)
```

## Conteúdo

- **Oferta:** Jornada Além do Feed — acompanhamento de 3 meses. Vagas por turma, sem preço
  público na página (investimento combinado por WhatsApp).
- **CTA:** todos os botões abrem WhatsApp da Rayane com mensagem pré-preenchida
  (`src/lib/consts.ts` → `waLink`).

## Deploy

Conectado ao [Vercel](https://vercel.com/new) — detecção automática do Astro, sem configuração.
Cada push na branch `main` publica.
