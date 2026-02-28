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

/**
 * Static utility class that wraps {@link https://fakerjs.dev/ @faker-js/faker} to generate
 * realistic, randomised test data for WebdriverIO test suites.
 *
 * All methods are static — no instantiation is required. When a fixed seed is set via
 * {@link DataGenerator.seed}, every subsequent call produces deterministic output, making
 * test runs reproducible across environments.
 *
 * @class DataGenerator
 * @description Provides factory methods for generating users, addresses, companies,
 * credit cards, products, primitive values (strings, numbers, booleans, dates), and
 * helper utilities for arrays and templates. Every complex-object method accepts an
 * optional `overrides` parameter that is spread into the returned object, letting
 * callers pin specific fields while keeping the rest random.
 *
 * @example <caption>Basic usage — generate a user and an address</caption>
 * const { DataGenerator } = require('@core/helpers/DataGenerator');
 *
 * // Deterministic run
 * DataGenerator.seed(12345);
 *
 * const user = DataGenerator.generateUser();
 * console.log(user.firstName); // e.g. "Johanna"
 *
 * const address = DataGenerator.generateAddress({ country: 'US' });
 * console.log(address.city); // e.g. "North Kayleefort"
 *
 * @example <caption>Generating bulk data for data-driven tests</caption>
 * const users = DataGenerator.generateUsers(5, { password: 'Test@1234' });
 * users.forEach(u => console.log(u.email));
 */
class DataGenerator {
    /**
     * Set a fixed seed so that all subsequent faker calls produce the same sequence of
     * pseudo-random values. This is essential for deterministic / reproducible test runs.
     * Wraps {@link https://fakerjs.dev/api/faker.html#seed faker.seed()}.
     *
     * @param {number} value - An integer seed value. Use the same seed across runs to
     *   get identical generated data.
     * @returns {void}
     *
     * @example
     * // Pin a seed at the start of your suite
     * DataGenerator.seed(42);
     * const a = DataGenerator.generateNumber();
     *
     * DataGenerator.seed(42);
     * const b = DataGenerator.generateNumber();
     * console.log(a === b); // true
     */
    static seed(value) {
        faker.seed(value);
    }

    /**
     * Set the locale used by faker for all subsequently generated data (e.g. names,
     * addresses, phone formats). Wraps the `faker.locale` setter.
     *
     * Requires the corresponding `@faker-js/faker` locale bundle to be installed
     * or available. If the locale is not recognised, an `Error` is thrown with a
     * link to the faker localisation guide.
     *
     * @param {string} locale - A faker locale identifier such as `'de'`, `'fr'`,
     *   `'ja'`, `'en_US'`, or `'pt_BR'`.
     * @returns {void}
     * @throws {Error} If the locale cannot be set (e.g. unsupported or not installed).
     *
     * @example
     * // Generate German names and addresses
     * DataGenerator.setLocale('de');
     * const user = DataGenerator.generateUser();
     * console.log(user.firstName); // e.g. "Günter"
     *
     * @example
     * // Reset back to English
     * DataGenerator.setLocale('en');
     */
    static setLocale(locale) {
        try {
            faker.locale = locale;
        } catch {
            throw new Error(
                `Failed to set faker locale "${locale}". Valid locales: https://fakerjs.dev/guide/localization.html`,
            );
        }
    }

    // ─── User Data ────────────────────────────────────────────

