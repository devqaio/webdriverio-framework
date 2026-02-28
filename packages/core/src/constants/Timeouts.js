/**
 * ═══════════════════════════════════════════════════════════════
 * Timeouts - Centralised Timeout Constants
 * ═══════════════════════════════════════════════════════════════
 *
 * All timeout values used across the framework are defined here.
 * Overridable via the three-tier config system:
 *   env_var > env_config > default config
 */

const { ConfigResolver } = require('../utils/ConfigResolver');

const Timeouts = Object.freeze({
    /** Default wait for a single element to appear / become interactive */
    get ELEMENT_WAIT() { return ConfigResolver.getInt('TIMEOUT_IMPLICIT', 15000); },

    /** Page load timeout */
    get PAGE_LOAD() { return ConfigResolver.getInt('TIMEOUT_PAGE_LOAD', 30000); },

    /** Script execution timeout */
    get SCRIPT() { return ConfigResolver.getInt('TIMEOUT_SCRIPT', 30000); },

    /** Short wait for quick transitions / animations */
    SHORT: 5000,

    /** Medium wait for moderate operations */
    MEDIUM: 15000,

    /** Long wait for slow operations (file uploads, heavy pages) */
    LONG: 30000,

    /** Extra-long wait for very slow operations */
    EXTRA_LONG: 60000,

    /** Polling interval for custom waits */
    POLL_INTERVAL: 500,

    /** API request timeout */
    API_REQUEST: 30000,

    /** File download wait */
    FILE_DOWNLOAD: 30000,

    /** Animation / transition settle time */
    ANIMATION: 1000,
});

module.exports = { Timeouts };
