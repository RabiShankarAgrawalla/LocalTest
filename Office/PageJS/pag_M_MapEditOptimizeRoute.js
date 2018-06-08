
function impl_OnPostInit() 
{	
	$('#pag_M_MapEditOptimizeRoute_map_Optimize_Value').css({'margin':'auto','background-color':' #09F','z-index':1});
	
	//if ($('#pag_M_MapEditOptimizeRoute_lay_DetailPnl').visible(false))
	if($('#pag_M_MapEditOptimizeRoute_lay_DetailPnl').css('display') == 'none')
	{
		impl_LoadRoute_OnClick();
	}		
	

}

function chkUI(mode)
{
	//TODO: by your condition
	var jqSLSMAN_CD = $(NP.UI.GetNPControl('drp_SLSMAN_CD'));
	var jqDate		= $(NP.UI.GetNPControl('dat_Date_From'));
	var jqDateTo    = $(NP.UI.GetNPControl('dat_Date_To'));
	
	var msg = NP.WebServiceProxy.Data('chkUI', '' + mode + '|' + jqSLSMAN_CD.val() + '|' + jqDate.val(), jqDateTo.val(), null);
	var tmp = msg.split('|');
	
	if(tmp[0] == 'E') {
		alert(tmp[1]);
		return false;
	}
	else if(tmp[0] == 'O') { 
		//NP.UI.GetNPControl('lbl_SLSMAN_CD').innerText = tmp[1] ; 
		//NP.UI.GetNPControl('lbl_VISIT_DT').innerText = tmp[2]; 
		//NP.UI.GetNPControl('lbl_SLSMAN_NAME').innerText = tmp[3]; 
		//NP.UI.GetNPControl('lbl_HeaderPlan').innerText = tmp[4]; 
	}
	return true;
}

function checkHideShow(action)
{
	//To hide show btn
	if(action == "YES")
	{		
		//NP.UI.GetNPControl('btn_Update').disabled = false;
		//NP.UI.GetNPControl('btn_Top').disabled = false;
		//NP.UI.GetNPControl('btn_Up').disabled = false;
		//NP.UI.GetNPControl('btn_Down').disabled = false;
		//NP.UI.GetNPControl('btn_Bottom').disabled = false;
		//NP.UI.GetNPControl('btn_PlanRoute').disabled = true;
		
		$('#pag_M_MapEditOptimizeRoute_btn_Up_Value').removeClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Up_Value').addClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Up_Value').prop('disabled', false);
		
		$('#pag_M_MapEditOptimizeRoute_btn_Update_Value').removeClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Update_Value').addClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Update_Value').prop('disabled', false);
		
		$('#pag_M_MapEditOptimizeRoute_btn_Top_Value').removeClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Top_Value').addClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Top_Value').prop('disabled', false);
		
		$('#pag_M_MapEditOptimizeRoute_btn_Down_Value').removeClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Down_Value').addClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Down_Value').prop('disabled', false);
		
		$('#pag_M_MapEditOptimizeRoute_btn_Bottom_Value').removeClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Bottom_Value').addClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Bottom_Value').prop('disabled', false);
		
		$('#pag_M_MapEditOptimizeRoute_btn_PlanRoute_Value').removeClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_PlanRoute_Value').addClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_PlanRoute_Value').prop('disabled', false);
	}
	else if(action == "NO")
	{
		//NP.UI.GetNPControl('btn_Update').disabled = true;
		//NP.UI.GetNPControl('btn_PlanRoute').disabled = true;
		//NP.UI.GetNPControl('btn_Top').disabled = true;
		//NP.UI.GetNPControl('btn_Up').disabled = true;
		//NP.UI.GetNPControl('btn_Down').disabled = true;
		//NP.UI.GetNPControl('btn_Bottom').disabled = true;
		
		$('#pag_M_MapEditOptimizeRoute_btn_Up_Value').removeClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Up_Value').addClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Up_Value').prop('disabled', true);
		
		$('#pag_M_MapEditOptimizeRoute_btn_Update_Value').removeClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Update_Value').addClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Update_Value').prop('disabled', true);
		
		$('#pag_M_MapEditOptimizeRoute_btn_Top_Value').removeClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Top_Value').addClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Top_Value').prop('disabled', true);
		
		$('#pag_M_MapEditOptimizeRoute_btn_Down_Value').removeClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Down_Value').addClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Down_Value').prop('disabled', true);
		
		$('#pag_M_MapEditOptimizeRoute_btn_Bottom_Value').removeClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_Bottom_Value').addClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_Bottom_Value').prop('disabled', true);
		
		$('#pag_M_MapEditOptimizeRoute_btn_PlanRoute_Value').removeClass('Button');
		$('#pag_M_MapEditOptimizeRoute_btn_PlanRoute_Value').addClass('Button_Disable');
		$('#pag_M_MapEditOptimizeRoute_btn_PlanRoute_Value').prop('disabled', true);
	}
	
	
}

