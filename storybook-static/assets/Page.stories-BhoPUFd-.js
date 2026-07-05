import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-recovery-authn-code-config.ftl`}),i={title:`login/login-recovery-authn-code-config.ftl`,component:r},a={},o={args:{kcContext:{url:{loginAction:`/mock-login-action`},message:{summary:`An error occurred during recovery code generation. Please try again.`,type:`error`}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      message: {
        summary: "An error occurred during recovery code generation. Please try again.",
        type: "error"
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithErrorDuringCodeGeneration:\r
- Purpose: Tests when an error occurs while generating recovery authentication codes.\r
- Scenario: The component renders an error message to inform the user of the failure during code generation.\r
- Key Aspect: Ensures that error messages are properly displayed when recovery code generation fails.`,...o.parameters?.docs?.description}}},s=[`Default`,`WithErrorDuringCodeGeneration`]}))();export{a as Default,o as WithErrorDuringCodeGeneration,s as __namedExportsOrder,i as default};