/* generated from Designfiles Public by generate_data_designfles */
require ('./paginator.css');
require ('frameworks.mootools.core');
require ('wh.compat.base');
/*! REQUIRE: frameworks.mootools.core, wh.compat.base
!*/

/*

Paginator
(an experiment by Mark)


Classes

    .wh-paginator    - elements with this class will be automatically initialized with the paginator
    .wh-paginator-page - content which needs to be shown will be moved to the element with this class
    .wh-paginator-showmore - elements with this class will work as 'show more' button
    .wh-paginator-content - contains the items for the paginator
    .wh-paginator-item    - each item for the paginator must have this class

DOM attributes on the element with .wh-paginator

    data-debug
    data-initial-items
    data-items-per-page


Within the <div class="wh-paginator-content"> you can use one of these
as wrapper for the content to prevent the browser from loading images before
the content is visibile on the page.

  <textarea>
    - images won't be loaded
    - syntax highlighting works in editor

Either possibilities, which probably aren't as good:

  <template>
    - keeps content inert (images, iframes, scripts won't be loaded)
    - content can be accessed through <templateelement>.content.querySelector()
    - IE (even up to 11) doesn't support this yet

  <noscript>
    - images won't be loaded
    - syntax highlighting works in editor
    - IE<9 cannot retrieve content

  (FIXME: not implemented yet)
  <script type="text/html">
    - images won't be loaded
    - should work in all browsers

  (FIXME: not implemented yet)
  <!-- .. -->
    - no way to get the correct comment node by a class or id
    - (not supported at the moment, you'd have to pass the comment node yourself as option)

*/

(function($) { //mootools wrapper

$wh.Paginator = new Class(
{ Implements: [ Options, Events ]
, options:
      { initial_items:      5
      , items_per_page:     5
      //, max_page_height:    250 // NOT implemented

      // types aren't implemented yet
      , type:               "browse" //- browse through the pages
                            //"add"    - upon clicking an 'show more' button, add another page of content
                            //"scroll_add" - upon reaching the bottom of the container, add another page of content
      , debug:              true
      }

, container:     null
, content_container: null
, page:              null
, showmorebuttons:   null

, contentdom: null
, numitems: 0
, numitemsshown: 0

, initialize: function(container, options)
  {
    this.setOptions(options);
    this.container = $(container);
    if (!this.container)
    {
      console.error("Paginator: no such element '" + container + "'");
      return;
    }

    // use <noscript> as tagName if you want to prevent images, iframes, embed's and objects to be loaded
    this.content_container = this.container.getElement(".-wh-paginator-content, .wh-paginator-content");

    this.contentdom = this.getDOM(this.content_container);

    this.numitems = this.contentdom.getElements(".wh-paginator-item").length;

    this.page = this.container.getElement(".-wh-paginator-page, .wh-paginator-page");
    if (!this.page)
    {
      this.page = new Element("div", { "class": "-wh-paginator-page, wh-paginator-page" });
      this.container.insertBefore(this.page, this.container.firstChild);
      //console.error("Missing -wh-paginator-page");
    }

    this.showmorebuttons = this.container.getElements(".-wh-paginator-showmore, .wh-paginator-showmore");
    this.showmorebuttons.addEvent("click", this.onShowMore.bind(this));

    this.addItems(this.options.initial_items);
  }

  // don't directly try to read the <noscript> because it fails in IE<9
, getDOM: function(container)
  {
    // Get the content out of the <textarea>/<noscript>/<script type="text/html" and into a DOM so we can pick out items,
    // but keep it away from the browser document so the browser won't immediately start
    // loading content (like image,iframe,embed,object).
    // (Firefox, IE9 and Safari will directly start loading content, Chrome will wait until it's inserted into the DOM)

    if (!["noscript","script","textarea"].contains(container.tagName.toLowerCase()))
      return null;

    if (document.implementation && document.implementation.createHTMLDocument)
    {
      var doc = document.implementation.createHTMLDocument(""); // Chrome, FF4, IE9, OP, SF
      //doc.documentElement.innerHTML = container.textContent;

      // IE9 doesn't implement innerHTML on the <html> element, so we have to create an element for using innerHTML
      var elem = doc.createElement("div");
      elem.innerHTML = container.textContent; // IE9+
      doc = elem;
    }

    // this should work in older browsers,
    // however this way all images which aren't even visible yet will be loaded
    if (!doc)
      doc = new Element("div", { html: container.textContent ? container.textContent : container.innerText/*IE<9*/ });

    /*
    var parser = new DOMParser();
    var doc = parser.parseFromString(container.textContent, "text/html"); // IE9+ and NOT SUPPORTED BY Safari
    //if (doc == null) // Safari doesn't support text/html parsing
    //  doc = parser.parseFromString(container.textContent, "application/xml"); // IE9+
    */

    return doc;
  }

, onShowMore: function()
  {
    this.addItems(this.options.items_per_page);
  }

, addItems: function(items_to_add)
  {
    var items = this.contentdom.querySelectorAll(".-wh-paginator-item, .wh-paginator-item"); // IE8+

    var itemcount = items.length;

    if (itemcount > items_to_add)
      itemcount = items_to_add;

    for(var idx = 0; idx < itemcount; idx++)
    {
      this.page.appendChild(items[idx]); // FIXME: or use adoptNode() ??
    }

    this.numitemsshown += items_to_add;
    if (this.numitemsshown >= this.numitems)
    {
      this.showmorebuttons.addClass("disabled");
    }


  }

  /** @short relayout
  */
, refresh: function()
  {
    switch(this.options.type)
    {
      // 'show more'
      case "add":
        break;

      // pagination with optional page number and previous/next navigation
      case "browse":
        break;

      // scroll to the bottom to trigger showing/loading additional pages
      case "scroll":
        break;
    }
  }




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Private functions
//

});



$wh.setupElementAsPaginatedContent = function(el)
{
  el=$(el);
  if(el.retrieve("-wh-paginator"))
    return el.retrieve("-wh-paginator");
  if(el.retrieve("wh-paginator"))
    return el.retrieve("wh-paginator");

  var opts = { debug:              $wh.debug["debug"]
             //, max_page_height:    el.getAttribute("data-max_page_height")
             //, type:               el.getAttribute("data-type")
             };

  var value = el.getAttribute('data-initial-items');
  if(value)
    opts.initial_items = parseInt(value);

  var value = el.getAttribute('data-items-per-page')
  if(value)
    opts.items_per_page = parseInt(value);

  return new $wh.Paginator(el, opts);
};

$(window).addEvent("domready", function()
{
  $$('.-wh-paginator, .wh-paginator').each($wh.setupElementAsPaginatedContent);
});

})(document.id); //end mootools wrapper
