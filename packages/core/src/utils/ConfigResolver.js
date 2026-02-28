/**
 * ═══════════════════════════════════════════════════════════════
 * ConfigResolver — Layered Configuration with Precedence
 * ═══════════════════════════════════════════════════════════════
 *
 * Three-tier configuration resolution:
 *
 *   1. **Environment variables** (highest precedence)
 *      Includes OS env vars, Jenkins parameters, CI injected vars,
 *      and values loaded from `.env` via dotenv.
 *
 *   2. **Environment-specific config** (medium precedence)
 *      JSON files under `config/environments/<env>.config.json`
 *      (e.g., dev.config.json, staging.config.json, prod.config.json).
 *
 *   3. **Default config** (lowest precedence)
 *      `config/defaults.config.json` — static baseline values.
 *
 * Precedence order: env_var > env_config > default config
 *
 * Special behaviours:
 *   • `DRIVER_VERSION=auto` triggers auto-detection from the installed
 *     browser on the local machine (see {@link #_autoResolveDriverVersion}).
 *   • All values are returned as strings (matching process.env semantics).
 *   • The `_meta` key in JSON files is reserved for documentation and
 *     is excluded from config resolution.
 *
 * @module ConfigResolver
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// ─── Internal State ──────────────────────────────────────────

/** @type {Object.<string, string>|null} Cached merged config */
let _resolvedConfig = null;

/** @type {string|null} The environment name used for the last resolution */
let _resolvedEnv = null;

/** @type {string} Root directory of the project */
const PROJECT_ROOT = process.cwd();

// ─── Path helpers ────────────────────────────────────────────

/**
 * Locate the config directory. Searches in order:
 *   1. <cwd>/config/
 *   2. <package-root>/config/ (walking up from __dirname)
 * @returns {string}
 * @private
 */
function _findConfigDir() {
    const cwdConfig = path.join(PROJECT_ROOT, 'config');
    if (fs.existsSync(cwdConfig)) return cwdConfig;

    // Walk up from the core package to find the workspace root config/
    let dir = __dirname;
    for (let i = 0; i < 6; i++) {
        dir = path.dirname(dir);
        const candidate = path.join(dir, 'config');
        if (fs.existsSync(path.join(candidate, 'defaults.config.json'))) {
            return candidate;
        }
    }
    return cwdConfig; // Fall back even if it doesn't exist (will be handled later)
}

const CONFIG_DIR = _findConfigDir();

// ═══════════════════════════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Layered configuration resolver with three-tier precedence.
 * All methods are static — no instantiation is needed.
 *
 * @class ConfigResolver
 * @example
 * const { ConfigResolver } = require('@wdio-framework/core');
 *
 * // Initialise early (e.g. in wdio.conf.js)
 * ConfigResolver.init('staging');
 *
 * // Read values
 * const url    = ConfigResolver.get('BASE_URL');
 * const port   = ConfigResolver.getInt('APP_PORT', 3000);
 * const hl     = ConfigResolver.getBool('HEADLESS');
 * const browser = ConfigResolver.browser; // convenience getter
 *
 * // Debug
 * console.log(ConfigResolver.summary());
 */
class ConfigResolver {

    // ─── Core Accessors ──────────────────────────────────────

    /**
     * Retrieve a resolved config value by key.
     *
     * Resolution order:
     *   1. `process.env[key]` — if set and non-empty
     *   2. environment-specific JSON — if key exists
     *   3. defaults.config.json — static default
     *
     * @param {string} key    - The configuration key (e.g. `'BROWSER'`, `'BASE_URL'`).
     * @param {string} [fallback] - Value returned when no tier provides the key.
     * @returns {string} Resolved value
     *
     * @example
     * ConfigResolver.get('BASE_URL');            // 'https://staging.example.com'
     * ConfigResolver.get('MISSING_KEY', 'N/A');  // 'N/A'
     */
    static get(key, fallback = '') {
        const config = ConfigResolver._getResolved();
        return config[key] !== undefined ? config[key] : fallback;
    }

