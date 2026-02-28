#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Targeted Test Runner — Execute Tests Based on Execution Matrix
 * ═══════════════════════════════════════════════════════════════
 *
 * Reads an execution matrix (Excel or JSON) to determine which
 * tests to run, then launches WDIO with the filtered specs and tags.
 *
 * Usage:
 *   node scripts/runTargeted.js
 *   node scripts/runTargeted.js --matrix test/data/execution-matrix.xlsx
 *   node scripts/runTargeted.js --matrix test/data/execution-matrix.json --env staging
 *
 * Environment variables:
 *   EXECUTION_MATRIX  — path to matrix file
 *   TEST_ENV          — target environment
 *   BROWSER           — target browser
 */

const path = require('path');
const { execFileSync } = require('child_process');

// Parse CLI arguments
const args = process.argv.slice(2);
const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const matrixPath = getArg('matrix') || process.env.EXECUTION_MATRIX || '';

let _env, _browser;
try {
    const { ConfigResolver } = require('@wdio-framework/core');
    _env = getArg('env') || ConfigResolver.get('TEST_ENV', '');
    _browser = getArg('browser') || ConfigResolver.browser || '';
} catch {
    _env = getArg('env') || process.env.TEST_ENV || '';
    _browser = getArg('browser') || process.env.BROWSER || '';
}
const env = _env;
const browserArg = _browser;
const configPath = getArg('config') || 'config/wdio.conf.js';

console.log('═══════════════════════════════════════════════');
console.log(' Targeted Test Execution');
console.log('═══════════════════════════════════════════════');

if (!matrixPath) {
    console.log('No execution matrix specified.');
    console.log('Running all tests with default configuration...');
    console.log('');
    console.log('Tip: Provide a matrix file to filter tests:');
    console.log('  npm run test:targeted -- --matrix test/data/execution-matrix.xlsx');
    console.log('');

    const args = ['wdio', 'run', configPath];
    console.log(`> npx ${args.join(' ')}\n`);
    try {
        execFileSync('npx', args, { stdio: 'inherit', shell: false });
    } catch (err) {
        process.exit(err.status || 1);
    }
    process.exit(0);
}

// Load the filter
const { TestExecutionFilter } = require('@wdio-framework/core');

const filter = new TestExecutionFilter(matrixPath);
filter.load();

const overrides = {};
if (env) overrides.env = env;
if (browserArg) overrides.browser = browserArg;

const targeted = filter.getTargetedRows(overrides);
console.log(`Matrix loaded: ${matrixPath}`);
console.log(`Targeted rows: ${targeted.length}`);

if (targeted.length === 0) {
    console.log('No tests matched the current filter. Exiting.');
    process.exit(0);
}

const tagExpression = filter.getTargetedTagExpression(overrides);
const specs = filter.getTargetedSpecs(overrides);

console.log(`Tag expression: ${tagExpression || '(none)'}`);
console.log(`Feature files: ${specs.length}`);
console.log('═══════════════════════════════════════════════\n');

// Build WDIO command (shell-safe: no string interpolation)
const wdioArgs = ['wdio', 'run', configPath];
if (tagExpression) {
    wdioArgs.push(`--cucumberOpts.tagExpression=${tagExpression}`);
}

// Pass computed spec files to WDIO so only matched features run
if (specs.length > 0) {
    specs.forEach((s) => wdioArgs.push('--spec', s));
}

console.log(`> npx ${wdioArgs.join(' ')}\n`);
try {
    execFileSync('npx', wdioArgs, { stdio: 'inherit', shell: false });
} catch (err) {
    // execFileSync throws on non-zero exit — propagate the exit code
    process.exit(err.status || 1);
}
