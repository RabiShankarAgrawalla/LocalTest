
function impl_OnPostInit() {
	
	
	var drawViewDivId;
	var imagefileName;
	var drawData;

	var rowno = 0;
	
	var varReturnFlag = NP.WebServiceProxy.Data2('pag_TM_PS_VSSView', 'DWS_NPGetFlag', null, null);
	
	if (varReturnFlag == 'true')
	{
		var selTxnKey = $(NP.UI.GetNPGridColumn2('pag_TM_PS_VSSView','grd_v_List','ITEM.TXN_KEY_hidden'));
		var selScoreCard = $(NP.UI.GetNPGridColumn2('pag_TM_PS_VSSView','grd_v_List','ITEM.SCORECARD_CD_hidden'));
		var selLineCd = $(NP.UI.GetNPGridColumn2('pag_TM_PS_VSSView','grd_v_List','ITEM.LINE_CD_hidden'));
		var selKPIDesc = $(NP.UI.GetNPGridColumn2('pag_TM_PS_VSSView','grd_v_List','ITEM.grs_TARGET_KPI'));

		var passSel = selTxnKey[rowno].textContent + "|" + selScoreCard[rowno].textContent + "|" + selLineCd[rowno].textContent;

		//alert(passSel);
		var varReturn = NP.WebServiceProxy.Data2('pag_TM_PS_VSSView', 'DWS_NPDrawData', passSel, null);
		var obj = $.parseJSON(varReturn);

		var txt_Title  = $(NP.UI.GetNPControl2('pag_TM_PS_VSSView','lbl_DrawDataTitle'));

		var varReturn2 = NP.WebServiceProxy.Data2('pag_TM_PS_VSSView', 'DWS_NPDrawDataCount', null, null);
		var varDrawCount = parseInt(varReturn2);


		for (var ai = 0; ai < varDrawCount; ai++) {
			if (ai < obj.length)
			{
				drawViewDivId   = 'dragZone' + ai;
				imagefileName   = obj[ai].PICTURE;
				drawData        = obj[ai].JSON;

				NPDraw.Binding(drawViewDivId,imagefileName,drawData);
			}
			else
			{
				drawViewDivId   = 'dragZone' + ai;
				imagefileName   = "";
				drawData        = "";

				NPDraw.Binding(drawViewDivId,imagefileName,drawData);
			}

		}

		if (obj.length > 0)
		{
			$(txt_Title).text('Target KPI: ' + selKPIDesc[rowno].textContent);
			var photo_grd  = $('#pag_TM_PS_VSSView_grd_PhotoTaking');
			photo_grd.hide();
		}
		else
		{
			$(txt_Title).text('');
		}
		
		var varReturnFlag2 = NP.WebServiceProxy.Data2('pag_TM_PS_VSSView', 'DWS_NPSetFlag', null, null);
	
	}	
}

this.impl_grs_TARGET_KPI_OnClick = function(htmlCode)
{
    
	var drawViewDivId;
    var imagefileName;
    var drawData;

    var ohtml = $.parseHTML( htmlCode );
    var rowno = ohtml[0].getAttribute("__np.tr.grid.rowindex")

    var selTxnKey = $(NP.UI.GetNPGridColumn2('pag_TM_PS_VSSView','grd_v_List','ITEM.TXN_KEY_hidden'));
    var selScoreCard = $(NP.UI.GetNPGridColumn2('pag_TM_PS_VSSView','grd_v_List','ITEM.SCORECARD_CD_hidden'));
    var selLineCd = $(NP.UI.GetNPGridColumn2('pag_TM_PS_VSSView','grd_v_List','ITEM.LINE_CD_hidden'));
    var selKPIDesc = $(NP.UI.GetNPGridColumn2('pag_TM_PS_VSSView','grd_v_List','ITEM.grs_TARGET_KPI'));

    var passSel = selTxnKey[rowno].textContent + "|" + selScoreCard[rowno].textContent + "|" + selLineCd[rowno].textContent;

    //alert(passSel);
    var varReturn = NP.WebServiceProxy.Data2('pag_TM_PS_VSSView', 'DWS_NPDrawData', passSel, null);
    var obj = $.parseJSON(varReturn);

    var txt_Title  = $(NP.UI.GetNPControl2('pag_TM_PS_VSSView','lbl_DrawDataTitle'));

    /*
    for (var ai = 0; ai < obj.length; ai++) {
        drawViewDivId   = 'dragZone' + ai;
        imagefileName   = obj[ai].PICTURE;
        drawData        = obj[ai].JSON;

        NPDraw.Binding(drawViewDivId,imagefileName,drawData);

    }*/

    var varReturn2 = NP.WebServiceProxy.Data2('pag_TM_PS_VSSView', 'DWS_NPDrawDataCount', null, null);
    var varDrawCount = parseInt(varReturn2);


    for (var ai = 0; ai < varDrawCount; ai++) {
        if (ai < obj.length)
        {
            drawViewDivId   = 'dragZone' + ai;
            imagefileName   = obj[ai].PICTURE;
            drawData        = obj[ai].JSON;

            NPDraw.Binding(drawViewDivId,imagefileName,drawData);
        }
        else
        {
            drawViewDivId   = 'dragZone' + ai;
            imagefileName   = "";
            drawData        = "";

            NPDraw.Binding(drawViewDivId,imagefileName,drawData);
        }

    }

    if (obj.length > 0)
    {
        $(txt_Title).text('Target KPI: ' + selKPIDesc[rowno].textContent);
		var photo_grd  = $('#pag_TM_PS_VSSView_grd_PhotoTaking');
		photo_grd.hide();
	}
	else
	{
		$(txt_Title).text('');
    }
	
	//var photo_grd  = $(NP.UI.GetNPControl2('pag_TM_PS_VSSView','grd_PhotoTaking'));
	
   return true;
}
