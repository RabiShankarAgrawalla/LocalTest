function impl_OnPostInit() {
	$('#pag_T_NewCustomerMap_map_OverLap_Value').css({'margin':'auto','background-color':' #09F','z-index':1});
	
    var dat_ID = 'pag_T_NewCustomerMap_dat_Date';
    $('#' + dat_ID + '_SelectButton').click(function(){ setTimeout(function(){$('#' + dat_ID + '_ajax_CalendarExtender_popupDiv').css('z-index', 1000); }, 200); }); 	
}

function impl_map_OverLap_OnInit()
{
	/*var imgDivLegendary = document.createElement('div');
	var imgLegendary = document.createElement('img');
	imgLegendary.src = 'App/dms/Images/legendary.png';
	imgLegendary.draggable	= false;
	imgDivLegendary.appendChild(imgLegendary);
	imgDivLegendary.style['padding'] = '8px';
	
	NPMAP.ConfigureMapLegend( map_OverLap, NPMAP.LegendPosition.LeftBottom, imgDivLegendary );*/
}


function MoveToCurrentLocation(map1)
{
	// Try W3C Geolocation (Preferred)
	if(navigator.geolocation)
	{
		navigator.geolocation.getCurrentPosition(function(position) {
			map1.SetCenter(position.coords.latitude,position.coords.longitude);
		}, function() {
			handleNoGeolocation(map1,true);
		});
	}
	// Try Google Gears Geolocation
	else if (google.gears)
	{
		var geo = google.gears.factory.create('beta.geolocation');
		geo.getCurrentPosition(function(position) {
			map1.setCenter(position.latitude,position.longitude);
		}, function() {
			handleNoGeolocation(map1,true);
		});
	}
	// Browser doesn't support Geolocation
	else
	{
		handleNoGeolocation(map1,false);
	}
}

function handleNoGeolocation(map1,errorFlagPlan)
{
	var initialLocationPlan = null;
	if (errorFlagPlan == true)
	{
		//alert("Geolocation service failed.");
		initialLocationPlan = [40.69847032728747, -73.9514422416687];//newyork
	} 
	else
	{
		//alert("Your browser doesn't support geolocation. We've placed you in Malaysia.");
		initialLocationPlan = [4.214943, 102.304688];//malaysia
	}
	map1.SetCenter(initialLocationPlan[0],initialLocationPlan[1]);
}


function impl_btn_Overlap_OnClick()
{
    var msg = NP.WebServiceProxy.Data('Overlap|' , null);
    var tmp = msg.split('|');
/*
    if(tmp[0] == 'E') {
		$('#pag_T_NewCustomerMap_lay_Button').hide();
		alert(tmp[1]);
		return false;
	} 
	
	if(tmp[0] == 'R') {
		$('#pag_T_NewCustomerMap_lay_Button').hide();
		alert(tmp[1]);
		return false;
	} 
	
	if(tmp[0] == 'H') {
		$('#pag_T_NewCustomerMap_lay_Button').hide();
	} 
	
	if(tmp[0] == 'O') {
		$('#pag_T_NewCustomerMap_lay_Button').show();
	} 
*/	
	$('#pag_T_NewCustomerMap_lay_Button').show();
	$('#pag_T_NewCustomerMap_lay_Overlap').show();
	
    ShowOverlapMap();

    return false;
}

function ShowOverlapMap()
{
	if(map_OverLap) 
	{
		MoveToCurrentLocation( map_OverLap );
		map_OverLap.ExecServerAction('Overlap','');
	}
}
