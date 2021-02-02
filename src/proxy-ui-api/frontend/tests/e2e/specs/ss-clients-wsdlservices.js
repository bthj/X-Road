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
  tags: ['ss', 'clients', 'wsdlservices'],
  'Security server client add wsdl service': (browser) => {
    const frontPage = browser.page.ssFrontPage();
    const mainPage = browser.page.ssMainPage();
    const clientsTab = mainPage.section.clientsTab;
    const clientInfo = mainPage.section.clientInfo;
    const clientServices = clientInfo.section.services;

    // Open SUT and check that page is loaded
    frontPage.navigate();
    browser.waitForElementVisible('//*[@id="app"]');

    // Enter valid credentials
    frontPage.signinDefaultUser();

    // Navigate
    mainPage.openClientsTab();
    browser.waitForElementVisible(clientsTab);
    clientsTab.openClient('TestService');
    browser.waitForElementVisible(clientInfo);
    clientInfo.openServicesTab();
    browser.waitForElementVisible(clientServices);

    // Verify empty and malformed URL error messages
    clientServices.openAddWSDL();
    clientServices.enterServiceUrl('a');
    clientServices.enterServiceUrl('');
    browser.assert.containsText(
      clientServices.elements.serviceUrlMessage,
      'The URL field is required',
    );
    clientServices.enterServiceUrl('foobar');
    browser.assert.containsText(
      clientServices.elements.serviceUrlMessage,
      'URL is not valid',
    );
    clientServices.cancelAddDialog();

    // Verify that URL field is empty after reopening
    clientServices.openAddWSDL();
    browser.assert.value(clientServices.elements.newServiceUrl, '');

    // Verify opening nonexisting URL
    clientServices.enterServiceUrl('https://www.niis.org/nosuch.wsdl');
    clientServices.confirmAddDialog();
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'WSDL download failed',
    );
    mainPage.closeSnackbar();

    // Verify successfull URL open
    clientServices.openAddWSDL();
    clientServices.enterServiceUrl(
      browser.globals.testdata + '/' + browser.globals.wsdl_url_1,
    );
    clientServices.confirmAddDialog();
    browser.assert.containsText(
      clientServices.elements.serviceDescription,
      browser.globals.testdata + '/' + browser.globals.wsdl_url_1,
    );

    clientServices.expandServiceDetails();
    browser.waitForElementVisible(
      '//td[contains(@data-test, "service-link") and contains(text(),"testOp1")]',
    );

    browser.end();
  },
  'Security server client edit wsdl operation': (browser) => {
    const frontPage = browser.page.ssFrontPage();
    const mainPage = browser.page.ssMainPage();
    const clientsTab = mainPage.section.clientsTab;
    const clientInfo = mainPage.section.clientInfo;
    const clientServices = clientInfo.section.services;
    const operationDetails = mainPage.section.wsdlOperationDetails;
    const sslCheckFail = mainPage.section.sslCheckFailDialog;

    // Open SUT and check that page is loaded
    frontPage.navigate();
    browser.waitForElementVisible('//*[@id="app"]');

    // Enter valid credentials
    frontPage.signinDefaultUser();

    // Navigate
    mainPage.openClientsTab();
    browser.waitForElementVisible(clientsTab);
    clientsTab.openClient('TestService');
    browser.waitForElementVisible(clientInfo);
    clientInfo.openServicesTab();
    browser.waitForElementVisible(clientServices);

    clientServices.expandServiceDetails();
    clientServices.openOperation('testOp1');
    operationDetails.close();
    clientServices.openOperation('testOp1');
    browser.waitForElementVisible(operationDetails);

    // Verify tooltips
    browser.moveToElement(operationDetails.elements.urlHelp, 0, 0);
    browser.expect
      .element(operationDetails.elements.activeTooltip)
      .to.be.visible.and.text.to.equal(
        'The URL where requests targeted at the service are directed',
      );
    browser.moveToElement(operationDetails, 0, 0);
    browser.expect.element(operationDetails.elements.activeTooltip).to.not.be
      .present;
    browser.moveToElement(operationDetails.elements.timeoutHelp, 0, 0);
    browser.expect
      .element(operationDetails.elements.activeTooltip)
      .to.be.visible.and.text.to.equal(
        'The maximum duration of a request to the service, in seconds',
      );
    browser.moveToElement(operationDetails, 0, 0);
    browser.expect.element(operationDetails.elements.activeTooltip).to.not.be
      .present;
    browser.moveToElement(operationDetails.elements.verifyCertHelp, 0, 0);
    browser.expect
      .element(operationDetails.elements.activeTooltip)
      .to.be.visible.and.text.to.equal(
        'Verify TLS certificate when a secure connection is established',
      );

    // Verify cancel
    operationDetails.toggleCertVerification();
    operationDetails.enterUrl('https://www.niis.org/nosuch2/');
    operationDetails.enterTimeout('40');
    operationDetails.toggleVerifyCertApplyToAll();
    operationDetails.toggleUrlApplyToAll();
    operationDetails.toggleTimeoutApplyToAll();
    operationDetails.close();

    // Verify that options were not changed
    browser.assert.containsText(
      clientServices.elements.operationUrl,
      'https://www.niis.org/nosuch1/',
    );
    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOp1")]]//*[contains(@class, "mdi-lock") and contains(@style, "' +
        browser.globals.service_ssl_auth_on_style +
        '")]',
    );
    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOpA")]]//*[contains(@class, "mdi-lock") and contains(@style, "' +
        browser.globals.service_ssl_auth_on_style +
        '")]',
    );
    clientServices.openOperation('testOp1');
    browser.waitForElementVisible(operationDetails);
    browser.assert.valueContains(
      operationDetails.elements.serviceURL,
      'https://www.niis.org/nosuch1/',
    );
    browser.assert.valueContains(operationDetails.elements.timeout, '60');
    browser.expect.element(operationDetails.elements.sslAuth).to.be.selected;

    // Verify change single operation
    operationDetails.enterUrl('https://www.niis.org/nosuch2/');
    operationDetails.enterTimeout('40');
    browser.expect.element(operationDetails.elements.sslAuth).to.be.not
      .selected;
    operationDetails.saveParameters();
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Service saved',
    );
    mainPage.closeSnackbar();
    operationDetails.close();

    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOp1")]]//*[contains(text(), "https://www.niis.org/nosuch2/")]',
    );
    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOpA")]]//*[contains(text(), "https://www.niis.org/nosuch1/")]',
    );
    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOp1")]]//*[contains(@class, "mdi-lock") and contains(@style, "' +
        browser.globals.service_ssl_auth_off_style +
        '")]',
    );
    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOpA")]]//*[contains(@class, "mdi-lock") and contains(@style, "' +
        browser.globals.service_ssl_auth_on_style +
        '")]',
    );

    clientServices.openOperation('testOp1');
    browser.waitForElementVisible(operationDetails);
    browser.assert.valueContains(
      operationDetails.elements.serviceURL,
      'https://www.niis.org/nosuch2/',
    );
    browser.assert.valueContains(operationDetails.elements.timeout, '40');
    browser.expect.element(operationDetails.elements.sslAuth).to.be.not
      .selected;
    operationDetails.close();

    clientServices.openOperation('testOpA');
    browser.waitForElementVisible(operationDetails);
    browser.assert.valueContains(
      operationDetails.elements.serviceURL,
      'https://www.niis.org/nosuch1/',
    );
    browser.assert.valueContains(operationDetails.elements.timeout, '60');
    browser.expect.element(operationDetails.elements.sslAuth).to.be.selected;
    operationDetails.close();

    // Verify change all operations
    clientServices.openOperation('testOpA');
    browser.waitForElementVisible(operationDetails);
    operationDetails.toggleUrlApplyToAll();
    operationDetails.toggleTimeoutApplyToAll();
    operationDetails.toggleVerifyCertApplyToAll();
    operationDetails.enterUrl('https://www.niis.org/nosuch3/');
    operationDetails.enterTimeout('30');
    operationDetails.toggleCertVerification();
    operationDetails.saveParameters();
    browser.waitForElementVisible(sslCheckFail);
    browser.expect
      .element(sslCheckFail.elements.continueButton)
      .to.be.visible.and.text.to.equal('CONTINUE');
    sslCheckFail.continue();
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Service saved',
    );
    mainPage.closeSnackbar();
    operationDetails.close();

    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOp1")]]//*[contains(text(), "https://www.niis.org/nosuch3/")]',
    );
    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOpA")]]//*[contains(text(), "https://www.niis.org/nosuch3/")]',
    );
    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOp1")]]//*[contains(@class, "mdi-lock") and contains(@style, "' +
        browser.globals.service_ssl_auth_on_style +
        '")]',
    );
    browser.waitForElementVisible(
      '//tr[.//td[@data-test="service-link" and contains(text(), "testOpA")]]//*[contains(@class, "mdi-lock") and contains(@style, "' +
        browser.globals.service_ssl_auth_on_style +
        '")]',
    );

    clientServices.openOperation('testOp1');
    browser.waitForElementVisible(operationDetails);
    browser.assert.valueContains(
      operationDetails.elements.serviceURL,
      'https://www.niis.org/nosuch3/',
    );
    browser.assert.valueContains(operationDetails.elements.timeout, '30');
    browser.expect.element(operationDetails.elements.sslAuth).to.be.selected;
    operationDetails.close();

    clientServices.openOperation('testOpA');
    browser.waitForElementVisible(operationDetails);
    browser.assert.valueContains(
      operationDetails.elements.serviceURL,
      'https://www.niis.org/nosuch3/',
    );
    browser.assert.valueContains(operationDetails.elements.timeout, '30');
    browser.expect.element(operationDetails.elements.sslAuth).to.be.selected;
    operationDetails.close();

    browser.end();
  },
  'Security server client add wsdl operation access rights': (browser) => {
    const frontPage = browser.page.ssFrontPage();
    const mainPage = browser.page.ssMainPage();
    const clientsTab = mainPage.section.clientsTab;
    const clientInfo = mainPage.section.clientInfo;
    const clientServices = clientInfo.section.services;
    const operationDetails = mainPage.section.wsdlOperationDetails;
    const addSubjectsPopup = mainPage.section.wsdlAddSubjectsPopup;

    // Open SUT and check that page is loaded
    frontPage.navigate();
    browser.waitForElementVisible('//*[@id="app"]');

    // Enter valid credentials
    frontPage.signinDefaultUser();

    // Navigate
    mainPage.openClientsTab();
    browser.waitForElementVisible(clientsTab);
    clientsTab.openClient('TestService');
    browser.waitForElementVisible(clientInfo);
    clientInfo.openServicesTab();
    browser.waitForElementVisible(clientServices);

    clientServices.expandServiceDetails();
    clientServices.openOperation('testOp1');
    browser.waitForElementVisible(operationDetails);

    operationDetails.openAddAccessRights();
    browser.waitForElementVisible(addSubjectsPopup);

    // Verify cancel
    addSubjectsPopup.startSearch();
    addSubjectsPopup.selectSubject('TestCom');
    addSubjectsPopup.cancel();
    browser.waitForElementNotPresent(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "TestCom")]',
    );

    // Verify add
    operationDetails.openAddAccessRights();
    browser.waitForElementVisible(addSubjectsPopup);
    addSubjectsPopup.startSearch();
    addSubjectsPopup.selectSubject('TestOrg');
    addSubjectsPopup.selectSubject('Security server owners');
    addSubjectsPopup.selectSubject('Group1');
    addSubjectsPopup.addSelected();
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Access rights added successfully',
    );
    mainPage.closeSnackbar();

    browser.waitForElementVisible(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "TestOrg")]',
    );
    browser.waitForElementVisible(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "Security server owners")]',
    );
    browser.waitForElementVisible(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "Group1")]',
    );
    browser.waitForElementNotPresent(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "TestCom")]',
    );

    browser.end();
  },
  'Security server client remove wsdl operation access rights': (browser) => {
    const frontPage = browser.page.ssFrontPage();
    const mainPage = browser.page.ssMainPage();
    const clientsTab = mainPage.section.clientsTab;
    const clientInfo = mainPage.section.clientInfo;
    const clientServices = clientInfo.section.services;
    const operationDetails = mainPage.section.wsdlOperationDetails;
    const removeAccessRightPopup = mainPage.section.removeAccessRightPopup;
    const removeAllAccessRightsPopup =
      mainPage.section.removeAllAccessRightsPopup;

    // Open SUT and check that page is loaded
    frontPage.navigate();
    browser.waitForElementVisible('//*[@id="app"]');

    // Enter valid credentials
    frontPage.signinDefaultUser();

    // Navigate
    mainPage.openClientsTab();
    browser.waitForElementVisible(clientsTab);
    clientsTab.openClient('TestService');
    browser.waitForElementVisible(clientInfo);
    clientInfo.openServicesTab();
    browser.waitForElementVisible(clientServices);

    clientServices.expandServiceDetails();
    clientServices.openOperation('testOp1');
    browser.waitForElementVisible(operationDetails);

    // Verify cancel remove
    operationDetails.removeAccessRight('TestOrg');
    browser.waitForElementVisible(removeAccessRightPopup);
    removeAccessRightPopup.cancel();
    browser.waitForElementVisible(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "TestOrg")]',
    );

    // Verify remove
    operationDetails.removeAccessRight('TestOrg');
    browser.waitForElementVisible(removeAccessRightPopup);
    removeAccessRightPopup.confirm();
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Access rights removed successfully',
    );
    mainPage.closeSnackbar();
    browser.waitForElementNotPresent(mainPage.elements.snackBarMessage);
    browser.waitForElementNotPresent(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "TestOrg")]',
    );
    browser.waitForElementVisible(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "Security server owners")]',
    );
    browser.waitForElementVisible(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "Group1")]',
    );

    // Verify cancel remove all
    operationDetails.removeAllAccessRights();
    browser.waitForElementVisible(removeAllAccessRightsPopup);
    removeAllAccessRightsPopup.cancel();
    browser.waitForElementVisible(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "Security server owners")]',
    );
    browser.waitForElementVisible(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "Group1")]',
    );

    // Verify remove all
    operationDetails.removeAllAccessRights();
    browser.waitForElementVisible(removeAllAccessRightsPopup);
    removeAllAccessRightsPopup.confirm();

    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Access rights removed successfully',
    );
    mainPage.closeSnackbar();
    browser.waitForElementNotPresent(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "Security server owners")]',
    );
    browser.waitForElementNotPresent(
      '//table[contains(@class, "group-members-table")]//td[contains(text(), "Group1")]',
    );

    browser.end();
  },
  'Security server client edit wsdl service': async (browser) => {
    const frontPage = browser.page.ssFrontPage();
    const mainPage = browser.page.ssMainPage();
    const clientsTab = mainPage.section.clientsTab;
    const clientInfo = mainPage.section.clientInfo;
    const clientServices = clientInfo.section.services;
    const servicesPopup = mainPage.section.servicesWarningPopup;
    const serviceDetails = mainPage.section.serviceDetails;

    var startTime, startTimestamp;

    // Open SUT and check that page is loaded
    frontPage.navigate();
    browser.waitForElementVisible('//*[@id="app"]');

    // Enter valid credentials
    frontPage.signinDefaultUser();

    // Navigate
    mainPage.openClientsTab();
    browser.waitForElementVisible(clientsTab);
    clientsTab.openClient('TestService');
    browser.waitForElementVisible(clientInfo);
    clientInfo.openServicesTab();
    browser.waitForElementVisible(clientServices);

    clientServices.expandServiceDetails();
    clientServices.refreshServiceData();
    browser.assert.containsText(mainPage.elements.snackBarMessage, 'Refreshed');
    mainPage.closeSnackbar();

    browser.getText(clientServices.elements.refreshTimestamp, function (
      result,
    ) {
      startTimestamp = result.value;
      startTime = new Date().getTime();
    });

    // Verify enabling
    clientServices.toggleEnabled();
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Service description enabled',
    );
    mainPage.closeSnackbar();

    // Verify disabling and canceling disable
    clientServices.toggleEnabled();
    browser.waitForElementVisible(
      '//*[contains(@data-test, "dialog-title") and contains(text(),"Disable?")]',
    );
    clientServices.enterDisableNotice('Message1');
    clientServices.cancelDisable();
    clientServices.toggleEnabled();
    browser.waitForElementVisible(
      '//*[contains(@data-test, "dialog-title") and contains(text(),"Disable?")]',
    );
    browser.assert.value(clientServices.elements.disableNotice, '');
    clientServices.enterDisableNotice('Notice1');
    clientServices.confirmDisable();
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Service description disabled',
    );
    mainPage.closeSnackbar();

    clientServices.toggleEnabled();
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Service description enabled',
    );
    mainPage.closeSnackbar();

    // Verify editing, malformed URL
    clientServices.openServiceDetails();
    serviceDetails.enterServiceUrl('');
    browser.assert.containsText(
      serviceDetails.elements.URLMessage,
      'The URL field is required',
    );
    serviceDetails.enterServiceUrl('foobar');
    browser.assert.containsText(
      serviceDetails.elements.URLMessage,
      'URL is not valid',
    );

    // verify missing file
    serviceDetails.enterServiceUrl('https://www.niis.org/nosuch.wsdl');
    serviceDetails.confirmDialog();
    browser.waitForElementVisible(mainPage.elements.snackBarMessage, 20000); // loading a missing file can sometimes take more time before failing
    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'WSDL download failed',
    );
    mainPage.closeSnackbar();

    // Part 1 wait until at least 1 min has passed since refresh at the start of the test
    // Split this wait into two parts to not cause timeouts
    await browser.perform(function () {
      const endTime = new Date().getTime();
      const passedTime = endTime - startTime;
      if (passedTime < 30000) {
        console.log('Waiting', 30000 - passedTime, 'ms');
        browser.pause(30000 - passedTime);
      }
    });

    // Verify cancel
    serviceDetails.enterServiceUrl(
      browser.globals.testdata + '/' + browser.globals.wsdl_url_2,
    );
    serviceDetails.cancelDialog();
    browser.assert.containsText(
      clientServices.elements.serviceDescription,
      'WSDL (' +
        browser.globals.testdata +
        '/' +
        browser.globals.wsdl_url_1 +
        ')',
    );

    // Verify succesfull edit
    clientServices.openServiceDetails();
    serviceDetails.enterServiceUrl(
      browser.globals.testdata + '/' + browser.globals.wsdl_url_2,
    );
    serviceDetails.confirmDialog();
    browser.waitForElementVisible(servicesPopup);

    // Part 2 wait until at least 1 min has passed since refresh at the start of the test
    await browser.perform(function () {
      const endTime = new Date().getTime();
      const passedTime = endTime - startTime;
      if (passedTime < 60000) {
        console.log('Waiting', 60000 - passedTime, 'ms');
        browser.pause(60000 - passedTime);
      }
    });

    servicesPopup.accept();

    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Description saved',
    );
    mainPage.closeSnackbar();
    browser.assert.containsText(
      clientServices.elements.serviceDescription,
      'WSDL (' +
        browser.globals.testdata +
        '/' +
        browser.globals.wsdl_url_2 +
        ')',
    );
    browser.waitForElementNotPresent(
      '//td[contains(@data-test, "service-link") and contains(text(),"testOp1")]',
    );
    browser.waitForElementVisible(
      '//td[contains(@data-test, "service-link") and contains(text(),"testOp2")]',
    );

    // Verify that the refresh time has been updated
    browser.perform(function () {
      browser.expect
        .element(clientServices.elements.refreshTimestamp)
        .text.to.not.contain(startTimestamp);
    });

    browser.end();
  },
  'Security server client delete wsdl service': (browser) => {
    const frontPage = browser.page.ssFrontPage();
    const mainPage = browser.page.ssMainPage();
    const clientsTab = mainPage.section.clientsTab;
    const clientInfo = mainPage.section.clientInfo;
    const clientServices = clientInfo.section.services;
    const serviceDetails = mainPage.section.serviceDetails;

    // Open SUT and check that page is loaded
    frontPage.navigate();
    browser.waitForElementVisible('//*[@id="app"]');

    // Enter valid credentials
    frontPage.signinDefaultUser();

    // Open TestGov Internal Servers
    mainPage.openClientsTab();
    browser.waitForElementVisible(clientsTab);
    clientsTab.openClient('TestService');
    browser.waitForElementVisible(clientInfo);
    clientInfo.openServicesTab();
    browser.waitForElementVisible(clientServices);

    // Verify cancel delete
    clientServices.openServiceDetails();
    browser.waitForElementVisible(serviceDetails);
    serviceDetails.deleteService();
    serviceDetails.cancelDelete();

    serviceDetails.closeServiceDetails();
    browser.assert.containsText(
      clientServices.elements.serviceDescription,
      'WSDL (' +
        browser.globals.testdata +
        '/' +
        browser.globals.wsdl_url_2 +
        ')',
    );

    // Verify successful delete
    clientServices.openServiceDetails();
    serviceDetails.deleteService();
    serviceDetails.confirmDelete();

    browser.assert.containsText(
      mainPage.elements.snackBarMessage,
      'Service description deleted',
    );
    mainPage.closeSnackbar();

    browser.waitForElementNotPresent(
      clientServices.elements.serviceDescription,
    );

    browser.end();
  },
};
