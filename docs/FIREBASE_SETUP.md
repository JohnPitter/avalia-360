# Configuracao do Firebase

Guia completo para configurar o Firebase no projeto Avalia 360.

---

## 1. Criar Projeto Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "avalia-360")
4. Siga os passos de configuracao

---

## 2. Ativar Firestore Database

1. Va em "Firestore Database" e clique em "Criar banco de dados"
2. Escolha "Modo de producao"
3. Selecione a regiao (ex: southamerica-east1)

### Regras de Seguranca

Va em "Firestore Database" e depois em "Regras". Substitua pelo conteudo abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /avaliations/{avaliationId} {
      allow read, write: if true;
    }

    match /team_members/{memberId} {
      allow read, write: if true;
    }

    match /responses/{responseId} {
      allow read, write: if true;
    }

    match /application_logs/{logId} {
      allow write: if true;
      allow read: if false;
    }
  }
}
```

---

## 3. Registrar Aplicativo Web

1. Va em "Configuracoes do projeto" (icone de engrenagem)
2. Role ate "Seus aplicativos"
3. Clique em "Web" (icone `</>`)
4. Registre um nome (ex: "Avalia 360 Web")
5. Copie as credenciais que aparecem

---

## 4. Configurar Variaveis de Ambiente

### Desenvolvimento Local

```bash
cp .env.example .env
```

Preencha o arquivo `.env`:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### Deploy (GitHub Secrets)

Para deploy automatico, configure os secrets no GitHub:

1. Va em `Settings` e depois `Secrets and variables` e `Actions`
2. Clique em "New repository secret"
3. Adicione cada variavel:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT` (JSON da service account)
   - `FIREBASE_PROJECT_ID`

---

## 5. Verificar Configuracao

```bash
npm run dev
```

Acesse `http://localhost:5173` e crie uma avaliacao de teste para verificar que o Firestore esta funcionando.
