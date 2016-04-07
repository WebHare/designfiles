/* generated from Designfiles Public by generate_data_designfles */
require ('./calendar2.css');
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.ui.base');
require ('frameworks.mootools.more.keyboard');
require ('frameworks.mootools.more.date');
require ('wh.ui.spinner');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.ui.base
    LOAD: frameworks.mootools.more.keyboard
    LOAD: frameworks.mootools.more.date

    LOAD: wh.ui.spinner
!*/

//Load any needed localizations yourself: frameworks.mootools.more.locale.nl-nl.date, frameworks.mootools.more.locale.es-es.date, frameworks.mootools.more.locale.de-de.date, frameworks.mootools.more.locale.fr-fr.date

/*

Converting calendar.js code to calendar2.js

    Changed classes
      - .-wh-calendar-popup   ->   .wh-datepicker > .value
      - .-wh-calendar-icon    ->   .wh-datepicker > .arrow

    Changed <input> attributes:
      - data-formatting -> data-format
      - data-empty -> placeholder

    Load:
      LOAD: wh.ui.calendar2
      LOAD: wh.locale.common.de-de.date
      LOAD: wh.locale.common.en-us.date
      LOAD: wh.locale.common.nl-nl.date

    Taal instellen:
      Locale.use("de-DE");
      Locale.use("en-US");
      Locale.use("nl-NL");
*/


