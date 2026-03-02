# Getting Started

Welcome aboard! This guide will walk you through setting up the framework on your machine and running your very first automated test. You'll be up and running in under ten minutes.

---

## What You'll Need

Before we begin, make sure you have the following installed:

| Tool | Minimum Version | How to Check |
|---|---|---|
| **Node.js** | 18.x or later | `node --version` |
| **npm** | 9.x or later | `npm --version` |
| **Google Chrome** | Latest stable | `google-chrome --version` (or check via the browser's About page) |
| **Git** | Any recent version | `git --version` |

> **Tip:** We recommend using [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage Node.js versions. It makes switching between projects painless.

---

## Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd WebDriverIO
```

---

## Step 2 — Install Dependencies

```bash
npm install
```

This single command installs everything — WebdriverIO, Cucumber, reporters, and all utilities. A post-install script automatically creates the required output directories (`reports/`, `screenshots/`, `logs/`, etc.).

---

## Step 3 — Configure Your Environment

Copy the example `.env` file and update it with your application's details:

```bash
cp .env.example .env
```

Open `.env` in your editor and set at least these values:

```env
BASE_URL=https://your-app-url.com
TEST_ENV=dev
BROWSER=chrome
```

Everything else has sensible defaults that you can adjust later.

---

## Step 4 — Verify the Setup

Run the built-in health check to make sure everything is in order:

```bash
npm run health-check
```

You should see green ticks next to Node.js, all critical dependencies, and the configuration file. If anything is red, the message will tell you exactly what to fix.

---

## Step 5 — Run Your First Test

### Run all tests
```bash
npm test
```

### Run only smoke tests
```bash
npm run test:smoke
```

### Run in headless mode (no visible browser window)
```bash
npm run test:headless
```

### Run against a specific environment
```bash
npm run test:dev
npm run test:staging
```

---

## Step 6 — View the Reports

After the run completes, generate and open the interactive reports:

```bash
# Cucumber HTML report (opens in your browser)
npm run report:html

# Allure report (richer, interactive dashboards)
npm run report:allure

# Or generate all reports at once
npm run report:generate
```

---

## What Just Happened?

Here's what the framework did behind the scenes:

1. **Read configuration** from `config/wdio.conf.js` and your `.env` file
2. **Launched Chrome** with the capabilities defined in `config/capabilities/chrome.js`
3. **Found feature files** in `test/features/` matching your tag expression
4. **Executed Cucumber scenarios** using the step definitions in `test/step-definitions/`
5. **Captured results** in JSON format for Allure, Cucumber HTML, and Timeline reporters
6. **Took screenshots** automatically on any step failure
7. **Generated reports** in the `reports/` directory

---

## Next Steps

Now that you're set up, here are the guides worth reading next:

- **[Architecture](ARCHITECTURE.md)** — Understand the framework's structure and design philosophy
- **[Page Objects](PAGE_OBJECTS.md)** — Learn how to model your application's pages
- **[Configuration](CONFIGURATION.md)** — Deep-dive into all available settings
- **[Contributing](CONTRIBUTING.md)** — How to add new features, pages, or steps

---

## Need Help?

If you run into any trouble, check the [Troubleshooting](TROUBLESHOOTING.md) guide. It covers the most common setup issues and their fixes.

Still stuck? Open an issue on the repository, or reach out to the platform engineering team.
