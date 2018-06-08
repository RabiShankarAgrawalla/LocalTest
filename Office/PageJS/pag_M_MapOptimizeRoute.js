function $NPCtrl(ctrlName)
{//TIP: avoid pageName dependency
	var jq = $('#' + pageName + '_' + ctrlName);
	return jq;
}

function LoadOMS() {
	var appName = NP.Environment.GetApplicationName();
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'App/' + appName + '/JavaScript/oms.min.js';
	document.body.appendChild(script);
}
window.LoadOMS = LoadOMS;

var apiKey = '';

var oms			= null;
var mapPlan = null;
var mapPlanDirections	= [];

//TIP: For grid selected row reason. we must be save mapPlanMarkers to global, avoid missing data
var mapPlanMarkers = window.mapPlanMarkers || [];//get from window.mapPlanMarkers or init to []



function impl_OnPostInit() 
{
	if(document.getElementById('jsGoogleMap') == null) {
		window.mapPlanMarkers = [];//clear it
		apiKey = NP.WebServiceProxy.Data('getGoogleAPIKey', '', null);
		var script	= document.createElement('script');
		script.id	= 'jsGoogleMap';
		script.type = 'text/javascript';
		//TIP: remove sensor=false , The sensor parameter is no longer required
		script.src	= 'http://maps.googleapis.com/maps/api/js?' + apiKey
					+ '&callback=LoadOMS';
		document.body.appendChild(script);
	}else{
		//TIP:let map auto show info by grid selected row
		if( mapPlanMarkers.length > 0 ){
			var custCd = NP.WebServiceProxy.Data('getSelectRow', '', null);
			for(var i = 0; i < mapPlanMarkers.length; i++){
				if( mapPlanMarkers[i].CUST_CD == custCd ){
					google.maps.event.trigger( mapPlanMarkers[i], "click");
					break;
				}
			}
			
		
		}
		
		//$NPCtrl('lay_search').hide();
		//$NPCtrl('lay_MapPanel').hide();

		var jqSLSMAN_CD = $(NP.UI.GetNPControl('drp_SLSMAN_CD'));
		var jqDate		= $(NP.UI.GetNPControl('dat_Date'));
		var txtLoadRoute = NP.UI.GetNPControl('txt_LoadSelectedRoute');
		//alert(jqSLSMAN_CD.val());
		//alert(jqDate.val());
		if (txtLoadRoute)
		{
			txtLoadRoute = $(txtLoadRoute)
			txtLoadRoute.hide();
			if (txtLoadRoute.val() == "1"){
				txtLoadRoute.val("0");
				LoadSelectedRoute();
				//if( chkUI('LoadRoute') ){
				//	$NPCtrl('lay_MapPanel').show();
				//	$NPCtrl('lay_Map').hide();
				//	$NPCtrl('lay_Grid').show();
				//	NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
				//}
				
			}
		}
		
	}
	
	//$NPCtrl( 'dat_Date' +  '_SelectButton' ).click(function(){ setTimeout(function(){  $NPCtrl( 'dat_Date' + '_ajax_CalendarExtender_popupDiv' ).css('z-index', 1000); }, 200); }); 
}
var allRoutePlanSeq = [];
var	allRoutePlanDate = [];
var	mapRoutePlanSeq = [];

var max_way_points = 10;

var marksWayPoints = 0;
var mapStartPoint = [];
var mapEndPoint = []

