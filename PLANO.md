# 📋 Plano de Implementação - Sistema de Avaliação 360°

## Visão Geral

Sistema web para avaliações 360 graus onde gestores podem criar avaliações, convidar equipes e acompanhar resultados de forma segura e criptografada.

### ⚠️ Conceito Fundamental: Avaliação 360°

Em uma **avaliação 360 graus**, **TODOS os membros da equipe avaliam TODOS os outros membros**. Não é apenas "um colaborador avalia outro", mas sim:

- **Cada pessoa avalia todas as outras** (exceto ela mesma)
- Em uma equipe de 5 pessoas: 5 × 4 = **20 avaliações no total**
- Cada pessoa **recebe** 4 avaliações (feedback de todos os colegas)
- Cada pessoa **faz** 4 avaliações (avalia todos os colegas)

**Exemplo Prático:**
```
Equipe: João, Maria, Pedro, Ana, Carlos

João avalia → Maria, Pedro, Ana, Carlos
Maria avalia → João, Pedro, Ana, Carlos
Pedro avalia → João, Maria, Ana, Carlos
Ana avalia → João, Maria, Pedro, Carlos
Carlos avalia → João, Maria, Pedro, Ana

Resultado por pessoa:
- João recebe 4 feedbacks (de Maria, Pedro, Ana, Carlos)
- Maria recebe 4 feedbacks (de João, Pedro, Ana, Carlos)
- etc...
```

Isso proporciona uma visão **multidimensional** e **completa** do desempenho de cada membro da equipe.

## Arquitetura Geral

```
┌─────────────────┐
│  React App      │
│  (GitHub Pages) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Firebase│ │EmailJS│
│/Supabase│ │ API   │
└────────┘ └───────┘
```

## Estrutura de Dados

### Tabela: avaliations

| Campo          | Tipo      | Descrição                              |
|----------------|-----------|----------------------------------------|
| id             | UUID      | Identificador único                    |
| creator_email  | string    | Email do gestor (hash)                 |
| creator_token  | string    | Token de acesso do gestor (encrypted)  |
| title          | string    | Título da avaliação (encrypted)        |
| created_at     | timestamp | Data de criação                        |
| status         | enum      | 'draft', 'active', 'completed'         |

### Tabela: team_members

| Campo                  | Tipo      | Descrição                              |
|------------------------|-----------|----------------------------------------|
| id                     | UUID      | Identificador único                    |
| avaliation_id          | FK        | Referência à avaliação                 |
| name                   | string    | Nome do colaborador (encrypted)        |
| email                  | string    | Email do colaborador (hashed)          |
| access_code            | string    | Código de acesso (hash)                |
| completed_evaluations  | integer   | Número de avaliações completadas       |
| total_evaluations      | integer   | Total de avaliações que precisa fazer  |
| last_access_date       | timestamp | Data do último acesso                  |

### Tabela: responses

| Campo               | Tipo      | Descrição                                    |
|---------------------|-----------|----------------------------------------------|
| id                  | UUID      | Identificador único                          |
| avaliation_id       | FK        | Referência à avaliação                       |
| evaluator_id        | FK        | Quem está avaliando (team_member_id)         |
| evaluated_id        | FK        | Quem está sendo avaliado (team_member_id)    |
| question_1          | integer   | Satisfação (1-5, encrypted)                  |
| question_2          | integer   | Proatividade (1-5, encrypted)                |
| question_3          | integer   | Qualidade (1-5, encrypted)                   |
| question_4          | integer   | Trabalho em equipe (1-5, encrypted)          |
| positive_points     | text      | Comentários positivos (encrypted)            |
| improvement_points  | text      | Pontos de melhoria (encrypted)               |
| created_at          | timestamp | Data da resposta                             |

**Conceito Importante:** Em uma avaliação 360°, **todos avaliam todos**. Se a equipe tem 5 pessoas, cada pessoa fará 4 avaliações (todos exceto ela mesma). Total de respostas = N × (N-1), onde N é o número de membros.

## Fluxos Principais

### 1. Criação de Avaliação (Gestor)

```
1. Gestor acessa /criar-avaliacao
2. Preenche título da avaliação
3. Adiciona membros da equipe (DUAS OPÇÕES):

   OPÇÃO A - Manual:
   - Clica em "Adicionar Membro"
   - Preenche nome e email de cada membro
   - Repete até adicionar todos

   OPÇÃO B - Upload de Excel:
   - Clica em "Baixar Template Excel"
   - Preenche o template (colunas: Nome | Email)
   - Faz upload do arquivo preenchido
   - Sistema valida e importa todos os membros

4. Sistema valida:
   - Emails duplicados
   - Formato de email válido
   - Mínimo de 2 membros

5. Sistema gera:
   - Token único do gestor (para acesso futuro)
   - Código de acesso único por membro
   - Calcula total de avaliações: N × (N-1)

6. Dados são criptografados e salvos

7. Emails são enviados para TODOS os membros via EmailJS

8. Gestor recebe link de acompanhamento
```

### 2. Resposta de Avaliação (Colaborador) - Avaliação 360°

```
1. Colaborador clica no link do email
2. Insere código de acesso
3. Sistema mostra lista de TODOS os outros membros da equipe
4. Colaborador avalia CADA membro individualmente:
   a. Seleciona um membro para avaliar
   b. Responde as 5 perguntas sobre aquele membro
   c. Salva a avaliação
   d. Repete para cada membro da equipe (exceto ele mesmo)
5. Progresso é atualizado (ex: 2/4 avaliações concluídas)
6. Quando todas as avaliações são completadas, status é "completo"
```

**Exemplo:** Em uma equipe de 5 pessoas, João precisa avaliar:
- Maria
- Pedro
- Ana
- Carlos

Total: 4 avaliações. João verá uma interface que permite avaliar cada pessoa separadamente.

### 3. Acompanhamento (Gestor)

```
1. Gestor acessa com seu token
2. Visualiza dashboard com:
   - Progresso geral (ex: 15/20 avaliações concluídas)
   - Progresso por pessoa:
     * João: 4/4 avaliações ✅ Completo
     * Maria: 3/4 avaliações ⏳ Pendente
     * Pedro: 2/4 avaliações ⏳ Pendente
     * Ana: 4/4 avaliações ✅ Completo
     * Carlos: 2/4 avaliações ⏳ Pendente
3. Quando TODOS completarem todas as avaliações:
   - Acessa resultados consolidados
   - Vê resultados POR PESSOA avaliada:
     * João recebeu 4 avaliações (de Maria, Pedro, Ana, Carlos)
     * Média das notas de João
     * Comentários sobre João (anônimos)
```

## Estrutura de Pastas

```
src/
├── components/
│   ├── gestor/
│   │   ├── CreateAvaliation.tsx       # Formulário de criação
│   │   ├── TeamMemberForm.tsx         # Adicionar membros manualmente
│   │   ├── ExcelUpload.tsx            # Upload de Excel
│   │   ├── ExcelTemplateDownload.tsx  # Botão download template
│   │   ├── MembersList.tsx            # Lista de membros adicionados
│   │   ├── Dashboard.tsx              # Progresso de todos
│   │   ├── MemberProgress.tsx         # Progresso individual
│   │   ├── Results.tsx                # Resultados consolidados
│   │   └── PersonResults.tsx          # Resultados por pessoa
│   ├── colaborador/
│   │   ├── AccessForm.tsx             # Form de código de acesso
│   │   ├── TeamMembersList.tsx        # Lista de membros a avaliar
│   │   ├── EvaluationForm.tsx         # Form de avaliação (1 pessoa)
│   │   ├── ProgressTracker.tsx        # Progresso das avaliações
│   │   └── SuccessMessage.tsx         # Mensagem de conclusão
│   └── shared/
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── Loading.tsx
│       └── ProgressBar.tsx            # Barra de progresso
├── services/
│   ├── firebase.ts                    # Configuração Firebase
│   ├── encryption.ts                  # Criptografia (CryptoJS)
│   ├── emailjs.ts                     # Envio de emails
│   └── avaliation.ts                  # Lógica de negócio
├── hooks/
│   ├── useAvaliation.ts               # Hook de avaliações
│   ├── useAuth.ts                     # Hook de autenticação
│   └── useEvaluationProgress.ts       # Hook de progresso
├── types/
│   └── index.ts                       # TypeScript interfaces
├── utils/
│   ├── generateCode.ts                # Gerar códigos únicos
│   ├── validators.ts                  # Validações
│   ├── calculateProgress.ts           # Calcular progresso
│   ├── excelParser.ts                 # Processar arquivo Excel
│   └── excelTemplate.ts               # Gerar template Excel
├── pages/
│   ├── Home.tsx                       # Página inicial
│   ├── CreateAvaliation.tsx           # Criar avaliação
│   ├── RespondAvaliation.tsx          # Responder avaliações
│   ├── Dashboard.tsx                  # Dashboard do gestor
│   └── Results.tsx                    # Resultados finais
└── App.tsx
```

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Roteamento:** React Router v6
- **UI:** Tailwind CSS + shadcn/ui
- **Ícones:** Lucide React (ícones modernos e profissionais)
- **Gráficos:** Recharts ou Chart.js (visualização de dados)
- **Animações:** Framer Motion (transições suaves)
- **Formulários:** React Hook Form + Zod
- **Estado:** Context API ou Zustand
- **Banco de Dados:** Firebase Firestore ou Supabase
- **Emails:** EmailJS
- **Criptografia:** crypto-js (AES-256)
- **Excel:** xlsx (SheetJS) para leitura e geração de arquivos Excel
- **Virtualização:** react-window ou react-virtual (listas longas)
- **Deploy:** GitHub Pages

## Performance e Big O Notation

### Princípios de Performance

A aplicação deve ser **extremamente performática**, seguindo o teorema de Big O Notation para todas as operações críticas. Nenhuma operação deve degradar a experiência do usuário.

### Análise de Complexidade - Operações Principais

#### **1. Dashboard do Gestor - Progresso de Membros**

**Cenário:** Exibir progresso de N membros

```typescript
// ❌ MAU - O(N²) - Loop dentro de loop
const calculateProgressBad = (members: TeamMember[]): Progress[] => {
  return members.map(member => {
    let completed = 0;

    // Para cada membro, busca TODAS as respostas (N queries)
    responses.forEach(response => {
      if (response.evaluator_id === member.id) {
        completed++;
      }
    });

    return { member, completed };
  });
  // Complexidade: O(N²) - Inaceitável para N > 100
};

// ✅ BOM - O(N) - Um único loop
const calculateProgressGood = (members: TeamMember[]): Progress[] => {
  // 1. Criar mapa de contadores O(N)
  const progressMap = new Map<string, number>();

  // 2. Popular mapa em uma única iteração O(N)
  responses.forEach(response => {
    const count = progressMap.get(response.evaluator_id) || 0;
    progressMap.set(response.evaluator_id, count + 1);
  });

  // 3. Mapear resultados O(N)
  return members.map(member => ({
    member,
    completed: progressMap.get(member.id) || 0,
    total: members.length - 1 // Não avalia a si mesmo
  }));
  // Complexidade: O(N) - Ótimo!
};
```

**Complexidade Final:** O(N) onde N = número de membros

#### **2. Resultados Por Pessoa - Calcular Médias**

**Cenário:** Calcular média de avaliações recebidas por uma pessoa

```typescript
// ❌ MAU - O(N × M) - Busca não otimizada
const calculateAveragesBad = (personId: string): Averages => {
  const allResponses = getAllResponses(); // Busca TUDO
  const personResponses = allResponses.filter(r => r.evaluated_id === personId);

  // Múltiplas iterações desnecessárias
  const q1Avg = personResponses.reduce((acc, r) => acc + r.question_1, 0) / personResponses.length;
  const q2Avg = personResponses.reduce((acc, r) => acc + r.question_2, 0) / personResponses.length;
  const q3Avg = personResponses.reduce((acc, r) => acc + r.question_3, 0) / personResponses.length;
  const q4Avg = personResponses.reduce((acc, r) => acc + r.question_4, 0) / personResponses.length;

  return { q1Avg, q2Avg, q3Avg, q4Avg };
  // Complexidade: O(N × M) + 4 × O(M) - Muito ruim!
};

// ✅ BOM - O(N) - Uma única iteração
const calculateAveragesGood = (personId: string): Averages => {
  // Busca indexada no Firestore - O(log N)
  const personResponses = getResponsesByEvaluatedId(personId);

  // Uma única iteração calculando todas as médias
  const sums = { q1: 0, q2: 0, q3: 0, q4: 0 };
  const count = personResponses.length;

  personResponses.forEach(response => {
    sums.q1 += response.question_1;
    sums.q2 += response.question_2;
    sums.q3 += response.question_3;
    sums.q4 += response.question_4;
  });

  return {
    q1Avg: sums.q1 / count,
    q2Avg: sums.q2 / count,
    q3Avg: sums.q3 / count,
    q4Avg: sums.q4 / count
  };
  // Complexidade: O(log N) + O(M) onde M = respostas da pessoa
};
```

**Complexidade Final:** O(log N + M) com índices Firestore

#### **3. Validação de Email Duplicado (Excel Import)**

**Cenário:** Verificar se há emails duplicados em lista de N membros

```typescript
// ❌ MAU - O(N²) - Comparação de cada com cada
const hasDuplicateEmailsBad = (members: Member[]): boolean => {
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      if (members[i].email === members[j].email) {
        return true;
      }
    }
  }
  return false;
  // Complexidade: O(N²) - Impraticável para N > 1000
};

// ✅ BOM - O(N) - Usando Set
const hasDuplicateEmailsGood = (members: Member[]): boolean => {
  const emails = new Set<string>();

  for (const member of members) {
    if (emails.has(member.email)) {
      return true; // Encontrou duplicado - retorna imediatamente
    }
    emails.add(member.email);
  }

  return false;
  // Complexidade: O(N) - Ótimo!
};
```

**Complexidade Final:** O(N) usando Set

#### **4. Buscar Membros a Avaliar (Colaborador)**

**Cenário:** Listar membros que o colaborador ainda não avaliou

```typescript
// ❌ MAU - O(N × M) - Loops aninhados
const getMembersToEvaluateBad = (
  evaluatorId: string,
  allMembers: Member[]
): Member[] => {
  const myResponses = getAllResponses().filter(r => r.evaluator_id === evaluatorId);

  return allMembers.filter(member => {
    if (member.id === evaluatorId) return false; // Não avalia a si mesmo

    // Busca linear dentro de filter - O(M) para cada membro
    return !myResponses.some(r => r.evaluated_id === member.id);
  });
  // Complexidade: O(N × M) - Péssimo!
};

// ✅ BOM - O(N + M) - Usando Set
const getMembersToEvaluateGood = (
  evaluatorId: string,
  allMembers: Member[]
): Member[] => {
  // Busca indexada - O(log N)
  const myResponses = getResponsesByEvaluatorId(evaluatorId);

  // Criar Set de IDs avaliados - O(M)
  const evaluatedIds = new Set(myResponses.map(r => r.evaluated_id));

  // Filtrar em O(N)
  return allMembers.filter(member =>
    member.id !== evaluatorId && !evaluatedIds.has(member.id)
  );
  // Complexidade: O(log N + M + N) = O(N + M) - Excelente!
};
```

**Complexidade Final:** O(N + M) com índices

### Otimizações de Firestore

#### **Índices Compostos Necessários**

```javascript
// Firestore Console > Indexes

// 1. Buscar respostas por avaliador
{
  collectionGroup: "responses",
  fields: [
    { fieldPath: "avaliation_id", order: "ASCENDING" },
    { fieldPath: "evaluator_id", order: "ASCENDING" }
  ]
}

// 2. Buscar respostas por avaliado
{
  collectionGroup: "responses",
  fields: [
    { fieldPath: "avaliation_id", order: "ASCENDING" },
    { fieldPath: "evaluated_id", order: "ASCENDING" }
  ]
}

// 3. Buscar membros por avaliação
{
  collectionGroup: "team_members",
  fields: [
    { fieldPath: "avaliation_id", order: "ASCENDING" },
    { fieldPath: "completed_evaluations", order: "DESCENDING" }
  ]
}

// Com índices: O(log N) para buscas
// Sem índices: O(N) para buscas - Inaceitável!
```

#### **Queries Otimizadas**

```typescript
// ✅ Query com índice - O(log N)
const getResponsesByEvaluator = async (
  avaliationId: string,
  evaluatorId: string
): Promise<Response[]> => {
  const q = query(
    collection(db, 'responses'),
    where('avaliation_id', '==', avaliationId),
    where('evaluator_id', '==', evaluatorId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Response);
  // Firestore usa índice: O(log N)
};

// ❌ Query sem índice - O(N)
const getResponsesByEvaluatorBad = async (
  avaliationId: string,
  evaluatorId: string
): Promise<Response[]> => {
  // Busca TUDO e filtra no cliente
  const snapshot = await getDocs(collection(db, 'responses'));
  return snapshot.docs
    .map(doc => doc.data() as Response)
    .filter(r => r.avaliation_id === avaliationId && r.evaluator_id === evaluatorId);
  // Sem índice: O(N) - Terrível para grandes datasets!
};
```

### Otimizações de React

#### **1. Memoization com React.memo e useMemo**

```typescript
// ✅ Componente memorizado - Não re-renderiza desnecessariamente
export const MemberProgressCard = React.memo(({ member, progress }: Props) => {
  // Cálculo pesado memorizado
  const progressPercentage = useMemo(() => {
    return (progress.completed / progress.total) * 100;
  }, [progress.completed, progress.total]);

  return (
    <Card>
      <h3>{member.name}</h3>
      <ProgressBar value={progressPercentage} />
    </Card>
  );
});

// ❌ Sem memo - Re-renderiza toda vez que pai atualiza
export const MemberProgressCardBad = ({ member, progress }: Props) => {
  // Recalcula toda vez
  const progressPercentage = (progress.completed / progress.total) * 100;

  return <Card>...</Card>;
};
```

#### **2. Virtualização de Listas Longas**

```typescript
// ✅ Lista virtualizada - Renderiza apenas itens visíveis
import { FixedSizeList } from 'react-window';

export const MembersList = ({ members }: { members: Member[] }) => {
  // Só renderiza ~10 itens visíveis, não todos os 1000
  return (
    <FixedSizeList
      height={600}
      itemCount={members.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MemberCard member={members[index]} />
        </div>
      )}
    </FixedSizeList>
  );
  // Complexidade: O(1) - Constante! Renderiza ~10 itens
};

// ❌ Lista normal - Renderiza TODOS os itens
export const MembersListBad = ({ members }: { members: Member[] }) => {
  return (
    <div>
      {members.map(member => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
  // Complexidade: O(N) - Renderiza 1000 componentes!
  // DOM nodes: 1000+ elementos - Muito lento!
};
```

**Com virtualização:**
- N = 1000 membros
- Renderiza apenas 10-15 itens visíveis
- Performance: **100x melhor**

#### **3. Code Splitting e Lazy Loading**

```typescript
// ✅ Carregamento lazy - Bundle menor
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Results = lazy(() => import('./pages/Results'));
const CreateAvaliation = lazy(() => import('./pages/CreateAvaliation'));

export const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard/:token" element={<Dashboard />} />
        <Route path="/results/:token" element={<Results />} />
        <Route path="/create" element={<CreateAvaliation />} />
      </Routes>
    </Suspense>
  );
};

// Resultado:
// - Bundle inicial: 50KB (só Home)
// - Dashboard carrega sob demanda: +30KB
// - Results carrega sob demanda: +25KB
// Total inicial: 50KB vs 105KB (53% menor!)
```

#### **4. Debouncing de Buscas**

