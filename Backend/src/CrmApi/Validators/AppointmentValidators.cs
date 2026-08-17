using CrmApi.DTOs.Appointment;
using FluentValidation;

namespace CrmApi.Validators;

public class CreateAppointmentDtoValidator : AbstractValidator<CreateAppointmentDto>
{
    public CreateAppointmentDtoValidator()
    {
        RuleFor(x => x.ClientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.AppointmentDate).NotEmpty();
        RuleFor(x => x.AppointmentTime).NotEmpty();
        RuleFor(x => x.ClientEmail).EmailAddress().When(x => !string.IsNullOrEmpty(x.ClientEmail));
        RuleFor(x => x.CreditScore).InclusiveBetween(0, 1000).When(x => x.CreditScore.HasValue);
        RuleFor(x => x.Revenus).GreaterThanOrEqualTo(0).When(x => x.Revenus.HasValue);
    }
}

public class UpdateAppointmentDtoValidator : AbstractValidator<UpdateAppointmentDto>
{
    public UpdateAppointmentDtoValidator()
    {
        RuleFor(x => x.ClientEmail).EmailAddress().When(x => !string.IsNullOrEmpty(x.ClientEmail));
        RuleFor(x => x.CreditScore).InclusiveBetween(0, 1000).When(x => x.CreditScore.HasValue);
        RuleFor(x => x.Revenus).GreaterThanOrEqualTo(0).When(x => x.Revenus.HasValue);
    }
}

public class UpdateAppointmentStatusDtoValidator : AbstractValidator<UpdateAppointmentStatusDto>
{
    public UpdateAppointmentStatusDtoValidator()
    {
        RuleFor(x => x.Status).NotEmpty()
            .Must(s => new[] { "pending", "confirmed", "cancelled", "done", "no_show" }.Contains(s))
            .WithMessage("Statut invalide");
    }
}
