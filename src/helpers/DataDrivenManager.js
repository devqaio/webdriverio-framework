/**
 * ═══════════════════════════════════════════════════════════════════════
 * DataDrivenManager — Centralised Test Data Orchestration
 * ═══════════════════════════════════════════════════════════════════════
 *
 * A single entry-point for all test data operations.  Resolves data
 * from JSON files, Excel workbooks, environment variables, or inline
 * defaults — in a prioritised cascade.
 *
 * Design philosophy:
 *   1. Test scripts never hard-code data.
 *   2. Data can be swapped per environment / run without code changes.
 *   3. Targeted execution: only rows that are flagged "Execute = Y"
 *      (or matching tag / filter criteria) are fed into tests.
 *   4. Data sources are pluggable: JSON today, DB tomorrow.
 *
 * Resolution priority (highest → lowest):
 *   Environment variable  →  Excel  →  JSON file  →  inline default
 *
 * Usage:
 *   const ddm = new DataDrivenManager();
 *   ddm.loadJson('test/data/users.json');
 *   ddm.loadExcel('test/data/testData.xlsx', 'LoginTests');
 *   const creds = ddm.get('validUsers.admin');
 *   const rows  = ddm.getTargetedRows('LoginTests', { Execute: 'Y' });
 * ═══════════════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('../utils/Logger');
const { ExcelHelper } = require('./ExcelHelper');

const logger = Logger.getInstance('DataDrivenManager');

class DataDrivenManager {
    constructor() {
        /** @type {Map<string, object>} Loaded data stores keyed by source path / alias */
        this._stores = new Map();
        /** @type {object} Merged flat data object for dot-notation lookups */
        this._cache = {};
    }

    // ─── JSON Data Loading ────────────────────────────────────

    /**
     * Load a JSON data file into the manager.
     *
     * @param {string} filePath  Path to JSON file
     * @param {string} [alias]   Friendly alias (default: filename without ext)
     * @returns {DataDrivenManager}  Fluent API
     */
    loadJson(filePath, alias) {
        const absPath = path.resolve(filePath);
        if (!fs.existsSync(absPath)) {
            throw new Error(`JSON data file not found: ${absPath}`);
        }

        const data = fs.readJsonSync(absPath);
        const key = alias || path.basename(filePath, path.extname(filePath));

        this._stores.set(key, data);
        this._rebuildCache();
        logger.info(`Loaded JSON data source: "${key}" (${absPath})`);
        return this;
    }

    /**
     * Load all JSON files from a directory.
     *
     * @param {string} dirPath  Directory containing .json files
     * @returns {DataDrivenManager}
     */
    loadJsonDir(dirPath) {
        const absDir = path.resolve(dirPath);
        if (!fs.existsSync(absDir)) {
            throw new Error(`Data directory not found: ${absDir}`);
        }

        const files = fs.readdirSync(absDir).filter((f) => f.endsWith('.json'));
        for (const file of files) {
            this.loadJson(path.join(absDir, file));
        }
        logger.info(`Loaded ${files.length} JSON file(s) from ${absDir}`);
        return this;
    }

    // ─── Excel Data Loading ───────────────────────────────────

    /**
     * Load all sheets from an Excel workbook.
     *
     * @param {string} filePath  Path to .xlsx file
     * @param {string} [alias]   Alias prefix
     * @returns {DataDrivenManager}
     */
    loadExcel(filePath, alias) {
        const sheets = ExcelHelper.readWorkbook(filePath);
        const prefix = alias || path.basename(filePath, path.extname(filePath));

        for (const [sheetName, rows] of Object.entries(sheets)) {
            const key = `${prefix}.${sheetName}`;
            this._stores.set(key, rows);
        }

        this._rebuildCache();
        logger.info(`Loaded Excel workbook: "${prefix}" with ${Object.keys(sheets).length} sheet(s)`);
        return this;
    }

    /**
     * Load a specific sheet from an Excel workbook.
     *
     * @param {string} filePath
     * @param {string} sheetName
     * @param {string} [alias]
     * @returns {DataDrivenManager}
     */
    loadExcelSheet(filePath, sheetName, alias) {
        const rows = ExcelHelper.readSheet(filePath, sheetName);
        const key = alias || sheetName;
        this._stores.set(key, rows);
        this._rebuildCache();
        logger.info(`Loaded Excel sheet: "${key}" (${rows.length} rows)`);
        return this;
    }

    // ─── Data Retrieval ───────────────────────────────────────

    /**
     * Get a value using dot-notation path.
     * Falls back to environment variables (with DATA_ prefix).
     *
     * @param {string} keyPath   e.g. 'validUsers.admin.username'
     * @param {*}      [defaultValue]
     * @returns {*}
     */
    get(keyPath, defaultValue = undefined) {
        // 1. Check environment variable  DATA_VALIDUSERS_ADMIN_USERNAME
        const envKey = `DATA_${keyPath.replace(/\./g, '_').toUpperCase()}`;
        if (process.env[envKey] !== undefined) {
            logger.debug(`Resolved "${keyPath}" from env: ${envKey}`);
            return process.env[envKey];
        }

        // 2. Check loaded data
        const value = this._getByPath(this._cache, keyPath);
        if (value !== undefined) return value;

        // 3. Return default
        if (defaultValue !== undefined) return defaultValue;

        logger.warn(`Data key not found: "${keyPath}"`);
        return undefined;
    }

    /**
     * Get a full data store by its alias / key.
     *
     * @param {string} storeKey
     * @returns {object|object[]|undefined}
     */
    getStore(storeKey) {
        return this._stores.get(storeKey);
    }

    /**
     * Get all data stores.
     * @returns {Map<string, object>}
     */
    getAllStores() {
        return new Map(this._stores);
    }

    // ─── Targeted / Filtered Data ─────────────────────────────

    /**
     * Get rows from a loaded store that match filter criteria.
     * Typically used for data-driven execution where only rows
     * flagged for the current run are returned.
     *
     * @param {string} storeKey   Store alias
     * @param {object} [filters]  Column-value pairs to match
     * @returns {object[]}
     */
    getFilteredRows(storeKey, filters = {}) {
        const store = this._stores.get(storeKey);
        if (!store || !Array.isArray(store)) {
            logger.warn(`Store "${storeKey}" not found or is not an array`);
            return [];
        }

        const entries = Object.entries(filters);
        if (entries.length === 0) return store;

        return store.filter((row) =>
            entries.every(([key, value]) => {
                const cell = String(row[key] || '').trim().toLowerCase();
                const target = String(value).trim().toLowerCase();
                return cell === target;
            }),
        );
    }

    /**
     * Get rows marked for execution (Execute = Y / Yes / true).
     *
     * @param {string} storeKey
     * @param {string} [flagColumn='Execute']
     * @returns {object[]}
     */
    getTargetedRows(storeKey, flagColumn = 'Execute') {
        const store = this._stores.get(storeKey);
        if (!store || !Array.isArray(store)) return [];

        return store.filter((row) => {
            const flag = String(row[flagColumn] || '').trim().toLowerCase();
            return flag === 'y' || flag === 'yes' || flag === 'true' || flag === '1';
        });
    }

    /**
     * Get rows where a tag column includes a specific tag.
     * Useful for matching @smoke, @regression, etc. from data.
     *
     * @param {string} storeKey
     * @param {string} tag           e.g. '@smoke'
     * @param {string} [tagColumn='Tags']
     * @returns {object[]}
     */
    getRowsByTag(storeKey, tag, tagColumn = 'Tags') {
        const store = this._stores.get(storeKey);
        if (!store || !Array.isArray(store)) return [];

        const normalised = tag.toLowerCase().replace('@', '');
        return store.filter((row) => {
            const tags = String(row[tagColumn] || '').toLowerCase();
            return tags.includes(normalised) || tags.includes(`@${normalised}`);
        });
    }

    // ─── Data Injection / Substitution ────────────────────────

    /**
     * Replace placeholders in a string with data values.
     * Placeholders use {{key.path}} syntax.
     *
     * @param {string} template  e.g. 'Hello {{validUsers.admin.username}}'
     * @returns {string}
     */
    interpolate(template) {
        return template.replace(/\{\{(.+?)\}\}/g, (match, keyPath) => {
            const val = this.get(keyPath.trim());
            return val !== undefined ? String(val) : match;
        });
    }

    /**
     * Create a deep clone of a data object with placeholders resolved.
     *
     * @param {object} dataObj
     * @returns {object}
     */
    resolveObject(dataObj) {
        const json = JSON.stringify(dataObj);
        const resolved = this.interpolate(json);
        return JSON.parse(resolved);
    }

    // ─── Utility ──────────────────────────────────────────────

    /**
     * Clear all loaded data.
     */
    clear() {
        this._stores.clear();
        this._cache = {};
        logger.debug('DataDrivenManager cleared');
    }

    /**
     * Get a summary of loaded data sources.
     */
    getSummary() {
        const summary = {};
        for (const [key, value] of this._stores) {
            summary[key] = {
                type: Array.isArray(value) ? 'array' : typeof value,
                size: Array.isArray(value) ? value.length : Object.keys(value).length,
            };
        }
        return summary;
    }

    // ─── Private ──────────────────────────────────────────────

    _rebuildCache() {
        this._cache = {};
        for (const [key, value] of this._stores) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                this._deepMerge(this._cache, { [key]: value });
                // Also spread top-level keys for convenience
                this._deepMerge(this._cache, value);
            } else {
                this._cache[key] = value;
            }
        }
    }

    _deepMerge(target, source) {
        for (const key of Object.keys(source)) {
            if (
                source[key] &&
                typeof source[key] === 'object' &&
                !Array.isArray(source[key]) &&
                target[key] &&
                typeof target[key] === 'object'
            ) {
                this._deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    _getByPath(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
}

// Export singleton & class
const dataDrivenManager = new DataDrivenManager();

module.exports = { DataDrivenManager, dataDrivenManager };