function LoadSelectedRoute(){
	var msg = NP.WebServiceProxy.Data('LoadSelectedRoutePlan', '', null);
		
	if (msg.charAt(0) == 'E')
	{
		var tmp = msg.split('|');
		alert(tmp[1]);
		return;
	}
	
	var startDt, endDt, startLat, startLong, endLat, endLong;
	
	allRoutePlanSeq = [];
	allRoutePlanDate = [];
	mapRoutePlanSeq = [];
	
	var objRoutePlan = $.parseJSON(msg);
	var currentVisitDt = '';
	var routePlanIndex = 0;
	for(var i in objRoutePlan)
	{
		if (objRoutePlan[i].START_DT){
			startDt = objRoutePlan[i].START_DT;
			endDt = objRoutePlan[i].END_DT;	
			startLat = objRoutePlan[i].START_LAT;				
			startLong = objRoutePlan[i].START_LONG;	
			endLat = objRoutePlan[i].END_LAT;	
			endLong = objRoutePlan[i].END_LONG;		
			NP.UI.GetNPControl('lbl_VISIT_DT').innerText = startDt; 
			//NP.UI.GetNPControl('lbl_SLSMAN_NAME').innerText = objRoutePlan[i].SLSMAN_NAME; 
			NP.UI.GetNPControl('lbl_DateRange').innerText = startDt + ' - ' + endDt; 			
		}
		else if (objRoutePlan[i].ROW_NO){
			if (currentVisitDt != objRoutePlan[i].VISIT_DT){
				currentVisitDt = objRoutePlan[i].VISIT_DT;
				allRoutePlanDate.push({
					"VISIT_DT":objRoutePlan[i].VISIT_DT,
					"ROUTE_PLAN":[]
				});
				routePlanIndex = allRoutePlanDate.length - 1;
			}
			
			allRoutePlanDate[routePlanIndex].ROUTE_PLAN.push(objRoutePlan[i]);
			if (startDt  && startDt != ''){
				if (objRoutePlan[i].VISIT_DT == startDt){
					mapRoutePlanSeq.push(objRoutePlan[i]);
				}
			}
		}
	}
	
	mapStartPoint = [startLat, startLong];
	mapEndPoint = [endLat, endLong];

		
	$NPCtrl('lay_MapPanel').show();
	$NPCtrl('lay_Map').show();
	$NPCtrl('lay_Grid').show();
	//$NPCtrl('lay_DetailPnl').show();
	$NPCtrl('lay_search').show();
	NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
	OptimizeRoutePlan();	
}

