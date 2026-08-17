using CrmApi.DTOs.Ai;
using CrmApi.Helpers;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Text.Json;

namespace CrmApi.Services.Ai;

public interface ITranscriptionService
{
    Task<TranscriptionResultDto> TranscribeAsync(string audioFilePath, CancellationToken ct = default);
}

public class TranscriptionService : ITranscriptionService
{
    private readonly ILogger<TranscriptionService> _logger;
    private readonly WhisperSettings _settings;

    public TranscriptionService(ILogger<TranscriptionService> logger, IOptions<WhisperSettings> settings)
    {
        _logger = logger;
        _settings = settings.Value;
    }

    public async Task<TranscriptionResultDto> TranscribeAsync(string audioFilePath, CancellationToken ct = default)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("Whisper transcription disabled by configuration");
            return new TranscriptionResultDto { Success = false, Error = "Whisper disabled in configuration" };
        }

        if (!File.Exists(audioFilePath))
        {
            _logger.LogWarning("Audio file not found: {AudioPath}", audioFilePath);
            return new TranscriptionResultDto { Success = false, Error = "Audio file not found" };
        }

        var scriptPath = ResolveScriptPath();
        if (!File.Exists(scriptPath))
        {
            _logger.LogWarning("Whisper script not found: {ScriptPath}", scriptPath);
            return new TranscriptionResultDto { Success = false, Error = "Whisper script not found" };
        }

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = _settings.PythonPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            psi.ArgumentList.Add(scriptPath);
            psi.ArgumentList.Add(audioFilePath);
            psi.ArgumentList.Add("--model");
            psi.ArgumentList.Add(_settings.Model);
            psi.ArgumentList.Add("--language");
            psi.ArgumentList.Add(_settings.Language);
            psi.ArgumentList.Add("--device");
            psi.ArgumentList.Add(_settings.Device);

            using var process = new Process { StartInfo = psi };
            if (!process.Start())
            {
                _logger.LogError("Failed to start Python process: {PythonPath}", _settings.PythonPath);
                return new TranscriptionResultDto { Success = false, Error = "Failed to start Python process" };
            }

            var stdoutTask = process.StandardOutput.ReadToEndAsync(ct);
            var stderrTask = process.StandardError.ReadToEndAsync(ct);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(_settings.TimeoutSeconds));

            try
            {
                await process.WaitForExitAsync(cts.Token);
            }
            catch (OperationCanceledException)
            {
                try { process.Kill(entireProcessTree: true); } catch { /* already exited */ }
                _logger.LogWarning("Whisper transcription timed out after {Timeout}s", _settings.TimeoutSeconds);
                return new TranscriptionResultDto { Success = false, Error = "Transcription timed out" };
            }

            var stdout = await stdoutTask;
            var stderr = await stderrTask;

            if (process.ExitCode != 0)
            {
                _logger.LogError("Whisper script failed (exit {ExitCode}): {Error}", process.ExitCode, stderr);
                return new TranscriptionResultDto { Success = false, Error = stderr };
            }

            var parsed = JsonSerializer.Deserialize<TranscriptionResultDto>(stdout, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (parsed == null || !parsed.Success)
            {
                _logger.LogError("Whisper script returned invalid result: {Output}", stdout);
                return new TranscriptionResultDto { Success = false, Error = parsed?.Error ?? "Invalid transcription result" };
            }

            return parsed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Whisper transcription failed");
            return new TranscriptionResultDto { Success = false, Error = ex.Message };
        }
    }

    private string ResolveScriptPath()
    {
        var candidates = new[]
        {
            Path.IsPathRooted(_settings.ScriptPath)
                ? _settings.ScriptPath
                : Path.Combine(Directory.GetCurrentDirectory(), _settings.ScriptPath),
            Path.Combine(AppContext.BaseDirectory, _settings.ScriptPath)
        };
        return candidates.FirstOrDefault(File.Exists) ?? candidates[0];
    }
}
