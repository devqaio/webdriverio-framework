/**
 * ═══════════════════════════════════════════════════════════════
 * ApiHelper - REST API Testing Support
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides a simple, chainable HTTP client built on top of axios
 * for API-level validation, test-data seeding, and hybrid
 * UI + API testing patterns.
 */

const axios = require('axios');
const { Logger } = require('../utils/Logger');

class ApiHelper {
    constructor(baseURL, defaultHeaders = {}) {
        this.logger = Logger.getInstance('ApiHelper');
        this.client = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...defaultHeaders,
            },
            validateStatus: () => true, // never throw on HTTP status
        });

        // Request / response interceptors for logging and timing
        this.client.interceptors.request.use((config) => {
            config.metadata = { startTime: Date.now() };
            this.logger.debug(`→ ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
            return config;
        });

        this.client.interceptors.response.use((response) => {
            const duration = response.config.metadata
                ? Date.now() - response.config.metadata.startTime
                : 0;
            response.duration = duration;
            this.logger.debug(`← ${response.status} ${response.statusText} (${duration}ms)`);
            return response;
        });
    }

    // ─── Core HTTP Methods ────────────────────────────────────

    async get(url, params = {}, headers = {}) {
        const response = await this.client.get(url, { params, headers });
        return this._wrapResponse(response);
    }

    async post(url, data = {}, headers = {}) {
        const response = await this.client.post(url, data, { headers });
        return this._wrapResponse(response);
    }

    async put(url, data = {}, headers = {}) {
        const response = await this.client.put(url, data, { headers });
        return this._wrapResponse(response);
    }

    async patch(url, data = {}, headers = {}) {
        const response = await this.client.patch(url, data, { headers });
        return this._wrapResponse(response);
    }

    async delete(url, headers = {}) {
        const response = await this.client.delete(url, { headers });
        return this._wrapResponse(response);
    }

    // ─── Authentication Helpers ───────────────────────────────

    /**
     * Set a bearer token that will be sent with every subsequent request.
     */
    setBearerToken(token) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        this.logger.info('Bearer token set');
    }

    /**
     * Set basic auth credentials.
     */
    setBasicAuth(username, password) {
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        this.client.defaults.headers.common['Authorization'] = `Basic ${encoded}`;
        this.logger.info('Basic auth set');
    }

    /**
     * Set a custom header for all subsequent requests.
     */
    setHeader(key, value) {
        this.client.defaults.headers.common[key] = value;
    }

    /**
     * Clear the Authorization header.
     */
    clearAuth() {
        delete this.client.defaults.headers.common['Authorization'];
    }

    // ─── GraphQL ──────────────────────────────────────────────

    async graphql(url, query, variables = {}, headers = {}) {
        return this.post(url, { query, variables }, headers);
    }

    // ─── File Upload ──────────────────────────────────────────

    async uploadFile(url, filePath, fieldName = 'file', additionalData = {}) {
        const FormData = require('form-data');
        const fs = require('fs');
        const form = new FormData();
        form.append(fieldName, fs.createReadStream(filePath));
        Object.entries(additionalData).forEach(([key, value]) => form.append(key, value));

        const response = await this.client.post(url, form, {
            headers: form.getHeaders(),
        });
        return this._wrapResponse(response);
    }

    // ─── Polling / Wait ───────────────────────────────────────

    /**
     * Poll an endpoint until a condition function returns true.
     */
    async pollUntil(url, conditionFn, { interval = 2000, timeout = 30000, method = 'get' } = {}) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const response = await this[method](url);
            if (conditionFn(response)) {
                return response;
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        throw new Error(`Polling timed out after ${timeout}ms for ${url}`);
    }

    // ─── Helpers ──────────────────────────────────────────────

    _wrapResponse(response) {
        return {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
            duration: response.duration || 0,

            // Convenience assertions
            isSuccess: () => response.status >= 200 && response.status < 300,
            isClientError: () => response.status >= 400 && response.status < 500,
            isServerError: () => response.status >= 500,
        };
    }

    // ─── Factory ──────────────────────────────────────────────

    static create(baseURL, defaultHeaders = {}) {
        return new ApiHelper(baseURL, defaultHeaders);
    }
}

module.exports = { ApiHelper };
