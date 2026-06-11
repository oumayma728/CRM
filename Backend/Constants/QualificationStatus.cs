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
        public const string Porte = "porte";
        public const string PasSigné = "pas_signe";
    }

    public static class CallStatus
    {
        public const string Pending = "Pending";
        public const string Assigned = "Assigned";
        public const string Completed = "Completed";
        public const string TimedOut = "TimedOut";
    }
}