# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Verificar bloqueios de lançamento

Depois de configurar as chaves (veja [`.env.example`](.env.example)):

```sh
npm run verificar:lancamento
```

O script checa variáveis, service role, buckets, SMTP, Edge Functions de pagamento/IA, headers e dados de teste, e termina com exit code 1 se houver bloqueio. Passo a passo, incluindo o teste de exclusão de conta em conta descartável, em [COMO-VERIFICAR-BLOQUEIOS.md](COMO-VERIFICAR-BLOQUEIOS.md). O panorama completo está em [RELATORIO-LANCAMENTO-AURA-ID.md](RELATORIO-LANCAMENTO-AURA-ID.md).
