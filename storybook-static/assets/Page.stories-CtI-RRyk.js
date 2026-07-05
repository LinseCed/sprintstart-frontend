import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-password.ftl`}),i={title:`login/login-password.ftl`,component:r},a={},o={args:{kcContext:{realm:{resetPasswordAllowed:!0},url:{loginAction:`/mock-login`,loginResetCredentialsUrl:`/mock-reset-password`},messagesPerField:{existsError:e=>e===`password`,get:()=>`Invalid password`}}}},s={args:{kcContext:{realm:{resetPasswordAllowed:!1},url:{loginAction:`/mock-login`,loginResetCredentialsUrl:`/mock-reset-password`},messagesPerField:{existsError:()=>!1}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        resetPasswordAllowed: true
      },
      url: {
        loginAction: "/mock-login",
        loginResetCredentialsUrl: "/mock-reset-password"
      },
      messagesPerField: {
        existsError: (field: string) => field === "password",
        get: () => "Invalid password"
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithPasswordError:\r
- Purpose: Tests the behavior when an error occurs in the password field (e.g., incorrect password).\r
- Scenario: Simulates a scenario where an invalid password is entered, and an error message is displayed.\r
- Key Aspect: Ensures that the password input field displays error messages correctly.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        resetPasswordAllowed: false
      },
      url: {
        loginAction: "/mock-login",
        loginResetCredentialsUrl: "/mock-reset-password"
      },
      messagesPerField: {
        existsError: () => false
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:'WithoutResetPasswordOption:\r\n- Purpose: Tests the behavior when the reset password option is disabled.\r\n- Scenario: Simulates a scenario where the `resetPasswordAllowed` is set to `false`, and the "Forgot Password" link is not rendered.\r\n- Key Aspect: Ensures that the component handles cases where resetting the password is not allowed.',...s.parameters?.docs?.description}}},c=[`Default`,`WithPasswordError`,`WithoutResetPasswordOption`]}))();export{a as Default,o as WithPasswordError,s as WithoutResetPasswordOption,c as __namedExportsOrder,i as default};