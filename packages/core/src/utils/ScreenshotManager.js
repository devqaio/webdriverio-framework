/**
 * ═══════════════════════════════════════════════════════════════
 * ScreenshotManager - Intelligent Screenshot Capture
 * ═══════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('./Logger');
const { DateHelper } = require('../helpers/DateHelper');

const logger = Logger.getInstance('ScreenshotManager');
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

class ScreenshotManager {
    static {
        fs.ensureDirSync(SCREENSHOT_DIR);
    }

    /**
     * Take a viewport screenshot and save with a descriptive name.
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
     */
    static async captureOnFailure(scenarioName) {
        const sanitized = scenarioName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
        return this.capture(`FAILED_${sanitized}`);
    }

    /**
     * Capture a full-page screenshot by scrolling and stitching (if supported).
     * Falls back to `browser.saveFullPageScreenshot()` which is supported by
     * chromium-based browsers and geckodriver.
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
     */
    static async captureAsBase64() {
        return browser.takeScreenshot();
    }
}

module.exports = { ScreenshotManager };
