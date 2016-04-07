/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
/*! LOAD: frameworks.mootools.core !*/

window._gaq=window._gaq_gaq || [];
window.GoogleAnalyticsObject='ga';
if(!window.ga)
{
  window.ga = function() { window.ga.q.push(arguments); }
  window.ga.q = [];
}

if(!window.$wh) window.$wh={};

(function($) { //mootools wrapper

var linkerbase = null;
var classicscriptloaded = false;
var universalscriptloaded = false;
var didautotrackevents = false;
var trackers=[];

var debuggoogle = location.href.indexOf('wh-ga-debug')!=-1    || Cookie.read("wh-ga-debug");
var debugevents = location.href.indexOf('wh-ga-events')!=-1   || Cookie.read("wh-ga-events");

// for cross-domain tracking of links
//https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiDomainDirectory
function interceptLinkForGoogle(basename, event, el)
{
  // test if the link stays within the same origin
  var loc = window.location;

  if(!el.href || (el.target && el.target != '_self'))
    return true; //no safe way to intercept links that open a new window
  if (el.href && el.href.contains(location.protocol + "//" + location.host + "/"))
    return true; // same origin, we don't have to add tracking data to the URL
  if(el.getAttribute("onclick"))
    return true; //hrefs with 'onclick' may do a return false; which does not cancel the bubble. so we would still be redirecting then..

  _gaq.push([basename+'_link', el.href]);

  // Stop the browser from handling the link so Google picks up the tracking and afterwards handles the redirect.
  // *don't* use event.stop() or whe'll kill other link clicking handlers (for things like opening an anchor in a popup)
  event.preventDefault();
}

// track links to external sites by tracking followed links as event
// (tracking it as pageview would increase the visitors count of our site)
function trackOutboundLinks(evt, outboundlinkoverride)
{
  var linknode;
  if (node.tagName == "A")
    linknode = node;
  else
    linknode = node.getParent("A");

  // don't track internal links
  var href = linknode.href;
  if (href && href.contains(location.protocol + "//" + location.host + "/"))
    return;

  var target_self = evt.target.target && evt.target.target == "_self";

  if (target_self)
    evt.stop();

  //_gaq.push(["_trackEvent", "externallink", href, this.getCurrentHash()]);
  if (outboundlinkoverride)
    outboundlinkoverride(href);
  else
    $wh.analyticsEvent("externallinks", href, document.location.href);

//$wh.analyticsEvent("externallinks", href, getoutboundlinklabel());

  // if the link opens in our own document,
  // we must delay the change of URL to give the tracker time to send the event
  //if (evt.target.get("target") != "_blank")
  if (target_self)
  {
    // this is the recommended way by Google:
    // https://support.google.com/analytics/answer/1136920
    //
    // but since end 2012 there's also a callback which we may be able to use
    // in combination with a timeout to do this smarter:
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced#hitCallback
    (function() { document.location.href = href; }).delay(100);
  }
}



$wh.requestLinkerUrl = function(url, callback)
{
  if(linkerbase==null)
    (function() { callback(url); }).delay(0);
  else
    _gaq.push( function()
               {
                  var pageTracker = _gat._getTrackerByName(linkerbase);
                  var linkerUrl = pageTracker._getLinkerUrl(url);
                  callback(linkerUrl);
               });
}

/** category: The general category (eg 'Videos'), required
    action: The action (eg 'Play'), required
    label: optional descriptor for the event
    value: optional non-negative value associated with the event (eg, count)
    options: nonInteraction: if set to true, mark the event as non interaction. if not set, triggering the event will affect the bounce rate
*/
$wh.analyticsEvent = function (category, action, label, value, options)
{
  if(!$wh.analytics_autotracking)
    return;

  if(typeof label=='object')
  {
    options = label;
    label = '';
  }
  if(typeof value=='object')
  {
    options = value;
    value = 0;
  }

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

  if(debugevents)
  {
    console.log("wh.google.analytics: event: category: " + category + ", action: " + action
                + (label?", label: " + label : '')
                + (value?", value: " + value:'')
                + (options&&options.nonInteraction ? ', noninteraction=true' : ''));
  }

  trackers.each(function(tracker)
    {
      if(tracker.universal)
      {
        ga(tracker.basename + 'send', 'event', category, action, label||'', value||0, options);
      }
      else
      {
        _gaq.push( [ tracker.basename + '_trackEvent', category, action, label || '', value || 0, options && options.nonInteraction ]);
      }
    });
}

/** page: The (name of the) page
    options: title: Only for universal analytics, optional title
*/
$wh.analyticsPageView = function(page, options)
{
  //FIXME: Test the universal version!

  /*
     'page' according to Google: Optional parameter to indicate what page URL to track metrics under. When using this option,
     use a beginning slash (/) to indicate the page URL.
   */
  if (page != "")
  {
    if (page.substring(0,1) != "/")
      page = "/" + page;
  }

  if(debugevents)
    console.log("wh.google.analytics: pageview: page: '" + page + "'");

  trackers.each(function(tracker)
  {
    if (tracker.universal)// https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
    {
      if (page == "")
      {
        ga(tracker.basename + 'send', 'pageview');
      }
      else
      {
        if (options)
        {
          var ga_options = { 'page': page };
          if (options.title != "")
            ga_options.title = options.title;

          ga(tracker.basename + 'send', 'pageview', ga_options);
        }
        else
        {
          ga(tracker.basename + 'send', 'pageview', page);
        }
      }
    }
    else
    {
      _gaq.push(['_trackPageview', page]);
    }
  });
}

/** Log a transaction
    items.sku = SKU/Code of this item
    items.name = Product name
    items.category = Product category or variation
    items.unitprice = Unit price
    items.quantity = Quantity
    options.affiliations = Affiliation or store name
    options.tax
    options.shipping
*/
$wh.analyticsTransaction = function(transactionid, total, items, options)
{
  if(!items)
    items=[];
  if(!options)
    options={};
  if(debugevents)
  {
    console.log("wh.google.analytics: transaction: id: " + transactionid + " total: " + total + " items: " + items.length,options,items);
  }

  trackers.each(function(tracker)
    {
      if(tracker.universal)
      {
        //ga(tracker.basename + 'send', 'event', category, action, label||'', value||0, options);
      }
      else
      {
        if(!total)
        {
          total=0;
          items.each(function(item)
            {
              total += item.unitprice * (item.quantity||1);
            });
        }

        _gaq.push([ tracker.basename + '_addTrans', transactionid, options.affiliation||'', total, ''+(options.tax||0), ''+(options.shipping||''), options.city||'', options.state||'', options.country||'' ]);
        items.each(function(item)
          {
            if(!item.sku)
              return;
            _gaq.push([ tracker.basename + '_addItem', transactionid, item.sku, item.name||'', item.category||'', ''+item.unitprice, ''+(item.quantity || 1) ]);
          });
        _gaq.push([ tracker.basename + '_trackTrans' ]);
      }
    });
}

function onGaClick() //requires data-ga-category and data-ga-action, also supports data-ga-label, data-ga-value, data-ga-noninteraction
{
  if(!this.getAttribute('data-ga-action'))
    return console.error("Element has data-ga-category but no data-ga-action",this);

  $wh.analyticsEvent(this.getAttribute('data-ga-category')
                    ,this.getAttribute('data-ga-action')
                    ,this.getAttribute('data-ga-label') || ''
                    ,parseInt(this.getAttribute('data-ga-value'),10) || 0
                    ,{nonInteraction: ["1","true","data-ga-noninteraction"].contains(this.getAttribute('data-ga-noninteraction'))}
                    );
}

/* options:
    inpage_linkid: Enable the inpage_linkid plugin
    allowlinker: Enable _setAllowLinker for cross domain tracker
    interceptlinks: install global handlers to redirect as much links as possible by default through google for allowLinker
    universal: use universal analytics (in public beta)
    trackoutboundlinks: track links to other sites by creating an event (best effort for links opening in the same tab)
    outboundlinkoverride custom function to handle the outbound link in case the default generated 'externallinks'/anchorurl/currenturl format for the event is not what's wanted
*/
$wh.setupGoogleAnalytics = function(gacode, options)
{
  if(!options)
    options={};

  var basename = options.name ? options.name+'.' : '';
  var universal = options.universal;

  if(debugevents)
    console.log("wh.google.analytics: Activating tracker " + gacode,options);


  if (options.trackoutboundlinks)
    $(document.body).addEvent("click:relay(a)", trackOutboundLinks.bind(this, options.outboundlinkoverride));



  if(universal) //https://developers.google.com/analytics/devguides/collection/analyticsjs/
  {
    /*
     *    <!-- Google Analytics -->
    <script>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-XXXX-Y');
    ga('send', 'pageview');

    </script>
    <!-- End Google Analytics -->


    TRANSLATES TO:


    window['GoogleAnalyticsObject']='ga';
    window['ga'] = window['ga'] || function()
      {
        (window['ga'].q=window['ga'].q||[]).push(arguments);
      }
    window['ga'].l=1*new Date();
    var a=document.createElement('script')
    var m=document.getElementsByTagName('script')[0];
    a.async=1;
    a.src='//www.google-analytics.com/analytics.js';
    m.parentNode.insertBefore(a,m)

    ga('create', 'UA-XXXX-Y');
    ga('send', 'pageview');


    IS LESS UNDERSTANDABLE THAN:
    */
    window.GoogleAnalyticsObject='ga';
    if(!window.ga)
    {
      window.ga = function()
      {
        window.ga.q.push(arguments);
      }
      window.ga.q = [];
    }

    var googlescript = '//www.google-analytics.com/analytics' + (debuggoogle ? '_debug':'') + '.js';
    if(!universalscriptloaded)
    {
      universalscriptloaded=true;
      $$("head,body").pick().adopt(
       new Element("script"
                  ,{src:googlescript
                   ,async:true
                   }));
    }

    var opts={};
    if(basename)
      opts.name = options.name;

    ga('create', gacode, opts);
    ga(basename+'send', 'pageview');

    trackers.push({basename:basename, universal:true});
  }
  else //https://developers.google.com/analytics/devguides/collection/gajs/
  {
    var loadbase = (location.protocol=='http:' ? 'http://www' : 'https://ssl') + '.google-analytics.com/';
    _gaq.push( [ basename + '_setAccount', gacode ]
             , [ basename + "_trackPageview"]
             );
  /* no longer needed:
  Method _trackPageLoadTime is deprecated. _trackPageLoadTime is deprecated. Site Speed tracking is enabled by default with trackPageview call at 1% sampling. Use _setSiteSpeedSampleRate for changing sample rate.
    if(options&&options.pageloadtime)
      _gaq.push([basename + "_trackPageLoadTime"]);
  */

    if(options&&options.inpage_linkid)
      _gaq.push([basename + "_require", "inpage_linkid", loadbase + 'plugins/ga/inpage_linkid.js']);

    if(options&&options.allowlinker)
    {
      if(linkerbase)
      {
        console.warn("Warning: only one GA tracker can properly support allowlinker. Ignoring the second 'allowlinker'");
      }
      else
      {
        _gaq.push([basename + "_setAllowLinker", true]);

        if(options.interceptlinks)
        {
          $(document.body).addEvent("click:relay(a)", interceptLinkForGoogle.bind(this, basename));
        }
        linkerbase = this;
      }
    }

    var googlescript = options&&options.displayads
                        ? '//stats.g.doubleclick.net/' + (debuggoogle ? 'dc_debug.js' : 'dc.js')
                        : loadbase + (debuggoogle ? 'u/ga_debug.js' : 'ga.js');

    if(!classicscriptloaded)
    {
      classicscriptloaded=true;
      $$("head,body").pick().adopt(
       new Element("script"
                  ,{src:googlescript
                   ,async:true
                   }));
    }
    trackers.push({basename:basename, universal:false});
  }

  if(!didautotrackevents && $wh.analytics_autotracking)
  {
    didautotrackevents=true;
    //ADDME register capture events on modern browsers to catch later dom additions and clicks on subnodes
    $$('*[data-ga-category]').addEvent('click', onGaClick, true);
    //$(document.body).addEvent('click:relay(*[data-ga-category])', onGaClick, true); // FIXME: something like this? functions need to be changed too?
  }
};

$wh.analytics_autotracking = true;

})(document.id); //end mootools wrapper
