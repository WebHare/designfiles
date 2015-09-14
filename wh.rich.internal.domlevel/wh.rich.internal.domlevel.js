/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.rangy13');
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.compat.dom');
/*! LOAD: frameworks.rangy13, frameworks.mootools.core, wh.compat.base, wh.compat.dom !*/

if(!window.$wh.Rich) window.$wh.Rich={};

rangy.config.alertOnFail=false; //prevent Rangy frmo complaining about missing document.body - that actually happens when location.href early redirects and we don't want that alert..

(function($) { //mootools wrapper

var useBRAsBlockFill = !Browser.ie || Browser.version >= 11;
var segmentBreakAlwaysVisible = !useBRAsBlockFill;

/** Class that gathers undo/redo items
*/
$wh.Rich.UndoItem = new Class(
{
  Implements: Events
, ancestor: null // needed for debugging
, items: []
, finished: false

, initialize: function(ancestor)
  {
    this.ancestor = ancestor;
  }

, addItem: function(undo, redo)
  {
    if (this.finished)
      throw new Error("Undo item already finished, can't add more items");

    var item = { undo: undo, redo: redo };
    this.items.push(item);
    this.fireEvent('itemadded', item);
  }

, finish: function()
  {
    this.finished = true;
  }

, undo: function()
  {
    //console.log('UNDO pre: ', $wh.Rich.getStructuredOuterHTML(this.ancestor, null, true));
    for (var i = this.items.length - 1; i >= 0; --i)
    {
      this.items[i].undo();
      //console.log('undo after item ' + i + ":", $wh.Rich.getStructuredOuterHTML(this.ancestor, null, true));
      this.fireEvent('statechange', { pos: i });
    }
  }

, redo: function()
  {
    //console.log('REDO pre: ', $wh.Rich.getStructuredOuterHTML(this.ancestor, null, true));
    this.fireEvent('state', { pos: 0 });
    for (var i = 0; i < this.items.length; ++i)
    {
      this.items[i].redo();
      //console.log('redo after item ' + i + ":", $wh.Rich.getStructuredOuterHTML(this.ancestor, null, true));
      this.fireEvent('statechange', { pos: i + 1});
    }
  }

});

$wh.Rich.Dom = new Class(
{
});

// Static functions
$wh.Rich.Dom.extend(
{ // ---------------------------------------------------------------------------
  //
  // Helper functions
  //

  /** Returns whether a node matches a filter
      @param node Node to test
      @param filter Filter to execute. True is returned for the different types of filter when:
                string: nodeName is equal (case insensitive)
                array: contains lowercase nodeName
                function: filter(node) returns TRUE
  */
  isNodeFilterMatch: function(node, filter)
  {
    if (!node)
      throw "No node in isNodeFilterMatch";
    if (typeOf(filter) == "array")
      return filter.contains(node.nodeName.toLowerCase());
    if (typeof filter == "string")
      return node.nodeName.toLowerCase() == filter.toLowerCase();
    return filter(node);
  }

, applyPreserveFunc: function(preserve, func)
  {
    // Eliminate duplicates, double corrections mess up a lot of stuff
    var list = [];
    (preserve || []).each(function(item){list.combine(item.getContainedLocators())});
    //*
    list.each(func);
    /*/ // Enable this to get better debugging of preserve functions
    console.log('Apply preserve func', func);
    list.each(function(item)
      {
        if (item.id)
          console.log('pre  ' + (typeof item.id=="undefined"?'':'$'+item.id+'/'+(item.cc||0)),item.element, item.offset, func);
        func(item);
        if (item.id)
        {
          item.cc = (item.cc||0)+1;
          console.log('post ' + (typeof item.id=="undefined"?'':'$'+item.id+'/'+item.cc), item.element, item.offset);
        }
      });
    //*/
    return list;
  }

  // ---------------------------------------------------------------------------
  //
  // Public API - testing & finding
  //

  /** Returns the number of childnodes/characters in a node (that's the locator offset that points past
      all contained content
  */
, getNodeChildCount: function(element)
  {
    var offset;
    if (element.nodeType == 1 || element.nodeType == 11)
      return element.childNodes.length; // for element nodes, document fragments, etc
    else
      return element.nodeValue ? element.nodeValue.length : 0; // for text nodes
  }

  /** Searches for a parent with a specific nodename (or test function). Stops testing after ancestor has been encountered.
      (ancestor may be returned)
      @param node Node to start at
      @param filter Filter to use (see isNodeFilterMatch for types of filters)
      @param maxancestor Node to stop at (no parent of the ancestor will be given back,
  */
, findParent: function(node, filter, maxancestor)
  {
    for(;node;node=node.parentNode)
    {
      if (this.isNodeFilterMatch(node, filter))
        return node;
      if (node === maxancestor)
        break;
    }
    return null;
  }

  /** Returns whether ancestor is an ancestor of child (or equal to child)
      @param ancestor Possible ancestor
      @param child Node to test
  */
, isAncestorOf: function(ancestor, child)
  {
    if (!ancestor)
      throw "Invalid (null) argument for ancestor to isAncestorOf";
    if (!child)
      throw "Invalid (null) argument for child to isAncestorOf";
    while (child && child != ancestor)
      child = child.parentNode;
    return child == ancestor;
  }

  /** Returns whether ancestor is an proper ancestor of child (not equal to child)
      @param ancestor Possible ancestor
      @param child Node to test
  */
, isProperAncestorOf: function(ancestor, child)
  {
    if (!ancestor)
      throw "Invalid (null) argument for ancestor to isProperAncestorOf";
    if (!child)
      throw "Invalid (null) argument for child to isProperAncestorOf";
    if (child == ancestor)
      return false;
    return this.isAncestorOf(ancestor, child);
  }

  /// Returns whether a node is a block element
, isNodeBlockElement: function(node)
  {
    var uname = node.nodeName.toUpperCase();

    var isBlockElement =
        [ 'ADDRESS', 'BLOCKQUOTE', 'CENTER', 'DIV', 'DL', 'FIELDSET', 'FORM', 'H1'
        , 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'ISINDEX', 'MENU', 'OL', 'P', 'PRE', 'TABLE', 'UL'
          //FIXME: the following tags must be treated as block elements too, make another func for that instead of misusing this one
        , 'DD', 'DT', 'FRAMESET', 'LI', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR' ].indexOf(uname) != -1;

    return isBlockElement;
  }

  /// Returns whether a node is a block element that's always visible
, isNodeAlwaysVisibleBlockElement: function(node)
  {
    var uname = node.nodeName.toUpperCase();

    // Look out, in FF LI is visible when empty, but not editable!
    var list = !useBRAsBlockFill
        ? [ 'ADDRESS', 'BLOCKQUOTE', 'CENTER', 'DIV', 'DL', 'FIELDSET', 'FORM', 'H1'
          , 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'ISINDEX', 'MENU'/*, 'OL'*/, 'P', 'PRE', 'TABLE'/*, 'UL'*/
            //FIXME: the following tags must be treated as block elements too, make another func for that instead of misusing this one
          , 'DD', 'DT', 'FRAMESET', 'LI', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR' ]
        : [ 'ADDRESS', 'BLOCKQUOTE'/*, 'CENTER', 'DIV'*/, 'DL', 'FIELDSET', 'FORM'/*, 'H1'*/
          , /*'H2', 'H3', 'H4', 'H5', 'H6', 'HR', */'ISINDEX', 'MENU'/*, 'OL', 'P', 'PRE'*/, 'TABLE'/*, 'UL'*/
            //FIXME: the following tags must be treated as block elements too, make another func for that instead of misusing this one
          , 'DD', 'DT', 'FRAMESET', 'LI', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR' ];

    return list.indexOf(uname) != -1;
  }

  /// Returns whether a node required a br when empty to make it visible (and editable for Firefox)
, doesNodeRequireFillingWhenEmpty: function(node)
  {
    return useBRAsBlockFill ? this.doesNodeRequireInterchangeFillingWhenEmpty(node) : false;
  }


  /// Returns whether a node is a block element that's always visible
, doesNodeRequireInterchangeFillingWhenEmpty: function(node)
  {
    // LI is visible, but not editable in firefox when empty.
    var list =
          [ /*'ADDRESS', 'BLOCKQUOTE',*/ 'CENTER', 'DIV'/*, 'DL', 'FIELDSET', 'FORM'*/, 'H1'
          , 'H2', 'H3', 'H4', 'H5', 'H6', 'HR'/*, 'ISINDEX', 'MENU', 'OL'*/, 'P'/*, 'PRE', 'TABLE'/*, 'UL'*/
            //FIXME: the following tags must be treated as block elements too, make another func for that instead of misusing this one
          /*, 'DD', 'DT', 'FRAMESET'*/, 'LI'/*, 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR' */];

    var uname = node.nodeName.toUpperCase();
    return list.indexOf(uname) != -1;
  }

, isNodeSplittable: function(node)
  {
    if (node.nodeType != 1)
      return true;
    if (node.className && node.className.split(' ').indexOf('wh-rtd-embeddedobject') != -1)
      return false;
    var uname = node.nodeName.toUpperCase();
    return uname != 'BR'
        && uname != 'AREA'
        && uname != 'LINK'
        && uname != 'IMG'
        && uname != 'PARAM'
        && uname != 'HR'
        && uname != 'INPUT'
        && uname != 'META'
        && uname != 'COL';
  }

  /** When locator points to segmentbreak (<br> or '\r', '\n'), see if the next position
      is a block boundary. If so, the break isn't visible (except on IE8 and lower)
      Assumes locator points at a real segment boundary.
  */
, getInvisibleSegmentBreakRange: function(locator, maxancestor)
  {
    if (segmentBreakAlwaysVisible)
      return null;

    var orglocator = locator;
    locator = locator.clone();

    // Might be a '\r\n' in white-space: pre (ADDME test if "\r""\n" would also work)
    if (!locator.parentIsElementOrFragmentNode && locator.element.nodeValue.substr(locator.offset, 2) == '\r\n')
      locator.offset += 2;
    else
      ++locator.offset;
    var pastbreak = locator.clone();

    var res2 = locator.scanUpStream(maxancestor, { whitespace: true });
    if (res2.type == 'outerblock' || res2.type == 'innerblock')
      return new $wh.Rich.Range(orglocator, pastbreak);

    return null;
  }

  /** Get the range around the locator where the cursor would be displayed at the same visual position. <del>If placed
      after the last br in a blockon non-ie, autocorrected to range before br.</del>
      @return
      @cell return.valid Whether the cursor could be placed here
      @cell return.down Downstream locator position
      @cell return.downres scanDownStream result for the downstream position
      @cell return.up Upstream locator position
      @cell return.upres scanUpStream result for the upstream position
  */
, getVisualEquivalenceRangeInBlock: function(maxancestor, locator, correctpastlastbr)
  {
    /* Whitespace handling table: (inv: invalid, norm: normal, ign: ignore whitespace)
       inv* Invalid, ignore whitespace handling on IE

       UP:      outer outer/av inner br   visiblec
    DOWN:      +-----+--------+-----+----+--------+
      outer    |INV  |N/A     |INV  |IGN |IGN     |
      outer/av |N/A  |IGN     |INV  |IGN |IGN     |
      inner    |INV  |INV     |INV  |IGN |IGN     |
      br       |INV* |INV*    |INV* |IGN |IGN     |
      visiblec |IGN  |IGN     |IGN  |IGN |NORM    |
               +-----+--------+-----+----+--------+
    */

    var down = locator.clone();
    var downres = down.scanDownStream(maxancestor, { whitespace: true });

    var up = locator.clone();
    var upres = up.scanUpStream(maxancestor, { whitespace: true });

    //console.log('gverib scanres', whitespacehandling, $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator, up: up, down: down }));

    // br before block isn't visible on non-IE browsers. Move to before BR.
    if (correctpastlastbr && (useBRAsBlockFill && downres.type == 'br' && upres.blockboundary))
    {
      --down.offset;
      up = down.clone();
      upres = downres;

      downres = down.scanUpStream(maxancestor, { whitespace: true });
    }

    // Determine the position in the table above
    var whitespacehandling;
    if (downres.visiblecontent && upres.visiblecontent)
      whitespacehandling = 'normal';
    else if (downres.visiblecontent || upres.visiblecontent || upres.type == 'br' || (downres.type == 'br' && !useBRAsBlockFill))
      whitespacehandling = 'ignore';
    else if (upres.type == 'outerblock' && upres.alwaysvisible && downres.type == 'outerblock' && downres.alwaysvisible)
      whitespacehandling = 'ignore';
    else
      whitespacehandling = 'invalid';

    //console.log('gverib ', whitespacehandling, $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator, up: up, down: down }));
    //console.log(downres, upres);

    var valid = whitespacehandling != 'invalid';
    if (whitespacehandling == 'normal')
    {
      // Normal whitespace handling
      // xx       x<>x
      // x| x     x<> x
      // x |x     x <>x
      // x |x     x <>x
      // x|  x    x<>  x
      // x | x    x < >x
      // x  |x    x < >x
      // x|   x    x<>   x
      // x |  x    x <  >x
      // x  | x    x <  >x
      // x   |x    x <  >x

      // Locator that will point after first whitespace (x |  x), but only if it is left of current locator
      var lastfoundwhitespace = locator.clone();
      var lastfoundwhitespaceres = null;

      var downw = locator.clone();
      while (true)
      {
        var downwres = downw.scanDownStream(maxancestor, {}); // stop at blocks & whitespace

        if (downwres.type == 'whitespace')
        {
          lastfoundwhitespace.assign(downw);
          lastfoundwhitespaceres = downwres;
          --downw.offset;
        }
        else
          break;
      }

      //console.log('verb within norm', $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator, up: up, down: down, lastfoundwhitespace: lastfoundwhitespace, downw: downw }));

      if (!lastfoundwhitespaceres)
      {
        // No whitespace before, can't ignore the whitespace after. Rescan.
        up.assign(down);
        upres = up.scanUpStream(maxancestor, {});
      }
      else
      {
        down.assign(lastfoundwhitespace);
        downres = lastfoundwhitespaceres;
      }
    }

    //console.log('gverb result, valid:', valid, $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator, up: up, down: down, lastfoundwhitespace: lastfoundwhitespace, downw: downw }));

    return { valid: valid, down: down, downres: downres, up: up, upres: upres };
  }

, getVisualEquivalenceRange: function(maxancestor, locator)
  {
    //console.log('gver pre', $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator }));

    var inunsplittableblock = false;
    var elt = locator.element;
    while (elt != maxancestor)
    {
      if (!$wh.Rich.Dom.isNodeSplittable(elt))
      {
        var down = $wh.Rich.Locator.newPointingTo(elt);
        var up = $wh.Rich.Locator.newPointingAfter(elt);

        var res =
          { down: down
          , downres: down.scanDownStream(maxancestor, { whitespace: true, blocks:true ,li: true })
          , up: up
          , upres: up.scanUpStream(maxancestor, { whitespace: true, blocks:true ,li: true })
          };
        //console.log('gver unsplit res', $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator, locator: locator, down: res.down, up: res.up }));
        return res;
      }
      elt = elt.parentNode;
    }

    // Don't autocorrect <br>|<p>a to |<br><p>a, chrome does <br><p>|a in concordance with following rules.
    var res = this.getVisualEquivalenceRangeInBlock(maxancestor, locator, false);
    //console.log('gver imm res', $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator, locator: locator, down: res.down, up: res.up }));
    if (res.valid)
      return res;

    /* Between inner/outer block boundaries, there is no valid cursor position.

       It seems that chrome first searches forward in the current block element until visible content,
       then backwards in current block, then forwards over current document, then backwards over full
       document.

       If the downres type is a 'br', we must be in non-ie, but first need to look to the right. When looking
       downstream, we need to skip the <br>
    */

    // Skip downstream <br> if present
    if (res.downres.type == 'br')
      --res.down.offset;

    // Get the current block
    var block = this.findParent(locator.element, $wh.Rich.Dom.isNodeBlockElement, maxancestor) || maxancestor;

    for (var i = 0; i < 2; ++i)
    {
      // Scan upstream in the round 1: current block, round 2: entire document
      var upcopy = res.up.clone();
      var upres = res.up.scanUpStream(block, { whitespace: true, blocks: true });

      if (!upcopy.equals(res.up))
      {
        res = this.getVisualEquivalenceRangeInBlock(maxancestor, res.up, true);
        if (res.valid)
          return res;
      }

      // Scan upstream in the round 1: current block, round 2: entire document
      var downcopy = res.down.clone();
      var downres = res.down.scanDownStream(block, { whitespace: true, blocks: true });
      //console.log('gver downres', i, $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator, locator: locator, down: res.down, up: res.up, upcopy: upcopy, downres: downres }));

      if (!downcopy.equals(res.down) || i == 1)
      {
        res = this.getVisualEquivalenceRangeInBlock(maxancestor, res.down, true);
        if (res.valid || i == 1)
          return res;
      }

      // Early out
      if (block == maxancestor)
        break;

      block = maxancestor;
    }

    return this.getVisualEquivalenceRangeInBlock(maxancestor, res.up, true);
  }

  // ---------------------------------------------------------------------------
  //
  // Public API - DOM manipulation
  //

  /** Splits a data node at a locator, can keep other locators at the same position
      @param locator Place to split the data node
      @param preservelocators List of locators/ranges to keep valid.
      @param preservetoward 'start' or 'end' (default: 'end') Direction to move preserved locators at the splitpoint
      @return Locator pointing to new element
  */
, splitDataNode: function(locator, preservelocators, preservetoward, undoitem)
  {
    if (preservetoward && ![ 'start', 'end' ].contains(preservetoward))
      throw "Illegal preservetoward value '" + preservetoward + "'";

    // Clone locator, so its presence in preservelocators won't mess up stuff during the applyPreserveFunc
    locator = locator.clone();

    var oldvalue = locator.element.nodeValue;

    var newnode = rangy.dom.splitDataNode(locator.element, locator.offset);

    if (undoitem)
      undoitem.addItem(
        this._undoSplitDataNode.bind(this, locator.element, oldvalue, newnode, '', true),
        this._redoSplitDataNode.bind(this, locator.element, locator.element.nodeValue, newnode, newnode.nodeValue, true));

    // Correct preservelocators for the node split
    this.applyPreserveFunc(preservelocators, this._correctForNodeSplit.bind(this, locator, newnode, preservetoward == 'start'));

    return $wh.Rich.Locator.newPointingTo(newnode);
  }

, _undoSplitDataNode: function(oldelt, oldeltval, newelt, neweltval, handlenewelt)
  {
    oldelt.nodeValue = oldeltval;
    newelt.nodeValue = neweltval;
    if (handlenewelt)
      newelt.parentNode.removeChild(newelt);
  }

, _redoSplitDataNode: function(oldelt, oldeltval, newelt, neweltval, handlenewelt)
  {
    oldelt.nodeValue = oldeltval;
    newelt.nodeValue = neweltval;
    if (handlenewelt)
      oldelt.parentNode.insertBefore(newelt, oldelt.nextSibling);
  }

  /** Splits an element node at a locator, can keep other locators at the same position
      @param locator Place to split the element node
      @param preservelocators List of locators/ranges to keep valid.
      @param preservetoward 'start' or 'end' (default: 'end') Direction to move preserved locators at the splitpoint
      @return Locator pointing to new element
  */
, splitElement: function(locator, preservelocators, preservetoward, undoitem)
  {
    if (preservetoward && ![ 'start', 'end' ].contains(preservetoward))
      throw "Illegal preservetoward value '" + preservetoward + "'";

    // Clone locator, so its presence in preservelocators won't mess up stuff during the applyPreserveFunc
    locator = locator.clone();

    // Create result locator, point to element after locator.element
    var result = $wh.Rich.Locator.newPointingTo(locator.element);
    ++result.offset;

    // Create the new node, and insert it in the dom
    var newnode = locator.element.cloneNode(false);
    result.insertNode(newnode, null, undoitem);

    // Move all nodes past locator to the new node (use Array.slice, childNodes in iframe has no mootools!)
    var tocopy = Array.slice(locator.element.childNodes, locator.offset);
    $wh.Rich.Dom.appendNodes(tocopy, newnode);

    if (undoitem)
      undoitem.addItem(
        this._undoSplitElement.bind(this, locator.element, tocopy, newnode),
        this._redoSplitElement.bind(this, locator.element, tocopy, newnode));

    // Correct preservelocators for the node split
    this.applyPreserveFunc(preservelocators, this._correctForNodeSplit.bind(this, locator, newnode, preservetoward == 'start'));

    return result;
  }

, _undoSplitElement: function(oldelt, nodes, newelt)
  {
    $wh.Rich.Dom.appendNodes(nodes, oldelt);
  }

, _redoSplitElement: function(oldelt, nodes, newelt)
  {
    $wh.Rich.Dom.appendNodes(nodes, newelt);
  }

  /** Corrects this locator for changes made when splitting a node
      @param splitlocator Position where the split was made
      @param newnode New node, that received the contents of the parent node after the split position.
  */
, _correctForNodeSplit: function(splitlocator, newnode, towardstart, tocorrect)
  {

//    console.log(' cfns', '$'+locator.id, locator.element, locator.offset, '$'+splitlocator.id, splitlocator.element, splitlocator.offset);
    if (tocorrect.element == splitlocator.element && (towardstart ? tocorrect.offset > splitlocator.offset : tocorrect.offset >= splitlocator.offset))
    {
      // console.log(' move to new element');
      tocorrect.element = newnode;
      tocorrect.offset -= splitlocator.offset;
    }
    else if (tocorrect.element == splitlocator.element.parentNode && tocorrect.offset > rangy.dom.getNodeIndex(splitlocator.element))
    {
      // console.log(' move to nextsibling');
      // Correct for extra inserted node
      ++tocorrect.offset;
    }
  }

  /** Split the dom in-place beneath an ancestor node for a list of locators.
      For every split part, locators pointing to the start and the end of the fragment are provided
      (but only if the fragments had any elements)
      @param ancestor Ancestor node
      @param splitpoints Points to split the locators on
      @cell splitpoints.locator
      @cell splitpoints.toward 'start'/'end'
      @param preservelocators Optional list of locators/ranges to preserve
      @return Array of Range objects, describing the space betweent the splitpoints (all with parent = ancestor)
  */
, splitDom: function(ancestor, splitpoints, preservelocators, undoitem)
  {
    if (!ancestor)
      throw "No ancestor in splitdom!";

    //console.log('Splitdom pre ', ancestor, $wh.Rich.getStructuredOuterHTML(ancestor, splitpoints));
    //console.log('Splitdom pre  preserve', $wh.Rich.getStructuredOuterHTML(ancestor, preservelocators));

    if ([3,4].contains(ancestor.nodeType))
      throw "splitDom ancestor must be an element";

    var orgp = preservelocators;

    // Copy the preservelocators array, we have some extra locators to preserve
    preservelocators = Array.slice(preservelocators || []);
    var resultlocators = [];

    // Move the splitpoints as far up to their ancestor as possible, to avoid unnecessary splits. Done in 2
    // steps because the initial ascend step influences the preservelocators.
    for (var i = 0; i < splitpoints.length; ++i)
    {
      var orglocator = splitpoints[i].locator;
      splitpoints[i].locator = splitpoints[i].locator.clone();

      // Move locator as far toward ancestor as possible, so we can avoid splitting off empty elements
      splitpoints[i].locator.ascend(ancestor, splitpoints[i].toward === 'end');

      var preservetoward = splitpoints[i].preservetoward = splitpoints[i].preservetoward || 'end';
      if (!['start','end'].contains(preservetoward))
        throw "Illegal preservetoward value '" + preservetoward + "'";

      var cmp = splitpoints[i].locator.compare(orglocator);
      if (cmp < 0)
      {
        // Correct preservelocators for the node split
        this.applyPreserveFunc(preservelocators, this._correctForSplitLocatorMove.bind(this, splitpoints[i].locator, orglocator, preservetoward == 'start', splitpoints[i].locator));
        splitpoints[i].preservetoward = 'start';
      }
      else if (cmp > 0)
      {
        // Correct preservelocators for the node split
        this.applyPreserveFunc(preservelocators, this._correctForSplitLocatorMove.bind(this, orglocator, splitpoints[i].locator, preservetoward == 'end', splitpoints[i].locator));
        splitpoints[i].preservetoward = 'end';
      }
    }

    //console.log('Splitdom pre adj ', ancestor, $wh.Rich.getStructuredOuterHTML(ancestor, splitpoints));
    //console.log('Splitdom pre adj preserve', $wh.Rich.getStructuredOuterHTML(ancestor, preservelocators));

    /* Go from back to front, so the cloned nodes don't interfere with earlier locators
       The locators that point to the split parts are inserted into resultlocators
       (locators are formatted so that the element != ancestor, to avoid invaliding offsets within
        the ancestor)
    */
    for (var i = splitpoints.length - 1; i >= 0; --i)
    {
      var locator = splitpoints[i].locator; // no clone needed anymore

      // Move locator as far toward ancestor as possible, so we can avoid splitting off empty elements
      locator.ascend(ancestor, splitpoints[i].toward === 'end');

      // Within a text node? Split the text node, and retarget the locator to the new element
      if (locator.element.nodeType == 3)
        locator = this.splitDataNode(locator, preservelocators, splitpoints[i].preservetoward, undoitem);

      while (locator.element != ancestor)
        locator = this.splitElement(locator, preservelocators, splitpoints[i].preservetoward, undoitem);

      // Add to beginning to keep in correct order
      resultlocators.splice(0, 0, locator);

      // And make sure it is preserved with further modifications
      preservelocators.push(locator);
    }

    // Add locators to start and end of ancestor
    resultlocators.splice(0, 0, new $wh.Rich.Locator(ancestor));
    resultlocators.push(new $wh.Rich.Locator(ancestor, "end"));

    // Calculate all ranges
    var result = [];
    for (var i = 0; i < resultlocators.length - 1; ++i)
      result.push(new $wh.Rich.Range(resultlocators[i], resultlocators[i+1]));

    //console.log('Splitdom post preserve', $wh.Rich.getStructuredOuterHTML(ancestor, preservelocators));
    //console.log('Splitdom post', $wh.Rich.getStructuredOuterHTML(ancestor, result));

    return result;
  }

  /** Corrects this locator for the moving of the splitting locator upstream
      @param orglocator Original splitting locator
      @param locator
  */
, _correctForSplitLocatorMove: function(rangestart, rangeend, includebounds, newlocator, tocorrect)
  {
    if (tocorrect.compare(rangestart) > (includebounds?-1:0) && tocorrect.compare(rangeend) < (includebounds?1:0))
      tocorrect.assign(newlocator);
  }

  /** Combines a node and its previous sibling (moves all childnodes from node into its previousSibling)
      and keeps a list of locators as close as possible to their original place
      @param node
      @param preservelocators
      @return Place where stuff was inserted
  */
, combineNodeWithPreviousNode: function(node, preservelocators, undoitem)
  {
    if (!node)
      throw "Illegal parameter";

    var left = node.previousSibling;
    var right = node;

    if (!left)
      throw "Node has no previous sibling to combine with";

    return this.combineNodes(new $wh.Rich.Locator(left, "end"), right, preservelocators, undoitem);
  }

, _correctForNodeCombine2: function(right, new_rightlocator, tocorrect)
  {
    if (tocorrect.element == right)
      tocorrect.assign(new_rightlocator);
  }


  /** Moves the contents of a node into a previous node at the specified position, keeps a list of locators
      as close as possible to their original place. Keeps a list of locators/ranges as close as possible to
      their original place (locators between the insert position and the moved content are repositioned to
      the insertposition)
      @param insertlocator
      @param right
      @param preservelocators
      @return Node & locator where stuff was inserted & locator after place where stuff was inserted
  */
, combineNodes: function(insertlocator, right, preservelocators, undoitem)
  {
    insertlocator = insertlocator.clone();
    var left = insertlocator.element;

    if (left.nodeType != right.nodeType || ![1,3,4].contains(left.nodeType))
      throw "Left and right node not the same type (or no element or data node)";

/* TODO: express in terms of moveRangeTo, so we can remove the insanely complicated correct code below.
    var range = $wh.Rich.Range.fromNodeInner(right);
    var res = this.moveRangeTo(range, insertlocator, preservelocators);

    var new_rightlocator = res.movedforward ? res.insertlocator : res.afterlocator;

    // Correct preservelocators for the node combine (before actual changes!)
    this.applyPreserveFunc(preservelocators, this._correctForNodeCombine2.bind(this, right, new_rightlocator));

    var locator = $wh.Rich.Locator.newPointingTo(right);
    locator.removeNode(preservelocators.concat([ res.insertlocator, res.afterlocator ]));

    return { node: left, locator: res.insertlocator, afterlocator: res.afterlocator };
*/

    //console.log('combineNodes pre: ', $wh.Rich.getStructuredOuterHTML(left.ownerDocument, { insertlocator: insertlocator, range: $wh.Rich.Range.fromNodeInner(right) }, true));
    //console.log('combineNodes locators: ', $wh.Rich.getStructuredOuterHTML(left.ownerDocument, preservelocators, true));
    //for (var i = 0; locators && i < locators.length; ++i)
    //  console.log(' ', locators[i].element, locators[i].offset);

    //var leftend = new $wh.Rich.Locator(left, "end");
    var rightptr = $wh.Rich.Locator.newPointingTo(right);
    var afterrightptr = $wh.Rich.Locator.newPointingAfter(right);

    var moveforward = false;
    if (afterrightptr.compare(insertlocator) <= 0)
      moveforward = true;
    else if (rightptr.compare(insertlocator) < 0)
      throw "Can't move content inside removed node";

    // Correct preservelocators for the node combine (before actual changes!)
    this.applyPreserveFunc(preservelocators, this._correctForNodeCombine.bind(this, insertlocator, right, rightptr, afterrightptr, moveforward));

    var afterlocator = insertlocator.clone();
    if (left.nodeType == 1)
    {
      var pointednode = insertlocator.getPointedNode();

      var nodes = this.removeNodeContents(right);
      this.insertNodesAtLocator(nodes, insertlocator);
      afterlocator.offset += nodes.length;

      if (undoitem)
        undoitem.addItem(
          this.appendNodes.bind(this, nodes, right),
          this.insertNodesAtLocator.bind(this, nodes, insertlocator.clone()));
    }
    else
    {
      var oldvalue = left.nodeValue;
      var oldright = right.nodeValue;
      left.nodeValue = left.nodeValue.substr(0, insertlocator.offset) + right.nodeValue + left.nodeValue.substr(insertlocator.offset);
      afterlocator.offset += right.nodeValue.length;

      if (undoitem)
        undoitem.addItem(
          this._redoSplitDataNode.bind(this, left, oldvalue, right, oldright, false),
          this._undoSplitDataNode.bind(this, left, left.nodeValue, right, right.nodeValue, false));

    }

    rightptr = $wh.Rich.Locator.newPointingTo(right);
    rightptr.removeNode([ insertlocator, afterlocator ], undoitem);

    return { node: left, locator: insertlocator, afterlocator: afterlocator };
  }

  /** Corrects this locator for changes made when combining a node. Called before actual changes are made!
      @param appendlocator Place where childnodes of the removed node were placed
      @param newnode New node, that received the contents of the parent node after the split position.
  */
, _correctForNodeCombine: function(insertlocator, removednode, removedlocator, afterremovedlocator, moveforward, tocorrect)
  {
    // Correct the insert locator for removed node
    var corr_insertlocator = insertlocator;
    if (insertlocator.element == removedlocator.element && insertlocator.offset > removedlocator.offset)
    {
      corr_insertlocator = insertlocator.clone();
      --corr_insertlocator.offset;
    }

    if (tocorrect.element == removednode)
    {
      // Within the removed element? Adjust to new place relative to (corrected) insertlocator
      tocorrect.element = corr_insertlocator.element;
      tocorrect.offset += corr_insertlocator.offset;
      return;
    }

    // Within the removed nodes? No correction needed
    if (tocorrect.compare(removedlocator) > 0 && tocorrect.compare(afterremovedlocator) < 0)
      return;

    if (moveforward)
    {
      if (tocorrect.compare(afterremovedlocator) >= 0 && tocorrect.compare(insertlocator) <= 0)
      {
        tocorrect.assign(corr_insertlocator);
        tocorrect.offset += removednode.childNodes.length;
      }
      else if (tocorrect.element == insertlocator.element && tocorrect.offset >= insertlocator.offset)
      {
        var plus = tocorrect.offset - insertlocator.offset;
        tocorrect.assign(corr_insertlocator);
        tocorrect.offset += plus;
      }
      else if (tocorrect.element == removedlocator.element && tocorrect.offset > removedlocator.offset)
        --tocorrect.offset;
    }
    else
    {
      if (tocorrect.compare(removedlocator) <= 0 && tocorrect.compare(insertlocator) >= 0)
        tocorrect.assign(corr_insertlocator);
      else if (tocorrect.element == insertlocator.element && tocorrect.offset >= insertlocator.offset)
      {
        var plus = tocorrect.offset - insertlocator.offset;
        if (tocorrect.element == removedlocator.element && tocorrect.offset > removedlocator.offset)
          --plus;

        tocorrect.assign(corr_insertlocator);
        tocorrect.offset += plus + removednode.childNodes.length;
      }
      else if (tocorrect.element == removedlocator.element && tocorrect.offset > removedlocator.offset)
        --tocorrect.offset;
    }
  }

, moveRangeTo: function(range, insertlocator, preservelocators, undoitem)
  {
    console.warn('moveRangeTo is deprecated, use moveSimpleRangeTo');console.trace();
    return this.moveSimpleRangeTo(range, insertlocator, preservelocators, undoitem);
  }

, moveSimpleRangeTo: function(range, insertlocator, preservelocators, undoitem)
  {
    if (range.start.element != range.end.element)
      throw "moveRangeTo can only move a range with the start and end element the same";

    var rangeisnode = range.start.parentIsElementOrFragmentNode();
    if (rangeisnode != insertlocator.parentIsElementOrFragmentNode())
      throw "moveRangeTo can only move nodes to within elements & data to within data nodes";

    // Clone all locators, don't want the preserve functions to mess with them
    insertlocator = insertlocator.clone();
    var startlocator = range.start.clone();
    var endlocator = range.end.clone();

    // Keep the original, possibly need to correct for the removal of the nodes if in the same parent.
    orginsertlocator = insertlocator.clone();

    //console.log(range.start, range.end, insertlocator);

    //console.log('moveRangeTo pre: ', $wh.Rich.getStructuredOuterHTML($wh.Rich.Locator.findCommonAncestorElement(range.start, insertlocator), { insertlocator: insertlocator, range: range }, true));

    var moveforward = false;
    if (endlocator.compare(insertlocator) <= 0)
      moveforward = true;
    else if (startlocator.compare(insertlocator) < 0)
      throw "Can't move content inside removed node";//#1" + $wh.Rich.getStructuredOuterHTML($wh.Rich.Locator.findCommonAncestorElement(range.start, insertlocator), { insertlocator: insertlocator, range: range });


    // Correct insertlocator if needed. May only be used after range has been removed from the DOM!!
    if (insertlocator.element == startlocator.element && insertlocator.offset >= endlocator.offset)
      insertlocator.offset -= endlocator.offset - startlocator.offset;

    //console.log('remove pre1', $wh.Rich.getStructuredOuterHTML($wh.Rich.Locator.findCommonAncestorElement(startlocator, insertlocator), { nodes: nodes, startlocator_element: startlocator.element }));

    //console.log('#1', startlocator.element, preservelocators.contains(startlocator));

    // Correct preservelocators for the node combine (before actual changes!)
    this.applyPreserveFunc(preservelocators, this._correctForNodeMove.bind(this, startlocator, endlocator, orginsertlocator, insertlocator, moveforward));

    //console.log('#2', startlocator.element);
    //console.log(nodes);
    //console.log('remove pre2', $wh.Rich.getStructuredOuterHTML($wh.Rich.Locator.findCommonAncestorElement(startlocator, insertlocator), { nodes: nodes, startlocator_element: startlocator.element }));

    // Need the afterlocator and the insertlocator too, so copy
    var afterlocator = insertlocator.clone();

    if (rangeisnode)
    {
      // Remove the nodes from the range. After this, the correct insertlocator is valid
      var nodes = Array.slice(startlocator.element.childNodes, startlocator.offset, endlocator.offset);
      var oldafterlocator = afterlocator.clone();

      afterlocator = this.removeAndInsertNodesAtLocator(nodes, afterlocator);

      if (undoitem)
        undoitem.addItem(
          this.removeAndInsertNodesAtLocator.bind(this, nodes, startlocator),
          this.removeAndInsertNodesAtLocator.bind(this, nodes, oldafterlocator));
    }
    else
    {
      // Move data over from the original location to the new location
      var oldnode = startlocator.element;
      var newnode = insertlocator.element; // may be the same as oldnode!

      var oldnodeoldval = oldnode.nodeValue;
      var newnodeoldval = newnode.nodeValue;

      // First get the data to move, and remove it. Only after that, insertlocator is valid.
      var tomove = oldnode.nodeValue.substring(startlocator.offset, endlocator.offset);
      oldnode.nodeValue = oldnode.nodeValue.substr(0, startlocator.offset) + oldnode.nodeValue.substr(endlocator.offset);

      // insertlocator is now valid. Insert the data, adjust the afterlocator
      newnode.nodeValue = newnode.nodeValue.substr(0, insertlocator.offset) + tomove + newnode.nodeValue.substr(insertlocator.offset);
      afterlocator.offset += tomove.length;

      if (undoitem)
        undoitem.addItem(
          this._undoSplitDataNode.bind(this, oldnode, oldnodeoldval, newnode, newnodeoldval, false),
          this._redoSplitDataNode.bind(this, oldnode, oldnode.nodeValue, newnode, newnode.nodeValue, false));
    }

    return { insertlocator: insertlocator, afterlocator: afterlocator, movedforward: moveforward };
  }

, _correctForNodeMove: function(startlocator, endlocator, insertlocator, corr_insertlocator, moveforward, tocorrect)
  {
    if (tocorrect.element == startlocator.element)
    {
      // Between any of the moved nodes? Move to (corrected) insertlocator
      if (tocorrect.offset > startlocator.offset && tocorrect.offset < endlocator.offset)
      {
        //console.log(' between moved nodes');
        tocorrect.element = corr_insertlocator.element;
        tocorrect.offset = corr_insertlocator.offset + (tocorrect.offset - startlocator.offset);
        return;
      }
    }

    var startcompare = tocorrect.compare(startlocator);
    var endcompare = tocorrect.compare(endlocator);

    if (startcompare > 0 && endcompare < 0)
    {
      //console.log(' inside moved nodes');
      return; // Within the removed nodes? No correction needed
    }

    // Between the moved nodes and the insertposition? Move to start/end of newly inserted nodes
    if (moveforward)
    {
      if (endcompare >= 0 && tocorrect.compare(insertlocator) <= 0)
      {
        //console.log(' forward, between end and insertpoint');
        tocorrect.element = corr_insertlocator.element;
        tocorrect.offset = corr_insertlocator.offset + (endlocator.offset - startlocator.offset);
        return;
      }
    }
    else
    {
      if (startcompare <= 0 && tocorrect.compare(insertlocator) >= 0)
      {
        //console.log(' backward, between insertpoint and start');
        tocorrect.assign(corr_insertlocator);
        return;
      }
    }

    if (startlocator.element == insertlocator.element)
    {
      //console.log(' start.elt=insert.elt, no correction needed');
      return;
    }

    if (tocorrect.element == insertlocator.element)
    {
      if (tocorrect.offset > insertlocator.offset)
      {
        //console.log(' after inserted nodes', tocorrect.offset, insertlocator.offset, corr_insertlocator.offset);
        tocorrect.offset = corr_insertlocator.offset + (tocorrect.offset - insertlocator.offset) + (endlocator.offset - startlocator.offset);
        return;
      }
    }
    else if (tocorrect.element == endlocator.element)
    {
      if (tocorrect.offset >= endlocator.offset)
      {
        //console.log(' after removed nodes');
        tocorrect.offset -= endlocator.offset - startlocator.offset;
        return;
      }
    }
    //console.log(' no correction needed');
  }

, removeRange: function(range, insertlocator, preservelocators)
  {
    console.warn('removeRange is deprecated, use removeSimpleRange');console.trace();
    return this.removeSimpleRange(range, insertlocator, preservelocators);
  }

, removeSimpleRange: function(range, preservelocators, undoitem)
  {
    if (range.start.element != range.end.element)
      throw "removeRange can only remove a range with the start and end element the same";

    range = range.clone();

    var rangeisnode = range.start.parentIsElementOrFragmentNode();

    // Correct preservelocators for the node combine (before actual changes!)
    this.applyPreserveFunc(preservelocators, this._correctForRangeRemove.bind(this, range));

    var fragment = range.start.element.ownerDocument.createDocumentFragment();
    if (rangeisnode)
    {
      // Remove the nodes from the range
      var nodes = Array.slice(range.start.element.childNodes, range.start.offset, range.end.offset);
      for (var i = 0; i < nodes.length; ++i)
        fragment.appendChild(nodes[i]);

      if (undoitem)
        undoitem.addItem(
          this.removeAndInsertNodesAtLocator.bind(this, nodes, range.start),
          this.removeSimpleRange.bind(this, range));
    }
    else
    {
      // Just remove the data
      var oldnode = range.start.element;
      var oldvalue = oldnode.nodeValue;
      var tomove = oldnode.nodeValue.substring(range.start.offset, range.end.offset);
      oldnode.nodeValue = oldnode.nodeValue.substr(0, range.start.offset) + oldnode.nodeValue.substr(range.end.offset);
      fragment.appendChild(range.start.element.ownerDocument.createTextNode(tomove));

      // FIXME: bit too hacky!
      if (undoitem)
        undoitem.addItem(
          this._undoSplitDataNode.bind(this, oldnode, oldvalue, oldnode, oldvalue, false),
          this._redoSplitDataNode.bind(this, oldnode, oldnode.nodeValue, oldnode, oldnode.nodeValue, false));
    }

    return { fragment: fragment };
  }

, _correctForRangeRemove: function(range, tocorrect)
  {
    if (tocorrect.element == range.end.element && tocorrect.offset >= range.end.offset)
      tocorrect.offset -= range.end.offset - range.start.offset;
    else if (tocorrect.compare(range.start) > 0 && tocorrect.compare(range.end) < 0)
      tocorrect.assign(range.start);
  }

  /** Replaces a node with its contents
  */
, replaceNodeWithItsContents: function(node, preservelocators, undoitem)
  {
    var parent = node.parentNode;

//    console.log('RNWIC pre ', $wh.Rich.getStructuredOuterHTML(parent, preservelocators));
    var locator = $wh.Rich.Locator.newPointingTo(node);

    var nodes = this.removeNodeContents(node);
    this.insertNodesAtLocator(nodes, locator);

    if (undoitem)
      undoitem.addItem(
        this.removeAndInsertNodesAtLocator.bind(this, nodes, new $wh.Rich.Locator(node)),
        this.removeAndInsertNodesAtLocator.bind(this, nodes, locator));

    var nodelocator = $wh.Rich.Locator.newPointingTo(node);
    nodelocator.removeNode(null, undoitem);

    // Correct preservelocators for the node combine
    this.applyPreserveFunc(preservelocators, this._correctForReplaceWithChildren.bind(this, locator, node, nodes.length));
//    console.log('RNWIC post', $wh.Rich.getStructuredOuterHTML(parent, preservelocators));
  }

  /** Corrects the range for changes made when a node is replaced with its contents
      @param locator Locator of the removed node
      @param endlocator Locator of the end of inserted children (locator.element == endlocator.element)
      @param removednode Removed node
  */
, _correctForReplaceWithChildren: function(locator, removednode, childcount, tocorrect)
  {
    if (tocorrect.element == removednode) // Within the removed element? Adjust to new place within old element
    {
      tocorrect.element = locator.element;
      tocorrect.offset += locator.offset;
    }
    else if (tocorrect.element == locator.element && tocorrect.offset > locator.offset)
    {
      // Points to node that's nextsibling of right. Correct for right's removal, and the children insert
      tocorrect.offset = tocorrect.offset - 1 + childcount;
    }
  }

  /** Wraps the nodes point to by locator (and nodecount-1 of its siblings) in a new node, that is then
      inserted at that location
      @param Locator Locator pointing to node to wrap
      @param nodecount Nr of nodes to wrap
      @param newnode Node to replace the nodes with
      @param preservelocators Locators/ranges to preserve
  */
, wrapSimpleRangeInNewNode: function(range, newnode, preservelocators, undoitem)
  {
    if (range.start.element != range.end.element)
      throw "wrapSimpleRangeInNewNode only works with ranges where start element is equal to end element";

    // Preserve range too
    preservelocators = (preservelocators || []).concat(range);
    return this.wrapNodesInNewNode(range.start, range.end.offset - range.start.offset, newnode, preservelocators, undoitem);
  }


  /** Wraps the nodes point to by locator (and nodecount-1 of its siblings) in a new node, that is then
      inserted at that location
      @param Locator Locator pointing to node to wrap
      @param nodecount Nr of nodes to wrap
      @param newnode Node to replace the nodes with
      @param preservelocators Locators/ranges to preserver
  */
, wrapNodesInNewNode: function(locator, nodecount, newnode, preservelocators, undoitem)
  {
    //console.log('WNINN pre', $wh.Rich.getStructuredOuterHTML(locator.element, preservelocators, true), newnode);

    // Clone locator, so its presence in preservelocators won't mess up stuff during the applyPreserveFunc
    locator = locator.clone();

    nodes = Array.slice(locator.element.childNodes, locator.offset, locator.offset + nodecount);
    this.appendNodes(nodes, newnode);

    if (undoitem)
      undoitem.addItem(
        this.removeAndInsertNodesAtLocator.bind(this, nodes, locator.clone()),
        this.removeAndInsertNodesAtLocator.bind(this, nodes, new $wh.Rich.Locator(newnode)));

    locator.insertNode(newnode, null, undoitem);

    // Correct preservelocators for the node split
    this.applyPreserveFunc(preservelocators, this._correctForNodeWrap.bind(this, locator, nodecount, newnode));

    //console.log('WNINN post', $wh.Rich.getStructuredOuterHTML(locator.element, preservelocators, true));

    ++locator.offset;
    return locator;
  }

, _correctForNodeWrap: function(locator, childcount, newnode, tocorrect)
  {
    if (tocorrect.element == locator.element)
    {
      if (tocorrect.offset >= locator.offset)
      {
        if (tocorrect.offset <= locator.offset + childcount)
        {
          tocorrect.element = newnode;
          tocorrect.offset -= locator.offset;
        }
        else
          tocorrect.offset = tocorrect.offset - childcount + 1;
      }
    }
  }

  /** Removes all nodes in a tree that match a filter
  */
, removeNodesFromTree: function(node, filter, preservelocators, undoitem)
  {
    // FIXME: combine adjacesnt same (text)nodes

    var replaces = [];
    for (var i = 0; i < node.childNodes.length;)
    {
      var child = node.childNodes[i];
      if (this.isNodeFilterMatch(child, filter))
        this.replaceNodeWithItsContents(child, preservelocators, undoitem);
      else
      {
        this.removeNodesFromTree(child, filter, preservelocators, undoitem);
        ++i;
      }
    }
  }

   /** Removes nodes from a range, when the nodes to remove have already been split on the range
       boundaries
       @param ancestor Ancestor to start at
       @param range Range to remove nodes
       @param filter Filter function to test the nodes on, or nodename
       @param preservelocators Locators/ranges to preserver
  */
, removeNodesFromRangeRecursiveInternal: function(ancestor, range, filter, preservelocators, undoitem)
  {
    // FIXME: combine adjacesnt same (text)nodes

    var xstart = range.start.clone();
    xstart.ascend(ancestor, false, true);
    var xend = range.end.clone();
    xend.ascend(ancestor, true, true);

    //console.log('RNFRR local', $wh.Rich.getStructuredOuterHTML(ancestor, {xend:xend,xstart:xstart}));

    preservelocators = Array.slice(preservelocators || []);
    preservelocators.push(xend);

    while (!xstart.equals(xend))
    {
      // console.log(xstart.element, xstart.offset, xend.element, xend.offset);
      var node = xstart.getPointedNode();

      // Skip data nodes
      if ([3,4].contains(node.nodeType))
      {
        ++xstart.offset;
        continue;
      }

      if (this.isNodeFilterMatch(node, filter))
        this.replaceNodeWithItsContents(node, preservelocators, undoitem);
      else
      {
        var noderange = $wh.Rich.Range.fromNodeInner(node);
        var subrange = range.clone();
        subrange.intersect(noderange);

        if (subrange.equals(noderange))
          this.removeNodesFromTree(node, filter, preservelocators, undoitem);
        else
          this.removeNodesFromRangeRecursiveInternal(node, subrange, filter, preservelocators, undoitem)
        ++xstart.offset;
      }
    }

    //console.log('RNFRR end', $wh.Rich.getStructuredOuterHTML(ancestor));
  }

  /** Removes nodes that match a filter from a tree (but keeps their contents)
      @param range Range to remove the nodes from (is kept valid)
      @param maxancestor Ancestor to stop at
      @param filter Filter for nodes to remove (either string for nodename match or function)
      @param preservelocators Additional locators/ranges to preserve
  */
, removeNodesFromRange: function(range, maxancestor, filter, preservelocators, undoitem)
  {
    preservelocators = Array.slice(preservelocators || []);
    preservelocators.push(range);

    var ancestor;

    // console.log('RNFR start', $wh.Rich.getStructuredOuterHTML(maxancestor, range));

    // Is an ancestor of the range a match? If so, split the dom around the range and remove the node.
    while (true)
    {
      var ancestor = range.getAncestorElement();
      var typeparent = this.findParent(ancestor, filter, maxancestor);

      if (!typeparent || typeparent == maxancestor)
        break;

//      console.log('splitdom for ancestor! ' + this.xcount);
//      console.log('A locations ', $wh.Rich.getStructuredOuterHTML(maxancestor, {ancestor:ancestor,typeparent: typeparent,range:range}));

//      console.log('A split pre ', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, {ancestor:ancestor,typeparent: typeparent,range:range}));
      var parts = this.splitDom(typeparent.parentNode, [ { locator: range.start, toward: 'start' }, { locator: range.end, toward: 'end' } ], preservelocators, undoitem);
//      console.log('A split post', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, {typeparent: typeparent,range:range}));
//      console.log('A split post2', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, parts));

      var locator = parts[1].start.clone();

      var localpreserve = preservelocators.concat([ locator, parts[1].end ]);

      while (!locator.equals(parts[1].end))
      {
        var node = locator.getPointedNode();
//        console.log('A replace pre', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, {node:node, locator:locator}));
        ++locator.offset;
        this.replaceNodeWithItsContents(node, localpreserve, undoitem);
//        console.log('A replace post', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, {node:node, locator:locator}));
      }

      //
      range.start.assign(parts[1].start.clone());
      range.end.assign(locator);

//      console.log('ancestor splitdom done', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, {typeparent: typeparent,range:range}));
    }

    //
    while (true)
    {
      var typeparent = this.findParent(range.start.element, filter, ancestor);
      if (!typeparent)
        break;

//      console.log('L split pre ', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, orglocators));
      var parts = this.splitDom(typeparent.parentNode, [ { locator: range.start, toward: 'start' } ], preservelocators, undoitem);
//      console.log('L split post', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, orglocators));
      range.start.assign(parts[1].start);
    }

    while (true)
    {
      var typeparent = this.findParent(range.end.element, filter, ancestor);
      if (!typeparent)
        break;

//      console.log('R split pre ', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, orglocators));
      var parts = this.splitDom(typeparent.parentNode, [ { locator: range.end, toward: 'end' } ], preservelocators, undoitem);
//      console.log('R split post', $wh.Rich.getStructuredOuterHTML(typeparent.parentNode, orglocators));
      range.end.assign(parts[0].end);
    }

    this.removeNodesFromRangeRecursiveInternal(ancestor, range, filter, preservelocators, undoitem);

    // console.log('RNFR done', $wh.Rich.getStructuredOuterHTML(maxancestor, range));
  }

, canWrapNode: function(node, canwrapnodefunc, mustwrapnodefunc)
  {
    var mustanswer = mustwrapnodefunc && mustwrapnodefunc(node);
    var cananswer = !canwrapnodefunc || canwrapnodefunc(node);

    // console.log('canWrapNode', node, mustanswer, cananswer);
    return (mustwrapnodefunc && mustwrapnodefunc(node)) || (!canwrapnodefunc || canwrapnodefunc(node));
  }

, getWrappingSplitRoot: function(locator, ancestor, canwrapnodefunc, mustwrapnodefunc)
  {
    var node = locator.element;
    if ([3,4].contains(node.nodeType))
      node = node.parentNode;
    while (node != ancestor && this.canWrapNode(node, canwrapnodefunc, mustwrapnodefunc))
      node = node.parentNode;
    return node;
  }

, wrapRangeRecursiveInternal: function(range, ancestor, createnodefunc, canwrapnodefunc, mustwrapnodefunc, preservelocators, undoitem)
  {
//    console.log('WRRI start', $wh.Rich.getStructuredOuterHTML(ancestor, range));

    // Get the range of nodes we need to visit in the current ancestor
    var localrange = range.clone();
    localrange.start.ascend(ancestor, false, true);
    localrange.end.ascend(ancestor, true, true);

//    console.log('WRRI local', $wh.Rich.getStructuredOuterHTML(ancestor, localrange));

    // Make sure localrange.end is preserved!!!
    preservelocators = Array.slice(preservelocators || []);
    preservelocators.push(localrange.end);

    /* Iterate through the nodes. Collect wrappable nodes, wrap them when first unwrappable node
       is encountered, or after end of range. Iterate into unwrappable nodes
    */
    var wrapstart = localrange.start.clone();
    while (!localrange.start.equals(localrange.end))
    {
      // Text node or wrappable: goto next sibling
      var node = localrange.start.getPointedNode();
      if ([3,4].contains(node.nodeType) || this.canWrapNode(node, canwrapnodefunc, mustwrapnodefunc))
      {
        ++localrange.start.offset;
        continue;
      }

      // Current node is unwrappable. Wrap previous wrappebles (if present)
      if (!wrapstart.equals(localrange.start))
      {
        var newnode = createnodefunc();
        // console.log('call wninn1', preservelocators);
        this.wrapNodesInNewNode(wrapstart, localrange.start.offset - wrapstart.offset, newnode, preservelocators, undoitem);
        ++wrapstart.offset;
      }

      // Calculate subrange within node for iteration (localrange.constrainto(node)?)
      var noderange = $wh.Rich.Range.fromNodeInner(node);
      var subrange = range.clone();
      subrange.intersect(noderange);

      // Iterate into the node, and reset the start if the first wrappable node
      this.wrapRangeRecursiveInternal(subrange, node, createnodefunc, canwrapnodefunc, mustwrapnodefunc, preservelocators, undoitem);

      ++wrapstart.offset;
      localrange.start.assign(wrapstart);
    }

      // Wrap previous wrappebles (if present)
    if (!wrapstart.equals(localrange.start))
    {
      var newnode = createnodefunc();
      // console.log('call wninn2', preservelocators);
      this.wrapNodesInNewNode(wrapstart, localrange.start.offset - wrapstart.offset, newnode, preservelocators, undoitem);
    }

//    console.log('WRRI end', $wh.Rich.getStructuredOuterHTML(ancestor));
  }

, wrapRange: function(range, createnodefunc, canwrapnodefunc, mustwrapnodefunc, preservelocators, undoitem)
  {
//    console.log('wrapRange', range, createnodefunc, canwrapnodefunc, mustwrapnodefunc, preservelocators);

    // Make sure range is preserved too
    preservelocators = Array.slice(preservelocators || []);
    preservelocators.push(range);

    var range = range.clone();
//    range.descendToLeafNodes();

//    console.log('WR going split0', $wh.Rich.getStructuredOuterHTML(range.getAncestor() || range.start.element.ownerDocument, { loc: range.start }));
    var ancestor = range.getAncestorElement();
    if (mustwrapnodefunc)
    {
      while (mustwrapnodefunc(ancestor))
        ancestor = ancestor.parentNode;
    }

//    console.log('WR before presplits', $wh.Rich.getStructuredOuterHTML(ancestor, range));

//    console.log('WR going split1', $wh.Rich.getStructuredOuterHTML(ancestor, { loc: range.start }));
    var startroot = this.getWrappingSplitRoot(range.start, ancestor, canwrapnodefunc, mustwrapnodefunc);

//    console.log('WR startroot', $wh.Rich.getStructuredOuterHTML(ancestor, {startroot:startroot}));

//    console.log('WR going split2', $wh.Rich.getStructuredOuterHTML(startroot, { loc: range.start }));
    var parts = this.splitDom(startroot, [ { locator: range.start, toward: "end" } ], preservelocators.concat([range.end]), undoitem);

//    console.log('WR after start split', $wh.Rich.getStructuredOuterHTML(ancestor, parts));

    range.start.assign(parts[1].start);

    var endroot = this.getWrappingSplitRoot(range.end , ancestor, canwrapnodefunc, mustwrapnodefunc);
//    console.log('WR presplit', $wh.Rich.getStructuredOuterHTML(ancestor, {endroot:endroot, range: range}));

    parts = this.splitDom(endroot, [ { locator: range.end, toward: "start" } ], preservelocators.concat([range.start]), undoitem);

    range.end.assign(parts[0].end);

//    console.log('WR after presplits', $wh.Rich.getStructuredOuterHTML(ancestor, range));

    this.wrapRangeRecursiveInternal(range, ancestor, createnodefunc, canwrapnodefunc, mustwrapnodefunc, preservelocators, undoitem);
  }

  /** Combines adjacent nodes of with each other at a locator recursively
      @param locator Locator to the place to combine the nodes
      @param ancestor Ancestor node
      @param towardsend Direction to go (used when locator is placed within empty node)
      @param combinetest Test to check whether nodes. Can be nodeName, array of nodeNames or bool function. If false,
          only text nodes will be combined.
      @param preservelocators Locators/ranges to preserve the location of
   */
, combineWithPreviousNodesAtLocator: function(locator, ancestor, towardsend, combinetest, preservelocators, undoitem)
  {
    if (!this.isAncestorOf(ancestor, locator.element))
      throw new Error("Locator position problem");

    preservelocators = Array.slice(preservelocators || []);
    preservelocators.push(locator);

    locator = locator.clone();
    locator.ascend(ancestor, towardsend, false);

    while (locator.offset != 0)
    {
      if (!locator.parentIsElementOrFragmentNode() || locator.pointsPastChildrenEnd())
        break;

//      console.log(locator.element, locator.offset);

      var right = locator.getPointedNode();
      var left = right.previousSibling;

      if (right.nodeType != left.nodeType)
        break;

      // Always combine text/cdata nodes
      if (![3,4].contains(right.nodeType))
      {
        if (right.nodeType != 1)
          break;

        if (typeof combinetest == "function")
        {
          if (!combinetest(left, right))
            return;
        }
        else if (combinetest)
        {
          if (left.nodeName.toLowerCase() != right.nodeName.toLowerCase())
            break;
          if (typeof combinetest == "string")
          {
            if (left.nodeName.toLowerCase() != testfunc.toLowerCase())
              break;
          }
          else if (typeOf(combinetest) == "array")
          {
            if (!combinetest.contains(left.nodeName.toLowerCase()))
              break;
          }
          else
            throw "Illegal combinetest in combineWithPreviousNodesAtLocator";
        }
        else
          break;
      }

      var res = this.combineNodeWithPreviousNode(right, preservelocators, undoitem);
      locator = res.locator;
    }
  }

, hasNodeVisibleContent: function(node)
  {
    if (this.isNodeAlwaysVisibleBlockElement(node))
      return true;

    var locator = new $wh.Rich.Locator(node);
    var res = locator.scanUpStream(node, { whitespace: true });
    return res.type != 'outerblock';
  }

, usesBRAsBlockFill: function()
  {
    return useBRAsBlockFill;
  }

, debugToggleBlockFill: function()
  {
    useBRAsBlockFill = !useBRAsBlockFill;
    segmentBreakAlwaysVisible = !useBRAsBlockFill;
  }

  /** Make sure the content before the locator (and the block itself) is visible. If the next item is
      a superfluous block filler, it is removed
  */
, correctBlockFillerUse: function(locator, block, eltcreatefunc, preservelocators, undoitem)
  {
    if (!useBRAsBlockFill)
    {
      /*if (Browser.ie10)
      {
        // Experiment to see if IE10 will place cursor at <br>|</p>. It works, but disabled because of missing
        // infrastructure to remove the zwsp from the content again.
        var down = new $wh.Rich.Locator(block, "end");
        var downres = down.scanDownStream(block, { });
        if (downres.type == 'br')
          down.insertNode(block.ownerDocument.createTextNode('\u200b'), preservelocators, undoitem);
      }*/

      return null;
    }

    var down = locator.clone();
    var downres = down.scanDownStream(block, { whitespace: true });

    //console.log('correctBlockFillerUse', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down }));

    // If downres is a br, there is visible content (block not empty), and a br is needed when
    // upstream is a block boundary (inner block or outer block)
    if (downres.type == 'br')
    {
      var up = locator.clone();
      var upres = up.scanUpStream(block, { whitespace: true });

      //console.log(' found br', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down, up: up }));

      // Blockboundaries merge with previous segment boundaries. Add one.
      if (upres.blockboundary)
      {
        var node = eltcreatefunc('br');
        node.setAttribute('data-wh-rte', 'bogus');
        up.insertNode(node, preservelocators, undoitem);
        //console.log(' inserted br', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down, up: up }));
        return { locator: up, node: node };
      }

      // Otherwise we're ok
      return null;
    }

    // Now, we only need to worry about the block being empty.
    downres = down.scanDownStream(block, { whitespace: true, blocks: true });
    if (downres.type == 'outerblock' && downres.data == block && this.doesNodeRequireFillingWhenEmpty(block))
    {
      //console.log(' found outerblock', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down, up: up }));

      var up = locator.clone();
      var upres = up.scanUpStream(block, { whitespace: true, blocks: true });

      if (upres.type == 'outerblock' && upres.data == block)
      {
        //console.log(' found outerblock both sides', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down, up: up }));

        var node = eltcreatefunc('br');
        node.setAttribute('data-wh-rte', 'bogus');
        up.insertNode(node, preservelocators, undoitem);

        //console.log(' inserted br', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down, up: up }));
        return { locator: up, node: node };
      }
    }
    else
    {
      // There is stuff that makes the block visible. Filler br is not needed, see if there is one
      var up = locator.clone();
      var upres = up.scanUpStream(block, { whitespace: true, blocks: true });

      //console.log(' got down visible', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down, up: up }));

      if (upres.type == 'br')
      {
        // Save it's location, see if it's really a filler
        var firstbr = up.clone();
        ++up.offset;

        var upres = up.scanUpStream(block, { whitespace: true, blocks: true });
        if (upres.type == 'outerblock' && upres.data == block)
        {
          firstbr.removeNode(preservelocators, undoitem);
          //console.log(' removed br', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down, firstbr: firstbr }));
        }
      }
    }

    return null;
  }

, cleanupBlockfills:function(tree)
  {
    if (useBRAsBlockFill) //structurededitor.js used to skip the cleanup in this case
      return;

    var elts = tree.getElementsByTagName('*');

    for (var i = 0; i < elts.length; ++i)
    {
      var node = elts[i];
      if (!$wh.Rich.Dom.isNodeBlockElement(node))
        continue;

      //console.log('pre ', node.outerHTML);
      $wh.Rich.Dom.addBreaksForInterchangeFormat(node);
      //console.log('post ', node.outerHTML);
    }
  }

  /** Make sure there is visible content in the current block after the locator
      If not, a 'br' is inserted.
      @param locator Locator within block
      @param maxancestor Block node
      @param eltcreatefunc Function that must return a 'br' element when called with eltcreatefunc('br')
      @param preservelocators Locators to preserver
  */
, requireVisibleContentInBlockAfterLocator: function(locator, maxancestor, eltcreatefunc, preservelocators, undoitem)
  {
    return this.correctBlockFillerUse(locator, maxancestor, eltcreatefunc, preservelocators, undoitem);
/*
    if (!useBRAsBlockFill)
      return null;

    locator = locator.clone();
    var res = locator.scanUpStream(maxancestor, { whitespace: true });

    console.log(downres, res);
    console.log('RVC ', $wh.Rich.getStructuredOuterHTML(maxancestor, { orglocator: orglocator, locator: locator, maxancestor: maxancestor, down: down }));

//    rawUpStream(maxancestor, true, false);
    if (![ 'char', 'node', 'innerblock' ].contains(downres.type) && res.type == 'outerblock' && res.data == maxancestor)
    {
      var node = eltcreatefunc('br');
      node.setAttribute('data-wh-rte', 'bogus');
      locator.insertNode(node, preservelocators, undoitem);
      return { locator: locator, node: node };
    }
    else if (!res.bogussegmentbreak)
    {
      var newlocator = new $wh.Rich.Locator(maxancestor, "end");
      //var res = newlocator.rawDownStream(maxancestor, true, true);
      var res = newlocator.scanDownStream(maxancestor, { whitespace: true, blocks: true });

      //console.log('RVC nl ', $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: locator, newlocator: newlocator, maxancestor: maxancestor }));

      if (newlocator.compare(locator) > 0 && res.type == 'node' && res.bogussegmentbreak)
        this.removeNode(res.data, preservelocators, undoitem);
    }
    return null;*/
  }

, addBreaksForInterchangeFormat: function(block)
  {
    if (useBRAsBlockFill)
      return;

    // No BR's in unsplittable nodes (like embedded objects)
    if (!$wh.Rich.Dom.isNodeSplittable(block))
      return;

    var locator = new $wh.Rich.Locator(block, "end");

    var down = locator.clone();
    var downres = down.scanDownStream(block, { whitespace: true });

    var insertbr = downres.type == 'br';

    if (downres.type == 'innerblock')
      downres = down.scanDownStream(block, { whitespace: true, blocks: true });

    //console.log('abfif ', $wh.Rich.getStructuredOuterHTML(block, { locator: locator, down: down }));
    //console.log(downres);
    if (downres.type == 'outerblock' && downres.data == block && this.doesNodeRequireInterchangeFillingWhenEmpty(block))
      insertbr = true;

    if (insertbr)
    {
      //console.log(' inserting br');
      var node = document.createElement('br');
      node.setAttribute('data-wh-rte', 'bogus');
      locator.insertNode(node);
    }
  }

/*, insertNodeContentsAtLocator: function(source, locator)
  {
    return this.insertNodesAtLocator(this.removeNodeContents(source), locator);
  }*/

  /// Removes nodes from the DOM
, removeNodes: function(nodes)
  {
     for (var i = 0; i < nodes.length; ++i)
      if (nodes[i].parentNode)
        nodes[i].parentNode.removeChild(nodes[i]);
  }

  /// Removes all nodes from the dom, then inserts them at locator. Make sure locator is valid after removal of the nodes!
, removeAndInsertNodesAtLocator: function(nodes, locator)
  {
    this.removeNodes(nodes);
    return this.insertNodesAtLocator(nodes, locator);
  }

  /** Inserts nodes at a new location. undo only works if the items don't need to be restored to their
      original position!
  */
, insertNodesAtLocator: function(nodes, locator, preservelocators, undoitem)
  {
    var insertpos = locator.clone();
    for (var i = 0; i < nodes.length; ++i)
      insertpos = insertpos.insertNode(nodes[i], preservelocators);

    if (undoitem)
      undoitem.addItem(
        this.removeNodes.bind(this, nodes.slice()),
        this.insertNodesAtLocator.bind(this, nodes, locator.clone()));

    return insertpos;
  }

/*, appendNodeContents: function(source, dest)
  {
    this.appendNodes(this.removeNodeContents(source), dest);
  }*/

, appendNodes: function(nodes, dest)
  {
    for (var i = 0; i < nodes.length; ++i)
      dest.appendChild(nodes[i]);
  }

, removeNodeContents: function(node, undoitem)
  {
    /* Copy childNodes, then remove those from the dom. Must do it that way,
       because FF invents <br _moz_editor_bogus_node="TRUE"> when removing them one by one
    */
    var nodes = Array.slice(node.childNodes);
    for (var i = 0; i < nodes.length; ++i)
      node.removeChild(nodes[i]);

    if (undoitem)
      undoitem.addItem(
        this.insertNodesAtLocator.bind(this, nodes, new $wh.Rich.Locator(node)),
        this.removeNodeContents.bind(this, node));

    return nodes;
  }

, removeNode: function(node, preservelocators, undoitem)
  {
    var locator = $wh.Rich.Locator.newPointingTo(node);
    locator.removeNode(preservelocators, undoitem);
    return locator;
  }
});

// ---------------------------------------------------------------------------
//
// Locator (points to a specific place in the DOM)
//

$wh.Rich.Locator = new Class(
{ // ---------------------------------------------------------------------------
  //
  // Variables
  //

  // Element (may be a element or a text node)
  element:      null

  // Offset within childNodes(elements) of nodeValue(text/cdata). May be equal to childNodes.length/nodeValue.length!
, offset:       0

  // ---------------------------------------------------------------------------
  //
  // Initialize
  //

, initialize: function(element, offset)
  {
    if (!element)
    {
      console.error("No valid element in locator initialize");
      throw new Error("No valid element in locator initialize");
    }
    this.element = element;
    if (offset === 'end')
      this.offset = $wh.Rich.Dom.getNodeChildCount(element);
    else
      this.offset = offset || 0;
  }

  // ---------------------------------------------------------------------------
  //
  // Helper functions
  //

, getMaxChildOffset: function(element)
  {
    var offset;
    if (element.nodeType == 1 || element.nodeType == 11)
      return element.childNodes.length; // for element nodes, document fragments, etc
    else
      return element.nodeValue ? element.nodeValue.length : 0; // for text nodes
  }

  // ---------------------------------------------------------------------------
  //
  // Public API
  //

  /// Set the locator object
, set: function(element, offset)
  {
    if (!element) throw "No valid element in locator set";
    this.element = element;
    if (offset === 'end')
      this.offset = this.getMaxChildOffset(element);
    else
      this.offset = offset || 0;
  }

  /// Clones a locator object
, clone: function()
  {
    return new $wh.Rich.Locator(this.element, this.offset);
  }

  /// Assigns a the position of another locator to this locator
, assign: function(rhs)
  {
    this.element = rhs.element;
    this.offset = rhs.offset;
  }

  /// Get the node this locator points to (element.childNodes[offset]) if applicable
, getPointedNode: function()
  {
    return this.parentIsElementOrFragmentNode() && this.offset < this.element.childNodes.length
        ? this.element.childNodes[this.offset]
        : null;
  }

  /// When applicable, get the node this locator points to, otherwise get the parent node.
, getNearestNode: function()
  {
    return this.getPointedNode() || this.element;
  }

  /// When applicable, get the node this locator points to, otherwise get the parent node. DEPRECATED, use getNearestNode
, getNearestElement: function()
  {
    console.warn('getNearestElement is deprecated, use getNearestNode');console.trace();
    return this.getPointedNode() || this.element;
  }

, pointsPastChildrenEnd: function()
  {
    return this.offset >= this.getMaxChildOffset(this.element);
  }

  /** Get the path through the dom tree from the ancestor to an element, not including the ancestor
      @param ancestor
  */
, getPathFromAncestor: function(ancestor)
  {
    var treenodes=[],element = this.element;
    for(;element!=ancestor;element=element.parentNode)
      treenodes.push(element);
    return treenodes.reverse();
  }

, getRelativePath: function(ancestor)
  {
    var path = [ this.offset ];
    var node = this.element;
    for (; node && node != ancestor; node = node.parentNode)
      path.unshift(rangy.dom.getNodeIndex(node));
    return path;
  }

  /** Returns whether the locator points to an element within a specific parent node
      @param parentNode
  */
, isWithinNode: function(parentNode)
  {
    var current = this.element;
    while (current && current != parentNode)
      current = current.parentNode;
    return current == parentNode;
  }

, parentIsElementOrFragmentNode: function()
  {
    return this.element.nodeType == 1 || this.element.nodeType == 11;
  }

, moveToParent: function(towardend, forced)
  {
    // If node is empty, determine direction by towardend
    // If at start or at end, go to start resp. end
    // If not forced, return false
    // Determine direction by towardend

    if (this.pointsPastChildrenEnd())
    {
      // Node might be empty
      if (this.offset != 0)
        towardend = true; // Node not empty
      else
        ; // Node is empty.
    }
    else
    {
      // Node not empty
      if (this.offset == 0)
        towardend = false;
      else if (!forced)
        return false;
    }

    this.offset = rangy.dom.getNodeIndex(this.element) + (towardend?1:0);
    this.element = this.element.parentNode;

    return true;
  }

  /** Ascends a locator toward the ancestor while the offset == 0/element size
  */
, ascend: function(ancestor, towardend, forced)
  {
    if (!ancestor)
      throw "Invalid ancestor in Locator.ascend";
//    console.log('AscendLocator ancestor', ancestor,' towardend: ', towardend, ', html: ', $wh.Rich.getStructuredOuterHTML(ancestor, { toascend: this }));

    while (this.element != ancestor)
    {
      if (!this.moveToParent(towardend, forced))
        break;
      if (!this.element)
        throw "Locator was pointed outside the tree of ancestor";
    }

//    console.log('AscendLocator result', $wh.Rich.getStructuredOuterHTML(ancestor, { toascend: this }));
    return this;
  }

  /** Descends into leaf nodes (but keeps it out of unsplittable nodes)
  */
, descendToLeafNode: function(maxancestor, allowunsplittables)
  {
    if (typeof maxancestor != "object")
      throw "Missing ancestor!";

    //console.log('DescendLocator before ', this.element.nodeName, this.element.nodeValue, this.offset, 'len: ' + this.element.childNodes.length);

    // descend only in nodes of type element
    var towardend = false;
    if (this.element.nodeType == 1 || this.element.nodeType == 11)
    {
      if (this.offset >= this.element.childNodes.length)
      {
        // One past children: descend into lastchild (if present)
        while ((this.element.nodeType == 1 || this.element.nodeType == 11) && this.element.lastChild)
          this.element = this.element.lastChild;

        this.positionPastLastChild();
        towardend = true;
      }
      else
      {
        // Locator points to a child, descend through firstchild
        if (this.offset != 0)
        {
          this.element = this.element.childNodes[this.offset];
          this.offset = 0;
        }

        // Descend with firstChild into leaf
        while ((this.element.nodeType == 1 || this.element.nodeType == 11) && this.element.firstChild)
          this.element = this.element.firstChild;
      }
    }

    if (!allowunsplittables && !$wh.Rich.Dom.isNodeSplittable(this.element))
    {
      //console.log('DescendLocator descended into unsplittable node', this.element.nodeName);
      this.moveToParent(towardend);
    }

    //console.log('DescendLocator after ',this.element.nodeName,this.element.nodeValue,this.offset);
  }

, positionPastLastChild: function()
  {
    this.offset = this.getMaxChildOffset(this.element);
  }

, insertNode: function(node, preservelocators, undoitem)
  {
    if (!this.parentIsElementOrFragmentNode())
      throw "Inserting only allowed when parent is a node";

    /* Firefox removes <br _moz_editor_bogus_node> when inserting stuff after it. That messes up our
       locator system big-time. FF keeps track internally, clearing _moz_editor_bogus_node doesn't work.
       Inserting a <br> of our own after it makes FF remove its br. Locators shouldn't be in <br>'s anyway,
       so no preservation needed.
    */
    var bogusbr = null, newbr = null;
    if (this.offset)
    {
      var prev = this.element.childNodes[this.offset-1];
      if (prev.nodeType == 1 && prev.nodeName.toLowerCase() == 'br' && prev.getAttribute('_moz_editor_bogus_node'))
      {
        bogusbr = prev;
        newbr = prev.ownerDocument.createElement('br');
        this.element.insertBefore(newbr, this.getPointedNode());
        if (prev.parentNode) // Just to be sure.
          prev.parentNode.removeChild(prev);
      }
    }

    var pointednode = this.getPointedNode();

    this.element.insertBefore(node, pointednode);
    var next = this.clone();

    if (undoitem)
      undoitem.addItem(
        this._undoInsertNode.bind(this, this.element, node, bogusbr, newbr, pointednode),
        this._redoInsertNode.bind(this, this.element, node, bogusbr, newbr, pointednode));

    $wh.Rich.Dom.applyPreserveFunc(preservelocators, this._correctForNodeInsert.bind(this, next));

    ++next.offset;
    return next;
  }

, _undoInsertNode: function(element, node, bogusbr, replacebr, insertbefore)
  {
    node.parentNode.removeChild(node);
    if (replacebr)
    {
      element.insertBefore(bogusbr, insertbefore);
      element.removeChild(replacebr);
    }
  }

, _redoInsertNode: function(element, node, bogusbr, replacebr, insertbefore)
  {
    if (replacebr)
    {
      element.insertBefore(replacebr, insertbefore);
      if (bogusbr.parentNode)
        bogusbr.parentNode.removeChild(bogusbr);
    }
    element.insertBefore(node, insertbefore);
  }

, _correctForNodeInsert: function(locator, tocorrect)
  {
    if (tocorrect.element == locator.element && tocorrect.offset >= locator.offset)
      ++tocorrect.offset;
  }

, removeNode: function(preservelocators, undoitem)
  {
    if (!this.parentIsElementOrFragmentNode())
      throw "Removing a node only allowed when parent is a node";
    if (this.offset >= this.getMaxChildOffset(this.element))
      throw "Locator does not point to an element";

    var removed = this.element.childNodes[this.offset];
    this.element.removeChild(removed);

    var pointednode = this.element.childNodes[this.offset] || null;

    if (undoitem)
      undoitem.addItem(
        this._redoInsertNode.bind(this, this.element, removed, null, null, pointednode),
        this._undoInsertNode.bind(this, this.element, removed, null, null, pointednode));

    var locator = this.clone();
    $wh.Rich.Dom.applyPreserveFunc(preservelocators, this._correctForNodeRemove.bind(this, locator, removed));
  }

, _correctForNodeRemove: function(locator, removed, tocorrect)
  {
    if (tocorrect.element == locator.element && tocorrect.offset > locator.offset)
      --tocorrect.offset;
    else if (tocorrect.element == removed || $wh.Rich.Dom.isAncestorOf(removed, tocorrect.element))
      tocorrect.assign(locator);
  }

, replaceNode: function(newnode, preservelocators)
  {
    if (!this.parentIsElementOrFragmentNode())
      throw "Removing a node only allowed when parent is a node";
    if (this.offset >= this.getMaxChildOffset(this.element))
      throw "Locator does not point to an element";
    if (!newnode)
      throw "No valid new node given";

    var oldnode = this.element.childNodes[this.offset];
    this.element.replaceChild(newnode, oldnode);

    $wh.Rich.Dom.applyPreserveFunc(preservelocators, this._correctForNodeReplace.bind(this, oldnode, newnode));
  }

, _correctForNodeReplace: function(oldnode, newnode, tocorrect)
  {
    if (tocorrect.element == oldnode)
      tocorrect.element = newnode;
  }

, equals: function(rhs)
  {
    return this.element === rhs.element && this.offset == rhs.offset;
  }

, compare: function(rhs)
  {
    return rangy.dom.comparePoints(this.element, this.offset, rhs.element, rhs.offset);
  }

, check: function(maxancestor)
  {
    if (!this.element) throw "Element not valid";
    if (maxancestor && !$wh.Rich.Dom.isAncestorOf(maxancestor, this.element)) throw "Element is not child of maxancestor";
    if (this.offset<0) throw "Negative offset";
    if (this.offset>this.getMaxChildOffset(this.element)) throw "Offset too big";
  }

, isInDOM: function()
  {
    if (!this.element.ownerDocument || !this.element.ownerDocument.documentElement)
      return false;
    return $wh.Rich.Dom.isAncestorOf(this.element.ownerDocument.documentElement, this.element);
  }

, getContainedLocators: function()
  {
    return [ this ];
  }

  /** Scan downstream to the previous visible element
      @param ignore .whitespace .blocks .li
      @return
      @cell return.type 'innerblock', 'outerblock', 'node', 'char', 'br', 'whitespace'
      @cell return.data
      @cell return.blockboundary
      @cell return.alwaysvisible
      @cell return.segmentbreak
      @cell return.whitespace
  */
, scanDownStream: function(maxancestor, ignore)
  {
    if (!maxancestor) { console.trace();throw "Missing ancestor"; }
    if (this.offset > GetNodeEndOffset(this.element)) throw "Illegal offset!";
    if (typeof ignore.li == "undefined") ignore.li = ignore.blocks;

    while (true)
    {
      if (this.offset == 0)
      {
        // At start of node, need to exit it
        var isblock = $wh.Rich.Dom.isNodeBlockElement(this.element);
        if (isblock || this.element == maxancestor)
        {
          var isalwaysvisible = $wh.Rich.Dom.isNodeAlwaysVisibleBlockElement(this.element);
          if (!ignore.blocks || isalwaysvisible || this.element == maxancestor)
          {
            var retval = { type: 'outerblock', data: this.element, blockboundary: true, segmentbreak: true, alwaysvisible: isalwaysvisible };
            //console.error(retval);
            return retval;
          }
        }

        this.moveToParent(false);
      }
      else
      {
        if ([3,4].contains(this.element.nodeType))
        {
          var data = this.element.nodeValue.substr(this.offset-1, 1);
          var whitespace = ' \t\r\n'.indexOf(data) != -1;
          if (!whitespace || !ignore.whitespace)
          {
            var res =
                { type: whitespace ? 'whitespace' : 'char'
                , data: data
                , visiblecontent: !whitespace
                };

            return res;
          }

          --this.offset;
          continue;
        }

        // We're within an element
        --this.offset;

        var node = this.getPointedNode();
        if (![1, 3, 4].contains(node.nodeType)) // Skip unknown nodetypes
          continue;

        if (node.nodeType == 1)
        {
          // Always return unsplittable nodes
          if (!$wh.Rich.Dom.isNodeSplittable(node))
          {
            ++this.offset;

            var segmentbreak = node.nodeName.toLowerCase() == 'br';
            if (segmentbreak)
            {
              var bogussegmentbreak = segmentbreak && node.getAttribute('data-wh-rte') == 'bogus';
              return { type: 'br', data: node, segmentbreak: true, bogussegmentbreak: bogussegmentbreak };
            }

            return { type: 'node', data: node, visiblecontent: true };
          }

          // Stop at inner blocks if requested
          var isblock = $wh.Rich.Dom.isNodeBlockElement(node);
          var isli = node.nodeName.toLowerCase() == 'li';

          if ((isli && !ignore.li) || (!isli && isblock && !ignore.blocks))
//          if (isblock && !ignore.blocks)
          {
            ++this.offset;
            return { type: 'innerblock', data: node, blockboundary: true, segmentbreak: true };
          }
        }

        // Move to end of contents of previous node
        this.set(this.getPointedNode(), "end");
      }
    }
  }

  /** Scan upstream to the next visible element
      @param
      @param igore .whitespace .blocks
      @return
      @cell return.type 'innerblock', 'outerblock', 'node', 'char', 'br', 'whitespace'
      @cell return.data
      @cell return.blockboundary
      @cell return.alwaysvisible
      @cell return.segmentbreak
      @cell return.whitespace
  */
, scanUpStream: function(maxancestor, ignore)
  {
    if (!maxancestor) {console.trace();throw "Missing ancestor";}
    if (!$wh.Rich.Dom.isAncestorOf(maxancestor, this.element))
    {
      console.log(maxancestor, this.element);
      throw new Error("Maxancestor is not ancestor of locator");
    }

    while (true)
    {
      if (this.pointsPastChildrenEnd())
      {
        var isblock = $wh.Rich.Dom.isNodeBlockElement(this.element);
        if (isblock || this.element == maxancestor)
        {
          var isalwaysvisible = $wh.Rich.Dom.isNodeAlwaysVisibleBlockElement(this.element);
          if (!ignore.blocks || isalwaysvisible || this.element == maxancestor)
            return { type: 'outerblock', data: this.element, blockboundary: true, segmentbreak: true, alwaysvisible: isalwaysvisible };
        }

        this.moveToParent(true);
      }
      else
      {
        if ([3,4].contains(this.element.nodeType))
        {
          var data = this.element.nodeValue.substr(this.offset, 1);
          var whitespace = ' \t\r\n'.indexOf(data) != -1;

          if (!whitespace || !ignore.whitespace)
          {
            var res =
                { type: whitespace ? 'whitespace' : 'char'
                , data: data
                , visiblecontent: !whitespace
                };
            return res;
          }

          ++this.offset;
          continue;
        }

        var node = this.getPointedNode();
        if (![ 1, 3, 4 ].contains(node.nodeType))
        {
          ++this.offset;
          continue;
        }

        if (node.nodeType == 1)
        {
          // Return unsplittable nodes
          if (!$wh.Rich.Dom.isNodeSplittable(node))
          {
            var segmentbreak = node.nodeName.toLowerCase() == 'br';
            if (segmentbreak)
            {
              var bogussegmentbreak = segmentbreak && node.getAttribute('data-wh-rte') == 'bogus';
              return { type: 'br', data: node, segmentbreak: true, bogussegmentbreak: bogussegmentbreak };
            }

            return { type: 'node', data: node, visiblecontent: true };
          }

          var isblock = $wh.Rich.Dom.isNodeBlockElement(node);
          //var isalwaysvisible = isblock && $wh.Rich.Dom.isNodeAlwaysVisibleBlockElement(node);
          if ((isblock && !ignore.blocks)/* || isalwaysvisible*/)
            return { type: 'innerblock', data: node, blockboundary: true, segmentbreak: true };
        }

        // Move to start of contents of current node
        this.set(node, 0);
      }
    }
  }

  //walks left to the last visible node or character, and puts the locator right from it.
, movePastLastVisible: function(maxancestor, stopatblock, placeintext)
  {
    if (!maxancestor) {console.trace();throw "Missing ancestor";}
    if (!$wh.Rich.Dom.isAncestorOf(maxancestor, this.element))
      throw new Error("Ancestor is not ancestor of this locator");
    if (stopatblock)
      throw new Error("Stopatblock not supported for movePastLastVisible");

    var range = $wh.Rich.Dom.getVisualEquivalenceRange(maxancestor, this);
    this.assign(range.down);

    if (placeintext && ![ 'whitespace', 'char' ].contains(range.downres.type))
    {
      var copy = this.clone();
      var res = copy.scanUpStream(maxancestor, {});
      if ([ 'whitespace', 'char' ].contains(res.type))
        this.assign(copy);
    }

    return range.downres;
  }

, moveToFirstVisible: function(maxancestor, stopatblock, placeintext)
  {
    if (!maxancestor) {console.trace();throw "Missing ancestor";}
    if (!$wh.Rich.Dom.isAncestorOf(maxancestor, this.element))
      throw "Ancestor is not ancestor of this locator";
    if (stopatblock)
      throw "Stopatblock not supported for moveToFirstVisible";

    var range = $wh.Rich.Dom.getVisualEquivalenceRange(maxancestor, this);
    //console.log('mtfv range', $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: this, range: range }, true));
    this.assign(range.up);

    if (placeintext && ![ 'whitespace', 'char' ].contains(range.upres.type))
    {
      var copy = this.clone();
      var res = copy.scanDownStream(maxancestor, {});
      if ([ 'whitespace', 'char' ].contains(res.type))
        this.assign(copy);
    }

    return range.upres;
  }

, moveLeft: function(maxancestor)
  {
    var res = this.movePastLastVisible(maxancestor);
    switch (res.type)
    {
      case 'innerblock':
        this.set(res.data, "end"); break;
      case 'outerblock':
        {
          if (this.element != maxancestor)
            this.moveToParent(false);
        } break;
      case 'whitespace':
      case 'br':
      case 'node':
      case 'char':
        --this.offset; break;
    }

    var range = $wh.Rich.Dom.getVisualEquivalenceRangeInBlock(maxancestor, this);
    if (range.valid)
    {
      this.assign(range.down);
      return;
    }

    this.scanDownStream(maxancestor, { blocks: true, whitespace: true });
    this.scanUpStream(maxancestor, { whitespace: true });

    this.movePastLastVisible(maxancestor);
  }

, moveRight: function(maxancestor)
  {
    var res = this.moveToFirstVisible(maxancestor);
    if (useBRAsBlockFill && res.type == 'br')
    {
      var range = $wh.Rich.Dom.getInvisibleSegmentBreakRange(this, maxancestor);
      //console.log('moveright foundbr', $wh.Rich.getStructuredOuterHTML(maxancestor, { locator: this, range: range }));

      if (range)
      {
        this.assign(range.end);
        res = this.scanUpStream(maxancestor, { whitespace: true });
      }
    }
    switch (res.type)
    {
      case 'innerblock':
        this.set(res.data, 0); break;
      case 'outerblock':
        {
          if (this.element != maxancestor)
            this.moveToParent(true);
        } break;
      case 'whitespace':
      case 'br':
      case 'node':
      case 'char':
        ++this.offset; break;
    }

    var range = $wh.Rich.Dom.getVisualEquivalenceRangeInBlock(maxancestor, this);
    if (range.valid)
    {
      this.assign(range.up);
      return;
    }


    this.scanUpStream(maxancestor, { blocks: true, whitespace: true });
    this.scanDownStream(maxancestor, { whitespace: true });

    this.movePastLastVisible(maxancestor);
  }

  /** Move the locator to the previous block tag, or the start of the current block
      @param maxancestor Ancestor to treat as parent block
      @return Locator is positioned just before block boundary
      @cell return.type 'innerblock', 'outerblock'
      @cell return.node Relevant block
  */
, moveToPreviousBlockBoundary: function(maxancestor, ignoreinnerblock)
  {
    while (true)
    {
      //console.log('mtnbb iter', $wh.Rich.getStructuredOuterHTML(this.element.parentNode, { locator: this }));

      // Don't do stuff within data nodes
      if (!this.parentIsElementOrFragmentNode())
        this.offset = 0;

      if (this.offset == 0)
      {
        if (this.element == maxancestor || $wh.Rich.Dom.isNodeBlockElement(this.element))
          return { type: 'outerblock', data: this.element, blockboundary: true };
        this.moveToParent(false);
      }
      else
      {
         --this.offset;
        var node = this.getPointedNode();

        if (node.nodeType != 1 || !$wh.Rich.Dom.isNodeSplittable(node) || ignoreinnerblock)
          continue;

        if ($wh.Rich.Dom.isNodeBlockElement(node))
        {
          ++this.offset;
          return { type: 'innerblock', data: node, blockboundary: true };
        }

        this.element = node;
        this.positionPastLastChild();
      }
    }
  }


  /** Move the locator to the next block tag, or the end of the current block
      @param maxancestor Ancestor to treat as parent block
      @return Locator is positioned just before block boundary
      @cell return.type 'innerblock', 'outerblock'
      @cell return.node Relevant block
  */
, moveToNextBlockBoundary: function(maxancestor, ignoreinnerblock)
  {
    while (true)
    {
      //console.log('mtnbb iter', $wh.Rich.getStructuredOuterHTML(this.element.parentNode, { locator: this }));

      // Don't do stuff within data nodes
      if (!this.parentIsElementOrFragmentNode())
        this.positionPastLastChild();

      if (this.pointsPastChildrenEnd())
      {
        if (this.element == maxancestor || $wh.Rich.Dom.isNodeBlockElement(this.element))
          return { type: 'outerblock', data: this.element, blockboundary: true };
        this.moveToParent(true);
      }
      else
      {
        var node = this.getPointedNode();

        if (node.nodeType != 1 || !$wh.Rich.Dom.isNodeSplittable(node) || ignoreinnerblock)
        {
          ++this.offset;
          continue;
        }
        if ($wh.Rich.Dom.isNodeBlockElement(node))
          return { type: 'innerblock', data: node, blockboundary: true };

        this.element = node;
        this.offset = 0;
      }
    }
  }

, isLegal: function(maxancestor)
  {
    var node = this.element;
    while (node)
    {
      // Locator may not be inside an unsplittable node
      if (!$wh.Rich.Dom.isNodeSplittable(node))
        return false;

      if (node === maxancestor)
        return true;

      node = node.parentNode;
    }
    return false;
  }

, getParentContentEditable: function(maxancestor)
  {
    // Return the highest parent that is still contenteditable (limited by maxancestor
    var node = this.element;
    for (; node && node !== maxancestor; node = node.parentNode)
    {
      if (!node.parentNode || !node.parentNode.isContentEditable)
        return node;
    }
    return maxancestor;
  }

, legalize: function(maxancestor, towardend)
  {
    var node = this.element;
    while (node && node !== maxancestor)
    {
      // If parent isn't splittable, ascend to its parent. Assuming the maxancestor is splittable!!!
      if (!$wh.Rich.Dom.isNodeSplittable(node) && node )
        this.ascend(node.parentNode, towardend, true);

      node = node.parentNode;
    }
  }
});

$wh.Rich.Locator.extend(
{
  findCommonAncestor: function(locator_a, locator_b)
  {
    return rangy.dom.getCommonAncestor(locator_a.element, locator_b.element);
  }

, findCommonAncestorElement: function(locator_a, locator_b)
  {
    var ancestor =  this.findCommonAncestor(locator_a, locator_b);
    if (ancestor && ![1, 9, 11].contains(ancestor.nodeType) && ancestor.nodeType) // allow element, document(fragement)
      ancestor = ancestor.parentNode;
    return ancestor;
  }

  /// Get start and end locator from a range
, getFromRange: function(range)
  {
    if (!range)
      return null;

    var result =
      { start:  new $wh.Rich.Locator(range.startContainer, range.startOffset)
      , end:    new $wh.Rich.Locator(range.endContainer, range.endOffset)
      };
    return result;
  }

, newPointingTo: function(node)
  {
    return new $wh.Rich.Locator(node.parentNode, rangy.dom.getNodeIndex(node));
  }

, newPointingAfter: function(node)
  {
    var locator = this.newPointingTo(node);
    ++locator.offset;
    return locator;
  }

, fromRelativePath: function(ancestor, path)
  {
    var lastoffset = path.pop();
    var elt = ancestor;
    for (var i = 0; i < path.length; ++i)
      elt = elt.childNodes[path[i]];
    return new $wh.Rich.Locator(elt, lastoffset);
  }

});

$wh.Rich.Range = new Class(
{ start: null
, end:   null

, initialize: function(start, end)
  {
    this.start = start.clone();
    this.end = end.clone();
  }

, clone: function(rhs)
  {
    return new $wh.Rich.Range(this.start.clone(), this.end.clone());
  }

, assign: function(rhs)
  {
    this.start.assign(rhs.start);
    this.end.assign(rhs.end);
  }

, isInDOM: function()
  {
    return this.start.isInDOM() && this.end.isInDOM();
  }

, check: function(maxancestor)
  {
    this.start.check(maxancestor);
    this.end.check(maxancestor);
    if (this.start.compare(this.end) > 0) throw "Start lies after end";
  }

, getAncestor: function()
  {
    return $wh.Rich.Locator.findCommonAncestor(this.start, this.end);
  }

, getAncestorElement: function()
  {
    return $wh.Rich.Locator.findCommonAncestorElement(this.start, this.end);
  }

, isCollapsed: function()
  {
    return this.start.equals(this.end);
  }

, equals: function(rhs)
  {
    return this.start.equals(rhs.start) && this.end.equals(rhs.end);
  }

  /** Normalize a range. If the range is collapsed, the caret is placed past the
      last visible character/element/block boundary
      Otherwise, the start is placed next to the next visible character/element/block
      boundary, and the end is placed next to the previous visible character/element/block boundary.
  */
, normalize: function(maxancestor, fromnative)
  {
    if(!maxancestor)
      throw "maxancestor is required";
    if (!$wh.Rich.Dom.isAncestorOf(maxancestor, this.getAncestorElement()))
    {
      console.trace();
      throw "Maxancestor is not ancestor of range";
    }

    this.check(maxancestor);

    //console.log('*');
    //console.log('*');
    //console.log('*');
    if($wh.Rich.rangelog & 32)
      console.log('pre normalize', $wh.Rich.getStructuredOuterHTML(maxancestor, { range: this }, true));

    if (this.isCollapsed() && fromnative && Browser.firefox)
    {
      /* In firefox, there is a distinction between a|<i>b and a<i>|b. When normalizing a native
         selection here, try to maintain that distinction
         Let's try doing nothing.
      */
      return this;
    }

    // Legalize the selection (outside of unsplittables). Needed for embedded objects in IE.
    this.legalize(maxancestor);

    // Minimize the selection
    this.start.moveToFirstVisible(maxancestor, false, false);
    this.end.movePastLastVisible(maxancestor, false, false);

    // If this collapses the selection, move it past the last visible
    if (this.end.compare(this.start) <= 0)
    {
      if($wh.Rich.rangelog & 32)
        console.log('normalize collapsed ', $wh.Rich.getStructuredOuterHTML(maxancestor, this, false));

      // Place 'm in text
      this.start.moveToFirstVisible(maxancestor, false, true);
      this.end.movePastLastVisible(maxancestor, false, true);

      if($wh.Rich.rangelog & 32)
        console.log('normalize collapsed ', $wh.Rich.getStructuredOuterHTML(maxancestor, this, false));

      // We're now in reversed order:  end-start
      var enda = $wh.Rich.Dom.findParent(this.end.getNearestNode(), 'a', maxancestor);
      var starta = $wh.Rich.Dom.findParent(this.start.getNearestNode(), 'a', maxancestor);

      if (starta != enda && enda)
        this.end.assign(this.start);
      else
        this.start.assign(this.end);
    }

    return this;
  }

, moveEndToPastLastVisible: function(maxancestor)
  {
    if (!maxancestor)
      throw "Missing maxancestor";

    var ancestor = this.getAncestor();

    if (this.isCollapsed())
      return;

    // Move end as far below as possible
    this.end.ascend(ancestor);

    if (this.isCollapsed())
      return;

    // End already in text? Done!
    if (!this.end.parentIsElementOrFragmentNode())
      return;

    --this.end.offset;
    this.end.element = this.end.getPointedNode();
    this.end.positionPastLastChild();

    this.end.descendToLeafNode(maxancestor);
  }

, splitStartBoundary: function(preservelocators, undoitem)
  {
    if (!this.start.parentIsElementOrFragmentNode())
    {
      // Try to move start to its parent (and try to move end too, in case start == end at end of text node)
      if (this.start.element == this.end.element)
        this.end.moveToParent(true);

      // Try to move to parent, fails if within text
      this.start.moveToParent(false);

      // Start still inside a text node?
      if (!this.start.parentIsElementOrFragmentNode())
      {
        // Split data node
        var newloc = $wh.Rich.Dom.splitDataNode(this.start, (preservelocators||[]).concat([ this.end ]), 'end', undoitem);

        // Point start node to new text element
        this.start.assign(newloc);
      }
    }
  }

  /** Insert node just before the start of the range
      @param node Node to insert
      @param preservelocators Locators to preserver
      @param undoitem
      @return Locator pointing to new node
  */
, insertBefore: function(node, preservelocators, undoitem)
  {
    if (!this.start.parentIsElementOrFragmentNode())
      this.splitStartBoundary(preservelocators, undoitem);

    var retval = this.start.clone();
    /*var newnode = */this.start.insertNode(node, (preservelocators||[]).concat(this), undoitem);
//    ++this.start.offset;
//    if (this.end.element == this.start.element)
//      ++this.end.offset;
    return retval;
  }

, descendToLeafNodes: function(maxancestor)
  {
    if (!maxancestor)
      throw "Missing ancestor!";

    if (!this.isCollapsed())
    {
      this.start.descendToLeafNode(maxancestor);

      // FIXME: fails with (start)<b>(end)<i>text</i></start>. Following code should work, test it!
      if (this.start.compare(this.end) > 0)
        this.end.assign(this.start);
      else
        this.moveEndToPastLastVisible(maxancestor);
    }
    else
    {
      this.start.descendToLeafNode(maxancestor);
      this.end.assign(this.start);
    }

    return this;
  }

, intersect: function(rhs)
  {
    if (this.start.compare(rhs.start) < 0)
      this.start.assign(rhs.start);
    else if (this.start.compare(rhs.end) > 0)
      this.start.assign(rhs.end);
    if (this.end.compare(rhs.start) < 0)
      this.end.assign(rhs.start);
    else if (this.end.compare(rhs.end) > 0)
      this.end.assign(rhs.end);
    return this;
  }

, limitToNode: function(node)
  {
    var noderange = $wh.Rich.Range.fromNodeInner(node);
    if (!this.isInDOM()) // safety
    {
      this.start.assign(noderange.start);
      this.end.assign(noderange.start);
      return this;
    }
    return this.intersect(noderange);
  }

  /** Returns a range of all the childnodes of node that are (partially) included in this range
  */
, getLocalRangeInNode: function(node)
  {
    var copy = this.clone();
    var noderange = $wh.Rich.Range.fromNodeInner(node);
    copy.insersect(noderange);

    copy.start.ascend(node, false, true);
    copy.end.ascend(node, false, true);

    return { range: copy, containswholenode: copy.equals(noderange) };
  }

, getContainedLocators: function()
  {
    return [ this.start, this.end ];
  }

, getElementsByTagName: function(tagname)
  {
    // console.log('Range gebtn', $wh.Rich.getStructuredOuterHTML(this.getAncestorElement(), this));

    var copy = this.clone();
    var ancestor = copy.getAncestorElement();
//    console.log(copy, ancestor);
    if (!ancestor)
      return [];

    copy.start.ascend(ancestor, false, true);
    copy.end.ascend(ancestor, true, true);

//    console.log(' ascended', $wh.Rich.getStructuredOuterHTML(this.getAncestorElement() || this.getAncestor(), copy));

    var result = [];
    for (var itr = copy.start.clone();itr.offset < copy.end.offset; ++itr.offset)
    {
      var child = itr.getPointedNode();
      if (child.nodeType == 1)
      {
        if (tagname == '*' || child.nodeName.toLowerCase() == tagname.toLowerCase())
          result.push(child);

        if (itr.offset == copy.start.offset || itr.offset == copy.end.offset - 1) // May be partial!
        {
          var subrange = this.clone().intersect($wh.Rich.Range.fromNodeInner(child));
          result = result.concat(subrange.getElementsByTagName(tagname));
        }
        else
        {
          var nodes = Array.from(child.getElementsByTagName(tagname));
          // console.log('  child ', child, nodes);
          result = result.concat(nodes);
        }
      }
//      else console.log('  child ignored ', child);
    }
    return result;
  }

, toDOMRange: function()
  {
    var result =
      { startContainer: this.start.element
      , startOffset: this.start.offset
      , endContainer: this.end.element
      , endOffset: this.end.offset
      }
    return result;
  }

, isLegal: function(maxancestor)
  {
    if (!this.start.isLegal(maxancestor) || !this.end.isLegal(maxancestor))
      return false;

    // Must be within the same contenteditable node
    return this.start.getParentContentEditable(maxancestor) === this.end.getParentContentEditable(maxancestor);
  }

, legalize: function(maxancestor)
  {
    this.start.legalize(maxancestor, false);
    this.end.legalize(maxancestor, true);

    var start_contenteditable = this.start.getParentContentEditable(maxancestor);
    if (start_contenteditable !== this.end.getParentContentEditable(maxancestor))
      this.limitToNode(start_contenteditable);
  }
});

$wh.Rich.Range.extend(
{ fromDOMRange: function(range)
  {
    return new $wh.Rich.Range(new $wh.Rich.Locator(range.startContainer, range.startOffset), new $wh.Rich.Locator(range.endContainer, range.endOffset));
  }
, fromRangyRange: function(range)
  {
    return new $wh.Rich.Range(new $wh.Rich.Locator(range.startContainer, range.startOffset), new $wh.Rich.Locator(range.endContainer, range.endOffset));
  }
, forNode: function(node)
  {
    console.warn('$wh.Rich.Range.forNode is deprecated, use fromNodeInner!');console.trace();
    return new $wh.Rich.Range(new $wh.Rich.Locator(node), new $wh.Rich.Locator(node, "end"));
  }
, withinNode: function(node)
  {
    console.warn('$wh.Rich.Range.withinNode is deprecated, use fromNodeInner!');console.trace();
    return new $wh.Rich.Range(new $wh.Rich.Locator(node), new $wh.Rich.Locator(node, "end"));
  }
, fromNodeInner: function(node)
  {
    return new $wh.Rich.Range(new $wh.Rich.Locator(node), new $wh.Rich.Locator(node, "end"));
  }
, fromNodeOuter: function(node)
  {
    return new $wh.Rich.Range($wh.Rich.Locator.newPointingTo(node), $wh.Rich.Locator.newPointingAfter(node));
  }
});

$wh.Rich.RangeIterator2 = new Class(
{
  /// Selection range
  range:        null

  /// Ancestor of the selection range
, ancestor:     null

  /// Current iterator
, current:      null

  /// Node pointed to by current iterator, null when at end
, node:         null

  /// range.start ascended toward start to parent of current node (marks partially selected node of range start)
, localstart:   null

  /// range.end ascended toward start to parent of current node (marks partially selected node of range end)
, localend:     null


, initialize: function(xrange)
  {
    this.range = xrange.clone();

    //console.log('ITR2 org range', $wh.Rich.getStructuredOuterHTML(this.range.getAncestorElement(), { range: this.range }, true));

    if (this.range.isCollapsed())
      return;

    if (!this.range.start.parentIsElementOrFragmentNode())
      this.range.start.moveToParent(false, true);
    if (!this.range.end.parentIsElementOrFragmentNode())
      this.range.end.moveToParent(true, true);

    this.ancestor = this.range.getAncestorElement();

    // Move range start and end as far towards the ancestor as possible
    this.range.start.ascend(this.ancestor, false);
    this.range.end.ascend(this.ancestor, true);

    this.localstart = this.range.start.clone();
    this.localstart.ascend(this.ancestor, false, true);

    this.localend = this.range.end.clone();
    this.localend.ascend(this.ancestor, false, true);

    //console.log('ITR2 mod range', $wh.Rich.getStructuredOuterHTML(this.ancestor, { range: this.range, localstart: this.localstart, localend: this.localend, current: this.current }, true));

    this.current = this.localstart.clone();

    this.node = this.localstart.getPointedNode();
  }

, atEnd: function()
  {
    return !this.node;
  }

, next: function()
  {
    return this.nextInternal(false);
  }

, nextRecursive: function()
  {
    return this.nextInternal(true);
  }

, nextInternal: function(recursive)
  {
    //console.log('ITR2 nextRecursive', $wh.Rich.getStructuredOuterHTML(this.ancestor, { range: this.range, localstart: this.localstart, localend: this.localend, current: this.current }, true));
    if (this.current.equals(this.range.end))
    {
      //console.log(' immediately at end');
      this.node = null;
      return false;
    }

    if (this.localstart && this.current.equals(this.localstart))
    {
      //console.log(' at localstart');
      if (this.localstart.equals(this.range.start))
      {
        //console.log(' localstart == range.start');
        this.localstart = null;
      }
      else
      {
        this.localstart = this.range.start.clone();
        this.localstart.ascend(this.node, false, true);

        this.current.assign(this.localstart);
        this.node = this.current.getPointedNode();
        //console.log(' followed localstart', $wh.Rich.getStructuredOuterHTML(this.ancestor, { range: this.range, localstart: this.localstart, localend: this.localend, current: this.current }, true));
        return true;
      }
    }

    if (!this.node.firstChild)
    {
      ++this.current.offset;
      this.current.ascend(this.ancestor, true);

      //console.log(' no child, ++offset && ascended', $wh.Rich.getStructuredOuterHTML(this.ancestor, { range: this.range, localstart: this.localstart, localend: this.localend, current: this.current }, true));

      if (this.current.equals(this.range.end))
      {
        //console.log(' at end');
        this.node = null;
        return false;
      }
      else
      {
        //console.log(' ok');
        this.node = this.current.getPointedNode();
        return true;
      }
    }

    if (this.localend && this.current.equals(this.localend))
    {
      //console.log(' at localend');
      if (this.localend.equals(this.range.end))
      {
        this.node = null;
        return false;
      }

      this.localend = this.range.start.clone();
      this.localend.ascend(this.node, false, true);

      this.current.element = this.node;
      this.current.offset = 0;

      //console.log(' followed localend', $wh.Rich.getStructuredOuterHTML(this.ancestor, { range: this.range, localstart: this.localstart, localend: this.localend, current: this.current }, true));

      this.node = this.current.getPointedNode();
      return true;
    }
    else
    {
      //console.log(' into child', $wh.Rich.getStructuredOuterHTML(this.ancestor, { range: this.range, localstart: this.localstart, localend: this.localend, current: this.current }, true));

      this.current.element = this.node;
      this.current.offset = 0;

      this.node = this.current.getPointedNode();
      return true;
    }
  }

});

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  WHRTE range iterator
  //

    // Moves a locator that points past the last element to the next node (but never escapes the ancestor)
function MoveLocatorToNextLowestNodeStart(ancestor, locator)
  {
    if (locator.element && locator.offset == GetNodeEndOffset(locator.element))
    {
      while (locator.element != ancestor && !locator.element.nextSibling)
        locator.element = locator.element.parentNode;

      if (locator.element != ancestor)
        locator.element = locator.element.nextSibling;
      else
        locator.element = null;
      locator.offset = 0;
    }

    while (locator.element && locator.offset == 0 && !locator.element.previousSibling)
    {
      if (locator.element == ancestor)
      {
        locator.element = null;
        break;
      }
      locator.element = locator.element.parentNode;
    }

    if (locator.element == null)
    {
      locator.element = ancestor;
      locator.offset = ancestor.childNodes.length;
      return false;
    }
    return true;
  }

function GetNodeEndOffset(element)
  {
    var offset;
    if (element.nodeType == 1 || element.nodeType == 11)
      return element.childNodes.length; // for element nodes, document fragments, etc
    else
      return element.nodeValue ? element.nodeValue.length : 0; // for text nodes
  }

//FIXME no global object
$wh.Rich.RangeIterator = new Class(
{ initialize:function(range)
  {
    this.locators = $wh.Rich.Locator.getFromRange(range);
    this.ancestor = $wh.Rich.Locator.findCommonAncestor(this.locators.start, this.locators.end);
    console.log('**', this.locators, range);
    this.node = null;
    this.depth = 0;
    this.leftpath = null;
    this.rightpath = null;

    if (this.ancestor.nodeType == 3)
      this.ancestor = this.ancestor.parentNode;
    if (this.locators.end.element.nodeType == 3 && this.locators.end.offset != 0 && !this.locators.start.equals(this.locators.end))
      this.locators.end.offset = this.locators.end.element.nodeValue.length;

    console.log('ITR init', $wh.Rich.getStructuredOuterHTML(this.ancestor, this.locators));

    MoveLocatorToNextLowestNodeStart(this.ancestor, this.locators.end);
    if (!MoveLocatorToNextLowestNodeStart(this.ancestor, this.locators.start))
    {
      // start iterator past last ancestor element
      console.log('start past end',$wh.Rich.getStructuredOuterHTML(this.ancestor, this.locators), this.locators);
      return;
    }

    //console.log(this.locators.start.element.nodeName, this.ancestor.nodeName);
    //console.log('ITR corrected',$wh.Rich.getStructuredOuterHTML(this.ancestor, this.locators), this.locators);

  //  console.log('ancestor',this.ancestor);
  //  console.log('locators',this.locators);

    this.leftpath = this.locators.start.getPathFromAncestor(this.ancestor);
    this.rightpath = this.locators.end.getPathFromAncestor(this.ancestor);

  //  console.log('leftpath: ', this.leftpath);
  //  console.log('rightpath: ', this.rightpath);

    this.node = this.locators.start.element;
    this.depth = this.leftpath.length;

    if (this.node == this.locators.end.element && this.locators.end.offset != GetNodeEndOffset(this.locators.end.element))
    {
      this.node = null;
    }
    else
    {
      this.depth = this.leftpath.length;
      if (this.locators.start.offset == GetNodeEndOffset(this.node))
        this.nextRecursive();
    }
    console.log('ITR init node', this.node, 'depth:', this.depth);
  }

, atEnd: function()
  {
    return !this.node;
  }

, nextRecursive: function()
  {
    console.log('ITR nextRecursive in', this.node, 'depth:', this.depth);
    if (this.node.nodeType != 3 && this.node.firstChild)
    {
      this.node = this.node.firstChild;
      ++this.depth;
      if (this.node == this.locators.end.element)
      {
        this.node = null;
        console.log('ITR nextRecursive at end');
        return false;
      }
      console.log('ITR nextRecursive result:', this.node, 'depth:', this.depth);
      return true;
    }
    else
      return this.next();
  }

, next: function()
  {
    console.log('ITR next', this.node, 'depth:', this.depth);
    while (!this.node.nextSibling && this.node != this.ancestor)
    {
      --this.depth;
      this.node = this.node.parentNode;
    }

    console.log('candidate node:', this.node, 'depth:', this.depth);

    if (this.node == this.ancestor)
    {
      console.log('ITR next at end');
      this.node = null;
      return false;
    }
    this.node = this.node.nextSibling;

    // pre: this.itr != this.locators.end.element
    if (this.rightpath.length >= this.depth)
    {
      var eltmax = this.depth ? this.rightpath[this.depth - 1] : this.ancestor;
      var eltdeeper = this.rightpath.length > this.depth;

      if (this.node == eltmax && !eltdeeper)
        this.node = null;
    }
    if (this.node)
      console.log('ITR next result:', this.node, 'depth:', this.depth);
    else
      console.log('ITR next at end');

    return this.node != null;
  }
});



})(document.id); //end mootools wrapper
