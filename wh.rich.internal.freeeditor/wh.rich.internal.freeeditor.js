/* generated from Designfiles Public by generate_data_designfles */
require ('wh.rich.internal.editorbase');
/*! LOAD: wh.rich.internal.editorbase !*/

if(!window.$wh.Rich) window.$wh.Rich={};

(function($) { //mootools wrapper

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Editor basic setup
//

$wh.Rich.FreeEditor = new Class(
{ Extends: $wh.Rich.EditorBase
, options: { allowtags: null
           , edittables: false//true
           }

, initialize: function(element, rte, options, pageframe)
  {
    this.parent(element, rte, options, pageframe);

    this.updateTableEditors();
  }

, _getEditableTables: function()
  {
    if (!this.options.edittables)
      return [];

    var retval = [];
    this.getContentBodyNode().getElements('table').each(function(node)
    {
      if (node.isContentEditable)
        retval.push({ node: node, tableresizing: [ 'all' ] });
    }, this);

    return retval;
  }

, isActionAllowed: function(action)
  {
    if (this.options.allowtags)
    {
      var actionlist =
        [ { name: 'img',                requiretags: [ 'img' ] }
        , { name: 'a-href',             requiretags: [ 'a' ] }
        , { name: 'remove_hyperlink',   requiretags: [ 'a' ] }
        , { name: 'anchor',             requiretags: [ 'a' ] }
        , { name: 'insert_table',       requiretags: [ 'table', 'tr', 'td' ] }
        , { name: 'ul',                 requiretags: [ 'ul', 'li' ] }
        , { name: 'ol',                 requiretags: [ 'ol', 'li' ] }
        , { name: 'li-increase-level',  requiretags: [ 'li' ] }
        , { name: 'li-decrease-level',  requiretags: [ 'li' ] }
        , { name: 'b',                  requiretags: [ 'b' ] }
        , { name: 'u',                  requiretags: [ 'u' ] }
        , { name: 'i',                  requiretags: [ 'i' ] }
        , { name: 'strike',             requiretags: [ 'strike' ] }
        , { name: 'sub',                requiretags: [ 'sub' ] }
        , { name: 'sup',                requiretags: [ 'sup' ] }
        ] ;

      var actiondata;
      for (var i = 0; i < actionlist.length; ++i)
        if (actionlist[i].name == action)
        {
          actiondata = actionlist[i];
          break;
        }

      // Ignore the action if not all required tags are in the tagfilter (when supplied)
      if (actiondata)
      {
        for (var i = 0; i < actiondata.requiretags.length; ++i)
          if (!this.options.allowtags.contains(actiondata.requiretags[i]))
            return false;
      }
    }

    return true;

  }

, executeAction: function(action)
  {
    if (!this.isActionAllowed(action))
      return;

    this.parent(action);
  }

, getFormattingStateForRange:function(range)
  {
    var res = this.parent(range);
    if (res && this.options.allowtags)
    {
      Object.each(res.actionstate, function(item, key)
        {
          if (!this.isActionAllowed(key))
            item.available = false;
        }.bind(this));
    }
    return res;
  }

, applyInnerHTML: function(text)
  {
    this.parent(text);
    if (this.iframe)
      this.setCursor(this.getContentBodyNode(), 0);

    this.updateTableEditors();
  }

, insertTable: function(cols, rows)
  {
    if (cols <= 0 || rows <= 0)
      return;

    var body = this.getContentBodyNode();
//    var selobj = this.GetSelectionObject();
//    var range = selobj.GetRange();
//    if (!range)
//      return;
    var locators = this.getSelectionRange();
    if (!locators)
      return;
    //$wh.Rich.Locator.getFromRange(range);

    var startelement = locators.start.element;
    if (startelement == body)
      startelement = body.firstChild;
    else
      while (startelement.parentNode != body)
        startelement = startelement.parentNode;

    var endelement = locators.end.element;
    if (endelement == body)
      endelement = body.lastChild;
    else
      while (endelement.parentNode != body)
        endelement = endelement.parentNode;
    endelement = endelement.nextSibling;

    // Create the table
    var tablenode = this.createElement('table');

    tablenode.appendChild(this.createElement('tbody'));
    for (var row = 0; row < rows; ++row)
    {
      var tr = tablenode.lastChild.appendChild(this.createElement('tr'));
      for (var col = 0; col < cols; ++col)
      {
        var td = tr.appendChild(this.createElement('td'));
        td.appendChild(this.createTextNode((col+1)+","+(row+1)));
      }
    }

    body.insertBefore(tablenode, endelement);
    this.stateHasChanged();
/*
    this.ReplaceSelection(node, tablenode);

    // Using timeout to set new selection, otherwise it won't work in IE...
    var self=this;
    window.setTimeout(function()
    {
      // Select the new text node
      self.SetSelection({ startContainer: firstbr
                        , startOffset: 0
                        , endContainer: firstbr
                        , endOffset: 0
                        });

      self.stateHasChanged();
    }, 1);
*/
  }

});

})(document.id); //end mootools wrapper
