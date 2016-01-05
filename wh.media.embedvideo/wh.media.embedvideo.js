/* generated from Designfiles Public by generate_data_designfles */
require ('./embedvideo.css');
require ('wh.compat.base');
require ('wh.ui.base');
/*! LOAD: wh.compat.base, wh.ui.base !*/

(function($) { //mootools wrapper

var default_video_playback = { autoplay: false
                             , controls: true  // use the controls the video networks provide
                             , loop:     false // only supported in Vimeo
                             };

/** @short generate a video player to play the specified video with the specified settings
    @cell video
    @cell video.network
    @cell video.id
    @cell playback
    @cell playback.autoplay
    @cell playback.start
    @cell playback.end
    @cell playback.controls
    @cell playback.loop
    @cell playback.interactive make sure that we can control (ADDME)

*/
function generateVideoNode(video, playback)
{
  //<iframe width="560" height="315" src="//www.youtube.com/embed/Sk9ST8R2SDk" frameborder="0" allowfullscreen></iframe>
  var ifrm = document.createElement("iframe");
  ifrm.style.width = "100%";
  ifrm.style.height = "100%";
  ifrm.setAttribute("frameborder", 0);
  ifrm.setAttribute("allowfullscreen", "");

  playback = Object.merge(default_video_playback, playback);

  switch(video.network)
  {
    case "youtube":

        // https://developers.google.com/youtube/player_parameters
        var args = [];
        args.push("autoplay=" + (playback.autoplay ? "1" : "0") );

        if (video.starttime)
          args.push("start="+Math.floor(video.starttime)); // seconds, whole integer (YouTube also uses t= in the shorturl??)

        if (video.endtime)
          args.push("end="+Math.floor(video.endtime));

        if (!playback.controls)
          args.push("controls=0");

        if (playback.loop)
        {
          // from the documentation:
          // 'Currently, the loop parameter only works in the AS3 player when used in conjunction with the playlist parameter.'
          console.warn("We don't support loop for YouTube (because it only works in the flashplayer with playlists");
          //args.push("loop=1");
        }

        args.push("rel=0"); // disable 'related video's'

        args.push("enablejsapi=1");

        // ADDME: playsinline parameter for inline or fullscreen playback on iOS
        /*
        YouTube
        -   start=
          & end=
          & controls=0

          & modestbranding=0
          & rel=0
          & showinfo=0
        */

        var youtube_url = "//www.youtube.com/embed/" + video.id;
        if (args.length > 0)
          youtube_url += "?" + args.join("&");

        ifrm.src = youtube_url;
        break;

    case "vimeo":

        // http://developer.vimeo.com/player/embedding
        var args = [];
        args.push("autoplay=" + (playback.autoplay ? "1" : "0") );

        if (video.endtime)
          console.warn("setting an endtime doesn't work for Vimeo video's");

        if (!playback.controls)
          console.warn("disabling video controls not possible for Vimeo video's");

        if (playback.loop)
          args.push("loop=1");

        var vimeo_url = "//player.vimeo.com/video/" + video.id;
        if (args.length > 0)
          vimeo_url += "?" + args.join("&");

        if (video.starttime)
        {
          // #t=3m28s
          var t = video.starttime;
          var minutes = Math.floor(t / 60);
          var seconds = t % 60;
          vimeo_url += "#t=" + minutes + "m" + seconds + "s";
        }

        ifrm.src = vimeo_url;
        break;

    case "youku":
        // FIXME: autoplay only available in Flash embed version?

        /*
        http://www.360doc.com/content/10/1120/13/96119_70912265.shtml
        http://pastebin.com/JEq23NM5
        */
        var args = [];
        if (playback.autoplay)
          args.push("isAutoPlay=true");

        if (video.starttime)
          console.warn("starttime not supported by Youku ??")
        //  args.push("firsttime=" + Math.floor(video.starttime));

        if (video.endtime)
          console.warn("endtime not supported by Youku ??")

        if (!playback.controls)
          console.warn("disabling video controls not possible for Youku video's ??");

        if (playback.loop)
          console.warn("loop not supported for Youku")
          //args.push("isLoop=true"); // FIXME: should this work???

        // FIXME: The iframe embed doesn't seem to support passing options??
        //ifrm.src = "//player.youku.com/embed/" + video.id;

        args.push("showAd=0");
        args.push("isShowRelatedVideo=false"); // disable 'related video's'

        var youku_url = "http://player.youku.com/player.php/sid/" + video.id + "/v.swf";
        if (args.length > 0)
          youku_url += "?" + args.join("&");

        ifrm.src = youku_url;
        break;

    default:
        console.error("Unknown video type");
        break;
  }
  return ifrm;
}

/** pause any YouTube or Vimeo movie within the specified DOM
    NOTE: YouTube will only react if ?enablejsapi=1 was specified
*/
$wh.pauseVideosWithin = function(node)
{
  var iframes = node.querySelectorAll("iframe");
  for (var idx = 0; idx < iframes.length; idx++)
  {
    var iframe = iframes[idx];

    var parser = document.createElement("a");
    parser.href = iframe.src;

    if (parser.hostname.substr(parser.hostname.length - 11) == "youtube.com")
    {
      // Officially the YouTube iframe API must be used
      // But it requires you to dynamically create a video and we have to wait for the API to have been loaded/ready.
      //
      //http://stackoverflow.com/questions/7443578/youtube-iframe-api-how-do-i-control-a-iframe-player-thats-already-in-the-html
      //iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*')
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    }
    else if (parser.hostname.substr(parser.hostname.length - 9) == "vimeo.com")
    {
      // Chrome may throw an exception saying the message was blocked,
      // (on localhost usage?) but the message probably still reached the destination, which it should since we used "*")
      //var val = JSON.stringify({ method: "pause" });
      iframe.contentWindow.postMessage('{"method":"pause"}', "*");
    }
  }
}







$wh.__defaultplaybackoptions = default_video_playback;
$wh.__generateVideoNode = generateVideoNode; //exposed only for wh.ui.popup.video and wh.ui.popup.mediaslides
$wh.initializeVideoElement = initializeVideoElement;

function initializeVideoElement(node)
{
  if(node.retrieve("wh-did-initvideo"))
    return;

  node.empty();
  node.store("wh-did-initvideo", true);

  var video = JSON.decode(node.getAttribute("data-video"));
  var opts = node.hasAttribute("data-video-options") ? JSON.decode(node.getAttribute("data-video-options")) : {};

  node.adopt(generateVideoNode(video, opts));
}

$wh.setupReplaceableComponents(".wh-video", initializeVideoElement);

})(document.id); //end mootools wrapper
