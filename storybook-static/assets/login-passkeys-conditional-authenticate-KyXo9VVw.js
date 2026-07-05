import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{t as n}from"./iframe-BfDw-7zx.js";import{C as r,S as i,a,d as o,g as s,h as c,i as l,m as u,p as d,u as f,x as p}from"./useExclusiveAppInstanceEffect-BGrHdR3s.js";import{i as m,r as h}from"./KcPageStory-YOO-k3qL.js";import{l as g,n as _,t as v,u as y}from"./Template-CK_xFZUV.js";import{n as b,t as x}from"./waitForElementMountedOnDom-BfbQFoG2.js";function S(e){let{webAuthnButtonId:t}=e,{kcContext:n}=o();i(n.pageId===`login-passkeys-conditional-authenticate.ftl`);let{msgStr:r,isFetchingTranslations:s}=a(),{insertScriptTags:c}=y({effectId:`LoginPasskeysConditionalAuthenticate`,scriptTags:[{type:`module`,textContent:()=>`
                    import { authenticateByWebAuthn } from "${h}keycloak-theme/login/js/webauthnAuthenticate.js";
                    import { initAuthenticate } from "${h}keycloak-theme/login/js/passkeysConditionalAuth.js";

                    const authButton = document.getElementById("${t}");
                    const input = {
                        isUserIdentified : ${n.isUserIdentified},
                        challenge : ${JSON.stringify(n.challenge)},
                        userVerification : ${JSON.stringify(n.userVerification)},
                        rpId : ${JSON.stringify(n.rpId)},
                        createTimeout : ${n.createTimeout}
                    };
                    authButton.addEventListener("click", () => {
                        authenticateByWebAuthn({
                            ...input,
                            errmsg : ${JSON.stringify(r(`webauthn-unsupported-browser-text`))}
                        });
                    }, { once: true });

                    initAuthenticate({
                        ...input,
                        errmsg : ${JSON.stringify(r(`passkey-unsupported-browser-text`))}
                    }, available => {
                        const loginForm = document.getElementById("kc-form-login");
                        const passkeyButton = document.getElementById("kc-form-passkey-button");

                        if (!loginForm || !passkeyButton) {
                            return;
                        }

                        if (available) {
                            loginForm.style.display = "block";
                        } else {
                            passkeyButton.style.display = "block";
                        }
                    });
                `}]});(0,C.useEffect)(()=>{s||(async()=>{await b({elementId:t}),c()})()},[s])}var C,w=e((()=>{C=t(n(),1),r(),g(),x(),m(),l(),f()}));function T(){let{kcContext:e}=o();i(e.pageId===`login-passkeys-conditional-authenticate.ftl`);let{messagesPerField:t,login:n,url:r,usernameHidden:s,shouldDisplayAuthenticators:l,authenticators:d,registrationDisabled:f,realm:p}=e,{msg:m,msgStr:h,advancedMsg:g}=a(),{kcClsx:v}=u(),y=`authenticateWebAuthnButton`;return S({webAuthnButtonId:y}),(0,D.jsxs)(_,{headerNode:m(`passkey-login-title`),infoNode:p.registrationAllowed&&!f&&(0,D.jsx)(`div`,{id:`kc-registration`,children:(0,D.jsxs)(`span`,{children:[`$`,m(`noAccount`),` `,(0,D.jsx)(`a`,{tabIndex:6,href:r.registrationUrl,children:m(`doRegister`)})]})}),children:[(0,D.jsxs)(`form`,{id:`webauth`,action:r.loginAction,method:`post`,children:[(0,D.jsx)(`input`,{type:`hidden`,id:`clientDataJSON`,name:`clientDataJSON`}),(0,D.jsx)(`input`,{type:`hidden`,id:`authenticatorData`,name:`authenticatorData`}),(0,D.jsx)(`input`,{type:`hidden`,id:`signature`,name:`signature`}),(0,D.jsx)(`input`,{type:`hidden`,id:`credentialId`,name:`credentialId`}),(0,D.jsx)(`input`,{type:`hidden`,id:`userHandle`,name:`userHandle`}),(0,D.jsx)(`input`,{type:`hidden`,id:`error`,name:`error`})]}),(0,D.jsxs)(`div`,{className:v(`kcFormGroupClass`),style:{marginBottom:0},children:[d!==void 0&&Object.keys(d).length!==0&&(0,D.jsxs)(D.Fragment,{children:[(0,D.jsx)(`form`,{id:`authn_select`,className:v(`kcFormClass`),children:d.authenticators.map((e,t)=>(0,D.jsx)(`input`,{type:`hidden`,name:`authn_use_chk`,readOnly:!0,value:e.credentialId},t))}),l&&(0,D.jsxs)(D.Fragment,{children:[d.authenticators.length>1&&(0,D.jsx)(`p`,{className:v(`kcSelectAuthListItemTitle`),children:m(`passkey-available-authenticators`)}),(0,D.jsx)(`div`,{className:v(`kcFormClass`),children:d.authenticators.map((e,t)=>(0,D.jsxs)(`div`,{id:`kc-webauthn-authenticator-item-${t}`,className:v(`kcSelectAuthListItemClass`),children:[(0,D.jsx)(`i`,{className:c((()=>{let t=v(e.transports.iconClass);return t===e.transports.iconClass?v(`kcWebAuthnDefaultIcon`):t})(),v(`kcSelectAuthListItemIconPropertyClass`))}),(0,D.jsxs)(`div`,{className:v(`kcSelectAuthListItemBodyClass`),children:[(0,D.jsx)(`div`,{id:`kc-webauthn-authenticator-label-${t}`,className:v(`kcSelectAuthListItemHeadingClass`),children:g(e.label)}),e.transports!==void 0&&e.transports.displayNameProperties!==void 0&&e.transports.displayNameProperties.length!==0&&(0,D.jsx)(`div`,{id:`kc-webauthn-authenticator-transport-${t}`,className:v(`kcSelectAuthListItemDescriptionClass`),children:e.transports.displayNameProperties.map((e,t,n)=>(0,D.jsxs)(E.Fragment,{children:[(0,D.jsxs)(`span`,{children:[` `,g(e),` `]},t),t!==n.length-1&&(0,D.jsx)(`span`,{children:`, `})]},t))}),(0,D.jsxs)(`div`,{className:v(`kcSelectAuthListItemDescriptionClass`),children:[(0,D.jsx)(`span`,{id:`kc-webauthn-authenticator-createdlabel-${t}`,children:m(`passkey-createdAt-label`)}),(0,D.jsx)(`span`,{id:`kc-webauthn-authenticator-created-${t}`,children:e.createdAt})]})]}),(0,D.jsx)(`div`,{className:v(`kcSelectAuthListItemFillClass`)})]},t))})]})]}),(0,D.jsx)(`div`,{id:`kc-form`,children:(0,D.jsxs)(`div`,{id:`kc-form-wrapper`,children:[p.password&&(0,D.jsx)(`form`,{id:`kc-form-login`,action:r.loginAction,method:`post`,style:{display:`none`},onSubmit:e=>{try{e.target.login.disabled=!0}catch{}return!0},children:!s&&(0,D.jsxs)(`div`,{className:v(`kcFormGroupClass`),children:[(0,D.jsx)(`label`,{htmlFor:`username`,className:v(`kcLabelClass`),children:m(`passkey-autofill-select`)}),(0,D.jsx)(`input`,{tabIndex:1,id:`username`,"aria-invalid":t.existsError(`username`),className:v(`kcInputClass`),name:`username`,defaultValue:n.username??``,autoComplete:`username webauthn`,type:`text`,autoFocus:!0}),t.existsError(`username`)&&(0,D.jsx)(`span`,{id:`input-error-username`,className:v(`kcInputErrorMessageClass`),"aria-live":`polite`,children:t.get(`username`)})]})}),(0,D.jsx)(`div`,{id:`kc-form-passkey-button`,className:v(`kcFormButtonsClass`),style:{display:`none`},children:(0,D.jsx)(`input`,{id:y,type:`button`,autoFocus:!0,value:h(`passkey-doAuthenticate`),className:v(`kcButtonClass`,`kcButtonPrimaryClass`,`kcButtonBlockClass`,`kcButtonLargeClass`)})})]})})]})]})}var E,D,O=e((()=>{r(),E=t(n(),1),s(),d(),w(),f(),l(),v(),D=p(),T.__docgenInfo={description:``,methods:[],displayName:`Page`}})),k;e((()=>{O(),k=T}))();export{k as default};