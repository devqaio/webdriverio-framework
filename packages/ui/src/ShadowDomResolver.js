/**
 * ═══════════════════════════════════════════════════════════════════════
 * ShadowDomResolver — Automatic Shadow DOM Element Resolution
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Provides transparent traversal of open Shadow DOM boundaries so that
 * tests never need to manually pierce shadow roots.  Supports:
 *
 *   • Deep CSS selectors with the `>>>` combinator
 *     e.g. "my-app >>> .inner-button"
 *   • Automatic deep search through ALL shadow roots on the page
 *   • Recursive shadow tree traversal for arbitrarily nested shadows
 *   • Fallback to standard resolution when no shadow DOM is present
 *
 * Architecture notes
 * ──────────────────
 * WebdriverIO v9 supports `>>>` (deep shadow piercing) natively in
 * some drivers.  This module adds a robust JS-based fallback that
 * works with every WebDriver-compatible browser and Appium.
 *
 * Usage (typically consumed by BasePage._resolveElement):
 *   const resolver = new ShadowDomResolver();
 *   const el = await resolver.findInShadowDom('my-component >>> .btn');
 *   const el = await resolver.deepFindElement('.btn-primary');
 * ═══════════════════════════════════════════════════════════════════════
 */

const { Logger } = require('@wdio-framework/core');

class ShadowDomResolver {
    constructor() {
        this.logger = Logger.getInstance('ShadowDomResolver');
    }

    // ─── Public API ───────────────────────────────────────────

    /**
     * Determine whether a selector uses the deep-shadow `>>>` combinator.
     * @param {string} selector
     * @returns {boolean}
     */
    isDeepSelector(selector) {
        return typeof selector === 'string' && selector.includes('>>>');
    }

    /**
     * Resolve a deep-shadow selector of the form:
     *   "host-a >>> host-b >>> .target"
     *
     * Each segment separated by `>>>` is treated as a step that first
     * locates the host element, then enters its shadow root before
     * continuing with the next segment.
     *
     * @param {string}  selector  Deep selector with `>>>` separators
     * @param {number}  [timeout=10000]  Max wait time in ms
     * @returns {Promise<WebdriverIO.Element>}
     */
    async findInShadowDom(selector, timeout = 10000) {
        const segments = selector.split('>>>').map((s) => s.trim());
        this.logger.debug(`Deep shadow selector parsed into ${segments.length} segment(s): ${JSON.stringify(segments)}`);

        const element = await browser.execute(
            function (segs) {
                /**
                 * Walk an array of CSS selectors, piercing shadow roots
                 * at each boundary.
                 */
                let context = document;
                for (let i = 0; i < segs.length; i++) {
                    const sel = segs[i];
                    const el = context.querySelector(sel);
                    if (!el) return null;

                    // If there are more segments, dive into the shadow root
                    if (i < segs.length - 1) {
                        if (!el.shadowRoot) return null;
                        context = el.shadowRoot;
                    } else {
                        return el;
                    }
                }
                return null;
            },
            segments,
        );

        if (!element) {
            // Retry with waitUntil for timing safety
            return this._waitForDeepElement(segments, timeout);
        }

        // browser.execute already returns a WDIO element reference
        return element;
    }

    /**
     * Find ALL elements matching a deep-shadow selector.
     * The last segment may match multiple nodes; earlier segments
     * must each resolve to a single host.
     *
     * @param {string} selector  Deep selector with `>>>` separators
     * @returns {Promise<WebdriverIO.Element[]>}
     */
    async findAllInShadowDom(selector) {
        const segments = selector.split('>>>').map((s) => s.trim());

        const elements = await browser.execute(function (segs) {
            let context = document;
            for (let i = 0; i < segs.length; i++) {
                const sel = segs[i];
                if (i < segs.length - 1) {
                    const el = context.querySelector(sel);
                    if (!el || !el.shadowRoot) return [];
                    context = el.shadowRoot;
                } else {
                    return Array.from(context.querySelectorAll(sel));
                }
            }
            return [];
        }, segments);

        // Wrap each returned DOM node — browser.execute returns WDIO element references
        return (elements || []);
    }

