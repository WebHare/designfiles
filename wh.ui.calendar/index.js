/* generated from Designfiles Public by generate_data_designfles */
require ('./calendar.css');
require ('../frameworks.mootools');
require ('../wh.compat.base');
require ('../frameworks.mootools.more.date');
require ('../frameworks.mootools.more.keyboard');
require ('../wh.ui.base');
/*! LOAD: frameworks.mootools, wh.compat.base, frameworks.mootools.more.date, frameworks.mootools.more.keyboard, wh.ui.base
!*/

//Load any needed localizations yourself: frameworks.mootools.more.locale.nl-nl.date, frameworks.mootools.more.locale.es-es.date, frameworks.mootools.more.locale.de-de.date, frameworks.mootools.more.locale.fr-fr.date

if ($wh.config && !$wh.config.islive)
  console.warn("wh.ui.calendar is deprecated, use wh.ui.calendar2 instead");

/*
 * $wh.Calendar
 * Builds a calendar table based on Locale settings
 *
 * TODO:
 *  available and blocked dates
 *  option to add a list of eventdates with content/css-class so these can be retrieved on events
 *  option to keep the selected day of month selected as much as possible while browsing to other months/years
 *  option to have an OK button to select a date instead of autoclosing when clicking a date

 FIXME: replace legacy classes
 FIXME: this.showHtml() is a bad name, use something like refresh(), generateDom() or ...
 */

