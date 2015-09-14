/* generated from Designfiles Public by generate_data_designfles */
require ('./menus.css');
require ('wh.compat.base');
require ('frameworks.mootools.more.class.binds');
require ('frameworks.mootools.more.keyboard');
require ('frameworks.mootools.more.element.measure');
require ('wh.components.scrollableview');
/*! REQUIRE: wh.compat.base, frameworks.mootools.more.class.binds, frameworks.mootools.more.keyboard, frameworks.mootools.more.element.measure
    REQUIRE: wh.components.scrollableview
!*/

/* FIXMEs:
   - rewrite?
     - either store info on each level (virtualtree) in an array of let them have their own class
     - if a keypress has no result for the current level/orientation, determine whether it does one level higher

   - we need the orientation for both the current menu level and parent menu level.
     For example in Tollium we would want arrow up/down to navigate through the opened submenu
     and left/right to navigate to another submenu (unless the current item has a submenu).

   - muis+keyfocus volledig overnemen zonder hulp van Todd etc zodra we actief zijn.
     zodat we bij voorkeur ook het 'uitzetten' weer zelf kunnen doen

     bij echte browsers moet dit kunnen via oppikken van een capture fase vanaf body ?
     bij IE is setCapture misschien een (deel)optie http://msdn.microsoft.com/en-us/library/ms536742%28v=vs.85%29.aspx
     en anders moeten we toch maar focus uit het originele element halen :()

   - dupe divider eliminatie (ook als tussenliggende items invisible zijn)

   - verbeteren keyboard navigatie
     (page up, page down, home, end, )

   - enablestates, visibility, hide-if-disabled. even kijken hoe we dit het
     beste kunnen oplossen... callbacks naar todd of we een item mogen tonen?
     of todd de items maar laten verwijderen/hiden uit de menustructuur, en ons
     een refresh() laten sturen? een event 'onBeforeOpen' die todd de kans geeft
     om subitems uit te zetten?

   - would it be better to recursively have instances for submenus?
     - each could have their own orientation
     - each can know whether they are currently the active submenu (so you can style the active submenu)

   ADDMEs:
   - automagically use at least the width of the pulldown as width of the options menu
   - snelle selectie: mousedown/touch, slepen naar menuitem dat je wil kiezen, direct activeren bij mouse/touchup
   - handmatige activatie mogelijk maken (dat apps bv F10 aan menu mappen?)
   - animaties aan showenhiden van menus kunnen hangen? (bv hele kort fadeuits)
   - leuke goodie van mac: een menuitem knippert eventjes na aanklikken
   - smooth scrolling bij volgen van selectie bij keyboard navigatie
   - oninput event (for realtime reacting during hover or keyboard navigation)

*/

