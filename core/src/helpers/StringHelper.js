/**
 * ═══════════════════════════════════════════════════════════════
 * StringHelper - String Manipulation Utilities
 * ═══════════════════════════════════════════════════════════════
 *
 * @module StringHelper
 */

/**
 * Static utility class providing string manipulation and validation methods.
 * All methods are static — do not instantiate this class.
 *
 * @class StringHelper
 * @description Offers a comprehensive set of static helpers for capitalizing,
 * transforming case, truncating, searching, extracting patterns, validating,
 * padding, masking, and comparing strings.
 *
 * @example
 * const { StringHelper } = require('./helpers/StringHelper');
 *
 * StringHelper.capitalize('hello');              // 'Hello'
 * StringHelper.toCamelCase('my-component-name'); // 'myComponentName'
 * StringHelper.mask('4111111111111111', 4);      // '************1111'
 * StringHelper.isEmail('user@example.com');       // true
 */
class StringHelper {
    /**
     * Capitalizes the first character of a string. Returns an empty string if the input is falsy.
     *
     * @param {string} str - The string to capitalize.
     * @returns {string} The input string with its first character converted to uppercase.
     *
     * @example
     * StringHelper.capitalize('hello');   // 'Hello'
     * StringHelper.capitalize('world');   // 'World'
     * StringHelper.capitalize('');        // ''
     * StringHelper.capitalize(null);      // ''
     */
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Capitalizes the first character of every word in a string.
     * A word boundary is determined by the `\b` regex assertion.
     *
     * @param {string} str - The string whose words should be capitalized.
     * @returns {string} The input string with the first letter of each word in uppercase.
     *
     * @example
     * StringHelper.capitalizeWords('hello world');       // 'Hello World'
     * StringHelper.capitalizeWords('test automation');   // 'Test Automation'
     * StringHelper.capitalizeWords('john doe-smith');    // 'John Doe-Smith'
     */
    static capitalizeWords(str) {
        return str.replace(/\b\w/g, (l) => l.toUpperCase());
    }

    /**
     * Converts a string to camelCase by removing hyphens, underscores, and spaces,
     * then upper-casing the character immediately following each separator.
     *
     * @param {string} str - The string to convert (may contain hyphens, underscores, or spaces).
     * @returns {string} The camelCase version of the input string.
     *
     * @example
     * StringHelper.toCamelCase('hello-world');       // 'helloWorld'
     * StringHelper.toCamelCase('my_component_name'); // 'myComponentName'
     * StringHelper.toCamelCase('Some Text Here');    // 'someTextHere'
     */
    static toCamelCase(str) {
        const camel = str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
        return camel.charAt(0).toLowerCase() + camel.slice(1);
    }

