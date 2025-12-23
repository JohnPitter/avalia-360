import { ValidationResult } from '@/types';

/**
 * Valida formato de email
 * Complexidade: O(1)
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) {
    return false;
  }

  // RFC 5322 simplified regex
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida nome (2-100 caracteres, apenas letras, espaços e acentos)
 * Complexidade: O(1)
 */
export function isValidName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 100) {
    return false;
  }

  // Permite letras (incluindo acentuadas), espaços, hífens e apóstrofos
  const regex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  return regex.test(name.trim());
}

/**
 * Valida código de acesso (6 dígitos)
 * Complexidade: O(1)
 */
export function isValidAccessCode(code: string): boolean {
  const regex = /^\d{6}$/;
  return regex.test(code);
}

/**
 * Valida rating (1-5, inteiro)
 * Complexidade: O(1)
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Valida comentário (0-500 caracteres)
 * Complexidade: O(1)
 */
export function isValidComment(comment: string): boolean {
  return comment.length <= 500;
}

/**
 * Valida título de avaliação (1-200 caracteres)
 * Complexidade: O(1)
 */
export function isValidTitle(title: string): boolean {
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 200;
}

/**
 * Valida lista de membros da equipe
 * Complexidade: O(N) onde N é o número de membros
 */
export function validateTeamMembers(
  members: Array<{ name: string; email: string }>
): ValidationResult {
  const errors: string[] = [];

  // Mínimo de 2 membros para avaliação 360°
  if (members.length < 2) {
    errors.push('Mínimo de 2 membros necessário para avaliação 360°');
    return { valid: false, errors };
  }

  // Máximo recomendado
  if (members.length > 100) {
    errors.push('Máximo de 100 membros permitido');
    return { valid: false, errors };
  }

  // Validação usando Set para detectar duplicados em O(N)
  const emails = new Set<string>();

  members.forEach((member, index) => {
    const line = index + 1;

    // Valida nome
    if (!member.name || !member.name.trim()) {
      errors.push(`Membro ${line}: Nome está vazio`);
    } else if (!isValidName(member.name)) {
      errors.push(`Membro ${line}: Nome inválido (${member.name})`);
    }

    // Valida email
    if (!member.email || !member.email.trim()) {
      errors.push(`Membro ${line}: Email está vazio`);
    } else {
      const emailLower = member.email.toLowerCase().trim();

      if (!isValidEmail(emailLower)) {
        errors.push(`Membro ${line}: Email inválido (${member.email})`);
      } else if (emails.has(emailLower)) {
        errors.push(`Membro ${line}: Email duplicado (${member.email})`);
      } else {
        emails.add(emailLower);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida dados do formulário de avaliação
 */
export function validateEvaluationForm(data: {
  question_1: number;
  question_2: number;
  question_3: number;
  question_4: number;
  positive_points: string;
  improvement_points: string;
}): ValidationResult {
  const errors: string[] = [];

  // Valida ratings
  if (!isValidRating(data.question_1)) {
    errors.push('Pergunta 1: Avaliação deve ser entre 1-5');
  }
  if (!isValidRating(data.question_2)) {
    errors.push('Pergunta 2: Avaliação deve ser entre 1-5');
  }
  if (!isValidRating(data.question_3)) {
    errors.push('Pergunta 3: Avaliação deve ser entre 1-5');
  }
  if (!isValidRating(data.question_4)) {
    errors.push('Pergunta 4: Avaliação deve ser entre 1-5');
  }

  // Valida comentários
  if (!isValidComment(data.positive_points)) {
    errors.push('Pontos positivos: Máximo de 500 caracteres');
  }
  if (!isValidComment(data.improvement_points)) {
    errors.push('Pontos de melhoria: Máximo de 500 caracteres');
  }

  // Comentários obrigatórios (ao menos um caractere)
  if (!data.positive_points.trim()) {
    errors.push('Pontos positivos: Campo obrigatório');
  }
  if (!data.improvement_points.trim()) {
    errors.push('Pontos de melhoria: Campo obrigatório');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normaliza email (lowercase, trim)
 * Complexidade: O(1)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normaliza nome (trim, capitaliza primeira letra de cada palavra)
 * Complexidade: O(N) onde N é o tamanho do nome
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Previne query string injection (limita tamanho)
 * Proteção contra CVE-2022-24999 (ReDoS)
 * Complexidade: O(1)
 */
export function sanitizeQueryString(query: string): string {
  // Limita tamanho para prevenir ReDoS
  const MAX_LENGTH = 1000;

  if (query.length > MAX_LENGTH) {
    return query.substring(0, MAX_LENGTH);
  }

  return query;
}

/**
 * Valida UUID v4
 * Complexidade: O(1)
 */
export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Valida URL (whitelist de domínios permitidos)
 * Proteção contra SSRF
 * Complexidade: O(1)
 */
export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsed = new URL(url);

    // Apenas HTTP e HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Whitelist de domínios se fornecido
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limiting check (simples, em memória)
 * Em produção, usar Redis ou similar
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Limpa expirados periodicamente
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt < now) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (!record || record.resetAt < now) {
    // Primeira tentativa ou janela expirou
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Incrementa contador
  record.count++;

  if (record.count > maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }

  return { allowed: true, remainingAttempts: maxAttempts - record.count };
}

/**
 * Reset rate limit (útil para testes)
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
