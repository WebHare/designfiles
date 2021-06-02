/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! LOAD: frameworks.mootools, wh.compat.base
!*/


(function($) { //mootools wrapper
"use strict";

// All modern browsers (and IE9+)
$wh.CSSTransitionManager = new Class(
{ Implements: [ Options, Events ]
, options:
      { onended:            null
      }

, node:          null
, tprops:        [] // transitioning properties

, poller:        null
, transitiondelay: null // FIXME: stupid name
, hasfired:      false
, isrunning:     false
, duration:      0
, queue:         [] //queued triggerTransitions
//, computedstyle: {}

, initialize: function(node, options)
  {
    this.node = node;
    this.setOptions(options);

    if (this.node.addEventListener)
    {
      this.node.addEventListener("webkitTransitionEnd", this.onTransitionEnd.bind(this), false);
      this.node.addEventListener("transitionend", this.onTransitionEnd.bind(this), false);
    }
  }

, cancelAll: function()
  {
    if (!this.isrunning)
      return;

    this.queue = [];
    this.isrunning = false;
    clearTimeout(this.poller); // clear the timer which forces the transitionEnd in case we go beyond the expected duration for the transition
    clearTimeout(this.transitiondelay);
    $wh.updateUIBusyFlag(-1);
  }

, triggerTransition: function(trigger_cssclass_or_code)
  {
    if(this.isrunning)
    {
      this.queue.push(this.triggerTransition.bind(this, trigger_cssclass_or_code));
      return;
    }

    this.isrunning=true;
    $wh.updateUIBusyFlag(+1);
    this.doRunTransition(trigger_cssclass_or_code);
  }

, triggerTransitionDelayed: function(trigger_cssclass_or_code,delay)
  {
    if(this.isrunning)
    {
      this.queue.push(this.triggerTransitionDelayed.bind(this, trigger_cssclass_or_code, delay));
      return;
    }

    this.isrunning=true;
    $wh.updateUIBusyFlag(+1);
    this.transitiondelay = this.doRunTransition.delay(delay, this, trigger_cssclass_or_code);
  }

, doRunTransition: function(trigger_cssclass_or_code)
  {
    /*
    - onTransitionEnd is not fired if the property value doesn't change, even though the property is specified as transition property
    - During a CSS transition, getComputedStyle returns the original property value in Firefox, but the final property value in WebKit.

    Therefore, since we cannot compare the start and finish values we also need to do a check on a timer
    (after the duration when we expect the transition to finish whe'll start polling whether the transition is ready)

    // https://developer.mozilla.org/en-US/docs/Web/API/window.getComputedStyle
    // ...During a CSS transition, getComputedStyle returns the original property value in Firefox, but the final property value in WebKit.
    */

    this.hasfired = false; // rearm

    if ((typeof trigger_cssclass_or_code) == "string")
      this.node.addClass(trigger_cssclass_or_code);
    else
      trigger_cssclass_or_code();

    if (window.getComputedStyle)
    {
      var style_to = window.getComputedStyle( this.node );
      //this.computedstyle = style_to;

      /*
      console.log(style_to.transitionProperty);
      console.log(style_to.transitionDuration);
      console.log(style_to.transitionDelay);
      */

      var tprops     = style_to.transitionProperty ? style_to.transitionProperty.split(", ") : [];
      var tdurations = style_to.transitionDuration ? style_to.transitionDuration.split(", ") : [];
      var tdelays    = style_to.transitionDelay ? style_to.transitionDelay.split(", ") : [];
    }
    else
    {
      var tprops     = [];
      var tdurations = [];
      var tdelays    = [];
    }

    //console.log(tprops, tdurations);

    var props = [];
    var transition_total_length = 0;
    for(var tel=0; tel < tprops.length; tel++)
    {
      if (tprops[tel] == "none")
        continue;

      var duration_val = parseFloat(tdurations[tel]);
      if (tdurations[tel].substr(-1) == "s")
        duration_val *= 1000;

      var delay_val = parseFloat(tdelays[tel]);
      if (tdelays[tel].substr(-1) == "s")
        delay_val *= 1000;

      var total = delay_val + duration_val;

      if (total > transition_total_length)
        transition_total_length = total;

      props.push({ name:     tprops[tel]
                 , duration: duration_val
                 , delay:    delay_val
                 , total:    total
                 , active:   true
                 });
    }

    this.tprops = props;

    if (this.options.debug)
    {
      console.log({ tprops: tprops
                  , tduration: tdurations
                  , tdelays:   tdelays
                  });

      console.log("Transition will take", transition_total_length, "milliseconds");
    }

    this.duration = transition_total_length;

    if (transition_total_length == 0)
    {
      if (this.options.debug)
        console.info("No transition.");
      this.onFinish();
    }
    else //we are running a transition
    {
      this.poller = this.forceOnFinish.delay(transition_total_length + 250, this);
    }
  }

, forceOnFinish: function()
  {
    //console.log("[$wh.TransitionManager] force onFinish()")
    this.onFinish();
  }

, onFinish: function()
  {
    if (!this.hasfired)
    {
      clearTimeout(this.poller);
      this.hasfired = true;

      if (this.options.onended)
        this.options.onended();
    }
    if(this.isrunning) //we were registered as actually running
    {
      this.isrunning=false;
      $wh.updateUIBusyFlag(-1);

      if(this.queue.length) //run next action
      {
        var torun = this.queue[0];
        this.queue.splice(0,1); //remove front item
        torun();
      }
    }
  }

, onTransitionEnd: function(evt)
  {
    var prop_wait_count = 0;
    var busyprops = [];
    for (var tel = 0; tel < this.tprops.length; tel++)
    {
      var prop = this.tprops[tel];

      if (prop.name == evt.propertyName)
        prop.active = false;

      if (prop.active)
      {
        prop_wait_count++;
        busyprops.push(prop.name);
      }
    }

    if (prop_wait_count==0)
    {
      //console.log("transition ended");
      this.onFinish();
    }
    //else
    //  console.log("properties still transitioning: "+busyprops.join(", "));
  }
});

})(document.id); //end mootools wrapper
