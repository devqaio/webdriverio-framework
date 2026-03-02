/**
 * ═══════════════════════════════════════════════════════════════
 * Cleanup Script — Remove Generated Artifacts
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const dirsToClean = ['reports', 'screenshots', 'videos', 'logs', 'tmp', 'downloads'];

console.log('Cleaning up artifacts...');

dirsToClean.forEach((dir) => {
    const fullPath = path.join(ROOT, dir);
    if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`  ✓ Cleaned: ${dir}/`);
    }
});

console.log('\nCleanup complete.\n');
