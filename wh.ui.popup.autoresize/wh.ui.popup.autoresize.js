/* generated from Designfiles Public by generate_data_designfles */
/*
WH Framed Content autoresize

This script communicates with the popup (with the iframe) in which our document runs.
The popup can communicate it's wishes and in turn we communicate our size so the popup
can stretch to fit us.

Usage:
  - just include this script in the <head> of your HTML document
  - this script is not dependant on any framework (so it's library agnostic)

Support:
  - supported browsers: IE8+, Firefox 20+,  Safari 5,  Opera 15+,  Chrome, iOS 5
  - should work on:     IE8+, Firefox 3.6+, Safari 4+, Opera 9.5+, Chrome, iOS 3.2

Notes:
  - the code is kept simple by not offering any support for IE<8 and limited support for IE8



FIXME: use JSON for settings
FIXME: remember applied settings and only update if changed

ADDME: seamless
  ADDME: simulate style inheritance into iframe by style injection
  ADDME: support for handling anchor as if the iframe content is seamless (links in iframe opening in the top/parent document)


ADDME: strategies
  - detect document size changes (only in Gecko)
  - Mutation Observer (DOM4) (IE11, FF14, CHR18, SF6, OP15, iOS6)
  - polling
  - IE supports onresize on elements??


USAGE FOR CONTAINING FRAME
- make iframe the max size (while not visible)

*/

if (!window.$wh)
  $wh = {};


/*
"lazy"   -> if "100%" height detected it'll back out and not poll for further changes
"active" -> keep polling for any changes even if they are unlikely to come
*/
var mode = "lazy";


$wh.__framedContent_appliedSettings = null;

// ADDME: resizing in width (requires moving scroll from iframe to container which iOS may not allow)
// ADDME: shrinkwrap by making the <body> display: inline-block;
// ADDME: option to up polling speed to per-frame

// Communicate the size of the document (without scrollbars)
// This would be the size the iframe needs to be to not get any scrollbars
// (unless there's content sizes to 100% + extra via CSS or JS)
$wh.__framedContent_communicateSize = function()
{
  if(window.console)
    console.log("$wh.__framedContent_communicateSize");

  if (!window.parent)
    return;

  if (!window.parent.postMessage)
    return;

  // postMessage is supported by IE8, FF3, CHR, SF4, OP9.5
  // message channel is supported by IE10, (NO FF!), CHR, SF5, OP10.6 (maybe lower)

  var size_x = ""
    , size_y = "";

  //if (document.documentElement.getStyle("height") == "100%")
  if (false)
    size_y = "100%";
  else
  {
    // prefer to use the bounds of <body>, since it should contain the actual content
    // (<html> will have a minimum of the viewport height)


// if <html> has height:100%; and <body> min-height:100%; we want

    if (window.scrollHeight > window.innerHeight)
    {
      if(window.console)
        console.log("A");
      size_y = window.scrollHeight; /* NOTE: this does not include margin */
    }
    else
    {
      if(window.console)
        console.log("B");
      size_y = window.clientHeight; /* FIXME: does not include border */

      //console.info(document.body.getBoundingClientRect().bottom);

      /*
      Using the size of the <body> fails in case:
      - <html> has margin or padding
      - <body> has no position (relative/asbolute) and there's content (footer?) placed below
      */
      size_y = document.body.getBoundingClientRect().bottom + window.scrollY; /* FIXME + margin-bottom on body + padding-bottom on html
    }
    else
    {

      //if (["static","relative"].contains(document.body.getStyle("position")) )
      //  size_y += parseInt(document.documentElement.getStyle("padding-bottom"));

      /*
      var compstyles = window.getComputedStyle(document.body);
      if (compstyles.position == "static" || compstyles.position == "relative")
        size_y += parseInt(compstyles["padding-bottom"]);
      */
    }
  }

  if (size_x != "100%")
    size_x = Math.ceil(size_x);

  if (size_y != "100%")
    size_y = Math.ceil(size_y);

  var messagestr = "-wh-popup:resize:"+size_x+","+size_y;
  if(window.console)
    console.log(messagestr);
  window.parent.postMessage(messagestr, "*");
}

