/* generated from Designfiles Public by generate_data_designfles */
require ('./mediaviewer.css');
require ('frameworks.mootools.core');
require ('wh.ui.popup');
require ('wh.animations.slideshow');
require ('wh.components.scrollableview');
/*! LOAD: frameworks.mootools.core
    LOAD: wh.ui.popup, wh.animations.slideshow, wh.components.scrollableview
!*/

/*

WARNING: Still experimental
    - API and classnames can still change


Supported browsers
    - Internet Explorer 8+
    - Firefox
    - Chrome
    - Safari

What features are supported in which browser:
    - Pausing of video upon leaving a slide is not supported in Internet Explorer < 8
    - Fullscreen mode is supported in all major browser, except Internet Explorer needs version 11 or newer

Features:
    - Support for images and YouTube/Vimeo movies
    - Video's will be paused upon going to another slide or closing the mediaviewer:
    - Fullscreen mode support
    - Autoresize using 'fit' or 'cover'
    - Can be used inline or in a popup
    - Ability to autoresize content when in popup mode
    - Ability to resize in inline mode upon calling resizeAndReposition() (FIXME: change into a public refresh() function?)


FIXME: Flash steals focus. Is there anything we can do about this?
ADDME: Support for our own media player


Usage:

- each slide in the mediaviewer(slideshow) and mediaselector(scrollable view) MUST have CSS class "mediaitem"


JS
  $ut.Mediabrowser      -> $wh.MediaSelector
  $ut.MediaViewer       -> $wh.MediaViewer
  $wh.MediaViewerDialog -> $wh.MediaViewerDialog

CSS classes:
  wh-mediaviewer-title // may not be used anymore??
  wh-mediaviewer-popup
  wh-mediaselector-go-left
  wh-mediaselector-go-right

DOM:
  - YouTube movies
    <div data-type="youtube" data-videoid="[videoid]"></div>

  - Vimeo movies
    <div data-type="vimeo" data-videoid="[videoid]"></div>

*/

if(!window.$wh)
  window.$wh={};

