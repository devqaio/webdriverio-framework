/**
 * ═══════════════════════════════════════════════════════════════════════
 * FrameManager — Automatic Frame / iFrame Element Resolution
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Automatically searches through all iframes on a page to locate an
 * element, removing the need for manual frame-switching in tests.
 *
 * Capabilities:
 *   • Auto-detect and traverse all iframes (including nested)
 *   • Switch into the correct frame before returning the element
 *   • Track the current frame context for the caller
 *   • Provide manual frame-switching helpers for edge cases
 *   • Automatically switch back to default content when needed
 *
 * Integration:
 *   BasePage._resolveElement() uses FrameManager as a fallback when an
 *   element is not found in the main document.
 *
 * Usage:
 *   const fm = new FrameManager();
 *   const el = await fm.findElementAcrossFrames('.submit-btn');
 * ═══════════════════════════════════════════════════════════════════════
 */

const { Logger } = require('@wdio-framework/core');

class FrameManager {
    constructor({ maxDepth = 5 } = {}) {
        this.logger = Logger.getInstance('FrameManager');
        this._currentFramePath = []; // breadcrumb of frame indices
        this.maxDepth = maxDepth;
    }

    // ─── Public API ───────────────────────────────────────────

    /**
     * Search the main document and every nested iframe for an element
     * matching the given CSS selector.  If found inside a frame, the
     * browser context is switched to that frame so the caller can
     * immediately interact with the element.
     *
     * @param {string}  selector  CSS selector to locate
     * @param {number}  [timeout=10000]  Max wait time in ms
     * @returns {Promise<{ element: WebdriverIO.Element, framePath: number[] } | null>}
     *   Returns the found element and the frame hierarchy (empty array means main content).
     */
    async findElementAcrossFrames(selector, timeout = 10000) {
        this.logger.debug(`Searching all frames for: ${selector}`);

        // 1) Try main content first
        await this.switchToDefaultContent();
        try {
            const el = await $(selector);
            if (await el.isExisting()) {
                this._currentFramePath = [];
                this.logger.debug(`Found "${selector}" in main content`);
                return { element: el, framePath: [] };
            }
        } catch {
            // Not in main content — continue searching frames
        }

        // 2) Recursively search iframes
        const result = await this._searchFramesRecursive(selector, [], 0);
        if (result) {
            this.logger.debug(`Found "${selector}" in frame path: [${result.framePath.join(' → ')}]`);
            return result;
        }

        // 3) Retry with polling if not found immediately
        try {
            let foundResult = null;
            await browser.waitUntil(
                async () => {
                    await this.switchToDefaultContent();
                    // Check main content again
                    try {
                        const el = await $(selector);
                        if (await el.isExisting()) {
                            foundResult = { element: el, framePath: [] };
                            return true;
                        }
                    } catch { /* continue */ }

                    // Check frames again
                    const res = await this._searchFramesRecursive(selector, [], 0);
                    if (res) {
                        foundResult = res;
                        return true;
                    }
                    return false;
                },
                {
                    timeout,
                    interval: 500,
                    timeoutMsg: `Element "${selector}" not found in any frame after ${timeout}ms`,
                },
            );
            return foundResult;
        } catch (err) {
            this.logger.warn(`Frame search exhausted: ${err.message}`);
            await this.switchToDefaultContent();
            return null;
        }
    }

    /**
     * Get a list of all iframe elements on the current page (all levels deep).
     *
     * @returns {Promise.<Array.<{element: WebdriverIO.Element, path: Array.<number>}>>}
     */
    async getAllFrames() {
        await this.switchToDefaultContent();
        const frames = [];
        await this._collectFrames(frames, []);
        return frames;
    }

    /**
     * Return the number of frames / iframes on the current page
     * (top level only, not recursive).
     *
     * @returns {Promise<number>}
     */
    async getFrameCount() {
        return browser.execute(function () {
            return document.querySelectorAll('iframe, frame').length;
        });
    }

