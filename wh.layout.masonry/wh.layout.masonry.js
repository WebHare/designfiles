/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.ui.base');
/*! REQUIRE: frameworks.mootools.core, wh.compat.base
    REQUIRE: wh.ui.base
!*/

/*

NOTE: wh.layout.masonry assumes box-sizing: border-box is used;
      (for checking and setting of height's)

Usage through DOM:

    <div class="wh-masonry" data-masonry='{"cols":3}'>...</div>

    <div class="wh-masonry" data-masonry='{"cols":3,"equalizeheight":true}'>...</div>

Usage through JS:

    ADDME


Options to handle resizing content:

    - Use $wh.fireLayoutChangeEvent(node, "up") after code which changed the DOM in masonry items.
      node must be either the masonry item's node or a node within.

    - Set option 'resizelistener' to true
      This should make the masonry autodetect size changes.


    FIXME: have some helper library detect loading of images and custom fonts to fire resize events?
           CSS Font Loading API should be implemented in Firefox 35)
           Also see:
           https://dev.opera.com/articles/better-font-face/
           http://dev.w3.org/csswg/css-font-loading/


'Advanced usage'

    - Reorder items without changing the DOM order
      (to allow smooth animations).
      The best way is to pass your own array of nodes in the 'items' option, in the order you want to use the items.

Misc notes:

    - nesting of masonry within a masonry item is possibe.
      Warning: Handling of resize detection methods with nested masonries is not tested though.

    - used for WIG, DWP, PTHU2 (and WMT?)

        - what about nesting (masonry within masonry)
             A) only pick up first level elements? or at least not wh-masonry-item within a wh-masonry-item
             B)

ADDME: refresh should not change column position.... have a relayout() function for that

ADDME: performance tweaks
       - make wh.layout.masonry detect there have been no changes??
         or detect onresize, but see it's size hasn't changed so until someone calls .refresh or fireEvent("wh-refresh") no relayout is done?
       - culling? (optionally hide blocks which are out of view to improve performance)

ADDME: a 'clear / nextline' trigger?
       <div class="widget" data-clear>...</div>
*/

