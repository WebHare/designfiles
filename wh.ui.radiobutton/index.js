/* generated from Designfiles Public by generate_data_designfles */
require ('./radiobutton.css');
require ('../wh.ui.base');
/*! LOAD: wh.ui.base
!*/

/****************************************************************************************************************************
 * Radiobutton
 */

(function($) { //mootools wrapper

$wh.Radiobutton = new Class(
{ Implements: [ Options, Events ]
, Binds: [ "onMouseDown", "onMouseUp", "onKeyDown", "onInputChanged", "onClick" ]

/* Initialization */

, options: { cssclass: ""    // Classname to apply
           , checked: false  // If the radiobutton is initially selected (if no radiobutton el is provided)
           , enabled: true   // If the radiobutton is initially enabled (if no radiobutton el is provided)
           , value: ""       // Radiobutton value (if no radiobutton el is provided)
           , required: false
           , radiogroup: ""  // The name of the radiogroup this button belongs to (if no radiobutton el is provided)
           // onChange      // Called when the value was changed
           }

, el: null
, active: false
, tabindex: 0
, isinputradio: false

, initialize: function(options, el)
  {
    this.setOptions(options);
    this.el = $(el);

    if (this.el)
    {
      this.options.checked = !!this.el.checked;
      this.options.enabled = !this.el.disabled;
      this.options.value = this.el.value;
      this.options.required = this.el.required;

      if (this.el.type == "radio")
      {
        this.isinputradio = true;
        this.el.addEvent("wh-refresh", this.updateStateFromEl.bind(this));
        //this.options.radiogroup = this.el.name || "";
      }
      $wh.setupLabelDefaultHandler(); //make sure <label> focus() keeps working
    }
    if (this.options.radiogroup)
      $wh.Radiobutton.registerRadiobuttonToGroup(this, this.options.radiogroup);

    this.buildNode();
    this.updateState();
  }

/* Public API */
, toggle: function()
  {
    if (this.getEnabled())
      this.setChecked(true, true);
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
    if (this.options.radiogroup && checked)
      $wh.Radiobutton.setRadiobuttonValueGroup(this, this.options.radiogroup);
  }

  /* Get the checked value */
, getChecked: function()
  {
    return this.options.checked;
  }

  /* Set the checked value
     If this radiobutton belongs to a radiogroup, any other radiobutton within that group will be unchecked. */
, setChecked: function(checked, withevent)
  {
    if (checked != this.options.checked)
    {
      if (this.options.radiogroup && checked)
        $wh.Radiobutton.setRadiobuttonInGroup(this, this.options.radiogroup, withevent);
      else
        this.setCheckedInternal(checked, withevent, true);
    }
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
      this.node.addClass("-wh-radiobutton");
    this.node.addClass("wh-radiobutton");

    this.node.grab(new Element("span", { "class": $wh.legacyclasses ? "value" : "-wh-radiobutton-value wh-radiobutton-value value" }));
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
      if (this.isinputradio)
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

, updateStateFromEl:function()
  {
    this.options.checked = this.el.checked;
    this.options.enabled = !this.el.disabled;
    this.options.required = this.el.required;
    this.updateState();
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
    this.node.toggleClass("checked", this.getChecked());
    this.node.toggleClass("disabled", !this.getEnabled());
    this.node.toggleClass("required", this.getRequired());

    if (this.getChecked())
    {
      if (this.options.radiogroup)
        $wh.Radiobutton.setRadiobuttonValueInGroup(this, this.options.radiogroup);

      if (this.el)
      {
        if (this.isinputradio)
          this.el.checked = true;
        else
          this.el.value = this.options.value;
      }
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
      this.el.click();
    else
      this.toggle();
  }

/* Internal functions */

, setCheckedInternal: function(checked, withevent, recurse)
  {
    checked = !!checked;

    //contact other radiobuttons which may be incorrectly checked through the form
    if(checked && recurse && this.isinputradio)
    {
      // If the input is not located within a <form>, check all inputs without a form
      // See: http://www.w3.org/TR/html5/forms.html#radio-button-state-(type=radio)
      var elarray = this.el.form ? this.el.form[this.el.name] : document.getElements("input[name='" + this.el.name + "']");
      if(elarray)
      {
        Array.each(elarray, function(element)
          {
            if($wh.legacyclasses)
            {
              if(element.form == this.el.form && element != this.el)
              {
                var radiobutton = element.retrieve("wh-radiobutton");
                if(radiobutton && radiobutton.options.checked )
                  radiobutton.setCheckedInternal(false, false, false);
              }
            }
            else
              element.fireEvent("wh-refresh");
          }.bind(this));
      }
    }

    if (checked != this.options.checked)
    {
      this.setOptions({ checked: checked });
      this.updateState();
      if (withevent && checked)
      {
        this.fireEvent("change", this);
        if(this.isinputradio) //ADDME: Is this necessary if updateState changes the input's checked status?
          $wh.fireHTMLEvent(this.el, "change");
      }
      return true;
    }
    return false;
  }
});

// Store which holds the radiogroups
$wh.Radiobutton.radiogroups = {};

/* Register a radiobutton object with the given group */
$wh.Radiobutton.registerRadiobuttonToGroup = function(radiobutton, radiogroup)
{
  if (!$wh.Radiobutton.radiogroups[radiogroup])
    $wh.Radiobutton.radiogroups[radiogroup] = { radiobuttons: []
                                              , onChange: null
                                              , input: null
                                              };

  $wh.Radiobutton.radiogroups[radiogroup].radiobuttons.include(radiobutton);
}

/* Get the registered radiobutton objects for a group */
$wh.Radiobutton.getRegisteredRadiobuttonsInGroup = function(radiogroup)
{
  if ($wh.Radiobutton.radiogroups[radiogroup])
    return $wh.Radiobutton.radiogroups[radiogroup].radiobuttons;
}

/* Define an onChange handler for the given group, which is called once if a radiobutton within the group is checked, with the
   checked radiobutton as argument */
$wh.Radiobutton.setRadiogroupOnChangeHandler = function(radiogroup, handler)
{
  if (!$wh.Radiobutton.radiogroups[radiogroup])
    $wh.Radiobutton.radiogroups[radiogroup] = { radiobuttons: []
                                              , onChange: handler
                                              , input: null
                                              };
  else
    $wh.Radiobutton.radiogroups[radiogroup].onChange = handler;
}

/* Set the (hidden) input which value should mirror the radiogroup's value (id or node) */
$wh.Radiobutton.setRadiogroupInput = function(radiogroup, input)
{
  if (!$wh.Radiobutton.radiogroups[radiogroup])
    $wh.Radiobutton.radiogroups[radiogroup] = { radiobuttons: []
                                              , onChange: null
                                              , input: input
                                              };
  else
    $wh.Radiobutton.radiogroups[radiogroup].input = input;
}
$wh.Radiobutton.getRadiogroupInput = function(radiogroup)
{
  if ($wh.Radiobutton.radiogroups[radiogroup])
    return $wh.Radiobutton.radiogroups[radiogroup].input;
}

/* Check a radiobutton within the given group */
$wh.Radiobutton.setRadiobuttonInGroup = function(radiobutton, radiogroup, withevent)
{
  if (!$wh.Radiobutton.radiogroups[radiogroup] || !$wh.Radiobutton.radiogroups[radiogroup].radiobuttons.contains(radiobutton))
    return;

  $wh.Radiobutton.radiogroups[radiogroup].radiobuttons.each(function(groupbutton)
  {
    if (groupbutton != radiobutton)
      groupbutton.setCheckedInternal(false, withevent);
  });
  if (radiobutton.setCheckedInternal(true, withevent))
  {
    if (withevent && $wh.Radiobutton.radiogroups[radiogroup].onChange)
      $wh.Radiobutton.radiogroups[radiogroup].onChange(radiobutton);
  }
}

$wh.Radiobutton.setRadiobuttonValueInGroup = function(radiobutton, radiogroup)
{
  if (!$wh.Radiobutton.radiogroups[radiogroup] || !$wh.Radiobutton.radiogroups[radiogroup].radiobuttons.contains(radiobutton))
    return;

  var input = $($wh.Radiobutton.radiogroups[radiogroup].input);
  if (input)
    input.value = radiobutton.options.value;
}

function replaceRadioComponent(input, options)
{
  if(input.type!="radio")
    return;

  var comp = new $wh.Radiobutton(options, input);

  // Replace the current input with the new radiobutton's node
  input.setStyle("display", "none")
       .store("wh-ui-replacedby", $(comp))
       .parentNode.insertBefore($(comp), input);
  if($wh.legacyclasses)
  {
    input.store("-wh-radiobutton", comp)
    input.store("wh-radiobutton", comp)
  }

  $(comp).store('wh-ui-replaces', input);

  if(input.hasAttribute("autofocus")) //FIXME only for first autofocusable attribute!  should probably move this to ui.base
    (function() { $(comp).focus(); }).delay(1);

  // Apply original event handlers to new component
  //$wh.cloneEventHandlers(input, comp);
}

$wh.Radiobutton.replaceComponents = function(selector, options)
{
  $wh.setupReplaceableComponents(selector, replaceRadioComponent, options);
}

})(document.id); //end mootools wrapper
