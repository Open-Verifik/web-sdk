"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[592],{4771:(u,h,r)=>{r.d(h,{i:()=>c});var l=r(553),i=r(9397),_=r(8533),p=r(5879),n=r(2065),v=r(8991);let c=(()=>{class a{constructor(t,e){this._httpWrapper=t,this._translocoService=e,this.baseUrl=l.N.apiUrl}requestProject(t,e="onboarding"){return this._httpWrapper.sendRequest("get",`${this.baseUrl}/v2/projects/kyc`,{id:t}).pipe((0,i.b)(o=>{this.currentProject=new _.XR({...o.data,type:e})}))}sendEmailValidation(t,e){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations`,{email:t,project:this.currentProject._id,projectFlow:this.currentProject.currentProjectFlow._id,type:"login",validationMethod:"verificationCode",language:this._translocoService.getActiveLang(),location:e}).pipe((0,i.b)(o=>{}))}sendPhoneValidation(t,e,o,s){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations`,{phone:e,countryCode:t,projectFlow:this.currentProject.currentProjectFlow._id,project:this.currentProject._id,phoneGateway:o,type:"login",language:this._translocoService.getActiveLang(),validationMethod:"verificationCode",location:s}).pipe((0,i.b)(d=>{}))}confirmPhoneValidation(t,e,o,s,d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations/validate`,{projectFlow:this.currentProject.currentProjectFlow._id,countryCode:t,phone:e,otp:o,authenticatorOTP:s,type:"login",location:d}).pipe((0,i.b)(P=>{}))}confirmEmailValidation(t,e,o,s){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations/validate`,{email:t,otp:e,projectFlow:this.currentProject.currentProjectFlow._id,location:s}).pipe((0,i.b)(d=>{}))}getProject(){return this.currentProject}biometricsSignIn(t){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/projects/biometrics/sign-in`,t)}createLivenessSession(t){const e=localStorage.getItem("accessToken"),o=localStorage.getItem("loginLocation");o&&(t.location=JSON.parse(o));let s=`${this.baseUrl}/v2/biometric-validations`;return e&&(s+="/app-login"),this._httpWrapper.sendRequest("post",s,{...t,projectFlow:this.currentProject.currentProjectFlow._id,project:this.currentProject._id},{Headers:{Authorization:e?`Bearer ${e}`:""}})}validateBiometrics(t){const e=localStorage.getItem("loginLocation");return e&&(t.location=JSON.parse(e)),this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/biometric-validations/validate`,t)}createAppRegistration(t){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations`,t)}static#t=this.\u0275fac=function(e){return new(e||a)(p.LFG(n.O),p.LFG(v.Vn))};static#e=this.\u0275prov=p.Yz7({token:a,factory:a.\u0275fac,providedIn:"root"})}return a})()},1944:(u,h,r)=>{r.d(h,{J:()=>p});var l=r(553),i=r(5879),_=r(2065);let p=(()=>{class n{constructor(c){this._httpWrapper=c,this.baseUrl=l.N.apiUrl,this.enviroment=l.N}livenessDemo(c){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/face-recognition/liveness/demo`,c)}static#t=this.\u0275fac=function(a){return new(a||n)(i.LFG(_.O))};static#e=this.\u0275prov=i.Yz7({token:n,factory:n.\u0275fac,providedIn:"root"})}return n})()}}]);