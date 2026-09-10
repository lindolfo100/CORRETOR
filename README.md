<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/96e01fcf-10b9-4f64-88f8-e218687440ac

> [![CI](https://github.com/diegolindolfo/profenem/actions/workflows/ci.yml/badge.svg)](https://github.com/diegolindolfo/profenem/actions/workflows/ci.yml)
> [![Build](https://img.shields.io/badge/build-ci-blue)](https://github.com/diegolindolfo/profenem/actions/workflows/ci.yml)
> [![Security Audit](https://img.shields.io/badge/security-audit%20(non--blocking)-orange)](https://github.com/diegolindolfo/profenem/actions/workflows/ci.yml)

## PR / Release Checklist

- [x] Configurar badges do README com o repositório real (`diegolindolfo/profenem`)
- [ ] Garantir `.env` local configurado (Firebase + Gemini)
- [ ] Rodar `npm run typecheck`
- [ ] Rodar `npm run lint`
- [ ] Rodar `npm run test`
- [ ] Rodar `npm run build`
- [ ] Validar fluxo principal manualmente (upload -> processamento -> revisão)
- [ ] Abrir PR com resumo e plano de teste
- [ ] Confirmar CI verde (`quality`, `build`, `security-audit`)

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