(function($) { //mootools wrapper

if(!window.$wh) window.$wh={};



$wh.Masonry = new Class(
{ //Implements: [ Options ] //, Events ]
  options:
      { columns:            3
      , columnwidth:        0     // if not set the width will be set so the amount of columns will fill up the horizontal space

      // gutter size
      // gutter:            10 // shorthand for gutter_x and gutter_y
      , gutter_x:           10
      , gutter_y:           10

      , debug:              false

      // CSS query (for example '.masonry-item' or array of nodes
      // Pass an array of nodes if you want control over the order visual order of the items (without reordering the dom)
      , items:              null

      // ADDME: lockheight   (will only recalculate heights when the width of a column changed)

      , equalizeheight:     false
      , equalizenodequery:  "" // This is the CSS query to get the element to stretch within each item.
                               // If kept empty ("") or no element was found using the query, the item's container itself is stretched.

      , listentoevents:     true // listen to load and resize events and resize/relayout the masonry if needed (for performance it's better to fully control refreshes yourself)
      , resizelistener:     false
      //, letbrowserreflow:   false // (ADDME: invent this. but how?) if set, we don't use absolute positioning. downside -> cannot animate to new position, upside -> no issues when content in the masonry

      // specify a class to ignore in layouting
      // (can be used for items which you transition to hide/fade)
      , ignoreclass:        "hide"

      //, layoutmode:         "masonry"/"equalheight"/"mixed"

      //, fill_last_strip:    false
      //, fill_last_strip_threshold: 40
      , righttoleft:        false // FIXME: keep or remove this option?
      }

, container:     null

, __height:              0
, __columnwidth:         0    // (also used to detect whether widget width style has to be set)
, __itemdata:            []   // render data
, __visiblewidgetscount: 0
, __singlerow:           true
, __columncontainers:    []

, __items_dirty:         true

//, gridcontainer: null
//, items:         []

// vars for auto update in case image dimensions have to be determines and updated on the fly
//, newinforefreshtimer: null
//, waitingforimagecount: 0


, initialize: function(container, options)
  {
    this.setOptions(options);
    //this.gridcontainer = new Element("div", { styles: { position: "relative" } });
    this.container = $(container);

    // listen to wh components within our masonry for layout updates
    this.container.addClass("wh-layoutlistener");
    this.container.addEvent("wh-layoutchange", this.onLayoutChange.bind(this, container) );

    this.refresh();
  }

, setOptions: function(options)
  {
    if ("gutter" in options)
    {
      options.gutter_x = options.gutter;
      options.gutter_y = options.gutter;
      delete options.gutter;
    }

    if ("items" in options)
      this.__items_dirty = true; // need to recheck all widgets, there might be new ones

    //this.parent(options);
    Object.merge(this.options, options);
  }

  /** @short full relayout
      @long find all items, detect width, read data-cols attributes on items and relayout
  */
, refresh: function(elem)
  {
    if (this.options.debug)
    {
      console.log("$wh.Masonry.refresh()");
      console.trace();
    }

    var clientwidth = this.container.clientWidth;
    if (clientwidth == 0)
    {
      console.warn("Cannot determine size of mansonry container (got 0).", this.container);
      return;
    }

    this.ignore_resize_events = true;

    var paddings = this.container.getStyles([ "padding-left", "padding-right" ]);
    this.__leftoffset = parseFloat(paddings["padding-left"]);
    this.__containerwidth = clientwidth - this.__leftoffset - parseFloat(paddings["padding-right"]); // FIXME: for box-sizing: border-box the padding won't decreate the clientWidth, so whe'll draw over paddings

    var widgets;
    if (!this.options.items)
      widgets = this.container.getElements(".wh-masonry-item");
    else if (typeOf(this.options.items) == "string")
      widgets = this.container.getElements(this.options.items);
    else
      widgets = this.options.items;

    if (this.options.equalizeheight)
      this.pvt_relayoutEqualHeight(widgets);
    else
      this.pvt_relayout(widgets);

    this.ignore_resize_events = false;

    if(this.options.resizelistener)
    {
      //  var debounced_refresh = this.refresh.bind(this).debounce(100);

      // detect resize of each item
      for (var idx = 0; idx < widgets.length; idx++)
      {
        var widget = widgets[idx];
        if (!widget.rlsetup)
        {
          $wh.enableResizeEvents(widget);
//        widget.addEvent("wh-resized", debounced_refresh); //this.refresh.bind(this));
          widget.addEvent("wh-resized", this.refreshThroughResizeListener.bind(this, widget)); //this.refresh.bind(this));
          widget.rlsetup = true;
        }
      }
    }
  }

  /** @short only update heights and position
             New items and changed widths aren't detected
  */
, refreshHeights: function(elem)
  {
    if (this.options.equalizeheight)
      this.pvt_relayoutEqualHeight(null, true);
    else
      this.pvt_relayout(null, true);
  }

, getLastRenderInfo: function()
  {
    return { container:           this.container
           , visiblewidgetscount: this.__visiblewidgetscount
           , width:               this.__containerwidth
           , height:              this.__height
           , items:               this.__itemdata
           , singlerow:           this.__singlerow
           };
  }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Private functions
//

//, __padding: 0
, __leftoffset:     0
, __containerwidth: 0

, __widgetrecs:     []
, ignore_resize_events: false

  // update through on of our components using $wh.fireLayoutChangeEvent
, onLayoutChange: function(elem)
  {
    //console.log("event for", elem);

    // regardless of the direction we will also receive the event on the element it's fired on
    if (elem == this.container)
    {
//  console.log("ignore");
      return;
    }

    this.refreshHeights();
  }

  // update detected through an resize listener (currently an iframe object with resize event)
  // only used when the resizelistener option is set to true
, refreshThroughResizeListener: function(elem)
  {
    if (this.ignore_resize_events)
    {
      console.log("** ignore resize events");
      return;
    }

    this.ignore_resize_events = true;

    var widget = this.__widgetrecs.getByProperty("node", elem);
    //console.log(widget.height, elem.clientHeight);
    if (widget.height == elem.clientHeight)
    {
      console.log("ignoring resize event.");
      return;
    }

    //console.log(widget);

    this.refresh();
  }

, pvt_relayout: function(widgets, no_new_widgets)
  {
    if (this.options.debug)
      console.group("$wh.Masonry.refresh()");

    var visiblewidgetscount = 0;

    var columnwidth = this.options.columnwidth;
    if (!columnwidth)
      columnwidth = (this.__containerwidth - (this.options.columns-1) * this.options.gutter_x) / this.options.columns;

    var columncount = this.options.columns;
    var singlerow = true; // until we have to place a new widget below another one all widgets are still on a single row

    var columns = []; // the last Y position in use per column
    for (var xcol = 0; xcol < columncount; xcol++)
      columns.push(0);

    /*
    console.log({ columns:     this.options.columns
                , columnwidth: columnwidth
                });
    */

    var widgetrecs;

    // Only change widget width's when needed
//    if (no_new_widgets !== true || this.__columnwidth != columnwidth)
    if (this.__items_dirty || this.__columnwidth != columnwidth) // new items or width for widgets need to change?
    {
      widgetrecs = [];
      // First apply the new width to all widgets, so we can later determine the correct height
      for (var idx = 0; idx < widgets.length; idx++)
      {
        var widget = widgets[idx];

        var widgetcols = widget.getAttribute("data-cols");
        widgetcols = widgetcols ? parseInt(widgetcols) : 1;

        if (widgetcols > this.options.columns)
          widgetcols = this.options.columns;

        var width = columnwidth * widgetcols + (widgetcols-1) * this.options.gutter_x;

        widget.setStyles(
            { "width":  width
            , "height": "" // clear any inline specified height (we only allow a fixed height if specified in CSS)
            });

        widgetrecs.push(
            { node:   widget
            , width:  width
            , height: null
            , cols:   widgetcols
            });
      }

      /*
      Let our children relayout to match our new width
      (after which layout of masonry item contents should be done, meaning the height is known and we can start to build up the masonry)
      */
      if (this.options.debug)
        console.log("Firing layout change event");

      // Notify any of our components within the Masonry container that layout has changed.
      // After they have updated their layout we know the final height of each widget and can start to layout our Masonry.
      $wh.fireLayoutChangeEvent(this.container, "down");
    }
    else
    {
      widgetrecs = this.__itemdata;
    }



    // measure all widgets in one go to prevent extreneous reflows by mixing writes and reads
    for (var idx = 0; idx < widgetrecs.length; idx++)
      widgetrecs[idx].height = widgetrecs[idx].node.clientHeight;



    for (var idx = 0; idx < widgetrecs.length; idx++)
    {
      var widgetrec = widgetrecs[idx];
      var widget = widgetrec.node;

      var widgetheight = widgetrec.height;

      if (this.options.debug)
        console.log("#"+idx, widgetheight+"px", widget.className);

      if(widgetheight == 0 || (this.options.ignoreclass != "" && widget.hasClass(this.options.ignoreclass)))
        continue;

      visiblewidgetscount++;

      var bestcol = -1, ypos = 0;

    // set increase the last used ypos within the columns the current widget will occupy
      // find the first ypos where the whole block would fit
      if (this.options.debug)
        console.info(columns);

      for (var xcol = 0; xcol <= columncount - widgetrec.cols; ++xcol)
      {
        var col = this.options.righttoleft ? columncount - widgetrec.cols - xcol : xcol;

        var maxypos = Math.max.apply(null, columns.slice(col, col + widgetrec.cols));
        //console.log(col, "has enough room for ", widgetrec.cols, " columns starting at Y pos", maxypos);

        // if we cannot find any column in which we can place the block,
        // move to below where all previous block are
        if (bestcol == -1 || maxypos < ypos)
        {
//          console.log(widgetrec, maxypos, ypos);
          bestcol = col;
          ypos = maxypos;
        }
      }

      //console.log("We select column", bestcol);

      if (columns[bestcol] > 0)
      {
        if (ypos > 0)
          singlerow = false;

        ypos += this.options.gutter_y;
      }

      for (var col = 0; col < widgetrec.cols; ++col)
      {
        var nextypos = ypos + widgetheight;
        columns[bestcol + col] = nextypos;
      }

      widgetrec.col = bestcol;
      widgetrec.left = this.__leftoffset + (bestcol * columnwidth + (bestcol) * this.options.gutter_x);
      widgetrec.top = ypos;

      var styles = { position: "absolute"
                   , left:     widgetrec.left // 300 width, 10 px leftmargin, 20 inter
                   , top:      widgetrec.top  + 'px'
                   //, width:    columnwidth * widgetrec.cols + (widgetrec.cols-1) * this.options.gutter_x
                   };

      if (this.options.debug)
        console.log("Will be placed into col", bestcol);

      widget.setStyles(styles);
    }

    var maxheight = Math.max.apply(null, columns);

    //reorderWidgets(keepcolumnpos);
    if (this.options.columnwidth)
      this.container.style.width = (this.options.columnwidth * this.options.columns + (this.options.columns-1) * this.options.gutter_x) + "px";

    this.container.style.height = maxheight + "px";


    // Now we want our parents to know we have changed in size
    // FIXME: add a check whether we actually changed in size
    if (this.options.debug)
      console.log("Firing layout change event");

    $wh.fireLayoutChangeEvent(this.container, "up");


    if (this.options.debug)
    {
      console.log(this.container, "has", visiblewidgetscount, "visible widgets");
      console.groupEnd();
    }

    /*
    store render information (can be used to add extra behaviour outside this class for example:
    - to equalize heights of widgets by external code or hide a widgets grid
    - to hide a widgets container in case it has no visible widgets
    */
    this.__itemdata = widgetrecs;
    this.__columnwidth = columnwidth;
    this.__height = maxheight;
    this.__visiblewidgetscount = visiblewidgetscount;
    this.__singlerow = singlerow;
  }



, pvt_relayoutEqualHeight: function(widgets, no_new_widgets)
  {
    if (this.options.debug)
      console.group("$wh.Masonry.refresh()");

    var visiblewidgetscount = 0;

    var columnwidth = this.options.columnwidth;
    if (!columnwidth)
      columnwidth = (this.__containerwidth - (this.options.columns-1) * this.options.gutter_x) / this.options.columns;

    var columncount = this.options.columns;

    var widgetrecs;

    // Only change widget width's when needed
    var need_relayout = this.__items_dirty || this.__columnwidth != columnwidth;
    if (need_relayout)
    {
      widgetrecs = [];

      // First apply the new width to all widgets, so we can later determine the correct height
      for (var idx = 0; idx < widgets.length; idx++)
      {
        var widget = widgets[idx];

        var widgetcols = widget.getAttribute("data-cols");
        widgetcols = widgetcols ? parseInt(widgetcols) : 1;

        if (widgetcols > this.options.columns)
          widgetcols = this.options.columns;

        var width = columnwidth * widgetcols + (widgetcols-1) * this.options.gutter_x;

        widget.setStyles(
            { "width":  width
            , "height": "" // clear any inline specified height (we only allow a fixed height if specified in CSS)
            });

        var widgetrec =
            { node:   widget
            , width:  width
            , height: null
            , cols:   widgetcols
            , computed: {} // store .ignore, .colnr, .rownr
            };

        if (this.options.equalizenodequery != "")
        {
          if (!("eqnode" in widgetrecs))
            widgetrec.eqnode = widget.querySelector(this.options.equalizenodequery);

          if (widgetrec.eqnode)
            widgetrec.eqnode.style.height = "auto";
        }

        widgetrecs.push(widgetrec);
      }

      /*
      Let our children relayout to match our new width
      (after which layout of masonry item contents should be done, meaning the height is known and we can start to build up the masonry)
      */
      if (this.options.debug)
        console.log("Firing layout change event");

      // Notify any of our components within the Masonry container that layout has changed.
      // After they have updated their layout we know the final height of each widget and can start to layout our Masonry.
      $wh.fireLayoutChangeEvent(this.container, "down");
    }
    else
    {
      widgetrecs = this.__itemdata;
    }



    // measure all widgets in one go to prevent extreneous reflows by mixing writes and reads
    for (var idx = 0; idx < widgetrecs.length; idx++)
      widgetrecs[idx].height = widgetrecs[idx].node.clientHeight;



    // Determine row and column for each block ---------------------------------

    if (this.options.debug)
      console.log("Determining row and column numbers for each block");

    var colnr = 0;
    var rownr = 0; // for debugging the 'equalizeheight' option
    var rowheights = [];
    rowheights.push(0);

    for (var idx = 0; idx < widgetrecs.length; idx++)
    {
      var widgetrec = widgetrecs[idx];
      var widgetheight = widgetrec.node.clientHeight;

//      console.log(idx + "/" + widgetrecs.length, widgetheight, widgetrec);

      if(widgetheight == 0 || (this.options.ignoreclass != "" && widgetrec.node.hasClass(this.options.ignoreclass)))
      {
        widgetrec.computed.ignore = true;
        continue;
      }

      visiblewidgetscount++;

      // go to the next row if the widget doesn't fit on this row anymore
      var nextcol = colnr + widgetrec.cols;
      if (nextcol > columncount)
      {
        rowheights.push(0);
        colnr = 0;
        rownr++;
      }

      if (widgetheight > rowheights[rownr])
        rowheights[rownr] = widgetheight;

      widgetrec.computed.ignore = false;
      widgetrec.computed.colnr = colnr;
      widgetrec.computed.rownr = rownr;

      if (this.options.debug)
        console.log((colnr+1) + "x" + rownr + " (" + widgetrec.cols + " wide)");

      colnr += widgetrec.cols;
    }

    if (this.options.debug)
      console.log("Row heights:", rowheights);



    // Apply positions to all rows/blocks --------------------------------------

    if (this.options.debug)
      console.log("Applying positions to blocks");

    var ypos = 0;
    var previousrow = 0;
    var computed = { rownr: 0 };
    for (var idx = 0; idx < widgetrecs.length; idx++)
    {
      var widgetrec = widgetrecs[idx];
      if (widgetrec.computed.ignore) // invisible or must be ignored (not repositioned)
        continue;

      computed = widgetrec.computed;

      // if we moved to the next row, add the height of the previous row
      if (computed.rownr > previousrow)
      {
        ypos += rowheights[previousrow] + this.options.gutter_y;
        //console.log(idx, "New start will start at ypos ", ypos);
        previousrow = computed.rownr;
      }

      widgetrec.styles = { position: "absolute"
                         , left:     this.__leftoffset + computed.colnr * columnwidth + computed.colnr * this.options.gutter_x // 300 width, 10 px leftmargin, 20 inter
                         , top:      ypos
                         , height:   rowheights[computed.rownr]
                         };

      if (need_relayout && this.options.equalizenodequery != "" && widgetrec.eqnode)
      {
        console.info("SET to ");
        widgetrec.eqnode.style.height = (rowheights[computed.rownr] - widgetrec.height) + "px";
      }

      /*
      console.group("#"+idx);
      console.log(widgetrec.node);
      console.log( (computed.colnr+1) + "x" + computed.rownr );
      console.log(widgetrec.styles);
      console.groupEnd();
      */

      widgetrec.node.setStyles(widgetrec.styles);
    }

    var totalheight = ypos + rowheights[previousrow];


    this.container.style.height = totalheight + "px";

    // Now we want our parents to know we have changed in size
    // FIXME: add a check whether we actually changed in size
    if (this.options.debug)
      console.log("Firing layout change event");

    $wh.fireLayoutChangeEvent(this.container, "up");


    if (this.options.debug)
    {
      console.log(this.container, "has", visiblewidgetscount, "visible widgets");
      console.groupEnd();
    }

    /*
    store render information (can be used to add extra behaviour outside this class for example:
    - to equalize heights of widgets by external code or hide a widgets grid
    - to hide a widgets container in case it has no visible widgets
    */
    this.__itemdata = widgetrecs;
    this.__columnwidth = columnwidth;
    this.__height = ypos;
    this.__visiblewidgetscount = visiblewidgetscount;

    this.__singlerow = computed.rownr == 0; // check the rownr of the last visible widget
    this.__rows = computed.rownr + 1;
  }
});

/** @short setup a masonry as replaceableComponent
           taking the data-masonry-options and optionally overriding options when
           this function is manually called with options.
*/
$wh.Masonry.setup = function(node, options)
{
  var masonry = node.retrieve("wh-masonry");
  if(masonry) // FIXME: override using the specified options in this case??
    return masonry;

  var optionsjson = node.getAttribute("data-masonry-options");
/*
  if (!optionsjson)
  {
    console.warn("No options specified for wh-masonry.");
    return;
  }
*/
  var opts = optionsjson ? JSON.decode(optionsjson) : {};

  if (options.debug)
  {
    console.log("$wh.Masonry.setup options", options);
    console.log("DOM attribute options", opts);
  }

  if (options)
    Object.append(opts, options);

  if (options.debug)
    console.log("Combined options", opts);


  var masonry = new $wh.Masonry(node, opts);
  node.store("wh-masonry", masonry);

  // FIXME: find a more generic way
//    $(window).addEvent("domready", masonry.refresh.bind(masonry));
  if (options.listentoevents)
  {
    $(window).addEvent("load", masonry.refresh.bind(masonry));
    $(window).addEvent("resize", masonry.refresh.bind(masonry));
  }

  return masonry;
}

// FIXME: moet dit alle per direct replacen?? of alleen als autoreplacecomponents op true staat??
$wh.Masonry.setupAll = function()
{
  $wh.setupReplaceableComponents(".wh-masonry", $wh.Masonry.setup, { mustreplace: true });
}

function initializeMasonries()
{
  console.warn("initializeMasonries() is obsolete. Use $wh.Masonry.setupAll instead.");
}

window.addEvent("domready", function()
{
  $wh.Masonry.setupAll();
});

})(document.id); //end mootools wrapper
