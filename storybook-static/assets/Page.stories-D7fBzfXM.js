import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c,l;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-reset-otp.ftl`}),i={title:`login/login-reset-otp.ftl`,component:r},a={},o={args:{kcContext:{url:{loginAction:`/mock-login`},configuredOtpCredentials:{userOtpCredentials:[],selectedCredentialId:void 0},messagesPerField:{existsError:()=>!1}}}},s={args:{kcContext:{url:{loginAction:`/mock-login`},configuredOtpCredentials:{userOtpCredentials:[{id:`otp1`,userLabel:`Device 1`},{id:`otp2`,userLabel:`Device 2`}],selectedCredentialId:`otp1`},messagesPerField:{existsError:e=>e===`totp`,get:()=>`Invalid OTP selection`}}}},c={args:{kcContext:{url:{loginAction:`/mock-login`},configuredOtpCredentials:{userOtpCredentials:[{id:`otp1`,userLabel:`Device 1`}],selectedCredentialId:`otp1`},messagesPerField:{existsError:()=>!1}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login"
      },
      configuredOtpCredentials: {
        userOtpCredentials: [],
        selectedCredentialId: undefined
      },
      messagesPerField: {
        existsError: () => false
      }
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`WithoutOtpCredentials:\r
- Purpose: Tests the behavior when no OTP credentials are available.\r
- Scenario: The component renders without any OTP credentials, showing only the submit button.\r
- Key Aspect: Ensures that the component handles the absence of OTP credentials correctly.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login"
      },
      configuredOtpCredentials: {
        userOtpCredentials: [{
          id: "otp1",
          userLabel: "Device 1"
        }, {
          id: "otp2",
          userLabel: "Device 2"
        }],
        selectedCredentialId: "otp1"
      },
      messagesPerField: {
        existsError: (field: string) => field === "totp",
        get: () => "Invalid OTP selection"
      }
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`WithOtpError:\r
- Purpose: Tests the behavior when an error occurs with the OTP selection.\r
- Scenario: Simulates a scenario where an error occurs (e.g., no OTP selected), and an error message is displayed.\r
- Key Aspect: Ensures that error messages are displayed correctly for OTP-related errors.`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      url: {
        loginAction: "/mock-login"
      },
      configuredOtpCredentials: {
        userOtpCredentials: [{
          id: "otp1",
          userLabel: "Device 1"
        }],
        selectedCredentialId: "otp1"
      },
      messagesPerField: {
        existsError: () => false
      }
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`WithOnlyOneOtpCredential:\r
- Purpose: Tests the behavior when there is only one OTP credential available.\r
- Scenario: Simulates the case where the user has only one OTP credential, and it is pre-selected by default.\r
- Key Aspect: Ensures that the component renders correctly with only one OTP credential pre-selected.`,...c.parameters?.docs?.description}}},l=[`Default`,`WithoutOtpCredentials`,`WithOtpError`,`WithOnlyOneOtpCredential`]}))();export{a as Default,c as WithOnlyOneOtpCredential,s as WithOtpError,o as WithoutOtpCredentials,l as __namedExportsOrder,i as default};