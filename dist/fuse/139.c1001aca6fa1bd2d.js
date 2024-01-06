"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[139],{7139:(C,A,i)=>{i.r(A),i.d(A,{default:()=>M});var w=i(6814),c=i(6223),x=i(2296),y=i(5986),p=i(1043),F=i(617),v=i(4516),N=i(5940),D=i(3403),U=i(4748),T=i(738),g=i(8533),Z=i(8645),u=i(553),e=i(5879),t=i(4855),o=i(9559),s=i(6036),m=i(9162),l=i(4771);const d=["signUpNgForm"];function I(n,f){if(1&n&&(e.TgZ(0,"fuse-alert",27),e._uU(1),e.qZA()),2&n){const a=e.oxw(2);e.Q6J("appearance","outline")("showIcon",!1)("type",a.alert.type)("@shake","error"===a.alert.type),e.xp6(1),e.hij(" ",a.alert.message," ")}}function O(n,f){1&n&&(e.TgZ(0,"mat-error"),e._uU(1," Full name is required "),e.qZA())}function R(n,f){1&n&&(e.TgZ(0,"mat-error"),e._uU(1," Email address is required "),e.qZA())}function _(n,f){1&n&&(e.TgZ(0,"mat-error"),e._uU(1," Please enter a valid email address "),e.qZA())}function J(n,f){1&n&&e._UZ(0,"mat-icon",28),2&n&&e.Q6J("svgIcon","heroicons_solid:eye")}function j(n,f){1&n&&e._UZ(0,"mat-icon",28),2&n&&e.Q6J("svgIcon","heroicons_solid:eye-slash")}function $(n,f){1&n&&(e.TgZ(0,"span"),e._uU(1," Create your free account "),e.qZA())}function k(n,f){1&n&&e._UZ(0,"mat-progress-spinner",29),2&n&&e.Q6J("diameter",24)("mode","indeterminate")}const L=function(){return["/sign-in"]},b=function(){return["./"]};function E(n,f){if(1&n){const a=e.EpF();e.TgZ(0,"div",1)(1,"div",2)(2,"div",3)(3,"div",4),e._UZ(4,"img",5),e.qZA(),e.TgZ(5,"div",6),e._uU(6,"Sign up"),e.qZA(),e.TgZ(7,"div",7)(8,"div"),e._uU(9,"Already have an account?"),e.qZA(),e.TgZ(10,"a",8),e._uU(11,"Sign in "),e.qZA()(),e.YNc(12,I,2,5,"fuse-alert",9),e.TgZ(13,"form",10,11)(15,"mat-form-field",12)(16,"mat-label"),e._uU(17,"Full name"),e.qZA(),e._UZ(18,"input",13),e.YNc(19,O,2,0,"mat-error",14),e.qZA(),e.TgZ(20,"mat-form-field",12)(21,"mat-label"),e._uU(22,"Email address"),e.qZA(),e._UZ(23,"input",15),e.YNc(24,R,2,0,"mat-error",14),e.YNc(25,_,2,0,"mat-error",14),e.qZA(),e.TgZ(26,"mat-form-field",12)(27,"mat-label"),e._uU(28,"Password"),e.qZA(),e._UZ(29,"input",16,17),e.TgZ(31,"button",18),e.NdJ("click",function(){e.CHM(a);const h=e.MAs(30);return e.KtG(h.type="password"===h.type?"text":"password")}),e.YNc(32,J,1,1,"mat-icon",19),e.YNc(33,j,1,1,"mat-icon",19),e.qZA(),e.TgZ(34,"mat-error"),e._uU(35," Password is required "),e.qZA()(),e.TgZ(36,"mat-form-field",12)(37,"mat-label"),e._uU(38,"Company"),e.qZA(),e._UZ(39,"input",20),e.qZA(),e.TgZ(40,"div",21)(41,"mat-checkbox",22)(42,"span"),e._uU(43,"I agree with"),e.qZA(),e.TgZ(44,"a",8),e._uU(45,"Terms "),e.qZA(),e.TgZ(46,"span"),e._uU(47,"and"),e.qZA(),e.TgZ(48,"a",8),e._uU(49,"Privacy Policy "),e.qZA()()(),e.TgZ(50,"button",23),e.NdJ("click",function(){e.CHM(a);const h=e.oxw();return e.KtG(h.signUp())}),e.YNc(51,$,2,0,"span",14),e.YNc(52,k,1,2,"mat-progress-spinner",24),e.qZA()()()(),e.TgZ(53,"div",25),e._UZ(54,"div",26),e.qZA()()}if(2&n){const a=e.MAs(30),r=e.oxw();e.xp6(10),e.Q6J("routerLink",e.DdM(20,L)),e.xp6(2),e.Q6J("ngIf",r.showAlert),e.xp6(1),e.Q6J("formGroup",r.signUpForm),e.xp6(5),e.Q6J("formControlName","name"),e.xp6(1),e.Q6J("ngIf",r.signUpForm.get("name").hasError("required")),e.xp6(4),e.Q6J("formControlName","email"),e.xp6(1),e.Q6J("ngIf",r.signUpForm.get("email").hasError("required")),e.xp6(1),e.Q6J("ngIf",r.signUpForm.get("email").hasError("email")),e.xp6(4),e.Q6J("formControlName","password"),e.xp6(3),e.Q6J("ngIf","password"===a.type),e.xp6(1),e.Q6J("ngIf","text"===a.type),e.xp6(6),e.Q6J("formControlName","company"),e.xp6(2),e.Q6J("color","primary")("formControlName","agreements"),e.xp6(3),e.Q6J("routerLink",e.DdM(21,b)),e.xp6(4),e.Q6J("routerLink",e.DdM(22,b)),e.xp6(2),e.Q6J("color","primary")("disabled",r.signUpForm.disabled),e.xp6(1),e.Q6J("ngIf",!r.signUpForm.disabled),e.xp6(1),e.Q6J("ngIf",r.signUpForm.disabled)}}const M=[{path:":id",component:(()=>{class n{constructor(a,r,h,S,Q,P,q,W,Y){this._authService=a,this._formBuilder=r,this._router=h,this._countries=S,this._splashScreenService=Q,this._activatedRoute=P,this._demoService=q,this._passwordlessService=W,this._changeDetectorRef=Y,this.alert={type:"success",message:""},this.showAlert=!1,this._unsubscribeAll=new Z.x,this.countries=this._countries.countryCodes,this._splashScreenService.show(),this._demoService.cleanVariables(),localStorage.removeItem("accessToken"),this.demoData=this._demoService.getDemoData(),this.sendingOTP=!1,this.showFaceLivenessRecommendation=!1}ngOnInit(){this._activatedRoute.params.subscribe(a=>{this.requestProject(a.id),this.isVerifikProject=a.id===u.N.verifikProject})}requestProject(a){this._passwordlessService.requestProject(a,"onboarding").subscribe({next:r=>{this.project=new g.XR({...r.data,type:"onboarding"}),this.projectFlow=this.project.currentProjectFlow;for(let h=0;h<r.data.projectFlows.length;h++){const S=r.data.projectFlows[h];"login"===S.type&&(this.loginProjectFlow=new g.nd(S))}console.log({project:this.project,flow:this.projectFlow})},error:r=>{console.info({errorHERE:r}),"InternalServer"===r.error.code&&alert("something went wrong, try  again"),this._splashScreenService.hide()},complete:()=>{this.initForm(),this._changeDetectorRef.markForCheck(),this._splashScreenService.hide()}})}initForm(){this.signUpForm=this._formBuilder.group({name:["",c.kI.required],email:["",[c.kI.required,c.kI.email]],password:["",c.kI.required],company:[""],agreements:["",c.kI.requiredTrue]})}signUp(){this.signUpForm.invalid||(this.signUpForm.disable(),this.showAlert=!1,this._authService.signUp(this.signUpForm.value).subscribe(a=>{this._router.navigateByUrl("/confirmation-required")},a=>{this.signUpForm.enable(),this.signUpNgForm.resetForm(),this.alert={type:"error",message:"Something went wrong, please try again."},this.showAlert=!0}))}ngOnDestroy(){this._unsubscribeAll.next(null)}static#e=this.\u0275fac=function(r){return new(r||n)(e.Y36(t.e),e.Y36(c.QS),e.Y36(D.F0),e.Y36(o.K),e.Y36(s.j),e.Y36(D.gz),e.Y36(m.e),e.Y36(l.i),e.Y36(e.sBO))};static#t=this.\u0275cmp=e.Xpm({type:n,selectors:[["auth-sign-up"]],viewQuery:function(r,h){if(1&r&&e.Gf(d,5),2&r){let S;e.iGM(S=e.CRH())&&(h.signUpNgForm=S.first)}},standalone:!0,features:[e.jDz],decls:1,vars:1,consts:[["class","flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-auto min-w-0",4,"ngIf"],[1,"flex","flex-col","sm:flex-row","items-center","md:items-start","sm:justify-center","md:justify-start","flex-auto","min-w-0"],[1,"md:flex","md:items-center","md:justify-end","w-full","sm:w-auto","md:h-full","md:w-1/2","py-8","px-4","sm:p-12","md:p-16","sm:rounded-2xl","md:rounded-none","sm:shadow","md:shadow-none","sm:bg-card"],[1,"w-full","max-w-80","sm:w-80","mx-auto","sm:mx-0"],[1,"w-12"],["src","assets/images/logo/logo.svg"],[1,"mt-8","text-4xl","font-extrabold","tracking-tight","leading-tight"],[1,"flex","items-baseline","mt-0.5","font-medium"],[1,"ml-1","text-primary-500","hover:underline",3,"routerLink"],["class","mt-8",3,"appearance","showIcon","type",4,"ngIf"],[1,"mt-8",3,"formGroup"],["signUpNgForm","ngForm"],[1,"w-full"],["id","name","matInput","",3,"formControlName"],[4,"ngIf"],["id","email","matInput","",3,"formControlName"],["id","password","matInput","","type","password",3,"formControlName"],["passwordField",""],["mat-icon-button","","type","button","matSuffix","",3,"click"],["class","icon-size-5",3,"svgIcon",4,"ngIf"],["id","company-confirm","matInput","",3,"formControlName"],[1,"inline-flex","items-end","w-full","mt-1.5"],[1,"-ml-2",3,"color","formControlName"],["mat-flat-button","",1,"fuse-mat-button-large","w-full","mt-6",3,"color","disabled","click"],[3,"diameter","mode",4,"ngIf"],[1,"relative","hidden","md:flex","flex-auto","items-center","justify-center","w-1/2","h-full","p-16","lg:px-28","overflow-hidden","bg-gray-800","dark:border-l"],[1,"z-10","relative","w-full","max-w-2xl"],[1,"mt-8",3,"appearance","showIcon","type"],[1,"icon-size-5",3,"svgIcon"],[3,"diameter","mode"]],template:function(r,h){1&r&&e.YNc(0,E,55,23,"div",0),2&r&&e.Q6J("ngIf",h.signUpForm)},dependencies:[D.rH,w.O5,T.W,c.u5,c._Y,c.Fj,c.JJ,c.JL,c.UX,c.sg,c.u,p.lN,p.KE,p.hX,p.TO,p.R9,v.c,v.Nt,x.ot,x.lW,x.RK,F.Ps,F.Hw,y.p9,y.oG,N.Cq,N.Ou],encapsulation:2,data:{animation:U.L}})}return n})()}]},9162:(C,A,i)=>{i.d(A,{e:()=>Z});var w=i(5861),c=i(5619),x=i(553),y=i(1088),p=i(6799);class F{constructor(e){if(e){this.documentNumber=e.documentNumber,this.firstName=`${e.firstName||""} ${e.middleName||""}`.trim()||`${e.name1||""} ${e.name2||""} ${e.name3||""}`.trim()||`${e.givenNames||""}`.trim(),this.lastName=`${e.lastName||""} ${e.secondLastName||""}`.trim()||`${e.surname||""}`.trim(),this.fullName=`${this.firstName||""} ${this.lastName||""}`,this.dateOfBirth=e.dateOfBirth,this.country=e.country,this.nationality=e.nationality,this.gender=e.gender||e.sex,this.placeOfBirth=e.placeOfBirth||e.birthPlace,this.issueDate=e.dateOfIssue||e.issueDate,this.expirationDate=e.dateOfExpiry||e.expiryDate||e.expirationDate,this.issuingAuthority=e.issuingAuthority,this.maritalStatus=e.marritalStatus||e.maritalStatus,this.observations=e.observations,this.code=e.code,this.organDonor=e.organDonor,this.bloodType=e.bloodType,this.locationCode=e.locationCode,this.inscriptionDate=e.inscriptionDate,this.notMapped=[];for(const t in e)Object.prototype.hasOwnProperty.call(e,t)&&(this[t]||this.notMapped.push({key:t,value:e[t]}))}}}class v{constructor(e){if(e){this._id=e._id,this.documentType=e.documentType,this.documentNumber=e.documentNumber,this.url=e.url,this.status=e.status,this.validationMethod=e.validationMethod,this.namesMatch=e.namesMatch,this.OCRExtraction=new F(e.OCRExtraction),this.arrayFields=[{key:"documentType",value:this.documentType}];for(const t in this.OCRExtraction){if(!Object.prototype.hasOwnProperty.call(this.OCRExtraction,t))continue;const o=this.OCRExtraction[t];!o||Array.isArray(o)||this.arrayFields.push({key:t,value:o})}this.scoreValidated=e.scoreValidated,this.scoreValidation=e.scoreValidation}}}class N{constructor(e){this._id=e._id||"new",this.identifier=e.identifier,this.lead=e.lead,this.status=e.status,this.liveness=e.liveness||{},this.comparison=e.comparison||{},this.comparisonResult=e.comparisonResult||[],this.generalInformation=e.generalInformation||{},this.lat=e.lat,this.lng=e.lng}}class D{constructor(e){e&&(this._id=e._id||"new",this.status=e.status||"active",this.phone=e.phone,this.countryCode=e.countryCode,this.name=e.name,this.companyName=e.companyName,this.email=e.email,this.website=e.website,this.jobFunction=e.jobFunction,this.sessionsCount=e.sessionsCount||0,this.sessionsLimit=e.sessionsLimit||10)}}var U=i(5879),T=i(2065);let g=null,Z=(()=>{class u{constructor(t,o){this._httpWrapperService=t,this.breakpointObserver=o,this._faceapi=new c.X(null),this.apiUrl=x.N.apiUrl,this.loadModels(),this.initNavigation(),this.initDemoData(),g=this,o.observe([y.u3.XSmall,y.u3.Small]).subscribe(s=>{this.demoData.isMobile=s.matches,this.demoData.time=s.matches?500:250}),this.demoData.OS=this.detectOS()}detectOS(){const t=window.navigator.userAgent.toLowerCase();return/android/.test(t)?"ANDROID":/iphone|ipad|ipod/.test(t)?"IOS":"DESKTOP"}get faceapi$(){return this._faceapi.asObservable()}loadModels(){var t=this;return(0,w.Z)(function*(){const o=[];o.push(p.qB.ssdMobilenetv1.loadFromUri("assets/models")),o.push(p.qB.faceLandmark68Net.loadFromUri("assets/models")),yield Promise.allSettled(o),t._faceapi.next(!0)})()}getNavigation(){return this.navigation}initNavigation(){this.navigation={currentStep:1,lastStep:5}}getDemoData(){return!this.demoData.proFields?.length&&localStorage.getItem("proFields")&&(this.demoData.pro=new v(JSON.parse(localStorage.getItem("pro"))),this.demoData.proFields=this.demoData.pro.arrayFields),!this.demoData.promptFields?.length&&localStorage.getItem("promptFields")&&(this.demoData.prompt=new v(JSON.parse(localStorage.getItem("prompt"))),this.demoData.promptFields=this.demoData.prompt.arrayFields),!this.demoData.studioFields?.length&&localStorage.getItem("studioFields")&&(this.demoData.studio=new v(JSON.parse(localStorage.getItem("studio"))),this.demoData.studioFields=this.demoData.studio.arrayFields),!this.demoData.liveness?._id&&localStorage.getItem("liveness")&&(this.demoData.liveness=JSON.parse(localStorage.getItem("liveness"))),!this.demoData.livenessResult.length&&localStorage.getItem("livenessResult")&&(this.demoData.livenessResult=JSON.parse(localStorage.getItem("livenessResult"))),!this.demoData.comparison?._id&&localStorage.getItem("comparison")&&(this.demoData.comparison=JSON.parse(localStorage.getItem("comparison"))),!this.demoData.comparisonResult.length&&localStorage.getItem("comparisonResult")&&(this.demoData.comparisonResult=JSON.parse(localStorage.getItem("comparisonResult"))),this.demoData}initDemoData(){this.demoData={loading:!1,liveness:{},comparison:{},livenessResult:[],comparisonResult:[],generalInformation:[],location:[],documentType:{},documentTypeFields:[],pro:{},proFields:[],studio:{},studioFields:[],prompt:{},promptFields:[],lat:null,lng:null}}setDemoDocument(t){this.demoData.proFields=[],this.demoData.promptFields=[],this.demoData.studioFields=[],this.formatAndSaveOCRs(t.pro,"pro"),this.formatAndSaveOCRs(t.studio,"studio"),this.formatAndSaveOCRs(t.prompt,"prompt"),this.demoData.studio?localStorage.setItem("documentId",this.demoData.studio._id):this.demoData.prompt?localStorage.setItem("documentId",this.demoData.prompt._id):this.demoData.pro&&localStorage.setItem("documentId",this.demoData.pro._id)}formatAndSaveOCRs(t,o){const s=`${o}Fields`;if(!t||!t.documentNumber)return localStorage.removeItem(o),void localStorage.removeItem(s);this.demoData[s].push({key:"documentType",value:t.documentType}),this.demoData[s].push({key:"documentNumber",value:t.documentNumber});const m=new v(t);this.demoData[o]=m,this.demoData[s]=m.arrayFields,localStorage.setItem(o,JSON.stringify(t)),localStorage.setItem(s,JSON.stringify(this.demoData[s]))}setDemoLiveness(t){this.demoData.liveness=t,this.demoData.liveness.result.liveness_score=parseInt(""+100*this.demoData.liveness.result.liveness_score),this.demoData.liveness.result.min_score=parseInt(""+100*this.demoData.liveness.result.min_score),this.demoData.livenessResult=[];for(const o in t.result)this.demoData.livenessResult.push({key:o,value:t.result[o]});localStorage.setItem("livenessId",t._id),localStorage.setItem("liveness",JSON.stringify(t)),localStorage.setItem("livenessResult",JSON.stringify(this.demoData.livenessResult))}setDemoCompare(t){this.demoData.comparison=t,this.demoData.comparison.result.score=parseInt(""+100*this.demoData.comparison.result.score);for(const o in t.result)this.demoData.comparisonResult.push({key:o,value:t.result[o]});localStorage.setItem("comparisonId",t._id),localStorage.setItem("comparison",JSON.stringify(t)),localStorage.setItem("comparisonResult",JSON.stringify(this.demoData.comparisonResult))}moveToStep(t){t>this.navigation.lastStep||t<=0||(this.navigation.currentStep=t,localStorage.setItem("step",`${t}`))}restart(){this.cleanVariables(),this.navigation.currentStep=1,localStorage.setItem("step",`${this.navigation.currentStep}`)}getDeviceDetails(){if(this.demoData.generalInformation.length)return;const t={userAgent:navigator.userAgent,platform:navigator.platform,appName:navigator.appName,appVersion:navigator.appVersion,language:navigator.language,onLine:navigator.onLine,cookiesEnabled:navigator.cookieEnabled,doNotTrack:navigator.doNotTrack,screenResolution:`${screen.width} x ${screen.height}`,screenAvailableResolution:`${screen.availWidth} x ${screen.availHeight}`,colorDepth:screen.colorDepth,pixelDepth:screen.pixelDepth,innerWidth:window.innerWidth,innerHeight:window.innerHeight,outerWidth:window.outerWidth,outerHeight:window.outerHeight,touchSupported:"ontouchstart"in window,geolocationSupported:"geolocation"in navigator,onlineStatus:navigator.onLine?"Online":"Offline"};return this.demoData.generalInformation.push({key:"device",value:t.platform},{key:"language",value:t.language},{key:"userAgent",value:t.userAgent}),this.getLocation(),t}getLocation(){navigator.geolocation?navigator.geolocation.getCurrentPosition(this.showPosition,this.showError):console.log("Geolocation is not supported by this browser.")}showPosition(t){g.demoData.lat=t?.coords.latitude,g.demoData.lng=t?.coords.longitude,localStorage.setItem("lat",g.demoData.lat),localStorage.setItem("lng",g.demoData.lng)}showError(t){switch(t.code){case t.PERMISSION_DENIED:console.log("User denied the request for Geolocation.");break;case t.POSITION_UNAVAILABLE:console.log("Location information is unavailable.");break;case t.TIMEOUT:console.log("The request to get user location timed out.");break;case t.UNKNOWN_ERROR:console.log("An unknown error occurred.")}}reverseGeocodeWithOSM(t,o){return(0,w.Z)(function*(){const s=`https://nominatim.openstreetmap.org/reverse?format=json&lat=${t}&lon=${o}`;try{const l=yield(yield fetch(s)).json();return l&&l.display_name?l:null}catch(m){return console.error("Error during reverse geocoding with OSM:",m),null}})()}getAddress(){var t=this;return(0,w.Z)(function*(){const o=t.demoData.lat||localStorage.getItem("lat"),s=t.demoData.lng||localStorage.getItem("lng");if(!o||!s)return null;if(t.demoData.location.length)return t.demoData.location;let m=localStorage.getItem("location");if(m)return void(t.demoData.location=JSON.parse(m));const l=yield t.reverseGeocodeWithOSM(o,s);if(l){for(const d in l.address)Object.prototype.hasOwnProperty.call(l.address,d)&&t.demoData.location.push({key:d,value:l.address[d]});return localStorage.setItem("location",JSON.stringify(t.demoData.location)),t.demoData.location}})()}getLead(){if(this.lead)return this.lead;const t=localStorage.getItem("lead");return t?(this.lead=new D(JSON.parse(t)),this.lead):null}setLead(t){localStorage.setItem("accessToken",t.token),this.lead=new D(t),localStorage.setItem("lead",JSON.stringify(this.lead))}getSession(){if(this.session)return this.session;const t=localStorage.getItem("session");return t?(this.session=new N(JSON.parse(t)),this.session):null}getBiggestFace(t){let s,o=0;for(const m of t){const l=m.width*m.height;l>o&&(s=m,o=l)}return s}cutFaceIdCard(t,o,s){const m=s.getContext("2d");let l=Math.ceil(2*o.width),d=Math.ceil(2*o.height),I=Math.floor(o.x)-o.width/2,O=Math.floor(o.y)-o.height/2;return l>t.naturalWidth&&(l=t.naturalWidth,d=t.naturalHeight,I=0,O=0),s.height=d,s.width=l,m.drawImage(t,I,O,l,d,0,0,l,d),s.toDataURL("image/jpeg")}setSession(t){this.session=new N(t),localStorage.setItem("session",JSON.stringify(this.session))}requestDocument(t){return this._httpWrapperService.sendRequest("get",`${this.apiUrl}/v2/document-validations/demo/${t}`)}sendDocument(t){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/ocr/scan-demo`,t)}sendSelfie(t){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/face-recognition/liveness/demo`,t)}detectFace(t){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/face-recognition/detect/demo`,t)}compareDocumentWithSelfie(t){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/face-recognition/compare/demo`,t)}createLead(t){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/leads`,t)}createSession(t){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/liveness-sessions`,{...t})}cleanVariables(){const t=["documentId","pro","studio","prompt","proFields","studioFields","promptFields","extractedData","liveness","livenessId","livenessResult","comparison","comparisonResult","comparisonId","idCard","idCardFaceImage","sessionToken"];for(let o=0;o<t.length;o++){const s=t[o];localStorage.removeItem(s),this.demoData[s]&&(this.demoData[s]=Array.isArray(this.demoData[s])?[]:Object.keys(this.demoData[s])?{}:null)}}generateUniqueId(){const t=window.navigator,o=window.screen;return{hash:this.simpleHash(`${t.userAgent}-${t.language}-${t.platform}-${o.height}x${o.width}`),userAgent:t.userAgent,height:o.height,width:o.width}}simpleHash(t){let o=0;if(0===t.length)return o.toString();for(let s=0;s<t.length;s++)o=(o<<5)-o+t.charCodeAt(s),o&=o;return o.toString()}static#e=this.\u0275fac=function(o){return new(o||u)(U.LFG(T.O),U.LFG(y.Yg))};static#t=this.\u0275prov=U.Yz7({token:u,factory:u.\u0275fac,providedIn:"root"})}return u})()}}]);