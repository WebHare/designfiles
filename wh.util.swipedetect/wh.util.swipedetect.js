/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
/*! LOAD: frameworks.mootools.core, wh.compat.base
!*/

"use strict";

(function($){ //mootools/scope wrapper

if(!window.$wh) window.$wh={};

$wh.SwipeDetect = new Class(
{ Implements: [ Options ]

, options : { threshold_distance : 15, threshold_speed : 0.3 }
, el: null
, initialize: function(el, options)
  {
    this.el = $(el);

    this.setOptions(options);

    if(this.touchEnabled())
    {
      this.el.addEvent("touchstart", this.onTouchStart.bind(this));
      this.el.addEvent("touchmove", this.onTouchMove.bind(this));
      this.el.addEvent("touchend", this.onTouchEnd.bind(this));
    }
  }
, touchEnabled: function()
  {
    return ("createTouch" in document);
  }
, onTouchStart: function(ev)
  {
    this.swipeinfo = { starttime : new Date().getTime()
                     , endtime   : -1
                     , start     : { x : ev.page.x, y : ev.page.y }
                     , end       : { x : ev.page.x, y : ev.page.y }
                     , target    : ev.target
                     , direction : ''
                     }
  }
, onTouchMove: function(ev)
  {
    this.swipeinfo.end = { x : ev.page.x, y : ev.page.y };
  }
, onTouchEnd: function(ev)
  {
    var dx = this.swipeinfo.end.x - this.swipeinfo.start.x;
    var dy = this.swipeinfo.end.y - this.swipeinfo.start.y;

    this.swipeinfo.endtime = new Date().getTime();

    var abs_x = Math.abs(dx);
    var abs_y = Math.abs(dy);

    if(abs_x > this.options.threshold_distance && abs_x / (this.swipeinfo.endtime - this.swipeinfo.starttime) > this.options.threshold_speed)
      this.swipeinfo.direction+= dx > 0 ? 'e' : 'w';

    if(abs_y > this.options.threshold_distance && abs_y / (this.swipeinfo.endtime - this.swipeinfo.starttime) > this.options.threshold_speed)
      this.swipeinfo.direction+= dy > 0 ? 's' : 'n';

    if(this.swipeinfo.direction != '')
      this.el.fireEvent('swipe', this.swipeinfo);
  }

});

})(document.id); //end mootools/scope wrapper
