/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! REQUIRE: frameworks.mootools, wh.compat.base !*/

/****************************************************************************************************************************
 * Cropped image
 */

/* A cropped image, using CSS crop when available, or clipping through a parent element otherwise. */
$wh.CroppedImage = new Class(
{ Implements: [ Options ]

/* Initialization */

, options: { src: ""    // Image src url
           , width: 0   // Cropped image width
           , height: 0  // Cropped image height
           , imgwidth: 0 // Full image width
           , imgheight: 0 // Full image height
           , top: 0     // Top reference point
           , left: 0    // Left reference point
           , styles: {} // Additional CSS styles to apply
           , node: null // Use as parent node
           }

, initialize: function(options)
  {
    this.setOptions(options);

    // Check for CSS crop support
    if (typeOf($wh.CroppedImage.csscropsupport) == "null")
    {
      var div = document.createElement("div");
      $wh.CroppedImage.csscropsupport = "crop" in div.style || "WebkitCrop" in div.style || "MozCrop" in div.style;
    }

    this.buildNode();
  }

/* Public API */

, setCrop: function(options)
  {
    this.setOptions(options);
    this.updateCropStyle();
  }

/* DOM */

, buildNode: function()
  {
    if ($wh.CroppedImage.csscropsupport && !this.options.node)
    {
      this.node = new Element("img", { src: this.options.src
                                     , styles: { border: "none" }
                                     });
    }
    else
    {
      this.node = this.options.node ? this.options.node : new Element("div");
      this.node.style.cssText = "display: inline-block; zoom: 1; *display: inline"; // "inline-block" workaround for IE7
      this.node.setStyles({ position: "relative"
                          , overflow: "hidden"
                          , "vertical-align": "baseline"
                          });
      new Element("img", { src: this.options.src
                         , width: this.options.imgwidth
                         , height: this.options.imgheight
                         , styles: { position: "absolute"
                                   , border: "none"
                                   }
                         }).inject(this.node);
    }
    this.updateCropStyle();
    this.node.setStyles(this.options.styles);
  }

, updateCropStyle: function()
  {
    if (!this.options.width && !this.options.height)
      return;

    if ($wh.CroppedImage.csscropsupport && !this.options.node)
    {
      var rect = "rect(" + this.options.top + "px, " + (this.options.left + this.options.width) + "px, " + (this.options.top + this.options.height) + "px, " + this.options.left + "px)";
      this.node.setStyles({ "crop": rect
                          , "WebkitCrop": rect
                          , "MozCrop": rect
                          });
    }
    else
    {
      this.node.setStyles({ width: this.options.width
                          , height: this.options.height
                          });
      this.node.firstChild.setStyles({ top: -this.options.top
                                     , left: -this.options.left
                                     });
    }
  }

, toElement: function()
  {
    return this.node;
  }
});

// Check if the browser has CSS crop support
$wh.CroppedImage.csscropsupport = null;
