# Test Automation Framework — Requirements Specification

| Field          | Value                                                    |
|----------------|----------------------------------------------------------|
| **Document ID** | REQ-TAF-001                                             |
| **Version**    | 1.0.0                                                    |
| **Status**     | Approved                                                 |
| **Owner**      | Enterprise QA Platform Team                              |
| **Created**    | 2026-02-28                                               |
| **Scope**      | Language-agnostic specification for a modular, enterprise-grade end-to-end test automation framework |

> **Note — Language-Agnostic:**  This document specifies _what_ the framework must do and _how_ it must behave, without prescribing a specific programming language, test runner, or browser-automation library. It serves as the canonical contract so the same architecture can be implemented in JavaScript (WebdriverIO), Java (Selenium), Python (Playwright), C# (SpecFlow), or any other technology stack.

---

## Table of Contents

- [Test Automation Framework — Requirements Specification](#test-automation-framework--requirements-specification)
  - [Table of Contents](#table-of-contents)
  - [1. Purpose \& Scope](#1-purpose--scope)
    - [1.1 Purpose](#11-purpose)
    - [1.2 Scope](#12-scope)
    - [1.3 Stakeholders](#13-stakeholders)
  - [2. Glossary](#2-glossary)
  - [3. Architectural Requirements](#3-architectural-requirements)
  - [4. Modular Package Structure](#4-modular-package-structure)
  - [5. Core Module Requirements](#5-core-module-requirements)
    - [5.1 Abstract Base Page Object](#51-abstract-base-page-object)
    - [5.2 Logging](#52-logging)
    - [5.3 Retry \& Resilience](#53-retry--resilience)
    - [5.4 Screenshot Management](#54-screenshot-management)
    - [5.5 Performance Tracking](#55-performance-tracking)
    - [5.6 Report Backup](#56-report-backup)
    - [5.7 Custom Driver Resolution](#57-custom-driver-resolution)
    - [5.8 Reporting](#58-reporting)
  - [6. Helper Module Requirements](#6-helper-module-requirements)
    - [6.1 API / HTTP Client](#61-api--http-client)
    - [6.2 Test Data Generation](#62-test-data-generation)
    - [6.3 File I/O](#63-file-io)
    - [6.4 Date \& Time](#64-date--time)
    - [6.5 String Utilities](#65-string-utilities)
    - [6.6 Encryption \& Secrets](#66-encryption--secrets)
    - [6.7 Excel / Spreadsheet](#67-excel--spreadsheet)
    - [6.8 Data-Driven Manager](#68-data-driven-manager)
    - [6.9 Feature / Test Generation](#69-feature--test-generation)
    - [6.10 Test Execution Filter](#610-test-execution-filter)
  - [7. Constants \& Configuration](#7-constants--configuration)
    - [7.1 Timeouts](#71-timeouts)
    - [7.2 Environments](#72-environments)
    - [7.3 Messages \& Labels](#73-messages--labels)
  - [8. Web / Browser UI Module Requirements](#8-web--browser-ui-module-requirements)
    - [8.1 Web Base Page Object](#81-web-base-page-object)
    - [8.2 Reusable UI Component](#82-reusable-ui-component)
    - [8.3 Browser Manager](#83-browser-manager)
    - [8.4 Element Helper](#84-element-helper)
    - [8.5 Shadow DOM Resolver](#85-shadow-dom-resolver)
    - [8.6 Frame Manager](#86-frame-manager)
    - [8.7 Web Capability Factories](#87-web-capability-factories)
    - [8.8 Web Configuration Template](#88-web-configuration-template)
  - [9. Mobile Module Requirements](#9-mobile-module-requirements)
    - [9.1 Mobile Base Page Object](#91-mobile-base-page-object)
    - [9.2 Mobile Capability Factories](#92-mobile-capability-factories)
    - [9.3 Mobile Configuration Template](#93-mobile-configuration-template)
  - [10. Lifecycle Hook Factory](#10-lifecycle-hook-factory)
  - [11. BDD / Gherkin Integration](#11-bdd--gherkin-integration)
  - [12. Environment \& Configuration Management](#12-environment--configuration-management)
  - [13. CI/CD \& Containerisation](#13-cicd--containerisation)
  - [14. Documentation Generation](#14-documentation-generation)
  - [15. Cross-Cutting Concerns](#15-cross-cutting-concerns)
  - [16. Non-Functional Requirements](#16-non-functional-requirements)
  - [17. Cloud Testing Platform Integration](#17-cloud-testing-platform-integration)
    - [17.1 General Cloud Requirements](#171-general-cloud-requirements)
    - [17.2 BrowserStack](#172-browserstack)
    - [17.3 Sauce Labs](#173-sauce-labs)
    - [17.4 LambdaTest](#174-lambdatest)
    - [17.5 Perfecto](#175-perfecto)
  - [18. Configuration Resolution Engine](#18-configuration-resolution-engine)
  - [19. API Testing (Standalone)](#19-api-testing-standalone)
  - [20. Database Testing Support](#20-database-testing-support)
  - [21. Visual Regression Testing](#21-visual-regression-testing)
  - [22. Accessibility Testing](#22-accessibility-testing)
  - [23. Notification \& Alerting](#23-notification--alerting)
  - [24. Test Data Management](#24-test-data-management)
  - [Appendix A — Environment Variables](#appendix-a--environment-variables)
  - [Appendix B — Traceability Matrix](#appendix-b--traceability-matrix)

---

## 1. Purpose & Scope

### 1.1 Purpose

Provide a **single, production-ready test automation framework** that enterprise QA teams can adopt as a baseline to build, maintain, and scale end-to-end test suites for **web** and **mobile** applications under a Behaviour-Driven Development (BDD) workflow.

### 1.2 Scope

| In Scope | Out of Scope |
|----------|-------------|
| Web browser automation (Chrome, Firefox, Edge, Safari) | Unit / integration testing of the application under test |
| Mobile native & hybrid app automation (Android, iOS) | Performance / load testing infrastructure (JMeter, Gatling) |
| Data-driven testing via Excel, JSON, YAML, CSV | Security penetration testing (OWASP ZAP, Burp Suite) |
| API testing support (REST, GraphQL, SOAP) | Test management tool integrations (Jira, qTest, etc.) |
| Cloud testing platforms (BrowserStack, Sauce Labs, LambdaTest, Perfecto) | |
| Parallel & distributed execution | |
| Multi-environment support (dev, staging, prod) | |
| Three-tier configuration resolution (env var > env config > defaults) | |
| Visual regression testing support | |
| Accessibility testing support | |
| Database testing support (query validation, setup/teardown) | |
| Reporting (HTML, Allure, Cucumber) | |
| CI/CD pipeline templates (GitHub Actions, Docker) | |
| Notification & alerting (Slack, email) | |
| Test data generation (faker-based synthetic data) | |
| Complete API documentation generation for end users | |

### 1.3 Stakeholders

| Role | Interest |
|------|----------|
| QA Engineers | Write & execute tests using BDD syntax; consume helpers & page objects |
| Developers | Extend the framework; integrate into CI pipelines |
| QA Leads / Managers | Govern test strategy; review reports & metrics |
| DevOps / SRE | Deploy in containers; configure via environment variables |
| Architects | Evaluate modularity, security, and performance characteristics |

---

## 2. Glossary

| Term | Definition |
|------|-----------|
| **Page Object** | A class encapsulating the UI elements and interactions of a single page or screen. |
| **Base Page** | An abstract class providing shared functionality (navigation, element interaction, waits) that all page objects extend. |
| **Component Object** | A reusable class representing a UI fragment (header, modal, search bar) scoped to a root selector. |
| **BDD** | Behaviour-Driven Development — tests are authored in Gherkin (Given / When / Then) syntax. |
| **Step Definition** | Code binding a Gherkin step to automation logic. |
| **Data-Driven** | Test scenarios parameterised by external data (Excel, JSON, CSV). |
| **Shadow DOM** | Encapsulated DOM subtree attached to a host element; requires special traversal. |
| **Frame / Iframe** | An embedded browsing context within a page; automation must switch into it. |
| **Circuit Breaker** | A resilience pattern that opens after repeated failures and automatically retries after a cooldown. |
| **Singleton** | A pattern ensuring only one instance of a class exists across the process. |
| **Hook** | A lifecycle callback (before/after test, scenario, step, etc.) injected into the test runner. |
| **Capability** | A JSON object telling the browser/device driver what kind of session to start. |

---

## 3. Architectural Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **ARCH-01** | The framework SHALL be structured as a **monorepo** with independently publishable packages. | Must |
| **ARCH-02** | The framework SHALL follow a **three-layer** package structure: **Core**, **Web UI**, **Mobile**. | Must |
| **ARCH-03** | Core SHALL have **zero dependency** on Web UI or Mobile packages. | Must |
| **ARCH-04** | Web UI and Mobile packages SHALL each **depend on Core** but NOT on each other. | Must |
| **ARCH-05** | Consumer projects SHALL be able to install only the package they need (e.g. Web UI) and receive Core transitively. | Must |
| **ARCH-06** | Each package SHALL re-export all public symbols from Core so consumers can use a single import source. | Should |
| **ARCH-07** | The framework SHALL support **Node.js ≥ 18** or equivalent runtime in the target language. | Must |
| **ARCH-08** | All user-facing configuration SHALL be overridable via **environment variables** without code changes. | Must |
| **ARCH-09** | The framework SHALL support a `.env` file for local development convenience. | Should |
| **ARCH-10** | The framework SHALL include an environment variable reference (`.env.example`) documenting every supported variable. | Must |

---

## 4. Modular Package Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         CORE PACKAGE                            │
│  Abstract Base Page │ Logger │ Retry Handler │ Screenshot Mgr   │
│  Performance Tracker │ Report Backup │ Driver Resolver          │
│  API Helper │ Data Generator │ File Helper │ Date Helper        │
│  String Helper │ Encryption Helper │ Excel Helper               │
│  Data-Driven Manager │ Feature Generator │ Execution Filter     │
│  Timeouts │ Environments │ Messages │ Lifecycle Hook Factory    │
├──────────────────────────┬──────────────────────────────────────┤
│     WEB UI PACKAGE       │       MOBILE PACKAGE                 │
│     (depends on Core)    │       (depends on Core)              │
│                          │                                      │
│  Web Base Page           │  Mobile Base Page                    │
│  Component Object        │  Touch Gestures                     │
│  Browser Manager         │  Context Switching                  │
│  Element Helper          │  App Lifecycle                      │
│  Shadow DOM Resolver     │  Device Utilities                   │
│  Frame Manager           │  Platform-Aware Selectors           │
│  Web Capability Factories│  Mobile Capability Factories        │
│  Web Config Template     │  Mobile Config Template             │
└──────────────────────────┴──────────────────────────────────────┘
```

| ID | Requirement | Priority |
|----|-------------|----------|
| **PKG-01** | Each package SHALL have its own `package.json` (or equivalent manifest) declaring dependencies. | Must |
| **PKG-02** | Each package SHALL have a barrel / index entry point exporting all public symbols. | Must |
| **PKG-03** | Each package SHALL include a README describing installation, API summary, and usage examples. | Must |
| **PKG-04** | Type declarations (TypeScript `.d.ts`, Java interfaces, Python stubs) SHALL be provided for IDE auto-completion. | Should |
| **PKG-05** | Core SHALL export **all** helpers, utilities, constants, and the abstract base page. | Must |
| **PKG-06** | Each package SHALL declare a semantic version following SemVer 2.0. | Must |

---

## 5. Core Module Requirements

### 5.1 Abstract Base Page Object

The Abstract Base Page is the **root class** for every page/screen object. It is **platform-agnostic** and SHALL NOT contain web-only or mobile-only logic.

| ID | Requirement | Priority |
|----|-------------|----------|
| **BP-01** | SHALL provide `open(path)` to navigate to a URL (relative to base URL). | Must |
| **BP-02** | SHALL provide `openAbsoluteUrl(url)` for fully-qualified URLs. | Must |
| **BP-03** | SHALL provide `refresh()`, `goBack()`, `goForward()` navigation methods. | Must |
| **BP-04** | SHALL provide `getPageTitle()`, `getCurrentUrl()`, `getPageSource()` query methods. | Must |
| **BP-05** | SHALL provide element interaction: `click`, `doubleClick`, `rightClick`, `setValue`, `addValue`, `clearValue`. | Must |
| **BP-06** | SHALL provide element queries: `getText`, `getValue`, `getAttribute`, `getCssProperty`. | Must |
| **BP-07** | SHALL provide state checks: `isDisplayed`, `isExisting`, `isEnabled`, `isSelected`. All SHALL return `false` on error (no throw). | Must |
| **BP-08** | SHALL provide hover, scroll-into-view, and highlight-element debugging utilities. | Must |
| **BP-09** | SHALL provide explicit waits: `waitForDisplayed`, `waitForExist`, `waitForClickable`, `waitForEnabled`, `waitForNotDisplayed`, `waitForNotExist`. Each SHALL accept an optional timeout defaulting to the configured element wait. | Must |
| **BP-10** | SHALL provide custom wait: `waitUntil(conditionFn, timeout, message)`. | Must |
| **BP-11** | SHALL provide page-level waits: `waitForPageLoad`, `waitForUrlContains`, `waitForTitleContains`. | Must |
| **BP-12** | SHALL provide JavaScript execution: `executeScript(script, ...args)`, `executeAsyncScript(script, ...args)`. | Must |
| **BP-13** | SHALL provide a JavaScript-based click (`jsClick`) for intercepted-element workarounds. | Should |
| **BP-14** | SHALL provide scroll utilities: `scrollToTop`, `scrollToBottom`, `scrollByPixels`. | Should |
| **BP-15** | SHALL provide screenshot capture: `takeScreenshot(name)`, `takeElementScreenshot(element, name)`. | Must |
| **BP-16** | SHALL provide keyboard actions: `pressKey`, `pressKeys`. | Must |
| **BP-17** | SHALL provide `dragAndDrop(source, target)`. | Should |
| **BP-18** | SHALL provide `uploadFile(element, filePath)`. | Should |
| **BP-19** | SHALL provide `pause(ms)` with a log warning to discourage overuse. | Should |
| **BP-20** | All interactions SHALL auto-resolve selectors: a string selector is converted to a live element before action. | Must |
| **BP-21** | SHALL define an overridable `isLoaded()` method returning a boolean indicating page readiness. Default SHALL return `true`. | Must |
| **BP-22** | SHALL define an optional `url` property that `open()` uses when no explicit path is provided. | Must |
| **BP-23** | Subclass-specific resolution (Shadow DOM, frames) SHALL be injectable via an overridable `_resolveElement` method. | Must |
| **BP-24** | All actions SHALL log their operation (element description, action name) at info/debug level. | Should |
| **BP-25** | SHALL provide a `highlightElement(element, duration)` method for visual debugging. | Should |

---

### 5.2 Logging

| ID | Requirement | Priority |
|----|-------------|----------|
| **LOG-01** | SHALL provide a named-logger factory: `Logger.getInstance(label)`. Loggers SHALL be cached per label. | Must |
| **LOG-02** | SHALL support multiple log levels: `error`, `warn`, `info`, `debug`. Level SHALL be configurable via `LOG_LEVEL` env var. | Must |
| **LOG-03** | SHALL write to the console with **colour-coded, timestamped** output. | Must |
| **LOG-04** | SHALL write to rotate-capable log files with timestamps and structured format. | Must |
| **LOG-05** | SHALL support **per-worker isolation**: each parallel worker writes to its own log directory. `setWorkerContext(workerId)` configures this. | Must |
| **LOG-06** | SHALL support **per-scenario isolation**: `setScenarioContext(name)` creates a dedicated scenario log file; `clearScenarioContext()` closes it. | Must |
| **LOG-07** | SHALL provide an aggregated error log collecting errors from all workers. | Should |
| **LOG-08** | SHALL provide `flushAll()` for graceful shutdown and `reset()` for test isolation. | Must |
| **LOG-09** | Console log level and file log level SHOULD be independently configurable (e.g. `CONSOLE_LOG_LEVEL`). | Should |
| **LOG-10** | Log directory SHALL be configurable via `LOG_DIR` env var, defaulting to `<project_root>/logs`. | Must |

---

### 5.3 Retry & Resilience

| ID | Requirement | Priority |
|----|-------------|----------|
| **RET-01** | SHALL provide a generic `retry(fn, options)` method supporting: `maxAttempts`, `delay`, `exponentialBackoff`, `onRetry` callback, `shouldRetry` predicate. | Must |
| **RET-02** | SHALL support a backward-compatible alias (`maxRetries`) for `maxAttempts`. | Should |
| **RET-03** | SHALL provide a `retryBrowserAction(fn, maxRetries)` method that specifically handles stale element, not-interactable, click-intercepted, and element-not-found errors. | Must |
| **RET-04** | SHALL provide a **Circuit Breaker** factory: `createCircuitBreaker({ threshold, cooldown })`. | Must |
| **RET-05** | Circuit breaker SHALL support three states: **closed** (normal), **open** (failing — rejects immediately), **half-open** (allows one probe request). | Must |
| **RET-06** | Circuit breaker SHALL auto-transition: closed → open after `threshold` consecutive failures; open → half-open after `cooldown` ms; half-open → closed on success or → open on failure. | Must |
| **RET-07** | Circuit breaker SHALL expose `execute(fn)`, `reset()`, and a read-only `state` property. | Must |

---

### 5.4 Screenshot Management

| ID | Requirement | Priority |
|----|-------------|----------|
| **SCR-01** | SHALL provide `capture(name)` — viewport screenshot saved to a configurable directory. Returns file path or `null` on error. | Must |
| **SCR-02** | SHALL provide `captureOnFailure(scenarioName)` with a `FAILED_` prefix for easy identification. | Must |
| **SCR-03** | SHALL provide `captureFullPage(name)` for full-page screenshots (with viewport fallback). | Should |
| **SCR-04** | SHALL provide `captureElement(element, name)` for element-specific screenshots. | Should |
| **SCR-05** | SHALL provide `captureAsBase64()` for embedding in reports. | Must |
| **SCR-06** | SHALL provide `cleanOldScreenshots(daysOld)` to prune screenshots older than N days. Only regular files SHALL be deleted (not directories). | Should |
| **SCR-07** | Screenshot directory SHALL default to `<project_root>/screenshots`. | Must |
| **SCR-08** | `capture` SHALL NOT throw — errors SHALL be caught, logged, and `null` returned. | Must |

---

### 5.5 Performance Tracking

| ID | Requirement | Priority |
|----|-------------|----------|
| **PERF-01** | SHALL implement a **Singleton** pattern with `getInstance()`. | Must |
| **PERF-02** | SHALL provide `startTimer(name)` and `stopTimer(name)` for manual timing. When an existing timer is overwritten, a warning SHALL be logged. | Must |
| **PERF-03** | SHALL provide `measure(name, fn)` to time an async operation automatically. | Must |
| **PERF-04** | SHALL provide `getPagePerformance()` to collect browser Navigation Timing API metrics: `domContentLoaded`, `domComplete`, `loadComplete`, `timeToFirstByte`, `dnsLookup`, `tcpConnect`, `serverResponseTime`, `pageRendering`, `redirectTime`, transfer sizes. Returns `null` when metrics are unavailable. | Must |
| **PERF-05** | SHALL provide `getResourcePerformance()` to list resource entries (name, type, duration, transferSize). | Should |
| **PERF-06** | SHALL provide `assertPageLoadUnder(maxMs)` that throws an error if page load exceeds the threshold. SHALL throw if perf data is `null`. | Must |
| **PERF-07** | SHALL provide `getMetrics()` and `clearMetrics()` for collected timer data. | Must |
| **PERF-08** | SHALL provide `resetInstance()` for test isolation. | Should |

---

### 5.6 Report Backup

| ID | Requirement | Priority |
|----|-------------|----------|
| **BKP-01** | SHALL copy the reports directory to a configurable destination (UNC path or local). | Must |
| **BKP-02** | SHALL support optional ZIP compression via a `compress` flag. | Should |
| **BKP-03** | SHALL automatically prune old backups, keeping the last N (configurable via `keepLastN`). | Must |
| **BKP-04** | SHALL generate an `index.html` listing all backups with timestamps. HTML output SHALL be XSS-safe (escaped). | Must |
| **BKP-05** | SHALL be toggleable via `REPORT_BACKUP_ENABLE` env var. When disabled, `backup()` is a no-op returning `null`. | Must |
| **BKP-06** | SHALL provide `listBackups()` returning backup metadata sorted newest-first. | Should |
| **BKP-07** | Backup folder naming SHALL include a timestamp in `YYYYMMdd_HHmmss` format. | Must |
| **BKP-08** | SHALL support a configurable project name for folder naming. | Should |
| **BKP-09** | Individual internal failures (pruning, index generation) SHALL be caught and logged, not propagated. | Must |

---

### 5.7 Custom Driver Resolution

| ID | Requirement | Priority |
|----|-------------|----------|
| **DRV-01** | SHALL download browser driver archives from a configurable corporate/internal URL. | Must |
| **DRV-02** | URL pattern SHALL be: `<HOST_URL>/<VERSION>/<driverName_platform>.zip`. Platform and architecture SHALL be auto-detected from the OS. | Must |
| **DRV-03** | Downloads SHALL follow HTTP redirects (up to 5 hops). Relative redirect URLs SHALL be correctly resolved. | Must |
| **DRV-04** | Downloaded archives SHALL be extracted to a local cache directory (default `.cache/`). | Must |
| **DRV-05** | If the binary already exists in cache and `forceDownload` is false, download SHALL be skipped. | Must |
| **DRV-06** | SHALL support optional **SHA-256 checksum verification** post-download. On mismatch, the corrupt file SHALL be deleted and an error thrown. | Should |
| **DRV-07** | Extraction SHALL use a fallback chain: native library → system `unzip`/`Expand-Archive`. Shell commands SHALL use argument-array execution (no string interpolation) to prevent command injection. | Must |
| **DRV-08** | SHALL set executable permissions (`chmod 755`) on Unix platforms. | Must |
| **DRV-09** | SHALL provide convenience methods returning capability override objects for each supported browser (Edge, Chrome, Firefox). | Should |
| **DRV-10** | SHALL provide `cleanCache()` to remove all cached drivers. | Should |
| **DRV-11** | All options SHALL be overridable via env vars: `DRIVER_HOST_URL`, `DRIVER_VERSION`, `DRIVER_NAME`, `DRIVER_BINARY_NAME`, `DRIVER_CACHE_DIR`, `DRIVER_FORCE_DOWNLOAD`. | Must |

---

### 5.8 Reporting

| ID | Requirement | Priority |
|----|-------------|----------|
| **RPT-01** | SHALL support attaching screenshots (Base64 PNG), text, and JSON to BDD reports. | Must |
| **RPT-02** | SHALL generate Allure `environment.properties` and `categories.json` for defect classification. | Must |
| **RPT-03** | SHALL generate a multi-browser Cucumber HTML report from JSON results. | Must |
| **RPT-04** | Categories SHALL include: Element Not Found, Timeout Failures, Assertion Failures, Infrastructure Issues. | Should |

---

## 6. Helper Module Requirements

### 6.1 API / HTTP Client

| ID | Requirement | Priority |
|----|-------------|----------|
| **API-01** | SHALL provide a class-based HTTP client constructed with `baseURL` and optional default headers. | Must |
| **API-02** | SHALL support all standard methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. | Must |
| **API-03** | SHALL support GraphQL via `graphql(url, query, variables)`. | Should |
| **API-04** | SHALL support multipart file upload via `uploadFile(url, filePath, fieldName, additionalData)`. | Should |
| **API-05** | SHALL wrap every response with: `status`, `statusText`, `headers`, `data`, `duration`, `isSuccess()`, `isClientError()`, `isServerError()`. | Must |
| **API-06** | SHALL automatically log request/response details including duration. | Must |
| **API-07** | SHALL provide auth helpers: `setBearerToken`, `setBasicAuth`, `setHeader`, `clearAuth`. | Must |
| **API-08** | SHALL provide `enableRetry(config)` for automatic retry on 5xx and network errors. Retry SHALL use the Retry Handler. | Should |
| **API-09** | SHALL provide `pollUntil(url, conditionFn, options)` for polling endpoints until a condition is met, with configurable interval and timeout. | Should |
| **API-10** | `pollUntil` SHALL validate the `method` parameter against available HTTP methods. | Should |
| **API-11** | `pollUntil` SHALL support an `AbortController` / `signal` parameter for external cancellation. | Should |
| **API-12** | SHALL provide a static factory method: `ApiHelper.create(baseURL, headers)`. | Should |

---

### 6.2 Test Data Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| **GEN-01** | SHALL provide static methods for generating: users, addresses, companies, credit cards, products. | Must |
| **GEN-02** | All generators SHALL accept an `overrides` object to replace selected fields. | Must |
| **GEN-03** | SHALL provide atomic generators: `email`, `password`, `UUID`, `phone`, `number`, `float`, `boolean`, `paragraph`, `sentence`, `word`, `words`, `url`, `ip`, `color`. | Must |
| **GEN-04** | SHALL provide date generators: `pastDate`, `futureDate`, `dateBetween`, `recentDate`. | Should |
| **GEN-05** | SHALL provide collection utilities: `pickRandom`, `pickMultipleRandom`, `shuffle`. | Must |
| **GEN-06** | SHALL provide `fromTemplate(template)` using `#` (digit), `?` (letter), `*` (alphanumeric) placeholders. | Should |
| **GEN-07** | SHALL provide `generateTestId(prefix)` producing a unique timestamped identifier. | Should |
| **GEN-08** | SHALL provide `seed(value)` for deterministic / reproducible test data. | Must |
| **GEN-09** | SHALL provide `setLocale(locale)` to control locale-specific data. Implementation SHALL use the canonical setter of the underlying library. | Should |

---

### 6.3 File I/O

| ID | Requirement | Priority |
|----|-------------|----------|
| **FIO-01** | SHALL provide read/write for: plain text, JSON, YAML, CSV. | Must |
| **FIO-02** | CSV parser SHALL handle RFC 4180 quoted fields and escaped double-quotes. | Must |
| **FIO-03** | CSV reader SHALL strip UTF-8 BOM (`\uFEFF`) from Windows-created files. | Should |
| **FIO-04** | JSON read errors SHALL include the file path in the error message. | Should |
| **FIO-05** | SHALL provide directory operations: `ensureDirectory`, `listFiles`, `listFilesRecursive`, `cleanDirectory`, `deleteDirectory`. | Must |
| **FIO-06** | SHALL provide file operations: `exists`, `deleteFile`, `copyFile`, `moveFile`, `getFileSize`, `getFileSizeFormatted`. | Must |
| **FIO-07** | SHALL provide `waitForFileDownload(dir, pattern, timeout)` that polls for a matching file. | Should |
| **FIO-08** | SHALL provide `createTempFile(content, extension)` tracked by the framework, plus `cleanupTempFiles()` for cleanup. | Should |
| **FIO-09** | All path operations SHALL use the platform's path-joining utility to ensure cross-platform compatibility. | Must |

---

### 6.4 Date & Time

| ID | Requirement | Priority |
|----|-------------|----------|
| **DAT-01** | SHALL provide formatting: `now(format)`, `today(format)`, `timestamp()`, `isoNow()`, `format(date, format)`, `fileTimestamp()`. | Must |
| **DAT-02** | SHALL provide arithmetic: `addDays`, `subtractDays`, `addMonths`, `addYears`. | Must |
| **DAT-03** | SHALL provide comparison: `diffInDays`, `diffInHours`, `diffInMinutes`, `isBefore`, `isAfter`, `isBetween`. | Must |
| **DAT-04** | SHALL provide boundaries: `startOfDay`, `endOfDay`. | Should |
| **DAT-05** | SHALL provide locale-aware names: `getMonthName`, `getDayOfWeek`. | Should |
| **DAT-06** | SHALL provide relative time: `timeAgo(date)` (e.g. "2 hours ago"). | Should |
| **DAT-07** | SHALL provide `isValidDate(value)` returning a boolean. | Should |
| **DAT-08** | The underlying date library SHALL be lightweight (e.g. dayjs, java.time, etc. — not a heavy library like Moment.js). | Should |

---

### 6.5 String Utilities

| ID | Requirement | Priority |
|----|-------------|----------|
| **STR-01** | SHALL provide case conversions: `capitalize`, `capitalizeWords`, `toCamelCase`, `toKebabCase`, `toSnakeCase`. | Must |
| **STR-02** | `toCamelCase` SHALL correctly lowercase the first character. | Must |
| **STR-03** | SHALL provide `truncate(str, maxLength, suffix)`. | Should |
| **STR-04** | SHALL provide whitespace operations: `removeWhitespace`, `normalizeWhitespace`. | Should |
| **STR-05** | SHALL provide search: `contains(str, substring, caseInsensitive)`. | Should |
| **STR-06** | SHALL provide extraction: `extractNumbers`, `extractEmails`, `extractUrls`. | Should |
| **STR-07** | SHALL provide validation: `isEmail`, `isUrl`, `isNumeric`. | Should |
| **STR-08** | SHALL provide padding: `padLeft`, `padRight`. | Should |
| **STR-09** | SHALL provide `generateRandom(length, charset)` and `mask(str, visibleChars, maskChar)`. | Should |
| **STR-10** | SHALL provide `looseEquals(a, b)` for case-insensitive whitespace-normalized comparison. | Should |
| **STR-11** | SHALL provide `escapeRegex(str)` to escape special regex characters (extract from inline usage). | Should |
| **STR-12** | SHALL provide `escapeHtml(str)` to escape `<`, `>`, `&`, `"`, `'` for safe HTML embedding. | Should |
| **STR-13** | All methods SHALL gracefully handle `null`/`undefined` input (treat as empty string). | Should |

---

### 6.6 Encryption & Secrets

| ID | Requirement | Priority |
|----|-------------|----------|
| **ENC-01** | SHALL use **authenticated encryption** (e.g. AES-256-GCM) with a strong key derivation function (e.g. PBKDF2, ≥ 100 000 iterations). | Must |
| **ENC-02** | Ciphertext format SHALL be self-describing and include: salt, IV, auth tag, encrypted data. All hex-encoded. | Must |
| **ENC-03** | SHALL support backward-compatible **legacy decryption** (auto-detect old format by part count). | Should |
| **ENC-04** | `encrypt()` SHALL validate that `plainText` is a non-empty string. | Should |
| **ENC-05** | SHALL provide utility methods: `generateKey`, `hash` (SHA-256), `generateSecureRandom`, `base64Encode`, `base64Decode`. | Must |
| **ENC-06** | Utility methods (`hash`, `base64Encode`, `base64Decode`) SHALL validate input is a string. | Should |
| **ENC-07** | Passphrase SHALL be resolved from an env var (`ENCRYPTION_KEY`) as fallback when not passed explicitly. | Must |

---

### 6.7 Excel / Spreadsheet

| ID | Requirement | Priority |
|----|-------------|----------|
| **XLS-01** | SHALL provide `readWorkbook(path)` returning all sheets as row-object arrays. | Must |
| **XLS-02** | SHALL provide `readSheet(path, sheetName)` for a single sheet. | Must |
| **XLS-03** | SHALL provide `readSheetAsArray(path, sheetName)` for raw 2D arrays. | Should |
| **XLS-04** | SHALL provide `getSheetNames(path)`. | Should |
| **XLS-05** | SHALL provide filtering: `getFilteredRows`, `getExecutableRows(flagColumn)`, `getRowByKey`, `getUniqueColumnValues`. | Must |
| **XLS-06** | SHALL provide write operations: `writeToExcel(path, data, sheetName)`, `appendToExcel`, `updateCell`. | Must |
| **XLS-07** | `updateCell` SHALL auto-detect value type (number, boolean, string). | Must |
| **XLS-08** | SHALL provide conversion: `excelToJson`, `jsonToExcel`. | Should |
| **XLS-09** | SHALL provide Gherkin integration: `toGherkinExamples(path, sheet, columns, filters)`, `toCucumberTable(...)`. | Should |
| **XLS-10** | SHALL implement a **workbook cache** (LRU, configurable max entries) validated by file modification time. Write operations SHALL invalidate the cache. | Must |
| **XLS-11** | SHALL provide a public `clearCache()` method for test isolation. | Should |
| **XLS-12** | All read methods SHALL consistently use the cache. | Must |

---

### 6.8 Data-Driven Manager

| ID | Requirement | Priority |
|----|-------------|----------|
| **DDM-01** | SHALL provide a **fluent API**: `loadJson(path).loadExcel(path).get(keyPath)`. | Must |
| **DDM-02** | SHALL support data sources: JSON, JSON directory, Excel (all sheets), Excel (single sheet). | Must |
| **DDM-03** | SHALL provide `get(keyPath, default)` using dot-notation (e.g. `"users.admin.email"`). | Must |
| **DDM-04** | SHALL resolve environment variable overrides: `DATA_<UPPER_KEY>` env var takes precedence. | Should |
| **DDM-05** | SHALL provide row-filtering: `getFilteredRows`, `getTargetedRows(flagColumn)`, `getRowsByTag`. | Must |
| **DDM-06** | SHALL provide `interpolate(template)` replacing `{{key.path}}` placeholders with loaded data. Unresolved placeholders SHALL be logged at debug level. | Must |
| **DDM-07** | SHALL provide `resolveObject(obj)` performing deep-clone with recursive placeholder resolution. SHALL NOT use JSON serialisation round-trip (to preserve non-serialisable types). | Must |
| **DDM-08** | Key collisions during cache rebuild SHALL log a warning. | Should |
| **DDM-09** | SHALL provide `clear()` and `getSummary()` for lifecycle management. | Must |
| **DDM-10** | SHALL export both a class (for custom instances) and a pre-built singleton. | Should |

---

### 6.9 Feature / Test Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| **FGN-01** | SHALL generate Gherkin `.feature` files from Excel data, JSON data, or template files. | Must |
| **FGN-02** | Generated Examples tables SHALL escape pipe characters (`\|`) in cell values. | Must |
| **FGN-03** | Null/undefined cell values SHALL be converted to empty strings (not `"null"` or `"undefined"`). | Must |
| **FGN-04** | Templates SHALL support placeholders: `{{EXAMPLES_TABLE}}`, `{{TAG_LINE}}`, `{{FEATURE_NAME}}`. | Should |
| **FGN-05** | SHALL generate WDIO runner configuration files per tag/suite for distributed execution. | Should |
| **FGN-06** | Generated runner specs SHALL normalise path separators to forward slashes for cross-platform compatibility. | Should |
| **FGN-07** | SHALL provide `cleanGenerated()` to remove all generated files. | Should |

---

### 6.10 Test Execution Filter

| ID | Requirement | Priority |
|----|-------------|----------|
| **TEF-01** | SHALL load an execution matrix from Excel or JSON. | Must |
| **TEF-02** | SHALL filter rows by: execute flag, environment, browser, tags. | Must |
| **TEF-03** | SHALL produce a list of spec file paths and/or a tag expression for the test runner. | Must |
| **TEF-04** | SHALL provide `toWdioConfig()` (or equivalent) returning a runner config override object. | Should |
| **TEF-05** | Column names (execute, env, browser, tags, feature) SHALL be configurable. | Should |

---

## 7. Constants & Configuration

### 7.1 Timeouts

| ID | Requirement | Priority |
|----|-------------|----------|
| **TMO-01** | SHALL define constants: `ELEMENT_WAIT`, `PAGE_LOAD`, `SCRIPT`, `SHORT`, `MEDIUM`, `LONG`, `EXTRA_LONG`, `POLL_INTERVAL`, `API_REQUEST`, `FILE_DOWNLOAD`, `ANIMATION`. | Must |
| **TMO-02** | At minimum `ELEMENT_WAIT`, `PAGE_LOAD`, and `SCRIPT` SHALL be overridable via env vars (`TIMEOUT_IMPLICIT`, `TIMEOUT_PAGE_LOAD`, `TIMEOUT_SCRIPT`). | Must |
| **TMO-03** | All remaining timeout constants SHOULD also be overridable via env vars (e.g. `TIMEOUT_SHORT`, `TIMEOUT_API_REQUEST`). | Should |
| **TMO-04** | The Timeouts object SHALL be frozen / immutable after initialisation. | Must |

---

### 7.2 Environments

| ID | Requirement | Priority |
|----|-------------|----------|
| **ENV-01** | SHALL define at least: `DEV`, `STAGING`, `PROD` environments. Each SHALL have `name`, `baseUrl`, `apiUrl`. | Must |
| **ENV-02** | Environment URLs SHALL be overridable via env vars (e.g. `BASE_URL_DEV`, `API_URL_STAGING`). | Must |
| **ENV-03** | SHALL provide `getEnvironment()` that resolves from `TEST_ENV` env var. Unknown values SHALL throw a descriptive error. | Must |
| **ENV-04** | Additional environments (e.g. QA, UAT) SHOULD be easy to add without code changes. | Should |

---

### 7.3 Messages & Labels

| ID | Requirement | Priority |
|----|-------------|----------|
| **MSG-01** | SHALL define reusable message constants for: element not found, not visible, not clickable, page not loaded, login success/fail, logout, field required, email invalid, password short, API failed, API timeout. | Must |
| **MSG-02** | SHALL provide template functions: `expected(actual, expected)`, `contains(actual, substring)` for assertion messages. | Should |
| **MSG-03** | The Messages object SHALL be frozen / immutable. | Must |

---

## 8. Web / Browser UI Module Requirements

### 8.1 Web Base Page Object

| ID | Requirement | Priority |
|----|-------------|----------|
| **WBP-01** | SHALL extend the Core Abstract Base Page. | Must |
| **WBP-02** | SHALL provide dropdown interaction: `selectByVisibleText`, `selectByValue`, `selectByIndex`. | Must |
| **WBP-03** | SHALL provide frame management: `switchToFrame`, `switchToParentFrame`, `switchToDefaultContent`. | Must |
| **WBP-04** | SHALL provide window/tab management: `switchToWindow`, `switchToNewWindow`, `closeCurrentWindow`, `getWindowCount`. | Must |
| **WBP-05** | SHALL provide alert interaction: `acceptAlert`, `dismissAlert`, `getAlertText`, `sendAlertText`. | Must |
| **WBP-06** | SHALL provide cookie management: `getCookie`, `getAllCookies`, `setCookie`, `deleteCookie`, `deleteAllCookies`. | Must |
| **WBP-07** | SHALL provide web storage management: `setLocalStorage`, `getLocalStorage`, `clearLocalStorage`, `setSessionStorage`, `getSessionStorage`. | Must |
| **WBP-08** | SHALL override `_resolveElement` to support: `>>>` deep shadow selectors, standard selectors, auto shadow DOM fallback, auto frame fallback. | Must |
| **WBP-09** | `autoResolveShadowDom` and `autoResolveFrames` SHALL default to `false` (opt-in) for performance. | Must |
| **WBP-10** | SHALL integrate `ShadowDomResolver` and `FrameManager` as instance dependencies. | Must |

---

### 8.2 Reusable UI Component

| ID | Requirement | Priority |
|----|-------------|----------|
| **CMP-01** | SHALL scope all interactions to a `rootSelector` provided at construction. | Must |
| **CMP-02** | The `root` getter SHALL return a promise resolving to the root element. | Must |
| **CMP-03** | SHALL support an optional `shadow` flag to resolve root via the Shadow DOM Resolver. | Should |
| **CMP-04** | SHALL provide: `isDisplayed`, `waitForDisplayed`, `waitForNotDisplayed`, `click(child)`, `getText(child)`, `setValue(child, value)`, `getElements(childSelector)`, `getElementCount(childSelector)`. | Must |
| **CMP-05** | All child interactions SHALL correctly await the root element before chaining `.$()` calls. | Must |

---

### 8.3 Browser Manager

| ID | Requirement | Priority |
|----|-------------|----------|
| **BRM-01** | SHALL implement a Singleton pattern with `getInstance()`. | Must |
| **BRM-02** | SHALL provide window sizing: `maximize`, `setWindowSize`, `getWindowSize`, `fullScreen`, `minimize`. | Must |
| **BRM-03** | SHALL provide tab management: `openNewTab`, `openNewWindow`, `switchToWindowByTitle`, `switchToWindowByUrl`, `closeAllTabsExceptMain`. | Must |
| **BRM-04** | SHALL provide browser info: `getBrowserName`, `getBrowserVersion`, `getPlatformName`. | Should |
| **BRM-05** | SHALL delegate performance metrics to `PerformanceTracker` (no inline implementation). | Must |
| **BRM-06** | SHALL provide network simulation (CDP-based): `setNetworkConditions`, `simulateOffline`, `simulateSlow3G`. | Should |
| **BRM-07** | SHALL provide `clearBrowserData` and `deleteAllCookies`. | Must |
| **BRM-08** | SHALL provide `resetInstance()` for test isolation. | Should |

---

### 8.4 Element Helper

| ID | Requirement | Priority |
|----|-------------|----------|
| **ELH-01** | SHALL provide smart `resolve(selectorOrElement)`: standard → deep shadow → shadow fallback → frame fallback. | Must |
| **ELH-02** | SHALL provide safe interaction methods with retry: `safeClick`, `safeSetValue`, `safeGetText`. Retry SHALL re-resolve the element on each attempt. | Must |
| **ELH-03** | SHALL provide attribute/text waits: `waitForTextToBe`, `waitForTextContains`, `waitForAttributeToBe`. | Must |
| **ELH-04** | SHALL provide bulk operations: `getVisibleElements`, `getTextFromAll`, `clickElementByText`, `isTextPresentInAny`, `countVisibleElements`, `waitForElementCount`. | Should |
| **ELH-05** | Fallback resolution SHALL return the cached element (not re-query) when shadow/frame resolution also fails. | Must |

---

### 8.5 Shadow DOM Resolver

| ID | Requirement | Priority |
|----|-------------|----------|
| **SDR-01** | SHALL detect deep selectors (containing `>>>`). | Must |
| **SDR-02** | SHALL resolve multi-level deep selectors by traversing `shadowRoot` at each `>>>` boundary. | Must |
| **SDR-03** | SHALL provide `deepFindElement(css, timeout)` for exhaustive DFS through ALL shadow roots on the page. | Must |
| **SDR-04** | SHALL provide `deepFindAllElements(css)` for finding all matches across all shadow roots. | Should |
| **SDR-05** | SHALL provide diagnostic queries: `hasShadowDom()`, `countShadowRoots()`. | Should |
| **SDR-06** | `deepFindElement` SHALL poll/wait (not just one-shot) to handle dynamically rendered shadow content. | Must |
| **SDR-07** | `deepFindElement` SHALL NOT make redundant browser calls — the element found inside `waitUntil` SHALL be captured and returned directly. | Must |

---

### 8.6 Frame Manager

| ID | Requirement | Priority |
|----|-------------|----------|
| **FRM-01** | SHALL search for an element across all iframes (recursive to configurable `maxDepth`, default 5). | Must |
| **FRM-02** | SHALL automatically switch the browser into the frame containing the found element. | Must |
| **FRM-03** | SHALL provide `getAllFrames()` to enumerate all iframes across all nesting levels. | Should |
| **FRM-04** | SHALL provide `switchToFrame`, `switchToDefaultContent`, `switchToParentFrame`, `switchToFramePath`. | Must |
| **FRM-05** | SHALL provide `withinFrame(ref, callback)` and `withinFramePath(path, callback)` that auto-restore the default context after execution. | Must |
| **FRM-06** | SHALL maintain a frame path breadcrumb (`getCurrentFramePath()`). | Should |
| **FRM-07** | `maxDepth` SHALL be configurable at construction (not hardcoded). | Must |

---

### 8.7 Web Capability Factories

| ID | Requirement | Priority |
|----|-------------|----------|
| **CAP-01** | SHALL provide factory functions for Chrome, Firefox, and Edge. | Must |
| **CAP-02** | Each factory SHALL accept `headless`, `args`, `downloadDir`, and browser-specific options. | Must |
| **CAP-03** | `headless` SHALL be overridable via `HEADLESS` env var. | Must |
| **CAP-04** | Window dimensions SHALL be overridable via `WINDOW_WIDTH` / `WINDOW_HEIGHT` env vars. | Should |
| **CAP-05** | Download directory paths SHALL use platform-safe path joining (not string concatenation). | Must |
| **CAP-06** | SHALL provide a `resolveWebCapabilities(browserName, options)` dispatcher that resolves by name string. | Must |

---

### 8.8 Web Configuration Template

| ID | Requirement | Priority |
|----|-------------|----------|
| **WCF-01** | SHALL export a ready-to-use test runner configuration object. | Must |
| **WCF-02** | SHALL integrate the Lifecycle Hook Factory for standard logging, reporting, and cleanup hooks. | Must |
| **WCF-03** | SHALL support Selenium Grid configuration via: `SELENIUM_HUB_HOST`, `SELENIUM_HUB_PORT`, `SELENIUM_HUB_PATH`. | Should |
| **WCF-04** | `maxInstances`, `logLevel`, `baseUrl`, `waitforTimeout`, `tagExpression`, retry counts SHALL be env-configurable. | Must |
| **WCF-05** | Reporters SHALL include at least `spec` and `allure`. | Must |
| **WCF-06** | The BDD framework SHALL be Cucumber with configurable `timeout`, `retry`, and `tagExpression`. | Must |
| **WCF-07** | SHALL provide a `services` array placeholder for extensibility. | Should |

---

## 9. Mobile Module Requirements

### 9.1 Mobile Base Page Object

| ID | Requirement | Priority |
|----|-------------|----------|
| **MBP-01** | SHALL extend the Core Abstract Base Page. | Must |
| **MBP-02** | SHALL provide platform detection: `getPlatform()` → `'ios'`/`'android'`/`'web'`, `isIOS()`, `isAndroid()`, `isMobile()`. Results SHALL be cached after first resolution. | Must |
| **MBP-03** | SHALL provide cross-platform selectors: `byAccessibilityId(id)`, `byPlatform({ ios, android })`. | Must |
| **MBP-04** | SHALL provide native selectors: `byAndroidUiAutomator`, `byIosPredicateString`, `byIosClassChain`. | Must |
| **MBP-05** | SHALL provide context management: `getContexts`, `getCurrentContext`, `switchToNativeContext`, `switchToWebViewContext(timeout)`, `switchToContext(name)`, `withinContext(name, callback)`. | Must |
| **MBP-06** | `withinContext` SHALL guard against `getCurrentContext()` failure and conditionally restore. | Must |
| **MBP-07** | SHALL provide touch gestures: `tap`, `doubleTap`, `longPress(element, duration)`. | Must |
| **MBP-08** | SHALL provide swipe gestures: `swipe(from, to)`, `swipeUp`, `swipeDown`, `swipeLeft`, `swipeRight`, `swipeElement(element, direction, percentage)`. | Must |
| **MBP-09** | SHALL provide `scrollToElement(selector, direction, maxScrolls)` with a max-scroll safety limit. | Must |
| **MBP-10** | SHALL provide multi-touch gestures: `pinch`, `zoom`. | Should |
| **MBP-11** | SHALL provide `touchDragAndDrop(source, target)`. | Should |
| **MBP-12** | SHALL provide orientation management: `getOrientation`, `setOrientation`, `rotateLandscape`, `rotatePortrait`. | Should |
| **MBP-13** | SHALL provide app lifecycle: `backgroundApp`, `resetApp`, `closeApp`, `launchApp`, `installApp`, `removeApp`, `isAppInstalled`, `activateApp`, `terminateApp`, `getAppState`. | Must |
| **MBP-14** | SHALL provide keyboard management: `isKeyboardShown`, `hideKeyboard`, `waitForKeyboard`. | Must |
| **MBP-15** | SHALL provide device utilities: `getScreenSize`, `lockDevice`, `unlockDevice`, `isDeviceLocked`. | Should |
| **MBP-16** | SHALL provide hardware key support: `pressHardwareKey(keyCode)`, `pressBack`, `pressHome`. | Must |
| **MBP-17** | SHALL provide deep linking: `openDeepLink(url)`. | Should |
| **MBP-18** | SHALL provide device settings: `setGeoLocation`, `getGeoLocation`, `toggleAirplaneMode`, `toggleWifi`, `toggleData`. | Should |
| **MBP-19** | SHALL provide Android-specific activity management: `getCurrentActivity`, `getCurrentPackage`, `startActivity`, `waitForActivity`. | Should |
| **MBP-20** | SHALL provide alert handling: `waitForAlert`, `acceptAlert`, `dismissAlert` (error-swallowing variants). | Should |
| **MBP-21** | Screenshots SHALL include a platform prefix (e.g. `android_` or `ios_`). | Should |

---

### 9.2 Mobile Capability Factories

| ID | Requirement | Priority |
|----|-------------|----------|
| **MCF-01** | SHALL provide factory functions for: Android (UiAutomator2), Android Chrome, iOS (XCUITest), iOS Safari. | Must |
| **MCF-02** | Each factory SHALL be configurable via env vars: `ANDROID_DEVICE`, `ANDROID_VERSION`, `ANDROID_APP`, `IOS_DEVICE`, `IOS_VERSION`, `IOS_APP`, etc. | Must |
| **MCF-03** | SHALL provide a `resolveMobileCapabilities(platformName, options)` dispatcher. | Must |
| **MCF-04** | Android capabilities SHALL default: `autoGrantPermissions: true`, `newCommandTimeout` ≥ 300. | Should |
| **MCF-05** | iOS capabilities SHALL default: `autoAcceptAlerts: true`, `wdaStartupRetries` ≥ 3. | Should |

---

### 9.3 Mobile Configuration Template

| ID | Requirement | Priority |
|----|-------------|----------|
| **MCG-01** | SHALL export a ready-to-use mobile test runner configuration. | Must |
| **MCG-02** | Appium host/port SHALL be configurable via `APPIUM_HOST`, `APPIUM_PORT`. | Must |
| **MCG-03** | `relaxedSecurity` SHALL be gated behind an env var (NOT enabled by default). | Must |
| **MCG-04** | Mobile timeouts SHALL be higher by default than web (e.g. `waitforTimeout: 30000`, `connectionRetryTimeout: 180000`). | Should |
| **MCG-05** | SHALL integrate the same Lifecycle Hook Factory as the web config. | Must |

---

## 10. Lifecycle Hook Factory

| ID | Requirement | Priority |
|----|-------------|----------|
| **HKF-01** | SHALL be a factory function accepting options and returning a complete hook configuration object. | Must |
| **HKF-02** | SHALL wire **per-worker logging** in the `before` hook. | Must |
| **HKF-03** | SHALL wire **per-scenario logging** in `beforeScenario` / `afterScenario`. | Must |
| **HKF-04** | SHALL auto-capture a screenshot on scenario failure (configurable `screenshotOnFailure` flag). | Must |
| **HKF-05** | SHALL clean browser state (storage + cookies) between scenarios (configurable `cleanBrowserState` flag). | Must |
| **HKF-06** | SHALL write Allure environment/category metadata in `onPrepare`. | Must |
| **HKF-07** | SHALL generate the Cucumber HTML report in `onComplete`. | Must |
| **HKF-08** | SHALL run report backup (if enabled) in `onComplete`. | Must |
| **HKF-09** | SHALL provide `beforeStep` / `afterStep` as no-op hooks for consumer extension. | Should |
| **HKF-10** | SHALL guard against missing scenario metadata (`world.pickle`) gracefully. | Should |
| **HKF-11** | SHALL flush all logs in the `after` hook before the worker process exits. | Must |

---

## 11. BDD / Gherkin Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| **BDD-01** | Tests SHALL be authored in Gherkin syntax (`Feature` / `Scenario` / `Given` / `When` / `Then`). | Must |
| **BDD-02** | Step definitions SHALL be separate from page objects (clean separation of concerns). | Must |
| **BDD-03** | SHALL support `Scenario Outline` with `Examples` tables for data-driven testing. | Must |
| **BDD-04** | SHALL support `@tag`-based filtering via `TAG_EXPRESSION` env var or CLI argument. | Must |
| **BDD-05** | SHALL support step-level retry and spec-file-level retry (both configurable). | Should |
| **BDD-06** | Scenario timeout SHALL be configurable (default ≥ 120 s for web, ≥ 180 s for mobile). | Must |

---

## 12. Environment & Configuration Management

| ID | Requirement | Priority |
|----|-------------|----------|
| **CFG-01** | All user-facing settings SHALL be overridable via environment variables (listed in Appendix A). | Must |
| **CFG-02** | A `.env.example` file SHALL document every recognized variable with sane defaults. | Must |
| **CFG-03** | The framework SHALL load `.env` files via a dotenv-compatible mechanism at startup. | Should |
| **CFG-04** | A deep-merge utility SHALL be available for merging base config with overrides (arrays replaced, not concatenated). | Should |
| **CFG-05** | Environment-specific config files (dev, staging, prod, docker, mobile) SHALL extend the base config. | Must |

---

## 13. CI/CD & Containerisation

| ID | Requirement | Priority |
|----|-------------|----------|
| **CI-01** | SHALL provide a GitHub Actions (or equivalent) pipeline template for: install, lint, test, report. | Should |
| **CI-02** | SHALL provide a Docker Compose setup with Selenium Grid (hub + Chrome/Firefox/Edge nodes). | Should |
| **CI-03** | Docker configuration SHALL be driven entirely by environment variables. | Must (if Docker supported) |
| **CI-04** | SHALL provide npm scripts (or equivalent) for: `test`, `test:<env>`, `test:<browser>`, `test:headless`, `test:parallel`, `test:mobile`, `test:smoke`, `test:regression`, `report:generate`, `report:allure`, `clean`, `lint`, `format`, `docker:build`, `docker:run`. | Should |
| **CI-05** | SHALL provide a health-check script that validates connectivity to the application and Selenium Grid. | Should |

---

## 14. Documentation Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| **DOC-01** | The framework SHALL support **automatic API documentation generation** from source code annotations (e.g. JSDoc for JavaScript, Javadoc for Java, docstrings for Python). | Must |
| **DOC-02** | All public classes, methods, parameters, and return types SHALL have structured documentation comments in the source code. | Must |
| **DOC-03** | A documentation generation configuration file (e.g. `jsdoc.config.json`, `pom.xml javadoc plugin`, `sphinx conf.py`) SHALL be provided in the repository. | Must |
| **DOC-04** | The generated documentation SHALL be output to a `docs/api` directory. | Must |
| **DOC-05** | An npm script (or equivalent build command) SHALL be provided: `npm run docs:generate` (or `mvn javadoc:javadoc`, `make docs`, etc.). | Must |
| **DOC-06** | The root README SHALL include a **"Generating API Documentation"** section explaining prerequisites and the generation command. | Must |
| **DOC-07** | The documentation generation tool SHALL be listed as a development dependency. | Must |
| **DOC-08** | Generated documentation SHALL cover all three packages (Core, Web UI, Mobile). | Must |
| **DOC-09** | The generated output SHALL include: class hierarchy, method signatures, parameter descriptions, return types, usage examples (if provided in source), and cross-references. | Should |
| **DOC-10** | The generated documentation directory SHALL be excluded from version control (`.gitignore`). | Should |

---

## 15. Cross-Cutting Concerns

| ID | Requirement | Priority |
|----|-------------|----------|
| **XCT-01** | All file paths SHALL use platform-safe path joining. String concatenation for paths is NOT acceptable. | Must |
| **XCT-02** | Shell / system commands SHALL use argument-array invocation (not string interpolation) to prevent injection. | Must |
| **XCT-03** | HTML output (backup index, reports) SHALL escape user-supplied strings to prevent XSS. | Must |
| **XCT-04** | PowerShell / shell command strings SHALL escape special characters (single quotes, etc.) in paths. | Should |
| **XCT-05** | All singleton classes SHALL provide a `reset()` or `resetInstance()` method for test isolation. | Should |
| **XCT-06** | Error messages SHALL include contextual information (file paths, selector strings, operation names). | Should |
| **XCT-07** | The framework SHALL run correctly on Windows, macOS, and Linux without modification. | Must |
| **XCT-08** | Resource cleanup SHALL be handled gracefully — partial downloads, temp files, and log transports SHALL be cleaned up on error. | Should |

---

## 16. Non-Functional Requirements

| ID | Requirement | Category | Priority |
|----|-------------|----------|----------|
| **NFR-01** | Framework startup overhead SHALL NOT exceed 5 seconds on a standard CI runner. | Performance | Should |
| **NFR-02** | Lazy-loading SHALL be used for heavy optional dependencies (xlsx, form-data, archiver, etc.). | Performance | Should |
| **NFR-03** | Element resolution fallback chain SHALL complete within one timeout period (not cumulative). | Performance | Must |
| **NFR-04** | The codebase SHALL pass a linter (ESLint, Checkstyle, Pylint, etc.) with zero errors. | Quality | Should |
| **NFR-05** | The codebase SHALL follow a consistent formatting standard (Prettier, Google Java Format, Black, etc.). | Quality | Should |
| **NFR-06** | Sensitive data (passwords, tokens) SHALL never appear in logs at `info` level or below. Only `debug` level may include masked values. | Security | Must |
| **NFR-07** | The framework SHALL support at least **10 parallel worker instances** without resource contention in logging or file I/O. | Scalability | Must |
| **NFR-08** | The framework SHALL be usable without an internet connection (apart from initial dependency installation). | Availability | Should |
| **NFR-09** | All third-party dependencies SHALL use semver-compatible version ranges. | Maintainability | Must |

---

## 17. Cloud Testing Platform Integration

The framework SHALL provide first-class support for executing tests on cloud testing platforms without requiring changes to test code (page objects, step definitions). Only configuration and capabilities change.

### 17.1 General Cloud Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **CLD-01** | SHALL support at least four cloud platforms: **BrowserStack**, **Sauce Labs**, **LambdaTest**, **Perfecto**. Adding new providers SHALL require only a new capability file, not changes to existing code. | Must |
| **CLD-02** | Cloud provider selection SHALL be driven by a single env var (`CLOUD_PROVIDER`). | Must |
| **CLD-03** | Cloud credentials (username, access key / security token) SHALL be resolved from env vars. Credentials SHALL **never** appear in committed configuration files. | Must |
| **CLD-04** | SHALL provide a `resolveCloudCapabilities(options)` dispatcher that returns the correct capability object for the configured provider. | Must |
| **CLD-05** | SHALL provide a `getCloudConnection(provider)` function returning `{ protocol, hostname, port, path }` for the provider's remote WebDriver hub. | Must |
| **CLD-06** | Each provider SHALL support **desktop browser**, **mobile browser**, and **mobile app** capability modes. | Must |
| **CLD-07** | Cloud configuration SHALL integrate with the Configuration Resolution Engine (§18) — all cloud-specific keys SHALL follow the three-tier precedence model. | Must |
| **CLD-08** | A dedicated cloud wdio config file (or equivalent runner override) SHALL be provided that wires connection settings and capabilities from the provider. | Should |
| **CLD-09** | Local services (e.g. chromedriver, geckodriver) SHALL be automatically disabled when running on a cloud provider. | Must |

### 17.2 BrowserStack

| ID | Requirement | Priority |
|----|-------------|----------|
| **BS-01** | Credentials SHALL be read from `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY`. | Must |
| **BS-02** | SHALL support `bstack:options` including: project, build, session name, local tunnel, debug, video, network logs, console logs, OS, OS version, resolution. | Must |
| **BS-03** | SHALL support BrowserStack Local tunnel via `BROWSERSTACK_LOCAL` and `BROWSERSTACK_LOCAL_ID`. | Should |
| **BS-04** | SHALL support real-device mobile testing via `BROWSERSTACK_DEVICE` and `BROWSERSTACK_REAL_MOBILE`. | Must |
| **BS-05** | SHALL support mobile app testing via `BROWSERSTACK_APP_URL` (bs://hash). | Must |

### 17.3 Sauce Labs

| ID | Requirement | Priority |
|----|-------------|----------|
| **SL-01** | Credentials SHALL be read from `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY`. | Must |
| **SL-02** | SHALL support multi-region data centres: `us-west-1`, `eu-central-1`, `apac-southeast-1` via `SAUCE_REGION`. | Must |
| **SL-03** | SHALL support `sauce:options` including: build, tunnel, extended debugging, performance capture, idle timeout, max duration, video, screenshots, logs. | Must |
| **SL-04** | SHALL support Sauce Connect tunnel via `SAUCE_TUNNEL_NAME` and `SAUCE_TUNNEL_OWNER`. | Should |
| **SL-05** | SHALL support mobile emulator/simulator and real-device testing. | Must |
| **SL-06** | SHALL support mobile app testing via `SAUCE_APP_URL` (storage:filename or direct URL). | Must |

### 17.4 LambdaTest

| ID | Requirement | Priority |
|----|-------------|----------|
| **LT-01** | Credentials SHALL be read from `LAMBDATEST_USERNAME` and `LAMBDATEST_ACCESS_KEY`. | Must |
| **LT-02** | SHALL support `LT:Options` including: build, project, tunnel, video, console logs, network logs, visual testing, resolution, Selenium version. | Must |
| **LT-03** | SHALL support Lambda Tunnel via `LAMBDATEST_TUNNEL` and `LAMBDATEST_TUNNEL_NAME`. | Should |
| **LT-04** | SHALL support mobile real-device and emulator testing. | Must |
| **LT-05** | SHALL support mobile app testing via `LAMBDATEST_APP_URL` (lt://hash). | Must |

### 17.5 Perfecto

| ID | Requirement | Priority |
|----|-------------|----------|
| **PF-01** | Credentials SHALL be read from `PERFECTO_CLOUD_NAME` and `PERFECTO_SECURITY_TOKEN`. | Must |
| **PF-02** | SHALL support `perfecto:options` including: project, job name/number, tags, report model. | Must |
| **PF-03** | SHALL support device selection by name, manufacturer, model, platform version, and lab location. | Must |
| **PF-04** | SHALL support desktop web, mobile web (real device), and native app testing. | Must |
| **PF-05** | SHALL support auto-instrumentation and sensor instrumentation flags. | Should |

---

## 18. Configuration Resolution Engine

The framework SHALL provide a centralised configuration resolution engine that eliminates scattered `process.env` / `os.environ` / `System.getProperty` reads throughout the codebase.

| ID | Requirement | Priority |
|----|-------------|----------|
| **CRE-01** | SHALL implement a **three-tier precedence** model: `environment variable > environment-specific config file > default config file`. | Must |
| **CRE-02** | SHALL provide a static default configuration file (`defaults.config.json` or equivalent) containing sane defaults for **all** recognized config keys. | Must |
| **CRE-03** | SHALL provide environment-specific config files (e.g. `dev.config.json`, `staging.config.json`, `prod.config.json`, `docker.config.json`). | Must |
| **CRE-04** | The active environment SHALL be determined by the `TEST_ENV` env var. The engine SHALL auto-load the corresponding environment config file. | Must |
| **CRE-05** | SHALL provide typed accessor methods: `get(key, fallback)` → string, `getInt(key, fallback)` → integer, `getBool(key, fallback)` → boolean. | Must |
| **CRE-06** | SHALL provide convenience getters for the most commonly used keys: `baseUrl`, `apiBaseUrl`, `browser`, `headless`, `maxInstances`, `logLevel`, `retryCount`, etc. | Should |
| **CRE-07** | SHALL provide `init(env)` for explicit initialisation and `reset()` for test isolation. | Must |
| **CRE-08** | SHALL provide `getEnv()` returning the resolved environment name. | Must |
| **CRE-09** | SHALL provide `summary()` returning a human-readable summary of resolved config (with sensitive values masked). | Should |
| **CRE-10** | SHALL provide `getAll()` returning the fully merged config object. | Should |
| **CRE-11** | Auto-detection of browser/driver version SHALL be supported (e.g. reading `DRIVER_VERSION=auto` triggers OS-level version detection). | Should |
| **CRE-12** | Config files SHALL be JSON (or YAML) — requiring no code compilation to modify. | Must |
| **CRE-13** | All framework modules SHALL use the Configuration Resolution Engine instead of direct env var reads. | Must |
| **CRE-14** | The engine SHALL be a singleton to avoid redundant file I/O. | Must |

---

## 19. API Testing (Standalone)

While the HTTP client helper (§6.1) provides the requesting mechanism, the framework SHALL also support **standalone API test scenarios** where no browser session is needed. This section defines requirements for API-only test execution.

| ID | Requirement | Priority |
|----|-------------|----------|
| **APT-01** | The framework SHALL support running API-only test suites that do NOT launch a browser session. | Must |
| **APT-02** | API tests SHALL be authorable in BDD/Gherkin syntax alongside UI tests (`Given I send a GET request to "/users"`). | Must |
| **APT-03** | SHALL provide predefined step definitions (or step definition templates) for common API operations: send request, validate status, validate response body, validate headers, validate JSON schema, validate response time. | Should |
| **APT-04** | SHALL support request chaining: extract values from one response (JSONPath or header) and inject into subsequent requests. | Must |
| **APT-05** | SHALL support **JSON Schema validation** against response payloads. | Should |
| **APT-06** | SHALL support **contract testing** — comparing API responses against stored baseline contracts. | Should |
| **APT-07** | SHALL support **authentication flows**: OAuth2 token retrieval, basic auth, bearer token, API key, cookie-based auth. | Must |
| **APT-08** | API response assertions SHALL include: status code, status text, header values, JSON body paths, array length, response time thresholds. | Must |
| **APT-09** | SHALL support environment-specific API base URLs resolved via the Configuration Resolution Engine. | Must |
| **APT-10** | SHALL support multipart/form-data uploads and binary response handling. | Should |
| **APT-11** | SHALL support GraphQL queries, mutations, and subscriptions with variable injection. | Should |
| **APT-12** | SHALL support SOAP/XML web services — send XML payloads, parse XML responses, XPath assertions. | Should |
| **APT-13** | API test reports SHALL include request/response details (method, URL, headers, body, status, duration). | Should |
| **APT-14** | SHALL support parallel execution of API test suites independently from UI tests. | Should |

---

## 20. Database Testing Support

The framework SHALL provide database connectivity helpers for test data setup, teardown, and assertion against database state.

| ID | Requirement | Priority |
|----|-------------|----------|
| **DB-01** | SHALL provide a database client supporting at least: MySQL/MariaDB, PostgreSQL, SQL Server, SQLite, Oracle. Implementation MAY use a common library for all providers. | Must |
| **DB-02** | Database connections SHALL be configured via env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_TYPE`. | Must |
| **DB-03** | SHALL provide `query(sql, params)` with parameterized query support to prevent SQL injection. | Must |
| **DB-04** | SHALL provide convenience methods: `findOne(table, where)`, `findAll(table, where)`, `insert(table, data)`, `update(table, data, where)`, `delete(table, where)`, `count(table, where)`. | Should |
| **DB-05** | SHALL provide `executeScript(filePath)` to run SQL scripts from file. | Should |
| **DB-06** | SHALL support connection pooling with configurable pool size. | Should |
| **DB-07** | SHALL provide `truncateTable(table)` and `seedTable(table, dataArray)` for test setup/teardown. | Should |
| **DB-08** | Database credentials SHALL be encrypted or resolved via the Encryption Helper when stored in config files. | Should |
| **DB-09** | SHALL support multiple simultaneous database connections (e.g. source DB vs. target DB comparisons). | Should |
| **DB-10** | SHALL provide `assertRowExists(table, where)`, `assertRowCount(table, where, expected)`, `assertColumnValue(table, where, column, expected)`. | Should |
| **DB-11** | Connection lifecycle (open, close, pool drain) SHALL be managed automatically in lifecycle hooks. | Should |
| **DB-12** | Database operations SHALL support transactions: `beginTransaction()`, `commit()`, `rollback()`. | Should |

---

## 21. Visual Regression Testing

The framework SHALL support visual regression testing to detect unintended UI changes by comparing screenshots against approved baselines.

| ID | Requirement | Priority |
|----|-------------|----------|
| **VIS-01** | SHALL provide a `compareScreenshot(name, options)` method that captures a screenshot and compares it against a stored baseline. | Must |
| **VIS-02** | SHALL provide element-level visual comparison: `compareElement(selector, name, options)`. | Should |
| **VIS-03** | SHALL support configurable comparison thresholds: `mismatchTolerance` (percentage) and `mismatchPixelTolerance` (absolute pixels). | Must |
| **VIS-04** | First-run screenshots SHALL be saved as baselines (no comparison performed). | Must |
| **VIS-05** | SHALL generate visual diff images highlighting changed regions. | Should |
| **VIS-06** | Baseline images SHALL be stored in a configurable directory (default: `test/visual-baselines/`). | Must |
| **VIS-07** | SHALL support masking/ignoring dynamic regions (e.g. timestamps, ads, animations) via exclusion rectangles or CSS selectors. | Should |
| **VIS-08** | SHALL support platform/browser-specific baselines (same test, different baseline per browser). | Should |
| **VIS-09** | Comparison results SHALL be included in Allure/Cucumber reports (baseline, actual, diff images). | Should |
| **VIS-10** | SHALL provide a CLI or config command to update baselines in bulk after intentional UI changes. | Should |

---

## 22. Accessibility Testing

The framework SHALL provide accessibility (a11y) testing capabilities to verify WCAG compliance during end-to-end test execution.

| ID | Requirement | Priority |
|----|-------------|----------|
| **A11Y-01** | SHALL integrate an accessibility scanning engine (e.g. axe-core, Pa11y, Accessibility Insights) that can be invoked during any test. | Must |
| **A11Y-02** | SHALL provide `runAccessibilityScan(options)` returning a list of violations with: rule ID, description, impact level, help URL, affected elements. | Must |
| **A11Y-03** | SHALL support scan scope: full page, specific element, or specific region. | Must |
| **A11Y-04** | SHALL support filtering violations by: WCAG level (A, AA, AAA), impact (critical, serious, moderate, minor), specific rule IDs to include/exclude. | Must |
| **A11Y-05** | SHALL provide `assertNoA11yViolations(options)` that fails the test if violations matching the filter criteria are found. | Must |
| **A11Y-06** | A11y results SHALL be attachable to test reports (Allure, Cucumber) as structured data. | Should |
| **A11Y-07** | SHALL support a baseline/known-issues file to suppress known violations without failing the test. | Should |
| **A11Y-08** | SHALL provide summary statistics: total violations, by impact level, by WCAG level. | Should |
| **A11Y-09** | Scans SHALL be configurable per environment (e.g. strict in CI, advisory in dev). | Should |

---

## 23. Notification & Alerting

The framework SHALL support sending test execution notifications to collaboration and alerting tools.

| ID | Requirement | Priority |
|----|-------------|----------|
| **NTF-01** | SHALL support Slack notifications with configurable webhook URL via `SLACK_WEBHOOK_URL` env var. | Should |
| **NTF-02** | SHALL support email notifications with configurable recipients via `EMAIL_RECIPIENTS` env var. | Should |
| **NTF-03** | Notifications SHALL be sent in the `onComplete` lifecycle hook (or equivalent post-run phase). | Must |
| **NTF-04** | Notification payload SHALL include: total tests, passed, failed, skipped, duration, environment, browser, report link. | Must |
| **NTF-05** | Notifications SHALL be toggleable — disabled by default to avoid noise in development. | Must |
| **NTF-06** | SHALL support conditional notification rules: e.g. "notify only on failure", "notify only in CI", "notify always". | Should |
| **NTF-07** | Slack messages SHALL use rich formatting (blocks/attachments) with colour-coded status indicators. | Should |
| **NTF-08** | SHALL support Microsoft Teams notifications via incoming webhook. | Should |
| **NTF-09** | Notification failures SHALL be caught and logged — they SHALL NOT cause the test run to fail. | Must |

---

## 24. Test Data Management

Beyond the Data Generator (§6.2) and Data-Driven Manager (§6.8), the framework SHALL provide broader test data management capabilities for enterprise scenarios.

| ID | Requirement | Priority |
|----|-------------|----------|
| **TDM-01** | SHALL support **fixture files** — reusable JSON/YAML data files organized per feature/module that are loaded automatically based on test context. | Must |
| **TDM-02** | SHALL support **data factories** — programmatic builders that compose complex test entities from simple generators (e.g. `UserFactory.withAddress().withCreditCard().build()`). | Should |
| **TDM-03** | SHALL support **locale-aware** test data generation (e.g. Japanese names, German addresses, US phone numbers). | Must |
| **TDM-04** | SHALL support **deterministic data** via seeding — the same seed value SHALL produce identical data across runs for reproducibility. | Must |
| **TDM-05** | SHALL support **data cleanup** — framework SHALL track created test data (IDs, names) and provide a cleanup mechanism to delete them after test completion. | Should |
| **TDM-06** | SHALL support **environment-specific test data** — different fixture files or factory configurations per environment. | Should |
| **TDM-07** | SHALL support **data masking** — PII fields in logs and reports SHALL be automatically masked. | Should |
| **TDM-08** | SHALL support **data snapshot/restore** — save database state before tests and restore after completion (useful for stateful integration tests). | Should |
| **TDM-09** | Test data generation SHALL be **thread-safe** — parallel workers SHALL not produce colliding unique identifiers. | Must |
| **TDM-10** | SHALL provide atomic generators for: names, emails, phones, addresses, companies, credit cards, products, UUIDs, timestamps, boolean, numeric, lorem text, URLs, IPs, colours. | Must |
| **TDM-11** | SHALL provide template-based generation: `fromTemplate('###-???-***')` where `#`=digit, `?`=letter, `*`=alphanumeric. | Should |
| **TDM-12** | SHALL provide `generateTestId(prefix)` producing a unique timestamped identifier for test traceability. | Should |

---

## Appendix A — Environment Variables

| Variable | Package | Default | Description |
|----------|---------|---------|-------------|
| `BASE_URL` | Web | `https://example.com` | Application base URL |
| `API_BASE_URL` | Core | — | API base URL |
| `TEST_ENV` | Core | `dev` | Active environment (`dev` / `staging` / `prod`) |
| `BROWSER` | Web | `chrome` | Browser name |
| `HEADLESS` | Web | `false` | Run headless |
| `WINDOW_WIDTH` | Web | `1920` | Browser window width |
| `WINDOW_HEIGHT` | Web | `1080` | Browser window height |
| `MAX_INSTANCES` | All | `5` | Parallel workers |
| `LOG_LEVEL` | Core | `info` | Log verbosity |
| `LOG_DIR` | Core | `logs` | Log output directory |
| `CONSOLE_LOG_LEVEL` | Core | `LOG_LEVEL` | Console-only log level |
| `RETRY_COUNT` | All | `1` | Cucumber step retry |
| `SPEC_FILE_RETRIES` | All | `0` | Full spec retry |
| `TIMEOUT_IMPLICIT` | Core | `15000` | Element wait (ms) |
| `TIMEOUT_PAGE_LOAD` | Core | `30000` | Page load (ms) |
| `TIMEOUT_SCRIPT` | Core | `30000` | Script execution (ms) |
| `ENCRYPTION_KEY` | Core | — | Passphrase for encrypt/decrypt |
| `REPORT_FORMAT` | Core | `spec` | Reporter format |
| `REPORT_BACKUP_ENABLE` | Core | `false` | Enable report backup |
| `REPORT_BACKUP_PATH` | Core | — | Backup destination |
| `REPORT_BACKUP_KEEP` | Core | `30` | Backups to retain |
| `REPORT_BACKUP_COMPRESS` | Core | `false` | ZIP compression |
| `PROJECT_NAME` | Core | `wdio-tests` | Project name for backups |
| `SELENIUM_HUB_HOST` | Web | — | Grid host |
| `SELENIUM_HUB_PORT` | Web | — | Grid port |
| `SELENIUM_HUB_PATH` | Web | — | Grid path |
| `TAG_EXPRESSION` | All | — | Cucumber tag filter |
| `EXECUTION_MATRIX` | Core | — | Path to execution matrix |
| `DRIVER_HOST_URL` | Core | — | Custom driver artifact server |
| `DRIVER_VERSION` | Core | — | Driver version |
| `DRIVER_NAME` | Core | `edgedriver` | Archive prefix |
| `DRIVER_BINARY_NAME` | Core | `msedgedriver` | Binary name in archive |
| `DRIVER_CACHE_DIR` | Core | `.cache` | Driver cache directory |
| `DRIVER_FORCE_DOWNLOAD` | Core | `false` | Force re-download |
| `APPIUM_HOST` | Mobile | `127.0.0.1` | Appium server host |
| `APPIUM_PORT` | Mobile | `4723` | Appium server port |
| `APPIUM_RELAXED_SECURITY` | Mobile | `false` | Appium relaxed security |
| `MOBILE_PLATFORM` | Mobile | `android` | Mobile platform |
| `ANDROID_DEVICE` | Mobile | — | Android device name |
| `ANDROID_VERSION` | Mobile | — | Android OS version |
| `ANDROID_APP` | Mobile | — | APK path |
| `ANDROID_APP_PACKAGE` | Mobile | — | App package |
| `ANDROID_APP_ACTIVITY` | Mobile | — | App activity |
| `IOS_DEVICE` | Mobile | — | iOS device name |
| `IOS_VERSION` | Mobile | — | iOS version |
| `IOS_APP` | Mobile | — | IPA/app path |
| `IOS_BUNDLE_ID` | Mobile | — | iOS bundle ID |
| `DB_HOST` | Core | — | Database host |
| `DB_PORT` | Core | — | Database port |
| `DB_NAME` | Core | — | Database name |
| `DB_USER` | Core | — | Database user |
| `DB_PASSWORD` | Core | — | Database password |
| `API_KEY` | Core | — | API key |
| `AUTH_TOKEN` | Core | — | Auth token |
| `SLACK_WEBHOOK_URL` | Core | — | Slack notification URL |
| `EMAIL_RECIPIENTS` | Core | — | Email notification list |
| `CLOUD_PROVIDER` | Cloud | — | Cloud platform: `browserstack` / `saucelabs` / `lambdatest` / `perfecto` |
| `BROWSERSTACK_USERNAME` | Cloud | — | BrowserStack account username |
| `BROWSERSTACK_ACCESS_KEY` | Cloud | — | BrowserStack access key |
| `BROWSERSTACK_PROJECT` | Cloud | `PROJECT_NAME` | BrowserStack project name |
| `BROWSERSTACK_BUILD` | Cloud | auto-generated | BrowserStack build name |
| `BROWSERSTACK_LOCAL` | Cloud | `false` | Enable BrowserStack Local tunnel |
| `BROWSERSTACK_LOCAL_ID` | Cloud | — | Local tunnel identifier |
| `BROWSERSTACK_DEBUG` | Cloud | `false` | Enable visual logs |
| `BROWSERSTACK_NETWORK_LOGS` | Cloud | `false` | Capture network logs |
| `BROWSERSTACK_CONSOLE_LOGS` | Cloud | `errors` | Console log level |
| `BROWSERSTACK_VIDEO` | Cloud | `true` | Record video |
| `BROWSERSTACK_OS` | Cloud | — | Target OS name |
| `BROWSERSTACK_OS_VERSION` | Cloud | — | Target OS version |
| `BROWSERSTACK_RESOLUTION` | Cloud | — | Screen resolution |
| `BROWSERSTACK_DEVICE` | Cloud | — | Mobile device name |
| `BROWSERSTACK_REAL_MOBILE` | Cloud | `true` | Use real mobile device |
| `BROWSERSTACK_APP_URL` | Cloud | — | App URL (bs://hash) |
| `BROWSERSTACK_APPIUM_VERSION` | Cloud | — | Appium version |
| `SAUCE_USERNAME` | Cloud | — | Sauce Labs account username |
| `SAUCE_ACCESS_KEY` | Cloud | — | Sauce Labs access key |
| `SAUCE_REGION` | Cloud | `us-west-1` | Data centre region |
| `SAUCE_BUILD` | Cloud | auto-generated | Build name |
| `SAUCE_TUNNEL_NAME` | Cloud | — | Sauce Connect tunnel name |
| `SAUCE_TUNNEL_OWNER` | Cloud | — | Tunnel owner |
| `SAUCE_SCREEN_RESOLUTION` | Cloud | — | Screen resolution |
| `SAUCE_EXTENDED_DEBUGGING` | Cloud | `false` | Extended debugging |
| `SAUCE_CAPTURE_PERFORMANCE` | Cloud | `false` | Performance metrics |
| `SAUCE_IDLE_TIMEOUT` | Cloud | `90` | Idle timeout (seconds) |
| `SAUCE_MAX_DURATION` | Cloud | `1800` | Max test duration (seconds) |
| `SAUCE_RECORD_VIDEO` | Cloud | `true` | Record video |
| `SAUCE_RECORD_SCREENSHOTS` | Cloud | `true` | Record screenshots |
| `SAUCE_RECORD_LOGS` | Cloud | `true` | Record logs |
| `SAUCE_DEVICE` | Cloud | — | Mobile device name |
| `SAUCE_PLATFORM_VERSION` | Cloud | — | Mobile platform version |
| `SAUCE_APP_URL` | Cloud | — | App URL (storage:filename) |
| `SAUCE_APPIUM_VERSION` | Cloud | — | Appium version |
| `LAMBDATEST_USERNAME` | Cloud | — | LambdaTest account username |
| `LAMBDATEST_ACCESS_KEY` | Cloud | — | LambdaTest access key |
| `LAMBDATEST_BUILD` | Cloud | auto-generated | Build name |
| `LAMBDATEST_PROJECT` | Cloud | `PROJECT_NAME` | Project name |
| `LAMBDATEST_TUNNEL` | Cloud | `false` | Enable Lambda Tunnel |
| `LAMBDATEST_TUNNEL_NAME` | Cloud | — | Tunnel name |
| `LAMBDATEST_VIDEO` | Cloud | `true` | Record video |
| `LAMBDATEST_CONSOLE_LOGS` | Cloud | `false` | Capture console logs |
| `LAMBDATEST_NETWORK_LOGS` | Cloud | `false` | Capture network logs |
| `LAMBDATEST_VISUAL` | Cloud | `false` | Visual testing |
| `LAMBDATEST_RESOLUTION` | Cloud | — | Screen resolution |
| `LAMBDATEST_SELENIUM_VERSION` | Cloud | `4.0` | Selenium version |
| `LAMBDATEST_DEVICE` | Cloud | — | Mobile device name |
| `LAMBDATEST_PLATFORM_VERSION` | Cloud | — | Mobile platform version |
| `LAMBDATEST_APP_URL` | Cloud | — | App URL (lt://hash) |
| `LAMBDATEST_APPIUM_VERSION` | Cloud | — | Appium version |
| `PERFECTO_CLOUD_NAME` | Cloud | — | Perfecto cloud name |
| `PERFECTO_SECURITY_TOKEN` | Cloud | — | Perfecto security token |
| `PERFECTO_PROJECT` | Cloud | `PROJECT_NAME` | Project name |
| `PERFECTO_JOB_NAME` | Cloud | — | CI job name |
| `PERFECTO_JOB_NUMBER` | Cloud | — | CI build number |
| `PERFECTO_TAGS` | Cloud | — | Comma-separated test tags |
| `PERFECTO_REPORT_MODEL` | Cloud | `single` | Report model |
| `PERFECTO_DEVICE_NAME` | Cloud | — | Device name |
| `PERFECTO_PLATFORM_NAME` | Cloud | — | Platform name |
| `PERFECTO_PLATFORM_VERSION` | Cloud | — | Platform version |
| `PERFECTO_MANUFACTURER` | Cloud | — | Device manufacturer |
| `PERFECTO_MODEL` | Cloud | — | Device model |
| `PERFECTO_LOCATION` | Cloud | — | Lab location |
| `PERFECTO_RESOLUTION` | Cloud | `1920x1080` | Desktop resolution |
| `PERFECTO_APP_URL` | Cloud | — | App URL or REPOSITORY path |
| `PERFECTO_AUTO_INSTRUMENT` | Cloud | `false` | Auto-instrument for perf |
| `PERFECTO_SENSOR_INSTRUMENT` | Cloud | `false` | Instrument sensors |

---

## Appendix B — Traceability Matrix

This matrix maps each requirement ID to the implementation module in the current JavaScript/WebdriverIO reference implementation.

| Req ID Range | Module | Source File(s) |
|-------------|--------|---------------|
| ARCH-01 – ARCH-10 | Root workspace | `package.json`, `.env.example` |
| PKG-01 – PKG-06 | All packages | `packages/*/package.json`, `packages/*/index.js` |
| BP-01 – BP-25 | Core | `packages/core/src/base/AbstractBasePage.js` |
| LOG-01 – LOG-10 | Core | `packages/core/src/utils/Logger.js` |
| RET-01 – RET-07 | Core | `packages/core/src/utils/RetryHandler.js` |
| SCR-01 – SCR-08 | Core | `packages/core/src/utils/ScreenshotManager.js` |
| PERF-01 – PERF-08 | Core | `packages/core/src/utils/PerformanceTracker.js` |
| BKP-01 – BKP-09 | Core | `packages/core/src/utils/ReportBackupManager.js` |
| DRV-01 – DRV-11 | Core | `packages/core/src/utils/CustomDriverResolver.js` |
| RPT-01 – RPT-04 | Core | `packages/core/src/utils/Reporter.js` |
| API-01 – API-12 | Core | `packages/core/src/helpers/ApiHelper.js` |
| GEN-01 – GEN-09 | Core | `packages/core/src/helpers/DataGenerator.js` |
| FIO-01 – FIO-09 | Core | `packages/core/src/helpers/FileHelper.js` |
| DAT-01 – DAT-08 | Core | `packages/core/src/helpers/DateHelper.js` |
| STR-01 – STR-13 | Core | `packages/core/src/helpers/StringHelper.js` |
| ENC-01 – ENC-07 | Core | `packages/core/src/helpers/EncryptionHelper.js` |
| XLS-01 – XLS-12 | Core | `packages/core/src/helpers/ExcelHelper.js` |
| DDM-01 – DDM-10 | Core | `packages/core/src/helpers/DataDrivenManager.js` |
| FGN-01 – FGN-07 | Core | `packages/core/src/helpers/FeatureGenerator.js` |
| TEF-01 – TEF-05 | Core | `packages/core/src/helpers/TestExecutionFilter.js` |
| TMO-01 – TMO-04 | Core | `packages/core/src/constants/Timeouts.js` |
| ENV-01 – ENV-04 | Core | `packages/core/src/constants/Environments.js` |
| MSG-01 – MSG-03 | Core | `packages/core/src/constants/Messages.js` |
| WBP-01 – WBP-10 | UI | `packages/ui/src/BasePage.js` |
| CMP-01 – CMP-05 | UI | `packages/ui/src/BaseComponent.js` |
| BRM-01 – BRM-08 | UI | `packages/ui/src/BrowserManager.js` |
| ELH-01 – ELH-05 | UI | `packages/ui/src/ElementHelper.js` |
| SDR-01 – SDR-07 | UI | `packages/ui/src/ShadowDomResolver.js` |
| FRM-01 – FRM-07 | UI | `packages/ui/src/FrameManager.js` |
| CAP-01 – CAP-06 | UI | `packages/ui/src/config/capabilities/*.js` |
| WCF-01 – WCF-07 | UI | `packages/ui/src/config/wdio.web.conf.js` |
| MBP-01 – MBP-21 | Mobile | `packages/mobile/src/MobileBasePage.js` |
| MCF-01 – MCF-05 | Mobile | `packages/mobile/src/config/capabilities/*.js` |
| MCG-01 – MCG-05 | Mobile | `packages/mobile/src/config/wdio.mobile.conf.js` |
| HKF-01 – HKF-11 | Core | `packages/core/src/config/base.hooks.js` |
| BDD-01 – BDD-06 | Root | `test/features/**`, `test/step-definitions/**` |
| CFG-01 – CFG-05 | Root | `.env.example`, `config/`, `config/helpers/configHelper.js` |
| CI-01 – CI-05 | Root | `.github/`, `docker/`, `scripts/`, `package.json` |
| DOC-01 – DOC-10 | Root | `jsdoc.config.json`, `package.json`, `docs/api/` |
| XCT-01 – XCT-08 | All | Cross-cutting, enforced across all packages |
| NFR-01 – NFR-09 | All | Non-functional, verified via testing and review |
| CLD-01 – CLD-09 | Cloud | `config/capabilities/index.js`, `config/wdio.cloud.js` |
| BS-01 – BS-05 | Cloud | `config/capabilities/browserstack.js` |
| SL-01 – SL-06 | Cloud | `config/capabilities/saucelabs.js` |
| LT-01 – LT-05 | Cloud | `config/capabilities/lambdatest.js` |
| PF-01 – PF-05 | Cloud | `config/capabilities/perfecto.js` |
| CRE-01 – CRE-14 | Core | `packages/core/src/utils/ConfigResolver.js`, `config/defaults.config.json`, `config/environments/*.config.json` |
| APT-01 – APT-14 | Core / API | `packages/core/src/helpers/ApiHelper.js`, step definitions |
| DB-01 – DB-12 | Core | Database helper (implementation-dependent) |
| VIS-01 – VIS-10 | UI | Visual regression service integration |
| A11Y-01 – A11Y-09 | UI | Accessibility scanner integration |
| NTF-01 – NTF-09 | Core | Notification helper (Slack, email, Teams) |
| TDM-01 – TDM-12 | Core | `packages/core/src/helpers/DataGenerator.js`, `packages/core/src/helpers/DataDrivenManager.js` |

---

*End of Requirements Specification*
