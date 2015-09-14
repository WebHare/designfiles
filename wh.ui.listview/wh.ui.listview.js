/* generated from Designfiles Public by generate_data_designfles */
require ('./listview.css');
require ('frameworks.mootools.more.keyboard');
require ('wh.components.scrollableview');
require ('wh.ui.base');
/*! LOAD: frameworks.mootools.more.keyboard, wh.components.scrollableview, wh.ui.base !*/


/*
Keyboard navigation:
(all with the exception of page up+down is based on the list selection behaviour in MacOS Finder)

  - click to select a single row
  - up/down arrow to navigate through the rows
  - meta + mouseclick to toggle selection of a row
  - shift + click to select a range of rows (from the last single selected or toggled row)
  - shift+up/shift+down to select a range of rows from the last singled selected or toggled row

  - meta+up OR 'home' -> go to the first row
  - meta+down OR 'end' -> go to the last row

  - shift+meta+up OR 'shift+home' -> select from the range start to the first row
  - shift+meta+down OR 'shift+end' -> select from the range start to the last row
  - ctrl-a -> select all rows (and sets the cursor to the last row)

  - page up - move the selection cursor 5 items up
  - page down - move the selection cursor 5 rows down


Additional behaviour:

  - scrolling up will scroll the screen a quarter up when nearing the second visible row
  - scrolling down will scroll the screen a quarter down when nearing the second-last visible row


Selection scenario's

  - by code (preselecting a row) -> center cursor in view
  - by click -> only keep row in view (scrolling any more might cause the second click in a doubleclick to land on another row)
  - by keyboard navigation -> keep row in view with a few extra rows (comfort zone)




NOTES:
- row options can have an optional 'selectable' field (boolean)


ADDME: tests
ADDME: when expanding a list, scroll to show more of the subtree (on R's wishlist)


selectableflags tests
- niet/wel kunnen selecteren
- niet kunnen triggeren van contextmenu als niet selectable
- bij keyboard navigatie up & down skippen van niet te selecteren rijen
- home/end laatste selecteerbare item selecteren
  - test of eerste/laatste bereikbaar als deze selecteerbaar is
  - test of tweede/een-na-laatste geselecteerd als eerste en laatste niet selecteerbaar zijn





FIXME: a click to select replaces the list nodes, causing a doubleclick not to fire
FIXME: FindAsYouType only works on the visible rows!!!
FIXME: when start starting row of a selection range is removed, should the range be reset?
ADDME: option to be exact the height required to show all rows
FIXME: drag crashes?
ADDME: wrapping option?
*/


