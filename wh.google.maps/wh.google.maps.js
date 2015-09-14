/* generated from Designfiles Public by generate_data_designfles */
require ('frameworks.mootools.core');
require ('wh.compat.base');
require ('wh.util.preloader');
/*! REQUIRE: frameworks.mootools.core, wh.compat.base, wh.util.preloader !*/

(function(){

///////////////////////////////////////////////////////////////////////////////
// General map functions (external interface)

/* options:

   iconlist: [ { name:           ""              // Map marker icon name
               , icon:           ""              // Icon image url
               , shadow:         ""              // Shadow image url
               , anchorx:        0               // Left coordinate of icon's anchor
               , anchory:        0               // Top coordinate of icon's anchor
               , labelx:         0               // Horizontal center coordinate of icon's label
               , labely:         0               // Top coordinate of icon's anchor
               , popupx:         0               // Left coordinate of a merker's info window
               , popupy:         0               // Top coordinate of merker's info window
               , width:          0               // Icon width in pixels (optional, defaults to iconsize)
               , height:         0               // Icon height in pixels (optional, defaults to iconsize)
               , scaledwidth:    0               // Icon display width in pixels (optional, defaults to width)
               , scaledheight:   0               // Icon display height in pixels (optional, defaults to height)
               , originx:        0               // Left coordinate of icon's position within sprite (optional, defaults to 0)
               , originy:        0               // Top coordinate of icon's position within sprite (optional, defaults to 0)
               , shadowwidth:    0               // Shadow width in pixels (optional, defaults to width)
               , shadowheight:   0               // Shadow height in pixels (optional, defaults to height)
               , shadowx:        0               // Left coordinate of icon's shadow
               , shadowy:        0               // Top coordinate of icon's shadow
               }
             ]

   overlaylist: [ { rowkey:         ""           // Unique overlay identifier (required)
                  , type:           ""           // Overlay type (one of "marker", "polygon" or "polyline")
                  , lat:            0.0          // marker: Marker latitude (required)
                  , lng:            0.0          // marker: Marker longitude (required)
                  , latlng:         ""           // alternatively, comma separated latitude and longitude as a string
                  , icon:           ""           // marker: Name of the icon to use (one of the icons in the iconlist; if no
                                                 // icon was specified or the icon could not be found, a standard Google
                                                 // marker icon is shown)
                  , hint:           ""           // marker: Marker tooltip text
                  , zindex:         null         // The overlay's z-index (set to a number)
                  , selectable:     false        // If the overlay is clickable by the user
                  , moveable:       false        // marker: If the marker is draggable by the user
                  , rowkeys:        []           // marker: The rowkeys this marker represents; usually this is an array
                                                 // containing only the rowkey of this marker, but for clustered markers
                                                 // this is the list of markers that are combined in this marker (if not
                                                 // present, the marker only represents itself)
                  , latlngs:        [ { lat: 0.0 // polygon, polyline: The shape vertices (required)
                                      , lng: 0.0
                                    ]
                  , outlinewidth:   0            // polygon, polyline: The width of the shape's outline
                  , outlinecolor:   ""           // polygon, polyline: The color of the shape's outline
                  , outlineopacity: 100          // polygon, polyline: The opacity (percentage) of the shape's outline
                  , reflat:         0.0          // polygon: Reference latitude for latlngs coordinates
                  , reflng:         0.0          // polygon: Reference longitude for latlngs coordinates
                  , fillcolor:      ""           // polygon: The polygon's fill color
                  , fillopacity:    100          // polygon: The polygon's fill opacity (percentage)
                  , drop: false                  // drop the pin in place
                  }
                ]
*/


$wh.GoogleMap = new Class(
{ Implements: [Options,Events]
, options: { maptype:             "map"         // Initial map type (one of "map", "satellite", "hybrid", or "physical")
           , center:              "52.230093,6.873124"         // Initial map center coordinates
           , zoom:                12             // Initial zoom level
           , restrictto:          null//"0,0;0,0"     // Bounds to restrict the map to (if defined, restrict movement and zooming
                                                // to only show the map within the given bounds)
           , moveable:            true          // If the map is moveable/zoomable by the user
           , scrollwheel:         true          // If the map can be zoomed using the mouse scroll wheel
           , showcontrols:        false         // If map navigation controls should be shown
           , backgroundcolor:     ""            // Tollium color, but "transparent" is not supported
           , shapecolor:          "#FF0000"     // Default color for polygons/polylines
           , iconsize:            48            // Map marker icon width/height
           , icons:               []//iconlist      // List of icons
           , markermanager:       true          // If a markermanager should be used (defaults to true)
           , markerclusterer:     false          // If a marker clusterer should be used (defaults to false)
                                                 // For more info: http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/docs/
           , skin:                null

           , overlayrpc:          null          //JSON RPC to download overlay

                                                // Create a button <img> element, the filename does not contain path
/*
           , OnInitialized:       null//function()
           , OnClick:             null//function(latlng)
           , onDblClick:          null//function(latlng)
           , onRightClick:        null//function(point)
           , onMoveend:           null//function()
           , onZoomend:           null//function()
           , onOverlayclick:      null//function(overlay, latlng)
           , onOverlayDblClick:   null//function(overlay, latlng)
           , onOverlayRightClick: null//function(overlay, point)
           , onOverlayDragEnd:    null//function(overlay, latlng)
           , OnProjectionChange:  null//function(map)
           , OnDirections:        null//function(status, directions)
           , openInfoWindow:      null//function(overlay)
           , closeInfoWindow:     null//function()
*/
           , apikey: ''
           , language: null // Language code, for example 'nl'.

           , fullscreenzindex: 99999999
           }
, overlays: []
, icons: []
, controls: {}
, container: null
, currentinfowindow: null
, currentopenoverlay: null
, rpcservice: null
, rpcoptions: {}
, lastbounds: ''
, currentrequest: null

, fullscreenholder:null
, originalparent:null
, originalnextsibling:null

, initialize: function (mapid, sensor, options)
  {
    this.container = $(mapid);
    if (!this.container)
    {
      console.log("Cannot find map object",mapid)
      throw "Cannot find map object";
    }
    if(typeof sensor != "boolean")
      throw "You MUST specify the sensor parameter to $wh.GoogleMap";

    this.setOptions(options);
    if(!this.options.language)
      this.options.language = $wh.getDocumentLanguage();
    if(this.options.showcontrols)
      this.setupSkin();

    // Is google maps initialized yet?
    if(!$wh.GoogleMap.ApiLoader.issetup)
    {
      $wh.GoogleMap.ApiLoader.apikey = this.options.apikey;
      $wh.GoogleMap.ApiLoader.sensor = sensor;
      $wh.GoogleMap.ApiLoader.language = this.options.language ? this.options.language : "";

    } //ADDME else: verify argument compatibility

    this.iconsize = this.options.iconsize;

    // Create the todd map controller object
    new $wh.Preloader([$wh.GoogleMap.ApiLoader], {onComplete:this.loadOptionScripts.bind(this,this.container)});
  }

, destroy:function()
  {
    if (this.mapobj)
      this.mapobj.deInit();
    if(this.currentrequest)
    {
      this.currentrequest.cancel();
      this.currentrequest=null;
    }

    // Google deInitialization code (FIXME should reference count the API perhaps?)
    try
    {
      google.maps.Unload();
    }
    catch(e) {}
  }

, setupRPC:function(rpcservice, options)
  {
    this.rpcservice = rpcservice;
    this.rpcoptions = Object.clone(options);
  }

, checkForNewOverlays:function()
  {
    if(this.rpcoptions.getoverlays)
    {
      var bounds = $wh.GoogleMap.boundsToString(this.getMapIconBounds());
      if (bounds == this.lastbounds)
        return;

      this.lastbounds = bounds;
      if(this.currentrequest)
        this.currentrequest.cancel();

      this.currentrequest = this.rpcservice.request('getOverlays', [ bounds, this.getZoom() ], this.onGetOverlaysSuccess.bind(this));
    }
  }

, onGetOverlaysSuccess:function(response)
  {
    if(!this.currentrequest)
      return;
    this.currentrequest=null;
    if(response.overlays)
      this.updateAllOverlays(response.overlays);
  }

, setupSkin:function()
  {
    if(!this.options.skin)
    {
      if(!$wh.GoogleMap.skins.length)
      {
        console.error("showcontrols is enabled, but no skins are loaded");
        this.options.showcontrols=false;
      }
      else
      {
        this.options.skin = $wh.GoogleMap.skins[0];
      }
    }
    else
    {
      if(typeof this.options.skin == 'string')
      {
        var found=false;
        for(var i=0;!found && i<$wh.GoogleMap.skins.length;++i)
          if($wh.GoogleMap.skins[i].name == this.options.skin)
          {
            found=true;
            this.options.skin = $wh.GoogleMap.skins[i];
          }
        if(!found)
        {
          console.error("Skin '" + this.options.skin + "' is not available");
          if($wh.GoogleMap.skins.length)
            this.options.skin = $wh.GoogleMap.skins[0];
          else
            this.options.showcontrols=false;;
        }
      }
    }
  }

///////////////////////////////////////////////////////////////////////////////
// Our general map managing object

  //force a map update after we resized its container
, updateAfterResize:function()
  {
    if(this.map)
      google.maps.event.trigger(this.map, "resize");
  }

, loadOptionScripts:function(mapdiv)
  {
    var scripts=[];

    //FIXME designfiles should be shipping the dependency. protocol-independent urls
    if (this.options.markermanager)
      scripts.push(new $wh.PreloadableScript("/tollium_todd.res/google/markermanager-v3.js"));
    if (this.options.markerclusterer)
      scripts.push(new $wh.PreloadableScript("/tollium_todd.res/google/markerclusterer-v3.js"));

    //basescripts.push($wh.PreloadableScript("/tollium_todd.res/google/labeledmarker.js"));

    if(scripts.length)
      new $wh.Preloader(scripts, {onComplete:this.setup.bind(this,mapdiv)});
    else
      this.setup(mapdiv);
  }

, setup: function(mapid)
  {
    // Create and initialize the map
    var mapoptions = { center: $wh.GoogleMap.stringToLatLng(this.options.center)
                     , zoom: this.options.zoom
                     , mapTypeId: this.getMapType(this.options.maptype)
                     , disableDefaultUI: true
                     , disableDoubleClickZoom: true
                     };

    if (this.options.backgroundcolor)
      mapoptions.backgroundColor = this.options.backgroundcolor;
    this.map = new google.maps.Map(mapid, mapoptions);

    // Create an empty OverlayView to calculate pixels from latlngs
    this.calcoverlay = new google.maps.OverlayView();
    this.calcoverlay.draw = function(){}; // Dummy function
    this.calcoverlay.setMap(this.map);

    // Set events
    google.maps.event.addListener(this.map, "click", this.onMapClick.bind(this));
    google.maps.event.addListener(this.map, "dblclick", this.onDblClick.bind(this));
    google.maps.event.addListener(this.map, "rightclick", this.onRightClick.bind(this));
    google.maps.event.addListener(this.map, "bounds_changed", this.onMoveEnd.bind(this));
    google.maps.event.addListener(this.map, "zoom_changed", this.onZoomEnd.bind(this));
    google.maps.event.addListener(this.map, "projection_changed", this.fireEvent.bind(this,"projectionchanged"));

    // Set map center and restriction bounds (this will check and the initial center as well and adjust it if necessary)
    this.setBounds($wh.GoogleMap.stringToBounds(this.options.restrictto));

    // Set controls and properties
    this.scrollwheel = this.options.scrollwheel;
    this.setMoveable(this.options.moveable);
    this.showcontrols = false;
    this.setShowControls(this.options.showcontrols);

    // Initialize marker manager
    if (this.options.markermanager != false)
    {
      this.markermanager = new MarkerManager(this.map, { borderPadding: this.iconsize
                                                       , trackMarkers: true
                                                       , maxZoom: 30
                                                       });
      google.maps.event.addListener(this.markermanager, 'loaded', this.onMarkerManagedLoaded.bind(this));
    }


    // Create Icon objects for this map's icon definitions
    if (this.options.icons)
      this.parseIcons(this.options.icons);

    // Create a directions service object for computing directions
    this.directionsservice = new google.maps.DirectionsService();
    this.directionsrenderer = null;

    // Use a timeout to delay calling the OnInitialized callback until after toddGM_Initialize has finished
    this.onidlehandle = google.maps.event.addListener(this.map, "idle", this.onFirstIdle.bind(this));
  }
, onFirstIdle:function()
  {
    google.maps.event.removeListener(this.onidlehandle);
    this.fireEvent("initialized",this);
    this.checkForNewOverlays();
  }

, deInit: function ()
  {
    // Clear event listeners
    google.maps.event.clearInstanceListeners(this.map);

    // Remove map markers
    this.destroyAllOverlays();

    // Remove controls
    this.controls.zoom.RemoveFromMap();
    this.controls.zoom.deInit();
  }

//ADDME: Update icons on current markers?
, parseIcons: function (icons)
  {
    for (var i = 0; i < icons.length; ++i)
    {
      // Create a new icon
      var iconwidth = icons[i].width ? icons[i].width : this.iconsize;
      var iconheight = icons[i].height ? icons[i].height : this.iconsize;
      var icon = { url: icons[i].icon
                 , size: new google.maps.Size(iconwidth, iconheight)
                 , anchor: new google.maps.Point(icons[i].anchorx, icons[i].anchory)
                 };
      if (icons[i].scaledwidth && icons[i].scaledheight)
        icon.scaledSize = new google.maps.Size(icons[i].scaledwidth, icons[i].scaledheight);
      if (icons[i].originx || icons[i].originy)
        icon.origin = new google.maps.Point(icons[i].originx || 0, icons[i].originy || 0);

      var shadow = null;
      if (icons[i].shadow)
      {
        var shadowwidth = icons[i].shadowwidth ? icons[i].shadowwidth : iconwidth;
        var shadowheight = icons[i].shadowheight ? icons[i].shadowheight : iconheight;
        var shadowx = typeof icons[i].shadowx != 'undefined'? icons[i].shadowx : icons[i].anchorx;
        var shadowy = typeof icons[i].shadowy != 'undefined' ? icons[i].shadowy : icons[i].anchory;

        shadow = { url: icons[i].shadow
                 , size: new google.maps.Size(shadowwidth, shadowheight)
                 , anchor: new google.maps.Point(shadowx, shadowy)
                 };
      }

      // InfoWindow offset, relative from top left position
      var infoOffset = new google.maps.Point(icons[i].popupx, icons[i].popupy);

      // The label offset is relative to the anchor point, so first count back to the top left corner, then add our label
      // position, which is relative to the top left corner.
      // To center the label, subtract half the label width from the left position.
      var labelOffset = new google.maps.Point(-(icons[i].labelx - icons[i].anchorx - 24), -(icons[i].labely - icons[i].anchory));

      this.icons.push({ name: icons[i].name.toUpperCase()
                      , icon: icon
                      , shadow: shadow
                      , labelOffset: labelOffset
                      , infoOffset: infoOffset
                      });
    }
  }

, getIcon: function (name)
  {
    if (typeof name != "string")
      name = "";

    // Names are stored in uppercase (case-insensitive name search)
    name = name.toUpperCase();
    for (var i = 0; i < this.icons.length; ++i)
      if (this.icons[i].name == name)
        return this.icons[i];

    // Not found, return the Google default marker icon
    return null;
  }

, getMapType: function (maptype)
  {
    switch (maptype)
    {
      case "satellite":
        return google.maps.MapTypeId.SATELLITE;
      case "hybrid":
        return google.maps.MapTypeId.HYBRID;
      case "physical":
        return google.maps.MapTypeId.TERRAIN;
    }
    return google.maps.MapTypeId.ROADMAP;
  }

, updateControls: function()
  {
    if(this.controls.zoom)
      this.controls.zoom.RemoveFromMap();

    if (this.showcontrols)
    {
      if (this.moveable)
      {
        if(!this.controls.zoom)
          this.controls.zoom = new $wh.GoogleMap.NavControl(this);

        this.controls.zoom.addToMap(this.map);
      }
    }
  }


///////////////////////////////////////////////////////////////////////////////
// Marker manager^2 - dont have us worry about the 'loaded' event
, markermgrisloaded:false
, pendingmarkers: []

, onMarkerManagedLoaded:function()
  {
    this.markermgrisloaded=true;
    this.pendingmarkers.each(function(marker) { this.markermanager.addMarker(marker,0)}.bind(this));
    this.pendingmarkers=[];
  }
, addMarkerToManager:function(marker)
  {
    if(this.markermgrisloaded)
      this.markermanager.addMarker(marker, 0);
    else
      this.pendingmarkers.push(marker);
  }
, removeMarkerFromManager:function(marker)
  {
    if(this.markermgrisloaded)
      this.markermanager.removeMarker(marker);
    else
      this.pendingmarkers.erase(marker);
  }

///////////////////////////////////////////////////////////////////////////////
// Overlays

, checkOverlay: function(overlay, original)
{
  if(overlay.latlng && (typeof overlay.lat == 'undefined' || typeof overlay.lng == 'undefined'))
  {
    var parsed = overlay.latlng.split(',');
    overlay.lat = parseFloat(parsed[0]);
    overlay.lng = parseFloat(parsed[1]);
  }

  var type = original ? original.type : overlay.type;

  //no further checks when simply updating (ADDME any syntax check syou still need, add above)
  if(original)
    return overlay;

  if (typeof overlay.rowkey == "undefined" || typeof overlay.type == "undefined")
    return null;

  switch (type)
  {
    case "marker":
    {
      // Check for required fields
      if (typeof overlay.lat == "undefined" || typeof overlay.lng == "undefined")
        return null;

      // Add missing optional fields
      if (typeof overlay.icon == "undefined")
        overlay.icon = "";
      overlay.toddicon = this.getIcon(overlay.icon);
      if (typeof overlay.hint == "undefined")
        overlay.hint = "";
      if (typeof overlay.moveable == "undefined")
        overlay.moveable = false;
      if (typeof overlay.selectable == "undefined")
        overlay.selectable = false;
      if (typeof overlay.rowkeys == "undefined" || overlay.rowkeys.length < 1)
        overlay.rowkeys = [ overlay.rowkey ];
      if (typeof overlay.drop == "undefined")
        overlay.drop = false;
    } break;
    case "polygon":
    case "polyline":
    {
      // Check for required fields
      if (typeof overlay.latlngs == "undefined")
        return null;

      // Add missing optional fields
      if (typeof overlay.outlinewidth == "undefined")
        overlay.outlinewidth = 1;
      if (typeof overlay.outlinecolor == "undefined" || overlay.outlinecolor == "")
        overlay.outlinecolor = this.options.shapecolor;
      if (typeof overlay.outlineopacity == "undefined" || overlay.outlineopacity > 100)
        overlay.outlineopacity = 100;
      else if (overlay.outlineopacity < 0)
        overlay.outlineopacity = 0;
      if (overlay.type == "polygon")
      {
        if ((typeof overlay.reflat != "undefined" && typeof overlay.reflng == "undefined")
          || (typeof overlay.reflng != "undefined" && typeof overlay.reflat == "undefined"))
          return null;
        if (typeof overlay.fillcolor == "undefined" || overlay.fillcolor == "")
          overlay.fillcolor = this.options.shapecolor;
        if (typeof overlay.fillopacity == "undefined" || overlay.fillopacity > 100)
          overlay.fillopacity = 100;
        else if (overlay.fillopacity < 0)
          overlay.fillopacity = 0;
      }
      if (typeof overlay.selectable == "undefined")
        overlay.selectable = false;
    } break;
    default:
    {
      return null;
    }
  }

  return overlay;
}

, getMarkerOptionsForOverlay:function (overlay)
  {
    var markeroptions = { position: new google.maps.LatLng(overlay.lat, overlay.lng)
                        , title: overlay.hint
                        , draggable: overlay.moveable
                        , clickable: !!(overlay.selectable || overlay.overlayhtml || overlay.overlay)
                        , optimized: overlay.optimized !== false
                        };

    // A default icon is used if the supplied icon does exist
    var defaulticon = !overlay.toddicon;
    if (!defaulticon)
    {
      if (overlay.toddicon.icon)
        markeroptions.icon = overlay.toddicon.icon;
      if (overlay.toddicon.shadow)
        markeroptions.shadow = overlay.toddicon.shadow;

      // Set extra options if this is a labeled marker
      if (overlay.rowkeys.length > 1 || overlay.label)
      {
        markeroptions.draggable = false;
        markeroptions.labelContent = overlay.label;
        if (overlay.rowkeys.length != 1)
          markeroptions.labelContent = overlay.rowkeys.length.toString();
        markeroptions.labelClass = "toddMarkerLabel toddExtFontSettings";
        markeroptions.labelAnchor = overlay.toddicon.labelOffset;
      }

    }
    if(typeof overlay.zindex == "number")
      markeroptions.zIndex = overlay.zindex;

    return markeroptions;
  }

, createMarkerForOverlay: function(overlay)
  {
    if (overlay.type != "marker")
      return null;

    // Create a Marker (single, unlabeled overlay) or LabeledMarker (clustered overlay or overlay with label) object
    var marker = null;
    var markeroptions = this.getMarkerOptionsForOverlay(overlay);
    if (markeroptions.labelContent)
      marker = new MarkerWithLabel(markeroptions);
    else
      marker = new google.maps.Marker(markeroptions);

    // Set references
    marker.todd = overlay;
    overlay.marker = marker;

    // Set events (using 'self' construction instead of function bind to preserve original this in callbacks)
    var self = this;
    if (markeroptions.clickable)
    {
      google.maps.event.addListener(marker, "click", function(event)
      {
        var latlng;
        if(event)
        {
          latlng = event.latLng;
        }
        else
        { //fallback if triggered by js (then no event data is send)
          // like: google.maps.event.trigger(mapobj.map.overlays[c].marker,'click');
          var markerpos = marker.getPosition();
          latlng = new google.maps.LatLng(markerpos.lat, markerpos.lng);
        }

        // event may be a Google Maps MouseEvent when clicked on the marker, or a DOM MouseEvent when clicked on the label
        if (latlng)
          self.onOverlayClick(latlng, this.todd);
        else if(event)
          self.onOverlayClick(self.pointToLatLng(event), this.todd);
      });
    }
    if (overlay.selectable)
      google.maps.event.addListener(marker, "dblclick", function(event)
      {
        // event may be a Google Maps MouseEvent when clicked on the marker, or a DOM MouseEvent when clicked on the label
        if (event.latLng)
          self.onOverlayDblClick(event.latLng, this.todd);
        else
          self.onOverlayDblClick(self.pointToLatLng(event), this.todd);
      });
    google.maps.event.addListener(marker, "rightclick", function(event) { self.onOverlayRightClick(event.latLng, this.todd); });
    if (markeroptions.draggable)
    {
      google.maps.event.addListener(marker, "dragstart", function(event) { self.onOverlayDragStart(event.latLng, this.todd); });
      google.maps.event.addListener(marker, "dragend", function(event) { self.onOverlayDragEnd(event.latLng, this.todd); });
    }

    return marker;
  }

, getShapeOptionsForOverlay: function (overlay)
  {
    // Create an array of LatLng objects
    var latlngs = [];
    for (var i = 0; i < overlay.latlngs.length; ++i)
      latlngs.push(new google.maps.LatLng((overlay.reflat ? overlay.reflat : 0.0) + overlay.latlngs[i].lat, (overlay.reflng ? overlay.reflng : 0.0) + overlay.latlngs[i].lng));

    var shapeoptions = { path: latlngs
                       , strokeColor: overlay.outlinecolor
                       , strokeWeight: overlay.outlinewidth
                       , strokeOpacity: overlay.outlineopacity / 100
                       , clickable: overlay.selectable
                       , draggable: overlay.moveable
                       };
    switch (overlay.type)
    {
      case "polygon":
      {
        shapeoptions.fillColor = overlay.fillcolor;
        shapeoptions.fillOpacity = overlay.fillopacity / 100;
      } break;
    }
    return shapeoptions;
  }

, createShapeForOverlay: function (overlay)
  {
    if (overlay.type != "polygon" && overlay.type != "polyline")
      return null;

    // Create a Polygon or Polyline object
    var shape = null;
    var shapeoptions = this.getShapeOptionsForOverlay(overlay);
    switch (overlay.type)
    {
      case "polygon":
        shape = new google.maps.Polygon(shapeoptions);
        break;
      case "polyline":
        shape = new google.maps.Polyline(shapeoptions);
        break;
    }

    // Set references
    shape.todd = overlay;
    overlay.shape = shape;

    // Set events
    var self = this;
    if (overlay.selectable)
    {
      google.maps.event.addListener(shape, "click", function(event) { self.onOverlayClick(event.latLng, overlay); });
      google.maps.event.addListener(shape, "dblclick", function(event) { self.onOverlayDblClick(event.latLng, overlay); });
    }
    if (overlay.moveable)
    {
      google.maps.event.addListener(shape, "dragstart", function(event) { self.onOverlayDragStart(event.latLng, overlay); });
      google.maps.event.addListener(shape, "dragend", function(event) { self.onOverlayDragEnd(event.latLng, overlay); });
    }

    return shape;
  }

  //NOTE: JS callers should use UpdateAllOverlays
, addOverlay: function(overlay)
  {
    overlay = this.checkOverlay(overlay, null);

    switch (overlay.type)
    {
      case "marker":
      {
        // Create a marker and add it to the map
        var marker = this.createMarkerForOverlay(overlay);
        if (this.markermanager)
          this.addMarkerToManager(marker);
        else
        {
          marker.setMap(this.map);
          if(overlay.drop)
            marker.setAnimation(google.maps.Animation.DROP);
        }
      } break;
      case "polygon":
      case "polyline":
      {
        // Create a shape and add it to the map
        var shape = this.createShapeForOverlay(overlay);
        shape.setMap(this.map);
      } break;
    }

    // Add the overlay
    this.overlays.push(overlay);
  }

, getOverlayById: function(rowkey)
  {
    for (var i = 0; i < this.overlays.length; ++i)
      if (this.overlays[i].rowkey == rowkey)
      {
        return this.overlays[i];
      }
    return null;
  }

, bounceOverlayPin:function(overlay, numbounces)
  {
    overlay.marker.setAnimation(google.maps.Animation.BOUNCE);
    //each bounce is 750ms so try to estimate the right amoun o ftime
    (function() { overlay.marker.setAnimation(null) }).delay(750*(numbounces>0?numbounces:1) - 375);
  }

, updateMapOverlay: function (overlay)
  {
    switch (overlay.type)
    {
      case "marker":
      {
        if (overlay.marker)
        {
          var markeroptions = this.getMarkerOptionsForOverlay(overlay);
          if (markeroptions.labelContent)
          {
            //ADDME: MarkerWithLabel (or more precisely, MarkerLabel_) doesn't support setOptions, so we'll just remove the current
            //       marker and add a new one with the updated properties
            this.destroyOverlay(overlay.rowkey);
            this.addOverlay(overlay);
          }
          else
          {
            overlay.marker.setOptions(markeroptions);
          }
        }
      } break;
      case "polygon":
      case "polyline":
      {
        if (overlay.shape)
        {
          this.destroyOverlay(overlay.rowkey);
          this.addOverlay(overlay);
        }
      } break;
    }
  }

, destroyOverlay: function(rowkey)
  {
    for (var i = 0; i < this.overlays.length; ++i)
    {
      var overlay = this.overlays[i];
      if (overlay.rowkey == rowkey)
      {
        switch (overlay.type)
        {
          case "marker":
          {
            // Clear events
            google.maps.event.clearInstanceListeners(overlay.marker);
            // Break circular reference
            overlay.marker.todd = null;
            // Remove marker from map
            if (this.markermanager)
              this.removeMarkerFromManager(overlay.marker);
            else
              overlay.marker.setMap(null);
            // Remove overlay from list of overlays
            this.overlays.splice(i, 1);
            return;
          }
          case "polygon":
          case "polyline":
          {
            // Clear events
            google.maps.event.clearInstanceListeners(overlay.shape);
            // Break circular reference
            overlay.shape.todd = null;
            // Remove shape from map
            overlay.shape.setMap(null);
            // Remove overlay from list of overlays
            this.overlays.splice(i, 1);
            return;
          }
        }
      }
    }
  }

, destroyAllOverlays: function ()
  {
    while (this.overlays.length)
      this.destroyOverlay(this.overlays[0].rowkey);
  }


///////////////////////////////////////////////////////////////////////////////
// Directions

, makeTravelMode:function (name)
  {
    switch (name)
    {
      case "bicycling":
        return google.maps.TravelMode.BICYCLING;
      case "walking":
        return google.maps.TravelMode.WALKING;
    }
    return google.maps.TravelMode.DRIVING;
  }

, getTravelModeName: function (mode)
  {
    switch (mode)
    {
      case google.maps.TravelMode.BICYCLING:
        return "bicycling";
      case google.maps.TravelMode.DRIVING:
        return "driving";
      case google.maps.TravelMode.WALKING:
        return "walking";
    }
    return "";
  }

  // location may either be a string, which is used as a geocoding query (like "dorpsstraat, ons dorp"), a { lat, lng } record
  // or a Google LatLng object
, locationToDirectionPoint: function (location, query_permitted)
  {
    if (query_permitted && typeof location == "string")
      return location;
    if (typeof location == "object")
    {
      if (location instanceof google.maps.LatLng)
        return location;
      if (location.lat && location.lng)
        return new google.maps.LatLng(location.lat, location.lng);
    }
  }

  /* latlngs: Array of LatLng objects, [lat,lng] objects, or query strings. The first locations will be used as origin, the last
              location will be used as destination, and the other locations will be used as waypoints.
     options: { travelmode:             "driving" // Travel mode (one of "driving", "bicycling" or "walking")
              , avoidhighways:          false     // If highways should be avoided
              , avoidtolls:             false     // If tollways should be avoided
              , overlay_icon:           ""        // The icon to use for waypoints when rendering the route
              , overlay_outlinewidth:   1         // The width of route polyline
              , overlay_outlinecolor:   ""        // The color of route polyline (defaults to default map shape color)
              , overlay_outlineopacity: 100       // The opacity (percentage) of route polyline
              , draggable:              true      // If the route can be modified by the user
              , nodisplay:              false     // Set to true if the route should not be rendered on the map
              , withinstructions:       false     // Set to true if HTML instruction should be provided to the callback function
              }
  */
, loadDirections: function (latlngs, options)
  {
    this.clearDirections();
    if (!latlngs || latlngs.length < 2)
      return;

    var origin = this.locationToDirectionPoint(latlngs[0], true);
    var destination = this.locationToDirectionPoint(latlngs[latlngs.length - 1], true);
    if (!origin || !destination)
      return;

    var waypoints = [];
    for (var num = latlngs.length - 1, i = 1; i < num; ++i)
    {
      var point = this.locationToDirectionPoint(latlngs[i]);
      if (point)
        waypoints.push({ location: point, stopover: true });
    }

    this.directionsoptions = options;
    if (!this.directionsoptions)
      this.directionsoptions = {};
    var request = { origin: origin
                  , waypoints: waypoints
                  , destination: destination
                  , travelMode: this.makeTravelMode(this.directionsoptions.travelmode)
                  , avoidHighways: this.directionsoptions.avoidhighways === true
                  , avoidTolls: this.directionsoptions.avoidtolls === true
                  , unitSystem: google.maps.UnitSystem.METRIC
                  };
    this.directionsoptions.travelmode = this.getTravelModeName(request.travelMode);
    this.directionsservice.route(request, this.OnDirectionsCalculated.bind(this));
  }

, clearDirections: function (latlngs, options)
  {
    if (this.directionsrenderer)
    {
      this.directionsrenderer.setMap(null);
      this.directionsrenderer = null;
    }
    this.directionsoptions = null;
  }

, getDirections: function (travelmode)
  {
    if (!this.directionsrenderer)
      return null;

    if (this.directionsrenderer.getDirections().routes.length)
    {
      var routeindex = this.directionsrenderer.getRouteIndex();
      // If the route is not shown on the map, we'll just use the first route
      if (typeof routeindex != "number")
        routeindex = 0;
      var route = this.directionsrenderer.getDirections().routes[routeindex];

      // Get waypoints, distance and duration from calculated route
      var waypoints = [];
      var distance = 0, duration = 0;
      var instructions = [];
      for (var num = route.legs.length, i = 0; i < num; ++i)
      {
        var leg = route.legs[i];

        // If this is the first leg, add the start location as well (for other legs, the start location is the end location of
        // the previous leg)
        if (i == 0)
          waypoints.push({ lat: leg.start_location.lat(), lng: leg.start_location.lng() });

        for (var n = leg.via_waypoints.length, j = 0; j < n; ++j)
          waypoints.push({ lat: leg.via_waypoints[j].lat(), lng: leg.via_waypoints[j].lng() });
        waypoints.push({ lat: leg.end_location.lat(), lng: leg.end_location.lng() });

        distance += leg.distance.value; // Distance in meters
        duration += leg.duration.value; // Duration in seconds

        for (var n = leg.steps.length, j = 0; j < n; ++j)
        {
          var step = leg.steps[j];
          instructions.push({ text: step.instructions
                            , duration: step.duration.value
                            , duration_text: step.duration.text
                            , distance: step.distance.value
                            , distance_text: step.distance.text
                            });
        }
      }

      // Get lat/lng coordinates from calculated route polyline
      var latlngs = [];
      for (var num = route.overview_path.length, i = 0; i < num; ++i)
        latlngs.push({ lat: route.overview_path[i].lat(), lng: route.overview_path[i].lng() });

      var directions = { waypoints: waypoints
                       , latlngs: latlngs
                       , distance: distance
                       , duration: duration
                       , copyrights: route.copyrights
                       , warnings: route.warnings
                       };

      if (this.directionsoptions.withinstructions)
        directions.instructions = instructions;
      return directions;
    }
  }

, OnDirectionsCalculated: function (result, status)
  {
    // The route directions are calculated, render the route
    if (status == google.maps.DirectionsStatus.OK)
    {
      // Set marker options to use the supplied icon
      var markeroptions = this.getMarkerOptionsForOverlay({ toddicon: this.getIcon(this.directionsoptions.overlay_icon)
                                                          , rowkeys: []
                                                          });

      // Set polyline options to use the supplied outline properties
      if (typeof this.directionsoptions.overlay_outlinewidth == "undefined")
        this.directionsoptions.overlay_outlinewidth = 1;
      if (typeof this.directionsoptions.overlay_outlinecolor == "undefined" || this.directionsoptions.overlay_outlinecolor == "")
        this.directionsoptions.overlay_outlinecolor = this.options.shapecolor;
      if (typeof this.directionsoptions.overlay_outlineopacity == "undefined" || this.directionsoptions.overlay_outlineopacity > 100)
        this.directionsoptions.overlay_outlineopacity = 100;
      else if (this.directionsoptions.overlay_outlineopacity < 0)
        this.directionsoptions.overlay_outlineopacity = 0;
      var polylineoptions = this.getShapeOptionsForOverlay({ latlngs: []
                                                           , outlinecolor: this.directionsoptions.overlay_outlinecolor
                                                           , outlinewidth: this.directionsoptions.overlay_outlinewidth
                                                           , outlineopacity: this.directionsoptions.overlay_outlineopacity
                                                           , type: "polyline"
                                                           });

      // Create a renderer and render the directions
      this.directionsrenderer = new google.maps.DirectionsRenderer({ draggable: this.directionsoptions.draggable !== false
                                                                   , suppressBicyclingLayer: true
                                                                   , suppressInfoWindows: true
                                                                   , markerOptions: markeroptions
                                                                   , polylineOptions: polylineoptions
                                                                   });
      if (!this.directionsoptions.nodisplay)
        this.directionsrenderer.setMap(this.map);
      google.maps.event.addListener(this.directionsrenderer, "directions_changed", this.OnDirectionsRendered.bind(this, status));
      this.directionsrenderer.setDirections(result);
    }
    else
      this.fireEvent("directions", [status]); // No route found, return status only
  }

, OnDirectionsRendered: function (status)
  {
    // The route is rendered or re-rendered (if the user dragged a waypoint), retrieve waypoints and polyline latlngs

    this.fireEvent("directions", [status, this.getDirections()]);
  }


  ///////////////////////////////////////////////////////////////////////////////
  // Bounds

, zoomToOverlays: function (restrict, max_zoom)
  {
    // Create a bounds object
    var bounds = new google.maps.LatLngBounds();

    // Add the location of each overlay to the bounds
    for (var i = 0; i < this.overlays.length; ++i)
      bounds.extend(new google.maps.LatLng(this.overlays[i].lat, this.overlays[i].lng));

    this.map.fitBounds(bounds); // fixes the zooming not working correct if map is not visible/was not visible initially

    // Extend the bounds with icon margin (to fully show icons at bounds border)
    bounds = this.getMapIconBounds(bounds);

    // Fit the bounds object with all overlays
    this.map.fitBounds(bounds);
    if (max_zoom && this.map.getZoom() > max_zoom)
      this.map.setZoom(max_zoom);

    // Restrict to the found bounds
    if (restrict)
      this.setBounds(max_zoom ? this.map.getBounds() : bounds);
  }

, setBounds: function (bounds)
  {
    if (bounds != this.bounds)
    {
      // Set new restriction bounds
      this.bounds = bounds;
      if (this.movelistener)
      {
        google.maps.event.removeListener(this.movelistener);
        this.movelistener = null;
      }

      // Calculate minimum zoomlevel to fit at most the bounds
      this.restrictzoom = 0;
      if (this.bounds)
      {
        // Get map span (lat en lng represent height and width)
        var mapspan = this.map.getBounds().toSpan();
        var maplat = mapspan.lat();
        var maplng = mapspan.lng();
        // Get map zoom
        var mapzoom = this.map.getZoom();
        // Get bounds span (lat en lng represent height and width)
        var boundsspan = this.bounds.toSpan();
        var boundslat = boundsspan.lat();
        var boundslng = boundsspan.lng();

        // Now we will try to fit the map view within the restriction bounds
        if (maplat > boundslat || maplng > boundslng)
        {
          // Either the map's lat or lng do not fit within the bounds, zoom in (decrease map area) until the map fits
          while (maplat > boundslat || maplng > boundslng)
          {
            // With each zoom level, the map's area is divided by 4 (each side is halved)
            ++mapzoom;
            maplat = maplat / 2;
            maplng = maplng / 2;
          }
          // We have a zoom level that fits the whole map
          this.restrictzoom = mapzoom;
        }
        else if (maplat < boundslat && maplng < boundslng)
        {
          // The whole map fits within the bounds, to find the minimum zoom level try to zoom out until it does not fit anymore
          while (mapzoom >= 0 && (maplat < boundslat && maplng < boundslng))
          {
            --mapzoom;
            maplat = maplat * 2;
            maplng = maplng * 2;
          }
          // With this zoomlevel the map does not fit anymore, so our restriction zoom level is the previous level
          this.restrictzoom = mapzoom + 1;
        }
        else
        {
          // The map area equals the restriction bounds area, use the map's current zoom level as restriction zoom level
          this.restrictzoom = mapzoom;
        }

        this.movelistener = google.maps.event.addListener(this.map, "drag", this.checkBounds.bind(this));
        this.map.setOptions({ minZoom: this.restrictzoom });
      }
      else
        this.map.setOptions({ minZoom: 0 });

      // Check map for new bounds
      this.checkBounds();
    }
  }

, fitBounds: function(bounds)
  {
    // If restriction bounds defined, don't update viewport
    if (this.bounds)
      return;

    this.map.fitBounds(bounds);
  }

  // Check whether a specific point is visible
, isPointVisible: function(latlng)
  {
    return this.map.getBounds().contains($wh.GoogleMap.stringToLatLng(latlng));
  }

  // Restrict movement of the map to the given bounds
  // Inspired by http://www.ios-solutions.de/files/google_api_restricted_bounds.html
, checkBounds: function ()
  {
    // No restriction bounds defined, no need to check
    if (!this.bounds)
      return;

    // Check if the current map bounds are within the restriction bounds
    var mapbounds = this.map.getBounds();
    if (this.bounds.contains(mapbounds.getNorthEast()) && this.bounds.contains(mapbounds.getSouthWest()))
      return;

    if (this.map.getZoom() < this.restrictzoom)
      this.map.setZoom(this.restrictzoom);

    // If somehow the map area is greater than the bounds area, just center the map and return
    var mapspan = this.map.getBounds().toSpan();
    var boundsspan = this.bounds.toSpan();
    if (mapspan.lat() >= boundsspan.lat() || mapspan.lng() >= boundsspan.lng())
    {
      // Don't move the map if it is already centered (within certain roundoff margins)
      if (!this.map.getCenter().equals(this.bounds.getCenter()))
        this.map.setCenter(this.bounds.getCenter());
      return;
    }

    // Current map bounds and dimensions
    var offsetlat = mapspan.lat() / 2;
    var offsetlng = mapspan.lng() / 2;

    // Current lat and lng
    var mapcenter = this.map.getCenter();
    var lat = mapcenter.lat();
    var lng = mapcenter.lng();

    // Restriction maximum and minimum lat and lng values
    var maxlat = this.bounds.getNorthEast().lat();
    var maxlng = this.bounds.getNorthEast().lng();
    var minlat = this.bounds.getSouthWest().lat();
    var minlng = this.bounds.getSouthWest().lng();

    // Adjust lat and lng to place map bounds within restriction bounds
    if ((lat - offsetlat) < minlat)
      lat = minlat + offsetlat;
    else if ((lat + offsetlat) > maxlat)
      lat = maxlat - offsetlat;
    if ((lng - offsetlng) < minlng)
      lng = minlng + offsetlng;
    else if ((lng + offsetlng) > maxlng)
      lng = maxlng - offsetlng;

    // Move map to new lat and lng
    var newcenter = new google.maps.LatLng(lat, lng);
    if (!mapcenter.equals(newcenter))
      this.map.setCenter(newcenter);
  }

  // Get the map bounds, extended with an marker icon sized padding, or extend the given bounds
, getMapIconBounds: function (bounds)
  {
    // Get the map center and convert it to a pixel point
    var center = this.map.getCenter();
    var point = this.latLngToPixel(center);
    // Move it iconsize pixels to the north east and convert back to latitude/longitude
    point.x += this.iconsize; // Move to the east
    point.y -= this.iconsize; // Move to the north
    var latlng = this.pixelToLatLng(point);
    // Get the latitude and longitude difference between the center and our icon point
    var diflat = latlng.lat() - center.lat();
    var diflng = latlng.lng() - center.lng();

    // Create a new bounds object by extending the current map bounds or reference bounds
    if (!bounds)
      bounds = this.map.getBounds();
    var sw = new google.maps.LatLng(bounds.getSouthWest().lat() - diflat, bounds.getSouthWest().lng() - diflng);
    var ne = new google.maps.LatLng(bounds.getNorthEast().lat() + diflat, bounds.getNorthEast().lng() + diflng);
    return new google.maps.LatLngBounds(sw, ne);
  }
, getZoom:function()
  {
    return this.map.getZoom();
  }

, getFullScreen:function()
  {
    return this.fullscreenholder != null;
  }
, toggleFullScreen:function(forcevalue)
  {
    var toresize = this.fullscreenholder ? this.fullscreenholder.firstChild : this.container.getSelfOrParent('.-wh-googlemaps-fullscreenholder, .wh-googlemaps-fullscreenholder');
    if(!toresize)
    {
      console.error("The fullscreen button requires the map container to be (inside) a '.wh-googlemaps-fullscreenholder', as that is the container we will move");
      return;
    }

    var newvalue = typeof forcevalue == 'boolean' ? forcevalue : this.fullscreenholder == null;
    if(newvalue == (this.fullscreenholder != null))
      return;

    var latlng = this.map.getCenter();

    if(this.fullscreenholder)
    {
      this.originalparent.insertBefore(toresize, this.originalnextsibling);
      document.body.removeChild(this.fullscreenholder);

      this.fullscreenholder=null;
      this.originalparent=null;
      this.originalnextsibling=null;
    }
    else
    {
      this.originalparent=toresize.parentNode;
      this.originalnextsibling=toresize.nextSibling;

      this.fullscreenholder = new Element("div", { styles: { "position":"fixed"
                                                           , "top":0
                                                           , "bottom":0
                                                           , "left":0
                                                           , "right":0
                                                           , "display":"block"
                                                           , "z-index":this.options.fullscreenzindex
                                                           }
                                                 }).inject(document.body).adopt(toresize);
    }

    toresize.toggleClass("isfullscreen", this.fullscreenholder != null);

    google.maps.event.trigger(this.map, 'resize');
    this.map.setCenter(latlng);

    this.fireEvent(this.fullscreenholder ? "enterfullscreen" : "exitfullscreen", { target:this } );
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Info window

, openInfoWindow: function (overlay)
  {
    if(overlay.overlayhtml)
    {
      if(this.currentinfowindow)
      {
        if(this.currentopenoverlay == overlay)
          return;

        this.currentinfowindow.destroy();
      }

      this.currentinfowindow = new $wh.GoogleMap.CustomOverlay(this, {lat: overlay.lat, lng:overlay.lng, visible:true });
      this.currentopenoverlay = overlay;
      this.currentinfowindow.anchornode.set('html', overlay.overlayhtml);
      this.currentinfowindow.anchornode.addEvent('click', function(event) { event.stopPropagation() }); //prevent clicks on the info window from closing it

      this.fireEvent("openedoverlay", {target:this, overlay: overlay, infowindow: this.currentinfowindow, anchornode: this.currentinfowindow.anchornode });
    }
  }

, closeInfoWindow: function ()
  {
    if(this.currentinfowindow)
    {
      this.currentinfowindow.destroy();
      this.currentinfowindow=null;
      this.currentopenoverlay=null;
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Helper functions

, offsetCenter: function(offsetx,offsety,latlng)
  {
    // offsetx is the distance you want that point to move to the right, in pixels
    // offsety is the distance you want that point to move upwards, in pixels
    // offset can be negative

    if(!latlng)
      latlng = this.map.getCenter();

    var scale = Math.pow(2, this.map.getZoom());
    var nw = new google.maps.LatLng(
      this.map.getBounds().getNorthEast().lat(),
      this.map.getBounds().getSouthWest().lng()
    );

    var worldCoordinateCenter = this.map.getProjection().fromLatLngToPoint(latlng);
    var pixelOffset = new google.maps.Point((offsetx/scale) || 0,(offsety/scale) || 0)

    var worldCoordinateNewCenter = new google.maps.Point(
      worldCoordinateCenter.x - pixelOffset.x,
      worldCoordinateCenter.y + pixelOffset.y
    );

    var newCenter = this.map.getProjection().fromPointToLatLng(worldCoordinateNewCenter);

    this.map.panTo(newCenter);
  }

, latLngToPixel: function (latlng)
  {
    return this.calcoverlay.getProjection().fromLatLngToContainerPixel(latlng);
  }

, pixelToLatLng: function (pixel)
  {
    return this.calcoverlay.getProjection().fromContainerPixelToLatLng(pixel);
  }

, pointToLatLng: function (point)
  {
    return this.map.mapTypes[this.map.getMapTypeId()].projection.fromPointToLatLng(point);
  }


  ///////////////////////////////////////////////////////////////////////////////
  // Functions called by Tollium

, setMapType: function (type)
  {
    var maptype = this.getMapType(type);
    if (maptype)
      this.map.setMapTypeId(maptype);
  }

, setCenter: function (pos, noanimate)
  {
    var latlng = $wh.GoogleMap.stringToLatLng(pos);
    if (latlng)
    {
      if (!noanimate)
        this.map.panTo(latlng);
      else
        this.map.setCenter(latlng);
    }
  }

, panBy:function(x,y)
  {
    this.map.panBy(x,y);
  }

, setZoom: function (zoom)
  {
    this.map.setZoom(zoom);
  }

, setRestrictTo: function (restrictto)
  {
    this.setBounds($wh.GoogleMap.stringToBounds(restrictto));
  }

, setViewport: function(viewport)
  {
    this.fitBounds($wh.GoogleMap.stringToBounds(viewport));
  }

, setMoveable: function (moveable)
  {
    if (moveable != this.moveable)
    {
      this.moveable = moveable;
      this.map.setOptions({ draggable: this.moveable
                          , scrollwheel: this.scrollwheel && this.moveable
                          });
    }
  }

, setShowControls: function (showcontrols)
  {
    if (showcontrols != this.showcontrols)
    {
      this.showcontrols = showcontrols;
      this.updateControls();
    }
  }

, updateAllOverlays: function (overlays)
  {
    if(!this.map) //ADDME perhaps we should allow this and delay our own init ?
      throw "updateAllOverlays invoked before 'initialized' event";

    // Add/update incoming overlays
    var added = [];
    for (var i = 0; i < overlays.length; ++i)
    {
      if (this.getOverlayById(overlays[i].rowkey))
        this.updateOverlay(overlays[i]);
      else
        this.addOverlay(overlays[i]);
      added.push(overlays[i]);
    }

    // Remove obsolete overlays
    var todelete = [];
    for (var i = 0; i < this.overlays.length; ++i)
    {
      var j;
      for (j = 0; j < added.length; ++j)
        if (this.overlays[i].rowkey == added[j].rowkey)
          break;
      if (j >= added.length)
        todelete.push(this.overlays[i]);
    }
    for (var i = 0; i < todelete.length; ++i)
      this.destroyOverlay(todelete[i].rowkey);
  }

, updateOverlay: function (updated_overlay)
  {
    var overlay = this.getOverlayById(updated_overlay.rowkey);
    var newoverlay = this.checkOverlay(updated_overlay, overlay);
    if (!newoverlay)
      return;

    if (overlay)
    {

      // Update overlay properties
      var changed = false;
      for (var p in overlay)
      {
        if (typeof newoverlay[p] != "undefined")
        {
          if (newoverlay[p] != overlay[p])
          {
            overlay[p] = newoverlay[p];
            changed = true;
          }
        }
      }

      // If anything changed, update the overlay
      if (changed)
      {
        this.updateMapOverlay(overlay);
      }
    }
  }

, zoomIn: function()
  {
    this.map.setZoom(this.map.getZoom() + 1);
  }
, zoomOut: function()
  {
    this.map.setZoom(this.map.getZoom() - 1);
  }
, panUp: function ()
  {
    this.map.panBy(0, -this.map.getDiv().offsetHeight / 2);
  }
, panDown: function ()
  {
    this.map.panBy(0, this.map.getDiv().offsetHeight / 2);
  }
, panLeft: function()
  {
    this.map.panBy(-this.map.getDiv().offsetWidth / 2, 0);
  }
, panRight: function()
  {
    this.map.panBy(this.map.getDiv().offsetWidth / 2, 0);
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Map callback functions

, onMapClick: function (event)
  {
    //What are the clicked pixel coordinates ?
    this.closeInfoWindow();
    this.fireEvent("click", [event.latLng]);

  }

, onDblClick: function (event)
  {
    this.fireEvent("dblclick", [event.latLng]);
  }

, onRightClick: function (event)
  {
    this.fireEvent("rightclick", [event.latLng, this.latLngToPixel(event.latLng)]);
  }

, onMoveEnd: function ()
  {
    this.checkBounds();
    this.fireEvent("moveend");
    this.checkForNewOverlays();
  }

, onZoomEnd: function ()
  {
    this.fireEvent("zoomend");
    this.checkForNewOverlays();
  }

, onOverlayClick: function (latlng, overlay)
  {
    if (overlay.overlayhtml)
      this.openInfoWindow(overlay);
    if (overlay.selectable)
    {
      this.fireEvent("overlayclick", [overlay, latlng]);
    }
    if(overlay.overlay)
    {
      overlay.overlay.latlng = $wh.GoogleMap.latLngToString(latlng);
      overlay.overlay.setVisible(true);
    }
  }

, onOverlayDblClick: function (latlng, overlay)
  {
    this.fireEvent("overlaydblclick", [overlay, latlng]);
  }

, onOverlayRightClick: function (latlng, overlay)
  {
    this.fireEvent("overlayrightclick", [overlay, latlng, this.latLngToPixel(latlng)]);
  }

, onOverlayDragStart: function (latlng, overlay)
  {
    this.closeInfoWindow();
  }

, onOverlayDragEnd: function (latlng, overlay)
  {
    this.fireEvent("overlaydragend",[overlay, latlng]);
  }
});

///////////////////////////////////////////////////////////////////////////////
// Our todd navigation (zoom/move) control

$wh.GoogleMap.NavControl = new Class(
{ initialize: function(gmmap)
  {
    this.gmmap = gmmap;

    // Create a container for our buttons
    this.node = document.createElement("div");
    this.node.style.padding = "8px"
    this.node.style.textAlign = "center";

    this.buttons = {};

    // Create our buttons buttons and add them to the container
    this.buttons.goup =    this.createButton("map_goup",    this.gmmap.panUp.bind(this.gmmap), this.node);
    this.node.appendChild(document.createElement("br"));
    this.buttons.goleft =  this.createButton("map_goleft",  this.gmmap.panLeft.bind(this.gmmap), this.node);
    this.buttons.goright = this.createButton("map_goright", this.gmmap.panRight.bind(this.gmmap), this.node);
    this.node.appendChild(document.createElement("br"));
    this.buttons.godown =  this.createButton("map_godown",  this.gmmap.panDown.bind(this.gmmap), this.node);
    this.node.appendChild(document.createElement("br"));
    this.buttons.zoomin =  this.createButton("map_zoomin",  this.gmmap.zoomIn.bind(this.gmmap), this.node);
    if (this.buttons.zoomin)
      this.buttons.zoomin.style.marginTop = "6px";
    this.buttons.zoomout = this.createButton("map_zoomout", this.gmmap.zoomOut.bind(this.gmmap), this.node);
  }

, addToMap: function(map)
  {
    // Insert our button container in the map controls container
    this.map = map;
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.node);
  }
, removeFromMap:function()
  {
  }
, deInit:function()
  {
    this.buttons.each(google.maps.event.clearInstanceListeners);
  }
, createButton: function(buttonimage, callback, parent)
  {
    var url = this.gmmap.options.skin.geturl(buttonimage);
    if(!url)
      return null;

    var button = new Element("img", { width: 16
                                     , height:16
                                     , src: url
                                     , styles: {cursor:"pointer"
                                               }
                                     });

    google.maps.event.addDomListener(button, "click", callback);
    parent.appendChild(button);
    return button;
  }
});

$wh.GoogleMap.ApiLoader = new $wh.PreloadableAsset;
$wh.GoogleMap.ApiLoader.__finished = $wh.GoogleMap.ApiLoader.donePreload.bind($wh.GoogleMap.ApiLoader, true);
$wh.GoogleMap.ApiLoader.onStartPreload = function()
{
  var prot = location.protocol;
  if (!["http:","https:"].contains(prot))
    prot='https:';

  var scripturl = prot + '//maps.googleapis.com/maps/api/js?';
  if(this.apikey)
    scripturl+='key=' + encodeURIComponent(this.apikey) + '&';
  scripturl+='sensor=' + (this.sensor?"true":"false");

  if (this.language)
    scripturl += '&language=' + this.language;

  scripturl+='&callback=' + encodeURIComponent('$wh.GoogleMap.ApiLoader.__finished');

  var script = new Element("script", {src:scripturl
                                     ,type:"text/javascript"
                                     });
  $$('head,body').pick().adopt(script);
}

$wh.GoogleMap.CustomOverlay = new Class(
{ Implements: [Options]

, anchornode: null
, latlng:''
, gotaddcallback:false
, options: { pane: 'floatPane'
           , visible:false
           , latlng:null
           , lat:null
           , lng:null
           }
, visible:false

, initialize:function(map, options)
  {
    this.gmap = map;
    this.setOptions(options);
    this.latlng = this.options.latlng || (this.options.lat + ',' + this.options.lng);

    if(!['floatPane','floatShadow','mapPane','overlayImage','overlayLayer','overlayMouseTarget','overlayShadow'].contains(this.options.pane))
    {
      console.error("Invalid google map pane '" || this.options.pane || "'");
      this.options.pane = 'floatPane';
    }

    this.anchornode = new Element("div", {"styles": {"position":"absolute"}});
    this.setVisible(this.options.visible);
  }
, destroy:function()
  {
    this.setVisible(false);
  }
, setVisible:function(visibility)
  {
    if(this.visible == visibility)
      return;
    this.visible = visibility;
    if(this.visible)
    {
      this.overlayview = new google.maps.OverlayView();
      this.overlayview.onAdd = this.onAddCallback.bind(this);
      this.overlayview.onRemove = this.onRemoveCallback.bind(this);
      this.overlayview.draw = this.onDrawCallback.bind(this);
      this.overlayview.setMap(this.gmap.map);
    }
    else
    {
      this.overlayview.setMap(null);
      this.overlayview = null;
    }
  }
, onAddCallback:function()
  {
    if(!this.overlayview)
      return;

    this.gotaddcallback = true;
    this.overlayview.getPanes()[this.options.pane].appendChild(this.anchornode);

    if(this.latlng) //already got a position to add ourselves to
      this.addToMap(this.latlng);
  }
, onRemoveCallback:function()
  {
    if(!this.overlayview)
      return;

    this.gotaddcallback = false;
    this.anchornode.parentNode.removeChild(this.anchornode);
    this.overlayview=null;
  }
, addToMap:function(latlng)
  {
    this.latlng = latlng;
    if(!this.gotaddcallback || !this.overlayview)
      return;

    // Reposition the info window
    //var pos = this.getProjection().fromLatLngToDivPixel(this.overlay.marker.getPosition());
    this.onDrawCallback();
  }
, removeFromMap:function()
  {
    this.setVisible(false);
  }
, onDrawCallback:function()
  {
    if(!this.latlng || !this.overlayview)
      return;

    var pos = this.overlayview.getProjection().fromLatLngToDivPixel($wh.GoogleMap.stringToLatLng(this.latlng));
    this.anchornode.setStyles({top:pos.y, left:pos.x});
  }
});

$wh.GoogleMap.registerSkin=function(skinname, skinurl)
{
  $wh.GoogleMap.skins.push({name:skinname, geturl:skinurl});
};

$wh.GoogleMap.skins=[];

///////////////////////////////////////////////////////////////////////////////
// Maps support functions (JavaScript counterparts of module::google/support.whlib)

$wh.GoogleMap.stringToLatLng = function(coordinates)
{
  if (typeof coordinates == "string")
  {
    var parts = coordinates.split(",");
    if (parts.length == 2)
    {
      var lat = parseFloat(parts[0]);
      var lng = parseFloat(parts[1]);
      if (lat == lat && lng == lng)
        return new google.maps.LatLng(lat, lng);
    }
  }
}

$wh.GoogleMap.latLngToString = function(latlng)
{
  return latlng ? latlng.toUrlValue() : "";
}
$wh.GoogleMap.latLngToObj = function(latlng)
{
  var val = latlng ? latlng.toUrlValue() : "";
  return val ? { latlng: val, lat: parseFloat(val.split(',')[0]), lng: parseFloat(val.split(',')[1]) } : null;
}

$wh.GoogleMap.stringToBounds = function (coordinates)
{
  if (typeof coordinates == "string")
  {
    var parts = coordinates.split(";");
    if (parts.length == 2)
    {
      var sw = $wh.GoogleMap.stringToLatLng(parts[0]);
      var ne = $wh.GoogleMap.stringToLatLng(parts[1]);
      if (sw && ne)
        return new google.maps.LatLngBounds(sw, ne);
    }
  }
}

$wh.GoogleMap.boundsToString = function (bounds)
{
  return bounds ? bounds.getSouthWest().toUrlValue() + ";" + bounds.getNorthEast().toUrlValue() : "";
}

})();
/*! AFTER: maps.js !*/

/* B-Lex changes:

   - clustered icons now have a class "clusteredicon"
   - the text content of these clustered icons is now in a new <span> in the icon-div
*/





(function(){

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @externs_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/maps/google_maps_api_v3_3.js
// ==/ClosureCompiler==

/**
 * @name MarkerClusterer for Google Maps v3
 * @version version 1.0
 * @author Luke Mahe
 * @fileoverview
 * The library creates and manages per-zoom-level clusters for large amounts of
 * markers.
 * <br/>
 * This is a v3 implementation of the
 * <a href="http://gmaps-utility-library-dev.googlecode.com/svn/tags/markerclusterer/"
 * >v2 MarkerClusterer</a>.
 */

/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * A Marker Clusterer that clusters markers.
 *
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>=} opt_markers Optional markers to add to
 *   the cluster.
 * @param {Object=} opt_options support the following options:
 *     'gridSize': (number) The grid size of a cluster in pixels.
 *     'maxZoom': (number) The maximum zoom level that a marker can be part of a
 *                cluster.
 *     'zoomOnClick': (boolean) Whether the default behaviour of clicking on a
 *                    cluster is to zoom into it.
 *     'averageCenter': (boolean) Wether the center of each cluster should be
 *                      the average of all markers in the cluster.
 *     'minimumClusterSize': (number) The minimum number of markers to be in a
 *                           cluster before the markers are hidden and a count
 *                           is shown.
 *     'styles': (object) An object that has style properties:
 *       'url': (string) The image url.
 *       'height': (number) The image height.
 *       'width': (number) The image width.
 *       'anchor': (Array) The anchor position of the label text.
 *       'textColor': (string) The text color.
 *       'textSize': (number) The text size.
 *       'backgroundPosition': (string) The position of the backgound x, y.
 * @constructor
 * @extends google.maps.OverlayView
 */
function MarkerClusterer(map, opt_markers, opt_options) {
  // MarkerClusterer implements google.maps.OverlayView interface. We use the
  // extend function to extend MarkerClusterer with google.maps.OverlayView
  // because it might not always be available when the code is defined so we
  // look for it at the last possible moment. If it doesn't exist now then
  // there is no point going ahead :)
  this.extend(MarkerClusterer, google.maps.OverlayView);
  this.map_ = map;

  /**
   * @type {Array.<google.maps.Marker>}
   * @private
   */
  this.markers_ = [];

  /**
   *  @type {Array.<Cluster>}
   */
  this.clusters_ = [];

  this.sizes = [53, 56, 66, 78, 90];

  /**
   * @private
   */
  this.styles_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.ready_ = false;

  var options = opt_options || {};

  /**
   * @type {number}
   * @private
   */
  this.gridSize_ = options['gridSize'] || 60;

  /**
   * @private
   */
  this.minClusterSize_ = options['minimumClusterSize'] || 2;


  /**
   * @type {?number}
   * @private
   */
  this.maxZoom_ = options['maxZoom'] || null;

  this.styles_ = options['styles'] || [];

  /**
   * @type {string}
   * @private
   */
  this.imagePath_ = options['imagePath'] ||
      this.MARKER_CLUSTER_IMAGE_PATH_;

  /**
   * @type {string}
   * @private
   */
  this.imageExtension_ = options['imageExtension'] ||
      this.MARKER_CLUSTER_IMAGE_EXTENSION_;

  /**
   * @type {boolean}
   * @private
   */
  this.zoomOnClick_ = true;

  if (options['zoomOnClick'] != undefined) {
    this.zoomOnClick_ = options['zoomOnClick'];
  }

  /**
   * @type {boolean}
   * @private
   */
  this.averageCenter_ = false;

  if (options['averageCenter'] != undefined) {
    this.averageCenter_ = options['averageCenter'];
  }

  this.setupStyles_();

  this.setMap(map);

  /**
   * @type {number}
   * @private
   */
  this.prevZoom_ = this.map_.getZoom();

  // Add the map event listeners
  var that = this;
  google.maps.event.addListener(this.map_, 'zoom_changed', function() {
    var zoom = that.map_.getZoom();

    if (that.prevZoom_ != zoom) {
      that.prevZoom_ = zoom;
      that.resetViewport();
    }
  });

  google.maps.event.addListener(this.map_, 'idle', function() {
    that.redraw();
  });

  // Finally, add the markers
  if (opt_markers && opt_markers.length) {
    this.addMarkers(opt_markers, false);
  }
}


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_PATH_ =
    'http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/' +
    'images/m';


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_EXTENSION_ = 'png';


/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
MarkerClusterer.prototype.extend = function(obj1, obj2) {
  return (function(object) {
    for (var property in object.prototype) {
      this.prototype[property] = object.prototype[property];
    }
    return this;
  }).apply(obj1, [obj2]);
};


/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.onAdd = function() {
  this.setReady_(true);
};

/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.draw = function() {};

/**
 * Sets up the styles object.
 *
 * @private
 */
MarkerClusterer.prototype.setupStyles_ = function() {
  if (this.styles_.length) {
    return;
  }

  for (var i = 0, size; size = this.sizes[i]; i++) {
    this.styles_.push({
      url: this.imagePath_ + (i + 1) + '.' + this.imageExtension_,
      height: size,
      width: size
    });
  }
};

/**
 *  Fit the map to the bounds of the markers in the clusterer.
 */
MarkerClusterer.prototype.fitMapToMarkers = function() {
  var markers = this.getMarkers();
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0, marker; marker = markers[i]; i++) {
    bounds.extend(marker.getPosition());
  }

  this.map_.fitBounds(bounds);
};


/**
 *  Sets the styles.
 *
 *  @param {Object} styles The style to set.
 */
MarkerClusterer.prototype.setStyles = function(styles) {
  this.styles_ = styles;
};


/**
 *  Gets the styles.
 *
 *  @return {Object} The styles object.
 */
MarkerClusterer.prototype.getStyles = function() {
  return this.styles_;
};


/**
 * Whether zoom on click is set.
 *
 * @return {boolean} True if zoomOnClick_ is set.
 */
MarkerClusterer.prototype.isZoomOnClick = function() {
  return this.zoomOnClick_;
};

/**
 * Whether average center is set.
 *
 * @return {boolean} True if averageCenter_ is set.
 */
MarkerClusterer.prototype.isAverageCenter = function() {
  return this.averageCenter_;
};


/**
 *  Returns the array of markers in the clusterer.
 *
 *  @return {Array.<google.maps.Marker>} The markers.
 */
MarkerClusterer.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 *  Returns the number of markers in the clusterer
 *
 *  @return {Number} The number of markers.
 */
MarkerClusterer.prototype.getTotalMarkers = function() {
  return this.markers_.length;
};


/**
 *  Sets the max zoom for the clusterer.
 *
 *  @param {number} maxZoom The max zoom level.
 */
MarkerClusterer.prototype.setMaxZoom = function(maxZoom) {
  this.maxZoom_ = maxZoom;
};


/**
 *  Gets the max zoom for the clusterer.
 *
 *  @return {number} The max zoom level.
 */
MarkerClusterer.prototype.getMaxZoom = function() {
  return this.maxZoom_;
};


/**
 *  The function for calculating the cluster icon image.
 *
 *  @param {Array.<google.maps.Marker>} markers The markers in the clusterer.
 *  @param {number} numStyles The number of styles available.
 *  @return {Object} A object properties: 'text' (string) and 'index' (number).
 *  @private
 */
MarkerClusterer.prototype.calculator_ = function(markers, numStyles) {
  var index = 0;
  var count = markers.length;
  var dv = count;
  while (dv !== 0) {
    dv = parseInt(dv / 10, 10);
    index++;
  }

  index = Math.min(index, numStyles);
  return {
    text: count,
    index: index
  };
};


/**
 * Set the calculator function.
 *
 * @param {function(Array, number)} calculator The function to set as the
 *     calculator. The function should return a object properties:
 *     'text' (string) and 'index' (number).
 *
 */
MarkerClusterer.prototype.setCalculator = function(calculator) {
  this.calculator_ = calculator;
};


/**
 * Get the calculator function.
 *
 * @return {function(Array, number)} the calculator function.
 */
MarkerClusterer.prototype.getCalculator = function() {
  return this.calculator_;
};


/**
 * Add an array of markers to the clusterer.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarkers = function(markers, opt_nodraw) {
  for (var i = 0, marker; marker = markers[i]; i++) {
    this.pushMarkerTo_(marker);
  }
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Pushes a marker to the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.pushMarkerTo_ = function(marker) {
  marker.isAdded = false;
  if (marker['draggable']) {
    // If the marker is draggable add a listener so we update the clusters on
    // the drag end.
    var that = this;
    google.maps.event.addListener(marker, 'dragend', function() {
      marker.isAdded = false;
      that.repaint();
    });
  }
  this.markers_.push(marker);
};


/**
 * Adds a marker to the clusterer and redraws if needed.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarker = function(marker, opt_nodraw) {
  this.pushMarkerTo_(marker);
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Removes a marker and returns true if removed, false if not
 *
 * @param {google.maps.Marker} marker The marker to remove
 * @return {boolean} Whether the marker was removed or not
 * @private
 */
MarkerClusterer.prototype.removeMarker_ = function(marker) {
  var index = -1;
  if (this.markers_.indexOf) {
    index = this.markers_.indexOf(marker);
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        index = i;
        break;
      }
    }
  }

  if (index == -1) {
    // Marker is not in our list of markers.
    return false;
  }

  marker.setMap(null);

  this.markers_.splice(index, 1);

  return true;
};


/**
 * Remove a marker from the cluster.
 *
 * @param {google.maps.Marker} marker The marker to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 * @return {boolean} True if the marker was removed.
 */
MarkerClusterer.prototype.removeMarker = function(marker, opt_nodraw) {
  var removed = this.removeMarker_(marker);

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  } else {
   return false;
  }
};


