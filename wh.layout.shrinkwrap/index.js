/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
require ('wh.layout.measure');
/*! LOAD: wh.compat.base
    LOAD: wh.layout.measure
!*/

// Experimental, ask Mark

/*

When a long text doesn't fit on one line and is wordwrapped,
a block element will use the whole width, even though
the wordwrapped text doesn't use the whole width.
$wh.shrinkwrap can be used to change the width of the element to the width the text actually uses after wordwrapping.

(float cannot always be used for shrinkwrapping because it doesn't stretch up till it's container width.
display: table; might do the same (FIXME: check pro's and con's of both solutions))

*/

(function($) {

if(!window.$wh) window.$wh={};

$wh.shrinkwrap =
    function shrinkwrap(node, options)
    {
      if (!options)
        options = {};
      //options.debug=true;

      //var contentnode = node.getElement(".wh-shrinkwrap-content");
      var contentnode = node.querySelector(".wh-shrinkwrap-content");
      if (!contentnode)
      {
        console.error("Missing content node");
        return;
      }

      if (!document.createRange)
      {
        console.warn("$wh.shrinkwrap is not supported in this browser");
        return;
      }

      // setStart is amount of children for block's and chars for inline elements
      var bounds = $wh.getElementTextualContentBounds(contentnode, options.debug);
      //console.log(bounds);

      //var textcontentwidth = bounds.width;
      //console.log("Content size:", bounds.width, "x", bounds.height);

      // round up (also prevents Safari from getting into rounding issues which cause elements after
      // our node to 'dance')
      node.style.width = Math.ceil(bounds.width) + "px";

      if (options.affect_height)
        node.style.height = Math.ceil(bounds.height) + "px";

      if (options.debug)
        $wh.drawTextualContentBounds2(node);
    }

})(document.id);
