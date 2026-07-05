import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c;e((()=>{t(),{KcPageStory:r}=n({pageId:`webauthn-register.ftl`}),i={title:`login/webauthn-register.ftl`,component:r},a={},o={args:{kcContext:{url:{loginAction:`/mock-login-action`},isSetRetry:!0,isAppInitiatedAction:!1}}},s={args:{kcContext:{url:{loginAction:`/mock-login-action`},isSetRetry:!1,isAppInitiatedAction:!1,message:{summary:`An error occurred during WebAuthn registration. Please try again.`,type:`error`}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      isSetRetry: true,
      isAppInitiatedAction: false
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithRetryAvailable:\r
- Purpose: Tests when the user is allowed to retry WebAuthn registration after a failure.\r
- Scenario: The component renders the form with a retry option.\r
- Key Aspect: Ensures the retry functionality is available and the form allows the user to retry.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      isSetRetry: false,
      isAppInitiatedAction: false,
      message: {
        summary: "An error occurred during WebAuthn registration. Please try again.",
        type: "error"
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`WithErrorDuringRegistration:\r
- Purpose: Tests when an error occurs during WebAuthn registration.\r
- Scenario: The component displays an error message related to WebAuthn registration failure.\r
- Key Aspect: Ensures the error message is displayed correctly, informing the user of the registration failure.`,...s.parameters?.docs?.description}}},c=[`Default`,`WithRetryAvailable`,`WithErrorDuringRegistration`]}))();export{a as Default,s as WithErrorDuringRegistration,o as WithRetryAvailable,c as __namedExportsOrder,i as default};