function OptimizeRoutePlan(){
	var custPlan = [];
	var directionsDisplay = [];
	var directionsService = [];
	
	var planLength = mapRoutePlanSeq.length;
	var mapPlanIndex = 0;
	
	var max_way_points_c;
	
	var GMapPlan = $('#mapPlan')[0];
	
	var myOptionsPlan = {
		 zoom	   : 1
		,mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	if(mapPlan == null) {
		mapPlan = new google.maps.Map(GMapPlan, myOptionsPlan);
		VerifyGMapKey(mapPlan);		
	}
	else {
		mapPlan.setZoom(1);
		for(var i = 0; i < mapPlanMarkers.length; i++)
			mapPlanMarkers[i].setMap(null);
		mapPlanMarkers = [];
		for(var i = 0; i < mapPlanDirections.length; i ++)
			mapPlanDirections[i].setMap(null);
		mapPlanDirections = [];
	}

	if(oms != null) {
		oms.clearMarkers();
	}
	oms = new OverlappingMarkerSpiderfier(mapPlan);

	MoveToCurrentLocation(mapPlan);

	var polylineOptionsPlan = {
		  strokeColor: '#0000FF',
		  strokeOpacity: 1.0,
		  strokeWeight: 5
		  };
	
	marksWayPoints = 0;
	var countLoop = 0;
	while(planLength > 0){
		countLoop++;
		custPlan = [];
		max_way_points_c = max_way_points;
		
		console.log('Loop ' + countLoop + '---------------');
		if (planLength == mapRoutePlanSeq.length){
			custPlan.push({"IND":"S","CUST_CD":"","LATITUDE":mapStartPoint[0],"LONGITUDE":mapStartPoint[1]});
			max_way_points_c = max_way_points_c - 1;
			console.log('CUST CD:' + ',LATITUDE:' + mapStartPoint[0] + ',LONGITUDE:' + mapStartPoint[1]);
		}
		
		if (mapPlanIndex + max_way_points_c >= mapRoutePlanSeq.length){
			max_way_points_c = mapRoutePlanSeq.length - mapPlanIndex;
		}
		
		for (var j = mapPlanIndex; j < mapPlanIndex + max_way_points_c; j++ ){
			if (mapRoutePlanSeq[j].LATITUDE != '' && mapRoutePlanSeq[j].LONGITUDE != ''){
				custPlan.push({"IND":"C","CUST_CD":mapRoutePlanSeq[j].CUST_CD,"LATITUDE":mapRoutePlanSeq[j].LATITUDE,"LONGITUDE":mapRoutePlanSeq[j].LONGITUDE});
				console.log('CUST CD:' + mapRoutePlanSeq[j].CUST_CD + ',LATITUDE:' + mapRoutePlanSeq[j].LATITUDE + ',LONGITUDE:' + mapRoutePlanSeq[j].LONGITUDE);
			}
		}
		mapPlanIndex = mapPlanIndex + (max_way_points_c - 1);
		
		if (mapPlanIndex >= mapRoutePlanSeq.length - 1){			
			planLength = 0;
		}else{
			planLength = planLength - (max_way_points_c - 1);			
		}
		DrawRouteMap(custPlan, directionsDisplay, directionsService, polylineOptionsPlan);		
	}
	
	var infowindow = new google.maps.InfoWindow;({content: this.content});

	
	google.maps.event.addListener(mapPlan, 'click', function() {
		if(infowindow != null){
			infowindow.close();
		}
	});
	
}

function DrawRouteMap(custPlan, directionsDisplay, directionsService, polylineOptionsPlan){
	
	if (custPlan.length <= 0)
		return;
	
	var startWayPoint = {
		"CUST_CD":custPlan[0].CUST_CD,
		"POINT":new google.maps.LatLng( custPlan[0].LATITUDE, custPlan[0].LONGITUDE )
	};
	
	var endWayPoint = {
		"CUST_CD":custPlan[custPlan.length - 1].CUST_CD,
		"POINT":new google.maps.LatLng( custPlan[custPlan.length - 1].LATITUDE, custPlan[custPlan.length - 1].LONGITUDE )
	}
	
	var startPlan = startWayPoint.POINT;
	var endPlan = endWayPoint.POINT;
	
	var wayptsPlan = [];
	
	var lengthPlan = custPlan.length;
	for (var rowPlan = 0; rowPlan < custPlan.length; rowPlan++)
	{
		if (rowPlan >= 1 && rowPlan <= custPlan.length - 2){
			wayptsPlan.push({
				location:new google.maps.LatLng(custPlan[rowPlan].LATITUDE,custPlan[rowPlan].LONGITUDE),
				stopover:true
			});
		}
	}
	
	var requestPlan = {
		origin: startPlan,
		destination: endPlan,
		waypoints: wayptsPlan,
		optimizeWaypoints: false,
		travelMode: google.maps.DirectionsTravelMode.DRIVING
	};
	
	directionsService.push(new google.maps.DirectionsService());
	var instance = directionsService.length - 1;
	directionsDisplay.push(new google.maps.DirectionsRenderer({		
		suppressMarkers: true, 
		polylineOptions: polylineOptionsPlan
	}));
	directionsDisplay[instance].setMap(mapPlan);
	
	directionsService[instance].route(requestPlan,function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay[instance].setDirections(response);
			mapPlanDirections.push(directionsDisplay[instance]);
			
			var waypoint_order = response.routes[0].waypoint_order;
			var markersArrayPlan = [];
			for(var i = 0; i < waypoint_order.length ; i++ ){
				var newOrder = waypoint_order[i];//zero based
				var wayPoint = custPlan[newOrder + 1];
				markersArrayPlan.push([wayPoint.LATITUDE,wayPoint.LONGITUDE,wayPoint.CUST_CD]);
				
				newOrder+=1;//one based
				/* if( newWaypoint_order.length > 0 )
					newWaypoint_order += "|" + newOrder;
				else
					newWaypoint_order += ""  + newOrder; */
			}
			//TIP: must be save to window.mapPlanMarkers for changes
			var markers = setMarkers(oms,mapPlan,markersArrayPlan, startWayPoint, endWayPoint, instance);
			
			for (var j = 0; j < markers.length; j++){
				mapPlanMarkers.push(markers[j]);
			}			
			window.mapPlanMarkers = mapPlanMarkers;
		}
	});
}

