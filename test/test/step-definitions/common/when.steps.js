/**
 * ═══════════════════════════════════════════════════════════════
 * Common Step Definitions — When Steps
 * ═══════════════════════════════════════════════════════════════
 *
 * Reusable "When" steps for user interactions shared across features.
 */

const { When } = require('@wdio/cucumber-framework');

// ─── Click / Tap ──────────────────────────────────────────────

When(/^I click (?:on )?(?:the )?"([^"]*)"(?: button| link| element)?$/, async function (identifier) {
    const selectors = [
        `[data-testid="${identifier}"]`,
        `#${identifier}`,
        `//button[contains(.,"${identifier}")]`,
        `//a[contains(.,"${identifier}")]`,
        `[aria-label="${identifier}"]`,
    ];

    let clicked = false;
    for (const selector of selectors) {
        try {
            const el = await $(selector);
            if (await el.isExisting()) {
                await el.waitForClickable({ timeout: 10000 });
                await el.click();
                clicked = true;
                break;
            }
        } catch {
            continue;
        }
    }

    if (!clicked) {
        // Fallback: try by visible text using XPath
        const el = await $(`//*[contains(text(),"${identifier}")]`);
        await el.waitForClickable({ timeout: 10000 });
        await el.click();
    }
});

// ─── Input / Type ─────────────────────────────────────────────

When(/^I type "([^"]*)" into (?:the )?"([^"]*)"(?: field| input)?$/, async function (value, field) {
    const el = await $(`[data-testid="${field}"], #${field}, input[name="${field}"], [aria-label="${field}"]`);
    await el.waitForDisplayed({ timeout: 10000 });
    await el.clearValue();
    await el.setValue(value);
});

When(/^I clear (?:the )?"([^"]*)"(?: field| input)?$/, async function (field) {
    const el = await $(`[data-testid="${field}"], #${field}, input[name="${field}"]`);
    await el.waitForDisplayed({ timeout: 10000 });
    await el.clearValue();
});

// ─── Select ───────────────────────────────────────────────────

When(/^I select "([^"]*)" from (?:the )?"([^"]*)"(?: dropdown)?$/, async function (option, dropdown) {
    const el = await $(`[data-testid="${dropdown}"], #${dropdown}, select[name="${dropdown}"]`);
    await el.waitForDisplayed({ timeout: 10000 });
    await el.selectByVisibleText(option);
});

// ─── Checkbox / Radio ─────────────────────────────────────────

When(/^I check (?:the )?"([^"]*)"(?: checkbox)?$/, async function (checkbox) {
    const el = await $(`[data-testid="${checkbox}"], #${checkbox}, input[name="${checkbox}"]`);
    const isSelected = await el.isSelected();
    if (!isSelected) await el.click();
});

When(/^I uncheck (?:the )?"([^"]*)"(?: checkbox)?$/, async function (checkbox) {
    const el = await $(`[data-testid="${checkbox}"], #${checkbox}, input[name="${checkbox}"]`);
    const isSelected = await el.isSelected();
    if (isSelected) await el.click();
});

// ─── Navigation ───────────────────────────────────────────────

When(/^I navigate to "([^"]*)"$/, async function (url) {
    await browser.url(url);
});

When(/^I refresh the page$/, async function () {
    await browser.refresh();
});

When(/^I go back$/, async function () {
    await browser.back();
});

When(/^I go forward$/, async function () {
    await browser.forward();
});

// ─── Wait / Pause ─────────────────────────────────────────────

When(/^I wait (\d+) seconds?$/, async function (seconds) {
    await browser.pause(parseInt(seconds) * 1000);
});

When(/^I wait for the page to load$/, async function () {
    await browser.waitUntil(
        async () => (await browser.execute(() => document.readyState)) === 'complete',
        { timeout: 30000 },
    );
});

// ─── Scroll ───────────────────────────────────────────────────

When(/^I scroll to the (top|bottom) of the page$/, async function (direction) {
    if (direction === 'top') {
        await browser.execute('window.scrollTo(0, 0);');
    } else {
        await browser.execute('window.scrollTo(0, document.body.scrollHeight);');
    }
});

When(/^I scroll to (?:the )?"([^"]*)"(?: element)?$/, async function (identifier) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}`);
    await el.scrollIntoView();
});

// ─── Keyboard ─────────────────────────────────────────────────

When(/^I press the "([^"]*)" key$/, async function (key) {
    await browser.keys(key);
});

// ─── Hover ────────────────────────────────────────────────────

When(/^I hover over (?:the )?"([^"]*)"(?: element)?$/, async function (identifier) {
    const el = await $(`[data-testid="${identifier}"], #${identifier}`);
    await el.moveTo();
});

// ─── Switch Context ───────────────────────────────────────────

When(/^I switch to the new (?:window|tab)$/, async function () {
    const handles = await browser.getWindowHandles();
    await browser.switchToWindow(handles[handles.length - 1]);
});

When(/^I switch to the (?:main|original) (?:window|tab)$/, async function () {
    const handles = await browser.getWindowHandles();
    await browser.switchToWindow(handles[0]);
});

When(/^I accept the alert$/, async function () {
    await browser.acceptAlert();
});

When(/^I dismiss the alert$/, async function () {
    await browser.dismissAlert();
});
