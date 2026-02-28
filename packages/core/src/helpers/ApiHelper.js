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
const { RetryHandler } = require('../utils/RetryHandler');

/**
 * @class ApiHelper
 * @description HTTP client wrapper built on axios with built-in retry support, request/response
 * logging, and convenience methods for authentication, GraphQL, file uploads, and endpoint
 * polling. Instances can be created via the constructor or the static {@link ApiHelper.create}
 * factory method. Every response is normalised into a standard envelope with `status`, `data`,
 * `headers`, `duration`, and assertion helpers (`isSuccess()`, `isClientError()`, `isServerError()`).
 *
 * @example
 * const { ApiHelper } = require('./helpers/ApiHelper');
 *
 * // Create a client and authenticate
 * const api = ApiHelper.create('https://api.example.com');
 * api.setBearerToken('eyJhbGciOi...');
 *
 * // Perform CRUD operations
 * const users = await api.get('/users', { page: 1 });
 * const created = await api.post('/users', { name: 'Alice', role: 'admin' });
 * console.log(created.status, created.data.id);
 */
class ApiHelper {
    /**
     * Create a new ApiHelper instance configured with a base URL and optional default headers.
     * Registers request/response interceptors for logging and timing.
     *
     * @param {string} baseURL - The base URL for all requests (e.g., `'https://api.example.com'`).
     * @param {Object} [defaultHeaders={}] - Default headers merged into every request.
     *
     * @example
     * const api = new ApiHelper('https://api.example.com', {
     *     'X-API-Key': 'my-key'
     * });
     */
    constructor(baseURL, defaultHeaders = {}) {
        this.logger = Logger.getInstance('ApiHelper');
        this.retryConfig = { maxAttempts: 1, delay: 1000 };
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

    /**
     * Enable automatic retries for transient HTTP failures (5xx status codes and
     * network errors such as `ECONNRESET` / `ETIMEDOUT`). When enabled, every HTTP
     * method will retry up to `maxAttempts` times with the specified delay between
     * attempts.
     *
     * @param {Object} [config={}] - Retry configuration options.
     * @param {number} [config.maxAttempts=3] - Maximum number of request attempts.
     * @param {number} [config.delay=1000] - Delay in milliseconds between retry attempts.
     * @returns {ApiHelper} The current instance for method chaining.
     *
     * @example
     * const api = ApiHelper.create('https://api.example.com');
     * api.enableRetry({ maxAttempts: 5, delay: 2000 });
     * const response = await api.get('/unstable-endpoint');
     */
    enableRetry({ maxAttempts = 3, delay = 1000 } = {}) {
        this.retryConfig = { maxAttempts, delay };
        this.logger.info(`API retry enabled: ${maxAttempts} attempt(s), ${delay}ms delay`);
        return this;
    }

    // ─── Core HTTP Methods ────────────────────────────────────

    /**
     * Send an HTTP GET request.
     *
     * @param {string} url - The request URL path (appended to the base URL).
     * @param {Object} [params={}] - Query string parameters as key-value pairs.
     * @param {Object} [headers={}] - Additional request headers.
     * @returns {Promise.<Object>} A normalised response object with `status`, `statusText`,
     *   `headers`, `data`, `duration`, and convenience assertion methods `isSuccess()`,
     *   `isClientError()`, and `isServerError()`.
     * @throws {Error} If retries are enabled and all attempts fail due to network or
     *   server errors.
     *
     * @example
     * const response = await api.get('/users', { page: 2, limit: 10 });
     * console.log(response.status); // 200
     * console.log(response.data);   // [{ id: 1, name: 'Alice' }, ...]
     */
    async get(url, params = {}, headers = {}) {
        return this._withRetry(() => this.client.get(url, { params, headers }));
    }

    /**
     * Send an HTTP POST request.
     *
     * @param {string} url - The request URL path (appended to the base URL).
     * @param {Object} [data={}] - The request body payload.
     * @param {Object} [headers={}] - Additional request headers.
     * @returns {Promise.<Object>} A normalised response object.
     * @throws {Error} If retries are enabled and all attempts fail.
     *
     * @example
     * const response = await api.post('/users', { name: 'Bob', email: 'bob@test.com' });
     * console.log(response.data.id); // newly created user ID
     */
    async post(url, data = {}, headers = {}) {
        return this._withRetry(() => this.client.post(url, data, { headers }));
    }

    /**
     * Send an HTTP PUT request to fully replace a resource.
     *
     * @param {string} url - The request URL path (appended to the base URL).
     * @param {Object} [data={}] - The request body payload.
     * @param {Object} [headers={}] - Additional request headers.
     * @returns {Promise.<Object>} A normalised response object.
     * @throws {Error} If retries are enabled and all attempts fail.
     *
     * @example
     * const response = await api.put('/users/42', { name: 'Bob Updated', email: 'bob@test.com' });
     * console.log(response.isSuccess()); // true
     */
    async put(url, data = {}, headers = {}) {
        return this._withRetry(() => this.client.put(url, data, { headers }));
    }

    /**
     * Send an HTTP PATCH request to partially update a resource.
     *
     * @param {string} url - The request URL path (appended to the base URL).
     * @param {Object} [data={}] - The partial update payload.
     * @param {Object} [headers={}] - Additional request headers.
     * @returns {Promise.<Object>} A normalised response object.
     * @throws {Error} If retries are enabled and all attempts fail.
     *
     * @example
     * const response = await api.patch('/users/42', { role: 'admin' });
     * console.log(response.data.role); // 'admin'
     */
    async patch(url, data = {}, headers = {}) {
        return this._withRetry(() => this.client.patch(url, data, { headers }));
    }

    /**
     * Send an HTTP DELETE request.
     *
     * @param {string} url - The request URL path (appended to the base URL).
     * @param {Object} [headers={}] - Additional request headers.
     * @returns {Promise.<Object>} A normalised response object.
     * @throws {Error} If retries are enabled and all attempts fail.
     *
     * @example
     * const response = await api.delete('/users/42');
     * console.log(response.status); // 204
     */
    async delete(url, headers = {}) {
        return this._withRetry(() => this.client.delete(url, { headers }));
    }

    // ─── Authentication Helpers ───────────────────────────────

    /**
     * Set a Bearer token in the `Authorization` header for all subsequent requests.
     *
     * @param {string} token - The bearer token value (without the `Bearer ` prefix).
     * @returns {void}
     *
     * @example
     * api.setBearerToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
     * const response = await api.get('/protected/resource');
     */
    setBearerToken(token) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        this.logger.info('Bearer token set');
    }

