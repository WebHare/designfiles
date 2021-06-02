/* generated from Designfiles Public by generate_data_designfles */
require ('./whpopup.css');
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! REQUIRE: frameworks.mootools, wh.compat.base
!*/

/***********************************************************

Dialogs
Copyright B-Lex Information Technologies 2010-2013


Features
  - uses CSS to center the dialog, so placement smoothly adjusts when resizing the browser window
  - can show a page without an <iframe> and autoresize the popup to the iframe's contents
  - optionally stylable with an template
  - 'escape' can be used to close the dialog (unless close_using_esc: false is passed as option)
  - prevent scrolling of the top document while a dialog is active
    this prevents:
      - scrolling on the greyout or content of the top document
        (FF, SF, IE, CHR)
      - scrolling the top document when the content (iframe/div) under the mouse has reached the edge
        (FF, SF, CHR, but not yet IE due to issue with getting the event object for the iframe)

Not supported:
  - autoresizing an iframe in crossdomain situation
  - auto setting title to pagetitle of the iframe in crossdomain situation


Styleable classes:

  .-wh-popup
  .-wh-popup-closebutton
  .-wh-popup-modalitylayer
  .-wh-popup-header
  .-wh-popup-title


FIXME: autoresizing is broken at the moment
FIXME: settings for popup are only applied the first time the element is used as popup, the second time the old instance is reused
FIXME: check/fix scroll of iframe on iPad
ADDME: feature / mechanism for sites in domain situation to have autoresize and title updates working
ADDME: feature / option to have an iframe-dialog (showURLinDialog) grow up to a maximum size or even almost fullscreen
ADDME: feature / ability size the iframe using width/height instead of iframewidth/iframeheight
ADDME: architecture / seperate iframe logic into a class that extends the popup?
FIXME: split modalitylayer logic into another class/file (partly done)


How to use:

  Opening a dialog:
    - dialogobject = $wh.Popup.showElementAsDialog("elementid", settings)
    - dialogobject = $wh.Popup.showURLInDialog("url", settings)

    - safe to use variables
        dialogobject.viewport -> topnode of the dialog
        dialogobject.body     -> refers to the element which was specified to use as dialog content


  Templating & Styling
    - when using a template, the element with the templatebodyid will be replaced with the element
      specified in showElementAsDialog.

    - if contentverticalalign is set to true the body (element you specified)
      will be wrapped in other elements to do the vertical alignment

    - if no wrappers were created (to for example vertical align)
      an contentminheight will be done by setting min-height on the body element

    - if the popup can be closed an element with css class .-wh-closebutton will be added

    - rounded corners can be created using CSS or adding elements for emulating them using setDialogTemplate()

    - if you really need your own custom closebutton you can make it call $wh.Popup.closeCurrentDialog()

  Events
    - show
    - beforehide
    - hide


Browser support

  - iOS5 (older iOS doesn't support position: fixed;)
  - Internet Explorer 6+
  - FF/SF/CHR



Issues:

  - (new in this version) new code seems to cause an empty space width the width of a scrollbar next to the vertical scrollbar in IE7 (not in IE8+)

  - side effect of setting min-height to the body element is that
    the resulting min-height will be the specified height + padding of the body

  - old iOS versions (up to 4 ??) treats fixed positioning somewhat like absolute positioning, so our positioning fails there

  - only proper support at the moment for one open dialog at a time

  - Internet Explorer issues:
      - <table style="width: 100%;">

  - Internet Explorer with showURLInDialog:
      - the following can case the dialog to use the full width
          - <table style="width: 100%;">
          - "margin: 0 auto;" on a element within the iframe (in IE < 8 only?)

  - need to properly document all settings


Note:
- IE7 <html> overflow -> scrollbar is placed somewhere next to the <body>, not at the side of <html> or it's parent <iframe>
- FF  shows the scrollbar on the <html> and scrolls the <body>
- Webkit shows the scrollbar on the <html> and scrolls the <html>

***********************************************************/

