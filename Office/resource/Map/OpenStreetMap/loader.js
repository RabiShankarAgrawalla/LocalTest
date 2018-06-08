;(function() {
	
	//implement office engine specially function
	
	var oldCreateMap = NPMAP.CreateMap;
	//override 
	NPMAP.CreateMap=function(pageName,ctrlName,options)
	{
		options.RouterKey = options.RouterKey || this.ApiKeyObj.RouterKey;
		options.GeocoderKey = options.GeocoderKey || this.ApiKeyObj.GeocoderKey;
		return oldCreateMap(pageName,ctrlName,options);
	}
	
	NPMAP.ConfigureMapLegend=function(mapObj,legendPosition, domDiv)
	{
		if( L && mapObj && domDiv )
		{
			var position = ( legendPosition == NPMAP.LegendPosition.LeftTop ? "topleft" :
							 legendPosition == NPMAP.LegendPosition.LeftBottom ? "bottomleft":
							 legendPosition == NPMAP.LegendPosition.RightTop ? "topright" : "bottomright" );
			var legendControl = L.Control.extend({
				options: {
					position: position
				},
				onAdd: function (map) {
					return domDiv;
				}
			});
			mapObj.GetMapCanves().addControl(new legendControl());
		}
	}

	//Must be implemenet
	NPMAP.loader=function(readyCallback,urlOptionObj)
	{
		var loaderFolder = NPMAP.loaderFolder;
		NPMAP.loadCSS(loaderFolder+'map_Main.css');
		NPMAP.loadCSS(loaderFolder+'leaflet_0.7.7/leaflet.css');
		NPMAP.loadCSS(loaderFolder+'leaflet-routing-machine/leaflet-routing-machine.css');
		NPMAP.loadCSS(loaderFolder+'lrm-mapzen/css/leaflet.routing.mapzen.css');

		NPMAP.loadJS(loaderFolder+'leaflet_0.7.7/leaflet.js', function(){
			NPMAP.loadJS(loaderFolder+'map_OpenStreetMap.js',function(){
				NPMAP.loadJS(loaderFolder+'leaflet-routing-machine/leaflet-routing-machine-myChangs.js',function(){
					NPMAP.loadJS(loaderFolder+'leaflet-locatecontrol/L.Control.Locate.min.js',function(){
						NPMAP.loadJS(loaderFolder+'leaflet-control-geocoder-1.4.0/Control.Geocoder.js',function(){
							NPMAP.loadJS(loaderFolder+'lrm-mapzen/lrm-mapzen.min.js',function(){
								NPMAP.loadJS(loaderFolder+'oms_Leaflet.min.js',function(){
									if(readyCallback)
										readyCallback();
								});
							});
						});
					});
				});
			});
		});
	};


})();