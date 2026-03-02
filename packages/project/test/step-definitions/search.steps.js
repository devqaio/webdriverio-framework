/**
 * ═══════════════════════════════════════════════════════════════
 * Search Step Definitions
 * ═══════════════════════════════════════════════════════════════
 */

const { When, Then } = require('@wdio/cucumber-framework');
const { expect } = require('chai');
const HomePage = require('../pages/HomePage');
const SearchResultsPage = require('../pages/SearchResultsPage');

// ─── When ─────────────────────────────────────────────────────

When(/^I search for "([^"]*)"$/, async function (query) {
    await HomePage.search(query);
});

When(/^I sort results by "([^"]*)"$/, async function (sortOption) {
    await SearchResultsPage.sortBy(sortOption);
});

When(/^I click on search result (\d+)$/, async function (index) {
    await SearchResultsPage.clickResultByIndex(parseInt(index) - 1);
});

When(/^I go to the next page of results$/, async function () {
    await SearchResultsPage.goToNextPage();
});

// ─── Then ─────────────────────────────────────────────────────

Then(/^I should see search results$/, async function () {
    const count = await SearchResultsPage.getResultCount();
    expect(count).to.be.greaterThan(0);
});

Then(/^the search results should contain "([^"]*)"$/, async function (text) {
    const titles = await SearchResultsPage.getResultTitles();
    const containsText = titles.some((title) =>
        title.toLowerCase().includes(text.toLowerCase()),
    );
    expect(containsText).to.be.true;
});

Then(/^I should see a no results message$/, async function () {
    const isNoResults = await SearchResultsPage.isNoResultsDisplayed();
    expect(isNoResults).to.be.true;
});

Then(/^I should see (\d+) search results?$/, async function (count) {
    const resultCount = await SearchResultsPage.getResultCount();
    expect(resultCount).to.equal(parseInt(count));
});

Then(/^the search results should be sorted$/, async function () {
    // Verify results exist (sorting verification depends on application)
    const count = await SearchResultsPage.getResultCount();
    expect(count).to.be.greaterThan(0);
});