(function($) { //mootools wrapper

function getElementPageCoordinates(element)
{
  var x = 0, y = 0;

  var nextoffsetparent = element;

  while (element)
  {
    var curr = element;
    element = element.parentNode;

    if (curr == nextoffsetparent)
    {
      if (!curr.offsetParent)
        break;

      x += curr.offsetLeft;
      y += curr.offsetTop;
      nextoffsetparent = curr.offsetParent;
    }

    // Get current scroll
    var scrollpos = curr.getScroll();

    x -= scrollpos.x;
    y -= scrollpos.y;
  }

  return { x: x, y: y };
}

function translatePageCoordinatesToElement(page, element)
{
  //element = element.getElement(".wh-scrollableview-content");

  /*
  // FIXME: wouldn't this work? (a lot less cpu-intensive)
  var bounds = element.getBoundingClientRect();
  var el_page2 = { x: bounds.left + document.documentElement.scrollLeft
                 , y: bounds.top + document.documentElement.scrollTop
                 };
  */

  var el_page = getElementPageCoordinates(element);
  //console.log(page.x, el_page2.x, el_page.x);
  //console.log(page.y, el_page2.y, el_page.y);

  return { x: page.x - el_page.x, y: page.y - el_page.y };
}

$wh.ListView = new Class(
{ Implements: [Options,Events]
, Binds: [ "onSplitMoveStart", "onSplitMove", "onSplitMoveEnd", "onEnterTextContent"
//         , "onMouseDown", "onMouseMove", "onMouseOut", "onMouseUp"
         ]
, options: { width:400
           , height:600
           , headerheight: 50
           , lineheight: 30

           , scrollx_space: null // space to reserve for the vertical scrollbar - null means automatic
           , firstcolumn_leftpadding: 8 // extra empty space added to the cell (through CSS), this means the column will also need extra minimum space
           , lastcolumn_rightpadding: 8

           , keepcursorinviewrows: 2 // how many rows to keep visibile above/below the cursor row while navigating // FIXME: find a better name

           , selectmode: 'none'
           , disablescroll: false //you can disable all scrolling to ease event debugging (there will be no drag/mouse capturing activated)
           , contextmenu:false
           , searchtimeout: 750 //after this number of ms find-as-you-type is cancelled, set to 0 to disable find-as-you-type
           , searchkeys: "[0-9a-z-., ]" //which event keys activate find-as-you-type
           , hideheader: false
           , max_dblclick_delay: 500

           , debug: false

           , delay_layout: false // set to true if you want to be able to interact with the class, but not have it layout yet
           }

, listcount: 0
, vscroll_width:  null // null means it's not defined
                        // 0 means the scrollbar is an overlay, not taking any space
                        // >0 takes space next to the content which can be scrolled

, listdomcreated: false // will stay false until .layout() is called if options.delay_layout was set to true
, datasource:     null

, numrows:         0 // total amount of rows the datasource has
, firstvisiblerow: 0 // first row which is in view
, numvisiblerows:  0 // amount of rows which can be visible (with the rowheight we have, which is calculated using the lineheight * linesperrow)

// object so we can use the original rownumbers (if we use an array, setting visiblerows[8000]={}
// will create an array with 7999 'undefined' items)
, visiblerows: {}

  // List of all footerrows
, footerrows: []

  /** List of visible columns in the list
      @cell width Width in pixels
      @cell header Index of primary datacolumn for this column
      @cell left x-position of leftmost pixel
      @cell right Equal to left + width
      @cell dragleft ???
      @cell dragright ???
      @cell minwidth Minimum width
      @cell coupled_cols Set of column nrs (including current) that have their *left* splits coupled (moving together)
              If this set includes 0, the split cannot be moved.
  */
, cols: []

  // List of all source columns present (will be combined through rowlayout and mapped to the visible columns)
, datacolumns: []

  // cols & datacolumns for dragging
, dragdatacolumns: []

, istreeview: false
, lineheight: 0
, rowheight: 0 // READ-ONLY (calculated with this.options.lineheight * this.linesperrow)
, linesperrow: 1
, sortcolumn:null
, sortascending:true
, findingasyoutype: null
, findasyoutyperegex: null

, dragrowheight: 0
, draglinesperrow: 1

, selectedidx: 0 // index of the cell containing the selected state
, expandedidx: 0
, depthidx:    0
, searchidx:   0
, highlightidx:0

, cursorrow: -1
, range_start_idx: -1
, range_end_idx: -1

, draginfo: null
, dragnode: null

  /// Callback for delayed selection updategroup finish
, updategroupfinish_cb: null

  // nodes
, listcontent: null
, listheader: null
, listbody: null
, listbodyholder: null
, listinsertline: null
, listinsertpoint: null
, headerfiller: null

//
// API
//
, initialize:function(node, datasource, options)
  {
    window.listcount = (window.listcount || 0) + 1;
    this.listcount = window.listcount;

    this.node=$(node);
    this.node.addClass("wh-ui-listview");
//    this.node.setStyle("box-sizing", "content-box");
    this.node.store("wh-ui-listview",this);
    this.node.addEvents({ "click": this.onClickList.bind(this, false)
                        , "dblclick": this.onClickList.bind(this, true)
                        , "focus": this.onNodeFocus.bind(this)
                        , "blur": this.onNodeBlur.bind(this)
                        , "movestart:relay(.listheader > div.splitter[movable])": this.onSplitMoveStart
                        , "move:relay(.listheader > div.splitter[movable])": this.onSplitMove
                        , "moveend:relay(.listheader > div.splitter[movable])": this.onSplitMoveEnd
                      //, "mouseenter:relay(.listrow .text)": this.onEnterTextContent
                        , "mouseenter:relay(.listrow span)": this.onEnterTextContent
                        });

    this.node.setAttribute("tabindex","0");

    this.setOptions(options);
    this._constrainOptions();

    if(this.options.rowheight)
      throw new Error("Use options.lineheight, not rowheight")

    this.keyboard = new Keyboard({ "events": { "up":            this.onKeyboardUp.bind(this)
                                             , "down":           this.onKeyboardDown.bind(this)
                                             , "shift+up":       this.onKeyboardUp.bind(this)
                                             , "shift+down":     this.onKeyboardDown.bind(this)

                                             , "pageup":         this.onKeyboardPageUp.bind(this)
                                             , "pagedown":       this.onKeyboardPageDown.bind(this)

                                             , "shift+pageup":   this.onKeyboardPageUp.bind(this)
                                             , "shift+pagedown": this.onKeyboardPageDown.bind(this)

                                             // start/end (single select)
                                             , "home":           this.onKeyboardHome.bind(this)
                                             , "end":            this.onKeyboardEnd.bind(this)
                                             , "alt+up":         this.onKeyboardHome.bind(this)
                                             , "alt+down":       this.onKeyboardEnd.bind(this)

                                             // start/end (expand selection)
                                             , "shift+home":     this.onKeyboardHome.bind(this)
                                             , "shift+end":      this.onKeyboardEnd.bind(this)
                                             , "shift+alt+up":   this.onKeyboardHome.bind(this)
                                             , "shift+alt+down": this.onKeyboardEnd.bind(this)


                                             // ctrl+a on Windows
                                             , "meta+a":         this.onKeyboardSelectAll.bind(this)

                                             , "left": this.onKeyboardLeft.bind(this)
                                             , "right": this.onKeyboardRight.bind(this)

                                             , "enter": this.onKeyboardEnter.bind(this)
                                             , "backspace": this.onKeyboardBackspace.bind(this)
                                             , "esc": this.onKeyboardEsc.bind(this)

                                             // Mac OS X uses meta for path up/down

                                             , "keydown": this.onKeyboardGeneral.bind(this)
                                             }
                                 });
    this.setDataSource(datasource);
  }

, destroy:function()
  {
    this.node.eliminate("wh-ui-listview");
    if(this.datasource)
      this.setDataSource(null);
  }

, setDataSource:function(newdatasource)
  {
    //console.log("setDataSource", newdatasource);

    if(this.datasource==newdatasource)
      return;

    if(this.datasource)
      this.datasource.setListView(null);
    this.datasource=newdatasource;
    if(this.datasource)
      this.datasource.setListView(this); //datasources are expected to only support one list, as sorting state would possibly differ per list anyway

    this.resetList();
  }

, updateOptions:function(newopts)
  {
    //console.log("updateOptions");
    var need_reset = false;

    if(newopts.selectmode)
    {
      this.options.selectmode = newopts.selectmode;
      need_reset = true;
    }

    if(newopts.searchkeys)
      this.options.searchkeys = newopts.searchkeys;

    if ("emptytext" in newopts)
    {
      this.options.emptytext = newopts.emptytext;
      this.listemptytext.set('text', newopts.emptytext || '');
    }

    this._constrainOptions();

    if (need_reset)
      this.resetList();
  }

  // FIXME: test
, activateLayout: function()
  {
    if (!this.listdomcreated)
    {
      this.resetList(true);

      if (this.delayed_scrollrowintoview != null)
        this.scrollRowIntoView(this.delayed_scrollrowintoview);
    }
  }


  //reconfigure the list
, resetList:function(force)
  {
    if (this.options.delay_layout)
      return;

    this.listdomcreated = true;
    //console.info("resetList");

    //clear all cached data, all generated content
    this.node.empty();
    if(this.tablescroller)
    {
      this.tablescroller.destroy();
      this.tablescroller=null;
    }
    if(this.bodyscroller)
    {
      this.bodyscroller.destroy();
      this.bodyscroller=null;
    }

    if(!this.datasource)
      return;

    /* The list dom model:
       <div class="wh-ui-listview wh-scrollableview"> <!-- also a horizontal scrollview -->
         <div class="wh-scrollableview-content">
           <div class="wh-ui-listheader">
             <span></span>
           </div>
           <div class="wh-ui-listbody wh-scrollableview"> <!-- vertical scroll view -->
             <div class="wh-scrollableview-content">
             </div>
           </div>
           [ <div class="wh-ui-listfooter">            optional if footer is enabled
             </div>
           ]
         </div>
       </div>
    */

    //ADDME what to do with border,padding etc widths which should probably be substracted from all the calculated heights
    //FIXME shouldn't we namespace wh-ui-listview-row ?  or is that getting too long?   perhaps wh-ui-list is enough?

    this.node.setStyles({width:this.options.width
                        ,height:this.options.height
                        });


    this.listcontent    = new Element("div",{"events": { "dragenter:relay(.listbodyholder .listrow,.listbodyholder,.insertpoint)": this.onDragEnter.bind(this)
                                                       , "dragover:relay(.listbodyholder .listrow,.listbodyholder,.insertpoint)": this.onDragOver.bind(this)
                                                       , "dragleave:relay(.listbodyholder)": this.onDragLeave.bind(this)
                                                       , "drop:relay(.listbodyholder .listrow,.listbodyholder,.insertpoint)": this.onDrop.bind(this)
                                                       , "dragend": this.onDragEnd.bind(this)
                                                       }
                                            });

    this.listheader     = new Element("div",{"class": "listheader"
                                            });

    // NOTE: dblclick on a row is useless, because it'll be replaced after selecting it
    //       (and potentially also due to the server updating the row)
    //       (FIXME what if doubleclick is caught at the LIST level instead of through a relay? you only need to know a doubleclick occured, and can reuse the selection)

    this.listbodyholder = new Element("div",{"class": "listbodyholder"});
    this.listbody       = new Element("div",{"class": "listbody"
                                            ,"events": {
                                                       //, "dblclick:relay(div.wh-ui-listrow)": this.onDblClickRow.bind(this)
                                                         "dragstart:relay(div.listrow)": this.onDragStart.bind(this)
                                                       , "dragend": this.onDragEnd.bind(this)
                                                       }
                                            });
    this.listemptytextholder = new Element("div",{"class": "emptytextholder"
                                            });
    this.listemptytext = new Element("span",{"class": "emptytext"
                                            ,"text":  this.options.emptytext || ''
                                            });

    this.listfooterholder = new Element("div",{"class": "listfooterholder"});
    this.listfooter       = new Element("div");

    this.listinsertline = new Element("div", { "class": "insertpoint", "style": "display: none;" });
    this.listinsertpoint = new Element("div");
    this.listinsertline.adopt(this.listinsertpoint);

    if(this.options.contextmenu)
    {
      this.node.addEvent("contextmenu",this.onContextMenuOther.bind(this));
      this.listbody.addEvent("contextmenu:relay(div.listrow)", this.onContextMenuRow.bind(this));
    }

    //this.listfooter  = new Element("div",{"class": "wh-ui-listfooter wh-ui-scrollabeview"});

    this.node.adopt(this.listcontent);
    if (!this.options.hideheader)
      this.listcontent.adopt(this.listheader);
    this.listcontent.adopt(this.listbodyholder);
    this.listbodyholder.adopt(this.listbody);
    this.listbodyholder.adopt(this.listinsertline);
    this.listbodyholder.adopt(this.listemptytextholder);
    this.listemptytextholder.adopt(this.listemptytext);
    this.listcontent.adopt(this.listfooterholder);
    this.listfooterholder.adopt(this.listfooter);

    if(!this.options.disablescroll)
    {
      this.node.addClass("wh-scrollableview");
      this.listcontent.addClass("wh-scrollableview-content");
      this.listbodyholder.addClass("wh-scrollableview");
      this.listbody.addClass("wh-scrollableview-content");

      this.listbodyholder.appendChild( new Element("div", {"class": "wh-scroller-vertical" }) );

      this.bodyscroller = new $wh.ScrollableView(this.listbodyholder, { elastic:false
                                                                      //, onScroll: this.onBodyScroll.bind(this)
                                                                      , dragging:false
                                                                      , dragscroll:false
                                                                      , mousedrag: false
                                                                      , nativescroll: false
                                                                      });

      // prevent a race-condition when onscroll is called before initialization of the list has complete.
      // in this case this.bodyscroller wouldn't have been set yet, so can't be used to call .getScroll() on yet.
      this.bodyscroller.addEvent("scroll", this.onBodyScroll.bind(this));
    }
    else
    {
      $wh.autoSaveScrollState(this.listbodyholder);
      this.listbodyholder.addEvent("scroll", this.onBodyScroll.bind(this))
                         .setStyles({ "overflow-y": "scroll" });
    }

    this.setupFromDatasource();
    this.invalidateAllRows();
  }

, getVerticalScrollbarSize: function()
  {
    if (this.options.scrollx_space)
      return this.options.scrollx_space;

    // measure the vertical scrollbar if we don't know it's size yet
    if (this.vscroll_width === null)
    {
      this.listbodyholder.setStyle("overflow-y", "scroll");
      this.listcontent.setStyle("height", 5000);
      this.vscroll_width = this.listbodyholder.offsetWidth - this.listbodyholder.clientWidth;
      this.listcontent.setStyle("height", "");
    }

    // FIXME: we should only calculate this once? (because it might cause a reflow)
    return this.vscroll_width;
  }

, scrollRowIntoCenterOfView: function(rownum)
  {
    this.__scrollRowIntoView(rownum, false, true);
  }

, scrollRowIntoView: function(rownum, keep_comfort_distance) //, animate)
  {
    this.__scrollRowIntoView(rownum, keep_comfort_distance, false);
  }

  /** @short
      @param rownum row number which must be in view
      @param keep_confort_distance whether to keep a 'confort zone' of rows around the cursor position
  */
, __scrollRowIntoView: function(rownum, keep_comfort_distance, center) //, animate)
  {
    if (!this.listdomcreated)
    {
      this.delayed_scrollrowintoview = rownum; // FIXME: safe?
      return;
    }

    var rowtop = rownum * this.rowheight;
    var scrolltop;

    if(this.bodyscroller)
      scrolltop = this.bodyscroller.getScroll().y;
    else
      scrolltop = this.listbodyholder.getScroll().y;

    /*
    console.info(
    { rowtop: rowtop
    , scrolltop: scrolltop
    , rowbottom: rowtop + this.options.rowheight
    , last_visible_y: scrolltop + this.bodyholderheight
    });
    */

    if (     rowtop < scrolltop - this.bodyholderheight // would have to scroll more than a full page (height of the list) ??
         || center) // (this.cursorrow == -1 )) // the first selection
    {
      // calculate the scrolltop for getting the specified row in the middle
      var rowmiddle = rowtop + this.rowheight/2;
      scrolltop = Math.floor(rowmiddle - this.bodyholderheight/2);
    }
    else if (!keep_comfort_distance)
    {
      //console.log("Keep row in view (without comfort zone)");
      scrolltop = Math.min(rowtop, scrolltop);
      scrolltop = Math.max(rowtop + this.rowheight - this.bodyholderheight, scrolltop);
    }
    else
    {
      var comfort_pixels = this.options.keepcursorinviewrows * this.rowheight;
      var comfort_top = rowtop - comfort_pixels;
      var comfort_bottom = rowtop + this.rowheight + comfort_pixels;

      if (comfort_pixels * 2 > this.bodyholderheight)
      {
        // our list is too small to keep rows around it, so just try to center our row
        var rowmiddle = rowtop + this.rowheight/2;
        scrolltop = Math.floor(rowmiddle - this.bodyholderheight/2);
      }
      else
      {
        scrolltop = Math.min(comfort_top, scrolltop);
        scrolltop = Math.max(comfort_bottom - this.bodyholderheight, scrolltop);
      }
  /*
      else // totally out of our current view
      if (this.cursorrow == -1)
      {
        //what should the scrolltop be to position rowtop in the middle?
        var rowmiddle = rowtop + this.rowheight/2;
        scrolltop = Math.floor(rowmiddle - this.bodyholderheight/2);
      }
  */
    }

    //boundscheck
    var scrollmax = this.numrows * this.rowheight - this.bodyholderheight;
    scrolltop = Math.max(0,Math.min(scrollmax, scrolltop));

    if(this.bodyscroller)
      this.bodyscroller.scrollTo(0, scrolltop);
    else
      this.listbodyholder.scrollTo(0, scrolltop);
  }
  //update column widths. although we accept the original columns structure, we'll only use the 'width' parameter
, setColumnsWidths:function(columns)
  {
    if(columns.length != this.cols.length)
      throw "updateColumnsWidths did not receive the number of columns expected";

    for (var i=0;i<columns.length;++i)
      this.cols[i].width = columns[i].width;

    this._refreshColCalculation(this.cols);

    this.applyColumnWidths();
  }
, setDimensions:function(width,height)
  {
    if (this.options.debug)
      console.log("$wh.ListView #" + this.listcount + " - setDimensions (size " + width + "x" + height + ")");

    // no need to recalculate & relayout everything if our dimensions don't change
    if (width == this.options.width && height == this.options.height)
    {
      if (this.options.debug)
        console.log("Ignoring setdimensions (already at correct dimension).")
      return;
    }

    this.options.width = width;
    this.options.height = height;
    this.applyDimensions();
  }
, getFirstVisibleRow:function()
  {
    var scrolltop = this.bodyscroller ? this.bodyscroller.getScroll().y : this.listbodyholder.getScroll().y;
    return Math.floor(scrolltop / this.rowheight);
  }
, setSort:function(colidx, ascending)
  {
    if(this.sortcolumn !== null)
    {
      if(this.datacolumns[this.sortcolumn].headernode)
        this.datacolumns[this.sortcolumn].headernode.set('text', this.datacolumns[this.sortcolumn].title);
    }
    this.sortcolumn=colidx;
    this.sortascending=ascending;

    if(this.sortcolumn !== null)
    {
      if(this.datacolumns[this.sortcolumn].headernode)
        this.datacolumns[this.sortcolumn].headernode.set('html', this.datacolumns[this.sortcolumn].title + '<span class="sortdirection">' + (ascending ? "\u25B2" : "\u25BC") + "</span>");
    }
  }
//
// Datasource callbacks
//
, updateNumRows:function(numrows)
  {
    this.numrows = numrows;
    this.applyDimensions();

    this.listemptytextholder.setStyle("display", this.numrows ? "none" : "table");
  }
, extractRowNode: function(rownum)
  {
    var existingrow = this.visiblerows[rownum];
    if (!existingrow)
       return;
    var saved = existingrow.node;
    existingrow.node = null;
    this.updateRow(rownum, existingrow.cells, existingrow.options);
    return saved;
  }

, updateDummyRows: function()
  {
    //console.log("list #"+this.listcount+" - visiblerows:", this.numrows, ", numvisiblerows:", this.numvisiblerows)

    if (   this.numrows >= this.numvisiblerows
        || this.numrows == 0 // keep the list empty if there aren't any rows (we want to show an emptytext instead)
       )
    {
      //console.log("no need for dummy rows");
      if (this.dummyrowsholder)
        this.dummyrowsholder.setStyle("display", "none");
      return;
    }
    //this.firstvisiblerow + this.numvisiblerows)

    var dummyrowsholder = new Element("div", { "class": "dummyrowsholder" }); //createDocumentFragment();
    for (var rownum = this.numrows; rownum < this.numvisiblerows-1; rownum++)
    {
      //console.log("creating dummy row #" + rownum);
      var rowel = new Element("div", { "class":  ((rownum%2==0) ? "listrow odd unselectable" : "listrow even unselectable")
                             , "styles": { "height": this.rowheight
                                         , "top":    rownum * this.rowheight
                                         }
                             });
     dummyrowsholder.appendChild(rowel)
   }

   if (!this.dummyrowsholder)
   {
     this.listbodyholder.appendChild(dummyrowsholder);
     this.dummyrowsholder = dummyrowsholder;
   }
   else
   {
     //this.listbodyholder.replaceChild(dummyrowsholder, this.dummyrowsholder);
     this.dummyrowsholder.parentNode.replaceChild(dummyrowsholder, this.dummyrowsholder);
     this.dummyrowsholder = dummyrowsholder;
   }
  }

, updateRow:function(rownum, row, options)
  {
    var existingrow = this.visiblerows[rownum];

    var rowel;
    if(existingrow && existingrow.node)
    {
      rowel = existingrow.node;
    }
    else
    {
      rowel = new Element("div", { "class": ((rownum%2==0) ? "listrow odd":"listrow even")
                                 , "styles":{ "height":this.rowheight
                                            , "top":rownum * this.rowheight
                                            }
                                 });
    }

    rowel.toggleClass("selected", Boolean(row[this.selectedidx]));


    rowel.toggleClass("unselectable", options && ("selectable" in options) && !options.selectable);

    rowel.set('draggable', options && options.draggable);
    if (this.highlightidx && this.highlightidx > 0)

    rowel.toggleClass("highlighted", Boolean(row[this.highlightidx]));

    if(options && options.styles)
    {
      // Don't honor background-color for selected rows
      var styles = options.styles;
      if (row[this.selectedidx] && styles["background-color"])
      {
        styles = Object.clone(styles);
        delete styles["background-color"];
      }
      rowel.setStyles(styles);
    }
    if (this.cursorrow < 0 && row[this.selectedidx])
      this.cursorrow = rownum; // NOTE: don't use setCursorRow because we will get a lot of successive calls to this function

    rowel.rownum = rownum;

    this.visiblerows[rownum] = { cells: row
                               , node:  rowel
                               , rownum: rownum
                               , options: options
                               , dragrow: false
                               };

    this._renderRowContents(rowel, this.datacolumns, this.visiblerows[rownum]);
    this.listbody.adopt(rowel);
    this._applyRowColumnWidths(this.datacolumns, false, this.visiblerows[rownum]);
  }

, updateFooterRows: function(rowdata)
  {
    rowdata.each(function(data, rownum)
    {
      var existingrow = this.footerrows.length > rownum ? this.footerrows[rownum] : null;

      var rowel;
      if(existingrow && existingrow.node)
      {
        rowel = existingrow.node;
      }
      else
      {
        rowel = new Element("div", { "class": ((rownum%2==0) ? "listrow even":"listrow odd")
                                   , "styles": { "height":  this.rowheight
                                               , "top":     rownum * this.rowheight
                                               }
                                   });
      }
      rowel.rownum = rownum;

      // Never selectable or draggable
      if(data.options && data.options.styles)
        rowel.setStyles(styles);

      var rec = { cells: data.row
                , node:  rowel
                , rownum: rownum
                , options: data.options
                , dragrow: false
                };

      if (this.footerrows.length == rownum)
        this.footerrows.push(rec);
      else
        this.footerrows[rownum] = rec;

      this._renderRowContents(rowel, this.datacolumns, rec);
      this.listfooter.adopt(rowel);
      this._applyRowColumnWidths(this.datacolumns, false, rec);
    }.bind(this));

    // Remove extra footerrows
    while (this.footerrows.length > rowdata.length)
    {
      var recs = this.footerrows.splice(rowdata.length, 1);
      recs[0].node.dispose();
    }
  }

  // ---------------------------------------------------------------------------
  //
  // Internal functions
  //

  /** Get the datacolumn nr from the clicked node in a row
      @return Index of datasource, -1 if not found
  */
, _findDataColumnFromCellNode: function(rownode, cellnode)
  {
    // The cells are inserted in datasource order, sources with x=-1 are skipped.
    var cellnr = Array.prototype.indexOf.call(rownode.childNodes, cellnode);

    var curcell = 0;
    for (var i = 0; i < this.datacolumns.length; ++i)
    {
      // Skip invisible datacolumns
      if (this.datacolumns[i].x == -1)
        continue;
      // Match?
      if (curcell == cellnr)
        return i;
      ++curcell;
    }
    return -1;
  }

, _renderRowContents: function(rowel, datacolumns, rowdata)
  {
    //rowel.toggleClass('highlight');
    var curcell=0;
    for(var i = 0; i < datacolumns.length; ++i)
    {
      var col = datacolumns[i];
      if(col.x == -1)
        continue;

      var cell = rowel.childNodes[curcell];
      if(!cell)
      {
        cell = new Element("span");

        if (this.options.cssheights === true)
        {
          cell.addClass("row_" + col.y);
          cell.addClass("rowspan_" + col.h);
        }
      }

      ++curcell;

      if(col.handler)
      {
        var data = rowdata.cells[col.src.dataidx];
        if(this.expandedidx >= 0 && rowdata.cells[this.expandedidx] === false && col.src.collapsedidx >= 0 && rowdata.cells[col.src.collapsedidx] !== null)
          data = rowdata.cells[col.src.collapsedidx];

        col.handler.render(this, col.src, rowdata, cell, data, false);
      }

      if(!rowel.childNodes[curcell])
        rowel.adopt(cell);
    }
  }

, _constrainOptions: function()
  {
    if(!['single','multiple'].contains(this.options.selectmode))
      this.options.selectmode = 'none';

    this.findasyoutyperegex = new RegExp("^" + this.options.searchkeys + "$");
  }

  /// Start an update selection groups (groups partial updates of selection together)
, _startSelectionUpdateGroup: function()
  {
    if (!this.updategroupfinish_cb)
      this.datasource.startSelectionUpdateGroup();
  }

  /// Finish the current update selection group (delayed to catch dblclick after click into one group)
, _finishSelectionUpdateGroup: function(immediate)
  {
    if (immediate)
    {
      var cancelled_cb = false;
      if (this.updategroupfinish_cb)
      {
        clearTimeout(this.updategroupfinish_cb);
        this.updategroupfinish_cb = null;
        cancelled_cb = true;
      }

      if (this.datasource)
        this.datasource.finishSelectionUpdateGroup();

      // Remove ui busy after the finish callback
      if (cancelled_cb)
        $wh.updateUIBusyFlag(-1);
    }
    else if (!this.updategroupfinish_cb)
    {
      // Delay finishing by 1 ms to catch dblclick
      $wh.updateUIBusyFlag(+1);
      this.updategroupfinish_cb = this._delayedFinishSelectionUpdateGroup.bind(this).delay(1);
    }
  }

, _delayedFinishSelectionUpdateGroup: function()
  {
    this.updategroupfinish_cb = null;
    if (this.datasource)
      this.datasource.finishSelectionUpdateGroup();
    $wh.updateUIBusyFlag(-1);
  }

, _runOpenAction: function(row)
  {
    var event = new $wh.CustomEvent("open",
        { bubbles: false
        , cancelable: true
        , detail:
              {}
        });

    $wh.dispatchEvent(this.node, event);
    if (event.defaultPrevented)
      return;

    // If the row is expandable, toggle expandability
    if (typeof row.cells[this.expandedidx] == "boolean")
      this.datasource.setCell(row.rownum, row.cells, this.expandedidx, !row.cells[this.expandedidx]);
  }

  // ---------------------------------------------------------------------------
  //
  // Callbacks
  //

, onBodyScroll:function()
  {
    var newfirstvisiblerow = this.getFirstVisibleRow();
    if(this.firstvisiblerow == newfirstvisiblerow)
      return;

    //console.log("Firstvisiblerow was", this.firstvisiblerow, "and now is", newfirstvisiblerow);

    //ADDME discard invisible rows?
    this.firstvisiblerow = newfirstvisiblerow;
    this.requestAnyMissingRows();
  }
, onNodeFocus: function()
  {
    this.keyboard.activate();
  }
, onNodeBlur: function()
  {
    this.keyboard.deactivate();
  }
, onKeyboardUp: function(event)
  {
    Keyboard.stop(event);
    event.stop(); // else shift+down will select page content
    this.moveRowCursorUp( event.shift, $wh.hasEventCopyKey(event));
  }
, onKeyboardDown: function(event)
  {
    Keyboard.stop(event);
    event.stop(); // else shift+down will select page content
    this.moveRowCursorDown( event.shift, $wh.hasEventCopyKey(event));
  }
, onKeyboardLeft: function(event)
  {
    Keyboard.stop(event);
    // If the cursor is not active, we cannot collapse/navigate
    if (this.cursorrow < 0)
      return;

    // If the row is expandable and currently expanded, collapse it, otherwise select the current row's parent
    var row = this.visiblerows[this.cursorrow];
    if (row.cells[this.expandedidx] === true)
      this.datasource.setCell(row.rownum, row.cells, this.expandedidx, false);
    else
    {
      // Get the current depth
      var depth = row.cells[this.depthidx];
      if (depth)
      {
        // Find the first item having a different depth than the current depth
        var r = this.cursorrow - 1;
        while (r >= 0 && this.visiblerows[r].cells[this.depthidx] == depth)
          --r;
        if (r >= 0)
        {
          // Select the found item
          this.setCursorRow(r);

          //row = this.visiblerows[this.cursorrow];
          //this.clickSelectRow(event, row);
          this.clickSelectRowByNumber(event, this.cursorrow, false, true);
        }
      }
    }
    event.stop();
  }
, onKeyboardRight: function(event)
  {
    Keyboard.stop(event);
    // If the cursor is not active, we cannot collapse/navigate
    if (this.cursorrow < 0)
      return;

    // If the row is expandable and currently not expanded, expand it
    var row = this.visiblerows[this.cursorrow];
    if (row.cells[this.expandedidx] === false)
      this.datasource.setCell(row.rownum, row.cells, this.expandedidx, true);
    else
    {
      // Get the current depth
      var depth = row.cells[this.depthidx];
      // Check if the next item has higher depth (i.e. is nested deeper) than the current depth
      if (this.cursorrow < this.visiblerows.length - 1 && this.visiblerows[this.cursorrow + 1].cells[this.depthidx] > depth)
      {
        // Select the next item
        this.setCursorRow(this.cursorrow + 1);
        this.clickSelectRowByNumber(event, this.cursorrow, false, true);
      }
    }
    event.stop();
  }
, onKeyboardHome: function(event)
  {
    Keyboard.stop(event);
    event.stop();
    //event.meta = false; // This event is also triggered with Cmd+Up, for which case we don't support multiple selection

    this.moveCursorToTop(event.shift);
  }
, onKeyboardEnd: function(event)
  {
    Keyboard.stop(event);
    event.stop();

    this.moveCursorToBottom(event.shift);
  }
, onKeyboardPageUp: function(event)
  {
    Keyboard.stop(event);
    event.stop();

    this.moveCursorUpAPage(event.shift);
  }
, onKeyboardPageDown: function(event)
  {
    Keyboard.stop(event);
    event.stop();

    this.moveCursorDownAPage(event.shift);
  }

, onKeyboardSelectAll: function(event)
  {
    Keyboard.stop(event);
    event.stop();

    this.setCursorRow(this.numrows - 1);

    this._startSelectionUpdateGroup();

    this.range_start_idx = 0;
    this.range_end_idx = this.numrows - 1;
    this.datasource.setSelectionForRange(this.range_start_idx, this.range_end_idx, true);

    this._finishSelectionUpdateGroup(true);
   }

, onKeyboardEnter: function(event)
  {
    Keyboard.stop(event);
    // If there is a current item, open it
    if (this.cursorrow >= 0)
    {
      var row = this.visiblerows[this.cursorrow];
      var status = row.cells[this.selectedidx];
      if(status !== true)
        return; //row wasn't selected for whatever reason, so ignore the doubleclick
      this._runOpenAction(row);
      event.stop();
    }
  }

, onKeyboardEsc: function(event)
  {
    if (this.findingasyoutype)
    {
      this.onStopFindAsYouType();
      Keyboard.stop(event);
      event.stop();
    }
  }

, onKeyboardBackspace: function(event)
  {
    Keyboard.stop(event);
    event.stop();

    if (this.findingasyoutype)
    {
      this.onFindAsYouType(event.key);
      Keyboard.stop(event);
      event.stop();
    }
  }

, onKeyboardGeneral: function(event)
  {
    // This function is called for every keydown, so we can implement find-as-you-type
    if (event.control || event.alt || event.meta)
      return;
    var key = event.key == "space" ? " " : event.key;
    if (key.match(this.findasyoutyperegex))
    {
      // Search for the next element with the given key and cancel the event
      this.onFindAsYouType(key);
      event.stop();
    }
  }

, onClickList:function(dblclick, event)
  {
    var lastnode, listrow, listcell, anyfocussable, selectnode ;
    for(selectnode = event.target; selectnode && selectnode != this.node; selectnode = selectnode.parentNode)
    {
      // Ignore clicks on the footer
      if (selectnode.hasClass("listfooterholder"))
        return false;

      anyfocussable = anyfocussable || $wh.isFocusableComponent(selectnode);
      if(selectnode.hasClass("listrow"))
      {
        listrow = selectnode;
        listcell = lastnode;
      }
      lastnode = selectnode;
    }

    if (listrow && listrow.getParent(".dummyrowsholder"))
      listrow = null;



    var srcrow;
    if(listrow)
      srcrow = this.visiblerows[listrow.rownum];

    // prevent selection of rows in which selectable is false
    if (srcrow && srcrow.options && "selectable" in srcrow.options && !srcrow.options.selectable)
      return;

    if(listcell) // a cell is clicked
    {
      /* Fire an event on the list allowing our parent to intercept */
      var cellnr = this._findDataColumnFromCellNode(listrow, listcell);

      var cellclickevent = new $wh.CustomEvent("wh-list-cellclick",
                               { bubbles: true
                               , cancelable: true
                               , detail: { cellidx: cellnr //FIXME ensure this is a proper number in the caller's context? (rows? swapped columns?)
                                         , row: srcrow.cells
                                         , clicknode: event.target
                                         }
                               });
      if(!$wh.dispatchEvent(this.node, cellclickevent)) //cancelled
      {
        event.stop();
        return;
      }
    }

    if(anyfocussable)
      return; //do not intercept clicks on components that can handle their own input

    if(!listrow)
    {
      //this.clickSelectRowByNumber(event, -1, false, true);
      this._startSelectionUpdateGroup();
      this.datasource.clearSelection(); //simple clicks clear selection
      this._finishSelectionUpdateGroup(true);

      return false;
    }

    // Delay selection only for left clicks  (FIXME/ADDME: and only in case there's an openaction?)
    var immediate_select = dblclick || event.which !== 1;

    this.clickSelectRowByNumber(event, listrow.rownum, dblclick, immediate_select);

    // fire doubleclick (but only if the rownum of the rowelt didn't change)
    if (dblclick && listrow.rownum == this.cursorrow)
      this._runOpenAction(srcrow);

    return true;
  }

, _prepareDragNode: function(event, target, rows)
  {
    if (this.dragnode)
      this.dragnode.destroy();

    if (event.event.dataTransfer && event.event.dataTransfer.setDragImage)
    {
      this.dragnode = new Element('div');
      this.node.adopt(this.dragnode);

      event.event.dataTransfer.setDragImage(this.dragnode, 0, 0);
    }
    else
    {
      this.dragnode = this.extractRowNode(target.rownum);
      this.dragnode.empty();
    }

    // Build the drag node
    this.dragnode.setStyles(
                        { "z-index": -10
                        , "position": "absolute"
                        , "top": 0
                        , "left": 0
                        , "width": this.cols[this.cols.length - 1].dragright
                        , "height": this.dragrowheight * rows.length
                        });
    this.dragnode.className = 'dragbodyholder';

    rows.each(function(data, rownum)
    {
      rowel = new Element("div", { "class": "listrow drag"
                                 , "styles":{ "height":this.dragrowheight
                                            , "top":rownum * this.dragrowheight
                                            , "left":0
                                            , "position":"absolute"
                                            }
                                 }).inject(this.dragnode);

      if(data.options && data.options.styles)
      {
        // Don't honor background-color for selected rows
        var styles = options.styles;
        if (styles["background-color"])
        {
          styles = Object.clone(styles);
          delete styles["background-color"];
        }
        rowel.setStyles(styles);
      }

      var rowdata =
          { cells:      data.row
          , node:       rowel
          , rownum:     rownum
          , options:    data.options
          , dragrow:    true
          };

      this._renderRowContents(rowel, this.dragdatacolumns, rowdata);
      this._applyRowColumnWidths(this.dragdatacolumns, true, rowdata);

    }.bind(this));
    return this.dragnode;
  }

  /** Reset the drop target styles
      @param rownr Rownr to select, -1 to select none
      @param clearinsertpoint If true, hide insertpoint
  */
, _setRowDropTarget: function(rownr, clearinsertpoint)
  {
    Object.each(this.visiblerows, function(item, key)
    {
      if (item.node)
        item.node.toggleClass("droptarget", rownr == key);
    });

    if (clearinsertpoint && this.listinsertline)
      this.listinsertline.style.display = "none";
  }

, _determineDragType: function(event, target)
  {
    // rownum before where positioned drop would drop
    var rel = translatePageCoordinatesToElement(event.page, this.listbody); //this.listbodyholder);
    var position_rownum = Math.min(Math.floor(rel.y / this.rowheight + .5), this.numrows);

    var diff = position_rownum * this.rowheight - rel.y;
    if (diff >= -8 && diff < 8)
    {
      // Calculate desired depth from mouse cursor
      var depth = Math.floor((rel.x - 48) / 16);

      var res = this.datasource.checkPositionedDrop(event, position_rownum, depth);
      if (res)
      {
        this.listinsertpoint.setStyles(
            { left: res.depth * 16 + 16
            });

        this.listinsertline.setStyles(
            { display:          "block"
            , top:              position_rownum * this.rowheight
            });

        this._setRowDropTarget(-1);
        return res;
      }
    }

    var target_rownum = Math.min(Math.floor(rel.y / this.rowheight), this.numrows);

    var cells = this.visiblerows[target_rownum] ? this.visiblerows[target_rownum].cells : null;
    var res = this.datasource.checkTargetDrop(event, target_rownum, cells, 'target');

    this._setRowDropTarget(res ? target_rownum : -1, true);

    if (res)
      return res;

    return null;
  }

, onDragStart: function(event, target)
  {
    event.stopPropagation(); // prevent scrollableView from cancelling our drag

    //console.log('LIST dragstart', event, target);

    var cells = target.hasClass('listrow') ? this.visiblerows[target.rownum].cells : null;

    event.event.dataTransfer.effectAllowed = "all";
    var res = this.datasource.tryStartDrag(event, target.rownum, cells);
    if (!res)
    {
      // Not allowed to drag this
      event.preventDefault();
      return false;
    }

    this._prepareDragNode(event, target, res);

    this._determineDragType(event, target);

    return true;
  }

, onDragEnter: function(event, target)
  {
    //console.log('LIST dragenter', event, target, target.className);

    var res = this._determineDragType(event, target);
    if (res)
    {
      event.preventDefault();
      return false;
    }
  }
, onDragOver: function(event, target)
  {
    //console.log('LIST dragover', event.target, event);

    var res = this._determineDragType(event, target);
    if (res)
    {
      event.preventDefault();
      return false;
    }
  }
, onDragLeave: function(event)
  {
    //console.log('LIST dragleave', event.target);

    this._setRowDropTarget(-1, true);
  }

, onDrop: function(event, target)
  {
    //console.log('LIST drop', event, target);

    var dt = event.event.dataTransfer;

    var res = this._determineDragType(event, target);
    this._setRowDropTarget(-1, true);

    if (res)
      return this.datasource.executeDrop(event, res);

    return false;
  }
, onDragEnd: function(event)
  {
    //console.log('LIST dragend', event);

    if (this.dragnode)
      this.dragnode.destroy();
    this.dragnode = null;

    this.listinsertline.setStyle("display", "none");
  }

  // ---------------------------------------------------------------------------
  //
  // Callbacks - split moves
  //

, onEnterTextContent: function(event, textualnode)
  {
    //console.log("onEnterTextContent");

    var rownode;
    var cellnode;
    var findnode = textualnode;

    // FIXME: onClickList has a similair mechanism, maybe share it in a function?
    while (findnode && !findnode.hasClass("listbodyholder"))
    {
      prevnode = findnode;
      findnode = findnode.parentNode;

      if (findnode && findnode.hasClass("listrow"))
      {
        rownode = findnode;
        cellnode = prevnode;
        break;
      }
    }

    /*
    console.log( "Listrow:", rownode,  " \n"
               , "Cell:",    cellnode, " \n"
               );
    */

    // NOTE: this code would be a lot simpler if we stored a reference to the columnref and row in our cell node
    var column_nr = this._findDataColumnFromCellNode(rownode, cellnode)
    var row_nr = rownode.rownum;
    var column = this.datacolumns[column_nr].src; // defined visual columns
    var hintidx = this.datacolumns[column_nr].src.hintidx;

    if (this.options.debug)
      console.log("Hovering over row", row_nr, ", col", column_nr, ". hintidx", hintidx);

    if (hintidx > 0)
    {
      var hint;
      if (textualnode.getParent(".listfooterholder"))
        hint = this.footerrows[row_nr].cells[hintidx];
      else
        hint = this.visiblerows[row_nr].cells[hintidx];

      //console.log("Setting hint on node", cellnode, "test =", hint);

      cellnode.setAttribute("title", hint);
      return;
    }

    if(cellnode.offsetWidth < cellnode.scrollWidth)
      cellnode.setAttribute("title", cellnode.get("text"));
    else
      cellnode.removeAttribute("title");
  }


, __dbg_getValsOfKey: function(myarr, key)
  {
    var values = [];
    for (var idx = 0; idx < myarr.length; idx++)
      values.push(myarr[idx][key]);

    return values;
  }

, _applySplitMove: function(event)
  {
    // Enforce the move bounds, so we won't resize a column below its minwidth
    var move = Math.max(-this.draginfo.room_left, Math.min(this.draginfo.lastpos.x, this.draginfo.room_right));

    // Copy the original sizes
    this.draginfo.orgsizes.forEach(function(item, idx)
    {
      this.cols[idx].width = item.width;
    }.bind(this));

    // Adjust the sizes the columns that are adjacent to a coupled split
    this.draginfo.coupled_cols.forEach(function(idx)
    {
      this.cols[idx-1].width += move;
      this.cols[idx].width -= move;
    }.bind(this));

    // Apply the new widths
    this._refreshColCalculation(this.cols); // updated .left/.right/.dragleft/.dragright

    this.applyHeaderColumnWidths();
    this.applyColumnWidths();

    var widths = this.cols.map(function(item) { return item.width; });
    this.fireEvent("columnresize", { target: this, widths: widths });
  }

, onSplitMoveStart: function(event)
  {
    if (event.rightClick)
    {
      event.stop();
      return;
    }

    var dragtarget = event.target.getSelfOrParent("[movable]");
    if (!dragtarget)
    {
      event.stop();
      return;
    }

    // Get the info of the column right to the moved split
    var splitinfo = dragtarget.retrieve('wh-ui-listview-split');
    var rightcol = this.cols[splitinfo.rightcolumn];

    // If the left split of column 0 is coupled to this column, this split isn't movable at all.
    if (rightcol.coupled_cols.indexOf(0) != -1)
    {
      event.stop();
      return;
    }

    // Save the original widths and minwidths, plus some info we need in _applySplitMove
    this.draginfo = { lastpos: event.moved
                    , orgsizes: this.cols.map(function(item)
                                      { return { width:         item.width
                                               , minwidth:      item.minwidth
                                               , room:          item.width - item.minwidth
                                               }
                                      })
                    , splitinfo:        splitinfo
                    , coupled_cols:     rightcol.coupled_cols
                    , room_left:        0
                    , room_right:       0
                    };


    var left_resize = []; // columns to the left of the moving splitters
    var right_resize = []; // columns to the right of the moving splitters

    for (var i = 0; i < rightcol.coupled_cols.length; ++i)
    {
      var colnr = rightcol.coupled_cols[i];
      if (rightcol.coupled_cols.indexOf(colnr - 1) == -1)
        left_resize.push(colnr - 1);
      if (rightcol.coupled_cols.indexOf(colnr + 1) == -1)
        right_resize.push(colnr);
    }

    // Calculate how much the split may be moved to the left
    this.draginfo.room_left = Math.min.apply(Math, left_resize.map(function(colnr)
    {
      return this.draginfo.orgsizes[colnr].room;
    }.bind(this)));

    // And to the right
    this.draginfo.room_right = Math.min.apply(Math, right_resize.map(function(colnr)
    {
      return this.draginfo.orgsizes[colnr].room;
    }.bind(this)));

    this._applySplitMove();

    event.stopPropagation();
  }

, onSplitMove: function(event)
  {
    if (!this.draginfo)
      return; // Nothing to drag
    if (typeof event.moved.x == "undefined")
      return; // May happen in IE, which has its own move event
    if (event.moved.x == this.draginfo.lastpos.x)
      return;
    this.draginfo.lastpos = event.moved;

    this._applySplitMove();
  }

, onSplitMoveEnd: function(event)
  {
    if (!this.draginfo)
      return;

    if (typeof event.moved.x == "undefined")
      return; // May happen in IE, which has its own move event

    this.draginfo.lastpos = event.moved;
    this._applySplitMove();

    this.draginfo = null;
  }

  // ---------------------------------------------------------------------------
  //
  // Public interface
  //

  /** @short set's the cursor row and makes sure the view scrolls if needed to keep the new cursor row in the view
  */
, setCursorRow: function(new_cursorrow)
  {
    this.scrollRowIntoView(new_cursorrow, true);
    this.cursorrow = new_cursorrow;
  }

, moveCursorToTop: function(expandselection)
  {
    this.setCursorRow(0);

    this._startSelectionUpdateGroup();

    var firstselectablerow = this.datasource.getSelectableRowAfter(-1);

    if (expandselection && this.options.selectmode=='multiple')
    {
      // make the current range stretch up to the first row

      if (this.range_start_idx > -1)
        this.datasource.setSelectionForRange(this.range_start_idx, this.range_end_idx, false);

      this.range_end_idx = 0;
      this.datasource.setSelectionForRange(this.range_start_idx, this.range_end_idx, true);
    }
    else // new selection will be only the first row
    {
      this.range_start_idx = firstselectablerow;
      this.range_end_idx = firstselectablerow;

      this.datasource.clearSelection();
      this.datasource.setSelectionForRange(0 ,0 ,true);
    }

    this._finishSelectionUpdateGroup(true);
  }

, moveCursorToBottom: function(expandselection)
  {
    var lastselectablerow = this.datasource.getSelectableRowBefore(this.numrows);

    this.setCursorRow(lastselectablerow);

    this._startSelectionUpdateGroup();

    if (expandselection && this.options.selectmode=='multiple')
    {
      // make the current rage stretch down to the last row

      if (this.range_start_idx > -1)
        this.datasource.setSelectionForRange(this.range_start_idx, this.range_end_idx, false);

      this.range_end_idx = lastselectablerow;
      this.datasource.setSelectionForRange(this.range_start_idx, this.range_end_idx, true);
    }
    else // new selection will be only the last row
    {
      this.range_start_idx = lastselectablerow;
      this.range_end_idx = lastselectablerow;
      this.datasource.clearSelection();
      this.datasource.setSelectionForRange(lastselectablerow, lastselectablerow, true);
    }

    this._finishSelectionUpdateGroup(true);
  }

, moveCursorUpAPage: function(expandselection)
  {
    this.moveRowCursorUp(expandselection, false, 5);
  }

, moveCursorDownAPage: function(expandselection)
  {
    this.moveRowCursorDown(expandselection, false, 5);
  }

, moveRowCursorUp: function(expandselection, toggle, distance)
  {
    if (!distance)
      distance = 1;

    var new_cursorrow;
    if (expandselection)
      new_cursorrow = this.range_end_idx; // manipulate the current range (make smaller or larger) at the current cursor position
    else
      new_cursorrow = Math.min(this.range_start_idx, this.range_end_idx); // escape to above our range (when not expanding using shift anymore)

    if (distance == 1)
      new_cursorrow = this.datasource.getSelectableRowBefore(new_cursorrow);
    else // find the first selectable row between where we want to be and our cursor position
      new_cursorrow = this.datasource.getSelectableRowAfter(new_cursorrow - distance < 0 ? -1 : new_cursorrow - distance);

    if (new_cursorrow == -1)
      return; // nothing more to select below us

    this.setCursorRow(new_cursorrow);

    this.updateSelection(this.cursorrow, false, true, expandselection, toggle);
  }

, moveRowCursorDown: function(expandselection, toggle, distance)
  {
    if (!distance)
      distance = 1;

    var range_bottom_row = Math.max(this.range_start_idx, this.range_end_idx);

    var new_cursorrow;
    if (expandselection)
      new_cursorrow = this.range_end_idx;
    else
      new_cursorrow = Math.max(this.range_start_idx, this.range_end_idx);

    if (distance == 1)
      new_cursorrow = this.datasource.getSelectableRowAfter(new_cursorrow);
    else // find the first selectable row between where we want to be and our cursor position
      new_cursorrow = this.datasource.getSelectableRowBefore(new_cursorrow + distance > this.numrows ? this.numrows : new_cursorrow + distance);

    if (new_cursorrow == -1)
      return; // nothing more to select below us

    this.setCursorRow(new_cursorrow);

    this.updateSelection(this.cursorrow, false, true, expandselection, toggle);
  }

, clickSelectRowByNumber:function(event, rownum, forceselected, immediate_select)
  {
    this.updateSelection(rownum, forceselected, immediate_select, event.shift, $wh.hasEventCopyKey(event));
    this.scrollRowIntoView(rownum, false);
  }

, updateSelection: function(rownum, forceselected, immediate_select, expandselection, toggle)
  {
    if(this.options.selectmode == 'none')
      return false;

    this.cursorrow = rownum;

    //console.log(this.cursorrow, this.range_start_idx, row.rownum, this.selectedidx);
    //console.info("updateSelection", rownum, forceselected, immediate_select, expandselection, toggle);

    this._startSelectionUpdateGroup();
    try
    {
      // click + shift expands
      if (rownum > -1 && expandselection && this.options.selectmode=='multiple')
      {
        // FIXME: improve performance by only clearing/updating the parts that may have changed
        if (this.range_start_idx > -1)
          this.datasource.setSelectionForRange(this.range_start_idx, this.range_end_idx, false);

        this.datasource.setSelectionForRange(this.range_start_idx > -1 ? this.range_start_idx : 0, rownum, true);

        this.range_end_idx = rownum;

        return true;
      }

      // We started a new range (using a simple select or toggle select)
      // And shift+click or shift+arrowup/arrowdown will now use this range)
      this.range_start_idx = rownum;
      this.range_end_idx = this.range_start_idx; //-1; // no active range anymore

      if (rownum < 0)
      {
        if (!expandselection || this.options.selectmode != 'multiple')
          this.datasource.clearSelection(); //Negative rownumber clears selection

        return false;
      }

      if(!toggle)
      {
        this.datasource.clearSelection(); //simple clicks clear selection
        this.datasource.setSelectionForRange(rownum, rownum, true);
      }
      else if(this.options.selectmode == "multiple")
      {
        var srcrow = this.visiblerows[rownum];
        var status = srcrow.cells[this.selectedidx];
        this.datasource.setSelectionForRange(rownum, rownum, !status || forceselected);
      }
      else
      {
        // in single select mode ctrl+click either disables the selected row
        // or selects a new one
        var srcrow = this.visiblerows[rownum];
        var status = srcrow.cells[this.selectedidx];
        this.datasource.clearSelection(); //simple clicks clear selection

        if (!status)
          this.datasource.setSelectionForRange(rownum, rownum, true);
      }

      return true;
    }
    finally
    {
      this._finishSelectionUpdateGroup(immediate_select);
    }
}

, onContextMenuRow:function(event,row)
  {
    console.log("onContextMenuRow", event.shift, event.control, event.meta);
    if ($wh.isAllowNativeContextMenu(event))
      return;

    event.stop();

    // right mouse click
    // on selected row -> contextmenu for all currently selected rows
    // on a row that isn't selected -> act as normal selection (can be used with shift) + context menu
    var rownum = row.rownum;
    var srcrow = this.visiblerows[rownum];
    var status = srcrow.cells[this.selectedidx];

    if (status !== true) // not yet selected? select it now
    {
      this.clickSelectRowByNumber(event, row.rownum, false, true);

      srcrow = this.visiblerows[rownum];
      status = srcrow.cells[this.selectedidx];
    }

    if (status === true) // only show the contextmenu if the row on which we trigger the contextmenu was selectable
      this.fireEvent("contextmenu", event);
  }
, onContextMenuOther:function(event)
  {
    if ($wh.isAllowNativeContextMenu(event))
      return;

    event.stop();

    this._startSelectionUpdateGroup();
    this.datasource.clearSelection();
    this._finishSelectionUpdateGroup(true);

    this.fireEvent("contextmenu", event);
  }
, setupFromDatasource:function()
  {
    this.datacolumns = [];
    this.numrows = 0;
    this.cursorrow = -1;

    var structure = this.datasource.getDataStructure();
    this.selectedidx = structure.selectedidx;
    this.expandedidx = structure.expandedidx;
    this.depthidx = structure.depthidx;
    this.searchidx = structure.searchidx;
    this.highlightidx = structure.highlightidx;

    var dscolumns = structure.datacolumns;
    for(var i=0;i<dscolumns.length;++i)
    {
      var handler = dscolumns[i].render || null;
      if(handler && !handler.render)
        throw new Error("Column '" + col.title + "' has invalid 'handler' type");

      this.datacolumns.push(
          { title: dscolumns[i].title
          , src: dscolumns[i]
          , handler: handler
          , x: -1
          , y: 0
          , w: 1
          , h: 1
          , headernode: null
          , minwidth: $wh.ListColumn.minwidth
          , resizable: true
          });

      this.dragdatacolumns.push(
          { title: dscolumns[i].title
          , src: dscolumns[i]
          , handler: handler
          , x: -1
          , y: 0
          , w: 1
          , h: 1
          , headernode: null
          , minwidth: $wh.ListColumn.minwidth
          , resizable: true
          , dragcolumn: true
          });
    }

    this._setupColumns(structure.cols);
    this._setupRowLayouts(structure.rowlayout, structure.dragrowlayout);

    for(var i=0;i<this.cols.length;++i)
    {
      if (i != this.cols.length - 1 && this.cols[i].combinewithnext)
        continue;

      var col = this.datacolumns[this.cols[i].header];
      var headernode = new Element("span");

      if(col)
      {
        col.headernode = headernode;

        headernode.set('text', col.title);
        if (col.src.align == "right")
          headernode.setStyle("text-align", "right");
        headernode.addEvent("click", this.onHeaderClick.bind(this, i));
      }
      if(this.sortcolumn === this.cols[i].header)
        headernode.appendText(this.sortascending ? " (asc)" : " (desc)");

      this.listheader.adopt(headernode);
    }

    // fill the space above the space for the vertical scrollbar
    this.headerfiller = new Element("span");
    this.listheader.adopt(this.headerfiller);

    for(var i=1;i<this.cols.length;++i)
    {
      if (i != this.cols.length - 1 && this.cols[i].combinewithnext)
        continue;

      var splitnode = new Element('div', { "class": 'splitter'
                                          , "movable": true
                                          })
      splitnode.store('wh-ui-listview-split', { rightcolumn: i });
      this.listheader.adopt(splitnode);
    }

    this.node.toggleClass("flatview", !this.istreeview);
    this.node.toggleClass("treeview", this.istreeview);

    this.applyHeaderColumnWidths();
    this.applyDimensions();
  }

, _refreshColCalculation:function()
  {
    var pos = 0, dragpos = 0;
    for(var i=0;i<this.cols.length;++i)
    {
      this.cols[i].left = pos;
      this.cols[i].dragleft = dragpos;

      pos += this.cols[i].width;
      if (this.cols[i].indraglayout)
        dragpos += this.cols[i].width;

      this.cols[i].right = pos;
      this.cols[i].dragright = dragpos;
    }
  }

, _setupColumns:function(cols)
  {
    this.cols = [];
    this.lineheight = this.options.lineheight;

    this.istreeview = false;
    for(var i=0;i < cols.length;++i)
    {
      //console.log("col", i, "of", cols.length-1);
      var newcol = { width: cols[i].width || 50
                   , header: "header" in cols[i] ? cols[i].header : i
                   , left: 0
                   , right: 0
                   , dragleft: 0
                   , dragright: 0
                   , coupled_cols: []
                   , minwidth: Math.max(cols[i].minwidth || 0, $wh.ListColumn.minwidth)
                   , resizable: true
                   , indraglayout: cols[i].indraglayout
                   , combinewithnext: cols[i].combinewithnext
                   };

      // MARK WIP
      // compensate the minwidth and width of the first and last column
      // to compensate for their extra padding
      if (i == 0)
      {
        //console.log("minwidth of first column was " + newcol.width + ", updating to " + (newcol.width + this.options.lastcolumn_rightpadding));
        newcol.width += this.options.firstcolumn_leftpadding;
        newcol.minwidth += this.options.firstcolumn_leftpadding;
      }

      // MARK WIP
      if (i == cols.length-1)
      {
        //console.log("minwidth of last column was " + newcol.width + ", updating to " + (newcol.width + this.options.lastcolumn_rightpadding));
        newcol.width += this.options.lastcolumn_rightpadding;
        newcol.minwidth += this.options.lastcolumn_rightpadding;
      }

      this.istreeview = this.istreeview || ((newcol.header >= 0 && this.datacolumns[newcol.header].handler && this.datacolumns[newcol.header].handler.istree) || false);
      this.cols.push(newcol);
    }

    this._refreshColCalculation();
  }

  // Returns number of lines per row
, _setupRowLayoutCells:function(datacolumns, layout, dragmode)
  {
    // reset datacolumns x,y,w,h
    datacolumns.forEach(function(item) { item.x = -1; item.y = 0; item.w = 1; item.h = 1; });

    if(!layout || !layout.length) //no layout specified
    {
      for (var i=0;i<datacolumns.length && i < this.cols.length;++i)
      {
        datacolumns[i].x = i;

        if (datacolumns[i].handler)
        {
          var sizeinfo = datacolumns[i].handler.getSizeInfo(this, datacolumns[i].src, false);

          datacolumns[i].minwidth = this.cols[i].minwidth;
          datacolumns[i].resizable = sizeinfo.resizable;
        }
      }

      return 1;
    }
    else if (this.cols.length == 0)
    {
      return 1;
    }
    else
    {
      //console.log("Amount of columns: " + this.cols.length);

      var filldepth = [];
      for (var i=0;i<this.cols.length;++i)
        filldepth.push(0);

      // Dragmode only uses a subset of the columns. Make a mapping from 'virtual' columns to real columns fot that
      var colmapping = [];
      for (var i=0;i<this.cols.length;++i)
      {
        if (!dragmode || this.cols[i].indraglayout)
          colmapping.push(i);
      }
      colmapping.push(this.cols.length);

      for(var linenum=0;linenum<layout.length;++linenum)
      {
        var layoutline = layout[linenum];
        for (var j=0;j<layoutline.cells.length;j++)
        {
          var cellnum = layoutline.cells[j].cellnum;
          var cell = (cellnum >= 0 && cellnum < datacolumns.length) ? datacolumns[cellnum] : null;

          var rowspan = layoutline.cells[j].rowspan || 1;
          var colspan = layoutline.cells[j].colspan || 1;

          var startcol = 0;
          while(filldepth[startcol] > linenum && startcol < filldepth.length)
            ++startcol;

          //console.log("@" + linenum + "," + j, "startcol:", startcol);

          if(startcol >= filldepth.length)
          {
            console.error("Unable to find a free spot for cell #" + j + " on row #" + linenum);
            continue;
          }
          if(startcol + colspan >= colmapping.length)
          {
            console.error("Cell #" + j + " on row #" + linenum + " stretches beyond the end of the list");
            continue;
          }

          for (var k = 0; k < colspan; ++k)
            filldepth[startcol + k] = linenum + rowspan;

          if(cell)
          {
            cell.x = colmapping[startcol];
            cell.y = linenum;
            cell.w = colmapping[startcol + colspan ] - cell.x;
            cell.h = rowspan;
            cell.src.x = cell.x;
            cell.src.y = cell.y;
            cell.src.colspan = cell.w;
            cell.src.rowspan = rowspan;

            if (cell.handler)
            {
              var sizeinfo = cell.handler.getSizeInfo(this, cell.src, false);
              cell.resizable = sizeinfo.resizable;
              cell.minwidth = sizeinfo.minwidth;
            }
          }
        }
      }

      if (filldepth.length == 0)
      {
        console.error("Filldepth should not be 0 (Math.max will give us -Infinity");
        return 1;
      }
      /*
      console.log("Filldepth ", filldepth);
      console.info("Calculate rowheight is", Math.max.apply(null, filldepth) || 1);
      console.groupEnd();
      */
      return Math.max.apply(null, filldepth) || 1;
    }
  }

, _setupRowLayouts:function(layout, draglayout)
  {
    // Calculate list layout
    this.linesperrow = this._setupRowLayoutCells(this.datacolumns, layout, false);
    if(layout && layout.length)
      this._calculateRowLayoutColMinWidths();

    this._calculateCoupledColumns();

    this.node.toggleClass("singleline", this.linesperrow == 1);
    this.node.toggleClass("multiline", this.linesperrow > 1);
    this.rowheight = this.lineheight * this.linesperrow;

    this.draglinesperrow = this._setupRowLayoutCells(this.dragdatacolumns, draglayout, true);
    this.dragrowheight = this.lineheight * this.draglinesperrow;
  }

  /** Marks the left splits of two columns as coupled (they must move together)
  */
, _coupleColumns: function(left, right)
  {
    var left_cc = this.cols[left].coupled_cols;
    var right_cc = this.cols[right].coupled_cols;

    // Already array-coupled? (could test for left in right_cc, but this is faster)
    if (left_cc == right_cc)
      return;

    // Replace arrays of all users of right_cc column group with left_cc column group array
    for (var i = 0; i < right_cc.length; ++i)
    {
      var nr = right_cc[i];
      left_cc.push(nr);
      this.cols[nr].coupled_cols = left_cc;
    }
  }

, _calculateCoupledColumns: function()
  {
    // Reset coupling. Mark all splits as coupled to themselves
    this.cols.forEach(function(item, idx) { item.coupled_cols = [ idx ] });

    // Make sure coupled columns use the same coupled_cols arrays
    this.datacolumns.forEach(function(cell)
    {
      if (!cell.resizable)
      {
        var rightnr = cell.x + cell.w;
        if (rightnr >= this.cols.length) // Right-split? Change to 0, to indicate 'don't move'.
          rightnr = 0;

        this._coupleColumns(cell.x, rightnr);
      }
    }.bind(this));
  }

  /** Calculate the real minimum widths for all columns, in the face of colspans
  */
, _calculateRowLayoutColMinWidths: function()
  {
// FIXME:!!!! extra padding in left and right columns should be taken into account ... minwidth + leftsidepadding or rightsidepadding

    // Gather the datacolumns per start position, for easy access
    celllists = this.cols.map(function() { return []; });
    this.datacolumns.forEach(function(cell)
    {
      if (cell.x != -1)
        celllists[cell.x].push(cell);
    });

    // Per column, keep the minwidth it still needs to get, and the column where it needs to get it all
    var rows = [];
    for (var i = 0; i < this.linesperrow; ++i)
      rows.push({ minwidth: 0, until: -1 });

    // Process one column at a time
    this.cols.forEach(function(col, colidx)
    {
      // Administrate the cells that start at this column (minwidth they need to have, and nr of their last column)
      celllists[colidx].forEach((function(cell)
      {
        for (var rownr = cell.y; rownr < cell.y + cell.h; ++rownr)
        {
          rows[rownr].minwidth = cell.minwidth;
          rows[rownr].lastcolumn = cell.x + cell.w - 1;

          // make sure the extra space at the left doesn't make icon columns get into problems with their min width
          if (cell.x == 0)
            rows[rownr].minwidth += this.firstcolumn_leftpadding;

          // make sure the extra space at the left doesn't make icon columns get into problems with their min width
          if (cell.x == this.cols.length-1)
            rows[rownr].minwidth += this.lastcolumn_rightpadding;
        }
      }).bind(this));

      // Calculate the minwidth, by getting max of left minwidth for all columns that end at this column
      var minwidth = $wh.ListColumn.minwidth;
      rows.forEach(function(row) { if (row.lastcolumn == colidx && row.minwidth > minwidth) minwidth = row.minwidth; });
      col.minwidth = minwidth;

      // Adjust minwidth for the cols that end at a later column
      rows.forEach(function(row) { row.minwidth -= minwidth; });
    }.bind(this));
  }

, onHeaderClick:function(colidx, event)
  {
    var hdr = this.cols[colidx].header;
    var col = this.datacolumns[hdr];
    if(!col || !col.src.sortable)
      return;
//console.error(colidx,hdr,col);
    this.setSort(hdr, !(this.sortascending && this.sortcolumn == hdr));
    this.fireEvent("sortchange", { target: this, column: this.sortcolumn, colidx: hdr, ascending: this.sortascending });
  }
, applyColumnWidths:function()
  {
    this.applyHeaderColumnWidths();
    Object.each(this.visiblerows, this._applyRowColumnWidths.bind(this, this.datacolumns, false));
    Object.each(this.footerrows, this._applyRowColumnWidths.bind(this, this.datacolumns, false));
  }
, applyHeaderColumnWidths:function()
  {
    var total = 0;
    var splitterpositions = [];
    var childnr = 0;
    var colwidth = 0;

    var headernode;

    for(var i=0;i<this.cols.length;++i)
    {
      colwidth += this.cols[i].width;

      if (i != this.cols.length - 1 && this.cols[i].combinewithnext)
        continue;

      var headernode = this.listheader.childNodes[childnr];

      // MARK WIP
      if (i == 0)
      {
        headernode.addClass("leftside");
        //colwidth += this.options.firstcolumn_leftpadding;
      }

      // MARK WIP
      if (i == this.cols.length-1)
      {
        headernode.addClass("rightside");
        //colwidth += this.options.lastcolumn_rightpadding;
      }

      headernode.setStyle("width", colwidth);
      if (childnr != 0)
        splitterpositions.push(total);

      total += colwidth;
      colwidth = 0;
      ++childnr;
    }

    // make the last columnheader also take up the space above the space reserved for the vertical scrollbar
    var scrollx_space = this.getVerticalScrollbarSize(); //this.options.scrollx_space == null ? this.getVerticalScrollbarSize() : 0;
    if (scrollx_space > 0)
      this.headerfiller.setStyles({ "display": ""
                                  , "width":   scrollx_space
                                  });
    else
      this.headerfiller.setStyle("display", "none");

    splitterpositions.each(function(left, idx)
    {
      this.listheader.childNodes[childnr + 1 + idx].setStyle("left", left);
    }, this);
  }
, _applyRowColumnWidths:function(datacolumns, dragmode, visiblerow)
  {
    var outpos=0;
//    console.error(this.datacolumns,this.cols);

    for(var i=0;i<datacolumns.length;++i)
    {
      var col = datacolumns[i];
      if(col.x == -1)
        continue;

      var cell = visiblerow.node.childNodes[outpos];
      ++outpos;

      var sizes =
          { dragmode: dragmode
          , width: dragmode
                      ? this.cols[col.x + col.w - 1].dragright - this.cols[col.x].dragleft
                      : this.cols[col.x + col.w - 1].right - this.cols[col.x].left
          , left: dragmode ? this.cols[col.x].dragleft : this.cols[col.x].left

          , padleft:  4 // FIXME
          , padright: 4 // FIXME
//          , height: col.h * this.lineheight
//          , top: col.y * this.lineheight
          };

      if (this.options.cssheights !== true)
      {
        sizes.height = col.h * this.lineheight;
        sizes.top = col.y * this.lineheight;
      }

      // MARK WIP
      if (col.x == 0)
      {
        sizes.padleft = this.options.firstcolumn_leftpadding;
        cell.addClass("leftside");
      }

      // MARK WIP
      if (col.x == this.cols.length-1)
      {
        sizes.padright = this.options.lastcolumn_rightpadding;
        cell.addClass("rightside");
      }

//console.log(i, col, cell);
      if(col.handler)
        col.handler.applySizes(this, col.src, visiblerow, cell, sizes);
      else
        cell.setStyles(sizes);
    }
  }

, invalidateAllRows:function()
  {
    //ADDME can probably do better, but for now, simply destroy it all
    this.listbody.empty();
    this.visiblerows = {};

    this.datasource.sendNumRows();
    this.datasource.sendFooterRows();
  }

, requestAnyMissingRows:function()
  {
    //request any rows which should be visible but aren't yet.
    Object.each(this.visiblerows, function(value,key)
                {
                  if(key<this.firstvisiblerow || key > this.firstvisiblerow + this.numvisiblerows)
                  {
                    if(value.node)
                      value.node.destroy();
                    delete this.visiblerows[key];
                  }
                }.bind(this));

    //currently, simply requests all rows
    this.listbody.empty();

    for (var i=0;i<this.numvisiblerows;++i)
    {
      var inputrow = this.firstvisiblerow + i;
      if(inputrow >= this.numrows)
        break;

      this.datasource.sendRow(inputrow);
    }

    // FIXME: is this the right place to do this?
    if(this.options.disablescroll)
    {
      // prevent dummy (filler) rows from triggering a scrollbar
      // (also visually more clean to not show a scrollbar if there's nothing to show)
      //if (this.numrows >= this.numvisiblerows) // (the last visible row might only be partially visible, so this check isn't correct)
      if (this.numrows * this.rowheight >= this.bodyholderheight)
      {
        this.listbodyholder.setStyle("overflow-y", "scroll");
      }
      else
      {
        /* our dummy rows may cause a small overflow,
           so we have to emulate the effect of no-overflow
           (scrollbars disappearing and the element scrolling back to it's top)
        */
        this.listbodyholder.setStyle("overflow-y", "hidden");
        this.listbodyholder.scrollTop = 0;
      }
    }

    // generate dumym rows to be able to have a zebra stripes effect over the whole height of the list
    // even if there aren't enough rows to fill the whole height
    this.updateDummyRows();
  }

, applyDimensions:function()
  {
    if (this.options.debug)
      console.log("$wh.ListView #" + this.listcount + " - applyDimensions (size "+this.options.width+"x"+this.options.height+")");
//console.trace();

    var headerheight = this.options.hideheader ? 0 : this.options.headerheight;
    this.bodyholderheight = this.options.height - headerheight - (this.footerrows.length ? this.footerrows.length * this.rowheight + 2: 1);
    this.numvisiblerows = Math.ceil(this.bodyholderheight / this.rowheight) + 1;
//    console.error(this.numvisiblerows)

/*
console.log( "headerheight:", headerheight, " \n"
           , "bodyholderheight:", this.bodyholderheight, " \n"
           , "numvisiblerows:", this.numvisiblerows, " \n"
           , "rowheight:", this.rowheight, " (calced)\n"
           , "lineheight", this.lineheight, " (option)"
           , "linesperrow", this.linesperrow //    this.rowheight = this.lineheight * this.linesperrow;
           );
*/
    this.listheader.setStyle("height", headerheight - (parseInt(this.listheader.getStyle("padding-top")) || 0) - (parseInt(this.listheader.getStyle("padding-bottom")) || 0));
    this.node.setStyles({"width": this.options.width
                        ,"height": this.options.height
                        });
    if(this.bodyscroller)
    {
      this.bodyscroller.setContentDimensions(this.options.width //FIXME total column size
                                            ,this.numrows * this.rowheight
                                            );
      this.bodyscroller.setContainerDimensions(this.options.width //FIXME total column size
                                              ,this.bodyholderheight);
    }
    else
    {
      this.listbodyholder.setStyles({width: this.options.width //FIXME total column size
                                    ,height:this.bodyholderheight
                                    });
      this.listbody.setStyles({width:this.options.width //FIXME total column size
                              ,height: this.numrows * this.rowheight
                              });
    }

    //ADDME: scroll up if the number of rows dropped and the selection is now invisible?
    this.requestAnyMissingRows();
  }

, onFindAsYouType: function(key)
  {
// not working at the moment
return;

    // Don't activate search if we don't have a deactivation timeout or search column id
    if (this.options.searchtimeout <= 0 || this.searchidx < 0)
      return;

    // If we're already searching, clear the current deactivation timeout
    if (this.findingasyoutype)
      clearTimeout(this.findingasyoutype.timeout);
    else
    {
      // Activate search
      console.log("Activating find-as-you-type");
      this.findingasyoutype = { timeout: 0 //deactivation timeout
                              , search: "" //currently searching for this string
                              , currow: this.cursorrow + 1 //start searching in the row after the current row
                              };
    }
    // If a backspace was pressed, delete the last character, otherwise add the pressed character to the search string
    if (key == "backspace")
      this.findingasyoutype.search = this.findingasyoutype.search.substr(0, this.findingasyoutype.search.length - 1);
    else
      this.findingasyoutype.search += key;

//console.log(this.findingasyoutype.search);

    // Create a regular expression matching string beginning with the (escaped) search string, ignoring case
    var searchregex = new RegExp("^" + this.findingasyoutype.search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), "i");
    //console.log("looking for",searchregex);
    // Find the first row (starting at the current search row) where the searchidx cell matches the regular expression
    //for (var i = this.findingasyoutype.currow; i < this.visiblerows.length; ++i)
    for (var i = this.firstvisiblerow; i < this.firstvisiblerow; i++)
    {
      console.log(this.visiblerows[i].cells[this.searchidx]);

      if (this.visiblerows[i].cells[this.searchidx].match(searchregex))
      {
console.log("Match: ", this.visiblerows[i].cells[this.searchidx]);
        // This row matches, select it and store its rownum for the next search
        //this.clickSelectRow(null, this.visiblerows[i]);
        this.clickSelectRowByNumber(null, i, false);// this.visiblerows[i]);

        this.findingasyoutype.currow = this.visiblerows[i].rownum; //continue searching in the matching row
        break;
      }
    }
    // If we still have a search string, set the deactivation timeout, otherwise deactivate directly
    if (this.findingasyoutype.search.length)
      this.findingasyoutype.timeout = this.onStopFindAsYouType.delay(this.options.searchtimeout, this);
    else
      this.onStopFindAsYouType();
  }

, onStopFindAsYouType: function()
  {
    if (!this.findingasyoutype)
      return;

    console.log("Deactivating find-as-you-type");
    clearTimeout(this.findingasyoutype.timeout);
    this.findingasyoutype = null;
  }

});

})(document.id); //end mootools wrapper
require ('frameworks.mootools.core');
/*! LOAD: frameworks.mootools.core !*/

