/**
 * ═══════════════════════════════════════════════════════════════
 * Login Step Definitions
 * ═══════════════════════════════════════════════════════════════
 */

const { Given, When, Then } = require('@wdio/cucumber-framework');
const { expect } = require('chai');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');

// ─── When ─────────────────────────────────────────────────────

When(/^I enter username "([^"]*)"$/, async function (username) {
    await LoginPage.enterUsername(username);
});

When(/^I enter password "([^"]*)"$/, async function (password) {
    await LoginPage.enterPassword(password);
});

When(/^I click the login button$/, async function () {
    await LoginPage.clickLogin();
});

When(/^I login with username "([^"]*)" and password "([^"]*)"$/, async function (username, password) {
    await LoginPage.login(username, password);
});

When(/^I check the remember me checkbox$/, async function () {
    await LoginPage.checkRememberMe();
});

When(/^I click forgot password$/, async function () {
    await LoginPage.clickForgotPassword();
});

// ─── Then ─────────────────────────────────────────────────────

Then(/^I should see a welcome message$/, async function () {
    const text = await HomePage.getWelcomeText();
    expect(text).to.not.be.empty;
});

Then(/^I should see an error message$/, async function () {
    const error = await LoginPage.getErrorMessageText();
    expect(error).to.not.be.empty;
});

Then(/^I should see an error message "([^"]*)"$/, async function (expectedMessage) {
    const error = await LoginPage.getErrorMessageText();
    expect(error).to.include(expectedMessage);
});

Then(/^I should remain on the login page$/, async function () {
    const url = await browser.getUrl();
    expect(url).to.include('/login');
});

Then(/^the login page should be loaded$/, async function () {
    const loaded = await LoginPage.isLoaded();
    expect(loaded).to.be.true;
});
