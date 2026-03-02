/**
 * ═══════════════════════════════════════════════════════════════════════
 * BasePage — Web / Browser Page Object (@wdio-framework/ui)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Extends AbstractBasePage (core) with web-browser-specific features:
 *   • Shadow DOM auto-resolution via ShadowDomResolver
 *   • Frame/iframe auto-resolution via FrameManager
 *   • <select> dropdown interactions
 *   • Frame & window/tab management
 *   • Alert/dialog handling
 *   • Cookie & Web Storage management
 *
 * Application page objects for web testing should extend this class:
 *   const { BasePage } = require('@wdio-framework/ui');
 *   class LoginPage extends BasePage { … }
 * ═══════════════════════════════════════════════════════════════════════
 */

const { AbstractBasePage, Logger, Timeouts } = require('@wdio-framework/core');
const { ShadowDomResolver } = require('./ShadowDomResolver');
const { FrameManager } = require('./FrameManager');

/**
 * @class BasePage
 * @extends AbstractBasePage
 * @description Web/browser-specific page object base class. Provides convenience methods for
 * interacting with `<select>` dropdowns, managing frames and windows/tabs, handling browser
 * alerts and dialogs, and managing cookies and Web Storage (localStorage / sessionStorage).
 * Additionally supports automatic element resolution across Shadow DOM boundaries and iframes
 * via {@link ShadowDomResolver} and {@link FrameManager}.
 *
 * All application page objects for browser-based tests should extend this class rather than
 * `AbstractBasePage` directly.
 *
 * @example
 * const { BasePage } = require('@wdio-framework/ui');
 *
 * class ProductPage extends BasePage {
 *   get sortDropdown() { return $('[data-testid="sort"]'); }
 *   get productFrame() { return $('iframe#product-details'); }
 *
 *   async sortBy(option) {
 *     await this.selectByVisibleText(this.sortDropdown, option);
 *   }
 *
 *   async getProductDetail() {
 *     await this.switchToFrame(this.productFrame);
 *     const detail = await $('[data-testid="detail"]').getText();
 *     await this.switchToDefaultContent();
 *     return detail;
 *   }
 * }
 */
class BasePage extends AbstractBasePage {
    constructor() {
        super();

        /** @type {ShadowDomResolver} */
        this.shadowDomResolver = new ShadowDomResolver();

        /** @type {FrameManager} */
        this.frameManager = new FrameManager();

        /**
         * When true, _resolveElement will automatically search shadow DOMs
         * and iframes if the element is not found in the regular DOM.
         * Set to true per-page to enable the overhead only where needed.
         */
        this.autoResolveShadowDom = false;
        this.autoResolveFrames = false;
    }

    // ─── Dropdown / Select ────────────────────────────────────

