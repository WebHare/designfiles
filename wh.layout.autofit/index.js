/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
/*! LOAD: frameworks.mootools
!*/


/*
B-Lex 2013-2015

How to use:
- wrap the text content in a container
- the text container must have display: inline; or display: inline-block;.
  This way it'll wordwrap within the space it's parent give it,
  but grows bigger if it contains a long word which cannot be text wrapped to the next line.
- Use paddings on the textcontainer (the code doesn't not try to find out and subtract padding to the containersize) if you want to keep the text from touching the edge of your container.
- Make sure the textwrapper can be measures
  (don't have the text be in a part of the DOM with has display: none; because in this case we cannot measure the textcontainer size.)
  If the text to be measures must not be visible yet use: display: block; visibility: hidden;

options:
- minfontsize (default 5)
- maxfontsize (default 100)
- maxwidth - if null=no restriction, "detect" -> use size of container (inner size, so the available space within the padding and borders)
- maxheight - if null=no restriction, "detect" -> use size of container
- verticalalign - true / false / "top" / "middle" / "bottom"
- lineheight - to fix the lineheight for the determined fontsize (best to use a % size, for example: '100%')
- container - override in case the parent of the textcontainer isn't representative of the correct size (for maxwidth/maxheight == "detect") and/or isn't the element in which we have to verticalalign

Use cases:
- stretch to fill up container -> maxheight: "detect"
- make sure a element doesn't get too high by auto-sizing text within a given element -> container: ..., maxheight: ...px

Other notes:
- vertical alignment can be done either by
  option 1) giving the container a :before with display: inline-block; height: <height to align in>
  option 2) use the vertical align option



ADDME: maybe play a little with letter-spacing?
ADDME: maybe an option to, when possible, use transform: scale() and fall back to font-size if nessecary, so both text + other content within the textcontainer can be scaled

Plans for V2:
- combine $wh.makeTextFit and $wh.applyEllipsisToText into a single library
- add a option applyellipsis, so ellipsis is applied when even a minfontsize the text still does not fit
- ability to batch instructions?
- let the user handle vertical alignment using CSS (remove our alignment code)
*/

