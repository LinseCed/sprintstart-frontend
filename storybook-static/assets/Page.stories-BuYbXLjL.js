import{i as e}from"./preload-helper-xPQekRTU.js";import{x as t}from"./useExclusiveAppInstanceEffect-BGrHdR3s.js";import{n,t as r}from"./KcPageStory-YOO-k3qL.js";var i,a,o,s,c,l,u;e((()=>{n(),i=t(),a={url:{loginAction:`/login-action`},idpAlias:`mockIdpAlias`},{KcPageStory:o}=r({pageId:`login-idp-link-confirm.ftl`}),s={title:`login/login-idp-link-confirm.ftl`,component:o},c={render:()=>(0,i.jsx)(o,{kcContext:a})},l={args:{kcContext:{...a,url:{loginAction:`/error`},message:{type:`error`,summary:`An error occurred during form submission.`}}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <KcPageStory kcContext={mockKcContext} />
}`,...c.parameters?.docs?.source},description:{story:"Default:\r\n- Purpose: Tests standard behavior with mock data.\r\n- Scenario: The component renders with a mocked identity provider alias (`mockIdpAlias`) and a login action URL (`/login-action`).\r\n- Key Aspect: Ensures the default behavior of the component with standard values for kcContext.",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      ...mockKcContext,
      url: {
        loginAction: "/error"
      },
      message: {
        type: "error",
        summary: "An error occurred during form submission."
      }
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`WithFormSubmissionError:\r
- Purpose: Tests how the component handles form submission errors.\r
- Scenario: Simulates a form submission error by setting the login action URL to \`/error\` and displays an error message.\r
- Key Aspect: Verifies that the component can display error messages during form submission failure, ensuring proper error handling.`,...l.parameters?.docs?.description}}},u=[`Default`,`WithFormSubmissionError`]}))();export{c as Default,l as WithFormSubmissionError,u as __namedExportsOrder,s as default};