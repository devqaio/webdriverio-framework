/**
 * ═══════════════════════════════════════════════════════════════════════
 * MobileBasePage — Foundation Page Object for Native & Hybrid Mobile Apps
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Extends AbstractBasePage (core) with mobile-specific capabilities for
 * iOS and Android testing via Appium 2.x.  Includes:
 *
 *   • Context switching (NATIVE_APP ↔ WEBVIEW)
 *   • Touch / gesture primitives (tap, swipe, scroll, pinch, zoom)
 *   • Device orientation management
 *   • Mobile-specific waits (activity, alert, keyboard)
 *   • App lifecycle helpers (background, reset, install, remove)
 *   • Platform-aware selectors
 *   • Deep link and push notification helpers
 *
 * Usage:
 *   const { MobileBasePage } = require('@wdio-framework/mobile');
 *   class LoginScreen extends MobileBasePage {
 *       get usernameInput() {
 *           return this.byAccessibilityId('username-input');
 *       }
 *   }
 * ═══════════════════════════════════════════════════════════════════════
 */

const { AbstractBasePage, Logger, Timeouts } = require('@wdio-framework/core');

class MobileBasePage extends AbstractBasePage {
    constructor() {
        super();
        this.logger = Logger.getInstance(`Mobile:${this.constructor.name}`);
    }

    // ─── Platform Detection ───────────────────────────────────

    /**
     * Detect the current platform (ios / android / web).
     * @returns {Promise<string>}
     */
    async getPlatform() {
        try {
            const caps = await browser.capabilities;
            const platform = (caps.platformName || caps.platform || '').toLowerCase();
            if (platform.includes('ios')) return 'ios';
            if (platform.includes('android')) return 'android';
            return 'web';
        } catch {
            return 'web';
        }
    }

    /** @returns {Promise<boolean>} */
    async isIOS() {
        return (await this.getPlatform()) === 'ios';
    }

    /** @returns {Promise<boolean>} */
    async isAndroid() {
        return (await this.getPlatform()) === 'android';
    }

    /** @returns {Promise<boolean>} */
    async isMobile() {
        const p = await this.getPlatform();
        return p === 'ios' || p === 'android';
    }

    // ─── Platform-Aware Selectors ─────────────────────────────

    /**
     * Locate an element by its accessibility id (cross-platform).
     * iOS: accessibilityIdentifier   Android: content-desc
     */
    byAccessibilityId(id) {
        return $(`~${id}`);
    }

    /**
     * Locate an element using a platform-specific selector.
     * @param {{ ios: string, android: string }} selectors
     */
    async byPlatform(selectors) {
        const platform = await this.getPlatform();
        const selector = selectors[platform];
        if (!selector) throw new Error(`No selector provided for platform: ${platform}`);
        return $(selector);
    }

    /** Android UIAutomator selector. */
    byAndroidUiAutomator(expression) {
        return $(`android=new UiSelector().${expression}`);
    }

    /** iOS predicate string selector. */
    byIosPredicateString(predicate) {
        return $(`-ios predicate string:${predicate}`);
    }

    /** iOS class chain selector. */
    byIosClassChain(chain) {
        return $(`-ios class chain:${chain}`);
    }

    // ─── Context Switching ────────────────────────────────────

    /**
     * Get all available contexts (NATIVE_APP, WEBVIEW_xxx, etc.).
     * @returns {Promise<string[]>}
     */
    async getContexts() {
        return browser.getContexts();
    }

    /** Get the current context. @returns {Promise<string>} */
    async getCurrentContext() {
        return browser.getContext();
    }

    /** Switch to NATIVE_APP context. */
    async switchToNativeContext() {
        this.logger.debug('Switching to NATIVE_APP context');
        await browser.switchContext('NATIVE_APP');
    }

    /**
     * Switch to the first available WEBVIEW context.
     * @param {number} [timeout=10000] Time to wait for webview to appear
     */
    async switchToWebViewContext(timeout = 10000) {
        this.logger.debug('Switching to WEBVIEW context');
        await browser.waitUntil(
            async () => {
                const contexts = await browser.getContexts();
                return contexts.some((c) => c.includes('WEBVIEW'));
            },
            { timeout, timeoutMsg: `No WEBVIEW context appeared within ${timeout}ms` },
        );
        const contexts = await browser.getContexts();
        const webview = contexts.find((c) => c.includes('WEBVIEW'));
        await browser.switchContext(webview);
        this.logger.debug(`Switched to: ${webview}`);
    }

