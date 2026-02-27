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

const { Logger } = require('../utils/Logger');

class BrowserManager {
    constructor() {
        this.logger = Logger.getInstance('BrowserManager');
    }

    // ─── Window Management ────────────────────────────────────

    async maximizeWindow() {
        this.logger.info('Maximizing browser window');
        await browser.maximizeWindow();
    }

    async setWindowSize(width, height) {
        this.logger.info(`Setting window size: ${width}x${height}`);
        await browser.setWindowSize(width, height);
    }

    async getWindowSize() {
        return browser.getWindowSize();
    }

    async fullScreenWindow() {
        await browser.fullscreenWindow();
    }

    async minimizeWindow() {
        await browser.minimizeWindow();
    }

    // ─── Tab / Window Handle Management ───────────────────────

    async getCurrentWindowHandle() {
        return browser.getWindowHandle();
    }

    async getAllWindowHandles() {
        return browser.getWindowHandles();
    }

    async openNewTab(url) {
        await browser.newWindow(url, { windowName: '', type: 'tab' });
    }

    async openNewWindow(url) {
        await browser.newWindow(url, { windowName: '', type: 'window' });
    }

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

    async getBrowserName() {
        const caps = await browser.capabilities;
        return caps.browserName;
    }

    async getBrowserVersion() {
        const caps = await browser.capabilities;
        return caps.browserVersion || caps.version;
    }

    async getPlatformName() {
        const caps = await browser.capabilities;
        return caps.platformName || caps.platform;
    }

    // ─── Performance Metrics ──────────────────────────────────

    async getPerformanceMetrics() {
        return browser.execute(() => {
            // Use Navigation Timing API Level 2 (performance.timing is deprecated)
            const entries = performance.getEntriesByType('navigation');
            if (entries.length > 0) {
                const t = entries[0];
                return {
                    pageLoadTime: t.loadEventEnd - t.startTime,
                    domContentLoaded: t.domContentLoadedEventEnd - t.startTime,
                    responseTime: t.responseEnd - t.requestStart,
                    domInteractive: t.domInteractive - t.startTime,
                    dnsLookup: t.domainLookupEnd - t.domainLookupStart,
                    tcpConnection: t.connectEnd - t.connectStart,
                    serverResponse: t.responseStart - t.requestStart,
                    pageRendering: t.loadEventEnd - t.responseEnd,
                };
            }
            // Fallback for older browsers
            const timing = performance.timing;
            return {
                pageLoadTime: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                responseTime: timing.responseEnd - timing.requestStart,
                domInteractive: timing.domInteractive - timing.navigationStart,
                dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
                tcpConnection: timing.connectEnd - timing.connectStart,
                serverResponse: timing.responseStart - timing.requestStart,
                pageRendering: timing.loadEventEnd - timing.responseEnd,
            };
        });
    }

    async getNavigationTiming() {
        return browser.execute(() => JSON.stringify(performance.getEntriesByType('navigation')[0]));
    }

    // ─── Network ──────────────────────────────────────────────

    async setNetworkConditions(conditions) {
        if (typeof browser.setNetworkConditions === 'function') {
            await browser.setNetworkConditions(conditions);
            this.logger.info(`Network conditions set: ${JSON.stringify(conditions)}`);
        } else {
            this.logger.warn('setNetworkConditions is not supported in this browser');
        }
    }

    async simulateOffline() {
        await this.setNetworkConditions({ offline: true, latency: 0, download_throughput: 0, upload_throughput: 0 });
    }

    async simulateSlow3G() {
        await this.setNetworkConditions({ offline: false, latency: 2000, download_throughput: 500 * 1024 / 8, upload_throughput: 500 * 1024 / 8 });
    }

    // ─── Cleanup ──────────────────────────────────────────────

    async clearBrowserData() {
        this.logger.info('Clearing all browser data');
        await browser.execute(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await browser.deleteCookies();
    }

    async deleteAllCookies() {
        await browser.deleteCookies();
    }

    // ─── Singleton ────────────────────────────────────────────

    static getInstance() {
        if (!BrowserManager._instance) {
            BrowserManager._instance = new BrowserManager();
        }
        return BrowserManager._instance;
    }
}

module.exports = { BrowserManager };
