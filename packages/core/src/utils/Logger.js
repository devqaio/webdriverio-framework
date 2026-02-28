/**
 * ═══════════════════════════════════════════════════════════════
 * Logger - Parallel-Safe Isolated Logging with Winston
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides colour-coded, timestamped console logging plus
 * file-based log rotation with **per-worker** and **per-scenario**
 * isolation for parallel test execution.
 *
 * Log isolation strategy:
 *   • Main process   → logs/main.log
 *   • Worker 0-0     → logs/worker-0-0/worker.log
 *   • Scenario "X"   → logs/worker-0-0/scenario_X.log
 *   • Errors (all)   → logs/errors.log  (aggregated)
 *
 * Usage:
 *   Logger.setWorkerContext('0-0');              // in WDIO `before` hook
 *   Logger.setScenarioContext('Login test');     // in `beforeScenario` hook
 *   Logger.clearScenarioContext();               // in `afterScenario` hook
 *   const log = Logger.getInstance('BasePage');  // module-level
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
fs.ensureDirSync(LOG_DIR);

// ─── Formats ──────────────────────────────────────────────────

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, label, worker, scenario }) => {
        const ctx = [worker, scenario].filter(Boolean).join('/');
        const prefix = ctx ? ` (${ctx})` : '';
        return `${timestamp} ${level} [${label}]${prefix} ${message}`;
    }),
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, label, worker, scenario }) => {
        const ctx = [worker, scenario].filter(Boolean).join('/');
        const prefix = ctx ? ` (${ctx})` : '';
        return `${timestamp} ${level.toUpperCase().padEnd(7)} [${label}]${prefix} ${message}`;
    }),
);

// ─── Logger Class ─────────────────────────────────────────────

class Logger {
    /** @private Cache of Winston logger instances keyed by label */
    static _instances = {};

    /** @private Current worker CID (set once per worker process) */
    static _workerCid = null;

    /** @private Current scenario name (set/cleared per scenario) */
    static _scenarioName = null;

    /** @private Per-scenario file transports (managed lifecycle) */
    static _scenarioTransports = new Map();

    /** @private Guard against double flush */
    static _flushed = false;

    // ─── Worker / Scenario Context ────────────────────────────

    /**
     * Set the worker context (call once in WDIO `before` hook).
     * Creates a per-worker log directory and reconfigures all
     * existing loggers to write to worker-scoped files.
     *
     * @param {string} cid  Worker ID, e.g. '0-0', '0-1'
     */
    static setWorkerContext(cid) {
        if (Logger._workerCid === cid) return; // idempotent
        Logger._workerCid = cid;

        const workerDir = path.join(LOG_DIR, `worker-${cid}`);
        fs.ensureDirSync(workerDir);

        // Rebuild every cached logger with worker-scoped file transports
        for (const [label, existing] of Object.entries(Logger._instances)) {
            existing.close();
            Logger._instances[label] = Logger._createLogger(label);
        }
    }

    /**
     * Set or update the current scenario context.
     * Adds a dedicated scenario log file transport to every logger.
     *
     * @param {string} scenarioName
     */
    static setScenarioContext(scenarioName) {
        Logger._scenarioName = scenarioName;

        const sanitized = scenarioName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 120);
        const workerDir = Logger._workerCid
            ? path.join(LOG_DIR, `worker-${Logger._workerCid}`)
            : LOG_DIR;

        fs.ensureDirSync(workerDir);
        const scenarioFile = path.join(workerDir, `scenario_${sanitized}.log`);

        const transport = new winston.transports.File({
            filename: scenarioFile,
            format: fileFormat,
            maxsize: 5 * 1024 * 1024,
            maxFiles: 2,
        });

        // Attach transport to every active logger
        for (const loggerInstance of Object.values(Logger._instances)) {
            loggerInstance.add(transport);
        }

        Logger._scenarioTransports.set(scenarioName, transport);
    }

    /**
     * Remove the scenario-specific transport (call in `afterScenario`).
     */
    static clearScenarioContext() {
        const scenarioName = Logger._scenarioName;
        Logger._scenarioName = null;

        if (!scenarioName) return;

        const transport = Logger._scenarioTransports.get(scenarioName);
        if (transport) {
            for (const loggerInstance of Object.values(Logger._instances)) {
                try { loggerInstance.remove(transport); } catch { /* already removed */ }
            }
            transport.close();
            Logger._scenarioTransports.delete(scenarioName);
        }
    }

    // ─── Instance Management ──────────────────────────────────

    /**
     * Return a named logger (cached per label).
     * Automatically scoped to the current worker when context is set.
     *
     * @param {string} label  Module or component name
     * @returns {winston.Logger}
     */
    static getInstance(label = 'Framework') {
        if (!Logger._instances[label]) {
            Logger._instances[label] = Logger._createLogger(label);
        }
        return Logger._instances[label];
    }

    /**
     * @private Create a new Winston logger with appropriate transports.
     */
    static _createLogger(label) {
        const transports = [
            new winston.transports.Console({ format: consoleFormat }),
        ];

        // Worker-scoped or main-process file transport
        if (Logger._workerCid) {
            const workerDir = path.join(LOG_DIR, `worker-${Logger._workerCid}`);
            fs.ensureDirSync(workerDir);
            transports.push(
                new winston.transports.File({
                    filename: path.join(workerDir, 'worker.log'),
                    format: fileFormat,
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 5,
                }),
            );
        } else {
            transports.push(
                new winston.transports.File({
                    filename: path.join(LOG_DIR, 'main.log'),
                    format: fileFormat,
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 5,
                }),
            );
        }

        // Aggregated error log (always)
        transports.push(
            new winston.transports.File({
                filename: path.join(LOG_DIR, 'errors.log'),
                level: 'error',
                format: fileFormat,
                maxsize: 10 * 1024 * 1024,
                maxFiles: 3,
            }),
        );

        // Re-attach scenario transport if one is active
        const scenarioTransport = Logger._scenarioName
            ? Logger._scenarioTransports.get(Logger._scenarioName)
            : null;
        if (scenarioTransport) {
            transports.push(scenarioTransport);
        }

        const winstonLogger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            defaultMeta: {
                label,
                get worker() { return Logger._workerCid; },
                get scenario() { return Logger._scenarioName; },
            },
            transports,
            handleExceptions: true,
            handleRejections: true,
            exitOnError: false,
        });

        return winstonLogger;
    }

    // ─── Lifecycle ────────────────────────────────────────────

    /**
     * Gracefully flush and close all transports.
     * Safe to call multiple times.
     */
    static async flushAll() {
        if (Logger._flushed) return;
        Logger._flushed = true;

        // Clear any active scenario transports
        for (const [, transport] of Logger._scenarioTransports) {
            try { transport.close(); } catch { /* ignore */ }
        }
        Logger._scenarioTransports.clear();

        // End all logger instances
        const promises = Object.values(Logger._instances).map(
            (loggerInstance) =>
                new Promise((resolve) => {
                    loggerInstance.on('finish', resolve);
                    loggerInstance.end();
                }),
        );
        await Promise.all(promises);
        Logger._instances = {};
    }

    /**
     * Reset logger state (useful for test isolation in unit tests).
     */
    static reset() {
        for (const inst of Object.values(Logger._instances)) {
            try { inst.close(); } catch { /* ignore */ }
        }
        Logger._instances = {};
        Logger._workerCid = null;
        Logger._scenarioName = null;
        Logger._scenarioTransports.clear();
        Logger._flushed = false;
    }
}

module.exports = { Logger };
