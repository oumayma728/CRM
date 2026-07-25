using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using Backend.Data;
using Backend.Entities;
using System.Globalization;
using System.Text;

namespace Backend.Controllers;

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
    public async Task<IActionResult> ExportCalls([FromQuery] string format = "csv", [FromQuery] long? agentId = null)
    {
        var query = _context.Appels.AsNoTracking().Include(a => a.Agent).Include(a => a.Contact).AsQueryable();
        if (agentId.HasValue)
            query = query.Where(a => a.AgentId == agentId.Value);

        var calls = await query.OrderByDescending(a => a.DateHeure).ToListAsync();
        return format == "xlsx" ? ExportToExcel(calls, "Appels") : ExportToCsv(calls, "appels");
    }

    [HttpGet("evaluations")]
    public async Task<IActionResult> ExportEvaluations([FromQuery] string format = "csv")
    {
        var evals = await _context.ManualEvaluations.AsNoTracking()
            .Include(e => e.Agent)
            .Include(e => e.Evaluator)
            .OrderByDescending(e => e.EvaluationDate)
            .ToListAsync();
        return format == "xlsx" ? ExportToExcel(evals, "Evaluations") : ExportToCsv(evals, "evaluations");
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> ExportAttendance([FromQuery] string format = "csv", [FromQuery] string? month = null)
    {
        var query = _context.AdvancedAttendances.AsNoTracking().Include(a => a.User).AsQueryable();
        if (!string.IsNullOrEmpty(month) && DateTime.TryParse(month + "-01", out var parsed))
            query = query.Where(a => a.Date.Year == parsed.Year && a.Date.Month == parsed.Month);

        var records = await query.OrderByDescending(a => a.Date).ToListAsync();
        return format == "xlsx" ? ExportToExcel(records, "Presence") : ExportToCsv(records, "presence");
    }

    [HttpGet("salaries")]
    public async Task<IActionResult> ExportSalaries([FromQuery] string format = "csv", [FromQuery] string? month = null)
    {
        var query = _context.SalairesAgents.AsNoTracking().Include(s => s.Agent).AsQueryable();
        if (!string.IsNullOrEmpty(month))
            query = query.Where(s => s.Month == month);

        var salaries = await query.OrderByDescending(s => s.Month).ToListAsync();
        return format == "xlsx" ? ExportToExcel(salaries, "Salaires") : ExportToCsv(salaries, "salaires");
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
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"{sheetName}_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}
