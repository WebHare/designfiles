/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.locale');
require ('frameworks.mootools.more.request.jsonp');
require ('wh.social.socialite.widget');
/*! REQUIRE: frameworks.mootools.core, frameworks.mootools.more.locale, frameworks.mootools.more.request.jsonp, wh.social.socialite.widget !*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

//////////////////////////////////////////////////////////////
//
//  Twitter client-side support
//  (c)B-Lex IT 2011-2013
//

$wh.TwitterWidget = new Class(
{ Extends: $wh.SocialWidget
, options: { query: ''
           }
, initialize: function(el, options)
  {
    this.parent(options);

    this.container = $(el);
    if (!this.container)
      return console.error("No container specified for tweets.");

    var req = new Request.JSON({ url: '/.socialite/feeds/twitter.shtml?q=' + encodeURIComponent(this.options.query) + "&l=" + this.options.maxitems
                               , onSuccess: this.callback.bind(this)
                               });
    req.get();
  }
/*
    var callbackname = "__wh_twittercallback" + (++$wh.TwitterWidget.count);
    window[callbackname] = this.callback.bind(this);

    var usequery = options.query && options.query != "";
    var usescreenname = options.screenname && options.screenname != "";

    if (usequery && usescreenname)
    {
      console.error("Cannot use both query and screenname.");
      return;
    }

    var twitterscript;
    if (usequery)
    {
       twitterscript = (location.protocol=='https:' ? 'https:' : 'http:')
                       + '//search.twitter.com/search.json?callback=' + encodeURIComponent(callbackname)
                       + '&q=' + encodeURIComponent(this.options.query)
                       + '&rpp=' + this.options.maxitems
                       + '&page=1&include_entities=true';
    }
    else if (usescreenname)
    {
      twitterscript = (location.protocol=='https:' ? 'https:' : 'http:')
                      + '//api.twitter.com/1/statuses/user_timeline.json?callback=' + encodeURIComponent(callbackname)
                      + '&screen_name=' + this.options.screenname
                      + '&count=' + this.options.maxitems
                      + '&include_rts=true&include_entities=true';
    }
    else
    {
      console.error("No query or screenname specified.");
      return;
    }

    var twitterscript = new Element("script", {"src": twitterscript
                                              ,"async":true
                                              });
    $$('head').pick().adopt(twitterscript);
  }
*/
, callback: function(result)
  {
    // set Locale lang
    var doclang = $wh.getDocumentLanguage();
    if (doclang == "nl")
      Locale.use("nl-NL");
    else if (doclang == "de")
      Locale.use("de-DE");
    else
      Locale.use("en-US");

    this.container.fireEvent("twitterfeed", result);
    for(var msgnr=0; msgnr<result.messages.length; msgnr++)
    {
      var feeditem = result.messages[msgnr];
      feeditem.postdate = Date.parse(feeditem.postdate);
      feeditem.network = 'twitter';

      //messages_shown++;
      var quote = this.createFeedItem(this.prepareFeedItem(feeditem));
      if(quote)
        this.container.appendChild(quote);

/*
      if (searchformat && msg.entities && msg.entities.urls)
      {
        var htmlstr = "";
        var readpos = 0;
        // twitter returns the urls sorted by starting indice,
        for(var tel=0; tel<msg.entities.urls.length; tel++)
        {
          var urlrec = msg.entities.urls[tel];

          htmlstr = htmlstr
                    + msg.text.substring(readpos, urlrec.indices[0])
                    + "<a href='" + urlrec.expanded_url + "' target='_blank'>" + urlrec.display_url + "</a>"

          readpos = urlrec.indices[1];
        }
        htmlstr = htmlstr + msg.text.substring(readpos, msg.text.lenght);
      }
      else
        htmlstr = msg.text;

      var quote = new Element("quote");
      var quotecontent = new Element("div", { style: "overflow: hidden;" });
      var message = new Element("span", { "class": "message"
                                        , html: htmlstr //msg.text
                                        });

      if (this.options.showprofileimage)
      {
        var profileimage = new Element("img", { src:     useravatar
                                              , "class": "profileimage"
                                              });
        quotecontent.appendChild(profileimage);
      }
      quotecontent.appendChild(message);


      var networkicon = new Element("div", { "class": "networkicon" });

      var arrow = new Element("div", { "class": "balloonarrow" });

      quote.appendChild(quotecontent);
      quote.appendChild(networkicon);

      if (this.options.showpostdate)
      {
        var creationdescription = new Element( "div"
                                             , { "class": "creationtime"
                                               , text:this.describeTimePassed(msg.created_at)
                                               }
                                             )
        quote.appendChild(creationdescription);
      }
      quote.appendChild(arrow);

      this.container.appendChild(quote);
*/
    }
  }
});
$wh.TwitterWidget.count=0;

$wh.setupElementAsTwitterWidget = function(el)
{
  el=$(el);
  if(el.retrieve("-wh-twitter-widget"))
    return el.retrieve("-wh-twitter-widget");
  if(el.retrieve("wh-twitter-widget"))
    return el.retrieve("wh-twitter-widget");

  var opts = { showprofileimage: ['true','1'].contains(el.getAttribute("data-showprofileimage"))
             , showpostdate:     ['true','1'].contains(el.getAttribute("data-showpostdate"))
             , query:            el.getAttribute("data-query")
             , linktarget:       el.getAttribute("data-linktarget")
             , showretweetlink:  el.getAttribute("data-showretweetlink")
             , showreplylink:    el.getAttribute("data-showreplylink")
             , replylabel:       el.getAttribute("data-replylabel")
             , retweetlabel:     el.getAttribute("data-retweetlabel")
             };

  if(el.getAttribute('data-maxitems'))
    opts.maxitems = parseInt(el.getAttribute('data-maxitems'));

  return new $wh.TwitterWidget(el, opts);
};

$(window).addEvent("domready", function()
{
  $$('.-wh-twitter-widget, .wh-twitter-widget').each($wh.setupElementAsTwitterWidget);
});

})(document.id); //end mootools wrapper
