/**
 * ═══════════════════════════════════════════════════════════════════════
 * AbstractBasePage — Shared Foundation Page Object (Core)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * @class AbstractBasePage
 * @abstract
 * @description
 * Platform-agnostic abstract base class providing the common API for both web
 * and mobile page objects. This is the foundation of the page object model
 * and provides a comprehensive set of methods for browser interaction,
 * element manipulation, waiting strategies, and test utilities.
 *
 * All element-accepting methods resolve elements via {@link _resolveElement},
 * which accepts a WebdriverIO element, a CSS/XPath selector string, or a
 * Promise that resolves to an element.
 *
 * Contains:
 *   - Navigation helpers ({@link open}, {@link refresh}, {@link goBack}, {@link goForward})
 *   - Element interaction ({@link click}, {@link setValue}, {@link doubleClick}, etc.)
 *   - Element queries ({@link getText}, {@link getValue}, {@link getAttribute}, etc.)
 *   - State checks ({@link isDisplayed}, {@link isEnabled}, {@link isExisting}, etc.)
 *   - Wait helpers ({@link waitForDisplayed}, {@link waitForClickable}, {@link waitForPageLoad}, etc.)
 *   - JavaScript execution ({@link executeScript}, {@link jsClick})
 *   - Screenshot capture ({@link takeScreenshot}, {@link takeElementScreenshot})
 *   - Keyboard & drag-and-drop ({@link pressKey}, {@link pressKeys}, {@link dragAndDrop})
 *
 * @property {Object} logger - Logger instance for the page, created via {@link Logger.getInstance}.
 *   Named `Page:<ClassName>` for easy log filtering.
 * @property {number} timeout - Default timeout (ms) for element waits,
 *   initialized from {@link Timeouts.ELEMENT_WAIT}.
 * @property {string} [url] - Override in subclasses to define the default
 *   URL path passed to {@link open}. When `open()` is called without an
 *   explicit path, the value of `this.url` (or `'/'`) is used.
 *
 * Packages that extend this class:
 *   - `@wdio-framework/ui` → `BasePage` (adds Shadow DOM, Frames, Alerts, Cookies, Tabs …)
 *   - `@wdio-framework/mobile` → `MobileBasePage` (adds gestures, contexts, device helpers …)
 *
 * Application-level page objects should **not** extend AbstractBasePage
 * directly — use `BasePage` or `MobileBasePage` instead.
 *
 * @example
 * // Define a page object by extending BasePage (which extends AbstractBasePage):
 * class LoginPage extends BasePage {
 *   get usernameInput() { return $('[data-testid="username"]'); }
 *   get passwordInput() { return $('[data-testid="password"]'); }
 *   get submitButton() { return $('[data-testid="submit"]'); }
 *
 *   async login(username, password) {
 *     await this.setValue(this.usernameInput, username);
 *     await this.setValue(this.passwordInput, password);
 *     await this.click(this.submitButton);
 *   }
 * }
 * ═══════════════════════════════════════════════════════════════════════
 */

const path = require('path');
const { Logger } = require('../utils/Logger');
const { Timeouts } = require('../constants/Timeouts');

class AbstractBasePage {
    /**
     * Creates an instance of AbstractBasePage.
     * Initializes the logger with the concrete class name and sets the default
     * element wait timeout from the framework's {@link Timeouts} configuration.
     *
     * @constructor
     */
    constructor() {
        this.logger = Logger.getInstance(`Page:${this.constructor.name}`);
        this.timeout = Timeouts.ELEMENT_WAIT;
    }

    /**
     * Override in subclasses to verify the page/screen is fully loaded.
     * Called after navigation to confirm readiness. Subclasses should implement
     * custom checks (e.g., verifying a key element is visible) and return
     * `false` if the page is not ready.
     *
     * @returns {Promise<boolean>} Resolves to `true` if the page is loaded and ready for interaction.
     * @example
     * // Override in a subclass:
     * async isLoaded() {
     *   return this.isDisplayed(this.headerLogo);
     * }
     */
    async isLoaded() {
        // Default: page is considered loaded after waitForPageLoad succeeds.
        return true;
    }

    // ─── Navigation ───────────────────────────────────────────

