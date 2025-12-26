# GitHub Copilot - Instruções Customizadas para Avalia 360°

Este projeto segue 12 princípios fundamentais que devem guiar TODAS as sugestões de código.

## 🎯 Princípios Obrigatórios

### 1. Arquitetura Limpa

**Sempre que sugerir código:**
- Separe UI (components/) de lógica de negócio (services/)
- Extraia funções puras para utils/
- Crie hooks customizados para lógica React reutilizável
- NUNCA misture fetch/API calls dentro de componentes

**Exemplo correto:**
```typescript
// ❌ ERRADO - Lógica de negócio no componente
function MyComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData);
  }, []);
}

// ✅ CORRETO - Separado em service e hook
// services/api.ts
export async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}

// hooks/useData.ts
export function useData() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  return data;
}

// components/MyComponent.tsx
function MyComponent() {
  const data = useData();
}
```

### 2. Performance - Big O Notation

**NUNCA sugira código O(N²) ou pior em hot paths.**

**Sempre preferir:**
```typescript
// ❌ ERRADO - O(N²)
function findDuplicates(items: Item[]) {
  const duplicates = [];
  for (const item of items) {
    for (const other of items) {
      if (item.id === other.id && item !== other) {
        duplicates.push(item);
      }
    }
  }
  return duplicates;
}

// ✅ CORRETO - O(N) com Set
function findDuplicates(items: Item[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    } else {
      seen.add(item.id);
    }
  }

  return Array.from(duplicates);
}
```

**React Performance:**
```typescript
// ✅ Sempre sugerir memoização quando apropriado
const MemberCard = React.memo(({ member }: { member: TeamMember }) => {
  return <div>{member.name}</div>;
});

// ✅ useMemo para cálculos complexos
const average = useMemo(() => {
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}, [ratings]);

// ✅ useCallback para event handlers
const handleClick = useCallback(() => {
  submitForm(data);
}, [data]);
```

### 3. Segurança - Mitigação de CVEs

**Sempre validar e sanitizar inputs:**
```typescript
// ✅ Sempre sugerir validação
import { validateEmail, sanitizeHTML } from '@/utils';

function handleInput(email: string, comment: string) {
  if (!validateEmail(email)) {
    throw new Error('Email inválido');
  }

  const safeComment = sanitizeHTML(comment);
  // Use safeComment...
}
```

**NUNCA sugerir:**
- `dangerouslySetInnerHTML` sem DOMPurify
- Concatenação direta de strings em queries
- `eval()` ou `Function()` constructor
- Regex sem limite de tamanho (ReDoS)

**SEMPRE sugerir:**
- DOMPurify para sanitização
- Validação de tipos com Zod/TypeScript
- Rate limiting para operações sensíveis
- Hash para senhas/tokens (SHA-256)

### 4. Resiliência e Cache

**Sempre adicionar retry logic para operações críticas:**
```typescript
// ✅ Sugerir retry com exponential backoff
async function sendEmailWithRetry(params: EmailParams) {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await emailjs.send(params);
    } catch (error) {
      lastError = error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }

  throw lastError;
}
```

**Cache quando apropriado:**
```typescript
// ✅ Cache de queries caras
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getCachedData(key: string) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchData(key);
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 5. Design Moderno

**Sempre sugerir classes Tailwind consistentes:**
```typescript
// ✅ Padrões do projeto
<button className="
  px-6 py-3
  rounded-2xl
  bg-gradient-to-r from-blue-600 to-indigo-600
  text-white font-medium
  hover:scale-[1.02] hover:shadow-xl
  active:scale-[0.98]
  transition-all duration-200
">
  Criar Avaliação
</button>

// ✅ Cards modernos
<div className="
  bg-white
  rounded-3xl
  shadow-lg
  p-6
  hover:shadow-xl
  transition-shadow
">
  {children}
</div>
```

**Gradientes por contexto:**
- Manager: `from-blue-600 via-indigo-600 to-purple-600`
- Member: `from-emerald-500 via-teal-500 to-cyan-500`
- Success: `from-green-400 to-emerald-500`

### 6. Testes

**Sempre sugerir testes junto com código:**
```typescript
// ✅ Função com teste
// utils/validators.ts
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length <= 254;
}

// utils/validators.test.ts
describe('validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('a'.repeat(255) + '@test.com')).toBe(false);
  });
});
```

### 7. Criptografia

**Sempre usar as funções do projeto:**
```typescript
// ✅ Usar utilities existentes
import { encrypt, decrypt, hashEmail, generateManagerToken } from '@/utils/crypto';

// Criptografar dados sensíveis
const encryptedName = encrypt(member.name, evaluationKey);
const emailHash = hashEmail(member.email);
const token = generateManagerToken(); // UUID v4

