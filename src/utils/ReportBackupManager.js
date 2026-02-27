/**
 * ═══════════════════════════════════════════════════════════════════════
 * ReportBackupManager — Report Archival to Shared / Network Folders
 * ═══════════════════════════════════════════════════════════════════════
 *
 * After every test run, copies the full reports directory to a
 * shared network drive (UNC path) or any backup location, providing
 * a historical archive and team-wide visibility.
 *
 * Features:
 *   • Timestamped backup folders (never overwrites previous runs)
 *   • Configurable via env vars or constructor options
 *   • Supports UNC paths  (\\server\share\folder)
 *   • Supports local & mapped drive paths
 *   • Optional ZIP compression before copy
 *   • Prune old backups (keep last N)
 *   • Generates an index.html with links to all past runs
 *
 * Integration:
 *   Called from wdio.conf.js onComplete hook automatically.
 *
 * Environment variables:
 *   REPORT_BACKUP_PATH   — Destination path  (e.g. \\fileserver\qa-reports)
 *   REPORT_BACKUP_ENABLE — 'true' to enable  (default: false in dev)
 *   REPORT_BACKUP_KEEP   — Number of backups to keep (default: 30)
 * ═══════════════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('./Logger');

const logger = Logger.getInstance('ReportBackupManager');

class ReportBackupManager {
    /**
     * @param {object} [options]
     * @param {string} [options.sourceDir]      Local reports directory
     * @param {string} [options.backupPath]      Destination folder (UNC or local)
     * @param {boolean} [options.enabled]        Whether backup is enabled
     * @param {number}  [options.keepLastN]       Number of backups to retain
     * @param {boolean} [options.compress]       ZIP before copying
     * @param {string}  [options.projectName]    Project name for folder naming
     */
    constructor(options = {}) {
        this.sourceDir = path.resolve(
            options.sourceDir || process.env.REPORT_SOURCE_DIR || 'reports',
        );
        this.backupPath =
            options.backupPath ||
            process.env.REPORT_BACKUP_PATH ||
            '';
        this.enabled =
            options.enabled !== undefined
                ? options.enabled
                : process.env.REPORT_BACKUP_ENABLE === 'true';
        this.keepLastN = options.keepLastN || parseInt(process.env.REPORT_BACKUP_KEEP, 10) || 30;
        this.compress = options.compress || process.env.REPORT_BACKUP_COMPRESS === 'true';
        this.projectName = options.projectName || process.env.PROJECT_NAME || 'wdio-tests';
    }

    // ─── Public API ───────────────────────────────────────────

    /**
     * Execute the backup.  Safe to call unconditionally — it's a no-op
     * when disabled or when the backup path is not configured.
     *
     * @returns {Promise<string|null>}  Path to backup folder, or null
     */
    async backup() {
        if (!this.enabled) {
            logger.debug('Report backup is disabled (set REPORT_BACKUP_ENABLE=true to enable)');
            return null;
        }

        if (!this.backupPath) {
            logger.warn('REPORT_BACKUP_PATH not configured — skipping backup');
            return null;
        }

        if (!fs.existsSync(this.sourceDir)) {
            logger.warn(`Source directory does not exist: ${this.sourceDir}`);
            return null;
        }

        const timestamp = this._generateTimestamp();
        const destFolder = path.join(
            this.backupPath,
            this.projectName,
            timestamp,
        );

        try {
            logger.info(`Backing up reports to: ${destFolder}`);
            fs.ensureDirSync(destFolder);

            if (this.compress) {
                await this._compressAndCopy(destFolder);
            } else {
                await fs.copy(this.sourceDir, destFolder, { overwrite: true });
            }

            logger.info(`Report backup complete: ${destFolder}`);

            // Generate index of all backups
            await this._generateBackupIndex();

            // Prune old backups
            await this._pruneOldBackups();

            return destFolder;
        } catch (err) {
            logger.error(`Report backup failed: ${err.message}`);
            // Don't throw — backup failure should never fail the test run
            return null;
        }
    }

    /**
     * List all existing backup directories.
     *
     * @returns {{ name: string, path: string, date: Date }[]}
     */
    listBackups() {
        const projectDir = path.join(this.backupPath, this.projectName);
        if (!fs.existsSync(projectDir)) return [];

        return fs
            .readdirSync(projectDir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}/.test(d.name))
            .map((d) => ({
                name: d.name,
                path: path.join(projectDir, d.name),
                date: this._parseTimestamp(d.name),
            }))
            .sort((a, b) => b.date - a.date);
    }

    // ─── Private Helpers ──────────────────────────────────────

    _generateTimestamp() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return [
            now.getFullYear(),
            pad(now.getMonth() + 1),
            pad(now.getDate()),
            '_',
            pad(now.getHours()),
            pad(now.getMinutes()),
            pad(now.getSeconds()),
        ].join('');
    }

    _parseTimestamp(name) {
        try {
            const match = name.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
            if (!match) return new Date(0);
            const [, y, m, d, h, min, s] = match;
            return new Date(+y, +m - 1, +d, +h, +min, +s);
        } catch {
            return new Date(0);
        }
    }

    async _compressAndCopy(destDir) {
        // Use archiver if available; otherwise fall back to plain copy
        try {
            const archiver = require('archiver');
            const zipPath = path.join(destDir, 'reports.zip');
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    logger.info(`Compressed backup: ${zipPath} (${archive.pointer()} bytes)`);
                    resolve();
                });
                archive.on('error', reject);
                archive.pipe(output);
                archive.directory(this.sourceDir, false);
                archive.finalize();
            });
        } catch {
            logger.debug('archiver not installed — falling back to plain copy');
            await fs.copy(this.sourceDir, destDir, { overwrite: true });
        }
    }

    async _pruneOldBackups() {
        const backups = this.listBackups();
        if (backups.length <= this.keepLastN) return;

        const toRemove = backups.slice(this.keepLastN);
        for (const backup of toRemove) {
            try {
                await fs.remove(backup.path);
                logger.debug(`Pruned old backup: ${backup.name}`);
            } catch (err) {
                logger.warn(`Failed to prune backup ${backup.name}: ${err.message}`);
            }
        }

        logger.info(`Pruned ${toRemove.length} old backup(s) — keeping last ${this.keepLastN}`);
    }

    async _generateBackupIndex() {
        const projectDir = path.join(this.backupPath, this.projectName);
        const backups = this.listBackups();

        const rows = backups
            .map(
                (b) =>
                    `<tr><td><a href="${b.name}/index.html">${b.name}</a></td><td>${b.date.toLocaleString()}</td></tr>`,
            )
            .join('\n');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${this.projectName} — Test Report Archive</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f8f9fa; }
        h1 { color: #2d3748; }
        table { border-collapse: collapse; width: 100%; max-width: 800px; }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #4a90d9; color: white; }
        tr:hover { background: #edf2f7; }
        a { color: #4a90d9; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .meta { color: #718096; font-size: 0.9rem; margin-top: 8px; }
    </style>
</head>
<body>
    <h1>📊 ${this.projectName} — Test Report Archive</h1>
    <p class="meta">Total backups: ${backups.length} | Retention: last ${this.keepLastN}</p>
    <table>
        <thead><tr><th>Run</th><th>Date</th></tr></thead>
        <tbody>${rows}</tbody>
    </table>
</body>
</html>`;

        const indexPath = path.join(projectDir, 'index.html');
        fs.writeFileSync(indexPath, html, 'utf-8');
    }
}

module.exports = { ReportBackupManager };