    /**
     * Generate a realistic user profile object with common identity and contact fields.
     * Uses `faker.person`, `faker.internet`, `faker.phone`, `faker.date`, and
     * `faker.image` modules under the hood.
     *
     * Any key in `overrides` is spread **after** the generated fields, so callers can
     * pin specific values (e.g. a known email) while keeping everything else random.
     *
     * @param {Object} [overrides={}] - Key/value pairs to merge into (and override)
     *   the generated user object. Keys that do not exist in the base shape are also
     *   included, allowing arbitrary extension.
     * @returns {{ firstName: string, lastName: string, email: string, username: string,
     *   password: string, phone: string, dateOfBirth: Date, avatar: string }}
     *   A user object with the following properties:
     *   - **firstName** (`string`) — Random first name via `faker.person.firstName()`.
     *   - **lastName** (`string`) — Random last name via `faker.person.lastName()`.
     *   - **email** (`string`) — Random email via `faker.internet.email()`.
     *   - **username** (`string`) — Random username via `faker.internet.username()`.
     *   - **password** (`string`) — Strong random password (see {@link DataGenerator.generatePassword}).
     *   - **phone** (`string`) — Random phone number via `faker.phone.number()`.
     *   - **dateOfBirth** (`Date`) — Birthdate for ages 18–65 via `faker.date.birthdate()`.
     *   - **avatar** (`string`) — URL to a random avatar image via `faker.image.avatar()`.
     *   - Plus any additional keys from `overrides`.
     *
     * @example
     * const user = DataGenerator.generateUser();
     * console.log(user);
     * // {
     * //   firstName: 'Johanna',
     * //   lastName: 'Hettinger',
     * //   email: 'Johanna_Hettinger34@gmail.com',
     * //   username: 'johanna.hettinger',
     * //   password: 'Aa1!kL9mQpR2xZ4v',
     * //   phone: '555-234-8901',
     * //   dateOfBirth: 1988-06-14T...,
     * //   avatar: 'https://avatars.githubusercontent.com/u/...'
     * // }
     *
     * @example <caption>Override specific fields</caption>
     * const admin = DataGenerator.generateUser({
     *   email: 'admin@company.com',
     *   role: 'ADMIN',
     * });
     * console.log(admin.email); // 'admin@company.com'
     * console.log(admin.role);  // 'ADMIN'
     */
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

    /**
     * Generate an array of user profile objects. Each user is independently random
     * (or deterministic when a seed has been set). Delegates to
     * {@link DataGenerator.generateUser} for each element.
     *
     * @param {number} count - The number of user objects to generate. Must be a
     *   positive integer.
     * @param {Object} [overrides={}] - Key/value pairs applied to **every** generated
     *   user via {@link DataGenerator.generateUser}.
     * @returns {Array<{ firstName: string, lastName: string, email: string,
     *   username: string, password: string, phone: string, dateOfBirth: Date,
     *   avatar: string }>} An array of `count` user objects. See
     *   {@link DataGenerator.generateUser} for the shape of each element.
     *
     * @example
     * const users = DataGenerator.generateUsers(3);
     * console.log(users.length); // 3
     * console.log(users[0].firstName); // e.g. "Daniella"
     *
     * @example <caption>All users share the same password</caption>
     * const testUsers = DataGenerator.generateUsers(10, { password: 'Welcome1!' });
     * testUsers.forEach(u => console.log(u.password)); // 'Welcome1!' for all
     */
    static generateUsers(count, overrides = {}) {
        return Array.from({ length: count }, () => this.generateUser(overrides));
    }

    // ─── Address Data ─────────────────────────────────────────

    /**
     * Generate a realistic postal address object. Uses the `faker.location` module
     * for street, city, state, zip, country, and geographic coordinates.
     *
     * @param {Object} [overrides={}] - Key/value pairs to merge into (and override)
     *   the generated address. Useful for pinning a known country or zip code.
     * @returns {{ street: string, city: string, state: string, zipCode: string,
     *   country: string, latitude: number, longitude: number }}
     *   An address object with the following properties:
     *   - **street** (`string`) — Full street address via `faker.location.streetAddress()`.
     *   - **city** (`string`) — City name via `faker.location.city()`.
     *   - **state** (`string`) — State or province via `faker.location.state()`.
     *   - **zipCode** (`string`) — Postal / ZIP code via `faker.location.zipCode()`.
     *   - **country** (`string`) — Country name via `faker.location.country()`.
     *   - **latitude** (`number`) — Geographic latitude via `faker.location.latitude()`.
     *   - **longitude** (`number`) — Geographic longitude via `faker.location.longitude()`.
     *   - Plus any additional keys from `overrides`.
     *
     * @example
     * const addr = DataGenerator.generateAddress();
     * console.log(addr);
     * // {
     * //   street: '742 Evergreen Terrace',
     * //   city: 'Lake Christophermouth',
     * //   state: 'Oregon',
     * //   zipCode: '97401',
     * //   country: 'United States of America',
     * //   latitude: 45.5231,
     * //   longitude: -122.6765
     * // }
     *
     * @example <caption>Pin the country for locale-specific tests</caption>
     * const ukAddr = DataGenerator.generateAddress({ country: 'United Kingdom' });
     * console.log(ukAddr.country); // 'United Kingdom'
     */
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

