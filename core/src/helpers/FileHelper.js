/**
 * ═══════════════════════════════════════════════════════════════
 * FileHelper - File-System Utilities for Test Automation
 * ═══════════════════════════════════════════════════════════════
 *
 * Read, write, parse, and manage files used during automation
 * runs: JSON fixtures, CSV data, downloaded files, etc.
 */

const fs = require('fs-extra');
const path = require('path');
const { Logger } = require('../utils/Logger');

const logger = Logger.getInstance('FileHelper');

/**
 * @class FileHelper
 * @description Static utility class providing comprehensive file-system operations for test
 * automation workflows. Supports reading and writing multiple formats (plain text, JSON, YAML,
 * CSV), directory management, file copy/move operations, download waiting, and temporary file
 * handling. All methods are static — no instantiation is required.
 *
 * @example
 * const { FileHelper } = require('./helpers/FileHelper');
 *
 * // Read test data from a JSON fixture
 * const users = FileHelper.readJSON('./test/data/users.json');
 *
 * // Write test results
 * FileHelper.writeJSON('./output/results.json', { passed: 10, failed: 0 });
 *
 * // Wait for a file to finish downloading
 * const downloadedFile = await FileHelper.waitForFileDownload('./downloads', '.pdf', 15000);
 */
class FileHelper {
    // ─── Read ─────────────────────────────────────────────────

    /**
     * Read the entire contents of a file as a UTF-8 string.
     *
     * @param {string} filePath - Absolute or relative path to the file to read.
     * @returns {string} The full text content of the file.
     * @throws {Error} If the file does not exist or cannot be read.
     *
     * @example
     * const content = FileHelper.readFile('./test/data/template.txt');
     * console.log(content);
     */
    static readFile(filePath) {
        logger.debug(`Reading file: ${filePath}`);
        return fs.readFileSync(filePath, 'utf-8');
    }

    /**
     * Read a JSON file and parse its contents into a JavaScript object or array.
     *
     * @param {string} filePath - Absolute or relative path to the JSON file.
     * @returns {Object|Array} The parsed JSON data.
     * @throws {Error} If the file does not exist, cannot be read, or contains invalid JSON.
     *
     * @example
     * const config = FileHelper.readJSON('./config/defaults.config.json');
     * console.log(config.baseUrl);
     *
     * @example
     * const users = FileHelper.readJSON('./test/data/users.json');
     * users.forEach(user => console.log(user.name));
     */
    static readJSON(filePath) {
        const content = this.readFile(filePath);
        return JSON.parse(content);
    }

    /**
     * Read a YAML file and parse its contents into a JavaScript object.
     * Requires the `yaml` npm package to be installed.
     *
     * @param {string} filePath - Absolute or relative path to the YAML file.
     * @returns {Object} The parsed YAML data.
     * @throws {Error} If the file does not exist, cannot be read, contains invalid YAML,
     *   or the `yaml` package is not installed.
     *
     * @example
     * const spec = FileHelper.readYAML('./test/data/api-spec.yml');
     * console.log(spec.openapi); // '3.0.0'
     */
    static readYAML(filePath) {
        const yaml = require('yaml');
        const content = this.readFile(filePath);
        return yaml.parse(content);
    }

    /**
     * Read a CSV file and parse it into an array of objects, using the first row as
     * column headers. Supports RFC 4180 quoted fields and custom delimiters.
     *
     * @param {string} filePath - Absolute or relative path to the CSV file.
     * @param {string} [delimiter=','] - The column delimiter character.
     * @returns {Array.<Object>} An array of row objects keyed by header names.
     * @throws {Error} If the file does not exist or cannot be read.
     *
     * @example
     * // users.csv:
     * // name,email,role
     * // Alice,alice@test.com,admin
     * // Bob,bob@test.com,user
     *
     * const rows = FileHelper.readCSV('./test/data/users.csv');
     * console.log(rows[0].name);  // 'Alice'
     * console.log(rows[1].email); // 'bob@test.com'
     *
     * @example
     * // Tab-delimited file
     * const data = FileHelper.readCSV('./test/data/report.tsv', '\t');
     */
    static readCSV(filePath, delimiter = ',') {
        const content = this.readFile(filePath);
        const lines = content.split('\n').filter((line) => line.trim());
        const headers = this._parseCSVLine(lines[0], delimiter).map((h) => h.trim());
        return lines.slice(1).map((line) => {
            const values = this._parseCSVLine(line, delimiter).map((v) => v.trim());
            return headers.reduce((obj, header, i) => {
                obj[header] = values[i] || '';
                return obj;
            }, {});
        });
    }

