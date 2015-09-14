/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.net.requests');
/*! LOAD: frameworks.mootools.core, wh.net.requests
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

$wh.EventServerConnection = new Class(
{ Extends: $wh.InternetRequester

, options: { url: '' //Host url of event server
//           , onData: null  // Callback when data comes in
           , waitlength: 4*60
           }

  // Last seen server ID
, serverId: ''

  // Current subscribed groups
, groups: []

  // Last id per group (unsubscribed groups are reset)
, lastIds: {}

  // Active?
, active: false

  // Broadcasting?
, broadcasting: false

  // Have response yet?
, have_response: false

  // Currently pending broadcasts
, broadcasts: []

  // timeout
, timeout: null

  // Cache defeat
, cachecounter: 0

  // Date of last request
, lastrequest: null

  // Date of last response
, lastresponse: null

  // Last error message
, lasterrormessage: ''

  /* Override for wait length. Doubled at every receive of timeout response. Starts
     at 35 seconds, some devices (Galaxy Tab 7) disconnect after 33 secs. Timeout is
     maxed by options.waitlength.
  */
, waitlengthoverride: 35

  /** Initialize.
      @param options
      @cell options.url Url to eventserver
      @cell options.onData Message callback
  */
, initialize: function(options)
  {
    this.parent(options);
    if(Browser.ie) //6 || Browser.ie7 || Browser.ie8;  //FIXME REMOVE, UNSAFE (as it allows disabling <script> validation)
      this.options.requestmethod='jsonp';

    this.addEvent("requestend", this.onResponse.bind(this));
  }

, destroy: function()
  {
    this.stop();
  }

, destroyConn: function()
  {
    this.stopCurrentRequest();
  }

  /// Set groups
, setGroups: function(groups)
  {
    // Gather last ids from all surviving groups
    var newLastIds = {};
    for (var i = 0, e = groups.length; i < e; ++i)
    {
      var groupid = groups[i];
      newLastIds[groupid] = this.lastIds[groupid];
    }

    this.groups = groups;
    this.lastIds = newLastIds;

    if (this.options.log)
      console.log('EventServer: Subscribed to groups: ' + groups);

    this.scheduleRequest();
  }

  /// Start communication
, start: function()
  {
    if(this.active)
      return;

    if (this.options.log)
      console.log('EventServer: Starting');

    this.active = true;
    this.scheduleRequest();
  }

  /// (Temporarily) suspend communication (broadcast may continue). Restart with start. Not tested.
, suspend: function()
  {
    if (this.options.log)
      console.log('EventServer: Suspending');

    this.active = false;
    if (!this.broadcasting)
    {
      this.destroyConn();
      this.stopCurrentRequest();
    }
  }

  /// Stop communication (kills everyting)
, stop: function()
  {
    if (this.options.log)
      console.log('EventServer: Stopping');

    this.destroyConn();
    this.stopCurrentRequest();

    if (this.timeout)
      clearTimeout(this.timeout);

    this.active = false;
    this.broadcasting = false;
    this.have_response = false;
    this.broadcasts = [];
  }

, broadcastMessage: function(msg, group, token, options)
  {
    if (!group)
      throw "No group set";
    if (!token)
      throw "No valid write token set";

    // Store all data in the options
    if (!options)
      options = {};
    options.msg = msg;
    options.group = group;
    options.token = token;
    if (typeOf(options.maxretries) == "undefined")
      options.maxretries = 3;
    else
      ++options.maxretries;

    this.broadcasts.push(options);

    this.scheduleRequest();
  }

  /// Returns date of last response
, getLastResponseDate: function()
  {
    return this.lastresponse;
  }


, addURLparam: function(url, name, value)
  {
    url += url.indexOf('?') >= 0 ? '&' : '?';
    return url + encodeURIComponent(name) + '=' + encodeURIComponent(value);
  }

, getGroupListenURL: function()
  {
    if (this.waitlengthoverride)
    {
      if (this.waitlengthoverride > this.options.waitlength)
      {
        if (this.options.log)
          console.log('EventServer: override timeout not needed anymore');
        this.waitlengthoverride = 0;
      }
      else if (this.options.log)
        console.log('EventServer: override timeout to ', this.waitlengthoverride);
    }
    else if (this.options.log)
      console.log('EventServer: no override timeout');

    var timeout = this.waitlengthoverride || this.options.waitlength;

    var url = this.options.url;
    var groups = '';
    for (var i = 0, e = this.groups.length; i != e; ++i)
    {
      if (i != 0)
        groups += ',';

      var groupid = this.groups[i];
      groups += groupid + '/' + (this.lastIds[groupid] || 0);
    }
    url = this.addURLparam(url, 'groups', groups);
    url = this.addURLparam(url, 'timeout', timeout);
    if (this.serverId)
      url = this.addURLparam(url, 'sid', this.serverId);
    return url;
  }

