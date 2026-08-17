using System.Reflection;

namespace CrmApi.Authorization;

public static class Permissions
{
    public static readonly List<PermissionInfo> All = new();

    static Permissions()
    {
        var types = typeof(Permissions).GetNestedTypes(BindingFlags.Public | BindingFlags.Static);
        foreach (var type in types)
        {
            var fields = type.GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly);
            foreach (var field in fields)
            {
                if (field.FieldType == typeof(string) && field.GetValue(null) is string name)
                {
                    All.Add(new PermissionInfo(name, type.Name));
                }
            }
        }
    }

    public static string[] GetAll() => All.Select(p => p.Name).ToArray();
    public static string[] GetByModule(string module) => All.Where(p => p.Module == module).Select(p => p.Name).ToArray();

    public class PermissionInfo
    {
        public string Name { get; }
        public string Module { get; }
        public PermissionInfo(string name, string module)
        {
            Name = name;
            Module = module;
        }
    }

    public static class Dashboard
    {
        public const string View = "Dashboard.View";
        public const string ViewLive = "Dashboard.ViewLive";
        public const string ViewStats = "Dashboard.ViewStats";
        public const string ViewQuality = "Dashboard.ViewQuality";
    }

    public static class CallCRM
    {
        public const string View = "CallCRM.View";
        public const string MakeCall = "CallCRM.MakeCall";
        public const string ViewHistory = "CallCRM.ViewHistory";
        public const string Analyze = "CallCRM.Analyze";
        public const string BatchAnalyze = "CallCRM.BatchAnalyze";
        public const string Export = "CallCRM.Export";
    }

    public static class Contacts
    {
        public const string View = "Contacts.View";
        public const string Create = "Contacts.Create";
        public const string Edit = "Contacts.Edit";
        public const string Delete = "Contacts.Delete";
        public const string Import = "Contacts.Import";
        public const string Export = "Contacts.Export";
        public const string Assign = "Contacts.Assign";
    }

    public static class Leads
    {
        public const string View = "Leads.View";
        public const string Create = "Leads.Create";
        public const string Edit = "Leads.Edit";
        public const string Delete = "Leads.Delete";
        public const string Import = "Leads.Import";
        public const string Export = "Leads.Export";
        public const string Assign = "Leads.Assign";
        public const string Qualify = "Leads.Qualify";
        public const string Recycle = "Leads.Recycle";
        public const string ManageFiles = "Leads.ManageFiles";
        public const string ManageFolders = "Leads.ManageFolders";
    }

    public static class Agenda
    {
        public const string View = "Agenda.View";
        public const string Create = "Agenda.Create";
        public const string Edit = "Agenda.Edit";
        public const string Delete = "Agenda.Delete";
        public const string Confirm = "Agenda.Confirm";
        public const string ManageAll = "Agenda.ManageAll";
    }

    public static class Performance
    {
        public const string View = "Performance.View";
        public const string ViewOwn = "Performance.ViewOwn";
        public const string ViewAgents = "Performance.ViewAgents";
        public const string Compare = "Performance.Compare";
        public const string Export = "Performance.Export";
    }

    public static class Attendance
    {
        public const string View = "Attendance.View";
        public const string ClockIn = "Attendance.ClockIn";
        public const string ClockOut = "Attendance.ClockOut";
        public const string StartBreak = "Attendance.StartBreak";
        public const string EndBreak = "Attendance.EndBreak";
        public const string ViewTeam = "Attendance.ViewTeam";
        public const string Manage = "Attendance.Manage";
        public const string Export = "Attendance.Export";
    }

    public static class Evaluations
    {
        public const string View = "Evaluations.View";
        public const string Create = "Evaluations.Create";
        public const string Edit = "Evaluations.Edit";
        public const string Delete = "Evaluations.Delete";
        public const string ViewAll = "Evaluations.ViewAll";
        public const string Manage = "Evaluations.Manage";
        public const string Export = "Evaluations.Export";
    }

    public static class Messages
    {
        public const string View = "Messages.View";
        public const string Send = "Messages.Send";
        public const string Broadcast = "Messages.Broadcast";
        public const string ManageUrgent = "Messages.ManageUrgent";
    }

    public static class Salaries
    {
        public const string View = "Salaries.View";
        public const string ViewOwn = "Salaries.ViewOwn";
        public const string Calculate = "Salaries.Calculate";
        public const string ManageRules = "Salaries.ManageRules";
        public const string ManagePayment = "Salaries.ManagePayment";
        public const string Export = "Salaries.Export";
    }

    public static class Users
    {
        public const string View = "Users.View";
        public const string Create = "Users.Create";
        public const string Edit = "Users.Edit";
        public const string Delete = "Users.Delete";
        public const string ManageRoles = "Users.ManageRoles";
    }

    public static class Roles
    {
        public const string View = "Roles.View";
        public const string Create = "Roles.Create";
        public const string Edit = "Roles.Edit";
        public const string Delete = "Roles.Delete";
        public const string AssignPermissions = "Roles.AssignPermissions";
    }

    public static class PermissionsModule
    {
        public const string View = "Permissions.View";
        public const string Assign = "Permissions.Assign";
    }

    public static class Scoring
    {
        public const string View = "Scoring.View";
        public const string ViewAlerts = "Scoring.ViewAlerts";
        public const string ManageAlerts = "Scoring.ManageAlerts";
        public const string Configure = "Scoring.Configure";
    }

    public static class Reports
    {
        public const string View = "Reports.View";
        public const string Create = "Reports.Create";
        public const string Export = "Reports.Export";
        public const string ViewAll = "Reports.ViewAll";
    }

    public static class Config
    {
        public const string View = "Config.View";
        public const string Edit = "Config.Edit";
        public const string ManageSystem = "Config.ManageSystem";
    }

    public static class Chatbot
    {
        public const string View = "Chatbot.View";
        public const string Use = "Chatbot.Use";
    }

    public static class Followups
    {
        public const string View = "Followups.View";
        public const string Manage = "Followups.Manage";
    }

    public static class Planning
    {
        public const string View = "Planning.View";
        public const string Manage = "Planning.Manage";
    }

    public static class GDPR
    {
        public const string View = "GDPR.View";
        public const string Export = "GDPR.Export";
        public const string Anonymize = "GDPR.Anonymize";
        public const string Delete = "GDPR.Delete";
    }

    public static class Integrations
    {
        public const string View = "Integrations.View";
        public const string Manage = "Integrations.Manage";
    }

    public static class Analytics
    {
        public const string View = "Analytics.View";
        public const string ViewGeo = "Analytics.ViewGeo";
        public const string Export = "Analytics.Export";
    }

    public static class Pipeline
    {
        public const string View = "Pipeline.View";
        public const string Manage = "Pipeline.Manage";
    }

    public static class Alerts
    {
        public const string View = "Alerts.View";
        public const string Manage = "Alerts.Manage";
        public const string Configure = "Alerts.Configure";
    }

    public static class AiScoring
    {
        public const string View = "AiScoring.View";
        public const string Score = "AiScoring.Score";
        public const string DetectFakeRdv = "AiScoring.DetectFakeRdv";
        public const string Eligibility = "AiScoring.Eligibility";
    }
}
