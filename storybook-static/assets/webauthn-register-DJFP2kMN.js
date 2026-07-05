import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{t as n}from"./iframe-BfDw-7zx.js";import{C as r,S as i,a,d as o,i as s,m as c,p as l,u,x as d}from"./useExclusiveAppInstanceEffect-BGrHdR3s.js";import{i as f,r as p}from"./KcPageStory-YOO-k3qL.js";import{l as m,n as h,t as g,u as _}from"./Template-CK_xFZUV.js";import{n as v,t as y}from"./LogoutOtherSessions-CdzcskYn.js";import{n as b,t as x}from"./waitForElementMountedOnDom-BfbQFoG2.js";function S(e){let{webAuthnButtonId:t}=e,{kcContext:n}=o();i(n.pageId===`webauthn-register.ftl`);let{msgStr:r,isFetchingTranslations:s}=a(),{insertScriptTags:c}=_({effectId:`LoginRecoveryAuthnCodeConfig`,scriptTags:[{type:`module`,textContent:()=>`
                    import { registerByWebAuthn } from "${p}keycloak-theme/login/js/webauthnRegister.js";
                    const registerButton = document.getElementById('${t}');
                    registerButton.addEventListener("click", function() {
                        const input = {
                            challenge : '${n.challenge}',
                            userid : '${n.userid}',
                            username : '${n.username}',
                            signatureAlgorithms : ${JSON.stringify(n.signatureAlgorithms)},
                            rpEntityName : ${JSON.stringify(n.rpEntityName)},
                            rpId : ${JSON.stringify(n.rpId)},
                            attestationConveyancePreference : ${JSON.stringify(n.attestationConveyancePreference)},
                            authenticatorAttachment : ${JSON.stringify(n.authenticatorAttachment)},
                            requireResidentKey : ${JSON.stringify(n.requireResidentKey)},
                            userVerificationRequirement : ${JSON.stringify(n.userVerificationRequirement)},
                            createTimeout : ${n.createTimeout},
                            excludeCredentialIds : ${JSON.stringify(n.excludeCredentialIds)},
                            initLabel : ${JSON.stringify(r(`webauthn-registration-init-label`))},
                            initLabelPrompt : ${JSON.stringify(r(`webauthn-registration-init-label-prompt`))},
                            errmsg : ${JSON.stringify(r(`webauthn-unsupported-browser-text`))}
                        };
                        registerByWebAuthn(input);
                    });
                `}]});(0,C.useEffect)(()=>{s||(async()=>{await b({elementId:t}),c()})()},[s])}var C,w=e((()=>{C=t(n(),1),r(),m(),x(),f(),u(),s()}));function T(){let{kcContext:e}=o();i(e.pageId===`webauthn-register.ftl`);let{kcClsx:t}=c(),{msg:n,msgStr:r}=a(),s=`authenticateWebAuthnButton`;return S({webAuthnButtonId:s}),(0,E.jsxs)(h,{headerNode:(0,E.jsxs)(E.Fragment,{children:[(0,E.jsx)(`span`,{className:t(`kcWebAuthnKeyIcon`)}),n(`webauthn-registration-title`)]}),children:[(0,E.jsx)(`form`,{id:`register`,className:t(`kcFormClass`),action:e.url.loginAction,method:`post`,children:(0,E.jsxs)(`div`,{className:t(`kcFormGroupClass`),children:[(0,E.jsx)(`input`,{type:`hidden`,id:`clientDataJSON`,name:`clientDataJSON`}),(0,E.jsx)(`input`,{type:`hidden`,id:`attestationObject`,name:`attestationObject`}),(0,E.jsx)(`input`,{type:`hidden`,id:`publicKeyCredentialId`,name:`publicKeyCredentialId`}),(0,E.jsx)(`input`,{type:`hidden`,id:`authenticatorLabel`,name:`authenticatorLabel`}),(0,E.jsx)(`input`,{type:`hidden`,id:`transports`,name:`transports`}),(0,E.jsx)(`input`,{type:`hidden`,id:`error`,name:`error`}),(0,E.jsx)(y,{})]})}),(0,E.jsx)(`input`,{type:`submit`,className:t(`kcButtonClass`,`kcButtonPrimaryClass`,`kcButtonBlockClass`,`kcButtonLargeClass`),id:s,value:r(`doRegisterSecurityKey`)}),!e.isSetRetry&&e.isAppInitiatedAction&&(0,E.jsx)(`form`,{action:e.url.loginAction,className:t(`kcFormClass`),id:`kc-webauthn-settings-form`,method:`post`,children:(0,E.jsx)(`button`,{type:`submit`,className:t(`kcButtonClass`,`kcButtonDefaultClass`,`kcButtonBlockClass`,`kcButtonLargeClass`),id:`cancelWebAuthnAIA`,name:`cancel-aia`,value:`true`,children:n(`doCancel`)})})]})}var E,D=e((()=>{r(),w(),u(),s(),g(),v(),l(),E=d(),T.__docgenInfo={description:``,methods:[],displayName:`Page`}})),O;e((()=>{D(),O=T}))();export{O as default};