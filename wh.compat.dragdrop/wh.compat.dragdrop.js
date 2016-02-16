/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
/*! LOAD: wh.compat.base
!*/

/** Drag and drop compatibility library

    This library fixes some browser quirks related to mouse coordinates in drag
    and drop events, and it makes all elements having the draggable attribute
    set actually draggable in Internet Explorer, by calling the dragDrop function
    in the element's mousedown handler.

    Example of drag and drop usage:

    <!-- Some drag sources -->
    <div id="jane_smith" draggable="true">Jane Smith</div>
    <div id="john_doe" draggable="true">John Doe</div>
    <div id="anonymous" draggable="true">Anonymous</div>
    <!-- The drop target -->
    <div id="names" />

    $("jane_smith").addEvent("dragstart", function(event)
    {
      // Set some 'x-example/person' data
      $wh.dndSetData(event, "x-example/person", { name: "Jane Smith", age: 25 });
      // Allow the 'copy' effect
      event.event.dataTransfer.effectAllowed = "copy";
    });
    $("john_doe").addEvent("dragstart", function(event)
    {
      // Set some 'x-example/person' data
      $wh.dndSetData(event, "x-example/person", { name: "John Doe", age: 26 });
      // Allow the 'copy' effect
      event.event.dataTransfer.effectAllowed = "copy";
    });
    $("anonymous").addEvent("dragstart", function(event)
    {
      // Set some non-'x-example/person' data, which won't be accepted by our target
      $wh.dndSetData(event, "mytype", { name: "Anonymous", age: 0 });
      // Allow the 'copy' effect
      event.event.dataTransfer.effectAllowed = "copy";
    });

    $("names").addEvent("dragenter", function(event)
    {
      // Prevent default to enable dropping on this element
      event.preventDefault();
    }).addEvent("dragover", function(event)
    {
      // Get the stored WebHare data types
      var types = $wh.dndTypes(event);
      // See if 'x-example/person' data was dropped
      if (types && types.contains("x-example/person"))
      {
        // Set the drop effect to 'copy'
        event.event.dataTransfer.dropEffect = "copy";
        // Prevent default to enable dropping on this element
        event.preventDefault();
      }
      else
      {
        // We don't accept this drop, don't prevent default so dropping is not possible
      }
    }).addEvent("drop", function(event)
    {
      // Get the 'x-example/person' data
      var person = $wh.dndGetData(event, "x-example/person")
      // If we have a person, add him/her to the list of names
      if (person)
        this.grab(new Element("div", { text: person.name + " (" + person.age + ")" }));
      // Prevent the browser from trying to navigate to the data URL
      event.preventDefault();
    });
*/
(function($) { //mootools wrapper
  // Use the 'dragover' event on the document to capture the mouse coordinates
  // and apply them in the 'drag' and 'dragend' events. This only fails in Firefox
  // and because there is no behaviour test to test for this, we'll have to check
  // the Browser name.
  // Internet Explorer 10 on the desktop (and only the desktop version) does not
  // update the mouse position in drag events, and doesn't fire the 'mousemove'
  // event while dragging, so there is no way to know the mouse position in drag
  // events, other than the initial position (on 'dragstart'). Unfortunately,
  // there is no way of knowing if we're in the desktop version of IE10 or the
  // Metro ("Windows UI") version (which does supply the correct mouse
  // coordinates)...
  // See: http://msdn.microsoft.com/en-us/library/ie/hh771832%28v=vs.85%29.aspx#uastring
  var fix_dragevent_mousepos = Browser.firefox;

  // To make elements draggable in HTML5, the 'draggable' attribute should be
  // set. In Internet Explorer, this isn't supported, and the 'dragDrop'
  // function should be called on mousedown. We'll add an Element property which
  // adds (or removes) an event handler upon setting the 'draggable' property.
  // On domready, we'll also add the event handler to all elements having the
  // 'draggable' attribute set in HTML.
  // In Internet Explorer 10, support for the 'draggable' attribute was added,
  // and using this attribute in combination with calling dragDrop will result
  // in double drag actions, so only use dragDrop if draggable is not available.
  var fix_draggable_attribute = !("draggable" in document.createElement("div")) && "dragDrop" in document.createElement("div");

  // Make drag and drop events native MooTools events
  Element.NativeEvents.dragstart = 2;
  Element.NativeEvents.drag = 2;
  Element.NativeEvents.dragend = 2;
  Element.NativeEvents.dragenter = 2;
  Element.NativeEvents.dragover = 2;
  Element.NativeEvents.dragleave = 2;
  Element.NativeEvents.drop = 2;

  // Store the last mouse position for dragging events in Firefox
  $wh.dndlastmousepos = {};

  // Dragged node in IE
  var draggednode = null;

  // Our custom data url
  var webharedataurl = "webhare://data/";

  // The custom data type we're using to store our drag and drop data
  var webharedatatype = "x-webhare/data";
  // IE doesn't seem to support setting "url", so we'll fall back to "text"
  var fallbackdatatype = "Text";

  // Get the dataTransfer object for a dragging event
  function getDataTransfer(event)
  {
    if (event)
    {
      // DOM event
      if (event.dataTransfer)
        return event.dataTransfer;

      // MooTools event
      if (event.event)
      {
        if (event.event.dataTransfer)
          return event.event.dataTransfer;
      }
    }
  }

  // Retrieve the WebHare data stored from our custom data url
  function getWebHareData(event)
  {
    // Get the event's dataTransfer object
    var transfer = getDataTransfer(event);
    if (!transfer)
      return;

    // Get the data from the dataTransfer object
    var data;
    try
    {
      // Prefer our custom data type
      data = transfer.getData(webharedatatype);
    }
    catch (e)
    {
      // Using our custom data type failed, use the fallback data type
      data = transfer.getData(fallbackdatatype);
    }
    if (!data)
      return;

    // Check if this is a WebHare data URL
    if (data.substr(0, webharedataurl.length) != webharedataurl)
      return;

    // Retrieve and decode the data
    return JSON.decode(decodeURIComponent(data.substr(webharedataurl.length)), true);
  }

  // Store the WebHare data in our custom data url
  function setWebHareData(event, data)
  {
    // Get the event's dataTransfer object
    var transfer = getDataTransfer(event);
    if (!transfer)
      return;

    // The data, encoded within a URL
    data = webharedataurl + encodeURIComponent(JSON.encode(data));

    // Clear any existing data
    transfer.clearData();

    try
    {
      // Prefer our custom data type
      transfer.setData(webharedatatype, data);
    }
    catch (e)
    {
      // Using our custom data type failed, use the fallback data type
      transfer.setData(fallbackdatatype, data);
    }
  }

  /** @short Get the types of WebHare data stored in the drag and drop event
      @param event A drag and drop event
      @return An array of data types, or undefined if no data was stored
  */
  $wh.dndTypes = function(event)
  {
    var whdata = getWebHareData(event);
    if (!whdata)
      return;

    // Get all stored types
    return Object.keys(whdata);
  }

  /** @short Get the WebHare data for the given type from the drag and drop event
      @param event A drag and drop event
      @param type The type to retrieve (a string)
      @return The stored data, or undefined if no data of the given type was stored
  */
  $wh.dndGetData = function(event, type)
  {
    var whdata = getWebHareData(event);
    if (!whdata)
      return;

    // Get the requested type
    return whdata[type];
  }

  /** @short Set the WebHare data for a given type in the drag and drop event
      @long This function can be used to store data for a drag and drop action.
            It should be called in the 'dragstart' event. The data is stored in
            the dataTransfer object as a JSON encoded string, so be careful when
            trying to store Date objects etc.
            Because of limitations in the drag and drop implementation in some
            browsers (data which has been set cannot be retrieved within the
            same handler), it should only be called once within the event
            handler.
            The second argument can be an object, of which the keys are treated
            as type and the values as data, so multiple data can be stored.
            Because the data is stored as a URL, using the dataTransfer's
            setData method to store a URL will interfere with the WebHare data!
      @param event A drag and drop event
      @param type The type of data to store (a string), or an object with type
                  keys and data values
      @param data The data to store (any JSON encodable data)
  */
  $wh.dndSetData = function(event, type, data)
  {
    var whdata = getWebHareData(event);
    if (!whdata)
      whdata = {};

    if (typeOf(type) == "string")
    {
      // Set the data for the requested type
      whdata[type] = data;
    }
    else if (typeOf(type) == "object")
    {
      // Set the data for each requested type
      Object.each(type, function(d, t)
      {
        whdata[t] = d;
      });
    }

    // Store the data
    setWebHareData(event, whdata);
  }

  if (fix_draggable_attribute)
  {
    // Call the dragDrop function to initiate drag and drop. Called within the
    // context of the element receiving the mousedown.

    var currentdrag = null;

    var startDragMonitor = function(event)
    {
      // Reset state
      this.removeEvents();

      var button = event.event.which || event.event.button;
      if (button != 1)
        return true;

      // get the node we set the mouseDown event on
      var target = event.event.currentTarget;
      currentdrag =
          { target: target // node we set the mouseDown event on
          , x:      event.page.x
          , y:      event.page.y
          };

      target.addEvent('mousemove', onMouseMove);
      target.addEvent('mouseout', onMouseOut);
      target.addEvent('mouseup', onMouseUp);
      return true;
    }

    var removeEvents = function(target)
    {
      if (!target)
      {
        if (!currentdrag)
          return null;
        target = currentdrag.target;
      }

      target.removeEvent('mousedown', startDragMonitor);

      // Dragging the current node? Remove other events & reset drag state
      if (currentdrag && currentdrag.target == target)
      {
        currentdrag = null;
        target.removeEvent('mousemove', onMouseMove);
        target.removeEvent('mouseout', onMouseOut);
        target.removeEvent('mouseup', onMouseUp);
      }
      return target;
    }

    var onMouseMove = function(event)
    {
      //console.log('ie9 movetest', event.page.y, currentdrag.y, event.page.x, currentdrag.x);
      if (Math.abs(event.page.y - currentdrag.y) >= 5 || Math.abs(event.page.x - currentdrag.x) >= 5)
      {
        var target = removeEvents();
        if (target)
        {
          target.dragDrop();
          return false;
        }
      }
      return true;
    }

    var onMouseOut = function(event)
    {
      var target = removeEvents();
      if (target)
      {
        target.dragDrop();
        return false;
      }
      return false;
    }

    var onMouseUp = function(event)
    {
      removeEvents();
      return true;
    }

    Element.Properties.draggable =
    {
      get: function()
      {
        return this.draggable;
      },

      set: function(value)
      {
        this.draggable = !!value;

        if (this.draggable)
          this.addEvent("mousedown", startDragMonitor);
        else
          removeEvents(this);
      }
    };
  };

  document.addEvent("domready", function()
  {
    // Add a mousedown handler to each element that has the 'draggable' attribute
    // set (see above).
    if (startDragMonitor)
      $$("[draggable]").addEvent("mousedown", startDragMonitor);

    // Firefox doesn't supply coordinates with drag-related events, so we'll
    // just keep track of where the mouse is in some global state.
    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
    if (fix_dragevent_mousepos)
    {
      // Add these events to the documentElement, so they will fire when
      // dragging outside of the document body (which is only as tall as its
      // contents). Adding them to window or document also doesn't work.
      $(document.documentElement).addEvent("mousedown", function(event)
      {
        // Initialize on mousedown, because 'drag' events fire before 'dragover'.
        // This also means we're one step behind, but that's better than having
        // no coordinates at all.
        $wh.dndlastmousepos = { "client": event.client
                              , "page": event.page
                              };
      });
      $(document.html).addEvent("dragover", function(event)
      {
        $wh.dndlastmousepos = { "client": event.client
                              , "page": event.page
                              };
      });
    }
  });


  // Make our move events native MooTools events
  Element.NativeEvents.movestart = 2;
  Element.NativeEvents.move = 2;
  Element.NativeEvents.moveend = 2;

  // Store data about the current move
  $wh.moveeventdata = null;

  function getEventTarget(event)
  {
    if (event.target)
      return event.target;
    if (event.srcElement)
      return event.srcElement;
  }

  // Fire a move event and return the resulting event
  function fireMoveEvent(eventtype, event)
  {
    var target = $wh.moveeventdata ? $wh.moveeventdata.target : getEventTarget(event);
    if (!target)
      return;
    var relatedTarget = $wh.moveeventdata ? getEventTarget(event) : null;
    var movedX = $wh.moveeventdata ? event.screenX - $wh.moveeventdata.startX : 0;
    var movedY = $wh.moveeventdata ? event.screenY - $wh.moveeventdata.startY : 0;

    var evt  = target.ownerDocument.createEvent("MouseEvent");

    evt.initMouseEvent(eventtype, true, true, target.ownerDocument.defaultView, 0/*clickcount? is 0 correct?*/, event.screenX, event.screenY, event.clientX, event.clientY, false, false, false, false, event.button, relatedTarget);
    evt.movedX = movedX;
    evt.movedY = movedY;

    // In Internet Explorer 9, calling preventDefault in the event handler doesn't set defaultPrevented in our evt object.
    // If preventDefault was called, dispatchEvent returns false instead of true, so if it returns false, but
    // defaultPrevented is still false, we cannot detect if the default was prevented. Fortunately, for older Internet
    // Explorers we will have to check the returnValue property to see if an event was cancelled, which we can set here
    // because it's not an existing property of the event object in Internet Explorer 9 and up.
    $wh.fixupMouseEvent(evt, target);
    var cancelled = !target.dispatchEvent(evt);
    if (cancelled && !evt.defaultPrevented)
      evt.returnValue = false;

    return evt;
  }

  // Activate the global mouse handlers and store the original event target (the 'movable' element) and start position to
  // calculate mouse movement
  function startMove(target, startX, startY)
  {
    $wh.moveeventdata = { target: target
                        , startX: startX
                        , startY: startY
                        };

    var doc = $wh.moveeventdata.target.ownerDocument;
    ("createEvent" in doc ? doc.window : $(doc.html)).addEvents(
      { "mousemove": moveMouseMove
      , "mouseup": moveMouseUp
      });

    $(window).fireEvent("movingstart", { target: target});
  }

  // Deactivate the global mouse handlers and remove stored move data
  function stopMove()
  {
    var doc = $wh.moveeventdata.target.ownerDocument;
    $wh.moveeventdata = null;

    ("createEvent" in doc ? doc.window : $(doc.html)).removeEvents(
      { "mousemove": moveMouseMove
      , "mouseup": moveMouseUp
      });

    $(window).fireEvent("movingend", { target: null });
  }

  // Handle a mousedown event on a movable element
  function moveMouseDown(event)
  {
    // Start the move by firing the movestart event
    var evt = fireMoveEvent("movestart", event.event);

    // Check if the event was not cancelled
    if (evt.defaultPrevented !== true && evt.returnValue !== false)
    {
      // Start the move action
      startMove(getEventTarget(event.event), event.event.screenX, event.event.screenY);

      // Prevent default to prevent selecting text or click
      event.preventDefault();
    }
  };

  // Handle a (global) mousemove event
  function moveMouseMove(event)
  {
    // Check if we have data (we should have, but check just in case)
    if ($wh.moveeventdata)
    {
      // Fire the move event on the original target, use the current event target as relatedTarget
      var evt = fireMoveEvent("move", event.event);

      // Check if the event was not cancelled
      if (evt.defaultPrevented !== true && evt.returnValue !== false)
        return;
    }
    // The event was cancelled, stop the move action
    stopMove();
  };

  // Handle a (global) mouseup event
  function moveMouseUp(event)
  {
    // Check if we have data (we should have, but check just in case)
    if ($wh.moveeventdata)
    {
      // Fire the moveend event on the original target, use the current event target as relatedTarget
      var evt = fireMoveEvent("moveend", event.event);
    }
    // We're done, stop the move action
    stopMove();
  };

  // Make 'movable' a MooTools property (so it can be (un)set using element.set)
  Element.Properties.movable =
  {
    get: function()
    {
      return this.movable;
    },

    set: function(value)
    {
      this.movable = !!value;
      this.setAttribute("movable", this.movable);

      // If the element is movable, add the mousedown handler, otherwise remove it
      if (this.movable)
        this.addEvent("mousedown", moveMouseDown);
      else
        this.removeEvent("mousedown", moveMouseDown);
    }
  };

  // Add the mousedown handler to all elements having movable set to true
  document.addEvent("domready", function()
  {
    $$("[movable]").addEvent("mousedown", moveMouseDown);
  });


  // Extend the MooTools DOMEvent to fix some browser quirks for drag/drop events and to add support for our custom move events
  $wh.extendDOMEventConstructor(function(event, win)
  {
    if (this.type && (this.type == 'drop' || this.type == 'movestart' || this.type == 'move' || this.type == 'moveend' || this.type.indexOf('drag') == 0))
    {
      var doc = win.document;
      doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
      // Initialize this.page, this.client and this.rightClick (like the DOMEvent does for all mouse events)
      this.page = { x: (event.pageX != null) ? event.pageX : event.clientX + doc.scrollLeft
                  , y: (event.pageY != null) ? event.pageY : event.clientY + doc.scrollTop
                  };

      this.client = { x: (event.pageX != null) ? event.pageX - win.pageXOffset : event.clientX
                    , y: (event.pageY != null) ? event.pageY - win.pageYOffset : event.clientY
                    };
      this.rightClick = (event.which == 3 || event.button == 2);
      // Add this.moved object for our custom move events
      if (this.type == 'movestart' || this.type == 'move' || this.type == 'moveend')
      {
        this.moved = { x: event.movedX
                     , y: event.movedY
                     };
      }

      // Use the stored mouse position for the "drag" and "dragend"
      // events.
      if (fix_dragevent_mousepos && (this.type == "drag" || this.type == "dragend"))
      {
        this.client = $wh.dndlastmousepos.client;
        this.page = $wh.dndlastmousepos.page;
      }

      // Record the dragged node
      if (this.type == 'dragstart')
      {
        draggednode = event.currentTarget;
        var dt = getDataTransfer(event);
        if (dt)
          dt.allowedEffects = 'all';
      }
      else if (this.type == 'dragend')
        draggednode = null;

      // And now for some truly bizarre browser quirks:

      // In Safari on Mac, the y coordinate for the 'dragend' event is
      // relative to the body bottom.
      if (Browser.safari && Browser.Platform.mac && this.type == "dragend")
      {
        var bodyheight = $(document.body).getSize().y;
        this.page.y = bodyheight - this.page.y;
        this.client.y = bodyheight - this.client.y;
      }

      // In Safari 5 on Windows, the y coordinate for the 'dragend' event
      // is 10 pixels too low.
      if (Browser.safari && Browser.Platform.win && Browser.version >= "5" && this.type == "dragend")
      {
        this.page.y += 10;
        this.client.y += 10;
      }

      // In Chrome on Mac, the y coordinate for the 'dragend' event is
      // 26 pixels too high.
      if (Browser.chrome && Browser.Platform.mac && this.type == "dragend")
      {
        this.page.y -= 26;
        this.client.y -= 26;
      }

      //ADDME: The last 'drag' event fired (when releasing the mouse
      //       button) in Chrome on Mac or Windows has all mouse
      //       coordinates set to 0. Is there some way to detect and
      //       correct this? For the moment: no.

      /* FireFox adjusts the dropeffect based on the pressed keys. Chrome, Safari and IE don't, so just
         implement that behaviour for them. Also, override the mouse cursor in IE
      */
      if ((this.type == 'drop' || this.type.indexOf('drag') == 0) && (Browser.chrome || Browser.safari || Browser.name == 'ie'))
      {
        // Set default drop effect for allowed effects
        event.dataTransfer.dropEffect = getDefaultDropEffect(event, event.dataTransfer.effectAllowed);
      }
    }

    if (!this.moved) this.moved = {};
  });


var effectstrs = [ 'none', 'copy', 'move', 'copyMove', 'link', 'copyLink', 'linkMove', 'all' ];

function parseEffectList(data)
{
  data = Array.from(data || 'all');
  var mask = 0;
  for (var i = 0; i < data.length; ++i)
  {
    var pos = effectstrs.indexOf(data[i]);
    if (pos >= 0)
      mask = mask | pos;
  }
  return effectstrs[mask];
}

function getDefaultDropEffect(event, effectAllowed)
{
  // Get default drop effect for allowed effects
  var dropeffect = "none";
  try
  {
    // IE denies access to dataTransfer.effectAllowed when dragging files from desktop
    switch (effectAllowed)
    {
      case "copy":           dropeffect = "copy"; break;
      case "move":           dropeffect = "move"; break;
      case "link":           dropeffect = "link"; break;
      case "copyLink":       dropeffect = "copy"; break;
      case "copyMove":       dropeffect = "move"; break;
      case "linkMove":       dropeffect = "move"; break;
      case "all":            dropeffect = "move"; break;
      case "none":           dropeffect = "none"; break;
      case "uninitialized":  dropeffect = "move"; break;
    }
  }
  catch (e)
  {
    console.log('e: ' + e);
  }

  if (event.ctrlKey || event.metaKey)
    dropeffect = event.shiftKey ? "link" : "copy";
  else if (event.shiftKey)
    dropeffect = "move";

  return dropeffect;
}

var currentdrag;

$wh.DragStartData = new Class(
  { /// Allowed drop effect
    effectallowed: 'all'

    /// Data to present to external (webhare) targets
  , externaldata: null

    /// Data to present to local (webhare) targets
  , localdata: null

    /** File to present for external file downloads
        @cell mimetype
        @cell filename
        @cell url
    */
  , file: null

  , initialize: function(effectAllowed)
    {
      this.effectallowed = parseEffectList(effectAllowed);
    }

  , storeIntoEvent: function(event)
    {
      currentdrag = this;

      var dataTransfer = getDataTransfer(event);
      dataTransfer.effectAllowed = this.effectallowed;

      setWebHareData(event, this.externaldata ? JSON.encode(this.externaldata) : '');

      if (this.file)
      {
        try
        {
          var url = this.file.mimetype + ':' + this.file.filename + ':' + this.file.url;

          dataTransfer.setData('DownloadURL', url);
          dataTransfer.setData('URL', this.file.url);
        }
        catch(e)
        {
          //IE9 fails on dataTransfer.setData
        }
      }
    }
  });

$wh.CurrentDragData = new Class(
  { /// Current event
    event: null

    /// Local associated drag
  , localdrag: null

  , initialize: function(event, localdrag)
    {
      this.event = event;
      this.localdrag = localdrag;
    }

    /// Drag from external source?
  , hasExternalSource: function()
    {
      return !this.localdrag;
    }

  , haveDataAccess: function()
    {
      return this.localdrag || this.event.type == 'drop';
    }

  , isFileDrag: function()
    {
      return this.getTypes().contains("Files");
    }

    /// Data (local from local source, external for external sources)
  , getData: function()
    {
      return this.localdrag ? this.localdrag.localdata : getWebHareData(this.event);
    }

  , getFiles: function()
    {
      var datatransfer = getDataTransfer(this.event);
      return datatransfer ? datatransfer.files || [] : [];
    }

  , getItems: function()
    {
      var datatransfer = getDataTransfer(this.event);
      return datatransfer ? datatransfer.items || [] : [];
    }

  , getTypes: function()
    {
      var datatransfer = getDataTransfer(this.event);
      return datatransfer ? datatransfer.types || [] : [];
    }

  , getDropEffect: function()
    {
      var datatransfer = getDataTransfer(this.event);
      var mode = datatransfer ? datatransfer.dropEffect : "";

      return [ 'copy', 'move', 'link' ].contains(mode) ? mode : 'move';
    }

  , setDropEffect: function(mode)
    {
      var datatransfer = getDataTransfer(this.event);
      if (!datatransfer)
        return;
      if ([ 'copy', 'move', 'link', 'none' ].contains(mode))
        datatransfer.dropEffect = mode;
    }

  , setDefaultDropEffect: function()
    {
      var datatransfer = getDataTransfer(this.event);
      if (!datatransfer)
        return;
      // Set default drop effect for allowed effects
      datatransfer.dropEffect = getDefaultDropEffect(this.event, datatransfer.effectAllowed);
    }
  });

$wh.getDragData = function(event)
{
  return new $wh.CurrentDragData(event, currentdrag);
}

$wh.fixupMouseEvent = function(evt, evttarget)
{
  if(Browser.ie && Browser.version==9) //IE9 refuses to let us set pageX and pageY, they'll always remain 0 in the original object
  {
    var view = evttarget;
    if(view.ownerDocument)
      view = view.ownerDocument;
    if(view.defaultView)
      view = view.defaultView;

    //polyfill pageX and pageY
    var pagex = Math.floor(evt.clientX + view.pageXOffset);
    var pagey = Math.floor(evt.clientY + view.pageYOffset);

    Object.defineProperty(evt, 'pageX', { get : function() { return pagex } } );
    Object.defineProperty(evt, 'pageY', { get : function() { return pagey } } );
  }
}

/// Reset the current drag when a local drag has ended
document.addEvent('dragend', function() { currentdrag = null; });

})(document.id);
