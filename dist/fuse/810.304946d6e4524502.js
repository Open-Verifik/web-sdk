"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[810],{5810:(T,x,r)=>{r.r(x),r.d(x,{default:()=>vt});var C=r(5861),g=r(3403),b=r(4748),m=r(553),v=r(8533),f=r(6814),w=r(1447),_=r(8991),d=r(6223),a=r(2296),c=r(5986),p=r(1043),u=r(617),y=r(4516),R=r(5940),A=r(4913),j=r(738),q=r(6321),U=r(4825),k=r(6676),L=r.n(k),S=r(6420),t=r(5879),I=r(8340),F=r(6036),N=r(9559),P=r(9162),Z=r(3814),Y=r(3680);const J=["otpNgForm"],E=["signUpNgForm"],Q=function(o){return{destination:o}};function G(o,s){if(1&o&&(t.TgZ(0,"div",23)(1,"span"),t._uU(2),t.ALo(3,"transloco"),t.qZA()()),2&o){const i=t.oxw(2);t.xp6(2),t.hij(" ",t.xi3(3,1,"signup.verify_code_sent",t.VKq(4,Q,i.currentValidation.email||i.currentValidation.countryCode+" "+i.currentValidation.phone))," ")}}function O(o,s){1&o&&(t.TgZ(0,"div",23),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"confirmation.pick_phone_gateway_title")," "))}const K=function(o){return["/sign-up",o]};function M(o,s){if(1&o&&(t.TgZ(0,"div",24)(1,"div"),t._uU(2),t.ALo(3,"transloco"),t.qZA(),t.TgZ(4,"a",25),t._uU(5),t.ALo(6,"transloco"),t.qZA()()),2&o){const i=t.oxw(2);t.Udp("color",i.project.branding.txtColor),t.xp6(2),t.Oqu(t.lcZ(3,5,"login.no_account")),t.xp6(2),t.Q6J("routerLink",t.VKq(9,K,i.project._id)),t.xp6(1),t.Oqu(t.lcZ(6,7,"login.register_here_link"))}}function D(o,s){if(1&o&&(t.TgZ(0,"fuse-alert",26),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o){const i=t.oxw(2);t.Q6J("appearance","outline")("showIcon",!1)("type",i.alert.type)("@shake","error"===i.alert.type),t.xp6(1),t.hij(" ",t.lcZ(2,5,i.alert.message)," ")}}function W(o,s){1&o&&t._UZ(0,"mat-icon",33),2&o&&t.Q6J("svgIcon","heroicons_solid:eye")}function H(o,s){1&o&&t._UZ(0,"mat-icon",33),2&o&&t.Q6J("svgIcon","heroicons_solid:eye-slash")}function $(o,s){1&o&&(t.TgZ(0,"mat-error",34),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"login.required_otp")," "))}function B(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"mat-form-field",27)(1,"mat-label"),t._uU(2),t.ALo(3,"transloco"),t.qZA(),t.TgZ(4,"input",28,29),t.NdJ("input",function(e){t.CHM(i);const l=t.oxw(2);return t.KtG(l.onInput(e))})("keyup",function(){t.CHM(i);const e=t.oxw(2);return t.KtG(e.checkSixDigits())}),t.qZA(),t.TgZ(6,"button",30),t.NdJ("click",function(){t.CHM(i);const e=t.MAs(5);return t.KtG(e.type="password"===e.type?"text":"password")}),t.YNc(7,W,1,1,"mat-icon",31),t.YNc(8,H,1,1,"mat-icon",31),t.qZA(),t.YNc(9,$,3,3,"mat-error",32),t.qZA()}if(2&o){const i=t.MAs(5),n=t.oxw(2);t.xp6(2),t.Oqu(t.lcZ(3,5,"login.email_otp")),t.xp6(2),t.Q6J("formControlName","otp"),t.xp6(3),t.Q6J("ngIf","password"===i.type),t.xp6(1),t.Q6J("ngIf","text"===i.type),t.xp6(1),t.Q6J("ngIf",n.otpForm.get("otp").hasError("required"))}}function z(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",38),t.NdJ("click",function(e){t.CHM(i);const l=t.oxw(3);return t.KtG(l.sendPhoneOTP(e,"sms"))}),t.TgZ(1,"span"),t._uU(2," SMS "),t.qZA()()}if(2&o){const i=t.oxw(3);t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.ekj("col-span-2","both"!==i.phoneGateway),t.Q6J("disabled",!i.canSendOTP())}}function X(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",39),t.NdJ("click",function(e){t.CHM(i);const l=t.oxw(3);return t.KtG(l.sendPhoneOTP(e,"whatsapp"))}),t.TgZ(1,"span"),t._uU(2," Whatsapp "),t.qZA()()}if(2&o){const i=t.oxw(3);t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.ekj("col-span-2","both"!==i.phoneGateway),t.Q6J("disabled",!i.canSendOTP())}}function tt(o,s){if(1&o&&(t.TgZ(0,"div",35),t.YNc(1,z,3,7,"button",36),t.YNc(2,X,3,7,"button",37),t.qZA()),2&o){const i=t.oxw(2);t.xp6(1),t.Q6J("ngIf","sms"===i.phoneGateway||"both"===i.phoneGateway),t.xp6(1),t.Q6J("ngIf","whatsapp"===i.phoneGateway||"both"===i.phoneGateway)}}function it(o,s){if(1&o&&(t.TgZ(0,"span"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o){const i=t.oxw(3);t.xp6(1),t.AsE(" ",t.lcZ(2,2,"confirmation.remaining_time")," ",i.remainingTime," ")}}function ot(o,s){1&o&&(t.TgZ(0,"span"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.Oqu(t.lcZ(2,1,"confirmation.resend_code_part_one")))}function et(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"a",43),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(3);return t.KtG(e._initValidations())}),t._uU(1),t.ALo(2,"transloco"),t.qZA()}2&o&&(t.xp6(1),t.Oqu(t.lcZ(2,1,"confirmation.resend_code_part_two")))}function nt(o,s){if(1&o&&(t.TgZ(0,"div",40),t.YNc(1,it,3,4,"span",41),t.YNc(2,ot,3,3,"span",41),t.YNc(3,et,3,3,"a",42),t.qZA()),2&o){const i=t.oxw(2);t.xp6(1),t.Q6J("ngIf","Expired"!==i.remainingTime),t.xp6(1),t.Q6J("ngIf","Expired"===i.remainingTime),t.xp6(1),t.Q6J("ngIf","Expired"===i.remainingTime)}}function rt(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"div",6)(1,"div",7),t._UZ(2,"img",8),t.qZA(),t.TgZ(3,"div",9)(4,"div",10)(5,"div",11),t.YNc(6,G,4,6,"div",12),t.YNc(7,O,3,3,"div",12),t.TgZ(8,"small",13),t.NdJ("click",function(){t.CHM(i);const e=t.oxw();return t.KtG(e.showUpdatePhoneCard())}),t._uU(9),t.ALo(10,"transloco"),t.qZA(),t.YNc(11,M,7,11,"div",14),t.YNc(12,D,3,7,"fuse-alert",15),t.TgZ(13,"form",16,17),t.YNc(15,B,10,7,"mat-form-field",18),t.qZA(),t.YNc(16,tt,3,2,"div",19),t.YNc(17,nt,4,3,"div",20),t.TgZ(18,"div",21)(19,"small"),t._uU(20),t.ALo(21,"transloco"),t.qZA(),t._UZ(22,"languages",22),t.qZA()()()()()}if(2&o){const i=t.oxw();t.xp6(2),t.Q6J("src",i.project.branding.logo,t.LSH),t.xp6(4),t.Q6J("ngIf",i.currentValidation.email||i.currentValidation.phone&&"both"!==i.phoneGateway),t.xp6(1),t.Q6J("ngIf",i.currentValidation.phone&&"both"===i.phoneGateway),t.xp6(2),t.hij(" ",t.lcZ(10,12,"signup.change_your_phone_title")," "),t.xp6(2),t.Q6J("ngIf",i.kycProjectFlow),t.xp6(1),t.Q6J("ngIf",i.showAlert),t.xp6(1),t.Q6J("formGroup",i.otpForm),t.xp6(2),t.Q6J("ngIf",i.currentValidation.email||i.currentValidation.phone&&"both"!==i.phoneGateway),t.xp6(1),t.Q6J("ngIf",!i.loading&&i.currentValidation.phone&&"both"===i.phoneGateway),t.xp6(1),t.Q6J("ngIf",i.remainingTime),t.xp6(3),t.hij(" ",t.lcZ(21,14,"powered_by_verifik")," "),t.xp6(2),t.Q6J("colorText",i.project.branding.txtColor)}}function at(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",55),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(3);return t.KtG(e.continueWithoutKYC())}),t.TgZ(1,"span"),t._uU(2),t.ALo(3,"transloco"),t.qZA()()}if(2&o){const i=t.oxw(3);t.xp6(1),t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.hij("",t.lcZ(3,3,"add_biometrics.verifik_dismiss")," ")}}function st(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"div",47)(1,"div",48),t._UZ(2,"img",49),t.TgZ(3,"h2",50),t._uU(4),t.ALo(5,"transloco"),t.qZA(),t.TgZ(6,"h3",51),t._uU(7),t.ALo(8,"transloco"),t.qZA()(),t.TgZ(9,"div",52)(10,"button",53),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(2);return t.KtG(e.startKYC())}),t.TgZ(11,"span"),t._uU(12),t.ALo(13,"transloco"),t.qZA()(),t.YNc(14,at,4,5,"button",54),t.qZA()()}if(2&o){const i=t.oxw(2);t.xp6(4),t.hij(" ",t.lcZ(5,8,"add_biometrics.verifik_title")," "),t.xp6(3),t.Oqu(t.lcZ(8,10,"add_biometrics.verifik_content")),t.xp6(3),t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.xp6(2),t.hij("",t.lcZ(13,12,"add_biometrics.verifik_button")," "),t.xp6(2),t.Q6J("ngIf",i.showSkipDoingKYC)}}function ct(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",55),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(3);return t.KtG(e.continueWithoutKYC())}),t.TgZ(1,"span"),t._uU(2),t.ALo(3,"transloco"),t.qZA()()}if(2&o){const i=t.oxw(3);t.xp6(1),t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.hij(" ",t.lcZ(3,3,"add_biometrics.dismiss")," ")}}function lt(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"div",56)(1,"div",48)(2,"h1",57),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t._UZ(5,"img",58)(6,"img",59),t.TgZ(7,"h2",60),t._uU(8),t.ALo(9,"transloco"),t.qZA(),t.TgZ(10,"h3",61),t._uU(11),t.ALo(12,"transloco"),t.qZA()(),t.TgZ(13,"div",52)(14,"button",53),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(2);return t.KtG(e.startKYC())}),t.TgZ(15,"span"),t._uU(16),t.ALo(17,"transloco"),t.qZA()(),t.YNc(18,ct,4,5,"button",54),t.qZA()()}if(2&o){const i=t.oxw(2);t.xp6(2),t.Udp("color",i.project.branding.titleColor),t.xp6(1),t.AsE(" ",t.lcZ(4,14,"signup.kyc_start_popup.project_title")," ",i.project.name," "),t.xp6(4),t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.hij(" ",t.lcZ(9,16,"signup.kyc_start_popup.title")," "),t.xp6(3),t.Oqu(t.lcZ(12,18,"signup.kyc_start_popup.content")),t.xp6(3),t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.xp6(2),t.hij("",t.lcZ(17,20,"add_biometrics.button")," "),t.xp6(2),t.Q6J("ngIf",i.showSkipDoingKYC)}}function pt(o,s){if(1&o&&(t.TgZ(0,"div",44),t.YNc(1,st,15,14,"div",45),t.YNc(2,lt,19,22,"div",46),t.TgZ(3,"div",21)(4,"small"),t._uU(5),t.ALo(6,"transloco"),t.qZA(),t._UZ(7,"languages",22),t.qZA()()),2&o){const i=t.oxw();t.xp6(1),t.Q6J("ngIf",i.isVerifikProject),t.xp6(1),t.Q6J("ngIf",!i.isVerifikProject),t.xp6(3),t.hij(" ",t.lcZ(6,4,"powered_by_verifik")," "),t.xp6(2),t.Q6J("colorText",i.project.branding.txtColor)}}function dt(o,s){if(1&o&&(t.ynx(0),t.TgZ(1,"mat-option",73)(2,"span",70)(3,"span",74),t._uU(4),t.qZA(),t.TgZ(5,"span",75),t._uU(6),t.qZA()()(),t.BQk()),2&o){const i=s.$implicit;t.xp6(1),t.Q6J("value",i.code),t.xp6(3),t.Oqu(i.name),t.xp6(2),t.Oqu(i.code)}}function ut(o,s){if(1&o&&(t.TgZ(0,"mat-select",69)(1,"mat-select-trigger")(2,"span",70)(3,"span",71),t._uU(4),t.qZA()()(),t.YNc(5,dt,7,3,"ng-container",72),t.qZA()),2&o){const i=t.oxw(2);t.Q6J("formControl",i.phoneForm.get("countryCode")),t.xp6(4),t.Oqu(i.phoneForm.get("countryCode").value),t.xp6(1),t.Q6J("ngForOf",i.countries)}}function mt(o,s){1&o&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.ALo(3,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.AsE(" ",t.lcZ(2,2,"login.phone")," ",t.lcZ(3,4,"signup.is_required")," "))}function ht(o,s){1&o&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.ALo(3,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.AsE(" ",t.lcZ(2,2,"signup.please_enter_a_valid")," ",t.lcZ(3,4,"login.phone")," "))}function _t(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"div",62)(1,"div",47)(2,"div",63),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"div",24)(6,"div"),t._uU(7),t.ALo(8,"transloco"),t.qZA()(),t.TgZ(9,"form",16,64)(11,"div",7)(12,"mat-form-field",65)(13,"mat-label"),t._uU(14),t.ALo(15,"transloco"),t.qZA(),t.YNc(16,ut,6,3,"mat-select",66),t.qZA(),t.TgZ(17,"mat-form-field",27)(18,"mat-label"),t._uU(19),t.ALo(20,"transloco"),t.qZA(),t._UZ(21,"input",67),t.YNc(22,mt,4,6,"mat-error",41),t.YNc(23,ht,4,6,"mat-error",41),t.qZA()()(),t.TgZ(24,"button",68),t.NdJ("click",function(e){t.CHM(i);const l=t.oxw();return t.KtG(l.updatePhone(e))}),t.TgZ(25,"span"),t._uU(26),t.ALo(27,"transloco"),t.qZA()()()()}if(2&o){const i=t.oxw();t.xp6(3),t.hij(" ",t.lcZ(4,17,"signup.change_your_phone_title")," "),t.xp6(4),t.Oqu(t.lcZ(8,19,"signup.change_your_phone_description")),t.xp6(2),t.Q6J("formGroup",i.phoneForm),t.xp6(5),t.hij(" ",t.lcZ(15,21,"login.country_code"),""),t.xp6(2),t.Q6J("ngIf",i.countries),t.xp6(3),t.Oqu(t.lcZ(20,23,"login.phone")),t.xp6(2),t.Q6J("formControlName","phone"),t.xp6(1),t.Q6J("ngIf",i.phoneForm.get("phone").hasError("required")),t.xp6(1),t.Q6J("ngIf",i.phoneForm.get("phone").hasError("phone")),t.xp6(1),t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.ekj("col-span-2","both"!==i.phoneGateway),t.Q6J("disabled",!i.canUpdatePhone()),t.xp6(2),t.hij(" ",t.lcZ(27,25,"signup.change_your_phone_button")," ")}}function gt(o,s){1&o&&(t.TgZ(0,"div",62)(1,"div",47)(2,"div",76),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"div",24)(6,"div"),t._uU(7),t.ALo(8,"transloco"),t.qZA()()()()),2&o&&(t.xp6(3),t.hij(" ",t.lcZ(4,2,"signup.project_flow_not_set")," "),t.xp6(4),t.Oqu(t.lcZ(8,4,"signup.project_flow_not_set_description")))}function ft(o,s){if(1&o&&(t.TgZ(0,"div",77)(1,"div",47)(2,"div",76),t._uU(3),t.ALo(4,"transloco"),t.qZA()()()),2&o){const i=t.oxw();t.xp6(3),t.hij(" ",t.lcZ(4,1,"signup.error_"+i.errorContent.message)," ")}}function xt(o,s){if(1&o&&(t.TgZ(0,"div",78),t._UZ(1,"img",79),t.qZA()),2&o){const i=t.oxw();t.Udp("background",i.project.branding.rightBackgroundColor),t.s9C("fxLayoutAlign",i.project.branding.rightImagePosition||"end end"),t.xp6(1),t.Q6J("src",i.project.branding.rightImage,t.LSH)}}const vt=[{path:":id",component:(()=>{class o{constructor(i,n,e,l,h,Ct,bt,wt){this._KYCService=i,this._splashScreenService=n,this._activatedRoute=e,this._changeDetectorRef=l,this._router=h,this._formBuilder=Ct,this._countries=bt,this._demoService=wt,this._splashScreenService.show(),this.countries=this._countries.countryCodes,this.deviceDetails=this._demoService.getDeviceDetails()}ngOnInit(){var n,i=this;this._activatedRoute.params.subscribe(n=>{this.token=this._router.url.split("?token=")[1],localStorage.setItem("accessToken",this.token),this._requestAppRegistration()}),this._demoService.geoLocation$.subscribe({next:(n=(0,C.Z)(function*(e){!e||i.location||(i.location=yield i._demoService.extractLocationFromLatLng(e.lat,e.lng),i.location.os=i.deviceDetails?.platform,i.location.type="desktop",i.location.countryCode=i._countries.findCountryCode(i.location.country),console.log({location:i.location}))}),function(l){return n.apply(this,arguments)}),error:n=>{},complete:()=>{}})}_requestAppRegistration(){this._KYCService.getAppRegistration({populates:["project","projectFlow","emailValidation","phoneValidation"]}).subscribe({next:i=>{this.appRegistration=i.data,this.project=new v.XR(this.appRegistration.project),this.projectFlow=new v.nd(this.appRegistration.projectFlow),this._initForm(),this.isVerifikProject=this.project._id===m.N.verifikProject||this.project._id===m.N.sandboxProject;const n=this.projectFlow.onboardingSettings.steps;this.showSkipDoingKYC=!["basicInformation","document","form","liveness"].some(l=>"mandatory"===n[l])},error:i=>{this.errorContent=i.error,this._splashScreenService.hide()},complete:()=>{this._splashScreenService.hide(),this._initValidations()}})}_initValidations(){this.currentValidation=null,setTimeout(()=>{this._initEmailValidation(),this._initPhoneValidation(),this._completeAppRegistration(),this._changeDetectorRef.detectChanges()},500)}_initEmailValidation(){"mailgun"===this.projectFlow.onboardingSettings.signUpForm.emailGateway&&"validated"!==this.appRegistration.emailValidation?.status&&(this.loading||(this.loading=!0,this._splashScreenService.show(),this._KYCService.sendEmailValidation(this.appRegistration.email).subscribe({next:i=>{this.currentValidation=i.data,this._linkValidation(),this.startCountdown(),this.loading=!1,this._splashScreenService.hide()},error:i=>{this.errorContent=i.error,this._splashScreenService.hide()},complete:()=>{}})))}_initPhoneValidation(i){if(this.phoneGateway=i||this.projectFlow.onboardingSettings.signUpForm.phoneGateway,"-1"===this.appRegistration.countryCode&&(this.phoneGateway="both"),"both"===this.phoneGateway&&!this.currentValidation&&(this.currentValidation=this.appRegistration.phoneValidation?"validated"!==this.appRegistration.phoneValidation?.status?this.appRegistration.phoneValidation:null:{_id:"new",countryCode:this.appRegistration.countryCode,phone:this.appRegistration.phone},this.remainingTime&&(this.remainingTime=null,this.countdownSubscription.unsubscribe())),["whatsapp","sms"].includes(this.phoneGateway)&&"validated"!==this.appRegistration.phoneValidation?.status&&!this.loading)return this.loading=!0,this._splashScreenService.show(),this._KYCService.sendPhoneValidation(this.appRegistration.countryCode,this.appRegistration.phone,this.phoneGateway).subscribe({next:n=>{this.currentValidation=n.data,this._linkValidation(),this.startCountdown(),this.loading=!1,this._splashScreenService.hide()},error:n=>{this.errorContent=n.error,this.loading=!1,this._splashScreenService.hide()},complete:()=>{this.loading=!1,this._splashScreenService.hide()}}),!0}_initForm(){this.otpForm=this._formBuilder.group({otp:["",[d.kI.required]]});const i={};i.countryCode=[this.location?.countryCode||"+1",d.kI.required],i.phone=[this.appRegistration.phone,d.kI.required],m.N.production&&i.phone.push(d.kI.min(8),d.kI.max(10)),this.phoneForm=this._formBuilder.group(i)}startCountdown(){this.countdownSubscription&&this.countdownSubscription.unsubscribe();const i=new Date(L()().add(2,"minute").format("YYYY-MM-DD HH:mm:ss")).getTime();this.countdownSubscription=function V(o=0,s=q.z){return o<0&&(o=0),(0,U.H)(o,o,s)}(1e3).subscribe(()=>{let n=(new Date).getTime(),e=i-n;if(e<0)return this.remainingTime="Expired",void this.countdownSubscription.unsubscribe();let l=Math.floor(e%36e5/6e4),h=Math.floor(e%6e4/1e3);this.remainingTime=`${l}m ${h}s`})}onInput(i){const n=i.target;n.value=n.value.replace(/[^0-9]/g,"")}checkSixDigits(){6===this.otpForm.value.otp?.length&&this.confirmValidation()}confirmValidation(){this.loading||(this.loading=!!(this.currentValidation.email||this.currentValidation.phone&&"both"!==this.phoneGateway),this.currentValidation.email?(this._splashScreenService.show(),this._confirmEmailValidation()):this.currentValidation.phone&&"both"!==this.phoneGateway&&(this._splashScreenService.show(),this._confirmPhoneValidation()))}_confirmEmailValidation(){this._KYCService.confirmEmailValidation(this.appRegistration.email,this.otpForm.value.otp).subscribe({next:i=>{this.appRegistration.emailValidation=i.data},error:i=>{this.otpForm.reset(),this.loading=!1,this._splashScreenService.hide()},complete:()=>{this.otpForm.reset(),this.loading=!1,this._splashScreenService.hide(),this._initValidations()}})}_confirmPhoneValidation(){this._KYCService.confirmPhoneValidation(this.currentValidation.countryCode,this.currentValidation.phone,this.otpForm.value.otp).subscribe({next:i=>{this.appRegistration.phoneValidation=i.data},error:i=>{this.otpForm.reset(),this._splashScreenService.hide(),this.loading=!1},complete:()=>{this.otpForm.reset(),this.loading=!1,this._splashScreenService.hide(),this._initValidations()}})}canSendOTP(){return!this.sendingOTP&&!this.loading}canUpdatePhone(){return!!(this.phoneForm.value.phone?.length>=8&&this.phoneForm.value.countryCode)}sendPhoneOTP(i,n){this._initPhoneValidation(n)}_linkValidation(){const i={};this.currentValidation.email?(i.emailValidation=this.currentValidation._id,this.appRegistration.emailValidation=this.currentValidation):this.currentValidation.phone&&(i.phoneValidation=this.currentValidation._id,this.appRegistration.phoneValidation=this.currentValidation),this._KYCService.updateAppRegistration(i).subscribe({next:n=>{},error:n=>{console.error({exception:n})},complete:()=>{}})}_completeAppRegistration(){"mailgun"===this.projectFlow.onboardingSettings.signUpForm.emailGateway&&"validated"!==this.appRegistration.emailValidation?.status||["whatsapp","sms","both"].includes(this.projectFlow.onboardingSettings.signUpForm.phoneGateway)&&"validated"!==this.appRegistration.phoneValidation?.status||this.loading||(localStorage.setItem("accessToken",this.token),this._syncAppRegistration("signUpForm","ONGOING","redirect"))}_syncAppRegistration(i,n,e){const l=this._KYCService.syncAppRegistration(i,n);return l.subscribe({next:h=>{this.currentValidation=null,this.syncResponse=h.data},error:()=>{},complete:()=>{if("COMPLETED_WITHOUT_KYC"===n&&"redirect"===e){let h=this.projectFlow.redirectUrl;m.N.verifikProject===this.project._id?h=`${m.N.appUrl}/sign-in`:m.N.sandboxProject===this.project._id&&(h=`${m.N.sandboxUrl}/sign-in`),window.location.href=`${h}?type=onboarding&token=${this.syncResponse.token}`}"instructions"===i&&"redirect"===e&&this._router.navigate(["/kyc"],{queryParams:{token:this.syncResponse.token}})}}),l}startKYC(){this._syncAppRegistration("instructions","ONGOING","redirect")}continueWithoutKYC(){this._syncAppRegistration("skipKYC","COMPLETED_WITHOUT_KYC","redirect")}showUpdatePhoneCard(){this.currentValidation&&(this.currentValidation.countryCode="-1"),this._changeDetectorRef.detectChanges()}updatePhone(i){this._KYCService.updateAppRegistration({_id:this.appRegistration._id,countryCode:this.phoneForm.value.countryCode,phone:this.phoneForm.value.phone,replacePhone:!0}).subscribe(n=>{this.appRegistration.countryCode=n.data.countryCode,this.appRegistration.phone=n.data.phone,this.currentValidation.countryCode=n.data.countryCode,this.currentValidation.phone=n.data.phone,this._initValidations(),this._changeDetectorRef.detectChanges()})}ngOnDestroy(){this.countdownSubscription&&this.countdownSubscription.unsubscribe()}static#t=this.\u0275fac=function(n){return new(n||o)(t.Y36(I.H),t.Y36(F.j),t.Y36(g.gz),t.Y36(t.sBO),t.Y36(g.F0),t.Y36(d.QS),t.Y36(N.K),t.Y36(P.e))};static#i=this.\u0275cmp=t.Xpm({type:o,selectors:[["auth-confirmation-required"]],viewQuery:function(n,e){if(1&n&&(t.Gf(J,5),t.Gf(E,5)),2&n){let l;t.iGM(l=t.CRH())&&(e.otpNgForm=l.first),t.iGM(l=t.CRH())&&(e.signUpNgForm=l.first)}},standalone:!0,features:[t.jDz],decls:7,vars:8,consts:[["fxLayout","row","fxLayoutAlign","center center",1,"w-full"],["fxLayout","row","fxLayoutAlign","center end","class","flex w-full",4,"ngIf"],["class","flex items-center justify-center sm:w-auto p-16 rounded-2xl shadow bg-card","fxLayout","column","fxLayoutAlign","start center",4,"ngIf"],["class","md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-4 sm:p-12 md:p-16 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none sm:bg-card",4,"ngIf"],["class","flex items-center justify-center sm:w-auto p-16 rounded-2xl shadow bg-card",4,"ngIf"],["class","relative hidden md:flex flex-auto justify-center h-full overflow-hidden dark:border-r w-full","fxLayout","row",3,"background","fxLayoutAlign",4,"ngIf"],["fxLayout","row","fxLayoutAlign","center end",1,"flex","w-full"],["fxLayout","row","fxLayoutAlign","start center"],[1,"main-logo","w-14",3,"src"],[1,"flex","rounded-2xl","shadow","bg-card","overflow-hidden","sign-in-content"],["fxLayout","row","fxLayoutAlign","start center",1,"w-full","sm:w-auto","py-8","px-4","sm:p-12"],[1,"w-400","mx-auto","sm:mx-0"],["class","mt-8 text-2xl font-extrabold tracking-tight leading-tight",4,"ngIf"],[1,"cursor-pointer","underline",3,"click"],["class","flex items-baseline mt-0.5 font-medium",3,"color",4,"ngIf"],["class","mt-8 -mb-4",3,"appearance","showIcon","type",4,"ngIf"],[1,"mt-8",3,"formGroup"],["otpNgForm","ngForm"],["class","w-full",4,"ngIf"],["class","grid grid-cols-2 w-full",4,"ngIf"],["class","mt-2 text-md font-medium text-secondary",4,"ngIf"],["fxLayout","row","fxLayoutAlign","center center",1,"w-full","text-center","mt-6"],[3,"colorText"],[1,"mt-8","text-2xl","font-extrabold","tracking-tight","leading-tight"],[1,"flex","items-baseline","mt-0.5","font-medium"],[1,"ml-1","text-primary-500","hover:underline","cursor-pointer",3,"routerLink"],[1,"mt-8","-mb-4",3,"appearance","showIcon","type"],[1,"w-full"],["id","otp","matInput","","type","password",3,"formControlName","input","keyup"],["passwordField",""],["mat-icon-button","","type","button","matSuffix","",3,"click"],["class","icon-size-5",3,"svgIcon",4,"ngIf"],["class","p-1",4,"ngIf"],[1,"icon-size-5",3,"svgIcon"],[1,"p-1"],[1,"grid","grid-cols-2","w-full"],["mat-stroked-button","","class","w-11/12 mt-4","color","primary",3,"col-span-2","disabled","color","background","click",4,"ngIf"],["mat-stroked-button","","class","mt-4","color","primary",3,"col-span-2","disabled","color","background","click",4,"ngIf"],["mat-stroked-button","","color","primary",1,"w-11/12","mt-4",3,"disabled","click"],["mat-stroked-button","","color","primary",1,"mt-4",3,"disabled","click"],[1,"mt-2","text-md","font-medium","text-secondary"],[4,"ngIf"],["class","ml-1 text-primary-500 hover:underline cursor-pointer",3,"click",4,"ngIf"],[1,"ml-1","text-primary-500","hover:underline","cursor-pointer",3,"click"],["fxLayout","column","fxLayoutAlign","start center",1,"flex","items-center","justify-center","sm:w-auto","p-16","rounded-2xl","shadow","bg-card"],["class","w-full max-w-80 sm:w-80 mx-auto sm:mx-0",4,"ngIf"],["class","w-full max-w-80 sm:w-80 mx-auto sm:mx-0","fxLayout","column","fxLayoutAlign","start center",4,"ngIf"],[1,"w-full","max-w-80","sm:w-80","mx-auto","sm:mx-0"],["fxLayout","column","fxLayoutAlign","start center"],["src","https://cdn.verifik.co/access/goldcoins3x.png","alt","",1,"w-36"],[1,"pt-2","credits-h2"],[1,"credits-h3"],["fxLayout","column","fxLayoutAlign","center center",1,"w-full"],["mat-stroked-button","",1,"w-11/12","mt-4","biometrics-button",3,"click"],["mat-stroked-button","","class","w-11/12 mt-4 biometrics-button","color","primary",3,"click",4,"ngIf"],["mat-stroked-button","","color","primary",1,"w-11/12","mt-4","biometrics-button",3,"click"],["fxLayout","column","fxLayoutAlign","start center",1,"w-full","max-w-80","sm:w-80","mx-auto","sm:mx-0"],[1,"mt-4","text-4xl","font-extrabold","tracking-tight","leading-tight","text-center"],["src","https://cdn.verifik.co/access/divider.svg","alt","",1,"w-full","pb-8","pt-8"],["src","https://cdn.verifik.co/access/biometrics_icon.svg","alt","",1,"w-28"],[1,"pt-2","text-2xl","font-extrabold"],[1,"credits-h3","text-center"],[1,"md:flex","md:items-center","md:justify-end","w-full","sm:w-auto","md:h-full","md:w-1/2","py-8","px-4","sm:p-12","md:p-16","sm:rounded-2xl","md:rounded-none","sm:shadow","md:shadow-none","sm:bg-card"],[1,"text-4xl","font-extrabold","tracking-tight","leading-tight"],["phoneNgForm","ngForm"],[1,"w-full","mr-2"],["class","mr-1.5","matPrefix","",3,"formControl",4,"ngIf"],["id","phone","matInput","",3,"formControlName"],["mat-stroked-button","","color","primary",1,"w-full","mt-4",3,"disabled","click"],["matPrefix","",1,"mr-1.5",3,"formControl"],[1,"flex","items-center"],[1,"sm:mx-0.5","font-medium","text-default"],[4,"ngFor","ngForOf"],[3,"value"],[1,"ml-2"],[1,"ml-2","font-medium"],[1,"mt-8","text-4xl","font-extrabold","tracking-tight","leading-tight"],[1,"flex","items-center","justify-center","sm:w-auto","p-16","rounded-2xl","shadow","bg-card"],["fxLayout","row",1,"relative","hidden","md:flex","flex-auto","justify-center","h-full","overflow-hidden","dark:border-r","w-full",3,"fxLayoutAlign"],["alt","",1,"hhalf-width-image",3,"src"]],template:function(n,e){1&n&&(t.TgZ(0,"div",0),t.YNc(1,rt,23,16,"div",1),t.YNc(2,pt,8,6,"div",2),t.YNc(3,_t,28,27,"div",3),t.YNc(4,gt,9,6,"div",3),t.YNc(5,ft,5,3,"div",4),t.YNc(6,xt,2,4,"div",5),t.qZA()),2&n&&(t.Udp("background",null==e.project?null:e.project.branding.bgColor),t.xp6(1),t.Q6J("ngIf",!e.errorContent&&e.appRegistration&&e.project&&e.otpForm&&e.currentValidation&&e.currentValidation._id&&"-1"!==e.currentValidation.countryCode),t.xp6(1),t.Q6J("ngIf",e.syncResponse),t.xp6(1),t.Q6J("ngIf",!e.errorContent&&e.currentValidation&&"-1"===e.currentValidation.countryCode),t.xp6(1),t.Q6J("ngIf",!(e.errorContent||e.project&&e.projectFlow&&e.projectFlow._id&&e.project._id)),t.xp6(1),t.Q6J("ngIf",e.errorContent),t.xp6(1),t.Q6J("ngIf",e.project&&e.project.branding.rightImage&&e.appRegistration&&e.otpForm&&e.currentValidation&&e.currentValidation._id))},dependencies:[w.o9,Z.xw,Z.Wh,g.rH,f.O5,j.W,d.u5,d._Y,d.Fj,d.JJ,d.JL,d.UX,d.oH,d.sg,d.u,p.lN,p.KE,p.hX,p.TO,p.qo,p.R9,y.c,y.Nt,a.ot,a.lW,a.RK,u.Ps,u.Hw,c.p9,R.Cq,_.y4,_.Ot,f.ez,f.sg,A.LD,A.gD,A.$L,Y.ey,S.v],styles:[".main-logo{position:absolute;top:10px;left:20px;z-index:0}.w-400{width:400px!important}bg-white{background-color:#fff}.sign-in-content{z-index:2!important}.credits-h2{font-size:24px;text-align:center}.credits-h3{font-size:16px;text-align:center;font-weight:600;color:gray}.biometrics-button{background-color:#82269e;color:#fff!important}mat-form-field{padding-right:4px!important}.mat-mdc-tab-label-container{margin:0!important}mat-tab-body .mat-mdc-tab-body-content{padding:8px 0 5px!important}.w-120px{width:60%!important}.half-width-image{width:50vw;object-fit:fill;height:100%}\n"],encapsulation:2,data:{animation:b.L}})}return o})()}]},8340:(T,x,r)=>{r.d(x,{H:()=>w});var C=r(553),g=r(9397),b=r(8533),m=r(5879),v=r(2065),f=r(8991);let w=(()=>{class _{constructor(a,c){this._httpWrapper=a,this._translocoService=c,this.baseUrl=C.N.apiUrl}getNavigation(){return this.navigation}initNavigation(){let a=1;const c=[],p={},u=this.currentProjectFlow.onboardingSettings.steps;return["mandatory","optional"].includes(u.document)&&(a++,c.push({code:"document",status:u.document}),p.document=u.document,a++,c.push({code:"documentReview",status:u.document}),p.documentReview=u.document),["mandatory","optional"].includes(u.liveness)&&(a++,c.push({code:"liveness",status:u.liveness}),p.liveness=u.liveness,p.document&&(a++,p.documentLivenessReview=u.liveness)),c.push({code:"end",status:"mandatory"}),a++,this.navigation={currentStep:1,lastStep:a,steps:u,map:p,displayableSteps:c},this.navigation}getProject(){return this.currentProject}navigateTo(a){setTimeout(()=>{if("next"!==a)this.navigation.currentStep=a;else switch(this.navigation.currentStep){case"liveness":this.navigation.currentStep="documentLivenessReview";break;case"document":this.navigation.currentStep="documentReview";break;case"documentReview":this.navigation.currentStep="liveness";break;case"documentLivenessReview":this.navigation.currentStep="end"}},750)}getAppRegistration(a){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations/me`,a).pipe((0,g.b)(c=>{this.appRegistration=c.data,this.currentProject=new b.XR({...this.appRegistration.project,type:"onboarding"}),this.currentProjectFlow=this.appRegistration.projectFlow}))}createAppRegistration(a){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations`,a)}sendEmailValidation(a){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations`,{email:a,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id,type:"onboarding",validationMethod:"verificationCode",language:this._translocoService.getActiveLang()}).pipe((0,g.b)(c=>{}))}sendPhoneValidation(a,c,p){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations`,{countryCode:a,phone:c,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id,type:"onboarding",validationMethod:"verificationCode",language:this._translocoService.getActiveLang(),phoneGateway:p||"sms"}).pipe((0,g.b)(u=>{}))}confirmEmailValidation(a,c){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations/validate`,{email:a,otp:c,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id})}confirmPhoneValidation(a,c,p){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations/validate`,{countryCode:a,phone:c,otp:p,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id})}updateAppRegistration(a){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}`,{...a})}syncAppRegistration(a,c){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/sync`,{step:a,status:c})}createDocumentValidation(a){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/document-validations/app-registration`,a)}createBiometricValidation(a){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/biometric-validations/app-registration`,a)}getIdentityImages(a){return this._httpWrapper.sendRequest("get",`${this.baseUrl}/v2/identity-images`,a)}compareFaces(){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/face-recognition/compare/app-registration`,{})}restartKYC(){return this._httpWrapper.sendRequest("delete",`${this.baseUrl}/v2/biometric-validations/${this.appRegistration.biometricValidation._id}`)}static#t=this.\u0275fac=function(c){return new(c||_)(m.LFG(v.O),m.LFG(f.Vn))};static#i=this.\u0275prov=m.Yz7({token:_,factory:_.\u0275fac,providedIn:"root"})}return _})()}}]);