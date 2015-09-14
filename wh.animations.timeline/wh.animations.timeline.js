/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
/*! REQUIRE: frameworks.mootools.core, wh.compat.base !*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

/* animations rows:

   simple row:
     [ { delay: 1, target: '#inhoud_finalblend', from: {"opacity":0}, to: {"opacity":1} ]

     - delay: start delay (defaults to 0)
     - duration: duration of the transition (defaults to 1)
     - target: CSS selector (getElements) relative to the base element
     - from: starting CSS styles (the values to set at t = 0 .. delay)
     - to: limit CSS styles (the values to set at t = delay + duration .. end)
     - onAtStart: executed when passing delay point
     - onAtEnd: executed when passing delay+duration point
     - onStateChange: executed when state changes (after applying transition!)
     - transition: transition override (default is transition from options, which defaults to Fx.Transitions.Sine.easeInOut)

FIXME: which properties to round
ADDME: consider removing timeunit, setting delay and duration in absolute milliseconds but allowing 'playbackrate' as an option


Browser support info
- wh-scale and wh-rotate require IE9+, FF3.5+, CHR, SF3.1+, OP10.5+

*/

$wh.AnimationTimeline = new Class(
{ Implements: [Events, Options]
, baseelement: null
, animations: []
, playing:false
, playbackrate: 1.0
, playback_startposition: 0 // where in the animation to start playback
, currenttime: 0
, framerequest: null // store animation frame request so we can cancel it
, framenr: 0
, options: { timeunit: 1000
           , transition: Fx.Transitions.Sine.easeInOut
           , ie_badopacity: Browser.ie && Browser.version<9
           , skipframes:    0
           }

, initialize: function(el, animations, options)
  {
    this.baseelement=$(el);
    this.setOptions(options);

    for(var i=0;i<animations.length;++i)
    {
      var inrow = animations[i];
      var anirows = this.parseAnimations(inrow);
      this.animations.append(anirows);
    }

    this.cssparser = new Fx.CSS();

    this.pixelratio = window.devicePixelRatio ? Math.round(window.devicePixelRatio) : 1;
    this.usetransforms = $wh.__transform_property != "";
    this.use3dtransforms = (Browser.platform=="ios"); // ==true because the variable might be undefined

    /*
    console.info("new animation timeline");
    console.info("usetransforms: " + (this.usetransforms ? "true" : "false"));
    console.info("use3dtransforms: " + (this.use3dtransforms ? "true" : "false"));
    */
  }
, destroy:function()
  {
    this.stop();
  }
  //returns one or more animation rows
, parseAnimations:function(inrow)
  {
    var anirows=[];

    // we need to differentiate between undefined as value and the property not existing
    // property non-existing -> enabled (default)
    // undefined or false   -> disabled
    // we accept undefined as value because of checks on Mootools's Browser.isie which can be 'undefined'
    if("enabled" in inrow && inrow.enabled === false)
    //if("enabled" in inrow && !inrow.enabled)
      return;

    if(inrow.group)
      return this.parseAnimationGroup(inrow)

    var matches = [];
    if (inrow.target)
    {
      if (typeof inrow.target == "string")
      {
        if (!this.baseelement)
        {
          console.error("Base element required for resolving target '" + inrow.target + "'");
          return []; //not interesting (FIX)
        }
        matches = this.baseelement.getElements(inrow.target);
      }
      else if (typeof inrow.target == "object")
        matches = $$(inrow.target);

      // warn if trying to set a undefined transition (for example a mispelling
      // or case mixup like: Fx.Transition.Back.EaseOut instead of Fx.Transition.Back.easeOut)
      if ("transition" in inrow && typeof inrow.transition === "undefined")
      {
        console.warn("specified transition is undefined.");
        console.log(inrow);
      }

      if(!matches.length)
      {
        console.error("No animation match for target '" + inrow.target + "' in element",this.baseelement);
        return []; //not interesting (FIX)
      }
    }
    else
    {
      if (inrow.from || inrow.to)
      {
        console.error("Missing target for row in element", this.baseelement);
        return []; //not interesting (FIX)
      }
    }

    var delay = typeof inrow.delay == "number" ? inrow.delay : 0
    var duration = typeof inrow.duration == "number" ? inrow.duration : 1

    var ani = { delay: delay
              , duration: duration
              , elements: matches
              , prepared: {}
              , from: inrow.from
              , to: inrow.to
              , units: inrow.units
              , properties: Object.keys(inrow.from||{}).combine(Object.keys(inrow.to||{}))
              , bound: inrow.bound
              , onAtStart: inrow.onAtStart
              , onAtEnd: inrow.onAtEnd
              , onStateChange: inrow.onStateChange
              , transition: inrow.transition
              , ie_opacity: inrow.ie_opacity
              , lastposition: -1
              , hooksetstyles: inrow.hooksetstyles
              };

    if(ani.ie_opacity && !["floor","ceil","round"].contains(ani.ie_opacity))
      console.error("Invalid value for ie-opacity: '" +ani.ie_opacity + "'");
    if(ani.loops > 1)
      return this.loopAnimation(ani, ani.duration);
    return [ani];
  }
, loopAnimation:function(anirow, iterationduration)
  {
    //ADDME simply create them once...
    var anis = [];
    for (var i=0;i<anirow.loops;++i)
    {
      var clone = Object.clone(anirow);
      clone.delay += iterationduration*i;
      anis.push(clone);
    }
    return anis;
  }
, getGroupDuration:function(inrows)
  {
    var longest = 0;
    for(var i=0;i<inrows.length;++i)
      longest=Math.max(longest, inrows[i].delay + inrows[i].duration);
    return longest;
  }
, parseAnimationGroup:function(inrow)
  {
    var anirows = [];
    for(var i=0;i<inrow.group.length;++i)
      anirows.append(this.parseAnimations(inrow.group[i]));

    if(typeof inrow.timestretch == "number")
      anirows.each(function(row) { row.duration *= inrow.timestretch;
                                   row.delay *= inrow.timestretch;
                                 });

    if(typeof inrow.transition == "function")
      anirows.each(function(row)
        {
          // use the (global) transition defined on the group if the row doesn't have it's own transition
          if (!("transition" in row))
          {
            row.transition = inrow.transition
          }
        });

    if(inrow.loops>1)
      var groupduration = this.getGroupDuration(anirows);

    if(typeof inrow.delay == "number")
      anirows.each(function(row) { row.delay += inrow.delay });

    if(inrow.loops>1)
    {
      var numtoloop=anirows.length;
      for (var i=0;i<inrow.loops;++i)
        for (var j=0;j<numtoloop;++j)
        {
          var clone = Object.clone(anirows[j]);
          clone.delay += groupduration*i;
          anirows.push(clone);
        }
    }

    return anirows;
  }
  //reset sets all items to their starting locations, including any items which had a delay.
, reset:function()
  {
    cancelAnimationFrame(this.framerequest);
    this.framerequest = null;

    this.playing=false; //stop any animation
    this.currenttime=0;
    this.playbackrate=1;
    this.updateToState(0, true, false);
  }
, rewind:function()
  {
    cancelAnimationFrame(this.framerequest);
    this.framerequest = null;

    this.playing=false; //FIXME should we do that?
    this.currenttime=0;
    this.updateToState(0, false, false);
  }
, play:function()
  {
    this.playFrom(0);
  }
, playFrom: function(timeoffset)
  {
    for(var i=0;i<this.animations.length;++i)
      this.animations[i].iscomplete=false;

    this.playback_startposition = timeoffset * 1000;

    this.starttime = new Date-0;
    this.starttimeoffset = this.currenttime;
    this.playing = true;

    if (!this.framerequest)
      this.framerequest = requestAnimationFrame(this.animationTick.bind(this));
  }
, stop:function()
  {
    cancelAnimationFrame(this.framerequest);
    this.playing=false;
  }
, setPlaybackRate:function(newrate)
  {
    if(this.playing)
    {
      //reset the starttime for the calculations
      this.starttimeoffset = this.getCurrentRelTime();
      this.starttime = new Date-0;
    }
    this.playbackrate = newrate;
  }
, getCurrentRelTime:function()
  {
    return this.starttimeoffset + (new Date - this.starttime) * this.playbackrate;
  }
, animationTick:function()
  {
    if(!this.playing)
      return;


    // frameskip
    this.framenr++;
    if (this.options.skipframes > 0 && this.framenr % (this.options.skipframes+1) != 1)
    {
      this.framerequest = requestAnimationFrame(this.animationTick.bind(this));
      return;
    }


    this.currenttime = this.getCurrentRelTime();

    if(!this.updateToState((this.currenttime + this.playback_startposition)/this.options.timeunit, false, true))
    {
      this.playing=false;
      this.fireEvent("ended");
      return;
    }

    this.framerequest = requestAnimationFrame(this.animationTick.bind(this));
  }
, prepareTransition:function(prop,from,to)
  {

  }
  //update all elements to the specified relative time position ( = absolute time / duration)
, updateToState:function(reltime, reset, fireevents)
  {
    //console.log("updateToState", reltime);

    var anyunfinished=false;
    var havereset=[];

    for(var i=0;i<this.animations.length;++i)
    {
      var ani=this.animations[i];

      var anireltime = reltime - ani.delay;

      //Are we done with this one yet?
      if(!reset)
      {
        //Where are we on the timeline?
        var beforeanimation = anireltime < 0;
        var afteranimation = anireltime > ani.duration;

        if(ani.iscomplete)
          continue;

        if(this.playbackrate > 0 ? afteranimation : beforeanimation)
          ani.iscomplete=true;
        else
          anyunfinished=true;

        if(this.playbackrate > 0 ? beforeanimation : afteranimation)
          continue; //not playing yet
      }

      // for normal playback (we don't want to fire events during a reset or rewind)
      if (fireevents)
      {
        // Get the last animation time. ADDME: now defaults to 0 (absolute time), something with explicit start at some time?
        var lastreltime = ani.lastreltime || -ani.delay;

        //Fire onAtStart when the delay point has passed, and onAtEnd when the delay+duration point has passed
        var lastbeforeanimation = lastreltime < 0;
        var lastafteranimation = lastreltime > ani.duration;

        if ((lastbeforeanimation != beforeanimation) && ani.onAtStart)
          ani.onAtStart();
        if ((lastafteranimation != afteranimation) && ani.onAtEnd)
          ani.onAtEnd();
      }
      ani.lastreltime = anireltime;


      //FIXME should we support transition that keep doing 'something' after the duration has expired?

      // check how far in time we have progressed (0 to 1)
      var progress = anireltime <= 0 ? 0 : anireltime >= ani.duration ? 1 : anireltime/ani.duration;
      if(progress<0)
        progress=0;
      else if(progress>1)
        progress=1;

      // use a transition timing function for things like easing, bounce and back effects
      var transition = ani.transition || this.options.transition;
      var state = transition(progress);

      if(state==ani.laststate)
        continue; //nothing changed
      ani.laststate=state;

      // Fire onStateChange when present, the state has changed
      if (ani.onStateChange)
        ani.onStateChange(state);

      if (ani.elements.length)
      {
        var setstyles={};
        if(ani.from || ani.to)
        {
          //ADDME should we really bother with interpolation or just set directly if state <0 or state > 1?

          //Interpolation needed (ADDME: what if from/to are incomplete? what _would_ you expect? we could either a) ignore, or b) use the current value as starting value (which may be different for every targeted element)
          for (var propertyidx = 0; propertyidx < ani.properties.length; ++propertyidx)
          {
            var field = ani.properties[propertyidx];
            var fromval = ani.from && ani.from[field];
            var toval = ani.to ? ani.to[field] : undefined;
            var unit = ani.units ? ani.units[field] : undefined;


            // Convert legacy names
            if (field == '-wh-left')
              field = 'wh-left';

            if (field == '-wh-top')
              field = 'wh-top';

            if (field == '-wh-scale')
              field = 'wh-scale';
            /////////////////////////


            // for browsers without transform support fall back to left/top
            if (!this.usetransforms && !this.use3dtransforms)
            {
              if (field=="wh-left")
                field = "left";

              if (field=="wh-top")
                field = "top";
            }

            if(typeof toval!='undefined') //we can transition
            {
              if (typeof fromval == 'undefined')
              {
                ani.defaults = ani.defaults || {};
                fromval = ani.defaults[field];
                if (typeof fromval == 'undefined')
                {
                  // Get the current value from CSS (parse transforms if needed)
                  if (field == 'wh-left' || field == "wh-top")
                  {
                    // Transform: get from translate[XX](left,top[,XXX]), by splitting on ')', then ',' (value in pixels)
                    if (this.use3dtransforms || this.usetransforms)
                      fromval = ((ani.elements[0].style[$wh.__transform_property].split('(')[1]||'').split(',')[field == "wh-left"?0:1]||'0')+'px';
                    else
                      fromval = ani.elements[0].getStyle(field=="wh-left"?"left":"top");
                  }
                  else
                    fromval = ani.elements[0].getStyle(field);

                  ani.defaults[field] = fromval;
                }
              }

              if(!ani.prepared[field])
                ani.prepared[field] = { from: this.cssparser.parse(fromval), to: this.cssparser.parse(toval) };

              setval = this.cssparser.serve(this.cssparser.compute(ani.prepared[field].from, ani.prepared[field].to, state));

              // work around Mootools bug in which Mootools set an invalid value
              // for the CSS property due to a scientific notation of very small numbers
              // FIXME: only the first value or all values or only do this for known properties/parameters??
              if (setval[0] < 0.000001 && setval[0] > -0.000001)
                setval[0] = 0;
            }
            else
            {
              var setval = fromval;
            }

            if(field=='opacity' && this.options.ie_badopacity && ani.ie_opacity)
            {
              if(ani.ie_opacity == 'floor')
                setval=Math.floor(setval);
              else if(ani.ie_opacity == 'ceil')
                setval=Math.ceil(setval);
              else if(ani.ie_opacity == 'round')
                setval=Math.round(setval);
            }

            if (field=='left' || field=='top' || field=='right' || field=='bottom' || field=='wh-left' || field=='wh-top')
            {
              if (this.pixelratio == 1)
                setval = Math.round(setval[0]);
              else
                setval = Math.round(setval[0] * this.pixelratio) / this.pixelratio;
            }

            if(ani.bound && typeof ani.bound[field] != undefined)
            {
              var bounds = ani.bound[field];
              setval = Math.min(Math.max(setval,bounds[0]),bounds[1]);
            }

            setstyles[field] = unit ? setval + unit : setval;
          }

          // does the user want to read or manipulate the style we apply?
          // (for example to make things happen based on the position of an element
          // or make an animation wrap by using setstyles.left%=1280 in the callback)
          if (ani.hooksetstyles)
            ani.hooksetstyles(setstyles);
        }


        // keep administration on left/top/scale for each element so we can later
        // consolidate them to a transform property/value
        // we have to do this for each elements, because otherwise we would lose state
        // if we animate on of the wh- properties and later animate another
        var elcount = ani.elements.length;
        for(var idx = 0; idx < elcount; idx++)
        {
          var el = ani.elements[idx];
          if (!el._wh_pos)
            el._wh_pos = { changed: false, left: null, top: null, scale: 1, rotate: 0 };

          if ("wh-left" in setstyles)
          {
//console.log( setstyles["wh-left"] );
            el._wh_pos.left = setstyles["wh-left"]; // we already converted our value to a rounded number
            el._wh_pos.changed = true;
          }
          if ("wh-top" in setstyles)
          {
            el._wh_pos.top = setstyles["wh-top"]; // we already converted our value to a rounded number
            el._wh_pos.changed = true;
          }
          if ("wh-scale" in setstyles)
          {
            el._wh_pos.scale = setstyles["wh-scale"][0];
            el._wh_pos.changed = true;
          }

          if ("wh-rotate" in setstyles)
          {
            el._wh_pos.rotate = setstyles["wh-rotate"][0];
            el._wh_pos.changed = true;
          }

        }
        delete setstyles["wh-left"];
        delete setstyles["wh-top"];
        delete setstyles["wh-scale"];
        delete setstyles["wh-rotate"];



        if(reset)
        {
          var usetransforms = this.usetransforms;
          var use3dtransforms = this.use3dtransforms;

          ani.elements.each(function (el)
            {
              // for the reset we use the first rule with instructions for an element.
              // so if you're animation different properties in different rows (for different times/duration/..)
              // you must make an rule above all other rows for that element for the reset
              if(havereset.indexOf(el) != -1)
                return;
              havereset.push(el);

              var wh_pos = el._wh_pos;
              if (wh_pos && wh_pos.changed && !this.options.ie_badopacity)//old ie (ie_badopacity) doesn't support transform
              {
                // cannot pass the transform through Mootool's setStyles
                var transformstr = "";

                if (use3dtransforms)
                  transformstr += " translate3D("+(wh_pos.left ? wh_pos.left : 0).toFixed(4)+"px,"+(wh_pos.top ? wh_pos.top : 0).toFixed(4)+"px,0)";
                else// if (usetransforms)
                  transformstr += " translate("+(wh_pos.left ? wh_pos.left : 0).toFixed(4)+"px,"+(wh_pos.top ? wh_pos.top : 0).toFixed(4)+"px)";

                if (wh_pos.rotate != 0)
                  transformstr += " rotate("+wh_pos.rotate.toFixed(4)+"deg)";

                if (wh_pos.scale != 1)
                  transformstr += " scale("+wh_pos.scale.toFixed(4)+")";

                // NOTE: we cannot pass the transform through Mootool's setStyles
                el.style[$wh.__transform_property] = transformstr;

                wh_pos.changed = false;
              }

              el.setStyles(setstyles);
            }.bind(this));
        }
        else
        { //no need to track elements we updated - double specification is your risk.

          var wh_pos = el._wh_pos;
          if (wh_pos && wh_pos.changed)
          {
            var transformstr = "";

            if (use3dtransforms)
              transformstr += " translate3D("+(wh_pos.left ? wh_pos.left : 0).toFixed(4)+"px,"+(wh_pos.top ? wh_pos.top : 0).toFixed(4)+"px,0)";
            else// if (usetransforms)
              transformstr += " translate("+(wh_pos.left ? wh_pos.left : 0).toFixed(4)+"px,"+(wh_pos.top ? wh_pos.top : 0).toFixed(4)+"px)";

            if (wh_pos.rotate != 0)
              transformstr += " rotate("+wh_pos.rotate.toFixed(4)+"deg)";

            if (wh_pos.scale != 1)
              transformstr += " scale("+wh_pos.scale.toFixed(4)+")";

            // NOTE: we cannot pass the transform through Mootool's setStyles
            if (this.use3dtransforms)
              ani.elements.each( function(node) { node.style[$wh.__transform_property] = transformstr; } );
            else if (this.usetransforms)
              ani.elements.each( function(node) { node.style[$wh.__transform_property] = transformstr; } );

            wh_pos.changed = false;
          }

          ani.elements.setStyles(setstyles);
        }

      } // ani.length
    } // animations

    return anyunfinished;
  }
});

$wh.AnimationTimeline.setDefaultOptions = function(options)
{
  if(options.timeunit >= 1)
    $wh.AnimationTimeline.prototype.options.timeunit = options.timeunit;
}

})(document.id); //end mootools wrapper
