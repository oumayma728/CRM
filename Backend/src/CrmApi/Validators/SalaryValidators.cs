using CrmApi.DTOs.Salary;
using FluentValidation;

namespace CrmApi.Validators;

public class CreateSalaryRuleDtoValidator : AbstractValidator<CreateSalaryRuleDto>
{
    public CreateSalaryRuleDtoValidator()
    {
        RuleFor(x => x.RuleName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RuleType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Role).Must(r => r == null || new[] { "agent", "qualite", "admin" }.Contains(r.ToLower()))
            .WithMessage("Role invalide");
    }
}

public class UpdateSalaryRuleDtoValidator : AbstractValidator<UpdateSalaryRuleDto>
{
    public UpdateSalaryRuleDtoValidator()
    {
        RuleFor(x => x.RuleName).MaximumLength(100).When(x => x.RuleName != null);
        RuleFor(x => x.RuleType).MaximumLength(50).When(x => x.RuleType != null);
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(0).When(x => x.Amount.HasValue);
    }
}

public class PaymentStatusDtoValidator : AbstractValidator<PaymentStatusDto>
{
    public PaymentStatusDtoValidator()
    {
        RuleFor(x => x.Status).NotEmpty()
            .Must(s => new[] { "pending", "paid", "cancelled" }.Contains(s.ToLower()))
            .WithMessage("Statut de paiement invalide");
    }
}