(function($) { //mootools wrapper

if($wh.Popup)
  console.error("Trying to mix old and new popup code! - do not laod both wh.ui.popup an wh.components.whpopup");

function getElementByIdInFragment(node, id)
{
  if (node.querySelector) // IE8+, FF3.5+, SF, CHR, OP10+
    return node.querySelector('#' + id);
  else
  {
    console.log("fallback");
    for (var i= 0; i<node.childNodes.length; i++)
    {
      var child = node.childNodes[i];

      if (child.nodeType!==1) // ELEMENT_NODE
          continue;

      if (child.id===id)
          return child;

      child = getElementByIdInFragment(child, id);
      if (child!==null)
          return child;
    }
    return null;
  }
}

/////////////////////////////////////////////////////////////////
//
//  Helper functions
//

function toddGetIFrameDocument(iframe)
{
  // if we try to read contentWindow before the iframe has been inserted into a document,
  // IE will throw an 'Unspecified error'
  if (typeof iframe.contentWindow == 'unknown')
    return null;

  // contentDocument is supported by NS6, Firefox, Opera, IE8
  if (iframe.contentDocument)
    return iframe.contentDocument;

  // FF3/SF3.2.1/OP9.64/CHR1 will properly return null (typeof=='object') if not initialized
  if (iframe.contentWindow == null)
    return null;

  //if (iframe.document) // For IE5
  //  return iframe.document;

  // if we have a contentwindow we can safely ask for it's document
  // (IE5.5 and IE6)
  return iframe.contentWindow.document;
}

// for internal use
function getDialogByFrameRef(frame)
{
  for(var tel=0; tel<$wh.Popup.dialogs.length; tel++)
  {
    if ($wh.Popup.dialogs[tel].frame == frame)
      return $wh.Popup.dialogs[tel];
  }
  return null;
}

function getDialogByPropertyValue(propertyname, value)
{
  for(var tel=0; tel<$wh.Popup.dialogs.length; tel++)
  {
    if ($wh.Popup.dialogs[tel][propertyname] == value)
      return $wh.Popup.dialogs[tel];
  }
  return null;
}

function getDialogInstanceContainingNode(node)
{
  var popupnode = node.getParent(".-wh-popup");
  if (!popupnode)
    return null;

  return getDialogByPropertyValue("dialogviewport", popupnode);
}




function wsdialogs_init()
{
  var docbody = $(document.documentElement);
  docbody.addEvent("click", wsdialogs_checkclick);

  // note: scrolling cannot be prevented in the scroll event, so we have to catch the event causing the scroll
  document.onmousewheel = function(){ disableWheelIfDialogActive(); } // IE7, IE8
  if(document.addEventListener) // Chrome, Safari, Firefox
      document.addEventListener('DOMMouseScroll', disableWheelIfDialogActive, false);
}

function wsdialogs_checkclick(event)
{
  if (!$wh.Popup.modalitylayer.visible)
    return;

  var target = event.target ? event.target : event.srcElement;

  // don't react to the dialog itself, only the viewport
  var dialoginstance = getDialogInstanceContainingNode(target);
  if (dialoginstance)
    return;

  if ($wh.Popup.modaldialog && $wh.Popup.modaldialog.options.canclose)
  {
    $wh.Popup.closeCurrentDialog();
  }
}


function disableWheelOutsideForFrame(framedoc)
{
  // Bug 188698 - using mouse wheel to scroll, at top and bottom of iframe, main window scrolls
  // https://bugzilla.mozilla.org/show_bug.cgi?id=188698
  // The developers see this as a feature, however it's not so easy to disable or work around,
  // so we need to prevent the effect from happening ourselves.
  try
  {
    framedoc.onmousewheel = function(){ disableWheelOutside(); } // IE7, IE8
    if(framedoc.addEventListener) // Chrome, Safari, Firefox
        framedoc.addEventListener('DOMMouseScroll', disableWheelOutside, false);
  }
  catch(err)
  {
    // Firefox (and other browsers??) won't allow access in case of crossdomain access
  }
}

function disableWheelOutside(event) // FF & SF define a variable event in the function
{
  // Our window is
  //   - this
  //   - window.modaldialog.frame.contentWindow

  if (!event) // IE7, IE8
  {
    if (this.event)
      event = this.event; // FIXME: why can't we get .event from either the top or iframe window?
    else
      return;
  }

  var wheelDelta = event.wheelDelta; // IE & SF ?
  if (typeof wheelDelta == "undefined")
    wheelDelta = -event.detail; // Firefox & Opera ?

  var blockevent = false;

  var framedoc = event.currentTarget;

  if (wheelDelta > 0 /*UP*/ && framedoc.documentElement.scrollTop == 0)
    blockevent = true;
  else if (wheelDelta < 0 /*DOWN*/)
  {
    var fromedge = framedoc.documentElement.scrollHeight - framedoc.documentElement.clientHeight - framedoc.documentElement.scrollTop;
    if (fromedge < 1)
      blockevent = true;
  }

  if (blockevent)
  {
    //console.log("Blocking mousewheel event");

    if (event.preventDefault) // Chrome, Safari, Firefox
      event.preventDefault();

    event.returnValue = false; // IE7, IE8
  }
}

function disableWheelIfDialogActive(event)
{
  if (!$wh.Popup.modaldialog)
    return;

  if (!event) // IE7, IE8, Chrome, Safari
    event = window.event;

  if (event.preventDefault) // Chrome, Safari, Firefox
    event.preventDefault();

  event.returnValue = false; // IE7, IE8
}




/**
  settings.canclose true/false if true, clicking outside the dialog will close the dialog
  settings.visible  whether the dialog must be visible initially
*/

$wh.Popup = new Class(
{ Implements: [ Options, Events ]
, options:
      { pagewidth:       null // set to null if content on the page is centered, otherwise(content is at the left side of the page) specify the width of the content

      , template:        ""   // HTML code to use as template within the dialog
      , templatebodyid:  ""   // id of the element in the template to replace with the dialog content element

      , contentminheight:     0//200
      , contentverticalalign: false//true

      , cssclass:             ""
      , fullscreen:           false // if set the popup will use the full viewport (width, height, iframewidth, iframeheight will be ignored)
      , width:                null
      , height:               null

      // settings below are for showURLinDialog
      , keepfromedge:         { left: 35, right: 35, top: 35, bottom: 35 } // FIXME: support for normal popups too
      , iframewidth:          null
      , iframeheight:         null

      , visible:              true
      , canclose:             true
      , close_using_esc:      true // whether the Escape key can be used to close the popup

      , popup_container:      null //$(document.documentElement) // not according to HTML5 spec, but saves us from requiring a container element for page blur effects

      , usegreyout:           true

      // prevent certain events (like keyup/keydown) to leak outside our popup.
      // the downside is many scripts might assume it's best to just add their events to the body
      // so they might not work when this is set to true.
      , keepeventwithinpopup: false

      , addclosebutton :   true //add close button automaticaly
      }

, forceshowtimeout: null // for show url
, focusnode: null // to capture events before the get outside the popup in case no other element in the popup has focus

, viewport: null
, body:     null // treat as PUBLIC

, initialize: function (element, options)
  {
    if (!this.options.popup_container)
      this.options.popup_container = $(document.body);

    if (!this.options.blur_effect_node)
      this.options.blur_effect_node = $(document.body);

    this.setOptions($wh.Popup.globalsettings);
    this.setOptions(options);

    /*

    DOM of the popup:

    this.dialogtemplate (.-wh-popup)
      template (optional)
        valign (optiona)
          dialogelement (required)



    this.viewport -> positioning containers for the dialogviewport
    this.lineheightstretcher -> dummy element needed for vertical alignment within the browser window
    this.dialogviewport -> container of the visible dialog part (.-wh-popup)
    this.dialogtemplate -> all HTML needed to make the dialog itself (including corners)
                   if template -> a <span> with the template in it

    this.dialogelement -> the element originally given to show in the popup
    this.body   -> the element specified to be the content of the dialog

    at the moment this.dialogelement == this.body

    */

    if (typeof element == "string")
      element = document.body.getElementById(element);

    if (!element)
    {
      console.error("Cannot open dialog, specified element does not exist. ("+element+")");
      return;
    }


    this.dialogelement = $(element);
    this.body = element;

    var contentarea = element; // element OR the valign container


    this.viewport = new Element("span");
    this.viewport.className = "-wh-popup-poscontainer";
    this.viewport.style.cssText = "position:fixed;z-index:50000;top:0;bottom:0;left:0;right:0;text-align:center;height:100%;";//white-space:nowrap;";

    // when using the popup don't let key events leak outside the popup
    // FIXME: or only do this when we are a 'modal' dialog with 'usegreyout' ??
    if (this.options.keepeventwithinpopup)
    {
      this.viewport.addEvent("keydown", function(event) { event.stop(); });
      this.viewport.addEvent("keyup", function(event) { event.stop(); $wh.Popup.cancelonesc(event); });
      //this.viewport.addEvent("keypress", function(event) { console.log("stop keypress"); event.stop(); });
    }

    // By having a node which recieves focus, we can get the event before it get's outside the
    // popup. It's not a problem if another node inside the popup get's focus after that,
    // just as long as the dom outside the popup doesn't get focus.
    // (by preventing key event getting outside the popup we can prevent tab setting focus
    // outside the popup(??) and scrolling the page with the arrow keys)
    // using an <input> as focusnode would result in a virtual keyboard being triggered on a tablet (iPad)
    this.focusnode = new Element("button", { styles: { position: "absolute", clip: "rect(0,0,0,0)" } });
    this.viewport.adopt(this.focusnode);

    if (!this.options.visible)
      this.viewport.style.visibility = "hidden";

    if (!this.options.pagewidth)
    {
      // autocenter using the full viewport width
      this.viewport.style.right = "0";
      this.viewport.style.width = "auto";
    }
    else
    {
      // autocenter within the specified width (can be nice if the webpage is left aligned)
      this.viewport.style.right = "auto";
      this.viewport.style.width = this.options.pagewidth+"px";
    }



    var insertme = this.dialogelement;

    // create wrapper elements to vertical-align content if needed
    var valign_element;
    if (this.options.contentverticalalign)
    {
      //element.style.display = "inline-block";

      // create elements to:
      // - stretch the dialog if it's smaller than the specified contentminheight
      // - vertical align dialog content within the skin
      var dminheight = document.createElement("span");
      dminheight.style.display = "inline-block";
      dminheight.style.verticalAlign = "middle";

      // container for the popup content
      var valign_element = document.createElement("span");
      valign_element.style.display = "inline-block";
      valign_element.style.verticalAlign = "middle";
      valign_element.appendChild(insertme);

      if (this.options.fullscreen)
      {
        dminheight.style.height = "100%";
        valign_element.style.width = "100%";
      }
      else
        dminheight.style.height = this.options.contentminheight+"px";

      var frag = document.createDocumentFragment();
      frag.appendChild(dminheight);
      frag.appendChild(valign_element);

      // we appended the dialogelement to us, now we are the one that needs to be inserted
      insertme = frag;
    }
    else if (this.options.contentminheight)
      element.style.minHeight = this.options.contentminheight + "px";


    var usetemplate = this.options.template != "";
    if (usetemplate)
    {
      this.dialogtemplate = document.createElement("span");
      this.dialogtemplate.innerHTML = this.options.template;

      var template_bodycontainer = getElementByIdInFragment(this.dialogtemplate, this.options.templatebodyid);
      template_bodycontainer.appendChild(insertme);

      // now we are the element to be inserted
      insertme = this.dialogtemplate;
    }


    this.lineheightstretcher = document.createElement("span");
    this.lineheightstretcher.style.cssText = "display:inline-block;vertical-align:middle;width:0px;height:100%;";



    var dialogelem;

    // for backwards compatibility we have to use the original element as container (unless a template or valign container is used)
    if (!usetemplate && !this.options.contentverticalalign)
      dialogelem = this.dialogelement;
    else
    {
      dialogelem = new Element("span"); //$(this.dialogtemplate);
      dialogelem.className = this.options.cssclass;
    }

    dialogelem.addClass("-wh-popup");
    if (this.options.fullscreen)
      dialogelem.addClass("-wh-popup-fullscreen");

    this.dialogviewport = dialogelem;
    var dialogstyles =
            { display:       "inline-block"
            , verticalAlign: "middle"
            , textAlign:     "left"
            , position:      "relative"
            }

    if (this.options.fullscreen)
    {
      dialogstyles.width = "100%";
      dialogstyles.height = "100%";
    }
    else
    {
      /*
       set the outer size

      if (this.options.width)
        dialogstyles.width = this.options.width;

      if (this.options.height)
        dialogstyles.height = this.options.height;
      */

      // We keep the old situation (we set the width/height for the original element,
      // but shouldn't that be something our user should do using CSS ?)
      if (this.options.width)
        this.dialogelement.style.width = this.options.width+"px";

      if (this.options.height)
      {
        var viewport_size = window.getSize();

        var popup_height = this.options.height > viewport_size.y ? viewport_size.y : this.options.height;
console.log(this.options.height, viewport_size.y, popup_height);
        this.dialogelement.style.height = this.options.height+"px";
      }
    }

    dialogelem.setStyles(dialogstyles);

    // backwards compatibility
    if (usetemplate || this.options.contentverticalalign)
      dialogelem.appendChild(insertme);

    this.viewport.appendChild(dialogelem);
    this.viewport.appendChild(this.lineheightstretcher);

    // if there's no template, we are responsible for making a close button
    if (this.options.canclose && this.options.template == "")
    {
      if(this.options.addclosebutton)
      {
        var closebtn = new Element("div", { "class": "-wh-popup-closebutton" } );
        closebtn.addEvent("click", function() { $wh.Popup.closeDialog(this); });
        dialogelem.appendChild(closebtn);
      }
      else
      {
        var closebtn = dialogelem.getElement('.-wh-popup-closebutton');
        if(closebtn)
          closebtn.addEvent("click", function() { $wh.Popup.closeDialog(this); });
      }

    }

    // now throw the whole DOM for the dialog into the place we want it to be
    // (usually document.body)
    this.options.popup_container.appendChild(this.viewport);
    if (this.options.popup_container !== document.body && this.options.popup_container !== document.documentElement)
      this.viewport.style.position = "absolute"; // stay within the given element instead of HTML/BODY viewport

    this.dialog = this.dialogtemplate; // FALLBACK code, obsolete!

    this.visible = this.options.visible;
    if (this.visible)
      this.__isbeingshown();
  }

// FIXME: hide should be deprecated or made 'private'.
// it doesn't call onclose(), but rather is called upon use of closeDialog() or closeCurrentDialog().
// therefore calling this directly will not cancel the autoresize timers of showURLinDialog()
, __hide: function()
  {
    this.fireEvent('beforehide');

    $wh.Popup.modalitylayer.hide();

    this.visible = false;

    if ($wh.Popup.modaldialog == this)
      $wh.Popup.modaldialog = null;

// FIXME: doesn't seem to be called when we are closed through the closebutton on a showurlindialog dialog
    if (this.viewport != null) // in case we used .close in the beforehide callback
    {
      this.viewport.style.display = "none";
      this.fireEvent('hide');
    }
  }

// OBSOLETE
, close: function()
  {
    this.destroy();
  }

, destroy: function()
  {
    //this.viewport.innerHTML = "";
    this.viewport.parentNode.removeChild(this.viewport);
    this.viewport = null;

    // FIXME/ADDME: remove self from list of dialog instances

    this.closed = true;
  }

, show: function()
  {
    if (this.visible)
      return;

    this.viewport.style.display = "";
    this.viewport.style.visibility = "";

    this.__isbeingshown();
  }

, __isbeingshown: function()
  {
    $wh.Popup.modaldialog = this; //$wh.Popup.dialogs[tel];
    this.visible = true;
    this.focusnode.focus(); // before the show event so the show callback can focus another node

    if (this.options.usegreyout)
      $wh.Popup.modalitylayer.show({ container: this.options.popup_container });

    this.fireEvent("show");
  }




, setbodysize: function(width, height)
  {
    this.body.style.width = width+"px";
    this.body.style.height = height+"px";
  }

/////////////////////////////////////////////////////////////////
//
//  Auto resize to iframe content
//

// hopefully one day whe'll see this appear: https://bugzilla.mozilla.org/show_bug.cgi?id=80713
, activateAutoresizeToIframe: function()
  {
    var self = this;
    this.resizeToIframe();
    this.scheduleAutoResize();
  }

, scheduleAutoResize: function()
  {
    var self = this;
    clearTimeout(this.resizetimer);
    this.resizetimer = setTimeout(function() { self.resizeToIframe(); }, 500);
  }

, resizeToIframe: function()
  {
    this.scheduleAutoResize();

    /*
    if (typeof window.count == "undefined")
      window.count = 0;
    else
      window.count++;
    */

    var framedoc = toddGetIFrameDocument(this.frame);
    if (!framedoc)
     return;

    var resize_width_to_content = typeof this.options.iframewidth == "undefined"
                                  || this.options.iframewidth == "content";

    var resize_height_to_content = typeof this.options.iframeheight == "undefined"
                                  || this.options.iframeheight == "content";

    try
    {
      var htmlelem = framedoc.documentElement;
      if (!htmlelem) // IE: is there an actual page loaded in this div?
        return;
    }
    catch(err) // catch exceptions for trying to access a crossdomain documentElement
    {
      this.frame.style.width = "100%";
      this.frame.style.height = "100%";
      return;
    }

    var framebody = framedoc.body;
    if (!framebody) // FF: is there an actual page loaded in this div?
      return;


    // determine size of horizontal scrollbar
    if (!this.scrollbarwidth)
    {
      this.body.style.overflowY = "scroll";
      this.scrollbarwidth = this.body.offsetWidth - this.body.clientWidth;
      //console.log(this.scrollbarwidth);
      this.body.style.overflowY = "hidden";
    }

    //FIXME stay away from the global namespace
    var prevsize = window.prevsize;

    var keepfromedge = this.options.keepfromedge;

    /*
    console.log({ resize_width_to_content:  resize_width_to_content
                , resize_height_to_content: resize_height_to_content
                , maxdialogwidth: maxdialogwidth
                , maxdialogheight: maxdialogheight
                });
    */

    var mywidth, myheight;

    if (resize_width_to_content || resize_height_to_content)
    {
      if (Browser.ie && Browser.version == 7)
      {
        framebody.style.position = "static"; // !! downside to static is element within with width:100% will use the size of <html>
        framebody.style.display = "inline"; // don't grow to fit <HTML>, just use what is needed
      }
      else
      {
        framebody.style.display = "inline-block"; // don't grow to fit <HTML>, just use what is needed
      }
    }

    if (resize_width_to_content)
    {
      var ownerviewportwidth = document.documentElement.clientWidth;

      var maxdialogwidth       = ownerviewportwidth - keepfromedge.left - keepfromedge.right;
      var maxframewidth        = maxdialogwidth - 0; // -border/padding etc...

      // subtract scrollbarwidth so we leave room for the vertical scroller
      var maxframecontentwidth = maxframewidth - this.scrollbarwidth;

      // set the <html> of the document to the max space we are willing to provide
      htmlelem.style.width = maxframecontentwidth + "px";
    }

    if (resize_height_to_content)
    {
      var ownerviewportheight = document.documentElement.clientHeight;

      // FIXME: we assume the padding-top and padding-bottom to be the same
      var maxdialogheight = ownerviewportheight - keepfromedge.top - keepfromedge.bottom;

      if (this.headernode)
        maxdialogheight -= this.headernode.offsetHeight;

      var maxframeheight  = maxdialogheight - 0; // FIXME: border/padding
      //var maxframecontentheight = maxframeheight;
    }


    // document.body.scrollWidth/scrollHeight would return the full available size instead of rect of used space
    var contentbounds = framedoc.body.getBoundingClientRect();
    // reconstruct, IE doesn't allow a boundsobject to be extended
    contentbounds = { width:  contentbounds.right /*- contentbounds.left*/
                    , height: contentbounds.bottom - contentbounds.top
                    };


    // For Webkit based-browsers (SF/CHR) we need to reset the html width,
    // otherwise they will base the scrollbars on the <html> instead of the <body>.
    // Since we use the <html> to define the max size the <body> can grow too,
    // the iframe will assume a very large page.
    // FIXME: check whether this messes with other browsers
    // FIXME: check why ipad scroll again doesn't work
    // FIXME: check performance effect or constantly changing the width twice each pass
    htmlelem.style.width = "";


    mywidth = contentbounds.width + 35; // use Math.ceil for FF's subpixels pixels?
    var overflowx = false;
    if (mywidth > maxdialogwidth)
    {
      mywidth = maxframewidth;
      overflowx = true;
    }


    myheight = contentbounds.height;
    var overflowy = false;
    if (myheight > maxdialogheight)
    {
      myheight = maxframeheight;
      overflowy = true;
    }


    // keep the dialog from twitching
    // (due to animations or css hover effects making the document a few pixels bigger or smaller)
    var twitchtreshold = 5;

    if (this.prevsize && Math.abs(this.prevsize.width - mywidth) <= twitchtreshold && Math.abs(this.prevsize.height - myheight) <= twitchtreshold)
      return;


    mywidth  = Math.ceil(mywidth + twitchtreshold);
    myheight = Math.ceil(myheight + twitchtreshold);

    this.frame.style.width = mywidth+"px";
    this.frame.style.height = myheight+"px";


    this.prevsize = { width: mywidth
                    , height: myheight
                    };

    /*
    console.log({ mywidth:  mywidth
                , myheight: myheight
                , resize_width_to_content:  resize_width_to_content
                , resize_height_to_content: resize_height_to_content
                });

    console.log({ overflowx: overflowx
                , overflowy: overflowy
                });
    */

    // only apply iOS scrolling workaround on iOS devices.
    // the double scrollcontainer may interfere with eachother in desktop browsers
    // FIXME: also prevent scrolling at end causing elastic scroll on the top window
    var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/i) ? true : false );
    if (iOS)
    {
      htmlelem.style.overflowX = overflowx ? "scroll" : "hidden";
      htmlelem.style.overflowY = overflowy ? "scroll" : "hidden";

      framebody.style.overflow = "auto";
      framebody.style.webkitOverflowScrolling = "touch";

      // size needed because on iPad webkit will autosize the frame to content
      // (as if it uses the HTML5 attribute seamless="true"
      // which will stretch our dialog and prevent scrolling from happening

      // subtract the difference due to padding and borders from the totalheight, so we don't keep making the frame larger
      framebody.style.height = (myheight - framebody.offsetHeight-framebody.clientHeight)+"px";
    }
    else
    {
      this.frame.style.overflowX = overflowx ? "scroll" : "hidden";
      this.frame.style.overflowY = overflowy ? "scroll" : "hidden";
    }

    // test to help IE 8 (prevent dialog not recentering upon initial resizing of the dialog)
    if (Browser.ie && Browser.version == 8)
      this.dialog.style.zoom = "1";
  }

, handleIframeReady: function()
  {
    var framedoc = toddGetIFrameDocument(this.frame);
    //console.log(framedoc);
    if (!framedoc && console && console.warn)
      console.warn("Failed to access iframe document");
    else
      disableWheelOutsideForFrame(framedoc);

    // for IE, which doesn't seem to call the onload for some reason
    if(this.titlenode)
      $(this.titlenode).set("text", this.frame.contentWindow.document.title); // fixme: required mootools

    clearTimeout(this.forceshowtimeout);

    if (!this.options.iframeheight) // FIXME or no iframewidth?
      this.activateAutoresizeToIframe();

    this.show();
  }

, close: function()
  {
  }

});



