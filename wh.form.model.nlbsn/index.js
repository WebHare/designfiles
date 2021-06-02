/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.form.model.base');
/*! LOAD: wh.form.model.base !*/

(function($) {

function checkBSN(bsn)
{
  bsn=''+bsn;
  if(bsn.length!=9 || !(parseInt(bsn,10) > 1000000))
    return false;

  var check= 9*parseInt(bsn[0]) + 8*parseInt(bsn[1]) + 7*parseInt(bsn[2])
           + 6*parseInt(bsn[3]) + 5*parseInt(bsn[4]) + 4*parseInt(bsn[5])
           + 3*parseInt(bsn[6]) + 2*parseInt(bsn[7]) - 1*parseInt(bsn[8]);
  return (check%11)==0;
}
function generateBSN()
{
  //sofinummers lopen vanaf 00100000x t/m 39999999x
  var basesofi = Math.floor(Math.random() * (399999900-1000000) + 1000000);
  while(true)
  {
    var propersofi = ('00000000' + basesofi).slice(-9);
    if(checkBSN(propersofi))
      return propersofi;
    ++basesofi;
  }
}
function setPrevInputBSN(event)
{
  event.stop();
  $wh.Form.getFieldModel(this.getPrevious('input')).setRawValue(generateBSN());
}

$wh.Form.models["wh.nlbsn"] = new Class(
{ Extends: $wh.Form.InputFieldBase
, initialize:function(formhandler, node)
  {
    this.parent(formhandler,node);
    if(node.getAttribute('data-bsn-randombutton') == '1')
    {
      var randombutton = new Element("button", {"class": "wh-form-nlbsn-random"
                                               ,"tabindex": -1
                                               ,"type":"button"
                                               ,"text":"Random"
                                               ,"events": {"click": setPrevInputBSN }
                                               });
      randombutton.inject(node,'after');
    }
  }
, cleanup: function(value)
  {
    //strip any non-numeric chars, pad with zeroes until required length
    return value.trim() ? ('00000000' + value.replace(/[^0-9]/g,'')).slice(-9) : '';
  }
, validate:function(value)
  {
    if(!checkBSN(value))
      return {error:'Controleer uw BSN'};
    return null; //no further validation
  }
});
})(document.id);
