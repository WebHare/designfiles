/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.ui.base');
require ('../frameworks.mootools.more.locale');
require ('../frameworks.mootools.more.date');
require ('../wh.util.validation');
/*! LOAD: frameworks.mootools, wh.ui.base, frameworks.mootools.more.locale
    LOAD: frameworks.mootools.more.date
    LOAD: wh.util.validation
!*/

(function($) {
"use strict";

if(!$wh.Form)
  $wh.Form={};

function getFieldName(node)
{
  return node.getAttribute('name') || node.getAttribute('data-form-name') || '';
}
function getTemplateRowFromRows(rows)
{
  var templaterow=null;
  Array.some(rows, function(row)
  {
    if(row.istemplate)
      templaterow=row;
    return !!templaterow;
  });
  return templaterow;
}

function getRetentionIdField(basename, rownode)
{
  if(!basename)
    return null;

  var retentionfield = null;
  rownode.getElements('input[type="hidden"]').some(function (node)
  {
    if(node.name && node.name.substr(0,basename.length+1) == basename + '.' && node.name.indexOf('.',basename.length+1) == -1)
    {
      retentionfield = node;
      return true;
    }
  });
  return retentionfield;
}

$wh.Form.models = {};
//$wh.Form.modelsByClass = {};
//$wh.Form.modelsByInputType = {};

$wh.Form.getHandler = function(element)
{
  element=$(element)
  return element ? element.retrieve("wh-formhandler") : null;
}
$wh.Form.isEnabled = function(field)
{
  field=$(field);
  return field && !field.disabled && !field.hasClass(".wh-form-disabled") && !field.getParent('.wh-form-disabled');
}
$wh.Form.getFieldModel = function(field)
{
  field=$(field);
  return field ? field.retrieve("wh-form-model") : null;
}
$wh.Form.getValue = function(field)
{
  var model = $wh.Form.getFieldModel(field);
  if(model)
    return model.getValue();

  console.error("$wh.Form.getValue: The requested field has no model",field);
}
$wh.Form.setValue = function(field, value)
{
  var model = $wh.Form.getFieldModel(field);
  if(model)
    return model.setValue(value);

  console.error("$wh.Form.setValue: The requested field has no model",field);
}

function gatherInclusions(fulllist, node)
{
  fulllist.push(node);
  if(node.hasAttribute('data-form-include'))
  {
    Array.each(node.ownerDocument.getElements(node.getAttribute('data-form-include')), function(subnode)
    {
      if(!fulllist.contains(subnode)) //guard against loops
        gatherInclusions(fulllist, subnode);
    });
  }
}
$wh.Form.processOnFields = function(parents, stopfirstsuccess, callback)
{
  if(! (parents instanceof Array))
    parents=[parents];

  var fullparents = [];
  Array.each(parents, gatherInclusions.bind(null, fullparents));

  for(var i=0;i<fullparents.length;++i)
  {
    var parentname = getFieldName(fullparents[i]);
    if(!parentname && fullparents[i].hasClass("arrayrow"))
    {
      var arrayparent = fullparents[i].getParent("*[data-form-model]");
      if(arrayparent)
      {
        var retentionfield = getRetentionIdField(getFieldName(arrayparent), fullparents[i]);
        if(retentionfield)
        {
          parentname = retentionfield.name;
        }
      }
    }

    var findbasename = parentname ? parentname + '.' : '';
    var seennames = [];
    var retval = $wh.Form.processOnFieldsRecursive(findbasename, fullparents[i], fullparents[i], stopfirstsuccess, callback, seennames);
    if(retval && stopfirstsuccess)
      return retval;
  }
}
$wh.Form.processOnFieldsRecursive = function(findbasename, origparent, currentparent, stopfirstsuccess, callback, seennames)
{
  for(var node = currentparent.firstChild; node; node = node.nextSibling)
  {
    try
    {
      if(!$wh.isHTMLElement(node) || $(node).hasClass("templaterow") || node.name == 'formsapi-retentionid' || node.retrieve("wh-form-parentmodel"))
        continue;
    }
    catch(e)
    {
      continue; //IE8 mootools functions may fail with "Object doesn't support this property or method". eg on a div fb-share. probably because its imported
    }


    var tag = node.get("tag");
    var easydetect = tag=='input' || tag=='select' || tag=='textarea' || node.hasAttribute('data-form-model');
    if(easydetect || node.hasClass("wh-inputgroup"))
    {
      if(tag=='input' && node.type.toUpperCase()=='RESET')
        continue; //skip these

      if(!easydetect)
      {
        console.error("wh-inputgroup has been deprecated, specify a data-form-model for field",node);
        throw new Exception("wh-inputgroup has been removed, specify a data-form-model for field");
      }

      var name = getFieldName(node);
      if(!name && findbasename)
        continue; //skip unnamed fields if our parent has a name
      if(name && name.substr(0,findbasename.length) != findbasename)
      {
        if($wh.debug.fhv && (findbasename != name+'.') && !node.wh_fhv_warned)
        {
          node.wh_fhv_warned = true;
          console.warn("Node not picked up bacause it's name '" + node.name + "'' does not match the basename '" + findbasename + "*'", node);
        }
        continue;
      }
      if(name && name.indexOf('.',findbasename.length) != -1)
      {
        //console.log("skipping field that will be picked up by one of our children. findbasename=[" + findbasename + "], name=[" + name + "]", parent, node);
        continue;
      }
      if(name)
      {
        if(seennames.contains(name))
          continue;
        seennames.push(name);
      }

      var retval = callback(node, name ? name.substr(findbasename.length) : null);

//console.log(node, retval);
      if(retval && stopfirstsuccess)
        return retval;
//        if(!node.hasAttribute('data-form-flatten'))
//          continue;
    }

    var retval = $wh.Form.processOnFieldsRecursive(findbasename, origparent, node, stopfirstsuccess, callback, seennames);
    if(retval && stopfirstsuccess)
      return retval;
  }
}
$wh.Form.processOnModels = function(parent, stopfirstsuccess, callback)
{
  return $wh.Form.processOnFields(parent, stopfirstsuccess, function(field, localname)
  {
    var model = $wh.Form.getFieldModel(field);
    if(!model)
      return;
    return callback(model, localname);
  });
}

$wh.Form.setValidator = function(field, validator)
{
  if (field == null)
    throw new Error("No field/node specified for setValidator.");

  var model = $wh.Form.getFieldModel(field);
  if(!model)
  {
    console.trace();
    throw new Error("The field has no model (yet) - make sure forms are initialized before validators are set up");
  }

  //ADDME Properly deal with adding validation to already set fields
  model.uservalidator = validator;
}
$wh.Form.setEnableOnCheck = function(field, enableonchecker)
{
  if(field instanceof Elements || field instanceof Array)
  {
    Array.each(field, function(el) { $wh.Form.setEnableOnCheck(el, enableonchecker )});
    return;
  }
  field=$(field);
  field.store("wh-form-enableoncheck", enableonchecker);

  //sync enableon state if a formhandler is already here
  var form = $(field).getParent("form");
  if(!form)
    return;
  var handler = $wh.Form.getHandler(form);
  if(handler)
    handler.updateEnableOns(field);
}

function filterUsingInputLimit(intext, filter) //ADDME implement more filter
{
  var outtext='';
  filter = filter.split(' ');

  for(var i=0;i<intext.length;++i)
  {
    var inchar=intext[i];
    if (Array.some(filter, function(filtername)
    {
      if(filtername=='digit' && inchar>='0' && inchar <= '9')
        return true;
    })) //then
    {
      outtext += inchar;
    }
  }
  return outtext;
}

/** This is the base class for a form model. A model encapsulates an field (input node, select) or
    a fieldgroup (optionally with subfields). It provides an interface for the form for getting the value of the field,
    validating, etcetera.
*/
$wh.Form.ModelBase = new Class(
{ // ---------------------------------------------------------------------------
  //
  // Variables
  //

  /// Form this input or group belongs to
  formhandler:null

  /// Top node for this model
, node: null

  /// Value (from getValue) at initialization of the model
, pristinevalue: null

  /// Whether validation is pending
, __pending: false

  /// Automatically apply dirty on input/change
, __dirtyonchange: true

  /// Current validation error message
, __errormessage: null

  ///automatically cleanup values after field loses focus
, autocleanup: true

  /// Validate when the component value has changed (default for select)
, validateonchange: false

  /// Validate when the component value has bene clicked (default for checkbox)
, validateonclick: false

  /// User validation function
, uservalidator: null

  /// Dirty?
, dirty: false

  /// Require validation for the current value
, needsrevalidation: true

  /// If false, allow subfields to handle their own status
, combinestatus: false

  /// Display validity directly (groups shouldn't do this, as it affects subfield's marking)
, displayvalidity: true

, allowfeedback: false

  /// Whether the model is visible (according to the formhandler's visibleon rules, not through CSS)
, __enabled: true

  // ---------------------------------------------------------------------------
  //
  // Init
  //

, initialize:function(formhandler, node, parentmodel)
  {
    this.formhandler = formhandler;
    this.node = node;
    this.parentmodel = parentmodel;

    if(this.node)
    {
      node.store("wh-form-model", this);

      this.validateonchange = this.node.get('tag') == 'select';
      this.validateonclick = ['checkbox'].contains(this.node.getAttribute('type'));
    }
  }
, isPristineValue:function()
  {
    var rhs = this.getValue();
    if(rhs instanceof Date)
      return this.pristinevalue && rhs.toString() == this.pristinevalue.toString();

    return this.pristinevalue === rhs;
  }
, loadPristineValue:function()
  {
    this.pristinevalue = this.getValue();
  }

  // ---------------------------------------------------------------------------
  //
  // To override
  //
, prepareOnChange:function()
  {

  }
  /// override this function to define your own cleanup on raw values
, cleanup:function(rawvalue)
  {
    return rawvalue;
  }
, reset:function()
  {
    this.setValue(this.pristinevalue, { markpristine: true});
    this.setDirty(false);
    this.needsrevalidation=true;
  }

  /// override this function to define your own focus error handling
, focusError: function()
  {
    var focusable = $wh.getFocusableElement(this.node);
    if(focusable && !$wh.isFocusableComponent(focusable))
    {
      var options = $wh.getFocusableComponents(focusable, false);
      focusable = options.pick();
    }
    if(focusable)
      focusable.focus();
  }
, showFeedback:function()
  {
    return this.allowfeedback && this.needsValidation();
  }
, setAllowFeedback:function(allowfeedback)
  {
    if(this.allowfeedback == allowfeedback)
      return;
    if(this.formhandler.options.debugdirty)
      console.error(this.formhandler.getDebugTag() + "allow feedback for ", this.getName(), " set to ", allowfeedback);

    this.allowfeedback = allowfeedback;
    this.updateStatus();
  }
, needsValidation:function()
  {
    return this.__enabled === true && !this.node.readOnly && !this.node.disabled && !this.node.hasAttribute("data-form-disabled");
  }
  /// override this function to define your own focus handling
, hasFocus:function()
  {
    return this.node && $wh.getCurrentlyFocusedElement() == this.node;
  }

, setEnabled:function(visible)
  {
    this.__enabled = visible;
  }

  /** Run validation
      @return
      @cell return.error If set, show this error
      @cell return.callback If set, schedule a callback to execute asynchronous validation
  */
, validate:function(value)
  {
    return null; //no problems
  }
, getProcessableSubModels:function()
  {
    return null;
  }
, getName:function()
  {
    return getFieldName(this.node);
  }
  /// Return the raw value of the field
, getRawValue:function()
  {
    console.error("getRawValue not implemented", this, this.xstack);
    throw new Error("getRawValue not implemented");
  }

  /// Overwrite the raw value of the field
, setRawValue:function(value)
  {
    console.error("setRawValue not implemented", this, value, this.xstack);
    throw new Error("setRawValue not implemented");
  }

  /** Parse the raw value to generate the normal value
      @param inval Raw value (string). Empty string must
  */
, parseRawValue:function(inval)
  {
    return inval;
  }

  /// Generate the raw value from the normal value
, generateRawValue:function(inval)
  {
    return inval;
  }

  /// Get the normal value. If this value is thruthy, the model is considered set (isSet returns true)
, getValue:function()
  {
    return this.parseRawValue(this.cleanup(this.getRawValue()));
  }

  /// Get the value required for formsapi submission
, getApiValue:function()
  {
    return { inputname: this.getName() || '', raw: this.getRawValue() || '' };
  }
  /// Set the normal value
, setValue:function(value, options)
  {
    this.setRawValue(this.cleanup(this.generateRawValue(value)), options);
    if(options&&options.markpristine)
    {
      this.loadPristineValue();
      this.setDirty(false);
    }

  }
, getApiResultFromValue:function(value)
  {
    return {raw:value};
  }
, getValueFromApiResult:function(result)
  {
    return this.parseRawValue(this.cleanup(result.raw));
  }
, setApiResult:function(result, options)
  {
    if(typeof result.raw == 'undefined')
    {
      console.error("Do not know how to handle api result for field", this.getName(), this.node, result);
      return;
    }

    //STOP using this: this.setRawValue(result.raw);
    this.setValue(this.getValueFromApiResult(result), options);

    if(result.error)
    {
      this.needsrevalidation=false;
      this.setValidationStatus({error: result.error.message, subfielderror: !!result.error.subfield});
    }
    else if(!options.cleanstart)
    {
      this.needsrevalidation=false;
      this.setValidationStatus(null);
    }
  }

  /// Return whether a validation operation is still pending
, isPending:function()
  {
    return this.__pending === true;
  }
, isDisabled:function()
  {
    return !!this.node.disabled;
  }
  /// Returns whether this model is required
, isRequired:function()
  {
    return (this.node.hasAttribute("required") || this.node.hasAttribute("data-form-required")) && this.getName();
  }

  /// Whether a value has been set
, isSet:function()
  {
    if(this.node.get('tag')=='select')
    {
      if(this.node.selectedIndex >= 0 && this.node.selectedOptions[0].disabled)
        return false;
    }
    return !!this.getValue();
  }

  /// Called just before submit. Override to fill hidden inputs with submit values
, prepareForSubmit: function()
  {
  }

, getTopLevelError:function()
  {
    if(!this.needsValidation())
      return null;
    return !this.isValid() && this.__errormessage ? this.__errormessage : null;
  }


  // ---------------------------------------------------------------------------
  //
  // Further API stuff
  //

, setDirty:function(isdirty)
  {
    if(isdirty && (!this.getName() || this.isDisabled()))
      isdirty = false;

    if(this.formhandler.options.debugdirty)
    {
      if(isdirty && !this.needsrevalidation)
      {
        console.error(this.formhandler.getDebugTag() + "Marking field '" + this.getName() + "' for revalidation", this);
      }
      if(this.dirty != isdirty)
      {
        console.error(this.formhandler.getDebugTag() + "Marking field '" + this.getName() + "' as " + (isdirty ? "dirty":"pristine"), this);
      }
    }

    if(isdirty)
      this.needsrevalidation = true;
    if(this.dirty == isdirty)
      return;

    this.dirty = isdirty;
    this.updateStatus();
    this.formhandler.signalDirtyChange(this);
  }

  /// Sets the validation result to a specific message
, setError:function(errormsg)
  {
    this.setValidationStatus({error:errormsg});
  }

  /** Sets validation status
      @param result
      @cell result.error Error message to set
      @cell result.callback Callback to execute validation (will be scheduled in validation queue)
  */
, setValidationStatus:function(result)
  {
    this.__validating=false;
    this.formhandler.__applyValidationResult(this.node, this, result);
  }

  /** Get first invalid field */
, getFirstNonValid:function()
  {
    return this.isValid() ? null : this;
  }

  /** Run validation on this field
  */
, runValidation:function(stillhasfocus)
  {
    var validationresult = null;
    var inval;

    //console.error("VALIDATING:", this.getName(), this.node, stillhasfocus, "locked?",!this.feedbackunlocked);console.log("NV?",this.needsValidation());
    if(!this.needsValidation())
    {
      this.updateStatus();
      return;
    }

    if (this.autocleanup) //process the raw value, and cleanup where needed
    {
      var rawval = this.getRawValue();
      inval = this.cleanup(rawval);
      if(inval != rawval)
      {
        this.setRawValue(inval);
      }
      inval = this.parseRawValue(inval);
    }
    else
    {
      inval = this.getValue();
    }
    this.__validating=true;
    if(this.__pending)
      return;

    this.needsrevalidation = false;

    var isset = this.isSet();
    if(this.isRequired() && !isset)
      validationresult = { error: Locale.get('wh-form.required_field'), delayiffocus: true };

    if(isset && !validationresult)
    {
      if(this.node.getAttribute('type')=='email' && !$wh.isValidEmailAddress(inval)) //FIXME 'email' validation shouldn't be in such a generic handler..
        validationresult = { error: Locale.get('wh-form.invalid_email') };

      if(this.node.getAttribute('type')=='date' || this.node.getAttribute('type')=='datetime')
      {//date or datetime
        if(typeOf(inval) != "date" || !inval.isValid())
          validationresult = { error: Locale.get('wh-form.invalid_date') };
        else if(this.node.getAttribute('min') != null && Date.parse(this.node.getAttribute('min')) > inval)
          validationresult = { error: Locale.get('wh-form.invalid_date_after', Date.parse(this.node.getAttribute('min')).format("%x")) };
        else if(this.node.getAttribute('max') != null && Date.parse(this.node.getAttribute('max')) < inval)
          validationresult = { error: Locale.get('wh-form.invalid_date_before', Date.parse(this.node.getAttribute('max')).format("%x")) };
      }
      else if(this.node.getAttribute('type')=='number' || this.node.getAttribute('type')=='range')
      {
        var checkval = Number(inval);
        if(this.node.getAttribute('min') != null && Number(this.node.getAttribute('min')) > checkval)
          validationresult = { error: Locale.get('wh-form.out_of_range_min') };
        else if(this.node.getAttribute('max') != null && Number(this.node.getAttribute('max')) < checkval)
          validationresult = { error: Locale.get('wh-form.out_of_range_max') };
      }
    }

    if(isset && !validationresult)
      validationresult = this.validate(inval);
    if(isset && !validationresult && this.uservalidator)
      validationresult = this.uservalidator(inval);

    if(!this.__validating) //'lock' to prevent updating our setvalidatinstatus if this.validate did it (eg nladdress)
      return;

    if(validationresult && validationresult.delayiffocus && stillhasfocus)
    {
      validationresult = null;
      this.needsrevalidation = true;
    }
    this.setValidationStatus(validationresult);
  }

  /** Return the validation result
      @return If a validation is pending or never executed, returns null.
          Otherwise returns true if field value is valid, if not: false.
  */
, isValid:function()
  {
//    if(this.__pending || this.needsrevalidation)
    if(this.isPending())
      return null;
    if(this.__errormessage !== null)
      return false;
    return this.isRequired() ? this.isSet() : true;
  }

  /// Clears the field
, clear:function()
  {
    this.setRawValue('');
    this.setAllowFeedback(false);
  }

  /// Debugging - return current model status
, getStateAsString:function()
  {
    var infonode = this.node.getParent(".fieldgroup") || this;
    return "pending: " + this.__pending + ", needsrevalidation: " + this.needsrevalidation + ", errormessage:" + this.__errormessage + ", classes: " + (infonode?infonode.className:'(null)');
  }

, updateStatus:function()
  {
    if(this.parentmodel && this.parentmodel.combinestatus)
    {
      this.parentmodel.updateStatus();
      return;
    }
    this.applyStatus(this, this.dirty);
  }
, applyStatus:function(relevantstatus, isdirty)
  {
    var fieldgroup;
//    console.error("aplplystatus lookup", this, relevantstatus);
    for(var searchgroup = this.node.parentNode; searchgroup && !fieldgroup; searchgroup = searchgroup.parentNode)
    {
  //    console.log('test ', searchgroup, $wh.Form.getFieldModel(searchgroup));
      if(!$wh.isHTMLElement(searchgroup) || searchgroup == this.formhandler.form || $wh.Form.getFieldModel(searchgroup)) //found a different field/model
        break; //give up
      if(searchgroup.hasClass('fieldgroup'))
        fieldgroup = searchgroup;
    }

    var statusnode = fieldgroup || this.node;
    var showfeedback = this.showFeedback();
    if(this.formhandler.options.errormsgperfield)
      this.setFieldErrorMessage(statusnode, showfeedback ? this.__errormessage : '');

//    console.error("applyStatus", this, "RS", relevantstatus, "Status", relevantstatus ? relevantstatus.isValid() : undefined, "show feedback?", showfeedback, statusnode);
    statusnode.toggleClass('valid',   showfeedback && this.displayvalidity && (!relevantstatus || relevantstatus.isValid()===true));
    statusnode.toggleClass('invalid', showfeedback && this.displayvalidity && !!(relevantstatus && relevantstatus.isValid()===false));
    statusnode.toggleClass('dirty',   isdirty);

    statusnode.toggleClass('pending', !!(relevantstatus && relevantstatus.isPending()));
  }

  /** Sets the validation error message of a field
      @param field Field with error
      @param fieldgroup Optional fieldgroup node of the field
      @param errormsg Error message to show
  */
, setFieldErrorMessage:function(statusnode, errormsg)
  {
    var errorholder = statusnode.retrieve("wh-form-error-holder");

    //fieldgroups can manually specify an error-holder node
    if(!errorholder) //find a .error-holder that is not inside another fieldgroup
    {
      var errorholders = statusnode.getElements('.error-holder:not(.is-dynamic-holder)');
      if(errorholders.length)
      {
        Array.each(statusnode.getElements('.fieldgroup .error-holder'), function (badholder)
        {
          errorholders.erase(badholder); //remove from consideration
        });
        errorholder = errorholders.pick();
      }
    }

    if(!errorholder) //we'll need to create one ?
    {
      if(!errormsg) // if(errormsg === null)
        return; //there wasn't actually an error, so it's okay

      errorholder = new Element("span", { "class": "error-holder is-dynamic-holder"});
      if(statusnode.hasClass('fieldgroup'))
      {
        errorholder.inject(statusnode, this.formhandler.options.errorgroupplacement);
      }
      else
      {
        errorholder.inject($wh.getFocusableElement(this.node), this.formhandler.options.errorfieldplacement);
      }

      statusnode.store("wh-form-error-holder", errorholder);
    }
    else if(errormsg === null) //clean existing error holder
    {
      if(errorholder.hasClass("is-dynamic-holder"))
      {
        if(statusnode.retrieve("wh-form-error-holder") != errorholder)
        {
          console.error("Eliminating wrong errorholder" ,this, statusnode, errorholder, statusnode.retrieve("wh-form-error-holder"));
          throw new Error("Eliminating wrong errorholder");
        }
        statusnode.eliminate("wh-form-error-holder");
        errorholder.dispose();
      }
      else
      {
        $wh.setTextWithLinefeeds(errorholder,'');
      }
      return;
    }
    $wh.setTextWithLinefeeds(errorholder,errormsg);
    return;
  }
, afterApplyApiResult: function()
  {
  }
, fireChangeEvents:function()
  {
    //IE8 doesn't like us firing native events on non-input elements, so we'll use our custom events on other element types..
    if(["input","select","textarea"].contains(this.node.get('tag')))
    {
      $wh.fireHTMLEvent(this.node, "change");
    }
    else
    {
      var evt = new $wh.CustomEvent("change", {bubbles:true, cancelable:true});
      $wh.dispatchEvent(this.node, evt);
    }
  }
});

$wh.Form.InputFieldBase = new Class(
{ Extends: $wh.Form.ModelBase
, needschecked: false
, filename:null
, filevalue:null
, initialize:function(formhandler, node, parentmodel)
  {
    this.parent(formhandler, node, parentmodel);
    this.needschecked = ['radio','checkbox'].contains(node.getAttribute('type'));
    // FIXME - what did this fix? it's good at causing dupe events during unfocus... this.node.addEvent("change", this.runValidation.bind(this))
  }
, prepareOnChange:function()
  {
    if(this.node.nodeName == 'INPUT' && this.node.type=='file' && this.node.files.length>0)
    {
      this.filename = this.node.files[0].name;
      this.filevalue = null;
      var reader = new FileReader;
      reader.onload = function(file)
      {
        this.filevalue = reader.result;
        console.log(this.filevalue.substr(0,100));
      }.bind(this)
      reader.readAsDataURL(this.node.files[0]);
    }
  }
, cleanup:function(rawvalue) //override this function to define your own cleanup on raw values
  {
    if(!this.node.hasAttribute('data-noclean') && typeof rawvalue == 'string')
      rawvalue = rawvalue.clean();

    if(this.node.hasAttribute("data-limitinput"))
    {
      rawvalue = filterUsingInputLimit(rawvalue, this.node.getAttribute("data-limitinput"));
    }
    return rawvalue;
  }
, getApiValue:function()
  {
    if(this.filevalue)
      return { inputname: this.getName() || '', raw: this.filevalue, filename: this.filename };
    return this.parent();
  }
, getRawValue:function()
  {
    if(this.needschecked && !this.node.checked)
      return '';
    return this.node.get('value') || '';
  }
, setRawValue:function(value)
  {
    if(this.needschecked)
    {
      if(this.node.checked == !!value)
        return;

      this.node.checked = !!value;
    }
    else
    {
      if(this.node.get('value') == value)
        return;
      this.node.set('value', value);
    }

    this.fireChangeEvents();
  }
, parseRawValue:function(inval)
  {
    //FIXME this failed in curiousuform, date never got assigned. are we sure we need to do this ?
    if(this.node.getAttribute('type') == 'date')
      inval = Date.parse(inval);
    if(this.needschecked)
      return !!inval;
    return inval;
  }
, generateRawValue:function(inval)
  {
    if(this.node.getAttribute('type') == 'date')
    {
      if(typeOf(inval) == "date")
        inval = inval.format('%Y-%m-%d'); //date values cannot have times
      else if(typeof inval == "string")
        inval = Date.parse(inval).format("%Y-%m-%d");
    }
    if(this.needschecked)
      inval = inval ? this.node.get('value') : '';
    return inval;
  }

, validate: function(value)
  {
    if(this.node.getAttribute('type') == 'number')
    {
      value=value.toInt();

      if (isNaN(value))
        return { error: Locale.get('wh-form.number_out_of_range') }; //FIXME more specific error - FIXME this will never trigger if the browser actually supports type=number

      var minvalue = this.node.getAttribute('min');
      if (minvalue && value < minvalue.toInt())
        return { error: Locale.get('wh-form.number_out_of_range') };

      var maxvalue = this.node.getAttribute('max');
      if (maxvalue && value > maxvalue.toInt())
        return { error: Locale.get('wh-form.number_out_of_range') };
    }
  }

, fireChangeEvents:function()
  {
    this.parent();
    $wh.fireHTMLEvent(this.node, "input");
  }
});

$wh.Form.InputGroupBase = new Class(
{ Extends: $wh.Form.ModelBase
, initialize: function(formhandler, node, parentmodel)
  {
    this.parent(formhandler, node, parentmodel);
    if(this.node)
    {
      Array.each(this.getGroupMembers(), function(node)
      {
        node.store("wh-form-parentmodel", this)
      }.bind(this));
    }
  }
, getGroupMembers:function() //group members are inputnodes that are invisible to the form itself
  {
    return [];
  }
, suggestModel:function(name, field)
  {
    return null;
  }
});

var ModelRecordSharedBase = new Class(
{ Extends: $wh.Form.InputGroupBase
, initialize:function(form, node, parentmodel)
  {
    this.parent(form, node, parentmodel);
    this.formhandler.initializeModels(this.node, this);
  }
, getField:function(name)
  {
    //FIXME only return contained fields
    //if(!this.node.hasAttribute('data-form-flatten'))
    if(this.getName())
      name = this.getName() + '.' + name;
    return this.formhandler.getField(name);
  }
, isSet:function()
  {
    return Array.some(this.getSubFields(), function(fld) { return fld.model.isSet() });
  }
, getSubName:function(fullname)
  {
    var basename = this.getName();
    if(basename && fullname && fullname.substr(0,basename.length + 1) == basename + '.')
      return fullname.substr(basename.length + 1);
    return null;
  }
, getSubFields:function()
  {
    var outfields =[];
//    var basename = this.node.hasAttribute('data-form-flatten') ? '' : this.getName() + this.__fieldseparator;

    $wh.Form.processOnModels(this.node, false, function(model, localname)
    {
      outfields.push( { subname: localname
                      , model: model
                      });
    }.bind(this));
    return outfields;
  }
, runValidation:function(stillhasfocus)
  {
    Array.each(this.getSubFields(), function(field)
    {
      field.model.runValidation(stillhasfocus);
    });
    return this.parent(stillhasfocus);
  }
});

/* A modelgroup is a group of inputs that, like RecordBase, consists of multiple models, but like InputGroupBase, does not
   expose these models separately for dirty/pending etc marking */
$wh.Form.ModelGroupBase = new Class(
{ Extends: ModelRecordSharedBase
, combinestatus: true
, updateStatus: function()
  {
    var relevantstatus = null, isdirty = this.dirty;
    if(!this.isValid())
      relevantstatus = this;

    $wh.Form.processOnModels(this.node, false, function(submodel)
    {
      if(!relevantstatus && !submodel.isValid())
        relevantstatus=submodel;
      if(submodel.dirty)
        isdirty=true;
    });
    if(relevantstatus)
      relevantstatus = this;
    this.applyStatus(relevantstatus, isdirty);
  }
, setDirty:function(dirtystatus)
  {
    if(dirtystatus!==false)
      throw new Error("setDirty on records only supports 'false'");

    Array.each(this.getSubFields(), function(subfield)
    {
      subfield.model.setDirty(false);
    });
  }
});

var ModelRecordAndUnionBase = new Class(
{ Extends: ModelRecordSharedBase
, getFieldValue:function(fieldname)
  {
    var field = this.getField(fieldname);
    if(!field)
      throw new Error("No such field '" + fieldname + "' in field '" + this.getName() + "'");
    return field.getValue();
  }
, setFieldValue:function(fieldname, value, options)
  {
    var field = this.getField(fieldname);
    if(!field)
      throw new Error("No such field '" + fieldname + "' in field '" + this.getName() + "'");
    return field.setValue(value, options);
  }
, getValue: function()
  {
    var result = {};
    Array.each(this.getSubFields(), function(field)
    {
      result[field.subname] = field.model.getValue();
    });
    return result;
  }
, setValue: function(value, options)
  {
    Array.each(this.getSubFields(), function(field)
      {
        field.model.setValue(value[field.subname], options);
      });

    this.fireChangeEvents();
  }
, setApiResultOnSubfields:function(result, options)
  {
    var leftoverfields = Object.clone(result.fields);
    Array.each(this.getSubFields(), function(field)
    {
      if(field.model && leftoverfields[field.subname])
      {
        field.model.setApiResult(leftoverfields[field.subname], options);
        delete leftoverfields[field.subname];
      }
    });
    return leftoverfields;
  }
, getApiValue: function()
  {
    var basename = this.getName();
    var result = { inputname: basename
                 , fields: {}
                 };

    Array.each(this.getSubFields(), function(field)
      {
        result.fields[field.subname] = field.model.getApiValue();
      });

    return result;
  }
, getProcessableSubModels:function()
  {
//    if(!this.node.hasAttribute("data-form-flatten"))
  //    return null;

    var submodels = [];
    $wh.Form.processOnModels(this.node, false, function(model) { submodels.push(model); }, false); //grab the models without recurinsg into getProcessableSubModels
    return submodels;
  }
, setAllowFeedback:function(allowfeedback)
  {
    Array.each(this.getSubFields(), function(field)
    {
      field.model.setAllowFeedback(allowfeedback);
    });
    this.parent(allowfeedback);
  }
});

$wh.Form.RecordBase = new Class(
{ Extends: ModelRecordAndUnionBase
, rowname: null
, displayvalidity: false
, __dirtyonchange:false
, getName:function()
  {
    return this.rowname || this.parent();
  }
, setApiResult:function(result, options)
  {
    this.setApiResultOnSubfields(result, options);

    if(result.error)
    {
      this.needsrevalidation=false;
      this.setValidationStatus({error: result.error.message, subfielderror: !!result.error.subfield});
    }

    if(options.markpristine)
      this.loadPristineValue();
    this.fireChangeEvents();
  }
, getRawValue:function()
  {
    return null;
  }
, setRawValue:function(value)
  {
  }
, clear:function()
  {
    Array.each(this.getSubFields(), function(field)
    {
      field.model.clear();
    });
  }
, isPending: function()
  {
    if (this.parent() === true)
      return true;
    return Array.some(this.getSubFields(), function(field)
    {
      return field.model.isPending();
    });
  }
, getFirstNonValid:function()
  {
    if(this.isValid() !== true)
      return this;

    var brokenfield;
    Array.some(this.getSubFields(), function(field)
    {
      if(field.model.isValid() === true || !field.model.needsValidation())
        return;
      brokenfield = field.model;
      return true; // break out of some loop
    });
    return brokenfield;
  }
, runValidation:function(stillhasfocus)
  {
    Array.some(this.getSubFields(), function(field)
    {
      field.model.runValidation(stillhasfocus);
    });
    return this.parent(stillhasfocus);
  }
, isValid: function()
  {
    var validity = this.parent();
    if (validity !== true)
      return validity;

    Array.some(this.getSubFields(), function(field)
    {
      if (!field.model.needsValidation())
        return;
      validity = field.model.isValid();
      if (validity !== true)
        return true; // break out of some loop
    });
    return validity;
  }
, getTopLevelError:function()
  {
    var error = this.parent();
    if(!error)
      Array.some(this.getSubFields(), function(field)
      {
        error = field.model.getTopLevelError();
        return !!error;
      });

    return error;
  }
, focusError: function()
  {
    var anyerror = Array.some(this.getSubFields(), function(field)
    {
      if(field.model.isValid() === false)
      {
        field.model.focusError();
        return true;
      }
    });
  }
, setDirty:function(isdirty)
  {
    if(isdirty)
      throw new Error("Records may not be marked as dirty");
  }
});

$wh.Form.RecordArrayBase = new Class(
{ Extends: $wh.Form.InputGroupBase
, Binds: [ "addRowClick", "deleteRowClick"
         ]
, addid: 1
, displayvalidity: false
, initialize:function(form, node, parentmodel)
  {
    this.parent(form, node, parentmodel);

    if(!this.getName())
      console.error("A wh.recordarray requires a data-form-name");

    var rows=[];
    this.recurseFindRows(this.node, rows);
    Array.each(rows,function(row)
    {
      if(row.istemplate)
        return;

      var rowmodel = new $wh.Form.models["wh.record"](this.formhandler, row.node);
      rowmodel.rowname = row.rowbasename;
    }.bind(this));

    this.node.addEvents({ "click:relay(.addrow)": this.addRowClick
                        , "click:relay(.deleterow)": this.deleteRowClick
                        });
  }
, getSubName:function(fullname)
  {
    var basename = this.getName();
    if(fullname && fullname.substr(0,basename.length + 1) == basename + '.')
      return fullname.substr(basename.length + 1);
    return null;
  }
, recurseFindRows:function(parent, rows)
  {
    for(var node = parent.firstChild; node; node = node.nextSibling)
    {
      if(node.nodeType != 1 || typeof node.className != "string") //not a string classname. not a HTML DOM element ?
        continue;
      node=$(node);

      if(node.name == 'formsapi-retentionid')
        continue; //ignore contents of a templaterow..
      if(node.hasClass("arrayrow"))
      {
        //Find the retentionid...
        var retentionfield = getRetentionIdField(this.getName(), node);
        if(retentionfield)
        {
          var istemplate = node.hasClass("templaterow");
          rows.push({ rowretentionid: retentionfield.value
                    , node: node
                    , istemplate: istemplate
                    , rowbasename: retentionfield.name
                    , rowmodel: $wh.Form.getFieldModel(node)
                    });
        }
        continue; //got an arrayrow!
      }

      var tag = node.get("tag");
      if(tag=='input' || tag=='select' || tag=='textarea' || node.hasClass("wh-inputgroup"))
        continue; //ignore plain fields

      this.recurseFindRows(node, rows);
    }
  }
, getRows:function()
  {
    var rows=[];
    this.recurseFindRows(this.node, rows);
    return rows;
  }
, focusError: function()
  {
    Array.some(this.getRows(), function(row)
    {
      if(!row.rowmodel || row.istemplate)
        return;
      if(!row.rowmodel.isValid())
      {
        row.rowmodel.focusError();
        return true;
      }
    });
  }
, getTemplateRow:function()
  {
    return getTemplateRowFromRows(this.getRows());
  }
, clear:function()
  {
    Array.each(this.getRows(), function(row)
    {
      if(!row.rowmodel || row.istemplate)
        return;

      row.rowmodel.clear();
    });
  }
, isPending: function()
  {
    if (this.parent() === true)
      return true;
    return Array.some(this.getRows(), function(row)
    {
      return row.rowmodel && !row.istemplate && row.rowmodel.isPending();
    });
  }
, getFirstNonValid:function()
  {
    if(this.isValid() !== true)
      return this;

    var brokenfield;
    Array.some(this.getRows(), function(row)
    {
      if(!row.rowmodel || row.istemplate || row.rowmodel.isValid() === true)
        return;
      brokenfield = row.rowmodel;
      return true; // break out of some loop
    });
    return brokenfield;
  }
, runValidation:function(stillhasfocus)
  {
    Array.each(this.getRows(), function(row)
    {
      if(!row.rowmodel || row.istemplate)
        return;

      row.rowmodel.runValidation(stillhasfocus);
    });
    return this.parent(stillhasfocus);
  }
, isValid:function()
  {
    var validity = this.parent();
    if (validity !== true)
      return validity;

    Array.some(this.getRows(), function(row)
    {
      if(!row.rowmodel || row.istemplate)
        return;

      if (!row.rowmodel.needsValidation())
        return;
      validity = row.rowmodel.isValid();
      if (validity !== true)
        return true; // break out of some loop
    });

    return validity;
  }
, setAllowFeedback:function(allowfeedback)
  {
    Array.each(this.getRows(), function(row)
    {
      if(!row.rowmodel || row.istemplate)
        return;

      row.rowmodel.setAllowFeedback(allowfeedback);
    });
    this.parent(allowfeedback);
  }
, getValue: function()
  {
    var result = [];
    Array.each(this.getRows(), function(row)
      {
        if(!row.rowmodel || row.istemplate)
          return;
        result.push(row.rowmodel.getValue());
      });
    return result;
  }
, getApiValue: function()
  {
    var result = { inputname: this.getName()
                 , rows: []
                 };

    Array.each(this.getRows(), function(row)
      {
        if(!row.rowmodel || row.istemplate)
          return;

        var rowvalue = row.rowmodel.getApiValue();
        rowvalue.rowretentionid = row.rowretentionid;
        result.rows.push(rowvalue);
      });

    return result;
  }
, setValue:function(rows, options)
  {
    var currentrows = this.getRows();
    var template = getTemplateRowFromRows(currentrows);

    Array.each(rows,function(row, index)
    {
      if(currentrows[index] && !currentrows[index].istemplate)
      {
        currentrows[index].rowmodel.setValue(row, options);
        currentrows[index].seen=true;
      }
      else if(template)
      {
        this.addRow(template.node).setValue(row, options);
      }
    }.bind(this));
    this.killUnseenRows(currentrows);

    if(options&&options.markpristine)
    {
      this.loadPristineValue();
      this.setDirty(false);
    }
    this.fireChangeEvents();
  }
, getValueFromApiResult:function(result)
  {
    console.warn("Invoking function still missing in testsuite!"); //didn't get around to testing this, was actually supposed to write hiddenarray getValueFromApiResult
    var currentrows = this.getRows();
    var template = getTemplateRowFromRows(currentrows);
    var outrows = [];

    Array.each(result.rows, function(row)
    {
      outrows.push(template.rowmodel.getValueFromApiResult(row));
    });
    return outrows;
  }
, setApiResult:function(result, options)
  {
    var currentrows = this.getRows();
    var template = getTemplateRowFromRows(currentrows);

    Array.each(result.rows,function(row)
    {
      var match=false;
      for (var i=0;i<currentrows.length;++i)
        if(currentrows[i].rowmodel && currentrows[i].rowretentionid == row.rowretentionid)
        {
          currentrows[i].rowmodel.setApiResult(row, options);
          currentrows[i].seen=true;
          match=true;
          break;
        }

      if(!match && template)
      {
        this.addRow(template.node).setApiResult(row,options);
      }
    }.bind(this));

    this.killUnseenRows(currentrows);
    if(options.markpristine)
    {
      this.loadPristineValue();
      this.setDirty(false);
    }
  }
, killUnseenRows:function(currentrows)
  {
    Array.each(currentrows, function(row)
    {
      if(!row.seen && !row.istemplate)
        row.node.dispose();
    });
  }
, getRawValue:function()
  {
    return null;
  }
, setRawValue:function(value)
  {
  }
, getTopLevelError:function()
  {
    var error, rowidx=1;
    Array.some(this.getRows(), function(row)
    {
      if(!row.rowmodel || row.istemplate)
        return;
      if(row.rowmodel.getTopLevelError())
        error = Locale.get('wh-form.invalid_row', rowidx);
      ++rowidx;
      return !!error;
    });
    return error;
  }

  //row add/deletion
, addRowClick:function(event,target)
  {
    event.stop();

    var templaterow = this.getTemplateRow();
    if(!templaterow)
      return console.error("[wh.form] No template row");

    this.addRow(templaterow.node);
  }
, addRow:function(template)
  {
    var templaterow = $(template);
    if(!templaterow)
      return console.error("[wh.form] Unable to find template row ", template);

    var newrow = templaterow.cloneNode(true);
    var retentionelement = newrow.getElementsByTagName("input")[0]; //retentionid is first element
    var retid = retentionelement.getAttribute('id');
    if(!retid)
      return console.error("[wh.form] Template row retention element is missing an 'id'",retentionelement);

    var retname = retentionelement.getAttribute('name');
    if(!retname)
      return console.error("[wh.form] Template row retention element is missing a 'name'",retentionelement);

    var addid = this.addid++;
    retentionelement.value="template" + addid;

    //rename elements
    var updateels = newrow.getElementsByTagName("*");
    for(var i=0;i<updateels.length;++i)
    {
      var s = updateels[i].getAttribute('id');
      if(s && s.substr(0,retid.length) == retid)
        updateels[i].setAttribute('id', retid + addid + s.substr(retid.length));
      var s = updateels[i].getAttribute('for');
      if(s && s.substr(0,retid.length) == retid)
        updateels[i].setAttribute('for', retid + addid + s.substr(retid.length));
      var s = updateels[i].getAttribute('name');
      if(s && s.substr(0,retname.length) == retname)
        updateels[i].setAttribute('name', retname + addid + s.substr(retname.length));
      var s = updateels[i].getAttribute('data-form-name');
      if(s && s.substr(0,retname.length) == retname)
        updateels[i].setAttribute('data-form-name', retname + addid + s.substr(retname.length));
    }
    newrow.removeAttribute("id");
    newrow.removeClass("templaterow");
    templaterow.parentNode.insertBefore(newrow,templaterow);

    this.setDirty(true);
    $wh.applyReplaceableComponents(newrow);
    $wh.fireLayoutChangeEvent(this.node);
    //this.formhandler.initializeModels(newrow);

    var rowmodel = new $wh.Form.models["wh.record"](this.formhandler, newrow, this);
    rowmodel.rowname = retentionelement.name;
    return rowmodel;
  }
, deleteRowClick:function(event,target)
  {
    event.stop();
    this.deleteRow(target);
  }

, deleteRow:function(target)
  {
    var row = document.id(target);
    if(row && !row.hasClass("arrayrow"))
      row = row.getParent(".arrayrow");
    if(!row)
      return console.error("[wh.form] Unable to locate parent with .arrayrow class to delete");

    this.setDirty(true);
    row.parentNode.removeChild(row);
    row.destroy();

    $wh.fireLayoutChangeEvent(this.node);
  }
, fireChangeEvents:function()
  {

  }
});

$wh.Form.UnionBase = new Class(
{ Extends: ModelRecordAndUnionBase
, hiddenrow: {}
, savedformvalue: null
, autocleanup: false
, __dirtyonchange: false

, initialize:function(form, node, parentmodel)
  {
    this.parent(form, node, parentmodel);
    this.node.addEvents({ "click:relay(.editbutton)": this.onEditButton.bind(this)
                        , "click:relay(.deletebutton)": this.onDeleteButton.bind(this)
                        });

    //Adopt and union fields from subdialogs, if not done yet
    var namebase = this.getName() ? this.getName() + '.' : '';
    Array.each(this.node.getElements(".editbutton[data-editform]"), function(editbutton)
    {
      var formnode = $(editbutton.getAttribute("data-editform"));
      if(!formnode)
        return;

      $wh.Form.processOnFields(formnode, false, function(field)
      {
        var name = getFieldName(field);
        if(!name || this.getField(name))
          return;

        var clonenode = new Element("input", { "name": namebase + name
                                             , "type": "hidden"
                                             , "data-form-model": field.getAttribute("data-form-model")
                                             , "class": field.className
                                             });

        for(var i = 0; i < field.attributes.length; ++i)
        {
          var attrname = field.attributes[i].name;
          if(attrname.substr(0,5) == 'data-' && attrname != 'data-form-name' && attrname != 'data-form-required')
            clonenode.setAttribute(field.attributes[i].name, field.attributes[i].value);
        }

        this.node.adopt(clonenode);
        this.formhandler.initializeModel(this, clonenode)
      }.bind(this));
    }.bind(this));
  }
, afterApplyApiResult: function()
  {
    if(!this.getName())
      this.fireChangeEvents();
  }
, onEditButton:function(event, target)
  {
    event.stop();

    var editformname = target.getAttribute('data-editform');
    var editform = $wh.Form.getHandler(editformname);
    if(!editform)
      return console.error("Cannot open form '" + editformname + "'");

    editform.rebind({ getter: this.getFormInitialData.bind(this)
                    , setter: this.setFormData.bind(this, editformname)
                    });
    editform.activateForm();

    editform.fireEvent('editready', { target: editform }); // M
  }
/*, getField:function(name)
  {
    var field = this.parent(name);
    if(!field)
      field=this.getModelFor(name);
    return field;
  }*/
, onDeleteButton:function(event,target)
  {
    event.stop();
    this.setValue({});
  }
, getFieldValue:function(fieldname)
  {
    var field = this.getField(fieldname);
    if(field)
      return field.getValue();

    var model = this.getModelFor(fieldname);
    if(model)
    {
      console.error(fieldname, this.hiddenrow[fieldname])
      return model.getValueFromApiResult(this.hiddenrow[fieldname]);
    }

    throw new Error("No such field '" + fieldname + "' in field '" + this.getName() + "'");
  }
, setFieldValue:function(fieldname, value, options)
  {
    var field = this.getField(fieldname);
    if(field)
      return field.setValue(value, options);
/*
    var model = this.getModelFor(fieldname);
    if(model)
    {
      this.hiddenrow[fieldname] = model.getApiResultFromValue(value);
      console.error("translated", fieldname, value, this.hiddenrow[fieldname])
      //FIXME dirty stuff!
      return;
    }
*/
    throw new Error("No such field '" + fieldname + "' in field '" + this.getName() + "'");
  }
, getFormInitialData:function(callback)
  {
    callback(this.getApiValue());
  }
, setFormData:function(editformname, newdata, callback)
  {
    var oldvalue = this.getValue();

    this.setApiResultOnSubfields({fields:newdata}, {});
    this.setDirty(true);
    this.node.fireEvent("wh-userchange", { target: this.node
                                         , model: this
                                         , lastvalue: oldvalue
                                         , formname: editformname //add/edit form used to pass this value
                                         });
    this.fireChangeEvents();
    callback();
    //FIXME deal with 'dirty' marking if none of the integrated fields are actually dirty
  }
, getModelFor:function(name)
  {
    var model;
    Array.some(this.node.getElements(".editbutton[data-editform]"), function(editbutton)
    {
      var form = $wh.Form.getHandler(editbutton.getAttribute("data-editform"));
      if(form)
        model = form.getField(name);
      return model;
    });
    return model;
  }
, getValue:function()
  {
    var result = this.parent();
    Object.each(this.hiddenrow, function(value, key)
    {
      var model = this.getModelFor(key);
      if(model)
        result[key] = model.getValueFromApiResult(value);
    }.bind(this));
    return result;
  }
, getApiValue:function()
  {
    var result = this.parent();
    Object.append(result.fields, this.hiddenrow);
    return result;
  }
, setApiResult:function(result, options)
  {
    this.setApiResultOnSubfields(result, options);
    if(options.markpristine)
    {
      this.loadPristineValue();
      this.setDirty(false);
    }
    this.fireChangeEvents();
  }
, getProcessableSubModels:function()
  {
    var submodels = this.parent() || [];
    var modelnames = [];
    //gather modelnames
    Array.each(submodels, function(submodel) { modelnames.push(submodel.getName()); });

   //grab all submodels in forms
    Array.each(this.node.getElements(".editbutton[data-editform]"), function(editbutton)
    {
      var form = $wh.Form.getHandler(editbutton.getAttribute("data-editform"));
      if(!form)
        return;

      $wh.Form.processOnModels(form.form, false, function(model)
      {
        if(! (model.getName() in modelnames))
        {
          modelnames.push(model.getName());
          submodels.push(model);
        }
      });
    });
    return submodels;
  }
});

$wh.Form.HiddenArrayBase = new Class(
{ Extends: $wh.Form.ModelBase
, hiddenrows: []
, savedformvalue: null
, editformhandler: null
, addid: 0
, __dirtyonchange: false
, autocleanup:false

, initialize:function(form, node, parentmodel)
  {
    this.parent(form, node, parentmodel);
    this.node.addEvents({ "click:relay(.addbutton)": this.onAddButton.bind(this)
                        , "click:relay(.editbutton)": this.onEditButton.bind(this)
                        , "click:relay(.deletebutton)": this.onDeleteButton.bind(this)
                        });
  }
, getEditForm:function()
  {
    var editformname = this.node.getAttribute('data-editform');
    if(!editformname)
      return;
    var editform = $wh.Form.getHandler(editformname);
    if(!editform)
    {
      if($(editformname))
        console.error("The editform for '" + this.getName() + "' named '" + editformname + "' was not initialized (no setupHandler invoked)");
      else
        console.error("The editform for '" + this.getName() + "' named '" + editformname + "' was not found");
    }
    return editform;
  }
, getValue:function()
  {
    var rows=[];
    Array.each(this.hiddenrows, function(row)
    {
      rows.push(this.getRowValue(row))
    }.bind(this));
    return rows;
  }
, getRowValue:function(row)
  {
    var subform = this.getEditForm();
    if(!subform)
      throw new Error("No editform available for hiddenarray " + this.getName());

    var outrow = {};
    Object.each(row.fields, function(value,key)
    {
      var subfield = subform.getField(key);
      if(!subfield)
        return;

      outrow[key] = subfield.getValueFromApiResult(value);
    });
    return outrow;
  }
, getApiValue:function()
  {
    var result = { inputname: this.getName()
                 , rows: []
                 };

    Array.each(this.hiddenrows, function(row)
      {
        result.rows.push(row);
      });
    return result;
  }
, getValueFromApiResult:function(result)
  {
    return result.rows.map(this.getRowValue.bind(this));
  }
, getApiResultForRow:function(row)
  {
    var outrow = {}
    var subform = this.getEditForm();
    if(!subform)
      throw new Error("No editform available for hiddenarray " + this.getName());

    Object.each(row.fields, function(value,key)
    {
      var subfield = subform.getField(key);
      if(!subfield)
        return;

      outrow[key] = subfield.getApiResultFromValue(value);
    });
    return outrow;
  }
, getApiResultFromValue:function(value)
  {
    var rows = [];

    Array.each(rows,function(row)
    {
      var outrow = this.getApiResultForRow(row);
      rows.push(outrow);
    }.bind(this));

    return {rows:rows};
  }
, setValue:function(rows, options)
  {
    this.hiddenrows = [];
    if(rows)
      Array.each(rows,function(row)
      {
        var outrow = {fields:{}};
        Object.each(row.fields, function(value,key)
        {
          var subfield = subform.getField(key);
          if(!subfield)
            return;

          outrow.fields[key] = subfield.getApiResultFromValue(value);
        });
        this.hiddenrows.push(outrow);
      }.bind(this));
  }
, setApiResult:function(result, options)
  {
    this.hiddenrows = [];

    Array.each(result.rows,function(row)
    {
      if(row.istemplate)
        return;

      this.hiddenrows.push(row);
    }.bind(this));

    if(options.markpristine)
    {
      this.loadPristineValue();
      this.setDirty(false);
    }

    this.fireChangeEvents();
  }
, updateRowWithApi:function(rowindex, updates)
  {
    var updaterow;
    if(rowindex==-1)
    {
      updaterow = { rowretentionid: 'H' + ++this.addid
                  , fields: {}
                  };
      this.hiddenrows.push(updaterow);
    }
    else
    {
      updaterow = this.hiddenrows[rowindex];
    }

    Object.each(updates, function(value,key)
    {
      updaterow.fields[key] = value;
    });

    this.fireChangeEvents();
    this.setDirty(true);
  }
, onAddButton:function(event, target)
  {
    event.stop();
    this.addRow();
  }
, onEditButton:function(event, target)
  {
    event.stop();
    //ADDME allow custom row indices, via attribute on self or parent
    var rowindex = this.node.getElements(".editbutton").indexOf(target);
    if(rowindex == -1)
      throw new Error("The editbutton cannot determine its rowindex");
    this.editRow(rowindex);
  }
, onDeleteButton:function(event, target)
  {
    event.stop();
    //ADDME allow custom row indices, via attribute on self or parent
    var rowindex = this.node.getElements(".deletebutton").indexOf(target);
    if(rowindex == -1)
      throw new Error("The deletebutton cannot determine its rowindex");

    var deleteq = this.node.getAttribute('data-deletequestion');
    if(deleteq)
    {
      if($wh.Popup.Dialog)
      {
        new $wh.Popup.Dialog( { text: deleteq
                              , buttons: [ { title: Locale.get('wh-common.buttons.yes'), result: 'yes' }
                                         , { title: Locale.get('wh-common.buttons.no'),  result: 'cancel' }
                                         ]
                              , onResultyes: this.deleteRow.bind(this,rowindex)
                              });
        return;
      }
      else if(!confirm(deleteq))
        return;
    }

    this.deleteRow(rowindex);
  }
, addRow:function()
  {
    this.doModifyRow(-1);
  }
, editRow:function(rowindex)
  {
    if(rowindex < 0 || rowindex >= this.getLength)
      return;
    this.doModifyRow(rowindex);
  }
, deleteRow:function(rowindex)
  {
    this.hiddenrows.splice(rowindex,1);
    this.fireChangeEvents();
    this.setDirty(true);
  }
, doModifyRow:function(rowindex)
  {
    var editform = this.getEditForm();
    if(!editform)
      return;
    if(!this.savedformvalue)
      this.savedformvalue = editform.getData();
    else if(rowindex==-1)
      editform.setData(this.savedformvalue, { markpristine:true });

    editform.bindToArrayRow(this, rowindex, { markpristine:true });
    editform.activateForm();
  }
});

$wh.Form.models["wh.record"] = $wh.Form.RecordBase;
$wh.Form.models["wh.union"] = $wh.Form.UnionBase;
$wh.Form.models["wh.recordarray"] = $wh.Form.RecordArrayBase;
$wh.Form.models["wh.hiddenarray"] = $wh.Form.HiddenArrayBase;

})(document.id); //end mootools wrapper
