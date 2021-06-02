/* generated from Designfiles Public by generate_data_designfles */
require ('.././page.css');
require ('../frameworks.mootools');
require ('../wh.compat.base');
require ('../wh.ui.mediaviewer');
require ('../wh.ui.mediaviewer.style.default');
/*! LOAD: frameworks.mootools, wh.compat.base
    LOAD: wh.ui.mediaviewer, wh.ui.mediaviewer.style.default
!*/


var settings =
  { eventphotos: { slideduration: 1000
                 , delay:         4000
                 }
  };



(function($) { //mootools/scope wrapper

function page_init()
{
  new $wh.MediaViewer($("mediaviewer_slideshow"),
               { slideshow_container: $("mediaviewer_slideshow")
               , browser_container:   $("mediaviewer_selector")
               , resizemethod:        "cover"

               , mediaselector_options:
                       { browsebutton_behaviour: "item_browse"
                       }

               , slideshow_options:
                       { method:        "slide-horizontal" // "fade-in"
                       , delay:         5000
                       , slideduration:  350
                       , slidewidth:     320
                       , slideheight:    200
                       }
               });
}

window.addEvent("domready", page_init);

})(document.id); //end mootools/scope wrapper
