/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.locale');
/*! LOAD: frameworks.mootools.core, frameworks.mootools.more.locale
!*/

(function($) { //mootools wrapper

var decodeHtmlEntity = function(str)
{
  return str.replace(/&#(\d+);/g, function(match, dec) { return String.fromCharCode(dec); });
};

/// Conditional decode from HTML
$wh.__condDecodeFromHTML = function(rich, text)
{
  return rich ? text : text.decodeFromHtml();
}

$wh.getTid = function(tid, p1, p2, p3, p4)
{
  if (tid.indexOf(":") == -1)
    throw new Error("Missing module name in call for tid '" + tid + "'");
  var args = Array.map(arguments, function(item) { return item + ""; }); // convert p1-p4 to strings
  args[0] = false; // not rich
  return Locale.get("Tid." + tid, args) || "(cannot find text: " + tid + ")";
}

$wh.getRichTid = function(tid, p1, p2, p3, p4)
{
  if (tid.indexOf(":") == -1)
    throw new Error("Missing module name in call for tid '" + tid + "'");
  var args = Array.map(arguments, function(item) { return item + ""; }); // convert p1-p4 to strings
  args[0] = true; // rich
  return Locale.get("Tid." + tid, args) || "(cannot find text: " + tid.encodeAsHTML + ")";
}

if ($wh.config && $wh.config.locale)
  Locale.use($wh.config.locale);


$wh.convertElementTids = function()
{
  // Guard against running before domready
  if (!document.body)
    return;

  Array.forEach(document.body.querySelectorAll("*[data-texttid]"), function(node)
  {
    node.textContent = $wh.getTid/*nocheck*/(node.getAttribute("data-texttid"));
  });
}

// Set language from $wh.config
if ($wh.config.locale)
{
  Locale.use($wh.config.locale);

  // Convert attribute-driven tids when running in a webbrowser
  if (typeof window != "undefined")
    window.addEvent("domready", $wh.convertElementTids);
}

// Auto-convert attribute-driven tids on locale changes
if (typeof window != "undefined")
  Locale.addEvent("change", $wh.convertElementTids);

})(); //end function scope guard
