/* generated from Designfiles Public by generate_data_designfles */
require ('../frameworks.mootools');
require ('../wh.compat.base');
/*! LOAD: frameworks.mootools, wh.compat.base
!*/

(function($) { //mootools wrapper

$wh.SinglePageAppBase = new Class(
{ appbaseurl: ''
, domisready:false
, cssisready:false
, bodyisready:false

, initialize:function()
  {
    //FIXME properly handle the case when 'dom' is already ready, we might be improperly invoked
    $(window).addEvent("hashchange", this.__onHashChange.bind(this));
    this.appbaseurl = location.href.split('?')[0].split('#')[0];

    $(window).addEvent("load", $wh.SinglePageAppBase.onBodyLoad.bind(this)); //FIXME handle the case where the body is _already_ loaded
    $(window).addEvent("domready", $wh.SinglePageAppBase.onDomReady.bind(this)); //this MUST be the last action, as mootools will 'catch up' and directly run it

    //we can't apply this safely to all hyperlinks, as we'd break the <a href="#" onclick="function"> case, if that function tries to preventDefault
    $(document).addEvent("click:relay(a.-wh-forcehashchange, a.wh-forcehashchange)", this.forceNavigateToHash.bind(this));
  }

, forceNavigateToHash:function(event, node) //we can't apply this safely to all hyperlinks,
  {
    var hashidx = node.href.indexOf('#');
    if(hashidx<0 || node.target || node.href.split('#')[0] != location.href.split('#')[0])
      return true;

    this.navigateToHash.bind(this, decodeURIComponent(node.href.substr(hashidx+1)), true).delay(0);
    event.stop();
    return false;
  }

  /** @short get the current hash
      @return the current hash, without a '#' or URL encoding
  */
, getCurrentHash:function()
  {
    return $wh.getCurrentHash();
  }

  /** navigate to a specific hash.
      @param newhash Destination hash (without a leading #)
      @param force Force navigation (invoke onHashChange even if we're already the specified page) */
, navigateToHash:function(newhash,force)
  {
    if(this.getCurrentHash()==newhash)
    {
      if(force)
        this.__onHashChange();
    }
    else
    {
      //note: location.href = '#' + encodeURIComponent(newhash); doesn't work if our caller is cross-frame (it will navigate to the caller's url);
      var baseurl = location.href.split('#')[0];
      location.href = baseurl + '#' + encodeURIComponent(newhash);
    }
  }

  /** Open an URL in a new window */
, openURLInNewWindow:function(url)
  {
    window.open(url,'_blank');
  }

  //invoked when the DOM is ready (CSS, async scripts and images may still be loading)
, onDomReady:function()
  {

  }

  //invoked when the CSS is ready (async scripts and images may still be loading) ADDME: Currently linked to onload, which is too late..
, onCssReady:function()
  {

  }

  //invoked on windowLoad (all referred assests should b ready)
, onWindowLoad:function()
  {

  }

, __onHashChange:function()
  {
    this.onHashChange(this.getCurrentHash());
  }

  /** invoked when the hash changes
      @param newhash Destination hash (without a leading #) */
, onHashChange:function(newhash)
  {
  }

, __invokeReady:function(subhandler)
  {
    this['on'+subhandler]();
  }
});

//our helpers, moved outside the class' namespace
$wh.SinglePageAppBase.onDomReady = function()
{
  if(this.domisready)
    return;

  if(!document.body) //whatever, the dom is NOT ready. IE7/8 iframe races sometimes seen when VW hosted the frame.
  {
    this.callDomReady.bind(this).delay(50);
    return;
  }

  //ensure mootools extension of document.body and window. people shouldn't rely on it, but its high on the list of 'accidental IE7 breaks'
  $(document.body);
  $(document.head);

  this.domisready=true;
  this.__invokeReady('DomReady');
 //are there any unloaded css elements?}
}
$wh.SinglePageAppBase.onBodyLoad = function()
{
  this.bodyisready=true;

  if(!this.cssisready)
  {
    //fallback in case css-load detection failed
    this.cssisready=true;
    this.__invokeReady('CssReady');
  }
  if(!this.windowisready)
  {
    this.windowisready=true;
    this.__invokeReady('WindowLoad');
  }
}

})(document.id); //end mootools wrapper
