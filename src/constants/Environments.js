/**
 * ═══════════════════════════════════════════════════════════════
 * Environments - Environment Configuration Constants
 * ═══════════════════════════════════════════════════════════════
 */

const Environments = Object.freeze({
    DEV: {
        name: 'dev',
        baseUrl: process.env.BASE_URL_DEV || 'https://dev.example.com',
        apiUrl: process.env.API_URL_DEV || 'https://api.dev.example.com',
    },
    STAGING: {
        name: 'staging',
        baseUrl: process.env.BASE_URL_STAGING || 'https://staging.example.com',
        apiUrl: process.env.API_URL_STAGING || 'https://api.staging.example.com',
    },
    PROD: {
        name: 'prod',
        baseUrl: process.env.BASE_URL_PROD || 'https://www.example.com',
        apiUrl: process.env.API_URL_PROD || 'https://api.example.com',
    },
});

/**
 * Resolve the active environment config from the TEST_ENV env variable.
 */
function getEnvironment() {
    const envName = (process.env.TEST_ENV || 'dev').toLowerCase();
    const envConfig = Object.values(Environments).find((e) => e.name === envName);
    if (!envConfig) {
        throw new Error(`Unknown environment: "${envName}". Valid values: ${Object.values(Environments).map((e) => e.name).join(', ')}`);
    }
    return envConfig;
}

module.exports = { Environments, getEnvironment };