    /**
     * Retrieve a config value parsed as an integer.
     *
     * @param {string} key
     * @param {number} [fallback=0]
     * @returns {number}
     *
     * @example
     * ConfigResolver.getInt('MAX_INSTANCES', 5);  // 5 (if not configured)
     * ConfigResolver.getInt('TIMEOUT_IMPLICIT');   // 15000 (from defaults)
     */
    static getInt(key, fallback = 0) {
        const raw = ConfigResolver.get(key);
        if (raw === '' || raw === undefined) return fallback;
        const parsed = parseInt(raw, 10);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    /**
     * Retrieve a config value parsed as a boolean.
     * `'true'` (case-insensitive) → `true`, everything else → `false`.
     *
     * @param {string} key
     * @param {boolean} [fallback=false]
     * @returns {boolean}
     *
     * @example
     * ConfigResolver.getBool('HEADLESS');        // true (if env var HEADLESS=true)
     * ConfigResolver.getBool('UNKNOWN', false);  // false
     */
    static getBool(key, fallback = false) {
        const raw = ConfigResolver.get(key);
        if (raw === '' || raw === undefined) return fallback;
        return raw.toLowerCase() === 'true';
    }

    /**
     * Retrieve the complete, merged configuration object.
     * Useful for debugging or logging the effective config.
     *
     * @returns {Object.<string, string>} Frozen merged config
     */
    static getAll() {
        return Object.freeze({ ...ConfigResolver._getResolved() });
    }

    /**
     * Get the active environment name (e.g., `'dev'`, `'staging'`, `'prod'`).
     *
     * @returns {string}
     */
    static getEnv() {
        return ConfigResolver.get('TEST_ENV', 'dev').toLowerCase();
    }

    // ─── Convenience Shorthand ───────────────────────────────

    /** @returns {string} Resolved BASE_URL */
    static get baseUrl() { return ConfigResolver.get('BASE_URL'); }

    /** @returns {string} Resolved API_BASE_URL */
    static get apiBaseUrl() { return ConfigResolver.get('API_BASE_URL'); }

    /** @returns {string} Resolved BROWSER */
    static get browser() { return ConfigResolver.get('BROWSER', 'chrome'); }

    /** @returns {boolean} Resolved HEADLESS */
    static get headless() { return ConfigResolver.getBool('HEADLESS'); }

    /** @returns {number} Resolved MAX_INSTANCES */
    static get maxInstances() { return ConfigResolver.getInt('MAX_INSTANCES', 5); }

    /** @returns {string} Resolved LOG_LEVEL */
    static get logLevel() { return ConfigResolver.get('LOG_LEVEL', 'info'); }

    /** @returns {number} TIMEOUT_IMPLICIT */
    static get timeoutImplicit() { return ConfigResolver.getInt('TIMEOUT_IMPLICIT', 15000); }

    /** @returns {number} TIMEOUT_PAGE_LOAD */
    static get timeoutPageLoad() { return ConfigResolver.getInt('TIMEOUT_PAGE_LOAD', 30000); }

    /** @returns {number} TIMEOUT_SCRIPT */
    static get timeoutScript() { return ConfigResolver.getInt('TIMEOUT_SCRIPT', 30000); }

    /** @returns {number} RETRY_COUNT */
    static get retryCount() { return ConfigResolver.getInt('RETRY_COUNT', 1); }

    /** @returns {string} DRIVER_VERSION (auto-resolved if 'auto') */
    static get driverVersion() { return ConfigResolver.get('DRIVER_VERSION'); }

    // ─── Lifecycle ───────────────────────────────────────────

    /**
     * Force a fresh resolution on the next {@link get} call.
     * Useful when environment variables change at runtime (e.g., in tests).
     */
    static reset() {
        _resolvedConfig = null;
        _resolvedEnv = null;
    }

    /**
     * Initialise the resolver eagerly. Call this early in the process
     * (e.g., in wdio.conf.js after `dotenv.config()`) to ensure all
     * downstream code sees the resolved values.
     *
     * @param {string} [env] - Override the environment name instead of
     *   reading from `process.env.TEST_ENV`.
     *
     * @example
     * // In wdio.conf.js:
     * require('dotenv').config();
     * ConfigResolver.init();           // uses TEST_ENV from .env
     * ConfigResolver.init('staging');   // force staging config
     */
    static init(env) {
        ConfigResolver.reset();
        if (env) {
            // Temporarily set TEST_ENV so the resolver picks it up
            process.env.TEST_ENV = env;
        }
        ConfigResolver._getResolved();
    }

    // ─── Debug / Logging ─────────────────────────────────────

    /**
     * Return a human-readable summary showing which tier each key came from.
     * Useful for debug logging at the start of a test run.
     *
     * @returns {string} Multi-line formatted summary
     */
    static summary() {
        const config = ConfigResolver._getResolved();
        const defaults = ConfigResolver._loadJson(path.join(CONFIG_DIR, 'defaults.config.json'));
        const envConfig = ConfigResolver._loadEnvConfig();
        const lines = ['┌─── ConfigResolver Summary ───────────────────────┐'];
        lines.push(`│  Environment : ${ConfigResolver.getEnv().padEnd(35)}│`);
        lines.push('├──────────────────────────┬────────────┬─────────────┤');
        lines.push('│ Key                      │ Source     │ Value       │');
        lines.push('├──────────────────────────┼────────────┼─────────────┤');

        for (const key of Object.keys(config).sort()) {
            let source = 'default';
            const envVal = process.env[key];
            if (envVal !== undefined && envVal !== '') {
                source = 'env_var';
            } else if (envConfig[key] !== undefined) {
                source = 'env_config';
            }
            const val = config[key] || '';
            const displayVal = _maskSensitive(key, val);
            lines.push(
                `│ ${key.padEnd(24)} │ ${source.padEnd(10)} │ ${displayVal.substring(0, 11).padEnd(11)} │`,
            );
        }
        lines.push('└──────────────────────────┴────────────┴─────────────┘');
        return lines.join('\n');
    }

    // ═════════════════════════════════════════════════════════
    //  Internal
    // ═════════════════════════════════════════════════════════

    /**
     * Lazy-load and cache the merged config.
     * @returns {Object.<string, string>}
     * @private
     */
    static _getResolved() {
        const currentEnv = (process.env.TEST_ENV || 'dev').toLowerCase();

        // Re-resolve if env changed or first call
        if (_resolvedConfig && _resolvedEnv === currentEnv) {
            return _resolvedConfig;
        }

        // ── Tier 3: defaults ──────────────────────────────────
        const defaults = ConfigResolver._loadJson(
            path.join(CONFIG_DIR, 'defaults.config.json'),
        );

        // ── Tier 2: environment-specific ──────────────────────
        const envConfig = ConfigResolver._loadEnvConfig(currentEnv);

        // ── Merge: defaults ← env_config ← env_var ───────────
        const merged = {};

        // Start with defaults
        for (const [key, value] of Object.entries(defaults)) {
            if (key === '_meta') continue;
            merged[key] = value;
        }

        // Override with env-specific config
        for (const [key, value] of Object.entries(envConfig)) {
            if (key === '_meta') continue;
            merged[key] = value;
        }

        // Override with actual environment variables (highest precedence)
        for (const key of Object.keys(merged)) {
            const envVal = process.env[key];
            if (envVal !== undefined && envVal !== '') {
                merged[key] = envVal;
            }
        }

        // Also pick up any env vars NOT in defaults/envConfig (user-defined)
        // but only those matching known patterns (to avoid polluting with OS vars)
        const KNOWN_PREFIXES = [
            'BASE_URL', 'API_', 'TEST_', 'BROWSER', 'HEADLESS', 'WINDOW_',
            'MAX_', 'LOG_', 'RETRY_', 'SPEC_', 'TIMEOUT_', 'ENCRYPTION_',
            'REPORT_', 'SELENIUM_', 'USE_', 'DB_', 'APPIUM_', 'ANDROID_',
            'IOS_', 'MOBILE_', 'EXECUTION_', 'TAG_', 'DRIVER_', 'SLACK_',
            'EMAIL_', 'PROJECT_', 'DATA_', 'WDIO_',
        ];
        for (const [key, value] of Object.entries(process.env)) {
            if (merged[key] === undefined && KNOWN_PREFIXES.some((p) => key.startsWith(p))) {
                merged[key] = value;
            }
        }

        // ── Special: auto-resolve DRIVER_VERSION ──────────────
        if (merged.DRIVER_VERSION === 'auto' || merged.DRIVER_VERSION === '') {
            merged.DRIVER_VERSION = ConfigResolver._autoResolveDriverVersion(
                merged.BROWSER || 'chrome',
            );
        }

        _resolvedConfig = merged;
        _resolvedEnv = currentEnv;
        return _resolvedConfig;
    }

    /**
     * Load environment-specific config JSON.
     * @param {string} [env] - Environment name
     * @returns {Object.<string, string>}
     * @private
     */
    static _loadEnvConfig(env) {
        const envName = env || (process.env.TEST_ENV || 'dev').toLowerCase();
        const envFile = path.join(CONFIG_DIR, 'environments', `${envName}.config.json`);
        return ConfigResolver._loadJson(envFile);
    }

    /**
     * Safely load and parse a JSON file. Returns `{}` if not found.
     * @param {string} filePath
     * @returns {Object}
     * @private
     */
    static _loadJson(filePath) {
        try {
            if (!fs.existsSync(filePath)) return {};
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw);
        } catch (err) {
            // Log but don't crash — fallback to empty
            // eslint-disable-next-line no-console
            console.warn(`[ConfigResolver] Failed to load ${filePath}: ${err.message}`);
            return {};
        }
    }

