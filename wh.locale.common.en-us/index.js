/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools.more.locale');
require ('../frameworks.mootools.more.locale.en-us.date');
/*! LOAD: frameworks.mootools.more.locale, frameworks.mootools.more.locale.en-us.date
!*/

//Follow/sync with tollium common structure wherever possible, so we can perhaps one day join them!
Locale.define('en-US', 'wh-common',
  { buttons: { "add": 'Add'
             , "apply": 'Apply'
             , "cancel": 'Cancel'
             , "clear": 'Clear'
             , "close": 'Close'
             , "delete": 'Delete'
             , "download": 'Download'
             , "edit": 'Edit'
             , "export": 'Export'
             , "finish": 'Finish'
             , "import": 'Import'
             , "next": 'Next'
             , "no": 'No'
             , "ok": 'OK'
             , "previous": 'Previous'
             , "print": 'Print'
             , "replace": 'Replace'
             , "save": 'Save'
             , "search": 'Search'
             , "yes": 'Yes'
             , "none": "None"
             , "today": "Today"
             , "yestoall": 'Yes to All'
             }
  , form: { 'invalid_videocode': 'The entered URL or HTML code was not recognized as an embeddable video' }
  , videopopup: { 'insertcode': "Enter a URL or HTML embed code referring to the video you want to include "
                , 'submitcode': "Embed video"
                }
  , authentication: { 'loginfail': 'The specified login data is incorrect.'
                    , 'loginerror': 'An error has occurred.'
                    }
 });

//FIXME Integrate into common texts

Locale.define('en-US', 'wh-form', {
  required_field: "This field is required"
, invalid_email: "Invalid e-mail address"
, invalid_zip: "Please check the zip code"
, invalid_housenumber: "Please check the house number"
, invalid_ziphousenumber: "This combination of zip code and house number does not exist"
, invalid_date: "Invalid date"
, invalid_iban: "Invalid IBAN account number"
, passwordnotstrongenough: "Password is nog strong enough"

, invalid_row: function(rownum)
  {
    return "Row #" + rownum + " is incorrect";
  }
, checkboxgroup_minselected: function(min)
  {
    return "Please select at least " + (min > 1 ? min + " options" : "1 option");
  }
, checkboxgroup_maxselected: function(max)
  {
    return "Please select at most " + (max > 1 ? max + " options" : "1 option");
  }

, password: { "tooshort": "too short"
            , "rating-0": "very weak"
            , "rating-1": "weak"
            , "rating-2": "reasonable"
            , "rating-3": "great"
            , "rating-4": "excellent"
            }
, out_of_range_min: "Input value is to low"
, out_of_range_max: "Input value is to high"
, invalid_date_after: function(min)
  {
    return "The value of this field has to be later than " + min;
  }
, invalid_date_before: function(max)
  {
    return "The value of this field has to be at or before " + max;
  }
, rpcfailure: "Something went wrong, please try again later"
});
