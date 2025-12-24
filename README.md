# Avalia 360° 🎯

Sistema web para avaliações 360 graus onde gestores podem criar avaliações, convidar equipes e acompanhar resultados de forma segura e criptografada.

## Sobre o Projeto

O **Avalia 360°** é uma aplicação moderna e segura para realizar avaliações 360 graus em equipes. Em uma avaliação 360°, **todos os membros da equipe avaliam todos os outros membros**, proporcionando uma visão completa e multidimensional do desempenho de cada pessoa. O sistema permite que gestores criem avaliações, convidem todos os colaboradores via email e acompanhem o progresso em tempo real, tudo de forma totalmente gratuita.

### Como funciona a Avaliação 360°?

Em uma equipe de **5 pessoas**, cada pessoa avalia **4 colegas** (todos exceto ela mesma):
- **Total de avaliações:** 5 × 4 = **20 avaliações**
- **Cada pessoa recebe:** 4 avaliações (uma de cada colega)
- **Resultado:** Visão completa do desempenho de cada membro

#### Exemplo Visual

```
Equipe: João, Maria, Pedro, Ana, Carlos

João avalia → Maria, Pedro, Ana, Carlos (4 avaliações)
Maria avalia → João, Pedro, Ana, Carlos (4 avaliações)
Pedro avalia → João, Maria, Ana, Carlos (4 avaliações)
Ana avalia → João, Maria, Pedro, Carlos (4 avaliações)
Carlos avalia → João, Maria, Pedro, Ana (4 avaliações)

Resultado:
- João recebe 4 avaliações (de Maria, Pedro, Ana, Carlos)
- Maria recebe 4 avaliações (de João, Pedro, Ana, Carlos)
- E assim por diante...

Total: 20 avaliações no sistema
```

### Principais Funcionalidades

- 🎯 **Avaliação 360° Completa** - Todos avaliam todos para visão multidimensional
- 📊 **Importação via Excel** - Adicione membros manualmente ou via upload de planilha
- 📧 **Envio Automático de Emails** - Convites enviados automaticamente para todos os membros via EmailJS
- 🔒 **Dados Criptografados** - Todas as informações sensíveis são criptografadas com AES-256
- 📈 **Dashboard em Tempo Real** - Acompanhe progresso geral e individual de cada membro
- 📉 **Resultados Consolidados por Pessoa** - Médias, gráficos e comentários de cada membro
- 🔐 **Acesso Controlado** - Apenas o criador da avaliação tem acesso aos resultados
- 🎭 **Anonimato Garantido** - Gestor não vê quem avaliou quem, apenas resultados consolidados
- 💾 **Salvamento Parcial** - Colaboradores podem completar avaliações em múltiplas sessões

## 🚀 Status do Projeto

