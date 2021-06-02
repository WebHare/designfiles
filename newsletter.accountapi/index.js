/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.compat.base');
require ('../wh.ui.base');
require ('../wh.net.jsonrpc');
require ('../wh.util.validation');
require ('../wh.net.url');
/*! LOAD: frameworks.mootools, wh.compat.base, wh.ui.base
    LOAD: wh.net.jsonrpc, wh.util.validation, wh.net.url
!*/

(function($) {

$wh.NewsletterAccountAPI = new Class(
{ Implements: [Options]
, url:''
, rpc:null
, options: { server: null
           , accounttag: ''
           }
, initialize:function(options)
  {
    this.setOptions(options);
    this.url = $wh.resolveToAbsoluteURL(this.options.server || location.href, '/wh_services/newsletter/accountapi');
  }
, destroy:function()
  {
    if(this.rpc)
      this.rpc.destroy();

    this.rpc = null;
  }
, setupSubscribeForm:function(form, options)
  {
    if(!options || !options.list)
      throw new Error("setupSubscribeForm requires a 'list' option with the tag of the list to subscribe to");

    form=$(form);
    form.addEvent("submit", this.handleSubscribeForm.bind(this, form, options));
  }
, handleSubscribeForm:function(form, options, event)
  {
    event.stop();
    var emailfield = form.getElement('*[name="email"]');

    if(!emailfield)
      throw new Error("No field named 'email' found");

    //ADDME replace with RPC busy handling and remove wh.ui.base load
    $wh.updateUIBusyFlag(+1);
    this.subscribe(emailfield.value, options.list, this.handleSubscribeFormFeedback.bind(this,options), null);
  }
, handleSubscribeFormFeedback: function(options, resultinfo)
  {
    $wh.updateUIBusyFlag(-1);
    if(options && options.onSubscribe)
      options.onSubscribe({ target:this, email: resultinfo.emailaddress, guid:resultinfo.guid })
  }
, subscribe:function(emailaddress, listtag, callback, extrafields)
  {
    if(!emailaddress || !$wh.isValidEmailAddress(emailaddress))
    {
      console.log("Subscription failed - invalid email address");
      callback.bind(window, { success:false, errorcode:"INVALIDEMAIL" }).delay(1);
      return;
    }

    //ADDME xmlhttp if cross-domain wise possible ?
    if(!this.rpc)
      this.rpc = new $wh.JSONRPC({url: this.url, requestmethod: 'jsonp'});

    if(!extrafields)
      extrafields={};

    var resultinfo = {emailaddress:emailaddress, listtag:listtag};
    this.rpc.request('Subscribe'
                    ,[location.href, this.options.accounttag, listtag, emailaddress, extrafields]
                    ,this.onSubscribeResult.bind(this, true, callback, resultinfo)
                    ,this.onSubscribeResult.bind(this, false, callback, resultinfo)
                    );
  }

, onSubscribeResult:function(success, callback, resultinfo, result, resultdata)
  {
    if(this.rpc)
      this.rpc.destroy();
    this.rpc = null;

    if(!success)
    {
      //the RPC itself failed. this is usually a server configuration error
      console.error("RPC failed: ", resultdata?resultdata.message:'');
      return;
    }

    resultinfo.success = success && result.code >= 0;
    if(!resultinfo.success)
      console.log("Subscription failed, errorcode " + result.code + ", message:" + result.descr);

    resultinfo.errorcode = resultinfo.success ? "OK" : "UNKNOWNERROR"; //ADDME extra error codes
    resultinfo.guid = result.guid;
    callback(resultinfo);
  }
});

})(document.id);