$wh.IframePopup = new Class(
{ Extends: $wh.Popup
, __hide: function()
  {
    this.frame.setAttribute("src", ""); // so playback stops
    this.destroy();
    this.parent();
  }
});



$wh.Popup.dialogs = [];
$wh.Popup.modaldialog = null;
$wh.Popup.globalsettings = {};

// FIXME: cannot be used within a iframe yet
$wh.Popup.closeDialog = function(node)
{
  // lookup the dialog by the dialognode
  var dialoginstance = getDialogInstanceContainingNode(node);
  if (!dialoginstance)
    return;

  $wh.Popup.__closeDialogByReference(dialoginstance);
}

$wh.Popup.__closeDialogByReference = function(dialoginstance)
{
  // FIXME: this is meant for use by the iframe version of the popup dialog and
  // should be moved to the iframe version of the popup (DON'T use .onclose outside whpopup)
  if (dialoginstance.onclose)
    dialoginstance.onclose();

  dialoginstance.__hide();

  if (dialoginstance == $wh.Popup.modaldialog)
    $wh.Popup.modaldialog = null;
}

$wh.Popup.setDialogTemplate = function(templatehtml, templatebodyid)
{
  $wh.Popup.globalsettings.template = templatehtml;
  $wh.Popup.globalsettings.templatebodyid = templatebodyid;
}

