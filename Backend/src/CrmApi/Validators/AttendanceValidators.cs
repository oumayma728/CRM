using CrmApi.DTOs.Attendance;
using FluentValidation;

namespace CrmApi.Validators;

public class BreakRequestDtoValidator : AbstractValidator<BreakRequestDto>
{
    public BreakRequestDtoValidator()
    {
        RuleFor(x => x.Type).NotEmpty()
            .Must(t => new[] { "pause", "dejeuner", "autre" }.Contains(t.ToLower()))
            .WithMessage("Type de pause invalide");
    }
}
