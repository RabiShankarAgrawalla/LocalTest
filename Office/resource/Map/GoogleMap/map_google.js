IMap.getActiveServce=function()
{
	return ( typeof(google) === "undefined" ) ? null : new GoogleService();
}

function GoogleService(){
	var mapThis = this;
	
	var osm = null;
	var lastKnownPosition = null;
	var pins = [];//store all pin data
	var geoMarker = null;
	var selectedPin = null;
	var toSelectPinScript = false;

	var directionsDisplays = [];
	var directionsService = null;

	var geocoderService = null;
	var infoWindow = new google.maps.InfoWindow({
		//size: new google.maps.Size(50,50)
	});
	
	var pinMarkers = [];
	var pinColors = [];
	var pinZIndex = 0;
	var lastCustomPinObj = {};
	
	var mapCanvas = null;
	var officeEngineMapBehavior = false;

	function parseBool(b) {
	    return String(b).toLowerCase() === 'true';
	}

	function toLatLng(lat, lng) {
		return new google.maps.LatLng(lat, lng);
	}

	function toBounds(j,k) {
		var latMin, latMax, lngMin, lngMax;
		var sw, ne;

		latMin = Math.min(j.lat(), k.lat());
		latMax = Math.max(j.lat(), k.lat());

		lngMin = Math.min(j.lng(), k.lng());
		lngMax = Math.max(j.lng(), k.lng());

		sw = toLatLng(latMin, lngMin);
		ne = toLatLng(latMax, lngMax);
		return new google.maps.LatLngBounds(sw, ne);
	}
			
	function toBoxPoints(j,k) {
		var latMin, latMax, lngMin, lngMax;
		var sw, ne;

		latMin = Math.min(j.lat(), k.lat());
		latMax = Math.max(j.lat(), k.lat());

		lngMin = Math.min(j.lng(), k.lng());
		lngMax = Math.max(j.lng(), k.lng());

		sw = toLatLng(latMin, lngMin);
		ne = toLatLng(latMax, lngMax);
		return [
			ne, new google.maps.LatLng(ne.lat(), sw.lng()),
			sw, new google.maps.LatLng(sw.lat(), ne.lng()), ne
		];
	}
	
	function getRoundsFromPointRadius(lat,lng,kmDistance)
	{
		var centerPoint = new LatLon(lat, lng);
		var leftTopPt = centerPoint.destinationPoint(315, kmDistance);
		var rightBottomPt = centerPoint.destinationPoint(135, kmDistance);
		return [leftTopPt,rightBottomPt];
	}
			
	function contentFormat(title,description)
	{
		if(title && title.length==0)
			return description;
		if(description && description.length==0)
			return '<strong>'+title+'</strong>';
		return '<strong>'+title+'</strong><br/>'+description; 
	}
	
	function existPinLabelName(routeLabel)
	{
		if( officeEngineMapBehavior )
			return ""+routeLabel;
		var num = parseInt(routeLabel);
		if( !isNaN(num)  && (num >= 10 && num <= 30) )//supported max 30
			return ""+num;
		return "";
	}
	
	//mobile engine folder
	var defaultMapViewImageFolder = 'images/';
	var defaultMapViewJSFolder = 'js/';
	
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
	var lastCenter = null;

	//options: zoom,streetViewControl,mapTypeControl,officeEngineMapBehavior,mapViewImageFolder,mapViewJSFolder
	this.initializeMapCanvs = function(lat, lng, elementID, options){
		options = options || {};
		var mapOptions = {
			  center: new google.maps.LatLng(lat,lng),//(1.2816670,103.7522220),
			  zoom: (typeof options.zoom === 'undefined' ? 11 : options.zoom),
			  mapTypeId: google.maps.MapTypeId.ROADMAP,
			  panControl : false,
			  zoomControl : true,
			  rotateControl : true,
			  streetViewControl: (typeof options.streetViewControl === 'undefined' ? false : parseBool(options.streetViewControl)),
		    mapTypeControl: (typeof options.mapTypeControl === 'undefined' ? false : parseBool(options.mapTypeControl) )
		};
		
		if( options.mapViewImageFolder )
			defaultMapViewImageFolder = options.mapViewImageFolder;
		if( options.mapViewJSFolder )
			defaultMapViewJSFolder = options.mapViewJSFolder;

		var pinColor = "FE7569" ;
		var fixedPinColor = "62A0FF" ;
		var searchPinColor = "FFFF00" ;
		//when remove dynamic generate pin image(google provided), we already can not support change pin color feature

		var normalPinMarker = { url:  getPinImageUrl( pinColor ),
  								size: new google.maps.Size(21, 34),
  								origin: new google.maps.Point(0,0),
  								anchor: new google.maps.Point(10, 34) };
		var fixedPinMarker = { url: getPinImageUrl( fixedPinColor ),
  								size: new google.maps.Size(21, 34),
  								origin: new google.maps.Point(0,0),
  								anchor: new google.maps.Point(10, 34) };
		var searchPinMarker = { url: getPinImageUrl( searchPinColor ),
  								size: new google.maps.Size(21, 34),
  								origin: new google.maps.Point(0,0),
  								anchor: new google.maps.Point(10, 34) };

		pinMarkers[ IMap.Pin.PinType.NormalPin ] = normalPinMarker;
		pinMarkers[ IMap.Pin.PinType.FixedPin ] = fixedPinMarker;
		pinMarkers[ IMap.Pin.PinType.SearchPin ] = searchPinMarker;
		pinColors[ IMap.Pin.PinType.NormalPin ] = pinColor;
		pinColors[ IMap.Pin.PinType.FixedPin ] = fixedPinColor;
		pinColors[ IMap.Pin.PinType.SearchPin ] = searchPinColor;

		
		google.maps.event.addListener(infoWindow, "closeclick", 
			function(){
				selectedPin = null;
			});

		mapCanvas = new google.maps.Map(document.getElementById(elementID), mapOptions);
		osm = new OverlappingMarkerSpiderfier(mapCanvas);
		
		officeEngineMapBehavior = (options.officeEngineMapBehavior) || false;
		if( officeEngineMapBehavior ){
			//clickMapToCloseInfoWindowBehavior
			google.maps.event.addListener(mapCanvas,'click', function() {
				if(infoWindow != null){
					infoWindow.close();
				}
			});
		}

		osm.addListener('spiderfy', function(markers) {
			if( officeEngineMapBehavior && !toSelectPinScript && infoWindow != null){
				infoWindow.close();
			}
			for (var i = 0; i < markers.length; i++){
				if(markers[i]._draggable)
					markers[i].setDraggable(false);
			}
			toSelectPinScript = false;
		});
			
		osm.addListener('unspiderfy', function(markers) {
			if( officeEngineMapBehavior && !toSelectPinScript && infoWindow != null){
				infoWindow.close();
			}
			//avoid pin label numaber has overlap, reasign ZIndex
			for (var i = 0; i < markers.length; i++){
				markers[i].setZIndex(markers[i]._zIndex);
				if(markers[i]._draggable)
					markers[i].setDraggable(true);
			}
		});

		
		lastCustomPinObj.size = [21,34];
		lastCustomPinObj.origin = [0, 0];
		lastCustomPinObj.anchor = [10,34];
		lastCustomPinObj.scaledSize = [21,34];
		
		if( navigator.userAgent.indexOf('WebView/2.0') != -1 ){
			var waitForFinalEvent = (function () {
				var timers = {};
				return function (callback, ms, uniqueId) {
					if (!uniqueId) {
						uniqueId = "Don't call this twice without a uniqueId";
					}
					if (timers[uniqueId]) {
						clearTimeout(timers[uniqueId]);
					}
					timers[uniqueId] = setTimeout(callback, ms);
				};
			})();
			google.maps.event.addDomListener(window, "resize", function() {
				google.maps.event.trigger(map, "resize");
				waitForFinalEvent(function () {
					if (lastCenter)
						mapCanvas.setCenter(lastCenter);
					lastCenter = null;
				}, 100, "ResizedEvent");
			});
			google.maps.event.addDomListener(mapCanvas, 'click', function () {
				lastCenter = null;
				google.maps.event.trigger(map, "click");
			});
		}
	}
	
	function getRouteMarker(routeLabel,pinColor)
	{
		var num = parseInt(routeLabel);
		if( !isNaN(num)  && (num >= 10 && num <= 30) ){
			return { // Because Marker only support one word label, we need to support two digit number, so we prepare static image to show
			    url: getPinImageUrl(pinColor,routeLabel),
  				size: new google.maps.Size(21, 34),
  				origin: new google.maps.Point(0, 0),
  				anchor: new google.maps.Point(10, 34)
			};
		}else{
			return { 
			    url: getPinImageUrl(pinColor,routeLabel),
  				size: new google.maps.Size(21, 34),
  				origin: new google.maps.Point(0, 0),
  				anchor: new google.maps.Point(10, 34),
  				labelOrigin: new google.maps.Point(10, 10)
			};
		}
	}
			
	this.route = function(color, travelMode, routeId){
		if(pins.length <= 1)
			return;
		color = color || "#00FFFF";
		routeId = routeId || "";
		this.clearRoute(routeId);
		var directionsRendererOptions={ 
			polylineOptions:{strokeColor:color, strokeWeight:3, strokeOpacity:0.7,visible:true,clickable:false,geodesic:true},
			suppressPolylines:false,suppressMarkers:true,suppressInfoWindows:true
		};

		if(!directionsService)
			directionsService = new google.maps.DirectionsService();

		var directionsDisplay = new google.maps.DirectionsRenderer(directionsRendererOptions);

		var dirPins = pins;
		var dirPinsLen = dirPins.length;

		var routeAutoSequenceId = 0;
		$.each(pins, function(i, pinObj) {
			if( routeId && pinObj.routeId != routeId ){
				dirPinsLen--;
				return;
			}
			if( pinObj.pinType == IMap.Pin.PinType.SearchPin ){
				dirPinsLen--;
				return;
			}
			routeAutoSequenceId++;
			if( pinObj.pinType == IMap.Pin.PinType.CustomPin ){
				//custom pin don't need replace it
				if(pinObj.map_object)
					pinObj.map_object.setDraggable(false);
				return;
			}
			osm.removeMarker(pinObj.map_object);
			pinObj.map_object.setMap(null);
			var pinLabel = (pinObj.routePinLabel&&pinObj.routePinLabel.length > 0 ? pinObj.routePinLabel: routeAutoSequenceId);
			var pinImage = getRouteMarker( pinLabel, pinColors[pinObj.pinType]);
			var pos=new google.maps.LatLng(pinObj.lat,pinObj.lng)
			pinObj.map_object=addPinMarker(pinObj,true,pos,pinObj.title,pinObj.description,pinImage,pinLabel);
		})
		
		directionsDisplay.setMap(mapCanvas);
		
		// extend bounds for each record
		// var bounds = new google.maps.LatLngBounds();
		// jQuery.each(dirPins, function (key, val) {
			// var myLatlng = new google.maps.LatLng(val.lat, val.lng);
			// bounds.extend(myLatlng);
		// });
		// mapCanvas.fitBounds(bounds);

		var batches = [];
		var itemsPerBatch = 10; // google API max = 10 - 1 start, 1 stop, and 8 waypoints
		var itemsCounter = 0;
		var wayptsExist = dirPinsLen > 0;

		while (wayptsExist) {
			var subBatch = [];
			var subitemsCounter = 0;

			for (var j = itemsCounter; j < dirPins.length; j++) {
				if( dirPins[j].pinType == IMap.Pin.PinType.SearchPin )
					continue;
				if( routeId && dirPins[j].routeId != routeId )
					continue;
				subitemsCounter++;
				subBatch.push({
					location: new google.maps.LatLng(dirPins[j].lat, dirPins[j].lng),
					stopover: true
				});
				if (subitemsCounter == itemsPerBatch)
					break;
			}

			itemsCounter += subitemsCounter;
			batches.push(subBatch);
			wayptsExist = itemsCounter < dirPinsLen;
			// If it runs again there are still points. Minus 1 before continuing to
			// start up with end of previous tour leg
			itemsCounter--;
		}

		// now we should have a 2 dimensional array with a list of a list of waypoints
		var combinedResults;
		var unsortedResults = [{}]; // to hold the counter and the results themselves as they come back, to later sort
		var directionsResultsReturned = 0;

		travelMode = travelMode == "WALKING" ? google.maps.TravelMode.WALKING: 
					 travelMode == "TRANSIT" ? google.maps.TravelMode.TRANSIT:
					 travelMode == "BICYCLING" ? google.maps.TravelMode.BICYCLING: google.maps.TravelMode.DRIVING;

		for (var k = 0; k < batches.length; k++) {
			var lastIndex = batches[k].length - 1;
			var start = batches[k][0].location;
			var end = batches[k][lastIndex].location;

			// trim first and last entry from array
			var waypts = [];
			waypts = batches[k];
			waypts.splice(0, 1);
			waypts.splice(waypts.length - 1, 1);


			var request = {
				origin: start,
				destination: end,
				waypoints: waypts,
				travelMode: travelMode
			};
						
			(function (kk, directionsService, directionsDisplay) {
				directionsService.route(request, function (result, status) {
					if (status == google.maps.DirectionsStatus.OK) {
						var unsortedResult = { order: kk, result: result };
						unsortedResults.push(unsortedResult);

						directionsResultsReturned++;
						if (directionsResultsReturned == batches.length) // we've received all the results. put to map
						{
							// sort the returned values into their correct order
							unsortedResults.sort(function (a, b) { return parseFloat(a.order) - parseFloat(b.order); });
							var count = 0;
							for (var key in unsortedResults) {
								if (unsortedResults[key].result != null) {
									if (unsortedResults.hasOwnProperty(key)) {
										if (count == 0) // first results. new up the combinedResults object
											combinedResults = unsortedResults[key].result;
										else {
											// only building up legs, overview_path, and bounds in my consolidated object. This is not a complete
											// directionResults object, but enough to draw a path on the map, which is all I need
											combinedResults.routes[0].legs = combinedResults.routes[0].legs.concat(unsortedResults[key].result.routes[0].legs);
											combinedResults.routes[0].overview_path = combinedResults.routes[0].overview_path.concat(unsortedResults[key].result.routes[0].overview_path);

											combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getNorthEast());
											combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getSouthWest());
										}
										count++;
									}
								}
							}
							directionsDisplay.setDirections(combinedResults);
						}
					}
				});
			})(k, directionsService, directionsDisplay);
		}
		directionsDisplay.routeId = routeId;
		directionsDisplays.push( directionsDisplay );
	}
	
	this.clearRoute = function(routeId){
		if( routeId ) { //delete by routeId
			for(var i = directionsDisplays.length-1; i >= 0; i--){
				if ( directionsDisplays[i].routeId == routeId ){
					directionsDisplays[i].setMap(null);
					directionsDisplays[i] = null;
					directionsDisplays.splice(i,1);
					break;
				}
			}
		} else { //clear all
			for(var i = directionsDisplays.length-1; i >= 0; i--){
				if ( directionsDisplays[i] )
					directionsDisplays[i].setMap(null);
				directionsDisplays[i] = null;
			}
			directionsDisplays.length=0;
		}
	}
	
	function addPinMarker(pinObj,isFixed,pos,title,description,pinImage,routeLabel){
		var zIndex = pinZIndex++;
		var markerOptions = {
			position: pos,
			icon : pinImage,
			draggable : !isFixed,
			label: pinImage.labelOrigin && routeLabel ?  ""+routeLabel : "",
			zIndex: zIndex,
			map: mapCanvas,
			optimized: false //to fix not drawing properly after deleted
		};
		if(officeEngineMapBehavior){
			markerOptions['animation']=google.maps.Animation.DROP;
			delete markerOptions['label'];//Using image iocn to display, not using label
		}
		
		var pinMarker = new google.maps.Marker(markerOptions);

		
		if (!isFixed) {
			google.maps.event.addListener(pinMarker, 'dragstart', function() {
				selectedPin = pinObj;
			})
			google.maps.event.addListener(pinMarker, 'dragend', function() {
				selectedPin.lat = pinMarker.getPosition().lat();
				selectedPin.lng = pinMarker.getPosition().lng();
			})
		}
		google.maps.event.addListener(pinMarker, 'click', function() {
			if (typeof title !== 'undefined' && typeof description !== 'undefined'
					&& (title.length>0 || description.length>0) ){
				infoWindow.setContent( contentFormat(title,description) );
				infoWindow.open(mapCanvas, pinMarker, null);
			}
			selectedPin = pinObj;
		});
		
		pinMarker._zIndex = zIndex;
		pinMarker._draggable = !isFixed;
		pinObj.map_object = pinMarker;
		
		osm.addMarker(pinMarker);
		return pinMarker;
	}
	
	this.setupPinParameter = function(sizeX,sizeY,originX,originY,anchorX,anchorY){
		lastCustomPinObj.size = [sizeX,sizeY];
		lastCustomPinObj.origin = [originX,originY];
		lastCustomPinObj.anchor = [anchorX,anchorY];
	}
	
	function customPin2PinMarker(customPinUrl)
	{
		var customMarker = { 
			url: customPinUrl,
			size: new google.maps.Size(lastCustomPinObj.size[0], lastCustomPinObj.size[1]),
			origin: new google.maps.Point(lastCustomPinObj.origin[0],lastCustomPinObj.origin[1]),
			anchor: new google.maps.Point(lastCustomPinObj.anchor[0],lastCustomPinObj.anchor[1]),
			scaledSize: new google.maps.Size(lastCustomPinObj.size[0], lastCustomPinObj.size[1])
		};
		return customMarker;
	}
	
	this.addPin = function(id, isFixed, lat, lng, centered, title, description, routePinLabel, customPinUrl, routeId, _pinType){
		_deletePin(id);//avoid duplicate id
		var pos = (centered)? mapCanvas.getCenter():new google.maps.LatLng(lat,lng);
		_pinType = _pinType || (isFixed? IMap.Pin.PinType.FixedPin : IMap.Pin.PinType.NormalPin);
		var pinImage;
		if( customPinUrl && typeof customPinUrl === 'object' ){//optimizeRoute using
			pinImage = customPinUrl;
		}else if( typeof customPinUrl === 'string' && customPinUrl.length > 0 ){
			pinImage = customPin2PinMarker(customPinUrl);
			_pinType = IMap.Pin.PinType.CustomPin;
		}else
			pinImage = pinMarkers[_pinType];
		title = title || "";
		description = description || "";
		var pinObj = new IMap.Pin(id, pos.lat(), pos.lng(), title, description, routePinLabel, _pinType, routeId);
		addPinMarker(pinObj,isFixed,pos,title,description,pinImage,routePinLabel);
		
		pins.push(pinObj);
	}
	
	//delayed loading for GeolocationMarker
	function loadGeolocationMarkerThen(callbackFn){
		return function() {
			if( typeof(GeolocationMarker) !== "undefined" ){
				 callbackFn.apply(this, arguments);
			}else{
				var script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = defaultMapViewJSFolder + 'geolocationmarker.js';
				google.maps.event.addListener(google.maps, 'geolocationMarker_loaded', function() {
					callbackFn.apply(this, arguments);
				});
				document.body.appendChild(script);
			}
		}
	}
	
	
	function _followMyLocation(enable){
		enable = (enable === undefined ? true:enable);
		if( enable ){
			if( !geoMarker ){
				var markerOpts;
				if( officeEngineMapBehavior ){
					markerOpts = { 
						'icon': {
					        'url': defaultMapViewImageFolder + "marker.gif",
					        'size': new google.maps.Size(34, 34),
					        'scaledSize': new google.maps.Size(17, 17),
					        'origin': new google.maps.Point(0, 0),
					        'anchor': new google.maps.Point(8, 8)
    					}
    				};
				}
				geoMarker = new GeolocationMarker(undefined,markerOpts);
				geoMarker.setCircleOptions({fillColor: '#808080'});
				google.maps.event.addListener(geoMarker, 'position_changed', function() {
					if(!lastKnownPosition){
						mapCanvas.panTo(this.getPosition());
						mapCanvas.fitBounds(this.getBounds());
					}
					lastKnownPosition = this.getPosition();
				});

				google.maps.event.addListener(geoMarker, 'geolocation_error', function(e) {
					var msg = "unknown geolocation_error";
					if(e.code == 1)
						msg = IMap.GetLocalizeText('GeoPERMISSION_DENIED');
					else if(e.code == 2)
						msg = IMap.GetLocalizeText('GeoPOSITION_UNAVAILABLE');
					else if(e.code == 3)
						msg = IMap.GetLocalizeText('GeoTIMEOUT');
					alert(msg);
				});
				geoMarker.setMap(mapCanvas);
			}else if( geoMarker.getPosition() ){
				mapCanvas.panTo( geoMarker.getPosition() );
			}
		}else{
			if( geoMarker ){
				geoMarker.setMap(null);
				geoMarker=null;
				lastKnownPosition = null;
			}
		}
	}
	
	
	this.followMyLocation = function(enable){
		if( enable && typeof(GeolocationMarker) === "undefined" ){
			loadGeolocationMarkerThen(_followMyLocation)();
			return;
		}
		_followMyLocation(enable);
	}
	
	this.getMyLocation = function(){
		var myPosition=null;
		if(geoMarker){
			lastKnownPosition = geoMarker.getPosition();
			if( lastKnownPosition ){
				myPosition = {
					lat: lastKnownPosition.lat(),
					lng: lastKnownPosition.lng()
					};
			}
		}
		return myPosition;
	}
	
	this.clearPins = function(){
		osm.clearMarkers();
		for(var i = pins.length-1; i >= 0; i--){
			if (pins[i].map_object != null){
				pins[i].map_object.setMap(null);
			}
		}
		pins.length=0;
		selectedPin=null;
		pinZIndex=0;
	}
	
	function clearSearchResultsPins(){
		for(var i = pins.length-1; i >= 0; i--){
			if (pins[i].pinType == IMap.Pin.PinType.SearchPin){
				if( selectedPin && selectedPin.id == pins[i].id)
					selectedPin = null;
				osm.removeMarker(pins[i].map_object);
				pins[i].map_object.setMap(null);
				pins.splice(i,1);
			}
		}
	}
	
	
	function _deletePin(id){
		var len = pins.length;
		for(var i = 0; i < len; i++){
			if ( pins[i].id === id) {
				if( selectedPin && selectedPin.id == id)
					selectedPin = null;
				osm.removeMarker(pins[i].map_object);
				pins[i].map_object.setMap(null);
				pins.splice(i,1);
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
		var len = pins.length;
		for(var i = 0; i < len; i++){
			if ( pins[i].id === id) {
				pin = pins[i];
				break;
			}
		}
		if(pin){
			selectedPin = pin;
			toSelectPinScript = true;
			google.maps.event.trigger( selectedPin.map_object , 'click');//to open info window, indicate selected pin
			mapCanvas.panTo( new google.maps.LatLng(selectedPin.lat,selectedPin.lng) );
		}
	}
	
	this.deleteSelectedPin = function(){
		if(selectedPin)
			_deletePin(selectedPin.id);
	}
	
	this.getPin = function(id){
		var pin = null;
		var len = pins.length;
		for(var i = 0; i < len; i++){
			if ( pins[i].id === id) {
				pin = pins[i];
				break;
			}
		}
		if (pin)
			return [pin.output()];
		return null;
	}
	
	this.getPins = function(){
		var len = pins.length;
		var outPins=[];
		for(var i=0;i<len;i++)
			outPins.push(pins[i].output());
		return outPins;
	}
	
	this.getSelectedPin = function(){
		return selectedPin?selectedPin.output():null;
	}
	
	this.getCenter = function(){
		var center	= mapCanvas.getCenter();
		return { lat: center.lat(), lng: center.lng(), zoom: mapCanvas.getZoom() };
	}
	
	this.setCenter = function(lat,lng,zoom,hasAnimate){
		if(hasAnimate)
			mapCanvas.panTo( new google.maps.LatLng(lat,lng) );
		else
			mapCanvas.setCenter( new google.maps.LatLng(lat,lng) );
		if(zoom!=0)
			mapCanvas.setZoom(zoom);
		lastCenter = mapCanvas.getCenter();
	}
	
	this.setZoom = function(zoom){
		mapCanvas.setZoom( zoom );
	}
	
	
	this.enableSatelliteMode = function(enable){
		if( enable )
			mapCanvas.setMapTypeId(google.maps.MapTypeId.SATELLITE);
		else
			mapCanvas.setMapTypeId(google.maps.MapTypeId.ROADMAP);
	}
	
	this.searchLocation = function(locationNameOrAddress, maxCount, isFixed){
		//it will return the first result in the list that matches with the address.
		//region parameter is the Country code used to bias the search, specified as a Unicode region subtag / CLDR identifier
		if(!geocoderService)
			geocoderService = new google.maps.Geocoder();
		clearSearchResultsPins();
		var geocoderRequest = { 'address': locationNameOrAddress };
		
		if(lastKnownPosition){
			var latLng=lastKnownPosition;
			var points = getRoundsFromPointRadius(latLng.lat(),latLng.lng(), 20 );
			var point1=toLatLng(points[0].lat(),points[0].lon());
			var point2=toLatLng(points[1].lat(),points[1].lon());
			var searchBounds = toBounds(point1,point2);
			geocoderRequest['bounds']=searchBounds;
			
			// new google.maps.Polyline({
				  // path: toBoxPoints(point1,point2),
				  // strokeColor: '#FF0000',
				  // strokeOpacity: 1.0,
				  // strokeWeight: 2,
				  // map: mapCanvas
			  // });
			
		}
		geocoderService.geocode( geocoderRequest, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var location=results[0].geometry.location;
				maxCount = results.length > maxCount ? maxCount : results.length;
				var firstSearchPinID = null; 
				for(var i=0; i < maxCount; i++){
					location=results[i].geometry.location;
					var dispInfo=results[i].formatted_address;
					var id = 'FindPin'+(i+1);
					mapThis.addPin(id,isFixed,location.lat(),location.lng(),false,dispInfo,"",null,null,null,IMap.Pin.PinType.SearchPin);
					if(firstSearchPinID==null)
						firstSearchPinID = id;
				}
				mapCanvas.setCenter(location);
				lastCenter = mapCanvas.getCenter();
				if(firstSearchPinID)
					mapThis.selectPin(firstSearchPinID);
			}
            IMap.CallbackFromJS('jsDone',"");
		});
	};

	
	this.getLocation = function(lat, lng){
		if(!geocoderService)
			geocoderService = new google.maps.Geocoder();
		var latlng = {lat: lat, lng: lng};
		var geocoderRequest = { 'location': latlng };
		geocoderService.geocode(geocoderRequest, function(results, status) {
			var retResult = null;
			if ( status === google.maps.GeocoderStatus.OK) {
				if( results.length > 0 ){ // found it
					var retArray = [];
					for (i = 0; i < results.length ; i++) {
						retArray.push( results[i].formatted_address );
					}
					retResult = retArray;
				}
			}
			IMap.CallbackFromJS('jsDone', retResult);
		});
	};
	
	//point = { id, lat, lng, [title], [desc] }
	this.optimizeRoute = function(startPoint,endPoint,wayPoints,callback,color,optimize,customPinUrlX){
		if( typeof startPoint === 'string' )
			startPoint = JSON.parse(startPoint);
		if( typeof endPoint === 'string' )
			endPoint = JSON.parse(endPoint);
		if( typeof wayPoints === 'string' )
			wayPoints = JSON.parse(wayPoints);
		startPoint = startPoint || {};
		endPoint = endPoint || {};
		wayPoints = wayPoints || [];
		if( optimize===null || optimize===undefined )
			optimize = true;//by default
		color = color || "#00FFFF";
		
		var directionsRendererOptions={ 
			polylineOptions:{strokeColor:color, strokeWeight:3, strokeOpacity:0.7,visible:true,clickable:false,geodesic:true},
			suppressPolylines:false,suppressMarkers:true,suppressInfoWindows:true
		};

		if(!directionsService)
			directionsService = new google.maps.DirectionsService();

		var directionsDisplay = new google.maps.DirectionsRenderer(directionsRendererOptions);
		directionsDisplay.setMap(mapCanvas);

		var start = new google.maps.LatLng(startPoint.lat,startPoint.lng);
		var end = new google.maps.LatLng(endPoint.lat,endPoint.lng);
		var waypts = [];
		
		for(var i=0; i < wayPoints.length;i++){
			waypts.push({
				location:new google.maps.LatLng(wayPoints[i].lat,wayPoints[i].lng),
				stopover:true
			});
		}

		var request = {
			origin: start,
			destination: end,
			waypoints: waypts,
			travelMode: google.maps.TravelMode.DRIVING,
			optimizeWaypoints: optimize
		};
		
		
		var optimizeRoutePin = function(label)
		{
			var ret = [];
			//0
			if( officeEngineMapBehavior )
				ret.push( "" );
			else
				ret.push( "" + label );
			//1
			if(customPinUrlX)
				ret.push( customPinUrlX + label + ".png" );
			else
				ret.push( getRouteMarker( label, pinColors[IMap.Pin.PinType.FixedPin]) );
			return ret;
		};

		var startEndIsSeq = false;

		directionsService.route(request, function (response, status) {
			var waypoint_ID_order = [];
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
				var geocoded_waypoints = response.geocoded_waypoints;
				
				var routeAutoSequenceId = 1;
				if( startEndIsSeq ){
					var pinLabelImage = optimizeRoutePin(routeAutoSequenceId);
					mapThis.addPin( startPoint.id, true, startPoint.lat, startPoint.lng, false, startPoint.title, startPoint.desc, 
						pinLabelImage[0], pinLabelImage[1] );
					routeAutoSequenceId++;
				}else{
					var pinLabelImage = optimizeRoutePin('S');
					mapThis.addPin( startPoint.id, true, startPoint.lat, startPoint.lng, false, startPoint.title, startPoint.desc,
						pinLabelImage[0], pinLabelImage[1] );
				}
				
				var waypoint_order = response.routes[0].waypoint_order;
				for(var i = 0; i < waypoint_order.length ; i++ ){
					var wayPoint = wayPoints[ waypoint_order[i] ];
					var pinLabelImage = optimizeRoutePin(routeAutoSequenceId);
					mapThis.addPin( wayPoint.id, true, wayPoint.lat, wayPoint.lng, false, wayPoint.title, wayPoint.desc,
						pinLabelImage[0], pinLabelImage[1] );
					waypoint_ID_order.push( wayPoint.id );
					routeAutoSequenceId++;
				}
				if( startEndIsSeq ){
					var pinLabelImage = optimizeRoutePin(routeAutoSequenceId);
					mapThis.addPin( endPoint.id, true, endPoint.lat, endPoint.lng, false, endPoint.title, endPoint.desc, 
						pinLabelImage[0], pinLabelImage[1] );
				}else{
					var pinLabelImage = optimizeRoutePin('E');
					mapThis.addPin( endPoint.id, true, endPoint.lat, endPoint.lng, false, endPoint.title, endPoint.desc,
						pinLabelImage[0], pinLabelImage[1] );
				}
			}
			if( callback )
				IMap.CallbackFromJS(callback,waypoint_ID_order.join(','));
			
		});
		directionsDisplays.push( directionsDisplay );
	};
	
	this.destroy = function(){
		if( mapCanvas ){
			this.followMyLocation(false);
			this.clearPins();
			this.clearRoute();
			
			$('#' + mapCanvas.getDiv().id ).remove();
			//set null for inner variable
			osm = null;
			lastKnownPosition = null;
			pins = null;
			geoMarker = null;
			lastCenter = null;
			selectedPin = null;
			directionsDisplays = null;
			directionsService = null;
			geocoderService = null;
			infoWindow = null;
			pinMarkers = null;
			pinColors = null;
			lastCustomPinObj = null;
		}
		mapCanvas = null;
	}
	
	 //Support NP Office Map function
	this.getMapCanves = function(){
		return mapCanvas;
	};

	return this;
}
