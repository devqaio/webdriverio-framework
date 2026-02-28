/**
 * ═══════════════════════════════════════════════════════════════════════
 * @wdio-framework/ui — Package Entry Point
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Web/Browser testing module providing:
 *   • BasePage             — Full web page object (extends core AbstractBasePage)
 *   • BaseComponent        — Reusable UI component object
 *   • BrowserManager       — Advanced browser / window management
 *   • ElementHelper        — Static element interaction utilities
 *   • ShadowDomResolver    — Automatic shadow DOM traversal
 *   • FrameManager         — Automatic iframe traversal
 *   • Web capabilities     — Chrome, Firefox, Edge config factories
 *   • Web config template  — Ready-to-use WDIO web configuration
 *
 * Install:
 *   npm install @wdio-framework/ui
 *   (automatically pulls in @wdio-framework/core)
 * ═══════════════════════════════════════════════════════════════════════
 */

// Re-export everything from core so consumers get a single import
const core = require('@wdio-framework/core');

// ─── UI-specific exports ──────────────────────────────────────
const { BasePage } = require('./src/BasePage');
const { BaseComponent } = require('./src/BaseComponent');
const { BrowserManager } = require('./src/BrowserManager');
const { ElementHelper } = require('./src/ElementHelper');
const { ShadowDomResolver } = require('./src/ShadowDomResolver');
const { FrameManager } = require('./src/FrameManager');

// ─── Web Capabilities ─────────────────────────────────────────
const { getChromeCapabilities } = require('./src/config/capabilities/chrome');
const { getFirefoxCapabilities } = require('./src/config/capabilities/firefox');
const { getEdgeCapabilities } = require('./src/config/capabilities/edge');
const { resolveWebCapabilities } = require('./src/config/capabilities');

module.exports = {
    // Spread core so `const { Logger, BasePage } = require('@wdio-framework/ui')` works
    ...core,

    // UI-specific (override core's AbstractBasePage with the web-aware BasePage)
    BasePage,
    BaseComponent,
    BrowserManager,
    ElementHelper,
    ShadowDomResolver,
    FrameManager,

    // Web capabilities
    getChromeCapabilities,
    getFirefoxCapabilities,
    getEdgeCapabilities,
    resolveWebCapabilities,
};
