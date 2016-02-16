/* generated from Designfiles Public by generate_data_designfles */
require ('./slider.css');
require ('frameworks.mootools.more.keyboard');
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.util.dragevents');
require ('frameworks.mootools.more.element.measure');
require ('wh.ui.base');
require ('wh.util.resizelistener');
/*! LOAD: frameworks.mootools.more.keyboard, frameworks.mootools.core, wh.compat.base, wh.util.dragevents, frameworks.mootools.more.element.measure, wh.ui.base, wh.util.resizelistener
!*/

(function($) { //mootools wrapper

/*
  Public
    Functions:
      refresh
      setValues
      getValues
      getValue
    Events:
      sliderstart
      slidermove
      sliderend
      change

  css: .wh-slider-holder > .wh-slider > .wh-slider-knob
                                      > .wh-slider-rangebar (optional)

  Example html:
  <div id="sliders_holder" class="wh-slider-holder">
    <div class="wh-slider"><div class="wh-slider-rangebar"></div><div class="wh-slider-knob drag1"></div><div class="wh-slider-knob drag2"></div></div>
  </div>

*/

$wh.Slider = new Class(
{ Implements  : [Events,Options]

 ,options     : { minvalue         : 0
                , maxvalue         : 100
                , startvalues      : [50]
                , limitdragarea    : false //only keep dragging if in sliderarea (.wh-slider-holder)
                , snap             : 0     //snap interval, 0:nosnapping
                , enablemouseclick : false //if enabled, a mouseclick on sliderarea will position directly closest dragger
                , ticklist         : [] //list of positions where to place ticks
                , tickinterval     : 0  //show ticks with given inteval (if > 0)
                , readonly         : false
                , resizelistener   : false
                }

 //internal params
 ,value       : null //updated during dragging
 ,values      : []
 ,scale       : 1
 ,size        : 0
 ,node        : null
 ,slidebasenode: null
 ,rangebar    : null
 ,isvertical  : false
 ,keys        : null           //keyboard object

 ,initialize : function(selector, options)
  {
    this.node = $$(selector).pick();

    this.slidebasenode = this.node.getElement('.wh-slider');
    if(!this.slidebasenode)
    {
      console.log('Wrong selector, no class wh-slider found');
      return false;
    }

    this.setOptions(options);

    this.isvertical = this.node.hasClass('vertical') || this.slidebasenode.hasClass('vertical');
    this.size       = this.getNodeSize(this.slidebasenode);
    this.scale = (this.options.maxvalue - this.options.minvalue) / (this.isvertical ? this.size.y : this.size.x);

    if(this.options.tickinterval > 0)
    {
      var pinterval = Math.abs(this.options.maxvalue - this.options.minvalue) / this.options.tickinterval;
      var ticks = Math.floor(pinterval);
      var pinterval = (100/pinterval);
      for(var c = ticks; c >=0; c--)
      {
        if(!this.options.ticklist.contains(this.options.minvalue + this.options.tickinterval*c))
        {
          var val = this.options.minvalue + c*this.options.tickinterval;
          if(this.isvertical)
            new Element('div',{ 'class' : 'wh-tick tick' + c, 'style' : 'top:' + (pinterval*c) + '%', 'data-value' : val } ).inject(this.slidebasenode,'top');
          else
            new Element('div',{ 'class' : 'wh-tick tick' + c, 'style' : 'left:' + (pinterval*c) + '%', 'data-value' : val } ).inject(this.slidebasenode,'top');
        }
      }
    }

    for(var c = 0; c < this.options.ticklist.length; c++)
    {
      var pos = (this.options.ticklist[c] - this.options.minvalue)*100 / (this.options.maxvalue - this.options.minvalue);

      if(this.isvertical)
        new Element('div',{ 'class' : 'wh-tick ticklist ticklist' + c, 'style' : 'top:' + pos + '%', 'data-value' : this.options.ticklist[c] } ).inject(this.slidebasenode,'top');
      else
         new Element('div',{ 'class' : 'wh-tick ticklist ticklist' + c, 'style' : 'left:' + pos + '%', 'data-value' : this.options.ticklist[c] } ).inject(this.slidebasenode,'top');

    }

    //slider can have multiple knobs
    var minvalue = null;
    this.slidebasenode.getElements('.wh-slider-knob').each(function(dragnode,i)
    {
      dragnode.wh_dragpos = 0;

      var startvalue = 0;
      if(i < this.options.startvalues.length)
        startvalue = this.options.startvalues[i];

      if(startvalue < this.options.minvalue)
        startvalue = this.options.minvalue;

      if(startvalue > this.options.maxvalue)
        startvalue = this.options.maxvalue;

      if(this.options.snap > 0)
        startvalue = this.calcSnapValue(startvalue);

      this.values.push(startvalue);

      if(i == 0 || startvalue < minvalue)
        minvalue = startvalue;

      dragnode.wh_value = startvalue;
      dragnode.wh_dragpos = Math.round((startvalue - this.options.minvalue)/this.scale);

      if(this.isvertical)
        dragnode.setStyle('top',dragnode.wh_dragpos + 'px');
      else
        dragnode.setStyle('left',dragnode.wh_dragpos + 'px');

      var dragoptions = { events: { "dragmove" : this.onDragMove.bind(this,dragnode,i)
                                  , "dragend"  : this.onDragEnd.bind(this,dragnode)
                                  , "dragstart": this.onDragStart.bind(this,dragnode)
                                  }
                        }

      dragnode.wh_dragger = new $wh.DragEvents(dragnode,dragoptions);

    }.bind(this));

    this.rangebar = this.slidebasenode.getElement('.wh-slider-rangebar');
    if(this.rangebar)
    {
      this.rangebar.wh_value = minvalue;
      this.rangebar.wh_dragpos = Math.round(minvalue/this.scale);

      if(this.values.length > 1)
      {//make draggable if it's a rangebar between draggers
        var dragoptions = { events: { "dragmove" : this.onDragMove.bind(this,this.rangebar,-1)
                                    , "dragend"  : this.onDragEnd.bind(this,this.rangebar)
                                    , "dragstart": this.onDragStart.bind(this,this.rangebar)
                                    }
                          }
        this.rangebar.wh_dragger = new $wh.DragEvents(this.rangebar,dragoptions);
      }

      this.updateRangebarPosition(this.values);
    }

    this.keys = new Keyboard({ defaultEventType: 'keydown'
                             , events: { 'up'   : this.up.bind(this)
                                       , 'right': this.up.bind(this)
                                       , 'down' : this.down.bind(this)
                                       , 'left' : this.down.bind(this)
                                       }
                            });

    this.node.addEvent('mousewheel',this.onMouseWheel.bind(this));

    this.node.addEvent('focus',this.focus.bind(this));
    this.node.addEvent('blur',this.blur.bind(this));

    if(this.options.enablemouseclick)
    {
      //capture click on bar and move closest dragger to this point
      this.node.addEvent('mousedown',function(event){

        if(this.options.readonly)
          return;

        if(event.target.hasClass('wh-tick'))
          this.onTickClick(event.target);//go straight for the tick value
        else
        {
          var wrapperoffset = this.slidebasenode.getPosition();
          if(this.isvertical)
            this.jumpToPosition(event.page.y - wrapperoffset.y);
          else
            this.jumpToPosition(event.page.x - wrapperoffset.x);
        }
      }.bind(this));
    }

    if(this.options.resizelistener)
    {
      $wh.enableResizeEvents(this.node);
      this.node.addEvent("wh-resized", this.refresh.bind(this));
    }
  }

, onTickClick: function(ticknode)
  {
    var val = ticknode.get('data-value');
    if(val != null)
    {
      val = Number(val);
      var valindex = -1;
      var delta = 0;
      for(var i = 0; i < this.values.length; i++) //get nearest value
      {
        var dval = Math.abs(this.values[i] - val);
        if(dval < delta || valindex == -1)
        {
          delta = dval;
          valindex = i;
        }
      }
      if(valindex > -1)
      {
        this.values[valindex] = val;
        this.setValues(this.values);
        this.fireEvent('change',ticknode);
      }
    }
  }

, focus: function()
  {
    if(!this.options.readonly)
      this.keys.activate();
  }

, blur: function()
  {
    if(!this.options.readonly)
      this.keys.deactivate();
  }

, onMouseWheel: function(ev)
  {
    if(!this.keys.isActive()) //check if we have focus
      return;

    if(ev.wheel > 0)
      this.up(ev);
    else if(ev.wheel < 0)
      this.down(ev);
  }

, down : function(ev)
  {
    ev.stop();

    var referencenode = null;
    this.slidebasenode.getElements('.wh-slider-knob').each(function(dragnode)
    { //get nearest dragger
      if(!referencenode || referencenode.wh_dragpos > dragnode.wh_dragpos)
        referencenode = dragnode;
    });

    if(this.options.snap > 0)
    {
      this.values[0]-=this.options.snap;
      this.setValues(this.values);
      this.fireEvent('change',referencenode);
    }
    else
    {
      this.jumpToPosition(referencenode.wh_dragpos - 1);//move one px
    }
  }

, up : function(ev)
  {
    ev.stop();

    var referencenode = null;
    this.slidebasenode.getElements('.wh-slider-knob').each(function(dragnode)
    { //get nearest dragger
      if(!referencenode || referencenode.wh_dragpos < dragnode.wh_dragpos)
        referencenode = dragnode;
    });

    if(this.options.snap > 0)
    {
      this.values[this.values.length-1]+=this.options.snap;

      this.setValues(this.values);
      this.fireEvent('change',referencenode);
    }
    else
    {
      this.jumpToPosition(referencenode.wh_dragpos + 1);//move one px
    }
  }

, jumpToPosition: function(mousepos)
  {//jump to cursor position on mousedown
    var changed = false;
    var values = this.values;

    //get nearest dragger
    var nearestnode = null;
    var delta = -1;
    var minnode = null;
    var maxnode = null;
    var dragnodes = this.slidebasenode.getElements('.wh-slider-knob');
    dragnodes.each(function(dragnode)
    {
      var relpos = Math.abs(dragnode.wh_dragpos - mousepos);
      if(!nearestnode || relpos < delta)
      {
        nearestnode = dragnode;
        delta = relpos;
      }

      if(!minnode || dragnode.wh_dragpos < minnode.wh_dragpos)
        minnode = dragnode;

      if(!maxnode || dragnode.wh_dragpos > maxnode.wh_dragpos)
        maxnode = dragnode;
    });

    if(this.rangebar)
    {
      if(mousepos < minnode.wh_dragpos || mousepos > maxnode.wh_dragpos)
      {//only if position is outside rangebar, move rangebar to new position
        var firstpos = mousepos;
        if(firstpos > maxnode.wh_dragpos)
          firstpos-=(maxnode.wh_dragpos - minnode.wh_dragpos);
        var delta = minnode.wh_dragpos - firstpos;

        dragnodes.each(function(dragnode,i)
        {
          var val = (dragnode.wh_dragpos - delta)*this.scale + this.options.minvalue;
          if(this.options.snap > 0)
            val = this.calcSnapValue(val);
          changed = changed || (val != this.values[i]);
          values[i] = val;
          if(dragnode == minnode)
            this.value = val;
        }.bind(this));
      }
    }
    else
    {//move nearest dragnode to new position
      dragnodes.each(function(dragnode,i)
      {
        if(nearestnode == dragnode)
        {
          var val = mousepos*this.scale + this.options.minvalue;
          if(this.options.snap > 0)
            val = this.calcSnapValue(val);
          changed = (val != this.values[i]);
          values[i] = val;
          this.value = val;
        }
      }.bind(this));
    }

    if(changed)
    {
      this.setValues(values);
      this.fireEvent('change',this.rangebar ? minnode : nearestnode);
    }

  }

, log10 : function(val)
  { //IE doesn't support Math.log10
    return Math.log(val) / Math.log(10);
  }

, calcSnapValue: function(value)
  {
    var precision = this.options.snap > 0 ? this.log10(this.options.snap) : 0;
    if(precision <= 0)
    {
      value = Number(value).round(-1*precision);
    }
    else
    {
      var f = value - Math.floor(value / this.options.snap)*this.options.snap;
      if(f > 0)
      {
        value = Math.floor(value / this.options.snap)*this.options.snap;
        if(f >= this.options.snap*0.5)
          value+=this.options.snap;
      }
      value = Math.round(value);
    }

    return value;
  }

, getNodeSize: function(node)
  {
    var d = this.node.measure(function(){
        return node.getComputedSize();
    }.bind(this));

    return {x : d.width, y : d.height};
  }

  //Public: use refresh if size of slider has changed
, refresh: function()
  {
    this.size = this.getNodeSize(this.slidebasenode);
    this.scale = (this.options.maxvalue - this.options.minvalue) / (this.isvertical ? this.size.y : this.size.x);

    this.slidebasenode.getElements('.wh-slider-knob').each(function(dragnode,i)
    {
      dragnode.wh_dragpos = 0;

      if(i == 0)
        this.scale = (this.options.maxvalue - this.options.minvalue) / (this.isvertical ? this.size.y : this.size.x);

      dragnode.wh_dragpos = Math.round((this.values[i] - this.options.minvalue)/this.scale);

      if(this.isvertical)
        dragnode.setStyle('top',dragnode.wh_dragpos + 'px');
      else
        dragnode.setStyle('left',dragnode.wh_dragpos + 'px');

      if(this.rangebar && this.values.length > 1)
        this.updateRangebarPosition(this.values);

    }.bind(this));

  }

  //Public:
, getValue: function()
  {
    return (this.options.snap > 0 ? this.calcSnapValue(this.value) : this.value);
  }

  //Public:
, getValues: function()
  {
    var values = this.values;

    if(this.options.snap > 0)
    {
      for(var i = 0; i < this.values.length; i++)
        values[i] = this.calcSnapValue(values[i]);
    }

    return values;
  }

  //Public: Override intial/current dragger values
, setValues: function(values, nosnap)
  {
    if(typeof values == 'object')
    {
      for(var c=0; c < values.length && c < this.values.length; c++)
        this.values[c] = values[c];
    }
    else if(this.values.length)
    {
      this.values[0] = values;
    }

    for(var i=0; i < this.values.length; i++)
    {
      if(this.values[i] < this.options.minvalue)
        this.values[i] = this.options.minvalue;
      else if(this.values[i] > this.options.maxvalue)
        this.values[i] = this.options.maxvalue;
    }

    this.scale = (this.options.maxvalue - this.options.minvalue) / (this.isvertical ? this.size.y : this.size.x);

    var rangebarvalues = this.values;
    this.slidebasenode.getElements('.wh-slider-knob').each(function(dragnode,i)
    {
      var snapvalue = this.values[i];
      if(this.options.snap > 0)
      {
        snapvalue = this.calcSnapValue(this.values[i]);
        rangebarvalues[i] = !nosnap ? snapvalue : this.values[i];
      }

      dragnode.wh_value   = snapvalue;
      dragnode.wh_dragpos = Math.round((dragnode.wh_value - this.options.minvalue)/this.scale);

      if(this.isvertical)
        dragnode.setStyle('top',dragnode.wh_dragpos + 'px');
      else
        dragnode.setStyle('left',dragnode.wh_dragpos + 'px');

    }.bind(this));

    if(this.rangebar)
      this.updateRangebarPosition(this.values);

  }

  //Internal
, onDragStart: function(dragnode,event)
  {
    if(this.options.readonly)
      return;

    //get/set intial/start position
    dragnode.wh_dragger.dragging.startscroll = event.page;
    if(this.isvertical)
      dragnode.wh_dragger.dragging.startscroll.y-=dragnode.wh_dragpos;
    else
      dragnode.wh_dragger.dragging.startscroll.x-=dragnode.wh_dragpos;

    dragnode.setStyle('z-index',1);

    this.fireEvent('sliderstart');
  }
  //Internal
, onDragMove: function(dragnode,i,event)
  {
    if(this.options.readonly)
      return;

    if(this.options.limitdragarea)
    {
      var parentnode = event.target.getParent('.wh-slider-holder');
      if(parentnode != this.node && event.target != this.node)
      {
        dragnode.wh_dragger.fireEvent("dragcancel", event);
        dragnode.wh_dragger.dragging = null;
        event.stop();
        return false;
      }
    }

    var changed = false;
    if(i < 0)
    {//dragging rangebar
      var minvalue = this.values[0];
      var maxvalue = this.values[0];
      for(var i=0;i < this.values.length; i++)
      {//determin min.max value
        if(this.values[i] < minvalue)
          minvalue = this.values[i];
        else if(this.values[i] > maxvalue)
          maxvalue = this.values[i];
      }

      var pos = this.calcDragInfo(event.page,dragnode);
      dragnode.wh_dragpos = pos.px;

      this.value = pos.snapvalue;

      // knob with minvalue corresponds with position rangebar
      var delta = this.value - minvalue;
      if(delta + minvalue < this.options.minvalue)
        delta = this.options.minvalue - minvalue;
      else if(delta + maxvalue > this.options.maxvalue)
        delta = this.options.maxvalue - maxvalue;

      var newvalues = [];
      var oldvalues = this.getValues();
      for(var i=0;i < this.values.length; i++)
      {
        var val = this.calcSnapValue(this.values[i] + delta);
        newvalues.push(val);
        if(!changed)
          changed = !oldvalues.contains(val);
      }

      this.setValues(newvalues,true);//update knob and rangebar positions
    }
    else
    {//dragging a knob
      var pos = this.calcDragInfo(event.page,dragnode);

      if(this.value!=null)
        changed = pos.snapvalue != this.value;

      this.updateKnobPosition(pos,dragnode);
      this.value = this.options.snap > 0 ? pos.snapvalue : pos.value;
      dragnode.wh_value = this.value;
      this.values[i] = this.value;

      if(this.rangebar)
        this.updateRangebarPosition();
    }

    if(changed)
      this.fireEvent('change',dragnode);

    this.fireEvent('slidermove',dragnode);
  }
  //Internal
, calcDragInfo: function(dragpos,dragnode)
  {
    var dragvalues = {px:dragnode.wh_dragpos,value:null,snapvalue:null};
    if(this.isvertical)
    {
      dragvalues.px =(dragpos.y - dragnode.wh_dragger.dragging.startscroll.y);
      if(dragvalues.px > this.size.y)
        dragvalues.px = this.size.y;
      if(dragvalues.px < 0)
        dragvalues.px = 0;
    }
    else
    {
      dragvalues.px = (dragpos.x - dragnode.wh_dragger.dragging.startscroll.x);
      if(dragvalues.px > this.size.x)
        dragvalues.px = this.size.x;
      if(dragvalues.px < 0)
        dragvalues.px = 0;
    }

    dragvalues.value = dragvalues.px*this.scale + this.options.minvalue;

    if(dragvalues.value < this.options.minvalue)
      dragvalues.value = this.options.minvalue
    else if(dragvalues.value > this.options.maxvalue)
      dragvalues.value = this.options.maxvalue

    if(this.options.snap > 0)
      dragvalues.snapvalue = this.calcSnapValue(dragvalues.value);
    else
      dragvalues.snapvalue = dragvalues.value;

    return dragvalues;
  }
  //Internal
, updateKnobPosition: function(pos,dragnode)
  {
    dragnode.wh_dragpos = pos.px;

    if(this.isvertical)
      dragnode.setStyle('top',dragnode.wh_dragpos + 'px');
    else
      dragnode.setStyle('left',dragnode.wh_dragpos + 'px');
  }
  //Internal
, updateRangebarPosition: function()
  {
    var rangemin = this.values.length > 1 ? this.values[0] : this.options.minvalue;
    var rangemax = this.values[0];

    for(var i=1; i < this.values.length; i++)
    {
      if(this.values[i] < rangemin)
        rangemin = this.values[i];
      else if(this.values[i] > rangemax)
        rangemax = this.values[i];
    }

    var rangepos  = Math.floor((rangemin - this.options.minvalue)/this.scale);
    var rangesize = Math.floor((rangemax - rangemin)/this.scale);

    this.rangebar.wh_value   = rangemin;
    this.rangebar.wh_dragpos = rangepos;

    if(this.isvertical)
      this.rangebar.setStyles({'top': rangepos +'px', 'height': rangesize +'px'});
    else
      this.rangebar.setStyles({'left': rangepos +'px', 'width': rangesize +'px'});

  }
  //Internal
, onDragEnd: function(dragnode,event)
  {
    if(this.options.readonly)
      return;

    if(this.options.snap > 0)
    {
      this.values = this.getValues();
      this.setValues(this.values);//set correct snap position
    }
    dragnode.setStyle('z-index',null);
    this.fireEvent('sliderend');
  }
});


function replaceRangeComponent(inputnode, options)
{
  options = options ? Object.clone(options) : {};
this.options.readonly
  if (!("enablemouseclick" in options))
    options.enablemouseclick = true;
  if (!("minvalue" in options))
    options.minvalue = 1*inputnode.get('min');
  if (!("maxvalue" in options))
    options.maxvalue = 1*inputnode.get('max');
  if (!("startvalues" in options))
  {
    options.startvalues = [];
    if(inputnode.get('data-values'))
    {
      var values = inputnode.get('data-values').replace(/[^0-9\.]+/g,',').split(',');//only allow numbers separated by comma
      for(var c = 0; c < values.length; c++)
      {
        if(values[c] != '')
          options.startvalues.push(1*values[c]);
      }
    }
    else
    {
      options.startvalues = [1*inputnode.get('value')];
    }
  }
  if (!("snap" in options))
    options.snap = inputnode.get('step') == null ? 1 : 1*inputnode.get('step');
  if (!("tickinterval" in options))
    options.tickinterval = 1*inputnode.get('data-tickinterval');
  if (!("readonly" in options))
    options.readonly = inputnode.get('readonly');
  if (!("ticklist" in options))
  {
    options.ticklist = [];
    if(inputnode.get('data-ticks') != null)
    {
      var tickliststr = inputnode.get('data-ticks').replace(/,/g,' ');
      var tickliststr = tickliststr.replace(/\s+/g,' ');
      var ticklist = tickliststr.split(' ');
      for(var c=0; c < ticklist.length; c++)
      {
        var t = 1*ticklist[c];
        if(!options.ticklist.contains(t) && t >= options.minvalue && t <= options.maxvalue)
          options.ticklist.push(t);
      }
    }
  }

  var orientation = inputnode.get('orient');
  var isvertical = (orientation && orientation.toUpperCase() == 'VERTICAL');

  var tabindex = inputnode.get('tabindex');
  if(!tabindex)
    tabindex = '0';

  var inputclasses = inputnode.get('class');
  if(!inputclasses)
    inputclasses = '';

  if((options.tickinterval > 0 || options.ticklist.length) && !inputnode.hasClass('interval'))
    inputclasses+= ' interval';//slider with interval has other layout then without

  if(isvertical && !inputnode.hasClass('vertical'))
    inputclasses+= ' vertical';

  if(options.readonly && !inputnode.hasClass('readonly'))
    inputclasses+= ' readonly';

  if(inputnode.get('disabled'))
  {
    if(!inputnode.hasClass('disabled'))
      inputclasses+= ' disabled';
    options.readonly = true;
  }

  var replacenode = new Element('div', { 'class' : 'wh-slider-holder ' + inputclasses, 'tabindex' : tabindex });

  new Element('div', { 'class' : 'whslider__minvalue', 'text' : options.minvalue }).inject(replacenode);
  var slidernode = new Element('div', { 'class' : 'wh-slider' }).inject(replacenode);
  new Element('div', { 'class' : 'whslider__maxvalue', 'text' : options.maxvalue }).inject(replacenode);

  var knobs = [];
  knobs.push(new Element('div', { 'class' : 'wh-slider-knob'}).inject(slidernode));
  var valuewrappernode = new Element('div', { 'class' : 'value-wrapper'}).inject(knobs[0]);
  var valuenode = new Element('span', { 'class' : 'value'}).inject(valuewrappernode);

  for(var c = 1; c < options.startvalues.length; c++)
  {
    knobs.push(new Element('div', { 'class' : 'wh-slider-knob'}).inject(slidernode));
    var valuewrappernode = new Element('div', { 'class' : 'value-wrapper'}).inject(knobs[c]);
    var valuenode = new Element('span', { 'class' : 'value'}).inject(valuewrappernode);
  }

  replacenode.store('wh-ui-replaces',inputnode).inject(inputnode,'before');
  inputnode.store("wh-ui-replacedby", replacenode).setStyle('display','none');

  var comp = new $wh.Slider(replacenode,options);

  inputnode.addEvent('change', function()
  {
    comp.setValues([this.value]);
  });

  //initial
  var values = comp.getValues();
  for(var c = 0; c < knobs.length; c++)
    knobs[c].getElement('span.value').set('text',knobs[c].wh_value);
  inputnode.set('value',values.join(','));

  //onchange
  comp.addEvent('change', function()
  {
    var values = comp.getValues();

    for(var c = 0; c < knobs.length; c++)
      knobs[c].getElement('span.value').set('text',knobs[c].wh_value);

    inputnode.set('value',values.join(','));
    $wh.fireHTMLEvent(inputnode,'change');
  });

}

$wh.Slider.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceRangeComponent, options);
}

})(document.id); //end mootools wrapper
