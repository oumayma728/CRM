namespace Backend.Constants
{
    public static class QualificationStatuses
    {
        public const string NRP = "nrp";
        public const string RdvClient1 = "rdv_client1";
        public const string RdvClient2 = "rdv_client2";
        public const string RdvClient3 = "rdv_client3";
        public const string Refus = "refus";
        public const string PasInteresse = "pas_interesse";
        public const string HCLogement = "hc_logement";
        public const string HCLangue = "hc_langue";
        public const string HCConsommation = "hc_consommation";
        public const string ARappeler = "a_rappeler";
        public const string Occupe = "occupe";
        public const string NePlusRappeler = "ne_plus_rappeler";
        public const string Porte = "porte";
        public const string PasSigne = "pas_signe";
    }

    public static class CallStatus
    {
        public const string Pending = "Pending";
        public const string Assigned = "Assigned";
        public const string Deferred = "Deferred";
        public const string Completed = "Completed";
        public const string ManualRecycleOnly = "ManualRecycleOnly";
        public const string Blacklisted = "Blacklisted";
        public const string TimedOut = "TimedOut";
    }
    public static class NextActions
    {
        public const string None = "None";
        public const string Callback = "Callback";
        public const string NearCampaignEnd = "NearCampaignEnd";
        public const string ManualRecycleOnly = "ManualRecycleOnly";
        public const string Blacklist = "Blacklist";
    }

    public static class ContactNoteTypes
    {
        public const string General = "general";
        public const string Appel = "appel";
        public const string Qualification = "qualification";
        public const string Confirmation = "confirmation";
        public const string Commercial = "commercial";
        public const string Systeme = "systeme";
    }
}
