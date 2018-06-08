;(function() {
	
	//implement office engine specially function
	
	//override 
	NPMAP.ConfigureMapLegend=function(mapObj,legendPosition, domDiv)
	{
		if( google && mapObj && domDiv )
		{
			var position = ( legendPosition == NPMAP.LegendPosition.LeftTop ? google.maps.ControlPosition.LEFT_TOP :
							 legendPosition == NPMAP.LegendPosition.LeftBottom ? google.maps.ControlPosition.LEFT_BOTTOM :
							 legendPosition == NPMAP.LegendPosition.RightTop ? google.maps.ControlPosition.RIGHT_TOP : google.maps.ControlPosition.RIGHT_BOTTOM );
			mapObj.GetMapCanves().controls[position].push(domDiv);
		}
	}

	//Must be implemenet
	NPMAP.loader=function(readyCallback,urlOptionObj)
	{
		var loaderFolder = NPMAP.loaderFolder;
		NPMAP.loadCSS(loaderFolder+'map_Main.css');

		var googleUrl = "https://maps.googleapis.com/maps/api/js?" + NPMAP.composeToUrl(urlOptionObj);

		NPMAP.loadJS(googleUrl, function(){
			NPMAP.loadJS(loaderFolder+ 'map_google.js',function(){
				NPMAP.loadJS(loaderFolder+'oms.min.js',function(){
					NPMAP.loadJS(loaderFolder+'latlon.js',function(){
						if(readyCallback)
							readyCallback();
					});
				});
			});
		});
	};


})();