/**
 * ═══════════════════════════════════════════════════════════════
 * Firefox Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

function getFirefoxCapabilities(options = {}) {
    const isHeadless = process.env.HEADLESS === 'true' || options.headless;
    const width = parseInt(process.env.WINDOW_WIDTH, 10) || 1920;
    const height = parseInt(process.env.WINDOW_HEIGHT, 10) || 1080;

    const firefoxArgs = [`--width=${width}`, `--height=${height}`];

    if (isHeadless) {
        firefoxArgs.push('--headless');
    }

    if (options.args) {
        firefoxArgs.push(...options.args);
    }

    return {
        browserName: 'firefox',
        'moz:firefoxOptions': {
            args: firefoxArgs,
            prefs: {
                'browser.download.dir': options.downloadDir || process.cwd() + '/downloads',
                'browser.download.folderList': 2,
                'browser.helperApps.neverAsk.saveToDisk': 'application/pdf,application/zip,text/csv,application/json',
                'pdfjs.disabled': true,
                ...(options.prefs || {}),
            },
        },
    };
}

module.exports = { getFirefoxCapabilities };
