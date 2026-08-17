using CrmApi.DTOs.Alert;
using FluentValidation;

namespace CrmApi.Validators;

public class CreateAlertRuleDtoValidator : AbstractValidator<CreateAlertRuleDto>
{
    public CreateAlertRuleDtoValidator()
    {
        RuleFor(x => x.RuleType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ThresholdValue).GreaterThan(0);
        RuleFor(x => x.NotificationEmail).EmailAddress().When(x => !string.IsNullOrEmpty(x.NotificationEmail));
    }
}

public class UpdateAlertRuleDtoValidator : AbstractValidator<UpdateAlertRuleDto>
{
    public UpdateAlertRuleDtoValidator()
    {
        RuleFor(x => x.ThresholdValue).GreaterThan(0).When(x => x.ThresholdValue.HasValue);
    }
}