    /**
     * Generate a fictional company/business profile. Uses `faker.company`,
     * `faker.commerce`, and `faker.internet` modules.
     *
     * @param {Object} [overrides={}] - Key/value pairs to merge into (and override)
     *   the generated company object.
     * @returns {{ name: string, catchPhrase: string, industry: string, website: string }}
     *   A company object with the following properties:
     *   - **name** (`string`) — Company name via `faker.company.name()`.
     *   - **catchPhrase** (`string`) — Marketing catch phrase via `faker.company.catchPhrase()`.
     *   - **industry** (`string`) — Industry / commerce department via `faker.commerce.department()`.
     *   - **website** (`string`) — Company website URL via `faker.internet.url()`.
     *   - Plus any additional keys from `overrides`.
     *
     * @example
     * const company = DataGenerator.generateCompany();
     * console.log(company);
     * // {
     * //   name: 'Kreiger - Cassin',
     * //   catchPhrase: 'Innovative next-generation paradigm',
     * //   industry: 'Electronics',
     * //   website: 'https://loopy-satellite.info'
     * // }
     *
     * @example <caption>Override the name for a known test partner</caption>
     * const partner = DataGenerator.generateCompany({ name: 'Acme Corp' });
     * console.log(partner.name); // 'Acme Corp'
     */
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

    /**
     * Generate a fake credit/debit card object suitable for payment-form testing.
     * Uses `faker.finance` for card details and `faker.number` for expiry fields.
     *
     * **Note:** The generated card numbers are syntactically valid (pass Luhn check)
     * but are not real — they are safe to use in test environments.
     *
     * @param {Object} [overrides={}] - Key/value pairs to merge into (and override)
     *   the generated credit card object.
     * @returns {{ number: string, cvv: string, issuer: string, expiryMonth: string,
     *   expiryYear: string }}
     *   A credit card object with the following properties:
     *   - **number** (`string`) — Card number via `faker.finance.creditCardNumber()`.
     *   - **cvv** (`string`) — 3-digit CVV via `faker.finance.creditCardCVV()`.
     *   - **issuer** (`string`) — Card network/issuer (e.g. "Visa", "Mastercard") via `faker.finance.creditCardIssuer()`.
     *   - **expiryMonth** (`string`) — Two-digit month (`"01"`–`"12"`).
     *   - **expiryYear** (`string`) — Four-digit year between `"2026"` and `"2032"`.
     *   - Plus any additional keys from `overrides`.
     *
     * @example
     * const card = DataGenerator.generateCreditCard();
     * console.log(card);
     * // {
     * //   number: '4532-7233-6281-0495',
     * //   cvv: '847',
     * //   issuer: 'Visa',
     * //   expiryMonth: '03',
     * //   expiryYear: '2029'
     * // }
     *
     * @example <caption>Force a specific issuer for targeted tests</caption>
     * const mc = DataGenerator.generateCreditCard({ issuer: 'Mastercard' });
     * console.log(mc.issuer); // 'Mastercard'
     */
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

    /**
     * Generate a fake e-commerce product object with a unique UUID, name, description,
     * price, and category. Uses `uuid.v4` for the ID and `faker.commerce` for the
     * remaining fields.
     *
     * @param {Object} [overrides={}] - Key/value pairs to merge into (and override)
     *   the generated product object.
     * @returns {{ id: string, name: string, description: string, price: number,
     *   category: string, material: string, adjective: string }}
     *   A product object with the following properties:
     *   - **id** (`string`) — UUID v4 identifier.
     *   - **name** (`string`) — Product name via `faker.commerce.productName()`.
     *   - **description** (`string`) — Product description via `faker.commerce.productDescription()`.
     *   - **price** (`number`) — Numeric price (parsed float) via `faker.commerce.price()`.
     *   - **category** (`string`) — Product category / department via `faker.commerce.department()`.
     *   - **material** (`string`) — Material (e.g. "Cotton", "Steel") via `faker.commerce.productMaterial()`.
     *   - **adjective** (`string`) — Descriptive adjective (e.g. "Ergonomic") via `faker.commerce.productAdjective()`.
     *   - Plus any additional keys from `overrides`.
     *
     * @example
     * const product = DataGenerator.generateProduct();
     * console.log(product);
     * // {
     * //   id: 'c7b3d8e0-5e0a-4b9f-a8d1-2f3e4a5b6c7d',
     * //   name: 'Incredible Frozen Chair',
     * //   description: 'The slim & simple design...',
     * //   price: 42.99,
     * //   category: 'Toys',
     * //   material: 'Granite',
     * //   adjective: 'Incredible'
     * // }
     *
     * @example <caption>Override price and category for a checkout test</caption>
     * const item = DataGenerator.generateProduct({ price: 9.99, category: 'Books' });
     * console.log(item.price);    // 9.99
     * console.log(item.category); // 'Books'
     */
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