/**
 * Removes an array of markers from the cluster.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 */
MarkerClusterer.prototype.removeMarkers = function(markers, opt_nodraw) {
  var removed = false;

  for (var i = 0, marker; marker = markers[i]; i++) {
    var r = this.removeMarker_(marker);
    removed = removed || r;
  }

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  }
};


/**
 * Sets the clusterer's ready state.
 *
 * @param {boolean} ready The state.
 * @private
 */
MarkerClusterer.prototype.setReady_ = function(ready) {
  if (!this.ready_) {
    this.ready_ = ready;
    this.createClusters_();
  }
};


/**
 * Returns the number of clusters in the clusterer.
 *
 * @return {number} The number of clusters.
 */
MarkerClusterer.prototype.getTotalClusters = function() {
  return this.clusters_.length;
};


/**
 * Returns the google map that the clusterer is associated with.
 *
 * @return {google.maps.Map} The map.
 */
MarkerClusterer.prototype.getMap = function() {
  return this.map_;
};


/**
 * Sets the google map that the clusterer is associated with.
 *
 * @param {google.maps.Map} map The map.
 */
MarkerClusterer.prototype.setMap = function(map) {
  this.map_ = map;
};


/**
 * Returns the size of the grid.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getGridSize = function() {
  return this.gridSize_;
};


/**
 * Sets the size of the grid.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setGridSize = function(size) {
  this.gridSize_ = size;
};


/**
 * Returns the min cluster size.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getMinClusterSize = function() {
  return this.minClusterSize_;
};

/**
 * Sets the min cluster size.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setMinClusterSize = function(size) {
  this.minClusterSize_ = size;
};


/**
 * Extends a bounds object by the grid size.
 *
 * @param {google.maps.LatLngBounds} bounds The bounds to extend.
 * @return {google.maps.LatLngBounds} The extended bounds.
 */
