/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.ui.base');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.ui.base
!*/

(function($) { //mootools wrapper

//image canvas
$wh.ImageSurface = new Class(
{ Implements  : [Events,Options]

, container  : null

, img        : null
, imgdata    : {}

, viewport   : null

, canvasdata : {}
, canvas     : null
, ctx        : null

, rotator    : null
, cropper    : null
, scaler     : null
, scalerlimit:4096 //max canvassize if scaling up

,  history    : []//contains all steps done

, initialize: function(container, options)
  {
    this.container = new Element("div", {"class":"wh-image-surface"
                                        });

    //var canvaswrapper = new Element('div',{ 'class' : 'wh-canvaswrapper' }).inject(this.container);
    this.canvas = new Element('canvas').inject(this.container);
    this.setOptions(options);
  }
, toElement: function()
  {
    return this.container;
  }
, setSize:function(w,h)
  {
    this.container.setStyles({ width: w
                             , height: h
                             });
  }
, loadImageByUrl:function(imgurl, orientation)
  {
    $wh.updateUIBusyFlag(+1);
    var img = new Image; //FIXME error handler
    img.addEventListener('load', this.onLoad.bind(this,img,orientation), false);
    img.src = imgurl;
  }
, getImageAsUrl:function(mimetype, quality)
  {
    if(!this.ctx)
      return null; //not ready yet

    return this.canvas.toDataURL(mimetype || "image/jpeg", quality || 0.75);
  }
, getImageAsBlob:function(callback, mimetype, quality)
  {
    if(!this.ctx)
    {
      callback(null); //not ready yet
      return;
    }

    this.canvas.toBlob(callback, mimetype || "image/jpeg", quality || 0.75);
  }

, reduceActions: function(cursteps)
  {//FIXME more reduction if possible

    var cursteps = Array.clone(cursteps);
    var steps = new Array();

/*
Merge:
-Same sequentially actions to one step
-Orientation if no cropping in between
-Scale if no cropping in between
*/
    var c_index = -1;
    var s_index = -1;
    var r_index = -1;
    for(var c = 0; c < cursteps.length; c++)
    {
      if(cursteps[c].action == 'crop')
      {
        s_index = -1;
        r_index = -1;
        if(c_index > -1)
        {
          var w = steps[c_index].props.crop[1] - steps[c_index].props.crop[3];
          var h = steps[c_index].props.crop[2] - steps[c_index].props.crop[0];

          steps[c_index].props.crop[0]+=h*cursteps[c].props.crop[0]; //top
          steps[c_index].props.crop[1]*=cursteps[c].props.crop[1];   //right
          steps[c_index].props.crop[2]*=cursteps[c].props.crop[2];   //bottom
          steps[c_index].props.crop[3]+=w*cursteps[c].props.crop[3]; //left
        }
        else
        {
          c_index = steps.length;
          steps.push(cursteps[c]);
        }
      }
      else if(cursteps[c].action == 'scale')
      {
        c_index = -1;
        if(s_index > -1)
        {
          steps[s_index].props.scale.x*=cursteps[c].props.scale.x;
          steps[s_index].props.scale.y*=cursteps[c].props.scale.y;
        }
        else
        {
          s_index = steps.length;
          steps.push(cursteps[c]);
        }
      }
      else if(cursteps[c].action == 'rotate')
      {
        c_index = -1;
        if(r_index > -1)
        {
          steps[r_index].props.angle+=cursteps[c].props.angle;
          steps[r_index].props.angle-=Math.floor(steps[r_index].props.angle / 360) * 360;//keep range between 0 and 360
          steps[r_index].props.scale.x*=cursteps[c].props.scale.x;
          steps[r_index].props.scale.y*=cursteps[c].props.scale.y;
        }
        else
        {
          r_index = steps.length;
          steps.push(cursteps[c]);
        }
      }
    }

    return steps;
  }

, onLoad: function(img, orientation, event)
  {
    this.history = [];
    this.viewport = this.container.getSize();
    this.setupFromImage(img, orientation);

    this.ctx = this.canvas.getContext("2d");

/*
alert('FIXME need to plugin these actions before starting the editor.');
    //Setup rotate functions
    this.rotator = new $wh.PhotoRotate(this);
    this.rotator.addEvent('apply',function(ev)
      {
        this.history.push({action : 'rotate', props : ev});
        this.fireEvent('change',this.history[this.history.length-1]);
      }.bind(this));

    //Setup crop functions
    this.cropper = new $wh.PhotoCrop(this);
    this.cropper.addEvent('apply',function(ev)
      {
        this.history.push({action : 'crop', props : ev, width:this.canvas.width, height:this.canvas.height});
        this.fireEvent('change',this.history[this.history.length-1]);
      }.bind(this));

    //Setup scale functions
    this.scaler = new $wh.PhotoScale(this);
    this.scaler.addEvent('apply',function(ev)
      {
        this.history.push({action : 'scale', props : ev});
        this.fireEvent('change',this.history[this.history.length-1]);
      }.bind(this));
*/
    this.setupCanvas(img);
    this.fireEvent('ready',this.imgdata);
    $wh.updateUIBusyFlag(-1);
  }

, setupFromImage: function(img, orientation)
  {
    orientation = orientation || 1;
    var rotated = [ 5, 6, 7, 8 ].contains(orientation);

    //if preview image is a scaled version of orginal due to limits browser canvas size handling
    /*FIXME wat was hier gedachte achter ? data-width/height hebben we nu niet meer..
    var orgw = img.get('data-width');
    var orgh = img.get('data-height');
    */
    var scale = { 'x': 1, 'y': 1 };//use separate scale x/y for error reduction rounding
    var orgsize = { 'x': rotated ? img.height : img.width, 'y': rotated ? img.width : img.height };
    /*
    if(orgw && orgh)
    {
      scale.x = orgw / img.width;
      scale.y = orgh / img.height;
      orgsize.x = orgw;
      orgsize.y = orgh;
    }
    */
    this.imgdata = { 'size'       : { 'x': rotated ? img.height : img.width, 'y': rotated ? img.width : img.height }
                   //, 'src'        : this.img.get('src')
                   , 'scale'      : scale
                   , 'orgsize'    : orgsize
                   , 'aspect'     : (orgsize.x / orgsize.y)
                   , 'orientation': orientation
                   }

    //hide orginal image, now canvas is used (display:none gives problems with drawImage)
//    img.setStyles({'visibility':'hidden', 'z-index':'-1', 'width':'1px', 'height':'1px'});
  }

, setupCanvas: function(img)
  {
    this.canvas.set('width', this.imgdata.size.x);
    this.canvas.set('height', this.imgdata.size.y);

    //what scale to use to fit image on canvas in current position
    var canvasscalex = this.canvas.width / this.viewport.x;
    var canvasscaley = this.canvas.height / this.viewport.y;
    var canvasscale  = canvasscalex > canvasscaley ? canvasscalex : canvasscaley;
    if(canvasscale < 1)
      canvasscale = 1;//don't scale up

    var cssw = Math.round(this.canvas.width / canvasscale);
    var cssh = Math.round(this.canvas.height / canvasscale);
    this.canvasdata = { 'csssize' : {'x' : cssw, 'y' : cssh}
                      , 'scale'   : {'x' : (this.canvas.width/cssw), 'y' : (this.canvas.height/cssh)}
                      , 'realsize': {'x' : this.imgdata.orgsize.x, 'y' : this.imgdata.orgsize.y}
                      }

    this.canvas.setStyles({ 'position'   : 'absolute'
                          , 'top'        : '50%'
                          , 'left'       : '50%'
                          , 'width'      : this.canvasdata.csssize.x + 'px'
                          , 'height'     : this.canvasdata.csssize.y + 'px'
                          , 'margin-left': Math.floor(this.canvasdata.csssize.x*-0.5) + 'px'
                          , 'margin-top' : Math.floor(this.canvasdata.csssize.y*-0.5) + 'px'
                          , 'background-color': 'red'
                          });

    var drawwidth = this.imgdata.size.x;
    var drawheight = this.imgdata.size.y;
    if ([ 5, 6, 7, 8 ].contains(this.imgdata.orientation))
    {
      var tmp = drawwidth;
      drawwidth = drawheight;
      drawheight = tmp;
    }
    // See: http://stackoverflow.com/a/6010475
    switch (this.imgdata.orientation)
    {
      case 1: // rotated 0°, not mirrored
        break;
      case 2: // rotated 0°, mirrored
        this.ctx.scale(-1, 1);
        this.ctx.translate(-drawwidth, 0);
        break;
      case 3: // rotated 18°, not mirrored
        this.ctx.translate(drawwidth, drawheight);
        this.ctx.rotate(Math.PI);
        break;
      case 4: // rotated 180°, mirrored
        this.ctx.scale(1, -1);
        this.ctx.translate(0, -drawheight);
        break;
      case 5: // rotated 270°, mirrored
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.scale(-1, 1);
        break;
      case 6: // rotated 270°, not mirrored
        this.ctx.translate(drawheight, 0);
        this.ctx.rotate(Math.PI / 2);
        break;
      case 7: // rotated 90°, mirrored
        this.ctx.scale(-1, 1);
        this.ctx.translate(-drawheight, drawwidth);
        this.ctx.rotate(3 * Math.PI / 2);
        break;
      case 8: // rotated 90°, not mirrored
        this.ctx.translate(0, drawwidth);
        this.ctx.rotate(3 * Math.PI / 2);
        break;
    }
    this.ctx.drawImage(img, 0, 0, drawwidth, drawheight);
  }

, apply : function()
  {

  }

, undo : function()
  {
    //first restore original
    this.setupCanvas();

    if(this.history.length == 0)
      return;

    //remove last action from history
    this.history.pop();

    //reconstruct previous actions with minimum steps
    var steps = this.reduceActions(this.history);
    for(var c=0; c < steps.length; c++)
    {
      var hist = steps[c];

      if(hist.action == 'rotate')
        this.rotator.applyCanvas(hist.props);
      else if(hist.action == 'crop')
        this.cropper.applyCanvas(hist.props);
      else if(hist.action == 'scale')
        this.scaler.applyCanvas(hist.props);
    }

  }
});

var PhotoRotate = new Class(
{ Implements  : [Events,Options]
 ,app: null
 ,angle : 0
 ,scale : {x:1, y:1}
 ,fx: null //for mootools fx
 ,active : false
 ,canvasscale : 1

 ,initialize: function(app)
  {
    this.app = app;

    this.fx = new Fx.Morph(this.app.canvas,{ duration: 300, onComplete: this.onReady.bind(this)});
  }

 ,onReady: function()
  {
    this.fireEvent((this.active ? 'start' : 'stop'));
  }

 ,start: function()
  {
    //initial values
    this.angle = 0;
    this.scale = {x:1,y:1};

    //what scale to use to fit image on canvas in current position
    var canvasscalex = this.app.canvas.width / this.app.viewport.x;
    var canvasscaley = this.app.canvas.height / this.app.viewport.y;
    this.canvasscale = canvasscalex > canvasscaley ? canvasscalex : canvasscaley;

    //what scale if rotated 90deg.:
    var canvasscalexr = this.app.canvas.width / this.app.viewport.y;
    var canvasscaleyr = this.app.canvas.height / this.app.viewport.x;
    this.canvasscale = canvasscalexr > this.canvasscale ? canvasscalexr : this.canvasscale;
    this.canvasscale = canvasscaleyr > this.canvasscale ? canvasscaleyr : this.canvasscale;
    if(this.canvasscale < 1)
      this.canvasscale = 1;//don't scale up

    this.active = true;
    if(this.app.canvas.width/cssw != this.app.canvasdata.scale.x || this.app.canvas.height/cssh != this.app.canvasdata.scale.y)
    { //resize canvas so it fits if rotated
      var cssw = Math.round(this.app.canvas.width / this.canvasscale);
      var cssh = Math.round(this.app.canvas.height / this.canvasscale);
      this.app.canvasdata.csssize = {'x' : cssw, 'y' : cssh};
      this.app.canvasdata.scale = {'x' : (this.app.canvas.width/cssw), 'y' : (this.app.canvas.height/cssh)};

      this.fx.start({ 'width'      : this.app.canvasdata.csssize.x + 'px'
                    , 'height'     : this.app.canvasdata.csssize.y + 'px'
                    , 'margin-left': Math.floor(this.app.canvasdata.csssize.x*-0.5) + 'px'
                    , 'margin-top' : Math.floor(this.app.canvasdata.csssize.y*-0.5) + 'px'
                    });
    }
    else
    {
      this.onReady();
    }
  }

 ,stop: function()
  {
    this.scale = {x:1,y:1};
    this.angle = 0;
    this.rotate(0);

    //what scale to use to fit image on canvas in current position
    var canvasscalex = this.app.canvas.width / this.app.viewport.x;
    var canvasscaley = this.app.canvas.height / this.app.viewport.y;
    this.canvasscale = canvasscalex > canvasscaley ? canvasscalex : canvasscaley;
    if(this.canvasscale < 1)
      this.canvasscale = 1;//don't scale up

    this.active = false;
    if(this.app.canvas.width/cssw != this.app.canvasdata.scale.x || this.app.canvas.height/cssh != this.app.canvasdata.scale.y)
    { //resize canvas so it fits if rotated

      var cssw = Math.round(this.app.canvas.width / this.canvasscale);
      var cssh = Math.round(this.app.canvas.height / this.canvasscale);
      this.app.canvasdata.csssize = {'x' : cssw, 'y' : cssh};
      this.app.canvasdata.scale = {'x' : (this.app.canvas.width/cssw), 'y' : (this.app.canvas.height/cssh)};

      this.fx.start({ 'width'      : this.app.canvasdata.csssize.x + 'px'
                    , 'height'     : this.app.canvasdata.csssize.y + 'px'
                    , 'margin-left': Math.floor(this.app.canvasdata.csssize.x*-0.5) + 'px'
                    , 'margin-top' : Math.floor(this.app.canvasdata.csssize.y*-0.5) + 'px'
                    });
    }
    else
    {
      this.onReady();
    }
  }

 ,apply: function()
  {
    if(this.angle == 0 && this.scale.x == 1 && this.scale.y == 1)
      return;//no changes

    var newprops = {angle : this.angle, scale : this.scale}
    this.applyCanvas(newprops);

    this.fireEvent('apply',newprops);

    //and setback initial values:
    this.scale = {x:1,y:1};
    this.angle = 0;
    this.rotate(0);
  }

 ,applyCanvas: function(props,debug)
  {
    var neww = this.app.canvas.width;
    var newh = this.app.canvas.height;
    if(Math.round(Math.cos(props.angle*Math.PI/180)*100) == 0)
    {//rotated 90 or 270 deg.
      neww = this.app.canvas.height;
      newh = this.app.canvas.width;

      //switch scalefactors
      var scalex = this.app.imgdata.scale.x;
      this.app.imgdata.scale.x = this.app.imgdata.scale.y;
      this.app.imgdata.scale.y = scalex;

      var rx = this.app.canvasdata.realsize.x;
      this.app.canvasdata.realsize.x = this.app.canvasdata.realsize.y;
      this.app.canvasdata.realsize.y = rx;
    }
    else if(Math.round(Math.sin(props.angle*Math.PI/180)*100) == 0)
    {//rotated 0 or 360 deg.
      //no change in dimensions
    }
    else
    {//arbitrary angle
      //FIXME?
    }

    if(neww != this.app.canvas.width)
    {//resize canvas to fit image
      //Copy image
      var idata = this.app.ctx.getImageData(0, 0, this.app.canvas.width, this.app.canvas.height);

      var prevw = this.app.canvas.width;
      var prevh = this.app.canvas.height;

      //set needed canvas size to fit rotation
      var max = newh > neww ? newh : neww;
      this.app.canvas.set('width',max);
      this.app.canvas.set('height',max);
      this.app.ctx.putImageData(idata,Math.floor(0.5*(max - prevw)), Math.floor(0.5*(max - prevh)), 0, 0, prevw, prevh);

      //Rotate and or flip canvas
      this.app.ctx.setTransform(1,0,0,1,0,0);
      this.app.ctx.translate(this.app.canvas.width / 2, this.app.canvas.height / 2);
      this.app.ctx.scale(props.scale.x,props.scale.y);//scaling is -1 or 1 (flip vertical/horizontal)
      this.app.ctx.rotate(props.angle*Math.PI/180);

//        this.app.ctx.globalCompositeOperation = 'copy';//disabled because of bug in webkit
// as far we use steps of 90deg. this is no problem because we crop the image after rotation
// will be an issue if we use free rotation
      this.app.ctx.drawImage(this.app.canvas, -this.app.canvas.width/2, -this.app.canvas.height/2);

      //crop the transparent parts
      idata = this.app.ctx.getImageData(Math.floor(0.5*(max - neww)), Math.floor(0.5*(max - newh)), neww, newh);
      this.app.canvas.set('width',neww);
      this.app.canvas.set('height',newh);
      this.app.ctx.putImageData(idata,0,0);
    }
    else
    {
      this.app.ctx.setTransform(1,0,0,1,0,0);
      this.app.ctx.translate(this.app.canvas.width / 2, this.app.canvas.height / 2);
      this.app.ctx.scale(props.scale.x,props.scale.y);//scaling is -1 or 1 (flip vertical/horizontal)
      this.app.ctx.rotate(props.angle*props.scale.x*props.scale.y*Math.PI/180);//to rotate correct direction, multiply with scaling which is -1 or 1 (flip vertical/horizontal)

      this.app.ctx.drawImage(this.app.canvas, -this.app.canvas.width/2, -this.app.canvas.height/2);
    }

    if(!this.active)
    {//used if direct call from history
      //what scale to use to fit image on canvas in current position
      var canvasscalex = this.app.canvas.width / this.app.viewport.x;
      var canvasscaley = this.app.canvas.height / this.app.viewport.y;
      this.canvasscale = canvasscalex > canvasscaley ? canvasscalex : canvasscaley;
      if(this.canvasscale < 1)
        this.canvasscale = 1;//don't scale up
    }

    //correct css position/dimensions
    var cssw = Math.round(this.app.canvas.width / this.canvasscale);
    var cssh = Math.round(this.app.canvas.height / this.canvasscale);

    this.app.canvasdata.csssize = {'x' : cssw, 'y' : cssh};
    this.app.canvasdata.scale = {'x' : (this.app.canvas.width/cssw), 'y' : (this.app.canvas.height/cssh)};

    this.app.canvas.setStyles({ 'width'      : this.app.canvasdata.csssize.x + 'px'
                              , 'height'     : this.app.canvasdata.csssize.y + 'px'
                              , 'margin-left': Math.floor(this.app.canvasdata.csssize.x*-0.5) + 'px'
                              , 'margin-top' : Math.floor(this.app.canvasdata.csssize.y*-0.5) + 'px'
                              });
  }

 ,fliphorizontal: function()
  {
    this.scale.x*=-1;
    this.rotate(0);
  }

 ,flipvertical: function()
  {
    this.scale.y*=-1;
    this.rotate(0);
  }

 ,rotate: function(degrees)
  {
    this.angle+=degrees;
    this.angle-=Math.floor(this.angle / 360) * 360;//keep range between 0 and 360

    this.app.canvas.setStyle('transform','scale('+this.scale.x+','+this.scale.y+') rotate('+this.angle+'deg)');

    if(this.active)
      this.fireEvent('change',{angle : this.angle, scale : this.scale});
  }

});


})(document.id); //end mootools wrapper

