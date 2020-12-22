/*
 * The MIT License
 * Copyright (c) 2019- Nordic Institute for Interoperability Solutions (NIIS)
 * Copyright (c) 2018 Estonian Information System Authority (RIA),
 * Nordic Institute for Interoperability Solutions (NIIS), Population Register Centre (VRK)
 * Copyright (c) 2015-2017 Estonian Information System Authority (RIA), Population Register Centre (VRK)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module.exports = {
  tags: ['ss', 'xroad-registration-officer', 'permissions'],
  'Security server registration officer role': (browser) => {
    const frontPage = browser.page.ssFrontPage();
    const mainPage = browser.page.ssMainPage();
    const clientsTab = mainPage.section.clientsTab;
    const keysTab = mainPage.section.keysTab;
    const diagnosticsTab = mainPage.section.diagnosticsTab;
    const settingsTab = mainPage.section.settingsTab;
    const tokenName = mainPage.section.keysTab.elements.tokenName;
    const searchField = mainPage.section.clientsTab.elements.searchField;
    const APIKeysTab = mainPage.section.keysTab.elements.APIKeysTab;
    const generateKeyButton =
      mainPage.section.keysTab.elements.generateKeyButton;

    // Open SUT and check that page is loaded
    frontPage.navigate();
    browser.waitForElementVisible('//*[@id="app"]');

    // Enter valid credentials
    frontPage
      .clearUsername()
      .clearPassword()
      .enterUsername(browser.globals.login_registration_officer)
      .enterPassword(browser.globals.login_pwd)
      .signin();

    // Check username
    browser.waitForElementVisible(
      '//div[contains(@class,"auth-container") and contains(text(),"' +
        browser.globals.login_registration_officer +
        '")]',
    );

    // clients
    mainPage.openClientsTab();
    browser.waitForElementVisible(searchField);
    browser.waitForElementVisible(clientsTab.elements.addClientButton);

    // keys and certs
    mainPage.openKeysTab();
    browser.waitForElementVisible(keysTab);
    keysTab.openSignAndAuthKeys();
    browser.waitForElementVisible(tokenName);
    browser.waitForElementNotPresent(APIKeysTab);
    keysTab.openSecurityServerTLSKey();
    browser.waitForElementNotPresent(generateKeyButton);
    browser.waitForElementVisible(keysTab.elements.exportCertButton);

    browser.waitForElementNotPresent(diagnosticsTab);
    browser.waitForElementNotPresent(settingsTab);

    browser.end();
  },
};
