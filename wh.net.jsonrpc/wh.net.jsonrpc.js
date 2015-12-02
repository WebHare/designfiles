/* generated from Designfiles Public by generate_data_designfles */
require ('wh.util.preloader');
require ('wh.net.requests');
/*! LOAD: wh.util.preloader, wh.net.requests
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

var rpcscriptid = Math.floor(Math.random()* 1000);

$wh.JSONRPC = new Class(
{ Extends: $wh.InternetRequester
, Binds: [ "onResponse" ]
, lastid: 0
, requestqueue: []
, cachecounter: 0
, activerequest: null
, haveresponse: false

, options: { waittimeout: 500 //timeout after which we trigger a 'wait' action, eg a spinner
           , appendfunctionname: false
           }

, waitcallback: null
, waittimeoutid: null
, waitingnow: false

, initialize: function(options)
  {
    this.parent(options);
    this.addEvent("requestend", this.onResponse);
  }

, destroy: function()
  {
    this.parent();

    this.requestqueue = [];
    this.activerequest = null;

    if (this.waittimeoutid)
    {
      clearTimeout(this.waittimeoutid);
      this.waittimeoutid = null;
    }
  }

/**
 * @short Queue an RPC request
 * @param method The RPC method to call
 * @param params Params for the RPC method
 * @param callback The callback which is called, with:
 *                 param status A $wh.JSONRPC. value
 *                 param result The result object as sent by the RPC, or an error message string sent by the RPC, or an error
 *                              message
 *                 param id The request id
 * @param options Options
 * @param options.url The URL to connect to
 * @param options.timeout Timeout in ms after which the request will fail (callback is called with ERROR_TIMEOUT error)
 * @param options.waittimeout Timeout in ms after which the request will set waiting status to TRUE (via the waitCallback)
 *                Set negative to not trigger waiting status.
 * @return The request id
 */
, request: function(method, params, onsuccess, onfailure, options)
  {
    if(!params || typeof params != "object" || params.length === undefined)
      throw "The parameters passed to request must be an Array";

    var id = ++this.lastid;

    var url;
    if(options && options.url)
      url = options.url + (options.appendfunctionname ? (options.url.match(/\/$/) ? '' : '/') + method : '')
    else if(this.options.url)
      url = this.options.url + (this.options.appendfunctionname ? (this.options.url.match(/\/$/) ? '' : '/') + method : '');
    else
      url = location.href; //we do not support appendfunctionname for self-posts

    var timeout = Math.max((options && typeOf(options.timeout) == "number") ? options.timeout : 0, 0);
    var waittimeout = (options && typeOf(options.waittimeout) == "number") ? options.waittimeout : this.options.waittimeout;
    var synchronous = options && options.synchronous || false;
    var errortrace = options && options.errortrace || null;

    if (this.options.log)
      console.log("JSONRPC request", method, params, options, 'timeout:', timeout, 'waitTimeout:', waittimeout);

    var request = new $wh.JSONRPC.__Request(this, id, method, params, url, timeout, waittimeout, onsuccess, onfailure, synchronous, errortrace);
    if (this.options.log || !$wh.config || !$wh.config.islive)
      request.stack = new Error().stack;

    this.requestqueue.push(request);
    if (this.options.log)
      console.log("JSONRPC request is on queue");
    this.processNextRequest();
    return request;
  }

, handleError:function(onfailure, errorcode, errormsg, rpcid)
  {
    if(onfailure)
      onfailure.delay(0, null, [ errorcode, errormsg, rpcid ]);

    this.fireEvent.delay(0, this, [ "error", { target: this, errorcode: errorcode, errormessage: errormsg, rpcid: rpcid } ]);
  }

  //is a json request pending?
, isRequestPending:function()
  {
    return this.activerequest !== null || !this.requestqueue.empty();
  }

  //ADDME is it possible for the 'next' response to already be .delay/setTimeout() scheduled, racing against our cancel ?
, __cancelRequest: function(id)
  {
    if(typeof id != 'number')
      return;

    if (this.activerequest == id)
    {
      this.stopCurrentRequest();
      this.activerequest = null;

      var request = this.requestqueue.shift();
      if (request.timeout && typeOf(request.timeout) != "boolean")
        clearTimeout(request.timeout);

      this.processNextRequest();
    }
    else
    {
      for (var i = 0; i < this.requestqueue.length; ++i)
        if (this.requestqueue[i].id == id)
        {
          this.requestqueue.splice(i, 1);
          break;
        }
    }
  }

