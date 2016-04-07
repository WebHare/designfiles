/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.class.binds');
/*! LOAD: frameworks.mootools.core, frameworks.mootools.more.class.binds
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

$wh.legacyclasses = true;
$wh.autoreplacecomponents = true; // set to false if you want control over order of initialization (for control over reflow of your page)



function getToplevelWindow()
{
  var toplevelwindow = window;
  while(toplevelwindow.frameElement)
    toplevelwindow = toplevelwindow.parent;
  return toplevelwindow;
}

//this handler watches for clicks targetted to replace UI components, and fixes up any needed focus handling
function fallbackLabelHandler(event)
{
  if(fallbackLabelHandler.cancelSubsequentClicks)
  {
    //console.log("BREAKING CLICK", event.target);
    event.stop();
    return;
  }

  var label;
  for(var node = event.target; node; node=node.parentNode)
  {
    if(!node.nodeName)
      continue;

    var testnode = node;
    if(testnode.retrieve)
    {
      var replaces = testnode.retrieve("wh-ui-replaces");
      if(replaces)
      {
        testnode = replaces;
      }

    }

    var name = testnode.nodeName.toUpperCase();
    if(["INPUT", "A", "SELECT"].contains(name))
    {
      if(name=="SELECT") //a select inside a label triggers two click events on safari (confirmed Safari 7 & Yosemite Beta 8, Firefox). prepare to swallow the second click
      {
        fallbackLabelHandler.cancelSubsequentClicks = true;
        (function() { fallbackLabelHandler.cancelSubsequentClicks = false }).delay(0);
        event.stop();
      }
      return; //do not intercept this link
    }

    if (name == "LABEL")
    {
      label = node;
      break;
    }
  }
  if(!label)
    return;

  //find the actual target
  var targetelement = label.htmlFor ? $(label.htmlFor) : $wh.getFocusableComponents(label,false).pick();
  if(!targetelement)
    return;
  var replacedby = targetelement.retrieve("wh-ui-replacedby");
  if(replacedby)
    targetelement=replacedby;

  targetelement.focus();
  targetelement.click();
  event.stop();
}

$wh.setupLabelDefaultHandler = function()
{
  if($wh.setupLabelDefaultHandler.executed)
    return;
  $wh.setupLabelDefaultHandler.executed=true;

  $(document).addEvent("click", fallbackLabelHandler);
}
$wh.setupLabelDefaultHandler.executed=false;

$wh.setupFormResetListener = function(input, onchange)
{
  // Listen to form resets
  var parentform = input.getParent("form");
  if(parentform)
  {
    // Check if the form doesn't already have a reset listener
    if (!parentform.retrieve("-wh-formresetlistener") && !parentform.retrieve("wh-formresetlistener"))
    {
      parentform.addEvent("reset", function()
      {
        // Delay the reset, giving the onreset time to update the handlers
        (function()
        {
          // Fire the 'form is reset' event on all inputs and selects within the form
          this.getElements("input, select").fireEvent("-wh-formisreset");
          this.getElements("input, select").fireEvent("wh-formisreset");
        }).delay(1, this); // this == 'reset' event target == form
      });

      // Set the form reset listener to prevent multiple listeners on the same form
      parentform.store("-wh-formresetlistener", true);
      parentform.store("wh-formresetlistener", true);
    }

    // Listen to the 'form is reset' event, fire the onchange handler if the form was reset
    input.addEvent("wh-formisreset", onchange);
  }
}

$wh.hasFocus=function(element)
{
  if(!element.ownerDocument)
    return false;
  if(element && element.retrieve)
  {
    var replacedby = element.retrieve("wh-ui-replacedby");
    if(replacedby)
      element = replacedby;
  }
  return element == $wh.getActiveElement(element.ownerDocument);
}
/// Returns whether the element or a subnode is focused
$wh.containsFocus=function(element)
{
  if(!element.ownerDocument)
    return false;
  if(element && element.retrieve)
  {
    var replacedby = element.retrieve("wh-ui-replacedby");
    if(replacedby)
      element = replacedby;
  }

  // Test if focused element is element itself or a subnode (contains also return true on when the nodes equal each other)
  return element.contains($wh.getActiveElement(element.ownerDocument));
}
$wh.getFocusableElement = function(element) //get the focusable element for an input field. understands replacement
{
  var replacedby = $(element).retrieve("wh-ui-replacedby");
  if(replacedby)
    return replacedby;
  return element;
}
$wh.hasEventCopyKey = function(event)
{
  return !!event && !!(Browser.platform == "mac" ? event.meta : event.control);
}
$wh.getAllFocusableComponents = function()
{
  return $wh.getFocusableComponents(getToplevelWindow().document, true);
}
/** Find the currently focused element
    @param limitwin If set, only return compontents in the specified document (prevents editable iframes from returning subframes) */
