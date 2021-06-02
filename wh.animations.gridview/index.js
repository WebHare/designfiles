/* generated from Designfiles Public by generate_data_designfles */
require ('wh.compat.base');
/*! LOAD: wh.compat.base
!*/

/*

ADDME: add an extra row to have some empty spots (voor speels effect)?
ADDME: optimize, to only animate those elements which have started and not ended yet their animation instead of positioning *all* blocks every frame
FIXME: although the popup positioning works reasonable, it can be improved:
- iPad keeping the popup within the viewport doesn't work (does work on desktop)
- move popout relative to block but not so much the get's detached from the pointer and block

*/


/*

Usage instructions:
- if items are specified they are used, otherwise the gridview gathers all
  nodes with class wh-gridview-block within it's container as items

*/

(function($) {

if(!window.$wh) window.$wh={};

$wh.GridView = new Class(
  { Implements: [Options, Events]

  , options:    { orientation: "vertical"
                , gridwidth:   5
                , gridheight:  null

                , gridminwidth: 5
                , gridminheight: 2

                , blockwidth:  100
                , blockheight: 100

                , delayperblock: 150
                , blocktransitionduration: 300
                , transition:    null

                // how far to keep the popout away from the edges of the viewport (browser tab)
                , popout_keepfromviewportedge: { top: 10, right: 10, bottom: 10, left: 10 } // only top and bottom are currently used
                , popout_keepfromgridedge: { top: 10, right: 10, bottom: 10, left: 10 }  // only left and right are currently used
                , popout_keepingrid:   false
                }

  , container:  null

  , items:      []
  , modalitylayer: null
  //, popouts:    []
  , animitems:  []
  , skipoptionalitems: false // set to true if optional items make the difference in creating an addional row (and therefore empty spots)

 // computed size based on orientation, grid size and amount of items
  , gridwidth:  null
  , gridheight: null
  , gridpixwidth: null
  , gridpixheight: null

  , framereq: null

  , anim_starttime: null
  , anim_prevframetime: null

  , selectedblock: null // node of currently selected block

  // ADDME: if gridwidth and gridheight are both fixed, cut off items if there are too many

  , initialize: function(container, options)
    {
      this.setOptions(options);

      this.container = container;
      if (!this.container)
      {
        console.error("No container specified.");
        return;
      }

      // FIXME?: or use feature detection? (are there obscure old browsers which doesn't support rgba and aren't called Internet Explorer?)
      if (Browser.ie && Browser.version < 9)
      {
        this.container.addClass("norgba");
        this.container.addClass("noboxshadow");
      }
      if (Browser.ie && Browser.version >= 10
          || Browser.firefox && Browser.version >= 4
          || Browser.chrome
          || Browser.safari
          || Browser.opera && Browser.version >= 10.5
          )
      {
        this.container.addClass("usetransitions");
      }

      this.container.addEvent("click:relay(.wh-gridview-block,.-wh-gridview-block)", this.toggleBlock.bind(this));
      //this.container.addEvent("touchstart:relay(.-wh-gridview-block)", this.toggleBlock.bind(this)); // prevents scrolling the page

      this.container.addEvent("click:relay(.wh-gridview-popout-closebutton,.-wh-gridview-popout-closebutton)", this.modalityLayerClicked.bind(this));
      this.container.addEvent("touchstart:relay(.wh-gridview-popout-closebutton, .-wh-gridview-popout-closebutton)", this.modalityLayerClicked.bind(this));

//    node.addEvent("click:relay(.mediaitem)", this.onSelectedItem.bind(this));

      this.modalitylayer = this.container.getElement(".wh-gridview-modality-layer, .-wh-gridview-modality-layer");
      if (this.modalitylayer)
      {
        this.modalitylayer.addEvent("click", this.modalityLayerClicked.bind(this));
        this.modalitylayer.addEvent("touchstart", this.modalityLayerClicked.bind(this));
      }

      // if no items are explicitly given, look for items
//      if (!options.items || options.items.length == 0)
//      {
        //console.error("No gridview items specified.");
        console.info("Looking up gridview items.");

        var blocknodes = container.getElements(".wh-gridview-block, .-wh-gridview-block");
        var popoutnodes = container.getElements(".wh-gridview-popout, .-wh-gridview-popout");
        var amount_of_items = blocknodes.length;

        if (amount_of_items == 0)
        {
          console.error("Could not find any blocks for the gridview. (.wh-gridview-block)");
          return;
        }

        /*
        console.log(blocknodes.length);
        console.log(popoutnodes.length);
        if (amount_of_items != popoutnodes.lenght)
        {
          console.error("Did not get the same amount of -wh-gridview-block's as -wh-gridview-popout's");
          return;
        }
        */

        this.count_required = 0;
        this.count_optional = 0;
        var reqlist = [], optlist = [], allitems = [];

        for(var tel = 0; tel < amount_of_items; tel++)
        {
          var isoptional = (blocknodes[tel].getAttribute("data-optional") == "true");
          blocknodes[tel].setStyle("visibility", "hidden");

          var itemdata = { node:     blocknodes[tel]
                         , popout:   popoutnodes[tel]
                         , index:    tel
                         , optional: isoptional
                         };

          if (isoptional)
          {
            this.count_optional++;
            optlist.push(itemdata);
          }
          else
          {
            this.count_required++;
            reqlist.push(itemdata);
          }

          allitems.push(itemdata);
        }

//      }

      if (this.options.orientation == "vertical")
      {
        if (!this.options.gridwidth)
          this.gridwidth = container.clientWidth / this.options.blockwidth;
        else
          this.gridwidth = this.options.gridwidth;

        //this.gridheight = Math.ceil(this.items.length / this.options.gridwidth);

        // prevent making a new row for optional blocks
        var gridheight_reqitems = Math.ceil(this.count_required / this.options.gridwidth);
        var gridheight_allitems = Math.ceil(amount_of_items / this.options.gridwidth);
        this.gridheight = gridheight_reqitems;
        if (gridheight_allitems > gridheight_reqitems)
        {
          this.items = reqlist;
          // hide the optional items which we won't use
          for (var tel=0; tel < optlist.length; tel++)
            optlist[tel].node.setStyle("display", "none");
          // ADDME: add optional items until all columns are filled?
        }
        else
        {
          this.items = allitems;
        }
      }
      else if (this.options.orientation == "horizontal")
      {
        // we cannot (for now at least) autodetect available height to auto set gridheight
        if (!this.options.gridheight)
        {
          console.error("gridheight is required if orientation is set to 'horizontal'");
          return;
        }

        this.gridwidth = this.items.length / this.options.gridheight;
      }

      if (this.gridwidth < this.options.gridminwidth)
        this.gridwidth = this.options.gridminwidth;

      if (this.gridheight < this.options.gridminheight)
        this.gridheight = this.options.gridminheight;

      console.info("Grid will be "+this.gridwidth+" x "+this.gridheight + " blocks.");

      this.gridpixwidth = this.gridwidth * this.options.blockwidth;
      this.gridpixheight = this.gridheight * this.options.blockheight;

      var styles = { width:  this.gridpixwidth
                   , height: this.gridpixheight
                   };

      this.container.setStyles(styles);

      this.randomizeAnimation();

      this.pixelratio = window.devicePixelRatio ? window.devicePixelRatio : 1;
      this.usetransforms = $wh.__transform_property != "";
      this.use3dtransforms = (Browser.platform=="ios"); // ==true because the variable might be undefined
    }

  , modalityLayerClicked: function(evt)
    {
      evt.stop();
      this.disableSelectedBlock();

      if (this.modalitylayer)
        this.modalitylayer.removeClass("active");
    }

  , disableSelectedBlock: function()
    {
      if (this.selectedblock)
      {
        this.selectedblock.node.removeClass("selected");
        this.selectedblock.popout.removeClass("selected");
        this.selectedblock = null;
      }
    }

  , toggleBlock: function(evt, node)
    {
      evt.stop();

      // lookup associated object for the selected block
      var newselection = this.animitems.getObjectByKey("node", node);

      // if the same block was clicked we toggled it off and don't need to do anything more
      if (newselection == this.selectedblock)
      {
        this.disableSelectedBlock();

        if (this.modalitylayer)
          this.modalitylayer.removeClass("active");

        return;
      }

      this.disableSelectedBlock();

      this.positionPopout(newselection);
      newselection.node.addClass("selected");
      newselection.popout.addClass("selected");

      if (this.modalitylayer)
        this.modalitylayer.addClass("active");

      this.selectedblock = newselection;
    }

  , positionPopout: function(block)
    {
      //console.log(block.node);

      // try to keep the popup in the current view
      //var blockpos_in_grid = block.node.getPosition(this.container); <-- webkit/mootools might return the wrong value due to transforms (bug in webkit or mootools?)
      var blockpos_in_grid = { x: block.endx, y: block.endy };
      //console.log(block);

      var blockpos_in_document = block.node.getPosition(document.body);

      // document.documentElement.scrollLeft/scrollTop works in FF/IE, but an iPad returns 0
      // iPad works with document.body.scrollTop and window.pageYOffset

      var viewport_scrolled = window.getScroll();
      var blockpos_in_viewport = { x: blockpos_in_document.x - viewport_scrolled.x //document.documentElement.scrollLeft
                                 , y: blockpos_in_document.y - viewport_scrolled.y //document.documentElement.scrollTop
                                 }; //block.node.getPosition(document.documentElement);

      // for positioning the popup we want to know the visible viewport size
      // (on the iPad the part we have zoomed into),
      // not the size we have when viewing the site at 1:1
      var viewport_width = window.innerWidth; //document.documentElement.clientWidth;
      var viewport_height = window.innerHeight; //document.documentElement.clientHeight;

      /*
      console.log(blockpos_in_grid);
      console.log(blockpos_in_document);
      console.log(blockpos_in_viewport);
      console.log(viewport_width);
      console.log(viewport_height);
      */
      block.popout.setStyles
          ({ visibility: "hidden"
           , display:    "block"
           });

      var popout_size = block.popout.getSize();

      block.popout.setStyles
          ({ visibility: ""
           , display:    ""
           });

      var viewport_roomabove = blockpos_in_viewport.y - this.options.popout_keepfromviewportedge.top;
      var viewport_roombelow = viewport_height - blockpos_in_viewport.y - this.options.blockheight - this.options.popout_keepfromviewportedge.bottom;

      //var grid_roomleft = blockpos_in_grid.x;
      //var grid_roomright = this.gridpixwidth - blockpos_in_grid.y;

      /*
      console.log("Viewport room above: "+viewport_roomabove);
      console.log("Viewport room below: "+viewport_roombelow);
      //console.log("Grid room left: "+grid_roomleft);
      //console.log("Grid room right: "+grid_roomright);

      console.log("Popout size: ",popout_size);
      */

      var leftpos = blockpos_in_grid.x + this.options.blockwidth / 2 - popout_size.x / 2;
      if (this.options.popout_keepingrid)
      {
        if (leftpos < this.options.popout_keepfromgridedge.left)
          leftpos = this.options.popout_keepfromgridedge.left;
        else if (leftpos + popout_size.x > this.gridpixwidth - this.options.popout_keepfromgridedge.right )
          leftpos = this.gridpixwidth - popout_size.x - this.options.popout_keepfromgridedge.right;
      }

      // FIXME: use this.options.blockwidth/blockheight or use getSize() ?
      // ADDME: determine best horizontal offset
      // ADDME: have a small preference for below ??
      //if (roomabove > roombelow)
      if (viewport_roombelow < popout_size.y)
      {
        // position popout above the block
        block.popout.addClass("above");
        block.popout.removeClass("below");
        block.popout.setStyles({ left: leftpos
                               , top: blockpos_in_grid.y - popout_size.y
                               });
      }
      else
      {
        // popsition popout below the block
        block.popout.addClass("below");
        block.popout.removeClass("above");
        block.popout.setStyles({ left: leftpos
                               , top: blockpos_in_grid.y + this.options.blockheight
                               });
      }

      var pointernode = block.popout.getElement(".pointer");
      if (pointernode)
      {
        pointernode.setStyles
            ({ marginLeft: 0
             , left:       (blockpos_in_grid.x + this.options.blockwidth / 2) - leftpos
             });
      }

      //console.log(blockpos_in_grid);
      //console.log(blockpos_in_document);
      //console.log(blockpos_in_viewport);
    }

  , getShuffledBlocksList: function()
    {
      var shuffledblocks = this.items.clone();

      // add dummy blocks for empty blocks, so empty blocks get shuffled too
      var slots_to_fill = this.gridwidth * this.gridheight;
      var availableblocks = this.items.length;
      for(var tel=0; tel < slots_to_fill-availableblocks; tel++)
        shuffledblocks.push({ node: null });

      this.shuffle(shuffledblocks);
      return shuffledblocks;
    }

  , getShuffledPositions: function()
    {
      var slots_to_fill = this.gridwidth * this.gridheight;

      var shuffledpositions = [];
      for(var tel=0; tel < slots_to_fill; tel++)
        shuffledpositions.push(tel);

      this.shuffle(shuffledpositions);

      return shuffledpositions;
    }

  , fixBlocksWithFixedPosition: function(shuffledblocks, shuffledpositions)
    {
      // now take the blocks which have a fixed position, and swap them with the blocks which currently have their spot
      var amount_of_items = this.items.length;
      for(var tel = 0; tel < amount_of_items; tel++)
      {
        // use the original list since we change stuff in the shuffled list in our loop
        var position = this.items[tel].node.getAttribute("data-position");
        if (position == null || position == "")
          continue;

        // interpret the specified position
        var locations = position.split(" ");
        var row = -1;
        var column = -1;
        for(var tel2 = 0; tel2 < locations.length; tel2++)
        {
          switch(locations[tel2])
          {
            case "top":
              row = 0;
              break;
            case "bottom":
              row = this.gridheight - 1;
              break;
            case "left":
              column = 0;
              break;
            case "right":
              column = this.gridwidth - 1;
              break;
          }
        }

        //console.log(this.items[tel].node, locations);

        var required_blockpos = row * this.gridwidth + column;

        var orderintime_blockinourspot = shuffledpositions.indexOf(required_blockpos); // the Xth block to appear
        //var current_timeposition = shuffledblocks.getObjectByKey("node", this.items[tel].node); // or can we get indexOf for object comparison??
        var current_timeposition = shuffledblocks.getIndexByKey("node", this.items[tel].node); // or can we get indexOf for object comparison??

        // are we already at the correct position?
        if (current_timeposition == orderintime_blockinourspot)
          break;

        var blockinourspot = shuffledblocks[orderintime_blockinourspot]; // get the block which was to appear as that Xth block
        shuffledblocks[orderintime_blockinourspot] = this.items[tel]; // replace it with the block that should be there
        //console.log("Block at timeslot #"+orderintime_blockinourspot+" uses our position. ", blockinourspot);
        //console.log("Block meant for that slot uses timeslot #"+current_timeposition,shuffledblocks[current_timeposition]);
        shuffledblocks[current_timeposition] = blockinourspot;
      }
    }

  , randomizeAnimation: function()
    {
      var gridw_px = this.gridwidth * this.options.blockwidth;
      var gridh_px = this.gridheight * this.options.blockheight;

      var startx = (gridw_px - this.options.blockwidth) / 2;
      var starty = (gridh_px - this.options.blockheight) / 2;

      var shuffledblocks = this.getShuffledBlocksList();
      var shuffledpositions = this.getShuffledPositions();
      this.fixBlocksWithFixedPosition(shuffledblocks, shuffledpositions);

      this.animitems = [];

      var amount_of_items = shuffledblocks.length;
      for(var tel = 0; tel < amount_of_items; tel++)
      {
/*
        var blockdata = this.items[tel];

        var block  = new Element("div", { "class": "-wh-gridview-block" });
        var bimg   = new Element("img", { "class": "-wh-gridview-block-image", src:     blockdata.src });
        var btitle = new Element("div", { "class": "-wh-gridview-block-title", "text":  blockdata.title });
        block.adopt(bimg, btitle);
*/
        if (shuffledblocks[tel].node == null) // empty block
          continue;

        this.animitems.push
                 ({ node:     shuffledblocks[tel].node //block
                  , popout:   shuffledblocks[tel].popout //this.popouts[tel] //popout
                  //, item:     blockdata // reference to original item
                  , index:    shuffledblocks[tel].index
                  , delay:    tel * this.options.delayperblock
                  , duration: this.options.blocktransitionduration
                  , startx:   startx
                  , starty:   starty
                  , endx:     (shuffledpositions[tel] % this.gridwidth) * this.options.blockwidth
                  , endy:     Math.floor(shuffledpositions[tel] / this.gridwidth) * this.options.blockheight
                  });
      }

      //this.animitems.shuffle();
    }

  , shuffle: function(arr)
    {
      for (var i = arr.length; i && --i;)
      {
        var temp = arr[i], r = Math.floor(Math.random() * ( i + 1 ));
        arr[i] = arr[r];
        arr[r] = temp;
      }

      //shuffle the array at start
      /*
      var len = this.sprites.length;
      var i = len;
      while(i--)
      {
        var p = parseInt(Math.random()*len);
        var t = this.sprites[i];
        this.sprites[i] = this.sprites[p];
        this.sprites[p] = t;
      }
      */
    }

  , play: function()
    {
      this.disableSelectedBlock();
      if (this.modalitylayer)
        this.modalitylayer.removeClass("active");

      this.anim_starttime = new Date().getTime();

      for(var tel = 0; tel < this.items.length; tel++)
        this.items[tel].node.setStyle("visibility", "");

      this.continue_anim();
    }

  , continue_anim: function()
    {
      if (!this.update()) // not finished?
        this.schedulenextframe();
      else
        this.fireEvent("ended");
    }

  , schedulenextframe: function()
    {
      if (!this.framereq) // if no frame is scheduled
        this.framereq = requestAnimationFrame(this.continue_anim.bind(this));
    }

  , stop: function()
    {
      if (this.framereq)
        cancelAnimationFrame(this.framereq);

      this.framereq = null;
    }

  , update: function()
    {
      this.framereq = null;
      var timenow = Date.now();

      //if (timenow - this.anim_prevframetime > 1000)
      //  ... we probably havn't been visible for some time

      var anim_timeprogressed = timenow - this.anim_starttime;

      //console.log("Drawing frame "+anim_timeprogressed+"ms");

      var itemcount = this.animitems.length;
      var ready = true;
      for(var tel = 0; tel < itemcount; tel++)
      {
        var itemdata = this.animitems[tel];

        var blockanim_timeprogressed = anim_timeprogressed - itemdata.delay;
        var blockanim_progress = blockanim_timeprogressed / itemdata.duration;
        if (blockanim_progress < 0)
          blockanim_progress = 0;
        else if (blockanim_progress > 1)
          blockanim_progress = 1;

//if ()
//console.log(blockanim_progress);

        if (blockanim_progress < 1)
          ready = false;


        var tweenedprogress = this.options.transition ? this.options.transition(blockanim_progress) : blockanim_progress;

        var xpos = itemdata.startx + (itemdata.endx - itemdata.startx) * tweenedprogress;
        var ypos = itemdata.starty + (itemdata.endy - itemdata.starty) * tweenedprogress;

        if (this.pixelratio == 1)
        {
          xpos = Math.round(xpos);
          ypos = Math.round(ypos);
        }
        else
        {
          xpos = Math.round(xpos * this.pixelratio) / this.pixelratio;
          ypos = Math.round(ypos * this.pixelratio) / this.pixelratio;
        }

        //console.log(itemdata.node," to "+xpos+"x"+ypos);

        var scale = tweenedprogress.toFixed(3) * 3;
        if (scale > 1)
          scale = 1;

        if (this.use3dtransforms)
          itemdata.node.style[$wh.__transform_property] = "translate3D("+xpos+"px,"+ypos+"px,0) scale("+scale+")";
        else if (this.usetransforms)
          itemdata.node.style[$wh.__transform_property] = "translate("+xpos+"px,"+ypos+"px) scale("+scale+")"; // rotate("+itemangle+"deg)";
        else
        {
          itemdata.node.style.left = xpos+"px";
          itemdata.node.style.top = ypos+"px";
        }
      }

      this.anim_prevframetime = timenow;

      //console.log("Finished drawing frame");

      return ready;
    }
});

})(document.id);
