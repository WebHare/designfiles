/* generated from Designfiles Public by generate_data_designfles */
require ('./scrollableview.css');
require ('../wh.util.dragevents');
require ('../wh.util.resizelistener');
require ('../frameworks.mootools.more.class.binds');
require ('../wh.compat.dragdrop');
/*! LOAD: wh.util.dragevents, wh.util.resizelistener,frameworks.mootools.more.class.binds,wh.compat.dragdrop  !*/

/****************************************************************************************************************************
 * ScrollableView
 */

/* Add custom scrollbars and scrolling to an element.
   If the element to scroll is initially hidden, the size can only be determined if MooTools More is loaded with at least the
   Element.Measure component included.
   The scrollbars fire the following events (listen for them by supplying the handlers in the options):
   onChange - called when the user stopped scrolling
   Dragging with momentum inspired by Ben Lenarts' Drag.Flick: http://mootools.net/forge/p/drag_flick


  Setting up a scrollable view is simple:


  - Build the following HTML DOM structure:

      <div id="myscrollarea" class="wh-scrollableview">
        <div class="wh-scrollableview-content">
          ** YOUR SCROLLABLE CONTENT **
        </div>
        <div class="wh-scroller-horizontal"></div>
        <div class="wh-scroller-vertical"></div>
      </div>


  - And execute the following JS code to initialize:

      new $wh.ScrollableView('myscrollarea', { horizontal:true, vertical:true} );

  - CSS (only if you added scrollbars)

      #myscrollarea .wh-scroller-vertical
      {
        width:5px;
        height:30px;
        right:0px;
      }
      #myscrollarea .wh-scroller-horizontal
      {
        width:30px;
        height:5px;
        bottom:0;
      }
      (and add background, border-radius, something like that...)

      .wh-scrollableview-canscroll
      .wh-scrollableview-canscroll-h
      .wh-scrollableview-canscroll-v
      .wh-scrollableview-scrolling



  And then customize it:
  - remove the scroller classes and the wh-scroller-horizontal/vertical divs if you don't need one of the scrollbars
  - set margintop/bottom (vertical) and marginleft/right (horizontal) on the scrollbars to prevent them from scrolling to the edges

  - to avoid having scrollbars stick to the edges of it's container
    - on vertical scrollbars use right: 5px; margin-top: 5px; margin-bottom: 5px;
    - on horizontal scrollbars use top: 5px; margin-left: 5px; marbin-right: 5px;

  - scrollbar shouldn't appear when there is nothing to scroll?
    .wh-scroller-vertical { visibility:hidden; }
    .wh-scrollableview-canscroll-v .wh-scroller-vertical { visibility:visible };
  - scrollbar only on hover?
    .wh-scroller-vertical { visibility:hidden; }
    .wh-scrollableview:hover .wh-scroller-vertical { visibility:visible };

  ADDME:
  - dynamically sizing scrollbars (probably by not setting a height at all, or setting only a min-height)
  - click/dragable scrollbars (preferably by setting a data- attribute? )

  FIXME: use requestAnimationFrame instead of periodical and deprecate the fps option
*/


