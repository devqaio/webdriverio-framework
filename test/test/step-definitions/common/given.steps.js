/**
 * ═══════════════════════════════════════════════════════════════
 * Common Step Definitions — Given Steps
 * ═══════════════════════════════════════════════════════════════
 *
 * Reusable "Given" steps shared across all feature files.
 * Project teams can extend these by adding their own step files.
 */

const { Given } = require('@wdio/cucumber-framework');
const { expect } = require('chai');

// ─── Navigation ───────────────────────────────────────────────

Given(/^I am on the (.+) page$/, async function (pageName) {
    const routes = {
        'login': '/login',
        'home': '/',
        'search': '/search',
        'register': '/register',
        'profile': '/profile',
        'settings': '/settings',
    };

    const path = routes[pageName.toLowerCase()];
    if (!path) {
        throw new Error(`Unknown page: "${pageName}". Register it in the common Given steps.`);
    }

    await browser.url(path);
    await browser.waitUntil(
        async () => (await browser.execute(() => document.readyState)) === 'complete',
        { timeout: 30000 },
    );
});

Given(/^I am on the URL "([^"]*)"$/, async function (url) {
    await browser.url(url);
    await browser.waitUntil(
        async () => (await browser.execute(() => document.readyState)) === 'complete',
        { timeout: 30000 },
    );
});

Given(/^I am logged in as "([^"]*)" with password "([^"]*)"$/, async function (username, password) {
    await browser.url('/login');
    await $('[data-testid="username"], #username, input[name="username"]').setValue(username);
    await $('[data-testid="password"], #password, input[name="password"]').setValue(password);
    await $('[data-testid="login-btn"], #login-btn, button[type="submit"]').click();
    await browser.waitUntil(
        async () => (await browser.execute(() => document.readyState)) === 'complete',
        { timeout: 30000 },
    );
});

// ─── Browser State ────────────────────────────────────────────

Given(/^(?:the )?browser cookies are cleared$/, async function () {
    await browser.deleteCookies();
});

Given(/^(?:the )?local storage is cleared$/, async function () {
    await browser.execute(() => localStorage.clear());
});

Given(/^(?:the )?browser window is maximized$/, async function () {
    await browser.maximizeWindow();
});

Given(/^I set the browser window size to (\d+)x(\d+)$/, async function (width, height) {
    await browser.setWindowSize(parseInt(width), parseInt(height));
});
