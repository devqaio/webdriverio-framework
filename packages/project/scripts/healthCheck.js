/**
 * ═══════════════════════════════════════════════════════════════
 * Health Check Script - Validate Framework Readiness
 * ═══════════════════════════════════════════════════════════════
 *
 * Run with: npm run health-check
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
let exitCode = 0;

console.log('');
console.log('═══════════════════════════════════════════');
console.log(' Framework Health Check');
console.log('═══════════════════════════════════════════');

// ─── Check Node version ───────────────────────────────────────
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split('.')[0]);
if (major >= 18) {
    console.log(`  ✓ Node.js ${nodeVersion}`);
} else {
    console.log(`  ✗ Node.js ${nodeVersion} — requires v18+`);
    exitCode = 1;
}

// ─── Check critical dependencies ──────────────────────────────
const criticalDeps = [
    '@wdio/cli',
    '@wdio/cucumber-framework',
    '@wdio/local-runner',
    'webdriverio',
    '@wdio/allure-reporter',
    'multiple-cucumber-html-reporter',
];

criticalDeps.forEach((dep) => {
    const depPath = path.join(ROOT, 'node_modules', dep);
    if (fs.existsSync(depPath)) {
        console.log(`  ✓ ${dep}`);
    } else {
        console.log(`  ✗ ${dep} — not installed`);
        exitCode = 1;
    }
});

// ─── Check config file ───────────────────────────────────────
const configFile = path.join(ROOT, 'config', 'wdio.conf.js');
if (fs.existsSync(configFile)) {
    console.log('  ✓ wdio.conf.js found');
} else {
    console.log('  ✗ wdio.conf.js missing');
    exitCode = 1;
}

// ─── Check feature files ─────────────────────────────────────
const featuresDir = path.join(ROOT, 'test', 'features');
if (fs.existsSync(featuresDir)) {
    const features = fs.readdirSync(featuresDir).filter((f) => f.endsWith('.feature'));
    console.log(`  ✓ ${features.length} feature file(s) found`);
} else {
    console.log('  ✗ test/features/ directory missing');
    exitCode = 1;
}

// ─── Check .env ───────────────────────────────────────────────
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
    console.log('  ✓ .env file present');
} else {
    console.log('  ⚠ .env file not found (using defaults)');
}

// ─── Summary ──────────────────────────────────────────────────
console.log('');
if (exitCode === 0) {
    console.log('  ✓ All checks passed — framework is ready');
} else {
    console.log('  ✗ Some checks failed — resolve issues above');
}
console.log('');
console.log('═══════════════════════════════════════════');

process.exit(exitCode);
