/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.util.swipedetect');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.util.swipedetect
!*/

"use strict";

(function($){ //mootools/scope wrapper

if(!window.$wh) window.$wh={};

//scroller for a horizontal or vertical list of items
/*
  Example html:
    <div id="thumblist" class="wh-slideshow-scroller">
      <ul class="wh-slideshow-scroller-content">
        [forevery pictures]<li title="[title]"><img src="[thumb]" alt="[title]" /></li>[/forevery]
      </ul>
    </div>
*/

$wh.ThumbScroller = new Class(
{ Implements: [ Options ]
, container: null      //main container (viewport with overflow hidden)
, listnode: null       //wrapper of all items
, dragreference: null
, viewport: null       //size of container
, axis: 'x'            //x or y axis (horizontal or vertical)
, position: null       //scrolloffset
, listsize: null       //size of listnode (= totalsize items)
, activeindex: -1      //if click set index to selected item no.
, items: []
, options: { autoscroll : 0   //scrollspeed (> 0) on mouseover (0 = disable)
           , autoscrollmax: 5   //max relative px offset (scrollspeed limitor)
           }
, hoverreference: null //if autoscroll center position of container
, scrolltimer: null

, initialize: function(container, options)
  {
    this.container = container;
    this.listnode = this.container.getElement('.wh-slideshow-scroller-content');
    this.items = this.listnode.getChildren();

    this.setOptions(options);

    $(window).addEvent('load', this.onLoad.bind(this));//Wait after load to get correct sizes after rendering
  }

, onLoad: function()
  {
    this.listnode.addEvent('mousedown', this.onDragStart.bind(this));
    this.listnode.addEvent('mousemove', this.onMove.bind(this));
    $(document.body).addEvent('mouseup', this.onDragEnd.bind(this));
    this.listnode.addEvent('mouseout', this.onMouseOut.bind(this));

    $(window).addEvent('resize', this.onResize.bind(this));

    this.onResize();

    if("createTouch" in document)
    {
      this.listnode.addEvent("touchstart", this.onDragStart.bind(this));
      this.listnode.addEvent("touchmove", this.onMove.bind(this));
      this.listnode.addEvent("touchend", this.onDragEnd.bind(this));
    }

    new $wh.SwipeDetect(this.listnode,{enablemouseswipe:true});
    this.listnode.addEvent('swipe', this.onSwipe.bind(this));
  }

, onMouseOut: function()
  {
    this.stopAutoScroll();
  }

, stopAutoScroll: function()
  {
    this.hoverreference = null;
    if(this.scrolltimer)
      cancelAnimationFrame(this.scrolltimer);
  }

, next: function()
  {//move content left/up
    this.listnode.addClass('swipe');//animate
    this.listnode.clientWidth;

    this.setRelativePosition(-1*this.viewport[this.axis]);
  }

, previous: function()
  {//move content right/down
    this.listnode.addClass('swipe');//animate
    this.listnode.clientWidth;

    this.setRelativePosition(this.viewport[this.axis]);
  }

, onSwipe: function(ev)
  {
    this.stopAutoScroll();

    this.listnode.addClass('swipe');//animate
    this.listnode.clientWidth;

    //move 0.5 of viewport size
    this.setPosition(this.position[this.axis] + (this.viewport[this.axis]*0.5 * (ev.direction == 'w' || ev.direction == 'n' ? -1 : 1) ));
  }

, jumpTo: function(i, animate)
  {
    this.listnode.toggleClass('swipe',animate);
    this.listnode.clientWidth;

    var itemcount = this.items.length;
    if(!itemcount)
      return;

    if(i < 0)
      i = 0;
    else if(i > itemcount)
      i = itemcount - 1;

    this.items.removeClass('active');
    this.items[i].addClass('active');

    if(this.activeindex == i)
      return;

    if(this.listsize[this.axis] > this.viewport[this.axis])
    {
      var itempos = this.items[i].getPosition(this.listnode);
      var itemsize = this.items[i].getSize();

      var centeroffset = this.viewport[this.axis]*0.5 - Math.round(itemsize[this.axis]*0.5);

      this.setPosition(centeroffset - itempos[this.axis]);
    }
  }

, setPosition(pos)
  {
    var prevpos = this.position[this.axis];
    this.position[this.axis] = pos;
    if(this.position[this.axis] > 0)
    {
      this.position[this.axis] = 0;
    }
    else
    {
      var minpos = this.viewport[this.axis] - this.listsize[this.axis];
      if(this.position[this.axis] < minpos)
        this.position[this.axis] = minpos;
    }

    var doupdate = prevpos != this.position[this.axis];

    if(doupdate)
      this.listnode.setStyle((this.axis == 'x' ? 'left' : 'top'), this.position[this.axis]);

    return doupdate;
  }

, onDragStart: function(ev)
  {
    if(this.options.autoscroll)
      this.stopAutoScroll();

    this.listnode.removeClass('swipe');
    this.listnode.clientWidth;

    ev.stop();
    this.startdrag = true;
    //this.dragreference = { 'x' : ev.page.x, 'y' : ev.page.y };
  }

, onMove: function(ev)
  {
    if(this.scrolltimer)
      cancelAnimationFrame(this.scrolltimer);

    this.listnode.removeClass('swipe');

    if(this.startdrag)
    {
      this.dragtime = new Date().getTime();

      if(this.dragreference)
        this.setPosition(this.position[this.axis] + (ev.page[this.axis] - this.dragreference[this.axis]))
      this.dragreference = { 'x' : ev.page.x, 'y' : ev.page.y };
    }
    else if(ev.type == 'mousemove' && this.options.autoscroll)
    {//just scroll with speed depending on offset from center
      if(!this.hoverreference)
        this.hoverreference = this.viewport[this.axis]*0.5 + this.container.getPosition()[this.axis];

      var cursorpos = ev.page[this.axis] + $(document.documentElement).getScroll()[this.axis];

      var relativepos = Math.round(this.options.autoscroll * (this.hoverreference - cursorpos));
      if(Math.abs(relativepos) > this.options.autoscrollmax)
        relativepos = this.options.autoscrollmax * (relativepos < 0 ? -1 : 1);

      if(relativepos != 0)
        this.setRelativePosition(relativepos, true);
    }
  }

, setRelativePosition: function(relativepos, repeat)
  {
    var hasupdate = this.setPosition(this.position[this.axis] + relativepos);
    if(repeat)
    {
      if(hasupdate)
        this.scrolltimer = requestAnimationFrame(this.setRelativePosition.bind(this, relativepos, true));
      else
        this.stopAutoScroll();
    }
  }

, onDragEnd: function(ev)
  {
    var curtime = new Date().getTime();

    //prevent click detection if dragging just has ended
    var noclick = this.dragreference || this.dragtime && curtime < this.dragtime + 200;

    if(!noclick)// && ev.page[this.axis] == this.dragreference[this.axis])
    { // no movement -> check for a click on item
      var pnode = ev.target;
      var itemnode = null;
      while(pnode && pnode != this.listnode)
      {//try to get item belonging to target
        itemnode = pnode;
        pnode = pnode.getParent();
      }
      if(pnode) //if pnode exists we are inside a itemlist
      {
        for(var i = 0; i < this.items.length; i++)
        { //get item index and fire event
          if(itemnode == this.items[i])
          {
            this.activeindex = i;
            this.items.removeClass('active');
            this.items[i].addClass('active');

            this.container.fireEvent('itemclick',{'target' : itemnode, 'selectedindex' : i});

            break;
          }
        }
      }

    }

    this.startdrag = false;
    this.dragreference = null;
  }

, onResize: function()
  {
    var viewport = this.container.getSize();
    this.viewport = { 'x' : viewport.x, 'y' : viewport.y };

    this.axis = this.viewport.x > this.viewport.y ? 'x' : 'y';//guess orientation

    var listsize = this.listnode.getSize();
    this.listsize = { 'x' : listsize.x, 'y' : listsize.y };

    var posx = this.listnode.getStyle('left').toInt();
    var posy = this.listnode.getStyle('top').toInt();

    this.position = { 'x' : (isNaN(posx) ? 0 : posx), 'y' : (isNaN(posy) ? 0 : posy) };

    this.listnode.setStyles({'left' : this.position.x, 'top' : this.position.y});
  }

});


})(document.id); //end mootools/scope wrapper
