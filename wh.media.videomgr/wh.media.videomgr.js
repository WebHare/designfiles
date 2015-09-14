/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.util.preloader');
require ('wh.media.base');
require ('mediaplayers.jwplayer.licensed');
/*! LOAD: frameworks.mootools.core, wh.util.preloader, wh.media.base
    LOAD: mediaplayers.jwplayer.licensed
!*/

//ADDME how to support noncommercial jwplayer? do we care? :P
//try to model after: http://www.w3.org/TR/html5/media-elements.html

/*
NOTES:
- iOS < 5 doesn't support the loop attribute (and we don't emulate it yet either)
- for Android we emulate looping since the loop attribute is broken there

Notes on JWPlayer:
- JWPlayer isn't made to be inserted/initialized in an element which isn't inserted in the DOM yet
- if 'JWPlayer' is used for playback, calling play() directly after an autostart=true video will pause playback directly
- 'JWPlayer' has a click-to-pause behavious. To work around this either
    - add an layer over the video which makes the video unclickable
    - add some way to pass to jwplayer --> events: { onPause: function() { this.play(true); } }
- some properties (like autoplay and loop) cannot be changed in jwplayer after initialization,
  possible solutions:
  - modify jwplayer itself
  - detect we update properties which jwplayer can't dynamicly update and destroy and reinitialize jwplayer
  - handle autoplay ourselves
*/


