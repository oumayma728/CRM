namespace CrmApi.DTOs.Common;

public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class SuccessResponse
{
    public bool Success { get; set; } = true;
    public string? Message { get; set; }
}

public class ErrorResponse
{
    public string Error { get; set; } = string.Empty;
}
