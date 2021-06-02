/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
/*! LOAD: frameworks.mootools !*/

if(!window.$wh) window.$wh={};

(function($) { //mootools wrapper

$wh.crossDocumentImportNeeded = Browser.ie || Browser.version < 8;

$wh.importNode = function(doc, node, deep)
{
  if (!Browser.ie || Browser.version > 8) //if this breaks, verify http://stackoverflow.com/questions/1811116/ie-support-for-dom-importnode explaining that IE9 broke.. ? FIXME: irrelevant comment ? if toddng works on IE9, it probably is
    return doc.importNode(node, deep);
  if (node.ownerDocument == doc)
    return doc.cloneNode(deep);
  if (node.nodeType == 3 || node.nodeType == 4)
    return doc.createTextNode(node.nodeValue);

  if (node.nodeType == 1)
  {
    var newnode = doc.createElement(node.nodeName);
    if (node.attributes)
    {
      var vals = $wh.getAllAttributes(node);
      $wh.setAttributes(newnode, vals);
    }

    if (node.style.cssText)
      newnode.style.cssText = node.style.cssText;
    if (node.className)
      newnode.className = node.className;
  }
  else if(node.nodeType == 11)
  {
    var newnode = doc.createDocumentFragment();
  }
  else
  {
    return null;
  }

  if (deep)
  {
    if(node.nodeName.toLowerCase()=="style")
    {
      newnode.type="text/css";
      newnode.styleSheet.cssText=node.styleSheet.cssText;
    }
    else for (var i = 0, end = node.childNodes.length; i < end; ++i)
    {
      var subnode = $wh.importNode(doc, node.childNodes[i], true);
      if (subnode)
        newnode.appendChild(subnode);
    }
  }
  return newnode;
}

$wh.setInnerHTML = function(node, htmltext)//FIXME remove this function as soon as IE8 passes all tests
{
  // IE7 messes up links when setting innerhtml (makes them absolute)
  if (!Browser.ie || Browser.version >= 10 || (Browser.version >= 8 && node.nodeName.toLowerCase()!='head'))
  {
    node.innerHTML = htmltext;
    return;
  }

  var transferDoc = new ActiveXObject("htmlfile");
  transferDoc.open();
  transferDoc.write("<!DOCTYPE html><html><body>" + htmltext + "</body></html>");
  transferDoc.close();
  var testnode = transferDoc.body;

  // Clear node
  while (node.firstChild)
    node.removeChild(node.firstChild);

  if (testnode)
  {
    for (var i = 0; i < testnode.childNodes.length; ++i)
    {
      var imported = $wh.importNode(node.ownerDocument, testnode.childNodes[i], true)
      if (imported)
        node.appendChild(imported);
    }
  }
}

$wh.hasAttribute = function(node, name)
{
  if (node.hasAttribute)
    return node.hasAttribute(name);

  for (var i=0;i<node.attributes.length;++i)
    if (node.attributes[i].nodeName == name && node.attributes[i].specified)
      return true;

  return false;
}

$wh.getAttributes = function(node, attrlist)
{
  var result = {};
  for (i = 0; i < attrlist.length; ++i)
    if ($wh.hasAttribute(node, attrlist[i]))
    {
      var value = node.hasAttribute ? node.getAttribute(attrlist[i], 2) : node.attributes[attrlist[i]].nodeValue;
      result[attrlist[i]] = value;
    }
  return result;
}

$wh.getAllAttributes = function(node)
{
  var res = {};
  for (var i = 0, end = node.attributes.length; i < end; ++i)
  {
    if (node.attributes[i].specified === false) // IE7  returns all attributes, set specified on present values
      continue;

    var name = node.attributes[i].name;
    var value = node.getAttribute(name, 2); // Return value as string, do not interpolate (or make links absolute)

    res[name] = value;
  }
  return res;
}

$wh.setAttributes = function(node, attrs)
{
  // Insert sorted on attributes name
  var keys = Object.keys(attrs).sort();

  // MUST set SRC first on <img> on IE8 - height/width are reset when setting src
  if (Browser.ie && Browser.version <= 8 && node.nodeName.toLowerCase() == 'img')
  {
    var pos_src = keys.indexOf('src');
    if (pos_src != -1)
    {
      keys.splice(pos_src, 1);
      keys.unshift('src');
    }
    keys.erase('complete'); // Ignore complete attr
  }

  // firefox will show attributes in innerHTML in reverse insert order
  if (Browser.firefox)
    keys = keys.reverse();

  for (var i = 0; i < keys.length; ++i)
    node.setAttribute(keys[i], attrs[keys[i]]);
}

$wh.cloneNode = function(node, deep)
{
  if (!deep) throw new Error("Only deep clones supported for now");

  if (!Browser.ie || Browser.version > 8)
    return node.cloneNode(deep);
  else
    return $wh.importNode(node.ownerDocument, node, deep);
}

})(document.id); //end mootools wrapper