(function($) { //mootools wrapper

$wh.Menu = new Class(
{ Implements: [Events,Options]
, Binds: [ 'onGlobalMouseDown', 'onMenuClick', 'onMouseDownOnItem', 'onMouseDown', 'onMouseMove'
         , 'onKeyEsc','onKeyUp','onKeyDown','onKeyRight','onKeyLeft','onKeyEnter'
         , 'onKeyHome','onKeyEnd'
         , 'doItemEnter', 'doItemLeave'
         ]

, options: { openonhover: false
           , hoverclosetimeout: 500
           , preselected: null
           , alwaysvisible: false // e.g. menubar in application is always visible
           , orientation:   ""
           , autoclose_ignorenodes: []
           , debug: false
           , keepinviewport: false

           , scrollable: false // FIXME
           , cssclass:   "" // cssclass to apply to the container (either the scrollable view container or originally specified element)

           , keepfromedge: 5 // keep from the edge so it doesn't look like the menu might be sticking out of the screen
           }

, container: null
, el: null // our value list node
, tookfocus: false

, open: false

, keyboard: null

, currentelement: null // node of current option having hover/selection state
, detacheditems: []
, virtualnodetree: [] // path of menu-item nodes which are selected

, orientation: ""

, initialize:function(el, options)
  {
    this.el = $(el);
    this.setOptions(options);
    if($wh.debug.men)
      this.options.debug=true;

    if (this.options.scrollable && !this.options.staticfirstlevel)
    {
      var origcontainer = el.parentNode;
      var before;
      if (origcontainer)
        before = el.nextSibling;

      this.container = this.wrapInScrollableView(el);

      // if the original node already was in the document,
      // restore the node including it's wrapper to the original position
      if (origcontainer)
      {
        if (before)
          origcontainer.insertBefore(this.container, before);
        else
          origcontainer.appendChild(this.container);
      }
    }
    else
      this.container = this.el;

    if (this.options.preselected)
      this.scrollToItemNode(this.options.preselected);

    if (this.options.cssclass != "")
      this.container.addClass(this.options.cssclass);

    var elempos;
    if (!this.options.left || !this.options.top)
      elempos = $(el).getPosition();


    var xpos = this.options.left ? this.options.left : elempos.x;
    var ypos = this.options.top  ? this.options.top  : elempos.y;


    // ADDME: make scrollable as soon as size becomes larger than the viewport
    // FIXME: share/combine code with
    if (this.options.keepinviewport && !this.options.staticfirstlevel)
    {
      /*
      var positiontype = this.el.getStyle("position");
      if (positiontype == "relative")
      {
        console.info("Relative not supported yet");
      }
      */

      var viewportsize = window.getSize();
      var scrollpos = window.getScroll();

      //var menupos = this.el.getPosition();
      var menusize = this.el.getSize();//this.submenunode.getSize();

      var override_pos = false;

      var lowest_x_inview = scrollpos.x + this.options.keepfromedge;
      var lowest_y_inview = scrollpos.y + this.options.keepfromedge;
      var highest_x_inview = viewportsize.x + scrollpos.x - this.options.keepfromedge;
      var highest_y_inview = viewportsize.y + scrollpos.y - this.options.keepfromedge;

      if (xpos > highest_x_inview)
        xpos = highest_x_inview - menusize.x;

      if (xpos < lowest_x_inview)
        xpos = lowest_x_inview;

      if (ypos + menusize.y > highest_y_inview)
        ypos = highest_y_inview - menusize.y;

      if (ypos < lowest_y_inview)
        ypos = lowest_y_inview;

      var maxheight = viewportsize.y - this.options.keepfromedge * 2;
      var height = menusize.y > maxheight ? maxheight: menusize.y;

      this.container.setStyles({position: "absolute", top: ypos, left: xpos});

      if (this.scroller)
      {
        console.log("Copying width & height from menu <ul> to wh-scrollableview container. ("+menusize.x+"x"+height+")");
        this.container.setStyles({ width: menusize.x, height: height });
        this.scroller.refresh();
      }
    }

    this.orientation = this.options.orientation;

    // For detecting hover over menu items
    // By using mousemove we can use event delegation and won't have the problem
    // of mouseenter's being triggered while keyboard navigation makes the menu scroll.
    //this.el.addEvent("mousemove", this.onMouseMove);

    /*
    !! we don't want mouseenter anyway, because a scroll of the menu element in the page
       can also trigger mouseenter. Do relay on mousemove.
    */
    if (this.el.tagName == "UL")
      this.el.addEvent("mousemove", this.onMouseMove);

    this.el.getElements("ul").addEvent("mousemove", this.onMouseMove);

    this.el.addEvents({"mousedown:relay(li)": this.onMouseDownOnItem
                      ,"mousedown":           this.onMouseDown
                      });

    this.keyboard = new Keyboard({ events: { 'esc'  : this.onKeyEsc
                                           , 'enter': this.onKeyEnter
                                           , 'up'   : this.onKeyUp
                                           , 'down' : this.onKeyDown
                                           , 'left' : this.onKeyLeft
                                           , 'right': this.onKeyRight

                                           , "home":      this.onKeyHome
                                           , "end":       this.onKeyEnd
                                           , "meta+up":   this.onKeyHome
                                           , "meta+down": this.onKeyEnd
                                           }
                                 });

    this.orientation = this.determineListItemOrientation(this.el);

    if (this.options.debug)
      console.log(this.orientation);

    this.prepareMenuForOpen(el,this.options.preselected);

    this.open = true;
  }


, wrapInScrollableView: function(node)
  {
    if (this.options.debug)
      console.log("[wh.menu] - Now wrapping", node, "in a scrollableView");

    var container = new Element('div',{'class':'wh-scrollableview wh-menu'});
    var scrollbar = new Element('div',{'class':'wh-scroller-vertical'});
    node.addClass('wh-scrollableview-content');

    container.adopt(scrollbar, node);

    node.scroller = new $wh.ScrollableView( container
                                          , { horizontal:       false
                                            , vertical:         true
                                            , keepscrollevents: true
                                            , duration:         100
                                            });
    this.scroller = node.scroller;

    return container;
  }

, isOpen: function()
  {
    console.log("This menu " + (this.isopen ? "is open" : "is closed"));
    return this.open;
  }

, closeMenu:function(target, itemselected)
  {
    //this.open = false;

    if (this.options.debug)
      console.log("[wh.menu] closeMenu", target, itemselected), console.trace();

    this.keyboard.deactivate(); // FIXME: or relinquish??
    this.cleanupMenu(target);
    this.fireEvent("menuclose", itemselected ? target : null);
  }

  /** @short get the topmost node of the menu (this is either the scrollable view node or the element given as menu to our class)
  */
, getContainer: function()
  {
    return this.container;
  }

, refresh: function()
  {
    if (this.scroller)
    {
      this.scroller.refresh();

      if (this.options.preselected)
        this.scrollToItemNode(this.options.preselected);
    }
  }

, haveSelection: function()
  {
    return !!this.currentelement;
  }

, selectFirst: function()
  {
    var items = this.currentelement ? this.getSelectableSiblingItems(this.currentelement) : this.getSelectableItems();

    if (items.length == 0)
      return;

    this.currentelement = items[0];
    this.ensureMenuOpen(items[0]);
    this.scrollToItem(items, 0, false);
  }

, selectLast: function()
  {
    var items = this.currentelement ? this.getSelectableSiblingItems(this.currentelement) : this.getSelectableItems();

    if (items.length == 0)
      return;

    var idx = items.length-1;
    this.currentelement = items[idx];
    this.ensureMenuOpen(items[idx]);
    this.scrollToItem(items, idx, true);
  }

, selectPrevious: function(node)
  {
    var items = this.currentelement ? this.getSelectableSiblingItems(this.currentelement) : this.getSelectableItems();
    var selectedItem = this.getSelectedFromItems(items);
    var selectableitems_idx = 0;

    if (!selectedItem)
    {
      var select = items[items.length-1];
      this.currentelement = select;
      this.ensureMenuOpen(select);
    }
    else
    {
      selectableitems_idx = items.indexOf(selectedItem);

      if (selectableitems_idx == 0) // don't do anything if we already are at the first selectable item
        return;

      selectableitems_idx--;
      var newitem = items[selectableitems_idx];
      this.currentelement = newitem;
      this.ensureMenuOpen(newitem);
    }

    this.scrollToItem(items, selectableitems_idx, false);
  }

, selectNext: function()
  {
    var items = this.currentelement ? this.getSelectableSiblingItems(this.currentelement) : this.getSelectableItems();
    var selectedItem = this.currentelement;
    var selectableitems_idx = 0;

    if (!selectedItem)
    {
      if (items.length == 0)
        return;

      var select = items[0];
      this.currentelement = select;
      this.ensureMenuOpen(select);
    }
    else
    {
      selectableitems_idx = items.indexOf(selectedItem);

      // don't do anything if we already are at the last selectable item
      if (selectableitems_idx == items.length - 1)
        return;

      selectableitems_idx++;
      var newitem = items[selectableitems_idx];
      this.currentelement = newitem;
      this.ensureMenuOpen(newitem);
    }

    this.scrollToItem(items, selectableitems_idx, true);
  }

  // go a level up
, deactivateSubMenu: function()
  {
    this.currentelement = this.virtualnodetree[this.virtualnodetree.length - 2];
    this.ensureMenuOpen(this.virtualnodetree[this.virtualnodetree.length - 2]);
  }

  // go deeper
, activateSubMenu: function()
  {
    if (this.options.debug)
      console.info("activateSubMenu", this.currentelement);

    if(!this.currentelement || !this.currentelement.hasClass('wh-menu-hassubmenu') && !this.currentelement.hasClass('-wh-menu-hassubmenu'))
    {
      console.log("No submenu");
      return;
    }

    var firstsubitem = this.getSelectableItems(this.currentelement.childwrapper)[0];
    this.currentelement = firstsubitem;
    this.ensureMenuOpen(firstsubitem);
  }

, destroy:function()
  {
    this.cleanupMenu();

    if (this.el.tagName == "UL")
      this.el.removeEvent("mousemove", this.onMouseMove);

    this.el.getElements("ul").removeEvent("mousemove", this.onMouseMove);

    /*
    // We cannot rely on rely for mouseenter/mouseleave events, because they don't bubble
    this.el.getElements("li").removeEvents({"mouseenter": this.doItemEnter
                                           ,"mouseleave": this.doItemLeave
                                           });
    */

    this.el.removeEvents({"mousedown:relay(li)": this.onMouseDownOnItem
                         ,"mousedown": this.onMouseDown
                         });

    for(var mykey in this.keyboard.options.events)
      this.keyboard.removeEvent(mykey,this.keyboard.options.events[mykey])

    //FIXME: shouldn't we deactivate() too? or how do we destroy a keyboard handler?
    //this.keyboard.deactivate();

    if (this.container != this.el && !$wh.debug.meo)
    {
      // seperately move the menu and container outside the document
      // (the menu might be reused and in the mean time the container div's can be garbage collected)
      this.el.parentNode.removeChild(this.el);
      this.container.destroy();
    }
  }

  //take 'focus'. we leave the cursor alone, but still try to capture mouse etc events
, takeSemiFocus:function()
  {
    if (this.options.debug)
      console.log('[wh.menu] takeSemiFocus');

    this.keyboard.activate();

    if(window.addEventListener)
    {
      window.addEventListener("mousedown", this.onGlobalMouseDown, true); //capture
      this.el.addEventListener("click", this.onMenuClick, true); //capture
    }
    else if(Browser.ie)
    {
      //we'll use the proprietary mouse capture API to implement menu close on click
      this.el.setCapture(false); //false: Events originating in a container are not captured by the container
      this.mousecapture=true;
    }

    this.tookfocus=true;
  }

, releaseSemiFocus: function()
  {
    if (this.options.debug)
      console.log('[wh.menu] releaseSemiFocus');

    if(window.removeEventListener)
    {
      window.removeEventListener("mousedown", this.onGlobalMouseDown, true); // capture
      this.el.removeEventListener("click", this.onMenuClick, true); //capture
    }
    else if(this.mousecapture)
    {
      console.log("[wh.menu] releasing capture.");

      this.el.releaseCapture();
      this.mousecapture=false;
    }

    this.tookfocus=false;
  }



  /**********************************************************************************
  *
  *  Internals
  *
  */

, getVisibleSiblingItems: function()
  {
    return node.getParent('ul').getElements('>li:not(.wh-menu-divider,.wh-menu-hidden)');
  }

, getSelectableSiblingItems: function(node)
  {
    if (!node)
    {
      console.error("getSelectableSiblingItems got node null");
      //console.trace();
      return;
    }
    return node.getParent('ul').getElements('>li:not(.wh-menu-divider,.wh-menu-disabled,.wh-menu-hidden)');
  }

, getSelectableItems: function(node)
  {
    if (!node)
      node = this.el;
    if (node.tagName != "UL")
    {
      console.error("Not an UL", node);
      node = node.getElement("ul");
    }
    return node.getElements('>li:not(.wh-menu-divider,.wh-menu-disabled,.wh-menu-hidden)');
  }

, getSelectedFromItems: function(items)
  {
    var selected = null;

    for (var idx = 0; idx < items.length; idx++)
    {
      if (items[idx].hasClass("wh-menu-hidden"))
        continue;

      if (items[idx].hasClass("wh-menu-selected"))
        return items[idx];

      if (items[idx].hasClass("wh-menu-active"))
        selected = items[idx];
    }

    return null;
  }

  /** @short scroll an item from the first menu level into view
  */
, scrollToItemNode: function(node)
  {
    //var items = this.getVisibleSiblingItems(node);
    //var itemidx = items.indexOf(node);
    var itemnode_posy = node.getPosition(node.getParent()).y;
    this.scroller.setScroll({x:0,y:itemnode_posy},false);
    //this.scrollToItem(items, itemidx, true, true);
  }

, scrollToItem: function(items, selecteditemidx, forward) // FIXME: forwards can be detected?
  {
    if (this.options.debug)
      console.log(selecteditemidx, forward);

    if (selecteditemidx == -1 || !this.scroller)
      return;

    var itemnode = items[selecteditemidx];

    var current_scroll = this.scroller.getScroll();

    var itemnode_posy = itemnode.getPosition(itemnode.getParent()).y;

    if (forward && selecteditemidx <= items.length-1)
    {
      if (selecteditemidx == items.length-1)
      {
        var menuheight = this.getContainer().getSize().y;
        var contentheight = this.el.getSize().y;
        this.scroller.setScroll({ x: 0, y: contentheight - menuheight }, true);
        return;
      }

      var itembelownode = items[selecteditemidx + 1]
      var itemnode_below_posy = itembelownode.getPosition(itemnode.getParent()).y;
      var itemnode_below_bottom = itemnode_below_posy + itembelownode.getSize().y;

      var menuheight = this.getContainer().getSize().y;

      if (current_scroll.y < itemnode_below_bottom - menuheight)
      {
        //console.log("next item is obscured");
        this.scroller.setScroll({ x: 0, y: itemnode_below_bottom - menuheight }, true);
        return;
      }

    }
    else if (!forward && selecteditemidx >= 0)
    {
      if (selecteditemidx == 0)
      {
        this.scroller.setScroll({x:0,y:0}, false);
        return;
      }

      var itemnode_above_posy = items[selecteditemidx - 1].getPosition(itemnode.getParent()).y;

      if (current_scroll.y > itemnode_above_posy)
      {
        //scroll_y = itemnode_above_posy;
        this.scroller.setScroll({x:0,y:itemnode_above_posy}, true);
        return;
      }
    }

    if (this.options.debug)
      console.log("No need to scroll, item is in view.");
    // the selection is still in view
  }

, determineListItemOrientation: function(containernode)
  {
//console.log("determineListItemOrientation", containernode);
    var activemenuitems = this.getSelectableItems(containernode);

    if(activemenuitems.length < 2)
      return "vertical";

    var xy1 = activemenuitems[0].getPosition();
    var xy2 = activemenuitems[1].getPosition();
    var dx = Math.abs(xy1.x - xy2.x);
    var dy = Math.abs(xy1.y - xy2.y);

    var orientation = dx > dy ? 'horizontal' : 'vertical';

    /*
    if (this.options.debug)
    {
      console.group("Determining orientation of menu");
      console.log(activemenuitems[0], xy1);
      console.log(activemenuitems[1], xy2);
      console.log(dx, dy, this.orientation);
      console.groupEnd();
    }
    */

    return orientation;
  }

  //make sure this menu is marked as 'selected', and only menus between us and our toplevel are
, ensureMenuOpen:function(menu)
  {
    if (this.options.debug)
      console.log("[wh.menu] ensureMenuOpen", menu);

    var mustbeopen = [menu];
    for (var curnode = menu; curnode && curnode != this.el; curnode=curnode.parentNode)
    {
      if(curnode.nodeName != 'LI')
        continue;

      var submenu;

      if(!curnode.hasClass("wh-menu-selected") )
      {
        submenu = curnode.getElement('ul');
        if(submenu)
          this.prepareMenuForOpen(submenu);
      }

      var isactive = curnode.hasClass("wh-menu-selected");

      curnode.addClass("wh-menu-selected");

      if(curnode != menu)
        mustbeopen.push(curnode);

      //cleanup nodetree before adding node
      this.cleanupNodeTree(curnode);

      if(!this.virtualnodetree.contains(curnode))
      {
/*
console.log(curnode, curnode.getSelfOrParent("ul"));
        if(window.addEventListener)
          curnode.getSelfOrParent('ul').addEventListener("click", this.onMenuClick, true);
        else if(Browser.ie)
          curnode.getSelfOrParent('ul').setCapture(false);
*/
        this.virtualnodetree.push(curnode);
        this.currentelement = curnode; // keep the last know selection level as currentelement (for navigation purposes)
      }

      //if (this.orientation == "") // No orientation specified?
      this.orientation = this.determineListItemOrientation(curnode.getParent());

      if (submenu && !isactive)
        this.setupSubMenu(menu, submenu, curnode);
    }
  }

, setupSubMenu: function(parentmenu, submenu, curnode)
  {
    if (this.options.debug)
      console.log("$wh.setupSubMenu", submenu);

    if (submenu.scroller)
      submenu.scroller.scrollTo(0,0,false);

    submenu.getParent().setStyle('margin',null);//reset margins
    var menupos = parentmenu.getPosition();
    var submenuinfo = submenu.measure(function() { return { size: this.getSize(), pos: this.getPosition() }});
    var winsize     = $(window).getSize();

    var direction = {'x' : '', 'y' : ''}
    if(menupos.y < submenuinfo.pos.y)
    { //submenu under selected menu item
      direction.y = 'bottom';
    }
    else if(menupos.y > submenuinfo.pos.y)
    { //submenu above selected menu item
      direction.y = 'top';
    }

    if(menupos.x < submenuinfo.pos.x)
    { //submenu right of selected menu item
      direction.x = 'right';
    }
    else if(menupos.x > submenuinfo.pos.x)
    { //submenu left of selected menu item
      direction.x = 'left';
    }

    // put menu item outside current DOM structure to escape overflow container
    // and allow independant positioning
    var wrapper;
    if(!submenu.hasClass('wh-menu-detached'))
    {
      if (this.options.debug)
        console.log("[wh.menu] - Now detaching", submenu, "from", parentmenu);

      if (this.options.scrollable)
        wrapper = this.wrapInScrollableView(submenu);
      else
        wrapper = submenu;

      curnode.childwrapper = wrapper;

      curnode.addClass('-wh-menu-detachedchild').addClass('wh-menu-detachedchild');
      wrapper.addClass('-wh-menu-detached').addClass('wh-menu-detached');
      wrapper.setStyles({'left':submenuinfo.pos.x+'px','top':submenuinfo.pos.y+'px','position':'absolute'});
//      wrapper.inject($(document.body));

      wrapper.addEvent("mousedown:relay(li)", this.onMouseDownOnItem);

      $(document.body).adopt(wrapper);
    }
    else
      wrapper = curnode.childwrapper;


    // ADDME: keepinviewport

    var height = submenuinfo.size.y;
    //if submenu get outside window, resize the scroll container (=parentnode)
    var dy = this.options.keepfromedge;
    if(direction.y == 'top')
    {
      dy = submenuinfo.pos.y;
      if(dy < this.options.keepfromedge)
        height+=dy;
    }
    else
    {
      dy = winsize.y - (submenuinfo.size.y + submenuinfo.pos.y);
      if(dy < this.options.keepfromedge)
        height+=dy;
    }

    var dx = this.options.keepfromedge;
    if(direction.x == 'right')
    {
      dx = winsize.x - (submenuinfo.size.x + submenuinfo.pos.x);
      if(dx < this.options.keepfromedge)
        submenu.getParent().setStyle('margin-left',dx+'px');
    }
    else if(direction.x == 'left')
    {
      dx = submenuinfo.pos.x;
      if(dx < this.options.keepfromedge)
        submenu.getParent().setStyle('margin-left',Math.abs(dx)+'px');
    }


    if (submenu.scroller)
    {
      console.log("Submenu.scroller", submenu.scroller);
      submenu.getParent().setStyles({'width': submenuinfo.size.x, 'height': submenuinfo.size.y});
      submenu.scroller.refresh();
    }
  }


, restoreDomPosition: function(node)
  {
    if (this.options.debug)
      console.log('[wh.menu] restoreDomPosition',node);

    node.removeClass('-wh-menu-selected');
    node.removeClass('-wh-menu-hover');
    node.removeClass('wh-menu-selected');
    node.removeClass('wh-menu-hover');

/*
    if(this.mousecapture)
    {
      node.getParent().releaseCapture();
    }
    else if(window.removeEventListener)
    {
      node.getParent().removeEventListener("click", this.onMenuClick, true); //capture
    }
*/
    if(node.childwrapper)
    {
      node.removeClass('-wh-menu-detachedchild');
      node.removeClass('wh-menu-detachedchild');
      node.removeEvent("mousedown:relay(li)", this.onMouseDownOnItem);
      node.childwrapper.removeClass('-wh-menu-detached');
      node.childwrapper.removeClass('wh-menu-detached');
      node.childwrapper.setStyles({'left':null,'top':null,'position':null});//reset overuling styles
      node.adopt(node.childwrapper);//set back in original position in DOM
    }
  }

, cleanupNodeTree: function(curnode)
  {
    //cleanup nodetree
    var myparent = curnode.getParent();
    var treelen = this.virtualnodetree.length;
    for(var c = treelen - 1; c >= 0 ; c--)
    {
      if(myparent == this.virtualnodetree[c].getParent()) //has same parent so remove node including above nodes from tree
      {
        for(var r = treelen - 1; r >= c && r >= 0; r--)
        {
          if(curnode!=this.virtualnodetree[r])
          {
            this.restoreDomPosition(this.virtualnodetree[r]);
            this.virtualnodetree.splice(r,1);
          }
        }
        break;
      }
    }
  }

, autoCloseMenu:function()
  {
    this.closetimer = null;
//console.log("[wh.menu] autoCloseMenu");
    this.closeMenu();
  }

, cleanupMenu:function(target)
  {
    if (this.options.debug)
      console.log('[wh.menu] cleanupMenu');

    this.releaseSemiFocus();

    target = target ? target.getSelfOrParent("li") : null;
    var curmenu = target ? target.getParent("ul") : null;
    var keep_hover = this.options.alwaysvisible && curmenu == this.el;

    for(var c=0; c < this.virtualnodetree.length; c++)
      this.restoreDomPosition(this.virtualnodetree[c]);

    this.virtualnodetree = [];

    this.el.getElements('.-wh-menu-hover, .-wh-menu-selected, .wh-menu-hover, .wh-menu-selected').each(function(node)
    {
      node.removeClass('-wh-menu-selected');
      node.removeClass('wh-menu-selected');
      if (!keep_hover || node != target)
        node.removeClass('-wh-menu-hover').removeClass('wh-menu-hover');
    });
  }

, prepareMenuForOpen:function(submenu, preselectnode)
  {
//console.log('[wh.menu] prepareMenuForOpen');
    var lastdivider=null;
    var anyitem=false;
    $(submenu).getChildren('li').each(function(item)
    {
      if(item.getElements('ul').length)
        item.addClass('-wh-menu-hassubmenu').addClass('wh-menu-hassubmenu');

      if(item.hasClass('-wh-menu-divider') || item.hasClass('wh-menu-divider'))
      {
        item.addClass('-wh-menu-hidden').addClass('wh-menu-hidden');
        lastdivider = item;
      }
      else if(!item.hasClass('-wh-menu-hidden') && !item.hasClass('wh-menu-hidden'))
      {
        if(!anyitem)
        {
          anyitem=true;
        }
        else if(lastdivider)
        {
          lastdivider.removeClass('-wh-menu-hidden').removeClass('wh-menu-hidden');
          lastdivider=null;
        }
      }
      if (item == preselectnode)
      {
        item.addClass("-wh-menu-selected").addClass("-wh-menu-active");
        item.addClass("wh-menu-selected").addClass("wh-menu-active");
        this.virtualnodetree.push(item);
        this.currentelement = item; // keep the last know selection level as currentelement (for navigation purposes)
      }
      else
      {
        item.removeClass("-wh-menu-selected").removeClass("-wh-menu-active");
        item.removeClass("wh-menu-selected").removeClass("wh-menu-active");
      }
    }, this);
  }



  /**********************************************************************************
  *
  *  Mouse navigation
  *
  */

, onMouseMove: function(event)
  {
    /*
    event.client.x // viewport
    event.page.x   // page
    */
    var item = event.target.getSelfOrParent("li");
    if (item == this.currentelement)
      return;

    if (this.currentelement)
      this.doItemLeave({ target: this.currentelement });

    if (item)
      this.doItemEnter({ target: item });

    this.currentelement = item;
  }

, doItemEnter:function(event)
  {
    var target = event.target;
    if(target.hasClass("-wh-menu-disabled") || target.hasClass("-wh-menu-divider") || target.hasClass("wh-menu-disabled") || target.hasClass("wh-menu-divider"))
      return;

    //console.log('[wh.menu] doItemEnter');

    target.addClass("-wh-menu-hover");
    target.addClass("wh-menu-hover");
    if(this.tookfocus || this.options.openonhover)
    {
      //if we're the focus target, moving around menus should immediately open them
      this.ensureMenuOpen(target);
    }

    //this.currentelement = target;

    if(this.closetimer)
    {
      clearTimeout(this.closetimer);
      this.closetimer = null;
    }
  }

, doItemLeave:function(event)
  {
    var target = event.target;

    //this.currentelement = null;

    if(this.options.hoverclosetimeout && !this.tookfocus)
    {
      this.closetimer = this.autoCloseMenu.bind(this).delay(this.options.hoverclosetimeout);
    }
//console.log("[wh.menu] doItemLeave");
    target.removeClass("-wh-menu-hover");
    target.removeClass("wh-menu-hover");
    if(!this.tookfocus)
      target.removeClass('-wh-menu-selected').removeClass('wh-menu-selected');

  }

, onMouseDownOnItem:function(event,target)
  {
    if(event.rightClick || $(event.target).getSelfOrParent('a'))
      return; //fallthrough. let A's in website menus work

    event.preventDefault(); //avoid focus theft

    if(!this.tookfocus)
      this.takeSemiFocus();

    if(target.getElement('ul')) //has a submenu
      this.ensureMenuOpen(target);
    else
      this.closeMenu(event.target, true);
  }

// for IE < 9
// FIXME: does this still work with detached menu's?
, onMouseDown:function(event)
  {
    if(!this.mousecapture || event.rightClick)
      return true;

    if(this.el.contains(event.target))
    {
      var item = $(event.target).getSelfOrParent('li');
      return this.onSelectItem(event, item);
    }
    else
    {
      this.closeMenu(event.target);
    }
  }

, onGlobalMouseDown:function(event)
  {
    event = new DOMEvent(event);
    if(event.rightClick)
      return true;

    for(var idx = 0; idx < this.options.autoclose_ignorenodes.length; idx++)
    {
      if (this.options.autoclose_ignorenodes[idx].contains(event.target))
        return true;
    }

    //is event.target inside el or scrollbar? if the event target is a scroller, check if it has the same parent as our menu node
    var scrollermousedown = event.target.hasClass("wh-scroller-vertical") || event.target.hasClass("-wh-scroller-vertical");
    for(var findparent = event.target;findparent;findparent=findparent.parentNode)
      if(findparent==this.el || this.virtualnodetree.contains(findparent) || (scrollermousedown && findparent==this.el.parentNode))
        return true; //event is targeted at the menu. let it continue

    if (this.options.debug)
      console.log("[wh.menu] onGlobalMouseDown requesting closeMenu");

    this.closeMenu(event.target);
    return true; //don't block the event
  }

, onMenuClick:function(event)
  {
    event = new DOMEvent(event);
    var item = $(event.target).getSelfOrParent('li');
    return this.onSelectItem(event, item);
  }

, onSelectItem: function(event, item)
  {
    // an item with a submenu has no click action
    if(item && item.hasClass('-wh-menu-hassubmenu') && item.hasClass('wh-menu-hassubmenu'))
    {
      event.stop();
      if(!this.tookfocus)
        this.takeSemiFocus();

      return false;
    }

    this.closeMenu(item, true);
    return true; //don't block the event
  }



  /**********************************************************************************
  *
  *  Keyboard navigation
  *
  */

, onKeyEsc: function(event)
  {
    Keyboard.stop(event);
    event.stop();

    //console.log("[wh.menu] onKeyEsc");

    this.closeMenu(this.el);
  }

, onKeyUp: function(event)
  {
    if (this.options.debug)
      console.log("[wh.menu] onKeyUp");

    console.log(this.orientation);

    Keyboard.stop(event);
    event.stop();

    if(this.orientation == 'vertical')
    {
      this.selectPrevious();
    }
    else if(this.virtualnodetree.length > 1)
    {
      this.ensureMenuOpen(this.virtualnodetree[this.virtualnodetree.length - 2]);
    }
  }

, onKeyDown: function(event)
  {
    if (this.options.debug)
      console.log("[wh.menu] onKeyDown");

    Keyboard.stop(event);
    event.stop();

    if(this.orientation == 'vertical')
      this.selectNext();
    else
      this.activateSubMenu();
  }

, onKeyLeft: function(event)
  {
    if (this.options.debug)
      console.log("[wh.menu] onKeyLeft");

    Keyboard.stop(event);
    event.stop();

    if(this.orientation == 'horizontal')
      this.selectPrevious();
    else if(this.virtualnodetree.length > 1)
      this.deactivateSubMenu();
    // ADDME: if no active submenu browse through the menu 1 level higher
  }

, onKeyRight: function(event)
  {
    if (this.options.debug)
      console.log("[wh.menu] onKeyRight");

    Keyboard.stop(event);
    event.stop();

    if(this.orientation == 'horizontal')
      this.selectNext();
    else
      this.activateSubMenu();
    // ADDME: if no active submenu browse through the menu 1 level higher
  }

, onKeyHome: function(event)
  {
    event.stop();
    this.selectFirst();
  }

, onKeyEnd: function(event)
  {
    event.stop();
    this.selectLast();
  }

, onKeyEnter: function(event)
  {
    if (this.options.debug)
      console.log("[wh.menu] onKeyEnter");

    Keyboard.stop(event);
    event.stop;

    var item = this.currentelement;
    if(!item)
    {
      if (this.options.debug)
        console.log("No item selected in $wh.Menu");

      return false;
    }

    if(item && item.getElement('ul')) //contains a submenu
    {
      if(!this.tookfocus)
        this.takeSemiFocus();

      return false;
    }

    this.el.getElements('li').removeClass('-wh-menu-active').removeClass('wh-menu-active');
    item.addClass('-wh-menu-active');
    item.addClass('wh-menu-active');

    this.closeMenu(item, true);
    return true;
  }

})

})(document.id); //end mootools wrapper
