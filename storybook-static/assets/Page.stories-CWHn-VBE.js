import{i as e}from"./preload-helper-xPQekRTU.js";import{x as t}from"./useExclusiveAppInstanceEffect-BGrHdR3s.js";import{n,t as r}from"./KcPageStory-YOO-k3qL.js";var i,a,o,s,c,l,u,d;e((()=>{n(),i=t(),a={url:{oauthAction:`/oauth-action`},oauth:{clientScopesRequested:[{consentScreenText:`Scope1`,dynamicScopeParameter:`dynamicScope1`},{consentScreenText:`Scope2`}],code:`mockCode`},client:{attributes:{policyUri:`https://twitter.com/en/tos`,tosUri:`https://twitter.com/en/privacy`},name:`Twitter`,clientId:`twitter-client-id`}},{KcPageStory:o}=r({pageId:`login-oauth-grant.ftl`}),s={title:`login/login-oauth-grant.ftl`,component:o},c={render:()=>(0,i.jsx)(o,{kcContext:a})},l={args:{kcContext:{...a,oauth:{...a.oauth,clientScopesRequested:[]}}}},u={args:{kcContext:{...a,url:{oauthAction:`/error`},message:{type:`error`,summary:`An error occurred during form submission.`}}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <KcPageStory kcContext={mockKcContext} />
}`,...c.parameters?.docs?.source},description:{story:`Default:\r
- Purpose: Tests the default behavior with meaningful logo (Twitter).\r
- Scenario: The component renders with Twitter as the client, displaying its logo, policy, and terms of service links.\r
- Key Aspect: Ensures the component works with a realistic \`logoUri\` and client name.`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      ...mockKcContext,
      oauth: {
        ...mockKcContext.oauth,
        clientScopesRequested: []
      }
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`WithoutScopes:\r
- Purpose: Tests the component when no OAuth scopes are requested.\r
- Scenario: The component renders with no scopes listed under the consent screen.\r
- Key Aspect: Ensures the component renders correctly when there are no requested scopes.`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      ...mockKcContext,
      url: {
        oauthAction: "/error"
      },
      message: {
        type: "error",
        summary: "An error occurred during form submission."
      }
    }
  }
}`,...u.parameters?.docs?.source},description:{story:`WithFormSubmissionError:\r
- Purpose: Tests how the component handles form submission errors.\r
- Scenario: The \`oauthAction\` URL is set to an error route and an error message is displayed.\r
- Key Aspect: Ensures that the component can display error messages when form submission fails.`,...u.parameters?.docs?.description}}},d=[`Default`,`WithoutScopes`,`WithFormSubmissionError`]}))();export{c as Default,u as WithFormSubmissionError,l as WithoutScopes,d as __namedExportsOrder,s as default};