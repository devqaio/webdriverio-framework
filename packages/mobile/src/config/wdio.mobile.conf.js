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
const { createBaseHooks } = require('@wdio-framework/core');
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
    hostname: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
    path: '/',

    // ─── Test Files ───────────────────────────────────────────
    specs: [path.join(ROOT, 'test', 'features', '**', '*.feature')],
    exclude: [],

    // ─── Parallel Execution ───────────────────────────────────
    maxInstances: parseInt(process.env.MAX_INSTANCES, 10) || 1,

    // ─── Capabilities ─────────────────────────────────────────
    capabilities: [
        {
            maxInstances: 1,
            ...resolveMobileCapabilities(process.env.MOBILE_PLATFORM || 'android'),
        },
    ],

    // ─── Log Level ────────────────────────────────────────────
    logLevel: process.env.LOG_LEVEL || 'warn',
    outputDir: path.join(ROOT, 'logs'),

    // ─── Defaults ─────────────────────────────────────────────
    bail: 0,
    waitforTimeout: parseInt(process.env.TIMEOUT_IMPLICIT, 10) || 30000,
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
        tagExpression: process.env.TAG_EXPRESSION || '',
        timeout: 180000,
        retry: parseInt(process.env.RETRY_COUNT, 10) || 1,
    },

    // ─── Spec Retries ─────────────────────────────────────────
    specFileRetries: parseInt(process.env.SPEC_FILE_RETRIES, 10) || 0,
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
                relaxedSecurity: process.env.APPIUM_RELAXED_SECURITY === 'true',
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
