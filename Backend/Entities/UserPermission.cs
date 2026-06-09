using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities
{
    [Table("user_permissions")]
    public class UserPermission
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Column("permission_id")]
        public int PermissionId { get; set; }
        public Permission Permission { get; set; } = null!;

        [Column("scope_type")]
        [MaxLength(50)]
        public string? ScopeType { get; set; }

        [Column("scope_user_id")]
        public int? ScopeUserId { get; set; }
        public User? ScopeUser { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
