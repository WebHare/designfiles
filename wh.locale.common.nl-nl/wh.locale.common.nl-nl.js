/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.more.locale');
require ('frameworks.mootools.more.locale.nl-nl.date');
/*! LOAD: frameworks.mootools.more.locale, frameworks.mootools.more.locale.nl-nl.date
!*/

//Follow/sync with tollium common structure wherever possible, so we can perhaps one day join them!
Locale.define('nl-NL', 'wh-common',
  { buttons: { "add": 'Toevoegen'
              , "apply": 'Toepassen'
              , "cancel": 'Annuleren'
              , "clear": 'Leegmaken'
              , "close": 'Sluiten'
              , "delete": 'Verwijderen'
              , "download": 'Downloaden'
              , "edit": 'Bewerken'
              , "export": 'Exporteren'
              , "finish": 'Voltooien'
              , "import": 'Importeren'
              , "next": 'Volgende'
              , "no": 'Nee'
              , "ok": 'OK'
              , "previous": 'Vorige'
              , "print": 'Printen'
              , "replace": 'Vervangen'
              , "save": 'Opslaan'
              , "search": 'Zoek'
              , "yes": 'Ja'
              , "none": "Geen"
              , "today": "Vandaag"
              , "yestoall": 'Ja op alles'
              }
  , form: { 'invalid_videocode': 'De opgegeven URL of HTML code is niet herkend als een invoegbare video' }
  , videopopup: { 'insertcode': "Enter a URL or HTML embed code referring to the video you want to include "
                , 'submitcode': "Embed video"
                }
  , authentication: { 'loginfail': 'De opgegeven login gegevens zijn niet correct.'
                    , 'loginerror': 'Er is een fout opgetreden.'
                    }
  });

//FIXME Integrate wh-form into common texts

Locale.define('nl-NL', 'wh-form', {
  required_field: "Dit veld is verplicht"
, invalid_email: "Ongeldig e-mailadres"
, invalid_zip: "Controleer de postcode"
, invalid_housenumber: "Controleer het huisnummer"
, invalid_ziphousenumber: "Deze combinatie van postcode en huisnummer bestaat niet"
, invalid_date: "Ongeldige datum"
, invalid_iban: "Ongeldig IBAN rekeningnummer"
, invalid_url: "Ongeldige URL"
, passwordnotstrongenough: "Wachtwoord is niet sterk genoeg"
, invalid_row: function(rownum)
  {
    return "Rij #" + rownum + " is incorrect";
  }
, checkboxgroup_minselected: function(min)
  {
    return "Selecteer minimaal " + (min > 1 ? min + " opties" : "1 optie");
  }
, checkboxgroup_maxselected: function(max)
  {
    return "Selecteer maximaal " + (max > 1 ? max + " opties" : "1 optie");
  }

, password: { "tooshort": "te kort"
            , "rating-0": "zeer zwak"
            , "rating-1": "zwak"
            , "rating-2": "redelijk"
            , "rating-3": "sterk"
            , "rating-4": "zeer sterk"
            }
, out_of_range_min: "Ingevoerde waarde is te laag"
, out_of_range_max: "Ingevoerde waarde is te hoog"
, invalid_date_after: function(min)
  {
    return "Dit veld moet een datum na " + min + " bevatten";
  }
, invalid_date_before: function(max)
  {
    return "Dit veld moet een datum op of vóór " + max + " bevatten";
  }
, rpcfailure: "Er is iets misgegaan, probeer het later nog eens"
});
