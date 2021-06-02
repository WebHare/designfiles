/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
/*! LOAD: wh.compat.base
!*/

// Experimental, ask Mark

(function($) {

if(!window.$wh) window.$wh={};

// for debugging/$wh.drawTextualContentBounds
var __dbgoverlays = [];


/** @short textual content bounds using BoundingClientRect's from a range
*/
$wh.drawTextualContentBounds =
    //function getElementContentBounds(mynode, debug)
    function drawTextualContentBounds(mynode, debug)
    {
      if (!document.createRange)
      {
        console.warn("$wh.getElementContentWidth is not supported in this browser");
        return;
      }

      var theRange = document.createRange();

      theRange.selectNode( mynode );

      colorlist = [ "rgba(255,0,0,0.5)"
                  , "rgba(0,255,0,0.5)"
                  , "rgba(0,0,255,0.5)"
                  , "rgba(255,255,0,0.5)"
                  , "rgba(0,255,255,0.5)"
                  , "rgba(255,0,255,0.5)"
                  , "rgba(255,128,0,0.5)"
                  ];

      for (var idx = 0; idx < mynode.childNodes.length; idx++)
      {
        var thenode = mynode.childNodes[idx];
        //console.log(idx, thenode);

        //theRange.selectNode( mynode );
        theRange.setStart(mynode, idx);
        theRange.setEnd(mynode, idx+1);

        var rect;
        if (thenode.nodeType == 1) // element
        {
          rect = $wh.drawTextualContentBounds(thenode, debug);
          //console.log("Width of child elem ", thenode, " is ", subwidth);
        }
        else
        {
          var rect = theRange.getBoundingClientRect();
          /*
          console.log( "Node #"+idx
                     , rect.top.toFixed(0)
                     , rect.left.toFixed(0)
                     , rect.bottom.toFixed(0)
                     , rect.right.toFixed(0)
                     , thenode);
          */
          var bordersize = 1;

          var temp = __dbgoverlays.getByProperty("node", mynode);
          var overlay;
          if (temp)
          {
            overlay = temp.overlay;
          }
          else
          {
            overlay = document.createElement("div");
            __dbgoverlays.push({ node: mynode
                               , overlay: overlay
                               });
          }

          overlay.style.position = "absolute";
          overlay.style.left = (rect.left - bordersize) + "px";
          overlay.style.top = (rect.top - bordersize) + "px";
          overlay.style.width = (rect.width - bordersize*2) + "px";
          overlay.style.height = (rect.height - bordersize*2) + "px";
          //overlay.style.backgroundColor = colorlist[ idx % colorlist.length ]; //"rgba(128,128,128,0.25)";
          overlay.style.border = "2px solid "+colorlist[ idx % colorlist.length ];
          overlay.style.pointerEvents = "none";
          overlay.style.zIndex = 99999;
          document.body.appendChild(overlay);
        }
      }
    }

/** @short textual content bounds from getClientRect's on an inline element
*/
$wh.drawTextualContentBounds2 =
    //function getElementContentBounds(mynode, debug)
    function drawTextualContentBounds(mynode, debug)
    {
      colorlist = [ "rgba(255,0,0,0.5)"
                  , "rgba(0,255,0,0.5)"
                  , "rgba(0,0,255,0.5)"
                  , "rgba(255,255,0,0.5)"
                  , "rgba(0,255,255,0.5)"
                  , "rgba(255,0,255,0.5)"
                  , "rgba(255,128,0,0.5)"
                  ];

// FIXME: add scrollposition

      for (var idx = 0; idx < mynode.childNodes.length; idx++)
      {
        var thenode = mynode.childNodes[idx];

        if (thenode.nodeType == 1)
        {
          console.log(mynode, "/", thenode);
          $wh.drawTextualContentBounds2(thenode, debug);
        }
      }

      if (mynode.getStyle("display") != "inline")
      {
        console.info(mynode, "NOT INLINE");
        return;
      }

      var rects = mynode.getClientRects();

      console.info(mynode, "has", rects.length, "rects");

      for(var idx = 0; idx < rects.length; idx++)
      {
        //console.log(rects[idx]);
        rect = rects[idx];

        var overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.left = (rect.left) + "px";
        overlay.style.top = (rect.top) + "px";
        overlay.style.width = rect.width + "px";
        overlay.style.height = rect.height + "px";
        overlay.style.backgroundColor = colorlist[ idx % colorlist.length ]; //"rgba(128,128,128,0.25)";
        overlay.style.border = "2px solid "+colorlist[ idx % colorlist.length ];
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = 99999;
        document.body.appendChild(overlay);
      }
    }



$wh.getElementTextualContentBounds =
    //function getElementContentBounds(mynode, debug)
    function getElementTextualContentBounds(mynode, debug)
    {
      var left = null
        , right = null
        , top = null
        , bottom = null;

      if (!document.createRange)
      {
        console.warn("$wh.getElementContentWidth is not supported in this browser");
        return;
      }

      var theRange = document.createRange();

      theRange.selectNode( mynode );

      colorlist = [ "rgba(255,0,0,0.5)"
                  , "rgba(0,255,0,0.5)"
                  , "rgba(0,0,255,0.5)"
                  , "rgba(255,255,0,0.5)"
                  , "rgba(0,255,255,0.5)"
                  , "rgba(255,0,255,0.5)"
                  , "rgba(255,128,0,0.5)"
                  ];

      for (var idx = 0; idx < mynode.childNodes.length; idx++)
      {
        var thenode = mynode.childNodes[idx];
        //console.log(idx, thenode);

        //theRange.selectNode( mynode );
        theRange.setStart(mynode, idx);
        theRange.setEnd(mynode, idx+1);

        var rect;
        if (thenode.nodeType == 1) // element
        {
          rect = $wh.getElementTextualContentBounds(thenode, debug);
          //console.log("Width of child elem ", thenode, " is ", subwidth);
          rect.elem = true;
        }
        else
        {
          var rect = theRange.getBoundingClientRect();
          /*
          if (debug)
          {

            var overlay = document.createElement("div");
            overlay.style.position = "absolute";
            overlay.style.left = rect.left + "px";
            overlay.style.top = rect.top + "px";
            overlay.style.width = rect.width + "px";
            overlay.style.height = rect.height + "px";
            //overlay.style.backgroundColor = colorlist[ idx % colorlist.length ]; //"rgba(128,128,128,0.25)";
            overlay.style.border = "2px solid "+colorlist[ idx % colorlist.length ];
            document.body.appendChild(overlay);
          }
          */
        }

        if (rect.left == null) // returned by getElementTextualContentBounds on a empty/non-visible node
          continue;

        // skip nodes which don't have visible content
        // (otherwise they'll reset our left and top to 0)
        if (rect.left == 0 && rect.right == 0 && rect.top == 0 && rect.bottom == 0)
          continue;

        if (debug)
        {
          console.log( "Node #"+idx
                     , rect.top.toFixed(0)
                     , rect.left.toFixed(0)
                     , rect.bottom.toFixed(0)
                     , rect.right.toFixed(0)
                     , thenode);
        }

        if (left === null || rect.left < left)
          left = rect.left;

        if (right === null || rect.right > right)
          right = rect.right;

        if (top === null || top.left < top)
          top = rect.top;

        if (bottom === null || rect.bottom > bottom)
          bottom = rect.bottom;
      }

      return { left:   left
             , right:  right
             , top:    top
             , bottom: bottom
             , width:  right - left
             , height: bottom - top
             };
    }



/** @short count the amount of lines within an inline element
*/
$wh.countLinesInElement = function countLinesInElement(node)
{
  // Try to use .getBoxQuads() since it'll return the bounds of text lines for both inline elements and textNodes
  // (otherwise fall back to getClientRects() which will only return bounds for lines for inline elements
  if (node.getBoxQuads)
    return node.getBoxQuads().length;

  var rects = node.getClientRects();

  // Firefox returns a rects for each line,
  // Chrome can return multiple rects per line
  var lines = 0;
  for (var idx = 0; idx < rects.length; idx++)
  {
    if (idx == 0 || rects[idx-1].top != rects[idx].top)
      lines ++;
  }
  return lines;
}


})(document.id);
