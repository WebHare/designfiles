/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.social.socialite');
require ('../wh.compat.base');
/*! REQUIRE: frameworks.mootools, wh.social.socialite, wh.compat.base
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
$wh.LinkedInAPI = new Class(
{ Extends: $wh.SocialiteNetwork

, initialize:function(appid)
  {
    this.parent(appid);
  }

  /** @short
      @long
  */
, openShareDialog:function(link, options)
  {
    /*
    URL syntax:
    http://www.linkedin.com/shareArticle?mini=true&url={articleUrl}&title={articleTitle}&summary={articleSummary}&source={articleSource}

    For more information see:
    https://developer.linkedin.com/documents/share-linkedin
    */
    var urloptions = [];

    //if (mini)
    urloptions.push("mini=true"); // required parameter/value

    // we must specify a URL or whe'll get a
    // 'There was an unexpected problem that prevented us from completing your request.'
    // even thought the documentation doesn't specify 'url' as a required field
    urloptions.push("url=" + encodeURIComponent(options.url ? options.url : window.location.href));

    if (options.title)
      urloptions.push("title=" + encodeURIComponent(options.title));

    // NOTE: LinkedIn doesn't pick up the summary anymore?
    if (options.text)
      urloptions.push("summary=" + encodeURIComponent(options.text));

    if (options.source)
      urloptions.push("source=" + encodeURIComponent(options.source));

    var url = "http://www.linkedin.com/shareArticle";

    if (urloptions.length > 0)
      url += "?" + urloptions.join("&");

    window.open(url,'_blank','width=520,height=570');
    //window.open(url,'_blank','width=1100,height=630');
  }
});

})(document.id); //end mootools wrapper
