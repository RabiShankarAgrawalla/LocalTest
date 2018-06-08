/* global jQuery */
/* global $ */
/* global NPDraw */
/*!
 * Because need to compatible IE7~8. Use dom and css to implement. Canvas is supported at IE9 above.  The is simplify veriosn.
 * Depends:
 *  jquery.js
 */
(function ($) {
//START    
  var VERSION = 1.1;
  
  //internal global variables
  
  var ie = (function(){
    var undef,rv = -1; // Return value assumes failure.
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    var trident = ua.indexOf('Trident/');
    
    if (msie > 0) {
      // IE 10 or older => return version number
      rv = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    } else if (trident > 0) {
      // IE 11 (or newer) => return version number
      var rvNum = ua.indexOf('rv:');
      rv = parseInt(ua.substring(rvNum + 3, ua.indexOf('.', rvNum)), 10);
    }
    
    return ((rv > -1) ? rv : undef);
  }());
  
  //alert(ie);

  var OutFrameDivHTML = '<div class="NPOfficeDraw_outFrame"></div>';
  var InFrameDivHTML = '<div class="NPOfficeDraw_inFrame"></div>';
  
  //all outFrame and inFrame are same level under the div.NPOfficeDraw_drawZone
  function newShape($drawViewDiv,shapeType,_id,_pos,_size)
  {   
    var scale = parseFloat($drawViewDiv.data( 'orgscale' ) );
    
    //exception handle
    if( typeof _pos.left === 'undefined' 
      || typeof _pos.top === 'undefined' 
      || typeof _size.width === 'undefined' 
      || typeof _size.height === 'undefined' )//why no any pos or size,how to display
      return;
    
    //Currently, On display, inframe and outframe is same level. inframe is not put in outframe.  
    if(shapeType==="outframe"){
      
      var newOutFrameDiv = $(OutFrameDivHTML);

      $drawViewDiv.append(newOutFrameDiv);
      if(_id){
        newOutFrameDiv.attr('id', _id);
      }
      if(_pos){
        newOutFrameDiv.css({ left: _pos.left*scale , top: _pos.top*scale });
        newOutFrameDiv.data({ orgleft: _pos.left, orgtop: _pos.top });
      }
      if(_size){
        newOutFrameDiv.css({ width:_size.width*scale,height:_size.height*scale});
        newOutFrameDiv.data({ orgwidth: _size.width, orgheight: _size.height });
      }
      return true;
    }else if(shapeType==="inframe"){
      var newInFrameDiv = $(InFrameDivHTML);
      $drawViewDiv.append(newInFrameDiv);
      if(_id){
        $(newInFrameDiv).attr('id', _id);
      }
      if(_pos){
        $(newInFrameDiv).css({ left: _pos.left*scale , top: _pos.top*scale });
        $(newInFrameDiv).data({ orgleft: _pos.left, orgtop: _pos.top });
      }
      if(_size){
        $(newInFrameDiv).css({width:_size.width*scale,height:_size.height*scale});
        $(newInFrameDiv).data({ orgwidth: _size.width, orgheight: _size.height });
      }
      return true;
    }
    return false;
  }
  
  
    
  function loadImg($bgImg,url,callback){
    //IE8 32k limit on data:uri on base64 encode
    //http://stackoverflow.com/questions/3586749/how-to-get-around-ie8-32k-limit-on-datauri-on-base64-encode
    $bgImg.attr("src", url).load(function(){
      if(callback){
        if(ie <= 8){
          // naturalWidth, naturalHeight IE7 IE8 unsupported
          callback($bgImg[0].width,$bgImg[0].height);
        } else {//Non IE or IE9 above
          callback($bgImg[0].naturalWidth,$bgImg[0].naturalHeight);
        }
      }
    }).each(function() {
		if(this.complete && ie<=8)
			$(this).load();
	});
  }

  
  function resizeBGImage($drawViewDiv)
  {
      var host_w = $drawViewDiv.width(),
          host_h = $drawViewDiv.height();
			
      var orgBGWidth = parseFloat( $drawViewDiv.data('orgBGWidth') );
      var orgBGHeight = parseFloat( $drawViewDiv.data('orgBGHeight') );
        
      var $bgImg = $drawViewDiv.find('.NPOfficeDraw_drawZoneIMG');
      if(  host_w / host_h < orgBGWidth / orgBGHeight ){
        $bgImg.css( { width:'100%',height:'auto' } ); 
      }else{
        $bgImg.css( { width:'auto',height:'100%' } );
      }
      var scale = parseFloat( $bgImg.width() ) / orgBGWidth;
      $drawViewDiv.data( {orgscale:scale } );
  }

  function setBG($drawViewDiv,imagefileName,callback)
  {
    loadImg($drawViewDiv.find('.NPOfficeDraw_drawZoneIMG'),imagefileName,function(width,height){

      $drawViewDiv.data( {orgBGWidth:width, orgBGHeight:height } );
      resizeBGImage($drawViewDiv);

      if(callback)
        callback();
    });
  }
  
  function deleteAllShape($drawViewDiv)
  {
    $drawViewDiv.children( ".NPOfficeDraw_outFrame" ).remove();
  }
  
  function Binding(drawViewDivId,imagefileName,drawData)
  {
    var $drawViewDiv = bindingDiv(drawViewDivId);
    if( $drawViewDiv && $drawViewDiv.length > 0 ){
      deleteAllShape($drawViewDiv);
      setBG($drawViewDiv,imagefileName,function(){
        if(drawData){
          var drawDataJSON;
          try {
            drawDataJSON = (typeof drawData === 'string') ? jQuery.parseJSON(drawData) : drawData;
          } catch (e) { 
            alert('NPOfficeDraw: invalid drawData format');
          }//parse error
          if( drawDataJSON && drawDataJSON.shape ){
            //console.log( JSON.stringify(drawData) );
            setShapeJSONData($drawViewDiv,drawDataJSON.shape);
          }
        }
      });
    }
  }
  
  
  function setShapeJSONData($drawViewDiv,shape)
  {
    for(var i=0;i < shape.outframe.length; i++){
       var outframe = shape.outframe[i];
       newShape($drawViewDiv,'outframe',outframe.id, {left:outframe.x,top:outframe.y},{width:outframe.w,height:outframe.h});
       var inframes = outframe.inframe;
       for(var j=0;j < inframes.length; j++){
        var inframe = inframes[j];
        newShape($drawViewDiv,'inframe',inframe.id, {left:inframe.x,top:inframe.y},{width:inframe.w,height:inframe.h});
       }
    }
  }
  
 
  function Resize($drawViewDiv)
  {      
    resizeBGImage($drawViewDiv);
    
    var scale = parseFloat($drawViewDiv.data( 'orgscale' ) );
    
    $( $drawViewDiv ).children(".NPOfficeDraw_outFrame.NPOfficeDraw_inFrame").each(function( index ) {
      var $item = $(this);
      var data = $item.data() || {};
      $item.css({ left: data.orgleft * scale, top: data.orgtop * scale });
      $item.width( data.orgwidth * scale );
      $item.height( data.orgheight * scale );
    });
  }
  
  var timer = null;
  function waitReadyFor(conditonCallback,readyCallback,delay)
  {
    if(timer){
      clearInterval(timer);
      timer = null;
    }
    delay = delay || 10;
    if(conditonCallback()){
      readyCallback();
    }else{
      timer = setInterval(function(){ 
        waitReadyFor(conditonCallback,readyCallback,delay*2);
      },delay);
    }
  }
  
  function ChangeSize(drawViewDivId,customWidth,customHeight)
  {
    var $drawViewDiv = $('#'+drawViewDivId);
    if($drawViewDiv.length > 0 ){
      if(customWidth)
        $drawViewDiv.css( { width:customWidth});
      if(customHeight)
        $drawViewDiv.css( { height:customHeight});
		
      var scale = parseFloat($drawViewDiv.data( 'orgscale' ) ); 
      if( isNaN(scale) ){
        // IE9 above encounter
        // wait image load ready 
        waitReadyFor( function() {
          var scale = parseFloat( $drawViewDiv.data( 'orgscale' ) );
          return !isNaN(scale);
        }, function() {
          Resize($drawViewDiv,customWidth,customHeight);
        });
      } else {
        Resize($drawViewDiv,customWidth,customHeight);
      }
    }else{
      alert('NPOfficeDraw: Can not find id:' + drawViewDivId + ' to changeSize DrawView');
    }
  }
  
  function bindingDiv(drawViewDivId)
  {
      var $drawViewDiv = $('#'+drawViewDivId);
      if( $drawViewDiv.length == 0 ){
        alert('NPOfficeDraw: Can not find id:' + drawViewDivId + ' to binding DrawView');
        return null;
      }
      var w = $drawViewDiv.width();
      var h = $drawViewDiv.height();
      var drawViewHtml = '<div id="' + drawViewDivId + '" class="NPOfficeDraw_drawZone" ><img class="NPOfficeDraw_drawZoneIMG" /></div>';
      $drawViewDiv.replaceWith( drawViewHtml );
      $drawViewDiv = $('#'+drawViewDivId);
      //we using relative of position in NPOfficeDraw_drawZone
      $drawViewDiv.css( { left: "0px", top: "0px",  width: w, height: h } );
      return $drawViewDiv;
  }
    
  window.NPDraw = {
    version: VERSION,
    Binding: Binding,
    ChangeSize: ChangeSize
  };
 //END 
})(jQuery); 