$wh.getCurrentlyFocusedElement = function(limitdoc)
{
  try
  {
    var focused = $wh.getActiveElement(getToplevelWindow().document);
    while(true)
    {
      if (focused.tagName == "IFRAME" && (!limitdoc || focused.ownerDocument != limitdoc))
        focused = $wh.getActiveElement(focused.contentDocument);
      else
        break;
    }
    if(focused && limitdoc && focused.ownerDocument != limitdoc)
      return null;
    return focused;
  }
  catch(e)
  {
    return null;
  }
}

$wh.isFocusableComponent = function(node) //returns if a -visible- node is focusable (this function does not check for visibility itself)
{
  try
  {
    if(node.nodeType != 1)
      return false;
    if(node.contentEditable === "true")
      return true;
    // http://dev.w3.org/html5/spec-preview/editing.html#focusable
    if(node.tabIndex == -1) //explicitly disabled
      return false;
  //console.log(node);//console.log(node.getAttribute('tabIndex'));
    return (parseInt(node.getAttribute('tabIndex')) >= 0) //we cannot read the property tabIndex directly, as IE <= 8 will return '0' even if the tabIndex is missing
           || (["A","LINK"].contains(node.nodeName) && node.href)
           || (["BUTTON","SELECT","TEXTAREA","COMMAND"].contains(node.nodeName) && !node.disabled)
           || (node.nodeName=="INPUT" && node.type != "hidden" && !node.disabled);
  }
  catch(e)
  {
    return false; //the code above may fail eg on IE11 if it's a Flash object that'ss still loading
  }
}
$wh.getFocusableComponents = function(startnode, recurseframes)
{
  var focusable=[];
  for(var currentnode=startnode.firstChild;currentnode;currentnode=currentnode.nextSibling) //can't use element.getChildren, startnode may be document
  {
    if(!$wh.isHTMLElement(currentnode))
    {
      //if(currentnode.getStyle) console.log("getFocusableComponents skipping",currentnode, $(currentnode).getStyle("display"), currentnode.getStyle("visibility"))
      continue;
    }

    // Get current style (avoid mootools due to cross-frame issues)
    var currentstyle;
    if (window.getComputedStyle)
      currentstyle = getComputedStyle(currentnode);
    else try
    {
      currentstyle = currentnode.currentStyle;
    } catch (e) {};

    if (!currentstyle || currentstyle.display == "none" || currentstyle.visibility == "hidden")
    {
      //if(currentnode.getStyle) console.log("getFocusableComponents skipping",currentnode, $(currentnode).getStyle("display"), currentnode.getStyle("visibility"))
      continue;
    }

    if(recurseframes && currentnode.nodeName == "IFRAME") //might contain more things to focus
    {
      //ADDME force body into list?
      var subnodes = [];
      try
      {
        var body = (currentnode.contentDocument || currentnode.contentWindow.document).body;
        subnodes = $wh.getFocusableComponents(body, recurseframes);
      }
      catch (e)
      {
        console.log("failed to descend into iframe",e)
      }
      if(subnodes.length)
        focusable=focusable.concat(subnodes);
    }
    else if($wh.isFocusableComponent(currentnode))
    {
      focusable.push(currentnode);
    }

    var subnodes = $wh.getFocusableComponents(currentnode, recurseframes);
    if(subnodes.length)
      focusable = focusable.concat(subnodes);
  }
  return focusable;
}



