/* generated from Designfiles Public by generate_data_designfles */
require ('wh.rich.internal.domlevel');
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.net.url');
require ('wh.compat.dom');
/*! LOAD: wh.rich.internal.domlevel, frameworks.mootools.core, wh.compat.base, wh.net.url, wh.compat.dom !*/

if(!window.$wh.Rich) window.$wh.Rich={};

(function($) { //mootools wrapper

$wh.Rich.SelectionInterface = new Class(
{ Implements: [ Options ]

, doc: null
, node: null
, isiframe: null

  // ---------------------------------------------------------------------------
  //
  // Initialize
  //

, initialize: function(node)
  {
    this.node = node;
    this.doc = node.ownerDocument;

    // Determine whether the node is in an iframe relative to the run-location of this code
    this.isiframe = this.node.defaultView != window;
  }

  // ---------------------------------------------------------------------------
  //
  // Helper functions
  //

  /** Get the current selection
      @param getrange Whether to get a range too
      @return
      @cell return.selection Rangy Selection object
      @cell return.range Current selection range, Rangy Selection object (if requested with 'getrange' and available)
  */
, __getSelectionStuff: function(getrange)
  {
    // Rangy: http://code.google.com/p/rangy/wiki/RangySelection
    var selection = null;
    var range = null;
    try
    {
      // Try get the selection (may fail)
      selection = this.isiframe
          ? rangy.version > "1.2" ? rangy.getSelection(this.node) : rangy.getIframeSelection(this.node)
          : rangy.getSelection();

      if (selection && getrange && selection.rangeCount > 0)
        range = selection.getRangeAt(0);
    }
    catch(e) //assume no selection
    {
      if (selection)
        selection.detach();
      selection = null;
    }
    return { selection: selection, range: range };
  }

  /// Detach the selection & range objects
, __freeSelectionStuff: function(data)
  {
    if (data.range)
      data.range.detach();
    if (data.selection)
      data.selection.detach();
  }

  // ---------------------------------------------------------------------------
  //
  // Initialize
  //

  /** Returns the current selection in a $wh.Rich.Range object - if present. Even when having focus,
      it is not guaranteed that a selection exists.
  */
, getSelectionRange: function()
  {
    if (Browser.ie && Browser.version < 9)
    {
      var result = null;

      // Get the the current selection range
      var data = this.__getSelectionStuff(true);

      // If a range is present, convert to our range representation
      if (data.range)
        result = $wh.Rich.Range.fromRangyRange(data.range);

      // Cleanup
      this.__freeSelectionStuff(data);
      return result;
    }

    var selection = this.doc.getSelection();
    if (!selection || selection.rangeCount == 0)
      return null;

    var domrange = selection.getRangeAt(0);
    if($wh.Rich.rangelog & 1)
      console.log('got range', domrange.startContainer, domrange.startOffset, domrange.endContainer, domrange.endOffset);

    result = $wh.Rich.Range.fromDOMRange(domrange);
    if($wh.Rich.rangelog & 1)
      console.log('range', result.start.element, result.start.offset, result.end.element, result.end.offset);

    return result;
  }

  /** Sets the current selection to the range in a $wh.Rich.Range object
      @param range Range to select
  */
, selectRange: function(range)
  {
    if (!range)
      throw new Error("No range specified");
    if (!range.start.element || !range.end.element)
      throw new Error("Range start or end are not valid nodes");

    // IE8 specific workarounds
    if (Browser.ie && Browser.version < 9)
    {
      /* In IE8 Rangy has some cases it does wrong - caught by the test
         cases for base rte. This code passes the tests. TODO port back to rangy?

         Problems:
         - this code can't select only a <div contenteditable="false">, but places
           the cursors before the div. wontfix.
      */
      var textrange = this.doc.body.createTextRange();

      var copy = range.clone();
      if (!copy.start.parentIsElementOrFragmentNode())
        copy.start.moveToParent(false);
      if (!copy.end.parentIsElementOrFragmentNode())
        copy.end.moveToParent(true);

      var startpos = copy.start.clone();
      if (!startpos.parentIsElementOrFragmentNode())
        startpos.moveToParent(false, true);

      var endpos = copy.end.clone();
      if (!endpos.parentIsElementOrFragmentNode())
        endpos.moveToParent(false, true);

      // moveToElementText is the only functions that works
      // a bit relyably. If only you could select text nodes too...
      // Workaround inside text is inserting a node before it, set
      // positions with moveToElementText and adjust for offset in text

      if (startpos.equals(endpos))
      {
        var testnode = this.doc.createElement("span");
        testnode.innerHTML = "&#8203;";
        startpos.insertNode(testnode, [copy]);

        textrange.moveToElementText(testnode);
        textrange.setEndPoint('StartToEnd', textrange);

        if (endpos.element != copy.end.element)
          textrange.moveEnd('character', copy.end.offset);
        if (startpos.element != copy.start.element)
          textrange.moveStart('character', copy.start.offset);

        // Need to select before removing the node, that preserves
        // the selection better (otherwise it would move)
        textrange.select();

        testnode.parentNode.removeChild(testnode);
      }
      else
      {
        var testnode2 = this.doc.createElement("span");
        testnode2.innerHTML = "#";
        endpos.insertNode(testnode2, [copy]);

        var testnode = this.doc.createElement("span");
        testnode.innerHTML = "#";
        startpos.insertNode(testnode, [copy]);

        var textrange2 = this.doc.body.createTextRange();

        textrange.moveToElementText(testnode);
        textrange2.moveToElementText(testnode2);

        if (startpos.element != copy.start.element)
        {
          // Must move end - where the start is actually at is anyone's guess.
          // selecting the # and moving start +10 chars ends with range start <body><b><span>#</span><b>this (*here*)text a...
          textrange.moveEnd('character', copy.start.offset);
        }

        if (endpos.element != copy.end.element)
          textrange2.moveEnd('character', copy.end.offset);

        // Combine the textranges, and select. Need to do that before removing the
        // nodes, that preserves the selection better (otherwise it would move)

        // Copy the end of textrange to the start of textrange2
        // Don't use textrange (start=textrange.end,end=textrange2.end, that will misplace start)
        textrange2.setEndPoint('StartToEnd', textrange);
        textrange2.select();

        // Remove the childnodes - after the select!
        testnode.parentNode.removeChild(testnode);
        testnode2.parentNode.removeChild(testnode2);
      }
      return true;
    }

    var selection = this.doc.getSelection();
    if (!selection)
    {
      if($wh.Rich.rangelog & 1)
        console.log('have NO selection object');
      return false;
    }

    if($wh.Rich.rangelog & 1)
      console.log('have selection object', range.start, range.end);

    // Rangy sometimes fails on IE. This standard code passes the tests...
    var domrange = this.doc.createRange();
    domrange.setStart(range.start.element, range.start.offset);
    domrange.setEnd(range.end.element, range.end.offset);

    if($wh.Rich.rangelog & 1)
      console.log('SI selectRange dom result', domrange);

    selection.removeAllRanges();
    selection.addRange(domrange);

    if($wh.Rich.rangelog & 1)
      console.log('SI final selection', selection);

    // Don't detach the domrange. At least IE 10 needs it.
    return true;
  }
});

})(document.id); //end mootools wrapper
