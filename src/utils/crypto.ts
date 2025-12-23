import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Criptografa dados usando AES-256
 * @param data - Dados para criptografar
 * @param key - Chave de criptografia
 * @returns Dados criptografados (Base64)
 */
export function encrypt(data: string, key: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, key);
    return encrypted.toString();
  } catch (error) {
    console.error('Erro ao criptografar dados:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa dados usando AES-256
 * @param encryptedData - Dados criptografados (Base64)
 * @param key - Chave de criptografia
 * @returns Dados descriptografados
 */
export function decrypt(encryptedData: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error('Chave de descriptografia inválida');
    }

    return decrypted;
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
 * Gera token UUID v4 para gestores
 * @returns Token UUID único
 */
export function generateToken(): string {
  return uuidv4();
}

/**
 * Gera código de acesso de 6 dígitos para colaboradores
 * @returns Código de 6 dígitos
 */
export function generateAccessCode(): string {
  // Gera 6 dígitos aleatórios
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
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
 * Gera chave de criptografia única para uma avaliação
 * Baseada no token do gestor
 * @param token - Token UUID do gestor
 * @returns Chave de criptografia
 */
export function generateEncryptionKey(token: string): string {
  // Deriva uma chave forte do token
  return CryptoJS.SHA256(token + 'avalia360-secret-salt').toString();
}

/**
 * Valida se um email tem formato válido
 * @param email - Email para validar
 * @returns true se válido
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) {
    return false;
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida se um código de acesso tem formato válido (6 dígitos)
 * @param code - Código para validar
 * @returns true se válido
 */
export function isValidAccessCode(code: string): boolean {
  const regex = /^\d{6}$/;
  return regex.test(code);
}

/**
 * Valida se um rating está entre 1-5
 * @param rating - Rating para validar
 * @returns true se válido
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Criptografa número (rating)
 * Para manter consistência, converte para string antes
 * @param value - Número para criptografar
 * @param key - Chave de criptografia
 * @returns Número criptografado como string
 */
export function encryptNumber(value: number, key: string): string {
  return encrypt(value.toString(), key);
}

/**
 * Descriptografa número
 * @param encryptedValue - Valor criptografado
 * @param key - Chave de criptografia
 * @returns Número descriptografado
 */
export function decryptNumber(encryptedValue: string, key: string): number {
  const decrypted = decrypt(encryptedValue, key);
  const number = parseInt(decrypted, 10);

  if (isNaN(number)) {
    throw new Error('Valor descriptografado não é um número válido');
  }

  return number;
}

/**
 * Verifica se dois hashes são iguais (timing-safe comparison)
 * Evita timing attacks
 * @param a - Primeiro hash
 * @param b - Segundo hash
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
