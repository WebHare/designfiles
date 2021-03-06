/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
/*! REQUIRE: frameworks.mootools.core
!*/

// MooTools: the javascript framework.
// Load this file's selection again by visiting: http://mootools.net/more/5bc83678c5a8e36b4fb3f592c7b278e2
// Or build this file again with packager using: packager build More/Element.Measure
/*
---

script: More.js

name: More

description: MooTools More

license: MIT-style license

authors:
  - Guillermo Rauch
  - Thomas Aylott
  - Scott Kyle
  - Arian Stolwijk
  - Tim Wienk
  - Christoph Pojer
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/MooTools

provides: [MooTools.More]

...

MooTools.More = {
        'version': '1.4.0.1',
        'build': 'a4244edf2aa97ac8a196fc96082dd35af1abab87'
};
*/


/*
---

script: Element.Measure.js

name: Element.Measure

description: Extends the Element native object to include methods useful in measuring dimensions.

credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element.Style
  - Core/Element.Dimensions
  - /MooTools.More

provides: [Element.Measure]

...
*/

(function(){

var getStylesList = function(styles, planes){
        var list = [];
        Object.each(planes, function(directions){
               Object.each(directions, function(edge){
                      styles.each(function(style){
                             list.push(style + '-' + edge + (style == 'border' ? '-width' : ''));
                      });
               });
        });
        return list;
};

var calculateEdgeSize = function(edge, styles){
        var total = 0;
        Object.each(styles, function(value, style){
               if (style.test(edge)) total = total + value.toInt();
        });
        return total;
};

var isVisible = function(el){
        return !!(!el || el.offsetHeight || el.offsetWidth);
};


Element.implement({

        measure: function(fn){
               if (isVisible(this)) return fn.call(this);
               var parent = this.getParent(),
                      toMeasure = [];
               while (!isVisible(parent) && parent != document.body){
                      toMeasure.push(parent.expose());
                      parent = parent.getParent();
               }
               var restore = this.expose(),
                      result = fn.call(this);
               restore();
               toMeasure.each(function(restore){
                      restore();
               });
               return result;
        },

        expose: function(){
               if (this.getStyle('display') != 'none') return function(){};
               var before = this.style.cssText;
               this.setStyles({
                      display: 'block',
                      position: 'absolute',
                      visibility: 'hidden'
               });
               return function(){
                      this.style.cssText = before;
               }.bind(this);
        },

        getDimensions: function(options){
               options = Object.merge({computeSize: false}, options);
               var dim = {x: 0, y: 0};

               var getSize = function(el, options){
                      return (options.computeSize) ? el.getComputedSize(options) : el.getSize();
               };

               var parent = this.getParent('body');

               if (parent && this.getStyle('display') == 'none'){
                      dim = this.measure(function(){
                             return getSize(this, options);
                      });
               } else if (parent){
                      try { //safari sometimes crashes here, so catch it
                             dim = getSize(this, options);
                      }catch(e){}
               }

               return Object.append(dim, (dim.x || dim.x === 0) ? {
                             width: dim.x,
                             height: dim.y
                      } : {
                             x: dim.width,
                             y: dim.height
                      }
               );
        },

        getComputedSize: function(options){


               options = Object.merge({
                      styles: ['padding','border'],
                      planes: {
                             height: ['top','bottom'],
                             width: ['left','right']
                      },
                      mode: 'both'
               }, options);

               var styles = {},
                      size = {width: 0, height: 0},
                      dimensions;

               if (options.mode == 'vertical'){
                      delete size.width;
                      delete options.planes.width;
               } else if (options.mode == 'horizontal'){
                      delete size.height;
                      delete options.planes.height;
               }

               getStylesList(options.styles, options.planes).each(function(style){
                      styles[style] = this.getStyle(style).toInt();
               }, this);

               Object.each(options.planes, function(edges, plane){

                      var capitalized = plane.capitalize(),
                             style = this.getStyle(plane);

                      if (style == 'auto' && !dimensions) dimensions = this.getDimensions();

                      style = styles[plane] = (style == 'auto') ? dimensions[plane] : style.toInt();
                      size['total' + capitalized] = style;

                      edges.each(function(edge){
                             var edgesize = calculateEdgeSize(edge, styles);
                             size['computed' + edge.capitalize()] = edgesize;
                             size['total' + capitalized] += edgesize;
                      });

               }, this);

               return Object.append(size, styles);
        }

});

})();