MarkerClusterer.prototype.getExtendedBounds = function(bounds) {
  var projection = this.getProjection();

  // Turn the bounds into latlng.
  var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getNorthEast().lng());
  var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
      bounds.getSouthWest().lng());

  // Convert the points to pixels and the extend out by the grid size.
  var trPix = projection.fromLatLngToDivPixel(tr);
  trPix.x += this.gridSize_;
  trPix.y -= this.gridSize_;

  var blPix = projection.fromLatLngToDivPixel(bl);
  blPix.x -= this.gridSize_;
  blPix.y += this.gridSize_;

  // Convert the pixel points back to LatLng
  var ne = projection.fromDivPixelToLatLng(trPix);
  var sw = projection.fromDivPixelToLatLng(blPix);

  // Extend the bounds to contain the new bounds.
  bounds.extend(ne);
  bounds.extend(sw);

  return bounds;
};


/**
 * Determins if a marker is contained in a bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @param {google.maps.LatLngBounds} bounds The bounds to check against.
 * @return {boolean} True if the marker is in the bounds.
 * @private
 */
MarkerClusterer.prototype.isMarkerInBounds_ = function(marker, bounds) {
  return bounds.contains(marker.getPosition());
};


/**
 * Clears all clusters and markers from the clusterer.
 */
