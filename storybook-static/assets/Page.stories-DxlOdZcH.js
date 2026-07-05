import{i as e}from"./preload-helper-xPQekRTU.js";import{x as t}from"./useExclusiveAppInstanceEffect-BGrHdR3s.js";import{n,t as r}from"./KcPageStory-YOO-k3qL.js";var i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{n(),i=t(),{KcPageStory:a}=r({pageId:`login.ftl`}),o={title:`login/login.ftl`,component:a},s={},c={args:{kcContext:{login:{username:`johndoe`},messagesPerField:{existsError:(e,...t)=>{let n=[e,...t];return n.includes(`username`)||n.includes(`password`)},get:e=>e===`username`||e===`password`?`Invalid username or password.`:``}}}},l={args:{kcContext:{realm:{registrationAllowed:!1}}}},u={args:{kcContext:{realm:{rememberMe:!1}}}},d={args:{kcContext:{realm:{resetPasswordAllowed:!1}}}},f={args:{kcContext:{realm:{loginWithEmailAllowed:!1}}}},p={args:{kcContext:{login:{username:`max.mustermann@mail.com`}}}},m={args:{kcContext:{auth:{attemptedUsername:`max.mustermann@mail.com`,showUsername:!0},usernameHidden:!0,message:{type:`info`,summary:`Please re-authenticate to continue`}}}},h={args:{kcContext:{social:{displayInfo:!0,providers:[{loginUrl:`google`,alias:`google`,providerId:`google`,displayName:`Google`,iconClasses:`fa fa-google`},{loginUrl:`microsoft`,alias:`microsoft`,providerId:`microsoft`,displayName:`Microsoft`,iconClasses:`fa fa-windows`},{loginUrl:`facebook`,alias:`facebook`,providerId:`facebook`,displayName:`Facebook`,iconClasses:`fa fa-facebook`},{loginUrl:`instagram`,alias:`instagram`,providerId:`instagram`,displayName:`Instagram`,iconClasses:`fa fa-instagram`},{loginUrl:`twitter`,alias:`twitter`,providerId:`twitter`,displayName:`Twitter`,iconClasses:`fa fa-twitter`},{loginUrl:`linkedin`,alias:`linkedin`,providerId:`linkedin`,displayName:`LinkedIn`,iconClasses:`fa fa-linkedin`},{loginUrl:`stackoverflow`,alias:`stackoverflow`,providerId:`stackoverflow`,displayName:`Stackoverflow`,iconClasses:`fa fa-stack-overflow`},{loginUrl:`github`,alias:`github`,providerId:`github`,displayName:`Github`,iconClasses:`fa fa-github`},{loginUrl:`gitlab`,alias:`gitlab`,providerId:`gitlab`,displayName:`Gitlab`,iconClasses:`fa fa-gitlab`},{loginUrl:`bitbucket`,alias:`bitbucket`,providerId:`bitbucket`,displayName:`Bitbucket`,iconClasses:`fa fa-bitbucket`},{loginUrl:`paypal`,alias:`paypal`,providerId:`paypal`,displayName:`PayPal`,iconClasses:`fa fa-paypal`},{loginUrl:`openshift`,alias:`openshift`,providerId:`openshift`,displayName:`OpenShift`,iconClasses:`fa fa-cloud`}]}}}},g={args:{kcContext:{realm:{password:!1}}}},_={args:{kcContext:{message:{summary:`The time allotted for the connection has elapsed.<br/>The login process will restart from the beginning.`,type:`error`}}}},v={render:e=>(0,i.jsx)(a,{...e,kcContext:{social:{displayInfo:!0,providers:[{loginUrl:`google`,alias:`google`,providerId:`google`,displayName:`Google`,iconClasses:`fa fa-google`}]}}})},y={render:e=>(0,i.jsx)(a,{...e,kcContext:{social:{displayInfo:!0,providers:[{loginUrl:`google`,alias:`google`,providerId:`google`,displayName:`Google`,iconClasses:`fa fa-google`},{loginUrl:`microsoft`,alias:`microsoft`,providerId:`microsoft`,displayName:`Microsoft`,iconClasses:`fa fa-windows`}]}}})},b={render:e=>(0,i.jsx)(a,{...e,kcContext:{social:{displayInfo:!0,providers:[]}}})},x={render:e=>(0,i.jsx)(a,{...e,kcContext:{social:{displayInfo:!0,providers:[{loginUrl:`google`,alias:`google`,providerId:`google`,displayName:`Google`,iconClasses:`fa fa-google`},{loginUrl:`microsoft`,alias:`microsoft`,providerId:`microsoft`,displayName:`Microsoft`,iconClasses:`fa fa-windows`},{loginUrl:`facebook`,alias:`facebook`,providerId:`facebook`,displayName:`Facebook`,iconClasses:`fa fa-facebook`},{loginUrl:`twitter`,alias:`twitter`,providerId:`twitter`,displayName:`Twitter`,iconClasses:`fa fa-twitter`}]}}})},S={render:e=>(0,i.jsx)(a,{...e,kcContext:{social:{displayInfo:!0,providers:[{loginUrl:`google`,alias:`google`,providerId:`google`,displayName:`Google`,iconClasses:`fa fa-google`}]},realm:{rememberMe:!1}}})},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      login: {
        username: "johndoe"
      },
      messagesPerField: {
        // NOTE: The other functions of messagesPerField are derived from get() and
        // existsError() so they are the only ones that need to mock.
        existsError: (fieldName: string, ...otherFieldNames: string[]) => {
          const fieldNames = [fieldName, ...otherFieldNames];
          return fieldNames.includes("username") || fieldNames.includes("password");
        },
        get: (fieldName: string) => {
          if (fieldName === "username" || fieldName === "password") {
            return "Invalid username or password.";
          }
          return "";
        }
      }
    }
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        registrationAllowed: false
      }
    }
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        rememberMe: false
      }
    }
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        resetPasswordAllowed: false
      }
    }
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        loginWithEmailAllowed: false
      }
    }
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      login: {
        username: "max.mustermann@mail.com"
      }
    }
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      auth: {
        attemptedUsername: "max.mustermann@mail.com",
        showUsername: true
      },
      usernameHidden: true,
      message: {
        type: "info",
        summary: "Please re-authenticate to continue"
      }
    }
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      social: {
        displayInfo: true,
        providers: [{
          loginUrl: "google",
          alias: "google",
          providerId: "google",
          displayName: "Google",
          iconClasses: "fa fa-google"
        }, {
          loginUrl: "microsoft",
          alias: "microsoft",
          providerId: "microsoft",
          displayName: "Microsoft",
          iconClasses: "fa fa-windows"
        }, {
          loginUrl: "facebook",
          alias: "facebook",
          providerId: "facebook",
          displayName: "Facebook",
          iconClasses: "fa fa-facebook"
        }, {
          loginUrl: "instagram",
          alias: "instagram",
          providerId: "instagram",
          displayName: "Instagram",
          iconClasses: "fa fa-instagram"
        }, {
          loginUrl: "twitter",
          alias: "twitter",
          providerId: "twitter",
          displayName: "Twitter",
          iconClasses: "fa fa-twitter"
        }, {
          loginUrl: "linkedin",
          alias: "linkedin",
          providerId: "linkedin",
          displayName: "LinkedIn",
          iconClasses: "fa fa-linkedin"
        }, {
          loginUrl: "stackoverflow",
          alias: "stackoverflow",
          providerId: "stackoverflow",
          displayName: "Stackoverflow",
          iconClasses: "fa fa-stack-overflow"
        }, {
          loginUrl: "github",
          alias: "github",
          providerId: "github",
          displayName: "Github",
          iconClasses: "fa fa-github"
        }, {
          loginUrl: "gitlab",
          alias: "gitlab",
          providerId: "gitlab",
          displayName: "Gitlab",
          iconClasses: "fa fa-gitlab"
        }, {
          loginUrl: "bitbucket",
          alias: "bitbucket",
          providerId: "bitbucket",
          displayName: "Bitbucket",
          iconClasses: "fa fa-bitbucket"
        }, {
          loginUrl: "paypal",
          alias: "paypal",
          providerId: "paypal",
          displayName: "PayPal",
          iconClasses: "fa fa-paypal"
        }, {
          loginUrl: "openshift",
          alias: "openshift",
          providerId: "openshift",
          displayName: "OpenShift",
          iconClasses: "fa fa-cloud"
        }]
      }
    }
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      realm: {
        password: false
      }
    }
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    kcContext: {
      message: {
        summary: "The time allotted for the connection has elapsed.<br/>The login process will restart from the beginning.",
        type: "error"
      }
    }
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: args => <KcPageStory {...args} kcContext={{
    social: {
      displayInfo: true,
      providers: [{
        loginUrl: "google",
        alias: "google",
        providerId: "google",
        displayName: "Google",
        iconClasses: "fa fa-google"
      }]
    }
  }} />
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: args => <KcPageStory {...args} kcContext={{
    social: {
      displayInfo: true,
      providers: [{
        loginUrl: "google",
        alias: "google",
        providerId: "google",
        displayName: "Google",
        iconClasses: "fa fa-google"
      }, {
        loginUrl: "microsoft",
        alias: "microsoft",
        providerId: "microsoft",
        displayName: "Microsoft",
        iconClasses: "fa fa-windows"
      }]
    }
  }} />
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: args => <KcPageStory {...args} kcContext={{
    social: {
      displayInfo: true,
      providers: []
    }
  }} />
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: args => <KcPageStory {...args} kcContext={{
    social: {
      displayInfo: true,
      providers: [{
        loginUrl: "google",
        alias: "google",
        providerId: "google",
        displayName: "Google",
        iconClasses: "fa fa-google"
      }, {
        loginUrl: "microsoft",
        alias: "microsoft",
        providerId: "microsoft",
        displayName: "Microsoft",
        iconClasses: "fa fa-windows"
      }, {
        loginUrl: "facebook",
        alias: "facebook",
        providerId: "facebook",
        displayName: "Facebook",
        iconClasses: "fa fa-facebook"
      }, {
        loginUrl: "twitter",
        alias: "twitter",
        providerId: "twitter",
        displayName: "Twitter",
        iconClasses: "fa fa-twitter"
      }]
    }
  }} />
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: args => <KcPageStory {...args} kcContext={{
    social: {
      displayInfo: true,
      providers: [{
        loginUrl: "google",
        alias: "google",
        providerId: "google",
        displayName: "Google",
        iconClasses: "fa fa-google"
      }]
    },
    realm: {
      rememberMe: false
    }
  }} />
}`,...S.parameters?.docs?.source}}},C=[`Default`,`WithInvalidCredential`,`WithoutRegistration`,`WithoutRememberMe`,`WithoutPasswordReset`,`WithEmailAsUsername`,`WithPresetUsername`,`WithImmutablePresetUsername`,`WithSocialProviders`,`WithoutPasswordField`,`WithErrorMessage`,`WithOneSocialProvider`,`WithTwoSocialProviders`,`WithNoSocialProviders`,`WithMoreThanTwoSocialProviders`,`WithSocialProvidersAndWithoutRememberMe`]}))();export{s as Default,f as WithEmailAsUsername,_ as WithErrorMessage,m as WithImmutablePresetUsername,c as WithInvalidCredential,x as WithMoreThanTwoSocialProviders,b as WithNoSocialProviders,v as WithOneSocialProvider,p as WithPresetUsername,h as WithSocialProviders,S as WithSocialProvidersAndWithoutRememberMe,y as WithTwoSocialProviders,g as WithoutPasswordField,d as WithoutPasswordReset,l as WithoutRegistration,u as WithoutRememberMe,C as __namedExportsOrder,o as default};