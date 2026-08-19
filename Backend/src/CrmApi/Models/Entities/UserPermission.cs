using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
    [Table("user_permissions")]
    public class UserPermission
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set; }
        // FK can reference utilisateurs or users table
        public int PermissionId { get; set; }
        public Permission Permission { get; set; } = null!;
        [MaxLength(50)]
        public string? ScopeType { get; set; }
        public int? ScopeUserId { get; set; }
        // ScopeUser FK
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}