    /**
     * Generate a random email address. Wraps `faker.internet.email()`.
     *
     * @param {string} [provider] - Optional email provider / domain to use
     *   (e.g. `'example.com'`). When omitted, faker picks a random provider.
     * @returns {string} A random email address string (e.g. `'jane.doe@example.com'`).
     *
     * @example
     * const email = DataGenerator.generateEmail();
     * console.log(email); // e.g. 'Brock_Aufderhar94@yahoo.com'
     *
     * @example <caption>Force a corporate domain</caption>
     * const corpEmail = DataGenerator.generateEmail('acme.com');
     * console.log(corpEmail); // e.g. 'Brock_Aufderhar94@acme.com'
     */
    static generateEmail(provider) {
        return faker.internet.email({ provider });
    }

    /**
     * Generate a random password string that always starts with the prefix `'Aa1!'`
     * to satisfy common complexity requirements (uppercase, lowercase, digit, special).
     * Wraps `faker.internet.password()` with `memorable: false`.
     *
     * @param {number} [length=16] - Total desired length of the password (including
     *   the 4-character prefix).
     * @returns {string} A random non-memorable password string prefixed with `'Aa1!'`.
     *
     * @example
     * const pwd = DataGenerator.generatePassword();
     * console.log(pwd);        // e.g. 'Aa1!kL9mQpR2xZ4v'
     * console.log(pwd.length); // 16
     *
     * @example <caption>Generate a longer password</caption>
     * const longPwd = DataGenerator.generatePassword(32);
     * console.log(longPwd.length); // 32
     */
    static generatePassword(length = 16) {
        return faker.internet.password({ length, memorable: false, prefix: 'Aa1!' });
    }

    /**
     * Generate a UUID v4 string. Uses the `uuid` package (`v4`) rather than faker,
     * guaranteeing RFC 4122 compliance.
     *
     * @returns {string} A UUID v4 string (e.g. `'9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'`).
     *
     * @example
     * const id = DataGenerator.generateUUID();
     * console.log(id); // e.g. '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
     */
    static generateUUID() {
        return uuidv4();
    }

    /**
     * Generate a random phone number string. The format depends on the current faker
     * locale. Wraps `faker.phone.number()`.
     *
     * @returns {string} A random phone number string (e.g. `'555-234-8901'`).
     *
     * @example
     * const phone = DataGenerator.generatePhone();
     * console.log(phone); // e.g. '1-555-862-3947 x3291'
     */
    static generatePhone() {
        return faker.phone.number();
    }

    /**
     * Generate a random integer within an inclusive range. Wraps `faker.number.int()`.
     *
     * @param {number} [min=1] - Lower bound (inclusive).
     * @param {number} [max=10000] - Upper bound (inclusive).
     * @returns {number} A random integer between `min` and `max` (inclusive).
     *
     * @example
     * const num = DataGenerator.generateNumber();
     * console.log(num); // e.g. 4827
     *
     * @example <caption>Custom range for ages</caption>
     * const age = DataGenerator.generateNumber(18, 65);
     * console.log(age); // e.g. 34
     */
    static generateNumber(min = 1, max = 10000) {
        return faker.number.int({ min, max });
    }