    /**
     * Parse a single CSV line respecting RFC 4180 quoted fields.
     * Handles fields enclosed in double-quotes and escaped quotes ("").
     * @private
     */
    static _parseCSVLine(line, delimiter = ',') {
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++; // skip escaped quote
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else if (ch === '"') {
                inQuotes = true;
            } else if (ch === delimiter) {
                fields.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        fields.push(current);
        return fields;
    }

    // ─── Write ────────────────────────────────────────────────

    /**
     * Write string content to a file. Parent directories are created automatically
     * if they do not exist. If the file already exists it is overwritten.
     *
     * @param {string} filePath - Absolute or relative path to the target file.
     * @param {string} content - The text content to write.
     * @returns {void}
     * @throws {Error} If the file cannot be written (e.g., permission error).
     *
     * @example
     * FileHelper.writeFile('./output/log.txt', 'Test run started at ' + new Date().toISOString());
     */
    static writeFile(filePath, content) {
        fs.ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(filePath, content, 'utf-8');
        logger.debug(`File written: ${filePath}`);
    }

    /**
     * Serialize a JavaScript value to JSON and write it to a file. Parent directories
     * are created automatically. Existing files are overwritten.
     *
     * @param {string} filePath - Absolute or relative path to the target JSON file.
     * @param {Object|Array|string|number|boolean} data - The data to serialize.
     * @param {boolean} [pretty=true] - When `true`, the output is formatted with 2-space
     *   indentation for readability; when `false`, the output is compact.
     * @returns {void}
     * @throws {Error} If the data cannot be serialized or the file cannot be written.
     *
     * @example
     * FileHelper.writeJSON('./output/results.json', { passed: 42, failed: 3 });
     *
     * @example
     * // Write compact JSON
     * FileHelper.writeJSON('./output/data.json', [1, 2, 3], false);
     */
    static writeJSON(filePath, data, pretty = true) {
        const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        this.writeFile(filePath, content);
    }

    /**
     * Append string content to the end of a file. If the file does not exist it is
     * created. Parent directories are created automatically.
     *
     * @param {string} filePath - Absolute or relative path to the target file.
     * @param {string} content - The text content to append.
     * @returns {void}
     * @throws {Error} If the file cannot be written (e.g., permission error).
     *
     * @example
     * FileHelper.appendFile('./output/log.txt', '\nStep 1 completed');
     */
    static appendFile(filePath, content) {
        fs.ensureDirSync(path.dirname(filePath));
        fs.appendFileSync(filePath, content, 'utf-8');
    }

    // ─── Directory ────────────────────────────────────────────

    /**
     * Ensure that a directory exists. If the directory structure does not exist it is
     * created recursively (similar to `mkdir -p`).
     *
     * @param {string} dirPath - Absolute or relative path to the directory.
     * @returns {void}
     *
     * @example
     * FileHelper.ensureDirectory('./output/screenshots/failures');
     */
    static ensureDirectory(dirPath) {
        fs.ensureDirSync(dirPath);
    }

    /**
     * List the file names in a directory. Optionally filter by file extension.
     * Returns an empty array if the directory does not exist.
     *
     * @param {string} dirPath - Absolute or relative path to the directory to list.
     * @param {string} [extension=''] - Optional file extension filter (e.g., `'.json'`).
     *   When empty, all entries are returned.
     * @returns {Array.<string>} An array of file names (not full paths) matching the filter.
     *
     * @example
     * const jsonFiles = FileHelper.listFiles('./test/data', '.json');
     * console.log(jsonFiles); // ['users.json', 'config.json']
     *
     * @example
     * const allFiles = FileHelper.listFiles('./downloads');
     */
    static listFiles(dirPath, extension = '') {
        if (!fs.existsSync(dirPath)) return [];
        const files = fs.readdirSync(dirPath);
        if (extension) {
            return files.filter((f) => f.endsWith(extension));
        }
        return files;
    }

    /**
     * Recursively list all files in a directory tree. Optionally filter by file extension.
     * Returns an empty array if the root directory does not exist.
     *
     * @param {string} dirPath - Absolute or relative path to the root directory.
     * @param {string} [extension=''] - Optional file extension filter (e.g., `'.js'`).
     *   When empty, all files are returned.
     * @returns {Array.<string>} An array of absolute file paths matching the filter.
     *
     * @example
     * const specs = FileHelper.listFilesRecursive('./test/features', '.feature');
     * console.log(specs);
     * // ['C:/project/test/features/login.feature', 'C:/project/test/features/cart/checkout.feature']
     */
    static listFilesRecursive(dirPath, extension = '') {
        const results = [];
        if (!fs.existsSync(dirPath)) return results;

        const walk = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walk(fullPath);
                } else if (!extension || entry.name.endsWith(extension)) {
                    results.push(fullPath);
                }
            }
        };
        walk(dirPath);
        return results;
    }

    // ─── Existence & Deletion ─────────────────────────────────

    /**
     * Check whether a file or directory exists at the given path.
     *
     * @param {string} filePath - Absolute or relative path to check.
     * @returns {boolean} `true` if the path exists, `false` otherwise.
     *
     * @example
     * if (FileHelper.exists('./output/results.json')) {
     *     const results = FileHelper.readJSON('./output/results.json');
     * }
     */
    static exists(filePath) {
        return fs.existsSync(filePath);
    }

    /**
     * Delete a single file. If the file does not exist the call is a no-op.
     *
     * @param {string} filePath - Absolute or relative path to the file to delete.
     * @returns {void}
     *
     * @example
     * FileHelper.deleteFile('./output/temp-report.html');
     */
    static deleteFile(filePath) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.debug(`Deleted file: ${filePath}`);
        }
    }

    /**
     * Recursively delete a directory and all of its contents. If the directory does
     * not exist the call is a no-op.
     *
     * @param {string} dirPath - Absolute or relative path to the directory to delete.
     * @returns {void}
     *
     * @example
     * FileHelper.deleteDirectory('./output/old-reports');
     */
    static deleteDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.removeSync(dirPath);
            logger.debug(`Deleted directory: ${dirPath}`);
        }
    }

    /**
     * Remove all contents of a directory while keeping the directory itself. If the
     * directory does not exist the call is a no-op.
     *
     * @param {string} dirPath - Absolute or relative path to the directory to clean.
     * @returns {void}
     *
     * @example
     * // Clear previous screenshots before a new test run
     * FileHelper.cleanDirectory('./output/screenshots');
     */
    static cleanDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.emptyDirSync(dirPath);
            logger.debug(`Cleaned directory: ${dirPath}`);
        }
    }

    // ─── Copy & Move ─────────────────────────────────────────

    /**
     * Copy a file or directory from source to destination. Parent directories at the
     * destination are created automatically. If the destination already exists it is
     * overwritten.
     *
     * @param {string} source - Path to the source file or directory.
     * @param {string} destination - Path to the destination.
     * @returns {void}
     * @throws {Error} If the source does not exist or the copy operation fails.
     *
     * @example
     * FileHelper.copyFile('./test/data/users.json', './output/users-backup.json');
     */
    static copyFile(source, destination) {
        fs.ensureDirSync(path.dirname(destination));
        fs.copySync(source, destination);
    }

    /**
     * Move (or rename) a file or directory from source to destination. Parent
     * directories at the destination are created automatically. If the destination
     * already exists it is overwritten.
     *
     * @param {string} source - Path to the source file or directory.
     * @param {string} destination - Path to the destination.
     * @returns {void}
     * @throws {Error} If the source does not exist or the move operation fails.
     *
     * @example
     * FileHelper.moveFile('./downloads/report.pdf', './output/reports/final-report.pdf');
     */
    static moveFile(source, destination) {
        fs.ensureDirSync(path.dirname(destination));
        fs.moveSync(source, destination, { overwrite: true });
    }

    // ─── Size & Stats ─────────────────────────────────────────

    /**
     * Get the size of a file in bytes.
     *
     * @param {string} filePath - Absolute or relative path to the file.
     * @returns {number} The file size in bytes.
     * @throws {Error} If the file does not exist.
     *
     * @example
     * const bytes = FileHelper.getFileSize('./downloads/report.pdf');
     * console.log(bytes); // 204800
     */
    static getFileSize(filePath) {
        const stats = fs.statSync(filePath);
        return stats.size;
    }

    /**
     * Get the size of a file as a human-readable string (e.g., `"1.50 MB"`).
     *
     * @param {string} filePath - Absolute or relative path to the file.
     * @returns {string} Formatted file size with units (Bytes, KB, MB, or GB).
     * @throws {Error} If the file does not exist.
     *
     * @example
     * const size = FileHelper.getFileSizeFormatted('./downloads/report.pdf');
     * console.log(size); // '200.00 KB'
     */
    static getFileSizeFormatted(filePath) {
        const bytes = this.getFileSize(filePath);
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    // ─── Download Helpers ─────────────────────────────────────

    /**
     * Wait for a file matching the given pattern to appear in a directory. Polls the
     * directory every 500 ms until a matching file is found or the timeout is reached.
     * Useful for waiting on browser-initiated file downloads to complete.
     *
     * @param {string} dirPath - Absolute or relative path to the directory to watch.
     * @param {string|RegExp} filePattern - A substring or regular expression to match
     *   against file names in the directory.
     * @param {number} [timeout=30000] - Maximum time in milliseconds to wait for the
     *   file to appear.
     * @returns {Promise.<string>} The full path to the matched file.
     * @throws {Error} If no matching file is found within the timeout period.
     *
     * @example
     * // Wait up to 15 seconds for a PDF download
     * const pdfPath = await FileHelper.waitForFileDownload('./downloads', '.pdf', 15000);
     * console.log('Downloaded:', pdfPath);
     *
     * @example
     * // Use a RegExp for more complex matching
     * const report = await FileHelper.waitForFileDownload(
     *     './downloads',
     *     /report_\d{4}-\d{2}-\d{2}\.xlsx/,
     *     30000
     * );
     */
    static async waitForFileDownload(dirPath, filePattern, timeout = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const files = this.listFiles(dirPath);
            const match = files.find((f) => {
                if (filePattern instanceof RegExp) return filePattern.test(f);
                return f.includes(filePattern);
            });
            if (match) return path.join(dirPath, match);
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        throw new Error(`File matching "${filePattern}" not found in "${dirPath}" after ${timeout}ms`);
    }

    // ─── Temp File ────────────────────────────────────────────

    /** @private */
    static _tempFiles = [];

    /**
     * Create a temporary file in the `tmp/` directory under the current working
     * directory. The file name includes a timestamp to avoid collisions. Use
     * {@link FileHelper.cleanupTempFiles} to remove all temporary files created
     * during the session.
     *
     * @param {string} content - The text content to write to the temporary file.
     * @param {string} [extension='.txt'] - The file extension for the temporary file
     *   (include the leading dot).
     * @returns {string} The absolute path to the created temporary file.
     *
     * @example
     * const tempPath = FileHelper.createTempFile('{"key": "value"}', '.json');
     * console.log(tempPath); // 'C:/project/tmp/temp_1709136000000.json'
     *
     * // Clean up when done
     * FileHelper.cleanupTempFiles();
     */
    static createTempFile(content, extension = '.txt') {
        const tempDir = path.join(process.cwd(), 'tmp');
        fs.ensureDirSync(tempDir);
        const fileName = `temp_${Date.now()}${extension}`;
        const filePath = path.join(tempDir, fileName);
        this.writeFile(filePath, content);
        this._tempFiles.push(filePath);
        return filePath;
    }

    /**
     * Remove all temporary files that were created via {@link FileHelper.createTempFile}
     * during the current session. Files that no longer exist on disk are silently
     * skipped. Warnings are logged for files that cannot be deleted.
     *
     * @returns {void}
     *
     * @example
     * // Typically called in an afterAll / afterSuite hook
     * FileHelper.createTempFile('data1', '.txt');
     * FileHelper.createTempFile('data2', '.json');
     * FileHelper.cleanupTempFiles(); // removes both temp files
     */
    static cleanupTempFiles() {
        let removed = 0;
        for (const filePath of this._tempFiles) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    removed++;
                }
            } catch (err) {
                logger.warn(`Failed to clean temp file ${filePath}: ${err.message}`);
            }
        }
        this._tempFiles = [];
        logger.debug(`Cleaned up ${removed} temp file(s)`);
    }
}

module.exports = { FileHelper };
