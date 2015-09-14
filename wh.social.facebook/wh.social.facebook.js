/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.util.preloader');
require ('wh.social.socialite');
require ('wh.net.url');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.util.preloader, wh.social.socialite, wh.net.url
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

//ADDME allow on-init callbacks ?


/*
 Events: like          (receives 'url' in event object)
         unlike        (receives 'url' in event object)

  Integrating a like button:
    https://developers.facebook.com/docs/reference/plugins/like/
    <div class="fb-like" data-href="https://[facebook page]" data-send="false" data-layout="button_count" data-width="250" data-show-faces="false"></div>

  Optionally check $wh.FacebookSDK.anyXFBML to see if there are any xfbml buttons and refuse to init if there aren't

*/

$wh.FacebookSDK = new Class(
{ Extends: $wh.SocialiteNetwork
, Implements: [$wh.PreloadableAsset, Options, Events]

, options: { langcode: ''
           , xfbml: null
           , autoload: false
           , setautogrow: false
           , redirectloginapp: '' //if set, use the specified socialite server-side app for logins. works around problems with Chrome on iOS, or IE with mixed security settings
           }
, socialitetoken: ''
/** Initialize the facebook SDK
 * @param appid Your application ID (required, really)
 * @param options Options
 * @cell(string) options.langcode Language to use, eg nl_NL (default: en_US)
 */
, initialize: function(appid, options)
  {
    this.parent(options && (options.redirectloginapp || options.socialiteappid) ? (options.redirectloginapp || options.socialiteappid): '')
    this.setOptions(options);
    if(!this.options.langcode)
    {
      var lang = $wh.getDocumentLanguage();
      this.options.langcode = {"en":"en_US","nl":"nl_NL","de":"de_DE"}[lang.toLowerCase()];
      if(!this.options.langcode)
        this.options.langcode='en_US';
    }
    if(this.options.xfbml===null)
      this.options.xfbml = $wh.FacebookSDK.anyXFBML();

    if (typeof appid != "string")
      console.error("Invalid fb app id:",appid);

    if($wh.__facebookappid && appid)
    {
      if($wh.__facebookappid!=appid) //duplicate init
        throw ("Duplicate facebook initialization (last application id was " + $wh.__facebookappid + ", new appid is " + appid);

      return;
    }
    $wh.__facebookappid=appid;
    if(this.options.autoload)
      this.startPreload();
  }
, onStartPreload:function()
  {
    if(!$('fb-root'))
      document.body.appendChild(new Element("div",{"id":"fb-root"}));

    //we need to delay until the fbAsyncInit
    window.fbAsyncInit = this.__onInitDone.bind(this);
    var fburl = "//connect.facebook.net/" + this.options.langcode + "/all.js";

    $$('head,body').pick().adopt(new Element("script", {src:fburl  //could add this to the URL, it seems to avoid the need for FB.init, but where's the documented proof ? #xfbml=1&appId=" + appid
                                                       ,id:"facebook-jssdk"
                                                       }
                                      ));
  }
, __onInitDone: function()
  {
    var initrec = { xfbml: this.options.xfbml
                  , appId: $wh.__facebookappid
                  };

    //backwards compatiblity with old browsers for cross domain communication
    initrec.channelUrl=location.protocol + '//' + location.host + '/tollium_todd.res/socialite/callbacks/fbchannel.html';

    FB.init(initrec);
    FB.Event.subscribe('edge.create', this._onEdge.bind(this,true));
    FB.Event.subscribe('edge.remove', this._onEdge.bind(this,false));
    if (this.options.setautogrow)
      FB.Canvas.setAutoGrow();
    this.donePreload(true);
  }

, _onEdge:function(iscreate, likebutton)
  {
    if($wh.debug.anl)
      console.log("[anl] FaceBook like " + (iscreate?"added":"removed"), arguments);

    $wh.track("share",iscreate ? "facebook-like" : "facebook-unlike",likebutton);
    this.fireEvent(iscreate ? "like" : "unlike");
  }


  /* post to the current user's feed
     @param link URL to share
     @cell options.picture Picture URL
     @cell options.title Name of the post (title of the share)
     @cell options.caption Caption (use 'www.yoursite.nl' by convention)
     @cell options.text Text to use for the share
     @cell options.onSuccess Callback to invoke on succesful share
     @cell options.onFailure Callback to invoke on a failed share
  */
, openShareDialog:function(link, options) //ADDME autodelay if FB was still loading
  {
    var shareobj = {method: 'feed'};
    if(link)
      shareobj.link = $wh.resolveToAbsoluteURL(location.href,link);
    if(options.picture)
      shareobj.picture = $wh.resolveToAbsoluteURL(location.href, options.picture);
    if(options.title)
      shareobj.name=options.title;
    if(options.text)
      shareobj.description=options.text;

    if(options.caption)
    {
      shareobj.caption=options.caption;
    }
    else if(link) //extract caption from the link
    {
      var linktoks=link.split('/'); //http://site.com/xyz
      if(linktoks.length>=3)
        shareobj.caption = linktoks[2];
    }

    if (options.to)
      shareobj.to = options.to;

    //copy for callback use
    FB.ui(shareobj, this.__handleUIResult.bind(this, options.onSuccess, options.onFailure));
  }
, __handleUIResult:function(onsuccess, onfail, response)
  {
    if(response && response.post_id)
    {
      if(onsuccess)
        onsuccess(response);
    }
    else if(onfail)
    {
      onfail();
    }
  }

  /* login to facebook
      options: "permissions" (string array)
      usewindow: if initialized as a plugin, use a new window to perform authentication. this works around Chrome/iOS issues and IE cross-zone login issues */

, openLoginDialog:function(onaccept, ondeny, options) //ADDME autodelay if FB was still loading
  {
    if (!$wh.__facebookappid)
    {
      console.error("Can not open a Facebook login dialog because no appid was specified to the $wh.FacebookSDK instance")
      return;
    }

    if(options && typeof options.permissions == 'string')
    {
      console.warn("The permissions passed to openLoginDialog should be an Array of Strings");
      options.permissions = options.permissions.split(',');
    }

    if(this.options.redirectloginapp || (options && options.usewindow)) //use the default socialite login
    {
      return this.parent(onaccept, ondeny, options);
    }

    var scope='';
    if(options&& options.permissions)
      scope=options.permissions.join(',');

    var loginoptions = { scope: scope
                       , return_scopes: true
                       };

    if($wh.debug.anl)
      console.log("[facebook] Invoking Facebook login",loginoptions);
    FB.login(this.__handleLoginResult.bind(this, onaccept, ondeny), loginoptions);
  }
, __handleLoginResult:function(onaccept, ondeny, response)
  {
    if(response && response.authResponse)
    {
      /* Authresponse looks like this: except when it doesnt.
        {"status":"connected","authResponse":{"session_key":true,"accessToken":"BAAFA...","expin":"5140713","sig":"...","userID":"...","secret":"IGNORE","expirationTime":1341779235555}}

      2016-06-20. M: to me it looks like:

      { accessToken: "..."
      , expiresIn: ...
      , signedRequest: "..."
      , userID: "..."
      }
      */

      this.socialitetoken = "tradein:" + response.authResponse.accessToken;
      if($wh.debug.anl)
        console.log("[facebook] Facebook login returned success. response:",response);

      if(onaccept)
        onaccept( { target:this
                  , accesstoken: response.authResponse.accessToken
                  , socialitetoken: this.socialitetoken
                  , status: response.status
                  , userid: response.authResponse ? response.authResponse.userID : ""
                  , grantedscopes: response.authResponse
                                   && response.authResponse.grantedScopes
                                   && response.authResponse.grantedScopes != ""
                                        ? response.authResponse.grantedScopes.split(',')
                                        : []
                  });
    }
    else
    {
      if($wh.debug.anl)
        console.log("[facebook] Facebook login returned failure. response:",response);
      if(ondeny)
        ondeny({ target: this });
    }
  }
});

$wh.FacebookSDK.needsRedirectWorkaround=function()
{
  return navigator.userAgent.contains("CriOS/");
}

$wh.FacebookSDK.anyXFBML = function()
{
  return $$('div.fb-comments').length || $$('div.fb-like').length;
}

function initializeSDK()
{
  $wh.facebook = new $wh.FacebookSDK($wh.config["socialite:facebook"].appid
                                    , { autoload: true
                                      , socialiteappid: $wh.config["socialite:facebook"].socid
                                      });
}

$wh.facebook = null;
if($wh.config && $wh.config["socialite:facebook"])
  window.addEvent("domready", initializeSDK);

})(document.id); //end mootools wrapper
