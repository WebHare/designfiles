/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
/*! LOAD: wh.compat.base
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

//ADDME cleanup, we're using fireEvent so we can just

//http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
var attachEvent = document.attachEvent;
var isIE = navigator.userAgent.match(/Trident/);

function resizeListener(e)
{
  var win = e.target || e.srcElement; //this is the window of the object that served as resize trigger
  if (win.__resizeRAF__) window.cancelAnimationFrame(win.__resizeRAF__);
  win.__resizeRAF__ = window.requestAnimationFrame(function()
  {
    var trigger = win.__resizeTrigger__;
    trigger.fireEvent("wh-resized");
  });
}

function objectLoad(e){
  this.contentDocument.defaultView.__resizeTrigger__ = this.__resizeElement__;
  this.contentDocument.defaultView.addEventListener('resize', resizeListener);
}

$wh.enableResizeEvents = function(element, fn)
{
  if(element.__resizeTrigger__)
    return; //already set up

  if (attachEvent)
  {
    element.__resizeTrigger__ = element;
    element.attachEvent('onresize', resizeListener);
  }
  else {
    if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
    var obj = element.__resizeTrigger__ = document.createElement('object');
    //IE11 & friends break without visibility:hidden, RTE and pulldowns using this compontent will break
    //Firefox breaks with visibility:hidden
    obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
    if(Browser.name=="ie")
      obj.style.visibility = 'hidden';
    obj.__resizeElement__ = element;
    obj.onload = objectLoad;
    obj.type = 'text/html';
    if (isIE) element.appendChild(obj);
    obj.data = 'about:blank';
    if (!isIE) element.appendChild(obj);
  }
};

$wh.disableResizeEvents = function(element, fn)
{
  if(!element.__resizeTrigger__)
    return; //already removed

  if (attachEvent) element.detachEvent('onresize', resizeListener);
  else {
    if(element.__resizeTrigger__.contentDocument && element.__resizeTrigger__.contentDocument.defaultView)
      element.__resizeTrigger__.contentDocument.defaultView.removeEventListener('resize', resizeListener);
    element.removeChild(element.__resizeTrigger__);
  }
  element.__resizeTrigger__ = null;
}

})(document.id); //end mootools wrapper
