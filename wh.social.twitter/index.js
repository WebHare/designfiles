/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.social.socialite');
require ('../wh.compat.base');
/*! LOAD: frameworks.mootools, wh.social.socialite, wh.compat.base
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

/* to create a button:
   https://twitter.com/about/resources/buttons#tweet
   <a href="https://twitter.com/share" class="twitter-share-button">Tweet</a>
*/

/** Initialize the twitter SDK
 * @param appid Application name
 * */
$wh.TwitterAPI = new Class(
{ Extends: $wh.SocialiteNetwork

, initialize:function(appid)
  {
    this.parent(appid);
  }

, openShareDialog:function(link, options)
  {
    var url = 'http://twitter.com/share?text=' + encodeURIComponent(options.text);
    url += '&url=' + encodeURIComponent(link?link:'');
    window.open(url,'_blank','width=850,height=400');
  }
});

var widgets = [];

function clickEventToAnalytics(info)
{
  var origel = widgets[info.target.id];
  if(origel && origel.hasClass("twitter-share-button"))
    $wh.track("share","twitter-share-click",origel);
}

function tweetIntentToAnalytics(info)
{
  var origel = widgets[info.target.id];
  if(origel && origel.hasClass("twitter-share-button"))
    $wh.track("share","twitter-share-tweet",origel);
}

$(document).addEvent("cookiespermitted", function()
{
  //Check for any twitter share buttons - https://dev.twitter.com/docs/tweet-button
  if($$('a.twitter-share-button').length)
  {
    if($wh.debug.anl)
      console.log('[anl] Initializing twitter');

    //Assign ids to buttons which don't have one yet, and track 'm all
    Array.each($$('a.twitter-share-button'), function(el, idx)
    {
      if(!el.id)
        el.id="wh-socialite-twitter-" + (idx+1);
      widgets[el.id] = el;
    });

    window.twttr = (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {};
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js, fjs);

      t._e = [];
      t.ready = function(f) {
        t._e.push(f);
      };
      return t;
    }(document, "script", "twitter-wjs"));

    window.twttr.ready(function(twtr)
    {
      //https://dev.twitter.com/web/javascript/events
      twttr.events.bind('click', clickEventToAnalytics);
      twttr.events.bind('tweet', tweetIntentToAnalytics);
    });
  }
});

})(document.id); //end mootools wrapper
