// Backend/Constants/Permissions.cs
namespace Backend.Constants
{
	public static class Permissions
	{
		// ========== FILE PERMISSIONS ==========
		public static class Files
		{
			public const string View = "Files.View";
			public const string ViewContent = "Files.ViewContent";
			public const string ViewDetails = "Files.ViewDetails";
			public const string Upload = "Files.Upload";
			public const string Rename = "Files.Rename";
			public const string Delete = "Files.Delete";
			public const string Inject = "Files.Inject";
			public const string Download = "Files.Download";
			public const string Export = "Files.Export";
			public const string Share = "Files.Share";
			public const string Archive = "Files.Archive";
			public const string Restore = "Files.Restore";
			public const string Search = "Files.Search";
			public const string Validate = "Files.Validate";
        }

		// ========== SUPPLIER PERMISSIONS ==========
		public static class Suppliers
		{
			public const string View = "Suppliers.View";
			public const string Create = "Suppliers.Create";
			public const string Edit = "Suppliers.Edit";
			public const string Delete = "Suppliers.Delete";
			public const string AssignFiles = "Suppliers.AssignFiles";
			public const string ViewContacts = "Suppliers.ViewContacts";
			public const string ExportContacts = "Suppliers.ExportContacts";
		}

		// ========== LEAD TYPE PERMISSIONS ==========
		public static class LeadTypes
		{
			public const string View = "LeadTypes.View";
			public const string Create = "LeadTypes.Create";
			public const string Edit = "LeadTypes.Edit";
			public const string Delete = "LeadTypes.Delete";
			public const string AssignSuppliers = "LeadTypes.AssignSuppliers";
		}
        // ====================== AGENTS ======================
        public static class Agents
        {
            public const string View = "Agents.View";
            public const string ViewAll = "Agents.ViewAll";                    // See all agents (Admin, Technique, Qualité)
            public const string ViewOtherAgendas = "Agents.ViewOtherAgendas"; // Elite feature
            public const string Manage = "Agents.Manage";                      // Create, edit, delete agents
            public const string ViewPerformance = "Agents.ViewPerformance";
            public const string ViewPointage = "Agents.ViewPointage";
            public const string Evaluate = "Agents.Evaluate";                  // Service Qualité
        }
        // ====================== APPOINTMENTS (RDV / Agendas) ======================
        public static class Appointments
        {
            public const string View = "Appointments.View";
            public const string ViewOwn = "Appointments.ViewOwn";
            public const string ViewTeam = "Appointments.ViewTeam";           // Confirmatrice
            public const string Manage = "Appointments.Manage";
            public const string Confirm = "Appointments.Confirm";             // Confirmatrice actions
            public const string Assign = "Appointments.Assign";               // Assign to Commercial
        }

        // ====================== STATISTICS ======================
        public static class Statistics
        {
            public const string ViewGlobal = "Statistics.ViewGlobal";
            public const string ViewPersonal = "Statistics.ViewPersonal";
            public const string ViewTeam = "Statistics.ViewTeam";
        }

        // ====================== CONTACTS ======================
        public static class Contacts
        {
            public const string View = "Contacts.View";
            public const string Create = "Contacts.Create";
            public const string Qualify = "Contacts.Qualify";                 // Qualifier fiche
            public const string Update = "Contacts.Update";
            public const string ViewHistory = "Contacts.ViewHistory";
        }
        // ========== COUNTRY PERMISSIONS ==========
        public static class Countries
		{
			public const string View = "Countries.View";
			public const string Create = "Countries.Create";
			public const string Edit = "Countries.Edit";
			public const string Delete = "Countries.Delete";
		}

		// ========== USER MANAGEMENT ==========
		public static class Users
		{
			public const string View = "Users.View";
			public const string Create = "Users.Create";
			public const string Edit = "Users.Edit";
			public const string Delete = "Users.Delete";
			public const string AssignRoles = "Users.AssignRoles";
			public const string AssignPermissions = "Users.AssignPermissions";
			public const string ResetPassword = "Users.ResetPassword";
			public const string Impersonate = "Users.Impersonate";
		}

		// ========== ROLE MANAGEMENT ==========
		public static class Roles
		{
			public const string View = "Roles.View";
			public const string Create = "Roles.Create";
			public const string Edit = "Roles.Edit";
			public const string Delete = "Roles.Delete";
			public const string AssignPermissions = "Roles.AssignPermissions";
		}

		// ========== AUDIT & REPORTING ==========
		public static class Audit
		{
			public const string View = "Audit.View";
			public const string Export = "Audit.Export";
			public const string Delete = "Audit.Delete";
		}

		public static class Reports
		{
			public const string View = "Reports.View";
			public const string Create = "Reports.Create";
			public const string Export = "Reports.Export";
			public const string Schedule = "Reports.Schedule";
		}

		// ========== CAMPAIGN PERMISSIONS ==========
		public static class Campaigns
		{
			public const string View = "Campaigns.View";
			public const string Create = "Campaigns.Create";
			public const string Edit = "Campaigns.Edit";
			public const string Delete = "Campaigns.Delete";
			public const string Launch = "Campaigns.Launch";
			public const string Pause = "Campaigns.Pause";
			public const string Stop = "Campaigns.Stop";
			public const string ViewResults = "Campaigns.ViewResults";
			public const string ExportResults = "Campaigns.ExportResults";
		}

		// ========== DASHBOARD PERMISSIONS ==========
		public static class Dashboard
		{
			public const string View = "Dashboard.View";
			public const string ViewAnalytics = "Dashboard.ViewAnalytics";
			public const string ExportStats = "Dashboard.ExportStats";
			public const string Configure = "Dashboard.Configure";
		}

		// ========== SYSTEM PERMISSIONS ==========
		public static class System
		{
			public const string ViewSettings = "System.ViewSettings";
			public const string EditSettings = "System.EditSettings";
			public const string ViewLogs = "System.ViewLogs";
			public const string ClearCache = "System.ClearCache";
			public const string Backup = "System.Backup";
			public const string Restore = "System.Restore";
		}
	}
}