import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c,l,u;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-otp.ftl`}),i={title:`login/login-otp.ftl`,component:r},a={},o={args:{kcContext:{otpLogin:{userOtpCredentials:[{id:`credential1`,userLabel:`Device 1`},{id:`credential2`,userLabel:`Device 2`},{id:`credential2`,userLabel:`Device 3`},{id:`credential2`,userLabel:`Device 4`},{id:`credential2`,userLabel:`Device 5`},{id:`credential2`,userLabel:`Device 6`}],selectedCredentialId:`credential1`},url:{loginAction:`/login-action`},messagesPerField:{existsError:()=>!1}}}},s={args:{kcContext:{otpLogin:{userOtpCredentials:[]},url:{loginAction:`/login-action`},messagesPerField:{existsError:e=>e===`totp`,get:()=>`Invalid OTP code`}}}},c={args:{kcContext:{otpLogin:{userOtpCredentials:[]},url:{loginAction:`/login-action`},messagesPerField:{existsError:()=>!1}}}},l={args:{kcContext:{otpLogin:{userOtpCredentials:[{id:`credential1`,userLabel:`Device 1`},{id:`credential2`,userLabel:`Device 2`}],selectedCredentialId:`credential1`},url:{loginAction:`/login-action`},messagesPerField:{existsError:e=>e===`totp`,get:()=>`Invalid OTP code`}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      otpLogin: {
        userOtpCredentials: [{
          id: "credential1",
          userLabel: "Device 1"
        }, {
          id: "credential2",
          userLabel: "Device 2"
        }, {
          id: "credential2",
          userLabel: "Device 3"
        }, {
          id: "credential2",
          userLabel: "Device 4"
        }, {
          id: "credential2",
          userLabel: "Device 5"
        }, {
          id: "credential2",
          userLabel: "Device 6"
        }],
        selectedCredentialId: "credential1"
      },
      url: {
        loginAction: "/login-action"
      },
      messagesPerField: {
        existsError: () => false
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`MultipleOtpCredentials:\r
- Purpose: Tests the behavior when the user has multiple OTP credentials to choose from.\r
- Scenario: Simulates the scenario where the user is presented with multiple OTP credentials and must select one to proceed.\r
- Key Aspect: Ensures that multiple OTP credentials are listed and selectable, and the correct credential is selected by default.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      otpLogin: {
        userOtpCredentials: []
      },
      url: {
        loginAction: "/login-action"
      },
      messagesPerField: {
        existsError: (field: string) => field === "totp",
        get: () => "Invalid OTP code"
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`WithOtpError:\r
- Purpose: Tests the behavior when an error occurs with the OTP field (e.g., invalid OTP code).\r
- Scenario: Simulates an invalid OTP code scenario where an error message is displayed.\r
- Key Aspect: Ensures that the OTP input displays error messages correctly and the error is visible.`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      otpLogin: {
        userOtpCredentials: []
      },
      url: {
        loginAction: "/login-action"
      },
      messagesPerField: {
        existsError: () => false
      }
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`NoOtpCredentials:\r
- Purpose: Tests the behavior when no OTP credentials are provided for the user.\r
- Scenario: Simulates the scenario where the user is not presented with any OTP credentials, and only the OTP input is displayed.\r
- Key Aspect: Ensures that the component handles cases where there are no user OTP credentials, and the user is only prompted for the OTP code.`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      otpLogin: {
        userOtpCredentials: [{
          id: "credential1",
          userLabel: "Device 1"
        }, {
          id: "credential2",
          userLabel: "Device 2"
        }],
        selectedCredentialId: "credential1"
      },
      url: {
        loginAction: "/login-action"
      },
      messagesPerField: {
        existsError: (field: string) => field === "totp",
        get: () => "Invalid OTP code"
      }
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`WithErrorAndMultipleOtpCredentials:\r
- Purpose: Tests behavior when there is both an error in the OTP field and multiple OTP credentials.\r
- Scenario: Simulates the case where the user has multiple OTP credentials and encounters an error with the OTP input.\r
- Key Aspect: Ensures that the component can handle both multiple OTP credentials and display an error message simultaneously.`,...l.parameters?.docs?.description}}},u=[`Default`,`MultipleOtpCredentials`,`WithOtpError`,`NoOtpCredentials`,`WithErrorAndMultipleOtpCredentials`]}))();export{a as Default,o as MultipleOtpCredentials,c as NoOtpCredentials,l as WithErrorAndMultipleOtpCredentials,s as WithOtpError,u as __namedExportsOrder,i as default};