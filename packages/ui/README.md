# @wdio-framework/ui

> Web/Browser UI testing module for the WebdriverIO Cucumber framework — provides `BasePage`, `BrowserManager`, `ElementHelper`, `ShadowDomResolver`, and `FrameManager`.

## Installation

```bash
npm install @wdio-framework/ui
# @wdio-framework/core is installed automatically as a dependency
```

### Peer Dependencies

```bash
npm install webdriverio @wdio/cli @wdio/local-runner @wdio/cucumber-framework
```

## What's Included

| Export | Description |
|--------|-------------|
| `BasePage` | Full web page object extending core's `AbstractBasePage` — adds Shadow DOM, Frame, Alert, Cookie, Storage, Select, Window/Tab management |
| `BaseComponent` | Reusable UI component scoped to a root selector |
| `BrowserManager` | Window sizing, tab management, performance metrics, network conditions |
| `ElementHelper` | Static element utilities with automatic shadow DOM & frame resolution |
| `ShadowDomResolver` | Transparent shadow DOM traversal (deep `>>>` selectors + auto-search) |
| `FrameManager` | Automatic iframe traversal to locate elements across frames |
| `resolveWebCapabilities()` | Resolve Chrome/Firefox/Edge capabilities by name |

> **All exports from `@wdio-framework/core` are also re-exported**, so you can import everything from a single package.

## Quick Start

### 1. Create a Page Object

```javascript
const { BasePage } = require('@wdio-framework/ui');

class LoginPage extends BasePage {
    get url() { return '/login'; }
    get username() { return $('[data-testid="username"]'); }
    get password() { return $('[data-testid="password"]'); }
    get submitBtn() { return $('[data-testid="submit"]'); }

    async login(user, pass) {
        await this.open();
        await this.setValue(this.username, user);
        await this.setValue(this.password, pass);
        await this.click(this.submitBtn);
    }
}

module.exports = new LoginPage();
```

### 2. Write Step Definitions

```javascript
const { Given, When, Then } = require('@wdio/cucumber-framework');
const loginPage = require('../page-objects/LoginPage');

When('I login with {string} and {string}', async (user, pass) => {
    await loginPage.login(user, pass);
});
```

### 3. Configure WDIO

```javascript
// wdio.conf.js
const { webConfig } = require('@wdio-framework/ui/src/config/wdio.web.conf');

// Use as-is or merge with overrides
exports.config = {
    ...webConfig,
    baseUrl: 'https://myapp.com',
};
```

## Shadow DOM Support

Elements inside shadow DOMs are resolved automatically:

```javascript
// Explicit deep selector
await page.click('my-component >>> .inner-button');

// Automatic fallback (when autoResolveShadowDom = true)
await page.click('.inner-button'); // searches shadow roots if not found in DOM
```

## Frame Support

Elements inside iframes are found automatically:

```javascript
// Automatic frame traversal (when autoResolveFrames = true)
await page.click('#iframe-element'); // searches all iframes if not found in main document

// Manual frame switching
await page.switchToFrame('myIframe');
await page.click('#element');
await page.switchToDefaultContent();
```

## Web Capabilities

```javascript
const {
    getChromeCapabilities,
    getFirefoxCapabilities,
    getEdgeCapabilities,
    resolveWebCapabilities,
} = require('@wdio-framework/ui');

// By name
const caps = resolveWebCapabilities('chrome', { headless: true });

// Direct
const chromeCaps = getChromeCapabilities({ headless: true });
```

## License

MIT
