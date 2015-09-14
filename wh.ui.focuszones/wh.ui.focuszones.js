/* generated from Designfiles Public by generate_data_designfles */
require ('wh.ui.base');
/*! LOAD: wh.ui.base
!*/

/* Sending focus into a wh-focuszone (using either $wh.focus or the mouse)
   - makes all focusable components outside the focuszone unfocusable
*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

var zonehistory = [];
var currentfocuszone = null;
var lastfocused;
var uibasefocus = $wh.focus;
var debuglog = false;
var receivingfocuszone = null;

function getElFocusZone(el)
{
  // Ignore forcusing of body
  if (!el)
    return null;

//  console.error('getElFocusZone ', el == document.body, currentfocuszone, currentfocuszone && $wh.getFocusableComponents(currentfocuszone).length);

  // IE focuses the body when we have a currentfocuszone without focusable elements
  if (el == document.documentElement || el == document.body)
  {
    if (currentfocuszone && !$wh.getFocusableComponents(currentfocuszone).length)
      return currentfocuszone;
  }

  var el = el.getParent(".wh-focuszone") || null;

  // Ignore focus zones declarations on html and body nodes
  if (el == document.documentElement || el == document.body)
    return null;

  return el;
}

function gotDomReady()
{
  if (debuglog)
    console.log("fz got domready, detect current focus zone");
  detectCurrentFocusZone();
}

function detectCurrentFocusZone()
{
  var newzone = getElFocusZone($wh.getActiveElement(document));
  if (debuglog)
    console.log("fz detect: apply new zone", newzone, " (from ", $wh.getActiveElement(document), ")");
  setCurrentFocusZone(newzone);
}

function leaveCurrentZone(pushhistory)
{
  if (debuglog)
    console.log("fz leaveCurrentZone", currentfocuszone, pushhistory);

  if (currentfocuszone && currentfocuszone.parentNode)
  {
    var lossevent = new $wh.CustomEvent("wh-focuszone-blur", { cancelable: false, bubbles: true });
    $wh.dispatchEvent(currentfocuszone, lossevent);
  }

  if(pushhistory)
  {
    var currententry = zonehistory.indexByProperty('zone', currentfocuszone);
    if(currententry >= 0)
      zonehistory.splice(currententry,1);

    zonehistory.push( { zone: currentfocuszone, focus: lastfocused });
  }

  filterZoneHistory();

  currentfocuszone = null;
}

function filterZoneHistory()
{
  zonehistory = zonehistory.filter(function(item) { return !item.zone || item.zone.parentNode; });
}

function setCurrentFocusZone(focuszone)
{
  if (debuglog)
    console.log("fz set zone from", currentfocuszone, "to", focuszone);

  if(currentfocuszone == focuszone)
    return;

  leaveCurrentZone(true); //history-push and fire a loss at the existing zone

  currentfocuszone = focuszone;
  if(currentfocuszone)
  {
    var gainsevent = new $wh.CustomEvent("wh-focuszone-focus", { cancelable: false, bubbles: true });
    $wh.dispatchEvent(currentfocuszone, gainsevent);
  }
}

function onFocusIn(event)
{
  var currentfocus = event.target.owner$wh.getActiveElement(document);
  var newfocus = event.event.relatedTarget;

  var currentzone = getElFocusZone(currentfocus);
  var newzone = getElFocusZone(newfocus);

  if (debuglog)
    console.log("fz got focusin event, current focuszone ", currentzone, " (from", currentfocus, "), " +
                "new zone ", newzone, " (", newfocus, ")");

/*
  if(currentzone != newzone)
  {
    event.stop(); //this doen't prevent focus loss, but at least lets us prevent others from seeing it

  }*/

  newzone = currentfocuszone;
}

function onFocus(domevent)
{
  if (debuglog)
    console.log("fz got focus event, target ", domevent.target);

  detectCurrentFocusZone();
  lastfocused = $wh.getActiveElement(document);
}
function onFocusIn_IE8(domevent)
{
  if (debuglog)
    console.log("fz got IE8 focusin event, target ", domevent.target);

//  console.log('onfocus_IE8', $wh.getActiveElement(document));
  detectCurrentFocusZone();
  lastfocused = $wh.getActiveElement(document);
}

