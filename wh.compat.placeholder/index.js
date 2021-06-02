/* generated from Designfiles Public by generate_data_designfles */
require ('./placeholder.css');
require ('frameworks.mootools.core');
/*! REQUIRE: frameworks.mootools.core
!*/

/****************************************************************************************************************************
 * Input placeholder
 */

(function($) { //mootools wrapper

if(!window.$wh) window.$wh={};

/* To set the placeholder text (browser native placeholder will be used if available):
   $('input').set("placeholder", "Insert text here");

   Or to automatically show the placeholder on all inputs in all browsers, add the placeholder attribute to the inputs and
   call WHFixupPlaceholders().

   Use the ".-placeholder" CSS class to style the custom placeholder, or a vendor-specific CSS rules like
   ::-webkit-input-placeholder or input:-moz-placeholder and textarea:-moz-placeholder
   See placeholder.css for the complete placeholder styling list.

   Use #wh-placeholder-polyfill to force the placeholder to be installed (for debugging on non-IE8 browsers)
*/
Element.Properties.placeholder =
  { get: function()
    {
      // If the placeholder data is defined, return it, otherwise return nothing
      var placeholderdata = this.retrieve("wh-placeholderdata");
      if (placeholderdata)
        return placeholderdata.text;
    }
  , set: function(placeholdertext)
    {
      // Check if this element is an input or textarea element with an appropriate type
      // The placeholder attribute is only supported for inputs with types "text", "search", "url", "tel", "email" and
      // "password". Unknown types are treated as "text", so we'll have to check for all known, unsupported types.
      if (this.get("tag") != "input" && this.get("tag") != "textarea")
        return this;
      else if ([ "hidden", "datetime", "date", "month", "week", "time", "datetime-local", "number", "range", "color", "checkbox", "radio", "file", "submit", "image", "reset", "button" ].indexOf(this.type) >= 0)
        return this;

      // Check for a valid value
      if (typeOf(placeholdertext) == "null")
        placeholdertext = "";
      else if (typeOf(placeholdertext) != "string")
        return this;
      else
        placeholdertext = placeholdertext.split("\x0A").join("").split("\x0D").join(""); // Strip linefeeds from the placeholdertext

      // Remove any old placeholder data
      var placeholderdata = this.retrieve("wh-placeholderdata");
      if (placeholderdata)
      {
        //console.log("clearing placeholderdata");
        //console.log(this.outerHTML);
        this.removeEvents({ focus: placeholderdata.onfocus
                          , blur: placeholderdata.onblur
                          , change: placeholderdata.onblur
                          });
        if (this.detachEvent && "onpropertychange" in this)
          this.detachEvent("onpropertychange", placeholderdata.onpropertychange);
        placeholderdata.anchor.destroy();
        $(placeholderdata.node).destroy();
        this.eliminate("wh-placeholderdata");
      }
      else
      {
        //remove any (cloned) existing placeholder elements. see formsapi/demo-toddcomps.js for an example
        if(this.previousSibling
           && this.previousSibling.className=='-placeholder-anchor'
           && this.previousSibling.nodeName.toUpper()=='SPAN')
          document.id(this.previousSibling).destroy();
      }


      // If the new placeholdertext is empty, nothing to do
      if (!placeholdertext)
        return this;

      // The node that will anchor our placeholder for relative positioning
      var placeholderanchor;
      if(["absolute","relative"].indexOf(this.getStyle("position")) != -1)
        placeholderanchor = new Element("span", { "class": "-placeholder-anchor", styles: this.getStyles(['position','left','top','right','bottom']) });
      else
        placeholderanchor = new Element("span", { "class": "-placeholder-anchor", styles: { position: "absolute"  }});

      // The node displaying the placeholder text
      var placeholdernode = (new Element("div", { "class": "-placeholder"
                                                , styles: { border: "transparent solid 0px"
                                                          , overflow: "hidden"
                                                          , position: "absolute"
                                                          , "text-align": "left"
                                                          , "white-space": "nowrap"
                                                          }
                                                , text: placeholdertext
                                                , events: { mousedown: (function()
                                                                        {
                                                                          (function()
                                                                           {
                                                                             try
                                                                             {
                                                                               this.focus();
                                                                             }
                                                                             catch (e) {}
                                                                           }).delay(1, this);
                                                                        }).bind(this)
                                                          }
                                                }));
      placeholderanchor.appendChild(placeholdernode);

      // Placeholder data object (ADDME is this safe, with leaks et al?)
      var placeholderdata =   { text: placeholdertext
                              , active: this.value == ""
                              , anchor: placeholderanchor
                              , node: placeholdernode
                              , onfocus: (function()
                                          {
                                            var placeholderdata = this.retrieve("wh-placeholderdata");
                                            if (placeholderdata && placeholderdata.active)
                                            {
                                              // Hide the placeholder node
                                              placeholderdata.node.setStyle("display", "none");
                                            }
                                          }).bind(this)
                              , onblur: (function()
                                         {
                                           var placeholderdata = this.retrieve("wh-placeholderdata");
                                           if (placeholderdata)
                                           {
                                             // Placeholder text is active if there is no text entered
                                             placeholderdata.active = this.value == "";
                                             if (placeholderdata.active)
                                             {
                                               try
                                               {
                                                 placeholderdata.anchor.inject(this, "before");

                                                 // Copy style from the input node and show the placeholder node
                                                 var styles = this.getStyles("font-family", "font-size", "font-style", "font-weight",
                                                                             "padding-top", "padding-right", "padding-bottom", "padding-left",
                                                                             "margin-top", "margin-right", "margin-bottom", "margin-left",
                                                                             "border-width", "line-height", "width", "height");
                                                 styles["cursor"] = this.disabled ? "default" : "text";
                                                 var mywidth = Math.max(this.clientWidth - styles["padding-left"].toInt() - styles["padding-right"].toInt(), styles["width"].toInt());
                                                 var myheight = Math.max(this.clientHeight - styles["padding-top"].toInt() - styles["padding-bottom"].toInt(), styles["height"].toInt());

                                                 placeholderdata.node.setStyles(styles)
                                                                           .setStyles({ display: "block"
                                                                                      , top: styles["margin-top"].toInt()
                                                                                      , left: styles["margin-left"].toInt()
                                                                                        // Take client size of input (take textarea scrollbars into account) and subtract paddings
                                                                                      , width: mywidth
                                                                                      , height: myheight
                                                                                      });
                                               }
                                               catch (e) {}
                                             }
                                             else
                                               // Hide the placeholder node
                                               placeholderdata.node.setStyle("display", "none");
                                           }
                                         }).bind(this)
                              , onpropertychange: (function()
                                                   {
                                                     var placeholderdata = this.retrieve("wh-placeholderdata");
                                                     // Don't update placeholder state if our value didn't change
                                                     if (!event || event.srcElement != this || event.propertyName != "value")
                                                       return;

                                                     // Only update placeholder state if we're not the active element
                                                     if ($wh.getActiveElement(document) != this)
                                                       placeholderdata.onblur();
                                                   }).bind(this)
                              };

      // Add focus and blur events to update the input's value
      this.addEvents({ focus: placeholderdata.onfocus
                     , blur: placeholderdata.onblur
                     , change: placeholderdata.onblur
                     });
      // IE has a onpropertychange event which we can use to listen for value changes by script
      if (this.attachEvent && "onpropertychange" in this)
        this.attachEvent("onpropertychange", placeholderdata.onpropertychange);

      // Call onblur once to initialize
      this.store("wh-placeholderdata",placeholderdata);
      //console.log("just set placeholderdata");
      //console.log(this.outerHTML);
      placeholderdata.onblur();
      return this;
    }
  };

// If node is supplied, only placeholders within that node are initialized, otherwise the whole document will be fixed up
window.$wh.fixupAllPlaceholders = function(node)
{
  if(node && window.$wh.hasNativePlaceholders)
    return;

  var selector = "input[placeholder!=''], textarea[placeholder!='']";
  (node ? $(node).getElements(selector) : $$(selector)).each(function(input)
  {
    var placeholder = input.getAttribute("placeholder");
    if (placeholder)
      input.set("placeholder", placeholder);
  });
}

// Placeholder natively supported by browser? (We'll assume that if a placeholder is supported on inputs, it is also supported
// on textareas)
window.$wh.hasNativePlaceholders = "placeholder" in document.createElement("input") && !location.href.contains("wh-placeholder-polyfill");

//automatically apply placeholder fixes on browsers that need it ?
window.$wh.autoFixPlaceholders = true;

window.addEvent("domready", function()
  {
    if(!window.$wh.hasNativePlaceholders && window.$wh.autoFixPlaceholders)
      window.$wh.fixupAllPlaceholders();
  });

})(document.id); //end mootools wrapper
