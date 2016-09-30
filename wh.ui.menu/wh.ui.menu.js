/* generated from Designfiles Public by generate_data_designfles */
require ('./menu.css');
require ('wh.compat.base');
require ('frameworks.mootools.more.class.binds');
require ('frameworks.mootools.more.keyboard');
require ('frameworks.mootools.more.element.measure');
require ('wh.components.scrollableview');
require ('wh.util.scroll');
/*! LOAD: wh.compat.base, frameworks.mootools.more.class.binds, frameworks.mootools.more.keyboard, frameworks.mootools.more.element.measure
    LOAD: wh.components.scrollableview, wh.util.scroll
!*/

/* Display and handle menus.

   How to make a menu:

   DOM:

   <ul>
     <li>Normal item</li>                       # normal item
     <li class=".divider"></li>                 # divider
     <li class=".disabled">Disabled item</li>   # Disabled (visible bot not selectable) item
     <li class=".hidden">Hidden item</li>       # Hidden item (automatically hidden by menu CSS)
     <li>Hidden item</li>       # Hidden item

     <li>expandable                             # Submenus are detected automatically (when they contain a UL)
       <ul>
         <li>Submenu item 1</li>
         <li>Submenu item 2</li>
       </ul>
     </li>
   <ul>

   Transformations done on the DOM when a menu is active/displayed:

   Generic:
   - The class 'hassubmenu' is added to an LI with a submenu
   - Open menus have the class 'open' added to their UL
   - Open menus have a class 'level-$DEPTH' added, where $DEPTH is their opening depth (top menu is depth 1)
   - When a menu has a submenu with an active selection, the parent menu will have the class 'hassubselect'

   Menu bar
   - the classes 'wh-menu' and 'wh-menubar' are added to the UL
       <ul class="wh-menu wh-menubar">
         ...

   Menu list:
   - The class 'wh-menu' and 'wh-menulist' are added
   - The UL is removed from the original location in the DOM, and replaced by a placeholder
   - When scrolling is enabled and required for displaying, the UL is transformed as follows:

     <ul class="wh-menu wh-menulist">
       <div class="wh-scrollableview-content>
         ... original contents of ul ...
       </div>
       <div ...
       <div ...
     </ul>


   CSS to add for user:

    # Menu styling
    ul.wh-menu
    {
      background: #fafafa;
      box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.2);
      min-width:100px;
    }

    # Normal menu item styling
    ul.wh-menu li
    {
      color: #000000;
      padding: 3px 20px;
      height: 23px;
    }

    # selected menu items
    ul.wh-menu li.selected
    {
      background-color: #95cdfe;
      color: #ffffff;
    }

    # selected menu items in parentmenus
    ul.wh-menu.hassubselect li.selected
    {
      background: #b3b3b3;
    }

    # Selection resets for disabled items and dividers
    ul.wh-menu li.disabled.selected
    {
      background-color: transparent;
    }
    ul.wh-menu li.divider.selected
    {
      background-color: transparent;
      color: inherit;
    }

    # Styling for disabled items
    ul.wh-menulist li.disabled
    {
      color: #b3b3b3;
    }

    # Styling for dividers
    ul.wh-menulist li.divider
    {
      cursor: default;
      padding:3px 0px;
      height: 3px;
    }

   EVENTS:
   - Fired at node responsible for triggering a menu (the menubar, openAt element)
     wh-menu-activateitem - cancellable
     wh-menu-open - cancellable when a menu is about to open
     wh-menu-close - not cancellable

   - Fired directly on the menu items
     wh-menu-opened - cancelling only prevents builtin aninmations from running
     wh-menu-closed - cancelling only prevents builtin aninmations fromrunning


   FIXMEs:
   - In tollium, when opening a menu bar when the submenu doesn't fit, the menu will
     be placed over the menu bar item. A mouseleave is fired, but no mouseenter
     for the submenu - and then the autoclose callback kicks in and closes all menus.

   - rewrite?
     - either store info on each level (virtualtree) in an array of let them have their own class
     - if a keypress has no result for the current level/orientation, determine whether it does one level higher

   - verbeteren keyboard navigatie
     (page up, page down)

   - enablestates, visibility, hide-if-disabled. even kijken hoe we dit het
     beste kunnen oplossen... callbacks naar todd of we een item mogen tonen?
     of todd de items maar laten verwijderen/hiden uit de menustructuur, en ons
     een refresh() laten sturen? een event 'onBeforeOpen' die todd de kans geeft
     om subitems uit te zetten?

   ADDMEs:
   - snelle selectie: mousedown/touch, slepen naar menuitem dat je wil kiezen, direct activeren bij mouse/touchup
   - handmatige activatie mogelijk maken (dat apps bv F10 aan menu mappen?)
   - animaties aan showenhiden van menus kunnen hangen? (bv hele kort fadeuits)
   - leuke goodie van mac: een menuitem knippert eventjes na aanklikken
   - smooth scrolling bij volgen van selectie bij keyboard navigatie
   - oninput event (for realtime reacting during hover or keyboard navigation)
*/

