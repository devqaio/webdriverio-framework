/**
 * ═══════════════════════════════════════════════════════════════
 * Common Step Definitions — Then Steps
 * ═══════════════════════════════════════════════════════════════
 *
 * Reusable "Then" (assertion) steps shared across all features.
 */

const { Then } = require('@wdio/cucumber-framework');
const { expect } = require('chai');

// ─── Page Assertions ──────────────────────────────────────────

Then(/^the page title should (?:be|contain) "([^"]*)"$/, async function (expectedTitle) {
    const title = await browser.getTitle();
    expect(title).to.include(expectedTitle);
});

Then(/^the URL should contain "([^"]*)"$/, async function (partialUrl) {
    await browser.waitUntil(
        async () => (await browser.getUrl()).includes(partialUrl),
        { timeout: 15000, timeoutMsg: `URL did not contain "${partialUrl}"` },
    );
});

Then(/^the URL should be "([^"]*)"$/, async function (expectedUrl) {
    const currentUrl = await browser.getUrl();
    expect(currentUrl).to.equal(expectedUrl);
});

Then(/^I should be redirected to the (.+) page$/, async function (pageName) {
    const routes = {
        'login': '/login',
        'home': '/',
        'search': '/search',
        'register': '/register',
        'profile': '/profile',
    };

    const path = routes[pageName.toLowerCase()];
    if (path) {
        await browser.waitUntil(
            async () => (await browser.getUrl()).includes(path),
            { timeout: 15000, timeoutMsg: `Was not redirected to ${pageName} page` },
        );
    }
});

// ─── Element Visibility ──────────────────────────────────────

Then(/^(?:the )?"([^"]*)"(?: element)? should be visible$/, async function (identifier) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}, .${identifier}`);
    await el.waitForDisplayed({ timeout: 10000 });
    expect(await el.isDisplayed()).to.be.true;
});

Then(/^(?:the )?"([^"]*)"(?: element)? should not be visible$/, async function (identifier) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}, .${identifier}`);
    const isDisplayed = await el.isDisplayed().catch(() => false);
    expect(isDisplayed).to.be.false;
});

Then(/^(?:the )?"([^"]*)"(?: element)? should exist$/, async function (identifier) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}`);
    expect(await el.isExisting()).to.be.true;
});

Then(/^(?:the )?"([^"]*)"(?: element)? should not exist$/, async function (identifier) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}`);
    const exists = await el.isExisting().catch(() => false);
    expect(exists).to.be.false;
});

// ─── Text Assertions ─────────────────────────────────────────

Then(/^(?:the )?"([^"]*)"(?: element)? should contain (?:the )?text "([^"]*)"$/, async function (identifier, expectedText) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}, .${identifier}`);
    await el.waitForDisplayed({ timeout: 10000 });
    const text = await el.getText();
    expect(text).to.include(expectedText);
});

Then(/^(?:the )?"([^"]*)"(?: element)? text should be "([^"]*)"$/, async function (identifier, expectedText) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}, .${identifier}`);
    await el.waitForDisplayed({ timeout: 10000 });
    const text = await el.getText();
    expect(text.trim()).to.equal(expectedText);
});

Then(/^I should see (?:the )?text "([^"]*)"$/, async function (text) {
    const el = await $(`//*[contains(text(),"${text}")]`);
    await el.waitForDisplayed({ timeout: 10000, timeoutMsg: `Text "${text}" not found on page` });
});

Then(/^I should not see (?:the )?text "([^"]*)"$/, async function (text) {
    const pageSource = await browser.getPageSource();
    expect(pageSource).to.not.include(text);
});

// ─── Input Value Assertions ──────────────────────────────────

Then(/^(?:the )?"([^"]*)"(?: field| input)? value should be "([^"]*)"$/, async function (field, expectedValue) {
    const el = await $(`[data-testid="${field}"], #${field}, input[name="${field}"]`);
    const value = await el.getValue();
    expect(value).to.equal(expectedValue);
});

// ─── State Assertions ────────────────────────────────────────

Then(/^(?:the )?"([^"]*)"(?: element)? should be (enabled|disabled)$/, async function (identifier, state) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}`);
    const isEnabled = await el.isEnabled();
    expect(isEnabled).to.equal(state === 'enabled');
});

Then(/^(?:the )?"([^"]*)"(?: checkbox)? should be (checked|unchecked)$/, async function (identifier, state) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}, input[name="${identifier}"]`);
    const isSelected = await el.isSelected();
    expect(isSelected).to.equal(state === 'checked');
});

// ─── Count Assertions ────────────────────────────────────────

Then(/^I should see (\d+) "([^"]*)" element(?:s)?$/, async function (count, selector) {
    const elements = await $$(`[data-testid="${selector}"], .${selector}`);
    expect(elements.length).to.equal(parseInt(count));
});

Then(/^I should see at least (\d+) "([^"]*)" element(?:s)?$/, async function (count, selector) {
    await browser.waitUntil(
        async () => {
            const elements = await $$(`[data-testid="${selector}"], .${selector}`);
            return elements.length >= parseInt(count);
        },
        { timeout: 15000 },
    );
});

// ─── Alert Assertions ────────────────────────────────────────

Then(/^I should see an alert with text "([^"]*)"$/, async function (text) {
    const alertText = await browser.getAlertText();
    expect(alertText).to.include(text);
});

// ─── Attribute Assertions ────────────────────────────────────

Then(/^(?:the )?"([^"]*)"(?: element)? should have attribute "([^"]*)" with value "([^"]*)"$/, async function (identifier, attr, value) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}`);
    const attrValue = await el.getAttribute(attr);
    expect(attrValue).to.equal(value);
});

Then(/^(?:the )?"([^"]*)"(?: element)? should have class "([^"]*)"$/, async function (identifier, className) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}`);
    const classes = await el.getAttribute('class');
    expect(classes).to.include(className);
});
