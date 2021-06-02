/* generated from Designfiles Public by generate_data_designfles */
require ('../wh.ui.popup');
require ('../wh.media.embedvideo');
/*! LOAD: wh.ui.popup, wh.media.embedvideo !*/

(function($) { //mootools wrapper

/*
EXPERIMENTAL, API MAY STILL CHANGE

Examples:

var videodialog = new $wh.Popup.Video({ video: { network: "youtube", id: "Sk9ST8R2SDk" } });
var videodialog = new $wh.Popup.Video({ video: { network: "vimeo", id: "13890889" } });
var videodialog = new $wh.Popup.Video({ video: { network: "youku", id: "XNzk1MzU2ODQ4" } });

.data-popup-video -> the trigger for a popup
data-video=""
data-video-options=""
data-popup-options=""

*/

// ADDME: ability to use specific aspect ratio of a video (or attempt to deduce aspect ratio from width & height)
$wh.Popup.Video = new Class(
{ Extends: $wh.BasicPopup
, options:
    { video:          { network:   ""
                      , id:        ""
                      , starttime: null // start time in seconds
                      , endtime:   null // end time in seconds
                      }

    , video_playback: $wh.__defaultplaybackoptions

    , aspectratio:    "16:9" // FIXME: should be in video_playback ??
    }

, setOptions: function(options)
  {
    //this.parent(options);
    //console.log("Options before:", this.options);
    //console.log("Options to set:", options);

    var base_options = Object.clone(this.options);
    Object.merge(base_options, options);

    Object.merge(base_options, { video: this.options.video });
    Object.merge(base_options, { video_playback: this.options.video_playback });
    Object.merge(base_options.video, options.video);
    Object.merge(base_options.video_playback, options.video_playback);

    console.log("Merged options:", base_options);

    this.options = base_options;
  }

, initialize: function(options)
  {
    this.parent(null, options);

    this.nodes.container.addClass("wh-popup-video");

    this.setupVideoDOM();

    if (! (this.options.video && this.options.video.network && this.options.video.id))
    {
      console.error("$wh.Popup.Video required a video in options: { video: { network: \"...\", id: \"...\" } }.");
      return;
    }

//    if (this.options.show)
//      this.show();
  }

, setupVideoDOM: function()
  {
    //ifrm.setAttribute("allowTransparency", "true"); // IE shows an opaque background in the iframe without this
    var ifrm = $wh.__generateVideoNode(this.options.video, this.options.video_playback);
    this.nodes.body.appendChild(ifrm);
    this.nodes.frame = ifrm;
  }


/*
, onResize: function() // viewport/window resized
  {
    var sizes = this.updateSize();

    //console.info("Popup content size:", sizes);

    // ADDME: implement check whether the size has actually changed
    this.fireEvent("resize", sizes);
  }
*/



  ////////////////////////////////////////////////////
  //
  //  Public
  //

  /*
  ADDME: allow setting a new video
, setOptions: function()
  {

  }

, stop: function()
  {

  }

, play: function()
  {

  }
  */

, show: function()
  {
/*
    // if there's no frame (possible due to keep_frame_alive set to false;, recreate the WebViewer DOM)
    if (!this.nodes.frame)
      this.setupWebViewerDOM();
*/
    this.parent();
  }


  // override resize handler for video's
, updateSize: function()
  {
    // check if automatic sizing using an aspect ratio has been disabled
    if (["", null].contains(this.options.aspectratio))
    {
      this.parent(); // use default popup resizing code
      return;
    }

    var sizedata = this.calculateSizeInformation();
    var sizenode = sizedata.sizenode;

    if (this.options.debug)
      console.log(sizedata);

    var width = sizedata.available_width;

    if (this.options.maxwidth > 0 && width > this.options.maxwidth)
      width = this.options.maxwidth;

    if (this.options.minwidth > 0 && width < this.options.minwidth)
      width = this.options.minwidth;


    var height = sizedata.available_height;

    if (this.options.maxheight && height > this.options.maxheight)
      height = this.options.maxheight;

    if (this.options.minheight && height < this.options.minheight)
      height = this.options.minheight;



    var contentmaxwidth = width - sizedata.widthpad;
    var contentmaxheight = height - sizedata.heightpad;

    // We use the max room available for content to determine the size of the video display
    var ratio = this.options.aspectratio.split(":");
    var coords = $wh.getCoverCoordinates(ratio[0], ratio[1], contentmaxwidth, contentmaxheight, true);

    var contentwidth = coords.width;
    var contentheight = coords.height;


    if (this.options.debug)
    {
      console.log({ contentmaxwidth: contentmaxwidth
                  , contentmaxheight: contentmaxheight
                  , coords: coords
                  , contentwidth: contentwidth
                  , contentheight: contentheight
                  });
    }

    this.nodes.body.setStyle("width", contentwidth);
    this.nodes.body.setStyle("height", contentheight);

    //this.nodes.chrome.setStyle("width", width); // "max" always sized using the chrome
    //this.nodes.chrome.setStyle("height", height);
  }


  ////////////////////////////////////////////////////
  //
  //  Private / Event handling
  //

, onHideCompleted: function()
  {
    this.parent();

    //if (!this.options.keep_frame_alive)
    //{
      this.nodes.innerHTML = ""; // I think this was needed for IE8 to kill Flash ??
      this.nodes.frame.parentNode.removeChild(this.nodes.frame);
      this.nodes.frame = null;
    //}
  }
});


$wh.Popup.__activateVideoPopup = function(evt, element)
{
  evt.stop();

  // FIXME: perhaps not support data-popup-options here and have
  //        a definitions list (based on CSS queries) with popups which have special options
  var options = $wh.PopupManager.__computePopupOptions(element, {}, "data-popup-options");
  console.log(options);

  options.video = $wh.getJSONAttribute(element, "data-video");
  console.log(options.video);

  // ADDME: nothing done with these settings yet
  options.video_playback = $wh.getJSONAttribute(element, "data-video-options");
  console.log(options.video_playback);

  //Object.append(popup_options, video_options);

  console.log(options);

  //var popupid = element.getAttribute("data-popup");
  //this.createFromElement(popupid);
  var videopopup = new $wh.Popup.Video(options);
}


function setupVideoPopup()
{
  $(window).addEvent("click:relay([data-popup-video])", $wh.Popup.__activateVideoPopup.bind(this));
}




$(window).addEvent('domready', setupVideoPopup );



})(document.id); //end mootools wrapper
