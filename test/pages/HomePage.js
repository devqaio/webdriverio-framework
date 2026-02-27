/**
 * ═══════════════════════════════════════════════════════════════
 * HomePage - Sample Page Object
 * ═══════════════════════════════════════════════════════════════
 */

const { BasePage } = require('../../src/core/BasePage');

class HomePage extends BasePage {
    get url() {
        return '/';
    }

    // ─── Element Getters ──────────────────────────────────────

    get welcomeMessage() {
        return $('[data-testid="welcome-msg"], .welcome-message, h1');
    }

    get searchInput() {
        return $('[data-testid="search-input"], #search, input[type="search"], input[name="search"]');
    }

    get searchButton() {
        return $('[data-testid="search-btn"], #search-btn, button[type="submit"]');
    }

    get userProfileMenu() {
        return $('[data-testid="user-menu"], .user-profile, .user-menu');
    }

    get logoutButton() {
        return $('[data-testid="logout-btn"], #logout, a[href*="logout"]');
    }

    get navigationLinks() {
        return $$('nav a, .nav-link, [data-testid="nav-link"]');
    }

    // ─── Page Actions ─────────────────────────────────────────

    async getWelcomeText() {
        return this.getText(this.welcomeMessage);
    }

    async search(query) {
        this.logger.info(`Searching for: ${query}`);
        await this.setValue(this.searchInput, query);
        await this.click(this.searchButton);
        await this.waitForPageLoad();
    }

    async openUserMenu() {
        await this.click(this.userProfileMenu);
    }

    async logout() {
        this.logger.info('Logging out');
        await this.openUserMenu();
        await this.click(this.logoutButton);
        await this.waitForPageLoad();
    }

    async getNavigationLinkTexts() {
        const links = await this.navigationLinks;
        const texts = [];
        for (const link of links) {
            texts.push(await link.getText());
        }
        return texts;
    }

    async clickNavigationLink(linkText) {
        const links = await this.navigationLinks;
        for (const link of links) {
            const text = await link.getText();
            if (text.trim() === linkText) {
                await link.click();
                await this.waitForPageLoad();
                return;
            }
        }
        throw new Error(`Navigation link "${linkText}" not found`);
    }

    async isLoaded() {
        await this.waitForDisplayed(this.welcomeMessage);
        return true;
    }
}

module.exports = new HomePage();