(function($) { //mootools wrapper


/*
 * $wh.CalendarTable
 * Builds a plain calendar table based on mootools locale settings
 *
 */

$wh.CalendarTable = new Class(
{ Implements: [Options]
 ,options : { show_weeknr    : false
            , header_weeknr  : '' //weeknr.
            , min : null //minimal date
            , max : null //maximal date (out of range gets disabled class
            }
 ,cdate   : null
 ,showdate: null
 ,cgrid   : []

 ,initialize : function(options)
  {
    this.setOptions(options);
  }

 ,buildMonthGrid: function(showdate)
  {//Build grid where each column is corresponds with a weekday, each row a week
    showdate.clearTime();//set h:m:s to 0
    var dateobj = showdate.clone();
    this.cgrid = [];
    var cols = 7;

    var startweekday = Locale.get('Date.firstDayOfWeek');
    var lastday = dateobj.get('lastdayofmonth');

    dateobj.set('date',1);//start of selected month
    var startindex = 1*dateobj.format('%w') - startweekday;
    if(startindex < 0) startindex+=7;
    if(startindex == cols)
      startindex = 0;

    var rows   = Math.ceil((lastday + startindex) / cols);

    dateobj.increment('day', -1*startindex);
    for(var r = 0; r < rows; r++)
    {
      var col = [];
      for(var c = 0; c < cols; c++)
      {
        var celldate = dateobj.clone();
        celldate.increment('day', (r*cols) + c);
        col.push(celldate);
      }
      this.cgrid.push(col);
    }
  }

 ,getTable: function(showdate, options)
  {
    this.setOptions(options);

    this.buildMonthGrid(showdate);

    var caltable = new Element('table',{'class':'wh-calendar-days'});
    var calbody = new Element('tbody');
    caltable.adopt(calbody);

    var weekdays = Locale.get('Date.days_abbr');
    var startday = Locale.get('Date.firstDayOfWeek');

    var mindatestr = '';
    if(this.options.min)
      mindatestr = this.options.min.format('%Y-%m-%d');

    var maxdatestr = '';
    if(this.options.max)
      maxdatestr = this.options.max.format('%Y-%m-%d');

    //Build week rows
    var rownode = new Element('tr',{'class':'weekdays'});
    if(this.options.show_weeknr)
    {
      var nrnode = new Element('th',{'class':'weeknr'}).inject(rownode);
      new Element('span',{ 'text' : this.options.header_weeknr }).inject(nrnode);
    }
    for(var w = startday; w < 7+startday; w++)
    {
      var daynamenode = new Element('th').inject(rownode);
      new Element('span',{ 'text' : weekdays[w%7] }).inject(daynamenode);
      if(w == startday)
        daynamenode.addClass('firstdaycol');
      if(w == 6+startday)
        daynamenode.addClass('lastdaycol');
    }

    calbody.adopt(rownode);

    var todayymd  = new Date().format('%Y-%m-%d');
    var curym     = showdate.format('%Y-%m');

    for(var r = 0; r < this.cgrid.length; r++)
    {
      var weeknr = this.cgrid[r][0].get('Week');

      var posclass = (r == 0 ? ' firstrow' : '');
      if(r == this.cgrid.length - 1) posclass+=' lastrow';

      var rownode = new Element('tr',{'class':'week' + (r%2 ? ' odd' : ' even') + posclass});

      if(this.options.show_weeknr)
        rownode.adopt(new Element('td',{'class':'weeknr','text':weeknr.toInt()}));

      for(var c = 0; c < this.cgrid[r].length; c++)
      {
        var ym  = this.cgrid[r][c].format('%Y-%m');
        var ymd = this.cgrid[r][c].format('%Y-%m-%d');
        var cssclass = '';
        if(ym < curym) cssclass = ' day-previous-month';
        if(ym > curym) cssclass = ' day-next-month';

        if(ymd == todayymd)
          cssclass+=' today';

        if(c == 0)
          cssclass+=' firstdaycol';
        if(c == this.cgrid[r].length-1)
          cssclass+=' lastdaycol';

        var datewrapper = new Element('span',{'text' : this.cgrid[r][c].get('Date')});

        var daynode = new Element('td',{'class' : 'day' + cssclass + (c%2 ? ' odd' : ' even'), 'data-date' : ymd});

        if(mindatestr && ymd < mindatestr)
          daynode.addClass('disabled');

        if(maxdatestr && ymd > maxdatestr)
          daynode.addClass('disabled');

        daynode.adopt(datewrapper);
        rownode.adopt(daynode);
      }
      calbody.adopt(rownode);
    }

    return caltable;
  }

});


$wh.Calendar2 = new Class(
{ Implements: [Events,Options]
, Extends: $wh.CalendarTable
, options : { show_weeknr:   false
            , date:          null   // initial value
            , min:           null
            , max:           null
            }
, node : null
, tablenode: null
, yearselectnode : null
, monthselectnode : null
, date: null //selected date
, keys : null
, focusednode: null

, initialize : function(container, options)
  {
    this.node = container;
    this.setOptions(options);

    this.node.addEvent('focus',this.focus.bind(this));
    this.node.addEvent('blur', this.blur.bind(this));

    this.node.addEvent('focus:relay(td.day > span)',this.focus.bind(this));
    this.node.addEvent('blur:relay(td.day > span)',this.blur.bind(this));

    if(!this.options.date)
      this.options.date = new Date();
    else
      this.date = this.options.date.clone();

    if(!this.options.max)
    {
      this.options.max = this.options.date.clone();
      this.options.max.increment('year',100);
    }

    if(!this.options.min)
    {
      this.options.min = this.options.date.clone();
      this.options.min.increment('year',-100);
    }

    if(this.options.date && this.options.min.diff(this.options.date) < 0)
      this.options.date = this.options.min.clone();

    if(this.options.date && this.options.date.diff(this.options.max) < 0)
      this.options.date = this.options.max.clone();

    this.parent(this.options);

    this.setMonthTable(this.options.date);

    this.node.addEvent('click:relay(td.day > span)',function(ev)
    {
      var newdate = Date.parse(ev.target.getParent('td.day').get('data-date'));

      //changed and within given range
      if(this.options.min.diff(newdate) >= 0 && newdate.diff(this.options.max) >= 0)
      {
        if(newdate != this.date)
        {
          this.node.fireEvent('change',newdate);
          this.date = newdate;
        }
        else
        {
          this.node.fireEvent('cancel');
        }
      }
    }.bind(this));

    //build calendar interface:
    var headernode = new Element('div',{'class':'header'});
    //month pulldown
    var selectedmonth = Number(this.options.date.get('Month'));
    this.monthselectnode = new Element('select',{'class' : 'wh-pulldown wh-calendar-month'}).inject(headernode);
    var months = Locale.get('Date.months');
    for(var m = 0; m < months.length; m++)
      this.monthselectnode.adopt(new Element('option',{'text' : months[m], 'selected' : m == selectedmonth, 'value' : m}));

    //year spinner
    var minyear = Number(this.options.min.get('FullYear'));
    var maxyear = Number(this.options.max.get('FullYear'));
    var selectedyear = Number(this.options.date.get('FullYear'));

    this.yearselectnode = new Element('input'
           , { 'type' : 'number'
             , 'class' : 'wh-spinner wh-calendar-year'
             , 'value' : selectedyear
             , 'step' : '1'
             , 'min' : minyear
             , 'max' : maxyear
             });
    headernode.adopt(this.yearselectnode);
    this.yearselectnode.setAttribute('value',selectedyear);//PATCH, WHY??? value in above line is ignored by mootools??

    //prev/next arrows
    new Element('div',{'class' : 'previous'}).inject(headernode).addEvent('click', this.previousMonth.bind(this));
    new Element('div',{'class' : 'next'}).inject(headernode).addEvent('click', this.nextMonth.bind(this));

    this.monthselectnode.addEvent('change',function(ev)
    {
      if(ev)
        ev.stop();
      this.options.date.set('month',this.monthselectnode.get('value'));
      this.setMonthTable(this.options.date);
    }.bind(this));

    this.yearselectnode.addEvent('change',function(ev)
    {
      if(ev)
        ev.stop();
      var iyear = Number(this.yearselectnode.get('value'));

      this.options.date.set('year',iyear);
      this.setMonthTable(this.options.date);
    }.bind(this));

    //buttons: cancel/today/empty
    var buttonlabels = Locale.get('wh-common.buttons');

    var btnbarnode = new Element('div',{'class':'button-bar'});
    if(buttonlabels.cancel)
    {
      new Element('button',{'text' : buttonlabels.cancel, 'name':'cancel'}).inject(btnbarnode).addEvent('click',function()
      {
        this.node.fireEvent('cancel');
      }.bind(this));
    }
    var btngroupnode = new Element('div',{'class':'button-group'}).inject(btnbarnode);
    if(buttonlabels.today)
    {
      new Element('button',{'text' : buttonlabels.today, 'name':'today', 'class' : 'cta'}).inject(btngroupnode).addEvent('click', function()
      {
        this.date = new Date();
        this.node.fireEvent('change',this.date);
      }.bind(this));
    }

    if(buttonlabels.none)
    {
      new Element('button',{'text' : buttonlabels.none, 'name':'empty'}).inject(btngroupnode).addEvent('click', function()
      {
        this.date = null;
        this.node.fireEvent('change',this.date);
      }.bind(this));
    }

    this.node.adopt(headernode, this.tablenode, btnbarnode);

    $wh.applyReplaceableComponents(this.node);

    this.keys = new Keyboard({ defaultEventType: 'keydown'
                             , events: { 'enter': this.onKeyEnter.bind(this)
                                       , 'esc'  : this.onKeyEsc.bind(this)
                                       , 'right': this.nextMonth.bind(this)
                                       , 'left' : this.previousMonth.bind(this)
                                       }
                            });

    Locale.addEvent("change", this.onLanguageChange.bind(this));
  }

, onLanguageChange : function()
  {
    var buttonlabels = Locale.get('wh-common.buttons');
    this.node.getElements('button').each(function(node)
    {
      var name = node.name;
      if(name && buttonlabels[name])
        node.set('text',buttonlabels[name]);
    });

    var months = Locale.get('Date.months');
    this.monthselectnode.getElements('option').each(function(node,m)
    {
      node.set('text',months[m]);
    });

    //refresh pulldown, this also triggers refresh of the table content
    this.monthselectnode.fireEvent('change');
  }

, setMonthTable : function(showdate)
  {
    var newtable = this.getTable(showdate);

    newtable.getElements('td.day > span').set('tabindex','0');//so we can use tab for selecting a day

    if(this.tablenode)
      newtable.replaces(this.tablenode);

    this.tablenode = newtable;

    //set selection:
    if(this.date)
      this.tablenode.getElements('td.day[data-date=' + this.date.format('%Y-%m-%d') + ']').addClass('selected');

  }

, onKeyEnter : function()
  {
    var daynode = $wh.getActiveElement(document).getParent('td.day');
    if(daynode)
    {
      var newdate = Date.parse(daynode.get('data-date'));
       //changed and withing given range
      if(this.options.min.diff(newdate) >= 0 && newdate.diff(this.options.max) >= 0)
      {
        if(newdate != this.date)
        {
          this.node.fireEvent('change',newdate);
          this.date = newdate;
        }
        else
        {
          this.node.fireEvent('cancel');
        }
      }
    }
  }

, onKeyEsc : function()
  {
    this.node.fireEvent('cancel');
  }

, focus : function()
  {
    this.keys.activate();
    this.focusednode = $wh.getActiveElement(document);
  }

, blur : function()
  {
    this.keys.deactivate();
    this.focusednode = null;
  }

, destroy : function()
  {
    this.keys.deactivate();
    this.node.destroy();
  }

, nextMonth : function()
  {
    var curyear = this.options.date.get('FullYear');
    this.options.date.increment('month',1);

    var y = this.options.date.get('FullYear');
    if(y != curyear)
    {
      this.yearselectnode.set('value',y);
      $wh.fireHTMLEvent(this.yearselectnode,'change');
    }

    this.monthselectnode.set('value',this.options.date.get('Month'));
    $wh.fireHTMLEvent(this.monthselectnode,'change');
  }

, previousMonth : function()
  {
    var curyear = this.options.date.get('FullYear');
    this.options.date.increment('month',-1);

    var y = this.options.date.get('FullYear');
    if(y != curyear)
    {
      this.yearselectnode.set('value',y);
      $wh.fireHTMLEvent(this.yearselectnode,'change');
    }

    this.monthselectnode.set('value',this.options.date.get('Month'));
    $wh.fireHTMLEvent(this.monthselectnode,'change');
  }


});



/*
 * $wh.CalendarPicker
 * Binds click event to elements given by selector
 *  which activates the calendar date picker popup
 * Given elements must have attributes:
 *  data-date : formatted date Y-m-d
 *  data-format: date display format
 */
$wh.DateField = new Class(
{ Implements: [Events,Options]
, options: { show_weeknr : true
           , max : null
           , min : null
           , enablecalendar : true //enable calendar popup
           , onlycalendar: false //if calendar popup enabled, value cannot be edited manually
           , calendarreferencenode : null //if not attach to body set other node where calendar should inject / positioned
           }
, el : null
, node : null
, arrownode: null
//, date : null
, keys : null
, formatstr : ''
, calendar : null
, calendarnode : null
, valuenode : null
, closefn : null

, seperator : ''
, manualinputparts: []

, initialize : function(el, options)
  {
    this.setOptions(options);
    this.el = $(el);

    this.options.calendarreferencenode = $(this.options.calendarreferencenode);

    if(!this.options.calendarreferencenode)
      this.options.calendarreferencenode = $(document.body);

    this.formatstr = this.el.get('data-format');
    if(!this.formatstr)
      this.formatstr = Locale.get('Date.shortDate');

    // sets the value for this.seperator and this.manualinputparts
    this.determineInputFormat();

    var today = new Date();

    var min = this.el.get('min');
    if(min)
      this.options.min = Date.parse(min);
    else
      this.options.min = today.clone().increment('year', -100);

    var max = this.el.get('max');
    if(max)
      this.options.max = Date.parse(max);
    else
      this.options.max = this.options.min.clone().increment('year', 200);

   /* var tabindex = el.get('tabindex');
    if(!tabindex)
      tabindex = '0';
   */

    this.buildnode();
    this.refresh();

    this.el.addEvent("change", this.refresh.bind(this));
    this.el.addEvent("wh-refresh", this.refresh.bind(this));
  }
, determineInputFormat: function()
  {
    //try to get number seperator, assume seperator is always equal between all numbers
    var formatkar = '';
    for(var c = 0; c < this.formatstr.length; c++)
    {
      var kar = this.formatstr[c];
      if(kar == '%')
      {
        if(formatkar != '' && this.seperator!='')
          break;
        formatkar = kar;
      }
      else if(formatkar == '%')
        formatkar += kar;
      else if(formatkar != '')
        this.seperator+=kar;
    }

    var today = new Date();

    var testformattedparts = today.format(this.formatstr);
    testformattedparts.split(this.seperator).each(function(datepart)
    {
      var l = datepart.length;
      this.manualinputparts.push(l < 2 ? 2 : l);//store stringlength for each part, needed for 'on the fly' formatting if keyboard input
    }.bind(this));

  }
, _getReplacedNodeDate:function()
  {
    var nodedate = Date.parse(this.el.value);
    return nodedate && nodedate.isValid() ? nodedate : null;
  }

, buildnode: function()
  {
    this.node = new Element('div', { 'class' : 'wh-datepicker'/*, 'tabindex' : tabindex */});

    this.node.toggleClass('required',this.el.getAttribute('required')!=null);
    this.node.toggleClass('readonly',this.el.getAttribute('readonly')!=null);
    this.node.toggleClass('disabled',this.el.getAttribute('disabled')!=null);

    var enablecalendar = this.options.enablecalendar && !this.node.hasClass('readonly') && !this.node.hasClass('disabled');

    // If the calendar is enabled, and we only allow editing via the calendar (onlycalendar = true) mark the input as readonly
    // If this logic changes, also change in .refresh()!
    this.valuenode = new Element('input', { 'class' : 'value' }).inject(this.node);
    this.valuenode.disabled = this.node.hasClass('disabled');
    this.valuenode.readOnly = (enablecalendar && this.options.onlycalendar && !this.node.hasClass('disabled')) || this.node.hasClass('readonly');

    this.arrownode = new Element('span', { 'class' : 'arrow' });
    if (enablecalendar)
      this.node.appendChild(this.arrownode);

    this.node.inject(this.el,'before');

    this.keys = new Keyboard({ defaultEventType: 'keydown'
                             , events: { 'enter': this.confirmManualDate.bind(this)
                                       , 'down': this.showCalendar.bind(this)
                                       }
                            });
    this.valuenode.addEvent('change',this.confirmManualDate.bind(this));
    this.valuenode.addEvent('input',this._input.bind(this));

    this.node.addEvent('focus',this.focus.bind(this));
    this.valuenode.addEvent('focus',this.focus.bind(this));

    this.node.addEvent('blur',this.blur.bind(this));
    this.valuenode.addEvent('blur',this.blur.bind(this));

    this.arrownode.addEvent('click',this.showCalendar.bind(this));

    this.keys.addEvent('keyup',this.formatManualInput.bind(this));

    this.node.store('wh-ui-replaces',this.el);
    this.valuenode.store('wh-ui-replaces',this.el);
    this.el.store("wh-ui-replacedby", this.node);
  }

  // set the data based on the textual content of the original date input
, confirmManualDate : function()
  {
    $wh.fireHTMLEvent(this.el, 'change');
  }
, _input : function()
  {
    var newdate = this.valuenode.value;
    newdate = newdate.split('/').join('-').split('.').join('-');
    var parts = newdate.split('-');

    if(parts.length == 3)//parseable
    {
      var dayoffset = this.formatstr.indexOf('d');
      var monthoffset = this.formatstr.indexOf('m');
      var yearoffset = this.formatstr.toLowerCase().indexOf('y');

      var daypos = 0 + (dayoffset > monthoffset ? 1 : 0) + (dayoffset > yearoffset ? 1 : 0);
      var monthpos = 0 + (monthoffset > dayoffset ? 1 : 0) + (monthoffset > yearoffset ? 1 : 0);
      var yearpos = 0 + (yearoffset > dayoffset ? 1 : 0) + (yearoffset > monthoffset ? 1 : 0);

      var day = parseInt(parts[daypos],0);
      var month = parseInt(parts[monthpos],0);
      var year = parseInt(parts[yearpos],0);

      if(day&&month&&year)
        this.el.value = new Date(year,month-1,day).format('%Y-%m-%d');
      else
        this.el.value = ''
    }
   else
      this.el.value = ''

    $wh.fireHTMLEvent(this.el, 'input');
  }

, formatManualInput : function(ev, checkinput)
  {
    if(['right','left','up','down','shift','control','esc'].contains(ev.key))
      return;

    var orglen = this.valuenode.value.length;
    var selpos = this.valuenode.selectionStart != null ? this.valuenode.selectionStart : -1;//used to putback cursor in current positiom

    val = this.valuenode.value.replace(/[^0-9]+/g,' ');//replace everything that isn't a number with space

    val = val.replace( /\s+/g, ' ');//remove double spaces

    var parts = [];

    if(val != ' ')
      parts = val.split(' ');

    if(parts.length && parts[0] == '')
      parts.splice(0,1);

    var formattedstr = '';
    var seperatorcount = 0;
    for(var c = 0; c < parts.length; c++)
    {
      if(parts[c] != '')
      {
        if(parts[c]!='' && parts[c].length > this.manualinputparts[c])
        {//split/check max. nr digits for each datepart
          var rest = parts[c].substr(this.manualinputparts[c]);
          parts[c] = parts[c].substr(0,this.manualinputparts[c]);
          if(c < this.manualinputparts.length - 1)
            parts.splice(c+1, 0, rest);
        }

        formattedstr += parts[c];
        if(seperatorcount < 2 && c <= parts.length - 2)
        {
          formattedstr += this.seperator;
          seperatorcount++;
        }
      }
    }
    this.valuenode.set('value',formattedstr);

    if(selpos > -1)
    {
      this.valuenode.selectionStart = selpos - (orglen - formattedstr.length);
      this.valuenode.selectionEnd = selpos - (orglen - formattedstr.length);
    }

  }

, focus : function()
  {
    if(!this.node.hasClass('readonly'))
      this.keys.activate();
  }

, blur : function()
  {
    if(!this.node.hasClass('readonly'))
      this.keys.deactivate();
  }

, showCalendar : function(ev)
  {
    ev.stop();

    if(this.calendar || !this.options.enablecalendar)
      return; //Calendar already opened or not enabled

    $wh.focus(this.valuenode);
    this.options.date = this._getReplacedNodeDate();
    this.calendarnode = new Element('div', {'class' : 'wh-calendar', 'tabindex' : '0'}).inject(this.options.calendarreferencenode);

    this.calendar = new $wh.Calendar2(this.calendarnode, this.options);
    this.calendarnode.addEvent('change', this._gotCalendarDate.bind(this));
    this.calendarnode.addEvent('cancel', this._hideCalendar.bind(this));

    this.positionCalendar();

    this.calendarnode.focus();

    this.closefn = this._hideCalendar.bind(this, true);
    $(document.body).addEvent('click', this.closefn );//catch click outside calendar
  }

, positionCalendar : function()
  {
    var calendarsize = this.calendarnode.getSize();
    var inputpos  = this.node.getPosition(this.options.calendarreferencenode);
    var inputsize = this.node.getSize();
    var windowsize = $(window).getSize();
    //ADDME: Quick hack to fix positioning relative to scrolled document.body
    var scroll = this.options.calendarreferencenode != document.body ? this.options.calendarreferencenode.getScroll()
                                                                     : { x: 0, y: 0 };

    var x = inputpos.x + scroll.x;
    var y = inputpos.y + inputsize.y + scroll.y;

    if(x + calendarsize.x > windowsize.x + scroll.x)
      x -= (calendarsize.x - inputsize.x);

    if(y + calendarsize.y > windowsize.y + scroll.y)
      y -= (inputsize.y+calendarsize.y);

    //FIXME: Better position checking than this (e.g. 'is the calendar 100% visible' checks)
    if(x < 0)
      x = 0;
    if(y < 0)
      y = 0;
    this.calendarnode.setStyles({'left':x,'top':y});
  }

, _gotCalendarDate:function(ev)
  {
    this._hideCalendar();
    $wh.changeValue(this.el, ev ? ev.format('%Y-%m-%d') : '');
  }

, _hideCalendar : function(checktarget,ev)
  {
    if(checktarget && ev && ev.target.getParent('.wh-calendar'))
      return;

    if(this.calendar)
    {
      this.calendar.destroy();
      this.calendar = null;
      $(document.body).removeEvent('click', this.closefn );
    }
    this.node.focus();
  }
/*
  // date - JS date object
, setDate : function(date)
  {
    this._doSetDate(date,true);
  }
*/
, refresh: function()
  {
    var date = this._getReplacedNodeDate();
    this.valuenode.setAttribute("placeholder", this.el.getAttribute("placeholder") || '');
    this.valuenode.set('value', date ? date.format(this.formatstr) : '');

    // Copy required, readonly and disabled from replaced node
    this.node.toggleClass('required',this.el.getAttribute('required')!=null);
    this.node.toggleClass('readonly',this.el.getAttribute('readonly')!=null);
    this.node.toggleClass('disabled',this.el.getAttribute('disabled')!=null);

    var enablecalendar = this.options.enablecalendar && !this.node.hasClass('readonly') && !this.node.hasClass('disabled');
    this.valuenode.disabled = this.node.hasClass('disabled');
    this.valuenode.readOnly = (enablecalendar && this.options.onlycalendar && !this.node.hasClass('disabled')) ||  this.node.hasClass('readonly');

    if (enablecalendar != !!this.arrownode.parentNode)
    {
      if (enablecalendar)
        this.node.appendChild(this.arrownode)
      else
        this.node.removeChild(this.arrownode)
    }

    if(this.calendar)
      this._hideCalendar();
/*
    if(fireevent)
      $wh.fireHTMLEvent(this.el,'change');*/
  }

, toElement: function()
  {
    return this.node;
  }
});

function replaceDateField(input, options)
{
  var comp = new $wh.DateField(input,options);
  input.store("wh-ui-replacedby", $(comp))
       .parentNode.insertBefore($(comp), input);

  $(comp).store("wh-ui-replaces", input);

  $(input).set('tabindex',-1);//after replacement disable selection by tab
}

$wh.DateField.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceDateField, options);
}

})(document.id); //end mootools wrapper
