/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../frameworks.mootools.more.locale');
require ('../frameworks.mootools.more.request.jsonp');
require ('../wh.social.socialite.widget');
/*! REQUIRE: frameworks.mootools, frameworks.mootools.more.locale, frameworks.mootools.more.request.jsonp, wh.social.socialite.widget !*/

/*

Support for creating Twitter widgets

*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

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

    el.store("wh-twitter-widget",this);

    var req = new Request.JSON({ url: '/.socialite/feeds/twitter.shtml?q=' + encodeURIComponent(this.options.query) + "&l=" + this.options.maxitems
                               , onSuccess: this.updatePostsDOM.bind(this)
                               });
    req.get();
  }

, updatePostsDOM: function(result)
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
      feeditem.network = "twitter";
      //feeditem.fromlink = "http://twitter.com/#!/" + feeditem.from;
      feeditem.fromlink = "http://twitter.com/" + feeditem.from;

      //messages_shown++;
      var quote = this.createFeedItem(this.prepareFeedItem(feeditem));
      if (quote) // we use the hardcoded dom created by js (if a template was used we don't get the node back)
        this.container.appendChild(quote);
    }

    $wh.fireLayoutChangeEvent(this.container, "up");
  }
});
$wh.TwitterWidget.count=0;

$wh.setupElementAsTwitterWidget = function(el)
{
  el=$(el);
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
