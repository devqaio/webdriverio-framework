/**
 * ═══════════════════════════════════════════════════════════════
 * Microsoft Edge Capabilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Supports an optional custom driver path via options.edgedriverPath.
 * Use with CustomDriverResolver for internal/corporate driver hosting:
 *
 *   const { CustomDriverResolver } = require('@wdio-framework/core');
 *   const driverOverrides = await CustomDriverResolver.resolveEdgeCapabilityOverrides({
 *       hostUrl: 'https://artifacts.corp.net/drivers',
 *       version: '120.0.2210.91',
 *   });
 *   const caps = { ...getEdgeCapabilities(), ...driverOverrides };
 * ═══════════════════════════════════════════════════════════════
 */

const { ConfigResolver } = require('@wdio-framework/core');

function getEdgeCapabilities(options = {}) {
    const isHeadless = ConfigResolver.getBool('HEADLESS') || options.headless;
    const width = ConfigResolver.getInt('WINDOW_WIDTH', 1920);
    const height = ConfigResolver.getInt('WINDOW_HEIGHT', 1080);

    const edgeArgs = [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        `--window-size=${width},${height}`,
    ];

    if (isHeadless) {
        edgeArgs.push('--headless=new');
    }

    if (options.args) {
        edgeArgs.push(...options.args);
    }

    const caps = {
        browserName: 'MicrosoftEdge',
        'ms:edgeOptions': {
            args: edgeArgs,
            ...(options.edgeOptions || {}),
        },
    };

    // If a custom driver path is provided, wire it up
    if (options.edgedriverPath) {
        caps['wdio:edgedriverOptions'] = {
            edgedriverCustomPath: options.edgedriverPath,
        };
    }

    return caps;
}

module.exports = { getEdgeCapabilities };
