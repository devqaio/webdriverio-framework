/**
 * ═══════════════════════════════════════════════════════════════
 * BaseComponent - Reusable UI Component Object
 * ═══════════════════════════════════════════════════════════════
 *
 * Represents a reusable UI fragment (header, footer, modal, etc.)
 * that can be composed inside Page Objects.  Each component is
 * scoped to a root selector so all internal queries are relative.
 *
 * Usage:
 *   class HeaderComponent extends BaseComponent {
 *       constructor() { super('[data-testid="header"]'); }
 *       get logo() { return this.root.$('.logo'); }
 *   }
 */

const { Logger } = require('../utils/Logger');
const { Timeouts } = require('../constants/Timeouts');

class BaseComponent {
    /**
     * @param {string} rootSelector  CSS/XPath selector that scopes the component
     */
    constructor(rootSelector) {
        this.rootSelector = rootSelector;
        this.timeout = Timeouts.ELEMENT_WAIT;
        this.logger = Logger.getInstance(`Component:${this.constructor.name}`);
    }

    /** Return the root element of this component. */
    get root() {
        return $(this.rootSelector);
    }

    /** Check whether the component root is currently visible. */
    async isDisplayed() {
        try {
            const el = await this.root;
            return await el.isDisplayed();
        } catch {
            return false;
        }
    }

    /** Wait until the component root is visible. */
    async waitForDisplayed(timeout = this.timeout) {
        const el = await this.root;
        await el.waitForDisplayed({
            timeout,
            timeoutMsg: `${this.constructor.name} not displayed after ${timeout}ms`,
        });
    }

    /** Wait until the component root is no longer visible. */
    async waitForNotDisplayed(timeout = this.timeout) {
        const el = await this.root;
        await el.waitForDisplayed({
            timeout,
            reverse: true,
            timeoutMsg: `${this.constructor.name} still displayed after ${timeout}ms`,
        });
    }

    /** Click an element inside the component. */
    async click(childElement) {
        const el = typeof childElement === 'string'
            ? await this.root.$(childElement)
            : await childElement;
        await el.waitForClickable({ timeout: this.timeout });
        await el.click();
    }

    /** Get text from a child element. */
    async getText(childElement) {
        const el = typeof childElement === 'string'
            ? await this.root.$(childElement)
            : await childElement;
        await el.waitForDisplayed({ timeout: this.timeout });
        return el.getText();
    }

    /** Set value on a child input element. */
    async setValue(childElement, value) {
        const el = typeof childElement === 'string'
            ? await this.root.$(childElement)
            : await childElement;
        await el.waitForDisplayed({ timeout: this.timeout });
        await el.clearValue();
        await el.setValue(value);
    }

    /** Get all matching child elements. */
    async getElements(childSelector) {
        return this.root.$$(childSelector);
    }

    /** Get the count of matching child elements. */
    async getElementCount(childSelector) {
        const elements = await this.root.$$(childSelector);
        return elements.length;
    }
}

module.exports = { BaseComponent };
