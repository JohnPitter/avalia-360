/**
 * Infrastructure: Hash Service
 * Implementação de hashing SHA-256
 */

import * as CryptoJS from 'crypto-js';

export class HashService {
  static hash(text: string): string {
    return CryptoJS.SHA256(text).toString();
  }

  static hashEmail(email: string): string {
    return this.hash(email.toLowerCase().trim());
  }

  static hashAccessCode(code: string): string {
    return this.hash(code);
  }
}
