import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidEmail,
  isValidName,
  isValidAccessCode,
  isValidRating,
  isValidComment,
  isValidTitle,
  validateTeamMembers,
  validateEvaluationForm,
  normalizeEmail,
  normalizeName,
  sanitizeQueryString,
  isValidUUID,
  isValidUrl,
  checkRateLimit,
  resetRateLimit,
} from './validation';

describe('Email Validation', () => {
  it('should validate correct emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    expect(isValidEmail('user.name@example.com')).toBe(true);
    expect(isValidEmail('user_name@example.com')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail('user@domain')).toBe(false);
  });

  it('should reject email too long', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(isValidEmail(longEmail)).toBe(false);
  });
});

describe('Name Validation', () => {
  it('should validate correct names', () => {
    expect(isValidName('João Silva')).toBe(true);
    expect(isValidName('Maria José')).toBe(true);
    expect(isValidName("O'Connor")).toBe(true);
    expect(isValidName('Jean-Pierre')).toBe(true);
    expect(isValidName('José María Aznar López')).toBe(true);
  });

  it('should reject invalid names', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName('A')).toBe(false); // Too short
    expect(isValidName('John123')).toBe(false); // Contains numbers
    expect(isValidName('John@Doe')).toBe(false); // Special chars
    expect(isValidName('a'.repeat(101))).toBe(false); // Too long
  });

  it('should handle whitespace correctly', () => {
    expect(isValidName('  João Silva  ')).toBe(true); // Trim applied
    expect(isValidName('   ')).toBe(false); // Only spaces
  });
});

describe('Access Code Validation', () => {
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
    expect(isValidAccessCode('')).toBe(false);
    expect(isValidAccessCode('12 34 56')).toBe(false); // Spaces
  });
});

describe('Rating Validation', () => {
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
    expect(isValidRating(3.7)).toBe(false);
    expect(isValidRating(NaN)).toBe(false);
  });
});

describe('Comment Validation', () => {
  it('should validate comments within limit', () => {
    expect(isValidComment('')).toBe(true); // Empty is valid
    expect(isValidComment('Short comment')).toBe(true);
    expect(isValidComment('a'.repeat(500))).toBe(true); // Exactly 500
  });

  it('should reject comments over limit', () => {
    expect(isValidComment('a'.repeat(501))).toBe(false);
    expect(isValidComment('a'.repeat(1000))).toBe(false);
  });
});

describe('Title Validation', () => {
  it('should validate correct titles', () => {
    expect(isValidTitle('Avaliação Q4 2024')).toBe(true);
    expect(isValidTitle('a')).toBe(true); // Minimum 1 char
    expect(isValidTitle('a'.repeat(200))).toBe(true); // Maximum 200
  });

  it('should reject invalid titles', () => {
    expect(isValidTitle('')).toBe(false);
    expect(isValidTitle('   ')).toBe(false); // Only spaces
    expect(isValidTitle('a'.repeat(201))).toBe(false);
  });

  it('should handle whitespace correctly', () => {
    expect(isValidTitle('  Título  ')).toBe(true); // Trim applied
  });
});

