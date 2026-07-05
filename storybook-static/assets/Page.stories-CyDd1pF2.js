import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-x509-info.ftl`}),i={title:`login/login-x509-info.ftl`,component:r},a={},o={args:{kcContext:{url:{loginAction:`/mock-login-action`},x509:{formData:{subjectDN:`CN=John Doe, OU=Example Org, O=Example Inc, C=US`,username:`johndoe`,isUserEnabled:!1}}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login-action"
      },
      x509: {
        formData: {
          subjectDN: "CN=John Doe, OU=Example Org, O=Example Inc, C=US",
          username: "johndoe",
          isUserEnabled: false // User not enabled for login
        }
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithoutUserEnabled:\r
- Purpose: Tests when the user is not enabled to log in via x509.\r
- Scenario: The component renders the certificate details but does not provide the option to log in or cancel.\r
- Key Aspect: Ensures that the login buttons are not displayed when the user is not enabled.`,...o.parameters?.docs?.description}}},s=[`Default`,`WithoutUserEnabled`]}))();export{a as Default,o as WithoutUserEnabled,s as __namedExportsOrder,i as default};