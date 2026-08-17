using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities
{
	[Table("Client")]
	public class Client
	{
		[Key]
		public int Id { get; set; }
		public string Code { get; set; } = "";
		public string Nom { get; set; } = "";
		public string? Email { get; set; } = "";
		public string? Telephone { get; set; } = "";
		public string? Adresse { get; set; } = "";
		public bool IsActive { get; set; } = true;

	}
}