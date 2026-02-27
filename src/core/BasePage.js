/**
 * ═══════════════════════════════════════════════════════════════
 * BasePage - Foundation Page Object Class
 * ═══════════════════════════════════════════════════════════════
 *
 * Every page object in the framework inherits from this class.
 * Provides a comprehensive, battle-tested API for interacting
 * with web elements, handling waits, scrolling, frames, windows,
 * and much more — so individual page objects stay clean and focused.
 *
 * Usage:
 *   class LoginPage extends BasePage {
 *       get url() { return '/login'; }
 *       get username() { return $('[data-testid="username"]'); }
 *   }
 */

const { Logger } = require('../utils/Logger');
const { Timeouts } = require('../constants/Timeouts');
const { ShadowDomResolver } = require('./ShadowDomResolver');
const { FrameManager } = require('./FrameManager');

class BasePage {
    constructor() {
        this.logger = Logger.getInstance(`Page:${this.constructor.name}`);
        this.timeout = Timeouts.ELEMENT_WAIT;

        /** @type {ShadowDomResolver} */
        this.shadowDomResolver = new ShadowDomResolver();

        /** @type {FrameManager} */
        this.frameManager = new FrameManager();

        /**
         * When true, _resolveElement will automatically search shadow DOMs
         * and iframes if the element is not found in the regular DOM.
         * Set to false per-page to disable the overhead if not needed.
         */
        this.autoResolveShadowDom = true;
        this.autoResolveFrames = true;
    }

    // ─── Navigation ───────────────────────────────────────────

    /**
     * Open a URL path relative to the baseUrl defined in configuration.
     * Automatically waits for the page to finish loading.
     */
    async open(path = '') {
        const targetPath = path || this.url || '/';
        this.logger.info(`Navigating to: ${targetPath}`);
        await browser.url(targetPath);
        await this.waitForPageLoad();
        return this;
    }

    /**
     * Navigate to a fully qualified (absolute) URL.
     */
    async openAbsoluteUrl(absoluteUrl) {
        this.logger.info(`Navigating to absolute URL: ${absoluteUrl}`);
        await browser.url(absoluteUrl);
        await this.waitForPageLoad();
        return this;
    }

    /**
     * Reload the current page.
     */
    async refresh() {
        this.logger.info('Refreshing page');
        await browser.refresh();
        await this.waitForPageLoad();
        return this;
    }

    /**
     * Navigate back in browser history.
     */
    async goBack() {
        this.logger.info('Navigating back');
        await browser.back();
        await this.waitForPageLoad();
        return this;
    }

    /**
     * Navigate forward in browser history.
     */
    async goForward() {
        this.logger.info('Navigating forward');
        await browser.forward();
        await this.waitForPageLoad();
        return this;
    }

    // ─── Page State ───────────────────────────────────────────

    /**
     * Return the current page title.
     */
    async getPageTitle() {
        return browser.getTitle();
    }

    /**
     * Return the current full URL.
     */
    async getCurrentUrl() {
        return browser.getUrl();
    }

    /**
     * Return the full page source.
     */
    async getPageSource() {
        return browser.getPageSource();
    }

    // ─── Element Interaction ──────────────────────────────────

    /**
     * Click an element after ensuring it is clickable.
     */
    async click(element) {
        const el = await this._resolveElement(element);
        await this.waitForClickable(el);
        this.logger.debug(`Clicking element: ${await this._getElementDescription(el)}`);
        await el.click();
    }

    /**
     * Double-click an element.
     */
    async doubleClick(element) {
        const el = await this._resolveElement(element);
        await this.waitForClickable(el);
        this.logger.debug(`Double-clicking element: ${await this._getElementDescription(el)}`);
        await el.doubleClick();
    }

