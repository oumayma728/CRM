namespace Backend.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class RequirePermissionAttribute : Attribute
    {
        public string Permission { get; }
        public RequirePermissionAttribute(string permission)
        {
            Permission = permission;
        }
    }
}