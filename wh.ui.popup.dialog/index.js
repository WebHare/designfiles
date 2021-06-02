/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.ui.popup');
/*! LOAD: wh.ui.popup !*/

(function($) { //mootools wrapper

/* title: Dialog title (embedded as <h1> )
   text: Dialog text (embedded as <div class="dialogtext">, supports linefeeds)
   html: Dialog raw html code (embedded as <div class="dialogtext">)

   buttons: array of:
   [ title: Button text  (eg 'Login' or Locale.get('wh-common.buttons.yes'))
   , onClick: Handler to invoke on click (has an opportunity to event.stop()! )
   , cancel: If true, this is a cancel button. It will go through onCancel checks
   , result: Result to return in getResult(). This also closes the dialog.
   , href: Hyperlink to follow.
   ]

   If a button's title is missing, but cancel is set, Locale.get('wh-common.buttons.cancel') is used
   If cancel is unset, but result is set, Locale.get('wh-common.buttons.<reslt>') is used

   Events:
   onResult - invoked if a result is set on the clicked button, AFTER closing the dialog.
              receives { target:this, result:'resultname' }
   onResultxxx - like onResult, but fires if the result was 'Xxx' - eg onResultok fires if the button with {result:'ok'} was clicked
*/
$wh.Popup.Dialog = new Class(
{ Extends: $wh.BasicPopup
, options: { title: ''
           , text: null
           , html: null
           , buttons: []
           , destroy_on_hide: true
           }
, _result: null
, initialize: function(options)
  {
    this.parent(null, options);

    this.nodes.container.addClass("wh-popup-dialog");
    this.nodes.container.addEvent("click:relay(button)", this.onButtonClick.bind(this));
    this.nodes.body.adopt(new Element("h1", { text: this.options.title }));
//    this.nodes.add

    var contents = new Element("div", { "class":"dialogtext"}).inject(this.nodes.body);
    if(this.options.html)
      contents.set('html', this.options.html);
    else if(this.options.text)
      $wh.setTextWithLinefeeds(contents, this.options.text);

    if(this.options.buttons.length)
    {
      if (!(this.options.buttons instanceof Array))
      {
        console.error("Buttons must be an array with strings.");
        return;
      }

      var buttons = new Element("div", { "class":"dialogbuttons"}).inject(this.nodes.body);
      Array.each(this.options.buttons, function(button)
      {
        var title = button.title;
        if(!title && window.Locale && button.cancel)
          title = Locale.get('wh-common.buttons.cancel');
        if(!title && window.Locale && button.result)
          title = Locale.get('wh-common.buttons.' + button.result);

        var buttonsettings = { "text": title
                             , "type": "button"
                             };

        if (button.cssclass && button.cssclass != "")
          buttonsettings["class"] = button.cssclass;

        var newbutton = new Element("button", buttonsettings);

        if(button.onClick)
          newbutton.addEvent("click", button.onClick);

        newbutton.store('dialog-button', button);
        buttons.adopt(newbutton);
      });
    }
  }
, onButtonClick:function(event, button)
  {
    var buttoninfo = button.retrieve('dialog-button');
    if(buttoninfo.cancel)
    {
      this._result = 'cancel';
      this.cancel();
      return;
    }
    this._result = null;

    if(buttoninfo.href)
    {
      event.stop();
      location.href = buttoninfo.href;
    }

    if(buttoninfo.result)
    {
      this._result = buttoninfo.result;
      this.hide();
    }
  }
, getResult:function()
  {
    return this._result;
  }
, show:function()
  {
    this._result = null;
    this.parent();
  }
, hide:function()
  {
    this.parent();
    if(this._result)
    {
      var evtobj = { target:this, result: this._result };
      this.fireEvent("result", evtobj);
      this.fireEvent("result" + this._result, evtobj);
    }
  }
});

})(document.id); //end mootools wrapper
