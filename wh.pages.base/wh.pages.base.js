/* generated from Designfiles Public by generate_data_designfles */
require ('./pagebase.css');
require ('frameworks.mootools.core');
require ('wh.util.preloader');
/*! LOAD: frameworks.mootools.core, wh.util.preloader
    !*/

/*
    This class helps you to have multiple pages within a single HTML page.
    It's task is more specific than the SinglePageApp class (which only keeps a state and doesn't know the concept of page and showing and hiding pages).


    CSS clases:
    - wh-page: base class for all pages
    - isvisible: the page is visible (but may be transitioning)
    - isactive: the currently focused page (should be at most one). always visible

    DOM:
    - data-pagemgr-start="" - when the element is clicked the pagemanager (to which the page belongs) will jump to the page with the specified ID

    Misc
    - If a global page manager is set, it'll respond to hash changes and set the hash with the id of the current page.
    - The data-page attribute is obsolete!
    - $wh.startPage() is a shortcut to the globalpagemanager.start()
      (M: not convinced this is a usefull shortcut or not)



    General thoughts (WouterH):

    - het liefst een mechanisme waarbij je eenvoudig een page transition kunt maken. Transitions zijn bijv slide left/right,
      fade out/in (overgang naar zwart en terug), en zo kun je er nog 84 verzinnen. Het liefst zou je globaal een
      transitie (vooruit en/of achteruit) willen instellen

    - ik wil ook graag subpagina's. Dus niet alleen #page1, #page2, maar #page1.sub1, #page.sub2; of zelfs
      #page.sub1.subsub1, etc

      (ik heb nu alleen maar pages (1 niveau dus), de vraag bij subpage's is: hoe ver moet pagemgr je hierbij helpen? op een
      gegeven moment wordt het toch 'tja, nu ga je te ver, zoek het zelf maar uit'


    Nice to haves:

    - generieke preloader code:

        "general preloader code possible? I reckon we nearly always will want a preloader, since most SPA's are pretty big

        IMHO, it should allow us to:

        - specify a minimum amount of time that the preloader should take
        - nice to have: make the preloader smart enough to guess the percentage
        - nice to have: define a page that needs to be loaded for the preloader to finish (preload other stuff in the bg)"

    - gerelateerd aan transities zou het mooi zijn als de SPA onthoudt welke route je volgt, zodat je een
      back(useTransition) functie kunt maken

    - generieke Analytics pageViews zou ook mooi zijn, bijv. een direct vertaling van #hash naar een trackPageView (of anders
      dat je per page de pageView in kunt stellen)

    - staat los hiervan, maar veel sites (zeker SPA's) moeten verticaal in het midden uitgelijnd worden. Een globale functie
      daarvoor zou mooi zijn.
      (MARK: in alle moderne browseres behalve IE kan je dat lekker makkelijk met Flexboxes doen)

    - in DEAB had ik een automatisch gevulde container met linkjes naar alle pages en subpages... dan kon ik rondklikken
      op die linkjes, dat ging dan zonder page transition enzo. Is voor ontwikkeling, debugging en testing wel een leuke
      optie om aan te kunnen zetten
*/

