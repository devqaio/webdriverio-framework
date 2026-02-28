/**
 * ═══════════════════════════════════════════════════════════════
 * Chrome Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

const { ConfigResolver } = require('@wdio-framework/core');

function getChromeCapabilities(options = {}) {
    const isHeadless = ConfigResolver.getBool('HEADLESS') || options.headless;
    const width = ConfigResolver.getInt('WINDOW_WIDTH', 1920);
    const height = ConfigResolver.getInt('WINDOW_HEIGHT', 1080);

    const chromeArgs = [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-popup-blocking',
        `--window-size=${width},${height}`,
    ];

    if (isHeadless) {
        chromeArgs.push('--headless=new');
    }

    if (options.args) {
        chromeArgs.push(...options.args);
    }

    return {
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: chromeArgs,
            prefs: {
                'download.default_directory': options.downloadDir || process.cwd() + '/downloads',
                'download.prompt_for_download': false,
                'download.directory_upgrade': true,
                'safebrowsing.enabled': false,
                'credentials_enable_service': false,
                'profile.password_manager_enabled': false,
            },
            ...(options.chromeOptions || {}),
        },
    };
}

module.exports = { getChromeCapabilities };
