/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.more.locale');
require ('frameworks.mootools.more.locale.en-us.date');
/*! LOAD: frameworks.mootools.more.locale, frameworks.mootools.more.locale.en-us.date
!*/

//Follow/sync with tollium common structure wherever possible, so we can perhaps one day join them!
Locale.define('de-DE', 'wh-common',
  { buttons: { "add": 'Hinzufügen'
             , "apply": 'Übernehmen'
             , "cancel": 'Abbrechen'
             , "clear": 'löschen'
             , "close": 'Schließen'
             , "delete": 'Löschen'
             , "download": 'Download'
             , "edit": 'Bearbeiten'
             , "export": 'Exportieren'
             , "finish": 'Beenden'
             , "import": 'Importieren'
             , "next": 'Nächste'
             , "no": 'Nein'
             , "ok": 'OK'
             , "previous": 'Zurück'
             , "print": 'Drucken'
             , "replace": 'Ersetzen'
             , "save": 'Speichern'
             , "search": 'Suchen'
             , "yes": 'Ja'
             , "none": "Keine"
             , "today": "Heute"
             , "yestoall": 'Ja (alle)'
             }
  , form: { 'invalid_videocode': 'Die URL oder HTML-Embed-Code wurdie nicht als Video erkannt' }
  , videopopup: { 'insertcode': "Geben Sie eine URL oder HTML-Embed-Code, die auf das Video, das Sie aufnehmen möchten bezieht"
                , 'submitcode': "Video einbetten"
                }
  , authentication: { 'loginfail': 'Die angegebenen Login-Daten stimmen leider nicht.'
                    , 'loginerror': 'Es war ein Fehler aufgetreten.'
                    }
 });

//FIXME Integrate into common texts

Locale.define('en-US', 'wh-form', {
  required_field: "Pflichtfeld"
, invalid_email: "Ungültige Emailadresse"
, invalid_zip: "Bitte die Postleitzahl kontrollieren"
, invalid_housenumber: "Bitte die Hausnummer kontrollieren"
, invalid_ziphousenumber: "Kombination Hausnummer/Postleitzahl existiert nicht"
, invalid_date: "Ungültiges Datum"
, invalid_iban: "Ungültige IBAN-Kontonummer"
, passwordnotstrongenough: "Passwort ist nicht stark genug"

, invalid_row: function(rownum)
  {
    return "Reihe #" + rownum + " ist nicht korrekt";
  }
, checkboxgroup_minselected: function(min)
  {
    return "Bitte wähle minimal " + (min > 1 ? min + " Optionen aus" : "eine Option aus");
  }
, checkboxgroup_maxselected: function(max)
  {
    return "Bitte wähle maximal " + (max > 1 ? max + " Optionen aus" : "eine Option aus");
  }

, password: { "tooshort": "Zu kurz"
            , "rating-0": "Sehr schwach"
            , "rating-1": "Schwach"
            , "rating-2": "Akzeptabel"
            , "rating-3": "Stark"
            , "rating-4": "Sehr stark"
            }
, out_of_range_min: "Eingabewert zu niedrig"
, out_of_range_max: "Eingabewert zu hoch"
, invalid_date_after: function(min)
  {
    return "Dieses Feld muss sein Datum befassen nach dem " + min;
  }
, invalid_date_before: function(max)
  {
    return "Dieses Feld muss ein Datum haben das vor dem " + max + " liegt";
  }
, rpcfailure: "Something went wrong, please try again later"
});
