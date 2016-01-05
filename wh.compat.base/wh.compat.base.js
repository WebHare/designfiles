/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
/*! LOAD: frameworks.mootools.core
!*/

/* This file is always included when wh.compat.base is requested. It only contains non-browser stuff, like generic object
   extensions. All browser stuff, like Element extensions, is located in base-browser.js */

(function() {

// Fake some browser objects, if we're called within the context of a Titanium module
if (typeof Ti != "undefined")
{
  window = this;
  document = {};
}

if (!window.$wh)
  window.$wh = {};
$wh.debug = {};

$wh.isHTMLElement = function(node)
{
  return node.nodeType == 1 && typeof node.className == "string";
}


String.implement(
{
  /* Return the length of the string in bytes when UTF8-encoded */
  getUTF8Length: function()
  {
    return unescape(encodeURIComponent(this)).length;
  }
  /* encodeAsHTML */
, encodeAsHTML:function()
  {
    return this.split('&').join('&amp;').split('<').join('&lt;');
  }
  /* encodeAsValue */
, encodeAsValue: function()
  {
    return this.split('"').join('&#34;').split("'").join("&#39;");
  }
  /* decodeFromHtml */
, decodeFromHtml: function()
  {
    var str = this.replace(/<br *\/?>/, "\n");
    str = str.replace(/&#(\d+);/g, function(match, dec) { return String.fromCharCode(dec) });
    str = str.replace(/&amp;/g, "&");
    return str.replace(/&lt;/g, "<");
  }
});

Date.implement(
{
  /* Calculate the number of full years between this date and another date (the current date if no other date given). Time of
     day is not taken into consideration. */
  getAge: function(otherDate)
  {
    // If no 'other date' is given, use current date
    otherDate = otherDate || new Date();

    // Calculate the year difference
    var years = otherDate.getFullYear() - this.getFullYear();

    // If the current month is before the birth month or if the current month is the birth month and the current month day is
    // before the birth month day, the last year isn't fully over
    if (otherDate.getMonth() < this.getMonth()
        || (otherDate.getMonth() == this.getMonth() && otherDate.getDate() < this.getDate()))
      --years;

    return years;
  }
})

if(!window.console) //install a fake console to make sure unprotected console.log invocations don't crash IE
  window.console = {};
['assert','clear','count','debug','dir','dirxml','error','exception','group','groupCollapsed','groupEnd'
,'info','log','time','timeEnd','timeStamp','profile','profileEnd','trace','warn'
].each(function(node)
  {
    if(!window.console[node])
      window.console[node] = function() {}
  });
if(!window.console.table)
  window.console.table=function(tab) { console.log(tab); }

/** @short get the index of the first object within the array which contains the specified value (or one of the specified values if an array is passed)
    @param value can be a single value or array of values. if an array was specified, a single matching value within the specified array is enough for an object to match.
*/
Array.prototype.indexByProperty = function(key, value)
{
  var arrlen = this.length;

  if (value instanceof Array)
  {
    for(var idx=0; idx<arrlen; idx++)
    {
      if (value.contains( this[idx][key] ))
        return idx;
    }
  }
  else
  {
    for(var idx=0; idx<arrlen; idx++)
    {
      if(this[idx][key] === value)
        return idx;
    }
  }

  return -1;
}

/** @short get the first object within the array which contains the specified value (or one of the specified values if an array is passed)
    @param value can be a single value or array of values. if an array was specified, a single matching value within the specified array is enough for an object to match.
*/
Array.prototype.getByProperty = function(key, value)
{
  var idx = this.indexByProperty(key,value);
  return idx >= 0 ? this[idx] : null;
}

/** @short return an array with all the objects in which the specified property contains the value (or one of the values in case an array was given as value)
    @param value can be a single value, array of values or a function.
           If an array was specified, a single matching value within the specified array is enough for an object to match.
           If an function was specified ....
*/
Array.prototype.filterByProperty = function(key, value)
{
  var arrlen = this.length;
  var matches = [];

  if (value instanceof Array)
  {
    for(var idx=0; idx<arrlen; idx++)
    {
      if (value.contains( this[idx][key] ))
        matches.push(this[idx]);
    }
  }
  else if (typeof value == "function")
  {
    return this.filter(function(obj, idx)
    {
      return value(obj[key], idx, obj);
    });
  }
  else
  {
    for(var idx=0; idx<arrlen; idx++)
    {
      if(this[idx][key] === value)
        matches.push(this[idx]);
    }
  }

  return matches;
}

/* Returns a function, that, as long as it continues to be invoked, will not
   be triggered. The function will be called after it stops being called for
   N milliseconds. If `immediate` is passed, trigger the function on the
   leading edge, instead of the trailing.
   http://davidwalsh.name/function-debounce
*/
Function.implement({
    debounce: function(wait, immediate) {
    var timeout,
        func = this;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }
});

$wh.Event = new Class(
{ bubbles: true
, cancelable: true
, defaultPrevented: false
, target:null
, type:null

, initEvent:function(type, bubbles, cancelable)
  {
    this.type = type;
    this.bubbles = bubbles;
    this.cancelable = cancelable;
  }
, stopPropagation: function()
  {
    this.bubbles=false;
  }
, preventDefault:function()
  {
    this.defaultPrevented=true;
  }
, stop:function()
  {
    this.preventDefault();
    this.stopPropagation();
  }
});

// http://www.w3.org/TR/ElementTraversal/ wrappers with IE8&9 support
$wh.getFirstElementChild = function(node)
{
  if("firstElementChild" in node)
    return node.firstElementChild;
  var child = node.firstChild;
  while(child && child.nodeType != 1)
    child = child.nextSibling;
  return child;
}
$wh.getLastElementChild = function(node) //IE8&9 don't support this property natively
{
  if("lastElementChild" in node)
    return node.lastElementChild;
  var child = node.lastChild;
  while(child && child.nodeType != 1)
    child = child.previousSibling;
  return child;
}
$wh.getPreviousElementSibling = function(node)
{
  if("previousElementSibling" in node)
    return node.previousElementSibling;
  while(node && node.nodeType != 1)
    node = node.previousSibling;
  return node;
}
$wh.getNextElementSibling = function(node)
{
  if("nextElementSibling" in node)
    return node.nextElementSibling;
  while(node && node.nodeType != 1)
    node = node.nextSibling;
  return node;
}
$wh.getChildElementCount = function(node)
{
  if("childElementCount" in node)
    return node.childElementCount;

  var count=0;
  var child = node.firstChild;
  while(child)
  {
    if(child.nodeType == 1)
      ++count;
    child = child.nextSibling;
  }
  return count;
}
$wh.getActiveElement = function(doc)
{
  try
  {
    //activeElement can reportedly throw on IE9 and _definately_ on IE11
    return doc.id(doc.activeElement);
  }
  catch(e)
  {
    return null;
  }
}

function getTrackNameForElement(el)
{
  if(el.getAttribute)
  {
    //attempt data-whtrack-name && id first
    var name = el.getAttribute('data-whtrack-name');
    if(name)
      return name;
    name = el.getAttribute('id');
    if(name)
      return name;

    //if we have a name, can we combine with a form?
    name = el.getAttribute('name');
    if(name && el.getParent)
    {
      var form = el.getParent('form');
      if(form)
        return getTrackNameForElement(form) + ':' + name;
    }
  }
  return el.nodeName.toLowerCase();
}

var trackcache = [], trackforwardto=null;

$wh.track = function(category, action, label, options)
{
  //wrapper for callbacks
  function once(fptr)
  {
    var invoked=false;
    return function() { if(invoked) return; invoked=true; fptr(); }
  }

  if(typeof label == "number")
    label = ''+label;
  else if(typeof label != "string")
  {
    if(label.ownerDocument) //it's in a doc, probably a html element;
    {
      //the node may override us
      category = label.getAttribute("data-wh-track-category") || category;
      action = label.getAttribute("data-wh-track-action") || action;
      label = label.getAttribute("data-wh-track-label") || getTrackNameForElement(label);
    }
    else
    {
      console.error("Unrecognized label " , label);
      label = 'unrecognized label';
    }
  }

  if(!category || !action)
    throw new Error("Category & action are required fields");
  if(!label)
    label='';

  if(options && options.callback)
  {
    options.callback = once(options.callback);
    options.callback.delay(200); //ensure we invoke it after at most 200ms
  }

  if(trackforwardto)
  {
    trackforwardto(category, action, label, options);
  }
  else
  {
    var callback = options ? options.callback : null;
    if(callback)
      options.callback = null;
    trackcache.push([category,action,label,options]);

    //ADDME: nicer would be to set an event to handle callbacks, and execute them once a tracker has gotten the chance to grab the trackcache..
    if(callback)
      callback();
  }
}
$wh.setDefaultTracker = function(newtracker)
{
  Array.each(trackcache, function(el) { newtracker.apply(null,el) });
  trackcache = [];
  trackforwardto = newtracker;
}

})(); //end function scope guard
require ('frameworks.mootools.core');
/*! LOAD: frameworks.mootools.core
    AFTER: base.js
!*/

(function($) { //mootools wrapper

var ispreview = false;
$wh.BrowserFeatures = null;
$wh.assumecookiepermission = true;
$wh.__transform_venderprefix = '';
$wh.__transform_property = '';
JSON.secure = true; //secure the mootools 1.4 JSON implementation. 1.5 doesn't need this

//enable onmessage
Element.NativeEvents.message = 2;
Element.Events.message = {
        base: 'message',
        condition: function(event) {
                //if(event.type == 'message') {
                if(!event.$message_extended) {
                        event.data = event.event.data;
                        event.source = event.event.source;
                        event.origin = event.event.origin;
                        event.$message_extended = true;
                }
                return true;
        }
};

// MooTools 1.4 doesn't register hashchange as native event
if (!Element.NativeEvents.hashchange)
  Element.NativeEvents.hashchange = 1;

var whconfigel=document.querySelector('script#wh-config');
if(whconfigel)
{
  $wh.config=Object.merge($wh.config||{}, JSON.decode(whconfigel.textContent));
  // Make sure we have obj/site as some sort of object, to prevent crashes on naive 'if ($wh.config.obj.x)' tests'
  if(!$wh.config.obj)
    $wh.config.obj={};
  if(!$wh.config.site)
    $wh.config.site={};
}
else if(!$wh.config) //no $wh.config is no <webdesign>. don't bother with obj & site, but designfiles still rely on $wh.config itself
{
  $wh.config={};
}

function getAndroidVersion(ua)
{
  var ua = ua || navigator.userAgent;
  var match = ua.match(/Android\s([0-9\.]*)/);
  return match ? match[1] : false;
};

function initializeWHBaseBrowser()
{
  $wh.BrowserFeatures =
    { trueopacity:   false
    , pointerevents: false
    , animations:    false

    , android_positionfixedbroken: Browser.platform == "android" && parseInt(getAndroidVersion(),10) <= 3 //pre-4 is apparently buggy with position:fixed & translations
    };

  if(typeof Browser.platform == "undefined") //mootools 1.4
  {
    // Quick fix for MooTools not recognizing IE11, probably fixed in MooTools 1.5
    if (Browser.name === "unknown")
    {
      if (navigator.userAgent.toLowerCase().indexOf('trident/7.0') > -1) {
        Browser.name = 'ie';
        Browser.version = '11';

        Browser[Browser.name] = true;
        Browser[Browser.name + parseInt(Browser.version, 10)] = true;
      }
    }

    Browser.platform = Browser.Platform.name;
  }
  if(typeof Browser.Platform == "undefined") //moo 1.5
  {
    if(! (Browser.name == "ie" && parseInt(Browser.version) >= 11) ) //do not set 'Browser.ie' on IE11, as mootools 1.5 doesn't do that either, not even in compat mode
      Browser[Browser.name] = true;
    Browser[Browser.name + parseInt(Browser.version, 10)] = true;

    Browser.Platform = {};
    Browser.Platform[Browser.platform] = true;
  }

  var element = document.createElement('x');
  element.style.cssText = 'pointer-events:auto;';
  if(element.style.pointerEvents === 'auto')
    $wh.BrowserFeatures.pointerevents = true;

  $wh.BrowserFeatures.trueopacity = typeof element.style.opacity !== "undefined";

  // Parse debug settings
  var debugstr='';
  var urldebugvar = location.href.match(/[\?&#]wh-debug=([^&#?]*)/); //extract wh-debug var
  if(urldebugvar)
    debugstr = decodeURIComponent(urldebugvar[1]).split(',').join('.');
  else
    debugstr = Cookie.read("wh-debug");

  var previewvar = location.href.match(/[\?&#]whs-clock=([^&#?]*)/);
  if(previewvar)
  {
    document.documentElement.addClass("wh-preview");
    ispreview=true;
  }

  if(debugstr)
  {
    Array.each(debugstr.split('.'), function(tok)
    {
      $wh.debug[tok]=true;
    });
  }
  Object.each($wh.debug, function(v,k) { document.documentElement.addClass("wh-debug-" + k) });

  var transforms = {
    computed: ['transformProperty', 'transform', 'WebkitTransform', 'MozTransform', 'msTransform'],
    prefix: ['', '', '-webkit-', '-moz-', '-ms-']
  };
  var testEl = new Element("div");
  transforms.computed.some(function(el, index)
  {
    var test = el in testEl.style;
    if (test)
    {
      $wh.__transform_venderprefix = transforms.prefix[index];
      $wh.__transform_property = transforms.computed[index];
    }
    return test;
  });
  $wh.BrowserFeatures.animations = "webkitAnimation" in testEl.style || "animation" in testEl.style;

  // Initialization code to fix some usual HTML5 issues

  // In IE 7/8, unknown elements are not recognized (i.e. cannot be styled or properly added to the DOM), unless they've been created before (they don't have to be added to the DOM in order to be recognized).
  if(Browser.ie && Browser.version<9)
  {
    var tags = ["abbr","article","aside","audio","canvas","datalist","details","figure","footer","header","hgroup","main","mark","menu","meter","nav","output","progress","section","template","time","video"];
    for (var i=0; i<tags.length; ++i)
      document.createElement(tags[i]);
  }
}

//workaround for first rect( parameter not animating
Fx.CSS.Parsers.Rect={
               parse: function(value){
                      if (value.substr(0,5)=='rect(')
                            return parseFloat(value.substr(5));
                        return false;
               },
               compute: Fx.compute,
               serve: function(value){
                      return 'rect(' + value + 'px';
               }
        };


Element.implement(
{ getSelfOrParent: function(selector)
    {
      return this.match(selector) ? this : this.getParent(selector);
    }
});


// Internet Explorer still uses an old prefixed name for the node.matches() method
// (and just to be nice whe'll also support other old browser.. for now.)
// http://caniuse.com/#feat=matchesselector
if (!Element.prototype.matches)
{
  var ep = Element.prototype;

  if (ep.webkitMatchesSelector) // Chrome <34, SF<7.1, iOS<8
    ep.matches = ep.webkitMatchesSelector;

  if (ep.msMatchesSelector) // IE9/10/11 & Edge
    ep.matches = ep.msMatchesSelector;

  if (ep.mozMatchesSelector) // FF<34
    ep.matches = ep.mozMatchesSelector;
}


// http://www.nixtu.info/2013/06/how-to-upload-canvas-data-to-server.html
$wh.dataURItoBlob = function(dataURI)
{
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var dw = new DataView(ab);
  for(var i = 0; i < byteString.length; i++)
  {
    dw.setUint8(i, byteString.charCodeAt(i));
  }

  // write the ArrayBuffer to a blob, and you're done
  return new Blob([ ab ], { type: mimeString });
}

// canvas.toBlob polyfill
if (window.HTMLCanvasElement && !window.HTMLCanvasElement.prototype.toBlob)
{
  window.HTMLCanvasElement.prototype.toBlob = function(callback, type, quality)
  {
    callback($wh.dataURItoBlob(this.toDataURL(type, quality)));
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  - Auto-redirecting properties to prefixed versions if neccesary
//  - opacity workaround in which totally transparent elements cannot be clicked/touched
//

var old_getstyle1 = Element.prototype.getStyle;
var old_setstyle1 = Element.prototype.setStyle;

Element.implement(
{ getStyle: function(property)
  {
    //console.log('getstyle', retval, Fx.CSS.prototype.parse(retval));
    // rename transform properties to include their prefix if needed for the current browser
    if(["transform","transform-origin"].contains(property))
    {
      if ($wh.__transform_venderprefix != "")
        return old_getstyle1.apply(this, [$wh.__transform_venderprefix + property]);
      else
        return old_getstyle1.apply(this,arguments);
    }

    if(property=='-wh-opacity' || property=='wh-opacity')
    {
       // FIXME: implement this with pointer-events for iOS? (for better performance)
       var opacity = old_getstyle1.apply(this,['opacity']);
       var display = old_getstyle1.apply(this,['display']);
       return display == "none" ? 0 : opacity;
     }

    return old_getstyle1.apply(this,arguments);
  }

, setStyle: function(property, value)
  {
    // rename transform properties to include their prefix if needed for the current browser
    if(["transform","transform-origin"].contains(property))
    {
      if ($wh.__transform_venderprefix != "")
        return old_setstyle1.apply(this, [$wh.__transform_venderprefix + property, value]);
      else
        return old_setstyle1.apply(this,arguments);
    }

    if(property=='-wh-opacity' || property=='wh-opacity' )
    {
      if(parseFloat(value)<=0)
        old_setstyle1.apply(this, ["display","none"]);
      else
        old_setstyle1.apply(this, ["display","block"]);

      return old_setstyle1.apply(this,["opacity",value]);
    }

    // NOTE: the wh.animations.timeline handle these properties itself,
    //       so it won't cause the transform property to be updated for each seperate
    //       wh property.

    if (["wh-left","wh-top","wh-rotate","wh-scale"].contains(property))
    {
      if (!this._wh_pos) // keep these vars in sync with wh.animations.timeline
        this._wh_pos = { changed: false, left: null, top: null, scale: 1, rotate: 0 };

      var wh_pos = this._wh_pos;

      // NOTE: no need to set changed, because we know whe directly handle the change
      switch(property)
      {
        case "wh-left":
            wh_pos.left = value;
            break;

        case "wh-top":
            wh_pos.top = value;
            break;

        case "wh-scale":
            wh_pos.scale = value;
            break;

        case "wh-rotate":
            wh_pos.rotate = value;
            break;
      }

      if ($wh.__transform_property == "")
      {
        if (wh_pos.left)
          this.style.left = this._wh_pos.left;

        if (wh_pos.top)
          this.style.top = this._wh_pos.top;
      }
      else
      {
        var transformstr = "";

        if (Browser.Platform.ios == true) //(use3dtransforms)
          transformstr += " translate3D("+(wh_pos.left ? wh_pos.left : 0)+"px,"+(wh_pos.top ? wh_pos.top : 0)+"px,0)";
        else// if (usetransforms)
          transformstr += " translate("+(wh_pos.left ? wh_pos.left : 0)+"px,"+(wh_pos.top ? wh_pos.top : 0)+"px)";

        if (wh_pos.rotate != 0)
          transformstr += " rotate("+wh_pos.rotate+"deg)";

        if (wh_pos.scale != 1)
          transformstr += " scale("+wh_pos.scale.toFixed(5)+")";

        // NOTE: we cannot pass the transform through Mootool's setStyles
        this.style[$wh.__transform_property] = transformstr;
        //console.log(this, $wh.__transform_property, transformstr);
      }

      return;
    }

    return old_setstyle1.apply(this,arguments);
  }
});


// NOTE: Safari currently doesn't allow input in <input> elements while in fullscreen mode
// keyboard events however still work, although you need to set focus again
// ADDME: also help with fullscreenchange events?
if (!window.requestFullScreen)
{
  Element.implement(
  { requestFullScreen: Element.prototype.webkitRequestFullScreen || Element.prototype.mozRequestFullScreen || Element.prototype.msRequestFullscreen || function() {}
  });
  /*
  { requestFullScreen:
        function()
        {
          if (this.webkitRequestFullScreen)
          {
            this.webkitRequestFullscreen();//this.ALLOW_KEYBOARD_INPUT);
            console.log("okliedoklie");
          }
          else if (this.mozRequestFullScreen)
            this.mozRequestFullScreen();
          else
            this.msRequestFullScreen();
        }
  });
  */

  // cancelFullScreen is implemented only on document (not documented in MDN)
}

if (!document.exitFullscreen)
  document.exitFullScreen = document.webkitCancelFullScreen || document.mozCancelFullScreen || document.msCancelFullScreen || document.exitFullscreen || function() {}

Element.implement(
{ toggleFullScreen: function()
  {
    var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

    // if we aren't in fullscreen or we want to toggle another element to go fullscreen
    // request full screen on that element
    if (fullscreenElement != this)
      this.requestFullScreen();
    else
      document.exitFullScreen();
  }
});


$wh.getIframeDocument = function(iframe)
{
  // if we try to read contentWindow before the iframe has been inserted into a document,
  // IE will throw an 'Unspecified error'
  if (typeof iframe.contentWindow == 'unknown')
    return null;

  // contentDocument is supported by NS6, Firefox, Opera, IE8
  if (iframe.contentDocument)
    return iframe.contentDocument;

  // FF3/SF3.2.1/OP9.64/CHR1 will properly return null (typeof=='object') if not initialized
  if (iframe.contentWindow == null)
    return null;

  //if (iframe.document) // For IE5
  //  return iframe.document;

  // if we have a contentwindow we can safely ask for it's document
  // (IE5.5 and IE6)
  return iframe.contentWindow.document;
};

//we cannot use location.hash safely, as the url http://b-lex.nl/#motoren%25abc will return 'motoren%abc' on FF, and 'motoren%25abc' on Chrome
$wh.getCurrentHash = function()
{
  var hashidx = location.href.indexOf('#');
  if(hashidx==-1)
    return '';
  return decodeURIComponent(location.href.substr(hashidx+1));
}

/*globals HTMLSelectElement*/
/**
* @requires polyfill: Array.from {@link https://gist.github.com/4212262}
* @requires polyfill: Array.prototype.filter {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter}
* @requires polyfill: Object.defineProperty {@link https://github.com/eligrey/Xccessors}
* @license MIT, GPL, do whatever you want
*/
  if(!new Element("select").selectedOptions)
  {
    function PseudoHTMLCollection(arr)
    {
      var i, arrl;
      for (i = 0, arrl = arr.length; i < arrl; i++)
          this[i] = arr[i];

        try {
            Object.defineProperty(this, 'length', {
                get: function () {
                    return arr.length;
                }
            });
        }
        catch (e) { // IE does not support accessors on non-DOM objects, so we can't handle dynamic (array-like index) addition to the collection
            this.length = arr.length;
        }
        if (Object.freeze) { // Not present in IE, so don't rely on security aspects
            Object.freeze(this);
        }
    }

    PseudoHTMLCollection.prototype = {
        constructor: PseudoHTMLCollection,
        item: function (i) {
            return this[i] !== undefined && this[i] !== null ? this[i] : null;
        },
        namedItem: function (name) {
            var i, thisl;
            for (i = 0, thisl = this.length; i < thisl; i++) {
                if (this[i].id === name || this[i].name === name) {
                    return this[i];
                }
            }
            return null;
        }
    };

    Object.defineProperty(HTMLSelectElement.prototype, 'selectedOptions', {get: function () {
        return new PseudoHTMLCollection(Array.from(this.options).filter(function (option) {
            return option.selected;
        }));
    }});
  }

  /*
  original from http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
  Fixed by B-Lex

  Native support in:
  - Chrome 17
  - IE 10
  - FF 4 (incomplete, -moz)
  - FF 11 (-moz)
  - Safari unknown when support (supported in Webkit nightlies)
  - Opera 15

  Without prefix in
  - IE 10
  - FF 23
  - CHR 24
  - SF 6.1 / iOS 7
  - OP 15
  */
  var reqanim_prefix;
  var reqanim_currentframe = 0;

  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];

  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x)
  {
    if (typeof( window[vendors[x]+'RequestAnimationFrame'] ) != "function")
      continue;

    reqanim_prefix = vendors[x];

    // Firefox 4+ has supported for mozRequestAnimationFrame, but didn't return requestId before Firefox 11
    window.requestAnimationFrame =
      function(callback) // 2nd argument is only supported by Webkit(SF/CHR)
      {
        var requestId = window[reqanim_prefix+'RequestAnimationFrame'](callback);

        if (typeof requestId == "undefined") // FIX for FF4 up to FF10
        {
          reqanim_currentframe++;
          requestId = reqanim_currentframe;
        }

        return requestId;
      }

      window.cancelAnimationFrame =
        window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
  {
    var anim_fallback_wait = 1000/60 // if the browser doesn't support animationframes, use this as wait

    window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 1000/60 - (currTime - lastTime));  //100/60 = frame
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
  }

  if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) {
          clearTimeout(id);
      };




  $(window).addEvent("load", function() { if ($wh.assumecookiepermission) $(document).fireEvent("cookiespermitted"); });

  /// Safari seems to immediately repeat keydown events when pressing Esc, so we'll cancel subsequent keydown events
  /// WebKit bug report: https://bugs.webkit.org/show_bug.cgi?id=78206
  if (Browser.safari)
  {
    (function()
    {
      // Should keydown events be cancelled? (We'll allow repeating events after repeatTimeout)
      var startCancelling = true;
      // Are keydown events being cancelled?
      var cancelEvents = false;
      // Keyboard repeat timeout
      var repeatTimeout = 500;

      window.addEventListener("keydown", function(event)
      {
        // Check if esc is pressed without modifier keys
        if (event.keyCode == 27 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey)
        {
          if (cancelEvents)
          {
            // Cancel this event
            event.stopPropagation();
            event.preventDefault();
          }
          else if (startCancelling)
          {
            // Start cancelling events
            startCancelling = false;
            cancelEvents = true;
            // Stop cancelling events after repeatTimeout
            setTimeout(function()
            {
              cancelEvents = false;
            }, repeatTimeout);
          }
        }
      }, true);
      window.addEventListener("keyup", function(event)
      {
        // Check if esc is pressed without modifier keys
        if (event.keyCode == 27)
        {
          // Stop cancelling events; they may be cancelled upon next esc keydown
          startCancelling = true;
          cancelEvents = false;
        }
      }, true);
    })();
  }

//Fire a layout change event
$wh.fireLayoutChangeEvent = function(node, direction)
{
  node=$(node);

  // FIXME: is there still code listening to these legacy classes??
  if($wh.legacyclasses !== false)
  {
    node.getParents('.-wh-layoutlistener').fireEvent("-wh-layoutchange", { target:node, direction:'up' });
    if(node.hasClass('-wh-layoutlistener'))
      node.fireEvent("-wh-layoutchange", { target:node, direction:'self' });
    node.getElements(".-wh-layoutlistener").fireEvent("-wh-layoutchange", { target:node, direction:'down' });
  }

  var up = !direction || direction == "up";
  var down = !direction || direction == "down";
  //  console.log( up ? "UP":"", down ? "DOWN":"", node);
  //console.trace();

  //console.log("LayoutChange " + (up?"UP":"") + " " + (down?"DOWN":"") + " from", node);

  if (up)
    node.getParents(".wh-layoutlistener").fireEvent("wh-layoutchange", { target: node, direction: "up" });

  if(node.hasClass("wh-layoutlistener"))
    node.fireEvent("wh-layoutchange", { target: node, direction:'self' });

  if (down)
    node.getElements(".wh-layoutlistener").fireEvent("wh-layoutchange", { target: node, direction: "down" });

  window.fireEvent("wh-layoutchange", { target: node, direction: "down" })
}

$wh.getJSONAttribute = function(node, attrname)
{
  var data = node.getAttribute(attrname) || 'null';
  if (data.substr(0,1) == '@')
  {
    // This is a reference to a variable in window.
    // It is meant for reuse of settings (for example for RTE or slideshow settings)
    var path = data.substr(1).split('.');
    path.unshift(window);
    var curr = window;

    for (var i = 1; i < path.length; ++i)
    {
      var pathelt = path[i];
      var sub = curr[pathelt];
      if (typeof sub == "undefined")
        throw Error("Cannot find variable '" + pathelt + "' in '" + path.slice(0,i).join(',') + "' when looking up '" + data + "'");
      curr = sub;
    }
    data = curr;
  }
  else
    data = JSON.decode(data);

  return data;
}

$wh.getJSAssetPath = function(scriptname)
{
  var url;
  var script = $("wh-designfiles-combined-js");
  if (script)
    url = script.getAttribute("src");

  if (!url)
  {
    var playerscript = $$('script[src*="/' + scriptname + '"]').pick();
    if (playerscript)
      url = playerscript.getAttribute("src");
  }
  if(url)
  {
    var urlparts = url.split('?')[0].split('/');
    return urlparts.slice(0,urlparts.length-1).join('/')+'/';
  }
  return null;
}

function generateForm(action, values, method)
{
  var form = new Element("form", { action: action, method: method || "POST", charset: "utf-8" });
  if(values instanceof Array)
  {
    Array.each(values, function(item)
    {
      form.adopt(new Element("input", { type: "hidden", name: item.name, value: item.value }));
    });
  }
  else Object.each(values, function(value, name)
  {
    form.adopt(new Element("input", { type: "hidden", name: name, value: value }));
  });
  return form;
}

$wh.submitForm = function(action, values, method)
{
  var form = generateForm(action, values, method);
  $(document.body).adopt(form);
  form.submit();
}

/** get elements matching a selector, matching them from the documentNode (getElement only applies to subelements. use this if you want '#xx span' to match nodes if you start the search at #xx)
    @param node: if null, match from top. if Element, iterate element and children. if rangestart/rangelimit are set, walk through that range, excluding rangelimit
*/
$wh.getTopMatchedElements = function(node, selector)
{
  function getSelfAndElements(node,selector)
  {
    // NOTE: we convert the static nodelist to a MooTools element list
    var retval = $$( node.querySelectorAll(selector) );
    if (node.matches(selector))
      retval.include( node );

    return retval;
  }

  var elements=[];
  if(!node)
  {
    // if no start/root node is specified, get all elements within the document which match the selector
    elements = document.querySelectorAll(selector);
  }
  else if($wh.isHTMLElement(node))
  {
    elements = getSelfAndElements($(node), selector);
  }
  else if(node.rangestart)
  {
    for(var testnode = node.rangestart;testnode&&testnode!=node.rangelimit;testnode=testnode.nextSibling)
      if($wh.isHTMLElement(testnode))
        elements.append( getSelfAndElements($(testnode), selector));
  }
  else if(node.firstChild) //document fragment
  {
    for(node = node.firstChild;node;node=node.nextSibling)
      if(node.getElements)
        elements.append(getSelfAndElements(node));
  }
  return elements;
}

//Hook fireEvent so we can integrate our 'wh-after-domready ' '
var saveFireEvent = window.fireEvent;
window.fireEvent = function(type, args, delay)
{
  saveFireEvent.apply(this, [type, args, delay]);
  if(type=="domready" || type=="load")
    saveFireEvent.apply(this, ["wh-after-" + type, args, delay]);
  return this;
}

/// Chain a function after the DOMEvent constructor
var domextends = null;
$wh.extendDOMEventConstructor = function(func)
{
 if (!domextends)
  {
    domextends = [];

    // Replace the DOMEvent type by our own implementation - copy prototype & keys over from the old DOMEvent
    var oldDOMEvent = DOMEvent;
    DOMEvent = new Type('DOMEvent', function()
    {
      oldDOMEvent.apply(this, arguments);
      for (var i = 0; i < domextends.length; ++i)
        domextends[i].apply(this, arguments);
    });
    DOMEvent.prototype = oldDOMEvent.prototype;
    Object.keys(oldDOMEvent).each(function(key, value){ DOMEvent[key] = value; });
  }

  domextends.push(func);
}

$wh.getDocumentLanguage = function()
{
  var htmlnode = document.documentElement;
  return htmlnode ? htmlnode.getAttribute('lang') || htmlnode.getAttribute('xml:lang') || 'en' : 'en';
}

//overhead calculations
$wh.getHorizontalOverhead = function(node)
{
  if (typeof window["getComputedStyle"] == "function")
  {
    var style = getComputedStyle(node, null);
    return (style.getPropertyValue("padding-left").toInt() || 0)
           + (style.getPropertyValue("padding-right").toInt() || 0)
           + (style.getPropertyValue("border-left-width").toInt() || 0)
           + (style.getPropertyValue("border-right-width").toInt() || 0);
  }
  else if (node["currentStyle"])
  {
    var style = node.currentStyle;
    return (style.paddingLeft.toInt() || 0)
           + (style.paddingRight.toInt() || 0)
           + (style.borderLeftWidth.toInt() || 0)
           + (style.borderRightWidth.toInt() || 0);
  }
  return 0;
}
$wh.getVerticalOverhead = function(node)
{
  if (typeof window["getComputedStyle"] == "function")
  {
    var style = getComputedStyle(node, null);
    return (style.getPropertyValue("padding-top").toInt() || 0)
           + (style.getPropertyValue("padding-bottom").toInt() || 0)
           + (style.getPropertyValue("border-top-width").toInt() || 0)
           + (style.getPropertyValue("border-bottom-width").toInt() || 0);
  }
  else if (node["currentStyle"])
  {
    var style = node.currentStyle;
    return (style.paddingTop.toInt() || 0)
           + (style.paddingBottom.toInt() || 0)
           + (style.borderTopWidth.toInt() || 0)
           + (style.borderBottomWidth.toInt() || 0);
  }
  return 0;
}

// get the information needed to properly stretch an image
// (to fully cover (fit or fill) the available space (outwidth/outheight) with the original size (inwidth/inheight) while keeping the aspect ratio)
$wh.getCoverCoordinates = function(inwidth, inheight, outwidth, outheight, fit)
{
  var infx = !(outwidth > 0);
  var infy = !(outheight > 0);
  var dx = infx ? 0 : inwidth / outwidth;
  var dy = infy ? 0 : inheight / outheight;
  var scale;
  if(infx)
    scale=dy;
  else if(infy)
    scale=dx;
  else if(fit)
    scale = Math.max(dx,dy);
  else
    scale = Math.min(dx,dy);

  return { width: inwidth/scale
         , height: inheight/scale
         , top: (outheight - (inheight/scale))/2
         , left: (outwidth - (inwidth/scale))/2
         };
}

$wh.dispatchDomEvent=function(element, eventtype, options)
{
  if(!options)
    options={};
  if(!("cancelable" in options)) //you generally need to think about these two...
    console.error("You should set 'cancelable' to true or false in a $wh.dispatchDomEvent call");
  if(!("bubbles" in options))
    console.error("You should set 'bubbles' to true or false in a $wh.dispatchDomEvent call");

  //Firefox Bugzilla #329509 - Do not prevent event dispatching even if there is no prescontext or (form) element is disabled
  //we'll just normalize around Firefox' behaviour - IE might do it too?
  if(element.disabled)
    return true;

  var evt = element.ownerDocument.createEvent(eventtype == "click" ? "MouseEvents" : "HTMLEvents");
  evt.initEvent(eventtype, options.bubbles, options.cancelable);

  if(options.detail)
    evt.detail = options.detail;

  if(eventtype=='click' && window.IScroll)
    evt._constructed = true; //ensure IScroll doesn't blindly cancel our synthetic clicks

  var result = element.dispatchEvent(evt);
  return result;
}

//manually fire 'onchange' events. needed for event simulation and some IE<=8 modernizations
$wh.fireHTMLEvent=function(element, type)
{
  //http://stackoverflow.com/questions/2856513/trigger-onchange-event-manually
  return $wh.dispatchDomEvent(element, type, { bubbles: ["input","change","click"].contains(type), cancelable: true});
}
$wh.setTextWithLinefeeds = function(node, message)
{
  Array.each(message.split("\n"), function(line,idx)
  {
    if(idx==0)
      node.set("text",line);
    else
      node.adopt(new Element("br")).appendText(line);
  });
}

//A DOM4 customevent. http://www.w3.org/TR/dom/#interface-customevent
$wh.CustomEvent = new Class(
{ Extends: $wh.Event
, initialize:function(type, eventInitDict)
  {
    this.bubbles = eventInitDict && eventInitDict.bubbles;
    this.cancelable = eventInitDict && eventInitDict.cancelable;
    this.detail = (eventInitDict ? eventInitDict.detail : null) || null;
    this.type = type;
  }
});

$wh.dispatchEvent = function(node, event)
{
  if(!node)
    throw new Error("null node passed to dispatchEvent");

  event.target = node;

  //one day, we should match this algorithm exactly: http://www.w3.org/TR/dom/#dispatching-events
  var mywindow = node.ownerDocument.defaultView;
  var nodetree = [node];
  while(node.parentNode)
  {
    node = node.parentNode;
    nodetree.unshift(node);
  }
  if(mywindow)
    nodetree.unshift(mywindow);

  //ADDME capture phase? but only if the event was declared as native though - addEvent cannot officially capture such events anyway.

  //bubble!
  for(var treepos=nodetree.length-1;treepos >= 0;--treepos)
  {
    node = $(nodetree[treepos]);
    if(!node.fireEvent)
      continue;
    node.fireEvent(event.type, event);
    if(!event.bubbles) //stop looping once bubble is broken
      break;
  }
  return !event.defaultPrevented;
}

/** Change the value of a form element, and fire the correct events as if it were a user change
    @param element Element to change
    @param newvalue New value
    @param norecursecheck Optional. if true, disable recursive change checking */
$wh.changeValue = function(element, newvalue, norecursecheck)
{
  if(element instanceof Array || element instanceof Elements)
  {
    Array.each(element, function(node) { $wh.changeValue(node, newvalue) });
    return;
  }

  element=$(element);

  if(element.nodeName=='INPUT' && ['radio','checkbox'].contains(element.type))
  {
    if(!!element.checked == !!newvalue)
      return;
    element.checked=!!newvalue;
  }
  else
  {
    if(element.value == newvalue)
      return;

    element.value = newvalue;

  }

  if(!norecursecheck && $wh.changeValue.changelist.contains(element))
  {
    console.error("Changing element ",element,"to",newvalue," while its onchange is firing");
    throw new Error("$wh.changeValue detected recursion on element");
  }

  try
  {
    if(!norecursecheck)
      $wh.changeValue.changelist.push(element);

    $wh.fireHTMLEvent(element,"input");
    $wh.fireHTMLEvent(element,"change");
  }
  finally
  {
    if(!norecursecheck)
      $wh.changeValue.changelist.erase(element);
  }
}
$wh.changeValue.changelist = [];


/// Always set the cancelBubble flag, so we can detect that stopPropagation was called
var stopPropagation = DOMEvent.prototype.stopPropagation;
DOMEvent.prototype.stopPropagation = function()
{
  stopPropagation.call(this);
  if (this.event.stopPropagation)
    this.event.cancelBubble = true;
  return this;
};

initializeWHBaseBrowser();

function runCompat()
{
  //Firefox redisables buttons that were disabled at refresh, even if they're not disabled in the HTML
  if (Browser.name == "firefox")
    $$('button:disabled').set('disabled',null);
  if($wh.debug.dev || location.pathname == "/tollium_todd.res/blex_alpha/publish.shtml")
  {
    (document.head || document.body || document.documentElement).adopt(new Element("script", {"src": "/.publisher/devbar/devbar.js"}))
                                                                .adopt(new Element("link", {"href": "/.publisher/devbar/devbar.css", "rel":"stylesheet"}));
  }
}

$wh.isPreview = function()
{
  return ispreview;
}
$wh.navigateTo = function(newurl,options)
{
  var debugtype = options ? options.debugtype : null;
  if(!debugtype && $wh.debug.rdr)
    debugtype = 'rdr';
  if(debugtype)
  {
    //ADDME check if we're still in rendering stage, ie when document.write would have no overwriting effect. or can we force overwrite using document open/close ?
    document.write('<body>[' + debugtype.encodeAsHTML() + '] Must redirect to: <a href="' + newurl.encodeAsValue() + '" id="redirectto">' + newurl.encodeAsHTML() + '</a></body>');
    return;
  }
  location.href = newurl;
}

$wh.executeSubmitInstruction = function(instr, options)
{
  if(!instr)
    throw Error("Unknown instruction received");

  options = options || {};

  if (!options.nobusylock && instr.type != "postmessage")
  {
    if ($wh.createBusyLock)
      $wh.createBusyLock('reload');
  }

  if (options.iframe)
  {
    switch (instr.type)
    {
      case "redirect":
      {
        options.iframe.src = instr.url;
      } break;

      case "form":
      {
        // FIXME: Clear iframe if document is not cross-domain accessible
        var idoc = options.iframe.document || options.iframe.contentDocument || options.iframe.contentWindow.document;

        var form = generateForm(instr.form.action, instr.form.vars, instr.method);
        var adopted_form = idoc.adoptNode(form);
        idoc.body.appendChild(adopted_form);
        adopted_form.submit();
      } break;

      default:
      {
        throw Error("Unknown submit instruction '" + instr.type + "' for iframe received");
      }
    }
    return;
  }

  switch (instr.type)
  {
    case "redirect":
    {
      $wh.navigateTo(instr.url, { debugtype: options.debugtype });
    } break;

    case "form":
    {
      $wh.submitForm(instr.form.action, instr.form.vars, instr.form.method);
    } break;

    case "refresh":
    case "reload":
    {
      window.location.reload();
    } break;

    case "postmessage":
    {
      parent.postMessage(instr.message, "*");
    } break;

    default:
    {
      throw Error("Unknown submit instruction '" + instr.type + "' received");
    }
  }
}

function isInDocument(node)
{
  while (node)
  {
    if (node.nodeType == 9)
      return true;
    node = node.parentNode;
  }
}

/** Signal that a node and its subnodes are about to be removed from the DOM
    @param node Node that has just been removed
*/
$wh.fireRemovingFromDOMEvent = function(node)
{
  node = $(node);
  if (!isInDocument(node))
    return;

  if (node.hasClass("wh-domevents"))
    node.fireEvent("wh-dom-removing");

  node.getElements(".wh-domevents").fireEvent("wh-dom-removing");
}

/** Signal that a node and its subnodes have just been added to the DOM
    @param node Node that has just been added
*/
$wh.fireAddedToDOMEvent = function(node)
{
  node = $(node);
  if (!isInDocument(node))
    return;

  if (node.hasClass("wh-domevents"))
    node.fireEvent("wh-dom-added");

  node.getElements(".wh-domevents").fireEvent("wh-dom-added");
}

/** Enable saving the scroll state over DOM-removals. Requires correct calls to $wh.fireRemovingFromDOMEvent
    and $wh.fireAddedToDOMEvent
    @param node Scrolled node
*/
$wh.autoSaveScrollState = function(node)
{
  node.addClass("wh-domevents");
  node.addEvent("wh-dom-removing", function(e)
  {
    node.store("wh-scrollstate", { scrollTop: node.scrollTop, scrollLeft: node.scrollLeft });
  });
  node.addEvent("wh-dom-added", function(e)
  {
    var domstate = node.retrieve("wh-scrollstate");
    if (domstate)
    {
      node.scrollTop = domstate.scrollTop;
      node.scrollLeft = domstate.scrollLeft;
      node.store("wh-scrollstate", null);
    }
  });
}

$wh.renderConsoleLog = function(logentries)
{
  Array.each(logentries, function(logentry)
  {
    console.log(logentry.text + " (" + logentry.caller + ")");
  });
}

window.addEvent("domready", runCompat);

})(document.id); //end mootools wrapper
