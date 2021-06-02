/* generated from Designfiles Public by generate_data_designfles */
require ('.././slidernav.css');
require ('../frameworks.mootools');
require ('../wh.compat.base');
require ('../frameworks.mootools.more.element.measure');
require ('../wh.util.dragevents');
/*! LOAD: frameworks.mootools, wh.compat.base, frameworks.mootools.more.element.measure, wh.util.dragevents
!*/

/****************************************************************************************************************************
 * Slider navigation
 *
 * current: Horizontal slider navigation
 * Note: all slider navigation elements are set to width (or height if vertical) of largest element
 */
(function($) { //mootools wrapper

$wh.SliderNav = new Class(
{ Implements: [ Options, Events ]
 ,selected  : 0
 ,cellwidth : 0
 ,cellheight: 0
 ,cellpadwidth: 0
 ,cellpadheight: 0
 ,nrelements: 0
 ,container : null
 ,slidernode: null
 ,activeoverlaynode: null
 ,activeoverlayelementsnode: null
 ,options: { duration:  300
           , selectedindex:0
           , transition: Fx.Transitions.easeOut
           }

 ,startdragposition:null
 ,currentdragposition:null
 ,isvertical: false

 ,dragnode : null
 ,dragger : null
 ,onmousemove:null

 ,initialize: function(container,options)
  {
    this.container = container;

    this.setOptions(options);

    this.isvertical = this.container.hasClass('vertical');

    this.slidernode = this.container.getElement('.wh-slidernav-sliderknob');
    this.activeoverlaynode = this.container.getElement('.wh-slidernav-viewport');
    this.activeoverlayelementsnode = this.activeoverlaynode.getChildren();

    this.slidernode.set('tween',{'duration':this.options.duration, 'transition':this.options.transition});
    this.activeoverlaynode.set('tween',{'duration':this.options.duration, 'transition':this.options.transition});
    this.activeoverlayelementsnode.set('tween',{'duration':this.options.duration, 'transition':this.options.transition});

    if(this.slidernode.hasClass('ontop'))
      this.dragnode = this.slidernode;
    else
      this.dragnode = this.activeoverlaynode;

    this.container.getElements('ul.wh-slidernav-notactive li').each(function(node,index)
    {
      var size = node.getSize();

      if(size.x > this.cellwidth)
        this.cellwidth = Math.ceil(size.x);

      if(size.y > this.cellheight)
        this.cellheight = Math.ceil(size.y);

      if ("createTouch" in document)
        node.addEvent('touchstart',this.doSwitch.bind(this,index,true));
      else
        node.addEvent('mousedown',this.doSwitch.bind(this,index,true));

      this.nrelements++;
    }.bind(this));

    if(this.isvertical)
    {
      this.container.getElements('ul').setStyle('height',this.nrelements*this.cellheight);
      this.container.getElements('ul li').setStyle('height',this.cellheight);

      this.slidernode.setStyles({'height' : this.cellheight, 'top' : '0px'});
      this.activeoverlaynode.setStyles({'height' : this.cellheight, 'top' : 0});
      this.activeoverlayelementsnode.setStyles({'top' : 0});
    }
    else
    {
      this.container.getElements('ul').setStyle('width',this.nrelements*this.cellwidth);
      this.container.getElements('ul li').setStyle('width',this.cellwidth);

      this.slidernode.setStyles({'width' : this.cellwidth, 'left' : '0px'});
      this.activeoverlaynode.setStyles({'width' : this.cellwidth, 'left' : 0});
      this.activeoverlayelementsnode.setStyles({'left' : 0});
    }

    //Mask to prevent text selection in overlaynode
    var masknode = new Element('div',{'style':'z-index:100;position:absolute;top:0;left:0;width:100%;height:100%;'}).inject(this.activeoverlaynode);

    if(this.dragnode == this.slidernode)
      this.dragnode.addClass('wh-slidernav-dragger');
    else
      masknode.addClass('wh-slidernav-dragger');

    if(this.options.selectedindex > 0 && this.options.selectedindex < this.nrelements)
      this.doSwitch(this.options.selectedindex,false);

    this.dragger = new $wh.DragEvents(this.dragnode,{ events: { "dragmove" : this.dragSlider.bind(this)
                                                              , "dragend"  : this.snapToClosest.bind(this)
                                                              , "dragstart": this.onDragStart.bind(this)
                                                              }
                                                    });
  }

 ,onDragStart:function(ev)
  {
    this.startdragposition = ev.page;
  }

 ,snapToClosest: function()
  {
    if(this.startdragposition)
    {
      var closedindex = this.selected;
      if(this.isvertical)
      {
        closedindex = Math.floor((this.currentdragposition / this.cellheight) + 0.5);
      }
      else
      {
        closedindex = Math.floor((this.currentdragposition / this.cellwidth) + 0.5);
      }
      $(document.body).removeEvent('mousemove',this.onmousemove);
      this.startdragposition = null;

      if(closedindex != this.selected)
      {
        var node = this.container.getElement('ul.wh-slidernav-notactive li:nth-child(' + (closedindex+1) + ')');
        if(node)
        {
          var anode = node.getElement('a');
          anode.fireEvent('click');
        }
      }

      this.doSwitch(closedindex, true);
    }
  }

 ,dragSlider: function(ev)
  {
    if(!this.startdragposition)
      return;

    var dx = this.startdragposition.x - ev.page.x;
    var dy = this.startdragposition.y - ev.page.y;

    var index = this.selected;
    if(this.isvertical)
    {
      var newpos = index*this.cellheight - dy;
      if(newpos >= 0 && newpos <= (this.nrelements - 1)*this.cellheight)
      {
        this.slidernode.setStyle('top',newpos);//move selector
        this.activeoverlaynode.setStyle('top',newpos);//move viewport
        this.activeoverlayelementsnode.setStyle('top',-1*newpos);//compensate for viewport movement
        this.currentdragposition = newpos;
      }
    }
    else
    {
      var newpos = index*this.cellwidth - dx;
      if(newpos >= 0 && newpos <= (this.nrelements - 1)*this.cellwidth)
      {
        this.slidernode.setStyle('left',newpos);//move selector
        this.activeoverlaynode.setStyle('left',newpos);//move viewport
        this.activeoverlayelementsnode.setStyle('left',-1*newpos);//compensate for viewport movement
        this.currentdragposition = newpos;
      }
    }

  }

 ,setActiveUrl: function(url)
  {
    this.container.getElements('ul.wh-slidernav-notactive li > a').each(function(node,index)
    {
      if(node.get('href') == url)
      {
        this.doSwitch(index,false);
        return;
      }

    }.bind(this));
  }

 ,doSwitch: function(index, animate)
  {
    this.selected = index;

    if(this.isvertical)
    {
      if(animate)
      {
        this.slidernode.tween('top', index*this.cellheight);//move selector
        this.activeoverlaynode.tween('top', index*this.cellheight);//move viewport
        this.activeoverlayelementsnode.tween('top', -1*index*this.cellheight);//compensate for viewport movement
      }
      else
      {
        this.slidernode.setStyle('top', index*this.cellheight);//move selector
        this.activeoverlaynode.setStyle('top', index*this.cellheight);//move viewport
        this.activeoverlayelementsnode.setStyle('top',-1*index*this.cellheight);//compensate for viewport movement
      }
    }
    else
    {
      if(animate)
      {
        this.slidernode.tween('left', index*this.cellwidth);//move selector
        this.activeoverlaynode.tween('left', index*this.cellwidth);//move viewport
        this.activeoverlayelementsnode.tween('left',-1*index*this.cellwidth);//compensate for viewport movement
      }
      else
      {
        this.slidernode.setStyle('left', index*this.cellwidth);//move selector
        this.activeoverlaynode.setStyle('left', index*this.cellwidth);//move viewport
        this.activeoverlayelementsnode.setStyle('left',-1*index*this.cellwidth);//compensate for viewport movement
      }
    }
  }

});

})(document.id); //end mootools wrapper
