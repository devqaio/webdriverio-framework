/**
 * ═══════════════════════════════════════════════════════════════
 * PerformanceTracker - Page Load & Execution Metrics
 * ═══════════════════════════════════════════════════════════════
 *
 * Tracks execution timing and collects browser Navigation Timing API
 * metrics for performance analysis. Provides:
 *
 * - Named start/stop timers for measuring operation durations
 * - Async operation measurement wrapper
 * - Navigation Timing API data (TTFB, DOM load, full page load)
 * - Resource-level performance entries
 * - Threshold assertions for CI/CD quality gates
 * - Singleton access for global metric collection
 *
 * @module PerformanceTracker
 * @example
 * const { PerformanceTracker } = require('@wdio-framework/core');
 * const perf = PerformanceTracker.getInstance();
 *
 * // Measure an operation
 * const result = await perf.measure('loginFlow', async () => {
 *     await loginPage.login('user', 'pass');
 *     return await dashboardPage.isLoaded();
 * });
 *
 * // Assert page load time for CI gate
 * await perf.assertPageLoadUnder(3000);
 *
 * // Get all collected metrics
 * console.table(perf.getMetrics());
 */

const { Logger } = require('./Logger');

const logger = Logger.getInstance('PerformanceTracker');

/**
 * Performance measurement and browser metrics collector.
 * Use {@link PerformanceTracker.getInstance} for the shared singleton.
 *
 * @class PerformanceTracker
 */
class PerformanceTracker {
    constructor() {
        this._timers = {};
        this._metrics = [];
    }

    /**
     * Start a named timer. Call {@link stopTimer} with the same name to
     * record the elapsed duration.
     *
     * @param {string} name  Unique timer identifier
     * @returns {void}
     *
     * @example
     * perf.startTimer('searchQuery');
     * await searchPage.submitSearch('test automation');
     * const elapsed = perf.stopTimer('searchQuery');
     */
    startTimer(name) {
        this._timers[name] = Date.now();
        logger.debug(`Timer started: ${name}`);
    }

    /**
     * Stop a named timer and return the elapsed milliseconds.
     * The measurement is automatically recorded in the internal metrics list.
     *
     * @param {string} name  Timer identifier (must match a previous {@link startTimer} call)
     * @returns {number} Elapsed time in milliseconds, or `0` if the timer was never started
     */
    stopTimer(name) {
        if (!this._timers[name]) {
            logger.warn(`Timer "${name}" was never started`);
            return 0;
        }
        const elapsed = Date.now() - this._timers[name];
        delete this._timers[name];

        this._metrics.push({ name, elapsed, timestamp: new Date().toISOString() });
        logger.info(`Timer "${name}": ${elapsed}ms`);
        return elapsed;
    }

    /**
     * Measure the execution time of an async function. The timer is
     * automatically started before `fn` and stopped after (even on error).
     *
     * @param {string}   name  Metric label
     * @param {Function} fn    Async function to measure
     * @returns {Promise<*>} The return value of `fn`
     *
     * @example
     * const isLoaded = await perf.measure('checkoutFlow', async () => {
     *     await cartPage.proceedToCheckout();
     *     return await checkoutPage.isDisplayed();
     * });
     */
    async measure(name, fn) {
        this.startTimer(name);
        try {
            const result = await fn();
            return result;
        } finally {
            this.stopTimer(name);
        }
    }

    /**
     * Collect browser performance timing (Navigation Timing API).
     *
     * Returns an object with key metrics:
     * `domContentLoaded`, `domComplete`, `loadComplete`,
     * `timeToFirstByte`, `dnsLookup`, `tcpConnect`,
     * `serverResponseTime`, `pageRendering`, `redirectTime`,
     * `transferSize`, `encodedBodySize`, `decodedBodySize`.
     *
     * @returns {Promise<Object|null>} Performance metrics or `null` if unavailable
     *
     * @example
     * const metrics = await perf.getPagePerformance();
     * console.log(`TTFB: ${metrics.timeToFirstByte}ms`);
     * console.log(`Full load: ${metrics.loadComplete}ms`);
     */
    async getPagePerformance() {
        return browser.execute(() => {
            const perf = performance.getEntriesByType('navigation')[0];
            if (!perf) return null;
            return {
                domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.fetchStart),
                domComplete: Math.round(perf.domComplete - perf.fetchStart),
                loadComplete: Math.round(perf.loadEventEnd - perf.fetchStart),
                timeToFirstByte: Math.round(perf.responseStart - perf.fetchStart),
                dnsLookup: Math.round(perf.domainLookupEnd - perf.domainLookupStart),
                tcpConnect: Math.round(perf.connectEnd - perf.connectStart),
                serverResponseTime: Math.round(perf.responseEnd - perf.requestStart),
                pageRendering: Math.round(perf.loadEventEnd - perf.responseEnd),
                redirectTime: Math.round(perf.redirectEnd - perf.redirectStart),
                transferSize: perf.transferSize,
                encodedBodySize: perf.encodedBodySize,
                decodedBodySize: perf.decodedBodySize,
            };
        });
    }

    /**
     * Collect resource-level performance entries from the browser.
     * Each entry includes the resource name, initiator type, duration,
     * and transfer size.
     *
     * @returns {Promise<Array<{name: string, type: string, duration: number, transferSize: number}>>}
     *
     * @example
     * const resources = await perf.getResourcePerformance();
     * const slowAPIs = resources.filter(r => r.type === 'xmlhttprequest' && r.duration > 2000);
     */
    async getResourcePerformance() {
        return browser.execute(() => {
            const entries = performance.getEntriesByType('resource');
            return entries.map((e) => ({
                name: e.name,
                type: e.initiatorType,
                duration: Math.round(e.duration),
                transferSize: e.transferSize,
            }));
        });
    }

    /**
     * Return all collected timer metrics as an array of objects.
     *
     * @returns {Array<{name: string, elapsed: number, timestamp: string}>}
     */
    getMetrics() {
        return [...this._metrics];
    }

    /**
     * Clear all collected metrics. Useful between test scenarios.
     * @returns {void}
     */
    clearMetrics() {
        this._metrics = [];
    }

    /**
     * Assert that a page loads within a given threshold.
     * Uses the Navigation Timing API `loadComplete` metric.
     *
     * @param {number} maxMs  Maximum allowed page-load time in milliseconds
     * @returns {Promise<void>}
     * @throws {Error} If page load exceeds `maxMs` or timing data is unavailable
     *
     * @example
     * // Fail the test if load exceeds 3 seconds
     * await perf.assertPageLoadUnder(3000);
     */
    async assertPageLoadUnder(maxMs) {
        const perf = await this.getPagePerformance();
        if (!perf) {
            throw new Error('Performance data not available — Navigation Timing API returned null');
        }
        if (perf.loadComplete > maxMs) {
            throw new Error(`Page load time ${perf.loadComplete}ms exceeded threshold ${maxMs}ms`);
        }
        logger.info(`Page load time ${perf.loadComplete}ms is within threshold ${maxMs}ms`);
    }

    // ─── Singleton ────────────────────────────────────────────

    /**
     * Return the singleton PerformanceTracker instance.
     * Creates the instance on first call.
     *
     * @returns {PerformanceTracker}
     *
     * @example
     * const perf = PerformanceTracker.getInstance();
     */
    static getInstance() {
        if (!PerformanceTracker._instance) {
            PerformanceTracker._instance = new PerformanceTracker();
        }
        return PerformanceTracker._instance;
    }
}

module.exports = { PerformanceTracker };
