/* generated from Designfiles Public by generate_data_designfles */
require ('wh.form.model.base');
/*! LOAD: wh.form.model.base !*/
/* plugin to support Dutch address fields */


// FIXME: readOnly

(function($) {

$wh.Form.NLAddress = { lookup: null
                     , validations: []
                     };

$wh.Form.models["wh.nladdress.nr_detail"] = new Class(
{ Extends: $wh.Form.InputFieldBase
, isRequired:function()
  {
    return this.parent() || (this.parentmodel && this.parentmodel.isRequired());
  }
, validate:function(value)
  {
    var parent_is_nladdress = this.parentmodel && (this.parentmodel instanceof $wh.Form.models["wh.nladdress"]);
    if (!parent_is_nladdress || (parent_is_nladdress && this.parentmodel.isNL()))
    {
      if (!(parseInt(this.getValue()) > 0))
        return { error: Locale.get('wh-form.invalid_housenumber') };
    }

    if (parent_is_nladdress)
      this.parentmodel.validateAddress(false);

    return null;
  }
});

$wh.Form.models["wh.nladdress.zip"] = new Class(
{ Extends: $wh.Form.InputFieldBase
, isRequired:function()
  {
    return this.parent() || (this.parentmodel && this.parentmodel.isRequired());
  }
, cleanup:function(value)
  {
    var parent_is_nladdress = this.parentmodel && (this.parentmodel instanceof $wh.Form.models["wh.nladdress"]);
    if(parent_is_nladdress && !this.parentmodel.isNL())
      return value;
    return this.fixupZipCode(value) || value; //return fixed version, or original value
  }
, validate:function(value)
  {
    var parent_is_nladdress = this.parentmodel && (this.parentmodel instanceof $wh.Form.models["wh.nladdress"]);
    if ((!parent_is_nladdress || (parent_is_nladdress && this.parentmodel.isNL())) && !this.fixupZipCode(value))
      return { error: Locale.get('wh-form.invalid_zip') };

    if (parent_is_nladdress)
      this.parentmodel.validateAddress(true);

    return null;
  }
, fixupZipCode:function(zipcode)
  {
    //does it even look like a dutch zip code?
    zipcode = zipcode.toUpperCase().replace(/[^0-9A-Z]/g,''); //kill weird text
    //split into: 4 digits (first one 1-9, rest 0-9) and 2 A-Z chars
    var split = zipcode.match(/([1-9][0-9]{3})([A-Z]{2})/);
    if(!split)
      return null;
    return split[1] + " " + split[2];
  }
});

$wh.Form.models["wh.nladdress"] = new Class(
{ Extends: $wh.Form.RecordBase
, models: {}
, service: null
, lastnl: null

, initialize:function(form, node, parentmodel)
  {
    this.parent(form, node, parentmodel);
    //var opts = $wh.getJSONAttribute(node, 'data-nladdress-options');

    Array.each(['street','zip','nr_detail','city'], function(fieldname)
    {
      var field = this.getField(fieldname);
      if(!field)
        return console.error("nl.address cannot find subfield '" + fieldname + "'");
      this.models[fieldname]=field;
    }.bind(this));

    var countryfield = this.getField('country');
    if(countryfield)
    {
      this.models.country = countryfield;
      countryfield.node.addEvent("change", this.onCountryChange.bind(this));
    }
    this.checkControls();
  }
, suggestModel:function(name, field)
  {
    if(name=='zip')
      return $wh.Form.models["wh.nladdress.zip"];
    if(name=='nr_detail')
      return $wh.Form.models["wh.nladdress.nr_detail"];
    return this.parent(name,field);
  }
, onCountryChange:function()
  {
    this.checkControls();

    //clean up status of empty fields
    Array.each(['street','zip','nr_detail','city'], function(field)
    {
      if(this.models[field].isSet())
        this.models[field].runValidation();
      else
        this.models[field].clear();
    }.bind(this));
  }
, isSet:function()
  {
    if(this.isNL())
      return this.models.zip.isSet() && this.models.nr_detail.isSet();
    return this.parent();
  }
, isNL:function()
  {
    if(!this.models.country)
      return true; //assume NL if there is no country field
    var val = this.models.country.getValue();
    return val ? val.toUpperCase()=='NL' : false;
  }
, checkControls:function()
  {
    var isnl = this.isNL();
    if(this.lastnl !== isnl)
    {
      this.models.street.node.readOnly = !!isnl;
      this.models.street.node.required = !isnl;
      this.models.street.node.tabIndex = isnl ? -1 : 0;

      if(this.lastnl != null) //already changed once
        this.models.street.setRawValue('');
      this.models.city.node.readOnly = !!isnl;
      this.models.city.node.required = !isnl;
      this.models.city.node.tabIndex = isnl ? -1 : 0;

      if(this.lastnl != null) //already changed once
        this.models.city.setRawValue('');

      this.models.street.setAllowFeedback(false);
      this.models.city.setAllowFeedback(false);

      //this.models.street.needsrevalidation = true;
      //this.models.city.needsrevalidation = true;
    }
    this.lastnl = isnl;
  }
, validateAddress:function(from_zip)
  {
    this.checkControls(); //make sure that enabled/disabled are proper after revalidate...
    if(!this.isSet() || this.models[from_zip ? "nr_detail" : "zip"].isValid() === false || !this.isNL())
      return;

    var nronlypart = '' + parseInt(this.models.nr_detail.getValue()); //remove suffixes such as 'A' or '-6'
    var zip = this.models.zip.getValue();
    //this.models.city.clear();
    //this.models.street.clear();

    var cachedresult = $wh.Form.NLAddress.validations[zip + "|" + nronlypart];
    if(cachedresult)
    {
      if(this.formhandler.options.debugvalidation)
        console.log("[wh.nladdress] Getting cached validation result for " + zip + " " + nronlypart);
      this.applyLookup(cachedresult);
      return;
    }
    if(this.formhandler.options.debugvalidation)
      console.log("[wh.nladdress] Starting pending validation for " + zip + " " + nronlypart);
    this.setValidationStatus({ callback: this.startLookup.bind(this, zip, nronlypart) });
  }
, startLookup:function(zip, nr, callback)
  {
    if($wh.Form.NLAddress.validations[zip + "|" + nr]) //we may have it by now..
    {
      this.applyLookup($wh.Form.NLAddress.validations[zip + "|" + nr]);
      callback();
      return;
    }
    if(!$wh.Form.NLAddress.lookup)
    {
      callback({ error: 'Internal error: $wh.Form.NLAddress.lookup has not been defined' });
      return;
    }
    if(typeof $wh.Form.NLAddress.lookup == 'function')
    {
      if(this.formhandler.options.debugvalidation)
        console.log("[wh.nladdress] Requesting validation for " + zip + " " + nr + " using function call");

      $wh.Form.NLAddress.lookup(zip, nr, this.processLookupResult.bind(this, zip, nr, callback));
      return;
    }
    if($wh.Form.NLAddress.lookup.type=="jsonrpc")
    {
      if(!$wh.JSONRPC)
      {
        callback({ error: 'Internal error: wh.net.jsonrpc not loaded ($wh.JSONRPC not present)' });
        return;
      }

      if(!this.service)
        this.service = new $wh.JSONRPC( { url: $wh.Form.NLAddress.lookup.rpcservice });
      else
        this.service.stopCurrentRequest();

      if(this.formhandler.options.debugvalidation)
        console.log("[wh.nladdress] Requesting validation for " + zip + " " + nr + " using RPC");

      this.service.request($wh.Form.NLAddress.lookup.rpccall, [zip, nr], this.processLookupResult.bind(this, zip, nr, callback));
      return;
    }
    callback({ error: 'Internal error: $wh.nlAddressLookup incorrectly set up' });
  }
, processLookupResult:function(zip, nr, cb, result)
  {
    $wh.Form.NLAddress.validations[zip + "|" + nr] = result;
    this.applyLookup(result);
    cb();
  }
, applyLookup:function(result)
  {
    if(this.formhandler.options.debugvalidation)
      console.log("[wh.nladdress] Applying validation result", result);
    this.needsrevalidation = true;

    var success = result && result.success && result.street && result.city;
    if(!success)
      this.models.nr_detail.setValidationStatus({ error: Locale.get('wh-form.invalid_ziphousenumber') || "Invalid zip/housenumber" });

    this.models.street.setRawValue(success ? result.street : '');
    this.models.street.runValidation();
    this.models.city.setRawValue(success ? result.city : '');
    this.models.city.runValidation();
  }
});

})(document.id);
