/* generated from Designfiles Public by generate_data_designfles */
require ('./textlengthcounter.css');
require ('../frameworks.mootools');
/*! LOAD: frameworks.mootools
!*/

/*
 * basic structure: <div class="wh-textlengthcounter">
 *                    <span class="count"></span>
 *                    <span class="separator">/</span>
 *                    <span class="limit"></span>
 *                  </div>
 * if limit is reached, class 'limitreached' is added to div
 * if over limit then, class 'overflow' is added to div
 */

(function($) { //mootools wrapper

$wh.TextLengthCounter = new Class(
{ Implements  : [Options]
, options : { showcounter : true
            , forcelimit  : true          //concat text to given max length
            , container   : '.fieldgroup' //container to inject counter in
            , where       : 'bottom'      //position where to inject in container
            , separator   : '/'
            , cssclass    : ''            //additional css class
            , maxlengthmeasure : 'characters' // characters or bytes
            }
, limit : 0
, node : null
, counterwrapper : null
, countnode : null
, limitnode : null

, initialize : function(node, options)
  {
    this.setOptions(options);

    this.node = node;
    this.limit = Number(this.node.get('maxlength'));

    if(this.limit <= 0)
      this.options.forcelimit = false;

    if(this.options.showcounter)
    {
      var parentnode = this.node.getParent(this.options.container);
      if(parentnode)
      {
        this.counterwrapper = new Element('div',{'class':'wh-textlengthcounter' + (this.options.cssclass ? ' ' + this.options.cssclass : '')});
        this.countnode = new Element('span',{'class':'count','text':this.getTextlength()}).inject(this.counterwrapper);

        if(this.limit > 0)
        {
          new Element('span',{'class':'separator','text':this.options.separator}).inject(this.counterwrapper);
          this.limitnode = new Element('span',{'class':'limit','text':this.limit}).inject(this.counterwrapper);
        }

        this.counterwrapper.inject(parentnode,this.options.where);
      }
      else
      {
        console.warn('Parentnode ' + this.options.where + ' not found');
      }
    }

    //use keyup event because of behavour of IE
    node.addEvent('keyup', this.update.bind(this));
    node.addEvent('paste', this.update.bind(this));
    node.addEvent('change',this.update.bind(this));
  }

, getTextlength : function()
  {
    return (this.options.maxlengthmeasure == 'bytes' ? this.node.get('value').getUTF8Length() : this.node.get('value').length);
  }

, update : function()
  {
    var count = this.getTextlength();

    if(this.limit > 0)
    {
      if(count >= this.limit)
        this.counterwrapper.addClass('limitreached');
      else
        this.counterwrapper.removeClass('limitreached');

      if(count > this.limit)
      {
        this.counterwrapper.removeClass('overflow');
        if(this.options.forcelimit)
        {
          var inptext = this.node.get('value');
          count = this.limit;
          this.node.set('value',inptext.substring(0,this.limit));
        }
      }
      else
      {
        this.counterwrapper.removeClass('overflow');
      }
    }

    if(this.options.showcounter)
       this.countnode.set('text',count);
  }

});

$wh.TextLengthCounter.addedcounters = [];

$wh.TextLengthCounter.addToComponents = function(selector, options)
{
  $$(selector).each(function(node)
    {
      var textlimit = Number(node.get('maxlength'));
   //   if(textlimit > 0)
   //   {
         var tlc = new $wh.TextLengthCounter(node, options);
         node.store('TextLengthCounter',tlc);
         $wh.TextLengthCounter.addedcounters.push(tlc);
    //  }
    });
}

//update all counters (used if form data is loaded after initialization)
$wh.TextLengthCounter.updateAll = function()
{
  $wh.TextLengthCounter.addedcounters.each(function(tlc){
    tlc.update();
  });
}

})(document.id); //end mootools wrapper