function impl_navigateRoute_OnClick(mode){
	
	var msg = NP.WebServiceProxy.Data('navigateRoute', mode, null);
	var tmp = msg.split('|');
	
	if (msg.charAt(0) == 'E')
	{		
		alert(tmp[1]);
		return;
	}
	
	checkHideShow(tmp[2]);	
	//getDistributorLocation();

	NP.UI.GetNPControl('lbl_VISIT_DT').innerText = tmp[1];
	NP.UI.GetNPControl('lbl_TotalDistance').innerText = tmp[0] + "KM";
	NP.UI.GridViewReload2(pageName,'grd_LegendPlan');
	NPMAP.OldGetOptimizeRouteCallback = NPMAP.GetOptimizeRouteCallback;
	navigateOptimizeRoute(mode);
}

function getDistributorLocation()
{
	var msg2 = NP.WebServiceProxy.Data('getDistLoc', '', null);	
	var tmp2 = msg2.split('|');
	if(tmp2[0] != '' && tmp2[1] != '') 
	{
		NP.UI.GetNPControl('lbl_DistStart').innerText = tmp2[0];
		NP.UI.GetNPControl('lbl_DistEnd').innerText = tmp2[1];
	}
}

function impl_LoadRoute_OnClick()
{
	var jqSLSMAN_CD = $(NP.UI.GetNPControl('drp_SLSMAN_CD'));
	var jqDate		= $(NP.UI.GetNPControl('dat_Date_From'));
	var jqDateTo    = $(NP.UI.GetNPControl('dat_Date_To'));		
	var lblDateFrom = NP.UI.GetNPControl('dat_Date_From');
	
	var msg = NP.WebServiceProxy.Data('LoadRouteOrderDistance', '' + jqSLSMAN_CD.val() + '|' + jqDate.val() + '|' +	jqDateTo.val(), null);
	var tmp = msg.split('|');
	
	if (msg.charAt(0) == 'E')
	{
		alert(tmp[1]);
		return;
	}
	
	$('#pag_M_MapEditOptimizeRoute_lay_DetailPnl').show();
	checkHideShow(tmp[1]);
			
	var objRoutePlan = $.parseJSON(tmp[2]);
	for(var i in objRoutePlan)
	{
		if (objRoutePlan[i].START_DT){			
			NP.UI.GetNPControl('lbl_SLSMAN_NAME').innerText = objRoutePlan[i].SLSMAN_NAME; 
		}
	}
	
	NP.UI.GetNPControl('lbl_VISIT_DT').innerText = jqDate.val();
	NP.UI.GetNPControl('lbl_TotalDistance').innerText = tmp[0] + "KM";
	NP.UI.GridViewReload2(pageName,'grd_LegendPlan');
	NPMAP.OldGetOptimizeRouteCallback = NPMAP.GetOptimizeRouteCallback;
	StartOptimizeRoute();
	
	return;
}

function HookGetOptimizeRouteCallback(mapObj)
{
	mapObj.OptimizeRouteCallback=function(waypoint_ID_order)
	{
		mapObj.ExecServerAction("NPOptimizeRouteCallback",waypoint_ID_order);
		NP.UI.GridViewReload2(pageName,'grd_LegendPlan');

		//change to original
		NPMAP.GetOptimizeRouteCallback = NPMAP.OldGetOptimizeRouteCallback;
	}
	return mapObj.OptimizeRouteCallback;
}

function StartOptimizeRoute()
{
	if(map_Optimize) 
	{
		MoveToCurrentLocation(map_Optimize);
		NPMAP.GetOptimizeRouteCallback = HookGetOptimizeRouteCallback;
		map_Optimize.ExecServerAction('OptimizeRoute','');
	}
}

function navigateOptimizeRoute(mode)
{
    if(map_Optimize) 
	{
		MoveToCurrentLocation(map_Optimize);
		NPMAP.GetOptimizeRouteCallback = HookGetOptimizeRouteCallback;
	
		if(mode == "P")		
			map_Optimize.ExecServerAction('OptimizeRoute_P','');			//Previous Date
		else if(mode == "N")
			map_Optimize.ExecServerAction('OptimizeRoute_N','');			//Next Date
		else if(mode == "O")
			map_Optimize.ExecServerAction('OptimizeRoute_O','');			//Reset
		else if(mode == "V")
			map_Optimize.ExecServerAction('OptimizeRoute_V','');			//Preview
	}
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

function impl_btn_changeRouteOrder_OnClick(action)
{	
	var msg = NP.WebServiceProxy.Data2(pageName,'changeRouteOrder', action, null);
	var tmp = msg.split('|');
	
	if (msg.charAt(0) == 'S')
	{
		NP.UI.GetNPControl('btn_PlanRoute').disabled = false;
	}
	
	if (msg.charAt(0) == 'E')
	{
		alert(tmp[1]);
		return;
	}
	else if (msg.charAt(0) == 'M')
	{
		alert(tmp[1]);
		return;
	}
	else
	{
		NP.UI.GridViewReload2(pageName,'grd_LegendPlan'); 
	}
}