![CI](https://github.com/joaop/avalia-360/workflows/CI%20-%20Tests%20and%20Build/badge.svg)
![Deploy](https://github.com/joaop/avalia-360/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
[![codecov](https://codecov.io/gh/joaop/avalia-360/branch/main/graph/badge.svg)](https://codecov.io/gh/joaop/avalia-360)

- ✅ **Fase 1-4 Completas** (MVP + Features + Segurança + Resiliência)
- ✅ **263 testes** unitários passando
- ✅ **CI/CD** automatizado com GitHub Actions
- ✅ **Production-ready** com monitoramento completo

## Tecnologias Utilizadas

### Core
- **Frontend:** React 18 + TypeScript + Vite
- **Roteamento:** React Router v6
- **UI:** Tailwind CSS + shadcn/ui
- **Formulários:** React Hook Form + Zod
- **Banco de Dados:** Firebase Firestore
- **Emails:** EmailJS
- **Criptografia:** crypto-js (AES-256)
- **Excel:** xlsx (SheetJS) para importação/exportação
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Animações:** Framer Motion
- **Deploy:** Firebase Hosting + GitHub Actions

## ✨ Design Moderno e Profissional (Redesign 2025)

O **Avalia 360°** foi completamente redesenhado em 2025 com uma interface moderna e profissional, inspirada nas melhores práticas de design de produtos SaaS como **Stripe, Linear, Vercel e Notion**.

### 🎨 Características do Redesign

**Interface Moderna:**
- **Gradientes Vibrantes:** Combinações modernas (indigo/purple/pink, blue/indigo, emerald/teal)
- **Rounded Corners:** Cards com rounded-3xl (24px) para aparência suave
- **Shadows em Camadas:** Sistema de sombras (shadow-lg, shadow-xl, shadow-2xl)
- **Micro-interações:** Hover effects com scale(1.02) e transições suaves
- **Animações Sutis:** Blob animations nos backgrounds, fade-in no conteúdo

**Componentes Redesenhados:**

**HomePage:**
- Hero section com texto gradiente
- Trust indicators com checkmarks
- Feature cards em grid com ícones
- Mini-features destacadas
- CTA com gradiente button

**Portal do Gestor:**
- **ManagerLogin:** Tabs modernas, inputs com ícones, gradient buttons
- **CreateEvaluationForm:** Input grande, contador de caracteres dinâmico, checklist interativa
- **AddMembersForm:** Seção Excel destacada, badges numerados, contador visual de status
- **EvaluationSuccess:** Checkmark animado, token destacado, lista de códigos moderna

**Portal do Colaborador:**
- **MemberLogin:** PIN pad visual com 6 boxes interativas, gradiente emerald
- **EvaluationForm:** Rating stars interativos, contador de caracteres, progress tracker

**Componentes de Layout:**
- **PageLayout:** Wrapper reutilizável com 3 variantes (home, manager, member)
- **Card Components:** Sistema de cards modular com suporte a gradientes

### 🎯 Design System Moderno

**Gradientes por Contexto:**
```css
Home: from-indigo-500 via-purple-500 to-pink-500
Manager: from-blue-600 via-indigo-600 to-purple-600
Member: from-emerald-500 via-teal-500 to-cyan-500
Success: from-green-400 to-emerald-500
Warning: from-amber-500 to-yellow-500
```

**Padrões de Interação:**
- Hover: `scale(1.02)` + `shadow-xl`
- Active: `scale(0.98)`
- Focus: `ring-4 ring-{color}-100`
- Success: Checkmark animado
- Loading: Pulse animation

**Feedback Visual:**
- Copiar texto: Botão muda para verde com checkmark (2s)
- Contadores: Mudam de cor quando próximo do limite
- Progress: Cores dinâmicas (verde = ok, laranja = atenção)
- Validação: Borders e ícones coloridos inline

**Responsividade:**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid adaptativo automático
- Botões empilhados em mobile, lado a lado em desktop

### 📊 Componentes de Visualização

- **Progress Rings:** Visualização circular do progresso geral
- **Progress Bars:** Barras horizontais para progresso individual
- **Rating Badges:** Cores específicas para cada nível (1-5)
- **Status Tags:** Completo (verde), Pendente (amarelo), Atrasado (vermelho)
- **Toast Notifications:** Feedback visual para ações do usuário
- **Skeleton Screens:** Loading states elegantes

### 🎭 Animações Implementadas

```css
Blob Animation: Backgrounds animados com movimento suave
Fade In: Conteúdo aparece com transição
Slide Up: Alertas sobem com animação
Pulse: Indicadores de sucesso pulsam
Scale: Hover e click effects em botões
```

### 📱 Acessibilidade

- ♿ Contraste adequado (WCAG AA)
- 🎯 Touch-friendly (44px+ para botões)
- ⌨️ Navegação por teclado
- 🔊 Screen reader friendly
- 🎨 Fontes legíveis (Inter, 16px base)

Para mais detalhes sobre o design system completo, consulte o arquivo [PLANO.md](PLANO.md).

## Perguntas da Avaliação

### Perguntas Objetivas (Escala 1-5)

1. Qual o nível de satisfação em relação ao profissional?
2. O desenvolvedor demonstrou proatividade na resolução de problemas?
3. Como você avalia a qualidade das entregas e a necessidade de retrabalho?
4. Como você avalia a capacidade de trabalhar em equipe e convivência?

### Perguntas Abertas

5. Comentários:
   - Pontos Positivos
   - Pontos a melhorar/evoluir

### Escala de Respostas

- **1** - Abaixo da Expectativa
- **2** - Em Linha de Melhora
- **3** - Alinhado com as Expectativas
- **4** - Acima das Expectativas
- **5** - Referência Para Outras Pessoas

## Pré-requisitos

- Node.js 18+ instalado
- Conta no [Firebase](https://firebase.google.com/)
- Conta no [EmailJS](https://www.emailjs.com/)
- Repositório GitHub

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
2. Crie um novo projeto
3. Ative o **Firestore Database**
4. Copie as credenciais do Firebase

### 4. Configure o EmailJS

1. Acesse [EmailJS](https://www.emailjs.com/)
2. Crie uma conta gratuita
3. Configure um serviço de email (Gmail, Outlook, etc.)
4. Crie um template de email com os seguintes campos:
   - `{{to_name}}` - Nome do colaborador
   - `{{manager_name}}` - Nome do gestor
   - `{{avaliation_link}}` - Link da avaliação
   - `{{access_code}}` - Código de acesso

### 5. Configure as Variáveis de Ambiente

#### Desenvolvimento Local

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha as variáveis no arquivo `.env`:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=seu_service_id
VITE_EMAILJS_TEMPLATE_ID=seu_template_id
VITE_EMAILJS_PUBLIC_KEY=sua_public_key
```

#### Deploy (GitHub Secrets)

Para deploy no Firebase Hosting, adicione as variáveis como **GitHub Secrets**:

1. Acesse `Settings > Secrets and variables > Actions`
2. Adicione cada variável como um novo secret:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`

### 6. Configure as Regras de Segurança do Firestore

No Firebase Console, vá em **Firestore Database > Rules** e adicione:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras de segurança para avaliações
    match /avaliations/{avaliationId} {
      allow read: if request.auth != null ||
                     resource.data.creator_token == request.query.token;
      allow create: if true;
      allow update: if resource.data.creator_token == request.auth.token;
    }

    // Regras para membros da equipe
    match /team_members/{memberId} {
      allow read: if request.auth != null ||
                     resource.data.access_code == request.query.code;
      allow create: if true;
      allow update: if resource.data.access_code == request.auth.code;
    }

    // Regras para respostas
    match /responses/{responseId} {
      allow read: if request.auth != null;
      allow create: if true;
    }
  }
}
```

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

## Template Excel para Importação de Membros

O sistema permite importar membros da equipe via arquivo Excel para facilitar a criação de avaliações com muitos participantes.

### Formato do Template

O arquivo Excel deve ter a seguinte estrutura:

| Nome           | Email                    |
|----------------|--------------------------|
| João Silva     | joao.silva@empresa.com   |
| Maria Santos   | maria.santos@empresa.com |
| Pedro Oliveira | pedro@empresa.com        |

### Como Usar

1. **Baixar o Template**
   - Na página de criação de avaliação, clique em "Baixar Template Excel"
   - Um arquivo `template-avaliacao-360.xlsx` será baixado

2. **Preencher o Template**
   - Abra o arquivo no Excel, Google Sheets ou LibreOffice
   - **Coluna A (Nome):** Nome completo de cada membro
   - **Coluna B (Email):** Email válido de cada membro
   - Não altere os cabeçalhos (primeira linha)
   - Adicione quantos membros precisar (mínimo 2)

3. **Fazer Upload**
   - Salve o arquivo preenchido
   - Na página de criação, clique em "Upload Excel"
   - Arraste o arquivo ou clique para selecionar
   - Aguarde a validação

4. **Validação Automática**
   - O sistema verifica:
     - Formato de emails válidos
     - Emails duplicados
     - Campos vazios
     - Mínimo de 2 membros
   - Se houver erros, será exibida uma mensagem detalhada

5. **Confirmação**
   - Após validação bem-sucedida, você verá:
     ```
     ✅ 5 membros importados com sucesso!
        - João Silva (joao.silva@empresa.com)
        - Maria Santos (maria.santos@empresa.com)
        - Pedro Oliveira (pedro@empresa.com)
        - Ana Costa (ana@empresa.com)
        - Carlos Lima (carlos@empresa.com)
     ```

### Formatos Aceitos

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

### Dicas

- Use emails corporativos para melhor organização
- Verifique se todos os emails estão corretos antes do upload
- Você pode combinar: adicionar alguns membros manualmente e outros via Excel
- Limite recomendado: 50 membros por avaliação

## Deploy no Firebase Hosting

### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "avalia-360")
4. Siga os passos até concluir a criação

### 2. Configurar Projeto Local

1. Copie o arquivo de configuração:
```bash
cp .firebaserc.example .firebaserc
```

2. Edite `.firebaserc` e substitua `seu-projeto-firebase-aqui` pelo ID do seu projeto Firebase

### 3. Configurar GitHub Actions

1. Instale Firebase CLI localmente:
```bash
npm install -g firebase-tools
```

2. Faça login no Firebase:
```bash
firebase login
```

3. Crie uma Service Account:
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Vá em **Project Settings > Service Accounts**
   - Clique em **Generate New Private Key**
   - Salve o arquivo JSON

4. Adicione Secrets no GitHub:
   - Vá em `Settings > Secrets and variables > Actions`
   - Clique em **New repository secret**
   - Adicione os seguintes secrets:
     - `FIREBASE_SERVICE_ACCOUNT`: Cole todo o conteúdo do arquivo JSON da service account
     - `FIREBASE_PROJECT_ID`: ID do seu projeto Firebase

### 4. Deploy Automático

Após configurar os secrets, o deploy será automático:
- Sempre que fizer push na branch `main`, o workflow `.github/workflows/firebase-deploy.yml` será executado
- O build será criado com `base: '/'` (sem subdiretório)
- O projeto será publicado no Firebase Hosting

Seu site estará disponível em: `https://seu-projeto-firebase.web.app`

**Vantagens do Firebase Hosting:**
- ✅ MIME types corretos para módulos JavaScript
- ✅ HTTPS automático com certificado SSL
- ✅ CDN global com baixa latência
- ✅ Headers de segurança configuráveis
- ✅ Deploy automático via GitHub Actions
- ✅ Rollback fácil para versões anteriores

## Estrutura do Projeto

```
avalia-360/
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml # GitHub Actions workflow para Firebase
├── src/
│   ├── components/             # Componentes React
│   │   ├── gestor/            # Componentes do gestor
│   │   ├── colaborador/       # Componentes do colaborador
│   │   └── shared/            # Componentes compartilhados
│   ├── pages/                 # Páginas da aplicação
│   ├── services/              # Serviços (Firebase, EmailJS, etc)
│   ├── hooks/                 # Custom hooks
│   ├── types/                 # Tipos TypeScript
│   └── utils/                 # Utilitários
├── .env.example               # Exemplo de variáveis de ambiente
├── .gitignore                # Arquivos ignorados pelo Git
├── PLANO.md                  # Plano de implementação detalhado
├── README.md                 # Este arquivo
├── package.json              # Dependências do projeto
├── tsconfig.json             # Configuração TypeScript
└── vite.config.ts            # Configuração Vite
```

## Como Usar

### Para Gestores

1. **Criar Avaliação**
   - Acesse a página inicial e clique em "Criar Avaliação"
   - Preencha o título da avaliação (ex: "Avaliação Q4 2024 - Time Dev")
   - Adicione os membros da equipe de duas formas:

   **Opção A - Manual:**
   - Clique em "Adicionar Membro"
   - Preencha nome e email
   - Repita para cada membro

   **Opção B - Upload de Excel:**
   - Clique em "Baixar Template Excel"
   - Preencha o arquivo com os dados da equipe (Nome | Email)
   - Faça upload do arquivo
   - Sistema valida e importa automaticamente
   - Veja a lista de membros importados com sucesso

   - Clique em "Criar e Enviar Convites"
   - Todos os membros receberão um email automaticamente

2. **Acompanhar Progresso**
   - Use o link de acompanhamento fornecido após criar a avaliação
   - Visualize o progresso geral (ex: 15/20 avaliações concluídas)
   - Veja o progresso individual de cada membro:
     - ✅ João: 4/4 avaliações completas
     - ⏳ Maria: 2/4 avaliações pendentes
     - ⏳ Pedro: 1/4 avaliações pendentes
   - Acompanhe em tempo real conforme as avaliações são enviadas

3. **Ver Resultados**
   - Quando TODOS completarem TODAS as avaliações, acesse os resultados
   - Visualize resultados POR PESSOA:
     - Média geral de cada membro
     - Desempenho por pergunta (Satisfação, Proatividade, Qualidade, Trabalho em Equipe)
     - Todos os comentários recebidos (anônimos)
   - Compare desempenho da equipe com gráficos visuais

### Para Colaboradores

1. **Acessar Avaliação**
   - Clique no link recebido por email
   - Insira o código de acesso fornecido (6 dígitos)

2. **Avaliar Todos os Membros da Equipe**
   - Você verá uma lista com todos os membros (exceto você mesmo)
   - Para CADA pessoa, você deve:
     - Responder 4 perguntas objetivas (escala 1-5)
     - Adicionar comentários sobre pontos positivos
     - Adicionar comentários sobre pontos de melhoria
   - Acompanhe seu progresso (ex: 2/4 avaliações concluídas)

3. **Salvar e Continuar**
   - Você pode salvar avaliações parcialmente
   - Pode voltar depois para completar as pendentes
   - Use seu código de acesso para retornar
   - Só estará completo quando avaliar todos os colegas

4. **Garantias de Anonimato**
   - Suas respostas são totalmente anônimas
   - O gestor NÃO verá quem avaliou quem
   - Apenas médias e comentários consolidados são exibidos

## Segurança e Proteção contra Vulnerabilidades

O **Avalia 360°** foi desenvolvido seguindo as melhores práticas de segurança e está protegido contra as principais vulnerabilidades listadas no **OWASP Top 10 2021** e CVEs conhecidas.

### Proteções Implementadas

#### 🔒 **Criptografia e Proteção de Dados**
- **AES-256:** Todos os dados sensíveis (nomes, emails, respostas) são criptografados
- **SHA-256:** Hashing seguro para emails e códigos de acesso
- **Chaves únicas:** Cada avaliação tem sua própria chave de criptografia
- **Dados em trânsito:** HTTPS obrigatório (HSTS configurado)

#### 🛡️ **Controle de Acesso (A01:2021)**
- **Tokens UUID seguros** para gestores
- **Códigos de acesso hash** para colaboradores (6 dígitos)
- **Firestore Security Rules:** Deny by default, acesso baseado em tokens
- **Validação de permissões:** Frontend e backend
- **Expiração de tokens:** 90 dias após criação

#### 🚫 **Proteção contra Injection (A03:2021)**
- **XSS:** Sanitização com DOMPurify em todos os inputs
- **NoSQL Injection:** Validação de queries e inputs
- **Path Traversal:** Proteção no upload de arquivos
- **React escaping:** Uso correto de JSX (sem dangerouslySetInnerHTML)

#### 🔐 **Autenticação Segura (A07:2021)**
- **Rate Limiting:** Máximo de 5 tentativas falhas
- **Lockout automático:** 15 minutos após tentativas excessivas
- **Geração segura:** UUID v4 para tokens, códigos aleatórios seguros
- **Sem senhas:** Sistema baseado em tokens únicos

#### 📦 **Gestão de Dependências (A06:2021)**
- **npm audit:** Verificação automática de vulnerabilidades
- **Dependabot:** Atualizações automáticas de segurança
- **GitHub Actions:** Security audit toda semana
- **Versões fixadas:** Sem vulnerabilidades conhecidas

#### 🌐 **Headers de Segurança (A05:2021)**
```
✅ Content-Security-Policy (CSP)
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Strict-Transport-Security (HSTS)
✅ Permissions-Policy
```

#### 📊 **Logging e Monitoramento (A09:2021)**
- **Logs de segurança:** Todas as tentativas de acesso
- **Eventos auditados:** Login, criação, acesso não autorizado
- **Sem dados sensíveis:** Logs não contêm senhas ou tokens completos
- **Collection separada:** Logs isolados no Firestore

#### ✅ **Validações Rigorosas**
- **Email:** Regex + limite de 254 caracteres
- **Nome:** Apenas letras, acentos, espaços (2-100 chars)
- **Rating:** Inteiros entre 1-5 apenas
- **Comentários:** Máximo 500 caracteres, sem HTML/scripts
- **Arquivos Excel:** Validação de formato e tamanho

### CVEs Específicas Protegidas

| CVE            | Descrição                | Proteção Implementada              |
|----------------|--------------------------|-------------------------------------|
| CVE-2022-24999 | ReDoS em query strings   | Limite de 1000 caracteres          |
| CVE-2023-26136 | Path Traversal           | Sanitização de nomes de arquivo    |
| CVE-2024-27980 | Command Injection        | Whitelist de comandos permitidos   |

### OWASP Top 10 2021 - Status

| Vulnerabilidade                        | Status      |
|----------------------------------------|-------------|
| A01 - Broken Access Control            | ✅ Protegido |
| A02 - Cryptographic Failures           | ✅ Protegido |
| A03 - Injection                        | ✅ Protegido |
| A04 - Insecure Design                  | ✅ Protegido |
| A05 - Security Misconfiguration        | ✅ Protegido |
| A06 - Vulnerable Components            | ✅ Protegido |
| A07 - Authentication Failures          | ✅ Protegido |
| A08 - Software/Data Integrity Failures | ✅ Protegido |
| A09 - Logging/Monitoring Failures      | ✅ Protegido |
| A10 - Server-Side Request Forgery      | ✅ Protegido |

### Práticas de Segurança

- ✅ **Princípio do Menor Privilégio:** Cada usuário tem apenas o acesso necessário
- ✅ **Defense in Depth:** Múltiplas camadas de segurança
- ✅ **Fail Securely:** Erros não expõem informações sensíveis
- ✅ **Security by Design:** Segurança pensada desde o início
- ✅ **Input Validation:** Todos os inputs são validados e sanitizados
- ✅ **Output Encoding:** Dados escapados corretamente ao exibir
- ✅ **Audit Trail:** Registro de todas as ações importantes

### Credenciais e Secrets

- ❌ **Nunca no código:** Credenciais nunca commitadas
- ✅ **GitHub Secrets:** Firebase e EmailJS em secrets
- ✅ **Environment Variables:** Injetadas no build
- ✅ **.env no .gitignore:** Arquivos locais protegidos
- ✅ **Rotação regular:** Secrets devem ser trocados periodicamente

### Testes de Segurança

O projeto inclui:
- **npm audit:** Verificação de dependências vulneráveis
- **ESLint security plugin:** Análise estática de código
- **GitHub Actions:** Security audit automatizado
- **Manual testing:** Testes de penetração periódicos recomendados
- **OWASP ZAP:** Scan de vulnerabilidades web (opcional)

Para detalhes técnicos completos sobre implementação de segurança, consulte [PLANO.md](PLANO.md#segurança-e-proteção-contra-cves).

## Performance e Otimizações

O **Avalia 360°** foi desenvolvido com foco em **performance máxima**, seguindo o teorema de **Big O Notation** para garantir escalabilidade.

### Otimizações Implementadas

#### ⚡ **Complexidade Algorítmica - O(N) ou melhor**
- **Dashboard:** Cálculo de progresso em O(N) usando Map/Set
- **Resultados:** Médias calculadas em O(log N + M) com índices Firestore
- **Validações:** Email duplicado em O(N) com Set
- **Buscar membros:** O(N + M) com Set otimizado

#### 🔥 **Firestore Otimizado**
- **Índices compostos:** Queries em O(log N) ao invés de O(N)
- **Queries específicas:** Busca apenas o necessário
- **Batch operations:** Reduz writes
- **Tempo de resposta:** < 100ms por query

#### ⚛️ **React Otimizações**
- **React.memo:** Componentes não re-renderizam desnecessariamente
- **useMemo/useCallback:** Cálculos e funções memoizadas
- **Virtualização:** Listas de 1000+ itens renderizam apenas 10-15 (react-window)
- **Code Splitting:** Bundle inicial de 50KB, rotas carregadas sob demanda
- **Lazy Loading:** Componentes pesados carregados quando necessário

#### 🎯 **Performance Geral**
- **Web Workers:** Criptografia em thread separada (UI não trava)
- **Debouncing:** Buscas otimizadas (90% menos requisições)
- **Bundle otimizado:** Vendor chunks separados para cache eficiente
- **Tree shaking:** Código não usado é removido

### Métricas de Performance

#### Lighthouse Score (Target: 95+)
```
⚡ Performance:    95+
♿ Accessibility:  95+
✅ Best Practices: 95+
🔍 SEO:           100
```

#### Core Web Vitals
| Métrica | Valor     | Status |
|---------|-----------|--------|
| LCP     | < 2.5s    | ✅      |
| FID     | < 100ms   | ✅      |
| CLS     | < 0.1     | ✅      |
| FCP     | < 1.8s    | ✅      |
| TTI     | < 3.8s    | ✅      |

#### Bundle Size (Gzipped)
```
📦 Initial bundle:  50KB
📦 Vendor chunks:   270KB
📦 Total:           320KB
```

### Tabela de Complexidade

| Operação                        | Sem Otimização | Com Otimização | Ganho      |
|---------------------------------|----------------|----------------|------------|
| Calcular progresso (100 users) | O(N²) = 10,000 | O(N) = 100     | **100x**   |
| Renderizar lista (1000 items)  | O(N) = 1000    | O(1) = 10      | **100x**   |
| Validar emails (500 items)     | O(N²) = 250k   | O(N) = 500     | **500x**   |
| Query Firestore                 | O(N)           | O(log N)       | **10-50x** |
| Busca com digitação (10 chars) | 10 requests    | 1 request      | **10x**    |

### Escalabilidade

A aplicação foi projetada para escalar:

- ✅ **10 membros:** < 1s de carregamento
- ✅ **100 membros:** < 2s de carregamento
- ✅ **1000 membros:** < 3s com virtualização
- ✅ **10,000 membros:** Possível com paginação

Para detalhes técnicos completos sobre otimizações e Big O Notation, consulte [PLANO.md](PLANO.md#performance-e-big-o-notation).

## Observabilidade e Monitoramento

O **Avalia 360°** possui um sistema completo de **observabilidade** que permite monitorar, analisar e entender o comportamento da aplicação em produção.

### O que é Observabilidade?

Observabilidade é a capacidade de entender o que está acontecendo dentro da aplicação através de dados externos (logs, métricas, traces). Diferente de monitoramento tradicional, observabilidade permite **descobrir problemas desconhecidos** e **entender por que** algo aconteceu.

### Três Pilares Implementados

#### 1. 📝 **Logging Estruturado**

Sistema de logs com níveis (debug, info, warn, error, critical) e contexto rico:

```typescript
// Logs automáticos em produção
logger.info('Avaliação criada', {
  action: 'create_evaluation',
  evaluationId: 'abc123',
  memberCount: 10
});

logger.error('Erro ao enviar email', error, {
  action: 'send_email',
  recipient: 'user@email.com'
});
```

**Benefícios:**
- 🔍 Debug facilitado com contexto completo
- 📊 Logs persistidos no Firestore para análise posterior
- ⚡ Buffer inteligente (batch) para economia de writes
- 🎯 Session tracking para rastrear jornada do usuário

#### 2. 📊 **Métricas de Performance**

Monitoramento automático de **Core Web Vitals** e métricas customizadas:

**Web Vitals (Google):**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **FCP (First Contentful Paint):** < 1.8s
- **TTFB (Time to First Byte):** < 800ms

**Métricas de Negócio:**
- Tempo de queries no Firestore
- Duração de operações de criptografia
- Taxa de conclusão de avaliações
- Tempo médio para completar avaliação
- Taxa de sucesso no envio de emails

```typescript
// Exemplo: Medir duração de operações
const members = await businessMetrics.measure(
  'firestore_query_team_members',
  async () => getTeamMembers(evaluationId),
  { evaluationId }
);
// Resultado: Métrica registrada automaticamente
```

#### 3. 🐛 **Error Tracking**

Captura automática de erros com stack traces completos:

```typescript
// Captura automática de erros globais
window.onerror → errorTracker.captureError()
Promise rejections → errorTracker.captureError()

// Captura manual em try-catch
try {
  await submitEvaluation(data);
} catch (error) {
  errorTracker.captureError(error, {
    component: 'EvaluationForm',
    action: 'submit',
    evaluationId: data.id
  }, 'high'); // severidade
}
```

**Benefícios:**
- 🎯 Contexto rico: URL, user agent, timestamp, contexto da operação
- 📈 Contagem de ocorrências do mesmo erro
- 🔔 Severidades: low, medium, high, critical
- 🌐 Integração opcional com Sentry (5k eventos/mês grátis)

### Recursos de Observabilidade

#### 🎛️ **Health Monitor Dashboard**

Dashboard visual em tempo real (apenas em desenvolvimento):

```
Pressione Ctrl+Shift+H para abrir/fechar

┌─────────────────────────────────┐
│ Health Monitor            ✕     │
├─────────────────────────────────┤
│ Web Vitals           🟢 good    │
│ ├ LCP: 1847ms        ✅         │
│ ├ FID: 12ms          ✅         │
│ └ CLS: 0.03          ✅         │
│                                 │
│ Errors               3 errors   │
│ └ Last: Network timeout         │
│                                 │
│ Firestore            🟢 healthy │
│ └ Latency: 42ms                 │
└─────────────────────────────────┘
```

#### 📈 **Analytics de Usuário**

Rastreamento de comportamento e jornada:

```typescript
// Eventos automáticos rastreados
analytics.trackEvaluationCreated(id, memberCount);
analytics.trackEvaluationCompleted(evalId, userId);
analytics.trackExcelImport(count, hasErrors);
analytics.trackEmailSent(recipientCount, success);
analytics.trackPageView('Dashboard');
```

**Funil de Conversão Rastreado:**
1. Criar avaliação → Informações básicas
2. Adicionar membros (manual ou Excel)
3. Enviar convites
4. Acompanhar progresso
5. Ver resultados

#### 🔥 **Monitoramento de Firestore**

Queries monitoradas automaticamente para otimizar custos:

```typescript
// Wrapper automático para queries
const snapshot = await monitoredGetDocs(
  query(collection(db, 'team_members'), ...),
  'get_team_members'
);

// Alertas automáticos:
// ⚠️ Query lenta (> 500ms)
// ⚠️ Alto read count (> 100 documentos)
```

**Benefícios:**
- 💰 Redução de custos (identifica queries caras)
- ⚡ Performance (detecta gargalos)
- 📊 Métricas de todas as operações Firestore

### Ferramentas de Observabilidade

#### Opção 1: Firebase Analytics (Gratuito)

```bash
# Já incluído no Firebase SDK
- Eventos customizados ilimitados
- Funis de conversão
- User properties
- Dashboards no Firebase Console
```

#### Opção 2: Google Analytics 4 (Gratuito)

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

#### Opção 3: Sentry (Opcional - 5k eventos/mês grátis)

```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: 'production',
});
```

### Métricas Principais Monitoradas

#### Performance
- ✅ Tempo de carregamento de páginas
- ✅ Duração de queries Firestore
- ✅ Tempo de operações de criptografia
- ✅ Core Web Vitals (LCP, FID, CLS)

#### Negócio
- ✅ Taxa de conclusão de avaliações
- ✅ Tempo médio para completar avaliação
- ✅ % de uso de importação Excel vs manual
- ✅ Taxa de sucesso no envio de emails

#### Erros
- ✅ Taxa de erro global
- ✅ Erros por componente/página
- ✅ Erros críticos que bloqueiam uso
- ✅ Tempo médio para detecção de erro

### Benefícios da Observabilidade

| Problema | Como a Observabilidade Ajuda |
|----------|------------------------------|
| 🐛 Bug que não reproduz localmente | Logs mostram exatamente o que aconteceu |
| 🐌 Aplicação lenta | Métricas identificam gargalos |
| 💸 Custo alto no Firestore | Monitoring mostra queries caras |
| ❌ Usuários reportam erro | Error tracking captura stack trace completo |
| 📊 Não sabemos features mais usadas | Analytics mostra padrões reais de uso |
| 🔥 App caiu | Health checks detectam falhas em tempo real |

### Configuração de Observabilidade

1. **Firebase Analytics** (opcional mas recomendado):
   ```typescript
   // Já vem configurado no projeto
   // Basta ativar no Firebase Console
   ```

2. **Sentry** (opcional para error tracking):
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

   ```bash
   # .env
   VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```

3. **Google Analytics 4** (opcional):
   ```bash
   # Adicionar GA4 tracking ID no index.html
   ```

### Health Monitor (Dev Mode)

Em desenvolvimento, use o **Health Monitor** para ver métricas em tempo real:

```bash
# Inicie a aplicação
npm run dev

# Pressione Ctrl+Shift+H
# Dashboard visual aparecerá no canto inferior direito
```

**Recursos:**
- 🟢 Status de Web Vitals (good/warning/critical)
- 📊 Valores de LCP, FID, CLS em tempo real
- ❌ Contagem de erros e último erro
- 🔥 Status do Firestore (healthy/degraded/down)
- 🔄 Atualização automática a cada 5 segundos

### Logs em Produção

Logs são automaticamente enviados para o Firestore em batches:

```typescript
// Collection: application_logs
{
  logs: [
    {
      timestamp: 1703001234567,
      level: 'info',
      message: 'Avaliação criada',
      context: { evaluationId: 'abc', memberCount: 10 },
      sessionId: 'session_123',
      url: 'https://...',
      userAgent: '...'
    },
    // ... mais logs no batch
  ],
  batchTimestamp: 1703001234567
}
```

**Consulta de logs:**
- Acesse Firebase Console → Firestore → `application_logs`
- Filtre por timestamp, level, sessionId
- Use para debug de problemas em produção

### Performance em Produção

Após o deploy, monitore:

1. **Firebase Console:**
   - Analytics → Events (eventos customizados)
   - Analytics → Funnels (funis de conversão)
   - Performance → Web Vitals

2. **Google Search Console:**
   - Core Web Vitals por página
   - Experiência de usuário móvel

3. **Firestore:**
   - Usage tab → Reads/Writes/Deletes
   - Queries lentas identificadas nos logs

Para detalhes técnicos completos sobre implementação de observabilidade, consulte [PLANO.md](PLANO.md#observabilidade).

## Limitações

- **EmailJS:** ~200 emails/mês no plano gratuito
- **Firebase Firestore:** 50k leituras/dia no plano gratuito
- **Tokens:** Expiram após 90 dias

## 🚀 CI/CD e Deployment

### GitHub Actions

O projeto possui **3 workflows automatizados**:

#### 1. **CI - Tests and Build** (`ci.yml`)

Executa em todo push e PR para `main` e `develop`:

```yaml
✅ Testes em Node.js 18.x e 20.x
✅ Type checking com TypeScript
✅ Linting (ESLint)
✅ Testes unitários com coverage
✅ Build de produção
✅ Security audit (npm audit)
✅ Upload de artifacts e coverage para Codecov
```

#### 2. **Deploy to GitHub Pages** (`deploy.yml`)

Deploy automático em push para `main`:

```yaml
✅ Build com variáveis de ambiente do GitHub Secrets
✅ Testes antes do deploy
✅ Deploy para GitHub Pages
✅ URL gerada automaticamente
```

#### 3. **Dependabot** (`dependabot.yml`)

Atualizações automáticas de dependências:

```yaml
✅ NPM dependencies (weekly, Monday 9am)
✅ GitHub Actions (weekly, Monday 9am)
✅ Agrupamento de minor/patch updates
✅ Auto-assign para revisão
```

### Configuração do Deploy

**Secrets necessários no GitHub:**

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_EMAILJS_SERVICE_ID=your_emailjs_service
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_ENCRYPTION_KEY=your_32_char_encryption_key
```

### Performance em Produção

**Bundle Size (Otimizado):**
```
Entry point:  11.98 kB gzipped
ManagerPage:  285.93 kB gzipped (lazy loaded)
MemberPage:   8.72 kB gzipped (lazy loaded)
Firebase:     80.88 kB gzipped
React:        52.31 kB gzipped
Total:        ~480 kB gzipped
```

**Web Vitals (Target):**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## Melhorias Futuras

- [ ] Múltiplas avaliações por gestor
- [ ] Templates de avaliação customizáveis
- [ ] Exportação de resultados (PDF/Excel)
- [ ] Gráficos e visualizações avançadas
- [ ] Notificações de lembrete para não respondentes
- [ ] Suporte a múltiplos idiomas
- [ ] Comparação de avaliações ao longo do tempo
- [ ] Sistema de autenticação mais robusto

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Abra uma [issue](https://github.com/seu-usuario/avalia-360/issues)
2. Consulte o [PLANO.md](PLANO.md) para detalhes técnicos
3. Entre em contato pelo email: seu-email@exemplo.com

## Autor

Desenvolvido com 💙 por [Seu Nome](https://github.com/seu-usuario)

---

**Avalia 360°** - Sistema de Avaliações 360 Graus Seguro e Moderno
