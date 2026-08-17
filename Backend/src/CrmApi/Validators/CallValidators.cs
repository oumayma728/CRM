using CrmApi.DTOs.Call;
using FluentValidation;

namespace CrmApi.Validators;

public class CallSaveDtoValidator : AbstractValidator<CallSaveDto>
{
    public CallSaveDtoValidator()
    {
        RuleFor(x => x.Phone).MaximumLength(20).When(x => x.Phone != null);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));
        RuleFor(x => x.Duration).GreaterThan(0).When(x => x.Duration.HasValue);
    }
}
