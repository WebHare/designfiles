/* generated from Designfiles Public by generate_data_designfles */
require ('./tagedit.css');
require ('frameworks.rangy13');
require ('frameworks.mootools.core');
require ('frameworks.mootools.more.class.binds');
require ('frameworks.mootools.more.element.forms');
require ('wh.compat.base');
require ('wh.compat.dragdrop');
require ('wh.ui.base');
require ('wh.components.autocomplete');
/*! LOAD: frameworks.rangy13, frameworks.mootools.core
    LOAD: frameworks.mootools.more.class.binds, frameworks.mootools.more.element.forms
    LOAD: wh.compat.base, wh.compat.dragdrop
    LOAD: wh.ui.base, wh.components.autocomplete
!*/

/*
  A simple tag editor.

  Example usage:
    <input name="tags" value="aap;noot ; mies ;aap" class="tageditor" placeholder="Add more..." />

    document.getElements("input.tageditor").each(function(input)
    {
      new $wh.TagEdit(input, { tagSeparator: ";" });
    });

    [ [aap] [noot] [mies] [aap] |Add more... ]

  Options:
    tagSeparator (default: ",")
      Tag separator within the input value
    allowMultiple (default: false)
      Allow tags to appear multiple times
    caseSensitive (default: false)
      If multiple tag check if case sensitive
    allowReorder (default: true)
      Allow tags to be reordered using drag-n-drop (currently unsupported)
    enabled (default: true)
      If the input is currently enabled
    placeholder (default: "")
      Placeholder text (overrides the original input's placeholder attribute)
*/

