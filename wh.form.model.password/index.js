/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.form.model.base');
/*! LOAD: wh.form.model.base !*/

/***********************************************************

Rating is based on:
- variety: the larger the 'alphabet' (lowercase, uppercase, symbols...) the more each character counts
- length:  the longer the password the better
- common words: you get a penalty for using common (pass)words
- sequences:    you get a penalty for using sequences

- ADDME: je accountnaam / email als wachtwoord
- ADDME: detect sequences of repetitions within the password

Hints:
- it's better to combine several words than have a short complex password
  (see http://xkcd.com/936/)

NOTES:
- when using a common word, your score can go down while typing
- when using a sequence, you'll get progressively less score for each extra char which belongs to the longest sequence in the password

*/

(function($) { //mootools wrapper

$wh.PasswordStrengthCalculator = new Class(
{ Implements: [ Options, Events ] // FIXME: the indicator class should have Events, but implements doesn't work together with an extend??
, options: { debug:          false

           // Password handling (related to how your password is stored)
           , case_sensitive: true   // if we aren't case sensitive we should reward people for using both upper- & lowercase
           , trim:           true   // trim whitespace before doing any checks

           // Password (dis)approval settings
           , minrating:             0    // minimum rating
           , minlength:             0    // minimum amount of characters a password must be long
           , disallow_common_words: false// disallow a 100% match to one of the the common (pass)words
           , blacklist:             []   // string array of disallowed passwords (for example email adresses, first-/last-/full-name)
           , backgroundcolors:      ["#d01b03","#d01b03","#ff7b00","#41a200","#2f7301"]
           }

, common_words:
      [
      // source of these passwords:
      // Worst Passwords of 2012 (http://splashdata.com/press/pr121023.htm)
      "password"
      ,"123456"
      ,"12345678"
      ,"abc123"
      ,"qwerty"
      ,"monkey"
      ,"letmein"
      ,"dragon"
      ,"111111"
      ,"baseball"
      ,"iloveyou"
      ,"trustno1"
      ,"1234567"
      ,"sunshine"
      ,"master"
      ,"123123"
      ,"welcome"
      ,"shadow"
      ,"ashley"
      ,"football"
      ,"jesus"
      ,"michael"
      ,"ninja"
      ,"mustang"
      ,"password1"

      // Dutch
      ,"wachtwoord"
      ,"geheim"
      ]

, sequences:
      [ "abcdefghijklmnopqrstuvwxyz"
      , "§0123456789-="  // numberic / qwerty-keyboard row 1

      // keyboard with qwerty layout
      , "±!@#$%^&*()_+"  // row 1 (with shift)
      , "¡™£¢∞§¶•ªº–≠"   // row 1 (with alt)
      , "qwertyuiop[]"   // row 2
      , "asdfghjkl;'\\"  // row 3
      , "`zxcvbnm,./"    // row 4

      // keyboard with azerty layout
      , "²&é\"'(§è!çà)-"  // row 1 (with ?)
      , "azertyuiop^$"    // row 2
      , "qsdfghjklmùµ"    // row 3
      , "<wxcvbn,;:="     // row 4
      ]

, initialize: function(options)
  {
    this.setOptions(options);
  }

, getAnalysesSheet: function(password)
  {
    if (this.options.trim)
      password = password.trim();

    if (!this.options.case_sensitive)
      password = password.toLowerCase();

    var sheet = { allowed:              true

                , blacklisted:          false
                , tooshort:             false
                , toolowrating:         false

                , entropy:              0// this.calculateEntropy(password)
                , entropy_with_penalty: 0
                , sequences:            this.getSequences(password)
                , common_matches:       []
                };

    if (password.length < this.options.minlength)
    {
      sheet.allowed = false;
      sheet.tooshort = true;
    }

    if (password.length == 0)
      return sheet;

    // compare password against blacklist (either strings or input nodes)
    for (var idx = 0; idx < this.options.blacklist.length; idx++)
    {
      var blitem = this.options.blacklist[idx];
      if (typeof blitem == "string")
      {
        if (password == blitem)
        {
          sheet.allowed = false;
          sheet.blacklisted = true;
          break;
        }
      }
      else
      {
        // ADDME: check if node and tagName="INPUT"
        if (password == blitem.value)
        {
          sheet.allowed = false;
          sheet.blacklisted = true;
          break;
        }
      }
    }

    if (this.options.disallow_common_words && this.common_words.contains(password))
    {
      sheet.allowed = false;
      sheet.blacklisted = true;
    }

    var longest_common_word = 0;
    for(var idx = 0; idx < this.common_words.length; idx++)
    {
      var word = this.common_words[idx];
      if (password.indexOf(this.common_words[idx]) > -1)
      {
        sheet.common_matches.push( word );
        if (word.length > longest_common_word)
          longest_common_word = word.length;
      }
    }

    // find the longest sequence match
    var longest_sequence_match = 0;
    for (var idx = 0; idx < sheet.sequences.length; idx++)
    {
      var len = sheet.sequences[idx].match_string.length;
      if (len > longest_sequence_match)
        longest_sequence_match = len;
    }

    // for the penalty we count the longest matching sequence as being only half the value in entropy
    var alphabet_size = this.calculateAlphabetSize(password);
    sheet.entropy = password.length * Math.log(alphabet_size) / Math.log(2);

    // Calculate penalty for using a sequence
    var sequence_penalty = Math.max(longest_sequence_match - 4, longest_sequence_match / 2);

    // Calculate penalty for using common words
    var common_words_penalty = Math.max(longest_common_word - 4, longest_sequence_match / 2);

    // use the largest penalty
    var penalty = Math.max(sequence_penalty, common_words_penalty);
    sheet.entropy_with_penalty = (password.length - penalty) * Math.log(alphabet_size) / Math.log(2);


    sheet.rating = Math.min(sheet.entropy_with_penalty / 25, 4);

    if (sheet.rating < this.options.minrating)
    {
      sheet.allowed = false;
      sheet.toolowrating = true;
    }

    return sheet;
  }

, isAllowed:function() //minimally acceptable ?
  {
    return this.getAnalysesSheet().allowed;
  }

, getRating: function(password)
  {
    var sheet = this.getAnalysesSheet(password);

    if (this.options.debug)
      console.log(sheet);

    return sheet;
  }

  /** @short detect sequences of numbers, alphabet or order of keys on a keyboard
      @long sequences are detected whether they are ascending, descending or skip an X chars within the sequence.
            this function was written specifically for this password strenght indicator and not based on any known script.
  */
, getSequences: function(password)
  {
    if (this.options.trim)
      password = password.trim();

    // for detecting sequences we allready use lowercase, regardless of our this.options.case_insensitive setting
    password = password.toLowerCase();

    var found_sequences = [];

    var min_seq_nr = 3; // keep all occurences of X or longer consecutive chars from a known sequence

    var seqdeltas = [];
    for(var seqnr=0; seqnr<this.sequences.length; seqnr++)
    {
      seqdeltas.push( [] ); // debugging

      var currentseq = [];
      var currentseqstart = 1;
      var prevseqpos = -1;

      //console.log("Comparing to ", this.sequences[seqnr]);

      for(var cidx=0; cidx<password.length; cidx++)
      {
        var char = password.substr(cidx,1);
        var seqpos = this.sequences[seqnr].indexOf(char);

        var delta = 0;
        if (cidx > 0)
        {
          delta = seqpos - prevseqpos;

          //console.log(char, cidx, seqpos, delta);

          if (currentseq.length > 0)
          {
            if (delta != currentseq[currentseq.length-1] || seqpos == -1)
            {
              //console.log("Reached end of sequence in password");
              //console.log(currentseq);

              // not part of a sequence anymore
              if (currentseq.length >= min_seq_nr)
              {
                found_sequences.push({ matching_sequence: this.sequences[seqnr]
                                     , idx_start:         currentseqstart-1
                                     , idx_end:           cidx-1
                                     , match_string:      password.substring(currentseqstart-1, cidx)
                                     });
              }

              currentseqstart = cidx;
              currentseq = [];
            }
          }

          currentseq.push(delta)
          seqdeltas[seqnr].push(delta); // debugging
        }

        //console.log(char, cidx, seqpos, delta, currentseq);

        var prevseqpos = seqpos;
      }

      if (currentseq.length >= min_seq_nr)
      {
        found_sequences.push({ matching_sequence: this.sequences[seqnr]
                             , idx_start:         currentseqstart-1
                             , idx_end:           cidx-1
                             , match_string:      password.substring(currentseqstart-1, cidx)
                             });
      }
    }

    if (this.options.debug && found_sequences.length > 0)
    {
      console.group("Found sequences:");

      console.log(found_sequences);

      for(var idx = 0; idx < found_sequences.length; idx++)
        console.log(found_sequences[idx].match_string);

      console.groupEnd();
    }

    return found_sequences;
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // calculation from
  // http://blog.shay.co/password-entropy/
  // http://blog.shay.co/files/entropy.js
, calculateAlphabetSize: function(password)
  {
    var alphabet = 0, lower = false, upper = false, numbers = false, symbols1 = false, symbols2 = false, other = '', c;

    for(var i = 0; i < password.length; i++) {
      c = password[i];
      if(!lower && 'abcdefghijklmnopqrstuvwxyz'.indexOf(c) >= 0) {
        alphabet += 26;
        lower = true;
      }
      else if(!upper && 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(c) >= 0) {
        alphabet += 26;
        upper = true;
      }
      else if(!numbers && '0123456789'.indexOf(c) >= 0) {
        alphabet += 10;
        numbers = true;
      }
      else if(!symbols1 && '!@#$%^&*()'.indexOf(c) >= 0) {
        alphabet += 10;
        symbols1 = true;
      }
      else if(!symbols2 && '~`-_=+[]{}\\|;:\'",.<>?/'.indexOf(c) >= 0) {
        alphabet += 22;
        symbols2 = true;
      }
      else if(other.indexOf(c) === -1) {
        alphabet += 1;
        other += c;
      }
    }

    return alphabet;
  }

, calculateEntropy: function(password)
  {
    if(password.length === 0)
      return 0;

    var entropy = password.length * Math.log(this.calculateAlphabetSize(password)) / Math.log(2);
    return entropy;
    //return (Math.round(entropy * 100) / 100) + ' bits';
  }
//////////////////////////////////////////////////////////////////////////////////////////

});

$wh.PasswordStrengthIndicator = new Class(
{ Extends:    $wh.PasswordStrengthCalculator

, options:    { case_sensitive: true
              // zeer zwak / zwak / redelijk / goed / uitstekend
              , debug:     false
              }

, node:       null
, inputnode:  null
, lastinput:  ''

, initialize: function(node, inputnode, options)
  {
    this.node = $(node);
    this.node.addClass("wh-passwordstrength");
    this.inputnode = $(inputnode);
    this.setOptions(options);

    this.inputnode.addEvent("keyup", this.onInputChange.bind(this));
    this.inputnode.addEventListener("cut", this.delayedOnChange.bind(this), false);
    this.inputnode.addEventListener("paste", this.delayedOnChange.bind(this), false);
    this.inputnode.addEvent("blur", this.onInputChange.bind(this));

    this.onInputChange();
  }

, delayedOnChange: function()
  {
    // we don't need the pasted text, we need the full text,
    // so wait for the paste operation to complete and then use the new value
    this.onInputChange.delay(1,this);
  }

, onInputChange: function()
  {
    if(this.inputnode.value == this.lastinput)
      return;
    this.lastinput = this.inputnode.value;

    if (this.inputnode.value == "")
    {
      this.node.setStyle("visibility", "hidden");
      this.inputnode.style.borderColor = "";
      return;
    }
    else
      this.node.setStyle("visibility", "visible");

    var scoresheet = this.getAnalysesSheet();
    var rating = Math.round(scoresheet.rating);

    //console.log(rating);
    this.node.set("text", scoresheet.tooshort ? Locale.get('wh-form.password.tooshort') : Locale.get('wh-form.password.rating-' + rating));

    var score = scoresheet.entropy_with_penalty;
    if (score > 75)
      score = 75;
    else if (score < 0)
      score = 0;

    this.node.style.backgroundColor = this.options.backgroundcolors[scoresheet.tooshort ? 0 : rating];

    //console.log(score);

/*
    //var bla = 120 * score / 75;
    var bla = 0.333333 * (Math.max(score - 25, 0)) / 75;
    var rgb = hslToRgb(bla, 1, 0.5);
    var colorstr =  "rgb("+Math.round(rgb[0])+","+Math.round(rgb[1])+","+Math.round(rgb[2])+")";
    //console.log(bla, rgb, colorstr);
    this.node.style.backgroundColor = colorstr;
    this.inputnode.style.borderColor = colorstr;
*/
    this.fireEvent("change", scoresheet);
  }

, getScore: function()
  {
    return this.getRating(this.inputnode.value);
  }

, getAnalysesSheet: function()
  {
    return this.parent(this.inputnode.value);
  }
});

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}
 */

$wh.Form.models["wh.password"] = new Class(
{ Extends: $wh.Form.InputFieldBase
, indicatornode: null
, indicator: null

, initialize:function(formhandler, node)
  {
    this.parent(formhandler,node);

    var opts = {};
    if(this.node.hasAttribute('data-minlength'))
      opts.minlength = this.node.getAttribute('data-minlength').toInt();

    if($wh.PasswordStrengthIndicator)
    {
      var fieldgroup = this.node.getParent(".fieldgroup");
      if(fieldgroup)
      {
        this.indicatornode = fieldgroup.getElement(".wh-passwordstrength");
        if(this.indicatornode)
        {
          opts.onChange = this.onPwdChange.bind(this);
          this.indicator = new $wh.PasswordStrengthIndicator(this.indicatornode, this.node, opts);
        }
      }
    }
  }
, onPwdChange:function()
  {
    this.setValidationStatus(null);
  }
, validate:function(value,issubmit)
  {
    var retval = this.parent(value);
    if(retval)
      return retval;
    if(this.indicator && !this.indicator.isAllowed()) //assume it has already reported the error
      return { error: Locale.get('wh-form.passwordnotstrongenough') };

    return null; //no further validation
  }
});

})(document.id);
