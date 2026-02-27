#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Feature Generator Script — Generate Features from Data
 * ═══════════════════════════════════════════════════════════════
 *
 * Reads external data (Excel/JSON) and generates Cucumber feature
 * files with data-driven Scenario Outlines.
 *
 * Usage:
 *   node scripts/generateFeatures.js
 *
 * Configuration is read from test/data/feature-config.json if it exists,
 * or you can pass CLI arguments.
 */

const path = require('path');
const fs = require('fs-extra');
const { FeatureGenerator } = require('../src/helpers/FeatureGenerator');

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, 'test', 'data', 'feature-config.json');

console.log('═══════════════════════════════════════════════');
console.log(' Feature Generator');
console.log('═══════════════════════════════════════════════');

const generator = new FeatureGenerator({
    outputDir: path.join(ROOT, 'test', 'features', 'generated'),
    templateDir: path.join(ROOT, 'test', 'features', 'templates'),
});

// Clean previous generated features
generator.cleanGenerated();
console.log('Cleaned previous generated features.');

// Check for config file
if (fs.existsSync(CONFIG_PATH)) {
    const configs = fs.readJsonSync(CONFIG_PATH);
    const featureConfigs = Array.isArray(configs) ? configs : [configs];

    let generated = 0;
    for (const config of featureConfigs) {
        try {
            if (config.excelPath) {
                generator.generateFromExcel(config);
            } else if (config.jsonPath) {
                generator.generateFromJson(config);
            } else if (config.templatePath) {
                generator.generateFromTemplate(config);
            }
            generated++;
        } catch (err) {
            console.error(`Failed to generate feature: ${err.message}`);
        }
    }
    console.log(`Generated ${generated} feature file(s).`);
} else {
    console.log('No feature-config.json found at test/data/feature-config.json');
    console.log('');
    console.log('Create one with this structure:');
    console.log(JSON.stringify([{
        excelPath: 'test/data/testData.xlsx',
        sheet: 'LoginTests',
        featureName: 'Data Driven Login',
        scenarioName: 'Login with credentials from data',
        steps: [
            'Given I am on the login page',
            'When I enter username "<username>"',
            'And I enter password "<password>"',
            'Then I should see "<expectedResult>"',
        ],
        columns: ['username', 'password', 'expectedResult'],
        filters: { Execute: 'Y' },
        tags: ['@generated', '@data-driven'],
    }], null, 2));
}

console.log('═══════════════════════════════════════════════');