(function($) { //mootools wrapper
"use strict";

$wh.TagEdit = new Class(
{ Implements  : [ Events, Options ]
, Binds: [ "_onNodeFocus", "_onNodeBlur", "_onNodeKeyDown", "_onNodeMouseDown", "_onNodeClick"
         , "_onTagMouseDown"
         , "_onInputFocus", "_onInputBlur", "_onInputKeyDown", "_onInputKeyPress", "_onInputPaste"
         , "_onAutocompleteSelected"
         ]


  // ---------------------------------------------------------------------------
  //
  // Variables
  //

, options: { tagSeparator: ","     // Tag separator within the input value
           , allowMultiple: false  // Allow tags to appear multiple times
           , caseSensitive: false  // If multiple tag check if case sensitive
           , allowReorder: true    // Allow tags to be reordered using drag-n-drop
           , enabled: true         // If the input is currently enabled
           , placeholder: ""       // Placeholder text (overrides the original input's placeholder attribute)
           , multiline: true       //
           , useinput: false       // For backwards compatibility or when contentEditable doesn't work, set to true to
                                   // fallback to using an ordinary <input>
           , validatetags: null    // Function to filter for valid tags
           }

, tabindex: 0         // Tab index for focusing our node
, el: null            // Original input element
, node: null          // Container node for tags and input
, inputnode: null     // Tag input node
, autocomplete: null  // $wh.AutoComplete object

, tags: []            // The list of actual tags, either a string (no node yet), or a { tag, node } object
, selectedTag: null   // Currently selected tag (a { tag, node } object within tags)
, inputFocused: false // If the input node currently is focused


  // ---------------------------------------------------------------------------
  //
  // Init
  //

, initialize: function(el, options)
  {
    // Initialize
    this.setOptions(options);
    this.el = $(el);

    // Create DOM nodes
    this._buildNode();

    if (this.el)
    {
      // Read initial tags from input node, will fill the tags array
      this.setStringValue(this.el.value);

      // Store a reference to the original input element
      this.node.store('wh-ui-replaces', this.el);
    }

    console.log(options, this.options.validatetags);
  }

  /* Set the $wh.AutoCompleteValues object supplying options when typing tags. Set restrict to true to restrict tags to those
     provided by the optionValues object
  */
, setOptionService: function(optionService, restrict)
  {
    if (instanceOf(optionService, $wh.AutoCompleteValues))
    {
      this.autocomplete = new $wh.AutoComplete(this.inputnode, optionService);
      this.autocomplete.addEvent("valueselected", this._onAutocompleteSelected);
      this.restrictValues = !!restrict;

      // Apply new autocomplete values to current tags
      if (this.restrictValues)
        this.setStringValue(this.getStringValue());
    }
  }

  // ---------------------------------------------------------------------------
  //
  // Public API
  //

  /** @short Add a new tag
      @long This function adds a new tag. If tags may not appear multiple times and a tag with the given text is already
            present, the tag is not added.
      @param text The text of the tag to add
      @param callback The function that is called after the tag is added (it isn't called when not added)
  */
, addTag: function(text)
  {
    this._validateAndAddTag(text);
  }

  /** @short Check if a tag with the given text is present
      @param text The text to check
      @return If a tag with the given text is present
  */
, hasTag: function(text)
  {
    // getTag will return the first matching tag
    return !!this._getTag(text);
  }

  /** @short Delete a tag
      @long This function deletes a tag. If tags may appear multiple times, all tags with the given text are deleted.
  */
, deleteTag: function(text)
  {
    // getTag will return the first matching tag
    var tag = this._getTag(text);
    while (tag)
    {
      // Remove the tag from the array
      this.tags = this.tags.filter(function(check)
      {
        return check != tag;
      });
      // Get a reference to the next node to focus
      var selNode = tag.node.nextSibling;
      tag.node.destroy();
      // If the next node is the input node, focus it, otherwise select the tag node
      if (!selNode || selNode === this.inputnode)
        this.inputnode.focus();
      else
        this._setSelectedTag(selNode);

      // Check if there is another matching tag
      tag = this._getTag(text);
    }
    this._setInputValue();
  }

  /** @short Get the tags
  */
, getValue: function()
  {
    return this.tags.map(function(tag)
    {
      return typeof tag === "string" ? tag : tag.tag;
    });
  }

  /** @short Get the tags as concatenated string
  */
, getStringValue: function()
  {
    return this.getValue().join(this.options.tagSeparator);
  }

, setStringValue: function(value)
  {
    var wasempty = this.tags.length == 0;
    this.tags = [];
    this._updateTagNodes();
    this._addTagsFromValue(value, false);

    // Resync the value in the coupled input when _addTagsFromValue didn't do that because there was nothing to add
    if (!wasempty && !this.tags.length)
      this._setInputValue();
  }

  /** @short Get the tagedit node
  */
, toElement: function()
  {
    return this.node;
  }

, haveUnprocessedInput: function()
  {
    return this._getInputText().clean() != '';
  }

  // ---------------------------------------------------------------------------
  //
  // Helper functions - node building
  //

  /** Build the tagedit node
  */
, _buildNode: function()
  {
    // Create the container node, holding the tag nodes and input node
    this.node = new Element("span", { "class": "wh-tagedit" + (this.el && this.el.className ? " " + this.el.className : "")
                                    , "styles": { "display": "inline-block"
                                                , "overflow": "hidden"
                                                }
                                    , "events": { "focus": this._onNodeFocus
                                                , "blur": this._onNodeBlur
                                                , "keydown": this._onNodeKeyDown
                                                , "mousedown": this._onNodeMouseDown
                                                , "click": this._onNodeClick
                                                }
                                    });
    if (!this.options.multiline)
      this.node.setStyles({ "white-space": "nowrap" });
    if (this.el)
      this.node.inject(this.el, "before");

    // Create the input node as a content-editable span
    if (this.options.useinput)
      this.inputnode = new Element("input", { "type": "text" });
    else
      this.inputnode = new Element("span", { "contenteditable": true });
    this.inputnode.set({ "class": "wh-tagedit-input"
                       , "styles": { "-webkit-appearance": "none"
                                   , "border": "none"
                                   , "box-sizing": "border-box"
                                   , "cursor": "text"
                                   , "display": "inline-block"
                                   , "max-width": "100%"
//                                   , "outline": "none"
                                   , "overflow": "hidden"
                                   , "vertical-align": "top"
                                   , "white-space": "nowrap"
                                   }
                       , "events": { "focus": this._onInputFocus
                                   , "blur": this._onInputBlur
                                   , "keydown": this._onInputKeyDown
                                   , "keypress": this._onInputKeyPress
                                   , "paste": this._onInputPaste
                                   }
                       })
                   .inject(this.node);

    // Read some attributes from the original input node, the hide it
    if (this.el)
    {
      this.tabindex = this.el.get("tabindex") || 0;
      this.options.placeholder = this.options.placeholder || this.el.placeholder;
      this.el.setStyles({ "display": "none" });
    }

    // Enable focus for key navigation
    this.node.setAttribute("tabindex", this.options.enabled ? this.tabindex : -1);
    //ADDME: actually disable input node
    if (!this.options.enabled)
      this.inputnode.set("disabled", "disabled");
    if (this.options.placeholder)
    {
      // Set the 'data-placeholder' attribute, the value of which is used as the ::after content of the input node
      this.inputnode.setAttribute("data-placeholder", this.options.placeholder);
    }
    // Make the input large enough to at least fit the placeholder, with a minimum of 30 pixels
    if (!this.options.useinput)
      this.inputnode.setStyle("min-width", Math.max(this.inputnode.getSize().x, 30));

    // Create the nodes for the tags
    this._updateTagNodes();
  }

  /** Create tag nodes for all nodes
  */
, _updateTagNodes: function()
  {
    // Remove current tag nodes
    this.node.getElements(".wh-tagedit-tag").dispose();

    var prevtag = null;
    this.tags.each(function(tag, idx)
    {
      // If tag is a simple string, create a node for it
      if (typeof tag === "string")
      {
        this.tags[idx] = { tag: tag
                         , node: this._createTagNode(tag)
                         };
        tag = this.tags[idx];
      }

      // If there is no previous tag, insert it at the start of the element, otherwse insert it after the previous tag
      if (!prevtag)
        tag.node.inject(this.node, "top");
      else
        tag.node.inject(prevtag.node, "after");
      prevtag = tag;
    }, this);
  }

  /** Create a new tag node
  */
, _createTagNode: function(text)
  {
    // Create a node for the tag
    var node = new Element("span", { "class": "wh-tagedit-tag"
                                   , "styles": { "box-sizing": "border-box"
                                               , "display": "inline-block"
                                               , "vertical-align": "top"
                                               , "white-space": "nowrap"
                                               }
                                   , "text": text
                                   , "events": { "mousedown": this._onTagMouseDown }
                                   });
    return node;
  }

  // ---------------------------------------------------------------------------
  //
  // Helper functions - manipulation
  //

  /** Validates and adds a single tag
      @param text Tag to add
      @param from_autocomplete If the source was the autocomplete service
      @return Promise, bool whether a tag was added
  */
, _validateAndAddTag: function(text, from_autocomplete)
  {
    // Clean tag whitespace
    text = text.clean();
    if (text)
      return this._addTagsFromValues([ text ], from_autocomplete);

    return Promise.resolve(false);
  }

  /** Test if the autocomplete results contains a certain tag
      @param text Tag to test for
      @param result Autocomplete result
      @return(bool) Whether the tag is present in the result (case-insensitive)
  */
, _testAutoCompleteResultContainsTag: function(text, result)
  {
    return result.values.some(function(value)
    {
      return value.value.toUpperCase() == text.toUpperCase();
    });
  }

  /** Filter out duplicate tags before adding them
  */
, _filterCopiesAndClean: function(tags)
  {
    if (this.options.allowMultiple)
      return tags;

    var newtags = [];
    var unewtags = [];

    tags.each(function(tag)
    {
      tag = tag.clean();
      if (!tag || this.hasTag(tag))
        return;

      var testtag = this.options.caseSensitive ? tag.toUpperCase() : tag;
      if (unewtags.contains(testtag))
        return;

      newtags.push(tag);
      unewtags.push(testtag);
    }.bind(this));

    return newtags;
  }

, _checkValidateTagsResult: function(results)
  {
    if (results && typeof results != "array")
      return results;

    console.error("Return value of tagedit options.validatetags is not an array", this.options.validatetags, results);
    return [];
  }

  /** Validates a list of tags, returns a promise with the list of valid tags
      @param tags List of tags to Validate
      @param from_autocomplete If the source is from the autocomplete service
      @return Promise, result is the list of filtered tags
  */
, _validateTags: function(tags, from_autocomplete)
  {
    // Filter out duplicates (with current tag list and within new tags themselves)
    tags = this._filterCopiesAndClean(tags);

    // Construct a promise with the vanilla list
    var retval = Promise.resolve(tags);

    // No tags: thay are all valid!
    if (!tags.length)
      return retval;

    // No autocomplete&restrict, or validatetags callback - no further filtering needed
    if ((!this.autocomplete || !this.restrictValues) && !this.options.validatetags)
      return retval;

    if (this.options.validatetags)
      return retval.then(this.options.validatetags).then(this._checkValidateTagsResult.bind(this));

    // Don't check with autocomplete if the source was autocomplete anyway
    if (from_autocomplete)
      return retval;

    var valid_tags = [];
    var chain = Promise.resolve(true);

    for (var i = 0; i < tags.length; ++i)
    {
      // Tag will be updated throughout the loop, so bind it in the function
      var tag = tags[i];

      // Chain the autocomplete calls
      chain = chain.then(this._checkWithAutoComplete.bind(this, tag, valid_tags), function()
      {
        // on RPC error - ignore!
      }.bind(this));
    }

    // Return the valid tags after the chain has completed
    return chain.then(function() { return valid_tags; }, function(e) { console.error('Got exception', e.stack || e); return []; });
  }

  /** Checks if a tag is given back by autocomplete for that value. If so, it is added to valid_tags
      @return Promise that will be fulfilled when the check has finished
  */
, _checkWithAutoComplete: function(checktag, valid_tags)
  {
    // Get a promise for the autocomplete getValues call
    var res = this.autocomplete.service.getValues(checktag);

    // If success, add the tag to our list of valid tags (if found), else ignore the error
    res = res.then(function(result)
    {
      // on success. We can refer to valid_tags here, it is a global value
      if (this._testAutoCompleteResultContainsTag(checktag, result))
        valid_tags.push(checktag);
    }.bind(this));

    return res;
  }

, _addValidTags: function(newtags)
  {
    this.tags.append(newtags);
    this._setInputValue();

    // Update the tag nodes
    this._updateTagNodes();
  }

  /** Add tags from a value (will be split on separator)
      @param value String with multiple tags
  */
, _addTagsFromValue: function(value, from_autocomplete)
  {
    var added = false;
    // Split the value using the tag separator, add each tag recursively
    return this._addTagsFromValues(value.split(this.options.tagSeparator), from_autocomplete);
  }

  /** Add multiple tags from values) */
, _addTagsFromValues: function(values, from_autocomplete)
  {
    if (values.length == 0)
      return Promise.resolve(false);

    var res = this._validateTags(values, from_autocomplete);
    res.then(function(validated) { console.warn('validated', validated); });

    // When we have the valid tags, add them, return whether we have added a tag
    res.then(function(validtags)
    {
      this._addValidTags(validtags);
      return validtags.length != 0;
    }.bind(this));

    res = res["catch"](function(e) { console.error('Got exception validating tags: ', e.stack || e); return []; });

    return res;
  }

  /** Resync the input value */
, _setInputValue: function()
  {
    if (!this.el)
      return;
    this.el.value = this.getStringValue();
  }

, _getInputText: function()
  {
    return this.options.useinput ? this.inputnode.value : this.inputnode.get("text");
  }

  /** Process all the text from the user input, convert to tags and fire the 'change' event
  */
, _processInputText: function()
  {
    var text = this._getInputText();
    if (text)
      this._addTagsFromValue(text).then(this._clearInputText.bind(this)).then(this._fireChangeEvent.bind(this));
  }

  /// Clear the input text
, _clearInputText: function()
  {
    this._setInputText("");
  }

  /// Set the input text to a certain value
, _setInputText: function(text, update)
  {
    if (this.options.useinput)
      this.inputnode.value = text;
    else
      this.inputnode.set("text", text);
    if (update)
      this._updateTagNodes();
  }

  /** Lookup a tag
      @param tag String or element from tag array
  */
, _getTag: function(tag)
  {
    // If not searching for a string, find the requested tag object
    if (typeof tag != "string")
      return this.tags.filter(function(check)
      {
        return check === tag;
      }).pick();

    // Find the tag with the requested text
    if (!this.options.caseSensitive)
      tag = tag.toUpperCase();
    return this.tags.filter(function(check)
    {
      check = typeof check === "string" ? check : check.tag;
      return (this.options.caseSensitive ? check : check.toUpperCase()) === tag;
    }, this).pick();
  }

  /** Set the currently selected tag (by node)
      @param tagNode Tag node to select
  */
, _setSelectedTag: function(tagNode)
  {
    // Find the tag with the request node
    var tag = this.tags.filter(function(check)
    {
      return typeof check === "object" && check.node === tagNode;
    }).pick();
    if (this.selectedTag === tag)
      return;

    // The currently selected tag is no longer selected
    if (this.selectedTag)
      $(this.selectedTag.node).removeClass("wh-tagedit-selected");
    // Select the new tag
    this.selectedTag = tag;
    if (this.selectedTag)
    {
      this.node.focus();
      this.selectedTag.node.addClass("wh-tagedit-selected");
    }
  }

  /// Fire a change event (when list of tags has changed)
, _fireChangeEvent: function()
  {
    this.fireEvent("change", { target: this });
  }

  // ---------------------------------------------------------------------------
  //
  // Callbacks
  //

, _onNodeFocus: function()
  {
  }

, _onNodeBlur: function()
  {
  }

, _onNodeKeyDown: function(event)
  {
    if (this.selectedTag)
    {
      switch (event.key)
      {
        // Delete the currently selected tag
        case "backspace":
        case "delete":
        {
          this.deleteTag(this.selectedTag);
          this._fireChangeEvent();
          event.stop();
          break;
        }

        // Select the previous tag
        case "left":
        case "up":
        {
          var selNode = this.selectedTag.node.previousSibling;
          if (selNode)
            this._setSelectedTag(selNode);
          event.stop();
          break;
        }

        // Select the next tag, or focus the input node when the last tag was selected
        case "down":
        case "right":
        {
          var selNode = this.selectedTag.node.nextSibling;
          if (selNode)
          {
            if (selNode === this.inputnode)
              this.inputnode.focus();
            else
              this._setSelectedTag(selNode);
          }
          event.stop();
          break;
        }

        // Focus the input node
        case "tab":
        {
          this.inputnode.focus();
          event.stop();
          break;
        }

        // Deselect the tag
        case "esc":
        {
          this._setSelectedTag(null);
          event.stop();
          break;
        }
      }
    }
  }

, _onNodeMouseDown: function(event)
  {
    if (event.target == this.node)
      event.preventDefault();
  }

, _onNodeClick: function(event)
  {
    if (event.target == this.node)
      this.inputnode.focus();
  }

, _onTagMouseDown: function(event)
  {
    event.stop();

    // Select the clicked tag
    if (this.options.enabled)
      this._setSelectedTag(event.target.getSelfOrParent(".wh-tagedit-tag"));
  }

, _onInputFocus: function()
  {
    // Deselect any selected tag
    this._setSelectedTag(null);
    this.inputFocused = true;
  }

, _onInputBlur: function()
  {
    this.inputFocused = false;
  }

, _onInputKeyDown: function(event)
  {
    switch (event.key)
    {
      // If nothing is selected and the cursor is at the leftmost position of the input, select the last tag and blur the input
      case "backspace":
      case "left":
      {
        var haveSelection = false;
        if (this.options.useinput)
          haveSelection = this.inputnode.getSelectionStart() + this.inputnode.getSelectionEnd() === 0;
        else
        {
          var selection = rangy.getSelection();
          haveSelection = selection.isCollapsed && selection.focusOffset === 0;
        }
        if (this.tags.length && haveSelection)
        {
          this._setSelectedTag(this.tags.getLast().node);
          if (this.selectedTag)
          {
            this.inputnode.blur();
            event.stop();
          }
        }
        break;
      }

      // Add the entered text as tag(s)
      case "enter":
      {
        event.stop();
        this._processInputText();
        break;
      }

      case 'down':
      {
        if (this.autocomplete && this.autocomplete.trySelectFirstMenuItem())
          event.stop();
        break;
      }
    }
  }

, _onInputKeyPress: function(event)
  {
    // Add the entered text as tag
    if (event.key == this.options.tagSeparator)
    {
      event.stop();
      this._processInputText();
    }
  }

, _onInputPaste: function(event)
  {
    // Never allow default paste
    event.stop();

    // Standard: event.clipboardData, IE: window.clipboardData
    var clipboardData = event.event.clipboardData || window.clipboardData;
    if (clipboardData)
    {
      var pasted = "";
      if (clipboardData.types)
      {
        // Standard
        var types = Array.from(clipboardData.types);
        if (types.indexOf("text/plain") >= 0)
        {
          pasted = clipboardData.getData("text/plain");
        }
        else if (types.indexOf("text/html") >= 0)
        {
          // Convert to plain text by setting 'html' property and getting 'text' property
          var pasteboard = new Element("span", { "html": clipboardData.getData("text/html") });
          pasted = pasteboard.get("text");
          pasteboard.destroy();
        }
      }
      else
      {
        // IE
        pasted = clipboardData.getData("Text");
      }

      pasted = pasted.clean();
      if (pasted)
      {
        // Replace the current selection with the pasted text
        if (this.options.useinput)
        {
          this.inputnode.insertAtCursor(pasted);
        }
        else
        {
          var selection = rangy.getSelection();
          if (selection.rangeCount > 0)
          {
            var range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(pasted));
          }
        }
      }
    }
  }

  /** Called when user selects a value from the autocomplete handler
      @param event Event
      @cell event.value Record with autocomplete results
      @cell event.value.value Tag
      @cell event.value.title title
  */
, _onAutocompleteSelected: function(event)
  {
    if (event.value)
    {
      // Validate and add the tag
      var res = this._validateAndAddTag(event.value.value);

      // After that clear the current input
      res.then(this._setInputText.bind(this, ""));

      // And then fire a change event
      res.then(this._fireChangeEvent.bind(this));
    }
  }
});

function replaceTagEditComponent(input, options)
{
  console.error(options);
  if (input.get("tag") != "input")
  {
    console.warn("$wh.TagEdit.replaceComponents can only replace <input> elements.")
    return;
  }

  // Create a new tagedit component
  var comp = new $wh.TagEdit(input, options);

  // Replace the current input with the new input's node
  input.setStyle("display", "none");
  input.parentNode.insertBefore($(comp), input);

  // FIXME: this are here for legacy reasons and should not be used in new code
  input.store("wh-ui-replacedby", $(comp));
  return comp;
}

$wh.TagEdit.replaceComponent = function(input, options)
{
  return replaceTagEditComponent($(input), options || {});
}

$wh.TagEdit.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceTagEditComponent, options);
}

})(document.id); //end mootools wrapper
