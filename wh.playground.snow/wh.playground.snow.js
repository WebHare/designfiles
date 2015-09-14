/* generated from Designfiles Public by generate_data_designfles */
$wh.snow = new Class(
{ Implements: [ Options, Events ]
, options:
    { width:         800
    , height:        800
    , autostart:     true
    };

, container:     null
, framerequest:  null
, animstep:      0

, screenWidth: 0
, screenHeight: 0


, initialize: function(container, options)
  {
    this.setOptions(options);
//    this.gridcontainer = new Element("div", { styles: { position: "relative" } });
//    this.container = $(container);

    this.playing = setvars.autostart;
    this.framerequest = null;
    this.animstep = 0;

    // use the maximum size available for the current screen,
    // so when the user resizes there's enough snow for the new screensize

    // cache current screen size (in case it changes)
    this.screenWidth = window.screen.width;
    this.screenHeight = window.screen.height;

    this.dom =
      {
      };

    //viewportcanvas['moz-opaque'] = 'true';  // -moz-opaque: true;
      //mozImageSmoothingEnabled (gecko 1.9.2 (Firefox 3.6))

    // eventueel viewport div die fixed hele viewport inneemt
    // daarbinnen scrollen de sneeuwlagen... de ene sneller dan de andere

    this.canvas_back = this.getCanvas(this.screenWidth, this.screenHeight * 2);
    this.canvas_middle = this.getCanvas(this.screenWidth, this.screenHeight * 2);
    this.canvas_front = this.getCanvas(this.screenWidth, this.screenHeight * 2);
    this.canvas_back.speed = 1;
    this.canvas_middle.speed = 1.5;
    this.canvas_front.speed = 3;

    var buffer_context = this.canvas_back.context;
    buffer_context.fillStyle = "rgba(255,255,255,0.5)";
    this.createSnow(buffer_context, 1, 10);
    buffer_context.drawImage(this.canvas_back.node, 0, this.screenHeight);
    buffer_context.globalAlpha = 0.500;
    buffer_context.drawImage(this.canvas_back.node, 0, 1);
    buffer_context.drawImage(this.canvas_back.node, -1, -1);

    var buffer_context = this.canvas_middle.context;
    buffer_context.fillStyle = "rgba(255,255,255,0.75)";
    this.createSnow(buffer_context, 2, 5);
    buffer_context.drawImage(this.canvas_back.node, 0, this.screenHeight);
    buffer_context.globalAlpha = 0.500;
    buffer_context.drawImage(this.canvas_middle.node, 0, 1);
    buffer_context.drawImage(this.canvas_middle.node, -1, -1);

    var buffer_context = this.canvas_front.context;
    buffer_context.fillStyle = "#FFFFFF";
    this.createSnow(buffer_context, 3, 2);
    buffer_context.drawImage(this.canvas_front.node, 0, this.screenHeight);
    buffer_context.globalAlpha = 0.500;
    buffer_context.drawImage(this.canvas_front.node, 0, 1);
    buffer_context.drawImage(this.canvas_front.node, -1, -1);

    /*********/
    var uastring = navigator.userAgent.toLowerCase();
    var device_is_ipad = (uastring.indexOf('ipad') != -1);
    var device_is_iphone = (uastring.indexOf('iphone') != -1);
    var iswebkit = (uastring.indexOf('webkit') != -1);
    var issafari = (uastring.indexOf('safari') != -1);

    // Opera seems to be buggy with 'transforms' in combination with CSS sprites
    this.usetransforms = whUserAgent.csssupport.transform;// && !whUserAgent.isOpera;
    this.transformprop = whUserAgent.csssupport.transform_prop;

    // FIXME: combine with detection of 3D transform support
    this.use3dtransform = iswebkit; // especially the Mac version of Safari benefits from this, but also the Mac version of Chrome
    /*********/

    if (this.playing)
      this.show();
  }

, scheduleNextFrame: function()
  {
    var self = this;
    this.framerequest = window.requestAnimationFrame( function(){ self.update(); } );
  }

, play: function()
  {
    if (this.framerequest == null)
      this.scheduleNextFrame();
  }

, hide: function()
  {
    this.stop();
    this.canvas_back.node.parentNode.removeChild(this.canvas_back.node);
    this.canvas_middle.node.parentNode.removeChild(this.canvas_middle.node);
    this.canvas_front.node.parentNode.removeChild(this.canvas_front.node);
    /*
    this.canvas_back.node.style.display = "none";
    this.canvas_middle.node.style.display = "none";
    this.canvas_front.node.style.display = "none";
    */
  }

, show: function()
  {
    document.body.appendChild(this.canvas_back.node);
    document.body.appendChild(this.canvas_middle.node);
    document.body.appendChild(this.canvas_front.node);
    this.play();
  }

  ,stop: function()
  {
    cancelAnimationFrame(this.framerequest);
    this.framerequest = null;
  }

, createSnow: function(buffer_context, flakesize, thickness)
  {
    for(var tel=0; tel<this.screenHeight; tel++)
    {
      for(var tel2=0; tel2<thickness; tel2++)
      {
        var xpos = Math.random() * (this.screenWidth-2);
        buffer_context.fillRect(xpos, tel, flakesize, flakesize);
      }
    }
  }

, getCanvas: function(width, height)
  {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    canvas.style.pointerEvents = "none";
    //canvas.style.position = "absolute";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "5";

    return { node:     canvas
           , context:  canvas.getContext("2d")
           , speed:    0
           , animstep: -this.screenHeight
           }
  }

, updateLayer: function(snowlayer, debug)
  {
    snowlayer.animstep += snowlayer.speed;

    if(snowlayer.animstep > 0) //this.screenHeight * 2)
    {
      if (debug)
        console.log("Resetting from "+snowlayer.animstep+" to "+(snowlayer.animstep - this.screenHeight));

      snowlayer.animstep -= this.screenHeight;
    }

    //this.animstep = this.animstep % this.screenHeight;

    var ypos = Math.round(snowlayer.animstep);
    if (this.use3dtransforms)
      snowlayer.node.style[this.transformprop] = "translate3D(0,"+ypos+"px,0)";
    else if (this.usetransforms)
      snowlayer.node.style[this.transformprop] = "translate(0,"+ypos+"px)";
    else
    { // oldskool left+top for old browsers (IE)
      snowlayer.node.style.top = ypos+"px";
    }
  }

, update: function()
  {
    this.updateLayer(this.canvas_back);
    this.updateLayer(this.canvas_middle);
    this.updateLayer(this.canvas_front, true);

    //updateMenuIcons();

    this.scheduleNextFrame();
  }

, blur: function(context, passes)
  {
    var i, x, y;
    context.globalAlpha = 0.125;
    // Loop for each blur pass.
    for (i = 1; i <= passes; i += 1)
    {
      for (y = -1; y < 2; y += 1)
      {
        for (x = -1; x < 2; x += 1)
        {
          // Place eight versions of the image over the original
          // image, each with 1/8th of full opacity. The images are
          // placed around the original image like a square filter.
          // This gives the impression the image has been blurred,
          // but it's done at native browser speed, thus making it
          // much faster than writing a proper blur filter in
          // Javascript.
          context.drawImage(this.element, x, y);
        }
      }
    }
    context.globalAlpha = 1.0;
  }

});
