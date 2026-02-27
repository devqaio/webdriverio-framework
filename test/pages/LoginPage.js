/**
 * ═══════════════════════════════════════════════════════════════
 * LoginPage - Sample Page Object
 * ═══════════════════════════════════════════════════════════════
 *
 * Demonstrates how to build a Page Object on top of BasePage.
 * Replace selectors with those from your actual application.
 */

const { BasePage } = require('../../src/core/BasePage');

class LoginPage extends BasePage {
    /** @override – relative URL used by this.open() */
    get url() {
        return '/login';
    }

    // ─── Element Getters ──────────────────────────────────────

    get usernameInput() {
        return $('[data-testid="username"], #username, input[name="username"]');
    }

    get passwordInput() {
        return $('[data-testid="password"], #password, input[name="password"]');
    }

    get loginButton() {
        return $('[data-testid="login-btn"], #login-btn, button[type="submit"]');
    }

    get errorMessage() {
        return $('[data-testid="error-msg"], .error-message, .alert-danger');
    }

    get rememberMeCheckbox() {
        return $('[data-testid="remember-me"], #remember-me, input[name="remember"]');
    }

    get forgotPasswordLink() {
        return $('[data-testid="forgot-password"], a[href*="forgot"]');
    }

    // ─── Page Actions ─────────────────────────────────────────

    /**
     * Perform a full login flow.
     */
    async login(username, password) {
        this.logger.info(`Logging in as: ${username}`);
        await this.setValue(this.usernameInput, username);
        await this.setValue(this.passwordInput, password);
        await this.click(this.loginButton);
        await this.waitForPageLoad();
    }

    /**
     * Enter username only.
     */
    async enterUsername(username) {
        await this.setValue(this.usernameInput, username);
    }

    /**
     * Enter password only.
     */
    async enterPassword(password) {
        await this.setValue(this.passwordInput, password);
    }

    /**
     * Click the login / submit button.
     */
    async clickLogin() {
        await this.click(this.loginButton);
    }

    /**
     * Get the error message text (if visible).
     */
    async getErrorMessageText() {
        const displayed = await this.isDisplayed(this.errorMessage);
        if (!displayed) return '';
        return this.getText(this.errorMessage);
    }

    /**
     * Check the "Remember Me" checkbox.
     */
    async checkRememberMe() {
        const selected = await this.isSelected(this.rememberMeCheckbox);
        if (!selected) {
            await this.click(this.rememberMeCheckbox);
        }
    }

    /**
     * Click the "Forgot Password" link.
     */
    async clickForgotPassword() {
        await this.click(this.forgotPasswordLink);
    }

    /**
     * Verify the login page is fully loaded and visible.
     */
    async isLoaded() {
        await this.waitForDisplayed(this.usernameInput);
        await this.waitForDisplayed(this.passwordInput);
        await this.waitForDisplayed(this.loginButton);
        return true;
    }
}

module.exports = new LoginPage();
