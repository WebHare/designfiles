/* generated from Designfiles Public by generate_data_designfles */
require ('wh.google.maps');
/*! REQUIRE: wh.google.maps !*/

window.addEvent("domready", function()
{
  var mainnode = $$('script[src*="googlemaps-tolliumskin.js"], #wh-designfiles-combined, #wh-designfiles-combined-js').pick();
  if(!mainnode)
    return;

  var skinurl = mainnode.getAttribute(mainnode.tagName=='LINK'?'href':'src');
  var urlparts= skinurl.split('?')[0].split('/');
  var skinbase = urlparts.slice(0,urlparts.length-1).join('/')+'/';

  function getImageUrl(imgname)
  {
    return skinbase + imgname + '.png';
  }

  $wh.GoogleMap.registerSkin('wh:tollium', getImageUrl);
});
