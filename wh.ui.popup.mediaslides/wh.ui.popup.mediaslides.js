/* generated from Designfiles Public by generate_data_designfles */
require ('./mediaslides.css');
require ('wh.util.template');
require ('wh.util.preloader');
require ('wh.util.swipedetect');
require ('wh.animations.slideshow');
require ('wh.animations.slideshow.cssanimations');
require ('wh.ui.popup');
require ('wh.media.embedvideo');
/*! LOAD: wh.util.template, wh.util.preloader, wh.util.swipedetect, wh.animations.slideshow, wh.animations.slideshow.cssanimations, wh.ui.popup, wh.media.embedvideo
!*/

/*
  Popup with styleable photo/video slideshow (uses template)
  Images are only loaded when visible and can depend on viewport width for lightweight use in mobile devices

  new $wh.MediaSlidesPopup($$('.wh-enlarge'),{ template : $('mediaoverlay') });

  Tries to load an image from multiple images dependend on viewport width
  imagesjson: [{"url" : "http://..", "maxwidth" : 200};

  If video information is set, click on slide will load/activate video

  <div title="[title]" data-image="[imagesjson]" [if video]data-video='{"id":"4UiErgDREZM","network":"youtube"}'[/if] class="wh-enlarge">
    <img src="[thumb]" alt="[title]" />
  </div>

  Template example:

    <template id="mediaoverlay">
      <div class="wh-media-overlay">
        <div data-template-iterate="items" class="wh-slideshow">
          <div class="wh-slideshow-item">
            <div class="wh-media-overlay-image">
              [! image is injected by preloader in js !]
              <div data-template-if="video" class="video-play">
                <span class="fa fa-play"></span>
                <div class="videoholder"></div>
              </div>
            </div>
            <span class="preloader fa fa-spinner fa-pulse">[! will be removed after preload is done !]</span>
          </div>
        </div>
        <div class="previous"></div>
        <div class="next"></div>
        <div class="topbar">
          <span class="wh-media-overlay-title"></span>
          <span class="wh-media-overlay-counter"></span>
          <span class="wh-popup-action-close close">close</span>
        </div>
      </div>
    </template>

*/