```typescript
// ✅ Debounce - Evita múltiplas requisições
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

export const SearchMembers = () => {
  const [query, setQuery] = useState('');

  // Debounce de 300ms - Só busca após parar de digitar
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (searchQuery.length < 3) return;

      const results = await searchMembersInFirestore(searchQuery);
      setResults(results);
    }, 300),
    []
  );

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return <input value={query} onChange={handleSearch} />;
};

// Sem debounce: 10 caracteres = 10 requisições
// Com debounce: 10 caracteres = 1 requisição
// Performance: 90% menos requisições!
```

### Otimizações de Criptografia

```typescript
// ✅ Web Worker para operações pesadas
// crypto.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, data, key } = e.data;

  if (type === 'encrypt') {
    // Criptografia roda em thread separada
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();
    self.postMessage({ type: 'encrypted', data: encrypted });
  }
};

// Uso no componente
const useCryptoWorker = () => {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('./crypto.worker.ts', import.meta.url));
    return () => workerRef.current?.terminate();
  }, []);

  const encryptAsync = (data: string, key: string): Promise<string> => {
    return new Promise((resolve) => {
      workerRef.current!.onmessage = (e) => {
        resolve(e.data.data);
      };
      workerRef.current!.postMessage({ type: 'encrypt', data, key });
    });
  };

  return { encryptAsync };
};

// Benefício: UI não trava durante criptografia pesada
// 100 registros: 0ms UI block vs 500ms block
```

### Otimizações de Bundle

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar libs grandes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore'],
          'vendor-crypto': ['crypto-js'],
          'vendor-charts': ['recharts'],
          'vendor-excel': ['xlsx']
        }
      }
    },
    // Minificação com terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
        drop_debugger: true
      }
    }
  },

  // Otimizações de DEV
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/firestore']
  }
});

// Resultado:
// - vendor-react.js: 150KB
// - vendor-firebase.js: 80KB
// - vendor-crypto.js: 40KB
// - app.js: 50KB
// Cache eficiente: Vendors só baixam 1x
```

### Tabela de Complexidade - Operações Críticas

| Operação                          | Complexidade | Otimização             |
|-----------------------------------|--------------|------------------------|
| Calcular progresso (N membros)   | O(N)         | Map + Set              |
| Calcular médias por pessoa        | O(log N + M) | Índices Firestore      |
| Validar emails duplicados         | O(N)         | Set                    |
| Buscar membros a avaliar          | O(N + M)     | Set + índices          |
| Renderizar lista de 1000 membros  | O(1)         | Virtualização          |
| Busca no Firestore                | O(log N)     | Índices compostos      |
| Criptografar N registros          | O(N)         | Web Worker (parallel)  |
| Re-render de componentes          | O(1)         | React.memo + useMemo   |
| Busca com digitação               | O(1)         | Debounce (300ms)       |

### Métricas de Performance Esperadas

#### **Lighthouse Score (Target: 90+)**
```
Performance:    95+ ⚡
Accessibility:  95+
Best Practices: 95+
SEO:           100
```

#### **Core Web Vitals**
```
LCP (Largest Contentful Paint):  < 2.5s  ✅
FID (First Input Delay):          < 100ms ✅
CLS (Cumulative Layout Shift):    < 0.1   ✅
FCP (First Contentful Paint):     < 1.8s  ✅
TTI (Time to Interactive):        < 3.8s  ✅
```

#### **Bundle Size (Gzipped)**
```
Initial bundle:     50KB  ✅
Vendor chunks:     270KB  ✅
Total:             320KB  ✅
Total de libs: react, firebase, crypto, charts, excel
```

#### **Operações de Banco (Firestore)**
```
Reads por página:        < 50  ✅
Writes por avaliação:    < 20  ✅
Queries com índices:     100%  ✅
Tempo médio de query:    < 100ms ✅
```

### Checklist de Performance

- [ ] **Complexidade Algorítmica:**
  - [ ] Todas as operações O(N) ou melhor
  - [ ] Nenhum O(N²) em código crítico
  - [ ] Uso de Map/Set para lookups O(1)

- [ ] **Firestore:**
  - [ ] Índices compostos criados
  - [ ] Queries otimizadas
  - [ ] Paginação implementada
  - [ ] Batch operations quando possível

- [ ] **React:**
  - [ ] React.memo em componentes pesados
  - [ ] useMemo para cálculos complexos
  - [ ] useCallback para funções
  - [ ] Virtualização em listas > 50 itens

- [ ] **Bundle:**
  - [ ] Code splitting implementado
  - [ ] Lazy loading de rotas
  - [ ] Chunks separados por vendor
  - [ ] Tree shaking configurado

- [ ] **Otimizações Gerais:**
  - [ ] Web Workers para criptografia
  - [ ] Debounce em buscas
  - [ ] Throttle em scroll events
  - [ ] Image lazy loading
  - [ ] Fonts otimizadas

- [ ] **Métricas:**
  - [ ] Lighthouse score > 90
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
  - [ ] Bundle < 350KB

## Resiliência de Serviços

### Princípios de Resiliência

A aplicação deve ser **altamente resiliente**, continuando a funcionar mesmo quando serviços externos falham ou estão instáveis. Implementar padrões de tolerância a falhas é essencial para uma boa experiência do usuário.

### Estratégias de Resiliência Implementadas

#### **1. Retry Logic com Exponential Backoff**

```typescript
// utils/retry.ts
interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

/**
 * Executa uma função com retry automático e exponential backoff
 * Complexidade: O(1) por tentativa
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = ['unavailable', 'deadline-exceeded', 'network-error']
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Não fazer retry se não for erro recuperável
      if (!isRetryableError(error, retryableErrors)) {
        throw error;
      }

      // Última tentativa - não espera
      if (attempt === maxAttempts) {
        break;
      }

      // Log da tentativa
      console.warn(`Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`, error.message);

      // Espera com exponential backoff
      await sleep(delay);

      // Aumenta o delay para próxima tentativa
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
}

const isRetryableError = (error: any, retryableErrors: string[]): boolean => {
  const errorCode = error?.code || error?.message?.toLowerCase() || '';
  return retryableErrors.some(code => errorCode.includes(code));
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Exemplo de uso
const saveToFirestore = async (data: any) => {
  return withRetry(
    async () => {
      const docRef = await addDoc(collection(db, 'responses'), data);
      return docRef;
    },
    {
      maxAttempts: 3,
      initialDelay: 1000,
      retryableErrors: ['unavailable', 'deadline-exceeded']
    }
  );
};
```

**Cenários cobertos:**
- Falha temporária de rede
- Firestore indisponível momentaneamente
- Timeout de requisição
- Rate limiting temporário

**Resultado:**
- 1ª tentativa falha → espera 1s
- 2ª tentativa falha → espera 2s
- 3ª tentativa falha → lança erro
- **Taxa de sucesso: +95%** em condições de rede instável

#### **2. Circuit Breaker Pattern**

```typescript
// utils/circuitBreaker.ts
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal - permite requisições
  OPEN = 'OPEN',         // Falhou muito - bloqueia requisições
  HALF_OPEN = 'HALF_OPEN' // Testando - permite algumas requisições
}

interface CircuitBreakerOptions {
  failureThreshold?: number;    // Falhas para abrir circuito
  successThreshold?: number;    // Sucessos para fechar circuito
  timeout?: number;             // Tempo para tentar novamente (ms)
  monitoringPeriod?: number;    // Período de monitoramento (ms)
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private options: Required<CircuitBreakerOptions>;

  constructor(
    private serviceName: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      timeout: options.timeout ?? 60000, // 1 minuto
      monitoringPeriod: options.monitoringPeriod ?? 10000 // 10 segundos
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Verifica estado do circuito
    if (this.state === CircuitState.OPEN) {
      // Verifica se já passou o timeout
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        console.info(`Circuit breaker for ${this.serviceName}: HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.info(`Circuit breaker for ${this.serviceName}: CLOSED (recovered)`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      console.error(`Circuit breaker for ${this.serviceName}: OPEN (half-open failed)`);
    }

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.error(`Circuit breaker for ${this.serviceName}: OPEN (threshold reached)`);
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.options.timeout
    );
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Instâncias de Circuit Breaker por serviço
export const firestoreCircuitBreaker = new CircuitBreaker('Firestore', {
  failureThreshold: 5,
  timeout: 60000 // 1 minuto
});

export const emailJSCircuitBreaker = new CircuitBreaker('EmailJS', {
  failureThreshold: 3,
  timeout: 120000 // 2 minutos
});

// Exemplo de uso
const sendEmailWithResilience = async (emailData: EmailData) => {
  return emailJSCircuitBreaker.execute(async () => {
    return withRetry(
      () => emailjs.send(serviceId, templateId, emailData),
      { maxAttempts: 3 }
    );
  });
};
```

**Benefícios:**
- Protege o sistema de sobrecarga
- Falha rápido quando serviço está down
- Recuperação automática quando serviço volta
- **Reduz latência em 90%** durante outages

#### **3. Timeout Configuration**

```typescript
// utils/timeout.ts
/**
 * Executa função com timeout
 * Se exceder tempo, lança TimeoutError
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operationName?: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout: ${operationName || 'Operation'} exceeded ${timeoutMs}ms`)),
        timeoutMs
      )
    )
  ]);
}

// Configuração de timeouts por operação
export const TIMEOUTS = {
  FIRESTORE_READ: 5000,      // 5s para leitura
  FIRESTORE_WRITE: 10000,    // 10s para escrita
  EMAIL_SEND: 15000,         // 15s para envio de email
  FILE_UPLOAD: 30000,        // 30s para upload de arquivo
  ENCRYPTION: 5000           // 5s para criptografia
};

// Exemplo de uso
const getResponsesWithTimeout = async (avaliationId: string) => {
  return withTimeout(
    () => getResponsesByAvaliationId(avaliationId),
    TIMEOUTS.FIRESTORE_READ,
    'Firestore read responses'
  );
};
```

#### **4. Fallback Strategies**

```typescript
// utils/fallback.ts
/**
 * Tenta executar função primária, se falhar usa fallback
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T,
  fallbackName?: string
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    console.warn(`Primary operation failed, using fallback: ${fallbackName}`, error);
    return await fallback();
  }
}

// Exemplo: Salvar localmente se Firestore falhar
const saveResponseWithFallback = async (response: Response) => {
  return withFallback(
    // Primary: Salvar no Firestore
    async () => {
      const docRef = await saveToFirestore(response);
      return docRef.id;
    },
    // Fallback: Salvar no LocalStorage
    () => {
      const id = generateTempId();
      saveToLocalStorage(`pending_response_${id}`, response);
      queueForLaterSync(response); // Sincroniza depois
      return id;
    },
    'Save to LocalStorage'
  );
};

// Exemplo: Cache para dados que não mudam frequentemente
const getTeamMembersWithCache = async (avaliationId: string) => {
  return withFallback(
    // Primary: Buscar do Firestore
    async () => {
      const members = await getTeamMembers(avaliationId);
      // Salvar no cache
      cacheSet(`team_members_${avaliationId}`, members, 300000); // 5 min
      return members;
    },
    // Fallback: Usar cache
    () => {
      const cached = cacheGet(`team_members_${avaliationId}`);
      if (!cached) {
        throw new Error('No cache available');
      }
      return cached;
    },
    'Use cached team members'
  );
};
```

#### **5. Error Boundaries (React)**

```typescript
// components/shared/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);

    // Log para monitoramento
    logErrorToService({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Callback customizado
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Algo deu errado</h2>
            <p>Desculpe, ocorreu um erro inesperado.</p>
            <button onClick={this.handleReset}>Tentar novamente</button>
            {process.env.NODE_ENV === 'development' && (
              <pre>{this.state.error?.message}</pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Uso na aplicação
export const App = () => {
  return (
    <ErrorBoundary fallback={<ErrorFallbackPage />}>
      <Router>
        <Routes>
          <Route
            path="/dashboard/:token"
            element={
              <ErrorBoundary fallback={<DashboardError />}>
                <Dashboard />
              </ErrorBoundary>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};
```

#### **6. Offline Support e Sync Queue**

```typescript
// utils/offlineQueue.ts
interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;
  private readonly MAX_RETRIES = 5;

  constructor() {
    // Restaurar queue do localStorage
    this.loadQueue();

    // Listener para conexão
    window.addEventListener('online', () => {
      console.info('Connection restored, processing queue...');
      this.processQueue();
    });

    // Verificar conexão periodicamente
    setInterval(() => {
      if (navigator.onLine && this.queue.length > 0) {
        this.processQueue();
      }
    }, 30000); // 30 segundos
  }

  add(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): void {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: generateId(),
      timestamp: Date.now(),
      retries: 0
    };

    this.queue.push(queuedOp);
    this.saveQueue();

    // Tenta processar imediatamente se online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const operation = this.queue[0];

      try {
        await this.executeOperation(operation);

        // Sucesso - remove da fila
        this.queue.shift();
        this.saveQueue();

        console.info(`Processed queued operation: ${operation.id}`);
      } catch (error) {
        console.error(`Failed to process operation: ${operation.id}`, error);

        operation.retries++;

        if (operation.retries >= this.MAX_RETRIES) {
          // Máximo de tentativas - remove da fila e loga
          this.queue.shift();
          this.logFailedOperation(operation, error);
        } else {
          // Vai tentar novamente depois
          break;
        }

        this.saveQueue();
      }
    }

    this.processing = false;
  }

  private async executeOperation(op: QueuedOperation): Promise<void> {
    switch (op.type) {
      case 'CREATE':
        await addDoc(collection(db, op.collection), op.data);
        break;
      case 'UPDATE':
        await updateDoc(doc(db, op.collection, op.data.id), op.data);
        break;
      case 'DELETE':
        await deleteDoc(doc(db, op.collection, op.data.id));
        break;
    }
  }

  private loadQueue(): void {
    const saved = localStorage.getItem('offline_queue');
    if (saved) {
      this.queue = JSON.parse(saved);
    }
  }

  private saveQueue(): void {
    localStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }

  private logFailedOperation(op: QueuedOperation, error: any): void {
    console.error('Operation failed permanently:', op, error);
    // Poderia enviar para serviço de monitoramento
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueue();

// Exemplo de uso
const saveResponseWithOfflineSupport = async (response: Response) => {
  if (!navigator.onLine) {
    // Offline - adiciona na fila
    offlineQueue.add({
      type: 'CREATE',
      collection: 'responses',
      data: response
    });

    // Salva localmente para visualização imediata
    saveToLocalStorage(`temp_response_${response.id}`, response);

    showToast('Salvo localmente. Será sincronizado quando online.', 'info');
    return;
  }

  // Online - salva normalmente com resiliência
  try {
    await saveToFirestore(response);
    showToast('Avaliação salva com sucesso!', 'success');
  } catch (error) {
    // Falhou mesmo estando online - adiciona na fila
    offlineQueue.add({
      type: 'CREATE',
      collection: 'responses',
      data: response
    });

    showToast('Erro ao salvar. Tentaremos novamente automaticamente.', 'warning');
  }
};
```

#### **7. Graceful Degradation**

```typescript
// utils/featureDetection.ts
export const features = {
  // Verifica se IndexedDB está disponível
  hasIndexedDB: typeof indexedDB !== 'undefined',

  // Verifica se Service Worker está disponível
  hasServiceWorker: 'serviceWorker' in navigator,

  // Verifica se WebCrypto API está disponível
  hasWebCrypto: typeof crypto !== 'undefined' && 'subtle' in crypto,

  // Verifica se Web Workers estão disponíveis
  hasWebWorkers: typeof Worker !== 'undefined',

  // Verifica conexão
  isOnline: navigator.onLine
};

// Adapta funcionalidade baseado em features disponíveis
export const getStorageAdapter = () => {
  if (features.hasIndexedDB) {
    return new IndexedDBAdapter(); // Melhor opção
  }
  return new LocalStorageAdapter(); // Fallback
};

export const getCryptoAdapter = () => {
  if (features.hasWebCrypto) {
    return new WebCryptoAdapter(); // Rápido e seguro
  }
  return new CryptoJSAdapter(); // Fallback mais lento
};

// Componente com degradação
export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    if (isOffline) {
      // Modo offline - usa cache
      const cachedData = await loadFromCache();
      setData(cachedData);
      showToast('Exibindo dados em cache (offline)', 'info');
    } else {
      // Modo online - busca do servidor
      try {
        const freshData = await loadFromFirestore();
        setData(freshData);
        await saveToCache(freshData); // Atualiza cache
      } catch (error) {
        // Falhou - usa cache como fallback
        const cachedData = await loadFromCache();
        setData(cachedData);
        showToast('Erro ao carregar. Exibindo dados em cache.', 'warning');
      }
    }
  };

  return (
    <div>
      {isOffline && (
        <Banner type="warning">
          Você está offline. Algumas funcionalidades podem estar limitadas.
        </Banner>
      )}
      {/* ... resto do componente */}
    </div>
  );
};
```

#### **8. Health Checks e Monitoring**

```typescript
// utils/healthCheck.ts
interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  lastCheck: number;
}

class HealthMonitor {
  private healthStatus: Map<string, ServiceHealth> = new Map();
  private checkInterval = 60000; // 1 minuto

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.checkAllServices();
    }, this.checkInterval);

    // Check imediato
    this.checkAllServices();
  }

  async checkAllServices(): Promise<void> {
    await Promise.all([
      this.checkFirestore(),
      this.checkEmailJS(),
      this.checkAuth()
    ]);
  }

  private async checkFirestore(): Promise<void> {
    const start = Date.now();

    try {
      // Tenta uma leitura simples
      await withTimeout(
        () => getDocs(query(collection(db, 'avaliations'), limit(1))),
        5000,
        'Firestore health check'
      );

      const latency = Date.now() - start;

      this.healthStatus.set('firestore', {
        name: 'Firestore',
        status: latency < 1000 ? 'healthy' : 'degraded',
        latency,
        lastCheck: Date.now()
      });
    } catch (error) {
      this.healthStatus.set('firestore', {
        name: 'Firestore',
        status: 'down',
        lastCheck: Date.now()
      });
    }
  }

  private async checkEmailJS(): Promise<void> {
    // EmailJS não tem health endpoint, assume healthy
    this.healthStatus.set('emailjs', {
      name: 'EmailJS',
      status: emailJSCircuitBreaker.getState() === CircuitState.OPEN ? 'down' : 'healthy',
      lastCheck: Date.now()
    });
  }

  private async checkAuth(): Promise<void> {
    // Verifica se pode acessar Firebase Auth
    try {
      await withTimeout(
        () => getAuth(),
        2000,
        'Auth health check'
      );

      this.healthStatus.set('auth', {
        name: 'Auth',
        status: 'healthy',
        lastCheck: Date.now()
      });
    } catch (error) {
      this.healthStatus.set('auth', {
        name: 'Auth',
        status: 'down',
        lastCheck: Date.now()
      });
    }
  }

  getHealth(serviceName: string): ServiceHealth | undefined {
    return this.healthStatus.get(serviceName);
  }

  getAllHealth(): ServiceHealth[] {
    return Array.from(this.healthStatus.values());
  }

  isHealthy(): boolean {
    return Array.from(this.healthStatus.values()).every(
      health => health.status !== 'down'
    );
  }
}

export const healthMonitor = new HealthMonitor();