, processNextRequest: function()
  {
    if (this.activerequest)
    {
      if(this.options.log)
        console.log("JSONRPC request #" + this.activerequest + " pending, not scheduling a new one yet");
      this.handleWaitTimeouts();
      return;
    }

    var request = null;
    while (!request)
    {
      request = this.requestqueue.pick();
      if (!request)
      {
        if(this.options.log)
          console.log("JSONRPC request - processNextRequest, queue is empty");
        return;
      }
      if (request.timeout && typeOf(request.timeout) == "boolean")
      {
        this.requestqueue.erase(request);
        request = this.requestqueue.pick();
      }
    }

    this.activerequest = request.id;

    if (request.timeout)
      request.timeout = this.onTimeout.delay(request.timeout, this, [ request ]);

    if(this.options.requestmethod=='xmlhttp')
    {
      if(this.options.log)
        console.log("JSONRPC request #" + request.id + " offering for XMLHTTP");
      this.startXMLHTTPRequest(
            "post",
            request.url,
            JSON.encode(request.request),
            { headers: { "Content-Type": "application/json; charset=utf-8" }
            , synchronous: request.synchronous
            });
    }
    else
    {
      if(this.options.log)
        console.log("JSONRPC request #" + request.id + " offering for JSONP");

      var req = this.prepareJavascriptCallback();
      var url = this.options.url + "?rpcdata=" + encodeURIComponent(JSON.encode(request.request)) + "&callback=" + encodeURIComponent(req.callback) + "&cachedefeat=" + (new Date()).getTime() + '-' + ++this.cachecounter;
      this.startJavascriptRequest(url, req);
    }
    this.handleWaitTimeouts();
  }

, onResponse: function(event)
  {
    this.activerequest = null;

    var request = this.requestqueue.pick();
    if (!request)
      return;
    this.requestqueue = this.requestqueue.erase(request);

    if (request.timeout)
    {
      if (typeOf(request.timeout) == "boolean")
      {
        this.processNextRequest();
        return;
      }
      clearTimeout(request.timeout);
    }

    var status = -1;
    var result = null;

    if (!event.success)
    {
      status = $wh.JSONRPC.HTTP_ERROR;
      result = "HTTP Error: " + event.message;

      if (event.internalerror)
      {
        var json = null;
        try
        {
          json = event.responsejson;
          var trace;
          if(json && json.error && json.error.data)
          {
            trace = json.error.data.trace || json.error.data.errors || json.error.data.list || [];

            console.group();
            var line = "RPC #" + rpcscriptid +":"+ request.id  + " failed: " + json.error.message;
            console.warn(line);
            if (request.errortrace)
              request.errortrace.push(line);
            Array.each(trace,function(rec)
            {
              var line = rec.filename + '#' + rec.line + '#' + rec.col + (rec.func ? ' (' + rec.func + ')' : '');
              console.warn(line);
              if (request.errortrace)
                request.errortrace.push(line);
            });
            console.groupEnd();
          }
          status = $wh.JSONRPC.SERVER_ERROR;
          result = json.errornull;
        }
        catch (e)
        {
        }
      }
    }
    else
    {
      var json = event.responsejson;
      if(json&&json.whlog)
        $wh.renderConsoleLog(json.whlog);

      if (!json)
      {
        status = $wh.JSONRPC.JSON_ERROR;
        result = "Invalid JSON response";
      }
      else if (typeOf(json.id) == "null" || json.id != request.id)
      {
        status = $wh.JSONRPC.PROTOCOL_ERROR;
        result = "Protocol error: invalid id";
      }
      else if (typeOf(json.error) != "null")
      {
        status = $wh.JSONRPC.RPC_ERROR;
        result = json.error;
        if(this.options.log)
          console.log('RPC error:', result.message ? result.message : '*no message*');
      }
      else if ("result" in json)
      {
        status = 0;
        result = json.result;
      }
      else
      {
        status = $wh.JSONRPC.PROTOCOL_ERROR;
        result = "Could not interpret response";
      }
    }

    this.processNextRequest();

    if (this.options.log)
    {
      console.log("JSONRPC request", request.request.method, 'status:', status, 'time:', (new Date).getTime()- request.scheduled, 'ms, result:');
      console.log(result);
    }

    /*
    console.log({ serverdate: this.__date_server
                , clientdate: this.__date_client
                , diff: this.__date_diff
                });
    */
    request.__completedCall.delay(0, request, [ status, result, event ]);
  }

