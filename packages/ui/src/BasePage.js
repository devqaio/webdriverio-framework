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

    // ─── Internal Helpers (override) ──────────────────────────

    /**
     * Enhanced element resolution with Shadow DOM and Frame fallbacks.
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
