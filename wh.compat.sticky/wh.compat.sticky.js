/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
require ('wh.util.resizelistener');
/*! LOAD: wh.compat.base, wh.util.resizelistener
!*/

/****************************************************************************************************************************
 * Input placeholder
 */

(function($) { //mootools wrapper

if(!window.$wh) window.$wh={};

var watchednodes = [];
var watchlist = [];

function watchStickies()
{
  Array.each(watchlist, checkSticky);
}
function checkSticky(towatch)
{
  var scrolly = $(window).getScroll().y;

  var mustlock = towatch.node.retrieve("wh-sticky-upperposition") < scrolly;
  if(towatch.locked === mustlock)
    return;

  towatch.locked = mustlock;
  towatch.node.toggleClass("wh-sticky-inflow", !mustlock);
  towatch.node.toggleClass("wh-sticky-locked", mustlock);

  if(mustlock)
  {
    if(!towatch.reservenode)
      towatch.reservenode = new Element("div", { "class": "wh-sticky-reservespace"
                                               , "styles": {"height": towatch.node.retrieve("wh-sticky-height") }
                                               }).inject(towatch.node,'after')
  }
}

function updateStickySetting(towatch)
{
  towatch.locked=null;
  towatch.node.removeClass("wh-sticky-inflow").removeClass("wh-sticky-locked");

  var top = towatch.node.getStyle("top");
  towatch.node.store("wh-sticky-upperposition", towatch.node.getPosition().y - (top.toInt() || 0).toInt()*2); //subtract it twice, as top is already added into getPosition if no classes are applied
  towatch.node.store("wh-sticky-height", towatch.node.getSize().y)

  if(towatch.reservenode)
    towatch.reservenode.setStyle("height", towatch.node.retrieve("wh-sticky-height"));
  checkSticky(towatch);
}

function addToStickyWatchlist(node)
{
  if(watchlist.length==0) //first item
    window.addEvent("scroll", watchStickies.debounce());

  watchednodes.push(node);
  var towatch = { node: node
                , top: top
                , reservenode: null
                , locked: null
                };
  watchlist.push(towatch);

  towatch.node.addEvent("wh-resized", updateStickySetting.bind(null, towatch).debounce());
  $wh.enableResizeEvents(towatch.node);
}

function checkStickies()
{
  $$('.wh-sticky').each(function(node)
  {
    if(["sticky","-webkit-sticky"].contains(node.getStyle("position"))) //apparently browser supported sticky
      return;

    if(!watchednodes.contains(node))
      addToStickyWatchlist(node);
  });

  Array.each(watchlist, updateStickySetting);
}

//no domready/load debouncing, we need to run immediately so other load handlers can rely on us
window.addEvent("domready", checkStickies);
window.addEvent("load", checkStickies);
//here we can probably wait...
window.addEvent("wh-layoutchange", checkStickies.debounce());

})(document.id); //end mootools wrapper
