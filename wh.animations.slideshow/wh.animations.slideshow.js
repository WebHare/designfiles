/* generated from Designfiles Public by generate_data_designfles */
require ('./slideshow.css');
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.element.measure');
require ('wh.util.resizelistener');
require ('wh.ui.base');
/*! LOAD: frameworks.mootools.core, frameworks.mootools.more.element.measure, wh.util.resizelistener, wh.ui.base
!*/


/*
NOTES:

- if the part of the DOM in which you have the wh-slideshow-item's has display: none;
  the slide sizes cannot be determined and slides cannot be properly layed out.
  In this case specify a slidewidth AND slideheight and these sizes will be used instead.

- Supported methods are:

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


FIXME: *DON'T* use the callbacks (slide_onstart / slide_onend) and remove them??





Slideshow 2:
- remove slide_onstart / slideonend
- remove initialdelay
- remove -wh legacy CSS classes
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

$wh.Slideshow = new Class(
{ Implements: [Events,Options]
, element: null
, slides: []
, slidearea: null
, options: { jumpbuttons: null
           , jumpbutton_selectedclass: 'wh-slideshow-selected'
           , jumpbutton_normalclass: ''
           , jumpbutton_animate: false //true: animate slide onclick jumpbutton
           , jumpbutton_stop: false    //true: stop slideshow onclick jumpbutton

           , prevbutton: null
           , prevbutton_enabledclass: ''
           , prevbutton_disabledclass: ''

           , nextbutton: null
           , nextbutton_enabledclass: ''
           , nextbutton_disabledclass: ''

           , slides: null
           , slidewidth: null
           , slideheight: null
           , slide_selectedclass: ''
           , slide_onstart: null //function callback option (DON'T use?? use events)
           , slide_onend: null //function callback option (DON't use?? use events)

           , initialdelay: 0 // ?? this does the same as delay (and they are)
           , delay:3000
           , slideduration: 1000

           // animation settings
           , method: 'slide-horizontal'
           , transition: 'sine:in:out'
           , methodoptions: null
           , limitlastposition: false //limit position of last slide to end of the viewport (only relevant for slide-horizontal and slide-vertical)
           , anim: 'fade' // anim for method 'css-animation'

           , autoplay: false
           , startposition:0
           , loop: false //if at end or begin, goto first/last slide

           , pauseonhover: false    // if true the slideshow will pause while the mouse pointer hovers over the specified element (warning: if used the setPause function should not be used anymore)
           , pauseonhovernode: null

           , stepsize: 1 // amount of steps the next/prev buttons take
           , persisttag: '' //if set, fieldname in a cookie storing the current slideshow position

           , debug:false
           , resizelistener: true
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
      var positions = JSON.decode(Cookie.read('wh-slideshow'));
      if(positions && positions[this.options.persisttag] && positions[this.options.persisttag].cpos)
        this.options.startposition = parseInt(positions[this.options.persisttag].cpos) || this.options.startposition;
    }


    this.slidearea = this.element.hasClass('-wh-slideshow-slidearea')||this.element.hasClass('wh-slideshow-slidearea') ? this.element : this.element.getElement(".wh-slideshow-slidearea, .-wh-slideshow-slidearea");
    //If we don't have a slidearea, this is a "modern" slideshow and we will be positioning the individual items instead of the area

    if(!this.options.jumpbuttons)
    {
      //ADDME autodetect any jumpbuttons
      this.options.jumpbuttons = [];
    }
    if(!this.options.slides)
    {
      this.options.slides = this.element.getElements(".wh-slideshow-item, .-wh-slideshow-item");
    }

    var methodname = this.options.method.camelCase().capitalize();
    if(!$wh.Slideshow[methodname])
    {
      console.error("slideshow: Unsupported transition method '" + this.options.method + "', falling back to 'slide-horizontal'");
      methodname='SlideHorizontal';
    }

    if(!this.options.slides.length)
      return;

    this.slides = this.options.slides;

  // Not necessary, width is calculated for each slide:
  //  if (this.options.method == 'slide-horizontal' && !this.options.slidewidth)
  //    console.warn("slidewidth is required when using slide-horizontal (scrolling may fail now)");

    this.slidemethod = new $wh.Slideshow[methodname](this, this.slides, this.options.methodoptions);

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
    }
    if(this.options.nextbutton)
    {
      this.options.nextbutton.addEvent("click", this.handleNextButton.bind(this));
      this.options.nextbutton.addEvent("mousedown", function(evt) { evt.stop(); } ); // prevent rapid clicking selecting text
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

    if(this.options.resizelistener)
    {
      $wh.enableResizeEvents(this.element);
      this.element.addEvent("wh-resized", this.refresh.bind(this));
    }
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
    this.nextslidedelay = this.playNextSlide.bind(this).delay(this.options.delay + this.options.initialdelay);
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
      if(this.options.prevbutton_disabledclass)
        this.options.prevbutton.toggleClass(this.options.prevbutton_disabledclass, !allowprev);
      if(this.options.prevbutton_enabledclass)
        this.options.prevbutton.toggleClass(this.options.prevbutton_enabledclass, allowprev);
    }

    if(this.options.nextbutton)
    {
      var allownext = slideidx<(this.slidemethod.slides.length-1) || this.options.loop;
      if(this.options.nextbutton_disabledclass)
        this.options.nextbutton.toggleClass(this.options.nextbutton_disabledclass, !allownext);
      if(this.options.nextbutton_enabledclass)
        this.options.nextbutton.toggleClass(this.options.nextbutton_enabledclass, allownext);
    }

    if(this.options.jumpbuttons.length)
    {
      if(this.options.jumpbutton_selectedclass)
        this.options.jumpbuttons.removeClass(this.options.jumpbutton_selectedclass);
      if(this.options.jumpbutton_normalclass)
        this.options.jumpbuttons.addClass(this.options.jumpbutton_normalclass);

      if(slideidx < this.options.jumpbuttons.length)
      {
        if(this.options.jumpbutton_selectedclass)
          this.options.jumpbuttons[slideidx].addClass(this.options.jumpbutton_selectedclass);
        if(this.options.jumpbutton_normalclass)
          this.options.jumpbuttons[slideidx].removeClass(this.options.jumpbutton_normalclass);
      }
    }


    var lastslide = this.currentpos;
    this.currentpos = slideidx;

    this.slidemethod.gotoSlide(lastslide, slideidx, animate, forwards);
    this.fireEvent("startslide", slideevt);

    //ADDME endslide event with data from 'slideevt', but deal properly with cancellation etc if someone prematurely jumps ?

    if(this.options.persisttag)
    {
      var positions = JSON.decode(Cookie.read('wh-slideshow'));
      if(!positions)
        positions={}
      positions[this.options.persisttag]= { cpos: this.currentpos };
      Cookie.write('wh-slideshow', JSON.encode(positions));
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

$wh.Slideshow.MethodBase = new Class(
{ slides: null
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

$wh.Slideshow.SlideHorizontal = new Class(
{ Extends: $wh.Slideshow.MethodBase
, limitleft : 0
, limitreached: false
, currentposition: 0
, initialize: function(slideshow, items, options)
  {
    this.parent(slideshow);

    this.slides = items;
    if(this.slideshow.slidearea)
    {
      this.slideareatween = new Fx.Tween(this.slideshow.slidearea, {link:'cancel', duration: this.slideshow.options.slideduration, transition: this.slideshow.options.transition});
    }
    else
    {
      this.slideareatween = new Fx({link:'cancel', duration: this.slideshow.options.slideduration, transition: this.slideshow.options.transition});
      this.slideareatween.set = this.updateSlidePosition.bind(this);
    }
    this.offset = options && options.offset ? options.offset : 0;

    this.setSlidesPositions();
  }
, updateSlidePosition:function(newpos)
  {
    this.currentposition = newpos;
    this.slides.each(function(slide)
    {
      slide.setStyle("left", newpos + slide["wh-slideoffset"]);
    });
  }
, setSlidesPositions:function()
  {
    //simply put all slides next to each other
    var x=0;
    for(var i=0;i<this.slides.length;++i)
    {
      var slide = this.slides[i];
      var slidesize = this.slideshow.getSlideDimensions(slide);

      slide.setStyles( {left:x, top:0, display:"block"});
      slide["wh-slidewidth"] = slidesize.width;
      slide["wh-slideoffset"] = x;

      x+=slidesize.width;
    }

    //check space after last item:
    var lastslide = this.slides[this.slides.length - 1];
    this.limitleft = lastslide["wh-slideoffset"];

    if(this.slideshow.options.limitlastposition)
    {
      var viewportx = this.slideshow.slidearea.getParent().getSize().x;
      var spaceover = viewportx - lastslide["wh-slidewidth"];
      if(spaceover < 0)
        spaceover = 0;

      if(x > viewportx)
        this.limitleft = lastslide["wh-slideoffset"] - spaceover;
    }

  }

, refresh:function()
  {
    this.setSlidesPositions();
    this.gotoSlide(0, this.slideshow.currentpos, false);
  }

  //ADDME center around destination if not all slides are same width ?
, gotoSlide:function(lastslide, slideidx, animate)
  {
    var slideoffset = this.slides[slideidx]["wh-slideoffset"];

    if(this.limitleft < this.slides[slideidx]["wh-slideoffset"] && this.slideshow.options.limitlastposition)
    {
      slideoffset = this.limitleft;
      this.limitreached = true;

      if(this.slideshow.options.nextbutton)
      {
        var allownext = this.slideshow.options.loop;
        if(this.slideshow.options.nextbutton_disabledclass)
          this.slideshow.options.nextbutton.toggleClass(this.slideshow.options.nextbutton_disabledclass, !allownext);
        if(this.slideshow.options.nextbutton_enabledclass)
          this.slideshow.options.nextbutton.toggleClass(this.slideshow.options.nextbutton_enabledclass, allownext);
      }

    }
    else
    {
      this.limitreached = false;
    }

    if(this.slideshow.options.slide_onstart)
      this.slideshow.options.slide_onstart(this.slides[this.slideshow.currentpos]);

    if(this.slideshow.options.slide_selectedclass != '')
      this.slides.removeClass(this.slideshow.options.slide_selectedclass);

    if(animate)
    {
      if(this.slideshow.slidearea)
        this.slideareatween["start"]("left", -slideoffset + this.offset).chain(this.finalizeGotoSlide.bind(this, slideidx));
      else
        this.slideareatween["start"](this.currentposition, -slideoffset + this.offset).chain(this.finalizeGotoSlide.bind(this, slideidx));
    }
    else
    {
      if(this.slideshow.slidearea)
        this.slideareatween["set"]("left", -slideoffset + this.offset);
      else
        this.slideareatween["set"](-slideoffset + this.offset);

      this.finalizeGotoSlide(slideidx);
    }
  }

, finalizeGotoSlide:function(slideidx)
  {
    if(this.slideshow.options.slide_selectedclass != '')
      this.slides[slideidx].addClass(this.slideshow.options.slide_selectedclass);
    this.slideshow.fireEvent("endslide");
    if(this.slideshow.options.slide_onend)
      this.slideshow.options.slide_onend(this.slides[slideidx]);
  }

});

$wh.Slideshow.SlideVertical = new Class(
{ Extends: $wh.Slideshow.MethodBase
, limittop: 0
, limitreached: false
, initialize: function(slideshow, items, options)
  {
    this.parent(slideshow);
    if(!this.slideshow.slidearea)
      throw new Error("$wh.Slideshow.SlideVertical does not support slidearea-less slideshows yet");

  // Not necessary, height is calculated for each slide:
   // if (slideshow.options.method == 'slide-vertical' && !this.slideheight)
   //   console.warn("slideheight is required when using slide-vertical (scrolling may fail now)");

    this.slides = items;
    this.slideareatween = new Fx.Tween(this.slideshow.slidearea, {link:'cancel', duration: this.slideshow.options.slideduration, transition: this.slideshow.options.transition});
    this.offset = options && options.offset ? options.offset : 0;

    this.setSlidesPositions();
  }

, setSlidesPositions: function()
  {
    //simply put all slides next to each other
    var y=0;
    for(var i=0;i<this.slides.length;++i)
    {
      var slide = this.slides[i];
      var slidesize = this.slideshow.getSlideDimensions(slide);

      slide.setStyles( {left:0, top:y, display:"block"});
      slide["wh-slideheight"] = slidesize.height;
      slide["wh-slideoffset"] = y;

      y+=slidesize.height;
    }

    //check space after last item:
    var lastslide = this.slides[this.slides.length - 1];
    this.limittop = lastslide["wh-slideoffset"];

    if(this.slideshow.options.limitlastposition)
    {
      var viewporty = this.slideshow.slidearea.getParent().getSize().y;
      var spaceover = viewporty - lastslide["wh-slideheight"];
      if(spaceover < 0)
        spaceover = 0;

      if(y > viewporty)
        this.limittop = lastslide["wh-slideoffset"] - spaceover;
    }

  }

, refresh:function()
  {
    this.setSlidesPositions();
    this.gotoSlide(0, this.slideshow.currentpos, false);
  }

  //ADDME center around destination if not all slides are same width ?
, gotoSlide:function(lastslide, slideidx, animate)
  {
    var slideoffset = this.slides[slideidx]["wh-slideoffset"];

    if(this.limittop < this.slides[slideidx]["wh-slideoffset"] && this.slideshow.options.limitlastposition)
    {
      slideoffset = this.limittop;
      this.limitreached = true;

      if(this.slideshow.options.nextbutton)
      {
        var allownext = this.slideshow.options.loop;
        if(this.slideshow.options.nextbutton_disabledclass)
          this.slideshow.options.nextbutton.toggleClass(this.slideshow.options.nextbutton_disabledclass, !allownext);
        if(this.slideshow.options.nextbutton_enabledclass)
          this.slideshow.options.nextbutton.toggleClass(this.slideshow.options.nextbutton_enabledclass, allownext);
      }

    }
    else
    {
      this.limitreached = false;
    }

    if(this.slideshow.options.slide_onstart)
      this.slideshow.options.slide_onstart(this.slides[this.slideshow.currentpos]);

    if(animate)
    {
      if(this.slideshow.options.slide_selectedclass != '')
        this.slides.removeClass(this.slideshow.options.slide_selectedclass);
      this.slideareatween["start"]("top", -slideoffset + this.offset).chain(
        function(){
          if(this.slideshow.options.slide_selectedclass != '')
            this.slides[slideidx].addClass(this.slideshow.options.slide_selectedclass);
          this.slideshow.fireEvent("endslide");
          if(this.slideshow.options.slide_onend)
            this.slideshow.options.slide_onend(this.slides[slideidx]);
        }.bind(this)
      );
    }
    else
    {
      this.slideareatween["set"]("top", -slideoffset + this.offset);
      if(this.slideshow.options.slide_selectedclass != '')
      {
        this.slides.removeClass(this.slideshow.options.slide_selectedclass);
        this.slides[slideidx].addClass(this.slideshow.options.slide_selectedclass);
        this.slideshow.fireEvent("endslide");
        if(this.slideshow.options.slide_onend)
          this.slideshow.options.slide_onend(this.slides[slideidx]);
      }
    }
  }

});

$wh.Slideshow.FaderBase = new Class(
{ Extends: $wh.Slideshow.MethodBase
, tweens: []
, limitreached: false
, initialize: function(slideshow, items)
  {
    this.parent(slideshow);
    this.setupSingleParentSlides(items);

    this.slides.setStyles({left:0,top:0,opacity:0,display:"block"});
    this.slides.each( function(el,idx)
      { this.tweens.push(new Fx.Tween(el, { link: 'cancel', duration: slideshow.options.slideduration, onStart: this.tweenStart.bind(this), onComplete: this.tweenDone.bind(this) })) }.bind(this));
  }

, refresh:function()
  {
    //nothing
  }

, tweenStart: function()
  {
    if(this.slideshow.options.slide_selectedclass != '')
    {
      this.slides.each( function(el)
      {
        if(el.hasClass(this.slideshow.options.slide_selectedclass))
          el.addClass('wh-hide');
      }.bind(this));
    }

    this.slides.removeClass('wh-show');
    this.slides[this.slideshow.currentpos].addClass('wh-show');

    if(this.slideshow.options.slide_onstart)
      this.slideshow.options.slide_onstart(this.slides[this.slideshow.currentpos]);

    if(this.slideshow.options.slide_selectedclass != '')
      this.slides.removeClass(this.slideshow.options.slide_selectedclass);
  }
, tweenDone:function()
  {
    this.tweens.each(function(tween, idx) { if (idx!=this.slideshow.currentpos) tween.set("opacity",0)}.bind(this));

    if(this.slideshow.options.slide_onend)
      this.slideshow.options.slide_onend(this.slides[this.slideshow.currentpos]);

    if(this.slideshow.options.slide_selectedclass != '')
    {
      this.slides.removeClass('wh-hide');

      this.slides.removeClass(this.slideshow.options.slide_selectedclass);
      this.slides[this.slideshow.currentpos].addClass(this.slideshow.options.slide_selectedclass);
      this.slideshow.fireEvent("endslide");
    }

  }
});


$wh.Slideshow.FadeIn = new Class(
{ Extends: $wh.Slideshow.FaderBase
, initialize: function(slideshow, items)
  {
    this.parent(slideshow,items);
  }

, refresh:function()
  {
    //nothing
  }

, gotoSlide:function(lastslide, slideidx, animate)
  {
    if(lastslide>=0)
      this.tweens[lastslide].cancel();

    //move the selected slide to the top of the display stack
    this.sharedparent.grab(this.slides[slideidx],'bottom');

    this.tweens[slideidx][animate ? "start" : "set"]("opacity", 1);
    if(!animate)
      this.tweenDone();
  }
});

$wh.Slideshow.FadeInOut = new Class(
{ Extends: $wh.Slideshow.FaderBase
, initialize: function(slideshow, items)
  {
    this.parent(slideshow,items);
  }

, refresh:function()
  {
    //nothing
  }

, gotoSlide:function(lastslide, slideidx, animate)
  {
    if(lastslide>=0)
      this.tweens[lastslide][animate ? "start" : "set"]("opacity", 0);
    this.tweens[slideidx][animate ? "start" : "set"]("opacity", 1);
    if(!animate)
      this.tweenDone();

    //move the selected slide to the top
    this.sharedparent.grab(this.slides[slideidx],'bottom');
  }
});

$wh.Slideshow.DisplayBlock = new Class(
{ Extends: $wh.Slideshow.MethodBase
, limitreached: false
, initialize: function(slideshow, items)
  {
    this.parent(slideshow);
    this.setupSingleParentSlides(items);
    this.slides.setStyle("display","none");
  }

, refresh:function()
  {
    //nothing
  }

, gotoSlide:function(lastslide, slideidx, animate)
  {
    this.slides.setStyle("display","none");
    this.slides[slideidx].setStyle('display','block');

    if(this.slideshow.options.slide_selectedclass != '')
    {
      this.slides.removeClass(this.slideshow.options.slide_selectedclass);
      this.slides[slideidx].addClass(this.slideshow.options.slide_selectedclass);
      this.slideshow.fireEvent("endslide");
    }
  }
});

$wh.Slideshow.CssAnimation = new Class(
{ Extends: $wh.Slideshow.MethodBase
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
    var opts = JSON.decode(node.getAttribute("data-slideshow-options"));
    node.store("wh-slideshow", new $wh.Slideshow(node, opts));
  }
}
function initializeSlideShows()
{
  $wh.setupReplaceableComponents(".wh-slideshow-holder[data-slideshow-options]", setupSlideShow);
}

window.addEvent("domready", initializeSlideShows);

})(document.id); //end mootools wrapper
