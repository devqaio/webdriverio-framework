/**
 * ═══════════════════════════════════════════════════════════════════════
 * Web WDIO Configuration Template — @wdio-framework/ui
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Ready-to-use WebdriverIO configuration for web/browser testing.
 * Consumers can import and extend this with their own overrides:
 *
 *   const { webConfig } = require('@wdio-framework/ui/src/config/wdio.web.conf');
 *   const { deepmerge } = require('deepmerge');
 *   exports.config = deepmerge(webConfig, { baseUrl: 'https://myapp.com' });
 *
 * Or use it directly:
 *   npx wdio run node_modules/@wdio-framework/ui/src/config/wdio.web.conf.js
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();

const path = require('path');
const { createBaseHooks, Logger } = require('@wdio-framework/core');
const { resolveWebCapabilities } = require('./capabilities');

const ROOT = process.cwd();

const hooks = createBaseHooks({
    reportsDir: path.join(ROOT, 'reports'),
    logsDir: path.join(ROOT, 'logs'),
});

const webConfig = {
    // ─── Runner ───────────────────────────────────────────────
    runner: 'local',

    // ─── Grid / Server (leave empty for local) ────────────────
    hostname: process.env.SELENIUM_HUB_HOST || undefined,
    port: process.env.SELENIUM_HUB_PORT ? parseInt(process.env.SELENIUM_HUB_PORT) : undefined,
    path: process.env.SELENIUM_HUB_PATH || undefined,

    // ─── Test Files ───────────────────────────────────────────
    specs: [path.join(ROOT, 'test', 'features', '**', '*.feature')],
    exclude: [],

    // ─── Parallel Execution ───────────────────────────────────
    maxInstances: parseInt(process.env.MAX_INSTANCES, 10) || 5,

    // ─── Capabilities ─────────────────────────────────────────
    capabilities: [
        {
            maxInstances: parseInt(process.env.MAX_INSTANCES, 10) || 5,
            ...resolveWebCapabilities(process.env.BROWSER || 'chrome'),
        },
    ],

    // ─── Log Level ────────────────────────────────────────────
    logLevel: process.env.LOG_LEVEL || 'warn',
    outputDir: path.join(ROOT, 'logs'),

    // ─── Defaults ─────────────────────────────────────────────
    bail: 0,
    baseUrl: process.env.BASE_URL || 'https://example.com',
    waitforTimeout: parseInt(process.env.TIMEOUT_IMPLICIT, 10) || 15000,
    connectionRetryTimeout: 120000,
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
        timeout: 120000,
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
    // Add browser-driver services as needed. Example:
    // ['chromedriver', {}], ['geckodriver', {}], ['selenium-standalone', {}]
    services: [],

    // ─── Hooks (from core) ────────────────────────────────────
    ...hooks,
};

// Allow direct execution: npx wdio run this-file.js
exports.config = webConfig;

// Allow import for merging
module.exports.webConfig = webConfig;
