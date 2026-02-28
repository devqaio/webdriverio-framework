/**
 * ═══════════════════════════════════════════════════════════════
 * ElementHelper - Robust Element Interaction Utilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Static utility methods that provide safe, retry-aware element
 * operations on top of WebdriverIO’s built-in API.  Designed to
 * be imported anywhere without instantiation.
 *
 * Includes shadow DOM and iframe awareness — when an element is
 * not found in the regular DOM, helpers automatically delegate to
 * {@link ShadowDomResolver} and {@link FrameManager} for transparent resolution.
 *
 * @module ElementHelper
 * @example
 * const { ElementHelper } = require('@wdio-framework/ui');
 *
 * // Smart resolve (standard → shadow DOM → iframe fallback)
 * const el = await ElementHelper.resolve('button.submit');
 *
 * // Safe click with automatic retry on stale element
 * await ElementHelper.safeClick('button.submit');
 *
 * // Wait for text to match
 * await ElementHelper.waitForTextToBe('.status', 'Complete');
 *
 * // Get text from all matching elements
 * const items = await ElementHelper.getTextFromAll('.list-item');
 */

const { Timeouts, Logger } = require('@wdio-framework/core');
const { ShadowDomResolver } = require('./ShadowDomResolver');
const { FrameManager } = require('./FrameManager');

const logger = Logger.getInstance('ElementHelper');
const shadowResolver = new ShadowDomResolver();
const frameManager = new FrameManager();

/**
 * Static utility class providing safe, retry-aware element interactions
 * with automatic shadow DOM and iframe fallback resolution.
 *
 * @class ElementHelper
 */
class ElementHelper {

    /**
     * Smart element resolution — attempts standard lookup, then shadow DOM,
     * then frame traversal.
     *
     * @param {string|WebdriverIO.Element} selectorOrElement
     * @returns {Promise<WebdriverIO.Element>}
     */
    static async resolve(selectorOrElement) {
        if (typeof selectorOrElement !== 'string') return selectorOrElement;

        const selector = selectorOrElement;

        // Deep shadow `>>>` selector
        if (shadowResolver.isDeepSelector(selector)) {
            return shadowResolver.findInShadowDom(selector);
        }

        // Standard lookup
        const el = await $(selector);
        const exists = await el.isExisting().catch(() => false);
        if (exists) return el;

        // Shadow DOM fallback
        const hasShadow = await shadowResolver.hasShadowDom().catch(() => false);
        if (hasShadow) {
            const shadowEl = await shadowResolver.deepFindElement(selector, Timeouts.ELEMENT_WAIT).catch(() => null);
            if (shadowEl) return shadowEl;
        }

        // Frame fallback
        const frameCount = await frameManager.getFrameCount().catch(() => 0);
        if (frameCount > 0) {
            const result = await frameManager.findElementAcrossFrames(selector, Timeouts.ELEMENT_WAIT).catch(() => null);
            if (result && result.element) return result.element;
        }

        // Return the cached element (will fail naturally on interaction)
        return el;
    }