    /**
     * Perform an exhaustive, depth-first search through EVERY shadow root
     * on the page to locate an element matching the given CSS selector.
     *
     * This is the "nuclear option" — when the test does not know which
     * shadow host contains the target.
     *
     * @param {string}  cssSelector  Standard CSS selector (no `>>>`)
     * @param {number}  [timeout=10000]
     * @returns {Promise<WebdriverIO.Element|null>}
     */
    async deepFindElement(cssSelector, timeout = 10000) {
        this.logger.debug(`Deep searching ALL shadow roots for: ${cssSelector}`);

        const found = await browser.execute(function (sel) {
            function searchShadowRoots(root) {
                // Try in current context first
                const el = root.querySelector(sel);
                if (el) return el;

                // Search within shadow roots of child custom elements
                const allElements = root.querySelectorAll('*');
                for (const node of allElements) {
                    if (node.shadowRoot) {
                        const shadowResult = searchShadowRoots(node.shadowRoot);
                        if (shadowResult) return shadowResult;
                    }
                }
                return null;
            }
            return searchShadowRoots(document);
        }, cssSelector);

        if (found) {
            // browser.execute already returns a WDIO element reference
            return found;
        }

        // Retry with poll if not immediately found
        try {
            let foundElement = null;
            await browser.waitUntil(
                async () => {
                    const result = await browser.execute(function (sel) {
                        function searchShadowRoots(root) {
                            const el = root.querySelector(sel);
                            if (el) return el;
                            const allElements = root.querySelectorAll('*');
                            for (const node of allElements) {
                                if (node.shadowRoot) {
                                    const sr = searchShadowRoots(node.shadowRoot);
                                    if (sr) return sr;
                                }
                            }
                            return null;
                        }
                        return searchShadowRoots(document);
                    }, cssSelector);
                    if (result) {
                        foundElement = result;
                        return true;
                    }
                    return false;
                },
                { timeout, timeoutMsg: `Element "${cssSelector}" not found in any shadow root after ${timeout}ms` },
            );

            return foundElement;
        } catch (err) {
            this.logger.warn(`Deep shadow search failed: ${err.message}`);
            return null;
        }
    }

    /**
     * Find ALL elements matching a CSS selector across every shadow root.
     *
     * @param {string} cssSelector
     * @returns {Promise<WebdriverIO.Element[]>}
     */
    async deepFindAllElements(cssSelector) {
        const found = await browser.execute(function (sel) {
            const results = [];
            function searchShadowRoots(root) {
                const list = root.querySelectorAll(sel);
                for (const el of list) results.push(el);

                const allElements = root.querySelectorAll('*');
                for (const node of allElements) {
                    if (node.shadowRoot) {
                        searchShadowRoots(node.shadowRoot);
                    }
                }
            }
            searchShadowRoots(document);
            return results;
        }, cssSelector);

        // browser.execute already returns WDIO element references
        return (found || []);
    }

    /**
     * Check whether the page currently contains any open shadow roots.
     * Useful for deciding whether to bother with deep resolution.
     *
     * @returns {Promise<boolean>}
     */
    async hasShadowDom() {
        return browser.execute(function () {
            const allElements = document.querySelectorAll('*');
            for (const node of allElements) {
                if (node.shadowRoot) return true;
            }
            return false;
        });
    }

    /**
     * Return the number of open shadow roots on the page.
     * @returns {Promise<number>}
     */
    async countShadowRoots() {
        return browser.execute(function () {
            let count = 0;
            function walk(root) {
                const all = root.querySelectorAll('*');
                for (const node of all) {
                    if (node.shadowRoot) {
                        count++;
                        walk(node.shadowRoot);
                    }
                }
            }
            walk(document);
            return count;
        });
    }

    // ─── Private Helpers ──────────────────────────────────────

    /**
     * Poll until a deep-shadow selector resolves (for timing-sensitive UIs).
     */
    async _waitForDeepElement(segments, timeout) {
        await browser.waitUntil(
            async () => {
                const result = await browser.execute(function (segs) {
                    let context = document;
                    for (let i = 0; i < segs.length; i++) {
                        const sel = segs[i];
                        const el = context.querySelector(sel);
                        if (!el) return null;
                        if (i < segs.length - 1) {
                            if (!el.shadowRoot) return null;
                            context = el.shadowRoot;
                        } else {
                            return el;
                        }
                    }
                    return null;
                }, segments);
                return result !== null;
            },
            { timeout, timeoutMsg: `Shadow element not found after ${timeout}ms: ${segments.join(' >>> ')}` },
        );

        // Final fetch
        const el = await browser.execute(function (segs) {
            let context = document;
            for (let i = 0; i < segs.length; i++) {
                const sel = segs[i];
                const found = context.querySelector(sel);
                if (!found) return null;
                if (i < segs.length - 1) {
                    if (!found.shadowRoot) return null;
                    context = found.shadowRoot;
                } else {
                    return found;
                }
            }
            return null;
        }, segments);

        if (!el) {
            throw new Error(`Shadow element resolved during wait but not on final fetch: ${segments.join(' >>> ')}`);
        }

        // browser.execute already returns a WDIO element reference
        return el;
    }
}

module.exports = { ShadowDomResolver };
