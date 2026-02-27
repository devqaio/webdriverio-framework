/**
 * ═══════════════════════════════════════════════════════════════
 * Chrome Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

function getChromeCapabilities(options = {}) {
    const isHeadless = process.env.HEADLESS === 'true' || options.headless;
    const width = parseInt(process.env.WINDOW_WIDTH, 10) || 1920;
    const height = parseInt(process.env.WINDOW_HEIGHT, 10) || 1080;

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
