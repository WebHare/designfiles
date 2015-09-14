/* generated from Designfiles Public by generate_data_designfles */
require ('wh.net.jsonrpc');
/*! LOAD: wh.net.jsonrpc
!*/

// ADDME: function to gather numeric/string properties (and not functions) and recurse into subobjects

var __logmanager_rpc = null;

function __getLogManagerRPC()
{
  if (__logmanager_rpc !== null)
    return __logmanager_rpc;

  var rpcurl = ;//"http://webhare.kodos.sf.b-lex.com:8000/wh_services/blexplayground_mark/logmanagerrpc";
  __logmanager_rpc = new $wh.JSONRPC({
          url: rpcurl,
          log: true //logrpc
          });
    return __logmanager_rpc;
}

$wh.logWithContext = function(data, contextinfo)
{
  __getLogManagerRPC().request( "log"
                              , [ "test/test" // category... FIXME: actually support this :P
                              , { data: data
                                , title: ("title" in contextinfo) ? contextinfo.title : ""
                                , description: ("description" in contextinfo) ? contextinfo.description : ""
                                } ]
                              , onLogSuccess
                              , onLogFailure
                              );

}

$wh.log = function log(data)
{
  // FIXME: exit if not in debug mode !!!
  // (the RPC doesn't handle RECORD ARRAY (it'll turn in a RECORD), so we pass any data into a 'data' field)
  __getLogManagerRPC().request("log", ["test/test", { data: data } ], onLogSuccess, onLogFailure);
}

function logInfo(data)
{
  __getLogManagerRPC().request("loginfo", ["test/test", { data: data } ], onLogSuccess, onLogFailure);
}

function logWarn(data)
{
  __getLogManagerRPC().request("logwarn", ["test/test", { data: data } ], onLogSuccess, onLogFailure);
}

function logError(data)
{
  __getLogManagerRPC().request("logerror", ["test/test", { data: data } ], onLogSuccess, onLogFailure);
}

function onLogSuccess(result)
{
  console.info(result);
}

function onLogFailure(result)
{
  console.error("Failure");
}


/** @short send information about the used browser and what Mootools and Designfiles think they know about it
*/
function logBrowserInformation()
{
  /*
  navigator.appCodeName    "Mozilla"
  navigator.appName        name of the browser
  navigator.appVersion     version of the browser
  navigator.cookieEnabled
  navigator.language
  navigator.onLine
  navigator.platform       name of the platform
  navigator.product        "Gecko"
  navigator.userAgent      User-Agent header
  navigator.systemLanguage
  */

  // $todd.browser.features

  var nav = window.navigator;

  // FIXME: copy over all properties which aren't of type 'function'

  var browserinfo =
      { "cookiesenabled": nav.cookieEnabled
      , "buildid":        nav.buildID       // Firefox (not available in Chrome and Safari)
      , "language":       nav.language
      //, "mimetypes":      nav.mimeTypes
      , "oscpu":          nav.oscpu         // Firefox only (for example "Intel Mac OS X 10.9")
      , "platform":       nav.platform      // "MacIntel",
      , "useragent":      nav.userAgent

      , datetime:         new Date()

      , versions:
          { mootools_version: window.MooTools ? window.MooTools.version : null
          , mootools_build:   window.MooTools ? window.MooTools.build   : null
          , slick_version:    window.Slick    ? window.Slick.version    : null
            //ADDME: designfiles: window.....
          }

      , browser:
          { name:       Browser.name
          , version:    Browser.version
          , features:   Browser.Features
          , platform:   Browser.Platform
          , plugins:    Browser.Plugins
          , "vendor":   nav.vendor        // "Apple Computer, Inc." (Safari), "Google Inc." (Chrome), "" (Firefox)
          }

      //, "browser":        Browser   // Mootools's Browser object
      , wh_features:    $wh.BrowserFeatures

      };



  //logInfo(browserinfo);
  __getLogManagerRPC().request( "loginfo"
                              , ["test/test"
                                , { data: browserinfo
                                  , tags: ["browser"]
                                  }
                                ]
                              , onLogSuccess
                              , onLogFailure
                              );
}


/** @short send information about the current page
*/
function logDocument()
{
  var pageinfo =
      { url:      window.location.href
      , lang:     $wh.getDocumentLanguage()
      , document: document.documentElement.outerHTML // current state of the document
      , doctype:  document.doctype ? document.doctype.name : "" // HTML document should have a doctype (for example a textfile won't have a doctype)
      , memusage: window.performance ? window.performance.memory : null // jsHeapSizeLimit/totalJSHeapSize/usedJSHeapSize
      , timing:   window.performance ? window.performance.timing : null
      };

  __getLogManagerRPC().request( "loginfo"
                              , ["test/test"
                                , { data: pageinfo
                                  , tags: ["page"]
                                  }
                                ]
                              , onLogSuccess
                              , onLogFailure
                              );
}


function autoLogJSErrors()
{
  // ADDME: implement
  // ADDME: support multi argument syntax
}

function autoLogConsole()
{
  // ADDME: implement

  var orig_consoleLog
    , orig_consoleInfo
    , orig_consoleWarn
    , orig_consoleError;



}

function autoLogToddConsole()
{
  // ADDME: implement
}