    /**
     * Switch to a specific frame by index, name, id, or WDIO element.
     */
    async switchToFrame(frameRef) {
        if (typeof frameRef === 'number') {
            const frames = await $$('iframe, frame');
            if (frameRef >= frames.length) {
                throw new Error(`Frame index ${frameRef} out of range (${frames.length} frames found)`);
            }
            await browser.switchToFrame(frames[frameRef]);
        } else if (typeof frameRef === 'string') {
            // Try by name/id attribute
            let el = await $(`iframe[name="${frameRef}"], iframe[id="${frameRef}"], frame[name="${frameRef}"], frame[id="${frameRef}"]`);
            if (!(await el.isExisting())) {
                // Fallback: treat as CSS selector
                el = await $(frameRef);
            }
            await browser.switchToFrame(el);
        } else {
            // WDIO element
            await browser.switchToFrame(frameRef);
        }
        this.logger.debug(`Switched to frame: ${frameRef}`);
    }

    /**
     * Switch back to the main/default document content.
     */
    async switchToDefaultContent() {
        try {
            await browser.switchToFrame(null);
            this._currentFramePath = [];
        } catch (err) {
            this.logger.warn(`switchToDefaultContent: ${err.message}`);
        }
    }

    /**
     * Switch to the parent frame (one level up).
     */
    async switchToParentFrame() {
        await browser.switchToParentFrame();
        this._currentFramePath.pop();
    }

    /**
     * Navigate to a specific nested frame path.
     * @param {number[]} framePath  Array of frame indices from root → target
     */
    async switchToFramePath(framePath) {
        await this.switchToDefaultContent();
        for (const idx of framePath) {
            const frames = await $$('iframe, frame');
            if (idx >= frames.length) {
                throw new Error(`Frame index ${idx} out of range at depth ${framePath.indexOf(idx)}`);
            }
            await browser.switchToFrame(frames[idx]);
        }
        this._currentFramePath = [...framePath];
    }

    /**
     * Return the current frame path breadcrumb.
     * @returns {number[]}
     */
    getCurrentFramePath() {
        return [...this._currentFramePath];
    }

    /**
     * Execute a callback within a specific frame, then automatically
     * return to the default content.
     *
     * @param {number|string|WebdriverIO.Element} frameRef
     * @param {Function} callback  Async function to execute inside the frame
     * @returns {Promise<*>}  The return value of the callback
     */
    async withinFrame(frameRef, callback) {
        await this.switchToFrame(frameRef);
        try {
            return await callback();
        } finally {
            await this.switchToDefaultContent();
        }
    }

    /**
     * Execute a callback within a nested frame path, then restore context.
     *
     * @param {number[]} framePath
     * @param {Function} callback
     * @returns {Promise<*>}
     */
    async withinFramePath(framePath, callback) {
        await this.switchToFramePath(framePath);
        try {
            return await callback();
        } finally {
            await this.switchToDefaultContent();
        }
    }

    // ─── Private Helpers ──────────────────────────────────────

    /**
     * Recursively search iframes for an element.
     * When found, the browser is left switched INTO the frame.
     */
    async _searchFramesRecursive(selector, pathSoFar, depth) {
        if (depth > this.maxDepth) {
            this.logger.warn(`Frame nesting depth exceeded ${this.maxDepth} \u2014 stopping recursion`);
            return null;
        }

        let frames;
        try {
            frames = await $$('iframe, frame');
        } catch {
            return null;
        }

        for (let i = 0; i < frames.length; i++) {
            const currentPath = [...pathSoFar, i];

            try {
                await browser.switchToFrame(frames[i]);
            } catch (err) {
                this.logger.debug(`Cannot switch to frame ${i}: ${err.message}`);
                continue;
            }

            // Check this frame
            try {
                const el = await $(selector);
                if (await el.isExisting()) {
                    this._currentFramePath = currentPath;
                    return { element: el, framePath: currentPath };
                }
            } catch {
                // element not in this frame
            }

            // Recurse into nested frames
            const nested = await this._searchFramesRecursive(selector, currentPath, depth + 1);
            if (nested) return nested;

            // Back up to parent to continue loop
            await browser.switchToParentFrame();
        }

        return null;
    }

    /**
     * Collect info about all frames (recursive enumeration).
     */
    async _collectFrames(results, pathSoFar) {
        let frames;
        try {
            frames = await $$('iframe, frame');
        } catch {
            return;
        }

        for (let i = 0; i < frames.length; i++) {
            const currentPath = [...pathSoFar, i];
            results.push({ element: frames[i], path: currentPath });

            try {
                await browser.switchToFrame(frames[i]);
                await this._collectFrames(results, currentPath);
                await browser.switchToParentFrame();
            } catch {
                // Cannot enter — skip
            }
        }
    }
}

module.exports = { FrameManager };
