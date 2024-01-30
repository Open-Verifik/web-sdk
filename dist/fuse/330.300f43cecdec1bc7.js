"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[330],{8340:(T,M,c)=>{c.d(M,{H:()=>m});var u=c(553),v=c(9397),I=c(8533),_=c(5879),b=c(2065),P=c(8991);let m=(()=>{class x{constructor(d,l){this._httpWrapper=d,this._translocoService=l,this.baseUrl=u.N.apiUrl}getNavigation(){return this.navigation}initNavigation(){let d=1;const l=[],e={},p=this.currentProjectFlow.onboardingSettings.steps;return["mandatory","optional"].includes(p.document)&&(d++,l.push({code:"document",status:p.document}),e.document=p.document,d++,l.push({code:"documentReview",status:p.document}),e.documentReview=p.document),["mandatory","optional"].includes(p.liveness)&&(d++,l.push({code:"liveness",status:p.liveness}),e.liveness=p.liveness,e.document&&(d++,e.documentLivenessReview=p.liveness)),l.push({code:"end",status:"mandatory"}),d++,this.navigation={currentStep:1,lastStep:d,steps:p,map:e,displayableSteps:l},this.navigation}getProject(){return this.currentProject}navigateTo(d){setTimeout(()=>{if("next"!==d)this.navigation.currentStep=d;else switch(this.navigation.currentStep){case"liveness":this.navigation.currentStep="documentLivenessReview";break;case"document":this.navigation.currentStep="documentReview";break;case"documentReview":this.navigation.currentStep="liveness";break;case"documentLivenessReview":this.navigation.currentStep="end"}},750)}getAppRegistration(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations/me`,d).pipe((0,v.b)(l=>{this.appRegistration=l.data,this.currentProject=new I.XR({...this.appRegistration.project,type:"onboarding"}),this.currentProjectFlow=this.appRegistration.projectFlow}))}createAppRegistration(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations`,d)}sendEmailValidation(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations`,{email:d,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id,type:"onboarding",validationMethod:"verificationCode",language:this._translocoService.getActiveLang()}).pipe((0,v.b)(l=>{}))}sendPhoneValidation(d,l){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations`,{countryCode:d,phone:l,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id,type:"onboarding",validationMethod:"verificationCode",language:this._translocoService.getActiveLang()}).pipe((0,v.b)(e=>{}))}confirmEmailValidation(d,l){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations/validate`,{email:d,otp:l,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id})}confirmPhoneValidation(d,l,e){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations/validate`,{countryCode:d,phone:l,otp:e,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id})}updateAppRegistration(d){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}`,{...d})}syncAppRegistration(d){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/sync`,{step:d})}createDocumentValidation(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/document-validations/app-registration`,d)}createBiometricValidation(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/biometric-validations/app-registration`,d)}getIdentityImages(d){return this._httpWrapper.sendRequest("get",`${this.baseUrl}/v2/identity-images`,d)}compareFaces(){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/face-recognition/compare/app-registration`,{})}restartKYC(){return this._httpWrapper.sendRequest("delete",`${this.baseUrl}/v2/biometric-validations/${this.appRegistration.biometricValidation._id}`)}static#t=this.\u0275fac=function(l){return new(l||x)(_.LFG(b.O),_.LFG(P.Vn))};static#e=this.\u0275prov=_.Yz7({token:x,factory:x.\u0275fac,providedIn:"root"})}return x})()},5789:(T,M,c)=>{c.d(M,{w:()=>P});var u=c(6814),v=c(1447),I=c(8991),_=c(5879),b=c(3814);let P=(()=>{class m{static#t=this.\u0275fac=function(d){return new(d||m)};static#e=this.\u0275cmp=_.Xpm({type:m,selectors:[["app-demo-footer"]],standalone:!0,features:[_.jDz],decls:4,vars:3,consts:[["fxLayout","row","fxLayoutAlign","center center",1,"footer"],["href","https://verifik.co"]],template:function(d,l){1&d&&(_.TgZ(0,"div",0)(1,"a",1),_._uU(2),_.ALo(3,"transloco"),_.qZA()()),2&d&&(_.xp6(2),_.Oqu(_.lcZ(3,1,"footerText")))},dependencies:[v.o9,b.xw,b.Wh,u.ez,I.y4,I.Ot],styles:[".footer[_ngcontent-%COMP%]{width:100%;height:60px;position:absolute;bottom:0;background-color:#fff;box-shadow:3px 3px 3px #0000000d;z-index:3}"]})}return m})()},1094:(T,M,c)=>{c.d(M,{s:()=>F});var u=c(5861),v=c(6814),I=c(1447),_=c(2296),b=c(5986),P=c(5940),m=c(8991),x=c(2982),t=c(8645),d=c(4354),l=c(6799),e=c(5879),p=c(9162),E=c(6036),w=c(3814);const S=["maskResult"],R=["toSend"],y=["cardIdFace"];function A(g,O){if(1&g&&(e.TgZ(0,"div")(1,"div",16),e._uU(2),e.qZA(),e.TgZ(3,"div",17),e._uU(4),e.qZA()()),2&g){const i=e.oxw(2);e.xp6(1),e.Udp("color",i.project.branding.titleColor),e.xp6(1),e.Oqu(i.errorFace.title),e.xp6(1),e.Udp("color",i.project.branding.txtColor),e.xp6(1),e.Oqu(i.errorFace.subtitle)}}function U(g,O){if(1&g){const i=e.EpF();e.TgZ(0,"webcam",18),e.NdJ("imageCapture",function(n){e.CHM(i);const o=e.oxw(2);return e.KtG(o.proccessImage(n))})("initError",function(n){e.CHM(i);const o=e.oxw(2);return e.KtG(o.cameraError(n))}),e.qZA()}if(2&g){const i=e.oxw(2);e.Q6J("height",i.camera.dimensions.video.max.height)("width",i.camera.dimensions.video.max.width)("videoOptions",i.camera.configuration)("imageQuality",1)("captureImageData",!0)("allowCameraSwitch",!1)("trigger",i.takePicture$)("mirrorImage",i.demoData.isMobile?"never":"always")}}function L(g,O){if(1&g){const i=e.EpF();e.TgZ(0,"div",2),e._UZ(1,"canvas",3,4),e.TgZ(3,"div",5),e.YNc(4,A,5,6,"div",6),e.qZA(),e.TgZ(5,"div",7),e.YNc(6,U,1,8,"webcam",8),e._UZ(7,"canvas",9,10)(9,"canvas",null,11),e.qZA(),e.TgZ(11,"div",12)(12,"button",13),e.NdJ("click",function(){e.CHM(i);const n=e.oxw();return e.KtG(n.takePictureSnapshot())}),e._uU(13),e.ALo(14,"transloco"),e.qZA(),e.TgZ(15,"button",14),e.NdJ("click",function(){e.CHM(i);const n=e.oxw();return e.KtG(n.ngOnInit())}),e._uU(16),e.ALo(17,"transloco"),e.qZA(),e.TgZ(18,"button",15),e.NdJ("click",function(){e.CHM(i);const n=e.oxw();return e.KtG(n.continue())}),e._uU(19),e.ALo(20,"transloco"),e.qZA()()()}if(2&g){const i=e.oxw();e.xp6(4),e.Q6J("ngIf",i.errorFace&&!i.loadingResults),e.xp6(1),e.Udp("width",i.camera.dimensions.video.width,"px")("height",i.camera.dimensions.video.height,"px"),e.xp6(1),e.Q6J("ngIf",!i.response.base64Image),e.xp6(1),e.Udp("width",i.response.base64Image?i.camera.dimensions.result.width:i.camera.dimensions.video.width,"px")("height",i.response.base64Image?i.camera.dimensions.result.height:i.camera.dimensions.video.height,"px"),e.xp6(2),e.ekj("hidden",!0),e.xp6(3),e.Udp("background",i.project.branding.buttonColor)("color",i.project.branding.buttonTxtColor),e.ekj("hidden",i.response.base64Image),e.Q6J("disabled",i.errorFace),e.xp6(1),e.hij(" ",e.lcZ(14,32,"id_scanning.manual_capture_button")," "),e.xp6(2),e.Udp("background",i.project.branding.buttonColor)("color",i.project.branding.buttonTxtColor),e.ekj("hidden",!i.response.base64Image),e.xp6(1),e.hij(" ",e.lcZ(17,34,"id_scanning.retry")," "),e.xp6(2),e.Udp("color",i.project.branding.txtColor),e.ekj("hidden",!i.response.base64Image),e.xp6(1),e.hij(" ",e.lcZ(20,36,"continue")," ")}}function j(g,O){if(1&g&&(e.TgZ(0,"div",19),e._UZ(1,"img",20),e.TgZ(2,"h1",21),e._uU(3),e.ALo(4,"transloco"),e.qZA(),e.TgZ(5,"p",21),e._uU(6),e.ALo(7,"transloco"),e.qZA()()),2&g){const i=e.oxw();e.xp6(2),e.Udp("color",i.project.branding.titleColor),e.xp6(1),e.Oqu(e.lcZ(4,6,"id_scanning.camera_not_found")),e.xp6(2),e.Udp("color",i.project.branding.txtColor),e.xp6(1),e.hij(" ",e.lcZ(7,8,"id_scanning.camera_not_found_description")," ")}}function Z(g,O){if(1&g&&(e.TgZ(0,"p",21),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&g){const i=e.oxw(2);e.Udp("color",i.project.branding.txtColor),e.xp6(1),e.AsE(" ",e.lcZ(2,4,"id_scanning.remaining_attempts")," ",i.attempts.limit-i.attempts.current," ")}}function k(g,O){if(1&g){const i=e.EpF();e.TgZ(0,"div",19),e._UZ(1,"img",22),e.TgZ(2,"h1",21),e._uU(3),e.ALo(4,"transloco"),e.qZA(),e.TgZ(5,"p",21),e._uU(6),e.ALo(7,"transloco"),e.qZA(),e.YNc(8,Z,3,6,"p",23),e.TgZ(9,"button",24),e.NdJ("click",function(){e.CHM(i);const n=e.oxw();return e.KtG(n.attempts.limit-n.attempts.current>0?n.tryAgain():n.restartDemo())}),e._uU(10),e.ALo(11,"transloco"),e.qZA()()}if(2&g){const i=e.oxw();e.xp6(1),e.Q6J("src",i.attempts.limit-i.attempts.current>0?"https://cdn.verifik.co/demo/failedtodetectdocument@3x.png":"https://cdn.verifik.co/demo/redstop.svg",e.LSH),e.xp6(1),e.Udp("color",i.project.branding.titleColor),e.xp6(1),e.hij(" ",e.lcZ(4,13,i.attempts.limit-i.attempts.current>0?"id_scanning.document_not_detected":"id_scanning.failed_to_detect_limit")," "),e.xp6(2),e.Udp("color",i.project.branding.txtColor),e.xp6(1),e.hij(" ",e.lcZ(7,15,i.attempts.limit-i.attempts.current>0?"id_scanning.document_not_detected_description":"id_scanning.failed_to_detect_limit_description")," "),e.xp6(2),e.Q6J("ngIf",i.attempts.limit-i.attempts.current>0),e.xp6(1),e.Udp("background",i.project.branding.buttonColor)("color",i.project.branding.buttonTxtColor),e.xp6(1),e.hij(" ",e.lcZ(11,17,i.failedToDetectDocument?"id_scanning.retry":"restart")," ")}}let F=(()=>{class g{get takePicture$(){return this.takePicture.asObservable()}constructor(i,a,n,o,r){this._dom=i,this._demoService=a,this._splashScreenService=n,this._translocoService=o,this.renderer=r,this.aspectRatio=85.6/53.98,this.takePicture=new t.x,this.setDefaultCamera=()=>{this.camera={hasPermissions:!1,isLoading:!1,configuration:{frameRate:{ideal:30,max:30},[this.demoData.isMobile?"width":"height"]:{ideal:1080},facingMode:d.w[this.demoData.isMobile]},dimensions:{video:{max:{height:Math.ceil(.7*window.innerHeight),width:Math.ceil(.9*window.innerWidth)}}}}},this.setDefaultInterval=()=>{this.interval={}},this.setDefaultAttempts=()=>{this.attempts={current:0,limit:3}},this.setDefaultResponse=()=>{this.response={isLoading:!1,isFailed:!1}},this.setVideoNgxCameraData=()=>{const s=this._dom.nativeElement.querySelector("video");s&&(s.addEventListener("loadeddata",()=>{this.setVideoDimensions(s),this.drawRect()}),this.interval.detectFace||(this.interval.detectFace=setInterval(()=>{this.response.base64Image&&(this.interval.detectFace=clearInterval(this.interval.detectFace)),this.takePicture.next()},this.demoData.time)),this.interval.checkNgxVideo=clearInterval(this.interval.checkNgxVideo),this.setVideoDimensions(s),this.drawRect(),this.loading({isLoading:!1,start:!0}))},this.loading=({isLoading:s=!0,start:h,result:f})=>{const C=h?"camera":f&&"response";C&&(this[C].isLoading=s);const D=s?"show":"hide";this.demoData.loading=s,this._splashScreenService[D]()},this.setImageOnCanvas=(s,h,f,C)=>{s.width=C.width,s.height=C.height,s.style.marginLeft=`${C.offsetX||0}px`,s.style.marginTop=`${C.offsetY||0}px`;const D=s.getContext("2d");D.clearRect(0,0,f.width,f.height),D.drawImage(h,f.offsetX,f.offsetY,f.width,f.height,0,0,C.width,C.height)},this.demoData=this._demoService.getDemoData(),this.startDefaultValues(),this.setDefaultAttempts(),this.setDefaultInterval(),this.renderer.listen("window","resize",()=>{this.interval.checkNgxVideo=setInterval(()=>{this.setVideoNgxCameraData()},this.demoData.time)})}ngOnInit(){var i=this;this.startDefaultValues(),this.camera.hasPermissions=!0,this.errorFace={},this.loading({start:!0}),this._demoService.faceapi$.subscribe(function(){var a=(0,u.Z)(function*(n){n&&(i.interval.checkNgxVideo=setInterval(()=>{i.setMaxVideoDimensions(),i.setVideoNgxCameraData()},i.demoData.time))});return function(n){return a.apply(this,arguments)}}())}startDefaultValues(){this.setDefaultResponse(),this.setDefaultCamera(),this.setMaxVideoDimensions()}setVideoDimensions(i){this.camera.dimensions.video.height=i.clientHeight,this.camera.dimensions.video.width=i.clientWidth;const a=this.maskResultCanvasRef.nativeElement;a.style.marginLeft="0px",a.style.marginTop="0px"}setMaxVideoDimensions(){this.camera.dimensions.video={max:{height:Math.ceil(.7*window.innerHeight),width:Math.ceil(.9*window.innerWidth)}},this.camera.dimensions.result=void 0}setResultDimensions(i,a,n){a<n?(i.offsetY=Math.floor(.1*a),i.height=Math.floor(.8*a),i.width=Math.floor(this.aspectRatio*i.height),i.offsetX=Math.floor((n-i.width)/2)):(i.offsetX=Math.floor(.1*n),i.width=Math.floor(.8*n),i.height=Math.floor(this.aspectRatio*i.width),i.offsetY=Math.floor((a-i.height)/2))}drawRect(){this.camera.dimensions.result={height:0,width:0,offsetX:0,offsetY:0},this.setResultDimensions(this.camera.dimensions.result,this.camera.dimensions.video.height,this.camera.dimensions.video.width);const i=this.maskResultCanvasRef.nativeElement,a=this.camera.dimensions.video,n=this.camera.dimensions.result;i.height=a.height,i.width=a.width;const o=i.getContext("2d");o.clearRect(0,0,a.width,a.height),o.fillStyle="rgba(255, 255, 255, 0.75)",o.fillRect(0,0,a.width,a.height),o.globalCompositeOperation="destination-out",o.fillStyle="rgba(0, 0, 0, 1)",o.fillRect(n.offsetX,n.offsetY,n.width,n.height),o.globalCompositeOperation="source-over"}cameraError(i){i.mediaStreamError&&"NotAllowedError"===i.mediaStreamError.name&&(this.loading({isLoading:!1,start:!0}),this.camera.hasPermissions=!1)}proccessImage(i){var a=this;if(this.response.base64Image)return;if(!this.interval.detectFace)return void this.takePictureManual(i);const n=new Image;n.src=i.imageAsDataUrl,n.onload=(0,u.Z)(function*(){try{a.detectFace(n)}catch(o){alert(o.message)}})}detectFace(i){var a=this;return(0,u.Z)(function*(){try{const n=yield l.Qr(i,new l.d7({minConfidence:.2})).withFaceLandmarks();return n.length?(a.checkFaceTimeout=clearTimeout(a.checkFaceTimeout),a.errorFace=null,n):(a.checkFaceTimeout||(a.checkFaceTimeout=setTimeout(()=>{a.errorFace={title:a._translocoService.translate("id_scanning.face_not_found"),subtitle:a._translocoService.translate("id_scanning.face_not_found_details")}},3*a.demoData.time)),null)}catch(n){alert(n.message)}})()}takePictureManual(i){var a=this;const n=new Image;n.src=i.imageAsDataUrl,n.onload=(0,u.Z)(function*(){const o=yield a.detectFace(n);if(!o||!o.length)return alert(a._translocoService.translate("id_scanning.face_not_found")),a.tryAgain();const r=a._demoService.getBiggestFace(o.map(f=>f.detection.box));a.idCard={face:a._demoService.cutFaceIdCard(n,r,a.cardIdFaceRef.nativeElement)},a.camera.dimensions.real={height:0,width:0,offsetX:0,offsetY:0},a.setResultDimensions(a.camera.dimensions.real,n.height,n.width),a.setImageOnCanvas(a.maskResultCanvasRef.nativeElement,n,a.camera.dimensions.real,a.camera.dimensions.result);const h=a.ToSendCanvasRef.nativeElement;a.setImageOnCanvas(h,n,a.camera.dimensions.real,a.camera.dimensions.real),a.response.base64Image=h.toDataURL("image/jpeg")})}takePictureSnapshot(){this.interval.detectFace=clearInterval(this.interval.detectFace),this.takePicture.next()}continue(){var i=this;return(0,u.Z)(function*(){const a={image:i.response.base64Image.replace("data:image/jpeg;base64","")};i.loading({result:!0}),i._demoService.sendDocument(a).subscribe(n=>{i._demoService.setDemoDocument(n.data),localStorage.setItem("idCardFaceImage",i.idCard.face),localStorage.setItem("documentId",n.data._id),i.loading({isLoading:!1}),i._demoService.moveToStep(3)},n=>{i.response.isFailed=!0,i.loading({isLoading:!1})})})()}tryAgain(){this.attempts.current++,this.ngOnInit()}restartDemo(){this._demoService.restart()}static#t=this.\u0275fac=function(a){return new(a||g)(e.Y36(e.SBq),e.Y36(p.e),e.Y36(E.j),e.Y36(m.Vn),e.Y36(e.Qsj))};static#e=this.\u0275cmp=e.Xpm({type:g,selectors:[["id-scanning-ios"]],viewQuery:function(a,n){if(1&a&&(e.Gf(S,5),e.Gf(R,5),e.Gf(y,5)),2&a){let o;e.iGM(o=e.CRH())&&(n.maskResultCanvasRef=o.first),e.iGM(o=e.CRH())&&(n.ToSendCanvasRef=o.first),e.iGM(o=e.CRH())&&(n.cardIdFaceRef=o.first)}},standalone:!0,features:[e.jDz],decls:3,vars:3,consts:[["fxLayout","column","fxLayoutAlign","center center","class","bg-white rounded-lg shadow-lg m-5 p-4 w-full",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center","class","id-scanning-error-div",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center",1,"bg-white","rounded-lg","shadow-lg","m-5","p-4","w-full"],["hidden","true"],["cardIdFace",""],["fxLayout","column","fxLayoutAlign","center center",1,"text-center","h-20","pb-4","sm:h-8","xs:h-8","my-2"],[4,"ngIf"],[1,"relative"],[3,"height","width","videoOptions","imageQuality","captureImageData","allowCameraSwitch","trigger","mirrorImage","imageCapture","initError",4,"ngIf"],[1,"absolute","top-0","left-0"],["maskResult",""],["toSend",""],["fxLayout","row","fxLayoutAlign","center center"],["mat-raised-button","",1,"m-4","z-index-2",3,"disabled","click"],["mat-stroked-button","",1,"m-4","z-index-2",3,"click"],["mat-raised-button","",1,"mx-2",3,"click"],[1,"text-3xl","font-bold"],[1,"text-gray-600"],[3,"height","width","videoOptions","imageQuality","captureImageData","allowCameraSwitch","trigger","mirrorImage","imageCapture","initError"],["fxLayout","column","fxLayoutAlign","center center",1,"id-scanning-error-div"],["src","https://cdn.verifik.co/demo/nocameraenabled.svg","alt","",1,"id-scanning-no-camera-enabled-img"],[1,"mt-4"],["alt","",1,"id-scanning-failed-document-img",3,"src"],["class","mt-4",3,"color",4,"ngIf"],["mat-raised-button","",1,"mt-4","z-index-2","id-scanning-try-again-button",3,"click"]],template:function(a,n){1&a&&(e.YNc(0,L,21,38,"div",0),e.YNc(1,j,8,10,"div",1),e.YNc(2,k,12,19,"div",1)),2&a&&(e.Q6J("ngIf",!n.response.isFailed&&n.camera.hasPermissions),e.xp6(1),e.Q6J("ngIf",!n.response.isFailed&&!n.camera.hasPermissions&&!n.camera.isLoading),e.xp6(1),e.Q6J("ngIf",n.response.isFailed))},dependencies:[I.o9,w.xw,w.Wh,b.p9,_.ot,_.lW,v.ez,v.O5,P.Cq,m.y4,m.Ot,x.Tm,x.i3],styles:[".id-scanning-error-div[_ngcontent-%COMP%]{margin-top:20px;width:600px;background:white;height:600px;padding:16px;box-shadow:3px 3px 3px 3px #0000000d}.id-scanning-error-div[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{color:#0036e7;font-size:24px;font-weight:800;text-align:center}.id-scanning-error-div[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{color:#01236da6;font-size:16px;font-weight:300;text-align:center}.id-scanning-no-camera-enabled-img[_ngcontent-%COMP%], .id-scanning-failed-document-img[_ngcontent-%COMP%]{width:40%}",".demo-header[_ngcontent-%COMP%]{background-color:#01236d;width:100%;height:64px;color:#fff!important}.demo-header-logo[_ngcontent-%COMP%]{width:120px;padding-left:16px;height:auto}.demo-header-action[_ngcontent-%COMP%]{padding-right:25px}.demo-header-partner-icon[_ngcontent-%COMP%]{width:40px;padding-right:10px}.demo-content[_ngcontent-%COMP%]{width:100%;height:auto}.step-one-circle[_ngcontent-%COMP%]{background:#0036e7;z-index:2;color:#fff;width:45px;height:45px;padding-top:11px;text-align:center;border-radius:50%;margin-right:25px}.disabled-background[_ngcontent-%COMP%]{background:rgba(0,54,231,.2509803922)!important}.font-bold[_ngcontent-%COMP%]{font-weight:800}.box-shadow-3px[_ngcontent-%COMP%]{box-shadow:3px 3px 3px 3px #0000000d}.grey-background[_ngcontent-%COMP%]{background-color:#80808021}.m-2[_ngcontent-%COMP%]{margin:2px}.m-4[_ngcontent-%COMP%]{margin:4px}.m-8[_ngcontent-%COMP%]{margin:8px}.mt-4[_ngcontent-%COMP%]{margin-top:4px}.mt-8[_ngcontent-%COMP%]{margin-top:8px}.cursor-pointer[_ngcontent-%COMP%]{cursor:pointer!important;font-weight:800}.w-50p[_ngcontent-%COMP%]{width:50%}.text-center[_ngcontent-%COMP%]{text-align:center}.margin-left-16[_ngcontent-%COMP%]{margin-left:25px}h1[_ngcontent-%COMP%]{font-size:35px;padding-top:32px;font-weight:700;color:#0036e7}h2[_ngcontent-%COMP%]{font-size:30px;padding-top:16px;font-weight:700;color:#0036e7}@media (max-width: 599px){.demo-header-logo[_ngcontent-%COMP%]{width:120px}}"]})}return g})()},692:(T,M,c)=>{c.d(M,{s:()=>O});var u=c(5861),v=c(6814),I=c(1447),_=c(2296),b=c(5986),P=c(5940),m=c(8991),x=c(6799),t=c(5879),d=c(9162),l=c(3403),e=c(6036),p=c(8340),E=c(3814);const w=["videoElement"],S=["canvas"],R=["result"],y=["toSend"],A=["cardIdFace"];function U(i,a){if(1&i&&(t.TgZ(0,"div")(1,"div",10),t._uU(2),t.qZA(),t.TgZ(3,"div",11),t._uU(4),t.qZA()()),2&i){const n=t.oxw(3);t.xp6(1),t.Udp("color",n.project.branding.titleColor),t.xp6(1),t.Oqu(n.errorFace.title),t.xp6(1),t.Udp("color",n.project.branding.txtColor),t.xp6(1),t.Oqu(n.errorFace.subtitle)}}function L(i,a){if(1&i){const n=t.EpF();t.TgZ(0,"div",12)(1,"div",13),t._UZ(2,"video",14,15)(4,"canvas",16,17)(6,"canvas",16,18)(8,"canvas",16,19),t.qZA(),t.TgZ(10,"div",20)(11,"button",21),t.NdJ("click",function(){t.CHM(n);const r=t.oxw(3);return t.KtG(r.takePicture())}),t._uU(12),t.ALo(13,"transloco"),t.qZA(),t.TgZ(14,"button",22),t.NdJ("click",function(){t.CHM(n);const r=t.oxw(3);return t.KtG(r.tryAgain())}),t._uU(15),t.ALo(16,"transloco"),t.qZA(),t.TgZ(17,"button",23),t.NdJ("click",function(){t.CHM(n);const r=t.oxw(3);return t.KtG(r.continue())}),t._uU(18),t.ALo(19,"transloco"),t.qZA()()()}if(2&i){const n=t.oxw(3);t.xp6(1),t.Udp("width",n.WIDTH,"px")("height",n.HEIGHT,"px"),t.xp6(1),t.ekj("hidden",n.base64Images),t.xp6(2),t.Udp("width",n.WIDTH,"px")("height",n.HEIGHT,"px"),t.ekj("hidden",n.base64Images),t.xp6(2),t.ekj("hidden",!n.base64Images),t.xp6(2),t.ekj("hidden",!0),t.xp6(3),t.Udp("background",n.project.branding.buttonColor)("color",n.project.branding.buttonTxtColor),t.ekj("hidden",n.base64Images),t.Q6J("disabled",n.errorFace),t.xp6(1),t.hij(" ",t.lcZ(13,38,"id_scanning.manual_capture_button")," "),t.xp6(2),t.Udp("background",n.project.branding.buttonColor)("color",n.project.branding.buttonTxtColor),t.ekj("hidden",!n.base64Images),t.xp6(1),t.hij(" ",t.lcZ(16,40,"id_scanning.retry")," "),t.xp6(2),t.Udp("background",n.project.branding.buttonColor)("color",n.project.branding.buttonTxtColor),t.ekj("hidden",!n.base64Images),t.xp6(1),t.hij(" ",t.lcZ(19,42,"continue")," ")}}function j(i,a){if(1&i&&(t.TgZ(0,"div",6)(1,"div",7),t.YNc(2,U,5,6,"div",8),t.qZA(),t.YNc(3,L,20,44,"div",9),t.qZA()),2&i){const n=t.oxw(2);t.xp6(2),t.Q6J("ngIf",n.errorFace&&!n.loadingResults),t.xp6(1),t.Q6J("ngIf",!n.failedToDetectDocument)}}function Z(i,a){if(1&i&&(t.TgZ(0,"div",2),t._UZ(1,"canvas",3,4),t.YNc(3,j,4,2,"div",5),t.qZA()),2&i){const n=t.oxw();t.xp6(3),t.Q6J("ngIf",!n.loadingCamera&&n.hasCameraPermissions)}}function k(i,a){if(1&i&&(t.TgZ(0,"div",24),t._UZ(1,"img",25),t.TgZ(2,"h1",26),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"p",26),t._uU(6),t.ALo(7,"transloco"),t.qZA()()),2&i){const n=t.oxw();t.xp6(2),t.Udp("color",n.project.branding.titleColor),t.xp6(1),t.Oqu(t.lcZ(4,6,"id_scanning.camera_not_found")),t.xp6(2),t.Udp("color",n.project.branding.txtColor),t.xp6(1),t.hij(" ",t.lcZ(7,8,"id_scanning.camera_not_found_description")," ")}}function F(i,a){if(1&i&&(t.TgZ(0,"p",26),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&i){const n=t.oxw(2);t.Udp("color",n.project.branding.txtColor),t.xp6(1),t.AsE(" ",t.lcZ(2,4,"id_scanning.remaining_attempts")," ",n.attemptsLimit-n.attempts," ")}}function g(i,a){if(1&i){const n=t.EpF();t.TgZ(0,"div",24),t._UZ(1,"img",27),t.TgZ(2,"h1",26),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"p",26),t._uU(6),t.ALo(7,"transloco"),t.qZA(),t.YNc(8,F,3,6,"p",28),t.TgZ(9,"button",29),t.NdJ("click",function(){t.CHM(n);const r=t.oxw();return t.KtG(r.attemptsLimit-r.attempts>0?r.tryAgain(!0):r.restartDemo())}),t._uU(10),t.ALo(11,"transloco"),t.qZA()()}if(2&i){const n=t.oxw();t.xp6(1),t.Q6J("src",n.attemptsLimit-n.attempts>0?"https://cdn.verifik.co/demo/failedtodetectdocument@3x.png":"https://cdn.verifik.co/demo/redstop.svg",t.LSH),t.xp6(1),t.Udp("color",n.project.branding.titleColor),t.xp6(1),t.hij(" ",t.lcZ(4,13,n.attemptsLimit-n.attempts>0?"id_scanning.document_not_detected":"id_scanning.failed_to_detect_limit")," "),t.xp6(2),t.Udp("color",n.project.branding.txtColor),t.xp6(1),t.hij(" ",t.lcZ(7,15,n.attemptsLimit-n.attempts>0?"id_scanning.document_not_detected_description":"id_scanning.failed_to_detect_limit_description")," "),t.xp6(2),t.Q6J("ngIf",n.attemptsLimit-n.attempts>0),t.xp6(1),t.Udp("color",n.project.branding.buttonTxtColor)("background",n.project.branding.buttonColor),t.xp6(1),t.hij(" ",t.lcZ(11,17,n.failedToDetectDocument?"id_scanning.retry":"restart")," ")}}let O=(()=>{class i{constructor(n,o,r,s,h,f,C){this._demoService=n,this._router=o,this._splashScreenService=r,this._changeDetectorRef=s,this._translocoService=h,this.renderer=f,this._KYCService=C,this.aspectRatio=85.6/53.98,this.videoOptions={frameRate:{ideal:30,max:30}},this.setCanvasDimensions=()=>{this.HEIGHT=this.videoElement.nativeElement.clientHeight,this.WIDTH=this.videoElement.nativeElement.clientWidth;const W=this.canvasRef.nativeElement;W.height=this.HEIGHT,W.width=this.WIDTH,this.drawRect(W.getContext("2d"))},this.attempts=0,this.attemptsLimit=3,this.loadingCamera=!1,this.loading=!1,this.hasCameraPermissions=!1,this.failedToDetectDocument=!1,this.base64Images=void 0,this.errorFace={},this.demoData=this._demoService.getDemoData(),this.view=this._router.url.includes("/kyc")?"kyc":"demo",this.view&&(this.appRegistration=this._KYCService.appRegistration,this.project=this._KYCService.currentProject,this.projectFlow=this._KYCService.currentProjectFlow,this.navigation=this._KYCService.getNavigation()),this.errorContent={message:""},this.videoOptions[this.demoData.isMobile?"width":"height"]={ideal:1080},this.videoOptions.facingMode=this.demoData.isMobile?"environment":"user",this.video={},this.rectCredential={},this.renderer.listen("window","resize",()=>{this.videoElement&&this.setCanvasDimensions()})}ngOnInit(){this._demoService.faceapi$.subscribe(n=>{n&&this.startCamera()})}detectFace(n){var o=this;return(0,u.Z)(function*(){try{const r=yield x.Qr(n,new x.d7({minConfidence:.2})).withFaceLandmarks();return r.length?(o.checkFaceTimeout=clearTimeout(o.checkFaceTimeout),o.errorFace=null,r):(o.checkFaceTimeout||(o.checkFaceTimeout=setTimeout(()=>{o.errorFace={title:o._translocoService.translate("id_scanning.face_not_found"),subtitle:o._translocoService.translate("id_scanning.face_not_found_details")}},3*o.demoData.time)),null)}catch(r){alert(r.message)}})()}startCamera(){navigator.mediaDevices&&navigator.mediaDevices.getUserMedia?(this.loadingCamera=!0,this._splashScreenService.show(),navigator.mediaDevices.getUserMedia({video:this.videoOptions,audio:!1}).then(n=>{this.stream=n,this.hasCameraPermissions=!0,this.loadingCamera=!1;const r=this.stream.getVideoTracks()[0].getSettings(),{width:s,height:h}=r;this.video.height=h,this.video.width=s,setTimeout(()=>{this.videoElement.nativeElement.srcObject=n,this.videoElement.nativeElement.addEventListener("loadedmetadata",()=>{this.demoData.isMobile||(this.videoElement.nativeElement.style.transform="scaleX(-1)"),this.setCanvasDimensions(),this.detectFaceInterval=setInterval(()=>this.detectFace(this.videoElement.nativeElement),this.demoData.time),this.demoData.loading=!1,this._splashScreenService.hide()})},300)}).catch(n=>{console.error("Error accessing the camera:",n),this.loadingCamera=!1,this.hasCameraPermissions=!1,this.demoData.loading=!1,this._splashScreenService.hide()})):(console.error("Browser does not support getUserMedia API."),this.hasCameraPermissions=!1)}tryAgain(n=!1){n&&this.attempts++,this.base64Images=void 0,this.failedToDetectDocument=!1,this.errorFace={},this.startCamera()}restartDemo(){"kyc"===this.view&&(this.appRegistration.documentValidation=null),this._demoService.restart()}continue(){var n=this;return(0,u.Z)(function*(){if(n.loading)return;n.loading=!0,n.idToSend={image:n.base64Images,force:n.appRegistration.forceUpload||!1};const o=yield n.detectFace(n.canvasToSendRef.nativeElement);if(!o.length)return n.errorContent={message:"id_scanning.face_not_found"},n.tryAgain();const r=n._demoService.getBiggestFace(o.map(h=>h.detection.box)),s=n._demoService.cutFaceIdCard(n.canvasToSendRef.nativeElement,r,n.cardIdFaceRef.nativeElement);n.demoData.loading=!0,n._splashScreenService.show(),"kyc"!==n.view?n._demoService.sendDocument({image:n.idToSend.image}).subscribe(h=>{n._demoService.setDemoDocument(h.data),localStorage.setItem("documentId",h.data._id),localStorage.setItem("idCardFaceImage",s),n.demoData.loading=!1,n._splashScreenService.hide(),n._demoService.moveToStep(3)},h=>{n.failedToDetectDocument=!0,n.demoData.loading=!1,n._splashScreenService.hide()}):n._KYCService.createDocumentValidation(n.idToSend).subscribe({next:h=>{n.appRegistration.documentValidation=h.data.documentValidation,n._KYCService.navigateTo("next")},error:h=>{n.errorContent=h.error,n._splashScreenService.hide()},complete:()=>{n.demoData.loading=!1,n._splashScreenService.hide()}})})()}drawRect(n){n.clearRect(0,0,this.WIDTH,this.HEIGHT),n.fillStyle="rgba(255, 255, 255, 0.75)",n.fillRect(0,0,this.WIDTH,this.HEIGHT),n.globalCompositeOperation="destination-out";const o=this.video.height<this.video.width;this.setDimensions(o,this.HEIGHT,this.WIDTH,this.rectCredential),this.setDimensions(o,this.video.height,this.video.width,this.video),n.fillStyle="rgba(0, 0, 0, 1)",n.fillRect(this.rectCredential.x,this.rectCredential.y,this.rectCredential.rectWidth,this.rectCredential.rectHeight),n.globalCompositeOperation="source-over"}setDimensions(n,o,r,s){n?(s.y=Math.floor(.1*o),s.rectHeight=Math.floor(.8*o),s.rectWidth=Math.floor(this.aspectRatio*s.rectHeight),s.x=Math.floor((r-s.rectWidth)/2)):(s.x=Math.floor(.1*r),s.rectWidth=Math.floor(.8*r),s.rectHeight=Math.floor(this.aspectRatio*s.rectWidth),s.y=Math.floor((o-s.rectHeight)/2))}stopRecord(){this.stream&&this.stream.getTracks().forEach(n=>n.stop())}takePicture(){var n=this;return(0,u.Z)(function*(){n.detectFaceInterval=clearInterval(n.detectFaceInterval);const o=n.canvasToSendRef.nativeElement;n.setPictureInCavas(n.canvasResultRef.nativeElement,n.rectCredential,n.video),n.setPictureInCavas(o,n.video);const s=o.toDataURL("image/jpeg").replace(/^data:.*;base64,/,"");n.base64Images=s,n._changeDetectorRef.markForCheck(),n.stopRecord()})()}setPictureInCavas(n,o,r){const s=n.getContext("2d");n.width=o.rectWidth,n.height=o.rectHeight,n.style.marginLeft=`${o.x}px`,n.style.marginTop=`${o.y}px`,r||(r={x:o.x,y:o.y,rectWidth:o.rectWidth,rectHeight:o.rectHeight}),s.drawImage(this.videoElement.nativeElement,r.x,r.y,r.rectWidth,r.rectHeight,0,0,o.rectWidth,o.rectHeight)}static#t=this.\u0275fac=function(o){return new(o||i)(t.Y36(d.e),t.Y36(l.F0),t.Y36(e.j),t.Y36(t.sBO),t.Y36(m.Vn),t.Y36(t.Qsj),t.Y36(p.H))};static#e=this.\u0275cmp=t.Xpm({type:i,selectors:[["id-scanning"]],viewQuery:function(o,r){if(1&o&&(t.Gf(w,5),t.Gf(S,5),t.Gf(R,5),t.Gf(y,5),t.Gf(A,5)),2&o){let s;t.iGM(s=t.CRH())&&(r.videoElement=s.first),t.iGM(s=t.CRH())&&(r.canvasRef=s.first),t.iGM(s=t.CRH())&&(r.canvasResultRef=s.first),t.iGM(s=t.CRH())&&(r.canvasToSendRef=s.first),t.iGM(s=t.CRH())&&(r.cardIdFaceRef=s.first)}},standalone:!0,features:[t.jDz],decls:3,vars:3,consts:[["fxLayout","column","fxLayoutAlign","center center","class","bg-white rounded-lg shadow-lg m-5 p-4 items-center w-full",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center","class","id-scanning-error-div",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center",1,"bg-white","rounded-lg","shadow-lg","m-5","p-4","items-center","w-full"],["hidden","true"],["cardIdFace",""],["class","w-full h-full",4,"ngIf"],[1,"w-full","h-full"],["fxLayout","column","fxLayoutAlign","center center",1,"text-center","h-20","pb-4","sm:h-8","xs:h-8","my-2"],[4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center","class","w-full h-full",4,"ngIf"],[1,"text-3xl","font-bold"],[1,"text-gray-600"],["fxLayout","column","fxLayoutAlign","center center",1,"w-full","h-full"],[1,"relative","w-full"],["autoplay","",1,"absolute","top-0","left-0","w-full","max-h-[75vh]"],["videoElement",""],[1,"absolute","top-0","left-0"],["canvas",""],["result",""],["toSend",""],["fxLayout","row","fxLayoutAlign","center center"],["mat-raised-button","",1,"m-4","z-index-2",3,"disabled","click"],["mat-stroked-button","",1,"m-4","z-index-2",3,"click"],["mat-raised-button","",1,"mx-2",3,"click"],["fxLayout","column","fxLayoutAlign","center center",1,"id-scanning-error-div"],["src","https://cdn.verifik.co/demo/nocameraenabled.svg","alt","",1,"id-scanning-no-camera-enabled-img"],[1,"mt-4"],["alt","",1,"id-scanning-failed-document-img",3,"src"],["class","mt-4",3,"color",4,"ngIf"],["mat-raised-button","","color","primary",1,"mt-4","z-index-2","id-scanning-try-again-button",3,"click"]],template:function(o,r){1&o&&(t.YNc(0,Z,4,1,"div",0),t.YNc(1,k,8,10,"div",1),t.YNc(2,g,12,19,"div",1)),2&o&&(t.Q6J("ngIf",!r.failedToDetectDocument&&r.hasCameraPermissions&&!r.loadingCamera),t.xp6(1),t.Q6J("ngIf",!r.failedToDetectDocument&&!r.hasCameraPermissions&&!r.loadingCamera),t.xp6(1),t.Q6J("ngIf",r.failedToDetectDocument))},dependencies:[I.o9,E.xw,E.Wh,b.p9,_.ot,_.lW,v.ez,v.O5,P.Cq,m.y4,m.Ot],styles:[".id-scanning-error-div[_ngcontent-%COMP%]{margin-top:20px;width:600px;background:white;height:600px;padding:16px;box-shadow:3px 3px 3px 3px #0000000d}.id-scanning-error-div[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{color:#0036e7;font-size:24px;font-weight:800;text-align:center}.id-scanning-error-div[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{color:#01236da6;font-size:16px;font-weight:300;text-align:center}.id-scanning-no-camera-enabled-img[_ngcontent-%COMP%], .id-scanning-failed-document-img[_ngcontent-%COMP%]{width:40%}",".demo-header[_ngcontent-%COMP%]{background-color:#01236d;width:100%;height:64px;color:#fff!important}.demo-header-logo[_ngcontent-%COMP%]{width:120px;padding-left:16px;height:auto}.demo-header-action[_ngcontent-%COMP%]{padding-right:25px}.demo-header-partner-icon[_ngcontent-%COMP%]{width:40px;padding-right:10px}.demo-content[_ngcontent-%COMP%]{width:100%;height:auto}.step-one-circle[_ngcontent-%COMP%]{background:#0036e7;z-index:2;color:#fff;width:45px;height:45px;padding-top:11px;text-align:center;border-radius:50%;margin-right:25px}.disabled-background[_ngcontent-%COMP%]{background:rgba(0,54,231,.2509803922)!important}.font-bold[_ngcontent-%COMP%]{font-weight:800}.box-shadow-3px[_ngcontent-%COMP%]{box-shadow:3px 3px 3px 3px #0000000d}.grey-background[_ngcontent-%COMP%]{background-color:#80808021}.m-2[_ngcontent-%COMP%]{margin:2px}.m-4[_ngcontent-%COMP%]{margin:4px}.m-8[_ngcontent-%COMP%]{margin:8px}.mt-4[_ngcontent-%COMP%]{margin-top:4px}.mt-8[_ngcontent-%COMP%]{margin-top:8px}.cursor-pointer[_ngcontent-%COMP%]{cursor:pointer!important;font-weight:800}.w-50p[_ngcontent-%COMP%]{width:50%}.text-center[_ngcontent-%COMP%]{text-align:center}.margin-left-16[_ngcontent-%COMP%]{margin-left:25px}h1[_ngcontent-%COMP%]{font-size:35px;padding-top:32px;font-weight:700;color:#0036e7}h2[_ngcontent-%COMP%]{font-size:30px;padding-top:16px;font-weight:700;color:#0036e7}@media (max-width: 599px){.demo-header-logo[_ngcontent-%COMP%]{width:120px}}"]})}return i})()}}]);