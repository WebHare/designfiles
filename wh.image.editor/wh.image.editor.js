/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.util.dragevents');
require ('wh.image.internal.surface');
require ('wh.image.internal.positioning');
require ('wh.ui.internal.toolbars');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.util.dragevents
    LOAD: wh.image.internal.surface, wh.image.internal.positioning, wh.ui.internal.toolbars
!*/

(function($) { //mootools wrapper

$wh.ImageEditor = new Class(
{ Implements: [Events,Options]
, el:null
, toolbar:null
, surface:null
, options: { width: 640
           , height: 320 //ADDME default toolbar height!
           , toolbarheight: 60
           , addbuttons: null
           }

, initialize:function(el, options)
  {
    this.el = $(el);
    this.setOptions(options);

    this.toolbar = new $wh.Toolbar();
    this.surface = new $wh.ImageSurface();
    this.surface.addEvent("ready", this.onLoad.bind(this));

    this.el.empty();
    this.el.adopt($(this.toolbar));
    this.el.adopt($(this.surface));
    this.setSize(this.options.width, this.options.height);

    if(options.imgurl)
      this.setImageByURL(options.imgurl);

    //Set up save and cancel buttons
    if(this.options.addbuttons)
    {
      if(this.options.addbuttons.contains('save'))
        this.toolbar.addButton(new $wh.ToolbarButton(this.toolbar, { label: 'Save', onExecute:this.onSave.bind(this) }));
      if(this.options.addbuttons.contains('cancel'))
        this.toolbar.addButton(new $wh.ToolbarButton(this.toolbar, { label: 'Cancel', onExecute:this.onCancel.bind(this) }));
    }

    //Set up positioning interaction
    $wh.addImageCropButton(this.toolbar, this.surface);
  }
, onLoad: function(imgdata)
  {
    this.fireEvent("load", { target: this, width: imgdata.width, height: imgdata.height });
  }
, onSave: function()
  {
    var imgurl = this.surface.getImageAsUrl();
    if(imgurl)
      this.fireEvent("save", { target:this, imgurl: imgurl, width: this.surface.canvas.width, height: this.surface.canvas.height } );
  }
, onCancel: function()
  {
    this.fireEvent("cancel", { target:this } );
  }
, setSize:function(w,h)
  {
    this.toolbar.setSize(w, this.options.toolbarheight);
    this.surface.setSize(w, h-this.options.toolbarheight);
  }
, setImageByURL:function(imgurl, orientation)
  {
    this.surface.loadImageByUrl(imgurl, orientation);
  }
, getImageAsURL:function(mimetype, quality)
  {
    return this.surface.getImageAsUrl(mimetype, quality);
  }
, getImageAsBlob: function(callback, mimetype, quality)
  {
    this.surface.getImageAsBlob(callback, mimetype, quality);
  }
});

/* Simple image editor 'edit' button integration */
var modallayer, imgeditor;

function saveImageEditor(settings, event)
{
  settings.updatebyurl({ url: event.imgurl
                       , width: event.width
                       , height: event.height
                       });
  closeImageEditor();
}

function runImageEditor(settings)
{
  closeImageEditor();

  //ADDME use $wh.popup (or only if so configured?)
  modallayer = new Element("div", { "class": "wh-imageeditor-fullscreen" });
  document.body.adopt(modallayer);

  //ADDME capture screen resizes
  myimgeditor = new $wh.ImageEditor(modallayer,
                                   { imgurl: settings.imgurl
                                   , addbuttons: ['save','cancel']
                                   , onSave: saveImageEditor.bind(null, settings)
                                   , width: window.getSize().x
                                   , height: window.getSize().y
                                   });

}
function closeImageEditor()
{
  if(!modallayer)
    return;

  modallayer.dispose();
  modallayer = null;
}

$wh.ImageEditor.getImageEditCallback = function()
{
  return !(Browser.ie && Browser.version<=9) ? runImageEditor : null;
}

})(document.id); //end mootools wrapper
