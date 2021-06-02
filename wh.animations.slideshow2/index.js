/* generated from Designfiles Public by generate_data_designfles */
require ('.././slideshow2.css');
require ('../frameworks.mootools');
require ('../wh.ui.base');
/*! LOAD: frameworks.mootools, wh.ui.base
!*/

/*
wh.util.resizelistener
*/


/*
NOTES:

- if the part of the DOM in which you have the wh-slideshow-item's has display: none;
  the slide sizes cannot be determined and slides cannot be properly layed out.
  In this case specify a slidewidth AND slideheight and these sizes will be used instead.

- Supported methods are:

FIXME: -----> changed
  -- 'slide-horizontal' (default)
  -- 'slide-vertical'
  -- 'fade-in'
  -- 'fade-in-out'
  -- 'css-animation'
  -- 'display-block' - also usefull as fallback for IE8

  If you want fading, it's best to use 'fade-in' for images and 'fade-in-out' for text

Events
  - prevbutton
  - nextbutton
  - startslide
  - endslide

Styling:
  - wh-slideshow
  - wh-slideshow-item
  - wh-slideshow-selected - used on jumpbuttons



Slideshow 2:
DONE
- options
    - jumpbutton_normalclass - REMOVED, having a selectedclass should be enough
    - slide_onstart - REMOVED, use onStartslide instead
    - slide_onend - REMOVED, use onEndslide instead
    - initialdelay - REMOVED (useless)
    - resizelistener - COMMENTED OUT for now
    - transition - REMOVED
    - prevbutton_disabledclass - REMOVED
    - nextbutton_disableclass - REMOVED

- CSS
    - not defaulting to use display: none; on slides that should not be visible
      (because it throws away images from memory/texture buffers)

- removed frameworks.mootools.more.element.measure dependancy

- removed -wh legacy CSS classes

- removed all animation bases which could be done better using CSS



- rename delay         to slideviewduration
- rename slideduration to slidetransitionduration
- rename startposition to startslideidx
- combine prevbutton_enabledclass and nextbutton_enabledclass + set default to 'enabled' ??
- combine prevbutton_disabledclass and nextbutton_disabledclass + set default to 'enabled' ??
- default 'selected' for slide_selectedclass ??
- remove all non-CSS animation/transition based animation code
- remove stepsize ? (80/20 rule -> easy to implement in own site code)

*/

