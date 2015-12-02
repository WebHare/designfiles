/* generated from Designfiles Public by generate_data_designfles */
require ('./autocomplete.css');
require ('frameworks.mootools.more.class.binds');
require ('wh.compat.base');
require ('wh.ui.base');
require ('wh.net.jsonrpc');
require ('wh.ui.menu');
require ('wh.components.scrollableview');
require ('wh.util.promise');
/*! LOAD: frameworks.mootools.more.class.binds
    LOAD: wh.compat.base, wh.ui.base, wh.net.jsonrpc, wh.ui.menu, wh.components.scrollableview, wh.util.promise
!*/

(function($) { //mootools wrapper

/****************************************************************************************************************************
 *                                                                                                                          *
 *  AutoCompleteValues                                                                                                      *
 *                                                                                                                          *
 ****************************************************************************************************************************/

$wh.AutoCompleteValues = new Class(
{ Implements: [ Options ]

, options: { onResults: null
           }

/****************************************************************************************************************************
 * Initialization
 */

  /** @short Initialize the AutoCompleteValues
      @cell options.onResults The function to call with the getValues result
  */
, initialize: function(options)
  {
    this.setOptions(options);
  }

/****************************************************************************************************************************
 * API
 */

, getValues: function(query, onresults)
  {
    onresults = onresults || this.options.onResults;
    var retval;
    if (!onresults)
    {
      var defer = Promise.defer();
      retval = defer.promise;
      onresults = defer.resolve;
    }

    this.getValuesForQuery(query, function(results)
    {
      onresults.delay(1, this, { values: results || [] });
    });

    return retval;
  }

, cancel: function()
  {
  }

/****************************************************************************************************************************
 * Internal
 */

  /* @short Return a list of autocomplete values for a given query
     @long Overwrite this function in a subclass
     @param query The query to match
     @param onresults The function to call with results
  */
, getValuesForQuery: function(query, onresults)
  {
    onresults();
  }

});


/****************************************************************************************************************************
 *                                                                                                                          *
 *  AutoCompleteStaticList                                                                                                  *
 *                                                                                                                          *
 ****************************************************************************************************************************/

$wh.AutoCompleteStaticList = new Class(
{ Extends: $wh.AutoCompleteValues

, options: { values: []
           , maxresults: 10
           , initialmatchonly: false
           , onResults: null
           }

/****************************************************************************************************************************
 * Initialization
 */

  /** @short Initialize the AutoCompleteStaticList
      @cell options.values The list of values, as a string array, or an {value,title} object array
      @cell options.maxresults The maximum number of results to return (0 for all)
      @cell options.initialmatchonly Set to true to only match values starting with the query
      @cell options.onResults The function to call with the getValues result
  */
, initialize: function(options)
  {
    this.setOptions(options);
  }

/****************************************************************************************************************************
 * Internal
 */

, getValuesForQuery: function(query, onresults)
  {
    query = query.toUpperCase();

    // We want to return the initial matches (value starts with query) before the substring matches (value contains query)
    var initial_matches = [], substr_matches = [];
    this.options.values.each(function(value)
      {
        if (typeOf(value) == "string")
          value = { value: value };
        var match = value.value.toUpperCase().indexOf(query);
        if (match == 0 || !query)
          initial_matches.push(value);
        else if (match > 0 && !this.options.initialmatchonly)
          substr_matches.push(value);
      }, this);

    // Concatenate the initial and substring matches, keep the first 10 matches
    var matches = initial_matches.append(substr_matches);
    if (this.options.maxresults > 0)
      matches = matches.filter(function(value, i)
      {
        return i < this.options.maxresults;
      }, this);

    // Return the results
    onresults(matches);
  }

/****************************************************************************************************************************
 * Public API
 */

, setValues: function(values)
  {
    this.options.values = values;
  }
});


/****************************************************************************************************************************
 *                                                                                                                          *
 *  AutoCompleteService                                                                                                     *
 *                                                                                                                          *
 ****************************************************************************************************************************/

$wh.AutoCompleteService = new Class(
{ Extends: $wh.AutoCompleteValues
, Binds: [ "onError" ]

, options: { url: ""
           , rpccall: ""
           , parameters: []
           , onResults: null
           }
, rpc: null
, currequest: null
, curreject: null

/****************************************************************************************************************************
 * Initialization
 */

  /** @short Initialize the AutoCompleteService
      @long This class expects a web service with a function call which receives a single STRING parameter with the search
            query and returns a RECORD with a 'values' RECORD ARRAY cell containing 'value' and 'title' STRING cells. If no
            'title' is given, the 'value' is used as title. The values can also contain 'isdivider', 'enabled' and 'hide'
            BOOLEAN cells, as well as a 'subtitle' STRING cell which can be used to add text to the right of the option (like
            a shortcut in menus).
      @cell options.url The JSON RPC web service URL
      @cell options.rpccall The function to call
      @cell options.onResults The function to call with the getValues result
  */
, initialize: function(options)
  {
    this.parent(options);
    this.rpc = new $wh.JSONRPC({ url: this.options.url });
  }

/****************************************************************************************************************************
 * API
 */

, getValues: function(query, onresults)
  {
    if (this.currequest)
      this.cancel();

    onresults = onresults || this.options.onResults;

    var retval;
    if (!onresults)
    {
      var defer = Promise.defer();
      retval = defer.promise;
      onresults = defer.resolve;
      this.curreject = defer.reject;
    }

    if (query)
    {
      var rpccall = this.options.rpccall;
      this.currequest = this.rpc.request(rpccall, this.getRPCArguments(query), this.onResults.bind(this, onresults), this.onError);
    }
    else
    {
      onresults.delay(1, this, { values: [] });
      this.currequest = null;
    }

    return retval;
  }

, cancel: function()
  {
    if (this.currequest)
    {
      this.currequest.cancel();
      this.currequest = null;

      if (this.curreject)
      {
        var reject = this.curreject;
        this.curreject = null;
        reject(new Error("Request cancelled"));
      }
    }
  }

/****************************************************************************************************************************
 * Internal
 */

, getRPCArguments: function(query)
  {
    return this.options.parameters.concat([ query ]);
  }

/****************************************************************************************************************************
 * RPC Callbacks
 */

, onResults: function(callback, result)
  {
    this.currequest = null;
    this.curreject = null;

    callback(result);
  }

, onError: function(status, result)
  {
    if (typeof console != "undefined")
      console.error("RPC Error " + status + (result && result.message ? ": " + result.message : ""));

    this.currequest = null;
    if (this.curreject)
    {
      var reject = this.curreject;
      this.curreject = null;
      reject(new Error("RPC Error " + status + (result && result.message ? ": " + result.message : "")));
    }
  }
});


/****************************************************************************************************************************
 *                                                                                                                          *
 *  AutoComplete                                                                                                            *
 *                                                                                                                          *
 ****************************************************************************************************************************/

$wh.AutoComplete = new Class(
{ Implements: [ Options, Events ]
, Binds: [ "_startRequest", "cancelRequest"
         , "onInputBlur", "onInputFocus", "onInputKeyup", "onInputMouseup", "onInputPaste"
         , "onKeyDown"
         , "onMenuItemSelect", "onResults" ]

, options: { enablescrollbar: false
           , valuescssclass: ""
           , service: $wh.AutoCompleteService
           , onValue: null
           , onResults: null
           }

// DOM nodes
, node: null
, listnode: null

// objects
, service: null
, valuesmenu: null // $wh.menu object

, values: null
, pendingrequest: false

/****************************************************************************************************************************
 * Initialization
 */

  /** @short Initialize an AutoComplete handler
      @cell options.service The AutoCompleteService (or derived) class to use as autocompletion service
      @cell options.url The JSON RPC web service URL (used by the autocompletion service)
      @cell options.rpccall The function to call (used by the autocompletion service)
      @cell options.valuescssclass Extra CSS class to apply to the suggestions menu
      @cell options.onResults The function to call when suggestions have been retrieved

      //@cell options.onValue The function to call when a suggestion is selected  (DEPRECATED, use the valueselected event)
      //@cell options.enablescrollbar Set to true to enable scrolling within the suggestions menu (DEPRECATED, NOT WORKING ANYMORE)
  */
, initialize: function(node, service, options)
  {
    if(! (service && instanceOf(service, $wh.AutoCompleteValues)))
    {
      if(!$wh.config.islive)
        console.warn("Deprecated autocomplete syntax used")
      //assume old call syntax
      options = service;
      service = new ( (options?options.service:null) || $wh.AutoCompleteService)(options);
    }

    this.setOptions(options);
    this.options.onValue = options?options.onValue:null;
    this.options.onResults = options?options.onResults:null;
    this.service = service;
//  options.onResults = this.onResults;

    this.node = $(node);
    if (this.node)
    {
      // Add events
      this.node.addEvents({ "blur": this.onInputBlur
                          , "focus": this.onInputFocus
                          , "mouseup": this.onInputMouseup
                          , "keyup": this.onInputKeyup
                          , "down": this.onKeyDown
                          , "wh-menu-activateitem": this.onMenuItemSelect
                          });

      if (this.node.addEventListener)
        this.node.addEventListener("paste", this.onInputPaste);

      // Turn off browser autocomplete
      this.node.setAttribute("autocomplete", "off");
      if (this.node.form)
        this.node.form.setAttribute("autocomplete", "off");

      // Store this AutoComplete object
      this.node.store("wh-autocomplete", this);

      // Initialize the values list
      this.listnode = new Element("ul", { "class": "wh-menu wh-autocomplete-values" });

      if (this.options.valuescssclass)
        this.listnode.addClass(this.options.valuescssclass);
    }

    if(this.node && $wh.hasFocus(this.node))
      this.onInputFocus();
  }

, destroy:function()
  {
    // Cancel the request, close the menu
    this.cancelRequest();

    if(this.node)
    {
      this.listnode.destroy();
      this.node.eliminate("wh-autocomplete");
      this.node.removeEvents({ "blur": this.onInputBlur
                             , "focus": this.onInputFocus
                             , "mouseup": this.onInputMouseup
                             , "keyup": this.onInputKeyup
                             , "down": this.onKeyDown
                             , "wh-menu-activateitem": this.onMenuItemSelect
                             });
      this.node = null;
    }
  }

/****************************************************************************************************************************
 * API
 */

, getUserQuery:function()
  {
    if (this.node.nodeName.toUpperCase() == "INPUT")
      return this.node.get("value");
    else
      return this.node.get("text");
  }

, _startRequest: function() //expects uibusy to be +1
  {
    if(this.node.nodeName.toUpperCase() == "INPUT" && (this.node.disabled || this.node.readOnly))
    {
      $wh.updateUIBusyFlag(-1); //we can't actually modify the input  (ADDME Also block updates if use selected value and the input since went readonly)
      return;
    }

    var query = this.getUserQuery();
    if(this.lastquery === query)
    {
      $wh.updateUIBusyFlag(-1);
      return; //nothing new
    }

    if(this.pendingrequest)
      this.cancelRequest();

    this.pendingrequest=true;

    this.lastquery = query;
    this.service.getValues(query, this.onResults);
  }

, cancelRequest: function() //note, this function doubles as a way to close the context menu even after the request is complete...
  {
    if(this.pendingrequest)
    {
      this.pendingrequest=false;
      $wh.updateUIBusyFlag(-1);
      this.service.cancel();
    }
    if (this.valuesmenu)
    {
      if(!$wh.debug.meo)
        this.valuesmenu.destroy();
      this.valuesmenu = null;
    }
  }

/****************************************************************************************************************************
 * Input Node Events
 */

, onInputBlur: function(event)
  {
    this.cancelRequest();
  }

, onInputFocus: function(event)
  {
  }

, onInputKeyup: function(event)
  {
    if (event.key == "esc")
      this.cancelRequest();
    else if (!["down","up"].contains(event.key))
    {
      $wh.updateUIBusyFlag(+1);
      this._startRequest(true);
    }
  }

, onInputMouseup: function(event)
  {
    // If the user clicked the little 'clear' button within a <input type="search"> field, the value of the input is not yet
    // cleared when the mouseup event fires, so we'll start the request after a delay
    $wh.updateUIBusyFlag(+1);
    this._startRequest.delay(1, this);
  }

, onInputPaste: function(event)
  {
    $wh.updateUIBusyFlag(+1);
    this._startRequest();
  }

, onKeyDown: function(event)
  {
    if (!this.valuesmenu)
    {
      $wh.updateUIBusyFlag(+1);
      this._startRequest();
      event.stop();
//      Keyboard.stop(event);
    }
  }

/****************************************************************************************************************************
 * Menu events
 */

, onMenuItemSelect: function(event)
  {
    var item = event.detail.menuitem;
    var value = null;
    if (item && !item.hasClass("wh-menu-disabled"))
    {
      var idx = parseInt(item.getAttribute("data-wh-idx"));
      if (idx >= 0 && idx < this.values.length)
        value = this.values[idx];
    }

    if (typeof this.options.onValue == "function")
      if (this.options.onValue(value) === false)
        return;

    if (value && this.node)
      this.node.set("value", value.value);
    this.cancelRequest();
    this.fireEvent("valueselected", { target: this, value: value });
  }

/****************************************************************************************************************************
 * Service Callbacks
 */

, onResults: function(result)
  {
    if(this.pendingrequest)
    {
      this.pendingrequest = false;
      $wh.updateUIBusyFlag(-1);
    }

    if (this.valuesmenu)
      this.valuesmenu.destroy();
    this.valuesmenu = null;

    this.values = result.values.length ? result.values : null;

    if (typeof this.options.onResults == "function")
      if (this.options.onResults(this.values) === false)
      {
        this.cancelRequest();
        return;
      }

    if (!this.values)
    {
      this.cancelRequest();
      return;
    }

    this.listnode.empty();
    this.values.each(function(item, i)
    {
      var itemnode;
      if (item.isdivider)
        itemnode = new Element("li", { "class": "wh-menu-divider" });
      else
      {
        var disabled = item.enabled === false;

        var classes = [ "wh-menu-item" ];
        if (item.hide)
          classes.push("wh-menu-hidden");
        if (disabled)
          classes.push("wh-menu-disabled");

        var text = item.title || item.value;
        var matchtext = this.node.value;
        var matchpos = matchtext ? text.indexOf(this.node.value) : -1;

        itemnode = new Element("li", { "data-wh-idx": i
                                     , "class" : classes.join(" ")
                                     });

        if(matchpos >= 0)
        {
          itemnode.appendText(text.substr(0,matchpos));
          itemnode.adopt(new Element("span", { "class": "matchingtext"
                                             , "text": text.substr(matchpos, matchtext.length)
                                             }))
          itemnode.appendText(text.substr(matchpos+matchtext.length));
        }
        else
        {
          itemnode.appendText(text);
        }

        if (item.subtitle)
          itemnode.grab(new Element("span", { text: item.subtitle
                                            , "class": "wh-menu-shortcut" //FIXME looks like abuse of wh-menu-shortcut class
                                            }));
        item.node = itemnode;
      }
      this.listnode.grab(itemnode);
    }, this);

    this.valuesmenu = $wh.openMenuAt(this.listnode, this.node,
        { direction: "down"
        , hoverclosetimeout: -1
        , exitdirection: "top"
        , capturekeyboard: false
        , handlehomeend: false
        , forcenooverlap: true
        });
  }

, trySelectFirstMenuItem: function()
  {
    if (!this.valuesmenu || this.valuesmenu.haveSelection())
      return false;

    this.valuesmenu.selectFirst();
    return true;
  }

});

$wh.AutoComplete.addToInput = function(node, options)
{
  node = $(node);
  if (!node)
    return;
  return node.retrieve("wh-autocomplete") || new $wh.AutoComplete(node, options);
}

})(document.id); //end mootools wrapper
