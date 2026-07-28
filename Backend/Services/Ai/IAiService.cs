using Backend.DTOs.Ai;

namespace Backend.Services.Ai;

public interface IAiService
{
    Task<EligibilityResultDto> ScoreEligibilityAsync(EligibilityRequestDto dto);
    Task<EligibilityResultDto> AnalyzeEligibilityAsync(long userId, EligibilityRequestDto dto);
    Task<FakeRdvResultDto> DetectFakeRdvAsync(FakeRdvRequestDto dto);
    Task<AiInsightsDto> GetInsightsAsync(long agentId);
    Task<QualificationResultDto> CheckQualificationAsync(QualificationCheckDto dto);
    Task<AppointmentDetectResultDto> DetectAppointmentAsync(AppointmentDetectDto dto);
    Task<AnonymizeResultDto> AnonymizeTranscriptAsync(AnonymizeDto dto);
    Task<InactivityResultDto> AnalyzeInactivityAsync(InactivityRequestDto dto);
    Task<RefusalResultDto> DetectRefusalAsync(RefusalCheckDto dto);
    Task<DiarizationResultDto> DiarizeTranscriptAsync(DiarizationRequestDto dto, int? callDuration = null);
    Task<SummarizeResultDto> SummarizeTranscriptAsync(SummarizeRequestDto dto);
    Task<ScriptAnalysisResultDto> AnalyzeScriptAsync(ScriptAnalysisRequestDto dto);
    Task<PostalCodeExtractResultDto> ExtractPostalCodeAsync(PostalCodeExtractRequestDto dto);
}
