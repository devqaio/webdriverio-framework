/**
 * ═══════════════════════════════════════════════════════════════
 * Framework Public API — Backward-Compatible Re-Export Shim
 * ═══════════════════════════════════════════════════════════════
 *
 * This file re-exports everything from the modular packages
 * so that existing code using `require('../src')` continues
 * to work without modification.
 *
 * For new projects, import directly from the packages:
 *   const { BasePage, BrowserManager } = require('@wdio-framework/ui');
 *   const { MobileBasePage }           = require('@wdio-framework/mobile');
 *   const { Logger, Timeouts }         = require('@wdio-framework/core');
 */

const core = require('@wdio-framework/core');

// Conditionally load ui and mobile packages (they may not be installed)
let ui = {};
let mobile = {};

try { ui = require('@wdio-framework/ui'); } catch { /* ui package not installed */ }
try { mobile = require('@wdio-framework/mobile'); } catch { /* mobile package not installed */ }

module.exports = {
    ...core,
    ...ui,
    ...mobile,
};
