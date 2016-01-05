/* generated from Designfiles Public by generate_data_designfles */
require ('./formhandler.css');
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('frameworks.mootools.more.class.binds');
require ('wh.ui.base');
require ('wh.form.model.base');
/*! LOAD: frameworks.mootools.core, wh.compat.base, frameworks.mootools.more.class.binds
    LOAD: wh.ui.base
    LOAD: wh.form.model.base
!*/

/* To pass submitted forms to the Google tagmanager dataLayer, add a data-gtm-submit attribute to the form,eg
  <form class="wh-form" data-gtm-submit='{"event":"formulier-submit","form":"preregistration"}'>
  all form fields are appended as form_



  data-form-enableon

      syntax:

        - multiple rules can be specificied, space seperated
        - each rule is OR'ed
        - if the rule only contains the name of a form field, the existance of any value/selection in the specified form field is seen as a match
        - if the rule contains an '=', it's a match if the value of the form field matches the value specified after the '=' sign

      overview:

        fieldname (group)                       -> check whether the group has a value (aka a value other than "" is set)
        fieldname (checkbox/radio/option)       -> check whether that specific value is selected
        fieldname=value (group)                 -> check whether the group has the specified value
        fieldname=value (checkbox/radio/option) -> ERROR (not implemented yet)

NOTES:
- delayiffocus nog nodig?
- combinestatus nog nodig?
*/

if($wh.getFormHandler)
  console.error("Multiple formapi loads - a LOAD for wh.forms cannot be combined with blexdev_formsapi:formsapi.js");