, scheduleRequest: function()
  {
    if (this.options.log)
      console.log('EventServer: scheduleRequest');

    // If currently broadcasting, wait for it to finish
    if (this.broadcasting)
    {
      if (this.options.log)
        console.log('EventServer: scheduleRequest aborting, already broadcasting');
      return;
    }

    if (!this.active)
    {
      if (this.options.log)
        console.log('EventServer: scheduleRequest aborting, not active');
      this.stopCurrentRequest();
      return;
    }

    var broadcast = null;
    if (this.broadcasts.length)
      broadcast = this.broadcasts.shift();

    this.restartRequest(broadcast);
  }

, restartRequest: function(broadcast)
  {
    if (broadcast && --broadcast.maxretries)
      broadcast = null;

    if (this.options.log)
      console.log('EventServer: restartRequest', broadcast, this.active);

    this.stopCurrentRequest();

    if (!broadcast && !this.active)
    {
      if (this.options.log)
        console.log('EventServer: restartRequest aborting');
      return;
    }


    var url = '';

    if (broadcast)
    {
      url = this.options.url;

      url = this.addURLparam(url, 'postgroup', broadcast.group);
      url = this.addURLparam(url, 'token', broadcast.token);
      if (broadcast.tag && typeOf(broadcast.tag) == "string")
        url = this.addURLparam(url, 'tag', broadcast.tag);
      if (broadcast.ttl && typeOf(broadcast.ttl) == "number")
        url = this.addURLparam(url, 'ttl', broadcast.ttl);

      if (this.lasterrormessage)
        url = this.addURLparam(url, 'lasterror', this.lasterrormessage);
      this.have_response = false;
    }
    else
    {
      // No need to schedule
      if (this.groups.length == 0)
        return;

      url = this.getGroupListenURL();
      url = this.addURLparam(url, 'lasterror', this.lasterrormessage);
    }

    try
    {
      this.currentbroadcast = broadcast;

      if (this.options.requestmethod=='jsonp')
      {
        var req = this.prepareJavascriptCallback();
        url = this.addURLparam(url, 'callback', req.callback);

        if (broadcast)
        {
          url = this.addURLparam(url, 'method', 'post');
          url = this.addURLparam(url, 'data', broadcast.msg);
        }
        var cachedefeat = (new Date()).getTime() + '-' + ++this.cachecounter;
        url = this.addURLparam(url, 'uncache', cachedefeat);
        this.startJavascriptRequest(url, req);
      }
      else
      {
        if (this.options.log)
          console.log('Eventserver: do request:', broadcast?'post':'get', url);

        this.startXMLHTTPRequest(broadcast?"post":"get", url, broadcast?broadcast.msg:null);
      }

      this.lastrequest = new Date();

      if (this.timeout)
        clearTimeout(this.timeout);
      this.timeout = this.restartRequest.bind(this, broadcast).delay((this.options.waitlength + 10) * 1000);
    }
    catch(e)
    {
      if (this.options.log)
        console.log('exception', e.message);
      return;
    }

    if (broadcast)
      this.broadcasting = true;
  }

, onLoadEnd: function(event)
  {
    this.onResponse(event);
  }

, onResponse: function(event)
  {
    this.have_response = true;

    if (event.success)
    {
      var decoded = event.responsejson;

      // Update last response date (not when broadcasting, though)
      if (!this.currentbroadcast)
        this.lastresponse = new Date();

      if (decoded)
        this.handleReceivedResponse(decoded);
      else
        this.handleRequestError(this.currentbroadcast, { message: 'decodeerror' });
    }
    else
      this.handleRequestError(this.currentbroadcast, event);
  }

, handleReceivedResponse: function(decoded)
  {
    this.broadcasting = false;
    this.lasterrormessage = '';

    if (decoded)
    {
      if (this.options.log)
        console.log('EventServer: got response');
      this.serverId = decoded.srvid;

      if (this.timeout)
        clearTimeout(this.timeout);

      if (decoded.msgs.length)
      {
        for (var i = 0, e = this.groups.length; i < e; ++i)
          this.lastIds[this.groups[i]] = decoded.lid;

        var time = decoded.time;
        if (time < 1000000000000) // Still in seconds format?
          time *= 1000;

        if (this.options.log)
          console.log('EventServer: got messages: ', decoded.msgs);
        this.fireEvent.bind(this,'data', { target: this, msgs: Array.clone(decoded.msgs), time: new Date(time) }).delay(1);
      }
      else
      {
        // Got a timeout response, double the wait length override
        this.waitlengthoverride *= 2;
      }
    }
    else
      console.error('EventServer: Got empty response from eventserver');

    if (this.options.log)
      console.log('EventServer: rescheduling');
    this.scheduleRequest();
  }

, handleRequestError: function(broadcastdata, event)
  {
    if (this.options.log)
      console.log('EventServer: got error: ' + event.message);

    this.broadcasting = false;
    this.lasterrormessage = event.message;

    if (this.timeout)
      clearTimeout(this.timeout);

    // Retry after 7 seconds. But if the previous request had been running for more than 30 secs, restart immediately
    // (workaround for Galaxyx Tab 7 disconnecting after 33 secs)
    var timeout = 7000;
    if ((new Date() - this.lastrequest) >= 30 * 1000)
      timeout = 1;

    this.timeout = this.restartRequest.bind(this, broadcastdata).delay(timeout);
  }


});

})(document.id); //end mootools wrapper
