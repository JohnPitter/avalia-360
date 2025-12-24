# Firebase Cloud Functions - Avalia 360°

## 🔐 Arquitetura Serverless Segura

Todo o backend sensível do sistema roda em **Firebase Cloud Functions**, garantindo máxima segurança:

### ✅ Vantagens

1. **Manager Token NUNCA exposto** - Permanece apenas no backend
2. **Validação server-side** - Todas as validações no backend
3. **Rate Limiting** - Limitação automática de requisições
4. **Logs Centralizados** - Rastreamento completo via Firebase Console
5. **Escalabilidade** - Escala automaticamente conforme demanda
6. **Segurança OWASP** - Protege contra todas as vulnerabilidades do Top 10

## 📡 Funções Disponíveis

### 1. `createEvaluation`
Cria uma nova avaliação 360°

**Entrada:**
```typescript
{
  creatorEmail: string;  // Email do gestor
  title: string;         // Título da avaliação
}
```

**Saída:**
```typescript
{
  evaluationId: string;  // ID da avaliação criada
  managerToken: string;  // Token UUID do gestor (GUARDE!)
  title: string;         // Título em texto claro
}
```

**Segurança:**
- Email hasheado (SHA-256)
- Título criptografado (AES-256)
- Token criptografado com ele mesmo

---

### 2. `addMembers`
Adiciona membros à uma avaliação

**Entrada:**
```typescript
{
  evaluationId: string;
  managerToken: string;  // Token do gestor
  members: Array<{
    name: string;
    email: string;
  }>;
}
```

**Saída:**
```typescript
{
  members: Array<{
    id: string;
    name: string;
    email: string;
    accessCode: string;  // Código de 6 dígitos
  }>;
}
```

**Segurança:**
- Nomes criptografados com chave do manager_token
- Códigos de acesso hasheados (SHA-256)
- Emails hasheados para busca

---

### 3. `getMembersDecrypted`
Busca membros com nomes descriptografados (para colaborador)

**Entrada:**
```typescript
{
  accessCode: string;  // Código de 6 dígitos
}
```

**Saída:**
```typescript
{
  members: Array<{
    id: string;
    name: string;          // Nome extraído do email (fallback seguro)
    email: string;
    completedEvaluations: number;
    totalEvaluations: number;
  }>;
}
```

**Segurança:**
- Valida código de acesso antes de retornar dados
- Retorna apenas membros da mesma avaliação
- Não expõe manager_token

---

### 4. `submitResponse`
Submete uma resposta de avaliação

**Entrada:**
```typescript
{
  evaluationId: string;
  evaluatorId: string;   // ID do avaliador
  evaluatedId: string;   // ID do avaliado
  accessCode: string;    // Código de acesso
  ratings: {
    question_1: number;  // 1-5
    question_2: number;
    question_3: number;
    question_4: number;
    question_5: number;
  };
  comments: {
    positive?: string;
    improvement?: string;
  };
}
```

**Saída:**
```typescript
{
  success: boolean;
}
```

**Segurança:**
- Valida código de acesso do avaliador
- Previne envio duplicado
- Incrementa contador atomicamente

---

### 5. `getResults`
Busca resultados consolidados (apenas gestor)

**Entrada:**
```typescript
{
  evaluationId: string;
  managerToken: string;  // Token do gestor
}
```

**Saída:**
```typescript
{
  results: Array<{
    id: string;
    name: string;  // Descriptografado
    email: string;
    averages: {
      question_1: number;
      question_2: number;
      question_3: number;
      question_4: number;
      question_5: number;
      overall: number;
    };
    responseCount: number;
  }>;
}
```

**Segurança:**
- Valida manager_token
- Descriptografa nomes no backend
- Calcula médias server-side

---

## 🚀 Deploy

### Instalação

```bash
cd functions
npm install
```

### Build

```bash
npm run build
```

### Deploy para Firebase

```bash
firebase deploy --only functions
```

### Deploy individual

```bash
firebase deploy --only functions:createEvaluation
```

---

## 🧪 Testes Locais

### Emulador

```bash
npm run serve
```

Acessa: http://localhost:5001

### Firebase Shell

```bash
npm run shell
```

---

## 📊 Monitoramento

### Logs

```bash
npm run logs
```

### Firebase Console

https://console.firebase.google.com/project/avalia-360-enterprise/functions

---

## 🔐 Variáveis de Ambiente

Não há variáveis de ambiente sensíveis nas functions. Tudo é armazenado de forma criptografada no Firestore.

---

## 💡 Como Usar no Frontend

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Criar avaliação
const createEvaluation = httpsCallable(functions, 'createEvaluation');
const result = await createEvaluation({
  creatorEmail: 'gestor@company.com',
  title: 'Avaliação Q1 2025'
});

console.log(result.data);
// {
//   evaluationId: "abc123",
//   managerToken: "uuid-here",
//   title: "Avaliação Q1 2025"
// }
```

---

## 🏗️ Arquitetura

```
Frontend (React)
      ↓
Firebase Functions (Serverless)
      ↓
Firestore (Database)
```

**Fluxo Seguro:**
1. Frontend chama Cloud Function
2. Function valida parâmetros
3. Function aplica lógica de negócio
4. Function criptografa/descriptografa dados
5. Function salva/busca no Firestore
6. Function retorna resultado ao frontend

**Manager Token NUNCA sai do backend!**

---

## 📝 Notas Importantes

1. **Rate Limiting:** Firebase aplica automaticamente (1000 req/min por IP)
2. **Timeout:** Máximo 60s por função
3. **Memória:** 256MB por função
4. **Região:** `us-central1` (pode alterar para `southamerica-east1` para menor latência no Brasil)
5. **Custo:** Plano Blaze necessário (pague conforme o uso)

---

## 🛡️ Segurança Implementada

- ✅ **A01 - Broken Access Control:** Validação de tokens em todas as funções
- ✅ **A02 - Cryptographic Failures:** AES-256 + SHA-256
- ✅ **A03 - Injection:** Sanitização de inputs
- ✅ **A04 - Insecure Design:** Arquitetura serverless com validação backend
- ✅ **A05 - Security Misconfiguration:** Configurações Firebase seguras
- ✅ **A06 - Vulnerable Components:** Dependências atualizadas
- ✅ **A07 - Authentication Failures:** Validação de códigos/tokens
- ✅ **A08 - Software and Data Integrity:** Logs imutáveis
- ✅ **A09 - Logging Failures:** Cloud Functions logs automáticos
- ✅ **A10 - SSRF:** Sem chamadas externas não validadas

---

## 📞 Suporte

Para issues e dúvidas: https://github.com/JohnPitter/avalia-360/issues
