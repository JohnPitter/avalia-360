# Avalia 360° 🎯

Sistema web para avaliações 360 graus onde gestores podem criar avaliações, convidar equipes e acompanhar resultados de forma segura e criptografada.

![CI/CD Pipeline](https://github.com/JohnPitter/avalia-360/actions/workflows/ci-cd.yml/badge.svg)

## O que é o Avalia 360°?

O **Avalia 360°** é uma aplicação gratuita e segura para realizar avaliações 360 graus em equipes. Em uma avaliação 360°, **todos os membros da equipe avaliam todos os outros membros**, proporcionando uma visão completa e multidimensional do desempenho de cada pessoa.

### Como funciona a Avaliação 360°?

Em uma equipe de **5 pessoas**, cada pessoa avalia **4 colegas** (todos exceto ela mesma):

```
Equipe: João, Maria, Pedro, Ana, Carlos

João avalia → Maria, Pedro, Ana, Carlos (4 avaliações)
Maria avalia → João, Pedro, Ana, Carlos (4 avaliações)
Pedro avalia → João, Maria, Ana, Carlos (4 avaliações)
Ana avalia → João, Maria, Pedro, Carlos (4 avaliações)
Carlos avalia → João, Maria, Pedro, Ana (4 avaliações)

Total: 20 avaliações no sistema
Cada pessoa recebe: 4 avaliações (feedback de todos os colegas)
```

### Principais Funcionalidades

- 🎯 **Avaliação 360° Completa** - Todos avaliam todos para visão multidimensional
- 📊 **Importação via Excel** - Adicione membros manualmente ou via upload de planilha
- 📧 **Envio Automático de Emails** - Convites enviados automaticamente via EmailJS
- 🔒 **Dados Criptografados** - Criptografia AES-256 para todas as informações sensíveis
- 📈 **Dashboard em Tempo Real** - Acompanhe progresso geral e individual
- 📉 **Resultados Consolidados** - Médias, gráficos e comentários por pessoa
- 🎭 **Anonimato Garantido** - Gestor não vê quem avaliou quem
- 💾 **Salvamento Parcial** - Colaboradores podem completar em múltiplas sessões
- 🌐 **Multi-idioma** - Português, Inglês e Espanhol

## Pré-requisitos

- Node.js 18+ instalado
- Conta no [Firebase](https://firebase.google.com/) (gratuita)
- Conta no [EmailJS](https://www.emailjs.com/) (gratuita - 200 emails/mês)
- Repositório GitHub (para deploy automático)

## Configuração do Projeto

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/avalia-360.git
cd avalia-360
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "avalia-360")
4. Ative o **Firestore Database**:
   - Vá em "Firestore Database" → "Criar banco de dados"
   - Escolha "Modo de produção"
   - Selecione a região (ex: southamerica-east1)
5. Configure as **Regras de Segurança**:
   - Vá em "Firestore Database" → "Regras"
   - Substitua pelo conteúdo abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Avaliações
    match /avaliations/{avaliationId} {
      allow read, write: if true; // Controle por token na aplicação
    }

    // Membros da equipe
    match /team_members/{memberId} {
      allow read, write: if true;
    }

    // Respostas
    match /responses/{responseId} {
      allow read, write: if true;
    }

    // Logs (apenas escrita)
    match /application_logs/{logId} {
      allow write: if true;
      allow read: if false;
    }
  }
}
```

6. Copie as credenciais:
   - Vá em "Configurações do projeto" (ícone de engrenagem)
   - Role até "Seus aplicativos"
   - Clique em "Web" (ícone `</>`)
   - Registre um nome (ex: "Avalia 360 Web")
   - Copie as credenciais que aparecem

### 4. Configure o EmailJS

1. Acesse [EmailJS](https://www.emailjs.com/)
2. Crie uma conta gratuita
3. Configure um **serviço de email**:
   - Dashboard → Email Services → "Add New Service"
   - Escolha seu provedor (Gmail, Outlook, etc.)
   - Conecte sua conta
   - Copie o **Service ID** (ex: `service_abc123`)
4. Crie templates de email (um para cada idioma):

#### **Template Português** (`template_pt`)

```
Assunto: Convite para Avaliação 360° - {{title}}

Olá {{to_name}},

{{manager_name}} convidou você para participar da avaliação 360°.

Acesse o link abaixo e use seu código de acesso:
{{evaluation_link}}

Código de acesso: {{access_code}}

Importante: Você precisará avaliar todos os membros da sua equipe.