// React Hook para health status
export const useServiceHealth = (serviceName: string) => {
  const [health, setHealth] = useState<ServiceHealth | undefined>();

  useEffect(() => {
    const checkHealth = () => {
      setHealth(healthMonitor.getHealth(serviceName));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // 10s

    return () => clearInterval(interval);
  }, [serviceName]);

  return health;
};
```

### Tabela de Resiliência

| Cenário                        | Sem Resiliência      | Com Resiliência           | Melhoria       |
|--------------------------------|----------------------|---------------------------|----------------|
| Firestore temporariamente down | Erro imediato        | 3 retries + fallback      | **95% sucesso**|
| Rede instável (packet loss)    | 50% falhas           | Exponential backoff       | **90% sucesso**|
| EmailJS rate limit             | Erro para usuário    | Circuit breaker + queue   | **100% enviado**|
| Navegador offline              | App inutilizável     | Modo offline + sync       | **Funciona**   |
| Timeout de query               | Espera infinita      | 5s timeout + retry        | **UX melhor**  |
| Erro em componente React       | App quebra           | Error boundary + reload   | **App funciona**|

### Métricas de Resiliência

```typescript
// Métricas esperadas
const RESILIENCE_METRICS = {
  // Taxa de sucesso com retry
  successRateWithRetry: 0.95,  // 95%

  // Taxa de recuperação de circuit breaker
  circuitRecoveryRate: 0.90,   // 90%

  // Operações offline sincronizadas
  offlineSyncRate: 0.99,        // 99%

  // Uptime percebido pelo usuário
  perceivedUptime: 0.999,       // 99.9%

  // Tempo médio de recuperação
  meanTimeToRecover: 60000,     // 60s
};
```

### Checklist de Resiliência

- [ ] **Retry Logic:**
  - [ ] Exponential backoff implementado
  - [ ] Máximo de 3 tentativas
  - [ ] Apenas erros recuperáveis
  - [ ] Logging de tentativas

- [ ] **Circuit Breaker:**
  - [ ] Circuit breaker para Firestore
  - [ ] Circuit breaker para EmailJS
  - [ ] Threshold de falhas configurado
  - [ ] Timeout de recuperação
  - [ ] Half-open state

- [ ] **Timeouts:**
  - [ ] Timeout para leituras (5s)
  - [ ] Timeout para escritas (10s)
  - [ ] Timeout para emails (15s)
  - [ ] Timeout para uploads (30s)

- [ ] **Fallbacks:**
  - [ ] Fallback para LocalStorage
  - [ ] Fallback para cache
  - [ ] Dados padrão quando falha

- [ ] **Error Boundaries:**
  - [ ] Error boundary global
  - [ ] Error boundary por rota
  - [ ] Fallback UI amigável
  - [ ] Botão de retry

- [ ] **Offline Support:**
  - [ ] Detecção de offline
  - [ ] Queue de sincronização
  - [ ] LocalStorage para cache
  - [ ] Banner de status offline

- [ ] **Graceful Degradation:**
  - [ ] Feature detection
  - [ ] Adaptadores alternativos
  - [ ] UI adaptável

- [ ] **Monitoring:**
  - [ ] Health checks automáticos
  - [ ] Logging de erros
  - [ ] Métricas de resiliência
  - [ ] Alertas de degradação

## Design System e UI/UX Guidelines

### ✨ Redesign Moderno Implementado (2025)

**Status:** ✅ Completo - Todas as telas e componentes redesenhados

O sistema foi completamente redesenhado com uma interface moderna e profissional, inspirada nas melhores práticas de design de produtos SaaS modernos como Stripe, Linear, Vercel e Notion.

#### Componentes Redesenhados

**HomePage:**
- Hero section com gradiente de texto (indigo/purple/pink)
- Trust indicators com checkmarks
- Feature cards em grid layout com ícones
- 6 mini-features destacadas
- CTA section com gradiente button
- Animações suaves e hover effects

**Portal do Gestor:**
- **ManagerLogin**: Tabs modernas para criar/acessar, inputs com ícones, gradient buttons
- **CreateEvaluationForm**: Input grande com contador de caracteres dinâmico, checklist interativa de próximos passos, cards informativos com gradientes
- **AddMembersForm**: Seção Excel destacada com gradiente roxo, cards de membros com badges numerados, contador visual de status
- **EvaluationSuccess**: Header celebratório com checkmark animado, token em destaque com gradiente âmbar/amarelo, lista de códigos moderna, próximos passos com ícones

**Portal do Colaborador:**
- **MemberLogin**: PIN pad visual com 6 boxes interativas, gradiente emerald/teal, botão dinâmico mostrando progresso
- **EvaluationForm**: Rating stars interativos, textarea com contador de caracteres, progress tracker

**Componentes de Layout:**
- **PageLayout**: Wrapper reutilizável com 3 variantes (home, manager, member), animated blob backgrounds
- **Card Components**: Card, CardHeader, CardBody, CardFooter com suporte a gradientes e hover effects

#### Design Tokens Modernos

```css
/* Gradientes por Contexto */
--gradient-home: from-indigo-500 via-purple-500 to-pink-500
--gradient-manager: from-blue-600 via-indigo-600 to-purple-600
--gradient-member: from-emerald-500 via-teal-500 to-cyan-500
--gradient-success: from-green-400 to-emerald-500
--gradient-warning: from-amber-500 to-yellow-500

/* Rounded Corners Modernos */
--rounded-3xl: 1.5rem / 24px (cards principais)
--rounded-2xl: 1rem / 16px (cards secundários)
--rounded-xl: 0.75rem / 12px (inputs e botões)

/* Shadows em Camadas */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

/* Hover Effects */
--scale-hover: scale(1.02)
--scale-active: scale(0.98)
--transition-smooth: all 0.2s ease-in-out
```

#### Animações Implementadas

```css
/* Blob Animation para Backgrounds */
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Fade In para Conteúdo */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide Up para Alertas */
@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Pulse para Indicadores de Sucesso */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

#### Padrões de Interação Modernos

**Micro-interações:**
- Hover: scale(1.02) + shadow-xl
- Active: scale(0.98)
- Focus: ring-4 ring-{color}-100
- Loading: pulse animation
- Success: checkmark animado com scale

**Feedback Visual:**
- Copiar texto: botão muda de cor com checkmark (2s)
- Contador de caracteres: muda de cor quando próximo do limite
- Progress indicators: cores dinâmicas (verde = ok, laranja = atenção)
- Estados de validação: borders e ícones coloridos inline

**Responsividade:**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid adaptativo: 1 coluna (mobile) → 2 colunas (tablet) → 3+ colunas (desktop)
- Botões empilhados em mobile, lado a lado em desktop

### Identidade Visual Empresarial

O design transmite **profissionalismo, confiança e modernidade**, inspirado em ferramentas empresariais modernas como Linear, Stripe, Vercel e Notion.

### Paleta de Cores

```css
/* Cores Principais */
--primary-blue: #2563eb;        /* Azul corporativo - ações principais */
--primary-dark: #1e40af;        /* Azul escuro - hover states */
--primary-light: #3b82f6;       /* Azul claro - backgrounds leves */

/* Cores Neutras */
--gray-50: #f9fafb;             /* Backgrounds claros */
--gray-100: #f3f4f6;            /* Borders suaves */
--gray-200: #e5e7eb;            /* Dividers */
--gray-300: #d1d5db;            /* Borders */
--gray-400: #9ca3af;            /* Texto secundário */
--gray-500: #6b7280;            /* Texto terciário */
--gray-600: #4b5563;            /* Texto principal */
--gray-700: #374151;            /* Headings */
--gray-800: #1f2937;            /* Texto escuro */
--gray-900: #111827;            /* Backgrounds escuros */

/* Cores de Status */
--success: #10b981;             /* Verde - sucesso, completo */
--warning: #f59e0b;             /* Amarelo - pendente, atenção */
--error: #ef4444;               /* Vermelho - erro, crítico */
--info: #3b82f6;                /* Azul - informação */

/* Escala de Avaliação */
--rating-1: #ef4444;            /* Abaixo da Expectativa */
--rating-2: #f59e0b;            /* Em Linha de Melhora */
--rating-3: #eab308;            /* Alinhado com Expectativas */
--rating-4: #22c55e;            /* Acima das Expectativas */
--rating-5: #10b981;            /* Referência */

/* Backgrounds */
--bg-primary: #ffffff;          /* Fundo principal */
--bg-secondary: #f9fafb;        /* Fundo secundário */
--bg-tertiary: #f3f4f6;         /* Cards e containers */
```

### Tipografia

```css
/* Fontes */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Hierarquia */
--h1: 2.5rem / 40px;            /* font-size / line-height */
--h2: 2rem / 32px;
--h3: 1.5rem / 28px;
--h4: 1.25rem / 24px;
--body-lg: 1.125rem / 28px;
--body: 1rem / 24px;
--body-sm: 0.875rem / 20px;
--caption: 0.75rem / 16px;

/* Pesos */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espaçamento e Grid

```css
/* Espaçamento Consistente */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Sombras */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

### Componentes UI Principais

#### 1. **Layout Geral**

```
┌────────────────────────────────────────────────────────┐
│  HEADER                                                 │
│  Logo Avalia 360°                        [Meu Perfil]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  CONTENT AREA                                    │  │
│  │                                                  │  │
│  │  Breadcrumb: Home > Criar Avaliação             │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  CARD                                      │ │  │
│  │  │  Conteúdo principal                        │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
├────────────────────────────────────────────────────────┤
│  FOOTER                                                 │
│  © 2024 Avalia 360° - Sistema de Avaliações           │
└────────────────────────────────────────────────────────┘
```

#### 2. **Cards e Containers**

```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-blue);
}
```

#### 3. **Botões**

```
┌─────────────────────────────────────────┐
│ PRIMARY BUTTON                          │
│ [Criar Avaliação]  (azul, bold)         │
│                                         │
│ SECONDARY BUTTON                        │
│ [Cancelar]  (cinza, outline)            │
│                                         │
│ TERTIARY BUTTON                         │
│ [Baixar Template Excel]  (link style)   │
│                                         │
│ ICON BUTTON                             │
│ [📥]  (com tooltip)                     │
└─────────────────────────────────────────┘
```

#### 4. **Inputs e Formulários**

```
┌─────────────────────────────────────────┐
│ Label *                                  │
│ ┌─────────────────────────────────────┐ │
│ │ Placeholder text                    │ │
│ └─────────────────────────────────────┘ │
│ Helper text ou mensagem de erro         │
└─────────────────────────────────────────┘

/* Estados */
- Default: border-gray-300
- Focus: border-primary-blue, ring-2
- Error: border-error, text-error
- Success: border-success
- Disabled: bg-gray-100, cursor-not-allowed
```

#### 5. **Progress Bar / Progress Ring**

```
Progresso Linear:
━━━━━━━━━━━━━━━━░░░░░░░░░░  60%

Progresso Circular:
     ⏰
   /    \
  |  60% |
   \    /
    ━━━━

Texto: "12/20 avaliações concluídas"
```

#### 6. **Tags e Badges**

```
✅ Completo      (verde)
⏳ Pendente      (amarelo)
❌ Atrasado      (vermelho)
📊 Em Progresso  (azul)
```

#### 7. **Tabelas e Listas**

```
┌─────────────────────────────────────────────────────┐
│ Nome             Status        Progresso    Ação    │
├─────────────────────────────────────────────────────┤
│ João Silva       ✅ Completo   4/4          [Ver]   │
│ Maria Santos     ⏳ Pendente   2/4          [Ver]   │
│ Pedro Oliveira   ⏳ Pendente   1/4          [Ver]   │
└─────────────────────────────────────────────────────┘

/* Hover: background cinza claro */
/* Zebra striping: linhas alternadas */
```

### Telas Principais - Wireframes

#### **Home Page**

```
┌────────────────────────────────────────────────────────┐
│  [Logo] Avalia 360°                    [Login Gestor]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│              AVALIAÇÃO 360° EMPRESARIAL                │
│         Sistema Completo de Feedback 360 Graus         │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │   🎯 SOU GESTOR     │  │  👥 SOU COLABORADOR │     │
│  │                     │  │                     │     │
│  │  Criar avaliações   │  │  Responder          │     │
│  │  e acompanhar       │  │  avaliações         │     │
│  │                     │  │                     │     │
│  │  [Criar Nova]       │  │  [Acessar]          │     │
│  └─────────────────────┘  └─────────────────────┘     │
│                                                         │
│  ✨ FUNCIONALIDADES                                    │
│  • Todos avaliam todos  • Anônimo  • Seguro           │
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### **Criar Avaliação - Etapa 1**

```
┌────────────────────────────────────────────────────────┐
│  Avalia 360°  >  Nova Avaliação                        │
├────────────────────────────────────────────────────────┤
│                                                         │
│  NOVA AVALIAÇÃO 360°                                   │
│                                                         │
│  Step 1 de 2: Informações Básicas                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░  50%           │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Título da Avaliação *                          │   │
│  │ ┌────────────────────────────────────────────┐ │   │
│  │ │ Ex: Avaliação Q4 2024 - Time Dev           │ │   │
│  │ └────────────────────────────────────────────┘ │   │
│  │                                                │   │
│  │ Descrição (opcional)                           │   │
│  │ ┌────────────────────────────────────────────┐ │   │
│  │ │                                            │ │   │
│  │ └────────────────────────────────────────────┘ │   │
│  │                                                │   │
│  │ Data Limite                                    │   │
│  │ ┌────────────────────┐                        │   │
│  │ │ 31/12/2024         │  📅                   │   │
│  │ └────────────────────┘                        │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│               [Cancelar]  [Próximo →]                  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### **Criar Avaliação - Etapa 2**

```
┌────────────────────────────────────────────────────────┐
│  Avalia 360°  >  Nova Avaliação  >  Adicionar Membros │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ADICIONAR MEMBROS DA EQUIPE                           │
│                                                         │
│  Step 2 de 2: Membros                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  100%          │
│                                                         │
│  ┌─ ESCOLHA O MÉTODO ─────────────────────────────┐   │
│  │                                                 │   │
│  │  [ 📝 Manual ]        [ 📊 Upload Excel ]      │   │
│  │   ━━━━━━━━━                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ ADICIONAR MEMBRO ──────────────────────────────┐   │
│  │                                                  │   │
│  │  Nome Completo *                                │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ Ex: João Silva                             │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │  Email Corporativo *                            │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ joao.silva@empresa.com                     │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │              [+ Adicionar Membro]               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ MEMBROS ADICIONADOS (5) ───────────────────────┐   │
│  │  ✅ João Silva - joao@empresa.com         [x]   │   │
│  │  ✅ Maria Santos - maria@empresa.com      [x]   │   │
│  │  ✅ Pedro Oliveira - pedro@empresa.com    [x]   │   │
│  │  ✅ Ana Costa - ana@empresa.com           [x]   │   │
│  │  ✅ Carlos Lima - carlos@empresa.com      [x]   │   │
│  │                                                  │   │
│  │  📊 Total de avaliações: 5 × 4 = 20             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│          [← Voltar]  [Criar e Enviar Convites]         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### **Dashboard do Gestor**

```
┌────────────────────────────────────────────────────────┐
│  Avalia 360°                         João (Gestor) ▼   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  AVALIAÇÃO Q4 2024 - TIME DEV                          │
│  Criada em: 15/11/2024 • Prazo: 31/12/2024            │
│                                                         │
│  ┌─ VISÃO GERAL ────────────────────────────────────┐  │
│  │                                                   │  │
│  │  Progresso Geral         Taxa de Conclusão       │  │
│  │                                                   │  │
│  │      ⏰                        ⏰                 │  │
│  │    /    \                    /    \              │  │
│  │   | 60%  |                  | 60%  |             │  │
│  │    \    /                    \    /              │  │
│  │     ━━━━                      ━━━━               │  │
│  │                                                   │  │
│  │  12/20 avaliações        3/5 membros completos   │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ PROGRESSO POR MEMBRO ───────────────────────────┐  │
│  │                                                   │  │
│  │  Nome            Progress Bar       Status       │  │
│  │  ─────────────────────────────────────────────   │  │
│  │  João Silva      ━━━━━━━━━━━━━━━━━━  100%  ✅   │  │
│  │                  4/4 avaliações                   │  │
│  │                                                   │  │
│  │  Maria Santos    ━━━━━━━━━━░░░░░░░░   50%   ⏳  │  │
│  │                  2/4 avaliações                   │  │
│  │                                                   │  │
│  │  Pedro Oliveira  ━━━━░░░░░░░░░░░░░░   25%   ⏳  │  │
│  │                  1/4 avaliações                   │  │
│  │                                                   │  │
│  │  Ana Costa       ━━━━━━━━━━━━━━━━━━  100%  ✅   │  │
│  │                  4/4 avaliações                   │  │
│  │                                                   │  │
│  │  Carlos Lima     ━━━━░░░░░░░░░░░░░░   25%   ⏳  │  │
│  │                  1/4 avaliações                   │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [📧 Reenviar Convites]  [📊 Ver Resultados (bloqueado)]│
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### **Página de Avaliação (Colaborador)**

```
┌────────────────────────────────────────────────────────┐
│  Avalia 360°                                           │
├────────────────────────────────────────────────────────┤
│                                                         │
│  AVALIAÇÃO Q4 2024 - TIME DEV                          │
│  Olá Maria Santos! Complete suas avaliações.          │
│                                                         │
│  Seu Progresso: 2/4 avaliações ━━━━━━━░░░░  50%       │
│                                                         │
│  ┌─ AVALIAÇÕES PENDENTES ───────────────────────────┐  │
│  │                                                   │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  👤 Pedro Oliveira                        │  │  │
│  │  │  ⏳ Pendente                              │  │  │
│  │  │                                           │  │  │
│  │  │  [Avaliar Agora →]                       │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  👤 Carlos Lima                           │  │  │
│  │  │  ⏳ Pendente                              │  │  │
│  │  │                                           │  │  │
│  │  │  [Avaliar Agora →]                       │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ AVALIAÇÕES CONCLUÍDAS ──────────────────────────┐  │
│  │                                                   │  │
│  │  ✅ João Silva - Concluída em 16/11/2024        │  │
│  │  ✅ Ana Costa - Concluída em 16/11/2024         │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### **Formulário de Avaliação**

```
┌────────────────────────────────────────────────────────┐
│  Avalia 360°  >  Avaliação  >  Pedro Oliveira         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  AVALIAR: PEDRO OLIVEIRA                               │
│  Suas respostas são anônimas e confidenciais          │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │                                                │   │
│  │  1. Nível de satisfação em relação ao         │   │
│  │     profissional?                              │   │
│  │                                                │   │
│  │  [1] [2] [3] [4] [5]                          │   │
│  │   ❌  ⚠️  ⚪  ✅  ⭐                            │   │
│  │                                                │   │
│  │  1 - Abaixo da Expectativa                    │   │
│  │  5 - Referência Para Outras Pessoas           │   │
│  │                                                │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  2. Proatividade na resolução de problemas?   │   │
│  │  [1] [2] [3] [4] [5]                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  3. Qualidade das entregas?                   │   │
│  │  [1] [2] [3] [4] [5]                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  4. Trabalho em equipe e convivência?         │   │
│  │  [1] [2] [3] [4] [5]                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  ✨ Pontos Positivos                          │   │
│  │  ┌────────────────────────────────────────┐   │   │
│  │  │                                        │   │   │
│  │  │                                        │   │   │
│  │  └────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  🎯 Pontos a Melhorar/Evoluir                 │   │
│  │  ┌────────────────────────────────────────┐   │   │
│  │  │                                        │   │   │
│  │  │                                        │   │   │
│  │  └────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│     [← Voltar]  [Salvar Rascunho]  [Enviar →]        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### **Resultados - Por Pessoa**

```
┌────────────────────────────────────────────────────────┐
│  Avalia 360°  >  Resultados  >  João Silva            │
├────────────────────────────────────────────────────────┤
│                                                         │
│  RESULTADOS: JOÃO SILVA                                │
│  Baseado em 4 avaliações (100% de resposta)           │
│                                                         │
│  ┌─ MÉDIA GERAL ─────────────────────────────────────┐ │
│  │                                                    │ │
│  │              ⭐ 4.2 / 5.0                         │ │
│  │       ACIMA DAS EXPECTATIVAS                      │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ DESEMPENHO POR CRITÉRIO ─────────────────────────┐ │
│  │                                                    │ │
│  │  Satisfação Geral                                 │ │
│  │  ━━━━━━━━━━━━━━━━━░░  4.5  ⭐                    │ │
│  │                                                    │ │
│  │  Proatividade                                     │ │
│  │  ━━━━━━━━━━━━━━━░░░░  4.0  ✅                    │ │
│  │                                                    │ │
│  │  Qualidade                                        │ │
│  │  ━━━━━━━━━━━━━━━━░░░  4.2  ✅                    │ │
│  │                                                    │ │
│  │  Trabalho em Equipe                               │ │
│  │  ━━━━━━━━━━━━━━━━━░  4.3  ⭐                    │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ COMENTÁRIOS RECEBIDOS (4) ───────────────────────┐ │
│  │                                                    │ │
│  │  ✨ PONTOS POSITIVOS                              │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ "Muito proativo e sempre disposto a ajudar"  │ │ │
│  │  │ "Excelente qualidade técnica"                │ │ │
│  │  │ "Ótimo colega de equipe"                     │ │ │
│  │  │ "Comunicação clara e objetiva"               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  🎯 PONTOS A MELHORAR                             │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ "Poderia documentar mais o código"           │ │ │
│  │  │ "Às vezes demora para responder mensagens"   │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  [← Voltar]  [📄 Exportar PDF]  [Ver Próximo →]       │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Micro-interações e Animações

```typescript
// Transições suaves
transition: all 0.2s ease-in-out;

// Hover states
- Botões: scale(1.02)
- Cards: shadow aumenta
- Links: cor muda para primary-dark

// Loading states
- Skeleton screens enquanto carrega
- Spinners para ações assíncronas
- Progress bars para uploads

// Success states
- Checkmark animado
- Toast notifications
- Confetti para 100% de conclusão
```

### Responsividade

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }

/* Prioridades Mobile */
- Menu hamburger em mobile
- Cards empilhados verticalmente
- Tabelas viram cards em mobile
- Touch-friendly (botões min 44px)
```

## Configuração de Variáveis de Ambiente

### GitHub Secrets (Configuração)

As credenciais do Firebase e EmailJS devem ser armazenadas como **GitHub Secrets** e injetadas durante o build via GitHub Actions.

#### Secrets Necessários

No repositório GitHub, configure os seguintes secrets em `Settings > Secrets and variables > Actions`:

**Firebase:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**EmailJS:**
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

### GitHub Actions Workflow

Arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_EMAILJS_SERVICE_ID: ${{ secrets.VITE_EMAILJS_SERVICE_ID }}
          VITE_EMAILJS_TEMPLATE_ID: ${{ secrets.VITE_EMAILJS_TEMPLATE_ID }}
          VITE_EMAILJS_PUBLIC_KEY: ${{ secrets.VITE_EMAILJS_PUBLIC_KEY }}
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Uso no Código

**src/services/firebase.ts:**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

**src/services/emailjs.ts:**
```typescript
import emailjs from '@emailjs/browser';

export const emailConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

emailjs.init(emailConfig.publicKey);
```

### Arquivo .env.example

Criar um arquivo `.env.example` na raiz do projeto para documentação:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### Desenvolvimento Local

Para desenvolvimento local, criar arquivo `.env` (NÃO commitar):

```bash
# Copie .env.example para .env
cp .env.example .env

# Preencha com suas credenciais de desenvolvimento
```

Adicionar `.env` no `.gitignore`:

```
# Environment variables
.env
.env.local
```

## Segurança e Proteção contra CVEs

### Proteção contra OWASP Top 10 2021

#### **A01:2021 - Broken Access Control**

**Proteções Implementadas:**
```typescript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas criador acessa resultados
    match /avaliations/{avaliationId} {
      allow read: if request.auth.token.creator_token ==
                     resource.data.creator_token;
      allow write: if request.auth.token.creator_token ==
                      resource.data.creator_token;
    }

    // Colaborador só acessa suas próprias avaliações
    match /team_members/{memberId} {
      allow read: if request.auth.token.access_code ==
                     resource.data.access_code;
      allow update: if request.auth.token.access_code ==
                       resource.data.access_code;
    }

    // Proteção de respostas
    match /responses/{responseId} {
      allow read: if false; // Apenas via backend
      allow create: if request.auth != null;
      allow update: if false; // Não permite edição
      allow delete: if false; // Não permite exclusão
    }
  }
}
```

**Validações no Frontend:**
- Verificar token antes de cada operação
- Validar permissões antes de renderizar componentes
- Redirecionar usuário não autorizado
- Logs de tentativas de acesso não autorizado

#### **A02:2021 - Cryptographic Failures**

**Proteções Implementadas:**
```typescript
// Criptografia AES-256 para dados sensíveis
import CryptoJS from 'crypto-js';

// Gerar chave única por avaliação
const generateEncryptionKey = (avaliationId: string): string => {
  return CryptoJS.SHA256(avaliationId + process.env.VITE_ENCRYPTION_SALT).toString();
};

// Criptografar dados
const encryptData = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

// Descriptografar dados
const decryptData = (encryptedData: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Hash de emails (para busca sem expor dados)
const hashEmail = (email: string): string => {
  return CryptoJS.SHA256(email.toLowerCase()).toString();
};
```

**Dados que DEVEM ser criptografados:**
- Nomes completos dos membros
- Emails dos membros
- Respostas das avaliações (notas e comentários)
- Título da avaliação

**Dados que podem ser em hash:**
- Emails (para busca)
- Códigos de acesso (bcrypt-like)

#### **A03:2021 - Injection (XSS, SQL Injection)**

**Proteção contra XSS:**
```typescript
// Sanitização de inputs
import DOMPurify from 'dompurify';

// Sanitizar antes de salvar
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Não permite HTML
    ALLOWED_ATTR: []
  });
};

// Validação de campos de texto
const validateTextInput = (input: string): boolean => {
  // Remove caracteres perigosos
  const dangerousChars = /<script|javascript:|onerror|onclick/gi;
  return !dangerousChars.test(input);
};

// React já escapa por padrão, mas reforçar
const CommentDisplay = ({ comment }: { comment: string }) => {
  // Sanitizar antes de exibir
  const safeComment = DOMPurify.sanitize(comment);

  return <div>{safeComment}</div>;
  // Nunca usar dangerouslySetInnerHTML sem sanitizar
};
```

**Proteção contra NoSQL Injection:**
```typescript
// Firestore é naturalmente protegido, mas validar inputs
const validateEmailQuery = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Rejeitar queries suspeitas
  if (email.includes('$') || email.includes('{') || email.includes('}')) {
    return false;
  }

  return emailRegex.test(email);
};
```

#### **A04:2021 - Insecure Design**

**Design Seguro Implementado:**

1. **Rate Limiting:**
```typescript
// Limitar tentativas de acesso
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

const checkRateLimit = (accessCode: string): boolean => {
  const attempts = getAttempts(accessCode);

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;

    if (timeSinceLastAttempt < LOCKOUT_TIME) {
      throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
    }

    // Reset após lockout
    resetAttempts(accessCode);
  }

  return true;
};
```

2. **Validação de Tokens:**
```typescript
// Token expira após 90 dias
const isTokenValid = (token: TokenData): boolean => {
  const now = Date.now();
  const expiresAt = token.createdAt + (90 * 24 * 60 * 60 * 1000);

  return now < expiresAt;
};

// Códigos de acesso expiram após avaliação concluída
const isAccessCodeValid = (code: AccessCodeData): boolean => {
  return !code.used && isTokenValid(code);
};
```

#### **A05:2021 - Security Misconfiguration**

**Configurações Seguras:**

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),

      // Outros headers de segurança
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  }
});
```

**Configuração Firebase Security Rules:**
```javascript
// Regras restritivas por padrão
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Negar tudo por padrão
    match /{document=**} {
      allow read, write: if false;
    }

    // Liberar apenas o necessário (ver seção A01)
  }
}
```

#### **A06:2021 - Vulnerable and Outdated Components**

**Gestão de Dependências:**

```json
// package.json - usar versões específicas
{
  "dependencies": {
    "react": "^18.2.0", // Sempre usar versões atualizadas
    "firebase": "^10.0.0",
    "crypto-js": "^4.2.0"
  },
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "outdated": "npm outdated"
  }
}
```

**Verificação Contínua:**
```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 0' # Toda semana
  push:
    branches: [ main ]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Check for outdated packages
        run: npm outdated
