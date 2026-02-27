/**
 * ═══════════════════════════════════════════════════════════════════════
 * ExcelHelper — Excel Data Externalization for Test Automation
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Read and write Excel (.xlsx) workbooks to externalise test data,
 * enabling non-technical stakeholders to maintain data sets directly
 * in spreadsheets while keeping tests clean and maintainable.
 *
 * Capabilities:
 *   • Read entire workbook, specific sheets, or named ranges
 *   • Convert sheets to arrays of objects (header-row mapping)
 *   • Filter rows by column values for targeted data sets
 *   • Write test results back to Excel for traceability
 *   • Create new workbooks from test output
 *   • Support multiple data formats (string, number, date, boolean)
 *
 * Dependencies:  npm install xlsx
 *
 * Usage:
 *   const { ExcelHelper } = require('../src/helpers/ExcelHelper');
 *   const data  = ExcelHelper.readSheet('test/data/testData.xlsx', 'LoginTests');
 *   const rows  = ExcelHelper.getFilteredRows('test/data/testData.xlsx', 'LoginTests', { execute: 'Y' });
 * ═══════════════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('../utils/Logger');

const logger = Logger.getInstance('ExcelHelper');

/** Lazy-load xlsx to avoid hard failure when not installed. */
function getXlsx() {
    try {
        return require('xlsx');
    } catch {
        throw new Error(
            'Package "xlsx" is required for ExcelHelper. Install it: npm install xlsx',
        );
    }
}

class ExcelHelper {
    // ─── Read Operations ──────────────────────────────────────

    /**
     * Read an entire workbook and return all sheets as an object.
     *
     * @param {string} filePath  Path to .xlsx file
     * @returns {{ [sheetName: string]: object[] }}  Sheet name → rows
     */
    static readWorkbook(filePath) {
        const XLSX = getXlsx();
        const absPath = path.resolve(filePath);
        logger.info(`Reading workbook: ${absPath}`);

        if (!fs.existsSync(absPath)) {
            throw new Error(`Excel file not found: ${absPath}`);
        }

        const workbook = XLSX.readFile(absPath, { cellDates: true });
        const result = {};

        for (const sheetName of workbook.SheetNames) {
            result[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                defval: '',
                raw: false,
            });
        }

