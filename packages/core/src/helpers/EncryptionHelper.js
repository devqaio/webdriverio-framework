/**
 * ═══════════════════════════════════════════════════════════════
 * EncryptionHelper - Credential & Sensitive Data Management
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides AES-256-GCM authenticated encryption / decryption for
 * passwords, tokens, and other sensitive values used in test data.
 *
 * Ciphertext format: "salt:iv:authTag:encrypted" (all hex-encoded)
 *
 * **Breaking change from v1:** Previous AES-256-CBC ciphertexts
 * ("iv:encrypted") are auto-detected and decrypted via the legacy
 * path, but new encryptions always use AES-256-GCM with PBKDF2.
 */

const crypto = require('crypto');
const { Logger } = require('../utils/Logger');

const logger = Logger.getInstance('EncryptionHelper');

const ALGORITHM = 'aes-256-gcm';
const LEGACY_ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 12;          // GCM recommended IV size
const LEGACY_IV_LENGTH = 16;   // CBC IV size
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;

class EncryptionHelper {
    /**
     * Derive a 32-byte key from a passphrase using PBKDF2.
     * @param {string} passphrase
     * @param {Buffer} salt
     * @returns {Buffer}
     */
    static _deriveKey(passphrase, salt) {
        return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, 32, 'sha256');
    }

    /**
     * Legacy key derivation (single SHA-256 hash, no salt).
     * Used only for decrypting old ciphertexts.
     * @private
     */
    static _deriveLegacyKey(passphrase) {
        return crypto.createHash('sha256').update(passphrase).digest();
    }

    /**
     * Encrypt plain-text using AES-256-GCM with PBKDF2 key derivation.
     *
     * @param {string} plainText
     * @param {string} [passphrase]  Defaults to ENCRYPTION_KEY env var
     * @returns {string}  Format: "salt:iv:authTag:encrypted" (hex-encoded)
     */
    static encrypt(plainText, passphrase) {
        const resolvedPass = this._resolvePassphrase(passphrase);
        const salt = crypto.randomBytes(SALT_LENGTH);
        const key = this._deriveKey(resolvedPass, salt);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * Decrypt cipher-text. Auto-detects legacy (CBC) vs modern (GCM) format.
     *
     * @param {string} cipherText
     * @param {string} [passphrase]  Defaults to ENCRYPTION_KEY env var
     * @returns {string}
     */
    static decrypt(cipherText, passphrase) {
        if (!cipherText || !cipherText.includes(':')) {
            throw new Error('Invalid cipherText format. Expected "salt:iv:authTag:encrypted" (hex-encoded).');
        }
        const resolvedPass = this._resolvePassphrase(passphrase);
        const parts = cipherText.split(':');

        // Legacy format: "iv:encrypted" (2 parts, CBC)
        if (parts.length === 2) {
            logger.warn('Decrypting legacy AES-256-CBC ciphertext — re-encrypt with encrypt() to upgrade to GCM');
            return this._decryptLegacy(cipherText, resolvedPass);
        }

        // Modern format: "salt:iv:authTag:encrypted" (4 parts, GCM)
        if (parts.length !== 4) {
            throw new Error('Invalid cipherText format. Expected "salt:iv:authTag:encrypted" (hex-encoded).');
        }

        const [saltHex, ivHex, authTagHex, encrypted] = parts;
        const salt = Buffer.from(saltHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = this._deriveKey(resolvedPass, salt);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * Decrypt legacy AES-256-CBC ciphertext (iv:encrypted).
     * @private
     */
    static _decryptLegacy(cipherText, passphrase) {
        const colonIdx = cipherText.indexOf(':');
        const ivHex = cipherText.substring(0, colonIdx);
        const encrypted = cipherText.substring(colonIdx + 1);
        const iv = Buffer.from(ivHex, 'hex');
        const key = this._deriveLegacyKey(passphrase);
        const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * Resolve the encryption passphrase.
     * @private
     */
    static _resolvePassphrase(passphrase) {
        const resolved = passphrase || process.env.ENCRYPTION_KEY;
        if (!resolved) {
            throw new Error(
                'ENCRYPTION_KEY is not set. Provide a passphrase argument or set the ENCRYPTION_KEY environment variable.',
            );
        }
        return resolved;
    }

    /**
     * Generate a random secure passphrase.
     */
    static generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hash a value (one-way) using SHA-256.
     */
    static hash(value) {
        return crypto.createHash('sha256').update(value).digest('hex');
    }

    /**
     * Generate a cryptographically strong random string.
     */
    static generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }

    /**
     * Base64 encode a value.
     */
    static base64Encode(value) {
        return Buffer.from(value).toString('base64');
    }

    /**
     * Base64 decode a value.
     */
    static base64Decode(value) {
        return Buffer.from(value, 'base64').toString('utf-8');
    }
}

module.exports = { EncryptionHelper };
