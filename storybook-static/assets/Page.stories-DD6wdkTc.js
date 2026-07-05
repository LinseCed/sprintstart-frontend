import{i as e}from"./preload-helper-xPQekRTU.js";import{x as t}from"./useExclusiveAppInstanceEffect-BGrHdR3s.js";import{n,t as r}from"./KcPageStory-YOO-k3qL.js";var i,a,o,s,c,l,u;e((()=>{n(),i=t(),a={idpDisplayName:`GitHub`,url:{loginAction:`/login-action`}},{KcPageStory:o}=r({pageId:`link-idp-action.ftl`}),s={title:`login/link-idp-action.ftl`,component:o},c={render:()=>(0,i.jsx)(o,{kcContext:a})},l={args:{kcContext:{...a,idpDisplayName:`Google`,url:{loginAction:`/custom-login-action`}}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <KcPageStory kcContext={mockKcContext} />
}`,...c.parameters?.docs?.source},description:{story:"Default:\r\n- Purpose: Tests the default behavior with mock data.\r\n- Scenario: Renders with a mocked identity provider name (`GitHub`) and login action URL (`/login-action`).\r\n- Key Aspect: Ensures the page renders the prompt and buttons with standard kcContext values.",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      ...mockKcContext,
      idpDisplayName: "Google",
      url: {
        loginAction: "/custom-login-action"
      }
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`WithDifferentProvider:\r
- Purpose: Tests behavior when linking a different provider.\r
- Scenario: Simulates linking to Google with a custom login action URL.\r
- Key Aspect: Verifies dynamic provider name rendering while preserving button actions.`,...l.parameters?.docs?.description}}},u=[`Default`,`WithDifferentProvider`]}))();export{c as Default,l as WithDifferentProvider,u as __namedExportsOrder,s as default};