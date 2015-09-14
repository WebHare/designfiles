/* generated from Designfiles Public by generate_data_designfles */
require ('wh.util.jstests');
require ('wh.rich.debug');
require ('wh.util.preloader');
/*! LOAD: wh.util.jstests, wh.rich.debug, wh.util.preloader !*/

function createRTEWaiter(doc, win,callback)
{
/*  //ADDME shouldn't abuse imageloader
  if (win.rte.editable)
    callback();
  else
    win.rte.addEvent('editable:once', callback);*/
  var toload = [win.rte];
  new $wh.Preloader(toload, {onComplete: createRTEWaiter2.bind(null, doc, win, callback)});
}

function createRTEWaiter2(doc, win,callback)
{
  var toload=[];
  Array.each(win.rte.getBody().parentNode.getElementsByTagName("link"),
    function(node)
    {
      if (node.rel=="stylesheet")
        toload.push(new $wh.PreloadableImage(node.href, {autoload:true}));
    });

  new $wh.Preloader(toload, {onComplete:callback});
}
function createRTEEditableWaiter(doc, win, callback)
{
  if (win.rte.editable)
    callback();
  win.rte.addEvent('editable:once', callback);
}
function gettextchild(node)
{
  while(node&&node.nodeType != 3)
    node=node.firstChild;
  return node;
}
function RunIteratorOnRange(win,range)
{
  var itr = new win.$wh.Rich.RangeIterator(range);
  var list = [];

  while (!itr.atEnd())
  {
    var name = itr.node.nodeType == 3 ? '#text: ' + itr.node.nodeValue : itr.node.nodeName.toLowerCase();
    list.push(name);
    itr.nextRecursive();
  }

  return list;
}

function RunIteratorOnRange2(win,range)
{
  var itr = new win.$wh.Rich.RangeIterator2(range);
  var list = [];

  while (!itr.atEnd())
  {
    var name = itr.node.nodeType == 3 ? '#text: ' + itr.node.nodeValue : itr.node.nodeName.toLowerCase();
    list.push(name);
    itr.nextRecursive();
  }

  return list;
}

function getRTESelection(win, rte)
{
  return rte.getSelectionRange().toDOMRange();
}

function setRTESelection(win, rte, domrange)
{
  rte.selectRange(win.$wh.Rich.Range.fromDOMRange(domrange));
}


function hasAttribute(node, name)
{
  for(var i=0;i<node.attributes.length;++i)
    if(node.attributes[i].nodeName==name)
      return true;
  return false;
}
function getCompStyle(node, prop)
{
  if(node.currentStyle)
    return node.currentStyle[prop];
  return node.ownerDocument.defaultView.getComputedStyle(node).getPropertyValue(prop);
}

function testEqHTMLEx(win, expect, node, locators)
{
  var actual = win.$wh.Rich.cloneNodeWithTextQuotesAndMarkedLocators(node, locators || []).innerHTML;
  testEqHTML(expect, actual);
}

function testEqSelHTMLEx(win, expect)
{
  testEqSelHTMLEx2(win, win.rte.getEditor(), expect);
}
function testEqSelHTMLEx2(win, rte, expect)
{
  var range = rte.getSelectionRange();
  testEqHTMLEx(win, expect, rte.getContentBodyNode(), [ range.start, range.end ]);
}

function setRawStructuredContent(win, structuredhtml)
{
  setStructuredContent(win, structuredhtml, true);
}

function setStructuredContent(win, structuredhtml, raw)
{
   var rte=win.rte.getEditor();
  if (raw)
    rte.setContentsHTMLRaw(structuredhtml);
  else
    rte.setContentsHTML(structuredhtml);

  var locators = $wh.Rich.unstructureDom(win, rte.getContentBodyNode());
  testEqHTMLEx(win, structuredhtml, rte.getContentBodyNode(), locators);

  if (locators[0])
  {
    if (locators[1])
      rte.selectRange(new win.$wh.Rich.Range(locators[0], locators[1]));
    else
      rte.setCursorAtLocator(locators[0]);
  }
  else // Must set selection because of our unstructuredom manipulations
    rte.setCursorAtLocator(new win.$wh.Rich.Locator(rte.getContentBodyNode()));

  return locators;
}

function getRawHTMLTextArea(win)
{
  var ta = testapi.compByName('code').getElement('textarea');
  return ta;
}

function getRawHTMLCode(win)
{
  var code = getRawHTMLTextArea(win).value;
  code=code.split('\n').join('').split('</html>')[0]; //strip comments behind the </html>
  return code;
}
function getRTE(win,toddname)
{
  var comp = testapi.compByName(toddname);
  if (!comp)
    throw new Error("No such component with name '" + toddname + "' in screen '" + win + "'");
  return comp.retrieve("todd-rte");
}
