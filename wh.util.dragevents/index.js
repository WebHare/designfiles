/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.compat.base');
require ('../frameworks.mootools.more.class.binds');
/*! REQUIRE: frameworks.mootools, wh.compat.base, frameworks.mootools.more.class.binds !*/

(function($) { //mootools wrapper

/*
FAQ:

- click's don't work dependable anymore
  Set a higher 'dragthreshold' so a tap isn't accidently seen as drag action

- the page cannot be scrolled anymore on my phone due to an area with drag events
  An options might be using 'keepevents: false'. This has sideeffects though.


ADDME: way to detect a horizontal/vertical swipe and keep or pass events depending on the scroll direction we need (horizontal/vertical)
        Then we can kill the bubble and fire a new event in which only the axis changes (X or Y) which we don't want to handle.

*/


/****************************************************************************************************************************
 * Drag events
 */

Element.NativeEvents.dragstart = 2;

var logdragevents = false;

/* Add drag events to an element.
   The following events are generated:
   dragdown   Fired on mousedown or touchstart when dragging has not yet started
   dragstart  Fired after the drag threshold is reached
   dragmove   Fired while dragging after the drag threshold was reached
   dragend    Fired on mouseup or touchend
   dragcancel Fired when Esc was pressed while dragging or upon subsequent touchstart events
   swipe      Fired if the user swiped the element (with speed, rotation and direction properties)
*/
$wh.DragEvents = new Class(
{ Implements: [ Options, Events ]
, Binds: [ "onMouseDown", "onMouseMove", "onMouseUp", "onClick", "onKeyDown", "cancelEvent" ]

, options: { events: {}          // Events to listen for
           , dragthreshold: 0    // The number of pixels to move before dragging is activated. Setting this higher prevents a tap accidently being seen as a drag instead. (due to the user slightly moving his finger during the tap)
           , withswipe: true     // If swipes should be detected
           , swipethreshold: .1  // The minimum speed required for swipe
           , enabled: true
           , mousedrag: true
           , keepevents: true    // Cancel all events to prevent default browser behaviour and to prevent events from bubbling
                                 // Setting this to false also makes it possible to use on a iPhone without preventing vertical scrolling of the page.
           }

, constants:
  { sampleFrequency: 50          // Number of times per second to update dragging speed
  , sensitivity: 0.3             // Dragging speed update sensitivity (percentage of most recent delta to apply to current speed)
  }

, node: null                     // The node to detect dragging and swipes in

, initialize: function(node, options)
  {
    // Backwards compatibility for options-only initialize
    if (typeOf(node) == "object" && typeOf(options) == "null")
    {
      options = node;
      node = options.node;
    }

    // Make the node a MooTools element
    this.node = $(node);
    // Read the supplied options, merge with defaults
    this.setOptions(options);

    // Add the mouse/touch handlers to the node
    this.addNodeHandlers();

    // Add the supplied event handlers to 'this' (so we can fire them using this.fireEvent)
    for (var event in this.options.events)
      if ([ "dragdown", "dragstart", "dragmove", "dragend", "dragcancel", "swipe" ].contains(event))
        this.addEvent(event, this.options.events[event]);
  }

, destroy:function()
  {
    if(!this.node)
      return;
    this.removeNodeHandlers();
    this.node=null;
  }

, addNodeHandlers: function()
  {
    this.node.wh_hasdragevents=true;

    // Check whether to use touch or mouse events
    if ("createTouch" in document)
    {
      // Add start event to the node in capture phase (so we can cancel it before it's fired on subelements)
      this.node.addEvent("touchstart", this.onMouseDown, true);
    }
    else
    {
      // Add down and click events to the node in capture phase (so we can cancel them before they're fired on subelements)
      if(this.options.mousedrag)
      {
        this.node.addEvent("mousedown", this.onMouseDown, true);
      }
      this.node.addEvent("click", this.onClick, true);
    }

    // Prevent text selection and link/text dragging (cancelEvent doesn't use 'this', so we don't have to bind)
    this.node.addEvent("selectstart", this.cancelEvent);
    this.node.addEvent("dragstart", this.cancelEvent);
  }
, removeNodeHandlers:function()
  {
    delete this.node.wh_hasdragevents;
    this.node.removeEvent("touchstart", this.onMouseDown, true);
    this.node.removeEvent("mousedown", this.onMouseDown, true);
    this.node.removeEvent("click", this.onClick, true);
    this.node.removeEvent("selectstart", this.cancelEvent);
    this.node.removeEvent("dragstart", this.cancelEvent);
    this.endEventCapture();
  }

, startEventCapture:function() //ADDME use global capture handlers so we can even follow outside the browser on some platforms
  {
    // Add move and end events to document, so they'll also fire when not within the node
    if ("createTouch" in document)
      document.addEvents({ "touchmove": this.onMouseMove
                         , "touchend": this.onMouseUp
                         });
    else
      document.addEvents({ "mousemove": this.onMouseMove
                         , "mouseup": this.onMouseUp
                         });
    document.addEvent("keydown", this.onKeyDown);
  }
, endEventCapture:function()
  {
    if ("createTouch" in document)
      document.removeEvents({ "touchmove": this.onMouseMove
                         , "touchend": this.onMouseUp
                         });
    else
      document.removeEvents({ "mousemove": this.onMouseMove
                         , "mouseup": this.onMouseUp
                         });
    document.removeEvent("keydown", this.onKeyDown);
  }

, getDistance: function(frompos, topos)
  {
    return Math.sqrt(Math.pow(topos.x - frompos.x, 2) + Math.pow(topos.y - frompos.y, 2));
  }

, getAngle: function(frompos, topos)
  {
    return Math.atan2(topos.x - frompos.x, topos.y - frompos.y)
  }

, onClick: function(event)
  {
    if(!this.enabled)
      return;

    if(!this.options.dragging) //do not intercept 'other' events
      return true;

    if(!this.options.mousedrag)
    {
      // We should normally prevent the click event, unless dontpreventclick is set (so clear it if it's set)
      if (!this.dontpreventclick)
      {
        event.stop();
        return false;
      }
      else
        this.dontpreventclick = false;
    }
    return true;
  }

, isIgnorableInputElement: function(target)
  {
    while (target.nodeType != 1)
      target = target.parentNode;

    return ['SELECT','INPUT','TEXTAREA','OBJECT','EMBED'].contains(target.tagName)
           || target.hasClass("-wh-nodrag")
           || target.hasClass("wh-nodrag")
           || target.getParent(".-wh-nodrag, .wh-nodrag");
  }

, hasDeeperDragHandler:function(eventtarget)
  {
    for(;eventtarget && eventtarget != this.node;eventtarget=eventtarget.parentNode)
      if(eventtarget.wh_hasdragevents)
        return true;
    return false;
  }

, onMouseDown: function(event)
  {
    if(event.rightClick || this.hasDeeperDragHandler(event.target))
      return true; //keep bubbling. this is not for us!

    this.startEventCapture();

    if(logdragevents)
      console.log(this,"dragevents - mousedown",event.target);
    if(!this.options.enabled)
      return;

    var target = event.target;
    while (target.nodeType != 1)
      target = target.parentNode;


    //any mousedown on an input event, should be accepted, so we can still focus input fields
    if((event.type == "mousedown" || event.type == "touchstart") && this.isIgnorableInputElement(target))
    {
      return true;
    }

    // If this is a touchstart event while we're already dragging (second finger), cancel the drag
    if (event.type == "touchstart" && this.dragging)
    {
      this.fireEvent("dragcancel", event);
      this.dragging = null;

      if (this.options.keepevents)
        event.preventDefault();

      return this.options.keepevents ? false : true;
    }

    // Store dragging information
    this.dragging = { target: event.target
                    , originaltarget: event.target
                    , startpos: event.client
                    , curpos: event.client
                    , prevpos: null
                    , speedtimer: null
                    , curspeedx: 0
                    , curspeedy: 0
                    , curangle: 0
                    };

    // Fire the dragdown event (not actually dragging yet)
    this.fireEvent("dragdown", event);

    if (this.options.keepevents)
      event.preventDefault();

    return this.options.keepevents ? false : true;
  }


, onMouseMove: function(event)
  {
    if(logdragevents)
      console.log(this,"dragevents - mousemove",event.target);
    if(!this.options.enabled)
      return;

    if (this.dragging)
    {
      this.dragging.curpos = event.client;
      // The dragging target will be cleared when we actually start dragging, so fire the dragmove event
      if (!this.dragging.target)
      {
        this.fireEvent("dragmove", event);

        if (this.options.keepevents)
        {
          event.stop();
          return false;
        }
        else
          return true;
      }
      // Otherwise check if we have dragged far enough to start the actual drag
      else if (this.getDistance(this.dragging.startpos, this.dragging.curpos) >= this.options.dragthreshold)
      {
        this.dragging.target = null;
        this.fireEvent("dragstart", event);
        if (this.options.withswipe)
          this.dragging.speedtimer = this.checkSpeed.periodical(1000 / this.constants.sampleFrequency, this);

        if (this.options.keepevents)
        {
          event.stop();
          return false;
        }
        else
          return true;
      }
    }

    return true;
  }

, onMouseUp: function(event)
  {
    this.endEventCapture();
    if(logdragevents)
      console.log(this,"dragevents - mouseup",event.target);

    if(!this.options.enabled )
      return;

    if (this.dragging)
    {
      // If swipe support is enabled, calculate if the user has swippen
      if (this.options.withswipe)
      {
        // Stop calculating speed
        this.dragging.speedtimer = clearTimeout(this.dragging.speedtimer);

        // Check if any speed was left
        var speed = Math.sqrt(Math.pow(this.dragging.curspeedx, 2) + Math.pow(this.dragging.curspeedy, 2));
        if (speed > this.options.swipethreshold)
        {
          // Calculate degree rotation from radians
          var rotation = 180 - this.dragging.curangle * (180.0 / Math.PI);
          if (rotation > 180)
              rotation -= 360;

          // Get global direction from angle
          var direction = rotation <= -157.5 ? "s"
                        : rotation < -112.5  ? "sw"
                        : rotation <= -67.5  ? "w"
                        : rotation < -22.5   ? "nw"
                        : rotation <= 22.5   ? "n"
                        : rotation < 67.5    ? "ne"
                        : rotation <= 112.5  ? "e"
                        : rotation < 157.5   ? "se"
                        :                      "s";

          // Clone the event object and set speed, rotation and direction
          var swipeevent = new BubblingEvent('swipe');
          swipeevent.speed = speed;
          swipeevent.speedX = this.dragging.curspeedx;
          swipeevent.speedY = this.dragging.curspeedy;
          swipeevent.rotation = rotation;
          swipeevent.direction = direction;
          swipeevent.target = this.dragging.originaltarget;

          // Fire our freshly created swipe event
          this.fireEvent("swipe",swipeevent);
        }
      }

      // We're done dragging
      this.fireEvent("dragend", event);

      // If we haven't actually dragged and we finished at the starting element, the element was clicked
      // note: .target is null if we reached the dragthreshold (use .originaltarget if needed)
      if (this.dragging.target && this.dragging.target == event.target)
      {
        if (event.type == "touchend")
        {

          if(event.changedTouches.length>0)
          {//Get last touch position
            event.page.x = event.changedTouches[0].pageX;
            event.page.y = event.changedTouches[0].pageY;

            event.client.x = event.changedTouches[0].clientX;
            event.client.y = event.changedTouches[0].clientY;
          }

          // No click event on touch devices, so fire it ourselves
          var evt = document.createEvent("MouseEvent");
          evt.initMouseEvent("click", true, true, window, 0, event.page.x, event.page.y, event.client.x, event.client.y, false, false, false, false, 0, event.target);
          event.target.dispatchEvent(evt);
        }
        else
          // Don't cancel the click event that will be fired
          this.dontpreventclick = true;
      }

      this.dragging = null;

      if (this.options.keepevents)
        event.stop();

      return false;
    }
    return true;
  }

, onKeyDown: function(event)
  {
    this.endEventCapture();

    // If we're dragging and the Esc was pressed, cancel the drag
    if (this.dragging && event.key == "esc")
    {
      this.fireEvent("dragcancel", event);
      this.dragging = null;

      if (this.options.keepevents)
        event.stop();

      return false;
    }
  }

, cancelEvent: function(event)
  {
     if (this.options.keepevents)
      event.stop();

    return false;
  }

, checkSpeed: function()
  {
    if (this.dragging)
    {
      this.dragging.curpos.time = Date.now();
      if (this.dragging.prevpos)
      {
        var dt = this.dragging.curpos.time - this.dragging.prevpos.time;
        var dx = this.dragging.curpos.x - this.dragging.prevpos.x;
        var dy = this.dragging.curpos.y - this.dragging.prevpos.y;
        var s = this.constants.sensitivity;
        var rs = 1 - s;
        this.dragging.curspeedx = this.dragging.curspeedx * rs + (dt ? (dx / dt) * s : 0);
        this.dragging.curspeedy = this.dragging.curspeedy * rs + (dt ? (dy / dt) * s : 0);
        this.dragging.curangle = this.getAngle(this.dragging.prevpos, this.dragging.curpos);
      }
      this.dragging.prevpos = this.dragging.curpos;
    }
  }
});

//ADDME generalise further, look more like real events, perhaps move to browser native events?
var BubblingEvent = new Class(
{ stopped:false
, initialize:function(type)
  {
    this.type=type;
  }
, stop:function()
  {
    this.stopped=true;
  }

, fireAtTarget:function(target)
  {
    this.target = target;
    while(!this.stopped && target)
    {
      target.fireEvent(this.type, this);
      target=target.parentNode;
    }
  }
});

$wh.BubblingDragEventManager = new Class(
{ initialize:function(node)
  {
    this.swipemgr = new $wh.DragEvents(node,{onSwipe: this.handleswipe.bind(this)});
  }
, handleswipe:function(event)
  {
    event.fireAtTarget(event.target);
  }
});

})(document.id); //end mootools wrapper
