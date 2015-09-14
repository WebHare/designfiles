/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
require ('wh.util.preloader');
require ('wh.ui.base');
require ('wh.form.model.base');
require ('wh.util.adhoccache');
/*! LOAD: wh.compat.base, wh.util.preloader, wh.ui.base, wh.form.model.base, wh.util.adhoccache
!*/

(function($) {

var recaptchakey = '', loadlisteners = [], gotgooglescript;

var isGoogleRecaptchaLoaded = false;
window.$wh__recaptchaLoaded = function()
{
  gotgooglescript=true;
  checkAllDone();
}
function onGotKey(result)
{
  recaptchakey = result;
  checkAllDone();
}
function isRecaptchaReady()
{
  return Boolean(recaptchakey && gotgooglescript);
}
function checkAllDone()
{
  if(!isRecaptchaReady())
    return;

  loadlisteners.invoke('_gotRecaptcha');
  loadlisteners=[];
}

$wh.GoogleRecaptcha = new Class(
{ Extends: $wh.PreloadableAsset
, Implements: [Options,Events]
, options: { autoload: false }
, node: null
, recaptchacomplete: false
, recaptcharesponse: ''
, recaptchaid: null

, initialize:function(node, options)
  {
    this.setOptions(options);
    this.node = $(node);
    this.node.store("wh-google-recaptcha", this);

    if(this.options.autoload)
      this.startPreload();
  }
  //captcha succesfully entered?
, isValid:function()
  {
    return !this.node || this.recaptchacomplete;
  }
  //captcha response needed for submission
, getResponse:function()
  {
    return this.recaptcharesponse;
  }
, onStartPreload:function()
  {
    if($wh.debug.nsc && !$wh.config.islive)
    {
      this.node=null;
      node.set('html','<span style="font: 12px arial">(wh-debug=nsc - spam check disabled)</span>');
      this._gotRecaptcha();
      return;
    }
    if(isRecaptchaReady())
    {
      this._gotRecaptcha();
      return;
    }
    loadlisteners.push(this);
    if(loadlisteners.length>1)
      return; //we weren't the first

    //Get the script from google, and the key from ourselves
    $$('head,body')[0].adopt(new Element("script", {src: "https://www.google.com/recaptcha/api.js?onload=$wh__recaptchaLoaded&render=explicit" }));

    //By default we'll store an api key for 5 minutes
    $wh.getAsyncCached("wh-google-recaptcha-apikey",
                       function(valuecallback)
                       {
                         new $wh.JSONRPC({url:'/wh_services/socialite/recaptcha'}).request('GetAPIKey', [location.href],
                            function(result) { valuecallback({ ttl: 5*60*1000, value:result.apikey})
                                             });
                       }, onGotKey);


//        new $wh.JSONRPC({url:'/wh_services/socialite/recaptcha'}).request('GetAPIKey',[location.href], onGotKey);
  }
, _gotRecaptcha:function()
  {
    this.donePreload(true);
    if(isRecaptchaReady() && this.node)
      this.recaptchaid = window.grecaptcha.render(this.node, {sitekey: recaptchakey, callback: this._onRecaptchaComplete.bind(this) })
  }
, _onRecaptchaComplete:function()
  {
    this.recaptchacomplete = true;
    this.recaptcharesponse = window.grecaptcha.getResponse(this.recaptchaid);
  }
});

$wh.Form.models["wh.google.recaptcha"] = new Class(
{ Extends: $wh.Form.ModelBase
, getRawValue:function()
  {
    var handler = this.node.retrieve("wh-google-recaptcha");
    if(!handler)
      throw new Exception("Field with model wh-google-recaptcha does not have a recaptcha handler. Does it have the 'wh-google-recaptcha' class, and did replacable components grab it?");

    return handler.recaptchacomplete ? handler.recaptcharesponse : '';
  }
})

function initGoogleRecaptcha(node)
{
  new $wh.GoogleRecaptcha(node, {autoload:true});
}

$wh.setupReplaceableComponents('.wh-google-recaptcha', initGoogleRecaptcha);

})(document.id);
