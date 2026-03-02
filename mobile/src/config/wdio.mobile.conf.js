/**
 * ═══════════════════════════════════════════════════════════════════════
 * Mobile WDIO Configuration Template — @wdio-framework/mobile
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Ready-to-use WebdriverIO configuration for mobile/Appium testing.
 * Consumers can import and extend this with their own overrides:
 *
 *   const { mobileConfig } = require('@wdio-framework/mobile/src/config/wdio.mobile.conf');
 *   const { deepmerge } = require('deepmerge');
 *   exports.config = deepmerge(mobileConfig, { capabilities: [...] });
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();

const path = require('path');
const { createBaseHooks, ConfigResolver } = require('@wdio-framework/core');

ConfigResolver.init();
const { resolveMobileCapabilities } = require('./capabilities');

const ROOT = process.cwd();

const hooks = createBaseHooks({
    reportsDir: path.join(ROOT, 'reports'),
    logsDir: path.join(ROOT, 'logs'),
});

const mobileConfig = {
    // ─── Runner ───────────────────────────────────────────────
    runner: 'local',

    // ─── Appium Server ────────────────────────────────────────
    hostname: ConfigResolver.get('APPIUM_HOST', '127.0.0.1'),
    port: ConfigResolver.getInt('APPIUM_PORT', 4723),
    path: '/',

    // ─── Test Files ───────────────────────────────────────────
    specs: [path.join(ROOT, 'test', 'features', '**', '*.feature')],
    exclude: [],

    // ─── Parallel Execution ───────────────────────────────────
    maxInstances: ConfigResolver.getInt('MAX_INSTANCES', 1),

    // ─── Capabilities ─────────────────────────────────────────
    capabilities: [
        {
            maxInstances: 1,
            ...resolveMobileCapabilities(ConfigResolver.get('MOBILE_PLATFORM', 'android')),
        },
    ],

    // ─── Log Level ────────────────────────────────────────────
    logLevel: ConfigResolver.get('LOG_LEVEL', 'warn'),
    outputDir: path.join(ROOT, 'logs'),

    // ─── Defaults ─────────────────────────────────────────────
    bail: 0,
    waitforTimeout: ConfigResolver.getInt('TIMEOUT_IMPLICIT', 30000),
    connectionRetryTimeout: 180000,
    connectionRetryCount: 3,

    // ─── Framework: Cucumber ──────────────────────────────────
    framework: 'cucumber',
    cucumberOpts: {
        require: [
            path.join(ROOT, 'test', 'step-definitions', '**', '*.steps.js'),
        ],
        backtrace: false,
        dryRun: false,
        failFast: false,
        snippets: true,
        source: true,
        strict: true,
        tagExpression: ConfigResolver.get('TAG_EXPRESSION', ''),
        timeout: 180000,
        retry: ConfigResolver.getInt('RETRY_COUNT', 1),
    },

    // ─── Spec Retries ─────────────────────────────────────────
    specFileRetries: ConfigResolver.getInt('SPEC_FILE_RETRIES', 0),
    specFileRetriesDelay: 0,
    specFileRetriesDeferred: false,

    // ─── Reporters ────────────────────────────────────────────
    reporters: [
        'spec',
        ['allure', {
            outputDir: path.join(ROOT, 'reports', 'allure-results'),
            disableWebdriverStepsReporting: false,
            disableWebdriverScreenshotsReporting: false,
            useCucumberStepReporter: true,
            addConsoleLogs: true,
        }],
    ],

    // ─── Services ─────────────────────────────────────────────
    services: [
        ['appium', {
            command: 'appium',
            args: {
                relaxedSecurity: ConfigResolver.getBool('APPIUM_RELAXED_SECURITY'),
                log: path.join(ROOT, 'logs', 'appium.log'),
            },
        }],
    ],

    // ─── Hooks (from core) ────────────────────────────────────
    ...hooks,
};

// Allow direct execution
exports.config = mobileConfig;

// Allow import for merging
module.exports.mobileConfig = mobileConfig;
