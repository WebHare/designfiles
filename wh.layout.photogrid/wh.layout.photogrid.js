/* generated from Designfiles Public by generate_data_designfles */
require ('./photogrid-basic.css');
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.animations.slideshow');
require ('wh.util.preloader');
require ('wh.util.swipedetect');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.animations.slideshow, wh.util.preloader, wh.util.swipedetect
!*/

"use strict";

(function($){ //mootools/scope wrapper

if(!window.$wh) window.$wh={};

/*
  Html structure:
      <div class="wh-imagegallery" tabindex="0">
        <div class="wh-imagegallery-grid" tabindex="0">

          [forevery pictures]
            <div class="thumb" data-id="[id]" title="[title]"><div><img src="[thumb.link]" width="[thumb.width]" height="[thumb.height]" alt="[title]" /></div></div>
          [/forevery]
          [! if no slideshow placeholder then grid will just fully outfill from top !]
          <div class="wh-slideshow"><!-- slides are generated by js depending on number of thumbs fitting in one slide --></div>
          <div class="previous disabled"></div>
          <div class="next disabled"></div>

        </div>
        <div class="wh-imagegallery-preview" tabindex="0">

          <div class="wh-slideshow showgrid">
            [forevery pictures]
              <div class="wh-slideshow-item prepare" title="[title]" data-id="[id]" data-link="[link]" data-image="[preview.link]"></div>
            [/forevery]
          </div>

          <div class="previous disabled"></div>
          <div class="next disabled"></div>

          <div class="infobar">
            <div class="showgrid"></div>
            <div class="counter"><span class="current"></span> / <span class="count"></span></div>
            <div class="info"><span></span></div>
          </div>

          <div class="wh-imagegallery-scroller">[! optional scroller !]
            <div class="wh-imagegallery-scroller-content" tabindex="0">
              [forevery pictures]
                <div class="thumb" data-id="[id]" title="[title]"><img src="[thumb.link]" width="[thumb.width]" height="[thumb.height]" alt="[title]" /></div>
              [/forevery]
            </div>
          </div>

        </div>
      </div>
*/

/*
 * FIXME: -scroller content reposition after resize
 *        -scroller responsive
 * NICETOHAVE:
 *        -preload only thumbs visible
 */
$wh.PhotoGrid = new Class(
{ Implements: [ Options ]
, container: null
, viewportsize: null

, thumbs: []
, gridnode: null
, gridslideshownode: null
, gridslideshow: null

, previewnode: null
, previewslideshow: null

, scrollholder: null
, scrollcontent: null
, scrolltimer: null
, scrollvertical: false
, scrollposition: ''

, options: { maxthumbheight : 150, fullscreen : false }

, initialize: function(container, options)
  {
    this.container = container;
    this.gridnode = this.container.getElement('.wh-imagegallery-grid');

    this.setOptions(options);

    this.thumbs = this.gridnode.getElements('.thumb');
    if(!this.thumbs.length)
      return;//no thumbs, so nothing todo

    this.gridnode.addEvent('click:relay(.thumb)', this.showPreview.bind(this));
    this.gridnode.addEvent('mouseover:relay(.thumb)', this.toggleThumb.bind(this, true));
    this.gridnode.addEvent('mouseout:relay(.thumb)', this.toggleThumb.bind(this, false));

    this.gridslideshownode = this.gridnode.getElement('.wh-slideshow');

    if(this.gridslideshownode)
    {
      this.gridnode.addEventListener('keydown', this.onKeyDown.bind(this),true);
      this.gridnode.addEventListener('keyup', this.onKeyUp.bind(this),true);
    }

    this.thumbs.addClass('prepare');//prepare is removed if thumb is loaded
    new $wh.Preloader( [ new $wh.PreloadableDomTree(this.container) ]
                     , { onComplete:  this.ongalleryPreloadReady.bind(this)
                      // , timeout: 10000
                       }
                     );

    //prepare preview
    this.previewnode = this.container.getElement('.wh-imagegallery-preview');
    this.previewnode.addEventListener('keydown', this.onKeyDown.bind(this),true)
    this.previewnode.addEventListener('keyup', this.onKeyUp.bind(this),true)
    this.previewnode.addEvent('click:relay(.thumb)', this.showPreview.bind(this));

    var slidesettings = { autoplay: false
                        , method: 'slide-horizontal' //fade-in
                        , slideduration: 800
                        , delay: 5000
                        , slide_selectedclass: 'active'
                        , jumpbuttons: this.previewnode.getElements('.jumpbuttons > span')
                        , jumpbutton_selectedclass: 'active'
                        , jumpbutton_animate : true
                        , prevbutton: this.previewnode.getElement('.previous')
                        , prevbutton_disabledclass: 'disabled'
                        , prevbutton_enabledclass: 'enabled'
                        , nextbutton: this.previewnode.getElement('.next')
                        , nextbutton_disabledclass: 'disabled'
                        , nextbutton_enabledclass: 'enabled'
                        };
    this.previewslideshow = new $wh.Slideshow(this.previewnode.getElement('.wh-slideshow'), slidesettings);
    this.previewslideshow.addEvent('startslide',this.onStartPreviewSlide.bind(this));
    this.previewnode.getElements('.counter > .count').set('text',this.previewslideshow.slides.length);

    this.previewslideshow.slides.addClass('prepare');//prepare is removed if image is loaded

    this.container.getElements('.showgrid').addEvent('click',this.showGrid.bind(this));

    //init scroller in preview window, if available
    this.scrollholder = this.previewnode.getElement('.wh-imagegallery-scroller');
    this.scrollcontent = this.previewnode.getElement('.wh-imagegallery-scroller-content');
    if(this.scrollholder && this.scrollcontent)
      this.initThumbScroller();

    //plain swipe detection for touch devices
    new $wh.SwipeDetect(this.gridnode);
    this.gridnode.addEvent('swipe', this.onSwipe.bind(this));

    new $wh.SwipeDetect(this.previewnode);
    this.previewnode.addEvent('swipe', this.onSwipe.bind(this));

    $(window).addEvent('resize', this.onResize.bind(this));
    this.onResize();
  }

, initThumbScroller: function()
  {
    //Detect if horizontal or vertical scroller and position in window
    var scrollersize = this.scrollholder.measure(function(){ return this.getSize(); });
    this.scrollvertical = scrollersize.y > scrollersize.x;

    if(this.scrollvertical)
    {
      var scrollerpos = this.scrollholder.getStyle('left').toInt();
      this.scrollposition = isNaN(scrollerpos) ? 'right' : 'left';
    }
    else
    {
      var scrollerpos = this.scrollholder.getStyle('top').toInt();
      this.scrollposition = isNaN(scrollerpos) ? 'bottom' : 'top';
    }

    this.positionScrollThumbs();

    this.scrollholder.addEventListener('mouseout', function()
    {
      if(this.scrolltimer)
        cancelAnimationFrame(this.scrolltimer);
    }.bind(this),true);

    this.previewnode.addEventListener('mousemove', function(ev)
    {
      if(this.scrolltimer)
        cancelAnimationFrame(this.scrolltimer);

      //remove swipe css animation class if active
      if(this.scrollholder.hasClass('swipevertical'))
      {
        this.scrollholder.removeClass('swipevertical')
        this.scrollholder.clientWidth;//force css update
      }
      else if(this.scrollholder.hasClass('swipehorizontal'))
      {
        this.scrollholder.removeClass('swipehorizontal')
        this.scrollholder.clientWidth;//force css update
      }

      var referencepos = this.previewnode.getPosition();

      var foldwidth = this.scrollcontent.getSize()[(this.scrollvertical ? 'x' : 'y')];

      var relativemousepos = { 'x' : ev.clientX - referencepos.x, 'y' : ev.clientY - referencepos.y };
      var viewsize = this.previewnode.getSize();
      var foldout = (this.scrollposition == 'top' && relativemousepos.y <= foldwidth)
                 || (this.scrollposition == 'bottom' && relativemousepos.y >= viewsize.y - foldwidth)
                 || (this.scrollposition == 'left' && relativemousepos.x <= foldwidth)
                 || (this.scrollposition == 'right' && relativemousepos.x >= viewsize.x - foldwidth);

      if(foldout)
      {
        if(!this.previewnode.hasClass('showthumbs'))
        {
          this.showThumbScroller();
        }
        else
        {//already visible, scroll depending on mouse position
          var scrollersize = this.scrollholder.getSize()[(this.scrollvertical ? 'y' : 'x')];
          var contentsize = this.scrollcontent.getSize()[(this.scrollvertical ? 'y' : 'x')];

          if(contentsize <= scrollersize)
            return;//nothing to scroll

          var centerpos = 0.5*scrollersize;

          var relativeoffset = (relativemousepos[(this.scrollvertical ? 'y' : 'x')] - centerpos) / centerpos;
          this.scrolltimer = requestAnimationFrame(this.updateScrollPosition.bind(this,relativeoffset));
        }
      }
      else
      {
        this.hideThumbScroller();
      }

    }.bind(this),true);

  }

, positionScrollThumbs: function()
  {
    var thumbpos = 0;
    this.scrollholder.getElements('.thumb').each(function(node)
    {
      node.setStyle((this.scrollvertical ? 'top' : 'left'),null);//first reset for correct measurement
      var size = node.measure(function(){ return this.getSize(); });
      node.setStyle((this.scrollvertical ? 'top' : 'left'),thumbpos);
      thumbpos+=size[(this.scrollvertical ? 'y' : 'x')];
    }.bind(this));
    this.scrollcontent.setStyle((this.scrollvertical ? 'height' : 'width'),thumbpos);
  }

, showThumbScroller: function()
  {//on show, center active thumb in scroller
    if(!this.scrollcontent)
      return;

    var thumb = this.scrollcontent.getElement('.thumb:nth-child(' + (this.previewslideshow.currentpos + 1) + ')');
    if(!thumb)
      return;

    var pos = 0;
    var scrollerwidth = this.scrollholder.getSize()[(this.scrollvertical ? 'y' : 'x')];
    var scrollercontentwidth = this.scrollcontent.getSize()[(this.scrollvertical ? 'y' : 'x')];
    if(scrollerwidth < scrollercontentwidth)
    { //only if we need to scroll
      var centerpos = 0.5*scrollerwidth;
      var thumbcenterpos = thumb.getStyle((this.scrollvertical ? 'top' : 'left')).toInt() + 0.5*thumb.getStyle((this.scrollvertical ? 'height' : 'width')).toInt();
      var maxoffset = scrollerwidth - scrollercontentwidth;

      pos = Math.round(centerpos - thumbcenterpos);
      if(pos > 0)
        pos = 0;
      if(pos < maxoffset)
        pos = maxoffset;
    }

    this.scrollcontent.setStyle((this.scrollvertical ? 'top' : 'left'),pos);

    this.scrollcontent.clientWidth; //force browser to apply new position

    this.previewnode.addClass('showthumbs');
  }

, hideThumbScroller: function()
  {
    if(this.previewnode)
      this.previewnode.removeClass('showthumbs');
  }

, ongalleryPreloadReady: function()
  {
    this.thumbs.removeClass('prepare');
  }

, onSwipe: function(ev)
  {
    if(this.previewnode.hasClass('show'))
    {
      var scrollcontentnode = ev.target.hasClass('wh-imagegallery-scroller-content') ? ev.target : ev.target.getParent('.wh-imagegallery-scroller-content');

      if(scrollcontentnode)
      {//swipe inside scrollable thumblist
        var viewwidth = this.scrollholder.getSize()[(this.scrollvertical ? 'y' : 'x')];

        var curpos = scrollcontentnode.getStyle((this.scrollvertical ? 'top' : 'left')).toInt();
        var newpos = curpos + (ev.direction.indexOf((this.scrollvertical ? 's' : 'e')) != -1 ? viewwidth : -viewwidth);
        if(newpos > 0)
          newpos = 0;
        else
        {
          var maxoffset = viewwidth - scrollcontentnode.getSize()[(this.scrollvertical ? 'y' : 'x')];
          if(newpos < maxoffset)
            newpos = maxoffset;
        }

        if(curpos == newpos)
          return;

        this.scrollholder.addClass(this.scrollvertical ? 'swipevertical' : 'swipehorizontal');

        this.scrollholder.clientWidth;//force css update

        scrollcontentnode.setStyle((this.scrollvertical ? 'top' : 'left'),newpos);
      }
      else
      {
        if(ev.direction.indexOf('e') != -1)
          this.previewslideshow.gotoSlideRelative(-1,true);
        else if(ev.direction.indexOf('w') != -1)
          this.previewslideshow.gotoSlideRelative(1,true);
      }
    }
    else if(this.gridslideshow)
    {
      if(ev.direction.indexOf('e') != -1)
        this.gridslideshow.gotoSlideRelative(-1,true);
      else if(ev.direction.indexOf('w') != -1)
        this.gridslideshow.gotoSlideRelative(1,true);
    }
  }

, updateScrollPosition: function(relativeoffset)
  { //relative offset -1.0 .. 1.0
    if(document.hasFocus() && Math.abs(relativeoffset) > 0.1)// mouse cursor more the 10% outside center
    {
      var absoluteoffset = Math.round(20*Math.sin(relativeoffset));

      var curpos = this.scrollcontent.getStyle((this.scrollvertical ? 'top' : 'left')).toInt();
      var newpos = curpos - absoluteoffset;
      if(newpos > 0)
        newpos = 0;
      else
      {
        var maxoffset = this.scrollholder.getSize()[(this.scrollvertical ? 'y' : 'x')] - this.scrollcontent.getSize()[(this.scrollvertical ? 'y' : 'x')];
        if(newpos < maxoffset)
          newpos = maxoffset;
      }

      if(curpos == newpos)
        return;

      this.scrollcontent.setStyle((this.scrollvertical ? 'top' : 'left'),newpos);
      this.scrolltimer = requestAnimationFrame(this.updateScrollPosition.bind(this,relativeoffset));
    }
  }

, onKeyDown: function(ev)
  {
    if(this.keydown)
      return;

    this.keydown = true;
    var keyname = ev.keyIdentifier.toUpperCase();

    if(ev.keyCode == 27 && this.previewnode.hasClass('show'))//ESC
    {
      this.showGrid();
    }
    else if(keyname == 'LEFT')
    {
      if(this.previewnode.hasClass('show'))
      {
        this.previewslideshow.gotoSlideRelative(-1, true);
      }
      else if(this.gridslideshow)
      {
        this.gridslideshow.gotoSlideRelative(-1, true);
      }
    }
    else if(keyname == 'RIGHT')
    {
      if(this.previewnode.hasClass('show'))
      {
        this.previewslideshow.gotoSlideRelative(1, true);
      }
      else if(this.gridslideshow)
      {
        this.gridslideshow.gotoSlideRelative(1, true);
      }
    }
  }
, onKeyUp: function(ev)
  {
    this.keydown = false;
  }
, showGrid: function(ev)
  {
    if(ev && ev.target.getParent('.wh-slideshow-item'))
      return;//if clicked on element within slideshow-item, ignore click

    this.hideThumbScroller();

    this.previewnode.addClass('beforehide').removeClass('show');
    (function()
    {
      this.previewnode.removeClass('beforehide');//remove aftershow after css transition is ready (500ms)
      if(this.options.fullscreen)
        this.previewnode.inject(this.gridnode,'after');
      this.gridnode.focus();
    }.bind(this)).delay(500);
  }
, onStartPreviewSlide: function(ev)
  {
    this.previewnode.getElements('.counter > .current').set('text',ev.current+1);
    this.previewnode.getElements('.info > span').set('text',ev.currentslide.get('title'));

    var previewimage = ev.currentslide.getElement('img');
    if(!previewimage)
    {
      var imglink = ev.currentslide.get('data-image');
      previewimage = new Element('img',{ 'src' : imglink });

      var slideheight = ev.currentslide.measure(function(){
                                                            return this.getSize().y;
                                                          });

      new $wh.Preloader( [ new $wh.PreloadableImage(imglink) ]
                       , { onComplete:  this.onPreloadPreviewImageReady.bind(this, previewimage, ev.currentslide, slideheight)
                        // , timeout: 10000
                         }
                       );
    }
  }
, onPreloadPreviewImageReady: function(previewimage, slidenode, slideheight)
  {
    if(slidenode.getElement('img'))
      return;

    previewimage.inject(slidenode);

    //force browser registering new css of preview
    //   for css animation showing preview by requesting clientWidth
    previewimage.clientWidth;

    slidenode.removeClass('prepare');
  }
, toggleThumb: function(enlarge, ev)
  {
    var thumbnode = ev.target.hasClass('thumb') ? ev.target : ev.target.getParent('.thumb');
    if(thumbnode.getParent('.wh-imagegallery-grid'))
    { //grid
      var settings = thumbnode.retrieve('settings');
      if(enlarge)
        thumbnode.setStyles({ 'top': settings.top-5, 'left': settings.left-5, 'height': settings.height+10, 'width': settings.width+10});
      else
        thumbnode.setStyles(settings);
    }
  }
, showPreview: function(ev)
  {
    var thumbnode = ev.target.hasClass('thumb') ? ev.target : ev.target.getParent('.thumb');

    //switch from grid to single image slide
    //first start preload selected image and animate it into view
    var imageid = thumbnode.get('data-id');
    var slidenode = this.previewnode.getElement('.wh-slideshow-item[data-id=' + imageid + ']');
    var slideindex = this.previewslideshow.slides.indexOf(slidenode);
    if(slideindex < 0)
    {
      console.error('No corresponding preview found');
      return;
    }

    if(thumbnode.getParent('.wh-imagegallery-preview'))
    { //already in active preview

      if(this.scrolltimer)
        cancelAnimationFrame(this.scrolltimer);

      this.previewslideshow.gotoSlide(slideindex, true);
      return;
    }

    this.previewnode.getElements('.counter > .current').set('text',slideindex+1);
    this.previewnode.getElements('.info > span').set('text',slidenode.get('title'));

    this.previewslideshow.gotoSlide(slideindex, false);
    var previewlink = slidenode.get('data-image');


    if(this.options.fullscreen)
      this.previewnode.inject($(document.body));

    this.previewnode.addClass('beforeshow');//set visible so we can measure correct height

    //load preview image (if needed)
    var previewimage = slidenode.getElement('img');
    if(!previewimage)
    {
      previewimage = new Element('img',{ 'src' : previewlink });
      new $wh.Preloader( [ new $wh.PreloadableImage(previewlink) ]
                       , { onComplete:  this.onPreloadPreviewImageReady.bind(this, previewimage, slidenode, slidenode.getSize().y)
                        // , timeout: 10000
                         }
                       );
    }

    //Set initial preview image position
    var thumbpos     = thumbnode.getPosition((this.options.fullscreen ? $(document.body) : this.gridnode));
    var thumbsize    = thumbnode.getSize();
    var parentsize   = this.options.fullscreen ?  $(document.body).getSize() : this.gridnode.getSize();
    this.previewnode.setStyles({ 'top'   : thumbpos.y
                               , 'right' : parentsize.x - thumbsize.x - thumbpos.x
                               , 'bottom': parentsize.y - thumbsize.y - thumbpos.y
                               , 'left'  : thumbpos.x
                               }).toggleClass('fullscreen',this.options.fullscreen);

    this.previewslideshow.refresh();
    this.previewnode.set('style', null).addClass('show').removeClass('beforeshow');
    this.previewnode.focus();
  }

, generateGrid: function()
  {
    this.container.setStyle('height',null);//incase if height is set, reset

    this.gridnode.setStyles({ 'width' : null, 'height' : null });//reset width and height
    var gridsize = this.gridnode.getSize();

    var usemaxheight = false;
    if(!gridsize.y)
    { //if no size given, check max-height
      var maxh = this.container.getStyle('max-height');
      if(maxh)
      {
        gridsize.y = maxh.toInt();
        if(isNaN(gridsize.y))
          gridsize.y = 0;

        if(maxh.indexOf('%') != -1)
          gridsize.y = this.container.getParent().getSize().y * gridsize.y * 0.01;
      }
      usemaxheight = gridsize.y > 0;
    }

    var imagegroups = new Array();
    var row = 0;
    var groupimages = new Array();

    //calculate needed rows
    var gridrows = this.gridslideshownode ? 1 : this.thumbs.length;

    var rowheight = this.gridslideshownode ? Math.ceil(gridsize.y/gridrows) : this.options.maxthumbheight;
    while(this.gridslideshownode && rowheight > this.options.maxthumbheight)
    {
      gridrows++;
      rowheight = Math.ceil(gridsize.y/gridrows);
    }

    //distribute images in groups and rows with optimal outfill container
    for(var c = 0; c < this.thumbs.length; c++)
    {
      var img = this.thumbs[c].getElement('img');
      var thumbwidth  = img.getAttribute('width').toInt();
      var thumbheight = img.getAttribute('height').toInt();
      thumbwidth = Math.ceil(rowheight*(thumbwidth/thumbheight));

      this.thumbs[c].store('csswidth',thumbwidth);
      if(row < gridrows)
      {
        this.thumbs[c].set('data-row',row);

        if(!groupimages[row])
          groupimages[row] = { width : 0, images : [] };

        groupimages[row].images.push( this.thumbs[c] );
        groupimages[row].width += thumbwidth;

        if(groupimages[row].width >= gridsize.x)
          row++;
      }
      else
      { // group filled
        imagegroups.push(groupimages);

        groupimages = new Array();
        row = 0;

        groupimages[row] = { width : thumbwidth, images : [this.thumbs[c]] };
      }
    }

    if(groupimages.length)
      imagegroups.push(groupimages);

    //generate new slides if slideshow is available:
    var slides = [];
    if(this.gridslideshownode)
    {
      this.thumbs.inject(this.gridnode);//move thumbs temporary

      this.gridslideshownode.getElements('.wh-slideshow-item').destroy();

      for(var c = 0; c < imagegroups.length; c++)
      {
        var groupnode = new Element('div',{ 'class' : 'wh-slideshow-item' }).inject(this.gridslideshownode);
        slides.push(groupnode);
        for(var row = 0; row < imagegroups[c].length; row++)
        {
          for(var i = 0; i < imagegroups[c][row].images.length; i++)
          {
            imagegroups[c][row].images[i].toggleClass('firstrow',row == 0);
            imagegroups[c][row].images[i].toggleClass('firstcol',i == 0);
            imagegroups[c][row].images[i].inject(groupnode);
          }
        }
      }
    }

    //force browser registering the css start positions
    //  of the thumb needed to css animation repositioning thumbs by requesting clientWidth
    this.gridnode.clientWidth;

    var groupwidth  = 0;
    var groupheight = 0;
    var maxgroupheight = 0;
    for(var c = 0; c < imagegroups.length; c++)
    {
      var groupnode = slides.length ? slides[c] : null;
      groupwidth = gridsize.x;
      groupheight = imagegroups[c].length*rowheight;
      if(groupheight > maxgroupheight)
        maxgroupheight = groupheight;
      for(var row = 0; row < imagegroups[c].length; row++)
      {
        var xscalefactor = gridsize.x / imagegroups[c][row].width;
        if(xscalefactor > 1)
          xscalefactor = 1;

        var rowwidth = 0;
        for(var i = 0; i < imagegroups[c][row].images.length; i++)
        {
          var thumbwidth = Math.round(xscalefactor*imagegroups[c][row].images[i].retrieve('csswidth'));
          if(i == imagegroups[c][row].images.length - 1 && gridsize.x <= imagegroups[c][row].width)
            thumbwidth = Math.ceil(gridsize.x - rowwidth);//just outfill remaining space

          var thumbsettings = { 'top': rowheight*row, 'left': rowwidth, 'height': rowheight, 'width': thumbwidth};
          imagegroups[c][row].images[i].store('settings',thumbsettings);
          imagegroups[c][row].images[i].setStyles(thumbsettings);
          rowwidth+=thumbwidth;

          if(rowwidth > groupwidth)
            groupwidth = rowwidth;
        }
      }
      if(groupnode)
        groupnode.setStyle('width',groupwidth);
    }

    if(usemaxheight)
      this.container.setStyle('height',maxgroupheight);

    if(this.gridslideshownode)
    {
      if(this.gridslideshow)
        this.gridslideshow.stop();
      var slidesettings = { autoplay: false
                          , method: 'slide-horizontal' //fade-in
                          , slideduration: 800
                          , delay: 5000
                          , slide_selectedclass: 'active'
                          , jumpbuttons: this.gridnode.getElements('.jumpbuttons > span')
                          , jumpbutton_selectedclass: 'active'
                          , jumpbutton_animate : true
                          , prevbutton: this.gridnode.getElement('.previous')
                          , prevbutton_disabledclass: 'disabled'
                          , prevbutton_enabledclass: 'enabled'
                          , nextbutton: this.gridnode.getElement('.next')
                          , nextbutton_disabledclass: 'disabled'
                          , nextbutton_enabledclass: 'enabled'
                          };
      this.gridslideshow = new $wh.Slideshow(this.gridslideshownode, slidesettings);
    }
    else
    {
      this.gridnode.addClass('noslideshow').setStyles({ 'width' : groupwidth, 'height' : groupheight });
    }
  }
, onResize: function()
  {
    var viewportsize = this.container.getSize();

    if(!this.viewportsize || this.viewportsize.x != viewportsize.x || this.viewportsize.y != viewportsize.y)
    {
      if(this.viewportsize)
      {//don't execute on first call
        this.positionScrollThumbs();
      }

      this.viewportsize = { x : viewportsize.x, y : viewportsize.y };

      this.generateGrid();
    }
  }
});


/* **********************************************************************
 *
 * NEW VERSION: PURE PHOTOGRID, no popup/overlay code
 *  popup/overlay is separate lib
 *
 ************************************************************************/

/*
  Html structure:
    <div class="wh-imagegallery-grid" tabindex="0">
      [forevery pictures]
        <div class="thumb" data-id="[id]" title="[title]"><div><img src="[thumb.link]" width="[thumb.width]" height="[thumb.height]" alt="[title]" /></div></div>
      [/forevery]
      [! if no slideshow placeholder then grid will just fully outfill from top !]
      <div class="wh-slideshow"><!-- slides are generated by js depending on number of thumbs fitting in one slide --></div>
      <div class="previous disabled"></div>
      <div class="next disabled"></div>
    </div>
*/

/*
 * NICETOHAVE:
 *        -preload only thumbs visible (lazyload)
 */

 $wh.PhotoGrid2 = new Class(
{ Implements: [ Options ]
, viewportsize: null

, griditems: []
, gridnode: null
, gridslideshownode: null
, gridslideshow: null

, options: { maxthumbheight : 150 }

, initialize: function(container, options)
  {
    this.gridnode = container;

    this.setOptions(options);

    this.griditems = this.gridnode.getElements('.wh-photogrid-item');
    if(!this.griditems.length)
      return;//no items, so nothing todo

    this.gridslideshownode = this.gridnode.getElement('.wh-slideshow');
    if(this.gridslideshownode)
    {
      this.gridnode.addEventListener('keydown', this.onKeyDown.bind(this),true);
      this.gridnode.addEventListener('keyup', this.onKeyUp.bind(this),true);

      //plain swipe detection for touch devices
      new $wh.SwipeDetect(this.gridnode);
      this.gridnode.addEvent('swipe', this.onSwipe.bind(this));
    }

    this.griditems.addClass('prepare');//prepare is removed if thumb is loaded
    new $wh.Preloader( [ new $wh.PreloadableDomTree(this.gridnode) ]
                     , { onComplete:  this.onPreloadReady.bind(this)
                      // , timeout: 10000
                       }
                     );

    $(window).addEvent('resize', this.onResize.bind(this));
  }

, onPreloadReady: function(ev)
  {
    //get actual size of each image and set attributes used for later calculations
    this.griditems.getElements('img').each(function(imgnode)
    {
      var newimg = new Element('img',{ 'src' : imgnode.get('src') });
      imgnode.set('width',newimg.width);
      imgnode.set('height',newimg.height);
    });

    this.griditems.removeClass('prepare');
    this.onResize();
  }

, onKeyDown: function(ev)
  {
    if(this.keydown)
      return;

    this.keydown = true;
    var keyname = ev.keyIdentifier.toUpperCase();

    if(keyname == 'LEFT')
    {
      this.gridslideshow.gotoSlideRelative(-1, true);
    }
    else if(keyname == 'RIGHT')
    {
      this.gridslideshow.gotoSlideRelative(1, true);
    }
  }
, onKeyUp: function(ev)
  {
    this.keydown = false;
  }

, onSwipe: function(ev)
  {
    if(ev.direction.indexOf('e') != -1)
      this.gridslideshow.gotoSlideRelative(-1,true);
    else if(ev.direction.indexOf('w') != -1)
      this.gridslideshow.gotoSlideRelative(1,true);
  }

, onResize: function()
  {
    var viewportsize = this.gridnode.getParent().getSize();
    if(!this.viewportsize || this.viewportsize.x != viewportsize.x || this.viewportsize.y != viewportsize.y)
    {
      this.viewportsize = { x : viewportsize.x, y : viewportsize.y };
      this.generateGrid();
    }
  }

, generateGrid: function()
  {
    this.gridnode.setStyles({ 'width' : null, 'height' : null });//reset width and height
    var gridsize = this.gridnode.getSize();

    var maxhstr = this.gridnode.getStyle('max-height');
    var maxhint = maxhstr.toInt();
    var usemaxheight = !isNaN(maxhint) && maxhint > 0;
    if(usemaxheight)
    { //if no size given, check max-height
      if(maxhstr.indexOf('%') != -1)
        gridsize.y = this.gridnode.getParent().getSize().y * maxhint * 0.01;
      else
        gridsize.y = maxhint;
    }

    var imagegroups = new Array();
    var row = 0;
    var groupimages = new Array();

    //calculate needed rows
    var gridrows = this.gridslideshownode ? 1 : this.griditems.length;

    var rowheight = this.gridslideshownode ? Math.ceil(gridsize.y/gridrows) : this.options.maxthumbheight;
    while(this.gridslideshownode && rowheight > this.options.maxthumbheight)
    {//calculate nr. rows in a slide
      gridrows++;
      rowheight = Math.ceil(gridsize.y/gridrows);
    }

    //distribute images in groups and rows with optimal outfill container
    for(var c = 0; c < this.griditems.length; c++)
    {
      var img = this.griditems[c].getElement('img');
      var thumbwidth  = img.getAttribute('width').toInt();
      var thumbheight = img.getAttribute('height').toInt();
      thumbwidth = Math.ceil(rowheight*(thumbwidth/thumbheight));

      this.griditems[c].store('csssize',{'width':thumbwidth,'height':rowheight});
      if(row < gridrows)
      {
        this.griditems[c].set('data-row',row);

        if(!groupimages[row])
          groupimages[row] = { width : 0, images : [] };

        groupimages[row].images.push( this.griditems[c] );
        groupimages[row].width += thumbwidth;

        if(groupimages[row].width >= gridsize.x)
          row++;
      }
      else
      { // group filled
        imagegroups.push(groupimages);

        groupimages = new Array();
        row = 0;

        groupimages[row] = { width : thumbwidth, images : [this.griditems[c]] };
      }
    }

    if(groupimages.length)
      imagegroups.push(groupimages);

    //generate new slides if slideshow is available:
    var slides = [];
    if(this.gridslideshownode)
    {
      this.griditems.inject(this.gridnode);//move thumbs temporary

      this.gridslideshownode.getElements('.wh-slideshow-item').destroy();

      for(var c = 0; c < imagegroups.length; c++)
      {
        var groupnode = new Element('div',{ 'class' : 'wh-slideshow-item' }).inject(this.gridslideshownode);
        slides.push(groupnode);
        for(var row = 0; row < imagegroups[c].length; row++)
        {
          for(var i = 0; i < imagegroups[c][row].images.length; i++)
          {
            imagegroups[c][row].images[i].toggleClass('firstrow',row == 0);
            imagegroups[c][row].images[i].toggleClass('firstcol',i == 0);
            imagegroups[c][row].images[i].toggleClass('lastrow',row == imagegroups[c].length - 1);
            imagegroups[c][row].images[i].toggleClass('lastcol',i == imagegroups[c][row].images.length - 1);
            imagegroups[c][row].images[i].inject(groupnode);
          }
        }
      }
    }

    //force browser registering the css start positions
    //  of the thumb needed to css animation repositioning thumbs by requesting clientWidth
    this.gridnode.clientWidth;

    var groupwidth  = 0;
    var groupheight = 0;
    var maxgroupheight = 0;
    for(var c = 0; c < imagegroups.length; c++)
    {
      var groupnode = slides.length ? slides[c] : null;
      groupwidth = gridsize.x;
      groupheight = imagegroups[c].length*rowheight;
      if(groupheight > maxgroupheight)
        maxgroupheight = groupheight;
      for(var row = 0; row < imagegroups[c].length; row++)
      {
        var xscalefactor = gridsize.x / imagegroups[c][row].width;
        if(xscalefactor > 1)
          xscalefactor = 1;

        var rowwidth = 0;
        for(var i = 0; i < imagegroups[c][row].images.length; i++)
        {
          var csssize = imagegroups[c][row].images[i].retrieve('csssize');

          var thumbwidth = Math.round(xscalefactor*csssize.width);
          var thumbheight = Math.round(csssize.height);
          if(i == imagegroups[c][row].images.length - 1 && gridsize.x <= imagegroups[c][row].width)
            thumbwidth = Math.ceil(gridsize.x - rowwidth);//just outfill remaining space

          var thumbsettings = { 'top': rowheight*row, 'left': rowwidth, 'height': thumbheight, 'width': thumbwidth};

          imagegroups[c][row].images[i].store('settings',thumbsettings);
          imagegroups[c][row].images[i].setStyles(thumbsettings);
          rowwidth+=thumbwidth;

          if(rowwidth > groupwidth)
            groupwidth = rowwidth;
        }
      }
      if(groupnode)
        groupnode.setStyle('width',groupwidth);
    }

    if(usemaxheight)
      this.gridnode.setStyle('height',maxgroupheight);

    if(this.gridslideshownode)
    {
      if(this.gridslideshow)
        this.gridslideshow.stop();
      var slidesettings = { autoplay: false
                          , method: 'slide-horizontal'
                          , slideduration: 800
                          , delay: 5000
                          , slide_selectedclass: 'active'
                          , jumpbuttons: this.gridnode.getElements('.jumpbuttons > span')
                          , jumpbutton_selectedclass: 'active'
                          , jumpbutton_animate : true
                          , prevbutton: this.gridnode.getElement('.previous')
                          , prevbutton_disabledclass: 'disabled'
                          , prevbutton_enabledclass: 'enabled'
                          , nextbutton: this.gridnode.getElement('.next')
                          , nextbutton_disabledclass: 'disabled'
                          , nextbutton_enabledclass: 'enabled'
                          };
      this.gridslideshow = new $wh.Slideshow(this.gridslideshownode, slidesettings);
    }
    else
    {
      this.gridnode.addClass('noslideshow').setStyles({ 'width' : groupwidth, 'height' : groupheight });
    }
  }
});

})(document.id); //end mootools/scope wrapper