```

**Dependabot para atualizações automáticas:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    versioning-strategy: increase
```

#### **A07:2021 - Identification and Authentication Failures**

**Autenticação Segura:**

```typescript
// Gerar códigos de acesso seguros
import { v4 as uuidv4 } from 'uuid';

const generateAccessCode = (): string => {
  // 6 dígitos aleatórios
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
};

// Gerar token do gestor
const generateManagerToken = (): string => {
  return uuidv4(); // UUID v4 seguro
};

// Verificar código de acesso
const verifyAccessCode = async (
  avaliationId: string,
  inputCode: string
): Promise<boolean> => {
  // Hash do código para comparação
  const hashedInput = hashAccessCode(inputCode);

  // Buscar no Firestore
  const member = await findMemberByCode(avaliationId, hashedInput);

  if (!member) {
    // Incrementar contador de tentativas
    await incrementFailedAttempts(inputCode);
    return false;
  }

  // Reset contador em sucesso
  await resetFailedAttempts(inputCode);
  return true;
};

// Hash de códigos de acesso (bcrypt-like)
const hashAccessCode = (code: string): string => {
  return CryptoJS.SHA256(code + process.env.VITE_ACCESS_CODE_SALT).toString();
};
```

#### **A08:2021 - Software and Data Integrity Failures**

**Proteção de Integridade:**

```typescript
// Validar integridade dos dados
interface DataWithChecksum {
  data: string;
  checksum: string;
  timestamp: number;
}

const createDataWithChecksum = (data: any): DataWithChecksum => {
  const dataString = JSON.stringify(data);
  const checksum = CryptoJS.SHA256(dataString).toString();

  return {
    data: dataString,
    checksum,
    timestamp: Date.now()
  };
};

const verifyDataIntegrity = (dataWithChecksum: DataWithChecksum): boolean => {
  const calculatedChecksum = CryptoJS.SHA256(dataWithChecksum.data).toString();
  return calculatedChecksum === dataWithChecksum.checksum;
};

// Subresource Integrity para CDNs
// index.html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
  crossorigin="anonymous"
/>
```

#### **A09:2021 - Security Logging and Monitoring Failures**

**Logging Seguro:**

```typescript
// Sistema de logs
interface SecurityLog {
  timestamp: number;
  event: string;
  userId?: string;
  ipAddress?: string;
  success: boolean;
  metadata?: Record<string, any>;
}

const logSecurityEvent = async (log: SecurityLog): Promise<void> => {
  // Não logar dados sensíveis (senhas, tokens completos, etc)
  const sanitizedLog = {
    ...log,
    userId: log.userId ? hashUserId(log.userId) : undefined
  };

  // Salvar no Firestore em collection separada
  await addDoc(collection(db, 'security_logs'), sanitizedLog);
};

// Eventos a logar
const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  DATA_EXPORT: 'data_export',
  AVALIATION_CREATED: 'avaliation_created',
  RESPONSE_SUBMITTED: 'response_submitted'
};
```

#### **A10:2021 - Server-Side Request Forgery (SSRF)**

**Proteção SSRF:**

```typescript
// Validar URLs antes de fazer fetch
const validateURL = (url: string): boolean => {
  try {
    const parsed = new URL(url);

    // Whitelist de domínios permitidos
    const allowedDomains = [
      'firebasestorage.googleapis.com',
      'firestore.googleapis.com',
      'api.emailjs.com'
    ];

    // Rejeitar IPs privados
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;
    if (privateIPRegex.test(parsed.hostname)) {
      return false;
    }

    // Rejeitar localhost
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return false;
    }

    // Verificar se domínio está na whitelist
    return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
};
```

### Proteção contra CVEs Específicas

#### **CVE-2022-24999 - ReDoS em express/qs**
```typescript
// Limitar tamanho de query strings
const MAX_QUERY_LENGTH = 1000;

const validateQueryString = (query: string): boolean => {
  return query.length <= MAX_QUERY_LENGTH;
};
```

#### **CVE-2023-26136 - Path Traversal**
```typescript
// Validar caminhos de arquivo (para Excel upload)
const sanitizeFilename = (filename: string): string => {
  // Remover path traversal
  return filename.replace(/\.\./g, '').replace(/\//g, '');
};

const validateFilePath = (filepath: string): boolean => {
  // Não permitir ../, ..\, etc
  const traversalPattern = /(\.\.[\/\\])/;
  return !traversalPattern.test(filepath);
};
```

#### **CVE-2024-27980 - Command Injection**
```typescript
// Nunca executar comandos com input do usuário
// Se necessário, usar whitelist
const ALLOWED_COMMANDS = ['export-pdf', 'export-excel'];

const validateCommand = (command: string): boolean => {
  return ALLOWED_COMMANDS.includes(command);
};
```

### Validação e Sanitização Completa

```typescript
// Validação de Email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validação de Nome
const isValidName = (name: string): boolean => {
  // Apenas letras, espaços e acentos
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,100}$/;
  return nameRegex.test(name);
};

// Validação de Rating
const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// Validação de Comentário
const isValidComment = (comment: string): boolean => {
  // Máximo 500 caracteres
  // Sem HTML/scripts
  const sanitized = DOMPurify.sanitize(comment);
  return sanitized.length <= 500 && sanitized === comment;
};
```

### Checklist de Segurança

- [ ] **Dependências:**
  - [ ] npm audit sem vulnerabilidades críticas/altas
  - [ ] Dependabot configurado
  - [ ] Versões atualizadas de todas as libs

- [ ] **Autenticação:**
  - [ ] Tokens UUID seguros
  - [ ] Códigos de acesso hash
  - [ ] Rate limiting implementado
  - [ ] Expiração de tokens

- [ ] **Criptografia:**
  - [ ] AES-256 para dados sensíveis
  - [ ] SHA-256 para hashes
  - [ ] Chaves únicas por avaliação

- [ ] **Validação:**
  - [ ] Todos os inputs validados
  - [ ] Sanitização com DOMPurify
  - [ ] Whitelist de domínios
  - [ ] Limite de tamanho de inputs

- [ ] **Headers de Segurança:**
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] HSTS configurado

- [ ] **Firestore Rules:**
  - [ ] Deny by default
  - [ ] Acesso baseado em tokens
  - [ ] Sem exposição de dados sensíveis

- [ ] **Logging:**
  - [ ] Logs de eventos de segurança
  - [ ] Sem dados sensíveis nos logs
  - [ ] Monitoramento de tentativas falhas

- [ ] **Testing:**
  - [ ] Testes de segurança automatizados
  - [ ] Penetration testing manual
  - [ ] OWASP ZAP scan

### Proteção Adicional

1. **CORS Configurado:**
```typescript
// Firebase permite apenas do domínio configurado
const firebaseConfig = {
  // ...
  authDomain: 'seu-projeto.firebaseapp.com' // Apenas esse domínio
};
```

2. **GitHub Secrets:**
- Todas as credenciais em secrets
- Rotação de secrets periodicamente
- Nunca commitar .env

3. **Build Seguro:**
```yaml
# GitHub Actions com verificações
- name: Security Headers Check
  run: |
    npm run build
    # Verificar se build tem CSP headers
```

## Rotas da Aplicação

| Rota                        | Descrição                          |
|-----------------------------|------------------------------------|
| `/`                         | Home (escolhe gestor/colaborador)  |
| `/criar`                    | Criar avaliação                    |
| `/acompanhar/:token`        | Dashboard do gestor                |
| `/resultados/:token`        | Resultados finais                  |
| `/responder/:avaliation_id` | Form de resposta                   |

## Perguntas da Avaliação

### Perguntas Objetivas (Escala 1-5)

1. **Satisfação:** Qual o nível de satisfação em relação ao profissional?
2. **Proatividade:** O desenvolvedor demonstrou proatividade na resolução de problemas?
3. **Qualidade:** Como você avalia a qualidade das entregas e a necessidade de retrabalho?
4. **Trabalho em equipe:** Como você avalia a capacidade de trabalhar em equipe e convivência?

### Perguntas Abertas

5. **Comentários:**
   - Pontos Positivos (textarea)
   - Pontos a melhorar/evoluir (textarea)

### Escala de Respostas (1-5)

- **1** → Abaixo da Expectativa
- **2** → Em Linha de Melhora
- **3** → Alinhado com as Expectativas
- **4** → Acima das Expectativas
- **5** → Referência Para Outras Pessoas

## Template de Email (EmailJS)

```
Assunto: Você foi convidado para uma Avaliação 360° - [TITULO_AVALIACAO]

Olá [NOME],

Você foi convidado(a) por [GESTOR] para participar de uma Avaliação 360°.

📋 O que é uma Avaliação 360°?
Você irá avaliar todos os membros da sua equipe ([TOTAL_PESSOAS] pessoas).
Suas respostas são anônimas e confidenciais.

🔗 Link de acesso: [URL]
🔑 Código de acesso: [CODIGO]

⏰ Prazo: [DATA_LIMITE]

👥 Você precisará avaliar [TOTAL_AVALIACOES] pessoas.

Por favor, reserve um tempo para avaliar cada membro da equipe com honestidade e respeito.

Obrigado!
```

## Funcionalidades Principais

### Para o Gestor

- ✅ Criar nova avaliação com título
- ✅ Adicionar membros da equipe de DUAS formas:
  - Manualmente (um por um via formulário)
  - Upload de arquivo Excel (importação em massa)
- ✅ Baixar template Excel padronizado
- ✅ Validação automática de emails (formato e duplicados)
- ✅ Enviar convites automaticamente via email para TODOS os membros
- ✅ Acompanhar progresso em tempo real:
  - Progresso geral (ex: 15/20 avaliações concluídas)
  - Progresso individual (ex: João: 3/4, Maria: 4/4)
- ✅ Ver quem completou todas as avaliações e quem está pendente
- ✅ Visualizar resultados consolidados POR PESSOA:
  - Média das notas recebidas por cada membro
  - Todos os comentários sobre cada pessoa (anônimos)
  - Gráficos de desempenho por pergunta
- ✅ Acesso exclusivo aos resultados (apenas o criador)

### Para o Colaborador

- ✅ Acessar avaliação com código único
- ✅ Ver lista de todos os membros da equipe
- ✅ Avaliar CADA membro individualmente:
  - Responder 4 perguntas objetivas (escala 1-5)
  - Adicionar comentários sobre pontos positivos
  - Adicionar comentários sobre pontos de melhoria
- ✅ Acompanhar progresso pessoal (ex: 2/4 avaliações concluídas)
- ✅ Salvar avaliações parcialmente (pode voltar depois)
- ✅ Não pode avaliar a si mesmo
- ✅ Cada pessoa é avaliada apenas uma vez pelo mesmo colaborador
- ✅ Respostas anônimas garantidas

## Template Excel para Import de Membros

### Estrutura do Template

O template Excel deve ter a seguinte estrutura:

| Nome           | Email                    |
|----------------|--------------------------|
| João Silva     | joao.silva@empresa.com   |
| Maria Santos   | maria.santos@empresa.com |
| Pedro Oliveira | pedro@empresa.com        |

### Especificações Técnicas

- **Formato:** `.xlsx` ou `.xls`
- **Primeira linha:** Cabeçalhos (Nome | Email)
- **Colunas obrigatórias:**
  - Coluna A: Nome completo do colaborador
  - Coluna B: Email válido
- **Validações aplicadas:**
  - Email deve ter formato válido (regex)
  - Emails não podem ser duplicados
  - Nome não pode estar vazio
  - Mínimo de 2 membros
  - Máximo recomendado: 50 membros

### Geração do Template

```typescript
// utils/excelTemplate.ts
import * as XLSX from 'xlsx';

export const generateTemplate = () => {
  const template = [
    ['Nome', 'Email'],
    ['João Silva', 'joao.silva@empresa.com'],
    ['Maria Santos', 'maria.santos@empresa.com'],
    ['Pedro Oliveira', 'pedro@empresa.com'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Membros da Equipe');

  // Download automático
  XLSX.writeFile(wb, 'template-avaliacao-360.xlsx');
};
```

