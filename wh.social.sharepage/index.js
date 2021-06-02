/* generated from Designfiles Public by generate_data_designfles */
require ('.././sharepage.css');
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! LOAD: frameworks.mootools, wh.compat.base
!*/

/* DOM setup:

   - optionally use wh-general-sharepage to get generic styling
   - elements with class "wh-share" + attribute data-network automatically get share functionality
   - for supporting networks (twitter, pinterest and email), the title is read from the data-title attribute, the <og:title>
     tag or the <title> tag (whichever is found first)
   - for pinterest share, there has to be media to share, provided through the <og:image> tag, potentially overwritten by the
     data-media attribute
   - the data-nohash attribute can be used to strip any hash from the page location (i.e. to prevent the location hash from
     being shared)

   Without default styling:

     <span class="wh-share" data-network="<network>"></span>
     <span class="wh-share" data-network="<network>"></span>

   With default styling:

     <div class="wh-general-sharepage">
       <span class="wh-share share-<network>" data-network="<network>"></span>
       <span class="wh-share share-<network>" data-network="<network>"></span>
     </div>


   NOTE: Use wh-share, share without prefix is deprecated


   Supported networks:

   - email
   - facebook
   - googleplus
   - linkedin
   - twitter
   - pinterest
   - print
*/


(function($) { //mootools/scope wrapper
"use strict";

function onDomReady()
{
  $(document.body).addEvent("click:relay(.wh-share[data-network])", handlePageShare.bind(this));
  $(document.body).addEvent("click:relay(.share[data-network])", handlePageShare.bind(this)); // deprecated!
}

function handlePageShare(evt, networkelement)
{
  var networktype = networkelement.getAttribute("data-network");
  var link = networkelement.getAttribute("data-link") || location.href;
  if (networkelement.hasAttribute("data-nohash"))
    link = link.split("#")[0];

  switch (networktype)
  {
    case "facebook":
    {
      // Unfortunately Facebook removed support to pass an title, image, etc through the share page (you need to use wh.social.facebook for that)
      // https://developers.facebook.com/x/bugs/357750474364812/

      evt.stop();

      window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(link)
                , "wh_fbshare"
                , "width=845,height=347,menubar=no,location=no,status=no");
    } break;

    case "twitter":
    {
      // https://dev.twitter.com/web/tweet-button/web-intent

      evt.stop();

      var shareurl = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(link);

      var title = getTitle(networkelement);
      if (title != "")
        shareurl += "&text=" + encodeURIComponent(title);

      window.open(shareurl
                , "wh_twittershare"
                , "width=550,height=300,menubar=no,location=no,status=no");
    } break;

    case "googleplus":
    {
      // https://developers.google.com/+/web/share/#share-link

      evt.stop();

      window.open("https://plus.google.com/share?url=" + encodeURIComponent(link)
                , "wh_gplusshare"
                , "width=600,height=460,menubar=no,location=no,status=no");
    } break;

    case "linkedin":
    {
      // https://developer.linkedin.com/docs/share-on-linkedin

      evt.stop();

      var shareurl = "https://www.linkedin.com/shareArticle?url=" + encodeURIComponent(link);

      var title = getTitle(networkelement);
      if (title != "")
        shareurl += "&title=" + encodeURIComponent(title);

      window.open(shareurl
                , "wh_linkedinshare"
                , "width=600,height=700,menubar=no,location=no,status=no");
    } break;

    case "pinterest":
    {
      // https://developers.pinterest.com/pin_it/

      evt.stop();

      var media = networkelement.getAttribute("data-media");
      if (!media)
      {
        media = document.head.getElements('meta[property="og:image"]').pick();
        if (media)
          media = media.getAttribute("content");
      }
      if (media)
      {
        var shareurl = "https://www.pinterest.com/pin/create/button/?url=" + encodeURIComponent(link) + "&media=" + encodeURIComponent(media);

        var title = getTitle(networkelement);
        if (title != "")
          shareurl += "&description=" + encodeURIComponent(title);

          window.open(shareurl
                    , "wh_pinterestshare"
                    , "width=750,height=550,menubar=no,location=no,status=no");
      }
    } break;

    case "email":
    {
      // https://en.wikipedia.org/wiki/Mailto
      // http://www.ietf.org/rfc/rfc6068.txt

      evt.stop();

      var shareurl = "mailto:?body=" + encodeURIComponent(link);

      var title = getTitle(networkelement);
      if (title != "")
        shareurl += "&subject=" + encodeURIComponent(title);

      $wh.navigateTo(shareurl);
    } break;

    case "print":
    {
      evt.stop();
      window.print();
    }

    default:
    {
      console.error("No such network '" + networktype + "'");
    }
  }
}

function getTitle(networkelement)
{
  // find a title
  var title = "";

  // try data-title attribute (use hasAttribute, so it can be left empty to force no title)
  if (networkelement.hasAttribute("data-title"))
  {
    title = networkelement.getAttribute("data-title");
  }
  else
  {
    // try <og:title>
    var ogtitle = document.head.getElements('meta[property="og:title"]').pick();
    if (ogtitle)
    {
      title = ogtitle.getAttribute("content");
    }
    else
    {
      // try <title>
      var titleattr = document.head.getElements("title").pick();
      if (titleattr)
        title = titleattr.get("text");
    }
  }
  return title;
}

window.addEvent("domready", onDomReady);

})(document.id); //end mootools/scope wrapper

