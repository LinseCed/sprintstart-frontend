import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c,l;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-verify-email.ftl`}),i={title:`login/login-verify-email.ftl`,component:r},a={args:{kcContext:{message:{summary:`You need to verify your email to activate your account.`,type:`warning`},user:{email:`john.doe@gmail.com`}}}},o={args:{kcContext:{message:{summary:`Your email has been successfully verified.`,type:`success`},user:{email:`john.doe@gmail.com`},url:{loginAction:`/mock-login-action`}}}},s={args:{kcContext:{message:{summary:`There was an error verifying your email. Please try again.`,type:`error`},user:{email:`john.doe@gmail.com`},url:{loginAction:`/mock-login-action`}}}},c={args:{kcContext:{message:{summary:`Please verify your email to continue using our services.`,type:`info`},user:{email:`john.doe@gmail.com`},url:{loginAction:`/mock-login-action`}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      message: {
        summary: "You need to verify your email to activate your account.",
        type: "warning"
      },
      user: {
        email: "john.doe@gmail.com"
      }
    }
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      message: {
        summary: "Your email has been successfully verified.",
        type: "success"
      },
      user: {
        email: "john.doe@gmail.com"
      },
      url: {
        loginAction: "/mock-login-action"
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithSuccessMessage:\r
- Purpose: Tests when the email verification is successful, and the user receives a confirmation message.\r
- Scenario: The component renders a success message instead of a warning or error.\r
- Key Aspect: Ensures the success message is displayed correctly when the email is successfully verified.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      message: {
        summary: "There was an error verifying your email. Please try again.",
        type: "error"
      },
      user: {
        email: "john.doe@gmail.com"
      },
      url: {
        loginAction: "/mock-login-action"
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`WithErrorMessage:\r
- Purpose: Tests when there is an error during the email verification process.\r
- Scenario: The component renders an error message indicating the email verification failed.\r
- Key Aspect: Ensures the error message is shown correctly when the verification process encounters an issue.`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      message: {
        summary: "Please verify your email to continue using our services.",
        type: "info"
      },
      user: {
        email: "john.doe@gmail.com"
      },
      url: {
        loginAction: "/mock-login-action"
      }
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`WithInfoMessage:\r
- Purpose: Tests when the user is prompted to verify their email without any urgency.\r
- Scenario: The component renders with an informational message for email verification.\r
- Key Aspect: Ensures the informational message is displayed properly.`,...c.parameters?.docs?.description}}},l=[`Default`,`WithSuccessMessage`,`WithErrorMessage`,`WithInfoMessage`]}))();export{a as Default,s as WithErrorMessage,c as WithInfoMessage,o as WithSuccessMessage,l as __namedExportsOrder,i as default};