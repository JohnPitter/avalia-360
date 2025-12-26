/**
 * Encryption Service - Backend Only
 *
 * ✅ Criptografia AES-256 com chave do environment
 * ✅ Hash SHA-256 para códigos de acesso
 * ✅ Funções puras e testáveis
 *
 * IMPORTANTE: Este serviço roda APENAS no backend (Firebase Functions)
 * A chave de criptografia NUNCA é exposta ao frontend
 */

import * as CryptoJS from 'crypto-js';

/**
 * Obtém chave de criptografia do environment
 * - Desenvolvimento: .env file
 * - Produção: GitHub Secret → Firebase Functions environment
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY não configurada! Configure via .env (local) ou GitHub Secret (prod)'
    );
  }

  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY deve ter no mínimo 32 caracteres');
  }

  return key;
}

/**
 * Criptografa um texto usando AES-256
 * Usa a chave do environment automaticamente
 * @param plaintext - Texto plaintext
 * @returns Texto criptografado
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Texto para criptografar não pode ser vazio');
  }

  const key = getEncryptionKey();
  const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
  return encrypted;
}

/**
 * Descriptografa um texto usando AES-256
 * Usa a chave do environment automaticamente
 * @param ciphertext - Texto criptografado
 * @returns Texto plaintext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Texto criptografado não pode ser vazio');
  }

  const key = getEncryptionKey();

  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plaintext) {
      throw new Error('Chave de descriptografia inválida');
    }

    return plaintext;
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    throw new Error('Falha na descriptografia');
  }
}

/**
 * Gera hash SHA-256 de um valor
 * @param value - Valor para fazer hash
 * @returns Hash SHA-256
 */
export function hash(value: string): string {
  return CryptoJS.SHA256(value).toString();
}

/**
 * Gera hash SHA-256 do email (para armazenamento)
 * @param email - Email para fazer hash
 * @returns Hash SHA-256 do email em lowercase
 */
export function hashEmail(email: string): string {
  return hash(email.toLowerCase().trim());
}

/**
 * Gera hash do código de acesso (para armazenamento)
 * @param code - Código de 6 dígitos
 * @returns Hash SHA-256 do código
 */
export function hashAccessCode(code: string): string {
  return hash(code);
}

/**
 * Compara dois hashes de forma timing-safe
 * Previne timing attacks
 * @param a - Hash A
 * @param b - Hash B
 * @returns true se iguais
 */
export function compareHashes(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
