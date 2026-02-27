/**
 * ═══════════════════════════════════════════════════════════════
 * Generate Cucumber HTML Report (standalone)
 * ═══════════════════════════════════════════════════════════════
 *
 * Run with: npm run report:html
 */

const path = require('path');
const fs = require('fs-extra');

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const JSON_DIR = path.join(REPORTS_DIR, 'cucumber-json');
const HTML_DIR = path.join(REPORTS_DIR, 'cucumber-html');

fs.ensureDirSync(JSON_DIR);
fs.ensureDirSync(HTML_DIR);

const jsonFiles = fs.readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'));

if (jsonFiles.length === 0) {
    console.log('No Cucumber JSON results found. Run tests first.');
    process.exit(0);
}

try {
    const report = require('multiple-cucumber-html-reporter');

    report.generate({
        jsonDir: JSON_DIR,
        reportPath: HTML_DIR,
        reportName: 'Cucumber BDD Test Report',
        pageTitle: 'BDD Test Results',
        displayDuration: true,
        displayReportTime: true,
        openReportInBrowser: true,
        pageFooter: '<p style="text-align:center">Enterprise WDIO Cucumber Framework</p>',
        customData: {
            title: 'Run Details',
            data: [
                { label: 'Project', value: 'Enterprise Framework' },
                { label: 'Environment', value: process.env.TEST_ENV || 'dev' },
                { label: 'Browser', value: process.env.BROWSER || 'chrome' },
                { label: 'Date', value: new Date().toLocaleString() },
                { label: 'Node', value: process.version },
                { label: 'Platform', value: process.platform },
            ],
        },
    });

    console.log(`\nCucumber HTML report generated: ${HTML_DIR}/index.html\n`);
} catch (error) {
    console.error('Report generation failed:', error.message);
    process.exit(1);
}
