# Configuração do EmailJS

Este guia explica como configurar o EmailJS para envio automático de emails de convite para colaboradores.

## 📧 Por que EmailJS?

- ✅ Gratuito até 200 emails/mês
- ✅ Fácil configuração (sem backend)
- ✅ Suporte a templates multi-idioma
- ✅ Dashboard para monitorar envios

## 🚀 Passo a Passo

### 1. Criar Conta no EmailJS

1. Acesse [https://www.emailjs.com/](https://www.emailjs.com/)
2. Clique em "Sign Up" e crie uma conta gratuita
3. Confirme seu email

### 2. Adicionar Serviço de Email

1. No dashboard do EmailJS, vá em **Email Services**
2. Clique em **Add New Service**
3. Escolha seu provedor de email:
   - **Gmail** (recomendado para testes)
   - **Outlook**
   - **Yahoo**
   - Ou outro de sua preferência
4. Siga as instruções para conectar sua conta
5. Copie o **Service ID** (exemplo: `service_abc123`)

### 3. Criar Templates de Email

Você precisa criar **3 templates** (um para cada idioma):

#### Template Português (pt)

1. Vá em **Email Templates** → **Create New Template**
2. **Template Name**: `Convite Avaliação 360 PT`
3. **Template ID**: (copie para usar depois, ex: `template_pt`)
4. **Subject**: `Convite para Avaliação 360° - {{evaluation_title}}`
5. **Content**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .code-box { background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { background: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Avaliação 360°</h1>
            <h2>{{evaluation_title}}</h2>
        </div>

        <div class="content">
            <p>Olá <strong>{{to_name}}</strong>,</p>

            <p>Você foi convidado(a) por <strong>{{manager_name}}</strong> para participar de uma avaliação 360°.</p>

            <p>Use o código abaixo para acessar:</p>

            <div class="code-box">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">SEU CÓDIGO DE ACESSO</p>
                <div class="code">{{access_code}}</div>
            </div>

            <div style="text-align: center;">
                <a href="{{evaluation_url}}" class="button">Acessar Avaliação</a>
            </div>

            <h3>📝 O que você precisa fazer?</h3>
            <ul>
                <li>Avaliar todos os membros da equipe</li>
                <li>Responder 4 perguntas de múltipla escolha</li>
                <li>Fornecer feedback construtivo (opcional)</li>
            </ul>

            <h3>🔒 Sua privacidade está garantida</h3>
            <ul>
                <li>Suas respostas são <strong>100% anônimas</strong></li>
                <li>Dados criptografados com AES-256</li>
                <li>Ninguém saberá quem avaliou quem</li>
            </ul>
        </div>

        <div class="footer">
            <p>Este é um email automático. Não responda a esta mensagem.</p>
            <p>Avalia 360° - Sistema de Avaliações Empresariais</p>
        </div>
    </div>
</body>
</html>
```

6. Clique em **Save**

#### Template Inglês (en)

Repita o processo acima com conteúdo em inglês:

- **Template Name**: `360 Evaluation Invite EN`
- **Subject**: `Invitation to 360° Evaluation - {{evaluation_title}}`
- Adapte o conteúdo HTML para inglês

#### Template Espanhol (es)

Repita o processo com conteúdo em espanhol:

- **Template Name**: `Invitación Evaluación 360 ES`
- **Subject**: `Invitación a Evaluación 360° - {{evaluation_title}}`
- Adapte o conteúdo HTML para espanhol

### 4. Obter Public Key

1. Vá em **Account** → **General**
2. Copie sua **Public Key** (exemplo: `aBcDeFgHiJkLmNo`)

### 5. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`):

```bash
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_pt_abc
VITE_EMAILJS_TEMPLATE_ID_EN=template_en_xyz
VITE_EMAILJS_TEMPLATE_ID_ES=template_es_def
VITE_EMAILJS_PUBLIC_KEY=aBcDeFgHiJkLmNo
```

**Importante:** Substitua pelos valores reais do seu EmailJS!

### 6. Reiniciar o Servidor

Após configurar as variáveis de ambiente:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

## ✅ Testar Configuração

1. Crie uma nova avaliação
2. Adicione membros (use seu próprio email para teste)
3. Verifique no console do navegador se há logs de envio
4. Verifique sua caixa de entrada

**Logs esperados:**
```
🐛 INFO [EmailService] Sending bulk invite emails
🐛 SUCCESS [EmailService] Invite email sent successfully
🐛 INFO [EmailService] Bulk invite emails completed
```

## 🔍 Troubleshooting

### Emails não estão sendo enviados

1. **Verificar variáveis de ambiente**
   ```bash
   # No console do navegador
   console.log(import.meta.env.VITE_EMAILJS_SERVICE_ID)
   ```

2. **Verificar logs no console**
   - Abra DevTools (F12) → Console
   - Procure por erros relacionados a EmailJS

3. **Verificar quota do EmailJS**
   - Dashboard EmailJS → Usage
   - Plano gratuito: 200 emails/mês

4. **Verificar Service ID e Template ID**
   - Devem corresponder exatamente aos do dashboard

### Circuit Breaker Aberto

Se ver este erro:
```
🐛 CRITICAL EmailJS circuit breaker opened - service down
```

**Causa:** 3 tentativas de envio falharam consecutivamente

**Solução:**
1. Aguarde 1 minuto (circuit breaker reabre automaticamente)
2. Verifique configuração do EmailJS
3. Tente novamente

### Emails vão para SPAM

1. **Configurar SPF/DKIM** no seu provedor de email
2. **Usar email profissional** (evite Gmail pessoal em produção)
3. **Personalizar FROM name** no template do EmailJS

## 📊 Monitoramento

### Dashboard EmailJS

Acesse [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/) para:
- Ver emails enviados
- Monitorar taxa de sucesso
- Verificar erros
- Acompanhar quota

### Logs da Aplicação

Habilite debug mode (veja `docs/DEBUG_LOGGER.md`):

```javascript
// Via Firebase Console
app_config/debug: { enabled: true, level: 'debug' }
```

Logs detalhados no console do navegador.

## 🔐 Segurança

### ⚠️ NUNCA comite credenciais

- `.env` está no `.gitignore`
- **NUNCA** commitar Service ID, Template ID ou Public Key
- Use variáveis de ambiente em produção (Vercel, Netlify, etc.)

### Configurar em Produção

**Vercel:**
1. Dashboard do projeto → Settings → Environment Variables
2. Adicione todas as `VITE_EMAILJS_*` variables

**Netlify:**
1. Site settings → Build & deploy → Environment
2. Adicione as variáveis

**Firebase Hosting:**
```bash
firebase functions:config:set \
  emailjs.service_id="service_abc123" \
  emailjs.public_key="aBcDeFgHiJkLmNo"
```

## 💰 Limites do Plano Gratuito

- **200 emails/mês**
- **1 Service de email**
- **Templates ilimitados**
- **Suporte via email**

Para mais, veja planos pagos: [EmailJS Pricing](https://www.emailjs.com/pricing/)

## 📚 Recursos Adicionais

- [Documentação EmailJS](https://www.emailjs.com/docs/)
- [Templates de Email](https://www.emailjs.com/docs/templates/introduction/)
- [Troubleshooting](https://www.emailjs.com/docs/faq/)

## ⚡ Templates Prontos

Os templates HTML acima estão otimizados para:
- ✅ Responsivos (mobile-friendly)
- ✅ Dark mode compatible
- ✅ Inbox rendering correto
- ✅ Placeholders dinâmicos
- ✅ Design moderno

Ajuste cores e logos conforme sua marca!
