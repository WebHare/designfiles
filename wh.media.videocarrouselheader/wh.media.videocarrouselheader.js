/* generated from Designfiles Public by generate_data_designfles */
require ('wh.net.url');
require ('wh.compat.base');
require ('wh.util.preloader');
require ('wh.media.base');
require ('wh.util.resizelistener');
require ('wh.media.videomgr');
/*! LOAD: wh.net.url, wh.compat.base, wh.util.preloader, wh.media.base, wh.util.resizelistener, wh.media.videomgr
!*/

(function($) { //mootools wrapper
"use strict";

$wh.VideoCarrouselHeader = new Class(
{ url: new $wh.URL(location.href)
, method: null
, transitBGC: null
, video: null
, container: null
, overlay: null
, current: 0
, next: 0
, player: null
, firstinit: true
, isplaying: false
, options:
  { videos: { vid:       ""
            , poster:    ""
            , ispinned:  false
            }
  }

, setOptions: function(options)
  {
    var base_options = Object.clone(this.options);
    Object.merge(base_options, options);

    Object.merge(base_options.videos, options.videos);

    this.options = base_options;
  }
, initialize: function(overlay, videoelement, options)
  {
    this.setOptions(options);

    // Gather the videos:
    var allVideos = $(videoelement).querySelectorAll('video');
    var vidinfo = new Array();
    for(var i = allVideos.length - 1; i > -1; i--)
    {
      vidinfo.push({ vid: allVideos[i].getAttribute('data-src'), poster: allVideos[i].getAttribute('poster'), ispinned: allVideos[i].getAttribute('data-pinned') });
      allVideos[i].dispose();
    }
    this.options.videos = vidinfo;

    this.method = this.url.getVariable('method');
    this.video = $(videoelement);
    this.container = this.video.parentNode;
    this.overlay = overlay;
    //console.log(this.video);
    // Set the size for the video container and the overlay
    this.setSize();

    this.video.setStyle("background-image", "url(" + vidinfo[0].poster + ")");

    // Initialize the actual player:
    var video_events =
          {"ended": this.onEnded.bind(this)
          ,"loadedmetadata": this.onLoadedMetadata.bind(this)
          ,"playing": this.onPlayStart.bind(this)
          ,"stalled": this.startDelayed.bind(this)
          ,"canplaythrough": this.onCanPlayThrough.bind(this)
          ,"abort": this.startDelayed.bind(this)
          };

    this.player = new Element("video", {src:      ""
                                       ,loop:     (allVideos.length > 1)?false : true
                                       ,controls: null
                                       ,events:   video_events
                                       //,"width":  "100%"
                                       ,"height": this.video.parentNode.getStyle("height")
                                       ,autoplay: true
                                       ,muted: true
                                       });

    this.player.setStyle("width", "100%");
    this.player.setStyle("visibility", "hidden");
    this.video.appendChild(this.player);

    //if(Browser.ie && Browser.version < 10)
    this.player.removeAttribute("width");// Fix for IE9, for some reason it wants to make the video 100px wide ;)

    this.player.setAttribute("src", vidinfo[0].vid);

    if(allVideos.length > 1)
      this.next++;

    this.player.setStyle("visibility", "hidden");
    window.testVideoCarousel = this;

    $wh.enableResizeEvents(this.video);
    this.relayout();
    window.addEvent("resize", this.relayout.bind(this));
    this.startDelayed();// Prevent Safari from borking on first load
    (function() { this.player.setStyle("visibility", "visible") }.bind(this)).delay(1100);// Try to force initialization
    //console.log("init finished; videos:", this.options.videos);
  }
  // Layout
  //
, setSize: function()
  {
    // Enforce relative positioning on the wrapper:
    $(this.video).parentNode.setStyle("position", "relative");
    var coords = $(this.video).parentNode.getBoundingClientRect();
    var vidcoords = $(this.video).getBoundingClientRect();
    // Fit 'em using the good old coordinates trick and position the overlay absolute:
    var vidwidth = vidcoords.right - vidcoords.left;
    var parentwidth = coords.right - coords.left;

    $(this.overlay).setStyles({ "top": 0, "right": 0, "bottom": 0, "left": 0, "position": "absolute" });
  }
, relayout: function()
  {
    if($(this.video).parentNode.getStyle("display") == "none" || $(this.video).parentNode.getStyle("visibility") == "hidden")
    {
      this.player.pause();
      return;
    }
    this.setSize();
    this.onLoadedMetadata();
    this.player.play();
  }
  // Event handlers
  //
, onEnded: function()
  {
    //console.log("ended");
    if(this.current < (this.options.videos.length - 1))
      this.current++;
    else
      this.current = 0;

    //console.log("playing video", "#" + this.current, "out of", this.options.videos.length, "videos");

    this.next = this.current + 1;
    if(this.next == this.options.videos.length)
      this.next = 0;

    this.player.setStyle("visibility", "hidden");
    //console.log("visibility set to hidden");

    this.player.setAttribute("src", this.options.videos[this.current].vid);

    this.isplaying = false;
    (function() { if(!this.isplaying){ this.player.play(); } }.bind(this)).delay(500);// Fallback in case the load was not quick enough
    //console.log("video ended; loaded", this.options.videos[this.current].vid);
  }
, onLoadedMetadata: function()
  {
    //console.log("loadedmetadata");
    //console.log("metadata loaded for", this.options.videos[this.current].vid);
    var rawWidth = this.player.videoWidth;
    var rawHeight = this.player.videoHeight;
    var origAspect = rawWidth / rawHeight;
    var coords = this.video.parentNode.getCoordinates();
    var containerWidth = coords.right - coords.left;
    var containerHeight = coords.bottom - coords.top;

    var targetAspect = containerWidth / containerHeight;
    var multi = origAspect / targetAspect;
    if(targetAspect > origAspect)
      multi = targetAspect / origAspect;

    this.player.setStyles({
    "height": containerHeight,
    "transform": "scale(" + multi + ")",
    // IE 9
    "-ms-transform": "scale(" + multi + ")",
    // Firefox
    "-moz-transform": "scale(" + multi + ")",
    // Safari and Chrome
    "-webkit-transform": "scale(" + multi + ")",
    // Opera
    "-o-transform": "scale(" + multi + ")"
    });
    if(this.firstinit)
    {
      this.firstinit = false;
      this.player.play();
      return;
    }
    //this.player.play();
    //console.log("issued play command");
    // Fix for the latest safari, which does not trigger the playing event after the first load:
    //this.player.fireEvent("playing", null, 25);
    //(function() { if(!this.isplaying){ this.player.play(); } }.bind(this)).delay(250);// Fallback in case the load was not quick enough
    if(!this.isplaying)
      this.player.play();
  }
, onPlayStart: function()
  {
    //console.log("playing");
    if(this.isplaying)
      return;

    //console.log("playStart event triggered");
    (function() { this.player.setStyle("visibility", "visible") }.bind(this)).delay(250);// Short delay to prevent flashing

    //this.player.setStyle("visibility", "visible");
    //console.log("visibility set to visible");
    (function() { this.video.setStyle("background-image", "url(" + this.options.videos[this.next].poster + ")"); /*console.log("background set to", "#" + this.next);*/ }.bind(this)).delay(1000);// Prevent the flashing in Safari by adding a delay
    this.isplaying = true;
  }
, startDelayed: function()
  {
    //console.log("stalled/abort");
    (function() { if(!this.isplaying){ this.onLoadedMetadata(); } }.bind(this)).delay(1000);// Try to force initialization
    (function() { if(!this.isplaying){ this.onEnded(); } }.bind(this)).delay(2000);// Load the next video as a last resort if playback has not been resumed after two seconds
  }
, onCanPlayThrough: function()
  {
    //console.log("canplaythrough");
    if(!this.isplaying)
      this.player.play();
  }
});

})(document.id);
