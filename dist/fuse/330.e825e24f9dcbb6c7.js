"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[330],{8340:(b,P,c)=>{c.d(P,{H:()=>g});var u=c(553),v=c(9397),I=c(8533),_=c(5879),M=c(2065),O=c(8991);let g=(()=>{class x{constructor(d,l){this._httpWrapper=d,this._translocoService=l,this.baseUrl=u.N.apiUrl}getNavigation(){return this.navigation}initNavigation(){let d=1;const l=[],n={},p=this.currentProjectFlow.onboardingSettings.steps;return["mandatory","optional"].includes(p.document)&&(d++,l.push({code:"document",status:p.document}),n.document=p.document,d++,l.push({code:"documentReview",status:p.document}),n.documentReview=p.document),["mandatory","optional"].includes(p.liveness)&&(d++,l.push({code:"liveness",status:p.liveness}),n.liveness=p.liveness,n.document&&(d++,n.documentLivenessReview=p.liveness)),l.push({code:"end",status:"mandatory"}),d++,this.navigation={currentStep:1,lastStep:d,steps:p,map:n,displayableSteps:l},this.navigation}getProject(){return this.currentProject}navigateTo(d){setTimeout(()=>{if("next"!==d)this.navigation.currentStep=d;else switch(this.navigation.currentStep){case"liveness":this.navigation.currentStep="documentLivenessReview";break;case"document":this.navigation.currentStep="documentReview";break;case"documentReview":this.navigation.currentStep="liveness";break;case"documentLivenessReview":this.navigation.currentStep="end"}},750)}getAppRegistration(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations/me`,d).pipe((0,v.b)(l=>{this.appRegistration=l.data,this.currentProject=new I.XR({...this.appRegistration.project,type:"onboarding"}),this.currentProjectFlow=this.appRegistration.projectFlow}))}createAppRegistration(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/app-registrations`,d)}sendEmailValidation(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations`,{email:d,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id,type:"onboarding",validationMethod:"verificationCode",language:this._translocoService.getActiveLang()}).pipe((0,v.b)(l=>{}))}sendPhoneValidation(d,l){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations`,{countryCode:d,phone:l,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id,type:"onboarding",validationMethod:"verificationCode",language:this._translocoService.getActiveLang()}).pipe((0,v.b)(n=>{}))}confirmEmailValidation(d,l){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/email-validations/validate`,{email:d,otp:l,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id})}confirmPhoneValidation(d,l,n){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/phone-validations/validate`,{countryCode:d,phone:l,otp:n,project:this.currentProject._id,projectFlow:this.currentProjectFlow._id})}updateAppRegistration(d){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}`,{...d})}syncAppRegistration(d){return this._httpWrapper.sendRequest("put",`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/sync`,{step:d})}createDocumentValidation(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/document-validations/app-registration`,d)}createBiometricValidation(d){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/biometric-validations/app-registration`,d)}getIdentityImages(d){return this._httpWrapper.sendRequest("get",`${this.baseUrl}/v2/identity-images`,d)}compareFaces(){return this._httpWrapper.sendRequest("post",`${this.baseUrl}/v2/face-recognition/compare/app-registration`,{})}restartKYC(){return this._httpWrapper.sendRequest("delete",`${this.baseUrl}/v2/biometric-validations/${this.appRegistration.biometricValidation._id}`)}static#e=this.\u0275fac=function(l){return new(l||x)(_.LFG(M.O),_.LFG(O.Vn))};static#t=this.\u0275prov=_.Yz7({token:x,factory:x.\u0275fac,providedIn:"root"})}return x})()},5789:(b,P,c)=>{c.d(P,{w:()=>O});var u=c(6814),v=c(1447),I=c(8991),_=c(5879),M=c(3814);let O=(()=>{class g{static#e=this.\u0275fac=function(d){return new(d||g)};static#t=this.\u0275cmp=_.Xpm({type:g,selectors:[["app-demo-footer"]],standalone:!0,features:[_.jDz],decls:4,vars:3,consts:[["fxLayout","row","fxLayoutAlign","center center",1,"footer"],["href","https://verifik.co"]],template:function(d,l){1&d&&(_.TgZ(0,"div",0)(1,"a",1),_._uU(2),_.ALo(3,"transloco"),_.qZA()()),2&d&&(_.xp6(2),_.Oqu(_.lcZ(3,1,"footerText")))},dependencies:[v.o9,M.xw,M.Wh,u.ez,I.y4,I.Ot],styles:[".footer[_ngcontent-%COMP%]{width:100%;height:60px;position:absolute;bottom:0;background-color:#fff;box-shadow:3px 3px 3px #0000000d;z-index:3}"]})}return g})()},1094:(b,P,c)=>{c.d(P,{s:()=>W});var u=c(5861),v=c(6814),I=c(1447),_=c(2296),M=c(5986),O=c(5940),g=c(8991),x=c(2982),t=c(8645),d=c(4354),l=c(6799),n=c(5879),p=c(9162),w=c(6036),T=c(3814);const S=["maskResult"],R=["toSend"],y=["cardIdFace"];function A(h,D){if(1&h&&(n.TgZ(0,"div")(1,"div",16),n._uU(2),n.qZA(),n.TgZ(3,"div",17),n._uU(4),n.qZA()()),2&h){const i=n.oxw(2);n.xp6(2),n.Oqu(i.errorFace.title),n.xp6(2),n.Oqu(i.errorFace.subtitle)}}function L(h,D){if(1&h){const i=n.EpF();n.TgZ(0,"webcam",18),n.NdJ("imageCapture",function(e){n.CHM(i);const a=n.oxw(2);return n.KtG(a.proccessImage(e))})("initError",function(e){n.CHM(i);const a=n.oxw(2);return n.KtG(a.cameraError(e))}),n.qZA()}if(2&h){const i=n.oxw(2);n.Q6J("height",i.camera.dimensions.video.max.height)("width",i.camera.dimensions.video.max.width)("videoOptions",i.camera.configuration)("imageQuality",1)("captureImageData",!0)("allowCameraSwitch",!1)("trigger",i.takePicture$)("mirrorImage",i.demoData.isMobile?"never":"always")}}function U(h,D){if(1&h){const i=n.EpF();n.TgZ(0,"div",2),n._UZ(1,"canvas",3,4),n.TgZ(3,"div",5),n.YNc(4,A,5,2,"div",6),n.qZA(),n.TgZ(5,"div",7),n.YNc(6,L,1,8,"webcam",8),n._UZ(7,"canvas",9,10)(9,"canvas",null,11),n.qZA(),n.TgZ(11,"div",12)(12,"button",13),n.NdJ("click",function(){n.CHM(i);const e=n.oxw();return n.KtG(e.takePictureSnapshot())}),n._uU(13),n.ALo(14,"transloco"),n.qZA(),n.TgZ(15,"button",14),n.NdJ("click",function(){n.CHM(i);const e=n.oxw();return n.KtG(e.ngOnInit())}),n._uU(16),n.ALo(17,"transloco"),n.qZA(),n.TgZ(18,"button",15),n.NdJ("click",function(){n.CHM(i);const e=n.oxw();return n.KtG(e.continue())}),n._uU(19),n.ALo(20,"transloco"),n.qZA()()()}if(2&h){const i=n.oxw();n.xp6(4),n.Q6J("ngIf",i.errorFace&&!i.loadingResults),n.xp6(1),n.Udp("width",i.camera.dimensions.video.width,"px")("height",i.camera.dimensions.video.height,"px"),n.xp6(1),n.Q6J("ngIf",!i.response.base64Image),n.xp6(1),n.Udp("width",i.response.base64Image?i.camera.dimensions.result.width:i.camera.dimensions.video.width,"px")("height",i.response.base64Image?i.camera.dimensions.result.height:i.camera.dimensions.video.height,"px"),n.xp6(2),n.ekj("hidden",!0),n.xp6(3),n.ekj("hidden",i.response.base64Image),n.Q6J("disabled",i.errorFace),n.xp6(1),n.hij(" ",n.lcZ(14,22,"id_scanning.manual_capture_button")," "),n.xp6(2),n.ekj("hidden",!i.response.base64Image),n.xp6(1),n.hij(" ",n.lcZ(17,24,"id_scanning.retry")," "),n.xp6(2),n.ekj("hidden",!i.response.base64Image),n.xp6(1),n.hij(" ",n.lcZ(20,26,"continue")," ")}}function Z(h,D){1&h&&(n.TgZ(0,"div",19),n._UZ(1,"img",20),n.TgZ(2,"h1",21),n._uU(3),n.ALo(4,"transloco"),n.qZA(),n.TgZ(5,"p",21),n._uU(6),n.ALo(7,"transloco"),n.qZA()()),2&h&&(n.xp6(3),n.Oqu(n.lcZ(4,2,"id_scanning.camera_not_found")),n.xp6(3),n.hij(" ",n.lcZ(7,4,"id_scanning.camera_not_found_description")," "))}function k(h,D){if(1&h&&(n.TgZ(0,"p",21),n._uU(1),n.ALo(2,"transloco"),n.qZA()),2&h){const i=n.oxw(2);n.xp6(1),n.AsE(" ",n.lcZ(2,2,"id_scanning.remaining_attempts")," ",i.attempts.limit-i.attempts.current," ")}}function F(h,D){if(1&h){const i=n.EpF();n.TgZ(0,"div",19),n._UZ(1,"img",22),n.TgZ(2,"h1",21),n._uU(3),n.ALo(4,"transloco"),n.qZA(),n.TgZ(5,"p",21),n._uU(6),n.ALo(7,"transloco"),n.qZA(),n.YNc(8,k,3,4,"p",23),n.TgZ(9,"button",24),n.NdJ("click",function(){n.CHM(i);const e=n.oxw();return n.KtG(e.attempts.limit-e.attempts.current>0?e.tryAgain():e.restartDemo())}),n._uU(10),n.ALo(11,"transloco"),n.qZA()()}if(2&h){const i=n.oxw();n.xp6(1),n.Q6J("src",i.attempts.limit-i.attempts.current>0?"https://cdn.verifik.co/demo/failedtodetectdocument@3x.png":"https://cdn.verifik.co/demo/redstop.svg",n.LSH),n.xp6(2),n.hij(" ",n.lcZ(4,5,i.attempts.limit-i.attempts.current>0?"id_scanning.document_not_detected":"id_scanning.failed_to_detect_limit")," "),n.xp6(3),n.hij(" ",n.lcZ(7,7,i.attempts.limit-i.attempts.current>0?"id_scanning.document_not_detected_description":"id_scanning.failed_to_detect_limit_description")," "),n.xp6(2),n.Q6J("ngIf",i.attempts.limit-i.attempts.current>0),n.xp6(2),n.hij(" ",n.lcZ(11,9,i.failedToDetectDocument?"id_scanning.retry":"restart")," ")}}let W=(()=>{class h{get takePicture$(){return this.takePicture.asObservable()}constructor(i,o,e,a,s){this._dom=i,this._demoService=o,this._splashScreenService=e,this._translocoService=a,this.renderer=s,this.aspectRatio=85.6/53.98,this.takePicture=new t.x,this.setDefaultCamera=()=>{this.camera={hasPermissions:!1,isLoading:!1,configuration:{frameRate:{ideal:30,max:30},[this.demoData.isMobile?"width":"height"]:{ideal:1080},facingMode:d.w[this.demoData.isMobile]},dimensions:{video:{max:{height:Math.ceil(.7*window.innerHeight),width:Math.ceil(.9*window.innerWidth)}}}}},this.setDefaultInterval=()=>{this.interval={}},this.setDefaultAttempts=()=>{this.attempts={current:0,limit:3}},this.setDefaultResponse=()=>{this.response={isLoading:!1,isFailed:!1}},this.setVideoNgxCameraData=()=>{const r=this._dom.nativeElement.querySelector("video");r&&(r.addEventListener("loadeddata",()=>{this.setVideoDimensions(r),this.drawRect()}),this.interval.detectFace||(this.interval.detectFace=setInterval(()=>{this.response.base64Image&&(this.interval.detectFace=clearInterval(this.interval.detectFace)),this.takePicture.next()},this.demoData.time)),this.interval.checkNgxVideo=clearInterval(this.interval.checkNgxVideo),this.setVideoDimensions(r),this.drawRect(),this.loading({isLoading:!1,start:!0}))},this.loading=({isLoading:r=!0,start:m,result:f})=>{const C=m?"camera":f&&"response";C&&(this[C].isLoading=r);const E=r?"show":"hide";this.demoData.loading=r,this._splashScreenService[E]()},this.setImageOnCanvas=(r,m,f,C)=>{r.width=C.width,r.height=C.height,r.style.marginLeft=`${C.offsetX||0}px`,r.style.marginTop=`${C.offsetY||0}px`;const E=r.getContext("2d");E.clearRect(0,0,f.width,f.height),E.drawImage(m,f.offsetX,f.offsetY,f.width,f.height,0,0,C.width,C.height)},this.demoData=this._demoService.getDemoData(),this.startDefaultValues(),this.setDefaultAttempts(),this.setDefaultInterval(),this.renderer.listen("window","resize",()=>{this.interval.checkNgxVideo=setInterval(()=>{this.setVideoNgxCameraData()},this.demoData.time)})}ngOnInit(){var i=this;this.startDefaultValues(),this.camera.hasPermissions=!0,this.errorFace={},this.loading({start:!0}),this._demoService.faceapi$.subscribe(function(){var o=(0,u.Z)(function*(e){e&&(i.interval.checkNgxVideo=setInterval(()=>{i.setMaxVideoDimensions(),i.setVideoNgxCameraData()},i.demoData.time))});return function(e){return o.apply(this,arguments)}}())}startDefaultValues(){this.setDefaultResponse(),this.setDefaultCamera(),this.setMaxVideoDimensions()}setVideoDimensions(i){this.camera.dimensions.video.height=i.clientHeight,this.camera.dimensions.video.width=i.clientWidth;const o=this.maskResultCanvasRef.nativeElement;o.style.marginLeft="0px",o.style.marginTop="0px"}setMaxVideoDimensions(){this.camera.dimensions.video={max:{height:Math.ceil(.7*window.innerHeight),width:Math.ceil(.9*window.innerWidth)}},this.camera.dimensions.result=void 0}setResultDimensions(i,o,e){o<e?(i.offsetY=Math.floor(.1*o),i.height=Math.floor(.8*o),i.width=Math.floor(this.aspectRatio*i.height),i.offsetX=Math.floor((e-i.width)/2)):(i.offsetX=Math.floor(.1*e),i.width=Math.floor(.8*e),i.height=Math.floor(this.aspectRatio*i.width),i.offsetY=Math.floor((o-i.height)/2))}drawRect(){this.camera.dimensions.result={height:0,width:0,offsetX:0,offsetY:0},this.setResultDimensions(this.camera.dimensions.result,this.camera.dimensions.video.height,this.camera.dimensions.video.width);const i=this.maskResultCanvasRef.nativeElement,o=this.camera.dimensions.video,e=this.camera.dimensions.result;i.height=o.height,i.width=o.width;const a=i.getContext("2d");a.clearRect(0,0,o.width,o.height),a.fillStyle="rgba(255, 255, 255, 0.75)",a.fillRect(0,0,o.width,o.height),a.globalCompositeOperation="destination-out",a.fillStyle="rgba(0, 0, 0, 1)",a.fillRect(e.offsetX,e.offsetY,e.width,e.height),a.globalCompositeOperation="source-over"}cameraError(i){i.mediaStreamError&&"NotAllowedError"===i.mediaStreamError.name&&(this.loading({isLoading:!1,start:!0}),this.camera.hasPermissions=!1)}proccessImage(i){var o=this;if(this.response.base64Image)return;if(!this.interval.detectFace)return void this.takePictureManual(i);const e=new Image;e.src=i.imageAsDataUrl,e.onload=(0,u.Z)(function*(){try{o.detectFace(e)}catch(a){alert(a.message)}})}detectFace(i){var o=this;return(0,u.Z)(function*(){try{const e=yield l.Qr(i,new l.d7({minConfidence:.2})).withFaceLandmarks();return e.length?(o.checkFaceTimeout=clearTimeout(o.checkFaceTimeout),o.errorFace=null,e):(o.checkFaceTimeout||(o.checkFaceTimeout=setTimeout(()=>{o.errorFace={title:o._translocoService.translate("id_scanning.face_not_found"),subtitle:o._translocoService.translate("id_scanning.face_not_found_details")}},3*o.demoData.time)),null)}catch(e){alert(e.message)}})()}takePictureManual(i){var o=this;const e=new Image;e.src=i.imageAsDataUrl,e.onload=(0,u.Z)(function*(){const a=yield o.detectFace(e);if(!a||!a.length)return alert(o._translocoService.translate("id_scanning.face_not_found")),o.tryAgain();const s=o._demoService.getBiggestFace(a.map(f=>f.detection.box));o.idCard={face:o._demoService.cutFaceIdCard(e,s,o.cardIdFaceRef.nativeElement)},o.camera.dimensions.real={height:0,width:0,offsetX:0,offsetY:0},o.setResultDimensions(o.camera.dimensions.real,e.height,e.width),o.setImageOnCanvas(o.maskResultCanvasRef.nativeElement,e,o.camera.dimensions.real,o.camera.dimensions.result);const m=o.ToSendCanvasRef.nativeElement;o.setImageOnCanvas(m,e,o.camera.dimensions.real,o.camera.dimensions.real),o.response.base64Image=m.toDataURL("image/jpeg")})}takePictureSnapshot(){this.interval.detectFace=clearInterval(this.interval.detectFace),this.takePicture.next()}continue(){var i=this;return(0,u.Z)(function*(){const o={image:i.response.base64Image.replace("data:image/jpeg;base64","")};i.loading({result:!0}),i._demoService.sendDocument(o).subscribe(e=>{i._demoService.setDemoDocument(e.data),localStorage.setItem("idCardFaceImage",i.idCard.face),localStorage.setItem("documentId",e.data._id),i.loading({isLoading:!1}),i._demoService.moveToStep(3)},e=>{i.response.isFailed=!0,i.loading({isLoading:!1})})})()}tryAgain(){this.attempts.current++,this.ngOnInit()}restartDemo(){this._demoService.restart()}static#e=this.\u0275fac=function(o){return new(o||h)(n.Y36(n.SBq),n.Y36(p.e),n.Y36(w.j),n.Y36(g.Vn),n.Y36(n.Qsj))};static#t=this.\u0275cmp=n.Xpm({type:h,selectors:[["id-scanning-ios"]],viewQuery:function(o,e){if(1&o&&(n.Gf(S,5),n.Gf(R,5),n.Gf(y,5)),2&o){let a;n.iGM(a=n.CRH())&&(e.maskResultCanvasRef=a.first),n.iGM(a=n.CRH())&&(e.ToSendCanvasRef=a.first),n.iGM(a=n.CRH())&&(e.cardIdFaceRef=a.first)}},standalone:!0,features:[n.jDz],decls:3,vars:3,consts:[["fxLayout","column","fxLayoutAlign","center center","class","bg-white rounded-lg shadow-lg m-5 p-4 w-full",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center","class","id-scanning-error-div",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center",1,"bg-white","rounded-lg","shadow-lg","m-5","p-4","w-full"],["hidden","true"],["cardIdFace",""],["fxLayout","column","fxLayoutAlign","center center",1,"text-center","h-20","pb-4","sm:h-8","xs:h-8","my-2"],[4,"ngIf"],[1,"relative"],[3,"height","width","videoOptions","imageQuality","captureImageData","allowCameraSwitch","trigger","mirrorImage","imageCapture","initError",4,"ngIf"],[1,"absolute","top-0","left-0"],["maskResult",""],["toSend",""],["fxLayout","row","fxLayoutAlign","center center"],["mat-raised-button","","color","primary",1,"m-4","z-index-2",3,"disabled","click"],["mat-stroked-button","","color","primary",1,"m-4","z-index-2",3,"click"],["mat-raised-button","","color","primary",1,"mx-2",3,"click"],[1,"text-3xl","font-bold"],[1,"text-gray-600"],[3,"height","width","videoOptions","imageQuality","captureImageData","allowCameraSwitch","trigger","mirrorImage","imageCapture","initError"],["fxLayout","column","fxLayoutAlign","center center",1,"id-scanning-error-div"],["src","https://cdn.verifik.co/demo/nocameraenabled.svg","alt","",1,"id-scanning-no-camera-enabled-img"],[1,"mt-4"],["alt","",1,"id-scanning-failed-document-img",3,"src"],["class","mt-4",4,"ngIf"],["mat-raised-button","","color","primary",1,"mt-4","z-index-2","id-scanning-try-again-button",3,"click"]],template:function(o,e){1&o&&(n.YNc(0,U,21,28,"div",0),n.YNc(1,Z,8,6,"div",1),n.YNc(2,F,12,11,"div",1)),2&o&&(n.Q6J("ngIf",!e.response.isFailed&&e.camera.hasPermissions),n.xp6(1),n.Q6J("ngIf",!e.response.isFailed&&!e.camera.hasPermissions&&!e.camera.isLoading),n.xp6(1),n.Q6J("ngIf",e.response.isFailed))},dependencies:[I.o9,T.xw,T.Wh,M.p9,_.ot,_.lW,v.ez,v.O5,O.Cq,g.y4,g.Ot,x.Tm,x.i3],styles:[".id-scanning-error-div[_ngcontent-%COMP%]{margin-top:20px;width:600px;background:white;height:600px;padding:16px;box-shadow:3px 3px 3px 3px #0000000d}.id-scanning-error-div[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{color:#0036e7;font-size:24px;font-weight:800;text-align:center}.id-scanning-error-div[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{color:#01236da6;font-size:16px;font-weight:300;text-align:center}.id-scanning-no-camera-enabled-img[_ngcontent-%COMP%], .id-scanning-failed-document-img[_ngcontent-%COMP%]{width:40%}",".demo-header[_ngcontent-%COMP%]{background-color:#01236d;width:100%;height:64px;color:#fff!important}.demo-header-logo[_ngcontent-%COMP%]{width:120px;padding-left:16px;height:auto}.demo-header-action[_ngcontent-%COMP%]{padding-right:25px}.demo-header-partner-icon[_ngcontent-%COMP%]{width:40px;padding-right:10px}.demo-content[_ngcontent-%COMP%]{width:100%;height:auto}.step-one-circle[_ngcontent-%COMP%]{background:#0036e7;z-index:2;color:#fff;width:45px;height:45px;padding-top:11px;text-align:center;border-radius:50%;margin-right:25px}.disabled-background[_ngcontent-%COMP%]{background:rgba(0,54,231,.2509803922)!important}.font-bold[_ngcontent-%COMP%]{font-weight:800}.box-shadow-3px[_ngcontent-%COMP%]{box-shadow:3px 3px 3px 3px #0000000d}.grey-background[_ngcontent-%COMP%]{background-color:#80808021}.m-2[_ngcontent-%COMP%]{margin:2px}.m-4[_ngcontent-%COMP%]{margin:4px}.m-8[_ngcontent-%COMP%]{margin:8px}.mt-4[_ngcontent-%COMP%]{margin-top:4px}.mt-8[_ngcontent-%COMP%]{margin-top:8px}.cursor-pointer[_ngcontent-%COMP%]{cursor:pointer!important;font-weight:800}.w-50p[_ngcontent-%COMP%]{width:50%}.text-center[_ngcontent-%COMP%]{text-align:center}.margin-left-16[_ngcontent-%COMP%]{margin-left:25px}h1[_ngcontent-%COMP%]{font-size:35px;padding-top:32px;font-weight:700;color:#0036e7}h2[_ngcontent-%COMP%]{font-size:30px;padding-top:16px;font-weight:700;color:#0036e7}@media (max-width: 599px){.demo-header-logo[_ngcontent-%COMP%]{width:120px}}"]})}return h})()},692:(b,P,c)=>{c.d(P,{s:()=>D});var u=c(5861),v=c(6814),I=c(1447),_=c(2296),M=c(5986),O=c(5940),g=c(8991),x=c(6799),t=c(5879),d=c(9162),l=c(3403),n=c(6036),p=c(8340),w=c(3814);const T=["videoElement"],S=["canvas"],R=["result"],y=["toSend"],A=["cardIdFace"];function L(i,o){if(1&i&&(t.TgZ(0,"div")(1,"div",10),t._uU(2),t.qZA(),t.TgZ(3,"div",11),t._uU(4),t.qZA()()),2&i){const e=t.oxw(3);t.xp6(2),t.Oqu(e.errorFace.title),t.xp6(2),t.Oqu(e.errorFace.subtitle)}}function U(i,o){if(1&i){const e=t.EpF();t.TgZ(0,"div",12)(1,"div",13),t._UZ(2,"video",14,15)(4,"canvas",16,17)(6,"canvas",16,18)(8,"canvas",16,19),t.qZA(),t.TgZ(10,"div",20)(11,"button",21),t.NdJ("click",function(){t.CHM(e);const s=t.oxw(3);return t.KtG(s.takePicture())}),t._uU(12),t.ALo(13,"transloco"),t.qZA(),t.TgZ(14,"button",22),t.NdJ("click",function(){t.CHM(e);const s=t.oxw(3);return t.KtG(s.tryAgain())}),t._uU(15),t.ALo(16,"transloco"),t.qZA(),t.TgZ(17,"button",23),t.NdJ("click",function(){t.CHM(e);const s=t.oxw(3);return t.KtG(s.continue())}),t._uU(18),t.ALo(19,"transloco"),t.qZA()()()}if(2&i){const e=t.oxw(3);t.xp6(1),t.Udp("width",e.WIDTH,"px")("height",e.HEIGHT,"px"),t.xp6(1),t.ekj("hidden",e.base64Images),t.xp6(2),t.Udp("width",e.WIDTH,"px")("height",e.HEIGHT,"px"),t.ekj("hidden",e.base64Images),t.xp6(2),t.ekj("hidden",!e.base64Images),t.xp6(2),t.ekj("hidden",!0),t.xp6(3),t.Udp("background",e.project.branding.borderColor),t.ekj("hidden",e.base64Images),t.Q6J("disabled",e.errorFace),t.xp6(1),t.hij(" ",t.lcZ(13,30,"id_scanning.manual_capture_button")," "),t.xp6(2),t.ekj("hidden",!e.base64Images),t.xp6(1),t.hij(" ",t.lcZ(16,32,"id_scanning.retry")," "),t.xp6(2),t.Udp("background",e.project.branding.borderColor),t.ekj("hidden",!e.base64Images),t.xp6(1),t.hij(" ",t.lcZ(19,34,"continue")," ")}}function Z(i,o){if(1&i&&(t.TgZ(0,"div",6)(1,"div",7),t.YNc(2,L,5,2,"div",8),t.qZA(),t.YNc(3,U,20,36,"div",9),t.qZA()),2&i){const e=t.oxw(2);t.xp6(2),t.Q6J("ngIf",e.errorFace&&!e.loadingResults),t.xp6(1),t.Q6J("ngIf",!e.failedToDetectDocument)}}function k(i,o){if(1&i&&(t.TgZ(0,"div",2),t._UZ(1,"canvas",3,4),t.YNc(3,Z,4,2,"div",5),t.qZA()),2&i){const e=t.oxw();t.xp6(3),t.Q6J("ngIf",!e.loadingCamera&&e.hasCameraPermissions)}}function F(i,o){1&i&&(t.TgZ(0,"div",24),t._UZ(1,"img",25),t.TgZ(2,"h1",26),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"p",26),t._uU(6),t.ALo(7,"transloco"),t.qZA()()),2&i&&(t.xp6(3),t.Oqu(t.lcZ(4,2,"id_scanning.camera_not_found")),t.xp6(3),t.hij(" ",t.lcZ(7,4,"id_scanning.camera_not_found_description")," "))}function W(i,o){if(1&i&&(t.TgZ(0,"p",26),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&i){const e=t.oxw(2);t.xp6(1),t.AsE("",t.lcZ(2,2,"id_scanning.remaining_attempts")," ",e.attemptsLimit-e.attempts,"")}}function h(i,o){if(1&i){const e=t.EpF();t.TgZ(0,"div",24),t._UZ(1,"img",27),t.TgZ(2,"h1",26),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"p",26),t._uU(6),t.ALo(7,"transloco"),t.qZA(),t.YNc(8,W,3,4,"p",28),t.TgZ(9,"button",29),t.NdJ("click",function(){t.CHM(e);const s=t.oxw();return t.KtG(s.attemptsLimit-s.attempts>0?s.tryAgain(!0):s.restartDemo())}),t._uU(10),t.ALo(11,"transloco"),t.qZA()()}if(2&i){const e=t.oxw();t.xp6(1),t.Q6J("src",e.attemptsLimit-e.attempts>0?"https://cdn.verifik.co/demo/failedtodetectdocument@3x.png":"https://cdn.verifik.co/demo/redstop.svg",t.LSH),t.xp6(2),t.hij(" ",t.lcZ(4,5,e.attemptsLimit-e.attempts>0?"id_scanning.document_not_detected":"id_scanning.failed_to_detect_limit")," "),t.xp6(3),t.hij(" ",t.lcZ(7,7,e.attemptsLimit-e.attempts>0?"id_scanning.document_not_detected_description":"id_scanning.failed_to_detect_limit_description")," "),t.xp6(2),t.Q6J("ngIf",e.attemptsLimit-e.attempts>0),t.xp6(2),t.hij(" ",t.lcZ(11,9,e.failedToDetectDocument?"id_scanning.retry":"restart")," ")}}let D=(()=>{class i{constructor(e,a,s,r,m,f,C){this._demoService=e,this._router=a,this._splashScreenService=s,this._changeDetectorRef=r,this._translocoService=m,this.renderer=f,this._KYCService=C,this.aspectRatio=85.6/53.98,this.videoOptions={frameRate:{ideal:30,max:30}},this.setCanvasDimensions=()=>{this.HEIGHT=this.videoElement.nativeElement.clientHeight,this.WIDTH=this.videoElement.nativeElement.clientWidth;const j=this.canvasRef.nativeElement;j.height=this.HEIGHT,j.width=this.WIDTH,this.drawRect(j.getContext("2d"))},this.attempts=0,this.attemptsLimit=3,this.loadingCamera=!1,this.loading=!1,this.hasCameraPermissions=!1,this.failedToDetectDocument=!1,this.base64Images=void 0,this.errorFace={},this.demoData=this._demoService.getDemoData(),this.view=this._router.url.includes("/kyc")?"kyc":"demo",this.view&&(this.appRegistration=this._KYCService.appRegistration,this.project=this._KYCService.currentProject,this.projectFlow=this._KYCService.currentProjectFlow,this.navigation=this._KYCService.getNavigation()),this.errorContent={message:""},this.videoOptions[this.demoData.isMobile?"width":"height"]={ideal:1080},this.videoOptions.facingMode=this.demoData.isMobile?"environment":"user",this.video={},this.rectCredential={},this.renderer.listen("window","resize",()=>{this.videoElement&&this.setCanvasDimensions()})}ngOnInit(){this._demoService.faceapi$.subscribe(e=>{e&&this.startCamera()})}detectFace(e){var a=this;return(0,u.Z)(function*(){try{const s=yield x.Qr(e,new x.d7({minConfidence:.2})).withFaceLandmarks();return s.length?(a.checkFaceTimeout=clearTimeout(a.checkFaceTimeout),a.errorFace=null,s):(a.checkFaceTimeout||(a.checkFaceTimeout=setTimeout(()=>{a.errorFace={title:a._translocoService.translate("id_scanning.face_not_found"),subtitle:a._translocoService.translate("id_scanning.face_not_found_details")}},3*a.demoData.time)),null)}catch(s){alert(s.message)}})()}startCamera(){navigator.mediaDevices&&navigator.mediaDevices.getUserMedia?(this.loadingCamera=!0,this._splashScreenService.show(),navigator.mediaDevices.getUserMedia({video:this.videoOptions,audio:!1}).then(e=>{this.stream=e,this.hasCameraPermissions=!0,this.loadingCamera=!1;const s=this.stream.getVideoTracks()[0].getSettings(),{width:r,height:m}=s;this.video.height=m,this.video.width=r,setTimeout(()=>{this.videoElement.nativeElement.srcObject=e,this.videoElement.nativeElement.addEventListener("loadedmetadata",()=>{this.demoData.isMobile||(this.videoElement.nativeElement.style.transform="scaleX(-1)"),this.setCanvasDimensions(),this.detectFaceInterval=setInterval(()=>this.detectFace(this.videoElement.nativeElement),this.demoData.time),this.demoData.loading=!1,this._splashScreenService.hide()})},300)}).catch(e=>{console.error("Error accessing the camera:",e),this.loadingCamera=!1,this.hasCameraPermissions=!1,this.demoData.loading=!1,this._splashScreenService.hide()})):(console.error("Browser does not support getUserMedia API."),this.hasCameraPermissions=!1)}tryAgain(e=!1){e&&this.attempts++,this.base64Images=void 0,this.failedToDetectDocument=!1,this.errorFace={},this.startCamera()}restartDemo(){"kyc"===this.view&&(this.appRegistration.documentValidation=null),this._demoService.restart()}continue(){var e=this;return(0,u.Z)(function*(){if(e.loading)return;e.loading=!0,e.idToSend={image:e.base64Images,force:e.appRegistration.forceUpload||!1};const a=yield e.detectFace(e.canvasToSendRef.nativeElement);if(!a.length)return e.errorContent={message:"id_scanning.face_not_found"},e.tryAgain();const s=e._demoService.getBiggestFace(a.map(m=>m.detection.box)),r=e._demoService.cutFaceIdCard(e.canvasToSendRef.nativeElement,s,e.cardIdFaceRef.nativeElement);e.demoData.loading=!0,e._splashScreenService.show(),"kyc"!==e.view?e._demoService.sendDocument({image:e.idToSend.image}).subscribe(m=>{e._demoService.setDemoDocument(m.data),localStorage.setItem("documentId",m.data._id),localStorage.setItem("idCardFaceImage",r),e.demoData.loading=!1,e._splashScreenService.hide(),e._demoService.moveToStep(3)},m=>{e.failedToDetectDocument=!0,e.demoData.loading=!1,e._splashScreenService.hide()}):e._KYCService.createDocumentValidation(e.idToSend).subscribe({next:m=>{e.appRegistration.documentValidation=m.data.documentValidation,e._KYCService.navigateTo("next")},error:m=>{e.errorContent=m.error,e._splashScreenService.hide()},complete:()=>{e.demoData.loading=!1,e._splashScreenService.hide()}})})()}drawRect(e){e.clearRect(0,0,this.WIDTH,this.HEIGHT),e.fillStyle="rgba(255, 255, 255, 0.75)",e.fillRect(0,0,this.WIDTH,this.HEIGHT),e.globalCompositeOperation="destination-out";const a=this.video.height<this.video.width;this.setDimensions(a,this.HEIGHT,this.WIDTH,this.rectCredential),this.setDimensions(a,this.video.height,this.video.width,this.video),e.fillStyle="rgba(0, 0, 0, 1)",e.fillRect(this.rectCredential.x,this.rectCredential.y,this.rectCredential.rectWidth,this.rectCredential.rectHeight),e.globalCompositeOperation="source-over"}setDimensions(e,a,s,r){e?(r.y=Math.floor(.1*a),r.rectHeight=Math.floor(.8*a),r.rectWidth=Math.floor(this.aspectRatio*r.rectHeight),r.x=Math.floor((s-r.rectWidth)/2)):(r.x=Math.floor(.1*s),r.rectWidth=Math.floor(.8*s),r.rectHeight=Math.floor(this.aspectRatio*r.rectWidth),r.y=Math.floor((a-r.rectHeight)/2))}stopRecord(){this.stream&&this.stream.getTracks().forEach(e=>e.stop())}takePicture(){var e=this;return(0,u.Z)(function*(){e.detectFaceInterval=clearInterval(e.detectFaceInterval);const a=e.canvasToSendRef.nativeElement;e.setPictureInCavas(e.canvasResultRef.nativeElement,e.rectCredential,e.video),e.setPictureInCavas(a,e.video);const r=a.toDataURL("image/jpeg").replace(/^data:.*;base64,/,"");e.base64Images=r,e._changeDetectorRef.markForCheck(),e.stopRecord()})()}setPictureInCavas(e,a,s){const r=e.getContext("2d");e.width=a.rectWidth,e.height=a.rectHeight,e.style.marginLeft=`${a.x}px`,e.style.marginTop=`${a.y}px`,s||(s={x:a.x,y:a.y,rectWidth:a.rectWidth,rectHeight:a.rectHeight}),r.drawImage(this.videoElement.nativeElement,s.x,s.y,s.rectWidth,s.rectHeight,0,0,a.rectWidth,a.rectHeight)}static#e=this.\u0275fac=function(a){return new(a||i)(t.Y36(d.e),t.Y36(l.F0),t.Y36(n.j),t.Y36(t.sBO),t.Y36(g.Vn),t.Y36(t.Qsj),t.Y36(p.H))};static#t=this.\u0275cmp=t.Xpm({type:i,selectors:[["id-scanning"]],viewQuery:function(a,s){if(1&a&&(t.Gf(T,5),t.Gf(S,5),t.Gf(R,5),t.Gf(y,5),t.Gf(A,5)),2&a){let r;t.iGM(r=t.CRH())&&(s.videoElement=r.first),t.iGM(r=t.CRH())&&(s.canvasRef=r.first),t.iGM(r=t.CRH())&&(s.canvasResultRef=r.first),t.iGM(r=t.CRH())&&(s.canvasToSendRef=r.first),t.iGM(r=t.CRH())&&(s.cardIdFaceRef=r.first)}},standalone:!0,features:[t.jDz],decls:3,vars:3,consts:[["fxLayout","column","fxLayoutAlign","center center","class","bg-white rounded-lg shadow-lg m-5 p-4 items-center w-full",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center","class","id-scanning-error-div",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center",1,"bg-white","rounded-lg","shadow-lg","m-5","p-4","items-center","w-full"],["hidden","true"],["cardIdFace",""],["class","w-full h-full",4,"ngIf"],[1,"w-full","h-full"],["fxLayout","column","fxLayoutAlign","center center",1,"text-center","h-20","pb-4","sm:h-8","xs:h-8","my-2"],[4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center","class","w-full h-full",4,"ngIf"],[1,"text-3xl","font-bold"],[1,"text-gray-600"],["fxLayout","column","fxLayoutAlign","center center",1,"w-full","h-full"],[1,"relative","w-full"],["autoplay","",1,"absolute","top-0","left-0","w-full","max-h-[75vh]"],["videoElement",""],[1,"absolute","top-0","left-0"],["canvas",""],["result",""],["toSend",""],["fxLayout","row","fxLayoutAlign","center center"],["mat-raised-button","","color","primary",1,"m-4","z-index-2",3,"disabled","click"],["mat-stroked-button","","color","primary",1,"m-4","z-index-2",3,"click"],["mat-raised-button","","color","primary",1,"mx-2",3,"click"],["fxLayout","column","fxLayoutAlign","center center",1,"id-scanning-error-div"],["src","https://cdn.verifik.co/demo/nocameraenabled.svg","alt","",1,"id-scanning-no-camera-enabled-img"],[1,"mt-4"],["alt","",1,"id-scanning-failed-document-img",3,"src"],["class","mt-4",4,"ngIf"],["mat-raised-button","","color","primary",1,"mt-4","z-index-2","id-scanning-try-again-button",3,"click"]],template:function(a,s){1&a&&(t.YNc(0,k,4,1,"div",0),t.YNc(1,F,8,6,"div",1),t.YNc(2,h,12,11,"div",1)),2&a&&(t.Q6J("ngIf",!s.failedToDetectDocument&&s.hasCameraPermissions&&!s.loadingCamera),t.xp6(1),t.Q6J("ngIf",!s.failedToDetectDocument&&!s.hasCameraPermissions&&!s.loadingCamera),t.xp6(1),t.Q6J("ngIf",s.failedToDetectDocument))},dependencies:[I.o9,w.xw,w.Wh,M.p9,_.ot,_.lW,v.ez,v.O5,O.Cq,g.y4,g.Ot],styles:[".id-scanning-error-div[_ngcontent-%COMP%]{margin-top:20px;width:600px;background:white;height:600px;padding:16px;box-shadow:3px 3px 3px 3px #0000000d}.id-scanning-error-div[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{color:#0036e7;font-size:24px;font-weight:800;text-align:center}.id-scanning-error-div[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{color:#01236da6;font-size:16px;font-weight:300;text-align:center}.id-scanning-no-camera-enabled-img[_ngcontent-%COMP%], .id-scanning-failed-document-img[_ngcontent-%COMP%]{width:40%}",".demo-header[_ngcontent-%COMP%]{background-color:#01236d;width:100%;height:64px;color:#fff!important}.demo-header-logo[_ngcontent-%COMP%]{width:120px;padding-left:16px;height:auto}.demo-header-action[_ngcontent-%COMP%]{padding-right:25px}.demo-header-partner-icon[_ngcontent-%COMP%]{width:40px;padding-right:10px}.demo-content[_ngcontent-%COMP%]{width:100%;height:auto}.step-one-circle[_ngcontent-%COMP%]{background:#0036e7;z-index:2;color:#fff;width:45px;height:45px;padding-top:11px;text-align:center;border-radius:50%;margin-right:25px}.disabled-background[_ngcontent-%COMP%]{background:rgba(0,54,231,.2509803922)!important}.font-bold[_ngcontent-%COMP%]{font-weight:800}.box-shadow-3px[_ngcontent-%COMP%]{box-shadow:3px 3px 3px 3px #0000000d}.grey-background[_ngcontent-%COMP%]{background-color:#80808021}.m-2[_ngcontent-%COMP%]{margin:2px}.m-4[_ngcontent-%COMP%]{margin:4px}.m-8[_ngcontent-%COMP%]{margin:8px}.mt-4[_ngcontent-%COMP%]{margin-top:4px}.mt-8[_ngcontent-%COMP%]{margin-top:8px}.cursor-pointer[_ngcontent-%COMP%]{cursor:pointer!important;font-weight:800}.w-50p[_ngcontent-%COMP%]{width:50%}.text-center[_ngcontent-%COMP%]{text-align:center}.margin-left-16[_ngcontent-%COMP%]{margin-left:25px}h1[_ngcontent-%COMP%]{font-size:35px;padding-top:32px;font-weight:700;color:#0036e7}h2[_ngcontent-%COMP%]{font-size:30px;padding-top:16px;font-weight:700;color:#0036e7}@media (max-width: 599px){.demo-header-logo[_ngcontent-%COMP%]{width:120px}}"]})}return i})()}}]);