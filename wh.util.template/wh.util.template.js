/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
require ('wh.compat.dom');
/*! LOAD: wh.compat.base, wh.compat.dom !*/

(function($) { //mootools wrapper

var nativesupport = false;

// IE compatibility code

function cloneDeep(node, appendto)
{
  for(node=node.firstChild;node;node=node.nextSibling)
  {
    var clone = node.cloneNode(false);
    cloneDeep(node, clone);
    appendto.appendChild(clone);
  }
}

function getContent()
{
  var frag = this.ownerDocument.createDocumentFragment();
  cloneDeep(this, frag);
  return frag;
}

if(!('content' in document.createElement("template")))
{
  window.addEvent("domready",function()
  {
    $$('template').each(function(templatenode)
    {
      if(templatenode.getStyle("display")!="none")
        console.warn("The stylesheet should reset the template element to {display:none}");
      Object.defineProperty(templatenode, "content", { get: getContent });
    })
  })
}
else
{
  nativesupport = true;
}

function decodeSets(instr, data)
{
  if(instr==="this")
    return data;
  if(typeof instr == "string")
    return data[instr];

  var retval = {};
  Object.each(instr, function(val, key)
  {
    var subval = decodeSets(val, data);
    if(subval == undefined)
      return;
    retval[key] = subval;
  }.bind(this));
  return retval;
}

$wh.expandTemplateContent = function(clonednode, data, __originalbasenode) //originalbasenode is not an official parameter
{
  if(! ("rangestart" in clonednode)) //receiving direct node
  {
    if($wh.debug.tpl)
      console.log("[tpl] Instantiating node", __originalbasenode || clonednode,"with",data);
    expandNode(data, clonednode);
  }
  else
  {
    var next;
    if($wh.debug.tpl)
      if(__originalbasenode)
        console.log("[tpl] Instantiating node",__originalbasenode,"with",data);
      else if(clonednode.rangelimit)
        console.log("[tpl] Instantiating range [",clonednode.rangestart,"-",clonednode.rangelimit,"[ with",data);
      else
        console.log("[tpl] Instantiating range [",clonednode.rangestart,"...] with",data);

    for(var node = clonednode.rangestart; node && node != clonednode.rangelimit; node = next)
    {
      next = node.nextSibling;
      expandNode(data,node);
    }
  }
}
function expandNode(data, node)
{
  if(node.hasAttribute)
  {
    if(node.hasAttribute('data-template-set'))
    {
      var instructions = JSON.parse(node.getAttribute("data-template-set"));
      var toset = decodeSets(instructions, data);
      if(toset.text) //apply with linefeeds
      {
        $wh.setTextWithLinefeeds(node, toset.text + '');//force to string incase of number
        delete toset.text;
      }
      node.set(toset);
      node.removeAttribute("data-template-set");
    }
    if(node.hasAttribute('data-template-if'))
    {
      var tocheck = node.getAttribute("data-template-if").split(" ");
      if(tocheck.some(function(field) { return field && !data[field]; }))
      {
        node.dispose();
        return;
      }
      else
        node.removeAttribute("data-template-if");
    }
    if(node.hasAttribute('data-template-store'))
    {
      var instructions = JSON.parse(node.getAttribute("data-template-store"));
      Object.each(decodeSets(instructions, data), function (value,key)
      {
        node.store(key, value);
      });
      node.removeAttribute("data-template-store");
    }
    if(node.hasAttribute('data-template-iterate'))
    {
      var list = data[node.getAttribute('data-template-iterate')];
      node.removeAttribute('data-template-iterate');

      var copies=[];
      Array.each(list, function(item)
      {
        var copy = node.cloneNode(true);
        expandNode(item, copy);
        while(copy.firstChild)
        {
          copies.push(copy.firstChild);
          copy.removeChild(copy.firstChild);
        }
      });
      node.empty();
      Array.each(copies, function(copy) { node.appendChild(copy); });
    }
  }

  var subnode = node.firstChild;
  while(subnode)
  {
    var nextnode = subnode.nextSibling;
    expandNode(data, subnode);
    subnode=nextnode;
  }

  if(node.hasAttribute && node.parentNode && node.hasAttribute('data-template-flatten'))
  {
    while(node.firstChild)
      node.parentNode.insertBefore(node.firstChild, node);
    node.parentNode.removeChild(node);
  }
}
$wh.importTemplate = function(doc, templatenode)
{
  return doc.importNode(templatenode.content, true);
}
$wh.instantiateTemplate = function(templatenode, data)
{
  var fragment = templatenode.ownerDocument.importNode(templatenode.content, true);
  $wh.expandTemplateContent({ rangestart: fragment.firstChild }, data, templatenode); //pass the original node for easier debugging
  return fragment;
}
$wh.expandTemplate = function(templatenode, data, options)
{
  if(data instanceof Array) //ADDME create one big fragment and insert in one chunk
  {
    Array.each(data, function(el) { $wh.expandTemplate(templatenode, el, options) });
    return;
  }

  var clone = templatenode.content.cloneNode(true);

  var range;
  if(options && options.injectinto)
  {
    beforemarker = options.injectinto.lastChild;
    options.injectinto.appendChild(clone);
    range = { rangestart: beforemarker ? beforemarker.nextSibling : options.injectinto.firstChild
            , rangelimit: beforemarker
            };
  }
  else
  {
    var beforemarker = templatenode.previousSibling;
    templatenode.parentNode.insertBefore(clone, templatenode);
    range = { rangestart: beforemarker ? beforemarker.nextSibling : templatenode.parentNode.firstChild
            , rangelimit: templatenode
            };
  }

  $wh.expandTemplateContent(range, data);
  //ADDME link using events?
  if($wh.applyReplaceableComponents)
    $wh.applyReplaceableComponents(range);
}

$wh.haveNativeTemplateSupport = function()
{
  return nativesupport;
}

})(document.id); //end mootools wrapper
