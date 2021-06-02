/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.util.preloader');
require ('../mediaplayers.soundmanager');
require ('../wh.media.base');
/*! REQUIRE: frameworks.mootools, wh.util.preloader, mediaplayers.soundmanager, wh.media.base !*/

/*
Supported events:
- ended      -> playback of the sample has finished
- fade_ended -> fade in/out effect has finished
*/

(function($) { //mootools wrapper

$wh.AudioManager = new Class(
{ Implements: [$wh.PreloadableAsset]
, soundidctr: 1
, webaudiocontext: null

, options: { autoload: false
           , soundmgrbase: ''
           , method: ''
           , debug: false
           }
, playsm4a:null

, initialize:function(options)
  {
    this.setOptions(options);

    if(!this.options.method)
      this.options.method = (window.AudioContext || window.webkitAudioContext) ? "webaudio"
                            : (Browser.Platform.ios) ? 'html5'
                            : 'soundmgr2';

    if(this.options.method == 'soundmgr2' && !this.options.soundmgrbase)
    {
      var soundmanagerurl = $$('script[src*="soundmanager2"]').pick().getAttribute('src');
      var urlparts=soundmanagerurl.split('?')[0].split('/');
      this.options.soundmgrbase = urlparts.slice(0,urlparts.length-1).join('/')+'/';
    }
    if(this.options.method == 'webaudio')
    {
      this.webaudiocontext = window.AudioContext ? new window.AudioContext : new window.webkitAudioContext;
    }
    if(this.options.debug)
      console.log("[audiomgr] Selected audio method: " + this.options.method);
  }

, getAllowsM4A:function()
  {
    if(this.options.method == 'webaudio')
    {
      if (Browser.firefox && Browser.Platform.mac)
        return false; // currently the Mac version of Firefox doesn't support MP3/AAC/MP4 yet
      else
        return true;
    }

    if(this.options.method == 'soundmgr2')
    {
      if(!soundManager)
        console.warn("Invoking allowsM4A() before soundManager load is complete will give incorrect results");
      else
        return !!soundManager.canPlayMIME("audio/m4a");
    }

    return !!(Browser.Platform.ios || Browser.Platform.android);
  }

, allowsM4A:function()
  {
    if(this.playsm4a===null)
      this.playsm4a = this.getAllowsM4A();
    return this.playsm4a;
  }

, onStartPreload:function()
  {
    if(this.options.method == 'soundmgr2')
    {
      //we -must- install it as window.soundManager (ADDME deal with duplicate loads - simply share the instance)
      // FIXME: soundmanager2 already instances itself too, unless you use window.SM2_DEFER = true
      soundManager = new SoundManager;
      soundManager.setup({ url:this.options.soundmgrbase
                         , flashVersion:9
                         , onready: this.soundmgrReady.bind(this)
                         , 'flashLoadTimeout': 15000 // else soundManager will fail if loading is slow (when used in a preloader this will happen often due to many resource loading at once)
                         });
      soundManager.beginDelayedInit();
    }
    else if (this.options.method=='html5' || this.options.method=='webaudio' )
    {
      this.donePreload(true);
    }
  }

, soundmgrReady:function()
  {
    this.donePreload(true);
  }

, createSound:function(url, options)
  {
    return new $wh.AudioManager.Sound(this, url, options);
  }
});


$wh.AudioManager.Sound = new Class(
{ Extends: $wh.MediaWithVolume
, Implements: [$wh.PreloadableAsset, Events]
, options: { autoload: false
           , startoffset: 0
           , loop: false
           , debug: null
           , name: null
           }

, audiomgr: null
, name: ''
, url: ''
, webaudiobuffer: null
, webaudiogain: null
, webaudiosource: null
, starttime: null /// Starttime of the sound (as if it were started at position 0s)
, resumeoffset: null
, playing: false /// For html5/webaudio api, whether we're playing

, initialize:function(audiomgr, url, options)
  {
    this.parent(options);
    this.audiomgr=audiomgr;
    this.url=url;

    this.name = this.options.name || this.url.split('/').slice(-1)[0];

    if(this.options.debug === null)
      this.options.debug = this.audiomgr.options.debug;

    if(this.options.autoload)
      this.startPreload();
  }

, onStartPreload:function()
  {
    //ADDME wh preloader should implement dependency support itself, saves us a few objects
    new $wh.Preloader([this.audiomgr], { onComplete:this.loadSound.bind(this) });
  }

, loadSound:function()
  {
    if(this.audiomgr.options.method == 'soundmgr2')
    {
      this.id = 'snd' + (this.audiomgr.soundidctr++);
      this.soundobject = window.soundManager.createSound({id: this.id
                                                         ,url: this.url
                                                         ,autoLoad: true
                                                         ,onload:   this.gotSound.bind(this,true)
                                                         ,onfinish: this.onFinish.bind(this)
                                                         ,volume: this.getActualVolume()*100
                                                         });
    }
    else if(this.audiomgr.options.method == 'html5')
    {
      this.soundobject = new Element("audio", {src:this.url
//                                              ,preload: 'auto'
                                              });
      this.gotSound(true); //FIXME deal with non existing URLs, but how?

      if (Browser.firefox)
        this.soundobject.addEventListener('ended', this.firefoxFixLoops.bind(this));
    }
    else if(this.audiomgr.options.method == 'webaudio')
    {
      // Safari has createGainNode, Chrome & spec createGain
      var creategainfunc = this.audiomgr.webaudiocontext.createGain || this.audiomgr.webaudiocontext.createGainNode;
      if (!creategainfunc)
        throw "Your browser does not support Web Audio api far enough - no Gain node";

      this.webaudiogain = creategainfunc.bind(this.audiomgr.webaudiocontext)();
      this.webaudiogain.connect(this.audiomgr.webaudiocontext.destination);

      var request = new XMLHttpRequest();
      request.open('GET', this.url, true);
      request.responseType = 'arraybuffer';
      request.addEventListener('load', function(event)
        {
          this.audiomgr.webaudiocontext.decodeAudioData(request.response,
            function(buffer)
              {
                this.webaudiobuffer = buffer;
                this.donePreload(true);
              }.bind(this),
            this.donePreload.bind(this, false));
        }.bind(this));
      request.addEventListener('error', this.donePreload.bind(this, false));
      request.send();
      return;
    }

    if (!this.soundobject)
      console.error("Failed to create sound object");
  }

, updateVolume:function()
  {
    var setvolume = this.getActualVolume();
    if(this.options.debug)
      console.log("[audiomgr] " + this.name + ": Set volume: " + setvolume);

    switch (this.audiomgr.options.method)
    {
      case "soundmgr2":
        {
          try
          {
            this.soundobject.setVolume(setvolume*100);
          }
          catch(e)
          {
            console.log("Ignoring soundobject exception from " + this.id,e);
          }
        } break;
      case "html5":
        {
          this.soundobject.volume = setvolume;
        } break;
      case "webaudio":
        {
          this.webaudiogain.gain.value = setvolume
        } break;
    }
  }

, gotSound:function(success)
  {
    // Execute in delay because flash eats our exceptions. (and without flash, we want the API to be equivalent in behaviour, so delay)
    this.donePreload.bind(this, success).delay(0);
  }

, onFinish: function()
  {
    // Execute in delay because flash eats our exceptions
    this.fireEvent.bind(this, "ended").delay(0);
  }

, firefoxFixLoops: function(event)
  {
    if (this.isPlaying() && this.options.loop)
      this.soundobject.currentTime = 0;
  }

, isPlaying:function() //note, also true if we're still buffering, false if we have paused
  {
    if (!this.isPreloaded())
      return false;

    switch (this.audiomgr.options.method)
    {
      case "soundmgr2":
        {
          return this.soundobject && this.soundobject.playState == 1 && !this.soundobject.paused;
        } break;
      case "html5":
      case "webaudio":
        {
          return this.playing;
        } break;
    }
    return false;
  }

, play:function()
  {
    if(!this.preloadstatus)
    {
      console.error("Invoking play on soundobject before starting preload",this);
      return false;
    }
    if(this.preloadstatus && !this.preloadstatus.done)
    {
      console.error("Invoking play on soundobject before giving it a chance to complete loading",this);
      return false;
    }
    if(this.preloadstatus && !this.preloadstatus.success)
    {
      //you invoked a failed sound. as we don't know its duration, we'll just head straight for onFinish (ADDME: if we had the duration, we could fake play events)
      this.onFinish();
      return;
    }

    if(this.isPlaying())
    {
      if(this.options.debug)
        console.log("[audiomgr] " + this.name + ": Ignoring play(), already playing");
      return;
    }

    this.cancelFade();

    if(this.options.debug)
      console.log("[audiomgr] " + this.name + ": play (loop=" + (this.options.loop?1:0) + ")");

    switch (this.audiomgr.options.method)
    {
      case "soundmgr2":
        {
          var settings = {};
          if(this.options.loop)
            settings.loops = 999999999;

          this.soundobject.play(settings);
          this.playing = true;
        } break;
      case "html5":
        {
          this.soundobject.loop = this.options.loop;
          this.soundobject.play();
          this.playing = true;
        } break;
      case "webaudio":
        {
          this.startWebAudio(this.options.startoffset);
        } break;
    }
    return true;
  }

, stop:function()
  {
    if(!this.playing)
    {
      if(this.options.debug)
        console.log("[audiomgr] " + this.name + ": stop() received but already stopped");
      return;
    }
    if(this.options.debug)
      console.log("[audiomgr] " + this.name + ": stop");

    this.playing = false;
    switch (this.audiomgr.options.method)
    {
      case "soundmgr2":
        {
          this.soundobject.stop();
        } break;
      case "html5":
        {
          this.soundobject.currentTime = 0;
          this.soundobject.pause();
        } break;
      case "webaudio":
        {
          this.resumeoffset = (this.options.startoffset + this.audiomgr.webaudiocontext.currentTime - this.starttime) % this.webaudiobuffer.duration;
          if(this.webaudiosource)
            this.webaudiosource.disconnect();
          this.webaudiosource = null;
        } break;
    }
  }

, pause:function()
  {
    if (this.isPlaying())
    {
      if (this.soundobject)
      {
        this.soundobject.pause();
        this.playing = false;
      }
      if (this.webaudiosource)
        this.stop();
    }
  }

, resume:function()
  {
    if (!this.isPlaying())
    {
      switch (this.audiomgr.options.method)
      {
        case "soundmgr2":
          {
            this.soundobject.resume();
            this.playing = true;
          } break;
        case "html5":
          {
            this.soundobject.play();
            this.playing = true;
          } break;
        case "webaudio":
          {
            this.startWebAudio(this.resumeoffset || 0);
          } break;
      }
    }
  }

, startWebAudio: function(offset)
  {
    this.webaudiosource = this.audiomgr.webaudiocontext.createBufferSource();

    this.webaudiosource.buffer = this.webaudiobuffer;
    this.webaudiosource.connect(this.webaudiogain);
    this.webaudiosource.loop = !!this.options.loop;

    this.starttime = this.audiomgr.webaudiocontext.currentTime - offset;

    if (this.webaudiosource.start)
      this.webaudiosource.start(this.audiomgr.webaudiocontext.currentTime, offset);
    else
    {
      // Ipad 3: if offset + duration > buffer.duration, offset isn't honored correctly!
      this.webaudiosource.noteGrainOn(this.audiomgr.webaudiocontext.currentTime, offset, this.webaudiobuffer.duration - offset);
    }
    this.playing = true;
  }
});

})(document.id); //end mootools wrapper
