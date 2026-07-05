import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,t as n}from"./KcPageStory-YOO-k3qL.js";var r,i,a,o,s,c,l;e((()=>{t(),{KcPageStory:r}=n({pageId:`idp-review-user-profile.ftl`}),i={title:`login/idp-review-user-profile.ftl`,component:r},a={},o={args:{kcContext:{messagesPerField:{existsError:e=>[`email`,`firstName`].includes(e),get:e=>{if(e===`email`)return`Invalid email format.`;if(e===`firstName`)return`First name is required.`}}}}},s={args:{kcContext:{profile:{attributesByName:{email:{value:`jane.doe@example.com`,readOnly:!0},firstName:{value:`Jane`,readOnly:!1}}}}}},c={args:{kcContext:{profile:{attributesByName:{firstName:{value:`Jane`},lastName:{value:`Doe`},email:{value:`jane.doe@example.com`}}}}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      messagesPerField: {
        existsError: (fieldName: string) => ["email", "firstName"].includes(fieldName),
        get: (fieldName: string) => {
          if (fieldName === "email") return "Invalid email format.";
          if (fieldName === "firstName") return "First name is required.";
        }
      }
    }
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      profile: {
        attributesByName: {
          email: {
            value: "jane.doe@example.com",
            readOnly: true
          },
          firstName: {
            value: "Jane",
            readOnly: false
          }
        }
      }
    }
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      profile: {
        attributesByName: {
          firstName: {
            value: "Jane"
          },
          lastName: {
            value: "Doe"
          },
          email: {
            value: "jane.doe@example.com"
          }
        }
      }
    }
  }
}`,...c.parameters?.docs?.source}}},l=[`Default`,`WithFormValidationErrors`,`WithReadOnlyFields`,`WithPrefilledFormFields`]}))();export{a as Default,o as WithFormValidationErrors,c as WithPrefilledFormFields,s as WithReadOnlyFields,l as __namedExportsOrder,i as default};