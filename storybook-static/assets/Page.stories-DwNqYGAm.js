import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s;e((()=>{t(),{KcPageStory:r}=n({pageId:`logout-confirm.ftl`}),i={title:`login/logout-confirm.ftl`,component:r},a={},o={args:{kcContext:{url:{logoutConfirmAction:`/mock-logout-action`},client:{baseUrl:`/mock-client-url`},logoutConfirm:{code:`mock-session-code`,skipLink:!1},message:{summary:`Are you sure you want to log out from all sessions?`,type:`warning`}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        logoutConfirmAction: "/mock-logout-action"
      },
      client: {
        baseUrl: "/mock-client-url"
      },
      logoutConfirm: {
        code: "mock-session-code",
        skipLink: false
      },
      message: {
        summary: "Are you sure you want to log out from all sessions?",
        type: "warning"
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithCustomLogoutMessage:\r
- Purpose: Tests when a custom message is displayed for the logout confirmation.\r
- Scenario: The component renders with a custom logout confirmation message instead of the default one.\r
- Key Aspect: Ensures the custom logout message is displayed correctly.`,...o.parameters?.docs?.description}}},s=[`Default`,`WithCustomLogoutMessage`]}))();export{a as Default,o as WithCustomLogoutMessage,s as __namedExportsOrder,i as default};