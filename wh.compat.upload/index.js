/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.compat.base');
/*! LOAD: wh.compat.base !*/

(function($) { //mootools wrapper

$wh.UploadManager = new Class(
{ Implements: [Events,Options]

, options: { multiple: false
           , endpoint: ''
           }

, initialize:function(options)
  {
    this.setOptions(options);
    if(!this.options.endpoint)
      throw "$wh.UploadManager requires an endpoint to receive the upload"
  }
, destroy: function()
  {
  }
});
$wh.UploadManager.uploadid = 0;

$wh.UploadManager.Form = new Class(
{ Extends: $wh.UploadManager
, node:null
, submitted:false
, completed:false
, initialize:function(node, options)
  {
    this.parent(options);
    this.node=$(node);

    this.uploadid = 'wh_upload_' + (++$wh.UploadManager.uploadid);
    this.iframereceiver = new Element("iframe", {src:"about:blank"
                                                ,styles:{"display":"none"}
                                                ,events:{"load": this.onPostframeLoad.bind(this)
                                                        ,"error": this.onPostframeLoad.bind(this)
                                                        }
                                                ,name: this.uploadid
                                                }).inject(this.node);
    this.iframereceiver.store("completionhandler", this.onUploadComplete.bind(this));

    this.form = new Element("form", { target: this.uploadid
                                    , method: "post"
                                    , enctype: "multipart/form-data"
                                    , action: this.options.endpoint
                                    , styles: { margin: 0 }
                                    }).inject(this.node);

                                    this.form.onsubmit=function(){alert('!');};

    this.inputelement = new Element("input", {type:"file"
                                             ,name:"file"
                                             ,events:{"change": this.onChange.bind(this) }
                                             }).inject(this.form);
   this.fireEvent('init', {target:this});
  }
, destroy:function()
  {
    this.iframereceiver.destroy();
    this.form.destroy();
    this.inputelement.destroy();

    this.form.dispose();
    this.iframereceiver.dispose();
    this.parent();
  }
, onChange:function()
  {
    if(this.submitted)
      return;

    this.form.submit();
    this.submitted=true;
    this.fireEvent('start', {target:this})
    this.inputelement.set('disabled','disabled');
  }
, onPostframeLoad:function(event)
  {
    if(!this.submitted || this.completed)
      return; //likely a superfluous load (either about:blank or after onUploadComplete)

    this.compled=true;
    this.fireEvent("fail", { target: this });
  }
, onUploadComplete:function(data)
  {
    if(this.completed)
      return;

    this.completed=true;
    this.fireEvent("complete", { target:this, files: [{ filename: data.filename, size: data.size, token: data.token }] });
  }
});

$wh.UploadManager.getSupportedMethods = function()
{
  var methods=['Form'];

    /*if(typeof window.FileReader != 'undefined'
       && (function() { var fi = document.createElement('input'); fi.type = 'file'; return fi.multiple === false || fi.multiple === true; })()
    {
      toddUploadMethod = 'html5';
    }else*/

  if(window.SWFUpload)
    methods.push('SWFUpload');
  return methods;
}
$wh.UploadManager.__completioncallback = function(iframe, data)
{
  $(iframe).retrieve("completionhandler")(data);
}

})(document.id); //end mootools wrapper
