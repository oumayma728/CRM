using Microsoft.EntityFrameworkCore;

namespace Backend.Helpers;

public static class DbErrors
{
    /// <summary>
    /// True when PostgreSQL refused a write because of a UNIQUE index (error 23505).
    /// Used to turn "two requests at the same time" into a clear message instead of an HTTP 500.
    /// </summary>
    public static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is Npgsql.PostgresException { SqlState: "23505" };
}
