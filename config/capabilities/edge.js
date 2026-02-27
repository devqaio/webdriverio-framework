/**
 * ═══════════════════════════════════════════════════════════════
 * Microsoft Edge Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

function getEdgeCapabilities(options = {}) {
    const isHeadless = process.env.HEADLESS === 'true' || options.headless;
    const width = parseInt(process.env.WINDOW_WIDTH, 10) || 1920;
    const height = parseInt(process.env.WINDOW_HEIGHT, 10) || 1080;

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

    return {
        browserName: 'MicrosoftEdge',
        'ms:edgeOptions': {
            args: edgeArgs,
            ...(options.edgeOptions || {}),
        },
    };
}

module.exports = { getEdgeCapabilities };