### Validação e Importação

```typescript
// utils/excelParser.ts
import * as XLSX from 'xlsx';

interface TeamMember {
  name: string;
  email: string;
}

export const parseExcelFile = (file: File): Promise<TeamMember[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Remove header
        const members = jsonData.slice(1).map((row: any) => ({
          name: row[0]?.toString().trim() || '',
          email: row[1]?.toString().trim().toLowerCase() || '',
        }));

        // Validações
        const errors = validateMembers(members);
        if (errors.length > 0) {
          reject(new Error(errors.join(', ')));
        }

        resolve(members);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo Excel'));
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

const validateMembers = (members: TeamMember[]): string[] => {
  const errors: string[] = [];
  const emails = new Set<string>();

  if (members.length < 2) {
    errors.push('Mínimo de 2 membros necessário');
  }

  members.forEach((member, index) => {
    const line = index + 2; // +2 porque linha 1 é header e index começa em 0

    if (!member.name) {
      errors.push(`Linha ${line}: Nome está vazio`);
    }

    if (!member.email) {
      errors.push(`Linha ${line}: Email está vazio`);
    } else if (!isValidEmail(member.email)) {
      errors.push(`Linha ${line}: Email inválido (${member.email})`);
    } else if (emails.has(member.email)) {
      errors.push(`Linha ${line}: Email duplicado (${member.email})`);
    } else {
      emails.add(member.email);
    }
  });

  return errors;
};

const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

### Interface do Usuário

```
┌─────────────────────────────────────────┐
│ Adicionar Membros da Equipe             │
├─────────────────────────────────────────┤
│                                          │
│ [ Modo Manual ]  [ Upload Excel ]       │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │                                    │  │
│ │  📥 Arraste o arquivo Excel aqui   │  │
│ │     ou clique para selecionar      │  │
│ │                                    │  │
│ │  📄 Baixar Template Excel          │  │
│ │                                    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Arquivos aceitos: .xlsx, .xls            │
│ Formato: Nome | Email                    │
│                                          │
└─────────────────────────────────────────┘
```

### Feedback ao Usuário

Após upload bem-sucedido:
```
✅ 5 membros importados com sucesso!
   - João Silva (joao.silva@empresa.com)
   - Maria Santos (maria.santos@empresa.com)
   - Pedro Oliveira (pedro@empresa.com)
   - Ana Costa (ana@empresa.com)
   - Carlos Lima (carlos@empresa.com)
```

Em caso de erro:
```
❌ Erro ao importar arquivo:
   - Linha 3: Email inválido (maria.santos@)
   - Linha 5: Email duplicado (joao.silva@empresa.com)
   - Linha 7: Nome está vazio
```

## Observabilidade

A observabilidade permite monitorar, analisar e entender o comportamento da aplicação em produção. Com ela, podemos detectar problemas rapidamente, entender padrões de uso e melhorar a experiência do usuário.

### Pilares da Observabilidade

A observabilidade moderna se baseia em **três pilares fundamentais**:

1. **Logs (Registros)**: Eventos discretos que ocorrem na aplicação
2. **Metrics (Métricas)**: Valores numéricos medidos ao longo do tempo
3. **Traces (Rastreamento)**: Caminho de execução através de sistemas distribuídos

### Por que Observabilidade?

| Problema | Como a Observabilidade Ajuda |
|----------|------------------------------|
| Bug em produção que não reproduz localmente | Logs estruturados mostram exatamente o que aconteceu |
| Aplicação está lenta mas não sabemos onde | Métricas de performance identificam gargalos |
| Usuários reclamam de erro mas não conseguimos reproduzir | Error tracking captura stack traces e contexto |
| Não sabemos quais features são mais usadas | Analytics mostra padrões de uso real |
| Firestore está com custo alto | Métricas de queries mostram operações custosas |
| Aplicação caiu e não sabemos quando/por quê | Health checks e alertas detectam falhas imediatamente |

### 1. Logging Estruturado

Sistema de logs com níveis, contexto e persistência para análise posterior.

#### Interface de Logging

```typescript
// services/logging/types.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogContext {
  userId?: string;
  evaluationId?: string;
  action?: string;
  component?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  sessionId: string;
  userAgent: string;
  url: string;
}
```

#### Implementação do Logger

```typescript
// services/logging/logger.ts
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

class Logger {
  private sessionId: string;
  private isProduction: boolean;
  private logBuffer: LogEntry[] = [];
  private readonly BUFFER_SIZE = 10;
  private readonly FLUSH_INTERVAL = 30000; // 30 segundos

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = import.meta.env.PROD;

    // Flush periódico do buffer
    if (this.isProduction) {
      setInterval(() => this.flush(), this.FLUSH_INTERVAL);
    }

    // Flush ao sair da página
    window.addEventListener('beforeunload', () => this.flush());
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: Date.now(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    if (!this.isProduction) {
      // Em desenvolvimento, apenas console
      this.logToConsole(entry);
      return;
    }

    // Buffer para batch writes (mais eficiente)
    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.BUFFER_SIZE) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Envia em batch para Firestore
      await addDoc(collection(db, 'application_logs'), {
        logs: logsToSend,
        batchTimestamp: Date.now(),
      });
    } catch (error) {
      // Se falhar, volta para o console
      console.error('Failed to persist logs:', error);
      logsToSend.forEach(log => this.logToConsole(log));
    }
  }

  private logToConsole(entry: LogEntry): void {
    const style = this.getConsoleStyle(entry.level);
    const prefix = `[${entry.level.toUpperCase()}] ${new Date(entry.timestamp).toISOString()}`;

    console.log(
      `%c${prefix}`,
      style,
      entry.message,
      entry.context || '',
      entry.error || ''
    );
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      [LogLevel.DEBUG]: 'color: gray',
      [LogLevel.INFO]: 'color: blue',
      [LogLevel.WARN]: 'color: orange; font-weight: bold',
      [LogLevel.ERROR]: 'color: red; font-weight: bold',
      [LogLevel.CRITICAL]: 'color: white; background: red; font-weight: bold',
    };
    return styles[level];
  }

  // Métodos públicos
  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.persistLog(entry);
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.persistLog(entry);
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.persistLog(entry);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.persistLog(entry);
  }

  critical(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, error);
    this.persistLog(entry);

    // Logs críticos são enviados imediatamente
    this.flush();
  }
}

// Singleton
export const logger = new Logger();
```

#### Uso do Logger

```typescript
// Exemplo em um componente
import { logger } from '@/services/logging/logger';

function EvaluationForm() {
  const handleSubmit = async (data: FormData) => {
    logger.info('Iniciando envio de avaliação', {
      action: 'submit_evaluation',
      component: 'EvaluationForm',
      metadata: { evaluatedId: data.evaluatedId }
    });

    try {
      await submitEvaluation(data);

      logger.info('Avaliação enviada com sucesso', {
        action: 'submit_evaluation_success',
        evaluationId: data.evaluationId,
      });
    } catch (error) {
      logger.error(
        'Erro ao enviar avaliação',
        error as Error,
        {
          action: 'submit_evaluation_error',
          evaluationId: data.evaluationId,
        }
      );
    }
  };
}
```

### 2. Métricas de Performance

Monitoramento de Core Web Vitals e métricas customizadas de negócio.

#### Web Vitals Monitoring

```typescript
// services/metrics/webVitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import { logger } from '../logging/logger';

interface WebVitalsReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

class WebVitalsMonitor {
  private metrics: Map<string, number> = new Map();

  constructor() {
    this.initMonitoring();
  }

  private initMonitoring(): void {
    // Largest Contentful Paint (LCP)
    onLCP(this.handleMetric.bind(this));

    // First Input Delay (FID)
    onFID(this.handleMetric.bind(this));

    // Cumulative Layout Shift (CLS)
    onCLS(this.handleMetric.bind(this));

    // First Contentful Paint (FCP)
    onFCP(this.handleMetric.bind(this));

    // Time to First Byte (TTFB)
    onTTFB(this.handleMetric.bind(this));
  }

  private handleMetric(metric: Metric): void {
    const report: WebVitalsReport = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric),
      delta: metric.delta,
      id: metric.id,
    };

    this.metrics.set(metric.name, metric.value);

    // Log métrica
    logger.info(`Web Vital: ${metric.name}`, {
      component: 'WebVitalsMonitor',
      metadata: report,
    });

    // Envia para analytics
    this.sendToAnalytics(report);
  }

  private getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (metric.value <= threshold.good) return 'good';
    if (metric.value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private sendToAnalytics(report: WebVitalsReport): void {
    // Envia para Firebase Analytics ou outro serviço
    if (window.gtag) {
      window.gtag('event', report.name, {
        event_category: 'Web Vitals',
        value: Math.round(report.value),
        event_label: report.id,
        non_interaction: true,
      });
    }
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }
}

export const webVitalsMonitor = new WebVitalsMonitor();
```

#### Métricas Customizadas de Negócio

```typescript
// services/metrics/businessMetrics.ts
import { logger } from '../logging/logger';

interface MetricData {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: number;
}

class BusinessMetrics {
  private metrics: MetricData[] = [];

  // Métricas de tempo (duração de operações)
  recordDuration(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record(name, durationMs, 'ms', tags);
  }

  // Métricas de contagem
  recordCount(name: string, count: number, tags?: Record<string, string>): void {
    this.record(name, count, 'count', tags);
  }

  // Registro genérico
  private record(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    logger.debug(`Métrica: ${name}`, {
      component: 'BusinessMetrics',
      metadata: metric,
    });

    // Envia para analytics
    if (window.gtag) {
      window.gtag('event', name, {
        event_category: 'Business Metrics',
        value: Math.round(value),
        ...tags,
      });
    }
  }

  // Helper para medir duração de operações
  async measure<T>(
    operationName: string,
    operation: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      this.recordDuration(operationName, duration, {
        ...tags,
        status: 'success',
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordDuration(operationName, duration, {
        ...tags,
        status: 'error',
      });

      throw error;
    }
  }

  getMetrics(): MetricData[] {
    return [...this.metrics];
  }
}

export const businessMetrics = new BusinessMetrics();
```

#### Uso de Métricas

```typescript
// Exemplo de uso
import { businessMetrics } from '@/services/metrics/businessMetrics';

// Medir duração de query no Firestore
const members = await businessMetrics.measure(
  'firestore_query_team_members',
  async () => {
    return await getTeamMembers(evaluationId);
  },
  { evaluationId }
);

// Registrar evento de negócio
businessMetrics.recordCount('evaluation_completed', 1, {
  evaluationId,
  memberCount: members.length.toString(),
});

// Registrar tempo de criptografia
const startTime = performance.now();
const encrypted = encrypt(data);
businessMetrics.recordDuration(
  'crypto_encrypt_duration',
  performance.now() - startTime,
  { dataSize: data.length.toString() }
);
```

### 3. Error Tracking e Monitoring

Captura automática de erros com contexto rico para debugging.

#### Error Tracker Service

```typescript
// services/errorTracking/errorTracker.ts
import { logger } from '../logging/logger';

interface ErrorContext {
  userId?: string;
  evaluationId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface CapturedError {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: number;
  url: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTracker {
  private errors: CapturedError[] = [];
  private errorCounts: Map<string, number> = new Map();

  constructor() {
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    // Captura erros não tratados
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        component: 'GlobalErrorHandler',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      }, 'high');
    });

    // Captura Promise rejections não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        component: 'GlobalErrorHandler',
        action: 'unhandled_promise_rejection',
      }, 'high');
    });
  }

  captureError(
    error: Error | string,
    context: ErrorContext = {},
    severity: CapturedError['severity'] = 'medium'
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    const capturedError: CapturedError = {
      id: this.generateErrorId(),
      message: errorObj.message,
      stack: errorObj.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity,
    };

    this.errors.push(capturedError);

    // Conta ocorrências do mesmo erro
    const errorKey = `${errorObj.name}:${errorObj.message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Log baseado na severidade
    if (severity === 'critical') {
      logger.critical(errorObj.message, errorObj, context);
    } else {
      logger.error(errorObj.message, errorObj, context);
    }

    // Envia para serviço externo (Sentry, Rollbar, etc.)
    this.sendToExternalService(capturedError);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToExternalService(error: CapturedError): void {
    // Integração com Sentry (exemplo)
    if (window.Sentry) {
      window.Sentry.captureException(new Error(error.message), {
        level: error.severity,
        tags: {
          component: error.context.component,
          action: error.context.action,
        },
        extra: error.context.metadata,
      });
    }

    // Ou enviar para endpoint próprio
    if (import.meta.env.PROD) {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      }).catch(() => {
        // Silenciosamente falha se não conseguir enviar
        console.error('Failed to send error to tracking service');
      });
    }
  }

  getErrors(): CapturedError[] {
    return [...this.errors];
  }

  getErrorCounts(): Map<string, number> {
    return new Map(this.errorCounts);
  }
}

export const errorTracker = new ErrorTracker();

// Helper para uso em try-catch
export function withErrorTracking<T>(
  fn: () => T,
  context: ErrorContext
): T {
  try {
    return fn();
  } catch (error) {
    errorTracker.captureError(error as Error, context, 'medium');
    throw error;
  }
}

export async function withAsyncErrorTracking<T>(
  fn: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    errorTracker.captureError(error as Error, context, 'medium');
    throw error;
  }
}
```

#### Uso do Error Tracker

```typescript
import { errorTracker, withAsyncErrorTracking } from '@/services/errorTracking/errorTracker';

// Uso manual
try {
  await submitEvaluation(data);
} catch (error) {
  errorTracker.captureError(error as Error, {
    component: 'EvaluationForm',
    action: 'submit_evaluation',
    evaluationId: data.evaluationId,
  }, 'high');

  toast.error('Erro ao enviar avaliação');
}

// Uso com helper
const result = await withAsyncErrorTracking(
  () => submitEvaluation(data),
  {
    component: 'EvaluationForm',
    action: 'submit_evaluation',
    evaluationId: data.evaluationId,
  }
);
```

### 4. Analytics de Usuário

Rastreamento de comportamento e jornada do usuário.

#### Analytics Service

```typescript
// services/analytics/analytics.ts
import { logger } from '../logging/logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

interface UserProperties {
  userId?: string;
  role?: 'manager' | 'member';
  evaluationId?: string;
}

class Analytics {
  private userProperties: UserProperties = {};
  private events: AnalyticsEvent[] = [];

  // Definir propriedades do usuário
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };

    if (window.gtag) {
      window.gtag('set', 'user_properties', properties);
    }

    logger.info('User properties atualizadas', {
      component: 'Analytics',
      metadata: properties,
    });
  }

  // Rastrear evento
  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        ...this.userProperties,
      },
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }

    // Firebase Analytics
    if (window.firebase?.analytics) {
      window.firebase.analytics().logEvent(eventName, properties);
    }

    logger.info(`Analytics: ${eventName}`, {
      component: 'Analytics',
      metadata: properties,
    });
  }

  // Eventos específicos de negócio
  trackPageView(pageName: string): void {
    this.track('page_view', { page_name: pageName });
  }

  trackEvaluationCreated(evaluationId: string, memberCount: number): void {
    this.track('evaluation_created', {
      evaluation_id: evaluationId,
      member_count: memberCount,
    });
  }

  trackEvaluationCompleted(evaluationId: string, evaluatorId: string): void {
    this.track('evaluation_completed', {
      evaluation_id: evaluationId,
      evaluator_id: evaluatorId,
    });
  }

  trackExcelImport(memberCount: number, hasErrors: boolean): void {
    this.track('excel_import', {
      member_count: memberCount,
      has_errors: hasErrors,
    });
  }

  trackEmailSent(recipientCount: number, success: boolean): void {
    this.track('email_sent', {
      recipient_count: recipientCount,
      success,
    });
  }

  trackError(errorType: string, errorMessage: string): void {
    this.track('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
    });
  }

  // Funil de conversão
  trackFunnelStep(funnelName: string, step: string): void {
    this.track('funnel_step', {
      funnel_name: funnelName,
      step,
    });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

export const analytics = new Analytics();
```

#### Uso do Analytics

```typescript
import { analytics } from '@/services/analytics/analytics';

// Ao criar avaliação
analytics.trackEvaluationCreated(evaluationId, members.length);
analytics.trackFunnelStep('create_evaluation', 'step_1_basic_info');

// Ao completar avaliação
analytics.trackEvaluationCompleted(evaluationId, evaluatorId);

// Ao importar Excel
analytics.trackExcelImport(members.length, errors.length > 0);

// Ao navegar entre páginas
analytics.trackPageView('Dashboard');

// Ao enviar emails
analytics.trackEmailSent(recipients.length, success);
```

### 5. Health Monitoring Dashboard

Dashboard em tempo real para monitorar a saúde da aplicação.

#### Health Monitor com React

```typescript
// components/HealthMonitor.tsx
import { useState, useEffect } from 'react';
import { webVitalsMonitor } from '@/services/metrics/webVitals';
import { errorTracker } from '@/services/errorTracking/errorTracker';
import { logger } from '@/services/logging/logger';

interface HealthStatus {
  webVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    status: 'good' | 'warning' | 'critical';
  };
  errors: {
    count: number;
    lastError?: string;
  };
  firestore: {
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
  };
}

export function HealthMonitor() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Atualiza a cada 5 segundos
    const interval = setInterval(updateHealth, 5000);
    updateHealth();

    // Atalho: Ctrl+Shift+H para mostrar/ocultar
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        setIsVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const updateHealth = () => {
    const vitals = webVitalsMonitor.getMetrics();
    const errors = errorTracker.getErrors();

    const lcp = vitals.get('LCP');
    const fid = vitals.get('FID');
    const cls = vitals.get('CLS');

    let vitalsStatus: HealthStatus['webVitals']['status'] = 'good';
    if (lcp && lcp > 4000 || fid && fid > 300 || cls && cls > 0.25) {
      vitalsStatus = 'critical';
    } else if (lcp && lcp > 2500 || fid && fid > 100 || cls && cls > 0.1) {
      vitalsStatus = 'warning';
    }

    setHealth({
      webVitals: {
        lcp,
        fid,
        cls,
        status: vitalsStatus,
      },
      errors: {
        count: errors.length,
        lastError: errors[errors.length - 1]?.message,
      },
      firestore: {
        status: 'healthy', // Implementar health check real
        latency: 0,
      },
    });
  };

  if (!isVisible || !health) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border-2 border-gray-300 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Health Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Web Vitals */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Web Vitals</span>
          <StatusBadge status={health.webVitals.status} />
        </div>
        <div className="mt-1 space-y-1">
          {health.webVitals.lcp && (
            <MetricRow name="LCP" value={health.webVitals.lcp} unit="ms" threshold={2500} />
          )}
          {health.webVitals.fid && (
            <MetricRow name="FID" value={health.webVitals.fid} unit="ms" threshold={100} />
          )}
          {health.webVitals.cls && (
            <MetricRow name="CLS" value={health.webVitals.cls} unit="" threshold={0.1} />
          )}
        </div>
      </div>

      {/* Errors */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Errors</span>
          <span className={`text-xs ${health.errors.count > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {health.errors.count} errors
          </span>
        </div>
        {health.errors.lastError && (
          <p className="text-xs text-gray-600 mt-1 truncate">{health.errors.lastError}</p>
        )}
      </div>

      {/* Firestore */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Firestore</span>
          <StatusBadge status={health.firestore.status} />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        Press Ctrl+Shift+H to toggle
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    good: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    down: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}

function MetricRow({ name, value, unit, threshold }: any) {
  const isGood = value <= threshold;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600">{name}</span>
      <span className={isGood ? 'text-green-600' : 'text-red-600'}>
        {value.toFixed(value < 1 ? 3 : 0)}{unit}
      </span>
    </div>
  );
}
```

### 6. Firestore Queries Monitoring

Monitoramento específico de queries no Firestore para otimizar custos.

```typescript
// services/firestore/monitoredQuery.ts
import { Query, getDocs, QuerySnapshot } from 'firebase/firestore';
import { businessMetrics } from '../metrics/businessMetrics';
import { logger } from '../logging/logger';

export async function monitoredGetDocs<T>(
  query: Query,
  queryName: string
): Promise<QuerySnapshot<T>> {
  const startTime = performance.now();

  try {
    const snapshot = await getDocs(query) as QuerySnapshot<T>;
    const duration = performance.now() - startTime;
    const readCount = snapshot.size;

    // Registra métricas
    businessMetrics.recordDuration(`firestore_query_${queryName}`, duration, {
      read_count: readCount.toString(),
    });

    // Log para queries lentas (> 500ms)
    if (duration > 500) {
      logger.warn(`Slow Firestore query: ${queryName}`, {
        component: 'Firestore',
        metadata: {
          queryName,
          duration: `${duration.toFixed(2)}ms`,
          readCount,
        },
      });
    }

    // Log para queries com muitas leituras (> 100)
    if (readCount > 100) {
      logger.warn(`High read count query: ${queryName}`, {
        component: 'Firestore',
        metadata: {
          queryName,
          readCount,
          duration: `${duration.toFixed(2)}ms`,
        },
      });
    }

    return snapshot;
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error(`Firestore query failed: ${queryName}`, error as Error, {
      component: 'Firestore',
      metadata: {
        queryName,
        duration: `${duration.toFixed(2)}ms`,
      },
    });

    throw error;
  }
}

// Uso
const snapshot = await monitoredGetDocs(
  query(collection(db, 'team_members'), where('avaliation_id', '==', id)),
  'get_team_members'
);
```

### Benefícios da Observabilidade

| Benefício | Impacto |
|-----------|---------|
| **Detecção Rápida de Problemas** | Erros críticos são detectados e alertados em tempo real |
| **Debugging Facilitado** | Logs estruturados com contexto completo para reproduzir bugs |
| **Otimização de Performance** | Métricas identificam gargalos e operações lentas |
| **Redução de Custos** | Monitoramento de queries Firestore evita custos desnecessários |
| **Melhor Experiência do Usuário** | Core Web Vitals garantem aplicação rápida e responsiva |
| **Decisões Baseadas em Dados** | Analytics mostra como usuários realmente usam a aplicação |
| **Compliance e Auditoria** | Logs persistentes permitem auditoria de ações |

### Métricas Principais a Monitorar

#### Performance
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **Duração de queries Firestore**: < 500ms
- **Tempo de criptografia**: < 100ms para operações individuais

#### Negócio
- **Taxa de conclusão de avaliações**: % de avaliações completadas
- **Tempo médio para completar avaliação**: minutos
- **Taxa de importação via Excel**: % que usa Excel vs manual
- **Taxa de erro em importações**: % de importações com erros
- **Emails enviados com sucesso**: % de emails entregues

#### Erros
- **Taxa de erro global**: erros / total de operações
- **Erros por componente**: identificar componentes problemáticos
- **Erros críticos**: erros que impedem uso da aplicação
- **Tempo médio para detecção de erro**: em minutos

### Integração com Ferramentas Externas

#### Opção 1: Firebase Analytics (Gratuito)

```typescript
// services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Habilita debug mode em desenvolvimento
if (!import.meta.env.PROD) {
  window['ga-disable-GA_MEASUREMENT_ID'] = true;
}
```

#### Opção 2: Google Analytics 4 (Gratuito)

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### Opção 3: Sentry (Error Tracking - Gratuito até 5k eventos/mês)

```typescript
// main.tsx
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1, // 10% das transações
    environment: 'production',
  });
}
```

### Checklist de Observabilidade

#### Setup e Configuração
- [ ] **Instalar dependências:**
  - [ ] web-vitals
  - [ ] @sentry/react (opcional)
  - [ ] firebase/analytics (se usar Firebase)

- [ ] **Configurar serviços:**
  - [ ] Firebase Analytics ou Google Analytics 4
  - [ ] Sentry para error tracking (opcional)
  - [ ] Criar collection `application_logs` no Firestore

#### Implementação de Logging
- [ ] Implementar Logger service com níveis (debug, info, warn, error, critical)
- [ ] Implementar buffer de logs com flush periódico
- [ ] Implementar persistência de logs no Firestore
- [ ] Adicionar sessionId para rastrear sessões de usuário
- [ ] Implementar logs estruturados com contexto rico

#### Implementação de Métricas
- [ ] Implementar Web Vitals monitoring (LCP, FID, CLS, FCP, TTFB)
- [ ] Implementar BusinessMetrics service
- [ ] Criar métricas customizadas de negócio:
  - [ ] Duração de queries Firestore
  - [ ] Tempo de criptografia
  - [ ] Taxa de conclusão de avaliações
  - [ ] Tempo médio para completar avaliação
- [ ] Implementar helper `measure()` para timing automático

#### Implementação de Error Tracking
- [ ] Implementar ErrorTracker service
- [ ] Adicionar handlers globais (window.onerror, unhandledrejection)
- [ ] Implementar captura de erros com contexto
- [ ] Implementar contagem de ocorrências de erros
- [ ] Integrar com Sentry ou serviço similar (opcional)
- [ ] Criar helpers `withErrorTracking()` e `withAsyncErrorTracking()`

#### Implementação de Analytics
- [ ] Implementar Analytics service
- [ ] Configurar Firebase Analytics ou GA4
- [ ] Criar eventos de negócio:
  - [ ] `evaluation_created`
  - [ ] `evaluation_completed`
  - [ ] `excel_import`
  - [ ] `email_sent`
  - [ ] `page_view`
- [ ] Implementar tracking de funil de conversão
- [ ] Implementar user properties

#### Implementação de Monitoring
- [ ] Implementar Firestore queries monitoring
- [ ] Criar função `monitoredGetDocs()` para queries
- [ ] Implementar alertas para queries lentas (> 500ms)
- [ ] Implementar alertas para alto read count (> 100)
- [ ] Criar Health Monitor component (dashboard visual)

#### Integração na Aplicação
- [ ] Adicionar logging em operações críticas:
  - [ ] Criação de avaliação
  - [ ] Envio de avaliação
  - [ ] Importação de Excel
  - [ ] Envio de emails
  - [ ] Login/acesso
- [ ] Adicionar métricas em operações de performance:
  - [ ] Queries Firestore
  - [ ] Operações de criptografia
  - [ ] Renderização de listas grandes
- [ ] Adicionar error tracking em try-catch blocks
- [ ] Adicionar analytics events em ações de usuário

#### Testing e Validação
- [ ] Testar logging em desenvolvimento (console)
- [ ] Testar logging em produção (Firestore)
- [ ] Validar Web Vitals scores:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Testar captura de erros globais
- [ ] Validar envio de eventos para Analytics
- [ ] Testar Health Monitor dashboard (Ctrl+Shift+H)
- [ ] Verificar métricas no Firebase Console ou GA4

#### Monitoramento Contínuo
- [ ] Configurar alertas para erros críticos
- [ ] Monitorar Core Web Vitals semanalmente
- [ ] Revisar logs de erros quinzenalmente
- [ ] Analisar métricas de negócio mensalmente
- [ ] Otimizar queries lentas identificadas
- [ ] Ajustar thresholds de alertas conforme necessário

### Exemplo de Implementação Completa

```typescript
// App.tsx
import { useEffect } from 'react';
import { webVitalsMonitor } from '@/services/metrics/webVitals';
import { analytics } from '@/services/analytics/analytics';
import { HealthMonitor } from '@/components/HealthMonitor';

