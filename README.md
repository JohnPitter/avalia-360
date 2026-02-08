# Avalia 360

<div align="center">

![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3+-blue?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![CI/CD](https://img.shields.io/github/actions/workflow/status/JohnPitter/avalia-360/ci-cd.yml?style=for-the-badge&label=CI/CD)

**Sistema de Avaliacoes 360 Graus**

*Avaliacoes seguras e criptografadas para equipes*

[Instalacao](#instalacao) •
[Features](#features) •
[Como Usar](#como-usar) •
[Seguranca](#seguranca) •
[Documentacao](#documentacao)

</div>

---

## Overview

O **Avalia 360** e uma aplicacao gratuita e segura para realizar avaliacoes 360 graus em equipes. Em uma avaliacao 360, todos os membros da equipe avaliam todos os outros membros, proporcionando uma visao completa e multidimensional do desempenho de cada pessoa.

### Como funciona a Avaliacao 360?

Em uma equipe de 5 pessoas, cada pessoa avalia 4 colegas (todos exceto ela mesma):

```
Equipe: Joao, Maria, Pedro, Ana, Carlos

Joao avalia   -> Maria, Pedro, Ana, Carlos (4 avaliacoes)
Maria avalia  -> Joao, Pedro, Ana, Carlos  (4 avaliacoes)
Pedro avalia  -> Joao, Maria, Ana, Carlos  (4 avaliacoes)
Ana avalia    -> Joao, Maria, Pedro, Carlos (4 avaliacoes)
Carlos avalia -> Joao, Maria, Pedro, Ana   (4 avaliacoes)

Total: 20 avaliacoes no sistema
Cada pessoa recebe: 4 avaliacoes (feedback de todos os colegas)
```

---

## Instalacao

### Requisitos

| Requisito | Versao |
|-----------|--------|
| Node.js | 18+ |
| npm | 9+ |
| Firebase | Conta gratuita |
| EmailJS | Conta gratuita (200 emails/mes) |

### Quick Start

```bash
# Clone o repositorio
git clone https://github.com/JohnPitter/avalia-360.git
cd avalia-360

# Instale as dependencias
npm install

# Copie as variaveis de ambiente
cp .env.example .env

# Configure o .env com suas credenciais Firebase e EmailJS
# Veja docs/FIREBASE_SETUP.md e docs/EMAILJS_SETUP.md

# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:5173
```

### Scripts Disponiveis

| Script | Descricao |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm run preview` | Preview do build |
| `npm test` | Testes unitarios (watch) |
| `npm run test:run` | Testes unitarios (single run) |
| `npm run test:coverage` | Cobertura de codigo |
| `npm run test:e2e` | Testes E2E (Playwright) |

---

## Features

| Feature | Descricao |
|---------|-----------|
| **Avaliacao 360 Completa** | Todos avaliam todos para visao multidimensional |
| **Importacao via Excel** | Adicione membros manualmente ou via upload de planilha |
| **Envio Automatico de Emails** | Convites enviados automaticamente via EmailJS |
| **Dados Criptografados** | Criptografia AES-256 para todas as informacoes sensiveis |
| **Dashboard em Tempo Real** | Acompanhe progresso geral e individual |
| **Resultados Consolidados** | Medias, graficos e comentarios por pessoa |
| **Anonimato Garantido** | Gestor nao ve quem avaliou quem |
| **Salvamento Parcial** | Colaboradores podem completar em multiplas sessoes |
| **Multi-idioma** | Portugues, Ingles e Espanhol |

---

## Como Usar

### Para Gestores

1. **Criar Avaliacao** - Acesse a pagina inicial, selecione o idioma e clique em "Criar Avaliacao". Preencha seu nome, email e titulo da avaliacao.

2. **Adicionar Membros** - Adicione membros manualmente ou faca upload de uma planilha Excel com colunas Nome e Email (minimo 2 membros).

3. **Enviar Convites** - Clique em "Criar e Enviar Convites". Todos os membros receberao um email automaticamente. Voce recebera um token de acesso e link de acompanhamento.

4. **Acompanhar Progresso** - Use o link de acompanhamento para visualizar o progresso geral e individual em tempo real.

5. **Ver Resultados** - Quando todos completarem as avaliacoes, visualize resultados por pessoa com media geral, desempenho por pergunta e comentarios anonimos.

### Para Colaboradores

1. **Acessar Avaliacao** - Abra o email recebido, clique no link e insira o codigo de acesso (6 digitos).

2. **Avaliar Membros** - Para cada colega, responda 4 perguntas objetivas (escala 1-5: satisfacao, proatividade, qualidade das entregas, trabalho em equipe) e adicione comentarios.

3. **Salvar e Continuar** - Voce pode salvar parcialmente e voltar depois com seu codigo de acesso.

**Escala de Respostas:** 1 - Abaixo da Expectativa | 2 - Em Linha de Melhora | 3 - Alinhado com as Expectativas | 4 - Acima das Expectativas | 5 - Referencia Para Outras Pessoas

> Para o guia completo e detalhado, consulte [docs/USAGE_GUIDE.md](docs/USAGE_GUIDE.md).

---

## Seguranca

O Avalia 360 implementa as melhores praticas de seguranca:

| Recurso | Descricao |
|---------|-----------|
| **Criptografia AES-256** | Dados sensiveis criptografados |
| **Tokens UUID** | Tokens seguros para gestores |
| **Codigos de Acesso** | Hash SHA-256 para codigos |
| **Protecao contra XSS** | Sanitizacao com DOMPurify |
| **Protecao contra Injection** | Validacao de inputs |
| **Rate Limiting** | 5 tentativas por codigo |
| **OWASP Top 10** | Compliance com melhores praticas |

---

## Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI** | Tailwind CSS + shadcn/ui |
| **Backend** | Firebase Firestore + Cloud Functions |
| **Email** | EmailJS |
| **Criptografia** | crypto-js (AES-256) |
| **Excel** | xlsx (SheetJS) |
| **Testes** | Vitest + Playwright |
| **i18n** | i18next |

---

## Deploy

### Firebase Hosting (Recomendado)

```bash
npm install -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc
# Edite .firebaserc com seu project ID

npm run build
firebase deploy --only hosting
```

### Deploy Automatico (GitHub Actions)

O projeto possui CI/CD configurado que executa automaticamente em push para `main`:

1. TypeScript Check
2. Security Audit
3. Unit Tests
4. Build Application
5. Deploy to Firebase
6. Deploy to GitHub Pages

---

## Limitacoes

| Recurso | Limite |
|---------|--------|
| EmailJS | 200 emails/mes (plano gratuito) |
| Firebase Firestore | 50k leituras/dia (plano gratuito) |
| Tokens | Expiram apos 90 dias |

---

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) | Configuracao do Firebase |
| [EMAILJS_SETUP.md](docs/EMAILJS_SETUP.md) | Configuracao do EmailJS |
| [USAGE_GUIDE.md](docs/USAGE_GUIDE.md) | Guia de uso detalhado |
| [DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) | Guia de deploy |
| [GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md) | Configuracao de secrets |
| [BACKEND_ENCRYPTION_MIGRATION.md](docs/BACKEND_ENCRYPTION_MIGRATION.md) | Migracao de criptografia |

---

## License

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## Contributing

Contribuicoes sao bem-vindas! Por favor:
1. Faca um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudancas (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## Support

- **Issues:** [GitHub Issues](https://github.com/JohnPitter/avalia-360/issues)
- **Discussoes:** [GitHub Discussions](https://github.com/JohnPitter/avalia-360/discussions)
