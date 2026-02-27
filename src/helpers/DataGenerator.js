/**
 * ═══════════════════════════════════════════════════════════════
 * DataGenerator - Dynamic Test Data Factory
 * ═══════════════════════════════════════════════════════════════
 *
 * Wraps @faker-js/faker to generate realistic, randomised test
 * data on demand.  Keeps test suites deterministic when a seed
 * is provided, yet flexible enough for data-driven testing.
 */

const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

class DataGenerator {
    /**
     * Set a fixed seed for reproducible random data.
     */
    static seed(value) {
        faker.seed(value);
    }

    // ─── User Data ────────────────────────────────────────────

    static generateUser(overrides = {}) {
        return {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            username: faker.internet.username(),
            password: this.generatePassword(),
            phone: faker.phone.number(),
            dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
            avatar: faker.image.avatar(),
            ...overrides,
        };
    }

    static generateUsers(count, overrides = {}) {
        return Array.from({ length: count }, () => this.generateUser(overrides));
    }

    // ─── Address Data ─────────────────────────────────────────

    static generateAddress(overrides = {}) {
        return {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
            ...overrides,
        };
    }

    // ─── Company / Business ───────────────────────────────────

    static generateCompany(overrides = {}) {
        return {
            name: faker.company.name(),
            catchPhrase: faker.company.catchPhrase(),
            industry: faker.commerce.department(),
            website: faker.internet.url(),
            ...overrides,
        };
    }

    // ─── Payment / Card ───────────────────────────────────────

    static generateCreditCard(overrides = {}) {
        return {
            number: faker.finance.creditCardNumber(),
            cvv: faker.finance.creditCardCVV(),
            issuer: faker.finance.creditCardIssuer(),
            expiryMonth: faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0'),
            expiryYear: faker.number.int({ min: 2026, max: 2032 }).toString(),
            ...overrides,
        };
    }

    // ─── Product / E-commerce ─────────────────────────────────

    static generateProduct(overrides = {}) {
        return {
            id: uuidv4(),
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: parseFloat(faker.commerce.price()),
            category: faker.commerce.department(),
            material: faker.commerce.productMaterial(),
            adjective: faker.commerce.productAdjective(),
            ...overrides,
        };
    }

    // ─── Primitives ───────────────────────────────────────────

    static generateEmail(provider) {
        return faker.internet.email({ provider });
    }

    static generatePassword(length = 16) {
        return faker.internet.password({ length, memorable: false, prefix: 'Aa1!' });
    }

    static generateUUID() {
        return uuidv4();
    }

    static generatePhone() {
        return faker.phone.number();
    }

    static generateNumber(min = 1, max = 10000) {
        return faker.number.int({ min, max });
    }

    static generateFloat(min = 0, max = 1000, precision = 0.01) {
        return faker.number.float({ min, max, multipleOf: precision });
    }

    static generateBoolean() {
        return faker.datatype.boolean();
    }

    static generateParagraph(sentences = 3) {
        return faker.lorem.paragraph(sentences);
    }

    static generateSentence(wordCount = 8) {
        return faker.lorem.sentence(wordCount);
    }

    static generateWord() {
        return faker.lorem.word();
    }

    static generateWords(count = 3) {
        return faker.lorem.words(count);
    }

    static generateUrl() {
        return faker.internet.url();
    }

    static generateIp() {
        return faker.internet.ip();
    }

    static generateColor() {
        return faker.color.rgb();
    }

    // ─── Date Helpers ─────────────────────────────────────────

    static generatePastDate(years = 1) {
        return faker.date.past({ years });
    }

    static generateFutureDate(years = 1) {
        return faker.date.future({ years });
    }

    static generateDateBetween(from, to) {
        return faker.date.between({ from, to });
    }

    static generateRecentDate(days = 7) {
        return faker.date.recent({ days });
    }

    // ─── Array Helpers ────────────────────────────────────────

    /**
     * Pick a random item from an array.
     */
    static pickRandom(array) {
        return faker.helpers.arrayElement(array);
    }

    /**
     * Pick N random items from an array.
     */
    static pickMultipleRandom(array, count) {
        return faker.helpers.arrayElements(array, count);
    }

    /**
     * Shuffle an array.
     */
    static shuffle(array) {
        return faker.helpers.shuffle(array);
    }

    // ─── Template ─────────────────────────────────────────────

    /**
     * Generate a string from a template, e.g. '###-???-***'
     * where # = digit, ? = letter, * = alphanumeric.
     */
    static fromTemplate(template) {
        return faker.helpers.replaceSymbols(template);
    }

    /**
     * Generate a timestamped unique identifier useful for test identifiers.
     */
    static generateTestId(prefix = 'TEST') {
        const timestamp = Date.now();
        const random = faker.string.alphanumeric(6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }
}

module.exports = { DataGenerator };
