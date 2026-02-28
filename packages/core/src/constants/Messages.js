/**
 * ═══════════════════════════════════════════════════════════════
 * Messages - Reusable Assertion / UI Messages
 * ═══════════════════════════════════════════════════════════════
 */

const Messages = Object.freeze({
    // Generic
    PAGE_NOT_LOADED: 'Expected page did not load within the timeout',
    ELEMENT_NOT_FOUND: 'Element was not found on the page',
    ELEMENT_NOT_VISIBLE: 'Element is not visible on the page',
    ELEMENT_NOT_CLICKABLE: 'Element is not clickable',

    // Authentication
    LOGIN_SUCCESS: 'User logged in successfully',
    LOGIN_FAILED: 'Login failed — invalid credentials or unexpected error',
    LOGOUT_SUCCESS: 'User logged out successfully',

    // Validation
    FIELD_REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',

    // API
    API_REQUEST_FAILED: 'API request failed',
    API_TIMEOUT: 'API request timed out',

    // Custom assertion template
    expected: (actual, expected) => `Expected "${expected}" but got "${actual}"`,
    contains: (actual, substring) => `Expected "${actual}" to contain "${substring}"`,
});

module.exports = { Messages };