MarkerClusterer.prototype.clearMarkers = function() {
  this.resetViewport(true);

  // Set the markers a empty array.
  this.markers_ = [];
};


/**
 * Clears all existing clusters and recreates them.
 * @param {boolean} opt_hide To also hide the marker.
 */
MarkerClusterer.prototype.resetViewport = function(opt_hide) {
  // Remove all the clusters
  for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
    cluster.remove();
  }

  // Reset the markers to not be added and to be invisible.
  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    marker.isAdded = false;
    if (opt_hide) {
      marker.setMap(null);
    }
  }

  this.clusters_ = [];
};

/**
 *
 */
MarkerClusterer.prototype.repaint = function() {
  var oldClusters = this.clusters_.slice();
  this.clusters_.length = 0;
  this.resetViewport();
  this.redraw();

  // Remove the old clusters.
  // Do it in a timeout so the other clusters have been drawn first.
  window.setTimeout(function() {
    for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
      cluster.remove();
    }
  }, 0);
};


/**
 * Redraws the clusters.
 */
MarkerClusterer.prototype.redraw = function() {
  this.createClusters_();
};


/**
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @private
*/
MarkerClusterer.prototype.distanceBetweenPoints_ = function(p1, p2) {
  if (!p1 || !p2) {
    return 0;
  }

  var R = 6371; // Radius of the Earth in km
  var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
  var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};