function impl_navigateRoute_OnClick(mode){
	
	var msg = NP.WebServiceProxy.Data('navigateRoute', mode, null);
	if (msg.charAt(0) == 'E')
	{
		//var tmp = msg.split('|');
		//alert(tmp[1]);
		return;
	}
	
	var objRoutePlan = $.parseJSON(msg);
	var startDt, startLat, startLong, endLat, endLong;
	
	allRoutePlanSeq = [];
	allRoutePlanDate = [];
	mapRoutePlanSeq = [];
	
	var currentVisitDt = '';
	var routePlanIndex = 0;
	for(var i in objRoutePlan)
	{
		if (objRoutePlan[i].START_DT){
			startDt = objRoutePlan[i].START_DT;	
			startLat = objRoutePlan[i].START_LAT;				
			startLong = objRoutePlan[i].START_LONG;	
			endLat = objRoutePlan[i].END_LAT;	
			endLong = objRoutePlan[i].END_LONG;					
			NP.UI.GetNPControl('lbl_VISIT_DT').innerText = startDt; 			
		}
		else if (objRoutePlan[i].ROW_NO){
			if (currentVisitDt != objRoutePlan[i].VISIT_DT){
				currentVisitDt = objRoutePlan[i].VISIT_DT;
				allRoutePlanDate.push({
					"VISIT_DT":objRoutePlan[i].VISIT_DT,
					"ROUTE_PLAN":[]
				});
				routePlanIndex = allRoutePlanDate.length - 1;
			}
			
			allRoutePlanDate[routePlanIndex].ROUTE_PLAN.push(objRoutePlan[i]);
			if (startDt  && startDt != ''){
				if (objRoutePlan[i].VISIT_DT == startDt){
					mapRoutePlanSeq.push(objRoutePlan[i]);
				}
			}
		}
	}
	
	mapStartPoint = [startLat, startLong];
	mapEndPoint = [endLat, endLong];
	
	NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
	OptimizeRoutePlan();	
}

function chkUI(mode)
{
	//TODO: by your condition
	var jqSLSMAN_CD = $(NP.UI.GetNPControl('drp_SLSMAN_CD'));
	var jqDate		= $(NP.UI.GetNPControl('dat_Date'));
	
	var msg = NP.WebServiceProxy.Data('chkUI', '' + mode + '|' + jqSLSMAN_CD.val() + '|' + jqDate.val(), null);
	var tmp = msg.split('|');
	
	if(tmp[0] == 'E') {
		alert(tmp[1]);
		return false;
	}
	if(tmp[0] == 'OK') {
		alert(tmp[1]);
		return false;
	}
	else if(tmp[0] == 'O') { 
		NP.UI.GetNPControl('lbl_SLSMAN_CD').innerText = tmp[1] ; 
		NP.UI.GetNPControl('lbl_VISIT_DT').innerText = tmp[2]; 
		//NP.UI.GetNPControl('lbl_SLSMAN_NAME').innerText = tmp[3]; 
		//NP.UI.GetNPControl('lbl_HeaderPlan').innerText = tmp[4]; 
	}
	return true;
}

function impl_LoadRoute_OnClick()
{
	if( chkUI('LoadRoute') ){
		$NPCtrl('lay_MapPanel').show();
		$NPCtrl('lay_Map').hide();
		$NPCtrl('lay_Grid').show();
		NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
	}
}

