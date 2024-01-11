"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[139],{8533:(S,g,n)=>{n.d(g,{XR:()=>v,nd:()=>h});class v{constructor(t={}){if(this._id=t._id||"new",this.client=t.client,this.type=t.type,this.name=t.name,this.identifier=t.identifier,this.contactEmail=t.contactEmail,this.privacyUrl=t.privacyUrl,this.termsAndConditionsUrl=t.termsAndConditionsUrl,this.status=t.status,this.dataProtection=t.dataProtection||{name:""},this.branding=t.branding||{bgColor:"#01236D",borderColor:"#B2BDD3",txtColor:"#8091B6",titleColor:"#FFFFFF",logo:"",rightImage:"https://cdn.verifik.co/assets/auth/authb.svg",rightImagePosition:"end end",rightBackgroundColor:"white"},this.projectFlows=t.projectFlows,this.allowedCountries=t.allowedCountries||[],this.emailEnabled=!1,this.phoneEnabled=!1,this.emailAuthyEnabled=!1,this.phoneAuthyEnabled=!1,this.faceLivenessEnabled=!1,this.faceLivenessAuthyEnabled=!1,this.usesWhiteList=!1,this.whiteListLength=0,this.currentStep=t.currentStep,this.lastStep=t.lastStep,Array.isArray(t.projectFlows)&&t.projectFlows.length)for(let d=0;d<this.projectFlows.length;d++){const c=this.projectFlows[d];if(!["paused","draft"].includes(c.status)){if("active"===c.status&&c.type===this.type){this.currentProjectFlow=new h(c);break}c.type===this.type&&(this.currentProjectFlow=new h(c))}}this.currentProjectFlow?.faceLivenessAuthy&&(this.faceLivenessAuthyEnabled=!0)}}class h{constructor(t={}){this._id=t._id,this.client=t.client,this.project=t.project,this.userFeatures=t.userFeatures,this.type=t.type,this.status=t.status,this.version=t.version,this.redirectUrl=t.redirectUrl,this.webhookUrl=t.webhookUrl,this.identityUrl=t.identityUrl,this.allowedCountries=t.allowedCountries||[],this.faceLivenessAuthy=t.faceLivenessAuthy,this.webAuthN=t.webAuthN,this.documentValidation=t.documentValidation,this.appQRCode=t.appQRCode,this.loginSettings=t.loginSettings,this.onboardingSettings=t.onboardingSettings||{basicInformation:{fullName:!1,age:!1,gender:!1,address:!1,postalCode:!1}},this.onboardingSettings&&!this.onboardingSettings.basicInformation&&(this.onboardingSettings.basicInformation={fullName:!1,age:!1,gender:!1,address:!1,postalCode:!1}),this.onboardingSettings&&!this.onboardingSettings.signUpForm&&(this.onboardingSettings.signUpForm={fullName:!1,email:!1,emailGateway:"none",phone:!1,phoneGateway:"none",legalDocument:!1,legalDocumentValidation:"none",showTermsAndConditions:!1,showPrivacyNotice:!1})}}},7139:(S,g,n)=>{n.r(g),n.d(g,{default:()=>de});var _=n(6814),l=n(6223),v=n(2296),h=n(5986),f=n(1043),N=n(617),x=n(4516),U=n(5940),u=n(3403),t=n(4748),d=n(738),c=n(8533),C=n(8645),a=n(553),F=n(8991),b=n(1447),Z=n(4913),j=n(6420),e=n(5879),T=n(4855),I=n(9559),L=n(6036),q=n(9162),Q=n(4771),y=n(3814),J=n(3680);const O=["signUpNgForm"];function Y(o,s){if(1&o&&(e.TgZ(0,"fuse-alert",24),e._uU(1),e.qZA()),2&o){const i=e.oxw(3);e.Q6J("appearance","outline")("showIcon",!1)("type",i.alert.type)("@shake","error"===i.alert.type),e.xp6(1),e.hij(" ",i.alert.message," ")}}function P(o,s){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.ALo(3,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.AsE(" ",e.lcZ(2,2,"signup.fullName")," ",e.lcZ(3,4,"signup.is_required")," "))}function V(o,s){if(1&o&&(e.TgZ(0,"mat-form-field",25)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e._UZ(4,"input",26),e.YNc(5,P,4,6,"mat-error",20),e.qZA()),2&o){const i=e.oxw(3);e.xp6(2),e.Oqu(e.lcZ(3,3,"signup.fullName")),e.xp6(2),e.Q6J("formControlName","fullName"),e.xp6(1),e.Q6J("ngIf",i.signUpForm.get("fullName").hasError("required"))}}function E(o,s){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.ALo(3,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.AsE(" ",e.lcZ(2,2,"signup.firstName")," ",e.lcZ(3,4,"signup.is_required")," "))}function M(o,s){if(1&o&&(e.TgZ(0,"mat-form-field",28)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e._UZ(4,"input",29),e.YNc(5,E,4,6,"mat-error",20),e.qZA()),2&o){const i=e.oxw(4);e.xp6(2),e.Oqu(e.lcZ(3,3,"signup.firstName")),e.xp6(2),e.Q6J("formControlName","firstName"),e.xp6(1),e.Q6J("ngIf",i.signUpForm.get("firstName").hasError("required"))}}function k(o,s){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.ALo(3,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.AsE(" ",e.lcZ(2,2,"signup.lastName")," ",e.lcZ(3,4,"signup.is_required")," "))}function D(o,s){if(1&o&&(e.TgZ(0,"mat-form-field",25)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e._UZ(4,"input",30),e.YNc(5,k,4,6,"mat-error",20),e.qZA()),2&o){const i=e.oxw(4);e.xp6(2),e.Oqu(e.lcZ(3,3,"signup.lastName")),e.xp6(2),e.Q6J("formControlName","lastName"),e.xp6(1),e.Q6J("ngIf",i.signUpForm.get("lastName").hasError("required"))}}function R(o,s){if(1&o&&(e.TgZ(0,"div",27),e.YNc(1,M,6,5,"mat-form-field",17),e.YNc(2,D,6,5,"mat-form-field",15),e.qZA()),2&o){const i=e.oxw(3);e.xp6(1),e.Q6J("ngIf",i.fields.firstName),e.xp6(1),e.Q6J("ngIf",i.fields.lastName)}}function B(o,s){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.ALo(3,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.AsE(" ",e.lcZ(2,2,"login.email")," ",e.lcZ(3,4,"signup.is_required")," "))}function H(o,s){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.ALo(3,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.AsE(" ",e.lcZ(2,2,"signup.please_enter_a_valid")," ",e.lcZ(3,4,"login.email")," "))}function $(o,s){if(1&o&&(e.TgZ(0,"mat-form-field",25)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e._UZ(4,"input",31),e.YNc(5,B,4,6,"mat-error",20),e.YNc(6,H,4,6,"mat-error",20),e.qZA()),2&o){const i=e.oxw(3);e.xp6(2),e.Oqu(e.lcZ(3,4,"login.email")),e.xp6(2),e.Q6J("formControlName","email"),e.xp6(1),e.Q6J("ngIf",i.signUpForm.get("email").hasError("required")),e.xp6(1),e.Q6J("ngIf",i.signUpForm.get("email").hasError("email"))}}function G(o,s){if(1&o&&(e.ynx(0),e.TgZ(1,"mat-option",38)(2,"span",35)(3,"span",39),e._uU(4),e.qZA(),e.TgZ(5,"span",40),e._uU(6),e.qZA()()(),e.BQk()),2&o){const i=s.$implicit;e.xp6(1),e.Q6J("value",i.code),e.xp6(3),e.Oqu(i.name),e.xp6(2),e.Oqu(i.code)}}function W(o,s){if(1&o&&(e.TgZ(0,"mat-select",34)(1,"mat-select-trigger")(2,"span",35)(3,"span",36),e._uU(4),e.qZA()()(),e.YNc(5,G,7,3,"ng-container",37),e.qZA()),2&o){const i=e.oxw(4);e.Q6J("formControl",i.signUpForm.get("countryCode")),e.xp6(4),e.Oqu(i.signUpForm.get("countryCode").value),e.xp6(1),e.Q6J("ngForOf",i.countries)}}function X(o,s){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.ALo(3,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.AsE(" ",e.lcZ(2,2,"login.phone")," ",e.lcZ(3,4,"signup.is_required")," "))}function z(o,s){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.ALo(3,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.AsE(" ",e.lcZ(2,2,"signup.please_enter_a_valid")," ",e.lcZ(3,4,"login.phone")," "))}function K(o,s){if(1&o&&(e.TgZ(0,"div",27)(1,"mat-form-field",28)(2,"mat-label"),e._uU(3),e.ALo(4,"transloco"),e.qZA(),e.YNc(5,W,6,3,"mat-select",32),e.qZA(),e.TgZ(6,"mat-form-field",25)(7,"mat-label"),e._uU(8),e.ALo(9,"transloco"),e.qZA(),e._UZ(10,"input",33),e.YNc(11,X,4,6,"mat-error",20),e.YNc(12,z,4,6,"mat-error",20),e.qZA()()),2&o){const i=e.oxw(3);e.xp6(3),e.hij(" ",e.lcZ(4,6,"login.country_code"),""),e.xp6(2),e.Q6J("ngIf",i.countries),e.xp6(3),e.Oqu(e.lcZ(9,8,"login.phone")),e.xp6(2),e.Q6J("formControlName","phone"),e.xp6(1),e.Q6J("ngIf",i.signUpForm.get("phone").hasError("required")),e.xp6(1),e.Q6J("ngIf",i.signUpForm.get("phone").hasError("phone"))}}function ee(o,s){1&o&&(e.TgZ(0,"mat-form-field",25)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e._UZ(4,"input",41),e.qZA()),2&o&&(e.xp6(2),e.Oqu(e.lcZ(3,2,"signup.company")),e.xp6(2),e.Q6J("formControlName","company"))}function te(o,s){if(1&o&&(e.ynx(0),e.TgZ(1,"mat-option",38)(2,"span",35)(3,"span",39),e._uU(4),e.ALo(5,"transloco"),e.qZA()()(),e.BQk()),2&o){const i=s.$implicit;e.xp6(1),e.Q6J("value",i.code),e.xp6(3),e.Oqu(e.lcZ(5,2,i.label))}}function ie(o,s){if(1&o&&(e.TgZ(0,"mat-form-field",28)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e.TgZ(4,"mat-select",34)(5,"mat-select-trigger")(6,"span",35)(7,"span",36),e._uU(8),e.qZA()()(),e.YNc(9,te,6,4,"ng-container",37),e.qZA()()),2&o){const i=e.oxw(3);e.xp6(2),e.hij(" ",e.lcZ(3,4,"signup.role"),""),e.xp6(2),e.Q6J("formControl",i.signUpForm.get("role")),e.xp6(4),e.Oqu(i.signUpForm.get("role").value),e.xp6(1),e.Q6J("ngForOf",i.roles)}}const w=function(){return["./"]};function oe(o,s){1&o&&(e.TgZ(0,"a",11),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.Q6J("routerLink",e.DdM(4,w)),e.xp6(1),e.hij("",e.lcZ(2,2,"signup.terms")," "))}function ne(o,s){1&o&&(e.TgZ(0,"span"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.Oqu(e.lcZ(2,1,"signup.and")))}function se(o,s){1&o&&(e.TgZ(0,"a",11),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.Q6J("routerLink",e.DdM(4,w)),e.xp6(1),e.hij("",e.lcZ(2,2,"signup.privacyPolicy")," "))}function re(o,s){if(1&o&&(e.TgZ(0,"div",42)(1,"mat-checkbox",43)(2,"span"),e._uU(3),e.ALo(4,"transloco"),e.qZA(),e.YNc(5,oe,3,5,"a",44),e.YNc(6,ne,3,3,"span",20),e.YNc(7,se,3,5,"a",44),e.qZA()()),2&o){const i=e.oxw(3);e.xp6(1),e.Q6J("color","primary")("formControlName","agreements"),e.xp6(2),e.hij("",e.lcZ(4,6,"signup.agreement1")," "),e.xp6(2),e.Q6J("ngIf",i.OnboardingSignUpForm.showTermsAndConditions),e.xp6(1),e.Q6J("ngIf",i.OnboardingSignUpForm.showTermsAndConditions&&i.OnboardingSignUpForm.showPrivacyNotice),e.xp6(1),e.Q6J("ngIf",i.OnboardingSignUpForm.showPrivacyNotice)}}function le(o,s){1&o&&(e.TgZ(0,"span"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.Oqu(e.lcZ(2,1,"signup.create_account_button")))}function ae(o,s){1&o&&e._UZ(0,"mat-progress-spinner",45),2&o&&e.Q6J("diameter",24)("mode","indeterminate")}const me=function(o){return["/sign-in",o]};function ce(o,s){if(1&o){const i=e.EpF();e.TgZ(0,"div",5)(1,"div",6)(2,"div",7),e._UZ(3,"img",8),e.qZA(),e.TgZ(4,"div",9),e._uU(5),e.ALo(6,"transloco"),e.qZA(),e.TgZ(7,"div",10)(8,"div"),e._uU(9),e.ALo(10,"transloco"),e.qZA(),e.TgZ(11,"a",11),e._uU(12),e.ALo(13,"transloco"),e.qZA()(),e.YNc(14,Y,2,5,"fuse-alert",12),e.TgZ(15,"form",13,14),e.YNc(17,V,6,5,"mat-form-field",15),e.YNc(18,R,3,2,"div",16),e.YNc(19,$,7,6,"mat-form-field",15),e.YNc(20,K,13,10,"div",16),e.YNc(21,ee,5,4,"mat-form-field",15),e.YNc(22,ie,10,6,"mat-form-field",17),e.YNc(23,re,8,8,"div",18),e.TgZ(24,"button",19),e.NdJ("click",function(){e.CHM(i);const m=e.oxw(2);return e.KtG(m.signUp())}),e.YNc(25,le,3,3,"span",20),e.YNc(26,ae,1,2,"mat-progress-spinner",21),e.qZA()(),e.TgZ(27,"div",22),e._UZ(28,"languages",23),e.qZA()()()}if(2&o){const i=e.oxw(2);e.xp6(3),e.Q6J("src",i.project.branding.logo,e.LSH),e.xp6(2),e.Oqu(e.lcZ(6,19,"signup.title")),e.xp6(4),e.Oqu(e.lcZ(10,21,"signup.auth_question")),e.xp6(2),e.Q6J("routerLink",e.VKq(25,me,i.project._id)),e.xp6(1),e.hij("",e.lcZ(13,23,"signup.auth_link")," "),e.xp6(2),e.Q6J("ngIf",i.showAlert),e.xp6(1),e.Q6J("formGroup",i.signUpForm),e.xp6(2),e.Q6J("ngIf",i.fields.fullName&&!i.fields.firstName),e.xp6(1),e.Q6J("ngIf",!i.fields.fullName&&i.fields.firstName),e.xp6(1),e.Q6J("ngIf",i.fields.email),e.xp6(1),e.Q6J("ngIf",i.fields.phone),e.xp6(1),e.Q6J("ngIf",i.fields.company),e.xp6(1),e.Q6J("ngIf",i.fields.role&&i.roles),e.xp6(1),e.Q6J("ngIf",i.fields.agreements),e.xp6(1),e.Q6J("color","primary")("disabled",i.signUpForm.disabled),e.xp6(1),e.Q6J("ngIf",!i.signUpForm.disabled),e.xp6(1),e.Q6J("ngIf",i.signUpForm.disabled),e.xp6(2),e.Q6J("colorText",i.project.branding.txtColor)}}function pe(o,s){if(1&o&&(e.TgZ(0,"div",5)(1,"div",6)(2,"div",7),e._UZ(3,"img",8),e.qZA(),e.TgZ(4,"div",9),e._uU(5),e.ALo(6,"transloco"),e.qZA(),e.TgZ(7,"div",10)(8,"div"),e._uU(9),e.ALo(10,"transloco"),e.qZA()()()()),2&o){const i=e.oxw(2);e.xp6(3),e.Q6J("src",i.project.branding.logo,e.LSH),e.xp6(2),e.hij(" ",e.lcZ(6,3,"signup.project_flow_not_set")," "),e.xp6(4),e.Oqu(e.lcZ(10,5,"signup.project_flow_not_set_description"))}}function ue(o,s){if(1&o&&(e.TgZ(0,"div",1),e.YNc(1,ce,29,27,"div",2),e.YNc(2,pe,11,7,"div",2),e.TgZ(3,"div",3),e._UZ(4,"div",4),e.qZA()()),2&o){const i=e.oxw();e.xp6(1),e.Q6J("ngIf",i.projectFlow._id),e.xp6(1),e.Q6J("ngIf",!i.projectFlow._id||!i.project._id)}}const de=[{path:":id",component:(()=>{class o{constructor(i,r,m,p,A,fe,he,ge,_e){this._authService=i,this._formBuilder=r,this._router=m,this._countries=p,this._splashScreenService=A,this._activatedRoute=fe,this._demoService=he,this._passwordlessService=ge,this._changeDetectorRef=_e,this.alert={type:"success",message:""},this.showAlert=!1,this._unsubscribeAll=new C.x,this.generateRandomPhoneNumber=()=>Array.from({length:10},()=>Math.floor(10*Math.random())).join(""),this.countries=this._countries.countryCodes,this.project=null,this.roles=[{label:"signup.roles.founder",code:"founder"},{label:"signup.roles.high_management",code:"highManagement"},{label:"signup.roles.manager",code:"manager"},{label:"signup.roles.developer",code:"developer"},{label:"signup.roles.compliance",code:"compliance"},{label:"signup.roles.marketing",code:"marketing"},{label:"signup.roles.ciso",code:"ciso"}],this._splashScreenService.show(),this._demoService.cleanVariables(),localStorage.removeItem("accessToken"),this.demoData=this._demoService.getDemoData(),this.sendingOTP=!1,this.showFaceLivenessRecommendation=!1}ngOnInit(){this._activatedRoute.params.subscribe(i=>{this.isVerifikProject=i.id===a.N.verifikProject||i.id===a.N.sandboxProject,this.requestProject(i.id)})}requestProject(i){this._passwordlessService.requestProject(i,"onboarding").subscribe({next:r=>{this._onProjectNext(r.data)},error:r=>{console.info({errorHERE:r}),"InternalServer"===r.error.code&&alert("something went wrong, try  again"),this._splashScreenService.hide()},complete:()=>{this._onProjectComplete()}})}_onProjectNext(i){this.project=new c.XR({...i,type:"onboarding"}),this.projectFlow=this.project.currentProjectFlow,this.OnboardingSignUpForm=this.projectFlow.onboardingSettings.signUpForm;for(let r=0;r<i.projectFlows.length;r++){const m=i.projectFlows[r];"login"===m.type&&(this.loginProjectFlow=new c.nd(m))}}_onProjectComplete(){this._splashScreenService.hide();try{this.initForm()}catch(i){console.error({exception:i})}this._changeDetectorRef.markForCheck()}initForm(){const i=a.N.production?0:Math.floor(Math.random()*this._demoService.sampleLastNames.length-1),r=a.N.production?0:Math.floor(Math.random()*this._demoService.sampleFirstNames.length-1),m=Math.floor(1234567*Math.random()),p={fullName:a.N.production?"":`${this._demoService.sampleFirstNames[r]} ${this._demoService.sampleLastNames[i]}`,firstName:a.N.production?"":this._demoService.sampleFirstNames[r],lastName:a.N.production?"":this._demoService.sampleLastNames[i],email:a.N.production?"":`${this._demoService.sampleFirstNames[r].toLowerCase()}_${m}@verifik.co`,phone:a.N.production?"":this.generateRandomPhoneNumber(),countryCode:a.N.production?"":"+1",company:a.N.production?"":`company ${m}`,role:a.N.production?"":this.roles[3].code,agreements:!a.N.production};if(this.fields={},this.OnboardingSignUpForm.fullName&&!this.OnboardingSignUpForm.firstName&&(this.fields.fullName=[p.fullName,l.kI.required]),this.OnboardingSignUpForm.firstName&&(this.fields.firstName=[p.firstName,l.kI.required],this.fields.lastName=[p.lastName,l.kI.required]),this.OnboardingSignUpForm.email&&(this.fields.email=[p.email,l.kI.required],a.N.production&&this.fields.email.push(l.kI.email)),this.OnboardingSignUpForm.phone&&(this.fields.countryCode=[p.countryCode,l.kI.required],this.fields.phone=[p.phone,l.kI.required],a.N.production&&this.fields.phone.push(l.kI.min(8),l.kI.max(10))),(this.OnboardingSignUpForm.showTermsAndConditions||this.OnboardingSignUpForm.showPrivacyNotice)&&(this.fields.agreements=["",l.kI.requiredTrue]),Array.isArray(this.OnboardingSignUpForm.extraFields))for(const A of this.OnboardingSignUpForm.extraFields)this.fields[A]=[p[A]||"",l.kI.required];this.signUpForm=this._formBuilder.group(this.fields)}signUp(){if(this.signUpForm.invalid)return;this.signUpForm.disable(),this.showAlert=!1,localStorage.setItem("signUpData",JSON.stringify(this.signUpForm.value));let i=null;this._passwordlessService.createAppRegistration({project:this.project._id,projectFlow:this.projectFlow._id,...this.signUpForm.value}).subscribe({next:r=>{i=r?.data?.appRegistration,i.token=r?.data?.token},error:r=>{console.info({errorHERE:r}),this.alert={type:"error",message:"Something went wrong, please try again."},this.showAlert=!0,this._splashScreenService.hide()},complete:()=>{this.signUpForm.enable(),this.signUpNgForm.resetForm(),this.showAlert||this._router.navigateByUrl(`/confirmation-required/${i._id}?token=${i.token}`)}})}ngOnDestroy(){this._unsubscribeAll.next(null)}static#e=this.\u0275fac=function(r){return new(r||o)(e.Y36(T.e),e.Y36(l.QS),e.Y36(u.F0),e.Y36(I.K),e.Y36(L.j),e.Y36(u.gz),e.Y36(q.e),e.Y36(Q.i),e.Y36(e.sBO))};static#t=this.\u0275cmp=e.Xpm({type:o,selectors:[["auth-sign-up"]],viewQuery:function(r,m){if(1&r&&e.Gf(O,5),2&r){let p;e.iGM(p=e.CRH())&&(m.signUpNgForm=p.first)}},standalone:!0,features:[e.jDz],decls:1,vars:1,consts:[["class","flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-auto min-w-0",4,"ngIf"],[1,"flex","flex-col","sm:flex-row","items-center","md:items-start","sm:justify-center","md:justify-start","flex-auto","min-w-0"],["class","md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-4 sm:p-12 md:p-16 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none sm:bg-card",4,"ngIf"],[1,"relative","hidden","md:flex","flex-auto","items-center","justify-center","w-1/2","h-full","p-16","lg:px-28","overflow-hidden","bg-gray-800","dark:border-l"],[1,"z-10","relative","w-full","max-w-2xl"],[1,"md:flex","md:items-center","md:justify-end","w-full","sm:w-auto","md:h-full","md:w-1/2","py-8","px-4","sm:p-12","md:p-16","sm:rounded-2xl","md:rounded-none","sm:shadow","md:shadow-none","sm:bg-card"],[1,"w-full","max-w-80","sm:w-80","mx-auto","sm:mx-0"],[1,"w-12"],[3,"src"],[1,"mt-8","text-4xl","font-extrabold","tracking-tight","leading-tight"],[1,"flex","items-baseline","mt-0.5","font-medium"],[1,"ml-1","text-primary-500","hover:underline",3,"routerLink"],["class","mt-8",3,"appearance","showIcon","type",4,"ngIf"],[1,"mt-8",3,"formGroup"],["signUpNgForm","ngForm"],["class","w-full",4,"ngIf"],["fxLayout","row","fxLayoutAlign","start center",4,"ngIf"],["class","w-full mr-2",4,"ngIf"],["class","inline-flex items-end w-full mt-1.5",4,"ngIf"],["mat-flat-button","",1,"fuse-mat-button-large","w-full","mt-6",3,"color","disabled","click"],[4,"ngIf"],[3,"diameter","mode",4,"ngIf"],[1,"w-full","text-center","mt-6"],[3,"colorText"],[1,"mt-8",3,"appearance","showIcon","type"],[1,"w-full"],["id","fullName","matInput","",3,"formControlName"],["fxLayout","row","fxLayoutAlign","start center"],[1,"w-full","mr-2"],["id","firstName","matInput","",3,"formControlName"],["id","lastName","matInput","",3,"formControlName"],["id","email","matInput","",3,"formControlName"],["class","mr-1.5","matPrefix","",3,"formControl",4,"ngIf"],["id","phone","matInput","",3,"formControlName"],["matPrefix","",1,"mr-1.5",3,"formControl"],[1,"flex","items-center"],[1,"sm:mx-0.5","font-medium","text-default"],[4,"ngFor","ngForOf"],[3,"value"],[1,"ml-2"],[1,"ml-2","font-medium"],["id","company-confirm","matInput","",3,"formControlName"],[1,"inline-flex","items-end","w-full","mt-1.5"],[1,"-ml-2",3,"color","formControlName"],["class","ml-1 text-primary-500 hover:underline",3,"routerLink",4,"ngIf"],[3,"diameter","mode"]],template:function(r,m){1&r&&e.YNc(0,ue,5,2,"div",0),2&r&&e.Q6J("ngIf",m.signUpForm&&m.project)},dependencies:[b.o9,y.xw,y.Wh,u.rH,_.O5,d.W,l.u5,l._Y,l.Fj,l.JJ,l.JL,l.UX,l.oH,l.sg,l.u,f.lN,f.KE,f.hX,f.TO,f.qo,x.c,x.Nt,v.ot,v.lW,N.Ps,h.p9,h.oG,U.Cq,U.Ou,F.y4,F.Ot,_.ez,_.sg,Z.LD,Z.gD,Z.$L,J.ey,j.v],encapsulation:2,data:{animation:t.L}})}return o})()}]}}]);