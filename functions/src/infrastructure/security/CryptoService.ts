/**
 * Infrastructure: Crypto Service
 * Implementação de criptografia AES-256
 */

import * as CryptoJS from 'crypto-js';

export class CryptoService {
  static generateKey(token: string): string {
    return CryptoJS.SHA256(token).toString();
  }

  static encrypt(text: string, key: string): string {
    return CryptoJS.AES.encrypt(text, key).toString();
  }

  static decrypt(encryptedText: string, key: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) throw new Error('Decryption failed');
      return decrypted;
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }
}
