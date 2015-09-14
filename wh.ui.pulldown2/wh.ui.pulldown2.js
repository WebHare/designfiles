/* generated from Designfiles Public by generate_data_designfles */
require ('wh.ui.menu');
require ('wh.ui.base');
require ('frameworks.mootools.more.keyboard');
/*! LOAD: wh.ui.menu, wh.ui.base, frameworks.mootools.more.keyboard
!*/
/* For debugging, add #wh-ignore-pulldown-blur to the URL to prevent
   the pulldown from closing on blur


  FIXME: switching between pulldowns require two clicks (one to close the first, second to active the next pulldown)
  ADDME: reimplement minvisibleoptions and maxvisibleoptions?


  CSS classes:

      .focus  - pulldown is focussed
      .active - the pulldown's menu is activated
*/


(function($) { //mootools wrapper
"use strict";

$wh.Pulldown2 = new Class(
{ Implements: [ Events, Options ]
, Binds: [ "onMouseDown", "onKeyDown", "onInputChange", "onTouchStart"
         , "onMenuActivateItem"
         , "onNodeFocus", "onNodeBlur", "onClick"
         ]

, options: { enabled: true  // If the pulldown is initially enabled
           //, enablescrollbar: true //use scrollbar if pulldown doesn't fit in window
           , required: false

           , values: []     // { isdivider?, value, title?, selected?, enabled? } options, filled with el options, if available

           , cssclass: ''     // CSS class set on the container <div>
           , theme: ''        // CSS class set on the <ul>

           , borderoverlap: 0 // The number of pixels the values node is shifted up for menu/pulldown borders to overlap

           // When there isn't enough room for showing at least "minvisiblerows" options below the pulldown,
           // and there's more room above the pulldown, the options will be shown above the pulldown
           //, minvisibleoptions: 5

           // To prevent the options list filling up the whole screen,
           // you can limit the length to X options
           //, maxvisibleoptions: 25

           /// if true, the native selector will be used
           // (if the used browser/device is on the whitelist)
           , usenativeselector: false

           , debug: false
           , hidefirstdisabled: true //hide the first item, if it disabled
           }

, el: null                  // Element we're replacing
, node: null                // The node of the custom pulldown

, submenudirty: true
, currentvaluenode: null    // The node within the pulldown component showing the title of the selected option
, valuesnode: null          // Wrapper for the options menu node
, listnode: null            // <ul> containing the menu which will be manager by the this.classicvaluesmenu object

, menucontroller: null
, valuesmenu: null           // a $wh.MenuList menu
, keyboard: null            // keyboard object

, isopen: false
, tabindex: 0

, usenativeselector: false

, initialize: function(options, el)
  {
    this.setOptions(options);
    if($wh.debug.pulldown) //ADDME combine into a TLA
      this.options.debug = true;

    // usenativeselector works on iOS and Android+Chrome (NOT Firefox)
    // FIXME: for now we only allow this on
    if (this.options.usenativeselector &&
           (    Browser.Platform.ios     /* Safari on iOS */
            || (Browser.Platform.android &&
                 (   Browser.name == "chrome"
                  || Browser.name == "safari" /* inbuild Android 4.1 browser */
                 )
               )
           ))
    {
      this.usenativeselector = true;
      if (this.options.debug)
        console.log("$wh.Pulldown will use the native option selector");
    }

    this.el = $(el);

    this.keyboard = new Keyboard({ events: { 'down': this.onKeyDown
       //, 'enter': this.onKeyDown
                                           }
                                 });

    // Store the supplied values locally, so setNewValues can set the correct
    // values. Also, setNewValues uses getSelected to get the currently selected
    // option, but we want nothing to be selected initially
    var values = this.options.values;
    this.options.values = [];

    this.el.addEvent("change", this.onInputChange);
    this.el.addEvent("wh-refresh", this.refresh.bind(this));
    this.buildNode();
  }

, buildNode: function()
  {
    var events = { "focusin":   this.onNodeFocus
                 , "focusout":  this.onNodeBlur
                 , "mousedown": this.onMouseDown
                 // FIXME , "click":     this.onClick - why ?  require test case
                 //, "touchstart": this.onTouchStart
                 };

    if (this.usenativeselector)
      this.el.addEvent("blur", this.onNodeBlur);

    // since Android (FIXME: all versions?) seem to dispatch both touchStart and mouseDown
    // events even though we have a event.stop() in our touchStart handling,
    // whe'll only give iOS the benefit of directly acting on a touchStart.
    if (Browser.Platform.ios)
      events.touchstart = this.onTouchStart;

    this.node = new Element("div", { "class":  this.options.cssclass + (this.el && this.el.className ? " " + this.el.className : "")
                                   , "events": events
                                   });
    this.node.addEvent("wh-menu-activateitem", this.onMenuActivateItem);

    this.node.addClass('wh-pulldown');
    this.node.store('wh-ui-replaces', this.el);

    if(this.el)
      this.tabindex = this.el.get('tabindex') || 0;

    if(this.el.getAttribute("style"))
      this.node.setAttribute("style", this.el.getAttribute("style"));

    this.currentvaluenode = new Element("span",{"class": "value"}).inject(this.node);

    new Element("span", {"class" : "arrow"}).inject(this.currentvaluenode, 'after');
    this.listnode = new Element("ul", {"class":  this.options.theme}).inject(this.node);
    this.listnode.addClass('wh-pulldown-values');

    this.listnode.addEvent('menuclose', function()
    {
      this.node.removeClass('active');
    }.bind(this));

    if (this.el.id && !$(this.el.id + '-values'))
      this.listnode.id = this.el.id + '-values';
    //console.warn(this.node.getStyle("width"));
  }

, refresh:function()
  {
    //console.warn("----- " + this.el.id + " -----");
    //console.log("refresh called", this.node.getStyle("width"));
    this.submenudirty = true;
    this.updateState();

    if (!this.options.usenativeselector) // let's keep the tabindex on the original element
      this.node.setAttribute("tabindex", this.el.disabled ? "" : this.tabindex);//needed to enable focus for key navigation
    this.node.toggleClass("disabled", !!this.el.disabled);

    this.options.required = this.el.required;

    this.node.toggleClass('required',this.options.required);
    this.listnode.toggleClass('required',this.options.required);

    if (this.options.usenativeselector) // we need to temporarily remove our width:0; to allow taking measurements
      this.el.setStyle('width', '');

    /* Determine our width. If our parent had an explicit width, we need to use that
       If our parent was autosizing, so should we */
    var compwidth = this.el.getStyle('width');
    if(!compwidth || compwidth == 'auto')
    {
      this.ensureSubMenu();
      this.node.setStyle('width', $wh.measureMenu(this.listnode).width);
    }
    else
    {
      this.node.setStyle('width', this.el.getStyle('width'));
    }

    if (this.options.usenativeselector)
      this.el.setStyle('width', 0);

    $wh.fireLayoutChangeEvent(this.el);
  }

, ensureSubMenu:function ()
  {
    if(!this.submenudirty)
      return;

    this.listnode.empty();
    this.el.getElements("> option").each(function(option, i)
    {
      if(i==0 && this.options.hidefirstdisabled && option.disabled)
        return;

      var optiontitle = option.get("label") || option.get("text");
      var optval = option.get('value');

      var optnode = new Element("li", { text: option.get("data-valuetitle") || optiontitle
                                      , "class": option.getAttribute("class")
                                      , "data-pulldown-index": i
                                      });

      optnode.toggleClass('currentvalue', i == this.el.selectedIndex);
      optnode.toggleClass('disabled', option.disabled);

      this.listnode.adopt(optnode);
      /*
                  , displaytitle: optiontitle
                  , hide: option.hasClass('wh-menu-hidden') || option.hasClass('-wh-menu-hidden') || (i==0 && this.options.hidefirstdisabled && option.disabled)
                  */
    }.bind(this));
  }

, focus: function()
  {
    if (this.usenativeselector)
    {
      //this.el.focus();
    }
    else
      this.node.focus();
  }

, destroy: function()
  {
    if (this.classicvaluesmenu)
      this.classicvaluesmenu.destroy();
  }

, isMenuActive: function()
  {
    return this.isopen;
  }

, buildcurrentValueNodes: function(keepselectcontent)
  {
    this.listnode.empty();

    if (!keepselectcontent)
      this.el.empty();

    this.options.values.each(function(option, i)
    {
      var optionnode;
      if (option.isdivider)
        optionnode = new Element("li", { "class": "wh-menu-divider" });
      else
      {
        var disabled = option.enabled === false;

        var classes = [ "wh-menu-item" ];

        if (option.hide)
          classes.push("wh-menu-hidden","hidden");
        if (disabled)
          classes.push("wh-menu-disabled","disabled");

        optionnode = new Element("li", { text: option.title
                                       , "data-wh-idx": i + 1
                                       , "class" : classes.join(" ")
                                       });

        option.node = optionnode;
      }
      this.listnode.grab(optionnode);

      if (!keepselectcontent)
        this.el.grab(new Element("option", { value: option.value
                                           , text:  option.title
                                           }));
    }, this);
  }

, toElement: function()
  {
    return this.node;
  }

, syncDisplayValue:function()
  {
    if (this.el.selectedOptions.length == 0)
    {
      this.currentvaluenode.set("text", "\xA0");
      return;
    }

    var selected = this.el.selectedOptions[0];

    //ADDME don't empty/re-set if nothing changed
    this.currentvaluenode.empty();
    for(var node = selected.firstChild;node;node=node.nextSibling)
      this.currentvaluenode.adopt(node.cloneNode());

    // set text, or use a placeholder character to prevent the line from collapsing and losing our lineheight/baseline alignment
    if(!this.currentvaluenode.firstChild) //nothing to copy
      this.currentvaluenode.set("text", "\xA0");

    $wh.fireLayoutChangeEvent(this.node);
  }
, updateState: function()
  {
    var selected = this.el.selectedOptions[0];
    this.node.toggleClass("disabled", !this.getEnabled());
    this.syncDisplayValue();
  }

, getSelectedIndex:function()
  {
    for(var i=0;i<this.options.values.length;++i)
      if(this.options.values[i].selected)
        return i;

    return -1;
  }

, getSelected: function() //FIXME not compatible with setSelected (this returns object, setSelected returns idx)
  {
    return this.options.values.filter(function(value) { return value.selected }).pick();
  }

, getValue: function()
  {
    var selected = this.getSelected();
    return selected ? selected.value : null;
  }

, onInputChange:function()
  {
    this.syncDisplayValue();
  }
, getEnabled: function()
  {
    return this.options.enabled && !this.el.disabled;
  }

, setEnabled: function(enabled)
  {
    if (enabled != this.options.enabled)
    {
      this.setOptions({ enabled: enabled });
      this.updateState();

      if (!this.options.usenativeselector) // let's keep the tabindex on the original element
        this.node.setAttribute("tabindex", this.options.enabled ? this.tabindex : "");//needed to enable focus for key navigation
    }
  }

, openValuesMenu: function()
  {
    if(this.options.debug)
      console.log("$wh.Pulldown openValuesMenu");//, pulldowncoords);

    var selected = this.getSelected();

    this.ensureSubMenu();
    if(!this.menucontroller)
    {
      //this.valuesmenu = new $wh.MenuList(this.listnode);
    }

    if($wh.isCurrentlyClosingMenu(this.listnode))
    {
      if(this.options.debug)
        console.log("Skipping, list already open:", this.listnode);//, pulldowncoords);
      return;
    }

    $wh.openMenuAt(this.listnode, this.node, { direction:'down'
                                             , minwidth: this.node.getBoundingClientRect().width
                                             }, false);
    if(this.el.hasClass('scrollable'))
      this.listnode.addClass('wh-submenu-scrollable');

    this.node.addClass('active');
  }

, onNodeFocus: function()
  {
    this.node.addClass("focus");

    if (this.el)
    {
/*      // FIXME: does it do harm that we do this each focus?
      var formnode = this.el.getParent("form");
      if (formnode)
      {
        var formhandler = formnode.retrieve("wh-formhandler");
        if (formhandler)
          //formhandler.keyboard.manage(this.keyboard);
          formhandler.manageKeyboard(this.keyboard);
      }*/
    }

    this.keyboard.activate();
  }

, onNodeBlur: function()
  {
    this.node.removeClass("focus");

    if (this.classicvaluesmenu)
      this.closeOptionsMenu();

    this.keyboard.deactivate();
  }

, onKeyDown: function(event)
  {
    event.stop();

    if(!this.classicvaluesmenu)
      this.openValuesMenu();
  }

  // We want to support devices which have both mouse & touch input,
  // but since event.stop() doesn't seem to stop Android from also firing the touchStart event as mouseDown
  // whe'll keep a timer to check for double events.
, onTouchStart: function(event)
  {
    //if (this.isTriggerEventDouble())
    //  return;

    this.handleActivation(event);
  }

, onMouseDown: function(event)
  {
    //if (this.isTriggerEventDouble())
    //  return;

    // ignore right click
    if(!event.event.button == 0)
    {
      event.stop();
      return false;
    }

    this.handleActivation(event);
  }

, onClick:function(event)
  {
    event.stop(); //prevent clicks from leaking through and activating stuff like labels
  }
  // stop double events (which may occur due to misclicks or touchStart's also being picked up as mouseDown)
  /*
, isTriggerEventDouble: function()
  {
    var newtime = new Date().getTime();
    if (this.triggertime && newtime - this.triggertime < 100)
      return true;
    console.log(newtime - this.triggertime);

    this.triggertime = newtime;
    return false;
  }
  */

, handleActivation: function(event)
  {
    if (!this.getEnabled())
      return;

    // stop the event
    // - to stop others from picking up the event
    // - to stop the browser to fire the onMouseDown when it's done firing onTouchStart events
    event.stop();

    if (this.usenativeselector)
    {
      //this.el.focus();
      this.el.__origfocus();

      // works on Android, but not iOS
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(event.type, event.bubbles, event.cancelable, window,
          0, 0, 0, 0, 0, false, false, false, false, 0, null);
      this.el.dispatchEvent(evt);

      return;
    }

    this.node.focus();

    //console.log(this.isopen);
    if (this.isopen)
      this.closeOptionsMenu();
    else
      this.openValuesMenu();
  }

, closeOptionsMenu: function()
  {
    if($wh.debug.meo)
      return;
    this.classicvaluesmenu.closeMenu();
    //this.classicvaluesmenu.destroy();
  }

, onMenuActivateItem:function(event)
  {
    var item = event.detail.menuitem;

    var node = this.el.getElements("option")[item.getAttribute("data-pulldown-index")];
    if(!node || node.disabled)
    {
      event.stop();
      return;
    }
    $wh.changeValue(this.el, node.value); //FIXME Properly deal with <option>s without a value

    event.stopPropagation(); //don't bubble
  }
})

function replaceSelectComponent(select, options)
{
  //console.info("Replacing select", select);
  if (select.get("tag") != "select")
  {
    console.warn("$wh.Pulldown.replaceComponents can only replace <select> elements.")
    return;
  }

  if (!"usenativeselector" in options)
    options.usenativeselector = true; //Browser.Platform.ios === true;

  var comp = new $wh.Pulldown2(options, select);

  // delegate focus from the original component to the replacement
  select.__origfocus = select.focus;
  select.focus = function()
  {
    comp.focus();
  }

  if (comp.usenativeselector)
  {
    // visibility: "hidden" or display: "none" -> iOS doesn't give it focus
    // top/left negative -> website scrolls out of view upon focus
    comp.node.setStyle("position", "relative");

    //select.tabIndex = -1;

    select.setStyles({ "position":       "absolute"
                     , "pointer-events": "none"
                     , "left": 0 //"50%"
                     , "-webkit-appearance": "none"
                     , "border": "1px solid rgba(0,0,0,0)"
                     //, "width": 0 // this interferes with measuring
                     , "height": 0
                     , "z-index": -10
                     //, "visibility":     "hidden"
                     , "font-size": "18px" // large enough so iOS doesn't feel the need to zoom into the control
                     });

    // Replace the current select with the new pulldown's node
    select.parentNode.insertBefore( $(comp), select);
    comp.node.adopt(select);
        //.parentNode.insertBefore($(comp), select.nextSibling);
  }
  else
  {
    // Replace the current select with the new pulldown's node
    select.parentNode.insertBefore($(comp), select);
  }

  // Refresh to apply correct widths. getStyle returns actual computed style for displayed components, but set style for
  // hidden components. So by refreshing after injecting the replacement, the set CSS style is read and applied.
  // Fixes <select style="width: 100%">
  comp.refresh();

  // FIXME: this are here for legacy reasons and should not be used in new code
  select.store("wh-ui-replacedby", $(comp));
}

$wh.Pulldown2.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceSelectComponent, options);
}


})(document.id); //end mootools wrapper
