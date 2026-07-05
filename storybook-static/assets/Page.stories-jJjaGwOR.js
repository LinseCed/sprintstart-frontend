import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c;e((()=>{t(),{KcPageStory:r}=n({pageId:`info.ftl`}),i={title:`login/info.ftl`,component:r},a={args:{kcContext:{messageHeader:`Message header`,message:{summary:`Server info message`}}}},o={args:{kcContext:{messageHeader:`Message header`,message:{summary:`Server message`},actionUri:void 0}}},s={args:{kcContext:{messageHeader:`Message header`,message:{summary:`Required actions:`},requiredActions:[`CONFIGURE_TOTP`,`UPDATE_PROFILE`,`VERIFY_EMAIL`,`CUSTOM_ACTION`],"x-keycloakify":{messages:{"requiredAction.CUSTOM_ACTION":`Custom action`}}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      messageHeader: "Message header",
      message: {
        summary: "Server info message"
      }
    }
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      messageHeader: "Message header",
      message: {
        summary: "Server message"
      },
      actionUri: undefined
    }
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      messageHeader: "Message header",
      message: {
        summary: "Required actions:"
      },
      requiredActions: ["CONFIGURE_TOTP", "UPDATE_PROFILE", "VERIFY_EMAIL", "CUSTOM_ACTION"],
      "x-keycloakify": {
        messages: {
          "requiredAction.CUSTOM_ACTION": "Custom action"
        }
      }
    }
  }
}`,...s.parameters?.docs?.source}}},c=[`Default`,`WithLinkBack`,`WithRequiredActions`]}))();export{a as Default,o as WithLinkBack,s as WithRequiredActions,c as __namedExportsOrder,i as default};