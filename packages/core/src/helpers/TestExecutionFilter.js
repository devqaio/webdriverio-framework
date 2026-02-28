/**
 * ═══════════════════════════════════════════════════════════════════════
 * TestExecutionFilter — Targeted Test Execution Configuration
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Read a "test execution matrix" from JSON or Excel to decide at
 * runtime which feature files, scenarios, and data sets to execute.
 *
 * Enables teams to maintain an execution schedule in a spreadsheet
 * and have the framework automatically resolve which tests to run.
 *
 * Excel / JSON schema (one row per test):
 *   | TestId | Feature      | Scenario        | Tags       | Execute | Env     | Browser  |
 *   | TC001  | login        | valid_login     | @smoke     | Y       | staging | chrome   |
 *   | TC002  | login        | invalid_login   | @regression| N       | staging | chrome   |
 *
 * Usage:
 *   const filter = new TestExecutionFilter('test/data/execution-matrix.xlsx');
 *   const specs  = filter.getTargetedSpecs();            // feature file paths
 *   const tags   = filter.getTargetedTagExpression();    // @smoke or @TC001 or @TC003
 * ═══════════════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('../utils/Logger');
const { ExcelHelper } = require('./ExcelHelper');

const logger = Logger.getInstance('TestExecutionFilter');

class TestExecutionFilter {
    /**
     * @param {string}  [matrixPath]   Path to execution matrix (xlsx or json)
     * @param {object}  [options]
     * @param {string}  [options.sheetName='ExecutionMatrix']
     * @param {string}  [options.featureDir='test/features']
     * @param {string}  [options.executeColumn='Execute']
     * @param {string}  [options.envColumn='Env']
     * @param {string}  [options.browserColumn='Browser']
     * @param {string}  [options.tagsColumn='Tags']
     * @param {string}  [options.featureColumn='Feature']
     */
    constructor(matrixPath, options = {}) {
        this.matrixPath = matrixPath ? path.resolve(matrixPath) : null;
        this.sheetName = options.sheetName || 'ExecutionMatrix';
        this.featureDir = path.resolve(options.featureDir || 'test/features');
        this.executeColumn = options.executeColumn || 'Execute';
        this.envColumn = options.envColumn || 'Env';
        this.browserColumn = options.browserColumn || 'Browser';
        this.tagsColumn = options.tagsColumn || 'Tags';
        this.featureColumn = options.featureColumn || 'Feature';

        this._matrix = null;
    }

    // ─── Load Matrix ──────────────────────────────────────────

    /**
     * Load the execution matrix from file.
     * Auto-detects format from extension.
     */
    load() {
        if (!this.matrixPath || !fs.existsSync(this.matrixPath)) {
            logger.info('No execution matrix configured — running all tests');
            return this;
        }

        const ext = path.extname(this.matrixPath).toLowerCase();

        if (ext === '.xlsx' || ext === '.xls') {
            this._matrix = ExcelHelper.readSheet(this.matrixPath, this.sheetName);
        } else if (ext === '.json') {
            this._matrix = fs.readJsonSync(this.matrixPath);
            if (!Array.isArray(this._matrix)) {
                this._matrix = Object.values(this._matrix).flat();
            }
        } else {
            throw new Error(`Unsupported matrix format: ${ext}`);
        }

        logger.info(`Loaded execution matrix: ${this._matrix.length} test case(s)`);
        return this;
    }

    // ─── Query ────────────────────────────────────────────────

    /**
     * Get rows that are marked for execution (Execute = Y).
     * Optionally filter by current environment and browser.
     *
     * @param {object} [overrides]
     * @param {string} [overrides.env]      Current environment
     * @param {string} [overrides.browser]  Current browser
     * @returns {object[]}
     */
    getTargetedRows(overrides = {}) {
        if (!this._matrix) return [];

        const env = (overrides.env || process.env.TEST_ENV || '').toLowerCase();
        const browser = (overrides.browser || process.env.BROWSER || '').toLowerCase();

        return this._matrix.filter((row) => {
            // Must be flagged for execution
            const flag = String(row[this.executeColumn] || '').trim().toLowerCase();
            if (flag !== 'y' && flag !== 'yes' && flag !== 'true' && flag !== '1') {
                return false;
            }

            // Optional environment filter
            if (env && row[this.envColumn]) {
                const rowEnv = String(row[this.envColumn]).trim().toLowerCase();
                if (rowEnv && rowEnv !== env && rowEnv !== 'all') return false;
            }

            // Optional browser filter
            if (browser && row[this.browserColumn]) {
                const rowBrowser = String(row[this.browserColumn]).trim().toLowerCase();
                if (rowBrowser && rowBrowser !== browser && rowBrowser !== 'all') return false;
            }

            return true;
        });
    }

    /**
     * Get the list of feature file paths to execute based on the matrix.
     *
     * @param {object} [overrides]
     * @returns {string[]}
     */
    getTargetedSpecs(overrides = {}) {
        const rows = this.getTargetedRows(overrides);

        if (rows.length === 0) {
            logger.info('No targeted specs — returning all features');
            return [path.join(this.featureDir, '**', '*.feature')];
        }

        const featureNames = [...new Set(
            rows.map((r) => String(r[this.featureColumn] || '').trim()).filter(Boolean),
        )];

        const specs = [];
        for (const name of featureNames) {
            const featurePath = this._findFeatureFile(name);
            if (featurePath) specs.push(featurePath);
        }

        logger.info(`Targeted ${specs.length} feature file(s) from ${rows.length} matrix row(s)`);
        return specs.length > 0 ? specs : [path.join(this.featureDir, '**', '*.feature')];
    }

    /**
     * Build a Cucumber tag expression from the targeted rows.
     * Combines test IDs and tags with OR.
     *
     * @param {object} [overrides]
     * @returns {string}
     */
    getTargetedTagExpression(overrides = {}) {
        const rows = this.getTargetedRows(overrides);

        if (rows.length === 0) return '';

        const allTags = new Set();

        for (const row of rows) {
            // Collect explicit tags
            const tags = String(row[this.tagsColumn] || '').trim();
            if (tags) {
                for (const tag of tags.split(/[,;\s]+/)) {
                    const normalised = tag.startsWith('@') ? tag : `@${tag}`;
                    if (normalised.length > 1) allTags.add(normalised);
                }
            }

            // Collect test IDs as tags
            if (row.TestId) {
                const id = String(row.TestId).trim();
                const tagId = id.startsWith('@') ? id : `@${id}`;
                allTags.add(tagId);
            }
        }

        const expression = Array.from(allTags).join(' or ');
        logger.info(`Tag expression: ${expression}`);
        return expression;
    }

    /**
     * Generate a wdio config override object from the matrix.
     * Can be spread into wdio.conf.js capabilities and cucumberOpts.
     *
     * @param {object} [overrides]
     * @returns {object}
     */
    toWdioConfig(overrides = {}) {
        const specs = this.getTargetedSpecs(overrides);
        const tagExpression = this.getTargetedTagExpression(overrides);

        return {
            specs,
            cucumberOpts: {
                tagExpression,
            },
        };
    }

    // ─── Private ──────────────────────────────────────────────

    _findFeatureFile(featureName) {
        // Try exact path first
        const exactPath = path.join(this.featureDir, featureName);
        if (fs.existsSync(exactPath)) return exactPath;

        // Try with .feature extension
        const withExt = path.join(this.featureDir, `${featureName}.feature`);
        if (fs.existsSync(withExt)) return withExt;

        // Search recursively
        const searchName = featureName.replace('.feature', '').toLowerCase();
        return this._searchDir(this.featureDir, searchName);
    }

    _searchDir(dir, searchName) {
        if (!fs.existsSync(dir)) return null;

        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const result = this._searchDir(fullPath, searchName);
                if (result) return result;
            } else if (
                entry.name.endsWith('.feature') &&
                entry.name.replace('.feature', '').toLowerCase().includes(searchName)
            ) {
                return fullPath;
            }
        }
        return null;
    }
}

module.exports = { TestExecutionFilter };
