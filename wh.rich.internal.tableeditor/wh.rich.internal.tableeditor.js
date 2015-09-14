/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.class.binds');
require ('wh.compat.base');
require ('wh.compat.dragdrop');
/*! REQUIRE: frameworks.mootools.core, frameworks.mootools.more.class.binds, wh.compat.base
    REQUIRE: wh.compat.dragdrop
!*/

if(!window.$wh.Rich) window.$wh.Rich={};

(function($)
{

/** @short Make a table's rows and columns resizable by dragging cell borders
*/
$wh.Rich.TableEditor = new Class(
{ Implements: [ Options ]
, Binds: [ "updateResizers", "_onResize", "_onResizing", "_onResized" ]

, node:  null
, node_win: null
, resizeholder: null
, columns: null
, colgroup: null
, numcolumns: 0
, numrows: 0
, resizers: []

, resizing: null
, updatetimeout: null

, options: { resizer_size: 9
           , placeholder_size: 5
           , resize_columns: true
           , resize_rows: true
           , resize_table: true
           }

  // ---------------------------------------------------------------------------
  //
  // Public API
  //

  /** @short Initialize the editor for a table using the given options
      @long To control the table cell sizes, this object will rewrite table dimensions
      @param node The table node
      @param containernode The container of the table node (normally the editor body node)
      @param options Editor options
      @cell options.resizer_size Width of the resizer areas
      @cell options.placeholder_size Width of the dragging placeholder
      @cell options.resize_columns Whether columns can be resized
      @cell options.resize_rows Whether rows can be resized
      @cell options.resize_table If columns and/or rows can be resized, whether the whole table can be resized as well
  */
, initialize: function(node, containernode, options)
  {
    this.node = $(node);
    if (this.node.nodeName.toUpperCase() != "TABLE")
      throw "TableEditor can only be used on table nodes";
    this.node_win = node.ownerDocument.window;
    this.containernode = $(containernode);

    this.setOptions(options);
    this.fixContentEditable = this.node.isContentEditable && !Browser.ie;
    this.reset.delay(1, this); // When called directly within domready, the table sizes may not have been applied correctly
    this.node.store("wh-tableeditor", this);
    this.node.addClass("wh-rtd-table");
  }

  /** @short Reinitialize the resizers, for example after the table structure has changed (they can be removed again using
             cleanup())
  */
, reset: function()
  {
    this.cleanup();

    // Don't do anything if there's nothing to resize
    if (!this.node || (!this.options.resize_columns && !this.options.resize_rows))
      return;

    this.numcolumns = 0;

    if (this.options.resize_columns)
    {
      // Generate a row with td's we'll use to measure the widths of the columns. Can't use the
      // colgroup cols for that
      if (this.columns)
        this.columns.destroy();

      this.columns = new Element("tfoot", { "class": "wh-tableeditor-resize-columns" })
                     .inject(this.node, "bottom")
                     .grab(new Element("tr"));
      this.node.getElements("> tbody > tr:first-child > *").each(function(td)
      {
        for (var i = 0; i < td.colSpan; ++i)
          this.columns.lastChild.grab(new Element("td", { styles: { "border-width": 0
                                                                  , "font-size": 0
                                                                  , "height": 0
                                                                  , "line-height": 0
                                                                  , "margin": 0
                                                                  , "outline": "none"
                                                                  , "padding": 0
                                                                  }
                                                        }));
      }, this);
      this.numcolumns = this.columns.lastChild.childNodes.length;
    }
    else
    {
      // Calculate the total number of columns
      this.node.getElements("> tbody > tr:first-child > *").each(function(td)
      {
        this.numcolumns += td.colSpan;
      });
    }

    // Keep track of spanned rows for each column
    var rowspans = [];
    for (var col = 0; col < this.numcolumns; ++col)
      rowspans.push(0);
    var trs = this.node.getElements("> tbody > tr");
    this.numrows = trs.length;
    trs.each(function(tr, row)
    {
      var cells = tr.getElements("th, td");
      var col = 0, cell = 0;
      while (col < this.numcolumns)
      {
        // Skip this column if it's spanned by a previous row
        if (rowspans[col] > 0)
        {
          // Decrease the rowspan in this column for the following row
          --rowspans[col++]; // Increments the col
        }
        else
        {
          // Store the absolute row and column index
          cells[cell].store("wh-pos", { row: row, col: col });

          // Set the remaining rowspan for all the columns this cell spans
          for (var s = 0; s < cells[cell].colSpan; ++s)
            rowspans[col++] = cells[cell].rowSpan - 1; // Increments the col
          // col is now the index of the column next to this cell

          // If this isn't the last column, add a column resizer
          if (this.options.resize_columns && col < this.numcolumns)
            this._createResizer(cells[cell], "col", col - 1);
          // If this isn't the last cell in this column, add a row resizer
          if (this.options.resize_rows && row + cells[cell].rowSpan < this.numrows)
            this._createResizer(cells[cell], "row", row + cells[cell].rowSpan - 1);
          // If this is the last cell in the first column, add a table resizer
          else if (this.options.resize_rows && this.options.resize_table && col == 1 && row + cells[cell].rowSpan == this.numrows)
            this._createResizer(cells[cell], "row", -1);

          ++cell;
        }
      }

      // If this is the first row, add a table resizer to the last cell
      if (this.options.resize_columns && this.options.resize_table && row == 0)
        this._createResizer(cells[cell - 1], "col", -1);
    }, this);

    // Measure current widths if we're going to let them be modified
    var widths;
    if (this.options.resize_columns)
      widths = this._getCurrentWidths();

    // Explicitly apply the tr height to each tr
    if (this.options.resize_rows)
      this.node.getElements("> tbody > tr").each(function(tr)
      {
        tr.setStyle("height", tr.getSize().y);
      });
    // Remove all widths from all other cells
    this.node.getElements("> tbody > tr > *").each(function(td)
    {
      if (this.options.resize_columns)
        td.erase("width").setStyle("width", "");
      if (this.options.resize_rows)
        td.erase("height").setStyle("height", "");
    }, this);

    if (this.options.resize_columns)
    {
      // Remove any colgroup
      this.node.getElements("> colgroup").dispose();
      // Create a new colgroup to reflect the column widths
      this.colgroup = new Element("colgroup", { "class": "wh-tableeditor-colgroup" });
      for (var i = 0; i < this.numcolumns; ++i)
        this.colgroup.grab(new Element("col"));
      this.colgroup.inject(this.node, "top");
      this._applyColumnWidths(widths);
    }

    // The container holding the resize nodes, absolute positioned at the top left corner of the table
    this.resizeholder = new Element("div", { "class": "wh-tableeditor-resize-holder"
                                           , "styles": { "position": "absolute" }
                                           }).inject(this.containernode, "before");
    this.resizeholder.store('wh-tableeditor', this);
    this.resizers.invoke("inject", this.resizeholder);

    this.updateResizers();
  }

  /** @short Update the resizer positions, for example after the table was resized by changing its contents
  */
, update: function()
  {
    // Reset timeout, try to avoid updates when typing
    clearTimeout(this.updatetimeout);

    // After a timeout, re-apply sizes to match the new content and update the resizers
    this.updatetimeout = (function()
    {
      // ADDME: could detect if widths or position changed, and only then update resizers

      // Explicitly apply the current widths
      if (this.options.resize_columns)
        this._applyColumnWidths(this._getCurrentWidths());

      // Explicitly apply the tr height to each tr
      if (this.options.resize_rows)
        this.node.getElements("> tbody > tr").each(function(tr)
        {
          tr.setStyle("height", tr.getSize().y);
        });

      this.updateResizers();
    }).delay(100, this);
  }

  /** @short Clean up any inserted nodes (they can be added again using reset())
  */
, cleanup: function()
  {
    // Destroy tfoot with column td's
    if (this.columns)
    {
      this.columns.destroy();
      this.columns = null;
    }

    // Move the table out of the resize holder and destroy the resize holder and resizers
    if (this.resizeholder)
    {
      this.resizeholder.eliminate("wh-tableeditor");
      this.resizeholder.destroy();
      this.resizeholder = null;
      this.resizers = [];
    }
  }

  /** @short If the table is still present in the DOM and editable
  */
, isActive: function()
  {
    return !!this.node.parentNode && this.node.isContentEditable;
  }

  /** @short Deactivate and remove the editor
  */
, destroy: function()
  {
    this.cleanup();
    this.colgroup = null;
    this.node.eliminate("wh-tableeditor");
    this.node = null;
  }

  /** @short Add one or more columns to the table
      @param td The column to insert the new columns after
      @param before Whether to add the columns before or after the td
      @param num The number of columns to add
      @param width The width of the new columns
  */
, insertColumns: function(td, before, num, width)
  {
    var table = td.getSelfOrParent("table");
    if (table != this.node)
      return;

    var col = td.retrieve("wh-pos").col;
    if (!before)
      col += (td.colSpan - 1);
    this._insertColumnsAt("test", col, before, num, width);
  }

  /** @short Add one or more rows to the table
      @param td The row to insert the new rows after
      @param before Whether to add the rows before or after the td
      @param num The number of rows to add
      @param width The width of the new rows
  */
, insertRows: function(td, before, num, width)
  {
    var table = td.getSelfOrParent("table");
    if (table != this.node)
      return;

    var row = td.retrieve("wh-pos").row;
    if (!before)
      row += (td.rowSpan - 1);
    this._insertRowsAt(row, before, num, width);
  }

  /** Immediately update the resizers (after table repositioning or content change)
  */
, updateResizers: function()
  {
    if (!this.resizeholder)
      return; // Not there yet...

    this.updatetimeout = clearTimeout(this.updatetimeout);

    // Get the position of the table within the container
    var tablecoords = this.node.getCoordinates(this.containernode);

    // Adjust for position of the container within its parent
    tablecoords.top += this.containernode.offsetTop;// - (subParentNodeOffset ? this.containernode.parentNode.offsetTop : 0);
    tablecoords.left += this.containernode.offsetLeft;// - (subParentNodeOffset ? this.containernode.parentNode.offsetLeft : 0);

    this.resizeholder.setStyles({ "top": tablecoords.top
                                , "left": tablecoords.left
                                });

    this.resizers.each(function(resizer)
    {
      // Get the position and size of the td for this resizer
      var td = resizer.retrieve("wh-td");

      // MooTools getCoordinates adjusts for border, don't want that.
      var coords =
          { height:       td.offsetHeight
          , width:        td.offsetWidth
          , left:         td.offsetLeft
          , right:        td.offsetLeft + td.offsetWidth
          , top:          td.offsetTop
          , bottom:       td.offsetTop + td.offsetHeight
          };

      if (resizer.hasClass("wh-tableeditor-resize-col"))
      {
        resizer.setStyles({ "height": coords.height + 1
                          , "left": coords.right
                          , "margin-left": -Math.floor(this.options.resizer_size / 2)
                          , "top": coords.top
                          , "width": this.options.resizer_size
                          , "z-index": 1
                          });
        if (this.options.resize_table && resizer.hasClass("wh-tableeditor-resize-table"))
          resizer.setStyle("height", tablecoords.height);
      }
      else if (resizer.hasClass("wh-tableeditor-resize-row"))
      {
        resizer.setStyles({ "height": this.options.resizer_size
                          , "left": coords.left
                          , "top": coords.bottom
                          , "margin-top": -Math.floor(this.options.resizer_size / 2)
                          , "width": coords.width + 1
                          , "z-index": 2
                          });
        if (this.options.resize_table && resizer.hasClass("wh-tableeditor-resize-table"))
          resizer.setStyle("width", tablecoords.width);
      }
    }, this);

    // Inject colgroups after delay, directly inserting causes some side-effects in RTE context
    if (this.options.resize_columns)
    {
      (function()
      {
        if (!this.node)
          return; // We've been destroyed
        this.colgroup.inject(this.node, "top");
        this.columns.dispose();
      }).delay(1, this);
    }
  }

  // ---------------------------------------------------------------------------
  //
  // Internal functions
  //

, _createResizer: function(td, dir, idx)
  {
    // idx holds the col or row that is being resized by this resizer, or is -1 if this resizer resizes the whole table
    var tableresizing = idx < 0;
    var resizer = new Element("div", { "class": "wh-tableeditor-resize-" + dir + (tableresizing ? " wh-tableeditor-resize-table" : "")
                                     , "styles": { "cursor": dir + "-resize"
                                                 , "position": "absolute"
                                                 }
                                     , "movable": true
                                     , "events": { "movestart": this._onResize
                                                 , "move": this._onResizing
                                                 , "moveend": this._onResized
                                                 }
                                     }).store("wh-td", td);

    resizer.contentEditable = "false";
    if (!tableresizing)
      resizer.store("wh-" + dir, idx);
    this.resizers.push(resizer);
  }

, _applyColumnWidths: function(widths)
  {
    // Calculate total width
    var totalwidth = 1; // border
    widths.each(function(width) { totalwidth += width; });
    this.node.style.width = totalwidth + "px";

    // Apply width to colgroups
    var cols = Array.slice(this.node.getElements("> colgroup > col"));
    cols.each(function(node, idx)
    {
      node.style.width = widths[idx] + "px";
    }, this);
  }

, _getCurrentWidths: function(extratds)
  {
    // Inject extra footer row we'll use to measure everything
    this.columns.inject(this.node, "bottom");

    // Query the current width of every cell in the footer row
    var measure_tds = Array.slice(this.columns.getElements('td'));
    var widths = measure_tds.map(function(node)
    {
      return node.getSize().x;
    }, this);

    // And remove the row
    this.columns.dispose();
    return widths;
  }

  /** Resize a set of columns
      @param leftidx Left column (negative to count from right, -1 for rightmost column)
      @param sizediff Amount of pixels to add to the left column
  */
, _resizeColumns: function(leftidx, sizediff)
  {
    // Get the current widths
    var widths = this._getCurrentWidths();

    if (leftidx < 0)
      leftidx = widths.length + leftidx;

    // We're resizing the cell at position idx and the cell next to it (idx + 1)
    var rightidx = leftidx == widths.length - 1 ? -1 : leftidx + 1;

    var shrinkidx = -1, growidx = -1;
    if (sizediff < 0)
    {
      shrinkidx = leftidx;
      growidx = rightidx;
      sizediff = -sizediff;
    }
    else
    {
      shrinkidx = rightidx;
      growidx = leftidx;
    }

    // sizediff is now the shrink of shrinkidx, always positive
    var realshrink = sizediff;

    if (shrinkidx != -1)
    {
      // Shrink the column with the requested amount
      var testwidths = widths.clone();
      testwidths[shrinkidx] -= sizediff;
      if (testwidths[shrinkidx] < 1)
        testwidths[shrinkidx] = 1;

      this._applyColumnWidths(testwidths);

      // See what the width really became (will be bounded by content)
      var testwidths = this._getCurrentWidths();

      // Apply the really possible shrink
      realshrink = widths[shrinkidx] - testwidths[shrinkidx];
    }

    if (shrinkidx != -1)
      widths[shrinkidx] -= realshrink;
    if (growidx != -1)
      widths[growidx] += realshrink;

    this._applyColumnWidths(widths);
    this.updateResizers();
  }

, _insertColumnsAt: function(dummy, idx, before, num, width)
  {
    if (idx < 0 || idx >= this.numcolumns || num <= 0)
      return;

    // Add the columns to the colgroup
    if (this.colgroup)
    {
      var refcol = this.colgroup.childNodes[idx];
      for (var i = 0; i < num; ++i)
        refcol.grab(new Element("col"/*, { styles: { "width": width }}*/), before ? "before" : "after");
    }

    var rowspans = [];
    for (var col = 0; col < this.numcolumns; ++col)
      rowspans.push(0);

    // Add the columns to the other table rows
    this.node.getElements("> tbody > tr").each(function(tr, row)
    {
      var cells = tr.getElements("th, td");
      var col = 0 // logical column
        , cell = 0; // actual cell within row
      while (col <= idx)
      {
        // Skip this column if it's spanned by a previous row
        if (rowspans[col] > 0)
        {
          // Decrease the rowspan in this column for the following row
          --rowspans[col++]; // Increments the col
        }
        else
        {
          for (var s = 1; col <= idx && s <= cells[cell].colSpan; ++s)
          {
            if (col == idx)
            {
              // This is the column we're inserting the new columns before or after. If the current cell is spanning into the
              // previous or next column, just increase the colspan, otherwise insert the columns
              if ((before && s > 1 && s <= cells[cell].colSpan) || (!before && s >= 1 && s < cells[cell].colSpan))
                cells[cell].colSpan += num;
              else
                for (var i = 0; i < num; ++i)
                  cells[cell].grab(new Element("td", { rowSpan: cells[cell].rowSpan }), before ? "before" : "after");
            }

            // Set the remaining rowspan for all the columns this cell spans
            rowspans[col++] = cells[cell].rowSpan - 1; // Increments the col
          }
          // col is now the index of the column next to this cell

          ++cell;
        }
      }
    }, this);

    this.numcolumns += num;
    this.reset();
  }

, _insertRowsAt: function(idx, before, num, height)
  {
    if (idx < 0 || idx >= this.numrows || num <= 0)
      return;

    var rowspans = [], rowspancells = [];
    for (var col = 0; col < this.numcolumns; ++col)
    {
      rowspans.push(0);
      rowspancells.push(null);
    }

    // Add the rows
    this.node.getElements("> tbody > tr").some(function(tr, row)
    {
      if (row > idx)
        return true; // Break out of 'some' loop

      var newtrs = [];
      if (row == idx)
      {
        for (var i = 0; i < num; ++i)
        {
          newtrs.push(new Element("tr", { styles: { "height": height }}));
          tr.grab(newtrs[i], before ? "before" : "after");
        }
      }

      var cells = tr.getElements("th, td");
      var col = 0 // logical column
        , cell = 0; // actual cell within row
      while (col < this.numcolumns)
      {
        // Skip this column if it's spanned by a previous row
        if (rowspans[col] > 0)
        {
          if (newtrs.length) // The new rows have been added
          {
            if (rowspancells[col])
            {
              if (!before && rowspans[col] == 1)
              {
                // We're adding after this row, and this cell doesn't span into the next row: Add a cell
                for (var i = 0; i < num; ++i)
                  newtrs[i].grab(new Element("td", { colSpan: rowspancells[col].colSpan }));
              }
              else
              {
                // Increase the rowspan in the spanning cell
                rowspancells[col].rowSpan += num;
              }
            }
          }

          // Decrease the rowspan in this column for the following row
          --rowspans[col++]; // Increments the col
        }
        else
        {
          if (newtrs.length) // The new rows have been added
          {
            if (before || cells[cell].rowSpan == 1)
            {
              // This cell doesn't span into the next row: Add a cell
              for (var i = 0; i < num; ++i)
                newtrs[i].grab(new Element("td", { colSpan: cells[cell].colSpan }));
            }
            else
            {
              // Increase the rowspan in the spanning cell
              cells[cell].rowSpan += num;
            }
          }
          // Set the remaining rowspan for all the columns this cell spans
          for (var s = 1; s <= cells[cell].colSpan; ++s)
          {
            rowspancells[col] = s == 1 ? cells[cell] : null;
            rowspans[col++] = cells[cell].rowSpan - 1; // Increments the col
          }
          // col is now the index of the column next to this cell

          ++cell;
        }
      }
    }, this);

    this.numrows += num;
    this.reset();
  }

  // ---------------------------------------------------------------------------
  //
  // Event handlers
  //

, _onResize: function(event)
  {
    event.stopPropagation(); //prevent this event from being handled by callers
    if (event.rightClick)
      return;

    // Check if we're dragging a resizer
    var resizer = $(event.target).getSelfOrParent("[movable]");
    var dir = resizer.hasClass("wh-tableeditor-resize-col") ? "col" : resizer.hasClass("wh-tableeditor-resize-row") ? "row" : null;
    if (!dir)
      return;
    // Check if this is a column resize
    var colresize = dir == "col";
    // Check if this is a table resize
    var tableresize = resizer.hasClass("wh-tableeditor-resize-table");

    // Calculate the resize bounds
    var cursize = this.node.getSize();
    var tempdiv = new Element("div").inject(this.node,"before");
    var maxsize = tempdiv.getSize();
    tempdiv.destroy();
    var maxpos = { x: tableresize ? maxsize.x : cursize.x
                 , y: tableresize ? Number.MAX_VALUE : cursize.y
                 };

    // Read the resizer's position
    var pos =
        { x:    resizer.style.left.toInt()
        , y:    resizer.style.top.toInt()
        };

    // Create the resize placeholder we're actually dragging
    var placeholder = new Element("div", { "class": "wh-tableeditor-resize-placeholder"
                                         , "styles": { "height": colresize ? cursize.y : this.options.placeholder_size
                                                     , "left": colresize ? pos.x : 0
                                                     , "margin-left": colresize ? -Math.floor(this.options.placeholder_size / 2) : 0
                                                     , "position": "absolute"
                                                     , "top": colresize ? 0 : pos.y
                                                     , "margin-top": colresize ? 0 : -Math.floor(this.options.placeholder_size / 2)
                                                     , "width": colresize ? this.options.placeholder_size : cursize.x
                                                     , "z-index": 3
                                                     }
                                         }).inject(this.resizeholder);

    // Store the resizing state
    this.resizing = { orgpos: pos
                    , maxpos: maxpos
                    , resizer: resizer
                    , placeholder: placeholder
                    , colresize: colresize
                    , tableresize: tableresize
                    };
  }

, _onResizing: function(event)
  {
    if (!this.resizing)
      return;

    // Update the resize placeholder's position
    if (this.resizing.colresize)
      this.resizing.placeholder.setStyle("left", Math.max(Math.min(this.resizing.orgpos.x + event.moved.x, this.resizing.maxpos.x - this.options.placeholder_size), 0));
    else
      this.resizing.placeholder.setStyle("top", Math.max(Math.min(this.resizing.orgpos.y + event.moved.y, this.resizing.maxpos.y - this.options.placeholder_size), 0));
  }

, _onResized: function(event)
  {
    if (!this.resizing)
      return;

    // No longer needed
    this.resizing.placeholder.destroy();

    if (this.resizing.tableresize)
    {
      if (this.resizing.colresize)
      {
        this._resizeColumns(-1, event.moved.x);
      }
      else
      {
        // Get the tr we're resizing
        var resizetr = this.node.getElements("> tbody > tr:last-child")[0];

        // Resize the column
        resizetr.setStyle("height", Math.max(resizetr.getStyle("height").toInt() + event.moved.y, 0));

        // See how much it's reduced in width and apply the current size
        var height = resizetr.getSize().y;
        resizetr.setStyle("height", height);

        this.updateResizers();
      }
    }
    else
    {
      if (this.resizing.colresize)
      {
        // We're resizing the cell at position idx and the cell next to it (idx + 1)
        var idx = this.resizing.resizer.retrieve("wh-col");

        this._resizeColumns(idx, event.moved.x);
      }
      else
      {
        // We're resizing the row at position idx and the row next to it (idx + 1)
        var idx = this.resizing.resizer.retrieve("wh-row");

        // If moving up, the upper row is shrinking, otherwise the lower row is shrinking
        var shrinkidx = event.moved.y < 0 ? idx : idx + 1;
        var otheridx = event.moved.y < 0 ? idx + 1 : idx;
        var shrinkheight = event.moved.y;
        if (shrinkheight < 0)
          shrinkheight = -shrinkheight;

        // Get the tr's we're resizing
        var trs = this.node.getElements("> tbody > tr");
        var shrinktr = trs[shrinkidx];
        var othertr = trs[otheridx];

        // Get the total height of the two affected rows
        var total = shrinktr.getStyle("height").toInt() + othertr.getStyle("height").toInt();

        // Resize the shrinking row
        shrinktr.setStyle("height", Math.max(shrinktr.getStyle("height").toInt() - shrinkheight, 0));

        // See how much it's reduced in height and size the other row accordingly
        var height = shrinktr.getSize().y;
        shrinktr.setStyle("height", height);
        othertr.setStyle("height", total - height);

        this.updateResizers();
      }
    }
    this.resizing = null;
  }
});

$wh.Rich.TableEditor.extend(
{ getEditorForNode: function(node)
  {
    return node.retrieve("wh-tableeditor") || null;
  }
});

})(document.id);
