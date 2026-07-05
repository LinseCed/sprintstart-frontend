import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c,l,u;e((()=>{t(),{KcPageStory:r}=n({pageId:`login-config-totp.ftl`}),i={title:`login/login-config-totp.ftl`,component:r},a={},o={args:{kcContext:{mode:`manual`}}},s={args:{kcContext:{messagesPerField:{get:e=>e===`totp`?`Invalid TOTP`:void 0,exists:e=>e===`totp`,existsError:e=>e===`totp`,printIfExists:(e,t)=>e===`totp`?t:void 0}}}},c={args:{kcContext:{isAppInitiatedAction:!0}}},l={args:{kcContext:{totp:{otpCredentials:[{userLabel:`MyDevice`}]}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      mode: "manual"
    }
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      messagesPerField: {
        get: (fieldName: string) => fieldName === "totp" ? "Invalid TOTP" : undefined,
        exists: (fieldName: string) => fieldName === "totp",
        existsError: (fieldName: string) => fieldName === "totp",
        printIfExists: <T,>(fieldName: string, x: T) => fieldName === "totp" ? x : undefined
      }
    }
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      isAppInitiatedAction: true
    }
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      totp: {
        otpCredentials: [{
          userLabel: "MyDevice"
        }]
      }
    }
  }
}`,...l.parameters?.docs?.source}}},u=[`Default`,`WithManualSetUp`,`WithError`,`WithAppInitiatedAction`,`WithPreFilledUserLabel`]}))();export{a as Default,c as WithAppInitiatedAction,s as WithError,o as WithManualSetUp,l as WithPreFilledUserLabel,u as __namedExportsOrder,i as default};