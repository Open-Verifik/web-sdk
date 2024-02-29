"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[592],{4771:(h,l,r)=>{r.d(l,{i:()=>s});var d=r(553),o=r(9397),i=r(8533),u=r(5879),a=r(2065),p=r(8991);let s=(()=>{class c{constructor(e,t){this._httpWrapper=e,this._translocoService=t,this.baseUrl=d.N.apiUrl}requestProject(e,t="onboarding"){return this._httpWrapper.sendRequest("get",`${this.baseUrl}/v2/projects/kyc`,{id:e}).pipe((0,o.b)(n=>{this.currentProject=new i.XR({...n.data,type:t})}))}sendEmailValidation(e,t){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations`,{email:e,project:this.currentProject._id,projectFlow:this.currentProject.currentProjectFlow._id,type:"login",validationMethod:"verificationCode",language:this._translocoService.getActiveLang(),location:t}).pipe((0,o.b)(n=>{}))}sendPhoneValidation(e,t,n){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations`,{phone:t,countryCode:e,projectFlow:this.currentProject.currentProjectFlow._id,project:this.currentProject._id,phoneGateway:n,type:"login",language:this._translocoService.getActiveLang(),validationMethod:"verificationCode"}).pipe((0,o.b)(_=>{}))}confirmPhoneValidation(e,t,n,_){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations/validate`,{projectFlow:this.currentProject.currentProjectFlow._id,countryCode:e,phone:t,otp:n,authenticatorOTP:_,type:"login"}).pipe((0,o.b)(m=>{}))}confirmEmailValidation(e,t,n){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations/validate`,{email:e,otp:t,projectFlow:this.currentProject.currentProjectFlow._id}).pipe((0,o.b)(_=>{}))}getProject(){return this.currentProject}biometricsSignIn(e){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/projects/biometrics/sign-in`,e)}createLivenessSession(e){const t=localStorage.getItem("accessToken");let n=`${this.baseUrl}/v2/biometric-validations`;return t&&(n+="/app-login"),this._httpWrapper.sendRequest("post",n,{...e,projectFlow:this.currentProject.currentProjectFlow._id,project:this.currentProject._id},{Headers:{Authorization:t?`Bearer ${t}`:""}})}validateBiometrics(e){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/biometric-validations/validate`,e)}createAppRegistration(e){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations`,e)}static#e=this.\u0275fac=function(t){return new(t||c)(u.LFG(a.O),u.LFG(p.Vn))};static#t=this.\u0275prov=u.Yz7({token:c,factory:c.\u0275fac,providedIn:"root"})}return c})()},9559:(h,l,r)=>{r.d(l,{K:()=>o});var d=r(5879);let o=(()=>{class i{constructor(){this.countryCodes=[{code:"+54",name:"Argentina"},{code:"+61",name:"Australia"},{code:"+43",name:"Austria"},{code:"+32",name:"Belgium"},{code:"+55",name:"Brazil"},{code:"+1",name:"Canada"},{code:"+56",name:"Chile"},{code:"+57",name:"Colombia"},{code:"+506",name:"Costa Rica"},{code:"+593",name:"Ecuador"},{code:"+503",name:"El Salvador"},{code:"+33",name:"France"},{code:"+49",name:"Germany"},{code:"+502",name:"Guatemala"},{code:"+504",name:"Honduras"},{code:"+91",name:"India"},{code:"+353",name:"Ireland"},{code:"+39",name:"Italy"},{code:"+52",name:"Mexico"},{code:"+31",name:"Netherlands"},{code:"+505",name:"Nicaragua"},{code:"+47",name:"Norway"},{code:"+507",name:"Panama"},{code:"+595",name:"Paraguay"},{code:"+51",name:"Peru"},{code:"+351",name:"Portugal"},{code:"+1-787",name:"Puerto Rico"},{code:"+1-939",name:"Puerto Rico"},{code:"+7",name:"Russia"},{code:"+34",name:"Spain"},{code:"+46",name:"Sweden"},{code:"+41",name:"Switzerland"},{code:"+1-868",name:"Trinidad and Tobago"},{code:"+44",name:"United Kingdom"},{code:"+1",name:"United States"},{code:"+598",name:"Uruguay"},{code:"+58",name:"Venezuela"}]}findCountryCode(a){const p=this.countryCodes.find(s=>s.name===a);return p?p.code:null}static#e=this.\u0275fac=function(p){return new(p||i)};static#t=this.\u0275prov=d.Yz7({token:i,factory:i.\u0275fac,providedIn:"root"})}return i})()},1944:(h,l,r)=>{r.d(l,{J:()=>u});var d=r(553),o=r(5879),i=r(2065);let u=(()=>{class a{constructor(s){this._httpWrapper=s,this.baseUrl=d.N.apiUrl,this.enviroment=d.N}livenessDemo(s){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/face-recognition/liveness/demo`,s)}static#e=this.\u0275fac=function(c){return new(c||a)(o.LFG(i.O))};static#t=this.\u0275prov=o.Yz7({token:a,factory:a.\u0275fac,providedIn:"root"})}return a})()}}]);