// ADDME: a setOptions() or updateOptions() function
(function($) { //mootools wrapper

  //activate HTML5 video mootools support
   var media_events = {
       loadstart: 2, progress: 2, suspend: 2, abort: 2,
       error: 2, emptied: 2, stalled: 2, play: 2, pause: 2,
       loadedmetadata: 2, loadeddata: 2, waiting: 2, playing: 2,
       canplay: 2, canplaythrough: 2, seeking: 2, seeked: 2,
       timeupdate: 2, ended: 2, ratechange: 2, durationchange: 2, volumechange: 2
   }
   Element.NativeEvents = Object.merge(Element.NativeEvents, media_events);

$wh.VideoManager = new Class(
{ Extends: $wh.MediaWithVolume
, Implements: [$wh.PreloadableAsset,Events,$wh.CuePoints]
, player: null
, container:null
, options: { width: null
           , height: null
           , jwplayerbase: ''
           , autoplay: false
           , loop: false
           , muted: false
           , poster:null
           , method: ''
           , prefermethod: ''
           , stretching:'uniform' //uniform, fill. fill currently requires the video element to be loaded in a container with overflow:hidden
           , controls:true
           , settings_jwplayer:null
           , showcontrols: null //deprecated, use 'controls'
           , streamer: null

           /** @cell src
               @cell srclang
               @cell label
               @cell kind
           */
           , tracks: []
           , tracksselection: []
           }

, initialize: function(container, movieurl, options)
  {
    //ADDME support options, allow player inclusion/exclusion
    this.parent(options);

    this.container=$(container);
    this.container.store("videomgr", this);
    this.movieurl = movieurl;

    if(this.options.showcontrols !== null) //correct non-html5 name, we're trying to follow html5 as much as possible
    {
      console.warn("videomgr invoked with 'showcontrols' option. the proper (html5) name is 'controls'");
      this.options.controls = this.options.showcontrols;
    }

    if(!this.options.method)
    {
      //ADDME more browsers should prefer <video> based on the rest of the info..
      var ismp4 = movieurl.slice(-4)=='.mp4';

      if( (Browser.ie && Browser.version<9))// || Browser.firefox)
      {
        this.options.method = 'jwplayer'; //no choice, may be h264
      }
      else if(this.hasFlash())//if(!Browser.Plugins.Flash.version) //no choice either
      {
        this.options.method = 'html5'; //no choice
      }
      else
      {
        this.options.method = this.options.prefermethod ? this.options.prefermethod : 'html5';
      }
    }

    this.setMute(this.options.muted);

    if(this.options.method=='html5')
      this.setupVideoTag();
    else if(this.options.method=='jwplayer')
      this.setupJWPlayer();
  }

, hasFlash:function ()
  {
      var hasFlash = false;
      try {
          var ao = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
          if (ao) {
              hasFlash = !hasFlash;
          }
      } catch (e) {
          if (navigator.mimeTypes
              && navigator.mimeTypes['application/x-shockwave-flash'] != undefined
              && navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
              hasFlash = !hasFlash;
          }
      }
      return hasFlash;
  }

, destroy:function()
  {
    if(this.jwplayerid)
    {
      try { this.jwplayer.remove() }
      catch(e) { console.log("Ignoring jwplayer destroy exception from " + this.jwplayerid,e); }
    }

    this.container.eliminate("videomgr");
    $(this.container).empty();
    this.parent();
  }

, fixupWidthHeight:function()
  {
    if(this.options.width === null)
      this.options.width = this.container.getSize().x - this.container.getStyle("padding-left").toInt() - this.container.getStyle("padding-right").toInt() - this.container.getStyle("border-left-width").toInt() - this.container.getStyle("border-right-width").toInt();
    if(this.options.height === null)
      this.options.height = this.container.getSize().y - this.container.getStyle("padding-top").toInt() - this.container.getStyle("padding-bottom").toInt() - this.container.getStyle("border-top-width").toInt() - this.container.getStyle("border-bottom-width").toInt();
  }

, setVideo:function(videourl, options)
  {
    if(this.jwplayer)
    {
      var loadaction = {file:videourl};
      if(options.poster)
        loadaction.image = options.poster;

      try
      {
        this.jwplayer.load(loadaction);
      }
      catch(e)
      {
        console.log("JWPlayer exception loading new video",e);
      }
    }
    else if(this.videoelement)
    {
      this.videoelement.src = videourl;
      if(options.poster)
        this.videoelement.poster = options.poster;
      if(this.options.autoplay)
      {
        this.videoelement.play();
      }
    }
  }

, setSize:function(x,y)
  {
    this.options.width=x;
    this.options.height=y;

    this.container.setStyles({ "width": this.options.width
                             , "height": this.options.height
                             });

    if(this.videoelement)
    {
      this.applyVideoTagSizes();
    }
    else if(this.jwplayer)
    {
      // IE 6 & 7 won't allow Mootools to extend a <object> tag (Flash)
      this.container.firstChild.style.width = this.options.width + "px";
      this.container.firstChild.style.height = this.options.height + "px";
    }
  }
, getCurrentTime:function()
  {
    var curtime = {duration : -1, currentTime : -1 };
    if(this.videoelement)
    {
      try
      {
        curtime.currentTime = this.videoelement.currentTime;
        curtime.duration    = this.videoelement.duration;
      }
      catch(e)
      {
        //FIXME: if currenttime is set but the player not ready, shouldn't ignore, but save the time
      }
    }
    else if (this.jwplayer)
    {
      try
      {
        curtime.currentTime = this.jwplayer.getPosition();
        curtime.duration    = this.jwplayer.getDuration();
      }
      catch(e)
      {
        //
      }
    }
    return curtime;
  }
, setCurrentTime:function(pos)
  {
    if(this.videoelement)
    {
      try
      {
        this.videoelement.currentTime=pos;
      }
      catch(e)
      {
        //FIXME: if currenttime is set but the player not ready, shouldn't ignore, but save the time
      }
    }
    else if (this.jwplayer)
    {
      try
      {
        this.jwplayer.seek(pos);
      }
      catch(e)
      {
        console.log("Ignoring jwplayer seek exception from " + this.jwplayerid,e);
      }
    }
  }

, rewind:function()
  {
    if(this.videoelement)
    {
      try
      {
        this.videoelement.pause();
        this.videoelement.currentTime = 0;
        this.videoelement.load();
      }
      catch(e)
      {
        //FIXME: if currenttime is set but the player not ready, shouldn't ignore, but save the time
      }
    }
    else if (this.jwplayer)
    {
      try
      {
        this.jwplayer.seek(0);
        this.jwplayer.pause();
      }
      catch(e)
      {
        console.log("Ignoring jwplayer seek exception from " + this.jwplayerid,e);
      }
    }

//    this.setCurrentTime(0);
  }

, isPlaying:function() //note, also true if we're still buffering
  {
    if(this.jwplayer)
      return ['BUFFERING','PLAYING'].contains(this.jwplayer.getState());
    if(this.videoelement)
      return !this.videoelement.paused;

    return false;
  }

, setupImgTag:function()
  {
    this.fixupWidthHeight();
    this.container.empty();

    //FIXME don't assume we have a poster
    this.imgelement = new Element("img", {src:      this.options.poster
                                         ,events: {"click": this.play.bind(this)
                                                  }
                                         ,"width": this.options.width
                                         ,"height": this.options.height
                                         });
    this.container.adopt(this.imgelement);
  }

, setupVideoTag:function()
  {
    this.fixupWidthHeight();
    this.container.empty();

    var video_events =
          {"ended": this.onEnded.bind(this)
          ,"timeupdate": this.onTimeupdate.bind(this)
          ,"loadedmetadata": this.onLoadedMetadata.bind(this)
          };

    //http://www.w3.org/TR/html5/the-video-element.html#the-video-element
    this.videoelement = new Element("video", {src:      this.movieurl
                                             ,loop:     this.options.loop
                                             ,controls: this.options.controls
                                             ,events:   video_events
                                             ,"width":  this.options.width
                                             ,"height": this.options.height
                                             });

    // ADDME: also try to detect iOS < 5 and trigger our own looping there?
    if (Browser.Platform.android && this.options.loop)
    {
      // if loop is set to true on Android, the 'ended' event will not be called,
      // but the video isn't looped either, so disable loop and handle it ourselves
      this.videoelement.loop = false;
      this.videoelement.addEventListener("ended", function(evt) { evt.target.currentTime=0.1; evt.target.play(); }, false);
    }

    this.createTrackTags();

    if(this.options.poster)
      this.videoelement.poster = this.options.poster;

    this.container.adopt(this.videoelement);
    this.applyVideoTagSizes();
    this.updateVolume();

    if(this.options.autoplay)
      this.play();
  }

, createTrackTags:function(removeexistingtracks)
  {
    if(removeexistingtracks)
      this.videoelement.getElements("track").destroy();

    for (var tel=0; tel < this.options.tracks.length; tel++)
    {
      var trkdata = this.options.tracks[tel];
      var trkelement = new Element( "track"
                                  , { src:     trkdata.src
                                    , srclang: trkdata.srclang
                                    , label:   trkdata.label
                                    , kind:    trkdata.kind
                                    , "default": "default"
                                    }
                                  );
      this.videoelement.adopt(trkelement);

      trkdata.tracknode = trkelement;
    }
  }

, setTracks:function(tracks)
  {
    this.options.tracks = tracks;

    if(this.jwplayer)
    {
      try
      {
        // ADDME
        //this.jwplayer.play();
      }
      catch(e)
      {
        console.log("Ignoring jwplayer play exception from " + this.jwplayerid,e);
      }
    }
    else if(this.videoelement)
    {
      this.createTrackTags();
    }
  }

  /** @short set which tracks are enabled (only works for tracks for which you specified rowkeys)
      @param STRING ARRAY with the rowkey's of the tracks which should be enabled
  */
, SetTracksSelection:function(trackselection)
  {
    if(!this.videoelement)
      return;

    //console.warn(trackselection);
    for(var tel=0; tel < this.options.tracks.length; tel++)
    {
      var trkdata = this.options.tracks[tel];
      var enabled = trkdata.rowkey && trackselection.contains(trkdata.rowkey);

      //console.log(trkdata.rowkey + " will be "+(enabled ? "showing" : "hidden") );

      this.videoelement.textTracks[tel].mode = enabled ? "showing" : "hidden";
      //trkdata.tracknode.mode = enabled ? "showing" : "hidden";
    }
  }

, applyVideoTagSizes:function()
  {
    if(this.options.stretching=='fill' && this.videoelement.videoWidth && this.videoelement.videoHeight) //we can make sensible calculations
    {
      var coords = $wh.getCoverCoordinates(this.videoelement.videoWidth, this.videoelement.videoHeight, this.options.width, this.options.height);
      $(this.videoelement).setStyles({ "width": coords.width
                                     , "height": coords.height
                                     , "margin-top": coords.top
                                     , "margin-left": coords.left
                                     });
      return;
    }

    $(this.videoelement).setStyles({ "width": this.options.width
                                   , "height": this.options.height
                                   , "overflow": "hidden"
                                   });
  }

, setupJWPlayer:function()
  {
    if(!this.options.jwplayerbase)
      this.options.jwplayerbase = $wh.getJSAssetPath("jwplayer.js");
    if(!this.options.jwplayerbase)
    {
      console.error("Failed to determine the base url for jwplayer.");
      return;
    }
    this.fixupWidthHeight();

    //As JWPlayer can be annoying with its container (it likes to replace our div)
    //we'll give it a subelement to play with
    this.jwplayerid = 'wh-videomanager-' + (++$wh.VideoManager.seqnr);
    this.container.empty();
    this.container.adopt(new Element('div', { id: this.jwplayerid }));

    //jwplayer options: http://www.longtailvideo.com/support/jw-player/jw-player-for-flash-v5/12536/configuration-options
    var playeroptions =
    {
      flashplayer:       this.options.jwplayerbase + "player.swf",
      file:              this.movieurl,
      streamer:          this.options.streamer,
      controlbar:        this.options.controls ? "bottom" : "none",
      allowfullscreen:   true,
      width:             this.options.width,
      height:            this.options.height,
      repeat:            this.options.loop ? "always" : "",
      allowscriptaccess: "always",
      stretching:        this.options.stretching,
      icons:              false,
      volume:            this.getActualVolume()*100,
      autostart:         this.options.autoplay ? "true" : "false",
      wmode:             "opaque",
      //bufferlength:      bufferLength,
      //jwplayer events: http://www.longtailvideo.com/support/jw-player/jw-player-for-flash-v5/12540/javascript-api-reference#Events
      events:            {onComplete: this.onEnded.bind(this)
                         ,onTime: this.onTimeupdate.bind(this)
        /*, onPlay: this.onPlay.bind(this)
                          onPause: this.onPause.bind(this)
                         , onReady: this.onReady.bind(this)
                         , onComplete: this.onComplete.bind(this)
                         , onTime: this.onTime.bind(this)
                         , onBeforePlay: this.onBeforePlay.bind(this)*/
                         }
    };
    console.log(playeroptions);

    if(this.options.poster)
      playeroptions.image = this.options.poster;

    if(this.options.settings_jwplayer)
    {
      playeroptions = Object.merge(playeroptions, this.options.settings_jwplayer);
      //if(playeroptions["controlbar.position"])
      //  delete playeroptions.controlbar;
    }

    this.jwplayer = jwplayer(this.jwplayerid).setup(playeroptions);
  }

, play:function()
  {
    if (this.isPlaying())
      return;

    if(this.jwplayer)
    {
      try
      {
        this.jwplayer.play();
      }
      catch(e)
      {
        console.log("Ignoring jwplayer play exception from " + this.jwplayerid,e);
      }
    }
    else if(this.videoelement)
    {
      this.videoelement.play();
    }
  }

, onResumedFromPlay:function()
  {
    document.removeEvent('resume', this.onresume);
    this.onresume=null;
    this.onEnded();
  }

, pause:function()
  {
     if(this.jwplayer)
    {
      try
      {
        this.jwplayer.pause(true);
      }
      catch(e)
      {
        console.log("Ignoring jwplayer pause exception from " + this.jwplayerid,e);
      }
    }
     else if(this.videoelement)
       this.videoelement.pause();
  }

, updateVolume:function()
  {
    var setvolume = this.getActualVolume();

    if(this.jwplayer)
    {
      try
      {
        this.jwplayer.setVolume(setvolume*100); // 0 to 100%
      }
      catch(e)
      {
        console.log("Ignoring jwplayer setVolume exception from " + this.jwplayerid,e);
      }
    }
    else if(this.videoelement)
      this.videoelement.volume = setvolume;
  }
, onEnded:function()
  {
    // Execute in delay because flash eats our exceptions
    this.fireEvent.bind(this, 'ended').delay(0);
  }
 ,onTimeupdate: function(ev)
  {
    this.updateCuePoint(this.getCurrentTime().currentTime);

    this.fireEvent.bind(this,'timeupdate').delay(0);
  }

/*
don't use this... do videomanager.addEvent("ended") instead. this kills the videomanagers own ended event.

, setOnEnded:function(onended)
  {
    this.videoelement.removeEvents("ended");
    this.videoelement.addEvent("ended", onended);
  }
*/

, onLoadedMetadata:function(event)
  {
    this.applyVideoTagSizes();
    this.fireEvent("loadedmetadata");
  }

, setLoop:function(loopval)
  {
    if (!this.jwplayer)
    {
      this.videoelement.loop = loopval;
    }
    //how to do this in jwplayer?
  }

, setAutoplay:function(autoplayval)
  {
    if (!this.jwplayer)
    {
      /*
      if (autoplayval)
        this.videoelement.setAttribute("autoplay", "true");
      else
        this.videoelement.removeAttribute("autoplay");
      */
      this.videoelement.autoplay = autoplayval;
      this.options.autoplay = false; // so we don't fire playback ourselves
    }
  }

  /* NOTE: When adding events, make sure you match the HTML5 media event api wherever possible so we can standardize on it
   *       http://www.w3.org/2010/05/video/mediaevents.html
   *       http://www.w3.org/TR/html5/media-elements.html#mediaevents
   */
/* ,onReady: function()
  {
  }

 ,onComplete: function()
  {
    //this.hidePlayer();
//    this.fireEvent("complete");
  }

 ,onBeforePlay: function()
  {
  //  this.showPlayer();
  }

 ,onPlay: function()
  {
    //alert("PLAY");
  }

 ,onPause: function()
  {
    //fall back for if click got through
    //this.player.play();
  }

 ,onTime: function(ev)
  {

  }
/*
 ,hidePlayer: function()
  {
    $(this.containerid).setStyle("visibility","hidden");
    if ($(this.containerid + "_wrapper"))
      $(this.containerid + "_wrapper").setStyle("visibility","hidden");
  }

 ,showPlayer: function()
  {
    $(this.containerid).setStyle("visibility","visible");
    $(this.containerid + "_wrapper").setStyle("visibility","visible");
  }*/

});

$wh.VideoManager.seqnr = 1;

})(document.id); //end mootools wrapper