/** @param element
    @param settings
*/
$wh.Popup.showElementAsDialog = function(element, settings)
{
  if (typeof element == "string")
    element = document.getElementById(element);

  if(typeof settings == "undefined")
    settings = {};

  if(typeof settings.reuse_instance == "undefined")
    settings.reuse_instance = true;

  if(typeof settings.popupclass == "undefined")
    settings.popupclass = "Popup";

  if (settings.reuse_instance)
  {
    // lookup if the given element was already changed into a dialog
    for(var tel=0; tel<$wh.Popup.dialogs.length; tel++)
    {
      if ($wh.Popup.dialogs[tel].body == element)
      {
        $wh.Popup.dialogs[tel].show();
        return $wh.Popup.dialogs[tel];
      }
    }
  }
  // convert the element to an dialog
  var newdialog = new $wh[settings.popupclass](element, settings);
  $wh.Popup.dialogs.push(newdialog);

  //var body = newdialog.body;

  return newdialog;
}

$wh.Popup.cancelonesc = function(e)
{
  if (!$wh.Popup.modaldialog || !$wh.Popup.modaldialog.options.close_using_esc)
    return;

  if (e.code == 27)
    $wh.Popup.closeCurrentDialog();
}

/** settings.iframewidth
    settings.iframeheight (if not set, the dialog will be resized to the size of the iframe's content and scrollbars will be disabled if possible)
*/
$wh.Popup.showURLInDialog = function (url, settings)
{
  var test = document.location.protocol+"//"+document.location.host;
  var crossdomain = url.search("://") > 0 && (test != url.substring(0, test.length));

  if (!settings)
    settings = {};

  if (typeof settings.visible == "undefined")
    settings.visible = false;

  var content = new Element("span", { "class": "body iframebody" });

  var frame = document.createElement('iframe');
  frame.style.cssText = 'resize: none; border: 0;';

/*
  console.log(this.options.height, viewport_size.y, popup_height);
*/

  // note: setting height to 100% will make the dialog the full window height in Safari
  var iframewidth;
  if (settings.iframewidth)
    iframewidth = settings.iframewidth;
  else if (crossdomain)
    iframewidth = 800; // FIXME: autosize to max size

  var iframeheight;
  if (settings.iframeheight)
    iframeheight = settings.iframeheight;
  else if (crossdomain)
    iframeheight = 500; // FIXME: autosize to max size

  var viewport_size = window.getSize();

  if (iframewidth)
  {
    var popup_width = iframewidth > viewport_size.x ? viewport_size.x : iframewidth;
    frame.style.width = popup_width+"px";
  }

  if (iframeheight)
  {
    var popup_height = iframeheight > viewport_size.y ? viewport_size.y : iframeheight;
    frame.style.height = popup_height+"px";
  }

  // the iframe must be the scrollcontainer, iOS devices will eat the scroll/touch in the frame,
  // so a parent container won't receive the scroll event
  //frame.style.overflow = "hidden";
  frame.style.display = "block"; // in IE7 it's not a block by default?? causing a few extra pixels below the iframe
  frame.setAttribute("frameBorder", "0"); // IE ignores the border:0; style for iframes
  frame.setAttribute("allowTransparency", "true"); // IE shows an opaque background in the iframe without this
  content.appendChild(frame);

  settings.reuse_instance = false;
  settings.popupclass = "IframePopup";

  var dialog = $wh.Popup.showElementAsDialog(content, settings);

  // FIXME: we should prevent the overflow from happening, no mess with the overflow, the user might want to
  // place the closebutton just outside of the popup
  //dialog.body.style.overflow = "hidden"; // let the iframe scroll, NOT the dialog body in case of showing a website

  // FIXME: make more generic/reuse code
  if (!dialog.headernode)
  {
    dialog.headernode = dialog.body.getElement("-wh-popup-header");
    dialog.titlenode = dialog.body.getElement("-wh-popup-title");

    if (dialog.headernode)
      dialog.headernode.removeAttribute("id");
  }

  if (dialog.titlenode)
  {
    if (settings.title)
    {
      //dialog.titlenode.set("text", settings.title);
      dialog.titlenode.innerHTML = settings.title;
      dialog.titlenode.style.display = "";
    }
    else
    {
      //dialog.titlenode.set("text", "");
      dialog.titlenode.innerHTML = "";
      //dialog.titlenode.setStyle("display", "none");
    }
  }

  dialog.frame = frame;
  dialog.closed = false;

  // directly give the user the ability to scroll the page in the shown website
  // by focussing the iframe in the popup
  // we need a try/catch for IE
  // note: IE doesn't support focus() on the iframe, but it does on frame.contentWindow
  //try { dialog.frame.focus(); } catch(err) {}

  // FIXME: upon domcontentloaded and onload events explicitly also resize?
  dialog.prevsize = null;

  // FIXME: if showURLinDialog is an extend of a dialog class we can implement this in it's close() function

  if (settings.iframewidth || settings.iframeheight || crossdomain)
    dialog.show();
  else
    addIframeEventsHandlers(dialog);

  frame.src = url;

  return dialog;
}