/**
 * Add a marker to a cluster, or creates a new cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.addToClosestCluster_ = function(marker) {
  var distance = 40000; // Some large number
  var clusterToAddTo = null;
  var pos = marker.getPosition();
  for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
    var center = cluster.getCenter();
    if (center) {
      var d = this.distanceBetweenPoints_(center, marker.getPosition());
      if (d < distance) {
        distance = d;
        clusterToAddTo = cluster;
      }
    }
  }

  if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
    clusterToAddTo.addMarker(marker);
  } else {
    var cluster = new Cluster(this);
    cluster.addMarker(marker);
    this.clusters_.push(cluster);
  }
};


/**
 * Creates the clusters.
 *
 * @private
 */
MarkerClusterer.prototype.createClusters_ = function() {
  if (!this.ready_) {
    return;
  }

  // Get our current map view bounds.
  // Create a new bounds object so we don't affect the map.
  var mapBounds = new google.maps.LatLngBounds(this.map_.getBounds().getSouthWest(),
      this.map_.getBounds().getNorthEast());
  var bounds = this.getExtendedBounds(mapBounds);

  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
      this.addToClosestCluster_(marker);
    }
  }
};


/**
 * A cluster that contains markers.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
function Cluster(markerClusterer) {
  this.markerClusterer_ = markerClusterer;
  this.map_ = markerClusterer.getMap();
  this.gridSize_ = markerClusterer.getGridSize();
  this.minClusterSize_ = markerClusterer.getMinClusterSize();
  this.averageCenter_ = markerClusterer.isAverageCenter();
  this.center_ = null;
  this.markers_ = [];
  this.bounds_ = null;
  this.clusterIcon_ = new ClusterIcon(this, markerClusterer.getStyles(),
      markerClusterer.getGridSize());
}

/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.isMarkerAlreadyAdded = function(marker) {
  if (this.markers_.indexOf) {
    return this.markers_.indexOf(marker) != -1;
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Add a marker the cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @return {boolean} True if the marker was added.
 */
