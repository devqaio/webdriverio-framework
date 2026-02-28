/**
 * ═══════════════════════════════════════════════════════════════
 * ElementHelper - Robust Element Interaction Utilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Static utility methods that provide safe, retry-aware element
 * operations on top of WebdriverIO's built-in API.  Designed to
 * be imported anywhere without instantiation.
 *
 * Includes shadow DOM and iframe awareness — when an element is
 * not found in the regular DOM, helpers automatically delegate to
 * ShadowDomResolver and FrameManager for transparent resolution.
 */

const { Timeouts, Logger } = require('@wdio-framework/core');
const { ShadowDomResolver } = require('./ShadowDomResolver');
const { FrameManager } = require('./FrameManager');

const logger = Logger.getInstance('ElementHelper');
const shadowResolver = new ShadowDomResolver();
const frameManager = new FrameManager();

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
     */
    static async countVisibleElements(selector) {
        const visible = await ElementHelper.getVisibleElements(selector);
        return visible.length;
    }

    /**
     * Wait until a specific number of elements exist.
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