    /**
     * Auto-detect the installed browser version and return it as the driver version string.
     *
     * Detection strategy per browser:
     *   • **Chrome**: `google-chrome --version` (Linux), registry (Windows), `/Applications/...` (macOS)
     *   • **Edge**: `msedge --version` / `microsoft-edge --version`, registry (Windows)
     *   • **Firefox**: `firefox --version`, registry (Windows)
     *
     * If detection fails, returns empty string (caller should handle gracefully).
     *
     * @param {string} browser - Browser name: `'chrome'`, `'MicrosoftEdge'`, `'firefox'`
     * @returns {string} Version string (e.g., `'120.0.6099.71'`) or `''`
     * @private
     */
    static _autoResolveDriverVersion(browser) {
        const browserLower = (browser || 'chrome').toLowerCase();
        const isWindows = process.platform === 'win32';
        const isMac = process.platform === 'darwin';

        const commands = ConfigResolver._getVersionCommands(browserLower, isWindows, isMac);

        for (const cmd of commands) {
            try {
                const output = execSync(cmd, {
                    encoding: 'utf8',
                    timeout: 10000,
                    stdio: ['pipe', 'pipe', 'pipe'],
                }).trim();

                const version = ConfigResolver._extractVersion(output);
                if (version) {
                    // eslint-disable-next-line no-console
                    console.log(`[ConfigResolver] Auto-resolved ${browser} version: ${version}`);
                    return version;
                }
            } catch {
                // Command failed — try next
            }
        }

        // eslint-disable-next-line no-console
        console.warn(
            `[ConfigResolver] Could not auto-resolve version for "${browser}". ` +
            'Set DRIVER_VERSION explicitly or ensure the browser is installed.',
        );
        return '';
    }

