/* generated from Designfiles Public by generate_data_designfles */
require ('wh.ui.base');
require ('wh.pages.base');
/*! LOAD: wh.ui.base, wh.pages.base
!*/

(function($) { //mootools/scope wrapper

$wh.TabControl = new Class(
{ Implements: [ Options, Events ]
, options: {}
, pagemgr: null
, tabholder: null

, initialize: function(tabholder, options)
  {
    if(options && options.pagemgr)
    {
      this.pagemgr = options.pagemgr;
      delete options.pagemgr;
    }
    this.setOptions(options);

    this.tabholder = $(tabholder);
    this.tabholder.addEvent("click:relay(*[data-tab-for])", this.onSelectTab.bind(this));

    if (!this.pagemgr)
    {
      this.pagemgr = new $wh.PageManager;
      this.getTabs().each(function(tab)
      {
        var node = $(tab.getAttribute("data-tab-for"));
        if (node && node.hasClass("wh-page"))
          this.pagemgr.addPage(new $wh.PageBase( { node: node }));
      }, this);
    }

    this.updateSelectedTab();

    this.pagemgr.addEvent('pagechange', this.updateSelectedTab.bind(this));
    this.pagemgr.start();
  }

, onSelectTab:function(event, tabnode)
  {
    event.stop();
    this.setCurrentTab(tabnode.getAttribute('data-tab-for'));
  }

, getTabs:function()
  {
    return this.tabholder.getElements('*[data-tab-for]');
  }

, setCurrentTab: function(tabid)
  {
    var desttab = this.pagemgr.findPage(tabid);
    if(!desttab)
      return;

    this.pagemgr.start(desttab);
  }

, getCurrentTab: function()
  {
    return this.pagemgr.getCurrentPage();
  }

, updateSelectedTab: function()
  {
    var selectedtab = this.getCurrentTab() ? this.getCurrentTab().id : '';
    Array.each(this.getTabs(), function(node)
    {
      node.toggleClass('selected', node.getAttribute('data-tab-for') == selectedtab);
    });
    this.fireEvent("tabchange", { target: this });
  }
})

})(document.id);
