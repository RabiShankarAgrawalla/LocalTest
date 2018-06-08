IMap.getActiveServce=function()
{
	return ( typeof(L) === "undefined" ) ? null : new OpenStreetMapService();
}
function OpenStreetMapService(){
	
	var MapThis = this;
	
	var Oms = null;
	var LastKnownPosition = null;
	var Pins = [];//store all pin data

	var SelectedPin = null;
	var ToSelectPinScript = false;
	
	var LocateControl = null;
	var RouteControls = [];
	var	GeocoderService = null;

	var PinMarkers = [];
	var PinColors = [];
	
	var MapCanvas = null;

	var MapzenRouterKey = null;//Turn By Turn
	var MapzenGeocoderKey = null;//Mapzen Search
	
	var LastCustomPinObj = {};
	
	function existPinLabelName(routeLabel)
	{
		var num = parseInt(routeLabel);
		if( !isNaN(num)	 && (num >= 1 && num <= 30) )//supported max 30
			return ""+num;
		return "";
	}
	
	//mobile engine folder
	var defaultMapViewImageFolder = 'images/';
	
	function getPinImageUrl(color,routeLabel)
	{
		if(color==="62A0FF"){
			if(!routeLabel)
				return defaultMapViewImageFolder + "fixedPinMarker.png";
			else
				return defaultMapViewImageFolder + "routeFixedPinMarker" + existPinLabelName(routeLabel) + ".png";
		}else if(color==="FFFF00"){
			if(!routeLabel)
				return defaultMapViewImageFolder + "searchPinMarker.png";
			else
				return defaultMapViewImageFolder + "routeFixedPinMarker" + existPinLabelName(routeLabel) + ".png";
		}else{ //if(color==="FE7569"){
			if(!routeLabel)
				return defaultMapViewImageFolder + "normalPinMarker.png";
			else
				return defaultMapViewImageFolder + "routePinMarker" + existPinLabelName(routeLabel) + ".png";
		}
	}
	
	//var lastCenter = null;
	
	
	//options: zoom,mapViewImageFolder,RouterKey,GeocoderKey
	this.initializeMapCanvs = function(lat, lng, elementID, options){
		options = options || {};
		MapzenRouterKey = options.RouterKey;
		MapzenGeocoderKey = options.GeocoderKey;
		
		MapCanvas = L.map(elementID);
		var zoom = (typeof options.zoom === 'undefined' ? 11 : options.zoom);
		MapCanvas.setView(new L.LatLng(lat, lng), zoom);
		
		//host url protocol is https, pass url aslo must be https
		var tileLayerUrl;
		if( window.location.protocol === 'https:' )
			tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		else
			tileLayerUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		var layer = new L.TileLayer(tileLayerUrl, {
			attribution: '© OpenStreetMap'
		});
		MapCanvas.addLayer(layer);
		Oms = new OverlappingMarkerSpiderfier(MapCanvas);


		Oms.addListener('spiderfy', function(markers) {
			for (var i = 0; i < markers.length; i++){
				if(!ToSelectPinScript)
					markers[i].closePopup();
				if(markers[i]._draggable)
					markers[i].dragging.disable();
			}
			ToSelectPinScript = false;
		});
		
		Oms.addListener('unspiderfy', function(markers) {
			for (var i = 0; i < markers.length; i++){
				if(markers[i]._draggable)
					markers[i].dragging.enable();
			}
		});

		//lastCenter = MapCanvas.getCenter();
		
		if( options.mapViewImageFolder )
			defaultMapViewImageFolder = options.mapViewImageFolder;

		var pinColor = "FE7569" ;
		var fixedPinColor = "62A0FF" ;
		var searchPinColor = "FFFF00" ;
		var normalPinMarker = L.icon({
				iconUrl: getPinImageUrl( pinColor ),
				iconSize:	  [21, 34],
				iconAnchor:	  [10, 34], 
				popupAnchor:  [1, -34] 
		});
		var fixedPinMarker = L.icon({
				iconUrl: getPinImageUrl( fixedPinColor ),
				iconSize:	  [21, 34],
				iconAnchor:	  [10, 34], 
				popupAnchor:  [1, -34] 
		});
		var searchPinMarker = L.icon({
				iconUrl: getPinImageUrl( searchPinColor ),
				iconSize:	  [21, 34],
				iconAnchor:	  [10, 34], 
				popupAnchor:  [1, -34] 
		});

		PinMarkers[ IMap.Pin.PinType.NormalPin ] = normalPinMarker;
		PinMarkers[ IMap.Pin.PinType.FixedPin ] = fixedPinMarker;
		PinMarkers[ IMap.Pin.PinType.SearchPin ] = searchPinMarker;
		PinColors[ IMap.Pin.PinType.NormalPin ] = pinColor;
		PinColors[ IMap.Pin.PinType.FixedPin ] = fixedPinColor;
		PinColors[ IMap.Pin.PinType.SearchPin ] = searchPinColor;
		
		LastCustomPinObj.size = [21,34];
		LastCustomPinObj.anchor = [10,34];
		
		LocateControl = L.control.locate().addTo(MapCanvas);
		$("div.leaflet-control-locate").hide();
		MapCanvas.on('locationfound',	function(e) {
			LastKnownPosition = e.latlng;
		});
	}
	
	function getRouteMarker(routeLabel,pinColor)
	{
		var num = parseInt(routeLabel);
		if( !isNaN(num)	 && (num >= 10 && num <= 30) ){
			return L.icon({ // Because Marker only support one word label, we need to support two digit number, so we prepare static image to show
				iconUrl: getPinImageUrl(pinColor,routeLabel),
				iconSize:	  [21, 34],
				iconAnchor:	  [10, 34], 
				popupAnchor:  [1, -34] 
			});
		}else{
			return L.icon({ 
				iconUrl: getPinImageUrl(pinColor,routeLabel),
				iconSize:	  [21, 34],
				iconAnchor:	  [10, 34], 
				popupAnchor:  [1, -34] 
			});
		}
	}
			
	this.route = function(color, travelMode, routeId){
		if(!MapzenRouterKey){
			alert("Please configure Mapzen Turn By Turn key(RouterKey)");
			return;
		}
		if(Pins.length <= 1)
			return;
		if( travelMode == "WALKING" || travelMode == "TRANSIT" || travelMode == "BICYCLING" )
			alert("Only support travelMode:DRIVING");
		
		color = color || "#00FFFF";
		routeId = routeId || "";
		this.clearRoute(routeId);
		
		// Replace all pinMarker to routeMarker, except SearchPin 
		var dirPinsLen = Pins.length;
		var waypoints = [];
		var routeAutoSequenceId = 0;
		$.each(Pins, function(i, pinObj) {
			if( routeId && pinObj.routeId != routeId ){
				dirPinsLen--;
				return;
			}
			if( pinObj.pinType == IMap.Pin.PinType.SearchPin ){
				dirPinsLen--;
				return;
			}
			routeAutoSequenceId++;
			var pos = new L.LatLng(pinObj.lat,pinObj.lng);
			waypoints.push( pos );
			if( pinObj.pinType == IMap.Pin.PinType.CustomPin ){
				//custom pin don't need replace it
				if(pinObj.map_object)
					pinObj.map_object.dragging.disable();
				return;
			}
			MapCanvas.removeLayer(pinObj.map_object);
			var pinLabel = (pinObj.routePinLabel&&pinObj.routePinLabel.length > 0 ? pinObj.routePinLabel: routeAutoSequenceId);
			var pinImage = getRouteMarker( pinLabel, PinColors[pinObj.pinType]);
			
			pinObj.map_object = addPinMarker(pinObj,true,pos,pinObj.title,pinObj.description,pinImage,pinLabel);
		})
		
		
		var routeControl = L.Routing.control({
			  waypoints: waypoints,
			  draggableWaypoints: false,
			  addWaypoints: false,
			  routeWhileDragging: false,
			  autoRoute: false,
			  
			  suppressMarkers:true, //our supported options
			  
			  lineOptions:{ styles: [
				{color: 'black', opacity: 0.15, weight: 9},
				{color: 'white', opacity: 0.8, weight: 6},
				{color: color, opacity: 1, weight: 5}
			  ]},
			
			  // [...] See MapzenTurn-by-Turn API documentation for other options
			  router: L.Routing.mapzen(MapzenRouterKey, {costing:'auto'}),
			  formatter: new L.Routing.mapzenFormatter()

		}).addTo(MapCanvas);

		routeControl.route();
		routeControl.hide();
		$('.leaflet-routing-container-hide').hide();

		routeControl.routeId = routeId;
		RouteControls.push( routeControl );
	}
	
	this.clearRoute = function(routeId){
		if( routeId ) { //delete by routeId
			for(var i = RouteControls.length-1; i >= 0; i--){
				if ( RouteControls[i].routeId == routeId ){
					MapCanvas.removeControl(RouteControls[i]);
					RouteControls[i] = null;
					RouteControls.splice(i,1);
					break;
				}
			}
		} else { //clear all
			for(var i = RouteControls.length-1; i >= 0; i--){
				if ( RouteControls[i] )
					MapCanvas.removeControl(RouteControls[i]);
				RouteControls[i] = null;
			}
			RouteControls.length=0;
		}
	}
	
	function addPinMarker(pinObj,isFixed,pos,title,description,pinImage,routeLabel){

		var pinMarker = L.marker(pos, {
			draggable: !isFixed,
			icon: pinImage
		}).addTo(MapCanvas);


		if (typeof title !== 'undefined' && typeof description !== 'undefined' && (title.length>0 || description.length>0) ){
			pinMarker.bindPopup('<b>' + title +	 '</b><br>' +  description );
		}

		if (!isFixed) {
			pinMarker.on('dragstart', function(e) {
				SelectedPin = pinObj;
			});

			pinMarker.on('dragend', function(e) {
				SelectedPin.lat = pinMarker.getLatLng().lat;
				SelectedPin.lng = pinMarker.getLatLng().lng;
			})
		}
		

		pinMarker.on('click', function(e) {
			SelectedPin = pinObj;
		});
		pinMarker._draggable = !isFixed;
		Oms.addMarker(pinMarker);

		pinObj.map_object = pinMarker;
		return pinMarker;
		
	}
	
	this.setupPinParameter = function(sizeX,sizeY,originX,originY,anchorX,anchorY){
		LastCustomPinObj.size = [sizeX,sizeY];
		LastCustomPinObj.origin = [originX,originY];
		LastCustomPinObj.anchor = [anchorX,anchorY];
	}
	
	
	function customPin2PinMarker(customPinUrl)
	{
		var customMarker = L.icon({ 
			iconUrl: 	customPinUrl,
			iconSize: 	[LastCustomPinObj.size[0], LastCustomPinObj.size[1]],
			iconAnchor: [LastCustomPinObj.anchor[0],LastCustomPinObj.anchor[1]],
			popupAnchor: [1, -LastCustomPinObj.size[1]] //alway take -sizeY 
		});
		return customMarker;
	}
	
	this.addPin = function(id, isFixed, lat, lng, centered, title, description, routePinLabel, customPinUrl, routeId, _pinType){
		_deletePin(id);//avoid duplicate id
		var pos = (centered)? MapCanvas.getCenter(): new L.LatLng(lat, lng);
		_pinType = _pinType || (isFixed? IMap.Pin.PinType.FixedPin : IMap.Pin.PinType.NormalPin);
		var pinImage;
		if( typeof customPinUrl === 'string' && customPinUrl.length > 0 ){
			pinImage = customPin2PinMarker(customPinUrl);
			_pinType = IMap.Pin.PinType.CustomPin;
		}else
			pinImage = PinMarkers[_pinType];
		var pinObj = new IMap.Pin(id, pos.lat, pos.lng, title, description, routePinLabel, _pinType, routeId);
		addPinMarker(pinObj,isFixed,pos,title,description,pinImage);
		
		Pins.push(pinObj);
	}

	this.followMyLocation = function(enable){
		enable = (enable === undefined ? true:enable);
		if( enable ){
			LocateControl.start();
		}else{
			LocateControl.stop();
			LastKnownPosition = null;
		}
	}
	
	this.getMyLocation = function(){
		var myPosition=null;
		if(LastKnownPosition){
			myPosition = {
				lat: LastKnownPosition.lat,
				lng: LastKnownPosition.lng
			};
		}
		return myPosition;
	}
	   
	this.clearPins = function(){
		for(var i = Pins.length-1; i >= 0; i--){
			if (Pins[i].map_object != null){
				Oms.removeMarker(Pins[i].map_object);
				MapCanvas.removeLayer(Pins[i].map_object);
			}
		}
		Oms.clearMarkers();
		Pins.length=0;
		SelectedPin=null;
	}
	
	function clearSearchResultsPins(){
		for(var i = Pins.length-1; i >= 0; i--){
			if (Pins[i].pinType == IMap.Pin.PinType.SearchPin){
				if( SelectedPin && SelectedPin.id == Pins[i].id)
					SelectedPin = null;
				Oms.removeMarker(Pins[i].map_object);
				MapCanvas.removeLayer(Pins[i].map_object);
				Pins.splice(i,1);
			}
		}
	}
	
	function _deletePin(id){
		var len = Pins.length;
		for(var i = 0; i < len; i++){
			if ( Pins[i].id === id) {
				if( SelectedPin && SelectedPin.id == id)
					SelectedPin = null;
				Oms.removeMarker(Pins[i].map_object);
				MapCanvas.removeLayer(Pins[i].map_object);
				Pins.splice(i,1);
				return true;
			}
		}
		return false;
	}
	
	this.deletePin = function(id){
		_deletePin(id);
	}
	
	this.selectPin = function(id){
		var pin = null;
		var len = Pins.length;
		for(var i = 0; i < len; i++){
			if ( Pins[i].id === id) {
				pin = Pins[i];
				break;
			}
		}
		if(pin){
			SelectedPin = pin;
			//SelectedPin.map_object.openPopup();
			ToSelectPinScript = true;
			SelectedPin.map_object.fire('click');
			var pos = SelectedPin.map_object.getLatLng();
			MapCanvas.panTo( new L.LatLng(pos.lat, pos.lng) );
		}
	}
	
	this.deleteSelectedPin = function(){
		if(SelectedPin)
			_deletePin(SelectedPin.id);
	}
	
	this.getPin = function(id){
		var pin = null;
		var len = Pins.length;
		for(var i = 0; i < len; i++){
			if ( Pins[i].id === id) {
				pin = Pins[i];
				break;
			}
		}
		if (pin)
			return [pin.output()];
		return null;
	}
	
	this.getPins = function(){
		var len = Pins.length;
		var outPins=[];
		for(var i=0;i<len;i++)
			outPins.push(Pins[i].output());
		return outPins;
	}
	
	this.getSelectedPin = function(){
		return SelectedPin?SelectedPin.output():null;
	}
	
	this.getCenter = function(){
		var center = MapCanvas.getCenter();
		return { lat: center.lat, lng: center.lng, zoom: MapCanvas.getZoom() };
	}
	
	this.setCenter = function(lat,lng,zoom,hasAnimate){
		zoom = zoom || MapCanvas.getZoom();
		if(hasAnimate)
			MapCanvas.panTo(new L.LatLng(lat, lng), zoom);
		else
			MapCanvas.setView(new L.LatLng(lat, lng), zoom);
		//lastCenter = MapCanvas.getCenter();
	}
	
	this.setZoom = function(zoom){
		MapCanvas.setZoom( zoom );
	}
	
	this.enableSatelliteMode = function(enable){
		if(enable)
			alert("The OpenStreetMap satellite map isn't support.")
	}
	
	function makeGeocoderService()
	{
		//host url protocol is https, pass url aslo must be https
		var serviceUrl;
		if( window.location.protocol === 'https:' )
			serviceUrl = 'https://search.mapzen.com/v1';
		else
			serviceUrl = 'http://search.mapzen.com/v1';
		return L.Control.Geocoder.mapzen(MapzenGeocoderKey,{ serviceUrl: serviceUrl });
	}
	
	this.searchLocation = function(locationNameOrAddress, maxCount, isFixed){
		
		if(!MapzenGeocoderKey){
			alert("Please configure Mapzen Search key(GeocoderKey)");
			IMap.CallbackFromJS('jsDone',"")
			return;
		}
		
		//it will return the first result in the list that matches with the address.
		if(!GeocoderService)
			GeocoderService = makeGeocoderService();
		
		clearSearchResultsPins();
		
		/* //TODO
		if(LastKnownPosition){
			var latLng=LastKnownPosition;
			var points = getRoundsFromPointRadius(latLng.lat(),latLng.lng(), 20 );
			var point1=toLatLng(points[0].lat(),points[0].lon());
			var point2=toLatLng(points[1].lat(),points[1].lon());
			var searchBounds = toBounds(point1,point2);
			geocoderRequest['bounds']=searchBounds;
		}
		*/
		GeocoderService.geocode(locationNameOrAddress, function (results){
			if (results.length > 0) {
				var location=results[0].center;
				maxCount = results.length > maxCount ? maxCount : results.length;
				var firstSearchPinID = null; 
				for(var i=0; i < maxCount; i++){
					location=results[i].center;
					var dispInfo=results[i].name;
					var id = 'FindPin'+(i+1);
					MapThis.addPin(id,isFixed,location.lat,location.lng,false,dispInfo,"",null,null,null,IMap.Pin.PinType.SearchPin);
					if(firstSearchPinID==null)
						firstSearchPinID = id;
				}
				MapCanvas.panTo(location);
				//lastCenter = MapCanvas.getCenter();
				if(firstSearchPinID)
					MapThis.selectPin(firstSearchPinID);
			}
			IMap.CallbackFromJS('jsDone',"");
		});
		
	};

	this.getLocation = function(lat, lng){
		
		if(!MapzenGeocoderKey){
			alert("Please configure Mapzen Search key(GeocoderKey)");
			IMap.CallbackFromJS('jsDone',"")
			return;
		}
		
		if(!GeocoderService)
			GeocoderService = makeGeocoderService();
			
		var latlng = {lat: lat, lng: lng};
		var scale = null;
		GeocoderService.reverse(latlng, scale, function(results) {
			var retResult = null;
			if (results.length > 0) { // found it
				var retArray = [];
				for (i = 0; i < results.length ; i++) {
					retArray.push( results[i].name );
				}
				retResult = retArray;
			}
			IMap.CallbackFromJS('jsDone', retResult);
		});
	};

	this.optimizeRoute = function(startPoint,endPoint,wayPoints,callback,color,optimize,customPinUrlX){
		alert("The OpenStreetMap optimize route isn't support.");
		IMap.CallbackFromJS('jsDone', null);
	};
	
	this.destroy = function(){
		if( MapCanvas ){
			this.followMyLocation(false);
			this.clearPins();
			this.clearRoute ();
			MapCanvas.remove();
			$('#' + MapCanvas.getContainer().id ).remove();
			//set null for inner variable
			MapThis = null;
			Oms = null;
			LastKnownPosition = null;
			Pins = null;
			SelectedPin = null;
			LocateControl = null;
			RouteControls = null
			GeocoderService = null;
			PinMarkers = null;
			PinColors = null;
			LastCustomPinObj = null;
		}
		MapCanvas = null;
	};
	
	//Support NP Office Map function
	this.getMapCanves = function(){
		return MapCanvas;
	};
	
	return this;
}