(function($) { //mootools wrapper

if(!window.$wh) window.$wh={};

$wh.Slideshow2 = new Class(
{ Implements: [Events,Options]
, element: null
, slides: []
, slidearea: null
, options: { jumpbuttons: null
           , jumpbutton_selectedclass: 'wh-slideshow-selected'
           , jumpbutton_animate: false //true: when nativating using the jumpbutton, animate to the next slide
           , jumpbutton_stop: false    //true: when navigating using the jumpbutton, stop the automatic playback

           //, cssclass_enabled:  "" // class applied to prevbutton and nextbutton when enabled

           , prevbutton: null
           , prevbutton_enabledclass: ''

           , nextbutton: null
           , nextbutton_enabledclass: ''

           , slides: null
           , slidewidth: null
           , slideheight: null
           , slide_selectedclass: ''

           , delay:         3000
           , slideduration: 1000

           // animation settings
           , method: "css-animation"
           , methodoptions: {}
           , limitlastposition: false //limit position of last slide to end of the viewport (only relevant for slide-horizontal and slide-vertical)
           , anim: "fade" // anim for method 'css-animation'

           , autoplay: false
           , startposition:0
           , loop: false //if at end or begin, goto first/last slide

           , pauseonhover: false    // if true the slideshow will pause while the mouse pointer hovers over the specified element (warning: if used the setPause function should not be used anymore)
           , pauseonhovernode: null

           , stepsize: 1 // amount of steps the next/prev buttons take
           , persisttag: '' //if set, fieldname in a cookie storing the current slideshow position

           , debug:false
           //, resizelistener: true
           }

, currentpos: -1
, currentslideshown: null // time at which the current slide was shown (for progress indicators)

, playing:    false  // whether automatisch playback is enabled
, paused:     false  // to remember we have paused playback (cancelled any scheduled slide). use setPause() to manipulate the pause state

, initialize:function(element, options)
  {
    this.element=$(element);
    this.setOptions(options);
    if($wh.debug.ani)
      this.options.debug=true;

    if (!this.element)
    {
      console.error("Slideshow: no such element", element);
      return;
    }

    if (this.options.debug && "prevbutton" in options && options.prevbutton == null)
      console.warn("prevbutton option given but with value null, was this intended?")

    if (this.options.debug && "nextbutton" in options && options.nextbutton == null)
      console.warn("nextbutton option given but with value null, was this intended?")

    if(this.options.persisttag)
    {
      var positions = JSON.parse(Cookie.read('wh-slideshow'));
      if(positions && positions[this.options.persisttag] && positions[this.options.persisttag].cpos)
        this.options.startposition = parseInt(positions[this.options.persisttag].cpos) || this.options.startposition;
    }


    this.slidearea = this.element.hasClass('wh-slideshow-slidearea') ? this.element : this.element.getElement(".wh-slideshow-slidearea");
    //If we don't have a slidearea, this is a "modern" slideshow and we will be positioning the individual items instead of the area

    if(!this.options.jumpbuttons)
    {
      //ADDME autodetect any jumpbuttons
      this.options.jumpbuttons = [];
    }
    if(!this.options.slides)
    {
      this.options.slides = this.element.getElements(".wh-slideshow-item");
    }

    var methodname = this.options.method.camelCase().capitalize();
    if(!$wh.Slideshow2[methodname])
    {
      console.error("slideshow: Unsupported transition method '" + this.options.method);
      methodname = "css-animation";
    }

    if(!this.options.slides.length)
      return;

    this.slides = this.options.slides;

  // Not necessary, width is calculated for each slide:
  //  if (this.options.method == 'slide-horizontal' && !this.options.slidewidth)
  //    console.warn("slidewidth is required when using slide-horizontal (scrolling may fail now)");

    this.slidemethod = new $wh.Slideshow2[methodname](this, this.slides, this.options.methodoptions);

    var startpos = 0;
    if(this.options.startposition > 0)
    {
      startpos = this.options.startposition;
      if(startpos > this.options.slides.length - 1)
        startpos = this.options.slides.length - 1;
    }

    this.gotoSlide(startpos,false);
    this.options.jumpbuttons.each(function(el,item) { el.addEvent("click", this.onJumpbuttonClick.bind(this, item, true) )}.bind(this));
    if(this.options.prevbutton)
    {
      this.options.prevbutton.addEvent("click", this.handlePrevButton.bind(this));
      this.options.prevbutton.addEvent("mousedown", function(evt) { evt.stop(); } ); // prevent rapid clicking selecting text
      this.options.prevbutton.addEvent("touchend", this.handlePrevButton.bind(this));
    }
    if(this.options.nextbutton)
    {
      this.options.nextbutton.addEvent("click", this.handleNextButton.bind(this));
      this.options.nextbutton.addEvent("mousedown", function(evt) { evt.stop(); } ); // prevent rapid clicking selecting text
      this.options.nextbutton.addEvent("touchend", this.handleNextButton.bind(this));
    }

    if(this.options.pauseonhover)
    {
      // if no node is specified for pauseoverhover, just use the slideshow container
      if (!this.options.pauseonhovernode)
        this.options.pauseonhovernode = this.element;
      else
        this.options.pauseonhovernode = $(this.options.pauseonhovernode);

      this.options.pauseonhovernode.addEvents(
              { mouseenter: function(evt) { this.setPause(true); }.bind(this)
              , mouseleave: function(evt) { this.setPause(false); }.bind(this)
              });
    }

    if(this.options.autoplay)
      this.play();
    if(this.options.debug)
      this.addDebugControls();

    /*
    if(this.options.resizelistener)
    {
      $wh.enableResizeEvents(this.element);
      this.element.addEvent("wh-resized", this.refresh.bind(this));
    }
    */
  }
, addDebugControls:function()
  {
    var debugholder = new Element("div",{"class":"debugcontrols"});
    debugholder.inject(this.element);
    new Element("span",{"type":"button"
                       ,"text":"play"
                       ,"events": { "click": this.play.bind(this) }
                       }).inject(debugholder);
    new Element("span",{"type":"button"
                       ,"text":"stop"
                       ,"events": { "click": this.stop.bind(this) }
                       }).inject(debugholder);
  }
, handlePrevButton:function(evt)
  {
    if(evt)
      evt.stop();

    if (this.currentpos < 1 && !this.options.loop)
      return;

    this.gotoSlideRelative(-this.options.stepsize, true);

    // fire an event to indicate a click has been performed on an active previous button (usefull for event tracking)
    this.fireEvent("prevbutton");
  }
, handleNextButton:function(evt)
  {
    if(evt)
      evt.stop();

    if (this.currentpos >= this.slidemethod.slides.length-1 && !this.options.loop)
      return;

    if(this.options.limitlastposition && this.slidemethod.limitreached)
      return;

    this.gotoSlideRelative(this.options.stepsize, true);

    // fire an event to indicate a click has been performed on an active previous button (usefull for event tracking)
    this.fireEvent("nextbutton");
  }

, onJumpbuttonClick:function(item,animate)
  {
    this.gotoSlide(item, this.options.jumpbutton_animate);
    if(this.options.jumpbutton_stop)
      this.stop();
  }
, getCurrentPosition:function()
  {
    return this.currentpos;
  }
, getNumSlides:function()
  {
    return this.slidemethod.slides.length;
  }

, play:function()
  {
    this.playing=true;

    if(!this.paused)
      this.scheduleNextSlide();
  }

, stop:function()
  {
    if(!this.playing)
      return;

    this.playing=false;
    clearTimeout(this.nextslidedelay);
  }

  /** override the play state. while pause is active the playback will be stalled, until pause is disabled again (assuming playback hasn't been stopped with stop() yet.). */
, setPause: function(pause)
  {
    if (pause)
    {
      this.paused=true;

      if (this.playing)
        clearTimeout(this.nextslidedelay);
    }
    else
    {
      this.paused=false;

      if (this.playing)
        this.scheduleNextSlide();
    }
  }

, scheduleNextSlide:function()
  {
    if(!this.playing)
      return;
    if(this.nextslidedelay)
      clearTimeout(this.nextslidedelay);
    this.nextslidedelay = this.playNextSlide.bind(this).delay(this.options.delay);
  }

, playNextSlide:function()
  {
    if(this.options.limitlastposition && this.slidemethod.limitreached)
      return;

    this.gotoSlide((this.currentpos + 1) % this.slidemethod.slides.length, true, true);
  }

, gotoSlideRelative:function(relpos, animate)
  {
    var newpos = this.currentpos + relpos;

    if(this.options.loop)
    {
      newpos = newpos% this.slidemethod.slides.length;
      if(newpos < 0) newpos = newpos + this.slidemethod.slides.length;
    }
    else
    {
      if(newpos >= this.slidemethod.slides.length)
        newpos = this.slidemethod.slides.length - 1;

      if(newpos < 0)
       newpos = 0;
    }

    this.gotoSlide(newpos,animate, relpos > 0);
  }
, refresh: function()
  {
    this.slidemethod.refresh();
  }

  // note: gotoSlide won't work correctly in case you accidently pass a string instead of number
, gotoSlide:function(slideidx, animate, forwards)
  {
    // if we allready are on the correct slide or the specified index is out of range (of existing slides), ignore
    if(slideidx == this.currentpos)// || ! (slideidx >= 0 && slideidx < this.slidemethod.slides.length))
    {
      if($wh.debug.ani)
        console.log("CANCEL");
      return;
    }

 //   if(this.options.limitlastposition && this.slidemethod.limitreached)
 //     return;
    this.currentslideshown = new Date().getTime();

    var slideevt = { target: this
                   , animate: animate
                   , last: this.currentpos
                   , lastslide: this.currentpos >= 0 ? this.slidemethod.slides[this.currentpos] : null
                   , current: slideidx
                   , currentslide: slideidx >= 0 ? this.slidemethod.slides[slideidx] : null
                   , num: this.slidemethod.slides.length
                   }

    if(this.options.prevbutton)
    {
      var allowprev = slideidx>0 || this.options.loop;
      if(this.options.prevbutton_enabledclass)
        this.options.prevbutton.toggleClass(this.options.prevbutton_enabledclass, allowprev);
    }

    if(this.options.nextbutton)
    {
      var allownext = slideidx<(this.slidemethod.slides.length-1) || this.options.loop;
      if(this.options.nextbutton_enabledclass)
        this.options.nextbutton.toggleClass(this.options.nextbutton_enabledclass, allownext);
    }

    if(this.options.jumpbuttons.length)
    {
      if(this.options.jumpbutton_selectedclass)
        this.options.jumpbuttons.removeClass(this.options.jumpbutton_selectedclass);

      if(slideidx < this.options.jumpbuttons.length)
      {
        if(this.options.jumpbutton_selectedclass)
          this.options.jumpbuttons[slideidx].addClass(this.options.jumpbutton_selectedclass);
      }
    }


    var lastslide = this.currentpos;
    this.currentpos = slideidx;

    this.slidemethod.gotoSlide(lastslide, slideidx, animate, forwards);
    this.fireEvent("startslide", slideevt);

    //ADDME endslide event with data from 'slideevt', but deal properly with cancellation etc if someone prematurely jumps ?

    if(this.options.persisttag)
    {
      var positions = JSON.parse(Cookie.read('wh-slideshow'));
      if(!positions)
        positions={}
      positions[this.options.persisttag]= { cpos: this.currentpos };
      Cookie.write('wh-slideshow', JSON.stringify(positions));
    }

    if(this.playing)
      this.scheduleNextSlide();
  }

, getSlideDimensions:function(slide)
  {
    if(this.options.slidewidth && this.options.slideheight)
      return { width: this.options.slidewidth, height:this.options.slideheight};

    var dim = slide.getDimensions();
    if(this.options.slidewidth)
      dim.width = this.options.slidewidth;
    if(this.options.slideheight)
      dim.height = this.options.slideheight;
    return dim;
  }

});

$wh.Slideshow2.MethodBase = new Class(
{ slides: null
, slideshow: null
, sharedparent: null

, initialize: function(slideshow)
  {
    this.slideshow = slideshow;
    this.slides = new Elements;
  }
, setupSingleParentSlides:function(slides)
  {
    this.sharedparent = slides[0].getParent();

    for (var i=0;i<slides.length;++i)
    {
      if(slides[i].parentNode != this.sharedparent)
      {
        console.error("All slides must share the same parent. Skipping slide #" + i, slides[i]);
        continue;
      }
      this.slides.push(slides[i]);
    }
  }
, getDimensions:function()
  {
    var maxwidth=0,maxheight=0;
    Array.each(this.slides,function (slide)
    {
      var slidesize = slide.getSize();
      maxwidth = Math.max(maxwidth, slidesize.x);
      maxheight = Math.max(maxheight, slidesize.y);
    });
    return { width: maxwidth, height: maxheight };
  }
});


$wh.Slideshow2.CssAnimation = new Class(
{ Extends: $wh.Slideshow2.MethodBase
, limitreached: false
, initialize: function(slideshow, items)
  {
    this.parent(slideshow);
    this.setupSingleParentSlides(items);

    slideshow.element.addClass("wh-slideshow-cssanimation");
    slideshow.element.addClass("anim-"+slideshow.options.anim);
  }

, refresh:function()
  {
    //nothing
  }

, gotoSlide:function(lastslideidx, slideidx, animate, forwards)
  {
    //console.log(lastslideidx, slideidx, animate);

    this.slides.removeClass("hidePrevious");
    this.slides.removeClass("hideNext");
    this.slides.removeClass("showNext");
    this.slides.removeClass("showPrevious");
    this.slides.removeClass("selected");

    var isforwards = forwards; //slideidx > lastslideidx;
    if (lastslideidx > -1)
    {
      this.slides[lastslideidx].addClass(isforwards ? "hidePrevious" : "hideNext");
      this.slides[slideidx].addClass(isforwards ? "showNext" : "showPrevious");
    }

    this.slides[slideidx].addClass("selected");

    if(this.slideshow.options.slide_selectedclass != '')
    {
      this.slides.removeClass(this.slideshow.options.slide_selectedclass);
      this.slides[slideidx].addClass(this.slideshow.options.slide_selectedclass);
      this.slideshow.fireEvent("endslide");
    }
  }
});




function setupSlideShow(node)
{
  if(!node.retrieve("wh-slideshow"))
  {
    var opts = JSON.parse(node.getAttribute("data-slideshow-options"));
    node.store("wh-slideshow", new $wh.Slideshow(node, opts));
  }
}
function initializeSlideShows()
{
  $wh.setupReplaceableComponents(".wh-slideshow-holder[data-slideshow-options]", setupSlideShow);
}

window.addEvent("domready", initializeSlideShows);

})(document.id); //end mootools wrapper
