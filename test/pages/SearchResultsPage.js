/**
 * ═══════════════════════════════════════════════════════════════
 * SearchResultsPage - Sample Page Object
 * ═══════════════════════════════════════════════════════════════
 */

const { BasePage } = require('../../src/core/BasePage');

class SearchResultsPage extends BasePage {
    get url() {
        return '/search';
    }

    // ─── Element Getters ──────────────────────────────────────

    get searchResults() {
        return $$('[data-testid="search-result"], .search-result, .result-item');
    }

    get resultCount() {
        return $('[data-testid="result-count"], .result-count, .search-summary');
    }

    get noResultsMessage() {
        return $('[data-testid="no-results"], .no-results');
    }

    get filterSection() {
        return $('[data-testid="filters"], .filter-section, .sidebar-filters');
    }

    get sortDropdown() {
        return $('[data-testid="sort-by"], #sort-by, select[name="sort"]');
    }

    get paginationNext() {
        return $('[data-testid="next-page"], .next-page, a[rel="next"]');
    }

    get paginationPrevious() {
        return $('[data-testid="prev-page"], .prev-page, a[rel="prev"]');
    }

    // ─── Page Actions ─────────────────────────────────────────

    async getResultCount() {
        const results = await this.searchResults;
        return results.length;
    }

    async getResultTitles() {
        const results = await this.searchResults;
        const titles = [];
        for (const result of results) {
            const titleEl = await result.$('h2, h3, .title, [data-testid="result-title"]');
            titles.push(await titleEl.getText());
        }
        return titles;
    }

    async clickResultByIndex(index) {
        const results = await this.searchResults;
        if (index >= results.length) {
            throw new Error(`Result index ${index} is out of bounds (total: ${results.length})`);
        }
        await results[index].click();
        await this.waitForPageLoad();
    }

    async getResultCountText() {
        return this.getText(this.resultCount);
    }

    async isNoResultsDisplayed() {
        return this.isDisplayed(this.noResultsMessage);
    }

    async sortBy(option) {
        await this.selectByVisibleText(this.sortDropdown, option);
        await this.waitForPageLoad();
    }

    async goToNextPage() {
        await this.click(this.paginationNext);
        await this.waitForPageLoad();
    }

    async goToPreviousPage() {
        await this.click(this.paginationPrevious);
        await this.waitForPageLoad();
    }

    async isLoaded() {
        // Wait for either results or no-results message
        await browser.waitUntil(
            async () => {
                const hasResults = await this.isDisplayed(this.searchResults[0]);
                const hasNoResults = await this.isDisplayed(this.noResultsMessage);
                return hasResults || hasNoResults;
            },
            { timeout: 15000, timeoutMsg: 'Search results page did not load' },
        );
        return true;
    }
}

module.exports = new SearchResultsPage();
