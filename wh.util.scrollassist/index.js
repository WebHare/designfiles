/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! LOAD: frameworks.mootools, wh.compat.base
!*/

(function($) { //mootools wrapper

/* setup smooth scroll
   element: must be 'window'
   options: hashscroll: Watch the scroll position, and update the hash if needed
            stops: stops to update the scroll position with
            reserveheight: Height to reserve, eg for a header
*/

$wh.ScrollAssist = new Class(
{ Implements: [ Events, Options ]
, options: { linkhashprefix: null //Set the prefix for linking the location hash to the stops
           , handlehashnavigation: false //Handle hash navigation
           , stops: null //elements that are stops. if null and linkhashprefix is set, stops will contain all elements matching that linkhashprefix
           , stickyheaders: null //sticky headers. if null, $$('.wh-sticky')
           }
, element: null
, stops: []
, updatewatch: null
, watchscroll: null
, reserveheight: 0
, stickyheaders: []
, currentstop: null
, scrollfx: null

, initialize:function(element, options)
  {
    if(element != window)
      throw new Error("Only 'window' currently supported");

    this.element = null;
    this.setOptions(options);
    if(this.options.stops === null)
    {
      if(this.options.linkhashprefix !== null)
        this.options.stops = $$('[id]').filter(function(node) { return !!this._getHashForLinkStop(node); }.bind(this));
      else
        this.options.stops = [];
    }
    if(this.options.stickyheaders === null)
      this.options.stickyheaders = $$('.wh-sticky');

    this.updatewatch = this._updateWatchPositions.bind(this).debounce(0);
    this.watchscroll = this._watchScrollForStop.bind(this).debounce(0);

    if(this.options.stops)
    {
      this.stops = this.options.stops.map(function(hash)
      {
        var el = $(hash);
        if(!el)
          throw new Error("No such element '" + hash + "'");
        return { el: el, y: 0 };
      });
    }
    if(this.options.stickyheaders)
    {
      this.stickyheaders = this.options.stickyheaders.map(function(header)
      {
        var el = $(header);
        if(!el)
          throw new Error("No such element '" + header + "'");
        return { header: el, y: 0, height: 0 };
      });
    }

    if(this.options.handlehashnavigation)
    {
      document.addEvent("click:relay(a)", this._handleAnchorLink.bind(this));
    }

    window.addEvents({ "domready": this.updatewatch
                     , "load": this.updatewatch
                     , "resize": this.updatewatch
                     , "wh-layoutchange": this.updatewatch
                     });
    window.addEvent("scroll", this.watchscroll);

    if($wh.getCurrentHash() && this.options.linkhashprefix !== null)
    {
      window.addEvent("load", this._fixScrollPos.bind(this));
    }
  }
, setScrollFx:function(fx)
  {
    this.scrollfx = fx;
  }
, getCurrentStop:function()
  {
    return this.currentstop;
  }
  //get the highest top coordinate for an element, which still has it visible, considering any sticky containers
, getHighestVisibleTop:function(el)
  {
    var pos = el.getPosition().y;
    Array.each(this.stickyheaders, function(sticky)
    {
      if(sticky.y < pos)
      {
        //console.log("Sticky " + sticky.header.id + " is above ", el.id, " so moving it. pos=" + pos + ", stickyy=" + sticky.y + ", height="+ sticky.height);
        pos -= sticky.height;
      }
    });
    return pos;
  }
, fireStopChangeEvent:function()
  {
    this.fireEvent("stopchange", { target: this
                                 , laststop: null
                                 , currentstop: this.currentstop
                                 });
  }
, _updateWatchPositions: function()
  {
    Array.each(this.stickyheaders, function(sticky)
    {
      if(sticky.header.retrieve("wh-sticky-upperposition") === null)
      {
        sticky.y = sticky.header.getPosition().y; //FIXME compensate for current scrolling position
        sticky.height = sticky.header.getSize().y;
      }
      else
      {
        sticky.y = sticky.header.retrieve("wh-sticky-upperposition");
        sticky.height = sticky.header.retrieve("wh-sticky-height");
      }
    });
    Array.each(this.stops, function(hashpos)
    {
      hashpos.y = this.getHighestVisibleTop(hashpos.el);
    }.bind(this));

    this.watchscroll();
  }
, _getHashForLinkStop:function(el)
  {
    if(!el)
      return '';
    if(el.id && el.id.substr(0,this.options.linkhashprefix.length) == this.options.linkhashprefix)
      return el.id.substr(this.options.linkhashprefix.length);
    return null;
  }
, _watchScrollForStop: function()
  {
    var pos = window.getScroll().y;
    //console.log("watch scroll with ", pos);

    var bestmatch = null, bestmatchdistance=0;
    Array.each(this.stops, function(hashpos)
    {
      if(! (hashpos.y <= pos))
        return; //disqualified
      if(bestmatch && (pos - hashpos.y) > bestmatchdistance)
        return; //further than best match

      bestmatch = hashpos;
      bestmatchdistance = pos - hashpos.y;
    });

    var stop = bestmatch ? bestmatch.el : null;
    if(stop == this.currentstop)
      return; //nothing changed

    var laststop = this.currentstop;
    this.currentstop = stop;

    if(this.options.linkhashprefix !== null && window.history.replaceState)
    {
      var hash = this._getHashForLinkStop(this.currentstop);
      if(hash !== null)
      {
        window.history.replaceState(null, document.title, '#' + hash);
        window.fireEvent("hashchange", $wh.getCurrentHash());
      }
    }

    this.fireEvent("stopchange", { target: this
                                 , laststop: laststop
                                 , currentstop: stop
                                 });
  }
, _handleAnchorLink:function(evt, target)
  {
    if(evt.event.defaultPrevented || (evt.event.getPreventDefault && evt.event.getPreventDefault()))
      return;
    if(target.href.indexOf('#') == -1 || target.href.split('#')[0] != location.href.split('#')[0])
      return; //not same page
    evt.stop();

    var gotohash = target.href.substr(target.href.indexOf('#')+1);
    var gotoel = $( (this.options.linkhashprefix || '') + gotohash);
    if(!gotoel)
      return;

    var gototop = this.getHighestVisibleTop(gotoel);
    if(this.scrollfx)
      this.scrollfx.start(0, gototop);
    else
      window.scrollTo(0,gototop);
  }
, _fixScrollPos:function()
  {
    this._updateWatchPositions();
    var gotoel = $(this.options.linkhashprefix + $wh.getCurrentHash());
    if(!gotoel || !this.stops.getByProperty("el",gotoel))
      return;

    var gototop = this.getHighestVisibleTop(gotoel);
    //console.log('fix to ',gototop);
    window.scrollTo(0,gototop);
  }
});
window.scrollTo(0,0);

})(document.id); //end mootools wrapper
