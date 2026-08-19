using CrmApi.DTOs.Quality;
using FluentValidation;

namespace CrmApi.Validators;

public class CreateEvaluationDtoValidator : AbstractValidator<CreateEvaluationDto>
{
    public CreateEvaluationDtoValidator()
    {
        RuleFor(x => x.AgentId).GreaterThan(0);
        RuleFor(x => x.GlobalScore).InclusiveBetween(0, 100).When(x => x.GlobalScore.HasValue);
        RuleFor(x => x.Decision).MaximumLength(50).When(x => x.Decision != null);
    }
}
