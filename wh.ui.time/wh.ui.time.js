/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('frameworks.mootools.more.keyboard');
require ('wh.ui.base');
/*! LOAD: frameworks.mootools.core, wh.compat.base, frameworks.mootools.more.keyboard, wh.ui.base
!*/

(function($) { //mootools wrapper


/*
 * $wh.TimeField
 * Splits time input into two separate inputs (hour / minute)
 */
$wh.TimeField = new Class(
{ Implements: [Events,Options]
, Binds: [ '_gotRefresh', '_gotKeyDown', '_gotKeyUp', '_gotChange', '_gotFocus' ]
, options: {    }

  /// Replaced node
, el : null

  /// Our container
, node : null

  /// current precision (of el.value): minutes/seconds/milliseconds
, currentprecision: ''

  /// input elements
, hournode : null
, minutenode : null
, secondsnode : null
, millisecondsnode : null

, initialize : function(el, options)
  {
    this.setOptions(options);
    this.el = $(el);

    var val = this.el.get('value');
    if(val != null)
    {
      this.date = Date.parse(val);
      if(this.date && !this.date.isValid())
        this.date = null;
    }

  //  var tabindex = el.get('tabindex');
  //  if(!tabindex)
  //    tabindex = '0';

    this.el.addEvent('wh-refresh', this._gotRefresh);

    this.node = new Element('div', { 'class' : 'wh-timeinput'});//, 'tabindex' : tabindex });
    this.node.addEvent('keyup:relay(input)', this._gotKeyUp);
    this.node.addEvent('keydown:relay(input)', this._gotKeyDown);
    this.node.addEvent('change:relay(input)', this._gotChange);
    this.node.addEvent('input:relay(input)', this._setTime.bind(this,true));//no padding with '0' during typing
    this.node.addEvent('focus:relay(input)', this._gotFocus);

    this.refresh();

    this.node.store('wh-ui-replaces',this.el);
    this.el.store("wh-ui-replacedby", this.node);
  }

, refresh: function()
  {
    this.node.toggleClass('required',this.el.getAttribute('required')!=null);
    this.node.toggleClass('readonly',this.el.getAttribute('readonly')!=null);
    this.node.toggleClass('disabled',this.el.getAttribute('disabled')!=null);

    // Determine precision from element value
    var testvalue = this.el.value || '00:00';
    var step = parseFloat(this.el.getAttribute('step') || '60'); // step precision in seconds

    var precision = "minutes";
    if (testvalue.indexOf(".") != -1 || ((step % 1) != 0))
      precision = "milliseconds";
    else if (testvalue.split(':').length >= 3 || ((step % 60) != 0))
      precision = "seconds";

    // Regenerate components if the precision changed
    if (this.currentprecision != precision)
    {
      this.currentprecision = precision;
      this._regenerateParts();
    }

    // Update required/readonly/diasabled attributes
    var elts = this.node.getElements('input');
    elts.forEach(function(subnode)
    {
      if (this.node.hasClass('required'))
        subnode.setAttribute('required', '');
      else
        subnode.removeAttribute('required');

      if (this.node.hasClass('readonly'))
        subnode.setAttribute('readonly', '');
      else
        subnode.removeAttribute('readonly');

      if (this.node.hasClass('disabled'))
        subnode.setAttribute('disabled', '');
      else
        subnode.removeAttribute('disabled');
    }.bind(this));

    // Update component values from replaced element value
    var timeparts = this.el.value != '' ? this.el.value.replace('.', ':').split(':') : [];
    for(var c = 0; c < timeparts.length; c++)
    {
      if(c == 0)
        this.hournode.value = timeparts[c];
      if(c == 1)
        this.minutenode.value = timeparts[c];
      if(c == 2 && this.secondsnode)
        this.secondsnode.value = timeparts[c];
      if(c == 3 && this.millisecondsnode)
        this.millisecondsnode.value = timeparts[c];
    }
  }

  /** Regenerates the subcomponents of this timefield
  */
, _regenerateParts: function()
  {
    this.node.empty();

    this.hournode = new Element('input', { 'type': 'text', 'maxlength': '2' }).inject(this.node);
    new Element('span', { 'text' : ':' }).inject(this.node);
    this.minutenode = new Element('input', { 'type': 'text', 'maxlength': '2' }).inject(this.node);

    if (this.currentprecision == 'seconds' || this.currentprecision == "milliseconds")
    {
      new Element('span', { 'text' : ':' }).inject(this.node);
      this.secondsnode = new Element('input', { 'type': 'text', 'maxlength': '2' }).inject(this.node);
    }
    else
      this.secondsnode = null;

    if (this.currentprecision == "milliseconds")
    {
      new Element('span', { 'text' : '.' }).inject(this.node);
      this.millisecondsnode = new Element('input', { 'type': 'text', 'maxlength': '3', 'class': 'milliseconds' }).inject(this.node);
    }
    else
      this.millisecondsnode = null;

    this.hournode.setAttribute('placeholder', '00');
    this.minutenode.setAttribute('placeholder', '00');
    this.secondsnode && this.secondsnode.setAttribute('placeholder', '00');
    this.millisecondsnode && this.millisecondsnode.setAttribute('placeholder', '000');

    this.node.inject(this.el,'before');
    this.el.setStyle('display','none');
  }

, _gotRefresh: function(event)
  {
    // Re-read config & value from replaced input
    this.refresh();
  }

, _gotKeyUp: function(event, target)
  {
    // Key up - clean node value (replace non-numbers, clamp)
    this._reformatInput(target);
  }

, _gotKeyDown: function(event, target)
  {
    // Handle key up and key down events
    if (event.key == 'up')
    {
      this._trySpin(target, true);
      event.preventDefault();
    }
    else if (event.key == 'down')
    {
      this._trySpin(target, false);
      event.preventDefault();
    }
  }

, _gotFocus: function(event, target)
  {
    target.select();
  }

, _gotChange: function(event, target)
  {
    // Value in subcomponent changed, set the value of the replaced element
    this._setTime();
  }

  /** Spin the value of a subcomponent up or down
  */
, _trySpin: function(node, isup)
  {
    this._reformatInput(node);
    var range = this._getNodeRange(node);

    // don't change more than range.maxval!
    var change = isup ? 1 : -1;

    var newval = parseInt(node.value) + change;
    if ((newval < range.maxval) && (newval >= 0))
    {
      node.value = (newval + range.maxval) % range.maxval;
      this._setTime();
      return true;
    }

    if (!range.prevnode)
      return false;

    if (this._trySpin(range.prevnode, isup))
    {
      node.value = isup ? 0 : range.maxval - 1;
      this._setTime();
      return true;
    }
  }

  /** Get ranges of an subcomponent input
      @param node input node
      @return
      @cell return.maxlen Max nr of characters in this input
      @cell return.maxvalue Limit of value in this input (eg. 60)
      @cell return.prevnode Previous node (eg for minute node: hours node)
  */
, _getNodeRange: function(node)
  {
    var maxlen = 2;
    var maxval = 60;
    var prevnode = null;
    if (node == this.millisecondsnode)
    {
      maxlen = 3;
      maxval = 1000;
      prevnode = this.secondsnode;
    }
    else if (node == this.secondsnode)
      prevnode = this.minutenode;
    else if (node == this.minutenode)
      prevnode = this.hournode;
    else if (node == this.hournode)
      maxval = 24;
    return { maxval: maxval, maxlen: maxlen, prevnode: prevnode };
  }

  /** Clean input & clamp)
  */
, _reformatInput: function(node)
  {
    var range = this._getNodeRange(node);

    var val = node.value.replace(/[^0-9]+/g,'').substr(0, range.maxlen);//only allow numbers, max 2 digits
    if(parseInt(val) >= range.maxval)
      val = range.maxval - 1;

    if (node.value != val)
      node.value = val;
  }

  /** Add padding to node
  */
, _padNode: function(node, padding)
  {
    if (node && node.value != '')
    {
      var newval = (padding + node.value).substr(node.value.length);
      if (node.value != newval)
        node.value = newval;
    }
  }

  /** Read the currently entered time from the subcomponent inputs, place it in the replaced element
  */
, _setTime: function(nopadding)
  {
    if(!nopadding)
    {
      this._padNode(this.hournode, '00');
      this._padNode(this.minutenode, '00');
      this._padNode(this.secondsnode, '00');
      this._padNode(this.millisecondsnode, '000');
    }

    var newval = '';
    if (this.hournode.value != '' && this.minutenode.value != '')
    {
      var prevtime = this.el.value;
      newval = this.hournode.value != '' ? this.hournode.value + ':' + this.minutenode.value : '';

      if(this.secondsnode && this.secondsnode.value != '')
      {
        newval += ':' + this.secondsnode.value;
        if(this.millisecondsnode && this.millisecondsnode.value != '')
          newval += '.' + this.millisecondsnode.value;
      }
    }

    if (newval != this.el.value)
    {
      this.el.value = newval;
      $wh.fireHTMLEvent(this.el,'change');
    }
  }
});

function replaceTimeField(input, options)
{
  new $wh.TimeField(input,options);
  $(input).set('tabindex',-1);//after replacement disable selection by tab
}

$wh.TimeField.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceTimeField, options);
}

})(document.id); //end mootools wrapper
