/* generated from Designfiles Public by generate_data_designfles */
require ('./edge-debugger.css');
require ('../wh.animations.edge');
/*! LOAD: wh.animations.edge !*/

(function($) {

$wh.EdgeDebugger = new Class(
{ animation:null
, debugmenu:null
, initialize:function(animation)
  {
    this.animation = animation;
    this.animation.addEvent("ready", this.onAnimationReady.bind(this)) ;

  }
, onAnimationReady:function()
  {
    console.log(this.animation.getStage());

    this.debugbutton = new Element("div", { "class": "wh-edgedebugger"
                                          , text: "D"
                                          , events: { "click" : this.onDebugMenu.bind(this) }
                                          }).inject(this.animation.getStageElement());
  }
, hideDebugMenu:function()
  {
    this.debugmenu.dispose();
    this.debugmenu=null;
  }
, onDebugMenu:function()
  {
    if(this.debugmenu)
    {
      this.hideDebugMenu();
      return;
    }

    //create a debug menu
    this.debugmenu = new Element("div", {"class":"wh-edgedebugger-menu"
                                        }).inject(this.debugbutton);
    this.addTimeLine(this.debugmenu, "stage", this.animation.getStage());
  }

, addTimeLine:function(menulevel, name, stage)
  {
    var stagenode = new Element("ul", {"text": name}).inject(menulevel);
    var labelpulldown = new Element("select", {"events": { "change": this.onJumpToLabel.bind(this, stage)
                                                         }
                                              }).adopt(new Element("option", {value:"-", text:"Jump to..."})
                                               ).inject(stagenode);

    Object.each(stage.timelines["Default Timeline"].labels, function(value, key)
      {
        new Element("option", {value: value, text:key}).inject(labelpulldown)
      });
  }

, onJumpToLabel:function(stage, event)
  {
    var gopos = parseInt(event.target.value);
    if(gopos != NaN)
    {
      stage.play(gopos);
      this.hideDebugMenu();
    }
  }
});

})(document.id);