, onTimeout: function(request)
  {
    request.timeout = true;
    if (this.activerequest == request.id)
    {
      this.activerequest = null;
      this.stopCurrentRequest();
      this.processNextRequest();
    }
    this.handleError(request.onfailure, $wh.JSONRPC.TIMEOUT_ERROR, "Timeout while waiting for response", request.id);
  }

, onWaitTimeout: function()
  {
    this.waittimeoutid = null;
    this.handleWaitTimeouts();
  }

, handleWaitTimeouts: function()
  {
    if (this.waittimeoutid)
    {
      clearTimeout(this.waittimeoutid);
      this.waittimeoutid = null;
    }

    if (!this.waitCallback)
      return;

    var waiting = false;
    var nextTimeout = -1;

    var now = (new Date).getTime();
    for (var i = 0; i < this.requestqueue.length; ++i)
    {
      var req = this.requestqueue[i];
      if (req.waitTimeout >= 0)
      {
        var waitLength = now - req.scheduled;

        if (waitLength >= req.waitTimeout)
          waiting = true;
        else
        {
          var toGo = req.waitTimeout - waitLength;
          if (nextTimeout < 0 || nextTimeout > toGo)
            nextTimeout = toGo;
        }
      }
    }

    if (this.waitingNow != waiting)
    {
      this.waitingNow = waiting;
      this.waitCallback.delay(0, this, [ waiting ]);
    }

    if (nextTimeout >= 0)
      this.waittimeoutid = this.onWaitTimeout.delay(nextTimeout, this);
  }

  /** @short estimate the server's datetime based on the known descrepancy between the date of an reponse from the server and the time on the client
  */
, getEstimatedServerDate: function()
  {
    return new Date(new Date().getTime() + this.__date_diff);
  }
});

$wh.JSONRPC.__Request = new Class(
{ Implements: [$wh.PreloadableAsset]
, cancelled: false
, stack:null
, initialize:function(parent, id, method, params, url, timeout, waittimeout, onsuccess, onfailure, synchronous, errortrace)
  {
    if (parent.options.log)
      console.log('req',this);
    this.parent=parent;
    this.id = id;
    this.request = { id: id
                   , method: method
                   , params: params || []
                   };
    this.url = url;
    this.onsuccess = onsuccess;
    this.onfailure = onfailure;
    this.timeout = timeout;
    this.scheduled = new Date-0;
    this.waittimeout = waittimeout;
    this.synchronous = synchronous;
    this.errortrace = errortrace;

    this.startPreload();
  }
, onStartPreload:function()
  {

  }
, cancel:function()
  {
    //we need to prevent a race when our parent invokes cancel(), but we actually had our __completedCall already queued up. if we still fire onsuccess/onfailure, our parent might think we completed the _next_ request our parent submitted
    this.cancelled=true;
    this.parent.__cancelRequest(this.id);
  }

, __completedCall:function(status,result,event)
  {
    if(event.isaborted)
      this.cancelled=true;

    if(status == 0)
    {
      if(this.onsuccess && !this.cancelled)
        this.onsuccess(result);
      this.donePreload(true);
    }
    else
    {
      if(!this.cancelled)
      {
        if(this.stack)
        {
          console.log("Stack at calling point:");
          console.log(this.stack);
        }
        this.parent.handleError(this.onfailure, status, result, this.id);
      }
      this.donePreload(false);
    }
  }

});



/** @short RPC status codes */
$wh.JSONRPC.HTTP_ERROR = -1     // Error connecting to the RPC server
$wh.JSONRPC.JSON_ERROR = -2     // The returned value could not be decoded into a JSON object
$wh.JSONRPC.PROTOCOL_ERROR = -3 // The return object did not contain an id, or the id did not match the request id
$wh.JSONRPC.RPC_ERROR = -4      // The RPC returned an error
$wh.JSONRPC.OFFLINE_ERROR = -5  // The application is not online (only returned if the onlineonly option was set)
$wh.JSONRPC.TIMEOUT_ERROR = -6  // The request could not be sent or was not answered before within the timeout set in the options
$wh.JSONRPC.SERVER_ERROR = -7   // The server encountered an internal error

})(document.id); //end mootools wrapper
