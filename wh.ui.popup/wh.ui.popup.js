/* generated from Designfiles Public by generate_data_designfles */
require ('./popup.css');
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('frameworks.mootools.more.element.measure');
require ('wh.ui.base');
require ('wh.util.csstransitionmanager');
/*! LOAD: frameworks.mootools.core, wh.compat.base, frameworks.mootools.more.element.measure
    LOAD: wh.ui.base
    LOAD: wh.util.csstransitionmanager
!*/

/***********************************************************

Popups
Copyright B-Lex Information Technologies 2010-2015


Browser min requirements:
  - iOS 5 (older iOS doesn't support position: fixed;)
  - Internet Explorer 8 (version 9 to correctly see the default theme's)
  - FF, SF, CHR


How to use:

  Opening a dialog:

    var popup = $wh.PopupManager.createFromElement("elementid", options);
    var popup = $wh.PopupManager.createFromURL("url", options);

    <a href="" target="wh-popup" />
    <div data-popup="elementid" data-popup-options="closebutton=false,width=500,scroll=popup_viewport,valign_content"></div>


  Templating & Styling

    $wh.PopupManager.setDefaultPopupOptions({ theme: "mytheme", explicitclose: true, closebutton: false });

    Safely styleable classes:

        .wh-popup-chrome               - the full visibile part of the popup (including close button)
        .wh-popup-body
        .wh-popup-body-container       - if valign: true, this is the content that will be aligned within the body
        .wh-popup-closebutton
        .wh-popup-modalitylayer

        body.wh-modal-popup-active ..... - can be used for example to disable main scrollbars while a popup is activate

    Action classes

        .wh-popup-action-close - a click on an element with this class will close the popup
                                 the option canclose does not influence this action.

    Specify:
        background-color -> in .wh-popup-chrome
        padding          -> in .wh-popup-body-container
        min-height       -> in .wh-popup-body-container

    Giving the popup a minimum size and having the content centered:

        - Pass valign_content:true in JS or use data-popup-options="valign_content" in your popup node
        - Also specify the min size in your CSS

              .wh-popup-body-container
              {
                min-width:  320px;
                min-height: 250px;
              }

    Defining theme's and animation's

      .wh-popup-chrome.theme-<themename>
      .wh-popup-chrome.animin-<effect_name>
      .wh-popup-chrome.animout-<effect_name>

      .wh-popup-show - used to trigger animation

      NOTE: transitions are assumed to be on (and detected on) the wh-popup-chrome.
            Transitions on other elements are not detected.



Events on popup instances
(some as we use for Single Page Applications)

  - beforeshow -> fired just before the popup becomes visible, this can be used to prepare or reset the contents of the popup
                  Doing DOM changes here may help to prevent flicker. Since at this time the popup is in the DOM with display: block;
                  looking up and measures elements is possible.
  - aftershow  -> fired after the animation has finished
  - beforehide -> usefull for storing the state of content (forms, iframes etc.) before it might be lost
  - afterhide  -> fired after the animation has finished and the popup is removed (display: none; or removed from the DOM)
  - resize     -> fired when the popup has changed in size
  - activate   -> Invoked whenever the dialog becomes the topmost dialog (either by being shown, or by a child popup disappering)
  - cancel     -> fired before closing the dialog (due to clicking on the close button or modality layer).
                  if preventDefault is used, the dialog will be prevented from closing.

  - ADDME: add an beforefirstshow ?



Events on $wh.PopupManager
(they pass an object which contains a reference to the popup instance)

  - beforeshow -> fired just before a popup becomes visible
  - aftershow
  - beforehide
  - aftershow  -> fired after the popup's animation has finished
  - activate



Next popup version:
  - use animations instead of transitions?? (if we can properly animate multiple CSS properties)
  - only support the JSON version of popup settings



***********************************************************/


