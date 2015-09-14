/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
/*! LOAD: frameworks.mootools.core, wh.compat.base !*/

/* Attaches events and page views to elements.

   For page views: (still needs to be built)

   - data-ga-page="/path/to/file"

   For events:

   - data-ga-category="category"
   - data-ga-action="action"
   - optional: data-ga-label="label"
   - optional: data-ga-value="5" (Number, values must be non-negative)

   Debug options:

   $wh.debug.anl (logs events and pageviews)
*/

if ($wh.requestLinkerUrl && $wh.config.dtaptype != 'production')
  console.warn("wh.social.analytics is deprecated if the google analytics <webdesign> plugin is used; remove the LOAD wh.google.analytics from your JS file");

(function($) { //mootools wrapper
"use strict";

//https://developers.google.com/analytics/devguides/collection/analyticsjs/events
//https://developers.google.com/analytics/devguides/collection/analyticsjs/pages

var wh_ga_code;

function onGaEventClick(event)
{
  var totrack = event.target.getSelfOrParent('*[data-ga-category]');
  if(!totrack)
    return;

  var category = totrack.getAttribute('data-ga-category');
  var action = totrack.getAttribute('data-ga-action');

  var error = checkErrorForEvent(totrack);
  if (error != "")
  {
    console.error(error);
    return;
  }

  $wh.trackAnalyticsEvent(category
                        , action
                        , totrack.getAttribute("data-ga-label")
                        , totrack.getAttribute("data-ga-value"));
}

// returns error message, or empty string if no error
function checkErrorForEvent(element)
{
  var category = element.getAttribute('data-ga-category');
  var action = element.getAttribute('data-ga-action');

  if (!category || category == "")
    return "'data-ga-category' is required for Analytics events";

  if (!action || action == "")
    return "'data-ga-action' is required for Analytics events";

  // 'value' must be an integer
  var value = element.getAttribute('data-ga-value');
  if (value && typeof(value) != "number")
    return "'data-ga-value' must be a positive number";

  return "";
}

//returns unique rows
function getUniqueObjects(arr, props)
{
  function compare(a, b)
  {
    var prop;
    if (props)
    {
      for (var j = 0; j < props.length; j++)
      {
        prop = props[j];
        if (a[prop] != b[prop])
        {
          return false;
        }
      }
    }
    else
    {
      for (prop in a)
      {
        if (a[prop] != b[prop])
          return false;
      }
    }
    return true;
  }

  return arr.filter(function (item, index, list)
  {
    for (var i = 0; i < index; i++)
    {
      if (compare(item, list[i]))
        return false;
    }
    return true;
  });
};

$wh.generateAnalyticsOverview = function()
{
  var events = $$('*[data-ga-category]');
  var gaevents = [];

  events.each(function(eventcontainer)
  {
    var error = checkErrorForEvent(eventcontainer);
    if (error != "")
    {
      console.group();
      console.error(error);
      console.error("DOM element:");
      console.error(eventcontainer);
      console.groupEnd();
      return true;
    }

    var category = eventcontainer.getAttribute("data-ga-category");
    var action = eventcontainer.getAttribute("data-ga-action");
    var label = eventcontainer.getAttribute("data-ga-label");
    var value = eventcontainer.getAttribute("data-ga-value");

    gaevents.push({ "category": category
                  , "action": action
                  , "label": label
                  , "value": value
                  , el: eventcontainer
                  });
  });

  gaevents = getUniqueObjects(gaevents, ["category","action","label","value"]);

  if (typeof(console.table) == "undefined")
  {
    var logevents = [];
    gaevents.each(function(event)
    {
      logevents.push({ "category": event.category
                     , "action": event.action
                     , "label": event.label
                     , "value": event.value ? event.value : ""
                     });
    });

    console.table(logevents, ["category","action","label","value"]);
  }
  else
  {
    gaevents.each(function(event)
    {
      console.info("Category: '" + event.category + "', "
                 + "Action: '" + event.action + "', "
                 + "Label: '" + event.label + "', "
                 + "Value: '" + (event.value ? event.value : "") + "'");
    });
    console.log("[anl] " + gaevents.length + " events prepared");
  }

  if ($wh.PopupManager)
  {
    //setup popup
    var eventstable = new Element("table");
    eventstable.setAttribute("border",1);
    eventstable.setAttribute("cellspacing",0);
    eventstable.setAttribute("cellpadding",6);
    var firstrow = new Element("tr");
    firstrow.adopt(new Element("th", { "text": 'category' })
                  ,new Element("th", { "text": 'action' })
                  ,new Element("th", { "text": 'label' })
                  ,new Element("th", { "text": 'value' })
                  );
    eventstable.adopt(firstrow);

    gaevents.each(function(event)
    {
      var newrow = new Element("tr");
      newrow.adopt(new Element("td", { "text": event.category })
                  ,new Element("td", { "text": event.action })
                  ,new Element("td", { "text": event.label })
                  ,new Element("td", { "text": event.value ? event.value : "" })
                  );
      eventstable.adopt(newrow);
    });

    $wh.PopupManager.createFromElement(eventstable);
  }
}

// https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
$wh.trackAnalyticsPageView = function(page, options)
{
  if (page != "")
  {
    if (page.substring(0,1) != "/")
      page = "/" + page;
  }

  if (page == "")
  {
    if ($wh.debug.anl)
      console.log("[anl] Track page view ''");

    ga('send', 'pageview');//FIXME: or error?
  }
  else
  {
    if (options)
    {
      var ga_options = { 'page': page };
      if (options.title != "")
        ga_options.title = options.title;

      if ($wh.debug.anl)
        console.log("[anl] Track page view '" + page + "'' with options", ga_options);

      ga('send', 'pageview', ga_options);
    }
    else
    {
      if ($wh.debug.anl)
        console.log("[anl] Track page view '" + page + "'");

      ga('send', 'pageview', page);
    }
  }
}

$wh.trackAnalyticsEvent = function(category, action, label, value)
{
  //fixme: checkvalue, must be >0
  //FIXME: use general error check function

  if (!category || category == "")
  {
    console.error("wh.google.analytics: 'category' is required");
    return;
  }

  if (!action || action == "")
  {
    console.error("wh.google.analytics: 'action' is required");
    return;
  }

  if ($wh.debug.anl)
    if (value > 0)
      console.log("[anl] Track event category = '" + category + "', action = '" + action + "', label = '" + label + "', value = '" + value + "'");
    else
      console.log("[anl] Track event category = '" + category + "', action = '" + action + "', label = '" + label + "'");

  if (value > 0)
    ga('send', 'event', category, action, label, value);
  else if (label != "")
    ga('send', 'event', category, action, label);
  else
    ga('send', 'event', category, action);
}

//our $wh.track implementation
function trackEvent(category, action, label, options)
{
  var opts = { nonInteractive: false
             , hitCallback: null
             };

  var value = options && typeof options.value == 'number' ? options.value : 0;
  if(options && options.callback)
    opts.hitCallback = options.callback;
  if(options && options.noninteractive)
    opts.nonInteractive = true;

  if ($wh.debug.anl)
    if (value > 0)
      console.log("[anl] Track event category = '" + category + "', action = '" + action + "', label = '" + label + "', value = " + value);
    else
      console.log("[anl] Track event category = '" + category + "', action = '" + action + "', label = '" + label + "'");

  if (value > 0)
    ga('send', 'event', category, action, label, value, opts);
  else
    ga('send', 'event', category, action, label, opts);
}

function initializeAnalytics()
{
  wh_ga_code = $wh.config["socialite:analytics"].code;
  window.addEvent('click', onGaEventClick, true); //legacy GA/UA-specific events
  if($wh.debug.anl)
    console.log("[anl] Universal Analytics activated: code = " + wh_ga_code);

  //ADDME allow us to prevent receiving default actions?
  $wh.setDefaultTracker(trackEvent);
}

//$wh.analytics = null;
if($wh.config["socialite:analytics"])
  window.addEvent("domready", initializeAnalytics);

})(document.id); //end mootools wrapper
