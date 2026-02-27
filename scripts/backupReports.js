#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Report Backup Script — Archive Reports to Shared Folder
 * ═══════════════════════════════════════════════════════════════
 *
 * Usage:
 *   node scripts/backupReports.js
 *   REPORT_BACKUP_PATH=\\server\share node scripts/backupReports.js
 */

const { ReportBackupManager } = require('../src/utils/ReportBackupManager');

(async () => {
    console.log('═══════════════════════════════════════════════');
    console.log(' Report Backup');
    console.log('═══════════════════════════════════════════════');

    const manager = new ReportBackupManager({ enabled: true });
    const result = await manager.backup();

    if (result) {
        console.log(`Reports backed up to: ${result}`);
    } else {
        console.log('Backup skipped (check REPORT_BACKUP_PATH configuration).');
    }

    console.log('═══════════════════════════════════════════════');
})();
