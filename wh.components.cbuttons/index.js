/* generated from Designfiles Public by generate_data_designfles */
require ('./cbuttons.css');
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! REQUIRE: frameworks.mootools, wh.compat.base
!*/


if(!window.$wh) $wh={};
$wh.CButtons={};

/** Convert all buttons marked with wh-cbutton. Note that this function is
 *  automatically invoked onDomReady */
$wh.applyAllCButtons = function()
{
  $$('.wh-cbutton, .-wh-cbutton').each($wh.applyCButton);
}

/*$wh.__submitCButton = function(event)
{
  /* inject a input type=hidden to simulate button push * /
  var myform = this.getParent('form');
  if(!myform)
    return; //<input> was outside a form apparently. ignore

  myform.appendChild(new Element('input', { "type": "hidden"
                                          , "name": this.retrieve('submitname')
                                          , "value": this.retrieve('submitvalue')
                                          }));

  //myform.submit();
  myform.fireEvent("submit"); // not all browsers will fire submit when done through JS
  myform.submit();
}*/
$wh.__submitCButton = function(event)
{
  this.getChildren("input").pick().click();
}
$wh.applyCButton = function(buttonnode)
{
  if(buttonnode.getSelfOrParent(".wh-cbutton-replaced")) //already dealth with;
    return;

  var classes = buttonnode.className.split(' ');
  buttonnode.addClass("-wh-cbutton").addClass("wh-cbutton").addClass("-wh-cbutton-replaced");

  var wasinput = buttonnode.nodeName.toUpperCase() == 'INPUT';

  var bcontent = document.createDocumentFragment();
  bcontent.appendChild(new Element("span", { "class": "left"}));

  var btnmid = new Element("span", { "class" : "mid" });

  if(wasinput)
    btnmid.adopt(document.createTextNode(buttonnode.getProperty('value')));
  else
    btnmid.adopt(buttonnode.childNodes);

  for (var i=classes.length-1;i>=0;--i)
    if(classes[i].substr(0,17) == '-wh-cbutton-left-')
      btnmid.insertBefore(new Element("span", { "class": "-wh-cbutton-left-" + classes[i].substr(17) }), btnmid.firstChild);
  for (var i=classes.length-1;i>=0;--i)
    if(classes[i].substr(0,16) == 'wh-cbutton-left-')
      btnmid.insertBefore(new Element("span", { "class": "wh-cbutton-left-" + classes[i].substr(17) }), btnmid.firstChild);

  for (var i=0;i<classes.length;++i)
    if(classes[i].substr(0,18) == '-wh-cbutton-right-')
      btnmid.appendChild(new Element("span", { "class": "-wh-cbutton-right-" + classes[i].substr(18) }));
  for (var i=0;i<classes.length;++i)
    if(classes[i].substr(0,17) == 'wh-cbutton-right-')
      btnmid.appendChild(new Element("span", { "class": "wh-cbutton-right-" + classes[i].substr(18) }));

  bcontent.appendChild(btnmid);
  bcontent.appendChild(new Element("span", { "class": "right"}));

  if(wasinput)
  {
    var replacement = new Element('span', { "class": buttonnode.get('class') + " -wh-cbutton-formsubmit wh-cbutton-formsubmit"
                                          , "events": { "click": $wh.__submitCButton }
                                          , "tabindex": 0
                                          });
    if(buttonnode.getStyle('float'))
      replacement.setStyle('float', buttonnode.getStyle('float'));
    buttonnode.tabIndex = -1;

    replacement.appendChild(bcontent);
    replacement.replaces(buttonnode);
    replacement.appendChild(buttonnode);
    buttonnode.store('-wh-cbutton-replacement', replacement);
    buttonnode.store('wh-cbutton-replacement', replacement);
  }
  else
  {
    buttonnode.empty();
    buttonnode.appendChild(bcontent);
  }
}

Element.Properties.text =
{
  set: function(text)
  {
    if(this.__wh_cbutton_replaced)
      this.getChildren('span.mid').set("text", text);
    else
      this.setProperty('text',text);
  }
, get: function()
  {
    if(this.__wh_cbutton_replaced)
      return this.getChildren('span.mid').get("text");
    else
      return this.getProperty('text');
  }
};
$(window).addEvent("domready",$wh.applyAllCButtons);
