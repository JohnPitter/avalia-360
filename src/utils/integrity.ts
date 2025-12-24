/**
 * Software and Data Integrity Checks
 * OWASP A08 - Software and Data Integrity Failures
 *
 * Implementa verificações de integridade:
 * - Validação de dados críticos
 * - Checksums de configurações
 * - Verificação de modificações não autorizadas
 */

import { logger } from '@/services/observability/logger';

/**
 * Calcula hash SHA-256 de dados
 */
async function calculateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica integridade de configurações críticas
 */
export async function verifyConfigIntegrity(): Promise<boolean> {
  try {
    // Verificar que variáveis de ambiente críticas estão presentes
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_ENCRYPTION_KEY',
    ];

    const missing = requiredEnvVars.filter(
      (key) => !import.meta.env[key] || import.meta.env[key] === ''
    );

    if (missing.length > 0) {
      logger.critical('Missing critical environment variables', undefined, {
        component: 'IntegrityCheck',
        missing,
      });
      return false;
    }

    // Verificar comprimento da chave de criptografia
    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
    if (encryptionKey && encryptionKey.length !== 32) {
      logger.critical('Invalid encryption key length', undefined, {
        component: 'IntegrityCheck',
        expected: 32,
        actual: encryptionKey.length,
      });
      return false;
    }

    logger.info('Configuration integrity verified', {
      component: 'IntegrityCheck',
    });

    return true;
  } catch (error) {
    logger.error('Configuration integrity check failed', error as Error, {
      component: 'IntegrityCheck',
    });
    return false;
  }
}

/**
 * Verifica integridade de dados antes de descriptografar
 */
export async function verifyDataIntegrity(
  encryptedData: string,
  expectedHash?: string
): Promise<boolean> {
  try {
    if (!expectedHash) {
      // Se não tem hash esperado, apenas verifica formato
      return encryptedData.includes(':');
    }

    // Calcula hash dos dados
    const actualHash = await calculateHash(encryptedData);

    if (actualHash !== expectedHash) {
      logger.warn('Data integrity check failed - hash mismatch', {
        component: 'IntegrityCheck',
        expectedHash: expectedHash.substring(0, 10) + '...',
        actualHash: actualHash.substring(0, 10) + '...',
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Data integrity verification failed', error as Error, {
      component: 'IntegrityCheck',
    });
    return false;
  }
}

/**
 * Valida estrutura de objeto contra schema
 */
export function validateObjectStructure<T extends Record<string, unknown>>(
  obj: unknown,
  requiredFields: Array<keyof T>
): obj is T {
  if (!obj || typeof obj !== 'object') {
    logger.warn('Object validation failed - not an object', {
      component: 'IntegrityCheck',
      type: typeof obj,
    });
    return false;
  }

  const missing = requiredFields.filter((field) => !(field in obj));

  if (missing.length > 0) {
    logger.warn('Object validation failed - missing fields', {
      component: 'IntegrityCheck',
      missing: missing.map(String),
    });
    return false;
  }

  return true;
}

/**
 * Verifica se código JavaScript foi modificado (basic check)
 */
export async function verifyScriptIntegrity(scriptContent: string): Promise<boolean> {
  try {
    // Verificações básicas de segurança
    const suspiciousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(\s*["'`]/i,
      /setInterval\s*\(\s*["'`]/i,
      /__proto__/i,
      /constructor\s*\[/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(scriptContent)) {
        logger.warn('Script contains suspicious pattern', {
          component: 'IntegrityCheck',
          pattern: pattern.toString(),
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Script integrity check failed', error as Error, {
      component: 'IntegrityCheck',
    });
    return false;
  }
}

/**
 * Verifica integridade de dados do Firestore
 */
export function verifyFirestoreDocument<T extends Record<string, unknown>>(
  doc: unknown,
  requiredFields: Array<keyof T>,
  typeChecks?: Partial<Record<keyof T, string>>
): doc is T {
  // Validar estrutura
  if (!validateObjectStructure<T>(doc, requiredFields)) {
    return false;
  }

  // Validar tipos se fornecidos
  if (typeChecks) {
    for (const [field, expectedType] of Object.entries(typeChecks)) {
      const actualType = typeof (doc as T)[field as keyof T];
      if (actualType !== expectedType) {
        logger.warn('Firestore document type mismatch', {
          component: 'IntegrityCheck',
          field,
          expectedType,
          actualType,
        });
        return false;
      }
    }
  }

  return true;
}

/**
 * Gera checksum para validação posterior
 */
export async function generateChecksum(data: Record<string, unknown>): Promise<string> {
  const serialized = JSON.stringify(data);
  return calculateHash(serialized);
}

/**
 * Verifica checksum de dados
 */
export async function verifyChecksum(
  data: Record<string, unknown>,
  expectedChecksum: string
): Promise<boolean> {
  const actualChecksum = await generateChecksum(data);
  return actualChecksum === expectedChecksum;
}
