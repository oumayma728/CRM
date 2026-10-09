using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

[Table("messages")]
public class Message
{
    [Key]
    public int Id { get; set; }
    public long SenderId { get; set; }
    public long ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public bool IsUrgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    [ForeignKey("SenderId")]
    public User Sender { get; set; } = null!;

    [ForeignKey("ReceiverId")]
    public User Receiver { get; set; } = null!;
}