import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  hash,
  hashEmail,
  generateToken,
  generateAccessCode,
  hashAccessCode,
  generateEncryptionKey,
  isValidEmail,
  isValidAccessCode,
  isValidRating,
  encryptNumber,
  decryptNumber,
  compareHashes,
} from './crypto';

describe('Encryption/Decryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'Dados sensíveis';
    const key = 'test-key-123';

    const encrypted = encrypt(original, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });

  it('should fail with wrong key', () => {
    const encrypted = encrypt('data', 'key1');

    expect(() => decrypt(encrypted, 'key2')).toThrow();
  });

  it('should produce different ciphertext for same input', () => {
    const text = 'same text';
    const key = 'same key';

    const encrypted1 = encrypt(text, key);
    const encrypted2 = encrypt(text, key);

    // IV deve ser aleatório, então ciphertext diferente
    expect(encrypted1).not.toBe(encrypted2);
    // Mas ambos descriptografam para o mesmo valor
    expect(decrypt(encrypted1, key)).toBe(text);
    expect(decrypt(encrypted2, key)).toBe(text);
  });

  it('should encrypt and decrypt numbers', () => {
    const number = 5;
    const key = 'test-key';

    const encrypted = encryptNumber(number, key);
    const decrypted = decryptNumber(encrypted, key);

    expect(decrypted).toBe(number);
    expect(typeof encrypted).toBe('string');
  });
});

describe('Hashing', () => {
  it('should hash consistently', () => {
    const value = 'test value';
    const hash1 = hash(value);
    const hash2 = hash(value);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(value);
  });

  it('should produce different hashes for different values', () => {
    const hash1 = hash('value1');
    const hash2 = hash('value2');

    expect(hash1).not.toBe(hash2);
  });

  it('should hash email correctly', () => {
    const email = 'user@example.com';
    const hashedEmail = hashEmail(email);

    // Deve ser consistente
    expect(hashEmail(email)).toBe(hashedEmail);

    // Deve normalizar (lowercase, trim)
    expect(hashEmail('  USER@EXAMPLE.COM  ')).toBe(hashedEmail);
  });

  it('should hash access code correctly', () => {
    const code = '123456';
    const hashedCode = hashAccessCode(code);

    expect(hashedCode).toBe(hash(code));
    expect(hashedCode).not.toBe(code);
  });
});

describe('Token Generation', () => {
  it('should generate UUID token', () => {
    const token1 = generateToken();
    const token2 = generateToken();

    // Deve ser UUID v4 válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(token1).toMatch(uuidRegex);
    expect(token2).toMatch(uuidRegex);

    // Deve ser único
    expect(token1).not.toBe(token2);
  });

  it('should generate 6-digit access code', () => {
    const code = generateAccessCode();

    expect(code).toMatch(/^\d{6}$/);
    expect(code.length).toBe(6);
  });

  it('should generate unique access codes', () => {
    const codes = new Set();

    for (let i = 0; i < 100; i++) {
      codes.add(generateAccessCode());
    }

    // Alta chance de unicidade (> 90% de 100 códigos devem ser únicos)
    expect(codes.size).toBeGreaterThan(90);
  });

  it('should generate encryption key from token', () => {
    const token = generateToken();
    const key1 = generateEncryptionKey(token);
    const key2 = generateEncryptionKey(token);

    // Mesma chave para mesmo token
    expect(key1).toBe(key2);

    // Diferente para tokens diferentes
    const differentKey = generateEncryptionKey(generateToken());
    expect(key1).not.toBe(differentKey);
  });
});

describe('Validation', () => {
  describe('Email validation', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('should reject email too long', () => {
      const longEmail = 'a'.repeat(255) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('Access code validation', () => {
    it('should validate correct codes', () => {
      expect(isValidAccessCode('123456')).toBe(true);
      expect(isValidAccessCode('000000')).toBe(true);
      expect(isValidAccessCode('999999')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(isValidAccessCode('12345')).toBe(false); // Too short
      expect(isValidAccessCode('1234567')).toBe(false); // Too long
      expect(isValidAccessCode('12345a')).toBe(false); // Contains letter
      expect(isValidAccessCode('abcdef')).toBe(false); // All letters
      expect(isValidAccessCode('')).toBe(false); // Empty
    });
  });

  describe('Rating validation', () => {
    it('should validate correct ratings', () => {
      expect(isValidRating(1)).toBe(true);
      expect(isValidRating(2)).toBe(true);
      expect(isValidRating(3)).toBe(true);
      expect(isValidRating(4)).toBe(true);
      expect(isValidRating(5)).toBe(true);
    });

    it('should reject invalid ratings', () => {
      expect(isValidRating(0)).toBe(false);
      expect(isValidRating(6)).toBe(false);
      expect(isValidRating(-1)).toBe(false);
      expect(isValidRating(1.5)).toBe(false); // Not integer
      expect(isValidRating(NaN)).toBe(false);
    });
  });
});

describe('Hash Comparison', () => {
  it('should compare hashes correctly', () => {
    const value = 'test';
    const hash1 = hash(value);
    const hash2 = hash(value);

    expect(compareHashes(hash1, hash2)).toBe(true);
  });

  it('should detect different hashes', () => {
    const hash1 = hash('value1');
    const hash2 = hash('value2');

    expect(compareHashes(hash1, hash2)).toBe(false);
  });

  it('should handle different lengths', () => {
    const hash1 = 'short';
    const hash2 = 'longer_hash';

    expect(compareHashes(hash1, hash2)).toBe(false);
  });
});
