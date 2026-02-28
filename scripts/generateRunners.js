#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Runner Generator Script — Generate WDIO Configs per Tag/Suite
 * ═══════════════════════════════════════════════════════════════
 *
 * Scans feature files and generates individual WDIO config files for
 * each unique tag, enabling isolated parallel execution per suite.
 *
 * Usage:
 *   node scripts/generateRunners.js
 *   node scripts/generateRunners.js --tags @smoke,@regression,@login
 */

const path = require('path');
const { FeatureGenerator } = require('@wdio-framework/core');

const args = process.argv.slice(2);
const tagsArg = args.find((a) => a.startsWith('--tags'));
const tagsValue = tagsArg ? tagsArg.split('=')[1] || args[args.indexOf(tagsArg) + 1] : '';

const defaultTags = ['@smoke', '@regression', '@sanity', '@critical', '@login', '@search'];
const tags = tagsValue
    ? tagsValue.split(',').map((t) => t.trim())
    : defaultTags;

console.log('═══════════════════════════════════════════════');
console.log(' Runner Config Generator');
console.log('═══════════════════════════════════════════════');
console.log(`Tags: ${tags.join(', ')}`);

const generator = new FeatureGenerator();

const generatedFiles = generator.generateRunnerFiles({
    tags,
    featureDir: path.join(process.cwd(), 'test', 'features'),
    outputDir: path.join(process.cwd(), 'config', 'generated'),
    baseConfigPath: path.join(process.cwd(), 'config', 'wdio.conf.js'),
});

console.log(`Generated ${generatedFiles.length} runner config(s):`);
for (const file of generatedFiles) {
    console.log(`  → ${path.relative(process.cwd(), file)}`);
}

console.log('═══════════════════════════════════════════════');
