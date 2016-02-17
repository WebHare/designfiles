/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.rainbow.generic');
/*! LOAD: frameworks.rainbow.generic !*/
"use strict";

Rainbow.extend('harescript', [
    {
        'name': 'comment',
        'pattern': /\/\*[\s\S]*?\*\/|(\/\/)[\s\S]*?$/gm
    },
    {
        'matches': {
            1: [
                {
                    'name': 'keyword.operator',
                    'pattern': /\=|\+/g
                },
                {
                    'name': 'keyword.dot',
                    'pattern': /\./g
                }
            ],
            2: {
                'name': 'string',
                'matches': {
                    'name': 'constant.character.escape',
                    'pattern': /\\('|"){1}/g
                }
            }
        },
        'pattern': /(\(|\s|\[|\=|:|\+|\.|\{)(('|")([^\\\1]|\\.)*?(\3))/gm
    },
    {
        'name': 'comment',
        'pattern': /\/\*[\s\S]*?\*\//gm
    },
    {
        'matches': {
            1: 'constant.numeric',
            2: 'keyword.unit'
        },
        'pattern': /(\d+)(px|cm|s|%)?/g
    },
    {
        'name': 'constant.numeric',
        'pattern': /\b(\d+(\.\d+)?(e(\+|\-)?\d+)?(f|d)?|0x[\da-f]+)\b/gi
    },
    {
        'matches': {
            1: 'vartype'
        },
        'pattern': /\b(Array|Variant|Boolean|String|Integer|Money|Float|Record|Blob|DateTime|Tablestring|Object)(?=\(|\b)/gi
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b(and|not|select|from|where|order by|group|having|array|as|b(ool(ean)?|reak)|c(ase|atch|har|lass|on(st|tinue))|d(ef|elete|o(uble)?)|e(cho|lse(if)?|xit|xtends|xcept)|f(inally|loat|or(each)?|unction)|global|if|import|int(eger)?|long|new|object|or|pr(int|ivate|otected)|public|update|false|true|loadlib|export|return|self|st(ring|ruct|atic)|switch|th(en|is|row)|try|(un)?signed|var|void|while)(?=\(|\b)/gi
    },
    {
        'name': 'keyword.operator',
        'pattern': /\+|:=|\!|\-|&(gt|lt|amp);|\||\*|\=/g
    },
    {
        'matches': {
            1: 'function.call.entity'
        },
        'pattern': /(\w+?)(?=\()/g
    },
    {
        'matches': {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        'pattern': /(function)\s(.*?)(?=\()/g
    },
    {
        'matches': {
            1: 'storage.type',
            3: 'storage.type',
            4: 'entity.name.function'
        },
        'pattern': /\b((un)?signed|const)? ?(void|char|short|int|long|float|double)\*? +((\w+)(?= ?\())?/g
    },
    {
        'matches': {
            2: 'entity.name.function'
        },
        'pattern': /(\w|\*) +((\w+)(?= ?\())/g
    }

]);

Rainbow.extend('html', [
    {
        'name': 'source.harescript.embedded',
        'matches': {
            2: {
                'language': 'harescript'
            }
        },
        'pattern': /<\?wh([\s\S]*?)(\?>)/gm
    }
], true);
