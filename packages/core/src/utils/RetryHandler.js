/**
 * ═══════════════════════════════════════════════════════════════
 * RetryHandler - Intelligent Retry & Recovery Logic
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides resilient execution patterns for flaky operations:
 *
 * - **Simple retry** — exponential back-off with configurable attempts
 * - **Browser-aware retry** — auto-recovers from stale element and
 *   click-intercept errors common in DOM-heavy SPAs
 * - **Circuit breaker** — stops retrying after N consecutive failures
 *   and enters a cooldown period (closed → open → half-open → closed)
 *
 * @module RetryHandler
 * @example
 * const { RetryHandler } = require('@wdio-framework/core');
 *
 * // Simple retry with exponential back-off
 * const result = await RetryHandler.retry(() => fetchData(), {
 *     maxAttempts: 5,
 *     delay: 1000,
 *     exponential: true,
 * });
 *
 * // Browser action retry (auto-handles stale element errors)
 * await RetryHandler.retryBrowserAction(() => $('button').click());
 *
 * // Circuit breaker pattern
 * const breaker = RetryHandler.createCircuitBreaker({ threshold: 3, cooldown: 10000 });
 * const data = await breaker.execute(() => callExternalService());
 */

const { Logger } = require('./Logger');

const logger = Logger.getInstance('RetryHandler');

/**
 * Static utility class providing retry and circuit-breaker patterns
 * for resilient test execution.
 *
 * @class RetryHandler
 */
class RetryHandler {
    /**
     * Retry an async function up to `maxAttempts` times with configurable
     * delay strategy. On each failure the error is checked against
     * `shouldRetry`; if false the error is thrown immediately.
     *
     * @param {Function}  fn           Async function to execute. Receives the current
     *                                 attempt number (1-based) as its argument.
     * @param {Object}    options
     * @param {number}    [options.maxAttempts=3]   Total attempts including the first
     * @param {number}    [options.maxRetries]      Alias for maxAttempts (deprecated — use maxAttempts)
     * @param {number}    [options.delay=1000]      Base delay between retries in ms
     * @param {boolean}   [options.exponential=true] Use exponential back-off (delay × 2^attempt)
     * @param {Function}  [options.onRetry]          Callback `(error, attempt) => void` invoked before each retry
     * @param {Function}  [options.shouldRetry]      Predicate `(error) => boolean` to decide if the error is retryable
     * @returns {Promise<*>} The return value of `fn` on the first successful attempt
     * @throws {Error} The last error encountered when all attempts are exhausted
     *
     * @example
     * // Retry up to 5 times with exponential back-off
     * const data = await RetryHandler.retry(
     *     async (attempt) => {
     *         console.log(`Attempt ${attempt}`);
     *         return await fetchData();
     *     },
     *     { maxAttempts: 5, delay: 500 },
     * );
     */
    static async retry(fn, {
        maxAttempts,
        maxRetries,
        delay = 1000,
        exponential = true,
        onRetry = null,
        shouldRetry = () => true,
    } = {}) {
        let lastError;
        const totalAttempts = maxAttempts ?? maxRetries ?? 3;

        for (let attempt = 1; attempt <= totalAttempts; attempt++) {
            try {
                return await fn(attempt);
            } catch (error) {
                lastError = error;

                if (attempt >= totalAttempts || !shouldRetry(error)) {
                    logger.error(`All ${totalAttempts} attempts exhausted. Last error: ${error.message}`);
                    throw error;
                }

                const waitTime = exponential ? delay * Math.pow(2, attempt - 1) : delay;
                logger.warn(`Attempt ${attempt}/${totalAttempts} failed: ${error.message}. Retrying in ${waitTime}ms...`);

                if (onRetry) {
                    await onRetry(error, attempt);
                }

                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }

        throw lastError;
    }

    /**
     * Retry a browser-level action with automatic stale-element recovery.
     *
     * Automatically retries when the error message contains common
     * WebDriver element-interaction failures:
     * - `stale element reference`
     * - `element not interactable`
     * - `element click intercepted`
     * - `no such element`
     * - `element is not attached`
     *
     * @param {Function} fn           Async function performing the browser action
     * @param {number}   [maxRetries=3] Maximum number of retry attempts
     * @returns {Promise<*>} The return value of `fn` on success
     * @throws {Error} When all retries are exhausted or a non-retryable error occurs
     *
     * @example
     * await RetryHandler.retryBrowserAction(async () => {
     *     const btn = await $('button.submit');
     *     await btn.click();
     * });
     */
    static async retryBrowserAction(fn, maxRetries = 3) {
        return this.retry(fn, {
            maxRetries,
            delay: 500,
            shouldRetry: (error) => {
                const retryableMessages = [
                    'stale element reference',
                    'element not interactable',
                    'element click intercepted',
                    'no such element',
                    'element is not attached',
                ];
                return retryableMessages.some((msg) => error.message.toLowerCase().includes(msg));
            },
        });
    }

    /**
     * Create a circuit breaker that halts execution after consecutive failures.
     *
     * States:
     * - **closed** — normal operation, all calls pass through
     * - **open** — failures exceeded threshold; calls are rejected
     *   instantly until cooldown elapses
     * - **half-open** — cooldown elapsed; a single probe call is allowed
     *   to test recovery
     *
     * @param {Object}  [options]
     * @param {number}  [options.threshold=5]    Consecutive failures before opening
     * @param {number}  [options.cooldown=30000] Cooldown period in ms before half-open
     * @returns {{execute: Function, reset: Function, state: string}}
     *   An object with:
     *   - `execute(fn)` — run `fn` through the breaker (returns Promise)
     *   - `reset()` — manually reset the breaker to closed state
     *   - `state` — current breaker state (`'closed'` | `'open'` | `'half-open'`)
     *
     * @example
     * const breaker = RetryHandler.createCircuitBreaker({ threshold: 3, cooldown: 10000 });
     *
     * try {
     *     const result = await breaker.execute(() => callExternalApi());
     * } catch (err) {
     *     if (err.message.includes('Circuit breaker open')) {
     *         console.log('Service unavailable, backing off...');
     *     }
     * }
     *
     * console.log(breaker.state); // 'closed', 'open', or 'half-open'
     * breaker.reset();             // Force back to closed
     */
    static createCircuitBreaker({ threshold = 5, cooldown = 30000 } = {}) {
        let failures = 0;
        let lastFailureTime = 0;
        let halfOpenAttempted = false;

        return {
            async execute(fn) {
                const now = Date.now();
                const isOpen = failures >= threshold && now - lastFailureTime < cooldown;
                const isHalfOpen = failures >= threshold && now - lastFailureTime >= cooldown;

                if (isOpen) {
                    throw new Error(`Circuit breaker open — ${failures} consecutive failures. Cooling down.`);
                }

                // Half-open: allow a single test request after cooldown
                if (isHalfOpen && !halfOpenAttempted) {
                    halfOpenAttempted = true;
                }

                try {
                    const result = await fn();
                    failures = 0; // reset on success
                    halfOpenAttempted = false;
                    return result;
                } catch (error) {
                    failures++;
                    lastFailureTime = Date.now();
                    halfOpenAttempted = false;
                    throw error;
                }
            },

            reset() {
                failures = 0;
                lastFailureTime = 0;
                halfOpenAttempted = false;
            },

            get state() {
                const now = Date.now();
                if (failures >= threshold && now - lastFailureTime < cooldown) return 'open';
                if (failures >= threshold && now - lastFailureTime >= cooldown) return 'half-open';
                if (failures > 0) return 'half-open';
                return 'closed';
            },
        };
    }
}

module.exports = { RetryHandler };
