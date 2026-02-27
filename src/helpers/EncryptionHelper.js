/**
 * ═══════════════════════════════════════════════════════════════
 * EncryptionHelper - Credential & Sensitive Data Management
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides AES-256-CBC encryption / decryption for passwords,
 * tokens, and other sensitive values used in test data.
 */

const crypto = require('crypto');
const { Logger } = require('../utils/Logger');

const logger = Logger.getInstance('EncryptionHelper');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

class EncryptionHelper {
    /**
     * Derive a 32-byte key from a passphrase.
     */
    static _deriveKey(passphrase) {
        return crypto.createHash('sha256').update(passphrase).digest();
    }

    /**
     * Encrypt plain-text using a passphrase.
     * @param {string} plainText
     * @param {string} [passphrase]  Defaults to ENCRYPTION_KEY env var (required)
     */
    static encrypt(plainText, passphrase) {
        const key = this._deriveKey(this._resolvePassphrase(passphrase));
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypt cipher-text using a passphrase.
     * @param {string} cipherText
     * @param {string} [passphrase]  Defaults to ENCRYPTION_KEY env var (required)
     */
    static decrypt(cipherText, passphrase) {
        if (!cipherText || !cipherText.includes(':')) {
            throw new Error('Invalid cipherText format. Expected "iv:encrypted" (hex-encoded).');
        }
        const key = this._deriveKey(this._resolvePassphrase(passphrase));
        const colonIdx = cipherText.indexOf(':');
        const ivHex = cipherText.substring(0, colonIdx);
        const encrypted = cipherText.substring(colonIdx + 1);
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
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
