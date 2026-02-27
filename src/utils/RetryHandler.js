/**
 * ═══════════════════════════════════════════════════════════════
 * RetryHandler - Intelligent Retry & Recovery Logic
 * ═══════════════════════════════════════════════════════════════
 */

const { Logger } = require('./Logger');

const logger = Logger.getInstance('RetryHandler');

class RetryHandler {
    /**
     * Retry an async function up to `maxAttempts` times.
     *
     * @param {Function}  fn           Async function to execute
     * @param {Object}    options
     * @param {number}    options.maxRetries   Total attempts including the first (default 3)
     * @param {number}    options.delay        Base delay between retries in ms (default 1000)
     * @param {boolean}   options.exponential  Use exponential back-off (default true)
     * @param {Function}  options.onRetry      Callback invoked before each retry
     * @param {Function}  options.shouldRetry  Predicate to decide if the error is retryable
     */
    static async retry(fn, {
        maxRetries = 3,
        delay = 1000,
        exponential = true,
        onRetry = null,
        shouldRetry = () => true,
    } = {}) {
        let lastError;
        const totalAttempts = maxRetries;

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
     * Retry with circuit-breaker pattern: after N consecutive failures,
     * stop retrying for a cooldown period.
     */
    static createCircuitBreaker({ threshold = 5, cooldown = 30000 } = {}) {
        let failures = 0;
        let lastFailureTime = 0;

        return {
            async execute(fn) {
                const now = Date.now();
                if (failures >= threshold && now - lastFailureTime < cooldown) {
                    throw new Error(`Circuit breaker open — ${failures} consecutive failures. Cooling down.`);
                }

                try {
                    const result = await fn();
                    failures = 0; // reset on success
                    return result;
                } catch (error) {
                    failures++;
                    lastFailureTime = Date.now();
                    throw error;
                }
            },

            reset() {
                failures = 0;
                lastFailureTime = 0;
            },

            get state() {
                const now = Date.now();
                if (failures >= threshold && now - lastFailureTime < cooldown) return 'open';
                if (failures > 0) return 'half-open';
                return 'closed';
            },
        };
    }
}

module.exports = { RetryHandler };