Cluster.prototype.addMarker = function(marker) {
  if (this.isMarkerAlreadyAdded(marker)) {
    return false;
  }

  if (!this.center_) {
    this.center_ = marker.getPosition();
    this.calculateBounds_();
  } else {
    if (this.averageCenter_) {
      var l = this.markers_.length + 1;
      var lat = (this.center_.lat() * (l-1) + marker.getPosition().lat()) / l;
      var lng = (this.center_.lng() * (l-1) + marker.getPosition().lng()) / l;
      this.center_ = new google.maps.LatLng(lat, lng);
      this.calculateBounds_();
    }
  }

  marker.isAdded = true;
  this.markers_.push(marker);

  var len = this.markers_.length;
  if (len < this.minClusterSize_ && marker.getMap() != this.map_) {
    // Min cluster size not reached so show the marker.
    marker.setMap(this.map_);
  }

  if (len == this.minClusterSize_) {
    // Hide the markers that were showing.
    for (var i = 0; i < len; i++) {
      this.markers_[i].setMap(null);
    }
  }

  if (len >= this.minClusterSize_) {
    marker.setMap(null);
  }

  this.updateIcon();
  return true;
};


/**
 * Returns the marker clusterer that the cluster is associated with.
 *
 * @return {MarkerClusterer} The associated marker clusterer.
 */
