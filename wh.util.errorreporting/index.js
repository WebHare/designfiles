/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.date');
require ('wh.net.jsonrpc');
require ('wh.util.deviceinfo');
/*! LOAD: frameworks.mootools.core, frameworks.mootools.more.date, wh.net.jsonrpc, wh.util.deviceinfo
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

function installHandlers()
{
  // We'll use the onerror handler - the error event doesn't give much extra stuff
  // and won't work in ie<=10 and safari anyways

  saved_onerror = root.onerror;
  root.onerror = handleOnError;
}

function resetMayReport()
{
  mayreport = true;
}

var reported = [];

/** Send an exception
    @param errorobj Error exception
    @param options
    @cell options.altstack Alternative exception text to show when the exception has no stack member
    @cell options.forcesend Always send the exception (no throttling)
    @cell options.extradata Extra data to mix in with the report
    @cell options.serviceuri Alternative serviceuri to use
    @cell options.servicefunction Alternative servicefunction to use
*/
$wh.reportException = function(errorobj, options)
{
  var exception_text = '';
  if (errorobj) // Firefox may throw permission denied on stack property
    try { exception_text = errorobj.stack; } catch (e) {}

  if (!exception_text && options && options.altstack)
    exception_text = options.altstack;

  if (!exception_text)
    try { exception_text = JSON.stringify(errorobj); } catch (e) {}
  if (!exception_text)
    try { exception_text = errorobj.toString(); } catch (e) {}

  // Max 10 reports per page, and no duplicates
  if ((reported.length > 10 || reported.contains(exception_text)) && (!options || !options.forcesend))
    return;

  reported.push(exception_text);

  var data =
      { v:        1
      , browser:  $wh.getDeviceInfo()
      , error:    exception_text
      };

  if (options && options.extradata)
  {
    for (var name in options.extradata)
      if (options.extradata.hasOwnProperty(name))
        data[name] = options.extradata[name];
  }

  if(typeof(root.location) == 'undefined')
    root.location = { href: "http://test1.b-lex.com/" };

  var serviceuri = $wh.resolveToAbsoluteURL(root.location.href, (options && options.serviceuri) || "/wh_services/publisher/designfiles/");
  rpc = new $wh.JSONRPC({ url: serviceuri, timeout: 10000 });
  rpc.request((options && options.servicefunction) || "ReportJavaScriptError", [ data ]);

  console.warn('Reported exception: ', exception_text);
}

function handleOnError(errormsg, url, linenumber, column, errorobj)
{
  if (!mayreport)
  {
    console.log('not reporting exception, first waiting for a click', errormsg);
    return;
  }
  try
  {
    mayreport = false;

    var altstack = 'onerror:' + errormsg;
    if (url)
      altstack += "\nat unknown_function (" + url + ":" + linenumber + ":" + (column || 1) + ")";

    root.$wh.reportException(errorobj, { altstack: altstack });

    if (!haveerror && root.addEventListener)
      root.addEventListener('click', resetMayReport, true);

    haveerror = true;
  }
  catch (e)
  {
    try //IE unspecified errors may refuse to be printed, so be prepared to swallow even this
    {
      console.error('Exception while reporting earlier exception', e);
    }
    catch(e)
    {
      try
      {
        console.error('Exception while reporting about the exception about an earlier exception')
      }
      catch(e)
      {
        /* we give up. console is crashing ? */
      }
    }
  }

  if (saved_onerror)
    saved_onerror.apply(this, arguments);
}

if(!($wh.debug && $wh.debug.ner))
  installHandlers();

})();
