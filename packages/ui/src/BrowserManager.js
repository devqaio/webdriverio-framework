/**
 * ═══════════════════════════════════════════════════════════════
 * BrowserManager - Advanced Browser Management
 * ═══════════════════════════════════════════════════════════════
 *
 * Centralises browser-level operations: window sizing, tab
 * management, network conditions, performance metrics, and
 * session management.  Use this from hooks or directly in tests
 * when you need browser-wide capabilities.
 */

const { Logger, PerformanceTracker } = require('@wdio-framework/core');

/**
 * @class BrowserManager
 * @description Singleton class that centralises advanced browser-level operations.
 * Provides methods for window/tab management (resize, maximise, full-screen, open/close),
 * browser capability introspection, performance metric collection, network condition
 * simulation, and cleanup routines.
 *
 * Use the static {@link BrowserManager.getInstance} method to obtain the shared instance.
 *
 * @example
 * const { BrowserManager } = require('@wdio-framework/ui');
 *
 * const mgr = BrowserManager.getInstance();
 * await mgr.maximizeWindow();
 * await mgr.openNewTab('https://example.com');
 * console.log(await mgr.getAllWindowHandles());
 * await mgr.closeAllTabsExceptMain();
 */
class BrowserManager {
    constructor() {
        this.logger = Logger.getInstance('BrowserManager');
    }

    // ─── Window Management ────────────────────────────────────

    /**
     * Maximize the current browser window to fill the screen.
     *
     * @returns {Promise<void>} Resolves after the window has been maximized.
     * @example
     * const mgr = BrowserManager.getInstance();
     * await mgr.maximizeWindow();
     */
    async maximizeWindow() {
        this.logger.info('Maximizing browser window');
        await browser.maximizeWindow();
    }

    /**
     * Set the browser window to an exact pixel width and height.
     *
     * @param {number} width - The desired window width in pixels.
     * @param {number} height - The desired window height in pixels.
     * @returns {Promise<void>} Resolves after the window has been resized.
     * @example
     * // Set a common desktop viewport size
     * await mgr.setWindowSize(1920, 1080);
     *
     * // Set a tablet viewport size
     * await mgr.setWindowSize(768, 1024);
     */
    async setWindowSize(width, height) {
        this.logger.info(`Setting window size: ${width}x${height}`);
        await browser.setWindowSize(width, height);
    }

    /**
     * Get the current browser window size.
     *
     * @returns {Promise<{width: number, height: number}>} An object containing the `width` and `height` of the window in pixels.
     * @example
     * const { width, height } = await mgr.getWindowSize();
     * console.log(`Window is ${width}x${height}`);
     */
    async getWindowSize() {
        return browser.getWindowSize();
    }

    /**
     * Set the browser window to full-screen mode (F11 equivalent).
     *
     * @returns {Promise<void>} Resolves after the window has entered full-screen mode.
     * @example
     * await mgr.fullScreenWindow();
     */
    async fullScreenWindow() {
        await browser.fullscreenWindow();
    }

    /**
     * Minimize the current browser window.
     *
     * @returns {Promise<void>} Resolves after the window has been minimized.
     * @example
     * await mgr.minimizeWindow();
     */
    async minimizeWindow() {
        await browser.minimizeWindow();
    }

    // ─── Tab / Window Handle Management ───────────────────────

    /**
     * Get the handle of the currently focused browser window or tab.
     *
     * @returns {Promise<string>} The unique window handle string for the current window.
     * @example
     * const mainHandle = await mgr.getCurrentWindowHandle();
     * console.log(`Current window handle: ${mainHandle}`);
     */
    async getCurrentWindowHandle() {
        return browser.getWindowHandle();
    }

    /**
     * Get handles for all open browser windows and tabs.
     *
     * @returns {Promise<string[]>} An array of unique window handle strings.
     * @example
     * const handles = await mgr.getAllWindowHandles();
     * console.log(`Open windows: ${handles.length}`);
     */
    async getAllWindowHandles() {
        return browser.getWindowHandles();
    }

    /**
     * Open a new browser tab and navigate it to the specified URL.
     *
     * The browser focus switches to the newly opened tab automatically.
     *
     * @param {string} url - The URL to open in the new tab.
     * @returns {Promise<void>} Resolves after the new tab has been opened and navigated to the URL.
     * @example
     * await mgr.openNewTab('https://example.com/dashboard');
     */
    async openNewTab(url) {
        await browser.newWindow(url, { windowName: '', type: 'tab' });
    }

    /**
     * Open a new browser window (not a tab) and navigate it to the specified URL.
     *
     * The browser focus switches to the newly opened window automatically.
     *
     * @param {string} url - The URL to open in the new window.
     * @returns {Promise<void>} Resolves after the new window has been opened and navigated to the URL.
     * @example
     * await mgr.openNewWindow('https://example.com/report');
     */
    async openNewWindow(url) {
        await browser.newWindow(url, { windowName: '', type: 'window' });
    }

