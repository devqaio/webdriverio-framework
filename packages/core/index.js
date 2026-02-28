/**
 * ═══════════════════════════════════════════════════════════════════════
 * @wdio-framework/core — Package Entry Point
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Core module providing:
 *   • AbstractBasePage   — shared foundation for web & mobile page objects
 *   • Logger, RetryHandler, ScreenshotManager, PerformanceTracker, etc.
 *   • Helpers: ApiHelper, DataGenerator, FileHelper, ExcelHelper, …
 *   • Constants: Timeouts, Environments, Messages
 *   • createBaseHooks()  — reusable WDIO lifecycle hook factory
 *
 * This package is automatically included when you install
 * @wdio-framework/ui or @wdio-framework/mobile.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─── Base ─────────────────────────────────────────────────────
const { AbstractBasePage } = require('./src/base/AbstractBasePage');

// ─── Utilities ────────────────────────────────────────────────
const {
    Logger,
    CustomReporter,
    RetryHandler,
    ScreenshotManager,
    PerformanceTracker,
    ReportBackupManager,
    CustomDriverResolver,
} = require('./src/utils');

// ─── Helpers ──────────────────────────────────────────────────
const {
    ApiHelper,
    DataGenerator,
    FileHelper,
    DateHelper,
    StringHelper,
    EncryptionHelper,
    ExcelHelper,
    DataDrivenManager,
    dataDrivenManager,
    FeatureGenerator,
    TestExecutionFilter,
} = require('./src/helpers');

// ─── Constants ────────────────────────────────────────────────
const {
    Timeouts,
    Environments,
    getEnvironment,
    Messages,
} = require('./src/constants');

// ─── Config Hooks ─────────────────────────────────────────────
const { createBaseHooks } = require('./src/config/base.hooks');

module.exports = {
    // Base
    AbstractBasePage,

    // Utilities
    Logger,
    CustomReporter,
    RetryHandler,
    ScreenshotManager,
    PerformanceTracker,
    ReportBackupManager,
    CustomDriverResolver,

    // Helpers
    ApiHelper,
    DataGenerator,
    FileHelper,
    DateHelper,
    StringHelper,
    EncryptionHelper,
    ExcelHelper,
    DataDrivenManager,
    dataDrivenManager,
    FeatureGenerator,
    TestExecutionFilter,

    // Constants
    Timeouts,
    Environments,
    getEnvironment,
    Messages,

    // Config
    createBaseHooks,
};
