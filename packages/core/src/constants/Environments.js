/**
 * ═══════════════════════════════════════════════════════════════
 * Environments - Environment Configuration Constants
 * ═══════════════════════════════════════════════════════════════
 *
 * Uses {@link ConfigResolver} for three-tier precedence:
 *   env_var > env_config > default config
 */

const { ConfigResolver } = require('../utils/ConfigResolver');

const Environments = Object.freeze({
    DEV: {
        name: 'dev',
        get baseUrl() { return ConfigResolver.get('BASE_URL', 'https://dev.example.com'); },
        get apiUrl() { return ConfigResolver.get('API_BASE_URL', 'https://api.dev.example.com'); },
    },
    STAGING: {
        name: 'staging',
        get baseUrl() { return ConfigResolver.get('BASE_URL', 'https://staging.example.com'); },
        get apiUrl() { return ConfigResolver.get('API_BASE_URL', 'https://api.staging.example.com'); },
    },
    PROD: {
        name: 'prod',
        get baseUrl() { return ConfigResolver.get('BASE_URL', 'https://www.example.com'); },
        get apiUrl() { return ConfigResolver.get('API_BASE_URL', 'https://api.example.com'); },
    },
});

/**
 * Resolve the active environment config from the TEST_ENV env variable.
 */
function getEnvironment() {
    const envName = ConfigResolver.getEnv();
    const envConfig = Object.values(Environments).find((e) => e.name === envName);
    if (!envConfig) {
        throw new Error(`Unknown environment: "${envName}". Valid values: ${Object.values(Environments).map((e) => e.name).join(', ')}`);
    }
    return envConfig;
}

module.exports = { Environments, getEnvironment };
