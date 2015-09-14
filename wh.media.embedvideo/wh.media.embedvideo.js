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

$wh.__defaultplaybackoptions = default_video_playback;
$wh.__generateVideoNode = generateVideoNode; //exposed only for wh.ui.popup.video - do
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
