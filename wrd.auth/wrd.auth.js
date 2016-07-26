/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
require ('wh.net.jsonrpc');
require ('wh.ui.base');
require ('wh.net.url');
require ('wh.util.promise');
/*! LOAD: wh.compat.base, wh.net.jsonrpc, wh.ui.base, wh.net.url, wh.util.promise
!*/

(function($) { //mootools wrapper

if($wh.config.server >= 31400 || true /* window.__generate_data_designfiles__ */) {

//ADDME move cookie state to sessionstorage, we don't need to transmit _c cookies on each request

$wh.WRDAuthenticationProvider = new Class(
{ Implements: [Events]
, isloggedin: false
, userinfo: null
, logouturl: ""
, cookiename: ""
, cookiepath: ""
, samlidpreq: ""

, initialize:function()
  {
    this.cookiename = $wh.config["wrd:auth"].cookiename || "webharelogin";
    this.cookiepath = $wh.config["wrd:auth"].cookiepath || "/";
    this.returnid = $wh.config["wrd:auth"].returnid || "true";
    this.samlidpreq = $wh.config["wrd:auth"].samlidpreq || "";
    this.loginservice = new $wh.JSONRPC({url: '/wh_services/wrd/auth' + ($wh.debug.aut?"?wh-debug=aut":"")});

    var inredirect = !!Cookie.read(this.cookiename + '_r');
    Cookie.dispose(this.cookiename + '_r');

    var jsstate = Cookie.read(this.cookiename + '_j');
    if(!jsstate)
      return;

    //Javascript state info is present
    var currentstate = Cookie.read(this.cookiename + '_c');
    if($wh.debug.aut)
    {
      console.log("[aut] " + this.cookiename + "_j=" + jsstate);
      console.log("[aut] " + this.cookiename + "_c=" + currentstate);
    }

    if(!currentstate || currentstate.substr(0, jsstate.length) != jsstate)
    {
      if(inredirect)
      {
        console.error("[aut] Redirect loop with restoresession.shtml detected");
        return;
      }

      Cookie.write(this.cookiename + '_r',''+new Date);
      window.removeEvents("domready"); //prevent them from running on redirect, often causing spurious errors

      var cookiepathbase = $wh.resolveToAbsoluteURL(location.href, this.cookiepath);
      var redirectto = $wh.resolveToAbsoluteURL(cookiepathbase, '.!wrd/auth/restoresession.shtml?back=' + encodeURIComponent(location.href));
      if(document.referrer === redirectto)
      {
        console.error("[aut] Redirect loop with restoresession.shtml detected");
        return;
      }
      if($wh.debug.aut)
      {
        console.log("[aut] " + this.cookiename + "_j=" + jsstate);
        console.log("[aut] " + this.cookiename + "_c=" + currentstate);
      }
      $wh.navigateTo(redirectto, $wh.debug.aut ? "aut" : null);
      return;
    }
    else
    {
      if($wh.debug.aut)
        console.log("[aut] looks like we're still logged in");

      this.isloggedin = true;
      if(currentstate.length > 1)
        try
        {
          this.userinfo = JSON.parse(currentstate.substr(jsstate.length));
        }
        catch(e)
        {
        }

      var url = new $wh.URL(location.href);
      var returnto = url.getVariable("wrdauth_returnto");
      if (returnto)
      {
        var cookiepathbase = $wh.resolveToAbsoluteURL(location.href, this.cookiepath);

        if (returnto.substr(0, cookiepathbase.length) == cookiepathbase)
        {
          var returnurl = new $wh.URL(returnto);
          returnurl.addVariable('wrdauth_returned', "loggedin");
          if($wh.debug.aut)
            returnurl.addVariable('wh-debug', "aut");
          $wh.navigateTo(returnurl.getUrl());
        }
        else
        {
          var exporturl = $wh.resolveToAbsoluteURL(location.href, '.!wrd/auth/exportsession.shtml?back=' + encodeURIComponent(returnto));
          if($wh.debug.aut)
            exporturl += "&wh-debug=aut";
          $wh.navigateTo(exporturl);
        }
      }
    }
  }
, logout:function()
  {
    var back = this.logouturl ? $wh.resolveToAbsoluteURL(location.href, this.logouturl) : location.href;
    var cookiepathbase = $wh.resolveToAbsoluteURL(location.href, this.cookiepath);
    var redirectto = $wh.resolveToAbsoluteURL(cookiepathbase, '.!wrd/auth/logout.shtml?back=' + encodeURIComponent(back));

    $wh.navigateTo(redirectto, { debugtype: $wh.debug.aut ? "aut" : null });
  }

, setupLoginForm:function(form)
  {
    form=$(form);
    if(form)
       form.addEvent("submit", this.handleLoginForm.bind(this, form));
     else
       throw new Error("No such form");
  }
, handleLoginForm:function(form, event)
  {
    event.stop();

    var loginfield = form.getElement('*[name="login"]');
    var passwordfield = form.getElement('*[name="password"]');
    var persistentfield = form.getElement('*[name="persistent"]');

    if(!loginfield)
      throw new Error("No field named 'login' found");
    if(!passwordfield)
      throw new Error("No field named 'password' found");

    var persistentlogin = persistentfield && persistentfield.checked;
    this.tryLogin(form, loginfield.value, passwordfield.value, { persistent: persistentlogin });
  }
, login:function(login, password, options)
  {
    return new Promise(function(resolve, reject)
    {
      if(!options)
        options={};

      var url = new $wh.URL(location.href);
      var challenge = url.getVariable("wrdauth_challenge") || "";

      var opts =
        { challenge:    url.getVariable("wrdauth_challenge") || ""
        , returnto:     url.getVariable("wrdauth_returnto") || ""
        , samlidpreq:   this.samlidpreq
        };

      this.loginservice.request('Login'
                               , [ location.href
                                 , login
                                 , password
                                 , (options && options.persistent) || false
                                 , opts
                                 ]
                               , function(response)
                                 { //success handler
                                   resolve(response);
                                 }
                               , function(error)
                                 {
                                   reject(error)//FIXME translate to exception
                                 }
                               );
    }.bind(this));
  }
//ADDME do we have direct callers or can we _tryLogin this?
, tryLogin:function(form, login, password, options)
  {
    //ADDME replace with RPC busy handling and remove wh.ui.base load
    if(!options)
      options={};

    if(form)
      form.addClass("submitting");
    $wh.updateUIBusyFlag(+1);

    var url = new $wh.URL(location.href);

    var opts =
      { challenge:    url.getVariable("wrdauth_challenge") || ""
      , returnto:     url.getVariable("wrdauth_returnto") || ""
      , samlidpreq:   this.samlidpreq
      };

    this.loginservice.request('Login'
                             , [ location.href
                               , login
                               , password
                               , (options && options.persistent) || false
                               , opts
                               ]
                             , this.onLoginSuccess.bind(this, form)
                             , this.onLoginFailure.bind(this, form, options)
                             );
  }
, onLoginSuccess:function(form, response)
  {
    if(form)
      form.removeClass("submitting");

    var completion = this._completeLoginSuccess.bind(this, response);
    var evt = new CustomEvent('wh:wrdauth-onlogin', { bubbles:true, cancelable: true, detail: { callback: completion, userinfo: response.userinfo }});
    try
    {
      (form || document).dispatchEvent(evt);
    }
    finally
    {
      if(!evt.defaultPrevented)
        completion();
    }
  }
, _completeLoginSuccess:function(response)
  {
    $wh.updateUIBusyFlag(-1);
    if(response.success)
    {
      if (response.submitinstruction)
      {
        $wh.executeSubmitInstruction(response.submitinstruction, { debug: $wh.debug.aut });
        return;
      }

      //The user has succesfully logged in
      location.reload(true);
      return;
    }

    this.failLogin(Locale.get('wh-common.authentication.loginfail') || 'The specified login data is incorrect.', response);
  }
, onLoginFailure:function(form, options, code, msg)
  {
    if(form)
      form.removeClass("submitting");
    $wh.updateUIBusyFlag(-1);

    this.failLogin(Locale.get('wh-common.authentication.loginerror') || 'An error has occurred.', { code: code });
  }
, failLogin: function(message, response)
  {
    var failevent = new $wh.Event;
    failevent.initEvent("loginfailure", false, true);
    failevent.message = message;
    failevent.code = response.code;
    failevent.data = response.data;

    this.fireEvent("loginfailure", failevent);
    if(!failevent.defaultPrevented)
    {
      if($wh.Popup && $wh.Popup.Dialog)
        new $wh.Popup.Dialog( { text: failevent.message, buttons: [{ result: 'ok', title: "Ok" }] });
      else
        alert(failevent.message);
    }
  }
, isLoggedIn:function()
  {
    return this.isloggedin;
  }
, getUserInfo:function()
  {
    return this.userinfo;
  }
, setLogoutURL: function(url)
  {
    this.logouturl = url;
  }

, startSAMLLogin: function(sp_tag, options)
  {
    options = options || {};
    var defer = Promise.defer();

    this.loginservice.request('StartSAMLLogin'
                              , [ location.href, sp_tag, options ]
                              , defer.resolve
                              , defer.reject //FIXME translate to exception
                              );

    return defer.promise;
  }
});

if($wh.debug.aut)
{
  var debuginfo = Cookie.read("wh-wrdauth-debug");
  if(debuginfo)
    Array.each(debuginfo.split('\t'), function(msg) { console.warn("[aut] server: " + msg) });
  Cookie.dispose("wh-wrdauth-debug");
}

$wh.wrdauth=null;

if($wh.config["wrd:auth"])
{
  $wh.wrdauth = new $wh.WRDAuthenticationProvider;
  if($wh.wrdauth.isLoggedIn())
    $(document.documentElement).addClass("wh-wrdauth-loggedin");

  document.addEvent("click:relay(.wh-wrdauth-logout)", function(event)
  {
    event.stop();
    $wh.wrdauth.logout();
  });

  window.addEvent("domready",function()
  {
    $$('form.wh-wrdauth-loginform').each(function(loginform)
    {
      $wh.wrdauth.setupLoginForm(loginform);
    });

    if($wh.wrdauth.userinfo)
    {
      $$('*[data-wrdauth-text]').each(function(fillnode)
      {
        var elname = fillnode.getAttribute('data-wrdauth-text');
        if(elname in $wh.wrdauth.userinfo)
          fillnode.set('text', $wh.wrdauth.userinfo[elname]);
      });
      $$('*[data-wrdauth-value]').each(function(fillnode)
      {
        var elname = fillnode.getAttribute('data-wrdauth-value');
        if(elname in $wh.wrdauth.userinfo)
          fillnode.set('value', $wh.wrdauth.userinfo[elname]);
      });
    }
  });
}

}
else //legacy 3.10 implementation
{

//ADDME move cookie state to sessionstorage, we don't need to transmit _c cookies on each request

$wh.WRDAuthenticationProvider = new Class(
{ Implements: [Events]
, isloggedin: false
, userinfo: null
, logouturl: ""

, initialize:function()
  {
    this.loginservice = new $wh.JSONRPC({url: '/wh_services/wrd/auth'});

    var inredirect = !!Cookie.read('webharelogin_r');
    Cookie.dispose('webharelogin_r');

    var jsstate = Cookie.read('webharelogin_j');
    if(jsstate) //Javascript state info is present
    {
      var currentstate = Cookie.read('webharelogin_c');
      if(!currentstate || currentstate.substr(0, jsstate.length) != jsstate)
      {
        if(inredirect)
        {
          console.error("[aut] Redirect loop with restoresession.shtml detected");
          return;
        }

        Cookie.write('webharelogin_r',''+new Date);
        window.removeEvents("domready"); //prevent them from running on redirect, often causing spurious errors

        var redirectto = $wh.resolveToAbsoluteURL(location.href, '/.wrd/auth/restoresession.shtml?back=' + encodeURIComponent(location.href));
        if(document.referrer === redirectto)
        {
          console.error("[aut] Redirect loop with restoresession.shtml detected");
          return;
        }
        if($wh.debug.aut)
        {
          console.log("[aut] webharelogin_j=" + jsstate);
          console.log("[aut] webharelogin_c=" + currentstate);

          console.error("[aut] Redirection to restoresession.shtml is needed");
          console.log(redirectto);
          if(!confirm("(You are seeing this message because wrd.auth debugging is enabled).\n\nRedirection to restoresession.shtml is needed. Redirect now?"))
            return;
        }
        //Cookie.write('webharelogin_j', 'redirect');
        location.href=redirectto;
        return;
      }
      else
      {
        this.isloggedin = true;
        if(currentstate.length > 1)
          try
          {
            this.userinfo = JSON.parse(currentstate.substr(jsstate.length));
          }
          catch(e)
          {
          }
      }
    }
  }
, logout:function()
  {
    var back = this.logouturl ? $wh.resolveToAbsoluteURL(location.href, this.logouturl) : location.href;
    location.href='/.wrd/auth/logout.shtml?back=' + encodeURIComponent(back);
  }

, setupLoginForm:function(form)
  {
    form=$(form);
   if(form)
      form.addEvent("submit", this.handleLoginForm.bind(this, form));
    else
      throw new Error("No such form");
  }
, handleLoginForm:function(form, event)
  {
    event.stop();

    var loginfield = form.getElement('*[name="login"]');
    var passwordfield = form.getElement('*[name="password"]');
    var persistentfield = form.getElement('*[name="persistent"]');

    if(!loginfield)
      throw new Error("No field named 'login' found");
    if(!passwordfield)
      throw new Error("No field named 'password' found");

    var persistentlogin = persistentfield && persistentfield.checked;
    this.tryLogin(form, loginfield.value, passwordfield.value, { persistent: persistentlogin });
  }
, tryLogin:function(form, login, password, options)
  {
    //ADDME replace with RPC busy handling and remove wh.ui.base load
    if(!options)
      options={};

    form.addClass("submitting");
    $wh.updateUIBusyFlag(+1);

    this.loginservice.request('Login'
                             , [ location.href, login, password, options && options.persistent ]
                             , this.onLoginSuccess.bind(this, form)
                             , this.onLoginFailure.bind(this, form, options)
                             );
  }
, onLoginSuccess:function(form, response)
  {
    form.removeClass("submitting");
    $wh.updateUIBusyFlag(-1);
    if(response.success)
    {
      //The user has succesfully logged in
      location.reload(true);
      return;
    }

    var failevent = new $wh.Event;
    failevent.initEvent("loginfailure", false, true);
    failevent.message = Locale.get('wh-common.authentication.loginfail') || 'The specified login data is incorrect.';
    failevent.code = response.code;
    failevent.data = response.data;

    this.fireEvent("loginfailure", failevent);
    if(!failevent.defaultPrevented)
    {
      if($wh.Popup && $wh.Popup.Dialog)
        new $wh.Popup.Dialog( { text: failevent.message, buttons: [{ result: 'ok' }] });
      else
        alert(failevent.message);
    }
  }
, onLoginFailure:function(form, options, response)
  {
    form.removeClass("submitting");
    $wh.updateUIBusyFlag(-1);
  }
, isLoggedIn:function()
  {
    return this.isloggedin;
  }
, getUserInfo:function()
  {
    return this.userinfo;
  }
, setLogoutURL: function(url)
  {
    this.logouturl = url;
  }
});

if($wh.debug.aut)
{
  var debuginfo = Cookie.read("wh-wrdauth-debug");
  if(debuginfo)
    Array.each(debuginfo.split('\t'), function(msg) { console.warn("[aut] server: " + msg) });
//  Cookie.dispose("wh-wrdauth-debug");
}

$wh.wrdauth=null;

if($wh.config["wrd:auth"])
{
  $wh.wrdauth = new $wh.WRDAuthenticationProvider;
  if($wh.wrdauth.isLoggedIn())
    $(document.documentElement).addClass("wh-wrdauth-loggedin");

  document.addEvent("click:relay(.wh-wrdauth-logout)", function(event)
  {
    event.stop();
    $wh.wrdauth.logout();
  });

  window.addEvent("domready",function()
  {
    $$('form.wh-wrdauth-loginform').each(function(loginform)
    {
      $wh.wrdauth.setupLoginForm(loginform);
    });

    if($wh.wrdauth.userinfo)
    {
      $$('*[data-wrdauth-text]').each(function(fillnode)
      {
        var elname = fillnode.getAttribute('data-wrdauth-text');
        if(elname in $wh.wrdauth.userinfo)
          fillnode.set('text', $wh.wrdauth.userinfo[elname]);
      });
      $$('*[data-wrdauth-value]').each(function(fillnode)
      {
        var elname = fillnode.getAttribute('data-wrdauth-value');
        if(elname in $wh.wrdauth.userinfo)
          fillnode.set('value', $wh.wrdauth.userinfo[elname]);
      });
    }
  });
}

} //end version guard

})(document.id); //end mootools wrapper
