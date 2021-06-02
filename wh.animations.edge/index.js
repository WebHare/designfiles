/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../frameworks.mootools.more.class.binds');
require ('../frameworks.edge.2-0');
require ('../wh.compat.base');
require ('../wh.util.preloader');
/*! LOAD: frameworks.mootools, frameworks.mootools.more.class.binds, frameworks.edge.2-0 flag=debug
    LOAD: wh.compat.base, wh.util.preloader
!*/

jQuery.noConflict();
if(!window.$ && document.id)
  window.$=document.id; //force mootools reactivation

(function($) {

var old_request_image = AdobeEdge.Composition.prototype.requestImage;
var edgeimglisteners = {};

AdobeEdge.Composition.prototype.requestImage = function(a)
{
  function c() {
      e.unbind("load");
      e.unbind("error");
      for (var a = 0; a < b.imageRequestList.length; a++)
          if (b.imageRequestList[a] === f) {
              b.imageRequestList.splice(a, 1);
              break
          }
      if(listeners)
        listeners.each(function(listener) { ++listener.loadedimages; })

      b.imageRequestCount--;
      b.imageRequestCount <= 0 && b.$loadCalled &&
          setTimeout(function () {
              b.callReadyList()
          }, 0)
  }
  var listeners=edgeimglisteners[this.compId];
  if(listeners)
    listeners.each(function(listener) { ++listener.pendingimages; })

  this.imageRequestCount++;
  var b = this,
      f = new Image,
      e = jQuery(f);
  this.imageRequestList.push(f);
  e.load(c);
  e.error(c);
  f.src = a;

  return null
}

$wh.EdgeAnimation = new Class(
{ Implements: [Events, Options, $wh.PreloadableAsset]
, Binds: ['onParallaxScroll','updateParallaxPosition']
, options: { autoload: false
           , autoplay: null
           , compositionid: null
           , hookUpdateImageURL:null
           , debugparallax: false
           , waitforassets: false
           }
, parallaxes:[]
, compositionloaded: false
, compositionready: false
, loadedimages:0
, pendingimages:0
, initialize:function(url, options)
  {
    this.setOptions(options);
    this.url = url;
    if(this.url.slice(-1)!='/')
      this.url += '/';

    if(!this.options.compositionid)
      return console.error("No composition id specified");

    $wh.EdgeAnimation.imgpath[this.options.compositionid] = this.url;

    if(this.options.autoload)
      this.startPreload();
  }
, getPreloadStatus:function()
  {
    if(!this.options.waitforassets)
    {
      return { loaded: this.compositionloaded ? 1 : 0
             , total: 1
           }
    }
    if(!this.compositionloaded)
      return null; //we can't know yet
    return { loaded: this.loadedimages + (this.compositionready?1:0)
           , total: this.pendingimages + 1
           }
  }
, onStartPreload:function()
  {
    new $wh.Preloader( [ new $wh.PreloadableScript(this.url + 'loader.js')
                       ], { onComplete: this.onGotLoader.bind(this) } )
  }
, onGotLoader:function()
  {
    if(!edgeimglisteners[this.options.compositionid])
      edgeimglisteners[this.options.compositionid]=[];
    edgeimglisteners[this.options.compositionid].push(this);

    var comp = AdobeEdge.compositionDefns[this.options.compositionid];
    if(!comp)
      throw "No such composition '" + this.options.compositionid + "'";

    //FIXME check for actual success
    //FIXME load composition assets
    if(this.options.autoplay !== null)
    {
      //AdobeEdge.compositionDefns[this.options.compositionid].symbolData["stage"].tl["Default Timeline"].a = this.options.autoplay;
      comp.symbolData["stage"].tl["Default Timeline"].autoPlay = this.options.autoplay;
    }

    if(this.options.hookUpdateImageURL)
    {
      Object.each(comp.symbolData, function(symbol)
        {
          Array.each(symbol.content.dom, this.fixupDomItems.bind(this));
        }.bind(this));
    }

    this.fireEvent("compositionregistered", {target:this, composition: AdobeEdge.compositionDefns[this.options.compositionid]});
    AdobeEdge.registerCompositionReadyHandler(this.options.compositionid, this.onCompositionReady.bind(this));
    AdobeEdge.okToLaunchComposition(this.options.compositionid);

    var symelement = this.getComposition().getStage().getSymbolElement().get()[0];
    this.compositionloaded=true;
    this.checkPreloadDone();
  }
, checkPreloadDone:function()
  {
    if(!this.options.waitforassets)
    {
      if(this.compositionloaded)
        this.donePreload(true);
      return;
    }
    if(this.compositionready && this.loadedimages==this.pendingimages)
      this.donePreload(true);
  }
, fixupDomItems:function(item, idx)
  {
    if(item.t == "group")
      Array.each(item.c, this.fixupDomItems.bind(this));
    else if(item.t == "image" && this.options.hookUpdateImageURL)
      item.f[1] = this.options.hookUpdateImageURL(item.f[1]);
  }
, onCompositionReady:function()
  {
    this.compositionready=true;
    this.checkPreloadDone();
    this.fireEvent("ready");
  }
, getComposition:function()
  {
    return AdobeEdge.getComposition(this.options.compositionid);
  }
, getStage:function()
  {
    return this.getComposition().getStage();
  }
, getStageElement:function()
  {
    return $(this.getStage().element[0]);
  }
, stopAllSymbols:function()
  {
    this.stopSymbolAndChildren(this.getStage());
  }
, stopSymbolAndChildren:function(node)
  {
    node.stop();
    Array.each(node.getChildSymbols(), this.stopSymbolAndChildren.bind(this));
  }
  /* Setup a parallax: move the time offset of a symbol with the scroll position */
, setupParallax:function(options)
  {
    if(!options)
      options={};
    if(!options.symbol)
      options.symbol = this.getStage();
    if(!options.duration)
      options.duration = options.symbol.getDuration();

    if(!this.parallaxes.length)
    {
      $(window).addEvent("scroll", this.onParallaxScroll);
      $(window).addEvent("resize", this.onParallaxScroll);
    }

    this.parallaxes.push( { symbol: options.symbol
                          , duration: options.duration
                          , watchelement: options.watchelement ? $(options.watchelement) : $(window)
                          });
    this.updateParallaxPosition(this.parallaxes.getLast()); //update everything now
  }
, onParallaxScroll:function()
  {
    this.parallaxes.each(this.updateParallaxPosition);
  }
, updateParallaxPosition:function(parallax)
  {
    var maxscroll = (parallax.watchelement.getScrollSize().y - parallax.watchelement.getSize().y);
    var scrolloffset = parallax.watchelement.getScroll().y / maxscroll;
    var gotopos = Math.floor(scrolloffset * parallax.duration);
    if(this.options.debugparallax)
       console.log("[edge] Symbol '" + parallax.symbol.getSymbolTypeName() + "' scroll " + Math.floor(scrolloffset) + "/" + Math.floor(maxscroll) + " (" + (100*scrolloffset).toFixed(2) + "%) time: " + (gotopos/1000).toFixed(3));

    parallax.symbol.stop(scrolloffset * parallax.duration);
  }
});
$wh.EdgeAnimation.imgpath={};

window.addEvent("domready", function()
  {
    window.AdobeEdge.loaded = !0; //stolen from the asset preloader
  });

})(document.id);
