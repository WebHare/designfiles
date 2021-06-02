/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
/*! REQUIRE: frameworks.mootools.core
!*/

if(!window.$wh) $wh={};

(function($) { //mootools wrapper

var throttling = false;

function onWindowResizeOrScroll()
{
  if(throttling)
    return;

  handleWindowResizeOrScroll.delay(100);
  throttling=true;
}

function handleWindowResizeOrScroll()
{
  throttling=false;
  var size = window.getSize();

  $$('img.wh-delayed-load[data-delayed-src]').each(function(node)
    {
      var rect = node.getBoundingClientRect();
      if(rect.bottom < 0 || rect.right < 0 || rect.left > size.x || rect.top > size.y)
        return;

      node.set('src', node.getAttribute('data-delayed-src'));
      node.removeAttribute("data-delayed-src");
    });
}

window.addEvent("scroll", onWindowResizeOrScroll);
window.addEvent("resize", onWindowResizeOrScroll);
window.addEvent("domready", function()
  {
    $(document.body).addEvent("wh-layoutchange", onWindowResizeOrScroll);
    onWindowResizeOrScroll();
  });

})(document.id); //end mootools wrapper
