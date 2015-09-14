/* generated from Designfiles Public by generate_data_designfles */
/*!
!*/

/*
Extra 'CSS' properties offered through this library:

wh-opacity

wh-gradientmask (EXPERIMENTAL !)
- when using this property Safari will only show non-overflowing content,
  so absolute positioned content may be cut off (since they don't stretch their container)

wh-blur (EXPERIMENTAL !)
- Firefox will cut off the blur in the overflowing area
- Safari will blur outside the edges of the element

NOTE: only the animator implements wh-scale and wh-rotate, then cannot be set using setStyle()


FIXME:
- svg version of gradientmask handles all angles, but doesn't update the angle
*/

//

(function($) { //mootools wrapper

var old_getstyle = Element.prototype.getStyle;
var old_setstyle = Element.prototype.setStyle;

(function ()
{
  Element.implement(
  { getStyle: function(property)
    {
      if(property=='-wh-blur' || property=='wh-blur')
      {
        var blurvalue = this.retrieve("wh-blur-value") || this.retrieve("-wh-blur-value");
        return blurvalue ? blurvalue : 0;
      }

      return old_getstyle.apply(this,arguments);
    }

  , setStyle: function(property, value)
    {
      if(property=='-wh-blur' || property=='wh-blur')
      {
        // FIXME: test which browsers work
        var canuse_webkit_blur =
            (  (Browser.safari && Browser.version >= 6)
            || (Browser.chrome && Browser.version >= 18)
            );

        // FIXME: test which browsers work
        var canuse_svg_blur =
               (Browser.ie && Browser.version >= 9)
            || (Browser.firefox && Browser.version >= 3);

        var propvalues = Fx.CSS.prototype.parse(value);
        var radius = propvalues[0].value.toFixed(3);

        var prevblurradius = this.retrieve("-wh-blur-value") || this.retrieve("wh-blur-value");
        this.store("-wh-blur-value", radius);
        this.store("wh-blur-value", radius);

        //console.error( "blur("+ pval[0].value.toFixed(3) +"px)" );
        if(canuse_webkit_blur)
        {
          //console.log("Blur radius ", "blur("+ radius +"px)");
          this.setStyle("webkitFilter", "blur("+ radius +"px)");
          //return old_setstyle.apply(this,["webkitMaskImage",cssvalue]);
        }
        else if (canuse_svg_blur)
        {
          var svgnodes = this.retrieve("-wh-effects-svg") || this.retrieve("wh-effects-svg");

          if (!svgnodes)
          {
            var svgNS = "http://www.w3.org/2000/svg";

            var vecobj = document.createElementNS(svgNS, "svg");
            vecobj.setAttribute("height", 0);

            svgnodes = { svgnode: vecobj }

            //vecobj.appendChild(mask);
            document.body.adopt(vecobj);
          }

          if (!svgnodes.filter_blur)
          {
            // FIXME: nicer way to generate unique id's or to store the counter
            if (!window.filterid)
              window.filterid = 1;
            else
              window.filterid++;

            var filterelementid = "svgfilter_"+filterid;

            var filternode = document.createElementNS(svgNS, "filter");
            filternode.setAttribute("id", filterelementid);
            filternode.setAttribute("x", "0");
            filternode.setAttribute("y", "0");
            filternode.setAttribute("width", "100%");
            filternode.setAttribute("height", "100%");

            /* <feGaussianBlur in="SourceGraphic" stdDeviation="'+this.options.background_blur_radius+'"/> */
            var filter_blur = document.createElementNS(svgNS, "feGaussianBlur");
            filter_blur.setAttribute("in", "SourceGraphic");
            filter_blur.setAttribute("stdDeviation", radius);
            filternode.appendChild(filter_blur);

            svgnodes.svgnode.appendChild(filternode);

            svgnodes.filternode = filternode;
            svgnodes.filter_blur = filter_blur;

            this.setStyle("filter", 'url("#'+filterelementid+'")');
          }
          else
          {
            //console.log(radius);
            svgnodes.filter_blur.setAttribute("stdDeviation", radius);

            /*
            if (radius > 0)
            {
              svgnodes.filter_blur.setAttribute("stdDeviation", radius);

              // reactivate filter?
              if (prevblurradius <= 0)
              {
                var filterelementid = this.retrieve("-wh-effects-svg").id;
                console.log(filterelementid);
                this.setStyle("filter", 'url("#'+filterelementid+'")');
                svgnodes.filternode.appendChild(svgnodes.filter_blur); // remove the <feGaussianBlur>
              }
            }
            else
            {
              console.log(svgnodes.filter_blur, "removed");
              svgnodes.filternode.removeChild(svgnodes.filter_blur); // remove the <feGaussianBlur>
              this.setStyle("filter", ''); // FIXME: this kills other effects too
            }
            */
          }
        }
        else if (Browser.ie && Browser.ie < 10)
        {
          this.setStyle("filter","progid:DXImageTransform.Microsoft.Blur(pixelradius="+radius+")");
        }
        /*
          svgnodes = { svgnode: vecobj
                     , stop1: gradient_stop1
                     , stop2: gradient_stop2
                     , rect:  rect
                     };
        */

        this.store("-wh-effects-svg", svgnodes);
        this.store("wh-effects-svg", svgnodes);
      }


      /*
      -wh-gradientfade (EXPERIMENTAL)

      - Firefox 3         - YES
      - Internet Explorer - NO (doesn't support mask CSS property or SVG <foreignObject>)
      - Opera             - not yet, same as IE
      - Safari 4+         - YES
      - Chrome 1+ ?       - YES
      - Android           - NO (cannot use gradient as mask)

      - Android can not use a gradient as mask (it'll lose transparancy)
        option to fix this: make a canvas, draw the gradient on it and then apply that canvas to the webkitImageMask or webkitMaskBoxImage
        also check:
        - http://stackoverflow.com/questions/6554623/webkit-reflection-mask-in-android-chrome

      TODO:
      - try animating -webkit-mask-position-x / -webkit-mask-position-y /-webkit-mask-repeat instead of changing the stops

      OTHER EFFECTS:
      - Text cutout of a background image
        http://jsfiddle.net/ZdvXg/

      h1 {
          font-size: 120px;
          background: url(http://www.geeks3d.com/public/jegx/200812/game-texture-02.jpg) repeat 0 0, white;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
      }

      */
      if(property=='-wh-gradientmask' || property=='wh-gradientmask' )
      {
        /*
        ADDME: do we need to provide a fallback, or let sites do this themselves?
        options: fallback to
        A) width, messes with the height when used on a image (requires a container element to use it on)
        B) clipping (only possible on an absolute positioned element)
        */

        var canuse_webkit_mask =
            (  (Browser.safari && Browser.version >= 4)
            || (Browser.chrome && Browser.version >= 1) // FIXME: maybe even earlyer?.. Opera 15+ is also supported, but it's detected as Chrome
            //|| document.documentElement.style.WebkitMask!==undefined
            )
            && !Browser.platform=="android"; // Android cannot use alphatransparancy in gradients?? or not use in in a mask?

//console.log("webkit: ",canuse_webkit_mask);

        // http://caniuse.com/svg-html
        // FIXME: should work on CHR18+, SF6+, iOS SF6+ but doesn't seem to work (in this way) yet
        // NOTE: IE9+ only support's using SVG as filter, not as mask
        // NOTE: Opera has no support at all for using SVG as filter or mask
        var canuse_svg_mask =
               (Browser.ie && Browser.version >= 9)
            || (Browser.firefox && Browser.version >= 3);

//console.log("svg: ",canuse_svg_mask);

        // NOTE: IE 9 & 10 and Opera 12 still don't support this
        //var canuse_svg_foreignobject =

        /*
        [0] -> initial opacity
        [1] -> resulting opacity
        [2] -> transition start (%)
        [3] -> transition spread (%)
        [4] -> angle (optional, default is 180 (direction from left to right))

        .setStyle("-wh-gradientfade", "0, 1, 20%, 30%, 0");

        In the animator:
              { delay:    1
              , duration: 2
              , target:   "#cover_bemyvalentine"
              , from:     {"-wh-gradientmask": [1,0,-40,40]}
              , to:       {"-wh-gradientmask": [1,0,100,40]}
              }
        */
        var pval = Fx.CSS.prototype.parse(value);
        var val = [ pval[0].value, pval[1].value, pval[2].value, pval[3].value ];//, pval[4].value ];

//console.log(val);

        var degree = 180; // default is left-to-right
        if (pval.length > 4)
          var degree = pval[4].value;

        /*
        Notes on 'Webkit mask' path:
        - webkit gradient works in Safari and Chrome
        - in Safari a color-stop at <0 or >1 will cause a non working color-stop and artifacts onscreen
        - Safari dithers gradients, which prevents banding (your eyes/brain recognizing the horizontal or vertical rows of the same color)
        - Chrome shows banding because it doesn't dither gradients
          http://code.google.com/p/chromium/issues/detail?id=41756
        */
        if (canuse_webkit_mask)
        {
          // FIXME: when cutting off the gradient we should also update the alpha to the expected value for the cutoff position
          var stop1pos = val[2] > 0 ? val[2] : 0;
          var stop1alpha = val[1];

          var stop2pos = (val[2] + val[3]) < 100 ? val[2] + val[3] : 100;
          var stop2alpha = val[0];

          if (val[2] > 100)
          {
            this.style.webkitMaskImage = "";
          }
          else
          {
            var cssvalue;
            if (degree == 180) // left-to-right
              directionstr = "0% 0%, 100% 0%";
            else if (degree == 90) // top-to-bottom
              directionstr = "0% 0%, 0% 100%";
            else if (degree == 0)
              directionstr = "100% 0%, 0% 0%";
            else if (degree == 270)
              directionstr = "0% 100%, 0% 0%";

            // toFixed, also to prevent JS converting the number to scientific notation (which isn't supported in CSS)
            cssvalue = "-webkit-gradient( linear, " + directionstr +
                      ", color-stop(" + (stop1pos/100).toFixed(5) +
                      ", rgba(0,0,0," + stop1alpha.toFixed(5) +
                      ")), color-stop(" + (stop2pos/100).toFixed(5) +
                      ", rgba(0,0,0," + stop2alpha.toFixed(5) +
                      ")) )";
            //this.style.webkitMaskImage = cssvalue;
            return old_setstyle.apply(this,["webkitMaskImage",cssvalue]);
          }
        }
        else if (canuse_svg_mask)
        {
          var stop1pos = val[2];
          var stop1alpha = val[1];

          var stop2pos = val[2] + val[3];
          var stop2alpha = val[0];

          /*
          Notes on SVG code path:
          -
          */
          var svgnodes = this.retrieve("wh-effects-svg");
          if (!svgnodes)
          {
            var svgNS = "http://www.w3.org/2000/svg";

            var vecobj = document.createElementNS(svgNS, "svg");
            vecobj.setAttribute("height", 0);

            svgnodes = { svgnode: vecobj }

            //vecobj.appendChild(mask);
            document.body.adopt(vecobj);
          }

          if (!svgnodes.stop1)
          {
            // FIXME: nicer way to generate unique id's or to store the counter
            if (!window.maskid)
              window.maskid = 1;
            else
              window.maskid++;

            var maskelementid = "svgmask_"+maskid;

            var mask = document.createElementNS(svgNS, "mask");
            mask.setAttribute("id", maskelementid);
            mask.setAttribute("maskUnits", "objectBoundingBox");
            mask.setAttribute("maskContentUnits", "objectBoundingBox");

            // calculate the direction of the gradient
            var bla = Math.PI * (degree-90) / 180;
            var x1 = 0;
            var y1 = 0;
            var x2 = Math.round(Math.sin(bla) * 100) / 100;
            var y2 = Math.round(Math.cos(bla) * 100) / 100;

            if (x2 < 0)
            {
              x1 = -x2;
              x2 = 0;
            }

            if (y2 < 0)
            {
              y1 = -y2;
              y2 = 0;
            }

            //console.log("Degree: "+degree+" is radians: "+bla);
            //console.log("Direction from "+x1+"x"+y1+" to "+x2+"x"+y2);

            var gradient = document.createElementNS(svgNS, "linearGradient");
            gradient.setAttribute("id", maskelementid+"_gradient");
            gradient.setAttribute("gradientUnits", "objectBoundingBox");
            gradient.setAttribute("x1", x1);
            gradient.setAttribute("y1", y1);
            gradient.setAttribute("x2", x2);
            gradient.setAttribute("y2", y2);

            var gradient_stop1 = document.createElementNS(svgNS, "stop");
            gradient_stop1.setAttribute("stop-color",   "white");
            gradient_stop1.setAttribute("stop-opacity", stop1alpha);
            gradient_stop1.setAttribute("offset",       stop1pos/100);

            window.gradient_stop1 = gradient_stop1;

            var gradient_stop2 = document.createElementNS(svgNS, "stop");
            gradient_stop2.setAttribute("stop-color",   "white");
            gradient_stop2.setAttribute("stop-opacity", stop2alpha);
            gradient_stop2.setAttribute("offset",       stop2pos/100);

            window.gradient_stop2 = gradient_stop2;

            gradient.appendChild(gradient_stop1);
            gradient.appendChild(gradient_stop2);

            var rect = document.createElementNS(svgNS, "rect");
            rect.setAttribute("x",      0);
            rect.setAttribute("y",      0);
            rect.setAttribute("width",  1);
            rect.setAttribute("height", 1);
            rect.setAttribute("fill",   "url(#"+maskelementid+"_gradient)");

            mask.appendChild(gradient);
            mask.appendChild(rect);

            vecobj.appendChild(mask);
            document.body.adopt(vecobj);

            this.setStyle("mask", 'url("#'+maskelementid+'")');
            /*
            svgnodes = { svgnode: vecobj
                       , stop1: gradient_stop1
                       , stop2: gradient_stop2
                       , rect:  rect
                       };
            */
            svgnodes.stop1 = gradient_stop1;
            svgnodes.stop2 = gradient_stop2
            svgnodes.rect = rect

            this.store("wh-effects-svg", svgnodes);
          }
          else
          {
            svgnodes.stop1.setAttribute("offset", stop1pos/100);
            svgnodes.stop2.setAttribute("offset", stop2pos/100);
          }
          /*
          HTML:
          <svg height="0">
            <mask id="fade_right_svg_mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
              <linearGradient id="fade_right_svg_gradient" gradientUnits="objectBoundingBox" x2="1" y2="0">
                <stop stop-color="white" stop-opacity="1" offset="0.50"></stop>
                <stop stop-color="white" stop-opacity="0" offset="0.75"></stop>
              </linearGradient>
              <rect x="0" y="0" width="1" height="1" fill="url(#fade_right_svg_gradient)"></rect>
            </mask>
          </svg>

          CSS:
          mask: url(#fade_right_svg_mask);
          */
        }
        else // fallback
        {
          // ADDME: fallback for IE 7/8 -> 'filter acting as mask'/'canvas' or 'clip:rect()' solution?
          // ADDME: fallback for Android -> 'use a canvas as gradient mask' or SVG foreignobject?
          // ADDME: fallback for Opera -> same as IE ?
        }

      }

      return old_setstyle.apply(this,arguments);
    }
  });
})();

})(document.id); //end mootools wrapper