(function($) { //mootools wrapper

//ADDME: Better documentation on events etc.
$wh.ScrollableView = new Class(
{ Extends: $wh.DragEvents
, Binds: ["onResize", "onMouseWheel", "_onBeforeRemovedFromDom", "_onAfterAddedToDom"]
, Implements: [ Options, Events ]

/* Initialization */

, options: { vertical: true          // Scroll vertically
           , horizontal: false       // Scroll horizontally
           , nativescroll: false     // If set to true, use the browser's native scrolling

           , scrollingclasstimeout: 500 // Timeout in ms for removal of wh-scrollableview-scrolling class after scroll action
           , debug: false



           // Settings relevant in case nativescroll is set to false
           , csstransform: false       // Use CSS3 transforms for scrolling

           , rowdelta: 32            // Number of pixels to scroll per wheel click
           , dragscroll: true        // If the node can be scrolled by dragging it
           , mousedrag: false        // If true, interpret mouse inputs as dragging inputs (eg, mouse acts like touch)
           , keepscrollevents: false // If true, events that cause a scroll will only affect our node (if false, like the default browser behaviour the closest still scrollable parent will get the scroll(wheel) event)
           , elastic: true           // If the node should be scrolled elastically

           , duration: 500           // Duration of animation
           , fps: 50                 // Animation frames per second

           //, animatedscroll: false   // Animate (tween) when scrolling
           , width: null
           , height: null
           , contentwidth: null
           , contentheight: null
           , autorefresh: true       // Automatically refresh on window resize

           , scrollfunc: null        // manual scroll function. if set, the contentdiv is ignored
           , marginx: 0              // the left margin of the scrollable area. normally 0
           , marginy: 0              // the top margin of the scrollable area. normally 0


           , snapintoview: true      // Upon refresh scroll content back into view if we are scrolled further than we have content (which happens if the content's size got smaller of the container got bigger)



           // options inherited from dragevents
           , events: {}          // Events to listen for
           , dragthreshold: 0    // The number of pixels to move before dragging is activated
           , withswipe: true     // If swipes should be detected
           , swipethreshold: .1  // The minimum speed required for swipe
           , enabled: true
           , keepevents: true    // Cancel all events to prevent default browser behaviour and to prevent events from bubbling
                                 // Setting this to false also makes it possible to use on a iPhone without preventing vertical scrolling of the page.
           }

, constants:
  { sampleFrequency: 50              // Number of times per second to update dragging speed
  , sensitivity: 0.3                 // Dragging speed update sensitivity (percentage of most recent delta to apply to current speed)
  , clickTimeout: 250                // Time to wait before repeating click when holding mouse button down
  , clickRepeat: 30                  // Time between repeated clicks when holding mouse button down
  }

, node: null                         // The node that will be scrolled (used by our parentclass DragEvents)
, containerdiv: null                 // (currently the same as this.node)
, contentdiv: null                   //
, curscroll: { x: 0, y: 0 }
, hscroller: null
, vscroller: null
, removescrollingcb: null
, moving: false                      // Whether a handle move is currently in progress
, addedscrollableview: false
, domstate: null

, initialize: function(node, options)
  {
    node=$(node);
    if(!node.hasClass("wh-scrollableview"))
    {
      this.addedscrollableview = true;
      node.addClass("wh-scrollableview");
    }
    if (!node.hasClass("wh-dom-events"))
      node.addClass("wh-dom-events");

    if(!options||!options.nativescroll)
      this.options.events = { "dragstart": this.onDragStart.bind(this)
                            , "dragmove": this.onDragMove.bind(this)
                            , "dragend": this.onDragEnd.bind(this)
                            , "swipe": this.onSwipe.bind(this)
                            };
    this.parent(node, options);
    this.buildNode();

    if(!this.options.scrollfunc)
    {
      if(this.options.csstransform)
      {
        this.contentdiv.style[$wh.__transform_property]="translate3D(0px,0px,0)";
        this.contentdiv.style.transition = $wh.__transform_property + " 1s";
      }
    }
    if(this.options.autorefresh)
    {
      $wh.enableResizeEvents(node);
      node.addEvent("wh-resized", this.onResize);
    }

    node.addEvent("wh-dom-removing", this.onRemovingFromDom);
    node.addEvent("wh-dom-added", this.onAddedToDom);
  }

, destroy:function()
  {
    $wh.disableResizeEvents(this.node);
    if(this.hscroller)
    {
      this.hscroller.destroy();
      this.hscroller=null;
    }
    if(this.vscroller)
    {
      this.vscroller.destroy();
      this.vscroller=null;
    }
    if(this.node)
    {
      this.node.removeClass("wh-scrollableview-canscroll-h")
      this.node.removeClass("wh-scrollableview-canscroll-v")
      this.node.removeClass("wh-scrollableview-canscroll")
      this.node.removeClass("-wh-scrollableview-canscroll-h")
      this.node.removeClass("-wh-scrollableview-canscroll-v")
      this.node.removeClass("-wh-scrollableview-canscroll")
      if(this.addedscrollableview)
        this.node.removeClass("wh-scrollableview");

      this.node.removeEvent("wh-resized", this.onResize);
      this.node.erase("wh-scrollableview");
      this.node.erase("-wh-scrollableview");

      if(this.containerdiv)
        this.containerdiv.removeEvents({ mousewheel: this.onMouseWheel });
    }
  }

/* Public API */

, getScroll: function()
  {
    //filter so we don't return 'elastic' coordinates
    return { x: - Math.max(this.limit.x[0], Math.min(this.curscroll.x, this.limit.x[1]))
           , y: - Math.max(this.limit.y[0], Math.min(this.curscroll.y, this.limit.y[1]))
           }
  }
, getScrollSize:function()
  {
    return { x: this.options.contentwidth === null  ? this.options.scrollfunc ? 0 : this.contentdiv.offsetWidth : this.options.contentwidth
           , y: this.options.contentheight === null ? this.options.scrollfunc ? 0 : this.contentdiv.offsetHeight : this.options.contentheight
           };
  }
, getSize:function()
  {
    return { x: this.options.width === null ? this.containerdiv.offsetWidth : this.options.width
           , y: this.options.height === null ? this.containerdiv.offsetHeight : this.options.height
           };
  }
, setScroll: function(pos, animate)
  {
    if (typeOf(pos.x) == "number")
      this.curscroll.x = -pos.x;

    if (this.curscroll.x < this.limit.x[0])
      this.curscroll.x = this.limit.x[0];
    else if (this.curscroll.x > this.limit.x[1])
      this.curscroll.x = this.limit.x[1];

    if (typeOf(pos.y) == "number")
      this.curscroll.y = -pos.y;
    if (this.curscroll.y < this.limit.y[0])
      this.curscroll.y = this.limit.y[0];
    else if (this.curscroll.y > this.limit.y[1])
      this.curscroll.y = this.limit.y[1];

    this.updateState(animate);
  }

, scrollTo: function(x,y,animate)
  {
    this.setScroll({x:x,y:y},animate);
  }

, scrollToNode: function(node, animate)
  {
    this.setScroll(node.getPosition(this.containerdiv), animate);
  }

, refresh: function()
  {
    if(this.options.height !== null)
      this.containerdiv.setStyle("height", this.options.height);
    if(this.options.width!== null)
      this.containerdiv.setStyle("width", this.options.width);
    if(!this.options.scrollfunc)
    {
      if(this.options.contentheight !== null)
        this.contentdiv.setStyle("height", this.options.contentheight);
      if(this.options.contentwidth !== null)
        this.contentdiv.setStyle("width", this.options.contentwidth);
    }

    this.limit = this.getLimits();

    var scroll = this.getScrollSize(); // size of scrollable content

    var size = this.getSize(); // viewport(container) size

    if (this.options.snapintoview)
    {
      var scrollpos = this.getScroll();

      // does all scrollable content fit at once?
      var overridex = null
        , overridey = null;

      if (scroll.x <= size.x)
        overridex = 0;
      else if (scrollpos.x + size.x > scroll.x)
        overridex = scroll.x - size.x;

      if (scroll.y <= size.y)
        overridey = 0;
      else if (scrollpos.y + size.y > scroll.y)
        overrideyy = scroll.y - size.y;

      if (overridex !== null || overridey !== null)
      {
        this.scrollTo(overridex, overridey);
        scrollpos = this.getScroll();
      }
    }

    var canhscroll = this.options.horizontal && scroll.x > size.x;
    var canvscroll = this.options.vertical && scroll.y > size.y;

    this.node.toggleClass("-wh-scrollableview-canscroll-h", canhscroll);
    this.node.toggleClass("-wh-scrollableview-canscroll-v", canvscroll);
    this.node.toggleClass("-wh-scrollableview-canscroll", canhscroll || canvscroll);
    this.node.toggleClass("wh-scrollableview-canscroll-h", canhscroll);
    this.node.toggleClass("wh-scrollableview-canscroll-v", canvscroll);
    this.node.toggleClass("wh-scrollableview-canscroll", canhscroll || canvscroll);

    this.fireEvent('scroll',{target:this});
  }
, onResize:function()
  {
    this.refresh();
  }

/* DOM */

, buildNode: function()
  {
    if (!this.options.vertical && !this.options.horizontal)
    {
      console.error("No scroll direction specified. (vertical and/or horizontal)");
      return;
    }

    if (!this.node)
    {
      console.error("Node to add scrollbars not specified.");
      return;
    }

    this.containerdiv = this.node;
    this.containerdiv.store("wh-scrollableview", this);

    if(this.options.nativescroll)
    {
      this.containerdiv.setStyles( { "overflow-x": this.options.horizontal ? "scroll" : "hidden"
                                   , "overflow-y": this.options.vertical   ? "scroll" : "hidden"
                                 })
    }

    if(!this.options.scrollfunc)
    {
      this.contentdiv = this.containerdiv.getElement(".wh-scrollableview-content, .-wh-scrollableview-content");
      if (!this.contentdiv)
      {
        console.error("No contentdiv specified (using class wh-scrollableview-content) within the specified containerdiv");
        return;
      }
    }

    // Add event handlers
    if(!this.options.nativescroll)
      this.containerdiv.addEvents({ mousewheel: this.onMouseWheel });

    //get the scrollbars, but not in our scroll container
    var hscroller = !this.options.nativescroll && this.options.horizontal && this.node.getElements('.-wh-scroller-horizontal, .wh-scroller-horizontal').filter(function(el) { return this.contentdiv&&!this.contentdiv.contains(el) }.bind(this)).pick();
    var vscroller = !this.options.nativescroll && this.options.vertical &&   this.node.getElements('.-wh-scroller-vertical, .wh-scroller-vertical').  filter(function(el) { return this.contentdiv&&!this.contentdiv.contains(el) }.bind(this)).pick();

    this.refresh();

    if(hscroller)
      this.hscroller = new $wh.Scroller(hscroller, this, {vertical:false});
    if(vscroller)
      this.vscroller = new $wh.Scroller(vscroller, this, {vertical:true});
  }
, toElement: function()
  {
    return this.node;
  }
, getLimits: function()
  {
    var csize = this.getScrollSize();

    var cwidth =  this.containerdiv.clientWidth  - csize.x;
    var cheight = this.containerdiv.clientHeight - csize.y;

    // Math.min so first value won't be greater than 0 in case the content is smaller than the container
    return { x: [ Math.min(cwidth,  -this.options.marginx), -this.options.marginx ]
           , y: [ Math.min(cheight, -this.options.marginy), -this.options.marginy ]
           }
  }

// FIXME: when setting both container and content dimensions we trigger refresh() 2 times (and reflow multiple times!!)

, setContainerDimensions:function(width, height)
  {
    //console.log("setContainerDimensions from "+this.options.width+"x"+this.options.height+" to "+width+"x"+height);

    // prevent triggering reflows in case our size didn't change
    if (this.options.width == width && this.options.height == height)
      return;

    this.options.width = width;
    this.options.height = height;

    this.refresh();
  }

, setContentDimensions:function(width, height)
  {
    if (this.options.debug)
      console.info("$wh.ScrollableView setContentDimensions", width + " x " + height);

    if (isNaN(width) || isNaN(height))
    {
      console.error("Non-numerical width or height given to $wh.ScrollableView setContentDimensions()");
      console.trace();
      return;
    }

    if (this.options.contentwidth == width && this.options.contentheight == height)
      return;

    this.options.contentwidth = width;
    this.options.contentheight = height;

    this.refresh();
  }

, updateState: function(animate)
  {
    if (!this.containerdiv)
    {
      console.error("no container div");
      return;
    }
//console.log(animate);

    //note, the first element of these limits are supposed result in negative values.
    if (typeOf(this.containerdiv.measure) == "function")
      this.limit = this.containerdiv.measure((function()
      {
        return this.getLimits();
      }).bind(this));
    else
      this.limit = this.getLimits();

    if (this.options.vertical)
    {
      if (this.limit.y[0] == 0)
      {
        this.updateEnabled(true, false);
        this.curscroll.y = 0;
      }
      else
      {
        this.updateEnabled(true, true);
      }
    }
    else
    {
      this.curscroll.y = 0;
    }

    if (this.options.horizontal)
    {
      if (this.limit.x[0] == 0)
      {
        this.updateEnabled(false, false);
        this.curscroll.x = 0;
      }
      else
      {
        this.updateEnabled(false, true);
      }
    }
    else
    {
      this.curscroll.x = 0;
    }

    var firescroll = true;
    if(this.options.scrollfunc)
    {
      this.options.scrollfunc(this.curscroll.x, this.curscroll.y);
    }
    else
    {
      if(this.options.csstransform) //ADDME pick the right transform
      {
        var transform = "translate3D(" + this.curscroll.x + "px," + this.curscroll.y + "px,0)";
        this.contentdiv.style.transition = $wh.__transform_venderprefix + "transform" + " " + this.options.duration + "ms";
        this.contentdiv.style[$wh.__transform_property] = transform;
      }
      else
      {
        var styles = {};
        if(this.options.horizontal)
          styles.left = this.curscroll.x;
        if(this.options.vertical)
          styles.top  = this.curscroll.y;

        if(animate)
        {
          // Stop firing while scrolling when the morph is complete
          this.contentdiv.set("morph", { "onComplete": this.scrollAnimationComplete.bind(this), duration: this.options.duration });
          // Morph to the new coordinates
          this.contentdiv.morph(styles);
          // Use animation frame to fire scroll events while morphing
          this.scrollaniframe = requestAnimationFrame(this.fireScrollWhileAnimating.bind(this));
          // Don't use the standard fireScrollIfNeeded, because that function reads this.curscroll to determine if the event
          // should be fired; instead, use a custom function which reads the CSS styling to see the current scrolling position
          firescroll = false;
        }
        else
          this.contentdiv.setStyles(styles);
      }
    }
    if (firescroll)
      this.fireScrollIfNeeded();
  }

, fireScrollWhileAnimating: function()
  {
    // Determine the current scroll position
    var styles = this.contentdiv.getStyles([ "left", "top" ]);
    var curx = styles.left.toInt();
    var cury = styles.top.toInt();
    // If we've moved, fire the event
    if(curx != this.lastreportedx || cury != this.lastreportedy)
    {
      this.lastreportedx = curx;
      this.lastreportedy = cury;
      this.fireEvent("scroll", { target: this});
    }

    // Schedule ourselves again
    this.scrollaniframe = requestAnimationFrame(this.fireScrollWhileAnimating.bind(this));
  }

, scrollAnimationComplete: function()
  {
    cancelAnimationFrame(this.scrollaniframe);
    this.fireScrollIfNeeded();
  }

, fireScrollIfNeeded:function()
  {
//console.warn(this.curscroll.y, this.lastreportedy)
    if(this.curscroll.x == this.lastreportedx && this.curscroll.y == this.lastreportedy)
      return;
    this.lastreportedx = this.curscroll.x;
    this.lastreportedy = this.curscroll.y;
    this.fireEvent("scroll", { target: this});
  }

, updateEnabled: function(vertical, enabled)
  {
/*
    if (vertical)
    {
      if (this.options.hideunneeded)
      {
        // Show or hide the complete scrollbar
        this.vscrollbar.node.setStyle("display", enabled ? "" : "none");
        //ADDME: Add scrollbar space to content div when hidden?
      }
      else
      {
        // Show or hide all child elements (arrows and slider)
        for (var node = this.vscrollbar.node.firstChild; node; node = node.nextSibling)
          node.setStyle("display", enabled ? "" : "none");
      }
    }
    else
    {
      if (this.options.hideunneeded)
      {
        // Show or hide the complete scrollbar
        this.hscrollbar.node.setStyle("display", enabled ? "" : "none");
        //ADDME: Add scrollbar space to content div when hidden?
      }
      else
      {
        // Show or hide all child elements (arrows and slider)
        for (var node = this.hscrollbar.node.firstChild; node; node = node.nextSibling)
          node.setStyle("display", enabled ? "" : "none");
      }
    }
*/
  }


/* Event handlers */

, onClick: function(event)
  {
    if(this.isIgnorableInputElement(event.target))
      return;
    return this.parent();
  }

, onMouseDown: function(event)
  {
    //console.error("SCROLLABEL MOUSEDOWn");

    this.parent(event);
    if (this.dragging != null)
    {
      this.dragging.startscroll = { x: this.curscroll.x
                                  , y: this.curscroll.y
                                  };
    }

/*
    if (!this.parent(event))
    {
      this.dragging.startscroll = { x: this.curscroll.x
                                  , y: this.curscroll.y
                                  };
      return false;
    }
    return true;
*/
  }

, onDragStart: function(event)
  {
    // our transition is used for directly scrolling to somewhere
    // if still active, it'll mess up the in-control feeling
    if (this.options.csstransform)
      this.contentdiv.style.transition = "";
  }

, onDragMove: function(event)
  {
    if (!this.options.dragscroll)
      return;

    this.curscroll = { x: this.dragging.startscroll.x + this.dragging.curpos.x - this.dragging.startpos.x
                     , y: this.dragging.startscroll.y + this.dragging.curpos.y - this.dragging.startpos.y
                     };

    if (!this.options.elastic)
    {
      if (this.curscroll.y < this.limit.y[0])
        this.curscroll.y = this.limit.y[0];
      else if (this.curscroll.y > this.limit.y[1])
        this.curscroll.y = this.limit.y[1];
      if (this.curscroll.x < this.limit.x[0])
        this.curscroll.x = this.limit.x[0];
      else if (this.curscroll.x > this.limit.x[1])
        this.curscroll.x = this.limit.x[1];
    }

    this.updateState(false);
  }

, onDragEnd: function(event)
  {
    if (!this.options.dragscroll)
      return;

    if (this.options.elastic)
    {
      if (this.curscroll.y < this.limit.y[0] || this.curscroll.y > this.limit.y[1]
        || this.curscroll.x < this.limit.x[0] || this.curscroll.x > this.limit.x[1])
      {
        var to_x = Math.max(this.limit.x[0], Math.min(this.limit.x[1], this.curscroll.x));
        var to_y = Math.max(this.limit.y[0], Math.min(this.limit.y[1], this.curscroll.y));
        var duration = this.options.duration / 2;
        this.speed = { x: { v0: 0
                          , a: (2 * (to_x - this.curscroll.x)) / Math.pow(duration, 2)
                          , p0: this.curscroll.x
                          , bounce_time: 0
                          }
                     , y: { v0: 0
                          , a: (2 * (to_y - this.curscroll.y)) / Math.pow(duration, 2)
                          , p0: this.curscroll.y
                          , bounce_time: 0
                          }
                     , duration: duration
                     };

        this.time = Date.now();
        this.lastStepTime = this.time;

        this.stepHandle = this.moveStep.periodical(Math.round(1000 / this.options.fps), this);

        return;
      }
    }
    this.fireEvent("scrollend");
  }

, onMouseWheel: function(event)
  {
    this.stepHandle = clearInterval(this.stepHandle);

    // simulate browser's overflow behaviour
    // (when our node cannot scroll anymore the event will go up to the next element which can still be scrolled)
    if (this.limit.y[0] && this.scroll(true, 3 * event.wheel * this.options.rowdelta))
      return event.stop();
    else if (this.options.keepscrollevents)
      return event.stop();
  }

, onSwipe: function(event)
  {
    if (!this.options.dragscroll)
      return;

    this.speed = { x: { v0: event.speedX }
                 , y: { v0: event.speedY }
                 , duration: this.options.duration
                 };
    this.moveStart();
  }

, onRemovingFromDom: function()
  {
    console.log('sv onRemovingFromDom');
    this.domstate =
        { scrollTop: this.node.scrollTop
        , scrollLeft: this.node.scrollLeft
        };
  }

, onAddedToDom: function()
  {
    console.log('sv onAddedToDom');
    if (this.domstate)
    {
      this.node.scrollTop = domstate.scrollTop;
      this.node.scrollLeft = domstate.scrollLeft;
    }
  }

/* Internal functions */

, autoScroll: function(vertical, amount, limit)
  {
    if (!this.scrollHandle)
      return;
    this.scrollHandle = clearTimeout(this.scrollHandle);
    if (this.scroll(vertical, amount, limit))
      this.scrollHandle = this.autoScroll.delay(this.constants.clickRepeat, this, [ vertical, amount, limit ]);
  }

, scroll: function(vertical, amount, limit)
  {
    var moved = false;
    if (vertical)
    {
      if (limit && ((amount < 0 && (this.curscroll.y) <= limit) || (amount > 0 && (this.curscroll.y) >= limit)))
        return;
      var oldy = this.curscroll.y;
      this.curscroll.y += amount;
      if (this.curscroll.y < this.limit.y[0])
        this.curscroll.y = this.limit.y[0];
      else if (this.curscroll.y > this.limit.y[1])
        this.curscroll.y = this.limit.y[1];
      moved = this.curscroll.y != oldy;
    }
    else
    {
      if (limit && ((amount < 0 && (this.curscroll.x) <= limit) || (amount > 0 && (this.curscroll.x) >= limit)))
        return;
      var oldx = this.curscroll.x;
      this.curscroll.x += amount;
      if (this.curscroll.x < this.limit.x[0])
        this.curscroll.x = this.limit.x[0];
      else if (this.curscroll.x > this.limit.x[1])
        this.curscroll.x = this.limit.x[1];
      moved = this.curscroll.x != oldx;
    }
    this.updateState();
    if (moved)
      this.fireEvent("scrollend");
    return moved;
  }

, checkSpeed: function()
  {
    this.parent();
    if (this.dragging)
    {
      if (this.dragging.curpos.x < this.limit.x[0] || this.dragging.curpos.x > this.limit.x[1])
        this.dragging.curspeedx *= .5;
      if (this.dragging.curpos.y < this.limit.y[0] || this.dragging.curpos.y > this.limit.y[1])
        this.dragging.curspeedy *= .5;
    }
  }

, moveStart: function()
  {
    this.speed.x.a = -this.speed.x.v0 / this.options.duration;
    this.speed.y.a = -this.speed.y.v0 / this.options.duration;
    this.speed.x.p0 = this.curscroll.x;
    this.speed.y.p0 = this.curscroll.y;
    this.speed.x.bounce_time = -1;
    this.speed.y.bounce_time = -1;

    this.time = Date.now();
    this.lastStepTime = this.time;

    this.stepHandle = this.moveStep.periodical(Math.round(1000 / this.options.fps), this);
  }

, moveStep: function()
  {
    var time = Date.now();
    var time = time - this.time;

    if (time > this.speed.duration)
    {
      this.moveComplete();
      return;
    }

    [ "x", "y" ].each(function(dir)
    {
      var speed = this.speed[dir];
      if (speed.a)
      {
        if (speed.bounce_time < 0 && (this.curscroll[dir] < this.limit[dir][0] || this.curscroll[dir] > this.limit[dir][1]))
        {
          speed.bounce_time = time;
          speed.v0 = speed.v0 + speed.a * time;
          speed.a *= 2;
          speed.p0 = this.curscroll[dir];
        }
        var t = Math.max(speed.bounce_time, time);
        var p = speed.p0 + speed.v0 * t + .5 * speed.a * Math.pow(t, 2);
        if (speed.bounce_time >= 0 && p >= this.limit[dir][0] && p <= this.limit[dir][1])
        {
          this.curscroll[dir] = Math.max(this.limit[dir][0], Math.min(this.limit[dir][1], this.curscroll[dir]));
          speed.a = 0;
        }
        else
          this.curscroll[dir] = p;
      }
    }, this);

    this.updateState();
    this.lastStepTime = time;
  }

, moveComplete: function()
  {
    if (!this.stepHandle)
      return false;
    this.stepHandle = clearInterval(this.stepHandle);

    this.curscroll.x = Math.max(this.limit.x[0], Math.min(this.limit.x[1], this.curscroll.x));
    this.curscroll.y = Math.max(this.limit.y[0], Math.min(this.limit.y[1], this.curscroll.y));
    this.updateState();

    this.fireEvent("scrollend");
  }

, startedHandleDrag: function()
  {
    this.moving = true;
    this.updateScrollClass();
  }

, stoppedHandleDrag: function()
  {
    this.moving = false;
    this.updateScrollClass();
  }

  /// Called when a scroll action (start handle drag, end handle drag, scrolled) has taken place
, updateScrollClass: function()
  {
    $(this.containerdiv).addClass("-wh-scrollableview-scrolling");
    this.containerdiv.addClass("wh-scrollableview-scrolling");

    if (this.removescrollingcb)
      clearTimeout(this.removescrollingcb);
    this.removescrollingcb = this.moving ? null : this.removeScrollingClass.bind(this).delay(this.options.scrollingclasstimeout);
  }
, removeScrollingClass: function(formoving)
  {
    this.removescrollingcb = null;
    $(this.containerdiv).removeClass("wh-scrollableview-scrolling");
    this.containerdiv.removeClass("-wh-scrollableview-scrolling");
  }

});

$wh.ScrollableView.getFrom = function (element)
{
  return $(element).retrieve("wh-scrollableview");
};


/////////////////////////////////////////////////////////////////////////////
//
// Scroller class
//

$wh.Scroller = new Class(
{ Implements:[Options]
, Binds: ["onScroll", "onMoveStart", "onMove", "onMoveEnd" ]
, node: null
, view: null
, options: { scrolldimension: null
           , vertical: true
           , min_scrollbar_handle_size: 15
           }
, dim: ''
, movestartpositions: null
, fixedhandlesize: false

, lastposition: null // last measured CSS position

, initialize:function(node, view, options)
  {
    this.node = $(node);
    this.view = view;
    this.setOptions(options);

    if(this.view)
      this.view.addEvent("scroll", this.onScroll);
    this.node.addEvents({ movestart: this.onMoveStart
                        , move:  this.onMove
                        , moveend: this.onMoveEnd
                        })
             .set("movable", true);

    this.fixedhandlesize = this.node.getAttribute("data-handlesize") == 'fixed';

    this.dim = this.options.scrolldimension || (this.options.vertical ? 'y' : 'x');

    // Must be last
    this.onScroll();
  }

, destroy:function()
  {
    if(this.view)
      this.view.removeEvent("scroll", this.onScroll);
    this.node.setStyle(this.options.vertical ? "top" : "left", null);
  }

, getPositions: function()
  {
    var scrollsize = this.view.getScrollSize()[this.dim];

    var viewsize = this.options.vertical ? this.view.node.clientHeight : this.view.node.clientWidth; // getSize() would include borders
    var scrolloffset = this.view.getScroll()[this.dim];

    // Calculate current relative offset (0..1) of the scroll position (which runs from [0..scrollsize-viewsize-1])
    var scrolllimit = Math.max(scrollsize - viewsize - 1, 0);
    var relativeoffset = scrolllimit ? scrolloffset / scrolllimit : 0;

    // Get the handle sizes data
    var container = $(this.node.offsetParent);
    var handlecontainersize = this.options.vertical ? container.clientHeight : container.clientWidth; // getSize() would include borders

    var topmargin = this.node.getStyle(this.options.vertical ? "margin-top" : "margin-left").toInt();
    var bottommargin = this.node.getStyle(this.options.vertical ? "margin-bottom" : "margin-right").toInt();

    // Is the handle size dependent on the portion of the content visible?
    if (!this.fixedhandlesize)
    {
      var relativevisible = Math.min(viewsize / scrollsize, 1) || 1;
      var newhandlesize = Math.round((handlecontainersize - topmargin - bottommargin) * relativevisible);
      this.node.setStyle(this.options.vertical ? "height" : "width", Math.max(newhandlesize, this.options.min_scrollbar_handle_size) + 'px');
    }

    // Read the actual size after the resize
    //var handlesize = $(this.node).getSize()[this.dim];
    var handlesize = this.options.vertical ? this.node.clientHeight : this.node.clientWidth;

    // Nr of pixels the handle has room to move
    var moverange = handlecontainersize - handlesize - topmargin - bottommargin;

    var sizes =
      { scrolloffset: scrolloffset
      , scrolllimit: scrolllimit
      , handlecsspos: Math.round(relativeoffset * moverange) + 'px'
      , offsetchangeperhandlepixel: moverange ? scrolllimit / moverange : 0
      };
    return sizes;
  }

, onScroll:function()
  {
    //ADDME horizontal scroller support
    if(!this.node.offsetParent)
    {
      //console.log("missing offsetParent");
      return;
    }

    var positions = this.getPositions();

    this.node.setStyle(this.options.vertical ? "top" : "left", positions.handlecsspos);

    // Mark view as currently scrolling, and set a timeout
    // a refresh or resizing of the content may trigger a scroll, even though we havn't moved
    if (positions.handlecsspos != this.lastposition)
    {
      this.lastposition = positions.handlecsspos;
      this.view.updateScrollClass();
    }
  }

, onMoveStart: function(event)
  {
    // Only scroll on left button
    if (event.event.button)
      return true;

    this.view.startedHandleDrag();
    this.movestartpositions = this.getPositions();
  }

, onMove: function(event)
  {
    if (!this.movestartpositions)
      return;

    var positions = this.getPositions();

    var newscrollpos = this.movestartpositions.scrolloffset;
    newscrollpos += event.moved[this.dim] * positions.offsetchangeperhandlepixel;

    var scroll = this.view.getScroll();
    scroll[this.dim] = newscrollpos;
    this.view.scrollTo(scroll.x, scroll.y);
  }

, onMoveEnd: function(event)
  {
    this.onMove(event);

    this.movestartposition = null;
    this.view.stoppedHandleDrag();
  }

});


$wh.Scrollableviews = $wh.ScrollableView; //FIXME ut mediaplayer ? compatibility, Mark thinks. remove when caller is updated


})(document.id); //end mootools wrapper
