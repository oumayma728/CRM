using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("permissions")]
    public class Permission
    {
        [Key]
        public int Id { get; set; }
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;   // e.g. "Files.View", "Files.Inject"
        [MaxLength(50)]
        public string GroupName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ✅ Navigation property - A permission can be in many RolePermissions
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
        public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
    }
}