/* generated from Designfiles Public by generate_data_designfles */
require ('./timetable.css');
/*

Implemented:
- a setup for a library-agnostic (no dependencies) Time Table class
- detection of which timerange needs to be displayed
- generation of DOM (once)


FIXME:
- object.assign not supported by IE or SF < 9


ADDME:
- refresh/regeneration/updating the DOM
- tags
- overlapping events

NICE TO HAVE:
- a line indicating the current time (only relevant when we know the timeline is for the current day??)
- ellipsis & tooltips if title's don't fit (10 minute events)
- if two events connect together in time, give them a border inbetween to be able to distinguish them from each other
- button 'Show favorited' to only show favorite events, compacted


revision 5
- overlapping events
- colorschemes
- text ellipsis
- vertical align row labels


Required DOM:

    <div id="mytimetable" class="wh-timetable">

      <div class="wh-timetable-header">
        Locatie
      </div>
      <div class="wh-timetable-header-placeholder">
      </div>

      <div class="wh-timetable-viewport"><!-- container for positioning (mostly for the non-scrollable content) -->

        <div class="wh-timetable-scrollport">
          <div class="wh-timetable-content"><!-- actual content, can get big -->

            <!-- wh-timetable-row's will be generated here -->

          </div><!-- avail space container, for example width:200%; is twice as width as the view-/scroll-port -->
        </div><!-- /scrollport -->

        <!-- Locations which will keep floating over the timeline -->
        <div class="wh-timetable-rowlabels">
          <!--
          <div class="wh-timetable-row">
            <div class="wh-timetable-label">Hofnar</div>
          </div>
          -->
        </div>

      </div><!-- /viewport -->
    </div>


*/

var $wh = {};

$wh.TimeTable = function TimeTable(container, options)
{
  if (options.debug)
  {
    console.log("Prototype options", this.options);
    console.log("Specified options", options);
  }
  this.setOptions(options);
  if (options.debug)
    console.log("Merged options", this.options);

  if (!container)
  {
    console.error("No container specified.");
    return;
  }

  this.nodes = {};

  this.nodes.container = container;
  this.nodes.header = container.querySelector(".wh-timetable-header");
  this.nodes.header_placeholder = container.querySelector(".wh-timetable-header-placeholder");
  this.nodes.rowlabels = container.querySelector(".wh-timetable-rowlabels");

  this.nodes.viewport = container.querySelector(".wh-timetable-viewport");
  this.nodes.scrollport = container.querySelector(".wh-timetable-scrollport");
  this.nodes.content = container.querySelector(".wh-timetable-content");

  this.__addEvents();

  this.refresh();
}

