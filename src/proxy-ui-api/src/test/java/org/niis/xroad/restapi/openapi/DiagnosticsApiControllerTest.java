/**
 * The MIT License
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
package org.niis.xroad.restapi.openapi;

import ee.ria.xroad.common.DiagnosticsErrorCodes;
import ee.ria.xroad.common.DiagnosticsStatus;

import lombok.extern.slf4j.Slf4j;
import org.joda.time.DateTimeUtils;
import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.niis.xroad.restapi.openapi.model.DiagnosticStatusClass;
import org.niis.xroad.restapi.openapi.model.DiagnosticStatusCode;
import org.niis.xroad.restapi.openapi.model.GlobalConfDiagnostics;
import org.niis.xroad.restapi.service.DiagnosticService;
import org.niis.xroad.restapi.util.TestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;

import static junit.framework.TestCase.fail;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.when;

/**
 * Test DiagnosticsApiController
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureTestDatabase
@Transactional
@Slf4j
public class DiagnosticsApiControllerTest {

    private static final String CURRENT_TIME = "2020-03-16T10:16:12.123";
    private static final String PREVIOUS_UPDATE_STR = "2020-03-16T10:15:40.703";
    private static final String NEXT_UPDATE_STR = "2020-03-16T10:16:40.703";
    private static final String PREVIOUS_UPDATE_MIDNIGHT_STR = "2019-12-31T23:59:40.703";
    private static final String NEXT_UPDATE_MIDNIGHT_STR = "2020-01-01T00:00:40.703";
    private static final LocalTime PREVIOUS_UPDATE = LocalTime.of(10, 15, 40, 703000000);
    private static final LocalTime NEXT_UPDATE = LocalTime.of(10, 16, 40, 703000000);
    private static final LocalTime PREVIOUS_UPDATE_MIDNIGHT = LocalTime.of(23, 59, 40, 703000000);
    private static final LocalTime NEXT_UPDATE_MIDNIGHT = LocalTime.of(00, 00, 40, 703000000);
    private static final int ERROR_CODE_UNKNOWN = 999;

    @Autowired
    private DiagnosticsApiController diagnosticsApiController;

    @MockBean
    DiagnosticService diagnosticService;

    @After
    public final void tearDown() {
        DateTimeUtils.setCurrentMillisSystem();
    }

    @Test
    @WithMockUser(authorities = { "DIAGNOSTICS" })
    public void getGlobalConfDiagnosticsSuccess() {
        DateTimeUtils.setCurrentMillisFixed(TestUtils.fromDateTimeToMilliseconds(CURRENT_TIME));

        when(diagnosticService.queryGlobalConfStatus()).thenReturn(new DiagnosticsStatus(
                DiagnosticsErrorCodes.RETURN_SUCCESS, PREVIOUS_UPDATE, NEXT_UPDATE));

        ResponseEntity<GlobalConfDiagnostics> response = diagnosticsApiController.getGlobalConfDiagnostics();
        assertEquals(HttpStatus.OK, response.getStatusCode());

        GlobalConfDiagnostics globalConfDiagnostics = response.getBody();
        assertEquals(DiagnosticStatusCode.SUCCESS, globalConfDiagnostics.getStatusCode());
        assertEquals(DiagnosticStatusClass.OK, globalConfDiagnostics.getStatusClass());
        assertEquals(TestUtils.fromDateTimeToMilliseconds(PREVIOUS_UPDATE_STR),
                (Long)globalConfDiagnostics.getPrevUpdateAt().toInstant().toEpochMilli());
        assertEquals(TestUtils.fromDateTimeToMilliseconds(NEXT_UPDATE_STR),
                (Long)globalConfDiagnostics.getNextUpdateAt().toInstant().toEpochMilli());
    }

    @Test
    @WithMockUser(authorities = { "DIAGNOSTICS" })
    public void getGlobalConfDiagnosticsWaiting() {
        DateTimeUtils.setCurrentMillisFixed(TestUtils.fromDateTimeToMilliseconds(CURRENT_TIME));

        when(diagnosticService.queryGlobalConfStatus()).thenReturn(new DiagnosticsStatus(
                DiagnosticsErrorCodes.ERROR_CODE_UNINITIALIZED, PREVIOUS_UPDATE, NEXT_UPDATE));

        ResponseEntity<GlobalConfDiagnostics> response = diagnosticsApiController.getGlobalConfDiagnostics();
        assertEquals(HttpStatus.OK, response.getStatusCode());

        GlobalConfDiagnostics globalConfDiagnostics = response.getBody();
        assertEquals(DiagnosticStatusCode.ERROR_CODE_UNINITIALIZED, globalConfDiagnostics.getStatusCode());
        assertEquals(DiagnosticStatusClass.WAITING, globalConfDiagnostics.getStatusClass());
        assertEquals(TestUtils.fromDateTimeToMilliseconds(PREVIOUS_UPDATE_STR),
                (Long)globalConfDiagnostics.getPrevUpdateAt().toInstant().toEpochMilli());
        assertEquals(TestUtils.fromDateTimeToMilliseconds(NEXT_UPDATE_STR),
                (Long)globalConfDiagnostics.getNextUpdateAt().toInstant().toEpochMilli());
    }

    @Test
    @WithMockUser(authorities = { "DIAGNOSTICS" })
    public void getGlobalConfDiagnosticsFailNextUpdateTomorrow() {
        DateTimeUtils.setCurrentMillisFixed(TestUtils.fromDateTimeToMilliseconds("2019-12-31T23:59:50.123"));

        when(diagnosticService.queryGlobalConfStatus()).thenReturn(new DiagnosticsStatus(
                DiagnosticsErrorCodes.ERROR_CODE_INTERNAL, PREVIOUS_UPDATE_MIDNIGHT, NEXT_UPDATE_MIDNIGHT));

        ResponseEntity<GlobalConfDiagnostics> response = diagnosticsApiController.getGlobalConfDiagnostics();
        assertEquals(HttpStatus.OK, response.getStatusCode());

        GlobalConfDiagnostics globalConfDiagnostics = response.getBody();
        assertEquals(DiagnosticStatusCode.ERROR_CODE_INTERNAL, globalConfDiagnostics.getStatusCode());
        assertEquals(DiagnosticStatusClass.FAIL, globalConfDiagnostics.getStatusClass());
        assertEquals(TestUtils.fromDateTimeToMilliseconds(PREVIOUS_UPDATE_MIDNIGHT_STR),
                (Long)globalConfDiagnostics.getPrevUpdateAt().toInstant().toEpochMilli());
        assertEquals(TestUtils.fromDateTimeToMilliseconds(NEXT_UPDATE_MIDNIGHT_STR),
                (Long)globalConfDiagnostics.getNextUpdateAt().toInstant().toEpochMilli());
    }

    @Test
    @WithMockUser(authorities = { "DIAGNOSTICS" })
    public void getGlobalConfDiagnosticsFailPreviousUpdateYesterday() {
        DateTimeUtils.setCurrentMillisFixed(TestUtils.fromDateTimeToMilliseconds("2020-01-01T00:00:30.123"));

        when(diagnosticService.queryGlobalConfStatus()).thenReturn(new DiagnosticsStatus(
                ERROR_CODE_UNKNOWN, PREVIOUS_UPDATE_MIDNIGHT, NEXT_UPDATE_MIDNIGHT));

        ResponseEntity<GlobalConfDiagnostics> response = diagnosticsApiController.getGlobalConfDiagnostics();
        assertEquals(HttpStatus.OK, response.getStatusCode());

        GlobalConfDiagnostics globalConfDiagnostics = response.getBody();
        assertEquals(DiagnosticStatusCode.UNKNOWN, globalConfDiagnostics.getStatusCode());
        assertEquals(DiagnosticStatusClass.FAIL, globalConfDiagnostics.getStatusClass());
        assertEquals(TestUtils.fromDateTimeToMilliseconds(PREVIOUS_UPDATE_MIDNIGHT_STR),
                (Long)globalConfDiagnostics.getPrevUpdateAt().toInstant().toEpochMilli());
        assertEquals(TestUtils.fromDateTimeToMilliseconds(NEXT_UPDATE_MIDNIGHT_STR),
                (Long)globalConfDiagnostics.getNextUpdateAt().toInstant().toEpochMilli());
    }

    @Test
    @WithMockUser(authorities = { "DIAGNOSTICS" })
    public void getGlobalConfDiagnosticsException() {
        when(diagnosticService.queryGlobalConfStatus()).thenThrow(new RuntimeException());

        try {
            ResponseEntity<GlobalConfDiagnostics> response = diagnosticsApiController.getGlobalConfDiagnostics();
            fail("should throw RuntimeException");
        } catch (RuntimeException expected) {
            // success
        }
    }
}