    /**
     * Converts a string to kebab-case (lowercase words separated by hyphens).
     * Handles camelCase boundaries, spaces, and underscores.
     *
     * @param {string} str - The string to convert.
     * @returns {string} The kebab-case version of the input string.
     *
     * @example
     * StringHelper.toKebabCase('helloWorld');        // 'hello-world'
     * StringHelper.toKebabCase('MyComponentName');   // 'my-component-name'
     * StringHelper.toKebabCase('some_text here');    // 'some-text-here'
     */
    static toKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
    }

    /**
     * Converts a string to snake_case (lowercase words separated by underscores).
     * Handles camelCase boundaries, spaces, and hyphens.
     *
     * @param {string} str - The string to convert.
     * @returns {string} The snake_case version of the input string.
     *
     * @example
     * StringHelper.toSnakeCase('helloWorld');        // 'hello_world'
     * StringHelper.toSnakeCase('MyComponentName');   // 'my_component_name'
     * StringHelper.toSnakeCase('some-text here');    // 'some_text_here'
     */
    static toSnakeCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase();
    }

    /**
     * Truncates a string to the specified maximum length, appending a suffix if truncation occurs.
     * The total length of the returned string (including the suffix) will not exceed `maxLength`.
     * If the string is already within the limit, it is returned unchanged.
     *
     * @param {string} str - The string to truncate.
     * @param {number} maxLength - The maximum allowed length of the returned string (including suffix).
     * @param {string} [suffix='...'] - The suffix to append when the string is truncated.
     * @returns {string} The original string if within limits, or the truncated string with suffix.
     *
     * @example
     * StringHelper.truncate('Hello World', 8);          // 'Hello...'
     * StringHelper.truncate('Hello World', 50);         // 'Hello World'
     * StringHelper.truncate('Long text here', 10, '…'); // 'Long text…'
     */
    static truncate(str, maxLength, suffix = '...') {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    }

    /**
     * Removes all whitespace characters (spaces, tabs, newlines) from a string.
     *
     * @param {string} str - The string from which to remove whitespace.
     * @returns {string} The input string with all whitespace removed.
     *
     * @example
     * StringHelper.removeWhitespace('hello world');   // 'helloworld'
     * StringHelper.removeWhitespace(' a  b  c ');     // 'abc'
     * StringHelper.removeWhitespace('no\tspaces\n');  // 'nospaces'
     */
    static removeWhitespace(str) {
        return str.replace(/\s+/g, '');
    }

    /**
     * Collapses all consecutive whitespace characters into a single space and trims
     * leading and trailing whitespace.
     *
     * @param {string} str - The string to normalize.
     * @returns {string} The string with normalized whitespace.
     *
     * @example
     * StringHelper.normalizeWhitespace('  hello   world  '); // 'hello world'
     * StringHelper.normalizeWhitespace('a\n\tb');            // 'a b'
     * StringHelper.normalizeWhitespace('   spaced   out  '); // 'spaced out'
     */
    static normalizeWhitespace(str) {
        return str.replace(/\s+/g, ' ').trim();
    }

    /**
     * Checks whether a string contains a given substring. Optionally performs
     * a case-insensitive comparison.
     *
     * @param {string} str - The string to search within.
     * @param {string} substring - The substring to search for.
     * @param {boolean} [caseInsensitive=false] - When `true`, performs a case-insensitive match.
     * @returns {boolean} `true` if the substring is found, `false` otherwise.
     *
     * @example
     * StringHelper.contains('Hello World', 'World');          // true
     * StringHelper.contains('Hello World', 'world');          // false
     * StringHelper.contains('Hello World', 'world', true);   // true
     */
    static contains(str, substring, caseInsensitive = false) {
        if (caseInsensitive) {
            return str.toLowerCase().includes(substring.toLowerCase());
        }
        return str.includes(substring);
    }

    /**
     * Extracts all numeric values (integers and decimals) from a string and returns
     * them as an array of numbers.
     *
     * @param {string} str - The string to extract numbers from.
     * @returns {Array.<number>} An array of extracted numbers. Returns an empty array if none are found.
     *
     * @example
     * StringHelper.extractNumbers('Price: $19.99 and $5.50'); // [19.99, 5.50]
     * StringHelper.extractNumbers('Order #12345');            // [12345]
     * StringHelper.extractNumbers('no numbers here');         // []
     */
    static extractNumbers(str) {
        const matches = str.match(/\d+(\.\d+)?/g);
        return matches ? matches.map(Number) : [];
    }

    /**
     * Extracts all email addresses from a string using a regular expression pattern.
     *
     * @param {string} str - The string to extract email addresses from.
     * @returns {Array.<string>} An array of extracted email address strings. Returns an empty array if none are found.
     *
     * @example
     * StringHelper.extractEmails('Contact john@example.com or jane@test.org');
     * // ['john@example.com', 'jane@test.org']
     *
     * StringHelper.extractEmails('No emails here'); // []
     */
    static extractEmails(str) {
        const matches = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        return matches || [];
    }

    /**
     * Extracts all HTTP and HTTPS URLs from a string.
     *
     * @param {string} str - The string to extract URLs from.
     * @returns {Array.<string>} An array of extracted URL strings. Returns an empty array if none are found.
     *
     * @example
     * StringHelper.extractUrls('Visit https://example.com or http://test.org/page');
     * // ['https://example.com', 'http://test.org/page']
     *
     * StringHelper.extractUrls('No links here'); // []
     */
    static extractUrls(str) {
        const matches = str.match(/https?:\/\/[^\s]+/g);
        return matches || [];
    }

    /**
     * Validates whether a string is a plausible email address using a simple regex check.
     * This is a basic structural validation, not a full RFC 5322 compliance check.
     *
     * @param {string} str - The string to validate.
     * @returns {boolean} `true` if the string matches a basic email pattern, `false` otherwise.
     *
     * @example
     * StringHelper.isEmail('user@example.com');  // true
     * StringHelper.isEmail('invalid@');           // false
     * StringHelper.isEmail('not-an-email');       // false
     */
    static isEmail(str) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    /**
     * Validates whether a string is a well-formed URL by attempting to construct a URL object.
     *
     * @param {string} str - The string to validate.
     * @returns {boolean} `true` if the string can be parsed as a valid URL, `false` otherwise.
     *
     * @example
     * StringHelper.isUrl('https://example.com');   // true
     * StringHelper.isUrl('ftp://files.server.net');// true
     * StringHelper.isUrl('not a url');             // false
     */
    static isUrl(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Checks whether a string represents a finite numeric value.
     * Returns `true` for integer and decimal strings, `false` for non-numeric strings,
     * `NaN`, and `Infinity`.
     *
     * @param {string} str - The string to check.
     * @returns {boolean} `true` if the string represents a finite number, `false` otherwise.
     *
     * @example
     * StringHelper.isNumeric('42');      // true
     * StringHelper.isNumeric('3.14');    // true
     * StringHelper.isNumeric('abc');     // false
     * StringHelper.isNumeric('Infinity');// false
     */
    static isNumeric(str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    }

    /**
     * Pads a string on the left (start) to reach the specified total length using the given character.
     * The input is coerced to a string before padding.
     *
     * @param {string|number} str - The value to pad.
     * @param {number} length - The desired total length of the resulting string.
     * @param {string} [char='0'] - The character to use for padding.
     * @returns {string} The left-padded string.
     *
     * @example
     * StringHelper.padLeft('42', 5);        // '00042'
     * StringHelper.padLeft(7, 3);           // '007'
     * StringHelper.padLeft('hi', 6, ' ');   // '    hi'
     */
    static padLeft(str, length, char = '0') {
        return String(str).padStart(length, char);
    }

    /**
     * Pads a string on the right (end) to reach the specified total length using the given character.
     * The input is coerced to a string before padding.
     *
     * @param {string|number} str - The value to pad.
     * @param {number} length - The desired total length of the resulting string.
     * @param {string} [char='0'] - The character to use for padding.
     * @returns {string} The right-padded string.
     *
     * @example
     * StringHelper.padRight('42', 5);        // '42000'
     * StringHelper.padRight('hi', 6, '.');   // 'hi....'
     * StringHelper.padRight(7, 4);           // '7000'
     */
    static padRight(str, length, char = '0') {
        return String(str).padEnd(length, char);
    }

    /**
     * Generates a random string of the specified length from the given character set.
     * Uses `Math.random()` — not suitable for cryptographic purposes.
     *
     * @param {number} [length=10] - The desired length of the random string.
     * @param {string} [charset='abcdefghijklmnopqrstuvwxyz0123456789'] - The set of characters to pick from.
     * @returns {string} A randomly generated string.
     *
     * @example
     * StringHelper.generateRandom();             // 'a8k3m2x9q1' (10 chars, alphanumeric)
     * StringHelper.generateRandom(5);            // 'x9k2m' (5 chars)
     * StringHelper.generateRandom(8, 'ABC123');  // 'A1B3C2A1' (8 chars from custom charset)
     */
    static generateRandom(length = 10, charset = 'abcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    /**
     * Masks a string by replacing all characters except the last `visibleChars` with `maskChar`.
     * Useful for obfuscating sensitive information such as credit card numbers, SSNs, or tokens.
     * If the string length is less than or equal to `visibleChars`, it is returned unchanged.
     *
     * @param {string} str - The string to mask.
     * @param {number} [visibleChars=4] - The number of characters to leave visible at the end.
     * @param {string} [maskChar='*'] - The character used to replace hidden characters.
     * @returns {string} The masked string with only the last `visibleChars` characters visible.
     *
     * @example
     * StringHelper.mask('4111111111111111');        // '************1111'
     * StringHelper.mask('555-12-6789', 4);          // '*******6789'
     * StringHelper.mask('secret-token', 3, '#');    // '#########ken'
     * StringHelper.mask('hi', 4);                   // 'hi' (too short to mask)
     */
    static mask(str, visibleChars = 4, maskChar = '*') {
        if (str.length <= visibleChars) return str;
        return maskChar.repeat(str.length - visibleChars) + str.slice(-visibleChars);
    }

    /**
     * Compares two strings for equality, ignoring differences in case and extra whitespace.
     * Both strings are normalized (collapsed whitespace, trimmed) and lowercased before comparison.
     *
     * @param {string} a - The first string to compare.
     * @param {string} b - The second string to compare.
     * @returns {boolean} `true` if the strings are loosely equal, `false` otherwise.
     *
     * @example
     * StringHelper.looseEquals('Hello World', 'hello world');     // true
     * StringHelper.looseEquals('  foo  bar ', 'foo bar');         // true
     * StringHelper.looseEquals('Hello', 'World');                 // false
     */
    static looseEquals(a, b) {
        return this.normalizeWhitespace(a).toLowerCase() === this.normalizeWhitespace(b).toLowerCase();
    }
}

module.exports = { StringHelper };
