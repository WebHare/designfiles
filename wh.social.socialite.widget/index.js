/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.compat.base');
require ('../frameworks.mootools');
require ('../frameworks.mootools.more.locale');
require ('../frameworks.mootools.more.date');
require ('../wh.util.template');
/*! LOAD: wh.compat.base, frameworks.mootools, frameworks.mootools.more.locale, frameworks.mootools.more.date, wh.util.template
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

Locale.getWithArgs = function locale_getwithargs(tid, args)
                            {
                              var strval = Locale.get(tid);

                              if (strval && args)
                                return strval.substitute(args);
                              else
                                return strval;
                            }

$wh.SocialWidget = new Class(
{ Implements: [Options]
, options: { showprofileimage: false
           , showpostdate:     false
           , showretweetlink:  false
           , showreplylink:    false
           , debug:            false
           , maxitems:         50
           , maxnamelength:    80 // max length of a name of a line, photo or video
           , maxdescriptionlength: 120
           , linktarget:       ''
           }
, container:null

, initialize:function(options)
  {
    this.setOptions(options);
  }

, prepareFeedItem: function(feeditem)
  {
    var msg = { from:         feeditem.from
              , fromavatar:   this.options.showprofileimage ? feeditem.fromavatar : null
              , text:         feeditem.text
              , link:         feeditem.link
              , htmltext:     feeditem.htmltext ? feeditem.htmltext : feeditem.text ? feeditem.text.encodeAsHTML() : ''
              , postdate:     this.options.showpostdate ? feeditem.postdate : null
              , timepassed:   this.options.showpostdate ? this.describeTimePassed(feeditem.postdate) : null
              , linktarget:   this.options.linktarget
              , embed:        feeditem.embed
              , messageid:    feeditem.messageid
              , replylink:    this.options.showreplylink ? feeditem.link : ""
              , retweetlink:  this.options.showretweetlink ? feeditem.link : ""
              , replylabel:   this.options.replylabel ? this.options.replylabel : "Reply"
              , retweetlabel: this.options.replylabel ? this.options.retweetlabel : "Retweet"
              };

    if(msg.from && msg.from.length > this.options.maxnamelength)
      msg.from = msg.from.substring(0, this.options.maxnamelength - 1) + "...";
    if (msg.text && msg.text.length > this.options.maxdescriptionlength)
      msg.text = msg.text.substring(0, this.options.maxdescriptionlength - 1) + "...";

    return msg;
  }

, createFeedItem: function(feeditem)
  {
    if($wh.SocialWidget.__feeditemcreater)
      return $wh.SocialWidget.__feeditemcreater(feeditem);

    if(this.container)
    {
      var template = this.container.getElement("template");
      if(template)
      {
        $wh.expandTemplate(template, feeditem);
        return;
      }
    }
    return $wh.SocialWidget.createFeedItem(feeditem);
  }

, describeTimePassed:function(origStamp)
  {
/*    var origStamp = Date.parse(pastTime);
    if (isNaN(origStamp))
    {
      // IE doesn't always want to parse datestrings like "Tue Oct 25 09:15:00 +0000 2011"
      // If you prefix "UTC" to the timezone (+0000) IE will always work though!
      origStamp = Date.parse(pastTime.replace(/( \+)/, ' UTC$1'));
    }
*/
    var curDate = new Date();
    var currentStamp = curDate.getTime();

    var difference = parseInt((currentStamp - origStamp)/1000);

    if(difference < 0)
      return false;

    if(difference < 60)
      return Locale.getWithArgs("Date.lessThanMinuteAgo");

    if(difference < 90)
      return Locale.getWithArgs("Date.minuteAgo");

    if(difference < 3600)
      return Locale.getWithArgs("Date.minutesAgo", { delta: parseInt(difference/60).toString() });

    if(difference <= 1.5*3600)
      return Locale.getWithArgs("Date.hourAgo");

    if(difference < 23.5*3600)
      return Locale.getWithArgs("Date.hoursAgo", { delta: Math.round(difference/3600) });

    if(difference < 1.5*24*3600)
      return Locale.getWithArgs("Date.dayAgo");

    if(difference < 7*24*3600)
      return Locale.getWithArgs("Date.daysAgo", { delta: Math.round(difference/24/3600) });

    return new Date(origStamp).format("%e %B %Y");
  }

});

$wh.SocialWidget.__feeditemcreater=null;

$wh.SocialWidget.createFeedItem = function(msg)
{
  var quote = new Element("div");

  if(msg.fromavatar)
    quote.adopt(new Element("img", { src: msg.fromavatar, "class": "-wh-socialwidget-avatar wh-socialwidget-avatar" }));

  quote.adopt(new Element("span", { "class": "-wh-socialwidget-text wh-socialwidget-text", html: msg.htmltext }));

  if(msg.embed)
  {
    var embedholder = new Element(msg.embed.link ? "a" : "span", { "class": "-wh-socialwidget-embed wh-socialwidget-embed" });
    if(msg.embed.link)
    {
      embedholder.set('href', msg.embed.link);
      if(msg.linktarget)
        embedholder.set('target', msg.linktarget);
    }

    if(msg.embed.image)
      embedholder.adopt(new Element("img", {src:msg.embed.image}));
    if(msg.embed.title)
      embedholder.adopt(new Element("span", {"class":"-wh-socialwidget-title wh-socialwidget-title", text:msg.embed.title}));
    if(msg.embed.description)
      embedholder.adopt(new Element("span", {"class":"-wh-socialwidget-description wh-socialwidget-description", text:msg.embed.description}));

    quote.adopt(embedholder);
  }

  if (msg.timepassed)
    quote.adopt(embedholder, new Element("span", {"class":"-wh-socialwidget-timepassed wh-socialwidget-timepassed", text:msg.timepassed}));

  if (msg.retweetlink)
    quote.adopt(embedholder, new Element("a", {"class":"-wh-socialwidget-retweetlink wh-socialwidget-retweetlink"
                                              , text: msg.retweetlabel
                                              , href: msg.retweetlink
                                              , target: msg.linktarget
                                              }));

  if (msg.replylink)
    quote.adopt(embedholder, new Element("a", {"class":"-wh-socialwidget-replylink wh-socialwidget-replylink"
                                              , text: msg.replylabel
                                              , href: msg.replylink
                                              , target: msg.linktarget
                                              }));

  return quote;
}

$wh.SocialWidget.setFeedItemCreater = function(newcreater)
{
  $wh.SocialWidget.__feeditemcreater = newcreater;
}

})(document.id); //end mootools wrapper
