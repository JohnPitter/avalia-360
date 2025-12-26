# Configuração de Secrets no GitHub

Este guia explica como configurar as variáveis de ambiente (secrets) necessárias para o CI/CD funcionar corretamente.

## ⚠️ Problema Atual

**Erro em produção:**
```
❌ Missing environment variable: VITE_FIREBASE_API_KEY
❌ Missing environment variable: VITE_FIREBASE_AUTH_DOMAIN
...
```

**Causa:** As variáveis de ambiente não foram configuradas no GitHub Secrets, então o build do CI/CD não as injeta no código.

## 🔐 Variáveis Necessárias

### Firebase Configuration (Obrigatórias)

```bash
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Encryption Key (Obrigatória)

```bash
VITE_ENCRYPTION_KEY
```

**Importante:** Esta chave é usada para criptografar dados sensíveis como rascunhos de avaliação.

**Como gerar a chave:**
```bash
# Use Node.js para gerar uma chave aleatória segura de 32 caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### EmailJS Configuration (Opcionais)

```bash
VITE_EMAILJS_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID
VITE_EMAILJS_PUBLIC_KEY
```

### GitHub/Firebase Tokens (Para Deploy)

```bash
FIREBASE_SERVICE_ACCOUNT
FIREBASE_PROJECT_ID
GITHUB_TOKEN (automático, não precisa configurar)
```

## 📝 Passo a Passo

### 1. Obter Credenciais do Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **avalia-360-enterprise**
3. Vá em ⚙️ **Configurações do Projeto**
4. Role até **Seus aplicativos** → **SDK setup and configuration**
5. Copie os valores:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",              // ← VITE_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com", // ← VITE_FIREBASE_AUTH_DOMAIN
  projectId: "avalia-360-enterprise", // ← VITE_FIREBASE_PROJECT_ID
  storageBucket: "xxx.appspot.com",  // ← VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456",    // ← VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456:web:abc"      // ← VITE_FIREBASE_APP_ID
};
```

### 2. Adicionar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** (⚙️)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**
5. Adicione CADA secret:

#### Secret 1: VITE_FIREBASE_API_KEY
- **Name**: `VITE_FIREBASE_API_KEY`
- **Value**: Cole o valor de `apiKey`
- Clique em **Add secret**

#### Secret 2: VITE_FIREBASE_AUTH_DOMAIN
- **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
- **Value**: Cole o valor de `authDomain`
- Clique em **Add secret**

#### Secret 3: VITE_FIREBASE_PROJECT_ID
- **Name**: `VITE_FIREBASE_PROJECT_ID`
- **Value**: `avalia-360-enterprise`
- Clique em **Add secret**

#### Secret 4: VITE_FIREBASE_STORAGE_BUCKET
- **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
- **Value**: Cole o valor de `storageBucket`
- Clique em **Add secret**

#### Secret 5: VITE_FIREBASE_MESSAGING_SENDER_ID
- **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value**: Cole o valor de `messagingSenderId`
- Clique em **Add secret**

#### Secret 6: VITE_FIREBASE_APP_ID
- **Name**: `VITE_FIREBASE_APP_ID`
- **Value**: Cole o valor de `appId`
- Clique em **Add secret**

#### Secret 7: VITE_ENCRYPTION_KEY
- **Name**: `VITE_ENCRYPTION_KEY`
- **Value**: Gere uma chave executando:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Copie a chave gerada (64 caracteres hexadecimais)
- Clique em **Add secret**

**⚠️ IMPORTANTE:** Guarde esta chave em um local seguro! Se você perder a chave, não poderá descriptografar rascunhos antigos.

### 3. Configurar Firebase Service Account (Para Deploy)

1. No Firebase Console, vá em **Configurações do Projeto** → **Contas de Serviço**
2. Clique em **Gerar nova chave privada**
3. Um arquivo JSON será baixado
4. Abra o arquivo e **copie TODO o conteúdo** (é um JSON grande)
5. No GitHub, adicione um novo secret:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Cole o conteúdo completo do JSON
   - Clique em **Add secret**

6. Adicione o Project ID:
   - **Name**: `FIREBASE_PROJECT_ID`
   - **Value**: `avalia-360-enterprise`
   - Clique em **Add secret**

### 4. (Opcional) Configurar EmailJS

Se você configurou EmailJS (veja `docs/EMAILJS_SETUP.md`):

#### Secret: VITE_EMAILJS_SERVICE_ID
- **Name**: `VITE_EMAILJS_SERVICE_ID`
- **Value**: Seu service ID do EmailJS
- Clique em **Add secret**

#### Secret: VITE_EMAILJS_TEMPLATE_ID
- **Name**: `VITE_EMAILJS_TEMPLATE_ID`
- **Value**: Seu template ID (português)
- Clique em **Add secret**

#### Secret: VITE_EMAILJS_PUBLIC_KEY
- **Name**: `VITE_EMAILJS_PUBLIC_KEY`
- **Value**: Sua public key do EmailJS
- Clique em **Add secret**

### 5. Verificar Configuração

Após adicionar todos os secrets, você deve ver algo assim:

```
Repository secrets

