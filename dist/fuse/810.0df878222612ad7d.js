"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[810],{5810:(T,g,a)=>{a.r(g),a.d(g,{default:()=>Ct});var w=a(5861),_=a(3403),C=a(4748),m=a(553),x=a(8533),f=a(6814),b=a(1447),v=a(8991),d=a(6223),A=a(2296),r=a(5986),c=a(1043),p=a(617),u=a(4516),R=a(5940),y=a(4913),j=a(738),q=a(6321),U=a(4825),k=a(6676),L=a.n(k),I=a(6420),t=a(5879),S=a(8340),F=a(6036),N=a(9559),P=a(9162),Z=a(3814),Y=a(3680);const J=["otpNgForm"],E=["signUpNgForm"],G=function(o,s){return{method:o,destination:s}};function Q(o,s){if(1&o&&(t.TgZ(0,"div",23)(1,"span"),t._uU(2),t.ALo(3,"transloco"),t.ALo(4,"uppercase"),t.qZA()()),2&o){const i=t.oxw(2);t.Udp("color",i.project.branding.titleColor),t.xp6(2),t.hij(" ",t.xi3(3,3,"signup.verify_code_sent",t.WLB(8,G,i.currentValidation.email?"Verifik":t.lcZ(4,6,i.phoneGateway),i.currentValidation.email||i.currentValidation.countryCode+" "+i.currentValidation.phone))," ")}}function O(o,s){if(1&o&&(t.TgZ(0,"div",23),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o){const i=t.oxw(2);t.Udp("color",i.project.branding.titleColor),t.xp6(1),t.hij(" ",t.lcZ(2,3,"confirmation.pick_phone_gateway_title")," ")}}function K(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"small",24),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(2);return t.KtG(e.showUpdatePhoneCard())}),t._uU(1),t.ALo(2,"transloco"),t.qZA()}if(2&o){const i=t.oxw(2);t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.hij(" ",t.lcZ(2,3,"signup.change_your_phone_title")," ")}}const D=function(o){return["/sign-up",o]};function M(o,s){if(1&o&&(t.TgZ(0,"div",25)(1,"div"),t._uU(2),t.ALo(3,"transloco"),t.qZA(),t.TgZ(4,"a",26),t._uU(5),t.ALo(6,"transloco"),t.qZA()()),2&o){const i=t.oxw(2);t.Udp("color",i.project.branding.txtColor),t.xp6(2),t.Oqu(t.lcZ(3,5,"login.no_account")),t.xp6(2),t.Q6J("routerLink",t.VKq(9,D,i.project._id)),t.xp6(1),t.Oqu(t.lcZ(6,7,"login.register_here_link"))}}function W(o,s){if(1&o&&(t.TgZ(0,"fuse-alert",27),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o){const i=t.oxw(2);t.Q6J("appearance","outline")("showIcon",!1)("type",i.alert.type)("@shake","error"===i.alert.type),t.xp6(1),t.hij(" ",t.lcZ(2,5,i.alert.message)," ")}}function $(o,s){1&o&&t._UZ(0,"mat-icon",34),2&o&&t.Q6J("svgIcon","heroicons_solid:eye")}function H(o,s){1&o&&t._UZ(0,"mat-icon",34),2&o&&t.Q6J("svgIcon","heroicons_solid:eye-slash")}function B(o,s){1&o&&(t.TgZ(0,"mat-error",35),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"login.required_otp")," "))}function z(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"mat-form-field",28)(1,"mat-label"),t._uU(2),t.ALo(3,"transloco"),t.qZA(),t.TgZ(4,"input",29,30),t.NdJ("input",function(e){t.CHM(i);const l=t.oxw(2);return t.KtG(l.onInput(e))})("keyup",function(){t.CHM(i);const e=t.oxw(2);return t.KtG(e.checkSixDigits())}),t.qZA(),t.TgZ(6,"button",31),t.NdJ("click",function(){t.CHM(i);const e=t.MAs(5);return t.KtG(e.type="password"===e.type?"text":"password")}),t.YNc(7,$,1,1,"mat-icon",32),t.YNc(8,H,1,1,"mat-icon",32),t.qZA(),t.YNc(9,B,3,3,"mat-error",33),t.qZA()}if(2&o){const i=t.MAs(5),n=t.oxw(2);t.xp6(1),t.Udp("color",n.project.branding.txtColor),t.xp6(1),t.Oqu(t.lcZ(3,7,"login.email_otp")),t.xp6(2),t.Q6J("formControlName","otp"),t.xp6(3),t.Q6J("ngIf","password"===i.type),t.xp6(1),t.Q6J("ngIf","text"===i.type),t.xp6(1),t.Q6J("ngIf",n.otpForm.get("otp").hasError("required"))}}function X(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",39),t.NdJ("click",function(e){t.CHM(i);const l=t.oxw(3);return t.KtG(l.sendPhoneOTP(e,"sms"))}),t.TgZ(1,"span"),t._uU(2," SMS "),t.qZA()()}if(2&o){const i=t.oxw(3);t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.ekj("col-span-2","both"!==i.phoneGateway),t.Q6J("disabled",!i.canSendOTP())}}function tt(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",40),t.NdJ("click",function(e){t.CHM(i);const l=t.oxw(3);return t.KtG(l.sendPhoneOTP(e,"whatsapp"))}),t.TgZ(1,"span"),t._uU(2," Whatsapp "),t.qZA()()}if(2&o){const i=t.oxw(3);t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.ekj("col-span-2","both"!==i.phoneGateway),t.Q6J("disabled",!i.canSendOTP())}}function it(o,s){if(1&o&&(t.TgZ(0,"div",36),t.YNc(1,X,3,7,"button",37),t.YNc(2,tt,3,7,"button",38),t.qZA()),2&o){const i=t.oxw(2);t.xp6(1),t.Q6J("ngIf","sms"===i.phoneGateway||"both"===i.phoneGateway),t.xp6(1),t.Q6J("ngIf","whatsapp"===i.phoneGateway||"both"===i.phoneGateway)}}function ot(o,s){if(1&o&&(t.TgZ(0,"span"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o){const i=t.oxw(3);t.xp6(1),t.AsE(" ",t.lcZ(2,2,"confirmation.remaining_time")," ",i.remainingTime," ")}}function et(o,s){1&o&&(t.TgZ(0,"span"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.Oqu(t.lcZ(2,1,"confirmation.resend_code_part_one")))}function nt(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"a",44),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(3);return t.KtG(e._initValidations())}),t._uU(1),t.ALo(2,"transloco"),t.qZA()}2&o&&(t.xp6(1),t.Oqu(t.lcZ(2,1,"confirmation.resend_code_part_two")))}function rt(o,s){if(1&o&&(t.TgZ(0,"div",41),t.YNc(1,ot,3,4,"span",42),t.YNc(2,et,3,3,"span",42),t.YNc(3,nt,3,3,"a",43),t.qZA()),2&o){const i=t.oxw(2);t.xp6(1),t.Q6J("ngIf","Expired"!==i.remainingTime),t.xp6(1),t.Q6J("ngIf","Expired"===i.remainingTime),t.xp6(1),t.Q6J("ngIf","Expired"===i.remainingTime)}}function at(o,s){if(1&o&&(t.TgZ(0,"div",6)(1,"div",7),t._UZ(2,"img",8),t.qZA(),t.TgZ(3,"div",9)(4,"div",10)(5,"div",11),t.YNc(6,Q,5,11,"div",12),t.YNc(7,O,3,5,"div",12),t.YNc(8,K,3,5,"small",13),t.YNc(9,M,7,11,"div",14),t.YNc(10,W,3,7,"fuse-alert",15),t.TgZ(11,"form",16,17),t.YNc(13,z,10,9,"mat-form-field",18),t.qZA(),t.YNc(14,it,3,2,"div",19),t.YNc(15,rt,4,3,"div",20),t.TgZ(16,"div",21)(17,"small"),t._uU(18),t.ALo(19,"transloco"),t.qZA(),t._UZ(20,"languages",22),t.qZA()()()()()),2&o){const i=t.oxw();t.xp6(2),t.Q6J("src",i.project.branding.logo,t.LSH),t.xp6(4),t.Q6J("ngIf",i.currentValidation.email||i.currentValidation.phone&&"both"!==i.phoneGateway),t.xp6(1),t.Q6J("ngIf",i.currentValidation.phone&&"both"===i.phoneGateway),t.xp6(1),t.Q6J("ngIf",i.currentValidation.countryCode),t.xp6(1),t.Q6J("ngIf",i.kycProjectFlow),t.xp6(1),t.Q6J("ngIf",i.showAlert),t.xp6(1),t.Q6J("formGroup",i.otpForm),t.xp6(2),t.Q6J("ngIf",i.currentValidation.email||i.currentValidation.phone&&"both"!==i.phoneGateway),t.xp6(1),t.Q6J("ngIf",!i.loading&&i.currentValidation.phone&&"both"===i.phoneGateway),t.xp6(1),t.Q6J("ngIf",i.remainingTime),t.xp6(3),t.hij(" ",t.lcZ(19,12,"powered_by_verifik")," "),t.xp6(2),t.Q6J("colorText",i.project.branding.txtColor)}}function st(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",56),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(3);return t.KtG(e.continueWithoutKYC())}),t.TgZ(1,"span"),t._uU(2),t.ALo(3,"transloco"),t.qZA()()}if(2&o){const i=t.oxw(3);t.xp6(1),t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.hij("",t.lcZ(3,3,"add_biometrics.verifik_dismiss")," ")}}function ct(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"div",48)(1,"div",49),t._UZ(2,"img",50),t.TgZ(3,"h2",51),t._uU(4),t.ALo(5,"transloco"),t.qZA(),t.TgZ(6,"h3",52),t._uU(7),t.ALo(8,"transloco"),t.qZA()(),t.TgZ(9,"div",53)(10,"button",54),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(2);return t.KtG(e.startKYC())}),t.TgZ(11,"span"),t._uU(12),t.ALo(13,"transloco"),t.qZA()(),t.YNc(14,st,4,5,"button",55),t.qZA()()}if(2&o){const i=t.oxw(2);t.xp6(4),t.hij(" ",t.lcZ(5,8,"add_biometrics.verifik_title")," "),t.xp6(3),t.Oqu(t.lcZ(8,10,"add_biometrics.verifik_content")),t.xp6(3),t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.xp6(2),t.hij("",t.lcZ(13,12,"add_biometrics.verifik_button")," "),t.xp6(2),t.Q6J("ngIf",i.showSkipDoingKYC)}}function lt(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",56),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(3);return t.KtG(e.continueWithoutKYC())}),t.TgZ(1,"span"),t._uU(2),t.ALo(3,"transloco"),t.qZA()()}if(2&o){const i=t.oxw(3);t.xp6(1),t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.hij(" ",t.lcZ(3,3,"add_biometrics.dismiss")," ")}}function dt(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"div",57)(1,"div",49)(2,"h1",58),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t._UZ(5,"img",59)(6,"img",60),t.TgZ(7,"h2",61),t._uU(8),t.ALo(9,"transloco"),t.qZA(),t.TgZ(10,"h3",62),t._uU(11),t.ALo(12,"transloco"),t.qZA()(),t.TgZ(13,"div",53)(14,"button",54),t.NdJ("click",function(){t.CHM(i);const e=t.oxw(2);return t.KtG(e.startKYC())}),t.TgZ(15,"span"),t._uU(16),t.ALo(17,"transloco"),t.qZA()(),t.YNc(18,lt,4,5,"button",55),t.qZA()()}if(2&o){const i=t.oxw(2);t.xp6(2),t.Udp("color",i.project.branding.titleColor),t.xp6(1),t.AsE(" ",t.lcZ(4,14,"signup.kyc_start_popup.project_title")," ",i.project.name," "),t.xp6(4),t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.hij(" ",t.lcZ(9,16,"signup.kyc_start_popup.title")," "),t.xp6(3),t.Oqu(t.lcZ(12,18,"signup.kyc_start_popup.content")),t.xp6(3),t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.xp6(2),t.hij("",t.lcZ(17,20,"add_biometrics.button")," "),t.xp6(2),t.Q6J("ngIf",i.showSkipDoingKYC)}}function pt(o,s){if(1&o&&(t.TgZ(0,"div",45),t.YNc(1,ct,15,14,"div",46),t.YNc(2,dt,19,22,"div",47),t.TgZ(3,"div",21)(4,"small"),t._uU(5),t.ALo(6,"transloco"),t.qZA(),t._UZ(7,"languages",22),t.qZA()()),2&o){const i=t.oxw();t.xp6(1),t.Q6J("ngIf",i.isVerifikProject),t.xp6(1),t.Q6J("ngIf",!i.isVerifikProject),t.xp6(3),t.hij(" ",t.lcZ(6,4,"powered_by_verifik")," "),t.xp6(2),t.Q6J("colorText",i.project.branding.txtColor)}}function ut(o,s){if(1&o&&(t.ynx(0),t.TgZ(1,"mat-option",74)(2,"span",71)(3,"span",75),t._uU(4),t.qZA(),t.TgZ(5,"span",76),t._uU(6),t.qZA()()(),t.BQk()),2&o){const i=s.$implicit;t.xp6(1),t.Q6J("value",i.code),t.xp6(3),t.Oqu(i.name),t.xp6(2),t.Oqu(i.code)}}function mt(o,s){if(1&o&&(t.TgZ(0,"mat-select",70)(1,"mat-select-trigger")(2,"span",71)(3,"span",72),t._uU(4),t.qZA()()(),t.YNc(5,ut,7,3,"ng-container",73),t.qZA()),2&o){const i=t.oxw(2);t.Q6J("formControl",i.phoneForm.get("countryCode")),t.xp6(4),t.Oqu(i.phoneForm.get("countryCode").value),t.xp6(1),t.Q6J("ngForOf",i.countries)}}function ht(o,s){1&o&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.ALo(3,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.AsE(" ",t.lcZ(2,2,"login.phone")," ",t.lcZ(3,4,"signup.is_required")," "))}function _t(o,s){1&o&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.ALo(3,"transloco"),t.qZA()),2&o&&(t.xp6(1),t.AsE(" ",t.lcZ(2,2,"signup.please_enter_a_valid")," ",t.lcZ(3,4,"login.phone")," "))}function ft(o,s){if(1&o){const i=t.EpF();t.TgZ(0,"button",77),t.NdJ("click",function(e){t.CHM(i);const l=t.oxw(2);return t.KtG(l.updatePhone(e))}),t.TgZ(1,"span"),t._uU(2),t.ALo(3,"transloco"),t.qZA()()}if(2&o){const i=t.oxw(2);t.Udp("color",i.project.branding.buttonTxtColor)("background",i.project.branding.buttonColor),t.ekj("col-span-2","sms"===i.phoneGateway||"whatsapp"===i.phoneGateway),t.Q6J("disabled",!i.canUpdatePhone()),t.xp6(2),t.hij(" ",t.lcZ(3,8,"signup.change_your_phone_button")," ")}}function gt(o,s){if(1&o&&(t.TgZ(0,"div",63)(1,"div",48)(2,"div",64),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"div",25)(6,"div"),t._uU(7),t.ALo(8,"transloco"),t.qZA()(),t.TgZ(9,"form",16,65)(11,"div",7)(12,"mat-form-field",66)(13,"mat-label"),t._uU(14),t.ALo(15,"transloco"),t.qZA(),t.YNc(16,mt,6,3,"mat-select",67),t.qZA(),t.TgZ(17,"mat-form-field",28)(18,"mat-label"),t._uU(19),t.ALo(20,"transloco"),t.qZA(),t._UZ(21,"input",68),t.YNc(22,ht,4,6,"mat-error",42),t.YNc(23,_t,4,6,"mat-error",42),t.qZA()()(),t.YNc(24,ft,4,10,"button",69),t.qZA()()),2&o){const i=t.oxw();t.xp6(3),t.hij(" ",t.lcZ(4,14,"signup.change_your_phone_title")," "),t.xp6(4),t.Oqu(t.lcZ(8,16,"signup.change_your_phone_description")),t.xp6(2),t.Q6J("formGroup",i.phoneForm),t.xp6(4),t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.hij(" ",t.lcZ(15,18,"login.country_code"),""),t.xp6(2),t.Q6J("ngIf",i.countries),t.xp6(2),t.Udp("color",i.project.branding.txtColor),t.xp6(1),t.Oqu(t.lcZ(20,20,"login.phone")),t.xp6(2),t.Q6J("formControlName","phone"),t.xp6(1),t.Q6J("ngIf",i.phoneForm.get("phone").hasError("required")),t.xp6(1),t.Q6J("ngIf",i.phoneForm.get("phone").hasError("phone")),t.xp6(1),t.Q6J("ngIf",i.currentValidation.countryCode)}}function xt(o,s){1&o&&(t.TgZ(0,"div",63)(1,"div",48)(2,"div",78),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"div",25)(6,"div"),t._uU(7),t.ALo(8,"transloco"),t.qZA()()()()),2&o&&(t.xp6(3),t.hij(" ",t.lcZ(4,2,"signup.project_flow_not_set")," "),t.xp6(4),t.Oqu(t.lcZ(8,4,"signup.project_flow_not_set_description")))}function vt(o,s){if(1&o&&(t.TgZ(0,"div",79)(1,"div",48)(2,"div",78),t._uU(3),t.ALo(4,"transloco"),t.qZA()()()),2&o){const i=t.oxw();t.xp6(3),t.hij(" ",t.lcZ(4,1,"signup.error_"+i.errorContent.message)," ")}}function wt(o,s){if(1&o&&(t.TgZ(0,"div",80),t._UZ(1,"img",81),t.qZA()),2&o){const i=t.oxw();t.Udp("background",i.project.branding.rightBackgroundColor),t.s9C("fxLayoutAlign",i.project.branding.rightImagePosition||"end end"),t.xp6(1),t.Q6J("src",i.project.branding.rightImage,t.LSH)}}const Ct=[{path:":id",component:(()=>{class o{constructor(i,n,e,l,h,bt,At,yt){this._KYCService=i,this._splashScreenService=n,this._activatedRoute=e,this._changeDetectorRef=l,this._router=h,this._formBuilder=bt,this._countries=At,this._demoService=yt,this._splashScreenService.show(),this.countries=this._countries.countryCodes,this.deviceDetails=this._demoService.getDeviceDetails()}ngOnInit(){var n,i=this;this._activatedRoute.params.subscribe(n=>{this.token=this._router.url.split("?token=")[1],localStorage.setItem("accessToken",this.token),this._requestAppRegistration()}),this._demoService.geoLocation$.subscribe({next:(n=(0,w.Z)(function*(e){!e||i.location||(i.location=yield i._demoService.extractLocationFromLatLng(e.lat,e.lng),i.location.os=i.deviceDetails?.platform,i.location.type="desktop",i.location.countryCode=i._countries.findCountryCode(i.location.country))}),function(l){return n.apply(this,arguments)}),error:n=>{},complete:()=>{}})}_requestAppRegistration(){this._KYCService.getAppRegistration({populates:["project","projectFlow","emailValidation","phoneValidation"]}).subscribe({next:i=>{this.appRegistration=i.data,this.project=new x.XR(this.appRegistration.project),this.projectFlow=new x.nd(this.appRegistration.projectFlow),this._initForm(),this.isVerifikProject=this.project._id===m.N.verifikProject||this.project._id===m.N.sandboxProject,this.isVerifikProject=!1;const n=this.projectFlow.onboardingSettings.steps;this.showSkipDoingKYC=!["basicInformation","document","form","liveness"].some(l=>"mandatory"===n[l])},error:i=>{this.errorContent=i.error,this._splashScreenService.hide()},complete:()=>{this._splashScreenService.hide(),this._initValidations()}})}_initValidations(){this.currentValidation=null,setTimeout(()=>{this._initEmailValidation(),this._initPhoneValidation(),this._completeAppRegistration(),this._changeDetectorRef.detectChanges()},500)}_initEmailValidation(){"mailgun"===this.projectFlow.onboardingSettings.signUpForm.emailGateway&&"validated"!==this.appRegistration.emailValidation?.status&&(this.loading||(this.loading=!0,this._splashScreenService.show(),this._KYCService.sendEmailValidation(this.appRegistration.email).subscribe({next:i=>{this.currentValidation=i.data,this._linkValidation(),this.startCountdown(),this.loading=!1,this._splashScreenService.hide()},error:i=>{this.errorContent=i.error,this._splashScreenService.hide()},complete:()=>{}})))}_initPhoneValidation(i){if(this.phoneGateway=i||this.projectFlow.onboardingSettings.signUpForm.phoneGateway,"-1"===this.appRegistration.countryCode&&(this.phoneGateway="both"),"both"===this.phoneGateway&&!this.currentValidation&&(this.currentValidation=this.appRegistration.phoneValidation?"validated"!==this.appRegistration.phoneValidation?.status?this.appRegistration.phoneValidation:null:{_id:"new",countryCode:this.appRegistration.countryCode,phone:this.appRegistration.phone},this.remainingTime&&(this.remainingTime=null,this.countdownSubscription.unsubscribe())),["whatsapp","sms"].includes(this.phoneGateway)&&"validated"!==this.appRegistration.phoneValidation?.status&&!this.loading)return this.loading=!0,this._splashScreenService.show(),this._KYCService.sendPhoneValidation(this.appRegistration.countryCode,this.appRegistration.phone,this.phoneGateway).subscribe({next:n=>{this.currentValidation=n.data,this._linkValidation(),this.startCountdown(),this.loading=!1,this._splashScreenService.hide()},error:n=>{this.errorContent=n.error,this.loading=!1,this._splashScreenService.hide()},complete:()=>{this.loading=!1,this._splashScreenService.hide()}}),!0}_initForm(){try{this.otpForm=this._formBuilder.group({otp:["",[d.kI.required]]});const i={};i.countryCode=[this.location?.countryCode||"+1",[d.kI.required]],i.phone=[this.appRegistration.phone,[d.kI.required]],m.N.production&&i.phone[1].push(d.kI.min(8),d.kI.max(10)),this.phoneForm=this._formBuilder.group(i)}catch(i){console.error({exception:i})}}startCountdown(){this.countdownSubscription&&this.countdownSubscription.unsubscribe();const i=new Date(L()().add(2,"minute").format("YYYY-MM-DD HH:mm:ss")).getTime();this.countdownSubscription=function V(o=0,s=q.z){return o<0&&(o=0),(0,U.H)(o,o,s)}(1e3).subscribe(()=>{let n=(new Date).getTime(),e=i-n;if(e<0)return this.remainingTime="Expired",void this.countdownSubscription.unsubscribe();let l=Math.floor(e%36e5/6e4),h=Math.floor(e%6e4/1e3);this.remainingTime=`${l}m ${h}s`})}onInput(i){const n=i.target;n.value=n.value.replace(/[^0-9]/g,"")}checkSixDigits(){6===this.otpForm.value.otp?.length&&this.confirmValidation()}confirmValidation(){this.loading||(this.loading=!!(this.currentValidation.email||this.currentValidation.phone&&"both"!==this.phoneGateway),this.currentValidation.email?(this._splashScreenService.show(),this._confirmEmailValidation()):this.currentValidation.phone&&"both"!==this.phoneGateway&&(this._splashScreenService.show(),this._confirmPhoneValidation()))}_confirmEmailValidation(){this._KYCService.confirmEmailValidation(this.appRegistration.email,this.otpForm.value.otp).subscribe({next:i=>{this.appRegistration.emailValidation=i.data},error:i=>{this.otpForm.reset(),this.loading=!1,this._splashScreenService.hide()},complete:()=>{this.otpForm.reset(),this.loading=!1,this._splashScreenService.hide(),this._initValidations()}})}_confirmPhoneValidation(){this._KYCService.confirmPhoneValidation(this.currentValidation.countryCode,this.currentValidation.phone,this.otpForm.value.otp).subscribe({next:i=>{this.appRegistration.phoneValidation=i.data},error:i=>{this.otpForm.reset(),this._splashScreenService.hide(),this.loading=!1},complete:()=>{this.otpForm.reset(),this.loading=!1,this._splashScreenService.hide(),this._initValidations()}})}canSendOTP(){return!this.sendingOTP&&!this.loading}canUpdatePhone(){return!!(this.phoneForm.value.phone?.length>=8&&this.phoneForm.value.countryCode)}sendPhoneOTP(i,n){this._initPhoneValidation(n)}_linkValidation(){const i={};this.currentValidation.email?(i.emailValidation=this.currentValidation._id,this.appRegistration.emailValidation=this.currentValidation):this.currentValidation.phone&&(i.phoneValidation=this.currentValidation._id,this.appRegistration.phoneValidation=this.currentValidation),this._KYCService.updateAppRegistration(i).subscribe({next:n=>{},error:n=>{console.error({exception:n})},complete:()=>{}})}_completeAppRegistration(){"mailgun"===this.projectFlow.onboardingSettings.signUpForm.emailGateway&&"validated"!==this.appRegistration.emailValidation?.status||["whatsapp","sms","both"].includes(this.projectFlow.onboardingSettings.signUpForm.phoneGateway)&&"validated"!==this.appRegistration.phoneValidation?.status||this.loading||(localStorage.setItem("accessToken",this.token),this._syncAppRegistration("signUpForm","ONGOING","redirect"))}_syncAppRegistration(i,n,e){const l=this._KYCService.syncAppRegistration(i,n);return l.subscribe({next:h=>{this.currentValidation=null,this.syncResponse=h.data},error:()=>{},complete:()=>{if("COMPLETED_WITHOUT_KYC"===n&&"redirect"===e){let h=this.projectFlow.redirectUrl;m.N.verifikProject===this.project._id?h=`${m.N.appUrl}/sign-in`:m.N.sandboxProject===this.project._id&&(h=`${m.N.sandboxUrl}/sign-in`),window.location.href=`${h}?type=onboarding&token=${this.syncResponse.token}`}"instructions"===i&&"redirect"===e&&this._router.navigate(["/kyc"],{queryParams:{token:this.syncResponse.token}})}}),l}startKYC(){this._syncAppRegistration("instructions","ONGOING","redirect")}continueWithoutKYC(){this._syncAppRegistration("skipKYC","COMPLETED_WITHOUT_KYC","redirect")}showUpdatePhoneCard(){this.currentValidation&&(this.currentValidation.countryCode="-1"),this._changeDetectorRef.detectChanges()}updatePhone(i){this._KYCService.updateAppRegistration({_id:this.appRegistration._id,countryCode:this.phoneForm.value.countryCode,phone:this.phoneForm.value.phone,replacePhone:!0}).subscribe(n=>{this.appRegistration.countryCode=n.data.countryCode,this.appRegistration.phone=n.data.phone,this.currentValidation.countryCode=n.data.countryCode,this.currentValidation.phone=n.data.phone,this._initValidations(),this._changeDetectorRef.detectChanges()})}ngOnDestroy(){this.countdownSubscription&&this.countdownSubscription.unsubscribe()}static#t=this.\u0275fac=function(n){return new(n||o)(t.Y36(S.H),t.Y36(F.j),t.Y36(_.gz),t.Y36(t.sBO),t.Y36(_.F0),t.Y36(d.QS),t.Y36(N.K),t.Y36(P.e))};static#i=this.\u0275cmp=t.Xpm({type:o,selectors:[["auth-confirmation-required"]],viewQuery:function(n,e){if(1&n&&(t.Gf(J,5),t.Gf(E,5)),2&n){let l;t.iGM(l=t.CRH())&&(e.otpNgForm=l.first),t.iGM(l=t.CRH())&&(e.signUpNgForm=l.first)}},standalone:!0,features:[t.jDz],decls:7,vars:8,consts:[["fxLayout","row","fxLayoutAlign","center center",1,"w-full"],["fxLayout","row","fxLayoutAlign","center end","class","flex w-full",4,"ngIf"],["class","flex items-center justify-center sm:w-auto p-16 rounded-2xl shadow bg-card","fxLayout","column","fxLayoutAlign","start center",4,"ngIf"],["class","md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-4 sm:p-12 md:p-16 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none sm:bg-card",4,"ngIf"],["class","flex items-center justify-center sm:w-auto p-16 rounded-2xl shadow bg-card",4,"ngIf"],["class","relative hidden md:flex flex-auto justify-center h-full overflow-hidden dark:border-r w-full","fxLayout","row",3,"background","fxLayoutAlign",4,"ngIf"],["fxLayout","row","fxLayoutAlign","center end",1,"flex","w-full"],["fxLayout","row","fxLayoutAlign","start center"],[1,"main-logo","w-14",3,"src"],[1,"flex","rounded-2xl","shadow","bg-card","overflow-hidden","sign-in-content"],["fxLayout","row","fxLayoutAlign","start center",1,"w-full","sm:w-auto","py-8","px-4","sm:p-12"],[1,"w-400","mx-auto","sm:mx-0"],["class","mt-8 text-2xl font-extrabold tracking-tight leading-tight",3,"color",4,"ngIf"],["class","cursor-pointer underline",3,"color","click",4,"ngIf"],["class","flex items-baseline mt-0.5 font-medium",3,"color",4,"ngIf"],["class","mt-8 -mb-4",3,"appearance","showIcon","type",4,"ngIf"],[1,"mt-8",3,"formGroup"],["otpNgForm","ngForm"],["class","w-full",4,"ngIf"],["class","grid grid-cols-2 w-full",4,"ngIf"],["class","mt-2 text-md font-medium text-secondary",4,"ngIf"],["fxLayout","row","fxLayoutAlign","center center",1,"w-full","text-center","mt-6"],[3,"colorText"],[1,"mt-8","text-2xl","font-extrabold","tracking-tight","leading-tight"],[1,"cursor-pointer","underline",3,"click"],[1,"flex","items-baseline","mt-0.5","font-medium"],[1,"ml-1","text-primary-500","hover:underline","cursor-pointer",3,"routerLink"],[1,"mt-8","-mb-4",3,"appearance","showIcon","type"],[1,"w-full"],["id","otp","matInput","","type","password",3,"formControlName","input","keyup"],["passwordField",""],["mat-icon-button","","type","button","matSuffix","",3,"click"],["class","icon-size-5",3,"svgIcon",4,"ngIf"],["class","p-1",4,"ngIf"],[1,"icon-size-5",3,"svgIcon"],[1,"p-1"],[1,"grid","grid-cols-2","w-full"],["mat-stroked-button","","class","w-11/12 mt-4","color","primary",3,"col-span-2","disabled","color","background","click",4,"ngIf"],["mat-stroked-button","","class","mt-4","color","primary",3,"col-span-2","disabled","color","background","click",4,"ngIf"],["mat-stroked-button","","color","primary",1,"w-11/12","mt-4",3,"disabled","click"],["mat-stroked-button","","color","primary",1,"mt-4",3,"disabled","click"],[1,"mt-2","text-md","font-medium","text-secondary"],[4,"ngIf"],["class","ml-1 text-primary-500 hover:underline cursor-pointer",3,"click",4,"ngIf"],[1,"ml-1","text-primary-500","hover:underline","cursor-pointer",3,"click"],["fxLayout","column","fxLayoutAlign","start center",1,"flex","items-center","justify-center","sm:w-auto","p-16","rounded-2xl","shadow","bg-card"],["class","w-full max-w-80 sm:w-80 mx-auto sm:mx-0",4,"ngIf"],["class","w-full max-w-80 sm:w-80 mx-auto sm:mx-0","fxLayout","column","fxLayoutAlign","start center",4,"ngIf"],[1,"w-full","max-w-80","sm:w-80","mx-auto","sm:mx-0"],["fxLayout","column","fxLayoutAlign","start center"],["src","https://cdn.verifik.co/access/goldcoins3x.png","alt","",1,"w-36"],[1,"pt-2","credits-h2"],[1,"credits-h3"],["fxLayout","column","fxLayoutAlign","center center",1,"w-full"],["mat-stroked-button","",1,"w-11/12","mt-4","biometrics-button",3,"click"],["mat-stroked-button","","class","w-11/12 mt-4 biometrics-button","color","primary",3,"click",4,"ngIf"],["mat-stroked-button","","color","primary",1,"w-11/12","mt-4","biometrics-button",3,"click"],["fxLayout","column","fxLayoutAlign","start center",1,"w-full","max-w-80","sm:w-80","mx-auto","sm:mx-0"],[1,"mt-4","text-4xl","font-extrabold","tracking-tight","leading-tight","text-center"],["src","https://cdn.verifik.co/access/divider.svg","alt","",1,"w-full","pb-8","pt-8"],["src","https://cdn.verifik.co/access/biometrics_icon.svg","alt","",1,"w-28"],[1,"pt-2","text-2xl","font-extrabold"],[1,"credits-h3","text-center"],[1,"md:flex","md:items-center","md:justify-end","w-full","sm:w-auto","md:h-full","md:w-1/2","py-8","px-4","sm:p-12","md:p-16","sm:rounded-2xl","md:rounded-none","sm:shadow","md:shadow-none","sm:bg-card"],[1,"text-4xl","font-extrabold","tracking-tight","leading-tight"],["phoneNgForm","ngForm"],[1,"w-full","mr-2"],["class","mr-1.5","matPrefix","",3,"formControl",4,"ngIf"],["id","phone","matInput","",3,"formControlName"],["mat-stroked-button","","class","w-full mt-4","color","primary",3,"col-span-2","disabled","color","background","click",4,"ngIf"],["matPrefix","",1,"mr-1.5",3,"formControl"],[1,"flex","items-center"],[1,"sm:mx-0.5","font-medium","text-default"],[4,"ngFor","ngForOf"],[3,"value"],[1,"ml-2"],[1,"ml-2","font-medium"],["mat-stroked-button","","color","primary",1,"w-full","mt-4",3,"disabled","click"],[1,"mt-8","text-4xl","font-extrabold","tracking-tight","leading-tight"],[1,"flex","items-center","justify-center","sm:w-auto","p-16","rounded-2xl","shadow","bg-card"],["fxLayout","row",1,"relative","hidden","md:flex","flex-auto","justify-center","h-full","overflow-hidden","dark:border-r","w-full",3,"fxLayoutAlign"],["alt","",1,"hhalf-width-image",3,"src"]],template:function(n,e){1&n&&(t.TgZ(0,"div",0),t.YNc(1,at,21,14,"div",1),t.YNc(2,pt,8,6,"div",2),t.YNc(3,gt,25,22,"div",3),t.YNc(4,xt,9,6,"div",3),t.YNc(5,vt,5,3,"div",4),t.YNc(6,wt,2,4,"div",5),t.qZA()),2&n&&(t.Udp("background",null==e.project?null:e.project.branding.bgColor),t.xp6(1),t.Q6J("ngIf",!e.errorContent&&e.appRegistration&&e.project&&e.otpForm&&e.currentValidation&&e.currentValidation._id&&"-1"!==e.currentValidation.countryCode),t.xp6(1),t.Q6J("ngIf",e.syncResponse),t.xp6(1),t.Q6J("ngIf",!e.errorContent&&e.currentValidation&&"-1"===e.currentValidation.countryCode),t.xp6(1),t.Q6J("ngIf",!(e.errorContent||e.project&&e.projectFlow&&e.projectFlow._id&&e.project._id)),t.xp6(1),t.Q6J("ngIf",e.errorContent),t.xp6(1),t.Q6J("ngIf",e.project&&e.project.branding.rightImage&&e.appRegistration&&e.otpForm&&e.currentValidation&&e.currentValidation._id))},dependencies:[b.o9,Z.xw,Z.Wh,_.rH,f.O5,j.W,d.u5,d._Y,d.Fj,d.JJ,d.JL,d.UX,d.oH,d.sg,d.u,c.lN,c.KE,c.hX,c.TO,c.qo,c.R9,u.c,u.Nt,A.ot,A.lW,A.RK,p.Ps,p.Hw,r.p9,R.Cq,v.y4,v.Ot,f.ez,f.sg,f.gd,y.LD,y.gD,y.$L,Y.ey,I.v],styles:[".main-logo{position:absolute;top:10px;left:20px;z-index:0}.w-400{width:400px!important}bg-white{background-color:#fff}.sign-in-content{z-index:2!important}.credits-h2{font-size:24px;text-align:center}.credits-h3{font-size:16px;text-align:center;font-weight:600;color:gray}.biometrics-button{background-color:#82269e;color:#fff!important}mat-form-field{padding-right:4px!important}.mat-mdc-tab-label-container{margin:0!important}mat-tab-body .mat-mdc-tab-body-content{padding:8px 0 5px!important}.w-120px{width:60%!important}.half-width-image{width:50vw;object-fit:fill;height:100%}.full-size-image{width:100%;height:100%;object-fit:cover}.left-card-inner-div{max-width:20rem}@media (max-width: 599px){.whole-card{width:90%}.left-card{width:100%!important}.left-card .left-card-inner-div{width:90%!important;max-width:90%!important}}@media (min-width: 600px) and (max-width: 767px){.whole-card{width:70%}.left-card{width:100%!important}.left-card .left-card-inner-div{width:90%!important;max-width:90%!important}}@media (min-width: 768px) and (max-width: 959px){.whole-card{width:60%}.left-card{width:100%!important}.left-card .left-card-inner-div{width:90%!important;max-width:90%!important}}@media (min-width: 768px) and (max-width: 1023px){.left-card{width:50%}}@media (min-width: 1024px) and (max-width: 1279px){.whole-card{width:95%}.left-card{width:40%}}@media (min-width: 1080px) and (max-width: 1499px){.whole-card{width:90%}.left-card{width:40%}}@media (min-width: 1500px){.whole-card{width:70%}.left-card{width:50%}}\n"],encapsulation:2,data:{animation:C.L}})}return o})()}]},8340:(T,g,a)=>{a.d(g,{H:()=>v});var w=a(553),_=a(9397),C=a(8533),m=a(5879),x=a(2065),f=a(8991),b=a(9862);let v=(()=>{class d{constructor(r,c,p){this._httpWrapper=r,this._translocoService=c,this._http=p,this.baseUrl=w.N.apiUrl}getNavigation(){return this.navigation}initNavigation(){let r=1;const c=[],p={},u=this.currentProjectFlow.onboardingSettings.steps;return["mandatory","optional"].includes(u.document)&&(r++,c.push({code:"document",status:u.document}),p.document=u.document,r++,c.push({code:"documentReview",status:u.document}),p.documentReview=u.document),["mandatory","optional"].includes(u.liveness)&&(r++,c.push({code:"liveness",status:u.liveness}),p.liveness=u.liveness,p.document&&(r++,p.documentLivenessReview=u.liveness)),c.push({code:"end",status:"mandatory"}),r++,this.navigation={currentStep:1,lastStep:r,steps:u,map:p,displayableSteps:c},this.navigation}getProject(){return this.currentProject}navigateTo(r){setTimeout(()=>{if("next"!==r)this.navigation.currentStep=r;else switch(this.navigation.currentStep){case"liveness":this.navigation.currentStep="documentLivenessReview";break;case"document":this.navigation.currentStep="documentReview";break;case"documentReview":this.navigation.currentStep="liveness";break;case"documentLivenessReview":this.navigation.currentStep="end"}},750)}getAppRegistration(r){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations/me`,r).pipe((0,_.b)(c=>{this.appRegistration=c.data,this.currentProject=new C.XR({...this.appRegistration.project,type:"onboarding"}),this.currentProjectFlow=this.appRegistration.projectFlow}))}createAppRegistration(r){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations`,r)}sendEmailValidation(r){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations`,{email:r,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id,type:"onboarding",validationMethod:"verificationCode",language:this._translocoService.getActiveLang()}).pipe((0,_.b)(c=>{}))}sendPhoneValidation(r,c,p){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations`,{countryCode:r,phone:c,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id,type:"onboarding",validationMethod:"verificationCode",language:this._translocoService.getActiveLang(),phoneGateway:p||"sms"}).pipe((0,_.b)(u=>{}))}confirmEmailValidation(r,c){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations/validate`,{email:r,otp:c,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id})}confirmPhoneValidation(r,c,p){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations/validate`,{countryCode:r,phone:c,otp:p,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id})}updateAppRegistration(r){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}`,{...r})}syncAppRegistration(r,c){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/sync`,{step:r,status:c})}createDocumentValidation(r){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/document-validations/app-registration`,r)}createBiometricValidation(r){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/biometric-validations/app-registration`,r)}updateInformationValidationWithCriminalRecords(r){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/information-validations/${r._id}/background-check`,r)}updateDocumentValidationNameValidation(r){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/document-validations/${r._id}/validate`,r)}getIdentityImages(r){return this._httpWrapper.sendRequest("get",`${this.baseUrl}/v2/identity-images`,r)}compareFaces(){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/face-recognition/compare/app-registration`,{})}restartKYC(){return this._httpWrapper.sendRequest("delete",`${this.baseUrl}/v2/biometric-validations/${this.appRegistration.biometricValidation._id}`)}static#t=this.\u0275fac=function(c){return new(c||d)(m.LFG(x.O),m.LFG(f.Vn),m.LFG(b.eN))};static#i=this.\u0275prov=m.Yz7({token:d,factory:d.\u0275fac,providedIn:"root"})}return d})()}}]);