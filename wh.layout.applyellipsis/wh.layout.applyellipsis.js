/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.element.measure');
require ('wh.layout.measure');
/*! LOAD: frameworks.mootools.core, frameworks.mootools.more.element.measure
    LOAD: wh.layout.measure
!*/


/*
B-Lex 2013

How to use:
- set a max-height, and possibly a max-width using CSS
- use overflow: hidden (not really needed for this to work, but your page won't get all messy if JavaScript fatally fails)

Basic usage:

- single:
$wh.applyEllipsisToText($("myelement"))

- multiple example:
$$(".applyellipsis").each( function(element) { $wh.applyEllipsisToText(element); } );

Options:
{ debug:     true / false
, maxheight: numeric, "css_maxheight" or "contentheight"
, maxlines:  <numeric>
}



- measuring is done either directly on inline elements or by getting a range on the first (text)node within a block element
  (in Firefox it's also possible to get a box quad for textual content in a block element)



Work to be done:
FIXME: use height or lines in calculation to determine how many chars to try next
FIXME: can we use ranges if available to get a better estimate of the amount of lines and how much chars to remove?
ADDME: use ranges to check how many lines the text occupies in order to get an better estimate of where to cut
FIXME: work out if there's a way to measure without changing overflow
FIXME: smarter way to handle text lines bleeding out of their container instead of adding a % of the line-height (or a setting to disable using these extra px's)
*/