FIREBASE_PROJECT_ID                    ••••••••
FIREBASE_SERVICE_ACCOUNT               ••••••••
VITE_EMAILJS_PUBLIC_KEY                ••••••••
VITE_EMAILJS_SERVICE_ID                ••••••••
VITE_EMAILJS_TEMPLATE_ID               ••••••••
VITE_FIREBASE_API_KEY                  ••••••••
VITE_FIREBASE_APP_ID                   ••••••••
VITE_FIREBASE_AUTH_DOMAIN              ••••••••
VITE_FIREBASE_MESSAGING_SENDER_ID      ••••••••
VITE_FIREBASE_PROJECT_ID               ••••••••
VITE_FIREBASE_STORAGE_BUCKET           ••••••••
```

## 🚀 Testar CI/CD

### Opção 1: Push Dummy

```bash
git commit --allow-empty -m "chore: Trigger CI/CD com secrets"
git push
```

### Opção 2: Workflow Manual

1. Vá em **Actions** no GitHub
2. Clique em **CI/CD Pipeline**
3. Clique em **Run workflow** → **Run workflow**

### Verificar Logs

1. Vá em **Actions**
2. Clique no workflow que está rodando
3. Verifique se o build passou:
   - ✅ TypeScript Check
   - ✅ Security Audit
   - ✅ Unit Tests
   - ✅ Build Application ← **Este deve passar agora**
   - ✅ Deploy to Firebase

## 🔍 Troubleshooting

### Build continua falhando

1. **Verifique os logs do build:**
   - Actions → CI/CD Pipeline → Build Application
   - Procure por erros relacionados a variáveis de ambiente

2. **Verifique se os secrets foram salvos:**
   - Settings → Secrets and variables → Actions
   - Todos os secrets devem aparecer listados

3. **Secrets não aparecem no build:**
   - Certifique-se de que os nomes estão EXATAMENTE iguais ao esperado
   - GitHub é case-sensitive: `VITE_FIREBASE_API_KEY` ≠ `vite_firebase_api_key`

### Deploy falha mas build passa

1. **Verificar FIREBASE_SERVICE_ACCOUNT:**
   - Deve ser o JSON completo da service account
   - Incluindo `{}` e todo o conteúdo

2. **Verificar FIREBASE_PROJECT_ID:**
   - Deve ser `avalia-360-enterprise` (seu project ID)

### EmailJS não funciona

- Se você NÃO configurou EmailJS, ignore os secrets relacionados
- A aplicação funciona sem EmailJS (apenas não envia emails)

## 🔐 Segurança

### ⚠️ NUNCA faça:

- ❌ Commitar secrets no código
- ❌ Postar secrets em issues/PRs
- ❌ Compartilhar secrets publicamente

### ✅ Boas práticas:

- ✅ Usar GitHub Secrets para CI/CD
- ✅ Usar `.env` local (não commitado)
- ✅ Rotar service accounts periodicamente
- ✅ Usar mínimo privilégio necessário

## 📚 Recursos

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Service Accounts](https://firebase.google.com/docs/admin/setup#initialize-sdk)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## ✅ Checklist Final

Antes de fazer push, certifique-se de que:

- [ ] Todos os 6 secrets Firebase foram adicionados
- [ ] FIREBASE_SERVICE_ACCOUNT foi adicionado (JSON completo)
- [ ] FIREBASE_PROJECT_ID foi adicionado
- [ ] (Opcional) Secrets EmailJS foram adicionados
- [ ] Fez push e verificou que o build passou
- [ ] Acessou a URL de produção e verificou que não há mais erros

## 🎉 Sucesso!

Quando tudo estiver configurado corretamente:

1. ✅ Build do CI/CD passará
2. ✅ Deploy automático para Firebase Hosting
3. ✅ Aplicação funcionando em produção
4. ✅ Sem erros de variáveis faltando

**URL de produção:** https://avalia-360-enterprise.web.app

Limpe o cache do navegador (Ctrl+Shift+R) e recarregue!