    /**
     * Build an ordered list of shell commands to detect browser version.
     * @param {string} browser - Lowercase browser name
     * @param {boolean} isWindows
     * @param {boolean} isMac
     * @returns {string[]}
     * @private
     */
    static _getVersionCommands(browser, isWindows, isMac) {
        switch (browser) {
        case 'chrome':
            if (isWindows) {
                return [
                    'reg query "HKLM\\SOFTWARE\\Google\\Chrome\\BLBeacon" /v version',
                    'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Google\\Chrome\\BLBeacon" /v version',
                    'reg query "HKCU\\SOFTWARE\\Google\\Chrome\\BLBeacon" /v version',
                    '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --version',
                    '"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" --version',
                ];
            }
            if (isMac) {
                return [
                    '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --version',
                    'google-chrome --version',
                ];
            }
            return ['google-chrome --version', 'google-chrome-stable --version', 'chromium --version'];

        case 'microsoftedge':
        case 'edge':
        case 'msedge':
            if (isWindows) {
                return [
                    'reg query "HKLM\\SOFTWARE\\Microsoft\\Edge\\BLBeacon" /v version',
                    'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Edge\\BLBeacon" /v version',
                    'reg query "HKCU\\SOFTWARE\\Microsoft\\Edge\\BLBeacon" /v version',
                    '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" --version',
                    '"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" --version',
                ];
            }
            if (isMac) {
                return [
                    '/Applications/Microsoft\\ Edge.app/Contents/MacOS/Microsoft\\ Edge --version',
                    'microsoft-edge --version',
                ];
            }
            return ['microsoft-edge --version', 'microsoft-edge-stable --version'];

        case 'firefox':
            if (isWindows) {
                return [
                    'reg query "HKLM\\SOFTWARE\\Mozilla\\Mozilla Firefox" /v CurrentVersion',
                    '"C:\\Program Files\\Mozilla Firefox\\firefox.exe" --version',
                    '"C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe" --version',
                ];
            }
            if (isMac) {
                return [
                    '/Applications/Firefox.app/Contents/MacOS/firefox --version',
                    'firefox --version',
                ];
            }
            return ['firefox --version'];

        default:
            return [];
        }
    }

    /**
     * Extract a version number (e.g., `120.0.6099.71`, `131.0`) from
     * free-text command output.
     *
     * @param {string} output - Raw command output
     * @returns {string|null} Matched version or null
     * @private
     */
    static _extractVersion(output) {
        if (!output) return null;

        // Windows registry output: "    version    REG_SZ    120.0.6099.71"
        const regMatch = output.match(/REG_SZ\s+([\d.]+)/i);
        if (regMatch) return regMatch[1];

        // CLI output: "Google Chrome 120.0.6099.71" or "Mozilla Firefox 131.0"
        const versionMatch = output.match(/([\d]+\.[\d]+(?:\.[\d]+)*(?:\.[\d]+)?)/);
        if (versionMatch) return versionMatch[1];

        return null;
    }
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Mask sensitive config values for display/logging.
 * @param {string} key
 * @param {string} value
 * @returns {string}
 * @private
 */
function _maskSensitive(key, value) {
    const SENSITIVE = ['PASSWORD', 'KEY', 'TOKEN', 'SECRET', 'ENCRYPTION'];
    if (SENSITIVE.some((s) => key.toUpperCase().includes(s)) && value) {
        return value.length > 4 ? value.substring(0, 2) + '***' : '***';
    }
    return value;
}

module.exports = { ConfigResolver };
