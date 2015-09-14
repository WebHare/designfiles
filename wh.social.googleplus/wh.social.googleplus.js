/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
/*! REQUIRE: frameworks.mootools.core, wh.compat.base
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

/* To create a button:
   https://developers.google.com/+/plugins/+1button/?hl=nl
  <div class="g-plusone" data-size="tall" ... ></div>
*/
$(document).addEvent("cookiespermitted", function()
{
  if($$('div.g-plusone').length)
  {
    /* Do:
        function() {    var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
       po.src = 'https://apis.google.com/js/plusone.js';
      var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
    */
    var googleplusscript = new Element('script', { src:"https://apis.google.com/js/plusone.js"
                                                 , async:true
                                                 });
    $$('head').pick().adopt(googleplusscript);
  }
});

})(document.id); //end mootools wrapper
