/**
 * ═══════════════════════════════════════════════════════════════════════
 * @wdio-framework/mobile — Package Entry Point
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Mobile/Appium testing module providing:
 *   • MobileBasePage          — Gesture-aware page object (extends core AbstractBasePage)
 *   • Mobile capabilities     — Android & iOS config factories
 *   • Mobile config template  — Ready-to-use WDIO mobile configuration
 *
 * Install:
 *   npm install @wdio-framework/mobile
 *   (automatically pulls in @wdio-framework/core)
 * ═══════════════════════════════════════════════════════════════════════
 */

// Re-export everything from core so consumers get a single import
const core = require('@wdio-framework/core');

// ─── Mobile-specific exports ──────────────────────────────────
const { MobileBasePage } = require('./src/MobileBasePage');

// ─── Mobile Capabilities ──────────────────────────────────────
const { getAndroidCapabilities, getAndroidChromeCapabilities } = require('./src/config/capabilities/android');
const { getIOSCapabilities, getIOSSafariCapabilities } = require('./src/config/capabilities/ios');
const { resolveMobileCapabilities } = require('./src/config/capabilities');

module.exports = {
    // Spread core so `const { Logger, MobileBasePage } = require('@wdio-framework/mobile')` works
    ...core,

    // Mobile-specific
    MobileBasePage,

    // Mobile capabilities
    getAndroidCapabilities,
    getAndroidChromeCapabilities,
    getIOSCapabilities,
    getIOSSafariCapabilities,
    resolveMobileCapabilities,
};