(function($) { //mootools wrapper

$wh.Calendar = new Class(
{ Implements: [Events,Options]
 ,element : null
 ,options : { show_weeknr    : false
            , header_weeknr  : 'week'
            , month_format   : '%B %Y' //set empty '' to hide
            , initialdate    : null
            , datemarkers    : [] //array with json data {dateclass: '-wh-calendar-blocked', dates : ['%Y-%m-%d',..]}

           // , content_dates  : []//array with json data  {date : '%Y-%m-%d', info : {}}, stored in each corresponding cell node
           // , content_class  : '-wh-calendar-content'
            , dateClick      : null
            }

 ,eventnodes: []
 ,datenodes: []
 ,cdate   : null
 ,cgrid   : []
 ,today   : null
 ,allavailable : true
 ,blocklist : []
 ,availablelist: []

 ,initialize : function(element, options)
  {
    this.element=$(element);
    this.setOptions(options);

    this.today = new Date();

    this.cdate = this.options.initialdate ? this.options.initialdate.clone() : new Date();

    this.showHtml();
  }

 ,setDate: function(date)
  {
    this.cdate = date;

    this.showHtml();
  }

 ,setYear: function(year)
  {
    //this.cdate.set('date',1);//first day of the month
    this.cdate.set('year',year);

    this.showHtml();
  }

 ,setMonth: function(month, year)
  {//Month is zero based!!
    //this.cdate.set('date',1);//first day of the month
    this.cdate.set('month',month);
    this.cdate.set('year',year);

    this.showHtml();
  }

 ,setToday: function()
  {
    this.cdate = new Date();

    this.showHtml();
  }

 ,reset: function()
  {
    this.cdate = this.options.initialdate.clone();

    this.showHtml();
  }

 ,previousYear: function()
  {
    this.cdate.increment('year',-1);

    this.showHtml();
  }

 ,nextYear: function()
  {
    this.cdate.increment('year',1);

    this.showHtml();
  }

 ,previousMonth: function()
  {
    this.cdate.increment('month',-1);

    this.showHtml();
  }

 ,nextMonth: function()
  {
    this.cdate.increment('month',1);

    this.showHtml();
  }

 ,buildMonthGrid: function()
  {//Build grid where each column is corresponds with a unique weekday, each row a week

    this.cdate.clearTime();//set h:m:s to 0

    this.cgrid = [];

    var dateobj = this.cdate.clone();

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

 ,destroy: function()
  {
    //cleanup events
    for(var e = 0; e < this.eventnodes.length;e++)
      this.eventnodes[e].removeEvents(['click']);

    this.element.empty();
  }

 ,showHtml: function()
  {
    this.destroy();

    this.buildMonthGrid();

    var caltable = new Element('table',{'class':'-wh-calendar'});
    var calbody = new Element('tbody');
    caltable.adopt(calbody);

    var weekdays = Locale.get('Date.days_abbr');
    var startday = Locale.get('Date.firstDayOfWeek');

    if(this.options.month_format != '')
    {
      var rownode = new Element('tr',{'class':'-wh-calendar-month'});

      rownode.adopt(new Element('th',{ 'class'   : '-wh-calendar-month'
                                     , 'text'    : this.cdate.format(this.options.month_format)
                                     , 'colspan' : (this.options.show_weeknr ? 8 : 7)}));

      calbody.adopt(rownode);
    }

    //Build week rows
    var rownode = new Element('tr',{'class':'-wh-calendar-weekdays'});
    if(this.options.show_weeknr)
      rownode.adopt(new Element('th',{'class':'-wh-calendar-weeknr','text':this.options.header_weeknr}));
    for(var w = startday; w < 7+startday; w++)
      rownode.adopt(new Element('th',{'text':weekdays[w%7]}));

    calbody.adopt(rownode);

    var todayym   = this.today.format('%Y-%m');
    var todayymd  = this.today.format('%Y-%m-%d');

    var curym     = this.cdate.format('%Y-%m');
    var curymd    = this.cdate.format('%Y-%m-%d');

    var intialym  = this.options.initialdate ? this.options.initialdate.format('%Y-%m') : '';
    var intialymd = this.options.initialdate ? this.options.initialdate.format('%Y-%m-%d') : '';

    //Create a clean list of date markers needed for given month
    var markdates = [];
    var startymd = this.cgrid[0][0].format('%Y-%m-%d');
    var endymd   = this.cgrid[this.cgrid.length-1][6].format('%Y-%m-%d');
    for(var m = 0; m < this.options.datemarkers.length; m++)
    {
      var marks = {markerclass : this.options.datemarkers[m].dateclass, datelist : ''}
      for(var d = 0; d < this.options.datemarkers[m].dates.length; d++)
      {
        var ymd = this.options.datemarkers[m].dates[d];
        ymd = ymd.replace(/\d+/g, function(m){
          return "0".substr(m.length - 1) + m;//add leading zero if missing
        });

        if(ymd >= startymd && ymd <= endymd)
          marks.datelist+=ymd + ',';
      }
      if(marks.datelist != '')
        markdates.push(marks);
    }

    for(var r = 0; r < this.cgrid.length; r++)
    {
      var weeknr = this.cgrid[r][0].get('Week');

      var posclass = (r == 0 ? ' firstrow' : '');
      if(r == this.cgrid.length - 1) posclass+=' lastrow';

      var rownode = new Element('tr',{'class':'-wh-calendar-week' + (r%2 ? ' odd' : ' even') + posclass, 'data-week' : weeknr});

      if(this.options.show_weeknr)
        rownode.adopt(new Element('td',{'class':'-wh-calendar-weeknr','text':weeknr}));

      for(var c = 0; c < this.cgrid[r].length; c++)
      {
        var ym  = this.cgrid[r][c].format('%Y-%m');
        var ymd = this.cgrid[r][c].format('%Y-%m-%d');
        var cssclass = ' -wh-calendar-month';
        if(ym < curym) cssclass = ' -wh-calendar-prev-month';
        if(ym > curym) cssclass = ' -wh-calendar-next-month';

        if(ymd == todayymd)
          cssclass+=' -wh-calendar-today';

        if(ymd == intialymd)
          cssclass+=' -wh-calendar-selected';

        for(var m = 0; m < markdates.length; m++)
        {
          if(markdates[m].datelist.indexOf(ymd + ',') != -1)
            cssclass+=' ' + markdates[m].markerclass;
        }

        if(c == 0)
          cssclass+=' firstcol';
        if(c == this.cgrid[r].length-1)
          cssclass+=' lastcol';

        var datewrapper = new Element('span',{'text' : this.cgrid[r][c].get('Date')});

        var daynode = new Element('td',{'class' : '-wh-calendar-day' + cssclass + (c%2 ? ' odd' : ' even')}
                                 ).store('date',this.cgrid[r][c]);

        daynode.adopt(datewrapper);

        this.datenodes.push(daynode);

        rownode.adopt(daynode);
      }
      calbody.adopt(rownode);
    }

    caltable.addEvent('click:relay(td.-wh-calendar-day)',this.onDateClick.bind(this));

    this.element.adopt(caltable);
  }

 ,unpackDate: function(dateobj)
  {
    return { year    : dateobj.get('FullYear')
           , month   : dateobj.get('Month')
           , day     : dateobj.get('Date')
           , week    : dateobj.get('Week')
           , weekday : 1*dateobj.format('%w')
           }
  }

, onDateClick: function(evt)
  {
    var daynode = evt.target;
    if(!daynode.hasClass('-wh-calendar-day'))
      daynode = daynode.getParent('.-wh-calendar-day');

    this.fireEvent("change");
    this.options.dateClick(daynode, evt);
  }

});

/*
 * $wh.CalendarForm
 * Builds calendar with navigation elements
 *
 */

$wh.CalendarForm = new Class(
{ Implements: [Events,Options]
 ,element : null
 ,options : { initialdate    : null
            , dateClick      : null
            , limit_year_min : null
            , limit_year_max : null
            , show_weeknr    : true
            , header_weeknr  : ''
            , btn_cancel     : {'class':'-wh-calendar-cancel'}
            , btn_ok         : null
            , btn_empty      : null
            , btn_today      : null
            , btn_previous   : {'class':'-wh-calendar-btnprev'}
            , btn_next       : {'class':'-wh-calendar-btnnext'}

            , datemarkers    : [] //[{dateclass: '-wh-holiday', dates : ['2013-2-16','2014-1-22']}]
            }
 ,calendar: null
 ,eventnodes: []
 ,container: null
 ,selecteddate : null
 ,returnfn: null
 ,monthnodes:[]
 ,yearnodes:[]
 ,emptydate: false
 ,keys: null

, initialize : function(element, options)
  {
    this.element=$(element);
    this.setOptions(options);

    if(this.options.btn_cancel && !("text" in this.options.btn_cancel))
      this.options.btn_cancel.text = (window.Locale ? Locale.get('wh-common.buttons.cancel') : '') || 'Annuleren'; //for legacy compatibility, we're using the dutch word

    this.emptydate = !this.options.initialdate;
    var focusdate = this.options.initialdate ? this.options.initialdate : new Date();

    var focusyear = focusdate.get('year');
    if(this.options.limit_year_min)
    {
      if(focusyear < this.options.limit_year_min)
      {
        focusdate.set('date',1);
        focusdate.set('month',0);
        focusdate.set('year',this.options.limit_year_min);
      }
    }
    if(this.options.limit_year_max)
    {
      if(focusyear > this.options.limit_year_max)
      {
        focusdate.set('date',31);
        focusdate.set('month',11);
        focusdate.set('year',this.options.limit_year_max);
      }
    }

    this.options.initialdate = focusdate;

    if(!this.options.limit_year_min)
      this.options.limit_year_min = focusdate.get('year') - 100;

    if(!this.options.limit_year_max)
      this.options.limit_year_max = focusdate.get('year') + 100;

    if(typeof this.options.dateClick == 'function')
      this.returnfn = this.options.dateClick;

    this.options.dateClick = this.dateClicked.bind(this);

    this.keys= new Keyboard({ defaultEventType: 'keyup'
                            , events: { 'esc'   : this.close.bind(this)
                                      , 'left'  : this.previousMonth.bind(this)
                                      , 'right' : this.nextMonth.bind(this)
                                      , 'up'  : this.previousYear.bind(this)
                                      , 'down' : this.nextYear.bind(this)
                                      }
                           });

    this.showHtml();
    this.keys.activate();
  }

 ,previousMonth: function()
  {
    //check year range
    if(this.calendar.cdate.get('month') == 0 && this.calendar.cdate.get('year') <= this.options.limit_year_min)
      return;

    this.calendar.previousMonth();

    if (!!this.options.btn_ok)
      this.selectCurrentDate();

    //update pulldowns
    this.updatePulldowns(this.calendar.cdate);
  }

 ,nextMonth: function()
  {
    //check year range
    if(this.calendar.cdate.get('month') == 11 && this.calendar.cdate.get('year') >= this.options.limit_year_max)
      return;

    this.calendar.nextMonth();

    if (!!this.options.btn_ok)
      this.selectCurrentDate();

    //update pulldowns
    this.updatePulldowns(this.calendar.cdate);
  }

 ,nextYear: function()
  {
    //check year range
    if(this.calendar.cdate.get('year') >= this.options.limit_year_max)
      return;

    this.calendar.nextYear();

    if (!!this.options.btn_ok)
      this.selectCurrentDate();

    //update pulldowns
    this.updatePulldowns(this.calendar.cdate);
  }

 ,previousYear: function()
  {
    //check year range
    if(this.calendar.cdate.get('year') <= this.options.limit_year_min)
      return;

    this.calendar.previousYear();

    if (!!this.options.btn_ok)
      this.selectCurrentDate();

    //update pulldowns
    this.updatePulldowns(this.calendar.cdate);
  }

 ,setToday: function()
  {
    this.calendar.setToday();//update tablegrid

    //update pulldowns
    this.updatePulldowns(this.focusdate);

    //show selection in calendar
    this.selectCurrentDate();

    if (!this.options.btn_ok)
      this.returnfn(this.focusdate,'today');
 //   this.destroy();
  }

 ,close: function()
  {
    this.returnfn(this.emptydate ? null : this.options.initialdate,'cancel');
  //   this.destroy();
  }

 ,submit: function()
  {
    this.returnfn(this.calendar.cdate,'date');
  //   this.destroy();
  }

 ,setEmptyDate: function()
  {
    this.returnfn(null,'empty');
  //  this.destroy();
  }

 ,dateClicked: function(datenode)
  {
    var focusdate = datenode.retrieve('date');

    //check out of range
    var selectedyear = focusdate.get('year');
    if(selectedyear < this.options.limit_year_min || selectedyear > this.options.limit_year_max)
      focusdate = null;
    else
      this.calendar.setDate(focusdate);

    this.selectCurrentDate();

    if (!this.options.btn_ok)
      this.returnfn(focusdate,'date');
    //this.destroy();
  }

 ,selectCurrentDate: function()
  {
    var curymd = this.calendar.cdate.format('%Y%m%d');
    this.calendar.datenodes.each(function(datenode)
    {
      var ymd = datenode.retrieve('date').format('%Y%m%d');
      datenode.toggleClass('-wh-calendar-selected', ymd == curymd);
    });
  }


, getContainer: function()
  {
    return this.container;
  }

 ,showHtml: function()
  {
    this.container = new Element('div',{'id':'-wh-calendar-popup'
                                       ,'tabindex': 0
                                       });
    this.element.adopt(this.container);

    var headnode = new Element('div',{'class':'-wh-calendar-head'});

    this.monthsnode = new Element('select',{'class':'-wh-calendar-selectmonth'});
    this.monthsnode.addEvent('change',function(ev){
      this.calendar.setMonth(this.monthsnode.value, this.calendar.cdate.get('year'));

      if (!!this.options.btn_ok)
        this.selectCurrentDate();
    }.bind(this));
    this.eventnodes.push(this.monthsnode);
    headnode.adopt(this.monthsnode);

    this.yearsnode = new Element('select', {'class':'-wh-calendar-selectyear'});
    this.yearsnode.addEvent('change', function()
    {
      this.calendar.setYear(this.yearsnode.value);

      if (!!this.options.btn_ok)
        this.selectCurrentDate();
    }.bind(this));
    this.eventnodes.push(this.yearsnode);
    headnode.adopt(this.yearsnode);

    this.container.adopt(headnode);

    var calnode = new Element('div',{'id':'-wh-calendar'});

    this.options.month_format = '';//hide calendar header with month year to make space for month and year selector
    this.options.keepDay = !!this.options.btn_ok;
    this.calendar = new $wh.Calendar(calnode,this.options);
    this.container.adopt(calnode);

    var selectedmonth = this.calendar.cdate.get('month');
    var selectedyear = this.calendar.cdate.get('year')

    var months = Locale.get('Date.months');
    for(var m = 0; m < months.length; m++)
      this.monthsnode.adopt(new Element('option',{'text' : months[m], 'selected' : m == selectedmonth, 'value' : m}));
    this.monthnodes = this.monthsnode.getChildren();

    for(var y = this.options.limit_year_min; y <= this.options.limit_year_max; y++)
      this.yearsnode.adopt(new Element('option',{'text' : y, 'selected' : y == selectedyear, 'value' : y}));
    this.yearnodes = this.yearsnode.getChildren();

    if(this.options.btn_next)
    {
      var nextnode     = new Element('div',this.options.btn_next);
      nextnode.addEvent('click',this.nextMonth.bind(this));
      this.eventnodes.push(nextnode);
      this.container.adopt(nextnode);
    }

    if(this.options.btn_previous)
    {
      var previousnode = new Element('div',this.options.btn_previous);
      previousnode.addEvent('click',this.previousMonth.bind(this));
      this.eventnodes.push(previousnode);
      this.container.adopt(previousnode);
    }

    var btnsnode = null;
    if(this.options.btn_cancel || this.options.btn_ok || this.options.btn_today || this.options.btn_empty)
      btnsnode = new Element('div',{'class':'-wh-calendar-buttonbar'});

    //Buttons
    if(this.options.btn_cancel)
    {
      var closenode = new Element('div',this.options.btn_cancel);
      closenode.addEvent('click',this.close.bind(this));
      this.eventnodes.push(closenode);
      btnsnode.adopt(closenode);
    }

    if(this.options.btn_ok)
    {
      var submitnode = new Element('div',this.options.btn_ok);
      submitnode.addEvent('click',this.submit.bind(this));
      this.eventnodes.push(submitnode);
      btnsnode.adopt(submitnode);
    }

    if(this.options.btn_today)
    {
      var todaynode = new Element('div',this.options.btn_today);
      todaynode.addEvent('click',this.setToday.bind(this));
      this.eventnodes.push(todaynode);
      btnsnode.adopt(todaynode);
    }

    if(this.options.btn_empty)
    {
      var emptynode = new Element('div',this.options.btn_empty);
      emptynode.addEvent('click',this.setEmptyDate.bind(this));
      this.eventnodes.push(emptynode);
      btnsnode.adopt(emptynode);
    }
    if(btnsnode)
      this.container.adopt(btnsnode);
  }

 , updatePulldowns : function(mydate)
  {
    var newmonth = mydate.get('month');
    for(var i = 0; i < this.monthnodes.length; i++)
      this.monthnodes[i].set('selected',(i == newmonth));
    var newyear = mydate.get('year');
    for(var i = 0; i < this.yearnodes.length; i++)
      this.yearnodes[i].set('selected',(this.yearnodes[i].value == newyear));
  }

 ,destroy: function()
  {
    this.keys.deactivate();

    this.calendar.destroy();

    //cleanup events
    for(var e = 0; e < this.eventnodes.length;e++)
      this.eventnodes[e].removeEvents(['click']);

    for(var mykey in this.keys.options.events)
      this.keys.removeEvent(mykey,this.keys.options.events[mykey]);

    this.container.destroy();
  }

});



/*
 * $wh.CalendarPicker
 * Binds click event to elements given by selector
 *  which activates the calendar date picker popup
 * Given elements must have attributes:
 *  data-date : formatted date Y-m-d
 *  data-formatting: date display format
 */

$wh.DateTimeField = new Class(
{ Implements: [Events,Options]
, options : { show_weeknr    : true
            , limit_year_min : 0
            , limit_year_max : 0
            , datemarkers    : []   // [{'dateclass': '-wh-holiday', 'dates' : ['2013-2-16','2014-1-22']}]
            , btn_cancel     : {'class':'-wh-calendar-cancel'}
            , btn_ok         : null //{'class':'-wh-calendar-ok','text':'OK'}
            , btn_empty      : null //{'class':'wh-calendar-empty -wh-button -wh-button-grey','text':'Leeg'}
            , btn_today      : null //{'class':'wh-calendar-today -wh-button -wh-button-blue','text':'Vandaag'}
            , btn_previous   : {'class':'-wh-calendar-prev'}
            , btn_next       : {'class':'-wh-calendar-next'}
            , events         : {} //{close: function(){..}}
            , position       : 'bottom left' //position of calendar relative to input placeholder
            , type           : ''
            }
 ,activeindex : -1
 ,cal:null
 ,globalfn:null
 ,keys: null
 ,focusnode : null
, initialize: function(node, options)
  {
    this.setOptions(options);
    node=$(node);
    /*this.keys = new Keyboard({ defaultEventType: 'keyup'
                             , events: { 'enter': this.onKeyEnter.bind(this)
                                       }
                            });*/
    this.basenode  = null;
    this.inputnode = null;

    if(node.nodeName == 'INPUT')
    {
      if(!this.options.type && ['date'].contains(node.getAttribute('type')))
        this.options.type='date';

      this.basenode = new Element('div',{'class': '-wh-datetimefield'
                                        ,'tabindex': 0
                                        }).inject(node,'before');

      this.inputnode = node;
      if(node.get('class'))
        this.basenode.addClass(node.get('class'));

      if(node.get('data-formatting'))
        this.basenode.set('data-formatting',node.get('data-formatting'));

      this.inputnode.setStyle("display","none").inject(this.basenode);
      this.inputnode.addEvent("change", this.onInputChanged.bind(this));

      this.inputnode.store('wh-ui-replacedby', this.basenode);
      this.basenode.store('wh-ui-replaces', this.inputnode);

      // This deletes our custom placeholder (it interferes with clicking the datetimefield node)
      this.placeholder = this.inputnode.getAttribute('placeholder') || this.inputnode.getAttribute('data-empty')/*legacy fallback*/ || '';
      this.inputnode.set("placeholder", "");
      this.inputnode.removeAttribute('placeholder');
      this.inputnode.removeAttribute('data-empty'); //also removing this one, to make sure it doesn't suggest usability as a 'fallback'

      var mindate = Date.parse(this.inputnode.getAttribute('data-min'));
      if(mindate && !this.options.limit_year_min)
        this.options.limit_year_min = mindate.getFullYear();

      var maxdate = Date.parse(this.inputnode.getAttribute('data-max'));
      if(maxdate && !this.options.limit_year_max)
        this.options.limit_year_max = maxdate.getFullYear();
    }
    else
    {
      this.basenode = node;
      this.placeholder = this.basenode.getAttribute('data-empty') || '';
    }

    this.datedisplayformat = this.basenode.get('data-formatting');
    if(!this.datedisplayformat)
      this.datedisplayformat = Locale.get('Date.shortDate');//Use localization if no format is given

    var iconnode = new Element('span',{'class':'-wh-calendar-icon'});
    this.basenode.adopt(iconnode);

    this.valuenode = new Element('span',{'class':'-wh-calendar-value'});
    this.basenode.adopt(this.valuenode);
    this.basenode.addEvents( { 'blur': this.blur.bind(this)
                             , 'click': this.onOpenCalendar.bind(this)
                             });

    this.updateDisplayValue();
  }

, onOpenCalendar:function()
  {
    // FIXME focus based closure, and become compatible with other components
    if($wh.DateTimeField.activecalendar)
    {
      if($wh.DateTimeField.activecalendar == this)
        return;
      $wh.DateTimeField.activecalendar.close();
    }

    $wh.DateTimeField.activecalendar = this;
    this.options.initialdate = Date.parse(this.getValue());
    this.options.dateClick = this.onDateClick.bind(this);

    this.cal = new $wh.CalendarForm($(document.body),this.options);
    //mark the calendar as part of our focus group. this ensures the formhandler recognizes our focus loss as benign
    this.basenode.store("-wh-ui-focusgroup", [ this.cal.container ]);

    //this.globalfn = this.onGlobalMouseDown.bind(this);
    //$(window).addEvent("mousedown",this.globalfn); //FIXME when is this one removed?

    if(this.options.position != '') //FIXME share with pulldown and menus
    {
      var pos  = this.basenode.getPosition();
      var size = this.basenode.getSize();
      var sviewport = $(window).getSize();
      var sscroll = $(window).getScroll();
      var scalendar = this.cal.container.getSize();

      x = pos.x;
      y = pos.y;

      if(this.options.position.indexOf('right')!=-1)
        x += size.x - scalendar.x;

      if(this.options.position.indexOf('bottom')!=-1)
        y += size.y;

      if(x + scalendar.x > sviewport.x + sscroll.x)
        x = sviewport.x+sscroll.x - scalendar.x;

      if(y + scalendar.y > sviewport.y + sscroll.y)
        y = sviewport.y+sscroll.y - scalendar.y;

      //FIXME: Better position checking than this (e.g. 'is the calendar 100% visible' checks)
      if (x < 10)
        x = 10;

      this.cal.container.setStyles({'left':x,'top':y});
      this.cal.container.addEvent("focusout", this.blur.bind(this));
      this.cal.container.focus();
    }
  }
, onDateClick:function(newdate,eventname)
  {
    this.setValue(newdate ? newdate.format(this.options.type=='date'? '%Y-%m-%d' : '%Y-%m-%d %H:%M:%S') : '')
    this.close();
    this.basenode.focus();

    /*
    if(mydate)
    {
      this.valuenode.set('text',mydate.format(this.datedisplayformat));
      this.basenode.set('data-date',mydate.format('%Y-%m-%d %H:%M:%S'));
    }
    else
    {
      this.valuenode.set('text',this.getPlaceholder());
      this.basenode.set('data-date','');
    }
    this.close();

    if(this.options.events.close)
      this.options.events.close(mydate,node,eventname);

    if(this.inputnode)
      this.inputnode.set('value',mydate ? mydate.format('%Y-%m-%d') : '')

    this.basenode.focus();
    //this.keys.activate();*/
  }
, onKeyEnter: function()
  {
    if(this.focusnode)
      this.focusnode.fireEvent('click');
  }

, focus: function(ev)
  {
    this.focusnode = ev.target;
    //this.keys.activate();
  }

, blur: function(evt)
  {
    // We don't receive a relatedTarget for blur events in IE
    if(!evt.event.relatedTarget || this.basenode == evt.event.relatedTarget)
      return; //we're a parent, so ignore this event
    if(this.cal && (this.cal.container == evt.event.relatedTarget || this.cal.container.contains(evt.event.relatedTarget)))
      return; //we're a parent, so ignore this event

    this.close();
    this.focusnode = null;
    //this.keys.deactivate();
  }

 ,close: function()
  {
    //$(window).removeEvent("mousedown",this.globalfn);
    if(this.cal)
      this.cal.destroy();
    this.cal = null;
    $wh.DateTimeField.activecalendar = null;
  }

/* FIXME ,onGlobalMouseDown:function(event)
  {
    if(!this.cal)
      return true;

    event = new DOMEvent(event);

    //is event.target inside el?
    for(var findparent = event.target;findparent;findparent=findparent.parentNode)
    {
      if(this.activeindex > -1)
        if(findparent == this.elements[this.activeindex])
          return;

      if(findparent==this.cal.container)
          return true; //event is targeted at the calendar. let it continue
    }

    this.closeActive();
    return true; //don't block the event
  }
*/
, getValue:function()
  {
    return this.inputnode ? this.inputnode.get('value') : this.basenode.getAttribute("data-date");
  }
, setValue:function(newdate)
  {
    if(this.inputnode)
      this.inputnode.set('value',newdate);
    else
      this.basenode.set('data-date',newdate);
    this.updateDisplayValue();
  }
, onInputChanged:function()
  {
    this.updateDisplayValue();
  }
, updateDisplayValue:function()
  {
    var mydate = Date.parse(this.getValue());
    if(mydate)
      this.valuenode.set('text', mydate.format(this.datedisplayformat));
    else
      this.valuenode.set('text', this.placeholder);
  }
});

function replaceDatetimeField(input, options)
{
  new $wh.DateTimeField(input,options);
}
$wh.DateTimeField.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceDatetimeField, options);
}

})(document.id); //end mootools wrapper