(function($) { //mootools wrapper

$wh.ListColumn = { minwidth: 10, cellpadding_x: 4 };

$wh.ListColumn.Base = new Class({
  istree: false
, initialize: function()
  {
  }

  /** Render data into a cell
      @param list
      @param columndef
      @param row
      @param cell Cell node
      @param data
  */
, render: function(list, columndef, row, cell, data, wrapped)
  {
  }

  /** Apply size styles to the cell
      @param cell
      @param sizestyles
      @cell sizestyles.width
      @cell sizestyles.height
      @cell sizestyles.left
      @cell sizestyles.top
  */
, applySizes: function(list, columndef, row, cell, sizestyles)
  {
    // !! don't read sizes here or try to detect overflow, because then whe'll trigger a page reflow for each list column cell
    //console.log(sizestyles, cell);
    cell.setStyles(sizestyles);
  }

, getSizeInfo: function(list, columndef, wrapped)
  {
    // test for == null matches null and undefined
    return { resizable: columndef.resizable == null ? true : columndef.resizable
           , minwidth:  columndef.minwidth == null ? $wh.ListColumn.minwidth : Math.max(columndef.minwidth, $wh.ListColumn.minwidth)
           };
  }
});

$wh.ListColumn.Text = new Class(
{ Extends: $wh.ListColumn.Base
, render: function(list, columndef, row, cell, data, wrapped)
  {
    if (!cell)
      throw new Error('no cell');

    cell.addClass("text"); // so CSS can apply ellipsis
    cell.set('text', data);
    if(columndef.align=='right')
      cell.setStyle('text-align','right'); //FIXME can we externalize alignment ? (ie not solve it in the columns themselvs)
  }
});

$wh.ListColumn.Email = new Class(
{ Extends: $wh.ListColumn.Base
, render: function(list, columndef, row, cell, address, wrapped)
  {
    if(address)
    {
      if (cell.firstChild)
      {
        cell.firstChild.href = "mailto:" + address;
        cell.firstChild.set('text', address);
      }
      else
      {
        new Element('a', { href: "mailto:" + address
                         , text: address
                         , "class": "text"
                         }).inject(cell);
      }

      if(columndef.align=='right')
        cell.setStyle('text-align','right');
    }
  }
});

$wh.ListColumn.URL = new Class(
{ Extends: $wh.ListColumn.Base
, render: function(list, columndef, row, cell, url, wrapped)
  {
    if(url) // FIXME: why? and should !url destroy a link if url was set before?
    {
      if (cell.firstChild)
      {
        cell.firstChild.href = url;
        cell.firstChild.set('text', url);
      }
      else
      {
        new Element('a', { href: url
                         , target: "_blank"
                         , text: url
                         , "class": "text"
                         }).inject(cell);
      }

      if(columndef.align=='right')
        cell.setStyle('text-align','right');
    }
  }
});

//ADDME It's not really a 'render' if we also handle click actions?

$wh.ListColumn.TreeWrapper = new Class(
{ Extends: $wh.ListColumn.Base
, istree: true
, expanderholderwidth: 12

, initialize:function(datasource, base)
  {
    this.datasource=datasource;
    this.base=base;
  }
, render: function(list, columndef, row, cell, data, wrapped)
  {
    //FIXME: proper expand images, only handle clicks on those
    //ADDME: central registration/click handling in listview, so we don't have to explicitly handle each image?

    var depth = row.cells[list.depthidx] || 0;
    var expanded = row.cells[list.expandedidx];

    var indentholder = cell.firstChild;
    var restholder = cell.childNodes[1];

    if (!indentholder)
    {
      indentholder = new Element("span", { styles: { "margin-left": depth * 16
                                                   , "display": row.dragrow ? "none" : "inline-block"
                                                   //, "text-align": "center" // if we center we get extra white space/padding to our left
                                                   , "width": 12
                                                   }
                                         , "class": "expander"
                                         , events: { "click": this.toggleRowExpander.bind(this,row,list.expandedidx,expanded) }
                                         }).inject(cell);
    }
    if(typeof expanded != 'boolean') //not expandable
      indentholder.setStyle("visibility","hidden");
    else
      indentholder.set('text', expanded == true ? "\u25BE" : "\u25B8");//"\u2935" : "\u2937";

    if (!restholder)
    {
      restholder = new Element("span", { styles: { "display": "inline-block"
                                                 }
                                       }).inject(cell);
    }
    this.base.render(list, columndef, row, restholder, data, true);
  }
, toggleRowExpander:function(row,cellidx,expanded,event)
  {
    event.stop();
    this.datasource.setCell(row.rownum, row.cells, cellidx, !expanded);
  }

, applySizes: function(list, columndef, row, cell, sizestyles)
  {
    // FIXME: this.parent is the same as this.base ??
    this.parent(list, columndef, row, cell, sizestyles);

    if (cell.childNodes[1]) // did we absorb another column type?
    {
      var depth = row.cells[list.depthidx] || 0;
      //console.log(sizestyles.padleft, sizestyles.padright, this.expanderholderwidth, depth * 16);
      sizestyles.width -= sizestyles.padleft + sizestyles.padright + this.expanderholderwidth + depth * 16;
      sizestyles.padleft = 0;
      sizestyles.padright = 0;

      this.base.applySizes(list, columndef, row, cell.childNodes[1], sizestyles);
    }
  }
});

$wh.ListColumn.CheckboxWrapper = new Class(
{ Extends: $wh.ListColumn.Base
, checkboxholderwidth: 20

, initialize:function(datasource, base)
  {
    this.datasource=datasource;
    this.base = base;
  }
, render: function(list, columndef, row, cell, data)
  {
    //FIXME: proper expand images, only handle clicks on those
    //ADDME: central registration/click handling in listview, so we don't have to explicitly handle each image?

    var checkboxholder = cell.firstChild;
    if (!checkboxholder)
    {
      checkboxholder = new Element("span", { styles: { "display": "inline-block"
                                                     , "width":   this.checkboxholderwidth
                                                     }
                                           }).inject(cell);
    }

    var checkbox = checkboxholder.firstChild;
    if (!checkbox)
    {
      checkbox = new Element("input", { type: "checkbox"
                                      , events: { "change": this.onInputChange.bind(this, list, row, columndef.checkboxidx) }
                                      }).inject(checkboxholder);
    }

    if(row.cells[columndef.checkboxidx] === null)
      checkbox.setStyle("visibility","hidden");
    else
    {
      checkbox.checked = row.cells[columndef.checkboxidx] != false;
      checkbox.disabled = typeof columndef.checkboxenabledidx != "undefined" && columndef.checkboxenabledidx != -1 && !row.cells[columndef.checkboxenabledidx] ? "disabled" : "";
    }

    var restholder = cell.childNodes[1];
    if (!restholder)
    {
      restholder = new Element("span", { styles: { "display": "inline-block"
                                                 }
                                       }).inject(cell);
    }
    this.base.render(list, columndef, row, restholder, data);
  }
, onInputChange:function(list, row, cellidx, event)
  {
    //FIXME need a setCell version that optionally supresses a sendRow
    this.datasource.setCell(row.rownum, row.cells, cellidx, event.target.checked == true);
    list.fireEvent("check", {target:list, row:row.cells, checkboxidx: cellidx});
  }

, applySizes: function(list, columndef, row, cell, sizestyles)
  {
    // FIXME: this.parent is the same as this.base ??
    this.parent(list, columndef, row, cell, sizestyles);

    if (cell.childNodes[1]) // did we absorb another column type?
    {
      sizestyles.width -= sizestyles.padleft + sizestyles.padright + this.checkboxholderwidth;
      sizestyles.padleft = 0;
      sizestyles.padright = 0;

      this.base.applySizes(list, columndef, row, cell.childNodes[1], sizestyles);
    }
  }
});

})(document.id); //end mootools wrapper
require ('wh.compat.base');
/*! LOAD: wh.compat.base !*/

