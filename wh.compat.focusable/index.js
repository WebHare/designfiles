/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
/*! LOAD: frameworks.mootools !*/

if(!window.$wh) window.$wh={};

(function($) { //mootools wrapper

/* IE FOCUS FIX - IE allows <divs> and some other elements to receive focus, if directly clicked.
   Debugged it using:

  ( function() { if(document.activeElement) ($$('.wh-menubar')[0] || $$('#demo h1')[0]).set('text', (document.activeElement.outerHTML || document.activeElement.innerHTML).substr(0,100));}).periodical(100);

*/
if(Browser.name=="ie")
{
  window.addEvent("domready",function()
  {
    window.addEventListener("focus", function(event)
    {
      for(var settarget = event.target; settarget && !$wh.isFocusableComponent(settarget); settarget=settarget.parentNode)
        ; //iterate until we find a target

      if(settarget && settarget != event.target && !settarget.isContentEditable)
        settarget.focus();
    },true);
  });
}

})(document.id); //end mootools wrapper
