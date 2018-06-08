<%@ WebHandler Language="C#" Class="ImgHandler" %>

using System;
using System.Web;
using System.Net;
using System.IO;
using System.Xml;

public class ImgHandler : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {
        System.Data.SqlClient.SqlDataReader rdr = null;
        System.Data.SqlClient.SqlConnection conn = null;
        System.Data.SqlClient.SqlCommand selcmd = null;

		try
        {
			XmlDocument doc = new XmlDocument();
            string path = System.Web.HttpContext.Current.Server.MapPath("~/App/");
            string dmsName = string.Empty;
            
            using (StreamReader sr = new StreamReader(path + "WebMappingList.ini"))
            {
                dmsName = sr.ReadToEnd().Split(',')[1].Replace("\r\n","");
            }
            path = System.Web.HttpContext.Current.Server.MapPath("~/App/" + dmsName + "/");
            doc.Load(path + dmsName + "_cfg.xml");
            XmlNodeList value = doc.SelectNodes("SYS_PARAMETERS/SYS_PARAMETER[@key='DefaultConnectionName']");
            string connectionString = string.Empty;
            foreach (XmlNode item in value)
            {
                connectionString = item.Attributes["value"].Value;
                break;
            }
			
			conn = new System.Data.SqlClient.SqlConnection(System.Configuration.ConfigurationManager.ConnectionStrings[connectionString].ConnectionString);
			
			selcmd = new System.Data.SqlClient.SqlCommand(string.Format("EXEC SBE_GET_PHOTO_PATH '{0}', '{1}'",context.Request.QueryString["DIST_CD"],context.Request.QueryString["CUST_CD"])  , conn);
			conn.Open();
			rdr = selcmd.ExecuteReader();
			while (rdr.Read())
			{
				context.Response.ContentType = "image/jpg";
				context.Response.BinaryWrite((byte[])rdr["PHOTO"]);
			}
			if (rdr != null)
			rdr.Close();
		}
        finally
        {
          if (conn != null)
              conn.Close();
        }
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }
}