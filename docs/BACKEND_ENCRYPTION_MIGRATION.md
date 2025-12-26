# Migração para Criptografia no Backend

## ⚠️ IMPORTANTE: Mudança de Arquitetura

Esta é uma mudança **significativa** de arquitetura de segurança:

### ❌ Antes (INSEGURO):
- Dados **plaintext** no Firestore
- Frontend acessa diretamente
- Nomes e emails visíveis no banco

### ✅ Depois (SEGURO):
- Dados **criptografados AES-256** no Firestore
- **Firebase Cloud Functions** (backend) fazem criptografia/descriptografia
- Frontend **nunca** vê dados criptografados
- Chave de criptografia **apenas no backend**

## 🔐 Chave de Criptografia

A chave `ENCRYPTION_KEY` deve estar configurada em **dois locais**:

### 1. Desenvolvimento Local
```bash
# functions/.env
ENCRYPTION_KEY=82d1d787dbbba74aef4f1b98015ba7740ef114f7a815847e4ca1a1b24ee1c5fa
```

### 2. Produção (GitHub Actions → Firebase)
```bash
# Via GitHub Secrets
ENCRYPTION_KEY=82d1d787dbbba74aef4f1b98015ba7740ef114f7a815847e4ca1a1b24ee1c5fa
```

## 📝 Cloud Functions Criadas

### 1. `addMembersEncrypted`
**Entrada (plaintext):**
```json
{
  "evaluationId": "abc123",
  "members": [
    {"name": "João Silva", "email": "joao@example.com"},
    {"name": "Maria Santos", "email": "maria@example.com"}
  ]
}
```

**Saída:**
```json
{
  "success": true,
  "members": [
    {
      "id": "member1",
      "name": "João Silva",
      "email": "joao@example.com",
      "accessCode": "123456"
    }
  ]
}
```

**O que faz:**
1. Recebe nomes/emails plaintext
2. **Criptografa** com AES-256
3. Gera código de acesso
4. **Hasheia** o código (SHA-256)
5. Salva no Firestore criptografado
6. Retorna dados plaintext + código (apenas uma vez)

### 2. `getMembersEncrypted`
**Entrada:**
```json
{
  "evaluationId": "abc123"
}
```

**Saída:**
```json
{
  "success": true,
  "members": [
    {
      "id": "member1",
      "name": "João Silva",
      "email": "joao@example.com",
      "completedEvaluations": 0,
      "totalEvaluations": 5
    }
  ]
}
```

**O que faz:**
1. Busca membros criptografados do Firestore
2. **Descriptografa** nomes e emails
3. Retorna plaintext para o frontend

### 3. `getMembersByAccessCodeEncrypted`
**Entrada:**
```json
{
  "accessCode": "123456"
}
```

**Saída:**
```json
{
  "success": true,
  "evaluationId": "abc123",
  "currentMemberId": "member1",
  "members": [...]
}
```

**O que faz:**
1. Hasheia código de acesso
2. Busca membro no Firestore
3. Busca todos membros da mesma avaliação
4. **Descriptografa** todos
5. Retorna plaintext

## 🔧 Mudanças no Frontend (TODO)

### Antes:
```typescript
// Frontend chamava direto o Firestore
const members = await getMembersByAccessCode(accessCode);
```

### Depois:
```typescript
// Frontend chama Cloud Function
const {data} = await functions().httpsCallable('getMembersByAccessCodeEncrypted')({
  accessCode
});
const members = data.members;
```

## 📊 Dados no Firestore

### Antes (plaintext):
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "access_code": "8d969eef6ecad3c2..."
}
```

### Depois (criptografado):
```json
{
  "name": "U2FsdGVkX19...",  // AES-256 encrypted
  "email": "U2FsdGVkX19...", // AES-256 encrypted
  "access_code": "8d969eef6ecad3c2..." // SHA-256 hash
}
```

## 🚀 Deploy

### 1. Deploy Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 2. Configurar ENCRYPTION_KEY (Produção)

A chave será lida do GitHub Secret via CI/CD:

```yaml
# .github/workflows/ci-cd.yml
- name: Deploy Functions
  env:
    ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
  run: firebase deploy --only functions
```

## ⚠️ IMPORTANTE: Migração de Dados

**NÃO É POSSÍVEL** descriptografar dados antigos se você perder a chave!

**Recomendação:** Limpe o banco e comece do zero:
1. Delete collections: `evaluations`, `team_members`, `responses`
2. Recrie avaliações com novo sistema
3. Dados agora estarão criptografados

## 🧪 Teste

```bash
# 1. Deploy functions
cd functions && firebase deploy --only functions

# 2. Teste addMembersEncrypted
firebase functions:shell
> addMembersEncrypted({evaluationId: 'test', members: [{name: 'Test', email: 'test@test.com'}]})

# 3. Verifique no Firestore
# Dados devem estar criptografados: "U2FsdGVkX1..."

# 4. Teste getMembersEncrypted
> getMembersEncrypted({evaluationId: 'test'})
# Deve retornar plaintext: {name: 'Test', email: 'test@test.com'}
```

## 📚 Referências

- [OWASP A02 - Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [OWASP A04 - Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- [Firebase Functions Environment Config](https://firebase.google.com/docs/functions/config-env)
