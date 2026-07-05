import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-page-expired.ftl`}),i={title:`login/login-page-expired.ftl`,component:r},a={},o={args:{kcContext:{url:{loginRestartFlowUrl:`/mock-restart-flow`,loginAction:`/mock-continue-login`},message:{type:`error`,summary:`An error occurred while processing your session.`}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginRestartFlowUrl: "/mock-restart-flow",
        loginAction: "/mock-continue-login"
      },
      message: {
        type: "error",
        summary: "An error occurred while processing your session."
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithErrorMessage:\r
- Purpose: Tests behavior when an error message is displayed along with the page expiration message.\r
- Scenario: Simulates a case where the session expired due to an error, and an error message is displayed alongside the expiration message.\r
- Key Aspect: Ensures that error messages are displayed correctly in addition to the page expiration notice.`,...o.parameters?.docs?.description}}},s=[`Default`,`WithErrorMessage`]}))();export{a as Default,o as WithErrorMessage,s as __namedExportsOrder,i as default};