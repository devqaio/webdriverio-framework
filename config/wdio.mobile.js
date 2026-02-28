/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — Mobile Configuration
 * ═══════════════════════════════════════════════════════════════
 *
 * Extends the base configuration with Appium service and mobile
 * capabilities for Android and iOS testing.
 *
 * Usage:
 *   BROWSER=android npx wdio run config/wdio.mobile.js
 *   BROWSER=ios npx wdio run config/wdio.mobile.js
 * ═══════════════════════════════════════════════════════════════
 */

const { deepMerge } = require('./helpers/configHelper');
const baseConfig = require('./wdio.conf').config;
const { resolveCapabilities } = require('./capabilities');

const platform = (process.env.BROWSER || 'android').toLowerCase();

exports.config = deepMerge(baseConfig, {
    // ─── Appium Server ────────────────────────────────────────
    hostname: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
    path: '/',

    // ─── Capabilities ─────────────────────────────────────────
    capabilities: [
        {
            maxInstances: 1,
            ...resolveCapabilities(platform),
        },
    ],

    // ─── Services ─────────────────────────────────────────────
    services: [
        [
            'appium',
            {
                command: 'appium',
                args: {
                    relaxedSecurity: true,
                    address: '127.0.0.1',
                    port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
                },
            },
        ],
    ],

    // ─── Timeouts (mobile is slower) ──────────────────────────
    waitforTimeout: 30000,
    connectionRetryTimeout: 180000,

    // ─── No window maximize on mobile ─────────────────────────
    before: async function (capabilities, specs) {
        // Skip maximize for native apps
        const { Logger } = require('@wdio-framework/core');
        const logger = Logger.getInstance('MobileConfig');
        logger.info('Mobile session initialised');
    },
});
