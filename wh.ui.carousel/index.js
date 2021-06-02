/* generated from Designfiles Public by generate_data_designfles */
require ('./carousel.css');
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.fx.sort');
require ('wh.animations.slideshow');
require ('wh.components.scrollableview');
require ('wh.animations.timeline');
require ('wh.util.errorreporting');
/*! LOAD: frameworks.mootools.core, frameworks.mootools.more.fx.sort
    LOAD: wh.animations.slideshow, wh.components.scrollableview, wh.animations.timeline, wh.util.errorreporting
!*/

/*

ask Olfert for docs

*/

if(!window.$wh)
  window.$wh={};

(function($) { //mootools wrapper
"use strict";

// sliding selector thingy
$wh.Carousel = new Class(
{ Extends: $wh.Scrollableviews
, Implements: [ Options, Events ]
, options: { horizontal:              true
           , vertical:                true
           , keepscrollevents:        false
           , nativescroll:            false
           , dragscroll:              false
           , keepevents:              true

           , item_selectedclass:      "selected"

           , slide_amount:             320
           , contentdiv:               "wh-slideshow-contentarea"
           , tile_width:               300
           , tile_height:              430
           , csstransform:             true
           , hidetitle:                false
           , mobiletreshold:           320
           }
, mediabrowser_node: null

, fullscreen_popup:  null
, mediaitemnodes: []

, selectedindexitem: null // the current selection
, hoveritemindex:    null

, tiles: []
, limitvisible: 0
, uniquecount: 0
, inanimation: false
, sorter: null
, order: []
, fits: false
, lastmoved: null
, mouseontile: false
, currenthover: null
, showanimator: null
, hideanimator: null
, mobiledevice: false
, disableoverlayreset: false
, device: null
, scrollableview: null
, lastwidth: 0
, mousehasleft: false
, lastentertarget: null
, isMobileLayout: false

, initialize: function(node, options)
  {
    // Read the supplied options, merge with defaults
    this.setOptions(options);

    if(this.options.hidetitle)
      node.getElement(".titlebar").setStyle("display", "none");

    this.mediabrowser_node = node;
    node.setStyle("width", "100%");

    // enumerate mediaitems
    this.mediaitemnodes = this.mediabrowser_node.getElements(".tile");
    this.uniquecount = this.mediaitemnodes.length;
    if(this.uniquecount == 0)
    {
      console.warn('no tiles found');
      return;
    }

    for (var tel=0; tel < this.mediaitemnodes.length; tel++)
    {
      this.mediaitemnodes[tel].setAttribute("data-index", tel);
      this.order.push(tel);
      this.tiles.push({ node: this.mediaitemnodes[tel], href: this.mediaitemnodes[tel].getAttribute("data-href"), index: tel });
    }
    // Get basic info about the device:
    this.device = $wh.detectDevice();
    if(this.device.type != "desktop")
    {
      this.mobiledevice = true;

      // Show the touch triggers for the overlays:
      for(var i = 0; i < this.tiles.length; i++)
        this.tiles[i].node.getElement(".mobiletouch").setStyle("display", "block");

      //Disable vertical scrolling on tablets:
      if(this.device.type == 'tablet')
        this.options.vertical = false;

      if(this.device.type == 'phone')
      {
        // Keep the overlays open:
        this.disableoverlayreset = true;
        this.options.vertical = true;
        this.options.keepevents = false;
      }
      this.options.dragscroll = true;
    }
    else
    {
      this.options.dragscroll = false;
    }



    this.sorter = new Fx.Sort($$(".tile"), { duration: 500, transition: "linear", mode: "horizontal", onComplete: this.enableInteraction.bind(this) });

    this.scrollableview = node.getElement(".wh-scrollableview");

    this.parent(this.scrollableview, this.options);

    if(!this.mobiledevice)
    {
      // Default interactions, use mouseenter and mouseleave
      node.addEvent("mouseenter:relay(.mask)", this.onMouseEnter.bind(this));
      node.addEvent("mouseleave:relay(.tile)", this.onMouseLeave.bind(this));
      //node.addEvent("mouseleave", this.resetOverlays.bind(this));
      //node.getElement(".overlay").addEvent("mouseleave", this.onMouseLeave.bind(this));
    }
    else
    {
      // Mobile interactions, listen for clicks to keep Android happy
      node.addEvent("click:relay(.mask)", this.onMouseEnter.bind(this));
      node.addEvent("touch:relay(.mask)", this.onMouseEnter.bind(this));
      //node.addEvent("lostpointercapture:relay(.mask)", this.onMouseEnter.bind(this));
    }
    // Just add the listener either way, only visible on mobile and < options.mobiletreshold
    node.addEvent("click:relay(.mobiletouch)", this.onMouseEnter.bind(this));

    window.addEvent("resize", this.onDocumentResize.bind(this));
    this.onDocumentResize();
    window.testCarousel = this;
  }



  ////////////////////////////////////////////////////
  //
  //  Private
  //

, onDocumentResize: function()
  {
    this.fits = false;
    var sizes = this.mediabrowser_node.getDimensions();
    var tiles = this.mediabrowser_node.getElementsByClassName("tile");
    var container = this.mediabrowser_node.getElementsByClassName("wh-scrollableview")[0];
    this.limitvisible = tiles.length;

    this.scrollTo(0, 0, false);
    this.lastwidth = sizes.x;

    var ttlwidth = this.limitvisible * this.options.slide_amount;

    var isMobile = sizes.x <= this.options.mobiletreshold;
    var previousState = this.isMobileLayout;
    this.isMobileLayout = isMobile;

    if(ttlwidth > sizes.x && !isMobile)
    {
      tiles[0].parentNode.setStyles({"padding-left": 0, "width": "initial"});
      // Limit to closest odd number of tiles that will fit:
      this.limitvisible = Math.ceil((sizes.x - (this.options.slide_amount)) / this.options.slide_amount);// A margin of 30% of the slide width ensures the actionable elements are always visible within the viewport
      // Reset any margins & positions:
      for(var i = 0; i < this.tiles.length; i++)
        this.tiles[i].node.setStyles({"left": 0, "margin-right": 0});
        //if(previousState != this.isMobileLayout)
        //  this.tiles[i].node.setStyles({"margin-left": "10px", "margin-right": "10px"});

      this.mediabrowser_node.setStyle("height", this.options.tile_height);// Fixes a bug where resizing to mobile and back would create empty space below

      if(this.mobiledevice)
        this.fits = true;
      else
        this.fits = false;// Fixes a bug where the interaction would be disabled when resizing from normal to mobile and back
    }
    else
    {
      this.fits = true;
      var padleft = (sizes.x - ttlwidth) / 2;
      tiles[0].parentNode.setStyles({"padding-left": padleft, "width": "100%"});
      this.updateTileStates();
      if(isMobile)
      {
        // Resize the scroll container:
        this.mediabrowser_node.setStyle("height", (this.options.tile_height + this.options.slide_amount - this.options.tile_width) * this.tiles.length - 1);
        for(var i = 0; i < this.tiles.length; i++)
          this.tiles[i].node.setStyles({"left": (sizes.x - this.options.slide_amount) / 1.5, "margin-left": 0, "margin-right": "auto"});

        this.resetOverlays();
      }
      else
      {
        // Reset any margins:
        for(var i = 0; i < this.tiles.length; i++)
          this.tiles[i].node.setStyles({"left": 0, "margin-right": 0});
      }
      this.resetOverlays();

      if(!this.mobiledevice)
        return;
    }

    //console.log($$(".tile").getStyle("left"));

    var shift = ((ttlwidth - sizes.x) / 2);// + (0.5 * this.options.slide_amount)) / 2);// + (0.5 * (this.options.slide_amount - this.options.tile_width));
    this.scrollTo(shift, 0, false);

    this.resetOverlays();
    this.inanimation = true;
    this.sorter.sort(this.order);
    this.updateTileStates();
    //(function() { console.log($$(".tile").getStyle("left")) }.bind(this)).delay(300);
  }

, updateTileStates: function()
  {
    if(this.fits)
    {
      // All fit; just enable them all:
      for(var i = 0; i < this.tiles.length; i++)
      {
        this.tiles[i].node.addClass("enabled").removeClass("nofocus");
        this.tiles[i].node.setStyle("left", 0);
      }
      return;
    }

    var beforeandafter = Math.floor((this.limitvisible - 1) / 2);
    if(this.limitvisible == 1)
      beforeandafter = 0;

    var center = Math.floor(this.tiles.length / 2);
    var first = center - beforeandafter;
    var last = center + beforeandafter;

    if(first == 0)
      first++;
    if(last == this.tiles.length - 1)
      last--;

    for(var i = 0; i < this.tiles.length; i++)
    {
      this.tiles[i].node.removeClass("leftmost");
      this.tiles[i].node.removeClass("rightmost");
      if(i >= first && i <= last)
      {
        this.tiles[i].node.removeClass("nofocus");
        this.tiles[i].node.addClass("enabled");
      }
    }

    this.tiles[first - 1].node.removeClass("enabled");
    this.tiles[first - 1].node.addClass("nofocus");
    this.tiles[first - 1].node.addClass("leftmost");
    this.tiles[last + 1].node.removeClass("enabled");
    this.tiles[last + 1].node.addClass("nofocus");
    this.tiles[last + 1].node.addClass("rightmost");
  }
, cancelEvent: function(event)
  {
    event.stop();
  }

, onSelectedItem: function(event, node)
  {
    // Ensure we have the node we want, not some random child that happened to catch the click:
    node = this.traverseUpUntil(node, "tile");
    var container = this.mediabrowser_node.getElementsByClassName("wh-scrollableview")[0];
    var slideindex = node.getAttribute("data-index").toInt();
    if(node.hasClass("nofocus"))
    {
      if(node.hasClass("rightmost"))
        // Carousel moves to the left
        this.scrollToRight();
      else
        this.scrollToLeft();

      this.updateTileStates();
    }
    else// Trigger CTA behaviour:
      $wh.navigateTo(node.getAttribute("data-href"));
  }

, traverseUpUntil: function(node, classname)
  {
    while(!node.hasClass(classname))
    {
      node = node.parentNode;
    }
    return node;
  }

, showSelection: function(itemindex, animate_scroll)
  {
    if (this.options.remember_selection)
    {
      if (itemindex == this.selectedindexitem)
        return;

      if (this.selectedindexitem != null)
        this.mediaitemnodes[this.selectedindexitem].removeClass(this.options.item_selectedclass);

      this.mediaitemnodes[itemindex].addClass(this.options.item_selectedclass);

      this.selectedindexitem = itemindex;
    }

  }

, scrollToLeft: function()
  {
    if(!this.inanimation)
      this.inanimation = true;
    else
      return;

    this.order.unshift(this.order.pop());
    this.sorter.sort(this.order);

    this.tiles.unshift(this.tiles.pop());
    this.sorter.sort(this.tiles);

    this.updateTileStates();
    this.resetOverlays(true);
  }

, scrollToRight: function()
  {
    if(!this.inanimation)
      this.inanimation = true;
    else
      return;

    this.order.push(this.order.shift());
    this.sorter.sort(this.order);

    this.tiles.push(this.tiles.shift());
    this.sorter.sort(this.tiles);

    var foundfirst = false;

    this.updateTileStates();
    this.resetOverlays(true);
  }

, onMouseEnter: function(event)
  {
    if(event.target == null)
      return;

    this.lastentertarget = event.target;
    this.mousehasleft = false;
    this.mouseontile = true;
    var node;
    if(event.target.hasClass("tile"))
      node = event.target;
    else
      node = event.target.getParent(".tile");

    var index = this.tiles.indexByProperty("node", node);
    if(!this.mobiledevice)
      this.currenthover = index;

    if(this.inanimation && !this.mobiledevice)
      return;

    if(node.hasClass("enabled") && node.getElement(".overlay").getDimensions().y < this.options.tile_height)
    {
      if(typeof(this.showanimator) == 'object' && this.showanimator !== null)
        this.showanimator.rewind();
      // Show the overlay
      var animation = [ { duration: 0.25
                        , target: node.getElement(".overlay")
                        , from: { height: 0, display: "none" }
                        , to: { height: node.getDimensions().y, display: "block" }
                        }
                      ];
      this.showanimator = new $wh.AnimationTimeline(node.getElement(".overlay"), animation);
      this.showanimator.play();
      this.resetOverlays();
      node.getElement(".mobiletouch").setStyle("visibility", "hidden");
      node.getElement(".mask .title").setStyle("display", "none");
      this.lastmoved = null;
    }
    else
    {
      if(this.lastmoved == index)
        return;

      if(this.showanimator != null)
        this.showanimator.rewind();
      if(this.hideanimator != null)
        this.hideanimator.rewind();

      this.showanimator = null;
      this.hideanimator = null;
      this.resetOverlays();

      if(node.hasClass("leftmost"))
      {
        this.scrollToLeft();
        this.lastmoved = index;
      }
      else if(node.hasClass("rightmost"))
      {
        this.scrollToRight();
        this.lastmoved = index;
      }

      if(this.lastmoved == this.tiles.length)
        this.lastmoved = 0;
      else if(this.lastmoved < 0)
        this.lastmoved = this.tiles.length - 1;

    }
  }

, onMouseLeave: function(event)
  {
    this.mouseontile = false;
    this.currenthover = null;
    this.mousehasleft = true;
    if(!event.target.hasClass("tile"))
      var node = event.target.getParent(".tile");
    else
      var node = event.target;

    if(node == null)
      return;

    var index = this.tiles.indexByProperty("node", node);

    if(this.lastmoved == index)
    {
      if(!this.inanimation)
        this.lastmoved = null;
      return;
    }

    if(node.hasClass("enabled") && !this.inanimation && node.getElement(".overlay").getStyle("height").toInt() > 0)
    {
      // Hide the overlay
      var animation = [ { duration: 0.25
                        , target: node.getElement(".overlay")
                        , from: { height: node.getDimensions().y, display: "block" }
                        , to: { height: 0, display: "none" }
                        }
                      ];
      this.hideanimator = new $wh.AnimationTimeline(node.getElement(".overlay"), animation);
      this.hideanimator.play();
      node.getElement(".mobiletouch").setStyle("visibility", "visible");
      node.getElement(".mask .title").setStyle("display", "inline-block");
    }
    else if(!this.inanimation && this.lastmoved == index)
      this.lastmoved = null;
  }

, enableInteraction: function()
  {
    if(this.isMobileLayout)
      for(var i = 0; i < this.tiles.length; i++)
        this.tiles[i].node.setStyle("left", 0);

    this.inanimation = false;
    if(!this.mouseontile)
      this.lastmoved = null;

  }

, resetOverlays: function(force)
  {
    if(this.disableoverlayreset && !force)
      return;

    for(var i = 0; i < this.tiles.length; i++)
    {
      var node = this.tiles[i].node;
      var index = this.tiles.indexByProperty("node", node);
      index = node.getAttribute("data-index");
      if(index != this.currenthover)
      {
        node.getElement(".mobiletouch").setStyle("visibility", "visible");
        node.getElement(".overlay").setStyles({"height": 0, "bottom": node.parentNode.getDimensions().bottom});
        node.getElement(".mask .title").setStyle("display", "inline-block");
      }
      else
        node.getElement(".mobiletouch").setStyle("visibility", "hidden");
    }
  }
});

})(document.id); //end mootools wrapper
