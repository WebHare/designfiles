/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
/*! REQUIRE: frameworks.mootools.core, wh.compat.base
!*/

/*
NOTES:
- the specified container must created a new positioning context (so use position: relative or absolute)
- also refresh imagestrips in onload, because we don't track loading images yet

ADDME:
- % gutter
- FIXME: round pixels (and keep pixelratio into account). needed if we want to hw accellated animate items.
- FIXME: improve performance by caching image sizes?
- ADDME: option to also equalize the height of images? (which means a part of the top and bottom might have to be cut off)
*/


(function($) { //mootools wrapper

if(!window.$wh) window.$wh={};

$wh.ImageStrip = new Class(
{ Implements: [ Options ] //, Events ]
, options:
      { gutter: 20
      , debug:  false
      }

, container:     null

, initialize: function(container, options)
  {
    this.setOptions(options);
    this.container = $(container);
    if (!this.container)
      console.error("container for $wh.ImageStrip cannot be found");
    else
      this.refresh();
  }

, refresh: function()
  {
    if (this.options.debug)
      console.group("$wh.imageStrip refresh()");

    var container = this.container;

    if (!container.__init)
    {
      container.addClass("wh-layoutlistener");
      container.addEvent("wh-layoutchange", this.onLayoutChange.bind(this, container) );
      container.__init = true;
    }

    var images = container.getElements("img");
    var imgdata = [];
    var totalwidth = 0;
    var availablewidth = container.clientWidth;
    var maxheight = 0;

    for (var idx = 0; idx < images.length; idx++)
    {
      var image = images[idx];
      var imgwidth = image.naturalWidth || image.width;
      var imgheight = image.naturalHeight || image.height;

      if (!image.naturalWidth && image.width > 0)
        image.naturalWidth = image.width;

      if (!image.naturalHeight && image.height > 0)
        image.naturalHeight = image.height;

      if (this.options.debug)
        console.log(imgwidth, imgheight, image.getAttribute("alt"), image.style.cssText);

      totalwidth += imgwidth;

      if (imgheight > maxheight)
        maxheight = imgheight;

      imgdata.push({ node:  image
                   , width: imgwidth
                   });
    }

    availablewidth -= (images.length - 1) * this.options.gutter; // absolute amount of pixels

    var scaleratio = availablewidth / totalwidth;

    container.style.position = "relative";
    container.style.height = Math.ceil(maxheight * scaleratio) + "px";

    var left = 0;
    for (var idx = 0; idx < images.length; idx++)
    {
      var imagerec = imgdata[idx];

      var applywidth = Math.round(imagerec.width * scaleratio);
      imagerec.node.style.position = "absolute";
      imagerec.node.style.left = left + "px";

      if (applywidth > 0) // image probably not loaded yet
        imagerec.node.style.width = applywidth + "px";

      left += applywidth + this.options.gutter;
    }

    if (this.options.debug)
    {
      console.log("Total width", totalwidth);
      console.groupEnd("$wh.imageStrip refresh()");
    }
  }

, onLayoutChange: function(container, evt)
  {
    this.refresh();
  }
});




function setupImageStrip(node)
{
  console.info(node);

  if(!node.retrieve("wh-imagestrip"))
  {
    var optionsjson = node.getAttribute("data-imagestrip-options");
    if (!optionsjson)
    {
      console.warn("No options specified for wh-imagestrip.");
      return;
    }

    var opts = JSON.parse(optionsjson);
    node.store("wh-imagestrip", new $wh.ImageStrip(node, opts));
  }
}

function initializeImageStrips()
{
  $wh.setupReplaceableComponents(".wh-imagestrip", setupImageStrip);
}

window.addEvent("domready", initializeImageStrips);
// ADDME: handle onload automatically??

})(document.id); //end mootools wrapper
