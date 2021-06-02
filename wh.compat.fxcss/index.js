/* generated from Designfiles Public by generate_data_designfles */
/* Based on Fx.Css, https://github.com/tbela99/Fx.css
   Thierry Bela, MIT licensed */

!function (context) {
"use strict";

        var set = Element.prototype.setStyle,
               get = Element.prototype.getStyle,
               div = new Element('div'),
               prefixes = ['Khtml','O','Ms','Moz','Webkit'],
               cache = {};

        Element.implement({

               getPrefixed: function (prop) {

                      prop = prop.camelCase();

                      if(cache[prop] != undefined) return cache[prop];

                      cache[prop] = prop;

                      //return unprefixed property if supported. prefixed properties sometimes do not work fine (MozOpacity is an empty string in FF4)
                      if(!(prop in this.style)) {

                             var upper = prop.charAt(0).toUpperCase() + prop.slice(1);

                             for(var i = prefixes.length; i--;) if(prefixes[i] + upper in this.style) {

                                    cache[prop] = prefixes[i] + upper;
                                    break
                             }
                      }

                      return cache[prop]
               },

               setStyle: function (property, value) {

                      return set.call(this, this.getPrefixed(property), value);
               },
               getStyle: function (property) {

                      return get.call(this, this.getPrefixed(property));
               }
        })



        var div = new Element('div'),
               transition,
               prefix = Browser.safari || Browser.chrome || Browser.Platform.ios ? 'webkit' : (Browser.opera ? 'o' : (Browser.ie ? 'ms' : '')),
               prefixes = ['Khtml','O','Ms','Moz','Webkit'],
               cache = {};

        transition = div.getPrefixed('transition');

        //eventTypes
        ['transitionEnd' /*, 'transitionStart', 'animationStart', 'animationIteration', 'animationEnd' */].each(function(eventType) {

               Element.NativeEvents[eventType.toLowerCase()] = 2;

               var customType = eventType;

               if (prefix) customType = prefix + customType.capitalize();
               else customType = customType.toLowerCase();

               Element.NativeEvents[customType] = 2;
               Element.Events[eventType.toLowerCase()] = {base: customType }
        });

        //detect if transition property is supported
        Fx.css3Transition = (function (prop) {

               //
               if(prop in div.style) return true;

               var prefixes = ['Khtml','O','ms','Moz','Webkit'], i = prefixes.length, upper = prop.charAt(0).toUpperCase() + prop.slice(1);

               while(i--) if(prefixes[i] + upper in div.style) return true;

               return false
        })(transition);

        Fx.transitionTimings = {
               'ease': '.25,.1,.25,1',
               'ease:in': '.42,0,1,1',
               'ease:out': '0,0,.58,1',
               'ease:in:out': '.42,0,.58,1',
               'linear'		: '0,0,1,1',
               'expo:in'		: '.71,.01,.83,0',
               'expo:out'		: '.14,1,.32,.99',
               'expo:in:out'	: '.85,0,.15,1',
               'circ:in'		: '.34,0,.96,.23',
               'circ:out'		: '0,.5,.37,.98',
               'circ:in:out'	: '.88,.1,.12,.9',
               'sine:in'		: '.22,.04,.36,0',
               'sine:out'		: '.04,0,.5,1',
               'sine:in:out'	: '.37,.01,.63,1',
               'quad:in'		: '.14,.01,.49,0',
               'quad:out'		: '.01,0,.43,1',
               'quad:in:out'	: '.47,.04,.53,.96',
               'cubic:in'		: '.35,0,.65,0',
               'cubic:out'		: '.09,.25,.24,1',
               'cubic:in:out'	: '.66,0,.34,1',
               'quart:in'		: '.69,0,.76,.17',
               'quart:out'		: '.26,.96,.44,1',
               'quart:in:out'	: '.76,0,.24,1',
               'quint:in'		: '.64,0,.78,0',
               'quint:out'		: '.22,1,.35,1',
               'quint:in:out'	: '.9,0,.1,1'
        };

        //borderBottomLeftRadius

        context.FxCSS = {

               css: false,
               propRegExp: /([a-z]+)([A-Z][a-z]+)([A-Z].+)/,
               propRadiusRegExp: /([a-z]+)([A-Z][a-z]+)([A-Z][a-z]+)(Radius)/,
               initialize: function(element, options) {

                      this.element = this.subject = document.id(element);
                      this.transitionend = this.transitionend.bind(this);
                      this.parent(Object.append({transition: 'sine:in:out'}, options))
               },
               isRunning: function () { return this.css || this.parent() || false },
               checkTransition: function (style, keys) {

                      style = div.getPrefixed(style);

                      var index = keys.indexOf(style);

                      //is this browser extending shorthand properties ?
                      if(index == -1) {

                             if(this.propRadiusRegExp.test(style)) {

                                    var matches = this.propRadiusRegExp.exec(style);

                                    index = keys.indexOf(matches[1] + matches[4]);

                                    if(index != -1) {

                                           keys.splice(index, 1);
                                           keys.append(['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].
                                                  map(function (prop) { return matches[1] + prop + matches[4] }));

                                           index = keys.indexOf(style)
                                    }
                             }
                             else if(this.propRegExp.test(style)) {

                                    var matches = this.propRegExp.exec(style);

                                    index = keys.indexOf(matches[1] + matches[3]);

                                    if(index != -1) {

                                           keys.splice(index, 1);
                                           keys.append(['Left', 'Top', 'Right', 'Bottom'].
                                                  map(function (prop) { return matches[1] + prop + matches[3] }));

                                           index = keys.indexOf(style)
                                    }
                             }
                      }

                      if(index != -1) keys.splice(index, 1);

                      return keys.length == 0
               },
               transitionend: function (e) {

                      if(this.checkTransition(e.event.propertyName, this.keys)) {

                             this.subject.removeEvent('transitionend', this.transitionend).style[transition] = '';
                             this.stop()
                      }
               },
               stop: function () {

                      if(this.css) {

                             this.css = false;
                             this.fireEvent('complete', this.subject);

                             if(!this.callChain()) this.fireEvent('chainComplete', this.subject);

                             return this
                      }

                      return this.parent()
               },
               cancel: function() {

                      if (this.css) {

                             this.css = false;
                             Array.from(this.subject).each(function (element) { element.removeEvents('transitionend').style[transition] = '' }, this);

                             return this.fireEvent('cancel', this.subject).clearChain();
                      }

                      return this.parent()
               }
        }


        Fx.Tween.implement(Object.append({

        start: function(property, from, to) {

               var args = Array.slice(arguments),
                      element = this.element,
                      css = ' ' + this.options.duration + 'ms cubic-bezier(' + Fx.transitionTimings[this.options.transition] + ')',
                      parsed;

               property = this.options.property || args.shift();

               if (!this.check(property, from, to)) return this;

               this.css = typeof this.options.transition == 'string' && Fx.transitionTimings[this.options.transition] && Fx.css3Transition;
               this.property = property;

               this.keys = [element.getPrefixed(property)];

               parsed = this.prepare(element, property, args);

               if(this.css && this.options.usefxcss) {

                      to = Array.flatten(Array.from(parsed.to))[0];
                      from = Array.flatten(Array.from(parsed.from))[0];

                      from = from.parser.serve(from.value);
                      to = to.parser.serve(to.value);

                      element.setStyle('transition', 'none');
                      if(args[1] != undefined) element.setStyle(property, from);

                      element.setStyle('transition', this.keys.map(function (prop) { return element.getPrefixed(prop).hyphenate() + css }).join()).
                                                  addEvent('transitionend', this.transitionend).
                                                  setStyle(property, to);

                      if(from == to || ['', 'transparent', 'auto', 'none'].indexOf(from) != -1) this.stop();

                      return this
               }

               return this.parent(parsed.from, parsed.to);
        }

        }, FxCSS))

        Fx.CSS.implement({

               compute: function(from, to, delta) {

                      var computed = [];

                      from = Array.from(from);
                      to = Array.from(to);

                      (Math.min(from.length, to.length)).times(function(i){

                             computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
                      });
                      computed.$family = Function.from('fx:css:value');
                      return computed;
               },

               prepare: function(element, property, values) {

                      values = Array.from(values);

                      if (values[1] == null){

                             values[1] = values[0];
                             values[0] = element.getStyle(property);
                      }

                      var parser, parsed;

                      if(property.test(/^((Moz|Webkit|Ms|O|Khtml)T|t)ransform/)) {

                             parser = Fx.CSS.Parsers.Transform;
                             parsed = values.map(function (value) { return {value: parser.parse(value), parser: parser} })
                      }

                      else parsed = values.map(this.parse);

                      return {from: parsed[0], to: parsed[1]};
               }
        });

var deg = ['skew', 'rotate'],
        px = ['translate'],
        generics = ['scale'],
        coordinates = ['X', 'Y', 'Z'],
        number = '\\s*([-+]?([0-9]*\.)?[0-9]+(e[+-]?[0-9]+)?)',
        degunit = 'deg|rad',
        pxunit = 'px|%';

        px = px.concat(coordinates.map(function (side) { return px[0] + side }));
        generics = generics.concat(coordinates.map(function (side) { return generics[0] + side }));
        deg = deg.concat(coordinates.map(function (side) { return deg[0] + side })).concat(coordinates.map(function (side) { return deg[1] + side }));

        Object.append(Element.Styles, {

               rgba: 'rgba(@, @, @, @)',
               borderRadius: '@px @px @px @px',
               boxShadow: 'rgb(@, @, @) @px @px @px',
               textShadow: '@px @px @px rgb(@, @, @)'
        });

        Object.append(Element.ShortStyles, {

               borderTopLeftRadius: '@px',
               borderTopRightRadius: '@px',
               borderBottomLeftRadius: '@px',
               borderBottomRightRadius: '@px'
        });

        Object.append(Fx.CSS.Parsers, {

               Transform: {

                      parse: function(value){

                             if(!value) return false;

                             var transform = {},
                                    match;

                             if((match = value.match(new RegExp('translate3d\\((' + number + ')(' + pxunit + ')?\\s*,\\s*('+ number + ')(' + pxunit + ')?\\s*,\\s*(' + number + ')(' + pxunit + ')?\\s*\\)')))) {

                                    transform.translate3d = {value: [parseFloat(match[1]), parseFloat(match[6]), parseFloat(match[12])], unit: match[5] || match[7] || match[13] || ''}
                             }

                             if((match = value.match(new RegExp('rotate3d\\(\\s*(' + number + ')\\s*,\\s*('+ number + ')\\s*,\\s*(' + number + ')\\s*,\\s*(' + number + ')(' + degunit + ')?\\s*\\)')))) {

                                    transform.rotate3d = {value: [parseFloat(match[1]), parseFloat(match[5]), parseFloat(match[9]), parseFloat(match[13])], unit: match[17] || ''}
                             }

                             if(px.every(function (t) {

                                    if((match = value.match(new RegExp(t + '\\(' + number + '(' + pxunit + ')?\\s*(,' + number + '(' + pxunit + ')?\\s*)\\)', 'i')))) {

                                           var x = parseFloat(match[1]),
                                                  y = parseFloat(match[6]);

                                           //allow optional unit for 0
                                           if(!match[4] && x != 0) return false;

                                           if(match[5]) {

                                                  if(!match[9] && y != 0) return false;
                                                  transform[t] = {value: [x, y], unit: match[4] || ''}
                                           }

                                           else transform[t] = {value: x, unit: match[4] || ''}
                                    }

                                    else if((match = value.match(new RegExp(t + '\\(' + number + '(' + pxunit + ')?\\s*\\)', 'i')))) {

                                           var x = parseFloat(match[1]);

                                           //allow optional unit for 0
                                           if(!match[4] && x != 0) return false;

                                           transform[t] = {value: x, unit: match[4] || ''}
                                    }

                                    return true
                             }) &&

                             deg.every(function (t) {

                                    //1 - number
                                    //4 - unit
                                    //5 - number defined
                                    //6 - number
                                    //9 - unit
                                    if((match = value.match(new RegExp(t + '\\(' + number + '(' + degunit + ')?\\s*(,' + number + '(' + degunit + ')?)\\s*\\)')))) {

                                           var x = parseFloat(match[1]),
                                                  y = parseFloat(match[6]);

                                           //allow optional unit for 0
                                           if(!match[4] && x != 0) return false;

                                           if(match[5]) {

                                                  if(!match[9] && y != 0) return false;
                                                  transform[t] = {value: [parseFloat(match[1]), parseFloat(match[6])], unit: match[5]}
                                           }

                                           else transform[t] = {value: parseFloat(match[1]), unit: match[4]}
                                    }

                                    else if((match = value.match(new RegExp(t + '\\(' + number + '(' + degunit + ')?\\s*\\)')))) {

                                           var x = parseFloat(match[1]);

                                           //allow optional unit for 0
                                           if(!match[4] && x != 0) return false;

                                           transform[t] = {value: parseFloat(match[1]), unit: match[4] || ''}
                                    }

                                    return true
                             }) && generics.every(function (t) {

                                    if((match = value.match(new RegExp(t + '\\(\\s*(([0-9]*\\.)?[0-9]+)\\s*(,\\s*(([0-9]*\\.)?[0-9]+)\\s*)?\\)')))) {

                                           if(match[3]) transform[t] = [parseFloat(match[1]), parseFloat(match[4])];

                                           else transform[t] = parseFloat(match[1])
                                    }

                                    return true

                             })) return Object.getLength(transform) == 0 ? false : transform;

                             return false
                      },
                      compute: function(from, to, delta){

                             var computed = {};

                             Object.each(to, function (value, key) {

                                    if(value instanceof Array) {

                                           computed[key] = Array.from(from[key] == null ? value : Array.from(from[key])).map(function (val, index) {

                                                  return Fx.compute(val == null ? value[index] : val, value[index], delta)
                                           })
                                    }

                                    else computed[key] = Fx.compute(from[key] == null ? value : from[key], value, delta)
                             });

                             return computed
                      },
                      serve: function(transform){

                             var style = '';

                             deg.each(function (t) {

                                    if(transform[t] != null) {

                                           if(transform[t].value instanceof Array) style +=  t + '(' + transform[t].value.map(function (val) { return val + transform[t].unit }) + ') ';
                                           else style += t + '(' + transform[t].value + transform[t].unit + ') '
                                    }
                             });

                             px.each(function (t) {

                                    if(transform[t] != null) {

                                           style += t + '(' + Array.from(transform[t].value).map(function (value) { return value + transform[t].unit }) + ') '
                                    }
                             });

                             generics.each(function (t) { if(transform[t] != null) style += t + '(' + transform[t] + ') ' });

                             if(transform.translate3d) style += ' translate3d(' + transform.translate3d.value[0]+ transform + transform.translate3d.unit + ',' + transform.translate3d.value[1] +  + transform.translate3d.unit + ',' + transform.translate3d.value[2]+  + transform.translate3d.unit + ')';
                             if(transform.rotate3d) style += ' rotate3d(' + transform.rotate3d.value[0]+ ',' + transform.rotate3d.value[1]+ ',' + transform.rotate3d.value[2]+ ', ' + transform.rotate3d.value[4] + transform.rotate3d.unit + ')';

                             return style
                      }
               }
        })

}(this);
