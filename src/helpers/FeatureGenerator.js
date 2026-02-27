/**
 * ═══════════════════════════════════════════════════════════════════════
 * FeatureGenerator — Dynamic Feature / Runner Generation
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Generates targeted Cucumber feature files or WDIO runner configurations
 * from external data sources (Excel / JSON) and tag configuration.
 *
 * Use cases:
 *   • Generate features at runtime so only targeted test data rows run
 *   • Create Scenario Outlines whose Examples tables come from Excel
 *   • Split a single feature into per-tag runner configs for parallelism
 *   • Generate "smoke pack" or "regression pack" features pre-run
 *
 * Usage:
 *   const gen = new FeatureGenerator();
 *   gen.generateFromExcel({
 *       excelPath: 'test/data/testData.xlsx',
 *       sheet: 'LoginTests',
 *       templatePath: 'test/features/templates/login.feature.tpl',
 *       outputDir: 'test/features/generated',
 *       filters: { Execute: 'Y' },
 *   });
 * ═══════════════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('../utils/Logger');
const { ExcelHelper } = require('../helpers/ExcelHelper');

const logger = Logger.getInstance('FeatureGenerator');

class FeatureGenerator {
    constructor(options = {}) {
        this.outputDir = path.resolve(options.outputDir || 'test/features/generated');
        this.templateDir = path.resolve(options.templateDir || 'test/features/templates');
    }

    // ─── Feature Generation from Excel ────────────────────────

    /**
     * Generate a Cucumber feature file from an Excel data sheet.
     * Each row becomes a row in the Scenario Outline's Examples table.
     *
     * @param {object} config
     * @param {string} config.excelPath       Path to Excel file
     * @param {string} config.sheet           Sheet name
     * @param {string} config.featureName     Feature title
     * @param {string} config.scenarioName    Scenario Outline title
     * @param {string[]} config.steps         Gherkin step templates with <column> placeholders
     * @param {string[]} config.columns       Column names for Examples table
     * @param {object}  [config.filters]      Row filters (e.g. { Execute: 'Y' })
     * @param {string[]} [config.tags]        Tags to add (e.g. ['@smoke', '@generated'])
     * @param {string}  [config.outputFile]   Output filename (default: auto-generated)
     * @returns {string}  Path to generated feature file
     */
    generateFromExcel(config) {
        const {
            excelPath,
            sheet,
            featureName,
            scenarioName,
            steps,
            columns,
            filters = {},
            tags = ['@generated'],
            outputFile,
        } = config;

        logger.info(`Generating feature from Excel: ${sheet} in ${excelPath}`);

        const rows = Object.keys(filters).length
            ? ExcelHelper.getFilteredRows(excelPath, sheet, filters)
            : ExcelHelper.readSheet(excelPath, sheet);

        if (rows.length === 0) {
            logger.warn('No data rows matched — no feature generated');
            return null;
        }

        // Validate that requested columns exist in the data
        if (columns && columns.length > 0 && rows.length > 0) {
            const availableCols = Object.keys(rows[0]);
            const missingCols = columns.filter((c) => !availableCols.includes(c));
            if (missingCols.length > 0) {
                logger.warn(`Columns not found in data: ${missingCols.join(', ')}. Available: ${availableCols.join(', ')}`);
            }
        }

        const tagLine = tags.map((t) => (t.startsWith('@') ? t : `@${t}`)).join(' ');
        const stepsBlock = steps.map((s) => `    ${s}`).join('\n');

        const examplesHeader = `    | ${columns.join(' | ')} |`;
        const examplesRows = rows
            .map((row) => `    | ${columns.map((col) => row[col] != null ? String(row[col]) : '').join(' | ')} |`)
            .join('\n');

        const feature = `${tagLine}
Feature: ${featureName}

  Scenario Outline: ${scenarioName}
${stepsBlock}

  Examples:
${examplesHeader}
${examplesRows}
`;

        const fileName = outputFile || `${this._sanitize(featureName)}.feature`;
        const filePath = path.join(this.outputDir, fileName);
        fs.ensureDirSync(this.outputDir);
        fs.writeFileSync(filePath, feature, 'utf-8');
        logger.info(`Generated feature: ${filePath} (${rows.length} data rows)`);
        return filePath;
    }

    /**
     * Generate a feature from a JSON data file.
     *
     * @param {object} config
     * @param {string} config.jsonPath
     * @param {string} config.dataKey       Dot-notation path to the array in the JSON
     * @param {string} config.featureName
     * @param {string} config.scenarioName
     * @param {string[]} config.steps
     * @param {string[]} config.columns
     * @param {string[]} [config.tags]
     * @returns {string}
     */
    generateFromJson(config) {
        const {
            jsonPath,
            dataKey,
            featureName,
            scenarioName,
            steps,
            columns,
            tags = ['@generated'],
        } = config;

        const fullData = fs.readJsonSync(path.resolve(jsonPath));
        let rows = dataKey ? this._getByPath(fullData, dataKey) : fullData;

        if (!Array.isArray(rows)) {
            // Convert object to array of { key, ...value } entries
            rows = Object.entries(rows).map(([key, val]) => ({
                key,
                ...(typeof val === 'object' ? val : { value: val }),
            }));
        }

        return this._generateFeatureFile({ featureName, scenarioName, steps, columns, rows, tags });
    }

    /**
     * Generate features from a template file, replacing placeholders with data.
     *
     * Template placeholders:
     *   {{EXAMPLES_TABLE}}  — replaced with generated Examples rows
     *   {{TAG_LINE}}        — replaced with tag annotations
     *   {{FEATURE_NAME}}    — replaced with feature name
     *
     * @param {object} config
     * @param {string} config.templatePath  Path to .feature.tpl template
     * @param {object[]} config.rows        Data rows
     * @param {string[]} config.columns     Columns for Examples
     * @param {string[]} [config.tags]
     * @param {string}  [config.outputFile]
     * @returns {string}
     */
    generateFromTemplate(config) {
        const { templatePath, rows, columns, tags = [], outputFile, featureName = '' } = config;

        const templateContent = fs.readFileSync(path.resolve(templatePath), 'utf-8');

        const tagLine = tags.map((t) => (t.startsWith('@') ? t : `@${t}`)).join(' ');
        const examplesHeader = `    | ${columns.join(' | ')} |`;
        const examplesRows = rows
            .map((row) => `    | ${columns.map((col) => row[col] || '').join(' | ')} |`)
            .join('\n');
        const examplesTable = `${examplesHeader}\n${examplesRows}`;

        let output = templateContent
            .replace(/\{\{EXAMPLES_TABLE\}\}/g, examplesTable)
            .replace(/\{\{TAG_LINE\}\}/g, tagLine)
            .replace(/\{\{FEATURE_NAME\}\}/g, featureName);

        const fileName = outputFile || `generated_${Date.now()}.feature`;
        const filePath = path.join(this.outputDir, fileName);
        fs.ensureDirSync(this.outputDir);
        fs.writeFileSync(filePath, output, 'utf-8');
        logger.info(`Generated feature from template: ${filePath}`);
        return filePath;
    }

    // ─── Runner Configuration Generation ──────────────────────

    /**
     * Generate WDIO spec/suite configuration objects based on tags.
     * Returns a structure that can be merged into wdio.conf.js.
     *
     * @param {object} config
     * @param {string[]} config.tags           Tags to generate runners for
     * @param {string}   config.featureDir     Directory containing .feature files
     * @param {string}  [config.stepDefsDir]   Step definitions directory
     * @returns {object}  { suites: { tagName: [featureFiles] } }
     */
    generateRunnerConfig(config) {
        const { tags, featureDir, stepDefsDir } = config;
        const absFeatureDir = path.resolve(featureDir);
        const featureFiles = this._findFeatureFiles(absFeatureDir);
        const suites = {};

        for (const tag of tags) {
            const normalised = tag.replace('@', '');
            const matchingFiles = featureFiles.filter((file) => {
                const content = fs.readFileSync(file, 'utf-8');
                return content.includes(`@${normalised}`) || content.includes(tag);
            });
            if (matchingFiles.length > 0) {
                suites[normalised] = matchingFiles;
            }
        }

        logger.info(`Generated runner config for ${tags.length} tag(s): ${JSON.stringify(Object.keys(suites))}`);
        return {
            suites,
            cucumberOpts: {
                require: [path.join(path.resolve(stepDefsDir || 'test/step-definitions'), '**', '*.steps.js')],
            },
        };
    }

    /**
     * Generate individual runner config files per tag/suite.
     *
     * @param {object}  config
     * @param {string[]} config.tags
     * @param {string}   config.featureDir
     * @param {string}  [config.outputDir]     Default: config/generated/
     * @param {string}  [config.baseConfigPath] Base wdio config to extend
     * @returns {string[]}  Paths to generated config files
     */
    generateRunnerFiles(config) {
        const {
            tags,
            featureDir,
            outputDir = 'config/generated',
            baseConfigPath = 'config/wdio.conf.js',
        } = config;

        const runnerConfig = this.generateRunnerConfig(config);
        const absOutputDir = path.resolve(outputDir);
        fs.ensureDirSync(absOutputDir);
        const generatedFiles = [];

        for (const [suiteName, specs] of Object.entries(runnerConfig.suites)) {
            const fileName = `wdio.${suiteName}.generated.js`;
            const filePath = path.join(absOutputDir, fileName);
            const relativeBase = path.relative(absOutputDir, path.resolve(baseConfigPath)).replace(/\\/g, '/');

            const content = `/**
 * Auto-generated runner config for @${suiteName} suite
 * Generated: ${new Date().toISOString()}
 */
const { deepMerge } = require('${path.relative(absOutputDir, path.resolve('config/helpers/configHelper.js')).replace(/\\/g, '/')}');
const baseConfig = require('${relativeBase}');

exports.config = deepMerge(baseConfig.config, {
    specs: ${JSON.stringify(specs, null, 8)},
    cucumberOpts: {
        tagExpression: '@${suiteName}',
    },
});
`;
            fs.writeFileSync(filePath, content, 'utf-8');
            generatedFiles.push(filePath);
        }

        logger.info(`Generated ${generatedFiles.length} runner file(s) in ${absOutputDir}`);
        return generatedFiles;
    }

    // ─── Cleanup ──────────────────────────────────────────────

    /**
     * Remove all generated feature files from the output directory.
     */
    cleanGenerated() {
        if (fs.existsSync(this.outputDir)) {
            fs.emptyDirSync(this.outputDir);
            logger.info(`Cleaned generated features: ${this.outputDir}`);
        }
    }

    // ─── Private Helpers ──────────────────────────────────────

    _generateFeatureFile({ featureName, scenarioName, steps, columns, rows, tags }) {
        const tagLine = tags.map((t) => (t.startsWith('@') ? t : `@${t}`)).join(' ');
        const stepsBlock = steps.map((s) => `    ${s}`).join('\n');
        const examplesHeader = `    | ${columns.join(' | ')} |`;
        const examplesRows = rows
            .map((row) => `    | ${columns.map((col) => row[col] || '').join(' | ')} |`)
            .join('\n');

        const feature = `${tagLine}
Feature: ${featureName}

  Scenario Outline: ${scenarioName}
${stepsBlock}

  Examples:
${examplesHeader}
${examplesRows}
`;

        const fileName = `${this._sanitize(featureName)}.feature`;
        const filePath = path.join(this.outputDir, fileName);
        fs.ensureDirSync(this.outputDir);
        fs.writeFileSync(filePath, feature, 'utf-8');
        logger.info(`Generated feature: ${filePath} (${rows.length} data rows)`);
        return filePath;
    }

    _findFeatureFiles(dir) {
        const results = [];
        if (!fs.existsSync(dir)) return results;

        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                results.push(...this._findFeatureFiles(fullPath));
            } else if (entry.name.endsWith('.feature')) {
                results.push(fullPath);
            }
        }
        return results;
    }

    _sanitize(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
    }

    _getByPath(obj, dotPath) {
        return dotPath.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    }
}

module.exports = { FeatureGenerator };
