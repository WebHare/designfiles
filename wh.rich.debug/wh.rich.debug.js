/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
require ('wh.rich.internal.domlevel');
/*! REQUIRE: wh.compat.base, wh.rich.internal.domlevel !*/

if(!$wh.Rich) $wh.Rich={};

(function($) { //mootools wrapper

function getIndentedLineBreak(indent, incr)
{
  if (!indent) return '';
  indent += incr || 0;
  var result = '\n';while(--indent)result+=' ';
  return result;
}

function getStructuredOuterHTML(node, namedlocators, indent)
{
  var locators = {};
  indent = indent?1:0;

  // Detect all locators & elements in namedlocators in the first 2 levels (array/record), move to single level object
  for (var n in namedlocators)
  {
    var elt = namedlocators[n];
    if (elt && typeof elt == "object")
    {
      if (elt.element)
        locators[n] = elt;
      else if (elt.nodeType)
      {
        locators[n+'#elt'] = new $wh.Rich.Locator(elt);
        locators[n+'#elt'].moveToParent();
      }
      else
      {
        for (var m in elt)
        {
          if (elt[m] && typeof elt[m] == "object")
          {
            if (elt[m].element)
              locators[n+'.'+m] = elt[m];
            else if (elt[m].nodeType)
            {
              locators[n+'.'+m+'#elt'] = new $wh.Rich.Locator(elt[m]);
              locators[n+'.'+m+'#elt'].moveToParent();
            }
            else
            {
              var subelt = elt[m];
              for (var k in subelt)
              {
                if (subelt[k] && typeof subelt[k] == "object")
                {
                  if (subelt[k].element)
                    locators[n+'.'+m+'.'+k] = subelt[k];
                  else if (subelt[k].nodeType)
                  {
                    locators[n+'.'+m+'.'+k+'#elt'] = new $wh.Rich.Locator(subelt[k]);
                    locators[n+'.'+m+'.'+k+'#elt'].moveToParent();
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  var retval = '';
  if (node.parentNode)
  {
    var parent = node.parentNode;
    for (var n in locators)
      if (locators[n].element == parent && locators[n].offset < parent.childNodes.length && parent.childNodes[locators[n].offset] == node)
        retval += getLocatorText(n, locators[n]);
  }
  if (retval)
    retval += getIndentedLineBreak(indent);
  return retval + getStructuredOuterHTMLInternal(node, locators, indent);
}

function getLocatorText(name, locator)
{
  return '(#' + name + (locator.id?'$'+locator.id+(locator.cc?'/'+locator.cc:''):'') + ')';
}

function getNamedLocatorsText(namedlocators, node, offset, indent, incr)
{
  var locatortext = '';
  for (var n in namedlocators)
    if (namedlocators[n].element == node && namedlocators[n].offset == offset)
      locatortext += getLocatorText(n, namedlocators[n]);

  if (locatortext && indent)
    locatortext = getIndentedLineBreak(indent, incr) + locatortext;

  return locatortext;
}

  // Shows HTML structure, shows locators at their location
function getStructuredOuterHTMLInternal(node, namedlocators, indent)
{
  if(!node)
    return '<undefined>';

  var retval = '';
  if(node.nodeType==11 || node.nodeType == 9)
  {
    for (var i=0;i<node.childNodes.length;++i)
    {
      if (i != 0 && !indent)
        retval += ' ';

      retval += getNamedLocatorsText(namedlocators, node, i, indent);
      retval += getIndentedLineBreak(indent);
      retval += getStructuredOuterHTMLInternal(node.childNodes[i], namedlocators, indent && indent + 1);
    }

    retval += getNamedLocatorsText(namedlocators, node, node.childNodes.length, indent);
    return retval;
  }
  if(node.nodeType==1)
  {
    retval += '<' + node.nodeName.encodeAsValue();
    for(var i=0;i<node.attributes.length;++i)
    {
      var attrvalue = String(node.attributes[i].value || node.attributes[i].nodeValue || '');
      if (attrvalue)
      {
        var attrname = node.attributes[i].nodeName + '';
        if (attrvalue.substr(0,9) == "function(") // Readability for IE8
          continue;
        retval += ' ' + attrname.encodeAsValue() + '="' + attrvalue.encodeAsValue() + '"'
      }
    }

    if (node._xtest)
      retval += ':' + node._xtest;
    retval += '>';

    var nodecontents = '';
    for (var i=0;i<node.childNodes.length;++i)
    {
      if (i != 0 && !indent)
        nodecontents += ' ';

      nodecontents += getNamedLocatorsText(namedlocators, node, i, indent, 1);
      nodecontents += getIndentedLineBreak(indent, 1);
      nodecontents += getStructuredOuterHTMLInternal(node.childNodes[i], namedlocators, indent && indent + 1);
    }

    nodecontents += getNamedLocatorsText(namedlocators, node, node.childNodes.length, indent, 1);

    retval += nodecontents;
    if (nodecontents)
      retval += getIndentedLineBreak(indent);
    return retval + '</' + node.nodeName.encodeAsValue() + '>';
  }
  if(node.nodeType==3 || node.nodeType==4 || node.nodeType == 8)
  {
    if(node.nodeType == 3)
      retval += '#text:';
    if (node.nodeType == 4)
      retval += '#cdata:';
    if (node.nodeType == 8)
      retval += '#comment:';
    if (node._xtest)
      retval += node._xtest + ':';

    var text = '', intext=node.nodeValue; //use temp as accessing long nodeValues is slow on IE
    for (i = 0; i < intext.length; ++i)
    {
      text += getNamedLocatorsText(namedlocators, node, i);
      text += intext.substr(i, 1);
    }
    text += getNamedLocatorsText(namedlocators, node, intext.length);
    var valenc = unescape(escape(text.encodeAsValue()).split('%u').join('\\u').split('%A0').join('\\u00A0'));
    retval += '"' + valenc + '"';// + (valenc != urienc ? ' - "' + urienc + '"' : '');
    return retval;
  }
  return node.nodeName;
}

function unstructureDom(win, node, locators)
{
  locators = locators || [];
  var foundlocator = false;
  for (var i = 0; i < node.childNodes.length;)
  {
    var child = node.childNodes[i];

    if (child.nodeType != 3)
    {
      unstructureDom(win, child, locators);
      ++i;
      continue;
    }

    var text = child.nodeValue;
    var result = null;
    var quoted = false;
    var locator = new win.$wh.Rich.Locator(node, i);
    var hadlocator = false;
    for (var a = 0; a < text.length;)
    {
      if (text.substr(a, 2) == '(*')
      {
        var endpos = text.indexOf('*)', a);

        var pos = parseInt(text.substring(a+2,endpos));
        while (locators.length <= pos)
          locators.push(null);
        if (locators[pos])
          throw "Included locator (*" + pos + "*) twice";
        locators[pos] = locator.clone();
        a = endpos + 2;
        foundlocator = true;
        continue;
      }
      if (text.substr(a, 1) == '"')
      {
        if (!quoted)
        {
          if (!(result === null))
            throw "Too much quotes in text node: " + node.innerHTML;
          quoted = true;
          locator = new win.$wh.Rich.Locator(child, 0);
          result = '';
        }
        else
        {
          quoted = false;
          locator = new win.$wh.Rich.Locator(node, i + 1);
        }
        ++a;
        continue;
      }
      if (quoted)
      {
        result += text.substr(a, 1);
        ++locator.offset;
      }
      else
        throw "Unquoted content! " + node.innerHTML;
      ++a;
    }

    if (quoted)
      throw "Quotes not balanced: " + node.innerHTML;

    if (result === null)
      node.removeChild(child);
    else
    {
      child.nodeValue = result;
      ++i;
    }
  }

  // If we removed all the text content with the locators, add a br at the end of the node
  if (foundlocator && [ 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote' ].contains(node.nodeName.toLowerCase()))
  {
    var locator = new $wh.Rich.Locator(node);
    var res = locator.scanUpStream(node, { whitespace: true }); // only whitespace?
    if (res.type == 'outerblock')
    {
      var br = node.ownerDocument.createElement('br');
      locator.insertNode(br);
    }
  }

  return locators;
}

$wh.Rich.getStructuredOuterHTML = getStructuredOuterHTML;
$wh.Rich.unstructureDom = unstructureDom;


$wh.Rich.SourceDebugger = new Class(
{ Binds: ["onStateChange","onEditorChange"]
, rte:null
, el: null
, editor:null
, initialize:function(rte,el)
  {
    this.rte = rte;
    this.el = $(el);
    this.rte.addEvent("editorchange", this.onEditorChange);
    if(this.rte.getEditor())
    {
      this.editor = this.rte.getEditor();
      this.editor.addEvent("statechange", this.onStateChange);
    }
  }
, refresh: function()
  {
    this.onStateChange(null);
  }
, onEditorChange:function(event)
  {
    if(this.editor)
      this.editor.removeEvent("statechange", this.onStateChange);
    this.editor = event.editor;
    if(this.editor)
      this.editor.addEvent("statechange", this.onStateChange);
  }
, onStateChange:function(event)
  {
    try
    {
      var range = this.editor.getSelectionRange();
      var orgrange = this.rte.pageframe.debugGetRawSelectionRange() || range;

      locators =
          { start: range.start
          , end: range.end
          }

      if (!orgrange.start.equals(range.start))
        locators.orgstart = orgrange.start;
      if (!orgrange.end.equals(range.end))
        locators.orgend = orgrange.end;

      var overlap = range.clone();
      if (overlap.start.compare(orgrange.start) > 0)
        overlap.start.assign(orgrange.start);
      if (overlap.end.compare(orgrange.end) < 0)
        overlap.end.assign(orgrange.end);

      this.el.value = getStructuredOuterHTML(overlap.getAncestorElement(), locators, true);
    }
    catch(e)
    {
      this.el.value = "Exception retrieving outerhtml " + e;
    }
  }
});

$wh.Rich.PathDebugger = new Class(
{ rte:null
, el: null
, initialize:function(rte,el)
  {
    this.rte = rte;
    this.el = $(el);
    this.rte.addEvent("statechange", this.onStateChange.bind(this))
  }
, onStateChange:function(event)
  {
    var nodepath = '';
    var curnode = this.rte.getSelectionRange().getAncestor();
    for(;curnode;curnode=curnode.parentNode)
      nodepath = curnode.nodeName + (nodepath == '' ? '':' > ' + nodepath)
    this.el.value = nodepath;
  }
});

$wh.Rich.PasteDebugger = new Class(
{ rte:null
, el: null
, initialize:function(rte,el)
  {
    this.rte = rte;
    this.el = $(el);
    this.rte.addEvent("prepaste", this.onPaste.bind(this))
  }
, onPaste:function(event)
  {
    console.log("paste event.content:", event.content);
    this.el.value = getStructuredOuterHTML(event.content, [], true);
  }
});

$wh.Rich.getAllLocatorsInNode = function(node)
{
  var list = [];
  if (node.nodeType == 3)
  {
    for (var i = 0; i <= node.nodeValue.length; ++i)
      list.push(new $wh.Rich.Locator(node, i));
  }
  else
  {
    if (node.nodeName && [ 'br', 'img' ].contains(node.nodeName.toLowerCase()))
      return list;

    for (var i = 0; i <= node.childNodes.length; ++i)
    {
      list.push(new $wh.Rich.Locator(node, i));
      if (node.childNodes[i])
        list = list.concat(this.getAllLocatorsInNode(node.childNodes[i]));
    }
  }
  return list;
}

$wh.Rich.cloneNodeWithTextQuotesAndMarkedLocators = function(node, locators)
{
  if (node.nodeType == 3)
  {
    var text = '"';
    for (var i = 0; i <= node.nodeValue.length; ++i)
    {
      for (var l = 0; l < locators.length; ++l)
        if (locators[l].element == node && locators[l].offset == i)
          text += '(*' + l + '*)';
      text += node.nodeValue.substr(i, 1);
    }
    return node.ownerDocument.createTextNode(text + '"');
  }

  var nodes = [];
  var copy = node.cloneNode(false);

  for (var i = 0; i <= node.childNodes.length; ++i)
  {
    for (var l = 0; l < locators.length; ++l)
      if (locators[l].element == node && locators[l].offset == i)
      {
        var text = '(*' + l + '*)';
        var textnode = node.ownerDocument.createTextNode(text);
        copy.appendChild(textnode);
      }
    var child = node.childNodes[i];
    if (child)
      copy.appendChild(this.cloneNodeWithTextQuotesAndMarkedLocators(child, locators));
  }

  return copy;
}



})(document.id); //end mootools wrapper