$wh.MediaSlidesPopup = new Class(
{ Implements: [ Options ]

, items: []
, popupcontentnode : null
, popup : null
, startindex: 0
, viewportsize: {}
, activevideo: null

, initialize: function(selector, options)
  {
    this.setOptions(options);
    $$(selector).each(function(node, i)
    {
      var title = node.get('title');

      var videoinfo = node.get('data-video');
      var imginfo = node.get('data-image');
      var images = [];//list of size depended images

      if(imginfo)
      {
        if(imginfo.indexOf('{') == -1)
        { //expect then just plain url
          images.push({ 'url' : imginfo, 'maxwidth' : -1 });
        }
        else
        {
          imginfo = JSON.decode(imginfo);
          if(imginfo instanceof Array)
          {
            images = imginfo;
            images.sort(this.sortImageSizes)
          }
          else
            images.push({ 'url' : imginfo.url, 'maxwidth' : -1 });
        }
      }

      if(images.length)
      {
        this.items.push({ 'node' : node, 'images' : images, 'title' : (title ? title : ''), 'video' : videoinfo });
        node.addEvent('click', this.showOverlay.bind(this, i));
      }
    }.bind(this));

    if(this.items.length > 0)
    {
      if(!this.options.template)
        console.log('required option template is missing');
    }

  }

, sortImageSizes: function(a,b)
  {
    return (a.maxwidth - b.maxwidth);
  }

, onKeyDown: function(ev)
  {
    if(this.keydown)
      return;

    this.keydown = true;
    var keyname = ev.keyIdentifier.toUpperCase();
    if(ev.keyCode == 27)//ESC
    {
      this.popup.hide();
    }
    else if(keyname == 'LEFT')
    {
      this.slideshow.gotoSlideRelative(-1, true);
    }
    else if(keyname == 'RIGHT')
    {
      this.slideshow.gotoSlideRelative(1, true);
    }
  }

, onKeyUp: function(ev)
  {
    this.keydown = false;
  }

, showOverlay: function(i, ev)
  {
    ev.stop();

    this.startindex = i;

    if(!this.popupcontentnode)
    {
      $wh.expandTemplate(this.options.template, {'items' : this.items});
      this.popupcontentnode = this.options.template.getPrevious();
    }

    if(this.popupcontentnode)
    {
      if(!this.slideshow)
      {
        //for the moment there are some problems with slideshow css anim if slide itself has alse animations
        var do_cssanimation = false; // !(Browser.ie && Browser.version < 10)

        var slideshownode = this.popupcontentnode.getElement('.wh-slideshow');
        var slidesettings = { autoplay: false
                            , method: do_cssanimation ? 'css-animation' : 'slide-horizontal'
                            , anim: do_cssanimation ? 'slide-h' : ''
                            , slideduration: 800
                            , delay: 5000
                            , loop: false
                            , slide_selectedclass: 'active'
                            , jumpbuttons: this.popupcontentnode.getElements('.jumpbuttons > span')
                            , jumpbutton_selectedclass: 'active'
                            , prevbutton: this.popupcontentnode.getElement('.previous')
                            , prevbutton_disabledclass: 'disabled'
                            , prevbutton_enabledclass: 'enabled'
                            , nextbutton: this.popupcontentnode.getElement('.next')
                            , nextbutton_disabledclass: 'disabled'
                            , nextbutton_enabledclass: 'enabled'
                            };
        this.slideshow = new $wh.Slideshow(slideshownode, slidesettings);
        this.slideshow.slides.each(function(slidenode, i)
        {
          if(this.items[i].video)
            slidenode.addEvent('click',this.startVideo.bind(this));
        }.bind(this));

        this.slideshow.addEvent('endslide',function(ev)
        {
          this.stopVideo();//stop previous video if is playing

          var imgurl = this.getLargeImageUrl(this.slideshow.currentpos);
          new $wh.Preloader( [ new $wh.PreloadableImage(imgurl) ]
                           , { onComplete:  this.onImagePreloadReady.bind(this, this.slideshow.currentpos, imgurl)
                            // , timeout: 10000
                             }
                           );
        }.bind(this));

        var titlenode = this.popupcontentnode.getElement('.wh-media-overlay-title');
        var counternode = this.popupcontentnode.getElement('.wh-media-overlay-counter');

        this.slideshow.addEvent('startslide', function(ev)
        {
          //update slidenr and/or title
          var current = ev ? ev.current : this.startindex;
          if(counternode)
            counternode.set('text', (current + 1) + ' / ' + this.items.length);
          if(titlenode)
            titlenode.set('text', this.items[current].title);
        }.bind(this));

        //swipe detection if touch enabled
        new $wh.SwipeDetect(this.popupcontentnode);
        this.popupcontentnode.addEvent('swipe', function(ev)
        {
          if(ev.direction.indexOf('e') != -1)
            this.slideshow.gotoSlideRelative(-1,true);
          else if(ev.direction.indexOf('w') != -1)
            this.slideshow.gotoSlideRelative(1,true);
        }.bind(this));
      }

      this.slideshow.gotoSlide(this.startindex,false);//set initial slide
      this.slideshow.fireEvent('startslide');//trigger update title/counter

      if(!this.popup)
      {
        this.popup = $wh.PopupManager.createFromElement( this.popupcontentnode, { explicitclose: false
                                                                                , show: false
                                                                                , keepfromedge: 0
                                                                                , closebutton: false
                                                                                , scroll: 'popup_viewport'
                                                                                , theme : 'media-overlay'
                                                                                });
        this.popup.addEvent('aftershow',function(startindex)
        {
          //load selected image
          var imgurl = this.getLargeImageUrl(this.startindex);
          new $wh.Preloader( [ new $wh.PreloadableImage(imgurl) ]
                           , { onComplete:  this.onImagePreloadReady.bind(this, this.startindex, imgurl)
                            // , timeout: 10000
                             }
                           );

          this.fnresize = this.onResize.bind(this);
          this.fnkeydown = this.onKeyDown.bind(this);
          this.fnkeyup = this.onKeyUp.bind(this);

          $(window).addEventListener('resize', this.fnresize, false);
          $(document.body).addEventListener('keydown', this.fnkeydown, false);
          $(document.body).addEventListener('keyup', this.fnkeyup, false);

          this.slideshow.refresh();

        }.bind(this));

        this.popup.addEvent('afterhide',function()
        {
          this.stopVideo();//stop previous video if is playing

          $(document.body).removeEventListener('resize', this.fnresize);
          $(document.body).removeEventListener('keydown', this.fnkeydown);
          $(document.body).removeEventListener('keyup', this.fnkeyup);
        }.bind(this));

        this.popupcontentnode.getElements('.wh-slideshow-item').addEvent('click',function(ev)
        {//catch click on transparent part
          if(ev.target.hasClass('wh-slideshow-item'))
            this.popup.hide();
        }.bind(this));
      }

      this.popup.show();

      this.onResize();//correct sizes of already loaded images
    }
  }

, startVideo: function()
  {
    this.stopVideo();//stop previous video if is playing
    var videonode = this.slideshow.slides[this.slideshow.currentpos].getElement('[data-video]');
    if(videonode)
    {
      $wh.__generateVideoNode(JSON.decode(this.items[this.slideshow.currentpos].video), { autoplay: true }).inject(videonode);
      this.activevideo = videonode;
    }
  }

, stopVideo: function()
  {
    if(this.activevideo)
    {
      this.activevideo.empty();
      this.activevideo = null;
    }
  }

, getLargeImageUrl: function(i)
  {
    var url = '';

    var x = this.viewportsize.x ? this.viewportsize.x : this.popupcontentnode.getSize().x;
    for(var s = 0; s < this.items[i].images.length; s++)
    {
      url = this.items[i].images[s].url;
      if(this.items[i].images[s].maxwidth >= x)
        break;
    }
    return url;
  }

, onResize: function()
  {
    var viewportsize = this.popupcontentnode.getSize();
    if(!this.viewportsize || this.viewportsize.x != viewportsize.x || this.viewportsize.y != viewportsize.y)
    {
      this.viewportsize = { x : viewportsize.x, y : viewportsize.y };

      this.slideshow.slides.each(function(slidenode, i)
      {
        var imgwrappernode = null;
        var imgnode = slidenode.getElement('.wh-media-overlay-image');
        if(imgnode.nodeName != 'IMG')
        {
          imgwrappernode = imgnode;
          imgnode = imgnode.getFirst('img');
        }
        if(imgnode)
        {
          var imgurl = this.getLargeImageUrl(i);
          if(imgurl != imgnode.get('src'))
          { // load other (smaller or bigger) image
            new $wh.Preloader( [ new $wh.PreloadableImage(imgurl) ]
                             , { onComplete:  this.onImagePreloadReady.bind(this, i, imgurl)
                              // , timeout: 10000
                               }
                             );
          }

          var slidesize = slidenode.getSize();
          var w = imgnode.getAttribute('width').toInt();
          var h = imgnode.getAttribute('height').toInt();

          var cover;
          if(slidesize.x < w || slidesize.y < h)
            cover = $wh.getCoverCoordinates( w, h, slidesize.x, slidesize.y, true );
          else
            cover = { 'top' : Math.floor((slidesize.y - h)/2), 'left' : Math.floor((slidesize.x - w)/2), 'width' : w, 'height' : h};

          if(imgwrappernode)
            imgwrappernode.setStyles(cover);
          else
            imgnode.setStyles(cover);

        }
      }.bind(this));
    }

  }

, onImagePreloadReady: function(i, imgurl)
  {
    var slidenode = this.popupcontentnode.getElement('.wh-slideshow-item:nth-child(' + (i+1) + ')');
    var slidesize = slidenode.getSize();

    var w = 0;
    var h = 0;
    var imgnode = slidenode.getElement('.wh-media-overlay-image');

    var imgwrappernode = null;
    if(imgnode.nodeName != 'IMG')
    {
      imgwrappernode = imgnode;
      imgnode = imgnode.getFirst('img');
    }

    if(!imgnode)
    {
      var preloadnode = slidenode.getElement('.preloader');
      if(preloadnode)
        preloadnode.destroy();

      imgnode = new Element('img',{'src': imgurl, 'class' : 'wh-media-overlay-image'});
      var w = imgnode.width;
      var h = imgnode.height;
      imgnode.set('width',w);
      imgnode.set('height',h);

      if(imgwrappernode)
      {
        imgwrappernode.setStyles({'top' : Math.round(slidesize.y/2), 'left' : Math.round(slidesize.x/2), 'width' : 0, 'height' : 0 });
        imgnode.inject(imgwrappernode);
      }
      else
        imgnode.setStyles({'top' : Math.round(slidesize.y/2), 'left' : Math.round(slidesize.x/2), 'width' : 0, 'height' : 0 }).inject(slidenode);
    }
    else
    {
      if(imgnode.get('src') != imgurl)
      { //replace current image
        var testnode = new Element('img',{'src': imgurl});
        var w = testnode.width;
        var h = testnode.height;
        imgnode.set('width',w);
        imgnode.set('height',h);
        imgnode.set('src',imgurl);
        testnode.destroy();//not needed anymore
      }

      w = imgnode.getAttribute('width').toInt();
      h = imgnode.getAttribute('height').toInt();
    }

    slidenode.clientWidth; //force css update

    var cover;
    if(slidesize.x < w || slidesize.y < h)
      cover = $wh.getCoverCoordinates( w, h, slidesize.x, slidesize.y, true );
    else
      cover = { 'top' : Math.floor((slidesize.y - h)/2), 'left' : Math.floor((slidesize.x - w)/2), 'width' : w, 'height' : h};

    if(imgwrappernode)
      imgwrappernode.setStyles(cover);
    else
      imgnode.setStyles(cover);
  }

});
