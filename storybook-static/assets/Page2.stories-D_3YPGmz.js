import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c,l;e((()=>{t(),{KcPageStory:r}=n({pageId:`webauthn-error.ftl`}),i={title:`login/webauthn-error.ftl`,component:r},a={},o={args:{kcContext:{url:{loginAction:`/mock-login-action`},isAppInitiatedAction:!1,message:{summary:`WebAuthn authentication failed. Please try again.`,type:`error`}}}},s={args:{kcContext:{url:{loginAction:`/mock-login-action`},isAppInitiatedAction:!0,message:{summary:`WebAuthn authentication failed. You can try again or cancel.`,type:`error`}}}},c={args:{kcContext:{url:{loginAction:`/mock-login-action`},isAppInitiatedAction:!1,message:{summary:`JavaScript is disabled or not working. Please retry manually.`,type:`warning`}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      isAppInitiatedAction: false,
      message: {
        summary: "WebAuthn authentication failed. Please try again.",
        type: "error"
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithRetryAvailable:\r
- Purpose: Tests when the user can retry the WebAuthn authentication after an error.\r
- Scenario: The component renders with a "Try Again" button to allow retrying the authentication process.\r
- Key Aspect: Ensures the retry button functionality is visible and the user can retry authentication.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      isAppInitiatedAction: true,
      message: {
        summary: "WebAuthn authentication failed. You can try again or cancel.",
        type: "error"
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`WithAppInitiatedAction:\r
- Purpose: Tests when the WebAuthn error form is part of an application-initiated action.\r
- Scenario: The component renders with both a "Try Again" button and a "Cancel" button for app-initiated actions.\r
- Key Aspect: Ensures the form renders correctly with both "Try Again" and "Cancel" options.`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      isAppInitiatedAction: false,
      message: {
        summary: "JavaScript is disabled or not working. Please retry manually.",
        type: "warning"
      }
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`WithJavaScriptDisabled:\r
- Purpose: Tests the behavior when JavaScript is disabled or not functioning.\r
- Scenario: The component renders with a message prompting the user to retry manually without JavaScript.\r
- Key Aspect: Ensures the retry mechanism works properly when JavaScript is disabled or unavailable.`,...c.parameters?.docs?.description}}},l=[`Default`,`WithRetryAvailable`,`WithAppInitiatedAction`,`WithJavaScriptDisabled`]}))();export{a as Default,s as WithAppInitiatedAction,c as WithJavaScriptDisabled,o as WithRetryAvailable,l as __namedExportsOrder,i as default};