    /**
     * Set HTTP Basic Authentication credentials. The username and password are
     * Base64-encoded and sent in the `Authorization` header for all subsequent requests.
     *
     * @param {string} username - The Basic Auth username.
     * @param {string} password - The Basic Auth password.
     * @returns {void}
     *
     * @example
     * api.setBasicAuth('admin', 's3cur3P@ss');
     * const response = await api.get('/admin/dashboard');
     */
    setBasicAuth(username, password) {
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        this.client.defaults.headers.common['Authorization'] = `Basic ${encoded}`;
        this.logger.info('Basic auth set');
    }

    /**
     * Set a custom default header that will be included in all subsequent requests.
     *
     * @param {string} key - The header name (e.g., `'X-Custom-Header'`).
     * @param {string} value - The header value.
     * @returns {void}
     *
     * @example
     * api.setHeader('X-Request-ID', 'test-run-001');
     * api.setHeader('Accept-Language', 'en-US');
     */
    setHeader(key, value) {
        this.client.defaults.headers.common[key] = value;
    }

    /**
     * Remove the `Authorization` header, clearing any previously set Bearer token or
     * Basic Auth credentials from subsequent requests.
     *
     * @returns {void}
     *
     * @example
     * api.setBearerToken('my-token');
     * await api.get('/protected/resource');
     *
     * api.clearAuth();
     * await api.get('/public/resource'); // no Authorization header
     */
    clearAuth() {
        delete this.client.defaults.headers.common['Authorization'];
    }

    // ─── GraphQL ──────────────────────────────────────────────

    /**
     * Send a GraphQL query or mutation via an HTTP POST request. The `query` and
     * `variables` are sent in the request body as `{ query, variables }`.
     *
     * @param {string} url - The GraphQL endpoint path (appended to the base URL).
     * @param {string} query - The GraphQL query or mutation string.
     * @param {Object} [variables={}] - Variables to pass with the GraphQL operation.
     * @param {Object} [headers={}] - Additional request headers.
     * @returns {Promise.<Object>} A normalised response object containing the GraphQL
     *   response in `data`.
     * @throws {Error} If retries are enabled and all attempts fail.
     *
     * @example
     * const response = await api.graphql('/graphql', `
     *     query GetUser($id: ID!) {
     *         user(id: $id) { name email }
     *     }
     * `, { id: '42' });
     * console.log(response.data.data.user.name); // 'Alice'
     */
    async graphql(url, query, variables = {}, headers = {}) {
        return this.post(url, { query, variables }, headers);
    }

