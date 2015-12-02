/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.net.url');
require ('frameworks.mootools.more.class.binds');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.net.url, frameworks.mootools.more.class.binds
!*/

(function($) { //mootools/scope wrapper

$wh.__debug_fake_upload = null;

/// Global queue manager object
var queue_manager = null;

var upload_chunk_size = 10000000; // 10 MB
var moving_average_max_history = 20000; // average current speed over max 20000 ms of history
var moving_average_min_history = 2000; // Need min 2000ms of history


/** Upload item. Might be a group, or an uploader.
    Fires loadstart, progress*, abort/load/error, loadend events.
*/
var RawUploadItem = new Class(
{ Implements: [ Events, Options ]

  /** Current status of this upload
      '': Not started or busy
      'loaded' Upload complete
      'aborted' Aborted
      'error' An error occurred
  */
, status: '' // '', 'loaded', 'aborted', 'error'

  /// Session id of the item (used to group uploads into one session)
, pvt_sessionid: ''

  /// Parent group (used for sharing session ids)
, pvt_parentgroup: null

  /// Starting time of upload
, pvt_start: null

  /// History of progress events (of last moving_average_max_history ms)
, pvt_history: []

  /// Finishing time of upload
, pvt_end: null

, initialize: function(options)
  {
    this.setOptions(options);
  }

  /// Returns the total size of this item
, getUploadSize: function()
  {
    return 0;
  }

  /// Returns the number of bytes uploaded
, getUploaded: function()
  {
    return 0;
  }

  /// Schedule this item at a queue (or fire events when empty)
, schedule: function()
  {
  }

  /// Abort upload of this item. Must fire events (loadstart, abort, loadend) when not yet scheduled!
, abort: function()
  {
  }

  /// Returns time elapsed, in seconds
, getElapsedTime: function()
  {
    var now = (new Date).getTime();
    if (!this.pvt_start || this.pvt_start == now)
      return 0;

    if (this.pvt_end)
      now = this.pvt_end;

    return (now - this.pvt_start) / 1000;
  }

  /// Time remaing in seconds (0 if unknown / very long / n/a)
, getRemainingTime: function()
  {
    var speed = this.getCurrentSpeed();
    if (!speed)
      return 0;
    var remainingbytes = this.getUploadSize() - this.getUploaded();
    return remainingbytes ? (remainingbytes / speed || 1) : 0;
  }

  /// Returns the average speed over the whole upload
, getAverageSpeed: function()
  {
    return this.getUploaded() / this.getElapsedTime();
  }

  /// Returns speed over last X seconds
, getCurrentSpeed: function()
  {
    if (this.pvt_history.length <= 1)
      return null;

    var last = this.pvt_history[this.pvt_history.length-1];
    var first = this.pvt_history[0];

    if (last.date - first.date < (this.status == 'loaded' ? 1 : moving_average_min_history))
      return null;

    return (last.loaded - first.loaded) / ((last.date - first.date) / 1000);
  }

, getCompletedFiles: function()
  {
    return [];
  }

, getFileTokens: function()
  {
    return [];
  }

, getSessionId: function()
  {
    return this.pvt_sessionid || (this.pvt_parentgroup && this.pvt_parentgroup.getSessionId()) || '';
  }

, setSessionId: function(sessionid)
  {
    this.pvt_sessionid = sessionid;
    if (this.pvt_parentgroup)
      this.pvt_parentgroup.setSessionId(sessionid);
  }

, fireLoadStart: function()
  {
    if($wh.debug.upl)
      console.log("[upload] firing loadstart", this);

    this.pvt_start = (new Date).getTime();
    this.fireEvent('loadstart', { target: this, type: 'loadstart' });
  }

, fireProgress: function()
  {
    if($wh.debug.upl)
      console.log("[upload] firing loadprogress", this);

    var size = this.getUploadSize();
    var loaded = this.getUploaded();

    this.addProgressToHistory(loaded);
    this.fireEvent('progress', { target: this, type: 'progress', loaded: loaded, size: size });
  }

, fireLoad: function()
  {
    if($wh.debug.upl)
      console.log("[upload] firing load", this);

    var size = this.getUploadSize();
    var loaded = this.getUploaded();
    this.pvt_end = (new Date).getTime();

    this.addProgressToHistory(loaded);
    this.fireEvent('load', { target: this, type: 'load', loaded: loaded, size: size });
  }

, addProgressToHistory: function(loaded)
  {
    var now = (new Date).getTime();
    this.pvt_history.push({ date: now, loaded: loaded });
    while ((now - this.pvt_history[0].date) > moving_average_max_history) //
      this.pvt_history.splice(0, 1);
  }

, fireLoadEnd: function()
  {
    if($wh.debug.upl)
      console.log("[upload] firing loadend", this);

    if (!this.pvt_end)
      this.pvt_end = (new Date).getTime();
    this.fireEvent('loadend', { target: this, type: 'loadend' });
  }
});

/** Upload item that does uploading by itself
    Fires loadstart, progress*, abort/load/error, loadend
*/
var SchedulableRawUploadItem = new Class(
{ Extends: RawUploadItem

, initialize: function(options)
  {
    this.parent(options);
  }

, schedule: function()
  {
    queue_manager.schedule(this);
  }

, canStart: function()
  {
  }

, start: function()
  {
  }

, getCompletedFiles: function()
  {
    return [];
  }

, getFileTokens: function()
  {
    return [];
  }
});

/** Aggregates multiple uploader items into one unified upload (all sub-items are aborted upon error). Fires events
    as if the group is one big uploaded item

    This is used to group the chunks of a single file upload, but also to group the files in a multifile upload
*/
var UploaderAggregator = new Class(
{ Extends: RawUploadItem

, pvt_subitems: []
, pvt_aborting: false
, pvt_sentloadstart: false
, pvt_sentloadend: false

, initialize:function(options)
  {
    this.parent(options);
  }

, setItems: function(subitems)
  {
    this.status = '';
    this.pvt_subitems = subitems;
    this.pvt_aborting = false;
    this.pvt_sentloadstart = false;
    this.pvt_sentloadend = false;

    // Listen to events of the sub-items
    this.pvt_subitems.each(function(i)
      {
        i.pvt_parentgroup = this;
        i.addEvent('loadstart', this.gotLoadStart.bind(this))
        i.addEvent('progress', this.fireProgress.bind(this))
        i.addEvent('abort', this.gotAbort.bind(this))
        i.addEvent('error', this.gotError.bind(this))
        i.addEvent('load', this.gotLoad.bind(this))
        i.addEvent('loadend', this.gotLoadEnd.bind(this))
      }.bind(this));
  }

  /// Schedule all subitems, run some events when empty
, schedule: function()
  {
    this.pvt_subitems.each(function(i,idx) { i.schedule(); });

    if (!this.pvt_subitems.length)
    {
      this.gotLoadStart(null);
      this.gotLoad(null);
      this.gotLoadEnd(null);
    }
  }

, getUploadSize: function()
  {
    var size = 0;
    this.pvt_subitems.each(function(i) { size += i.getUploadSize(); });
    return size;
  }

, getUploaded: function()
  {
    var loaded = 0;
    this.pvt_subitems.each(function(i) { loaded += i.getUploaded(); });
    return loaded;
  }

, abort: function()
  {
    if (this.pvt_subitems.length)
    {
      if (!this.pvt_aborting)
        this.pvt_aborting = true;
      this.pvt_subitems.each(function(i) { if (!i.status) i.abort(); });
    }
    else // Always send an abort back, even when not having items yet.
    {
      this.gotLoadStart(null);
      this.gotAbort(null);
      this.gotLoadEnd(null);
    }
  }

, getCompletedFiles: function()
  {
    var result = [];
    if (this.status == 'loaded')
      this.pvt_subitems.each(function(i) { result = result.concat(i.getCompletedFiles()); });
    return result;
  }

, getFileTokens: function()
  {
    var result = [];
    if (this.status == 'loaded')
      this.pvt_subitems.each(function(i) { result = result.concat(i.getFileTokens()); });
    return result;
  }

, gotLoadStart: function(event)
  {
    if (!this.pvt_sendloadstart)
    {
      this.pvt_sendloadstart = true;
      this.fireLoadStart();
    }
  }

, gotAbort: function(event)
  {
    if (!this.status)
    {
      this.status = 'aborted';
      this.fireEvent('abort', { target: this, type: 'abort' });
      this.abort();
    }
  }

, gotError: function(event)
  {
    if (!this.status)
    {
      this.status = 'error';
      this.fireEvent('error', { target: this, type: 'error' });
      this.abort();
    }
  }

, gotLoad: function(event)
  {
    if (!this.status && !this.pvt_subitems.some(function(i) { return i.status != 'loaded'; }))
    {
      var size = this.getUploadSize();
      var loaded = this.getUploaded();
      this.status = 'loaded';
      this.fireLoad();
    }
  }

, gotLoadEnd: function(event)
  {
    if (!this.pvt_subitems.some(function(i) { return i.status == ''; }) && !this.pvt_sendloadend)
    {
      this.pvt_sendloadend = true;
      this.fireLoadEnd();
    }
  }
});


/** Base class for uploaded (whole) files (from file fields, SWF upload)
*/
var UploadFile = new Class(
{ /// Name of the file
  name: ''

  /// Size of the file
, size: 0

  /// Contentt-type of the file
, type: ''

  /// File token (to retrieve the file on the server)
, filetoken: ''

  /// Detectfiletype info
, fileinfo: null

  /// Original File object (if applicable)
, file: null

  /// Parameters to send in request
, params: {}

  /// Base transfer url
, transferbaseurl: ''

, getDownloadUrl:function()
  {
    if(!this.filetoken || !this.transferbaseurl)
      throw "Download URL not yet available";
    var baseurl = this.transferbaseurl + "?type=download&file=" + encodeURIComponent(this.filetoken) + '&filename=' + encodeURIComponent(this.name) + '&size=' + this.size;
    if(this.fileinfo)
    {
       baseurl += '&mimetype=' + encodeURIComponent(this.fileinfo.contenttype);
       if(this.fileinfo.imginfo)
         baseurl += '&width=' + this.fileinfo.imginfo.width + '&height=' + this.fileinfo.imginfo.height;
    }
    return baseurl;
  }
});


/** HTML 5 upload items, wraps a HTML5 file
*/
$wh.Html5UploadItem = new Class(
{ Extends: UploaderAggregator
, Implements: UploadFile

, pvt_host: ''
, pvt_fileid: 0

, initialize: function(host, html5file, options)
  {
    this.parent(options);
    this.pvt_host = host;
    this.name = html5file.name;
    this.size = html5file.size;
    this.type = html5file.type;
    this.file = html5file;
    this.params = (options||{}).params || {}; //FIXME this is a reimplementation of Options
    this.pvt_file = html5file;
  }

, schedule: function()
  {
    var items = [];

    var total = this.file.size;
    var ofs = 0;
    while (true)
    {
      // Upload in chunks
      var chunksize = Math.min(upload_chunk_size, total - ofs);

      items.push(new Html5SingleChunk(this,
        { offset:   ofs
        , size:     chunksize
        , host:     this.pvt_host
        }));

      ofs += chunksize;
      if (ofs == total)
        break;
    }

    this.setItems(items);
    this.transferbaseurl = items[0].transferbaseurl;
    this.parent();
  }

, getCompletedFiles: function()
  {
    return this.status == 'loaded' ? [ this ] : [];
  }

, getFileTokens: function()
  {
    return this.filetoken ? [ this.filetoken ] : [];
  }
});

/** HTML form upload items, uploads INPUT s for IE 8 & IE 9. Only for use by $wh.selectAndUploadFile, too many expectations
    about the form the iframe & form need to be structured, and no expectation that this class will be used from another place.
*/
var HtmlFormUploadItem = new Class(
{ Extends: SchedulableRawUploadItem
, Implements: UploadFile
, Binds: [ "gotLoad", "gotError" ]

, pvt_loaded: 0
, pvt_host: ''

, pvt_input: null
, pvt_iframe: null
, pvt_form: null

, initialize: function(host, iframe, form, input, options)
  {
    this.parent(options);
    this.status = '';

    this.pvt_iframe = iframe;
    this.pvt_host = host;
    this.pvt_form = form;
    this.pvt_input = input;

    // get the name (ignore path)
    var name = input.value.replace(/\\/g, '/');
    name = name.substring(name.lastIndexOf('/') + 1);
    this.name = name;

    // Can't get the size & type of the file, fill with dummies
    this.size = 0;
    this.type = '';
    this.params = (options||{}).params || {}; //FIXME this is a reimplementation of Options

    this.transferbaseurl = $wh.resolveToAbsoluteURL(this.pvt_host, "/.system/filetransfer/filetransfer.shtml");
    var url = this.transferbaseurl + "?type=upload-form"
                                   + "&sessionid=" + this.getSessionId();
    Object.each(this.params, function(value, key) { url += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(value); });

    $(this.pvt_iframe).addEvent('load', this.gotLoad);
    $(this.pvt_iframe).addEvent('error', this.gotError);

    this.pvt_form.action = url;
  }

, cleanup: function()
  {
    if($wh.debug.upl)
      console.log("[upload] Cleanup iframe", this.pvt_iframe);
    this.pvt_iframe.destroy();

    // Release all references to upload stuff, break cycles
    this.pvt_iframe = null;
    this.pvt_form = null;
    this.pvt_input = null;
  }

, gotLoad: function()
  {
    if($wh.debug.upl)
      console.log("Got load from iframe");
    var wnd = this.pvt_iframe.contentWindow;

    if (wnd.uploadresult && !this.status)
    {
      if($wh.debug.upl)
        console.log("Processing form upload");
      this.status = 'loaded';

      this.filetoken = wnd.uploadresult.filetoken;
      this.fileinfo = wnd.uploadresult.fileinfo;
      this.size = wnd.uploadresult.size;
      this.type = wnd.uploadresult.contenttype;
      this.pvt_loaded = this.size;

      this.fireLoadStart();
      this.fireLoad();
      this.fireLoadEnd();

      this.cleanup();
    }
  }

, gotError: function()
  {
    if (this.status)
      return;

    this.status = 'loaded';

    this.fireEvent('error', { target: this, type: 'error' });
    this.fireLoadEnd();

    this.cleanup();
  }

, getUploadSize: function()
  {
    return this.size;
  }

, getUploaded: function()
  {
    return this.pvt_loaded;
  }

, canStart: function()
  {
    return true;
  }

, start: function()
  {
    //this.fireLoadStart();

    // Submit the form
    this.pvt_form.submitbutton.click();
  }

, schedule: function()
  {
    queue_manager.schedule(this);
  }

, abort: function()
  {
    // No cancel supported
  }

, getCompletedFiles: function()
  {
    return this.status == 'loaded' ? [ this ] : []
  }

, getFileTokens: function()
  {
    return this.filetoken ? [ this.filetoken ] : [];
  }
});



/** This component uploads a html5 chunk to the upload receiver
*/
var Html5SingleChunk = new Class(
{ Extends: SchedulableRawUploadItem

, uploadfile: null

  /// XMLHttpRequest object
, xmlhttp: null

  /// Blob to send
, data: null

, pvt_loaded: 0

, pvt_sentloadstart: false
, pvt_sentloadend: false

  /// Options
, options:
    { offset:      0
    , size:        0
    , host:        ''
    }

  /** @param uploadfile Upload file
      @param firstchunk For second+ chunks, reference to first chunk (needed to stitch them together at server side)
      @param options
      @cell options.name Name of chunk (needed for first chunk)
      @cell options.fullsize Full size of file (needed for first chunk)
      @cell options.offset Offset of chunk within file
  */
, initialize: function(uploadfile, options)
  {
    this.parent(options);
    this.uploadfile = uploadfile;
    this.transferbaseurl = $wh.resolveToAbsoluteURL(this.options.host, "/.system/filetransfer/filetransfer.shtml");

    // Slice only when we are are really a subset of the data to be sent
    if (this.options.offset != 0 || this.options.size != uploadfile.file.size)
      this.data = uploadfile.file.slice(this.options.offset, this.options.offset + this.options.size);
    else
      this.data = uploadfile.file;
  }

, getUploadSize: function()
  {
    return this.options.size;
  }

, getUploaded: function()
  {
    return this.pvt_loaded;
  }

  /// Returns whether this chunk can start uploading (either first chunk or first chunk has completed)
, canStart: function()
  {
    return this.options.offset == 0 || this.uploadfile.sessionid != '';
  }

  /** Start upload. Events will be sent (loadstart + progress* + (abort|error|load) + loadend) during upload
  */
, start: function()
  {
    this.xmlhttp = new XMLHttpRequest;
    if (this.xmlhttp.overrideMimeType) // IE doesn't have this.
      this.xmlhttp.overrideMimeType("application/octet-stream");

    if (!this.canStart())
      throw "First chunk must have finished for rest of chunks to be sent";

    var url = this.transferbaseurl + "?type=upload-html5&offset=" + this.options.offset
              + "&chunksize=" + this.options.size
              + "&sessionid=" + this.getSessionId();
    if (this.options.offset != 0)
      url += "&fileid=" + this.uploadfile.pvt_fileid;
    else
    {
      url += "&size=" + this.uploadfile.size
          + "&filename=" + encodeURIComponent(this.uploadfile.name)
      Object.each(this.uploadfile.params, function(value, key) { url += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(value); });
    }

    this.xmlhttp.upload.addEventListener('progress', this.gotProgress.bind(this));
    this.xmlhttp.addEventListener('loadstart', this.gotLoadStart.bind(this));
    this.xmlhttp.addEventListener('abort', this.gotAbort.bind(this));
    this.xmlhttp.addEventListener('error', this.gotError.bind(this));
    this.xmlhttp.addEventListener('load', this.gotLoad.bind(this));
    this.xmlhttp.addEventListener('loadend', this.gotLoadEnd.bind(this));

    this.xmlhttp.open("POST", url, true, "", "");

    /* FIXME: it seems that android browser doesn't like this code -
       work around it!
    */
    this.xmlhttp.send(this.data);
  }

  /// Aborts upload
, abort: function()
  {
    if (!this.status)
    {
      if (this.xmlhttp)
        this.xmlhttp.abort();
      else
      {
        this.gotAbort(null);
        this.gotLoadEnd(null);
      }
    }
  }

, gotLoadStart: function(event)
  {
    if (!this.pvt_sentloadstart)
    {
      this.pvt_sentloadstart = true;
      this.fireLoadStart();
    }
  }

, gotProgress: function(event)
  {
    this.pvt_loaded = event.loaded;
    this.fireProgress();
  }

, gotAbort: function(event)
  {
    if (!this.status)
    {
      this.status = 'aborted';
      this.fireEvent('abort', { target: this, type: 'abort' });
    }
  }

, gotError: function(event)
  {
    if (!this.status)
    {
      this.status = 'error';
      this.fireEvent('error', { target: this, type: 'error' });
    }
  }

, gotLoad: function(event)
  {
    if (this.xmlhttp.status == 200)
    {
      this.pvt_loaded = this.options.size;
      var data = JSON.decode(this.xmlhttp.responseText);
      if (data && data.sessionid)
        this.setSessionId(data.sessionid);
      if (!this.uploadfile.pvt_fileid)
        this.uploadfile.pvt_fileid = (data && data.fileid) || 0;
      if (data && data.filetoken)
        this.uploadfile.filetoken = data.filetoken;
      if (data && data.fileinfo)
        this.uploadfile.fileinfo = data.fileinfo;
      if (data && data.complete && data.contenttype)
        this.uploadfile.type = data.contenttype;
      this.status = 'loaded';
      this.fireLoad();
    }
    else
      this.gotError(event);
  }

, gotLoadEnd: function(event)
  {
    if (!this.pvt_sentloadend)
    {
      this.pvt_sentloadend = true;
      this.fireLoadEnd();
    }
  }
});


/** A group of upload items
*/
$wh.UploadItemGroup = new Class(
{ Extends: UploaderAggregator

, getItems: function()
  {
    return this.pvt_subitems.slice();
  }
, schedule: function()
  {
    this.parent();
  }
});


$wh.UploadItemGroup.extend(
{ /// Generate a group of items from a file input element
  fromFileList: function(uploadhost, filelist, options)
  {
    var items = [];
    for (var i = 0; i < filelist.length; ++i)
      items.push(new $wh.Html5UploadItem(uploadhost, filelist[i], options));

    var group = new $wh.UploadItemGroup;
    group.setItems(items);
    return group;
  }
});

/** Upload manager
*/
var UploadManager = new Class(
{
  pending: []
, running: []

, schedule: function(item)
  {
    if (instanceOf(item, SchedulableRawUploadItem))
    {
      item.addEvent('loadend', this.gotEnd.bind(this, item));
      this.pending.push(item);
    }
    else
      item.schedule();

    this.processQueue();
  }

, gotEnd: function(item)
  {
    this.pending.erase(item);
    this.running.erase(item);
    this.processQueue();
  }

, processQueue: function()
  {
    if (this.running.length < 1 && this.pending.length)
    {
      for (var i = 0; i < this.pending.length; ++i)
      {
        var item = this.pending[i];
        if (item.canStart())
        {
          this.pending.splice(i, 1);
          --i;
          this.running.push(item);
          item.start();
          if (this.running.length == 1)
            break;
        }
      }
    }

    if (this.running.length < 1 && this.pending.length)
      throw "Got blocked items in the queue";
  }
});

queue_manager = new UploadManager;


// Last input used for selecting a file that doesn't have files set
var open_input = null;

/** Object with the object result. Fires 'load' event when files are selected.
*/
var selectHTML5FileResult = new Class(
{ Implements: [ Events ]
, Binds: [ "_gotChange" ]

  /// Function called to see if the download is still accepted
, _accepttest: null
, _destroyed: false
, _input: null

, files: []

, initialize: function(input)
  {
    this._input = input;

    // IE 10 & 11 won't open the file browser if the input element isn't in the DOM
    if (Browser.ie || Browser.name == 'ie')
    {
      if (open_input)
        open_input.destroy();

      this.open_input = this;
      document.body.adopt(this._input);
    }

    input.addEvent("change", this._gotChange);

    if ($wh.__debug_fake_upload)
    {
      $wh.__debug_fake_upload.bind(null, this._input).delay(0);
      $wh.__debug_fake_upload = null;
    }
    else
    {
      // On IE, this blocks. Delay starting the upload on IE giving the user a consistent interface - loadstart event signals start
      this._input.click();
    }

  }

, _gotChange: function(event)
  {
    // Store files in input, destroy input element
    this.files = event && event.wh_fake_files ? event.wh_fake_files : this._input.files;

    if (!this._accepttest || this._accepttest())
    {
      /* Fire event (delayed, so we have consistent API. Eg IE sends 'change' event synchronously, others
         do it asynchronously)
      */
      this.fireEvent.bind(this, "load", { target: this, files: this.files }).delay(0);
    }

    this.last_open_result = null;
    this._destroyInput();
  }

, _destroyInput: function()
  {
    if (this.input)
      this.input.destroy();
    this.input = null;
  }

, destroy: function()
  {
    // Also clear files, it may be huge blobs
    this.files = [];
    this._destroyInput();
  }
});


/** Let the user select one (or multiple) blobs from disk
    @param options
    @cell options.multiple Whether to allow multiple file upload
    @cell options.mimetypes Array of mime types of files that are accepted (can also contain "image/*", "audio/*" or "video/*")
    @return Selection result object. Fires 'load' or 'abort'
    @cell return.input Used input element
    @cell return.files List of selected files (only valid when 'load' event has fired)
*/
$wh.selectHTML5File = function(options)
{
  options = options || {};
  var input = new Element('input',
                        { type: "file"
                        , accept: options.mimetypes ? options.mimetypes.join(",") : ""
                        , multiple: options.multiple ? "multiple" : ""
                        , style: "display: none"
                        });

  if (!input.files)
    throw new Error("This $wh.selectHTML5File function only works on browsers with a functioning File API");

  return new selectHTML5FileResult(input);
}

var last_upload_element = null;

/** Open a file selection dialog and upload one or more files. Can only be called within a click handler!
    @param options
    @cell options.host Upload host override, defaults to window.location.href. CORS minefield, not tested! Breaks IE 8 & 9 upload!
    @cell options.multiple Whether to allow multiple files (not supported in IE 8 & 9)
    @cell options.mimetypes Array of mime types of files that are accepted (can also contain "image/*", "audio/*" or "video/*")
    @return Upload group, of type $wh.UploadItemGroup.
      Fires:
      - loadstart: When uploading starts. Upload will not start at all when the user cancels the selection dialog!!!
      - progress: Progress events during upload
      - abort: When aborted manually with abort() function
      - error: On upload error
      - load: On succesfull upload completion
      - loadend: After upload action (with or without errors)
      Event structure
      - target: upload group
      - type: name of event
      - size: total size (only progress & load events). 0 on IE 8 & 9 with progress events during upload!
      - loaded: Uploaded size (only progress & load events). 0 on IE 8 & 9 with progress events during upload!
      Use .getFileTokens() to get the file tokens, or .getCompletedFiles() to get the individual items (for name, size, types).
      To the upload abort, use .abort().
*/
$wh.selectAndUploadFile = function(options)
{
  options = options || {};

  /* We can't detect when a user cancels the file selection dialog, no actions are triggered. And because we need (in IE)
     to add the input/iframe to the DOM we need to do reuse/cleanup of those items.
  */

  // Determine the host to use. For IE8 & 9, we'd have cross-domain communication issues with the iframe. We could probably
  // work with postMessage communication if needed, no priority for now
  var host = options.host || window.location.href;

  var group = new $wh.UploadItemGroup(options);

  var testinput = new Element('input', { type: "file" });
  var have_html5upload = !!testinput.files;
  testinput.destroy();

  if (have_html5upload && !$wh.debug.ie9upload)
  {
    if($wh.debug.upl)
      console.log("[upload] HTML5 upload start");

    // HTML 5 supported upload
    $wh.selectHTML5File(options).addEvents(
      { abort:  group.abort.bind(group)
      , load:   function(event)
                {
                  /* Create HTML5 upload items for every file. Normally, you would use $wh.UploadItemGroup.fromFileList,
                     but we need to do this manually because we have a pre-existing UploadItemGroup.
                  */
                  var items = Array.from(event.files).map(function(item)
                      {
                        return new $wh.Html5UploadItem(host, item, { params: options.params });
                      });

                  group.setItems(items);

                  // Immediately start the upload
                  group.schedule();
                }
      });

    return group;
  }

  /* The method used here is creating a form within an iframe, with a file input. This necessary for IE 8 & 9. We still
      need a click event to open the file browse dialog, but the only way for IE8 & 9 to submit the form (without throwing
      an 'access denied' error) is for that form to reside in an iframe).

      We needed that iframe to capture the form response anyway, so no problem there
  */

  // Create the iframe, add it to the document (need that to initialize the document inside the iframe)
  var iframe = last_upload_element;
  var doc;

  if (!iframe)
  {
    iframe = new Element('iframe', { style: "position: absolute;top:-100px;left:-100px;width:1px;height:1px;opacity:0" });
    $(document.body).adopt(iframe);
    doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document) || iframe.document;
    if (!doc)
      throw new Error("Newly created iframe has no document");

    // Open & close the document to make sure it is initialized (and has a body element)
    doc.open();
    doc.close();
  }
  else
  {
    doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document) || iframe.document;
    if (!doc)
      throw new Error("Reused iframe has no document");
  }

  // (Re-)initialize a form within the iframe. Throw away old form, so its data is released.
  // FIXME: also add options.params, so we can use this function from tollium
  doc.body.innerHTML =
    '<form id="form" method="post" enctype="multipart/form-data">'+
    '  <input type="file" id="file" name="file" '+
        (options.mimetypes ? 'accept="'+options.mimetypes.join(',')+'" ' : '')+
        '/>'+
    '  <input type="text" id="debugname" name="debugname" />'+
    '  <input type="text" id="debugfile" name="debugfile" />'+
    '  <input type="submit" id="submit" name="submitbutton" />'+
    '</form>';

  var form = doc.getElementById('form');
  var input = doc.getElementById('file');

  var clickres = { clicked: false };

  var callback = iframeInputFilesChanged.bind(null, options, iframe, form, input, group, clickres);

  // No mootools available within the iframe, use native functions. If the upload is started, all references are released
  // by the HtmlFormUploadItem, otherwise when the iframe is reused (the form thrown away at innerHTML set)
  if (input.attachEvent)
    input.attachEvent('onchange', callback);
  else
    input.addEventListener('change', callback);

  // Save for reuse
  last_upload_element = iframe;

  if($wh.__debug_fake_upload)
  {
    $wh.__debug_fake_upload(input, callback);
    $wh.__debug_fake_upload = null;
  }
  else
  {
    // On IE, this blocks. Delay starting the upload on IE giving the user a consistent interface - loadstart event signals start
    // when the user has selected a file.
    input.click();
  }

  return group;
}

