/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
/*! LOAD: frameworks.mootools.core, wh.compat.base
!*/

(function($) { //mootools wrapper

$wh.PreloadableAsset = new Class(
{ Implements: [Options,Events]
, options: { autoload: false }
, preloadstatus: null

, initialize: function(options)
  {
    this.setOptions(options);
    if(this.options.autoload)
      this.startPreload.bind(this).delay(0); //schedule load after the current new()
  }
, isPreloaded:function()
  {
    return this.preloadstatus && this.preloadstatus.done && this.preloadstatus.success;
  }
, startPreload: function(listener)
  {
    if(!this.preloadstatus)
    {
      this.preloadstatus = { success: false, done:false, listeners: listener?[listener]:[] };
      this.onStartPreload();
    }
    else if(listener)
    {
      if(this.preloadstatus.done)
        listener.__signalPreloadCompletion(this.preloadstatus.success);
      else
        this.preloadstatus.listeners.push(listener);
    }
  }
, onStartPreload: function()
  {
    console.log("PreloadableAsset does not implement onStartPreload",this);
  }
, donePreload:function(success)
  {
    if(!this.preloadstatus)
      this.preloadstatus= { success: false, done:false, listeners:[]};

    if(this.preloadstatus.done)
      return console.error("Duplicate call to donePreload",this);
    if( (success !== true) && (success !== false) )
      return console.error("Call to donePreload without setting success to true or false", this);

    this.preloadstatus.done=true;
    this.preloadstatus.success=success;
    this.preloadstatus.listeners.each( function(el) { el.__signalPreloadCompletion(success) });
    this.preloadstatus.listeners=null;

    this.fireEvent(success ? 'load' : 'error', { target: this });
  }
, getPreloadStatus:function()
  {
    return { loaded: this.preloadstatus && this.preloadstatus.done ? 1 : 0
           , total: 1
           }
  }
, failIfIncomplete:function()
  {
    if(this.preloadstatus.done)
      return false;//we were already complete
    this.donePreload(false);
    return true;
  }
});

$wh.PreloadableDomTree = new Class(
{ Implements: [$wh.PreloadableAsset]
, options: { autoload: false }
, subassets: []
, srclist: []
, preloaders: []
, initialize:function(el, options)
  {
    //ADDME if the tree is already in-dom, can we simply reuse that?
    el=$(el)
    var flattree = el.getElements('*').concat([el]);

    flattree.each(function(el)
      {
        if(el.nodeName.toUpperCase()=='IMG' && el.src)
          this.addImg(el.src);
        var bgimg=el.getStyle("background-image");
        if(bgimg!='none')
        {
          if(bgimg.substr(0,5) == 'url("')
            this.addImg(bgimg.substr(5,bgimg.length-7));
        }
      }.bind(this));


    this.srclist=[]; //no need to keep 'm
    this.setOptions(options);
    if(this.options.autoload)
      this.startPreload.bind(this).delay(0); //schedule load after the current new()
  }
, onStartPreload:function()
  {
    this.subloader = new $wh.Preloader(this.preloaders, {onComplete: this.donePreload.bind(this,true) });
  }
, addImg:function(src)
  {
    if(this.srclist.contains(src))
      return;
    this.srclist.push(src);
    this.preloaders.push(new $wh.PreloadableImage(src));
  }
, getPreloadStatus:function()
  {
    return this.subloader ? this.subloader.getPreloadStatus() : { loaded: 1, total: 1 };
  }
});

$wh.PreloadableImage = new Class(
{ Implements: [$wh.PreloadableAsset]
, options: { autoload: false }

, initialize:function(url, options)
  {
    this.imageurl = url;
    this.setOptions(options);
    if(this.options.autoload)
      this.startPreload.bind(this).delay(0); //schedule load after the current new()
  }

, onStartPreload:function()
  {
    //ADDME match against dom, not just us??
    for (var i=0;i<$wh.PreloadableImage.images.length;++i)
    {
      var image = $wh.PreloadableImage.images[i];
      if(image.src == this.imageurl) //already have it
      {
        if(image.loaded)
        {
          this.donePreload(true); //FIXME success/error detection
          return;
        }
        image.listeners.push(this);
        return;
      }
    }

    var imageidx = $wh.PreloadableImage.images.length;
    var image = { el: new Element("img", { events: { load: this.onImageLoad.bind(this,imageidx)
                                                   , error: this.onImageError.bind(this,imageidx)
                                                 //, readystatechange: this.onImageReadyStateChange.bind(this,imageidx)
                                                   }
                                           })
                 , loaded: false
                 , listeners: [this]
                 }

    $wh.PreloadableImage.images.push(image);

    // we need to set the src after creation, because IE will trigger the load event
    // directly after settings .src if the image was in the cache.
    // So before setting .src we need to be sure both the eventlisteners are set up and the image object is pushed on the list.
    image.el.src = this.imageurl;

    this.setupPreloadContainer();
    $wh.PreloadableImage.containernode.appendChild(image.el);
  }

  // makes sure we have a container to hide our preloading images from view
  // (and prevent firebug's domview being spammed with preloading images)
, setupPreloadContainer: function()
  {
    var cnode = $wh.PreloadableImage.containernode;

    // check if the preload container node exists and isn't removed from the document
    if (!cnode || !cnode.parentNode)
    {
      //console.log("Creating preload container");
      cnode = new Element("div", { styles: { display: "block"
                                           , position: "absolute"
                                           , visibility: "hidden"
                                           , top: "0"
                                           , left: "0"
                                           , width: "1px"
                                           , height: "1px"
                                           , overflow: "hidden"
                                           }
                                 }
                          );
      $(document.body).adopt(cnode);
      $wh.PreloadableImage.containernode = cnode;
    }
  }

, onImageLoad: function(imageidx)
  {
    var image = $wh.PreloadableImage.images[imageidx];
    if(image.loaded)
      return;

    image.loaded=true;
    for(var i=0;i<image.listeners.length;++i)
      image.listeners[i].donePreload(true); //FIXME success/error detection
  }

/*
, onImageReadyStateChange:function(scriptidx)
  {
    var image = $wh.PreloadableImage.images[scriptidx];
    if(image.el.readyState=='complete')
      this.onImageLoad(imageidx);
  }
*/

, onImageError: function(imageidx) // FIXME: what to do then??
  {
    console.error("Failed to load image "+this.imageurl);
    this.onImageLoad(imageidx); // FIXME: only done here so a preloader won't stall because an image that cannot be loaded
  }
});
$wh.PreloadableImage.typetitle = "image";
$wh.PreloadableImage.containernode=null;
$wh.PreloadableImage.images=[];

/** @short Preloadable script
    @long The preloadable script currently requires ALL references to the script to have been made through a PreloadableScript (Ie, no hardcoded or manual <script> tags to the same script) */
$wh.PreloadableScript = new Class(
{ Extends: $wh.PreloadableAsset
, initialize: function(scripturl, options)
  {
    this.parent(options);
    this.scripturl = scripturl;
  }
, onStartPreload: function()
  {
    //ADDME match against dom, not just us
    for (var i=0;i<$wh.PreloadableScript.scripts.length;++i)
    {
      var script = $wh.PreloadableScript.scripts[i];
      if(script.src == this.scripturl) //already have it
      {
        if(script.loaded)
        {
          this.donePreload(true); //FIXME success/error detection
          return;
        }
        script.listeners.push(this);
        return;
      }
    }

    var scriptidx = $wh.PreloadableScript.scripts.length;
    var script = { el: new Element("script", { type:"text/javascript"
                                             , src: this.scripturl
                                             , events: { load: this.onScriptLoad.bind(this,scriptidx)
                                                       , readystatechange: this.onScriptReadyStateChange.bind(this,scriptidx)
                                                       }
                                             })
                 , src: this.scripturl
                 , loaded: false
                 , listeners: [this]
                 }
    $wh.PreloadableScript.scripts.push(script);

    var parent = $$('head,body').pick();
    parent.appendChild(script.el);
  }
, onScriptLoad:function(scriptidx)
  {
    var script = $wh.PreloadableScript.scripts[scriptidx];
    if(script.loaded)
      return;

    script.loaded=true;
    for(var i=0;i<script.listeners.length;++i)
      script.listeners[i].donePreload(true); //FIXME success/error detection
  }
, onScriptReadyStateChange:function(scriptidx)
  {
    var script = $wh.PreloadableScript.scripts[scriptidx];
    if(script.el.readyState=='complete' || script.el.readyState=='loaded') //IE8 apparently reports 'loaded', not always 'complete' ?
      this.onScriptLoad(scriptidx);
  }
})
$wh.PreloadableScript.typetitle = "script";
$wh.PreloadableScript.scripts=[];

//No-op asset class that is always preloaded
$wh.DummyPreloadAsset = new Class(
{ Extends: $wh.PreloadableAsset
, onStartPreload: function()
  {
    this.donePreload(true);
  }
});
$wh.DummyPreloadAsset.typetitle = "dummy";

//A preloadable asset that takes a given number of seconds
$wh.PreloadableDelay = new Class(
{ Extends: $wh.PreloadableAsset
, options: { interval: 50 }
, starttime: null
, initialize:function(delay, options)
  {
    this.parent(options);
    this.delay = delay;
  }
, onStartPreload: function()
  {
    this.starttime = Date.now();
    this.donePreload.bind(this, true).delay(this.delay);
  }
, getPreloadStatus:function()
  {
    if(!this.starttime)
      return null;
    var progress = Math.min(1, (Date.now() - this.starttime) / this.delay);
    return { loaded: Math.floor(progress * (this.delay / this.options.interval))
           , total: Math.floor(this.delay / this.options.interval)
           };
  }
});

//Manually controlled preload class
$wh.ManualPreloadAsset = new Class(
{ Extends: $wh.PreloadableAsset
, initialize:function(options)
  {
    this.parent(options);
    this.preloadstatus = { success: false, done:false, listeners: [] };
  }
, onStartPreload: function()
  {
  }
});
$wh.DummyPreloadAsset.typetitle = "dummy";

$wh.Preloader = new Class(
{ Implements: [ Options, Events ]
, options: { timeout: null
           }
, assets:[]
, assetsloaded: 0
, assetsfailed: 0
, assetstoload: 0
, firedcompletion:false

, progressinterval:null
, timeouttimer:null
, istimedout:false

, initialize:function(assets, options)
  {
    this.setOptions(options);

    if(this.options.timeout !== null)
      this.timeouttimer = this.onTimeout.bind(this).delay(this.options.timeout);

    assets=Array.from(assets).clean();
    this.assetstoload=assets.length;

    for(var i=0;i<assets.length;++i)
    {
      if(!assets[i].startPreload)
      {
        console.log("Asset does not implement the preload interface",assets[i]);
        console.trace();
        ++this.assetsfailed;
        continue;
      }
      this.assets.push(assets[i]);
      assets[i].startPreload(this);
    }

    $wh.Preloader.active.push(this);
    this.progressinterval = this.__checkProgress.bind(this).periodical(20);
    this.__checkPreloadCompletion();
  }
, getPreloadStatus:function()
  {
    if(this.firedcompletion)
      return this.savedpreloadstatus;

    var deeploaded=0,deeptotal=0;
    for (var i=0;i<this.assets.length;++i)
    {
      var deepassetinfo = this.assets[i].getPreloadStatus();
      if(!deepassetinfo)
        return null; //nothing useful to report, this asset doesn't know how much to load

      deeploaded += deepassetinfo.loaded;
      deeptotal += deepassetinfo.total;
    }

    return { loaded: deeploaded
           , total: deeptotal
           }
  }

, __checkProgress:function()
  {
    if(this.firedcompletion)
    {
      clearInterval(this.progressinterval);
      return;
    }

    var preloadstats = this.getPreloadStatus();
    if(!preloadstats)
      return;

    if(preloadstats.loaded == this.lastloaded)
      return;

    this.lastloaded = preloadstats.loaded;
    this.fireEvent("progress", { target: this, loaded: preloadstats.loaded, total: preloadstats.total});
  }
, __signalPreloadCompletion:function(success)
  {
    if(success)
      ++this.assetsloaded;
    else
      ++this.assetsfailed;
    this.__checkPreloadCompletion();
  }
, __checkPreloadCompletion:function()
  {
    if(this.firedcompletion)
      return;

    if( (this.assetsloaded + this.assetsfailed) < this.assetstoload)
      return;

    if(this.timeouttimer)
      clearTimeout(this.timeouttimer);

    this.savedpreloadstatus = this.getPreloadStatus(); //save our current preload status
    this.firedcompletion=true;

    $wh.Preloader.active.erase(this);

    if(this.savedpreloadstatus) //last progress event
      this.fireEvent("progress", {target:this, loaded:this.savedpreloadstatus.loaded, total:this.savedpreloadstatus.total});

    // Call fireEvent with a delay so it will never be called synchronously
    this.fireEvent.bind(this, "complete", {target:this, loaded: this.assetsloaded, total: this.assetstoload, failed: this.assetsfailed, success: this.assetsfailed==0, timeout: this.istimedout }).delay(0);
    this.assets=[]; //stop referencing the assets we're no longer interested in
  }
, onTimeout:function()
  {
    this.istimedout=true;
    this.assets.each(function(asset) { asset.failIfIncomplete() } );
  }
});

$wh.Preloader.active=[];
$wh.Preloader.dumpAll = function()
{
  console.log(new Date,"preloader dumpAll (" + $wh.Preloader.active.length + " active)");
  $wh.Preloader.active.each(function(preloader)
    {
      var waiting = [];
      for (var i=0;i<preloader.assets.length;++i)
      {
        var state = preloader.assets[i].getPreloadStatus();
        if (!state||state.loaded != state.total)
        {
          waiting.push({ loaded: state ? state.loaded : "unknown"
                       , total:  state ? state.total  : "unknown"
                       , url: preloader.assets[i].url ? preloader.assets[i].url : ""
                       , obj: preloader.assets[i]
                       });
        }
      }
      if(waiting.length)
        console.log("Preloader is waiting for", waiting, preloader);
    });
};

})(document.id); //end mootools wrapper