    // ─── File Upload ──────────────────────────────────────────

    /**
     * Upload a file using a multipart `form-data` POST request. Requires the
     * `form-data` npm package to be installed.
     *
     * @param {string} url - The upload endpoint path (appended to the base URL).
     * @param {string} filePath - Absolute or relative path to the file to upload.
     * @param {string} [fieldName='file'] - The form field name for the file.
     * @param {Object} [additionalData={}] - Extra key-value pairs to include as
     *   additional form fields.
     * @returns {Promise.<Object>} A normalised response object.
     * @throws {Error} If the `form-data` package is not installed.
     * @throws {Error} If the file does not exist or the upload fails.
     *
     * @example
     * const response = await api.uploadFile(
     *     '/documents/upload',
     *     './test/data/sample.pdf',
     *     'document',
     *     { category: 'reports', description: 'Monthly report' }
     * );
     * console.log(response.data.fileId);
     */
    async uploadFile(url, filePath, fieldName = 'file', additionalData = {}) {
        let FormData;
        try {
            FormData = require('form-data');
        } catch {
            throw new Error(
                'Package "form-data" is required for file uploads. Install it: npm install form-data',
            );
        }
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
     * Repeatedly poll an endpoint until a user-supplied condition function returns
     * `true`, or the timeout is reached. Useful for waiting on asynchronous
     * server-side operations such as job completion or status transitions.
     *
     * @param {string} url - The endpoint path to poll (appended to the base URL).
     * @param {function(Object): boolean} conditionFn - A callback that receives the
     *   normalised response object and returns `true` when the desired condition is met.
     * @param {Object} [options={}] - Polling configuration options.
     * @param {number} [options.interval=2000] - Delay in milliseconds between poll requests.
     * @param {number} [options.timeout=30000] - Maximum time in milliseconds to wait for
     *   the condition to be satisfied.
     * @param {string} [options.method='get'] - The HTTP method to use for polling
     *   (e.g., `'get'`, `'post'`).
     * @returns {Promise.<Object>} The normalised response from the first request where
     *   `conditionFn` returned `true`.
     * @throws {Error} If the condition is not met within the timeout period.
     *
     * @example
     * // Wait for a background job to complete
     * const response = await api.pollUntil(
     *     '/jobs/123',
     *     (res) => res.data.status === 'completed',
     *     { interval: 3000, timeout: 60000 }
     * );
     * console.log(response.data.result);
     *
     * @example
     * // Poll until a resource exists (status 200)
     * const response = await api.pollUntil(
     *     '/reports/latest',
     *     (res) => res.isSuccess()
     * );
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

    /**
     * Execute an HTTP call with optional retry logic for transient failures.
     * @private
     */
    async _withRetry(requestFn) {
        const { maxAttempts, delay } = this.retryConfig;
        if (maxAttempts <= 1) {
            const response = await requestFn();
            return this._wrapResponse(response);
        }

        return RetryHandler.retry(
            async () => {
                const response = await requestFn();
                // Treat 5xx as retryable transient errors
                if (response.status >= 500) {
                    throw new Error(`Server error: HTTP ${response.status}`);
                }
                return this._wrapResponse(response);
            },
            {
                maxAttempts,
                delay,
                shouldRetry: (err) => {
                    // Retry on network errors and 5xx
                    return err.code === 'ECONNRESET'
                        || err.code === 'ETIMEDOUT'
                        || err.message.includes('Server error');
                },
            },
        );
    }

    /**
     * Normalise an axios response into a standard envelope with convenience assertion
     * methods.
     * @private
     * @param {Object} response - The raw axios response object.
     * @returns {Object} Normalised response with `status`, `statusText`, `headers`,
     *   `data`, `duration`, `isSuccess()`, `isClientError()`, and `isServerError()`.
     */
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

    /**
     * Static factory method to create a new {@link ApiHelper} instance.
     *
     * @param {string} baseURL - The base URL for all requests (e.g., `'https://api.example.com'`).
     * @param {Object} [defaultHeaders={}] - Default headers merged into every request.
     * @returns {ApiHelper} A new ApiHelper instance.
     *
     * @example
     * const api = ApiHelper.create('https://api.example.com', {
     *     'X-API-Key': 'secret-key'
     * });
     * const users = await api.get('/users');
     */
    static create(baseURL, defaultHeaders = {}) {
        return new ApiHelper(baseURL, defaultHeaders);
    }
}

module.exports = { ApiHelper };
