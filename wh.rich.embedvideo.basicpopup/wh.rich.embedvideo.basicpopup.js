/* generated from Designfiles Public by generate_data_designfles */
require ('wh.rich.embedvideo');
require ('wh.ui.popup');
require ('wh.form');
/*! LOAD: wh.rich.embedvideo, wh.ui.popup, wh.form !*/

//Create a _very_ basic embedvideopopup.

(function($) { //mootools wrapper

function createVideoPopup()
{
  if($('wh-rtd-embedvideopopup'))
  {
    console.error("wh.rich.embedvideo.basicpopup was loaded, but the document already contains a #wh-rtd-embedvideopopup");
    return;
  }

  //ADDME let the popup read locale on rendering, and replace texts where possible/needed
  var popup = new Element("div", { id: "wh-rtd-embedvideopopup"
                                 , "class": "wh-popup"
                                 });
  var popupform = new Element("form", {"class":"wh-form"
                                      ,"method":"post"
                                      }).inject(popup);


  //ADDME even without locale, nicer texts...
  popupform.adopt(new Element("p", { text: Locale.get("wh-common.videpopup.insertcode") || "Insert code"
                                   }));
  popupform.adopt(new Element("p").adopt(new Element("textarea", { name: "videocode", required: "required" })));
  popupform.adopt(new Element("p").adopt(new Element("button", {"type":"submit","text":Locale.get("wh-common.videpopup.submitcode") || "Submit video"})));

  document.body.adopt(popup);
}

function initVideoPopupForm()
{
  var form = $('wh-rtd-embedvideopopup').getElement("form");
  if(!$wh.Form.getHandler(form))
    $wh.Form.setupHandler(form);
}

window.addEvent("domready", createVideoPopup);
window.addEvent("wh-after-domready", initVideoPopupForm);

})(document.id); //end mootools wrapper
