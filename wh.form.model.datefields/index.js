/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools.more.date');
require ('../wh.form.model.base');
/*! LOAD: frameworks.mootools.more.date, wh.form.model.base !*/
/* plugin to support separated date/time fields */

(function($) {

$wh.Form.DateFields = {}

$wh.Form.DateFields.SubFieldModel = new Class(
{ Extends: $wh.Form.InputFieldBase
, initialize:function(form, node, parentmodel)
  {
    this.parent(form,node,parentmodel);
    var whichfield = parentmodel.getSubName(this.getName());

    if(this.node.get('tag')=='select' && this.node.options.length<=1)
    {
      if(whichfield == 'hour' || whichfield=='minute')
      {
        for(var i=0;i<60;i=i+1)
          this.node.adopt(new Element('option', { value: ''+i, text: ('0' + i).slice(-2) }));
      }
      else if(whichfield == 'day')
      {
        for(var i=1;i<=31;i=i+1)
          this.node.adopt(new Element('option', { value: ''+i, text: ''+ i }));
      }
      else if(whichfield == 'month')
      {
        for(var i=1;i<=12;i=i+1)
        {
          var monthname = window.Locale && Locale.get ? Locale.get('Date.months.' + (i-1)) : '';
          this.node.adopt(new Element('option', { value: ''+i, text: monthname || ''+i }));
        }
      }
      else if(whichfield == 'year')
      {
        var minval = this.parentmodel.getMinValue() || new Date;
        var maxval = this.parentmodel.getMaxValue() || new Date;

        var order = this.parentmodel.getOrder();
        if(order == 'DESC')
        {
          for(var i=maxval.getFullYear();i>=minval.getFullYear();i=i-1)
            this.node.adopt(new Element('option', { value: ''+i, text: ''+i }));
        }
        else
        {
          for(var i=minval.getFullYear();i<=maxval.getFullYear();i=i+1)
            this.node.adopt(new Element('option', { value: ''+i, text: ''+i }));
        }
      }
      else if(whichfield == 'hour')
      {
        for(var i=0;i<24;i=i+1)
          this.node.adopt(new Element('option', { value: ''+i, text: ''+i }));
      }
      else if(whichfield == 'minute' || whichfield == 'second')
      {
        for(var i=0;i<60;i=i+1)
          this.node.adopt(new Element('option', { value: ''+i, text: ('0'+i).slice(-2) }));
      }
    }
  }
, getValue:function()
  {
    return this.node.value ? this.node.value.toInt() : 0;
  }
, isRequired:function()
  {
    return false;
  }
, isValid:function()
  {
    return true;
  }
});

$wh.Form.models["wh.datefields"] = new Class(
{ Extends: $wh.Form.ModelGroupBase
, fieldnames: ["year","month","day","hour","minute"]
, models: {}

, initialize:function(form,node)
  {
    this.parent(form, node);
    Array.each(this.getSubFields(), function(subfield)
    {
      this.models[subfield.subname] = subfield.model;
    }.bind(this));
  }
, suggestModel:function(name, field)
  {
    if(this.fieldnames.contains(name))
      return $wh.Form.DateFields.SubFieldModel;
  }
, getOrder: function()
  {
    var order = this.node.getAttribute('data-order');
    return order ? order.toUpperCase() : 'ASC'
  }
, getMinValue:function()
  {
    return Date.parse(this.node.getAttribute('data-min'));
  }
, getMaxValue:function()
  {
    return Date.parse(this.node.getAttribute('data-max'));
  }
, getRawValue:function()
  {
    var day = this.models["day"].getValue();
    var month = this.models["month"].getValue();
    var year = this.models["year"].getValue();
    if(day == 0 || month == 0 || year == 0) //not set
    {
      if(this.formhandler.debugvalidation)
        console.log(this.formhandler.getDebugTag() + "some of day/month/year not set",day,month,year,this);
      return null;
    }
    if(this.models["hour"] && !this.models["hour"].isSet())
    {
      if(this.formhandler.debugvalidation)
        console.log(this.formhandler.getDebugTag() + "hour is not set",this.models["hour"],this);
      return null;
    }
    if(this.models["minute"] && !this.models["minute"].isSet())
    {
      if(this.formhandler.debugvalidation)
        console.log(this.formhandler.getDebugTag() + "minute is not set",this.models["minute"],this);
      return null;
    }

    if(day<1||day>31||month<1||month>12||year<1)
      return undefined;
    var isleapyear = ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    if(month==2 && day > (isleapyear ? 29 : 28))
      return undefined;
    if(day==31 && [4,6,9,11].contains(month))
      return undefined;

    var basedate = (year < 9999 ? ('0000' + year).slice(-4) : year) + '-' + ('0'+month).slice(-2) + '-' + ('0'+day).slice(-2);
    if(this.models["hour"])
    {
      var hour = this.models["hour"].getValue();
      if(hour<0||hour>23)
        return undefined;
      basedate += 'T' + ('0'+hour).slice(-2);
    }
    if(this.models["minute"])
    {
      var minute = this.models["minute"].getValue();
      if(minute<0||minute>59)
        return undefined;
      basedate += ':' + ('0'+minute).slice(-2);
      basedate += ':00Z';
    }
    return basedate;
  }
, generateRawValue:function(date)
  {
    if (typeof date == "string")
      date = this.parseRawValue(date);
    return date ? date.toISOString() : '';
  }
, parseRawValue:function(value)
  {
    if(value===null || value===undefined)
      return value;
    else
      return Date.parse(value);
  }
, setRawValue:function(value)
  {
    var date = Date.parse(value);
    this.models["day"].setValue  (date ? date.getDate() : '');
    this.models["month"].setValue(date ? date.getMonth()+1 : '');
    this.models["year"].setValue (date ? date.getFullYear() : '');
    if(this.models["hour"])
      this.models["hour"].setValue (date ? date.getUTCHours() : '');
    if(this.models["minute"])
      this.models["minute"].setValue (date ? date.getUTCMinutes() : '');
  }
, validate:function(value)
  {
    if(!value)
      return { error: Locale.get('wh-form.invalid_date'), delayiffocus: true};

    var minval = this.getMinValue();
    if(minval && value < minval)
      return { error: Locale.get('wh-form.invalid_date'), delayiffocus: true};

    var maxval = this.getMaxValue();
    if(maxval && value > maxval)
      return { error: Locale.get('wh-form.invalid_date'), delayiffocus: true};

    return null;
  }
});

})(document.id);
