/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
/*! LOAD: frameworks.mootools.core, wh.compat.base !*/

(function($) { //mootools wrapper

$wh.ToolbarButton = new Class(
{ Implements: [Options, Events]
, toolbar:null
, options: { label: null
           , classnames: null
           }

, initialize:function(toolbar, options)
  {
    this.toolbar=toolbar;
    this.setOptions(options);
  }
, executeAction:function()
  {
    this.fireEvent("execute");
  }
, getLabel:function()
  {
    return this.options.label || '';
  }
, getClassNames:function()
  {
    return this.options.classnames || [];
  }
});

$wh.ToolbarPanel = new Class(
{ Implements:[Options,Events]
, panel:null
, initialize:function(options)
  {
    this.setOptions(options);
    this.panel = new Element("div",{"class":"wh-toolbar-panel open"
                                   });
  }
, toElement: function()
  {
    return this.panel;
  }
, addButton: function(button)
  {
    var button = new Element("div",{"class":["wh-toolbar-button"].append(button.getClassNames()).join(" ")
                                   ,"text": button.getLabel()
                                   ,"events": { "click": button.executeAction.bind(button) }
                                   });
    this.panel.adopt(button);
  }
});

$wh.Toolbar = new Class(
{ Implements: [ Events ]
, buttonbar:null
, mainpanel:null
, modalpanel:null
, modalholder:null

, initialize:function()
  {
    this.buttonbar = new Element("div",{"class":"wh-toolbar"
                                       });

    this.mainpanel = new $wh.ToolbarPanel;
    this.buttonbar.adopt(this.mainpanel);

    this.modalholder = new Element("div", {"class":"wh-toolbar-modalholder"});
    this.buttonbar.adopt(this.modalholder);

    new Element("div", {"class":"wh-toolbar-button wh-toolbar-button-applymodal"
                       ,"text":"Apply"
                       ,"events": { "click": this.onModalApply.bind(this) }
                       }).inject(this.modalholder);
    new Element("div", {"class":"wh-toolbar-button wh-toolbar-button-revertmodal"
                       ,"text":"Revert"
                       ,"events": { "click": this.onModalCancel.bind(this) }
                       }).inject(this.modalholder);
  }
, toElement: function()
  {
    return this.buttonbar;
  }
, setSize:function(w,h)
  {
    this.buttonbar.setStyles( { width: w
                              , height: h
                              });
  }
, addButton: function(button)
  {
    this.mainpanel.addButton(button);
  }
, activateModalPanel:function(subpanel)
  {
    if(this.modalpanel)
      this.closeModalPanel();

    $(this.mainpanel).removeClass('open');
    this.modalholder.addClass('open');
    this.modalpanel = subpanel;
    this.fireEvent("modal-opened");
  }
, closeModalPanel:function()
  {
    if(!this.modalpanel)
      return;

    this.modalpanel.fireEvent("close");
    this.modalpanel = null;
    $(this.mainpanel).addClass('open');
    this.modalholder.removeClass('open');
    this.fireEvent("modal-closed");
  }
, onModalApply:function()
  {
    this.modalpanel.fireEvent("apply");
    this.closeModalPanel();
  }
, onModalCancel:function()
  {
    this.modalpanel.fireEvent("cancel");
    this.closeModalPanel();
  }
});

})(document.id); //end mootools wrapper
