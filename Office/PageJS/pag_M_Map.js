function impl_OnPostInit() {
	$('#pag_M_Map_map_Plan_Value').css({'margin':'auto','background-color':' #09F','z-index':1});
	$('#pag_M_Map_map_Actual_Value').css({'margin':'auto','background-color':' #09F','z-index':1});
	$('#pag_M_Map_map_OverLap_Value').css({'margin':'auto','background-color':' #09F','z-index':1});
	
    var dat_ID = 'pag_M_Map_dat_Date';
    $('#' + dat_ID + '_SelectButton').click(function(){ setTimeout(function(){$('#' + dat_ID + '_ajax_CalendarExtender_popupDiv').css('z-index', 1000); }, 200); }); 	
}

function impl_map_OverLap_OnInit()
{
	var imgDivLegendary = document.createElement('div');
	var imgLegendary = document.createElement('img');
	imgLegendary.src = 'App/dms/Images/legendary.png';
	imgLegendary.draggable	= false;
	imgDivLegendary.appendChild(imgLegendary);
	imgDivLegendary.style['padding'] = '8px';
	
	NPMAP.ConfigureMapLegend( map_OverLap, NPMAP.LegendPosition.LeftBottom, imgDivLegendary );
}

function impl_btn_Sidebyside_OnClick()
{
    var jqSLSMAN_CD = $(NP.UI.GetNPControl('drp_SLSMAN_CD'));
    var jqDate      = $(NP.UI.GetNPControl('dat_Date'));
    var msg = NP.WebServiceProxy.Data('chkUI', 'Sidebyside|' + jqSLSMAN_CD.val() + '|' + jqDate.val(), null);
	var tmp = msg.split('|');
 
    $('#pag_M_Map_lay_Overlap').hide();
    $('#pag_M_Map_lay_Map').show();
    $('#pag_M_Map_lay_Grid').show();
    NP.UI.GridViewReload('grd_LegendPlan');
    NP.UI.GridViewReload('grd_LegendActual');

    if(tmp[0] == 'E') {
		alert(tmp[1]);
		return false;
	}
	else if(tmp[0] == 'O') { 
		NP.UI.GetNPControl('lbl_SLSMAN_CD').innerText = tmp[1]; 
		NP.UI.GetNPControl('lbl_VISIT_DT').innerText = tmp[2]; 
		NP.UI.GetNPControl('lbl_SLSMAN_NAME').innerText = tmp[3]; 
	} 
	
    ShowSideBySideMap();

    return false;
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

function ShowSideBySideMap()
{
    //Begin of Origin Route Plan
	if(map_Plan) {
		MoveToCurrentLocation(map_Plan);
		map_Plan.ExecServerAction('Sidebyside','');
	}
	// End of Origin Route Plan

	// Begin of Actual Route Plan
	if(map_Actual) {
		MoveToCurrentLocation(map_Actual);
		map_Actual.ExecServerAction('Sidebyside','');
	}
	// End of Actual Route Plan
}


function impl_btn_Overlap_OnClick()
{
    var jqSLSMAN_CD = $(NP.UI.GetNPControl('drp_SLSMAN_CD'));
    var jqDate      = $(NP.UI.GetNPControl('dat_Date'));
    var msg = NP.WebServiceProxy.Data('chkUI', 'Overlap|' + jqSLSMAN_CD.val() + '|' + jqDate.val(), null);
    var tmp = msg.split('|');

    $('#pag_M_Map_lay_Map').hide();
    $('#pag_M_Map_lay_Overlap').show();
    $('#pag_M_Map_lay_Grid').show();
    NP.UI.GridViewReload('grd_LegendPlan');
    NP.UI.GridViewReload('grd_LegendActual');

    if(tmp[0] == 'E') {
		alert(tmp[1]);
		return false;
	}
	else if(tmp[0] == 'O') { 
		NP.UI.GetNPControl('lbl_SLSMAN_CD1').innerText = tmp[1]; 
		NP.UI.GetNPControl('lbl_VISIT_DT1').innerText = tmp[2]; 
		NP.UI.GetNPControl('lbl_SLSMAN_NAME1').innerText = tmp[3]; 
	} 
	
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
