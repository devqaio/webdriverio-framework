# Enterprise WebdriverIO + Cucumber BDD Test Automation Framework

<p align="center">
  <strong>Production-grade, highly scalable, data-driven end-to-end test automation framework</strong><br>
  Built for Web &amp; Mobile testing &bull; Cucumber BDD &bull; Page Object Model &bull; Multi-environment &bull; CI/CD Ready
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Cloud Testing](#cloud-testing)
- [Configuration](#configuration)
- [Test Execution](#test-execution)
- [Data Externalization](#data-externalization)
- [Feature Generation](#feature-generation)
- [Targeted Execution](#targeted-execution)
- [Page Object Model](#page-object-model)
- [Shadow DOM & Frame Auto-Resolution](#shadow-dom--frame-auto-resolution)
- [Mobile Testing](#mobile-testing)
- [Reporting](#reporting)
- [Report Backup](#report-backup)
- [CI/CD Integration](#cicd-integration)
- [Docker Support](#docker-support)
- [Environment Management](#environment-management)
- [Utility Modules](#utility-modules)
- [Extending the Framework](#extending-the-framework)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [API Reference](#api-reference)
- [Generating API Documentation](#generating-api-documentation)
- [Additional Documentation](#additional-documentation)

---

## Overview

This framework is a **baseline test automation platform** designed for enterprise teams building end-to-end UI test suites. It provides a fully modular, extensible architecture that teams can adopt out of the box while customising for their specific application.

### Who is this for?

| Role | Value |
|------|-------|
| **QA Engineers** | Write tests in plain Gherkin (Given/When/Then) without worrying about infrastructure |
| **Developers** | Clean, modular codebase that follows SOLID principles and is easy to extend |
| **QA Leads** | Pre-built reporting, CI/CD pipelines, and governance controls |
| **DevOps** | Docker-ready, parallel execution, configurable via environment variables |

### Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| [WebdriverIO](https://webdriver.io/) | Test runner & browser automation | v9+ |
| [Cucumber](https://cucumber.io/) | BDD framework (Gherkin syntax) | v9+ |
| [Appium](https://appium.io/) | Mobile testing (iOS & Android) | v2+ |
| [Allure](https://allurereport.org/) | Interactive test reports | v2.27+ |
| [Winston](https://github.com/winstonjs/winston) | Structured logging | v3+ |
| [Chai](https://www.chaijs.com/) | Assertion library | v4+ |
| [Axios](https://axios-http.com/) | HTTP client for API testing | v1+ |
| [xlsx](https://www.npmjs.com/package/xlsx) | Excel data externalization | v0.18+ |
| [Docker](https://www.docker.com/) | Containerised execution | Latest |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline | N/A |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Test Layer                                   │
│  Features (.feature)  →  Step Definitions  →  Page Objects           │
│  Gherkin scenarios       Glue code            Clean abstractions     │
├──────────────────────────────────────────────────────────────────────┤
│                       Framework Core                                 │
│  BasePage │ BaseComponent │ MobileBasePage │ ElementHelper            │
│  ShadowDomResolver │ FrameManager │ BrowserManager                   │
├──────────────────────────────────────────────────────────────────────┤
│                      Helper Modules                                  │
│  ExcelHelper │ DataDrivenManager │ FeatureGenerator                  │
│  TestExecutionFilter │ ApiHelper │ DataGenerator │ FileHelper         │
│  DateHelper │ StringHelper │ EncryptionHelper                        │
├──────────────────────────────────────────────────────────────────────┤
│                      Utility Layer                                   │
│  Logger │ Reporter │ RetryHandler │ ScreenshotManager                │
│  PerformanceTracker │ ReportBackupManager                            │
├──────────────────────────────────────────────────────────────────────┤
│                     Configuration                                    │
│  wdio.conf.js │ wdio.dev/staging/prod/docker/mobile.js               │
│  capabilities/ (chrome, firefox, edge, android, ios)                 │
│  constants/ (Timeouts, Environments, Messages)                       │
├──────────────────────────────────────────────────────────────────────┤
│                     Infrastructure                                   │
│  Docker │ Selenium Grid │ GitHub Actions │ Allure Reports             │
└──────────────────────────────────────────────────────────────────────┘
```

### Modular Package Architecture

The framework is split into **three independently publishable npm packages** under a monorepo structure. Application teams install only the packages they need:

```
┌─────────────────────────────────────────────────────────────────┐
│                  @wdio-framework/core                            │
│  AbstractBasePage │ Logger │ RetryHandler │ ScreenshotManager   │
│  ApiHelper │ DataGenerator │ ExcelHelper │ DataDrivenManager    │
│  Timeouts │ Environments │ Messages │ createBaseHooks()         │
├──────────────────────────┬──────────────────────────────────────┤
│   @wdio-framework/ui    │      @wdio-framework/mobile          │
│   (depends on core)     │      (depends on core)               │
│                          │                                      │
│   BasePage               │      MobileBasePage                  │
│   BaseComponent          │      Gestures (tap, swipe, pinch…)   │
│   BrowserManager         │      Context switching               │
│   ElementHelper          │      App lifecycle (Appium 2.x)      │
│   ShadowDomResolver      │      Platform-aware selectors        │
│   FrameManager           │      Device utilities                │
│   Web capabilities       │      Mobile capabilities             │
└──────────────────────────┴──────────────────────────────────────┘
```

**Install for web-only testing:**
```bash
npm install @wdio-framework/ui
# core is auto-installed as a dependency
```

**Install for mobile-only testing:**
```bash
npm install @wdio-framework/mobile
# core is auto-installed as a dependency
```

**Install for both (hybrid):**
```bash
npm install @wdio-framework/ui @wdio-framework/mobile
```

**Import examples:**
```javascript
// Web page object
const { BasePage, BrowserManager, Logger } = require('@wdio-framework/ui');

// Mobile page object
const { MobileBasePage, Logger } = require('@wdio-framework/mobile');

// Core utilities only
const { ApiHelper, DataGenerator, Timeouts } = require('@wdio-framework/core');
```

### Design Principles

1. **Single Responsibility** — Each module does one thing well
2. **Open/Closed** — Extend via inheritance, not modification
3. **Dependency Inversion** — Core modules depend on abstractions
4. **DRY** — Reusable step definitions, helpers, and base classes
5. **Convention over Configuration** — Sensible defaults, overridable via env vars

---

## Key Features

### Testing Capabilities
- ✅ **Web Testing** — Chrome, Firefox, Edge with headless support
- ✅ **Mobile Testing** — Android (UiAutomator2) and iOS (XCUITest) via Appium 2.x
- ✅ **Shadow DOM Auto-Resolution** — Automatically pierces shadow boundaries
- ✅ **Frame Auto-Resolution** — Automatically searches across all iframes
- ✅ **Data-Driven Testing** — Excel (.xlsx) and JSON data externalization
- ✅ **Parallel Execution** — Worker-isolated instances per browser/suite
- ✅ **Cross-Browser** — Chrome, Firefox, Edge, Android Chrome, iOS Safari
- ✅ **API Testing** — Built-in Axios client for API calls within E2E tests

### Framework Capabilities
- ✅ **Isolated Parallel Logging** — Per-worker and per-scenario log files
- ✅ **Feature Generation** — Auto-generate Cucumber features from data
- ✅ **Targeted Execution** — Execution matrix controls which tests run
- ✅ **Tag-Based Filtering** — @smoke, @regression, @sanity, custom tags
- ✅ **Runner Generation** — Auto-generate per-suite WDIO configs
- ✅ **Multi-Environment** — dev, staging, prod configs with env vars
- ✅ **Report Backup** — Archive reports to shared/network folders
- ✅ **Screenshot on Failure** — Automatic with Allure attachment
- ✅ **Retry Logic** — Configurable retries with exponential backoff
- ✅ **Spec-Level Retries** — Automatic re-run of failed spec files
- ✅ **Performance Tracking** — Navigation Timing API v2 metrics

### Developer Experience
- ✅ **50+ Reusable Step Definitions** — Common Given/When/Then steps
- ✅ **Rich Page Object Base** — 60+ methods in BasePage
- ✅ **Structured Logging** — Winston with per-worker file isolation
- ✅ **Code Quality** — ESLint + Prettier pre-configured
- ✅ **Docker Support** — Selenium Grid + test runner containers
- ✅ **CI/CD Pipeline** — GitHub Actions with matrix builds

---

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Java JDK** >= 11 (for Allure reports)
- **Appium** (for mobile testing only)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd WebDriverIO

# Install dependencies
npm install

# Set up your environment
cp .env.example .env
# Edit .env with your application's BASE_URL

# Verify setup
npm run health-check
```

### Run Your First Test

```bash
# Run all tests
npm test

# Run smoke tests only
npm run test:smoke

# Run in a specific browser
npm run test:chrome
npm run test:firefox

# Run with a specific environment
npm run test:staging
```

### View Reports

```bash
# Open Allure report
npm run report:allure

# Generate Cucumber HTML report
npm run report:html
```

---

## Project Structure

```
WebDriverIO/
├── packages/                        # Modular npm packages (monorepo)
│   ├── core/                        # @wdio-framework/core
│   │   ├── package.json             # Core package manifest
│   │   ├── index.js                 # Barrel export (all core modules)
│   │   ├── README.md                # Core package documentation
│   │   └── src/
│   │       ├── base/
│   │       │   └── AbstractBasePage.js  # Shared base (navigation, interaction, waits)
│   │       ├── utils/               # Logger, RetryHandler, Reporter, etc.
│   │       ├── helpers/             # ApiHelper, ExcelHelper, DataDrivenManager, etc.
│   │       ├── constants/           # Timeouts, Environments, Messages
│   │       └── config/
│   │           └── base.hooks.js    # Reusable WDIO lifecycle hook factory
│   │
│   ├── ui/                          # @wdio-framework/ui
│   │   ├── package.json             # UI package manifest (depends on core)
│   │   ├── index.js                 # Barrel export (core + UI modules)
│   │   ├── README.md                # UI package documentation
│   │   └── src/
│   │       ├── BasePage.js          # Web page object (60+ methods, Shadow DOM, Frames)
│   │       ├── BaseComponent.js     # Reusable UI component base
│   │       ├── BrowserManager.js    # Browser-level operations
│   │       ├── ElementHelper.js     # Element interaction utilities
│   │       ├── ShadowDomResolver.js # Automatic shadow DOM traversal
│   │       ├── FrameManager.js      # Automatic iframe handling
│   │       └── config/
│   │           ├── capabilities/    # Chrome, Firefox, Edge configs
│   │           └── wdio.web.conf.js # Ready-to-use web config template
│   │
│   └── mobile/                      # @wdio-framework/mobile
│       ├── package.json             # Mobile package manifest (depends on core)
│       ├── index.js                 # Barrel export (core + mobile modules)
│       ├── README.md                # Mobile package documentation
│       └── src/
│           ├── MobileBasePage.js    # Mobile page object (gestures, contexts, Appium 2.x)
│           └── config/
│               ├── capabilities/    # Android, iOS configs
│               └── wdio.mobile.conf.js # Ready-to-use mobile config template
│
├── config/                          # Framework configuration
│   ├── wdio.conf.js                 # Base WDIO configuration
│   ├── wdio.dev.js                  # Development environment override
│   ├── wdio.staging.js              # Staging environment override
│   ├── wdio.prod.js                 # Production environment override
│   ├── wdio.docker.js               # Docker/Selenium Grid override
│   ├── wdio.mobile.js               # Mobile/Appium override
│   ├── capabilities/                # Browser & device capabilities
│   │   ├── chrome.js                # Chrome desktop capabilities
│   │   ├── firefox.js               # Firefox desktop capabilities
│   │   ├── edge.js                  # Edge desktop capabilities
│   │   ├── android.js               # Android native/Chrome capabilities
│   │   ├── ios.js                   # iOS native/Safari capabilities
│   │   └── index.js                 # Capabilities resolver
│   ├── helpers/
│   │   └── configHelper.js          # Deep merge utility for configs
│   └── generated/                   # Auto-generated runner configs
│
├── src/                             # Framework source code
│   ├── core/                        # Core abstractions
│   │   ├── BasePage.js              # Foundation page object (60+ methods)
│   │   ├── BaseComponent.js         # Reusable UI component base
│   │   ├── MobileBasePage.js        # Mobile page object (gestures, context)
│   │   ├── BrowserManager.js        # Browser-level operations
│   │   ├── ElementHelper.js         # Element interaction utilities
│   │   ├── ShadowDomResolver.js     # Automatic shadow DOM traversal
│   │   ├── FrameManager.js          # Automatic iframe handling
│   │   └── index.js                 # Core barrel export
│   │
│   ├── helpers/                     # Data & integration helpers
│   │   ├── ExcelHelper.js           # Excel read/write/filter
│   │   ├── DataDrivenManager.js     # Centralised data orchestration
│   │   ├── FeatureGenerator.js      # Dynamic feature file generation
│   │   ├── TestExecutionFilter.js   # Execution matrix filtering
│   │   ├── ApiHelper.js             # REST API client (Axios)
│   │   ├── DataGenerator.js         # Fake data factory (Faker.js)
│   │   ├── FileHelper.js            # File system operations
│   │   ├── DateHelper.js            # Date manipulation (dayjs)
│   │   ├── StringHelper.js          # String utilities
│   │   ├── EncryptionHelper.js      # AES-256 encryption
│   │   └── index.js                 # Helpers barrel export
│   │
│   ├── utils/                       # Cross-cutting utilities
│   │   ├── Logger.js                # Winston parallel-isolated logging
│   │   ├── Reporter.js              # Report attachment hooks
│   │   ├── RetryHandler.js          # Retry & circuit breaker
│   │   ├── ScreenshotManager.js     # Screenshot capture & cleanup
│   │   ├── PerformanceTracker.js    # Timing & performance assertions
│   │   ├── ReportBackupManager.js   # Archive to shared folder
│   │   └── index.js                 # Utils barrel export
│   │
│   ├── constants/                   # Shared constants
│   │   ├── Timeouts.js              # Centralised timeout values
│   │   ├── Environments.js          # Environment URL configs
│   │   ├── Messages.js              # Reusable assertion messages
│   │   └── index.js                 # Constants barrel export
│   │
│   └── index.js                     # Public API barrel export
│
├── test/                            # Test suite
│   ├── features/                    # Cucumber feature files
│   │   ├── login.feature
│   │   ├── search.feature
│   │   ├── generated/               # Auto-generated features
│   │   └── templates/               # Feature templates
│   │
│   ├── step-definitions/            # Cucumber step implementations
│   │   ├── common/                  # 50+ reusable generic steps
│   │   │   ├── given.steps.js
│   │   │   ├── when.steps.js
│   │   │   └── then.steps.js
│   │   ├── login.steps.js
│   │   └── search.steps.js
│   │
│   ├── pages/                       # Page Object classes
│   │   ├── LoginPage.js
│   │   ├── HomePage.js
│   │   └── SearchResultsPage.js
│   │
│   ├── components/                  # Reusable UI Components
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   └── Modal.js
│   │
│   └── data/                        # Test data files
│       ├── testData.json            # General test data
│       ├── users.json               # User credentials
│       ├── execution-matrix.json    # Execution control matrix
│       └── feature-config.json      # Feature generation config
│
├── scripts/                         # Utility scripts
│   ├── setup.js                     # Pre-test setup
│   ├── cleanup.js                   # Post-test cleanup
│   ├── healthCheck.js               # Environment health check
│   ├── generateReport.js            # Report generation
│   ├── generateCucumberReport.js    # Cucumber HTML report
│   ├── generateFeatures.js          # Feature file generation
│   ├── generateRunners.js           # Runner config generation
│   ├── runTargeted.js               # Targeted test execution
│   ├── backupReports.js             # Report backup to shared folder
│   └── postInstall.js               # Post-install setup
│
├── docker/                          # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .github/workflows/ci.yml        # GitHub Actions CI/CD
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── .env.example                     # Environment variable template
├── .gitignore
├── babel.config.js
├── package.json
└── README.md
```

---

## Configuration

### Environment Variables

All configuration can be overridden via environment variables or `.env` file:

```bash
# Copy the example and customise
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://example.com` | Application base URL |
| `BROWSER` | `chrome` | Browser: chrome, firefox, edge, android, ios |
| `TEST_ENV` | `dev` | Environment: dev, staging, prod |
| `HEADLESS` | `false` | Run browser in headless mode |
| `MAX_INSTANCES` | `5` | Parallel browser instances |
| `TAG_EXPRESSION` | _(empty)_ | Cucumber tag filter |
| `LOG_LEVEL` | `info` | Winston log level (debug, info, warn, error) |
| `LOG_DIR` | `./logs` | Custom log output directory |
| `RETRY_COUNT` | `1` | Failed scenario retry count |
| `SPEC_FILE_RETRIES` | `0` | Spec-level retry count |
| `TIMEOUT_IMPLICIT` | `15000` | Default element wait (ms) |
| `EXECUTION_MATRIX` | _(empty)_ | Path to execution matrix file |
| `REPORT_BACKUP_PATH` | _(empty)_ | Shared folder for report backup |
| `REPORT_BACKUP_ENABLE` | `false` | Enable report archival |
| `REPORT_BACKUP_KEEP` | `30` | Number of backup runs to keep |
| `ENCRYPTION_KEY` | _(required)_ | AES-256 encryption passphrase |
| `APPIUM_HOST` | `localhost` | Appium server host |
| `APPIUM_PORT` | `4723` | Appium server port |
| `ANDROID_DEVICE` | `emulator-5554` | Android device/emulator identifier |
| `IOS_DEVICE` | `iPhone 15` | iOS simulator/device name |

### Multi-Environment Configs

```bash
npm run test:dev        # Uses config/wdio.dev.js
npm run test:staging    # Uses config/wdio.staging.js
npm run test:prod       # Uses config/wdio.prod.js
npm run test:docker     # Uses config/wdio.docker.js (Selenium Grid)
npm run test:mobile     # Uses config/wdio.mobile.js (Appium)
npm run test:cloud      # Uses config/wdio.cloud.js (Cloud provider)
```

---

## Cloud Testing

Run tests on cloud platforms without changing test code. Set `CLOUD_PROVIDER` and
the provider's credentials, then use `wdio.cloud.js`:

### Supported Providers

| Provider | `CLOUD_PROVIDER` value | Required Variables |
|----------|----------------------|-------------------|
| BrowserStack | `browserstack` or `bs` | `BROWSERSTACK_USERNAME`, `BROWSERSTACK_ACCESS_KEY` |
| Sauce Labs | `saucelabs` or `sauce` | `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY` |
| LambdaTest | `lambdatest` or `lt` | `LAMBDATEST_USERNAME`, `LAMBDATEST_ACCESS_KEY` |
| Perfecto | `perfecto` | `PERFECTO_CLOUD_NAME`, `PERFECTO_SECURITY_TOKEN` |

### Quick Start (BrowserStack example)

```bash
# .env or shell
CLOUD_PROVIDER=browserstack
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_key
BROWSER=chrome

# Run
npx wdio run config/wdio.cloud.js
```

### Cloud Testing Modes

Each provider supports three testing modes controlled by the `CLOUD_TEST_TYPE`
environment variable (or `BROWSERSTACK_TEST_TYPE`, `SAUCE_TEST_TYPE`, etc.):

| Mode | Description |
|------|-------------|
| `desktop` _(default)_ | Desktop browser testing |
| `mobile` | Mobile browser testing on real/virtual devices |
| `app` | Native mobile app testing |

### Capabilities Structure

Cloud capabilities are built from `config/capabilities/<provider>.js` modules.
Each module exports functions for options, desktop, mobile, and app capabilities:

```javascript
const { resolveCloudCapabilities, getCloudConnection } = require('./config/capabilities');

// Automatically resolves provider from CLOUD_PROVIDER env var
const caps = resolveCloudCapabilities({ testType: 'desktop' });
const connection = getCloudConnection('browserstack');
```

See [.env.example](.env.example) for all available cloud configuration variables.

Each environment config extends the base `wdio.conf.js` using deep merge, so you only need to override what changes.

---

## Test Execution

### Basic Commands

```bash
# Run all tests
npm test

# Run by tag
npm run test:smoke
npm run test:regression
npm run test:sanity

# Run specific feature
npx wdio run config/wdio.conf.js --spec test/features/login.feature

# Run with custom tag expression
npx wdio run config/wdio.conf.js --cucumberOpts.tagExpression='@smoke and @login'
```

### All Available Commands

| Command | Description |
|---|---|
| `npm test` | Run all tests with base config |
| `npm run test:dev` | Run against dev environment |
| `npm run test:staging` | Run against staging environment |
| `npm run test:prod` | Run against production |
| `npm run test:smoke` | Run only `@smoke` tagged scenarios |
| `npm run test:regression` | Run `@regression` scenarios |
| `npm run test:sanity` | Run `@sanity` scenarios |
| `npm run test:chrome` | Run on Chrome |
| `npm run test:firefox` | Run on Firefox |
| `npm run test:edge` | Run on Edge |
| `npm run test:headless` | Run in headless mode |
| `npm run test:parallel` | Run with 5 parallel instances |
| `npm run test:docker` | Run on Selenium Grid in Docker |
| `npm run test:mobile` | Run with Appium (mobile) |
| `npm run test:cloud` | Run on cloud platform (BrowserStack, Sauce Labs, etc.) |
| `npm run test:targeted` | Run execution-matrix-driven targeted tests |
| `npm run generate:features` | Generate feature files from data |
| `npm run generate:runners` | Generate per-tag runner configs |
| `npm run report:generate` | Generate all reports |
| `npm run report:allure` | Generate & open Allure report |
| `npm run report:html` | Generate Cucumber HTML report |
| `npm run report:backup` | Backup reports to shared folder |
| `npm run clean` | Remove all generated artifacts |
| `npm run lint` | Run ESLint |
| `npm run format` | Auto-format code with Prettier |
| `npm run validate` | Lint + format check together |
| `npm run health-check` | Validate framework readiness |
| `npm run docker:build` | Build Docker containers |
| `npm run docker:run` | Start Selenium Grid and run tests |
| `npm run docker:down` | Stop Docker containers |

### Parallel Execution

```bash
# 5 parallel instances (default)
npm run test:parallel

# Custom parallelism
MAX_INSTANCES=10 npm test
```

### Isolated Parallel Logging

When running tests in parallel, each worker and scenario produces its own log file — no interleaving:

```
logs/
├── main.log                         # Main process (onPrepare, onComplete)
├── errors.log                       # Aggregated errors from all workers
├── worker-0-0/
│   ├── worker.log                   # All logs from worker 0-0
│   ├── scenario_Login_success.log   # Scenario-specific log
│   └── scenario_Login_failure.log
├── worker-0-1/
│   ├── worker.log
│   └── scenario_Search_products.log
└── ...
```

Configuration:

```bash
# Override log directory
LOG_DIR=/custom/path/to/logs

# Set log level (debug, info, warn, error)
LOG_LEVEL=debug
```

Integration in custom hooks:

```javascript
const { Logger } = require('@wdio-framework/core');

// Worker context is set automatically in wdio.conf.js `before` hook
// Scenario context is set/cleared automatically in beforeScenario/afterScenario

// For custom modules, just use getInstance — isolation is automatic
const logger = Logger.getInstance('MyModule');
logger.info('This logs to the correct worker/scenario file');
```

---

## Data Externalization

The framework supports both **JSON** and **Excel** as external data sources. Test data is never hard-coded in step definitions.

### JSON Data

Place JSON files in `test/data/` and load them in step definitions:

```javascript
const { dataDrivenManager } = require('@wdio-framework/core');

// Load a single JSON file
dataDrivenManager.loadJson('test/data/users.json');

// Load all JSON files in a directory
dataDrivenManager.loadJsonDir('test/data');

// Access via dot notation
const admin = dataDrivenManager.get('validUsers.admin');
console.log(admin.username); // 'admin_user'

// Template interpolation — replaces {{key.path}} placeholders
const greeting = dataDrivenManager.interpolate('Hello {{validUsers.admin.firstName}}!');
```

### Excel Data

Place `.xlsx` files in `test/data/` with headers in row 1:

| TestCaseId | Username | Password | Execute | Tags |
|------------|----------|----------|---------|------|
| TC001 | admin_user | admin_pass | Y | @smoke |
| TC002 | bad_user | wrong_pass | Y | @regression |
| TC003 | locked_user | locked_pass | N | @regression |

```javascript
const { ExcelHelper } = require('@wdio-framework/core');

// Read all rows as objects (header row becomes keys)
const allRows = ExcelHelper.readSheet('test/data/testData.xlsx', 'LoginTests');

// Read only rows where Execute = Y
const targeted = ExcelHelper.getExecutableRows('test/data/testData.xlsx', 'LoginTests');

// Filter by multiple column values
const filtered = ExcelHelper.getFilteredRows('test/data/testData.xlsx', 'LoginTests', {
    Execute: 'Y',
    Tags: '@smoke',
});

// Get a single row by key column
const tc = ExcelHelper.getRowByKey('test/data/testData.xlsx', 'LoginTests', 'TestCaseId', 'TC001');

// Convert Excel to Cucumber Examples table
const examplesTable = ExcelHelper.toGherkinExamples(targeted, ['Username', 'Password']);
// Returns: "| Username | Password |\n| admin_user | admin_pass |"

// Write back to Excel (e.g., update test results)
ExcelHelper.writeToExcel('test/data/results.xlsx', 'Results', results);
```

### DataDrivenManager — Centralised Data Orchestration

The `DataDrivenManager` merges JSON, Excel, and environment variable data into a single queryable store:

```javascript
const { dataDrivenManager } = require('@wdio-framework/core');

// Load multiple sources
dataDrivenManager.loadJson('test/data/users.json');
dataDrivenManager.loadExcelSheet('test/data/testData.xlsx', 'LoginTests');

// The store is now a merged object, accessible via dot notation
const value = dataDrivenManager.get('LoginTests.0.Username');  // First row's Username

// Environment variable override — set DATA_KEY_PATH to override any value
// Example: DATA_LOGINTEST_0_USERNAME=override npm test
```

---

## Feature Generation

Generate Cucumber feature files dynamically from external data. This is useful for data-driven test suites where hundreds of scenarios are generated from Excel rows.

### Configuration

Create `test/data/feature-config.json`:

```json
[
    {
        "excelPath": "test/data/testData.xlsx",
        "sheet": "LoginTests",
        "featureName": "Data Driven Login Tests",
        "scenarioName": "Login with credentials",
        "steps": [
            "Given I am on the login page",
            "When I enter username \"<Username>\"",
            "And I enter password \"<Password>\"",
            "Then I should see \"<ExpectedResult>\""
        ],
        "columns": ["Username", "Password", "ExpectedResult"],
        "filters": { "Execute": "Y" },
        "tags": ["@generated", "@data-driven"]
    }
]
```

### Generate

```bash
# Generate features from config
npm run generate:features

# Generate per-tag runner configs
npm run generate:runners
npm run generate:runners -- --tags @smoke,@regression
```

### Template-Based Generation

For more control, use feature templates with placeholders:

```gherkin
# test/features/templates/login.template.feature
@generated {{TAG_LINE}}
Feature: Login Tests

  Scenario Outline: Login as <Username>
    Given I am on the login page
    When I enter username "<Username>"
    And I enter password "<Password>"
    Then I should see "<ExpectedResult>"

  {{EXAMPLES_TABLE}}
```

```javascript
const { FeatureGenerator } = require('@wdio-framework/core');

await FeatureGenerator.generateFromTemplate(
    'test/features/templates/login.template.feature',
    'test/data/testData.xlsx',
    'LoginTests',
    'test/features/generated/',
    { filters: { Execute: 'Y' } }
);
```

Generated features appear in `test/features/generated/`.

---

## Targeted Execution

Control precisely which tests run using an **execution matrix** — a JSON or Excel file that specifies test cases, environments, browsers, and execution flags.

### Create an Execution Matrix

**JSON format** (`test/data/execution-matrix.json`):

```json
[
    { "TestCaseId": "TC_LOGIN_001", "Feature": "login",  "Tags": "@smoke",      "Execute": "Y", "Env": "all",     "Browser": "all" },
    { "TestCaseId": "TC_LOGIN_002", "Feature": "login",  "Tags": "@regression", "Execute": "Y", "Env": "staging", "Browser": "chrome" },
    { "TestCaseId": "TC_LOGIN_003", "Feature": "login",  "Tags": "@regression", "Execute": "N", "Env": "all",     "Browser": "all" },
    { "TestCaseId": "TC_SEARCH_001","Feature": "search", "Tags": "@smoke",      "Execute": "Y", "Env": "all",     "Browser": "all" }
]
```

**Excel format** — same columns, one row per test case, with `Execute = Y/N`.

### Run Targeted Tests

```bash
# Using the matrix
npm run test:targeted -- --matrix test/data/execution-matrix.json

# With environment and browser filter
npm run test:targeted -- --matrix test/data/execution-matrix.json --env staging --browser chrome

# The filter resolves:
#   1. Only rows with Execute = Y
#   2. Only rows matching current env (or Env = "all")
#   3. Only rows matching current browser (or Browser = "all")
#   4. Builds a tag expression from matching Tags column
#   5. Resolves feature file paths from Feature column
```

### Programmatic Usage

```javascript
const { TestExecutionFilter } = require('@wdio-framework/core');

const filter = new TestExecutionFilter();
filter.load('test/data/execution-matrix.json');

// Get filtered rows
const rows = filter.getTargetedRows({ env: 'staging', browser: 'chrome' });

// Get WDIO config overrides (specs + tag expression)
const overrides = filter.toWdioConfig({ env: 'staging', browser: 'chrome' });
// { specs: ['test/features/login.feature'], cucumberOpts: { tagExpression: '@smoke or @regression' } }
```

---

## Page Object Model

### Creating a Page Object

```javascript
const { BasePage } = require('@wdio-framework/ui');

class MyPage extends BasePage {
    // Define the page URL (used by open())
    get url() { return '/my-page'; }

    // Define element selectors as getters
    get heading()     { return $('h1'); }
    get emailInput()  { return $('[data-testid="email"]'); }
    get submitBtn()   { return $('[data-testid="submit"]'); }
    get errorMsg()    { return $('.error-message'); }

    // Define page-specific actions
    async fillEmail(email) {
        await this.setValue(this.emailInput, email);
    }

    async submit() {
        await this.click(this.submitBtn);
    }

    async getErrorText() {
        return this.getText(this.errorMsg);
    }

    async isLoaded() {
        return this.isDisplayed(this.heading);
    }
}

module.exports = new MyPage();
```

### Creating a Component

```javascript
const { BaseComponent } = require('@wdio-framework/ui');

class NavBar extends BaseComponent {
    constructor() {
        super('[data-testid="navbar"]');
    }

    get homeLink() { return this.root.$('.home-link'); }
    get aboutLink() { return this.root.$('.about-link'); }

    async navigateTo(page) {
        await this.click(this.root.$(`a[href="/${page}"]`));
    }
}

module.exports = new NavBar();
```

### BasePage Methods (60+)

| Category | Methods |
|----------|---------|
| **Navigation** | `open()`, `openAbsoluteUrl()`, `refresh()`, `goBack()`, `goForward()` |
| **Page State** | `getPageTitle()`, `getCurrentUrl()`, `getPageSource()` |
| **Element Interaction** | `click()`, `doubleClick()`, `rightClick()`, `setValue()`, `addValue()`, `clearValue()`, `getText()`, `getValue()`, `getAttribute()`, `getCssProperty()` |
| **Element State** | `isDisplayed()`, `isExisting()`, `isEnabled()`, `isSelected()` |
| **Mouse Actions** | `hover()`, `scrollIntoView()`, `dragAndDrop()` |
| **Dropdowns** | `selectByVisibleText()`, `selectByValue()`, `selectByIndex()` |
| **Frames** | `switchToFrame()`, `switchToParentFrame()`, `switchToDefaultContent()` |
| **Windows** | `switchToWindow()`, `switchToNewWindow()`, `closeCurrentWindow()`, `getWindowCount()` |
| **Alerts** | `acceptAlert()`, `dismissAlert()`, `getAlertText()`, `sendAlertText()` |
| **Waits** | `waitForDisplayed()`, `waitForExist()`, `waitForClickable()`, `waitForEnabled()`, `waitForNotDisplayed()`, `waitForNotExist()`, `waitUntil()`, `waitForPageLoad()`, `waitForUrlContains()`, `waitForTitleContains()` |
| **JavaScript** | `executeScript()`, `executeAsyncScript()`, `jsClick()`, `scrollToTop()`, `scrollToBottom()`, `scrollByPixels()`, `highlightElement()` |
| **Cookies/Storage** | `getCookie()`, `setCookie()`, `deleteCookie()`, `setLocalStorage()`, `getLocalStorage()`, `clearLocalStorage()` |
| **Screenshots** | `takeScreenshot()`, `takeElementScreenshot()` |
| **Keyboard** | `pressKey()`, `pressKeys()` |
| **File Upload** | `uploadFile()` |

---

## Shadow DOM & Frame Auto-Resolution

The framework **automatically** pierces shadow DOM boundaries and searches iframes when an element is not found in the regular DOM. This is transparent to the test author.

### How It Works

When `BasePage._resolveElement()` is called, it follows a **5-step resolution chain**:

1. **Direct element** — Already a WebdriverIO element? Use it as-is.
2. **Deep `>>>` selector** — Selector contains `>>>`? Use WDIO's native deep selector.
3. **Standard `$()`** — Try the regular CSS/XPath selector.
4. **Shadow DOM fallback** — If step 3 fails and `autoResolveShadowDom` is `true`, recursively search all shadow roots.
5. **Frame fallback** — If step 4 fails and `autoResolveFrames` is `true`, recursively search all iframes.

### Shadow DOM

```javascript
// Explicit deep selector using >>>
await page.click('my-component >>> .inner-button');

// Automatic — if .hidden-btn is inside any shadow root,
// the framework finds it automatically via step 4
await page.click('.hidden-btn');
```

### Frame Handling

```javascript
// Automatic — if .iframe-btn is inside any iframe,
// the framework searches all frames automatically via step 5
await page.click('.iframe-btn');

// Explicit frame interaction using FrameManager
await page.frameManager.withinFrame('payment-frame', async () => {
    await page.setValue('#card-number', '4111111111111111');
});
```

### Disabling Auto-Resolution

Override the flags in your page object constructor if you want faster lookups for pages without shadow DOM or iframes:

```javascript
class FastPage extends BasePage {
    constructor() {
        super();
        this.autoResolveShadowDom = false;
        this.autoResolveFrames = false;
    }
}
```

---

## Mobile Testing

### Prerequisites

```bash
# Install Appium globally
npm install -g appium

# Install platform drivers
appium driver install uiautomator2  # Android
appium driver install xcuitest       # iOS

# Start Appium server
appium
```

### Creating Mobile Page Objects

```javascript
const { MobileBasePage } = require('@wdio-framework/mobile');

class LoginScreen extends MobileBasePage {
    get usernameInput() { return this.byAccessibilityId('username-input'); }
    get passwordInput() { return this.byAccessibilityId('password-input'); }
    get loginButton()   { return this.byAccessibilityId('login-button'); }

    async login(username, password) {
        await this.tap(this.usernameInput);
        await this.setValue(this.usernameInput, username);
        await this.tap(this.passwordInput);
        await this.setValue(this.passwordInput, password);
        await this.hideKeyboard();
        await this.tap(this.loginButton);
    }
}

module.exports = new LoginScreen();
```

### Mobile Gestures

```javascript
const screen = new MobileBasePage();

// Swipe
await screen.swipeUp();
await screen.swipeDown();
await screen.swipeLeft();
await screen.swipeRight();

// Touch
await screen.tap(element);
await screen.doubleTap(element);
await screen.longPress(element);
await screen.touchDragAndDrop(source, target);

// Zoom
await screen.pinch(element);
await screen.zoom(element);

// Scroll
await screen.scrollToElement('~target-element');

// Platform-specific selectors
const el = await screen.byPlatform({
    ios: '-ios predicate string:name == "Submit"',
    android: 'android=new UiSelector().text("Submit")',
});

// Context switching (hybrid app)
await screen.switchToWebView();
await screen.switchToNativeApp();
```

### Running Mobile Tests

```bash
# Android native app
BROWSER=android npm run test:mobile

# iOS native app
BROWSER=ios npm run test:mobile

# Android Chrome (mobile web)
BROWSER=android-chrome npm run test:mobile

# iOS Safari (mobile web)
BROWSER=ios-safari npm run test:mobile
```

---

## Reporting

### Available Reports

| Report | Command | Description |
|--------|---------|-------------|
| **Allure** | `npm run report:allure` | Interactive dashboard with trends, categories, drill-down |
| **Cucumber HTML** | `npm run report:html` | Business-friendly BDD report with pass/fail status |
| **Timeline** | `npm run report:timeline` | Execution timeline for parallel worker activity |
| **Spec** | _(console)_ | Real-time console output during execution |

### Auto-Screenshot on Failure

Screenshots are automatically captured on scenario and step failure, attached to both Allure and Cucumber HTML reports.

---

## Report Backup

Archive reports to a shared network folder after each run. Useful for shared QA dashboards and audit trails.

### Configuration

```bash
# In .env
REPORT_BACKUP_PATH=\\\\fileserver\\qa-reports
REPORT_BACKUP_ENABLE=true
REPORT_BACKUP_KEEP=30
```

### How It Works

1. After every test run, the `onComplete` hook in `wdio.conf.js` triggers `ReportBackupManager`
2. A timestamped folder is created in the backup path (e.g., `2024-01-15_143022_abc123/`)
3. All reports (`reports/`, `screenshots/`, `logs/`) are copied
4. Optionally compressed to `.zip`
5. Old backups beyond `REPORT_BACKUP_KEEP` are pruned
6. An `index.html` listing all past runs is regenerated

### Manual Backup

```bash
npm run report:backup
npm run report:backup -- --zip          # with ZIP compression
npm run report:backup -- --keepLast 10  # override keep-last count
```

---

## CI/CD Integration

### GitHub Actions

The framework includes a pre-configured `.github/workflows/ci.yml`:

- Multi-browser matrix (Chrome, Firefox, Edge)
- Allure report generation and artifact publishing
- Automatic test execution on push/PR

### CI Environment Variables

```yaml
env:
  BASE_URL: ${{ secrets.BASE_URL }}
  TEST_ENV: staging
  HEADLESS: true
  REPORT_BACKUP_ENABLE: true
  REPORT_BACKUP_PATH: /shared/qa-reports
```

---

## Docker Support

### Quick Start

```bash
# Start Selenium Grid + run tests
npm run docker:run

# Or step by step:
npm run docker:build
docker-compose up -d
npm run test:docker
npm run docker:down
```

### Architecture

The `docker-compose.yml` orchestrates:
- **Selenium Hub** — Central grid hub
- **Chrome Node** — Chrome browser worker
- **Firefox Node** — Firefox browser worker
- **Edge Node** — Edge browser worker
- **Test Runner** — Framework container that executes tests against the grid

---

## Environment Management

### Environment Configuration

Environments are defined in `packages/core/src/constants/Environments.js`:

```javascript
const envConfig = {
    dev:    { baseUrl: 'https://dev.example.com',    apiUrl: 'https://api.dev.example.com' },
    staging:{ baseUrl: 'https://staging.example.com',apiUrl: 'https://api.staging.example.com' },
    prod:   { baseUrl: 'https://www.example.com',    apiUrl: 'https://api.example.com' },
};
```

Select at runtime:

```bash
TEST_ENV=staging npm test
# or
npm run test:staging
```

---

## Utility Modules

### Logger

```javascript
const { Logger } = require('@wdio-framework/core');
const logger = Logger.getInstance('MyModule');
logger.info('Test started');
logger.debug('Element found', { selector: '#login' });
logger.error('Login failed', { error: err.message });
```

### Data Generator

```javascript
const { DataGenerator } = require('@wdio-framework/core');
const user = DataGenerator.generateUser();       // { firstName, lastName, email, phone, ... }
const address = DataGenerator.generateAddress();  // { street, city, state, zip, country }
const card = DataGenerator.generateCreditCard();  // { number, expiry, cvv }
```

### API Helper

```javascript
const { ApiHelper } = require('@wdio-framework/core');
const api = new ApiHelper('https://api.example.com');
const response = await api.get('/users/1');
await api.post('/users', { name: 'Test User' });
await api.put('/users/1', { name: 'Updated' });
await api.delete('/users/1');
```

### Encryption Helper

```javascript
const { EncryptionHelper } = require('@wdio-framework/core');
const encrypted = EncryptionHelper.encrypt('my-secret-password');
const decrypted = EncryptionHelper.decrypt(encrypted);
```

### Retry Handler

```javascript
const { RetryHandler } = require('@wdio-framework/core');
const result = await RetryHandler.retry(async () => {
    return await someUnstableOperation();
}, { maxRetries: 3, delay: 1000, exponential: true });
```

### Performance Tracker

```javascript
const { PerformanceTracker } = require('@wdio-framework/core');
const tracker = new PerformanceTracker();
tracker.start('login-flow');
// ... perform login ...
tracker.stop('login-flow');
tracker.assertDuration('login-flow', 5000); // Fail if > 5s
```

---

## Extending the Framework

### Adding a New Page Object

1. Create `test/pages/MyNewPage.js` extending `BasePage`
2. Define selectors as getters
3. Add page-specific actions as methods
4. Export as singleton: `module.exports = new MyNewPage()`

### Adding a New Step Definition

1. Create `test/step-definitions/myFeature.steps.js`
2. Import `{ Given, When, Then }` from `@wdio/cucumber-framework`
3. Import page objects from `test/pages/`
4. Define Given/When/Then steps

### Adding a New Helper Module

1. Create `packages/core/src/helpers/MyHelper.js`
2. Export the class or singleton
3. Add to `packages/core/index.js` barrel
4. Now importable via `const { MyHelper } = require('@wdio-framework/core')`

### Adding a New Capability

1. Create `config/capabilities/myBrowser.js`
2. Export a function returning the capabilities object
3. Add to `config/capabilities/index.js` resolver
4. Use via `BROWSER=myBrowser npm test`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Element not found` | Check selector; element may be in shadow DOM or iframe (auto-resolved). Increase `TIMEOUT_IMPLICIT`. |
| `Stale element reference` | Use `ElementHelper.safeClick()` for automatic retry with re-resolution |
| `WDIO timeout` | Increase `TIMEOUT_IMPLICIT` or `TIMEOUT_PAGE_LOAD` env vars |
| `Allure report empty` | Ensure Java JDK >= 11 is installed and `allure-commandline` is in PATH |
| `Mobile test fails` | Ensure Appium server is running and device/emulator is connected |
| `Excel file not found` | Use absolute path or path relative to project root (where `package.json` lives) |
| `Report backup fails` | Check `REPORT_BACKUP_PATH` is accessible, writable, and exists |
| `Feature generation error` | Ensure `test/data/feature-config.json` has valid excelPath and sheet names |
| `Cross-env not found` | Run `npm install` to ensure all devDependencies are installed |
| `Docker grid timeout` | Wait for grid nodes to register; check `docker-compose logs` |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Follow the code style (ESLint + Prettier): `npm run validate`
4. Write tests for new features
5. Submit a pull request with a clear description

---

## API Reference

All modules are available from a single import point:

```javascript
// UI (also re-exports all core modules)
const {
    BasePage, BaseComponent,
    BrowserManager, ElementHelper,
    ShadowDomResolver, FrameManager,
} = require('@wdio-framework/ui');

// Mobile
const { MobileBasePage } = require('@wdio-framework/mobile');

// Core (helpers, utils, constants)
const {
    ExcelHelper, DataDrivenManager, dataDrivenManager,
    FeatureGenerator, TestExecutionFilter,
    ApiHelper, DataGenerator, FileHelper,
    DateHelper, StringHelper, EncryptionHelper,
    Logger, CustomReporter, RetryHandler,
    ScreenshotManager, PerformanceTracker,
    ReportBackupManager, ConfigResolver,
    Timeouts, Environments, Messages,
} = require('@wdio-framework/core');

// Cloud capabilities (used internally by wdio.cloud.js)
const {
    resolveCloudCapabilities,
    getCloudConnection,
} = require('./config/capabilities');
```

---

## Generating API Documentation

The framework uses [JSDoc](https://jsdoc.app/) to generate a complete, searchable HTML API reference from source code annotations. The generated documentation covers **all three packages** (Core, Web UI, Mobile) and includes class hierarchies, method signatures, parameter descriptions, return types, and usage examples.

### Prerequisites

- Node.js ≥ 18
- Dependencies installed (`npm install`)

The following dev dependencies are used (already declared in `package.json`):

| Package | Purpose |
|---------|---------|
| `jsdoc` | JSDoc documentation generator |
### Generate the Documentation

```bash
# Generate API docs into docs/api/
npm run docs:generate

# Generate and immediately open in browser (Windows)
npm run docs:open

# Remove previously generated docs
npm run docs:clean
```

### Output

The generated documentation is written to:

```
docs/
└── api/
    ├── index.html          ← Entry point (open this in a browser)
    ├── AbstractBasePage.html
    ├── BasePage.html
    ├── MobileBasePage.html
    ├── Logger.html
    ├── ApiHelper.html
    ├── ... (one page per class/module)
    └── scripts/ & styles/
```

> **Note:** `docs/api/` is excluded from version control via `.gitignore`. Each developer/CI pipeline generates their own copy from source.

### Configuration

The JSDoc configuration lives in [`jsdoc.config.json`](jsdoc.config.json) at the project root. Key options:

| Option | Value | Description |
|--------|-------|-------------|
| Source paths | `packages/core/src`, `packages/ui/src`, `packages/mobile/src`, `config/capabilities` | All three packages + cloud capabilities |
| Template | `default` | JSDoc standard HTML template |
| Output | `docs/api` | Generated doc directory |
| Plugins | `plugins/markdown` | Renders Markdown in JSDoc comments |

### Generating Docs in Other Languages

This framework's [Requirements Specification](docs/REQUIREMENTS.md) is **language-agnostic** — it can be implemented in any language. Each language has its own equivalent documentation tool:

| Language | Tool | Command |
|----------|------|---------|
| JavaScript/Node.js | [JSDoc](https://jsdoc.app/) | `npx jsdoc -c jsdoc.config.json` |
| TypeScript | [TypeDoc](https://typedoc.org/) | `npx typedoc --entryPoints src/ --out docs/api` |
| Java | [Javadoc](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html) | `mvn javadoc:javadoc` or `javadoc -d docs/api` |
| Python | [Sphinx](https://www.sphinx-doc.org/) | `sphinx-build -b html docs/source docs/api` |
| C# / .NET | [DocFX](https://dotnet.github.io/docfx/) | `docfx build` |
| Ruby | [YARD](https://yardoc.org/) | `yard doc --output-dir docs/api` |
| Go | [GoDoc](https://pkg.go.dev/) | `godoc -http=:6060` |
| Kotlin | [Dokka](https://github.com/Kotlin/dokka) | `./gradlew dokkaHtml` |

---

## Additional Documentation

- **[Requirements Specification](docs/REQUIREMENTS.md)** — Language-agnostic requirements document (v2.0 — 250+ requirements across 24 sections including cloud testing, configuration resolution, API testing, database, visual regression, accessibility, notifications, and test data management)
- **[API Reference (generated)](docs/api/index.html)** — Auto-generated JSDoc HTML documentation (run `npm run docs:generate` first)
- **[User Guide](docs/USER_GUIDE.html)** — Comprehensive HTML user guide with detailed walkthroughs, visual examples, and searchable API reference
- **[Getting Started](docs/GETTING_STARTED.md)** — Step-by-step onboarding guide for new team members

---

## License

MIT — free to use, modify, and distribute.

---

<p align="center">
  <sub>Built with care by the Enterprise QA Platform Team</sub>
</p>