    /**
     * Generate a random floating-point number within a range, rounded to a given
     * precision. Wraps `faker.number.float()` with the `multipleOf` option.
     *
     * @param {number} [min=0] - Lower bound (inclusive).
     * @param {number} [max=1000] - Upper bound (inclusive).
     * @param {number} [precision=0.01] - The step / multiple-of value that determines
     *   how many decimal places the result has (e.g. `0.01` gives two decimals).
     * @returns {number} A random float between `min` and `max`, rounded to the
     *   nearest `precision`.
     *
     * @example
     * const price = DataGenerator.generateFloat(1, 100, 0.01);
     * console.log(price); // e.g. 42.37
     *
     * @example <caption>Integer-like float with no decimals</caption>
     * const whole = DataGenerator.generateFloat(0, 1000, 1);
     * console.log(whole); // e.g. 738
     */
    static generateFloat(min = 0, max = 1000, precision = 0.01) {
        return faker.number.float({ min, max, multipleOf: precision });
    }

    /**
     * Generate a random boolean (`true` or `false`). Wraps `faker.datatype.boolean()`.
     *
     * @returns {boolean} Either `true` or `false`, each with ~50 % probability.
     *
     * @example
     * const isActive = DataGenerator.generateBoolean();
     * console.log(isActive); // true or false
     */
    static generateBoolean() {
        return faker.datatype.boolean();
    }

    /**
     * Generate a paragraph of lorem-ipsum text. Wraps `faker.lorem.paragraph()`.
     *
     * @param {number} [sentences=3] - The number of sentences in the paragraph.
     * @returns {string} A lorem-ipsum paragraph string.
     *
     * @example
     * const bio = DataGenerator.generateParagraph();
     * console.log(bio);
     * // e.g. 'Voluptas rerum est. Nihil et odio accusantium. Quia quae dolorem.'
     *
     * @example <caption>Longer paragraph for a description field</caption>
     * const desc = DataGenerator.generateParagraph(7);
     * console.log(desc.split('.').length); // ~7 sentences
     */
    static generateParagraph(sentences = 3) {
        return faker.lorem.paragraph(sentences);
    }

    /**
     * Generate a single lorem-ipsum sentence. Wraps `faker.lorem.sentence()`.
     *
     * @param {number} [wordCount=8] - The approximate number of words in the sentence.
     * @returns {string} A lorem-ipsum sentence string ending with a period.
     *
     * @example
     * const sentence = DataGenerator.generateSentence();
     * console.log(sentence); // e.g. 'Quia dolorem rerum sunt voluptas et nihil odio.'
     *
     * @example <caption>Short sentence for a title field</caption>
     * const title = DataGenerator.generateSentence(4);
     * console.log(title); // e.g. 'Voluptas rerum est nihil.'
     */
    static generateSentence(wordCount = 8) {
        return faker.lorem.sentence(wordCount);
    }

    /**
     * Generate a single random lorem-ipsum word. Wraps `faker.lorem.word()`.
     *
     * @returns {string} A single random word (e.g. `'voluptas'`).
     *
     * @example
     * const word = DataGenerator.generateWord();
     * console.log(word); // e.g. 'consequatur'
     */
    static generateWord() {
        return faker.lorem.word();
    }

    /**
     * Generate a space-separated string of random lorem-ipsum words.
     * Wraps `faker.lorem.words()`.
     *
     * @param {number} [count=3] - The number of words to generate.
     * @returns {string} A string of `count` space-separated words
     *   (e.g. `'voluptas rerum est'`).
     *
     * @example
     * const label = DataGenerator.generateWords();
     * console.log(label); // e.g. 'voluptas rerum est'
     *
     * @example <caption>Generate a longer tag line</caption>
     * const tagLine = DataGenerator.generateWords(6);
     * console.log(tagLine); // e.g. 'nihil odio accusantium quia quae dolorem'
     */
    static generateWords(count = 3) {
        return faker.lorem.words(count);
    }

    /**
     * Generate a random URL. Wraps `faker.internet.url()`.
     *
     * @returns {string} A random URL string (e.g. `'https://loopy-satellite.info'`).
     *
     * @example
     * const url = DataGenerator.generateUrl();
     * console.log(url); // e.g. 'https://bitter-traction.name'
     */
    static generateUrl() {
        return faker.internet.url();
    }

