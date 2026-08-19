using CrmApi.Data;
using CrmApi.Helpers;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using System.Globalization;
using System.Text;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/export")]
[Authorize(Roles = "admin")]
public class ExportController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ExportController> _logger;

    public ExportController(ApplicationDbContext context, ILogger<ExportController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("calls")]
    public async Task<IActionResult> ExportCalls([FromQuery] string format = "csv", [FromQuery] string? agentName = null)
    {
        var query = _context.Calls.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(agentName))
            query = query.Where(c => c.AgentName == agentName);

        var calls = await query.OrderByDescending(c => c.CallDate).ToListAsync();

        if (format == "xlsx")
            return ExportToExcel(calls, "Calls");

        return ExportToCsv(calls, "calls");
    }

    [HttpGet("leads")]
    public async Task<IActionResult> ExportLeads([FromQuery] string format = "csv")
    {
        var leads = await _context.Leads.AsNoTracking().OrderByDescending(l => l.Id).ToListAsync();

        if (format == "xlsx")
            return ExportToExcel(leads, "Leads");

        return ExportToCsv(leads, "leads");
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> ExportAttendance([FromQuery] string format = "csv", [FromQuery] string? month = null)
    {
        var query = _context.Attendances.AsNoTracking().Include(a => a.User).AsQueryable();
        if (!string.IsNullOrEmpty(month) && DateTime.TryParse(month + "-01", out var parsed))
        {
            query = query.Where(a => a.Date.Year == parsed.Year && a.Date.Month == parsed.Month);
        }

        var records = await query.OrderByDescending(a => a.Date).ToListAsync();

        if (format == "xlsx")
            return ExportToExcel(records, "Attendance");

        return ExportToCsv(records, "attendance");
    }

    [HttpGet("salaries")]
    public async Task<IActionResult> ExportSalaries([FromQuery] string format = "csv", [FromQuery] string? month = null)
    {
        var query = _context.Salaries.AsNoTracking().Include(s => s.Agent).AsQueryable();
        if (!string.IsNullOrEmpty(month))
            query = query.Where(s => s.Month == month);

        var salaries = await query.OrderByDescending(s => s.Month).ToListAsync();

        if (format == "xlsx")
            return ExportToExcel(salaries, "Salaries");

        return ExportToCsv(salaries, "salaries");
    }

    [HttpGet("evaluations")]
    public async Task<IActionResult> ExportEvaluations([FromQuery] string format = "csv")
    {
        var evals = await _context.ManualEvaluations.AsNoTracking()
            .Include(e => e.Agent)
            .Include(e => e.Evaluator)
            .OrderByDescending(e => e.EvaluationDate)
            .ToListAsync();

        if (format == "xlsx")
            return ExportToExcel(evals, "Evaluations");

        return ExportToCsv(evals, "evaluations");
    }

    private IActionResult ExportToCsv<T>(IEnumerable<T> data, string fileName)
    {
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = ";",
            Encoding = Encoding.UTF8
        };

        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, config);

        csv.WriteRecords(data);
        writer.Flush();
        var bytes = memoryStream.ToArray();

        return File(bytes, "text/csv", $"{fileName}_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private IActionResult ExportToExcel<T>(IEnumerable<T> data, string sheetName)
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add(sheetName);
        worksheet.Cells.LoadFromCollection(data, true);

        var bytes = package.GetAsByteArray();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{sheetName}_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}