function App() {
  useEffect(() => {
    // Inicializa Web Vitals monitoring
    webVitalsMonitor; // Apenas importar já inicializa

    // Track page view
    analytics.trackPageView('App');

    // Set user properties quando autenticar
    const userId = getCurrentUserId();
    if (userId) {
      analytics.setUserProperties({
        userId,
        role: getUserRole(),
      });
    }
  }, []);

  return (
    <>
      <AppRoutes />
      {import.meta.env.DEV && <HealthMonitor />}
    </>
  );
}
```

## Testes - Pirâmide de Testes

A aplicação segue a **Pirâmide de Testes** para garantir qualidade com custo e tempo de execução otimizados.

### Conceito da Pirâmide de Testes

```
        ╱╲
       ╱E2E╲        ← Poucos (5-10%) - Lentos, caros, frágeis
      ╱──────╲         Testam fluxos completos de usuário
     ╱  Integr ╲     ← Médios (20-30%) - Médios, razoáveis
    ╱────────────╲      Testam integração entre componentes
   ╱    Unit      ╲   ← Muitos (60-70%) - Rápidos, baratos
  ╱────────────────╲     Testam funções e componentes isolados
```

**Princípios:**
- ✅ **Mais testes unitários** (rápidos, baratos, confiáveis)
- ✅ **Alguns testes de integração** (validam interações)
- ✅ **Poucos testes E2E** (validam fluxos críticos)
- ✅ **Coverage mínimo: 80%** (branches, functions, lines, statements)

### Ferramentas de Teste

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "playwright": "^1.40.0",
    "msw": "^2.0.0",
    "@faker-js/faker": "^8.0.0"
  }
}
```

**Stack de Testes:**
- **Vitest:** Test runner (compatível com Jest, mais rápido)
- **Testing Library:** Testes de componentes React
- **Playwright:** Testes E2E (Chrome, Firefox, Safari)
- **MSW (Mock Service Worker):** Mock de APIs
- **Faker:** Geração de dados de teste

### 1. Testes Unitários (Unit Tests)

Testam funções e componentes isolados. **60-70% dos testes**.

#### Exemplo: Validação de Email

```typescript
// utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { isValidEmail, sanitizeInput } from './validation';

describe('Email Validation', () => {
  it('should validate correct email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('should reject email too long', () => {
    const longEmail = 'a'.repeat(255) + '@example.com';
    expect(isValidEmail(longEmail)).toBe(false);
  });
});

describe('Input Sanitization', () => {
  it('should remove HTML tags', () => {
    const dirty = '<script>alert("xss")</script>Hello';
    expect(sanitizeInput(dirty)).toBe('Hello');
  });

  it('should remove dangerous attributes', () => {
    const dirty = '<img src=x onerror="alert(1)">';
    expect(sanitizeInput(dirty)).toBe('');
  });

  it('should preserve safe text', () => {
    const clean = 'Olá, mundo! 123';
    expect(sanitizeInput(clean)).toBe(clean);
  });
});
```

#### Exemplo: Utilitários de Criptografia

```typescript
// utils/crypto.test.ts
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, hashEmail, generateAccessCode } from './crypto';

describe('Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'Dados sensíveis';
    const key = 'test-key-123';

    const encrypted = encrypt(original, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });

  it('should fail with wrong key', () => {
    const encrypted = encrypt('data', 'key1');

    expect(() => decrypt(encrypted, 'key2')).toThrow();
  });

  it('should produce different ciphertext for same input', () => {
    // IV deve ser aleatório
    const text = 'same text';
    const key = 'same key';

    const encrypted1 = encrypt(text, key);
    const encrypted2 = encrypt(text, key);

    expect(encrypted1).not.toBe(encrypted2);
    expect(decrypt(encrypted1, key)).toBe(text);
    expect(decrypt(encrypted2, key)).toBe(text);
  });
});

describe('Hashing', () => {
  it('should hash email consistently', () => {
    const email = 'user@example.com';
    const hash1 = hashEmail(email);
    const hash2 = hashEmail(email);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(email);
  });

  it('should produce different hashes for different emails', () => {
    const hash1 = hashEmail('user1@example.com');
    const hash2 = hashEmail('user2@example.com');

    expect(hash1).not.toBe(hash2);
  });
});

describe('Access Code Generation', () => {
  it('should generate 6-digit code', () => {
    const code = generateAccessCode();

    expect(code).toMatch(/^\d{6}$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set();

    for (let i = 0; i < 100; i++) {
      codes.add(generateAccessCode());
    }

    expect(codes.size).toBeGreaterThan(90); // Alta chance de unicidade
  });
});
```

#### Exemplo: Cálculos de Performance O(N)

```typescript
// utils/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateProgress, calculateAverages } from './calculations';
import { faker } from '@faker-js/faker';

describe('Progress Calculation (O(N))', () => {
  it('should calculate progress correctly', () => {
    const members = [
      { id: '1', name: 'João' },
      { id: '2', name: 'Maria' },
      { id: '3', name: 'Pedro' },
    ];

    const responses = [
      { evaluator_id: '1', evaluated_id: '2' },
      { evaluator_id: '1', evaluated_id: '3' },
      { evaluator_id: '2', evaluated_id: '1' },
    ];

    const progress = calculateProgress(members, responses);

    expect(progress).toEqual([
      { memberId: '1', completed: 2, total: 2, percentage: 100 },
      { memberId: '2', completed: 1, total: 2, percentage: 50 },
      { memberId: '3', completed: 0, total: 2, percentage: 0 },
    ]);
  });

  it('should handle large datasets efficiently', () => {
    // Testa com 1000 membros
    const members = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      name: faker.person.fullName(),
    }));

    const responses = Array.from({ length: 50000 }, () => ({
      evaluator_id: faker.number.int({ min: 0, max: 999 }).toString(),
      evaluated_id: faker.number.int({ min: 0, max: 999 }).toString(),
    }));

    const startTime = performance.now();
    const progress = calculateProgress(members, responses);
    const duration = performance.now() - startTime;

    expect(progress).toHaveLength(1000);
    expect(duration).toBeLessThan(100); // Deve ser O(N), não O(N²)
  });
});
```

#### Exemplo: Validação de Excel

```typescript
// utils/excelParser.test.ts
import { describe, it, expect } from 'vitest';
import { validateMembers } from './excelParser';

describe('Excel Validation (O(N))', () => {
  it('should accept valid members', () => {
    const members = [
      { name: 'João Silva', email: 'joao@example.com' },
      { name: 'Maria Santos', email: 'maria@example.com' },
    ];

    const errors = validateMembers(members);
    expect(errors).toHaveLength(0);
  });

  it('should detect duplicates in O(N)', () => {
    const members = [
      { name: 'João', email: 'user@example.com' },
      { name: 'Maria', email: 'user@example.com' }, // duplicado
    ];

    const errors = validateMembers(members);
    expect(errors).toContain('Linha 3: Email duplicado (user@example.com)');
  });

  it('should validate minimum members', () => {
    const members = [{ name: 'João', email: 'joao@example.com' }];

    const errors = validateMembers(members);
    expect(errors).toContain('Mínimo de 2 membros necessário');
  });

  it('should detect empty fields', () => {
    const members = [
      { name: '', email: 'user@example.com' },
      { name: 'João', email: '' },
    ];

    const errors = validateMembers(members);
    expect(errors).toContain('Linha 2: Nome está vazio');
    expect(errors).toContain('Linha 3: Email está vazio');
  });
});
```

### 2. Testes de Integração (Integration Tests)

Testam a interação entre componentes e serviços. **20-30% dos testes**.

#### Exemplo: Formulário de Avaliação

```typescript
// components/EvaluationForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvaluationForm } from './EvaluationForm';

describe('EvaluationForm Integration', () => {
  it('should submit evaluation successfully', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();

    render(<EvaluationForm onSubmit={mockSubmit} />);

    // Preenche campos
    const q1 = screen.getByLabelText(/satisfação/i);
    await user.click(screen.getByRole('radio', { name: '5' }));

    const q2 = screen.getByLabelText(/proatividade/i);
    await user.click(screen.getAllByRole('radio', { name: '4' })[1]);

    const comments = screen.getByLabelText(/pontos positivos/i);
    await user.type(comments, 'Excelente trabalho em equipe');

    // Submete
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        question_1: 5,
        question_2: 4,
        positive_points: 'Excelente trabalho em equipe',
        // ...
      });
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();
    render(<EvaluationForm onSubmit={vi.fn()} />);

    // Tenta submeter sem preencher
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(await screen.findByText(/campo obrigatório/i)).toBeInTheDocument();
  });

  it('should sanitize inputs', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();

    render(<EvaluationForm onSubmit={mockSubmit} />);

    const comments = screen.getByLabelText(/pontos positivos/i);
    await user.type(comments, '<script>alert("xss")</script>Bom');

    await user.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          positive_points: 'Bom', // Script removido
        })
      );
    });
  });
});
```

#### Exemplo: Upload de Excel

```typescript
// components/ExcelUpload.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcelUpload } from './ExcelUpload';
import * as XLSX from 'xlsx';

describe('ExcelUpload Integration', () => {
  it('should upload and parse Excel file', async () => {
    const mockOnUpload = vi.fn();
    const user = userEvent.setup();

    render(<ExcelUpload onUpload={mockOnUpload} />);

    // Cria arquivo Excel mock
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Nome', 'Email'],
      ['João Silva', 'joao@example.com'],
      ['Maria Santos', 'maria@example.com'],
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Membros');

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const file = new File([buffer], 'membros.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Upload
    const input = screen.getByLabelText(/upload/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([
        { name: 'João Silva', email: 'joao@example.com' },
        { name: 'Maria Santos', email: 'maria@example.com' },
      ]);
    });

    expect(screen.getByText(/2 membros importados/i)).toBeInTheDocument();
  });

  it('should show errors for invalid Excel', async () => {
    const user = userEvent.setup();
    render(<ExcelUpload onUpload={vi.fn()} />);

    // Arquivo com erros
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Nome', 'Email'],
      ['João', 'invalid-email'], // email inválido
      ['', 'maria@example.com'],  // nome vazio
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Membros');

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const file = new File([buffer], 'membros.xlsx');

    const input = screen.getByLabelText(/upload/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Email inválido/i)).toBeInTheDocument();
      expect(screen.getByText(/Nome está vazio/i)).toBeInTheDocument();
    });
  });
});
```

#### Exemplo: Firestore com Mocks

```typescript
// services/firestore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTeamMembers, createEvaluation } from './firestore';
import { collection, getDocs, addDoc } from 'firebase/firestore';

// Mock do Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

describe('Firestore Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch team members', async () => {
    const mockMembers = [
      { id: '1', name: 'João', email: 'joao@example.com' },
      { id: '2', name: 'Maria', email: 'maria@example.com' },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockMembers.map(m => ({ id: m.id, data: () => m })),
      size: mockMembers.length,
    } as any);

    const members = await getTeamMembers('eval-123');

    expect(members).toHaveLength(2);
    expect(members[0].name).toBe('João');
  });

  it('should create evaluation with encryption', async () => {
    vi.mocked(addDoc).mockResolvedValue({ id: 'new-eval-id' } as any);

    const evaluation = {
      title: 'Avaliação Q4 2024',
      creator_email: 'manager@example.com',
    };

    const result = await createEvaluation(evaluation);

    expect(addDoc).toHaveBeenCalled();

    const callArgs = vi.mocked(addDoc).mock.calls[0][1];

    // Verifica que dados foram criptografados
    expect(callArgs.title).not.toBe('Avaliação Q4 2024');
    expect(callArgs.creator_email).not.toBe('manager@example.com');
  });
});
```

### 3. Testes E2E (End-to-End)

Testam fluxos completos de usuário. **5-10% dos testes**.

#### Configuração do Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Exemplo: Fluxo Completo de Criação de Avaliação

