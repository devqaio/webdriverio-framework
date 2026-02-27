/**
 * ═══════════════════════════════════════════════════════════════
 * Core Module - Re-exports
 * ═══════════════════════════════════════════════════════════════
 */

const { BasePage } = require('./BasePage');
const { BaseComponent } = require('./BaseComponent');
const { BrowserManager } = require('./BrowserManager');
const { ElementHelper } = require('./ElementHelper');
const { ShadowDomResolver } = require('./ShadowDomResolver');
const { FrameManager } = require('./FrameManager');
const { MobileBasePage } = require('./MobileBasePage');

module.exports = {
    BasePage,
    BaseComponent,
    BrowserManager,
    ElementHelper,
    ShadowDomResolver,
    FrameManager,
    MobileBasePage,
};
