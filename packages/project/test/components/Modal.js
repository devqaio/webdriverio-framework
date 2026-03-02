/**
 * ═══════════════════════════════════════════════════════════════
 * Modal Component - Reusable Dialog / Modal
 * ═══════════════════════════════════════════════════════════════
 */

const { BaseComponent } = require('@wdio-framework/ui');

class ModalComponent extends BaseComponent {
    constructor(rootSelector = '[data-testid="modal"], .modal, .dialog, [role="dialog"]') {
        super(rootSelector);
    }

    get title() {
        return this.root.$('.modal-title, [data-testid="modal-title"], h2, h3');
    }

    get body() {
        return this.root.$('.modal-body, [data-testid="modal-body"]');
    }

    get closeButton() {
        return this.root.$('.close, [data-testid="modal-close"], button[aria-label="Close"]');
    }

    get confirmButton() {
        return this.root.$('[data-testid="modal-confirm"], .btn-primary, .confirm-btn');
    }

    get cancelButton() {
        return this.root.$('[data-testid="modal-cancel"], .btn-secondary, .cancel-btn');
    }

    get overlay() {
        return $('.modal-overlay, .modal-backdrop, [data-testid="modal-overlay"]');
    }

    async getTitle() {
        return this.getText(this.title);
    }

    async getBodyText() {
        return this.getText(this.body);
    }

    async close() {
        await this.click(this.closeButton);
        await this.waitForNotDisplayed();
    }

    async confirm() {
        await this.click(this.confirmButton);
    }

    async cancel() {
        await this.click(this.cancelButton);
        await this.waitForNotDisplayed();
    }

    async isOpen() {
        return this.isDisplayed();
    }
}

module.exports = new ModalComponent();
