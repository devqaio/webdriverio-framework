/**
 * ═══════════════════════════════════════════════════════════════
 * Framework Public API - Main Entry Point
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides a single import for all framework modules:
 *
 *   const { BasePage, DataGenerator, Logger } = require('../src');
 */

const core = require('./core');
const helpers = require('./helpers');
const utils = require('./utils');
const constants = require('./constants');

module.exports = {
    ...core,
    ...helpers,
    ...utils,
    ...constants,
};
