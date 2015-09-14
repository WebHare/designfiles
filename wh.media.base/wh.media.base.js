/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
/*! REQUIRE: frameworks.mootools.core !*/
if(!window.$wh) window.$wh={};

//ADDME volume and mute separated

(function($) { //mootools wrapper




$wh.CuePoints = new Class(
{ Implements: [Events]
, cuepoints:  []
, currentcuepoint: null

, setCuePoints:function(cuepoints)
  {
    this.cuepoints = cuepoints;
    console.warn("!! updated cuepoints");
    console.log(cuepoints);

    this.currentcuepoint = -1;        // invalidate previous cuepoint to force update
  }

, findCuePointForTime:function(timecode)
  {
    for (var i = this.cuepoints.length-1; i>=0; --i) //cuepoints are sorted in ascending time order
      if(this.cuepoints[i].starttime <= timecode)
        return this.cuepoints[i];

    return null;
  }

, updateCuePoint:function(timecode)
  {
    var newcuepoint = this.findCuePointForTime(timecode);

    // quit if there is no cuepoint change
    if (newcuepoint === this.currentcuepoint)
      return;

    this.currentcuepoint = newcuepoint;

    this.fireEvent("cuepoint", newcuepoint);
  }
});



$wh.VolumeControl = new Class(
{ Implements: [Events]
, volume:1
, cookiename: ''

  /** @param cookiename Name of cookie to use
      @param initialvolume Initial volume setting (0..1) */
, setPersistentCookieName: function(cookiename, initialvolume)
  {
    this.cookiename=cookiename;

    var setting = Cookie.read(this.cookiename);
    if(setting) //extend cookie
      Cookie.write(this.cookiename, setting, {duration: 365});
    var volume = setting && setting.substr(0,2)=='v:' ? setting.substr(2).toFloat() : initialvolume;

    return this.internalSetVolume(volume,true);
  }

, setVolume:function(volume) //explicit set, so store the cookie
  {
    if(this.cookiename)
      Cookie.write(this.cookiename, 'v:'+volume.toFixed(3), {duration: 365});
    return this.internalSetVolume(volume);
  }
, internalSetVolume:function(volume, forceevent)
  {
    volume = Math.min(1,Math.max(0,volume));
    if(this.volume==volume && !forceevent)
      return volume;
    this.volume=volume;
    this.fireEvent("volumechanged", {target:this, volume:volume});
    return volume;
  }
});

$wh.MediaWithVolume = new Class(
{ Implements: [Options]
, options: { globalvolume:true
           , volumecontrol:null
           }

, fade_interval: null
, fade_started:  null
, fade_duration: 0
, fade_from:     0
, fade_to:       0
, fade_stopafter: false

, muted:false
, volume:1
, tempvolume:    1

, initialize:function(options)
  {
    this.setOptions(options);

    if(!this.options.volumecontrol && this.options.globalvolume)
      this.options.volumecontrol = $wh.globalvolume;

    if (this.options.volumecontrol)
      this.volumelistener = this.options.volumecontrol.addEvent("volumechanged", this.onVolumeChange.bind(this));
  }

, destroy:function()
  {
    if(this.volumelistener)
      this.options.volumecontrol.removeEvent("volumechanged", this.volumelistener);
  }

, getActualVolume:function()
  {
    //alert("muted: "+(this.muted?"yes":"no")+" - volume: "+this.volume);

    var setvolume = this.muted ? 0 : this.tempvolume;
    if(this.options.volumecontrol)
      setvolume = setvolume * this.options.volumecontrol.volume;
    return setvolume;
  }

  // returns set volume as a number between 0 and 1
, getVolume:function()
  {
    return this.volume;
  }

  // set the volume as a number between 0 and 1
, setVolume: function(volume)
  {
    this.volume = volume;
    this.cancelFade();
    this.updateVolume();
  }

, setMute: function(mute)
  {
    this.muted = mute;
    this.updateVolume();
  }

, fadeOut: function(duration, stopafterfade)
  {
    if (!duration)
    {
      // Roughly calculate duration to make sure default fade-in/fade-out is equally fast, independent of starting value level
      var min_volume = 100/32768;
      var log = Math.log(this.tempvolume + min_volume);
      duration = Math.max(2500 - 2500 * Math.abs(log / Math.log(min_volume)), 0);
    }
    this.__setupFade(duration, 0, stopafterfade);
  }

, fadeIn: function(duration)
  {
    if (!duration)
    {
      // Roughly calculate duration to make sure default fade-in/fade-out is equally fast, independent of starting value level
      var min_volume = 100/32768;
      var log = Math.log(this.tempvolume / Math.max(this.volume, min_volume) + min_volume);
      duration = Math.max(2500 * Math.abs(log / Math.log(min_volume)), 0);
    }

    /*FIXME: WH: "this.volume" doesn't really work when you want to fade in a sound from the start, e.g. play+fadein if it's not playing.
                 Hence this play() call, not sure if it's wise though

                 In other words, what I want is just do this:

                 sound.fadeIn()

                 when initializing my website. It should then start playing at volume 0 and fade in the sound.
    */
    if (!this.isPlaying())
      this.play(); // still doesn't seem to work though, prob because of the "this.cancelFade();" in play(). Ah well, at least it's playing now :-)

    this.__setupFade(duration, this.volume); // to this.volume
  }

, cancelFade: function()
  {
    // override any fade
    if (this.fade_interval)
    {
      clearInterval(this.fade_interval);
      this.fade_interval = null;
    }

    this.tempvolume = this.volume;
  }

, __fadevolume: function()
  {
    // log-based fade, hears more linearly
    var position = Math.min((new Date().getTime() - this.fade_started) / this.fade_duration, 1);

    // Value to add to the vals before taking log. Workaround for log(0)->-infinity.
    var min_volume = 100/32768;
    this.tempvolume = Math.exp(Math.log(this.fade_from + min_volume) * (1-position) + Math.log(this.fade_to + min_volume) * position) - min_volume;

    // Make sure volumne doesn't get negative
    if (this.tempvolume < 0)
      this.tempvolume = 0;

    this.updateVolume();

    if (position == 1)
    {
      if(this.fade_stopafter)
        this.stop();

      this.cancelFade();
      this.fireEvent("fade_ended");

    }
/*/ Old algorithm, kept for informational purposes
    var volume_diff = this.fade_to - this.fade_from;
    var time_diff = new Date().getTime() - this.fade_started;

    var newvolume, progress;
    if (time_diff > this.fade_duration)
    {
      progress = 1;
      newvolume = this.fade_to;
      this.cancelFade();

      this.fireEvent("fade_ended");
    }
    else
    {
      progress = time_diff / this.fade_duration;
      newvolume = this.fade_from + volume_diff * progress;
    }

    this.tempvolume = newvolume;
    this.updateVolume();
//*/
  }

, updateVolume: function()
  {
    // *DONT* set the volume if we're muted,
    // otherwise SoundManager2 will disable the mute state
    if (this.soundobject && (!this.options.volumecontrol || this.options.volumecontrol.volume>0) )
      this.soundobject.setVolume(this.tempvalue * 100);
  }

, __setupFade: function(duration, fade_to_volume, stopafterfade)
  {
    this.cancelFade();
    this.fade_duration = duration;
    this.fade_started = new Date().getTime();
    this.fade_from = this.tempvolume;
    this.fade_to = fade_to_volume;
    this.fade_interval = this.__fadevolume.bind(this).periodical(100);
    this.fade_stopafter = stopafterfade;
  }

, onVolumeChange:function(event)
  {
    this.updateVolume();
  }
});


$wh.globalvolume = new $wh.VolumeControl;

})(document.id); //end mootools wrapper
