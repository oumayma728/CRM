using CrmApi.DTOs.Ai;
using FluentValidation;

namespace CrmApi.Validators;

public class EligibilityRequestDtoValidator : AbstractValidator<EligibilityRequestDto>
{
    public EligibilityRequestDtoValidator()
    {
        RuleFor(x => x.Revenus).GreaterThanOrEqualTo(0).When(x => x.Revenus.HasValue);
        RuleFor(x => x.CreditScore).InclusiveBetween(0, 1000).When(x => x.CreditScore.HasValue);
        RuleFor(x => x.Consommation).GreaterThanOrEqualTo(0).When(x => x.Consommation.HasValue);
        RuleFor(x => x.ProjectType).Must(p => p == null || new[] { "PV", "PAC", "ISOLATION", "POMPE" }.Contains(p.ToUpper()))
            .WithMessage("Type de projet invalide").When(x => x.ProjectType != null);
    }
}
