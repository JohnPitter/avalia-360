import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  stripAllTags,
  sanitizeText,
  sanitizeForFirestore,
  sanitizeFilename,
  escapeRegExp,
  sanitizeUrl,
  sanitizeObject,
  sanitizeArray,
  encodeHtmlEntities,
  decodeHtmlEntities,
  sanitizeEmail,
  sanitizeNumeric,
  sanitizeHtmlAttribute,
  sanitizeJson,
  generateCSP,
} from './sanitization';

describe('HTML Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous scripts', () => {
      const dirty = '<p>Hello</p><script>alert("XSS")</script>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
    });

    it('should allow safe tags', () => {
      const dirty = '<p>Hello <strong>world</strong></p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('<p>');
      expect(clean).toContain('<strong>');
    });

    it('should remove event handlers', () => {
      const dirty = '<p onclick="alert(1)">Click me</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
    });

    it('should remove iframes', () => {
      const dirty = '<p>Content</p><iframe src="evil.com"></iframe>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<iframe>');
      expect(clean).not.toContain('evil.com');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('stripAllTags', () => {
    it('should remove all HTML tags', () => {
      const dirty = '<p>Hello <strong>world</strong></p>';
      const clean = stripAllTags(dirty);
      expect(clean).toBe('Hello world');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
    });

    it('should keep text content', () => {
      const dirty = '<script>alert("test")</script>Important text';
      const clean = stripAllTags(dirty);
      expect(clean).toContain('Important text');
      expect(clean).not.toContain('script');
    });

    it('should handle empty input', () => {
      expect(stripAllTags('')).toBe('');
    });
  });
});

describe('Text Sanitization', () => {
  it('should remove HTML tags and normalize whitespace', () => {
    const dirty = '<p>Hello   \n\n  world</p>';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Hello world');
  });

  it('should limit length', () => {
    const long = 'a'.repeat(2000);
    const clean = sanitizeText(long, 100);
    expect(clean.length).toBe(100);
  });

  it('should handle empty input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('should normalize multiple spaces', () => {
    const dirty = 'Hello     world    test';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Hello world test');
  });
});

