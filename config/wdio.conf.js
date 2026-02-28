/**
 * ═══════════════════════════════════════════════════════════════════════
 *  WebdriverIO — Base Configuration
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  This is the single source of truth for framework configuration.
 *  Environment-specific overrides (dev, staging, prod, docker) merge
 *  on top of these defaults via deepmerge in their respective files.
 *
 *  Documentation: https://webdriver.io/docs/configuration
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs-extra');
const { resolveCapabilities } = require('./capabilities');
const { CustomReporter, Logger, ReportBackupManager, CustomDriverResolver } = require('@wdio-framework/core');

// Logger for main process (onPrepare, onComplete) — workers get their own context
// Use a getter to always get the current instance (survives setWorkerContext rebuild)
const getLogger = () => Logger.getInstance('Config');

// ─── Directories ──────────────────────────────────────────────────────
const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const ALLURE_RESULTS = path.join(REPORTS_DIR, 'allure-results');
const CUCUMBER_JSON = path.join(REPORTS_DIR, 'cucumber-json');
const TIMELINE_DIR = path.join(REPORTS_DIR, 'timeline');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots');
const LOGS_DIR = path.join(ROOT, 'logs');

// Ensure output directories exist
[REPORTS_DIR, ALLURE_RESULTS, CUCUMBER_JSON, TIMELINE_DIR, SCREENSHOTS_DIR, LOGS_DIR].forEach((d) =>
    fs.ensureDirSync(d),
);

exports.config = {
    // ─── Runner ───────────────────────────────────────────────
    runner: 'local',

    // ─── Server (leave empty to auto-manage drivers) ──────────
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
            ...resolveCapabilities(process.env.BROWSER || 'chrome'),
        },
    ],

    // ─── Log Level ────────────────────────────────────────────
    logLevel: process.env.LOG_LEVEL || 'warn',
    outputDir: LOGS_DIR,

    // ─── Bail (0 = run all, N = stop after N failures) ────────
    bail: 0,

    // ─── Base URL ─────────────────────────────────────────────
    baseUrl: process.env.BASE_URL || 'https://example.com',

    // ─── Timeouts ─────────────────────────────────────────────
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
        requireModule: [],
        dryRun: false,
        failFast: false,
        name: [],
        snippets: true,
        source: true,
        strict: true,
        tagExpression: process.env.TAG_EXPRESSION || '',
        timeout: 120000,
        retry: parseInt(process.env.RETRY_COUNT, 10) || 1,
    },

    // ─── Spec-level Retries ───────────────────────────────────
    specFileRetries: parseInt(process.env.SPEC_FILE_RETRIES, 10) || 0,
    specFileRetriesDelay: 0,
    specFileRetriesDeferred: false,

    // ─── Reporters ────────────────────────────────────────────
    reporters: [
        'spec',
        [
            'allure',
            {
                outputDir: ALLURE_RESULTS,
                disableWebdriverStepsReporting: false,
                disableWebdriverScreenshotsReporting: false,
                useCucumberStepReporter: true,
                addConsoleLogs: true,
            },
        ],
        [
            'cucumberjs-json',
            {
                jsonFolder: CUCUMBER_JSON,
                language: 'en',
            },
        ],
        [
            'timeline',
            {
                outputDir: TIMELINE_DIR,
                embedImages: true,
                screenshotStrategy: 'on:error',
            },
        ],
    ],

    // ═══════════════════════════════════════════════════════════
    //  HOOKS — Lifecycle callbacks
    // ═══════════════════════════════════════════════════════════

    /**
     * Runs once before all workers are launched.
     */
    onPrepare: async function (config, capabilities) {
        getLogger().info('════════════════════════════════════════════');
        getLogger().info(' Test Execution Starting');
        getLogger().info(`  Environment : ${process.env.TEST_ENV || 'dev'}`);
        getLogger().info(`  Browser     : ${process.env.BROWSER || 'chrome'}`);
        getLogger().info(`  Base URL    : ${config.baseUrl}`);
        getLogger().info(`  Parallel    : ${config.maxInstances} instance(s)`);
        getLogger().info('════════════════════════════════════════════');

        // ─── Custom Driver Resolution (when DRIVER_HOST_URL is set) ───
        if (process.env.DRIVER_HOST_URL && process.env.DRIVER_VERSION) {
            try {
                const driverOverrides = await CustomDriverResolver.resolveEdgeCapabilityOverrides();
                // Merge the resolved driver path into each capability
                for (const cap of capabilities) {
                    const target = cap.capabilities || cap;
                    Object.assign(target, driverOverrides);
                }
                getLogger().info('Custom driver resolved and applied to capabilities');
            } catch (err) {
                getLogger().error(`Custom driver resolution failed: ${err.message}`);
                throw err;
            }
        }

        // Write Allure environment & categories
        CustomReporter.writeAllureEnvironment(ALLURE_RESULTS);
        CustomReporter.writeAllureCategories(ALLURE_RESULTS);
    },

    /**
     * Runs before a worker process is spawned.
     */
    onWorkerStart: function (cid, caps, specs, args, execArgv) {
        getLogger().info(`Worker ${cid} started`);
    },

    /**
     * Runs after a worker exits.
     */
    onWorkerEnd: function (cid, exitCode, specs, retries) {
        getLogger().info(`Worker ${cid} ended with exit code ${exitCode}`);
    },

    /**
     * Runs before each test session (browser launch).
     * Sets up worker-isolated logging.
     */
    before: async function (capabilities, specs, browser) {
        // Isolate logs per worker — cid is available on the browser object
        const cid = browser.options?.cid || process.env.WDIO_WORKER_ID || '0-0';
        Logger.setWorkerContext(cid);

        try {
            await browser.maximizeWindow();
        } catch {
            // Mobile sessions don't support maximize
        }
        getLogger().info(`Browser session initialised (worker: ${cid})`);
    },

    /**
     * Runs after each test session.
     * Flushes worker-scoped logs before the process exits.
     */
    after: async function (result, capabilities, specs) {
        getLogger().info('Browser session closing');
        await Logger.flushAll();
    },

    // ─── Cucumber-specific hooks ──────────────────────────────

    beforeFeature: function (uri, feature) {
        getLogger().info(`▶ Feature: ${feature.name}`);
    },

    afterFeature: function (uri, feature) {
        getLogger().info(`◀ Feature completed: ${feature.name}`);
    },

    beforeScenario: function (world, context) {
        const scenarioName = world.pickle.name;
        Logger.setScenarioContext(scenarioName);
        getLogger().info(`  ▶ Scenario: ${scenarioName}`);
    },

    afterScenario: async function (world, result, context) {
        const status = result.passed ? '✓ PASSED' : '✗ FAILED';
        getLogger().info(`  ◀ Scenario ${status}: ${world.pickle.name}`);

        // Auto-screenshot on failure
        if (!result.passed) {
            try {
                const screenshot = await browser.takeScreenshot();
                const cucumberJson = require('wdio-cucumberjs-json-reporter').default;
                cucumberJson.attach(screenshot, 'image/png');
            } catch (err) {
                getLogger().warn(`Screenshot on failure: ${err.message}`);
            }
        }

        // Clean browser state between scenarios
        try {
            await browser.execute(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            await browser.deleteCookies();
        } catch (err) {
            getLogger().warn(`Browser cleanup: ${err.message}`);
        }

        // End scenario-level log isolation
        Logger.clearScenarioContext();
    },

    beforeStep: function (step, scenario, context) {
        // Optional: log each step
    },

    afterStep: async function (step, scenario, result, context) {
        // Screenshots are handled in afterScenario to avoid duplicates.
        // Uncomment below to also capture per-step failures:
        // if (!result.passed) {
        //     try {
        //         const screenshot = await browser.takeScreenshot();
        //         const cucumberJson = require('wdio-cucumberjs-json-reporter').default;
        //         cucumberJson.attach(screenshot, 'image/png');
        //     } catch (err) { /* silently continue */ }
        // }
    },

    /**
     * Runs once after all workers have finished.
     */
    onComplete: async function (exitCode, config, capabilities, results) {
        getLogger().info('════════════════════════════════════════════');
        getLogger().info(' Test Execution Complete');
        getLogger().info(`  Exit code: ${exitCode}`);
        getLogger().info('════════════════════════════════════════════');

        // Generate cucumber HTML report
        try {
            CustomReporter.generateCucumberHtmlReport(
                CUCUMBER_JSON,
                path.join(REPORTS_DIR, 'cucumber-html'),
            );
        } catch (err) {
            getLogger().warn(`Cucumber report generation: ${err.message}`);
        }

        // Backup reports to shared folder (only when enabled)
        if (process.env.REPORT_BACKUP_ENABLE === 'true') {
            try {
                const backupManager = new ReportBackupManager({ sourceDir: REPORTS_DIR });
                await backupManager.backup();
                getLogger().info('Report backup completed successfully');
            } catch (err) {
                getLogger().warn(`Report backup: ${err.message}`);
            }
        }
    },
};
