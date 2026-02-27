/**
 * ═══════════════════════════════════════════════════════════════
 * Post-Install Script
 * ═══════════════════════════════════════════════════════════════
 * Runs automatically after `npm install` to set up directories.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const dirs = [
    'reports/allure-results',
    'reports/cucumber-json',
    'reports/cucumber-html',
    'reports/timeline',
    'screenshots',
    'videos',
    'logs',
    'downloads',
];

dirs.forEach((dir) => {
    const fullPath = path.join(ROOT, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Create .env from example if missing
const envExample = path.join(ROOT, '.env.example');
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
    fs.copyFileSync(envExample, envFile);
}

console.log('Framework setup complete.');
