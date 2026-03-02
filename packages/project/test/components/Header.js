/**
 * ═══════════════════════════════════════════════════════════════
 * Header Component - Reusable Navigation Header
 * ═══════════════════════════════════════════════════════════════
 */

const { BaseComponent } = require('@wdio-framework/ui');

class HeaderComponent extends BaseComponent {
    constructor() {
        super('header, [data-testid="header"], .site-header, #header');
    }

    get logo() {
        return this.root.$('.logo, [data-testid="logo"], img[alt*="logo"]');
    }

    get navigationMenu() {
        return this.root.$$('nav a, .nav-item, [data-testid="nav-item"]');
    }

    get searchIcon() {
        return this.root.$('[data-testid="search-icon"], .search-icon');
    }

    get userAvatar() {
        return this.root.$('[data-testid="user-avatar"], .user-avatar, .profile-icon');
    }

    async clickLogo() {
        await this.click(this.logo);
    }

    async getNavigationItems() {
        const items = await this.navigationMenu;
        const texts = [];
        for (const item of items) {
            texts.push(await item.getText());
        }
        return texts;
    }

    async navigateTo(linkText) {
        const items = await this.navigationMenu;
        for (const item of items) {
            const text = await item.getText();
            if (text.trim() === linkText) {
                await item.click();
                return;
            }
        }
        throw new Error(`Navigation item "${linkText}" not found in header`);
    }
}

module.exports = new HeaderComponent();