(function($) { //mootools wrapper

$wh.PageBase = new Class(
{ Implements  : [Options]

, donefirstshow: false
, id: null

  /** Create a new PageBase object
      @param options
      @cell options.id Id of page (and of element)
      @cell options.pagemanager If set, the page is automatically added to that page manger
  */
, initialize: function(options)
  {
    this.setOptions(options);

    if (options.id)
      this.id = options.id;

    if(options.node)
      this.node = options.node;

    if (options.pagemanager)
      options.pagemanager.addPage(this);

    ++$wh.PageBase.seqnr;
    if(!this.id)
      this.id = this.node && this.node.id ? this.node.id : "page" + $wh.PageBase.seqnr;

//console.info("STORE", options.pagemanager);

//    this.pageinfo = pageinfo;
  }
, getPreloadableAssets:function()
  {
    var pagenode = this.getPageNode();
    return pagenode ? [ new $wh.PreloadableDomTree(pagenode) ] : [];
  }
, getPageNode: function()
  {
    return this.node || $(this.id);
  }

, beforeFirstShow: function(event)
  {
    // do any setup which only needs to be done once AND require access to the dom,
    // for example:
    // - add event listeners/delegation
    // - setup animators and dom
  }

, beforeShow: function(event)
  {
    // - restore the page to it's initial state
    // - call reset() on timeline animators
  }

, afterShow: function(event)
  {
    // - start most animations here, because the page transition is now
    //   finished and viewers can now focus their attention on animations within the page
  }

, beforeHide: function(event)
  {
    // stop heavy animations here, so they don't slow down page transitions
  }

, afterHide: function(event)
  {
    // last minute stopping of animations and cleanup
  }
});
$wh.PageBase.seqnr=0;

$wh.PageManager = new Class(
{ Extends: $wh.PreloadableAsset
, Implements: [ Events, Options, $wh.PreloadableAsset ]

/* general preloader code possible?

, preloader:               null
, preloader_mintime:        0 //3000 // minimum time to show the preloader
, preloadisdone:            false
, preloadershownlongenough: true
, initial_preload_done:     false

*/

/* Initialization */

, options: { debug: false
           , defaultpage: ''
           }
, pages: []

// state
, previouspage: null // last page shown before the current page
, currentpage: null // current page object
, nextpage: null

, pagetweenisdone: false
, started: false
, history: []
, defaultpage: null

, initialize: function(options)
  {
    this.parent(options);
    if($wh.debug.pgm)
      this.options.debug=true;
    if(this.options.debug)
      console.log("[pagemanager] debugmode activated");
  }

, addPage: function(pageobj)
  {
    if (!pageobj)
    {
      console.warn("Empty pageobj given to $wh.PageManager.addPage()");
      return;
    }

    if (!"node" in pageobj)
      console.error("Pages must provide a node.");

    //FIXME: Do we need more checks for pageobj validity?

    this.pages.push(pageobj);
    pageobj.node.store("wh-pagemgr", this); // !!! for internal use (so we can make wh-pagemgr-start="" work)
  }

, addPages: function(pages)
  {
    for (i = 0; i < pages.length; i++)
      this.addPage(pages[i]);
  }
, getCompletedPages:function()
  {
    return this.history.slice(0,this.history.length-1);
  }
, getCurrentPage: function()
  {
    return this.currentpage;
  }
, getPreviousPage:function()
  {
    for (var i=0;i<this.pages.length;++i)
      if(this.pages[i]==this.currentpage)
        return this.pages[i-1];
    return null;
  }
, getNextPage:function()
  {
    for (var i=0;i<this.pages.length;++i)
      if(this.pages[i]==this.currentpage)
        return this.pages[i+1];
    return null;
  }

  //find page by object or element id
, findPage:function(page)
  {
    if(typeof page == "string")
    {
      for (i = 0; i < this.pages.length; i++)
        if(this.pages[i].id && this.pages[i].id.toUpperCase() == page.toUpperCase())
          return this.pages[i];
      return null;
    }

    if(instanceOf(page, Element))
    {
      //find page by dom node
      // FIXME: isn't this easyer?: this.pages.getByProperty("node", page);

      for (i = 0; i < this.pages.length; i++)
        if(this.pages[i].node == page)
          return this.pages[i];
      return null;
    }

    return this.pages.contains(page) ? page : null;
  }
, findPageByNode:function(node)
  {
    // FIXME: isn't this easyer?: this.pages.getByProperty("node", node);

    var page=null;
    Array.some(this.pages, function(testpage)
    {
      if(testpage.node == node)
        page = testpage;
      return page;
    });
    return page;
  }

  /** Jump to the specified page (by object or id). If no page specified, jump to first page. Launch the pagemanager if not done yet
  */
, start:function(page, noleavecheck)
  {
    this.doStart(page, null, noleavecheck);
  }

  /** Set the page that is started when no history is available for back()
  */
, setDefaultPage: function(page)
  {
    this.options.defaultpage = page;
  }

  /** Go to the previous page in the history
  */
, back: function()
  {
    if (this.history.length >= 2)
    {
      var nextpage = this.history[this.history.length - 2];
      this.history.splice(this.history.length - 2, 2);
      this.doStart(nextpage, null);
      return true;
    }
    return false;
  }
, backTo:function(backtopage)
  {
    var maxiteration = this.history.length;
    var backpos = this.history.indexOf(backtopage);

    if(this.options.debug)
      console.log("backTo", backpos, backtopage);
    if(backpos == this.history.length-1)//already at that page
      return;

    if(backpos == -1)
      return false;
    if(backpos == 0)
      this.history = [];
    else
      this.history = this.history.slice(0, backpos);

    this.doStart(backtopage, null);
  }
, backToFirst:function()
  {
    if(this.history.length > 1)
      this.backTo(this.history[0]);
  }
, doStart: function(page, activatedby)
  {
    if(this.options.debug)
      console.log("doStart", page, activatedby);
    if(!this.pages.length)
      throw "Invoking start() before any pages are registered";

    if(this.started && !page) //restarting without selecting a page
      return;

    if(page)
    {
      this.nextpage = this.findPage(page);
      if(!this.nextpage)
        throw "Could not find page '" + page + "'";
    }
    else if(globalpagemanager == this)
    {
      var hash = (location.hash || '#').substr(1);
      hash=hash.split(',')[0];
      if(hash)
      {
        this.nextpage = this.findPage(hash);
        if(!this.nextpage && this.options.debug)
          console.warn("[pagemanager] the hash referred to the page '" + hash + "' but no such page was registered");
      }
    }
    if(!this.nextpage)
      this.nextpage = this.pages[0];

    if(this.nextpage == this.currentpage) //already there (ADDME: force/restart option?)
      return;

    if(!this.started)
    {
      if(this.options.debug)
        console.log("[pagemanager] launching" + (page ? " with page '" + this.nextpage.id + "'" : " at first page '" + this.nextpage.id + "'"));
      this.launchPageManager();
    }
    else
    {
      if(this.options.debug)
        console.log("[pagemanager] requesting page " + this.nextpage.id);
    }

    this.previouspage = this.currentpage;

    //Are we allowed to navigate away?
    if(this.previouspage)
    {
      var evt = new $wh.PageManager.BeforeLeaveEvent(this, this.previouspage, this.nextpage);
      this.fireEvent("beforepageleave", evt);
      if(evt.defaultPrevented)
        return;
    }

    var prevpagenode = this.previouspage ? this.previouspage.getPageNode() : null;
    if(this.previouspage)
    {
      this.invokePageHandlers(this.previouspage, prevpagenode, "beforeHide");
      if(prevpagenode)
        prevpagenode.addClass("ishiding").removeClass("isactive");
    }

    var nextpagenode = this.nextpage ? this.nextpage.getPageNode() : null;
    if(nextpagenode)
    {
      this.prepareIncomingPage(nextpagenode); //give a chance to position (off-screen) etc
      nextpagenode.addClass("isvisible");
    }
    if(!this.nextpage.donefirstshow)
    {
      this.invokePageHandlers(this.nextpage, nextpagenode, "beforeFirstShow", { activatedby: activatedby })
      this.nextpage.donefirstshow=true;
    }

    if(nextpagenode)
      nextpagenode.addClass("isvisible");
    this.invokePageHandlers(this.nextpage, nextpagenode, "beforeShow", { activatedby: activatedby });

    var onfinish = this.completePageTransition.bind(this, this.previouspage, this.nextpage, prevpagenode, nextpagenode);
    this.runPageTransition(prevpagenode, nextpagenode, onfinish);
    $wh.fireLayoutChangeEvent(nextpagenode);
  }

, prepareIncomingPage:function(nextpagenode)
  {
  }

, runPageTransition:function(prevpagenode, nextpagenode, onfinish)
  {
    onfinish();
  }

, completePageTransition:function(prevpage, nextpage, prevpagenode, nextpagenode)
  {
    this.currentpage = this.nextpage;
    this.history.push(this.nextpage);

    this.nextpage = null;

    this.fireEvent("pagechange", { target: this });

    if(prevpage)
    {
      this.invokePageHandlers(prevpage, prevpagenode, "afterHide");
      if(prevpagenode)
        prevpagenode.removeClass("isvisible").removeClass("ishiding");
    }

    if(nextpagenode)
      nextpagenode.addClass("isactive");
    this.invokePageHandlers(nextpage, nextpagenode, "afterShow");
    $wh.fireLayoutChangeEvent(nextpagenode);
  }

, invokePageHandlers:function(page, node, eventname, event)
  {
    if(!event)
      event={};

    if(this.options.debug)
      console.log("[pagemanager] invoking " + eventname + " on page '" + page.id + "'");

    event.type=eventname;
    event.target=node;
    event.pagemgr=this;
    event.page=page;

    page[eventname](event);
    if(node)
    {
      var wheventname = "wh-" + eventname.toLowerCase();
      if(this.options.debug)
        console.log("[pagemanager] firing " + wheventname + " on node", node);
      node.fireEvent(wheventname, event);
    }
    return node;
  }

, launchPageManager:function()
  {
    this.started = true;

    //WouterH: Poging tot handige debug optie, een container met hyperlinks naar alle pages
    //    Maar zo wel, dan moeten we een "debug container" op kunnen geven, dus dat je in je dom een element klaarzet:
    //    <div id="debugcontainer"> (en die id wil je dan opgeven)
    if (this.options.debug && $("debugcontainer"))
    {
      var debugpanel = new Element("div");

      // add each page
      for (i = 0; i < this.pages.length; i++)
      {
        if (i > 0)
          debugpanel.adopt(new Element("span", { "text": " | " }));

        debugpanel.adopt(new Element("a", { "href": "#"
                                          , "text": this.pages[i].id
                                          , "data-page": this.pages[i].id
                                          }
                                    ));
      }

      $("debugcontainer").adopt(debugpanel);
    }
  }

, onStartPreload:function()
  {
    var preloadassets=[];
    this.pages.each(function(page)
    {
      preloadassets.combine(page.getPreloadableAssets());
    });
    this.subloader = new $wh.Preloader(preloadassets, { onComplete: this.donePreload.bind(this,true) });
  }

, getPreloadStatus:function()
  {
    return this.subloader.getPreloadStatus();
  }
})

$wh.PageManager.BeforeLeaveEvent = new Class(
{ Extends: $wh.Event
, currentpage: null
, nextpage: null
, initialize:function(pagemgr, currentpage, nextpage)
  {
    this.target = pagemgr;
    this.currentpage = currentpage;
    this.nextpage = nextpage;
  }
});

var globalpagemanager = null;

function onPageMgrHashChange()
{
  var hash = (location.hash || '#').substr(1);
  hash=hash.split(',')[0];
  if(globalpagemanager && globalpagemanager.findPage(hash) && globalpagemanager.started)
    globalpagemanager.start(hash);
}

$wh.setGlobalPageManager = function (pagemgr) //the global page manager responds to hashes, a.data-page etc
{
  if(!globalpagemanager)
  {
    //FIXME delay these until start of page manager!
    $(window).addEvent('hashchange', onPageMgrHashChange);
    onPageMgrHashChange();

    //setup global page management
    // !! data-page has been obsoleted by data-pagemgr-start which works for all pagemanagers (not only the global pagemanager)
    document.addEvent("click:relay(a[data-page])", function(event, node)
      {
        console.warn("data-page is obsolete. use data-pagemgr-start instead.");

        event.stop();
        if(globalpagemanager)
        {
          var page = node.getAttribute('data-page');
          if (page == 'wh-back')
          {
            if (!globalpagemanager.back() && globalpagemanager.options.defaultpage)
              globalpagemanager.doStart(globalpagemanager.options.defaultpage, node);
          }
          else
            globalpagemanager.doStart(page, node);
        }
      });
  }
  globalpagemanager = pagemgr;
}
$wh.startPage = function(page)
{
  if(!globalpagemanager)
    throw "$wh.startPage invoked but no global page manager set";
  globalpagemanager.start(page);
}



$wh.__OnPagemgrStartActionClicked = function(event, node)
{
  // FIXME: !!!use ID's or selector's ?
  var pageselector = node.getAttribute("data-pagemgr-start");

  var pagenode = $(pageselector);
  if (!pagenode)
  {
    console.error("Cannot find a node matching ", pageselector);
    return;
  }

  var managerobj = pagenode.retrieve("wh-pagemgr"); //("wh-page");
  if (!managerobj)
  {
    console.error("Node", pagenode, "not associated with an pagemanager");//" $wh.Pagebase instance.")
    return;
  }

  managerobj.start(pagenode);
}

$wh.__HookPageBaseRelays = function()
{
  document.addEvent("click:relay([data-pagemgr-start])", $wh.__OnPagemgrStartActionClicked);
}

window.addEvent("domready", $wh.__HookPageBaseRelays);


})(document.id); //end mootools wrapper