describe('Firestore Sanitization', () => {
  it('should remove dangerous NoSQL operators', () => {
    const dirty = 'user@example.com{"$gt":""}';
    const clean = sanitizeForFirestore(dirty);
    expect(clean).not.toContain('$');
    expect(clean).not.toContain('{');
    expect(clean).not.toContain('}');
  });

  it('should remove brackets', () => {
    const dirty = 'test[0]';
    const clean = sanitizeForFirestore(dirty);
    expect(clean).not.toContain('[');
    expect(clean).not.toContain(']');
  });

  it('should handle empty input', () => {
    expect(sanitizeForFirestore('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeForFirestore(null as unknown as string)).toBe('');
    expect(sanitizeForFirestore(undefined as unknown as string)).toBe('');
  });
});

describe('Filename Sanitization', () => {
  it('should prevent path traversal', () => {
    const dirty = '../../../etc/passwd';
    const clean = sanitizeFilename(dirty);
    expect(clean).not.toContain('..');
    expect(clean).not.toContain('/');
  });

  it('should allow safe filenames', () => {
    const filename = 'document-2024.pdf';
    const clean = sanitizeFilename(filename);
    expect(clean).toBe('document-2024.pdf');
  });

  it('should replace dangerous characters', () => {
    const dirty = 'my file?.txt';
    const clean = sanitizeFilename(dirty);
    expect(clean).toBe('my_file_.txt');
  });

  it('should limit length', () => {
    const long = 'a'.repeat(300) + '.txt';
    const clean = sanitizeFilename(long);
    expect(clean.length).toBe(255);
  });

  it('should handle empty input', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});

describe('RegExp Escaping', () => {
  it('should escape special regex characters', () => {
    const special = '.*+?^${}()|[]\\';
    const escaped = escapeRegExp(special);
    expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('should not affect normal characters', () => {
    const normal = 'hello world 123';
    const escaped = escapeRegExp(normal);
    expect(escaped).toBe(normal);
  });

  it('should handle empty input', () => {
    expect(escapeRegExp('')).toBe('');
  });

  it('should prevent ReDoS attacks', () => {
    const malicious = '(a+)+';
    const escaped = escapeRegExp(malicious);
    // O regex escapado não causará ReDoS
    const regex = new RegExp(escaped);
    expect(() => regex.test('test')).not.toThrow();
  });
});

describe('URL Sanitization', () => {
  it('should allow HTTP and HTTPS URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('should reject javascript: URIs', () => {
    const malicious = 'javascript:alert(1)';
    expect(sanitizeUrl(malicious)).toBe('');
  });

  it('should reject data: URIs', () => {
    const malicious = 'data:text/html,<script>alert(1)</script>';
    expect(sanitizeUrl(malicious)).toBe('');
  });

  it('should reject file: URIs', () => {
    const malicious = 'file:///etc/passwd';
    expect(sanitizeUrl(malicious)).toBe('');
  });

  it('should reject invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBe('');
    expect(sanitizeUrl('')).toBe('');
  });

  it('should normalize URLs', () => {
    const url = 'https://example.com/path';
    expect(sanitizeUrl(url)).toBe('https://example.com/path');
  });
});

describe('Object Sanitization', () => {
  it('should remove dangerous properties', () => {
    const dirty = {
      name: 'João',
      __proto__: { admin: true },
      constructor: { admin: true },
      prototype: { admin: true },
    };

    const clean = sanitizeObject(dirty);
    expect(clean).not.toHaveProperty('__proto__');
    expect(clean).not.toHaveProperty('constructor');
    expect(clean).not.toHaveProperty('prototype');
    expect(clean).toHaveProperty('name');
  });

  it('should keep safe properties', () => {
    const obj = { name: 'João', email: 'joao@example.com' };
    const clean = sanitizeObject(obj);
    expect(clean).toEqual(obj);
  });

  it('should handle empty object', () => {
    const obj = {};
    const clean = sanitizeObject(obj);
    expect(clean).toEqual({});
  });

  it('should handle non-object input', () => {
    expect(sanitizeObject(null as unknown as Record<string, unknown>)).toBeNull();
  });
});

describe('Array Sanitization', () => {
  it('should sanitize all strings in array', () => {
    const dirty = ['<p>Hello</p>', '<script>alert(1)</script>'];
    const clean = sanitizeArray(dirty);
    expect(clean).toEqual(['Hello', '']);
  });

  it('should filter non-string elements', () => {
    const dirty = ['hello', 123, 'world', null, undefined] as unknown as string[];
    const clean = sanitizeArray(dirty);
    expect(clean).toEqual(['hello', 'world']);
  });

  it('should limit length of each string', () => {
    const dirty = ['a'.repeat(2000), 'short'];
    const clean = sanitizeArray(dirty, 100);
    expect(clean[0].length).toBe(100);
    expect(clean[1]).toBe('short');
  });

  it('should handle empty array', () => {
    expect(sanitizeArray([])).toEqual([]);
  });

  it('should handle non-array input', () => {
    expect(sanitizeArray(null as unknown as string[])).toEqual([]);
  });
});

describe('HTML Entities', () => {
  describe('encodeHtmlEntities', () => {
    it('should encode special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const encoded = encodeHtmlEntities(input);
      expect(encoded).toContain('&lt;');
      expect(encoded).toContain('&gt;');
      expect(encoded).not.toContain('<script>');
    });

    it('should preserve safe text', () => {
      const input = 'Hello "world"';
      const encoded = encodeHtmlEntities(input);
      // textContent não codifica aspas, apenas < > &
      expect(encoded).toBe('Hello "world"');
    });

    it('should handle empty input', () => {
      expect(encodeHtmlEntities('')).toBe('');
    });
  });

  describe('decodeHtmlEntities', () => {
    it('should decode entities', () => {
      const encoded = '&lt;p&gt;Hello&lt;/p&gt;';
      const decoded = decodeHtmlEntities(encoded);
      expect(decoded).toBe('<p>Hello</p>');
    });

    it('should handle text with entities', () => {
      const encoded = 'Hello &lt;world&gt;';
      const decoded = decodeHtmlEntities(encoded);
      expect(decoded).toBe('Hello <world>');
    });

    it('should handle empty input', () => {
      expect(decodeHtmlEntities('')).toBe('');
    });
  });
});

describe('Email Sanitization', () => {
  it('should lowercase and trim email', () => {
    const dirty = '  USER@EXAMPLE.COM  ';
    const clean = sanitizeEmail(dirty);
    expect(clean).toBe('user@example.com');
  });

  it('should remove invalid characters', () => {
    const dirty = 'user<script>@example.com';
    const clean = sanitizeEmail(dirty);
    expect(clean).not.toContain('<');
    expect(clean).not.toContain('>');
  });

  it('should allow valid email characters', () => {
    const email = 'user+tag@example.com';
    const clean = sanitizeEmail(email);
    expect(clean).toBe('user+tag@example.com');
  });

  it('should limit length', () => {
    const long = 'a'.repeat(300) + '@example.com';
    const clean = sanitizeEmail(long);
    expect(clean.length).toBeLessThanOrEqual(254);
  });

  it('should handle empty input', () => {
    expect(sanitizeEmail('')).toBe('');
  });
});

describe('Numeric Sanitization', () => {
  it('should keep only digits', () => {
    const input = '(11) 98765-4321';
    const clean = sanitizeNumeric(input);
    expect(clean).toBe('11987654321');
  });

  it('should remove letters', () => {
    const input = '123abc456';
    const clean = sanitizeNumeric(input);
    expect(clean).toBe('123456');
  });

  it('should remove special characters', () => {
    const input = '12-34.56/78';
    const clean = sanitizeNumeric(input);
    expect(clean).toBe('12345678');
  });

  it('should handle empty input', () => {
    expect(sanitizeNumeric('')).toBe('');
  });

  it('should handle no digits', () => {
    const input = 'abc-def';
    const clean = sanitizeNumeric(input);
    expect(clean).toBe('');
  });
});

describe('HTML Attribute Sanitization', () => {
  it('should remove quotes', () => {
    const dirty = 'value"onclick="alert(1)';
    const clean = sanitizeHtmlAttribute(dirty);
    expect(clean).not.toContain('"');
    expect(clean).not.toContain("'");
  });

  it('should remove dangerous characters', () => {
    const dirty = 'value<script>';
    const clean = sanitizeHtmlAttribute(dirty);
    expect(clean).not.toContain('<');
    expect(clean).not.toContain('>');
  });

  it('should allow safe characters', () => {
    const safe = 'safe-value_123';
    const clean = sanitizeHtmlAttribute(safe);
    expect(clean).toBe(safe);
  });

  it('should trim whitespace', () => {
    const dirty = '  value  ';
    const clean = sanitizeHtmlAttribute(dirty);
    expect(clean).toBe('value');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtmlAttribute('')).toBe('');
  });
});

describe('JSON Sanitization', () => {
  it('should validate and reformat JSON', () => {
    const validJson = '{"name":"João","age":30}';
    const clean = sanitizeJson(validJson);
    expect(clean).toBe('{"name":"João","age":30}');
  });

  it('should reject invalid JSON', () => {
    const invalidJson = '{name: João}'; // Missing quotes
    const clean = sanitizeJson(invalidJson);
    expect(clean).toBeNull();
  });

  it('should handle malformed JSON', () => {
    const malformed = '{"name":"João"'; // Incomplete
    const clean = sanitizeJson(malformed);
    expect(clean).toBeNull();
  });

  it('should handle empty input', () => {
    expect(sanitizeJson('')).toBeNull();
  });

  it('should handle arrays', () => {
    const jsonArray = '[1,2,3]';
    const clean = sanitizeJson(jsonArray);
    expect(clean).toBe('[1,2,3]');
  });
});

describe('CSP Generation', () => {
  it('should generate valid CSP header', () => {
    const csp = generateCSP();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).toContain("style-src");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('should include Firebase and EmailJS domains', () => {
    const csp = generateCSP();
    expect(csp).toContain('firestore.googleapis.com');
    expect(csp).toContain('api.emailjs.com');
  });

  it('should prevent clickjacking', () => {
    const csp = generateCSP();
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('should be a valid CSP format', () => {
    const csp = generateCSP();
    // CSP deve ter diretivas separadas por ';'
    const directives = csp.split(';').map(d => d.trim());
    expect(directives.length).toBeGreaterThan(5);
  });
});
