/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.more.object.extras');
/*! REQUIRE: frameworks.mootools.more.object.extras
!*/

(function(){

var current = null,
        locales = {},
        inherits = {};

var getSet = function(set){
        if (instanceOf(set, Locale.Set)) return set;
        else return locales[set];
};

var Locale = this.Locale = {

        define: function(locale, set, key, value){
               var name;
               if (instanceOf(locale, Locale.Set)){
                      name = locale.name;
                      if (name) locales[name] = locale;
               } else {
                      name = locale;
                      if (!locales[name]) locales[name] = new Locale.Set(name);
                      locale = locales[name];
               }

               if (set) locale.define(set, key, value);



               if (!current) current = locale;

               return locale;
        },

        use: function(locale){
               locale = getSet(locale);

               if (locale){
                      current = locale;

                      this.fireEvent('change', locale);


               }

               return this;
        },

        getCurrent: function(){
               return current;
        },

        get: function(key, args){
               return (current) ? current.get(key, args) : '';
        },

        inherit: function(locale, inherits, set){
               locale = getSet(locale);

               if (locale) locale.inherit(inherits, set);
               return this;
        },

        list: function(){
               return Object.keys(locales);
        }

};

Object.append(Locale, new Events);

Locale.Set = new Class({

        sets: {},

        inherits: {
               locales: [],
               sets: {}
        },

        initialize: function(name){
               this.name = name || '';
        },

        define: function(set, key, value){
               var defineData = this.sets[set];
               if (!defineData) defineData = {};

               if (key){
                      if (typeOf(key) == 'object') defineData = Object.merge(defineData, key);
                      else defineData[key] = value;
               }
               this.sets[set] = defineData;

               return this;
        },

        get: function(key, args, _base){
               var value = Object.getFromPath(this.sets, key);
               if (value != null){
                      var type = typeOf(value);
                      if (type == 'function') value = value.apply(null, Array.from(args));
                      else if (type == 'object') value = Object.clone(value);
                      return value;
               }

               // get value of inherited locales
               var index = key.indexOf('.'),
                      set = index < 0 ? key : key.substr(0, index),
                      names = (this.inherits.sets[set] || []).combine(this.inherits.locales).include('en-US');
               if (!_base) _base = [];

               for (var i = 0, l = names.length; i < l; i++){
                      if (_base.contains(names[i])) continue;
                      _base.include(names[i]);

                      var locale = locales[names[i]];
                      if (!locale) continue;

                      value = locale.get(key, args, _base);
                      if (value != null) return value;
               }

               return '';
        },

        inherit: function(names, set){
               names = Array.from(names);

               if (set && !this.inherits.sets[set]) this.inherits.sets[set] = [];

               var l = names.length;
               while (l--) (set ? this.inherits.sets[set] : this.inherits.locales).unshift(names[l]);

               return this;
        }

});



})();

