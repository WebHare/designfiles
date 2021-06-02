/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.compat.base');
/*! LOAD: wh.compat.base
!*/



/*
B-Lex 2013

What it does:
$wh.makeColumnsEqual makes blocks in a row (or whole grid) of the same height,
  while keeping the same flow.

Notes:
- the amount of columns aren't fixed,
  this code does not care about how many items there are on a row.
  It only cares about getting every block within a row, or all blocks in the grid, of the same height.

How to use:
-
-

options:
- perrow - whether to equalize the height of blocks per row or make them equal across the whole grid
-

Features:
- strips away textnodes which create space between inline-block's on our grid

ADDME: ability to (auto)resize again later
ADDME: ability to autoresize when detecting an image load
ADDME: extend the concept to allow setting a max-height and having an expand/implode button
ADDME: optimize by grouping reading and writing actions

*/

// takes a container of blocks and fixes their height (for each row, sets the highest block height to all cols)
(function($) {

if(!window.$wh) window.$wh={};

function fixBlocks(blockqueue, options, setheight)
{
  if (options.debug)
    console.log("Applying", options.property ,"of", setheight, "to", blockqueue);

  setheight = Math.ceil(setheight);
  Array.each(blockqueue, function(item)
  {
    var thisheight = setheight;
    /*if ( (options.property == "minHeight" || options.property == "height") && item.block.getStyle('box-sizing') == 'border-box')
    {
      thisheight += item.dim["padding-top"] + item.dim["padding-bottom"] + item.dim["border-top-width"] + item.dim["border-bottom-width"];
    }*/
    $(item.block).setStyle(options.property, thisheight);
  });
}

$wh.makeColumnsEqual = function makeColumnsEqual(container_or_elements, options)
{
  var finoptions = { perrow: true
                   , debug:  false
                   , property: "minHeight" // "height", "lineHeight", "minHeight"
                   };
  Object.append(finoptions, options);
  options = finoptions;

  if (options.debug && document.readyState != "complete")
    console.warn("Using $wh.makeColumnsEqual before onload may give unexpected results\n(for example in combination with images and custom fonts)");

  var blocks, container, amount_of_blocks;
  if (typeOf(container_or_elements) == "element")
  {
    blocks = container_or_elements.getElements(".block");
    amount_of_blocks = blocks.length;

    container = container_or_elements;

    // strip away comments which are empty when trimmed (newlines, spaces, tabs)
    var node = container.firstChild;
    while(node)
    {
      var nextnode = node.nextSibling;

      // note:  \S also includes non-breaking spaces, so whe'll specify a list of chars to trim
      if (node.nodeType == 3 && !(/[^\t\n\r ]/.test(node.nodeValue)))
        container.removeChild(node);

      node = nextnode;
    }
  }
  else if (typeOf(container_or_elements) == "elements")
  {
    blocks = container_or_elements;
    amount_of_blocks = blocks.length;

    for (var i = 0; i < amount_of_blocks; i++)
    {
      var colblock = blocks[i];
      var prev = colblock.previousSibling;
      var next = colblock.nextSibling;

      //console.log(colblock, prev, next);

      if (prev && prev.nodeType == 3 && !(/[^\t\n\r ]/.test(prev.nodeValue)))
        prev.parentNode.removeChild(prev);

      if (next && next.nodeType == 3 && !(/[^\t\n\r ]/.test(next.nodeValue)))
        next.parentNode.removeChild(next);
    }
  }

  var blockqueue = [];
  var firstblockinrow_pos = null;


  //for (var i = 0; i < amount_of_blocks; i++)
  //  blocks[i].setStyle(property, "");


  //console.group("makeColumnsEqual", container);

  // for each row, get the highest block; set the max height to all blocks in this row
  var largestheight = 0;
  for (var idx = 0; idx < amount_of_blocks; idx++)
  {
    var colblock = blocks[idx];
    var blockpos = colblock.getBoundingClientRect();
    if (options.debug)
    {
      console.log( //"topy:",    Math.round(blockpos.top)
                 //,"bottomy:", Math.round(blockpos.bottom)
                   "height:",  Math.ceil(colblock.scrollHeight)
                 , "node:",    colblock
                 );
    }

    if (blockqueue.length == 0)
    {
      firstblockinrow_pos = blockpos;

      // FIXME: add scrollpos to get real y pos on page
      if (options.debug)
        console.log("This block starts on a new row (at ypos "+Math.round(firstblockinrow_pos.top)+")");

      largestheight = colblock.scrollHeight;
    }
    else
    {
      if (options.perrow && blockpos.left < firstblockinrow_pos.right)
      {
        //console.log("new row");
        fixBlocks(blockqueue, options, largestheight);
        blockqueue = [];
        largestheight = 0;
        firstblockinrow_pos = blockpos;
      }

      if (colblock.scrollHeight > largestheight)
        largestheight = colblock.scrollHeight;
    }

    blockqueue.push({block: colblock });
  }
  fixBlocks(blockqueue, options, largestheight);

  //console.groupEnd();
};

})(document.id);
