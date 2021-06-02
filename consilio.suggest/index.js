/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.components.autocomplete');
/*! LOAD: wh.components.autocomplete
!*/

(function($) { //mootools wrapper

if (!window.$consilio)
  window.$consilio = {};

/****************************************************************************************************************************
 *                                                                                                                          *
 *  SuggestService                                                                                                          *
 *                                                                                                                          *
 ****************************************************************************************************************************/

$consilio.SuggestService = new Class(
{ Extends: $wh.AutoCompleteService

, options: { catalog: ""
           , password: ""
           , module: ""
           , tag: ""
           , prefix: ""
           , doccount: ""
           , count: 10
           , restricturl: ""
           , url: "/wh_services/consilio/search"
           , rpccall: "Suggest"
           }
, source: null

/****************************************************************************************************************************
 * Initialization
 */

, initialize: function(options)
  {
    this.parent(options);

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
                    , prefix: this.options.prefix
                    };
    }
    if (!this.source)
      throw "No suggest source specified";
  }

/****************************************************************************************************************************
 * Internal
 */

, getRPCArguments: function(query)
  {
    var suggestoptions = { doccount: this.options.doccount
                         , count: this.options.count
                         , restricturl: this.options.restricturl
                         };

    return [ this.source, query, suggestoptions ];
  }

});


/****************************************************************************************************************************
 *                                                                                                                          *
 *  Suggest                                                                                                                 *
 *                                                                                                                          *
 ****************************************************************************************************************************/

  /** @short Initialize a Consilio suggest handler
      @cell options.document_count Set to true to add the number of matching documents after each suggestion
      @cell options.enablescrollbar Set to true to enable scrolling within the suggestions menu
      @cell options.valuescssclass Extra CSS class to apply to the suggestions menu
      @cell options.catalog The catalog to search (leave empty for module suggestions)
      @cell options.module The module content source to search (leave empty for catalog suggestions)
      @cell options.tag The module content source tag (required when module is specified)
      @cell options.prefix The module content source prefix to use (optional)
      @cell options.count The maximum number of suggestions to display
      @cell options.onResults The function to call when suggestions have been retrieved
  */
$consilio.Suggest = new Class(
{ Extends: $wh.AutoComplete

, options: { document_count: false
           , doccount: ""
           }

/****************************************************************************************************************************
 * Initialization
 */

, initialize: function(node, service, options)
  {
    if(! (service && instanceOf(service, $wh.AutoCompleteService)))
    {
      //assume old call syntax
      if(!$wh.config.islive)
        console.warn("Deprecated autocomplete syntax used");
      options = service;
      service = new ((options?options.service:null) || $consilio.SuggestService)(options);
    }
    this.parent(node,service,options);
    if(this.options.document_count)
      tihs.options.doccount = $consilio.Suggest.doccountmethod;
  }

});

$consilio.Suggest.doccountmethod = "search";

$consilio.Suggest.addToInput = function(node, options)
{
  node = $(node);
  if (!node)
    return;
  return node.retrieve("wh-autocomplete") || new $consilio.Suggest(node, options);
}

})(document.id); //end mootools wrapper