/* function impl_prevGrid_OnClick(prevDate)
{
    var jqSLSMAN_CD = $(NP.UI.GetNPControl('drp_SLSMAN_CD'));
	//var jqDate		= $(NP.UI.GetNPControl('dat_Date'));
	
	var msg = NP.WebServiceProxy.Data('chkUI', '' + LoadRoute + '|' + jqSLSMAN_CD.val() + '|' + prevDate, null);
	var tmp = msg.split('|');
	
			if(tmp[0] == 'E') {
		alert(tmp[1]);
		return false;
	}
	if(tmp[0] == 'OK') {
		alert(tmp[1]);
		return false;
	}
	else if(tmp[0] == 'O') { 
		//NP.UI.GetNPControl('lbl_SLSMAN_CD').innerText = tmp[1] ; 
		NP.UI.GetNPControl('lbl_VISIT_DT').innerText = tmp[2]; 
	}
	return true;
}

function impl_prevGrid_OnClick(nextDate)
{
    var jqSLSMAN_CD = $(NP.UI.GetNPControl('drp_SLSMAN_CD'));
	//var jqDate		= $(NP.UI.GetNPControl('dat_Date'));
	
	var msg = NP.WebServiceProxy.Data('chkUI', '' + LoadRoute + '|' + jqSLSMAN_CD.val() + '|' + nextDate, null);
	var tmp = msg.split('|');
	
		if(tmp[0] == 'E') {
		alert(tmp[1]);
		return false;
	}
	if(tmp[0] == 'OK') {
		alert(tmp[1]);
		return false;
	}
	else if(tmp[0] == 'O') { 
		//NP.UI.GetNPControl('lbl_SLSMAN_CD').innerText = tmp[1] ; 
		NP.UI.GetNPControl('lbl_VISIT_DT').innerText = tmp[2]; 
	}
	return true;
}
 */
function impl_SaveRoute_OnClick()
{
	chkUI('SaveRoute');//TODO:
}


function impl_OptimizeRoute_OnClick()
{
	if( chkUI('OptimizeRoute') ){
		$NPCtrl('lay_Map').show();
		ShowMap(true);
	}
}

function impl_PlanRoute_OnClick()
{
	if( chkUI('PlanRoute') ){
		$NPCtrl('lay_Map').show();
		ShowMap(false);
	}
}

function impl_btn_changeRouteOrder_OnClick(action)
{
	NP.WebServiceProxy.Data2(pageName,'changeRouteOrder', action, null);
	NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
}

function VerifyGMapKey(map) {
	var imgDiv = document.createElement('div');
	var imgKey = document.createElement('img');
	if(apiKey != '') {
		imgKey.style.filter = 'alpha(opacity=60)';
		imgKey.src	  = 'Sys/Images/YES-LICENSE.png';
	}
	else {
		imgKey.style.filter = 'alpha(opacity=80)';
		imgKey.src	  = 'Sys/Images/NO-LICENSE.png';
	}
	imgKey.draggable  = false;
	imgDiv.appendChild(imgKey);
	map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(imgDiv);
}

function handleNoGeolocation(map,errorFlagPlan)
{
	var initialLocationPlan;
	if (errorFlagPlan == true)
	{
		//alert("Geolocation service failed.");
		initialLocationPlan = new google.maps.LatLng(40.69847032728747, -73.9514422416687);//newyork
	} 
	else
	{
		//alert("Your browser doesn't support geolocation. We've placed you in Malaysia.");
		initialLocationPlan = new google.maps.LatLng(4.214943, 102.304688);//malaysia
	}
	map.setCenter(initialLocationPlan);
}

function MoveToCurrentLocation(map)
{
	// Try W3C Geolocation (Preferred)
	if(navigator.geolocation)
	{
		navigator.geolocation.getCurrentPosition(function(position) {
			initialLocationPlan = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
			map.setCenter(initialLocationPlan);
		}, function() {
			handleNoGeolocation(map,true);
		});
		// Try Google Gears Geolocation
	}
	/*  The Google Gears API is  no longer available
	else if (google.gears)
	{
		var geo = google.gears.factory.create('beta.geolocation');
		geo.getCurrentPosition(function(position) {
			initialLocationPlan = new google.maps.LatLng(position.latitude,position.longitude);
			map.setCenter(initialLocationPlan);
		}, function() {
			handleNoGeolocation(map,true);
		});
		// Browser doesn't support Geolocation
	}*/
	else
	{
		handleNoGeolocation(map,false);
	}
}