(function($) { //mootools wrapper
"use strict";

// sliding selector thingy
$wh.MediaSelector = new Class(
{ Extends: $wh.Scrollableviews
, Implements: [ Options, Events ]
, options: { horizontal:              true
           , vertical:                false // ADDME: support for vertical scrolling selector

           , autoscroll:              "center_on_selection" // '', center_on_selection', 'keep_selection_in_view' (not implemented yet)

           , item_selectedclass:      "selected"
           , remember_selection:      false      // if used in combination with with a slideshow this is usefull

           , prevbutton:               null       // by default we look for wh-mediaselector-go-left within our containernode for the button
           , prevbutton_enabledclass:  "enabled"
           , prevbutton_disabledclass: "disabled"

           , nextbutton:               null
           , nextbutton_enabledclass:  "enabled"
           , nextbutton_disabledclass: "disabled"

           // "slide"       - slide the thumbnail strip by a fixed amount of pixels (the amount of pixels is specified in slide_amount)
           // "item"        - ADDME
           // "item_select" - buttons will act like previous and next buttons for the attached slideshow (FIXME: this.whSlideshow needs to be set by hand at the moment)
           , browsebutton_behaviour:   "slide"

           , slide_amount:             400
           }
, mediabrowser_node: null
//, tooltip_node:      null

, fullscreen_popup:  null
, mediaitemnodes: []

, selectedindexitem: null // the current selection
, hoveritemindex:    null

, whSlideshow: null

, initialize: function(node, options)
  {
    // Read the supplied options, merge with defaults
    this.setOptions(options);

    if (!this.options.prevbutton)
      this.options.prevbutton = node.getElement(".wh-mediaselector-go-left");

    if (!this.options.nextbutton)
      this.options.nextbutton = node.getElement(".wh-mediaselector-go-right");

    this.mediabrowser_node = node;

    //this.tooltip_node = this.mediabrowser_node.getElement(".mediabrowsertooltip");

    // enumerate mediaitems
    this.mediaitemnodes = this.mediabrowser_node.getElements(".mediaitem");
    for (var tel=0; tel < this.mediaitemnodes.length; tel++)
      this.mediaitemnodes[tel].setAttribute("data-index", tel);

    var scrollableview = node.getElement(".wh-scrollableview");
    this.parent(scrollableview, options);

    //node.addEvent("mouseenter:relay(.mediaitem)", this.showMediaBrowserThumbTitle.bind(this));
    //node.addEvent("mouseleave:relay(.mediaitem)", this.hideMediaBrowserThumbTitle.bind(this));
    node.addEvent("click:relay(.mediaitem)", this.onSelectedItem.bind(this));

    // prevent quick succesive clicks on the buttons being treated as 'double click to select html content' gesture by the browser
    if (this.options.prevbutton)
    {
      this.options.prevbutton.addEvent("mousedown", this.cancelEvent);
      this.options.prevbutton.addEvent("click", this.scrollToLeft.bind(this));
    }

    if (this.options.nextbutton)
    {
      this.options.nextbutton.addEvent("mousedown", this.cancelEvent);
      this.options.nextbutton.addEvent("click", this.scrollToRight.bind(this));
    }

    this.updateNavigationButtonsEnabledState();
  }



  ////////////////////////////////////////////////////
  //
  //  Private
  //

, cancelEvent: function(event)
  {
    event.stop();
  }

, onSelectedItem: function(event, node)
  {
    var slideindex = node.getAttribute("data-index").toInt();
    this.showSelection(slideindex, true);

    // FIXME: when should we and when shouldn't we fire?
    this.fireEvent("change", { "index": slideindex });

    //this.updateNavigationButtonsEnabledState.bind(this);
  }

, showSelection: function(itemindex, animate_scroll)
  {
    if (this.options.remember_selection)
    {
      if (this.mediaitemnodes.length == 0)
      {
        console.warn("No media items");
        return;
      }

      if (itemindex == this.selectedindexitem)
        return;

      // if there was a previous selection, remove the selected class from the corrosponding thumbnail
      if (this.selectedindexitem != null)
        this.mediaitemnodes[this.selectedindexitem].removeClass(this.options.item_selectedclass);

      this.mediaitemnodes[itemindex].addClass(this.options.item_selectedclass);

      this.selectedindexitem = itemindex;
    }

    if (this.options.autoscroll == "center_on_selection")
    {
       var browser_viewport_size = this.mediabrowser_node.getSize();
       var currentthumb = this.mediaitemnodes[itemindex];

       var thumbpos = currentthumb.getPosition(currentthumb.parentNode);
       var thumbsize = currentthumb.getSize();
       var newposx = thumbpos.x - (browser_viewport_size.x - thumbsize.x)/2;
       /*
       if (newposx < 0)
         newposx = 0;

       if (newposx + setup.canvaswidth > thumbholder.scrollWidth)
         newposx = thumbholder.scrollWidth - setup.canvaswidth;
       */
       this.setScroll({ x: newposx, y: 0 }, animate_scroll);
    }

    this.updateNavigationButtonsEnabledState();
  }

, scrollToLeft: function()
  {
    if (this.options.browsebutton_behaviour == "slide")
    {
      var newx = this.getScroll().x - this.options.slide_amount;
      if (newx < 10) // FIXME: make snap-to-edge area width a setting
        newx = 0;

      this.setScroll({ x: newx }, true);
      this.updateNavigationButtonsEnabledState();
    }

    if (this.options.browsebutton_behaviour == "item_browse")
    {
      if (!this.whSlideshow)
      {
        console.warn("whSlideshow not set.");
        return;
      }

      this.whSlideshow.handlePrevButton();
      this.updateNavigationButtonsEnabledState();
    }
  }

, scrollToRight: function()
  {
    if (this.options.browsebutton_behaviour == "slide")
    {
      var newx = this.getScroll().x + this.options.slide_amount;
      var max_x = this.contentdiv.offsetWidth - this.containerdiv.clientWidth;

      if (max_x - newx < 10)
        newx = max_x;

      this.setScroll({ x: newx }, true);
      this.updateNavigationButtonsEnabledState();
    }

    if (this.options.browsebutton_behaviour == "item_browse")
    {
      if (!this.whSlideshow)
      {
        console.warn("whSlideshow not set.");
        return;
      }

      this.whSlideshow.handleNextButton();
      this.updateNavigationButtonsEnabledState();
    }
  }

, linkToSlideshow: function(slideshow)
  {
    this.whSlideshow = slideshow;
    this.updateNavigationButtonsEnabledState();
  }

, updateNavigationButtonsEnabledState: function()
  {
    if (this.options.browsebutton_behaviour == "slide")
    {
      var posx = this.getScroll().x;

      var limits = this.getLimits();

      if (this.options.prevbutton)
        this.setButtonEnabledState(this.options.prevbutton, posx > limits.x[1]);

      if (this.options.nextbutton)
        this.setButtonEnabledState(this.options.nextbutton, posx < -limits.x[0]);
    }

    if (this.options.browsebutton_behaviour == "item_browse")
    {
      if (!this.whSlideshow)
      {
        console.warn("whSlideshow not set.");
        return;
      }

      var currentslide = this.whSlideshow.getCurrentPosition();
      var amountofslides = this.whSlideshow.getNumSlides();

      if (this.options.prevbutton)
        this.setButtonEnabledState(this.options.prevbutton, amountofslides > 0 && currentslide > 0);

      if (this.options.nextbutton)
        this.setButtonEnabledState(this.options.nextbutton, amountofslides > 0 && currentslide < amountofslides-1);
    }
  }

, setButtonEnabledState: function(node, enabled)
  {
    node.toggleClass(this.options.prevbutton_enabledclass,  enabled);
    node.toggleClass(this.options.prevbutton_disabledclass, !enabled);
  }
});



$wh.MediaViewer = new Class(
{ Implements: [ Options ]

, whSlideshow: null
, whSelector:  null

, container: null
, currentslidenode: null

, focusnode: null
, nodes: {}

, autogrow_slideshow: false // MediaViewerDialog set this to true

, options:
    { theme:                   "white"
    , resizemethod:            "fit" // "fit" or "cover"
    , resizemethod_fullscreen: "fit"

    , slideshow_options:       {}
    , slideshow_container:     null // node adhiring to the DOM/cssclasses structure as specified for the $wh.Slideshow

    , selector:                "horizontal" // ""=no selection strip, "horizontal", "vertical"(not implemented yet)
    , browser_container:       null //
    , mediaselector_options:   {}

    , debug_layout:            false

    , resizelistener:          false
    }

, events_active: false

, prev_slide: null

, initialize: function(container, options)
  {
    if ("slideshow_container" in options && options.slideshow_container == null)
      console.warn("Got null as value for slideshow_container");

    if ("browser_container" in options && options.browser_container == null)
      console.warn("Got null as value for browser_container");

    // FIXME: or should we call the mediaselector back to tell them to show the current item as selected?
    this.options.mediaselector_options.remember_selection = true;
    //this.options.slideshow_options.prevbutton = this.options.slideshow_container.getElement(".btn_prevslide");
    this.options.slideshow_options.prevbutton_enabledclass = "enabled";
    //this.options.slideshow_options.nextbutton = this.options.slideshow_container.getElement(".btn_nextslide");
    this.options.slideshow_options.nextbutton_enabledclass = "enabled";

    // Read the supplied options, merge with defaults
    this.setOptions(options);

    this.container = container;

    this.nodes = { slidenr: this.container.getElement(".wh-mediaviewer-slidenr") };

    if (!this.options.slideshow_container)
      this.options.slideshow_container = this.container.getElement(".wh-slideshow-holder");

    if (!this.options.slideshow_container)
    {
      console.error("No slideshow_container specified and also couldn't find a .wh-slideshow-holder in the mediaviewer container.")
      return;
    }

    if (!this.options.browser_container)
      this.options.browser_container = this.container.getElement(".wh-mediabrowser");



    if (this.options.theme)
    {
      this.container.addClass("wh-mediaviewer-theme-"+this.options.theme);

      if (this.options.browser_container)
        this.options.browser_container.addClass("wh-mediaviewer-theme-"+this.options.theme);
    }

    // using an <input> as focusnode would result in a virtual keyboard being triggered on a tablet (iPad)
    // note that visibility: hidden; will make an element unfocusable (at least on some browsers, maybe all)
    this.focusnode = new Element( "button"
                                , { styles:   { position: "absolute", clip: "rect(0,0,0,0)", padding: "0", border: "0" } // "height": 0, "overflow":"hidden", top:"0", left:"0"
                                  //, tabindex: 0
                                  });
    this.focusnode.setAttribute("tabindex", "0");
    this.container.adopt(this.focusnode);

//    this.container.addEvent("click", function() { this.focus(); this.activate(); }.bind(this));
    //this.focusnode.addEvent("blur", this.onLoseFocus.bind(this));

    if (this.options.slideshow_container)
      this.options.slideshow_container.addEvent("click", function() { this.focus(); this.activate(); }.bind(this));

    if (this.options.browser_container)
      this.options.browser_container.addEvent("click", function() { this.focus(); this.activate(); }.bind(this));


    this.whSlideshow = new $wh.Slideshow(this.options.slideshow_container, this.options.slideshow_options);
    this.whSlideshow.addEvent("startslide", this.viewerWentToSlide.bind(this));

    // if we are running in the MediaViewerDialog we have to wait until the onBeforeShow of the popup before resizing
    if (!this.delayinitialresize)
      this.resizeAndReposition();


    if (this.options.browser_container)//this.options.selector == "horizontal")
    {
      this.whSelector = new $wh.MediaSelector(this.options.browser_container, this.options.mediaselector_options);
      this.whSelector.addEvent("change", this.gotoSelectedItem.bind(this));
      this.whSelector.linkToSlideshow(this.whSlideshow);
    }
    //else
    //  console.warn("No browser specified for the mediaviewer.")

    //this.activate();

    // IE<9 has no addEventListener and doesn't have fullscreen events anyway
    if (document.addEventListener)
    {
      // Mootools doesn't correctly handle screenchange events, so whe'll the normal addEventListener
      document.addEventListener("fullscreenchange", this.onFullScreenChange.bind(this), false);
      document.addEventListener("mozfullscreenchange", this.onFullScreenChange.bind(this), false);
      document.addEventListener("webkitfullscreenchange", this.onFullScreenChange.bind(this), false);
      document.addEventListener("MSFullscreenChange", this.onFullScreenChange.bind(this), false);
    }

    // needed for fullscreen mode
    window.addEvent("resize", this.onDocumentResize.bind(this));

    // listen for layout changes
    // (For example when we're used in a tab or masonry)
    this.container.addClass("wh-layoutlistener");
    this.container.addEvent("wh-layoutchange", this.onLayoutChange.bind(this, container) );

    // FIXME: is there a better way?
    var currentpos = this.whSlideshow.getCurrentPosition();
    this.activateSlide(currentpos, this.whSlideshow.slides[currentpos]);
  }

  // FIXME: in case when we are used in a popup/fullscreenmediaviewer we might want
  // to either always keep the focus
, focus: function()
  {
    try { this.focusnode.focus(); } catch(err) { }; // need to catch for older IE's
  }

, gotoSelectedItem: function(data)
  {
    this.gotoSlide(data.index, true);
  }

, gotoSlide: function(index, animate)
  {
    console.info("gotoSlide", index, animate);
    this.whSlideshow.gotoSlide(index, animate);
  }

, refresh: function()
  {
    this.resizeAndReposition();
  }

  // FIXME: we should replace this with a more generic layout helper
, resizeAndReposition: function(viewport_size)
  {
    if (this.options.debug_layout)
      console.log("resizeAndReposition", viewport_size);


// don't relayout if the size is the same
// ADDME: do something if size hasn't changed but this.options.resizemethod_* has changed.

    var flexible = this.autogrow_slideshow || this.fullscreen_mode;

    // reset sizes so are able to recalculate needed space
    // both for resizing and for going into or out of fullscreen mode
    var slideshow_cont = this.options.slideshow_container;
    var slideholder = slideshow_cont.hasClass("wh-slideshow-holder") ? slideshow_cont : slideshow_cont.getElement(".wh-slideshow-holder");
    var slidearea = slideholder.getElement(".wh-slideshow-slidearea");
    $$(slideshow_cont, slideholder, slidearea).setStyles({ width: "", height: "" });

    var slideshow_setsize;
    var sizecontainer;

    if (this.fullscreen_mode)
    {
      // FIXME: our mediaviewer element should be the viewport (since it could be part of the fullscreen element OR be the fullscreen element itself)
      var winsize = window.getSize(); // fullscreen
      viewport_size = { width: winsize.x, height: winsize.y };

      if (this.options.debug_layout)
        console.log("Fullscreen size: ", viewport_size);

      sizecontainer = this.container; // our mediaviewer node now has 100% width and height (or use window size??)
    }
    else if(viewport_size) // used for dialog mode
    {
      //slideshow_setsize = { width: viewport_size.width, height: viewport_size.height };
      sizecontainer = this.container; // our mediaviewer node now has 100% width and height (or use window size??)
    }
    else if (this.whPopup)
    {
      // the viewport is our popup
      viewport_size = this.whPopup.getSize();
      sizecontainer = this.whPopup.nodes.body; // FIXME: this is a PRIVATE variable!!
    }
    else
    {
      // FIXME: why?
      var containersize = this.options.slideshow_container.getSize(); // inline mode, use the size of the container element??
      sizecontainer =  this.options.slideshow_container; // our mediaviewer node now has 100% width and height (or use window size??)

      viewport_size = { width:  containersize.x
                      , height: containersize.y
                      };
    }

    if (this.options.debug_layout)
      console.log("Mediaviewer viewport size:", viewport_size, (flexible ? "(flexible)":"") );

    slideshow_setsize = viewport_size;

    // in a popup or fullscreen mode (in which case we for now ?
    // If our container doesn't try to specify a size (100%, px or top:0;bottom:0)
    // we can calculate how much space we have left for the slideshow
    // FIXME: no, now we use the last element to check how large we are
    if (flexible)
    {
      var height_to_fill = viewport_size.height;

      // find the last in-flow element
      var last_inflow = this.container.lastChild;
      while(last_inflow)
      {
        if (last_inflow.nodeType == 1 && !(["fixed", "absolute"].contains(last_inflow.getStyle("position")) ) )
          break;

        last_inflow = last_inflow.previousSibling;
      }

      if (!last_inflow)
      {
        console.error("Missing content in our mediaviewer.");
        return;
      }

      // !!!!!! For fullscreen mode it's IMPORTANT to have the mediaplayer's container have a position...
      //        Otherwise we get the offsetTop to an element outside our fullscreen, causing negative compensation heights...
      var lastelem_y = last_inflow.offsetTop; //last_inflow.getBoundingClientRect().top - this.container.getBoundingClientRect().top;
      var lastelem_h = last_inflow.getSize().y;
      var content_height = lastelem_y + lastelem_h;

      var current_slideshow_height = this.options.slideshow_container.offsetHeight;
      var compensation = height_to_fill - content_height; // should be amount of free space, unless other content takes up too much room

      var new_slideshow_height = current_slideshow_height + compensation;
//alert(current_slideshow_height + " / " + compensation + " / " + new_slideshow_height);

      if (this.options.debug_layout)
      {
        console.log
          ( "node used to determine height: ", sizecontainer, " \n"
          , "viewport height (popup): ", viewport_size.height, " \n"
          //, "viewport v.overhead (popup): ", view

          , "height_to_fill", height_to_fill, " \n"
          //, "sizecontainer scrollHeight", sizecontainer.scrollHeight, " \n"
          , " \n"
          , "lastelem", last_inflow, "\n"
          , "lastelem_y", lastelem_y, " relative to ", this.container, " \n"
          , "lastelem_h", lastelem_h, " \n"
          , " \n"
          , "content_height", content_height, " \n"
          , "current_slideshow_height", current_slideshow_height, " \n"
          , "compensation", compensation, " \n"
          );
      }
      slideshow_setsize.height = new_slideshow_height;

      var slideshow_cont = this.options.slideshow_container;
      var slideholder = slideshow_cont.hasClass("wh-slideshow-holder") ? slideshow_cont : slideshow_cont.getElement(".wh-slideshow-holder");
      var slidearea = slideholder.getElement(".wh-slideshow-slidearea");

      $$(slideshow_cont, slideholder, slidearea).setStyles(
              { width:  slideshow_setsize.width
              , height: slideshow_setsize.height
              });
    }

    if (this.options.debug_layout)
      console.log("New slide size: " + slideshow_setsize.width + " x " + slideshow_setsize.height);

    this.whSlideshow.setOptions({ "slidewidth":  slideshow_setsize.width
                                , "slideheight": slideshow_setsize.height
                                });

    this.whSlideshow.refresh();

    var slides = this.whSlideshow.slides; // wh-slideshow-item
    for(var idx = 0; idx < slides.length; idx++)
    {
      var currentslide_node = slides[idx];
      this.resizeSlide(currentslide_node, slideshow_setsize.width, slideshow_setsize.height);
    }
  }

  // FIXME: move to the normal viewer, but first we need some kind of way to get and lose focus there
  // (for the fullscreen viewer we can just assume we are in a modal dialog)
, activate: function()
  {
    if (!this.events_active)
    {
      this.checkkey = this.checkKey.bind(this);

      // keydown, because the browser scrolls after keydown
      this.focusnode.addEvent("keydown", this.checkkey);

      this.events_active = true;
    }
    this.focusnode.focus();
  }

, deactivate: function()
  {
    if (this.events_active)
    {
      //$(document).removeEvent("keyup", this.checkkey);
      this.focusnode.removeEvent("keydown", this.checkkey);
      this.events_active = false;
    }

    if (this.prev_slide)
      this.deactivateSlide(this.prev_slide);
  }



  ////////////////////////////////////////////////////
  //
  //  Private
  //

, onDocumentResize: function()
  {
    //console.info("$wh.MediaViewer.onDocumentResize");
    if (this.fullscreen_mode)
      this.resizeAndReposition();
  }
, onLayoutChange: function()
  {
    //console.info("$wh.MediaViewer.onLayoutChange");
    this.resizeAndReposition();
  }

, onFullScreenChange: function()
  {
    var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
    if (fullscreenElement == null)
    {
      if (this.fullscreen_mode == true)
      {
        this.fullscreen_mode = false;
        this.resizeAndReposition();
      }
    }
    else if (fullscreenElement.contains(this.container))
    {
      this.fullscreen_mode = true;
      this.activate();
      this.resizeAndReposition();
    }
  }

, viewerWentToSlide: function(evt)
  {
    this.activateSlide(evt.current, evt.currentslide);
  }

, deactivateSlide: function(slide)
  {
    var typedcontent = slide.getElements("[data-type]");

    for(var idx=0; idx < typedcontent.length; idx++)
    {
      var node = typedcontent[idx];
      var type = node.getAttribute("data-type");

      switch(type)
      {
        case "youtube":
            var iframe = node.getElement("iframe");
            if (!iframe)
              return;

            if (window.postMessage)
            {
              // Officially the YouTube iframe API must be used
              // But it requires you to dynamically create a video and we have to wait for the API to have been loaded/ready.
              //
              //http://stackoverflow.com/questions/7443578/youtube-iframe-api-how-do-i-control-a-iframe-player-thats-already-in-the-html
              //iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*')
              iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
            }
            break;

        case "vimeo":
            var iframe = node.getElement("iframe");
            if (window.postMessage)
            {
              // Chrome may throw an exception saying the message was blocked,
              // (on localhost usage?) but the message probably still reached the destination, which it should since we used "*")
              var val = JSON.encode({ method: "pause" });
              iframe.contentWindow.postMessage(val, "*");
            }
      }
    }
  }

, activateSlide: function(index, slide)
  {
    if (this.nodes.slidenr)
      //this.nodes.slidenr.set("text", evt.current+1 + " / " + evt.num);
      this.nodes.slidenr.set("text", index+1 + " / " + this.whSlideshow.getNumSlides());

    if (this.whSelector)
      this.whSelector.showSelection(index);

    if (this.prev_slide)
      this.deactivateSlide(this.prev_slide);

    this.prev_slide = slide;

    var typedcontent = slide.getElements("[data-type]");
    for(var idx=0; idx < typedcontent.length; idx++)
    {
      var node = typedcontent[idx];
      if (node.__initialized)
        continue;

      var type = node.getAttribute("data-type");

      switch(type)
      {
        case "youtube":
            var videoid = node.getAttribute("data-videoid");
            if (videoid)
            {
              var embed = new Element( "iframe"
                                     , { "src":    "http://www.youtube.com/embed/" + videoid + "?enablejsapi=1"
                                       , "width":  "100%"
                                       , "height": "100%"
                                       , "frameborder": 0
                                       , "allowfullscreen": "true"
                                       }
                                     );
//embed.addEventListener("focus", this.test.bind(this));
              node.adopt(embed);
              node.setStyle("height", "100%");
            }
            break;

        case "vimeo":
            var videoid = node.getAttribute("data-videoid");
            if (videoid)
            {
              var embed = new Element( "iframe"
                                     , { "src":    "http://player.vimeo.com/video/" + videoid + "?api=1"
                                       , "width":  "100%"
                                       , "height": "100%"
                                       , "frameborder": 0
                                       , "allowfullscreen": "true"
                                       }
                                     );
//embed.addEventListener("focus", this.test.bind(this));
              node.adopt(embed);
              node.setStyle("height", "100%");
            }
            break;
      }

      node.__initialized = true;
    }


    //if (this.titlebar)
    //  this.titlebar.set("text", slide.getAttribute("data-title"));

    // clean up running iframes/videos
    if (this.currentslidenode)
    {
      // kill the iframe so any playback of audio or video in the iframe will stop
      // we will reload the page as soon as we want this slide being shown again
      var iframes = this.currentslidenode.getElements("iframe");
      for(var tel=0; tel < iframes.length; tel++)
      {
        var frm = iframes[tel];

        if (frm.getAttribute("data-src") != null)
          frm.setAttribute("src", ""); // so IE will kill the iframe (removing the attribute doesn't do that)
      }
    }

    this.currentslidenode = this.whSlideshow.slides[index];

    // for selected slide check for iframe's and replace src with data-src if not done already
    // FIXME: it would be more foolproof if we didn't just read stuff from another class directly
    var iframes = this.currentslidenode.getElements("iframe");
    for(var tel=0; tel < iframes.length; tel++)
    {
      var frm = iframes[tel];
      var setsrc = frm.getAttribute("data-src");

      frm.style.display = "block"; // in IE7 it's not a block by default?? causing a few extra pixels below the iframe
      frm.setAttribute("frameBorder", "0"); // IE ignores the border:0; style for iframes
      frm.setAttribute("allowTransparency", "true"); // IE shows an opaque background in the iframe without this

      if (setsrc != null)
        frm.src = setsrc;
    }
  }

, resizeSlide: function(slide, width, height)
  {
    slide.setStyles({ width:  width
                    , height: height
                    });

    var imgnode = slide.getElement("img");
    if (!imgnode)
      return;

    var resizemethod = this.fullscreen_mode ? this.options.resizemethod_fullscreen : this.options.resizemethod;

    if (resizemethod == "fit")
    {
      var imgwidth = imgnode.width;
      var imgheight = imgnode.height;

      if (imgwidth == 0 || imgheight == 0)
        return;

      var scale_x = width / imgwidth;
      var scale_y = height / imgheight;
      var scale = scale_x < scale_y ? scale_x : scale_y;

      var new_width = Math.round(imgwidth * scale);
      var new_height = Math.round(imgheight * scale);

      var coversize =
          { position: "absolute"
          , left:     (width - new_width) / 2
          , top:      (height - new_height) / 2
          , width:    new_width
          , height:   new_height
          };

      imgnode.setStyles(coversize);
    }
    else if (resizemethod == "cover")
    {
      var coversize = $wh.getCoverCoordinates(imgnode.width, imgnode.height, width, height);
      coversize.position = "absolute";
      imgnode.setStyles(coversize);
    }
  }

, checkKey: function(evt)
  {
    var fully = (Browser.Platform.mac && evt.meta) || evt.alt;

    switch(evt.code)
    {
      case 9:
        this.container.toggleFullScreen();
        break;

      case 37:
        evt.preventDefault();

        if (fully)
          this.whSlideshow.gotoSlide(0);
        else
          this.whSlideshow.gotoSlideRelative(-1, true);

        //if (itemindex != this.hoveritemindex)
        //if (this.whSelector)
        //  this.whSelector.hideMediaBrowserThumbTitle();
        break;

      case 39:
        evt.preventDefault();

        if (fully)
          this.whSlideshow.gotoSlide( this.whSlideshow.getNumSlides() - 1 );
        else
          this.whSlideshow.gotoSlideRelative(1, true);

        //if (this.whSelector)
        //  this.whSelector.hideMediaBrowserThumbTitle();
        break;
    }

    return false;
  }
});


// FIXME: Extend MediaViewer or extend popup and implement MediaViewer ??
$wh.MediaViewerDialog = new Class(
{ Extends: $wh.MediaViewer
, options:  { slideshow_container: null
            , browser_container:   null
            , fullscreen:          false
            , popup_options:       {}
            , theme:               "black"
            }

//, checkkey: null
, whPopup:  null
, popupbody: null

//, animframe: null

, delayinitialresize: true

, initialize: function(container, options)
  {
    if (!container)
    {
      console.error("Container not specified.");
      return;
    }

    this.popupbody = new Element("span");
    this.parent(container, options);

    this.autogrow_slideshow = true;

    if ("cssclass" in this.options.popup_options)
      this.options.popup_options.cssclass += " wh-mediaviewer-popup";
    else
      this.options.popup_options.cssclass = "wh-mediaviewer-popup";

    if ("theme" in this.options)
    {
      this.options.popup_options.theme = this.options.theme;
    }

    //this.options.popup_options = Object.append( $wh.BasicPopup.prototype.options , options.popup_options );
    this.options.popup_options.valign_content = false;

    // direct add events, if we init after the popup initialization we might miss the beforeshow event
    //this.options.popup_options.onBeforeshow = this.onBeforePopupShow.bind(this);
    this.options.popup_options.show = false;

    this.whPopup = $wh.PopupManager.createFromElement(this.popupbody, this.options.popup_options);
    this.whPopup.addEvent("beforeshow", this.onBeforePopupShow.bind(this));
    this.whPopup.addEvent("afterhide", this.onAfterHide.bind(this));
    this.whPopup.addEvent("aftershow", this.activate.bind(this));
    this.whPopup.addEvent("resize", this.resizeAndRepositionByPopup.bind(this));

    this.popupbody.adopt(container);

    this.show();
  }

, refresh: function()
  {
    this.resizeAndReposition();
  }

, resizeAndReposition: function(data)
  {
/*
    var viewport_size = data ? data : this.whPopup.getSize();
    var slideshow_size = viewport_size;//{ x: viewport_size.width, y: viewport_size.height };

console.log("resizeAndReposition", viewport_size);

*/
    this.parent(); //slideshow_size); // let the mediaviewer resize/reposition media
  }

, show: function()
  {
    this.whPopup.show();

    // we are in a modal dialog, we are the dominant content on the page now
    // so get the focus so we get all keyboard input for navigation purposes
    this.focus();
  }

, hide: function()
  {
    this.whPopup.hide();
  }


  ////////////////////////////////////////////////////
  //
  //  Private
  //

, onBeforePopupShow: function()
  {
    this.activate();
    this.resizeAndReposition(); // FIXME: double reposition (mediaviewer class also does this, but too early for us to correctly measure)
  }

, onAfterHide: function()
  {
    this.deactivate();
  }

, resizeAndRepositionByPopup: function(data)
  {
    this.resizeAndReposition(data)
  }
});


})(document.id); //end mootools wrapper
