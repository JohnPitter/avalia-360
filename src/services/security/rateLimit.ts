/**
 * Rate Limiting Service
 * Implementa controle de taxa de tentativas de autenticação
 *
 * Segurança OWASP:
 * - Proteção contra brute force attacks
 * - Lockout temporário após múltiplas tentativas
 * - Limpeza automática de registros antigos
 *
 * Estratégia: In-memory (session storage)
 * Em produção, considere usar Redis ou serviço de backend
 */

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;       // Máximo de tentativas permitidas
  windowMs: number;          // Janela de tempo (milissegundos)
  lockoutDurationMs: number; // Tempo de bloqueio após exceder limite
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,              // 5 tentativas
  windowMs: 15 * 60 * 1000,    // 15 minutos
  lockoutDurationMs: 30 * 60 * 1000, // 30 minutos de bloqueio
};

// In-memory storage (persiste durante sessão do navegador)
const STORAGE_KEY = 'avalia360_rate_limit';

/**
 * Obtém registros de rate limit do storage
 */
function getRecords(): Map<string, RateLimitRecord> {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    if (!data) return new Map();

    const obj = JSON.parse(data);
    return new Map(Object.entries(obj));
  } catch (error) {
    console.error('Erro ao ler rate limit records:', error);
    return new Map();
  }
}

/**
 * Salva registros de rate limit no storage
 */
function saveRecords(records: Map<string, RateLimitRecord>): void {
  try {
    const obj = Object.fromEntries(records);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Erro ao salvar rate limit records:', error);
  }
}

/**
 * Limpa registros antigos (garbage collection)
 */
function cleanupOldRecords(
  records: Map<string, RateLimitRecord>,
  config: RateLimitConfig
): void {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  for (const [key, record] of records.entries()) {
    // Remove se a última tentativa foi há mais de windowMs
    // e não está bloqueado
    if (record.lastAttempt < cutoff && (!record.lockedUntil || record.lockedUntil < now)) {
      records.delete(key);
    }
  }
}

/**
 * Verifica se um identificador está bloqueado
 *
 * @param identifier - Email hash ou outro identificador único
 * @param config - Configuração de rate limit (opcional)
 * @returns Informações sobre o bloqueio
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs?: number;
  lockedUntil?: Date;
} {
  const records = getRecords();
  cleanupOldRecords(records, config);

  const now = Date.now();
  const record = records.get(identifier);

  // Nenhum registro anterior - permitido
  if (!record) {
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
    };
  }

  // Verificar se está bloqueado
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterMs = record.lockedUntil - now;
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs,
      lockedUntil: new Date(record.lockedUntil),
    };
  }

  // Verificar se a janela de tempo expirou
  const windowExpired = now - record.firstAttempt > config.windowMs;
  if (windowExpired) {
    // Resetar contador
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
    };
  }

  // Dentro da janela - verificar tentativas
  const remainingAttempts = config.maxAttempts - record.attempts;

  return {
    allowed: remainingAttempts > 0,
    remainingAttempts: Math.max(0, remainingAttempts),
  };
}

/**
 * Registra uma tentativa de autenticação
 *
 * @param identifier - Email hash ou outro identificador único
 * @param config - Configuração de rate limit (opcional)
 * @returns Informações sobre o rate limit após a tentativa
 */
export function recordAttempt(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs?: number;
  lockedUntil?: Date;
} {
  const records = getRecords();
  cleanupOldRecords(records, config);

  const now = Date.now();
  const existingRecord = records.get(identifier);

  // Primeira tentativa ou janela expirada
  if (!existingRecord || now - existingRecord.firstAttempt > config.windowMs) {
    const newRecord: RateLimitRecord = {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
    records.set(identifier, newRecord);
    saveRecords(records);

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
    };
  }

  // Incrementar tentativas
  existingRecord.attempts += 1;
  existingRecord.lastAttempt = now;

  // Verificar se excedeu o limite
  if (existingRecord.attempts >= config.maxAttempts) {
    existingRecord.lockedUntil = now + config.lockoutDurationMs;
    records.set(identifier, existingRecord);
    saveRecords(records);

    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: config.lockoutDurationMs,
      lockedUntil: new Date(existingRecord.lockedUntil),
    };
  }

  records.set(identifier, existingRecord);
  saveRecords(records);

  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - existingRecord.attempts,
  };
}

/**
 * Reseta o rate limit para um identificador (após login bem-sucedido)
 *
 * @param identifier - Email hash ou outro identificador único
 */
export function resetRateLimit(identifier: string): void {
  const records = getRecords();
  records.delete(identifier);
  saveRecords(records);
}

/**
 * Limpa todos os registros de rate limit (admin/debug)
 */
export function clearAllRateLimits(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar rate limits:', error);
  }
}

/**
 * Formata tempo de espera em texto legível
 *
 * @param ms - Milissegundos
 * @returns Texto formatado (ex: "5 minutos", "30 segundos")
 */
export function formatRetryAfter(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.ceil(seconds / 60);

  if (seconds < 60) {
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  }

  return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
}

/**
 * Configurações predefinidas para diferentes contextos
 */
export const RateLimitPresets = {
  // Login de gestor (mais restritivo)
  MANAGER_LOGIN: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000,      // 15 minutos
    lockoutDurationMs: 60 * 60 * 1000, // 1 hora
  } as RateLimitConfig,

  // Login de colaborador (moderado)
  MEMBER_LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,      // 15 minutos
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutos
  } as RateLimitConfig,

  // Submissão de formulários (permissivo)
  FORM_SUBMISSION: {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000,       // 5 minutos
    lockoutDurationMs: 10 * 60 * 1000, // 10 minutos
  } as RateLimitConfig,
};
