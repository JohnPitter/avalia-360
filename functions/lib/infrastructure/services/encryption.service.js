"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.hash = hash;
exports.hashEmail = hashEmail;
exports.hashAccessCode = hashAccessCode;
exports.compareHashes = compareHashes;
const CryptoJS = __importStar(require("crypto-js"));
/**
 * Obtém chave de criptografia do environment
 * - Desenvolvimento: .env file
 * - Produção: GitHub Secret → Firebase Functions environment
 */
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY não configurada! Configure via .env (local) ou GitHub Secret (prod)');
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
function encrypt(plaintext) {
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
function decrypt(ciphertext) {
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
    }
    catch (error) {
        console.error('Erro ao descriptografar dados:', error);
        throw new Error('Falha na descriptografia');
    }
}
/**
 * Gera hash SHA-256 de um valor
 * @param value - Valor para fazer hash
 * @returns Hash SHA-256
 */
function hash(value) {
    return CryptoJS.SHA256(value).toString();
}
/**
 * Gera hash SHA-256 do email (para armazenamento)
 * @param email - Email para fazer hash
 * @returns Hash SHA-256 do email em lowercase
 */
function hashEmail(email) {
    return hash(email.toLowerCase().trim());
}
/**
 * Gera hash do código de acesso (para armazenamento)
 * @param code - Código de 6 dígitos
 * @returns Hash SHA-256 do código
 */
function hashAccessCode(code) {
    return hash(code);
}
/**
 * Compara dois hashes de forma timing-safe
 * Previne timing attacks
 * @param a - Hash A
 * @param b - Hash B
 * @returns true se iguais
 */
function compareHashes(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
//# sourceMappingURL=encryption.service.js.map