    /**
     * Switch to a browser window or tab whose title contains the given string.
     *
     * Iterates through all open window handles, checks each window's title,
     * and switches to the first one where the title includes the provided
     * substring. If no match is found, an error is thrown.
     *
     * @param {string} title - A substring to match against window titles (case-sensitive).
     * @returns {Promise<void>} Resolves after switching to the matched window.
     * @throws {Error} Throws `No window found with title containing: "<title>"` if no window title matches.
     * @example
     * await mgr.openNewTab('https://example.com/checkout');
     * await mgr.switchToWindowByTitle('Checkout');
     */
    async switchToWindowByTitle(title) {
        const handles = await browser.getWindowHandles();
        for (const handle of handles) {
            await browser.switchToWindow(handle);
            const currentTitle = await browser.getTitle();
            if (currentTitle.includes(title)) {
                this.logger.info(`Switched to window with title: ${currentTitle}`);
                return;
            }
        }
        throw new Error(`No window found with title containing: "${title}"`);
    }

    /**
     * Switch to a browser window or tab whose URL contains the given substring.
     *
     * Iterates through all open window handles, checks each window's URL,
     * and switches to the first one where the URL includes the provided
     * substring. If no match is found, an error is thrown.
     *
     * @param {string} partialUrl - A substring to match against window URLs (case-sensitive).
     * @returns {Promise<void>} Resolves after switching to the matched window.
     * @throws {Error} Throws `No window found with URL containing: "<partialUrl>"` if no window URL matches.
     * @example
     * await mgr.openNewTab('https://example.com/api/docs');
     * await mgr.switchToWindowByUrl('/api/docs');
     */
    async switchToWindowByUrl(partialUrl) {
        const handles = await browser.getWindowHandles();
        for (const handle of handles) {
            await browser.switchToWindow(handle);
            const currentUrl = await browser.getUrl();
            if (currentUrl.includes(partialUrl)) {
                this.logger.info(`Switched to window with URL: ${currentUrl}`);
                return;
            }
        }
        throw new Error(`No window found with URL containing: "${partialUrl}"`);
    }

    /**
     * Close all browser tabs/windows except the main (first) one.
     *
     * Iterates through handles in reverse order, closing each secondary tab,
     * then switches back to the main window (`handles[0]`).
     *
     * @returns {Promise<void>} Resolves after all secondary tabs have been closed and focus has returned to the main window.
     * @example
     * // After a test opened multiple tabs
     * await mgr.closeAllTabsExceptMain();
     * // Only the original tab remains
     */
    async closeAllTabsExceptMain() {
        const handles = await browser.getWindowHandles();
        const main = handles[0];
        for (let i = handles.length - 1; i > 0; i--) {
            await browser.switchToWindow(handles[i]);
            await browser.closeWindow();
        }
        await browser.switchToWindow(main);
    }

    // ─── Browser Information ──────────────────────────────────

    /**
     * Get the name of the current browser (e.g., `'chrome'`, `'firefox'`, `'MicrosoftEdge'`).
     *
     * @returns {Promise<string>} The browser name as reported by its capabilities.
     * @example
     * const name = await mgr.getBrowserName();
     * console.log(`Running on: ${name}`); // 'chrome'
     */
    async getBrowserName() {
        const caps = await browser.capabilities;
        return caps.browserName;
    }

    /**
     * Get the version string of the current browser.
     *
     * @returns {Promise<string>} The browser version (e.g., `'120.0.6099.109'`), sourced from `browserVersion` or the legacy `version` capability.
     * @example
     * const version = await mgr.getBrowserVersion();
     * console.log(`Browser version: ${version}`);
     */
    async getBrowserVersion() {
        const caps = await browser.capabilities;
        return caps.browserVersion || caps.version;
    }

    /**
     * Get the operating system / platform name the browser is running on.
     *
     * @returns {Promise<string>} The platform name (e.g., `'Windows'`, `'macOS'`, `'Linux'`), sourced from `platformName` or the legacy `platform` capability.
     * @example
     * const platform = await mgr.getPlatformName();
     * console.log(`Platform: ${platform}`);
     */
    async getPlatformName() {
        const caps = await browser.capabilities;
        return caps.platformName || caps.platform;
    }

    // ─── Performance Metrics ──────────────────────────────────

    /**
     * Get high-level page performance metrics.
     *
     * Delegates to the framework's {@link PerformanceTracker} singleton, which
     * collects metrics such as page load time, DOM content loaded, and first
     * contentful paint.
     *
     * @returns {Promise<Object>} An object containing performance metrics (exact shape defined by {@link PerformanceTracker}).
     * @example
     * const metrics = await mgr.getPerformanceMetrics();
     * console.log(`Page load: ${metrics.pageLoadTime}ms`);
     */
    async getPerformanceMetrics() {
        return PerformanceTracker.getInstance().getPagePerformance();
    }