Cluster.prototype.getMarkerClusterer = function() {
  return this.markerClusterer_;
};


/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 */
Cluster.prototype.getBounds = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
  var markers = this.getMarkers();
  for (var i = 0, marker; marker = markers[i]; i++) {
    bounds.extend(marker.getPosition());
  }
  return bounds;
};


/**
 * Removes the cluster
 */
Cluster.prototype.remove = function() {
  this.clusterIcon_.remove();
  this.markers_.length = 0;
  delete this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {number} The cluster center.
 */
Cluster.prototype.getSize = function() {
  return this.markers_.length;
};


/**
 * Returns the center of the cluster.
 *
 * @return {Array.<google.maps.Marker>} The cluster center.
 */
Cluster.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {google.maps.LatLng} The cluster center.
 */
Cluster.prototype.getCenter = function() {
  return this.center_;
};


/**
 * Calculated the extended bounds of the cluster with the grid.
 *
 * @private
 */
Cluster.prototype.calculateBounds_ = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
  this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
};


/**
 * Determines if a marker lies in the clusters bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Cluster.prototype.isMarkerInClusterBounds = function(marker) {
  return this.bounds_.contains(marker.getPosition());
};


/**
 * Returns the map that the cluster is associated with.
 *
 * @return {google.maps.Map} The map.
 */