    /** Switch to a specific context by name. */
    async switchToContext(contextName) {
        this.logger.debug(`Switching to context: ${contextName}`);
        await browser.switchContext(contextName);
    }

    /** Execute callback in a specific context, then restore original. */
    async withinContext(contextName, callback) {
        const original = await this.getCurrentContext();
        try {
            await this.switchToContext(contextName);
            return await callback();
        } finally {
            await this.switchToContext(original);
        }
    }

    // ─── Touch / Gesture Actions ──────────────────────────────

    /** Perform a single tap on an element. */
    async tap(element) {
        const el = await this._resolveElement(element);
        await el.click();
    }

    /** Perform a double-tap on an element. */
    async doubleTap(element) {
        const el = await this._resolveElement(element);
        await el.doubleClick();
    }

    /**
     * Long press (press and hold) on an element.
     * @param {number} [duration=2000]  Hold duration in ms
     */
    async longPress(element, duration = 2000) {
        const el = await this._resolveElement(element);
        await browser.action('pointer', { parameters: { pointerType: 'touch' } })
            .move({ origin: el })
            .down()
            .pause(duration)
            .up()
            .perform();
    }

    /**
     * Swipe from one point to another on screen.
     * @param {object} from  { x, y }
     * @param {object} to    { x, y }
     * @param {number} [duration=800]
     */
    async swipe(from, to, duration = 800) {
        this.logger.debug(`Swiping from (${from.x},${from.y}) to (${to.x},${to.y})`);
        await browser.action('pointer', { parameters: { pointerType: 'touch' } })
            .move({ x: from.x, y: from.y })
            .down()
            .pause(100)
            .move({ x: to.x, y: to.y, duration })
            .up()
            .perform();
    }

    /** Swipe up on the screen (scroll down). */
    async swipeUp(percentage = 0.75) {
        const { width, height } = await browser.getWindowSize();
        const anchor = Math.floor(width / 2);
        const startY = Math.floor(height * (0.5 + percentage / 2));
        const endY = Math.floor(height * (0.5 - percentage / 2));
        await this.swipe({ x: anchor, y: startY }, { x: anchor, y: endY });
    }

    /** Swipe down on the screen (scroll up). */
    async swipeDown(percentage = 0.75) {
        const { width, height } = await browser.getWindowSize();
        const anchor = Math.floor(width / 2);
        const startY = Math.floor(height * (0.5 - percentage / 2));
        const endY = Math.floor(height * (0.5 + percentage / 2));
        await this.swipe({ x: anchor, y: startY }, { x: anchor, y: endY });
    }

    /** Swipe left (scrolls content to the right). */
    async swipeLeft(percentage = 0.75) {
        const { width, height } = await browser.getWindowSize();
        const anchor = Math.floor(height / 2);
        const startX = Math.floor(width * (0.5 + percentage / 2));
        const endX = Math.floor(width * (0.5 - percentage / 2));
        await this.swipe({ x: startX, y: anchor }, { x: endX, y: anchor });
    }

    /** Swipe right (scrolls content to the left). */
    async swipeRight(percentage = 0.75) {
        const { width, height } = await browser.getWindowSize();
        const anchor = Math.floor(height / 2);
        const startX = Math.floor(width * (0.5 - percentage / 2));
        const endX = Math.floor(width * (0.5 + percentage / 2));
        await this.swipe({ x: startX, y: anchor }, { x: endX, y: anchor });
    }

    /** Swipe an element in a given direction. */
    async swipeElement(element, direction, percentage = 0.5) {
        const el = await this._resolveElement(element);
        const location = await el.getLocation();
        const size = await el.getSize();

        const centerX = location.x + size.width / 2;
        const centerY = location.y + size.height / 2;
        const offsetX = size.width * percentage;
        const offsetY = size.height * percentage;

        const vectors = {
            up:    { from: { x: centerX, y: centerY + offsetY / 2 }, to: { x: centerX, y: centerY - offsetY / 2 } },
            down:  { from: { x: centerX, y: centerY - offsetY / 2 }, to: { x: centerX, y: centerY + offsetY / 2 } },
            left:  { from: { x: centerX + offsetX / 2, y: centerY }, to: { x: centerX - offsetX / 2, y: centerY } },
            right: { from: { x: centerX - offsetX / 2, y: centerY }, to: { x: centerX + offsetX / 2, y: centerY } },
        };

        const vec = vectors[direction.toLowerCase()];
        if (!vec) throw new Error(`Invalid swipe direction: ${direction}. Use up/down/left/right.`);

        await this.swipe(vec.from, vec.to);
    }

