/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../frameworks.mootools.more.date');
/*! REQUIRE: frameworks.mootools, frameworks.mootools.more.date
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

$wh.InternetRequester = new Class(
{ Implements: [Options, Events]

, options: { url: '' //Host url of event server
           , requestmethod: 'xmlhttp'
           , log: false
           }

  // XMLHttpRequest
, conn: null
  // JSONP script tag
, jsonpscripttag: null
, jsonp_errorcallbackfunc: null

// used for estimating the server date
, __date_server: null
, __date_client: null
, __date_diff: null

, initialize: function(options)
  {
    this.setOptions(options);
    if($wh.debug.rpc)
      this.options.log=true;
  }
, destroy: function()
  {
    this.stopCurrentRequest();
    this.conn = null;
  }

, stopCurrentRequest:function()
  {
    if(this.conn)
    {
      this.conn.onreadystatechange = null;
      this.conn.onloadend = null;

      this.conn.abort();
    }
    if (this.jsonpscripttag)
    {
      this.jsonpscripttag.removeEvent('error', this.jsonp_errorcallbackfunc);

      var headnode = $(document.getElementsByTagName("head")[0]);
      headnode.removeChild(this.jsonpscripttag);
      this.jsonpscripttag.removeEvents();
      this.jsonpscripttag.destroy();
      this.jsonpscripttag = null;
    }
    if (this.jsoncheckinterval)
    {
      clearTimeout(this.jsoncheckinterval);
      this.jsoncheckinterval = null;
    }
  }

, ensureConnection: function()
  {
    if (!this.conn)
      this.conn = new XMLHttpRequest();
  }

, startXMLHTTPRequest:function(method, url, body, options)
  {
    this.ensureConnection();

    var async = !options || !options.synchronous;

    // Because aborting the connection may result in a readystatechange event (yes, we're looking at you, Titanium's
    // TiNetworkHTTPClient...), we have to reset the have_response flag _after_ aborting the connection, so the response for
    // the previous request isn't used for the new request

    this.laststateevent = null; //make sure we don't accidentally cancel the previous request
    this.conn.abort();
    this.have_response = false;

    this.conn.open(method.toUpperCase(), url, async);
    if(options && options.headers)
      Object.each(options.headers, function(value,key) { this.conn.setRequestHeader(key,value); }.bind(this));

    if(this.options.withcredentials)
      this.conn.withCredentials = true;
    this.conn.onreadystatechange = this.onStateChange.bind(this);
    // Required for Firefox 12 (+firebug?), without it statechange to 4 doesn't seem to be fired sometimes
    this.conn.onloadend = this.onStateChange.bind(this);
    this.conn.onabort = this.onAbort.bind(this);

    this.fireEvent("requeststart", { target: this });
    this.conn.send(body);

    if (!async)
      this.onStateChange();
  }

, onAbort:function(event)
  {
    if(this.laststateevent)
      this.laststateevent.isaborted = true;
  }

, onStateChange: function(event)
  {
    if (this.conn.readyState != 4 || this.have_response)
      return;

    this.have_response = true;

    var datestr = this.conn.getResponseHeader("date");
    if (datestr != "")
    {
      var parseddate = Date.parse(datestr);
      this.__date_server = parseddate;
      this.__date_client = new Date();
      this.__date_diff = this.__date_server - this.__date_client;
    }

    var evt = { target: this
              , success: this.conn.status == 200
              , internalerror: this.conn.status == 500
              , message: this.conn.status

              , responsetext: this.conn.responseText
              , responsejson: null
              };

    //FIXME only decode JSON data if the mimetype specified it was JSON, and then log any errors
    try
    {
      evt.responsejson = JSON.parse(evt.responsetext);
    }
    catch(e)
    {
    }

    this.laststateevent = evt;
    this.fireEvent("requestend", evt);
  }

    // JSONP support
, startJavascriptRequest: function(url, request)
  {
    if (this.options.log)
      console.log('ES JSONP START', request.reqid, url);

    this.stopCurrentRequest();
    var headnode = document.getElementsByTagName("head")[0];

    this.jsonpscripttag = new Element('script',
        { type:       'text/javascript'
        , async:      true
        , src:        url
        });

    this.jsonpscripttag.requestid = request.reqid;
    $wh.InternetRequester.jsonp_dispatch[request.reqid] = this.onJSONPData.bind(this, request.reqid);

    this.jsonpscripttag.addEvent('error', this.onJSONPCheck.bind(this, request.reqid, 'error'));
    this.jsonpscripttag.addEvent('readystatechange', this.onJSONPCheck.bind(this, request.reqid, 'rsc'));

    this.fireEvent("requeststart", { target: this });
    headnode.appendChild(this.jsonpscripttag);
  }


, onJSONPData: function(id, data)
  {
    if (this.options.log)
      console.log('ES JSONP DATA', id, data);

    if (!this.jsonpscripttag || this.jsonpscripttag.requestid != id)
    {
      if (this.options.log)
        console.log('ES JSONP IGNORED');
      return;
    }

    this.stopCurrentRequest();

    var evt = { target: this
              , success: true
              , internalerror: false
              , message: ""

              , responsetext: null
              , responsejson: data
              };
    this.fireEvent("requestend", evt);
  }

, onJSONPCheck: function(id,  type)
  {
    if (this.options.log)
      console.log('ES JSONP CHECK', id, type);

    if (!this.jsonpscripttag || this.jsonpscripttag.requestid != id)
    {
      // Not relevant no'mo
      if (this.options.log)
        console.log('ES JSONP IGNORED');
      return;
    }

    // IE specific check
    if (this.jsonpscripttag.readyState && this.jsonpscripttag.readyState != 'complete')
      return;

    if (this.options.log)
      console.log('ES JSONP ERROR');

    // IE: if loaded, the callback would have been called & the node removed. So, won't get here on success
    this.stopCurrentRequest();

    //this.handleRequestError(broadcastdata);


    var evt = { target: this
              , success: false
              , internalerror: false
              , message: "JSONP request failed"

              , responsetext: ""
              , responsejson: null
              };

    this.fireEvent("requestend", evt);
  }

, prepareJavascriptCallback:function()
  {
    var reqid=++$wh.InternetRequester.jsonp_counter;
    return { reqid: reqid
           , callback: '$wh.InternetRequester.jsonp_dispatch[' + reqid + ']'
           }
  }
});

$wh.InternetRequester.jsonp_counter = 0;
$wh.InternetRequester.jsonp_dispatch = {};

})(document.id); //end mootools wrapper