function setMarkers(oms, map, location, startPoint, endPoint, instance)
{
	var markers=[];
	var infowindow = null;
	var image = null;
	var marker = null;
	//TIP:add start/end marker 
	
	marksWayPoints = (instance * 10);
	if (instance == 0)
		marksWayPoints = marksWayPoints;
	else
		marksWayPoints = marksWayPoints - (instance);

	var temp = '';	
	
	if (instance == 0){
		image = new google.maps.MarkerImage('App/dms/Images/markers/marker0S.png', //<== TODO , for your start marker
				new google.maps.Size(20,34),
				new google.maps.Point(0,0),
				new google.maps.Point(10,33),
				new google.maps.Size(20,34));
		temp = '<table style="text-align:left;float:left;">'+
					   '<tr><td rowspan="5">"' + startPoint.CUST_CD+'"</td></tr>'+				   
					   '</table>';
		marker = new google.maps.Marker({
			position: startPoint.POINT,
			content:temp,
			map: map,
			icon: image,
			animation: google.maps.Animation.DROP
		});
		marker.CUST_CD = startPoint.CUST_CD;
	
		infowindow = new google.maps.InfoWindow;({content: this.content});
		google.maps.event.addListener(marker, 'click', function() 
		{
			infowindow.setContent(this.content);
			infowindow.open(map,this);
			
			//NP.WebServiceProxy.Data2(pageName,'changeRouteOrder', 'selectRow|'+this.CUST_CD, null);
			//NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
		});
		console.log("SET MARKET: " + startPoint.CUST_CD + ', NUMBER: ' + marksWayPoints);
		markers.push(marker);
		oms.addMarker(marker);
	}
	
	
	var pinNumber = marksWayPoints;//by location array order
	for(var i = 0; i < location.length; i++)
	{
		pinNumber++;
		var place = location[i];
		image = new google.maps.MarkerImage('App/dms/Images/markers/marker0'+pinNumber+'.png',
				new google.maps.Size(20,34),
				new google.maps.Point(0,0),
				new google.maps.Point(10,33),
				new google.maps.Size(20,34));
		temp = '<table style="text-align:left;float:left;">'+
				   '<tr><td rowspan="5">"' + place[2]+'"</td></tr>'+				   
				   '</table>';
		var myLatLng = new google.maps.LatLng(place[0],place[1]);
		marker = new google.maps.Marker({
			position: myLatLng,
			content:temp,
			map: map,
			icon: image,
			animation: google.maps.Animation.DROP
		});
		marker.CUST_CD = place[2]; //TIP: save custCd to marker
		
		
		
		infowindow = new google.maps.InfoWindow;({content: this.content});
		google.maps.event.addListener(marker, 'click', function() 
		{
			infowindow.setContent(this.content);
			infowindow.open(map,this);
			
			//NP.WebServiceProxy.Data2(pageName,'changeRouteOrder', 'selectRow|'+this.CUST_CD, null);
			//NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
		});
		console.log("SET MARKET: " + place[2] + ', NUMBER: ' + pinNumber);
		markers.push(marker);
		oms.addMarker(marker);
	}
	
	marksWayPoints = pinNumber + 1;
	image = new google.maps.MarkerImage('App/dms/Images/markers/marker0' + marksWayPoints + '.png', //<== TODO , for your start marker
			new google.maps.Size(20,34),
			new google.maps.Point(0,0),
			new google.maps.Point(10,33),
			new google.maps.Size(20,34));
	temp = '<table style="text-align:left;float:left;">'+
				   '<tr><td rowspan="5">"' + endPoint.CUST_CD+'"</td></tr>'+				   
				   '</table>';
	marker = new google.maps.Marker({
		position: endPoint.POINT,
		content:temp,
		map: map,
		icon: image,
		animation: google.maps.Animation.DROP
	});
	marker.CUST_CD = endPoint.CUST_CD;
	
	infowindow = new google.maps.InfoWindow;({content: this.content});
	google.maps.event.addListener(marker, 'click', function() 
	{
		infowindow.setContent(this.content);
		infowindow.open(map,this);
		
		//NP.WebServiceProxy.Data2(pageName,'changeRouteOrder', 'selectRow|'+this.CUST_CD, null);
		//NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
	});	
	console.log("SET MARKET: " + endPoint.CUST_CD + ', NUMBER: ' + marksWayPoints);
	markers.push(marker);
	oms.addMarker(marker);
	
	
	google.maps.event.addListener(map,'click', function() {
		if(infowindow != null){
			infowindow.close();
		}
	});
	
	oms.addListener('spiderfy', function(markers) {
		if(infowindow != null){
			infowindow.close();
		}
	});		 
	
	oms.addListener('unspiderfy', function(markers) {
		if(infowindow != null){
			infowindow.close();
		}
	});
	
	return markers;
}

