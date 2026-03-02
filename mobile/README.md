# @wdio-framework/mobile

> Mobile/Appium testing module for the WebdriverIO Cucumber framework — provides `MobileBasePage` with gesture, context-switching, and device interaction support.

## Installation

```bash
npm install @wdio-framework/mobile
# @wdio-framework/core is installed automatically as a dependency
```

### Peer Dependencies

```bash
npm install webdriverio @wdio/cli @wdio/local-runner @wdio/cucumber-framework @wdio/appium-service
npm install -D appium appium-uiautomator2-driver appium-xcuitest-driver
```

## What's Included

| Export | Description |
|--------|-------------|
| `MobileBasePage` | Full mobile page object extending core's `AbstractBasePage` — adds gestures, context switching, app lifecycle, device utilities |
| `resolveMobileCapabilities()` | Resolve Android/iOS capabilities by platform name |

> **All exports from `@wdio-framework/core` are also re-exported**, so you can import everything from a single package.

## Quick Start

### 1. Create a Mobile Page Object

```javascript
const { MobileBasePage } = require('@wdio-framework/mobile');

class LoginScreen extends MobileBasePage {
    get usernameInput() { return this.byAccessibilityId('username-input'); }
    get passwordInput() { return this.byAccessibilityId('password-input'); }
    get loginButton()   { return this.byAccessibilityId('login-button');   }

    async login(user, pass) {
        await this.setValue(this.usernameInput, user);
        await this.setValue(this.passwordInput, pass);
        await this.tap(this.loginButton);
    }
}

module.exports = new LoginScreen();
```

### 2. Configure WDIO

```javascript
// wdio.mobile.conf.js
const { mobileConfig } = require('@wdio-framework/mobile/src/config/wdio.mobile.conf');

exports.config = {
    ...mobileConfig,
    capabilities: [{
        'appium:platformName': 'Android',
        'appium:deviceName': 'Pixel_6',
        'appium:app': './app/debug.apk',
        'appium:automationName': 'UiAutomator2',
    }],
};
```

## Feature Highlights

### Platform-Aware Selectors

```javascript
// Cross-platform accessibility selector
const el = screen.byAccessibilityId('submit-btn');

// Platform-specific selector
const el = await screen.byPlatform({
    ios: '-ios predicate string:name == "Submit"',
    android: 'android=new UiSelector().text("Submit")',
});

// Native selectors
const el = screen.byAndroidUiAutomator('text("Submit")');
const el = screen.byIosPredicateString('name == "Submit"');
const el = screen.byIosClassChain('**/XCUIElementTypeButton[`name == "Submit"`]');
```

### Touch Gestures

```javascript
await screen.tap(element);
await screen.doubleTap(element);
await screen.longPress(element, 3000);

// Directional swipes
await screen.swipeUp();
await screen.swipeDown();
await screen.swipeLeft();
await screen.swipeRight();

// Swipe element in a direction
await screen.swipeElement(carousel, 'left');

// Scroll until element found
await screen.scrollToElement('~target-element', 'up', 15);

// Pinch & zoom
await screen.pinch(element);
await screen.zoom(element);

// Touch drag-and-drop
await screen.touchDragAndDrop(source, target);
```

### Context Switching (Hybrid Apps)

```javascript
// Switch between native and webview contexts
await screen.switchToWebViewContext();
await screen.switchToNativeContext();

// Execute in a specific context, then restore
await screen.withinContext('WEBVIEW_1', async () => {
    await screen.click('#web-button');
});
```

### App Lifecycle (Appium 2.x)

```javascript
await screen.backgroundApp(5);
await screen.resetApp();                // terminate + activate
await screen.resetApp(undefined, true); // full reset (remove + reinstall)
await screen.closeApp();
await screen.launchApp();
await screen.installApp('./app.apk');
await screen.removeApp('com.example');
```

### Device Utilities

```javascript
await screen.setOrientation('LANDSCAPE');
await screen.lockDevice();
await screen.unlockDevice();
await screen.hideKeyboard();
await screen.openDeepLink('myapp://product/123');
await screen.setGeoLocation({ latitude: 37.7749, longitude: -122.4194 });
await screen.pressBack();   // Android hardware back
await screen.pressHome();   // Android hardware home
await screen.toggleWifi();  // Android only
```

## Mobile Capabilities

```javascript
const {
    getAndroidCapabilities,
    getIOSCapabilities,
    resolveMobileCapabilities,
} = require('@wdio-framework/mobile');

// By platform name
const caps = resolveMobileCapabilities('android');

// Direct
const androidCaps = getAndroidCapabilities({ deviceName: 'Pixel_6' });
const iosCaps = getIOSCapabilities({ platformVersion: '17.0' });
```

## License

MIT
