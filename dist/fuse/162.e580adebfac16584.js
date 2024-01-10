"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[162],{9162:(R,y,r)=>{r.d(y,{e:()=>w});var u=r(5861),I=r(5619),g=r(553),d=r(1088),v=r(6799);class O{constructor(t){if(t){this.documentNumber=t.documentNumber,this.firstName=`${t.firstName||""} ${t.middleName||""}`.trim()||`${t.name1||""} ${t.name2||""} ${t.name3||""}`.trim()||`${t.givenNames||""}`.trim(),this.lastName=`${t.lastName||""} ${t.secondLastName||""}`.trim()||`${t.surname||""}`.trim(),this.fullName=`${this.firstName||""} ${this.lastName||""}`,this.dateOfBirth=t.dateOfBirth,this.country=t.country,this.nationality=t.nationality,this.gender=t.gender||t.sex,this.placeOfBirth=t.placeOfBirth||t.birthPlace,this.issueDate=t.dateOfIssue||t.issueDate,this.expirationDate=t.dateOfExpiry||t.expiryDate||t.expirationDate,this.issuingAuthority=t.issuingAuthority,this.maritalStatus=t.marritalStatus||t.maritalStatus,this.observations=t.observations,this.code=t.code,this.organDonor=t.organDonor,this.bloodType=t.bloodType,this.locationCode=t.locationCode,this.inscriptionDate=t.inscriptionDate,this.notMapped=[];for(const e in t)Object.prototype.hasOwnProperty.call(t,e)&&(this[e]||this.notMapped.push({key:e,value:t[e]}))}}}class c{constructor(t){if(t){this._id=t._id,this.documentType=t.documentType,this.documentNumber=t.documentNumber,this.url=t.url,this.status=t.status,this.validationMethod=t.validationMethod,this.namesMatch=t.namesMatch,this.OCRExtraction=new O(t.OCRExtraction),this.arrayFields=[{key:"documentType",value:this.documentType}];for(const e in this.OCRExtraction){if(!Object.prototype.hasOwnProperty.call(this.OCRExtraction,e))continue;const s=this.OCRExtraction[e];!s||Array.isArray(s)||this.arrayFields.push({key:e,value:s})}this.scoreValidated=t.scoreValidated,this.scoreValidation=t.scoreValidation}}}class f{constructor(t){this._id=t._id||"new",this.identifier=t.identifier,this.lead=t.lead,this.status=t.status,this.liveness=t.liveness||{},this.comparison=t.comparison||{},this.comparisonResult=t.comparisonResult||[],this.generalInformation=t.generalInformation||{},this.lat=t.lat,this.lng=t.lng}}class S{constructor(t){t&&(this._id=t._id||"new",this.status=t.status||"active",this.phone=t.phone,this.countryCode=t.countryCode,this.name=t.name,this.companyName=t.companyName,this.email=t.email,this.website=t.website,this.jobFunction=t.jobFunction,this.sessionsCount=t.sessionsCount||0,this.sessionsLimit=t.sessionsLimit||10)}}var p=r(5879),N=r(2065);let h=null,w=(()=>{class n{constructor(e,s){this._httpWrapperService=e,this.breakpointObserver=s,this._faceapi=new I.X(null),this.apiUrl=g.N.apiUrl,this.loadModels(),this.initNavigation(),this.initDemoData(),this.initSampleData(),h=this,s.observe([d.u3.XSmall,d.u3.Small]).subscribe(o=>{this.demoData.isMobile=o.matches,this.demoData.time=o.matches?500:250}),this.demoData.OS=this.detectOS()}initSampleData(){g.N.production||(this.sampleLastNames=["Smith","Johnson","Williams","Jones","Brown","Davis","Miller","Wilson","Moore","Taylor","Reynolds","Specter","Litt","Ross","Garc\xeda","Fern\xe1ndez","Gonz\xe1lez","Rodr\xedguez","L\xf3pez","Mart\xednez","S\xe1nchez","P\xe9rez","Mart\xedn","G\xf3mez"],this.sampleFirstNames=["James","John","Robert","Michael","William","David","Richard","Joseph","Thomas","Charles","Mike","Harvey","Jos\xe9","Juan","Miguel","Luis","Antonio","Javier","Francisco","Carlos","Alejandro","Manuel"])}detectOS(){const e=window.navigator.userAgent.toLowerCase();return/android/.test(e)?"ANDROID":/iphone|ipad|ipod/.test(e)?"IOS":"DESKTOP"}get faceapi$(){return this._faceapi.asObservable()}loadModels(){var e=this;return(0,u.Z)(function*(){const s=[];s.push(v.qB.ssdMobilenetv1.loadFromUri("assets/models")),s.push(v.qB.faceLandmark68Net.loadFromUri("assets/models")),yield Promise.allSettled(s),e._faceapi.next(!0)})()}getNavigation(){return this.navigation}initNavigation(){this.navigation={currentStep:1,lastStep:5}}getDemoData(){return!this.demoData.proFields?.length&&localStorage.getItem("proFields")&&(this.demoData.pro=new c(JSON.parse(localStorage.getItem("pro"))),this.demoData.proFields=this.demoData.pro.arrayFields),!this.demoData.promptFields?.length&&localStorage.getItem("promptFields")&&(this.demoData.prompt=new c(JSON.parse(localStorage.getItem("prompt"))),this.demoData.promptFields=this.demoData.prompt.arrayFields),!this.demoData.studioFields?.length&&localStorage.getItem("studioFields")&&(this.demoData.studio=new c(JSON.parse(localStorage.getItem("studio"))),this.demoData.studioFields=this.demoData.studio.arrayFields),!this.demoData.liveness?._id&&localStorage.getItem("liveness")&&(this.demoData.liveness=JSON.parse(localStorage.getItem("liveness"))),!this.demoData.livenessResult.length&&localStorage.getItem("livenessResult")&&(this.demoData.livenessResult=JSON.parse(localStorage.getItem("livenessResult"))),!this.demoData.comparison?._id&&localStorage.getItem("comparison")&&(this.demoData.comparison=JSON.parse(localStorage.getItem("comparison"))),!this.demoData.comparisonResult.length&&localStorage.getItem("comparisonResult")&&(this.demoData.comparisonResult=JSON.parse(localStorage.getItem("comparisonResult"))),this.demoData}initDemoData(){this.demoData={loading:!1,liveness:{},comparison:{},livenessResult:[],comparisonResult:[],generalInformation:[],location:[],documentType:{},documentTypeFields:[],pro:{},proFields:[],studio:{},studioFields:[],prompt:{},promptFields:[],lat:null,lng:null}}setDemoDocument(e){this.demoData.proFields=[],this.demoData.promptFields=[],this.demoData.studioFields=[],this.formatAndSaveOCRs(e.pro,"pro"),this.formatAndSaveOCRs(e.studio,"studio"),this.formatAndSaveOCRs(e.prompt,"prompt"),this.demoData.studio?localStorage.setItem("documentId",this.demoData.studio._id):this.demoData.prompt?localStorage.setItem("documentId",this.demoData.prompt._id):this.demoData.pro&&localStorage.setItem("documentId",this.demoData.pro._id)}formatAndSaveOCRs(e,s){const o=`${s}Fields`;if(!e||!e.documentNumber)return localStorage.removeItem(s),void localStorage.removeItem(o);this.demoData[o].push({key:"documentType",value:e.documentType}),this.demoData[o].push({key:"documentNumber",value:e.documentNumber});const a=new c(e);this.demoData[s]=a,this.demoData[o]=a.arrayFields,localStorage.setItem(s,JSON.stringify(e)),localStorage.setItem(o,JSON.stringify(this.demoData[o]))}setDemoLiveness(e){this.demoData.liveness=e,this.demoData.liveness.result.liveness_score=parseInt(""+100*this.demoData.liveness.result.liveness_score),this.demoData.liveness.result.min_score=parseInt(""+100*this.demoData.liveness.result.min_score),this.demoData.livenessResult=[];for(const s in e.result)this.demoData.livenessResult.push({key:s,value:e.result[s]});localStorage.setItem("livenessId",e._id),localStorage.setItem("liveness",JSON.stringify(e)),localStorage.setItem("livenessResult",JSON.stringify(this.demoData.livenessResult))}setDemoCompare(e){this.demoData.comparison=e,this.demoData.comparison.result.score=parseInt(""+100*this.demoData.comparison.result.score);for(const s in e.result)this.demoData.comparisonResult.push({key:s,value:e.result[s]});localStorage.setItem("comparisonId",e._id),localStorage.setItem("comparison",JSON.stringify(e)),localStorage.setItem("comparisonResult",JSON.stringify(this.demoData.comparisonResult))}moveToStep(e){e>this.navigation.lastStep||e<=0||(this.navigation.currentStep=e,localStorage.setItem("step",`${e}`))}restart(){this.cleanVariables(),this.navigation.currentStep=1,localStorage.setItem("step",`${this.navigation.currentStep}`)}getDeviceDetails(){if(this.demoData.generalInformation.length)return;const e={userAgent:navigator.userAgent,platform:navigator.platform,appName:navigator.appName,appVersion:navigator.appVersion,language:navigator.language,onLine:navigator.onLine,cookiesEnabled:navigator.cookieEnabled,doNotTrack:navigator.doNotTrack,screenResolution:`${screen.width} x ${screen.height}`,screenAvailableResolution:`${screen.availWidth} x ${screen.availHeight}`,colorDepth:screen.colorDepth,pixelDepth:screen.pixelDepth,innerWidth:window.innerWidth,innerHeight:window.innerHeight,outerWidth:window.outerWidth,outerHeight:window.outerHeight,touchSupported:"ontouchstart"in window,geolocationSupported:"geolocation"in navigator,onlineStatus:navigator.onLine?"Online":"Offline"};return this.demoData.generalInformation.push({key:"device",value:e.platform},{key:"language",value:e.language},{key:"userAgent",value:e.userAgent}),this.getLocation(),e}getLocation(){navigator.geolocation?navigator.geolocation.getCurrentPosition(this.showPosition,this.showError):console.log("Geolocation is not supported by this browser.")}showPosition(e){h.demoData.lat=e?.coords.latitude,h.demoData.lng=e?.coords.longitude,localStorage.setItem("lat",h.demoData.lat),localStorage.setItem("lng",h.demoData.lng)}showError(e){switch(e.code){case e.PERMISSION_DENIED:console.info("User denied the request for Geolocation.");break;case e.POSITION_UNAVAILABLE:console.info("Location information is unavailable.");break;case e.TIMEOUT:console.info("The request to get user location timed out.");break;case e.UNKNOWN_ERROR:console.info("An unknown error occurred.")}}reverseGeocodeWithOSM(e,s){return(0,u.Z)(function*(){const o=`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e}&lon=${s}`;try{const i=yield(yield fetch(o)).json();return i&&i.display_name?i:null}catch(a){return console.error("Error during reverse geocoding with OSM:",a),null}})()}getAddress(){var e=this;return(0,u.Z)(function*(){const s=e.demoData.lat||localStorage.getItem("lat"),o=e.demoData.lng||localStorage.getItem("lng");if(!s||!o)return null;if(e.demoData.location.length)return e.demoData.location;let a=localStorage.getItem("location");if(a)return void(e.demoData.location=JSON.parse(a));const i=yield e.reverseGeocodeWithOSM(s,o);if(i){for(const l in i.address)Object.prototype.hasOwnProperty.call(i.address,l)&&e.demoData.location.push({key:l,value:i.address[l]});return localStorage.setItem("location",JSON.stringify(e.demoData.location)),e.demoData.location}})()}getLead(){if(this.lead)return this.lead;const e=localStorage.getItem("lead");return e?(this.lead=new S(JSON.parse(e)),this.lead):null}setLead(e){localStorage.setItem("accessToken",e.token),this.lead=new S(e),localStorage.setItem("lead",JSON.stringify(this.lead))}getSession(){if(this.session)return this.session;const e=localStorage.getItem("session");return e?(this.session=new f(JSON.parse(e)),this.session):null}getBiggestFace(e){let o,s=0;for(const a of e){const i=a.width*a.height;i>s&&(o=a,s=i)}return o}cutFaceIdCard(e,s,o){const a=o.getContext("2d");let i=Math.ceil(2*s.width),l=Math.ceil(2*s.height),m=Math.floor(s.x)-s.width/2,D=Math.floor(s.y)-s.height/2;return i>e.naturalWidth&&(i=e.naturalWidth,l=e.naturalHeight,m=0,D=0),o.height=l,o.width=i,a.drawImage(e,m,D,i,l,0,0,i,l),o.toDataURL("image/jpeg")}setSession(e){this.session=new f(e),localStorage.setItem("session",JSON.stringify(this.session))}requestDocument(e){return this._httpWrapperService.sendRequest("get",`${this.apiUrl}/v2/document-validations/demo/${e}`)}sendDocument(e){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/ocr/scan-demo`,e)}sendSelfie(e){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/face-recognition/liveness/demo`,e)}detectFace(e){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/face-recognition/detect/demo`,e)}compareDocumentWithSelfie(e){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/face-recognition/compare/demo`,e)}createLead(e){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/leads`,e)}createSession(e){return this._httpWrapperService.sendRequest("post",`${this.apiUrl}/v2/liveness-sessions`,{...e})}cleanVariables(){const e=["documentId","pro","studio","prompt","proFields","studioFields","promptFields","extractedData","liveness","livenessId","livenessResult","comparison","comparisonResult","comparisonId","idCard","idCardFaceImage","sessionToken"];for(let s=0;s<e.length;s++){const o=e[s];localStorage.removeItem(o),this.demoData[o]&&(this.demoData[o]=Array.isArray(this.demoData[o])?[]:Object.keys(this.demoData[o])?{}:null)}}generateUniqueId(){const e=window.navigator,s=window.screen;return{hash:this.simpleHash(`${e.userAgent}-${e.language}-${e.platform}-${s.height}x${s.width}`),userAgent:e.userAgent,height:s.height,width:s.width}}simpleHash(e){let s=0;if(0===e.length)return s.toString();for(let o=0;o<e.length;o++)s=(s<<5)-s+e.charCodeAt(o),s&=s;return s.toString()}static#e=this.\u0275fac=function(s){return new(s||n)(p.LFG(N.O),p.LFG(d.Yg))};static#t=this.\u0275prov=p.Yz7({token:n,factory:n.\u0275fac,providedIn:"root"})}return n})()}}]);