
function impl_OnPostInit() {
	
	
	var drawViewDivId;
	var imagefileName;
	var drawData;

	var rowno = 0;
	
	var varReturnFlag = NP.WebServiceProxy.Data2('pag_TM_PS_FacingAuditView', 'DWS_NPGetFlag', null, null);
	
	if (varReturnFlag == 'true')
	{
		var selTxnKey = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.TXN_KEY_hidden'));
		var selBrand = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.BRAND_CD_hidden'));
		var selLoc = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.LOC_CD_hidden'));
		var selBrandDesc = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.grs_BRAND_D'));
		var selPerc = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.PERCENTAGE'));

		var passSel = selTxnKey[rowno].textContent + "|" + selBrand[rowno].textContent + "|" + selLoc[rowno].textContent;

		//alert(passSel);
		var varReturn = NP.WebServiceProxy.Data2('pag_TM_PS_FacingAuditView', 'DWS_NPDrawData', passSel, null);
		var obj = $.parseJSON(varReturn);

		var txt_Title  = $(NP.UI.GetNPControl2('pag_TM_PS_FacingAuditView','lbl_DrawDataTitle'));
		var txt_Perc  = $(NP.UI.GetNPControl2('pag_TM_PS_FacingAuditView','lbl_DrawDataPercent'));

		var varReturn2 = NP.WebServiceProxy.Data2('pag_TM_PS_FacingAuditView', 'DWS_NPDrawDataCount', null, null);
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
			$(txt_Title).text('Brand: ' + selBrandDesc[rowno].textContent);
			$(txt_Perc).text('Facing (%): ' + selPerc[rowno].textContent);
		}
		else
		{
			$(txt_Title).text('');
			$(txt_Perc).text('');
		}
		
		var varReturnFlag2 = NP.WebServiceProxy.Data2('pag_TM_PS_FacingAuditView', 'DWS_NPSetFlag', null, null);
	
	}	
}

this.impl_grs_BRAND_CD_OnClick = function(htmlCode)
{
    
	var drawViewDivId;
    var imagefileName;
    var drawData;

    var ohtml = $.parseHTML( htmlCode );
    var rowno = ohtml[0].getAttribute("__np.tr.grid.rowindex")

    var selTxnKey = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.TXN_KEY_hidden'));
    var selBrand = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.BRAND_CD_hidden'));
    var selLoc = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.LOC_CD_hidden'));
    var selBrandDesc = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.grs_BRAND_D'));
	var selPerc = $(NP.UI.GetNPGridColumn2('pag_TM_PS_FacingAuditView','grd_v_List','ITEM.PERCENTAGE'));

    var passSel = selTxnKey[rowno].textContent + "|" + selBrand[rowno].textContent + "|" + selLoc[rowno].textContent;

    //alert(passSel);
    var varReturn = NP.WebServiceProxy.Data2('pag_TM_PS_FacingAuditView', 'DWS_NPDrawData', passSel, null);
    var obj = $.parseJSON(varReturn);

    var txt_Title  = $(NP.UI.GetNPControl2('pag_TM_PS_FacingAuditView','lbl_DrawDataTitle'));
	var txt_Perc  = $(NP.UI.GetNPControl2('pag_TM_PS_FacingAuditView','lbl_DrawDataPercent'));

    /*
    for (var ai = 0; ai < obj.length; ai++) {
        drawViewDivId   = 'dragZone' + ai;
        imagefileName   = obj[ai].PICTURE;
        drawData        = obj[ai].JSON;

        NPDraw.Binding(drawViewDivId,imagefileName,drawData);

    }*/

    var varReturn2 = NP.WebServiceProxy.Data2('pag_TM_PS_FacingAuditView', 'DWS_NPDrawDataCount', null, null);
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
        $(txt_Title).text('Brand: ' + selBrandDesc[rowno].textContent);
		$(txt_Perc).text('Facing (%): ' + selPerc[rowno].textContent);
	}
	else
	{
		$(txt_Title).text('');
		$(txt_Perc).text('');
    }

   return true;
}
