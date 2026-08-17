using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("RolePermissions")]
    public class RolePermission
    {
        [Key]
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int PermissionId { get; set; }

        [ForeignKey("PermissionId")]
        public Permission Permission { get; set; } = null!;
        public string Role { get; set; } = string.Empty;
    }
}