(function($) { //mootools wrapper
"use strict";

if($wh.Popup)
  console.error("Trying to mix old and new popup code! - do not load both wh.ui.popup an wh.components.whpopup");

$wh.Popup = {};


// handle all popup elements (Dialogs & Popuppanels)
$wh.PopupManagerClass = new Class(
{ Implements:    [ Events, Options ]

, options:       { debug:            false
                 , keepscrollevents: true  // true/false - block scroll events from bubbling outside the popup
                 }

, popups:        []   // array of all popup instances
, popupstack:    []   // stack with all currently opened popups
, modalstack:    []   // stack of open modal dialogs

, defaultpopupoptions: {}

, modalitylayer: null // object handling the modality layer

, initialize: function()
  {
  }

, initDOM: function()
  {
    this.setupHandlers( $(document.body) );
  }

  ////////////////////////////////////////////////////
  //
  //  Public API
  //

  /** @short set overrides for the defaults which will be used when creating new popups through this manager
             Preferable use this before domready or as first call in your domready.
             (so popups opened directly upon loading the site use the correct settings)
  */
, setDefaultPopupOptions: function(options)
  {
    this.defaultpopupoptions = options;
  }

  /** @param element the id of an element or reference to the node
      @param settings
      FIXME: settings are currently only used upon creating the popup... should it also update when reopening??
  */
, createFromElement: function(element, settings)
  {
    if (!settings)
      settings = {};

    //console.info("Creating popup using createFromElement on element", element)
    var popup = this.getPopup(element);
    if (!popup)
    {
      var element2 = $(element);
      if (!element2)
      {
        console.error("createFromElement failed: cannot find element", element)
        return;
      }

      var combinedsettings = this.__computePopupOptions(element2, settings, "data-popup-options");

      // prevent show() before we imported content
      // (against possible content flash or beforeshow() called before we did .importContent)
      var orig_show = combinedsettings.show;
      combinedsettings.show = false;

      popup = new $wh.BasicPopup(element, combinedsettings);
      popup.importContent(element);

      // restore original show value to true,
      // if indeed it was true or if show wasn't specified (the popup used true as default)
      if (orig_show === true || typeof(orig_show) == "undefined")
        popup.options.show = true;
    }
    else if (this.options.debug)
      console.info("createFromElement reusing the popup already created using element", element);

    if (popup.options.show)
      popup.show();

    return popup;
  }

  /** FIXME: how to reuse the popup (maybe target="wh-popup[mywebviewer]"??)
  */
, createFromURL: function (url, settings)
  {
    if (!settings)
      settings = {};

    settings.url = url;

    var popup;
    if (settings.id)
      popup = this.getPopup(settings.id, url, settings);

    if (!popup)
    {
      var combinedsettings = {};
      Object.append(combinedsettings, this.defaultpopupoptions);
      //Object.append(combinedsettings, settings_attribute);
      Object.append(combinedsettings, settings);
      //combinedsettings.show = false;

      // create a WebviewerPopup with either the specified popupid or make it anonymous
      popup = new $wh.WebviewerPopup(settings.id ? settings.id : null, combinedsettings);
    }
    else if (popup.options.show)
      popup.show();

    return popup;
  }
, closeAll: function()
  {
    $wh.Popup.closeAll();
  }

  /** @short get the instance of a popup by it's ID () or reference to the element used to create it
  */
, getPopup: function(popup_id_or_ref)
  {
    if (popup_id_or_ref === null)
      return null;

    var _isid = typeof(popup_id_or_ref) == "string";

    for(var tel=0; tel < this.popups.length; tel++)
    {
      var popup = this.popups[tel];
      if (_isid)
      {
        if (popup.id == popup_id_or_ref)
          return popup.instance;
      }
      else
      {
        if (popup.contentnode == popup_id_or_ref)
          return popup.instance;
      }
    }
    return null;
  }

, isPopupOpen:function(popup_id_or_ref)
  {
    var popup = this.getPopup(popup_id_or_ref);
    if(!popup)
      return false;

    return popup.open;
  }

  /** @short get the instance of the popup which contains the specified node
  */
, getPopupContainingNode: function(node)
  {
    var popupcontainer = node.getParent(".wh-popup-container");

    for(var idx = 0; idx < this.popups.length; idx++)
    {
      if (! this.popups[idx].instance)
      {
        // MARK: I've seen this happen on very rare occasion... I want to know why
        //       Find and fix the issue and then get rid of this debug code?
        console.info("instance in this.popups["+idx+"]=== null !!", this.popups);
        continue;
      }

      if (this.popups[idx].instance.nodes.container == popupcontainer)
        return this.popups[idx].instance;
    }

    return null;
  }



  ///////////////////////////////////////////////////////////////
  //
  //  Semi-Private (for use in classes based on $wh.BasicPopup)
  //

, addToStack: function(instance, modal)
  {
    // FIXME: how to handle show() on a popup again.. push it to the front (+update position in popup stack??)

    if (this.popupstack.indexOf(instance) > 0)
      return; // already in the stack

    if (modal)
    {
      //console.log("Pushing ", instance.nodes.body, "onto the modal stack.");
      this.modalstack.push(instance);
      this.modalitylayer.show(instance.nodes.container);
    }

    this.popupstack.push(instance);
  }

, removeFromStack: function(instance)
  {
    //console.info("Removing popup from stack ", instance.nodes.container);

    var popupidx = this.popupstack.indexOf(instance);
    if (popupidx > -1)
      this.popupstack.splice(popupidx, 1);

    var modalidx = this.modalstack.indexOf(instance);
    if (modalidx > -1)
    {
      this.modalstack.splice(modalidx, 1);

      if (this.modalstack.length == 0)
        this.modalitylayer.hide();
      else
      {
        var currentmodalpopup = this.modalstack[this.modalstack.length-1];
        this.modalitylayer.show(currentmodalpopup.nodes.container);

        currentmodalpopup.ensureFocus();
        currentmodalpopup.fireEvent("activate");
        $wh.PopupManager.fireEvent("activate", { popup: this });
        currentmodalpopup.nodes.chrome.fireEvent("wh-popup-activate", { target: currentmodalpopup.nodes.chrome });
      }
    }
  }



  ////////////////////////////////////////////////////
  //
  //  Private
  //

, register: function(popupinstance, popup_id_or_ref)
  {
    if (popup_id_or_ref === null) // anonymous? (Webviewer without options.id specified)
    {
      this.popups.push({ id:          null // anonymous
                       , contentnode: null
                       , instance:    popupinstance
                       });
      return;
    }

    var _isid = typeof(popup_id_or_ref) == "string";
    if (_isid)
    {
      // id of the node used in the popup, or ID only used to indicate this popup (in which case contentnode will be null)
      this.popups.push({ id:          popup_id_or_ref
                       , contentnode: $(popup_id_or_ref)
                       , instance:    popupinstance
                       });
    }
    else
    {
      // reference to the node used in the popup
      this.popups.push({ id:          popup_id_or_ref.id
                       , contentnode: popup_id_or_ref
                       , instance:    popupinstance
                       });
    }
  }

, unregister: function(popupinstance)
  {
    var index = this.getPopupIndex(popupinstance);
    if (index > -1)
      this.popups.splice(index, 1);
    else
      console.warn("Could not find popup to unregister:", popupinstance);
  }

  // FIXME: should be a generic Array object function
, getPopupIndex: function(popup_id_or_ref)
  {
    if (popup_id_or_ref === null)
      return null;

    var key;
    if (typeof(popup_id_or_ref) == "string")
      key = "id";
    else if (popup_id_or_ref instanceof $wh.BasicPopup)
      key = "instance"
    else if (popup_id_or_ref instanceof HTMLElement)
      key = contentnode;
    else
    {
      console.error("Can only lookup popup by id, popup instance or contentnode.");
      return null;
    }

    //console.log("Looking up popup by key", key);

    return this.popups.indexByProperty(key, popup_id_or_ref);
  }

, __computePopupOptions: function(node, options, options_attribute)
  {
    var combinedsettings = {};

    // Parse popup options defined using a DOM attribute
    var options_str = node.getAttribute(options_attribute);
    var options_from_attribute = this.parsePopupOptionsString(options_str, $wh.BasicPopup.prototype.options);

    if (this.options.debug)
    {
      console.group("Popup option sources");
      console.log("setDefaultPopupOptions:", this.defaultpopupoptions);
      console.log("data-options:", options_from_attribute);
      console.log("JS options:", options);
    }

    Object.append(combinedsettings, this.defaultpopupoptions);
    Object.append(combinedsettings, options_from_attribute);
    Object.append(combinedsettings, options);

    if (this.options.debug)
    {
      console.log("Combined:", combinedsettings);
      console.groupEnd();
    }

    return combinedsettings;
  }

  /** @short parse a popup options string (as used in data-popup-options="")
  */
, parsePopupOptionsString: function(optionsstring, options_prototype)
  {
    var options = {};

    if (!optionsstring)
      return options;

    var options_arr = optionsstring.split(",");
    for (var tel=0; tel<options_arr.length; tel++)
    {
      var keyval = options_arr[tel].split("=");

      if (keyval[0] in options_prototype)
      {
        var optiontype = typeof $wh.BasicPopup.prototype.options[keyval[0]];
        //console.log(keyval[0], optiontype, keyval[1]);

        if (optiontype == "boolean")
        {
          if (keyval.length == 1 || keyval[1] == "true")
            options[keyval[0]] = true;
          else if (keyval[1] == "false")
            options[keyval[0]] = false;
          else
            console.error("Popup option", keyval[0], " requires true/'' or false but got", keyval[1], ".");
        }
        else if (optiontype == "number")
        {
          // store as number, or fall back to string if we couldn't parse it as number
          // (some options allow a pixel value or string, for example: "stretch")
          var value = parseFloat(keyval[1]);
          options[keyval[0]] = isNaN(value) ? keyval[1] : value;
        }
        else // assume string
          options[keyval[0]] = keyval[1];
      }
      else
        console.error("Unknown popup options \""+keyval[0])+"\"";
    }

    return options;
  }



  ////////////////////////////////////////////////////
  //
  //  Private / Events
  //

, setupHandlers: function(container)
  {
    if($wh.legacyclasses)
      container.addEvent("click:relay(a[target='-wh-popup'])", this.onAnchorClick.bind(this)); // deprecated
    container.addEvent("click:relay(a[target='wh-popup'])", this.onAnchorClick.bind(this));
    container.addEvent("click:relay([data-popup])", this.onElementClick.bind(this));

    window.addEvent("message", this.onMessage.bind(this)); // for autoresize... ADDME: extend to real event for other users?
    window.addEvent("resize", this.onViewportResize.bind(this)); // for autosizing (width or height option set to "stretch")
    window.addEvent("orientationchange", this.onOrientationChange.bind(this)); // needed for correct resizing in iOS after an orientation change
    window.addEvent("mousewheel", this.onMouseWheel.bind(this)); // for preventing mousewheel leaking/scrolling outside the popup
  }

, onAnchorClick: function(evt)
  {
    evt.stop();

    var anchor = evt.target.getSelfOrParent("a");

    var url = anchor.href;

    // Parse popup options defined using a DOM attribute
    // The option (key) is checked for existence, but the value isn't validated yet
    // FIXME: also validate the value
    var settings_str = anchor.getAttribute("data-popup-options");
    var settings_attribute = this.parsePopupOptionsString(settings_str, $wh.WebviewerPopup.prototype.options);
    this.createFromURL(url, settings_attribute);
  }

, onElementClick: function(evt, element)
  {
    evt.stop();
    var popupid = element.getAttribute("data-popup");
    this.createFromElement(popupid);
  }

, onMessage: function(evt)
  {
    if (typeof evt.data != "string")
      return;

    // ignore if it isn't meant for us
    if (evt.data.substr(0, 10) != "wh-popup:")
      return;

    // dispatch to the correct popup instance
    var iframe = evt.source.frameElement;
    var popupnode = iframe.getParent(".wh-popup-chrome, .-wh-popup-chrome");
    if (!popupnode)
    {
      console.error("Failed to find popup associated to the message.");
      return;
    }

    var popupinstance = popupnode.retrieve("wh-popup-instance");

    // FIXME: still dispatch in case the popup is closed (and invisible)??
    if (popupinstance)
    {
      if (popupinstance.onMessage)
        popupinstance.onMessage(evt, evt.data.substr(10));
    }
    else
      console.error("Cannot find owner popup of iframe which messaged us.");
  }

, onOrientationChange: function(evt)
  {
    // workaround for iOS so it resizes *after* the new viewport size is known
    this.onViewportResize.delay(0, this, evt);
  }

  // inform all open popups on the changed viewport size
, onViewportResize: function(evt)
  {
    for(var tel=this.popupstack.length-1; tel>=0; tel--)
    {
      var popup = this.popupstack[tel];
      if (popup.open)
        popup.onResize();
    }
  }

  // FIXME: it might be possible to keep 1px of scrollable content according to our measurement due to rounding errors
, onMouseWheel: function(evt)
  {
    if (!this.options.keepscrollevents || this.modalstack.length == 0)
      return;

    var popup = this.getPopupContainingNode(evt.target);
    if (!popup)
    {
      evt.stop();
      return;
    }

    var popupcontentnode;
    if (popup.options.scroll == "popup_viewport")
      popupcontentnode = popup.nodes.container;
    else
      popupcontentnode = popup.nodes.chrome; // .wh-popup-chrome

    //console.info(evt.wheel.toFixed(2), evt.target, evt.relatedTarget);
    /*
    if (evt.wheel > 0)
      console.log("Scrolling up");
    else
      console.log("Scrolling down");
    */

    var node = evt.target;
    while(node)
    {
      if (["visible","hidden"].contains(node.getStyle("overflow")))
      {
        //console.log(node, "is not a scrollable element");
      }
      else
      {
        // trying to scroll up and this node is still scrollable?
        if (evt.wheel > 0)
        {
          if (node.scrollTop > 0)
          {
            //console.log("Can still scroll:", node);
            return;
          }
        }
        else if (evt.wheel < 0)
        {
          var over = node.scrollHeight - node.clientHeight - node.scrollTop;
          if (over > 0)
          {
            //console.log("Can still scroll:", node);
            return;
          }
        }
      }

      if (node == popupcontentnode)
        break; // no nodes up to this point needed to scroll, so we can stop looking and just cancel the scroll event to prevent elements above us to scroll

      node = node.parentNode;
    }

    evt.stop();
  }
});

$wh.PopupManager = new $wh.PopupManagerClass();

$(window).addEvent('domready', $wh.PopupManager.initDOM.bind($wh.PopupManager) );



/*

FIXME: should we make the website author use CSS width & height options for size control?
       height, min-height, box-sizing and calc() should give tremendous control while keeping the popup code simple.
       If width or height are set to auto, let's assume they want autosize (unless it's an URL-popup in which case we want an explicit autosize property)

FIXME: align naming (open/close or show/hide.... transition_open/close or animin/animout)

*/

$wh.BasicPopup = new Class(
{ Implements: [ Options, Events ]
, options:
      {// Styling
        theme:              "white" // pass an empty string to disable default themes
      , cssclass:           ""      // extra CSS class for the wh-popup-chrome element so you can target specific popups in your stylesheets
      , valign_content:     true

    //, fullscreen:        false     // ... not implemented yet

      /** Scroll

          - "auto"
            The popup size will be limited to be within the viewport(tab) of the page.
            The elements which have overflow: auto/scroll will scroll.

          - "popup_viewport"
            When used, the popup will grow to fit it's content. (up till maxheight if it's specified)
            The viewport of the popup will scroll.
            The scrollbar from the page will temporarily be disabled so the
            scrollbar from the popup viewport can take it's place.

            NOTE: only vertical scrolling is supported/tested at the moment for popup_viewport mode.
      */
      , scroll:             "auto"

      , show:               true // directly show (switch to false in case you want to have the instance returned first so you can do popup->GetSize())
      , destroy_on_hide:    false // destroy DOM content after hiding

      // Scrolling behavior
      , scrollableview:     false //use scrollable view (you'll need to load wh.components.scrollableview yourself)
      , scrollx:            false //when enabling scrollableview, enable the 'x' scrollbar
      , scrolly:            true  //when enabling scrollableview, enable the 'y' scrollbar

      // Position
      , container:           null // defaults to document.body if null
      , position:            "fixed" // "fixed" or "absolute" (also specify maxheight: 0; if your popup can be larger than the viewport height)
      , positionanchor:      ""
      , positionanchor_x:    "viewport"
      , positionanchor_y:    "viewport"
      , halign:              "middle"
      , valign:              "middle"
      //, keepinside:         ["viewport",35,35,35,35] // or null/false to allow growing to any size

      // Animation
      , anim:                "shove" // shorthand for setting both anim_open & anim_close
      , anim_open:           ""
      , anim_close:          ""

      // Behaviour
      , modal:               true

      , canclose:            true // OBSOLETE (but stilll works)  // whether the default close button and clicks outside the popup should close the dialog
                                  // (canclose:false does not block wh-popup-action-close and hide())

      , closebutton:         true  // whether to display the default closebutton (style with wh-popup-closebutton)

      , explicitclose:       false // whether we only allow closing explicitely (through the closebutton, a .wh-popup-action-close or Javascript call)
                                   // if set to true, a click on the modallayer won't close the popup
                                   // !! Use when there's a chance you lose data/time when you accidently close a popup

      // ADDME: should we add the ability/option to lock focus to a popup?

      /**
      @short block keyboard events from bubbling outside the popup
             (note: this will also block any component within the popup which add's it's eventlisteners to the document/body)
      */
      , keepkeyboardevents:   false  // true/false

      // sizes so they can be easily controlled through the data-popup-options attribute or Javascript
      // (These will override the sizes you've set on the .wh-popup-body-container class)

      /** "popup"   -> set total size of popup
          "content" -> set the size of the content
      */
      , apply_size_to:        "content"
      //, aspect_ratio:         [3,2]

      /**
          - fixed amount of pixels          -> for example: 500
          - "stretch"                       -> the whole width or height will be used
          - "fit"                           -> (ADDME!) measure the content (check img still being loaded) and make the popup fit the content

          minwidth/minheight -> if due to the viewport being to small the popup has to shrink, it won't shrink below this value
          maxwidth/maxheight ->

          ADDME: method to specify a preffered max width and a hard max width? (set size, measure if overflowing, set size to used size)
                 reflow engine will try to make in-flow content use the preferred size, but overflow if nessecary,
                 afterwards we can fix the width.

          FIXME: 'stretch' and 'keepfromedge' currently use the window viewport instead of specified viewport
      */
      , minwidth:             0
      , minheight:            0
      , width:                0
      , height:               0
      , maxwidth:             "auto"
      , maxheight:            "auto" // 'auto' = limit to fit the viewport height (FIXME: currently fixed to window size)
                                     // 'none' = don't limit (usefull in combination with position: "absolute")
                                     //     >0 = limit to specified amount of pixels

      /** amount of pixels to keep away from the edge of the viewport
          either use the shorthand property 'keepfromedge'
          when needing popups of a specific width and want to prevent horizontal scrollbars,
          set keepfromedge_x to 0 and specify the desired keepfromedge_y.
      */
      , keepfromedge:         null
      , keepfromedge_x:       25
      , keepfromedge_y:       25
      }

// Read-only
, open:      false // visible and not being closed
, visible:   false //
, destroyed: false
, body:      null  // node containing the popup's content

// Private
, nodes: {}
, _size: { width: 0, height: 0 }

, transitionmanager: null

  /** popup_id_or_ref the id of the popup element, reference to the popup element
                      or null for an anonymous popup (for example in case of a webviewer popup)
  */
, initialize: function(popup_id_or_ref, options)
  {
    this.__setOptions(options);
    $wh.PopupManager.register(this, popup_id_or_ref);
    this.buildDOM();

    if (this.options.show)
      this.show();
  }

, buildDOM: function()
  {
    /*
    Example DOM for a popup:

    .wh-popup-container
      button
      .wh-popup-chrome.wh-popup-theme-white.valign.animin-pop.animout-pop
        .wh-popup-bodycontainer
          .wh-popup-body
            ...content of the popup here...
        .wh-popup-closebtn

    How each element is used:

    .wh-popup-container
    .wh-popup-chrome    - the visible popup
    .wh-popup-container - the viewport for the popup content
    .wh-popup-body      - the content op the popup
    */

    var chrome_classes = ["wh-popup-chrome"];

    if($wh.legacyclasses)
      chrome_classes.push("-wh-popup-chrome");

    if (this.options.valign_content)
      chrome_classes.push("valign");

    if (this.options.theme != "")
      if($wh.legacyclasses)
        chrome_classes.push("-wh-popup-theme-"+this.options.theme, "wh-popup-theme-"+this.options.theme, "theme-" + this.options.theme);
      else
        chrome_classes.push("theme-" + this.options.theme);

    if (this.options.anim_open != "")
      chrome_classes.push("animin-" + this.options.anim_open);

    if (this.options.anim_close != "")
      chrome_classes.push("animout-" + this.options.anim_close);

    if (this.options.cssclass != "");
      chrome_classes.push(this.options.cssclass);

    //console.info("Popup will have className ", chrome_classes.join(" ") );

    //////////////////////////////////////////////////////////////////////////////////////////

    var container = new Element( "div"
                               , { "class": $wh.legacyclasses ? "wh-popup-container -wh-popup-container" : "wh-popup-container"
                                 , "events": { "keydown":             this.onKeyDown.bind(this)
                                             , "keyup":               this.onKeyUp.bind(this)
                                             //, "transitionend":       this.onTransitionEnd.bind(this)
                                             //, "webkitTransitionEnd": this.onTransitionEnd.bind(this)
                                             }
                                 });

    container.addEvent("click", this.onViewportClick.bind(this));
    container.addEvent("mousedown", this.onMouseDown.bind(this));

    if($wh.legacyclasses)
      container.setStyles({ visibility: "hidden", display: "block" });

    // By having a node which recieves focus, we can get the event before it get's outside the
    // popup. It's not a problem if another node inside the popup get's focus after that,
    // just as long as the dom outside the popup doesn't get focus.
    // (by preventing key event getting outside the popup we can prevent tab setting focus
    // outside the popup(??) and scrolling the page with the arrow keys)
    // using an <input> as focusnode would result in a virtual keyboard being triggered on a tablet (iPad)
    var focusnode = new Element("button", { styles: { position: "absolute", clip: "rect(0,0,0,0)" } });

    //////////////////////////////////////////////////////////////////////////////////////////

    // popup with chrome
    var chrome = new Element("div", { "class": chrome_classes.join(" ") });
    if($wh.legacyclasses)
      chrome.addEvent("click:relay(.wh-popup-action-close, .-wh-popup-action-close)", this.onCloseButtonClick.bind(this));
    else
      chrome.addEvent("click:relay(.wh-popup-action-close)", this.onCloseButtonClick.bind(this));

    this.transitionmanager = new $wh.CSSTransitionManager(chrome, { onended: this.onTransitionsEnded.bind(this) });

    var btn_close = null;
    if (this.options.closebutton)
    {
      btn_close = new Element("div", { "class": $wh.legacyclasses ? "wh-popup-closebutton -wh-popup-closebutton wh-popup-action-close" : "wh-popup-closebutton wh-popup-action-close" } );
    }

    var body_container = new Element("div", { "class": $wh.legacyclasses ? "-wh-popup-body-container wh-popup-body-container" : "wh-popup-body-container"});

    var body = new Element("div", { "class": $wh.legacyclasses ? "wh-popup-body -wh-popup-body" : "wh-popup-body" });

    if(this.options.scrollableview)
    {
      body_container.addClass("wh-scrollableview");
      body.addClass("wh-scrollableview-content");
    }

    container.adopt(focusnode, chrome);
    chrome.adopt(body_container, btn_close);
    body_container.adopt(body);

    chrome.store("wh-popup-instance", this);

    this.body = body;

    this.nodes =
        { container:      container
        , focusnode:      focusnode
        , chrome:         chrome
        , btn_close:      btn_close
        , body_container: body_container
        , body:           body
        };
  }

  /** @short get the size of the content area (if a width or height is set this may potentially be larger than the content within the popup)
  */
, getSize: function()
  {
    return this._size;
/*
    var dim = this.nodes.body.getComputedSize();
    return { width: dim.width
           , height: dim.height
           };
*/
    /*
    var chrome_dimensions = this.nodes.chrome.getComputedSize();
    return { width:  chrome_dimensions.width - (chrome_dimensions.totalWidth - chrome_dimensions.width)
           , height: chrome_dimensions.height - (chrome_dimensions.totalHeight - chrome_dimensions.height)
           };
    */
  }


, calculateSizeInformation: function()
  {
    var viewportsize = window.getSize();

    // POSITIONING ***************************************************************************************
    var container = this.nodes.container;

    var left, top;

    var has_posanchor_x = this.options.positionanchor_x != "viewport";
    var has_posanchor_y = this.options.positionanchor_y != "viewport";
    var anchornode_x, ax_pos, ax_size;
    var anchornode_y, ay_pos, ay_size;
    var scroll;

    //console.log("Anchor x:", this.options.positionanchor_x," Anchor y:", this.options.positionanchor_y);

    scroll = window.getScroll();

    if (has_posanchor_x)
    {
      anchornode_x = $(this.options.positionanchor_x);
      ax_pos = anchornode_x.getPosition(this.getPopupContainer());
      ax_size = anchornode_x.getSize();
/*
      console.group("Anchornode X");
      console.log("Anchornode:", anchornode_x);
      console.log("Anchor pos:", ax_pos);
      console.log("Anchor size:", ax_size);
      console.groupEnd();
      */
    }

    if (has_posanchor_y)
    {
      if (this.options.positionanchor_x == this.options.positionanchor_y)
      {
        anchornode_y = anchornode_x;
        ay_pos = ax_pos;
        ay_size = ax_size;
      }
      else
      {
        anchornode_y = $(this.options.positionanchor_y);
        ay_pos = anchornode_y.getPosition(this.getPopupContainer());
        ay_size = anchornode_y.getSize();
/*
        console.group("Anchornode Y");
        console.log("Anchornode:", anchornode_y);
        console.log("Anchor pos:", ay_pos);
        console.log("Anchor size:", ay_size);
        console.groupEnd();
*/
      }
    }

    if (this.options.position != "fixed")
      container.style.position = "absolute";

    if (has_posanchor_x)
    {
      if (this.options.position == "fixed")
        left = ax_pos.x - scroll.x;
      else
        left = ax_pos.x;

      if (left < 0)
        left = 0;

      container.style.left = left + "px";
      container.style.width = ax_size.x + "px";
    }

    if (has_posanchor_y)
    {
      if (this.options.position == "fixed")
        top = ay_pos.y - scroll.y;
      else
        top = ay_pos.y;

      if (top < 0)
        top = 0;

      container.style.top = top + "px";
      container.style.height = ay_size.y + "px";
    }

    switch (this.options.halign)
    {
      case "left":
        container.style.textAlign = "left";
        break;
      case "right":
        container.style.textAlign = "right";
        break;
      //'middle' is default and doesn't require styling
    }

    switch (this.options.valign)
    {
      case "top":
        this.nodes.chrome.style.verticalAlign = "top";
        break;
      //'middle' is default and doesn't require styling
      case "bottom":
        this.nodes.chrome.style.verticalAlign = "bottom";
        break;
    }

    // POSITIONING ***************************************************************************************

    var sizenode = this.options.apply_size_to == "content" ? this.nodes.body_container : this.nodes.chrome;

    var chrome_dimensions = this.nodes.chrome.getComputedSize();
//    var body_dimensions = this.nodes.body.getComputedSize();

    var avail_width = viewportsize.x - (this.options.keepfromedge_x * 2);
    var avail_height = viewportsize.y - (this.options.keepfromedge_y * 2);

    // FIXME: available_width should account for being placed in other elements than the viewport
    return { // the outer width available for the full popup (including chrome)
             available_width:  avail_width
           , available_height: avail_height

           , sizenode:  sizenode
           //, widthpad:  this.nodes.chrome.offsetWidth - this.nodes.body.clientWidth //chrome_dimensions.totalWidth  - chrome_dimensions.width
           //, heightpad: this.nodes.chrome.offsetHeight - this.nodes.body.clientHeight //chrome_dimensions.totalHeight - chrome_dimensions.height
           , widthpad:  chrome_dimensions.totalWidth  - chrome_dimensions.width
           , heightpad: chrome_dimensions.totalHeight - chrome_dimensions.height
           };
  }

  /** @short update positioning and size // FIXME: name?
  */
, updateSize: function()
  {
    var sizedata = this.calculateSizeInformation();
    var sizenode = sizedata.sizenode;

    var contentwidth;
    var contentheight;

    if (this.options.width === "stretch") // aka fill-available in CSS3
    {
      var width = sizedata.available_width;

      if (this.options.maxwidth > 0 && width > this.options.maxwidth)
        width = this.options.maxwidth;

      if (this.options.minwidth > 0 && width < this.options.minwidth)
        width = this.options.minwidth;

      contentwidth = width - sizedata.widthpad;

      this.nodes.chrome.setStyle("width", width); // "max" always sized using the chrome
      this.nodes.body_container.setStyle("width", contentwidth);
    }
    else
    {
      if (this.options.width != 0)
        sizenode.setStyle("width", this.options.width);

      sizenode.setStyle("min-width", this.options.minwidth > 0 ? this.options.minwidth : "");

      if (this.options.maxwidth == "auto")
        sizenode.setStyle("max-width", sizedata.available_width);
      else if (this.options.maxwidth == "none")
        sizenode.setStyle("max-width", "none");
      else
        sizenode.setStyle("max-width", this.options.maxwidth);

      sizenode.setStyle("overflow-x", "auto"); // FIXME: apply overflow: auto; in all sizing scenario's?
    }

    if (this.options.height === "stretch") // aka fill-available in CSS3
    {
      var height = sizedata.available_height;

      if (this.options.maxheight && height > this.options.maxheight.toInt())
        height = this.options.maxheight.toInt();

      if (this.options.minheight && height < this.options.minheight)
        height = this.options.minheight;

      contentheight = height - sizedata.heightpad;

// 868 outer - 38 paddings = 830
//alert(sizedata.widthpad + " / " + height + " / " + contentheight );


      this.nodes.chrome.setStyle("height", height);
      this.nodes.body_container.setStyle("height", contentheight);
    }
    else
    {
      if (this.options.height != 0)
        sizenode.setStyle("height", this.options.height);

      sizenode.setStyle("min-height", this.options.minheight > 0 ? this.options.minheight : "");

      if (this.options.maxheight == "auto")
      {
        if (this.options.scroll == "popup_viewport")
        {
          // if we use "popup_viewport" we want to scroll the popup's viewport instead
          // of scrolling within the popup (unless max-height is set explicitly)
          sizenode.setStyle("max-height", "none");
        }
        else
          sizenode.setStyle("max-height", sizedata.available_height);
      }
      else if (this.options.maxheight == "none")
      {
        sizenode.setStyle("max-height", "none");
      }
      else
      {
        sizenode.setStyle("max-height", this.options.maxheight.toInt());
      }
    }

    if (this.options.scroll == "popup_viewport")
    {
      // FIXME: should not be neccesary, unless someone screws around in the CSS for the popup in a site
      //        But before removing this we must check whether some site depends on it.
      sizenode.setStyle("overflow-y", "visible");
      //this.nodes.bodycontainer.setStyle("overflow-y", "visible");

      this.nodes.container.setStyle("overflow", "scroll");

      /*
      Enabled 'momentum' and a visible scrollbar on iOS.
      It will also create a stacking context and potentialy trigger a fast path (hardware acceleration)
      */
      this.nodes.container.setStyle("-webkit-overflow-scrolling", "touch");

      this.nodes.container.setStyle("pointer-events", "auto"); // FIXME: only set once

      this.nodes.chrome.style.margin = this.options.keepfromedge_y + "px " + this.options.keepfromedge_x + "px " + this.options.keepfromedge_y + "px " + this.options.keepfromedge_x + "px";
    }
    else
    {
      // FIXME: geeft ook scrollbars als iemand via negatieve margins iets positioneert
      sizenode.setStyle("overflow-y", "auto"); // FIXME: apply overflow: auto; in all sizing scenario's?
    }

    this._size = { width:       contentwidth
                 , height:      contentheight
                 , outerwidth:  width
                 , outerheight: height
                 };

    // we return the content width
    return this._size;
  }

, show: function()
  {
    if (this.destroyed)
    {
      console.error("Cannot open a destroyed popup.");
      return;
    }

    if (this.open)
      return;

    this.open = true;

    if (this.visible) // we were closing?
    {
      if (this.options.debug)
      {
        console.log("Still closing, so whe'll force the close effect to finish");
        if (this.transitionmanager.isrunning)
          console.error("wut? Have can we still be visible but the transition effect has ended??");
      }

      // force to skip close effect to it's end
      this.transitionmanager.cancelAll();
      this.nodes.chrome.style.transition = "none"; // force transition to go to end state
      this.onHideCompleted(); // make sure the current popup (content) can deinitialize and aftershow events are fired
      this.nodes.chrome.clientHeight; // force reflow
      this.nodes.chrome.style.transition = ""; // force transition to go to end state
    }

    this.nodes.container.setStyles({ visibility: "hidden", display: "block" }); // FIXME: block or reset to "" and let the CSS stylesheet handle this?
    this.getPopupContainer().adopt(this.nodes.container);
    this.updateSize();

    // adding to the stack must be done after inserting the popup in the DOM
    // so the modality layer can determine it's inserting point in the DOM according to the popup node
    $wh.PopupManager.addToStack(this, this.options.modal);


/*
    this.nodes.chrome.style.mozTransform = "none";
    this.nodes.chrome.style.transform = "none";
      this.nodes.chrome.clientHeight; // force reflow
*/

    if (this.options.scroll == "popup_viewport")
      document.documentElement.addClass("scroll-popup-viewport"); // internal usage

    this.nodes.container.toggleClass("scroll-popup-viewport", this.options.scroll == "popup_viewport"); // internal usage

    // Whe'll fire beforeshow when the popup is in the DOM,
    // so dimensions of elements within can be measured
    this.fireEvent("beforeshow");
    $wh.PopupManager.fireEvent("beforeshow", { popup: this });

    // start any scaling stuff after the 'beforeshow'-event (using the animate class),
    // so scale transform's don't mess with measurements done within the setup of popup content
    // (if done within the beforeshow event handler)
    if($wh.legacyclasses)
    {
      this.nodes.container.addClass("animate");
      this.nodes.container.removeClass("-wh-popup-hide").removeClass('wh-popup-hide');
    }

    this.transitionmanager.triggerTransition(function()
    {
      if($wh.legacyclasses)
        this.nodes.container.addClass("-wh-popup-show").addClass('wh-popup-show');

      this.nodes.container.addClass('isvisible');
      this.nodes.container.setStyles({ visibility: "" });

      //this.nodes.container.offsetWidth; // hack to trigger computing styles

      this.ensureFocus();
      $wh.fireLayoutChangeEvent(this.nodes.container);
    }.bind(this));
  }

, hide: function()
  {
    if (!this.open)
      return;

    this.open = false;

    // Make sure there's no focus in the popup so
    // - elements within the popup don't get events, keypresses etc
    // - any virtual keyboard (on iOS/Android) is closed
    if (this.nodes.container.contains(document.activeElement))
      document.activeElement.blur();

    if (!this.visible) // we were closing?
    {
      if (this.options.debug)
      {
        console.log("Still opening, so whe'll force the close effect to finish");
        if (this.transitionmanager.isrunning)
          console.error("wut? Have can we still be visible but the transition effect has ended??");
      }

      // force to skip close effect to it's end
      this.transitionmanager.cancelAll();
      this.nodes.chrome.style.transition = "none"; // force transition to go to end state
      this.onShowCompleted(); // make sure the current popup (content) is initialized and beforeshow events are fired (FIXME: or do we seem this unnessecary??)
      this.nodes.chrome.clientHeight; // force reflow
      this.nodes.chrome.style.transition = ""; // force transition to go to end state
    }

    // part of Firefox workaround
    // (not being able to click on plugin content, like Flash movies?)
    this.nodes.chrome.style.mozTransform = "";
    this.nodes.chrome.style.transform = "";

    this.fireEvent("beforehide");
    $wh.PopupManager.fireEvent("beforehide", { popup: this });


    // FIXME: make this work correct with multiple popups with "popup_viewport" open
    if (this.options.scroll == "popup_viewport")
      document.documentElement.removeClass("scroll-popup-viewport"); // internal usage


    $wh.PopupManager.removeFromStack(this);
    var container = this.nodes.container;
    this.transitionmanager.triggerTransition(function()
    {
      if($wh.legacyclasses)
      {
        container.addClass("-wh-popup-hide").addClass("wh-popup-hide");
        container.removeClass("-wh-popup-show").removeClass("wh-popup-show");
      }
      container.addClass("ishiding");
      container.removeClass("isactive");
    });
  }

, destroy: function()
  {
    var container = this.nodes.container.parentNode;
    if (container) // check whether it's actually inserted somewhere (in the document or some other piece of DOM)
      container.removeChild(this.nodes.container);

    this.nodes = null;
    $wh.PopupManager.unregister(this);
    this.destroyed = true; // so we can warn if the user kept a reference to this instance and tries to call show()
  }


  ////////////////////////////////////////////////////
  //
  //  DOM lookup
  //

  /** @short to check whether a node is part of the popup.
             This can be used together with $wh.PopupManager's events,
             to check whether it's a specific popup (which has the specified node)
  */
, contains: function(node)
  {
    return this.nodes.body.contains( $(node) );
  }

  /** @short one or more nodes to import into the popup
  */
, importContent: function(content)
  {
    this.nodes.body.adopt(content);
  }

  /** @short get the first element matching the specified CSS selector
  */
, getElement: function(query)
  {
    return this.nodes.body.getElement(query);
  }

  /** @short get all element matching the specified CSS selector
  */
, getElements: function(query)
  {
    return this.nodes.body.getElements(query);
  }


  ////////////////////////////////////////////////////
  //
  //  Focus
  //

, ensureFocus:function()
  {
    if(!this.nodes.container.contains($wh.getActiveElement(document)))
      this.focus();
  }

, focus: function()
  {
    // before the show event so the show callback can focus another node
    this.nodes.focusnode.focus();
  }


  ////////////////////////////////////////////////////
  //
  //  Private / Helpers
  //

  // FIXME: can we override the default setOptions??
, __setOptions: function(options)
  {
    if (!options)
      return;

    if ("nodeType" in options)
    {
      console.error("accidental passing of a node as options parameter.")
      return;
    }

    if ("canclose" in options)
    {
      console.warn("canclose option is obsolete. Replace canclose:false; with { closebutton:false, explicitclose:false }.")
      options.closebutton = options.canclose;
      options.explicitclose = !options.canclose;
      delete options.canclose;
    }

    if ("keepfromedge" in options)
    {
      options.keepfromedge_x = options.keepfromedge;
      options.keepfromedge_y = options.keepfromedge;
    }
    this.setOptions(options);
    //console.info(this.options);

    if (this.options.anim_open == "")
      this.options.anim_open = this.options.anim;

    if (this.options.anim_close == "")
      this.options.anim_close = this.options.anim;

    if (this.options.positionanchor != "")
    {
      this.options.positionanchor_x = this.options.positionanchor;
      this.options.positionanchor_y = this.options.positionanchor;
    }
  }

  /// @short (private) get the node in which the popup will be placed (the node which will act as viewport)
, getPopupContainer: function()
  {
    var popupcontainer = $(this.options.container ? this.options.container : document.body);
    return popupcontainer;
  }

  //try to close this dialog, go through proper cancellation
, cancel:function()
  {
    var evt = new $wh.Event;
    evt.target=this;

    this.fireEvent("cancel", evt);
    if(!evt.defaultPrevented)
      this.hide();
  }


  ////////////////////////////////////////////////////
  //
  //  Private / Event handling
  //

, onCloseButtonClick: function(event)
  {
    event.stop();
    this.cancel();
  }

, onKeyDown: function(evt)
  {
    // FIXME: check if element which can handle input is focused and only stop the event in bubbling phase??
    if (this.options.keepkeyboardevents)
      evt.stop();
  }

, onKeyUp: function(evt)
  {
    // FIXME: check if element which can handle input is focused and only stop the event in bubbling phase??
    if (this.options.keepkeyboardevents)
      evt.stop();

    //if (this.options.canclose && evt.code == 27)
    if (evt.code == 27)
      this.hide();
  }

, onResize: function() // viewport/window resized
  {
    var sizes = this.updateSize();

    //console.info("Popup content size:", sizes);

    // ADDME: implement check whether the size has actually changed
    this.fireEvent("resize", sizes);
  }

, onTransitionsEnded: function(evt)
  {
    //console.log("Transitions ended to state: open == "+this.open, " - visible == "+this.visible);

    if (!this.open && this.visible)
      this.onHideCompleted();
    else if (this.open && !this.visible)
      this.onShowCompleted();
  }

, onHideCompleted: function()
  {
    this.visible = false;

    if($wh.legacyclasses)
      this.nodes.container.removeClass("animate");

    this.nodes.container.removeClass("isvisible");
    this.nodes.container.removeClass("ishiding");
    this.nodes.container.setStyle("display", "none");

    this.fireEvent("afterhide");
    $wh.PopupManager.fireEvent("afterhide", { popup: this });

    // FIXME: only closing by user should call destroy??
    if (this.options.destroy_on_hide)
      this.destroy();
  }

, onShowCompleted: function()
  {
    this.visible = true;

    // clean out transform property to work around Firefox messing up
    // mouse events in iframes within transformed elements
    // FIXME: this triggers a new transition with some effects...
    //this.nodes.chrome.style.mozTransform = "none";
    //this.nodes.chrome.style.transform = "none";

    //console.info("popup now visible and not animating anymore");

    this.fireEvent("aftershow");
    $wh.PopupManager.fireEvent("aftershow", { popup: this });
    this.nodes.chrome.fireEvent("wh-popup-aftershow", { target: this.nodes.chrome });

    this.fireEvent("activate");
    $wh.PopupManager.fireEvent("activate", { popup: this });
    this.nodes.chrome.fireEvent("wh-popup-activate", { target: this.nodes.chrome });

    this.nodes.container.addClass("isactive");
  }

  // When scroll is set to "popup_viewport" our this.nodes.container receives the click.
  // Otherwise the modality layer recieves the click.
, onViewportClick: function(evt)
  {
    if(!this.options.explicitclose && evt.target == this.nodes.container)
    {
      this.cancel();
      evt.stopPropagation();
    }
  }

, onMouseDown: function(evt)
  {
    // if the mousedown was done outside the popup,
    // cancel to prevent selection within the popup to occur from outside the popup

    // FIXME: only cancel if left mousebutton??
    if (evt.target == this.nodes.container)
      evt.preventDefault();
  }
});


/*

ADDME: autofocus of iframe (after each page load or directly??)
  // directly give the user the ability to scroll the page in the shown website
  // by focussing the iframe in the popup
  // we need a try/catch for IE
  // note: IE doesn't support focus() on the iframe, but it does on frame.contentWindow
  //try { dialog.frame.focus(); } catch(err) {}

*/
$wh.WebviewerPopup = new Class(
{ Extends: $wh.BasicPopup
, options:
    { url:               ""
    //, autosize:          false // FIXME: not implemented yet
    , show:              true
    , delayshow:         true  // (FIXME: implement) delay showing the iframe until the document is loaded

    // the best is usually to set keepalive to false (for the WebviewerPopup)
    // to free memory and so iPad won't keep on playing video's
    , keep_frame_alive:  false
    , destroy_on_hide:   false

    // Content width / height
    //     "auto"    -> (NOT FINISHED YET) resize the iframe to fit the content, up to a max size...
    //     "fill"    -> stretch the iframe to the available space in the popup
    //     <number> -> amount of pixels
    //     <min_size>,<preferred_size>,<maxsize> -> NOT IMPLEMENTED, just an idea for autoresizing to the iframe content
    , content_width:     "fill"
    , content_height:    "fill"
    }

, iframe_content_size: {}

, initialize: function(popupid, options)
  {
    //this.parent(popupid, options); // creat normal popup
    this.__setOptions(options);
    $wh.PopupManager.register(this, popupid);
    this.buildDOM();

    this.setupWebViewerDOM();

    if (this.options.show)
      this.show();
  }

, setupWebViewerDOM: function()
  {
    var mydom = this.getWebviewerDOM();
    //this.importContent( mydom ); // Mootools adopt() doesn't correctly handle documentfragments
    this.nodes.body.appendChild( mydom );
    if($wh.legacyclasses)
      this.nodes.body_container.addClass("-wh-popup-webviewer").addClass("wh-popup-webviewer");
    else
      this.nodes.body_container.addClass("wh-popup-webviewer");

    if (this.options.url)
      this.nodes.frame.src = this.options.url;
  }

, getWebviewerDOM: function()
  {
    var frag = document.createDocumentFragment();

    var framestyles =
        { border:   0
        , display:  "block"
        , width:    this.options.content_width && !["auto","fill"].contains(this.options.content_width) ? this.options.content_width+"px" : "100%"
        , height:   this.options.content_height && !["auto","fill"].contains(this.options.content_height) ? this.options.content_height+"px" : "100%"
        };

    var frame = new Element("iframe"
                           , { styles: framestyles
                             , frameBorder: "0"
                             , allowTransparency: "true"
                             });
    //frame.style.cssText = 'resize: none; border: 0;';


    // the iframe must be the scrollcontainer, iOS devices will eat the scroll/touch in the frame,
    // so a parent container won't receive the scroll event
    //frame.style.overflow = "hidden";
    //frame.style.display = "block"; // in IE7 it's not a block by default?? causing a few extra pixels below the iframe
    frame.setAttribute("frameBorder", "0"); // IE ignores the border:0; style for iframes
    frame.setAttribute("allowTransparency", "true"); // IE shows an opaque background in the iframe without this
    frag.appendChild(frame);

    //frame.addEvent("load", this.onFrameLoad.bind(this));

    this.nodes.frame = frame;

    return frag;
  }



  ////////////////////////////////////////////////////
  //
  //  Public
  //

, setURL: function(url)
  {
    this.nodes.frame.src = url;
  }

, show: function()
  {
    // if there's no frame (possible due to keep_frame_alive set to false;, recreate the WebViewer DOM)
    if (!this.nodes.frame)
      this.setupWebViewerDOM();

    this.parent();
  }

, updateSize: function()
  {
    this.parent();

    // stretch the iframe to fit the popup if needed
    if (this.options.content_width == "fill" || this.options.content_height == "fill")
    {
      var size = this.nodes.body_container.getSize();

      if (this.options.content_width == "fill")
        this.nodes.frame.style.width = "100%";

      if (this.options.content_height == "fill")
        this.nodes.frame.style.height = size.y+"px";
    }
  }



  ////////////////////////////////////////////////////
  //
  //  Private / Event handling
  //

  /*
, onFrameLoad: function()
  {
    console.info("Event 'load' fired in popup's iframe.");

    if (this.options.keep_frame_alive)
      this.nodes.frame_document = window.$wh.getIframeDocument(this.nodes.frame); // prevent garbage collection
  }
  */
, onMessage: function(evt, message)
  {
//    if (this.options.content_width != "auto" && this.options.content_width != "auto")
//      return;

    var eventdata = message.split(":");

    switch(eventdata[0])
    {
      case "hello":
          //console.info("got hello");
          this.sendSettings();
          break;

      case "resize":
          var sizes = eventdata[1].split(",");
          var size_x = parseInt(sizes[0]);
          var size_y = parseInt(sizes[1]);
          this.iframe_content_size = { x: size_x, y: size_y };
          this.onContentSize(size_x, size_y);
          //console.log("Reported iframe content size: ", sizes[0], "x", sizes[1]);
          break;

      case "domready": // ADDME: implemented
          break;

      case "load": // ADDME: implemented
          break;
    }
  }

, sendSettings: function()
  {
    // FIXME: implement sending of settings
    //this.nodes.frame.contentWindow.postMessage("wh-popup-content:settings:", "*");
  }

, onContentSize: function(width, height)
  {
    // ADDME: build twich and looping protection
    //if (this.contentsize && this.contentsize ....

//    if (this.options.content_width == null)
      this.nodes.frame.setStyle("width", width+"px");

//    if (this.options.content_height == null)
      this.nodes.frame.setStyle("height", height+"px");
  }

, onHideCompleted: function()
  {
    this.parent();

    if (!this.options.keep_frame_alive)
    {
      this.nodes.frame.parentNode.removeChild(this.nodes.frame);
      this.nodes.frame = null;
    }
  }
});




/****************************************************************************************************************************
 * Modalitylayer
 */

/*
The modality layer as effect can consist of two parts
- a layer which overlay's the content which is 'inactive' (usually a greyout effect)
- a layer which IS the content which is 'inactive' (for example to blur the inactive content/background)
*/
//$wh.PopupManager.modalitylayer.options.container =

$wh.ModalityLayer = new Class(
{ Implements: [ Options, Events ]
, options:
     { container:        null // if let to null the document body will be used
     , overlaynode:      null // node to use as overlay, leave null to use the automatically generated overlay
     , effectnode:       null // if set to null, the options.container setting will be used

     , anim:             ""
     , anim_open:        ""
     , anim_close:       ""
     }

, overlaynode: null
, visible:     false
, transitionmanager: null
, delayedupdate:null //delayed update handler, brings us to the final state
, actualvisible: false //true visibility state (matches 'this.visible' after delayedupdate)

, initialize: function(options)
  {
    this.setOptions(options);

    if (!this.options.container)
      this.options.container = $(document.body);

    if (!this.options.effectnode)
      this.options.effectnode = this.options.container;

     if (this.options.anim_open == "")
        this.options.anim_open = this.options.anim;

    if (this.options.anim_close == "")
      this.options.anim_close = this.options.anim;

    if (this.options.overlaynode)
    {
      this.overlaynode = this.options.overlaynode;
      this.overlaynode.addEvent("click", this.onModalityLayerClick.bind(this));
      this.transitionmanager = new $wh.TransitionManager(this.overlaynode, { onended: this.onTransitionsEnded.bind(this) });
    }
  }

, onModalityLayerClick: function()
  {
    // tightly coupling.. ouch :P
    if ($wh.PopupManager.modalstack.length == 0)
      return;

    // a click on the modality layer will close the last modal dialog, unless the current dialog needs to explicitely be closed
    var lastmodalpopup = $wh.PopupManager.modalstack.getLast();
    if(!lastmodalpopup.options.explicitclose)
      lastmodalpopup.cancel();
  }

, show: function(beforenode)
  {
    if (this.visible)
    {
      beforenode.parentNode.insertBefore(this.overlaynode, beforenode);
      return;
    }
    this.visible = true;
    if(!this.overlaynode)
    {
      this.overlaynode = new Element("div", { "class": $wh.legacyclasses ? "-wh-modalitylayer wh-modalitylayer" : "wh-modalitylayer"
                                            , "events": {"click": this.onModalityLayerClick.bind(this) }
                                            });
      this.transitionmanager = new $wh.CSSTransitionManager(this.overlaynode, { onended: this.onTransitionsEnded.bind(this) });
    }

    // FIXME
    //if (this.options.container !== document.body && this.options.container !== document.documentElement)
    //  this.overlaynode.style.position = "absolute"; // stay within the given element instead of HTML/BODY viewport

    //this.options.container.appendChild(this.node);
    beforenode.parentNode.insertBefore(this.overlaynode, beforenode);

    var htmlnode = $(document.documentElement);
    htmlnode.addClass("wh-modal-popup-active");

    if($wh.legacyclasses)
    {
      $(document.body).addClass("-wh-modal-popup-active");
      this.overlaynode.removeClass("-wh-modalitylayer-hide").removeClass("wh-modalitylayer-hide").removeClass("isvisible").removeClass("isactive");
    }
    else
    {
      this.overlaynode.removeClass("isvisible").removeClass("isactive");
    }

    if(!this.delayedupdate)
      this.updateModalityLayerState();
  }

, hide: function()
  {
    if (!this.visible)
      return;

    if($wh.legacyclasses)
      $(document.body).removeClass("-wh-modal-popup-active");
    $(document.documentElement).removeClass("wh-modal-popup-active");

    this.visible = false;
    if(!this.delayedupdate)
      this.delayedupdate = this.updateModalityLayerState.delay(1,this);

    //this.__deactivateModalLayerEffects();
  }
, updateModalityLayerState:function()
  {
    this.delayedupdate=null;
    if(this.visible != this.actualvisible)
    {
      if(this.visible)
      {
        this.transitionmanager.triggerTransition(function()
        {
          if($wh.legacyclasses)
            this.overlaynode.addClass("-wh-modalitylayer-show").addClass("isvisible").addClass("isactive");
          else
            this.overlaynode.addClass("isvisible").addClass("isactive");
         }.bind(this),1);
      }
      else
      {
        this.transitionmanager.triggerTransition((function()
        {
          if($wh.legacyclasses)
          {
            this.overlaynode.addClass("-wh-modalitylayer-hide").addClass("wh-modalitylayer-hide");
            this.overlaynode.removeClass("-wh-modalitylayer-show").removeClass("wh-modalitylayer-show").removeClass("isactive").removeClass("isvisible");
          }
          else
          {
            this.overlaynode.removeClass("isactive").removeClass("isvisible");
          }
        }).bind(this));
      }
    }
    this.actualvisible = this.visible;
  }

, onTransitionsEnded: function()
  {
    //console.warn("modality transitions ended");
    if (!this.visible && this.overlaynode.parentNode)
      this.overlaynode.dispose();
  }
});



/*
$(window).addEvent("domready", function()
  {
    //$wh.PopupManager.modalitylayer = new $wh.ModalityLayer({ background_blur_radius: 1, effectnode: document.body });
    $wh.PopupManager.modalitylayer = new $wh.ModalityLayer({ background_blur_radius: 4, effectnode: $("modality_wrapper") });
  });
*/
// Initialize the modalitylayer _after_ the TransitionManager class is defined
$wh.PopupManager.modalitylayer = new $wh.ModalityLayer();
$wh.Popup.createFromElement = $wh.PopupManager.createFromElement.bind($wh.PopupManager);

//Close topmost dialog
$wh.Popup.closeTop = function()
{
  if(!$wh.PopupManager.popupstack.length)
    throw "No popups currently open";

  if($wh.PopupManager.popupstack.length)
    $wh.PopupManager.popupstack.getLast().hide();
}
//Close all dialogs
$wh.Popup.closeAll = function()
{
  while($wh.PopupManager.popupstack.getLast())
    $wh.Popup.closeTop();
}


})(document.id); //end mootools wrapper