(function($) {
"use strict";

var didinitialevents = false;
var sendinitialevents = [];

if(!$wh.Form)
  $wh.Form={};

$wh.Form.Handler = new Class(
{ Implements: [ Options, Events ]
, Binds: [ "_onFocusGain", "handleFocusLoss", "handleKeyDown", "handleClick", "handleMouseDown"
         , "handleEnter", "handleChange", "closeFormPopup"
         ]
, options: { debugfocus:        false
           , debugvalidation:   false
           , debugdirty:        false
           , debugalwayssubmit: false //set to true to always submit, even if the form is not avlid
           , debugenableons:   false
           , errormsgperfield: true  //show errors per field
           , lang:             null  //override form language
           , errorgroupplacement: 'bottom' //placement of errors, if a field is wrapped in a field group
           , errorfieldplacement: 'after'  //placement of errors, if a field is outside a field group
           , initialevents:     null //fire initial change events. set to 'true' to force, 'null' to fire unless data-form-noinitialevents is set, 'false' to disable
           , autovalidate:      null //automatically validate on submit. set to 'true' to force, 'null' to submit unless data-form-noautovalidate is set, 'false' to disable
           }

  /// Form node
, form: null

, lastfocused: null
, lastsubmitbutton: null
, lastfailclient: true //last submission failed client side (no use to talk to the server if nothing changed)

  /** Validation queue (to make sure server isn't hammered with simultaniois validation requests)
      @cell field Field node
      @cell func Validation function
  */
, remotequeue: []
, submitting:  false
, submitbusylock: null
//, keyboard:    null
, globalerrors: []
, warnings: []
, binding: null
, dirty: false
, blockdirtyevents:false //temporarily block all dirty/pristine events
, currentpopup: null
, formstarted: false
, notinteractive: false
, prefiller:null

  // ---------------------------------------------------------------------------
  //
  // Init & destroy
  //

, initialize: function(formelement, options)
  {
    this.form = $(formelement);
    this.setOptions(options);
    if($wh.debug.fhf)
      this.options.debugfocus=true;
    if($wh.debug.fhv)
      this.options.debugvalidation=true;
    if($wh.debug.fhd)
      this.options.debugdirty=true;
    if($wh.debug.fhi)
      this.options.debugalwayssubmit=true;
    if($wh.debug.fho)
      this.options.debugenableons=true;

    if(!this.form.getAttribute('method') && $wh.config && $wh.config.dtapstage != 'production')
      console.warn("This form does not have a 'method' specified. It should be set to POST to suppress Chrome's autocompletion errors",this.form);

    this.form.getElements("*[data-form-visibleon]").each(function(node)
    {
      console.error("data-form-visibleon is deprecated, use data-form-enableon and data-form-disablemode='hidden' ",node);
      throw new Error("data-form-visibleon is disabled, use data-form-enableon and data-form-disablemode='hidden' ");
      //node.setAttribute("data-form-enableon", node.getAttribute("data-form-visibleon"));
      //node.setAttribute("data-form-disablemode", "hidden");
    });
/*
    this.keyboard = new Keyboard({ events: { "enter": this.handleEnter
                                           }
                                 });
*/
    this.form.addEvents({"focusin":  this._onFocusGain
                        ,"focusout": this.handleFocusLoss
                        ,"keydown":  this.handleKeyDown
                        ,"change":   this.handleChange
                        ,"input":    this.handleInput
                        ,"click":    this.handleClick
                        ,"mousedown":this.handleMouseDown
                        });

    this.form.setAttribute('novalidate','novalidate');
    this.form.addClass("wh-form");
    this.form.store("wh-formhandler", this);

    this.initializeModels(this.form, null);

    //this.form.getElements('*[data-form-visibleon]').each(this.setupVisibleOn.bind(this));
    this.updateEnableOns(this.form);

    //do we have focus? if so, activate our keyboard
//    if(this.form.contains($wh.getCurrentlyFocusedElement()))
  //    this.keyboard.activate();

    if($wh.config && $wh.config.dtaptype != 'production')
    {
      //test for a common issue: options without value
      Array.some(this.form.getElements('option:not([value])'), function(opt)
      {
        if(! (opt.disabled && opt.getParent('select[required]'))) //unless it's disabled (and in a required select) this is an issue!
        {
          console.warn("An <option> is missing a 'value' property - this will cause it to post its text as its value, which is rarely what you want", opt);
          return true; //warn only once
        }
      });
    }

    if(this.options.autovalidate === null)
      this.options.autovalidate = !this.form.hasAttribute('data-form-noautovalidate');

    //Fire change/input events on all fields that already have a value different from their default
    if(this.options.initialevents == true || (this.options.initialchange == null && !this.form.hasAttribute('data-form-noinitialevents')))
    {
      if(didinitialevents)
        this.fireInitialEvents();
      else
        sendinitialevents.push(this);
    }

    var currentfocus = $wh.getCurrentlyFocusedElement();
    if(currentfocus && currentfocus.getParents().contains(this.el))
      this._handleFocusGain(currentfocus);

    if($wh.debug.fhp)
      this.prefiller = new Prefiller(this);
  }

, destroy:function()
  {
    //FIXME cleanup models
    this.form.removeEvents(["focusin","focusout","keydown","click","mousedown"
                           ,"click:relay(.addrow)","click:relay(.deleterow)"
                           ])
    this.form.eliminate("wh-formhandler");
  }

, sendFormEvent:function(type,data)
  {
    if(!data)
      data = {};
    data.target = this;
    this.fireEvent(type, data);

    data.target = this.form;
    data.formhandler = this;
    this.form.fireEvent("wh-form-" + type, data);
  }

, fireInitialEvents:function()
  {
    $wh.Form.processOnModels(this.form, false, function(model)
    {
      var value = model.getValue();
      if(value)
        model.fireChangeEvents();
    });
  }

  // ---------------------------------------------------------------------------
  //
  // RPC Api
  //

, rebind:function(binder)
  {
    this.binding = Object.clone(binder);
    this.binding.type="rebind";

    if(this.binding.getter)
    {
      this.lockSubmission();
      this.binding.getter(this.onBindInitialData.bind(this, {cleanstart:true, markpristine:true}));
    }
  }
, onBindInitialData:function(options, apiresult)
  {
    this.unlockSubmission();
    this.applyApiResultFields(apiresult.fields, options);
  }
, sendToBinding:function(onsubmitted)
  {
    this.lockSubmission();

    var updates = {};
    $wh.Form.processOnModels(this.form, false, function(model)
    {
      var value = model.getApiValue();
      if(!value.inputname)
        return;
      updates[model.getName()] = value;
    }.bind(this));

    this.binding.setter(updates, this.onDoneSend.bind(this, onsubmitted));
  }
, onDoneSend:function(onsubmitted)
  {
    this.unlockSubmission();
    this.sendFormEvent("submitted");
    if(onsubmitted)
      onsubmitted();
  }

  /** Link this form to an hidden array row
  */
, bindToArrayRow:function(model, rowindex, options)
  {
    this.binding = { type: 'arrayrow'
                   , rowindex: rowindex
                   , model: model
                   };

    if(rowindex >= 0)
      this.applyApiResultFields(model.hiddenrows[rowindex].fields, options);

    this.sendFormEvent('editready');
  }
, sendToArrayRow:function(onsubmitted)
  {
    var rowupdates={};

    var updaterow = this.binding.model.hiddenrows[this.binding.rowindex];

    $wh.Form.processOnModels(this.form, false, function(model)
    {
      var value = model.getApiValue();
      if(!value.inputname || model.getName() in rowupdates)
        return;
      rowupdates[model.getName()] = value;
    }.bind(this));

    this.binding.model.updateRowWithApi(this.binding.rowindex, rowupdates);

    this.sendFormEvent("submitted");
    if(onsubmitted)
      onsubmitted();
  }
  /** Link this form to a RPC service
      @param rpcservice Service object (usually a new $wh.JSONRPC object)
      @param rpcmethod Method to invoke
      @param arguments Any additional arguments
      @param options Options
      @cell options.edit If set, we're editing an existing dataset: load the current form values immediately */
, bindToRPCService:function(rpcservice, rpcmethod, args, options)
  {
    this.binding = { service:rpcservice
                   , method:rpcmethod
                   , args:args || []
                   , type: 'rpc'
                   , edit:options && options.edit
                   };
    //FIXME split these concepts. binding to a RPC should be separate from setting up the submission handler, as a RPC can also 'only' provide validation services
    //as the other binds are still internally used, we should probably remame that
    this.rpcbinding = this.binding;

    if(options && options.edit)
      this.sendToRPC(this.form, false);
  }
, verifyUsingRPC:function(tosubmit, verifytype, verifymethod, onsuccess)
  {
    if(!this.rpcbinding || this.rpcbinding.type!='rpc')
      throw "verifyUsingRPC invoked, but form has not been bound to a RPC service";

    this.lockSubmission();

    var state = this.getStateForApi(tosubmit, true);
    state.verifymethod = verifymethod;
    state.verifytype = verifytype;
    var args = Array.clone(this.rpcbinding.args);
    args.push(state);
    this.rpcbinding.service.request( this.rpcbinding.method, args, this.handleRPCSubmit.bind(this, true, onsuccess));
  }
, sendToRPC:function(tosubmit, issubmit, onsubmitted)
  {
    this.lockSubmission();

    //FIXME error handling
    var args = Array.clone(this.rpcbinding.args);
    args.push(this.getStateForApi(tosubmit, issubmit));
    this.rpcbinding.service.request( this.rpcbinding.method, args, this.handleRPCSubmit.bind(this, issubmit, onsubmitted), this.handleRPCFail.bind(this));
  }
, handleRPCSubmit:function(issubmit, onsuccess, response)
  {
    if(this.options.debugvalidation)
      console.log(this.getDebugTag() + "Processing RPC response. issubmit=",issubmit,response);

    this.notinteractive = !issubmit || (response.isverify && response.success);
    if(response.submitinstruction)
    {
      $wh.Form.executeSubmitInstruction(response.submitinstruction);
      return;
    }

    var res = this.processApiResult(response.apiresult, { cleanstart: !issubmit, markpristine: this.binding.edit && (!issubmit || response.submitted) });
    this.notinteractive = false;
    this.unlockSubmission();
    if(response.extradata)
      this.sendFormEvent('extradata', { extradata: response.extradata });
    if(!issubmit) //first load
      this.sendFormEvent('editready', { extradata: response.extradata });

    if(response.submitted)
    {
      this.sendFormEvent("submitted", { data: response.submitdata, extradata: response.extradata });
      $wh.track('form','submitted',this.form);
      if(onsuccess)
        onsuccess();
    }
    else if(response.isverify)
    {
      if(response.success)
      {
        this.sendFormEvent("verified", { data: response.verifyresult, extradata: response.extradata })
        if(onsuccess)
          onsuccess( response.verifyresult );
      }
    }
  }
, handleRPCFail:function(response)
  {
    if(this.options.debugvalidation)
      console.log(this.getDebugTag() + "Processing RPC response, failed",response);

    this.unlockSubmission();
    this.failSubmission([{error: Locale.get('wh-form.rpcfailure')}]);
  }

  // ---------------------------------------------------------------------------
  //
  // Helper functions
  //

, getDebugTag:function()
  {
    var name = this.form.id || '';
    return '[wh.form#' + name + '] ';
  }

  /** Initialize the field model for a node
      @param node Field node
      @return Model if it was just created, undefined if already initialized
  */
, initializeModel:function(parentmodel, node)
  {
    if(node.retrieve("wh-form-model"))
      return;  //it's already configured

    var modeltype;
    var modelname = node.getAttribute('data-form-model');
    if(modelname)
    {
      modeltype = $wh.Form.models[modelname.toLowerCase()];
      if(!modeltype)
        console.error("Field refers to unregistered model '" + modelname + "'", node);
    }
    if(!modeltype && parentmodel)
    {
      modeltype = parentmodel.suggestModel(parentmodel.getSubName(node.name), node);
    }

    if(!modeltype && node.hasClass('wh-inputgroup'))
    {
      Array.each(node.className.split(' '), function (classname)
        {
          if(!modeltype)
            modeltype = $wh.Form.modelsByClass[classname];
        });
      if(!modeltype)
        console.error("No model for wh-inputgroup with class '" + node.className + "'", node);
      else
        console.warn("Field relies on modelsByClass, switch to data-form-model", node)
    }

    if(!modeltype && node.get('tag')=='input')
    {
      if(node.type == "radio") //ADDME implicit group creation might not be a good idea, as it completely modifies the returnvalue of a checkbox:  || (node.type == "checkbox" && node.getParent('.fieldgroup')))
      {
        this.createGroup(node, node.type, parentmodel);
        return;
      }
      if(node.type == "submit")
        modeltype =

      modeltype = $wh.Form.models["wh.submit"];
      /*
      if (modeltype)
        console.info("Created model for input of type", node.get('type').toLowerCase());
      else
        console.info("No model for input of type", node.get('type').toLowerCase());
      */
    }

    if(!modeltype && node.get('tag')=='select')
      modeltype = $wh.Form.models["wh.select"];

    if(modeltype)
      return new modeltype(this, node, parentmodel);

    return new $wh.Form.InputFieldBase(this, node, parentmodel);
  }

  /** Create fieldgroups for all inputs with type 'checkbox'. The parent of the input with
      class 'fieldgroup' is initialized as CheckboxGroup
  */
, createGroup:function(node, type, parentmodel)
  {
    var fieldgroup = node.getParent(".fieldgroup");
    if(!fieldgroup)
      return console.error("No .fieldgroup to handle radiobutton ",node);

    var model = $wh.Form.getFieldModel(fieldgroup);
    if(model)
    {
      if(model != node.retrieve("wh-form-parentmodel"))
        console.error("No unique .fieldgroup for radiobutton ", node);
      return;
    }

    fieldgroup.setAttribute("data-form-model", "");
    fieldgroup.setAttribute("data-form-name", node.name);

    switch(type)
    {
      case "radio":
        new $wh.Form.models["wh.radiogroup"](this,fieldgroup,parentmodel);
        break;

      case "checkbox":
        new $wh.Form.models["wh.checkboxgroup"](this,fieldgroup,parentmodel);
        break;
    }
  }

  /// Initializes the models for all fields within the form
, initializeModels:function(basenode, parentmodel)
  {
    $wh.Form.processOnFields(basenode, false, function(field)
    {
      this.initializeModel(parentmodel, field);
    }.bind(this));

    $wh.Form.processOnModels(basenode, false, function(model)
    {
      model.loadPristineValue();
    });
  }

  /** @short remove all status CSS classes on fields which are hidden due to visibleon's
, resetFieldStatusOfHiddenFields: function()
  {
    // after a failed submit, clear the state of fields that gave no errors because they
    // were hidden (due to data-form-enableon's)
    var fields=[];
    $wh.Form.processOnFields(this.form, false, function(node)
    {
      fields.push(node);
    })
    for (var idx = 0; idx < fields.length; idx++)
    {
      if (fields[idx].readOnly)
        this.disableFieldStatus(fields[idx]);
    }
  }

  // to after a submission failed, reset the state of fields that were not visible
, disableFieldStatus:function(field)
  {
    //update the status of a field, or its group. deal properly with a group containing multiple inputs
    var fieldgroup = field.getSelfOrParent('.fieldgroup');

    var statusnode=fieldgroup||field;
    statusnode.removeClass('valid');
    statusnode.removeClass('invalid');
    statusnode.removeClass('pending');
  }
  */

  /** Sets the current validation status of a field
      @param field Field node
      @param result
      @cell result.error
      @cell result.callback
  */
, setValidationStatus:function(field, result)
  {
    var model = $wh.Form.getFieldModel(field);
    if(!model)
      throw "Unrecognized field"; //not one of our prepared fields...
    this.__applyValidationResult(field, model, result);
  }

  /** Process validation result
      @param field Fieldnode
      @param model Model of the field node
      @param result Validation result
      @cell result.error If present (and not undefined) used as validation error message
      @cell result.callback If async verification is needed, callback to execute to start the it (only
          one may run at a time).
  */
, __applyValidationResult:function(field, model, result)
  {
    //console.log("__applyValidationResult", model.getName(), field, model, result);
    var rerunvalidate = false;

    model.__errormessage = null;
    if(model.__pending)
    {
      if(model.needsrevalidation)
        rerunvalidate = true;
      if(this.options.debugvalidation)
      {
        console.log(this.getDebugTag() + "completed callback validation for model",model.getName(),rerunvalidate,result);
      }
    }

    model.__pending = false;

    if(result && result.callback)
    {
      if(this.options.debugvalidation)
        console.log(this.getDebugTag() + "queued pending validation for model",model.getName());
      model.__pending=true;
      model.updateStatus();
      this.addToQueue({ field:field, func:result.callback});
      return;
    }

    if(result && typeof result.error != "undefined" && (!this.options.errormsgperfield || !result.subfielderror))
      model.__errormessage = result.error;

    model.updateStatus();

    if(rerunvalidate)
    {
      this.validateField(model, true, true);
    }
  }

  /** Get a global list of errors at top level*/
, getTopLevelErrorMessages:function()
  {
    var errors = Array.clone(this.globalerrors);
    $wh.Form.processOnModels(this.form, false, function(model)
    {
      var localerror = model.getTopLevelError();
      if(localerror)
        errors.push(localerror);
    });
    return errors;
  }
, isPartDirty:function(part)
  {
    return !!$wh.Form.processOnModels(part, true, function(model) { return model.dirty });
  }
, scanDirtyState:function()
  {
    var dirtylist = [];

    $wh.Form.processOnModels(this.form, !this.options.debugdirty, function(model) //loop through all only when debugging
    {
      if(model.dirty)
      {
        dirtylist.push(model.getName());
        return true;
      }
    });

    if(this.options.debugdirty)
      console.log(this.getDebugTag() + "Dirty fields: " + dirtylist.join(", "));

    var dirtystate = dirtylist.length != 0;
    this.updateDirtyState(dirtystate);
  }
, updateDirtyState:function(dirtystate)
  {
    if(this.dirty == dirtystate)
      return;

    if(this.options.debugdirty)
      console.log(this.getDebugTag() + "" + (this.form.id || "(no id)") + ": updateDirtyState set", dirtystate);

    this.dirty = dirtystate;
    this.form.toggleClass("formdirty", this.dirty); //different class so '.dirty input' selectors don't affect the entire form
    this.sendFormEvent(dirtystate ? "dirty" : "pristine");
  }

, signalDirtyChange:function(sourcemodel)
  {
    if(this.blockdirtyevents)
      return;

    this.sendFormEvent("dirtychange", { model: sourcemodel
                                      , field: sourcemodel.node
                                      , dirty: sourcemodel.dirty
                                      });
    if((!this.dirty) == (!sourcemodel.dirty))
      return;

    if(sourcemodel.dirty)
      this.updateDirtyState(true);
    else
      this.scanDirtyState();
  }

  // ---------------------------------------------------------------------------
  //
  // Uncategorized
  //

  /** Attempt to activate this form. Focus it, bring it into view if needed */
, activateForm:function()
  {
    //Detect ui-popup and bring us into view if needed
    var popupparent = this.form.getSelfOrParent(".wh-popup");
    if(popupparent && $wh.Popup && $wh.Popup.createFromElement)
    {
      this.currentpopup = $wh.Popup.createFromElement( popupparent
                                                     , { onAftershow:   this.focusForm.bind(this)
                                                       , explicitclose: true // we don't want the user to accidently close a popup
                                                                             // FIXME: maybe in the future allow override of this setting through the data-popup-options attribute on the popup element
                                                       });

      this.addEvent("submitted", this.closeFormPopup);
      return;
    }
    this.focusForm();
  }
, focusForm:function()
  {
    var focusable = $wh.getFocusableComponents(this.form, false).pick();
    if(focusable)
      try { focusable.focus(); } catch(e) {}
  }
, closeFormPopup:function()
  {
    this.removeEvent("submitted", this.closeFormPopup);
    if(this.currentpopup)
      this.currentpopup.hide();

    this.currentpopup=null;
  }

  /** Runs validation on a model if needed
      @param model
      @param force
      @return Whether the model is valid. null if validation is still pending (async)
  */
, validateField:function(model, force, ignorefocus, unlockfeedback)
  {
    //console.error("validateField: ", model, model.node, "FORCE:", force, "NEEDS:",model.needsrevalidation, "isvalid:",model.isValid(),"unlock:", unlockfeedback);
    if(model.needsrevalidation /*|| model == this.lastfocusedmodel*/ || force)
    {
      if(unlockfeedback === true)
        model.setAllowFeedback(true);

      while (model.parentmodel && model.parentmodel.combinestatus)
        model=model.parentmodel;

      model.runValidation(model == this.focusedgroup && !ignorefocus);
    }
  }

  /** Starts validation of all unvalidated fields (or force-revalidates them all)
      @param basenode
      @param force
      @return
      @cell return.valid Whether all fields are valid (and not pending)
      @cell return.firstpending First model whose validation result is still pending
      @cell return.firstinvalid First model that failed validation
  */
, validateFields:function(basenode, options)
  {
    var firstinvalid=null, firstpending=null;

    $wh.Form.processOnModels(basenode, false, function(model)
      {
        // skip validation of a field which isn't visible (FIXME: rename readOnly to something else?)
        this.validateField(model, options&&options.force, true, options&&options.unlockfeedback);
      }.bind(this));

    var validity = this.getValidity(basenode);
    if(options && options.focusfirsterror && validity.firstinvalid)
      this.focusFieldError(validity.firstinvalid);
    return validity;
  }
, getValidity:function(basenode)
  {
    var firstinvalid=null, firstpending=null;

    $wh.Form.processOnModels(basenode, true, function(model)
    {
      if(!model.needsValidation()) //skip readonly/disabled/invisible fields
        return;

      var nonvalidfield = model.getFirstNonValid();
      if(!nonvalidfield)
        return;

      if(!firstpending && nonvalidfield.isPending())
        firstpending = model;
      if(!firstinvalid && nonvalidfield.isValid()===false)
      {
        if(this.options.debugvalidation)
        {
          console.error(this.getDebugTag() + "validateFields failed on field '" + (model.getName()||'null') + "'",model);
        }
        firstinvalid = model;
        if(!this.notinteractive)
          $wh.track('form','invalid', firstinvalid.node);
      }
      if(!firstpending && !firstinvalid)
      {
        console.log("First nonvalid field: ", nonvalidfield);
        throw new Error("Field returned as notvalid, but both isPending and isValid checks failed");
      }
      return firstpending && firstinvalid;
    }.bind(this));
    return { valid:!firstinvalid && !firstpending, firstpending: firstpending, firstinvalid: firstinvalid };
  }

, handleLastFocused:function(focusgainedby)
  {
    var field = this.lastfocused.retrieve("wh-ui-replaces") || this.lastfocused;
    var lastgroup = this.lastfocused.getParent(".fieldgroup");
    var currentgroup = focusgainedby ? focusgainedby.getParent(".fieldgroup") : null;
    //this.lastfocused = null; //don't reset lastfocused, we may repeatedly be changing the same field

    var lastmodel = $wh.Form.getFieldModel(field);
    if(this.options.debugfocus)
      console.log(this.getDebugTag() + "handlelastfocused: lastgroup ",lastgroup," currentgroup",currentgroup, " model", lastmodel);

    if(lastmodel)
    {
      this.validateField(lastmodel, true, false, true);
    }
    if (lastgroup && lastgroup != currentgroup)
    {
      var lastgroupmodel = $wh.Form.getFieldModel(lastgroup);
      if(lastgroupmodel)
        this.validateField(lastgroupmodel, true, false, true);
      else $wh.Form.processOnModels(lastgroup, false, function(model)
      {
        this.validateField(model, true, false, true);
      }.bind(this));
    }
  }

, _onFocusGain:function(event)
  {
    this._handleFocusGain(event.target || $(event.event.srcElement));
  }
, _handleFocusGain:function(focusgainedby)
  {
    // if there aren't any custom component fields in our form handling the keyboard,
    // take control. (depending on the focusin code path (native or emulated) the custom components
    // may or may not recieve focus() and activate the keyboard before or after us)

//    this.keyboard.activate();

    if(focusgainedby)
      focusgainedby = focusgainedby.retrieve("wh-ui-replaces") || focusgainedby;

    this.lastfocusedmodel = focusgainedby ? $wh.Form.getFieldModel(focusgainedby) : null;
    this.focusedgroup = this.lastfocusedmodel;
    while(this.focusedgroup && this.focusedgroup.parentmodel && this.focusedgroup.parentmodel.combinestatus)
      this.focusedgroup = this.focusedgroup.parentmodel;

    if(focusgainedby)
    {
      var parent = focusgainedby.getParent(".fieldgroup");
      if(parent)
        parent.addClass("groupfocused");
    }

    if(focusgainedby && !this.formstarted && !this.notinteractive) //form starting
    {
      this.formstarted = true;
      $wh.track('form','start',this.form);
    }

    if(this.options.debugfocus)
    {
      console.log(this.getDebugTag() + "focus in to " + (focusgainedby && focusgainedby.id ? "#"+focusgainedby.id : focusgainedby ? focusgainedby.outerHTML : "") + ", last focused: " + (this.lastfocused && this.lastfocused.id ? "#"+this.lastfocused.id : this.lastfocused ? this.lastfocused.outerHTML : ""));
    }

    if(this.lastfocused)
    {
      if($wh.getFocusableElement(focusgainedby) == $wh.getFocusableElement(this.lastfocused)) //same element returned focus, ignore
        return;

      this.handleLastFocused(focusgainedby);
    }

    this.lastfocused = focusgainedby; //we need to store this here already, as firefox may not actually transfer focus before submitting
  }

, handleFocusLoss:function(event)
  {
    this.form.getElements(".groupfocused").removeClass("groupfocused");

    var focuslostby = event.target || $(event.event.srcElement);
    if(focuslostby)
      focuslostby = focuslostby.retrieve("wh-ui-replaces") || focuslostby;
    if(this.options.debugfocus)
    {
      console.log(this.getDebugTag() + "focus out from " + (focuslostby && focuslostby.id ? "#"+focuslostby.id : focuslostby ? focuslostby.outerHTML : ""));
    }
    this.lastfocused = focuslostby;
    return;
  }
  /** Validate and submit the form, if succesful. Optionally specify a submission button to use */
, validateAndSubmit:function(usesubmitbutton)
  {
    this.submittry = this.trySubmit.bind(this, true, usesubmitbutton); //ADDME focus was null, but why ?!
    return this.submittry();
  }
, __validateAndSubmitPart:function(part, usesubmitbutton, onsubmitted)
  {
    this.submittry = this.trySubmitToCB.bind(this, part, true, usesubmitbutton, this.submitPart.bind(this, part, usesubmitbutton, onsubmitted)); //ADDME focus was null, but why ?!
    return this.submittry();
  }
  /** Validate a single form page. Specify succesful submission callback */
, validatePage:function(page, onsuccess)
  {
    if(this.form!=page && !this.form.contains(page))
      throw "ValidatePage must work on a part of the form";
    this.submittry = this.trySubmitToCB.bind(this, page, true, null, onsuccess);
    this.submittry();
  }
, trySubmit:function(focus_failed_field, usesubmitbutton)
  {
    var tosubmit = this.form;
    if(usesubmitbutton && !usesubmitbutton.hasAttribute)
      return console.error("Passed submit button is not a HTML element", usesubmitbutton);

    if(usesubmitbutton && usesubmitbutton.hasAttribute('data-form-submitpart'))
    {
      var part = usesubmitbutton.getAttribute("data-form-submitpart");
      tosubmit = $(part);
      if(!tosubmit)
        throw "Did not find a part '" + part + "' to submit for the selected button";
      if(! (this.form == tosubmit || this.form.contains(tosubmit)) )
        throw "The part '" + part + "' is not a part of the current form";
    }
    return this.trySubmitToCB(tosubmit, focus_failed_field, usesubmitbutton, this.submitPart.bind(this, tosubmit, usesubmitbutton));
  }
, trySubmitToCB:function(basenode, focus_failed_field, usesubmitbutton, callback)
  {
    if(this.options.debugvalidation)
      console.log(this.getDebugTag()+ 'trySubmitToCB invoked. basenode: ', basenode, ' focus_failed: ',focus_failed_field,', usesubmitbutton:',usesubmitbutton, 'lastfailclient:',this.lastfailclient);
    this.lastsubmitbutton = usesubmitbutton;
    /*
    if(this.lastfocused)
    {
      if(this.options.debugfocus)
        console.log(this.getDebugTag()+ "to make sure fields are validated before submitting, simulating focusloss for", this.lastfocused);
      this.handleLastFocused(null); //handle any pending focus-out actions. FF needs this to fix the focusout bug
    }
*/
    var result;
    if( (this.options.autovalidate || (usesubmitbutton && usesubmitbutton.hasAttribute("data-form-validate")))
        && !(usesubmitbutton && usesubmitbutton.hasAttribute("data-form-novalidate")))
      result = this.validateFields(basenode, { force: !this.lastfailclient, unlockfeedback: true });
    else
      result = { success:true };

    if(this.options.debugvalidation)
      console.log(this.getDebugTag()+ 'validation result:',result);
    if(result.firstpending && !result.firstinvalid)
    {
      if(this.options.debugalwayssubmit)
      {
        console.warn(this.getDebugTag()+ 'Not cancelling submission, even though we still have a pending field',result.firstpending);
      }
      else
      {
        this.lastfailclient = true;
        this.lockSubmission();
        return null;
      }
    }
    this.submittry=null;

    if(result.firstinvalid)
    {
      if(this.options.debugalwayssubmit)
      {
        console.warn(this.getDebugTag()+ 'Not cancelling submission, even though we have an invalidfield',result.firstinvalid);
      }
      else
      {
        this.lastfailclient = true;
        if(focus_failed_field)
          this.focusFieldError(result.firstinvalid);

//        this.resetFieldStatusOfHiddenFields(basenode);

        this.unlockSubmission();

        this.sendFormEvent("inputerror", result);

        return false;
      }
    }
    this.lastfailclient = false;
    this.unlockSubmission();

    this.prepareFieldsForSubmit(basenode); // Call prepareForSubmit
    return callback();
  }
, focusFieldError:function(failedmodel)
  {
    var evt = new $wh.Form.FocusEvent(this, failedmodel, failedmodel.node);
    this.fireEvent("focuserror", evt);
    if(!evt.defaultPrevented)
    {
      evt.target = this.from;
      this.form.fireEvent("wh-form-focuserror", evt);
    }
    if(!evt.defaultPrevented)
      failedmodel.focusError();
  }
, submitPart:function(tosubmit, usesubmitbutton, onsubmitted)
  {
    //run submission hooks
    this.runSubmissionHooks();

    if(this.tempsubmitbutton)
    {
      this.tempsubmitbutton.dispose();
      this.tempsubmitbutton = null;
    }
    if(usesubmitbutton)
    {
      this.tempsubmitbutton = new Element("input", { type: "hidden"
                                                   , name: usesubmitbutton.name
                                                   , value: usesubmitbutton.value
                                                   });
      this.form.adopt(this.tempsubmitbutton);
    }

    //send a real submit event
    var doc=this.form.ownerDocument;

    var dosubmit;

    if(Browser.firefox)
    {
      var saveaction = this.form.getAttribute('action');
      this.form.setAttribute('action','javascript:'); //prevent FF from actually submitting the form when invoking the submit event
    }
    dosubmit = $wh.fireHTMLEvent(this.form, 'submit');

    if(!dosubmit && this.options.debugalwayssubmit)
    {
      console.warn(this.getDebugTag()+ 'Not cancelling submission, even though a onSubmit event listener tried to cancel it');
    }

    if(Browser.firefox)
    {
      if(saveaction !== null)
        this.form.setAttribute('action', saveaction);
      else
        this.form.removeAttribute('action');
    }

    if(dosubmit)
    {
      this.sendFormEvent("submitting");
      document.body.fireEvent("wh-formhandler-submitting", { target: this.form }); //signal that we're actually talking to the server now
      this.doActualSubmission(tosubmit, onsubmitted);
      return true;
    }

    this.lastfailclient = true;
    if(this.options.debugvalidation)
      console.log(this.getDebugTag()+ 'onsubmit handler cancelled submission', this.form);
    return false;
  }
, doActualSubmission:function(tosubmit, onsubmitted)
  {
    if(this.binding && this.binding.type=='rpc')
    {
      this.sendToRPC(tosubmit, true, onsubmitted);
      return;
    }
    if(this.binding && this.binding.type=='arrayrow')
    {
      if(tosubmit != this.form)
        throw "Partial submissions are not supported by arrayrow bindings";
      this.sendToArrayRow(onsubmitted);
      return;
    }
    if(this.binding && this.binding.type=='rebind')
    {
      if(tosubmit != this.form)
        throw "Partial submissions are not supported by rebinds";

      var finalizer = this.sendToBinding.bind(this, onsubmitted);
      if(this.rpcbinding && this.rpcbinding.type=='rpc') // forward the post to the RPC for verification, on succcess, we'll handle it
        this.sendToRPC(tosubmit, true, finalizer);
      else
        finalizer();
      return;
    }

    if(tosubmit != this.form)
      throw "POST forms do not implement partial submission and are not compatible with tabs/data-form-submitpart"; //ADDME support? perhaps by resetting 'name' or disabling the other input fields. needs tests.
    if(onsubmitted)
      throw "POST forms do not support 'onsubmitted'";

    //create a new submit() to do the actual form submission, as people frequently create an element named 'submit'
    if(this.options.debugvalidation)
      console.log(this.getDebugTag() + "Submitting to server");
    document.createElement("form").submit.apply(this.form);
  }
  /// Call prepare for submit on all models
, prepareFieldsForSubmit: function(basenode)
  {
    $wh.Form.processOnModels(basenode, false, function(model)
    {
      if(!model.needsValidation())
        return;

      model.prepareForSubmit();
    });
  }

  /// Put the form into submitting mode
, lockSubmission:function()
  {
    if(this.submitting)
      return;
    this.submitting = true;
    this.form.addClass("submitting");

    this.submitbusylock = $wh.createBusyLock([ 'wh.form' ]);

    $wh.updateUIBusyFlag(+1);
  }

  /// Put the form into submitting mode
, unlockSubmission:function()
  {
    if(!this.submitting)
      return;
    this.submitting = false;
    this.form.removeClass("submitting");

    $wh.updateUIBusyFlag(-1);

    this.submitbusylock.release();
    this.submitbusylock = null;
  }
, getFieldNode:function(name)
  {
    //return this.form.getElement(".wh-inputgroup[data-form-name='" + name + "'], *[name='" + name + "']");
    return this.form.getElement("[data-form-name='" + name + "'], *[name='" + name + "']");
  }

, getField:function(name)
  {
    var field = this.getFieldNode(name);
    if(field)
    {
      var model = $wh.Form.getFieldModel(field);
      if(model)
        return model;
      else
        console.error("Found field", name, "but it lacks a model.");
    }

    return null;
  }
, getValue:function(fieldname)
  {
    var fld = this.getField(fieldname);
    if(!fld)
      throw "No such field '" + fieldname +"'";
    return fld.getValue();
  }
, resetToClear:function()
  {
    this.lastfocused=null;
    $wh.Form.processOnModels(this.form, false, function(model)
    {
      model.clear();
    });
    this.sendFormEvent("reset");
  }
, resetData:function()
  {
    this.resetPart(this.form);
    this.sendFormEvent("reset");
  }
, resetPart:function(part)
  {
    this.setBlockDirtyEvents(true);
    $wh.Form.processOnModels(part, false, function(model)
    {
      model.reset();
    });
    this.setBlockDirtyEvents(false);
  }
, getData:function()
  {
    var formvars = {};
    $wh.Form.processOnModels(this.form, false, function(model)
    {
      var name = model.getName();
      if(!name)
        return;

      formvars[name]=model.getValue();
    });
    return formvars;
  }
, getRawData:function()
  {
    var formvars = {};
    $wh.Form.processOnModels(this.form, false, function(model)
    {
      var name = model.getName();
      if(!name)
        return;

      formvars[name] = model.getRawValue();
    });
    return formvars;
  }
, setData:function(data, options)
  {
    $wh.Form.processOnModels(this.form, false, function(model)
    {
      var name = model.getName();
      if(!name || typeof data[name] == 'undefined')
        return;
      model.setValue(data[name], options);
    });
  }
, getStateForApi:function(tosubmit, issubmit) //returns a value suitable for the formsapi
  {
    var retentionfield = this.form.getElement('input[name="formsapi-retentionid"]');
    var retval = { lang: this.options.lang || (Locale.getCurrent() ? Locale.getCurrent().name : '') || $wh.getDocumentLanguage()
                 , retentionid: retentionfield ? retentionfield.get('value') : ''
                 , partial: tosubmit != this.form
                 };

    if(issubmit)
    {
      var seenvars={};
      retval.apivars=[];
      $wh.Form.processOnModels(tosubmit, false, function(model)
      {
        var value = model.getApiValue();
        if(!value.inputname || model.getName() in seenvars)
          return;

        seenvars[model.getName()] = true;
        retval.apivars.push(value);
      }.bind(this));
    }
    return retval;
  }
, applyApiResultFields:function(fields, options)
  {
    this.setBlockDirtyEvents(true);
    $wh.Form.processOnModels(this.form, false, function(model) //always walk in local order, not server order
    {
      var match = fields[model.getName()];
      if(match)
      {
        model.setApiResult(match, options);
      }

      var localerror = model.getTopLevelError();
      if(localerror)
      {
        if(this.options.debugvalidation)
          console.error(this.getDebugTag() + "Error for '" + model.getName() + "': " + localerror,model);

        model.setAllowFeedback(true);
      }
      else if (this.options.debugvalidation && match && match.error)
      {
        if(this.options.debugvalidation) //the field probably revalidated and lost the error message
          console.error(this.getDebugTag() + "RPC reported error for '" + model.getName() + "' but the component did not retain it as its toplevel error ",match.error,model);
      }

    }.bind(this));

    this.setBlockDirtyEvents(false);

    //Post process after apply
    $wh.Form.processOnModels(this.form, false, function(model)
    {
      model.afterApplyApiResult();
    });
  }
, processApiResult:function(result, options)
  {
    if(!options)
      options={};
    if(!result.retentionid || !result.fields)
      throw "The result passed is not a proper Api result";

    var retentionfield = this.form.getElement('input[name="formsapi-retentionid"]');
    var anyerrors = false;
    this.globalerrors = [];
    this.warnings = [];

    if(result.errors)
    {
      Array.each(result.errors, function(err)
      {
        this.globalerrors.push(err.message);
        if(this.options.debugvalidation)
        {
          if(!anyerrors) //first reject
            console.error(this.getDebugTag() + "Form submission rejected by server");
          console.error(this.getDebugTag() + "Global error: " + err.message);
        }

        anyerrors=true;
      }.bind(this));
    }
    if(result.warnings)
      Array.each(result.warnings, function(warning)
      {
        this.warnings.push(warning.message);
      }.bind(this));


    if(!retentionfield)
      retentionfield = new Element("input", { "name": "formsapi-retentionid"
                                            , "value": result.retentionid
                                            , "type": "hidden"
                                            }).inject(this.form);
    var serverfieldmap = [];
    Array.each(result.fields, function(fld)
    {
      serverfieldmap[fld.inputname]=fld;
    });

    this.applyApiResultFields(serverfieldmap, options);

    var validateresult = this.getValidity(this.form);
    if(validateresult.firstinvalid)
    {
      if(this.options.debugvalidation && !anyerrors) //first reject
        console.error(this.getDebugTag() + "Form submission rejected by server");

      anyerrors=true;
      this.focusFieldError(validateresult.firstinvalid);
    }

    this.updateFormGlobalErrorState();

    this.form.toggleClass('forminvalid', anyerrors);

    this.sendFormEvent("result");
  }
, updateFormGlobalErrorState:function()
  {
    var errors = [];
    var warnings = [];

    errors.append(this.globalerrors);
    if(!this.options.errormsgperfield)
      $wh.Form.processOnModels(this.form, false, function(model) //always walk in local order, not server order
      {
        var localerror = model.getTopLevelError();
        if(localerror)
          errors.push(localerror);
      });

    if(!errors.length)
      warnings.append(this.warnings);

    if(!errors.length && !warnings.length)
    {
      this.form.removeClass('hasglobalmessages');
      return;
    }

    var globalerrorhandler = this.form.getElement("ul.global-error-holder, ul.wh-form-globalmessages");
    if(!globalerrorhandler)
    {
      globalerrorhandler = new Element("ul", { "class": "wh-form-globalmessages"
                                             });
      globalerrorhandler.inject(this.form,'top');
    }
    else
    {
      globalerrorhandler.empty();
    }

    Array.each(errors,function(err)
    {
      globalerrorhandler.adopt(new Element("li", { text: err, "class":"errormsg" }));
    });
    Array.each(warnings,function(err)
    {
      globalerrorhandler.adopt(new Element("li", { text: err, "class":"warningmsg" }));
    });

    this.form.addClass('hasglobalmessages');
  }
, setBlockDirtyEvents:function(block)
  {
    if(this.blockdirtyevents == block)
      return;
    if(this.options.debugdirty)
      console.log(this.getDebugTag() + "*** setBlockDirtyEvents",block)

    this.blockdirtyevents = block;
    if(block)
      return;

    this.scanDirtyState();
    //ADDME fire dirtychange only on real change
    this.sendFormEvent("dirtychange", { model: null
                                  , field: null
                                  , dirty: null
                                  });
  }
, runSubmissionHooks:function()
  {
    if(this.form.getAttribute('data-gtm-submit') && window.dataLayer)
    {
      var layerobj = JSON.decode(this.form.getAttribute('data-gtm-submit'));
      var prefix = 'form_';
      Object.each(this.getRawData(), function(value,key)
      {
        layerobj[prefix + key] = value;
      });
      window.dataLayer.push(layerobj);
    }
  }
, handleKeyDown:function(event)
  {
    if(event.key=="enter" && !["a","textarea"].contains(event.target.get('tag')) && event.target.contentEditable !== "true")
    {
      event.stop();

      if(this.lastfocused) //validate the current field
      {
        if(this.options.debugfocus)
          console.log(this.getDebugTag()+ "to make sure fields are validated before submitting, simulating focusloss for", this.lastfocused);
        this.handleLastFocused(null); //handle any pending focus-out actions. (in a previosu coudepath, FF needs this to fix the focusout bug
      }

      // Find the first submit button and press that. Submit buttons are:
      // <input type="submit">
      // <input type="image">,
      // <button type="submit">
      // <button> ("submit" is the default button type)
      // See http://www.w3.org/TR/html5/forms.html#implicit-submission
      this.form.getElements("input, button").some(function(input)
      {
        if ((input.nodeName.toLowerCase() == "input" && ["submit","image"].contains(input.type))
            || (input.nodeName.toLowerCase() == "button" && ["","submit"].contains(input.type)))
        {
          input.click();
          return true; // break out of some() loop
        }
      }, this);
      return;
    }

    var model = $wh.Form.getFieldModel(event.target);
    if(model)
      model.setDirty(true);
  }
/*, handleEnter:function(event)
  {
  }*/
, isSubmitButton:function(node)
  {
    node = node.getSelfOrParent('input,button');
    return node && (!node.type || ['SUBMIT','IMAGE'].contains(node.type.toUpperCase()));
  }
, isResetButton:function(node)
  {
    node = node.getSelfOrParent('input,button');
    return node && node.type && node.type.toUpperCase()=='RESET';
  }
, handleClick:function(event)
  {
    if(this.isSubmitButton(event.target))
    {
      event.stop();

      var formaction = event.target.getAttribute('data-form-action') || 'submit';
      var evt = new $wh.Form.ActionEvent(this, event.target, formaction);

      this.fireEvent("formaction", evt);
      if(!evt.defaultPrevented)
      {
        evt.target = this.form;
        this.form.fireEvent("wh-form-formaction", evt);
      }
      if(!evt.defaultPrevented)
        this.executeDefaultFormAction(event.target, formaction);
      return;
    }
    if(this.isResetButton(event.target))
    {
      event.stop();
      this.resetData();
      return;
    }

    var model = $wh.Form.getFieldModel(event.target);
    if(model && model.validateonclick)
      this.validateField(model, true, false);
  }
, handleInput:function(event)
  {
    var model = $wh.Form.getFieldModel(event.target);
    if(!model)
      model = event.target.retrieve("wh-form-parentmodel")
    if(model && model.__dirtyonchange && !model.isPristineValue())
      model.setDirty(true);
  }
, handleChange:function(event)
  {
    var model = $wh.Form.getFieldModel(event.target);

    if(!model)
      model = event.target.retrieve("wh-form-parentmodel")

    if(model && model.__dirtyonchange && !model.isPristineValue())
    {
      model.setDirty(true);
      if(model.validateonchange && !this.blockdirtyevents)
        this.validateField(model, true, false)
    }
    else if(this.options.debugdirty)
    {
      console.log(this.getDebugTag() + " didn't handle change event ", event.target, model, model ? model.__dirtyonchange : undefined);
    }

    this.updateEnableOns(this.form);
  }
, executeDefaultFormAction:function(button, action)
  {
    if(action=='submit')
    {
      this.submittry = this.trySubmit.bind(this, true, button);
      this.submittry();
    }
    else
    {
      throw "Unrecognized form action '" + action + "'";
    }
  }
, handleMouseDown:function(event)
  {
    if(this.submitting)
    {
      //console.log("Ignoring click, form is submitting... I'll KILL YOUR LINKS!!! hahaha");
      if(this.options.debugvalidation)
        console.log(this.getDebugTag() + "Stopping mousedown as this form is still submitting", event.target);
      event.stop();
    }
  }

  /** Locate position of any pending validation function for a field.
      @param newitem Field node
      @return Position of pending valodation function in queue.
  */
, findPendingSimilarTask:function(newitem)
  {
    // The first item in the remotequeue is being executed, so it isn't pending.
    for(var i=1;i<this.remotequeue.length;++i)
      if(this.remotequeue[i].field==newitem.field)
        return i;
    return 0;
  }

  /** Add new validation item to the queue
      @param newitem
      @cell newitem.field
      @cell newitem.func
  */
, addToQueue:function(newitem)
  {
    //Is this field already on the queue, pending validation? if so, remove the existing version
    //The first item is already executing, the new task might call with other data.
    var pending = this.findPendingSimilarTask(newitem);
    if(pending)
      this.remotequeue.splice(pending,1);

    //Add task to queue
    this.remotequeue.push(newitem);
    if(this.remotequeue.length==1) //this task is on top of the queue?
    {
      $wh.updateUIBusyFlag(+1);
      this.popNextQueueItem.delay(0,this);
    }
  }

  /// Process the next item in the remotequeue
, popNextQueueItem:function()
  {
    this.remotequeue[0].func(this.handleQueueCallback.bind(this));
  }

  /** Process the validation result for a field
      @param validationresult
      @cell validationresult.field
  */
, handleQueueCallback:function(validationresult)
  {
    //Is this the only task referring to this field?  (FIXME don't assume this result applies to queuentry #0, validate it!)
    var field = this.remotequeue[0].field;
    var anyother = this.findPendingSimilarTask(this.remotequeue[0]);

    this.remotequeue.splice(0,1);
    var runnext = this.remotequeue.length>0;
    if(!anyother) //no. we can safely complete the pending task
    {
      this.setValidationStatus(field, validationresult);
    }

    if(runnext)
    {
      this.popNextQueueItem();
    }
    else
    {
      $wh.updateUIBusyFlag(-1);
      if(this.submittry)
      {
        if(this.options.debugvalidation)
          console.log(this.getDebugTag() + 'retrying submission after completion of pending queue');
        this.submittry(); //retry!
      }
    }
  }

, updateEnableOns: function(startnode)
  {
    if (this.options.debugenableons)
      console.log(this.getDebugTag() + "-- HANDLING ENABLEONS -- ");

    var enableonchanges = [];

    if(startnode.hasAttribute("data-form-enableon"))
      this.updateEnableOnState(enableonchanges, startnode);

    startnode.getElements('*[data-form-enableon]').each(this.updateEnableOnState.bind(this, enableonchanges));

    if (this.options.debugenableons)
      console.log(this.getDebugTag() + "-- FINISHED ENABLEONS -- " + enableonchanges.length + " nodes changed. " , enableonchanges);

    if(enableonchanges.length)
      this.sendFormEvent("enableonchange" , { changednodes: enableonchanges });
  }

, evaluateEnableOnCriteria:function(criterium)
  {
    criterium = criterium.clean();
    if(!criterium)
      return;

    var listento = criterium.split(" ");
    // check whether at least one of the specified visibleon fields is selected/checked
    for(var idx = 0; idx < listento.length; idx++)
    {
      var criteria = listento[idx];
      var criteriaparts = criteria.split('=');
      var compname = criteriaparts[0];

      var comp = this.getField(compname);
      if(!comp)
      {
        comp = $(compname);
        if (comp)
          console.warn("Enableon '"+criteria+"' referring to an id instead of a name");
        else
          console.error("No such component '" + compname + "' referred in visibleon criteria '" + criteria + "'");

        continue;
      }

      var fieldvalue = comp.getValue();
      var result=false;

      if (criteriaparts.length == 1)
      {
        if (fieldvalue !== false && fieldvalue !== "")
          result=true;
      }
      else if (criteriaparts.length == 2)
      {
        if (fieldvalue instanceof Array) // for example: wh.checkboxgroup with multiple checkboxes
        {
          // for example a checkbox group returns an array as value
          if (fieldvalue.contains(criteriaparts[1]))
            result = true;
        }
        else if (fieldvalue+"" == criteriaparts[1])
          result = true;
      }
      else
      {
        console.error("each enableon criteria can have only one =");
      }

      if (this.options.debugenableons)
        console.log(this.getDebugTag() + " criterium: evaluate '" + criteria + "', value '" + fieldvalue + "', result: " + result);
      if(result)
        return true;
    };
    return false;
  }

  // FIXME: this recalculates all visible states, is it worth our time to make it smarter?
  // FIXME: for checkboxgroup's add ~= to check whether the value is one of the selected values (CONTAINS)
  //        and make = be strict the single value.... and maybe allow multiple values seperated by , ??????
, updateEnableOnState:function(enableonchanges, node)
  {
    var listento = node.getAttribute("data-form-enableon");
    var shouldshow = false;

    if (this.options.debugenableons)
    {
      var debugname = node.name || (node.id ? '#' + node.id : node.nodeName);
      console.log(this.getDebugTag() + debugname + ": process enableons ", node);
    }

    if(!node.getParent(".wh-form-disabled")) //disabled by a parent
    {
      var customfunction = node.retrieve("wh-form-enableoncheck");
      if(customfunction)
      {
        if(listento)
        {
          console.error("A custom enableonchecker was declared using $wh.Form.setEnableOnCheck, but data-form-enableon has explicit criteria", node);
          node.removeAttribute("data-form-enableon");
          return;
        }
        shouldshow = !!customfunction(this, node);
      }
      else
      {
        if(listento)
          shouldshow = this.evaluateEnableOnCriteria(listento);
      }
    }

    var currentshow = !node.hasClass("wh-form-disabled");
    if (this.options.debugenableons)
      console.log(this.getDebugTag() + debugname + " conclusion shouldshow:", shouldshow + ", currentshow:" + currentshow);
    if(shouldshow === currentshow)
      return;

    var disablemode = node.getAttribute("data-form-disablemode") || "disabled"; //unspecified automatically assumes 'disabled'
    var actualnode = node.retrieve("wh-ui-replacedby") || node;
    enableonchanges.push(node);

    node.toggleClass("wh-form-disabled", !shouldshow);
    if(disablemode=="disabled")
      node.disabled = !shouldshow;

    node.fireEvent("wh-refresh");

    // FIXME: handling of visible of models in models not supported yet
    var model = $wh.Form.getFieldModel(node);
    if(model)
      model.setEnabled(shouldshow);

    $wh.Form.processOnModels(node, false, function(model)
      {
        //ensure this is still the same data-form-enableon group
        if(model.node && model.node.getParent("[data-form-enableon]") == node && !model.node.hasAttribute('data-form-enableon'))
          model.setEnabled(shouldshow);
      }.bind(this));

    $wh.fireLayoutChangeEvent(node);
  }

  // ---------------------------------------------------------------------------
  //
  // Public API
  //

  /** Revalidate the form */
, revalidate:function()
  {
    this.validateFields(this.form, {force: true});
  }

  /** Validate fields by name
      @param fieldnames Names of fields to validate (names that are not found are ignored silently).
  */
, revalidateFields:function(fieldnames)
  {
    Array.each(fieldnames, function(fieldname)
    {
      var fldmodel = this.getField(fieldname);
      if(fldmodel)
        this.validateField(fldmodel, true, false);
    }.bind(this));
  }

  /** Set validation errors for components
      @param errors
      @cell errors.name Name of field (searched in name attribute)
      @cell errors.error Validation error to show
  */
, failSubmission:function(errors)
  {
    this.globalerrors = [];
    Array.each(errors, function(error)
      {
        if(!error.name)
        {
          this.globalerrors.push(error.error);
          return;
        }

        var field = this.form.getElement('[name="' + error.name + '"]');
        if(!field)
          return console.error("failSubmission: No such field '" + error.name + "'");
        var model = $wh.Form.getFieldModel(field);
        if(!model)
          return;
        model.setValidationStatus(error);
      }.bind(this));

    //FIXME focus first field
    this.updateFormGlobalErrorState();
  }

  /** @short make the formhandler manage this keyboard.
             (do this for custom components so the keydown's they don't handle will bubble up to us)
, manageKeyboard: function(keyboard)
  {
    //console.info("Will now manage keyboard", keyboard);
    this.keyboard.manage(keyboard);
  }
  */
});

$wh.Form.ActionEvent = new Class(
{ Extends: $wh.Event
, button: null
, formaction: null
, formhandler: null
, initialize:function(formhandler, button, formaction)
  {
    this.target = formhandler;
    this.formhandler = formhandler;
    this.button = button;
    this.formaction = formaction;
  }
});
$wh.Form.FocusEvent = new Class(
{ Extends: $wh.Event
, model: null
, node: null
, formhandler: null
, initialize:function(formhandler, model, node)
  {
    this.target = formhandler;
    this.formhandler = formhandler;
    this.model = model;
    this.node = node;
  }
});

$wh.Form.setupHandler = function(item, options)
{
  if(!options)
    options={};

  item = $(item);
  var form = item.retrieve('wh-formhandler');
  if(form)
    console.error("Duplicate form initialization",item);
  else
    form = new $wh.Form.Handler(item, options);
  return form;
}
$wh.Form.setupHandlers = function(selector, options)
{
  $$(selector).each(function(item)
  {
    $wh.Form.setupHandler(item, options);
  });
}

var GroupableInputsBase = new Class(
{ Extends: $wh.Form.InputGroupBase
, getName:function()
  {
    var members = this.getGroupMembers();
    return members.length ? members[0].name : null;
  }
, getSelectedNodes:function()
  {
    var selectednodes = [];
    Array.each(this.getGroupMembers(), function(member)
    {
      if(member.checked)
        selectednodes.push(member)
    });
    return selectednodes;
  }
, setRawValueByArray:function(values)
  {
    Array.each(this.getGroupMembers(), function(member)
    {
      var setvalue = values.contains(member.value);
      if(member.checked != setvalue)
      {
        member.checked=setvalue;
        $wh.fireHTMLEvent(member, "input");
        $wh.fireHTMLEvent(member, "change");
      }
    });
  }
, fireChangeEvents:function()
  {
    Array.each(this.getGroupMembers(), function(member)
    {
      if(member.checked)
      {
        $wh.fireHTMLEvent(member, "input");
        $wh.fireHTMLEvent(member, "change");
      }
    });
  }
});

$wh.Form.models["wh.radiogroup"] = new Class(
{ Extends: GroupableInputsBase
, initialize: function(formhandler, node, parentmodel)
  {
    this.parent(formhandler,node, parentmodel);
  }
, getGroupMembers:function()
  {
    return this.node.getElements("input[type='radio']");
  }
, getSelectedNode:function()
  {
    return this.getSelectedNodes().pick();
  }
, getRawValue:function()
  {
    var value = '';
    Array.some(this.getGroupMembers(), function(radio)
    {
      if(radio.checked)
        value = radio.value;
      return value != '';
    })
    return value;
  }
, setRawValue:function(value)
  {
    this.setRawValueByArray([value]);
  }
, isRequired:function()
  {
    return Array.some(this.getGroupMembers(), function(radio)
    {
      return !!radio.required;
    }) || false;
  }
});

$wh.Form.models["wh.checkboxgroup"] = new Class(
{ Extends: GroupableInputsBase
, minselected: 0
, maxselected: 0

, initialize: function(formhandler, node, parentmodel)
  {
    this.parent(formhandler, node, parentmodel);

    var min = parseInt(this.node.getAttribute("data-checkboxgroup-min"));
    if (!isNaN(min))
      this.minselected = min;
    var max = parseInt(this.node.getAttribute("data-checkboxgroup-max"));
    if (!isNaN(max))
      this.maxselected = max;
  }
, getGroupMembers:function()
  {
    return this.node.getElements("input[type='checkbox']");
  }
, getRawValue:function()
  {
    var groupmembers = this.getGroupMembers();
    var values = [];
    Array.each(groupmembers, function(cbox)
    {
      if(cbox.checked)
        values.push(cbox.value);
    });
    return values;
  }
, setRawValue:function(values)
  {
    this.setRawValueByArray(values);
  }
, validate:function()
  {
    var error = this.parent();
    if (!error)
    {
      var num = this.getValue().length;
      if (this.minselected > num)
        error = { error: Locale.get('wh-form.checkboxgroup_minselected', this.minselected) };
      else if (this.maxselected > 0 && num > this.maxselected)
        error = { error: Locale.get('wh-form.checkboxgroup_maxselected', this.maxselected) };
    }
    return error;
  }
, isSet:function()
  {
    return this.getValue().length;
  }
, isPristineValue:function()
  {
    var rhs = this.getValue();
    return rhs.toString() == this.pristinevalue.toString();
  }
});


$wh.Form.models["wh.select"] = new Class(
{ Extends: $wh.Form.InputFieldBase
, initialize: function(formhandler, node, parentmodel)
  {
    this.parent(formhandler, node, parentmodel);
  }
, getGroupMembers:function() // FIXME: is this function needed?
  {
    return [ this.node ];
  }
, getRawValue:function()
  {
    return (this.node.value || this.node.options[this.node.selectedIndex] ? this.node.options[this.node.selectedIndex].value : null);
  }
, setRawValue:function(value)
  {
    this.node.value = value;

    // Select first option if the value isn't valid (same as the post would do)
    if (this.node.selectedIndex == -1)
      this.node.selectedIndex = 0;

    this.fireChangeEvents();
  }
, isRequired:function()
  {
    return this.node.required;
  }
, getName:function()
  {
    return this.node.name;
  }
});

$wh.Form.models["wh.submit"] = new Class(
{ Extends: $wh.Form.InputFieldBase
, getValue:function()
  {
    return this.formhandler.lastsubmitbutton == this.node;
  }
, getApiValue: function()
  {
    return { inputname: this.getName() || '', value: this.getValue() };
  }
, setRawValue:function(value)
  {
    //no value to set
  }
});

$wh.Form.executeSubmitInstruction = $wh.executeSubmitInstruction;

var Prefiller = new Class(
{ form:null
, prefillarea: null
, prefillselect: null
, basename: ''
, lastselection: ''
, initialize: function(form)
  {
    //ADDME Proper form name generation
    this.form=form;
    this.basename = 'wh-form:' + location.href.split('//')[1].split('?')[0];

    this.prefillarea = new Element("div", {"class": "wh-form-prefill"
                                           }).inject(form.form,'top');
    this.prefillselect = new Element("select").inject(this.prefillarea);
    this.prefillselect.addEvent("input", this.onPrefillChoice.bind(this));
    this.refresh();
  }
, refresh: function()
  {
    this.prefillselect.empty();
    this.prefillselect.adopt(new Element("option", { text: "Select prefill" }));

    var names = window.localStorage[this.basename + '$names'];
    if(names)
      names.split('\t').forEach(function(name)
      {
        this.prefillselect.adopt(new Element("option", { text: "Prefill '" + name + "'", "data-prefill": name }));
      },this);

    this.prefillselect.adopt(new Element("option", { text: "Reset", "data-type": "reset" }));
    this.prefillselect.adopt(new Element("option", { text: "Add new...", "data-type": "addnew" }));
  }
, onPrefillChoice:function()
  {
    var sel = this.prefillselect.selectedOptions[0];
    if(sel.getAttribute("data-type") == "addnew")
    {
      var name = prompt("Enter a name for the new prefill", this.lastselection);
      if(!name)
        return;

      var names = (window.localStorage[this.basename + '$names'] || '').split('\t').filter(function (val) { return val; });
      if(names.indexOf(name) == -1)
        names.push(name);

      window.localStorage[this.basename + '$names'] = names.join('\t');
      window.localStorage[this.basename + '$name-' + name] = JSON.stringify(this.form.getData());
      this.refresh();
    }
    else if(sel.getAttribute("data-type") == "reset")
    {
      this.form.resetData();
    }
    else if(sel.getAttribute("data-prefill"))
    {
      var name = sel.getAttribute("data-prefill");
      this.lastselection = name;
      this.form.setData(JSON.parse(window.localStorage[this.basename + '$name-' + name]));
    }
    this.prefillselect.selectedIndex=0;
  }
});

window.addEvent("wh-after-domready", function()
{
  didinitialevents = true;
  Array.each(sendinitialevents, function(form)
  {
    form.fireInitialEvents();
  });
});

})(document.id);
module.exports = $wh.Form
