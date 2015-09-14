/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.element.measure');
/*! LOAD: frameworks.mootools.core, frameworks.mootools.more.element.measure
!*/

/*
EXPERIMENTAL!!
by Mark de Jong


B-Lex 2013

24-06-2013
- fixed check for empty nodes (with only whitespace), which also fixes support for tables
- inline-table's like inline-block
- correctly hide node if we bail out because the whole node is out of view (so it doesn't become visible incase ellipsis make content before smaller, causing the current node to shift up into view)


How to use:
- beware with tables:
    - ellipsis might cause overflowing cells to grow smaller, making cells with vertical-align: middle; appear to have their text visible,
      but actually they were hidden before ellipsis was applied
-

options:
-
-

// FIXME: use height in calculation to determine how many chars to try next
// FIXME: can we use ranges if available to get a better estimate of the amount of lines and how much chars to remove?
// ADDME: use ranges to check how many lines the text occupies in order to get an better estimate of where to cut

*/


(function($) {

if(!window.$wh) window.$wh={};

// multiline ellipsis for richtext content
$wh.applyEllipsisToHTML = new Class(
  { Implements: [Options]
  , options:   { break_on_words: true

               /** instead of disabling inline-block elements, keep them if they are partially visible
                   and instead apply ellipsis to content within that inline block
               */
               , ellipsis_to_inline_block: false

               /** whether to apply ellipsis to elements which are floated or positioned absolutely
               */
               , apply_to_out_of_flow: false
               , debug: false

               , height: 0
               }
  , container:     null // the main container to which apply last-line ellipsis
  , containerrect: null // positioning info on the container

  , initialize: function(container, options)
    {
      this.container = container;

      this.setOptions(options);

      // bail out if there is isn't any work to be done
      this.containerrect = container.getBoundingClientRect();
      if (this.containerrect.bottom - this.containerrect.top < this.options.height)
        return;

      this.processNode(container, false);
    }
/*
    // - remove text with ellipsis to original long text
    // - restore visibility of hidden elements/texts
  , restore: function()
    {
    }

    // completely restore to original state
    // - remove text with ellipsis to original long text
    // - restore visibility of hidden elements/texts
    // - strip away <span>'s we added for measuring
    // - remove variables we added to elements for tracking changes
  , restoreToOriginal: function()
    {
    }
*/
  , wrapTextNodes: function (container)
    {
/*
if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}
*/
      var currentnode = container.firstChild;
      var nextnode;
      while(currentnode)
      {
        nextnode = currentnode.nextSibling;

        if (this.options.debug && currentnode.nodeType == 1)
          //currentnode.style.outline = "solid #0000FF 1px";
          currentnode.style.outline = "solid rgba(0,0,255,0.25) 1px";


        //if (currentnode.nodeType == 3)
        if (currentnode.nodeType == 3)
        {
          var content = currentnode.textContent;

          var trimmed = content.trim();
          if( trimmed != "" )
          {
            var anonspan = document.createElement("span");
            anonspan.iswrappedtextnode = true;

            if (this.options.debug)
              anonspan.style.outline = "solid rgba(255,0,0,0.25) 1px";

            anonspan.appendChild(currentnode);

            //console.log(container, anonspan, nextnode);
            container.insertBefore(anonspan, nextnode);
          }
        }

        currentnode = nextnode;
      }
    }

  , processNode: function(container, overflowing)
    {
      if(this.options.debug)
        console.group(container);

      var result = this.processNode2(container, overflowing);

      if(this.options.debug)
      {
        if (result)
          console.info("Ellipsis was applied.");
        else
          console.info("FAILED to apply ellipsis here.");

        console.groupEnd();
      }

      return result;
    }

    /**
    container
    overflowing - we already are in a node that is overflowing, there's no need to calculate overflow, whe're just here to determine inflow and out-of-flow contain and try to make room from ellipsis
    */
  , processNode2: function(container, overflowing)
    {
      //var first_partial_inflow;
      var nodes_inflow = [];
      var nodes_outofflow = [];
      var nodes_inlineblock = [];
      var index_first_overflow = null;

      var applied_ellipsis;

      if(this.options.debug)
        console.log("Process node");

      var currentnode_rect = container.getBoundingClientRect();

      /*
      console.log({ node_bottom: currentnode_rect.bottom
                  , main_container_top: this.containerrect.top
                  , maxheight: this.options.height
                  });
      */
      if (container != this.container
          && currentnode_rect.top - this.containerrect.top > this.options.height)
      {
        if(this.options.debug)
          console.warn(container, "isn't visible");

        container.setStyle("visibility", "hidden");

        return false;
      }

      // first wrap all textnodes
      this.wrapTextNodes(container);

  var forward = true;

      // look backwards until we find an elements that partially fits...
      // from thereon our quest is to find a nice place to break the line within the inline flow
      var currentnode = forward ? container.firstChild : container.lastChild;
      while(currentnode)
      {
        // whe've changed all textnodes to <span> elements so anything that isn't an element now isn't of interest to us
        if (currentnode.nodeType != 1)
        {
          currentnode = forward ? currentnode.nextSibling : currentnode.previousSibling;
          continue;
        }

/*
        if (this.options.ellipsis_to_inline_block && (currentnode.getStyle("display") == "inline-block" || currentnode.getStyle("display") == "inline-table"))
        {
          nodes_inlineblock.push(currentnode);
          nodes_inflow.push(currentnode);
          currentnode = forward ? currentnode.nextSibling : currentnode.previousSibling;
          continue;
        }
*/


        if ( (this.options.ellipsis_to_inline_block && (currentnode.getStyle("display") == "inline-block" || currentnode.getStyle("display") == "inline-table"))
           || (currentnode.tagName == "TBODY" || currentnode.tagName == "TR" || currentnode.tagName == "TD") )
        {
          nodes_inlineblock.push(currentnode);
          nodes_inflow.push(currentnode);
          currentnode = forward ? currentnode.nextSibling : currentnode.previousSibling;
          continue;
        }

/*
if (currentnode.tagName == "TBODY" || currentnode.tagName == "TR" || currentnode.tagName == "TD")
{
  nodes_outofflow.push(currentnode);
          currentnode = forward ? currentnode.nextSibling : currentnode.previousSibling;
          continue;
}
*/

        var inflow = !(currentnode.getStyle("float") != "none" || currentnode.getStyle("position") != "static");
//        if (inflow && (currentnode.tagName == "TBODY" || currentnode.tagName == "TR")) // || currentnode.tagName == "TD"))
//          inflow = false;


        //console.log(inflow, currentnode, this.options.apply_to_out_of_flow);
        if (!inflow)
        {
          nodes_outofflow.push(currentnode);
          currentnode = forward ? currentnode.nextSibling : currentnode.previousSibling;
          continue;
        }

        nodes_inflow.push(currentnode);



        if (!overflowing && index_first_overflow == null) // we assume for speed and simplicity that after the first overflow everything after that is out of view
        {
          var nodepos = currentnode.getBoundingClientRect();

          var ypos = nodepos.bottom - this.containerrect.top;

          if(this.options.debug)
            console.log(Math.round(ypos), currentnode);

          if (ypos > this.options.height)
          {
            if(this.options.debug)
              console.info("First overflowing node is", currentnode)

            index_first_overflow = nodes_inflow.length-1;//;currentnode;
          }
        }

        currentnode = forward ? currentnode.nextSibling : currentnode.previousSibling;
      }


      if (index_first_overflow != null)
      {
        if(this.options.debug)
          console.log("Hiding all inflow content after the first overflowing node");

        // hide all inflow nodes after the first hidden node
        for(var tel=index_first_overflow+1; tel<nodes_inflow.length; tel++)
          nodes_inflow[tel].setStyle("visibility", "hidden");
      }

      var tel;
      if (overflowing || index_first_overflow != null)
      {
        // FIXME: now resursively scan backwards while hiding or truncating content until either ellipsis has succesfully been added
        // or until we totally fail to do so
        if (overflowing)
          tel = nodes_inflow.length-1;
        else
          tel = index_first_overflow;

        while(tel > -1 && !applied_ellipsis)
        {
          var processnode = nodes_inflow[tel];

          if(this.options.debug)
            console.log("processnode ", processnode);

          var nodepos = processnode.getBoundingClientRect();
          if (nodepos.top - this.containerrect.top > this.options.height)
          {
            if(this.options.debug)
              console.log("fully out of view:", processnode);
          }
          else if (processnode.iswrappedtextnode)
          {
            applied_ellipsis = this.attemptToApplyEllipsis(processnode);

            if(this.options.debug)
              console.log("ellipsis applied:", applied_ellipsis);
          }
          else if (this.options.ellipsis_to_inline_block && (processnode.getStyle("display") == "inline-block" || processnode.getStyle("display") == "inline-table"))
          {
            // a special case for our ellipsis_to_inline_block feature
            // any content after the inline-block may have ellipsis applied to it,
            // however we don't want an ellipsis inbetween or before inline-block's
            applied_ellipsis = true;
          }
          else if (!processnode.firstChild) // no content or <img>/<input>
          {
            // and has nothing in it (no sneaky block elements in it) why
            if(this.options.debug)
              console.info("Node without textual content: ", processnode);

            // might be a <button> or inline-block or something with a width
            //processnode.setStyle("visibility", "hidden");

            // insert and check whether the ellipsis fits
            var new_ellipsis = document.createElement("span");
            new_ellipsis.appendChild(document.createTextNode("\u2026"));
            processnode.parentNode.insertBefore(new_ellipsis, processnode);

            var rect = new_ellipsis.getBoundingClientRect();
            if (rect.bottom - this.containerrect.top <= this.options.height)
              applied_ellipsis = true;
            else
              new_ellipsis.parentNode.removeChild(new_ellipsis); // forget it, it's a fail so bail out
          }
          else
          {
            if(this.options.debug)
              console.log(processnode);
            applied_ellipsis = this.processNode(processnode, true);

            if(this.options.debug)
              console.info("Ellipsis was applied in child ", processnode);
          }

          if (!applied_ellipsis)
            processnode.setStyle("visibility", "hidden");

          tel--;
        }
      }

      // post process out-of-flow elements if requested
      // keeping out of main loop both to keep the main loop simple and focus/group the debugging on the flow currently being processed
      if (this.options.apply_to_out_of_flow)
      {
        for (var tel=0; tel < nodes_outofflow.length; tel++)
        {
          var pnode = nodes_outofflow[tel];

          if(this.options.debug)
            console.log("PROCESS: Processing out of flow element:", pnode);

          this.processNode(pnode, false);
        }
      }

      if (this.options.ellipsis_to_inline_block)
      {
        for (var tel=0; tel < nodes_inlineblock.length; tel++)
        {
          var pnode = nodes_inlineblock[tel];

          if(this.options.debug)
            console.log("PROCESS: Processing inline-block element:", pnode);

          this.processNode(pnode, false);
        }
      }

      return applied_ellipsis;
    }




    // FIXME: use height in calculation to determine how many chars to try next
    // FIXME: can we use ranges if available to get a better estimate of the amount of lines and how much chars to remove?
  , attemptToApplyEllipsis: function(currentnode)
    {
      if(this.options.debug)
      {
        console.log("Gonna chop up ", currentnode);
        console.log("It's original text ", currentnode.textContent);
      }

      // chop up the textual content
      // (don't use HTML, use otherwise whe'll have to deal with HTML entities and prevent cutting entities in half)
      var textcontent = currentnode.textContent;
      currentnode.originalTextContent = textcontent;

      // ADDME: use ranges to check how many lines the text occupies in order to get an better estimate of where to cut

      // find the max amount of chars that will fit
      var textlength = textcontent.length;
      var trylength = Math.round(textlength / 2);

      var lowest_known_bad = textlength;
      var highest_ok = -1;

      var finished = false;
      var countdown = 100;

      while (!finished && countdown-- > 0)
      {
        var newtextcontent = textcontent.substr(0, trylength) + "\u2026";

        currentnode.textContent = newtextcontent;

        var rect = currentnode.getBoundingClientRect();
        //console.log(trylength + " chars is "+rect.width+" x "+rect.height);

        /*
        console.log({ containertop: this.containerrect.top
                    , node_to_resize_Bottom: rect.bottom
                    , maxheight: this.options.height
                    });
        */
        if (rect.bottom - this.containerrect.top <= this.options.height)
        {
          //console.log(trylength+ " fits.");
          if (trylength > highest_ok)
            highest_ok = trylength;
        }
        else
        {
          //console.log(trylength+ " is too large.");
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
          //console.log("Next length must between "+highest_ok+" en "+lowest_known_bad+", we gaan voor "+trylength);
        }
      }

      //if (finished)
      //  console.info("Succes, length will be ", highest_ok);

      if (highest_ok < 1)
      {
        // although the node is partially visible, it is too small to fit content(+ellipsis)
        currentnode.textContent = textcontent;//"";
        currentnode.setStyle("visibility", "hidden");
        return false; // failed to apply ellipsis
      }

      uselength = highest_ok;

      if(this.options.debug)
        console.log("Use length (before word break): ", uselength);

      if (this.options.break_on_words)
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

      newtextcontent = textcontent.substr(0, uselength) + "\u2026" // "…";
      currentnode.textContent = newtextcontent;

      if(this.options.debug)
      {
        var rect = currentnode.getBoundingClientRect();
        console.info(uselength + " chars is "+Math.round(rect.width)+" x "+Math.round(rect.height));
      }

      return true; // succesfully applied ellipsis
    }
  });

})(document.id);
