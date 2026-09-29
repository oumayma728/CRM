using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Backend.Attributes;
using Microsoft.AspNetCore.Mvc.Formatters;

namespace Backend.Formatters;

internal static class SnakeCaseJson
{
    public static readonly JsonSerializerOptions Options = Create();

    private static JsonSerializerOptions Create()
    {
        var o = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DictionaryKeyPolicy = null,
            DefaultIgnoreCondition = JsonIgnoreCondition.Never,
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
        };
        o.Converters.Add(new JsonStringEnumConverter());
        return o;
    }

    public static bool Applies(HttpContext http) =>
        http.GetEndpoint()?.Metadata.GetMetadata<SnakeCaseJsonAttribute>() != null;
}

/// <summary>Writes snake_case JSON for endpoints marked with <see cref="SnakeCaseJsonAttribute"/>.</summary>
public sealed class SnakeCaseJsonOutputFormatter : SystemTextJsonOutputFormatter
{
    public SnakeCaseJsonOutputFormatter() : base(SnakeCaseJson.Options) { }

    public override bool CanWriteResult(OutputFormatterCanWriteContext context) =>
        SnakeCaseJson.Applies(context.HttpContext) && base.CanWriteResult(context);
}

/// <summary>
/// Reads JSON bodies whose keys may be snake_case or camelCase for endpoints marked with
/// <see cref="SnakeCaseJsonAttribute"/>. Underscores are removed from property names before
/// case-insensitive binding, so "agent_id", "agentId" and "AgentId" all bind to AgentId.
/// </summary>
public sealed class SnakeCaseJsonInputFormatter : TextInputFormatter
{
    private static readonly JsonSerializerOptions ReadOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString,
        Converters = { new JsonStringEnumConverter() },
    };

    public SnakeCaseJsonInputFormatter()
    {
        SupportedMediaTypes.Add("application/json");
        SupportedMediaTypes.Add("text/json");
        SupportedMediaTypes.Add("application/*+json");
        SupportedEncodings.Add(Encoding.UTF8);
        SupportedEncodings.Add(Encoding.Unicode);
    }

    public override bool CanRead(InputFormatterContext context) =>
        SnakeCaseJson.Applies(context.HttpContext) && base.CanRead(context);

    public override async Task<InputFormatterResult> ReadRequestBodyAsync(InputFormatterContext context, Encoding encoding)
    {
        using var reader = new StreamReader(context.HttpContext.Request.Body, encoding);
        var body = await reader.ReadToEndAsync();
        if (string.IsNullOrWhiteSpace(body))
            return context.TreatEmptyInputAsDefaultValue
                ? InputFormatterResult.Success(context.ModelType.IsValueType ? Activator.CreateInstance(context.ModelType) : null)
                : InputFormatterResult.NoValue();

        try
        {
            var node = JsonNode.Parse(body);
            var normalized = Normalize(node, context.ModelType);
            var model = normalized.Deserialize(context.ModelType, ReadOptions);
            return InputFormatterResult.Success(model);
        }
        catch (JsonException ex)
        {
            context.ModelState.TryAddModelError(string.IsNullOrEmpty(context.ModelName) ? "$" : context.ModelName, ex.Message);
            return InputFormatterResult.Failure();
        }
    }

    // Dictionaries and free-form JSON keep their keys untouched.
    private static bool IsOpaque(Type t) =>
        t == typeof(object) || t == typeof(JsonElement) || typeof(JsonNode).IsAssignableFrom(t) ||
        t.GetInterfaces().Append(t).Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IDictionary<,>));

    private static JsonNode? Normalize(JsonNode? node, Type type)
    {
        if (node is null || IsOpaque(type)) return node;
        var target = Nullable.GetUnderlyingType(type) ?? type;

        if (node is JsonArray arr)
        {
            var elem = target.IsArray ? target.GetElementType()!
                : target.IsGenericType ? target.GetGenericArguments()[0] : typeof(object);
            var copy = new JsonArray();
            foreach (var item in arr) copy.Add(Normalize(item?.DeepClone(), elem));
            return copy;
        }

        if (node is JsonObject obj)
        {
            var props = target.GetProperties().ToDictionary(p => p.Name.ToLowerInvariant(), p => p.PropertyType);
            var copy = new JsonObject();
            foreach (var (key, value) in obj)
            {
                var k = key.Replace("_", "");
                var childType = props.TryGetValue(k.ToLowerInvariant(), out var pt) ? pt : typeof(object);
                copy[k] = Normalize(value?.DeepClone(), childType);
            }
            return copy;
        }

        return node;
    }
}
