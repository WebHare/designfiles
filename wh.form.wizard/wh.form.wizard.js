/* generated from Designfiles Public by generate_data_designfles */
require ('wh.form');
require ('wh.pages.base');
/*! LOAD: wh.form,  wh.pages.base
!*/

(function($) { //mootools/scope wrapper

$wh.Form.Wizard = new Class(
{ pagemgr: null
, handler: null
, options: { jumptofocus: true
           }
, initialize: function(formhandler, options)
  {
    if(!formhandler)
      throw Error("Invalid formhandler passed");
    this.handler = formhandler;
    if(options && options.pagemgr)
    {
      this.pagemgr = options.pagemgr;
    }
    else //Generate pages
    {
      this.pagemgr = new $wh.PageManager;

      var skipnodes = this.handler.form.getElements('.wh-page .wh-page');
      Array.each(this.handler.form.getElements('.wh-page'), function(node)
      {
        if(skipnodes.contains(node))
          return;
        this.pagemgr.addPage(new $wh.PageBase( { node: node }));
      }.bind(this));
    }

    this.pagemgr.start();
    this.handler.addEvent("formaction", this.onFormAction.bind(this));
    this.handler.addEvent("focuserror", this.onFormFocus.bind(this));
    this.handler.addEvent("reset", this.onFormReset.bind(this));
  }
, start:function(pageelementid)
  {
    this.pagemgr.start(pageelementid);
  }
, getVisitedTabs:function()
  {
    var pages = [];
    Array.each(this.pagemgr.getCompletedPages(), function(page)
    {
      pages.push(page.getPageNode())
    });
    pages.push(this.pagemgr.getCurrentPage().getPageNode());
    return pages;
  }
, onFormAction:function(event)
  {
    if(event.formaction == 'back')
    {
      event.stop();
      if(this.pagemgr.back())
        $wh.track("form","back",this.pagemgr.getCurrentPage().node);

      return;
    }
    if(event.formaction == 'next')
    {
      event.stop();

//FIXME VALIDATE BEFORE VERIFY

      var nextpageid = this.pagemgr.getCurrentPage().getPageNode().getAttribute('data-form-nextpage');

      if(nextpageid)
      {
        this.nextpage = this.pagemgr.findPage(nextpageid);
        if(!this.nextpage)
          throw new Error("No such page '" + nextpageid + "' (referred in data-form-nextpage)");
      }
      else
      {
        this.nextpage = this.pagemgr.getNextPage();
      }

      if(!this.nextpage) //convert to a submission
      {
        this.handler.validateAndSubmit(event.button);
        return;
      }

      var pagenode = this.pagemgr.getCurrentPage().getPageNode();
      //validate locally before running verifications
      this.handler.validatePage(pagenode, this.validatedForNext.bind(this, event.button));
      return;
    }
  }
, onFormFocus:function(event)
  {
    var gototab;
    Array.some(this.getVisitedTabs(), function(tab)
    {
      if(tab.contains(event.node))
        gototab = tab;
      return;
    });

    if(gototab)
    {
      var page = this.pagemgr.findPageByNode(gototab);
      if(page)
        this.pagemgr.backTo(page);
    }
  }
, onFormReset:function()
  {
    this.pagemgr.backToFirst();
  }
, validatedForNext:function(button)
  {
    var nextstep = this.submittedToNextPage.bind(this)
    var check = button.getAttribute('data-form-pagevalidate');
    if(check)
    {
      this.handler.verifyUsingRPC(this.getVisitedTabs(), 'pagevalidate', check, nextstep);
      return;
    }
    nextstep();
  }
, submittedToNextPage:function(opts)
  {
    var nextpageevent = new $wh.Event;
    nextpageevent.initEvent('wh-form-nextpage', true, true);
    nextpageevent.target = this.pagemgr.getCurrentPage().getPageNode();
    if(opts.nextpage)
      this.nextpage = this.pagemgr.findPage(opts.nextpage);

    nextpageevent.nextpage = this.nextpage;
    nextpageevent.target.fireEvent('wh-form-nextpage', nextpageevent);

    if(nextpageevent.defaultPrevented)
      return;

    if(!instanceOf(nextpageevent.nextpage, $wh.PageBase))
    {
      this.nextpage = this.pagemgr.findPage(nextpageevent.nextpage);
      if(!this.nextpage)
        throw new Error("No such page '" + nextpageevent.nextpage + "' (returned by nextpage event)");
    }
    this.pagemgr.start(this.nextpage);
    $wh.track("form","next",this.pagemgr.getCurrentPage().node);
  }
});

})(document.id);
