import{i as e}from"./preload-helper-xPQekRTU.js";import{x as t}from"./useExclusiveAppInstanceEffect-BGrHdR3s.js";import{n,t as r}from"./KcPageStory-YOO-k3qL.js";var i,a,o,s,c,l,u,d,f;e((()=>{n(),i=t(),a={url:{loginAction:`/login-action`},idpAlias:`mockIdpAlias`,brokerContext:{username:`mockUser`},realm:{displayName:`MockRealm`}},{KcPageStory:o}=r({pageId:`login-idp-link-email.ftl`}),s={title:`login/login-idp-link-email.ftl`,component:o},c={render:()=>(0,i.jsx)(o,{kcContext:a})},l={args:{kcContext:{...a,idpAlias:`Google`,brokerContext:{username:`john.doe`},realm:{displayName:`MyRealm`}}}},u={args:{kcContext:{...a,idpAlias:`Facebook`,brokerContext:{username:`jane.doe`},realm:{displayName:`CUSTOM REALM DISPLAY NAME`}}}},d={args:{kcContext:{...a,url:{loginAction:`/error`},message:{type:`error`,summary:`An error occurred during form submission.`}}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <KcPageStory kcContext={mockKcContext} />
}`,...c.parameters?.docs?.source},description:{story:"Default:\r\n- Purpose: Tests the default behavior with mock data.\r\n- Scenario: The component renders with a mocked identity provider alias (`mockIdpAlias`), a default broker username (`mockUser`), and a default realm name (`MockRealm`).\r\n- Key Aspect: Ensures the default behavior of the component with typical kcContext values.",...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      ...mockKcContext,
      idpAlias: "Google",
      brokerContext: {
        username: "john.doe"
      },
      realm: {
        displayName: "MyRealm"
      }
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`WithIdpAlias:\r
- Purpose: Tests behavior when the idpAlias is set to "Google".\r
- Scenario: Simulates the component being used with a Google identity provider, showing the username "john.doe" and realm "MyRealm".\r
- Key Aspect: Ensures the correct identity provider alias ("Google") and broker context (user info) are displayed in the email linking instructions.`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      ...mockKcContext,
      idpAlias: "Facebook",
      brokerContext: {
        username: "jane.doe"
      },
      realm: {
        displayName: "CUSTOM REALM DISPLAY NAME"
      }
    }
  }
}`,...u.parameters?.docs?.source},description:{story:`WithCustomRealmDisplayName:\r
- Purpose: Tests behavior when the realm display name is customized.\r
- Scenario: Simulates the component with a Facebook identity provider, a broker username "jane.doe", and a custom realm name "CustomRealm".\r
- Key Aspect: Ensures that custom realm display names are rendered correctly alongside the idpAlias and broker context.`,...u.parameters?.docs?.description}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
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
}`,...d.parameters?.docs?.source},description:{story:`WithFormSubmissionError:\r
- Purpose: Tests how the component handles form submission errors.\r
- Scenario: Simulates a form submission error by setting the login action URL to \`/error\` and displays an error message.\r
- Key Aspect: Verifies that the component can display error messages during form submission failure, ensuring proper error handling.`,...d.parameters?.docs?.description}}},f=[`Default`,`WithIdpAlias`,`WithCustomRealmDisplayName`,`WithFormSubmissionError`]}))();export{c as Default,u as WithCustomRealmDisplayName,d as WithFormSubmissionError,l as WithIdpAlias,f as __namedExportsOrder,s as default};