$wh.__framedContent_onDomReady = function()
{
  window.parent.postMessage("-wh-popup:event:domready", "*");
  $wh.__framedContent_communicateSize();
}

$wh.__framedContent_onLoad = function()
{
  window.parent.postMessage("-wh-popup:event:load", "*");
  $wh.__framedContent_communicateSize();
}

$wh.__framedContent_onMessage = function(evt)
{
  // IE<9
  if (!evt)
    evt = window.event;

  if (typeof evt.data != "string")
    return;

  // ignore if it isn't meant for us
  if (evt.data.substr(0, 18) != "-wh-popup-content:")
    return;

  var message = evt.data.substr(18);
  var eventdata = message.split(":");

  switch(eventdata[0]) // command
  {
    case "settings":
      $wh.__framedContent_onApplySettings();
      break;
  }

}
$wh.__framedContent_onApplySettings = function(message)
{
  // apply preffered width
  var sizes = eventdata[1].split(",");
  var size_x = parseInt(sizes[0]);
  var size_y = parseInt(sizes[1]);

  //$wh.__framedContent_appliedSettings =

  /*
  we can use <html> to set our preffered width, because:
  - scrollbars are not an issue because <html> is used for size inheritance but if scrollbar's are used on <html> they always use the viewport size
    (also most browsers have overflow/scrollbars on <body> by default)
  */
  var htmlelem = document.documentElement;

  if (size_x != "")
    html.style.width = size_x;

  if (size_y != "")
    html.style.height = size_y;

  /*
  inline-block so:
  1) we can allowed content  than the preferred width we set on <html> to stretch the <body> (because it's a block)
     and therefore make all non-oversized content also use the extra space
  2) so the content is shrink-wrapped (because it's inline)
  */
  document.body.style.display = "inline-block";
}


$wh.__framesContent_onMozResize = function(evt)
{
  if(window.console)
    console.log(evt.x, evt.y, evt.width, evt.height);

  var messagestr = "-wh-popup:resize:"+evt.width+","+evt.height;
  if(window.console)
    console.log(messagestr);
  window.parent.postMessage(messagestr, "*");
}

$wh.__framedContent_resizepolltimeout = null;
$wh.__framedContent_prev_size = {};

$wh.__framesContent_pollForResize = function(evt)
{
  $wh.__framedContent_communicateSize();
  $wh.__framedContent_resizepolltimeout = setTimeout($wh.__framesContent_pollForResize, 500);
}


// Only fire our code if whe're actually in an iframe,
// else it'll be a waste to incur the overhead of possible polling the DOM and trying post messages
if (window !== top) // or window.self != window.top
{
  if(window.console)
    console.info("wh autoresize script activated.");

  //window.addEvent("domready", __framedContent_onDomReady);
  document.addEventListener("DOMContentLoaded", $wh.__framedContent_onDomReady, false); // IE9, FF, ...
  document.addEventListener("load", $wh.__framedContent_onLoad, false);
  document.addEventListener("message", $wh.__framedContent_onMessage, false);
  //document.addEventListener("resize", $wh.__framedContent_onResize, false); // do we need to listen to resize events?

  if (window.navigator && window.navigator.product == "Gecko")
  {
    // Gecko 1.9.2 / Firefox 3.6
    // detect content resize without polling and the potential to trigger document reflows
    // (it does not fire upon scroll in contridiction to what the MDN documentation says)
    document.addEventListener("MozScrolledAreaChanged", $wh.__framesContent_onMozResize, false);
  }
  //else if (window.requestAnimationFrame) // ADDME !!!
  else
  {
    // resort to polling
    $wh.__framedContent_resizepolltimeout = setTimeout($wh.__framesContent_pollForResize, 500);
  }

  window.parent.postMessage("-wh-popup:hello", "*");
  //MozAfterPaint
}