Atenciosamente,
Avalia 360°
```

#### **Template Inglês** (`template_en`)

```
Subject: 360° Evaluation Invitation - {{title}}

Hello {{to_name}},

{{manager_name}} has invited you to participate in the 360° evaluation.

Access the link below and use your access code:
{{evaluation_link}}

Access code: {{access_code}}

Important: You will need to evaluate all members of your team.

Best regards,
Avalia 360°
```

#### **Template Espanhol** (`template_es`)

```
Asunto: Invitación a Evaluación 360° - {{title}}

Hola {{to_name}},

{{manager_name}} te ha invitado a participar en la evaluación 360°.

Accede al enlace a continuación y usa tu código de acceso:
{{evaluation_link}}

Código de acceso: {{access_code}}

Importante: Deberás evaluar a todos los miembros de tu equipo.

Atentamente,
Avalia 360°
```

5. Copie os **Template IDs**:
   - Português: `template_pt`
   - Inglês: `template_en`
   - Espanhol: `template_es`
6. Copie a **Public Key**:
   - Account → General → Public Key

### 5. Configure as Variáveis de Ambiente

#### Desenvolvimento Local

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Preencha o arquivo `.env` com suas credenciais:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_pt
VITE_EMAILJS_TEMPLATE_ID_EN=template_en
VITE_EMAILJS_TEMPLATE_ID_ES=template_es
VITE_EMAILJS_PUBLIC_KEY=abc123xyz
```

#### Deploy (GitHub Secrets)

Para deploy automático, configure os secrets no GitHub:

1. Vá em `Settings` → `Secrets and variables` → `Actions`
2. Clique em "New repository secret"
3. Adicione cada variável:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID_EN`
   - `VITE_EMAILJS_TEMPLATE_ID_ES`
   - `VITE_EMAILJS_PUBLIC_KEY`
   - `FIREBASE_SERVICE_ACCOUNT` (JSON da service account)
   - `FIREBASE_PROJECT_ID`

## Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Build de Produção

```bash
npm run build
```

### Preview do Build

```bash
npm run preview
```

### Testes

#### Testes Unitários (263 testes)

```bash
# Modo watch (desenvolvimento)
npm test

# Executar uma vez
npm run test:run

# Com interface visual
npm run test:ui

# Com cobertura de código
npm run test:coverage
```

#### Testes E2E (End-to-End)

```bash
# Modo headless
npm run test:e2e

# Modo visual (ver browser)
npm run test:e2e:headed

# Interface do Playwright
npm run test:e2e:ui