function ShowMap(optimize)
{
	var GMapPlan = $('#mapPlan')[0];
	
	var myOptionsPlan = {
		 zoom	   : 1
		,mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	if(mapPlan == null) {
		mapPlan = new google.maps.Map(GMapPlan, myOptionsPlan);
		VerifyGMapKey(mapPlan);
	}
	else {
		mapPlan.setZoom(1);
		for(var i = 0; i < mapPlanMarkers.length; i++)
			mapPlanMarkers[i].setMap(null);
		mapPlanMarkers = [];
		for(var i = 0; i < mapPlanDirections.length; i ++)
			mapPlanDirections[i].setMap(null);
		mapPlanDirections = [];
	}

	if(oms != null) {
		oms.clearMarkers();
	}
	oms = new OverlappingMarkerSpiderfier(mapPlan);

	MoveToCurrentLocation(mapPlan);

	var polylineOptionsPlan = {
		  strokeColor: '#0000FF',
		  strokeOpacity: 1.0,
		  strokeWeight: 5
		  };
	var directionsServicePlan = new google.maps.DirectionsService;
	

	var jsonPlan = NP.WebServiceProxy.Data('getRouteData', '', null);
	var objPlanPackage = $.parseJSON(jsonPlan);
	var startPoint = objPlanPackage.startPoint;
	var endPoint = objPlanPackage.endPoint;
	var objPlan = objPlanPackage.wayPoints;
	
	
	var startPlan = new google.maps.LatLng( startPoint[0], startPoint[1] );
	var endPlan = new google.maps.LatLng( endPoint[0], endPoint[1] );
	
	var wayptsPlan = [];
	
	var lengthPlan = objPlan.length;
	for (var rowPlan = 0; rowPlan < lengthPlan; rowPlan++)
	{
		wayptsPlan.push({
			location:new google.maps.LatLng(objPlan[rowPlan].LATITUDE,objPlan[rowPlan].LONGITUDE),
			stopover:true
		});
	}

	var requestPlan = {
		origin: startPlan,
		destination: endPlan,
		waypoints: wayptsPlan,
		optimizeWaypoints: optimize,
		travelMode: google.maps.DirectionsTravelMode.DRIVING
	};
	
	directionsServicePlan.route(requestPlan,function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			var directionsRendererPlan = new google.maps.DirectionsRenderer({suppressMarkers: true, polylineOptions: polylineOptionsPlan});
			directionsRendererPlan.setMap(mapPlan);
			directionsRendererPlan.setDirections(response);
			mapPlanDirections.push(directionsRendererPlan);
			
			var waypoint_order = response.routes[0].waypoint_order;
			var newWaypoint_order = "";
			
			var markersArrayPlan = [];
			for(var i = 0; i < waypoint_order.length ; i++ ){
				var newOrder = waypoint_order[i];//zero based
				var wayPoint = objPlan[ newOrder ];
				markersArrayPlan.push([wayPoint.LATITUDE,wayPoint.LONGITUDE,wayPoint.ROW_NO,wayPoint.CUST_CD,wayPoint.CUST_NAME,wayPoint.IMAGES,wayPoint.DIST_CD,wayPoint.NETSLS_AMT,wayPoint.SLSORD_AMT,wayPoint.VISIT_DT]);
				
				newOrder+=1;//one based
				if( newWaypoint_order.length > 0 )
					newWaypoint_order += "|" + newOrder;
				else
					newWaypoint_order += ""  + newOrder;
			}
			//TIP: must be save to window.mapPlanMarkers for changes
			window.mapPlanMarkers = mapPlanMarkers = setMarkers(oms,mapPlan,markersArrayPlan, startPlan, endPlan);
			
			NP.WebServiceProxy.Data2(pageName,'optimizeRoute', newWaypoint_order, null);
			NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
		}
	});
	
	var infowindow = new google.maps.InfoWindow;({content: this.content});

	
	google.maps.event.addListener(mapPlan, 'click', function() {
		if(infowindow != null){
			infowindow.close();
		}
	});
}