    /**
     * Open a URL path relative to the `baseUrl` defined in the WDIO configuration.
     * If no path is provided, falls back to `this.url` (set in the subclass) or `'/'`.
     * Automatically waits for the page to finish loading via {@link waitForPageLoad}.
     *
     * @param {string} [path=''] - The URL path to append to `baseUrl` (e.g., `'/login'`, `'/dashboard'`).
     * @returns {Promise<AbstractBasePage>} Resolves to `this` for method chaining.
     * @throws {Error} If the page does not finish loading within the page-load timeout.
     * @example
     * const loginPage = new LoginPage();
     * await loginPage.open('/login');
     * // or, if LoginPage defines `url = '/login'`:
     * await loginPage.open();
     */
    async open(path = '') {
        const targetPath = path || this.url || '/';
        this.logger.info(`Navigating to: ${targetPath}`);
        await browser.url(targetPath);
        await this.waitForPageLoad();
        return this;
    }

    /**
     * Navigate to a fully qualified (absolute) URL, bypassing the `baseUrl` configuration.
     * Useful for navigating to external sites or different environments.
     * Automatically waits for the page to finish loading via {@link waitForPageLoad}.
     *
     * @param {string} absoluteUrl - The complete URL to navigate to (e.g., `'https://example.com/page'`).
     * @returns {Promise<AbstractBasePage>} Resolves to `this` for method chaining.
     * @throws {Error} If the page does not finish loading within the page-load timeout.
     * @example
     * await page.openAbsoluteUrl('https://staging.myapp.com/login');
     */
    async openAbsoluteUrl(absoluteUrl) {
        this.logger.info(`Navigating to absolute URL: ${absoluteUrl}`);
        await browser.url(absoluteUrl);
        await this.waitForPageLoad();
        return this;
    }

    /**
     * Reload the current page in the browser.
     * Automatically waits for the page to finish loading via {@link waitForPageLoad}.
     *
     * @returns {Promise<AbstractBasePage>} Resolves to `this` for method chaining.
     * @throws {Error} If the page does not finish loading within the page-load timeout.
     * @example
     * await page.refresh();
     */
    async refresh() {
        this.logger.info('Refreshing page');
        await browser.refresh();
        await this.waitForPageLoad();
        return this;
    }

    /**
     * Navigate back one step in the browser's session history (equivalent to clicking
     * the browser's Back button). Automatically waits for the page to finish loading.
     *
     * @returns {Promise<AbstractBasePage>} Resolves to `this` for method chaining.
     * @throws {Error} If the page does not finish loading within the page-load timeout.
     * @example
     * await page.open('/settings');
     * // ... perform actions ...
     * await page.goBack(); // returns to previous page
     */
    async goBack() {
        this.logger.info('Navigating back');
        await browser.back();
        await this.waitForPageLoad();
        return this;
    }

    /**
     * Navigate forward one step in the browser's session history (equivalent to clicking
     * the browser's Forward button). Automatically waits for the page to finish loading.
     *
     * @returns {Promise<AbstractBasePage>} Resolves to `this` for method chaining.
     * @throws {Error} If the page does not finish loading within the page-load timeout.
     * @example
     * await page.goBack();
     * await page.goForward(); // returns to the page before goBack()
     */
    async goForward() {
        this.logger.info('Navigating forward');
        await browser.forward();
        await this.waitForPageLoad();
        return this;
    }

    // ─── Page State ───────────────────────────────────────────

    /**
     * Retrieve the current page title from the browser.
     *
     * @returns {Promise<string>} Resolves to the document title of the current page.
     * @example
     * const title = await page.getPageTitle();
     * expect(title).toContain('Dashboard');
     */
    async getPageTitle() {
        return browser.getTitle();
    }

    /**
     * Retrieve the current full URL from the browser's address bar.
     *
     * @returns {Promise<string>} Resolves to the full URL string (e.g., `'https://app.com/dashboard?tab=overview'`).
     * @example
     * const url = await page.getCurrentUrl();
     * expect(url).toContain('/dashboard');
     */
    async getCurrentUrl() {
        return browser.getUrl();
    }

    /**
     * Retrieve the full HTML source of the current page.
     *
     * @returns {Promise<string>} Resolves to the complete page source as an HTML string.
     * @example
     * const source = await page.getPageSource();
     * expect(source).toContain('<!DOCTYPE html>');
     */
    async getPageSource() {
        return browser.getPageSource();
    }

    // ─── Element Interaction ──────────────────────────────────

    /**
     * Click an element after ensuring it is clickable (displayed and enabled).
     * The element is first resolved via {@link _resolveElement} and then waited on
     * via {@link waitForClickable} before performing the click action.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<void>}
     * @throws {Error} If the element is not found or not clickable within the default timeout.
     * @example
     * await page.click(page.submitButton);
     * // or with a selector string:
     * await page.click('[data-testid="submit"]');
     */
    async click(element) {
        const el = await this._resolveElement(element);
        await this.waitForClickable(el);
        this.logger.debug(`Clicking element: ${await this._getElementDescription(el)}`);
        await el.click();
    }