// register replace instructions, so we can reapply them on new elements
var replaces = [], seendomready = false;

function executeReplaceInstruction(startnode, instruction)
{
  //ADDME: checking this here prevents possible error from occurring in Firefox:
  //       "TypeError: Argument 1 of Node.contains does not implement interface Node."
  if (!instruction.selector || !instruction.selector.length || ($wh.debug.nor && !instruction.options.mustreplace))
    return;

  //Note: we can't do startnode.getElements(), as a common selector "form select" would not match newly added arrayrows (startnode is inside the form)
  var elements = $wh.getTopMatchedElements(startnode, instruction.selector);

  Array.each(elements, function(node)
    {
      var replacedby = node.retrieve("wh-ui-replacedby");
      //console.log("Replacing",node,node.getAttribute("replaceid"),replacedby)
      if(replacedby)
      {
        if(replacedby.nextSibling != node) //it got moved away
          replacedby.inject(node, 'before');
        return;
      }

      // Internet Explorer and Edge don't treat <template> as inert, so content within <template> will be picked up.
      // Replacement must be done after instantiation of the template because any events and references to nodes
      // will be lost. (will be on the template instead of new DOM)
      if (node.getParent("template"))
        return;

      //FIXME replace this with <template> support
      var templaterowparent = node.getParent(".templaterow");
      if(templaterowparent && templaterowparent.getParent(".wh-form"))
        return;
      if($wh.legacyclasses && templaterowparent && templaterowparent.getParent(".-wh-form"))
        return;

      instruction.replacefunction(node, instruction.options);
    });
}

function executeReplaceDomready()
{
  if ($wh.autoreplacecomponents)
  {
    seendomready = true;
    $wh.applyReplaceableComponents(null);
  }
}

/* Passing 'mustreplace:true' as option will prevent $wh.debug.nor from disabling the element replacement */
$wh.setupReplaceableComponents = function(selector, replacefunction, options)
{
  options = options ? Object.clone(options) : {};

  var instr = { selector: selector
              , replacefunction: replacefunction
              , options: options
              };
  replaces.push(instr);
  if(seendomready)
    executeReplaceInstruction(null, instr);
}
/** Fire replaced component handlers on a inserted/updated parts of the dom
    @param basenode DOM tree to update */
$wh.applyReplaceableComponents = function(basenode)
{
  replaces.each(executeReplaceInstruction.bind(window, basenode));
}



function informUIWaiters()
{
  $wh.updateUIBusyFlag.scheduled = false;
  if($wh.updateUIBusyFlag.busycount!=0)
    return;

  var waiters = $wh.updateUIBusyFlag.waiters;
  $wh.updateUIBusyFlag.waiters=[];
  Array.each(waiters, function(waiter) { waiter(); });
}

/* UI busy/wait framework */
$wh.updateUIBusyFlag = function(count)
{
  if($wh.debug.bus)
    console.error("[uibase] $wh.updateUIBusyFlag ",count,'total',$wh.updateUIBusyFlag.busycount+count)
  if(!count)
    throw "$wh.updateUIBusyFlag: expecting a positive or negative wait count";

  $wh.updateUIBusyFlag.busycount += count;
  if($wh.updateUIBusyFlag.busycount<0)
    throw "$wh.updateUIBusyFlag: busy flag count dropped below zero";

  if ($wh.updateUIBusyFlag.busycount)
    $wh.updateUIBusyFlag.hasbeenbusy = true;

  if(!$wh.updateUIBusyFlag.scheduled && $wh.updateUIBusyFlag.busycount==0)
  {
    $wh.updateUIBusyFlag.scheduled = true;
    informUIWaiters.delay(0);
  }
}

