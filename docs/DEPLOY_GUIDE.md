# 🚀 Guia de Deploy - Avalia 360°

## ⚠️ Problema Atual

A aplicação não funciona no Firebase Hosting porque **as variáveis de ambiente não estão configuradas**.

Quando você clica em "Criar Avaliação" ou "Acessar com Código", nada acontece porque o Firebase não está inicializado corretamente.

## ✅ Solução: Adicionar Secrets no GitHub

### 1. Obter Credenciais do Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **avalia-360-enterprise**
3. Clique no ícone de **⚙️ (Configurações)** → **Configurações do projeto**
4. Role até a seção **"Seus apps"**
5. Se não tiver um app web, clique em **"Adicionar app"** → Escolha **Web** (ícone </> )
6. Dê um nome (ex: "Avalia 360 Web") e clique em **Registrar app**
7. Você verá um código JavaScript com as credenciais:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "avalia-360-enterprise.firebaseapp.com",
  projectId: "avalia-360-enterprise",
  storageBucket: "avalia-360-enterprise.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 2. Adicionar Secrets no GitHub

1. Acesse seu repositório: `https://github.com/JohnPitter/avalia-360`
2. Vá em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**
5. Adicione os seguintes secrets **UM POR VEZ**:

#### Secrets do Firebase (OBRIGATÓRIOS):

| Nome do Secret | Valor (exemplo) |
|----------------|-----------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` (seu apiKey) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `avalia-360-enterprise.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `avalia-360-enterprise` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `avalia-360-enterprise.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abcdef123456` |

#### Secrets do EmailJS (OPCIONAL - para envio de emails):

Se você quiser testar sem EmailJS por enquanto, pode pular estes:

| Nome do Secret | Valor |
|----------------|-------|
| `VITE_EMAILJS_SERVICE_ID` | Seu service ID do EmailJS |
| `VITE_EMAILJS_TEMPLATE_ID` | Seu template ID do EmailJS |
| `VITE_EMAILJS_PUBLIC_KEY` | Sua public key do EmailJS |

### 3. Habilitar Firestore

1. No Firebase Console, vá em **Firestore Database** no menu lateral
2. Clique em **Criar banco de dados**
3. Escolha modo **Produção** (production mode)
4. Escolha a localização (recomendado: `southamerica-east1` - São Paulo)
5. Clique em **Ativar**

### 4. Configurar Regras de Segurança do Firestore

1. Ainda na página do Firestore, clique na aba **Regras**
2. Cole as seguintes regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Avaliações - apenas criadores podem ler/escrever
    match /evaluations/{evaluationId} {
      allow read: if request.auth != null || true; // Permitir leitura por enquanto
      allow create: if true; // Permitir criação
      allow update: if true; // Permitir atualização
      allow delete: if true; // Permitir deleção
    }

    // Membros da equipe
    match /team_members/{memberId} {
      allow read, write: if true; // Permitir tudo por enquanto
    }

    // Respostas
    match /responses/{responseId} {
      allow read, write: if true; // Permitir tudo por enquanto
    }

    // Rascunhos
    match /drafts/{draftId} {
      allow read, write: if true; // Permitir tudo por enquanto
    }
  }
}
```

3. Clique em **Publicar**

⚠️ **IMPORTANTE**: Estas regras são permissivas para teste. Depois vamos adicionar regras de segurança adequadas.

### 5. Disparar Novo Deploy

Depois de adicionar todos os secrets:

1. Faça qualquer pequena alteração no código (pode ser adicionar um espaço no README.md)
2. Commit e push:
```bash
git add .
git commit -m "trigger: Dispara deploy com variáveis configuradas"
git push origin main
```

3. Acompanhe o deploy em: `https://github.com/JohnPitter/avalia-360/actions`

### 6. Testar a Aplicação

Após o deploy completar (~2-3 minutos):

1. Acesse: `https://avalia-360-enterprise.web.app`
2. Abra o DevTools do navegador (F12)
3. Vá na aba **Console**
4. Você deve ver:
   - `🔥 Firebase inicializado com sucesso`
   - `📊 Firestore conectado ao projeto: avalia-360-enterprise`

5. Agora teste:
   - ✅ Criar nova avaliação (deve funcionar)
   - ✅ Acessar com código (deve funcionar)

## 🔧 Troubleshooting

### Erro: "Firebase configuration incomplete"

**Causa**: Algum secret não foi adicionado ou tem nome errado.

**Solução**:
1. Verifique se TODOS os 6 secrets do Firebase foram adicionados
2. Verifique se os nomes estão EXATAMENTE iguais (case-sensitive)
3. Faça novo deploy

### Console mostra: "Missing permissions"

**Causa**: Regras do Firestore muito restritivas.

**Solução**: Use as regras permissivas acima temporariamente.

### Nada acontece ao clicar nos botões

**Causa**: Firebase não inicializado.

**Solução**:
1. Abra Console do navegador (F12)
2. Veja se há erros
3. Verifique se os secrets foram adicionados corretamente

## 📞 Próximos Passos

Após configurar os secrets e fazer deploy:

1. ✅ Teste criar uma avaliação
2. ✅ Teste adicionar membros
3. ✅ Verifique se os dados aparecem no Firestore
4. ✅ Me avise se funcionar ou se houver algum erro!

---

**Dica**: Se quiser testar localmente antes, crie um arquivo `.env` na raiz do projeto com as mesmas variáveis (veja `.env.example`).
