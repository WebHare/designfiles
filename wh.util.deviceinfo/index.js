/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../frameworks.mootools.more.date');
require ('../wh.net.jsonrpc');
/*! LOAD: frameworks.mootools, frameworks.mootools.more.date, wh.net.jsonrpc
!*/

/* This libraries monitors root.error and reports errors to the webhare notice log
*/

(function($) {

var haveerror = false;
var mayreport = true;

// Determine root object
var root;
if (typeof window != "undefined")
  root = window;
else if (typeof self != "undefined")
  root = self;
else
  root = this;

root.$wh = root.$wh || {};

var saved_onerror;

$wh.isMobile = function()
{
  if(typeof(navigator) == 'undefined')
    return false;

  var totest = navigator.userAgent || navigator.vendor || root.opera;
  // The regual expression was taken from http://detectmobilebrowsers.com/download/javascript
  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(totest)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(totest.substr(0,4));
}

function devMatch(str)
{
  if(typeof(root.navigator) == 'undefined')
    return false;

  return root.navigator.userAgent.toLowerCase().indexOf(str) !== -1;
}

$wh.detectDevice = function()
{
  var out = {};

  if(devMatch('iphone') || devMatch('ipod') || devMatch('ipad'))
  {
    //iOS
    out.os = 'iOS';
    if(devMatch('iphone'))
    {
      out.type = 'phone';
      out.name = 'iPhone';
    }
    else if(devMatch('ipod'))
    {
      out.type = 'other';
      out.name = 'iPod';
    }
    else if(devMatch('ipad'))
    {
      out.type = 'tablet';
      out.name = 'iPad';
    }
  }
  else if(devMatch('android'))
  {
    // Android
    out.os = 'Android';
    out.name = 'Android';
    if(devMatch('mobile'))
      out.type = 'phone';
    else
      out.type = 'tablet';
  }
  else if(devMatch('blackberry') || devMatch('bb10') || devMatch('rim'))
  {
    // Blackberry
    out.os = 'BlackBerry OS';
    out.name = 'BlackBerry';
    if(devMatch('tablet'))
      out.type = 'tablet';
    else
      out.type = 'phone';
  }
  else if(devMatch('windows'))
  {
    // MS Windows
    out.os = 'Windows';
    out.name = 'Windows';
    if(devMatch('phone'))
      out.type = 'phone';
    else if(devMatch('touch') && !devMatch('phone'))
      out.type = 'tablet';
    else
      out.type = 'desktop';
  }
  else if(devMatch('(mobile;') || devMatch('(tablet;') && devMatch('; rv:'))
  {
    // FXOS
    out.os = 'FXOS';
    out.name = 'FXOS';
    if(devMatch('mobile'))
      out.type = 'phone';
    else if(devMatch('tablet'))
      out.type = 'tablet';
    else
      out.type = 'unknown';
  }
  else if(devMatch('meego'))
  {
    // MeeGo
    out.os = "MeeGo";
    out.name = "Nokia MeeGo";
    out.type = "mobile";
  }
  else if(root.cordova && location.protocol === 'file:')
  {
    // Cordova
    out.os = "unknown";
    out.name = "Apache Cordova";
    out.type = "mobile";
  }
  else if(root.process === 'object')
  {
    // nodeWebkit
    out.os = "unknown";
    out.name = "Node.js";
    out.type = "mobile";
  }
  else
  {
    // First, let's see if it's a bloody TV:
    var i, tvString;

    television = [
      "googletv",
      "viera",
      "smarttv",
      "internet.tv",
      "netcast",
      "nettv",
      "appletv",
      "boxee",
      "kylo",
      "roku",
      "dlnadoc",
      "roku",
      "pov_tv",
      "hbbtv",
      "ce-html"
    ];

    i = 0;
    while (i < television.length) {
      if (devMatch(television[i])) {
        out.os = "unknown";
        out.name = "unknown";
        out.type = "television";
      }
      i++;
    }
    if(!out.os || out.os === "unknown")
    {
      out.os = Browser.platform;
    }
    if(!out.name)
      out.name = "unknown";
    if(!out.type)
      out.type = $wh.isMobile()? "mobile" : "desktop";
  }
  return out;
}

$wh.detectActiveJSFrameworks = function()
{
  var out = [];
  if(typeof(root.jQuery) == 'object')
    out.push('jquery');
  if(typeof(root.MooTools) == 'object')
    out.push('mootools');
  if(typeof(utils) == 'object')
    out.push('masonry');
  if(typeof(rangy) == 'object')
    out.push('rangy');
  if(typeof(root.AdobeEdge) == 'object')
    out.push('edge');
  if(typeof(THREE) == 'object')
    out.push('threejs');
  if(typeof(_) == 'object')
    out.push('underscorejs');
  if(typeof(Ti) == 'object')
    out.push('titanium');
  if(typeof(dataLayer) == 'object')
    out.push('googletagmanager');
  if(typeof(ga) == 'object')
    out.push('googleanalytics');
  if(typeof($wh) == 'object')
    out.push('designfiles');
  return out;
}

$wh.determineDollarOwner = function()
{
  if(typeof(root.$) != 'undefined' && root.$.toString().match(/document\.id/i))
    return 'mootools';
  else if(typeof(root.$) != 'undefined' && typeof(root.jQuery) != 'undefined' && root.jQuery === root.$)
    return 'jquery';
  else if(typeof(root.$) == 'undefined')
    return 'none';
  else
    return 'other';
}

$wh.getBrowserCapabilities = function()
{
  var out = {};
  out.features = Browser.Features;
  out.browser = { name : Browser.name };
  out.browser.platform = Browser.platform;
  out.browser.version = Browser.version;
  out.browser.isMobile = $wh.isMobile();
  out.device = $wh.detectDevice();
  out.frameworks = $wh.detectActiveJSFrameworks();
  out.dollarowner = $wh.determineDollarOwner();
  return out;
}

$wh.getDeviceInfo = function()
{
  return  { name:       Browser.name
          , version:    Browser.version
          , features:   Browser.Features
          , platform:   Browser.platform
          , device:     $wh.detectDevice()
          , mobile:     $wh.isMobile()
          , screen:     { height:           (root.screen && root.screen.height) || -1
                        , width:            (root.screen && root.screen.width) || -1
                        , devicepixelratio: (root.screen && root.devicePixelRatio) || -1
                        }
          , window:     { height:           root.innerHeight || root.clientHeight || -1
                        , width:            root.innerWidth || root.clientWidth || -1
                        }
          , frameworks: $wh.detectActiveJSFrameworks()
          , location:   (root.location && root.location.href) || 'unknown'
          , localtime:  (new Date).format('iso8601')
          };
}

})();
