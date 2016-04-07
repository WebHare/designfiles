/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
require ('wh.ui.base');
require ('wh.compat.dom');
require ('wh.compat.dragdrop');
require ('wh.util.scroll');
require ('wh.net.jsonrpc');
require ('wh.net.url');
require ('wh.util.promise');
/*! LOAD: wh.compat.base, wh.ui.base, wh.compat.dom, wh.compat.dragdrop, wh.util.scroll
    LOAD: wh.net.jsonrpc, wh.net.url, wh.util.promise
!*/

//Ported to: @webhare-system/wh/testframework

//basic test functions

(function($) {

var testfw = window.parent ? window.parent.__testframework : null;
var seleniumhost;
var seleniumsession;
var serviceuri;
var testsession;

//if(testfw && testfw.takeconsolelog)
//  testfw.doConsoleTakeover(window);

function safe_id(elt)
{
  if (typeof elt == "object"
        && elt.ownerDocument
        && elt.ownerDocument != document
        && elt.ownerDocument.id)
    return elt.ownerDocument.id(elt);
  return $(elt);
}

// Returns something like an ecmascript completion record
function wrappedcall(func)
{
  try
  {
    var res = func();
    return { type: 'normal', value: res };
  }
  catch(e)
  {
    return { type: 'throw', value: e };
  }
}

function initialize_tests(steps)
{
  if ((Browser.name == "firefox") && window.parent)
    window.console = window.parent.console;

  var res = testfw.runTestSteps(steps, wrappedcall);
  seleniumhost = res.seleniumhost;
  seleniumsession = res.seleniumsession;
  serviceuri = res.serviceuri;
  testsession = res.testsession;
}

function testDeepEq(expected, actual, path)
{
  if(expected === actual)
    return;
  if(actual === null && expected !== null)
    throw new Error("Got a null, but expected " + expected + (path!="" ? " at " + path : ""));
  if(expected === null && actual !== null)
    throw new Error("Expected null, got " + (path!="" ? " at " + path : ""));

  var t_expected = typeof expected;
  var t_actual = typeof actual;
  if(t_expected != t_actual)
    throw new Error("Expected type: " + t_expected + " actual type: " + t_actual + (path!="" ? " at " + path : ""));

  if(t_expected != "object") //simple value mismatch
    throw new Error("Expected: " + expected + " actual: " + actual + (path!="" ? " at " + path : ""));

  // Deeper type comparison
  t_expected = typeOf(expected);
  t_actual = typeOf(actual);

  if(t_expected != t_actual)
    throw new Error("Expected type: " + t_expected + " actual type: " + t_actual + (path!="" ? " at " + path : ""));

  if([ 'element', 'textnode', 'whitespace', 'window', 'collection', 'document' ].contains(t_expected) && expected != actual)
    throw new Error("Expected: " + expected + " actual: " + actual + (path!="" ? " at " + path : ""));

  if(typeof expected.sort != 'undefined' && typeof actual.sort != 'undefined')
  {
    if (expected.length != actual.length)
      throw new Error("Expected: " + expected.length + " elements, actual: " + actual.length + " elements" + (path!="" ? " at " + path : ""));

    for (var i=0; i < expected.length; ++i)
      testDeepEq(expected[i], actual[i], path + "[" + i + "]");
  }
  else
  {
    //not the same object. same contents?
    var expectedkeys = Object.keys(expected);
    var actualkeys = Object.keys(actual);

    Object.each(expected, function(value,key)
                {
                  if(!actualkeys.contains(key))
                    throw new Error("Expected key: " + key + ", didn't actually exist" + (path!="" ? " at " + path : ""));
                  testDeepEq(value, actual[key], path + "." + key);
                });
    Object.each(actual, function(value,key)
                {
                  if(!expectedkeys.contains(key))
                    throw new Error("Key unexpectedly exists: " + key + (path!="" ? " at " + path : ""));
                });
  }
}

function rewriteNodeAttributes(node)
{
  // Make sure the order of the attributes is predictable, by getting them, removing them all and reinserting them
  // with a function that tries to keep it stable.
  var attrs = $wh.getAllAttributes(node);
  var keys = Object.keys(attrs);
  for (var i = 0; i < keys.length; ++i)
    node.removeAttribute(keys[i]);
  $wh.setAttributes(node, attrs);
}

function isequal(a, b)
{
  try
  {
    testDeepEq(a,b,'');
    return true;
  }
  catch(e)
  {
    return false;
  }
}

window.registerJSTests = function(steps)
{
  //get our parent test framework
  if(!testfw)
    return console.error("This page is not being invoked by the test framework");

  $(window).addEvent("domready", initialize_tests.bind(null, steps));
};
window.getTestArgument = function(idx)
{
  if(idx > testfw.args.length)
    throw new Error("No argument #" + idx);
  return testfw.args[idx];
}
function logExplanation(explanation)
{
  if(typeof explanation=="function")
    explanation=explanation();
  console.error(explanation);
  testfw.log("* " + explanation + "\n");
}
window.testEq = function(expected, actual, explanation)
{
  if(isequal(expected,actual))
    return;

  var expected_str = expected;
  var actual_str = actual;

  try { expected_str = typeof expected == "string" ? unescape(escape(expected).split('%u').join('/u')) : JSON.encode(expected); } catch(e){}
  try { actual_str = typeof actual == "string" ? unescape(escape(actual).split('%u').join('/u')) : JSON.encode(actual); } catch(e){}

  if(explanation)
    logExplanation(explanation);

  console.log("testEq fails: expected", expected_str);
  testfw.log("testEq fails: expected " + (typeof expected_str == "string" ? "'" + expected_str + "'" : expected_str));

  console.log("testEq fails: actual  ", actual_str);
  testfw.log("testEq fails: actual " + (typeof actual_str == "string" ? "'" + actual_str + "'" : actual_str));

  if(typeof expected == "string" && typeof actual == "string")
  {
    testfw.log("E: " + encodeURIComponent(expected));
    testfw.log("A: " + encodeURIComponent(actual));
  }

  testDeepEq(expected, actual, '');
};
window.testEqHTML = function(expected, actual, explanation)
{
  var fixer = new Element("div");

  // Normalize stuff by parsing into DOM and then extracing again
  fixer.innerHTML=expected;
  expected=fixer.innerHTML;
  fixer.innerHTML=actual;
  actual=fixer.innerHTML;
  if(expected==actual)
    return;

  // Extra round. May fix some stuff
  fixer.innerHTML=expected;
  expected=fixer.innerHTML;
  fixer.innerHTML=actual;
  actual=fixer.innerHTML;
  if(expected==actual)
    return;

  // Firefox has problems with attribute ordering. Rewrite all attributes to get them in the same order.
  fixer.innerHTML=expected;
  var list = fixer.getElementsByTagName('*');
  for (var i = 0; i < list.length; ++i)
    rewriteNodeAttributes(list[i]);
  expected=fixer.innerHTML;
  fixer.innerHTML=actual;
  var list = fixer.getElementsByTagName('*');
  for (var i = 0; i < list.length; ++i)
    rewriteNodeAttributes(list[i]);
  actual=fixer.innerHTML;

  testEq(expected, actual, explanation);
}

window.testHTMLByRegex = function(regex, actual, explanation)
{
  var fixer = new Element("div");
  fixer.innerHTML=actual;
  actual=fixer.innerHTML;

  if (actual.match(regex))
    return;

  fixer.innerHTML=regex;
  regex=fixer.innerHTML;

  if (actual.match(regex))
    return;

  if(explanation)
    logExplanation(explanation);

  console.log("testHTMLRegex fails: regex ", regex);
  testfw.log("testHTMLRegex fails: regex " + regex);

  console.log("testHTMLRegex fails: actual ", actual);
  testfw.log("testHTMLRegex fails: actual " + actual);
  throw new Error("testHTMLByRegex failed");
}

window.testEqIn = function(expected_in, actual, explanation)
{
  for (var i=0;i<expected_in.length;++i)
    if(isequal(expected_in[i], actual))
      return;

  expected_in = unescape(escape(expected_in).split('%u').join('/u'));
  actual = unescape(escape(actual).split('%u').join('/u'));

  if(explanation)
    logExplanation(explanation);

  if (console.trace) console.trace();
  console.log("testEqIn fails: expected one of ", expected_in);
  testfw.log("testEqIn fails: expected one of " + expected_in);

  console.log("testEqIn fails: actual ", actual);
  testfw.log("testEqIn fails: actual " + actual);
  throw new Error("testEqIn failed");
}
window.testEqFloat = function(expected, actual, delta, explanation)
{
  if(Math.abs(expected-actual)<=delta)
    return;

  var expected_str = expected;
  var actual_str = actual;

  try { expected_str = typeof expected == "string" ? unescape(escape(expected).split('%u').join('/u')) : JSON.encode(expected); } catch(e){}
  try { actual_str = typeof actual == "string" ? unescape(escape(actual).split('%u').join('/u')) : JSON.encode(actual); } catch(e){}

  if(explanation)
    logExplanation(explanation);

  console.log("testEq fails: expected", expected_str);
  testfw.log("testEq fails: expected " + (typeof expected_str == "string" ? "'" + expected_str + "'" : expected_str));

  console.log("testEq fails: actual  ", actual_str);
  testfw.log("testEq fails: actual " + (typeof actual_str == "string" ? "'" + actual_str + "'" : actual_str));

  if(typeof expected == "string" && typeof actual == "string")
  {
    testfw.log("E: " + encodeURIComponent(expected));
    testfw.log("A: " + encodeURIComponent(actual));
  }

  testDeepEq(expected, actual, '');
};

window.testThrows = function(func, explanation)
{
  try
  {
    func();

    if(explanation)
      logExplanation(explanation);

    if (console.trace) console.trace();
    console.log("testThrows fails: expected function to throw");
    testfw.log("testThrows fails: expected function to throw");

    throw new Error("testThrows failed");
  }
  catch (e)
  {
  }
}


window.findElementWithText = function (doc, tagname, text)
{
  var els = doc.getElementsByTagName(tagname);
  for(var i=0;i<els.length;++i)
    if(els[i].childNodes.length == 1 && els[i].firstChild.nodeValue==text)
      return els[i];
  return null;
}


window.getInputValue = function(element)
{
  if(element.hasClass && element.hasClass("-wh-pulldown"))
    return element.retrieve("todd").getValue();
  if(element.hasClass && (element.hasClass("wh-pulldown") || element.hasClass("wh-checkbox")))
    return element.retrieve("todd").getValue();
  throw new Error("component not yet supported by getInputValue (classes: " + element.className + ")");
}

window.setInputValue = function(element,newvalue)
{
  testapi.fill(element,newvalue);
}

function getPartPosition(part)
{
  if(part.el.concat)
    throw new Error("el is an array, it must be a single element");

  var el=$(part.el);
  var coords = el.getBoundingClientRect();
  var relx,rely;

  if(typeof part.x=='undefined')
    relx = coords.width * 0.5;
  else if(typeof part.x=='string' && part.x.slice(-1)=='%')
    relx = coords.width * parseInt(part.x)/100;
  else if(typeof part.x=='number')
    relx = part.x;
  else
    throw new Error("Did not understand 'x'");

 if(typeof part.y=='undefined')
    rely = coords.height * 0.5;
  else if(typeof part.y=='string' && part.y.slice(-1)=='%')
    rely = coords.height * parseInt(part.y)/100;
  else if(typeof part.y=='number')
    rely = part.y;
  else
    throw new Error("Did not understand 'y'");

  for (var findroot=el; findroot != el.ownerDocument.documentElement;findroot=findroot.parentNode)
    if(!findroot)
    {
      console.error("The element we're looking for is no longer part of the DOM: " , el);
      throw new Error("The element we're looking for is no longer part of the DOM");
    }

  var clientx = coords.left + relx;
  var clienty = coords.top + rely;

  return {x:clientx,y:clienty,relx: relx, rely: rely};
}

var default_mousestate =
                 { cx: 0
                 , cy: 0
                 , downel: null
                 , downelrect: null
                 , downbuttons: []
                 , samplefreq: 50
                 , gesturequeue: []
                 , gesturetimeout:null
                 , waitcallbacks:[]
                 , lastoverel:null
                 , cursorel:null
                 , lastdoc:null
                 , lastwin:null
                 , previousclickel:null
                 , previousclicktime:null
                 , previousclickpos:null
                 , dndcandidate:null
                 , dndstate:null
                 };

var mousestate = Object.clone(default_mousestate);

window.waitForGestures=function(callback)
{
  if(mousestate.gesturequeue.length==0)
    callback();
  else
    mousestate.waitcallbacks.push(callback);
}

window.dragTransition = function()
{
  var baseTransition = Fx.Transitions.Cubic;
  // Decelerate more than accelerate
  return baseTransition.easeInOut.apply(baseTransition, arguments)
       * baseTransition.easeOut.apply(baseTransition, arguments);
}

var DataTransfer = new Class(
  { __dod: null
  , __prot: 'prot'
  , __requirerw: function() { if (!this.__dod||this.__prot!='rw') throw new Error("Require R/W access to dnd datastore"); }
  , initialize: function(dod, prot) { this.__dod = dod; this.__prot = prot; }
  , dropeffect: 'none'
  , effectAllowed: 'uninitialized'
  , items: []
  , setDragImage: function(element, x, y) { this.__requirerw(); this.__dod.setDragImage(element, x, y); }
  , types: []
  , getData: function(format) { return this.__prot == 'prot' ? '' : this.__dod.getData(format); }
  , setData: function(format, data) { this.__requirerw(); this.__dod.setData(format, data); this.types = this.__dod.types.clone(); }
  , clearData: function(format) { this.__requirerw(); this.__dod.clearData(format); this.types = this.__dod.types.clone(); }
  , files: []
  });

var DragOperationData = new Class(
  { sourcenode: null
  , data: {}
  , types: []
  , lasttarget: null
  , dropeffect: 'move'
  , effectAllowed: 'uninitialized'
  , options: {}
  , lasthandled: 0
  , dragimage: null

  , initialize: function(sourcenode, options)
    {
      this.sourcenode = sourcenode;
      this.options = options || {};
    }
  , getData: function(format)
    {
      return this.data[format];
    }
  , setData: function(format, data)
    {
      this.data[format] = data;
    }
  , clearData: function(format)
    {
      if (format)
      {
        delete data[format];
        this.types.erase(format);
      }
      else
      {
        this.types = [];
        this.data = {};
      }
    }
  , setDragImage: function(elt, x, y)
    {
      this.dragimage =
          { elt: elt
          , x: x
          , y: y
          };
    }
  });

function checkedDispatchEvent(el, event)
{
  var win = (el.ownerDocument ? el.ownerDocument.defaultView : null) || window;
  var saveonerror = win.onerror;

  //Save and pass on errors during event
  var eventerrormsg;
  win.onerror = function(errormsg)
  {
    if(saveonerror)
      saveonerror.apply(win, arguments);
    eventerrormsg=errormsg;
  }

  var result = el.dispatchEvent(event);
  win.onerror=saveonerror;

  if(eventerrormsg)
    throw "Error during event handler: " + eventerrormsg;
  return result;
}

function fireDNDEvent(eventtype, cx, cy, el, button, relatedtarget, dragop)
{
  // Handle current key stuff
  var ctrl = dragop.options.ctrl || (Browser.platform != "mac" && dragop.options.cmd);
  var meta = dragop.options.meta || (Browser.platform=="mac" && dragop.options.cmd);

  // Calculate protection of datatransfer object
  var mode = 'prot';
  if (eventtype == 'dragstart')
    mode = 'rw';
  else if (eventtype == 'drop')
    mode = 'r';

  var dataTransfer = new DataTransfer(dragop, 'rw');

  // Calc effectallowed / dropeffect
  // FIXME: figure out how these actually work & interact with event returns & setting of dropEffect/effectAllowed
  if ([ 'dragenter', 'dragover', 'drop', 'dragend' ].contains(eventtype))
  {
    if (Browser.name=="chrome" || Browser.name=="safari")
    {
      dataTransfer.dropEffect = 'none';
      dataTransfer.effectAllowed = ctrl ? dragop.options.shift ? "link" : "copy" : "all";
    }
    else if (Browser.name == "firefox")
    {
      dataTransfer.dropEffect = ctrl ? dragop.options.shift ? "link" : "copy" : "move";
    }
  }

  var doc = typeOf(el) == "document" ? el : el.ownerDocument;
  var result = true;
  if (Browser.name=="chrome" || Browser.name == "firefox" || Browser.name=="safari" || Browser.name=="ie")
  {
    // Create a mousevent to get correctly filled contents
    var mouseevent = doc.createEvent("MouseEvent");
    mouseevent.initMouseEvent(eventtype, true, true, doc.defaultView, 0/*clickcount? is 0 correct?*/, cx+25, cy+25, cx, cy,
                              ctrl||false, dragop.options.alt||false, dragop.options.shift||false, meta||false,
                              button, null, dataTransfer);

    // Can't update the dataTransfer attr, though. Create a htmlevent, and place all mousevent attrs in it
    // That one can be fired!
    var event = doc.createEvent("HTMLEvents");
    event.initEvent(eventtype, true, true);

    var keys = Object.keys(mouseevent);
    if (Browser.name == "firefox" || Browser.name=="ie" || Browser.name=="chrome")
    {
      // Chrome, firefox  & ie won't enumerate the properties.
      keys.combine(
          [ "altKey", "bubbles", "button", "buttons", "cancelBubble", "cancelable"
          , "clientX", "clientY", "ctrlKey", "currentTarget", "dataTransfer"
          , "defaultPrevented", "detail", "eventPhase"
          , "layerX", "layerY"
          , "metaKey"
          , "pageX", "pageY"
          , "relatedTarget", "screenX", "screenY", "shiftKey", "target", "timeStamp"
          , "view", "which"
          ]);

      if (Browser.name == "firefox")
      {
        keys.combine(
            [ "explicitOriginalTarget", "isChar", "isTrusted", "mozInputSource", "mozMovementX", "mozMovementY", "mozPressure"
            , "rangeOffset", "rangeParent", "region"
            ]);
      }
      else if (Browser.name=="ie")
      {
        keys.combine(
            [ "isTrusted", "srcElement", "toElement", "x", "y"
            ]);
      }
      else if (Browser.name=="chrome")
      {
        keys.combine(
            [ "fromElement", "keyCode", "movementX", "movementY", "offsetX", "offsetY", "returnValue", "srcElement"
            , "toElement", "webkitMovementX", "webkitMovementY", "x", "y"
            ]);
      }
    }

    for (var i = 0; i < keys.length; ++i)
      event[keys[i]] = mouseevent[keys[i]];

    event.dataTransfer = dataTransfer;
    result = checkedDispatchEvent(el, event);
  }
  else
    throw new Error("DND events not implemented for this browser");

  if (eventtype == 'dragstart' && result)
    dragop.effectAllowed = dataTransfer.effectAllowed;

  return result;
}

function getParents(node)
{
  var list = [];
  for(;node;node=node.parentNode)
    list.push(node);
  return list;
}
function fireMouseEventsTree(eventtype, cx, cy, el, button, relatedtarget, options)
{
  /* eventtype==mouseleave:
     - walk elparts upwards until we hit one of the relatedparents
     eventtype==mouseenter:
     - find the intersecting parent, walk downards to elparts
     */
  var elparents = getParents(el);
  var relatedparents = getParents(relatedtarget);
  var eventlist = [];

  Array.some(elparents, function(parent)
  {
    if(relatedparents.contains(parent) || parent.nodeType!=1)
      return true;
    eventlist.push(parent);
  });

  if(eventtype=="mouseenter")
  {
    eventlist=eventlist.reverse();
  }

  Array.each(eventlist, function(subel)
  {
    fireMouseEvent(eventtype, cx, cy, subel, button, relatedtarget, options);
  });
}
function fireMouseEvent(eventtype, cx, cy, el, button, relatedtarget, options)
{
  //https://developer.mozilla.org/en-US/docs/DOM/event.initMouseEvent
  //console.log("FireMouseEvent",eventtype,cx,cy,el,button,relatedtarget,options);
  var ctrl = options.ctrl || (Browser.platform != "mac" && options.cmd);
  var meta = options.meta || (Browser.platform=="mac" && options.cmd);
  var canBubble = !options.preventBubble;

  if (el.disabled)
    return true;

  var doc = typeOf(el) == "document" ? el : el.ownerDocument;
  var evt = doc.createEvent("MouseEvent");

  //console.log(arguments,typeof doc, typeof el, typeOf(doc), typeOf(el));
  //console.trace();
  evt.initMouseEvent(eventtype, canBubble, true, doc.defaultView, options.clickcount || 1, cx+25, cy+25, cx, cy,
                     ctrl||false, options.alt||false, options.shift||false, meta||false,
                     button, relatedtarget||null);

  return checkedDispatchEvent(el, evt);
}

function getElName(el)
{
  if (typeof el == "undefined")
    return;
  if (typeof el != "object")
    return el;
  return el.nodeName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className ? "." + el.className.split(" ").join(".") : "");
}

function setMouseCursor(x,y)
{
  if(!mousestate.cursorel || !mousestate.cursorel.ownerDocument.defaultView)
  {
    //FIXME reinstall mousecursor element into the dom if the page reloaded
    mousestate.cursorel = mousestate.lastdoc.createElement('div');
    mousestate.cursorel.style.cssText = 'position:fixed; z-index: 2147483647; width:14px; height:22px; background: url("/.blex_testsuite/jstests/mousepointer.png"); pointer-events:none;top:0;left:0';

    mousestate.lastdoc.body.appendChild(mousestate.cursorel);
  }

  if (mousestate.dndstate)
  {
    switch (mousestate.dndstate.dropeffect)
    {
      case 'copy': mousestate.cursorel.style.background = 'url("/.blex_testsuite/jstests/mousepointer_dragcopy.png")'; break;
      case 'link': mousestate.cursorel.style.background = 'url("/.blex_testsuite/jstests/mousepointer_draglink.png")'; break;
      default: mousestate.cursorel.style.background = 'url("/.blex_testsuite/jstests/mousepointer_dragmove.png")'; break;
    }
  }
  else
    mousestate.cursorel.style.background = 'url("/.blex_testsuite/jstests/mousepointer.png")';

  mousestate.cursorel.style.left = x+'px';
  mousestate.cursorel.style.top = y+'px';
}

function getBrowserFocusableElement(el)
{
  if(Browser.name!="ie")
    return getFocusableElement(el);

  /* https://msdn.microsoft.com/en-us/library/ie/ms534654%28v=vs.85%29.aspx
The following elements can have focus by default but are not tab stops.
These elements can be set as tab stops by setting the tabIndex property to a positive integer. applet, div, frameSet, span, table, td.
*/
  for(;el;el=el.parentNode)
  {
    if($wh.isFocusableComponent(el))
      return el;
    if(el.nodeName && ['APPLET','DIV','FRAMESET','SPAN','TABLE','TD'].contains(el.nodeName.toUpperCase()))
      return el;
  }
  return null;

}

function getFocusableElement(el)
{
  for(;el;el=el.parentNode)
    if($wh.isFocusableComponent(el))
      return el;
  return null;
}
// DND spec 8.7.5 pt. 1
function getDraggableElement(el)
{
  for(;el;el=el.parentNode)
    if (el.getAttribute)
    {
      if (el.getAttribute('draggable') == 'true')
        return { el: el, type: 'draggable', dist: 1 };
      if (el.nodeName.toLowerCase() == 'img')
        return { el: el, type: 'img', dist: 20 };
      if (el.nodeName.toLowerCase() == 'a' && el.href)
        return { el: el, type: 'a', dist: 20 };
    }
  return null;
}

function initDrag()
{
  if (!mousestate.dndcandidate)
    return;

  var dragop = new DragOperationData(mousestate.dndcandidate.draggable.el, mousestate.dndcandidate.part);
  if (fireDNDEvent("dragstart", mousestate.dndcandidate.cx, mousestate.dndcandidate.cy, mousestate.dndcandidate.draggable.el, 0, null, dragop))
  {
    var ctrl = mousestate.dndcandidate.part.ctrl || (Browser.platform != "mac" && mousestate.dndcandidate.part.cmd);
    var shift = mousestate.dndcandidate.part.shift;

    dragop.dropeffect = ctrl ? shift ? "link" : "copy" : "move";
    mousestate.dndstate = dragop;

    handleRunningDrag(mousestate.dndcandidate.part);
  }
  mousestate.dndcandidate = null;
}

function handleRunningDrag(options)
{
  // Process options
  mousestate.dndstate.options = options || {};
  mousestate.dndstate.lasthandled = new Date();

  var ctrl = options.ctrl || (Browser.platform != "mac" && options.cmd);
  var shift = options.shift;
  mousestate.dndstate.dropeffect = ctrl ? shift ? "link" : "copy" : "move";

  //console.log('handleRunningDrag', mousestate.lastoverel);
  if (fireDNDEvent("drag", mousestate.cx, mousestate.cy, mousestate.dndstate.sourcenode, 0, null, mousestate.dndstate))
  {
//    console.log('drag not cancelled');
    var lasttarget = mousestate.dndstate.lasttarget;
    if (mousestate.dndstate.lasttarget != mousestate.lastoverel)
    {
      if (mousestate.dndstate.lasttarget)
      {
        fireDNDEvent("dragexit", mousestate.cx, mousestate.cy, mousestate.dndstate.lasttarget, 0, null, mousestate.dndstate);
      }

      if (!fireDNDEvent("dragenter", mousestate.cx, mousestate.cy, mousestate.lastoverel, 0, null, mousestate.dndstate))
      {
//        console.log('dragenter cancelled');
        mousestate.dndstate.lasttarget = mousestate.lastoverel;
      }
      else
      {
//        console.log('dragenter not cancelled');
        // FIXME: dropzone stuff

        fireDNDEvent("dragenter", mousestate.cx, mousestate.cy, document.body, 0, null, mousestate.dndstate);
        mousestate.dndstate.lasttarget = document.body;
      }
    }
    if (lasttarget && lasttarget != mousestate.dndstate.lasttarget)
    {
      fireDNDEvent("dragleave", mousestate.cx, mousestate.cy, lasttarget, 0, null, mousestate.dndstate);
    }

    if (fireDNDEvent("dragover", mousestate.cx, mousestate.cy, mousestate.lastoverel, 0, null, mousestate.dndstate))
    {
//      console.log('dragover cancelled');
      // dropeffect stuff

    }
//    else console.log('dragover not cancelled');
  }
  else
  {
    console.log('drag cancelled');
    finishCurrentDrag(true, options);
  }
}

// DnD
function finishCurrentDrag(cancel, options)
{
  // Process options
  mousestate.dndstate.options = options;

  var ctrl = options.ctrl || (Browser.platform != "mac" && options.cmd);
  var shift = options.shift;
  mousestate.dndstate.dropeffect = ctrl ? shift ? "link" : "copy" : "move";

  if (cancel)
  {
    if (mousestate.lastoverel)
    {
      fireDNDEvent("dragleave", mousestate.cx, mousestate.cy, mousestate.lastoverel, 0, null, mousestate.dndstate);
    }
  }
  else
  {
    if (fireDNDEvent("drop", mousestate.cx, mousestate.cy, mousestate.lastoverel, 0, null, mousestate.dndstate))
    {

    }

    fireDNDEvent("dragend", mousestate.cx, mousestate.cy, mousestate.dndstate.sourcenode, 0, null, mousestate.dndstate);
  }
  mousestate.dndstate = null;
}

window.getValidatedElementFromPoint = function(doc,px,py,expectelement)
{

  var scroll = {x:0,y:0}; // actually breaks the ui.menu test.... var scroll = safe_id(doc.body).getScroll();
  var lookupx = /*Math.floor*/(px - scroll.x);
  var lookupy = /*Math.floor*/(py - scroll.y);

  // In Internet Explorer, elementFromPoint only returns elements that are actually within the browser viewport, so if we're
  // trying to lookup an element that is currently not visible, we'll scroll the main document so the iframe lookup position
  // is in view.
  if (Browser.name=="ie" && doc.window.frameElement)
  {
    var maindoc = doc.window.frameElement.ownerDocument;
    var mainwin = maindoc.window;

    // Get the position of the iframe within the main window
    var docpos = doc.window.frameElement.getPosition();
    // Get the main window size and scroll position
    var winsize = mainwin.getSize();
    var docscroll = safe_id(maindoc.body).getScroll();

    // The absolute lookup position (relative to the browser's top left corner)
    var abslookupx = lookupx + docpos.x - docscroll.x;
    var abslookupy = lookupy + docpos.y - docscroll.y;

    // If the lookup position is not located within the visible viewport, try to scroll it into view
    if (abslookupx < 0)
      docscroll.x += abslookupx;
    else if (abslookupx > winsize.x)
      docscroll.x += (abslookupx - winsize.x) + 1;
    if (abslookupy < 0)
      docscroll.y += abslookupy;
    else if (abslookupy > winsize.y)
      docscroll.y += (abslookupy - winsize.y) + 1;

    maindoc.body.scrollTo(docscroll.x, docscroll.y);
  }

  // Make sure mouse cursor element is hidden, so it doesn't interfere
  if (mousestate.cursorel)
  {
    try
    {
      mousestate.cursorel.style.display = "none";
    }
    catch(e) //IE may throw "Permission denied"
    {
      if(Browser.name!="ie")
         throw e; //mousestate.lastoverel may cause permission denieds on IE (8, 10 and 11 seen)
      mousestate.cursorel=null; //the mouse cursor was probably on an unloaded screen. deallocate it
    }
  }
  var el = doc.elementFromPoint(lookupx, lookupy);
  if (mousestate.cursorel) mousestate.cursorel.style.display = "";
  //console.log(px,py,lookupx,lookupy,el);

  if(!el && expectelement)
  {
    console.log("Unable to find element at location " + lookupx + "," + lookupy + " bodypos: " + px + "," + py + " with scroll " + scroll.x + "," + scroll.y);
    setMouseCursor(lookupx, lookupy);
  }
  if(el)
  {
    var bound = el.getBoundingClientRect();
    if(! ( bound.top <= lookupy && lookupy < bound.bottom+1 && bound.left <= lookupx && lookupx < bound.right+1))
    {
      console.log(lookupx, lookupy, bound, el, expectelement);
      console.warn("elementFromPoint lied to us!");
    }
    //console.log(el,bound,scroll.x,scroll.y);
  }
  return el;
}

function convertbndrec(elt)
{
  if (!elt.getBoundingClientRect)
    return 'n/a';
  var rec = elt.getBoundingClientRect();
  return JSON.encode({ left: rec.left, top: rec.top, right: rec.right, bottom: rec.bottom });
}

function onMouseDocUnload(event)
{
  if(mousestate.cursorel && mousestate.cursorel.parentNode)
    mousestate.cursorel.parentNode.removeChild(mousestate.cursorel);
  mousestate.cursorel=null;
}

function processGestureQueue()
{
  if(mousestate.gesturetimeout)
  {
    clearTimeout(mousestate.gesturetimeout);
    mousestate.gesturetimeout=null;
  }

  var now = Date.now();

  while(mousestate.gesturequeue.length)
  {
    var part = mousestate.gesturequeue[0];
    if(!part.start)
    {
      part.start = now;
      part.startx = mousestate.cx;
      part.starty = mousestate.cy;
    }

    var position;
    if(part.el)
    {
      // Get relative x/y within part.el
      position = getPartPosition(part);

      // Make sure requested point is in view
      $wh.scrollToElement(part.el, { x: position.relx, y: position.rely });
      position = getPartPosition(part);

      //console.log("We think el",part.el,"is at",position.x,position.y);
    }
    else
      position = {x:part.startx + (part.relx || 0),y:part.starty + (part.rely || 0)};

    if (typeof part.clientx == 'number')
      position.x = /*Math.floor*/(part.clientx);
    if (typeof part.clienty == 'number')
      position.y = /*(Math.floor*/(part.clienty);

    var currentdoc = (part.doc ? part.doc : part.el ? part.el.ownerDocument : mousestate.lastdoc);
    if(!currentdoc)
      throw new Error("Lost track of document");
    mousestate.lastdoc = currentdoc;

    var win = currentdoc.defaultView;
    if(mousestate.lastwin != win)
    {
      if(mousestate.lastwin && mousestate.lastwin.removeEventListener)
        mousestate.lastwin.removeEventListener('unload', onMouseDocUnload);

      mousestate.lastwin = win;
      if(mousestate.lastwin && mousestate.lastwin.addEventListener)
        mousestate.lastwin.addEventListener('unload', onMouseDocUnload);
    }

    //Make sure the point is visible, but only if we're going to click on it
    var elhere = getValidatedElementFromPoint(currentdoc, position.x, position.y, true);
    if(!elhere)
    {
      elhere = currentdoc.documentElement;
      console.error("Unable to find element at location " + position.x + "," + position.y);
    }

    if(part.el&&elhere != part.el && typeof part.down == 'number') //we only need to validate on mousedown, mouseup is common to hit something diferent
    {
      if(!part.el.contains(elhere))
      {
        console.log("Wanted to target: ", part.el, " at " + position.x + "," + position.y," but actual element is:", elhere, part);
        var xrec = part.el.getBoundingClientRect();

        console.log("Original target", part.el, part.el.nodeName, convertbndrec(part.el));
        console.log("Final target", elhere, elhere.nodeName, convertbndrec(elhere));
        var fc = elhere.firstChild;
        if (fc)
          console.log("childtarget", fc, fc.nodeName, convertbndrec(fc));

//        console.log('partel', part.el.innerHTML);
//        console.log('elhere', elhere.innerHTML);

        var partel=part.el;
        (function()
         {
          console.log("AFTER DELAY: Original target", partel, partel.nodeName, partel.getBoundingClientRect());
          console.log("AFTER DELAY: Final target", elhere, elhere.nodeName, elhere.getBoundingClientRect());
         }).delay(400);
        throw new Error("Final target element is not a child of the original target! Perhaps target was obscured at the time of the mouse action ?");
      }
    }

    var targetdoc = elhere == currentdoc ? elhere : elhere.ownerDocument;

    //console.log("Get element@" + position.x + "," + position.y + " ",getElName(elhere),elhere, " was ",getElName(part.el),part.el, targetdoc&&targetdoc.defaultView?targetdoc.defaultView.getScroll().y:'-');

    var target = { view: targetdoc.parentView
                 , cx: position.x
                 , cy: position.y
                 , el: elhere
                 }

    //interpolate mousemove events
    if(mousestate.cx != target.cx || mousestate.cy != target.cy)
    {
      var progress = Math.min(1,part.at > part.start ? (now - part.start) / (part.at - part.start) : 1);
      if (typeof part.transition == "function")
        progress = part.transition(progress);
      //console.log("start=" + part.start + ", at=" + part.at + ", now=" + now + ", progress=" + progress);

      mousestate.cx = part.startx + progress * (target.cx - part.startx);
      mousestate.cy = part.starty + progress * (target.cy - part.starty);

      //console.log("requesting element at " + reqx + "," + reqy);
      var elhere = getValidatedElementFromPoint(currentdoc, mousestate.cx, mousestate.cy, false);
      if (!elhere)
        elhere = targetdoc;

      //console.log("progress " + progress + "  target: " + target.cx + "," + target.cy + " cur: " +mousestate.cx+ "," + mousestate.cy + " elhere=",elhere);

      if (mousestate.dndcandidate && Math.abs(mousestate.cx - mousestate.dndcandidate.cx) + Math.abs(mousestate.cy - mousestate.dndcandidate.cy) > mousestate.dndcandidate.draggable.dist)
        initDrag();

      // DnD suppresses mouseout/over/move events
      if (mousestate.dndstate)
      {
        mousestate.lastoverel = elhere;

        if (now - mousestate.dndstate.lasthandled > 350)
          handleRunningDrag(part);
      }
      else
      {
        var elchanged;
        try
        {
          elchanged = mousestate.lastoverel != elhere
        }
        catch(e)
        {
          if(Browser.name!="ie")
             throw e; //mousestate.lastoverel may cause permission denieds on IE

          mousestate.lastoverel = null;
          elchanged = true;
        }

        if(mousestate.lastoverel != elhere)
        {
          var intersectingelement = null;
          if(mousestate.lastoverel && mousestate.lastoverel.ownerDocument && mousestate.lastoverel.ownerDocument.defaultView) // don't fire events for nonexisting documents
          {
            var canfire = true;
            // Edge causes permission denied throws when accessing a freed window
            try { mousestate.lastoverel.ownerDocument.defaultView.onerror } catch (e) { canfire = false; }

            if (canfire)
            {
              fireMouseEvent("mouseout", mousestate.cx, mousestate.cy, mousestate.lastoverel, 0, elhere, part);
              if ("onmouseenter" in window)
                fireMouseEventsTree("mouseleave", mousestate.cx, mousestate.cy, mousestate.lastoverel, 0, elhere, Object.merge({ preventBubble: true }, part));
            }
            else
              mousestate.lastoverel = null;
          }

          fireMouseEvent("mouseover", mousestate.cx, mousestate.cy, elhere, 0, mousestate.lastoverel, part);
          if ("onmouseenter" in window)
            fireMouseEventsTree("mouseenter", mousestate.cx, mousestate.cy, elhere, 0, mousestate.lastoverel, Object.merge({ preventBubble: true }, part));
          mousestate.lastoverel = elhere;
        }

        fireMouseEvent("mousemove", mousestate.cx, mousestate.cy, elhere, 0, null, part)
      }
    }
    //console.log("mouse now at " + mousestate.cx + "," + mousestate.cy);
    setMouseCursor(mousestate.cx, mousestate.cy);

    if(part.at > now) //in the future
    {
      mousestate.gesturetimeout = setTimeout(processGestureQueue, 1000 / mousestate.samplefreq);
      return;
    }

    if(typeof part.down == 'number')
    {
      if(mousestate.downbuttons.contains(part.down))
        throw new Error("Invalid mouse gesture - sending down for button #" + part.down + " when it is aleady down");
      if(part.down==0)
      {
        mousestate.downel = target.el;
        mousestate.downelrect = target.el ? target.el.getBoundingClientRect() : null;
      }

      if (!mousestate.dndstate)
      {
        if(fireMouseEvent("mousedown", target.cx, target.cy, target.el, part.down, null, part))
        {
          //mousedown was not prevented, set focus
          var tofocus = getBrowserFocusableElement(target.el);
          //console.log("TOFOCUS",target.el,tofocus);
          if(tofocus)
            tofocus.focus();
          else if (currentdoc.activeElement)
          {
            currentdoc.activeElement.blur();
          }
        }

        if(part.down==2) //RMB
          fireMouseEvent("contextmenu", target.cx, target.cy, target.el, part.down, null, part);

        if (part.down == 0) // DND
        {
          var draggable = getDraggableElement(target.el); // FIXME text selections?
          if (draggable)
            mousestate.dndcandidate =
              { draggable: draggable
              , cx: target.cx
              , cy: target.cy
              , part: part
              };
        }
      }

      //ADDME discover cancellation etc and properly handle those
      mousestate.downbuttons.push(part.down);
    }
    else if(typeof part.up == 'number')
    {
      if(!mousestate.downbuttons.contains(part.up))
        throw new Error("Invalid mouse gesture - sending up for button #" + part.up + " when it is not down");

      //FIXME see above for missing event parameters

      if (!mousestate.dndstate)
        fireMouseEvent("mouseup", target.cx, target.cy, target.el, part.up, null, part);

      mousestate.downbuttons.erase(part.up);

      //Is this a click? (start and end is same element. ADDME doesn't work this way if drag is triggered, ie on button: mousedown,move,up = click, on link: mousedown,move,up = dragging)
      if(part.up==0)
      {
        mousestate.dndcandidate = null;
        if (!mousestate.dndstate)
        {
          if(target.el && target.el==mousestate.downel)
          {
            var previousclickisdownel = false;
            try
            {
              previousclickisdownel = mousestate.previousclickel == mousestate.downel;
            }
            catch (e)
            {
              if (Browser.name!="ie")
                throw e;
              mousestate.previousclickel = null;
            }

            var clickcount = 1;
            if(mousestate.previousclickel == mousestate.downel
                  && (Date.now() - mousestate.previousclicktime) < 100
                  && (Math.abs(mousestate.previousclickpos.cx - target.cx) <= 2)
                  && (Math.abs(mousestate.previousclickpos.cy - target.cy) <= 2))
            {
              clickcount = mousestate.previousclickpos.clickcount + 1;
            }

            mousestate.previousclickel = mousestate.downel;
            mousestate.previousclicktime = Date.now();
            mousestate.previousclickpos = { cx: target.cx, cy: target.cy, clickcount: clickcount };

            var allowclick = fireMouseEvent("click", target.cx, target.cy, target.el, part.up, null, part);

            if (clickcount == 2)
              fireMouseEvent("dblclick", target.cx, target.cy, target.el, part.up, null, { clickcount: clickcount });
          }
          else if(mousestate.downel && mousestate.downelrect)
          {
            var curloc = mousestate.downel.getBoundingClientRect();
            if(curloc)
            {
              if(curloc.top != mousestate.downel.top
                 || curloc.left != mousestate.downel.left
                 || curloc.right != mousestate.downel.right
                 || curloc.bottom != mousestate.downel.bottom)
              {
                console.log("Not generating a 'click' as 'down' target moved away during mouse action",mousestate.downel,'last location',mousestate.downelrect,'current',curloc);
              }
            }
          }
          mousestate.downel = null;
        }
        else
        {
          handleRunningDrag(part);
          finishCurrentDrag(false, part);
        }
      }
    }

    mousestate.gesturequeue.splice(0,1); //pop front gesture
  }

  var callbacks = mousestate.waitcallbacks;
  mousestate.waitcallbacks=[];
  callbacks.each(function(callback) { callback(); });
}
/* sending complex mouse gestures
   down/up: mouse button to press/depress. 0=standard (left), 1=middle, 2=context (right) .. */
window.sendMouseGesture=function(gestureparts)
{
  //Calculate execution time for the gestures
  var at = Date.now();
  for(var i=0;i<gestureparts.length;++i)
  {
    at += gestureparts[i].delay || 0;
    gestureparts[i].at = at;
  }

  //Queue up the gestures
  mousestate.gesturequeue.append(gestureparts);
  //Execute gestures now
  processGestureQueue();
}


//send a simple mouseclick.
window.sendMouseClick=function(element, options)
{
  testapi.click(element,options);
}

window.testFireKeyboardEvent = function(target, eventname, keycode, charcode)
{
  var result = true;
  var doc = target.ownerDocument;
  //http://stackoverflow.com/questions/10455626/keydown-simulation-in-chrome-fires-normally-but-not-the-correct-key
  var evt = doc.createEvent(Browser.name=="safari" ? "Event" : "KeyboardEvent"); //Safari KeyboardEvent has a readonly keyCode. use a standard Event..

  if(evt.initKeyboardEvent)//FIXME verify codes for CR
  {
    if(Browser.name=="ie")
    {
      evt.initKeyboardEvent(eventname, true, true, doc.defaultView, 'cr',0,'', false,null);

    }
    else
    {
//      console.log('initkeybardevent');
      //evt.initKeyboardEvent(eventname, true, true, doc.defaultView, false, false, false, false, keycode, charcode);
      evt.initKeyboardEvent(eventname, true, true, doc.defaultView, ' ', 0, false, false, false, false); //ctrl,alt,shift,meta
      //console.log(evt);
    }
  }
  else if(evt.initKeyEvent)
  {
    //evt.initKeyEvent(eventname, true, true, doc.defaultView, false, false, false, false, 32,32);
    evt.initKeyEvent(eventname, true, true, doc.defaultView, false, false, false, false, keycode, 0);
    return checkedDispatchEvent(target, evt);
//////////////
  }
  else
  {
    evt.initEvent(eventname, true, true);
  }

  evt.charCode=charcode;

  // Chromium Hack
  if(Browser.name=="chrome" || Browser.name=="ie")
  {
    Object.defineProperty(evt, 'keyCode', {
                get : function() {
                    return this.keyCodeVal;
                }
    });
    Object.defineProperty(evt, 'which', {
                get : function() {
                    return this.keyCodeVal;
                }
    });
    evt.keyCodeVal = keycode;
  }
  else
  {
    evt.keyCode = keycode;
  }

  //object.initKeyEvent (eventName, bubbles, cancelable, view, ctrlKey, altKey, shiftKey, metaKey, keyCode, charCode);
  result = checkedDispatchEvent(target, evt);
  $wh.fireHTMLEvent(target,'input');
  return result;
}

window.testSendKeyPress = function(key)
{
  //Figure out which element has focus
  var focused = $wh.getCurrentlyFocusedElement();

  /* Create the proper events. See also
     - http://help.dottoro.com/ljhlvomw.php
     - http://unixpapa.com/js/key.html */

  var keymap = { cr:13, tab:9, esc:27
               , down: 40, up: 38, left: 37, right: 39
               };

  if(typeof keymap[key] != 'undefined')
  {
    testFireKeyboardEvent(focused, 'keydown', keymap[key], 0);
    testFireKeyboardEvent(focused, 'keypress', keymap[key], 0);
    testFireKeyboardEvent(focused, 'keyup', keymap[key], 0);
  }
  else if(key.length==1)
  {
    var code = key.charCodeAt(0);
    var retval = testFireKeyboardEvent(focused, 'keydown', code, code);
    testFireKeyboardEvent(focused, 'keypress', code, code);
    if(retval)
    {
      //ADDME textInput event? http://stackoverflow.com/questions/4158847/is-there-a-way-to-simulate-key-presses-or-a-click-with-javascript
      focused.value += key; //ADDME proper selection handling
    }
    testFireKeyboardEvent(focused, 'keyup', code, code);
  }
  else
  {
    return console.error("Unsupported key");
  }
}

function debugKeyEvent(event)
{
  console.log("KBD " + event.type,"keycode=",event.keyCode,"charcode=",event.charCode,"event=",event);
}



window.sendFocusChange=function(dir)
{
  //ADDME: allfocus is not in tabindex order!
  var curfocus = $wh.getCurrentlyFocusedElement(), allfocus = $wh.getAllFocusableComponents();
  if(!curfocus)
    throw new Error("Unable to determine currently focused element");

  var curpos = allfocus.indexOf(curfocus);
  if(curpos==-1 && curfocus != curfocus.ownerDocument.body)
  {
    console.log("currentfocus",curfocus);
    console.log("all",allfocus.length,allfocus);
    throw new Error("Unable to find currently focused element in the list of all focusable elements");
  }

  curpos+=dir;
  while(curpos<0)
    curpos += allfocus.length;
  curpos %= allfocus.length;

  try { allfocus[curpos].focus(); }
  catch (e) {}

  var nowfocused = $wh.getCurrentlyFocusedElement();
  if(allfocus[curpos] != nowfocused) //if an element is actally unfocusable, the browser just tends to ignore us (except IE, which loves to throw)
  {
    console.log("Tried to focus",allfocus[curpos]);
    console.log("Actually focused", nowfocused);
    allfocus[curpos].style.backgroundColor = "#ff0000";
    nowfocused.style.backgroundColor = "#00ff00";
    throw new Error("Setting focus failed!");
  }
}

window.setupKeyboardDebugEvents=function(win)
{
  if(win.haskbddebug)
    return;
  win.haskbddebug=true;

  if(win.addEventListener)
  {
    win.addEventListener('keydown', debugKeyEvent, true);
    win.addEventListener('keypress', debugKeyEvent, true);
    win.addEventListener('keyup', debugKeyEvent, true);
  }
}

window.checkBSN=function(bsn)
{
  bsn=''+bsn;
  if(bsn.length!=9 || !(parseInt(bsn,10) > 1000000))
    return false;

  var check= 9*parseInt(bsn[0]) + 8*parseInt(bsn[1]) + 7*parseInt(bsn[2])
           + 6*parseInt(bsn[3]) + 5*parseInt(bsn[4]) + 4*parseInt(bsn[5])
           + 3*parseInt(bsn[6]) + 2*parseInt(bsn[7]) - 1*parseInt(bsn[8]);
  return (check%11)==0;
}
window.generateBSN=function()
{
  //sofinummers lopen vanaf 00100000x t/m 39999999x
  var basesofi = Math.floor(Math.random() * (399999900-1000000) + 1000000);
  while(true)
  {
    var propersofi = ('00000000' + basesofi).slice(-9);
    if(checkBSN(propersofi))
      return propersofi;
    ++basesofi;
  }
}

window.resetTestState = function()
{
  mousestate = Object.clone(default_mousestate);
}

function Base64EncodeArray(input)
{
  var output = "";
  var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  var i = 0;
  var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  while (i < input.length)
  {
    chr1 = input[i++];
    chr2 = input[i++];
    chr3 = input[i++];

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;

    if (!(chr2+1))
      enc3 = enc4 = 64;
    else if (!(chr3+1))
      enc4 = 64;

    output = output +
      keyStr.charAt(enc1) + keyStr.charAt(enc2) +
      keyStr.charAt(enc3) + keyStr.charAt(enc4);
  }

  return output;
}

var injected = false;
function ensureInjectedScript()
{
  if (injected)
    return;
  var scriptTag = document.createElement('script');
  scriptTag.type = 'text/vbscript';
  scriptTag.text = [
      'Function getIEByteArray(byteArray, out)',
          'Dim len, i',
          'len = LenB(byteArray)',
          'For i = 1 to len',
              'out.push(AscB(MidB(byteArray, i, 1)))',
          'Next',
      'End Function'
  ].join('\n');
  document.head.appendChild(scriptTag);
  injected = true;
}

if (Browser.name=="ie" && Browser.version <= 9)
  ensureInjectedScript();

var FakeUploadSession = new Class(
{ blobs: []
, initialize:function(files, donecallback)
  {
    this.files = files;
    this.donecallback = donecallback;
    Array.each(files, function()
    {
      this.blobs.push(null);
    }.bind(this));
  }
, runUpload:function(inputnode, callback)
  {
    var self=this;
    this.inputnode = inputnode;

    Array.each(this.files, function(file, idx)
    {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', file.url, Browser.name!="ie");

      xhr.responseType = 'arraybuffer';
      xhr.onload = function(e)
      {
        if (this.status == 200)
        {
          // Create a blob with the response's Content-Type as file type
          var blob = new Blob([this.response], { type: xhr.getResponseHeader("Content-Type") });
          if(file.filename)
            blob.name = file.filename;
          self.doneUpload(blob, idx);
        }
      };
      xhr.send();
    });
  }
, doneUpload:function(blob, idx)
  {
    if(this.blobs[idx])
      throw "Duplicate upload completion for blob #" + idx;
    this.blobs[idx] = blob;
    if(this.blobs.clean().length < this.blobs.length) //we don't have all files yet
      return;

    if (Browser.name=="ie" && Browser.version <= 9) //FIXME are we sure we want ot use createEventObject here ?
    {
      console.trace();
      var evt = inputnode.ownerDocument.createEventObject();
      evt.screenX = 25;
      evt.screenY = 25;
      evt.clientX = 0;
      evt.clientY = 0;
      evt.button = 0;
      evt.relatedTarget = inputnode;
      evt.ctrlKey = false;
      evt.altKey = false;
      evt.shiftKey = false;
      evt.metaKey = false;
      evt.wh_fake_files = this.blobs;

      if (inputnode._fireEvent) //note: we are assuming the returnvalue of fireEvent corresponds to preventDefault, but not sure..
        inputnode._fireEvent('onchange', evt);
      else
        inputnode.fireEvent('onchange', evt);
    }
    else
    {
      this.inputnode.fireEvent("change", { wh_fake_files: this.blobs });
    }

    if (this.donecallback)
      this.donecallback.delay(1);
  }
, runUpload_IE89: function(inputnode, callback ) //IE<=9 fallback
  {
    this.inputnode = inputnode;
    var self = this;

    Array.each(this.files, function(file,idx)
    {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(e)
      {
        if (xhr.readyState != 4)
          return;

        // IE until 9 have a Array of Bytes in xhr.responseBody. In IE9 we can use VBArray(arr).toArray()
        // but in IE8 we need VBScript code. Also works in IE9, so we'll just use the VBScript stuff.
        var x = xhr.responseBody;
        var byteArray = [];
        getIEByteArray(x, byteArray);
        var b64encoded = Base64EncodeArray(byteArray);

        if (this.status == 200)
        {
          self.doneUpload({ data: b64encoded, name: file.filename }, idx);
        }
      };

      // Synchronous request!! Needed to emulate blocking file select.
      xhr.open('GET', file.url, false);
      // On IE, the request is synchronous and the onreadystatechange / onload should be called immediately
      // need that to emulate blocking file dialog.
      xhr.send();
    });
  }
});

window.prepareUploadTest = function(node, files, donecallback)
{
  var win = node.self===node ? node : node.ownerDocument.defaultView;
  if(win.$wh.__debug_fake_upload)
    throw "The window already has a pending upload";

  var uploadclass = new FakeUploadSession(files,donecallback);
  var uploader = (Browser.name=="ie" && Browser.version <= 9) ? uploadclass.runUpload_IE89 : uploadclass.runUpload;
  win.$wh.__debug_fake_upload = uploader.bind(uploadclass);
}

window.testDuplicateSlickIds = function(doc)
{
  var ids={};
  Array.each(doc.getElementsByTagName("*"),
    function(el)
    {
      if(!el.uniqueNumber)
        return;
      if(ids[el.uniqueNumber])
      {
        console.log("Duplicate slick #" + el.uniqueNumber, ids[el.uniqueNumber], el);
      }
      else
      {
        ids[el.uniqueNumber] = el;
      }
    });
}

window.testNLAddressLookup = function(zip, nrdetail, callback)
{
  if(zip=='7521 AM')
  {
    if(nrdetail == '296')
    {
      callback.delay(1,null,{success:true, street: 'Hengelosestraat', city: 'ENSCHEDE' });
      return;
    }
  }
  callback.delay(1, null,{success:false});
}

window.testClickElement = function(link,name,waits)
{
  if(!name)
    name = "Click: " + link;
  return { name: name
         , test: function(doc,win)
                 {
                   var elts = win.$$(link);
                   if(elts.length == 0)
                   {
                     //woonplaats sometimes triggers this, testing...
                     console.log(win.$('contentcolumn') ? win.$('contentcolumn').get('html') : '');
                     throw new Error("No elements returned by selector: " + link);
                   }
                   sendMouseClick(elts[0]);
                 }
         , waits: (waits || ["pageload"])
         }
}

/** @short Generate a test that processes a wrd authentication debugmode redirect page. Store the source of the redirect page into window.wrdauth_lastredirectsource
*/
window.testFollowWRDAuthRedirect = function(name, waits)
{
  return { name: name || 'testFollowWRDAuthRedirect'
         , loadpage: function(doc,win)
           {
             if(!doc.getElementById('redirectto'))
               throw new Error("Expected a #redirectto with the redirect url, but nothing found");
             console.log("Step '" + name + "': Page " + doc.location.href + " redirects us to: " + doc.getElementById('redirectto').href);
             window.wrdauth_lastredirectsource = doc.getElementById('redirectto');
             return doc.getElementById('redirectto').href;
           }
         , waits: waits
         }
}

var testx=0;
var TestApi = new Class(
{
  buttonsources: [ { selector:'input[type="submit"],input[type="reset"]', property:'value' }
                 , { selector:'button', property:'text' }
                 ]

, initialize:function()
  {
  }
, getOpenMenu:function()
  {
    return $$t('ul.wh-menulist.open').getLast();
  }
, getWindow:function()
  {
    return testfw.pageframewin;
  }
, getDoc:function()
  {
    return testfw.pageframedoc;
  }
, isElementClickable: function(element, x, y)
  {
    if(!element)
      return false;

    var atpos = getPartPosition({el:element,x:x, y:y});

    // Make sure mouse cursor element is hidden, so it doesn't interfere
    if (mousestate.cursorel) mousestate.cursorel.style.display = "none";
    var elhere = element.ownerDocument.elementFromPoint(atpos.x, atpos.y);
    if (mousestate.cursorel) mousestate.cursorel.style.display = "";

    //console.log('isElementClickable', element,atpos,elhere,element.getBoundingClientRect(), elhere && elhere.getBoundingClientRect());
    return element.contains(elhere);
  }
, setFormsapiFileElement: function (el, filedata, filename)
  {
    //formsapi permits a hack to allow us to fake submissions to input type=file fields
    //unfortunately we can't change the type of an input element, so we'll have to recreate it

    var newinput = el.ownerDocument.createElement('input');
    newinput.name = el.name + '$filename=' + filename
    newinput.type = 'text';
    newinput.value = filedata;
    newinput.id = el.id;
    el.parentNode.replaceChild(newinput,el);

    $(el).destroy();
  }
, lookupButtons:function(buttontext)
  {
    var candidates = [];
    this.buttonsources.forEach(function(candidate)
    {
      var matches = $$t(candidate.selector).filter(function (el) { return el.get(candidate.property) === buttontext });
      candidates.append(matches);
    }, this);
    return candidates;
  }

, _resolveToSingleElement:function(element)
  {
    if(typeOf(element)=="elements") //it's a $$ result
    {
      if(element.length==0)
        throw new Error("Passed an empty $$()");
      if(element.length>1)
      {
        console.log(element);
        throw new Error("Passed multiple elements using $$(), make sure the selector only matches one!");
      }
      return element[0];
    }
    else if(typeof element == "string")
    {
      var elements = $$t(element);
      if(elements.length==0)
        elements = $$t('*[id="' + element + '"]');
      if(elements.length==0)
        elements = $$t('*[name="' + element + '"]');
      if(elements.length==0)
        throw new Error("Selector '" + element + "'' evaluated to no elements");
      if(elements.length>1)
      {
        console.log(elements);
        throw new Error("Selector '" + element + "'' evaluated to multiple elements, make sure the selector only matches one!");
      }
      return elements[0];
    }

    if(!element)
    {
      throw new Error("Invalid element passed");
    }
    return element;
  }

, click:function(element, options)
  {
    element = this._resolveToSingleElement(element);

    if(element && element.retrieve)
    {
      var replacedby = element.retrieve("wh-ui-replacedby");
      if(replacedby)
        element=replacedby;
    }
    var x = options && "x" in options ? options.x : "50%";
    var y = options && "y" in options ? options.y : "50%";

    window.sendMouseGesture([ { el: element, down: 0, cmd: options&&options.cmd, shift: options&&options.shift, alt: options&&options.alt, ctrl: options&&options.ctrl, meta: options&&options.meta, x: x, y: y}
                            , {              up: 0,   cmd: options&&options.cmd, shift: options&&options.shift, alt: options&&options.alt, ctrl: options&&options.ctrl, meta: options&&options.meta}
                            ]);
  }
, registerButtonSource:function (selector,property)
  {
    this.buttonsources.push({selector:selector,property:property});
  }
, clickButton:function(buttontext)
  {
    var candidates=this.lookupButtons(buttontext);
    if(candidates.length==0)
      throw new Error("No buttons found for buttonlabel '" + buttontext +"'");
    if(candidates.length>1)
    {
      console.log("Candidates for buttonlabel '" + buttontext +"'");
      Array.each(candidates, function(candidate) { console.log(candidate) });
      throw new Error("Found " + candidates.length + " for buttonlabel '" + buttontext +"'");
    }
    this.click(candidates[0]);
  }
, fill:function(element,newvalue)
  {
    element = this._resolveToSingleElement(element);
    $wh.getFocusableElement(element).focus();
    $wh.changeValue(element, newvalue);
  }
, getTestSiteRoot:function()
  {
    var topdoc = window.parent.document.documentElement;
    if(!topdoc.hasAttribute("data-testsiteroot"))
      throw new Error("No testsite specified for this test");
    return topdoc.getAttribute("data-testsiteroot");
  }
});

window.$t = window.parent.$t;
window.$$t = window.parent.$$t;
window.testapi = new TestApi;
window.isElementClickable=testapi.isElementClickable;

window.getListViewHeader = function(text)
{
  var headers = $$t('#listview .listheader > span:contains("' + text + '")');
  if(headers.length>1)
    console.error("Multiple header matches for '" + text + "'");
  return headers.length==1 ? $t(headers[0]) : null;
}
window.getListViewRow = function(text) //simply reget it for every test, as list may rerender at unspecifide times
{
  var rows = $$t('#listview .listrow:contains("' + text + '")');
  if(rows.length>1)
    console.error("Multiple row matches for '" + text + "'");
  return rows.length==1 ? $t(rows[0]) : null;
}
window.getListViewExpanded = function(row)
{
  if(row.getElement('span:contains("\u25BE")'))
    return true;
  if(row.getElement('span:contains("\u25B8")'))
    return false;
  return null;
}

// ---------------------------------------------------------------------------
//
// Selenium support
//

var rpc;
var scheduledefer;

/** Schedules a selenium post. Returns a promise that will be fulfilled when the query has finished
*/
function doSeleniumRequest(method, params)
{
  if (!seleniumhost || !seleniumsession || !serviceuri)
    throw new Error("This test must be run with selenium!");

  if (!rpc)
  {
    rpc = new $wh.JSONRPC({ url: serviceuri });
    scheduledefer = Promise.defer();
    scheduledefer.resolve(true);
  }

  var newdefer = Promise.defer();

  // Wait until current request is done, then schedule the new one.
  //console.error('promise', scheduledefer.promise);
  scheduledefer.promise["finally"](function()
  {
    // Replace the scheduledefer by the new deferred promise
    scheduledefer = newdefer;

    var topass = [ testsession, method, params ? Array.from(params) : [] ];
    rpc.request("SeleniumRequest", topass, function(result)
    {
      newdefer.resolve(result.value);
    }, function(e)
    {
      newdefer.resolve(function() { throw new Error("RPC request failed " + e); });
    });
  });

  return newdefer.promise;
}

var id_counter = 0;
function requireElementId(element)
{
  element = safe_id(element);
  if (!element.id)
    element.id = "__selenium_" + (++id_counter);
  return element.id;
}

$selenium =
{ // Testframe used for element lookups
  framepath: [ 'testframe' ]

, _keys:
      { "add": '\ue025'
      , "alt": '\ue00a'
      , "arrow_down": '\ue015'
      , "arrow_left": '\ue012'
      , "arrow_right": '\ue014'
      , "arrow_up": '\ue013'
      , "backspace": '\ue003'
      , "back_space": '\ue003'
      , "cancel": '\ue001'
      , "clear": '\ue005'
      , "command": '\ue03d'
      , "control": '\ue009'
      , "decimal": '\ue028'
      , "delete": '\ue017'
      , "divide": '\ue029'
      , "down": '\ue015'
      , "end": '\ue010'
      , "enter": '\ue007'
      , "equals": '\ue019'
      , "escape": '\ue00c'
      , "f1": '\ue031'
      , "f10": '\ue03a'
      , "f11": '\ue03b'
      , "f12": '\ue03c'
      , "f2": '\ue032'
      , "f3": '\ue033'
      , "f4": '\ue034'
      , "f5": '\ue035'
      , "f6": '\ue036'
      , "f7": '\ue037'
      , "f8": '\ue038'
      , "f9": '\ue039'
      , "help": '\ue002'
      , "home": '\ue011'
      , "insert": '\ue016'
      , "left": '\ue012'
      , "left_alt": '\ue00a'
      , "left_control": '\ue009'
      , "left_shift": '\ue008'
      , "meta": '\ue03d'
      , "multiply": '\ue024'
      , "null": '\ue000'
      , "numpad0": '\ue01a'
      , "numpad1": '\ue01b'
      , "numpad2": '\ue01c'
      , "numpad3": '\ue01d'
      , "numpad4": '\ue01e'
      , "numpad5": '\ue01f'
      , "numpad6": '\ue020'
      , "numpad7": '\ue021'
      , "numpad8": '\ue022'
      , "numpad9": '\ue023'
      , "page_down": '\ue00f'
      , "page_up": '\ue00e'
      , "pause": '\ue00b'
      , "return": '\ue006'
      , "right": '\ue014'
      , "semicolon": '\ue018'
      , "separator": '\ue026'
      , "shift": '\ue008'
      , "space": '\ue00d'
      , "subtract": '\ue027'
      , "tab": '\ue004'
      , "up": '\ue013'
      }

, haveSelenium: function()
  {
    console.log('hs', seleniumhost, seleniumsession);

    return !!seleniumsession;
  }

  // Returns a promise with the element id
, getElementSeleniumId: function(element)
  {
    // FIXME: lookup and compare the frame path
    element = safe_id(element);
    var seleniumid = element.retrieve('seleniumid');
    if (seleniumid)
      return Promise.resolve(seleniumid);

    var id = requireElementId(element);

    //Lookup the element
    return doSeleniumRequest('LookupElement', [ 'id', id, { framepath: this.framepath } ]).then(function(seleniumid)
    {
      // store it with the element for caching, and return it
      element.store('seleniumid', seleniumid);
      return seleniumid;
    });
  }

, clickElement: function(element)
  {
    // First lookup the element, when we have the id click on it
    return this.getElementSeleniumId(element).then(function(seleniumid)
    {
      return doSeleniumRequest('ClickElement', [ seleniumid ]);
    });
  }

, getKey: function(name)
  {
    var res = this._keys[name];
    if (!res)
      throw new Error("No such special key '" + name + "'");
    return res;
  }


, sendKeys: function(keys)
  {
    keys = Array.from(keys);
    return doSeleniumRequest('SendKeys', [ keys ]);
  }

, sendKeysToElement: function(element, keys)
  {
    keys = Array.from(keys);

    return this.getElementSeleniumId(element).then(function(seleniumid)
    {
      return doSeleniumRequest('SendKeysToElement', [ seleniumid, keys ]);
    });
  }
};

})(document.id);
