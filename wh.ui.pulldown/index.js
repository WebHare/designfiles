/* generated from Designfiles Public by generate_data_designfles */
require ('.././pulldown.css');
require ('../wh.components.menus');
require ('../wh.ui.base');
require ('../frameworks.mootools.more.keyboard');
/*! LOAD: wh.components.menus, wh.ui.base, frameworks.mootools.more.keyboard
!*/

/* For debugging, add #wh-ignore-pulldown-blur to the URL to prevent
   the pulldown from closing on blur


ADDME: native... if we focus() our real node....

FIXME: support usenativeselector option for Android.
       However unlike iOS, calling focus() on a <select> doesn't seem to activate the pulldown.

FIXME: The tabindex doesn't work on iOS

- renamed minimumvisible to minvisibleoptions
- added maxvisibleoptions

   */

(function($) { //mootools wrapper

$wh.Pulldown = new Class(
{ Implements: [ Events, Options ]
, Binds: [ "onMouseDown", "onKeyDown", "onInputChange", "onTouchStart"
         , "onMenuClose"
         , "onNodeFocus", "onNodeBlur", "onClick"
         ]

, options: { enabled: true  // If the pulldown is initially enabled
           //, enablescrollbar: true //use scrollbar if pulldown doesn't fit in window

           , values: []     // { isdivider?, value, title?, selected?, enabled? } options, filled with el options, if available
           , cssclass: ''
           , valuescssclass: ''
           , borderoverlap: 0 // The number of pixels the values node is shifted up for menu/pulldown borders to overlap

           // When there isn't enough room for showing at least "minvisiblerows" options below the pulldown,
           // and there's more room above the pulldown, the options will be shown above the pulldown
           , minvisibleoptions: 5

           // To prevent the options list filling up the whole screen,
           // you can limit the length to X options
           , maxvisibleoptions: 25

           // onChange      // Called when the value was changed
           // onClose       // Called when the options menu was closed

           /// if true, the native selector will be used
           // (if the used browser/device is on the whitelist)
           , usenativeselector: false

           //Alternative element where to inject menucontainer if not document.body
           , menucontainerbase: null

           , debug: false
           , hidefirstdisabled: true //hide the first item, if it disabled
           }

, el: null                  // Element we're replacing
, el_select: true           // whether we replaced an <select> element

, node: null                // The node of the pulldown
, valuenode: null           // The node within the pulldown component showing the title of the selected option
, valuesnode: null          // Wrapper for the options menu node
, listnode: null            // <ul> containing the menu which will be manager by the this.valuesmenu object

, valuesmenu: null          // menu object ($wh.Menu)
, scroller: null            // custom scroller object ($wh.ScrollableView)
, keyboard: null            // keyboard object

, isopen: false
, previousselected: null
, options_above_pulldown: false // current position of pulldown options
, tabindex: 0

, usenativeselector: false

, initialize: function(options, el)
  {
    this.setOptions(options);

    // FIXME: is there any way to trigger the pulldown under Android, so we can provide usenativeselector for Android?
    if (this.options.usenativeselector && Browser.Platform.ios)
    {
      this.usenativeselector = true;
      if (this.options.debug)
        console.log("$wh.Pulldown will use the native option selector");
    }

    this.el = $(el);
    this.el_select = this.el && this.el.get("tag") == "select";

    this.keyboard = new Keyboard({ events: { 'down': this.onKeyDown
       //, 'enter': this.onKeyDown
                                           }
                                 });

    // Store the supplied values locally, so setNewValues can set the correct
    // values. Also, setNewValues uses getSelected to get the currently selected
    // option, but we want nothing to be selected initially
    var values = this.options.values;
    this.options.values = [];

    // If an element was supplied, copy the element's options into our values
    if (this.el_select)
    {
      this.el.addEvent("change", this.onInputChange);
      this.el.addEvent("wh-refresh", this.refresh.bind(this));
      this.buildNode();
      this.refresh();
    }
    else
    {
      this.buildNode();
      this.setNewValues(values);
    }
  }

, refresh:function()
  {
    var values = [];
    this.node.toggleClass('wh-form-disabled', this.el.hasClass('wh-form-disabled')); //mirror disabled state
    if(this.el.hasAttribute('data-form-disablemode'))
      this.node.setAttribute('data-form-disablemode', this.el.getAttribute('data-form-disablemode'));
    else
      this.node.removeAttribute("data-form-disablemode")

    this.el.getElements("> option").each(function(option, i)
    {
      var optiontitle = option.get("label") || option.get("text");

      var optval = option.get('value');
      var value = { value: (optval != null ? optval : option.get("text"))
                  , title: option.get("data-valuetitle") || optiontitle
                  , displaytitle: optiontitle
                  , selected: i == this.el.selectedIndex
                  , enabled: !option.disabled
                  , hide: option.hasClass('wh-menu-hidden') || option.hasClass('-wh-menu-hidden') || (i==0 && this.options.hidefirstdisabled && option.disabled)
                  };
      values.push(value);
    }, this);
    this.options.enabled = !this.el.disabled;
    this.node.setAttribute("tabindex", this.options.enabled ? this.tabindex : "");//needed to enable focus for key navigation
    //Adopt explicit style.display
    this.setNewValues(values, true); // initially we keep the original <select>'s content (options's)
    $wh.fireLayoutChangeEvent(this.el);
  }

, focus: function()
  {
    if (this.usenativeselector)
    {
      if($wh.legacyclasses)
      {
        this.node.addClass('-wh-pulldown-active');
        this.node.addClass('wh-pulldown-active');
      }
      this.node.addClass("active");

      //this.el.focus();
    }
    else
      this.node.focus();
  }

, destroy: function()
  {
    if (this.valuesmenu)
      this.valuesmenu.destroy();
  }

, isMenuActive: function()
  {
    return this.isopen;
  }

, buildNode: function()
  {
    var events = { "focusin":   this.onNodeFocus
                 , "focusout":  this.onNodeBlur
                 , "mousedown": this.onMouseDown
                 , "click":     this.onClick
                 //, "touchstart": this.onTouchStart
                 };

    if (this.usenativeselector)
      this.el.addEvent("blur", this.onNodeBlur);

    // since Android (FIXME: all versions?) seem to dispatch both touchStart and mouseDown
    // events even though we have a event.stop() in our touchStart handling,
    // whe'll only give iOS the benefit of directly acting on a touchStart.
    if (Browser.platform == "ios")
      events.touchstart = this.onTouchStart;

    this.node = new Element("div", { "class":  this.options.cssclass + (this.el && this.el.className ? " " + this.el.className : "")
                                   , "events": events
                                   });

    this.node.addClass('wh-pulldown');
    if($wh.legacyclasses)
      this.node.addClass('-wh-pulldown');
    this.node.store('wh-ui-replaces', this.el);

    if(this.el)
      this.tabindex = this.el.get('tabindex') || 0;


    this.valuenode = new Element("span",{"class": $wh.legacyclasses ? "wh-pulldown-title -wh-pulldown-title value" : "value"}).inject(this.node);

    new Element("span", {"class" : $wh.legacyclasses ? "wh-pulldown-arrow -wh-pulldown-arrow arrow" : "arrow"}).inject(this.valuenode, 'before');
    this.listnode = new Element("ul", { "class": "wh-menu -wh-menu" });

    this.updateState(false);
  }

, buildValueNodes: function(keepselectcontent)
  {
    this.listnode.empty();

    if (this.el_select && !keepselectcontent)
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

        if (option.title == "")
          optionnode = new Element("li", { html: "&nbsp;"
                                         , "data-wh-idx": i + 1
                                         , "class" : classes.join(" ")
                                         });
        else
          optionnode = new Element("li", { text: option.title
                                         , "data-wh-idx": i + 1
                                         , "class" : classes.join(" ")
                                         });

        option.node = optionnode;
      }
      this.listnode.grab(optionnode);

      if (this.el_select && !keepselectcontent)
        this.el.grab(new Element("option", { value: option.value
                                           , text:  option.title
                                           }));

    }, this);
  }

  /** @short replace the options of the pulldown
      @param newvalues
      @cell newvalues.title the title as displayed in the pulldown
      @cell newvalues.value
      @cell newvalues.enabled
      @cell newvalues.selected ???
      @cell newvalues.hide
      @cell newvalues.displaytitle if specified this title will be shown in a closed pulldown
      @param keepselectcontent if TRUE, the contents of the original <select> (this.el) won't be replaced (meant for use within pulldown.js, not for external use of the API)
  */
, setNewValues: function(newvalues, keepselectcontent)
  {
    //get old selected value so we can try a match in the new list
    var prevvalue = this.getSelected();
    if (prevvalue)
      prevvalue = prevvalue.value;

    this.options.values = newvalues;
    this.buildValueNodes(keepselectcontent);

    // If we have values but no value is selected, select the first value, and make sure only one item is selected
    var selected = null;
    var copymatchindex = -1;
    this.options.values.each(function(value,i)
    {
      if(typeof value.displaytitle == 'undefined')
        value.displaytitle = value.title;

      if(prevvalue === value.value)
        copymatchindex = i

      if (value.selected)
      {
        if (!selected)
          selected = value;
        else
          value.selected = false;
      }
    }, this);

    if(!selected && copymatchindex > -1)
    {
      // No new selection, keep existing selection
      this.options.values.each(function(value,i)
      {
        value.selected = (i == copymatchindex);
      });
      if (this.el_select)
        this.el.selectedIndex = copymatchindex;
    }
    else
    {
      if (!selected && this.options.values.length)
      {
        // No new selection, select the first option
        this.options.values[0].selected = true;
        if (this.el_select)
          this.el.selectedIndex = 0;
      }
      else if (selected && this.el_select)
      {
        // Set the selectedIndex of the element to the selected option
        this.el.selectedIndex = this.getSelectedIndex();
      }
    }

    this.updateState(false);
 }

, toElement: function()
  {
    return this.node;
  }

, updateState: function(onchange)
  {
    var selected = this.getSelected();

    if($wh.legacyclasses)
    {
      this.node.toggleClass("-wh-disabled", !this.getEnabled());
      this.node.toggleClass("wh-disabled", !this.getEnabled());
    }
    this.node.toggleClass("disabled", !this.getEnabled());

    // set text, or use a placeholder character to prevent the line from collapsing and losing our lineheight/baseline alignment
    this.valuenode.set("text", selected ? (selected.displaytitle ? selected.displaytitle : selected.value) : "\xA0");

    var prevvalue = this.previousselected ? this.previousselected.value : null;
    var newvalue = selected ? selected.value : null;
    if(prevvalue == newvalue)
      return;//nothing to update
    this.previousselected = selected;

    if (this.el)
    {
      if (this.el.get("tag") == "select")
        this.el.selectedIndex = this.getSelectedIndex();
      else
        this.el.value = newvalue;
    }

    if(onchange)
    {
      this.fireEvent("change", this);
      if(this.el)
        $wh.fireHTMLEvent(this.el, "change");
    }
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

, setSelected: function(idx, onchange)
  {
    if (idx < 0 || idx >= this.options.values.length || this.options.values[idx].enabled === false)
      return;

    this.options.values.each(function(value, i)
    {
      value.selected = i == idx;
    });

    this.updateState(onchange);
  }

, getValue: function()
  {
    var selected = this.getSelected();
    return selected ? selected.value : null;
  }

, setValue: function(newValue)
  {
    var prevSelected = this.getSelected();
    var selected;
    this.options.values.each(function(value)
    {
      value.selected = value.value == newValue;
      if (value.selected)
        selected = value;
    });
    if (!selected && prevSelected)
    {
      // New value was not found, restore the previous value, no need to updateState
      prevSelected.selected = true;
    }
    else
      this.updateState();
  }
, onInputChange:function()
  {
    this.setSelected(this.el.selectedIndex, false);
  }
, getEnabled: function()
  {
    return this.options.enabled;
  }

, setEnabled: function(enabled)
  {
    if (enabled != this.options.enabled)
    {
      this.setOptions({ enabled: enabled });
      this.updateState();
      this.node.setAttribute("tabindex", this.options.enabled ? this.tabindex : -1);//needed to enable focus for key navigation
    }
  }

, openValuesMenu: function()
  {
    if(this.options.debug)
      console.log("$wh.Pulldown openValuesMenu");//, pulldowncoords);

    var selected = this.getSelected();

    /*
    if (this.valuesmenu)
      this.valuesmenu.destroy();
    */

    this.valuesmenu = new $wh.Menu( this.listnode
                          , { onMenuclose: this.onMenuClose
                            , preselected: selected ? selected.node : null

                            // a pulldown is opened explicitely by the user so it should NEVER close itself
                            , hoverclosetimeout: 0
                            , autoclose_ignorenodes: [ this.node ]

                            , orientation: "vertical"
                            , scrollable:  true
                            , cssclass:    "wh-pulldown-values"

                            , debug:       this.options.debug
                            });

    var menucontainer = this.valuesmenu.getContainer();

    if(this.el)
    {
      var elid = this.el.get("id");
      if (elid)
        menucontainer.set("id", elid + "-values");
    }

    this.determinePositionAndSize();

    this.isopen = true;

    if($wh.legacyclasses)
    {
      this.node.addClass('-wh-pulldown-active');
      this.node.addClass('wh-pulldown-active');
    }
    this.node.addClass('active');

    this.valuesmenu.takeSemiFocus();

    //console.info("$wh.Pulldown.openValuesMenu will now manage keyboard", this.valuesmenu.keyboard);
    //this.keyboard.manage(this.valuesmenu.keyboard);
  }

, determinePositionAndSize: function()
  {
    var menucontainer = this.valuesmenu.getContainer();

    var pulldowncoords = this.node.getCoordinates(this.options.menucontainerbase ? this.options.menucontainerbase : document.body);

    menucontainer.setStyles({ "top": pulldowncoords.bottom - this.options.borderoverlap
                            , "left": pulldowncoords.left
                            })
                   .inject(this.options.menucontainerbase ? this.options.menucontainerbase : document.body);

    this.valuesnode = this.listnode;

    // if we just want the full menu to hang below the pulldown
    // without any scrolling or positioning above the pulldown, then exit now
    // if (this.options.noautoscroll)
    //   return;

    var windowheight = $(document.documentElement).getSize().y;
    var scrolly = $(document.documentElement).getScroll().y;

//FIXME: use listnode with ComputedSize
// now height goes wrong if menucontainer has a border
    var valuelistheight = menucontainer.getSize().y;//this.listnode.getSize().y;

    // calculate available space above and below the pulldown control element
    var topfreespace = pulldowncoords.top - scrolly;
    var bottomfreespace = windowheight - (pulldowncoords.bottom - scrolly);

    // Keep clear of the bottom part of the screem on iOS
    // (it seems to be around 25 pixels, but account for the fingersize and inaccuracy in finger placement when quickly swiping)
    if (Browser.platform == "ios")
      bottomfreespace -= 40;

    //figure out maximum line height
    /*
    var maxoptheight = 0;
    var optioncount = 0;
    this.valuesnode.getChildren("ul > li").each(function(node)
    {
      maxoptheight = Math.max(maxoptheight, node.offsetHeight);
      optioncount++;
    });
    */

    // Since the height of options can potentially wildly vary
    // (we allow multiline options) whe'll use the average option height.
    // (otherwise if the highest option is 3 lines, the default minvisibleoptions of 5 would be like 15 lines
    // which often won't fit below the pulldown, resulting in the menu just appearing where there is most room
    // instead of favoring to be below the pullDOWN)
    // var optioncount = this.valuesnode.getChildren("ul > li").length;
    var optioncount = this.valuesnode.getChildren("li").length;
    var average_option_height = valuelistheight / optioncount;

    /* The rules:
       - if we can fit minimumoptions * maxoptheight in the bottom space, downwards
       - otherwise, pick the screen half with the most available space
    */

    var min_options_below = optioncount < this.options.minvisibleoptions ? optioncount : this.options.minvisibleoptions;


    var goup = bottomfreespace < (average_option_height * min_options_below) && topfreespace > bottomfreespace;
    this.options_above_pulldown = goup;

    var availableheight = goup ? topfreespace : bottomfreespace;
    var requiresscroll = valuelistheight > availableheight;

    var maxheight = this.options.maxvisibleoptions * average_option_height;
    var renderheight = Math.min(availableheight, valuelistheight);
    if (renderheight > maxheight)
      renderheight = maxheight;

    var scrollpos = 0;
    if(goup)
      this.valuesnode.setStyle('top',(pulldowncoords.top + this.options.borderoverlap) - renderheight);

    if (this.options.debug)
    {
      console.log(
          { windowheight: windowheight
          , scrolly: scrolly
          , valuelistheight: valuelistheight

          , freespace_top: topfreespace
          , freespace_bottom: bottomfreespace

          , go_up: goup

          , availableheight: availableheight
          , requiresscroll: requiresscroll
          , renderheight: renderheight

          , average_option_height: average_option_height
          , optioncount: optioncount
          , minvisibleoptions: this.options.minvisibleoptions
          , min_options_below: min_options_below
          });
    }

    menucontainer.setStyles(
              { "position": "absolute"
              , "top":  goup
                           ? (pulldowncoords.top + this.options.borderoverlap) - renderheight
                           : pulldowncoords.bottom - this.options.borderoverlap
              , "left": pulldowncoords.left
              , "height": requiresscroll ? renderheight : null
              });

    //this.valuesmenu.scroller.refresh();
    this.valuesmenu.refresh();

    this.keyboard.manage(this.valuesmenu.keyboard);
  }

, onNodeFocus: function()
  {
    if (this.usenativeselector)
    {
      // ADDME: position so the native selector has correct positioning info
      if($wh.legacyclasses)
      {
        this.node.addClass('-wh-pulldown-active');
        this.node.addClass('wh-pulldown-active');
      }
      this.node.addClass('active');
      return;
    }

    if (this.el)
    {
      // FIXME: does it do harm that we do this each focus?
      var formnode = this.el.getParent("form");
      if (formnode)
      {
        var formhandler = formnode.retrieve("wh-formhandler");
        if (formhandler && formhandler.manageKeyboard)
          //formhandler.keyboard.manage(this.keyboard);
          formhandler.manageKeyboard(this.keyboard);
      }
    }

    this.keyboard.activate();
  }

, onNodeBlur: function()
  {
    if (this.usenativeselector)
    {
      if($wh.legacyclasses)
      {
        this.node.removeClass('-wh-pulldown-active');
        this.node.removeClass('wh-pulldown-active');
      }
      this.node.removeClass('active');
      return;
    }

    if (this.valuesmenu)
      this.closeOptionsMenu();

    this.keyboard.deactivate();
  }

, onKeyDown: function(event)
  {
    event.stop();

    if(!this.valuesmenu)
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
      this.el.focus();
      if($wh.legacyclasses)
      {
        this.node.addClass('-wh-pulldown-active');
        this.node.addClass('wh-pulldown-active');
      }
      this.node.addClass('active');
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
    this.valuesmenu.closeMenu();
    //this.valuesmenu.destroy();
  }

, onMenuClose: function(item)
  {
    if (this.options.debug)
      console.log("$wh.Pulldown onMenuClose");

    this.isopen = false;

    //this.keyboard.manage(this.valuesmenu.keyboard);

    // Check if a menu item was clicked
    if (item)
    {
      // Select the clicked item
      var idx = item.get("data-wh-idx").toInt() - 1;
      this.setSelected(idx, true);
    }

    this.fireEvent("close", this); // FIXME: obsolete this event name and fire an "change" instead ?

    // NOTE: we fire our change events in updateState()

    // The menu is closing, remove the values node
    if($wh.legacyclasses)
    {
      this.node.removeClass('wh-pulldown-active');
      this.node.removeClass('-wh-pulldown-active');
    }
    this.node.removeClass('active');

    if (this.valuesmenu)
      this.valuesmenu.destroy();
    this.valuesmenu = null;
    this.valuesnode.dispose();
  }
})