Cluster.prototype.getMap = function() {
  return this.map_;
};


/**
 * Updates the cluster icon
 */
Cluster.prototype.updateIcon = function() {
  var zoom = this.map_.getZoom();
  var mz = this.markerClusterer_.getMaxZoom();

  if (mz && zoom > mz) {
    // The zoom is greater than our max zoom so show all the markers in cluster.
    for (var i = 0, marker; marker = this.markers_[i]; i++) {
      marker.setMap(this.map_);
    }
    return;
  }

  if (this.markers_.length < this.minClusterSize_) {
    // Min cluster size not yet reached.
    this.clusterIcon_.hide();
    return;
  }

  var numStyles = this.markerClusterer_.getStyles().length;
  var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
  this.clusterIcon_.setCenter(this.center_);
  this.clusterIcon_.setSums(sums);
  this.clusterIcon_.show();
};


/**
 * A cluster icon
 *
 * @param {Cluster} cluster The cluster to be associated with.
 * @param {Object} styles An object that has style properties:
 *     'url': (string) The image url.
 *     'height': (number) The image height.
 *     'width': (number) The image width.
 *     'anchor': (Array) The anchor position of the label text.
 *     'textColor': (string) The text color.
 *     'textSize': (number) The text size.
 *     'backgroundPosition: (string) The background postition x, y.
 * @param {number=} opt_padding Optional padding to apply to the cluster icon.
 * @constructor
 * @extends google.maps.OverlayView
 * @ignore
 */
function ClusterIcon(cluster, styles, opt_padding) {
  cluster.getMarkerClusterer().extend(ClusterIcon, google.maps.OverlayView);

  this.styles_ = styles;
  this.padding_ = opt_padding || 0;
  this.cluster_ = cluster;
  this.center_ = null;
  this.map_ = cluster.getMap();
  this.div_ = null;
  this.sums_ = null;
  this.visible_ = false;

  this.setMap(this.map_);
}


/**
 * Triggers the clusterclick event and zoom's if the option is set.
 */
ClusterIcon.prototype.triggerClusterClick = function() {
  var markerClusterer = this.cluster_.getMarkerClusterer();

  // Trigger the clusterclick event.
  google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_);

  if (markerClusterer.isZoomOnClick()) {
    // Zoom into the cluster.
    this.map_.fitBounds(this.cluster_.getBounds());
  }
};


/**
 * Adding the cluster icon to the dom.
 * @ignore
 */
ClusterIcon.prototype.onAdd = function() {
  this.div_ = document.createElement('DIV');
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.className = "clusteredicon"; // B-Lex addition

    // B-Lex additions: move the number to its own container
    var textcontainer = new Element("span", { "html": this.sums_.text
                                            , "class": "nr"
                                            });
    this.div_.adopt(textcontainer);
    //this.div_.innerHTML = this.sums_.text;
    // .. end ..
  }

  var panes = this.getPanes();
  panes.overlayMouseTarget.appendChild(this.div_);

  var that = this;
  google.maps.event.addDomListener(this.div_, 'click', function() {
    that.triggerClusterClick();
  });
};


/**
 * Returns the position to place the div dending on the latlng.
 *
 * @param {google.maps.LatLng} latlng The position in latlng.
 * @return {google.maps.Point} The position in pixels.
 * @private
 */
ClusterIcon.prototype.getPosFromLatLng_ = function(latlng) {
  var pos = this.getProjection().fromLatLngToDivPixel(latlng);
  pos.x -= parseInt(this.width_ / 2, 10);
  pos.y -= parseInt(this.height_ / 2, 10);
  return pos;
};


/**
 * Draw the icon.
 * @ignore
 */
ClusterIcon.prototype.draw = function() {
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.top = pos.y + 'px';
    this.div_.style.left = pos.x + 'px';
  }
};


/**
 * Hide the icon.
 */
ClusterIcon.prototype.hide = function() {
  if (this.div_) {
    this.div_.style.display = 'none';
  }
  this.visible_ = false;
};


/**
 * Position and show the icon.
 */
ClusterIcon.prototype.show = function() {
  if (this.div_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.style.display = '';
  }
  this.visible_ = true;
};


/**
 * Remove the icon from the map
 */
ClusterIcon.prototype.remove = function() {
  this.setMap(null);
};


/**
 * Implementation of the onRemove interface.
 * @ignore
 */
ClusterIcon.prototype.onRemove = function() {
  if (this.div_ && this.div_.parentNode) {
    this.hide();
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};


/**
 * Set the sums of the icon.
 *
 * @param {Object} sums The sums containing:
 *   'text': (string) The text to display in the icon.
 *   'index': (number) The style index of the icon.
 */
ClusterIcon.prototype.setSums = function(sums) {
  this.sums_ = sums;
  this.text_ = sums.text;
  this.index_ = sums.index;
  if (this.div_) {
    this.div_.innerHTML = sums.text;
  }

  this.useStyle();
};


/**
 * Sets the icon to the the styles.
 */
ClusterIcon.prototype.useStyle = function() {
  var index = Math.max(0, this.sums_.index - 1);
  index = Math.min(this.styles_.length - 1, index);
  var style = this.styles_[index];
  this.url_ = style['url'];
  this.height_ = style['height'];
  this.width_ = style['width'];
  this.textColor_ = style['textColor'];
  this.anchor_ = style['anchor'];
  this.textSize_ = style['textSize'];
  this.backgroundPosition_ = style['backgroundPosition'];
};


/**
 * Sets the center of the icon.
 *
 * @param {google.maps.LatLng} center The latlng to set as the center.
 */
ClusterIcon.prototype.setCenter = function(center) {
  this.center_ = center;
};


/**
 * Create the css text based on the position of the icon.
 *
 * @param {google.maps.Point} pos The position.
 * @return {string} The css style text.
 */
ClusterIcon.prototype.createCss = function(pos) {
  var style = [];
  style.push('background-image:url(' + this.url_ + ');');
  var backgroundPosition = this.backgroundPosition_ ? this.backgroundPosition_ : '0 0';
  style.push('background-position:' + backgroundPosition + ';');

  if (typeof this.anchor_ === 'object') {
    if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
        this.anchor_[0] < this.height_) {
      style.push('height:' + (this.height_ - this.anchor_[0]) +
          'px; padding-top:' + this.anchor_[0] + 'px;');
    } else {
      style.push('height:' + this.height_ + 'px; line-height:' + this.height_ +
          'px;');
    }
    if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
        this.anchor_[1] < this.width_) {
      style.push('width:' + (this.width_ - this.anchor_[1]) +
          'px; padding-left:' + this.anchor_[1] + 'px;');
    } else {
      style.push('width:' + this.width_ + 'px; text-align:center;');
    }
  } else {
    style.push('height:' + this.height_ + 'px; line-height:' +
        this.height_ + 'px; width:' + this.width_ + 'px; text-align:center;');
  }

  var txtColor = this.textColor_ ? this.textColor_ : 'black';
  var txtSize = this.textSize_ ? this.textSize_ : 11;

  style.push('cursor:pointer; top:' + pos.y + 'px; left:' +
      pos.x + 'px; color:' + txtColor + '; position:absolute; font-size:' +
      txtSize + 'px; font-family:Arial,sans-serif; font-weight:bold');
  return style.join('');
};


// Export Symbols for Closure
// If you are not going to compile with closure then you can remove the
// code below.
window['MarkerClusterer'] = MarkerClusterer;
MarkerClusterer.prototype['addMarker'] = MarkerClusterer.prototype.addMarker;
MarkerClusterer.prototype['addMarkers'] = MarkerClusterer.prototype.addMarkers;
MarkerClusterer.prototype['clearMarkers'] =
    MarkerClusterer.prototype.clearMarkers;
MarkerClusterer.prototype['fitMapToMarkers'] =
    MarkerClusterer.prototype.fitMapToMarkers;
MarkerClusterer.prototype['getCalculator'] =
    MarkerClusterer.prototype.getCalculator;
MarkerClusterer.prototype['getGridSize'] =
    MarkerClusterer.prototype.getGridSize;
MarkerClusterer.prototype['getExtendedBounds'] =
    MarkerClusterer.prototype.getExtendedBounds;
MarkerClusterer.prototype['getMap'] = MarkerClusterer.prototype.getMap;
MarkerClusterer.prototype['getMarkers'] = MarkerClusterer.prototype.getMarkers;
MarkerClusterer.prototype['getMaxZoom'] = MarkerClusterer.prototype.getMaxZoom;
MarkerClusterer.prototype['getStyles'] = MarkerClusterer.prototype.getStyles;
MarkerClusterer.prototype['getTotalClusters'] =
    MarkerClusterer.prototype.getTotalClusters;
MarkerClusterer.prototype['getTotalMarkers'] =
    MarkerClusterer.prototype.getTotalMarkers;
MarkerClusterer.prototype['redraw'] = MarkerClusterer.prototype.redraw;
MarkerClusterer.prototype['removeMarker'] =
    MarkerClusterer.prototype.removeMarker;
MarkerClusterer.prototype['removeMarkers'] =
    MarkerClusterer.prototype.removeMarkers;
MarkerClusterer.prototype['resetViewport'] =
    MarkerClusterer.prototype.resetViewport;
MarkerClusterer.prototype['repaint'] =
    MarkerClusterer.prototype.repaint;
MarkerClusterer.prototype['setCalculator'] =
    MarkerClusterer.prototype.setCalculator;
MarkerClusterer.prototype['setGridSize'] =
    MarkerClusterer.prototype.setGridSize;
MarkerClusterer.prototype['setMaxZoom'] =
    MarkerClusterer.prototype.setMaxZoom;
MarkerClusterer.prototype['onAdd'] = MarkerClusterer.prototype.onAdd;
MarkerClusterer.prototype['draw'] = MarkerClusterer.prototype.draw;

Cluster.prototype['getCenter'] = Cluster.prototype.getCenter;
Cluster.prototype['getSize'] = Cluster.prototype.getSize;
Cluster.prototype['getMarkers'] = Cluster.prototype.getMarkers;

ClusterIcon.prototype['onAdd'] = ClusterIcon.prototype.onAdd;
ClusterIcon.prototype['draw'] = ClusterIcon.prototype.draw;
ClusterIcon.prototype['onRemove'] = ClusterIcon.prototype.onRemove;

})();
