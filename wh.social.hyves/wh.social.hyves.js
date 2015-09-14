/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.social.socialite');
/*! REQUIRE: frameworks.mootools.core, wh.social.socialite
!*/

if(!window.$wh) $wh={};

/** Initialize the facebook SDK
 * @param appid Your application ID (required, really)
 * @param options Options
 * @cell(string) options.langcode Language to use, eg nl_NL (default: en_US)
 * */
$wh.HyvesAPI = new Class(
{ Extends: $wh.SocialiteNetwork

, initialize:function(appid)
  {
    this.parent(appid);
  }

, openShareDialog:function(link, options)
  {
    var url = 'http://www.hyves-share.nl/button/tip/';
    if(options.title)
      url += '?title=' + encodeURIComponent(options.title);

    var body = options.text;
    if(link)
      body += ' ' + link;
    url += '&body=' + encodeURIComponent(body);

    window.open(url, '_blank', 'width=850,height=400');
  }
});
