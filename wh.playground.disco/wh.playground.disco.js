/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.media.audiomgr');
/*! LOAD: frameworks.mootools.core, wh.compat.base, wh.media.audiomgr
!*/

var partyApplied = false;

function startTheParty(delay)
{
  if (!delay && delay != 0)
    delay = 2000;

  if (partyApplied)
  {
    console.log("Theo was already here");
    return;
  }

  var beagle = new Element("img", { "src": "https://disco.b-lex.com/beaglewalking.gif"
                                  , "class": "beagledoggie"
                                  , styles: { "transition-property": "transform"
                                            , "transition-duration": "1s"
                                            }
                                  });

  $(document.body).adopt(beagle);

  var beaglebottom = beagle.getStyle("bottom");
  var beagleleft = beagle.getStyle("left");

  var beaglemorph = new Fx.Morph(beagle, { duration: 5000
                                         , transition: Fx.Transitions.Sine.easeOut
                                         , onComplete: function()
                                         {
                                           beagle.setStyles({ "bottom":  beaglebottom
                                                            , "left": beagleleft
                                                            })
                                           //beagle.removeStyle("transform");
                                         }});

  var beaglerun = function()
  {
    beaglemorph.start({ "left": $(document.documentElement).getSize().x
                      , "bottom": $(document.documentElement).getSize().y
                      });
    (function()
    {
      beagle.setStyle("transform","rotate(360deg)");
    }.delay(1000));
  };

  beaglerun();
  beaglerun.periodical(1);

  console.log("Theo will arrive in " + delay + " msecs");

  // collect the disco ball
  var discoball = new Element("img", { src: "https://disco.b-lex.com/disco.gif"
                                     , id: "discoball"
                                     , styles: { "position": "absolute"
                                               , "left": 400
                                               , "top": -450
                                               , "z-index": 99999
                                               }
                                     });

  // preload the sound
  var audiomgr = new $wh.AudioManager;
  var theo = audiomgr.createSound('https://disco.b-lex.com/lauwepis.mp3');

  discoball.addEvent("click", function() { theo.stop(); theo.play(); } ); // so that ios can have fun as well

  // get all the containers that have some width, we will play with them as well
  var containers = $$("div");
  var usefulcontainers = new Array;
  containers.some(function(container)
  {
    if (["inline-block","block"].contains(container.getStyle("display")))
    {
      var size = container.getSize();
      if (size.x >= 100 && size.y >= 100)
      {
        container.addClass("partyelement");
        usefulcontainers.push(container);
        if (usefulcontainers.length == 5)
          return true;
      }
    }
  });

  new $wh.Preloader([theo],
  { onComplete: function()
    {
      (function()
        {
          $(document.body).adopt(discoball);

          // move the disco ball in
          var discofx = new Fx.Tween(discoball
                                   , { duration: 2500
                                     , property: "top"
                                     , transition: Fx.Transitions.Bounce.easeOut
                                     });

          discofx.start(0);

          (function() { theo.play(); } ).delay(delay);

          (function() {
            var fixwidgets = new Elements;
            for(var i=0;i<usefulcontainers.length;++i)
              if(Math.random()>.8)
                fixwidgets.push(usefulcontainers[i]);

            fixwidgets.addClass('andwedanced');
            fixwidgets.setStyle("background-color", ["#9b505c","#725799","#33567f","#33857b","#746366"].getRandom());
            (function() { fixwidgets.removeClass('andwedanced') }).delay(500);
          }).periodical(500);

          partyApplied = true; // only once
        }
      ).delay(delay);
    }
  });
}
