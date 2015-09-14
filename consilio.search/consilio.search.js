/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.more.class.binds');
require ('wh.net.jsonrpc');
/*! LOAD: frameworks.mootools.more.class.binds, wh.net.jsonrpc
!*/

(function($) { //mootools wrapper

if (!window.$consilio)
  window.$consilio = {};


/****************************************************************************************************************************
 *                                                                                                                          *
 *  Search RPC                                                                                                              *
 *                                                                                                                          *
 ****************************************************************************************************************************/

$consilio.Searcher = new Class(
{ Implements: [ Options, Events ]
, Binds: [ "onRPCSuccess", "onRPCError" ]

, options: { catalog: ""
           , password: ""
           , module: ""
           , tag: ""
           , language: ""
           , restricturl: ""
           , summarylength: -1 // get default length, set to 0 for no summary
           , donthighlight: false
           , savesearches: true
           , savesearchestag: ""
           , url: "/wh_services/consilio/search"
           , rpccall: "Search"
           }
, source: null
, sessionid: ""
, rpc: null
, currequest: null

/****************************************************************************************************************************
 * Initialization
 */

, initialize: function(options)
  {
    this.setOptions(options);

    if (this.options.catalog)
    {
      this.source = { type: "catalog"
                    , catalog: this.options.catalog
                    , password: this.options.password
                    };
    }
    else if (this.options.module && this.options.tag)
    {
      this.source = { type: "module"
                    , module: this.options.module
                    , tag: this.options.tag
                    };
    }
    if (!this.source)
      throw "No search source specified";

    this.rpc = new $wh.JSONRPC({ url: this.options.url });
  }

/****************************************************************************************************************************
 * API
 */

, search: function(query, first, count)
  {
    var searchoptions = { language: this.options.language
                        , savesearches: this.options.savesearches
                        , sessionid: this.sessionid
                        , sessiontag: this.options.savesearchestag
                        , restricturl: this.options.restricturl
                        , summarylength: this.options.summarylength
                        , donthighlight: this.options.donthighlight
                        };
    if (typeof first == "number")
      searchoptions.first = first;
    if (typeof count == "number")
      searchoptions.count = count;

    if (this.currequest)
      this.currequest.cancel();
    this.currequest = this.rpc.request(this.options.rpccall, [ this.source, query, searchoptions ], this.onRPCSuccess, this.onRPCError);
  }

, isActive: function()
  {
    return !!this.currequest;
  }

, cancel: function()
  {
    if (this.currequest)
      this.currequest.cancel();
    this.currequest = null;
  }

/****************************************************************************************************************************
 * Internal functions
 */

, getErrorId: function(code)
  {
    switch (code)
    {
      case 0:  return "ok";
      case 2:  return "webletnotopened";
      case 3:  return "noopenindex";
      case 4:  return "indexnotfound";
      case 5:  return "noaccess";
      case 6:  return "connecterror";
      case 7:  return "senderror";
      case 8:  return "httperror";
      case 9:  return "nototalerror";
      case 10: return "unavailable";
      case 11: return "someunavailable";
      case 12: return "timeouterror";
      default: return "error";
    }
  }

/****************************************************************************************************************************
 * RPC Callbacks
 */

, onRPCSuccess: function(result)
  {
    this.currequest = null;
    if (result.success)
    {
      this.sessionid = result.sessionid;
      this.fireEvent("results", { results: result.results, totalcount: result.totalcount });
    }
    else
    {
      console.error("Search error: " + result.errormsg);
      this.fireEvent("error", this.getErrorId(result.errorcode));
    }
  }

, onRPCError: function(code, msg)
  {
    console.log(arguments);
    this.currequest = null;
    console.error("Search RPC error: " + code + ": " + msg);
    this.fireEvent("error", "rpcerror");
  }
});

})(document.id); //end mootools wrapper
