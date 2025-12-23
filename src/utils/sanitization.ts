import DOMPurify from 'dompurify';

/**
 * Configuração padrão do DOMPurify
 * - Remove scripts, iframes, forms
 * - Permite apenas tags seguras
 */
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitiza HTML para prevenir XSS
 * Usa DOMPurify com configuração restritiva
 * Complexidade: O(N) onde N é o tamanho do input
 *
 * @param dirty - HTML potencialmente malicioso
 * @param config - Configuração customizada (opcional)
 * @returns HTML seguro
 */
export function sanitizeHtml(
  dirty: string,
  config = DEFAULT_CONFIG
): string {
  if (!dirty) {
    return '';
  }

  try {
    return DOMPurify.sanitize(dirty, config);
  } catch (error) {
    console.error('Erro ao sanitizar HTML:', error);
    // Em caso de erro, remove todas as tags
    return stripAllTags(dirty);
  }
}

/**
 * Remove todas as tags HTML
 * Mais restritivo que sanitizeHtml
 * Complexidade: O(N)
 *
 * @param input - String com possíveis tags HTML
 * @returns String sem tags
 */
export function stripAllTags(input: string): string {
  if (!input) {
    return '';
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitiza input de texto simples
 * - Remove tags HTML
 * - Normaliza whitespace
 * - Limita tamanho
 * Complexidade: O(N)
 *
 * @param input - Texto de entrada
 * @param maxLength - Tamanho máximo (padrão: 1000)
 * @returns Texto sanitizado
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (!input) {
    return '';
  }

  // Remove tags HTML
  let sanitized = stripAllTags(input);

  // Normaliza whitespace (múltiplos espaços → um espaço)
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Limita tamanho
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitiza para prevenir NoSQL Injection (Firestore)
 * Remove operadores especiais do Firestore
 * Complexidade: O(1)
 *
 * @param input - Input do usuário
 * @returns Input seguro para queries Firestore
 */
export function sanitizeForFirestore(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove operadores NoSQL comuns
  // Firestore não usa $ como MongoDB, mas preventivo
  const dangerous = ['$', '{', '}', '[', ']'];

  let sanitized = input;
  dangerous.forEach(char => {
    sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), '');
  });

  return sanitized.trim();
}

/**
 * Sanitiza filename para prevenir path traversal
 * Remove ../, ..\, e caracteres especiais
 * Complexidade: O(N)
 *
 * @param filename - Nome do arquivo
 * @returns Filename seguro
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) {
    return '';
  }

  // Remove path traversal
  let sanitized = filename.replace(/\.\.[/\\]/g, '');

  // Remove caracteres perigosos
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limita tamanho
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

/**
 * Escapa caracteres especiais para uso em RegExp
 * Previne ReDoS (Regular Expression Denial of Service)
 * Complexidade: O(N)
 *
 * @param string - String para escapar
 * @returns String escapada
 */
export function escapeRegExp(string: string): string {
  if (!string) {
    return '';
  }

  // Escapa caracteres especiais do RegExp
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitiza URL para prevenir javascript: e data: URIs
 * Permite apenas http:// e https://
 * Complexidade: O(1)
 *
 * @param url - URL para sanitizar
 * @returns URL segura ou string vazia
 */
export function sanitizeUrl(url: string): string {
  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);

    // Apenas HTTP e HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitiza objeto removendo propriedades perigosas
 * Útil para prevenir prototype pollution
 * Complexidade: O(N) onde N é o número de propriedades
 *
 * @param obj - Objeto para sanitizar
 * @returns Objeto sem propriedades perigosas
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Propriedades perigosas que podem causar prototype pollution
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];

  const sanitized = { ...obj };

  dangerousProps.forEach(prop => {
    if (prop in sanitized) {
      delete sanitized[prop];
    }
  });

  return sanitized;
}

/**
 * Sanitiza array de strings
 * Aplica sanitizeText em cada elemento
 * Complexidade: O(N*M) onde N é o tamanho do array e M é o tamanho médio das strings
 *
 * @param arr - Array de strings
 * @param maxLength - Tamanho máximo por string
 * @returns Array sanitizado
 */
export function sanitizeArray(arr: string[], maxLength: number = 1000): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .filter(item => typeof item === 'string')
    .map(item => sanitizeText(item, maxLength));
}

/**
 * Codifica HTML entities
 * Previne XSS ao exibir user input
 * Complexidade: O(N)
 *
 * @param input - String para codificar
 * @returns String com entities codificadas
 */
export function encodeHtmlEntities(input: string): string {
  if (!input) {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Decodifica HTML entities de forma segura
 * Complexidade: O(N)
 *
 * @param input - String com entities
 * @returns String decodificada
 */
export function decodeHtmlEntities(input: string): string {
  if (!input) {
    return '';
  }

  const div = document.createElement('div');
  div.innerHTML = input;
  return div.textContent || '';
}

/**
 * Sanitiza email removendo caracteres perigosos
 * Mantém apenas caracteres válidos de email
 * Complexidade: O(N)
 *
 * @param email - Email para sanitizar
 * @returns Email sanitizado
 */
export function sanitizeEmail(email: string): string {
  if (!email) {
    return '';
  }

  // Remove whitespace
  let sanitized = email.trim().toLowerCase();

  // Mantém apenas caracteres válidos: a-z, 0-9, @, ., -, _, +
  sanitized = sanitized.replace(/[^a-z0-9@.\-_+]/g, '');

  // Limita tamanho (RFC 5321)
  if (sanitized.length > 254) {
    sanitized = sanitized.substring(0, 254);
  }

  return sanitized;
}

/**
 * Sanitiza número removendo caracteres não-numéricos
 * Útil para inputs de telefone, CEP, etc.
 * Complexidade: O(N)
 *
 * @param input - Input com possíveis caracteres não-numéricos
 * @returns Apenas dígitos
 */
export function sanitizeNumeric(input: string): string {
  if (!input) {
    return '';
  }

  return input.replace(/\D/g, '');
}

/**
 * Sanitiza input para uso em atributos HTML
 * Previne quebra de atributos e XSS
 * Complexidade: O(N)
 *
 * @param input - String para usar em atributo
 * @returns String segura para atributo
 */
export function sanitizeHtmlAttribute(input: string): string {
  if (!input) {
    return '';
  }

  // Remove aspas e caracteres perigosos
  return input
    .replace(/["'<>`]/g, '')
    .trim();
}

/**
 * Sanitiza JSON string
 * Previne JSON injection
 * Complexidade: O(N)
 *
 * @param input - JSON string
 * @returns JSON sanitizado ou null em caso de erro
 */
export function sanitizeJson(input: string): string | null {
  if (!input) {
    return null;
  }

  try {
    // Tenta parsear e stringify novamente para garantir formato válido
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

/**
 * Cria um Content Security Policy (CSP) header
 * Útil para configuração de segurança
 *
 * @returns CSP string
 */
export function generateCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://firestore.googleapis.com https://api.emailjs.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