(function($) { //mootools wrapper

$wh.ListDataSource = new Class(
{ list: null
, setListView:function(list)
  {
    this.list = list;
  }
, clearSelection:function()
  {
  }

  // FIXME: test
, getSelectableRowBefore: function(rownum)
  {
    if (this.list.length == 0)
      return -1;

    if (rownum < 1 || rownum > this.list.length)
    {
      console.error("Invalid row number");
      return -1;
    }

    return rownum - 1;

    /*
    rownum--;
    while (rownum > -1)
    {
      if (this.list[rownum].selectable)
        return rownum;

      rownum--;
    }

    return -1;
    */
  }

  // FIXME: test
, getSelectableRowAfter: function(rownum)
  {
    if (this.list.length == 0)
      return -1;

    if (rownum < this.list.length - 1)
      return rownum + 1;

    return -1; // no row found

    /*
    rownum++;

    var rowcount = this.flatrows.length;
    while (rownum < rowcount)
    {
      if (this.flatrows[rownum][0].selectable)
        return rownum;

      rownum++;
    }

    return -1;
    */
  }

, setSelectionForRange:function(startrow, lastrow, selected)
  {
  }
, startSelectionUpdateGroup: function()
  {
    // dummy
  }
, finishSelectionUpdateGroup: function()
  {
    // dummy
  }


//, sendNumRows: function() { }
, sendFooterRows: function()
  {

  }
});

})(document.id); //end mootools wrapper
