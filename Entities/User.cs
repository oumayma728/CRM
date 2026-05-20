using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("first_name")]  // ← ADD THIS
        public string FirstName { get; set; } = string.Empty;

        [Column("last_name")]   // ← ADD THIS
        public string LastName { get; set; } = string.Empty;

        [Column("email")]       // ← ADD THIS
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Column("type_contrat")]
        public string? TypeContrat { get; set; }
        [Column("PasswordHash")]  // ← ADD THIS
        public string PasswordHash { get; set; } = string.Empty;

        [Column("role_id")]     // ← Already has
        public int RoleId { get; set; }

        [Column("avatar")]      // ← ADD THIS
        public string? Avatar { get; set; }

        [Column("phone")]       // ← ADD THIS
        public string? Phone { get; set; }

        [Column("is_active")]   // ← ADD THIS
        public bool IsActive { get; set; } = true;
        [Column("is_online")]   // ← ADD THIS
        public bool IsOnline { get; set; } = true;
        [Column("is_deleted")]  // ← ADD THIS
        public bool IsDeleted { get; set; } = false;

        [Column("refresh_token")]  // ← ADD THIS
        public string? RefreshToken { get; set; }

        [Column("refresh_token_expiry_time")]  // ← ADD THIS
        public DateTime? RefreshTokenExpiryTime { get; set; }

        [Column("created_at")]   // ← ADD THIS
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]   // ← ADD THIS
        public DateTime? UpdatedAt { get; set; }

        [Column("last_login_at")]  // ← ADD THIS
        public DateTime? LastLoginAt { get; set; }

        [ForeignKey("RoleId")]
        public Role Role { get; set; } = null!;
    }
}