// NUNCA armazenar em plaintext
```

### 8. Observabilidade

**Sempre adicionar logging em operações críticas:**
```typescript
// ✅ Log de operações importantes
import { logger } from '@/utils/logger';

async function createEvaluation(data: EvaluationData) {
  try {
    logger.info('Creating evaluation', {
      title: data.title,
      memberCount: data.members.length
    });

    const result = await firestoreService.createEvaluation(data);

    logger.info('Evaluation created successfully', {
      evaluationId: result.id
    });

    return result;
  } catch (error) {
    logger.error('Failed to create evaluation', error, {
      title: data.title
    });
    throw error;
  }
}
```

**Adicionar métricas:**
```typescript
// ✅ Medir performance de operações
import { businessMetrics } from '@/utils/metrics';

const members = await businessMetrics.measure(
  'firestore_query_team_members',
  async () => getTeamMembers(evaluationId),
  { evaluationId }
);
```

### 9. Design System

**Sempre usar tokens consistentes:**
```typescript
// ✅ Cores do design system
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  rating: {
    1: '#ef4444', // red
    2: '#f97316', // orange
    3: '#eab308', // yellow
    4: '#22c55e', // green
    5: '#10b981', // emerald
  }
};

// ✅ Espaçamentos consistentes (múltiplos de 4)
const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
};
```

### 10. Fases e Subfases

**Sempre consultar PLANO.md antes de sugerir código:**
- Respeitar a ordem das fases
- Não implementar features fora da fase atual
- Seguir a estrutura documentada

### 11. Documentação

**Adicionar JSDoc em funções complexas:**
```typescript
/**
 * Calcula o progresso de avaliações de cada membro da equipe.
 *
 * Complexidade: O(N) onde N = número de membros
 *
 * @param members - Lista de membros da equipe
 * @param responses - Lista de respostas já submetidas
 * @returns Array com progresso de cada membro
 *
 * @example
 * const progress = calculateProgress(members, responses);
 * // [{ member: {...}, completed: 3, total: 4 }]
 */
export function calculateProgress(
  members: TeamMember[],
  responses: Response[]
): MemberProgress[] {
  // Implementation...
}
```

### 12. Build Funcional

**NUNCA sugerir código que quebre o build:**
- Sempre incluir imports necessários
- Respeitar tipos TypeScript
- Não usar APIs deprecated
- Seguir configuração ESLint

```typescript
// ✅ Sempre incluir imports
import { useState, useEffect, useCallback } from 'react';
import type { TeamMember } from '@/types';

// ✅ Tipos corretos
function MyComponent({ members }: { members: TeamMember[] }) {
  // Implementation...
}
```

---

## 🚫 Padrões Proibidos

**NUNCA sugerir:**
1. `any` type (usar `unknown` se necessário)
2. `console.log` (usar `logger` do projeto)
3. Loops aninhados em hot paths
4. Mutação direta de estado
5. Callbacks sem cleanup em useEffect
6. Queries Firestore sem índices
7. Regex sem validação de tamanho
8. Operações síncronas bloqueantes
9. Magic numbers (usar constantes)
10. Código duplicado (extrair para função)

---

## ✅ Padrões Recomendados

**SEMPRE sugerir:**
1. TypeScript strict mode
2. Funções puras quando possível
3. Destructuring para melhor legibilidade
4. Early returns para menos aninhamento
5. Const ao invés de let/var
6. Arrow functions para callbacks
7. Template literals ao invés de concatenação
8. Optional chaining (`?.`) e nullish coalescing (`??`)
9. Async/await ao invés de .then()
10. Named exports ao invés de default

---

## 📋 Checklist de Sugestão

Antes de sugerir código, verifique:

- [ ] Segue arquitetura limpa (separação de concerns)
- [ ] Performance é O(N) ou melhor
- [ ] Inputs são validados e sanitizados
- [ ] Tem retry/fallback se necessário
- [ ] Usa classes Tailwind do design system
- [ ] Tem teste correspondente (se aplicável)
- [ ] Usa criptografia para dados sensíveis
- [ ] Tem logging apropriado
- [ ] Segue tokens do design system
- [ ] Está na fase correta do plano
- [ ] Tem documentação JSDoc
- [ ] Não quebra o build TypeScript

---

## 🎯 Prioridades

Em caso de conflito, seguir esta ordem:

1. **Segurança** (nunca comprometer)
2. **Funcionalidade** (código deve funcionar)
3. **Performance** (experiência do usuário)
4. **Arquitetura** (manutenibilidade)
5. **Design** (consistência visual)
6. **Documentação** (clareza)

---

**Lembre-se**: Estas instruções são obrigatórias para todas as sugestões de código neste projeto.
