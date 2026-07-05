import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{t as n}from"./iframe-BfDw-7zx.js";import{C as r,S as i,a,d as o,g as s,h as c,i as l,m as u,p as d,u as f,x as p}from"./useExclusiveAppInstanceEffect-BGrHdR3s.js";import{l as m,n as h,t as g,u as _}from"./Template-CK_xFZUV.js";import{n as v,t as y}from"./LogoutOtherSessions-CdzcskYn.js";import{n as b,t as x}from"./waitForElementMountedOnDom-BfbQFoG2.js";function S(e){let{olRecoveryCodesListId:t}=e,{msgStr:n,isFetchingTranslations:r}=a(),{insertScriptTags:i}=_({effectId:`LoginRecoveryAuthnCodeConfig`,scriptTags:[{type:`text/javascript`,textContent:()=>`

                    /* copy recovery codes  */
                    function copyRecoveryCodes() {
                        var tmpTextarea = document.createElement("textarea");
                        var codes = document.querySelectorAll("#${t} li");
                        for (i = 0; i < codes.length; i++) {
                            tmpTextarea.value = tmpTextarea.value + codes[i].innerText + "\\n";
                        }
                        document.body.appendChild(tmpTextarea);
                        tmpTextarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(tmpTextarea);
                    }

                    var copyButton = document.getElementById("copyRecoveryCodes");
                    copyButton && copyButton.addEventListener("click", function () {
                        copyRecoveryCodes();
                    });

                    /* download recovery codes  */
                    function formatCurrentDateTime() {
                        var dt = new Date();
                        var options = {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            timeZoneName: 'short'
                        };

                        return dt.toLocaleString('en-US', options);
                    }

                    function parseRecoveryCodeList() {
                        var recoveryCodes = document.querySelectorAll("#${t} li");
                        var recoveryCodeList = "";

                        for (var i = 0; i < recoveryCodes.length; i++) {
                            var recoveryCodeLiElement = recoveryCodes[i].innerText;
                            recoveryCodeList += recoveryCodeLiElement + "\\r\\n";
                        }

                        return recoveryCodeList;
                    }

                    function buildDownloadContent() {
                        var recoveryCodeList = parseRecoveryCodeList();
                        var dt = new Date();
                        var options = {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            timeZoneName: 'short'
                        };

                        return fileBodyContent =
                            ${JSON.stringify(n(`recovery-codes-download-file-header`))} + "\\n\\n" +
                            recoveryCodeList + "\\n" +
                            ${JSON.stringify(n(`recovery-codes-download-file-description`))} + "\\n\\n" +
                            ${JSON.stringify(n(`recovery-codes-download-file-date`))} + " " + formatCurrentDateTime();
                    }

                    function setUpDownloadLinkAndDownload(filename, text) {
                        var el = document.createElement('a');
                        el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                        el.setAttribute('download', filename);
                        el.style.display = 'none';
                        document.body.appendChild(el);
                        el.click();
                        document.body.removeChild(el);
                    }

                    function downloadRecoveryCodes() {
                        setUpDownloadLinkAndDownload('kc-download-recovery-codes.txt', buildDownloadContent());
                    }

                    var downloadButton = document.getElementById("downloadRecoveryCodes");
                    downloadButton && downloadButton.addEventListener("click", downloadRecoveryCodes);

                    /* print recovery codes */
                    function buildPrintContent() {
                        var recoveryCodeListHTML = document.getElementById('${t}').innerHTML;
                        var styles =
                            \`@page { size: auto;  margin-top: 0; }
                            body { width: 480px; }
                            div { list-style-type: none; font-family: monospace }
                            p:first-of-type { margin-top: 48px }\`;

                        return printFileContent =
                            "<html><style>" + styles + "</style><body>" +
                            "<title>kc-download-recovery-codes</title>" +
                            "<p>" + ${JSON.stringify(n(`recovery-codes-download-file-header`))} + "</p>" +
                            "<div>" + recoveryCodeListHTML + "</div>" +
                            "<p>" + ${JSON.stringify(n(`recovery-codes-download-file-description`))} + "</p>" +
                            "<p>" + ${JSON.stringify(n(`recovery-codes-download-file-date`))} + " " + formatCurrentDateTime() + "</p>" +
                            "</body></html>";
                    }

                    function printRecoveryCodes() {
                        var w = window.open();
                        w.document.write(buildPrintContent());
                        w.print();
                        w.close();
                    }

                    var printButton = document.getElementById("printRecoveryCodes");
                    printButton && printButton.addEventListener("click", printRecoveryCodes);
                `}]});(0,C.useEffect)(()=>{r||(async()=>{await b({elementId:t}),i()})()},[r])}var C,w=e((()=>{C=t(n(),1),m(),x(),l()}));function T(){let{kcContext:e}=o();i(e.pageId===`login-recovery-authn-code-config.ftl`);let{kcClsx:t}=u(),{recoveryAuthnCodesConfigBean:n,isAppInitiatedAction:r}=e,{msg:s,msgStr:l}=a(),d=`kc-recovery-codes-list`;return S({olRecoveryCodesListId:d}),(0,E.jsxs)(h,{headerNode:s(`recovery-code-config-header`),children:[(0,E.jsxs)(`div`,{className:c(`pf-c-alert`,`pf-m-warning`,`pf-m-inline`,t(`kcRecoveryCodesWarning`)),"aria-label":`Warning alert`,children:[(0,E.jsx)(`div`,{className:`pf-c-alert__icon`,children:(0,E.jsx)(`i`,{className:`pficon-warning-triangle-o`,"aria-hidden":`true`})}),(0,E.jsxs)(`h4`,{className:`pf-c-alert__title`,children:[(0,E.jsx)(`span`,{className:`pf-screen-reader`,children:`Warning alert:`}),s(`recovery-code-config-warning-title`)]}),(0,E.jsx)(`div`,{className:`pf-c-alert__description`,children:(0,E.jsx)(`p`,{children:s(`recovery-code-config-warning-message`)})})]}),(0,E.jsx)(`ol`,{id:d,className:t(`kcRecoveryCodesList`),children:n.generatedRecoveryAuthnCodesList.map((e,t)=>(0,E.jsxs)(`li`,{children:[(0,E.jsxs)(`span`,{children:[t+1,`:`]}),` `,e.slice(0,4),`-`,e.slice(4,8),`-`,e.slice(8)]},t))}),(0,E.jsxs)(`div`,{className:t(`kcRecoveryCodesActions`),children:[(0,E.jsxs)(`button`,{id:`printRecoveryCodes`,className:c(`pf-c-button`,`pf-m-link`),type:`button`,children:[(0,E.jsx)(`i`,{className:`pficon-print`,"aria-hidden":`true`}),` `,s(`recovery-codes-print`)]}),(0,E.jsxs)(`button`,{id:`downloadRecoveryCodes`,className:c(`pf-c-button`,`pf-m-link`),type:`button`,children:[(0,E.jsx)(`i`,{className:`pficon-save`,"aria-hidden":`true`}),` `,s(`recovery-codes-download`)]}),(0,E.jsxs)(`button`,{id:`copyRecoveryCodes`,className:c(`pf-c-button`,`pf-m-link`),type:`button`,children:[(0,E.jsx)(`i`,{className:`pficon-blueprint`,"aria-hidden":`true`}),` `,s(`recovery-codes-copy`)]})]}),(0,E.jsxs)(`div`,{className:t(`kcFormOptionsClass`),children:[(0,E.jsx)(`input`,{className:t(`kcCheckInputClass`),type:`checkbox`,id:`kcRecoveryCodesConfirmationCheck`,name:`kcRecoveryCodesConfirmationCheck`,onChange:e=>{document.getElementById(`saveRecoveryAuthnCodesBtn`).disabled=!e.target.checked}}),(0,E.jsx)(`label`,{htmlFor:`kcRecoveryCodesConfirmationCheck`,children:s(`recovery-codes-confirmation-message`)})]}),(0,E.jsxs)(`form`,{action:e.url.loginAction,className:t(`kcFormGroupClass`),id:`kc-recovery-codes-settings-form`,method:`post`,children:[(0,E.jsx)(`input`,{type:`hidden`,name:`generatedRecoveryAuthnCodes`,value:n.generatedRecoveryAuthnCodesAsString}),(0,E.jsx)(`input`,{type:`hidden`,name:`generatedAt`,value:n.generatedAt}),(0,E.jsx)(`input`,{type:`hidden`,id:`userLabel`,name:`userLabel`,value:l(`recovery-codes-label-default`)}),(0,E.jsx)(y,{}),r?(0,E.jsxs)(E.Fragment,{children:[(0,E.jsx)(`input`,{type:`submit`,className:t(`kcButtonClass`,`kcButtonPrimaryClass`,`kcButtonLargeClass`),id:`saveRecoveryAuthnCodesBtn`,value:l(`recovery-codes-action-complete`),disabled:!0}),(0,E.jsx)(`button`,{type:`submit`,className:t(`kcButtonClass`,`kcButtonDefaultClass`,`kcButtonLargeClass`),id:`cancelRecoveryAuthnCodesBtn`,name:`cancel-aia`,value:`true`,children:s(`recovery-codes-action-cancel`)})]}):(0,E.jsx)(`input`,{type:`submit`,className:t(`kcButtonClass`,`kcButtonPrimaryClass`,`kcButtonBlockClass`,`kcButtonLargeClass`),id:`saveRecoveryAuthnCodesBtn`,value:l(`recovery-codes-action-complete`),disabled:!0})]})]})}var E,D=e((()=>{r(),s(),d(),w(),f(),l(),g(),v(),E=p(),T.__docgenInfo={description:``,methods:[],displayName:`Page`}})),O;e((()=>{D(),O=T}))();export{O as default};