    /**
     * Double-click an element after ensuring it is clickable.
     * Useful for triggering double-click events such as opening items in a list
     * or selecting a word in a text editor.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<void>}
     * @throws {Error} If the element is not found or not clickable within the default timeout.
     * @example
     * await page.doubleClick(page.listItem);
     */
    async doubleClick(element) {
        const el = await this._resolveElement(element);
        await this.waitForClickable(el);
        this.logger.debug(`Double-clicking element: ${await this._getElementDescription(el)}`);
        await el.doubleClick();
    }

    /**
     * Right-click (context click) an element to trigger the context menu.
     * Waits for the element to be displayed before performing the right-click.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<void>}
     * @throws {Error} If the element is not found or not displayed within the default timeout.
     * @example
     * await page.rightClick(page.fileItem);
     * await page.click(page.deleteOption); // click context menu item
     */
    async rightClick(element) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.click({ button: 'right' });
    }

    /**
     * Clear the current value of an input field and type new text into it.
     * Waits for the element to be displayed before interacting. First clears
     * any existing value, then sets the new value.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The input element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {string|number} value - The text or number to type into the input field.
     * @returns {Promise<void>}
     * @throws {Error} If the element is not found or not displayed within the default timeout.
     * @example
     * await page.setValue(page.usernameInput, 'testuser@example.com');
     * await page.setValue(page.quantityInput, 5);
     */
    async setValue(element, value) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        this.logger.debug(`Setting value on element: ${await this._getElementDescription(el)}`);
        await el.clearValue();
        await el.setValue(value);
    }

    /**
     * Append text to the current value of an input field without clearing it first.
     * Useful for adding to existing input content or building up text incrementally.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The input element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {string|number} value - The text or number to append to the current value.
     * @returns {Promise<void>}
     * @throws {Error} If the element is not found or not displayed within the default timeout.
     * @example
     * await page.setValue(page.searchInput, 'hello');
     * await page.addValue(page.searchInput, ' world'); // input now contains "hello world"
     */
    async addValue(element, value) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.addValue(value);
    }

    /**
     * Clear the value of an input or textarea field.
     * Waits for the element to be displayed before clearing.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The input element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<void>}
     * @throws {Error} If the element is not found or not displayed within the default timeout.
     * @example
     * await page.clearValue(page.searchInput);
     */
    async clearValue(element) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.clearValue();
    }

    /**
     * Retrieve the visible (rendered) text content of an element.
     * Waits for the element to be displayed before reading text.
     * Returns the trimmed, visible text — hidden text is not included.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<string>} Resolves to the visible text content of the element.
     * @throws {Error} If the element is not found or not displayed within the default timeout.
     * @example
     * const message = await page.getText(page.successBanner);
     * expect(message).toBe('Changes saved successfully');
     */
    async getText(element) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        return el.getText();
    }

    /**
     * Retrieve the `value` attribute of an input, select, or textarea element.
     * Waits for the element to exist in the DOM (it does not need to be visible).
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The input element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<string>} Resolves to the current value of the input element.
     * @throws {Error} If the element does not exist in the DOM within the default timeout.
     * @example
     * const email = await page.getValue(page.emailInput);
     * expect(email).toBe('user@example.com');
     */
    async getValue(element) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        return el.getValue();
    }

    /**
     * Retrieve the value of a specified HTML attribute from an element.
     * Waits for the element to exist in the DOM before reading the attribute.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {string} attributeName - The name of the HTML attribute to retrieve (e.g., `'href'`, `'data-id'`, `'aria-label'`).
     * @returns {Promise<string|null>} Resolves to the attribute value, or `null` if the attribute does not exist.
     * @throws {Error} If the element does not exist in the DOM within the default timeout.
     * @example
     * const href = await page.getAttribute(page.navLink, 'href');
     * expect(href).toContain('/dashboard');
     *
     * const ariaLabel = await page.getAttribute(page.closeButton, 'aria-label');
     * expect(ariaLabel).toBe('Close dialog');
     */
    async getAttribute(element, attributeName) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        return el.getAttribute(attributeName);
    }

    /**
     * Retrieve the computed value of a CSS property for an element.
     * Waits for the element to exist in the DOM before reading the property.
     * Returns the computed (resolved) value as a string.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {string} propertyName - The CSS property name (e.g., `'color'`, `'font-size'`, `'display'`).
     * @returns {Promise<string>} Resolves to the computed CSS property value (e.g., `'rgba(0,0,0,1)'`, `'16px'`).
     * @throws {Error} If the element does not exist in the DOM within the default timeout.
     * @example
     * const color = await page.getCssProperty(page.errorMessage, 'color');
     * expect(color).toContain('rgba(255,0,0');
     *
     * const display = await page.getCssProperty(page.modal, 'display');
     * expect(display).toBe('block');
     */
    async getCssProperty(element, propertyName) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        const cssProperty = await el.getCSSProperty(propertyName);
        return cssProperty.value;
    }

    /**
     * Check whether an element is currently displayed (visible) in the viewport.
     * Returns `false` if the element does not exist or is hidden, rather than
     * throwing an error — making it safe for conditional checks.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<boolean>} Resolves to `true` if the element is visible, `false` otherwise.
     * @example
     * if (await page.isDisplayed(page.welcomeBanner)) {
     *   await page.click(page.dismissButton);
     * }
     */
    async isDisplayed(element) {
        try {
            const el = await this._resolveElement(element);
            return await el.isDisplayed();
        } catch {
            return false;
        }
    }

    /**
     * Check whether an element exists in the DOM (regardless of visibility).
     * Returns `false` if the element is not found, rather than throwing an error —
     * making it safe for conditional checks.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<boolean>} Resolves to `true` if the element exists in the DOM, `false` otherwise.
     * @example
     * const hasError = await page.isExisting(page.errorTooltip);
     * expect(hasError).toBe(false);
     */
    async isExisting(element) {
        try {
            const el = await this._resolveElement(element);
            return await el.isExisting();
        } catch {
            return false;
        }
    }

    /**
     * Check whether an element is enabled (i.e., not disabled).
     * Returns `false` if the element does not exist or is disabled, rather than
     * throwing an error — making it safe for conditional checks.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<boolean>} Resolves to `true` if the element is enabled, `false` otherwise.
     * @example
     * const canSubmit = await page.isEnabled(page.submitButton);
     * expect(canSubmit).toBe(true);
     */
    async isEnabled(element) {
        try {
            const el = await this._resolveElement(element);
            return await el.isEnabled();
        } catch {
            return false;
        }
    }

    /**
     * Check whether a checkbox or radio button element is currently selected/checked.
     * Returns `false` if the element does not exist or is not selected, rather than
     * throwing an error — making it safe for conditional checks.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The checkbox or radio element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<boolean>} Resolves to `true` if the element is selected/checked, `false` otherwise.
     * @example
     * const isChecked = await page.isSelected(page.rememberMeCheckbox);
     * if (!isChecked) {
     *   await page.click(page.rememberMeCheckbox);
     * }
     */
    async isSelected(element) {
        try {
            const el = await this._resolveElement(element);
            return await el.isSelected();
        } catch {
            return false;
        }
    }

    /**
     * Hover over (move the mouse cursor to) an element.
     * Waits for the element to be displayed, then moves the mouse pointer to its center.
     * Useful for triggering hover menus, tooltips, or CSS `:hover` styles.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<void>}
     * @throws {Error} If the element is not found or not displayed within the default timeout.
     * @example
     * await page.hover(page.userMenu);
     * await page.click(page.logoutOption); // now visible after hover
     */
    async hover(element) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        this.logger.debug(`Hovering element: ${await this._getElementDescription(el)}`);
        await el.moveTo();
    }

    /**
     * Scroll an element into the visible viewport area using the native
     * `Element.scrollIntoView()` browser API. Waits for the element to exist
     * in the DOM before scrolling.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {boolean|ScrollIntoViewOptions} [options=true] - Scroll behavior options.
     *   Pass `true` for top alignment, `false` for bottom alignment, or a
     *   `ScrollIntoViewOptions` object (e.g., `{ behavior: 'smooth', block: 'center' }`).
     * @returns {Promise<void>}
     * @throws {Error} If the element does not exist in the DOM within the default timeout.
     * @example
     * await page.scrollIntoView(page.footerSection);
     * await page.scrollIntoView(page.targetElement, { behavior: 'smooth', block: 'center' });
     */
    async scrollIntoView(element, options = true) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        await el.scrollIntoView(options);
    }

    // ─── Wait Helpers ─────────────────────────────────────────

    /**
     * Wait for an element to be displayed (visible) in the viewport.
     * Resolves the element and polls until it becomes visible or the timeout expires.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @returns {Promise<WebdriverIO.Element>} Resolves to the element once it is displayed.
     * @throws {Error} If the element is not displayed within the specified timeout.
     * @example
     * const el = await page.waitForDisplayed(page.successMessage);
     * const text = await el.getText();
     */
    async waitForDisplayed(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForDisplayed({ timeout, timeoutMsg: `Element not displayed after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to exist in the DOM (it does not need to be visible).
     * Resolves the element and polls until it is present in the DOM or the timeout expires.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @returns {Promise<WebdriverIO.Element>} Resolves to the element once it exists in the DOM.
     * @throws {Error} If the element does not exist within the specified timeout.
     * @example
     * const el = await page.waitForExist(page.hiddenDataContainer);
     */
    async waitForExist(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForExist({ timeout, timeoutMsg: `Element does not exist after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to be clickable (both displayed and enabled).
     * Resolves the element and polls until it becomes clickable or the timeout expires.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @returns {Promise<WebdriverIO.Element>} Resolves to the element once it is clickable.
     * @throws {Error} If the element is not clickable within the specified timeout.
     * @example
     * await page.waitForClickable(page.submitButton);
     * await page.click(page.submitButton);
     */
    async waitForClickable(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForClickable({ timeout, timeoutMsg: `Element not clickable after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to become enabled (not disabled).
     * Resolves the element and polls until its `disabled` property is false or the timeout expires.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @returns {Promise<WebdriverIO.Element>} Resolves to the element once it is enabled.
     * @throws {Error} If the element is not enabled within the specified timeout.
     * @example
     * await page.waitForEnabled(page.nextStepButton);
     */
    async waitForEnabled(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForEnabled({ timeout, timeoutMsg: `Element not enabled after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to disappear from the viewport (become not displayed).
     * Uses the `reverse: true` option on `waitForDisplayed` to invert the condition.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @returns {Promise<WebdriverIO.Element>} Resolves to the element once it is no longer displayed.
     * @throws {Error} If the element is still displayed after the specified timeout.
     * @example
     * await page.click(page.closeModalButton);
     * await page.waitForNotDisplayed(page.modal);
     */
    async waitForNotDisplayed(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForDisplayed({ timeout, reverse: true, timeoutMsg: `Element still displayed after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to no longer exist in the DOM.
     * Uses the `reverse: true` option on `waitForExist` to invert the condition.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @returns {Promise<WebdriverIO.Element>} Resolves to the element reference once it is removed from the DOM.
     * @throws {Error} If the element still exists after the specified timeout.
     * @example
     * await page.click(page.deleteButton);
     * await page.waitForNotExist(page.deletedRow);
     */
    async waitForNotExist(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForExist({ timeout, reverse: true, timeoutMsg: `Element still exists after ${timeout}ms` });
        return el;
    }

    /**
     * Wait until a custom condition function returns a truthy value.
     * Polls the provided function repeatedly until it returns `true` or the timeout expires.
     * This is the most flexible wait method and can be used for any arbitrary condition.
     *
     * @param {Function} conditionFn - An async function that returns a truthy value when the condition is met.
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @param {string} [timeoutMsg='Condition not met'] - Error message if the condition is not met within the timeout.
     * @returns {Promise<void>}
     * @throws {Error} If the condition is not met within the specified timeout.
     * @example
     * // Wait until the item count reaches 5:
     * await page.waitUntil(
     *   async () => (await page.getText(page.itemCount)) === '5',
     *   10000,
     *   'Item count did not reach 5'
     * );
     */
    async waitUntil(conditionFn, timeout = this.timeout, timeoutMsg = 'Condition not met') {
        await browser.waitUntil(conditionFn, { timeout, timeoutMsg });
    }

    /**
     * Wait for the page's `document.readyState` to become `'complete'`, indicating
     * that the page and all sub-resources (images, stylesheets, etc.) have finished loading.
     * Called automatically by navigation methods ({@link open}, {@link refresh}, etc.).
     *
     * @param {number} [timeout=Timeouts.PAGE_LOAD] - Maximum time in milliseconds to wait for the page to load.
     * @returns {Promise<void>}
     * @throws {Error} If the page does not reach `readyState === 'complete'` within the specified timeout.
     * @example
     * await page.waitForPageLoad();
     * // Page is now fully loaded and ready for interaction
     */
    async waitForPageLoad(timeout = Timeouts.PAGE_LOAD) {
        await browser.waitUntil(
            async () => {
                const readyState = await browser.execute(() => document.readyState);
                return readyState === 'complete';
            },
            { timeout, timeoutMsg: `Page did not finish loading after ${timeout}ms` },
        );
    }

    /**
     * Wait until the browser's current URL contains a specified substring.
     * Useful for verifying that navigation or redirect has completed.
     *
     * @param {string} partialUrl - The substring to look for in the current URL (e.g., `'/dashboard'`, `'token='`).
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @returns {Promise<void>}
     * @throws {Error} If the URL does not contain the specified substring within the timeout.
     * @example
     * await page.click(page.loginButton);
     * await page.waitForUrlContains('/dashboard');
     */
    async waitForUrlContains(partialUrl, timeout = this.timeout) {
        await browser.waitUntil(
            async () => {
                const currentUrl = await browser.getUrl();
                return currentUrl.includes(partialUrl);
            },
            { timeout, timeoutMsg: `URL did not contain "${partialUrl}" after ${timeout}ms` },
        );
    }

    /**
     * Wait until the page title contains a specified substring.
     * Useful for verifying that the correct page has loaded.
     *
     * @param {string} partialTitle - The substring to look for in the page title (e.g., `'Dashboard'`, `'Login'`).
     * @param {number} [timeout=this.timeout] - Maximum time in milliseconds to wait.
     * @returns {Promise<void>}
     * @throws {Error} If the page title does not contain the specified substring within the timeout.
     * @example
     * await page.open('/settings');
     * await page.waitForTitleContains('Settings');
     */
    async waitForTitleContains(partialTitle, timeout = this.timeout) {
        await browser.waitUntil(
            async () => {
                const title = await browser.getTitle();
                return title.includes(partialTitle);
            },
            { timeout, timeoutMsg: `Title did not contain "${partialTitle}" after ${timeout}ms` },
        );
    }

    /**
     * Pause test execution for a fixed duration. **Use sparingly** — explicit waits
     * (e.g., {@link waitForDisplayed}, {@link waitForClickable}) are preferred as they
     * are more reliable and efficient. Logs a warning to encourage replacing with
     * explicit waits.
     *
     * @param {number} milliseconds - The number of milliseconds to pause.
     * @returns {Promise<void>}
     * @example
     * // Only use when absolutely necessary (e.g., waiting for an animation):
     * await page.pause(1000);
     */
    async pause(milliseconds) {
        this.logger.warn(`Hard pause: ${milliseconds}ms — consider using an explicit wait instead`);
        await browser.pause(milliseconds);
    }

    // ─── JavaScript Execution ─────────────────────────────────

    /**
     * Execute arbitrary synchronous JavaScript in the browser context.
     * The script runs in the context of the current page and has access to the DOM.
     * Arguments are serialized and passed to the script as `arguments[0]`, `arguments[1]`, etc.
     *
     * @param {string|Function} script - The JavaScript code to execute, as a string or function reference.
     * @param {...*} args - Arguments to pass to the script (elements, strings, numbers, etc.).
     * @returns {Promise<*>} Resolves to whatever the script returns.
     * @throws {Error} If the script execution fails (e.g., JavaScript syntax error, runtime exception).
     * @example
     * const scrollY = await page.executeScript('return window.scrollY;');
     *
     * // Pass an element as argument:
     * const el = await page.waitForExist(page.header);
     * const rect = await page.executeScript('return arguments[0].getBoundingClientRect();', el);
     */
    async executeScript(script, ...args) {
        return browser.execute(script, ...args);
    }

    /**
     * Execute asynchronous JavaScript in the browser context.
     * The script receives a callback as its last argument which must be called
     * to signal completion. Useful for operations involving callbacks, timers,
     * or other async browser APIs.
     *
     * @param {string|Function} script - The async JavaScript code to execute. Must call the
     *   injected callback (last argument) when done.
     * @param {...*} args - Arguments to pass to the script.
     * @returns {Promise<*>} Resolves to the value passed to the callback.
     * @throws {Error} If the script execution fails or the callback is never called (timeout).
     * @example
     * const result = await page.executeAsyncScript(
     *   'const callback = arguments[arguments.length - 1]; ' +
     *   'fetch("/api/status").then(r => r.json()).then(callback);'
     * );
     */
    async executeAsyncScript(script, ...args) {
        return browser.executeAsync(script, ...args);
    }

    /**
     * Click an element using JavaScript (`element.click()`) instead of the WebDriver
     * click protocol. Useful when the normal click is intercepted by an overlay element
     * or when the element is not in the clickable area of the viewport.
     * Waits for the element to exist in the DOM before clicking.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @returns {Promise<void>}
     * @throws {Error} If the element does not exist in the DOM within the default timeout.
     * @example
     * // Use when a normal click is intercepted:
     * await page.jsClick(page.hiddenSubmitButton);
     */
    async jsClick(element) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        this.logger.debug('Performing JS click');
        await browser.execute('arguments[0].click();', el);
    }

    /**
     * Scroll to the top of the page via JavaScript (`window.scrollTo(0, 0)`).
     *
     * @returns {Promise<void>}
     * @example
     * await page.scrollToTop();
     */
    async scrollToTop() {
        await browser.execute('window.scrollTo(0, 0);');
    }

    /**
     * Scroll to the bottom of the page via JavaScript
     * (`window.scrollTo(0, document.body.scrollHeight)`).
     *
     * @returns {Promise<void>}
     * @example
     * await page.scrollToBottom();
     * await page.waitForDisplayed(page.footerLoadMoreButton);
     */
    async scrollToBottom() {
        await browser.execute('window.scrollTo(0, document.body.scrollHeight);');
    }

    /**
     * Scroll the page by a specific pixel offset in both X and Y directions
     * via JavaScript (`window.scrollBy(x, y)`).
     *
     * @param {number} x - Horizontal scroll offset in pixels (positive = right, negative = left).
     * @param {number} y - Vertical scroll offset in pixels (positive = down, negative = up).
     * @returns {Promise<void>}
     * @example
     * await page.scrollByPixels(0, 500);   // scroll down 500px
     * await page.scrollByPixels(0, -200);  // scroll up 200px
     */
    async scrollByPixels(x, y) {
        await browser.execute(`window.scrollBy(${x}, ${y});`);
    }

    /**
     * Temporarily highlight an element on the page for debugging or visual verification.
     * Applies a red border and light-yellow background via inline style, then reverts
     * to the original style after the specified duration.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {number} [duration=2000] - Duration in milliseconds to keep the highlight visible before reverting.
     * @returns {Promise<void>}
     * @example
     * // Highlight an element for 3 seconds during debugging:
     * await page.highlightElement(page.submitButton, 3000);
     */
    async highlightElement(element, duration = 2000) {
        const el = await this._resolveElement(element);
        await browser.execute(
            `
            const el = arguments[0];
            const originalStyle = el.getAttribute('style');
            el.setAttribute('style', 'border: 3px solid red; background: lightyellow;');
            setTimeout(() => el.setAttribute('style', originalStyle || ''), arguments[1]);
        `,
            el,
            duration,
        );
    }

    // ─── Screenshots ─────────────────────────────────────────

    /**
     * Take a screenshot of the current browser viewport and save it to a PNG file.
     * The screenshot is saved to the `screenshots/` directory relative to the
     * current working directory.
     *
     * @param {string} fileName - The base file name (without extension) for the screenshot (e.g., `'login-page'`).
     * @returns {Promise<string>} Resolves to the absolute file path of the saved screenshot.
     * @throws {Error} If the screenshot cannot be saved (e.g., permission error, invalid path).
     * @example
     * const screenshotPath = await page.takeScreenshot('dashboard-loaded');
     * // Screenshot saved at: /project/screenshots/dashboard-loaded.png
     */
    async takeScreenshot(fileName) {
        const filePath = path.join(process.cwd(), 'screenshots', `${fileName}.png`);
        await browser.saveScreenshot(filePath);
        this.logger.info(`Screenshot saved: ${filePath}`);
        return filePath;
    }

    /**
     * Take a screenshot of a specific element and save it to a PNG file.
     * The screenshot is saved to the `screenshots/` directory relative to the
     * current working directory.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The target element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {string} fileName - The base file name (without extension) for the screenshot (e.g., `'error-tooltip'`).
     * @returns {Promise<string>} Resolves to the absolute file path of the saved screenshot.
     * @throws {Error} If the element cannot be found or the screenshot cannot be saved.
     * @example
     * const path = await page.takeElementScreenshot(page.chart, 'revenue-chart');
     */
    async takeElementScreenshot(element, fileName) {
        const el = await this._resolveElement(element);
        const filePath = path.join(process.cwd(), 'screenshots', `${fileName}.png`);
        await el.saveScreenshot(filePath);
        this.logger.info(`Element screenshot saved: ${filePath}`);
        return filePath;
    }

    // ─── Keyboard Actions ─────────────────────────────────────

    /**
     * Send a single keyboard key press to the browser.
     * Uses the WebDriver keyboard API to simulate pressing a key.
     * Supports special keys via the WebdriverIO key constants (e.g., `'Enter'`, `'Tab'`, `'Escape'`).
     *
     * @param {string} key - The key to press (e.g., `'Enter'`, `'Tab'`, `'Escape'`, `'a'`).
     * @returns {Promise<void>}
     * @example
     * await page.setValue(page.searchInput, 'test query');
     * await page.pressKey('Enter');
     */
    async pressKey(key) {
        await browser.keys(key);
    }

    /**
     * Send a sequence of keyboard key presses to the browser.
     * Supports key combinations by passing an array of keys (e.g., for Ctrl+A).
     * Uses the WebDriver keyboard API.
     *
     * @param {string[]} keys - An array of keys to press simultaneously or in sequence
     *   (e.g., `['Control', 'a']` for Select All, `['Shift', 'Tab']` for reverse tab).
     * @returns {Promise<void>}
     * @example
     * // Select all text in the active element:
     * await page.pressKeys(['Control', 'a']);
     *
     * // Copy selected text:
     * await page.pressKeys(['Control', 'c']);
     */
    async pressKeys(keys) {
        await browser.keys(keys);
    }

    // ─── Drag & Drop ─────────────────────────────────────────

    /**
     * Perform a drag-and-drop operation from a source element to a target element.
     * Both elements are resolved via {@link _resolveElement}. Uses the WebDriver
     * Actions API to simulate the drag gesture.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} source - The element to drag.
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} target - The element to drop onto.
     * @returns {Promise<void>}
     * @throws {Error} If either element cannot be resolved or the drag operation fails.
     * @example
     * await page.dragAndDrop(page.card, page.targetColumn);
     */
    async dragAndDrop(source, target) {
        const sourceEl = await this._resolveElement(source);
        const targetEl = await this._resolveElement(target);
        await sourceEl.dragAndDrop(targetEl);
    }

    // ─── File Upload ──────────────────────────────────────────

    /**
     * Upload a file to a file input element. First uploads the file to the remote
     * Selenium server (for grid/cloud setups) via `browser.uploadFile()`, then sets
     * the returned remote path as the input's value.
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The `<input type="file">` element, CSS/XPath selector, or a Promise resolving to an element.
     * @param {string} filePath - The absolute path to the local file to upload.
     * @returns {Promise<void>}
     * @throws {Error} If the file does not exist, the element is not a file input, or the upload fails.
     * @example
     * await page.uploadFile(page.avatarInput, '/path/to/photo.png');
     */
    async uploadFile(element, filePath) {
        const el = await this._resolveElement(element);
        const remotePath = await browser.uploadFile(filePath);
        await el.setValue(remotePath);
    }

    // ─── Internal Helpers ─────────────────────────────────────

    /**
     * Resolve an element: accepts a WebdriverIO element, a CSS/XPath selector string,
     * or a Promise that resolves to an element. If a string is passed, it is looked up
     * via the global `$()` selector.
     *
     * Sub-classes (`BasePage`, `MobileBasePage`) override this method
     * to add platform-specific resolution (Shadow DOM, Frames, etc.).
     *
     * @param {WebdriverIO.Element|string|Promise<WebdriverIO.Element>} element - The element to resolve.
     * @returns {Promise<WebdriverIO.Element>} The resolved WebdriverIO element.
     * @throws {Error} If the selector string does not match any element.
     * @access protected
     * @example
     * // Internal usage within a method:
     * const el = await this._resolveElement(element);
     */
    async _resolveElement(element) {
        if (typeof element !== 'string') {
            return element;
        }
        return $(element);
    }

    /**
     * Get a human-readable description of an element for logging purposes.
     * Attempts to identify the element by its `data-testid`, `id`, or `class` attributes.
     * Falls back to the tag name or `'unknown'` if no identifying attributes are found.
     *
     * @param {WebdriverIO.Element} element - The WebdriverIO element to describe.
     * @returns {Promise<string>} A human-readable string identifying the element
     *   (e.g., `'[data-testid="submit"]'`, `'button#login'`, `'div.container'`, `'unknown'`).
     * @access protected
     */
    async _getElementDescription(element) {
        try {
            const tagName = await element.getTagName();
            const id = await element.getAttribute('id');
            const className = await element.getAttribute('class');
            const testId = await element.getAttribute('data-testid');

            if (testId) return `[data-testid="${testId}"]`;
            if (id) return `${tagName}#${id}`;
            if (className) return `${tagName}.${className.split(' ')[0]}`;
            return tagName;
        } catch {
            return 'unknown';
        }
    }
}

module.exports = { AbstractBasePage };
