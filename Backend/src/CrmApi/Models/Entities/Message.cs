using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

[Table("messages")]
public class Message
{
    [Key]
    public int Id { get; set; }
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public bool IsUrgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    [ForeignKey("SenderId")]
    [InverseProperty(nameof(User.SentMessages))]
    public User Sender { get; set; } = null!;

    [ForeignKey("ReceiverId")]
    [InverseProperty(nameof(User.ReceivedMessages))]
    public User Receiver { get; set; } = null!;
}