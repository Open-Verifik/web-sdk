!function(){"use strict";var e,r={},t={};function n(e){var o=t[e];if(void 0!==o)return o.exports;var i=t[e]={id:e,loaded:!1,exports:{}};return r[e].call(i.exports,i,i.exports,n),i.loaded=!0,i.exports}n.m=r,e=[],n.O=function(r,t,o,i){if(!t){var u=1/0;for(d=0;d<e.length;d++){t=e[d][0],o=e[d][1],i=e[d][2];for(var a=!0,c=0;c<t.length;c++)(!1&i||u>=i)&&Object.keys(n.O).every(function(e){return n.O[e](t[c])})?t.splice(c--,1):(a=!1,i<u&&(u=i));if(a){e.splice(d--,1);var f=o();void 0!==f&&(r=f)}}return r}i=i||0;for(var d=e.length;d>0&&e[d-1][2]>i;d--)e[d]=e[d-1];e[d]=[t,o,i]},n.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(r,{a:r}),r},n.d=function(e,r){for(var t in r)n.o(r,t)&&!n.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:r[t]})},n.f={},n.e=function(e){return Promise.all(Object.keys(n.f).reduce(function(r,t){return n.f[t](e,r),r},[]))},n.u=function(e){return(592===e?"common":e)+"-es2017."+{263:"372a4a3f8fef349e09e2",551:"90a3d53960fcb3af02e3",592:"279a32788f8fcbed1bc8",629:"7822ecdb327a16623126",651:"0af0fbb5e832725bb98e",846:"e4b208e70c2eb17b4a61"}[e]+".js"},n.miniCssF=function(e){return"styles.affc3465c7efe93635aa.css"},n.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},function(){var e={},r="verifik-sdk-app:";n.l=function(t,o,i,u){if(e[t])e[t].push(o);else{var a,c;if(void 0!==i)for(var f=document.getElementsByTagName("script"),d=0;d<f.length;d++){var l=f[d];if(l.getAttribute("src")==t||l.getAttribute("data-webpack")==r+i){a=l;break}}a||(c=!0,(a=document.createElement("script")).charset="utf-8",a.timeout=120,n.nc&&a.setAttribute("nonce",n.nc),a.setAttribute("data-webpack",r+i),a.src=n.tu(t)),e[t]=[o];var s=function(r,n){a.onerror=a.onload=null,clearTimeout(p);var o=e[t];if(delete e[t],a.parentNode&&a.parentNode.removeChild(a),o&&o.forEach(function(e){return e(n)}),r)return r(n)},p=setTimeout(s.bind(null,void 0,{type:"timeout",target:a}),12e4);a.onerror=s.bind(null,a.onerror),a.onload=s.bind(null,a.onload),c&&document.head.appendChild(a)}}}(),n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.nmd=function(e){return e.paths=[],e.children||(e.children=[]),e},function(){var e;n.tu=function(r){return void 0===e&&(e={createScriptURL:function(e){return e}},"undefined"!=typeof trustedTypes&&trustedTypes.createPolicy&&(e=trustedTypes.createPolicy("angular#bundler",e))),e.createScriptURL(r)}}(),n.p="",function(){var e={666:0};n.f.j=function(r,t){var o=n.o(e,r)?e[r]:void 0;if(0!==o)if(o)t.push(o[2]);else if(666!=r){var i=new Promise(function(t,n){o=e[r]=[t,n]});t.push(o[2]=i);var u=n.p+n.u(r),a=new Error;n.l(u,function(t){if(n.o(e,r)&&(0!==(o=e[r])&&(e[r]=void 0),o)){var i=t&&("load"===t.type?"missing":t.type),u=t&&t.target&&t.target.src;a.message="Loading chunk "+r+" failed.\n("+i+": "+u+")",a.name="ChunkLoadError",a.type=i,a.request=u,o[1](a)}},"chunk-"+r,r)}else e[r]=0},n.O.j=function(r){return 0===e[r]};var r=function(r,t){var o,i,u=t[0],a=t[1],c=t[2],f=0;for(o in a)n.o(a,o)&&(n.m[o]=a[o]);if(c)var d=c(n);for(r&&r(t);f<u.length;f++)n.o(e,i=u[f])&&e[i]&&e[i][0](),e[u[f]]=0;return n.O(d)},t=self.webpackChunkverifik_sdk_app=self.webpackChunkverifik_sdk_app||[];t.forEach(r.bind(null,0)),t.push=r.bind(null,t.push.bind(t))}()}();