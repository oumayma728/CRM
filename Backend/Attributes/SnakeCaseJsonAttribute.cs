namespace Backend.Attributes;

/// <summary>
/// Marks a controller (or action) whose JSON contract is snake_case.
/// The modules that came from the khaled-dev-v3 branch (analytics, calls,
/// quality dashboard, attendance, salaries…) were written against a
/// snake_case API, and the frontend still consumes them that way.
/// Request bodies are accepted in either snake_case or camelCase.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true)]
public sealed class SnakeCaseJsonAttribute : Attribute { }
