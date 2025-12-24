/**
 * SSRF Protection
 * OWASP A10 - Server-Side Request Forgery
 *
 * Valida e sanitiza URLs para prevenir SSRF attacks:
 * - Whitelist de domínios permitidos
 * - Blacklist de IPs privados
 * - Validação de protocolos
 * - Prevenção de redirects maliciosos
 */

import { logger } from '@/services/observability/logger';

/**
 * Domínios permitidos (whitelist)
 */
const ALLOWED_DOMAINS = [
  'firebase.google.com',
  'firebaseio.com',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'api.emailjs.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

/**
 * IPs e ranges privados (blacklist)
 */
const PRIVATE_IP_RANGES = [
  /^127\./,                    // Localhost
  /^10\./,                     // Private network
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private network
  /^192\.168\./,               // Private network
  /^169\.254\./,               // Link-local
  /^::1$/,                     // IPv6 localhost
  /^fe80:/,                    // IPv6 link-local
  /^fc00:/,                    // IPv6 private
  /^fd00:/,                    // IPv6 private
];

/**
 * Protocolos permitidos
 */
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

/**
 * Verifica se é IP privado
 */
function isPrivateIP(hostname: string): boolean {
  // Verificar se é IP (não domínio)
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-f:]+)$/i;
  if (!ipPattern.test(hostname)) {
    return false; // É um domínio, não IP
  }

  // Verificar contra ranges privados
  return PRIVATE_IP_RANGES.some((pattern) => pattern.test(hostname));
}

/**
 * Verifica se domínio está na whitelist
 */
function isDomainAllowed(hostname: string): boolean {
  return ALLOWED_DOMAINS.some((domain) => {
    // Exact match ou subdomínio
    return hostname === domain || hostname.endsWith(`.${domain}`);
  });
}

/**
 * Valida URL contra SSRF
 */
export function validateURL(url: string): {
  valid: boolean;
  error?: string;
  sanitizedURL?: string;
} {
  try {
    // 1. Parse URL
    const urlObj = new URL(url);

    // 2. Verificar protocolo
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      logger.warn('URL blocked - invalid protocol', {
        component: 'SSRFProtection',
        url,
        protocol: urlObj.protocol,
      });

      return {
        valid: false,
        error: `Protocolo não permitido: ${urlObj.protocol}`,
      };
    }

    // 3. Verificar IP privado
    if (isPrivateIP(urlObj.hostname)) {
      logger.warn('URL blocked - private IP', {
        component: 'SSRFProtection',
        url,
        hostname: urlObj.hostname,
      });

      return {
        valid: false,
        error: 'Acesso a IPs privados não permitido',
      };
    }

    // 4. Verificar whitelist de domínios
    if (!isDomainAllowed(urlObj.hostname)) {
      logger.warn('URL blocked - domain not in whitelist', {
        component: 'SSRFProtection',
        url,
        hostname: urlObj.hostname,
      });

      return {
        valid: false,
        error: `Domínio não autorizado: ${urlObj.hostname}`,
      };
    }

    // 5. Sanitizar URL (remover credenciais se houver)
    urlObj.username = '';
    urlObj.password = '';

    logger.debug('URL validated successfully', {
      component: 'SSRFProtection',
      url,
      hostname: urlObj.hostname,
    });

    return {
      valid: true,
      sanitizedURL: urlObj.toString(),
    };
  } catch (error) {
    logger.error('URL validation failed', error as Error, {
      component: 'SSRFProtection',
      url,
    });

    return {
      valid: false,
      error: 'URL inválida',
    };
  }
}

/**
 * Adiciona domínio à whitelist (runtime)
 */
export function addAllowedDomain(domain: string): void {
  if (!ALLOWED_DOMAINS.includes(domain)) {
    ALLOWED_DOMAINS.push(domain);

    logger.info('Domain added to whitelist', {
      component: 'SSRFProtection',
      domain,
    });
  }
}

/**
 * Remove domínio da whitelist (runtime)
 */
export function removeAllowedDomain(domain: string): void {
  const index = ALLOWED_DOMAINS.indexOf(domain);
  if (index > -1) {
    ALLOWED_DOMAINS.splice(index, 1);

    logger.info('Domain removed from whitelist', {
      component: 'SSRFProtection',
      domain,
    });
  }
}

/**
 * Retorna lista de domínios permitidos
 */
export function getAllowedDomains(): readonly string[] {
  return [...ALLOWED_DOMAINS];
}

/**
 * Wrapper seguro para fetch com validação SSRF
 */
export async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const validation = validateURL(url);

  if (!validation.valid) {
    throw new Error(`SSRF Protection: ${validation.error}`);
  }

  logger.info('Safe fetch initiated', {
    component: 'SSRFProtection',
    url: validation.sanitizedURL,
  });

  // Usar URL sanitizada
  return fetch(validation.sanitizedURL!, options);
}

/**
 * Valida e sanitiza URL de redirect
 */
export function validateRedirectURL(url: string, baseURL: string): {
  valid: boolean;
  error?: string;
  sanitizedURL?: string;
} {
  try {
    const urlObj = new URL(url, baseURL);
    const baseObj = new URL(baseURL);

    // Permitir apenas redirects para o mesmo domínio
    if (urlObj.hostname !== baseObj.hostname) {
      logger.warn('Redirect blocked - different domain', {
        component: 'SSRFProtection',
        from: baseURL,
        to: url,
        fromHost: baseObj.hostname,
        toHost: urlObj.hostname,
      });

      return {
        valid: false,
        error: 'Redirect para domínio diferente não permitido',
      };
    }

    return {
      valid: true,
      sanitizedURL: urlObj.toString(),
    };
  } catch (error) {
    return {
      valid: false,
      error: 'URL de redirect inválida',
    };
  }
}

/**
 * Validação de URL de imagem/recurso
 */
export function validateResourceURL(url: string): boolean {
  // Permitir data URLs (base64 images)
  if (url.startsWith('data:')) {
    return true;
  }

  // Permitir URLs relativas
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true;
  }

  // Validar URLs absolutas
  const validation = validateURL(url);
  return validation.valid;
}