    /**
     * Select a `<select>` dropdown option by its visible (displayed) text.
     *
     * Resolves the element, waits until it is displayed, and then selects
     * the `<option>` whose visible text matches the provided string.
     *
     * @param {WebdriverIO.Element|string} element - A WebdriverIO element reference or CSS/XPath selector string pointing to a `<select>` element.
     * @param {string} text - The exact visible text of the `<option>` to select.
     * @returns {Promise<void>} Resolves when the option has been selected.
     * @throws {Error} Throws if the element cannot be found, is not displayed within the configured timeout, or no option matches the provided text.
     * @example
     * // Using a getter that returns a WebdriverIO element
     * await page.selectByVisibleText(page.sortDropdown, 'Price: Low to High');
     *
     * // Using a CSS selector string
     * await page.selectByVisibleText('#country-select', 'United States');
     */
    async selectByVisibleText(element, text) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        this.logger.debug(`Selecting "${text}" by text`);
        await el.selectByVisibleText(text);
    }

    /**
     * Select a `<select>` dropdown option by its `value` attribute.
     *
     * Resolves the element, waits until it is displayed, and then selects
     * the `<option>` whose `value` attribute matches the provided string.
     *
     * @param {WebdriverIO.Element|string} element - A WebdriverIO element reference or CSS/XPath selector string pointing to a `<select>` element.
     * @param {string} value - The value of the `value` attribute on the target `<option>`.
     * @returns {Promise<void>} Resolves when the option has been selected.
     * @throws {Error} Throws if the element cannot be found, is not displayed within the configured timeout, or no option has a matching `value` attribute.
     * @example
     * // Select the option with value="usd"
     * await page.selectByValue(page.currencyDropdown, 'usd');
     *
     * // Using a selector string
     * await page.selectByValue('select[name="currency"]', 'eur');
     */
    async selectByValue(element, value) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.selectByAttribute('value', value);
    }

    /**
     * Select a `<select>` dropdown option by its zero-based index.
     *
     * Resolves the element, waits until it is displayed, and then selects
     * the `<option>` at the specified index position within the dropdown.
     *
     * @param {WebdriverIO.Element|string} element - A WebdriverIO element reference or CSS/XPath selector string pointing to a `<select>` element.
     * @param {number} index - The zero-based index of the `<option>` to select.
     * @returns {Promise<void>} Resolves when the option has been selected.
     * @throws {Error} Throws if the element cannot be found, is not displayed, or the index is out of bounds.
     * @example
     * // Select the third option (index 2)
     * await page.selectByIndex(page.sizeDropdown, 2);
     */
    async selectByIndex(element, index) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.selectByIndex(index);
    }

    // ─── Frames & Windows ─────────────────────────────────────

    /**
     * Switch the browser context into an iframe.
     *
     * Accepts a WebdriverIO element, a CSS/XPath selector string pointing to the
     * `<iframe>` or `<frame>`, or a numeric index. Once switched, all subsequent
     * commands interact with the frame's document until {@link switchToParentFrame}
     * or {@link switchToDefaultContent} is called.
     *
     * @param {WebdriverIO.Element|string|number} frameReference - An element reference, selector string, or zero-based frame index.
     * @returns {Promise<void>} Resolves once the browser context has switched to the frame.
     * @throws {Error} Throws if the frame cannot be found or is not present in the DOM.
     * @example
     * // Switch using an element getter
     * await page.switchToFrame(page.paymentIframe);
     * await page.click(page.submitButton);
     * await page.switchToDefaultContent();
     *
     * // Switch using a selector string
     * await page.switchToFrame('#embedded-form');
     */
    async switchToFrame(frameReference) {
        this.logger.debug('Switching to frame');
        const el = await this._resolveElement(frameReference);
        await browser.switchToFrame(el);
    }

    /**
     * Switch the browser context back to the parent frame.
     *
     * If the browser is currently inside a nested iframe, this moves one level
     * up in the frame hierarchy. To go directly to the top-level document, use
     * {@link switchToDefaultContent} instead.
     *
     * @returns {Promise<void>} Resolves once the browser context has switched to the parent frame.
     * @example
     * await page.switchToFrame(page.outerFrame);
     * await page.switchToFrame(page.innerFrame);
     * // now inside innerFrame — go up one level
     * await page.switchToParentFrame();
     */
    async switchToParentFrame() {
        this.logger.debug('Switching to parent frame');
        await browser.switchToParentFrame();
    }

    /**
     * Switch the browser context back to the main (top-level) document.
     *
     * Regardless of how deeply nested the current frame context is, this will
     * return directly to the root document. Equivalent to `browser.switchToFrame(null)`.
     *
     * @returns {Promise<void>} Resolves once the browser context has returned to the default content.
     * @example
     * await page.switchToFrame(page.paymentIframe);
     * await page.click(page.submitButton);
     * // Return to the main page
     * await page.switchToDefaultContent();
     */
    async switchToDefaultContent() {
        await browser.switchToFrame(null);
    }

    /**
     * Switch to a specific browser window or tab by its window handle.
     *
     * A window handle is a unique identifier assigned by the browser to each
     * window or tab. Use {@link getWindowCount} or `browser.getWindowHandles()`
     * to discover available handles.
     *
     * @param {string} handle - The unique window handle string identifying the target window/tab.
     * @returns {Promise<void>} Resolves once the browser context has switched to the specified window.
     * @throws {Error} Throws if the handle does not refer to an open window.
     * @example
     * const handles = await browser.getWindowHandles();
     * await page.switchToWindow(handles[1]);
     */
    async switchToWindow(handle) {
        this.logger.debug(`Switching to window: ${handle}`);
        await browser.switchToWindow(handle);
    }

    /**
     * Switch to the most recently opened browser window or tab.
     *
     * Retrieves all current window handles and switches to the last one in
     * the list, which is typically the window/tab that was opened most recently.
     * This is useful immediately after an action that opens a new tab or popup.
     *
     * @returns {Promise<void>} Resolves once the browser context has switched to the newest window/tab.
     * @throws {Error} Throws if no window handles are available.
     * @example
     * await page.click(page.openInNewTabLink);
     * await page.switchToNewWindow();
     * // Now interacting with the newly opened tab
     * const title = await browser.getTitle();
     */
    async switchToNewWindow() {
        const handles = await browser.getWindowHandles();
        const lastHandle = handles[handles.length - 1];
        this.logger.debug(`Switching to new window: ${lastHandle}`);
        await browser.switchToWindow(lastHandle);
    }

    /**
     * Close the current browser window or tab and switch to the first remaining one.
     *
     * After closing the active window, the method retrieves the remaining handles
     * and switches to `handles[0]` (typically the original/main window). If no
     * windows remain, no switch is attempted.
     *
     * @returns {Promise<void>} Resolves after closing the window and switching to the remaining one.
     * @throws {Error} Throws if the current window cannot be closed (e.g., it is the last window in some drivers).
     * @example
     * await page.switchToNewWindow();
     * // Inspect the popup content, then close it
     * await page.closeCurrentWindow();
     * // Back on the original tab
     */
    async closeCurrentWindow() {
        await browser.closeWindow();
        const handles = await browser.getWindowHandles();
        if (handles.length > 0) {
            await browser.switchToWindow(handles[0]);
        }
    }

    /**
     * Return the total number of currently open browser windows and tabs.
     *
     * @returns {Promise<number>} The count of open windows/tabs.
     * @example
     * await page.click(page.openPopupButton);
     * const count = await page.getWindowCount();
     * console.log(`Open windows: ${count}`); // e.g. 2
     */
    async getWindowCount() {
        const handles = await browser.getWindowHandles();
        return handles.length;
    }

    // ─── Alerts / Dialogs ─────────────────────────────────────

    /**
     * Accept (click OK on) the currently active browser alert, confirm, or prompt dialog.
     *
     * @returns {Promise<void>} Resolves after the alert has been accepted.
     * @throws {Error} Throws if no alert is currently present.
     * @example
     * await page.click(page.deleteButton);
     * await page.acceptAlert(); // confirms the "Are you sure?" dialog
     */
    async acceptAlert() {
        await browser.acceptAlert();
    }

    /**
     * Dismiss (click Cancel on) the currently active browser alert, confirm, or prompt dialog.
     *
     * @returns {Promise<void>} Resolves after the alert has been dismissed.
     * @throws {Error} Throws if no alert is currently present.
     * @example
     * await page.click(page.deleteButton);
     * await page.dismissAlert(); // cancels the "Are you sure?" dialog
     */
    async dismissAlert() {
        await browser.dismissAlert();
    }

    /**
     * Retrieve the text displayed in the currently active browser alert, confirm, or prompt dialog.
     *
     * @returns {Promise<string>} The text content of the alert dialog.
     * @throws {Error} Throws if no alert is currently present.
     * @example
     * await page.click(page.warningButton);
     * const alertMessage = await page.getAlertText();
     * expect(alertMessage).toContain('Are you sure');
     * await page.acceptAlert();
     */
    async getAlertText() {
        return browser.getAlertText();
    }

    /**
     * Type text into a currently active browser prompt dialog's input field.
     *
     * This is used with `window.prompt()` dialogs that have an input field.
     * After sending text you typically call {@link acceptAlert} to confirm.
     *
     * @param {string} text - The text to type into the prompt dialog.
     * @returns {Promise<void>} Resolves after the text has been sent to the prompt.
     * @throws {Error} Throws if no prompt dialog is currently present.
     * @example
     * await page.click(page.renameButton);
     * await page.sendAlertText('New Folder Name');
     * await page.acceptAlert();
     */
    async sendAlertText(text) {
        await browser.sendAlertText(text);
    }

    // ─── Cookies & Storage ────────────────────────────────────

    /**
     * Retrieve a specific browser cookie by name.
     *
     * @param {string} name - The name of the cookie to retrieve.
     * @returns {Promise<WebdriverIO.Cookie|null>} The cookie object if found, or `null` if no cookie with that name exists.
     * @example
     * const token = await page.getCookie('auth_token');
     * if (token) {
     *   console.log(`Auth token value: ${token.value}`);
     * }
     */
    async getCookie(name) {
        const cookies = await browser.getCookies([name]);
        return cookies.length > 0 ? cookies[0] : null;
    }

    /**
     * Retrieve all browser cookies for the current domain.
     *
     * @returns {Promise<WebdriverIO.Cookie[]>} An array of all cookie objects.
     * @example
     * const cookies = await page.getAllCookies();
     * console.log(`Total cookies: ${cookies.length}`);
     */
    async getAllCookies() {
        return browser.getCookies();
    }

    /**
     * Set a browser cookie.
     *
     * The cookie object must include at least `name` and `value` properties.
     * Additional properties such as `domain`, `path`, `secure`, `httpOnly`,
     * `expiry`, and `sameSite` are optional.
     *
     * @param {WebdriverIO.Cookie} cookieObj - The cookie object to set.
     * @returns {Promise<void>} Resolves after the cookie has been set.
     * @throws {Error} Throws if the cookie object is invalid or the browser rejects it.
     * @example
     * await page.setCookie({
     *   name: 'session_id',
     *   value: 'abc123',
     *   path: '/',
     *   secure: true,
     * });
     */
    async setCookie(cookieObj) {
        await browser.setCookies(cookieObj);
    }

    /**
     * Delete a specific browser cookie by name.
     *
     * @param {string} name - The name of the cookie to delete.
     * @returns {Promise<void>} Resolves after the cookie has been deleted.
     * @example
     * await page.deleteCookie('tracking_id');
     */
    async deleteCookie(name) {
        await browser.deleteCookies([name]);
    }

    /**
     * Delete all browser cookies for the current domain.
     *
     * @returns {Promise<void>} Resolves after all cookies have been deleted.
     * @example
     * await page.deleteAllCookies();
     */
    async deleteAllCookies() {
        await browser.deleteCookies();
    }

    /**
     * Set a value in the browser's `localStorage`.
     *
     * If the value is not a string it will be serialized to JSON before storing.
     *
     * @param {string} key - The localStorage key.
     * @param {string|*} value - The value to store. Non-string values are JSON-stringified.
     * @returns {Promise<void>} Resolves after the value has been stored.
     * @example
     * await page.setLocalStorage('theme', 'dark');
     * await page.setLocalStorage('preferences', { lang: 'en', pageSize: 25 });
     */
    async setLocalStorage(key, value) {
        await browser.execute(
            (k, v) => localStorage.setItem(k, v),
            key, typeof value === 'string' ? value : JSON.stringify(value),
        );
    }

    /**
     * Retrieve a value from the browser's `localStorage`.
     *
     * @param {string} key - The localStorage key to look up.
     * @returns {Promise<string|null>} The stored value as a string, or `null` if the key does not exist.
     * @example
     * const theme = await page.getLocalStorage('theme');
     * console.log(theme); // 'dark'
     */
    async getLocalStorage(key) {
        return browser.execute((k) => localStorage.getItem(k), key);
    }

    /**
     * Clear all entries from the browser's `localStorage`.
     *
     * @returns {Promise<void>} Resolves after localStorage has been cleared.
     * @example
     * await page.clearLocalStorage();
     */
    async clearLocalStorage() {
        await browser.execute(() => localStorage.clear());
    }

    /**
     * Set a value in the browser's `sessionStorage`.
     *
     * If the value is not a string it will be serialized to JSON before storing.
     *
     * @param {string} key - The sessionStorage key.
     * @param {string|*} value - The value to store. Non-string values are JSON-stringified.
     * @returns {Promise<void>} Resolves after the value has been stored.
     * @example
     * await page.setSessionStorage('wizardStep', '3');
     * await page.setSessionStorage('formData', { name: 'John', email: 'john@example.com' });
     */
    async setSessionStorage(key, value) {
        await browser.execute(
            (k, v) => sessionStorage.setItem(k, v),
            key, typeof value === 'string' ? value : JSON.stringify(value),
        );
    }

    /**
     * Retrieve a value from the browser's `sessionStorage`.
     *
     * @param {string} key - The sessionStorage key to look up.
     * @returns {Promise<string|null>} The stored value as a string, or `null` if the key does not exist.
     * @example
     * const step = await page.getSessionStorage('wizardStep');
     * console.log(step); // '3'
     */
    async getSessionStorage(key) {
        return browser.execute((k) => sessionStorage.getItem(k), key);
    }

    // ─── Internal Helpers (override) ──────────────────────────

    /**
     * Enhanced element resolution with Shadow DOM and Frame fallbacks.
     *
     * Resolution order:
     *   1. If already a WDIO element / promise — return as-is
     *   2. If selector contains `>>>` — use ShadowDomResolver deep selector
     *   3. Standard `$(selector)` in the current context
     *   4. (auto) If not found & `autoResolveShadowDom` is `true` — deep-search all shadow roots
     *   5. (auto) If not found & `autoResolveFrames` is `true` — search all iframes
     *
     * @param {WebdriverIO.Element|string} element - A WebdriverIO element, a CSS/XPath selector string, or a deep shadow selector (containing `>>>`).
     * @returns {Promise<WebdriverIO.Element>} The resolved WebdriverIO element ready for interaction.
     * @throws {Error} Throws if all resolution strategies fail and the element reference is stale or invalid.
     * @example
     * // Typically called internally by other BasePage methods:
     * const el = await this._resolveElement('#submit-btn');
     * await el.click();
     *
     * // Deep shadow DOM selector
     * const el = await this._resolveElement('my-component >>> .inner-button');
     */
    async _resolveElement(element) {
        if (typeof element !== 'string') {
            return element;
        }

        // ── Deep shadow selector (explicit `>>>`) ──
        if (this.shadowDomResolver.isDeepSelector(element)) {
            this.logger.debug(`Resolving deep shadow selector: ${element}`);
            return this.shadowDomResolver.findInShadowDom(element, this.timeout);
        }

        // ── Standard resolution (cache result to avoid double query) ──
        const el = await $(element);
        const exists = await el.isExisting().catch(() => false);
        if (exists) {
            return el;
        }

        // ── Auto Shadow DOM fallback ──
        if (this.autoResolveShadowDom) {
            const hasShadow = await this.shadowDomResolver.hasShadowDom().catch(() => false);
            if (hasShadow) {
                this.logger.debug(`Element "${element}" not in DOM — trying shadow roots`);
                const shadowEl = await this.shadowDomResolver.deepFindElement(element, this.timeout).catch(() => null);
                if (shadowEl) return shadowEl;
            }
        }

        // ── Auto Frame fallback ──
        if (this.autoResolveFrames) {
            const frameCount = await this.frameManager.getFrameCount().catch(() => 0);
            if (frameCount > 0) {
                this.logger.debug(`Element "${element}" not in DOM — trying ${frameCount} frame(s)`);
                let frameElement = null;
                try {
                    const result = await this.frameManager.findElementAcrossFrames(element, this.timeout);
                    if (result && result.element) frameElement = result.element;
                } catch {
                    // Frame search failed
                }
                if (frameElement) {
                    return frameElement;
                }
                try { await browser.switchToFrame(null); } catch { /* already in default */ }
            }
        }

        // Return the cached element (will fail naturally on interaction)
        return el;
    }
}

module.exports = { BasePage };
