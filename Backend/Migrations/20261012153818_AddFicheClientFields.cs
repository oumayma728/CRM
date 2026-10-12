using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFicheClientFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Civilite",
                table: "Contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EstProprietaire",
                table: "Contacts",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FactureElectricite",
                table: "Contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FournisseurEnergie",
                table: "Contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ProjetDemenagement",
                table: "Contacts",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Surface15m2",
                table: "Contacts",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TravauxEnCours",
                table: "Contacts",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Civilite",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "EstProprietaire",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "FactureElectricite",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "FournisseurEnergie",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "ProjetDemenagement",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "Surface15m2",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "TravauxEnCours",
                table: "Contacts");
        }
    }
}
