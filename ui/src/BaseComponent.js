/**
 * ═══════════════════════════════════════════════════════════════
 * BaseComponent - Reusable UI Component Object
 * ═══════════════════════════════════════════════════════════════
 *
 * Represents a reusable UI fragment (header, footer, modal, etc.)
 * that can be composed inside Page Objects.  Each component is
 * scoped to a root selector so all internal queries are relative.
 *
 * @module BaseComponent
 * @example
 * const { BaseComponent } = require('@wdio-framework/ui');
 *
 * class HeaderComponent extends BaseComponent {
 *     constructor() { super('[data-testid="header"]'); }
 *     get logo() { return this.root.$('.logo'); }
 *     get navLinks() { return this.root.$$('nav a'); }
 * }
 *
 * // In a page object or step definition:
 * const header = new HeaderComponent();
 * await header.waitForDisplayed();
 * const logoText = await header.getText('.logo');
 */

const { Logger, Timeouts } = require('@wdio-framework/core');
const { ShadowDomResolver } = require('./ShadowDomResolver');

/**
 * Base class for reusable UI component objects.
 * All child queries are scoped to the component’s root selector.
 *
 * @class BaseComponent
 */
class BaseComponent {
    /**
     * @param {string}  rootSelector    CSS/XPath selector that scopes the component
     * @param {Object}  [options]
     * @param {boolean} [options.shadow=false]  True if this component lives inside a shadow DOM
     */
    constructor(rootSelector, { shadow = false } = {}) {
        this.rootSelector = rootSelector;
        this.timeout = Timeouts.ELEMENT_WAIT;
        this.logger = Logger.getInstance(`Component:${this.constructor.name}`);
        this._shadow = shadow;
        if (shadow) {
            this._shadowResolver = new ShadowDomResolver();
        }
    }

    /** Return the root element of this component.
     * @returns {WebdriverIO.Element} The scoped root element
     */
    get root() {
        if (this._shadow) {
            return this._shadowResolver.deepFindElement(this.rootSelector, this.timeout);
        }
        return $(this.rootSelector);
    }

    /** Check whether the component root is currently visible.
     * @returns {Promise<boolean>} `true` if the root element is displayed
     */
    async isDisplayed() {
        try {
            const el = await this.root;
            return await el.isDisplayed();
        } catch {
            return false;
        }
    }

    /** Wait until the component root is visible.
     * @param {number} [timeout] Max wait in ms (defaults to `Timeouts.ELEMENT_WAIT`)
     * @returns {Promise<void>}
     * @throws {Error} If the root is not displayed within the timeout
     */
    async waitForDisplayed(timeout = this.timeout) {
        const el = await this.root;
        await el.waitForDisplayed({
            timeout,
            timeoutMsg: `${this.constructor.name} not displayed after ${timeout}ms`,
        });
    }

    /** Wait until the component root is no longer visible.
     * @param {number} [timeout] Max wait in ms (defaults to `Timeouts.ELEMENT_WAIT`)
     * @returns {Promise<void>}
     */
    async waitForNotDisplayed(timeout = this.timeout) {
        const el = await this.root;
        await el.waitForDisplayed({
            timeout,
            reverse: true,
            timeoutMsg: `${this.constructor.name} still displayed after ${timeout}ms`,
        });
    }

    /** Click an element inside the component.
     * @param {string|WebdriverIO.Element} childElement  CSS selector relative to root, or element
     * @returns {Promise<void>}
     */
    async click(childElement) {
        const el = typeof childElement === 'string'
            ? await this.root.$(childElement)
            : await childElement;
        await el.waitForClickable({ timeout: this.timeout });
        await el.click();
    }

    /** Get text from a child element.
     * @param {string|WebdriverIO.Element} childElement  CSS selector relative to root, or element
     * @returns {Promise<string>} The element’s visible text
     */
    async getText(childElement) {
        const el = typeof childElement === 'string'
            ? await this.root.$(childElement)
            : await childElement;
        await el.waitForDisplayed({ timeout: this.timeout });
        return el.getText();
    }

    /** Set value on a child input element.
     * @param {string|WebdriverIO.Element} childElement  CSS selector relative to root, or element
     * @param {string} value  The value to type
     * @returns {Promise<void>}
     */
    async setValue(childElement, value) {
        const el = typeof childElement === 'string'
            ? await this.root.$(childElement)
            : await childElement;
        await el.waitForDisplayed({ timeout: this.timeout });
        await el.clearValue();
        await el.setValue(value);
    }

    /** Get all matching child elements.
     * @param {string} childSelector  CSS selector relative to root
     * @returns {Promise<WebdriverIO.Element[]>}
     */
    async getElements(childSelector) {
        return this.root.$$(childSelector);
    }

    /** Get the count of matching child elements.
     * @param {string} childSelector  CSS selector relative to root
     * @returns {Promise<number>}
     */
    async getElementCount(childSelector) {
        const elements = await this.root.$$(childSelector);
        return elements.length;
    }
}

module.exports = { BaseComponent };
