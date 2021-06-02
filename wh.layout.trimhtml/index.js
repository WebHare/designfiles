/* generated from Designfiles Public by generate_data_designfles */
 // FIXME: convert our use of .hassClass to .classList.contains("wh-video") when IE9 is a non-issue

(function($) {

if(!window.$wh) window.$wh={};

/** @short to strip empty paragraphs from RTD content nodes
    @long (serverside cleanup would be preferred ofcourse)
*/
$wh.trimHTML = function(rcontent)
{
  // remove empty elements at the start of the rendered content
  var firstelement = rcontent.children[0];
  while(firstelement)
  {
    //console.log(firstelement.innerHTML);

    if (firstelement.tagName == "IMG" || firstelement.tagName == "INPUT" // skip 'empty' elements
        || firstelement.hasClass("wh-video") // skip elements which we replace with real content
        || firstelement.children.length > 0)
    {
      //console.log("has content", firstelement.children.length, firstelement.tagName);
      break;
    }

    var textcontent = firstelement.textContent;
    if (typeof textcontent == "undefined")
      textcontent = firstelement.innerText;

    if (textcontent.trim)
      textcontent.trim();

    //console.log('textcontent len="' + textcontent.length + "*" + textcontent + "*");

    if (textcontent != "" && textcontent != " " && textcontent != "\n")
      break;

    firstelement.destroy();
    firstelement = rcontent.children[0];
  }
}

})(document.id);
