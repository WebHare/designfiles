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



MARK: work in progress, used for WIG and WP

FIXME: how to pass items?
  - selector
  - make items have a class (wh-masonry-items)
    +
    - what about nesting (masonry within masonry)
         A) only pick up first level elements? or at least not wh-masonry-item within a wh-masonry-item
         B)


ADDME: handle resize of content
       option A) generic
       option B) loading of images
                 and loading of custom fonts
                 (CSS Font Loading API should be implemented in Firefox 35)
                 Also see:
                 https://dev.opera.com/articles/better-font-face/
                 http://dev.w3.org/csswg/css-font-loading/
       option C) resize sensor
                 (the one we have now in designfiles or switch to a html document object resize based sensor?)

ADDME: make wh.layout.masonry detect there have been no changes??
       or detect onresize, but see it's size hasn't changed so until someone calls .refresh or fireEvent("wh-refresh") no relayout is done?

ADDME: culling? (optionally hide blocks which are out of view to improve performance)

ADDME: a 'clear / nextline' trigger?
       <div class="widget" data-clear>...</div>
*/


(function($) { //mootools wrapper

if(!window.$wh) window.$wh={};

$wh.Masonry = new Class(
{ //Implements: [ Options ] //, Events ]
  options:
      { columns:            3

      // gutter size
      // gutter:            10 // shorthand for gutter_x and gutter_y
      , gutter_x:           10
      , gutter_y:           10

      , debug:              false

      , items:              null // selector string or array of nodes

      , equalizeheight:     false

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
, __itemdata:            []   // render data
, __visiblewidgetscount: 0
, __singlerow:           true

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

    //this.parent(options);
    Object.merge(this.options, options);
  }

  /** @short relayout
  */
, refresh: function()
  {
    var clientwidth = this.container.clientWidth;
    if (clientwidth == 0)
    {
      console.warn("Cannot determine size of mansonry container (got 0).", this.container);
//      debugger;
    }

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
  }

, getLastRenderInfo: function()
  {
    return { container:           this.container
           , visiblewidgetscount: this.__visiblewidgetscount
           , height:              this.__height
           , items:               this.__itemdata
           , singlerow:           this.__singlerow
           }
  }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Private functions
//

//, __padding: 0
, __leftoffset:     0
, __containerwidth: 0

, pvt_relayout: function(widgets)
  {
    if (this.options.debug)
      console.group("$wh.Masonry.refresh()");

    var visiblewidgetscount = 0;

    var columnwidth = (this.__containerwidth - (this.options.columns-1) * this.options.gutter_x) / this.options.columns;
    var columncount = this.options.columns;

    var columns = []; // the last Y position in use per column
    for (var xcol = 0; xcol < columncount; xcol++)
      columns.push(0);

    var widgetrecs = [];
    //console.log("widgets", widgets);


    // FIXME: rewrite to cache widget node & data-col in a JS array

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

    // FIXME: only fire if the width changes since the last layout (or if it's the initial layout)
    // FIXME: we only want to fire the layout change downwards
    //        because after our children resized to our new width,
    //        we will build up our masonry and then let our parents know if our width or height has changed
    */
    if (this.options.debug)
      console.log("Firing layout change event");

    // Notify any of our components within the Masonry container that layout has changed.
    // After they have updated their layout we know the final height of each widget and can start to layout our Masonry.
    $wh.fireLayoutChangeEvent(this.container, "down");

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
      var singlerow = true; // until we have to place a new widget below another one all widgets are still on a single row

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

      var styles = { position: "absolute"
                   , left:     this.__leftoffset + (bestcol * columnwidth + (bestcol) * this.options.gutter_x) // 300 width, 10 px leftmargin, 20 inter
                   , top:      ypos + 'px'
                   //, width:    columnwidth * widgetrec.cols + (widgetrec.cols-1) * this.options.gutter_x
                   };

      if (this.options.debug)
        console.log("Will be placed into col", bestcol);

      widget.setStyles(styles);
    }

    var maxheight = Math.max.apply(null, columns);

    //reorderWidgets(keepcolumnpos);
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
    this.__height = maxheight;
    this.__visiblewidgetscount = visiblewidgetscount;
    this.__singlerow = singlerow;
  }



, pvt_relayoutEqualHeight: function(widgets)
  {
    if (this.options.debug)
      console.group("$wh.Masonry.refresh()");

    var visiblewidgetscount = 0;

    var columnwidth = (this.__containerwidth - (this.options.columns-1) * this.options.gutter_x) / this.options.columns;
    var columncount = this.options.columns;

    var widgetrecs = [];

    // FIXME: rewrite to cache widget node & data-col in a JS array

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
          , computed: {}
          });
    }


    /*
    Let our children relayout to match our new width
    (after which layout of masonry item contents should be done, meaning the height is known and we can start to build up the masonry)

    // FIXME: only fire if the width changes since the last layout (or if it's the initial layout)
    // FIXME: we only want to fire the layout change downwards
    //        because after our children resized to our new width,
    //        we will build up our masonry and then let our parents know if our width or height has changed
    */
    if (this.options.debug)
      console.log("Firing layout change event");

    // Notify any of our components within the Masonry container that layout has changed.
    // After they have updated their layout we know the final height of each widget and can start to layout our Masonry.
    $wh.fireLayoutChangeEvent(this.container, "down");

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
    var computed;
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
    this.__height = ypos;
    this.__visiblewidgetscount = visiblewidgetscount;

    this.__singlerow = computed.rownr == 0; // check the rownr of the last visible widget
    this.__rows = computed.rownr + 1;
  }
});



function setupMasonry(node)
{
  if(!node.retrieve("wh-masonry"))
  {
    var optionsjson = node.getAttribute("data-masonry-options");
    if (!optionsjson)
    {
      console.warn("No options specified for wh-masonry.");
      return;
    }

    var opts = JSON.decode(optionsjson);
    var masonry = new $wh.Masonry(node, opts);
    node.store("wh-masonry", masonry);

    // FIXME: find a more generic way
    $(window).addEvent("domready", masonry.refresh.bind(masonry));
    $(window).addEvent("load", masonry.refresh.bind(masonry));
    $(window).addEvent("resize", masonry.refresh.bind(masonry));
  }
}

function initializeMasonries()
{
  $wh.setupReplaceableComponents(".wh-masonry", setupMasonry, { mustreplace: true });
}

window.addEvent("domready", initializeMasonries);

})(document.id); //end mootools wrapper