# Debug passo a passo
npm run test:e2e:debug
```

## Como Usar

### Para Gestores

#### 1. Criar Avaliação

1. Acesse a página inicial
2. Selecione seu idioma (PT/EN/ES) no canto superior direito
3. Clique em "Criar Avaliação"
4. Preencha:
   - Seu nome
   - Seu email
   - Título da avaliação (ex: "Avaliação Q4 2024 - Time Dev")

#### 2. Adicionar Membros da Equipe

Você tem duas opções:

**Opção A - Manual:**
- Clique em "Adicionar Membro"
- Preencha nome e email de cada membro
- Adicione no mínimo 2 membros

**Opção B - Upload de Excel:**
- Clique em "Baixar Template Excel"
- Abra o arquivo `template-avaliacao-360.xlsx`
- Preencha com os dados da equipe:

| Nome           | Email                    |
|----------------|--------------------------|
| João Silva     | joao.silva@empresa.com   |
| Maria Santos   | maria.santos@empresa.com |
| Pedro Oliveira | pedro@empresa.com        |

- Salve o arquivo
- Clique em "Upload Excel"
- Arraste ou selecione o arquivo preenchido
- O sistema validará automaticamente

#### 3. Enviar Convites

- Clique em "Criar e Enviar Convites"
- Todos os membros receberão um email automaticamente
- Você receberá:
  - **Token de acesso** (UUID) - Guarde com segurança
  - **Link de acompanhamento** - Para ver o progresso
  - Lista com todos os códigos de acesso dos membros

#### 4. Acompanhar Progresso

- Use o link de acompanhamento
- Visualize:
  - **Progresso geral**: "15/20 avaliações concluídas"
  - **Progresso individual**:
    - ✅ João: 4/4 completo
    - ⏳ Maria: 2/4 pendente
    - ⏳ Pedro: 1/4 pendente
- Atualize em tempo real conforme colaboradores completam

#### 5. Ver Resultados

- Quando **todos completarem todas as avaliações**:
  - Clique em "Ver Resultados"
  - Visualize resultados **por pessoa**:
    - Média geral (1-5)
    - Desempenho por pergunta (Satisfação, Proatividade, Qualidade, Trabalho em Equipe)
    - Todos os comentários recebidos (anônimos)
  - Compare com gráficos visuais

### Para Colaboradores

#### 1. Acessar Avaliação

- Abra o email recebido
- Clique no link da avaliação
- Insira o código de acesso (6 dígitos)

#### 2. Avaliar os Membros da Equipe

- Você verá a lista de todos os membros (exceto você)
- Para **cada pessoa**, você deve:
  - Responder 4 perguntas objetivas (escala 1-5):
    - Nível de satisfação
    - Proatividade
    - Qualidade das entregas
    - Trabalho em equipe
  - Adicionar comentários sobre pontos positivos
  - Adicionar comentários sobre pontos de melhoria
- Acompanhe seu progresso: "2/4 avaliações concluídas"

**Escala de Respostas:**
- **1** - Abaixo da Expectativa
- **2** - Em Linha de Melhora
- **3** - Alinhado com as Expectativas
- **4** - Acima das Expectativas
- **5** - Referência Para Outras Pessoas

#### 3. Salvar e Continuar

- Você pode salvar parcialmente
- Volte depois com seu código de acesso
- Complete todas as avaliações pendentes
- Só estará 100% completo quando avaliar todos os colegas

#### 4. Garantias

- ✅ Suas respostas são **totalmente anônimas**
- ✅ O gestor **NÃO vê quem avaliou quem**
- ✅ Apenas médias e comentários consolidados são exibidos
- ✅ Dados criptografados com AES-256

## Template Excel para Importação

### Formato

O arquivo deve ter exatamente 2 colunas com cabeçalhos:

| Nome  | Email |
|-------|-------|
| ...   | ...   |

### Validações Automáticas

O sistema verifica:
- ✅ Formato de emails válidos
- ✅ Emails duplicados
- ✅ Campos vazios
- ✅ Mínimo de 2 membros
- ✅ Limite recomendado: 50 membros

### Formatos Aceitos

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

## Deploy

### Firebase Hosting (Recomendado)

1. Instale Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```

2. Configure o projeto:
```bash
cp .firebaserc.example .firebaserc
# Edite .firebaserc e adicione seu project ID
```

3. Deploy manual:
```bash
npm run build
firebase deploy --only hosting
```

### Deploy Automático (GitHub Actions)

O projeto possui CI/CD configurado que executa automaticamente:

**Quando:** Push para branch `main`

**Etapas:**
1. 🔍 TypeScript Check
2. 🔐 Security Audit
3. 🧪 Unit Tests
4. 🏗️ Build Application
5. 🚀 Deploy to Firebase
6. 📄 Deploy to GitHub Pages

Seu site estará disponível em:
- Firebase: `https://seu-projeto.web.app`
- GitHub Pages: `https://seu-usuario.github.io/avalia-360`

## Segurança

O Avalia 360° implementa as melhores práticas de segurança:

- 🔒 **Criptografia AES-256** para dados sensíveis
- 🔐 **Tokens UUID** seguros para gestores
- 🔑 **Códigos de acesso** com hash SHA-256
- 🛡️ **Proteção contra XSS** com DOMPurify
- 🚫 **Proteção contra injection** attacks
- ⏱️ **Rate limiting** (5 tentativas)
- 📋 **OWASP Top 10** compliance

Para detalhes técnicos completos, consulte [PLANO.md](PLANO.md).

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Firebase Firestore + Cloud Functions
- **Email:** EmailJS
- **Criptografia:** crypto-js (AES-256)
- **Excel:** xlsx (SheetJS)
- **Testes:** Vitest + Playwright
- **i18n:** i18next

Para detalhes sobre arquitetura, design system, performance e implementação, consulte [PLANO.md](PLANO.md).

## Limitações

- **EmailJS:** 200 emails/mês no plano gratuito
- **Firebase Firestore:** 50k leituras/dia no plano gratuito
- **Tokens:** Expiram após 90 dias

## Suporte

- 📖 Documentação técnica: [PLANO.md](PLANO.md)
- 🐛 Reportar bug: [GitHub Issues](https://github.com/seu-usuario/avalia-360/issues)
- 💬 Dúvidas: Entre em contato via issues

## Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

**Avalia 360°** - Sistema de Avaliações 360 Graus Seguro e Moderno
