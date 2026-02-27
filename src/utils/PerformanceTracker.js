/**
 * ═══════════════════════════════════════════════════════════════
 * PerformanceTracker - Page Load & Execution Metrics
 * ═══════════════════════════════════════════════════════════════
 */

const { Logger } = require('./Logger');

const logger = Logger.getInstance('PerformanceTracker');

class PerformanceTracker {
    constructor() {
        this._timers = {};
        this._metrics = [];
    }

    /**
     * Start a named timer.
     */
    startTimer(name) {
        this._timers[name] = Date.now();
        logger.debug(`Timer started: ${name}`);
    }

    /**
     * Stop a named timer and return the elapsed milliseconds.
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
     * Measure the execution time of an async function.
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
     * Collect resource-level performance entries.
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
     * Return all collected timer metrics.
     */
    getMetrics() {
        return [...this._metrics];
    }

    /**
     * Clear all collected metrics.
     */
    clearMetrics() {
        this._metrics = [];
    }

    /**
     * Assert that a page loads within a given threshold.
     */
    async assertPageLoadUnder(maxMs) {
        const perf = await this.getPagePerformance();
        if (!perf) {
            logger.warn('Performance data not available');
            return;
        }
        if (perf.loadComplete > maxMs) {
            throw new Error(`Page load time ${perf.loadComplete}ms exceeded threshold ${maxMs}ms`);
        }
        logger.info(`Page load time ${perf.loadComplete}ms is within threshold ${maxMs}ms`);
    }

    // ─── Singleton ────────────────────────────────────────────

    static getInstance() {
        if (!PerformanceTracker._instance) {
            PerformanceTracker._instance = new PerformanceTracker();
        }
        return PerformanceTracker._instance;
    }
}

module.exports = { PerformanceTracker };
