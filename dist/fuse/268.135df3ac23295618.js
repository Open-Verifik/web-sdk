"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[268],{8268:(j,f,a)=>{a.r(f),a.d(f,{FaceComponent:()=>Z});var c=a(5861),t=a(5879),_=a(6814),w=a(8645),p=a(7700),v=a(8991),y=a(2296),P=a(9036),d=a(6799),A=a(6007),E=a(5940),T=a(1447),R=a(1944),k=a(9162),S=a(6036),C=a(3814);const L=["video"],F=["canvas"],H=["result"],W=["toSend"],X=["credentialCanvas"];function Y(r,I){if(1&r&&(t.TgZ(0,"div")(1,"div",17),t._uU(2),t.qZA(),t.TgZ(3,"div",18),t._uU(4),t.qZA()()),2&r){const e=t.oxw(2);t.xp6(1),t.Udp("color",e.project.branding.titleColor),t.xp6(1),t.Oqu(e.errorFace.title),t.xp6(1),t.Udp("color",e.project.branding.txtColor),t.xp6(1),t.Oqu(e.errorFace.subtitle)}}function B(r,I){if(1&r&&(t.TgZ(0,"div",6)(1,"div",7),t.YNc(2,Y,5,6,"div",8),t.qZA(),t.TgZ(3,"div",9),t._UZ(4,"video",10,11)(6,"div",12,13)(8,"canvas",14,15)(10,"canvas",14,16),t.qZA()()),2&r){const e=t.oxw();t.xp6(2),t.Q6J("ngIf",e.errorFace&&!e.loadingResults),t.xp6(1),t.Udp("max-width",e.maxWidth,"px")("max-height",e.maxHeight,"px")("width",e.WIDTH,"px")("height",e.HEIGHT,"px"),t.xp6(1),t.Udp("width",e.WIDTH,"px")("height",e.HEIGHT,"px"),t.ekj("hidden",e.base64Image),t.xp6(2),t.Udp("width",e.WIDTH,"px")("height",e.HEIGHT,"px"),t.ekj("hidden",e.base64Image),t.xp6(2),t.ekj("hidden",!e.base64Image),t.xp6(2),t.ekj("hidden",!0)}}function U(r,I){1&r&&(t.TgZ(0,"div",19),t._UZ(1,"img",20),t.TgZ(2,"h1",21),t._uU(3),t.ALo(4,"transloco"),t.qZA(),t.TgZ(5,"p",21),t._uU(6),t.ALo(7,"transloco"),t.qZA()()),2&r&&(t.xp6(3),t.Oqu(t.lcZ(4,2,"id_scanning.camera_not_found")),t.xp6(3),t.hij(" ",t.lcZ(7,4,"id_scanning.camera_not_found_description")," "))}let Z=(()=>{class r{constructor(e,i,s,n,o,l){this._changeDetectorRef=e,this._sdkService=i,this._demoService=s,this._translocoService=n,this._splashScreenService=o,this.renderer=l,this._matDialog=(0,t.f3M)(p.uw),this.debugText="debug",this.OVAL={},this.loadingResults=!1,this.loadingModel=!1,this._unsubscribeAll=new w.x,this.minPixelFace=234,this.videoOptions={frameRate:{ideal:30,max:30}},this.setCanvasDimension=()=>{this.maxHeight=Math.floor(.8*window.innerHeight),this.maxWidth=Math.floor(.75*window.innerWidth),this.HEIGHT=Math.min(this.videoInput.clientHeight,this.maxHeight),this.WIDTH=Math.min(this.videoInput.clientWidth,this.maxWidth),this.videoCenterX=this.WIDTH/2,this.videoCenterY=this.HEIGHT/2,this.marginY=.04*this.HEIGHT,this.marginX=.8*this.marginY,this.OVAL.radiusY=.42*this.HEIGHT,this.OVAL.radiusX=.75*this.OVAL.radiusY,2*this.OVAL.radiusX>=this.WIDTH&&(this.OVAL.radiusX=.48*this.WIDTH,this.OVAL.radiusY=this.OVAL.radiusX/.75),this.displaySize={width:this.WIDTH,height:this.HEIGHT},this.resizeDimensions={rectHeight:this.HEIGHT,rectWidth:Math.min(2.8*this.OVAL.radiusX,this.WIDTH),y:0,x:this.videoCenterX-Math.min(2.8*this.OVAL.radiusX,this.WIDTH)/2},this.originalDimensions={rectHeight:this.videoDimensions.height,rectWidth:this.resizeDimensions.rectWidth/this.WIDTH*this.videoDimensions.width,y:0,x:this.resizeDimensions.x/this.WIDTH*this.videoDimensions.width}},this.loadingModel=!0,this.lowCamera=!1,this.debugIndex=0,this.osInfo=this.detectOS(),this.demoData=this._demoService.getDemoData(),this.videoOptions[this.demoData.isMobile?"width":"height"]={ideal:1080},this.listenModeDebug(),this.renderer.listen("window","resize",()=>{this.videoInput&&(this.setCanvasDimension(),this.setConfigCanvas())}),this._changeDetectorRef.markForCheck()}listenModeDebug(){this.isActiveDebug=!!localStorage.getItem("isActiveDebug"),document.addEventListener("keydown",e=>{if(this.debugText.charAt(this.debugIndex)===e.key.toLowerCase())return 3===this.debugIndex&&(this.isActiveDebug=!this.isActiveDebug,localStorage.setItem("isActiveDebug",this.isActiveDebug?"true":""),this._changeDetectorRef.markForCheck()),this.debugIndex++;this.debugIndex=0})}stopRecord(){this.detectFaceInterval&&clearInterval(this.detectFaceInterval),this.stream&&this.stream.getTracks().forEach(e=>e.stop())}ngOnInit(){var e=this;return(0,c.Z)(function*(){e._splashScreenService.show(),e.idCardImage=localStorage.getItem("idCard"),e.errorFace=null,e.loadingResults=!1,e.base64Image=null,yield e.loadImages(),e._demoService.faceapi$.subscribe(function(){var i=(0,c.Z)(function*(s){e.loadingModel=!s,s&&(yield e.startAsyncVideo())});return function(s){return i.apply(this,arguments)}}())})()}restart(){var e=this;return(0,c.Z)(function*(){e.completeResults(),yield e.startAsyncVideo()})()}loadImages(){var e=this;return(0,c.Z)(function*(){e.left=new Image,e.left.crossOrigin="anonymous",e.left.src="https://cdn.verifik.co/web-sdk/images/left.png",e.right=new Image,e.right.crossOrigin="anonymous",e.right.src="https://cdn.verifik.co/web-sdk/images/right.png",e.up=new Image,e.up.crossOrigin="anonymous",e.up.src="https://cdn.verifik.co/web-sdk/images/up.png",e.down=new Image,e.down.crossOrigin="anonymous",e.down.src="https://cdn.verifik.co/web-sdk/images/down.png"})()}detectFaceBiggest(e){var i=this;return(0,c.Z)(function*(){const s=document.getElementById("credential"),n=yield d.Qr(s,new d.d7({minConfidence:e})).withFaceLandmarks();if(e<=.1)return;if(!n.length)return i.detectFaceBiggest(e-.1);let l,o=0;for(const x of n){const M=x.detection.box,b=M.width*M.height;b>o&&(l=x.detection,o=b)}const h=l.box;let g=Math.ceil(3*h.width),u=Math.ceil(3*h.height),O=Math.floor(h.x)-h.width,D=Math.floor(h.y)-h.height;g>s.naturalWidth&&(g=s.naturalWidth,u=s.naturalHeight,O=0,D=0);const m=i.credentialRef.nativeElement,V=m.getContext("2d");m.height=u,m.width=g,V.drawImage(s,O,D,g,u,0,0,g,u),i.faceIdCard=m.toDataURL("image/jpeg").replace(/^data:.*;base64,/,"")})()}startAsyncVideo(){var e=this;return(0,c.Z)(function*(){try{e.stream=yield navigator.mediaDevices.getUserMedia({video:e.videoOptions,audio:!1}),e.detectFaceBiggest(.9),e.videoInput=e.video.nativeElement,e.videoInput.srcObject=e.stream,e.videoInput.style.transform="scaleX(-1)",e.canvasRef.nativeElement.style.transform="scaleX(-1)";const s=e.stream.getVideoTracks()[0].getSettings(),{width:n,height:o}=s;e.videoDimensions={height:o,width:n},o<600&&(e.lowCamera=!0,e.loadingModel=!1,e.demoData.loading=!1,e._splashScreenService.hide()),e.videoInput.addEventListener("loadedmetadata",()=>{e.video||e.canvas?(e.setCanvasDimension(),e.demoData.loading=!1,e._splashScreenService.hide(),e.detectFaces(),e._changeDetectorRef.markForCheck()):e.stopRecord()})}catch(i){alert(`${i.message}`),console.error("SHOW ERROR")}})()}detectFaces(){var e=this;return(0,c.Z)(function*(){yield e.setConfigCanvas(),e.detectFaceInterval=setInterval((0,c.Z)(function*(){try{const i=yield d.Qr(e.videoInput,new d.d7({minConfidence:.2})).withFaceLandmarks(),s=e.canvas.getContext("2d");i.length>0&&(e.lastFace=i[0],e.errorFace=null,e.drawFaceAndCenter(i,s),e.isFaceCentered(e.lastFace.landmarks.getNose()[3]),e.isFaceClose(e.lastFace.landmarks),e.drawStatusOval(s,!e.errorFace?.title),e.errorFace||e.captureBase64Image()),e._changeDetectorRef.markForCheck()}catch(i){alert(i.message)}}),e.demoData.isMobile?500:300)})()}manualCapture(){this.takePicture()}setConfigCanvas(){var e=this;return(0,c.Z)(function*(){e.canvas||(e.canvas=yield d.Jd(e.videoInput),e.canvasEl=e.canvasRef.nativeElement,e.canvasEl.appendChild(e.canvas),e.canvas.setAttribute("id","canvas")),d.JF(e.canvas,e.displaySize);const i=e.canvas.getContext("2d");e.drawOvalCenterAndMask(i)})()}drawFaceAndCenter(e,i){const s=d._C(e,this.displaySize);this.drawOvalCenterAndMask(i),this.isActiveDebug&&(i.strokeStyle="red",i.lineWidth=4,i.strokeRect(this.videoCenterX-this.marginX,this.videoCenterY,2*this.marginX,2*this.marginY),d.ii.drawFaceLandmarks(this.canvas,s),d.ii.drawFaceExpressions(this.canvas,s),new d.ii.DrawBox(e[0].detection.box,{label:`${e[0].gender.toUpperCase()} | ${Math.round(e[0].age)} years old`}).draw(this.canvas))}drawOvalCenterAndMask(e){e.clearRect(0,0,this.canvas.width,this.canvas.height),e.fillStyle="rgba(255, 255, 255, 0.75)",e.fillRect(0,0,this.canvas.width,this.canvas.height),e.globalCompositeOperation="destination-out",e.fillStyle="rgba(255, 255, 255, 1)",e.beginPath(),e.ellipse(this.videoCenterX,this.videoCenterY,this.OVAL.radiusX,this.OVAL.radiusY,0,0,2*Math.PI),e.fill(),e.closePath(),e.globalCompositeOperation="source-over"}drawText(e,i,s,n){e.font="30px Arial",e.textAlign="center";const o=e.measureText(i);e.fillStyle="black",e.fillRect(s-o.width/2,n-30-10,o.width+2,60),e.fillStyle="white",e.fillText(i,s,n)}drawStatusOval(e,i){e.beginPath(),e.ellipse(this.videoCenterX,this.videoCenterY,this.OVAL.radiusX,this.OVAL.radiusY,0,0,2*Math.PI),e.lineWidth=5,e.strokeStyle=i?"green":"red",e.stroke(),e.closePath(),i||(this.errorFace.canvas?.includes("\u2191")&&e.drawImage(this.up,this.videoCenterX-20,this.videoCenterY-this.OVAL.radiusY+10,40,40),this.errorFace.canvas?.includes("\u2193")&&e.drawImage(this.down,this.videoCenterX-20,this.videoCenterY+this.OVAL.radiusY-50,40,40),this.errorFace.canvas?.includes("\u2192")&&e.drawImage(this.right,this.videoCenterX+this.OVAL.radiusX-50,this.videoCenterY-20,40,40),this.errorFace.canvas?.includes("\u2190")&&e.drawImage(this.left,this.videoCenterX-this.OVAL.radiusX+10,this.videoCenterY-20,40,40)),this._changeDetectorRef.markForCheck()}isFaceCentered(e){const i=e.x/this.videoDimensions.width*this.WIDTH,s=e.y/this.videoDimensions.height*this.HEIGHT;if(!(i>this.videoCenterX-this.marginX&&i<this.videoCenterX+this.marginX&&s>this.videoCenterY&&s<this.videoCenterY+2.5*this.marginY)){let o="";(i<this.videoCenterX-this.marginX||i>this.videoCenterX+this.marginX)&&(o+=` ${i<this.videoCenterX-this.marginX?"\u2192":"\u2190"} `),(s<this.videoCenterY||s>this.videoCenterY+2*this.marginY)&&(o+=` ${s<this.videoCenterY?"\u2191":"\u2193"}  `),this.errorFace={title:this._translocoService.translate("liveness.center_yor_face"),subtitle:this._translocoService.translate("liveness.center_your_face_subtitle"),canvas:o}}}isFaceClose(e){(e.imageHeight*e.imageWidth/Math.floor(this.originalDimensions.rectHeight*this.originalDimensions.rectWidth)<.25||e.imageHeight<this.minPixelFace||e.imageWidth<this.minPixelFace)&&(this.errorFace={title:this._translocoService.translate("liveness.get_closer"),subtitle:this._translocoService.translate("liveness.get_closer_subtitle")})}captureBase64Image(){this.saveImageBase64Intent||(this.saveImageBase64Intent=setTimeout(()=>{this.errorFace&&(this.saveImageBase64Intent=clearTimeout(this.saveImageBase64Intent)),this.takePicture()},1500))}takePicture(){var e=this;return(0,c.Z)(function*(){const i=e.canvasToSendRef.nativeElement;e.setPictureInCavas(e.canvasResultRef.nativeElement,e.resizeDimensions,e.originalDimensions),e.setPictureInCavas(i,e.originalDimensions),e.base64Image=i.toDataURL("image/jpeg").replace(/^data:.*;base64,/,""),e.stopRecord(),yield e.liveness()})()}setPictureInCavas(e,i,s){const n=e.getContext("2d");e.width=i.rectWidth,e.height=i.rectHeight,e.style.marginLeft=`${i.x}px`,e.style.marginTop=`${i.y}px`,s||(s={x:i.x,y:i.y,rectWidth:i.rectWidth,rectHeight:i.rectHeight}),n.drawImage(this.video.nativeElement,s.x,s.y,s.rectWidth,s.rectHeight,0,0,i.rectWidth,i.rectHeight)}detectOS(){const e=window.navigator.userAgent.toLowerCase();return/android/.test(e)?"ANDROID":/iphone|ipad|ipod/.test(e)?"IOS":"DESKTOP"}liveness(){this.loadingResults||(this.loadingResults=!0,this.demoData.loading=!0,this._splashScreenService.show(),this._sdkService.livenessDemo({image:this.base64Image,os:this.osInfo}).subscribe(i=>{this.errorResult=null,this.demoData.loading=!1,this._demoService.setDemoLiveness(i.data),this._compareWithDocument({search_mode:"ACCURATE",gallery:[this.faceIdCard||this.demoData.document.url],probe:[this.base64Image]})},i=>{this.demoData.loading=!1,this._splashScreenService.hide(),this.retryLivenessModal(i.error?.message)}))}_compareWithDocument(e){this._demoService.compareDocumentWithSelfie(e).subscribe(i=>{this.completeResults(),this._demoService.setDemoCompare(i.data),this._demoService.moveToStep(5)},i=>{this.demoData.loading=!1,this._splashScreenService.hide(),alert(`_compareWithDocument: ${JSON.stringify(i)}`)})}retryLivenessModal(e){const i={title:this._translocoService.translate("liveness.liveness_failed"),message:this._translocoService.translate("liveness.liveness_error_message",{error:e}),icon:{show:!0,name:"heroicons_outline:exclamation-triangle",color:"warn"},actions:{confirm:{show:!0,label:this._translocoService.translate("confirm"),color:"primary"},cancel:{show:!0,label:this._translocoService.translate("cancel")}},dismissible:!1};this._matDialog.open(P.u,{autoFocus:!1,disableClose:!0,panelClass:"fuse-confirmation-dialog-panel",data:i}).afterClosed().subscribe(s=>{if("confirmed"===s)return this.restart();this._demoService.restart()})}completeResults(){this.errorFace=null,this.loadingResults=!1,this.base64Image=null,this.errorResult||this.stopRecord(),this.saveImageBase64Intent&&(this.saveImageBase64Intent=clearTimeout(this.saveImageBase64Intent)),this.demoData.loading=!1,this._splashScreenService.hide(),this._changeDetectorRef.markForCheck()}ngOnDestroy(){this._unsubscribeAll.next(null),this.loadingResults=!1,this.video=void 0,this.detectFaceInterval&&this.stopRecord()}static#e=this.\u0275fac=function(i){return new(i||r)(t.Y36(t.sBO),t.Y36(R.J),t.Y36(k.e),t.Y36(v.Vn),t.Y36(S.j),t.Y36(t.Qsj))};static#t=this.\u0275cmp=t.Xpm({type:r,selectors:[["app-face"]],viewQuery:function(i,s){if(1&i&&(t.Gf(L,5),t.Gf(F,5),t.Gf(H,5),t.Gf(W,5),t.Gf(X,5)),2&i){let n;t.iGM(n=t.CRH())&&(s.video=n.first),t.iGM(n=t.CRH())&&(s.canvasRef=n.first),t.iGM(n=t.CRH())&&(s.canvasResultRef=n.first),t.iGM(n=t.CRH())&&(s.canvasToSendRef=n.first),t.iGM(n=t.CRH())&&(s.credentialRef=n.first)}},standalone:!0,features:[t.jDz],decls:6,vars:3,consts:[["hidden","true"],["credentialCanvas",""],["id","credential","hidden","true",3,"src"],["fxLayout","column","fxLayoutAlign","center center",1,"min-h-[60vh]","justify-center","p-4","sm:p-1","xs:p-1","w-full"],["fxLayout","column","fxLayoutAlign","center center","class","justify-center w-full",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center","class","id-scanning-error-div",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center center",1,"justify-center","w-full"],["fxLayout","column","fxLayoutAlign","center center",1,"justify-center","text-center","h-20","sm:h-8","xs:h-8","my-2"],[4,"ngIf"],[1,"relative","w-full"],["autoplay","",1,"absolute","top-0","left-0","oval-video"],["video",""],[1,"absolute","top-0","left-0","oval-video"],["canvas",""],[1,"absolute"],["result",""],["toSend",""],[1,"text-3xl","font-bold"],[1,"text-gray-600"],["fxLayout","column","fxLayoutAlign","center center",1,"id-scanning-error-div"],["src","https://cdn.verifik.co/demo/nocameraenabled.svg","alt","",1,"id-scanning-no-camera-enabled-img"],[1,"mt-4"]],template:function(i,s){1&i&&(t._UZ(0,"canvas",0,1)(2,"img",2),t.TgZ(3,"div",3),t.YNc(4,B,12,25,"div",4),t.YNc(5,U,8,6,"div",5),t.qZA()),2&i&&(t.xp6(2),t.Q6J("src",s.idCardImage,t.LSH),t.xp6(2),t.Q6J("ngIf",!s.loadingModel&&!s.lowCamera),t.xp6(1),t.Q6J("ngIf",!s.loadingModel&&s.lowCamera))},dependencies:[T.o9,C.xw,C.Wh,_.ez,_.O5,p.Is,v.y4,v.Ot,y.ot,A.Cv,E.Cq],styles:['mat-stepper[_ngcontent-%COMP%]{width:100%}.id-scanning-error-div[_ngcontent-%COMP%]{margin-top:20px;width:600px;background:white;height:600px;padding:16px;box-shadow:3px 3px 3px 3px #0000000d}.id-scanning-error-div[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{color:#0036e7;font-size:24px;font-weight:800;text-align:center}.id-scanning-error-div[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{color:#01236da6;font-size:16px;font-weight:300;text-align:center}.scan[_ngcontent-%COMP%]{position:relative;display:flex;align-items:center;flex-direction:column}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]{content:"";position:relative;width:130px;height:200px;background:url(https://cdn.verifik.co/web-sdk/images/face.png);background-size:130px 200px}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]:before{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:url(https://cdn.verifik.co/web-sdk/images/smoothed-face.png);background-size:130px 200px;animation:_ngcontent-%COMP%_animate 2s ease-in-out infinite}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]:after{content:"";position:absolute;top:0;left:0;width:100%;height:8px;background:#01236d;border-radius:8px;filter:drop-shadow(0 0 20px #01236d) drop-shadow(0 0 60px #01236d);animation:_ngcontent-%COMP%_animate_line 2s ease-in-out infinite}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]   .dots[_ngcontent-%COMP%]{position:absolute;inset:0}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]   .dots[_ngcontent-%COMP%]:before{content:"";position:absolute;top:0;left:0;width:130px;height:200px;background:url(https://cdn.verifik.co/web-sdk/images/points-face.png);background-size:130px 200px;animation:_ngcontent-%COMP%_face_points 2s ease-in-out infinite}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]   .dots[_ngcontent-%COMP%]:after{content:"";position:absolute;top:0;left:0;width:130px;height:200px;background:url(https://cdn.verifik.co/web-sdk/images/lines-points-face.png);background-size:130px 200px;animation:_ngcontent-%COMP%_face_points_lines 2s ease-in-out infinite}@keyframes _ngcontent-%COMP%_face_points_lines{0%,to{height:0%}50%{height:100%}}@keyframes _ngcontent-%COMP%_face_points{0%,25%,to{height:0%}50%{height:100%}}@keyframes _ngcontent-%COMP%_animate{0%,to{height:0%}50%{height:100%}}@keyframes _ngcontent-%COMP%_animate_line{0%,to{top:0%;opacity:.8}50%{top:100%;opacity:.8}}.back-biometric-animation[_ngcontent-%COMP%]{background:black;width:100%;height:100%}.oval-video[_ngcontent-%COMP%]{border-radius:25px!important;overflow:hidden;max-width:100%}video[_ngcontent-%COMP%]{object-fit:cover}.medium[_ngcontent-%COMP%]   .mat-progress-bar-fill[_ngcontent-%COMP%]:after{background-color:#eab417!important}.failed[_ngcontent-%COMP%]   .mat-progress-bar-fill[_ngcontent-%COMP%]:after{background-color:#f20505!important}.good[_ngcontent-%COMP%]   .mat-progress-bar-fill[_ngcontent-%COMP%]:after{background-color:green!important}']})}return r})()}}]);