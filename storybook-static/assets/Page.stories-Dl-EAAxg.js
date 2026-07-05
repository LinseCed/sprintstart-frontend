import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-update-profile.ftl`}),i={title:`login/login-update-profile.ftl`,component:r},a={},o={args:{kcContext:{url:{loginAction:`/mock-login-action`},messagesPerField:{existsError:e=>e===`email`,get:()=>`Invalid email format`},isAppInitiatedAction:!1}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      messagesPerField: {
        existsError: (field: string) => field === "email",
        get: () => "Invalid email format"
      },
      isAppInitiatedAction: false
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithProfileError:\r
- Purpose: Tests when an error occurs in one or more profile fields (e.g., invalid email format).\r
- Scenario: The component displays error messages next to the affected fields.\r
- Key Aspect: Ensures the profile fields show error messages when validation fails.`,...o.parameters?.docs?.description}}},s=[`Default`,`WithProfileError`]}))();export{a as Default,o as WithProfileError,s as __namedExportsOrder,i as default};