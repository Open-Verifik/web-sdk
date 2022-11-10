"use strict";(self.webpackChunkverifik_sdk_app=self.webpackChunkverifik_sdk_app||[]).push([[629],{5629:function(t,e,o){o.r(e),o.d(e,{PasswordlessModule:function(){return Ct}});var i=o(38583),n=o(42096),r=o(51095),s=o(98295),a=o(76627),c=o(49983),l=o(45396),p=o(11436),m=o(7853),u=o(44466),d=o(77001),g=o(7539),h=o(33935),f=o(58341),Z=o(21554),_=o(82120),x=o(4885),b=o(12178),A=o(67441),w=o(99835),I=o(65939),T=o(23017),q=o(43220),v=o(72458),y=o(37716),F=o(63423);let L=(()=>{class t{constructor(){}ngOnInit(){}}return t.\u0275fac=function(e){return new(e||t)},t.\u0275cmp=y.Xpm({type:t,selectors:[["app-passwordless-root"]],decls:1,vars:0,template:function(t,e){1&t&&y._UZ(0,"router-outlet")},directives:[F.lC],styles:[""]}),t})();var J=o(45966),O=o(28288),k=o(3679),U=o(79765),C=o(16738),j=o.n(C),Q=o(13653),N=o(46782),P=o(26215),S=o(92340),Y=o(93342),D=o(25187);let R=(()=>{class t{constructor(t){this._httpWrapper=t,this.baseUrl=S.N.baseUrl,this._currentProject=new P.X(null)}get currentProject$(){return this._currentProject.asObservable()}sendEmailValidation(t,e){return this._httpWrapper.sendRequest("post",`${this.baseUrl}v2/projects/email-login`,{email:e,id:t,type:"login"}).pipe((0,Y.b)(t=>{}))}sendPhoneValidation(t,e,o){return this._httpWrapper.sendRequest("post",`${this.baseUrl}v2/projects/phone-login`,{phone:o,countryCode:e,id:t,type:"login"}).pipe((0,Y.b)(t=>{}))}confirmEmailValidation(t,e,o,i){return this._httpWrapper.sendRequest("post",`${this.baseUrl}v2/projects/email-login/confirm`,{email:e,otp:o,id:t,authenticatorOTP:i,type:"login",ipData:JSON.parse(localStorage.getItem("ipData"))}).pipe((0,Y.b)(t=>{}))}confirmPhoneValidation(t,e,o,i,n){return this._httpWrapper.sendRequest("post",`${this.baseUrl}v2/projects/phone-login/confirm`,{phone:o,otp:i,countryCode:e,id:t,authenticatorOTP:n,type:"login",ipData:JSON.parse(localStorage.getItem("ipData"))}).pipe((0,Y.b)(t=>{}))}}return t.\u0275fac=function(e){return new(e||t)(y.LFG(D.O))},t.\u0275prov=y.Yz7({token:t,factory:t.\u0275fac,providedIn:"root"}),t})();var V=o(51374);let B=(()=>{class t{constructor(t){this._httpWrapper=t,this.baseUrl=S.N.baseUrl}getGeoLocation(){return this._httpWrapper.sendRequest("get","https://ipv4.am.i.mullvad.net/json")}}return t.\u0275fac=function(e){return new(e||t)(y.LFG(D.O))},t.\u0275prov=y.Yz7({token:t,factory:t.\u0275fac,providedIn:"root"}),t})();var M=o(57408),E=o(13994);function H(t,e){if(1&t&&(y.TgZ(0,"fuse-alert",25),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t){const t=y.oxw(3);y.Q6J("appearance","outline")("showIcon",!1)("type",t.alert.type)("@shake","error"===t.alert.type),y.xp6(1),y.hij(" ",y.lcZ(2,5,"errors."+t.alert.message)," ")}}function $(t,e){1&t&&(y.TgZ(0,"mat-error",30),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.required_email")," "))}function G(t,e){1&t&&(y.TgZ(0,"mat-error",30),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.invalid_email")," "))}function W(t,e){1&t&&y._UZ(0,"mat-icon",36),2&t&&y.Q6J("svgIcon","heroicons_solid:eye")}function z(t,e){1&t&&y._UZ(0,"mat-icon",36),2&t&&y.Q6J("svgIcon","heroicons_solid:eye-off")}function X(t,e){if(1&t){const t=y.EpF();y.TgZ(0,"mat-form-field",31),y.TgZ(1,"mat-label"),y._uU(2),y.ALo(3,"transloco"),y.qZA(),y._UZ(4,"input",32,33),y.TgZ(6,"button",34),y.NdJ("click",function(){y.CHM(t);const e=y.MAs(5);return e.type="password"===e.type?"text":"password"}),y.YNc(7,W,1,1,"mat-icon",35),y.YNc(8,z,1,1,"mat-icon",35),y.qZA(),y.TgZ(9,"mat-error"),y._uU(10," OTP is required "),y.qZA(),y.qZA()}if(2&t){const t=y.MAs(5);y.xp6(2),y.Oqu(y.lcZ(3,4,"login.email_otp")),y.xp6(2),y.Q6J("formControlName","emailOTP"),y.xp6(3),y.Q6J("ngIf","password"===t.type),y.xp6(1),y.Q6J("ngIf","text"===t.type)}}function K(t,e){if(1&t&&(y.TgZ(0,"mat-form-field",26),y.TgZ(1,"mat-label"),y._uU(2),y.ALo(3,"transloco"),y.qZA(),y._UZ(4,"input",27),y.YNc(5,$,3,3,"mat-error",28),y.YNc(6,G,3,3,"mat-error",28),y.qZA(),y.YNc(7,X,11,6,"mat-form-field",29)),2&t){const t=y.oxw(3);y.xp6(2),y.Oqu(y.lcZ(3,5,"login.email")),y.xp6(2),y.Q6J("formControlName","email"),y.xp6(1),y.Q6J("ngIf",t.signInForm.get("email").hasError("required")),y.xp6(1),y.Q6J("ngIf",t.signInForm.get("email").hasError("email")),y.xp6(1),y.Q6J("ngIf",t.emailSent)}}function tt(t,e){if(1&t&&(y.ynx(0),y.TgZ(1,"mat-option",46),y.TgZ(2,"span",43),y.TgZ(3,"span",47),y._uU(4),y.qZA(),y.TgZ(5,"span",48),y._uU(6),y.qZA(),y.qZA(),y.qZA(),y.BQk()),2&t){const t=e.$implicit;y.xp6(1),y.Q6J("value",t.code),y.xp6(3),y.Oqu(t.name),y.xp6(2),y.Oqu(t.code)}}function et(t,e){if(1&t&&(y.TgZ(0,"mat-select",42),y.TgZ(1,"mat-select-trigger"),y.TgZ(2,"span",43),y.TgZ(3,"span",44),y._uU(4),y.qZA(),y.qZA(),y.qZA(),y.YNc(5,tt,7,3,"ng-container",45),y.qZA()),2&t){const t=y.oxw(5);y.Q6J("formControl",t.signInForm.get("countryCode")),y.xp6(4),y.Oqu(t.signInForm.get("countryCode").value),y.xp6(1),y.Q6J("ngForOf",t.countries)("ngForTrackBy",t.trackByFn)}}function ot(t,e){1&t&&(y.TgZ(0,"mat-error",30),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.required_phone")," "))}function it(t,e){1&t&&(y.TgZ(0,"mat-error",30),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.invalid_phone")," "))}function nt(t,e){if(1&t&&(y.TgZ(0,"mat-form-field",49),y.TgZ(1,"mat-label"),y._uU(2),y.ALo(3,"transloco"),y.qZA(),y._UZ(4,"input",50),y.YNc(5,ot,3,3,"mat-error",28),y.YNc(6,it,3,3,"mat-error",28),y.qZA()),2&t){const t=y.oxw(5);y.xp6(2),y.Oqu(y.lcZ(3,4,"login.phone")),y.xp6(2),y.Q6J("formControlName","phone"),y.xp6(1),y.Q6J("ngIf",t.signInForm.get("phone").hasError("required")),y.xp6(1),y.Q6J("ngIf",t.signInForm.get("phone").hasError("phone"))}}function rt(t,e){if(1&t&&(y.TgZ(0,"div",38),y.TgZ(1,"mat-form-field",39),y.TgZ(2,"mat-label"),y._uU(3),y.ALo(4,"transloco"),y.qZA(),y.YNc(5,et,6,4,"mat-select",40),y.qZA(),y.YNc(6,nt,7,6,"mat-form-field",41),y.qZA()),2&t){const t=y.oxw(4);y.xp6(3),y.Oqu(y.lcZ(4,3,"login.country_code")),y.xp6(2),y.Q6J("ngIf",t.countries),y.xp6(1),y.Q6J("ngIf",t.groupFields.phone)}}function st(t,e){1&t&&y._UZ(0,"mat-icon",36),2&t&&y.Q6J("svgIcon","heroicons_solid:eye")}function at(t,e){1&t&&y._UZ(0,"mat-icon",36),2&t&&y.Q6J("svgIcon","heroicons_solid:eye-off")}function ct(t,e){if(1&t){const t=y.EpF();y.TgZ(0,"mat-form-field",31),y.TgZ(1,"mat-label"),y._uU(2),y.ALo(3,"transloco"),y.qZA(),y._UZ(4,"input",51,33),y.TgZ(6,"button",34),y.NdJ("click",function(){y.CHM(t);const e=y.MAs(5);return e.type="password"===e.type?"text":"password"}),y.YNc(7,st,1,1,"mat-icon",35),y.YNc(8,at,1,1,"mat-icon",35),y.qZA(),y.TgZ(9,"mat-error",30),y._uU(10),y.ALo(11,"transloco"),y.qZA(),y.qZA()}if(2&t){const t=y.MAs(5);y.xp6(2),y.hij(" ",y.lcZ(3,5,"login.phone_otp"),""),y.xp6(2),y.Q6J("formControlName","phoneOTP"),y.xp6(3),y.Q6J("ngIf","password"===t.type),y.xp6(1),y.Q6J("ngIf","text"===t.type),y.xp6(2),y.hij(" ",y.lcZ(11,7,"login.code_is_required")," ")}}function lt(t,e){if(1&t&&(y.YNc(0,rt,7,5,"div",37),y.YNc(1,ct,12,9,"mat-form-field",29)),2&t){const t=y.oxw(3);y.Q6J("ngIf",t.groupFields.phone),y.xp6(1),y.Q6J("ngIf",t.smsSent)}}function pt(t,e){1&t&&(y.TgZ(0,"span"),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.login_button")," "))}function mt(t,e){1&t&&y._UZ(0,"mat-progress-spinner",53),2&t&&y.Q6J("diameter",24)("mode","indeterminate")}function ut(t,e){if(1&t){const t=y.EpF();y.TgZ(0,"button",52),y.NdJ("click",function(){return y.CHM(t),y.oxw(3).signIn()}),y.YNc(1,pt,3,3,"span",20),y.YNc(2,mt,1,2,"mat-progress-spinner",21),y.qZA()}if(2&t){const t=y.oxw(3);y.Q6J("color","primary")("disabled",!t.isFormValid()),y.xp6(1),y.Q6J("ngIf",!t.signInForm.disabled),y.xp6(1),y.Q6J("ngIf",t.signInForm.disabled)}}function dt(t,e){1&t&&(y.TgZ(0,"span"),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.send_otp")," "))}function gt(t,e){1&t&&y._UZ(0,"mat-progress-spinner",53),2&t&&y.Q6J("diameter",12)("mode","indeterminate")}function ht(t,e){if(1&t&&(y.TgZ(0,"span"),y._uU(1),y.qZA()),2&t){const t=y.oxw(3);y.xp6(1),y.hij(" (",t.phoneValidation.diff,") s ")}}function ft(t,e){if(1&t&&(y.TgZ(0,"span"),y._uU(1),y.qZA()),2&t){const t=y.oxw(3);y.xp6(1),y.hij(" (",t.emailValidation.diff,") s ")}}function Zt(t,e){1&t&&(y.TgZ(0,"h3",54),y._uU(1,"O"),y.qZA())}function _t(t,e){1&t&&y._UZ(0,"mat-progress-spinner",53),2&t&&y.Q6J("diameter",12)("mode","indeterminate")}function xt(t,e){if(1&t){const t=y.EpF();y.TgZ(0,"button",55),y.NdJ("click",function(){return y.CHM(t),y.oxw(3).startBiometric()}),y.TgZ(1,"span"),y._uU(2),y.ALo(3,"transloco"),y.qZA(),y.YNc(4,_t,1,2,"mat-progress-spinner",21),y.qZA()}if(2&t){const t=y.oxw(3);y.Q6J("disabled",!t.canUseBiometrics()),y.xp6(2),y.hij(" ",y.lcZ(3,3,"login.use_biometrics_button")," "),y.xp6(2),y.Q6J("ngIf",!t.biometricsReady)}}const bt=function(t){return["/kyc/project/",t]};function At(t,e){if(1&t){const t=y.EpF();y.TgZ(0,"div",3),y.TgZ(1,"div",4),y.TgZ(2,"div",5),y.TgZ(3,"div",6),y._UZ(4,"img",7),y.qZA(),y.TgZ(5,"div",8),y._uU(6),y.qZA(),y.qZA(),y.TgZ(7,"div",9),y._uU(8),y.ALo(9,"transloco"),y._UZ(10,"br"),y._uU(11),y.ALo(12,"transloco"),y.qZA(),y.TgZ(13,"div",10),y.TgZ(14,"div"),y._uU(15),y.ALo(16,"transloco"),y.qZA(),y.TgZ(17,"a",11),y._uU(18),y.ALo(19,"transloco"),y.qZA(),y.qZA(),y.YNc(20,H,3,7,"fuse-alert",12),y.TgZ(21,"form",13),y.TgZ(22,"mat-tab-group",14),y.NdJ("selectedTabChange",function(e){return y.CHM(t),y.oxw(2).selectLogin(e)}),y.TgZ(23,"mat-tab",15),y.ALo(24,"transloco"),y.YNc(25,K,8,7,"ng-template",16),y.qZA(),y.TgZ(26,"mat-tab",15),y.ALo(27,"transloco"),y.YNc(28,lt,2,2,"ng-template",16),y.qZA(),y.qZA(),y.TgZ(29,"div",17),y.YNc(30,ut,3,4,"button",18),y.TgZ(31,"button",19),y.NdJ("click",function(e){return y.CHM(t),y.oxw(2).sendOTP(e)}),y.YNc(32,dt,3,3,"span",20),y.YNc(33,gt,1,2,"mat-progress-spinner",21),y.YNc(34,ht,2,1,"span",20),y.YNc(35,ft,2,1,"span",20),y.qZA(),y.YNc(36,Zt,2,0,"h3",22),y.YNc(37,xt,5,5,"button",23),y.qZA(),y.qZA(),y.TgZ(38,"div",24),y._UZ(39,"languages"),y.qZA(),y.qZA(),y.qZA()}if(2&t){const t=y.oxw(2);y.xp6(4),y.Q6J("src",t.project.branding.logo,y.LSH),y.xp6(2),y.Oqu(t.project.name),y.xp6(2),y.hij(" ",y.lcZ(9,22,"login.title_1"),","),y.xp6(3),y.hij(" ",y.lcZ(12,24,"login.title_2")," "),y.xp6(4),y.hij("",y.lcZ(16,26,"login.no_account")," "),y.xp6(2),y.Q6J("routerLink",y.VKq(34,bt,t.project._id)),y.xp6(1),y.Oqu(y.lcZ(19,28,"login.register_here_link")),y.xp6(2),y.Q6J("ngIf",t.showAlert),y.xp6(1),y.Q6J("formGroup",t.signInForm),y.xp6(1),y.s9C("selectedIndex","email"==t.typeLogin?0:1),y.xp6(1),y.s9C("label",y.lcZ(24,30,"login.email")),y.s9C("disabled",!t.projectFlow.email),y.xp6(3),y.s9C("label",y.lcZ(27,32,"login.phone")),y.s9C("disabled",!t.projectFlow.phone),y.xp6(4),y.Q6J("ngIf",!t.activeSendOtp),y.xp6(1),y.Q6J("disabled",!t.activeSendOtp),y.xp6(1),y.Q6J("ngIf",t.activeSendOtp),y.xp6(1),y.Q6J("ngIf",!t.activeSendOtp),y.xp6(1),y.Q6J("ngIf","phone"==t.typeLogin&&t.smsSent),y.xp6(1),y.Q6J("ngIf","email"==t.typeLogin&&t.emailSent),y.xp6(1),y.Q6J("ngIf",t.projectFlow.faceLiveness),y.xp6(1),y.Q6J("ngIf",t.projectFlow.faceLiveness)}}function wt(t,e){1&t&&(y.TgZ(0,"h2",60),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.two_factor_title")," "))}function It(t,e){1&t&&(y.TgZ(0,"p"),y._uU(1),y.ALo(2,"transloco"),y.TgZ(3,"a",64),y._uU(4,"Authy"),y.qZA(),y._uU(5,", "),y.TgZ(6,"a",65),y._uU(7,"Google Authenticator"),y.qZA(),y._uU(8),y.ALo(9,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,2,"login.two_factor_description_1")," "),y.xp6(7),y.hij(" ",y.lcZ(9,4,"login.two_factor_description_2")," "))}function Tt(t,e){1&t&&(y.TgZ(0,"h2",60),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.two_factor_second_time_title")," "))}function qt(t,e){1&t&&(y.TgZ(0,"p"),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.two_factor_second_time_description")," "))}function vt(t,e){1&t&&(y.TgZ(0,"mat-error",30),y._uU(1),y.ALo(2,"transloco"),y.qZA()),2&t&&(y.xp6(1),y.hij(" ",y.lcZ(2,1,"login.required_authenticator_otp")," "))}function yt(t,e){if(1&t){const t=y.EpF();y.TgZ(0,"div",3),y.TgZ(1,"div",56),y.TgZ(2,"div",5),y.TgZ(3,"div",6),y._UZ(4,"img",7),y.qZA(),y.TgZ(5,"div",8),y._uU(6),y.qZA(),y.qZA(),y.TgZ(7,"div",57),y.YNc(8,wt,3,3,"h2",58),y.YNc(9,It,10,6,"p",20),y.YNc(10,Tt,3,3,"h2",58),y.YNc(11,qt,3,3,"p",20),y._UZ(12,"img",59),y.TgZ(13,"h2",60),y._uU(14),y.qZA(),y.TgZ(15,"form",61),y.TgZ(16,"mat-form-field",26),y.TgZ(17,"mat-label"),y._uU(18),y.ALo(19,"transloco"),y.qZA(),y._UZ(20,"input",62),y.YNc(21,vt,3,3,"mat-error",28),y.qZA(),y.qZA(),y.TgZ(22,"button",63),y.NdJ("click",function(){return y.CHM(t),y.oxw(2).signIn()}),y.TgZ(23,"span"),y._uU(24),y.ALo(25,"transloco"),y.qZA(),y.qZA(),y.qZA(),y.qZA(),y.TgZ(26,"div",24),y._UZ(27,"languages"),y.qZA(),y.qZA()}if(2&t){const t=y.oxw(2);y.xp6(4),y.Q6J("src",t.project.branding.logo,y.LSH),y.xp6(2),y.Oqu(t.project.name),y.xp6(2),y.Q6J("ngIf",t.secondFactorData.QRCode),y.xp6(1),y.Q6J("ngIf",t.secondFactorData.QRCode),y.xp6(1),y.Q6J("ngIf",!t.secondFactorData.QRCode),y.xp6(1),y.Q6J("ngIf",!t.secondFactorData.QRCode),y.xp6(1),y.Q6J("src",t.secondFactorData.QRCode,y.LSH),y.xp6(2),y.hij(" ",t.secondFactorData.secretKey," "),y.xp6(1),y.Q6J("formGroup",t.secondFactorForm),y.xp6(3),y.Oqu(y.lcZ(19,14,"login.two_factor_label")),y.xp6(2),y.Q6J("formControlName","authenticatorOTP"),y.xp6(1),y.Q6J("ngIf",t.secondFactorForm.get("authenticatorOTP").hasError("required")),y.xp6(1),y.Q6J("disabled",!t.secondFactorForm.valid),y.xp6(2),y.hij(" ",y.lcZ(25,16,"login.login_button")," ")}}function Ft(t,e){if(1&t&&(y.TgZ(0,"div",1),y.YNc(1,At,40,36,"div",2),y.YNc(2,yt,28,18,"div",2),y.qZA()),2&t){const t=y.oxw();y.xp6(1),y.Q6J("ngIf",!t.secondFactorData),y.xp6(1),y.Q6J("ngIf",t.secondFactorData&&t.secondFactorForm)}}let Lt=(()=>{class t{constructor(t,e,o,i,n){this._passwordlessService=t,this._kycService=e,this._formBuilder=o,this._changeDetectorRef=i,this._CoreService=n,this.alert={type:"success",message:""},this.showAlert=!1,this._unsubscribeAll=new U.xQ,this.countries=this._kycService.countryCodes}ngOnDestroy(){this._unsubscribeAll.next(null)}ngOnInit(){this._ObserveProject(),this._initForm(),this.checkIP(),!this._biometric&&(this.biometricsReady=!1,this._biometric=new J.u(this._kycService,t=>{t&&this._biometric.startSession()}),this._biometric.session$.pipe((0,Q.T)(1)).pipe((0,N.R)(this._unsubscribeAll)).subscribe(t=>{this.biometricsReady=t}),this._biometric.error$.pipe((0,Q.T)(1)).pipe((0,N.R)(this._unsubscribeAll)).subscribe(t=>{this.errorLogin(t),this.biometricsReady=!1,this._biometric.startSession()}),this._biometric.auth$.pipe((0,Q.T)(1)).pipe((0,N.R)(this._unsubscribeAll)).subscribe(t=>{this.successLogin(t),this.biometricsReady=!1,this._biometric.startSession()}))}checkIP(){this.ipData=localStorage.getItem("ipData"),this.ipData?this.ipData=JSON.parse(this.ipData):this._CoreService.getGeoLocation().subscribe(t=>{this.ipData={ip:t.ip,ipCountry:t.country,ipCity:t.city,ipLatitude:t.latitude,ipLongitude:t.longitude},localStorage.setItem("ipData",JSON.stringify(this.ipData))})}_ObserveProject(){this._kycService.currentProject$.pipe((0,N.R)(this._unsubscribeAll)).subscribe(t=>{this.project=t,this.projectFlow=t.currentProjectFlow,this._changeDetectorRef.markForCheck()})}_initForm(){this.typeLogin=this.projectFlow.email?"email":"phone",this.buttonSendOtp(),this.setFieldRequiredInForm(),this._init2FAForm()}_init2FAForm(){this.secondFactorForm=this._formBuilder.group({authenticatorOTP:["",[k.kI.required,k.kI.minLength(6)]]})}sendOTP(t){switch(t.preventDefault(),this.typeLogin){case"email":this._passwordlessService.sendEmailValidation(this.project._id,this.signInForm.value.email).subscribe(t=>{this.emailValidation=t.data,this.emailSent=!0,this.startTimer(this.typeLogin)},t=>{this.errorLogin(t.error.message)});break;case"phone":this._passwordlessService.sendPhoneValidation(this.project._id,this.signInForm.value.countryCode,this.signInForm.value.phone).subscribe(t=>{this.phoneValidation=t.data,this.smsSent=!0,this.startTimer(this.typeLogin)},t=>{this.errorLogin(t.error.message)})}}startTimer(t){let e;switch(t){case"email":if(!this.emailValidation)return 0;this.emailValidation.diff=j()(this.emailValidation.expiresAt).diff(new Date,"seconds")-780,e=setInterval(()=>{this.emailValidation.diff>0?this.emailValidation.diff--:(clearInterval(e),this.emailSent=!1,this.emailValidation=null),this.buttonSendOtp(),this._changeDetectorRef.detectChanges()},1e3);break;case"phone":if(!this.phoneValidation)return 0;this.phoneValidation.diff=j()(this.phoneValidation.expiresAt).diff(new Date,"seconds")-780,e=setInterval(()=>{this.phoneValidation.diff>0?this.phoneValidation.diff--:(clearInterval(e),this.smsSent=!1,this.phoneValidation=null),this.buttonSendOtp(),this._changeDetectorRef.detectChanges()},1e3)}}signIn(){const t=this.signInForm.value;switch(this.typeLogin){case"email":this._passwordlessService.confirmEmailValidation(this.project._id,t.email,t.emailOTP,this.secondFactorForm.value.authenticatorOTP).subscribe(e=>e.data.message?(this.secondFactorData=e.data,void(this.secondFactorData.emailOTP=t.emailOTP)):this.successLogin(e.data),t=>{console.log({err:t.error.message}),this.errorLogin(t.error.message)});break;case"phone":this._passwordlessService.confirmPhoneValidation(this.project._id,t.countryCode,t.phone,t.phoneOTP,this.secondFactorForm.value.authenticatorOTP).subscribe(e=>{if(e.data)return e.data.message?(this.secondFactorData=e.data,void(this.secondFactorData.phoneOTP=t.phoneOTP)):this.successLogin(e.data)},t=>{this.errorLogin(t.error.message)})}}isFormValid(){return Boolean(this.signInForm.valid)}startBiometric(){this._biometric.startAuth(this.project._id,this.signInForm.value.phone,this.signInForm.value.email)}errorLogin(t){this.alert={type:"error",message:t},console.log({errorLogin:t}),this.showAlert=!0,this._changeDetectorRef.detectChanges(),setTimeout(()=>{this.showAlert=!1,this._changeDetectorRef.detectChanges()},1e4)}successLogin(t){window.location.href=`${this.projectFlow.redirectUrl}?type=login&token=${t}`}buttonSendOtp(){this.activeSendOtp="email"===this.typeLogin?this.projectFlow.email&&!this.emailSent:this.projectFlow.phone&&!this.smsSent}setFieldRequiredInForm(){switch(this.groupFields={email:[,],emailOTP:[,],countryCode:[,],phone:[,],phoneOTP:[,]},this.typeLogin){case"email":this.groupFields.email[1]=[k.kI.required,k.kI.email],this.groupFields.emailOTP[1]=[k.kI.required,k.kI.minLength(6)];break;case"phone":this.groupFields.countryCode[1]=[k.kI.required],this.groupFields.phone[1]=[k.kI.required],this.groupFields.phoneOTP[1]=[k.kI.required,k.kI.minLength(6)]}this.signInForm=this._formBuilder.group(this.groupFields)}selectLogin(t){this.groupFields={},this.typeLogin=t.index?"phone":"email",this.setFieldRequiredInForm(),this.buttonSendOtp(),this._changeDetectorRef.markForCheck()}canUseBiometrics(){const t="email"===this.typeLogin?Boolean(this.signInForm.value.email):Boolean(this.signInForm.value.countryCode&&this.signInForm.value.phone);return Boolean(this.biometricsReady&&t)}}return t.\u0275fac=function(e){return new(e||t)(y.Y36(R),y.Y36(V.y),y.Y36(k.qu),y.Y36(y.sBO),y.Y36(B))},t.\u0275cmp=y.Xpm({type:t,selectors:[["app-passwordless-login"]],decls:1,vars:1,consts:[["class","flex flex-col flex-auto items-center sm:justify-center min-w-0",4,"ngIf"],[1,"flex","flex-col","flex-auto","items-center","sm:justify-center","min-w-0"],["class","w-full sm:w-auto py-8 px-4 sm:p-12 sm:rounded-2xl sm:shadow sm:bg-card mx-auto main-card",4,"ngIf"],[1,"w-full","sm:w-auto","py-8","px-4","sm:p-12","sm:rounded-2xl","sm:shadow","sm:bg-card","mx-auto","main-card"],[1,"w-full","mx-auto","mx-auto","sm:mx-0",2,"max-width","500px"],[1,"w-full","grid","grid-cols-4"],[1,"w-12"],[3,"src"],[1,"mt-3","text-2xl","font-extrabold","tracking-tight","leading-tight","col-span-3"],[1,"mt-8","text-4xl","font-extrabold","tracking-tight","leading-tight"],[1,"flex","items-baseline","mt-0.5","font-medium"],[1,"ml-1","text-primary-500","hover:underline",3,"routerLink"],["class","mt-8 -mb-4",3,"appearance","showIcon","type",4,"ngIf"],[1,"mt-8",3,"formGroup"],[3,"selectedIndex","selectedTabChange"],[3,"label","disabled"],["matTabContent",""],[1,"flex","flex-col","flex-auto","w-full","items-center","sm:justify-center"],["class","fuse-mat-button-large w-full","mat-flat-button","",3,"color","disabled","click",4,"ngIf"],["mat-stroked-button","","color","primary",1,"w-full","mt-4",3,"disabled","click"],[4,"ngIf"],[3,"diameter","mode",4,"ngIf"],["class","m-2",4,"ngIf"],["mat-stroked-button","","class","w-full","color","primary",3,"disabled","click",4,"ngIf"],[1,"w-full","text-center","mt-6"],[1,"mt-8","-mb-4",3,"appearance","showIcon","type"],[1,"w-full","mt-4"],["id","email","matInput","",3,"formControlName"],["class","p-1",4,"ngIf"],["class","w-full",4,"ngIf"],[1,"p-1"],[1,"w-full"],["id","emailOTP","matInput","","type","password",3,"formControlName"],["passwordField",""],["mat-icon-button","","type","button","matSuffix","",3,"click"],["class","icon-size-5",3,"svgIcon",4,"ngIf"],[1,"icon-size-5",3,"svgIcon"],["class","grid grid-flow-col mt-4",4,"ngIf"],[1,"grid","grid-flow-col","mt-4"],[1,"w-120px"],["matPrefix","",3,"formControl",4,"ngIf"],["class","w-full col-span-3",4,"ngIf"],["matPrefix","",3,"formControl"],[1,"flex","items-center"],[1,"sm:mx-0.5","font-medium","text-default"],[4,"ngFor","ngForOf","ngForTrackBy"],[3,"value"],[1,"ml-2"],[1,"ml-2","font-medium"],[1,"w-full","col-span-3"],["id","phone","matInput","",3,"formControlName"],["id","phoneOTP","matInput","","type","password",3,"formControlName"],["mat-flat-button","",1,"fuse-mat-button-large","w-full",3,"color","disabled","click"],[3,"diameter","mode"],[1,"m-2"],["mat-stroked-button","","color","primary",1,"w-full",3,"disabled","click"],[1,"w-full","mx-auto","mx-auto","sm:mx-0"],[1,"m-5","text-center"],["class","m-2 verifikH3",4,"ngIf"],["alt","",3,"src"],[1,"m-2","verifikH3"],[1,"",3,"formGroup"],["id","authenticatorOTP","matInput","",3,"formControlName"],["mat-stroked-button","","color","primary",1,"w-full","mt-4","mainVerifikButton",3,"disabled","click"],["href","https://authy.com/download/"],["href","https://support.google.com/accounts/answer/1066447?hl=en&co=GENIE.Platform%3DiOS"]],template:function(t,e){1&t&&y.YNc(0,Ft,3,2,"div",0),2&t&&y.Q6J("ngIf",e.project)},directives:[i.O5,F.yS,k._Y,k.JL,k.sg,I.SP,I.uX,I.Vc,r.lW,M.v,E.W,s.KE,s.hX,c.Nt,k.Fj,k.JJ,k.u,s.TO,s.R9,a.Hw,A.gD,s.qo,k.oH,A.$L,i.sg,v.ey,x.Ou],pipes:[n.Ot],styles:[".main-card[_ngcontent-%COMP%]{width:500px!important}.w-120px[_ngcontent-%COMP%]{width:95%!important}@media only screen and (max-width: 595px){.main-card[_ngcontent-%COMP%]{width:100%!important}}@media only screen and (min-width: 600px){.main-card[_ngcontent-%COMP%]{width:100%!important}}@media only screen and (min-width: 768px){.main-card[_ngcontent-%COMP%]{width:500px!important}}@media only screen and (min-width: 889px){.main-card[_ngcontent-%COMP%]{width:500px!important}}@media only screen and (min-width: 1200px){.main-card[_ngcontent-%COMP%]{width:500px!important}}"],data:{animation:O.L}}),t})();var Jt=o(40205),Ot=o(5304);const kt=[{path:"",component:L,resolve:{},children:[{path:"auth/:id",pathMatch:"full",component:Lt,resolve:{project:(()=>{class t{constructor(t,e){this._router=t,this._kycService=e}resolve(t,e){return this._kycService.getProjectForNewKYC(t.params.id,"login").pipe((0,Ot.K)(t=>{console.error({message:t.message});const o=e.url.split("/").slice(0,-1).join("/");return this._router.navigateByUrl(o),(0,Jt._)(t)}))}}return t.\u0275fac=function(e){return new(e||t)(y.LFG(F.F0),y.LFG(V.y))},t.\u0275prov=y.Yz7({token:t,factory:t.\u0275fac,providedIn:"root"}),t})()}}]}];var Ut=o(10588);let Ct=(()=>{class t{}return t.\u0275fac=function(e){return new(e||t)},t.\u0275mod=y.oAB({type:t}),t.\u0275inj=y.cJS({imports:[[F.Bz.forChild(kt),i.ez,n.y4,r.ot,s.lN,a.Ps,c.c,l.rP,p.AV,m.V,u.m,d.ZX,g.p9,h.Tx,f.Hi,Z.Bb,_.k,x.Cq,b.Cv,A.LD,w.y,I.Nh,T.SJ,q.FA,v.XK,Ut.fC]]}),t})()}}]);