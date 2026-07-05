import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c,l,u;e((()=>{t(),{KcPageStory:r}=n({pageId:`webauthn-authenticate.ftl`}),i={title:`login/webauthn-authenticate.ftl`,component:r},a={},o={args:{kcContext:{url:{loginAction:`/mock-login-action`},authenticators:{authenticators:[{credentialId:`authenticator-1`,label:`Security Key 1`,transports:{iconClass:`kcAuthenticatorUsbIcon`,displayNameProperties:[`USB`]},createdAt:`2023-01-01`},{credentialId:`authenticator-2`,label:`Security Key 2`,transports:{iconClass:`kcAuthenticatorNfcIcon`,displayNameProperties:[`NFC`]},createdAt:`2023-02-01`}]},shouldDisplayAuthenticators:!0}}},s={args:{kcContext:{url:{loginAction:`/mock-login-action`},authenticators:{authenticators:[{credentialId:`authenticator-1`,label:`My Security Key`,transports:{iconClass:`kcAuthenticatorUsbIcon`,displayNameProperties:[`USB`]},createdAt:`2023-01-01`}]},shouldDisplayAuthenticators:!0}}},c={args:{kcContext:{url:{loginAction:`/mock-login-action`},authenticators:{authenticators:[{credentialId:`authenticator-1`,label:`My Security Key`,transports:{iconClass:`kcAuthenticatorUsbIcon`,displayNameProperties:[`USB`]},createdAt:`2023-01-01`}]},shouldDisplayAuthenticators:!0,message:{summary:`An error occurred during WebAuthn authentication.`,type:`error`}}}},l={args:{kcContext:{url:{loginAction:`/mock-login-action`},authenticators:{authenticators:[{credentialId:`authenticator-1`,label:`My Security Key`,transports:{iconClass:`kcAuthenticatorUsbIcon`,displayNameProperties:[`USB`]},createdAt:`2023-01-01`}]},shouldDisplayAuthenticators:!0}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      authenticators: {
        authenticators: [{
          credentialId: "authenticator-1",
          label: "Security Key 1",
          transports: {
            iconClass: "kcAuthenticatorUsbIcon",
            displayNameProperties: ["USB"]
          },
          createdAt: "2023-01-01"
        }, {
          credentialId: "authenticator-2",
          label: "Security Key 2",
          transports: {
            iconClass: "kcAuthenticatorNfcIcon",
            displayNameProperties: ["NFC"]
          },
          createdAt: "2023-02-01"
        }]
      },
      shouldDisplayAuthenticators: true
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithMultipleAuthenticators:\r
- Purpose: Tests when multiple WebAuthn authenticators are available for selection.\r
- Scenario: The component renders multiple authenticators, allowing the user to choose between them.\r
- Key Aspect: Ensures that the available authenticators are displayed, and the user can select one.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      authenticators: {
        authenticators: [{
          credentialId: "authenticator-1",
          label: "My Security Key",
          transports: {
            iconClass: "kcAuthenticatorUsbIcon",
            displayNameProperties: ["USB"]
          },
          createdAt: "2023-01-01"
        }]
      },
      shouldDisplayAuthenticators: true
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`WithSingleAuthenticator:\r
- Purpose: Tests when only one WebAuthn authenticator is available.\r
- Scenario: The component renders the WebAuthn form with a single available authenticator.\r
- Key Aspect: Ensures the form renders correctly when there is only one authenticator available.`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      authenticators: {
        authenticators: [{
          credentialId: "authenticator-1",
          label: "My Security Key",
          transports: {
            iconClass: "kcAuthenticatorUsbIcon",
            displayNameProperties: ["USB"]
          },
          createdAt: "2023-01-01"
        }]
      },
      shouldDisplayAuthenticators: true,
      message: {
        summary: "An error occurred during WebAuthn authentication.",
        type: "error"
      }
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`WithErrorDuringAuthentication:\r
- Purpose: Tests the behavior when an error occurs during WebAuthn authentication.\r
- Scenario: The component renders with an error message displayed to the user.\r
- Key Aspect: Ensures the form handles authentication errors and displays a relevant message.`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      authenticators: {
        authenticators: [{
          credentialId: "authenticator-1",
          label: "My Security Key",
          transports: {
            iconClass: "kcAuthenticatorUsbIcon",
            displayNameProperties: ["USB"]
          },
          createdAt: "2023-01-01"
        }]
      },
      shouldDisplayAuthenticators: true
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`WithJavaScriptDisabled:\r
- Purpose: Tests the behavior when JavaScript is disabled or not functioning.\r
- Scenario: The component renders a fallback message prompting the user to enable JavaScript for WebAuthn authentication.\r
- Key Aspect: Ensures the form provides a clear message when JavaScript is required but unavailable.`,...l.parameters?.docs?.description}}},u=[`Default`,`WithMultipleAuthenticators`,`WithSingleAuthenticator`,`WithErrorDuringAuthentication`,`WithJavaScriptDisabled`]}))();export{a as Default,c as WithErrorDuringAuthentication,l as WithJavaScriptDisabled,o as WithMultipleAuthenticators,s as WithSingleAuthenticator,u as __namedExportsOrder,i as default};