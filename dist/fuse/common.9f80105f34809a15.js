"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[592],{4771:(f,p,s)=>{s.d(p,{i:()=>l});var a=s(553),n=s(9397),u=s(8533),o=s(5879),r=s(2065),d=s(8991);let l=(()=>{class h{constructor(t,e){this._httpWrapper=t,this._translocoService=e,this.baseUrl=a.N.apiUrl}requestProject(t,e="onboarding"){return this._httpWrapper.sendRequest("get",`${this.baseUrl}/v2/projects/kyc`,{id:t}).pipe((0,n.b)(i=>{this.currentProject=new u.XR({...i.data,type:e})}))}sendEmailValidation(t,e){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations`,{email:e,project:this.currentProject._id,projectFlow:this.currentProject.currentProjectFlow._id,type:"login",validationMethod:"verificationCode",language:this._translocoService.getActiveLang()}).pipe((0,n.b)(i=>{}))}sendPhoneValidation(t,e,i){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations`,{phone:e,countryCode:t,projectFlow:this.currentProject.currentProjectFlow._id,project:this.currentProject._id,phoneGateway:i,type:"login",language:this._translocoService.getActiveLang(),validationMethod:"verificationCode"}).pipe((0,n.b)(m=>{}))}confirmPhoneValidation(t,e,i,m){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations/validate`,{projectFlow:this.currentProject.currentProjectFlow._id,countryCode:t,phone:e,otp:i,authenticatorOTP:m,type:"login"}).pipe((0,n.b)(g=>{}))}confirmEmailValidation(t,e,i){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations/validate`,{email:t,otp:e,projectFlow:this.currentProject.currentProjectFlow._id}).pipe((0,n.b)(m=>{console.log({emailConfirmed:m.data})}))}getProject(){return this.currentProject}biometricsSignIn(t){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/projects/biometrics/sign-in`,t)}createLivenessSession(t){const e=localStorage.getItem("accessToken");let i=`${this.baseUrl}/v2/biometric-validations`;return e&&(i+="/app-login"),this._httpWrapper.sendRequest("post",i,{...t,projectFlow:this.currentProject.currentProjectFlow._id,project:this.currentProject._id},{Headers:{Authorization:e?`Bearer ${e}`:""}})}validateBiometrics(t){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/biometric-validations/validate`,t)}static#t=this.\u0275fac=function(e){return new(e||h)(o.LFG(r.O),o.LFG(d.Vn))};static#e=this.\u0275prov=o.Yz7({token:h,factory:h.\u0275fac,providedIn:"root"})}return h})()},8533:(f,p,s)=>{s.d(p,{XR:()=>u,nd:()=>o});class u{constructor(t={}){if(this._id=t._id||"new",this.client=t.client,this.type=t.type,this.name=t.name,this.identifier=t.identifier,this.contactEmail=t.contactEmail,this.privacyUrl=t.privacyUrl,this.termsAndConditionsUrl=t.termsAndConditionsUrl,this.status=t.status,this.dataProtection=t.dataProtection||{name:""},this.branding=t.branding||{bgColor:"#01236D",borderColor:"#B2BDD3",txtColor:"#8091B6",titleColor:"#FFFFFF",logo:"",rightImage:"https://cdn.verifik.co/assets/auth/authb.svg",rightImagePosition:"end end",rightBackgroundColor:"white"},this.projectFlows=t.projectFlows,this.allowedCountries=t.allowedCountries||[],this.emailEnabled=!1,this.phoneEnabled=!1,this.emailAuthyEnabled=!1,this.phoneAuthyEnabled=!1,this.faceLivenessEnabled=!1,this.faceLivenessAuthyEnabled=!1,this.usesWhiteList=!1,this.whiteListLength=0,this.currentStep=t.currentStep,this.lastStep=t.lastStep,Array.isArray(t.projectFlows)&&t.projectFlows.length)for(let e=0;e<this.projectFlows.length;e++){const i=this.projectFlows[e];if("active"===i.status&&i.type===this.type){this.currentProjectFlow=new o(i);break}i.type===this.type&&(this.currentProjectFlow=new o(i))}this.currentProjectFlow||(this.currentProjectFlow=new o({type:this.type})),this.currentProjectFlow.email&&(this.emailEnabled=!0),this.currentProjectFlow.phone&&(this.phoneEnabled=!0),this.currentProjectFlow.faceLiveness&&(this.faceLivenessEnabled=!0),this.currentProjectFlow.phoneAuthy&&(this.phoneAuthyEnabled=!0),this.currentProjectFlow.emailAuthy&&(this.emailAuthyEnabled=!0),this.currentProjectFlow.faceLivenessAuthy&&(this.faceLivenessAuthyEnabled=!0),this.currentProjectFlow.usesWhiteList&&(this.usesWhiteList=!0),this.currentProjectFlow.whiteList&&(this.whiteListLength=this.currentProjectFlow.whiteList.total)}}class o{constructor(t={}){this._id=t._id,this.client=t.client,this.project=t.project,this.userFeatures=t.userFeatures,this.type=t.type,this.status=t.status,this.version=t.version,this.redirectUrl=t.redirectUrl,this.webhookUrl=t.webhookUrl,this.identityUrl=t.identityUrl,this.allowedCountries=t.allowedCountries||[],this.email=t.email,this.emailAuthy=t.emailAuthy,this.phone=t.phone,this.phoneAuthy=t.phoneAuthy,this.phoneGateway=t.phoneGateway,this.faceLiveness=t.faceLiveness,this.faceLivenessAuthy=t.faceLivenessAuthy,this.webAuthN=t.webAuthN,this.documentValidation=t.documentValidation,this.appQRCode=t.appQRCode,this.loginSettings=t.loginSettings,this.loginSettings&&(this.email=this.loginSettings.email,this.emailAuthy=this.loginSettings.emailAuthy,this.phone=this.loginSettings.phone,this.phoneGateway=this.loginSettings.phoneGateway),this.onboardingSettings=t.onboardingSettings||{basicInformation:{fullName:!1,age:!1,gender:!1,address:!1,postalCode:!1}},this.onboardingSettings&&!this.onboardingSettings.basicInformation&&(this.onboardingSettings.basicInformation={fullName:!1,age:!1,gender:!1,address:!1,postalCode:!1}),this.onboardingSettings&&!this.onboardingSettings.signUpForm&&(this.onboardingSettings.signUpForm={fullName:!1,email:!1,emailGateway:"none",phone:!1,phoneGateway:"none",legalDocument:!1,legalDocumentValidation:"none",showTermsAndConditions:!1,showPrivacyNotice:!1}),this.usesWhiteList=!!t.usesWhiteList,this.whiteList=t.whiteList||{}}}},1944:(f,p,s)=>{s.d(p,{J:()=>o});var a=s(553),n=s(5879),u=s(2065);let o=(()=>{class r{constructor(l){this._httpWrapper=l,this.baseUrl=a.N.apiUrl,this.enviroment=a.N}livenessDemo(l){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/face-recognition/liveness/demo`,l)}static#t=this.\u0275fac=function(h){return new(h||r)(n.LFG(u.O))};static#e=this.\u0275prov=n.Yz7({token:r,factory:r.\u0275fac,providedIn:"root"})}return r})()}}]);