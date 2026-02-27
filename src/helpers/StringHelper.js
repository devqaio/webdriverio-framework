/**
 * ═══════════════════════════════════════════════════════════════
 * StringHelper - String Manipulation Utilities
 * ═══════════════════════════════════════════════════════════════
 */

class StringHelper {
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static capitalizeWords(str) {
        return str.replace(/\b\w/g, (l) => l.toUpperCase());
    }

    static toCamelCase(str) {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
    }

    static toKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
    }

    static toSnakeCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase();
    }

    static truncate(str, maxLength, suffix = '...') {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    }

    static removeWhitespace(str) {
        return str.replace(/\s+/g, '');
    }

    static normalizeWhitespace(str) {
        return str.replace(/\s+/g, ' ').trim();
    }

    static contains(str, substring, caseInsensitive = false) {
        if (caseInsensitive) {
            return str.toLowerCase().includes(substring.toLowerCase());
        }
        return str.includes(substring);
    }

    static extractNumbers(str) {
        const matches = str.match(/\d+(\.\d+)?/g);
        return matches ? matches.map(Number) : [];
    }

    static extractEmails(str) {
        const matches = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        return matches || [];
    }

    static extractUrls(str) {
        const matches = str.match(/https?:\/\/[^\s]+/g);
        return matches || [];
    }

    static isEmail(str) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    static isUrl(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }

    static isNumeric(str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    }

    static padLeft(str, length, char = '0') {
        return String(str).padStart(length, char);
    }

    static padRight(str, length, char = '0') {
        return String(str).padEnd(length, char);
    }

    static generateRandom(length = 10, charset = 'abcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    static mask(str, visibleChars = 4, maskChar = '*') {
        if (str.length <= visibleChars) return str;
        return maskChar.repeat(str.length - visibleChars) + str.slice(-visibleChars);
    }

    /**
     * Compare two strings ignoring case and extra whitespace.
     */
    static looseEquals(a, b) {
        return this.normalizeWhitespace(a).toLowerCase() === this.normalizeWhitespace(b).toLowerCase();
    }
}

module.exports = { StringHelper };