```typescript
// e2e/create-evaluation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Criar Avaliação - Fluxo Completo', () => {
  test('gestor cria avaliação e adiciona membros via Excel', async ({ page }) => {
    // 1. Navega para página de criação
    await page.goto('/criar-avaliacao');

    // 2. Preenche título
    await page.fill('[name="title"]', 'Avaliação Q4 2024 - Time Dev');

    // 3. Adiciona membros via Excel
    await page.click('text=Upload Excel');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./fixtures/membros.xlsx');

    // 4. Aguarda importação
    await expect(page.locator('text=5 membros importados')).toBeVisible();

    // 5. Verifica lista de membros
    await expect(page.locator('text=João Silva')).toBeVisible();
    await expect(page.locator('text=Maria Santos')).toBeVisible();

    // 6. Cria avaliação
    await page.click('button:has-text("Criar e Enviar Convites")');

    // 7. Aguarda confirmação
    await expect(page.locator('text=Avaliação criada com sucesso')).toBeVisible();

    // 8. Verifica redirecionamento para dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // 9. Verifica progresso inicial (0/20 avaliações)
    await expect(page.locator('text=0 / 20')).toBeVisible();
  });
});
```

#### Exemplo: Fluxo de Avaliação do Colaborador

```typescript
// e2e/submit-evaluation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Colaborador Completa Avaliação', () => {
  test('colaborador avalia todos os membros da equipe', async ({ page }) => {
    // 1. Acessa link da avaliação
    await page.goto('/avaliar/abc123');

    // 2. Insere código de acesso
    await page.fill('[name="accessCode"]', '123456');
    await page.click('button:has-text("Acessar")');

    // 3. Vê lista de membros para avaliar
    await expect(page.locator('text=Você precisa avaliar 4 pessoas')).toBeVisible();

    // 4. Avalia primeiro membro
    await page.click('text=Avaliar >> nth=0');

    // Preenche perguntas
    await page.click('[data-rating="5"]'); // Q1
    await page.click('[data-rating="4"]'); // Q2
    await page.click('[data-rating="5"]'); // Q3
    await page.click('[data-rating="4"]'); // Q4

    await page.fill('[name="positive_points"]', 'Excelente comunicação e proatividade');
    await page.fill('[name="improvement_points"]', 'Poderia melhorar documentação');

    await page.click('button:has-text("Enviar Avaliação")');

    // 5. Verifica progresso (1/4)
    await expect(page.locator('text=1 / 4 avaliações concluídas')).toBeVisible();

    // 6. Completa demais avaliações
    for (let i = 1; i < 4; i++) {
      await page.click('text=Avaliar >> nth=0');
      await page.click('[data-rating="4"]'); // Simplificado
      await page.fill('[name="positive_points"]', 'Bom trabalho');
      await page.click('button:has-text("Enviar Avaliação")');
    }

    // 7. Verifica conclusão
    await expect(page.locator('text=Todas as avaliações concluídas')).toBeVisible();
    await expect(page.locator('text=4 / 4 avaliações concluídas')).toBeVisible();
  });

  test('colaborador salva rascunho e continua depois', async ({ page }) => {
    await page.goto('/avaliar/abc123');
    await page.fill('[name="accessCode"]', '123456');
    await page.click('button:has-text("Acessar")');

    // Preenche parcialmente
    await page.click('text=Avaliar >> nth=0');
    await page.click('[data-rating="5"]');
    await page.click('[data-rating="4"]');

    // Salva como rascunho
    await page.click('button:has-text("Salvar Rascunho")');
    await expect(page.locator('text=Rascunho salvo')).toBeVisible();

    // Sai e volta
    await page.goto('/avaliar/abc123');
    await page.fill('[name="accessCode"]', '123456');
    await page.click('button:has-text("Acessar")');

    // Verifica que rascunho foi restaurado
    await page.click('text=Continuar >> nth=0');
    await expect(page.locator('[data-rating="5"][checked]')).toBeVisible();
  });
});
```

#### Exemplo: Fluxo de Resultados

```typescript
// e2e/view-results.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Ver Resultados - Gestor', () => {
  test('gestor vê resultados consolidados quando todos completam', async ({ page }) => {
    // Setup: Simula que todas as 20 avaliações foram completadas

    // 1. Acessa dashboard
    await page.goto('/dashboard/abc123?token=manager-token');

    // 2. Verifica que todas foram completadas
    await expect(page.locator('text=20 / 20 avaliações concluídas')).toBeVisible();

    // 3. Acessa resultados
    await page.click('button:has-text("Ver Resultados")');

    // 4. Vê resumo geral
    await expect(page.locator('text=Média Geral da Equipe')).toBeVisible();

    // 5. Seleciona um membro
    await page.click('text=João Silva');

    // 6. Verifica dados do membro
    await expect(page.locator('text=Média: 4.5')).toBeVisible();

    // 7. Verifica gráficos
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();

    // 8. Vê comentários anônimos
    await expect(page.locator('text=Pontos Positivos')).toBeVisible();
    await expect(page.locator('text=Excelente comunicação')).toBeVisible();

    // 9. Verifica anonimato (não deve mostrar quem avaliou)
    await expect(page.locator('text=Avaliado por')).not.toBeVisible();
  });
});
```

### 4. Testes de Performance

Validam que a aplicação atende aos requisitos de performance.

```typescript
// tests/performance.test.ts
import { describe, it, expect } from 'vitest';
import { calculateProgress } from '@/utils/calculations';
import { faker } from '@faker-js/faker';

describe('Performance Tests - Big O Validation', () => {
  it('calculateProgress should be O(N) not O(N²)', () => {
    const sizes = [10, 100, 1000];
    const times: number[] = [];

    sizes.forEach(size => {
      const members = Array.from({ length: size }, (_, i) => ({
        id: `${i}`,
        name: faker.person.fullName(),
      }));

      const responses = Array.from({ length: size * (size - 1) }, () => ({
        evaluator_id: faker.number.int({ min: 0, max: size - 1 }).toString(),
        evaluated_id: faker.number.int({ min: 0, max: size - 1 }).toString(),
      }));

      const start = performance.now();
      calculateProgress(members, responses);
      const duration = performance.now() - start;

      times.push(duration);
    });

    // Se for O(N), tempo deve crescer linearmente
    // Se for O(N²), cresceria exponencialmente

    const ratio10to100 = times[1] / times[0]; // ~10x
    const ratio100to1000 = times[2] / times[1]; // ~10x

    // Para O(N), ratio deve ser ~10
    // Para O(N²), ratio seria ~100
    expect(ratio10to100).toBeLessThan(50);
    expect(ratio100to1000).toBeLessThan(50);
  });

  it('component render should be fast for large lists', async () => {
    const { render } = await import('@testing-library/react');
    const { MemberList } = await import('@/components/MemberList');

    const members = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
    }));

    const start = performance.now();
    render(<MemberList members={members} />);
    const duration = performance.now() - start;

    // Com virtualização, deve renderizar rápido mesmo com 1000 items
    expect(duration).toBeLessThan(100);
  });
});
```

### Coverage Requirements

```json
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

**Metas de Coverage:**
- ✅ **Lines:** 80%+
- ✅ **Functions:** 80%+
- ✅ **Branches:** 80%+
- ✅ **Statements:** 80%+

### Scripts de Teste

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:run && npm run test:e2e"
  }
}
```

### CI/CD - GitHub Actions

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-integration:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit and integration tests
        run: npm run test:run

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Estratégia de Testes por Camada

| Camada | Tipo de Teste | Foco | Exemplos |
|--------|---------------|------|----------|
| **Utilitários** | Unit | Funções puras, algoritmos | Validação, criptografia, cálculos |
| **Componentes** | Unit + Integration | Renderização, interações | Formulários, cards, modals |
| **Serviços** | Integration | APIs, Firestore, EmailJS | Queries, mutations, email |
| **Fluxos** | E2E | Jornada completa do usuário | Criar avaliação, avaliar, ver resultados |

### Checklist de Testes

#### Setup
- [ ] Instalar Vitest + Testing Library
- [ ] Instalar Playwright
- [ ] Configurar vitest.config.ts com coverage
- [ ] Configurar playwright.config.ts
- [ ] Criar setup.ts com mocks globais
- [ ] Adicionar scripts no package.json
- [ ] Configurar GitHub Actions para CI

#### Testes Unitários (60-70%)
- [ ] Validações (email, nome, rating, comentários)
- [ ] Sanitização de inputs (DOMPurify)
- [ ] Criptografia (encrypt, decrypt, hash)
- [ ] Geração de códigos e tokens
- [ ] Cálculos de progresso (O(N))
- [ ] Cálculos de médias (O(log N + M))
- [ ] Validação de Excel (O(N))
- [ ] Utilitários de data e formatação

#### Testes de Integração (20-30%)
- [ ] Formulário de criação de avaliação
- [ ] Formulário de avaliação (ratings + comentários)
- [ ] Upload e parsing de Excel
- [ ] Dashboard de progresso
- [ ] Resultados consolidados
- [ ] Firestore queries (com mocks)
- [ ] EmailJS (com mocks)
- [ ] Integração React Hook Form + Zod

#### Testes E2E (5-10%)
- [ ] Fluxo completo: Criar avaliação com Excel
- [ ] Fluxo completo: Colaborador avalia todos
- [ ] Fluxo completo: Gestor vê resultados
- [ ] Salvamento de rascunho
- [ ] Validação de códigos de acesso
- [ ] Responsividade (mobile, tablet, desktop)

#### Testes de Performance
- [ ] Validar O(N) em cálculos de progresso
- [ ] Validar renderização com virtualização
- [ ] Validar queries Firestore com índices
- [ ] Validar bundle size < 350KB
- [ ] Validar Web Vitals (LCP, FID, CLS)

#### Coverage
- [ ] Atingir 80%+ em lines, functions, branches, statements
- [ ] Gerar relatório HTML de coverage
- [ ] Integrar com Codecov (opcional)
- [ ] Monitorar coverage em cada PR

### Benefícios da Pirâmide de Testes

| Benefício | Impacto |
|-----------|---------|
| **Detecção Rápida de Bugs** | Unit tests rodam em < 1s, feedback imediato |
| **Refatoração Segura** | Testes garantem que mudanças não quebram funcionalidade |
| **Documentação Viva** | Testes mostram como usar cada função/componente |
| **Custo Reduzido** | Mais unit tests (baratos) vs E2E tests (caros) |
| **Confiança no Deploy** | Coverage 80%+ garante qualidade |
| **CI/CD Eficiente** | Testes rápidos permitem deploy frequente |

### TDD (Test-Driven Development)

Para novas features, seguir TDD:

1. **Red:** Escrever teste que falha
2. **Green:** Implementar código mínimo para passar
3. **Refactor:** Melhorar código mantendo testes passando

```typescript
// Exemplo de TDD

// 1. RED - Teste que falha
it('should calculate evaluation average', () => {
  const responses = [
    { q1: 5, q2: 4, q3: 5, q4: 4 },
    { q1: 4, q2: 4, q3: 3, q4: 5 },
  ];

  expect(calculateAverage(responses)).toBe(4.25);
});

// 2. GREEN - Implementação mínima
function calculateAverage(responses) {
  const total = responses.reduce((sum, r) =>
    sum + r.q1 + r.q2 + r.q3 + r.q4, 0
  );
  return total / (responses.length * 4);
}

// 3. REFACTOR - Melhorar sem quebrar teste
function calculateAverage(responses) {
  if (responses.length === 0) return 0;

  const questions = ['q1', 'q2', 'q3', 'q4'];
  const total = responses.reduce((sum, response) =>
    sum + questions.reduce((qSum, q) => qSum + response[q], 0),
    0
  );

  return total / (responses.length * questions.length);
}
```

## Construção por Fases

A aplicação será desenvolvida de forma **iterativa e incremental**, seguindo o conceito de **MVP (Minimum Viable Product)** e evoluções graduais. Cada fase entrega valor e pode ser testada independentemente.

### Conceito de Desenvolvimento por Fases

```
Fase 1 (MVP)  →  Fase 2  →  Fase 3  →  Fase 4
   ✅             ✅         ✅         ✅
Deploy 1      Deploy 2   Deploy 3   Deploy 4

Cada fase adiciona funcionalidades mantendo o que já funciona
```

**Princípios:**
- ✅ **Entregas incrementais** - Deploy frequente de valor
- ✅ **Funcionalidades completas** - Cada fase entrega features prontas
- ✅ **Testes em cada fase** - Garantia de qualidade contínua
- ✅ **Feedback rápido** - Validação com usuários reais
- ✅ **Redução de risco** - Problemas detectados cedo

### Fase 1: MVP - Core Funcional (2-3 semanas)

**Objetivo:** Aplicação funcional básica para criar avaliações e coletar respostas.

#### Features

**1.1 Setup e Infraestrutura**
- [ ] Criar projeto React + Vite + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Configurar Firebase Firestore
- [ ] Configurar EmailJS
- [ ] Criar estrutura de pastas
- [ ] Configurar variáveis de ambiente
- [ ] Setup inicial de testes (Vitest)

**1.2 Autenticação e Segurança Básica**
- [ ] Sistema de tokens UUID para gestores
- [ ] Códigos de acesso de 6 dígitos para colaboradores
- [ ] Validação de email e nome
- [ ] Sanitização básica com DOMPurify

**1.3 Criação de Avaliação (Gestor) - Manual**
- [ ] Página de criação de avaliação
- [ ] Formulário: título + adicionar membros manualmente
- [ ] Validação de duplicados (O(N) com Set)
- [ ] Criar avaliação no Firestore
- [ ] Envio de emails via EmailJS
- [ ] Dashboard básico de acompanhamento

**1.4 Avaliação (Colaborador)**
- [ ] Página de acesso com código
- [ ] Lista de membros a avaliar
- [ ] Formulário de avaliação (4 perguntas + 2 comentários)
- [ ] Salvar respostas no Firestore
- [ ] Progresso visual (X/Y concluídas)

**1.5 Resultados Básicos (Gestor)**
- [ ] Visualizar quando todos completaram
- [ ] Médias por pessoa (sem gráficos)
- [ ] Lista de comentários anônimos
- [ ] Cálculo de médias otimizado (O(log N + M))

#### Testes da Fase 1
- [ ] Testes unitários de validação
- [ ] Testes de integração do formulário
- [ ] 1 teste E2E: Fluxo completo básico
- [ ] Coverage mínimo: 70%

#### Critérios de Conclusão
- ✅ Gestor consegue criar avaliação manualmente
- ✅ Emails são enviados automaticamente
- ✅ Colaborador consegue avaliar todos
- ✅ Gestor vê resultados consolidados
- ✅ Dados criptografados (AES-256)
- ✅ Aplicação deployada no GitHub Pages
- ✅ Testes passando no CI/CD

#### Não inclui (para próximas fases)
- ❌ Import de Excel
- ❌ Gráficos visuais
- ❌ Salvamento de rascunho
- ❌ Design system completo
- ❌ Observabilidade
- ❌ Resiliência avançada

---

### Fase 2: Features Essenciais (2 semanas)

**Objetivo:** Adicionar features que melhoram significativamente a experiência.

#### Features

**2.1 Import de Excel**
- [ ] Template Excel para download
- [ ] Upload de arquivo com drag & drop
- [ ] Parsing e validação de Excel (O(N))
- [ ] Feedback visual de erros
- [ ] Testes unitários de parsing

**2.2 Salvamento de Rascunho**
- [ ] Salvar avaliação parcialmente no Firestore
- [ ] Restaurar rascunho ao retornar
- [ ] Indicador visual de rascunho salvo
- [ ] Testes de integração de rascunho

**2.3 Gráficos e Visualizações**
- [ ] Implementar Recharts
- [ ] Gráfico de radar para cada pessoa
- [ ] Gráfico de barras comparativo da equipe
- [ ] Progress rings animados (Framer Motion)
- [ ] Testes de renderização de gráficos

**2.4 Design System Completo**
- [ ] Design tokens (cores, espaçamentos)
- [ ] Componentes base (Button, Input, Card)
- [ ] Tipografia com Inter
- [ ] Sistema de rating visual (1-5)
- [ ] Toast notifications
- [ ] Skeleton screens

#### Testes da Fase 2
- [ ] Testes unitários de Excel parsing
- [ ] Testes de integração de upload
- [ ] Testes de rascunho (E2E)
- [ ] Testes de componentes visuais
- [ ] Coverage mínimo: 75%

#### Critérios de Conclusão
- ✅ Gestor importa membros via Excel
- ✅ Colaborador salva e continua depois
- ✅ Resultados exibidos com gráficos bonitos
- ✅ UI moderna e profissional
- ✅ Todos os testes passando

#### Deploy da Fase 2
- Deploy automático no GitHub Pages
- Mantém compatibilidade com Fase 1

---

### Fase 3: Segurança e Performance (1-2 semanas)

**Objetivo:** Garantir que a aplicação é segura e performática.

#### Features

**3.1 Segurança OWASP Top 10**
- [ ] Rate limiting (5 tentativas)
- [ ] Lockout após tentativas falhas
- [ ] Headers de segurança (CSP, HSTS, etc.)
- [ ] Firestore Security Rules completas
- [ ] Expiração de tokens (90 dias)
- [ ] Logs de segurança
- [ ] Testes de segurança

**3.2 Performance - Big O**
- [ ] Implementar React.memo em componentes
- [ ] useMemo/useCallback em cálculos
- [ ] Virtualização (react-window) para listas > 50
- [ ] Code splitting por rota
- [ ] Lazy loading de componentes
- [ ] Web Worker para criptografia
- [ ] Testes de performance (< 100ms)

**3.3 Firestore Otimizações**
- [ ] Criar índices compostos
- [ ] Queries otimizadas (O(log N))
- [ ] Batch operations
- [ ] Paginação para grandes datasets
- [ ] Testes de queries

#### Testes da Fase 3
- [ ] Testes de validação O(N)
- [ ] Testes de renderização com 1000 items
- [ ] Testes de security (npm audit)
- [ ] Lighthouse audit (> 90)
- [ ] Coverage mínimo: 80%

#### Critérios de Conclusão
- ✅ OWASP Top 10 2021: Todos protegidos
- ✅ Lighthouse Performance > 90
- ✅ Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- ✅ Bundle size < 350KB gzipped
- ✅ Nenhum algoritmo O(N²) em produção
- ✅ npm audit: Zero vulnerabilidades críticas/altas

---

### Fase 4: Resiliência e Observabilidade (1-2 semanas)

**Objetivo:** Aplicação robusta e monitorada em produção.

#### Features

**4.1 Resiliência**
- [ ] Retry com exponential backoff
- [ ] Circuit Breaker pattern
- [ ] Timeout configurations
- [ ] Fallback strategies
- [ ] Error Boundaries React
- [ ] Offline support com sync queue
- [ ] Health checks
- [ ] Testes de resiliência

**4.2 Observabilidade**
- [ ] Logger estruturado (debug, info, warn, error, critical)
- [ ] Web Vitals monitoring (LCP, FID, CLS)
- [ ] Business metrics (duração, contagem)
- [ ] Error tracker (global handlers)
- [ ] Analytics de usuário
- [ ] Health Monitor dashboard (Dev)
- [ ] Firestore queries monitoring
- [ ] Testes de observabilidade

**4.3 Integrações**
- [ ] Firebase Analytics
- [ ] Google Analytics 4 (opcional)
- [ ] Sentry para error tracking (opcional)
- [ ] Codecov para coverage (opcional)

#### Testes da Fase 4
- [ ] Testes de retry logic
- [ ] Testes de circuit breaker
- [ ] Testes de offline queue
- [ ] Validação de logs
- [ ] Coverage mínimo: 80%

#### Critérios de Conclusão
- ✅ Retry automático em falhas transitórias
- ✅ Circuit breaker previne cascata de falhas
- ✅ App funciona offline básico
- ✅ Logs persistidos no Firestore
- ✅ Web Vitals monitorados
- ✅ Erros capturados com contexto completo
- ✅ Health Monitor funcionando (Ctrl+Shift+H)

---

### Fase 5: Testes Completos e Polish (1 semana)

**Objetivo:** Garantir qualidade máxima e refinamento final.

#### Features