$wh.UploadFile = function(files, options)
{
  options = options || {};

  // Determine the host to use. For IE8 & 9, we'd have cross-domain communication issues with the iframe. We could probably
  // work with postMessage communication if needed, no priority for now
  var host = options.host || window.location.href;

  var group = new $wh.UploadItemGroup(options);

  var input = new Element('input', { type: "file", multiple: options.multiple ? "multiple" : "", style: "display: none" });
  if (input.files && !$wh.debug.ie9upload)
  {
    if($wh.debug.upl)
      console.log("[upload] HTML5 upload start");

    /* Create HTML5 upload items for every file. Normally, you would use $wh.UploadItemGroup.fromFileList,
       but we need to do this manually because we have a pre-existing UploadItemGroup.
    */
    var items = Array.from(files).map(function(item)
        {
          return new $wh.Html5UploadItem(host, item, { params: options.params });
        });

    group.setItems(items);

    // Start the upload with a delay, so the group will be returned first
    group.schedule.delay(0, group);

    return group;
  }
}

function iframeInputFilesChanged(options, iframe, form, input, group, clickres, event)
{
  clickres.clicked = true;
//  if (Browser.name == 'ie')
  {
    // Form iframe is now used (will be deleted when upload ends). Release our reference, next upload will get a new iframe
    // (allows multiple uploads at the same time)
    last_upload_element = null;
  }

  // Add a delay to the starting of the upload, cause this callback is called synchronously. Want a consistent API.
  startFileUpload.bind(null, options, iframe, form, input, group, event).delay(0);
}

function startFileUpload(options, iframe, form, input, group, event)
{
  // Determine the host to use. For IE8 & 9, we'd have cross-domain communication issues with the iframe. We could probably
  // work with postMessage communication if needed, no priority for now
  var host = options.host || window.location.href;

  // IE only has one file to upload within an input, no problems with multiple files
  // the HtmlFormUploadItem handler will automatically delete the iframe when done
  var item = new HtmlFormUploadItem(host, iframe, form, input, options);

  // Override uploaded files if requested for tests
  if (event.wh_fake_files)
  {
    var debugname = form.ownerDocument.getElementById('debugname');
    debugname.value = "debug:" + event.wh_fake_files[0].name;
    item.name = event.wh_fake_files[0].name;

    var debugfile = form.ownerDocument.getElementById('debugfile');
    debugfile.value = event.wh_fake_files[0].data;
  }

  // Register the item in the upload group
  group.setItems([ item ]);

  // Immediately start the upload
  group.schedule();
}

})(document.id); //end mootools/scope wrapper
