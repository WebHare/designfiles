/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
require ('frameworks.mootools.more.class.binds');
require ('wh.animations.timeline');
require ('wh.ui.base');
/*! LOAD: wh.compat.base, frameworks.mootools.more.class.binds, wh.animations.timeline, wh.ui.base
!*/

(function($) { //mootools wrapper

/* Define your accordion like this:
    <dl class="wh-accordion" data-openmode="tweenheight">
      [forevery]
        <dt>question</dt>
        <dd>answer</dd>
      [/forevery]
    </dl>

    Any dl.wh-accordion is auto registered.
    Every dt clicked will open/close its next sibling dd, and close any other open dds

    Opening and closing is done by marking both the associated 'dt' and 'dd' with the class 'open'
    Optionally an opening mode can be set:
      - tweenheight: A Fx.tween will be done on the dd
      - setheight: The height will be on the dd immediately (useful when combined with css3 transitions)

    If necessary, a specific question can be opened immediately by setting its dt & dd
    class to 'open'

    We only pick up dds that are siblings of a dt (ie, they must share their parent)

    You may also want to define a:
    dl.wh-accordion dt { cursor:pointer }
    in your CSS.

    We ignore clicks on <a> and <button> within the <dt>.
*/

$wh.Accordion = new Class(
{ Implements: [Options]
, Binds: [ "onSectionClick" ]

, options: { openmode: ''
           }

, animator: null

, initialize: function(node, options)
  {
    this.setOptions(options);

    this.node=$(node);
    this.node.addEvents({"click:relay(dt)": this.onSectionClick});
    this.node.store("-wh-accordion",this);
    this.node.store("wh-accordion",this);

    this.refresh();
  }

  /** @short initialize any new (dynamically added) content within our accordion
  */
, refresh: function()
  {
    if(this.options.openmode)
      this.node.getElements('dt ~ dd').each(this.__initializeRow.bind(this));
  }

, destroy:function()
  {
    this.node.eliminate("-wh-accordion");
    this.node.eliminate("wh-accordion");
    this.node.removeEvents({"click:relay(dt)": this.onSectionClick});
  }

  /** @short open or close an item within the accordion
      @param node <dt> of the item to expand/open
      @param open whether to open or close the item
  */
, setOpenState: function(node, open)
  {
    this.applyNewState(node, !open);
  }

  /************

  Private

  ************/

, onSectionClick:function(event, dt)
  {
    // if we are in a <a> or <button> within the <dt> element,
    // ignore this click and allow the event to pass.
    var checknode = event.target;
    while (checknode && checknode.tagName != "DT")
    {
      // quit
      if (["A", "BUTTON"].contains(checknode.tagName))
        return;

      checknode = checknode.parentNode;
    }

    event.stop();

    var closingcurrentsection = dt.hasClass('open');

    this.applyNewState(dt, closingcurrentsection);
  }

, __initializeRow: function(node)
  {
    if (node.__whAccordion)
      return;

    this.applyOpenMode(false, node);

    node.__whAccordion = true;
  }

, applyNewState: function(dt, closingcurrentsection)
  {
    //close any open sections
    if(this.options.openmode)
      this.node.getElements('dd.open').each(function(node) { this.applyOpenMode(true, node, false) }.bind(this) );

    this.node.getElements('dt.open,dt ~ dd.open').removeClass('open');
    if(closingcurrentsection)
      return;

    //open current section
    dt.addClass('open');

    /*
    var dd = dt.getNext('dd');
    if(!dd)
      return;
    */
    var dd = dt;
    while(dd && dd.tagName != "DD")
    {
      dd = dd.nextSibling;
      if (!dd || dd.tagName == "DT")
        return; // if we found another <dt> it means we don't have an associated <dd> panel to expand or collapse
    }

    dd.addClass('open');
    if(this.options.openmode)
      this.applyOpenMode(true, dd, true);
  }

, applyOpenMode:function(animate, dd, new_state)
  {
    //console.log("applyOpenMode", animate, dd, new_state);

    if(new_state !== true && new_state !== false)
      new_state = dd.hasClass('open');

    dd.setStyle('overflow','hidden');
    if(this.options.openmode=='tweenheight')
    {
      //dd[animate ? 'tween' : 'setStyle']('height', new_state ? dd.scrollHeight : 0);
      if (!dd._whAccordionInitialized)
      {
        // Mootools keeps adding the event each time we try to set it
        //dd.set("tween", { onComplete: function(){ if (dd.hasClass('open')) dd.setStyle("height", ""); } });
        dd._whAccordionInitialized = true;
      }

      var destheight;
      if (animate)
      {
        //dd.tween('height', new_state ? dd.scrollHeight : 0);

        var anim =
            [ { target:   dd
              , to:       { "height": new_state ? dd.scrollHeight : 0 }
              , duration: .500
              }
          //, { onStateChange: function(dd, evt) { $wh.fireLayoutChangeEvent(dd, "up"); }.bind(this, dd) }
            , { onStateChange: $wh.fireLayoutChangeEvent.bind(this, dd,'') }
            ];

        if (this.animator)
          this.animator.stop();

        this.animator = new $wh.AnimationTimeline(dd, anim, { onEnded: this.onFinishedOpenAnim.bind(this, dd) });
        this.animator.play();
      }
      else
        dd.setStyle("height", new_state ? "" : 0);
    }
    else if(this.options.openmode=='setheight')
      //dd.setStyle('height', new_state ? dd.scrollHeight : 0);
      dd.setStyle('height', new_state ? "" : 0);

    $wh.fireLayoutChangeEvent(dd,'');
  }

, onFinishedOpenAnim: function(dd)
  {
    if (dd.hasClass('open'))
      dd.setStyle("height", "");
  }
});

function setupAccordion(node)
{
  if(!node.retrieve("wh-accordion"))
  {
    //var opts = JSON.decode(node.getAttribute("data-slideshow-options"));
    //node.store("wh-slideshow", new $wh.Slideshow(node, opts));

    // FIXME: support JSON notation for accordion?
    new $wh.Accordion(node, { openmode: node.getAttribute('data-openmode') });
  }
}

function initializeAccordions()
{
  $wh.setupReplaceableComponents("dl.wh-accordion,dl.-wh-accordion", setupAccordion);
}

$(window).addEvent('domready', initializeAccordions);

})(document.id); //end mootools wrapper