$wh.getCurrentFocusZone = function()
{
  /*
  var curfocus = $wh.getActiveElement(document);

  if(curfocus)
    return $(curfocus).getParent(".wh-focuszone");
  else
    return null;
  */
  //console.log('curfocus', $wh.getActiveElement(document));
  //console.log(currentfocuszone);
  return currentfocuszone;
}

$wh.focusZone = function(newzone)
{
  //console.error("FOCUSZONE",newzone);
  var el = $(newzone);
  if(!el || !el.hasClass("wh-focuszone"))
  {
    console.error("No such focuszone",newzone);
    throw new Error("No such focuszone");
  }

  if(currentfocuszone == el)
    return; //already in the zone.

  var currententry = zonehistory.indexByProperty('zone', el);
  if(currententry >= 0) //already seen this zone
  {
    var tofocus = zonehistory[currententry].focus;
    zonehistory.splice(currententry,1);
    if(getElFocusZone(tofocus) == el) //still in the proper zone
    {
      uibasefocus(tofocus);
      return;
    }
  }

  var firstfocusevent = new $wh.CustomEvent("wh-focuszone-firstfocus", { cancelable: true, bubbles: true });

  receivingfocuszone = el;
  var continueevent = $wh.dispatchEvent(el, firstfocusevent);
  receivingfocuszone = null;
  if(!continueevent)
    return; //cancelled. we'll not explicitly focus anything and assume our canceller did it (ADDME should we still kill focus or change zones if caller didn't focus the right component?)

  var focusable = $wh.getFocusableComponents(el);
  if (debuglog)
    console.log('fz focusable', focusable[0]);
  if(focusable.length)
  {
    uibasefocus(focusable[0]);
  }
  else //there's nothing to focus in this zone
  {
    if($wh.getActiveElement(document))
    {
      if (debuglog)
        console.log('fz blurring active element', $wh.getActiveElement(document));
      $wh.getActiveElement(document).blur();
    }
    else if (debuglog)
      console.log('fz may not blur active element', $wh.getActiveElement(document));
    setCurrentFocusZone(el);
  }

  //console.log("focuszone done. current zone", currentfocuszone, " current focus", $wh.getActiveElement(document));
}

/** Get the currently active element within a zone
*/
$wh.getFocusZoneActiveElement = function(zone)
{
  var el = $(zone);
  if(!el || !el.hasClass("wh-focuszone"))
  {
    console.error("No such focuszone", zone);
    throw new Error("No such focuszone");
  }

  if(currentfocuszone == el)
    return $wh.getActiveElement(zone.ownerDocument);

  var currententry = zonehistory.indexByProperty('zone', el);
  if(currententry < 0) //haven't seen this zone?
    return null;

  return zonehistory[currententry].focus;
}

/* pop the current zone. use this to cancel focus from eg a menu open, to return
   it to theprevious zone */
$wh.popCurrentZone = function()
{
  if (debuglog)
  {
    console.log('fz popCurrentZone');
    console.trace();
  }

  leaveCurrentZone(false);
  if(!zonehistory.length)
  {
    console.error("fz popCurrentZone - but no zones"); //FIXME what to do?
    return;
  }
  //console.log(Array.from(zonehistory));

  var popzone = zonehistory.pop();
  var tofocus = popzone.focus;

  if (popzone.zone)
    setCurrentFocusZone(popzone.zone);

  if(tofocus && (!popzone.zone || tofocus.getParent(".wh-focuszone") == popzone.zone))
  {
    if (debuglog)
      console.log('fz restoring focus to', tofocus);
    tofocus.focus();
  }
}

$wh.focus = function(node) //note: we overwrite the basic focus function from uibase
{
  var el = $(node);
  if(!el)
    throw new Error("No such node");

  var newzone = getElFocusZone(el);
  if(newzone != (receivingfocuszone || currentfocuszone))
  {
    filterZoneHistory();

    var currententry = zonehistory.indexByProperty('zone', newzone);
    if(currententry >= 0) //update the last element in the zone
      zonehistory[currententry].focus = el;
    else
      zonehistory.unshift( { zone: newzone, focus: el });

    return;
  }
  uibasefocus(el);
}

//window.addEvent('focusin', onFocusIn);
if(window.addEventListener)
  window.addEventListener('focus', onFocus, true);
else
  document.attachEvent('onfocusin', onFocusIn_IE8);

window.addEvent('domready', gotDomReady);

})(document.id); //end mootools wrapper
