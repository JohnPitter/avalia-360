# Sistema de Debug Logger

Sistema de logs condicionais controlado remotamente via Firestore.

## Características

- **Controlado remotamente**: Liga/desliga via Firestore sem rebuild
- **Níveis de log**: `debug`, `info`, `warn`, `error`
- **Cache inteligente**: TTL de 1 minuto para reduzir queries
- **Colorido**: Logs com cores para fácil identificação
- **Context-aware**: Logs incluem componente, ação e dados

## Como Usar

### Importar

```typescript
import { debugLog } from '@/services/debug/debugLogger';
```

### Métodos Disponíveis

```typescript
// Início de operação
debugLog.start('Operation Name', {
  component: 'ComponentName',
  data: { key: 'value' }
});

// Informação
debugLog.info('Message', {
  component: 'ComponentName'
});

// Sucesso
debugLog.success('Operation completed', {
  component: 'ComponentName',
  data: { result: 'success' }
});

// Aviso
debugLog.warn('Warning message', {
  component: 'ComponentName'
});

// Erro
debugLog.error('Error message', error, {
  component: 'ComponentName'
});

// Debug detalhado
debugLog.debug('Debug info', {
  component: 'ComponentName',
  data: { detail: 'info' }
});

// Fim de operação
debugLog.end('Operation Name', {
  component: 'ComponentName'
});
```

### Exemplo Completo

```typescript
async function loginMember(accessCode: string) {
  debugLog.start('Member Login', {
    component: 'AuthService',
    data: { accessCode: '******' }
  });

  try {
    debugLog.debug('Validating access code', { component: 'AuthService' });
    const member = await validateAccessCode(accessCode);

    if (!member) {
      debugLog.warn('Invalid access code', { component: 'AuthService' });
      throw new Error('Invalid code');
    }

    debugLog.success('Member authenticated', {
      component: 'AuthService',
      data: { memberId: member.id }
    });

    debugLog.end('Member Login', { component: 'AuthService' });
    return member;
  } catch (error) {
    debugLog.error('Login failed', error, { component: 'AuthService' });
    throw error;
  }
}
```

## Configuração no Firestore

### Habilitar Debug

```typescript
import { setDebugConfig } from '@/services/debug/debugConfig';

// Habilitar com nível info
await setDebugConfig(true, 'info');

// Habilitar com nível debug (mais verboso)
await setDebugConfig(true, 'debug');

// Desabilitar
await setDebugConfig(false);
```

### Estrutura no Firestore

Coleção: `app_config`
Documento: `debug`

```json
{
  "enabled": true,
  "level": "debug",
  "lastUpdated": 1703606400000
}
```

### Via Firebase Console

1. Acesse Firebase Console
2. Vá em Firestore Database
3. Crie/edite documento: `app_config/debug`
4. Campos:
   - `enabled`: `boolean` (true/false)
   - `level`: `string` ("debug", "info", "warn", "error")
   - `lastUpdated`: `number` (timestamp)

## Níveis de Log

Os níveis controlam quais logs aparecem:

- **debug**: Mostra TUDO (mais verboso)
- **info**: Mostra info, warn, error (padrão)
- **warn**: Mostra warn e error
- **error**: Mostra apenas errors

## Cache

- TTL: 1 minuto
- Limpar cache manualmente:

```typescript
import { clearDebugCache } from '@/services/debug/debugConfig';

clearDebugCache();
```

## Segurança

- Logs não aparecem em produção por padrão
- Dados sensíveis devem ser mascarados:

```typescript
debugLog.info('Login attempt', {
  component: 'Auth',
  data: {
    email: '******',
    accessCode: '******'
  }
});
```

## Performance

- Cache de 1 minuto reduz queries ao Firestore
- Verificação de nível antes de processar log
- Fallback silencioso se Firestore falhar
- Zero impacto quando desabilitado

## Boas Práticas

1. **Sempre usar component**: Facilita filtrar logs
2. **Mascarar dados sensíveis**: Emails, tokens, senhas
3. **Usar níveis apropriados**:
   - `debug`: Detalhes de implementação
   - `info`: Fluxo da aplicação
   - `warn`: Situações anormais mas recuperáveis
   - `error`: Erros que impedem operação
4. **Pares start/end**: Para operações longas
5. **Context rico**: Inclua dados relevantes para debug

## Visualização no Console

Logs aparecem coloridos:

- 🐛 **DEBUG**: Roxo
- 🐛 **INFO**: Azul
- 🐛 **SUCCESS**: Verde
- 🐛 **WARN**: Laranja
- 🐛 **ERROR**: Vermelho
- 🐛 **START/END**: Ciano

Formato:
```
🐛 HH:MM:SS LEVEL [Component] action: message {data}
```
