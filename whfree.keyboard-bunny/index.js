/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
/*! LOAD: frameworks.mootools !*/

/* Translation guide from mootools keyboard.js to keyboard-bunny.js:

  new Keyboard( { events: {"up":.... }})
  =>
  new KeyboardBunny(node, {"up":....})

  In event handlers:

  Keyboard.stop => event.preventDefault();
  event.stop => event.preventDefault(); event.stopPropagation();

  or just add a {stopmapped:true} to the KeyboardBunny

  event.shift => event.shiftKey
  event.ctrl => event.controlKey
  event.meta => event.metaKey
  event.alt => event.altKey

  All keynames should be converted to mixed-cased, as done here: http://www.w3.org/TR/DOM-Level-3-Events-key/

  Modifiers should be in the ordering Shift+Control+Alt+Meta+key

  To simply prevent keys from propagating up (ie to keep Enter inside its textarea)
  new KeyboardBunny(this.textarea, {}, { dontpropagate: ['Enter']});
  */



+function(){
"use strict";

/** node: The node to attach to
    keymap: Keymap
    options.stopmapped - preventDefault and stopPropagation on any key we have in our map
    options.dontpropagate - string array of keys not to propagate out of this object
    options.onkeypress - when set, call for all keypresses. signature: function(event, key). Return true to stop
      propagation and default action.
*/
function KeyboardBunny(node, keymap, options)
{
  this.node = null;
  this.keymap = Object.clone(keymap || {}); //MOO
  this.stopmapped = options&&options.stopmapped;
  this.dontpropagate = options && options.dontpropagate ? Array.from(options.dontpropagate) : [];
  this.onkeypress = options&&options.onkeypress;

  if ($wh.debug.key)
  {
    Object.keys(this.keymap).forEach(function(key)
    {
      var modifiers = key.split("+");
      modifiers.pop();

      // Check for allowed modifiers
      modifiers.forEach(function(mod)
      {
        if (![ "Accel", "Alt", "Control", "Meta", "Shift"].contains(mod))
          throw new Error("Illegal modifier name '" + mod + "' in key '" + key + "'");
      });

      var original_order = modifiers.join('+');
      modifiers.sort();
      if (modifiers.join('+') != original_order)
        throw new Error("Illegal key name " + key + ", modifiers must be sorted alphabetically")
    });
  }

  var self=this;
  node.addEventListener('keydown', function(event) { return self._onKeyDown(this,event) });
  node.addEventListener('keypress', function(event) { return self._onKeyPress(this,event) });
  node.addEventListener('keyup', function(event) { return self._onKeyUp(this,event) });
}

// We standardize on the key values here: http://www.w3.org/TR/DOM-Level-3-Events-key/
var remap = { "U+0008": "Backspace"
            , "U+0009": "Tab"
            , "U+001B": "Escape"
            , "U+007F": "Delete"
            , "Up": "ArrowUp"
            , "Down": "ArrowDown"
            , "Left": "ArrowLeft"
            , "Right": "ArrowRight"
            };
var remapkeycode = { 48:'0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9'
                   , 65:'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J'
                   , 75:'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T'
                   , 85:'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z'};
var propnames = { "shiftKey":   "Shift"
                , "ctrlKey":    Browser.platform == "mac" ? "Control" : [ "Accel", "Control" ]
                , "metaKey":    Browser.platform == "mac" ? [ "Accel", "Meta" ] : "Meta"
                , "altKey":     "Alt"
                };

var selenium_backup =
    { 8: "Backspace", 9: "Tab"
    , 13: "Enter", 27: "Escape"
    , 33: "PageUp", 34: "PageDown"
    , 35: "End", 36: "Home"
    , 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown"
    , 45: "Insert", 46: "Delete"
    , 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10"
    };

function getKeyNames(event, node)
{
  var result =
      { basekey:    ""
      , names:      []
      };

  if($wh.debug.key)
    console.log(node, event.target, event.altKey, event.shiftKey, event.ctrlKey, event.metaKey, event.keyIdentifier, event.key, event.keyCode, event);

  var basekey;
  if(event.keyCode)
    basekey = remapkeycode[event.keyCode];

  if(!basekey)
  {
    basekey = event.keyIdentifier || event.key;
    if(remap[basekey])
      basekey=remap[basekey];
  }
  // Firefix under selenium on linux always says 'Unidentified' as key. Backup for some keys.
  if (basekey == "Unidentified")
    basekey = selenium_backup[event.keyCode];

  result.basekey = basekey || "";

  if(!basekey)
    return result;

  result.names = [ [] ];

  // Create the modifiers in the names array (omit the basekey, so we can sort on modifier first)
  Object.keys(propnames).forEach(function(key)
  {
    if (event[key])
    {
      // The key is pressed. Add the modifier name to all current names.
      var modifier = propnames[key];
      if (typeOf(modifier) != "array")
        result.names.forEach(function(arr) { arr.append([modifier]); });
      else
      {
        // Multiple modifiers map to this key, duplicate all result sequences for every modifier
        var newkeys = [];
        modifier.forEach(function(singlemodifier)
        {
          result.names.forEach(function(arr)
          {
            newkeys.push(arr.concat([ singlemodifier ]));
          })
        });
        result.names = newkeys;
      }
    }
  });

  result.names = result.names.map(function(arr)
  {
    // Sort the modifier names
    arr = arr.sort();
    arr.push(basekey);
    return arr.join("+");
  });

  return result;
}
/** Is the native 'copy' modified for this platform pressed? */
KeyboardBunny.hasNativeEventCopyKey = function(event)
{
  return event && (Browser.platform == "mac" ? event.metaKey : event.ctrlKey);
};

/** Returns thether the current pressed special key should be ignored for the current target node
    Used to detect input/textarea/rte's
    @param target Current target node for keyboard event
    @param key Parsed key (as returned by GetKeyNames)
    @return Whether the key must be ignored by KeyboardBunny, default browser behaviour should be triggered.
*/
KeyboardBunny.prototype._mustIgnoreKey=function(target, key)
{
  var tag = target.nodeName.toLowerCase();
  if (tag == "select")
  {
    if (["ArrowUp", "ArrowDown",  "Home", "End", "PageUp", "PageDown"].indexOf(key.basekey) != -1)
      return true;
  }
  else if (tag == "input" || tag == "textarea" || target.isContentEditable)
  {
    // These keys we ignore, regardless of the modifier
    if ([ "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"
        , "PageUp", "PageDown"
        , "Home", "End"
        , "Insert", "Delete", "Backspace"
        ].indexOf(key.basekey) != -1)
      return true;

    var is_special_combo = false;

    // only input doesn't want exact combo 'Enter', the rest does
    if (tag != "input" && key.names.indexOf("Enter") != -1)
      is_special_combo = true;

    // Only contenteditable wants "Shift+Enter"
    if (target.isContentEditable && key.names.indexOf("Shift+Enter") != -1)
      is_special_combo = true;

    // These exact combo's are wanted by all inputs
    [ "Accel-A", "Accel-V", "Accel-C", "Accel-X" ].forEach(function(name)
    {
      is_special_combo = is_special_combo || key.names.indexOf(name) != -1;
    });
    return is_special_combo;
  }
  return false;
}

KeyboardBunny.prototype.addKey=function(keybinding, handler)
{
  this.keymap[keybinding] = handler;
}
KeyboardBunny.prototype.removeKey=function(keybinding)
{
  delete this.keymap[keybinding];
}
KeyboardBunny.prototype._onKeyDown=function(node,event)
{
  // Get all possible names for this key
  var key = getKeyNames(event, node);
  if (!key.basekey || !key.names.length)
    return true;

  if (this._mustIgnoreKey(event.target, key))
    return true;

  if (this.dontpropagate)
  {
    key.names.forEach(function(keyname)
    {
      if (this.dontpropagate.contains(keyname))
        event.stopPropagation();
    }.bind(this));
  }

  for (var i = 0; i < key.names.length; ++i)
  {
    var keyname = key.names[i];

    if (this.keymap[keyname])
    {
      if (this.stopmapped)
      {
        event.stopPropagation();
        event.preventDefault();
      }
      return this.keymap[keyname].apply(node,[event]);
    }
  }

  return true;
}
KeyboardBunny.prototype._onKeyPress=function(node,event)
{
  if (this.onkeypress)
  {
    var key = "";
    // in Chrome on Fedora 21, shift-7 returns "Up" as keyIdentifier. Use the charCode instead.
    if (event.charCode)
    {
      // fromCodePoint is ECMA2015, not supported yet by IE & Safari
      key = String.fromCodePoint
          ? String.fromCodePoint(event.charCode)
          : String.fromCharCode(event.charCode);
    }
    key = key || event.keyIdentifier || event.key;

    if (!this.onkeypress.apply(node,[ event, key ]))
    {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }

  return true;
}

KeyboardBunny.prototype._onKeyUp=function(node,event)
{
  return true;
}

window.KeyboardBunny = KeyboardBunny;

}();
