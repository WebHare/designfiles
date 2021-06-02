/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! LOAD: frameworks.mootools, wh.compat.base !*/

if(!window.$wh) window.$wh={};

(function($) { //mootools wrapper
"use strict";

var wh_ga_code;

if(!window.dataLayer)
  window.dataLayer = [];

$wh.gtm_formbuttonworkaround = true;

function setupGTM()
{
  //set up fallback code to fix buttons in forms, this works around GTM plugins messing with the form submission and destroying information about the actually submitted button
  $$('input[type="submit"], button[type="submit"]').addEvent("click",
    function(event)
      {
        if(!$wh.gtm_formbuttonworkaround)
          return;

        var form = this.getParent("form");
        if(!form)
          return;
        if(form.retrieve("gtm-workaround-tempbutton"))
          form.retrieve("gtm-workaround-tempbutton").dispose();

        var tempnode = new Element("input", { type: "hidden"
                                            , name: this.name
                                            , value: this.value
                                            });
        form.adopt(tempnode);
        form.store("gtm-workaround-tempbutton", tempnode);
      });
}


function watchDatalayer()
{
  for(;watchDatalayer.seen < window.dataLayer.length;++watchDatalayer.seen)
    console.log("[anl] dataLayer.push:", window.dataLayer[watchDatalayer.seen]);
}
watchDatalayer.seen = 0;

function initializeAnalytics()
{
  wh_ga_code = $wh.config["socialite:analytics"].code;

  if($wh.debug.anl)
  {
    console.log("[anl] GTM Analytics activated: code = " + wh_ga_code);
    window.setInterval(watchDatalayer,50);
  }
  setupGTM();
}

function trackGTM(category,action,label,options)
{
  var obj = Object.merge(options || {}, { category:category, event:'wh.' + action, label:label });
  if(obj.callback)
  {
    obj.eventCallback = obj.callback;
    obj.callback = null;
  }
  window.dataLayer.push(obj);
}

$wh.setDefaultTracker(trackGTM);

window.addEvent("domready", initializeAnalytics);

})(document.id); //end mootools wrapper
