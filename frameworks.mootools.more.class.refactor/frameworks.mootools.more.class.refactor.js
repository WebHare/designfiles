/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
/*! REQUIRE: wh.compat.base !*/

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
*/

MooTools.More = {
        'version': '1.4.0.1',
        'build': 'a4244edf2aa97ac8a196fc96082dd35af1abab87'
};


/*
---

script: Class.Refactor.js

name: Class.Refactor

description: Extends a class onto itself with new property, preserving any items attached to the class's namespace.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Class
  - /MooTools.More

# Some modules declare themselves dependent on Class.Refactor
provides: [Class.refactor, Class.Refactor]

...
*/

Class.refactor = function(original, refactors){

        Object.each(refactors, function(item, name){
               var origin = original.prototype[name];
               origin = (origin && origin.$origin) || origin || function(){};
               original.implement(name, (typeof item == 'function') ? function(){
                      var old = this.previous;
                      this.previous = origin;
                      var value = item.apply(this, arguments);
                      this.previous = old;
                      return value;
               } : item);
        });

        return original;

};

