/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
/*! REQUIRE: wh.compat.base !*/

(function($) { //mootools wrapper

$wh.DownloadManager = new Class(
{ Implements: [Events,Options]
, started: false
, destroyed: false
, cookieinterval: null

, initialize:function(url, options)
  {
    this.url=url;
    this.setOptions(options);

    this.downloadid=(Math.random().toString().substr(2)) + (++$wh.DownloadManager.dlid);
    this.cookiename="wh-download-" + this.downloadid;
  }
, destroy:function()
  {
    if(this.dlframe)
      this.dlframe.dispose();
    this.destroyed=true;
  }
, startDownload:function()
  {
    if(this.started)
      return;

    this.started = true;
    var dlurl = this.url + (this.url.indexOf('?')==-1 ? '?' : '&') + 'wh-download=' + this.downloadid;
    this.dlframe = new Element("iframe", {styles: {"display":"none"}
                                         ,src: dlurl
                                         ,events: {"load": this.onDownloadFrameLoad.bind(this)
                                                  }
                                         });
    this.dlframe.store("failurehandler", this.onDownloadFailure.bind(this));
    document.body.appendChild(this.dlframe);
    this.cookieinterval=window.setInterval(this.cookieCheck.bind(this), 100);
  }
, cookieCheck:function()
  {
    var data = Cookie.read(this.cookiename);
    if(!data)
      return;

    Cookie.dispose(this.cookiename);
    window.clearInterval(this.cookieinterval);

    if(this.destroyed)
      return;

    this.fireEvent("start", {target:this});
  }
, onDownloadFrameLoad:function(event)
  {
    console.log("frameloaded", event)
  }
, onDownloadFailure:function(errorinfo)
  {
    window.clearInterval(this.cookieinterval);
    if(this.destroyed)
      return;

    this.fireEvent("fail", {target:this, errorinfo: errorinfo});
  }
});

$wh.DownloadManager.dlid=0;
$wh.DownloadManager.__failurecallback = function(iframe, data)
{
  $(iframe).retrieve("failurehandler")(data);
}

})(document.id); //end mootools wrapper
