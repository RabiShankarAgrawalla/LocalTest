function impl_OnPostInit()
{
	var username = NP.WebServiceProxy.Data2('pag_RPT_Datazen','wsgUserID', '', null);
	var guid = NP.WebServiceProxy.Data2('pag_RPT_Datazen','wsgGUID', '', null);

	$("#frame1").attr("src", document.URL.substr(0,document.URL.lastIndexOf('/')) + "/datazen.aspx?username="+username+"&guid="+guid);
	return;
}
