/**
 * ═══════════════════════════════════════════════════════════════
 * Firefox Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

const { ConfigResolver } = require('@wdio-framework/core');

function getFirefoxCapabilities(options = {}) {
    const isHeadless = ConfigResolver.getBool('HEADLESS') || options.headless;
    const width = ConfigResolver.getInt('WINDOW_WIDTH', 1920);
    const height = ConfigResolver.getInt('WINDOW_HEIGHT', 1080);

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