describe('Team Members Validation', () => {
  it('should validate correct team members', () => {
    const members = [
      { name: 'João Silva', email: 'joao@example.com' },
      { name: 'Maria Santos', email: 'maria@example.com' },
      { name: 'Pedro Costa', email: 'pedro@example.com' },
    ];

    const result = validateTeamMembers(members);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject less than 2 members', () => {
    const members = [{ name: 'João Silva', email: 'joao@example.com' }];

    const result = validateTeamMembers(members);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Mínimo de 2 membros necessário para avaliação 360°');
  });

  it('should reject more than 100 members', () => {
    const members = Array.from({ length: 101 }, (_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`,
    }));

    const result = validateTeamMembers(members);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Máximo de 100 membros permitido');
  });

  it('should detect duplicate emails', () => {
    const members = [
      { name: 'João Silva', email: 'joao@example.com' },
      { name: 'Maria Santos', email: 'joao@example.com' }, // Duplicate
    ];

    const result = validateTeamMembers(members);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Email duplicado'))).toBe(true);
  });

  it('should detect duplicate emails case-insensitive', () => {
    const members = [
      { name: 'João Silva', email: 'joao@example.com' },
      { name: 'Maria Santos', email: 'JOAO@EXAMPLE.COM' }, // Same email, different case
    ];

    const result = validateTeamMembers(members);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Email duplicado'))).toBe(true);
  });

  it('should validate individual member names', () => {
    const members = [
      { name: '', email: 'joao@example.com' }, // Empty name
      { name: 'Maria Santos', email: 'maria@example.com' },
    ];

    const result = validateTeamMembers(members);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Nome está vazio'))).toBe(true);
  });

  it('should validate individual member emails', () => {
    const members = [
      { name: 'João Silva', email: 'invalid-email' }, // Invalid email
      { name: 'Maria Santos', email: 'maria@example.com' },
    ];

    const result = validateTeamMembers(members);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Email inválido'))).toBe(true);
  });
});

describe('Evaluation Form Validation', () => {
  const validFormData = {
    question_1: 4,
    question_2: 5,
    question_3: 3,
    question_4: 4,
    positive_points: 'Excelente comunicação e proatividade.',
    improvement_points: 'Poderia ser mais pontual nas entregas.',
  };

  it('should validate correct form data', () => {
    const result = validateEvaluationForm(validFormData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid ratings', () => {
    const invalidData = { ...validFormData, question_1: 6 };
    const result = validateEvaluationForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Pergunta 1'))).toBe(true);
  });

  it('should reject comments over 500 characters', () => {
    const invalidData = {
      ...validFormData,
      positive_points: 'a'.repeat(501),
    };
    const result = validateEvaluationForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Máximo de 500 caracteres'))).toBe(true);
  });

  it('should require positive points', () => {
    const invalidData = { ...validFormData, positive_points: '' };
    const result = validateEvaluationForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Pontos positivos: Campo obrigatório'))).toBe(true);
  });

  it('should require improvement points', () => {
    const invalidData = { ...validFormData, improvement_points: '   ' };
    const result = validateEvaluationForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Pontos de melhoria: Campo obrigatório'))).toBe(true);
  });
});

describe('Email Normalization', () => {
  it('should normalize email to lowercase', () => {
    expect(normalizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    expect(normalizeEmail('User@Example.Com')).toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
    expect(normalizeEmail('\tuser@example.com\n')).toBe('user@example.com');
  });
});

describe('Name Normalization', () => {
  it('should capitalize first letter of each word', () => {
    expect(normalizeName('joão silva')).toBe('João Silva');
    expect(normalizeName('MARIA SANTOS')).toBe('Maria Santos');
    expect(normalizeName('pedro de souza')).toBe('Pedro De Souza');
  });

  it('should trim and remove extra spaces', () => {
    expect(normalizeName('  joão   silva  ')).toBe('João Silva');
    expect(normalizeName('maria     santos')).toBe('Maria Santos');
  });

  it('should handle single names', () => {
    expect(normalizeName('joão')).toBe('João');
    expect(normalizeName('MARIA')).toBe('Maria');
  });
});

describe('Query String Sanitization', () => {
  it('should allow strings within limit', () => {
    const query = 'a'.repeat(1000);
    expect(sanitizeQueryString(query)).toBe(query);
  });

  it('should truncate strings over limit', () => {
    const query = 'a'.repeat(1500);
    const sanitized = sanitizeQueryString(query);
    expect(sanitized.length).toBe(1000);
    expect(sanitized).toBe('a'.repeat(1000));
  });

  it('should handle empty strings', () => {
    expect(sanitizeQueryString('')).toBe('');
  });
});

describe('UUID Validation', () => {
  it('should validate correct UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('6ba7b810-9dad-41d1-80b4-00c04fd430c8')).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('invalid-uuid')).toBe(false);
    expect(isValidUUID('123')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('550e8400-e29b-31d4-a716-446655440000')).toBe(false); // Wrong version
  });

  it('should be case-insensitive', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });
});

describe('URL Validation', () => {
  it('should validate correct HTTP/HTTPS URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path')).toBe(true);
    expect(isValidUrl('https://sub.example.com')).toBe(true);
  });

  it('should reject non-HTTP protocols', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });

  it('should enforce domain whitelist', () => {
    const allowedDomains = ['example.com', 'trusted.org'];

    expect(isValidUrl('https://example.com', allowedDomains)).toBe(true);
    expect(isValidUrl('https://sub.example.com', allowedDomains)).toBe(true);
    expect(isValidUrl('https://trusted.org', allowedDomains)).toBe(true);
    expect(isValidUrl('https://evil.com', allowedDomains)).toBe(false);
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset rate limits before each test
    resetRateLimit('test-key');
  });

  it('should allow first attempts', () => {
    const result = checkRateLimit('test-key', 5);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(4);
  });

  it('should track multiple attempts', () => {
    checkRateLimit('test-key', 5);
    checkRateLimit('test-key', 5);
    const result = checkRateLimit('test-key', 5);

    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(2);
  });

  it('should block after max attempts', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-key', 5);
    }

    const result = checkRateLimit('test-key', 5);
    expect(result.allowed).toBe(false);
    expect(result.remainingAttempts).toBe(0);
  });

  it('should use different counters for different keys', () => {
    checkRateLimit('key1', 5);
    checkRateLimit('key1', 5);

    const result = checkRateLimit('key2', 5);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(4);
  });

  it('should reset after time window', async () => {
    const windowMs = 100; // 100ms window for testing

    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-key', 5, windowMs);
    }

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    const result = checkRateLimit('test-key', 5, windowMs);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(4);
  });

  it('should reset manually', () => {
    checkRateLimit('test-key', 5);
    checkRateLimit('test-key', 5);

    resetRateLimit('test-key');

    const result = checkRateLimit('test-key', 5);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(4);
  });
});