function replaceSelectComponent(select, options)
{
  //console.info("Replacing select", select);
  if (select.get("tag") != "select")
  {
    console.error("$wh.Pulldown.replaceComponents can only replace <select> elements.", select)
    return;
  }

  if (!"usenativeselector" in options)
    options.usenativeselector = true; //Browser.Platform.ios === true;

  var comp = new $wh.Pulldown(options, select);

  // delegate focus from the original component to the replacement if needed
  var __origfocus = select.focus;
  select.focus = function()
  {
    //var instance = select.retrieve("wh-pulldown");
    if (comp.usenativeselector)
    {
      comp.focus();
      __origfocus.apply(this, arguments);
    }
    else
      comp.focus();
  }

  if (comp.usenativeselector)
  {
    // visibility: "hidden" or display: "none" -> iOS doesn't give it focus
    // top/left negative -> website scrolls out of view upon focus
    comp.node.setStyle("position", "relative");

    select.tabIndex = -1;

    select.setStyles({ "position":       "absolute"
                     , "pointer-events": "none"
                     , "left": "50%"
                     , "height": "50%"
                     , "-webkit-appearance": "none"
                     , "border": "1px solid rgba(0,0,0,0)"
                     , "width": 0
                     , "height": 0
                     , "z-index": -10
                     //, "visibility":     "hidden"
                     });

    // Replace the current select with the new pulldown's node
    select.parentNode.insertBefore( $(comp), select);
    comp.node.adopt(select);
        //.parentNode.insertBefore($(comp), select.nextSibling);
  }
  else
  {
    // Replace the current select with the new pulldown's node
    select.setStyle("display", "none");
    select.parentNode.insertBefore($(comp), select);
  }

  // FIXME: this are here for legacy reasons and should not be used in new code
  if($wh.legacyclasses)
  {
    select.store("-wh-pulldown", comp)
          .store("wh-pulldown", comp)
  }
  select.store("wh-ui-replacedby", $(comp));
}

$wh.Pulldown.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceSelectComponent, options);
}

$wh.SelectToCustomPulldown = new Class(
{ initialize: function(selector, options)
  {
    if (window["console"])
      console.warn("$wh.SelectToCustomPulldown is deprecated, use $wh.Pulldown.replaceComponents instead");
    $wh.Pulldown.replaceComponents(selector, options);
  }
})

})(document.id); //end mootools wrapper
