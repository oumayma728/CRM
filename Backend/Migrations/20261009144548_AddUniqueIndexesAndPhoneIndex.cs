using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexesAndPhoneIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Note: EF also wanted to drop the plain index IX_AdvancedAttendances_UserId (redundant now that a unique
            // index covers UserId). Removed on purpose: this migration only CREATES indexes (nothing is dropped, no column
            // is touched). The redundant index can be dropped later in a separate, deliberate migration.
            migrationBuilder.CreateIndex(
                name: "UX_Utilisateur_Email",
                table: "Utilisateur",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_Telephone",
                table: "Contacts",
                column: "Telephone");

            migrationBuilder.CreateIndex(
                name: "UX_AdvancedAttendance_UnOuvertParJour",
                table: "AdvancedAttendances",
                column: "UserId",
                unique: true,
                filter: "\"Status\" IN ('active', 'break')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Utilisateur_Email",
                table: "Utilisateur");

            migrationBuilder.DropIndex(
                name: "IX_Contacts_Telephone",
                table: "Contacts");

            migrationBuilder.DropIndex(
                name: "UX_AdvancedAttendance_UnOuvertParJour",
                table: "AdvancedAttendances");
        }
    }
}
