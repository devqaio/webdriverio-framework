/**
 * ═══════════════════════════════════════════════════════════════
 * Footer Component - Reusable Site Footer
 * ═══════════════════════════════════════════════════════════════
 */

const { BaseComponent } = require('@wdio-framework/ui');

class FooterComponent extends BaseComponent {
    constructor() {
        super('footer, [data-testid="footer"], .site-footer, #footer');
    }

    get copyrightText() {
        return this.root.$('.copyright, [data-testid="copyright"]');
    }

    get footerLinks() {
        return this.root.$$('a');
    }

    async getCopyrightText() {
        return this.getText(this.copyrightText);
    }

    async getFooterLinkTexts() {
        const links = await this.footerLinks;
        const texts = [];
        for (const link of links) {
            texts.push(await link.getText());
        }
        return texts;
    }

    async clickFooterLink(linkText) {
        const links = await this.footerLinks;
        for (const link of links) {
            const text = await link.getText();
            if (text.trim() === linkText) {
                await link.click();
                return;
            }
        }
        throw new Error(`Footer link "${linkText}" not found`);
    }
}

module.exports = new FooterComponent();
