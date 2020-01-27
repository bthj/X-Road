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
package org.niis.xroad.restapi.converter;

import ee.ria.xroad.common.identifier.ClientId;
import ee.ria.xroad.signer.protocol.dto.CertRequestInfo;
import ee.ria.xroad.signer.protocol.dto.KeyInfo;
import ee.ria.xroad.signer.protocol.dto.TokenInfo;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.niis.xroad.restapi.openapi.model.PossibleAction;
import org.niis.xroad.restapi.openapi.model.TokenCertificateSigningRequest;
import org.niis.xroad.restapi.service.PossibleActionEnum;
import org.niis.xroad.restapi.service.PossibleActionsRuleEngine;
import org.niis.xroad.restapi.util.CertificateTestUtils.CertRequestInfoBuilder;
import org.niis.xroad.restapi.util.TokenTestUtils.KeyInfoBuilder;
import org.niis.xroad.restapi.util.TokenTestUtils.TokenInfoBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Collection;
import java.util.EnumSet;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;

@RunWith(SpringRunner.class)
@SpringBootTest
public class TokenCertificateSigningRequestConverterTest {

    @Autowired
    private TokenCertificateSigningRequestConverter csrConverter;

    @MockBean
    private PossibleActionsRuleEngine possibleActionsRuleEngine;

    @Before
    public void setup() {
        doReturn(EnumSet.of(PossibleActionEnum.DELETE)).when(possibleActionsRuleEngine)
                .getPossibleCsrActions(any());
    }


    @Test
    public void convert() {
        CertRequestInfo certRequestInfo = new CertRequestInfo("id",
                ClientId.create("a", "b", "c"),
                "subject-name");
        TokenCertificateSigningRequest csr = csrConverter.convert(certRequestInfo);
        assertEquals("id", csr.getId());
        assertEquals("a:b:c", csr.getOwnerId());
    }

    @Test
    public void convertWithPossibleActions() throws Exception {
        CertRequestInfo certRequestInfo = new CertRequestInfoBuilder().build();
        KeyInfo keyInfo = new KeyInfoBuilder()
                .csr(certRequestInfo)
                .build();
        TokenInfo tokenInfo = new TokenInfoBuilder()
                .key(keyInfo)
                .build();
        TokenCertificateSigningRequest csr = csrConverter.convert(certRequestInfo, keyInfo, tokenInfo);
        Collection<PossibleAction> actions = csr.getPossibleActions();
        assertTrue(actions.contains(PossibleAction.DELETE));
        assertEquals(1, actions.size());
    }

}
