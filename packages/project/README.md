# @wdio-framework/project

End-to-end test project built on top of the `@wdio-framework/ui` and `@wdio-framework/mobile` packages.

## Overview

This is an isolated test project that demonstrates how to use the WebdriverIO framework packages to build a full end-to-end test suite. It includes:

- **test/** — Cucumber feature files, step definitions, page objects, and components
- **config/** — WebdriverIO configuration files for different environments and platforms
- **scripts/** — Utility scripts for setup, reporting, and test generation
- **docker/** — Docker / Selenium Grid setup for containerised execution

## Package Dependencies

- [`@wdio-framework/ui`](../ui) — Web/Browser testing module (automatically brings in `@wdio-framework/core`)
- [`@wdio-framework/mobile`](../mobile) — Mobile/Appium testing module (automatically brings in `@wdio-framework/core`)

## Getting Started

```bash
# From monorepo root — install all workspace packages
npm install

# Run all tests (from this directory)
npm test

# Or via workspace from the monorepo root
npm run test --workspace=packages/project
```

## Running Tests

```bash
npm test                    # Default browser (chrome)
npm run test:dev            # DEV environment
npm run test:staging        # Staging environment
npm run test:chrome         # Chrome
npm run test:firefox        # Firefox
npm run test:headless       # Headless mode
npm run test:mobile         # Mobile / Appium
npm run test:docker         # Selenium Grid via Docker
npm run test:smoke          # @smoke tagged tests
npm run test:regression     # @regression tagged tests
```

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests |
| `npm run test:dev` | Run tests against DEV environment |
| `npm run test:staging` | Run tests against Staging |
| `npm run generate:features` | Generate feature files from data |
| `npm run report:generate` | Generate HTML test report |
| `npm run health-check` | Verify framework dependencies |
| `npm run clean` | Clean test artifacts |