    /**
     * Get the Navigation Timing API entry for the current page.
     *
     * Executes `performance.getEntriesByType('navigation')` in the browser and
     * returns the first entry as a JSON string. Parse the result to get detailed
     * timing breakdowns (DNS, TCP, request, response, DOM processing, etc.).
     *
     * @returns {Promise<string>} A JSON string representing the `PerformanceNavigationTiming` entry. Parse with `JSON.parse()` before use.
     * @example
     * const timingJson = await mgr.getNavigationTiming();
     * const timing = JSON.parse(timingJson);
     * console.log(`DOM interactive: ${timing.domInteractive}ms`);
     */
    async getNavigationTiming() {
        return browser.execute(() => JSON.stringify(performance.getEntriesByType('navigation')[0]));
    }

    // ─── Network ──────────────────────────────────────────────

    /**
     * Set custom network conditions to throttle or block network traffic.
     *
     * Only supported in Chromium-based browsers using the DevTools protocol.
     * If the browser does not support the method, a warning is logged and
     * no error is thrown.
     *
     * @param {Object} conditions - Network condition parameters.
     * @param {boolean} conditions.offline - Whether to simulate being offline.
     * @param {number} conditions.latency - Additional latency in milliseconds.
     * @param {number} conditions.download_throughput - Maximum download throughput in bytes per second.
     * @param {number} conditions.upload_throughput - Maximum upload throughput in bytes per second.
     * @returns {Promise<void>} Resolves after conditions have been applied (or after logging a warning if unsupported).
     * @example
     * await mgr.setNetworkConditions({
     *   offline: false,
     *   latency: 200,
     *   download_throughput: 1024 * 1024,   // 1 MB/s
     *   upload_throughput: 512 * 1024,       // 512 KB/s
     * });
     */
    async setNetworkConditions(conditions) {
        if (typeof browser.setNetworkConditions === 'function') {
            await browser.setNetworkConditions(conditions);
            this.logger.info(`Network conditions set: ${JSON.stringify(conditions)}`);
        } else {
            this.logger.warn('setNetworkConditions is not supported in this browser');
        }
    }

    /**
     * Simulate a completely offline network connection.
     *
     * Sets the browser's network conditions to offline mode with zero throughput.
     * Only supported in Chromium-based browsers.
     *
     * @returns {Promise<void>} Resolves after the offline condition has been applied.
     * @example
     * await mgr.simulateOffline();
     * // Assert that the app shows an offline banner
     * await expect($('.offline-banner')).toBeDisplayed();
     */
    async simulateOffline() {
        await this.setNetworkConditions({ offline: true, latency: 0, download_throughput: 0, upload_throughput: 0 });
    }

    /**
     * Simulate a slow 3G mobile network connection.
     *
     * Applies a 2 000 ms latency and ~500 kbps throughput for both download and
     * upload, matching a typical slow 3G profile. Only supported in Chromium-based
     * browsers.
     *
     * @returns {Promise<void>} Resolves after the slow 3G condition has been applied.
     * @example
     * await mgr.simulateSlow3G();
     * await browser.url('https://example.com');
     * // Verify the page still loads reasonably under poor network conditions
     */
    async simulateSlow3G() {
        await this.setNetworkConditions({ offline: false, latency: 2000, download_throughput: 500 * 1024 / 8, upload_throughput: 500 * 1024 / 8 });
    }

    // ─── Cleanup ──────────────────────────────────────────────

    /**
     * Clear all browser-side data: localStorage, sessionStorage, and cookies.
     *
     * Useful as a cleanup step between tests or scenarios to ensure a fresh
     * browser state.
     *
     * @returns {Promise<void>} Resolves after all client-side storage and cookies have been cleared.
     * @example
     * // In an afterEach hook
     * afterEach(async () => {
     *   await BrowserManager.getInstance().clearBrowserData();
     * });
     */
    async clearBrowserData() {
        this.logger.info('Clearing all browser data');
        await browser.execute(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await browser.deleteCookies();
    }

    /**
     * Delete all browser cookies for the current domain.
     *
     * @returns {Promise<void>} Resolves after all cookies have been deleted.
     * @example
     * await mgr.deleteAllCookies();
     */
    async deleteAllCookies() {
        await browser.deleteCookies();
    }

    // ─── Singleton ────────────────────────────────────────────

    /**
     * Get or create the singleton `BrowserManager` instance.
     *
     * If an instance already exists it is returned; otherwise a new one is
     * created and cached for future calls.
     *
     * @static
     * @returns {BrowserManager} The shared `BrowserManager` singleton instance.
     * @example
     * const mgr = BrowserManager.getInstance();
     * await mgr.maximizeWindow();
     */
    static getInstance() {
        if (!BrowserManager._instance) {
            BrowserManager._instance = new BrowserManager();
        }
        return BrowserManager._instance;
    }
}

module.exports = { BrowserManager };
