/* generated from Designfiles Public by generate_data_designfles */
require ('wh.rich.editor');
/*! LOAD: wh.rich.editor !*/

/* Add an 'embed video' dialog

   To permit other dialogs in the future without causing an implicit dependency on wh.ui.popup that would then be
   removed, we simply won't load wh.ui.popup*/

(function($) { //mootools wrapper

function onRTDAction(event)
{
  if(event.detail.action != "object-video")
    return;

  event.stop();

  var videopopup = $('wh-rtd-embedvideopopup');
  if(!videopopup || !videopopup.hasClass("wh-popup"))
    throw new Error("wh.rich.embedvideo requires a #wh-rtd-embedvideopopup.wh-popup");

  var edittoken = $wh.RTE.getEditToken(event.target);
  if(!edittoken)
    throw new Error("A RTE must have an edittoken to support video embedding");

  videopopup.store("wh-rtd-activatedby", edittoken); //store the token to avoid keeping a reference to the RTE

  var form = videopopup.getElement("form");
  if(form)
  {
    form.removeEvent("submit", handleVideoPopupSubmit); //kill if it's there
    form.addEvent("submit", handleVideoPopupSubmit);
    form.reset();
  }

  $wh.Popup.createFromElement(videopopup);
}

function handleVideoPopupSubmit(event)
{
  event.stop();
  var myinput = event.target.getElement("*[name='videocode']");
  if(!myinput)
    throw new Error("The wh-rtd-embedvideopopup has no elemented named 'videocode'");

  $wh.RTE.updateVideo($('wh-rtd-embedvideopopup').retrieve("wh-rtd-activatedby"), null, myinput.value
                     , function()
                       {
                         $wh.Popup.closeTop(); //ADDME make sure we kill the RIGHT popup...
                       }
                     , function()
                       {
                         var formhandler;

                         if($wh.Form)
                           formhandler = $wh.Form.getHandler(event.target.getElement("form"))
                         if(formhandler)
                           formhandler.failSubmission([ {name: 'videocode', error: Locale.get('wh-common.form.invalid_videocode') || "invalid videocode"} ]);
                         else
                           myinput.set('value','');
                        }
                     );
}

document.addEvent("wh-rtd-action", onRTDAction);

})(document.id); //end mootools wrapper
