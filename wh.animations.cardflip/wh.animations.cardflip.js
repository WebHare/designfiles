/* generated from Designfiles Public by generate_data_designfles */
require ('./cardflip.css');
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.element.measure');
/*! REQUIRE: frameworks.mootools.core, frameworks.mootools.more.element.measure
!*/

(function($) { //mootools wrapper

if(!window.$wh) window.$wh={};

$wh.CardFlip = new Class(
{ Implements: [Events,Options]
, node:null

, initialize: function(element)
  {
    this.node = $(element);
    this.node.addClass("wh-cardflip");

    //convert to flippable nodes
    this.node.getChildren("li").each(function(node)
      {
        var containernode = new Element("a", { href: "#" });
        var upnode = new Element("div", {"class":"up"}).inject(containernode);
        var upnodeholder = new Element("div", {"class":"inn", html:node.get('html')}).inject(upnode);
        var downnode = new Element("div", {"class":"down"}).inject(containernode);
        var downnodeholder = new Element("div", {"class":"inn", html:node.get('html')}).inject(downnode);
        node.empty().adopt(containernode);
      });
  }
, getCurrent:function()
  {
    var nodes = this.node.getChildren("li");
    var selectednode = nodes.filter(".active");
    return selectednode.length ? nodes.indexOf(selectednode[0]) : 0;
  }
, getTotal:function()
  {
    return this.node.getChildren("li").length;
  }
, gotoCard:function(idx)
  {
    this.node.removeClass("animate");
    var nodes = this.node.getChildren("li");
    nodes.removeClass("active").removeClass("before");
    nodes[idx].addClass("active");
  }

, playNextCard:function()
  {
    if(Browser.ie)
      return this.gotoCard( (this.getCurrent() + 1) % this.getTotal());

    this.node.addClass("animate");
    var nodes = this.node.getChildren("li");
    var selectednode = nodes.filter(".active");
    var aa;

    if(!selectednode.length)
    {
      aa = nodes[0];
      aa.addClass("before")
        .removeClass("active")
        .getNext("li")
        .addClass("active")
        .getParent("body")
  //      .addClass("play");
    }
    else if (selectednode[0] == nodes.getLast())
    {
      nodes.removeClass("before");
      selectednode.addClass("before").removeClass("active");
      selectednode = nodes[0];
      selectednode.addClass("active")
          .getParent("body")
    //      .addClass("play");
    }
    else
    {
      nodes.removeClass("before");
      selectednode.addClass("before")
          .removeClass("active")
          .getNext("li")
          .addClass("active")
          .getParent("body")
      //    .addClass("play");
    }
  }

});

})(document.id); //end mootools wrapper