**5.1 Testes Completos**
- [ ] Completar testes unitários (60-70%)
- [ ] Completar testes de integração (20-30%)
- [ ] Completar testes E2E (5-10%)
- [ ] Testes de performance
- [ ] Coverage: 80%+ em todos os aspectos

**5.2 CI/CD Completo**
- [ ] GitHub Actions: Tests
- [ ] GitHub Actions: Deploy
- [ ] GitHub Actions: Security Audit
- [ ] Dependabot configurado
- [ ] Codecov integration

**5.3 Documentação**
- [ ] README.md completo
- [ ] PLANO.md completo
- [ ] Comentários em código
- [ ] JSDoc em funções principais
- [ ] .env.example atualizado

**5.4 Polish e Refinamento**
- [ ] Animações suaves (Framer Motion)
- [ ] Micro-interações
- [ ] Mensagens de erro amigáveis
- [ ] Loading states elegantes
- [ ] Responsividade (mobile, tablet, desktop)
- [ ] Acessibilidade (A11y)

#### Testes da Fase 5
- [ ] Todos os testes passando
- [ ] Coverage 80%+ verificado
- [ ] Lighthouse 95+ em todas as métricas
- [ ] Testes manuais em múltiplos browsers
- [ ] Testes manuais mobile

#### Critérios de Conclusão
- ✅ Coverage: 80%+ (lines, functions, branches, statements)
- ✅ Lighthouse: 95+ (Performance, A11y, Best Practices, SEO)
- ✅ Todos os testes E2E passando
- ✅ CI/CD completo e funcionando
- ✅ Documentação completa
- ✅ Zero bugs conhecidos críticos

---

### Roadmap Visual

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│  Fase 1     │  Fase 2     │  Fase 3     │  Fase 4     │  Fase 5     │
│  MVP        │  Features   │  Sec + Perf │  Obs + Res  │  Polish     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ • Setup     │ • Excel     │ • OWASP     │ • Retry     │ • Testes    │
│ • Auth      │ • Rascunho  │ • Big O     │ • Circuit   │ • CI/CD     │
│ • Criar     │ • Gráficos  │ • Vitals    │ • Logs      │ • Docs      │
│ • Avaliar   │ • Design    │ • Bundle    │ • Metrics   │ • A11y      │
│ • Resultado │             │ • Índices   │ • Offline   │ • Polish    │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Deploy 1    │ Deploy 2    │ Deploy 3    │ Deploy 4    │ Deploy Final│
│ ✅ MVP      │ ✅ UX       │ ✅ Fast     │ ✅ Robust   │ ✅ Production│
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘

  Semanas:     2-3           2             1-2           1-2           1
  Total: 7-10 semanas (1.5-2.5 meses)
```

### Estratégia de Deploy

#### Deploy Contínuo

Cada fase é deployada assim que completa:

```yaml
# Estratégia de branches
main          →  Produção (GitHub Pages)
develop       →  Staging (Preview)
feature/*     →  Feature branches (PRs)
```

**Workflow:**
1. Desenvolver feature em `feature/nome-feature`
2. Abrir PR para `develop`
3. Rodar testes automaticamente
4. Merge para `develop` → Deploy staging
5. Testar em staging
6. Merge para `main` → Deploy produção

#### Releases

```
v1.0.0  →  Fase 1 (MVP)
v1.1.0  →  Fase 2 (Excel + Gráficos)
v1.2.0  →  Fase 3 (Segurança + Performance)
v1.3.0  →  Fase 4 (Resiliência + Observabilidade)
v2.0.0  →  Fase 5 (Release Final)
```

### Priorização de Features

#### Must Have (Fase 1)
- ✅ Criar avaliação manual
- ✅ Enviar emails
- ✅ Avaliar todos os membros
- ✅ Ver resultados básicos
- ✅ Dados criptografados

#### Should Have (Fase 2)
- ✅ Import de Excel
- ✅ Gráficos visuais
- ✅ Salvamento de rascunho
- ✅ Design moderno

#### Nice to Have (Fases 3-4)
- ✅ Segurança OWASP Top 10
- ✅ Performance otimizada
- ✅ Resiliência
- ✅ Observabilidade

#### Polish (Fase 5)
- ✅ Animações
- ✅ Acessibilidade
- ✅ Testes completos
- ✅ Documentação

### Gerenciamento de Riscos por Fase

#### Riscos Técnicos

| Risco | Fase | Mitigação |
|-------|------|-----------|
| Criptografia complexa | 1 | Usar crypto-js bem documentado, testes extensivos |
| Performance com muitos membros | 3 | Big O desde o início, testes de carga |
| Firestore limits (free tier) | 3 | Índices otimizados, cache inteligente |
| Emails não entregues (EmailJS) | 1 | Fallback, retry, logs |
| Compatibilidade browsers | 5 | Testes cross-browser, polyfills |

#### Riscos de Prazo

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Fase 1 atrasada | Alto | Simplificar design, focar no core |
| Testes demorando | Médio | Paralelizar, usar CI/CD eficiente |
| Bugs em produção | Alto | Coverage 80%+, testes E2E críticos |
| Documentação incompleta | Baixo | Documentar durante desenvolvimento |

### Métricas de Sucesso por Fase

#### Fase 1 (MVP)
- ✅ 1 avaliação criada com sucesso
- ✅ 5 emails enviados com sucesso
- ✅ 5 avaliações completadas
- ✅ Resultados visualizados corretamente
- ✅ Zero erros críticos em 24h

#### Fase 2 (Features)
- ✅ 1 import Excel com 50+ membros
- ✅ 10+ rascunhos salvos e restaurados
- ✅ Gráficos renderizando < 100ms
- ✅ Design aprovado por stakeholder

#### Fase 3 (Segurança + Performance)
- ✅ Lighthouse Performance > 90
- ✅ LCP < 2.5s, FID < 100ms, CLS < 0.1
- ✅ npm audit: 0 vulnerabilidades críticas
- ✅ Bundle < 350KB gzipped

#### Fase 4 (Resiliência + Observabilidade)
- ✅ 99% uptime em 1 semana
- ✅ Retry automático funcionando
- ✅ Logs capturando 100% dos erros
- ✅ Web Vitals monitorados

#### Fase 5 (Polish)
- ✅ Coverage 80%+
- ✅ Lighthouse 95+ em todas as métricas
- ✅ Acessibilidade WCAG AA
- ✅ Zero bugs conhecidos críticos

### Exemplo de Sprint (Fase 1 - Semana 1)

```
Sprint 1 (5 dias) - Setup e Autenticação

Segunda-feira:
  - [ ] Setup projeto React + Vite + TypeScript (2h)
  - [ ] Configurar Tailwind CSS (1h)
  - [ ] Configurar Firebase Firestore (2h)
  - [ ] Estrutura de pastas (1h)

Terça-feira:
  - [ ] Configurar EmailJS (2h)
  - [ ] Sistema de tokens UUID (3h)
  - [ ] Códigos de acesso 6 dígitos (2h)

Quarta-feira:
  - [ ] Validação de email/nome (2h)
  - [ ] Sanitização com DOMPurify (2h)
  - [ ] Testes unitários de validação (3h)

Quinta-feira:
  - [ ] Página de criação de avaliação (4h)
  - [ ] Formulário de adicionar membros (3h)

Sexta-feira:
  - [ ] Criar avaliação no Firestore (3h)
  - [ ] Envio de emails via EmailJS (2h)
  - [ ] Testes de integração (2h)
  - [ ] Deploy primeira versão

Daily Standup (15min):
  - O que fiz ontem?
  - O que farei hoje?
  - Algum bloqueio?

Sprint Review (Sexta tarde):
  - Demo da funcionalidade
  - Feedback
  - Ajustes no backlog

Retrospectiva (Sexta final):
  - O que foi bem?
  - O que melhorar?
  - Ações para próxima sprint
```

### Transição Entre Fases

**Antes de avançar para próxima fase:**

1. ✅ **Todos os critérios de conclusão atingidos**
2. ✅ **Testes passando**
3. ✅ **Deploy em produção funcionando**
4. ✅ **Documentação atualizada**
5. ✅ **Review de código completo**
6. ✅ **Sem bugs críticos conhecidos**

**Checklist de Transição:**

```markdown
## Transição Fase X → Fase X+1

- [ ] Critérios de conclusão da Fase X: ✅
- [ ] Coverage mínimo atingido: ✅
- [ ] Deploy em produção: ✅
- [ ] Lighthouse audit: ✅
- [ ] Testes E2E passando: ✅
- [ ] Documentação atualizada: ✅
- [ ] Stakeholder approval: ✅
- [ ] Retrospectiva realizada: ✅

Aprovado para iniciar Fase X+1: [ ]
Data: ___________
Responsável: ___________
```

## Checklist de Implementação

### Setup Inicial
- [ ] Configurar projeto React + Vite + TypeScript
- [ ] Instalar dependências principais:
  - [ ] React Router v6
  - [ ] Tailwind CSS + shadcn/ui
  - [ ] Lucide React (ícones)
  - [ ] Recharts (gráficos)
  - [ ] Framer Motion (animações)
  - [ ] xlsx (SheetJS)
  - [ ] React Hook Form + Zod
  - [ ] crypto-js (criptografia)
  - [ ] uuid (geração de tokens)
  - [ ] dompurify (sanitização)
  - [ ] @types/dompurify
  - [ ] react-window (virtualização)
  - [ ] lodash (debounce/throttle)
- [ ] Configurar Tailwind CSS e design tokens
- [ ] Adicionar fonte Inter do Google Fonts
- [ ] Criar arquivo `.env.example` com variáveis de ambiente
- [ ] Adicionar `.env` no `.gitignore`
- [ ] Configurar ESLint com plugin de segurança
- [ ] Configurar Vite para otimizações:
  - [ ] Manual chunks (vendor splitting)
  - [ ] Terser minification
  - [ ] Tree shaking
  - [ ] optimizeDeps

### Configuração de Serviços
- [ ] Criar projeto no Firebase Console
- [ ] Configurar Firestore Database e criar esquema de dados
- [ ] **Criar índices compostos no Firestore (crítico para performance):**
  - [ ] Índice: avaliation_id + evaluator_id
  - [ ] Índice: avaliation_id + evaluated_id
  - [ ] Índice: avaliation_id + completed_evaluations
- [ ] Criar conta no EmailJS e configurar template de email
- [ ] Adicionar credenciais como GitHub Secrets

### Infraestrutura
- [ ] Criar workflow do GitHub Actions (`.github/workflows/deploy.yml`)
- [ ] Configurar GitHub Pages no repositório
- [ ] Implementar sistema de criptografia (crypto-js)
- [ ] Configurar Firebase/EmailJS no código usando variáveis de ambiente

### Design System e Componentes Base
- [ ] Criar arquivo de design tokens (cores, espaçamentos, tipografia)
- [ ] Implementar componentes compartilhados (shared):
  - [ ] Header com logo e navegação
  - [ ] Footer
  - [ ] Loading (spinner + skeleton screens)
  - [ ] ProgressBar (linear)
  - [ ] ProgressRing (circular)
  - [ ] Button (primary, secondary, tertiary, icon)
  - [ ] Input (text, email, textarea, date)
  - [ ] Card (container básico)
  - [ ] Badge/Tag (status indicators)
  - [ ] Toast notifications
  - [ ] Modal/Dialog
- [ ] Implementar sistema de rating visual (1-5 com cores)
- [ ] Criar layout base com breadcrumbs

### Desenvolvimento - Utilitários
- [ ] Criar interfaces TypeScript e tipos
- [ ] Implementar utilitários Excel:
  - [ ] Função para gerar template Excel
  - [ ] Função para validar arquivo Excel (O(N) com Set)
  - [ ] Função para importar dados do Excel
- [ ] Implementar utilitários de criptografia:
  - [ ] Funções encrypt/decrypt
  - [ ] Web Worker para operações pesadas
- [ ] Implementar validadores de formulário:
  - [ ] Validador de email (O(1))
  - [ ] Validador de duplicados (O(N) com Set)
- [ ] Implementar utilitários de performance:
  - [ ] Função debounce
  - [ ] Função throttle
  - [ ] Hook useDebounce
  - [ ] Hook useCryptoWorker

### Desenvolvimento - Gestor
- [ ] Desenvolver componentes de upload Excel:
  - [ ] Componente de download de template
  - [ ] Componente de drag & drop para upload
  - [ ] Componente de lista de membros importados
- [ ] Desenvolver página de criação de avaliação:
  - [ ] Etapa 1: Informações básicas
  - [ ] Etapa 2: Adicionar membros (manual + Excel)
  - [ ] Preview antes de enviar
- [ ] Desenvolver dashboard de acompanhamento:
  - [ ] Visão geral com progress rings
  - [ ] Lista de progresso por membro
  - [ ] Filtros e busca
- [ ] Desenvolver página de resultados consolidados:
  - [ ] Resultados por pessoa
  - [ ] Gráficos de desempenho
  - [ ] Listagem de comentários
  - [ ] Exportação para PDF

### Desenvolvimento - Colaborador
- [ ] Desenvolver página de acesso (código)
- [ ] Desenvolver lista de membros a avaliar:
  - [ ] Separar pendentes e concluídas (O(N) com Set)
  - [ ] Mostrar progresso pessoal
  - [ ] Virtualização se > 50 membros
- [ ] Desenvolver formulário de avaliação:
  - [ ] Rating visual (1-5)
  - [ ] Campos de comentários
  - [ ] Salvamento de rascunho
  - [ ] Validações
- [ ] Desenvolver página de sucesso/conclusão

### Performance - Implementação
- [ ] **Algoritmos Otimizados (Big O):**
  - [ ] Calcular progresso: O(N) com Map
  - [ ] Calcular médias: O(log N + M) com índices
  - [ ] Validar duplicados: O(N) com Set
  - [ ] Buscar membros: O(N + M) com Set
  - [ ] NENHUM algoritmo O(N²) em código crítico

- [ ] **React Performance:**
  - [ ] Implementar React.memo em componentes pesados:
    - [ ] MemberProgressCard
    - [ ] EvaluationForm
    - [ ] ResultsCard
  - [ ] Implementar useMemo para cálculos complexos:
    - [ ] Cálculo de percentuais
    - [ ] Cálculo de médias
    - [ ] Filtragens complexas
  - [ ] Implementar useCallback para funções:
    - [ ] Event handlers
    - [ ] Callbacks de formulários
  - [ ] Lazy loading de rotas:
    - [ ] Dashboard
    - [ ] Results
    - [ ] CreateAvaliation
  - [ ] Suspense com loading states

- [ ] **Virtualização:**
  - [ ] Implementar react-window em listas:
    - [ ] Lista de membros (> 50 items)
    - [ ] Lista de comentários (> 20 items)
    - [ ] Lista de avaliações pendentes

- [ ] **Firestore Queries:**
  - [ ] Implementar queries otimizadas (com índices)
  - [ ] Batch reads quando possível
  - [ ] Paginação para grandes datasets
  - [ ] Cache de queries frequentes

- [ ] **Bundle Optimization:**
  - [ ] Code splitting por rota
  - [ ] Vendor chunks separados
  - [ ] Dynamic imports
  - [ ] Tree shaking verificado

- [ ] **Outros:**
  - [ ] Debounce em buscas (300ms)
  - [ ] Throttle em scroll events (100ms)
  - [ ] Web Worker para criptografia pesada
  - [ ] Lazy loading de imagens
  - [ ] Font optimization (preload)

### Segurança - Implementação
- [ ] Implementar sistema de criptografia:
  - [ ] Funções de encrypt/decrypt (AES-256)
  - [ ] Funções de hash (SHA-256)
  - [ ] Geração de chaves únicas
- [ ] Implementar validações e sanitização:
  - [ ] Validador de email
  - [ ] Validador de nome
  - [ ] Validador de rating
  - [ ] Sanitização com DOMPurify
  - [ ] Validador de comentários
  - [ ] Validador de arquivos Excel
- [ ] Implementar autenticação segura:
  - [ ] Geração de tokens UUID
  - [ ] Geração de códigos de acesso
  - [ ] Verificação de códigos com hash
  - [ ] Rate limiting
  - [ ] Lockout após tentativas
  - [ ] Expiração de tokens
- [ ] Implementar logging de segurança:
  - [ ] Interface SecurityLog
  - [ ] Função logSecurityEvent
  - [ ] Collection de logs no Firestore
- [ ] Configurar headers de segurança (vite.config.ts):
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] HSTS
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy
- [ ] Implementar Firestore Security Rules:
  - [ ] Deny by default
  - [ ] Rules para avaliations
  - [ ] Rules para team_members
  - [ ] Rules para responses
  - [ ] Rules para security_logs
- [ ] Configurar workflows de segurança:
  - [ ] security.yml (audit semanal)
  - [ ] dependabot.yml (atualizações)
- [ ] Implementar proteções específicas:
  - [ ] Proteção Path Traversal (upload)
  - [ ] Validação de URLs (whitelist)
  - [ ] Limite de query strings
  - [ ] Checksum de dados

### Deploy e Testes

#### Testes de Segurança
- [ ] Executar npm audit (sem vulnerabilidades críticas/altas)
- [ ] Testar todas as validações de segurança
- [ ] Testar rate limiting
- [ ] Testar expiração de tokens
- [ ] Verificar CSP no build
- [ ] Testar Firestore Rules
- [ ] Verificar headers de segurança em produção
- [ ] Testar proteção XSS manualmente
- [ ] Executar OWASP ZAP scan (opcional)

#### Testes de Performance
- [ ] **Lighthouse Audit:**
  - [ ] Performance score > 90
  - [ ] Accessibility score > 90
  - [ ] Best Practices score > 90
  - [ ] SEO score = 100

- [ ] **Core Web Vitals:**
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
  - [ ] FCP < 1.8s
  - [ ] TTI < 3.8s

- [ ] **Bundle Size:**
  - [ ] Initial bundle < 60KB (gzipped)
  - [ ] Total bundle < 350KB (gzipped)
  - [ ] Verificar code splitting funcionando
  - [ ] Verificar vendor chunks separados

- [ ] **Firestore Performance:**
  - [ ] Queries com índices (tempo < 100ms)
  - [ ] Reads por página < 50
  - [ ] Writes por avaliação < 20

- [ ] **React Performance:**
  - [ ] Profiler: Nenhum re-render desnecessário
  - [ ] Componentes memoizados funcionando
  - [ ] Virtualização em listas > 50 items

- [ ] **Testes de Carga:**
  - [ ] 10 membros: carregamento < 1s
  - [ ] 100 membros: carregamento < 2s
  - [ ] 1000 membros: carregamento < 3s (com virtualização)

- [ ] **Big O Verification:**
  - [ ] Verificar nenhum O(N²) em production
  - [ ] Validar Set/Map sendo usado para lookups
  - [ ] Confirmar índices Firestore ativos

#### Deploy
- [ ] Testar build local com variáveis de ambiente
- [ ] Fazer primeiro deploy via GitHub Actions
- [ ] Validar funcionamento no GitHub Pages
- [ ] Monitorar métricas de performance em produção

## Diferenciais da Solução

✓ Totalmente funcional mesmo sendo estático
✓ Dados criptografados end-to-end
✓ Envio automático de emails
✓ Dashboard em tempo real para acompanhamento
✓ Apenas criador tem acesso aos resultados
✓ Interface moderna com Tailwind CSS
✓ 100% gratuito (Firebase/Supabase tier grátis + EmailJS grátis)

## Limitações e Considerações

### Limitações Técnicas
- EmailJS tem limite de ~200 emails/mês no plano gratuito
- Firebase Firestore tem limite de 50k leituras/dia (plano gratuito)
- Supabase tem limite de 500MB storage (plano gratuito)

### Melhorias Futuras
- Múltiplas avaliações por gestor
- Templates de avaliação customizáveis
- Exportação de resultados (PDF/Excel)
- Gráficos e visualizações avançadas
- Notificações de lembrete para não respondentes
- Suporte a múltiplos idiomas
