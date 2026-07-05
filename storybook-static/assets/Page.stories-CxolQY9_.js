import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c,l;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-update-password.ftl`}),i={title:`login/login-update-password.ftl`,component:r},a={},o={args:{kcContext:{url:{loginAction:`/mock-login-action`},messagesPerField:{existsError:e=>e===`password`,get:()=>`Password must be at least 8 characters long.`},isAppInitiatedAction:!1}}},s={args:{kcContext:{url:{loginAction:`/mock-login-action`},messagesPerField:{existsError:e=>e===`password-confirm`,get:()=>`Passwords do not match.`},isAppInitiatedAction:!1}}},c={args:{kcContext:{url:{loginAction:`/mock-login-action`},isAppInitiatedAction:!0}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      messagesPerField: {
        existsError: (field: string) => field === "password",
        get: () => "Password must be at least 8 characters long."
      },
      isAppInitiatedAction: false
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithPasswordError:\r
- Purpose: Tests when there is an error in the password input (e.g., invalid password).\r
- Scenario: Simulates the case where the user enters an invalid password, and an error message is displayed.\r
- Key Aspect: Ensures the password input field shows an error message when validation fails.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      messagesPerField: {
        existsError: (field: string) => field === "password-confirm",
        get: () => "Passwords do not match."
      },
      isAppInitiatedAction: false
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`WithPasswordConfirmError:\r
- Purpose: Tests when there is an error in the password confirmation input (e.g., passwords do not match).\r
- Scenario: Simulates the case where the user enters mismatching passwords, and an error message is displayed in the confirmation field.\r
- Key Aspect: Ensures that the password confirmation field shows an error when passwords do not match.`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      isAppInitiatedAction: true
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`WithAppInitiatedAction:\r
- Purpose: Tests when the update password action was triggered by an app.\r
- Scenario: Simulates the case where the user presses a 'change password' button in an app and is redirected to Keycloak to change it.\r
- Key Aspect: Ensures the 'Cancel' button is shown correctly, which displays only when the action is app initiated.`,...c.parameters?.docs?.description}}},l=[`Default`,`WithPasswordError`,`WithPasswordConfirmError`,`WithAppInitiatedAction`]}))();export{a as Default,c as WithAppInitiatedAction,s as WithPasswordConfirmError,o as WithPasswordError,l as __namedExportsOrder,i as default};