    /**
     * Right-click (context menu) an element.
     */
    async rightClick(element) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.click({ button: 'right' });
    }

    /**
     * Clear the current value and type new text into an input field.
     */
    async setValue(element, value) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        this.logger.debug(`Setting value on element: ${await this._getElementDescription(el)}`);
        await el.clearValue();
        await el.setValue(value);
    }

    /**
     * Append text to the current value without clearing first.
     */
    async addValue(element, value) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.addValue(value);
    }

    /**
     * Clear an input field.
     */
    async clearValue(element) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.clearValue();
    }

    /**
     * Retrieve the visible text of an element.
     */
    async getText(element) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        return el.getText();
    }

    /**
     * Retrieve the value attribute of an input element.
     */
    async getValue(element) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        return el.getValue();
    }

    /**
     * Retrieve any attribute of an element.
     */
    async getAttribute(element, attributeName) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        return el.getAttribute(attributeName);
    }

    /**
     * Retrieve a CSS property value.
     */
    async getCssProperty(element, propertyName) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        const cssProperty = await el.getCSSProperty(propertyName);
        return cssProperty.value;
    }

    /**
     * Check if an element is currently displayed in the viewport.
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
     * Check if an element exists in the DOM (may or may not be visible).
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
     * Check if an element is enabled (not disabled).
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
     * Check if a checkbox / radio element is selected.
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
     * Hover over (move mouse to) an element.
     */
    async hover(element) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        this.logger.debug(`Hovering element: ${await this._getElementDescription(el)}`);
        await el.moveTo();
    }

    /**
     * Scroll an element into the visible viewport area.
     */
    async scrollIntoView(element, options = true) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        await el.scrollIntoView(options);
    }

    // ─── Dropdown / Select ────────────────────────────────────

    /**
     * Select a <select> dropdown option by its visible text.
     */
    async selectByVisibleText(element, text) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        this.logger.debug(`Selecting "${text}" by text`);
        await el.selectByVisibleText(text);
    }

    /**
     * Select a <select> dropdown option by the value attribute.
     */
    async selectByValue(element, value) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.selectByAttribute('value', value);
    }

    /**
     * Select a <select> dropdown option by zero-based index.
     */
    async selectByIndex(element, index) {
        const el = await this._resolveElement(element);
        await this.waitForDisplayed(el);
        await el.selectByIndex(index);
    }

    // ─── Frames & Windows ─────────────────────────────────────

    /**
     * Switch into an iframe by element, index, or name/ID.
     */
    async switchToFrame(frameReference) {
        this.logger.debug('Switching to frame');
        const el = await this._resolveElement(frameReference);
        await browser.switchToFrame(el);
    }

    /**
     * Switch back to the top-level (default) content.
     */
    async switchToParentFrame() {
        this.logger.debug('Switching to parent frame');
        await browser.switchToParentFrame();
    }

    /**
     * Switch back to the main document from any nested frame.
     */
    async switchToDefaultContent() {
        await browser.switchToFrame(null);
    }

    /**
     * Switch to a specific browser window or tab by handle.
     */
    async switchToWindow(handle) {
        this.logger.debug(`Switching to window: ${handle}`);
        await browser.switchToWindow(handle);
    }

    /**
     * Switch to a newly opened window/tab (the latest handle
     * that wasn't the original).
     */
    async switchToNewWindow() {
        const handles = await browser.getWindowHandles();
        const lastHandle = handles[handles.length - 1];
        this.logger.debug(`Switching to new window: ${lastHandle}`);
        await browser.switchToWindow(lastHandle);
    }

    /**
     * Close the current window/tab and switch back to the first remaining one.
     */
    async closeCurrentWindow() {
        await browser.closeWindow();
        const handles = await browser.getWindowHandles();
        if (handles.length > 0) {
            await browser.switchToWindow(handles[0]);
        }
    }

    /**
     * Return the total number of open windows/tabs.
     */
    async getWindowCount() {
        const handles = await browser.getWindowHandles();
        return handles.length;
    }

    // ─── Alerts / Dialogs ─────────────────────────────────────

    async acceptAlert() {
        await browser.acceptAlert();
    }

    async dismissAlert() {
        await browser.dismissAlert();
    }

    async getAlertText() {
        return browser.getAlertText();
    }

    async sendAlertText(text) {
        await browser.sendAlertText(text);
    }

    // ─── Wait Helpers ─────────────────────────────────────────

    /**
     * Wait for an element to be displayed.
     */
    async waitForDisplayed(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForDisplayed({ timeout, timeoutMsg: `Element not displayed after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to exist in the DOM.
     */
    async waitForExist(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForExist({ timeout, timeoutMsg: `Element does not exist after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to be clickable (displayed + enabled).
     */
    async waitForClickable(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForClickable({ timeout, timeoutMsg: `Element not clickable after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to become enabled.
     */
    async waitForEnabled(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForEnabled({ timeout, timeoutMsg: `Element not enabled after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to disappear (not displayed).
     */
    async waitForNotDisplayed(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForDisplayed({ timeout, reverse: true, timeoutMsg: `Element still displayed after ${timeout}ms` });
        return el;
    }

    /**
     * Wait for an element to no longer exist in the DOM.
     */
    async waitForNotExist(element, timeout = this.timeout) {
        const el = await this._resolveElement(element);
        await el.waitForExist({ timeout, reverse: true, timeoutMsg: `Element still exists after ${timeout}ms` });
        return el;
    }

    /**
     * Wait until a custom condition (function) returns truthy.
     */
    async waitUntil(conditionFn, timeout = this.timeout, timeoutMsg = 'Condition not met') {
        await browser.waitUntil(conditionFn, { timeout, timeoutMsg });
    }

    /**
     * Wait for the page document.readyState to be 'complete'.
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
     * Wait until the page URL contains a given substring.
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
     * Wait until the page title contains a given substring.
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
     * Pause execution for a fixed time (use sparingly — explicit waits are preferred).
     */
    async pause(milliseconds) {
        this.logger.warn(`Hard pause: ${milliseconds}ms — consider using an explicit wait instead`);
        await browser.pause(milliseconds);
    }

    // ─── JavaScript Execution ─────────────────────────────────

    /**
     * Execute arbitrary JavaScript in the browser context.
     */
    async executeScript(script, ...args) {
        return browser.execute(script, ...args);
    }

    /**
     * Execute async JavaScript in the browser context.
     */
    async executeAsyncScript(script, ...args) {
        return browser.executeAsync(script, ...args);
    }

    /**
     * Click an element via JavaScript (useful when the normal click is intercepted).
     */
    async jsClick(element) {
        const el = await this._resolveElement(element);
        await this.waitForExist(el);
        this.logger.debug('Performing JS click');
        await browser.execute('arguments[0].click();', el);
    }

    /**
     * Scroll to the top of the page via JavaScript.
     */
    async scrollToTop() {
        await browser.execute('window.scrollTo(0, 0);');
    }

    /**
     * Scroll to the bottom of the page via JavaScript.
     */
    async scrollToBottom() {
        await browser.execute('window.scrollTo(0, document.body.scrollHeight);');
    }

    /**
     * Scroll by a specific pixel offset.
     */
    async scrollByPixels(x, y) {
        await browser.execute(`window.scrollBy(${x}, ${y});`);
    }

    /**
     * Highlight an element (for debugging / visual confirmation).
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

    // ─── Cookies & Storage ────────────────────────────────────

    async getCookie(name) {
        const cookies = await browser.getCookies([name]);
        return cookies.length > 0 ? cookies[0] : null;
    }

    async getAllCookies() {
        return browser.getCookies();
    }

    async setCookie(cookieObj) {
        await browser.setCookies(cookieObj);
    }

    async deleteCookie(name) {
        await browser.deleteCookies([name]);
    }

    async deleteAllCookies() {
        await browser.deleteCookies();
    }

    async setLocalStorage(key, value) {
        await browser.execute(
            (k, v) => localStorage.setItem(k, v),
            key, typeof value === 'string' ? value : JSON.stringify(value),
        );
    }

    async getLocalStorage(key) {
        return browser.execute((k) => localStorage.getItem(k), key);
    }

    async clearLocalStorage() {
        await browser.execute(() => localStorage.clear());
    }

    async setSessionStorage(key, value) {
        await browser.execute(
            (k, v) => sessionStorage.setItem(k, v),
            key, typeof value === 'string' ? value : JSON.stringify(value),
        );
    }

    async getSessionStorage(key) {
        return browser.execute((k) => sessionStorage.getItem(k), key);
    }

    // ─── Screenshots ─────────────────────────────────────────

    /**
     * Take a screenshot of the current viewport and save to a file.
     */
    async takeScreenshot(fileName) {
        const path = require('path');
        const filePath = path.join(process.cwd(), 'screenshots', `${fileName}.png`);
        await browser.saveScreenshot(filePath);
        this.logger.info(`Screenshot saved: ${filePath}`);
        return filePath;
    }

    /**
     * Take a screenshot of a specific element and save to a file.
     */
    async takeElementScreenshot(element, fileName) {
        const path = require('path');
        const el = await this._resolveElement(element);
        const filePath = path.join(process.cwd(), 'screenshots', `${fileName}.png`);
        await el.saveScreenshot(filePath);
        this.logger.info(`Element screenshot saved: ${filePath}`);
        return filePath;
    }

    // ─── Keyboard Actions ─────────────────────────────────────

    async pressKey(key) {
        await browser.keys(key);
    }

    async pressKeys(keys) {
        await browser.keys(keys);
    }

    // ─── Drag & Drop ─────────────────────────────────────────

    async dragAndDrop(source, target) {
        const sourceEl = await this._resolveElement(source);
        const targetEl = await this._resolveElement(target);
        await sourceEl.dragAndDrop(targetEl);
    }

    // ─── File Upload ──────────────────────────────────────────

    async uploadFile(element, filePath) {
        const el = await this._resolveElement(element);
        const remotePath = await browser.uploadFile(filePath);
        await el.setValue(remotePath);
    }

    // ─── Internal Helpers ─────────────────────────────────────

    /**
     * Resolve an element: accepts a WDIO element, a selector string,
     * or a promise that resolves to an element.
     *
     * Resolution order:
     *   1. If already a WDIO element / promise — return as-is
     *   2. If selector contains `>>>` — use ShadowDomResolver deep selector
     *   3. Standard `$(selector)` in the current context
     *   4. (auto) If not found & autoResolveShadowDom — deep-search all shadow roots
     *   5. (auto) If not found & autoResolveFrames  — search all iframes
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
                // Only switch back to default content if the element was NOT found
                // (if found, we must stay in the frame for the element reference to remain valid)
                if (frameElement) {
                    return frameElement;
                }
                try { await browser.switchToFrame(null); } catch { /* already in default */ }
            }
        }

        // Return the cached element (will fail naturally on interaction — expected behaviour)
        return el;
    }

    /**
     * Get a human-readable description of an element for logging.
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

module.exports = { BasePage };
