# @wdio-framework/core

> Core utilities, helpers, constants, and the `AbstractBasePage` foundation for the WebdriverIO Cucumber framework.

This package is the **shared foundation** — it is automatically installed as a dependency when you install `@wdio-framework/ui` or `@wdio-framework/mobile`.

## Installation

```bash
npm install @wdio-framework/core
```

## What's Included

### Base

| Export | Description |
|--------|-------------|
| `AbstractBasePage` | Platform-agnostic base class with navigation, element interaction, waits, screenshots, JS execution |

### Utilities

| Export | Description |
|--------|-------------|
| `Logger` | Winston-based isolated per-worker/per-scenario logging |
| `CustomReporter` | Allure & Cucumber HTML report generation |
| `RetryHandler` | Configurable retry logic with exponential backoff |
| `ScreenshotManager` | Full-page & viewport screenshot capture |
| `PerformanceTracker` | Navigation Timing API v2 metrics collection |
| `ReportBackupManager` | Archive reports to shared network folder |
| `CustomDriverResolver` | Download & cache browser drivers from a custom/corporate URL |

### Helpers

| Export | Description |
|--------|-------------|
| `ApiHelper` | Axios-based REST API client with interceptors |
| `DataGenerator` | Faker.js data generation utilities |
| `FileHelper` | File I/O (JSON, YAML, CSV, properties) |
| `DateHelper` | dayjs-based date / time formatting & manipulation |
| `StringHelper` | String manipulation utilities |
| `EncryptionHelper` | AES-256-GCM authenticated encryption for secrets (PBKDF2 key derivation) |
| `ExcelHelper` | XLSX read/write for data-driven testing |
| `DataDrivenManager` | Load and filter test data from Excel/JSON/CSV |
| `FeatureGenerator` | Generate .feature files from Excel data |
| `TestExecutionFilter` | Filter specs by tags, priority, module |

### Constants

| Export | Description |
|--------|-------------|
| `Timeouts` | Central timeout values (element, page load, etc.) |
| `Environments` | Environment URL & config mappings |
| `Messages` | Reusable log & error message templates |

### Config

| Export | Description |
|--------|-------------|
| `createBaseHooks()` | Factory producing standard WDIO hooks (logging, reporting, cleanup) |

## Usage

```javascript
const {
    Logger,
    Timeouts,
    ApiHelper,
    DataGenerator,
    createBaseHooks,
} = require('@wdio-framework/core');

// Use Logger
const logger = Logger.getInstance('MyModule');
logger.info('Hello from core');

// Use hooks in wdio.conf.js
const hooks = createBaseHooks({ reportsDir: './reports' });
exports.config = { ...hooks, /* your config */ };
```

## Extending AbstractBasePage

> **Do not extend AbstractBasePage directly in your tests.**
> Use `BasePage` from `@wdio-framework/ui` or `MobileBasePage` from `@wdio-framework/mobile`.

```javascript
// For web testing:
const { BasePage } = require('@wdio-framework/ui');
class LoginPage extends BasePage { /* ... */ }

// For mobile testing:
const { MobileBasePage } = require('@wdio-framework/mobile');
class LoginScreen extends MobileBasePage { /* ... */ }
```

## Custom Driver Resolution

Download browser drivers from an internal/corporate artifact server instead of the default WebDriver auto-management.

**URL Pattern:** `http://<HOST_URL>/<DriverVersion>/<driverName_platform>.zip`

The filename is auto-built from OS + architecture (e.g. `edgedriver_win64.zip`, `edgedriver_linux64.zip`, `edgedriver_mac_arm64.zip`).

### Quick Start

```bash
# .env
DRIVER_HOST_URL=https://artifacts.corp.net/drivers
DRIVER_VERSION=120.0.2210.91
```

The `wdio.conf.js` will automatically download, extract to `.cache/`, and use the driver.

### Programmatic Usage

```javascript
const { CustomDriverResolver } = require('@wdio-framework/core');

// Resolve Edge driver
const edgePath = await CustomDriverResolver.resolve({
    hostUrl: 'https://artifacts.corp.net/drivers',
    driverName: 'edgedriver',
    version: '120.0.2210.91',
    binaryName: 'msedgedriver',
});

// Convenience: get WDIO-ready capability overrides
const overrides = await CustomDriverResolver.resolveEdgeCapabilityOverrides({
    hostUrl: 'https://artifacts.corp.net/drivers',
    version: '120.0.2210.91',
});
// → { 'wdio:edgedriverOptions': { edgedriverCustomPath: '...' } }

// Also supports Chrome & Firefox
const chromeOverrides = await CustomDriverResolver.resolveChromeCapabilityOverrides({ ... });
const geckoOverrides  = await CustomDriverResolver.resolveGeckoCapabilityOverrides({ ... });

// Cache management
CustomDriverResolver.cleanCache();
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DRIVER_HOST_URL` | — | Base URL of the artifact server (required) |
| `DRIVER_VERSION` | — | Driver version string (required) |
| `DRIVER_NAME` | `edgedriver` | Archive prefix |
| `DRIVER_BINARY_NAME` | `msedgedriver` | Executable name inside the archive |
| `DRIVER_CACHE_DIR` | `.cache` | Cache directory under project root |
| `DRIVER_FORCE_DOWNLOAD` | `false` | Re-download even if cached |

## License

MIT
