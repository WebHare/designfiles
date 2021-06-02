/* generated from Designfiles Public by generate_data_designfles */
require ('./spinner.css');
require ('frameworks.mootools.more.keyboard');
require ('wh.ui.base');
require ('wh.util.dragevents');
/*! LOAD: frameworks.mootools.more.keyboard, wh.ui.base, wh.util.dragevents
!*/

//FIXME keyboard enter direct values

(function($) { //mootools wrapper

function log10(val)
{ //IE doesn't support Math.log10
  return Math.log(val) / Math.log(10);
}

$wh.Spinner = new Class(
{ Implements: [ Events, Options ]
, Binds: [ "onClick", "followCurrentState" ]

, options: { values   : []
           , range    : null
           , arrowup  : '-wh-spinner-up wh-spinner-up'
           , arrowdown: '-wh-spinner-down wh-spinner-down'
           , loop     : false
           , readonly : false
           }
, node: null
, eventnodes: []
, listnode: null
, items: []
, itemcount : 0
, lastattr: {}
, selectedindex: 0
, upnode: null
, downnode: null
, keys     : null           //keyboard object
, timekeypress: 0
, keyspressed: ''
, initialize: function(node,options)
  {
    this.setOptions(options);
    this.node = $(node);
    this.node.addClass('-wh-spinner wh-spinner');

    this.buildnode();

    this.listnode.set('tween',{ 'duration' : 200, onComplete : this.cleanupClones.bind(this)});

    if("createTouch" in document)
    {//only if touch capable
      var dragobj = new $wh.DragEvents(this.node);
      dragobj.addEvent('swipe',function(ev)
      {
        if(ev.direction == 's')
          this.down(ev);
        else if(ev.direction == 'n')
          this.up(ev);
      }.bind(this));
    }

    this.keys = new Keyboard({ defaultEventType: 'keydown'
                              , events: { 'up': this.up.bind(this)
                                        , 'down': this.down.bind(this)
                                        }
                             });
    this.keys.addEvent('keydown',this.trackKeyboard.bind(this));

    this.node.addEvent('focus',this.focus.bind(this));
    this.node.addEvent('blur',this.blur.bind(this));

    this.node.addEvent('mousewheel',this.onMouseWheel.bind(this));
  }

, trackKeyboard: function(ev)
  {
    if((ev.code >= 65 && ev.code <= 90) || (ev.code >= 48 && ev.code <= 57) || ev.key == 'space' || ev.key == 'esc' || ev.key == 'backspace')
    { //a..z or 0..9 ..
      ev.stop();

      var t = new Date().getTime();
      if(t - this.timekeypress > 1000 || ev.key == 'esc')
        this.keyspressed = '';

      if(ev.key == 'backspace')
        this.keyspressed = this.keyspressed == '' ? '' : this.keyspressed.substr(0,this.keyspressed.length - 1);
      else if((ev.key >= 'a' && ev.key <= 'z') || (ev.key >= '0' && ev.key <= '9') || ev.key == 'space')
        this.keyspressed+=ev.key;

      //try to find closest match
      for(var c = 0; c < this.items.length; c++)
      {
        var testval = String(this.items[c].title);
        if(testval.toLowerCase().indexOf(this.keyspressed) == 0)
        {
          this.setValue(this.items[c].value);
          break;
        }
      }

      this.timekeypress = t;
    }
  }

, buildnode: function()
  {
    this.node.empty();

    var navnode = new Element('div',{'class':'-wh-spinner-nav wh-spinner-nav'});

    this.upnode = new Element('div',{'class':this.options.arrowup});
    this.upnode.addEvent('click',this.up.bind(this));
    navnode.adopt(this.upnode);
    this.eventnodes.push(this.upnode);

    this.downnode = new Element('div',{'class':this.options.arrowdown});
    this.downnode.addEvent('click',this.down.bind(this));
    navnode.adopt(this.downnode);
    this.eventnodes.push(this.downnode);

    var wrappernode = new Element('div',{'class':'-wh-spinner-wrapper wh-spinner-wrapper'});

    this.listnode = new Element('ul',{'class':'-wh-spinner-list wh-spinner-list'});
    wrappernode.adopt(this.listnode);

    this.node.adopt(wrappernode);
    this.node.adopt(navnode);

    this.buildlist();
  }

, updateList: function(list)
  {
    this.options.values = list;
    this.buildlist();
  }

, buildlist: function()
  {
    this.items = [];
    this.listnode.empty();

    this.selectedindex = -1;
    if(this.options.values.length > 0)
    {
      for(var c = 0; c < this.options.values.length; c++)
      {
        var item = this.options.values[c];

        if(item.selected)
          this.selectedindex = c;

        var itemnode = new Element('li',{ 'class'      : '-wh-spinner-value wh-spinner-value' + (item.selected ? ' -wh-spinner-selected wh-spinner-selected' : '') + (item["class"] ? ' ' + item["class"] : '')
                                        , 'text'       : item.title ? item.title : ''
                                        , 'data-value' : item.value});

        itemnode.value = item.value;
        itemnode.title = item.title;

        this.listnode.adopt(itemnode);
        this.items.push(itemnode);
      }
    }
    else if(this.options.range)
    {
      var startval = 1*this.options.range.min;
      var endval   = 1*this.options.range.max;
      var step     = this.options.range.step ? 1*this.options.range.step : 1;

      var precision = step > 0 ? log10(step) : 0;
      precision = precision > 0 ? 0 : -1*precision;

      var i = 0;
      for(var c = startval; c <= endval; c=c+step)
      {
        var value = Number(c).round(precision);

        if(this.options.range.value == c)
          this.selectedindex = i;
        i++;

        var itemnode = new Element('li',{ 'class'      : '-wh-spinner-value wh-spinner-value' + (this.options.range.value == value ? ' -wh-spinner-selected wh-spinner-selected' : '')
                                        , 'text'       : value
                                        , 'data-value' : value});
        itemnode.value = value;
        itemnode.title = value;

        this.listnode.adopt(itemnode);
        this.items.push(itemnode);
      }
    }

    this.itemcount = this.items.length;
    if(this.itemcount > 0)
    {
      if(this.selectedindex < 0)
      {
        this.selectedindex = 0;
        this.node.fireEvent('change');
      }
      this.items[this.selectedindex].selected  = true;

      this.setSelection(false);
    }

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
, focus: function()
  {
    this.keyspressed = '';
    if(!this.options.readonly)
      this.keys.activate();
  }

, blur: function()
  {
    if(!this.options.readonly)
      this.keys.deactivate();
  }

, down: function(ev)
  {
    ev.stop();

    if(!this.options.readonly)
    {
      if(this.selectedindex > 0)
      {
        this.selectedindex--;
        this.setSelection(this.options.animate);
      }
      else if(this.options.loop)
      {
        var curh = this.listnode.getSize().y;
        this.selectedindex = this.items.length - 1;
        clist = new Array();
        for(var i = 0; i < this.itemcount; i++)
        {
          clist.push(this.items[i].clone());
          this.items[i].addClass('wh-cloned');//add class for cleanup use
        }

        this.items = clist.concat(this.items);
        this.listnode.adopt(this.items);

        //correct current position
        this.listnode.setStyle('top', (-curh) + 'px');

        this.setSelection(this.options.animate);
      }
    }
  }

, up: function(ev)
  {
    ev.stop();

    if(!this.options.readonly)
    {
      if(this.selectedindex < this.itemcount - 1)
      {
        this.selectedindex++;
        this.setSelection(this.options.animate);
      }
      else if(this.options.loop)
      {
        this.selectedindex = this.items.length;
        clist = new Array();
        for(var i = 0; i < this.itemcount; i++)
        {
          clist.push(this.items[i].clone());
          this.items[i].addClass('wh-cloned');//add class for cleanup use
        }

        this.items = this.items.concat(clist);
        this.listnode.adopt(this.items);

        this.setSelection(this.options.animate);
      }
    }
  }

, cleanupClones: function()
  {//cleanup cloned nodes used for looping spinner
    if(this.options.loop)
    {
      var removenodes = this.listnode.getChildren('.wh-cloned');
      if(removenodes)
      {
        if(this.selectedindex >= this.itemcount || this.selectedindex == 0)
        {//correct top position and index
          this.selectedindex = 0;
          this.listnode.setStyle('top', '0px');
        }
        removenodes.destroy();
        this.items = this.listnode.getChildren();
      }
    }
  }

, getValue: function()
  {
    if(this.selectedindex > -1)
      return this.items[this.selectedindex].get('data-value');
    else
      return null;
  }

, setValue: function(newval)
  {
    for(var c = 0; c < this.items.length; c++)
    {
      if(this.items[c].value == newval)
      {
        if(this.selectedindex != c)
        { //only if changed
          this.selectedindex = c;
          this.setSelection(false);
        }
        break;
      }
    }
  }

, setSelection: function(animate)
  {
    var newpos = this.items[this.selectedindex].getPosition(this.listnode).y;

    this.listnode.getChildren('li').removeClass('-wh-spinner-selected').removeClass('wh-spinner-selected');

    if(this.selectedindex > 0)
      this.downnode.removeClass('-wh-spinner-disabled').removeClass('wh-spinner-disabled');
    else if(!this.options.loop)
      this.downnode.addClass('-wh-spinner-disabled').addClass('wh-spinner-disabled');

    if(this.selectedindex < this.items.length - 1)
      this.upnode.removeClass('-wh-spinner-disabled').removeClass('wh-spinner-disabled');
    else if(!this.options.loop)
      this.upnode.addClass('-wh-spinner-disabled').addClass('wh-spinner-disabled');

    this.items[this.selectedindex].addClass('-wh-spinner-selected').addClass('wh-spinner-selected');

    this.fireEvent("change", { target: this
                             , value: this.items[this.selectedindex].get('data-value')
                             });
    if(animate)
    {
      this.listnode.tween('top',-1*newpos);
    }
    else
    {
      this.listnode.setStyle('top',-1*newpos);
      this.cleanupClones();
    }
  }

, destroy : function()
  {
    this.keys.deactivate();

    //cleanup events
    for(var e = 0; e < this.eventnodes.length;e++)
      this.eventnodes[e].removeEvents(['click']);

    this.node.removeEvents(['focus','blur']);

    for(var mykey in this.keys.options.events)
      this.keys.removeEvent(mykey,this.keys.options.events[mykey])
  }

, followCurrentState:function()
  {
    var ival      = this.input.get('value');
    var ireadonly = this.input.get('readonly');
    var imin      = this.input.get('min');
    var imax      = this.input.get('max');
    var istep     = this.input.get('step');

    if(this.lastattr.value!=ival)
    {
      this.input.fireEvent('change');
      this.lastattr.value = ival;
    }

    if(this.lastattr.min!=imin || this.lastattr.max!=imax || this.lastattr.step!=istep)
    {
      this.options.range.min  = imin;
      this.options.range.max  = imax;
      this.options.range.step = istep;
      this.buildlist();

      this.lastattr.min  = imin;
      this.lastattr.max  = imax;
      this.lastattr.step = istep;
    }

    if(this.lastattr.readonly != ireadonly)
    {
      if(ireadonly)
        this.input.fireEvent('disable');
      else
        this.input.fireEvent('enable');
      this.lastattr.readonly = ireadonly;
    }

    this.followCurrentState.delay(200);
  }
});


/*
 * Replace input and select with custom spinner, value will be stored in hidden input
 */
replaceSpinnerComponent = function(inputnode, options)
{
  var spinnerobj = null;
  var comp  = null;

  if(!options)
    options={ animate:true
            , enableproperychange : false
            , loop : false
            };

  if(typeof(options.animate) == "undefined")
    options.animate = true;

  if(typeof(options.enableproperychange) == "undefined")
    options.enableproperychange = false;

  if(typeof(options.loop) == "undefined")
    options.loop = false;


  if(inputnode.nodeName == 'INPUT')
  {
    comp = new Element('div');

    var startvalue = inputnode.getAttribute('min');
    var endvalue = inputnode.getAttribute('max');
    var step = inputnode.getAttribute('step');
    var selectedvalue = inputnode.getAttribute('value');
    options.range = { 'min'      : startvalue ? startvalue : selectedvalue
                    , 'max'      : endvalue ? endvalue : selectedvalue
                    , 'step'     : step ? step : 1
                    , 'value'    : selectedvalue
                    };
  }
  else if(inputnode.nodeName == 'SELECT')
  {
    comp = new Element('div');

    options.values = [];
    var selectedvalue = '';
    $(inputnode).getChildren('option').each(function(option)
    {
      options.values.push({ 'value'   : option.get("value") || option.get("text")
                          , 'title'   : option.get("label") || option.get("text")
                          , 'selected': option.get("selected")
                          , 'class'   : option.get("class")
                          });

      if(option.get("selected"))
        selectedvalue = option.get("value") || option.get("text");
    });

    options.range = null;
  }

  if(comp)
  {
    var tabindex = inputnode.getAttribute('tabindex');
    comp.set('tabindex', tabindex ? tabindex : 0);

    if(inputnode.get('class'))
      comp.addClass(inputnode.get('class'));

    comp.toggleClass('required',inputnode.getAttribute('required')!=null);
    comp.toggleClass('readonly',inputnode.getAttribute('readonly')!=null);
    comp.toggleClass('disabled',inputnode.getAttribute('disabled')!=null);

    options.readonly = comp.hasClass('readonly') || comp.hasClass('disabled');

    // Replace the current input with the new node
    inputnode.setStyle("display", "none")
         .parentNode.insertBefore($(comp), inputnode);

    spinnerobj = new $wh.Spinner(comp, options);

    spinnerobj.addEvent('change', function(obj)
    {
      inputnode.set('value', obj.value);
      $wh.fireHTMLEvent(inputnode,'change');
    });

    inputnode.addEvent('change', function()
    {
      spinnerobj.setValue(inputnode.value);
    });

    comp.store('wh-ui-replaces',inputnode);
    inputnode.store("wh-ui-replacedby", comp);

    //polling to detect changes that doesn't come from manual input
    if(options.enableproperychange)
    {
      spinnerobj.input = inputnode;
      spinnerobj.followCurrentState();

      inputnode.addEvent('change',function(){
        spinnerobj.setValue(inputnode.value);
      });

      inputnode.addEvent('enable',function(){
        comp.removeClass('-wh-spinner-readonly');
        comp.removeClass('wh-spinner-readonly');
        comp.removeClass('readonly');
        spinnerobj.options.readonly = false;
      });

      inputnode.addEvent('disable',function(){
        comp.addClass('-wh-spinner-readonly');
        comp.addClass('wh-spinner-readonly');
        comp.addClass('readonly');
        spinnerobj.options.readonly = true;
      });

    }

  }
  return spinnerobj;
}

$wh.convertSpinners = function(selector, options) //Legacy
{
  if(!options)
    options={ animate:true
            , enableproperychange : false
            , loop : false
            };

  if(typeof(options.animate) == "undefined")
    options.animate = true;

  if(typeof(options.enableproperychange) == "undefined")
    options.enableproperychange = false;

  if(typeof(options.loop) == "undefined")
    options.loop = false;

  $$(selector).each(function(inputnode)
  {
    replaceSpinnerComponent(inputnode,options);
  });
}

$wh.Spinner.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceSpinnerComponent, options);
}


})(document.id); //end mootools wrapper