$wh.requestUIReady = function(callback)
{
  $wh.updateUIBusyFlag.waiters.push(callback);
  if($wh.updateUIBusyFlag.busycount == 0 && !$wh.updateUIBusyFlag.scheduled)
  {
    $wh.updateUIBusyFlag.scheduled = true;
    informUIWaiters.delay(0);
  }
}
$wh.resetUIHasBeenBusy = function()
{
  $wh.updateUIBusyFlag.hasbeenbusy = $wh.updateUIBusyFlag.busycount != 0;
}
$wh.getUIHasBeenBusy = function()
{
  return $wh.updateUIBusyFlag.hasbeenbusy;
}
$wh.isUIBusy = function()
{
  return $wh.updateUIBusyFlag.busycount > 0;
}

$wh.updateUIBusyFlag.busycount = 0;
$wh.updateUIBusyFlag.waiters = [];
$wh.updateUIBusyFlag.scheduled = false;
$wh.updateUIBusyFlag.hasbeenbusy = true;

//set up focusin/focusout handlers for firefox, as these are pretty much essential for form handling
var hasfocusinout = typeof document.onfocusout != "undefined" || Browser.chrome || Browser.safari; //these all support it natively, we won't bother with the hack
var force_autofocus = !("autofocus" in document.createElement("input"));

window.addEvent("domready", function()
{
  if(!hasfocusinout)
  {
    var lastblurred = null;
    function handleBlurEvent(event) //capture the last blurred item, we need it during focus
    {
      //console.log('BLUR',event.target);
      lastblurred = event.target;
      //FIXME handle the case where we get a blur, but no focus.
      watchFocus.delay(1);
    }
    function handleFocusEvent(event)
    {
      //console.log('FOCUS',event.target);
      if(lastblurred)
      {
        var evt = document.createEvent("Event");
        evt.initEvent("focusout", true, false);
        evt.relatedTarget = event.target;
        lastblurred.dispatchEvent(evt);
      }
      var evt = document.createEvent("Event");
      evt.initEvent("focusin", true, false);
      evt.relatedTarget = lastblurred;
      event.target.dispatchEvent(evt);
      lastblurred = null;
    }
    function watchFocus()
    {
      if(lastblurred) //never got the focusout event
      {
        var evt = document.createEvent("Event");
        evt.initEvent("focusout", true, false);
        evt.relatedTarget = document.activeElement;
        lastblurred.dispatchEvent(evt);
        lastblurred = null;
      }
    }
    document.addEventListener("focus", handleFocusEvent, true);
    document.addEventListener("blur", handleBlurEvent, true);
  }

  if(force_autofocus)
  {
    var inputelements = $$("input[autofocus], select[autofocus]");
    if(inputelements.length > 0)
    {
      try { inputelements[0].focus(); }
      catch(e) {}
    }
  }
});

/* Busy indicator base class
*/
var BusyIndicatorBase = new Class(
{
  /// Callback for busy indicator
  _cb: 0

  /// Whether currently in 'busy' state
, _busy: false

  /// Time to wait from start of busy state to enable indicator
, indicatortimeout: 100

  /// Process incoming new list of locks
, _setBusyStatus: function(currentlocks)
  {
    var busy = currentlocks.length != 0;
    if (busy != this._busy)
    {
      this.handleBusyChange(busy, currentlocks);

      // ADDME: support of { immediate: true } reading in busylock options, and show indicator immediately
      if (busy)
        this.cb = this._enableIndicatorCallback.bind(this).delay(100);
      else if (this.cb)
      {
        clearTimeout(this.cb);
        this.cb = 0;
      }
      else
        this.handleIndicatorVisibleChange(false);

      this._busy = busy;
    }
    this.locksChanged(currentlocks);
  }

  /// Callback when indicator must be enabled
, _enableIndicatorCallback: function()
  {
    this.cb = 0;
    this.handleIndicatorVisibleChange(true);
  }

  /// Called when busy state changes
, handleBusyChange: function(busy, locks)
  {
    $(document.documentElement).toggleClass('wh-busy', busy);
    //console.log("Fire event '" + (busy?'busy':'unbusy') + "' on body");
    $(window).fireEvent(busy ? 'wh-busystart' : 'wh-busyend', { target: this, event: busy ? 'wh-busystart' : 'wh-busyend', locks: locks });
  }

  /// Called when indicator visibility changes
, handleIndicatorVisibleChange: function(show)
  {
    $(document.documentElement).toggleClass('showindicator', show);
  }

  /// Called when current list of locks changes
, locksChanged: function(locks)
  {
  }
});

