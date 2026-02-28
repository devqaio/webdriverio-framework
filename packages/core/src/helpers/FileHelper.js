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

class FileHelper {
    // ─── Read ─────────────────────────────────────────────────

    static readFile(filePath) {
        logger.debug(`Reading file: ${filePath}`);
        return fs.readFileSync(filePath, 'utf-8');
    }

    static readJSON(filePath) {
        const content = this.readFile(filePath);
        return JSON.parse(content);
    }

    static readYAML(filePath) {
        const yaml = require('yaml');
        const content = this.readFile(filePath);
        return yaml.parse(content);
    }

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

    static writeFile(filePath, content) {
        fs.ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(filePath, content, 'utf-8');
        logger.debug(`File written: ${filePath}`);
    }

    static writeJSON(filePath, data, pretty = true) {
        const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        this.writeFile(filePath, content);
    }

    static appendFile(filePath, content) {
        fs.ensureDirSync(path.dirname(filePath));
        fs.appendFileSync(filePath, content, 'utf-8');
    }

    // ─── Directory ────────────────────────────────────────────

    static ensureDirectory(dirPath) {
        fs.ensureDirSync(dirPath);
    }

    static listFiles(dirPath, extension = '') {
        if (!fs.existsSync(dirPath)) return [];
        const files = fs.readdirSync(dirPath);
        if (extension) {
            return files.filter((f) => f.endsWith(extension));
        }
        return files;
    }

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

    static exists(filePath) {
        return fs.existsSync(filePath);
    }

    static deleteFile(filePath) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.debug(`Deleted file: ${filePath}`);
        }
    }

    static deleteDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.removeSync(dirPath);
            logger.debug(`Deleted directory: ${dirPath}`);
        }
    }

    static cleanDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.emptyDirSync(dirPath);
            logger.debug(`Cleaned directory: ${dirPath}`);
        }
    }

    // ─── Copy & Move ─────────────────────────────────────────

    static copyFile(source, destination) {
        fs.ensureDirSync(path.dirname(destination));
        fs.copySync(source, destination);
    }

    static moveFile(source, destination) {
        fs.ensureDirSync(path.dirname(destination));
        fs.moveSync(source, destination, { overwrite: true });
    }

    // ─── Size & Stats ─────────────────────────────────────────

    static getFileSize(filePath) {
        const stats = fs.statSync(filePath);
        return stats.size;
    }

    static getFileSizeFormatted(filePath) {
        const bytes = this.getFileSize(filePath);
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    // ─── Download Helpers ─────────────────────────────────────

    /**
     * Wait for a file to appear in the downloads directory.
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
     * Create a temporary file. Use `cleanupTempFiles()` to remove all
     * temp files created during the session.
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
     * Remove all temporary files created via `createTempFile()`.
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
