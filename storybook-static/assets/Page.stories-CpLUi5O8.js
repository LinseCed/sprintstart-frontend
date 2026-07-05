import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-reset-password.ftl`}),i={title:`login/login-reset-password.ftl`,component:r},a={},o={args:{kcContext:{realm:{loginWithEmailAllowed:!0,registrationEmailAsUsername:!0}}}},s={args:{kcContext:{realm:{loginWithEmailAllowed:!1,registrationEmailAsUsername:!1,duplicateEmailsAllowed:!1},url:{loginAction:`/mock-login-action`,loginUrl:`/mock-login-url`},messagesPerField:{existsError:e=>e===`username`,get:()=>`Invalid username`},auth:{attemptedUsername:`invalid_user`}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        loginWithEmailAllowed: true,
        registrationEmailAsUsername: true
      }
    }
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        loginWithEmailAllowed: false,
        registrationEmailAsUsername: false,
        duplicateEmailsAllowed: false
      },
      url: {
        loginAction: "/mock-login-action",
        loginUrl: "/mock-login-url"
      },
      messagesPerField: {
        existsError: (field: string) => field === "username",
        get: () => "Invalid username"
      },
      auth: {
        attemptedUsername: "invalid_user"
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`WithUsernameError:\r
- Purpose: Tests behavior when an error occurs with the username input (e.g., invalid username).\r
- Scenario: The component displays an error message next to the username input field.\r
- Key Aspect: Ensures the username input shows error messages when validation fails.`,...s.parameters?.docs?.description}}},c=[`Default`,`WithEmailAsUsername`,`WithUsernameError`]}))();export{a as Default,o as WithEmailAsUsername,s as WithUsernameError,c as __namedExportsOrder,i as default};