    /**
     * Generate a random IPv4 address. Wraps `faker.internet.ip()`.
     *
     * @returns {string} A random IPv4 address string (e.g. `'245.108.222.0'`).
     *
     * @example
     * const ip = DataGenerator.generateIp();
     * console.log(ip); // e.g. '192.168.12.34'
     */
    static generateIp() {
        return faker.internet.ip();
    }

    /**
     * Generate a random RGB hex colour string. Wraps `faker.color.rgb()`.
     *
     * @returns {string} A hex colour string (e.g. `'#1a2b3c'`).
     *
     * @example
     * const colour = DataGenerator.generateColor();
     * console.log(colour); // e.g. '#8fa495'
     */
    static generateColor() {
        return faker.color.rgb();
    }

    // ─── Date Helpers ─────────────────────────────────────────

    /**
     * Generate a random date in the past. Wraps `faker.date.past()`.
     *
     * @param {number} [years=1] - Maximum number of years in the past from today.
     * @returns {Date} A `Date` object somewhere between `now − years` and `now`.
     *
     * @example
     * const pastDate = DataGenerator.generatePastDate();
     * console.log(pastDate); // e.g. 2025-08-14T12:34:56.789Z
     *
     * @example <caption>Up to 5 years in the past</caption>
     * const oldDate = DataGenerator.generatePastDate(5);
     * console.log(oldDate.getFullYear()); // between current year - 5 and current year
     */
    static generatePastDate(years = 1) {
        return faker.date.past({ years });
    }

    /**
     * Generate a random date in the future. Wraps `faker.date.future()`.
     *
     * @param {number} [years=1] - Maximum number of years in the future from today.
     * @returns {Date} A `Date` object somewhere between `now` and `now + years`.
     *
     * @example
     * const futureDate = DataGenerator.generateFutureDate();
     * console.log(futureDate); // e.g. 2027-03-22T08:15:30.123Z
     *
     * @example <caption>Up to 10 years ahead for long-term tests</caption>
     * const farDate = DataGenerator.generateFutureDate(10);
     * console.log(farDate.getFullYear()); // between current year and current year + 10
     */
    static generateFutureDate(years = 1) {
        return faker.date.future({ years });
    }

    /**
     * Generate a random date between two boundary dates. Wraps `faker.date.between()`.
     *
     * @param {Date|string} from - The start of the date range (inclusive). Accepts a
     *   `Date` object or an ISO 8601 date string.
     * @param {Date|string} to - The end of the date range (inclusive). Accepts a
     *   `Date` object or an ISO 8601 date string.
     * @returns {Date} A `Date` object somewhere between `from` and `to`.
     *
     * @example
     * const date = DataGenerator.generateDateBetween('2024-01-01', '2025-12-31');
     * console.log(date); // e.g. 2024-09-17T16:42:11.000Z
     *
     * @example <caption>Using Date objects</caption>
     * const start = new Date(2020, 0, 1);
     * const end   = new Date(2025, 11, 31);
     * const d = DataGenerator.generateDateBetween(start, end);
     * console.log(d.getFullYear()); // between 2020 and 2025
     */
    static generateDateBetween(from, to) {
        return faker.date.between({ from, to });
    }

    /**
     * Generate a random recent date (within the last N days). Wraps
     * `faker.date.recent()`.
     *
     * @param {number} [days=7] - Number of days in the past to consider.
     * @returns {Date} A `Date` object somewhere between `now − days` and `now`.
     *
     * @example
     * const recent = DataGenerator.generateRecentDate();
     * console.log(recent); // a date within the last 7 days
     *
     * @example <caption>Within the last 24 hours</caption>
     * const veryRecent = DataGenerator.generateRecentDate(1);
     * console.log(veryRecent); // a date within the last day
     */
    static generateRecentDate(days = 7) {
        return faker.date.recent({ days });
    }

    // ─── Array Helpers ────────────────────────────────────────

    /**
     * Pick a single random element from the provided array. Wraps
     * `faker.helpers.arrayElement()`.
     *
     * @template T
     * @param {T[]} array - The source array to pick from. Must contain at least
     *   one element.
     * @returns {T} A single randomly selected element from `array`.
     *
     * @example
     * const env = DataGenerator.pickRandom(['dev', 'staging', 'prod']);
     * console.log(env); // e.g. 'staging'
     *
     * @example <caption>Pick a random user from a list</caption>
     * const users = DataGenerator.generateUsers(5);
     * const lucky = DataGenerator.pickRandom(users);
     * console.log(lucky.firstName);
     */
    static pickRandom(array) {
        return faker.helpers.arrayElement(array);
    }

