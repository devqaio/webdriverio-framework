/**
 * ═══════════════════════════════════════════════════════════════
 * ScreenshotManager - Intelligent Screenshot Capture
 * ═══════════════════════════════════════════════════════════════
 *
 * Centralised screenshot facility for test automation. Supports:
 *
 * - Viewport screenshots with timestamped filenames
 * - Failure-context screenshots (auto-named by scenario)
 * - Full-page screenshots (Chrome DevTools / Firefox)
 * - Element-level screenshots
 * - Base64-encoded capture for report embedding
 * - Automatic cleanup of old screenshot files
 *
 * All screenshots are saved to `<projectRoot>/screenshots/`.
 *
 * @module ScreenshotManager
 * @example
 * const { ScreenshotManager } = require('@wdio-framework/core');
 *
 * // Viewport screenshot
 * const filePath = await ScreenshotManager.capture('login-page');
 *
 * // Full-page screenshot
 * const fullPath = await ScreenshotManager.captureFullPage('dashboard');
 *
 * // Base64 for Cucumber reports
 * const base64 = await ScreenshotManager.captureAsBase64();
 */

const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('./Logger');
const { DateHelper } = require('../helpers/DateHelper');

const logger = Logger.getInstance('ScreenshotManager');
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

/**
 * Static utility class for capturing and managing screenshots.
 *
 * @class ScreenshotManager
 */
class ScreenshotManager {
    static {
        fs.ensureDirSync(SCREENSHOT_DIR);
    }

    /**
     * Take a viewport screenshot and save with a descriptive name.
     *
     * @param {string} [name='screenshot'] Descriptive label (sanitised for filesystem use)
     * @returns {Promise<string|null>} Absolute path to the saved PNG, or `null` on failure
     *
     * @example
     * const path = await ScreenshotManager.capture('after-login');
     * // => 'C:/project/screenshots/after-login_20240115_143022.png'
     */
    static async capture(name = 'screenshot') {
        const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = DateHelper.fileTimestamp();
        const fileName = `${sanitized}_${timestamp}.png`;
        const filePath = path.join(SCREENSHOT_DIR, fileName);

        try {
            await browser.saveScreenshot(filePath);
            logger.info(`Screenshot saved: ${filePath}`);
            return filePath;
        } catch (err) {
            logger.error(`Failed to capture screenshot "${name}": ${err.message}`);
            return null;
        }
    }

    /**
     * Capture a screenshot on failure, naming it by scenario.
     * The scenario name is sanitised and prefixed with `FAILED_`.
     *
     * @param {string} scenarioName  The Cucumber/test scenario name
     * @returns {Promise<string|null>} Absolute file path or `null`
     *
     * @example
     * await ScreenshotManager.captureOnFailure('Login with invalid credentials');
     */
    static async captureOnFailure(scenarioName) {
        const sanitized = scenarioName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
        return this.capture(`FAILED_${sanitized}`);
    }

    /**
     * Capture a full-page screenshot by scrolling and stitching (if supported).
     * Falls back to `browser.saveFullPageScreenshot()` which is supported by
     * chromium-based browsers and geckodriver. If neither method works,
     * a standard viewport screenshot is taken instead.
     *
     * @param {string} [name='fullpage'] Descriptive label for the screenshot
     * @returns {Promise<string>} Absolute path to the saved PNG
     *
     * @example
     * const path = await ScreenshotManager.captureFullPage('long-report-page');
     */
    static async captureFullPage(name = 'fullpage') {
        const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = DateHelper.fileTimestamp();
        const fileName = `${sanitized}_${timestamp}.png`;
        const filePath = path.join(SCREENSHOT_DIR, fileName);

        try {
            // WDIO's full-page screenshot (Chrome DevTools Protocol / Firefox)
            await browser.saveFullPageScreenshot(filePath);
        } catch {
            // Fallback to standard viewport screenshot
            logger.warn('Full-page screenshot not supported, falling back to viewport capture');
            await browser.saveScreenshot(filePath);
        }

        logger.info(`Full-page screenshot saved: ${filePath}`);
        return filePath;
    }

    /**
     * Take a screenshot of a specific element.
     *
     * @param {string|WebdriverIO.Element} element  CSS selector string or WDIO element
     * @param {string} [name='element'] Descriptive label
     * @returns {Promise<string>} Absolute path to the saved PNG
     *
     * @example
     * // By selector
     * await ScreenshotManager.captureElement('.error-message', 'validation-error');
     *
     * // By element reference
     * const el = await $('header');
     * await ScreenshotManager.captureElement(el, 'page-header');
     */
    static async captureElement(element, name = 'element') {
        const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = DateHelper.fileTimestamp();
        const fileName = `${sanitized}_${timestamp}.png`;
        const filePath = path.join(SCREENSHOT_DIR, fileName);

        const el = typeof element === 'string' ? await $(element) : await element;
        await el.saveScreenshot(filePath);
        logger.info(`Element screenshot saved: ${filePath}`);
        return filePath;
    }

    /**
     * Clean up screenshots older than a given number of days.
     * Only files in the screenshot directory are considered; subdirectories are skipped.
     *
     * @param {number} [daysOld=7] Delete files older than this many days
     * @returns {void}
     *
     * @example
     * // Remove screenshots older than 14 days
     * ScreenshotManager.cleanOldScreenshots(14);
     */
    static cleanOldScreenshots(daysOld = 7) {
        const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
        const files = fs.readdirSync(SCREENSHOT_DIR);
        let deleted = 0;

        for (const file of files) {
            const filePath = path.join(SCREENSHOT_DIR, file);
            const stats = fs.statSync(filePath);
            if (!stats.isFile()) continue;
            if (stats.mtimeMs < cutoff) {
                try {
                    fs.unlinkSync(filePath);
                    deleted++;
                } catch (err) {
                    logger.warn(`Could not delete ${file}: ${err.message}`);
                }
            }
        }

        logger.info(`Cleaned ${deleted} old screenshots`);
    }

    /**
     * Return a Base64-encoded screenshot for embedding in reports.
     *
     * @returns {Promise<string>} Base64-encoded PNG string
     *
     * @example
     * const base64 = await ScreenshotManager.captureAsBase64();
     * this.attach(Buffer.from(base64, 'base64'), 'image/png');
     */
    static async captureAsBase64() {
        return browser.takeScreenshot();
    }
}

module.exports = { ScreenshotManager };