(function($) {

if(!window.$wh) window.$wh={};

$wh.makeTextFit = function makeTextFit(container_or_elements, options)
{
  if (!options)
    options = {};

  if (options.debug)
  {
//    console.group("$wh.makeTextFit");
    //console.info(container_or_elements);
  }

  var sourcetype = typeOf(container_or_elements);
  var multiple = sourcetype == /*MooTools*/"elements" || sourcetype == /*HTML*/"collection";
  var elements = multiple ? container_or_elements : [container_or_elements];

  for (var idx = 0; idx < elements.length; idx++)
  {
    var container = elements[idx];
    $wh.__makeTextFit(container, options);
  }

 // if (options.debug)
  //  console.groupEnd();
};

$wh.__makeTextFit = function __makeTextFit(textcontainer, options)
{
  var maxwidth
    , maxheight;
  if (!textcontainer)
  {
    console.error("No textcontainer specified.");
    return;
  }

  var measureme = options.container ? options.container : textcontainer;

  var container = options.container ? options.container : textcontainer.parentNode;

/*
  if (textcontainer.getStyle("display") != "inline")
  {
    //console.warn("maxlines ellipsis only works on inline elements.");
    range = document.createRange();
    range.selectNode(container.childNodes[0]);
    measureme = range;
  }
*/
  var stylecontainer = ("stylecontainer" in options) ? options.stylecontainer : textcontainer.parentNode;

  if (options.lineheight)
    stylecontainer.style.lineHeight = options.lineheight; // FIXME


  if (options.debug)
  {
    if (options.container)
      console.log("Using specified container to determine max size of text");
    else
      console.log("Using parentnode of text to determine max size of text");
  }

  //console.log(textcontainer.parentNode, container.clientWidth);
  //console.log(container);

  if (options.maxwidth)
  {
    if (options.maxwidth == "detect")
      maxwidth = container.clientWidth;
    else
      maxwidth = options.maxwidth;
  }

  if (options.maxheight)
  {
    if (options.maxheight == "detect")
      maxheight = container.clientHeight;
    else
      maxheight = options.maxheight;
  }



  if (!("minfontsize" in options))
    options.minfontsize = 5;

  if (!("maxfontsize" in options))
    options.maxfontsize = 100;

  // experimental
  if (!("fontsizethreshold" in options))
  {
    options.fontsizethreshold = (options.maxfontsize - options.minfontsize) / 10;
  }
  if (options.fontsizethreshold < 0.1)
    options.fontsizethreshold = 0.1;



  var tcontent = textcontainer.textContent;
  if (tcontent === undefined)
    tcontent = textcontainer.innerText;


  if (options.debug)
  {
    console.groupCollapsed("$wh.makeTextFit", tcontent.substr(0, 64));
    console.log(textcontainer, options);
    console.log("Max size for text is " + maxwidth + " x " + maxheight);
    console.info(
      { measureme: measureme
      , container: container
      , stylecontainer: stylecontainer
      })
  }



  if (tcontent == "")
  {
    console.warn("Empty text, no need to resize."); // not even a EOL char
    //return; // FIXME: skip resizing code, directly move to vertical alignment code
  }

  // if we aren't visible or there's no text, get the hell out of here!
  var textsize = measureme.getBoundingClientRect();
//console.log(textsize);
  var textwidth;
  var textheight = textsize.bottom - textsize.top;
  if (textheight == 0)
  {
    console.warn("No text, specified textcontainer is inline or display is set to none on textcontainer or it's parents.");

    if (options.debug)
      console.groupEnd();
  }

  // FIXME: are there any smarter ways to quickly determine the correct size?
  // alternate options:
  // - try to determine the correlation between fontsize changes and the textwrapper size to make smarter guesses on which size would be best to use/test next
  var size_ok;

  // get the average fontsize of the min and max
  var largest_known_fitting_fontsize = options.minfontsize;
  var smallest_known_too_large_fontsize = options.maxfontsize;
  var optimal_fontsize;

  // find the largest font-size which still fits
  var steps_used=0;
  do
  {
    var current_fontsize = largest_known_fitting_fontsize + (smallest_known_too_large_fontsize - largest_known_fitting_fontsize)/2;

    stylecontainer.style.fontSize = current_fontsize.toFixed(2) + "px";

    textsize = measureme.getBoundingClientRect();
    textwidth = textsize.right - textsize.left; //textcontainer.scrollWidth;
    textheight = textsize.bottom - textsize.top; //textcontainer.scrollHeight;

    if (options.debug)
      console.log("font-size "+current_fontsize.toFixed(2)+" results in "+textwidth.toFixed(2)+" x "+textheight.toFixed(2));

    if (   (!maxwidth  || textwidth  <= maxwidth)
        && (!maxheight || textheight <= maxheight)
       )
    {
      // note that this fontsize still fits
      if (current_fontsize > largest_known_fitting_fontsize)
        largest_known_fitting_fontsize = current_fontsize;
    }
    else
    {
      if (current_fontsize < smallest_known_too_large_fontsize)
        smallest_known_too_large_fontsize = current_fontsize;
    }

    var fontsize_diff = (smallest_known_too_large_fontsize - largest_known_fitting_fontsize);

    /*
    console.log("Next fontsize to check is between "+largest_known_fitting_fontsize+" and "+smallest_known_too_large_fontsize);
    console.log("fontsize_diff: "+fontsize_diff);
    */
    //if (fontsize_diff < 1 && fontsize_diff > -1)
    if (fontsize_diff < options.fontsizethreshold && fontsize_diff > -options.fontsizethreshold)
      optimal_fontsize = largest_known_fitting_fontsize;

    steps_used++;
  }
  while(steps_used < 100 && !optimal_fontsize)

  // FIXME: contine and use the current fontsize?
  if (steps_used == 100)
    console.error("Could not determine an optimal fontsize or got stuck in a loop.");

  if(options.debug)
    console.log("Optimal fontsize " + optimal_fontsize + " determined in "+steps_used+" steps.");

  stylecontainer.style.fontSize = optimal_fontsize.toFixed(2) + "px";

  // now we can apply vertical alignment
  if (options.verticalalign === true || options.verticalalign === "middle")
  {
    textsize = measureme.getBoundingClientRect();
    textheight = textsize.bottom - textsize.top;

    //var verticaloffset = (container.clientHeight - textcontainer.scrollHeight) / 2;
    var verticaloffset = (maxheight - textheight) / 2;

    if (options.debug)
      console.log("Vertical aligning with a margin-top of ", verticaloffset, "px. ("+maxheight+"-"+textheight+")/2");

    textcontainer.style.marginTop = verticaloffset+"px";
  }
  else if (options.verticalalign === false || options.verticalalign === "top")
  {
    textcontainer.style.marginTop = 0;
  }
  else if (options.verticalalign === "bottom")
  {
    //textcontainer.style.marginTop = (container.clientHeight - textcontainer.scrollHeight)+"px";
    textsize = measureme.getBoundingClientRect();
    textheight = textsize.bottom - textsize.top;
    textcontainer.style.marginTop = (container.clientHeight - textheight)+"px";
  }

  if (options.debug)
    console.groupEnd();
};

})(document.id);