    /**
     * Pick N unique random elements from the provided array. Wraps
     * `faker.helpers.arrayElements()`.
     *
     * @template T
     * @param {T[]} array - The source array to pick from.
     * @param {number} count - The number of unique elements to pick. Must be
     *   ≤ `array.length`.
     * @returns {T[]} An array of `count` randomly selected unique elements.
     *
     * @example
     * const winners = DataGenerator.pickMultipleRandom(
     *   ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
     *   2,
     * );
     * console.log(winners); // e.g. ['Charlie', 'Eve']
     *
     * @example <caption>Select random tags for a product</caption>
     * const allTags = ['sale', 'new', 'popular', 'limited', 'eco'];
     * const tags = DataGenerator.pickMultipleRandom(allTags, 3);
     * console.log(tags); // e.g. ['new', 'limited', 'eco']
     */
    static pickMultipleRandom(array, count) {
        return faker.helpers.arrayElements(array, count);
    }

    /**
     * Return a new array with the elements of the input array in random order.
     * Wraps `faker.helpers.shuffle()`. The original array is **not** mutated.
     *
     * @template T
     * @param {T[]} array - The array to shuffle.
     * @returns {T[]} A new array containing all elements of `array` in a random order.
     *
     * @example
     * const steps = ['login', 'search', 'add-to-cart', 'checkout'];
     * const randomOrder = DataGenerator.shuffle(steps);
     * console.log(randomOrder); // e.g. ['search', 'checkout', 'login', 'add-to-cart']
     */
    static shuffle(array) {
        return faker.helpers.shuffle(array);
    }

    // ─── Template ─────────────────────────────────────────────

    /**
     * Generate a string by replacing special placeholder characters in a template:
     * - `#` → random digit (0–9)
     * - `?` → random letter (a–z)
     * - `*` → random alphanumeric character
     *
     * Wraps `faker.helpers.replaceSymbols()`.
     *
     * @param {string} template - A pattern string containing `#`, `?`, and/or `*`
     *   placeholders.
     * @returns {string} The template with every placeholder replaced by a random
     *   character of the corresponding type.
     *
     * @example
     * const serial = DataGenerator.fromTemplate('###-???-***');
     * console.log(serial); // e.g. '482-kLm-9aZ'
     *
     * @example <caption>Generate a mock licence plate</caption>
     * const plate = DataGenerator.fromTemplate('??-####');
     * console.log(plate); // e.g. 'AB-3847'
     *
     * @example <caption>Generate a confirmation code</caption>
     * const code = DataGenerator.fromTemplate('CONF-######');
     * console.log(code); // e.g. 'CONF-839201'
     */
    static fromTemplate(template) {
        return faker.helpers.replaceSymbols(template);
    }

    /**
     * Generate a unique, timestamped test identifier string of the form
     * `PREFIX-<epoch_ms>-<6_random_alphanumeric>`. Useful for creating unique test
     * entity names, order IDs, or correlation tokens that can be traced back to a
     * specific test run.
     *
     * @param {string} [prefix='TEST'] - A short descriptive prefix for the identifier
     *   (e.g. `'ORDER'`, `'USER'`, `'TXN'`).
     * @returns {string} A unique identifier string, e.g. `'TEST-1709136000000-A3K9M2'`.
     *
     * @example
     * const testId = DataGenerator.generateTestId();
     * console.log(testId); // e.g. 'TEST-1709136000000-X7B2K4'
     *
     * @example <caption>Custom prefix for an order test</caption>
     * const orderId = DataGenerator.generateTestId('ORDER');
     * console.log(orderId); // e.g. 'ORDER-1709136000000-M3P8Q1'
     *
     * @example <caption>Use as a unique correlation token</caption>
     * const correlationId = DataGenerator.generateTestId('CORR');
     * console.log(correlationId.startsWith('CORR-')); // true
     */
    static generateTestId(prefix = 'TEST') {
        const timestamp = Date.now();
        const random = faker.string.alphanumeric(6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }
}

module.exports = { DataGenerator };
