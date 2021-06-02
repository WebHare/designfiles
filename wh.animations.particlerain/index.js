/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! REQUIRE: frameworks.mootools, wh.compat.base !*/

//if(!window.$wh) $wh={};

// FIXME: spawn pos MUST be in the animate_bounds!!!!
// ADDME: option to choose whether compensate for size of sprites upon spawning (aka spawn pos is meant to be left-top pos of the sprite, middle or bottom)

(function($) { //mootools wrapper

$wh.particleRain = new Class(
{ Implements: [ Options, Events ]

, options:
    { container:   null

    // array describing each sprite type
    // { cssclass: "common_mysprite", speed: 1.0 }
    , spritetypes:      []
    //, keeprunning:     false // FIXME: not implemented yet. keep anim running even if no sprites are active in case of particles added outside the class

    //, fallmax: 0 // max amount of items to fall (FIXME: may work, but not support anymore for now)

    , y_speed_initial: 1
    , y_acceleration: 60 // acceleration towards ground over time

    // spawn settings
    , pick_sprites:        "random" // "random", "sequence"

    /** "destroy" - free this sprite
        "respawn" - free this sprite & directly spawn a new sprite (NOT implemented yet)
        "loop"    - move Y position up with the height of the animation area
        "reset"   - reset everything (position, speed etc) to the initial values (NOT implemented yet)
        "wrap"    - ??
    */
    , outside_bounds:      "destroy"

    , sprites_initial:       0 // amount of randomly chosen sprites to start with
    , sprites_max:         100
    , add_sprite_every:      0 // add a new sprite every X ms
    , sprite_min_distance:  50 // prevent overlap
    , spawn_bounds:        { x1: 0
                           , y1: 0
                           , x2: 1024
                           , y2: 601
                           }

    // warning: keep the spawn_bounds within the animation_bounds
    // (otherwise a sprite might directly stop animating because it's outside the animation_bounds)
    , animate_bounds: { x1: 0
                      , y1: 0
                      , x2: 1024
                      , y2: 601
                      }

    // wind effect settings
    , usewindeffect:     false
    , wind_min_duration:  750
    , wind_max_duration: 5500
    , wind_minradius:     350
    , wind_maxradius:     275
    , wind_minstrength:     0.37
    , wind_maxstrength:     1.37
    }

, sprites: []

, animationrequest: null
, spriteaddtimer:   null

, sprites_prevanimframetime: null // to determine have for in the anim we have progressed since the last frame
, is_playing: false

// animation state
, framecount:       0
, spritesfinished:  0 // amount of sprites which were destroyed, respawned, looped or reset ("wrap" doesn't count as finish)
, spritesactive:    0
, creationcount:    0 // counter used for determining next sprite to use in case of pick_sprites: "sequence"
, wind_active:   false

// FIXME: some changes done for bubble effect, maybe need a new class for that or can it be done in a more generic way??
, initialize: function(container, options)
  {
    options.container = container;
    this.setOptions(options);

    this.usetransforms = $wh.__transform_property != "";
    this.use3dtransforms = (Browser.platform=="ios"); // ==true because the variable might be undefined
    this.pixelratio = window.devicePixelRatio ? window.devicePixelRatio : 1;

    //if(this.options.fallmax > 0 && this.options.spritecount > this.options.fallmax)
    //  this.options.spritecount = this.options.fallmax;

    for(var tel=0; tel < this.options.sprites_initial; tel++)
      this.addRandomParticle();
  }

, addRandomParticle: function(options)
  {
//console.log(this.blaat, "new particle");
    if (this.spritesactive >= this.options.sprites_max)
    {
      console.info("Not adding a sprite, already max sprites active");
      return;
    }

    this.creationcount++;

    var lastpetalimageindex = this.options.spritetypes.length - 1;

    var spritetypeindex;
    if (this.options.pick_sprites == "random")
      spritetypeindex = Math.round(Math.random() * (this.options.spritetypes.length-1));
    else if (this.options.pick_sprites == "sequence")
      spritetypeindex = (this.creationcount-1) % lastpetalimageindex;
    else
      console.error("unknown pick_sprites value");

    var spritetype = this.options.spritetypes[spritetypeindex];
    var maxretry = 5; // prevent deadlock due to not being able to forfill min_distance (due to too many sprites, not enough space, spawning to early after another sprite etc)

    var spritex, spritey, finished = false;
    while (!finished)
    {
      var spritex = Math.random() * (this.options.spawn_bounds.x2 - this.options.spawn_bounds.x1) + this.options.spawn_bounds.x1;
      var spritey = Math.random() * (this.options.spawn_bounds.y2 - this.options.spawn_bounds.y1) + this.options.spawn_bounds.y1;

      var spritex_mid = spritex + spritetype.width/2;
      var spritey_mid = spritey + spritetype.height/2;

      spritex -= spritetype.width/2;
      spritey -= spritetype.height;

      // ADDME: logic to detect the min_distance cannot be honoured

      // check if the random position has enough distance between other sprites
      finished = true;

      //if (maxretry == 0)
      //  console.log("preventing deadlock.");

      if (this.options.sprite_min_distance > 0 && maxretry > 0)
      {
        maxretry--;
        for(var tel2=0; tel2 < this.sprites.length; tel2++)
        {
          var other_sprite = this.sprites[tel2];
          if (!other_sprite.active)
            continue;

          var deltax = Math.abs( other_sprite.x - spritex_mid );
          var deltay = Math.abs( other_sprite.y - spritey_mid );
          var distance = Math.sqrt( (deltax * deltax) + (deltay * deltay) );

          if (distance < this.options.sprite_min_distance)
          {
            finished = false;
            break; // no need to continue checking, we allready disproved this location
          }
        }
      }
    }

    var spritestyles =
            { position: "absolute"
            , left:     0
            , top:      0
            , visibility: "hidden" //don't show on initialize
            };
    if (typeof spritetype.zindex != "undefined")
      spritestyles.zIndex = spritetype.zindex;


    var spritedata =
            { x:         spritex
            , y:         spritey
            , xspeed:    (options && options.xspeed) ? options.xspeed : 0
            , yspeed:    (options && options.yspeed) ? options.yspeed : this.options.y_speed_initial
            , speed:     (options && spritetype.speed) ? spritetype.speed : this.options.speed
            , spritetype: spritetype
            , active:    true
            , spawned:   new Date().getTime()
            //, node: null
            };
//    console.log(spritedata);


    var spritenode;

    // find a spot in our sprites list which we can reuse
    var inactive_sprite_index = this.sprites.indexByProperty("active", false);

    var spritenode;
    if (inactive_sprite_index > -1)
    {
      //console.log("reusing sprite #"+inactive_sprite_index);

      spritedata.node = this.sprites[inactive_sprite_index].node;
      spritedata.node.set("class", spritetype.cssclass);
      spritedata.node.setStyles(spritestyles);
      spritedata.node.setStyle("visibility", "hidden");

      spritedata.active = true;

      this.sprites[inactive_sprite_index] = spritedata;

      spritenode = spritedata.node;
    }
    else
    {
      //console.log("creating a new sprite");

      spritenode = new Element( "div"
                              , { "class":  spritetype.cssclass
                                , "styles": spritestyles
                                }
                              );
      spritedata.node = spritenode;
      this.options.container.adopt(spritenode);
      this.sprites.push(spritedata);

      //console.log(this.sprites);
    }

    //spritedata.node.style.border = "1px solid #FA0";

    this.spritesactive++;
  }

, play: function()
  {
    //shuffle the array at start
/*
    var len = this.sprites.length;
    var i = len;
    while(i--)
    {
      var p = parseInt(Math.random()*len);
      var t = this.sprites[i];
      this.sprites[i] = this.sprites[p];
      this.sprites[p] = t;
    }
*/
//alert(this.add_sprite_every);
    if (this.options.add_sprite_every && !this.spriteaddtimer)
      this.addRandomParticleTimer();

/*
    for(var idx = this.sprites.length-1; idx > 0; idx--)
    {
      //this.sprites[idx].active = true;
      if (this.sprites[idx].active)
        this.sprites[idx].node.setStyle('visibility',null);//show flakes
    }
*/
    if(!this.animationrequest)
      this.animationrequest = requestAnimationFrame( this.update.bind(this) );
  }

, stop: function()
  {
    console.info("STOP");

    cancelAnimationFrame(this.animationrequest);
    this.animationrequest = null;

    window.clearTimeout(this.spriteaddtimer);
    this.spriteaddtimer = null;

    // kill the timer
    this.sprites_prevanimframetime = null;

    this.is_playing = false;

    // FIXME: since the flakes are still there they can interfere with mouse pointer
//    for(var c = 0; c < this.sprites.length; c++)
//      this.sprites[c].node.setStyle('visibility','hidden');//hide flakes

    this.animationrequest = null;
    this.sprites_prevanimframetime = null;
  }



, addRandomParticleTimer: function()
  {
    this.spriteaddtimer = this.addRandomParticleTimer.delay(this.options.add_sprite_every, this);
    this.addRandomParticle();
  }

, update: function()
  {
    if (this.animationrequest == null)
      return; // possible that old Firefox'es don't cancel correctly?, so ignore and don't schedule a new frame

    this.animationrequest = requestAnimationFrame( this.update.bind(this) );

    // frame throtteling
    /*
    this.framecount++;
    if (Browser.ie && Browser.version < 9 && this.framecount % 2 == 1)
    {
      this.animationrequest = requestAnimationFrame( this.update.bind(this) ); // reschedule
      return;
    }
    */

    var timenow = new Date().getTime();

    // upon drawing the first frame start the timer
//    if (!this.sprites_prevanimframetime)
//      this.sprites_prevanimframetime = timenow;

    if (this.options.usewindeffect && !this.wind_active)// && Math.random()*100 < 2)
    {
      //console.log("Begin van een windvlaag");
      this.wind_active = true;
      this.wind_duration = this.options.wind_min_duration + Math.random() * (this.options.wind_max_duration - this.options.wind_min_duration);
      this.wind_started = new Date().getTime();
      this.wind_ycenter = Math.random() * this.options.animate_bounds.y2;
/*
For snow:
      var bigwind = Math.random() < 0.1;
      if (bigwind)
      {
        this.wind_strength = Math.random() * 2.25 + 0.5;
        this.wind_radius = 450 + Math.random()*200;
      }
      else
      {
        this.wind_strength = Math.random() * 1.00 + 0.37;
        this.wind_radius = 350 + Math.random()*275;
      }
*/
      this.wind_strength = Math.random() * (this.options.wind_maxstrength - this.options.wind_minstrength) + this.options.wind_minstrength;
      this.wind_radius = Math.random() * (this.options.wind_maxradius - this.options.wind_minradius) + this.options.wind_minradius;
      //console.log("wind_strength: "+this.wind_strength);
      //console.log("wind_radius: "+this.wind_radius);

      if (Math.round(Math.random()) == 0)
        this.wind_strength = -this.wind_strength;
    }

    if (this.wind_active)
    {
      if (timenow - this.wind_started > this.wind_duration)
      {
        //console.log("Einde van de windvlaag");

        this.wind_active = false;
      }
      else
      {
        var progress = (timenow - this.wind_started) / this.wind_duration;
        //this.wind_currentstrenght = Math.sin( progress * Math.PI );
        //this.wind_currentstrength = Fx.Transitions.Quad.easeInOut( progress );
        this.wind_currentstrength = Fx.Transitions.Expo.easeOut( progress ) * this.wind_strength;
      }
    }

    if (this.sprites_prevanimframetime)
    {
      var timedelta = timenow - this.sprites_prevanimframetime;
      for(var tel=0; tel < this.sprites.length; tel++)
      {
        var sprite = this.sprites[tel];
        if (!sprite.active) // sprite not needed anymore, so don't bother to update
          continue;

        var spritetype = sprite.spritetype;

        // Gravity effect
        sprite.yspeed += timedelta * this.options.y_acceleration / 10000;

        // snelheid aan de particle gegeven
        sprite.y += timedelta * sprite.yspeed * sprite.speed / 1000;
        sprite.x += timedelta * sprite.xspeed * sprite.speed / 1000;
        sprite.xspeed = sprite.xspeed / 1.005;
        //sprite.yspeed = sprite.yspeed / 1.005;
        // FIXME: verlies snelheid


        // is this flake affected by the wind?
        if (this.wind_active)
        {
          var dist = Math.abs(sprite.y - this.wind_ycenter);
          if (dist <= this.wind_radius)
          {
            if (dist < 1)
              dist = 1;

            var effectprogress = dist / this.wind_radius;
            var effect = Math.sin( effectprogress * Math.PI ) * this.wind_currentstrength;
            //var effect = Fx.Transitions.Expo.easeInOut( effectprogress ) * this.wind_currentstrength;
            //console.log("Radius: "+this.wind_radius+", flakedist: "+dist+", eprog: "+eprog+", resultingeffect: "+effect);
            sprite.x -= effect;
          }
        }

//console.log(sprite.y, this.options.animate_bounds.y2);

        // when a sprite goes beyond the animation bounds,
        // they will cease to exist
        if (   sprite.y < this.options.animate_bounds.y1 - spritetype.height
            || sprite.y > this.options.animate_bounds.y2
            || sprite.x < this.options.animate_bounds.x1 - spritetype.width
            || sprite.x > this.options.animate_bounds.x2)
        {
//console.log(this.options.outside_bounds, this.spritesactive);
          switch(this.options.outside_bounds)
          {
            case "loop":
              sprite.y -= (this.options.animate_bounds.y2 - this.options.animate_bounds.y1) + spritetype.height;
              break;

            case "destroy":
              sprite.active = false;//deactivate
              sprite.node.setStyle('visibility','hidden');
              this.spritesactive--;
              break;

            //case "reset":
            //case "reuse":
          }

          this.spritesfinished++;
        }
      }
/*
console.log("spritesfinished " + this.spritesfinished);
      if(this.spritesfinished > 0 && this.spritesfinished >= this.options.fallmax)
      {
        this.fireEvent("ended");
        this.stop();
        return;
      }
*/
    }
    this.sprites_prevanimframetime = timenow;

    for(var tel=0; tel < this.sprites.length; tel++)
    {
      var sprite = this.sprites[tel];

//console.log(timenow, tel, sprite.x, sprite.y, sprite.yspeed);

      if(!sprite.active)
        continue;

      sprite.node.style.visibility = "";

      var spritenode = sprite.node;

      // prevent Webkit using resampling (blurry and causes pixelrounding errors in combination with CSS sprites)
      var spritex, spritey;
      if (this.pixelratio == 1)
      {
        spritex = Math.round(sprite.x);
        spritey = Math.round(sprite.y);
      }
      else
      {
        spritex = Math.round(sprite.x * this.pixelratio) / this.pixelratio;
        spritey = Math.round(sprite.y * this.pixelratio) / this.pixelratio;
      }


/*
BUBBLE MODE!!!


var alivetime = timenow - sprite.spawned;
var scale;
if (alivetime > 1000)
  scale = 1;
else
  scale = Fx.Transitions.Quad.easeOut(alivetime / 1000);

//scale = 0.1 + (Math.round(scale * 100) / 100) * 0.9;

var scale_x, scale_y;

scale_x = scale * (1 + Math.sin(Math.PI * alivetime / 1000) * 0.075);
scale_y = scale * (1 + Math.cos(Math.PI * alivetime / 1000) * 0.075);

scale_x = Math.round(scale_x * 100) / 100;
scale_y = Math.round(scale_y * 100) / 100;


        if (this.use3dtransforms)
          spritenode.style[transformprop] = "translate3D("+petal_x+"px,"+petal_y+"px,0) scale3d("+scale_x+","+scale_y+")";
        else if (this.usetransforms)
          spritenode.style[transformprop] = "translate("+petal_x+"px,"+petal_y+"px) scale("+scale_x+","+scale_y+")";
        else
        {
          spritenode.style.left = sprite.x+"px";
          spritenode.style.top = sprite.y+"px";
        }
      }
*/

//console.log($wh.__transform_property, "translate("+petal_x+"px,"+petal_y+"px)");

      if (this.use3dtransforms)
        spritenode.style[$wh.__transform_property] = "translate3D("+spritex+"px,"+spritey+"px,0)";
      else if (this.usetransforms)
        spritenode.style[$wh.__transform_property] = "translate("+spritex+"px,"+spritey+"px)";
      else
      {
        spritenode.style.left = spritex+"px";
        spritenode.style.top = spritey+"px";
      }
    }
  }
});

})(document.id); //end mootools wrapper