(function($) {

if(!window.$wh) window.$wh={};


/** @short restore original text content
*/
$wh.removeEllipsisFromText = function applyEllipsisToText(container_or_elements)
{
  var sourcetype = typeOf(container_or_elements);
  var multiple = sourcetype == /*MooTools*/"elements" || sourcetype == /*HTML*/"collection";
  var elements = multiple ? container_or_elements : [container_or_elements];

  for (var idx = 0; idx < elements.length; idx++)
  {
    var container = elements[idx];
    if (container == null)
    {
      console.warn("$wh.removeEllipsisFromText got a null as element.");
      continue;
    }

    if ("originalTextContent" in container)
    {
      textcontent = container.originalTextContent;
      container.set("text", textcontent);
    }
  }
}



$wh.applyEllipsisToText = function applyEllipsisToText(container_or_elements, options)
{
  if (!options)
    options = {};

  // options.maxheight = "css_maxheight" / "height" / "containerheight" / "lines"
  if (!("maxheight" in options) && !("maxlines" in options))
    options.maxheight = "contentheight";

  if (!("break_on_words" in options))
    options.break_on_words = true;

  var use_maxheight = "maxheight" in options;

  if (options.debug)
    console.group(container_or_elements);

  /*
  .querySelectorAll() -> "collection"
  $$() (mootools)     -> "elements"
  .getElement() (geen match) -> null
  .querySelector() (geen match) -> null
  */

  var sourcetype = typeOf(container_or_elements);
  var multiple = sourcetype == /*MooTools*/"elements" || sourcetype == /*HTML*/"collection";
  var elements = multiple ? container_or_elements : [container_or_elements];

  for (var idx = 0; idx < elements.length; idx++)
  {
    var container = elements[idx];
    if (container == null)
    {
      console.warn("$wh.applyEllipsisToText got a null as element.");
      continue;
    }

    var orig_overflow_value;
    if (use_maxheight)
    {
      orig_overflow_value = container.style.overflow;
      container.style.overflow = "auto"; // so scrollHeight returns the full content height instead of clientHeight

      $wh.__applyEllipsisToText(container, options);

      if (orig_overflow_value != "auto")
        container.style.overflow = orig_overflow_value;
    }
    else
      $wh.__applyEllipsisToText(container, options);

  }

  if (options.debug)
    console.groupEnd();
}

$wh.__applyEllipsisToText = function applyEllipsisToText(container, options)
{
  var use_maxheight = "maxheight" in options;

  if (options.debug)
    console.log(container);
  //  console.log(container.clientHeight, container.getComputedSize());


  var origminheight;

  var currentnode = container;
  // restore now
  // - otherwise IE can erroneously report a very small clientHeight
  // - ...
  if ("originalTextContent" in currentnode)
  {
    textcontent = currentnode.originalTextContent;
    currentnode.set("text", textcontent);
  }


  if (typeof options.maxheight == "string")
  {
    switch(options.maxheight)
    {
      // usefull in case of:
      // - element has a fixed height
      // - element is sized using absolute+top+bottom
      case "contentheight":
        //var csize = container.getComputedSize();
        options.maxheight = container.clientHeight; //container.getComputedSize().height;
        if (container.clientHeight == 0)
          console.log("apply ellipsis failed to measure. (no height specified and using a custom webfont in webkit engine?)");
        break;

      case "css_maxheight":
        var csize = container.getComputedSize();
        options.maxheight = container.getStyle("max-height").toInt() + (csize.totalHeight - csize.height);
        //console.info( "maxheight: "+container.getStyle("max-height").toInt() + " computedcontainersize: "+csize.totalHeight+" / "+csize.height);
        break;

      // Possible future options below:

      //case "prevent_overflow"
      // - in case the parentNode or given element overflows,
      //   attempt to cut off part of the text so as to not overflow

      //case "prevent_node_overflowing"
      // - prevent this node from overflowing (we don't care content below this might overflow)
    }

    if (options.debug)
      console.log("Calculated maxheight: "+options.maxheight);
  }
  else if (typeof options.maxheight == "number")
  {
    // add padding-top & -bottom so we can use scrollHeight for measurement
    var csize = container.getComputedSize();

    if (options.debug)
      console.log(csize.totalHeight, csize.height);

    options.maxheight += csize.totalHeight - csize.height;
  }

  if (use_maxheight)
  {
    // use 25% of the line-height to allow some bleeding of the fonts outside of it's bounding client rect
    var lineheightval = container.getComputedStyle("line-height");

    var maxoverflow;
    if (lineheightval == "normal")
    {
      // "normal"
      maxoverflow = parseInt( container.getComputedStyle("font-size") ) * 0.3;
    }
    else if (lineheightval.substring(lineheightval.length, lineheightval.length - 2) == "px")
    {
      // "...px"
      maxoverflow = parseInt(lineheightval) * 0.3;
    }
    //else (pt / % / ...)
    else
    {
      maxoverflow = 3; // FIXME
    }

    options.maxheight += maxoverflow;

    if (options.debug)
      console.log("Enlarged maxheight: "+options.maxheight);

    // FIXME: should not happen
    if (isNaN(options.maxheight))
    {
      console.error("Failure, determined maxheight is NaN.");
      return;
    }
  }

  var range;
  if (options.maxlines && container.getStyle("display") != "inline")
  {
    //console.warn("maxlines ellipsis only works on inline elements.", container);
    range = document.createRange();
    range.selectNode(container.childNodes[0]);
  }

  var textheight;
  var textcontent;

  if (!("originalTextContent" in currentnode))
  {
    // Workaround for problems arising from people forgetting
    // it's required to use plaintext for this function
    if (container.childNodes.length > 1 || (container.firstChild && container.firstChild.nodeType != 3))
    {
      //console.info(container.innerHTML);

      var node = container.firstChild;
      var haselem = false;
      while(node)
      {
        if (node.nodeType == 1)
        {
          haselem = true;
          console.log(node);
          break;
        }

        node = node.nextSibling;
      }

      if (haselem)
      {
        console.warn("applyEllipsisToText encountered non-text content.")
        // force content to all-text before our first measurement
        currentnode.set("text", currentnode.get("text"));
      }
      else
        console.warn("Having more than one text node is not recommended.", container);
    }

    // chop up the textual content
    // (don't use HTML, use otherwise whe'll have to deal with HTML entities and prevent cutting entities in half)
    textcontent = currentnode.get("text");//currentnode.textContent;
    currentnode.originalTextContent = textcontent;
  }




  // Does the element content already confirm to demands?
  var fits = true;

  //if (options.debug)
  //  console.log("Lines: ", $wh.countLinesInElement(currentnode));
//console.info( $wh.countLinesInElement(range ? range : currentnode) + " lines in ", currentnode);


  if (options.maxlines && $wh.countLinesInElement(range ? range : currentnode) > options.maxlines)
    fits = false;

  if (use_maxheight)
  {
    /*
    var rect = currentnode.getBoundingClientRect();
    var textheight = rect.bottom-rect.top;
    */

    // in case height/maxHeight is used, we can measure using scrollHeight
    // this way whe'll have a lot less reflows going on
    //  currentnode.style.overflow = "auto";
    var textheight = currentnode.scrollHeight;

    if (textheight > options.maxheight)
      fits = false;
  }


  if (fits)
  {
    if (options.debug)
      console.log("No need to apply ellipsis.");

    return;
  }


  if (use_maxheight)
  {
    if (options.debug)
    {
      console.info("Current height is "+textheight);
      //console.log("Gonna chop up ", currentnode);
      //console.log("It's original text ", currentnode.originalTextContent);
    }

    var origheight = container.getStyle("height");
    origminheight = container.getStyle("minheight");
    container.style.height = "";
    container.style.minHeight = "";
  }


  // find the max amount of chars that will fit
  var textlength = textcontent.length;
  var trylength = Math.round(textlength / 2);

  var lowest_known_bad = textlength;
  var highest_ok = -1;

  var finished = false;
  var countdown = 100; // shouldn't be necessary but to prevent getting stuck if there's a bug in the logic

  while (!finished && countdown-- > 0)
  {
    var newtextcontent = textcontent.substr(0, trylength) + "\u2026";

    //currentnode.textContent = newtextcontent;
    currentnode.set("text", newtextcontent);

    fits = true;

console.info( $wh.countLinesInElement(range ? range : currentnode) + " lines in ", currentnode);

    if (options.maxlines && $wh.countLinesInElement(range ? range : currentnode) > options.maxlines)
      fits = false;

    if (use_maxheight)
    {
      /*
      var rect = currentnode.getBoundingClientRect();
      var textheight = rect.bottom-rect.top;
      */

      // in case height/maxHeight is used, we can measure using scrollHeight
      // this way whe'll have a lot less reflows going on
      //  currentnode.style.overflow = "auto";
      var textheight = currentnode.scrollHeight;

      if (textheight > options.maxheight)
        fits = false;
    }

    if (fits) //textheight <= options.maxheight)
    {
      if (options.debug)
        console.log(trylength+" chars FITS"); //is "+(textheight)+"px high (FITS)");

      if (trylength > highest_ok)
        highest_ok = trylength;
    }
    else
    {
      if (options.debug)
        console.log(trylength+" chars is TOO LARGE"); //+(textheight)+"px high (TOO LARGE)");

      if (trylength < lowest_known_bad)
        lowest_known_bad = trylength;
    }

    if (lowest_known_bad - highest_ok <= 1 || trylength == 0) // FIXME: rewrite to not need trylength==0 ??
    {
      finished = true;
    }
    else
    {
      trylength = Math.round(highest_ok + (lowest_known_bad - highest_ok) / 2);

      if (options.debug)
        console.log("Next length must between "+highest_ok+" en "+lowest_known_bad+", we gaan voor "+trylength);
    }
  }

  //if (finished)
  //  console.info("Succes, length will be ", highest_ok);

  if (highest_ok == 0)
  {
    // although the node is partially visible, it is too small to fit content(+ellipsis)
    currentnode.setStyle("visibility", "hidden");
    return false; // failed to apply ellipsis
  }

  uselength = highest_ok;

  if (options.break_on_words)
  {
    // cut away words that were cut in half (check whether the first char which was left off was a " ")
    // +1 so in case that we already got the last char of a word, we don't cut it off
    var space_pos = textcontent.lastIndexOf(" ", highest_ok); // find the last space
    var break_pos = textcontent.lastIndexOf("-", highest_ok); // find a break within a word
    var newline_pos = textcontent.lastIndexOf("\n", highest_ok); // find a newline (it's treated as/normalized to a space in HTML)

    if (break_pos > -1)
      break_pos++; // include the - before the ellipsis

    var last_break = -1;
    if (space_pos != -1)
      last_break = space_pos;

    if (break_pos != -1 && break_pos > last_break)
      last_break = break_pos;

    if (newline_pos != 1 && newline_pos > last_break)
      last_break = newline_pos;

    if (last_break > -1)
      uselength = last_break;
    //else
    //  uselength = 0;
  }

  newtextcontent = textcontent.substr(0, uselength) + "\u2026"; // "…";
  //currentnode.textContent = newtextcontent;
  currentnode.set("text", newtextcontent);

  if (options.debug)
  {
    var rect = currentnode.getBoundingClientRect();
    console.info(uselength + " chars is "+rect.width+" x "+rect.height);
  }

  // restore original minheight
  //container.style.minHeight = origminheight;
  if (origminheight !== "")
    container.setStyle("minHeight", origminheight);

  return true; // succesfully applied ellipsis
};


//console.log( $wh.countLinesInElement( $("blaat") ) );




})(document.id);