function addIframeEventsHandlers(dialog)
{
  dialog.onclose = function()
        {
          //console.log(dialog);
          if (dialog.resizetimer)
            clearTimeout(dialog.resizetimer);

          if(dialog.forceshowtimeout)
            clearTimeout(dialog.forceshowtimeout);

          if (Browser.ie)
            dialog.frame.document.execCommand('Stop');
          else if (dialog.frame.contentWindow) // SF5 doesn't have a contentWindow before the page is loaded?
          {
            try { dialog.frame.contentWindow.stop(); } catch(err) { /* FF crossdomain: Error: Permission denied to access property 'stop' */ }
          }
        }

  dialog.frame.onload = function() // not called by IE?
        {
          if (dialog.closed)
            return;

          dialog.handleIframeReady();
        };

  dialog.frame.onreadystatechange = function()
        {
          if (dialog.closed)
            return;

          //console.log("readystatechange to "+frame.readyState);
          if (dialog.frame.readyState == "complete")
            dialog.handleIframeReady();
        };

  dialog.forceshowtimeout = setTimeout(function()
        {
          //console.log("show forced");
          dialog.activateAutoresizeToIframe();
        }, 4000);
}

$wh.Popup.closeCurrentDialog = function()
{
  if ($wh.Popup.modaldialog)
  {
    $wh.Popup.__closeDialogByReference( $wh.Popup.modaldialog );
  }
  else // if there isn't a dialog in this document, check if we ourselve are part of a dialog (in a iframe)
  {
    var frameelem = window.frameElement;
    if (!frameelem)
      return; // we don't seem to be running in an iframe

    // close the current dialog of our parent frame
    //var parentwin = window.frameElement.ownerDocument.window;
    //if (parentwin.closeCurrentDialog)
    //  parentwin.closeCurrentDialog();

    var parentwin = parent.document.window;
    if(!parentwin.getDialogByFrameRef)
      return; //not an iframe capable of managing popups

    var dialogobj = parentwin.getDialogByFrameRef(this.frameElement);
    parentwin.$wh.Popup.__closeDialogByReference(dialogobj);
  }
}



