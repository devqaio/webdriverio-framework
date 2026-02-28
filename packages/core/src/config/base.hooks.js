/**
 * ═══════════════════════════════════════════════════════════════════════
 * Base Hooks Factory — Reusable WDIO Lifecycle Hooks
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Generates a standard set of WebdriverIO hooks that wire up:
 *   • Per-worker isolated logging
 *   • Per-scenario logging context
 *   • Allure environment & category writing
 *   • Auto-screenshot on failure
 *   • Browser cleanup between scenarios
 *   • Report backup on completion
 *
 * Usage in consumer's wdio.conf.js:
 *   const { createBaseHooks } = require('@wdio-framework/core');
 *   const hooks = createBaseHooks({ reportsDir, logsDir });
 *   exports.config = { ...hooks, ...yourOverrides };
 * ═══════════════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('../utils/Logger');
const { CustomReporter } = require('../utils/Reporter');
const { ReportBackupManager } = require('../utils/ReportBackupManager');
const { ConfigResolver } = require('../utils/ConfigResolver');

/**
 * Create a standard set of WDIO hooks for logging, reporting, and cleanup.
 *
 * @param {Object} options
 * @param {string} options.reportsDir   - Absolute path to the reports output directory
 * @param {string} [options.logsDir]    - Absolute path to the logs directory (default: <cwd>/logs)
 * @param {boolean} [options.screenshotOnFailure=true] - Auto-screenshot on scenario failure
 * @param {boolean} [options.cleanBrowserState=true]   - Clear storage/cookies between scenarios
 * @returns {Object} WDIO hook configuration object to spread into exports.config
 */
function createBaseHooks(options = {}) {
    const {
        reportsDir = path.join(process.cwd(), 'reports'),
        logsDir = path.join(process.cwd(), 'logs'),
        screenshotOnFailure = true,
        cleanBrowserState = true,
    } = options;

    const allureResults = path.join(reportsDir, 'allure-results');
    const cucumberJson = path.join(reportsDir, 'cucumber-json');
    const screenshotsDir = path.join(process.cwd(), 'screenshots');

    // Ensure output directories exist
    [reportsDir, allureResults, cucumberJson, screenshotsDir, logsDir].forEach((d) =>
        fs.ensureDirSync(d),
    );

    const getLogger = () => Logger.getInstance('Config');

    return {
        /**
         * Runs once before all workers are launched.
         */
        onPrepare(config, capabilities) {
            getLogger().info('════════════════════════════════════════════');
            getLogger().info(' Test Execution Starting');
            getLogger().info(`  Environment : ${ConfigResolver.get('TEST_ENV', 'dev')}`);
            getLogger().info(`  Browser     : ${ConfigResolver.browser}`);
            getLogger().info(`  Base URL    : ${config.baseUrl}`);
            getLogger().info(`  Parallel    : ${config.maxInstances} instance(s)`);
            getLogger().info('════════════════════════════════════════════');

            CustomReporter.writeAllureEnvironment(allureResults);
            CustomReporter.writeAllureCategories(allureResults);
        },

        /**
         * Runs before a worker process is spawned.
         */
        onWorkerStart(cid) {
            getLogger().info(`Worker ${cid} started`);
        },

        /**
         * Runs after a worker exits.
         */
        onWorkerEnd(cid, exitCode) {
            getLogger().info(`Worker ${cid} ended with exit code ${exitCode}`);
        },

        /**
         * Runs before each test session (browser launch).
         * Sets up worker-isolated logging.
         */
        async before(capabilities, specs, browserInstance) {
            const cid = browserInstance.options?.cid || process.env.WDIO_WORKER_ID || '0-0';
            Logger.setWorkerContext(cid);

            try {
                await browserInstance.maximizeWindow();
            } catch {
                // Mobile sessions don't support maximize
            }
            getLogger().info(`Browser session initialised (worker: ${cid})`);
        },

        /**
         * Runs after each test session.
         * Flushes worker-scoped logs before the process exits.
         */
        async after() {
            getLogger().info('Browser session closing');
            await Logger.flushAll();
        },

        // ─── Cucumber-specific hooks ──────────────────────────

        beforeFeature(uri, feature) {
            getLogger().info(`▶ Feature: ${feature.name}`);
        },

        afterFeature(uri, feature) {
            getLogger().info(`◀ Feature completed: ${feature.name}`);
        },

        beforeScenario(world) {
            const scenarioName = world.pickle.name;
            Logger.setScenarioContext(scenarioName);
            getLogger().info(`  ▶ Scenario: ${scenarioName}`);
        },

        async afterScenario(world, result) {
            const status = result.passed ? '✓ PASSED' : '✗ FAILED';
            getLogger().info(`  ◀ Scenario ${status}: ${world.pickle.name}`);

            // Auto-screenshot on failure
            if (!result.passed && screenshotOnFailure) {
                try {
                    const screenshot = await browser.takeScreenshot();
                    const cucumberJsonReporter = require('wdio-cucumberjs-json-reporter').default;
                    cucumberJsonReporter.attach(screenshot, 'image/png');
                } catch (err) {
                    getLogger().warn(`Screenshot on failure: ${err.message}`);
                }
            }

            // Clean browser state between scenarios
            if (cleanBrowserState) {
                try {
                    await browser.execute(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                    });
                    await browser.deleteCookies();
                } catch (err) {
                    getLogger().warn(`Browser cleanup: ${err.message}`);
                }
            }

            Logger.clearScenarioContext();
        },

        beforeStep() {
            // No-op by default — extend in consumer config
        },

        async afterStep() {
            // Screenshots handled in afterScenario to avoid duplicates
        },

        /**
         * Runs once after all workers have finished.
         */
        async onComplete(exitCode) {
            getLogger().info('════════════════════════════════════════════');
            getLogger().info(' Test Execution Complete');
            getLogger().info(`  Exit code: ${exitCode}`);
            getLogger().info('════════════════════════════════════════════');

            try {
                CustomReporter.generateCucumberHtmlReport(
                    cucumberJson,
                    path.join(reportsDir, 'cucumber-html'),
                );
            } catch (err) {
                getLogger().warn(`Cucumber report generation: ${err.message}`);
            }

            if (ConfigResolver.getBool('REPORT_BACKUP_ENABLE')) {
                try {
                    const backupManager = new ReportBackupManager({ sourceDir: reportsDir });
                    await backupManager.backup();
                    getLogger().info('Report backup completed successfully');
                } catch (err) {
                    getLogger().warn(`Report backup: ${err.message}`);
                }
            }
        },
    };
}

module.exports = { createBaseHooks };
