/* generated from Designfiles Public by generate_data_designfles */
/*! iFrame Resizer (iframeSizer.contentWindow.min.js) - v2.8.10 - 2015-06-21
 *  Desc: Include this file in any page being loaded into an iframe
 *        to force the iframe to resize to the content size.
 *  Requires: iframeResizer.min.js on host page.
 *  Copyright: (c) 2015 David J. Bradshaw - dave@bradshaw.net
 *  License: MIT
 */

!function(){"use strict";function a(a,b,c){"addEventListener"in window?a.addEventListener(b,c,!1):"attachEvent"in window&&a.attachEvent("on"+b,c)}function b(a){return aa+"["+ca+"] "+a}function c(a){_&&"object"==typeof window.console&&console.log(b(a))}function d(a){"object"==typeof window.console&&console.warn(b(a))}function e(){c("Initialising iFrame"),f(),i(),h("background",M),h("padding",P),o(),m(),j(),q(),n(),Z=p(),E("init","Init message from host page")}function f(){function a(a){return"true"===a?!0:!1}var b=Y.substr(ba).split(":");ca=b[0],N=void 0!==b[1]?Number(b[1]):N,Q=void 0!==b[2]?a(b[2]):Q,_=void 0!==b[3]?a(b[3]):_,$=void 0!==b[4]?Number(b[4]):$,da=void 0!==b[5]?a(b[5]):da,K=void 0!==b[6]?a(b[6]):K,O=b[7],W=void 0!==b[8]?b[8]:W,M=b[9],P=b[10],ia=void 0!==b[11]?Number(b[11]):ia,Z.enable=void 0!==b[12]?a(b[12]):!1,fa=void 0!==b[13]?b[13]:fa}function g(a,b){return-1!==b.indexOf("-")&&(d("Negative CSS value ignored for "+a),b=""),b}function h(a,b){void 0!==b&&""!==b&&"null"!==b&&(document.body.style[a]=b,c("Body "+a+' set to "'+b+'"'))}function i(){void 0===O&&(O=N+"px"),g("margin",O),h("margin",O)}function j(){document.documentElement.style.height="",document.body.style.height="",c('HTML & body height set to "auto"')}function k(b){function d(c){a(window,c,function(){E(b.eventName,b.eventType)})}b.eventNames&&Array.prototype.map?(b.eventName=b.eventNames[0],b.eventNames.map(d)):d(b.eventName),c("Added event listener: "+b.eventType)}function l(){k({eventType:"Animation Start",eventNames:["animationstart","webkitAnimationStart"]}),k({eventType:"Animation Iteration",eventNames:["animationiteration","webkitAnimationIteration"]}),k({eventType:"Animation End",eventNames:["animationend","webkitAnimationEnd"]}),k({eventType:"Device Orientation Change",eventName:"orientationchange"}),k({eventType:"Transition End",eventNames:["transitionend","webkitTransitionEnd","MSTransitionEnd","oTransitionEnd","otransitionend"]}),k({eventType:"Window Clicked",eventName:"click"}),"child"===fa&&k({eventType:"IFrame Resized",eventName:"resize"})}function m(){V!==W&&(W in ma||(d(W+" is not a valid option for heightCalculationMethod."),W="bodyScroll"),c('Height calculation method set to "'+W+'"'))}function n(){!0===K?(l(),t()):c("Auto Resize disabled")}function o(){var a=document.createElement("div");a.style.clear="both",a.style.display="block",document.body.appendChild(a)}function p(){function b(){return{x:void 0!==window.pageXOffset?window.pageXOffset:document.documentElement.scrollLeft,y:void 0!==window.pageYOffset?window.pageYOffset:document.documentElement.scrollTop}}function e(a){var c=a.getBoundingClientRect(),d=b();return{x:parseInt(c.left,10)+parseInt(d.x,10),y:parseInt(c.top,10)+parseInt(d.y,10)}}function f(a){function b(a){var b=e(a);c("Moving to in page link (#"+d+") at x: "+b.x+" y: "+b.y),I(b.y,b.x,"scrollToOffset")}var d=a.split("#")[1]||"",f=decodeURIComponent(d),g=document.getElementById(f)||document.getElementsByName(f)[0];g?b(g):(c("In page link (#"+d+") not found in iFrame, so sending to parent"),I(0,0,"inPageLink","#"+d))}function g(){""!==location.hash&&"#"!==location.hash&&f(location.href)}function h(){function b(b){function c(a){a.preventDefault(),f(this.getAttribute("href"))}"#"!==b.getAttribute("href")&&a(b,"click",c)}Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'),b)}function i(){a(window,"hashchange",g)}function j(){setTimeout(g,S)}function k(){Array.prototype.forEach&&document.querySelectorAll?(c("Setting up location.hash handlers"),h(),i(),j()):d("In page linking not fully supported in this browser! (See README.md for IE8 workaround)")}return Z.enable?k():c("In page linking not enabled"),{findTarget:f}}function q(){da&&(c("Enable public methods"),window.parentIFrame={close:function(){I(0,0,"close")},getId:function(){return ca},moveToAnchor:function(a){Z.findTarget(a)},reset:function(){H("parentIFrame.reset")},scrollTo:function(a,b){I(b,a,"scrollTo")},scrollToOffset:function(a,b){I(b,a,"scrollToOffset")},sendMessage:function(a,b){I(0,0,"message",JSON.stringify(a),b)},setHeightCalculationMethod:function(a){W=a,m()},setTargetOrigin:function(a){c("Set targetOrigin: "+a),ga=a},size:function(a,b){var c=""+(a?a:"")+(b?","+b:"");F(),E("size","parentIFrame.size("+c+")",a,b)}})}function r(){0!==$&&(c("setInterval: "+$+"ms"),setInterval(function(){E("interval","setInterval: "+$)},Math.abs($)))}function s(b){function d(b){(void 0===b.height||void 0===b.width||0===b.height||0===b.width)&&(c("Attach listerner to "+b.src),a(b,"load",function(){E("imageLoad","Image loaded")}))}b.forEach(function(a){if("attributes"===a.type&&"src"===a.attributeName)d(a.target);else if("childList"===a.type){var b=a.target.querySelectorAll("img");Array.prototype.forEach.call(b,function(a){d(a)})}})}function t(){function a(){var a=document.querySelector("body"),d={attributes:!0,attributeOldValue:!1,characterData:!0,characterDataOldValue:!1,childList:!0,subtree:!0},e=new b(function(a){E("mutationObserver","mutationObserver: "+a[0].target+" "+a[0].type),s(a)});c("Enable MutationObserver"),e.observe(a,d)}var b=window.MutationObserver||window.WebKitMutationObserver;b?0>$?r():a():(d("MutationObserver not supported in this browser!"),r())}function u(){function a(a){function b(a){var b=/^\d+(px)?$/i;if(b.test(a))return parseInt(a,L);var d=c.style.left,e=c.runtimeStyle.left;return c.runtimeStyle.left=c.currentStyle.left,c.style.left=a||0,a=c.style.pixelLeft,c.style.left=d,c.runtimeStyle.left=e,a}var c=document.body,d=0;return"defaultView"in document&&"getComputedStyle"in document.defaultView?(d=document.defaultView.getComputedStyle(c,null),d=null!==d?d[a]:0):d=b(c.currentStyle[a]),parseInt(d,L)}return document.body.offsetHeight+a("marginTop")+a("marginBottom")}function v(){return document.body.scrollHeight}function w(){return document.documentElement.offsetHeight}function x(){return document.documentElement.scrollHeight}function y(){for(var a=document.querySelectorAll("body *"),b=a.length,d=0,e=(new Date).getTime(),f=0;b>f;f++)a[f].getBoundingClientRect().bottom>d&&(d=a[f].getBoundingClientRect().bottom);return e=(new Date).getTime()-e,c("Parsed "+b+" HTML elements"),c("LowestElement bottom position calculated in "+e+"ms"),d}function z(){return[u(),v(),w(),x()]}function A(){return Math.max.apply(null,z())}function B(){return Math.min.apply(null,z())}function C(){return Math.max(u(),y())}function D(){return Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)}function E(a,b,d,e){function f(){a in{reset:1,resetPage:1,init:1}||c("Trigger event: "+b)}function g(){U=n,la=o,I(U,la,a)}function h(){return ja&&a in R}function i(){function a(a,b){var c=Math.abs(a-b)<=ia;return!c}return n=void 0!==d?d:ma[W](),o=void 0!==e?e:D(),a(U,n)||Q&&a(la,o)}function j(){return!(a in{init:1,interval:1,size:1})}function k(){return W in ea}function l(){c("No change in size detected")}function m(){j()&&k()?H(b):a in{interval:1}||(f(),l())}var n,o;h()?c("Trigger event cancelled: "+a):i()||"init"===a?(f(),F(),g()):m()}function F(){ja||(ja=!0,c("Trigger event lock on")),clearTimeout(ka),ka=setTimeout(function(){ja=!1,c("Trigger event lock off"),c("--")},S)}function G(a){U=ma[W](),la=D(),I(U,la,a)}function H(a){var b=W;W=V,c("Reset trigger event: "+a),F(),G("reset"),W=b}function I(a,b,d,e,f){function g(){void 0===f?f=ga:c("Message targetOrigin: "+f)}function h(){var g=a+":"+b,h=ca+":"+g+":"+d+(void 0!==e?":"+e:"");c("Sending message to host page ("+h+")"),ha.postMessage(aa+h,f)}g(),h()}function J(a){function b(){return aa===(""+a.data).substr(0,ba)}function f(){Y=a.data,ha=a.source,e(),T=!1,setTimeout(function(){X=!1},S)}function g(){X?c("Page reset ignored by init"):(c("Page size reset by host page"),G("resetPage"))}function h(){E("resizeParent","Parent window resized")}function i(){return a.data.split("]")[1]}function j(){return"iFrameResize"in window}function k(){return a.data.split(":")[2]in{"true":1,"false":1}}if(b())if(!1===T)switch(i()){case"reset":g();break;case"resize":h();break;default:j()||d("Unexpected message ("+a.data+")")}else k()?f():c('Ignored message of type "'+i()+'". Received before initialization.')}var K=!0,L=10,M="",N=0,O="",P="",Q=!1,R={resize:1,click:1},S=128,T=!0,U=1,V="offset",W=V,X=!0,Y="",Z={},$=32,_=!1,aa="[iFrameSizer]",ba=aa.length,ca="",da=!1,ea={max:1,scroll:1,bodyScroll:1,documentElementScroll:1},fa="child",ga="*",ha=window.parent,ia=0,ja=!1,ka=null,la=1,ma={offset:u,bodyOffset:u,bodyScroll:v,documentElementOffset:w,scroll:x,documentElementScroll:x,max:A,min:B,grow:A,lowestElement:C};a(window,"message",J)}();
//# sourceMappingURL=iframeResizer.contentWindow.map