    /**
     * Scroll until an element becomes visible.
     * @param {string} selector  Element to find
     * @param {string} [direction='up']  Swipe direction
     * @param {number} [maxScrolls=10]
     */
    async scrollToElement(selector, direction = 'up', maxScrolls = 10) {
        this.logger.debug(`Scrolling ${direction} to find: ${selector}`);
        for (let i = 0; i < maxScrolls; i++) {
            try {
                const el = await $(selector);
                if (await el.isDisplayed()) {
                    this.logger.debug(`Element found after ${i} scroll(s)`);
                    return el;
                }
            } catch {
                // Not yet visible
            }

            if (direction === 'up') await this.swipeUp(0.5);
            else if (direction === 'down') await this.swipeDown(0.5);
            else if (direction === 'left') await this.swipeLeft(0.5);
            else if (direction === 'right') await this.swipeRight(0.5);
        }
        throw new Error(`Element "${selector}" not found after ${maxScrolls} scroll(s)`);
    }

    /** Pinch gesture (zoom out) centred on an element or screen centre. */
    async pinch(element) {
        const el = element ? await this._resolveElement(element) : null;
        const { width, height } = await browser.getWindowSize();
        const centerX = el ? (await el.getLocation()).x + (await el.getSize()).width / 2 : width / 2;
        const centerY = el ? (await el.getLocation()).y + (await el.getSize()).height / 2 : height / 2;
        const offset = 100;

        await browser.performActions([
            {
                type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: Math.floor(centerX - offset), y: Math.floor(centerY) },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pointerMove', duration: 500, x: Math.floor(centerX - 10), y: Math.floor(centerY) },
                    { type: 'pointerUp', button: 0 },
                ],
            },
            {
                type: 'pointer', id: 'finger2', parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: Math.floor(centerX + offset), y: Math.floor(centerY) },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pointerMove', duration: 500, x: Math.floor(centerX + 10), y: Math.floor(centerY) },
                    { type: 'pointerUp', button: 0 },
                ],
            },
        ]);
        await browser.releaseActions();
    }

    /** Zoom gesture (spread / zoom in) centred on an element or screen centre. */
    async zoom(element) {
        const el = element ? await this._resolveElement(element) : null;
        const { width, height } = await browser.getWindowSize();
        const centerX = el ? (await el.getLocation()).x + (await el.getSize()).width / 2 : width / 2;
        const centerY = el ? (await el.getLocation()).y + (await el.getSize()).height / 2 : height / 2;
        const offset = 100;

        await browser.performActions([
            {
                type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: Math.floor(centerX - 10), y: Math.floor(centerY) },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pointerMove', duration: 500, x: Math.floor(centerX - offset), y: Math.floor(centerY) },
                    { type: 'pointerUp', button: 0 },
                ],
            },
            {
                type: 'pointer', id: 'finger2', parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: Math.floor(centerX + 10), y: Math.floor(centerY) },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pointerMove', duration: 500, x: Math.floor(centerX + offset), y: Math.floor(centerY) },
                    { type: 'pointerUp', button: 0 },
                ],
            },
        ]);
        await browser.releaseActions();
    }

    /** Drag and drop between two points using touch. */
    async touchDragAndDrop(sourceElement, targetElement) {
        const source = await this._resolveElement(sourceElement);
        const target = await this._resolveElement(targetElement);

        const srcLoc = await source.getLocation();
        const srcSize = await source.getSize();
        const tgtLoc = await target.getLocation();
        const tgtSize = await target.getSize();

        const from = {
            x: Math.floor(srcLoc.x + srcSize.width / 2),
            y: Math.floor(srcLoc.y + srcSize.height / 2),
        };
        const to = {
            x: Math.floor(tgtLoc.x + tgtSize.width / 2),
            y: Math.floor(tgtLoc.y + tgtSize.height / 2),
        };

        await browser.action('pointer', { parameters: { pointerType: 'touch' } })
            .move({ x: from.x, y: from.y })
            .down()
            .pause(500)
            .move({ x: to.x, y: to.y, duration: 800 })
            .pause(200)
            .up()
            .perform();
    }

    // ─── Device Orientation ───────────────────────────────────

    /** Get the current device orientation. @returns {Promise<string>} */
    async getOrientation() {
        return browser.getOrientation();
    }

    /** Set the device orientation. @param {'PORTRAIT'|'LANDSCAPE'} orientation */
    async setOrientation(orientation) {
        this.logger.debug(`Setting orientation: ${orientation}`);
        await browser.setOrientation(orientation.toUpperCase());
    }

    async rotateLandscape() { await this.setOrientation('LANDSCAPE'); }
    async rotatePortrait()  { await this.setOrientation('PORTRAIT');  }

    // ─── App Lifecycle ────────────────────────────────────────

    /**
     * Send the app to the background for a given duration.
     * @param {number} [seconds=5]
     */
    async backgroundApp(seconds = 5) {
        this.logger.debug(`Backgrounding app for ${seconds}s`);
        await browser.background(seconds);
    }

    /**
     * Reset the app by terminating and re-activating it (Appium 2.x).
     * @param {string} [bundleId]  App bundle/package ID (reads from capabilities if omitted)
     * @param {boolean} [fullReset=false]  Remove & reinstall instead of terminate/activate
     */
    async resetApp(bundleId, fullReset = false) {
        const appId = bundleId || await this._getAppBundleId();
        this.logger.debug(`Resetting app: ${appId} (fullReset=${fullReset})`);
        if (fullReset) {
            const appPath = this._getAppPath();
            if (!appPath) {
                throw new Error(
                    'Cannot perform fullReset: appium:app capability is not set. ' +
                    'Set the capability or pass fullReset=false to use terminate/activate.',
                );
            }
            await browser.removeApp(appId);
            await browser.installApp(appPath);
            await browser.activateApp(appId);
        } else {
            await browser.terminateApp(appId);
            await browser.activateApp(appId);
        }
    }

    /** Close (terminate) the current app (Appium 2.x). */
    async closeApp(bundleId) {
        const appId = bundleId || await this._getAppBundleId();
        this.logger.debug(`Closing app: ${appId}`);
        await browser.terminateApp(appId);
    }

    /** Launch / re-launch the app under test (Appium 2.x). */
    async launchApp(bundleId) {
        const appId = bundleId || await this._getAppBundleId();
        this.logger.debug(`Launching app: ${appId}`);
        await browser.activateApp(appId);
    }

    async installApp(appPath) {
        this.logger.debug(`Installing app: ${appPath}`);
        await browser.installApp(appPath);
    }

    async removeApp(bundleId) {
        this.logger.debug(`Removing app: ${bundleId}`);
        await browser.removeApp(bundleId);
    }

    async isAppInstalled(bundleId) {
        return browser.isAppInstalled(bundleId);
    }

    async activateApp(bundleId) {
        this.logger.debug(`Activating app: ${bundleId}`);
        await browser.activateApp(bundleId);
    }

    async terminateApp(bundleId) {
        this.logger.debug(`Terminating app: ${bundleId}`);
        await browser.terminateApp(bundleId);
    }

    /** @returns {Promise<number>} 0=not installed, 1=not running, 3=background, 4=foreground */
    async getAppState(bundleId) {
        return browser.queryAppState(bundleId);
    }

    // ─── Keyboard ─────────────────────────────────────────────

    async isKeyboardShown() {
        return browser.isKeyboardShown();
    }

    async hideKeyboard() {
        try {
            if (await this.isKeyboardShown()) {
                this.logger.debug('Hiding keyboard');
                await browser.hideKeyboard();
            }
        } catch (err) {
            this.logger.warn(`hideKeyboard: ${err.message}`);
        }
    }

    async waitForKeyboard(timeout = 5000) {
        await browser.waitUntil(
            () => browser.isKeyboardShown(),
            { timeout, timeoutMsg: `Keyboard not shown after ${timeout}ms` },
        );
    }

    // ─── Device Utilities ─────────────────────────────────────

    async getScreenSize() {
        return browser.getWindowSize();
    }

    async lockDevice(seconds = 0) {
        this.logger.debug('Locking device');
        await browser.lock(seconds);
    }

    async unlockDevice() {
        this.logger.debug('Unlocking device');
        await browser.unlock();
    }

    async isDeviceLocked() {
        return browser.isLocked();
    }

    /**
     * Press a hardware key (Appium 2.x).
     * @param {number} keyCode  Android keycode (e.g. 4 = BACK, 3 = HOME)
     */
    async pressHardwareKey(keyCode) {
        if (this._isAndroid()) {
            await browser.execute('mobile: pressKey', { keycode: keyCode });
        } else {
            this.logger.warn('pressHardwareKey is Android-specific; use iOS navigation methods instead');
        }
    }

    async pressBack() {
        if (this._isAndroid()) {
            await browser.execute('mobile: pressKey', { keycode: 4 });
        } else {
            await browser.back();
        }
    }

    async pressHome() {
        if (this._isAndroid()) {
            await browser.execute('mobile: pressKey', { keycode: 3 });
        } else {
            this.logger.warn('pressHome is Android-specific; use activateApp for iOS');
        }
    }

    /** Open a deep link URL. @param {string} url e.g. 'myapp://product/123' */
    async openDeepLink(url) {
        this.logger.debug(`Opening deep link: ${url}`);
        await browser.url(url);
    }

    async setGeoLocation(location) {
        this.logger.debug(`Setting geolocation: ${JSON.stringify(location)}`);
        await browser.setGeoLocation(location);
    }

    async getGeoLocation() {
        return browser.getGeoLocation();
    }

    async toggleAirplaneMode() { await browser.toggleAirplaneMode(); }
    async toggleWifi()         { await browser.toggleWiFi(); }
    async toggleData()         { await browser.toggleData(); }

    // ─── Notifications / System ───────────────────────────────

    async openNotifications() {
        this.logger.debug('Opening notifications');
        await browser.openNotifications();
    }

    async getCurrentActivity() { return browser.getCurrentActivity(); }
    async getCurrentPackage()  { return browser.getCurrentPackage();  }

    async startActivity(appPackage, appActivity) {
        this.logger.debug(`Starting activity: ${appPackage}/${appActivity}`);
        await browser.startActivity(appPackage, appActivity);
    }

    // ─── Mobile-Specific Waits ────────────────────────────────

    async waitForActivity(activity, timeout = 10000) {
        await browser.waitUntil(
            async () => {
                const current = await browser.getCurrentActivity();
                return current.includes(activity);
            },
            { timeout, timeoutMsg: `Activity "${activity}" not loaded within ${timeout}ms` },
        );
    }

    async waitForAlert(timeout = 10000) {
        await browser.waitUntil(
            async () => {
                try { await browser.getAlertText(); return true; } catch { return false; }
            },
            { timeout, timeoutMsg: `Alert not present within ${timeout}ms` },
        );
    }

    async acceptAlert() {
        try { await browser.acceptAlert(); }
        catch (err) { this.logger.warn(`acceptAlert: ${err.message}`); }
    }

    async dismissAlert() {
        try { await browser.dismissAlert(); }
        catch (err) { this.logger.warn(`dismissAlert: ${err.message}`); }
    }

    /** Take a screenshot with platform-optimised naming. */
    async takeScreenshot(name) {
        const platform = await this.getPlatform();
        const safeFileName = `${platform}_${name}_${Date.now()}`;
        return super.takeScreenshot(safeFileName);
    }

    // ─── Private Helpers ──────────────────────────────────────

    /** @private */
    _isAndroid() {
        try {
            // Use cached platform if available (populated by getPlatform())
            if (this._cachedPlatform) {
                return this._cachedPlatform.includes('android');
            }
            const caps = browser.capabilities || {};
            const platform = (caps.platformName || caps.platform || '').toLowerCase();
            this._cachedPlatform = platform;
            return platform.includes('android');
        } catch {
            return false;
        }
    }

    /** @private */
    async _getAppBundleId() {
        const caps = await browser.capabilities;
        const bundleId = caps['appium:appPackage'] || caps['appium:bundleId']
            || caps.appPackage || caps.bundleId;
        if (!bundleId) {
            throw new Error(
                'Cannot determine app bundle ID. Pass bundleId explicitly or set appium:appPackage / appium:bundleId in capabilities.',
            );
        }
        return bundleId;
    }

    /** @private */
    _getAppPath() {
        const caps = browser.capabilities || {};
        return caps['appium:app'] || caps.app || '';
    }
}

module.exports = { MobileBasePage };