/****************************************************************************************************************************
 * Modalitylayer
 */

// not sure yet if ready for standalone usage (and moving to it's own file)
// maybe next time someone needs something like this check if it fits the requirements first
// FIXME: support handling of colors and opacity in CSS, JS or possibility of both?
// ADDME: ability to animate (for example animate the opacity from 0 to 1)
$wh.ModalityLayer = new Class(
  { Implements: [ Options, Events ]
  , options:
       { background_blur_radius: 0
       , container:              null // if let to null the document body will be used
       , effectnode:             null // if set to null, the options.container setting will be used
       }

  , node:   null

  , visible: false

  , initialize: function()
    {
    }

  , show: function(options)
    {
      this.setOptions(options);

      if (this.visible)
        return;

      if (!this.options.container)
        this.options.container = $(document.body);

      if (!this.options.effectnode)
        this.options.effectnode = this.options.container;

      // a workaround to prevent the same event which triggered the modalitylayer
      // also triggering the closing of the modalitylayer
      // FIXME: since another class opens us, maybe they should handle the workaround against this problem too?
      (function() { this.visible = true; }).delay(0, this);

      this.node = new Element("div", { "class": "-wh-popup-modalitylayer" });
      //this.node.style.cssText = "position:fixed !important;top:0;left:0;width:100%;height:100%;background-color:#000000;opacity: 0.4; filter:alpha(opacity=40);z-index:49999;";
      this.node.style.cssText = "position:fixed !important;top:0;left:0;width:100%;height:100%;z-index:49999;";
      if (this.options.container !== document.body && this.options.container !== document.documentElement)
        this.node.style.position = "absolute"; // stay within the given element instead of HTML/BODY viewport

      this.options.container.appendChild(this.node);

      this.__activateModalLayerEffects();
    }

  , hide: function()
    {
      if (!this.visible)
        return;

      this.visible = false;
      this.node.destroy();
      this.__deactivateModalLayerEffects();
    }

  // activate effects like blurring
  , __activateModalLayerEffects: function()
    {
      var body = $(document.body);

      var ua = navigator.userAgent;
      var webkit_engine = ua.indexOf("AppleWebKit/") > -1;

      if (this.options.background_blur_radius > 0)
      {
        if(webkit_engine)
          body.setStyle("webkitFilter", "blur("+this.options.background_blur_radius+"px)")
        else
        {
          var blurelem = new Element("div", { id: "whpopup-effect" });
          blurelem.set("html", '<svg height="0" xmlns="http://www.w3.org/2000/svg"><filter id="whpopupblur" x="0" y="0" width="100%" height="100%"><feGaussianBlur in="SourceGraphic" stdDeviation="'+this.options.background_blur_radius+'"/></filter></svg>');
          this.options.effectnode = blurelem;

          body.adopt(blurelem);
          body.setStyle("filter", "url(#whpopupblur)");
        }
      }
    }

  , __deactivateModalLayerEffects: function()
    {
      var ua = navigator.userAgent;
      var webkit_engine = ua.indexOf("AppleWebKit/") > -1;

      // FIXME: if changing blur radius during an visible modalitylayer the blur effect won't be removed
      if (this.options.background_blur_radius > 0)
      {
        if(webkit_engine)
          $(document.body).setStyle("webkitFilter", "")
        else
        {
          $(document.body).setStyle("filter", "");
          this.options.effectnode.destroy();
        }
      }
    }
});


$wh.Popup.modalitylayer = new $wh.ModalityLayer();

$(document).addEvent("keyup", $wh.Popup.cancelonesc);
$(window).addEvent("domready", wsdialogs_init);

})(document.id); //end mootools wrapper
