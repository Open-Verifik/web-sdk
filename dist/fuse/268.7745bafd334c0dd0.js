"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[268],{8905:(T,O,n)=>{n.d(O,{e:()=>k});var i=n(5861),t=n(553),f=n(1088),I=n(5879),S=n(2065);let D=null,k=(()=>{class y{constructor(r,l){this._httpWrapperService=r,this.breakpointObserver=l,this.apiUrl=t.N.apiUrl,this.initNavigation(),this.initDemoData(),D=this,l.observe([f.u3.XSmall,f.u3.Small]).subscribe(d=>{this.demoData.isMobile=d.matches})}getNavigation(){return this.navigation}initNavigation(){this.navigation={currentStep:1,lastStep:5}}getDemoData(){return!this.demoData.document?._id&&localStorage.getItem("document")&&(this.demoData.document=JSON.parse(localStorage.getItem("document"))),!this.demoData.extractedData.length&&localStorage.getItem("extractedData")&&(this.demoData.extractedData=JSON.parse(localStorage.getItem("extractedData"))),!this.demoData.liveness?._id&&localStorage.getItem("liveness")&&(this.demoData.liveness=JSON.parse(localStorage.getItem("liveness"))),!this.demoData.livenessResult.length&&localStorage.getItem("livenessResult")&&(this.demoData.livenessResult=JSON.parse(localStorage.getItem("livenessResult"))),!this.demoData.comparison?._id&&localStorage.getItem("comparison")&&(this.demoData.comparison=JSON.parse(localStorage.getItem("comparison"))),!this.demoData.comparisonResult.length&&localStorage.getItem("comparisonResult")&&(this.demoData.comparisonResult=JSON.parse(localStorage.getItem("comparisonResult"))),this.demoData}initDemoData(){this.demoData={loading:!1,document:{},liveness:{},comparison:{},livenessResult:[],comparisonResult:[],generalInformation:[],location:[],extractedData:[],lat:null,lng:null}}setDemoDocument(r){this.demoData.document=r,this.demoData.extractedData.push({key:"documentType",value:r.documentType}),this.demoData.extractedData.push({key:"documentNumber",value:r.documentNumber});for(const l in r.OCRExtraction)if(Object.prototype.hasOwnProperty.call(r.OCRExtraction,l)){const d=r.OCRExtraction[l];if(["documentNumber","details"].includes(l))continue;this.demoData.extractedData.push({key:l,value:d})}localStorage.setItem("document",JSON.stringify(r)),localStorage.setItem("extractedData",JSON.stringify(this.demoData.extractedData))}setDemoLiveness(r){this.demoData.liveness=r,this.demoData.liveness.result.liveness_score=parseInt(""+100*this.demoData.liveness.result.liveness_score),this.demoData.liveness.result.min_score=parseInt(""+100*this.demoData.liveness.result.min_score),this.demoData.livenessResult=[];for(const l in r.result)this.demoData.livenessResult.push({key:l,value:r.result[l]});localStorage.setItem("livenessId",r._id),localStorage.setItem("liveness",JSON.stringify(r)),localStorage.setItem("livenessResult",JSON.stringify(this.demoData.livenessResult))}setDemoCompare(r){this.demoData.comparison=r,this.demoData.comparison.result.score=parseInt(""+100*this.demoData.comparison.result.score);for(const l in r.result)this.demoData.comparisonResult.push({key:l,value:r.result[l]});localStorage.setItem("comparisonId",r._id),localStorage.setItem("comparison",JSON.stringify(r)),localStorage.setItem("comparisonResult",JSON.stringify(this.demoData.comparisonResult))}moveToStep(r){r>this.navigation.lastStep||r<=0||(this.navigation.currentStep=r,localStorage.setItem("step",`${r}`))}restart(){localStorage.clear(),this.navigation.currentStep=1,localStorage.setItem("step",`${this.navigation.currentStep}`)}getDeviceDetails(){if(this.demoData.generalInformation.length)return;const r={userAgent:navigator.userAgent,platform:navigator.platform,appName:navigator.appName,appVersion:navigator.appVersion,language:navigator.language,onLine:navigator.onLine,cookiesEnabled:navigator.cookieEnabled,doNotTrack:navigator.doNotTrack,screenResolution:`${screen.width} x ${screen.height}`,screenAvailableResolution:`${screen.availWidth} x ${screen.availHeight}`,colorDepth:screen.colorDepth,pixelDepth:screen.pixelDepth,innerWidth:window.innerWidth,innerHeight:window.innerHeight,outerWidth:window.outerWidth,outerHeight:window.outerHeight,touchSupported:"ontouchstart"in window,geolocationSupported:"geolocation"in navigator,onlineStatus:navigator.onLine?"Online":"Offline"};return this.demoData.generalInformation.push({key:"device",value:r.platform},{key:"language",value:r.language},{key:"userAgent",value:r.userAgent}),this.getLocation(),r}getLocation(){navigator.geolocation?navigator.geolocation.getCurrentPosition(this.showPosition,this.showError):console.log("Geolocation is not supported by this browser.")}showPosition(r){D.demoData.lat=r?.coords.latitude,D.demoData.lng=r?.coords.longitude,localStorage.setItem("lat",D.demoData.lat),localStorage.setItem("lng",D.demoData.lng)}showError(r){switch(r.code){case r.PERMISSION_DENIED:console.log("User denied the request for Geolocation.");break;case r.POSITION_UNAVAILABLE:console.log("Location information is unavailable.");break;case r.TIMEOUT:console.log("The request to get user location timed out.");break;case r.UNKNOWN_ERROR:console.log("An unknown error occurred.")}}reverseGeocodeWithOSM(r,l){return(0,i.Z)(function*(){const d=`https://nominatim.openstreetmap.org/reverse?format=json&lat=${r}&lon=${l}`;try{const _=yield(yield fetch(d)).json();return _&&_.display_name?_:null}catch(b){return console.error("Error during reverse geocoding with OSM:",b),null}})()}getAddress(){var r=this;return(0,i.Z)(function*(){const l=r.demoData.lat||localStorage.getItem("lat"),d=r.demoData.lng||localStorage.getItem("lng");if(!l||!d)return null;if(r.demoData.location.length)return r.demoData.location;let b=localStorage.getItem("location");if(b)return void(r.demoData.location=JSON.parse(b));const _=yield r.reverseGeocodeWithOSM(l,d);if(_){for(const g in _.address)Object.prototype.hasOwnProperty.call(_.address,g)&&r.demoData.location.push({key:g,value:_.address[g]});return localStorage.setItem("location",JSON.stringify(r.demoData.location)),r.demoData.location}})()}requestDocument(r){return this._httpWrapperService.sendRequest("get",`${this.apiUrl}/v2/document-validations/demo/${r}`)}sendDocument(r){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/ocr/scan-demo`,r)}sendSelfie(r){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/face-recognition/liveness/demo`,r)}compareDocumentWithSelfie(r){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/face-recognition/compare/demo`,r)}cleanVariables(){const r=["documentId","document","extractedData","liveness","livenessId","livenessResult","comparison","comparisonResult","comparisonId"];for(let l=0;l<r.length;l++){const d=r[l];localStorage.removeItem(d),this.demoData[d]&&(this.demoData[d]=Array.isArray(this.demoData[d])?[]:Object.keys(this.demoData[d])?{}:null)}}static#e=this.\u0275fac=function(l){return new(l||y)(I.LFG(S.O),I.LFG(f.Yg))};static#t=this.\u0275prov=I.Yz7({token:y,factory:y.\u0275fac,providedIn:"root"})}return y})()},8268:(T,O,n)=>{n.r(O),n.d(O,{FaceComponent:()=>H});var i=n(5861),t=n(5879),f=n(6814),I=n(8645),S=n(7700),D=n(8991),k=n(2296),y=n(9036),h=n(6799),r=n(6007),l=n(5940),d=n(1944),b=n(8905),_=n(6036);const g=["video"],R=["canvas"],m=["result"],u=["toSend"],c=["credentialCanvas"];function C(v,P){if(1&v&&(t.TgZ(0,"div")(1,"div",17),t._uU(2),t.qZA(),t.TgZ(3,"div",18),t._uU(4),t.qZA()()),2&v){const e=t.oxw(2);t.xp6(2),t.Oqu(e.errorFace.title),t.xp6(2),t.Oqu(e.errorFace.subtitle)}}const B=function(v,P){return{"width.px":v,"height.px":P}};function U(v,P){if(1&v&&(t.TgZ(0,"div",5)(1,"div",6),t.YNc(2,C,5,2,"div",7),t.qZA(),t.TgZ(3,"div",8)(4,"div",9),t._UZ(5,"video",10,11)(7,"div",12,13)(9,"canvas",12,14)(11,"canvas",15,16),t.qZA()()()),2&v){const e=t.oxw();t.xp6(2),t.Q6J("ngIf",e.errorFace&&!e.loadingResults),t.xp6(1),t.Q6J("ngStyle",t.WLB(14,B,e.WIDTH,e.HEIGHT)),t.xp6(1),t.Udp("width",e.WIDTH,"px")("height",e.HEIGHT,"px"),t.xp6(1),t.ekj("hidden",e.base64Image),t.xp6(2),t.ekj("hidden",e.base64Image),t.xp6(2),t.ekj("hidden",!e.base64Image),t.xp6(2),t.ekj("hidden",!0)}}let H=(()=>{class v{constructor(e,a,s,o,p){this._changeDetectorRef=e,this._sdkService=a,this._demoService=s,this._translocoService=o,this._splashScreenService=p,this._matDialog=(0,t.f3M)(S.uw),this.debugText="debug",this.OVAL={},this.loadingResults=!1,this.loadingModel=!1,this._unsubscribeAll=new I.x,this.loadingModel=!0,this.debugIndex=0,this.osInfo=this.detectOS(),this.demoData=this._demoService.getDemoData(),this.listenModeDebug(),this._changeDetectorRef.markForCheck()}listenModeDebug(){this.isActiveDebug=!!localStorage.getItem("isActiveDebug"),document.addEventListener("keydown",e=>{if(this.debugText.charAt(this.debugIndex)===e.key.toLowerCase())return 3===this.debugIndex&&(this.isActiveDebug=!this.isActiveDebug,localStorage.setItem("isActiveDebug",this.isActiveDebug?"true":""),this._changeDetectorRef.markForCheck()),this.debugIndex++;this.debugIndex=0})}stopRecord(){this.detectFaceInterval&&clearInterval(this.detectFaceInterval),this.stream&&this.stream.getTracks().forEach(e=>e.stop())}ngOnInit(){var e=this;return(0,i.Z)(function*(){e._splashScreenService.show(),e.idCardImage=localStorage.getItem("idCard"),e.errorFace=null,e.loadingResults=!1,e.base64Image=null,yield e.loadModels(),yield e.startAsyncVideo()})()}restart(){var e=this;return(0,i.Z)(function*(){e.completeResults(),yield e.startAsyncVideo()})()}loadModels(){var e=this;return(0,i.Z)(function*(){e.left=new Image,e.left.crossOrigin="anonymous",e.left.src="https://cdn.verifik.co/web-sdk/images/left.png",e.right=new Image,e.right.crossOrigin="anonymous",e.right.src="https://cdn.verifik.co/web-sdk/images/right.png",e.up=new Image,e.up.crossOrigin="anonymous",e.up.src="https://cdn.verifik.co/web-sdk/images/up.png",e.down=new Image,e.down.crossOrigin="anonymous",e.down.src="https://cdn.verifik.co/web-sdk/images/down.png",yield h.qB.ssdMobilenetv1.loadFromUri("https://cdn.verifik.co/web-sdk/models"),yield h.qB.tinyFaceDetector.loadFromUri("https://cdn.verifik.co/web-sdk/models"),yield h.qB.faceLandmark68Net.loadFromUri("https://cdn.verifik.co/web-sdk/models"),yield h.qB.faceRecognitionNet.loadFromUri("https://cdn.verifik.co/web-sdk/models"),yield h.qB.faceExpressionNet.loadFromUri("https://cdn.verifik.co/web-sdk/models"),yield h.qB.ageGenderNet.loadFromUri("https://cdn.verifik.co/web-sdk/models"),yield e.detectFaceBiggest(.7),e.loadingModel=!1})()}detectFaceBiggest(e){var a=this;return(0,i.Z)(function*(){const s=document.getElementById("credential"),o=yield h.Qr(s,new h.aK({scoreThreshold:e})).withFaceLandmarks().withFaceExpressions();if(e<=.1)return;if(!o.length)return void a.detectFaceBiggest(e-.1);let w,p=0;for(const F of o){const W=F.detection.box,L=W.width*W.height;L>p&&(w=F.detection,p=L)}const M=w.box,A=1.2*Math.ceil(M.width),x=1.4*Math.ceil(M.height),N=Math.floor(M.x),Y=Math.floor(M.y)-(x-M.height),E=a.credentialRef.nativeElement,X=E.getContext("2d");E.height=x,E.width=A,X.drawImage(s,N,Y,A,x,0,0,A,x),a.faceIdCard=E.toDataURL("image/jpeg").replace(/^data:.*;base64,/,"")})()}startAsyncVideo(){var e=this;return(0,i.Z)(function*(){try{e.stream=yield navigator.mediaDevices.getUserMedia({video:{facingMode:"user",height:{ideal:1080}},audio:!1}),e.videoInput=e.video.nativeElement,e.videoInput.srcObject=e.stream,e.videoInput.style.transform="scaleX(-1)";const s=e.stream.getVideoTracks()[0].getSettings(),{width:o,height:p}=s;e.videoDimensions={height:p,width:o},setTimeout(()=>{e.video||e.canvas?setTimeout(()=>{e.HEIGHT=e.videoInput.clientHeight,e.WIDTH=e.videoInput.clientWidth,e.videoCenterX=e.WIDTH/2,e.videoCenterY=e.HEIGHT/2,e.marginY=.04*e.HEIGHT,e.marginX=.8*e.marginY,e.OVAL.radiusY=.85*e.HEIGHT/2,e.OVAL.radiusX=.75*e.OVAL.radiusY,e.displaySize={width:e.WIDTH,height:e.HEIGHT},e.demoData.loading=!1,e._splashScreenService.hide(),e.detectFaces(),e._changeDetectorRef.markForCheck()},300):e.stopRecord()},300)}catch(a){alert(`${a.message}`),console.error("SHOW ERROR")}})()}detectFaces(){var e=this;return(0,i.Z)(function*(){yield e.setConfigCanvas(),e.detectFaceInterval=setInterval((0,i.Z)(function*(){const a=yield h.Qr(e.videoInput,new h.aK).withFaceLandmarks().withFaceExpressions().withAgeAndGender(),s=e.canvas.getContext("2d");a.length>0&&(e.lastFace=a[0],e.errorFace=null,e.drawFaceAndCenter(a,s),e.isFaceCentered(e.lastFace.landmarks.getNose()[3]),e.isFaceClose(e.lastFace.landmarks),e.drawStatusOval(s,!e.errorFace?.title),e.errorFace||e.captureBase64Image()),e._changeDetectorRef.markForCheck()}),100)})()}manualCapture(){this.takePicture()}setConfigCanvas(){var e=this;return(0,i.Z)(function*(){e.canvas||(e.canvas=yield h.Jd(e.videoInput),e.canvasEl=e.canvasRef.nativeElement,e.canvasEl.appendChild(e.canvas),e.canvas.setAttribute("id","canvas"),h.JF(e.canvas,e.displaySize));const a=e.canvas.getContext("2d");e.drawOvalCenterAndMask(a)})()}drawFaceAndCenter(e,a){const s=h._C(e,this.displaySize);this.drawOvalCenterAndMask(a),this.isActiveDebug&&(a.strokeStyle="red",a.lineWidth=4,a.strokeRect(this.videoCenterX-this.marginX,this.videoCenterY,2*this.marginX,2*this.marginY),h.ii.drawFaceLandmarks(this.canvas,s),h.ii.drawFaceExpressions(this.canvas,s),new h.ii.DrawBox(e[0].detection.box,{label:`${e[0].gender.toUpperCase()} | ${Math.round(e[0].age)} years old`}).draw(this.canvas))}drawOvalCenterAndMask(e){e.clearRect(0,0,this.canvas.width,this.canvas.height),e.fillStyle="rgba(255, 255, 255, 0.75)",e.fillRect(0,0,this.canvas.width,this.canvas.height),e.globalCompositeOperation="destination-out",e.fillStyle="rgba(255, 255, 255, 1)",e.beginPath(),e.ellipse(this.videoCenterX,this.videoCenterY,this.OVAL.radiusX,this.OVAL.radiusY,0,0,2*Math.PI),e.fill(),e.closePath(),e.globalCompositeOperation="source-over"}drawText(e,a,s,o){e.font="30px Arial",e.textAlign="center";const p=e.measureText(a);e.fillStyle="black",e.fillRect(s-p.width/2,o-30-10,p.width+2,60),e.fillStyle="white",e.fillText(a,s,o)}drawStatusOval(e,a){e.beginPath(),e.ellipse(this.videoCenterX,this.videoCenterY,this.OVAL.radiusX,this.OVAL.radiusY,0,0,2*Math.PI),e.lineWidth=5,e.strokeStyle=a?"green":"red",e.stroke(),e.closePath(),a||(this.errorFace.canvas?.includes("\u2191")&&e.drawImage(this.up,this.videoCenterX-20,this.videoCenterY-this.OVAL.radiusY+10,40,40),this.errorFace.canvas?.includes("\u2193")&&e.drawImage(this.down,this.videoCenterX-20,this.videoCenterY+this.OVAL.radiusY-50,40,40),this.errorFace.canvas?.includes("\u2192")&&e.drawImage(this.right,this.videoCenterX+this.OVAL.radiusX-50,this.videoCenterY-20,40,40),this.errorFace.canvas?.includes("\u2190")&&e.drawImage(this.left,this.videoCenterX-this.OVAL.radiusX+10,this.videoCenterY-20,40,40)),this._changeDetectorRef.markForCheck()}isFaceCentered(e){const a=e.x/this.videoDimensions.width*this.WIDTH,s=e.y/this.videoDimensions.height*this.HEIGHT;if(!(a>this.videoCenterX-this.marginX&&a<this.videoCenterX+this.marginX&&s>this.videoCenterY&&s<this.videoCenterY+2*this.marginY)){let p="";(a<this.videoCenterX-this.marginX||a>this.videoCenterX+this.marginX)&&(p+=` ${a<this.videoCenterX-this.marginX?"\u2192":"\u2190"} `),(s<this.videoCenterY||s>this.videoCenterY+2*this.marginY)&&(p+=` ${s<this.videoCenterY?"\u2191":"\u2193"}  `),this.errorFace={title:this._translocoService.translate("liveness.center_yor_face"),subtitle:this._translocoService.translate("liveness.center_your_face_subtitle"),canvas:p}}}isFaceClose(e){e.imageHeight*e.imageWidth/(4*this.OVAL.radiusX*this.videoInput.height)<.25&&(this.errorFace={title:this._translocoService.translate("liveness.get_closer"),subtitle:this._translocoService.translate("liveness.get_closer_subtitle")})}captureBase64Image(){this.saveImageBase64Intent||(this.saveImageBase64Intent=setTimeout(()=>{this.errorFace&&(this.saveImageBase64Intent=clearTimeout(this.saveImageBase64Intent)),this.takePicture()},1500))}takePicture(){var e=this;return(0,i.Z)(function*(){const a=e.canvasToSendRef.nativeElement,o={rectHeight:e.HEIGHT,rectWidth:2.8*e.OVAL.radiusX,y:0,x:e.videoCenterX-1.4*e.OVAL.radiusX},p={rectHeight:e.videoDimensions.height,rectWidth:o.rectWidth/e.WIDTH*e.videoDimensions.width,y:0,x:o.x/e.WIDTH*e.videoDimensions.width};e.setPictureInCavas(e.canvasResultRef.nativeElement,o,p),e.setPictureInCavas(a,p),e.base64Image=a.toDataURL("image/jpeg").replace(/^data:.*;base64,/,""),e.stopRecord(),yield e.liveness()})()}setPictureInCavas(e,a,s){const o=e.getContext("2d");e.width=a.rectWidth,e.height=a.rectHeight,e.style.marginLeft=`${a.x}px`,e.style.marginTop=`${a.y}px`,s||(s={x:a.x,y:a.y,rectWidth:a.rectWidth,rectHeight:a.rectHeight}),o.drawImage(this.video.nativeElement,s.x,s.y,s.rectWidth,s.rectHeight,0,0,a.rectWidth,a.rectHeight)}detectOS(){const e=window.navigator.userAgent.toLowerCase();return/android/.test(e)?"ANDROID":/iphone|ipad|ipod/.test(e)?"IOS":"DESKTOP"}liveness(){this.loadingResults||(this.loadingResults=!0,this.demoData.loading=!0,this._splashScreenService.show(),this._sdkService.livenessDemo({image:this.base64Image,os:this.osInfo}).subscribe(a=>{this.errorResult=null,this.demoData.loading=!1,this._demoService.setDemoLiveness(a.data),this._compareWithDocument({search_mode:"FAST",gallery:[this.faceIdCard||this.demoData.document.url],probe:[this.demoData.liveness.images[0]]})},a=>{this.demoData.loading=!1,this._splashScreenService.hide(),this.retryLivenessModal(a.error?.message)}))}_compareWithDocument(e){this._demoService.compareDocumentWithSelfie(e).subscribe(a=>{this.completeResults(),this._demoService.setDemoCompare(a.data),this._demoService.moveToStep(5)},a=>{})}retryLivenessModal(e){const a={title:this._translocoService.translate("liveness.liveness_failed"),message:this._translocoService.translate("liveness.liveness_error_message",{error:e}),icon:{show:!0,name:"heroicons_outline:exclamation-triangle",color:"warn"},actions:{confirm:{show:!0,label:this._translocoService.translate("confirm"),color:"primary"},cancel:{show:!0,label:this._translocoService.translate("cancel")}},dismissible:!1};this._matDialog.open(y.u,{autoFocus:!1,disableClose:!0,panelClass:"fuse-confirmation-dialog-panel",data:a}).afterClosed().subscribe(s=>{if("confirmed"===s)return this.restart();this._demoService.restart()})}completeResults(){this.errorFace=null,this.loadingResults=!1,this.base64Image=null,this.errorResult||this.stopRecord(),this.saveImageBase64Intent&&(this.saveImageBase64Intent=clearTimeout(this.saveImageBase64Intent)),this.demoData.loading=!1,this._splashScreenService.hide(),this._changeDetectorRef.markForCheck()}ngOnDestroy(){this._unsubscribeAll.next(null),this.loadingResults=!1,this.video=void 0,this.detectFaceInterval&&this.stopRecord()}static#e=this.\u0275fac=function(a){return new(a||v)(t.Y36(t.sBO),t.Y36(d.J),t.Y36(b.e),t.Y36(D.Vn),t.Y36(_.j))};static#t=this.\u0275cmp=t.Xpm({type:v,selectors:[["app-face"]],viewQuery:function(a,s){if(1&a&&(t.Gf(g,5),t.Gf(R,5),t.Gf(m,5),t.Gf(u,5),t.Gf(c,5)),2&a){let o;t.iGM(o=t.CRH())&&(s.video=o.first),t.iGM(o=t.CRH())&&(s.canvasRef=o.first),t.iGM(o=t.CRH())&&(s.canvasResultRef=o.first),t.iGM(o=t.CRH())&&(s.canvasToSendRef=o.first),t.iGM(o=t.CRH())&&(s.credentialRef=o.first)}},standalone:!0,features:[t.jDz],decls:5,vars:2,consts:[[1,"min-h-[900px]","flex","flex-col","items-center","justify-center","p-8","w-full"],["class","flex flex-col items-center justify-center w-full",4,"ngIf"],["hidden","true"],["credentialCanvas",""],["id","credential","hidden","true",3,"src"],[1,"flex","flex-col","items-center","justify-center","w-full"],[1,"flex","flex-col","items-center","justify-center","text-center","h-20","my-2"],[4,"ngIf"],[1,"relative","w-full",3,"ngStyle"],[1,"relative","w-full"],["autoplay","",1,"absolute","top-0","left-0","oval-video","max-h-[75vh]"],["video",""],[1,"absolute","top-0","left-0","oval-video"],["canvas",""],["result",""],[1,"absolute","top-0","left-0"],["toSend",""],[1,"text-3xl","font-bold"],[1,"text-gray-600"]],template:function(a,s){1&a&&(t.TgZ(0,"div",0),t.YNc(1,U,13,17,"div",1),t.qZA(),t._UZ(2,"canvas",2,3)(4,"img",4)),2&a&&(t.xp6(1),t.Q6J("ngIf",!s.loadingModel),t.xp6(3),t.Q6J("src",s.idCardImage,t.LSH))},dependencies:[f.ez,f.O5,f.PC,S.Is,D.y4,k.ot,r.Cv,l.Cq],styles:['mat-stepper[_ngcontent-%COMP%]{width:100%}.scan[_ngcontent-%COMP%]{position:relative;display:flex;align-items:center;flex-direction:column}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]{content:"";position:relative;width:130px;height:200px;background:url(https://cdn.verifik.co/web-sdk/images/face.png);background-size:130px 200px}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]:before{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:url(https://cdn.verifik.co/web-sdk/images/smoothed-face.png);background-size:130px 200px;animation:_ngcontent-%COMP%_animate 2s ease-in-out infinite}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]:after{content:"";position:absolute;top:0;left:0;width:100%;height:8px;background:#01236d;border-radius:8px;filter:drop-shadow(0 0 20px #01236d) drop-shadow(0 0 60px #01236d);animation:_ngcontent-%COMP%_animate_line 2s ease-in-out infinite}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]   .dots[_ngcontent-%COMP%]{position:absolute;inset:0}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]   .dots[_ngcontent-%COMP%]:before{content:"";position:absolute;top:0;left:0;width:130px;height:200px;background:url(https://cdn.verifik.co/web-sdk/images/points-face.png);background-size:130px 200px;animation:_ngcontent-%COMP%_face_points 2s ease-in-out infinite}.scan[_ngcontent-%COMP%]   .face[_ngcontent-%COMP%]   .dots[_ngcontent-%COMP%]:after{content:"";position:absolute;top:0;left:0;width:130px;height:200px;background:url(https://cdn.verifik.co/web-sdk/images/lines-points-face.png);background-size:130px 200px;animation:_ngcontent-%COMP%_face_points_lines 2s ease-in-out infinite}@keyframes _ngcontent-%COMP%_face_points_lines{0%,to{height:0%}50%{height:100%}}@keyframes _ngcontent-%COMP%_face_points{0%,25%,to{height:0%}50%{height:100%}}@keyframes _ngcontent-%COMP%_animate{0%,to{height:0%}50%{height:100%}}@keyframes _ngcontent-%COMP%_animate_line{0%,to{top:0%;opacity:.8}50%{top:100%;opacity:.8}}.back-biometric-animation[_ngcontent-%COMP%]{background:black;width:100%;height:100%}.oval-video[_ngcontent-%COMP%]{border-radius:25px!important;overflow:hidden;max-width:100%}video[_ngcontent-%COMP%]{object-fit:cover}.medium[_ngcontent-%COMP%]   .mat-progress-bar-fill[_ngcontent-%COMP%]:after{background-color:#eab417!important}.failed[_ngcontent-%COMP%]   .mat-progress-bar-fill[_ngcontent-%COMP%]:after{background-color:#f20505!important}.good[_ngcontent-%COMP%]   .mat-progress-bar-fill[_ngcontent-%COMP%]:after{background-color:green!important}']})}return v})()},5940:(T,O,n)=>{n.d(O,{Cq:()=>_,Ou:()=>d});var i=n(5879),t=n(3680),f=n(2495),I=n(6814);const S=["determinateSpinner"];function D(g,R){if(1&g&&(i.O4$(),i.TgZ(0,"svg",11),i._UZ(1,"circle",12),i.qZA()),2&g){const m=i.oxw();i.uIk("viewBox",m._viewBox()),i.xp6(1),i.Udp("stroke-dasharray",m._strokeCircumference(),"px")("stroke-dashoffset",m._strokeCircumference()/2,"px")("stroke-width",m._circleStrokeWidth(),"%"),i.uIk("r",m._circleRadius())}}const k=(0,t.pj)(class{constructor(g){this._elementRef=g}},"primary"),y=new i.OlP("mat-progress-spinner-default-options",{providedIn:"root",factory:function h(){return{diameter:r}}}),r=100;let d=(()=>{class g extends k{constructor(m,u,c){super(m),this.mode="mat-spinner"===this._elementRef.nativeElement.nodeName.toLowerCase()?"indeterminate":"determinate",this._value=0,this._diameter=r,this._noopAnimations="NoopAnimations"===u&&!!c&&!c._forceAnimations,c&&(c.color&&(this.color=this.defaultColor=c.color),c.diameter&&(this.diameter=c.diameter),c.strokeWidth&&(this.strokeWidth=c.strokeWidth))}get value(){return"determinate"===this.mode?this._value:0}set value(m){this._value=Math.max(0,Math.min(100,(0,f.su)(m)))}get diameter(){return this._diameter}set diameter(m){this._diameter=(0,f.su)(m)}get strokeWidth(){return this._strokeWidth??this.diameter/10}set strokeWidth(m){this._strokeWidth=(0,f.su)(m)}_circleRadius(){return(this.diameter-10)/2}_viewBox(){const m=2*this._circleRadius()+this.strokeWidth;return`0 0 ${m} ${m}`}_strokeCircumference(){return 2*Math.PI*this._circleRadius()}_strokeDashOffset(){return"determinate"===this.mode?this._strokeCircumference()*(100-this._value)/100:null}_circleStrokeWidth(){return this.strokeWidth/this.diameter*100}static#e=this.\u0275fac=function(u){return new(u||g)(i.Y36(i.SBq),i.Y36(i.QbO,8),i.Y36(y))};static#t=this.\u0275cmp=i.Xpm({type:g,selectors:[["mat-progress-spinner"],["mat-spinner"]],viewQuery:function(u,c){if(1&u&&i.Gf(S,5),2&u){let C;i.iGM(C=i.CRH())&&(c._determinateCircle=C.first)}},hostAttrs:["role","progressbar","tabindex","-1",1,"mat-mdc-progress-spinner","mdc-circular-progress"],hostVars:16,hostBindings:function(u,c){2&u&&(i.uIk("aria-valuemin",0)("aria-valuemax",100)("aria-valuenow","determinate"===c.mode?c.value:null)("mode",c.mode),i.Udp("width",c.diameter,"px")("height",c.diameter,"px")("--mdc-circular-progress-size",c.diameter+"px")("--mdc-circular-progress-active-indicator-width",c.diameter+"px"),i.ekj("_mat-animation-noopable",c._noopAnimations)("mdc-circular-progress--indeterminate","indeterminate"===c.mode))},inputs:{color:"color",mode:"mode",value:"value",diameter:"diameter",strokeWidth:"strokeWidth"},exportAs:["matProgressSpinner"],features:[i.qOj],decls:14,vars:11,consts:[["circle",""],["aria-hidden","true",1,"mdc-circular-progress__determinate-container"],["determinateSpinner",""],["xmlns","http://www.w3.org/2000/svg","focusable","false",1,"mdc-circular-progress__determinate-circle-graphic"],["cx","50%","cy","50%",1,"mdc-circular-progress__determinate-circle"],["aria-hidden","true",1,"mdc-circular-progress__indeterminate-container"],[1,"mdc-circular-progress__spinner-layer"],[1,"mdc-circular-progress__circle-clipper","mdc-circular-progress__circle-left"],[3,"ngTemplateOutlet"],[1,"mdc-circular-progress__gap-patch"],[1,"mdc-circular-progress__circle-clipper","mdc-circular-progress__circle-right"],["xmlns","http://www.w3.org/2000/svg","focusable","false",1,"mdc-circular-progress__indeterminate-circle-graphic"],["cx","50%","cy","50%"]],template:function(u,c){if(1&u&&(i.YNc(0,D,2,8,"ng-template",null,0,i.W1O),i.TgZ(2,"div",1,2),i.O4$(),i.TgZ(4,"svg",3),i._UZ(5,"circle",4),i.qZA()(),i.kcU(),i.TgZ(6,"div",5)(7,"div",6)(8,"div",7),i.GkF(9,8),i.qZA(),i.TgZ(10,"div",9),i.GkF(11,8),i.qZA(),i.TgZ(12,"div",10),i.GkF(13,8),i.qZA()()()),2&u){const C=i.MAs(1);i.xp6(4),i.uIk("viewBox",c._viewBox()),i.xp6(1),i.Udp("stroke-dasharray",c._strokeCircumference(),"px")("stroke-dashoffset",c._strokeDashOffset(),"px")("stroke-width",c._circleStrokeWidth(),"%"),i.uIk("r",c._circleRadius()),i.xp6(4),i.Q6J("ngTemplateOutlet",C),i.xp6(2),i.Q6J("ngTemplateOutlet",C),i.xp6(2),i.Q6J("ngTemplateOutlet",C)}},dependencies:[I.tP],styles:["@keyframes mdc-circular-progress-container-rotate{to{transform:rotate(360deg)}}@keyframes mdc-circular-progress-spinner-layer-rotate{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes mdc-circular-progress-color-1-fade-in-out{from{opacity:.99}25%{opacity:.99}26%{opacity:0}89%{opacity:0}90%{opacity:.99}to{opacity:.99}}@keyframes mdc-circular-progress-color-2-fade-in-out{from{opacity:0}15%{opacity:0}25%{opacity:.99}50%{opacity:.99}51%{opacity:0}to{opacity:0}}@keyframes mdc-circular-progress-color-3-fade-in-out{from{opacity:0}40%{opacity:0}50%{opacity:.99}75%{opacity:.99}76%{opacity:0}to{opacity:0}}@keyframes mdc-circular-progress-color-4-fade-in-out{from{opacity:0}65%{opacity:0}75%{opacity:.99}90%{opacity:.99}to{opacity:0}}@keyframes mdc-circular-progress-left-spin{from{transform:rotate(265deg)}50%{transform:rotate(130deg)}to{transform:rotate(265deg)}}@keyframes mdc-circular-progress-right-spin{from{transform:rotate(-265deg)}50%{transform:rotate(-130deg)}to{transform:rotate(-265deg)}}.mdc-circular-progress{display:inline-flex;position:relative;direction:ltr;line-height:0;transition:opacity 250ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-circular-progress__determinate-container,.mdc-circular-progress__indeterminate-circle-graphic,.mdc-circular-progress__indeterminate-container,.mdc-circular-progress__spinner-layer{position:absolute;width:100%;height:100%}.mdc-circular-progress__determinate-container{transform:rotate(-90deg)}.mdc-circular-progress__indeterminate-container{font-size:0;letter-spacing:0;white-space:nowrap;opacity:0}.mdc-circular-progress__determinate-circle-graphic,.mdc-circular-progress__indeterminate-circle-graphic{fill:rgba(0,0,0,0)}.mdc-circular-progress__determinate-circle{transition:stroke-dashoffset 500ms 0ms cubic-bezier(0, 0, 0.2, 1)}.mdc-circular-progress__gap-patch{position:absolute;top:0;left:47.5%;box-sizing:border-box;width:5%;height:100%;overflow:hidden}.mdc-circular-progress__gap-patch .mdc-circular-progress__indeterminate-circle-graphic{left:-900%;width:2000%;transform:rotate(180deg)}.mdc-circular-progress__circle-clipper{display:inline-flex;position:relative;width:50%;height:100%;overflow:hidden}.mdc-circular-progress__circle-clipper .mdc-circular-progress__indeterminate-circle-graphic{width:200%}.mdc-circular-progress__circle-right .mdc-circular-progress__indeterminate-circle-graphic{left:-100%}.mdc-circular-progress--indeterminate .mdc-circular-progress__determinate-container{opacity:0}.mdc-circular-progress--indeterminate .mdc-circular-progress__indeterminate-container{opacity:1}.mdc-circular-progress--indeterminate .mdc-circular-progress__indeterminate-container{animation:mdc-circular-progress-container-rotate 1568.2352941176ms linear infinite}.mdc-circular-progress--indeterminate .mdc-circular-progress__spinner-layer{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__color-1{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both,mdc-circular-progress-color-1-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__color-2{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both,mdc-circular-progress-color-2-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__color-3{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both,mdc-circular-progress-color-3-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__color-4{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both,mdc-circular-progress-color-4-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__circle-left .mdc-circular-progress__indeterminate-circle-graphic{animation:mdc-circular-progress-left-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__circle-right .mdc-circular-progress__indeterminate-circle-graphic{animation:mdc-circular-progress-right-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--closed{opacity:0}.mat-mdc-progress-spinner{--mdc-circular-progress-active-indicator-width:4px;--mdc-circular-progress-size:48px}.mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle,.mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic{stroke:var(--mdc-circular-progress-active-indicator-color)}@media screen and (forced-colors: active),(-ms-high-contrast: active){.mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle,.mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic{stroke:CanvasText}}.mat-mdc-progress-spinner circle{stroke-width:var(--mdc-circular-progress-active-indicator-width)}@media screen and (forced-colors: active),(-ms-high-contrast: active){.mat-mdc-progress-spinner .mdc-circular-progress--four-color .mdc-circular-progress__color-1 .mdc-circular-progress__indeterminate-circle-graphic{stroke:CanvasText}}@media screen and (forced-colors: active),(-ms-high-contrast: active){.mat-mdc-progress-spinner .mdc-circular-progress--four-color .mdc-circular-progress__color-2 .mdc-circular-progress__indeterminate-circle-graphic{stroke:CanvasText}}@media screen and (forced-colors: active),(-ms-high-contrast: active){.mat-mdc-progress-spinner .mdc-circular-progress--four-color .mdc-circular-progress__color-3 .mdc-circular-progress__indeterminate-circle-graphic{stroke:CanvasText}}@media screen and (forced-colors: active),(-ms-high-contrast: active){.mat-mdc-progress-spinner .mdc-circular-progress--four-color .mdc-circular-progress__color-4 .mdc-circular-progress__indeterminate-circle-graphic{stroke:CanvasText}}.mat-mdc-progress-spinner .mdc-circular-progress{width:var(--mdc-circular-progress-size) !important;height:var(--mdc-circular-progress-size) !important}.mat-mdc-progress-spinner{display:block;overflow:hidden;line-height:0}.mat-mdc-progress-spinner._mat-animation-noopable,.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__determinate-circle{transition:none}.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-circle-graphic,.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__spinner-layer,.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-container{animation:none}.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-container circle{stroke-dasharray:0 !important}.cdk-high-contrast-active .mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic,.cdk-high-contrast-active .mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle{stroke:currentColor;stroke:CanvasText}"],encapsulation:2,changeDetection:0})}return g})(),_=(()=>{class g{static#e=this.\u0275fac=function(u){return new(u||g)};static#t=this.\u0275mod=i.oAB({type:g});static#r=this.\u0275inj=i.cJS({imports:[I.ez,t.BQ]})}return g})()}}]);