var BusyLock = new Class(
{ Binds: [ 'release', 'releaseOnEvent' ]
, _busyhandler: null
, tags: []
, options: {}

, initialize: function(busyhandler, tags, options)
  {
    //console.error('Initialize busy lock ', tags, options);
    this._busyhandler = busyhandler;
    this.tags = Array.from(tags);
    this.options = options || {};
    this._busyhandler._addLock(this);
  }

, release: function()
  {
    //console.error('Release busy lock ', this.tags, this.options);
    this._busyhandler._removeLock(this);
  }

, releaseOnEvent: function(node, event)
  {
    var mythis = this;
    var func = function() { node.removeEvent(event, func); mythis.release(); }
    node.addEvent(event, func);
  }
});

var BusyHandler = new Class(
{ /// List of currently active locks
  _activelocks: []

  /// List of lingering locks (in reversed unlock order)
, _lingeringlocks: []

  /// Busy indicator class to use
, _busyindicator: null

, initialize: function()
  {
    this._busyindicator = new BusyIndicatorBase;
  }

  /// Sends an update to the busy indicator
, _updateBusyIndicator: function()
  {
    this._busyindicator._setBusyStatus(this._activelocks.concat(this._lingeringlocks));
  }

  /// Registers a new lock
, _addLock: function(lock)
  {
    this._activelocks.push(lock);
    this._updateBusyIndicator();
  }

  /// Registers the removal of a lock.
, _removeLock: function(lock)
  {
    // Allow duplicate removes
    if (!this._activelocks.contains(lock))
      return;

    this._lingeringlocks.unshift(lock);
    this._activelocks.erase(lock);

    this._updateBusyIndicator();

    // Delay remove by 50ms to make sure very short non-busy intervals will be ignored.
    this._removeLockDelayed.bind(this, lock).delay(50);
  }

  /// Actual removal of a lock
, _removeLockDelayed: function(lock)
  {
    this._lingeringlocks.erase(lock);
    this._updateBusyIndicator();
  }

  /// Adds a busy lock
, addBusy: function(tags, options)
  {
    return new BusyLock(this, tags, options);
  }

  /// Changes the busy indicator to use.
, setBusyIndicator: function(indicator)
  {
    if (this._busyindicator)
      this._busyindicator.setBusyStatus([]);

    this._busyindicator = indicator;
    this._updateBusyIndicator();
  }
});

/// Adds a busy lock release to a callback
Function.prototype.addWHBusyRelease = function(busylock)
{
  var func = this;
  return (function()
    {
      busylock.release();
      return func.apply(this, arguments);
    });
}

/// Global busy handler
$wh.globalBusyHandler = new BusyHandler;

/** Creates a new busy lock
    @param tags List of tags
    @param options Options
    @cell options.handler Busy handler override. Defaults to $wh.globalBusyHandler.
*/
$wh.createBusyLock = function(tags, options)
{
  var handler = (options||{}).handler || $wh.globalBusyHandler;
  return new BusyLock(handler, tags, options);
}

$wh.focus = function(node)
{
  var el = $(node);
  if(!el)
    throw new Error("No such node");

  try
  {
    el.focus();
  }
  catch(e)
  {
    //ignore errors, IE likes to throw
  }
}

$wh.isAllowNativeContextMenu = function(event)
{
  return (event.shift && event.control) || (event.shiftKey && event.ctrlKey);
}

window.addEvent("domready", executeReplaceDomready);

})(document.id); //end mootools wrapper