        logger.debug(`Loaded ${workbook.SheetNames.length} sheet(s) from ${absPath}`);
        return result;
    }

    /**
     * Read a specific sheet from an Excel file and return rows as objects.
     * Column headers in row 1 become property names.
     *
     * @param {string} filePath   Path to .xlsx file
     * @param {string} sheetName  Name of the sheet to read
     * @returns {object[]}  Array of row objects
     */
    static readSheet(filePath, sheetName) {
        const XLSX = getXlsx();
        const absPath = path.resolve(filePath);
        logger.info(`Reading sheet "${sheetName}" from: ${absPath}`);

        if (!fs.existsSync(absPath)) {
            throw new Error(`Excel file not found: ${absPath}`);
        }

        const workbook = XLSX.readFile(absPath, { cellDates: true });
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
            const available = workbook.SheetNames.join(', ');
            throw new Error(`Sheet "${sheetName}" not found. Available: ${available}`);
        }

        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
        logger.debug(`Read ${rows.length} row(s) from sheet "${sheetName}"`);
        return rows;
    }

    /**
     * Read a sheet and return raw 2-D array (no header mapping).
     *
     * @param {string} filePath
     * @param {string} sheetName
     * @returns {any[][]}
     */
    static readSheetAsArray(filePath, sheetName) {
        const XLSX = getXlsx();
        const absPath = path.resolve(filePath);
        const workbook = XLSX.readFile(absPath, { cellDates: true });
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
            throw new Error(`Sheet "${sheetName}" not found in ${absPath}`);
        }

        return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    }

    /**
     * Get the names of all sheets in a workbook.
     *
     * @param {string} filePath
     * @returns {string[]}
     */
    static getSheetNames(filePath) {
        const XLSX = getXlsx();
        const absPath = path.resolve(filePath);
        const workbook = XLSX.readFile(absPath);
        return workbook.SheetNames;
    }

    // ─── Filtered / Targeted Reads ────────────────────────────

    /**
     * Read rows from a sheet that match ALL specified column filters.
     * Useful for targeted test execution based on data flags.
     *
     * @example
     *   // Get only rows where Execute = 'Y' and Environment = 'staging'
     *   ExcelHelper.getFilteredRows('data.xlsx', 'Tests', {
     *       Execute: 'Y',
     *       Environment: 'staging',
     *   });
     *
     * @param {string}  filePath
     * @param {string}  sheetName
     * @param {object}  filters  Key-value pairs to match (case-insensitive values)
     * @returns {object[]}
     */
    static getFilteredRows(filePath, sheetName, filters = {}) {
        const rows = ExcelHelper.readSheet(filePath, sheetName);
        const filterEntries = Object.entries(filters);

        if (filterEntries.length === 0) return rows;

        const filtered = rows.filter((row) =>
            filterEntries.every(([key, value]) => {
                const cellValue = String(row[key] || '').trim().toLowerCase();
                const filterValue = String(value).trim().toLowerCase();
                return cellValue === filterValue;
            }),
        );

        logger.info(
            `Filtered ${rows.length} → ${filtered.length} row(s) using: ${JSON.stringify(filters)}`,
        );
        return filtered;
    }

    /**
     * Read rows where the "Execute" (or custom) flag column equals 'Y' or 'Yes'.
     *
     * @param {string} filePath
     * @param {string} sheetName
     * @param {string} [flagColumn='Execute']  Column name containing the flag
     * @returns {object[]}
     */
    static getExecutableRows(filePath, sheetName, flagColumn = 'Execute') {
        const rows = ExcelHelper.readSheet(filePath, sheetName);
        return rows.filter((row) => {
            const flag = String(row[flagColumn] || '').trim().toLowerCase();
            return flag === 'y' || flag === 'yes' || flag === 'true' || flag === '1';
        });
    }

    /**
     * Get a single row by a unique key column.
     *
     * @param {string} filePath
     * @param {string} sheetName
     * @param {string} keyColumn    Column name to match
     * @param {string} keyValue     Value to find
     * @returns {object|null}
     */
    static getRowByKey(filePath, sheetName, keyColumn, keyValue) {
        const rows = ExcelHelper.readSheet(filePath, sheetName);
        return (
            rows.find(
                (row) =>
                    String(row[keyColumn] || '').trim().toLowerCase() ===
                    String(keyValue).trim().toLowerCase(),
            ) || null
        );
    }

    /**
     * Get unique values from a specific column.
     *
     * @param {string} filePath
     * @param {string} sheetName
     * @param {string} columnName
     * @returns {string[]}
     */
    static getUniqueColumnValues(filePath, sheetName, columnName) {
        const rows = ExcelHelper.readSheet(filePath, sheetName);
        const values = rows.map((row) => String(row[columnName] || '').trim()).filter(Boolean);
        return [...new Set(values)];
    }

    // ─── Write Operations ─────────────────────────────────────

    /**
     * Write an array of objects to a new Excel workbook.
     *
     * @param {string}   filePath   Destination path
     * @param {object[]} data       Array of row objects
     * @param {string}   [sheetName='Sheet1']
     */
    static writeToExcel(filePath, data, sheetName = 'Sheet1') {
        const XLSX = getXlsx();
        const absPath = path.resolve(filePath);
        fs.ensureDirSync(path.dirname(absPath));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Auto-size columns
        ExcelHelper._autoSizeColumns(worksheet, data);

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, absPath);
        logger.info(`Wrote ${data.length} row(s) to ${absPath}`);
    }

    /**
     * Append rows to an existing sheet (or create it if the file doesn't exist).
     *
     * @param {string}   filePath
     * @param {object[]} newRows
     * @param {string}   [sheetName='Sheet1']
     */
    static appendToExcel(filePath, newRows, sheetName = 'Sheet1') {
        const XLSX = getXlsx();
        const absPath = path.resolve(filePath);

        let workbook;
        let existingRows = [];

        if (fs.existsSync(absPath)) {
            workbook = XLSX.readFile(absPath, { cellDates: true });
            if (workbook.Sheets[sheetName]) {
                existingRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
            }
        } else {
            workbook = XLSX.utils.book_new();
        }

        const allRows = [...existingRows, ...newRows];
        const worksheet = XLSX.utils.json_to_sheet(allRows);
        ExcelHelper._autoSizeColumns(worksheet, allRows);

        if (workbook.SheetNames.includes(sheetName)) {
            workbook.Sheets[sheetName] = worksheet;
        } else {
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        fs.ensureDirSync(path.dirname(absPath));
        XLSX.writeFile(workbook, absPath);
        logger.info(`Appended ${newRows.length} row(s) to "${sheetName}" in ${absPath}`);
    }

    /**
     * Update specific cells in an existing workbook.
     *
     * @param {string} filePath
     * @param {string} sheetName
     * @param {string} cellAddress  e.g. 'B2'
     * @param {*}      value
     */
    static updateCell(filePath, sheetName, cellAddress, value) {
        const XLSX = getXlsx();
        const absPath = path.resolve(filePath);
        const workbook = XLSX.readFile(absPath);
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

        sheet[cellAddress] = { t: 's', v: String(value) };
        XLSX.writeFile(workbook, absPath);
        logger.debug(`Updated ${sheetName}!${cellAddress} = "${value}"`);
    }

    // ─── Conversion Utilities ─────────────────────────────────

    /**
     * Convert an Excel sheet to JSON and save to disk.
     */
    static excelToJson(excelPath, sheetName, jsonPath) {
        const data = ExcelHelper.readSheet(excelPath, sheetName);
        const absJson = path.resolve(jsonPath);
        fs.ensureDirSync(path.dirname(absJson));
        fs.writeJsonSync(absJson, data, { spaces: 2 });
        logger.info(`Converted sheet "${sheetName}" → ${absJson}`);
        return data;
    }

    /**
     * Convert a JSON file to an Excel workbook.
     */
    static jsonToExcel(jsonPath, excelPath, sheetName = 'Sheet1') {
        const absJson = path.resolve(jsonPath);
        const data = fs.readJsonSync(absJson);
        ExcelHelper.writeToExcel(excelPath, data, sheetName);
        return data;
    }

    // ─── Data-Driven Test Helpers ─────────────────────────────

    /**
     * Build a Cucumber Scenario Outline Examples table string from
     * filtered Excel rows.
     *
     * @param {string} filePath
     * @param {string} sheetName
     * @param {string[]} columns   Column names to include
     * @param {object}  [filters]  Optional row filters
     * @returns {string}  Gherkin-formatted Examples table
     */
    static toGherkinExamples(filePath, sheetName, columns, filters = {}) {
        const rows = Object.keys(filters).length
            ? ExcelHelper.getFilteredRows(filePath, sheetName, filters)
            : ExcelHelper.readSheet(filePath, sheetName);

        const header = `      | ${columns.join(' | ')} |`;
        const body = rows
            .map((row) => `      | ${columns.map((col) => row[col] || '').join(' | ')} |`)
            .join('\n');

        return `${header}\n${body}`;
    }

    /**
     * Convert rows to Cucumber DataTable format (array of arrays).
     */
    static toCucumberTable(filePath, sheetName, columns, filters = {}) {
        const rows = Object.keys(filters).length
            ? ExcelHelper.getFilteredRows(filePath, sheetName, filters)
            : ExcelHelper.readSheet(filePath, sheetName);

        return [columns, ...rows.map((row) => columns.map((col) => String(row[col] || '')))];
    }

    // ─── Private Helpers ──────────────────────────────────────

    /** Auto-size columns based on content width. */
    static _autoSizeColumns(worksheet, data) {
        if (!data.length) return;
        const keys = Object.keys(data[0]);
        worksheet['!cols'] = keys.map((key) => {
            const maxLen = Math.max(
                key.length,
                ...data.map((row) => String(row[key] || '').length),
            );
            return { wch: Math.min(maxLen + 2, 50) };
        });
    }
}

module.exports = { ExcelHelper };