(function($) { //mootools wrapper
"use strict";

// Global menu options (defaults)
var menuoptions = { hoverclosetimeout: 500 // -1 for no timeout
                  , horizbounds: null
                  , animateopenduration: 0
                  , animateopeneffects: [] //supported effects: rolldown,fadein
                  , animatemaxopacity: 1
                  , scrollableviewoptions: {}
                  , allowscrollableview: false
                  , eatcloseclick: false
                  , capturekeyboard: true
                  , handlehomeend: true // Handle 'home' and 'end' keys
                  };

// Menu options for components
var componentmenuoptions = {};

// Menus being closed in the current eventloop
var closingmenus = [];

function cleanClosingMenus()
{
  closingmenus = [];
}

function getRelativeBoundingRect(el, origin)
{
  if(!origin)
    origin = el.ownerDocument.body;

  var elrect = el.getBoundingClientRect();
  var originrect = origin.getBoundingClientRect();
  return { left: elrect.left - originrect.left
         , top: elrect.top - originrect.top
         , bottom: elrect.bottom - originrect.top
         , right: elrect.right - originrect.left
         , width:elrect.width
         , height:elrect.height
       };
}

var MenuController = new Class(
{ Implements: [Options,Events]
, Binds: [ "_gotGlobalMouseDown", "_gotGlobalKeyPressed" ]

  /// Indicates whether we have taken the keyboard and mouse
, tookfocus:false

  /// List of currently active menus
, activemenus: []

  /// List of menus the mouse is in
, mousemenus: []

  /// Time at which to check if the mouse is still hovering above a menu
, checkclose: 0

  /// Close check callback id
, checkclosedelay: null

  /// Unused
, node: null

  // Node that was responsible for opening the first menu (and will receive the events)
, eventnode: null

  // ---------------------------------------------------------------------------
  //
  // Constructor & destroy
  //

, initialize:function(node, options)
  {
    if($wh.debug.men)
      console.log("[men] initialize MenuController called")

    this.touch_enabled = "createTouch" in document;

    this.node = node;
    this.setOptions(options);
  }

, destroy:function()
  {
    this.closeAll();
  }

  // ---------------------------------------------------------------------------
  //
  // Callbacks
  //

, _gotGlobalMouseDown: function(htmlevent)
  {
    var evt = new DOMEvent(htmlevent);
    var menu = this._getMenuByElement(evt.target);
    if ($wh.debug.men)
      console.log('[men] globalMouseDown handler captured mousedown (semifocus) and detected menu: ', menu, evt);

    if(menu)
      return true; //inside our menus. let it pass

    // Cancel the evt if requested (this won't cancel the following oncontextmenu evt!)
    if (this.activemenus.length && this.activemenus[0].options.eatcloseclick)
    {
      this.closeAll();
      evt.stop();
      return false;
    }

    this.closeAll();
    return true;
  }

, _gotGlobalKeyPressed: function(htmlevent)
  {
    // INV: this.activemenus.length > 0

    // Translate event to MooTools domevent (this event listener runs in capture phase, not supported by mootools)
    var evt = new DOMEvent(htmlevent);

    // Global key handling
    switch (evt.key)
    {
      case "esc":
      {
        if (this.activemenus.length)
        {
          this.closeAll();
          evt.stop();
        }
      } break;
    }

    for (var i = this.activemenus.length - 1; i >= 0; --i)
    {
      if (this.activemenus[i]._handleKey(event, i == 0))
      {
        if ($wh.debug.men)
          console.log("[men] globalKeyDown handler captured keyboard event that was handled by a menu, cancelling the event", this.activemenus[i], evt);

        evt.stop();
        return;
      }
    }

    // If we haven't taken focus, and not actively capturing the keyboard in the top menu, just let the event through
    if (!this.tookfocus || !this.activemenus[0].options.capturekeyboard)
      return true;

    // ADDME: make configurable if the menu takes control of ALL keyboard nav.

    // Close when a shortcut-like key is detected (f-key of something with control/alt/meta pressed)
    if (evt.key.match(/^f.+/) || ((evt.control || evt.alt || evt.meta) && ![ "control", "alt", "meta", "shift" ].contains(evt.key)) && evt.event.keyIdentifier != "Meta")
    {
      this.closeAll();
    }
    else
      evt.stop();
  }

  // ---------------------------------------------------------------------------
  //
  // Helper functions
  //

, _getMenuByElement:function(el)
  {
    if(el == window) // FIXME: document what this does
      return null;

    var matchmenu = null;
    Array.some(this.activemenus, function(openmenu)
    {
      if(openmenu.el == el || openmenu.el.contains(el))
        matchmenu = openmenu;
      return matchmenu;
    });
    return matchmenu;
  }

, clearCloseTimeout: function()
  {
    if (this.checkclosedelay)
      clearTimeout(this.checkclosedelay);
    this.checkclosedelay = null;
  }

  // ---------------------------------------------------------------------------
  //
  // Public API
  //

  /** Takes over mouse and keyboard to control the menu
  */
, takeSemiFocus:function()
  {
    if(this.tookfocus)
      return;

    if ($wh.debug.men)
      console.log('[men] takeSemiFocus');

    // With semifocus taken, no auto-closing of the menu anymore
    this.clearCloseTimeout();
    this.tookfocus = true;
  }

  /** Releases the mouse and keyboard
  */
, releaseSemiFocus:function()
  {
    if ($wh.debug.men)
      console.log('[men] releaseSemiFocus');

    this.tookfocus = false;
  }

  /// Called by a menu when the mouse enters it
, mouseEnteredMenu:function(menu)
  {
    this.mousemenus.include(menu);

    // Cancel close delay, we have a new opened menu
    this.clearCloseTimeout();
  }

, setMenuActive: function(menu, active)
  {
    if (active == this.activemenus.contains(menu))
      return;

    if (active)
    {
      this.activemenus.push(menu);
    }
    else
      this.activemenus.erase(menu);

    if (this.activemenus.length == (active?1:0)) // did we change from/tone no active menus?
    {
      if (active) // First active menu
      {
        document.addEventListener("mousedown", this._gotGlobalMouseDown, true); //capture if possible
        document.addEventListener("keydown", this._gotGlobalKeyPressed, true);

        if(document.activeElement.nodeName == 'IFRAME')
        {
          //note: IE ingnores 'blur' and firefox seems to have problems with window.focus
          document.activeElement.blur();//remove focus from iframe
          if(!document.activeElement || document.activeElement.nodeName == 'IFRAME')
            window.focus();
        }

        window.addEventListener('blur', this._gotGlobalMouseDown, false);
        if(this.touch_enabled)
          document.addEventListener("touchstart", this._gotGlobalMouseDown, true); //capture if possible
      }
      else
      {
        document.removeEventListener("mousedown", this._gotGlobalMouseDown, true);
        document.removeEventListener("keydown", this._gotGlobalKeyPressed, true);

        window.removeEventListener('blur', this._gotGlobalMouseDown, false);
        if(this.touch_enabled)
          document.removeEventListener("touchstart", this._gotGlobalMouseDown, true); //capture if possible

        // All menu's are gone, no need for the close timeout anymore
        this.clearCloseTimeout();

        if (this.tookfocus)
          this.releaseSemiFocus();
      }
    }
  }

  /// Called by a menu when the mouse exits it
, mouseLeftMenu:function(menu)
  {
    /* When the mouse exists all menus, in openonhover mode (but no clicks in menu!), the close delay kicks in
       A click takes semifocus, and prevents the close delay
    */
    this.mousemenus.erase(menu);
    if(this.mousemenus.length == 0 && this.activemenus.length && !this.tookfocus) //left all menus, and not taken focus?
    {
      var options = this.activemenus[0].options;
      if (options.hoverclosetimeout >= 0)
      {
        // Reset the close timeout, and set a new one
        this.clearCloseTimeout();
        this.checkclosedelay = this._checkMenuClose.bind(this).delay(options.hoverclosetimeout);
      }
    }
  }

, getEventNode:function()
  {
    if(this.eventnode)
      return this.eventnode;
    if(this.activemenus.length > 0 && this.activemenus[0] instanceof $wh.MenuBar)
      return this.activemenus[0].el;
    return document.documentElement;
  }

, closeAll:function()
  {
    if(this.activemenus.length)
     this.activemenus[0]._selectItem(null);

    while(this.activemenus.length)
      this.activemenus[0]._closeMenu();

    this.mousemenus = [];
    this.eventnode = null;
  }

, openSubMenu:function(parentmenu, horizontalsubs, li)
  {
    if($wh.debug.men)
      console.log("[men] openSubMenu called")

    var ul = li.getElement('ul');
    var submenu = ul.retrieve("wh-menu") || this.createSubMenu(ul);
    if(!submenu._fireOpenCloseEvent(true))
      return;

    closingmenus=[]; //if we're back to opening menus, forget about the close list
    submenu._openMenu(getRelativeBoundingRect(li), horizontalsubs ? parentmenu.currentalign=='right'?'left':'right' : 'down', parentmenu, horizontalsubs ? parentmenu.currentalign : null, horizontalsubs ? "left" : "top", 0);
    this.recomputeSubSelection();

    //make their relations clear for users iterating through the DOM
    li.store("wh-menu-submenu", ul);
    ul.store("wh-menu-parentmenu", li);
    return submenu;
  }

  /** Open a submenu as a list
      @param submenu Menu to open
      @param coords Reference element coordinates (.top, .bottom, .right, .left)
      @param preferreddirection 'right', 'left', 'up', 'down'
      @param preferredalign left/right (only used when preferreddirection is 'up' or 'down')
      @param exitdirection '', 'top', 'left' - cursor direction in which the selection can be removed
      @param minwidth Minimum menu width
      @param options
      @cell options.forcenooverlap Whether to disallow overlap of the reference element
  */
, openAsList:function(submenu, coords, preferreddirection, preferredalign, exitdirection, minwidth, options)
  {
    if($wh.debug.men)
      console.log("[men] openAsList called");
    if(!submenu._fireOpenCloseEvent(true))
      return;

    closingmenus=[]; //if we're back to opening menus, forget about the close list
    submenu._openMenu(coords, preferreddirection, null, preferredalign, exitdirection, minwidth, options);
    this.recomputeSubSelection();
    this.takeSemiFocus();
  }

, createSubMenu:function(ul)
  {
    if($wh.debug.men)
      console.log("[men] createSubMenu called")

    var submenu = new $wh.MenuList(ul);
    return submenu;
  }

, _checkMenuClose:function()
  {
    this.checkclosedelay = null;

    if($wh.debug.men)
      console.log("[men] checkMenuClose, menu active: ", this.mousemenus.length?"yes":"no");

    if(this.mousemenus.length > 0) //still a menu active
      return;

    this.closeAll();
  }

  /** Recompute which menus have subselections
  */
, recomputeSubSelection: function(items)
  {
    var foundselection = false;
    for (var i = this.activemenus.length - 1; i >= 0; --i)
    {
      this.activemenus[i].el.toggleClass('hassubselect', foundselection);
      if (this.activemenus[i].selecteditem)
        foundselection = true;
    }
  }
});

var controller;

$wh.MenuBase = new Class(
{ Implements: [ Events, Options]
, Binds: [ '_onMouseDownOnItem', '_onClickItem', '_onMouseMove', '_onMouseEnter', '_onMouseLeave', '_onContextMenu'
         , '_onRefresh'
         ]
, options: { // the default menuoptions are merged into this array
             openonhover: true
           }
, el: null // our value list node
, active: false // Whether this menu is active
, scrollcontent: null // Our scrollable content (the li's are moved into this element)
, scrollableview: null // Scrollableview class
, selecteditem: null
, horizontalsubs: true
, openedsubmenu: null
, depth: 0
, parentmenu: null
, exitdirection: ''

, initialize:function(el, options)
  {
    if($wh.debug.men)
      console.log("[men] initialize $wh.MenuBase called")

    if(!controller)
      controller = new MenuController;

    this.el = $(el);
    if(!this.el)
    {
      console.error("No such menubar node:",el)
      throw new Error("No such menubar node");
    }
    this.el.addClass("wh-menu");
    this.el.store('wh-menu', this);

    if(this.el.hasAttribute("data-menu-options")) //parse these, but explicit JS options take precedence
      options = Object.merge(JSON.parse(this.el.getAttribute("data-menu-options")), options);

    this.setOptions(options);
    this.options = Object.merge({}, menuoptions, this.options); // Use menuoptions as defaults

    this.el.addEvent("mousedown:relay(li)", this._onMouseDownOnItem);
    this.el.addEvent("click:relay(li)", this._onClickItem);
    this.el.addEvent("mouseenter", this._onMouseEnter);
    this.el.addEvent("mouseleave", this._onMouseLeave);
    this.el.addEvent("mousemove:relay(li)", this._onMouseMove);
    this.el.addEvent("contextmenu", this._onContextMenu);
    this.el.addEvent('wh-refresh', this._onRefresh);

    Array.each(this._getMenuItems(), this._setupLi.bind(this));
  }

, destroy:function()
  {
    this._closeMenu();
    this.el.removeEvent("mousedown:relay(li)", this._onMouseDownOnItem);
    this.el.removeEvent("click:relay(li)", this._onClickItem);
    this.el.removeEvent("mouseenter", this._onMouseEnter);
    this.el.removeEvent("mouseleave", this._onMouseLeave);
    this.el.removeEvent("mousemove:relay(li)", this._onMouseMove);
    this.el.removeEvent("contextmenu", this._onContextMenu);
    this.el.removeEvent("wh-refresh", this._onRefresh);
    this.el.removeClass("wh-menu");
    this.el.eliminate("wh-menu");
    this.el=null;
  }

  // ---------------------------------------------------------------------------
  //
  // Helper functions
  //

, _setupLi: function(li)
  {
    if($wh.debug.men)
      console.log("[men] setupLi called")

    if(li.getElement("ul"))
      li.addClass("hassubmenu");
  }

, _getMenuItems:function()
  {
    if($wh.debug.men)
      console.log("[men] _getMenuItems called")

    return this.el.getChildren("li");
  }

, _isOrientationVertical: function()
  {
    return this.horizontalsubs;
  }

  /// Position: "first", "last", "previous", "next"
, _selectRelativeItem: function(position, scroll)
  {
    var items = this._getSelectableItems(this.el);
    var pos = this.selecteditem ? items.indexOf(this.selecteditem) : -1;
    if (!items.length)
      return;

    switch (position)
    {
    case "first":       pos = 0; break;
    case "last":        pos = items.length - 1; break;
    case "next":        pos = pos + 1; break;
    case "previous":    pos = pos - 1; break;
    }

    if (pos >= items.length)
      return;

    if (pos < 0)
    {
      if (this.exitdirection == (this._isOrientationVertical() ? "top" : "left"))
        this._selectItem(null);

      return;
    }

    this._selectItem(items[pos], scroll);
  }

, _getSelectableItems: function()
  {
    // If we moved the li's into the scrollcontent, use that one
    var node = this.scrollcontent || this.el;
    return node.getElements('>li:not(.divider,.disabled,.hidden)');
  }

, _fireOpenCloseEvent:function(isopen)
  {
    var eventname = isopen ? "wh-menu-open" : "wh-menu-close";
    var evt = new $wh.CustomEvent(eventname, { bubbles: true, cancelable: isopen, detail: { menu: this.el }});
    var eventnode = controller.getEventNode();
    if($wh.debug.men)
      console.log("[men] dispatching " + eventname + " for ", this.el, " to " , eventnode, " tree ", eventnode.getParents());
    return $wh.dispatchEvent(eventnode, evt);
  }

, _selectItem:function(li, scroll)
  {
    if(li && !controller.activemenus.contains(this))
    {
      controller.setMenuActive(this, true);
      this.active = true;
    }
    if(li && !controller.mousemenus.contains(this))
      controller.mousemenus.push(this);

    if(this.selecteditem)
    {
      if(this.openedsubmenu)
      {
        this.openedsubmenu._closeMenu();
        this.openedsubmenu = null;
      }
      this.selecteditem.removeClass("selected");
      this.selecteditem = null;
    }
    if(!li || li.hasClass('disabled')) //cannot be selected
    {
      controller.recomputeSubSelection();
      return;
    }

    if(!li.hasClass('divider'))
    {
      this.selecteditem = li;
      li.addClass("selected");
    }

    if (scroll)
      $wh.scrollToElement(li);

    var ul = li.getElement('ul');
    if(li.hasClass("hassubmenu"))
    {
      this.openedsubmenu = controller.openSubMenu(this, this.horizontalsubs, li);
      this.openedsubmenu.addEvent("wh-menu-close", function(event)
      {
        if (event.target == this.openedsubmenu)
          this.openedsubmenu = null;
      }.bind(this));
    }

    controller.recomputeSubSelection();
  }

, _closeMenu: function()
  {
    this._fireOpenCloseEvent(false);
    this.active = false;

    controller.setMenuActive(this, false);
    controller.recomputeSubSelection();

    this._selectItem(null);
  }

  // ---------------------------------------------------------------------------
  //
  // Callbacks & events
  //

, _onMouseEnter:function(event)
  {
    controller.mouseEnteredMenu(this);
  }

, _onMouseLeave:function(event)
  {
    controller.mouseLeftMenu(this);
  }

, _onMouseDownOnItem:function(event,li)
  {
    event.preventDefault(); //avoid focus theft
    this._selectItem(li);
    controller.takeSemiFocus();
  }

, _onContextMenu: function(event)
  {
    if ((event.control || event.meta) && event.shift)
      return;
    event.stop();
  }

, _onClickItem:function(event,li)
  {
    var menuevent = new $wh.CustomEvent("wh-menu-activateitem", { bubbles: true, cancelable: true, detail: { menuitem: li }});
    var eventnode = controller.getEventNode();

    if($wh.debug.men)
        console.log("[men] dispatching wh-menu-activateitem for menuitem ", li, " to ", eventnode, " in tree ", eventnode.getParents());

    /* Make sure the field value is synced for replaced components
       ADDME test, we'll need selenium, reproduced on chrome and firefox
       tollium basecomponents testdatetime triggers

       Test: http://sites.moe.sf.b-lex.com/tollium_todd.res/tollium_dev/jstests/?mask=blex_testsuite.tollium.basecomponents.testdatetime&nocatch=1
    $wh.flushFocusedChanges();

    FIXME Ensure the bug is gone
*/
    //ignore clicks on things with a submenu or disabled items
    var close_after_click = !li.hasClass("hassubmenu") && !li.hasClass("disabled");

    if(!$wh.dispatchEvent(eventnode, menuevent))
    {
      if($wh.debug.men)
        console.log("[men] menu close cancelled by event");
      return;
    }

    if (!close_after_click)
      return;

    controller.closeAll();
  }

, _onMouseMove:function(event,li)
  {
    // Need to select item if hovering above non-selected item, or have item selected in submenu
    var must_select = (li != this.selecteditem) || (this.openedsubmenu && this.openedsubmenu.selecteditem);
    if (!must_select)
      return;

    /* Only select when in right mode
       When taken focus, menu must be active (prevent menubar from reacting when contextmenu is open)
       Otherwise, react only when openonhover is set
    */
    if (controller.tookfocus ? this.active : this.options.openonhover)
      this._selectItem(li);
  }

, _onRefresh: function()
  {
  }

  // ---------------------------------------------------------------------------
  //
  // Keyboard handling
  //

  /// Handles a key event, returns whether the key has been processed
, _handleKey: function(event, topmenu)
  {
    if(!this.el)
      return false;

    switch(event.key)
    {
    case 'enter':       return this._handleKeyEnter(event, topmenu); break
    case 'up':          return this._handleKeyUp(event, topmenu); break;
    case 'down':        return this._handleKeyDown(event, topmenu); break;
    case 'left':        return this._handleKeyLeft(event, topmenu); break;
    case 'right':       return this._handleKeyRight(event, topmenu); break;
    case "home":        return this._handleKeyHome(event, topmenu); break;
    case "end":         return this._handleKeyEnd(event, topmenu); break;
    case "meta+up":     return this._handleKeyHome(event, topmenu); break;
    case "meta+down":   return this._handleKeyEnd(event, topmenu); break;
    default:            return false;
    }
  }

, _handleKeyUp: function(event, topmenu)
  {
    if ($wh.debug.men)
      console.log("[men] _handleKeyUp");

    if (this._isOrientationVertical())
    {
      if (!this.selecteditem && !topmenu)
        return false;

      this._selectRelativeItem("previous", true);
      return true;
    }
    else
    {
      if (this.selecteditem && this.exitdirection == "top")
      {
        this._selectItem(null);
        return true;
      }
    }

    return false;
  }

, _handleKeyDown: function(event, topmenu)
  {
    if ($wh.debug.men)
      console.log("[men] _handleKeyDown");

    if (this._isOrientationVertical())
    {
      if (!this.selecteditem && !topmenu)
        return false;

      this._selectRelativeItem("next", true);
      return true;
    }
    else
    {
      if (this.openedsubmenu && !this.openedsubmenu.selecteditem)
      {
        this.openedsubmenu._selectRelativeItem("first", true);
        return true;
      }
    }

    return false;
  }

, _handleKeyLeft: function(event, topmenu)
  {
    if ($wh.debug.men)
      console.log("[men] _handleKeyLeft");

    if (this._isOrientationVertical())
    {
      if (this.selecteditem && this.exitdirection == "left")
      {
        this._selectItem(null);
        return true;
      }
    }
    else
    {
      if (!this.selecteditem && !topmenu)
        return false;

      this._selectRelativeItem("previous", true);
      return true;
    }

    return false;
  }

, _handleKeyRight: function(event, topmenu)
  {
    if ($wh.debug.men)
      console.log("[men] _handleKeyRight");

    if (this._isOrientationVertical())
    {
      if (this.openedsubmenu && !this.openedsubmenu.selecteditem)
      {
        this.openedsubmenu._selectRelativeItem("first", true);
        return true;
      }
    }
    else
    {
      if (!this.selecteditem && !topmenu)
        return false;

      this._selectRelativeItem("next", true);
      return true;
    }

    return false;
  }

, _handleKeyHome: function(event, topmenu)
  {
    if ($wh.debug.men)
      console.log("[men] _handleKeyHome");

    if (!this.options.handlehomeend)
      return;

    if (!this.selecteditem && !topmenu)
      return false;

    this._selectRelativeItem("first", true);
    return true;
  }

, _handleKeyEnd: function(event, topmenu)
  {
    if ($wh.debug.men)
      console.log("[men] _handleKeyEnd");

    if (!this.options.handlehomeend)
      return;

    if (!this.selecteditem && !topmenu)
      return false;

    this._selectRelativeItem("last", true);
    return true;
  }

, _handleKeyEnter: function(event)
  {
    if ($wh.debug.men)
      console.log("[men] _handleKeyEnter");

    if (!this.selecteditem)
      return false;

    this._onClickItem(event, this.selecteditem);
    return true
  }
});

$wh.MenuBar = new Class(
{ Extends: $wh.MenuBase
, options: { openonhover: false
           }

, horizontalsubs: false

, initialize: function(el, options)
  {
    if($wh.debug.men)
      console.error("[men] initialize $wh.MenuBar called")

    this.parent(el, options);
    this.el.addClass("wh-menubar");

    // Make this.options.openonhover readonly
    var v = this.options.openonhover;
    Object.defineProperty(this.options, "openonhover",
      { enumerable: true
      , configurable: true
      , set: function(a) { throw new Error("not writable"); }
      , get: function(a) { return v; }
      });
  }

, destroy:function()
  {
    this.el.removeClass("wh-menubar");
    this.parent();
  }
});

$wh.MenuList = new Class(
{ Extends: $wh.MenuBase
, position: null
, substitutionnode: null
, currentalign: null
, preferreddirection: ''

, initialize:function(el, options)
  {
    if($wh.debug.men)
      console.log("[men] initialize $wh.MenuList called")

    this.parent(el, options);
    this.el.addClass("wh-menulist");
  }

  // ---------------------------------------------------------------------------
  //
  // Callbacks
  //

, _onRefresh: function()
  {
    if($wh.debug.men)
      console.log('Menulist refresh', this.el, this.el.innerHTML);
    this._fixupDividers();
  }

  // ---------------------------------------------------------------------------
  //
  // Helper functions
  //

  /** Calculate which dividers should be visible (only between visible elements, and at most one between visible elements)
  */
, _fixupDividers:function()
  {
    if($wh.debug.men)
      console.log("[men] fixupDividers called")

    var lastdivider=null;
    var anyitem=false;
    var items = this._getMenuItems();

    Array.each(items, function(item)
    {
      // Hide menus that offer no options:
      if (item.hasClass('hassubmenu'))
      {
        var rendermenu = false;
        Array.each(item.getElementsByTagName("li"), function(subitem)
        {
          if(!subitem.hasClass("hidden") && !subitem.hasClass("divider"))
            rendermenu = true;
        }, this);

        item.toggleClass('hidden', !rendermenu);
      }
    }, this);

    Array.each(items, function(item)
    {
      if (item.hasClass('divider'))
      {
        item.addClass('hidden');
        if (anyitem) // Ignore dividers before the first item
          lastdivider = item;
      }
      else if (!item.hasClass('hidden'))
      {
        if (!anyitem)
          anyitem = true;
        else if (lastdivider) // Show the last divider followed by this visible item
          lastdivider.removeClass('hidden');
        lastdivider = null;
      }
    }, this);
  }

  /* Calculate the position for one dimension
    @param styles Object to place the styles in
    @param coords Coordinates to place the menu around (left/right/top/bottom)
    @param size Size of the menu (x/y)
    @param bounds Soft bounds to place the menu in (left/right/top/bottom)
    @param viewport Position of the viewport relative to the body (left/right/top/bottom)
    @param bodysize Size of the body (x/y)
    @param sizeattr Name of attribute in which size is kepy ('x' or 'y')
    @param minattr Name of attribute with lowest coordinates ('left' or 'top')
    @param maxattr Name of attribute with lowest coordinates ('left' or 'top')
    @param preferfirst Whether to prefer placement in the lower range
    @param overlapcoords Whether to fully overlap the coordinates (eg for the left/rigth coords when placing the menu below an element)
    @param forcenooverlap Whether to disallow overlap if menu doesn't fit at all (only when overlapcoords is false)
    @return Whether scrolling is needed for the calculated positioning
  */
, _calculatePosition: function(styles, coords, size, bounds, viewport, bodysize, horizontal, preferfirst, overlapcoords, forcenooverlap)
  {
    // Calc the style attrs that
    var sizeattr = horizontal ? "x" : "y";
    var minattr = horizontal ? "left" : "top";
    var maxattr = horizontal ? "right" : "bottom";
    var csssizeattr = horizontal ? "width" : "height";

    if($wh.debug.men)
      console.log("[men] _calculatePosition", horizontal ? "horizontal" : "vertical");

    // Get the coordinates to use for before/after placement
    var before_coords = overlapcoords ? coords[maxattr] : coords[minattr];
    var after_coords = overlapcoords ? coords[minattr] : coords[maxattr];

    // Don't allow aligning outside of screen
    before_coords = Math.min(before_coords, viewport[maxattr]);
    after_coords = Math.max(after_coords, viewport[minattr]);

    // Make sure the bounds are within the screen
    var min_bound = Math.max(bounds[minattr], viewport[minattr]);
    var max_bound = Math.min(bounds[maxattr], viewport[maxattr]);

    if($wh.debug.men)
      console.log("[men] corrected bounds", min_bound, max_bound);

    // See how much space is available (within the soft boundary)
    var bounded_space_before = before_coords - min_bound;
    var bounded_space_after = max_bound - after_coords;

    if($wh.debug.men)
      console.log("[men] bounded space", bounded_space_before, bounded_space_after);

    // Store the menu size (will be adjusted when the space isn't enough to fit the menu)
    styles[csssizeattr] = size[sizeattr] + "px";

    // See if the bounded space is enough for the preferred direction (else try the other direction)
    for (var i = 0; i < 2; ++i)
    {
      if (preferfirst && bounded_space_before >= size[sizeattr])
      {
       if($wh.debug.men)
          console.log("[men] setting maxattr",maxattr,'sizeattr',sizeattr,bodysize, before_coords);

        styles[maxattr] = (bodysize[sizeattr] - before_coords) + "px";
        return false;
      }
      else if (!preferfirst && bounded_space_after >= size[sizeattr])
      {
       if($wh.debug.men)
          console.log("[men] setting minattr",minattr,after_coords);

        styles[minattr] = after_coords + "px";
        return false;
      }
      preferfirst = !preferfirst;
    }

    // Calc the space in the entire view
    var space_before = before_coords - viewport[minattr];
    var space_after = viewport[maxattr] - after_coords;

    if($wh.debug.men)
      console.log("[men] view spaces", space_before, space_after);

    // See if the bounded space is enough for the preferred direction (else try the other direction)
    for (var i = 0; i < 2; ++i)
    {
      if (preferfirst && space_before >= size[sizeattr])
      {
       if($wh.debug.men)
          console.log("[men] setting maxattr",maxattr,'sizeattr',sizeattr, bodysize, before_coords);

        styles[maxattr] = (bodysize[sizeattr] - before_coords) + "px";
        return false;
      }
      else if (!preferfirst && space_after >= size[sizeattr])
      {
       if($wh.debug.men)
          console.log("[men] setting minattr",minattr,after_coords);

        styles[minattr] = after_coords + "px";
        return false;
      }
      preferfirst = !preferfirst;
    }

    if($wh.debug.men)
      console.log("[men] no fit on both sides");

    // Doesn't fit before or after.
    if (!overlapcoords && forcenooverlap)
    {
      // No overlap allowed? Place where the most space is in the viewport, and limit the size to force scroll
      if (space_before > space_after)
      {
        if($wh.debug.men)
          console.log("[men] space_before > space_after", space_before,space_after);

        styles[maxattr] = before_coords + "px";
        styles[csssizeattr] = space_before;
      }
      else
      {
        if($wh.debug.men)
          console.log("[men] space_before <= space_after", space_before,space_after);

        styles[minattr] = after_coords + "px";
        styles[csssizeattr] = space_after;
      }
      return true;
    }
    else
    {
      if($wh.debug.men)
        console.log("[men] minattr: ",minattr, " maxattr",maxattr,"sizeattr",sizeattr, bounds, size);

      // We may overlap the coords. See if we fit within the soft boundary
      if (bounds[maxattr] - bounds[minattr] >= size[sizeattr])
      {
        if($wh.debug.men)
          console.log("[men] Honour direction, stick to bound border");

        if (preferfirst)
          styles[minattr] = bounds[minattr] + "px";
        else
          styles[maxattr] = (bodysize[sizeattr] - bounds[maxattr]) + "px";
      }
      else if ((viewport[maxattr] - viewport[minattr]) >= size[sizeattr])
      {
        if($wh.debug.men)
          console.log("[men] Fits within view - honour direction, stick to view border");

        if (preferfirst)
          styles[minattr] = viewport[minattr] + "px"
        else
          styles[maxattr] = (bodysize[sizeattr] - viewport[maxattr]) + "px";
      }
      else
      {
        if($wh.debug.men)
          console.log("[men] Doesn't fit at all - stick to top. Force the max size to force scroll");

        styles[minattr] = viewport[minattr] + "px";
        styles[csssizeattr] = (viewport[maxattr] - viewport[minattr]) + "px";
        return true;
      }
    }
    return false;
  }

  /** Dispatch menu open events, handle open animations
  */
, _handleMenuOpen: function()
  {
    var evt = new $wh.CustomEvent("wh-menu-opened", { bubbles: true, cancelable: true, detail: { menu: this.el }});
    if($wh.debug.men)
        console.log("[men] dispatching wh-menu-opened to ", this.el, " in tree ", this.el.getParents());
    if(!$wh.dispatchEvent(this.el, evt))
      return;

    //execute any defaults
    if(menuoptions.animateopenduration)
    {
      //run open animations
      this.el.set('morph', {duration: menuoptions.animateopenduration});

      var initialstyles = {}, gotostyles = {};
      if(menuoptions.animateopeneffects.contains('rolldown'))
      {
        initialstyles.height = 0;
        gotostyles.height = this.el.scrollHeight;
      }
      if(menuoptions.animateopeneffects.contains('fadein'))
      {
        initialstyles.opacity = 0;
        gotostyles.opacity = menuoptions.animatemaxopacity;
      }
      this.el.setStyles(initialstyles);
      this.el.morph(gotostyles);
    }
  }

  /** Adds or removed the scrollableview as allowed and needed
      @param horizontal Whether horizontal scrolling is requested
      @param vertical Whether vertical scrolling is requested
  */
, _applyScrollInDOM: function(horizontal, vertical)
  {
    // FIXME: detect changes in only hoirontal/vertical
    var enable = (horizontal || vertical) && this.options.allowscrollableview;
    if (!this.scrollcontent != enable)
      return; // Nope

    if (enable)
    {
      // Rewrite the DOM to allow scrolling
      var contents = Array.from(this.el.childNodes);
      this.scrollcontent = new Element('div', { class: "wh-scrollableview-content" });
      this.el.adopt(this.scrollcontent);
      this.el.adopt(new Element('div', { class: "wh-scroller-horizontal" }));
      this.el.adopt(new Element('div', { class: "wh-scroller-vertical" }));
      this.scrollcontent.adopt.apply(this.scrollcontent, contents);

      var scrolloptions = Object.merge({}, this.options.scrollableviewoptions,
          { horizontal: horizontal
          , vertical: vertical
          });

      this.scrollableview = new $wh.ScrollableView(this.el, scrolloptions);
    }
    else
    {
      // First delete the scrollable view
      this.scrollableview.destroy();
      this.scrollableview = null;

      // Remove scrolling DOM modifications
      var contents = Array.from(this.scrollcontent.childNodes);
      this.scrollcontent.empty();
      this.scrollcontent = null;
      Array.from(this.el.childNodes).invoke("dispose");
      this.el.adopt.apply(this.el, contents);
    }
  }

  // ---------------------------------------------------------------------------
  //
  // Public API (FIXME;really public?)
  //

  /** Opens a menu
      @param coords Reference element coordinates (.top, .bottom, .right, .left)
      @param preferreddirection 'right', 'left', 'up', 'down'
      @param parentmenu
      @param preferredalign left/right (only used when preferreddirection is 'up' or 'down')
      @param exitdirection '', 'top', 'left' - cursor direction in which the selection can be removed
      @param options
      @cell options.horizbounds Horizontal bounds
      @cell options.horizbounds.left Left bound
      @cell options.horizbounds.right Right bound
      @cell options.forcenooverlap Whether to disallow overlap of the reference element
  */
, _openMenu:function(coords, preferreddirection, parentmenu, preferredalign, exitdirection, minwidth, options)
  {
    if($wh.debug.men)
      console.log("[men] openMenu called, prefdir:", preferreddirection, "prefalign:", preferreddirection, "exitdir", exitdirection)

    options = options || {};

    this._fixupDividers();

    if(!this.saveparent) //currently closed
    {
      if(document.body.contains(this.el))
      {
        this.substitutionnode = this.el.clone(false,false); //create a copy with the same style/class, to avoid the ul snapping to block mode
        this.substitutionnode.replaces(this.el);
      }
      this.el.addClass("open");
    }
    this.position = this.el.getPosition(this.el.parentNode);

    this.parentmenu = parentmenu;
    this.el.removeClass('level-' + this.depth);
    this.depth = parentmenu ? parentmenu.depth+1 : 1;
    this.el.addClass('level-' + this.depth);
    this.currentalign = preferredalign;
    this.preferreddirection = preferreddirection;
    this.exitdirection = exitdirection || 'notspecified';

    $(document.body).adopt(this.el);

    // Reset sizes before measuring
    this.el.setStyles(
      { "height": "auto"
      , "width": "auto"
      , "left": "0px"
      , "top": "0px"
      , "bottom": "auto"
      , "right": "auto"
      , "max-height": "inherit"
      , "max-width": "inherit"
      });

    var size = this.el.getSize();
    size.x = Math.ceil(Math.max(size.x, minwidth||0)); //round up, because we need 110 pixels for a 109.007 wide menu.
    size.y = Math.ceil(size.y); //round up, because we need 110 pixels for a 109.007 wide menu.

    // Calculate the viewport relative to the body
    var bodybounds = document.body.getBoundingClientRect();
    var viewsize = this.el.ownerDocument.defaultView.getSize();
    var viewport =
        { left:         -bodybounds.left
        , top:          -bodybounds.top
        , right:        -bodybounds.left + viewsize.x
        , bottom:       -bodybounds.top + viewsize.y
        };

    var bounds = Object.clone(viewport);

    // Apply horizontal bounds if set
    if (this.options.horizbounds)
    {
      var rect = getRelativeBoundingRect($(this.options.horizbounds));
      bounds.left = rect.left;
      bounds.right = rect.right;
    }

    var boundssize =
        { x:      bounds.right - bounds.left
        , y:      bounds.bottom - bounds.top
        };

    var bodysize =
        { x:      document.body.scrollWidth
        , y:      Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
        };

    var styles =
        { "bottom": "auto"
        , "top": "auto"
        , "left": "auto"
        , "height": "auto"
        , "width": "auto"
        , "max-height": "inherit"
        , "max-width": "inherit"
        };

    var scroll_horizontal = false;
    var scroll_vertical = false;

    if ($wh.debug.men)
    {
      console.log("[men] Menu coordinate data");
      console.log("[men]  target element", coords);
      console.log("[men]  menu size", size);
      console.log("[men]  bounds", bounds);
      console.log("[men]  viewport ", viewport, viewsize);
      console.log("[men]  body bounds", Object.clone(bodybounds), bodysize);
    }

    // ADDME: maybe save the resulting direction and alignment in this.currentdirection and this.currentalign
    if (preferreddirection == "left" || preferreddirection == "right" || !preferreddirection)
    {
      // Right is preferred direction
      scroll_horizontal = this._calculatePosition(styles, coords, size, bounds, viewport, bodysize, true, preferreddirection == "left", false, options.forcenooverlap || false);

      // Down is preferred alignment
      scroll_vertical = this._calculatePosition(styles, coords, size, bounds, viewport, bodysize, false, preferredalign == "up", true);
    }
    else
    {
      scroll_vertical = this._calculatePosition(styles, coords, size, bounds, viewport, bodysize, false, preferreddirection == "up", false, options.forcenooverlap || false);

      // Left is preferred alignment
      scroll_horizontal = this._calculatePosition(styles, coords, size, bounds, viewport, bodysize, true, preferredalign == "right", true);
    }

    if ($wh.debug.men)
      console.log("[men] result style:", styles, this.el);

    this.el.setStyles(styles);

    this._applyScrollInDOM(scroll_horizontal, scroll_vertical);

    controller.setMenuActive(this, true);
    this.active = true;

    this._handleMenuOpen();
  }

, _closeMenu:function()
  {
    this.parent();
    closingmenus.push(this.el);
    cleanClosingMenus.delay(0);

    var evt = new $wh.CustomEvent("wh-menu-closed", { bubbles: true, cancelable: false, detail: { menu: this.el }});
    var eventnode = controller.getEventNode();
    if($wh.debug.men)
        console.log("[men] dispatching wh-menu-closed for menu ", this.el, " to ", eventnode, " in tree ", eventnode.getParents());
    $wh.dispatchEvent(eventnode, evt);

    //make their relations clear for users iterating through the DOM
    var parentmenu = this.el.retrieve("wh-menu-parentmenu");
    if(parentmenu)
    {
      parentmenu.eliminate("wh-menu-submenu");
      this.el.eliminate("wh-menu-parentmenu");
    }
    this.el.fireEvent('menuclose');

    if(!$wh.debug.meo)
    {
      this.el.removeClass("open");

      // Remove the scroll stuff
      this._applyScrollInDOM(false, false);

      if(this.substitutionnode)
      {
        this.el.replaces(this.substitutionnode);
        this.substitutionnode.destroy();
      }
      else
      {
        this.scrollcontent = null;
        this.el.dispose();
      }

      this.substitutionnode=null;
    }
  }
});

/** Open a context menu
    el: Element to open
    at: Location where to open. Either an element or a mouse event
    options
    options.direction 'down', 'right', 'up'
    options.forcenooverlap
*/
$wh.openMenuAt = function(el, at, options)
{
  options=Object.merge({}, options);

  if(at instanceof DOMEvent)
  {
    options.direction="right";
    coords = { left: at.page.x, right: at.page.x, top: at.page.y, bottom: at.page.y };
    if(!options.eventnode)
      options.eventnode = at.target; //make sure events are injected at the click location
  }
  else if (at instanceof MouseEvent)
  {
    options.direction="right";
    coords = { left: at.pageX, right: at.pageX, top: at.pageY, bottom: at.pageY };
    if(!options.eventnode)
      options.eventnode = at.target; //make sure events are injected at the click location
  }
  else
  {
    var coords = getRelativeBoundingRect($(at));
    if(!options.direction)
    {
      options.direction="right";
      coords = { left: coords.left, right: coords.left, top: coords.top, bottom: coords.bottom };
    }
    if(!options.eventnode)
       options.eventnode = at;
  }

  var openoptions =
    { direction:        options.direction
    , align:            options.align
    , exitdirection:    options.exitdirection
    , minwidth:         options.minwidth
    }

  var eventnode = options.eventnode;

  delete options.direction;
  delete options.align;
  delete options.exitdirection;
  delete options.eventnode;
  delete options.minwidth;

  var ml = $(el).retrieve("wh-menu");
  if(!ml)
    ml = new $wh.MenuList(el, options);

  controller.closeAll();

  var openaslistoptions = {};
  if ("forcenooverlap" in options)
    openaslistoptions.forcenooverlap = options.forcenooverlap;

  controller.eventnode = eventnode;
  controller.openAsList(ml, coords, openoptions.direction, openoptions.align, openoptions.exitdirection, openoptions.minwidth || 0, openaslistoptions);

  return ml;
}

/** Measure a menu */
$wh.measureMenu = function(el)
{
  var oldclass = el.get('class');
  el.set('class', (el.get('class')||'') + ' wh-menu wh-menulist open level-1');

  var elbody = el.ownerDocument.body;
  var restoreparent = el.parentNode, restorenextsibling = el.nextSibling;
  if(restoreparent != elbody)
  {
    elbody.adopt(el);
  }

  var bcr = el.getBoundingClientRect();

  if(restoreparent != elbody)
  {
    if(restoreparent)
      restoreparent.insertBefore(el, restorenextsibling);
    else
      elbody.removeChild(el);
  }
  el.set('class',oldclass);

  return { width: bcr.width, height: bcr.height };
}




$wh.setMenuOptions = function(options)
{
  // Override existing menuoptions with options
  Object.merge(menuoptions, options);
}

$wh.getMenuOptions = function()
{
  // Return copy, don't want user to get a reference
  return Object.clone(menuoptions);
}


/// Store default menu options overrides for components
$wh.setComponentMenuOptions = function(options)
{
  componentmenuoptions = options;
}

/// Retrieve the default menu options overrides for components
$wh.getComponentMenuOptions = function()
{
  return componentmenuoptions;
}
/// Has the current menu been closed in the current event handling blocK? Pulldown needs this to prevent immediate reopening
$wh.isCurrentlyClosingMenu = function(menu)
{
  return closingmenus.contains(menu);
}
/// Get the current eventnode, the node originally responsible for the sequence of mennus
$wh.getMenuEventNode = function()
{
  return controller.activemenus.length ? controller.eventnode : null;
}

function initMenus()
{
  if($wh.config["wh:ui.menu"])
  {
    $$('ul.wh-menubar').each(function(bar)
    {
      new $wh.MenuBar(bar, $wh.config["wh:ui.menu"]);
    });
  }
}

window.addEvent("domready", initMenus);

})(document.id); //end mootools wrapper
