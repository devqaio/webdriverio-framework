/**
 * ═══════════════════════════════════════════════════════════════
 * Setup Script — Pre-test Preparation
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const dirs = [
    'reports',
    'reports/allure-results',
    'reports/cucumber-json',
    'reports/cucumber-html',
    'reports/timeline',
    'screenshots',
    'videos',
    'logs',
    'downloads',
    'tmp',
];

console.log('Setting up framework directories...');

dirs.forEach((dir) => {
    const fullPath = path.join(ROOT, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`  ✓ Created: ${dir}/`);
    }
});

// Copy .env.example to .env if .env doesn't exist
const envExample = path.join(ROOT, '.env.example');
const envFile = path.join(ROOT, '.env');

if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
    fs.copyFileSync(envExample, envFile);
    console.log('  ✓ Created .env from .env.example');
}

console.log('\nSetup complete.\n');