$wh.TimeTable.prototype =
{
  options: { starthour:     null // auto-detect
           , endhour:       null // auto-detect
           , timestep_mins: 30

           , slots:         [ { height:  60, gutter: 0 } // 1 slot
                            , { height:  80, gutter: 1 } // 2 slots
                            , { height: 100, gutter: 1 } // 3 slots
                            , { height: 120, gutter: 1 } // 4 slots
                            , { height: 140, gutter: 1 } // 5 slots
                            ]

           , onSelect:      null // FIXME: proper custom event
           , onOpen:        null // FIXME: proper custom event
           }
, nodes:   null // PVT - if we use an object here, every instance will use the reference to the same nodes object
, rows:    [] // parsed events
, firstminute: null
, lastminute:  null
, __fixedpos:  false

, __addEvents: function()
  {
    document.addEventListener("scroll", this.doUpdateStickyHeader.bind(this));
    document.addEventListener("click", this.onClick.bind(this));
    this.nodes.scrollport.addEventListener("scroll", this.onScrollView.bind(this));
  }

, __removeEvents: function()
  {
    document.removeEventListener("scroll", this.doUpdateStickyHeader.bind(this));
    document.removeEventListener("click", this.onClick.bind(this));
    this.nodes.scrollport.removeEventListener("scroll", this.onScrollView.bind(this));
  }

, onScrollView: function()
  {
    if (this.__fixedpos)
    {
      // not part of the scrollport anymore, so we have to sync scrolling
      this.nodes.header.scrollLeft = this.nodes.scrollport.scrollLeft;
    }
/*
    console.log(this.nodes.scrollport.scrollLeft);
    //this.nodes.header.scrollLeft = this.nodes.scrollport.scrollLeft;

console.log ( "translate3d("+ (-this.nodes.scrollport.scrollLeft) + "px,0,0)" );
   // this.nodes.header.style.webkitTransform = "translate3d("+ (-this.nodes.scrollport.scrollLeft) + "px,0,0)";
    this.nodes.header.style.webkitTransform = "translate("+ (-this.nodes.scrollport.scrollLeft) + "px,0)";
      //transform: translate3d(0,0,0);
*/
  }

, destroy: function()
  {
    this.__removeEvents();
  }

, onClick: function(evt)
  {
    if (this.options.debug)
      console.info("Click target", evt.target);

    var node = evt.target;
    while(node && !evt.target.hasClass("wh-timetable-time"))
      node = node.parentNode;

    if (node)
    {
      evt.preventDefault();

      var event = node.__wh_timeline_event;
      /*
      event.data = the original definition
      event.data.data = the extra data in the definition (usefull for callbacks);
      */

      if (this.options.debug)
        console.info("Selected $wh.TimeTable item:", event.data);

      if (this.options.onSelect)
        this.options.onSelect({ target: node
                              , data:   event.data
                              });
    }
  }

, pvt_parseRows: function(rows)
  {
    var prows = [];
    var firstminute = 24 * 60;
    var lastminute = 0;

    for(var idx = 0; idx < rows.length; idx++)
    {
      var row = rows[idx];

      var events = [];
      if (row.events.length > 0)
      {
        events = this.pvt_parseEvents(row.events);

        if (events.firstminute < firstminute)
          firstminute = events.firstminute;

        if (events.lastminute > lastminute)
          lastminute = events.lastminute;
      }
      else
      {
        events = { events: []
                 , firstminute: -1
                 , lastminute:  -1
                 }
      }

      prows.push({ title:       row.title
                 , events:      events.events
                 , firstminute: events.firstminute
                 , lastminute:  events.lastminute
                 });
    }

    return { rows:        prows
           , firstminute: firstminute
           , lastminute:  lastminute
           };
  }

, pvt_parseEvents: function(events)
  {
    //console.info("raw", events);

    var pevents = [];
    var firstminute = 24 * 60;
    var lastminute = 0;

    for(var idx = 0; idx < events.length; idx++)
    {
      var event = events[idx];

      if (!event.start || !event.end)
      {
        console.warn("Skipping event, start en end are both required!", event);
        continue;
      }

      var startparts = event.start.split(":");

      var minutes_start = parseInt(startparts[0], 10) * 60 + parseInt(startparts[1], 10);

      var minutes_end;
      if (event.duration)
        minutes_end = minutes_start + event.duration;
      else
      {
        var endparts = event.end.split(":");
        minutes_end = parseInt(endparts[0], 10) * 60 + parseInt(endparts[1], 10);
      }

      if (minutes_start < firstminute)
        firstminute = minutes_start;

      if (minutes_end > lastminute)
        lastminute = minutes_end;

      pevents.push(
        { node: null
        , minutes_start: minutes_start
        , minutes_end:   minutes_end
        , data: Object.assign({}, event) // store a clone of the original definition of the event
        });
    }

    // make sure events are sorted by starttime in minutes ascending, so we can easily detect overlap
    pevents.sort( function(ev1, ev2) { return ev1.minutes_start > ev2.minutes_start });

    //console.info("parsed", pevents);

    return { events:      pevents
           , firstminute: firstminute
           , lastminute:  lastminute
           };
  }


, setOptions: function(options)
  {
    if ("timestep_mins" in options && [5, 10, 15, 30, 60].indexOf(options.timestep_mins) == -1)
    {
      console.error("The timestep must be one of 5, 10, 15, 30, 60");
      return;
    }

    var mergedoptions = Object.assign({}, options); // make a clone, so we don't edit the original options object
    this.options = Object.assign(mergedoptions, this.options);
    this.options.onSelect = options.onSelect;

    if ("rows" in options)
    {
      var parsedrows = this.pvt_parseRows(options.rows);

      this.firstminute = parsedrows.firstminute;
      this.lastminute = parsedrows.lastminute;
      this.rows = parsedrows.rows;
    }
  }

, refresh: function()
  {
    // ADDME: replace (or update) all previous content
  // reposition time indicator guidelines

    var timestep_mins = 30; // per half hour


    // FIXME: !!! ound to lowest multiple of selected timestep_mins
    var timestart_startmins = this.firstminute;
    var timerange_in_minutes = this.lastminute - this.firstminute;

//console.log("RANGE", this.firstminute, this.lastminute);
//console.info("!!!");
//console.log(this.rows[0]);

    /*
    Decide on the width
    ADDME: Factor into the width:
      - wide enough to be able to display the time markers (for example: "12:00") - ADDME: measure needed width
    */
    var minwidth_to_fit_timeindicators = (timerange_in_minutes / this.options.timestep_mins) * 65;
    var scrollviewport_width = this.nodes.scrollport.clientWidth;

    var contentwidth = scrollviewport_width;
    if (minwidth_to_fit_timeindicators > scrollviewport_width)
      contentwidth = minwidth_to_fit_timeindicators;

    this.nodes.content.style.width = contentwidth + "px";



    for (var idx = 0; idx < this.rows.length; idx++)
    {
      var row = this.rows[idx];

      /*
      <div class="wh-timetable-row">
        <div class="wh-timetable-label">Hofnar</div>
      </div>
      */

      var rownode = document.createElement("div");
      rownode.className = "wh-timetable-row";

      var rowlabelnode = document.createElement("div");
      rowlabelnode.className = "wh-timetable-label";
      rowlabelnode.appendChild(document.createTextNode(row.title));

      rownode.appendChild(rowlabelnode);
      this.nodes.rowlabels.appendChild(rownode);

      row.labelcontainernode = rownode;
      row.labelnode = rowlabelnode;
    }



    //var required_guidelines = Math.round((endhour - starthour) * 60 / timestep_mins);
    var required_guidelines = Math.round( timerange_in_minutes / timestep_mins );

    var rowlabels_width = this.nodes.rowlabels.offsetWidth;

    // size of the timetable (minus the space reserved for location labels to not overlap events on the starthour)
    var timetable_width = this.nodes.content.clientWidth - rowlabels_width;

    // FIXME: which one shall we use?
    var guidelines_interspace = timetable_width / required_guidelines;
    var guidelines_interperc = 100 / required_guidelines;

    if (this.options.debug)
    {
      console.log(timetable_width);
      console.log("Guidelines inbetween space:", guidelines_interspace, "or", guidelines_interperc+"%");
    }

    var timemins = timestart_startmins;

    for (var idx = 0; idx < required_guidelines; idx++)
    {
      var guideline = document.createElement("div");
      guideline.className = "wh-timetable-timeindicator";
      var csstext = "position: absolute; left: " + (rowlabels_width + guidelines_interspace * idx) + "px; top: 0; bottom: 0;";
      console.log(csstext);
      guideline.style.cssText = csstext;

      var str_hours = Math.round(timemins / 60);
      var str_minutes = timemins % 60;
      var timestr = str_hours + ":" + (str_minutes < 10 ? "0"+str_minutes : str_minutes);

      var header_guideline = guideline.cloneNode(true);
      header_guideline.appendChild(document.createTextNode(timestr));
      this.nodes.header.appendChild(header_guideline);

      this.nodes.content.appendChild(guideline);

      timemins += timestep_mins;
    }



    for (var idx = 0; idx < this.rows.length; idx++)
    {
/*
            <div class="wh-timetable-row">
              <div class="wh-timetable-time schema1"
                   style="margin-left: 350px; width: 400px;">
                Test
              </div>
            </div>
*/
      var row = this.rows[idx];

      // FIXME: 10 slots ought be enough for anyone
      var slots_endx = [-1, -1, -1, -1, -1]; // to keep track of after which time a slot will be free
      var highestslotidx = 0;

      var rownode = document.createElement("div");
      rownode.className = "wh-timetable-row";



      // Layout preparation phase ------------------------------------------------------------------------

      // We have to do both the pixel position AND overlap calculations, because:
      // - so we know the amount of required slots when we render (and do things such as divide the vertical space for the amount of slots)
      // - we check overlap by pixels instead of minutes. This way if we have a very dense timeline,
      //   events (maybe only overlapping with a few minutes) which won't visually overlap won't take up new slots
      for (var event_idx = 0; event_idx < row.events.length; event_idx++)
      {
        var event = row.events[event_idx];

        var xstart = Math.round(timetable_width / timerange_in_minutes * (event.minutes_start - timestart_startmins));
        var xend   = Math.round(timetable_width / timerange_in_minutes * (event.minutes_end   - timestart_startmins));

        if (this.options.debug)
        {
          //console.log(event.data.title, "starting at " + event.minutes_start + "mins ending at " + event.minutes_end + "mins");
          console.log(event.data.title, "starting at " + xstart + "px ending at " + xend + "px");
        }

        // find the first available slot (within our row) we can place the event in
        var slot_idx = 0;
        for (slot_idx = 0; slot_idx < 5; slot_idx++)
        {
          if (this.options.debug)
            console.log("Slot #" + slot_idx + " ends at " + slots_endx[slot_idx] + "px");

          if (xstart > slots_endx[slot_idx])
            break;
        }
        if (slot_idx > highestslotidx)
          highestslotidx = slot_idx;

        slots_endx[slot_idx] = xend;

        event.left = xstart;
        event.right = xend;
        event.width = xend - xstart;
        event.slot = slot_idx;
      }

      row.highestslotidx = highestslotidx;



      // Rendering phase ---------------------------------------------------------------------------------

      var slotsettings = this.options.slots[row.highestslotidx]
      if (!slotsettings)
        console.error("options.slots[#" +  row.highestslotidx + "] has not been defined");

      var slots_needed = highestslotidx + 1;

      var slotheight = (slotsettings.height - (highestslotidx * slotsettings.gutter)) / slots_needed;

      rownode.style.height = slotsettings.height + "px";
      row.labelcontainernode.style.height = slotsettings.height + "px";


      for (var event_idx = 0; event_idx < row.events.length; event_idx++)
      {
        var event = row.events[event_idx];

        var eventnode = document.createElement("div");

        if (event.data.cssclass)
          eventnode.className = "wh-timetable-time " + event.data.cssclass;
        else
          eventnode.className = "wh-timetable-time";

        eventnode.style.left = (rowlabels_width + event.left) + "px";
        eventnode.style.top = (slotheight * event.slot + slotsettings.gutter * event.slot ) + "px";
        eventnode.style.width = event.width + "px";
        eventnode.style.height = slotheight + "px";
        eventnode.appendChild(document.createTextNode(event.data.title));

        eventnode.__wh_timeline_event = event;

        rownode.appendChild(eventnode);
      }

      this.nodes.content.appendChild(rownode);
    }


    this.doUpdateStickyHeader();
  }

, doUpdateStickyHeader: function()
  {
    //var scroll = document.body.scrollTop ? document.body.scrollTop : document.documentElement.scrollTop;

    var header_bcr = this.nodes.header.getBoundingClientRect();
    var viewport_bcr = this.nodes.viewport.getBoundingClientRect();

    // to stabilize the values (when fixed we still track the top as it would be in relative position)
    var headerheight = (header_bcr.bottom - header_bcr.top);
    var header_would_be_top = viewport_bcr.top - headerheight;

    var page_viewport_height = document.body.clientHeight; // FIXME: might in some cases need to use documentElement.clientHeight??

    if (this.options.debug)
    {
      console.log(header_bcr);
      console.log(viewport_bcr);
    }

    var fixedpos = false;
    this.__fixedpos = true;
    //console.info(headerheight);

    if (viewport_bcr.bottom - headerheight < 0 || viewport_bcr.top > page_viewport_height) // out of view
    {
      // RELATIVE
    }
    else if (header_would_be_top < 0)
    {
      // FIXED
      fixedpos = true;
    }
    /*
    else
    {
      // RELATIVE
    }
    */

    if (fixedpos)
    {
      this.nodes.header.style.position = "fixed";
      this.nodes.header.style.top = "0";
      this.nodes.header.style.zIndex = 10;

      this.nodes.header_placeholder.style.display = "block";
      this.nodes.header_placeholder.style.height = headerheight + "px";

      //console.info(this.nodes.header_placeholder.offsetWidth );
      this.nodes.header.style.width = this.nodes.scrollport.offsetWidth + "px"; // sync with the width the placeholder gets

      this.nodes.viewport.insertBefore(this.nodes.header, this.nodes.viewport.firstChild);
    }
    else
    {
      this.nodes.content.insertBefore(this.nodes.header, this.nodes.content.firstChild);

      this.nodes.header.style.position = "relative";
      this.nodes.header.style.width = "";

      this.nodes.header_placeholder.style.display = "none";
      this.nodes.header_placeholder.style.width = "";
    }

    //console.log("zichtbaar");
  }
}


if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(nextSource);
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}
