/* generated from Designfiles Public by generate_data_designfles */
require ('./checkbox.css');
require ('../wh.ui.base');
/*! LOAD: wh.ui.base
!*/

/****************************************************************************************************************************
 * Checkbox
 */

(function($) { //mootools wrapper

$wh.Checkbox = new Class(
{ Implements: [ Options, Events ]
, Binds: [ "onMouseDown", "onMouseUp", "onKeyDown", "onInputChanged", "onClick" ]

/* Initialization */

, options: { cssclass: ""    // Classname to apply
           , checked: false  // If the checkbox is initially selected (if no checkbox el is provided)
           , enabled: true   // If the checkbox is initially enabled (if no checkbox el is provided)
           , required: false
           , value: ""       // Checkbox value (if no checkbox el is provided)
           // onChange      // Called when the value was changed
           }

, el: null
, active: false
, tabindex: 0
, isinputcheckbox: false

, initialize: function(options, el) //FIXME reverse to more common ordering (But allow old-style calls)
  {
    this.setOptions(options);
    this.el = $(el);

    if (this.el)
    {
      this.options.checked = !!this.el.checked;
      this.options.enabled = !this.el.disabled;
      this.options.value = this.el.value;
      this.options.required = this.el.required;

      if (this.el.type == "checkbox")
      {
        this.isinputcheckbox = true;
      }
      $wh.setupLabelDefaultHandler(); //make sure <label> focus() keeps working

      this.el.addEvent("wh-refresh", this.refresh.bind(this));
    }

    this.buildNode();
    this.updateState();
  }

, refresh: function()
  {
    this.options.checked = !!this.el.checked;
    this.options.enabled = !this.el.disabled;
    this.options.value   = this.el.value;
    this.options.required= this.el.required;

    this.updateState();
  }

/* Public API */
, toggle: function()
  {
    if (this.getEnabled())
      this.setChecked(!this.getChecked(), true);
  }

  /* Get the value */
, getValue: function()
  {
    return this.options.value;
  }

  /* Set the value */
, setValue: function(value, withevent)
  {
    this.setOptions({ value: value });
  }

  /* Get the checked value */
, getChecked: function()
  {
    return this.options.checked;
  }

  /* Set the checked value */
, setChecked: function(checked, withevent)
  {
    if (checked != this.options.checked)
      this.setCheckedInternal(checked, withevent, true);
  }

  /* Get the enabled state of the checkbox */
, getEnabled: function()
  {
    return this.options.enabled;
  }

  /* Get the required state of the checkbox */
, getRequired: function()
  {
    return this.options.required;
  }

  /* Set the enabled state of the checkbox */
, setEnabled: function(enabled)
  {
    if (enabled != this.options.enabled)
    {
      this.setOptions({ enabled: enabled });
      this.updateState();
      this.node.setAttribute("tabindex", this.options.enabled ? this.tabindex : -1); // Enable focus for key navigation
    }
  }

/* DOM */

, buildNode: function()
  {
    this.node = new Element("div", { "class": this.options.cssclass + (this.el && this.el.className ? " " + this.el.className : "")
                                   , events: { keydown: this.onKeyDown
                                             , click: this.onClick
                                             }
                                   });
    if($wh.legacyclasses)
      this.node.addClass("-wh-checkbox");
    this.node.addClass("wh-checkbox");

    this.node.grab(new Element("span", { "class": $wh.legacyclasses ? "-wh-checkbox-value wh-checkbox-value value" : "value"}));
/*
    if ("createTouch" in document)
    {
      this.node.addEvents({ touchstart: this.onMouseDown });
      $(document).addEvents({ touchend: this.onMouseUp });
    }
    else
    {
      this.node.addEvents({ mousedown: this.onMouseDown });
      $(document).addEvents({ mouseup: this.onMouseUp });
    }
*/
    if(this.el)
    {
      if (this.isinputcheckbox)
      {
        this.tabindex = this.el.get("tabindex") || 0;
        this.el.addEvent("change", this.onInputChanged);
      }
      $wh.setupFormResetListener(this.el, this.onInputChanged);
    }
    this.node.setAttribute("tabindex", this.options.enabled ? this.tabindex : -1); // Enable focus for key navigation
  }

, toElement: function()
  {
    return this.node;
  }

, updateState: function()
  {
    if($wh.legacyclasses)
    {
      this.node.toggleClass("-wh-checked", this.getChecked());
      this.node.toggleClass("-wh-disabled", !this.getEnabled());
      this.node.toggleClass("wh-checked", this.getChecked());
      this.node.toggleClass("wh-disabled", !this.getEnabled());
    }
    this.node.toggleClass("disabled", !this.getEnabled());
    this.node.toggleClass("checked", this.getChecked());
    this.node.toggleClass("required", this.getRequired());

    if (this.el)
    {
      if (this.isinputcheckbox)
        this.el.checked = this.getChecked();
      else
        this.el.value =  this.getChecked() ? this.options.value : "";
    }
  }

/* Event handlers */

, onMouseDown: function(event)
  {
    if (this.getEnabled())
    {
      this.active = true;
      try
      {
        this.node.focus();
      }
      catch (e) {}
    }
    return event.stop();
  }

, onMouseUp: function(event)
  {
    if (this.active)
    {
      this.active = false;
      if (this.getEnabled())
      {
        var node = event.target;
        while (node && node != this.node)
          node = node.parentNode;
        if (node)
          this.toggle();
        return event.stop();
      }
    }
  }

, onKeyDown: function(event)
  {
    if (this.getEnabled())
    {
      if (event.key == "space" || event.key == "enter")
        return this.onClick(event);
    }
  }

, onInputChanged: function(event)
  {
    this.setChecked(this.el.checked);
  }
, onClick:function(evt)
  {
    evt.stop();

    if(this.el)
      $wh.fireHTMLEvent(this.el,'click'); //iscroll-compatible .click
    else
      this.toggle();
  }

/* Internal functions */

, setCheckedInternal: function(checked, withevent, recurse)
  {
    checked = !!checked;

    if (checked != this.options.checked)
    {
      this.setOptions({ checked: checked });
      this.updateState();
      if (withevent)
      {
        this.fireEvent("change", this);
        if(this.isinputcheckbox) //ADDME: Is this necessary if updateState changes the input's checked status?
          $wh.fireHTMLEvent(this.el, "change");
      }
      return true;
    }
    return false;
  }
});

function replaceCheckboxComponent(input, options)
{
  if(input.type!="checkbox")
    return;

  var comp = new $wh.Checkbox(options, input);

  // Replace the current input with the new checkbox's node
  input.setStyle("display", "none")
       .store("wh-ui-replacedby", $(comp))
       .parentNode.insertBefore($(comp), input);

  if($wh.legacyclasses)
  {
    input.store("-wh-checkbox", comp);
    input.store("wh-checkbox", comp);
  }

  $(comp).store("wh-ui-replaces", input);
}

$wh.Checkbox.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceCheckboxComponent, options);
}


})(document.id); //end mootools wrapper
