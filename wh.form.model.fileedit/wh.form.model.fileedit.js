/* generated from Designfiles Public by generate_data_designfles */
require ('./fileedit.css');
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.class.binds');
require ('wh.ui.base');
require ('wh.net.upload');
require ('wh.form.model.base');
require ('wh.net.url');
/*! LOAD: frameworks.mootools.core, frameworks.mootools.more.class.binds, wh.ui.base, wh.net.upload, wh.form.model.base, wh.net.url
!*/

//ADDME: Ensure we refresh pending images at most every 30 minutes, or the server will lose them if they were sessionbacked.

(function($) { //mootools wrapper

$wh.Form.FileEditBase = new Class(
{ Extends: $wh.Form.InputGroupBase
//, Implements: [ Options, Events ]
, Binds: ["onAddReplace","onFilesReceived","onEdit","onDelete","onClientFileSelected"]
, el: null
, buttonholder: null
, explicitdelete: false
, valuenode: null
, filenamenode: null
, dirtynode: null
, emptynode: false
, buttons:['add','edit','replace','delete']
, editcallback: null
/*, options: { editcallback: null
           , buttons: ['add','edit','replace','delete']
           }
*/
, addbutton: null
, editbutton: null
, replacebutton: null
, deletebutton: null
, currentfilenode: null
, fileinfos: null
, multiple: false
, onsetfiles:null

, initialize: function(formhandler, node, parentmodel)
  {
    this.parent(formhandler, node, parentmodel);
    if(formhandler)
      this.setupForForm();
  }
, setupForForm:function()
  {
    if(!this.getName())
      return console.error("File edit has no name", this);

    if (this.node.hasAttribute("data-buttons"))
      this.buttons = this.node.getAttribute("data-buttons").split(" ").filter(function(button)
      {
        // Initially, this.buttons holds all possible values, so we can use the original value to check if the supplied
        // buttons are supported
        return this.buttons.contains(button);
      }, this);

    this.node.addEvents( { "click:relay(.addbutton)": this.onAddReplace
                         , "click:relay(.replacebutton)": this.onAddReplace
                         , "click:relay(.editbutton)": this.onEdit
                         , "click:relay(.deletebutton)": this.onDelete
                         });

    this.node.addClass("wh-fileedit").addClass("nofile").addClass("wh-inputgroup");
    if(this.editcallback)
      this.node.addClass("clientedit");

    //ADDME allow data-options etc to force specific button generation?

//    imgedit.valuenode.addEvent("input", this.onImageChange.bind(this));

    this.valuenode = this.node.getElement('input[type="hidden"][name="' + this.getName() + '"]');
    if(!this.valuenode)
    {
      this.valuenode = this.node.getElement('input[type="hidden"]');
      if(this.valuenode && !this.valuenode.name)
        this.valuenode.name = this.getName();
    }
    if(!this.valuenode)
    {
      this.valuenode = new Element("input", {"type": "hidden"
                                            ,"name": this.getName()
                                            }).inject(this.node);
    }
    this.emptynode = this.node.getElements("*").length == 1; //only the valuenode may exist
    if(this.emptynode)
      this.generateSubElements();
    else
      this.currentfilenode = this.node.getElement(".currentfile");

    this.explicitdelete = this.valuenode.value == '-';
    if(!this.explicitdelete && this.valuenode.value)
    {
      var fileinfo = this.getFileInfoFromTransferUrl(this.valuenode.value);
      this.loadFiles([fileinfo], false);
    }
  }

, generateSubElements:function()
  {
    var buttons=[];

    if(!this.currentfilenode)
      this.currentfilenode = new Element('span', { "class": "currentfile"}).inject(this.node);

    if(!this.node.getElement(".addbutton") && this.buttons.contains('add'))
    {
      this.addbutton = new Element("button",
                                  { "class": "addbutton"
                                  , "text": Locale.get("wh-common.buttons.add")
                                  , "type": "button"
                                  });
      buttons.push(this.addbutton);
    }

    if(!this.node.getElement(".replacebutton") && this.buttons.contains('replace'))
    {
      this.replacebutton = new Element("button",
                                      { "class": "replacebutton"
                                      , "text": Locale.get("wh-common.buttons.replace")
                                      , "type": "button"
                                    });
      buttons.push(this.replacebutton);
    }

    if(!this.node.getElement(".editbutton") && this.buttons.contains('edit') && this.editcallback)
    {
      this.editbutton = new Element("button",
                                   { "class": "editbutton"
                                   , "text": Locale.get("wh-common.buttons.edit")
                                   , "type": "button"
                                   });
      buttons.push(this.editbutton);
    }

    if(!this.node.getElement(".deletebutton") && this.buttons.contains('delete'))
    {
      this.deletebutton = new Element("button",
                                     { "class": "deletebutton"
                                     , "text": Locale.get("wh-common.buttons.delete")
                                     , "type": "button"
                                     });
      buttons.push(this.deletebutton);
    }

    if(buttons.length)
    {
      this.buttonholder = new Element("span", { "class": "buttons"
                                             });
      this.node.adopt(this.buttonholder);
      this.buttonholder.adopt(buttons);
    }
  }
, isSet:function()
  {
//    console.warn("isset invoked",!!this.fileinfos, this.fileinfos);
    return !!this.fileinfos;
  }
, onAddReplace:function()
  {
    var uploadgroup = this.editcallback ? $wh.selectHTML5File() : $wh.selectAndUploadFile({ multiple: this.multiple });
    uploadgroup.addEvent("load", this.editcallback ? this.onClientFileSelected : this.onFilesReceived);

    uploadgroup.addEvent('loadstart', this.onLoadStart.bind(this));
    uploadgroup.addEvent('loadend', this.onLoadEnd.bind(this));
    uploadgroup.addEvent('progress', this.onProgress.bind(this));


  }
, onLoadStart:function(event)
  {
    //selected file is being loaded
  }
, onLoadEnd:function(event)
  {
    //selected file is loaded
  }
, onProgress:function(event)
  {
    //event.loaded and event.size for progress information
  }
, onClientFileSelected:function(event)
  {
    if(event.files.length!=1)
      return;

    var reader = new FileReader();
    var filename = event.files[0].name;
    var filesize = event.files[0].size;
    reader.onload = function (subevent)
    {
      this.loadFiles([ {url: reader.result, filename: filename, filesize: filesize } ], true);
    }.bind(this);

    reader.readAsDataURL(event.files[0]);
  }
, getFileInfoFromTransferUrl:function(url, fileinfo)
  {
    var urlinfo = new $wh.URL(url);
    var info = this.decodeTransferUrl(urlinfo, fileinfo);
    info.url=url;
    return info;
  }
, decodeTransferUrl:function(urlinfo, fileinfo)
  {
    var size = urlinfo.getVariable('size');
    return { filename: urlinfo.getVariable('filename')
           , filesize: size ? size.toInt() : null
           , mimetype: urlinfo.getVariable('mimetype')
           };
  }
, onFilesReceived:function(event)
  {
    var files = event.target.getCompletedFiles();
    if(!files.length)
      return;

    var fileinfos = [];
    Array.each(files, function(file)
    {
      var info = this.getFileInfoFromTransferUrl(file.getDownloadUrl(), file);
      fileinfos.push(info);
    }.bind(this));

    if(this.node)
      this.node.addClass("loading");
    this.loadFiles(fileinfos, true);
  }
, loadFiles:function(fileinfos, userchange)
  {
    this.fileinfos = fileinfos;
    if(this.onsetfiles)
      this.onsetfiles(this.fileinfos.map(this.makeApiValueFromFileinfo.bind(this)));

    if(this.node)
    {
      this.node.toggleClass("nofile", !fileinfos);
      this.node.toggleClass("hasfile", !!fileinfos);
      this.node.removeClass("loading");
      this.valuenode.value = fileinfos ? fileinfos[0].url : this.explicitdelete ? '-' : '';

      if(!this.filenamenode)
      {
        this.filenamenode = new Element("input", { "type": "hidden"
                                                 , "name": this.getName() + '.filename'
                                                 }).inject(this.node);
      }
      this.filenamenode.value = fileinfos ? fileinfos[0].filename : '';
    }
    if(this.currentfilenode)
      this.currentfilenode.set('text', this.getCurrentFileValue());
    if(userchange)
      this.signalUserChange();
  }
, getValue:function()
  {
    return this.fileinfos ? this.fileinfos[0] : '';
  }
, setValue:function(fileinfo, options)
  {
    if(!fileinfo)
      this.explicitdelete=true;

    this.loadFiles(fileinfo ? [ Object.clone(fileinfo) ] : null, !(options && options.markpristine));
    if(options && options.markpristine)
      this.setDirty(false);
  }
, getApiResultFromValue:function(value)
  {
    if(!value)
      return {raw:'-'};
    throw "Don't know how to handle this value";
  }
, getValueFromApiResult:function(result)
  {
    if(!result.raw || result.raw == '-')
      return null;

    var fileinfo = this.getFileInfoFromTransferUrl(result.raw);
    return fileinfo;
  }
, makeApiValueFromFileinfo: function(fileinfo)
  {
    var retval = { inputname: this.node ? this.getName() : '' || ''
                 , raw: fileinfo.url
                 , filename: fileinfo.filename
                 };
    return retval;
  }
, getApiValue:function()
  {
    if(!this.fileinfos)
      return { inputname: this.getName() || '', raw: this.explicitdelete ? '-' : '' };
    return this.makeApiValueFromFileinfo(this.fileinfos[0]);
  }
, getCurrentFileValue:function() //ADDME allow user formatting. ADDME allow icons
  {
    return this.fileinfos ? this.fileinfos[0].filename : '';
  }
, deleteFile:function()
  {
    this.loadFiles(null);
  }
, onEdit:function(event)
  {
    event.stop();
    this.editFile();
  }
, editFile:function()
  {
    //ADDME generic implementation? merge callback with us ?
  }
, onDelete:function()
  {
    this.deleteFile();
    this.signalUserChange();
  }
, signalUserChange:function()
  {
    if(this.node)
    {
      $wh.fireHTMLEvent(this.valuenode,'input');
      //$wh.fireHTMLEvent(this.valuenode,'change');
      this.fireChangeEvents();
      this.setDirty(true);
    }
  }
, getRawValue:function()
  {
    return this.fileinfos ? this.fileinfos[0].url : this.explicitdelete ? '-' : '';
  }
, setRawValue:function(value)
  {
    if(value && value != '-')
    {
      var fileinfo = this.getFileInfoFromTransferUrl(value);
      this.loadFiles([fileinfo], false);
    }
    else
      this.deleteFile();
  }
});

$wh.Form.FileArrayBase = new Class(
{ Extends: $wh.Form.HiddenArrayBase
, fieldname: ''
, helpermodel: null
, initialize: function(formhandler, node, parentmodel)
  {
    this.parent(formhandler, node, parentmodel);
    this.fieldname = this.node.getAttribute('data-fieldname');
    if(!this.fieldname)
      throw "A filearray requires a fieldname to be specified in the data-fieldname attribute";
    this.helpermodel = this.createHelperModel();
    this.helpermodel.onsetfiles = this.onSetFiles.bind(this);
    this.helpermodel.multiple = true;
  }
, createHelperModel:function()
  {
    return new $wh.Form.FileEditBase(null, null, this);
  }
, getApiResultForRow:function(row)
  {
    var outrow={};
    if(typeof row.fields[this.fieldname] == 'undefined')
      throw "Incoming rows for '" + this.getName() + "' do not contain the expected field '" + this.fieldname + "'";
    outrow[this.fieldname] = this.helpermodel.getApiResultFromValue(row.fields[this.fieldname]);
    return outrow;
  }
, getRowValue:function(row)
  {
    var outrow = {};
    if(typeof row.fields[this.fieldname] == 'undefined')
      throw "Incoming rows for '" + this.getName() + "' do not contain the expected field '" + this.fieldname + "'";
    outrow[this.fieldname] = this.helpermodel.getValueFromApiResult(row.fields[this.fieldname]);
    return outrow;
  }
, doModifyRow:function(rowidx)
  {
    this.helpermodel.onAddReplace();
  }
, onSetFiles:function(fileinfos)
  {
    Array.each(fileinfos, function(fileinfo)
    {
      var upd = {};
      upd[this.fieldname] = fileinfo;
      this.updateRowWithApi(-1, upd);
    }.bind(this));
  }
});

$wh.Form.models["wh.fileedit"] = $wh.Form.FileEditBase;
$wh.Form.models["wh.filearray"] = $wh.Form.FileArrayBase;

})(document.id); //end mootools wrapper