    /**
     * Safely click with automatic retry on stale / intercept errors.
     * Re-resolves the element on each attempt to handle DOM re-renders.
     *
     * @param {string|WebdriverIO.Element} element  CSS selector or element reference
     * @param {Object} [options]
     * @param {number} [options.retries=3]  Maximum retry attempts
     * @param {number} [options.timeout]    Wait timeout per attempt (defaults to `Timeouts.ELEMENT_WAIT`)
     * @returns {Promise<void>}
     * @throws {Error} If the click fails after all retries
     *
     * @example
     * await ElementHelper.safeClick('button.submit');
     * await ElementHelper.safeClick('#save-btn', { retries: 5, timeout: 10000 });
     */
    static async safeClick(element, { retries = 3, timeout = Timeouts.ELEMENT_WAIT } = {}) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const el = await ElementHelper.resolve(element);
                await el.waitForClickable({ timeout });
                await el.click();
                return;
            } catch (error) {
                logger.warn(`Click attempt ${attempt}/${retries} failed: ${error.message}`);
                if (attempt === retries) throw error;
                await browser.pause(500);
            }
        }
    }

    /**
     * Safely set a value with retry logic.
     * Re-resolves the element on each attempt to handle DOM re-renders.
     *
     * @param {string|WebdriverIO.Element} element  CSS selector or element reference
     * @param {string} value  The value to type into the input
     * @param {Object} [options]
     * @param {number} [options.retries=3]  Maximum retry attempts
     * @param {number} [options.timeout]    Wait timeout per attempt
     * @returns {Promise<void>}
     *
     * @example
     * await ElementHelper.safeSetValue('#email', 'user@example.com');
     */
    static async safeSetValue(element, value, { retries = 3, timeout = Timeouts.ELEMENT_WAIT } = {}) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const el = await ElementHelper.resolve(element);
                await el.waitForDisplayed({ timeout });
                await el.clearValue();
                await el.setValue(value);
                return;
            } catch (error) {
                logger.warn(`setValue attempt ${attempt}/${retries} failed: ${error.message}`);
                if (attempt === retries) throw error;
                await browser.pause(500);
            }
        }
    }

    /**
     * Safely get text with retry logic.
     * Re-resolves the element on each attempt to handle DOM re-renders.
     *
     * @param {string|WebdriverIO.Element} element  CSS selector or element reference
     * @param {Object} [options]
     * @param {number} [options.retries=3]  Maximum retry attempts
     * @param {number} [options.timeout]    Wait timeout per attempt
     * @returns {Promise<string>} The element’s visible text content
     *
     * @example
     * const message = await ElementHelper.safeGetText('.alert-message');
     */
    static async safeGetText(element, { retries = 3, timeout = Timeouts.ELEMENT_WAIT } = {}) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const el = await ElementHelper.resolve(element);
                await el.waitForDisplayed({ timeout });
                return await el.getText();
            } catch (error) {
                logger.warn(`getText attempt ${attempt}/${retries} failed: ${error.message}`);
                if (attempt === retries) throw error;
                await browser.pause(500);
            }
        }
    }

    /**
     * Wait for text in an element to match a given value.
     * Resolves the element inside the waitUntil to handle re-renders gracefully.
     *
     * @param {string|WebdriverIO.Element} element  CSS selector or element reference
     * @param {string} expectedText  Exact text to match (trimmed comparison)
     * @param {number} [timeout]     Max wait in ms (defaults to `Timeouts.ELEMENT_WAIT`)
     * @returns {Promise<void>}
     * @throws {Error} If text does not match within the timeout
     *
     * @example
     * await ElementHelper.waitForTextToBe('.status-badge', 'Approved');
     */
    static async waitForTextToBe(element, expectedText, timeout = Timeouts.ELEMENT_WAIT) {
        await browser.waitUntil(
            async () => {
                const el = await ElementHelper.resolve(element);
                const text = await el.getText();
                return text.trim() === expectedText;
            },
            { timeout, timeoutMsg: `Text did not become "${expectedText}" within ${timeout}ms` },
        );
    }

    /**
     * Wait until the text of an element contains a substring.
     * Resolves the element inside the waitUntil to handle re-renders gracefully.
     *
     * @param {string|WebdriverIO.Element} element      CSS selector or element reference
     * @param {string} partialText   Substring to search for
     * @param {number} [timeout]     Max wait in ms
     * @returns {Promise<void>}
     */
    static async waitForTextContains(element, partialText, timeout = Timeouts.ELEMENT_WAIT) {
        await browser.waitUntil(
            async () => {
                const el = await ElementHelper.resolve(element);
                const text = await el.getText();
                return text.includes(partialText);
            },
            { timeout, timeoutMsg: `Text did not contain "${partialText}" within ${timeout}ms` },
        );
    }

    /**
     * Wait until an attribute of an element equals a given value.
     * Resolves the element inside the waitUntil to handle re-renders gracefully.
     *
     * @param {string|WebdriverIO.Element} element        CSS selector or element
     * @param {string} attrName       Attribute name (e.g. `'class'`, `'aria-expanded'`)
     * @param {string} expectedValue  Expected attribute value
     * @param {number} [timeout]      Max wait in ms
     * @returns {Promise<void>}
     *
     * @example
     * await ElementHelper.waitForAttributeToBe('.dropdown', 'aria-expanded', 'true');
     */
    static async waitForAttributeToBe(element, attrName, expectedValue, timeout = Timeouts.ELEMENT_WAIT) {
        await browser.waitUntil(
            async () => {
                const el = await ElementHelper.resolve(element);
                const val = await el.getAttribute(attrName);
                return val === expectedValue;
            },
            { timeout, timeoutMsg: `Attribute "${attrName}" did not become "${expectedValue}" within ${timeout}ms` },
        );
    }

    /**
     * Return all visible (displayed) elements matching a selector.
     *
     * @param {string} selector  CSS selector
     * @returns {Promise<WebdriverIO.Element[]>} Array of displayed elements
     */
    static async getVisibleElements(selector) {
        const elements = await $$(selector);
        const visible = [];
        for (const el of elements) {
            if (await el.isDisplayed()) visible.push(el);
        }
        return visible;
    }

    /**
     * Get an array of text values from all matching elements.
     *
     * @param {string} selector  CSS selector
     * @returns {Promise<string[]>} Array of text values
     *
     * @example
     * const items = await ElementHelper.getTextFromAll('.product-name');
     * // ['Widget A', 'Widget B', 'Widget C']
     */
    static async getTextFromAll(selector) {
        const elements = await $$(selector);
        const texts = [];
        for (const el of elements) {
            texts.push(await el.getText());
        }
        return texts;
    }

    /**
     * Click the first element in a list that contains the given text.
     *
     * @param {string} selector  CSS selector matching multiple elements
     * @param {string} text      Exact text to match (trimmed)
     * @returns {Promise<void>}
     * @throws {Error} If no element with matching text is found
     *
     * @example
     * await ElementHelper.clickElementByText('.menu-item', 'Settings');
     */
    static async clickElementByText(selector, text) {
        const elements = await $$(selector);
        for (const el of elements) {
            const elText = await el.getText();
            if (elText.trim() === text) {
                await el.click();
                return;
            }
        }
        throw new Error(`No element matching "${selector}" found with text "${text}"`);
    }

    /**
     * Check if any element matching a selector contains the given text.
     *
     * @param {string} selector  CSS selector
     * @param {string} text      Text substring to search for
     * @returns {Promise<boolean>}
     */
    static async isTextPresentInAny(selector, text) {
        const elements = await $$(selector);
        for (const el of elements) {
            const elText = await el.getText();
            if (elText.includes(text)) return true;
        }
        return false;
    }

    /**
     * Count visible elements matching a selector.
     *
     * @param {string} selector  CSS selector
     * @returns {Promise<number>}
     */
    static async countVisibleElements(selector) {
        const visible = await ElementHelper.getVisibleElements(selector);
        return visible.length;
    }

    /**
     * Wait until a specific number of elements exist in the DOM.
     *
     * @param {string} selector        CSS selector
     * @param {number} expectedCount   Expected number of elements
     * @param {number} [timeout]       Max wait in ms
     * @returns {Promise<void>}
     *
     * @example
     * // Wait until exactly 5 table rows exist
     * await ElementHelper.waitForElementCount('table tbody tr', 5);
     */
    static async waitForElementCount(selector, expectedCount, timeout = Timeouts.ELEMENT_WAIT) {
        await browser.waitUntil(
            async () => {
                const elements = await $$(selector);
                return elements.length === expectedCount;
            },
            { timeout, timeoutMsg: `Expected ${expectedCount} elements for "${selector}" within ${timeout}ms` },
        );
    }
}

module.exports = { ElementHelper };
