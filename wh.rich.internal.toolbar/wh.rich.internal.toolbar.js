/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.ui.internal.toolbars');
require ('wh.ui.menu');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.ui.internal.toolbars, wh.ui.menu !*/

if(!window.$wh.Rich) window.$wh.Rich={};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Standard RTE ButtonBar
//

(function($) { //mootools wrapper

var ToolbarButtonBase = new Class(
{ Extends: $wh.ToolbarButton
, Implements: [Options, Events]
, active: false    //ADDME perhaps move this to only ToggableToolbarButton, if such things will ever be created?
, available: true  //is this button currently available for use (context or blockstyle isn't blocking it)
, node:null
, buttondebugid: ''

, initialize:function(toolbar, options)
  {
    this.parent(toolbar, options);
  }
, isAllowed:function(allowtagset)
  {
    return true;
  }
, updateState:function(selstate)
  {
    var actionstate = (selstate && selstate.actionstate[this.type]);
    if (actionstate)
    {
      this.available = actionstate.available || false;
      this.active = actionstate.active || false;
    }

    this.updateButtonRendering();
  }

, updateButtonRendering:function()
  {
  }

});

var ToolbarSimpleButtonBase = new Class(
{ Extends: ToolbarButtonBase
, initialize: function(toolbar, buttonname)
  {
    this.parent(toolbar);

    this.node = new Element('span',
                            { "class": "wh-rtd-button"
                            , "events": { "mousedown": this.mousedown.bind(this)
                                        , "click": this.click.bind(this)
                                        , "mouseover": this.mouseover.bind(this)
                                        }
                            , "data-button": buttonname
                            });
  }
, mousedown:function(event) //we block mousedown to prevent loss of focus when clicking the button
  {
    event.stop();
    return;
  }
, click: function(event)
  {
    event.stop();

    // Check for a custom handler
    if (!this.available || !this.toolbar.editor || !this.toolbar.editor.isEditable())
      return;

    this.executeAction();
  }
, mouseover:function (button, event)
  {
    /* FIXME: want a centralized tooltip system
    this.OnButtonHover(button.WHRTE_action, event);
    event.stop();
    */
  }
, updateButtonRendering:function()
  {
    $(this.node).toggleClass('disabled', !(this.available && this.toolbar.editor && this.toolbar.editor.isEditable()))
    this.node.toggleClass('active', this.active);
  }

});

var ToolbarButton = new Class(
{ Extends: ToolbarSimpleButtonBase
, initialize:function(toolbar, type)
  {
    this.buttondebugid = 'toolbarbutton:' + type;
    this.parent(toolbar, type);
    this.type=type;

    /* FIXME: De oude RTE gaf aan dat bij een buttonclick op buttonbar altijd
     * dit moest gebeuren:
     *
          // Save old selection for IE
          if (this.iframe.attachEvent)
            this.SaveOldSelection();

      blijkbaar verloor je selectie soms? maar dit lijkt me eerder in onblur
      te horen (er zijn meer knoppen dan alleen de buttonbar ) */


    /*if (!this.title) //and there won't be, ever... ?  perhaps for custom buttons...
    {
      var title = this.toolbar.editor.GetLanguageText('buttonbar_' + this.type);
      if (title)
        this.title = title;
    }*/

    //FIXME acties moeten weg uit de toolbar. context menus kunnen ook acties aanroepen, dus toolbar moet slechts een dun laagje om de invokers heen zijn...

    this.updateState(null);
  }
, isAllowed:function(allowtagset)
  {
    if(this.type == "li-increase-level" || this.type == "li-decrease-level")
      return allowtagset.contains("ul") || allowtagset.contains("ol");
    if(this.type == "action-properties")
      return allowtagset.contains("a-href") || allowtagset.contains("img") || allowtagset.contains("object-video");
    if(this.type == "action-clearformatting")
      return true; //ADDME or remove when allowtagset is empty, but do we really filter then? allowtagset.length>0;
    if(this.type == "object-insert")
      return true;
    return allowtagset.contains(this.type);
  }
, executeAction: function()
  {
    if(this.toolbar.editor)
      this.toolbar.editor.executeAction(this.type);
    // ADDME: should we really do this here? can't we accept clicks without having to take focus?
    //this.toolbar.editor.takeFocus();
    return false;
  }
});

var SimpleToggleButton = new Class(
{ Extends: ToolbarSimpleButtonBase
, initialize:function(toolbar, type)
  {
    this.parent(toolbar, type);
    this.type=type;

    this.updateState(null);
  }
, isAllowed:function(allowtagset)
  {
    return allowtagset.contains(this.type);
  }
, executeAction: function()
  {
    if(this.toolbar.editor)
    {
      this.toolbar.editor.executeAction(this.type);
      //this.toolbar.editor.applyTextStyle(this.type, !this.toolbar.editor.getSelectionState().hasTextStyle(this.type));

      // ADDME: should we really do this here? can't we accept clicks without having to take focus?
      //this.toolbar.editor.takeFocus();
    }
    return false;
  }
});

var MenuButton = new Class(
{ Extends: SimpleToggleButton
, listnode: null

, initialize:function(toolbar, type)
  {
    this.parent(toolbar, type);

    this.listnode = new Element("ul");
    (new Element("div", { styles: { "display": "none" }})).grab(this.listnode).inject(this.node);

    this.node.addEvent("wh-menu-activateitem", this.activateItem.bind(this));
  }
, updateState:function(selstate)
  {
    //FIXME: this.active = (menu is currently showing)
    this.updateButtonRendering();
  }
, click: function(event)
  {
    event.stop();

    this.ensureSubMenu();
    if (!this.available || !this.toolbar.editor || !this.toolbar.editor.isEditable() || !this.listnode.childNodes.length)
      return;

    $wh.openMenuAt(this.listnode, this.node, { direction: "down" }, false);
    this.updateState(this.toolbar.editor ? this.toolbar.editor.getSelectionState() : null);
  }
  // Override to fill this.listnode with <li> menuitems
, ensureSubMenu: function()
  {
  }
  // Override to respond to selected menuitem (event.detail.menuitem is selected <li>)
, activateItem: function(event)
  {
    this.updateState(this.toolbar.editor ? this.toolbar.editor.getSelectionState() : null);
  }
});

var BlockStyleButton = new Class(
{ Extends: ToolbarButtonBase
, owngroup: true
, optionlist: []
, lasteditor:null

, initialize:function(toolbar)
  {
    this.parent(toolbar);
    this.node = new Element('span'
                           ,{"class":"wh-rtd-blockstyle"
                            });

    this.select = new Element('select'
                            ,{events: { change: this.selectStyle.bind(this)
                                      }
                             });
    this.node.adopt(this.select);

    this.updateStructure();
  }
, updateStructure:function(selstate)
  {
    //console.log('update structure',selstate);
    // IE8 needs $
    $(this.select).empty();

    this.lasteditor = this.toolbar.editor;
    if(!this.toolbar.editor)
      return;

    var blockstyles = this.toolbar.editor.getAvailableBlockStyles(selstate);
    for (var i=-1;i<blockstyles.length;++i)
    {
      var bs = blockstyles[i] || { def: { title: '', toolbarcss: '' }, tag: '' }
      var title = bs.def.title ? bs.def.title : bs.tag;
      var opt = new Element('option'
                           ,{'text':title
                            ,"value":bs.tag
                            ,"style":bs.def.toolbarcss
                            });

      opt.blockstyle = bs;
      this.optionlist.push(opt);
      this.select.adopt(opt);
    }
    this.select.fireEvent('wh-refresh', { target: this });

  }
, updateState:function(selstate)
  {
//    if(this.toolbar.editor != this.lasteditor)
    this.updateStructure(selstate);

    //FIXME what to do if we have no blockstyle?
    if(selstate)
    {
      this.optionlist[0].toggleClass('wh-rtd-unavailable', true);

//      for (var i = 0; i < this.optionlist.length; ++i)
//      {
//        var style = this.optionlist[i].blockstyle;
//        this.optionlist[i].toggleClass('-wh-rtd-unavailable', selstate.blockstyle.listtype != style.listtype)
//      }

      this.select.value = selstate.blockstyle ? selstate.blockstyle.tag : '$$none$$';
    }
    this.select.disabled = !(this.available && this.toolbar.editor && this.toolbar.editor.isEditable());
    this.select.fireEvent("wh-refresh"); //support replaced components
  }
, selectStyle:function(event)
  {
    if(this.toolbar.editor && this.select.value)
    {
      this.toolbar.editor.setSelectionBlockStyle(this.select.value);
      //this.toolbar.editor.takeFocus();
    }
  }
});

var ShowFormattingButton = new Class(
{ Extends: SimpleToggleButton

, updateState: function()
  {
    this.active = this.toolbar.editor && this.toolbar.editor.getShowFormatting();
    this.updateButtonRendering();
  }
, isAllowed:function(allowtags)
  {
    return true;
  }
  //FIXME: This custom click event isn't necessary if executeAction would be handled by RTE instead of EditorBase
, click: function(event)
  {
    event.stop();

    if (!this.available || !this.toolbar.editor || !this.toolbar.editor.isEditable())
      return;

    this.toolbar.editor.setShowFormatting(!this.active);
  }
});

var InsertTableButton = new Class(
{ Extends: MenuButton
, initialrows: 6
, initialcolumns: 8

, initialize:function(toolbar, type)
  {
    this.parent(toolbar, type);
  }
, ensureSubMenu: function()
  {
    if (this.listnode.childNodes.length)
      return;

    this.listnode.addClass("wh-rtd-tablemenu")
                 .addEvent("mouseleave", this.hoverItem.bind(this))
                 .addEvent("mousemove:relay(li)", this.hoverItem.bind(this));
    for (var row = 0; row < this.initialrows; ++row)
      for (var col = 0; col < this.initialcolumns; ++col)
      {
        var classNames = [ "wh-rtd-tablemenuitem" ];
        if (col == 0)
          classNames.push("wh-rtd-tablemenuitem-newrow");
        if (row == 0)
          classNames.push("wh-rtd-tablemenuitem-newcol");
        this.listnode.grab(new Element("li", { "html": "&nbsp;"
                                             , "class": classNames.join(" ")
                                             , "data-col": col + 1
                                             , "data-row": row + 1
                                             }));
      }

    this.statusnode = new Element("li", { "text": ""
                                        , "class": "wh-rtd-tablemenustatus disabled"
                                        });
    this.listnode.grab(this.statusnode);
  }
, updateState:function(selstate)
  {
    // Cannot insert table into a table
    this.available = selstate && selstate.tables.length == 0;
    this.parent(selstate);
  }
, isAllowed:function(allowtags)
  {
    // Called in free editor
    return allowtags.contains("table");
  }
, hoverItem: function(event, target)
  {
    event.stop();

    var selsize = this.getItemSize(target);
    this.listnode.getElements("li").each(function(menuitem, i)
    {
      var size = this.getItemSize(menuitem);
      menuitem.toggleClass("selected", !!selsize && !!size && size.x <= selsize.x && size.y <= selsize.y);
    }, this);
    this.statusnode.set("text", selsize ? (selsize.x + "x" + selsize.y) : "");
  }
, activateItem: function(event)
  {
    if(!this.toolbar.editor)
      return;

    var size = this.getItemSize(event.detail.menuitem);
    if (size)
      this.toolbar.editor.executeAction({ action: 'table'
                                        , size: size
                                        });
    this.parent(event);
  }
  // Return the col and row for a menu item
, getItemSize: function(menuitem)
  {
    if (menuitem && menuitem.getAttribute)
    {
      var x = parseInt(menuitem.getAttribute("data-col"), 10);
      var y = parseInt(menuitem.getAttribute("data-row"), 10);
      if (x > 0 && y > 0)
        return { x: x, y: y };
    }
  }
});

$wh.Rich.supportedbuttons =
  { "a-href": ToolbarButton
  , "b": SimpleToggleButton
  , "i": SimpleToggleButton
  , "u": SimpleToggleButton
  , "strike": SimpleToggleButton
  , "sup": SimpleToggleButton
  , "sub": SimpleToggleButton
  , "img": ToolbarButton
  , "action-properties": ToolbarButton
  , "action-clearformatting": ToolbarButton
  , "p-class": BlockStyleButton
  , "p-id": ToolbarButton

  , "ol": SimpleToggleButton
  , "ul": SimpleToggleButton
  , "li-decrease-level": ToolbarButton
  , "li-increase-level": ToolbarButton
  , "object-insert": ToolbarButton
  , "object-video": ToolbarButton
  , "table": InsertTableButton
  };

// Don't add show formatting on IE8, it messes up cursor movement
if (!Browser.ie || Browser.version > 8)
  $wh.Rich.supportedbuttons["action-showformatting"] = ShowFormattingButton;

$wh.Rich.Toolbar = new Class(
{ Implements: [Options]
, options: { hidebuttons: []
           //button layout. top level array is rows, consists of groups, and a group is either a single button (p-class) or an array of buttons
           //ADDME: Note, if new buttons are added, we probably need to update tollium (field-)rte.js to hide these in nonstructured mode
           , layout: [ [ "p-class", ["ul","ol","li-decrease-level","li-increase-level"], ["p-align-left","p-align-right","p-align-center","p-align-justify"], ["action-spellcheck","action-search","action-showformatting","action-properties"] ]
                     , [ ["b","i","u","strike"], ["sub","sup"], ["a-href","p-id"], ["img","object-video","object-insert","table","action-symbol"], ["action-clearformatting"] ]
                     ]
           , compact: false
           , allowtags: null
           }
, el:null
, buttons: []

, initialize: function (rte, element, options)
  {
    this.el=$(element);
    this.setOptions(options);

    this.buildButtonBar();
    this.statechangehandler = this.onStateChange.bind(this);
    if(rte)
      this.setEditor(rte);
  }
, setEditor:function(newrte)
  {
    if(this.editor==newrte)
      return;

    if(this.editor)
    {
      this.editor.removeEvent('statechange', this.statechangehandler);
    }

    this.editor=newrte;
    if(this.editor)
    {
      this.editor.addEvent('statechange', this.statechangehandler);
    }

    this.onStateChange();
  }

, createButtonObject: function(buttonname)
  {
    if(this.options.hidebuttons.contains(buttonname))
      return null;

    var buttontype = $wh.Rich.supportedbuttons[buttonname];
    if(!buttontype)
      return null;

    var newbutton = new buttontype(this, buttonname);
    if(this.options.allowtags && !newbutton.isAllowed(this.options.allowtags)) //filtering tags?
      return null;

    this.buttons.push(newbutton);
    return newbutton;
  }
, buildButtonBar: function ()
  {
    this.el.empty();

    for(var rowidx=0;rowidx<this.options.layout.length;++rowidx)
    {
      var row = this.options.layout[rowidx];
      for(var groupidx=0;groupidx<row.length;++groupidx)
      {
        var group = row[groupidx];

        if(typeof group == "string") //button in own group
        {
          var buttonobj = this.createButtonObject(group);
          if(!buttonobj)
            continue;

          this.el.appendChild(buttonobj.node);
          continue;
        }

        var currentgroup = null;

        for (var buttonidx=0;buttonidx<group.length;++buttonidx)
        {
          var button = group[buttonidx];
          var buttonobj = this.createButtonObject(button);
          if(!buttonobj)
            continue;

          if(!currentgroup)
          {
            currentgroup = new Element("span", {"class":"wh-rtd-toolgroup"});
            this.el.appendChild(currentgroup);
          }
          currentgroup.appendChild(buttonobj.node);
        }
      }
      if(!this.options.compact)
        this.el.appendChild(new Element("br"));
    }

    this.onStateChange();
  }

, onStateChange:function()
  {
    var selstate = this.editor ? this.editor.getSelectionState() : null;
    for (var i=0;i<this.buttons.length;++i) //ADDME Perhaps we shouldn't have separators inside the button array, but separate button-layout from list-of-buttons
      this.buttons[i].updateState(selstate);

/*  FIXME restore
    this.UpdateButtonState("bold", selstate.bold);
    this.UpdateButtonState("italic", selstate.italic);
    this.UpdateButtonState("underline", selstate.underline);

    this.SetButtonEnabled("insert_hyperlink", selstate.haveselection);
    this.SetButtonEnabled("remove_hyperlink", selstate.hyperlink);

    this.UpdateButtonState("bulleted_list", selstate.bulletedlist);
    this.UpdateButtonState("numbered_list", selstate.numberedlist);

    this.UpdateButtonState("align_left", selstate.alignleft);
    this.UpdateButtonState("align_center", selstate.aligncenter);
    this.UpdateButtonState("align_right", selstate.alignright);
    this.UpdateButtonState("align_justified", selstate.alignjustified);*/
  }

, getImageSrc: function(buttonname, disabled, width, height)
  {
    // If buttonpath was specified, link to the image in the buttonpath directory, otherwise link to the tollium image generator
    if (this.options.buttonpath)
      return this.options.buttonpath + buttonname + (disabled ? '_disabled' : '') + '.png';
    else
    {
      return '/tollium_todd/img.shtml?n=tollium:rte/' + buttonname + '&w=' + (width ? width : this.imgsize) + '&h=' + (height ? height : this.imgsize) + '&d=' + (disabled ? '1' : '');
    }
  }

, getButton: function(buttonname)
  {
    for (var i=0; i<this.buttons.length; ++i)
      if (this.buttons[i].type == buttonname)
        return this.buttons[i];
  }

, OnEditorLoaded: function()
  {
  }

, OnButtonHover: function (action, event)
  {
    if (action == this.lastactionhover)
      return;
    this.lastactionhover = action;

    // Don't show button tooltips if the rte is not enabled
    if (!this.enabled)
      return;

    var button = this.getButton(action);
    if (button && button.title)
      this.editor.ShowTooltip(button.title, event);
    else
      this.editor.HideTooltip();
  }

, UpdateButtonState: function (action, newstate)
  {
    var button = this.getButton(action);
    if (!button)
      return;
    button.active = newstate;
    this.UpdateButton(button);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  RTE ButtonBar overridable functions
  //

, addSeparator: function (parentnode)
  {
    var sep = new Element("div"
                         , { "class": "wh-rtd-separator"
                           , "text": '\xA0'
                           });
    parentnode.appendChild(sep);
  }

, ResizeTo: function (width, height)
  {
    this.node.style.width = width + 'px';
    this.node.style.height = (height-3) + 'px';
  }

});

})(document.id); //end mootools wrapper
