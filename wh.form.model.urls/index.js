/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.form.model.base');
/*! LOAD: wh.form.model.base
!*/

(function($) {

$wh.Form.models["wh.httpurl"] = new Class(
{ Extends: $wh.Form.InputFieldBase
, initialize: function(formhandler, node, parentmodel)
  {
    this.parent(formhandler, node, parentmodel);
  }
, validate:function()
  {
    var error = this.parent();
    if (!error)
    {
      if (!$wh.isValidHTTPURL(this.getValue()))
        error = { error: Locale.get('wh-form.invalid_url') };
    }
    return error;
  }
});

})(document.id);
