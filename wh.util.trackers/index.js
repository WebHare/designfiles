/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.compat.base');
/*! LOAD: wh.compat.base !*/

(function($) { //mootools wrapper
"use strict";

var curscrollpos;

function handleClick(event)
{
  if(event.event.isDefaultPrevented && event.event.isDefaultPrevented()) //the navigation has been prevented
    return;
  if($wh.config["socialite:analytics"] && !$wh.config["socialite:analytics"].tracklinks)
    return;

  //Did we hit an <a> ? (addme catch other link elements)
  var ahref = event.target.getSelfOrParent('a[href]');
  if(!ahref || ahref.href.match(/^javascript:/i))
    return;

  if(ahref.href.match(/^(http|https)\:/i))
  {
    var desthost = ahref.href.split('/')[2];
    if(desthost)
      desthost=desthost.split(':')[0];

    if(desthost == location.host) //ADDME: proper host:protocol support, allow ignoring cross-domain links if requested
      return; //same host, don't bother

    var link = ahref.href;
    var target = ahref.target ? ahref.target.toLowerCase() : ''
    var isexit = ['','_self','_parent','_top'].contains(target);
    if(isexit)
    {
      var destloc = target=='_parent' ? window.parent.location : target=='_top' ? window.top.location : window.location;
      $wh.track('link','exit', ahref.href, { callback: function() { destloc.href = ahref.href } });
      event.stop();
      return;
    }
  }
  $wh.track('link','open', ahref.href);
}

function trackError(event)
{
  $wh.track('error', event.type, event.referrer, { href: location.href, code: event.code, nonInteractive: true } );
}
function prepareEvents()
{
  window.addEvent("wh-error", trackError);
  if(window.__wh_errorinfo && window.__wh_errorinfo.code==404)
    (function() { window.fireEvent("wh-error", { type: 'notfound', code: 404, referrer: document.referrer, href: location.href }) }).delay(1); //allow other domreadys to register for this event
//  startScrollTrack.delay(500); //after 500ms (Enough time for anchor jumps? ) we'll start the scroll tracker
}

window.addEvent("click", handleClick); //this puts us behind any $wh.setNewWindowLinks, so we can read updated targets
window.addEvent('domready', prepareEvents);

})(document.id); //end mootools wrapper
