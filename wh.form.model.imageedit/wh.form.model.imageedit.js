/* generated from Designfiles Public by generate_data_designfles */
require ('wh.form.model.fileedit');
/*! LOAD: wh.form.model.fileedit
!*/

//ADDME: Ensure we refresh pending images at most every 30 minutes, or the server will lose them if they were sessionbacked.

(function($) { //mootools wrapper

$wh.Form.ImageEditBase = new Class(
{ Extends: $wh.Form.FileEditBase
, imgloadingnode: null
, imgnode: null

, initialize: function(formhandler, node, parentmodel)
  {
    if($wh.ImageEditor)
      this.editcallback = $wh.ImageEditor.getImageEditCallback();

    this.parent(formhandler, node, parentmodel);
  }
, loadFiles:function(fileinfos, userchange)
  {
    this.parent(fileinfos, userchange);
    if(this.imgnode)
      this.imgnode.dispose();

    if(fileinfos && fileinfos.length==1 && this.node)
    {
      this.imgnode = this.createPreviewImage(fileinfos[0]);
      this.imgnode.inject(this.node,'top');
    }
  }
, createPreviewImage:function(imgfileinfo)
  {
    var cover = $wh.getCoverCoordinates( imgfileinfo.width
                                       , imgfileinfo.height
                                       , this.node.getStyle("width").toInt()
                                       , this.node.getStyle("height").toInt()
                                       , true);

    var imgnode = new Element("img", { "class": "currentimage"
                                      , "width": imgfileinfo.width
                                      , "height": imgfileinfo.height
                                      , "styles": { "width": cover.width
                                                  , "height": cover.height
                                                  , "margin-left": cover.left
                                                  , "margin-top": cover.top
                                                  }
                                      , "src": imgfileinfo.url
                                      });
    return imgnode;
  }
, reflectToServer:function(dataurl, filename)
  {
    if(this.imgloadingnode)
    {
      var abortednode = this.imgloadingnode;
      this.imgloadingnode = null;
      abortednode.src = "about:blank"; //ADDME dummy gif to clear up memory ? there was a reason to use those on some devices ? (iPad not releasing memory?)
      abortednode.dispose();
    }
    else
    {
      $wh.updateUIBusyFlag(+1);
    }

    this.imgloadingnode = new Element("img");
    this.imgloadingnode.addEvents({ "load":  this.onImageReflected.bind(this, this.imgloadingnode, dataurl, filename)
                                  , "error": this.onImageReflectFail.bind(this, this.imgloadingnode, dataurl, filename)
                                  });

    this.imgloadingnode.src = dataurl;
  }
, decodeTransferUrl:function(urlinfo, fileinfo)
  {
    var data = this.parent(urlinfo, fileinfo);
    data.width  = fileinfo && fileinfo.imginfo ? fileinfo.imginfo.width  : urlinfo.getVariable('width').toInt();
    data.height = fileinfo && fileinfo.imginfo ? fileinfo.imginfo.height : urlinfo.getVariable('height').toInt();
    return data;
  }
/*, deleteFile:function()
  {
    if(this.imgnode)
    {
      this.imgnode.dispose();
      this.imgnode = null;
    }
    this.parent();
  }*/
, editFile:function()
  {
    if(!this.imgnode)
      return;

    this.editcallback({ imgurl: this.imgnode.src
                      , updatebyurl: this.onEditedImage.bind(this)
                      });
  }
, onEditedImage:function(info)
  {
    var currentvalue = this.getValue();
    this.loadFiles( [{ url: info.url
                     , width: info.width
                     , height: info.height
                     , filename: currentvalue.filename
                     }]);
  }
});

$wh.Form.ImageArrayBase = new Class(
{ Extends: $wh.Form.FileArrayBase
, createHelperModel:function()
  {
    var model = new $wh.Form.ImageEditBase(null, null, this);
    model.editcallback = null;
    return model;
  }
});

$wh.Form.models["wh.imageedit"] = $wh.Form.ImageEditBase;
$wh.Form.models["wh.imagearray"] = $wh.Form.ImageArrayBase;

})(document.id); //end mootools wrapper
